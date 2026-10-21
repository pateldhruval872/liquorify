import { defineConfig } from '@playwright/test'

// Holds Spree's browser-test server open for the fidelity comparison (see stack.spec.ts).
export default defineConfig({
  testDir: '.',
  testMatch: 'stack.spec.ts',
  timeout: 0,
  reporter: 'list',
})
