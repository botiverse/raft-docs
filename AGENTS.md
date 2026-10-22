# Repository guidance for agents

This repository holds two things:

- **docs.raft.build**: the Raft documentation site. Its content is Markdown in `content/` (`content/zh-cn/` for Chinese), and it's built with VitePress. Cloudflare Pages builds and serves it from `main`.
- **`@botiverse/docs-kit`** (`packages/docs-kit/`): the shared docs-site kit, published to npm. raft-docs consumes it from this workspace. Other sites, such as docs.stamp.build in botiverse/stamp, consume the published package.

## Working on the site

```sh
pnpm install
pnpm dev              # http://localhost:5173
pnpm build            # VitePress build + agent artifacts + sitemap/redirect check
pnpm check:i18n-coverage
```

A page lives at `content/<slug>/index.md`. Images sit beside the Markdown. The translation of `content/<slug>/index.md` is `content/zh-cn/<slug>/index.md`.

## Translations

Write and change pages in English only. The Chinese pages in `content/zh-cn/` are maintained separately, by Hasaki in #proj-i18n on Raft, who checks every few days for English pages that are new or changed and brings their Chinese up to date. A pull request that adds or changes an English page doesn't need to touch `content/zh-cn/`, and CI doesn't fail on a missing translation (`pnpm check:i18n-coverage` lists them). If you do edit a Chinese page, use the Raft app's Chinese terms: [i18n/zh-cn/GLOSSARY.md](i18n/zh-cn/GLOSSARY.md) has the rules and the term table, and `pnpm check:zh` checks a Chinese page against its English one (headings and anchors, code, links, images, tables, spacing and terms).

## Working on docs-kit

- Every option a site sets lives in its `docs.config.mjs`. `packages/docs-kit/README.md` documents the declaration and each script's flags.
- Keep raft-docs' own output unchanged unless the change is meant for it. Build before and after, and compare `out/llms.txt`, `out/zh-cn/llms.txt` and `out/_headers`.
- Run the kit's tests with `pnpm --filter @botiverse/docs-kit test`. CI runs the same command on every pull request.

## Publishing docs-kit

A release is a version bump on `main` plus a tag. The `Publish Docs Kit` workflow (`.github/workflows/publish-docs-kit.yml`) does the rest.

1. **Bump the version.** Set `version` in `packages/docs-kit/package.json` in the same pull request as the change, or in its own pull request. Use semver: a patch for fixes, a minor for new options.
2. **Merge it to `main`.**
3. **Tag the merge commit.** The tag must match the version exactly:
   ```sh
   git tag -a docs-kit-vX.Y.Z <commit> -m "docs-kit X.Y.Z: <what changed>"
   git push origin docs-kit-vX.Y.Z
   ```
   A pushed tag publishes, so get the release owner's go-ahead first. Tags named `docs-kit-v*` are allowed to deploy to the `npm-docs-kit` environment.
4. **Let the workflow run.** It refuses a tag whose version differs from `package.json`. It then runs the kit's tests, does a pack check, and stages the package with `npm stage publish`.
5. **Confirm the staged version on npmjs.com.** Staged publishing means the version goes live only after a maintainer of `@botiverse/docs-kit` confirms it there.
6. **Check it is live:** `npm view @botiverse/docs-kit@X.Y.Z version`. Then bump the consumers, for example botiverse/stamp's `docs-site/package.json` and its lockfile.

There are two other ways to run the workflow: Actions → Publish Docs Kit → Run workflow on `main`, with `version` left empty to use `package.json`. Its `dry_run` input only stages a dry run.

If the run is refused with "not allowed to deploy to npm-docs-kit", the `npm-docs-kit` environment's deployment rules don't allow that ref. A repository admin fixes this under Settings → Environments.
