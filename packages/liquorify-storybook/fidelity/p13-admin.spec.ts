import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
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
  ownOnly,
  rows,
  runCases,
} from './one-store'
import { guestAddress } from './orders'
import { ensurePaymentMethods, paymentNames } from './payments-delivery'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Step P13's part B, the customer refusals of batch 10 (G-99): the platform
 * work item's "Part B: refusal checks for G-99", rows B.1 to B.12. Each
 * request is sent as the teammates whose roles do not allow it, and as one
 * who may, and is judged by P7's `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says.
 * The script adds `staff.ts`'s teammates, then the customers this run aims
 * at, marked with the run's stamp. Results go to `results/p13/admin.json`,
 * with no response bodies or tokens.
 *
 * Every expected answer below is the one the work item recorded before this
 * script was written, by P10's rules A1 and A2 and P13's C1 to C3, with the
 * row number at the start of each case's title.
 */

const API = process.env.P13_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p13/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()

test.use({ baseURL: API })

const gap = 'G-99' as Gap
const creditAmount = '37.45'

interface Records {
  group: { id: string; name: string }
  main: Json
  profile: Json
  removable: Json
  erasable: Json
  bulk: Json
  editAddress: string
  deleteAddress: string
  credit: { id: string; memo: string }
  orderNumber: string
}

/** The run's records, made by the admin through the Admin API, in the default store. */
async function seedRecords(call: Admin): Promise<Records> {
  const customer = (name: string) =>
    call('POST', 'customers', {
      email: `p13-${name}-${run}@example.com`,
      first_name: 'P13',
      last_name: `${name} ${run}`,
    })
  const groupName = `P13 group ${run}`
  const group = await call('POST', 'customer_groups', { name: groupName })
  const main = await customer('main')
  const profile = await customer('profile')
  const removable = await customer('removable')
  const erasable = await customer('erasable')
  const bulk = await customer('bulk')

  const address = (street: string) =>
    call('POST', `customers/${main.id}/addresses`, { ...guestAddress, address1: street })
  const editAddress = await address(`${run} Alder Street`)
  const deleteAddress = await address(`${run} Birch Avenue`)

  const memo = `P13 credit ${run}`
  const credit = await call('POST', `customers/${main.id}/store_credits`, {
    amount: creditAmount,
    currency: 'USD',
    memo,
  })

  // One completed order of the main customer's, so the export and the
  // order reads have something to carry.
  const product = await call('POST', 'products', {
    name: `P13 teapot ${run}`,
    status: 'active',
    prices: [{ amount: '20.00', currency: 'USD' }],
  })
  const [variant] = rows(await call('GET', `products/${product.id}/variants?limit=10`))
  const variantId = String(variant?.id ?? product.default_variant_id)
  const locations = rows(await call('GET', 'stock_locations?limit=100'))
  const location = locations.find((item) => item.default) ?? locations[0]
  expect(location, 'a stock location').toBeTruthy()
  await call('POST', 'stock_levels/bulk_upsert', {
    stock_levels: [{ variant_id: variantId, stock_location_id: location.id, count_on_hand: 50 }],
  })
  await ensurePaymentMethods(API)
  const cheque = rows(await call('GET', 'payment_methods?limit=100')).find(
    (method) => method.name === paymentNames.cheque,
  )
  expect(cheque, 'the cheque method').toBeTruthy()
  const order = await call('POST', 'orders', {
    customer_id: main.id,
    email: main.email,
    shipping_address: guestAddress,
    billing_address: guestAddress,
    items: [{ variant_id: variantId, quantity: 1 }],
  })
  const current = await call('GET', `orders/${order.id}`)
  await call('POST', `orders/${order.id}/payments`, {
    payment_method_id: cheque?.id,
    amount: current.amount_due,
  })
  await call('PATCH', `orders/${order.id}/complete`, { notify_customer: false })
  const placed = await call('GET', `orders/${order.id}`)
  expect(placed.status, 'the order is placed').toBe('placed')

  return {
    group: { id: String(group.id), name: groupName },
    main,
    profile,
    removable,
    erasable,
    bulk,
    editAddress: String(editAddress.id),
    deleteAddress: String(deleteAddress.id),
    credit: { id: String(credit.id), memo },
    orderNumber: String(placed.number),
  }
}

/** Rows B.1 to B.12, in the work item's order. */
function customerCases(people: Record<string, Caller>, records: Records): Case[] {
  const { admin, support, orderManager, customerManager, merchandiser } = people
  const area = 'customers'
  const both = (expected: ReturnType<typeof denied>): Case['attempts'] => [
    { caller: orderManager, expected },
    { caller: support, expected },
  ]
  const read = (path: string, pick?: (sent: { status: number; body: unknown }) => unknown) => ({
    caller: admin,
    request: { method: 'GET' as const, path: `/api/v3/admin/${path}` },
    pick,
  })
  const ids = (sent: { body: unknown }) => rows(sent.body).map((item) => item.id)
  const { main, group } = records
  const at = (customer: Json, path = '') => `/api/v3/admin/customers/${customer.id}${path}`
  const newEmail = `p13-created-${run}@example.com`
  const mainEmail = String(main.email)
  const bulkPick = (sent: { status: number; body: unknown }) => {
    const body = sent.body as Json
    return [sent.status, body.customer_group_ids, body.tags]
  }
  const tag = `p13-tag-${run}`

  return [
    {
      gap,
      area,
      title: "B.1 Save a customer's profile, groups and internal note",
      request: {
        method: 'PATCH',
        path: at(records.profile),
        data: {
          first_name: `Changed ${run}`,
          internal_note: `P13 note ${run}`,
          customer_group_ids: [group.id],
        },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      protectedValues: [String(records.profile.email)],
      state: read(
        `customers/${records.profile.id}`,
        fields('first_name', 'internal_note', 'customer_group_ids'),
      ),
    },
    {
      gap,
      area,
      title: 'B.2 Create a customer',
      request: {
        method: 'POST',
        path: '/api/v3/admin/customers',
        data: { email: newEmail, first_name: 'P13', last_name: `Created ${run}` },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 201 },
      state: read(`customers?q[email_eq]=${encodeURIComponent(newEmail)}`, ids),
    },
    {
      gap,
      area,
      title: 'B.3 Delete a customer with no orders',
      request: { method: 'DELETE', path: at(records.removable) },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 204 },
      protectedValues: [String(records.removable.email)],
      state: read(`customers/${records.removable.id}`, fields('email')),
    },
    {
      gap,
      area,
      title: 'B.4 Erase a customer',
      request: { method: 'POST', path: at(records.erasable, '/anonymize'), data: {} },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      protectedValues: [String(records.erasable.email)],
      state: read(`customers/${records.erasable.id}`, fields('email', 'anonymized')),
    },
    {
      gap,
      area,
      title: "B.5 Export a customer's data (control: the order manager)",
      request: { method: 'GET', path: at(main, '/export') },
      attempts: [
        { caller: support, expected: denied('read_payments') },
        { caller: customerManager, expected: denied('read_orders') },
      ],
      control: { caller: orderManager, status: 200 },
      protectedValues: [mainEmail],
    },
    {
      gap,
      area,
      title: "B.5 Export a customer's data (control: the admin)",
      request: { method: 'GET', path: at(main, '/export') },
      attempts: [
        { caller: support, expected: denied('read_payments') },
        { caller: customerManager, expected: denied('read_orders') },
      ],
      control: { caller: admin, status: 200 },
      protectedValues: [mainEmail],
    },
    {
      gap,
      area,
      title: 'B.6 Add an address',
      request: {
        method: 'POST',
        path: at(main, '/addresses'),
        data: { ...guestAddress, address1: `${run} Cedar Court` },
      },
      attempts: both(notFound()),
      control: { caller: customerManager, status: 201 },
      protectedValues: [mainEmail],
      state: read(`customers/${main.id}/addresses?limit=100`, ids),
    },
    {
      gap,
      area,
      title: 'B.6 Change an address',
      request: {
        method: 'PATCH',
        path: at(main, `/addresses/${records.editAddress}`),
        data: { address1: `${run} Dogwood Drive`, city: 'Salem' },
      },
      attempts: both(notFound()),
      control: { caller: customerManager, status: 200 },
      protectedValues: [mainEmail],
      state: read(`customers/${main.id}/addresses?limit=100`, (sent) =>
        rows(sent.body).map((item) => [item.address1, item.city]),
      ),
    },
    {
      gap,
      area,
      title: 'B.6 Delete an address',
      request: { method: 'DELETE', path: at(main, `/addresses/${records.deleteAddress}`) },
      attempts: both(notFound()),
      control: { caller: customerManager, status: 204 },
      protectedValues: [mainEmail],
      state: read(`customers/${main.id}/addresses?limit=100`, ids),
    },
    {
      gap,
      area,
      title: 'B.7 Issue store credit',
      request: {
        method: 'POST',
        path: at(main, '/store_credits'),
        data: { amount: '5.00', currency: 'USD', memo: `P13 issued ${run}` },
      },
      attempts: both(notFound()),
      control: { caller: admin, status: 201 },
      protectedValues: [mainEmail, records.credit.memo],
      state: read(`customers/${main.id}/store_credits?limit=100`, ids),
    },
    {
      gap,
      area,
      title: 'B.8 Add customers to a group in bulk',
      request: {
        method: 'POST',
        path: '/api/v3/admin/customers/bulk_add_to_groups',
        data: { ids: [records.bulk.id], customer_group_ids: [group.id] },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      state: read(`customers/${records.bulk.id}`, bulkPick),
    },
    {
      gap,
      area,
      title: 'B.8 Remove customers from a group in bulk',
      request: {
        method: 'POST',
        path: '/api/v3/admin/customers/bulk_remove_from_groups',
        data: { ids: [records.bulk.id], customer_group_ids: [group.id] },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      state: read(`customers/${records.bulk.id}`, bulkPick),
    },
    {
      gap,
      area,
      title: 'B.9 Add a tag in bulk',
      request: {
        method: 'POST',
        path: '/api/v3/admin/customers/bulk_add_tags',
        data: { ids: [records.bulk.id], tags: [tag] },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      state: read(`customers/${records.bulk.id}`, bulkPick),
    },
    {
      gap,
      area,
      title: 'B.9 Remove a tag in bulk',
      request: {
        method: 'POST',
        path: '/api/v3/admin/customers/bulk_remove_tags',
        data: { ids: [records.bulk.id], tags: [tag] },
      },
      attempts: both(denied('write_customers')),
      control: { caller: customerManager, status: 200 },
      state: read(`customers/${records.bulk.id}`, bulkPick),
    },
    {
      gap,
      area,
      title: "B.10 Read a customer's store credit",
      request: { method: 'GET', path: at(main, '/store_credits?limit=100') },
      attempts: [{ caller: customerManager, expected: denied('read_store_credits') }],
      control: { caller: orderManager, status: 200 },
      protectedValues: [records.credit.memo, creditAmount],
    },
    {
      gap,
      area,
      title: "B.11 Read a customer's orders from the order list",
      request: {
        method: 'GET',
        path: `/api/v3/admin/orders?q[customer_id_eq]=${main.id}&limit=100`,
      },
      attempts: [{ caller: customerManager, expected: denied('read_orders') }],
      control: { caller: orderManager, status: 200 },
      protectedValues: [records.orderNumber],
    },
    {
      gap,
      area,
      title: "B.11 Read a customer's orders through the customer",
      request: { method: 'GET', path: at(main, '?expand=orders') },
      attempts: [{ caller: customerManager, expected: ownOnly }],
      control: { caller: orderManager, status: 200 },
      protectedValues: [records.orderNumber],
    },
    {
      gap,
      area,
      title: 'B.12 Read the customer list',
      request: {
        method: 'GET',
        path: `/api/v3/admin/customers?q[email_eq]=${encodeURIComponent(mainEmail)}`,
      },
      attempts: [{ caller: merchandiser, expected: denied('read_customers') }],
      control: { caller: support, status: 200 },
      protectedValues: [mainEmail],
    },
    {
      gap,
      area,
      title: 'B.12 Read a customer',
      request: { method: 'GET', path: at(main) },
      attempts: [{ caller: merchandiser, expected: denied('read_customers') }],
      control: { caller: support, status: 200 },
      protectedValues: [mainEmail],
    },
    {
      gap,
      area,
      title: 'B.12 Read the customer groups list',
      request: { method: 'GET', path: '/api/v3/admin/customer_groups?limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_customers') }],
      control: { caller: support, status: 200 },
      protectedValues: [group.name],
    },
  ]
}

test('the Admin API refuses the customer requests a role does not allow, within one store', async ({
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
  for (const key of ['support', 'orderManager', 'customerManager', 'merchandiser']) {
    people[key] = await adminCaller(request, key, teammates[key].email, PASSWORD, creds.store_id)
  }
  const call = adminCall(request, people.admin)

  const records = await seedRecords(call)
  const all: CaseResult[] = await runCases(request, customerCases(people, records))

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
        gaps: { 'G-99': gapResult(all) },
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
