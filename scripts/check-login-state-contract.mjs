import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guide = fs.readFileSync(path.join(root, "content/developers/login-with-raft/index.md"), "utf8");
const build = fs.readFileSync(path.join(root, "content/developers/raft-apps/build/index.md"), "utf8");

const guideRequirements = [
  "&state=<signed_attempt_state>",
  "already-installed path",
  "Install + Continue",
  "Verify state before consuming the one-time code",
  "verifyState(String(req.query.state ?? \"\"))",
  "This must happen before exchangeRaftCode(code).",
  "separate Agent Login callback",
  "invalidates outstanding attempts"
];

const buildRequirements = [
  "already-installed app",
  "login-init cookie/session is absent",
  "concurrent human attempts",
  "before token exchange or local-session creation",
  "stateless Agent Login"
];

for (const marker of guideRequirements) {
  if (!guide.includes(marker)) throw new Error(`Login with Raft guide is missing contract marker: ${marker}`);
}
for (const marker of buildRequirements) {
  if (!build.includes(marker)) throw new Error(`Build a Raft App guide is missing test marker: ${marker}`);
}

const verifyIndex = guide.indexOf("attempt = verifyState");
const exchangeIndex = guide.indexOf("const token = await exchangeRaftCode(code)", verifyIndex);
if (verifyIndex < 0 || exchangeIndex < 0 || verifyIndex > exchangeIndex) {
  throw new Error("Documented human callback must verify state before exchanging the code");
}

if (guide.includes("Login-init state lives on your side")) {
  throw new Error("Cookie/session-only login-state guidance must not return");
}

console.log("login-state docs contract OK");
