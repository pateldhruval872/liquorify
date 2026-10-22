import { type APIRequestContext, expect, type Page, request } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'

/**
 * The staff and roles the fidelity scripts add to the browser-test data,
 * through the Admin API only: roles matching the role sheet's three templates
 * and a few custom ones, a teammate holding each, a teammate removed from the
 * store, and two pending invitations. Seeding again reuses them. Nothing in
 * Spree's code, tests or fixtures changes.
 */

export const PASSWORD = 'fidelity-password-123'

/** The role sheet's templates (`role-sheet.tsx`), and custom roles for the other variants. */
export const roles = {
  staffManager: { name: 'Staff manager', permissions: ['write_staff'] },
  staffViewer: { name: 'Staff viewer', permissions: ['read_staff'] },
  storeSettings: { name: 'Store settings', permissions: ['write_settings'] },
  orderManager: {
    name: 'Order manager',
    permissions: [
      'write_orders',
      'write_payments',
      'write_fulfillments',
      'write_refunds',
      'write_gift_cards',
      'write_store_credits',
      'read_customers',
    ],
  },
  merchandiser: {
    name: 'Merchandiser',
    permissions: ['write_products', 'write_categories', 'write_collections', 'write_stock'],
  },
  support: { name: 'Support', permissions: ['read_orders', 'read_customers', 'read_dashboard'] },
  unused: { name: 'Unused role', permissions: ['read_orders'] },
} as const

export type RoleKey = keyof typeof roles

/** One teammate for each role a variant signs in with. */
export const teammates: Record<
  string,
  { email: string; role: RoleKey; first: string; last: string }
> = {
  staffManager: {
    email: 'fidelity-staff-manager@example.com',
    role: 'staffManager',
    first: 'Sam',
    last: 'Writer',
  },
  staffViewer: {
    email: 'fidelity-staff-viewer@example.com',
    role: 'staffViewer',
    first: 'Vic',
    last: 'Reader',
  },
  storeSettings: {
    email: 'fidelity-store-settings@example.com',
    role: 'storeSettings',
    first: 'Sid',
    last: 'Settings',
  },
  orderManager: {
    email: 'fidelity-order-manager@example.com',
    role: 'orderManager',
    first: 'Oli',
    last: 'Orders',
  },
  merchandiser: {
    email: 'fidelity-merchandiser@example.com',
    role: 'merchandiser',
    first: 'Mel',
    last: 'Products',
  },
  support: {
    email: 'fidelity-support@example.com',
    role: 'support',
    first: 'Sue',
    last: 'Support',
  },
}

/** A teammate removed from the store, so they hold no role anywhere. */
export const removed = { email: 'fidelity-no-store@example.com', first: 'Noa', last: 'Removed' }
/** An invitation nobody has accepted, for a new account. */
export const pendingEmail = 'fidelity-pending@example.com'

export interface Seeded {
  storeId: string
  storeName: string
  pendingInvitationId: string
  existingAccountInvitationId: string
}

export async function admin(api: APIRequestContext) {
  const creds = getCredentials()
  const res = await api.post('/api/v3/admin/auth/login', {
    data: { email: creds.admin_email, password: creds.admin_password },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  return {
    creds,
    headers: { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': creds.store_id },
  }
}

async function canSignIn(baseURL: string, email: string) {
  const api = await request.newContext({ baseURL })
  try {
    const res = await api.post('/api/v3/admin/auth/login', { data: { email, password: PASSWORD } })
    return res.ok()
  } finally {
    await api.dispose()
  }
}

export async function acceptancePath(
  api: APIRequestContext,
  headers: Record<string, string>,
  id: string,
) {
  const res = await api.get(`/api/v3/admin/invitations/${id}/acceptance_link`, { headers })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { acceptance_url } = (await res.json()) as { acceptance_url: string }
  return acceptance_url.replace(/^https?:\/\/[^/]+/, '')
}

async function pendingInvitation(
  api: APIRequestContext,
  headers: Record<string, string>,
  email: string,
  roleId: string,
) {
  const list = await api.get('/api/v3/admin/invitations?limit=100', { headers })
  const invitations = (
    (await list.json()) as { data: { id: string; email: string; status: string }[] }
  ).data
  const found = invitations.find((item) => item.email === email && item.status === 'pending')
  if (found) return found.id
  const created = await api.post('/api/v3/admin/invitations', {
    headers,
    data: { email, role_id: roleId },
  })
  expect(created.status(), await created.text()).toBe(201)
  return ((await created.json()) as { id: string }).id
}

async function join(
  api: APIRequestContext,
  headers: Record<string, string>,
  baseURL: string,
  person: { email: string; first: string; last: string },
  roleId: string,
) {
  if (await canSignIn(baseURL, person.email)) return
  const id = await pendingInvitation(api, headers, person.email, roleId)
  const token = new URL(
    await acceptancePath(api, headers, id),
    'http://localhost',
  ).searchParams.get('token')
  const invitee = await request.newContext({ baseURL })
  try {
    const accepted = await invitee.post(`/api/v3/admin/auth/invitations/${id}/accept`, {
      data: {
        token,
        password: PASSWORD,
        password_confirmation: PASSWORD,
        first_name: person.first,
        last_name: person.last,
      },
    })
    expect(accepted.ok(), await accepted.text()).toBeTruthy()
  } finally {
    await invitee.dispose()
  }
}

export async function seed(baseURL: string): Promise<Seeded> {
  const api = await request.newContext({ baseURL })
  try {
    const { creds, headers } = await admin(api)
    const existing = (
      (await (await api.get('/api/v3/admin/roles?limit=100', { headers })).json()) as {
        data: { id: string; name: string }[]
      }
    ).data
    const roleIds = {} as Record<RoleKey, string>
    for (const [key, role] of Object.entries(roles) as [RoleKey, (typeof roles)[RoleKey]][]) {
      const found = existing.find((item) => item.name === role.name)
      if (found) {
        roleIds[key] = found.id
        continue
      }
      const created = await api.post('/api/v3/admin/roles', {
        headers,
        data: { name: role.name, permissions: role.permissions },
      })
      expect(created.status(), await created.text()).toBe(201)
      roleIds[key] = ((await created.json()) as { id: string }).id
    }

    for (const teammate of Object.values(teammates)) {
      await join(api, headers, baseURL, teammate, roleIds[teammate.role])
    }

    // A teammate who joined and was then removed keeps an account with no role.
    await join(api, headers, baseURL, removed, roleIds.support)
    const members = (
      (await (await api.get('/api/v3/admin/admin_users?limit=100', { headers })).json()) as {
        data: { id: string; email: string }[]
      }
    ).data
    const member = members.find((item) => item.email === removed.email)
    if (member) {
      const res = await api.delete(`/api/v3/admin/admin_users/${member.id}`, { headers })
      expect(res.ok(), await res.text()).toBeTruthy()
    }

    const pendingId = await pendingInvitation(api, headers, pendingEmail, roleIds.support)
    const existingId = await pendingInvitation(api, headers, removed.email, roleIds.staffViewer)
    return {
      storeId: creds.store_id,
      storeName: creds.store_name,
      pendingInvitationId: pendingId,
      existingAccountInvitationId: existingId,
    }
  } finally {
    await api.dispose()
  }
}

/**
 * The invitation's current acceptance link. Resending an invitation issues a
 * new token, and the staff captures resend one, so each capture asks again.
 */
export async function currentAcceptancePath(baseURL: string, invitationId: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    return await acceptancePath(api, headers, invitationId)
  } finally {
    await api.dispose()
  }
}

export const openRowMenu = (page: Page, rowText: string) =>
  page
    .locator('tr')
    .filter({ hasText: rowText })
    .getByRole('button', { name: /open actions/i })
    .click()

export const roleRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) })

export const openRoleMenu = (page: Page, name: string) =>
  roleRow(page, name)
    .getByRole('button', { name: /open actions/i })
    .click()
