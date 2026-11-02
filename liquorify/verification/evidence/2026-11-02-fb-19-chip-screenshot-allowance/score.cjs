// Scores captures of the two chip stories against the committed references
// with Playwright's own comparator, as the visual check makes it.
//   node score.cjs <playwright-core folder> <reference folder> <output.json> <run>=<capture folder>...
// For each image it reports whether it is byte-identical, the pixels counted
// at the threshold the check uses (0.005), and whether the image fails at the
// general allowance (25) and at the two images' allowance (60).
const fs = require('node:fs')
const path = require('node:path')

const [coreFolder, referenceFolder, output, ...runs] = process.argv.slice(2)
const { utils } = require(path.join(coreFolder, 'lib/coreBundle.js'))
const compare = utils.getComparator('image/png')
const images = [
  'dashboard-core-product-form-variants-section--seeded-from-type/light.png',
  'dashboard-core-product-form-variants-section--seeded-from-type/dark.png',
  'dashboard-core-product-form-variants-options-builder--awaiting-values/light.png',
  'dashboard-core-product-form-variants-options-builder--awaiting-values/dark.png',
]

function counted(actual, expected) {
  const result = compare(actual, expected, { threshold: 0.005, maxDiffPixels: 0 })
  if (!result) return 0
  const match = /(\d+) pixels/.exec(result.errorMessage)
  return match ? Number(match[1]) : 'size'
}

const report = {}
for (const run of runs) {
  const [name, folder] = run.split('=')
  report[name] = {}
  for (const image of images) {
    const actual = fs.readFileSync(path.join(folder, image))
    const expected = fs.readFileSync(path.join(referenceFolder, image))
    const count = actual.equals(expected) ? 0 : counted(actual, expected)
    report[name][image] = {
      identical: actual.equals(expected),
      counted: count,
      failsAt25: count === 'size' || count > 25,
      failsAt60: count === 'size' || count > 60,
    }
  }
}
fs.writeFileSync(output, `${JSON.stringify(report, null, 1)}\n`)
for (const [name, result] of Object.entries(report)) {
  console.log(name, Object.entries(result).map(([image, r]) => `${image.split('--')[1]}:${r.counted}`).join(' '))
}
