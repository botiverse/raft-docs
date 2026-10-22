// Validate raft-docs Chinese pages against their English source.
// usage: node scripts/zh-cn/check.mjs [--root <dir>] [--strict-anchors] [slug ...]   (slug = path under content/, e.g. features/messaging/threads)
// Errors fail (exit 1); warnings are printed. With no slug, every English page is checked.
import fs from "node:fs";
import path from "node:path";
import { parse, readable, CJK, hanCount } from "./md.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (n) => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
const root = opt("--root", path.resolve(path.dirname(new URL(import.meta.url).pathname), "../.."));
const strictAnchors = flag("--strict-anchors");
const quiet = flag("--quiet");
const content = path.join(root, "content");

function englishSlugs() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "zh-cn" || e.name === "public" || e.name.startsWith(".")) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.md") out.push(path.relative(content, dir).split(path.sep).join("/"));
    }
  };
  walk(content);
  return out.sort();
}

const slugs = args.length ? args.map((s) => s.replace(/^content\/(zh-cn\/)?/, "").replace(/\/?index\.md$/, "").replace(/\/$/, "")) : englishSlugs();

// English anchor ids, from the build (out/<slug>/index.html), in heading order.
function builtIds(slug) {
  const html = path.join(root, "out", slug, "index.html");
  if (!fs.existsSync(html)) return null;
  const s = fs.readFileSync(html, "utf8");
  const doc = s.slice(s.indexOf('class="vp-doc'));
  return [...doc.matchAll(/<h([1-6])[^>]*\sid="([^"]+)"/g)].map((m) => ({ depth: +m[1], id: decodeURIComponent(m[2]) }));
}

const BANNED = [
  [/线程/, "thread is 消息列 in the app"],
  [/智能体|代理人/, "Agent stays Latin"],
  [/您/, "use 你"],
  [/……|\.\.\./, "ellipsis is a single …"],
  [/[“”]/, "quote with 「」"],
];
// Lowercase or plural agent in Chinese prose (a Latin neighbour on both sides means an English quote).
const AGENT_LOWER = /(^|[^A-Za-z`'"-])(agents?|Agents)(?![A-Za-z-])/g;

// Code must stay verbatim; only comments (# … in shell/YAML/Python, // … in C-like languages) may be translated.
const HASH = /^(bash|sh|shell|zsh|console|yaml|yml|toml|python|py|ini|dotenv|env|conf)\b/;
const SLASH = /^(js|javascript|ts|typescript|tsx|jsx|mjs|cjs|json5|jsonc|go|rust|rs|swift|kotlin|kt|java|c|cpp|css|scss)\b/;
function stripComments(text, info) {
  let t = text.replace(/\s+$/gm, "");
  if (HASH.test(info)) t = t.replace(/(^|\s)#(?![!{]).*$/gm, "$1#");
  if (SLASH.test(info)) t = t.replace(/(^|\s)\/\/.*$/gm, "$1//").replace(/\/\*[\s\S]*?\*\//g, "/**/");
  return t.replace(/\s+$/gm, "").replace(/(\s*(#|\/\/)\n)+/g, "\n");
}

let errors = 0;
let warnings = 0;
const report = [];
for (const slug of slugs) {
  const enFile = path.join(content, slug, "index.md");
  const zhFile = path.join(content, "zh-cn", slug, "index.md");
  const e = [];
  const w = [];
  if (!fs.existsSync(zhFile)) { report.push({ slug, e: ["missing translation"], w: [] }); errors++; continue; }
  const en = parse(fs.readFileSync(enFile, "utf8"));
  const zh = parse(fs.readFileSync(zhFile, "utf8"));

  // Front matter
  for (const k of Object.keys(en.fm)) if (!(k in zh.fm)) e.push(`front matter: no ${k}`);
  for (const k of Object.keys(zh.fm)) if (!(k in en.fm)) w.push(`front matter: extra ${k}`);
  if (en.fm.llms_section && zh.fm.llms_section !== `${en.fm.llms_section} zh-CN`) e.push(`llms_section should be "${en.fm.llms_section} zh-CN", is "${zh.fm.llms_section}"`);
  if (en.fm.llms_order && +zh.fm.llms_order !== +en.fm.llms_order + 1000) e.push(`llms_order should be ${+en.fm.llms_order + 1000}, is ${zh.fm.llms_order}`);
  for (const k of ["llms_summary", "title", "description"]) if (zh.fm[k] && en.fm[k] && hanCount(zh.fm[k]) === 0) e.push(`front matter ${k} is not translated`);

  // Headings
  const shapeEn = en.headings.map((h) => h.depth).join(",");
  const shapeZh = zh.headings.map((h) => h.depth).join(",");
  if (shapeEn !== shapeZh) e.push(`headings ${shapeZh} != English ${shapeEn}`);
  else {
    const ids = builtIds(slug);
    zh.headings.forEach((h, i) => {
      if (h.depth === 1) return;
      const want = ids?.filter((x) => x.depth > 1 || true)[i]?.id;
      if (!h.id) (strictAnchors ? e : w).push(`L${h.line} heading "${h.text}" has no {#id}`);
      else if (ids && ids[i] && h.id !== ids[i].id) e.push(`L${h.line} heading anchor #${h.id}, English #${ids[i].id}`);
    });
  }

  // Code fences: verbatim
  if (en.fences.length !== zh.fences.length) e.push(`${zh.fences.length} code blocks, English ${en.fences.length}`);
  else en.fences.forEach((f, i) => {
    const z = zh.fences[i];
    if (f.info !== z.info) e.push(`L${z.line} code block info "${z.info}" != "${f.info}"`);
    if (stripComments(f.text, f.info) !== stripComments(z.text, z.info)) e.push(`L${z.line} code block differs from English L${f.line} (only comments may be translated)`);
  });

  // Containers
  const cEn = en.containers.map((c) => c.type).join(" ");
  const cZh = zh.containers.map((c) => c.type).join(" ");
  if (cEn !== cZh) e.push(`containers [${cZh}] != English [${cEn}]`);
  else en.containers.forEach((c, i) => {
    const z = zh.containers[i];
    if (c.type === "==tab" && c.title !== z.title && !CJK.test(z.title)) w.push(`L${z.line} tab "${z.title}" != "${c.title}"`);
    if (c.title && c.type !== "==tab" && !z.title) e.push(`L${z.line} ::: ${c.type} lost its title "${c.title}"`);
    if (c.title && z.title && c.type !== "==tab" && hanCount(z.title) === 0 && /[a-z]{3,}\s+[a-z]{3,}/i.test(z.title)) w.push(`L${z.line} ::: ${c.type} title not translated: "${z.title}"`);
  });

  // Tables
  if (en.tables.length !== zh.tables.length) e.push(`${zh.tables.length} tables, English ${en.tables.length}`);
  else en.tables.forEach((t, i) => {
    const z = zh.tables[i];
    if (t.rows !== z.rows || t.cols !== z.cols) e.push(`L${z.line} table ${z.rows}x${z.cols}, English ${t.rows}x${t.cols}`);
  });

  // Links and images
  const enDir = path.join(content, slug);
  const zhDir = path.join(content, "zh-cn", slug);
  const mapEnLink = (url) => {
    if (/^(https?:|mailto:)/.test(url)) return url;
    if (url.startsWith("#")) return url;
    if (url.startsWith("/")) return url === "/llms.txt" || url.startsWith("/zh-cn/") ? url : `/zh-cn${url}`;
    const abs = path.resolve(enDir, url.split("#")[0]);
    return "file:" + abs + (url.includes("#") ? "#" + url.split("#")[1] : "");
  };
  const normZhLink = (url) => {
    if (/^(https?:|mailto:|#|\/)/.test(url)) return url;
    const abs = path.resolve(zhDir, url.split("#")[0]);
    return "file:" + abs + (url.includes("#") ? "#" + url.split("#")[1] : "");
  };
  const ms = (xs) => xs.slice().sort();
  const enLinks = ms(en.links.map((l) => mapEnLink(l.url)));
  const zhLinks = ms(zh.links.map((l) => normZhLink(l.url)));
  const missing = enLinks.filter((u) => { const i = zhLinks.indexOf(u); if (i >= 0) { zhLinks.splice(i, 1); return false; } return true; });
  const llmsOk = (u) => u === "/llms.txt" || u === "/zh-cn/llms.txt";
  for (const u of missing) if (!(llmsOk(u) && zhLinks.some(llmsOk))) e.push(`link missing or changed: ${u.replace("file:" + content, "content")}`);
  for (const u of zhLinks) if (!llmsOk(u) || !missing.some(llmsOk)) e.push(`extra link: ${u.replace("file:" + content, "content")}`);
  const enImgs = ms(en.images.map((l) => mapEnLink(l.url)));
  const zhImgs = ms(zh.images.map((l) => normZhLink(l.url)));
  if (enImgs.join("|") !== zhImgs.join("|")) e.push(`images differ: ${zhImgs.filter((x) => !enImgs.includes(x)).map((x) => x.replace("file:" + content, "content")).join(", ") || "(missing) " + enImgs.filter((x) => !zhImgs.includes(x)).map((x) => x.replace("file:" + content, "content")).join(", ")}`);
  for (const img of zh.images) {
    if (/^https?:/.test(img.url)) continue;
    const abs = img.url.startsWith("/") ? path.join(content, "public", img.url) : path.resolve(zhDir, img.url);
    if (!fs.existsSync(abs)) e.push(`L${img.line} image not found: ${img.url}`);
  }

  // Inline code: same multiset (warning)
  const icEn = ms(en.inlineCode);
  const icZh = ms(zh.inlineCode);
  const icMissing = icEn.filter((c) => { const i = icZh.indexOf(c); if (i >= 0) { icZh.splice(i, 1); return false; } return true; });
  if (icMissing.length) w.push(`inline code missing: ${[...new Set(icMissing)].slice(0, 6).map((c) => "`" + c + "`").join(" ")}`);
  if (icZh.length) w.push(`inline code added: ${[...new Set(icZh)].slice(0, 6).map((c) => "`" + c + "`").join(" ")}`);

  // Typography and terms, prose only
  let latinWords = 0;
  let han = 0;
  for (const p of zh.prose) {
    const t = readable(p.text);
    han += hanCount(t);
    latinWords += (t.match(/[A-Za-z][A-Za-z'-]{2,}/g) || []).length;
    const lit = t.replace(/\{[^{}]*\}/g, "");
    for (let i = 0; i < lit.length - 1; i++) {
      const a = lit[i], b = lit[i + 1];
      if ((CJK.test(a) && /[A-Za-z0-9]/.test(b)) || (/[A-Za-z0-9]/.test(a) && CJK.test(b))) { e.push(`L${p.line} no space between "${a}" and "${b}": ${lit.slice(Math.max(0, i - 8), i + 9)}`); break; }
    }
    if (/[一-鿿][,;:?!](?=\s|$)|[一-鿿]\.(?=\s|$)/.test(lit)) e.push(`L${p.line} half-width punctuation after Chinese: ${lit.match(/.{0,8}[一-鿿][,.;:?!](?=\s|$)/)?.[0]}`);
    // CommonMark only opens ** before punctuation when whitespace or punctuation precedes it, and only
    // closes ** after punctuation when whitespace or punctuation follows: "**完成。**如果" stays literal.
    const raw = p.text.replace(/`[^`]*`/g, "`x`").replace(/^(\s*)\*\s/, "$1- ");
    const runs = [...raw.matchAll(/(?<!\*)\*{1,3}(?!\*)/g)];
    const P = /[\p{P}\p{S}]/u, WS = /\s/;
    runs.forEach((m, k) => {
      const at = m.index;
      const prev = raw[at - 1] ?? " ", next = raw[at + m[0].length] ?? " ";
      const opener = k % 2 === 0;
      const bad = opener ? P.test(next) && !(WS.test(prev) || P.test(prev)) : P.test(prev) && !(WS.test(next) || P.test(next));
      if (bad) e.push(`L${p.line} emphasis won't render (${m[0]} ${opener ? "opens before" : "closes after"} punctuation next to a letter): …${raw.slice(Math.max(0, at - 10), at + 12)}… — move the punctuation outside, or put a space on the other side`);
    });
    for (const [re, why] of BANNED) if (re.test(lit)) e.push(`L${p.line} ${why}: ${lit.match(new RegExp(".{0,8}" + re.source + ".{0,8}"))?.[0]}`);
    for (const m of lit.matchAll(AGENT_LOWER)) {
      const before = lit.slice(0, m.index + m[1].length).trimEnd().slice(-1);
      const after = lit.slice(m.index + m[0].length).trimStart().slice(0, 1);
      const latinBoth = /[A-Za-z]/.test(before) && /[A-Za-z]/.test(after);
      if (!latinBoth && (CJK.test(before) || CJK.test(after) || /[，。、：；（）「」]/.test(before + after) || !before || !after)) e.push(`L${p.line} write "Agent" (capitalised, no plural) in Chinese prose: …${lit.slice(Math.max(0, m.index - 6), m.index + m[0].length + 6)}…`);
    }
  }
  const density = han ? (latinWords / han) * 100 : 0;
  if (density > 6) w.push(`Latin words per 100 Han: ${density.toFixed(1)} (mixed-language prose?)`);
  if (e.length || w.length) report.push({ slug, e, w });
  errors += e.length;
  warnings += w.length;
}
for (const r of report) {
  if (quiet && !r.e.length) continue;
  console.log(`== ${r.slug}`);
  for (const x of r.e) console.log(`  error: ${x}`);
  if (!quiet) for (const x of r.w) console.log(`  warn:  ${x}`);
}
console.log(`${slugs.length} pages, ${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
