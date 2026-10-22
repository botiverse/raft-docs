#!/usr/bin/env node
// Regenerate the app screenshots under content/ from a running Raft dev
// environment seeded with the docs fixture. See README.md in this folder.
//
//   node scripts/screenshots/capture.mjs [--only <pattern>] [--list]
//        [--base-url <url>] [--email <email>] [--password <password>]
//
// Every shot in shots.json is a scene: a starting page, the interactions that
// reach the scene, and an optional crop. Output PNGs overwrite the files in
// place, at the pixel size the shot asks for.
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const contentDir = join(repoRoot, "content");

function parseArgs(argv) {
  const opts = {
    baseUrl: process.env.RAFT_BASE_URL ?? "http://localhost:15220",
    email: process.env.RAFT_EMAIL ?? "alex@example.com",
    password: process.env.RAFT_PASSWORD ?? "password123",
    only: process.env.RAFT_SHOTS ?? "",
    list: false,
    headed: false,
    manifest: join(here, "shots.json"),
    outDir: contentDir,
    stageCmd: process.env.RAFT_STAGE_CMD ?? "",
    // The fixture writes times relative to when it ran; freeze every page's
    // clock at one instant so "5 min ago" labels don't drift between scenes.
    clock: process.env.RAFT_CAPTURE_CLOCK ?? new Date().toISOString(),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--base-url") opts.baseUrl = next();
    else if (a === "--email") opts.email = next();
    else if (a === "--password") opts.password = next();
    else if (a === "--only") opts.only = next();
    else if (a === "--manifest") opts.manifest = resolve(next());
    else if (a === "--out-dir") opts.outDir = resolve(next());
    else if (a === "--stage-cmd") opts.stageCmd = next();
    else if (a === "--clock") opts.clock = next();
    else if (a === "--list") opts.list = true;
    else if (a === "--headed") opts.headed = true;
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node scripts/screenshots/capture.mjs [--only <substring,...>] [--list] [--out-dir DIR] [--stage-cmd CMD] [--clock ISO] [--base-url URL] [--email E] [--password P]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${a}`);
  }
  opts.baseUrl = opts.baseUrl.replace(/\/$/, "");
  if (Number.isNaN(new Date(opts.clock).getTime())) throw new Error(`--clock: not a date: ${opts.clock}`);
  return opts;
}

// Dev-only chrome that raftdev mounts: react-scan (left edge tab), react-grab
// (right edge tab) and the raftdev debug gear (bottom right). Plus: no caret,
// no animations, so repeated runs produce the same pixels.
const HIDE_CSS = `
#react-scan-root, [data-react-grab], [data-testid="raftdev-debug-overlay"] { display: none !important; }
*, *::before, *::after { caret-color: transparent !important; transition-duration: 0s !important; transition-delay: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important; }
`;

async function hideDevChrome(page) {
  await page.evaluate((css) => {
    document.documentElement.dataset.raftDevToolsHidden = "true";
    window.dispatchEvent(new Event("raft:hide-local-dev-tools"));
    if (document.getElementById("docs-screenshot-css")) return;
    const style = document.createElement("style");
    style.id = "docs-screenshot-css";
    style.textContent = css;
    document.head.appendChild(style);
  }, HIDE_CSS).catch(() => {});
}

async function settle(page, ms = 600) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await hideDevChrome(page);
  await page.waitForTimeout(ms);
}

function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

function locate(page, step, vars) {
  const target = fill(step.target ?? step.selector, vars);
  let loc = page.locator(target);
  if (step.has) loc = loc.filter({ hasText: fill(step.has, vars) });
  if (typeof step.nth === "number") loc = loc.nth(step.nth);
  else loc = loc.first();
  return loc;
}

async function runStep(page, step, vars) {
  const timeout = step.timeout ?? 10_000;
  switch (step.do) {
    case "goto":
      await page.goto(vars.baseUrl + fill(step.path, vars), { waitUntil: "domcontentloaded" });
      await settle(page, step.wait ?? 1200);
      return;
    case "click":
    case "dblclick":
    case "rightclick":
    case "tripleclick":
    case "hover": {
      const loc = locate(page, step, vars);
      await loc.waitFor({ state: "visible", timeout });
      if (step.do === "hover") await loc.hover({ position: step.position });
      else if (step.do === "tripleclick") await loc.click({ clickCount: 3 });
      else if (step.do === "rightclick") await loc.click({ button: "right", position: step.position });
      else if (step.do === "dblclick") await loc.dblclick();
      else await loc.click({ position: step.position });
      break;
    }
    case "fill": {
      const loc = locate(page, step, vars);
      await loc.waitFor({ state: "visible", timeout });
      await loc.fill(fill(step.value, vars));
      break;
    }
    case "type": {
      const loc = locate(page, step, vars);
      await loc.waitFor({ state: "visible", timeout });
      await loc.click();
      await page.keyboard.type(fill(step.value, vars), { delay: 10 });
      break;
    }
    case "press":
      await page.keyboard.press(step.key);
      break;
    case "waitFor": {
      const loc = locate(page, step, vars);
      await loc.waitFor({ state: step.state ?? "visible", timeout });
      break;
    }
    case "mouse":
      await page.mouse.move(step.x, step.y);
      break;
    case "scroll": {
      const loc = locate(page, step, vars);
      await loc.evaluate((el, top) => { el.scrollTop = top === "bottom" ? el.scrollHeight : top; }, step.top ?? "bottom");
      break;
    }
    case "eval":
      await page.evaluate(step.js);
      break;
    case "wait":
      await page.waitForTimeout(step.ms ?? 500);
      return;
    default:
      throw new Error(`Unknown step: ${JSON.stringify(step)}`);
  }
  await settle(page, step.wait ?? 400);
}

async function clipFor(page, clip, vars) {
  if (!clip) return undefined;
  if (clip.selector) {
    const loc = page.locator(fill(clip.selector, vars)).first();
    await loc.waitFor({ state: "visible", timeout: 10_000 });
    const box = await loc.boundingBox();
    if (!box) throw new Error(`clip selector has no box: ${clip.selector}`);
    const pad = clip.pad ?? 0;
    const vp = page.viewportSize();
    let x = Math.max(0, box.x - pad);
    let y = Math.max(0, box.y - pad);
    let width = clip.width ?? box.width + 2 * pad;
    let height = clip.height ?? box.height + 2 * pad;
    if (clip.x !== undefined) x = clip.x;
    if (clip.y !== undefined) y = clip.y;
    width = Math.min(width, vp.width - x);
    height = Math.min(height, vp.height - y);
    return { x, y, width, height };
  }
  return { x: clip.x, y: clip.y, width: clip.width, height: clip.height };
}

// raftdev's web app signs in as dev@slock.ai whenever it has no session; the
// same flag a manual sign-out sets keeps it from doing that.
function blockDevAutoLogin() {
  try { sessionStorage.setItem("slockdev_manual_logout", "1"); } catch {}
}

async function login(browser, opts, email = opts.email) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 940 } });
  await context.addInitScript(blockDevAutoLogin);
  const page = await context.newPage();
  await page.goto(`${opts.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  const inputs = page.locator("form input");
  await inputs.first().waitFor({ state: "visible", timeout: 30_000 });
  await inputs.nth(0).fill(email);
  await page.locator("input[type=password]").first().fill(opts.password);
  await page.locator("form button[type=submit], form button:has-text('Sign In')").first().click();
  await page.locator("input[type=password]").waitFor({ state: "detached", timeout: 30_000 });
  await page.waitForTimeout(1000);
  const state = await context.storageState();
  await context.close();
  return state;
}

// Computer stand-ins: answers for the few reads that need a live computer
// (model lists, workspace files, skills), which the fixture's fake-online
// machines cannot give. Declared in the manifest's "standIns" and opted into
// per shot. `times` limits a mock or patch to the first N matching requests.
async function installRoutes(page, shot, manifest) {
  const mocks = (shot.standIn ?? []).flatMap((name) => {
    const entries = manifest.standIns?.[name];
    if (!entries) throw new Error(`Unknown standIn: ${name}`);
    return entries;
  });
  // "re:<pattern>" is a regular expression; anything else is a Playwright URL glob.
  const urlMatcher = (url) => (url.startsWith("re:") ? new RegExp(url.slice(3)) : url);
  for (const mock of mocks) {
    let left = mock.times ?? Infinity;
    await page.route(urlMatcher(mock.url), async (route) => {
      if (left <= 0 || (mock.method ?? "GET") !== route.request().method()) return route.fallback();
      left -= 1;
      let body = mock.json;
      if (mock.byQuery) {
        const value = new URL(route.request().url()).searchParams.get(mock.byQuery) ?? "";
        body = mock.json[value] ?? mock.json["*"];
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
  }
  for (const patch of shot.patchResponses ?? []) {
    let left = patch.times ?? Infinity;
    await page.route(urlMatcher(patch.url), async (route) => {
      if (left <= 0) return route.fallback();
      left -= 1;
      const response = await route.fetch();
      const json = { ...(await response.json()), ...patch.set };
      await route.fulfill({ response, json });
    });
  }
}

// Rewrite dev-only text (localhost URLs, raftdev's isolated install paths) to
// what a production user sees, in text nodes and form values.
async function normalizeText(page, rules) {
  if (!rules?.length) return;
  await page.evaluate((list) => {
    const compiled = list.map(([pattern, replacement]) => [new RegExp(pattern, "g"), replacement]);
    const fix = (text) => compiled.reduce((acc, [re, rep]) => acc.replace(re, rep), text);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const next = fix(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    for (const el of document.querySelectorAll("input, textarea")) {
      const next = fix(el.value);
      if (next !== el.value) el.value = next;
    }
  }, rules);
}

async function captureScene(browser, storageState, shot, opts, manifest) {
  const [width, height] = shot.viewport ?? [1440, 940];
  const context = await browser.newContext({
    storageState: shot.loggedOut ? undefined : storageState,
    viewport: { width, height },
    deviceScaleFactor: shot.scale ?? 1,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
  });
  await context.addInitScript(blockDevAutoLogin);
  await context.clock.setFixedTime(new Date(opts.clock));
  await context.addInitScript(() => {
    try {
      localStorage.setItem("slock-theme-preferences-v2", JSON.stringify({ mode: "light" }));
      document.documentElement.dataset.raftDevToolsHidden = "true";
    } catch {}
  });
  const page = await context.newPage();
  await installRoutes(page, shot, manifest);
  const vars = { baseUrl: opts.baseUrl, server: shot.server ?? "raft-workshop", ...(shot.vars ?? {}) };
  try {
    await runStep(page, { do: "goto", path: shot.path ?? "/s/{server}" }, vars);
    for (const step of shot.steps ?? []) await runStep(page, step, vars);
    await settle(page, shot.settle ?? 800);
    // Park the pointer on the empty part of the left rail unless the scene
    // depends on a hover, so no stray hover state leaks into the image.
    const hovers = (shot.steps ?? []).some((step) => step.do === "hover");
    if (shot.mouse) await page.mouse.move(shot.mouse[0], shot.mouse[1]);
    else if (!hovers) await page.mouse.move(2, Math.round(height * 0.6));
    if (!hovers && !shot.mouse) await page.waitForTimeout(300);
    await normalizeText(page, [...(manifest.normalizeText ?? []), ...(shot.normalizeText ?? [])]);
    const clip = await clipFor(page, shot.clip, vars);
    return await page.screenshot({ clip, animations: "disabled" });
  } finally {
    await context.close();
  }
}

// A composite stacks several scene crops onto one canvas (e.g. the three
// External setup states), rendered as a tiny HTML page.
async function captureComposite(browser, storageState, shot, opts, manifest) {
  const parts = [];
  for (const part of shot.parts) {
    const png = await captureScene(browser, storageState, { ...part, scale: shot.scale ?? 1 }, opts, manifest);
    parts.push(png.toString("base64"));
  }
  const [width, height] = shot.canvas;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: shot.scale ?? 1 });
  const page = await context.newPage();
  const gap = shot.gap ?? 16;
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${shot.background ?? "#f6f4ef"};width:${width}px;height:${height}px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:${gap}px">
    ${parts.map((b64) => `<img src="data:image/png;base64,${b64}" style="display:block;max-width:${width - 48}px;border:1px solid #d9d6cf;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.06)">`).join("")}
  </body></html>`);
  await page.waitForTimeout(200);
  const png = await page.screenshot();
  await context.close();
  return png;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(opts.manifest, "utf8"));
  const filters = opts.only.split(",").map((s) => s.trim()).filter(Boolean);
  const shots = manifest.shots.filter((s) => filters.length === 0 || filters.some((f) => s.out.includes(f)));
  if (opts.list) {
    for (const s of shots) console.log(`${s.out}${s.note ? `  — ${s.note}` : ""}`);
    return;
  }
  const browser = await chromium.launch({ headless: !opts.headed });
  const failures = [];
  // Tutorial shots carry a "stage": the fixture rebuilds the tutorial server as
  // it stands at that step (--tutorial-stage). A fresh fixture run is "full".
  let currentStage = "full";
  const setStage = (stage) => {
    if (stage === currentStage) return;
    if (!opts.stageCmd) {
      throw new Error(`needs tutorial stage "${stage}": pass --stage-cmd (or RAFT_STAGE_CMD), see README.md`);
    }
    try {
      execSync(opts.stageCmd.replaceAll("{stage}", stage), { stdio: "pipe" });
    } catch (error) {
      throw new Error(`stage command failed for "${stage}": ${String(error.stderr ?? error.message).trim().split("\n").slice(-3).join(" | ")}`);
    }
    console.log(`stage ${stage}`);
    currentStage = stage;
  };
  try {
    const sessions = new Map([[opts.email, await login(browser, opts)]]);
    for (const shot of shots) {
      const started = Date.now();
      try {
        // A shot may run as another fixture account (same password).
        const email = shot.email ?? opts.email;
        if (!sessions.has(email)) sessions.set(email, await login(browser, opts, email));
        const storageState = sessions.get(email);
        setStage(shot.stage ?? currentStage);
        const png = shot.parts
          ? await captureComposite(browser, storageState, shot, opts, manifest)
          : await captureScene(browser, storageState, shot, opts, manifest);
        const outPath = join(opts.outDir, shot.out);
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, png);
        console.log(`ok    ${shot.out} (${Date.now() - started} ms)`);
      } catch (error) {
        failures.push(shot.out);
        console.log(`FAIL  ${shot.out}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
      }
    }
    // Leave the tutorial server as a plain fixture run leaves it.
    if (currentStage !== "full") setStage("full");
  } finally {
    await browser.close();
  }
  if (failures.length > 0) {
    console.log(`\n${failures.length} shot(s) failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
