import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { shopper } from './marketplace'
import {
  type Admin,
  adminCall,
  adminCaller,
  type Caller,
  type Case,
  type CaseResult,
  denied,
  fields,
  type Gap,
  gapResult,
  type Json,
  notFound,
  rows,
  runCases,
  send,
} from './one-store'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Step P14, the marketplace refusals, a follow-up to P10 (G-106): the
 * platform work item's "P14's checks, recorded before implementation", rows
 * 14.1 to 14.26. Each request is sent as the teammates whose roles do not
 * allow it, and as one who may, and is judged by P7's `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says.
 * The script adds `staff.ts`'s teammates, then the records this run aims at,
 * marked with the run's stamp. The admin makes them through the Admin API;
 * the steps only a seller can take (accepting an invitation, submitting a
 * requirement, a product or the checklist, and pricing its delivery) go
 * through the Seller API as the seller's own member, and the purchase through
 * the Store API as a shopper. Results go to `results/p14/admin.json`, with no
 * response bodies, tokens or links.
 *
 * Every expected answer below is the one the work item recorded before this
 * script was written, by P10's rules A1 and A2 and P12's A5, with the row
 * number at the start of each case's title.
 */

const API = process.env.P14_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p14/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()
const gap = 'G-106' as Gap
const area = 'marketplace'
const MEMBER_PASSWORD = 'p14-seller-password-123'

test.use({ baseURL: API })

const ids = (sent: { body: unknown }) => rows(sent.body).map((item) => item.id)

/** A read-back through the admin, the teammate who may read everything. */
const reader =
  (admin: Caller) =>
  (path: string, pick?: (sent: { status: number; body: unknown }) => unknown): Case['state'] => ({
    caller: admin,
    request: { method: 'GET', path: `/api/v3/admin/${path}` },
    pick,
  })

async function sellerSend(
  api: APIRequestContext,
  headers: Record<string, string>,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  data?: Json,
) {
  const res = await api.fetch(`/api/v3/seller/${path}`, { method, headers, data })
  const body = res.status() === 204 ? {} : ((await res.json()) as Json)
  expect(
    res.ok(),
    `seller ${method} ${path}: ${res.status()} ${(body.error as Json)?.message ?? ''}`,
  ).toBeTruthy()
  return body
}

interface Seller {
  id: string
  name: string
  email: string
  member?: { email: string; headers: Record<string, string> }
}

interface Records {
  sellers: Record<
    'readyToApprove' | 'readyToReopen' | 'approved' | 'toSuspend' | 'notAdmitted' | 'toInvite',
    Seller
  >
  requirement: { id: string; name: string }
  submission: string
  rate: { id: string; name: string; value: string }
  invitation: { id: string; email: string; link: string }
  products: { toApprove: { id: string; name: string }; toReject: { id: string; name: string } }
  sellerOrder: { id: string; number: string }
  orderGroup: { id: string; number: string }
  transfer: string
  commissionLine: string
}

/** The run's records. */
async function seedRecords(
  api: APIRequestContext,
  call: Admin,
  adminHeaders: Record<string, string>,
): Promise<Records> {
  const requirementName = `P14 background check ${run}`
  const requirement = await call('POST', 'seller_requirements', {
    type: 'operator_review',
    name: requirementName,
    active: true,
    required: false,
  })
  const rateName = `P14 rate ${run}`
  const rateValue = '13.37'
  const rate = await call('POST', 'commission_rates', {
    name: rateName,
    enabled: true,
    kind: 'percentage',
    value: rateValue,
  })

  const create = async (label: string): Promise<Seller> => {
    const name = `P14 ${label} ${run}`
    const email = `p14-${label}-${run}@example.com`
    const made = await call('POST', 'sellers', { name, contact_email: email })
    return { id: String(made.id), name, email }
  }
  /** An invitation sent by the admin and accepted by its invitee, which starts onboarding. */
  const admit = async (seller: Seller) => {
    const email = `p14-member-${seller.id}-${run}@example.com`.toLowerCase()
    await call('POST', `sellers/${seller.id}/invite`, { email })
    const invitation = rows(await call('GET', `sellers/${seller.id}/invitations?limit=100`)).find(
      (item) => item.email === email,
    ) as Json
    const { acceptance_url } = await call(
      'GET',
      `sellers/${seller.id}/invitations/${invitation.id}/acceptance_link`,
    )
    const token = new URL(String(acceptance_url)).searchParams.get('token')
    const res = await api.post(
      `/api/v3/seller/auth/invitations/${invitation.id}/accept?token=${token}`,
      {
        data: {
          password: MEMBER_PASSWORD,
          password_confirmation: MEMBER_PASSWORD,
          first_name: 'P14',
          last_name: `Member ${run}`,
        },
      },
    )
    expect(res.status(), `accepting the invitation onto ${seller.name}`).toBe(200)
    const { token: jwt } = (await res.json()) as { token: string }
    seller.member = {
      email,
      headers: { Authorization: `Bearer ${jwt}`, 'X-Spree-Seller-Id': seller.id },
    }
  }
  const required = rows(await call('GET', 'seller_requirements?limit=100')).filter(
    (item) => item.required && item.active,
  )
  /** Every required item waived by the admin, then the checklist submitted by the seller. */
  const readyForReview = async (seller: Seller) => {
    await admit(seller)
    for (const item of required) {
      await call('POST', `sellers/${seller.id}/requirement_submissions`, {
        requirement_id: item.id,
        review_note: `P14 waiver ${run}`,
      })
    }
    await sellerSend(api, seller.member?.headers ?? {}, 'POST', 'onboarding/submit_for_review')
    expect((await call('GET', `sellers/${seller.id}`)).status).toBe('ready_for_review')
  }
  const approve = (seller: Seller) =>
    call('PATCH', `sellers/${seller.id}/approve`, { override_requirements: true })

  const sellers = {
    readyToApprove: await create('ready-to-approve'),
    readyToReopen: await create('ready-to-reopen'),
    approved: await create('approved'),
    toSuspend: await create('to-suspend'),
    notAdmitted: await create('not-admitted'),
    toInvite: await create('to-invite'),
  }
  await readyForReview(sellers.readyToApprove)
  await readyForReview(sellers.readyToReopen)

  // The approved seller: a submission waiting for a decision, then admitted
  // over its unfinished checklist, on the manual interval.
  const approved = sellers.approved
  await admit(approved)
  const member = approved.member?.headers ?? {}
  const submitted = await sellerSend(
    api,
    member,
    'POST',
    `requirements/${requirement.id}/submissions`,
    { note: `P14 licence ${run}` },
  )
  await approve(approved)
  await call('PATCH', `sellers/${approved.id}`, {
    payouts_schedule_interval: 'manual',
    minimum_payout_amount: null,
  })
  await admit(sellers.toSuspend)
  await approve(sellers.toSuspend)

  // A pending invitation onto the approved seller's team.
  const inviteeEmail = `p14-invitee-${run}@example.com`
  await sellerSend(api, member, 'POST', 'team', { email: inviteeEmail })
  const invitation = rows(await call('GET', `sellers/${approved.id}/invitations?limit=100`)).find(
    (item) => item.email === inviteeEmail,
  ) as Json
  const link = String(
    (await call('GET', `sellers/${approved.id}/invitations/${invitation.id}/acceptance_link`))
      .acceptance_url,
  )

  // The seller's products: one put on sale, two proposed for review.
  const [profile] = rows(await call('GET', 'delivery_profiles?limit=100')).filter(
    (each) => each.name === 'General',
  )
  expect(profile, "the store's General delivery profile").toBeTruthy()
  await sellerSend(api, member, 'POST', 'delivery_methods', {
    name: `P14 courier ${run}`,
    delivery_profile_id: profile.id,
    storefront_visible: true,
    calculator: { type: 'flat_rate', preferences: { amount: '6.50' } },
  })
  const propose = async (label: string, price: string) => {
    const name = `P14 ${label} ${run}`
    const made = await sellerSend(api, member, 'POST', 'products', {
      name,
      prices: [{ amount: price, currency: 'USD' }],
    })
    await sellerSend(api, member, 'PATCH', `products/${made.id}/submit`)
    return { id: String(made.id), name }
  }
  const forSale = await propose('rum', '61.73')
  const toApprove = await propose('gin', '34.10')
  const toReject = await propose('whisky', '58.20')
  await call('PATCH', `products/${forSale.id}/approve`)
  const channels = rows(await call('GET', 'channels?limit=100')).map((channel) => channel.id)
  const [sellerLocation] = rows(await sellerSend(api, member, 'GET', 'stock_locations'))
  expect(sellerLocation, "the seller's stock location").toBeTruthy()

  // The store's own product beside it, from the store's own stock and delivery.
  const own = await call('POST', 'products', {
    name: `P14 house bitters ${run}`,
    status: 'active',
    prices: [{ amount: '18.00', currency: 'USD' }],
  })
  await call('POST', 'products/bulk_add_to_channels', {
    ids: [forSale.id, own.id],
    channel_ids: channels,
  })
  const locations = rows(await call('GET', 'stock_locations?limit=100'))
  const storeLocation = locations.find((item) => item.default && !item.seller_id) ?? locations[0]
  const variantOf = async (product: string) =>
    String((await call('GET', `products/${product}`)).default_variant_id)
  await call('POST', 'stock_levels/bulk_upsert', {
    stock_levels: [
      {
        variant_id: await variantOf(forSale.id),
        stock_location_id: sellerLocation.id,
        count_on_hand: 20,
      },
      {
        variant_id: await variantOf(own.id),
        stock_location_id: storeLocation.id,
        count_on_hand: 20,
      },
    ],
  })
  const storeMethods = rows(await call('GET', 'delivery_methods?limit=100'))
  if (!storeMethods.some((each) => each.name === 'P14 store courier')) {
    await call('POST', 'delivery_methods', {
      name: 'P14 store courier',
      delivery_profile_id: profile.id,
      storefront_visible: true,
      calculator: { type: 'flat_rate', preferences: { amount: '5.00' } },
    })
  }

  // A shopper buys both, which splits into an order group; the admin fulfils
  // the seller's order, which earns its transfer and its balance.
  const checkout = await shopper(api, adminHeaders)
  const group = await checkout([forSale.id, own.id])
  const orders = await Promise.all(
    (group.orders as Json[]).map((order) => call('GET', `orders/${order.id}`)),
  )
  const sellerOrder = orders.find((order) => order.seller_id === approved.id) as Json
  expect(sellerOrder, "the seller's order in the group").toBeTruthy()
  const [fulfilment] = rows(await call('GET', `orders/${sellerOrder.id}/fulfillments`))
  await call('PATCH', `orders/${sellerOrder.id}/fulfillments/${fulfilment.id}/fulfill`, {
    tracking: `P14-${run}`,
    notify_customer: false,
  })

  const transfer = rows(await call('GET', 'seller_transfers?limit=100')).find(
    (item) => item.order_id === sellerOrder.id,
  ) as Json
  expect(transfer, "the seller's transfer").toBeTruthy()
  const line = rows(await call('GET', 'commission_lines?limit=100')).find(
    (item) => item.order_id === sellerOrder.id,
  ) as Json
  expect(line, 'the commission line').toBeTruthy()

  return {
    sellers,
    requirement: { id: String(requirement.id), name: requirementName },
    submission: String(submitted.id),
    rate: { id: String(rate.id), name: rateName, value: rateValue },
    invitation: { id: String(invitation.id), email: inviteeEmail, link },
    products: { toApprove, toReject },
    sellerOrder: { id: String(sellerOrder.id), number: String(sellerOrder.number) },
    orderGroup: { id: String(group.id), number: String(group.number) },
    transfer: String(transfer.id),
    commissionLine: String(line.id),
  }
}

/**
 * Row 14.8's second control, the seller viewer's onboarding read, judged as a
 * control of its own and merged into the row: the row passes only when both
 * controls and every refusal pass.
 */
function withSecondControl(row: CaseResult, second: CaseResult) {
  const failures = [
    ...row.failures,
    ...second.failures.map((failure) => `second control: ${failure}`),
  ]
  return {
    ...row,
    secondControl: second.control,
    failures,
    result: failures.length === 0 ? ('PASS' as const) : ('FAIL' as const),
  }
}

/** Row 14.10 sends two requests; the row passes only when both do. */
function bothRequests(title: string, first: CaseResult, second: CaseResult) {
  const failures = [
    ...first.failures.map((failure) => `${first.request}: ${failure}`),
    ...second.failures.map((failure) => `${second.request}: ${failure}`),
  ]
  return {
    ...first,
    title,
    request: `${first.request}; ${second.request}`,
    attempts: [...first.attempts, ...second.attempts],
    secondRequest: { request: second.request, control: second.control },
    failures,
    result: failures.length === 0 ? ('PASS' as const) : ('FAIL' as const),
  }
}

type Row = CaseResult & {
  secondControl?: unknown
  secondControlAnswer?: unknown
  secondRequest?: unknown
}

async function runRows(
  api: APIRequestContext,
  people: Record<string, Caller>,
  call: Admin,
  records: Records,
): Promise<Row[]> {
  const {
    admin,
    sellerManager,
    sellerViewer,
    payoutsClerk,
    commissionManager,
    merchandiser,
    orderManager,
    storeSettings,
  } = people
  const read = reader(admin)
  const { sellers, rate, invitation } = records
  const approved = sellers.approved
  const at = (seller: Seller, path = '') => `/api/v3/admin/sellers/${seller.id}${path}`
  const sellerValues = (seller: Seller) => [seller.name, seller.email]
  const writers = (key: string): Case['attempts'] => [
    { caller: sellerViewer, expected: denied(key) },
    { caller: payoutsClerk, expected: denied(key) },
    { caller: commissionManager, expected: denied(key) },
  ]
  const status = (seller: Seller) => read(`sellers/${seller.id}`, fields('status'))
  const one = async (item: Case) => (await runCases(api, [item]))[0]
  const out: Row[] = []

  out.push(
    await one({
      gap,
      area,
      title: '14.1 List sellers',
      request: { method: 'GET', path: '/api/v3/admin/sellers?limit=100' },
      attempts: [
        { caller: storeSettings, expected: denied('read_sellers') },
        { caller: orderManager, expected: denied('read_sellers') },
        { caller: merchandiser, expected: denied('read_sellers') },
      ],
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [
        ...sellerValues(sellers.readyToApprove),
        ...sellerValues(approved),
        ...sellerValues(sellers.notAdmitted),
      ],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.2 Read a seller',
      request: { method: 'GET', path: at(approved) },
      attempts: [
        { caller: storeSettings, expected: denied('read_sellers') },
        { caller: orderManager, expected: denied('read_sellers') },
      ],
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [approved.name],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: "14.3 Save a seller's contact email",
      request: {
        method: 'PATCH',
        path: at(approved),
        data: { contact_email: `p14-changed-${run}@example.com` },
      },
      attempts: writers('write_sellers'),
      control: { caller: sellerManager, status: 200 },
      protectedValues: [approved.name],
      state: read(`sellers/${approved.id}`, fields('contact_email')),
    }),
  )
  const move = (
    title: string,
    seller: Seller,
    action: string,
    data?: Record<string, unknown>,
  ): Case => ({
    gap,
    area,
    title,
    request: { method: 'PATCH', path: at(seller, `/${action}`), data },
    attempts: writers('write_sellers'),
    control: { caller: sellerManager, status: 200 },
    protectedValues: [seller.name],
    state: status(seller),
  })
  out.push(
    await one(move('14.4 Approve the seller ready for review', sellers.readyToApprove, 'approve')),
  )
  out.push(
    await one(
      move('14.5 Suspend the approved seller', sellers.toSuspend, 'suspend', {
        reason: `P14 suspension ${run}`,
      }),
    ),
  )
  out.push(
    await one(
      move('14.6 Reject the seller not yet admitted', sellers.notAdmitted, 'reject', {
        reason: `P14 rejection ${run}`,
      }),
    ),
  )
  out.push(
    await one(
      move(
        '14.7 Send the seller ready for review back',
        sellers.readyToReopen,
        'reopen_onboarding',
        {
          note: `P14 note ${run}`,
        },
      ),
    ),
  )

  const onboarding: Case = {
    gap,
    area,
    title: "14.8 Read a seller's onboarding",
    request: { method: 'GET', path: at(approved, '/onboarding') },
    attempts: [
      { caller: storeSettings, expected: denied('read_sellers') },
      { caller: orderManager, expected: denied('read_sellers') },
    ],
    control: { caller: sellerManager, status: 200 },
    protectedValues: [records.requirement.name],
  }
  const onboardingRow = await one(onboarding)
  const viewerControl = await one({
    ...onboarding,
    attempts: [],
    control: { caller: sellerViewer, status: 200 },
  })
  // The second control's own answer, kept beside the row for SD-70.
  const viewerAnswer = await send(api, sellerViewer, onboarding.request)
  out.push({
    ...withSecondControl(onboardingRow, viewerControl),
    secondControlAnswer: {
      status: viewerAnswer.status,
      code: viewerAnswer.code,
      requiredPermission: viewerAnswer.requiredPermission,
    },
  })

  out.push(
    await one({
      gap,
      area,
      title: '14.9 Invite a team member',
      request: {
        method: 'POST',
        path: at(sellers.toInvite, '/invite'),
        data: { email: `p14-invited-${run}@example.com` },
      },
      attempts: writers('write_sellers'),
      control: { caller: sellerManager, status: 201 },
      protectedValues: [sellers.toInvite.name],
      state: read(`sellers/${sellers.toInvite.id}/invitations?limit=100`, ids),
    }),
  )
  const listReaders: Case['attempts'] = [
    { caller: storeSettings, expected: denied('read_sellers') },
    { caller: orderManager, expected: denied('read_sellers') },
  ]
  const team = await one({
    gap,
    area,
    title: "14.10 List a seller's team",
    request: { method: 'GET', path: at(approved, '/team?limit=100') },
    attempts: listReaders,
    control: { caller: sellerViewer, status: 200 },
    protectedValues: [approved.member?.email ?? ''],
  })
  const invitations = await one({
    gap,
    area,
    title: "14.10 List a seller's invitations",
    request: { method: 'GET', path: at(approved, '/invitations?limit=100') },
    attempts: listReaders,
    control: { caller: sellerViewer, status: 200 },
    protectedValues: [invitation.email],
  })
  out.push(bothRequests("14.10 List a seller's team and invitations", team, invitations))

  out.push(
    await one({
      gap,
      area,
      title: "14.11 Read an invitation's acceptance link",
      request: {
        method: 'GET',
        path: at(approved, `/invitations/${invitation.id}/acceptance_link`),
      },
      attempts: writers('write_sellers'),
      control: { caller: sellerManager, status: 200 },
      protectedValues: [invitation.link],
      protectedPatterns: [/token=/],
    }),
  )

  let balanceAmounts: string[] = []
  out.push(
    await one({
      gap,
      area,
      title: "14.12 Read a seller's balances",
      request: { method: 'GET', path: at(approved, '/balances') },
      attempts: [
        { caller: sellerManager, expected: denied('read_payouts') },
        { caller: commissionManager, expected: denied('read_payouts') },
      ],
      control: { caller: sellerViewer, status: 200 },
      valuesFromControl: (body) => {
        balanceAmounts = rows(body)
          .flatMap((item) => [item.earned, item.payable, item.balance])
          .filter((value) => value !== undefined && value !== null && Number(value) !== 0)
          .map(String)
        return balanceAmounts
      },
      controlCarries: [/"payable":"[1-9]/],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.13 Settle the seller by hand',
      request: { method: 'POST', path: at(approved, '/payouts') },
      attempts: [
        { caller: sellerViewer, expected: denied('write_payouts') },
        { caller: sellerManager, expected: denied('write_payouts') },
        { caller: commissionManager, expected: denied('write_payouts') },
      ],
      control: { caller: payoutsClerk, status: 201 },
      protectedValues: balanceAmounts,
      state: read(`seller_payouts?limit=100`, ids),
    }),
  )
  const payout = rows(await call('GET', 'seller_payouts?limit=100')).find(
    (item) => item.seller_id === approved.id,
  ) as Json | undefined

  out.push(
    await one({
      gap,
      area,
      title: '14.14 List the requirements',
      request: { method: 'GET', path: '/api/v3/admin/seller_requirements?limit=100' },
      attempts: listReaders,
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [records.requirement.name],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.15 Add a requirement',
      request: {
        method: 'POST',
        path: '/api/v3/admin/seller_requirements',
        data: {
          type: 'attestation',
          name: `P14 added requirement ${run}`,
          active: true,
          required: false,
        },
      },
      attempts: writers('write_sellers'),
      control: { caller: sellerManager, status: 201 },
      protectedValues: [records.requirement.name],
      state: read('seller_requirements?limit=100', ids),
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.16 Accept a submission',
      request: {
        method: 'PATCH',
        path: at(approved, `/requirement_submissions/${records.submission}/accept`),
        data: { review_note: `P14 accepted ${run}` },
      },
      // Corrected before the first recorded run, from 403 `write_sellers` (A5)
      // to 404 (A2): the base controller's `set_parent` finds the seller
      // through `accessible_by(current_ability, :update)` before any key gate,
      // so a role that may not change sellers finds no seller.
      attempts: [
        { caller: sellerViewer, expected: notFound() },
        { caller: payoutsClerk, expected: notFound() },
        { caller: commissionManager, expected: notFound() },
      ],
      control: { caller: sellerManager, status: 200 },
      protectedValues: [approved.name, records.requirement.name],
      state: read(
        `sellers/${approved.id}/requirement_submissions/${records.submission}`,
        fields('status'),
      ),
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.17 List commission rates',
      request: { method: 'GET', path: '/api/v3/admin/commission_rates?limit=100' },
      attempts: [
        { caller: sellerManager, expected: denied('read_commissions') },
        { caller: orderManager, expected: denied('read_commissions') },
        { caller: storeSettings, expected: denied('read_commissions') },
      ],
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [rate.name, rate.value],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.18 Add a commission rate',
      request: {
        method: 'POST',
        path: '/api/v3/admin/commission_rates',
        data: {
          name: `P14 added rate ${run}`,
          enabled: false,
          kind: 'percentage',
          value: '7.5',
        },
      },
      attempts: [
        { caller: sellerViewer, expected: denied('write_commissions') },
        { caller: payoutsClerk, expected: denied('write_commissions') },
        { caller: sellerManager, expected: denied('write_commissions') },
      ],
      control: { caller: commissionManager, status: 201 },
      protectedValues: [rate.name, rate.value],
      state: read('commission_rates?limit=100', ids),
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.19 Change a commission rate',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/commission_rates/${rate.id}`,
        data: { value: '14.25' },
      },
      attempts: [
        { caller: sellerViewer, expected: notFound() },
        { caller: payoutsClerk, expected: notFound() },
        { caller: sellerManager, expected: notFound() },
      ],
      control: { caller: commissionManager, status: 200 },
      protectedValues: [rate.name, rate.value],
      state: read(`commission_rates/${rate.id}`, fields('value')),
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.20 List commission lines',
      request: { method: 'GET', path: '/api/v3/admin/commission_lines?limit=100' },
      attempts: [
        { caller: orderManager, expected: denied('read_commissions') },
        { caller: sellerManager, expected: denied('read_commissions') },
      ],
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [records.commissionLine],
    }),
  )
  const ledgerReaders: Case['attempts'] = [
    { caller: orderManager, expected: denied('read_payouts') },
    { caller: sellerManager, expected: denied('read_payouts') },
    { caller: commissionManager, expected: denied('read_payouts') },
  ]
  out.push(
    await one({
      gap,
      area,
      title: '14.21 List seller transfers',
      request: { method: 'GET', path: '/api/v3/admin/seller_transfers?limit=100' },
      attempts: ledgerReaders,
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [records.transfer],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.22 List seller payouts',
      request: { method: 'GET', path: '/api/v3/admin/seller_payouts?limit=100' },
      attempts: ledgerReaders,
      control: { caller: sellerViewer, status: 200 },
      protectedValues: [String(payout?.id ?? 'no payout from 14.13')],
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.23 Mark a payout paid',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/seller_payouts/${payout?.id ?? 'missing'}/complete`,
        data: { reference: `P14-REF-${run}` },
      },
      attempts: [
        { caller: sellerViewer, expected: denied('write_payouts') },
        { caller: commissionManager, expected: denied('write_payouts') },
        { caller: sellerManager, expected: denied('write_payouts') },
      ],
      control: { caller: payoutsClerk, status: 200 },
      protectedValues: [String(payout?.id ?? 'no payout from 14.13'), ...balanceAmounts],
      state: read(`seller_payouts/${payout?.id ?? 'missing'}`, fields('status', 'reference')),
    }),
  )
  out.push(
    await one({
      gap,
      area,
      title: '14.24 List order groups',
      request: { method: 'GET', path: '/api/v3/admin/order_groups?limit=100' },
      attempts: [
        { caller: storeSettings, expected: denied('read_orders') },
        { caller: merchandiser, expected: denied('read_orders') },
      ],
      control: { caller: orderManager, status: 200 },
      protectedValues: [records.orderGroup.number],
    }),
  )
  const review = (
    title: string,
    product: { id: string; name: string },
    action: string,
    data?: Record<string, unknown>,
  ): Case => ({
    gap,
    area,
    title,
    request: { method: 'PATCH', path: `/api/v3/admin/products/${product.id}/${action}`, data },
    attempts: [
      { caller: sellerManager, expected: denied('write_products') },
      { caller: orderManager, expected: denied('write_products') },
      { caller: sellerViewer, expected: denied('write_products') },
    ],
    control: { caller: merchandiser, status: 200 },
    protectedValues: [product.name],
    state: read(`products/${product.id}`, fields('status', 'review_reason', 'rejection_reason')),
  })
  out.push(
    await one(
      review("14.25 Approve the seller's proposed product", records.products.toApprove, 'approve'),
    ),
  )
  out.push(
    await one(
      review('14.26 Send a proposed product back', records.products.toReject, 'reject', {
        reason: `P14 reason ${run}`,
      }),
    ),
  )
  return out
}

test('the Admin API refuses the marketplace requests a role does not allow, within one store', async ({
  request,
  baseURL,
}) => {
  test.setTimeout(10 * 60_000)
  const base = baseURL ?? API
  const creds = getCredentials()
  await seed(base)

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
    'sellerManager',
    'sellerViewer',
    'payoutsClerk',
    'commissionManager',
    'merchandiser',
    'orderManager',
    'storeSettings',
  ]) {
    people[key] = await adminCaller(request, key, teammates[key].email, PASSWORD, creds.store_id)
  }
  const call = adminCall(request, people.admin)

  const records = await seedRecords(request, call, people.admin.headers)
  const all = await runRows(request, people, call, records)

  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}admin.json`,
    JSON.stringify(
      {
        revision,
        run,
        store: 'default',
        callers: Object.fromEntries(
          Object.values(people).map((caller) => [caller.name, caller.keys ?? null]),
        ),
        gaps: { 'G-106': gapResult(all) },
        cases: all,
      },
      null,
      2,
    ),
  )
  const failed = all.filter((item) => item.result === 'FAIL')
  expect(
    failed.map((item) => ({ title: item.title, failures: item.failures })),
    'every case passed',
  ).toEqual([])
})

/**
 * Criterion 6 for the two ways P14 joins results into a row: each fails the
 * row when either part fails, and passes it only when both pass. No server.
 */
test('a row joined from two results fails when either part fails', () => {
  const part = (failures: string[]): CaseResult => ({
    gap,
    area,
    title: 'stand-in',
    request: 'GET /api/v3/admin/stand-in',
    attempts: [],
    control: {
      caller: 'stand-in',
      permissionKeys: null,
      expectedStatus: 200,
      status: failures.length === 0 ? 200 : 403,
      succeeded: failures.length === 0,
      carried: null,
      changed: null,
    },
    failures,
    result: failures.length === 0 ? 'PASS' : 'FAIL',
  })
  const passing = part([])
  const failing = part(['the allowed caller stand-in got 403, expected 200'])
  for (const join of [
    (first: CaseResult, second: CaseResult) => withSecondControl(first, second),
    (first: CaseResult, second: CaseResult) => bothRequests('stand-in', first, second),
  ]) {
    expect(join(passing, passing).result).toBe('PASS')
    expect(join(passing, failing).result).toBe('FAIL')
    expect(join(failing, passing).result).toBe('FAIL')
    expect(join(failing, failing).failures).toHaveLength(2)
  }
})
