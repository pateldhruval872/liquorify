import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'
import { PASSWORD, pendingEmail, roles, seed, teammates } from './staff'

/**
 * Sends each staff and roles request the interface offers, as teammates whose
 * roles do not allow it, to the running browser-test server, and records the
 * status the server answers with. It is an observation of the server at the
 * revision under test, recorded beside Spree's own specs and never in place of
 * them (LIQ-010 §12.1, step 5). Every write it sends is expected to be
 * refused; one that is not is recorded as it happened, and the run fails.
 *
 * Start the screens as `compare.spec.ts` describes. It adds the staff and
 * roles it needs first (`staff.ts`). Results go to `results/refusals.json`,
 * with no response bodies and no tokens.
 */

const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

interface Attempt {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  data?: Record<string, unknown>
}

interface Outcome {
  teammate: string
  permissionKeys: string[]
  request: string
  status: number
  code: string | null
  requiredPermission: string | null
}

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

async function send(api: APIRequestContext, headers: Record<string, string>, attempt: Attempt) {
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

test('staff and roles requests a role does not allow are refused', async ({ request, baseURL }) => {
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

  const writes: Attempt[] = [
    {
      method: 'POST',
      path: '/api/v3/admin/invitations',
      data: { email: 'fidelity-refused@example.com', role_id: role.id },
    },
    { method: 'PATCH', path: `/api/v3/admin/invitations/${invitation.id}/resend` },
    { method: 'GET', path: `/api/v3/admin/invitations/${invitation.id}/acceptance_link` },
    { method: 'DELETE', path: `/api/v3/admin/invitations/${invitation.id}` },
    {
      method: 'PATCH',
      path: `/api/v3/admin/admin_users/${member.id}`,
      data: { first_name: 'Refused' },
    },
    { method: 'DELETE', path: `/api/v3/admin/admin_users/${member.id}` },
    {
      method: 'POST',
      path: '/api/v3/admin/roles',
      data: { name: 'Refused role', permissions: ['read_orders'] },
    },
    { method: 'PATCH', path: `/api/v3/admin/roles/${role.id}`, data: { description: 'Refused' } },
    { method: 'DELETE', path: `/api/v3/admin/roles/${role.id}` },
  ]
  const reads: Attempt[] = [
    { method: 'GET', path: '/api/v3/admin/admin_users' },
    { method: 'GET', path: '/api/v3/admin/invitations' },
    { method: 'GET', path: '/api/v3/admin/roles' },
  ]

  // The staff viewer may read staff but not change it; the other two hold no
  // staff key at all, so they may not even read it.
  const plan: [string, Attempt[]][] = [
    ['staffViewer', writes],
    ['support', [...reads, ...writes]],
    ['storeSettings', [...reads, ...writes]],
  ]

  const outcomes: Outcome[] = []
  for (const [variant, attempts] of plan) {
    const teammate = await signIn(request, teammates[variant].email)
    for (const attempt of attempts) {
      const answer = await send(request, teammate.headers, attempt)
      outcomes.push({
        teammate: variant,
        permissionKeys: teammate.keys,
        request: `${attempt.method} ${attempt.path.replace(/\/[a-z]+_[A-Za-z0-9]{6,}/g, '/<id>')}`,
        ...answer,
      })
    }
  }

  mkdirSync(results, { recursive: true })
  writeFileSync(`${results}refusals.json`, JSON.stringify({ revision, outcomes }, null, 2))
  const allowed = outcomes.filter((outcome) => outcome.status < 400)
  expect(allowed, 'every request was refused').toEqual([])
})
