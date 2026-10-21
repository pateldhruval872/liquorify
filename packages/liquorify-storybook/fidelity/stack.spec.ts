import { existsSync, rmSync } from 'node:fs'
import { test } from '@playwright/test'
import globalSetup from '../../dashboard/e2e/global-setup'
import globalTeardown from '../../dashboard/e2e/global-teardown'

const stopFile = new URL('./.stop', import.meta.url)

/**
 * Starts the dashboard browser tests' own Rails server, database and fixtures,
 * exactly as their suite does, and keeps it running until `fidelity/.stop`
 * exists. The panels and Storybook are served separately (see compare.spec.ts).
 */
test('Spree browser-test server', async () => {
  rmSync(stopFile, { force: true })
  await globalSetup()
  try {
    while (!existsSync(stopFile)) await new Promise((resolve) => setTimeout(resolve, 1000))
  } finally {
    await globalTeardown()
    rmSync(stopFile, { force: true })
  }
})
