/**
 * Node-only helpers that touch the filesystem. Kept out of config.mjs so the
 * pure declaration module stays importable from browser bundles (the theme
 * imports it) without Vite externalising node builtins.
 */
import nodePath from 'node:path'
import { pathToFileURL } from 'node:url'
import { accessSync } from 'node:fs'

function fail(message) {
  throw new Error(`docs.config: ${message}`)
}

/**
 * Load the `docs.config.mjs` a site keeps at its root (or at `configPath`)
 * and return `{ config, root, configPath }` — `root` being the directory the
 * config file lives in, which every kit script can use as its `--root`.
 */
export async function loadDocsConfig({ root, configPath } = {}) {
  const siteRoot = root ?? process.cwd()
  const file = configPath ?? nodePath.join(siteRoot, 'docs.config.mjs')
  try {
    accessSync(file)
  } catch {
    fail(`no config file found at ${file}`)
  }
  const module = await import(pathToFileURL(file).href)
  const config = module.default
  if (!config || typeof config !== 'object') {
    fail(`${file} must default-export the result of defineDocsConfig()`)
  }
  return { config, root: siteRoot, configPath: file }
}

