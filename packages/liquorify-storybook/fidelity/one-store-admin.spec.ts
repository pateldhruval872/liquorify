import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import {
  agent,
  client,
  endpoints,
  gateway,
  origins,
  pkce,
  secretKeys,
  seedDevelopers,
  setRelay,
} from './developers'
import {
  adminCaller,
  type Caller,
  type Case,
  type CaseResult,
  denied,
  gapResult,
  notFound,
  runCases,
} from './one-store'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Step P7's Admin API refusals within one store: G-11's staff, invitation and
 * role requests, G-23's command palette searches and G-32's requests of batch
 * 2's narrower roles. Each request is sent as the teammates whose roles do not
 * allow it, and as one teammate whose role does, and judged by `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says;
 * nothing else needs to run. It adds the shared teammates and developer settings
 * of `staff.ts` and `developers.ts`, then the records this run aims at, named
 * with the run's stamp so no run reads another's. Results go to
 * `results/p7/admin.json`, with no response bodies and no tokens.
 *
 * Every expected answer is written below. The staff refusals are the answers
 * part 1's refusal check recorded at `a4a1708` (`refusals.spec.ts`); the
 * searches follow each role's permission keys, as part 2's did; the developer
 * settings refusals follow Spree's permission gate: 403 `access_denied` naming
 * the missing `read_*` or `write_*` key, and, for consent, the connect check's
 * 403 without one.
 */

const API = process.env.P7_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p7/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()

test.use({ baseURL: API })

type Json = Record<string, unknown>
type Admin = (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: Json,
) => Promise<Json>

function adminCall(api: APIRequestContext, caller: Caller): Admin {
  return async (method, path, data) => {
    const res = await api.fetch(`/api/v3/admin/${path}`, { method, headers: caller.headers, data })
    // Only the status and the message, which never carries a credential.
    const body = res.status() === 204 ? {} : ((await res.json()) as Json)
    expect(
      res.ok(),
      `${method} ${path}: ${res.status()} ${(body.error as Json)?.message ?? ''}`,
    ).toBeTruthy()
    return body
  }
}

const rows = (body: unknown) => ((body as { data?: Json[] }).data ?? []) as Json[]
const named = (field: string, value: string) => (sent: { body: unknown }) =>
  rows(sent.body).filter((item) => item[field] === value)

/** Invites a teammate into a role and accepts the invitation as them, as `staff.ts` does. */
async function addTeammate(
  api: APIRequestContext,
  call: Admin,
  person: { email: string; first: string; last: string },
  roleId: string,
) {
  const invitation = await call('POST', 'invitations', { email: person.email, role_id: roleId })
  const link = await call('GET', `invitations/${invitation.id}/acceptance_link`)
  const token = new URL(String(link.acceptance_url)).searchParams.get('token')
  const accepted = await api.post(`/api/v3/admin/auth/invitations/${invitation.id}/accept`, {
    data: {
      token,
      password: PASSWORD,
      password_confirmation: PASSWORD,
      first_name: person.first,
      last_name: person.last,
    },
  })
  expect(accepted.ok(), `accepting for ${person.email}: ${accepted.status()}`).toBeTruthy()
  const members = rows(await call('GET', 'admin_users?limit=100'))
  return String(members.find((item) => item.email === person.email)?.id)
}

async function staffCases(api: APIRequestContext, people: Record<string, Caller>, call: Admin) {
  const { admin, staffViewer, staffManager, support, storeSettings } = people
  // Records this run aims at. Their roles hold only `read_staff`, which the
  // staff manager may grant, so the allowed writes stay within its grant.
  const role = { name: `P7 role ${run}`, description: `P7 role description ${run}` }
  const roleId = String((await call('POST', 'roles', { ...role, permissions: ['read_staff'] })).id)
  const spareRoleName = `P7 spare role ${run}`
  const spareRoleId = String(
    (await call('POST', 'roles', { name: spareRoleName, permissions: ['read_staff'] })).id,
  )
  const member = { email: `p7-member-${run}@example.com`, first: 'Pat', last: `Member${run}` }
  const memberId = await addTeammate(api, call, member, roleId)
  const invitedEmail = `p7-invited-${run}@example.com`
  const invitationId = String(
    (await call('POST', 'invitations', { email: invitedEmail, role_id: roleId })).id,
  )
  const refusedEmail = `p7-refused-invitation-${run}@example.com`
  const createdRoleName = `P7 created role ${run}`
  const edit = `P7 edit ${run}`

  const read = (path: string): Case['state'] => ({
    caller: admin,
    request: { method: 'GET', path },
  })
  const noRead: [Caller, Caller] = [support, storeSettings]
  const writeRefusals = (withoutRead: ReturnType<typeof denied>) => [
    { caller: staffViewer, expected: denied('write_staff') },
    { caller: support, expected: withoutRead },
    { caller: storeSettings, expected: withoutRead },
  ]

  const cases: Case[] = [
    {
      gap: 'G-11',
      area: 'staff',
      title: 'List the staff',
      request: { method: 'GET', path: '/api/v3/admin/admin_users?limit=100' },
      attempts: noRead.map((caller) => ({ caller, expected: denied('read_staff') })),
      control: { caller: staffViewer, status: 200 },
      protectedValues: [member.email, member.last],
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'List the invitations',
      request: { method: 'GET', path: '/api/v3/admin/invitations?limit=100' },
      attempts: noRead.map((caller) => ({ caller, expected: denied('read_staff') })),
      control: { caller: staffViewer, status: 200 },
      protectedValues: [invitedEmail],
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'List the roles',
      request: { method: 'GET', path: '/api/v3/admin/roles?limit=100' },
      attempts: noRead.map((caller) => ({ caller, expected: denied('read_staff') })),
      control: { caller: staffViewer, status: 200 },
      protectedValues: [role.name, role.description],
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Invite a teammate',
      request: {
        method: 'POST',
        path: '/api/v3/admin/invitations',
        data: { email: refusedEmail, role_id: roleId },
      },
      attempts: writeRefusals(denied('write_staff')),
      control: { caller: staffManager, status: 201 },
      protectedValues: [refusedEmail],
      state: {
        ...read('/api/v3/admin/invitations?limit=100'),
        pick: named('email', refusedEmail),
      } as Case['state'],
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Resend an invitation',
      request: { method: 'PATCH', path: `/api/v3/admin/invitations/${invitationId}/resend` },
      attempts: writeRefusals(denied('write_staff')),
      control: { caller: staffManager, status: 200 },
      protectedValues: [invitedEmail],
      state: read(`/api/v3/admin/invitations/${invitationId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: "Ask for an invitation's acceptance link",
      request: { method: 'GET', path: `/api/v3/admin/invitations/${invitationId}/acceptance_link` },
      attempts: writeRefusals(denied('write_staff')),
      control: { caller: staffManager, status: 200 },
      protectedValues: [invitedEmail],
      protectedPatterns: [/token=/i],
      controlCarries: [/token=/i],
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: "Change a teammate's name",
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/admin_users/${memberId}`,
        data: { first_name: edit },
      },
      attempts: writeRefusals(notFound()),
      control: { caller: staffManager, status: 200 },
      protectedValues: [member.email, member.last],
      state: read(`/api/v3/admin/admin_users/${memberId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: "Change a role's description",
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/roles/${roleId}`,
        data: { description: edit },
      },
      attempts: writeRefusals(notFound()),
      control: { caller: staffManager, status: 200 },
      protectedValues: [role.name, role.description],
      state: read(`/api/v3/admin/roles/${roleId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Revoke an invitation',
      request: { method: 'DELETE', path: `/api/v3/admin/invitations/${invitationId}` },
      attempts: writeRefusals(notFound()),
      control: { caller: staffManager, status: 204 },
      protectedValues: [invitedEmail],
      state: read(`/api/v3/admin/invitations/${invitationId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Remove a teammate',
      request: { method: 'DELETE', path: `/api/v3/admin/admin_users/${memberId}` },
      attempts: writeRefusals(notFound()),
      control: { caller: staffManager, status: 204 },
      protectedValues: [member.email, member.last],
      state: read(`/api/v3/admin/admin_users/${memberId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Delete a role',
      request: { method: 'DELETE', path: `/api/v3/admin/roles/${spareRoleId}` },
      attempts: writeRefusals(notFound()),
      control: { caller: staffManager, status: 204 },
      protectedValues: [spareRoleName],
      state: read(`/api/v3/admin/roles/${spareRoleId}`),
    },
    {
      gap: 'G-11',
      area: 'staff',
      title: 'Add a role',
      request: {
        method: 'POST',
        path: '/api/v3/admin/roles',
        data: { name: createdRoleName, permissions: ['read_staff'] },
      },
      attempts: writeRefusals(denied('write_staff')),
      control: { caller: staffManager, status: 201 },
      protectedValues: [createdRoleName],
      state: {
        ...read('/api/v3/admin/roles?limit=100'),
        pick: named('name', createdRoleName),
      } as Case['state'],
    },
  ]
  return cases
}

/**
 * The palette's nine searches (DA-OVL-02), as it sends them. Each teammate is
 * refused every resource its role may not read, as part 2's check found at
 * `a4a1708`: 25 refusals in all. A teammate who may read the resource is the
 * control, and its answer must hold the record this run added for it, whose
 * name or email carries the run's stamp.
 */
async function searchCases(people: Record<string, Caller>, call: Admin) {
  const { admin, staffViewer, support, orderManager, merchandiser } = people
  const term = `p7s${run}`
  const name = `P7 search ${term}`
  await call('POST', 'products', { name })
  await call('POST', 'categories', { name })
  await call('POST', 'collections', { name })
  await call('POST', 'customers', {
    email: `${term}@example.com`,
    first_name: 'P7',
    last_name: term,
  })
  await call('POST', 'customer_groups', { name })
  await call('POST', 'companies', { name })
  await call('POST', 'sellers', { name })
  await call('POST', 'promotions', { name, code: term })
  // An order is found by its number, which the palette's reader types.
  const order = await call('POST', 'orders', { email: `${term}@example.com` })
  const searched = (resource: string) => (resource === 'orders' ? String(order.number) : term)

  const refusedBy: Record<string, Caller[]> = {
    products: [staffViewer, support, orderManager],
    categories: [staffViewer, support, orderManager],
    collections: [staffViewer, support, orderManager],
    orders: [staffViewer, merchandiser],
    customers: [staffViewer, merchandiser],
    customer_groups: [staffViewer, merchandiser],
    companies: [staffViewer, merchandiser],
    sellers: [staffViewer, support, orderManager, merchandiser],
    promotions: [staffViewer, support, orderManager, merchandiser],
  }
  const searches: [resource: string, permission: string, allowed: Caller][] = [
    ['products', 'read_products', merchandiser],
    ['categories', 'read_categories', merchandiser],
    ['collections', 'read_collections', merchandiser],
    ['orders', 'read_orders', support],
    ['customers', 'read_customers', support],
    ['customer_groups', 'read_customers', support],
    ['companies', 'read_customers', support],
    ['sellers', 'read_sellers', admin],
    ['promotions', 'read_promotions', admin],
  ]
  return searches.map(
    ([resource, permission, allowed]): Case => ({
      gap: 'G-23',
      area: 'search',
      title: `Search ${resource.replace('_', ' ')} from the command palette`,
      request: {
        method: 'GET',
        path: `/api/v3/admin/${resource}?q[search]=${searched(resource)}&limit=5`,
      },
      attempts: refusedBy[resource].map((caller) => ({ caller, expected: denied(permission) })),
      control: { caller: allowed, status: 200 },
      protectedValues: [searched(resource)],
      // Every record the allowed search found, by id and by what it shows.
      valuesFromControl: (body) =>
        rows(body).flatMap((item) =>
          [item.id, item.name, item.email, item.number].filter(
            (value): value is string => typeof value === 'string',
          ),
        ),
    }),
  )
}

/**
 * Batch 2's narrower roles (its record §3.1): the developer settings viewer
 * creating a key, connecting an agent and switching a payment provider, and
 * the order manager reading and creating on the API keys, OAuth clients, AI
 * agents, webhooks, allowed origins and integrations screens.
 */
async function developerCases(
  people: Record<string, Caller>,
  call: Admin,
  ids: { gatewayId: string; agentClientId: string; endpointId: string },
) {
  const { admin, developerViewer, orderManager, agentConnector } = people
  const applications = rows(await call('GET', 'oauth/applications?limit=100'))
  const agentRecord = applications.find((item) => item.name === agent.name)
  const keyName = `P7 key ${run}`
  const clientName = `P7 client ${run}`
  const endpointName = `P7 endpoint ${run}`
  const origin = `https://p7-${run}.example.com`
  const consent = new URLSearchParams({
    client_id: ids.agentClientId,
    redirect_uri: agent.callback,
    response_type: 'code',
    scope: 'read_products',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })
  const tokenShapes = [/plaintext_token/i, /secret_key/i, /\bsk_[A-Za-z0-9]{6,}/, /[?&]code=/]
  const list = (path: string, field: string, value: string): Case['state'] => ({
    caller: admin,
    request: { method: 'GET', path },
    pick: named(field, value),
  })

  const reads: [title: string, path: string, permission: string, values: string[]][] = [
    [
      'Read the API keys',
      'api_keys?limit=100',
      'read_api_keys',
      Object.values(secretKeys).map((key) => key.name),
    ],
    [
      'Read the OAuth clients and agents',
      'oauth/applications?limit=100',
      'read_oauth_applications',
      [client.name, client.redirect_uri],
    ],
    [
      'Read who connected an agent',
      `oauth/applications/${agentRecord?.id}/tokens?limit=100`,
      'read_oauth_applications',
      [],
    ],
    [
      'Read the webhook endpoints',
      'webhook_endpoints?limit=100',
      'read_webhooks',
      Object.values(endpoints).map((item) => item.url),
    ],
    [
      "Read an endpoint's deliveries",
      `webhook_endpoints/${ids.endpointId}/deliveries?limit=100`,
      'read_webhooks',
      [],
    ],
    ['Read the allowed origins', 'allowed_origins?limit=100', 'read_settings', origins],
    ['Read the payment providers', 'payment_methods?limit=100', 'read_settings', [gateway.name]],
  ]

  const cases: Case[] = [
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Create a secret key',
      request: {
        method: 'POST',
        path: '/api/v3/admin/api_keys',
        data: { name: keyName, key_type: 'secret', scopes: ['read_products'] },
      },
      attempts: [
        { caller: developerViewer, expected: denied('write_api_keys') },
        { caller: orderManager, expected: denied('write_api_keys') },
      ],
      control: { caller: admin, status: 201 },
      protectedValues: [keyName],
      protectedPatterns: tokenShapes,
      state: list('/api/v3/admin/api_keys?limit=100', 'name', keyName),
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Register an agent or OAuth client',
      request: {
        method: 'POST',
        path: '/api/v3/admin/oauth/applications',
        data: { name: clientName, redirect_uri: agent.callback },
      },
      attempts: [
        { caller: developerViewer, expected: denied('write_oauth_applications') },
        { caller: orderManager, expected: denied('write_oauth_applications') },
      ],
      control: { caller: agentConnector, status: 201 },
      protectedValues: [clientName],
      protectedPatterns: tokenShapes,
      state: list('/api/v3/admin/oauth/applications?limit=100', 'name', clientName),
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Approve an agent on the consent page',
      request: { method: 'POST', path: `/api/v3/admin/oauth/authorize?${consent}` },
      attempts: [
        { caller: developerViewer, expected: denied(null) },
        { caller: orderManager, expected: denied(null) },
      ],
      control: { caller: agentConnector, status: 200 },
      protectedPatterns: tokenShapes,
      controlCarries: [/[?&]code=/],
      state: {
        caller: admin,
        request: {
          method: 'GET',
          path: `/api/v3/admin/oauth/applications/${agentRecord?.id}/tokens?limit=100`,
        },
        controlLeavesNoTrace:
          'an approval issues an authorization code, which the Admin API does not list; a token appears only when the code is exchanged',
      },
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Switch a payment provider off',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/payment_methods/${ids.gatewayId}`,
        data: { active: false },
      },
      // A change to one record looks the record up among those the caller may
      // change before the permission gate runs (`set_resource` comes first in
      // Spree's resource controllers), so a teammate who may only read it is
      // told it was not found, as part 1's teammates without staff access were.
      attempts: [{ caller: developerViewer, expected: notFound() }],
      control: { caller: admin, status: 200 },
      protectedValues: [gateway.name],
      state: {
        caller: admin,
        request: { method: 'GET', path: `/api/v3/admin/payment_methods/${ids.gatewayId}` },
        pick: (sent) => (sent.body as Json).active,
      },
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Add a webhook endpoint',
      request: {
        method: 'POST',
        path: '/api/v3/admin/webhook_endpoints',
        data: {
          name: endpointName,
          url: `https://p7-${run}.example.test/hooks`,
          subscriptions: ['product.updated'],
        },
      },
      attempts: [{ caller: orderManager, expected: denied('write_webhooks') }],
      control: { caller: admin, status: 201 },
      protectedValues: [endpointName],
      protectedPatterns: tokenShapes,
      state: list('/api/v3/admin/webhook_endpoints?limit=100', 'name', endpointName),
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Add an allowed origin',
      request: { method: 'POST', path: '/api/v3/admin/allowed_origins', data: { origin } },
      attempts: [{ caller: orderManager, expected: denied('write_settings') }],
      control: { caller: admin, status: 201 },
      protectedValues: [origin],
      state: list('/api/v3/admin/allowed_origins?limit=100', 'origin', origin),
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Connect an integration',
      request: {
        method: 'POST',
        path: '/api/v3/admin/integrations',
        data: {
          type: 'e2e_relay',
          active: false,
          preferences: { account_id: `p7-account-${run}` },
        },
      },
      attempts: [{ caller: orderManager, expected: denied('write_integrations') }],
      control: { caller: admin, status: 201 },
      protectedValues: [`p7-account-${run}`],
      state: list('/api/v3/admin/integrations?limit=100', 'type', 'e2e_relay'),
    },
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Add a payment provider',
      request: {
        method: 'POST',
        path: '/api/v3/admin/payment_methods',
        data: { type: 'check', name: `P7 provider ${run}`, active: false },
      },
      attempts: [{ caller: orderManager, expected: denied('write_settings') }],
      control: { caller: admin, status: 201 },
      protectedValues: [`P7 provider ${run}`],
      state: list('/api/v3/admin/payment_methods?limit=100', 'name', `P7 provider ${run}`),
    },
    ...reads.map(
      ([title, path, permission, values]): Case => ({
        gap: 'G-32',
        area: 'developers',
        title,
        request: { method: 'GET', path: `/api/v3/admin/${path}` },
        attempts: [{ caller: orderManager, expected: denied(permission) }],
        control: { caller: developerViewer, status: 200 },
        protectedValues: values,
        protectedPatterns: tokenShapes.slice(0, 3),
        valuesFromControl: (body) =>
          rows(body).flatMap((item) =>
            [item.id, item.name, item.origin, item.url, item.owner_email, item.event_name].filter(
              (value): value is string => typeof value === 'string',
            ),
          ),
      }),
    ),
    {
      gap: 'G-32',
      area: 'developers',
      title: 'Read the integrations',
      request: { method: 'GET', path: '/api/v3/admin/integrations?limit=100' },
      attempts: [{ caller: orderManager, expected: denied('read_integrations') }],
      control: { caller: developerViewer, status: 200 },
      protectedValues: ['e2e_relay'],
      protectedPatterns: tokenShapes.slice(0, 3),
    },
  ]
  return cases
}

test('the Admin API refuses each request a role does not allow, within one store', async ({
  request,
  baseURL,
}) => {
  const base = baseURL ?? API
  const creds = getCredentials()
  await seed(base)
  const developers = await seedDevelopers(base)
  // The integration case connects the test app's own integration, which a
  // store holds once.
  await setRelay(base, 'none')

  const people: Record<string, Caller> = {
    admin: await adminCaller(
      request,
      'admin',
      creds.admin_email,
      creds.admin_password,
      creds.store_id,
    ),
  }
  for (const key of [
    'staffViewer',
    'staffManager',
    'support',
    'storeSettings',
    'orderManager',
    'merchandiser',
    'developerViewer',
    'agentConnector',
  ]) {
    people[key] = await adminCaller(request, key, teammates[key].email, PASSWORD, creds.store_id)
  }
  const call = adminCall(request, people.admin)

  const all: CaseResult[] = []
  all.push(...(await runCases(request, await staffCases(request, people, call))))
  all.push(...(await runCases(request, await searchCases(people, call))))
  all.push(
    ...(await runCases(
      request,
      await developerCases(people, call, {
        gatewayId: developers.gatewayId,
        agentClientId: developers.agentClientId,
        endpointId: developers.endpointIds.orderSync,
      }),
    )),
  )
  // Puts the test gateway back as the seeding left it.
  await call('PATCH', `payment_methods/${developers.gatewayId}`, { active: true })

  const gaps = Object.fromEntries(
    ['G-11', 'G-23', 'G-32'].map((gap) => [gap, gapResult(all.filter((item) => item.gap === gap))]),
  )
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}admin.json`,
    JSON.stringify({ revision, run, store: 'default', gaps, cases: all }, null, 2),
  )
  const failed = all.filter((item) => item.result === 'FAIL')
  expect(
    failed.map((item) => ({ title: item.title, failures: item.failures })),
    'every case passed',
  ).toEqual([])
})
