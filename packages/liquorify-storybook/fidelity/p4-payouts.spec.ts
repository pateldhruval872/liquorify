import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { seedMarketplace, sellerHeaders, send, shopper } from './marketplace'
import { eventually, removeWebhookEndpoints, type Stripe, stripe, stripeMethod } from './p4'
import { revision, seeded, stamp } from './p9'
import { admin } from './staff'

/**
 * The platform batch's step P4, part 4: G-109's payouts (checks 4.18 to 4.21
 * of the work item), against Stripe's test mode.
 *
 * The server is the dashboard browser tests' own, started with the provider
 * gems (`stack.spec.ts`, `LIQUORIFY_PROVIDERS=1`). It runs after the Stripe
 * part has removed its payment method, so 4.18 sees Stripe's gem loaded with
 * no Stripe gateway set up. The marketplace is batch 13's (`marketplace.ts`).
 * Stripe's hosted onboarding is on `connect.stripe.com`, which the
 * environment refuses, so 4.20 records that refusal as its answer, and 4.21
 * has no sandbox call that reaches it; both are written as checks of the
 * intended result and fail where they stand.
 *
 * Results go to `results/p4/payouts/`. Keys are never written out.
 */

const results = new URL('./results/p4/payouts/', import.meta.url).pathname
let stripeApi: Stripe
const added: string[] = []

function save(name: string, data: object) {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ revision, stamp, ...data }, null, 2)}\n`,
  )
}

async function snap(page: Page, name: string) {
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}${name}.png`, fullPage: true })
}

interface PayoutProvider {
  id: string
  name: string
  available: boolean
  requires_payout_account: boolean
  default: boolean
}

const providers = (baseURL: string | undefined) =>
  seeded(
    baseURL,
    async (seed) => (await seed.get<{ data: PayoutProvider[] }>('payout_providers')).data,
  )

test.beforeAll(async () => {
  stripeApi = await stripe()
})

test.afterAll(async ({ baseURL }) => {
  const removed: string[] = []
  for (const id of added) removed.push(...(await removeWebhookEndpoints(stripeApi, id)))
  await seeded(baseURL, async (seed) => {
    await seed.patch('store', { payout_provider: '' })
    for (const id of added)
      await seed.api.delete(`/api/v3/admin/payment_methods/${id}`, { headers: seed.headers })
  })
  save('clean-up', { removedWebhookEndpoints: removed.length, paymentMethods: added.length })
  await stripeApi.dispose()
})

test('4.18 the payout providers, and the marketplace settings before Stripe is set up', async ({
  page,
  baseURL,
}) => {
  const listed = await providers(baseURL)
  const stripeMethods = await seeded(baseURL, async (seed) =>
    (
      await seed.get<{ data: { type: string; active: boolean }[] }>('payment_methods?limit=100')
    ).data.filter((each) => each.type === 'stripe'),
  )
  const { store_id: storeId } = getCredentials()
  await login(page)
  await page.goto(`/${storeId}/settings/marketplace`)
  const hint = page.getByText(
    'Stripe Connect pays sellers through its payment method, which is not active on this store yet.',
  )
  await expect(page.getByText('Paid through')).toBeVisible({ timeout: 15_000 })
  const hintShown = await hint
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false)
  await page.locator('#payout-provider').click()
  const option = page.getByRole('option', { name: 'Connect Stripe Connect to use it' })
  const optionShown = await option.isVisible()
  const optionDisabled = optionShown
    ? (await option.getAttribute('aria-disabled')) === 'true' ||
      (await option.getAttribute('data-disabled')) !== null
    : null
  await snap(page, '4.18-marketplace-settings')
  await page.keyboard.press('Escape')
  save('4.18', {
    providers: listed,
    stripeMethods: stripeMethods.length,
    hintShown,
    optionShown,
    optionDisabled,
  })
  expect(stripeMethods, 'no Stripe gateway is set up').toHaveLength(0)
  expect(listed.map((each) => each.id).sort()).toEqual(['stripe', 'system'])
  const stripeProvider = listed.find((each) => each.id === 'stripe')
  expect(stripeProvider?.name).toBe('Stripe Connect')
  expect(stripeProvider?.available).toBe(false)
  expect(stripeProvider?.requires_payout_account).toBe(true)
  expect(listed.find((each) => each.id === 'system')?.default).toBe(true)
  expect(hintShown, 'the provider not connected hint').toBe(true)
  expect(optionDisabled, 'Stripe Connect is listed but cannot be chosen').toBe(true)
})

interface Transfer {
  id: string
  status: string
  kind: string
  amount: string
  provider: string
  order_id: string | null
  seller_id: string
}

test("4.19 a seller's Stripe Connect onboarding link, and an earning held until they are onboarded", async ({
  page,
  baseURL,
}) => {
  const market = await seedMarketplace(baseURL as string)
  const { store_id: storeId } = getCredentials()

  // Stripe set up as 4.1 sets it up, through the Admin API.
  const method = await seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: { id: string; type: string }[] }>(
      'payment_methods?limit=100',
    )
    const existing = data.find((each) => each.type === 'stripe')
    if (existing) return existing
    const created = await stripeMethod(seed, 'Payouts')
    added.push(created.id)
    return created
  })

  // Chosen as the payout provider on the marketplace settings page.
  await login(page)
  await page.goto(`/${storeId}/settings/marketplace`)
  await page.locator('#payout-provider').click()
  await page.getByRole('option', { name: 'Stripe Connect', exact: true }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Store settings updated')).toBeVisible({ timeout: 15_000 })
  await snap(page, '4.19-stripe-chosen')
  const store = await seeded(baseURL, (seed) => seed.get<{ payout_provider: string }>('store'))

  // The seller asks for their onboarding link, as the seller panel does.
  const api = await request.newContext({ baseURL })
  const sellerEmail = market.users.approved
  const sellerId = market.sellers.approved
  const seller = await sellerHeaders(api, sellerEmail, sellerId)
  const linkAnswer = await api.post('/api/v3/seller/onboarding/payout_account', {
    headers: seller,
    data: { refresh_url: '/', return_url: '/' },
  })
  const linkBody = (await linkAnswer.json()) as { url?: string | null; error?: unknown }
  const onboardingLink = linkBody.url ?? null
  const connectAccount = await eventually(async () => {
    const { data } = await stripeApi.get<{
      data: {
        id: string
        metadata: Record<string, string>
        payouts_enabled: boolean
        details_submitted: boolean
      }[]
    }>('accounts?limit=100')
    const ours = data.filter((account) => account.metadata.spree_seller_id)
    return ours.length ? ours : undefined
  })

  // An order for that seller, placed and fulfilled.
  const { headers } = await admin(api)
  const checkout = await shopper(api, headers)
  const group = await checkout([market.products.active])
  const orders = (group.orders as { id: string }[] | undefined)?.map((order) => order.id) ?? [
    group.id as string,
  ]
  let sellerOrder: string | undefined
  for (const id of orders) {
    const order = await send(api, headers, 'get', `admin/orders/${id}`)
    if (order.seller_id === sellerId) sellerOrder = id
  }
  expect(sellerOrder, "the seller's order").toBeTruthy()
  const [fulfilment] = (await send(api, headers, 'get', `admin/orders/${sellerOrder}/fulfillments`))
    .data as {
    id: string
  }[]
  await send(
    api,
    headers,
    'patch',
    `admin/orders/${sellerOrder}/fulfillments/${fulfilment.id}/fulfill`,
    {
      tracking: `P4-${stamp}`,
      notify_customer: false,
    },
  )
  const transfers = (
    await send(api, headers, 'get', `admin/seller_transfers?q[order_id_eq]=${sellerOrder}&limit=50`)
  ).data as Transfer[]
  await api.dispose()

  save('4.19', {
    paymentMethod: method.id,
    payoutProvider: store.payout_provider,
    onboarding: {
      status: linkAnswer.status(),
      host: onboardingLink ? new URL(onboardingLink).host : null,
      error: linkBody.error ?? null,
    },
    connectAccounts: connectAccount?.map((account) => ({
      id: account.id,
      sellerId: account.metadata.spree_seller_id,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
    })),
    transfers: transfers.map((each) => ({
      kind: each.kind,
      status: each.status,
      amount: each.amount,
      provider: each.provider,
    })),
  })
  expect(store.payout_provider).toBe('stripe')
  expect(linkAnswer.status(), JSON.stringify(linkBody)).toBe(200)
  expect(onboardingLink, "a link to Stripe's hosted onboarding").toMatch(
    /^https:\/\/connect\.stripe\.com\//,
  )
  expect(connectAccount?.length, 'a Connect account in test mode for the seller').toBeGreaterThan(0)
  const earning = transfers.find((each) => each.kind === 'earning')
  expect(earning, "the seller's earning").toBeTruthy()
  expect(earning?.provider).toBe('stripe')
  expect(earning?.status, 'held as pending while the account is not onboarded').toBe('pending')
})

test("4.20 the seller's hosted onboarding, then a payout that pays and one that fails", async () => {
  // Stripe's hosted onboarding is the only way an Express account is
  // completed. Whether this environment can open it is the first answer.
  const reach = await request.newContext({
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  })
  const answer = await reach
    .get('https://connect.stripe.com/', { maxRedirects: 0, timeout: 15_000 })
    .then((res) => ({ status: res.status(), error: null as string | null }))
    .catch((error: Error) => ({
      status: null as number | null,
      error: error.message.split('\n')[0],
    }))
  await reach.dispose()
  save('4.20', { connectStripeCom: answer })
  // The environment's proxy answers a refused host with 403 itself.
  expect(answer.error, 'connect.stripe.com is reachable for the hosted onboarding').toBeNull()
  expect(answer.status, 'connect.stripe.com is reachable for the hosted onboarding').toBeLessThan(
    400,
  )
})

test('4.21 an unresolved transfer', async () => {
  // Spree parks a transfer as unresolved only when Stripe's answer is lost
  // after the request was sent. No sandbox call produces that without
  // changing the network path or Spree's code, so nothing is sent here.
  save('4.21', {
    status: 'NOT_RUN',
    reason: 'no sandbox call loses Stripe’s answer after the request is sent',
  })
  test.skip(true, 'NOT_RUN: no sandbox call loses Stripe’s answer after the request is sent')
})
