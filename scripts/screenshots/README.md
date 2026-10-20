# App screenshots

`capture.mjs` regenerates the app screenshots under `content/` from a local Raft
dev environment seeded with the docs fixture (the "Raft Workshop" cast: Alex,
Maya, Taylor, Koda, Maggie, Cindy). `shots.json` lists every scene.

## Run it

1. Start a dev environment from a [botiverse/slock](https://github.com/botiverse/slock)
   checkout. The Activity view reads from RisingWave, so start it with
   `--risingwave`:

   ```sh
   ./raftdev start docs-shots --risingwave
   ```

2. Load the fixture. Re-run it before every capture: each run rebuilds the
   fixture servers, so unread counts, saved items and timestamps start fresh.

   ```sh
   ./raftdev script docs-fixture --env docs-shots
   ```

3. Capture, from this repo:

   ```sh
   pnpm install
   pnpm exec playwright install chromium   # first time only
   node scripts/screenshots/capture.mjs --base-url http://localhost:<web-port>
   ```

   `./raftdev start` prints the web port. The PNGs are overwritten in place.

Options:

| Option | Env | Default |
| --- | --- | --- |
| `--base-url` | `RAFT_BASE_URL` | `http://localhost:15220` |
| `--email` | `RAFT_EMAIL` | `alex@example.com` (the fixture viewer) |
| `--password` | `RAFT_PASSWORD` | `password123` |
| `--only a,b` | `RAFT_SHOTS` | all shots; matches substrings of the output path |
| `--out-dir` | | `content/` (use another folder to try changes) |
| `--list` | | print the shots and exit |

Run the whole manifest, not single shots, after a fixture run: the order is
deliberate (see below).

## What the script does

- Signs in as the fixture viewer, Alex. raftdev's web app would otherwise sign
  in as `dev@slock.ai`; the script blocks that.
- Light theme, `en-US`, America/Los_Angeles, 1440×940 at 1x unless a shot says
  otherwise (one developer-docs crop is 2x, matching the original).
- Hides raftdev's dev overlays (react-scan tab, react-grab tab, the raftdev
  gear) and turns off animations and the text caret.
- Rewrites dev-only text to what production shows: `localhost` URLs become
  `https://app.raft.build`, and raftdev's isolated `RAFT_HOME=…` install
  commands become the plain `curl … | sh` / `raft-computer setup /<slug>`.

## Manifest format

Each entry in `shots`:

- `out`: output path under `content/`.
- `server`: fills `{server}` in paths (default `raft-workshop`).
- `path`: start page (default `/s/{server}`).
- `viewport`, `scale`: page size and device scale factor.
- `steps`: `{ "do": "click" | "rightclick" | "tripleclick" | "hover" | "fill" | "type" | "press" | "waitFor" | "scroll" | "wait" | "eval", "target": <Playwright selector>, "has": <text filter>, "nth": <index>, "value": … }`.
- `clip`: crop by `selector` (+ `pad`, `width`, `height`) or by `x`/`y`/`width`/`height`.
- `parts` + `canvas`: a composite of several crops on one canvas.
- `email`: run the shot as another fixture account.
- `standIn`: named API answers from `standIns` (see below).
- `patchResponses`: overwrite fields in a real API response.

### Stand-ins

The fixture marks its computers online without running one, so the few reads
that need a live computer (model lists, the agent Workspace browser, skills)
would otherwise show "computer offline" or spin. Shots that show those parts
opt into `standIns`, which answer with what a computer would report. The
onboarding "Connect a computer" shot also holds the setup step on screen with
`patchResponses`, as an owner sees it right after the computer connects.

### Order

Opening a conversation marks it read, so the Activity and Saved shots run
first. "Add computer → Next" registers a pending computer on the server, so it
runs last.

## Fixture accounts

All use the password `password123`:

- `alex@example.com`: Alex, owner of the three Raft Workshop servers.
- `maya@example.com`, `taylor@example.com`: Maya and Taylor.
- `mira@partner-labs.example`, `jun@atlas-studio.example`: the partner servers.
- `new-owner@example.com`: an account with no server, for "create your first
  server".

Not captured by this script: `content/public/**`,
`raft-on-every-device/ios-add-to-home-screen.png` (an iOS share sheet) and the
tutorial avatars.
