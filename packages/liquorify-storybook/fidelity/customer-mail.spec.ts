import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { linkIn, MAIL_DIR, mailTo, nextMail } from './mail'

/**
 * Spree's own customer password reset email, EM-C-08, for the platform batch's
 * step P1. Spree's browser-test server does not load the emails gem that sends
 * it, so this runs against the gem's own test app (`spree/emails`, `rake
 * test_app`). The script starts that app on port 3040 in its test environment,
 * with a database of its own given Spree's seeds, and at the end stops it and
 * removes that database.
 *
 * The test environment keeps mail in memory and only queues jobs, so neither
 * the event's subscriber nor the mailer would run. A settings file the script
 * writes into the generated test app, and removes when it stops, writes the
 * mail to `LIQUORIFY_MAIL_DIR` and runs jobs in the server, as stack.spec.ts
 * and the browser tests' own setup do for theirs. Spree's code and its test
 * settings are unchanged.
 *
 * Through the Store API it signs up a customer, asks for a reset link the way
 * the storefront does, reads the email, resets the password with the mailed
 * link's token, and signs in. Run it with `LIQUORIFY_MAIL_DIR` naming an empty
 * folder. Results go to `results/customer-mail.json`, with no token, key,
 * password or address.
 */

const PORT = 3040
const API = `http://127.0.0.1:${PORT}/api/v3/store`
const APP = new URL('../../../spree/emails/spec/dummy/', import.meta.url).pathname
const SETTINGS = `${APP}config/initializers/liquorify_customer_mail.rb`
const DATABASE = `${APP}db/spree_test_liquorify.sqlite3`
const results = new URL('./results/', import.meta.url).pathname
const environment = {
  ...process.env,
  RAILS_ENV: 'test',
  TEST_ENV_NUMBER: '_liquorify',
  LIQUORIFY_CUSTOMER_MAIL: '1',
  LANG: 'C.UTF-8',
}

let server: ChildProcess | undefined
let store: { key: string; origin: string }

const rails = (...args: string[]) =>
  execFileSync('bin/rails', args, { cwd: APP, env: environment, stdio: 'pipe', timeout: 300_000 })

/** The status Spree answers a Store API request with. */
async function send(method: string, path: string, body: object) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Spree-API-Key': store.key },
    body: JSON.stringify(body),
  })
  return response.status
}

test.beforeAll(async () => {
  test.setTimeout(600_000)
  if (!MAIL_DIR) return
  writeFileSync(
    SETTINGS,
    [
      '# Written by packages/liquorify-storybook/fidelity/customer-mail.spec.ts — safe to delete.',
      "if ENV['LIQUORIFY_CUSTOMER_MAIL'] == '1' && ENV['LIQUORIFY_MAIL_DIR'].present?",
      '  Rails.application.config.after_initialize do',
      '    ActionMailer::Base.delivery_method = :file',
      "    ActionMailer::Base.file_settings = { location: ENV['LIQUORIFY_MAIL_DIR'] }",
      '    ActiveJob::Base.queue_adapter = :async',
      '  end',
      'end',
      '',
    ].join('\n'),
  )
  mkdirSync(`${results}tmp`, { recursive: true })
  const storeFile = `${results}tmp/customer-mail-store.json`
  rails('db:schema:load')
  rails(
    'runner',
    [
      'Spree::Seeds::All.call',
      'store = Spree::Store.default',
      'key = store.api_keys.active.publishable.where(channel_id: nil).first',
      'File.write(ARGV[0], { key: key.token, origin: store.allowed_origins.first.origin }.to_json, perm: 0o600)',
    ].join('; '),
    storeFile,
  )
  store = JSON.parse(readFileSync(storeFile, 'utf8'))
  rmSync(storeFile)

  server = spawn(
    'bin/rails',
    ['server', '-p', String(PORT), '-b', '127.0.0.1', '-P', `${results}tmp/customer-mail.pid`],
    { cwd: APP, env: environment, stdio: 'ignore' },
  )
  await expect
    .poll(
      () =>
        fetch(`${API}/products`).then(
          () => true,
          () => false,
        ),
      { timeout: 120_000 },
    )
    .toBe(true)
})

test.afterAll(async () => {
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server?.once('exit', resolve))
    server.kill('SIGTERM')
    await stopped
  }
  rmSync(SETTINGS, { force: true })
  for (const file of [DATABASE, `${DATABASE}-shm`, `${DATABASE}-wal`]) rmSync(file, { force: true })
})

test('EM-C-08: Spree sends the customer reset email, and its link resets the password', async () => {
  test.skip(!MAIL_DIR, 'Run with LIQUORIFY_MAIL_DIR naming an empty folder (see above)')
  const email = `em-c-08-${Date.now()}@example.com`
  const password = randomUUID()
  const newPassword = randomUUID()

  const signUp = await send('POST', '/customers', {
    email,
    password,
    password_confirmation: password,
  })
  expect(signUp).toBe(201)

  const already = mailTo(email).length
  // The page the storefront's forgot-password form names.
  const redirect = `${store.origin}/us/en/account/reset-password`
  const request = await send('POST', '/password_resets', { email, redirect_url: redirect })
  expect(request).toBe(202)

  const mail = await nextMail(email, already)
  const link = linkIn(mail, /[?&]token=/)
  const token = link.searchParams.get('token') ?? ''
  expect(`${link.origin}${link.pathname}`).toBe(redirect)

  const reset = await send('PATCH', `/password_resets/${encodeURIComponent(token)}`, {
    password: newPassword,
    password_confirmation: newPassword,
  })
  const again = await send('PATCH', `/password_resets/${encodeURIComponent(token)}`, {
    password,
    password_confirmation: password,
  })
  const oldSignIn = await send('POST', '/auth/login', { email, password })
  const newSignIn = await send('POST', '/auth/login', { email, password: newPassword })

  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}customer-mail.json`,
    `${JSON.stringify(
      {
        app: 'spree/emails test app, test environment, mail written to files',
        signUp,
        resetRequested: request,
        mail: {
          subject: mail.subject,
          messagesToTheCustomer: mailTo(email).length,
          linkPath: `${link.pathname}?token=…`,
          linkGoesToTheRedirect: `${link.origin}${link.pathname}` === redirect,
        },
        resetWithTheMailedToken: reset,
        theSameTokenAgain: again,
        signInWithTheOldPassword: oldSignIn,
        signInWithTheNewPassword: newSignIn,
      },
      null,
      2,
    )}\n`,
  )

  expect(mail.subject).toBe('Shop Password Reset Instructions')
  expect(reset).toBe(200)
  expect(again).toBe(422)
  expect(oldSignIn).toBe(401)
  expect(newSignIn).toBe(200)
})
