#!/usr/bin/env node
// Copies the images from a downloaded visual check artifact into
// visual/__screenshots__, for a person who has looked at them and cannot run
// the update in Docker (LIQ-010 §11.4). It only moves files: proposed images
// for missing references, and actual images for changed ones.
//
//   node scripts/copy-references.mjs <artifact folder> [story id ...]

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const references = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../visual/__screenshots__',
)
const [artifact, ...only] = process.argv.slice(2)
if (!artifact) {
  console.error('Usage: node scripts/copy-references.mjs <artifact folder> [story id ...]')
  process.exit(1)
}

// <test folder>/proposed/<story id>/<mode>.png and <test folder>/<story id>/<mode>-actual.png
const image = /(?:^|\/)(?:proposed\/)?([a-z0-9-]+--[a-z0-9-]+)\/([a-z0-9-]+?)(-actual)?\.png$/

let copied = 0
for (const file of readdirSync(artifact, { recursive: true })) {
  const relative = file.split(path.sep).join('/')
  const match = relative.match(image)
  if (!match) continue
  const [, storyId, mode, actual] = match
  if (!actual && !relative.includes('proposed/')) continue
  if (only.length > 0 && !only.includes(storyId)) continue
  mkdirSync(path.join(references, storyId), { recursive: true })
  copyFileSync(path.join(artifact, file), path.join(references, storyId, `${mode}.png`))
  console.log(`${storyId}/${mode}.png`)
  copied += 1
}
console.log(`${copied} reference images copied; list them and the reason in the pull request.`)
