// Scores captured screenshots against the committed references with
// Playwright's own image comparator, at several tolerance settings.
//
//   node score.cjs <playwright-core folder> <reference folder> <output.json> <run name>=<capture folder>...
//
// The playwright-core folder must be the version the visual check runs, so
// the comparison is the one CI makes. For each run it reports how many images
// would fail under each setting, and the counted pixels of every image that
// is not byte-identical to its reference.
const fs = require('node:fs')
const path = require('node:path')

const [coreFolder, referenceFolder, output, ...runs] = process.argv.slice(2)
const { utils } = require(path.join(coreFolder, 'lib/coreBundle.js'))
const compare = utils.getComparator('image/png')

const thresholds = [0, 0.005, 0.01, 0.02, 0.2]
const settings = [
  { threshold: 0.2, maxDiffPixels: 0 },
  { threshold: 0.01, maxDiffPixels: 0 },
  { threshold: 0.01, maxDiffPixels: 25 },
  { threshold: 0.005, maxDiffPixels: 0 },
  { threshold: 0.005, maxDiffPixels: 25 },
  { threshold: 0.02, maxDiffPixels: 25 },
]

const images = (folder) =>
  fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(folder, entry.name)
    if (entry.isDirectory()) return images(full)
    return entry.name.endsWith('.png') ? [full] : []
  })

/** Pixels Playwright counts as different at a threshold; Infinity when the sizes differ. */
function counted(actual, expected, threshold) {
  const result = compare(actual, expected, { threshold, maxDiffPixels: 0 })
  if (!result) return 0
  const match = /(\d+) pixels/.exec(result.errorMessage)
  return match ? Number(match[1]) : Infinity
}

const report = {}
for (const run of runs) {
  const [name, folder] = run.split('=')
  const scored = []
  for (const file of images(folder).sort()) {
    const image = path.relative(folder, file)
    const reference = path.join(referenceFolder, image)
    if (!fs.existsSync(reference)) continue
    const actual = fs.readFileSync(file)
    const expected = fs.readFileSync(reference)
    const counts = {}
    if (!actual.equals(expected)) {
      for (const threshold of thresholds) counts[threshold] = counted(actual, expected, threshold)
    }
    scored.push({ image, identical: actual.equals(expected), counts })
  }
  const fails = ({ threshold, maxDiffPixels }) =>
    scored.filter((entry) => !entry.identical && entry.counts[threshold] > maxDiffPixels).length
  report[name] = {
    images: scored.length,
    identical: scored.filter((entry) => entry.identical).length,
    failing: Object.fromEntries(
      settings.map((setting) => [`${setting.threshold}/${setting.maxDiffPixels}`, fails(setting)]),
    ),
    largestCount: Object.fromEntries(
      thresholds.map((threshold) => [
        threshold,
        Math.max(0, ...scored.filter((entry) => !entry.identical).map((entry) => entry.counts[threshold])),
      ]),
    ),
    differing: scored
      .filter((entry) => !entry.identical)
      .map(({ image, counts }) => ({ image, counts })),
  }
  console.log(name, JSON.stringify({ ...report[name], differing: report[name].differing.length }))
}
fs.writeFileSync(output, `${JSON.stringify(report, (key, value) => (value === Infinity ? 'size' : value), 1)}\n`)
