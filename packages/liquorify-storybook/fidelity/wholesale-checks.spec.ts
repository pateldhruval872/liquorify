import { mkdirSync, writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { type APIRequestContext, expect, test } from '@playwright/test'
import {
  BUYER_PASSWORD,
  buyers,
  catalogAdjustment,
  catalogSku,
  priceListAmount,
  priceListMinimum,
  priceListSku,
  type SeededCompanies,
  seedCompanies,
} from './companies'
import { call, type Headers, type Json, list } from './orders'
import { publishableKey } from './shoppers'
import { admin } from './staff'

/**
 * Batch 12's settings checked where they take effect (work item §2.4), on
 * Spree's browser-test server, through its Admin and Store APIs. The dashboard
 * side of each row is captured by `screens-batch-12.spec.ts`; this file reads
 * the other side: what a buyer's cart, a company's draft order and the Store
 * API's company endpoints answer. Every record it reads or writes is one of
 * `companies.ts`'s invented ones, in the default store.
 *
 * The tax rows add an invented 10% rate for Oregon, where the companies'
 * addresses are, and remove it at the end. Each row is written to
 * `results/checks/wholesale/<row>.json`. A buyer's token stays in memory.
 *
 * An invitation's token is sent only in its email, so the acceptance row reads
 * it from the server's database when `FIDELITY_DATABASE` names that file, and
 * records NOT_RUN otherwise. The token is never written out.
 *
 * Start the screens as `compare.spec.ts` describes.
 */

const results = new URL('./results/checks/wholesale/', import.meta.url).pathname
const apiBase = process.env.FIDELITY_API_URL ?? 'http://localhost:3010'

let companies: SeededCompanies
let headers: Headers
let key: string

function record(name: string, facts: unknown) {
  mkdirSync(results, { recursive: true })
  writeFileSync(`${results}${name}.json`, `${JSON.stringify(facts, null, 2)}\n`)
}

async function store(
  api: APIRequestContext,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  extra: Record<string, string>,
  data?: object,
) {
  const res = await api[method](`/api/v3/store/${path}`, {
    headers: { 'X-Spree-API-Key': key, ...extra },
    data,
  })
  const text = await res.text()
  return { status: res.status(), body: (text ? JSON.parse(text) : {}) as Json }
}

async function buyerToken(api: APIRequestContext, email: string) {
  const res = await api.post('/api/v3/store/auth/login', {
    headers: { 'X-Spree-API-Key': key },
    data: { email, password: BUYER_PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  return { Authorization: `Bearer ${token}` }
}

/** A cart's lines and requirements, without its token. */
const cartFacts = (cart: Json) => ({
  company_id: cart.company_id ?? null,
  company_name: cart.company_name ?? null,
  po_number: cart.po_number ?? null,
  po_number_required: cart.po_number_required ?? null,
  requirements: cart.requirements ?? null,
  items: ((cart.items as Json[]) ?? []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
  })),
})

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  companies = await seedCompanies(apiBase)
  headers = (await admin(request)).headers
  key = await publishableKey(request, { name: 'admin', headers })
})

test.use({ baseURL: apiBase })

test('a company that requires a purchase order number', async ({ request }) => {
  const member = await buyerToken(request, buyers.member.email)
  const variant = companies.catalogVariant.id
  const steps: Json[] = []
  for (const company of [companies.bistro, companies.group]) {
    const created = await store(request, 'post', 'carts', member, {
      company_id: company.id,
      items: [{ variant_id: variant, quantity: 1 }],
    })
    steps.push({
      step: `the member's cart for ${company.name}`,
      status: created.status,
      cart: cartFacts(created.body),
    })
    if (created.status !== 201) continue
    const cartHeaders = { ...member, 'X-Spree-Token': String(created.body.token) }
    const numbered = await store(request, 'patch', `carts/${created.body.id}`, cartHeaders, {
      po_number: 'FID-PO-0042',
    })
    steps.push({
      step: `the same cart with a purchase order number`,
      status: numbered.status,
      cart: cartFacts(numbered.body),
    })
  }
  const staffOrder = await request.post('/api/v3/admin/orders', {
    headers,
    data: {
      company_id: companies.bistro.id,
      customer_id: companies.member.id,
      items: [{ variant_id: variant, quantity: 1 }],
    },
  })
  const staffBody = (await staffOrder.json()) as Json
  steps.push({
    step: 'a staff order for the company with no purchase order number, through the Admin API',
    status: staffOrder.status(),
    po_number: staffBody.po_number ?? null,
    company_id: staffBody.company_id ?? null,
  })
  record('purchase-order', steps)
})

test('a member added and removed, and invitations accepted and revoked', async ({ request }) => {
  const steps: Json[] = []
  const newcomer = await buyerToken(request, buyers.toAdd.email)
  const read = async (step: string) => {
    const answer = await store(request, 'get', 'account/companies', newcomer)
    steps.push({
      step,
      status: answer.status,
      companies: ((answer.body.data as Json[]) ?? []).map((each) => (each.company as Json)?.name),
    })
  }
  await read('the newcomer’s companies before')
  const membership = await call(
    api(request),
    headers,
    'post',
    `companies/${companies.empty.id}/memberships`,
    {
      customer_email: buyers.toAdd.email,
    },
  )
  await read('after the Admin API made them a member of Quillon Provisions')
  await call(
    api(request),
    headers,
    'delete',
    `companies/${companies.empty.id}/memberships/${membership.id}`,
  )
  await read('after the membership was removed')

  // The token lives only in the email, which this stack does not send (§2.7),
  // so it is read from the browser-test server's own database, never written
  // out, and used as the email's link would be.
  const tokenFor = (email: string): string | undefined => {
    const file = process.env.FIDELITY_DATABASE
    if (!file) return undefined
    const database = new DatabaseSync(file, { readOnly: true })
    const row = database
      .prepare(
        'SELECT token FROM spree_company_invitations WHERE email = ? ORDER BY id DESC LIMIT 1',
      )
      .get(email) as { token: string } | undefined
    database.close()
    return row?.token
  }
  const path = `companies/${companies.empty.id}/invitations`
  const invite = async (email: string) => {
    await call(api(request), headers, 'post', `companies/${companies.empty.id}/memberships`, {
      customer_email: email,
    })
    return (await list(request, headers, path)).find((each) => each.email === email)
  }
  const lookUp = async (token: string | undefined) => {
    if (!token) return { status: 'NOT_RUN: FIDELITY_DATABASE not set' }
    const answer = await store(request, 'get', `company_invitations/${token}`, {})
    return { status: answer.status, company_name: answer.body.company_name ?? null }
  }

  const accepting = `fidelity-check-accept-${Date.now()}@example.com`
  const toAccept = await invite(accepting)
  const acceptToken = tokenFor(accepting)
  const lookedUp = await lookUp(acceptToken)
  let accepted: Json = { status: 'NOT_RUN: FIDELITY_DATABASE not set' }
  let joined: Json = {}
  if (acceptToken) {
    const answer = await store(
      request,
      'post',
      `company_invitations/${acceptToken}/accept`,
      {},
      {
        first_name: 'Imogen',
        last_name: 'Vale',
        password: BUYER_PASSWORD,
        password_confirmation: BUYER_PASSWORD,
      },
    )
    accepted = { status: answer.status, role: answer.body.role ?? null }
    const signedIn = await buyerToken(request, accepting)
    const theirs = await store(request, 'get', 'account/companies', signedIn)
    joined = {
      status: theirs.status,
      companies: ((theirs.body.data as Json[]) ?? []).map((each) => (each.company as Json)?.name),
    }
  }
  steps.push({
    step: 'an invitation made for an email with no account, looked up and accepted through the Store API, as the email’s link would',
    made: { status: toAccept?.status ?? null },
    looked_up: lookedUp,
    accepted_with_a_new_account: accepted,
    the_new_buyer_reads_their_companies: joined,
    looked_up_again: await lookUp(acceptToken),
  })

  const revoking = `fidelity-check-revoke-${Date.now()}@example.com`
  const toRevoke = await invite(revoking)
  const revokeToken = tokenFor(revoking)
  const before = await lookUp(revokeToken)
  await call(api(request), headers, 'delete', `${path}/${toRevoke?.id}`)
  const after = await request.get(`/api/v3/admin/${path}/${toRevoke?.id}`, { headers })
  let acceptAfterRevoke: Json = { status: 'NOT_RUN: FIDELITY_DATABASE not set' }
  if (revokeToken) {
    const answer = await store(
      request,
      'post',
      `company_invitations/${revokeToken}/accept`,
      {},
      {
        first_name: 'Rowan',
        last_name: 'Pike',
        password: BUYER_PASSWORD,
        password_confirmation: BUYER_PASSWORD,
      },
    )
    acceptAfterRevoke = { status: answer.status }
  }
  steps.push({
    step: 'an invitation made for an email with no account, then revoked',
    made: { status: toRevoke?.status ?? null },
    looked_up_before_revoking: before,
    after_revoke: {
      status: after.status(),
      invitation_status: ((await after.json()) as Json).status,
    },
    looked_up_after_revoking: await lookUp(revokeToken),
    accept_after_revoking: acceptAfterRevoke,
  })
  record('members-and-invitations', steps)
})

test('certificates and the tax on a company’s order', async ({ request }) => {
  const categories = await list(request, headers, 'tax_categories')
  const category = categories.find((each) => each.is_default) ?? categories[0]
  const rate = await call(api(request), headers, 'post', 'tax_rates', {
    name: 'Fidelity Oregon check tax',
    rate_percent: '10',
    tax_category_id: category.id,
    country_code: 'US',
    state_code: 'OR',
  })
  const address = {
    first_name: 'Marisol',
    last_name: 'Ortega',
    address1: '400 Larkspur Avenue',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97205',
    phone: '555-0150',
  }
  const variant = companies.catalogVariant.id
  const orderFor = async (company: Json, customer: Json) => {
    const order = await call(api(request), headers, 'post', 'orders', {
      company_id: company.id,
      customer_id: customer.id,
      items: [{ variant_id: variant, quantity: 1 }],
      shipping_address: address,
      use_shipping_as_billing: true,
    })
    const read = await call(api(request), headers, 'get', `orders/${order.id}`)
    return {
      company: company.name,
      item_total: read.item_total,
      tax_total: read.tax_total,
      additional_tax_total: read.additional_tax_total,
      total: read.total,
    }
  }
  const rows: Json[] = []
  try {
    rows.push({ certificate: 'none', ...(await orderFor(companies.empty, companies.member)) })
    rows.push({
      certificate:
        'accepted, current, for Oregon (FID-RES-1002), with pending, revoked and lapsed ones beside it',
      ...(await orderFor(companies.group, companies.member)),
    })
    rows.push({
      certificate: 'the division’s legal entity’s, read for a division’s order',
      ...(await orderFor(companies.north, companies.wholesaleBuyer)),
    })

    const reasons = await list(request, headers, 'tax_exemption_reasons')
    const certificates = `companies/${companies.bistro.id}/tax_exemption_certificates`
    for (const each of await list(request, headers, certificates)) {
      if (String(each.certificate_number).startsWith('FID-CHECK')) {
        if (each.status === 'verified') {
          await request.patch(`/api/v3/admin/${certificates}/${each.id}/revoke`, { headers })
        }
        await request.delete(`/api/v3/admin/${certificates}/${each.id}`, { headers })
      }
    }
    const made = await call(api(request), headers, 'post', certificates, {
      certificate_number: 'FID-CHECK-2001',
      tax_exemption_reason_id: reasons[0].id,
      country_code: 'US',
      state_code: 'OR',
    })
    rows.push({ certificate: 'pending', ...(await orderFor(companies.bistro, companies.member)) })
    await call(api(request), headers, 'patch', `${certificates}/${made.id}/verify`)
    rows.push({ certificate: 'accepted', ...(await orderFor(companies.bistro, companies.member)) })
    await call(api(request), headers, 'patch', `${certificates}/${made.id}/revoke`)
    rows.push({ certificate: 'revoked', ...(await orderFor(companies.bistro, companies.member)) })
    await request.delete(`/api/v3/admin/${certificates}/${made.id}`, { headers })
    const lapsed = await call(api(request), headers, 'post', certificates, {
      certificate_number: 'FID-CHECK-2002',
      tax_exemption_reason_id: reasons[0].id,
      country_code: 'US',
      state_code: 'OR',
      issued_at: '2024-01-01T00:00:00Z',
      expires_at: '2025-01-01T00:00:00Z',
    })
    await call(api(request), headers, 'patch', `${certificates}/${lapsed.id}/verify`)
    rows.push({
      certificate: 'accepted but past its date (lapsed)',
      ...(await orderFor(companies.bistro, companies.member)),
    })
    await request.patch(`/api/v3/admin/${certificates}/${lapsed.id}/revoke`, { headers })
    await request.delete(`/api/v3/admin/${certificates}/${lapsed.id}`, { headers })
    const elsewhere = await call(api(request), headers, 'post', certificates, {
      certificate_number: 'FID-CHECK-2003',
      tax_exemption_reason_id: reasons[0].id,
      country_code: 'US',
      state_code: 'WA',
    })
    await call(api(request), headers, 'patch', `${certificates}/${elsewhere.id}/verify`)
    rows.push({
      certificate: 'accepted, current, for Washington only',
      ...(await orderFor(companies.bistro, companies.member)),
    })
    await request.patch(`/api/v3/admin/${certificates}/${elsewhere.id}/revoke`, { headers })
    await request.delete(`/api/v3/admin/${certificates}/${elsewhere.id}`, { headers })
  } finally {
    await request.delete(`/api/v3/admin/tax_rates/${rate.id}`, { headers })
  }
  record('certificates-and-tax', { rate: 'Fidelity Oregon check tax, 10%, Oregon only', rows })
})

test('a company’s address book as a member reads it', async ({ request }) => {
  const member = await buyerToken(request, buyers.member.email)
  const answer = await store(request, 'get', `companies/${companies.group.id}/addresses`, member)
  const outsider = await buyerToken(request, buyers.toAdd.email)
  const refused = await store(request, 'get', `companies/${companies.group.id}/addresses`, outsider)
  record('address-book', {
    member: {
      status: answer.status,
      addresses: ((answer.body.data as Json[]) ?? []).map((each) => ({
        label: each.label,
        address1: each.address1,
        is_default_billing: each.is_default_billing,
        is_default_shipping: each.is_default_shipping,
      })),
    },
    not_a_member: { status: refused.status, error: (refused.body.error as Json)?.code ?? null },
  })
})

test('the catalog and the Wholesale price list, as each buyer is priced', async ({ request }) => {
  const wholesale = await buyerToken(request, buyers.wholesale.email)
  const member = await buyerToken(request, buyers.member.email)
  const outsider = await buyerToken(request, buyers.toAdd.email)
  const callers: [string, Record<string, string>, Json | null][] = [
    ['guest', {}, null],
    ['a customer in no company and no group (Ines Duarte)', outsider, null],
    [
      'a member of the catalog’s company, not in the Wholesale group (Dev Kapoor)',
      member,
      companies.group,
    ],
    [
      'a member of the company’s division, in the Wholesale group (Marisol Ortega), buying for the division',
      wholesale,
      companies.north,
    ],
    ['the same buyer, with no company named on the cart', wholesale, null],
    [
      'a customer in the Wholesale group and in no company (Tomas Reyes)',
      await buyerToken(request, buyers.groupOnly.email),
      null,
    ],
  ]
  const rows: Json[] = []
  for (const [who, auth, company] of callers) {
    for (const [sku, variant] of [
      [catalogSku, companies.catalogVariant],
      [priceListSku, companies.listVariant],
    ] as const) {
      for (const quantity of [1, priceListMinimum - 1, priceListMinimum]) {
        const created = await store(request, 'post', 'carts', auth, {
          ...(company ? { company_id: company.id } : {}),
          items: [{ variant_id: variant.id, quantity }],
        })
        const line = ((created.body.items as Json[]) ?? [])[0]
        rows.push({
          who,
          company: company?.name ?? null,
          sku,
          quantity,
          status: created.status,
          error: (created.body.error as Json)?.message ?? null,
          unit_price: line?.price ?? null,
          line_total: line?.total ?? null,
        })
      }
    }
  }
  record('prices', {
    catalog: `${companies.catalog.name}: ${catalogSku}'s product, ${catalogAdjustment}% for ${companies.group.name}`,
    price_list: `${companies.priceList.name}: ${priceListSku} at ${priceListAmount} for the Wholesale group, from ${priceListMinimum} units`,
    store_prices: {
      [catalogSku]: companies.catalogVariant.price ?? null,
      [priceListSku]: companies.listVariant.price ?? null,
    },
    rows,
  })
})

const api = (request: APIRequestContext) => request

/**
 * The invitation email's link (work item §2.7), followed on the storefront
 * built against the same server (`storefront-run.mjs`, on `STOREFRONT_URL`).
 * The email points at `/account/company-invitation?token=…`. The link here
 * carries a made-up token, since the page's existence is what is checked, and
 * is followed by a guest and by a signed-in buyer.
 */
test('the invitation email’s link on the storefront', async ({ page }) => {
  const storefront = process.env.STOREFRONT_URL
  test.skip(!storefront, 'Start the storefront and set STOREFRONT_URL (see above)')
  const link = `${storefront}/account/company-invitation?token=not-a-real-token`
  const folder = `${results}invitation-link/`
  mkdirSync(folder, { recursive: true })
  const steps: Json[] = []
  await page.setViewportSize({ width: 1280, height: 960 })
  await page.goto(link)
  await page.waitForLoadState('networkidle')
  steps.push({
    step: 'a guest follows the link',
    landed:
      new URL(page.url()).pathname +
      new URL(page.url()).search.replace(/token(%3D|=)[^&]*/i, 'token=…'),
  })
  await page.screenshot({ path: `${folder}1-guest.png` })

  await page.locator('#email').fill(buyers.member.email)
  await page.locator('#password').fill(BUYER_PASSWORD)
  await page
    .locator('form')
    .getByRole('button', { name: /^sign in$/i })
    .click()
  await expect(page.locator('#email')).toHaveCount(0, { timeout: 15_000 })
  await page.goto(link)
  await page.waitForLoadState('networkidle')
  const missing = await page
    .getByText(/could not be found|not found|404/i)
    .first()
    .isVisible()
  steps.push({
    step: 'a signed-in buyer follows the link',
    landed: new URL(page.url()).pathname,
    page_not_found: missing,
  })
  await page.screenshot({ path: `${folder}2-signed-in.png` })
  record('invitation-link', steps)
})
