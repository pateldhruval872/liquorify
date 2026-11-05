import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { locationNames } from './inventory'
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
  maskIds,
  notFound,
  type Probe,
  rows,
  runCases,
  send,
} from './one-store'
import { ensurePaymentMethods, paymentNames } from './payments-delivery'
import { address, publishableKey } from './shoppers'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Step P10's Admin API refusals within one store: items 2, 3 and 5 of the
 * platform work item's "P10's checks, recorded before implementation". G-56,
 * G-60 and G-83 (with behaviours 11, 12 and 22 of G-84) for the catalog's
 * narrower roles, G-70 for batch 7's payment, tax, delivery and package type
 * screens, and batch 6's inventory requests under G-11. Each request is sent
 * as the teammates whose roles do not allow it, and as one who may, and is
 * judged by P7's `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says.
 * The script adds `staff.ts`'s teammates, then the records this run aims at,
 * named with the run's stamp. Results go to `results/p10/admin.json`, with no
 * response bodies, tokens or gift card codes.
 *
 * Every expected answer below is the one the work item recorded before this
 * script was written, by its rules A1 to A4, with the row number at the start
 * of each case's title.
 */

const API = process.env.P10_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p10/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()

test.use({ baseURL: API })

const ids = (sent: { body: unknown }) => rows(sent.body).map((item) => item.id)
const status = (sent: { status: number }) => sent.status

/** A read-back through the admin, the teammate who may read everything. */
const reader =
  (admin: Caller) =>
  (path: string, pick?: (sent: { status: number; body: unknown }) => unknown): Case['state'] => ({
    caller: admin,
    request: { method: 'GET', path: `/api/v3/admin/${path}` },
    pick,
  })

/** A read sent by refused callers and one who may, carrying the run's record. */
const readCase = (
  gap: Gap,
  area: string,
  title: string,
  path: string,
  refused: [Caller, ReturnType<typeof denied>][],
  control: Caller,
  values: string[],
): Case => ({
  gap,
  area,
  title,
  request: { method: 'GET', path: `/api/v3/admin/${path}` },
  attempts: refused.map(([caller, expected]) => ({ caller, expected })),
  control: { caller: control, status: 200 },
  protectedValues: values,
})

/**
 * Requests outside P10's cases, sent to record how the server answered them
 * where a case's development trial pointed to a defect: the status, code and
 * permission only, as for a case.
 */
async function observe(api: APIRequestContext, requests: [string, Caller, Probe][]) {
  const answers = []
  for (const [title, caller, probe] of requests) {
    const sent = await send(api, caller, probe)
    answers.push({
      title,
      caller: caller.name,
      request: `${probe.method} ${maskIds(probe.path)}`,
      status: sent.status,
      code: sent.code,
      requiredPermission: sent.requiredPermission,
    })
  }
  return answers
}

/** Item 2: the catalog's requests for its narrower roles. */
async function catalogCases(people: Record<string, Caller>, call: Admin) {
  const {
    admin,
    catalogViewer,
    orderManager,
    merchandiser,
    marketer,
    loyaltyViewer,
    settingsViewer,
    support,
  } = people
  const read = reader(admin)
  const term = `p10cat${run}`

  const productName = `P10 product ${term}`
  const product = await call('POST', 'products', {
    name: productName,
    status: 'active',
    prices: [{ amount: '12.00', currency: 'USD' }],
  })
  const secondName = `P10 second product ${term}`
  const second = await call('POST', 'products', { name: secondName })
  const optionLabel = `P10 size ${run}`
  const optionType = await call('POST', 'option_types', {
    name: `p10-size-${run}`,
    label: optionLabel,
    option_values: [{ name: 'small', label: 'Small' }],
  })
  const productTypeName = `P10 product type ${run}`
  const productType = await call('POST', 'product_types', { name: productTypeName })
  const categoryName = `P10 category ${term}`
  const category = await call('POST', 'categories', { name: categoryName })
  const collectionName = `P10 collection ${run}`
  const collection = await call('POST', 'collections', { name: collectionName })
  const priceListName = `P10 price list ${run}`
  const priceList = await call('POST', 'price_lists', { name: priceListName })

  const customerLast = `Customer${run}`
  const customerEmail = `p10-customer-${run}@example.com`
  const customer = await call('POST', 'customers', {
    email: customerEmail,
    first_name: 'P10',
    last_name: customerLast,
  })
  const groupName = `P10 group ${run}`
  await call('POST', 'customer_groups', { name: groupName })
  const channelName = `P10 channel ${run}`
  await call('POST', 'channels', { name: channelName, code: `p10-channel-${run}`, active: false })
  // A country no market holds yet, since a country belongs to one market.
  const held = new Set(
    rows(await call('GET', 'markets?limit=100')).flatMap((item) => item.country_codes as string[]),
  )
  const country = rows(await call('GET', 'countries?limit=300'))
    .map((item) => String(item.iso))
    .find((iso) => !held.has(iso))
  const marketName = `P10 market ${run}`
  await call('POST', 'markets', {
    name: marketName,
    currency: 'USD',
    default_locale: 'en',
    country_codes: [country],
  })

  const giftCard = await call('POST', 'gift_cards', { amount: '20.00', currency: 'USD' })
  const doomedCard = await call('POST', 'gift_cards', { amount: '15.00', currency: 'USD' })
  const promotionName = `P10 promotion ${run}`
  const promotion = await call('POST', 'promotions', {
    name: promotionName,
    kind: 'automatic',
    match_policy: 'all',
    rules: [{ type: 'currency', preferences: { currency: 'USD' } }],
    actions: [{ type: 'free_shipping' }],
  })
  const doomedPromotionName = `P10 promotion to delete ${run}`
  const doomedPromotion = await call('POST', 'promotions', {
    name: doomedPromotionName,
    kind: 'automatic',
    match_policy: 'all',
  })
  const ruleId = String(
    rows(await call('GET', `promotions/${promotion.id}/promotion_rules?limit=100`))[0]?.id,
  )
  const actionId = String(
    rows(await call('GET', `promotions/${promotion.id}/promotion_actions?limit=100`))[0]?.id,
  )
  const creditMemo = `P10 credit ${run}`
  const credit = await call('POST', `customers/${customer.id}/store_credits`, {
    amount: '30.00',
    currency: 'USD',
    memo: creditMemo,
  })

  const credits = read(`customers/${customer.id}/store_credits?limit=100`, (sent) =>
    rows(sent.body)
      .map((item) => [item.id, item.memo, item.amount])
      .sort(),
  )
  const created = {
    product: `P10 created product ${run}`,
    category: `P10 created category ${run}`,
    collection: `P10 created collection ${run}`,
    priceList: `P10 created price list ${run}`,
    promotion: `P10 created promotion ${run}`,
  }
  const reportingQuery = { metrics: ['total_sales'], time_range: { preset: 'last_30_days' } }

  // The reads go first, so the writes after them cannot change what they look for.
  const cases: Case[] = [
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: search products by name',
      `products?q[name_cont]=${term}&limit=10&sort=name`,
      [[marketer, denied('read_products')]],
      merchandiser,
      [productName],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.16 Rule picker: a saved rule's products by id",
      `products?q[id_in][]=${product.id}&q[id_in][]=${second.id}&limit=2`,
      [[marketer, denied('read_products')]],
      merchandiser,
      [productName, secondName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: search categories by name',
      `categories?q[name_cont]=${term}&limit=20&sort=pretty_name`,
      [[marketer, denied('read_categories')]],
      catalogViewer,
      [categoryName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: search customers',
      `customers?q[search]=${customerLast}&limit=10`,
      [[marketer, denied('read_customers')]],
      support,
      [customerEmail, customerLast],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.16 Rule picker: a saved rule's customers by id",
      `customers?q[id_in][]=${customer.id}&limit=1`,
      [[marketer, denied('read_customers')]],
      support,
      [customerEmail, customerLast],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: the customer groups',
      'customer_groups?limit=100&sort=name',
      [[marketer, denied('read_customers')]],
      support,
      [groupName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: search the customer groups',
      `customer_groups?q[name_cont]=${run}&limit=100&sort=name`,
      [[marketer, denied('read_customers')]],
      support,
      [groupName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: the channels',
      'channels?page=1&limit=100',
      [[marketer, denied('read_settings')]],
      settingsViewer,
      [channelName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: the markets',
      'markets?limit=100&sort=position',
      [[marketer, denied('read_settings')]],
      settingsViewer,
      [marketName],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.16 Rule picker: the option types with their values',
      'option_types?page=1&limit=100&expand=option_values',
      [[marketer, denied('read_products')]],
      catalogViewer,
      [optionLabel],
    ),
    readCase(
      'G-83',
      'loyalty',
      '2.17 The gift cards list',
      'gift_cards?page=1&sort=-created_at&expand=customer,created_by,gift_card_batch',
      [
        [marketer, denied('read_gift_cards')],
        [merchandiser, denied('read_gift_cards')],
      ],
      loyaltyViewer,
      [String(giftCard.code)],
    ),
    readCase(
      'G-83',
      'loyalty',
      '2.17 The store credits list',
      'store_credits?page=1&sort=-created_at&expand=customer,created_by',
      [
        [marketer, denied('read_store_credits')],
        [merchandiser, denied('read_store_credits')],
      ],
      loyaltyViewer,
      [creditMemo],
    ),
    readCase(
      'G-83',
      'promotions',
      '2.18 The promotions list',
      'promotions?page=1&sort=-created_at',
      [
        [orderManager, denied('read_promotions')],
        [merchandiser, denied('read_promotions')],
      ],
      loyaltyViewer,
      [promotionName],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.18 The new promotion page's rule types",
      'promotion_rules/types',
      [
        [orderManager, denied('read_promotions')],
        [merchandiser, denied('read_promotions')],
      ],
      marketer,
      ['currency'],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.18 The new promotion page's action types",
      'promotion_actions/types',
      [
        [orderManager, denied('read_promotions')],
        [merchandiser, denied('read_promotions')],
      ],
      marketer,
      ['free_shipping'],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.19 A promotion's page",
      `promotions/${promotion.id}`,
      [
        [orderManager, notFound()],
        [merchandiser, notFound()],
      ],
      loyaltyViewer,
      [promotionName],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.20 A promotion's rules",
      `promotions/${promotion.id}/promotion_rules?limit=100`,
      [
        [orderManager, notFound()],
        [merchandiser, notFound()],
        [loyaltyViewer, notFound()],
      ],
      marketer,
      [ruleId],
    ),
    readCase(
      'G-83',
      'promotions',
      "2.20 A promotion's actions",
      `promotions/${promotion.id}/promotion_actions?limit=100`,
      [
        [orderManager, notFound()],
        [merchandiser, notFound()],
        [loyaltyViewer, notFound()],
      ],
      marketer,
      [actionId],
    ),
    readCase(
      'G-83',
      'loyalty',
      '2.21 The channels list, as the loyalty screens send it',
      'channels?page=1&limit=100',
      [
        [orderManager, denied('read_settings')],
        [loyaltyViewer, denied('read_settings')],
      ],
      settingsViewer,
      [channelName],
    ),
    {
      gap: 'G-83',
      area: 'promotions',
      title: '2.22 The sales query the promotion pages send',
      request: { method: 'POST', path: '/api/v3/admin/reporting/query', data: reportingQuery },
      attempts: [
        { caller: marketer, expected: denied('read_reports') },
        { caller: merchandiser, expected: denied('read_reports') },
      ],
      control: { caller: admin, status: 200 },
    },
    readCase(
      'G-83',
      'navigation',
      "2.23 The navigation's counters",
      'dashboard/counters',
      [
        [marketer, denied('read_dashboard')],
        [loyaltyViewer, denied('read_dashboard')],
        [orderManager, denied('read_dashboard')],
        [merchandiser, denied('read_dashboard')],
      ],
      support,
      [],
    ),
    {
      gap: 'G-56',
      area: 'catalog',
      title: '2.1 Save a product',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/products/${product.id}`,
        data: { name: `${productName} edited` },
      },
      attempts: [{ caller: catalogViewer, expected: notFound() }],
      control: { caller: merchandiser, status: 200 },
      protectedValues: [productName],
      state: read(`products/${product.id}`, fields('name')),
    },
    {
      gap: 'G-56',
      area: 'catalog',
      title: '2.2 Create a product',
      request: { method: 'POST', path: '/api/v3/admin/products', data: { name: created.product } },
      attempts: [
        { caller: catalogViewer, expected: denied('write_products') },
        { caller: orderManager, expected: denied('write_products') },
      ],
      control: { caller: merchandiser, status: 201 },
      state: read(`products?q[name_eq]=${encodeURIComponent(created.product)}`, ids),
    },
    {
      gap: 'G-56',
      area: 'catalog',
      title: '2.3 Save an option type',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/option_types/${optionType.id}`,
        data: { label: `${optionLabel} edited` },
      },
      attempts: [{ caller: catalogViewer, expected: notFound() }],
      control: { caller: merchandiser, status: 200 },
      protectedValues: [optionLabel],
      state: read(`option_types/${optionType.id}`, fields('label')),
    },
    {
      gap: 'G-56',
      area: 'catalog',
      title: '2.4 Save a product type',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/product_types/${productType.id}`,
        data: { name: `${productTypeName} edited` },
      },
      attempts: [{ caller: catalogViewer, expected: notFound() }],
      control: { caller: admin, status: 200 },
      protectedValues: [productTypeName],
      state: read(`product_types/${productType.id}`, fields('name')),
    },
    ...(
      [
        ['2.5 Save a category', 'categories', category.id, categoryName],
        ['2.6 Save a collection', 'collections', collection.id, collectionName],
        ['2.7 Save a price list', 'price_lists', priceList.id, priceListName],
      ] as const
    ).map(
      ([title, path, id, name]): Case => ({
        gap: 'G-60',
        area: 'catalog',
        title,
        request: {
          method: 'PATCH',
          path: `/api/v3/admin/${path}/${id}`,
          data: { name: `${name} edited` },
        },
        attempts: [{ caller: catalogViewer, expected: notFound() }],
        control: { caller: merchandiser, status: 200 },
        protectedValues: [name],
        state: read(`${path}/${id}`, fields('name')),
      }),
    ),
    ...(
      [
        ['2.8 Create a category', 'categories', created.category, 'write_categories'],
        ['2.9 Create a collection', 'collections', created.collection, 'write_collections'],
        ['2.10 Create a price list', 'price_lists', created.priceList, 'write_products'],
      ] as const
    ).map(
      ([title, path, name, permission]): Case => ({
        gap: 'G-60',
        area: 'catalog',
        title,
        request: { method: 'POST', path: `/api/v3/admin/${path}`, data: { name } },
        attempts: [{ caller: orderManager, expected: denied(permission) }],
        control: { caller: merchandiser, status: 201 },
        state: read(`${path}?q[name_eq]=${encodeURIComponent(name)}`, ids),
      }),
    ),
    {
      gap: 'G-83',
      area: 'loyalty',
      title: '2.11 Save a gift card from its sheet',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/gift_cards/${giftCard.id}`,
        data: { expires_at: '2027-12-31' },
      },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: orderManager, status: 200 },
      protectedValues: [String(giftCard.code)],
      state: read(`gift_cards/${giftCard.id}`, fields('expires_at', 'amount')),
    },
    {
      gap: 'G-83',
      area: 'loyalty',
      title: '2.12 Delete a gift card from its row menu',
      request: { method: 'DELETE', path: `/api/v3/admin/gift_cards/${doomedCard.id}` },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: orderManager, status: 204 },
      protectedValues: [String(doomedCard.code)],
      state: read(`gift_cards/${doomedCard.id}`, status),
    },
    {
      gap: 'G-83',
      area: 'promotions',
      title: '2.13 Delete a promotion from its row menu',
      request: { method: 'DELETE', path: `/api/v3/admin/promotions/${doomedPromotion.id}` },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: marketer, status: 204 },
      protectedValues: [doomedPromotionName],
      state: read(`promotions/${doomedPromotion.id}`, status),
    },
    {
      gap: 'G-83',
      area: 'promotions',
      title: '2.14 Create a promotion from the new promotion page',
      request: {
        method: 'POST',
        path: '/api/v3/admin/promotions',
        data: { name: created.promotion, kind: 'automatic', match_policy: 'all' },
      },
      attempts: [
        { caller: loyaltyViewer, expected: denied('write_promotions') },
        { caller: orderManager, expected: denied('write_promotions') },
        { caller: merchandiser, expected: denied('write_promotions') },
      ],
      control: { caller: marketer, status: 201 },
      state: read(`promotions?q[name_eq]=${encodeURIComponent(created.promotion)}`, ids),
    },
    {
      gap: 'G-83',
      area: 'loyalty',
      title: '2.15 Issue a store credit',
      request: {
        method: 'POST',
        path: `/api/v3/admin/customers/${customer.id}/store_credits`,
        data: { amount: '10.00', currency: 'USD', memo: `P10 issued credit ${run}` },
      },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: admin, status: 201 },
      protectedValues: [creditMemo, customerEmail],
      state: credits,
    },
    {
      gap: 'G-83',
      area: 'loyalty',
      title: '2.15 Edit a store credit',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/customers/${customer.id}/store_credits/${credit.id}`,
        data: { memo: `${creditMemo} edited` },
      },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: admin, status: 200 },
      protectedValues: [creditMemo, customerEmail],
      state: credits,
    },
    {
      gap: 'G-83',
      area: 'loyalty',
      title: '2.15 Delete a store credit',
      request: {
        method: 'DELETE',
        path: `/api/v3/admin/customers/${customer.id}/store_credits/${credit.id}`,
      },
      attempts: [{ caller: loyaltyViewer, expected: notFound() }],
      control: { caller: admin, status: 204 },
      protectedValues: [creditMemo, customerEmail],
      state: credits,
    },
  ]
  return cases
}

/** Item 3: batch 7's payment, tax, delivery and package type requests. */
async function deliveryCases(
  people: Record<string, Caller>,
  call: Admin,
  originLocationId: string,
) {
  const { admin, deliveryViewer, deliveryEditor, storeSettings } = people
  const read = reader(admin)

  const cheque = rows(await call('GET', 'payment_methods?limit=100')).find(
    (method) => method.name === paymentNames.cheque,
  )
  expect(cheque, 'the cheque payment method').toBeTruthy()
  const chequeId = String(cheque?.id)
  const taxCategoryName = `P10 tax category ${run}`
  const taxCategory = await call('POST', 'tax_categories', { name: taxCategoryName })
  const taxRateName = `P10 tax rate ${run}`
  const taxRate = await call('POST', 'tax_rates', {
    name: taxRateName,
    rate_percent: '5',
    tax_category_id: taxCategory.id,
    country_code: 'US',
    state_code: 'TX',
  })
  const profileName = `P10 profile ${run}`
  const profile = await call('POST', 'delivery_profiles', { name: profileName, kind: 'shipping' })
  const groupId = String(
    ((await call('GET', `delivery_profiles/${profile.id}`)).origin_groups as Json[])[0].id,
  )
  // What the profile page sends for a profile shipping from one group: the
  // profile, and no origin group, which it names only once a profile is split.
  const inProfile = { delivery_profile_id: profile.id }
  const zoneName = `P10 zone ${run}`
  const zone = await call('POST', 'delivery_zones', {
    name: zoneName,
    ...inProfile,
    members: [{ member_type: 'country', country_code: 'US' }],
  })
  const calculator = { type: 'flat_rate', preferences: { amounts: { USD: '5.00' } } }
  const methodName = `P10 method ${run}`
  const method = await call('POST', 'delivery_methods', {
    name: methodName,
    ...inProfile,
    delivery_zone_id: zone.id,
    calculator,
  })
  const box = {
    kind: 'box',
    length: 20,
    width: 15,
    height: 10,
    dimensions_unit: 'cm',
    weight: 0.2,
    max_weight: 5,
    weight_unit: 'kg',
  }
  const packageName = `P10 box ${run}`
  const packageType = await call('POST', 'package_types', { name: packageName, ...box })

  const created = {
    zone: `P10 created zone ${run}`,
    group: `P10 origin group ${run}`,
    method: `P10 created method ${run}`,
    packageType: `P10 created box ${run}`,
  }
  const save = (
    title: string,
    path: string,
    id: string,
    data: Json,
    refused: Caller[],
    control: Caller,
    values: string[],
    picked: string[],
  ): Case => ({
    gap: 'G-70',
    area: 'delivery and payments',
    title,
    request: { method: 'PATCH', path: `/api/v3/admin/${path}/${id}`, data },
    attempts: refused.map((caller) => ({ caller, expected: notFound() })),
    control: { caller: control, status: 200 },
    protectedValues: values,
    state: read(`${path}/${id}`, fields(...picked)),
  })
  const add = (
    title: string,
    path: string,
    name: string,
    data: Json,
    refused: [Caller, string],
    control: Caller,
  ): Case => ({
    gap: 'G-70',
    area: 'delivery and payments',
    title,
    request: { method: 'POST', path: `/api/v3/admin/${path}`, data: { name, ...data } },
    attempts: [{ caller: refused[0], expected: denied(refused[1]) }],
    control: { caller: control, status: 201 },
    state: read(`${path}?q[name_eq]=${encodeURIComponent(name)}`, ids),
  })

  const cases: Case[] = [
    save(
      '3.1 Save a payment method from its sheet',
      'payment_methods',
      chequeId,
      { description: `P10 cheque note ${run}` },
      [deliveryViewer],
      storeSettings,
      [paymentNames.cheque],
      ['name', 'description'],
    ),
    save(
      '3.2 Save a tax category',
      'tax_categories',
      String(taxCategory.id),
      { name: `${taxCategoryName} edited` },
      [deliveryViewer],
      storeSettings,
      [taxCategoryName],
      ['name'],
    ),
    save(
      '3.3 Save a tax rate',
      'tax_rates',
      String(taxRate.id),
      { name: `${taxRateName} edited` },
      [deliveryViewer],
      storeSettings,
      [taxRateName],
      ['name'],
    ),
    save(
      '3.4 Save a delivery zone from its sheet',
      'delivery_zones',
      String(zone.id),
      { name: `${zoneName} edited` },
      [deliveryViewer, deliveryEditor],
      storeSettings,
      [zoneName],
      ['name'],
    ),
    add(
      '3.5 Add a delivery zone',
      'delivery_zones',
      created.zone,
      { ...inProfile, members: [{ member_type: 'country', country_code: 'CA' }] },
      [deliveryEditor, 'write_settings'],
      storeSettings,
    ),
    {
      gap: 'G-70',
      area: 'delivery and payments',
      title: '3.6 Add an origin group to a profile',
      request: {
        method: 'POST',
        path: `/api/v3/admin/delivery_profiles/${profile.id}/origin_groups`,
        data: { name: created.group, stock_location_ids: [originLocationId] },
      },
      attempts: [{ caller: deliveryEditor, expected: denied('write_settings') }],
      control: { caller: storeSettings, status: 201 },
      protectedValues: [profileName],
      state: read(`delivery_profiles/${profile.id}`, (sent) =>
        ((sent.body as Json).origin_groups as Json[]).map((group) => group.name).sort(),
      ),
    },
    save(
      '3.7 Save a delivery method',
      'delivery_methods',
      String(method.id),
      { name: `${methodName} edited` },
      [deliveryViewer],
      deliveryEditor,
      [methodName],
      ['name'],
    ),
    add(
      '3.8 Add a delivery method',
      'delivery_methods',
      created.method,
      { ...inProfile, delivery_zone_id: zone.id, calculator },
      [deliveryViewer, 'write_delivery_methods'],
      deliveryEditor,
    ),
    save(
      '3.9 Save a package type from its sheet',
      'package_types',
      String(packageType.id),
      { name: `${packageName} edited` },
      [deliveryViewer],
      deliveryEditor,
      [packageName],
      ['name'],
    ),
    add(
      '3.10 Add a package type',
      'package_types',
      created.packageType,
      box,
      [deliveryViewer, 'write_package_types'],
      deliveryEditor,
    ),
  ]
  // Not P10's cases: what a split profile's page sends, naming the origin
  // group, from the teammates it offers Add delivery zone and Add method to.
  const observations = (api: APIRequestContext) =>
    observe(api, [
      [
        'Add a delivery zone within an origin group',
        storeSettings,
        {
          method: 'POST',
          path: '/api/v3/admin/delivery_zones',
          data: {
            name: `P10 observed zone ${run}`,
            delivery_profile_id: profile.id,
            delivery_origin_group_id: groupId,
            members: [{ member_type: 'country', country_code: 'MX' }],
          },
        },
      ],
      [
        'Add a delivery method within an origin group',
        deliveryEditor,
        {
          method: 'POST',
          path: '/api/v3/admin/delivery_methods',
          data: {
            name: `P10 observed method ${run}`,
            delivery_profile_id: profile.id,
            delivery_origin_group_id: groupId,
            delivery_zone_id: zone.id,
            calculator,
          },
        },
      ],
    ])
  return { cases, observations }
}

interface Inventory {
  locationId: string
  locationName: string
  variantId: string
  /** What the run's own stock showed once the guest's checkout held it, for the record. */
  hold: { reservedAtLocation: number; listedReservations: number }
}

/**
 * The run's own location, product and stock, with stock held by a guest's
 * checkout so the reservations list has a record of this run's. The location
 * is also the origin group's in item 3.
 */
async function seedInventory(api: APIRequestContext, people: Record<string, Caller>, call: Admin) {
  const locationName = `P10 location ${run}`
  const location = await call('POST', 'stock_locations', {
    name: locationName,
    kind: 'warehouse',
    propagate_all_variants: false,
    address1: '1 P10 Way',
    city: 'Albany',
    zipcode: '12207',
    country_code: 'US',
    state_code: 'NY',
  })
  const channels = rows(await call('GET', 'channels?limit=100'))
  const online = channels.find((channel) => channel.default)
  expect(online, "the store's default channel").toBeTruthy()
  const product = await call('POST', 'products', {
    name: `P10 stock product ${run}`,
    slug: `p10-stock-product-${run}`,
    status: 'active',
    prices: [{ amount: '9.00', currency: 'USD' }],
    product_publications: [{ channel_id: online?.id }],
  })
  const variantId = String(product.default_variant_id)
  const locations = rows(await call('GET', 'stock_locations?limit=100'))
  const shop = locations.find((item) => item.name === locationNames.shop)
  expect(shop, 'the shop location').toBeTruthy()
  await call('POST', 'stock_levels/bulk_upsert', {
    stock_levels: [
      { variant_id: variantId, stock_location_id: location.id, count_on_hand: 50 },
      { variant_id: variantId, stock_location_id: shop?.id, count_on_hand: 5 },
    ],
  })

  // A guest's checkout holds stock once the cart has an email and an address.
  const key = await publishableKey(api, people.admin)
  const store = (token?: string) => ({
    'X-Spree-API-Key': key,
    ...(token ? { 'X-Spree-Token': token } : {}),
  })
  const cartRes = await api.post('/api/v3/store/carts', { headers: store() })
  expect(cartRes.status(), 'creating the guest cart').toBe(201)
  const cart = (await cartRes.json()) as { id: string; token: string }
  const added = await api.post(`/api/v3/store/carts/${cart.id}/items`, {
    headers: store(cart.token),
    data: { variant_id: variantId, quantity: 1 },
  })
  expect(added.ok(), `adding the item: ${added.status()}`).toBeTruthy()
  const shipTo = address(`${run} Reserve Street`, `Guest${run}`)
  const addressed = await api.patch(`/api/v3/store/carts/${cart.id}`, {
    headers: store(cart.token),
    data: {
      email: `p10-guest-${run}@example.com`,
      shipping_address: shipTo,
      billing_address: shipTo,
    },
  })
  expect(addressed.ok(), `addressing the cart: ${addressed.status()}`).toBeTruthy()

  const levels = rows(
    await call('GET', `stock_levels?q[stock_location_id_eq]=${location.id}&limit=10`),
  )
  const listed = rows(await call('GET', 'stock_reservations?limit=100'))
  const hold = {
    reservedAtLocation: Number(levels[0]?.reserved_count ?? 0),
    listedReservations: listed.filter((item) => item.variant_id === variantId).length,
  }
  return { locationId: String(location.id), locationName, variantId, hold } satisfies Inventory
}

/** Item 5: batch 6's requests for its narrower roles. */
async function inventoryCases(people: Record<string, Caller>, call: Admin, inventory: Inventory) {
  const { admin, stockViewer, purchaser, merchandiser, orderManager, storeSettings } = people
  const read = reader(admin)
  const { locationId, locationName, variantId } = inventory

  const destination = rows(await call('GET', 'stock_locations?limit=100')).find(
    (item) => item.name === locationNames.destination,
  )
  expect(destination, 'the transfer destination location').toBeTruthy()
  const supplierName = `P10 supplier ${run}`
  const supplier = await call('POST', 'suppliers', { name: supplierName })
  const transfer = await call('POST', 'stock_transfers?expand=items', {
    source_location_id: locationId,
    destination_location_id: destination?.id,
    reference: `P10 transfer ${run}`,
    items: [{ variant_id: variantId, quantity_shipped: 5 }],
  })
  await call('PATCH', `stock_transfers/${transfer.id}/mark_in_transit`)
  const order = await call('POST', 'purchase_orders?expand=items', {
    supplier_id: supplier.id,
    destination_location_id: locationId,
    currency: 'USD',
    reference: `P10 order ${run}`,
    items: [{ variant_id: variantId, quantity_ordered: 10, unit_cost: '4.00' }],
  })
  await call('PATCH', `purchase_orders/${order.id}/mark_ordered`)
  const transferNumber = String(transfer.number)
  const orderNumber = String(order.number)
  const received = (path: string) =>
    read(path, (sent) => [
      (sent.body as Json).status,
      ((sent.body as Json).items as Json[]).map((item) => item.quantity_received),
    ])
  const createdTransfer = `P10 created transfer ${run}`
  const createdOrder = `P10 created order ${run}`
  const noStock: [Caller, ReturnType<typeof denied>][] = [[orderManager, denied('read_stock')]]
  const noPurchasing: [Caller, ReturnType<typeof denied>][] = [
    [merchandiser, denied('read_purchasing')],
    [orderManager, denied('read_purchasing')],
  ]

  const cases: Case[] = [
    readCase(
      'G-11',
      'inventory',
      '5.8 List purchase orders',
      'purchase_orders?page=1&sort=-created_at',
      noPurchasing,
      stockViewer,
      [orderNumber],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.8 List suppliers',
      'suppliers?page=1&limit=100',
      noPurchasing,
      stockViewer,
      [supplierName],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.10 List stock levels',
      `stock_levels?q[stock_location_id_eq]=${locationId}`,
      noStock,
      stockViewer,
      [locationName],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.10 List stock locations',
      'stock_locations?limit=100',
      noStock,
      stockViewer,
      [locationName],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.10 List stock movements',
      'stock_movements?page=1&sort=-created_at',
      noStock,
      stockViewer,
      [locationName],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.10 List stock reservations',
      'stock_reservations?limit=100',
      noStock,
      stockViewer,
      [variantId],
    ),
    readCase(
      'G-11',
      'inventory',
      '5.10 List stock transfers',
      'stock_transfers?page=1&sort=-created_at',
      noStock,
      stockViewer,
      [transferNumber],
    ),
    readCase(
      'G-11',
      'inventory',
      "5.11 A transfer's page",
      `stock_transfers/${transfer.id}`,
      // Corrected from 404 after the development trial (see the record).
      [[orderManager, denied('read_stock')]],
      stockViewer,
      [transferNumber],
    ),
    readCase(
      'G-11',
      'inventory',
      "5.11 A purchase order's page",
      `purchase_orders/${order.id}`,
      // Corrected from 404 after the development trial (see the record).
      [[orderManager, denied('read_purchasing')]],
      stockViewer,
      [orderNumber],
    ),
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.1 Save a stock location from its sheet',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/stock_locations/${locationId}`,
        data: { name: `${locationName} edited` },
      },
      attempts: [
        { caller: stockViewer, expected: notFound() },
        { caller: purchaser, expected: notFound() },
        { caller: merchandiser, expected: denied('write_settings') },
      ],
      control: { caller: storeSettings, status: 200 },
      protectedValues: [locationName],
      state: read(`stock_locations/${locationId}`, fields('name')),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: "5.2 Save a location's stock levels",
      request: {
        method: 'POST',
        path: '/api/v3/admin/stock_levels/bulk_upsert',
        data: {
          stock_levels: [
            { variant_id: variantId, stock_location_id: locationId, count_on_hand: 60 },
          ],
        },
      },
      attempts: [
        { caller: stockViewer, expected: denied('write_stock') },
        { caller: purchaser, expected: denied('write_stock') },
      ],
      control: { caller: merchandiser, status: 200 },
      state: read(`stock_levels?q[stock_location_id_eq]=${locationId}`, (sent) =>
        rows(sent.body).map((item) => item.count_on_hand),
      ),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.3 Save a supplier from its sheet',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/suppliers/${supplier.id}`,
        data: { name: `${supplierName} edited` },
      },
      attempts: [{ caller: stockViewer, expected: notFound() }],
      control: { caller: purchaser, status: 200 },
      protectedValues: [supplierName],
      state: read(`suppliers/${supplier.id}`, fields('name')),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.4 Receive a delivery on a transfer in transit',
      request: {
        method: 'POST',
        path: `/api/v3/admin/stock_transfers/${transfer.id}/stock_receipts`,
        data: {
          items: [
            {
              id: (transfer.items as Json[])[0].id,
              quantity_accepted: 2,
              quantity_rejected: 0,
            },
          ],
        },
      },
      attempts: [
        { caller: stockViewer, expected: denied('write_stock') },
        { caller: purchaser, expected: denied('write_stock') },
      ],
      control: { caller: merchandiser, status: 201 },
      state: received(`stock_transfers/${transfer.id}?expand=items`),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.5 Receive a delivery on an ordered purchase order',
      request: {
        method: 'POST',
        path: `/api/v3/admin/purchase_orders/${order.id}/stock_receipts`,
        data: {
          items: [
            { id: (order.items as Json[])[0].id, quantity_accepted: 3, quantity_rejected: 0 },
          ],
        },
      },
      attempts: [{ caller: stockViewer, expected: denied('write_purchasing') }],
      control: { caller: purchaser, status: 201 },
      state: received(`purchase_orders/${order.id}?expand=items`),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.6 Create a transfer from the new transfer page',
      request: {
        method: 'POST',
        path: '/api/v3/admin/stock_transfers',
        data: {
          source_location_id: locationId,
          destination_location_id: destination?.id,
          reference: createdTransfer,
          items: [{ variant_id: variantId, quantity_shipped: 1 }],
        },
      },
      attempts: [
        { caller: stockViewer, expected: denied('write_stock') },
        { caller: purchaser, expected: denied('write_stock') },
      ],
      control: { caller: merchandiser, status: 201 },
      state: read(`stock_transfers?q[reference_eq]=${encodeURIComponent(createdTransfer)}`, ids),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.7 Create a purchase order from the new purchase order page',
      request: {
        method: 'POST',
        path: '/api/v3/admin/purchase_orders',
        data: {
          supplier_id: supplier.id,
          destination_location_id: locationId,
          currency: 'USD',
          reference: createdOrder,
          items: [{ variant_id: variantId, quantity_ordered: 2, unit_cost: '4.00' }],
        },
      },
      attempts: [
        { caller: stockViewer, expected: denied('write_purchasing') },
        { caller: merchandiser, expected: denied('write_purchasing') },
      ],
      control: { caller: purchaser, status: 201 },
      state: read(`purchase_orders?q[reference_eq]=${encodeURIComponent(createdOrder)}`, ids),
    },
    {
      gap: 'G-11',
      area: 'inventory',
      title: '5.9 Export purchase orders',
      request: {
        method: 'POST',
        path: '/api/v3/admin/exports',
        data: { type: 'purchase_orders', record_selection: 'all' },
      },
      attempts: noPurchasing.map(([caller, expected]) => ({ caller, expected })),
      control: { caller: stockViewer, status: 201 },
    },
  ]
  // Not P10's cases: other exports, each by a teammate who may read its records.
  const observations = (api: APIRequestContext) =>
    observe(api, [
      [
        'Export products',
        people.catalogViewer,
        {
          method: 'POST',
          path: '/api/v3/admin/exports',
          data: { type: 'products', record_selection: 'all' },
        },
      ],
      [
        'Export orders',
        people.support,
        {
          method: 'POST',
          path: '/api/v3/admin/exports',
          data: { type: 'orders', record_selection: 'all' },
        },
      ],
    ])
  return { cases, observations }
}

test('the Admin API refuses the catalog, delivery and inventory requests a role does not allow, within one store', async ({
  request,
  baseURL,
}) => {
  const base = baseURL ?? API
  const creds = getCredentials()
  await seed(base)
  await ensurePaymentMethods(base)

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
    'catalogViewer',
    'orderManager',
    'merchandiser',
    'marketer',
    'loyaltyViewer',
    'deliveryViewer',
    'deliveryEditor',
    'stockViewer',
    'purchaser',
    'storeSettings',
    'settingsViewer',
    'support',
  ]) {
    people[key] = await adminCaller(request, key, teammates[key].email, PASSWORD, creds.store_id)
  }
  const call = adminCall(request, people.admin)

  const inventory = await seedInventory(request, people, call)
  const all: CaseResult[] = []
  all.push(...(await runCases(request, await catalogCases(people, call))))
  const delivery = await deliveryCases(people, call, inventory.locationId)
  all.push(...(await runCases(request, delivery.cases)))
  const stock = await inventoryCases(people, call, inventory)
  all.push(...(await runCases(request, stock.cases)))
  const observations = [
    ...(await delivery.observations(request)),
    ...(await stock.observations(request)),
  ]

  const gaps = Object.fromEntries(
    (['G-56', 'G-60', 'G-83', 'G-70', 'G-11'] as const).map((gap) => [
      gap,
      gapResult(all.filter((item) => item.gap === gap)),
    ]),
  )
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}admin.json`,
    JSON.stringify(
      { revision, run, store: 'default', hold: inventory.hold, gaps, cases: all, observations },
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
