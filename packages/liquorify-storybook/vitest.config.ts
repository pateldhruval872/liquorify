import { defineConfig } from 'vitest/config'

// The Playwright comparisons in visual/ are not unit tests.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
})
