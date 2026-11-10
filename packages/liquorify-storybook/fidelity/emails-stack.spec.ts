import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * Holds the emails gem's own test app (`spree/emails`, `rake test_app`) open
 * for batch 11's email template screens, until `fidelity/.stop-emails`
 * exists. Spree's browser-test server does not load the emails gem, so it
 * registers no editable templates and DA-SET-04 lists nothing there; this app
 * does, as the platform batch's step P1 used it for EM-C-08.
 *
 * It starts the app on port 3040 in its test environment, with a database of
 * its own given Spree's seeds and an admin whose address and password it
 * writes to `results/tmp/emails-app.json` (removed when it stops). The built
 * dashboard is then served on another port with `VITE_API_PROXY_TARGET`
 * pointing here, so the screens are the same dashboard at the same revision.
 *
 * As customer-mail.spec.ts does, a settings file written into the generated
 * test app, and removed when it stops, writes the mail it sends to
 * `LIQUORIFY_MAIL_DIR` and runs jobs in the server, because the test
 * environment keeps mail in memory and only queues jobs. Spree's code and its
 * test settings are unchanged.
 */

const PORT = 3040
const APP = new URL('../../../spree/emails/spec/dummy/', import.meta.url).pathname
const SETTINGS = `${APP}config/initializers/liquorify_batch_11.rb`
const DATABASE = `${APP}db/spree_test_liquorify_b11.sqlite3`
const results = new URL('./results/', import.meta.url).pathname
const CREDENTIALS = `${results}tmp/emails-app.json`
const stopFile = new URL('./.stop-emails', import.meta.url)
const EMAILS_ADMIN = { email: 'emails-admin@example.com', password: 'fidelity-emails-123' }

const environment = {
  ...process.env,
  RAILS_ENV: 'test',
  TEST_ENV_NUMBER: '_liquorify_b11',
  LIQUORIFY_BATCH_11: '1',
  ADMIN_EMAIL: EMAILS_ADMIN.email,
  ADMIN_PASSWORD: EMAILS_ADMIN.password,
  LANG: 'C.UTF-8',
}

const rails = (...args: string[]) =>
  execFileSync('bin/rails', args, { cwd: APP, env: environment, stdio: 'pipe', timeout: 600_000 })

test('Spree emails gem test app', async () => {
  test.setTimeout(0)
  rmSync(stopFile, { force: true })
  mkdirSync(`${results}tmp`, { recursive: true })
  writeFileSync(
    SETTINGS,
    [
      '# Written by packages/liquorify-storybook/fidelity/emails-stack.spec.ts — safe to delete.',
      "if ENV['LIQUORIFY_BATCH_11'] == '1'",
      '  Rails.application.config.after_initialize do',
      "    if ENV['LIQUORIFY_MAIL_DIR'].present?",
      '      ActionMailer::Base.delivery_method = :file',
      "      ActionMailer::Base.file_settings = { location: ENV['LIQUORIFY_MAIL_DIR'] }",
      '    end',
      '    ActiveJob::Base.queue_adapter = :async',
      '  end',
      'end',
      '',
    ].join('\n'),
  )
  let server: ChildProcess | undefined
  try {
    rails('db:schema:load')
    rails(
      'runner',
      [
        'Spree::Seeds::All.call',
        'store = Spree::Store.default',
        'File.write(ARGV[0], { store_id: store.prefixed_id, store_name: store.name, admin_email: ENV["ADMIN_EMAIL"], admin_password: ENV["ADMIN_PASSWORD"] }.to_json, perm: 0o600)',
      ].join('; '),
      CREDENTIALS,
    )
    server = spawn(
      'bin/rails',
      ['server', '-p', String(PORT), '-b', '127.0.0.1', '-P', `${results}tmp/emails-app.pid`],
      {
        cwd: APP,
        env: environment,
        stdio: 'ignore',
      },
    )
    await expect
      .poll(
        () =>
          fetch(`http://127.0.0.1:${PORT}/api/v3/admin/auth/providers`).then(
            () => true,
            () => false,
          ),
        { timeout: 180_000 },
      )
      .toBe(true)
    while (!existsSync(stopFile)) await new Promise((resolve) => setTimeout(resolve, 2000))
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise((resolve) => server?.once('exit', resolve))
      server.kill('SIGTERM')
      await stopped
    }
    rmSync(SETTINGS, { force: true })
    rmSync(CREDENTIALS, { force: true })
    for (const file of [DATABASE, `${DATABASE}-shm`, `${DATABASE}-wal`])
      rmSync(file, { force: true })
    rmSync(stopFile, { force: true })
  }
})
