// The visual check itself, against the committed references, run from the
// diagnostic copy of its spec so a change or the allowance can be applied.
import base from '../visual/playwright.config'

export default {
  ...base,
  testDir: '.',
  testMatch: 'diag.spec.ts',
  snapshotPathTemplate: '{testDir}/../visual/__screenshots__/{arg}{ext}',
  outputDir: `./out/check-${process.env.TOLERANCE_RUN ?? 'run'}`,
  reporter: [['line']],
}
