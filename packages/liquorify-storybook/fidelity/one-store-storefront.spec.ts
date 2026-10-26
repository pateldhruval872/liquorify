import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, request as playwright, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { seedDevelopers } from './developers'
import {
  adminCaller,
  runStorefrontCase,
  type StorefrontCase,
  type StorefrontExpected,
  type StorefrontProbe,
  send,
} from './one-store'
import { addShoppers, PASSWORD, publishableKey } from './shoppers'
import { seed } from './staff'

/**
 * Step P7's check of the storefront's own server code, for G-11's shopper
 * accounts: the account pages and the server actions behind them, reached as
 * a browser reaches them, signed in as another customer of the same store and
 * as a guest, each beside the record's own customer. The storefront keeps the
 * customer's token in a cookie and calls the Store API with it, so this checks
 * that its code passes the right customer's token and shows nothing the API
 * refused.
 *
 * Start Spree's browser-test server freshly, as `stack.spec.ts` says, then the
 * storefront at the revision under test, built (`next build`) and started
 * (`next start`) on port 3001 with `SPREE_API_URL` naming the server and
 * `SPREE_PUBLISHABLE_KEY` its store's publishable key. Set
 * `STOREFRONT_DIR` to the storefront's checkout: each action's id is read from
 * its build's `.next/server/server-reference-manifest.json`, as the browser
 * reads it from the page's code. The customers sign in through the
 * storefront's own sign-in action. Results go to `results/p7/storefront.json`,
 * with no page bodies, tokens or gift card codes.
 *
 * Expected answers, from the storefront's code at the revision under test: an
 * action that reads one record answers `null` when the Store API refuses
 * (`withFallback`); one that changes a record answers `{ success: false }`
 * with the API's message, "Address not found" or "Credit card not found", for
 * another customer's record, and "Not authenticated" for a guest
 * (`withAuthRefresh`); a list answers the fallback's empty list for a guest. A
 * guest asking for an account page, or for an action only an account page
 * carries, is redirected to sign in by the storefront's middleware before any
 * of its code runs.
 */

const API = process.env.P7_API_URL ?? 'http://localhost:3010'
const STOREFRONT = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const DIR = process.env.STOREFRONT_DIR ?? ''
const results = new URL('./results/p7/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const storefrontRevision = process.env.STOREFRONT_REVISION ?? null
const run = Date.now()
const BASE = '/us/en'

test.use({ baseURL: API })

interface Manifest {
  node: Record<
    string,
    { filename?: string; exportedName?: string; workers: Record<string, unknown> }
  >
}

/** A page path from a build worker's name: `app/[country]/[locale]/(storefront)/account/…/page`. */
const pagePath = (worker: string) =>
  `/${worker
    .replace(/^app\//, '')
    .replace(/\/page$/, '')
    .split('/')
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .map((segment) =>
      segment === '[country]'
        ? 'us'
        : segment === '[locale]'
          ? 'en'
          : segment.replace(/^\[.*\]$/, 'p7'),
    )
    .join('/')}`

test('the storefront shows each customer only their own account, within one store', async ({
  request,
}) => {
  test.skip(!DIR, "Run with STOREFRONT_DIR naming the storefront's checkout")
  const manifest = JSON.parse(
    readFileSync(`${DIR}/.next/server/server-reference-manifest.json`, 'utf8'),
  ) as Manifest
  const action = (file: string, name: string) => {
    const found = Object.entries(manifest.node).find(
      ([, entry]) => entry.filename === `src/lib/data/${file}.ts` && entry.exportedName === name,
    )
    expect(found, `the build carries ${name}`).toBeTruthy()
    const [id, entry] = found as [string, Manifest['node'][string]]
    const pages = Object.keys(entry.workers).map(pagePath)
    // A signed-in customer posts from the account page that carries the
    // action; a guest from a page outside the account, if one carries it.
    const account = pages.find((page) => page.startsWith(`${BASE}/account/`)) ?? pages[0]
    const open = pages.find((page) => !page.startsWith(`${BASE}/account`))
    return { id, account, open }
  }

  const creds = getCredentials()
  await seed(API)
  const { gatewayId } = await seedDevelopers(API)
  const admin = await adminCaller(
    request,
    'admin',
    creds.admin_email,
    creds.admin_password,
    creds.store_id,
  )
  const key = await publishableKey(request, admin)
  const { owner, other, lines, addresses, order, cards, gift } = await addShoppers(
    request,
    admin,
    key,
    gatewayId,
    run,
  )

  // Each visitor is a cookie jar, as a browser is. The two customers sign in
  // through the storefront's own sign-in action, which sets their cookies.
  const login = action('customer', 'login')
  const contexts: Record<string, APIRequestContext> = {}
  for (const [name, email] of [
    ['owner', owner.email],
    ['other', other.email],
    ['guest', null],
  ] as const) {
    contexts[name] = await playwright.newContext({ baseURL: STOREFRONT })
    if (!email) continue
    const signedIn = await contexts[name].post(`${BASE}/account`, {
      headers: {
        'Next-Action': login.id,
        'Content-Type': 'text/plain;charset=UTF-8',
        Accept: 'text/x-component',
      },
      data: JSON.stringify([email, PASSWORD]),
      maxRedirects: 0,
    })
    expect(signedIn.status(), `signing ${name} in`).toBe(200)
    expect((await signedIn.text()).includes('"success":true'), `${name} signed in`).toBe(true)
  }

  // The owner's records, read straight from the Store API with the owner's token.
  const ownerRead = (path: string) => async () => {
    const sent = await send(request, owner.caller, { method: 'GET', path })
    return { status: sent.status, body: sent.text }
  }
  const me = '/api/v3/store/customers/me'
  const signIn = (page: string) => `${BASE}/account?redirect=${encodeURIComponent(page)}`
  const call = (
    file: string,
    name: string,
    args: unknown[],
  ): { signedIn: StorefrontProbe; guest: StorefrontProbe; guestRedirect: string | null } => {
    const found = action(file, name)
    return {
      signedIn: { page: found.account, action: { id: found.id, args } },
      guest: { page: found.open ?? found.account, action: { id: found.id, args } },
      guestRedirect: found.open ? null : signIn(found.account),
    }
  }
  const guestExpects = (probe: ReturnType<typeof call>, expected: StorefrontExpected) =>
    probe.guestRedirect ? { redirectTo: probe.guestRedirect } : expected
  const edit = `P7 edit ${run}`
  const emptyList = { data: [] }
  const emptyOrders = {
    data: [],
    meta: {
      page: 1,
      limit: 25,
      count: 0,
      pages: 0,
      from: 0,
      to: 0,
      in: 0,
      previous: null,
      next: null,
    },
  }
  const notAuthenticated = { result: { success: false, error: 'Not authenticated' } }

  const orderPage = `${BASE}/account/orders/${order.id}`
  const getOrder = call('orders', 'getOrder', [order.id])
  const getAddress = call('addresses', 'getAddress', [addresses.kept])
  const updateAddress = call('addresses', 'updateAddress', [addresses.kept, { address1: edit }])
  const deleteAddress = call('addresses', 'deleteAddress', [addresses.spare])
  const deleteCard = call('credit-cards', 'deleteCreditCard', [cards.spareCard])
  const getGiftCard = call('gift-cards', 'getGiftCard', [gift.id])
  const getAddresses = call('addresses', 'getAddresses', [])
  const getCards = call('credit-cards', 'getCreditCards', [])
  const getGiftCards = call('gift-cards', 'getGiftCards', [])
  const getOrders = call('orders', 'getOrders', [])
  const getCustomer = call('customer', 'getCustomer', [])

  const cases: StorefrontCase[] = [
    {
      gap: 'G-11',
      title: "Open another customer's order page",
      attempts: [
        {
          caller: 'other',
          probe: { page: orderPage },
          expected: { page: 200, shows: ['Order not found', 'looking for'] },
        },
        {
          caller: 'guest',
          probe: { page: orderPage },
          expected: { redirectTo: signIn(orderPage) },
        },
      ],
      control: {
        caller: 'owner',
        probe: { page: orderPage },
        expected: { page: 200, shows: [order.number] },
      },
      protectedValues: [order.number, lines.order],
    },
    {
      gap: 'G-11',
      title: 'Read an order through its server action',
      attempts: [
        { caller: 'other', probe: getOrder.signedIn, expected: { result: null } },
        {
          caller: 'guest',
          probe: getOrder.guest,
          expected: guestExpects(getOrder, { result: null }),
        },
      ],
      control: {
        caller: 'owner',
        probe: getOrder.signedIn,
        expected: { result: { id: order.id, number: order.number } },
      },
      protectedValues: [order.number, lines.order],
    },
    {
      gap: 'G-11',
      title: 'Read an address through its server action',
      attempts: [
        { caller: 'other', probe: getAddress.signedIn, expected: { result: null } },
        {
          caller: 'guest',
          probe: getAddress.guest,
          expected: guestExpects(getAddress, { result: null }),
        },
      ],
      control: {
        caller: 'owner',
        probe: getAddress.signedIn,
        expected: { result: { id: addresses.kept } },
      },
      protectedValues: [lines.kept, owner.last],
    },
    {
      gap: 'G-11',
      title: 'Change an address through its server action',
      attempts: [
        {
          caller: 'other',
          probe: updateAddress.signedIn,
          expected: { result: { success: false, error: 'Address not found' } },
        },
        {
          caller: 'guest',
          probe: updateAddress.guest,
          expected: guestExpects(updateAddress, notAuthenticated),
        },
      ],
      control: {
        caller: 'owner',
        probe: updateAddress.signedIn,
        expected: { result: { success: true, address: { id: addresses.kept, address1: edit } } },
      },
      protectedValues: [lines.kept, owner.last],
      state: ownerRead(`${me}/addresses/${addresses.kept}`),
    },
    {
      gap: 'G-11',
      title: 'Delete an address through its server action',
      attempts: [
        {
          caller: 'other',
          probe: deleteAddress.signedIn,
          expected: { result: { success: false, error: 'Address not found' } },
        },
        {
          caller: 'guest',
          probe: deleteAddress.guest,
          expected: guestExpects(deleteAddress, notAuthenticated),
        },
      ],
      control: {
        caller: 'owner',
        probe: deleteAddress.signedIn,
        expected: { result: { success: true } },
      },
      protectedValues: [lines.spare, owner.last],
      state: ownerRead(`${me}/addresses/${addresses.spare}`),
    },
    {
      gap: 'G-11',
      title: 'Delete a saved card through its server action',
      attempts: [
        {
          caller: 'other',
          probe: deleteCard.signedIn,
          expected: { result: { success: false, error: 'Credit card not found' } },
        },
        {
          caller: 'guest',
          probe: deleteCard.guest,
          expected: guestExpects(deleteCard, notAuthenticated),
        },
      ],
      control: {
        caller: 'owner',
        probe: deleteCard.signedIn,
        expected: { result: { success: true } },
      },
      protectedValues: [cards.spareCard],
      state: ownerRead(`${me}/credit_cards/${cards.spareCard}`),
    },
    {
      gap: 'G-11',
      title: 'Read a gift card through its server action',
      attempts: [
        { caller: 'other', probe: getGiftCard.signedIn, expected: { result: null } },
        {
          caller: 'guest',
          probe: getGiftCard.guest,
          expected: guestExpects(getGiftCard, { result: null }),
        },
      ],
      control: {
        caller: 'owner',
        probe: getGiftCard.signedIn,
        expected: { result: { id: gift.id } },
      },
      protectedValues: [gift.code],
    },
    ...(
      [
        [
          'List the addresses through their server action',
          getAddresses,
          emptyList,
          [owner.last, addresses.kept],
        ],
        ['List the saved cards through their server action', getCards, emptyList, [cards.keptCard]],
        ['List the gift cards through their server action', getGiftCards, emptyList, [gift.code]],
        ['List the orders through their server action', getOrders, emptyOrders, [order.number]],
        [
          'Read the profile through its server action',
          getCustomer,
          null,
          [owner.email, owner.last],
        ],
      ] as const
    ).map(
      ([title, probe, guestResult, values]): StorefrontCase => ({
        gap: 'G-11',
        title,
        attempts: [
          { caller: 'other', probe: probe.signedIn, expected: { ownResult: true } },
          {
            caller: 'guest',
            probe: probe.guest,
            expected: guestExpects(probe, { result: guestResult }),
          },
        ],
        control: { caller: 'owner', probe: probe.signedIn, expected: { ownResult: true } },
        protectedValues: [...values],
      }),
    ),
  ]

  const all = []
  try {
    for (const item of cases) all.push(await runStorefrontCase(contexts, item))
  } finally {
    for (const context of Object.values(contexts)) await context.dispose()
  }
  const passed = all.filter((item) => item.result === 'PASS').length
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}storefront.json`,
    JSON.stringify(
      {
        revision,
        storefrontRevision,
        run,
        store: 'default',
        gaps: {
          'G-11': {
            cases: all.length,
            attempts: all.reduce((sum, item) => sum + item.attempts.length, 0),
            passed,
            failed: all.filter((item) => item.result === 'FAIL').map((item) => item.title),
          },
        },
        cases: all,
      },
      null,
      2,
    ),
  )
  expect(
    all
      .filter((item) => item.result === 'FAIL')
      .map((item) => ({ title: item.title, failures: item.failures })),
    'every case passed',
  ).toEqual([])
})
