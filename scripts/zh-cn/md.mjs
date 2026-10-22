// Structure of a docs Markdown page, for comparing a translation with its English source.
import fs from "node:fs";
import path from "node:path";

export const CJK = /[一-鿿㐀-䶿]/;
const CJK_G = /[一-鿿㐀-䶿]/g;

export function splitFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { fm: {}, fmRaw: "", body: src, bodyStart: 0 };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { fm, fmRaw: m[1], body: src.slice(m[0].length), bodyStart: m[0].split("\n").length - 1 };
}

/** Parse body lines into blocks: fences (verbatim), headings, containers, tables, prose lines. */
export function parse(src) {
  const { fm, body, bodyStart } = splitFrontMatter(src.replace(/\r\n/g, "\n"));
  const lines = body.split("\n");
  const out = { fm, headings: [], fences: [], containers: [], tables: [], prose: [], links: [], images: [], inlineCode: [], html: [] };
  let fence = null;
  let table = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1 + bodyStart;
    const fenceOpen = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (fenceOpen && fenceOpen[2][0] === fence.marker[0] && fenceOpen[2].length >= fence.marker.length && !fenceOpen[3].trim()) {
        out.fences.push({ info: fence.info, text: fence.lines.join("\n"), line: fence.line });
        fence = null;
      } else fence.lines.push(line);
      continue;
    }
    if (fenceOpen) {
      fence = { marker: fenceOpen[2], info: fenceOpen[3].trim(), lines: [], line: lineNo };
      if (table) { out.tables.push(table); table = null; }
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).length;
      if (!table) table = { line: lineNo, rows: 0, cols: cells };
      table.rows++;
      table.cols = Math.max(table.cols, cells);
      out.prose.push({ text: line, line: lineNo });
      scanInline(line, lineNo, out);
      continue;
    } else if (table) { out.tables.push(table); table = null; }
    const h = line.match(/^(#{1,6})\s+(.*?)\s*(\{#([^}]+)\})?\s*$/);
    if (h) {
      out.headings.push({ depth: h[1].length, text: h[2], id: h[4] ?? null, line: lineNo });
      out.prose.push({ text: h[2], line: lineNo });
      scanInline(h[2], lineNo, out);
      continue;
    }
    const c = line.match(/^\s*(:{3,})\s*(\S*)\s*(.*)$/);
    if (c) {
      out.containers.push({ type: c[2] || "/", title: c[3], line: lineNo });
      if (c[3]) { out.prose.push({ text: c[3], line: lineNo }); }
      continue;
    }
    const tab = line.match(/^==\s+(.*)$/);
    if (tab) { out.containers.push({ type: "==tab", title: tab[1], line: lineNo }); continue; }
    if (line.trim()) {
      out.prose.push({ text: line, line: lineNo });
      scanInline(line, lineNo, out);
    }
  }
  if (table) out.tables.push(table);
  return out;
}

function scanInline(text, line, out) {
  for (const m of text.matchAll(/`([^`]+)`/g)) out.inlineCode.push(m[1]);
  const noCode = text.replace(/`[^`]*`/g, "");
  for (const m of noCode.matchAll(/(!?)\[((?:[^\]\[]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    (m[1] ? out.images : out.links).push({ text: m[2], url: m[3], line });
  }
  for (const m of noCode.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)) out.images.push({ text: "", url: m[1], line });
  for (const m of noCode.matchAll(/<a[^>]*\shref="([^"]+)"/g)) out.links.push({ text: "", url: m[1], line });
  for (const m of noCode.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) out.html.push(m[1]);
}

/** Prose with code, links' URLs, HTML and anchors removed: what a reader reads. */
export function readable(text) {
  return text
    .replace(/`[^`]*`/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{#[^}]*\}/g, "")
    .replace(/https?:\/\/\S+/g, " ");
}

export function hanCount(s) { return (s.match(CJK_G) || []).length; }

export function read(file) { return fs.readFileSync(file, "utf8"); }
export function exists(file) { return fs.existsSync(file); }
export { path };
