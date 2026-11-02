// Captures the stories into tolerance/captures/<run>/ instead of comparing
// them, so the committed references are never touched. Run in the pinned image:
//   TOLERANCE_RUN=<run> node node_modules/@playwright/test/cli.js test --config tolerance/capture.config.ts --grep <stories>
import base from '../visual/playwright.config'

const run = process.env.TOLERANCE_RUN ?? 'run'

export default {
  ...base,
  testDir: '../visual',
  snapshotPathTemplate: `{testDir}/../tolerance/captures/${run}/{arg}{ext}`,
  outputDir: `./out/${run}`,
  updateSnapshots: 'all' as const,
  reporter: [['line']],
}
