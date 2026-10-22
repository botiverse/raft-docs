// Give every h2-h6 heading of a raft-docs Chinese page the English page's anchor: `## 中文标题 {#english-id}`.
// Needs a build of the English site in out/ (pnpm build). usage: node scripts/zh-cn/anchors.mjs [--root dir] <slug>...
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
let root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const ri = args.indexOf("--root");
if (ri >= 0) { root = args[ri + 1]; args.splice(ri, 2); }
let failed = 0;
for (const raw of args) {
  const slug = raw.replace(/^content\/(zh-cn\/)?/, "").replace(/\/?index\.md$/, "").replace(/\/$/, "");
  const htmlFile = path.join(root, "out", slug, "index.html");
  if (fs.statSync(htmlFile).mtimeMs < fs.statSync(path.join(root, "content", slug, "index.md")).mtimeMs) {
    console.error(`${slug}: out/ is older than the English page; run pnpm build first`);
    failed++;
    continue;
  }
  const html = fs.readFileSync(htmlFile, "utf8");
  const doc = html.slice(html.indexOf('class="vp-doc'));
  const ids = [...doc.matchAll(/<h([1-6])[^>]*\sid="([^"]+)"/g)].map((m) => ({ depth: +m[1], id: decodeURIComponent(m[2]) }));
  const file = path.join(root, "content", "zh-cn", slug, "index.md");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let inFence = null, fmDone = lines[0] !== "---", k = 0;
  const heads = [];
  for (let i = fmDone ? 0 : 1; i < lines.length; i++) {
    const l = lines[i];
    if (!fmDone) { if (l === "---") fmDone = true; continue; }
    const f = l.match(/^\s*(`{3,}|~{3,})/);
    if (f) { if (!inFence) inFence = f[1]; else if (f[1][0] === inFence[0] && f[1].length >= inFence.length && !l.trim().slice(f[1].length).trim()) inFence = null; continue; }
    if (inFence) continue;
    const h = l.match(/^(#{1,6})\s+(.*?)\s*(\{#[^}]+\})?\s*$/);
    if (h) heads.push({ i, depth: h[1].length, text: h[2] });
  }
  if (heads.length !== ids.length || heads.some((h, j) => h.depth !== ids[j].depth)) {
    console.error(`${slug}: headings ${heads.map((h) => h.depth).join(",")} != English ${ids.map((x) => x.depth).join(",")}; not changed`);
    failed++;
    continue;
  }
  heads.forEach((h, j) => { if (h.depth > 1) lines[h.i] = `${"#".repeat(h.depth)} ${h.text} {#${ids[j].id}}`; k++; });
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`${slug}: ${heads.length - heads.filter((h) => h.depth === 1).length} anchors`);
}
process.exit(failed ? 1 : 0);
