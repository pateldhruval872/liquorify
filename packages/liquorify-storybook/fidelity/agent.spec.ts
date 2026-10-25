import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { LOCAL_ADDRESS, markLocalAddresses, paintOut } from './developers'
import { Receiver } from './receiver'
import { openRowMenu } from './staff'

/**
 * The agent server, for the platform batch's step P2 (CAP-04-07, DA-SET-07).
 * Spree's browser-test server does not load the agent server gem, so this runs
 * against the gem's own test app (`spree/mcp`, `rake test_app`), given Spree's
 * seeds and a first admin through Spree's own seed settings, `ADMIN_EMAIL` and
 * `ADMIN_PASSWORD`, as P1 did for tracing. Start that app on port 3050 with
 * `SPREE_DASHBOARD_URL=http://localhost:5175`, serve the built dashboard on
 * port 5175 against it, and pass the admin as `AGENT_ADMIN_EMAIL` and
 * `AGENT_ADMIN_PASSWORD`.
 *
 * As the admin, the script connects Claude on the AI agents screen, as a
 * merchant does before running the command the screen shows, and then stands
 * in for Claude's terminal client: it calls the address the screen shows
 * without a token, follows the challenge to Spree's discovery documents, and
 * starts the authorization code flow with PKCE, asking to view and manage
 * products. On the consent page the admin allows viewing only. With the token
 * it exchanges, it starts a session, lists the tools, reads a product it
 * created through the Admin API, and calls a tool and a resource outside the
 * grant, and a products import through a tool every grant that reads is
 * offered. Last, the admin revokes the connection on the AI agents screen.
 *
 * Codes, verifiers, tokens and the password stay in memory. Results go to
 * `results/p2/`: statuses, tool names, error texts and field names.
 *
 * A control: `AGENT_INJECT_500` names calls (`orders`, `unknown-tool`,
 * `import`, comma separated) that answer as a failing server would, with HTTP
 * 500 and a JSON-RPC error mentioning a permission check, without reaching
 * the server. The test must then fail. Its results go to
 * `results/p2-controls/`.
 */

const DASHBOARD = process.env.AGENT_DASHBOARD_URL ?? 'http://localhost:5175'
const EMAIL = process.env.AGENT_ADMIN_EMAIL ?? ''
const PASSWORD = process.env.AGENT_ADMIN_PASSWORD ?? ''
const PORT = 4414
const callback = `http://127.0.0.1:${PORT}/callback`
const requested = 'read_products write_products'
const injected = new Set((process.env.AGENT_INJECT_500 ?? '').split(',').filter(Boolean))
const results = new URL(injected.size ? './results/p2-controls/' : './results/p2/', import.meta.url)
  .pathname
const run = Date.now()

const receiver = new Receiver(PORT)

test.beforeAll(() => receiver.start())
test.afterAll(() => receiver.stop())

type Json = Record<string, unknown>

/** One JSON-RPC message to the agent server, as a client sends it. */
async function rpc(
  endpoint: string,
  token: string | null,
  method: string,
  params?: Json,
  control?: string,
) {
  const message: Json = { jsonrpc: '2.0', id: randomBytes(4).toString('hex'), method }
  if (params) message.params = params
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res =
    control && injected.has(control)
      ? new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32603, message: 'Internal error', data: 'The permission check failed' },
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      : await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(message) })
  const text = await res.text()
  return {
    status: res.status,
    challenge: res.headers.get('www-authenticate'),
    body: (text ? JSON.parse(text) : {}) as Json,
  }
}

/** A tool call's answer: its HTTP status, then the JSON the tool returned or the protocol error. */
function answerOf(response: { status: number; body: Json }) {
  const result = response.body.result as { content?: { text?: string }[]; isError?: boolean }
  if (!result) return { status: response.status, error: response.body.error as Json }
  const text = result.content?.[0]?.text ?? ''
  let parsed: unknown = text
  try {
    parsed = JSON.parse(text)
  } catch {}
  return { status: response.status, isError: result.isError ?? false, answer: parsed }
}

const challengeNamesMetadata = (challenge: string | null) =>
  /resource_metadata="[^"]*\/api\/v3\/oauth\/protected-resource\/admin"/.test(challenge ?? '')

async function signIn(page: Page) {
  const res = await page.request.post(`${DASHBOARD}/api/v3/admin/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  })
  expect(res.ok()).toBe(true)
  const { token } = (await res.json()) as { token: string }
  await page.goto(`${DASHBOARD}/`)
  await expect(page).toHaveURL(/\/store_[^/]+/, { timeout: 15_000 })
  const store = new URL(page.url()).pathname.split('/')[1]
  return { token, store }
}

test('an agent connected on the AI agents screen uses the agent server within its grant', async ({
  page,
}) => {
  test.skip(
    !EMAIL || !PASSWORD,
    'Pass the test app admin as AGENT_ADMIN_EMAIL and AGENT_ADMIN_PASSWORD',
  )
  mkdirSync(results, { recursive: true })
  const { token: adminToken, store } = await signIn(page)

  // A product for the read tool to find, created as the admin.
  const productName = `P2 agent product ${run}`
  const created = await fetch(`${DASHBOARD}/api/v3/admin/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'X-Spree-Store-Id': store,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: productName }),
  })
  expect(created.status).toBe(201)
  const product = (await created.json()) as { id: string }

  // Connect Claude on the AI agents screen.
  await page.goto(`${DASHBOARD}/${store}/settings/ai-agents`)
  await page.getByRole('button', { name: 'Connect an agent', exact: true }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(sheet.getByText('Claude is ready to connect')).toBeVisible({ timeout: 15_000 })
  const codes = sheet.locator('code')
  const endpoint = ((await codes.nth(0).textContent()) ?? '').trim()
  const clientId = ((await codes.nth(1).textContent()) ?? '').trim()
  expect(new URL(endpoint).pathname).toBe('/api/v3/admin/mcp')
  expect(clientId.length).toBeGreaterThan(10)
  await markLocalAddresses(page)
  writeFileSync(
    `${results}agent-connect-sheet.png`,
    await page.screenshot({ style: paintOut(LOCAL_ADDRESS) }),
  )
  await sheet.getByRole('button', { name: 'Done', exact: true }).click()

  // The client's first call, without a token, and the discovery it leads to.
  const anonymous = await rpc(endpoint, null, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'liquorify-p2', version: '1' },
  })
  const metadataUrl = /resource_metadata="([^"]+)"/.exec(anonymous.challenge ?? '')?.[1] ?? ''
  const resourceMetadata = (await (await fetch(metadataUrl)).json()) as {
    resource: string
    authorization_servers: string[]
    scopes_supported: string[]
  }
  const server = (await (
    await fetch(
      `${resourceMetadata.authorization_servers[0]}/.well-known/oauth-authorization-server`,
    )
  ).json()) as { authorization_endpoint: string; token_endpoint: string }

  // Authorize, allowing viewing products and withholding managing them.
  const verifier = randomBytes(48).toString('base64url')
  const state = randomBytes(12).toString('base64url')
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    response_type: 'code',
    scope: requested,
    state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    resource: resourceMetadata.resource,
  })
  await page.goto(`${server.authorization_endpoint}?${query}`)
  await expect(page.getByText('Claude wants access to this store')).toBeVisible({ timeout: 15_000 })
  const allow = page.getByRole('button', { name: 'Allow access', exact: true })
  await expect(allow).toBeEnabled()
  const manage = page.getByRole('checkbox', { name: 'Manage Products', exact: true })
  await expect(manage).toBeChecked()
  await manage.click()
  await expect(manage).not.toBeChecked()
  writeFileSync(`${results}agent-consent.png`, await page.screenshot())
  const since = Date.now()
  await allow.click()
  const approval = (await receiver.next((item) => item.path === '/callback', 30_000, since)).query
  await expect(page.getByText('Received')).toBeVisible()

  const exchanged = await fetch(server.token_endpoint, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: approval.get('code') ?? '',
      client_id: clientId,
      redirect_uri: callback,
      code_verifier: verifier,
    }),
  })
  const grant = (await exchanged.json()) as Json
  const token = String(grant.access_token ?? '')

  // The session, the tool list, a read, and calls outside the grant.
  const initialized = await rpc(endpoint, token, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'liquorify-p2', version: '1' },
  })
  const tools = await rpc(endpoint, token, 'tools/list')
  const toolNames = ((tools.body.result as { tools?: { name: string }[] })?.tools ?? [])
    .map((tool) => tool.name)
    .sort()
  const search = {
    name: 'search_resources',
    arguments: { resource: 'products', filters: { name_cont: productName } },
  }
  const read = answerOf(await rpc(endpoint, token, 'tools/call', search))
  const readRecords = ((read.answer as { records?: Json[] })?.records ?? []) as Json[]
  const ordersOutsideGrant = answerOf(
    await rpc(
      endpoint,
      token,
      'tools/call',
      { name: 'search_resources', arguments: { resource: 'orders' } },
      'orders',
    ),
  )
  const toolOutsideGrant = answerOf(
    await rpc(
      endpoint,
      token,
      'tools/call',
      {
        name: 'upload_file',
        arguments: { filename: 'p2.txt', content_type: 'text/plain', content: 'cDI=' },
      },
      'unknown-tool',
    ),
  )
  // Offered to any grant that reads, and checked against the grant on each call.
  const importOutsideGrant = answerOf(
    await rpc(
      endpoint,
      token,
      'tools/call',
      { name: 'create_import', arguments: { resource: 'products', file_id: 'p2-none' } },
      'import',
    ),
  )
  const readWithoutToken = await rpc(endpoint, null, 'tools/call', search)

  // The connection on the AI agents screen, then revoked there.
  await page.goto(`${DASHBOARD}/${store}/settings/ai-agents`)
  const row = page.locator('tbody tr').filter({ hasText: EMAIL })
  await expect(row).toBeVisible({ timeout: 15_000 })
  const listedAccess = ((await row.locator('td').nth(1).textContent()) ?? '').trim()
  await page.mouse.move(0, 0)
  writeFileSync(`${results}agent-connection-listed.png`, await page.screenshot())
  await openRowMenu(page, EMAIL)
  await page.getByRole('menuitem', { name: 'Revoke access' }).click()
  await page
    .getByRole('dialog')
    .filter({ hasText: 'Revoke access?' })
    .getByRole('button', { name: 'Revoke access', exact: true })
    .click()
  await expect(row).toHaveCount(0, { timeout: 15_000 })
  const afterRevoking = await rpc(endpoint, token, 'tools/list')

  const summary = {
    check: 'P2 criterion 4: the agent server, connected on DA-SET-07',
    revision: process.env.FIDELITY_REVISION ?? null,
    control: injected.size ? { injected500: [...injected].sort() } : null,
    connect: {
      client: 'Claude, chosen on the connect sheet',
      endpointPath: new URL(endpoint).pathname,
      callback: 'A loopback address on this machine, over plain http, as a terminal client uses',
    },
    discovery: {
      withoutToken: {
        status: anonymous.status,
        challengeNamesMetadata: challengeNamesMetadata(anonymous.challenge),
        message: (anonymous.body.error as Json | undefined)?.message,
      },
      resourcePath: new URL(resourceMetadata.resource).pathname,
      scopesSupported: resourceMetadata.scopes_supported.length,
      authorizationEndpointPath: new URL(server.authorization_endpoint).pathname,
    },
    consent: {
      requested: requested.split(' '),
      withheldOnThePage: 'write_products',
      callbackParameters: [...approval.keys()].sort(),
      stateReturnedUnchanged: approval.get('state') === state,
    },
    exchange: {
      status: exchanged.status,
      fields: Object.keys(grant).sort(),
      token_type: grant.token_type,
      scope: grant.scope,
    },
    session: {
      status: initialized.status,
      toolsListStatus: tools.status,
      protocolVersion: (initialized.body.result as Json | undefined)?.protocolVersion,
      serverName: ((initialized.body.result as Json | undefined)?.serverInfo as Json | undefined)
        ?.name,
      offersTools: Boolean(
        ((initialized.body.result as Json | undefined)?.capabilities as Json | undefined)?.tools,
      ),
    },
    toolsOffered: toolNames,
    readTool: {
      call: search,
      status: read.status,
      isError: read.isError,
      total: (read.answer as Json | undefined)?.total,
      foundTheProduct: readRecords.some((record) => record.id === product.id),
      recordFields: Object.keys(readRecords[0] ?? {}).sort(),
    },
    outsideTheGrant: {
      ordersThroughTheSearchTool: ordersOutsideGrant,
      toolNotOffered: { tool: 'upload_file', ...toolOutsideGrant },
      productsImportThroughAnOfferedTool: importOutsideGrant,
    },
    readToolWithoutToken: {
      status: readWithoutToken.status,
      challengeNamesMetadata: challengeNamesMetadata(readWithoutToken.challenge),
      message: (readWithoutToken.body.error as Json | undefined)?.message,
    },
    agentsScreen: {
      connectionListedWithAccess: listedAccess,
      toolsListAfterRevoking: {
        status: afterRevoking.status,
        challengeNamesMetadata: challengeNamesMetadata(afterRevoking.challenge),
        message: (afterRevoking.body.error as Json | undefined)?.message,
      },
    },
  }
  writeFileSync(`${results}agent.json`, `${JSON.stringify(summary, null, 2)}\n`)

  const signInRequired = (anonymous.body.error as Json | undefined)?.message
  expect(anonymous.status).toBe(401)
  expect(summary.discovery.withoutToken.challengeNamesMetadata).toBe(true)
  expect(signInRequired).toMatch(/^Sign in to this store to continue\./)
  expect(summary.consent.stateReturnedUnchanged).toBe(true)
  expect(exchanged.status).toBe(200)
  expect(grant.scope).toBe('read_products')
  expect(initialized.status).toBe(200)
  expect(summary.session.serverName).toBe('spree-admin')
  expect(tools.status).toBe(200)
  expect(toolNames).toContain('search_resources')
  expect(toolNames).not.toContain('upload_file')
  expect(read).toMatchObject({ status: 200, isError: false })
  expect(summary.readTool.foundTheProduct).toBe(true)
  // Each refusal exactly as the agent server words it, at the status it uses.
  expect(ordersOutsideGrant).toEqual({
    status: 200,
    isError: true,
    answer: 'You do not have permission to read orders.',
  })
  expect(toolOutsideGrant).toEqual({
    status: 200,
    error: { code: -32602, message: 'Invalid params', data: 'Tool not found: upload_file' },
  })
  expect(importOutsideGrant).toEqual({
    status: 200,
    isError: true,
    answer: 'You do not have permission to import products.',
  })
  for (const refused of [readWithoutToken, afterRevoking]) {
    expect(refused.status).toBe(401)
    expect(challengeNamesMetadata(refused.challenge)).toBe(true)
    expect((refused.body.error as Json | undefined)?.message).toBe(signInRequired)
  }
})
