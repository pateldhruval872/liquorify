// Lists every pixel that differs between two images, grouped into regions, with
// the pixels Playwright's comparator counts at the threshold the visual check uses (0.005).
//   node regions.cjs <playwright-core folder> <old.png> <new.png> <output.json>
const fs = require('node:fs')
const path = require('node:path')

const [coreFolder, oldFile, newFile, output] = process.argv.slice(2)
const { utils } = require(path.join(coreFolder, 'lib/coreBundle.js'))
const { PNG } = require(path.join(coreFolder, 'lib/utilsBundle.js'))
const compare = utils.getComparator('image/png')

const oldBuffer = fs.readFileSync(oldFile)
const newBuffer = fs.readFileSync(newFile)
const before = PNG.sync.read(oldBuffer)
const after = PNG.sync.read(newBuffer)
const { width, height } = before
const result = compare(newBuffer, oldBuffer, { threshold: 0.005, maxDiffPixels: 0 })
const diff = result?.diff ? PNG.sync.read(result.diff) : null

const changedPixels = new Map()
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4
    let delta = 0
    for (let channel = 0; channel < 4; channel += 1) {
      delta = Math.max(delta, Math.abs(before.data[offset + channel] - after.data[offset + channel]))
    }
    if (delta === 0) continue
    // The comparator paints counted pixels pure red in its diff image.
    const isCounted = diff ? diff.data[offset] === 255 && diff.data[offset + 1] === 0 && diff.data[offset + 2] === 0 : false
    changedPixels.set(`${x},${y}`, { x, y, delta, counted: isCounted })
  }
}

// Pixels within 6 pixels of each other belong to one region.
const seen = new Set()
const regions = []
for (const [key, pixel] of changedPixels) {
  if (seen.has(key)) continue
  const stack = [pixel]
  seen.add(key)
  const members = []
  while (stack.length) {
    const current = stack.pop()
    members.push(current)
    for (let dy = -6; dy <= 6; dy += 1) {
      for (let dx = -6; dx <= 6; dx += 1) {
        const neighbour = `${current.x + dx},${current.y + dy}`
        if (!seen.has(neighbour) && changedPixels.has(neighbour)) {
          seen.add(neighbour)
          stack.push(changedPixels.get(neighbour))
        }
      }
    }
  }
  regions.push({
    left: Math.min(...members.map((m) => m.x)),
    top: Math.min(...members.map((m) => m.y)),
    right: Math.max(...members.map((m) => m.x)),
    bottom: Math.max(...members.map((m) => m.y)),
    changed: members.length,
    counted: members.filter((m) => m.counted).length,
    largest: Math.max(...members.map((m) => m.delta)),
    pixels: members
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((m) => `${m.x},${m.y} ${m.delta}${m.counted ? ' counted' : ''}`),
  })
}
regions.sort((a, b) => a.top - b.top || a.left - b.left)
const report = {
  width,
  height,
  changed: changedPixels.size,
  counted: [...changedPixels.values()].filter((p) => p.counted).length,
  comparatorMessage: result?.errorMessage ?? 'no difference counted',
  regions,
}
fs.writeFileSync(output, `${JSON.stringify(report, null, 1)}\n`)
console.log(`${path.basename(newFile)}: ${report.changed} changed, ${report.counted} counted, ${regions.length} regions`)
for (const r of regions) console.log(`  x ${r.left}-${r.right}, y ${r.top}-${r.bottom}: ${r.changed} changed, ${r.counted} counted, largest ${r.largest}`)
