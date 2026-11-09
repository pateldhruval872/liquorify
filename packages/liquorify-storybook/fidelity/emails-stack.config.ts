import { defineConfig } from '@playwright/test'

// Holds the emails gem's test app open for batch 11's email template screens (see emails-stack.spec.ts).
export default defineConfig({
  testDir: '.',
  testMatch: 'emails-stack.spec.ts',
  timeout: 0,
  reporter: 'list',
})
