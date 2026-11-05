// Scores captures against the committed references with Playwright's own
// comparator, at the threshold the visual check uses (0.005).
//   node score.cjs <playwright-core folder> <reference folder> <output.json> <image>[,<image>...] <run>=<capture folder>...
// For each image: byte-identical or not, pixels counted at 0.005, every pixel
// changed and the largest change in one channel, and whether it fails at 25 and at 60.
const fs = require('node:fs')
const path = require('node:path')

const [coreFolder, referenceFolder, output, imageList, ...runs] = process.argv.slice(2)
const { utils } = require(path.join(coreFolder, 'lib/coreBundle.js'))
const compare = utils.getComparator('image/png')
const { PNG } = require(path.join(coreFolder, 'lib/utilsBundle.js'))
const images = imageList.split(',')

function counted(actual, expected) {
  const result = compare(actual, expected, { threshold: 0.005, maxDiffPixels: 0 })
  if (!result) return 0
  const match = /(\d+) pixels/.exec(result.errorMessage)
  return match ? Number(match[1]) : 'size'
}

function changed(actual, expected) {
  const a = PNG.sync.read(actual)
  const e = PNG.sync.read(expected)
  if (a.width !== e.width || a.height !== e.height) return { changed: 'size', largest: 'size' }
  let count = 0
  let largest = 0
  for (let offset = 0; offset < a.data.length; offset += 4) {
    let delta = 0
    for (let channel = 0; channel < 4; channel += 1) {
      delta = Math.max(delta, Math.abs(a.data[offset + channel] - e.data[offset + channel]))
    }
    if (delta > 0) {
      count += 1
      largest = Math.max(largest, delta)
    }
  }
  return { changed: count, largest }
}

const report = {}
for (const run of runs) {
  const [name, folder] = run.split('=')
  report[name] = {}
  for (const image of images) {
    const file = path.join(folder, image)
    if (!fs.existsSync(file)) {
      report[name][image] = { missing: true }
      continue
    }
    const actual = fs.readFileSync(file)
    const expected = fs.readFileSync(path.join(referenceFolder, image))
    const identical = actual.equals(expected)
    const count = identical ? 0 : counted(actual, expected)
    report[name][image] = {
      identical,
      counted: count,
      ...(identical ? { changed: 0, largest: 0 } : changed(actual, expected)),
      failsAt25: count === 'size' || count > 25,
      failsAt60: count === 'size' || count > 60,
    }
  }
}
fs.writeFileSync(output, `${JSON.stringify(report, null, 1)}\n`)
for (const [name, result] of Object.entries(report)) {
  console.log(
    name,
    Object.entries(result)
      .map(([image, r]) => `${image}: ${r.missing ? 'missing' : `${r.counted} counted, ${r.changed} changed, largest ${r.largest}`}`)
      .join(' | '),
  )
}
