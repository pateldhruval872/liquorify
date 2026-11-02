import { readFileSync, writeFileSync } from 'node:fs'

/**
 * Gives Spree's browser-test server a webhook endpoint for the storefront's
 * receiver, for P2's criterion 5.5, and writes the endpoint's signing secret
 * to the file named as the first argument, readable only by its owner, for
 * the storefront to be started with. It prints the endpoint's id and nothing
 * the secret could be read from. An endpoint left at the same address by an
 * earlier run is deleted first, because Spree shows a secret only when the
 * endpoint is created.
 *
 *   node fidelity/storefront-endpoint.mjs <secret file>
 */

const API = process.env.P2_API_URL ?? 'http://localhost:3010'
const url = process.env.STOREFRONT_WEBHOOK_URL ?? 'http://localhost:3001/api/webhooks/spree'
const target = process.argv[2]
if (!target) throw new Error('Name the file to write the secret to')

const credentials = JSON.parse(
  readFileSync(new URL('../../dashboard/e2e/.credentials.json', import.meta.url), 'utf8'),
)
const signedIn = await fetch(`${API}/api/v3/admin/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: credentials.admin_email, password: credentials.admin_password }),
})
if (!signedIn.ok) throw new Error(`Signing in: ${signedIn.status}`)
const headers = {
  Authorization: `Bearer ${(await signedIn.json()).token}`,
  'X-Spree-Store-Id': credentials.store_id,
  'Content-Type': 'application/json',
}

const existing = await (
  await fetch(`${API}/api/v3/admin/webhook_endpoints?limit=100`, { headers })
).json()
for (const endpoint of existing.data.filter((item) => item.url === url)) {
  await fetch(`${API}/api/v3/admin/webhook_endpoints/${endpoint.id}`, { method: 'DELETE', headers })
}

const created = await fetch(`${API}/api/v3/admin/webhook_endpoints`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'Storefront order emails',
    url,
    subscriptions: ['order.placed', 'order.canceled', 'order.fulfilled'],
  }),
})
if (created.status !== 201) throw new Error(`Creating the endpoint: ${created.status}`)
const endpoint = await created.json()
writeFileSync(target, endpoint.secret_key, { mode: 0o600 })
console.log(`Created ${endpoint.id} for ${url}`)
