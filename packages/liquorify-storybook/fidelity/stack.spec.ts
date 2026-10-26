import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { test } from '@playwright/test'
import firstRunSetup from '../../dashboard/e2e/first-run/global-setup'
import firstRunTeardown from '../../dashboard/e2e/first-run/global-teardown'
import globalSetup from '../../dashboard/e2e/global-setup'
import globalTeardown from '../../dashboard/e2e/global-teardown'

const stopFile = new URL('./.stop', import.meta.url)
const firstRunStopFile = new URL('./.stop-first-run', import.meta.url)
const mailInitializer = new URL(
  '../../../spree/api/spec/dummy/config/initializers/zz_liquorify_mail.rb',
  import.meta.url,
)

/**
 * Starts the dashboard browser tests' own Rails server, database and fixtures,
 * exactly as their suite does, and keeps it running until `fidelity/.stop`
 * exists. The panels and Storybook are served separately (see compare.spec.ts).
 *
 * With `LIQUORIFY_MAIL_DIR` set, the server writes the mail it sends to that
 * folder, one file per recipient, for mail.spec.ts. The test environment
 * otherwise keeps mail in memory, where no script can read it. Like the
 * initializers the browser tests' own setup writes, the file lives in the
 * generated test app, takes effect only for this server and is removed when it
 * stops; Spree's code is unchanged.
 */
test('Spree browser-test server', async () => {
  rmSync(stopFile, { force: true })
  if (process.env.LIQUORIFY_MAIL_DIR) {
    writeFileSync(
      mailInitializer,
      [
        '# Written by packages/liquorify-storybook/fidelity/stack.spec.ts — safe to delete.',
        "if ENV['DASHBOARD_E2E'] == '1' && ENV['LIQUORIFY_MAIL_DIR'].present?",
        '  Rails.application.config.after_initialize do',
        '    ActionMailer::Base.delivery_method = :file',
        "    ActionMailer::Base.file_settings = { location: ENV['LIQUORIFY_MAIL_DIR'] }",
        '  end',
        'end',
        '',
      ].join('\n'),
    )
  }
  await globalSetup()
  try {
    while (!existsSync(stopFile)) await new Promise((resolve) => setTimeout(resolve, 1000))
  } finally {
    await globalTeardown()
    rmSync(stopFile, { force: true })
    rmSync(mailInitializer, { force: true })
  }
})

/**
 * First-run setup's own server, which starts with no admin and a setup link,
 * exactly as `first-run/setup.spec.ts` starts it, and keeps it running until
 * `fidelity/.stop-first-run` exists. setup.spec.ts completes setup on it, which
 * closes setup for good, so each of its runs needs this server started afresh.
 */
test('Spree first-run server', async () => {
  rmSync(firstRunStopFile, { force: true })
  await firstRunSetup()
  try {
    while (!existsSync(firstRunStopFile)) await new Promise((resolve) => setTimeout(resolve, 1000))
  } finally {
    await firstRunTeardown()
    rmSync(firstRunStopFile, { force: true })
  }
})
