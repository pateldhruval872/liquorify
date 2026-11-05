import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * Builds or starts the storefront against Spree's browser-test server, giving
 * it the server's address and the default store's publishable key as
 * settings, read from the Admin API as the admin. Nothing is printed or
 * written that the key could be read from: no settings file, no log line.
 *
 *   node fidelity/storefront-run.mjs build   # next build, in STOREFRONT_DIR
 *   node fidelity/storefront-run.mjs start   # next start on port 3001
 *
 * `SPREE_API_URL` defaults to the browser-test server, http://localhost:3010.
 */

const mode = process.argv[2]
if (!['build', 'start'].includes(mode)) throw new Error('Say build or start')
const dir = process.env.STOREFRONT_DIR
if (!dir) throw new Error("Set STOREFRONT_DIR to the storefront's checkout")
const api = process.env.SPREE_API_URL ?? 'http://localhost:3010'

const credentials = JSON.parse(
  readFileSync(new URL('../../dashboard/e2e/.credentials.json', import.meta.url), 'utf8'),
)
const signedIn = await fetch(`${api}/api/v3/admin/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: credentials.admin_email, password: credentials.admin_password }),
})
if (!signedIn.ok) throw new Error(`Signing in: ${signedIn.status}`)
const headers = {
  Authorization: `Bearer ${(await signedIn.json()).token}`,
  'X-Spree-Store-Id': credentials.store_id,
}
const keys = await (await fetch(`${api}/api/v3/admin/api_keys?limit=100`, { headers })).json()
const key = keys.data.find((item) => item.name === 'Default' && item.key_type === 'publishable')
if (!key?.plaintext_token) throw new Error("The store's publishable key was not found")

const args = mode === 'build' ? ['exec', 'next', 'build'] : ['exec', 'next', 'start', '-p', '3001']
const child = spawn('pnpm', args, {
  cwd: dir,
  stdio: 'inherit',
  env: { ...process.env, SPREE_API_URL: api, SPREE_PUBLISHABLE_KEY: key.plaintext_token },
})
child.on('exit', (code) => process.exit(code ?? 1))
