import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { type APIRequestContext, expect, request as playwright, test } from '@playwright/test'
import { PASSWORD, pendingEmail, roles, seed, teammates } from './staff'

/**
 * Sends each staff and roles request the interface offers, and each command
 * palette search, as teammates whose roles do not allow it, to the running
 * browser-test server, and records what the server answers. It is an
 * observation of the server at the revision under test, recorded beside
 * Spree's own specs and never in place of them (LIQ-010 §12.1, step 5). Each request names the refusal it expects: the status, the
 * error code and, for a 403, the permission the answer says is missing. Any
 * other answer fails the run, a server error or a success included, and is
 * recorded as it happened.
 *
 * Start the screens as `compare.spec.ts` describes. It adds the staff and
 * roles it needs first (`staff.ts`). Results go to `results/refusals.json`,
 * with no response bodies and no tokens; the searches' to
 * `results/refusals-search.json`. The last test checks the check itself
 * against a stub server and needs nothing running.
 */

const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

interface Answer {
  status: number
  code: string | null
  requiredPermission: string | null
}

const denied = (permission: string): Answer => ({
  status: 403,
  code: 'access_denied',
  requiredPermission: permission,
})
const notFound: Answer = { status: 404, code: 'record_not_found', requiredPermission: null }

interface Attempt {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  data?: Record<string, unknown>
  /** The refusal for a teammate who may read staff but not change it. */
  withoutWrite?: Answer
  /** The refusal for a teammate who holds no staff permission at all. */
  withoutRead: Answer
}

interface Outcome extends Answer {
  teammate: string
  permissionKeys: string[]
  request: string
  expected: Answer
  asExpected: boolean
}

const matches = (answer: Answer, expected: Answer) =>
  answer.status === expected.status &&
  answer.code === expected.code &&
  answer.requiredPermission === expected.requiredPermission

async function signIn(api: APIRequestContext, email: string) {
  const res = await api.post('/api/v3/admin/auth/login', { data: { email, password: PASSWORD } })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  const me = await api.get('/api/v3/admin/me', { headers: { Authorization: `Bearer ${token}` } })
  const body = (await me.json()) as {
    user: { stores: { id: string }[] }
    permission_keys: string[]
  }
  return {
    keys: body.permission_keys,
    headers: { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': body.user.stores[0].id },
  }
}

async function send(
  api: APIRequestContext,
  headers: Record<string, string>,
  attempt: Pick<Attempt, 'method' | 'path' | 'data'>,
): Promise<Answer> {
  const res = await api.fetch(attempt.path, { method: attempt.method, headers, data: attempt.data })
  const body = (await res.json().catch(() => null)) as {
    error?: { code?: string; details?: { required_permission?: string } }
  } | null
  return {
    status: res.status(),
    code: body?.error?.code ?? null,
    requiredPermission: body?.error?.details?.required_permission ?? null,
  }
}

test('each request a role does not allow gets its expected refusal', async ({
  request,
  baseURL,
}) => {
  await seed(baseURL ?? 'http://localhost:5174')

  // Ids of records to aim at, read as the store's admin would see them.
  const viewer = await signIn(request, teammates.staffViewer.email)
  const list = async (path: string) =>
    (
      (await (await request.get(path, { headers: viewer.headers })).json()) as {
        data: { id: string; email?: string; name?: string }[]
      }
    ).data
  const invitation = (await list('/api/v3/admin/invitations?limit=100')).find(
    (item) => item.email === pendingEmail,
  )
  const member = (await list('/api/v3/admin/admin_users?limit=100')).find(
    (item) => item.email === teammates.support.email,
  )
  const role = (await list('/api/v3/admin/roles?limit=100')).find(
    (item) => item.name === roles.support.name,
  )
  if (!invitation || !member || !role) throw new Error('The seeded staff and roles are missing')

  // Spree answers some of these 404 for a teammate who cannot read staff, and
  // the rest 403 naming the missing permission. Both are refusals; each is
  // expected exactly as the server at `a4a1708` answered it.
  const writes: Attempt[] = [
    {
      method: 'POST',
      path: '/api/v3/admin/invitations',
      data: { email: 'fidelity-refused@example.com', role_id: role.id },
      withoutWrite: denied('write_staff'),
      withoutRead: denied('write_staff'),
    },
    {
      method: 'PATCH',
      path: `/api/v3/admin/invitations/${invitation.id}/resend`,
      withoutWrite: denied('write_staff'),
      withoutRead: denied('write_staff'),
    },
    {
      method: 'GET',
      path: `/api/v3/admin/invitations/${invitation.id}/acceptance_link`,
      withoutWrite: denied('write_staff'),
      withoutRead: denied('write_staff'),
    },
    {
      method: 'DELETE',
      path: `/api/v3/admin/invitations/${invitation.id}`,
      withoutWrite: denied('write_staff'),
      withoutRead: notFound,
    },
    {
      method: 'PATCH',
      path: `/api/v3/admin/admin_users/${member.id}`,
      data: { first_name: 'Refused' },
      withoutWrite: denied('write_staff'),
      withoutRead: notFound,
    },
    {
      method: 'DELETE',
      path: `/api/v3/admin/admin_users/${member.id}`,
      withoutWrite: denied('write_staff'),
      withoutRead: notFound,
    },
    {
      method: 'POST',
      path: '/api/v3/admin/roles',
      data: { name: 'Refused role', permissions: ['read_orders'] },
      withoutWrite: denied('write_staff'),
      withoutRead: denied('write_staff'),
    },
    {
      method: 'PATCH',
      path: `/api/v3/admin/roles/${role.id}`,
      data: { description: 'Refused' },
      withoutWrite: denied('write_staff'),
      withoutRead: notFound,
    },
    {
      method: 'DELETE',
      path: `/api/v3/admin/roles/${role.id}`,
      withoutWrite: denied('write_staff'),
      withoutRead: notFound,
    },
  ]
  const reads: Attempt[] = [
    { method: 'GET', path: '/api/v3/admin/admin_users', withoutRead: denied('read_staff') },
    { method: 'GET', path: '/api/v3/admin/invitations', withoutRead: denied('read_staff') },
    { method: 'GET', path: '/api/v3/admin/roles', withoutRead: denied('read_staff') },
  ]

  // The staff viewer may read staff but not change it; the other two hold no
  // staff key at all, so they may not even read it.
  const plan: [string, 'withoutWrite' | 'withoutRead', Attempt[]][] = [
    ['staffViewer', 'withoutWrite', writes],
    ['support', 'withoutRead', [...reads, ...writes]],
    ['storeSettings', 'withoutRead', [...reads, ...writes]],
  ]

  const outcomes: Outcome[] = []
  for (const [variant, holds, attempts] of plan) {
    const teammate = await signIn(request, teammates[variant].email)
    for (const attempt of attempts) {
      const expected = attempt[holds]
      if (!expected) throw new Error(`No refusal is expected for ${variant}: ${attempt.path}`)
      const answer = await send(request, teammate.headers, attempt)
      outcomes.push({
        teammate: variant,
        permissionKeys: teammate.keys,
        request: `${attempt.method} ${attempt.path.replace(/\/[a-z]+_[A-Za-z0-9]{6,}/g, '/<id>')}`,
        ...answer,
        expected,
        asExpected: matches(answer, expected),
      })
    }
  }

  mkdirSync(results, { recursive: true })
  writeFileSync(`${results}refusals.json`, JSON.stringify({ revision, outcomes }, null, 2))
  const unexpected = outcomes.filter((outcome) => !outcome.asExpected)
  expect(unexpected, 'every request got exactly its expected refusal').toEqual([])
})

/**
 * The command palette searches every kind of record the reader may read
 * (DA-OVL-02), one list request each, and leaves out the rest. Sends all nine
 * searches as teammates with narrow roles: each one the role may read is
 * answered, and each one it may not is refused with the read permission it
 * lacks, exactly as the server at `a4a1708` answered. Results go to
 * `results/refusals-search.json`.
 */
test('each palette search is answered or refused as the role allows', async ({
  request,
  baseURL,
}) => {
  await seed(baseURL ?? 'http://localhost:5174')
  const searches: [resource: string, permission: string][] = [
    ['products', 'read_products'],
    ['categories', 'read_categories'],
    ['collections', 'read_collections'],
    ['orders', 'read_orders'],
    ['customers', 'read_customers'],
    ['customer_groups', 'read_customers'],
    ['companies', 'read_customers'],
    ['sellers', 'read_sellers'],
    ['promotions', 'read_promotions'],
  ]
  const allowed: Answer = { status: 200, code: null, requiredPermission: null }

  const outcomes: Outcome[] = []
  for (const variant of ['staffViewer', 'support', 'orderManager', 'merchandiser'] as const) {
    const teammate = await signIn(request, teammates[variant].email)
    for (const [resource, permission] of searches) {
      const path = `/api/v3/admin/${resource}?q[search]=e2e&limit=5`
      const expected = teammate.keys.includes(permission) ? allowed : denied(permission)
      const answer = await send(request, teammate.headers, { method: 'GET', path })
      outcomes.push({
        teammate: variant,
        permissionKeys: teammate.keys,
        request: `GET ${path}`,
        ...answer,
        expected,
        asExpected: matches(answer, expected),
      })
    }
  }

  mkdirSync(results, { recursive: true })
  writeFileSync(`${results}refusals-search.json`, JSON.stringify({ revision, outcomes }, null, 2))
  const unexpected = outcomes.filter((outcome) => !outcome.asExpected)
  expect(unexpected, 'every search got exactly its expected answer').toEqual([])
})

test('the check fails any answer but the expected refusal', async () => {
  const answers: Record<string, { status: number; body: string }> = {
    '/expected': {
      status: 403,
      body: JSON.stringify({
        error: { code: 'access_denied', details: { required_permission: 'write_staff' } },
      }),
    },
    '/server-error': {
      status: 500,
      body: JSON.stringify({ error: { code: 'internal_server_error' } }),
    },
    '/server-error-page': { status: 500, body: '<html>We are sorry</html>' },
    '/allowed': { status: 200, body: '{}' },
    '/created': { status: 201, body: '{}' },
    '/other-code': { status: 403, body: JSON.stringify({ error: { code: 'invalid_token' } }) },
    '/other-permission': {
      status: 403,
      body: JSON.stringify({
        error: { code: 'access_denied', details: { required_permission: 'read_staff' } },
      }),
    },
    '/not-found': { status: 404, body: JSON.stringify({ error: { code: 'record_not_found' } }) },
    '/unauthorized': { status: 401, body: JSON.stringify({ error: { code: 'invalid_token' } }) },
  }
  const stub = createServer((req, res) => {
    const answer = answers[req.url ?? ''] ?? { status: 418, body: '' }
    res.writeHead(answer.status, { 'Content-Type': 'application/json' }).end(answer.body)
  })
  await new Promise<void>((resolve) => stub.listen(0, '127.0.0.1', resolve))
  const api = await playwright.newContext({
    baseURL: `http://127.0.0.1:${(stub.address() as AddressInfo).port}`,
  })
  try {
    const expected = denied('write_staff')
    const judged: Record<string, boolean> = {}
    for (const path of Object.keys(answers)) {
      judged[path] = matches(await send(api, {}, { method: 'DELETE', path }), expected)
    }
    expect(judged).toEqual({
      '/expected': true,
      '/server-error': false,
      '/server-error-page': false,
      '/allowed': false,
      '/created': false,
      '/other-code': false,
      '/other-permission': false,
      '/not-found': false,
      '/unauthorized': false,
    })
  } finally {
    await api.dispose()
    stub.close()
  }
})
