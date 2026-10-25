import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { LOCAL_ADDRESS, markLocalAddresses, paintOut } from './developers'
import { Receiver } from './receiver'

/**
 * An OAuth client, for the platform batch's step P2 (G-30): registered on the
 * OAuth clients screen (DA-SET-27) with a local receiver as its callback, then
 * taken through the authorization code flow with PKCE as a client takes it,
 * from Spree's authorization endpoint to the dashboard's consent page
 * (DA-SET-32) and back to the callback. The script exchanges the code, uses
 * the token within and outside its scope, and revokes it. It also denies once,
 * and tries a code twice and without its verifier.
 *
 * Start the screens with `SPREE_DASHBOARD_URL` pointing at them, so the
 * authorization endpoint sends the browser to the dashboard under test (see
 * compare.spec.ts and P2's record). The callback is a loopback address, which
 * Spree accepts over plain http, as it does for a terminal client.
 *
 * Codes, verifiers and tokens stay in memory. The results keep statuses,
 * parameter names and whether the state came back unchanged.
 */

const API = process.env.P2_API_URL ?? 'http://localhost:3010'
const PORT = 4411
const callback = `http://127.0.0.1:${PORT}/callback`
const results = new URL('./results/p2/', import.meta.url).pathname
const clientName = `P2 inventory assistant ${Date.now()}`
const scope = 'read_products'

const receiver = new Receiver(PORT)

test.beforeAll(() => receiver.start())
test.afterAll(() => receiver.stop())

function pkce() {
  const verifier = randomBytes(48).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

/** Sends the browser to Spree's authorization endpoint, as a client does. */
async function authorize(page: Page, clientId: string, challenge: string) {
  const state = randomBytes(12).toString('base64url')
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    response_type: 'code',
    scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  await page.goto(`${API}/oauth/authorize?${query}`)
  await expect(page.getByText(`${clientName} wants access to this store`)).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'Allow access', exact: true })).toBeEnabled()
  return state
}

async function decide(page: Page, button: 'Allow access' | 'Cancel') {
  const since = Date.now()
  await page.getByRole('button', { name: button, exact: true }).click()
  const arrived = await receiver.next((item) => item.path === '/callback', 30_000, since)
  await expect(page.getByText('Received')).toBeVisible()
  return arrived.query
}

async function exchange(clientId: string, code: string, verifier?: string) {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: callback,
  })
  if (verifier) form.set('code_verifier', verifier)
  const res = await fetch(`${API}/oauth/token`, { method: 'POST', body: form })
  const body = (await res.json()) as Record<string, unknown>
  return { status: res.status, body }
}

async function use(token: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  return (await fetch(`${API}${path}`, { ...init, headers })).status
}

test('an OAuth client registered on the screen completes the PKCE flow through consent', async ({
  page,
}) => {
  mkdirSync(results, { recursive: true })
  const session = await login(page)

  await page.goto(`/${session.store_id}/settings/oauth-clients`)
  await page.getByRole('button', { name: /register a client/i }).click()
  const sheet = page.getByRole('dialog')
  await sheet.locator('#oauth-application-name').fill(clientName)
  await sheet.locator('#oauth-application-redirect-uri').fill(callback)
  await sheet.getByRole('button', { name: 'Save', exact: true }).click()
  const row = page.locator('tbody tr').filter({ hasText: clientName })
  await expect(row).toBeVisible({ timeout: 15_000 })
  const clientId = ((await row.locator('code').first().textContent()) ?? '').trim()
  expect(clientId.length).toBeGreaterThan(10)
  await page.mouse.move(0, 0)
  await markLocalAddresses(page)
  writeFileSync(
    `${results}oauth-client-registered.png`,
    await page.screenshot({ style: paintOut(LOCAL_ADDRESS) }),
  )

  // Approve.
  const approved = pkce()
  const approvedState = await authorize(page, clientId, approved.challenge)
  expect(new URL(page.url()).pathname).toBe(`/${session.store_id}/oauth/authorize`)
  writeFileSync(`${results}oauth-consent.png`, await page.screenshot())
  const approval = await decide(page, 'Allow access')
  const code = approval.get('code') ?? ''

  const withVerifier = await exchange(clientId, code, approved.verifier)
  const token = String(withVerifier.body.access_token ?? '')
  const again = await exchange(clientId, code, approved.verifier)
  const withToken = {
    readProducts: await use(token, '/api/v3/admin/products'),
    readOrders: await use(token, '/api/v3/admin/orders'),
    createProduct: await use(token, '/api/v3/admin/products', {
      method: 'POST',
      body: JSON.stringify({ name: `P2 refused ${Date.now()}` }),
    }),
  }
  const revoked = await fetch(`${API}/oauth/revoke`, {
    method: 'POST',
    body: new URLSearchParams({ token, client_id: clientId }),
  })
  const afterRevoking = await use(token, '/api/v3/admin/products')

  // A second approval, whose code is presented without its verifier, then
  // with another one.
  const second = pkce()
  await authorize(page, clientId, second.challenge)
  const secondCode = (await decide(page, 'Allow access')).get('code') ?? ''
  const withoutVerifier = await exchange(clientId, secondCode)
  const wrongVerifier = await exchange(clientId, secondCode, pkce().verifier)

  // Deny.
  const denied = pkce()
  const deniedState = await authorize(page, clientId, denied.challenge)
  const denial = await decide(page, 'Cancel')

  const summary = {
    check: 'P2 criterion 2: an OAuth client on DA-SET-27, consent on DA-SET-32',
    revision: process.env.FIDELITY_REVISION ?? null,
    client: {
      name: clientName,
      callback: 'A loopback address on this machine, over plain http',
      scopeRequested: scope,
    },
    approve: {
      consentPage: `/{store}/oauth/authorize`,
      callbackParameters: [...approval.keys()].sort(),
      stateReturnedUnchanged: approval.get('state') === approvedState,
      exchange: {
        status: withVerifier.status,
        fields: Object.keys(withVerifier.body).sort(),
        token_type: withVerifier.body.token_type,
        scope: withVerifier.body.scope,
        expires_in: withVerifier.body.expires_in,
      },
      withToken,
      revoke: revoked.status,
      readProductsAfterRevoking: afterRevoking,
    },
    codeTwice: { status: again.status, error: again.body.error },
    codeWithoutVerifier: { status: withoutVerifier.status, error: withoutVerifier.body.error },
    codeWithAnotherVerifier: { status: wrongVerifier.status, error: wrongVerifier.body.error },
    deny: {
      callbackParameters: [...denial.keys()].sort(),
      error: denial.get('error'),
      stateReturnedUnchanged: denial.get('state') === deniedState,
    },
  }
  writeFileSync(`${results}oauth.json`, `${JSON.stringify(summary, null, 2)}\n`)

  expect(code.length).toBeGreaterThan(10)
  expect(summary.approve.stateReturnedUnchanged).toBe(true)
  expect(withVerifier.status).toBe(200)
  expect(withVerifier.body.scope).toBe(scope)
  expect(withToken).toEqual({ readProducts: 200, readOrders: 403, createProduct: 403 })
  expect(revoked.status).toBe(200)
  expect(afterRevoking).toBe(401)
  expect(again.status).toBe(400)
  expect(withoutVerifier.status).toBe(400)
  expect(wrongVerifier.status).toBe(400)
  expect(denial.get('error')).toBe('access_denied')
  expect(denial.has('code')).toBe(false)
  expect(summary.deny.stateReturnedUnchanged).toBe(true)
})
