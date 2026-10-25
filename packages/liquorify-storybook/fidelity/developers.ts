import { type APIRequestContext, expect, type Page, request } from '@playwright/test'
import { admin, PASSWORD, teammates } from './staff'

/**
 * The developer and integration settings the batch 2 captures need, added to
 * the browser-test data through the Admin API only: secret keys, one of them
 * revoked; allowed origins; an OAuth client and an agent registration with two
 * people connected, the admin and a teammate who may connect agents; webhook endpoints, one disabled with a reason and one with
 * a test delivery; and a payment method from the test gateway, which has no
 * test mode to switch on. Seeding again reuses them.
 *
 * Every key, token and secret the API answers with is discarded unread. The
 * endpoints point at hosts under `.test`, which never resolve, so a delivery
 * fails without reaching anything.
 */

export const secretKeys = {
  partner: { name: 'Fulfilment partner', scopes: ['read_orders', 'write_orders'] },
  analytics: { name: 'Analytics export', scopes: ['read_all'] },
  revoked: { name: 'Old ERP sync', scopes: ['read_products'] },
} as const

export const origins = ['https://shop.example.com', 'https://wholesale.example.com']

export const client = {
  name: 'Inventory assistant',
  redirect_uri: 'https://assistant.example.test/oauth/callback',
}

/** Registered as the connect sheet registers Claude (`mcp-connect-sheet.tsx`). */
export const agent = {
  name: 'Claude',
  callback: 'https://claude.ai/api/mcp/auth_callback',
  redirect_uri: 'https://claude.ai/api/mcp/auth_callback\nhttp://127.0.0.1/callback',
}

export const endpoints = {
  orderSync: {
    name: 'Order sync',
    url: 'https://orders.example.test/webhooks',
    subscriptions: ['order.placed', 'order.canceled'],
  },
  stockFeed: { name: 'Stock feed', url: 'https://stock.example.test/hooks', subscriptions: [] },
  priceFeed: {
    name: 'Price feed',
    url: 'https://prices.example.test/hooks',
    subscriptions: ['product.updated'],
  },
  legacy: {
    name: 'Legacy ERP',
    url: 'https://erp.example.test/spree',
    subscriptions: ['order.placed'],
  },
} as const

export const disabledReason = 'Paused while the ERP is replaced'

export const gateway = { name: 'Fidelity test gateway' }

/** A fixed verifier and its S256 challenge, as the dashboard's browser tests use. */
export const pkce = {
  verifier: 'v'.repeat(64),
  challenge: 'w1TpKUdYE9hUAcNSeeSRFioHDxfUxuHho_JHAfZ_vDM',
}

export interface Developers {
  endpointIds: Record<keyof typeof endpoints, string>
  agentClientId: string
  gatewayId: string
}

/**
 * Styles for a screenshot's `style` option that paint out every element
 * `selector` matches. Painted in the page rather than over the image, so a
 * sheet or dialog above a painted value still covers it. Transitions are
 * switched off with them: Spree eases colour changes, and a screenshot taken
 * while the text fades could still show it.
 */
export const paintOut = (selector: string) =>
  `${selector}, ${selector} * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; transition: none !important; }
  ${selector} { background: #ff00ff !important; }`

/**
 * Marks every element whose own text names an address on this machine, so a
 * screenshot can paint it out with `paintOut(LOCAL_ADDRESS)`: the records keep
 * no local addresses, and P2's receivers and storefront run on this machine.
 */
export const LOCAL_ADDRESS = '[data-local-address]'

export async function markLocalAddresses(page: Page) {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('body *')) {
      const own = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('')
      if (/localhost|127\.0\.0\.1/.test(own)) element.setAttribute('data-local-address', '')
    }
  })
}

type Headers = Record<string, string>

async function list<T>(api: APIRequestContext, headers: Headers, path: string) {
  const res = await api.get(`/api/v3/admin/${path}${path.includes('?') ? '&' : '?'}limit=100`, {
    headers,
  })
  expect(res.ok(), `listing ${path}: ${res.status()}`).toBeTruthy()
  return ((await res.json()) as { data: T[] }).data
}

/** Creates a record and answers its id, without keeping anything else it returns. */
async function create(api: APIRequestContext, headers: Headers, path: string, data: object) {
  const res = await api.post(`/api/v3/admin/${path}`, { headers, data })
  // Only the refusal's message, which never carries a credential.
  const refusal =
    res.status() === 201
      ? ''
      : ((await res.json()) as { error?: { message?: string } }).error?.message
  expect(res.status(), `creating in ${path}: ${res.status()} ${refusal}`).toBe(201)
  return ((await res.json()) as { id: string }).id
}

/**
 * Approves `scope` for the client on behalf of whoever `headers` signs in, and
 * exchanges the code, as an agent does. The token is discarded unread.
 */
async function connect(api: APIRequestContext, headers: Headers, clientId: string, scope: string) {
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: agent.callback,
    response_type: 'code',
    scope,
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })
  const approved = await api.post(`/api/v3/admin/oauth/authorize?${query}`, { headers })
  expect(approved.ok(), `approving: ${approved.status()}`).toBeTruthy()
  const code = new URL(
    ((await approved.json()) as { redirect_uri: string }).redirect_uri,
  ).searchParams.get('code')
  // Straight to Rails: the token endpoint sits outside `/api`, the only prefix
  // the dashboard's server forwards.
  const exchanged = await api.post('http://localhost:3010/oauth/token', {
    form: {
      grant_type: 'authorization_code',
      code: code ?? '',
      client_id: clientId,
      redirect_uri: agent.callback,
      code_verifier: pkce.verifier,
    },
  })
  expect(exchanged.ok(), `exchanging the code: ${exchanged.status()}`).toBeTruthy()
}

async function signedIn(api: APIRequestContext, email: string, storeId: string) {
  const res = await api.post('/api/v3/admin/auth/login', { data: { email, password: PASSWORD } })
  expect(res.ok(), `signing in ${email}: ${res.status()}`).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  return { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': storeId }
}

export async function seedDevelopers(baseURL: string): Promise<Developers> {
  const api = await request.newContext({ baseURL })
  try {
    const { creds, headers } = await admin(api)

    const keys = await list<{ id: string; name: string; revoked_at: string | null }>(
      api,
      headers,
      'api_keys',
    )
    for (const key of Object.values(secretKeys)) {
      if (keys.some((item) => item.name === key.name)) continue
      await create(api, headers, 'api_keys', { ...key, key_type: 'secret' })
    }
    const revoked = (
      await list<{ id: string; name: string; revoked_at: string | null }>(api, headers, 'api_keys')
    ).find((item) => item.name === secretKeys.revoked.name)
    if (revoked && !revoked.revoked_at) {
      const res = await api.patch(`/api/v3/admin/api_keys/${revoked.id}/revoke`, { headers })
      expect(res.ok(), `revoking: ${res.status()}`).toBeTruthy()
    }

    const allowed = await list<{ origin: string }>(api, headers, 'allowed_origins')
    for (const origin of origins) {
      if (allowed.some((item) => item.origin === origin)) continue
      await create(api, headers, 'allowed_origins', { origin })
    }

    const applications = await list<{ id: string; name: string; client_id: string }>(
      api,
      headers,
      'oauth/applications',
    )
    if (!applications.some((item) => item.name === client.name)) {
      await create(api, headers, 'oauth/applications', client)
    }
    let registration = applications.find((item) => item.name === agent.name)
    if (!registration) {
      const id = await create(api, headers, 'oauth/applications', {
        name: agent.name,
        redirect_uri: agent.redirect_uri,
      })
      registration = (
        await list<{ id: string; name: string; client_id: string }>(
          api,
          headers,
          'oauth/applications',
        )
      ).find((item) => item.id === id)
    }
    const agentClientId = registration?.client_id as string
    const tokens = await list<{ owner_id: string | null; expired: boolean }>(
      api,
      headers,
      `oauth/applications/${registration?.id}/tokens`,
    )
    const connector = teammates.agentConnector
    const people = await list<{ id: string; email: string }>(api, headers, 'admin_users')
    const live = (email: string) =>
      tokens.some(
        (token) =>
          !token.expired && token.owner_id === people.find((item) => item.email === email)?.id,
      )
    if (!live(creds.admin_email)) {
      await connect(api, headers, agentClientId, 'read_products read_orders write_orders')
    }
    if (!live(connector.email)) {
      await connect(
        api,
        await signedIn(api, connector.email, creds.store_id),
        agentClientId,
        'read_products',
      )
    }

    const existing = await list<{ id: string; name: string; disabled_at: string | null }>(
      api,
      headers,
      'webhook_endpoints',
    )
    const endpointIds = {} as Record<keyof typeof endpoints, string>
    for (const [key, endpoint] of Object.entries(endpoints) as [
      keyof typeof endpoints,
      (typeof endpoints)[keyof typeof endpoints],
    ][]) {
      endpointIds[key] =
        existing.find((item) => item.name === endpoint.name)?.id ??
        (await create(api, headers, 'webhook_endpoints', endpoint))
    }
    if (!existing.find((item) => item.name === endpoints.legacy.name)?.disabled_at) {
      const res = await api.patch(`/api/v3/admin/webhook_endpoints/${endpointIds.legacy}/disable`, {
        headers,
        data: { reason: disabledReason },
      })
      expect(res.ok(), `disabling: ${res.status()}`).toBeTruthy()
    }
    const deliveries = await list(
      api,
      headers,
      `webhook_endpoints/${endpointIds.orderSync}/deliveries`,
    )
    if (deliveries.length === 0) {
      const res = await api.post(
        `/api/v3/admin/webhook_endpoints/${endpointIds.orderSync}/send_test`,
        {
          headers,
        },
      )
      expect(res.ok(), `sending a test: ${res.status()}`).toBeTruthy()
    }

    const methods = await list<{ id: string; name: string }>(api, headers, 'payment_methods')
    const gatewayId =
      methods.find((item) => item.name === gateway.name)?.id ??
      (await create(api, headers, 'payment_methods', {
        type: 'bogus',
        name: gateway.name,
        active: true,
      }))

    return { endpointIds, agentClientId, gatewayId }
  } finally {
    await api.dispose()
  }
}

/**
 * Puts the test app's own integration, E2E Relay, in the state a capture
 * shows: not connected, connected, or connected and switched off.
 */
export async function setRelay(baseURL: string, state: 'none' | 'active' | 'inactive') {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const found = (await list<{ id: string; type: string }>(api, headers, 'integrations')).find(
      (item) => item.type === 'e2e_relay',
    )
    if (state === 'none') {
      if (found) {
        const res = await api.delete(`/api/v3/admin/integrations/${found.id}`, { headers })
        expect(res.ok(), `disconnecting: ${res.status()}`).toBeTruthy()
      }
      return
    }
    const active = state === 'active'
    if (found) {
      const res = await api.patch(`/api/v3/admin/integrations/${found.id}`, {
        headers,
        data: { active },
      })
      expect(res.ok(), `switching: ${res.status()}`).toBeTruthy()
      return
    }
    await create(api, headers, 'integrations', {
      type: 'e2e_relay',
      active,
      preferences: { account_id: 'sample-account', api_secret: 'sample-relay-secret-0000' },
    })
  } finally {
    await api.dispose()
  }
}

/** Switches the seeded test gateway on or off. */
export async function setGateway(baseURL: string, id: string, active: boolean) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const res = await api.patch(`/api/v3/admin/payment_methods/${id}`, {
      headers,
      data: { active },
    })
    expect(res.ok(), `switching the gateway: ${res.status()}`).toBeTruthy()
  } finally {
    await api.dispose()
  }
}

/** Deletes records a capture made through the screen, by name. */
export async function removeNamed(baseURL: string, path: string, name: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    for (const item of await list<{ id: string; name: string }>(api, headers, path)) {
      if (item.name !== name) continue
      const res = await api.delete(`/api/v3/admin/${path}/${item.id}`, { headers })
      expect(res.ok(), `removing from ${path}: ${res.status()}`).toBeTruthy()
    }
  } finally {
    await api.dispose()
  }
}
