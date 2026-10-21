// Captures every story into tolerance/captures/<run>/ instead of comparing it,
// so the committed references are never touched. Placed in a folder named
// `tolerance/` beside `visual/` in either repository's Storybook package, and
// run in the pinned image:
//   TOLERANCE_RUN=<run> node node_modules/@playwright/test/cli.js test --config tolerance/capture.config.ts
import base from '../visual/playwright.config'

const run = process.env.TOLERANCE_RUN ?? 'run'

export default {
  ...base,
  testDir: '../visual',
  snapshotPathTemplate: `{testDir}/../tolerance/captures/${run}/{arg}{ext}`,
  outputDir: `./out/${run}`,
  updateSnapshots: 'all' as const,
  reporter: [['dot']],
}
