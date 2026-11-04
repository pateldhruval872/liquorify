import { type APIRequestContext, expect, request } from '@playwright/test'
import {
  FIXTURE_PROMO_CUSTOMER_GROUP,
  FIXTURE_PROMO_SKU,
  FIXTURE_PROMO_TAXON,
} from '../../dashboard/e2e/helpers'
import { admin } from './staff'

/**
 * What catalog part 3's captures need beyond Spree's sample data, added
 * through the Admin API on the browser-test database only: promotions that
 * between them use every rule and calculator Spree registers, automatic and
 * with one or many codes, not yet started, running and expired; gift cards
 * with and without a customer, in a batch, in two currencies and past their
 * expiry date; store credits in two currencies; and orders that staff create
 * and complete through the Admin API, paid by gift card and store credit, so
 * a gift card is partly and fully redeemed, a credit is partly used and spent,
 * and a coupon code is used. Seeding again reuses what an earlier run added.
 * Nothing in Spree's code, tests or fixtures changes.
 */

export const promotions = {
  /** Spree's sample promotion: coupon code FREESHIP, free shipping. */
  sample: 'Free Shipping',
  running: 'Fidelity autumn welcome',
  singleCode: 'Fidelity loyal shoppers',
  manyCodes: 'Fidelity winter gifts',
  notStarted: 'Fidelity spring preview',
  expired: 'Fidelity summer clearance',
  tiered: 'Fidelity bulk thanks',
} as const

export const singleCode = 'LOYAL15'
export const tieredCode = 'BULKTHANKS'
export const codePrefix = 'WINTER'
export const numberOfCodes = 60

export const giftCards = {
  withCustomer: 'fidelity-welcome',
  withoutCustomer: 'fidelity-desk',
  partlyRedeemed: 'fidelity-part',
  redeemed: 'fidelity-full',
  expired: 'fidelity-lapsed',
  euro: 'fidelity-euro',
} as const

export const batchPrefix = 'FIDXMAS'

export const customers = {
  partlyRedeemed: 'sarah.johnson@example.com',
  redeemed: 'michael.chen@example.com',
  partlyUsedCredit: 'emily.rodriguez@example.com',
  couponUsed: 'james.patel@example.com',
  withGiftCard: 'olivia.thompson@example.com',
  euro: 'emma.wilson@example.com',
  outstandingCredit: 'liam.murphy@example.com',
  erased: 'harper.white@example.com',
} as const

export const creditMemos = {
  partlyUsed: 'Goodwill for a late delivery',
  euro: 'Return credited to the account',
  outstanding: 'Birthday credit',
  erased: 'Credit before the account was erased',
} as const

export interface Loyalty {
  ids: {
    promotions: Record<keyof typeof promotions, string>
    giftCards: Record<keyof typeof giftCards, string>
    batch: string
    customers: Record<keyof typeof customers, string>
    usedCode: string
    orders: {
      partlyRedeemed: string
      redeemed: string
      partlyUsedCredit: string
      couponUsed: string
    }
  }
}

type Headers = Record<string, string>
type Response = Awaited<ReturnType<APIRequestContext['get']>>

async function json<T>(response: Response) {
  expect(response.ok(), `${response.url()}: ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function list<T>(api: APIRequestContext, headers: Headers, path: string) {
  return (await json<{ data: T[] }>(await api.get(`/api/v3/admin/${path}`, { headers }))).data
}

const address = (first: string, last: string) => ({
  first_name: first,
  last_name: last,
  address1: '1 Main St',
  city: 'Los Angeles',
  country_code: 'US',
  state_code: 'CA',
  postal_code: '90001',
  phone: '5555555555',
})

export async function seedLoyalty(baseURL: string): Promise<Loyalty> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const get = <T>(path: string) => api.get(`/api/v3/admin/${path}`, { headers }).then(json<T>)
    const post = <T>(path: string, data?: object) =>
      api.post(`/api/v3/admin/${path}`, { headers, data }).then(json<T>)
    const patch = <T>(path: string, data?: object) =>
      api.patch(`/api/v3/admin/${path}`, { headers, data }).then(json<T>)

    const customerIds = {} as Record<keyof typeof customers, string>
    for (const [key, email] of Object.entries(customers) as [keyof typeof customers, string][]) {
      const found = await list<{ id: string }>(
        api,
        headers,
        `customers?q[email_eq]=${encodeURIComponent(email)}&limit=1`,
      )
      // The erased customer keeps its id, but no longer its address, once a run has erased it.
      if (found[0]) customerIds[key] = found[0].id
    }
    const byName = async (path: string, name: string) =>
      (
        await list<{ id: string }>(
          api,
          headers,
          `${path}?q[name_eq]=${encodeURIComponent(name)}&limit=1`,
        )
      )[0]?.id
    const promoVariant = (
      await list<{ id: string }>(api, headers, `variants?q[sku_eq]=${FIXTURE_PROMO_SKU}`)
    )[0]?.id as string
    expect(promoVariant, 'the browser tests’ promo product').toBeTruthy()
    const kettleProduct = (await byName('products', 'Electric Kettle 1.7L')) as string
    const promoProduct = (await byName('products', 'E2E Promo Product')) as string
    const kettleVariant = (
      await get<{ default_variant_id?: string; default_variant?: { id: string } }>(
        `products/${kettleProduct}?expand=default_variant`,
      )
    ).default_variant?.id as string
    const promoCategory = (
      await list<{ id: string }>(
        api,
        headers,
        `categories?q[name_eq]=${encodeURIComponent(FIXTURE_PROMO_TAXON)}&limit=1`,
      )
    )[0]?.id as string
    const kitchen = (
      await list<{ id: string }>(api, headers, 'categories?q[name_eq]=Kitchen&limit=1')
    )[0]?.id as string
    const groups = await list<{ id: string; name: string }>(api, headers, 'customer_groups')
    const channels = await list<{ id: string; name: string }>(api, headers, 'channels')
    const markets = await list<{ id: string; name: string }>(api, headers, 'markets')
    const optionTypes = await list<{
      name: string
      option_values: { id: string; name: string }[]
    }>(api, headers, 'option_types?expand=option_values')
    const color = optionTypes.find((type) => type.name === 'color')?.option_values ?? []
    const optionValueIds = color
      .filter((value) => ['matte-black', 'silver'].includes(value.name))
      .map((value) => value.id)
    const groupId = (name: string) => groups.find((group) => group.name === name)?.id as string
    const channelId = (name: string) =>
      channels.find((channel) => channel.name === name)?.id as string
    const marketId = (name: string) => markets.find((market) => market.name === name)?.id as string

    const promotionIds = {} as Record<keyof typeof promotions, string>
    const promotion = async (key: keyof typeof promotions, data: object) => {
      const name = promotions[key]
      promotionIds[key] =
        (await byName('promotions', name)) ??
        (await post<{ id: string }>('promotions', { name, ...data })).id
    }

    promotionIds.sample = (await byName('promotions', promotions.sample)) as string
    expect(promotionIds.sample, 'the sample Free Shipping promotion').toBeTruthy()
    await promotion('running', {
      description: 'Ten percent off a first autumn order in North America.',
      kind: 'automatic',
      starts_at: '2026-10-01T00:00:00.000Z',
      expires_at: '2026-12-31T23:59:00.000Z',
      match_policy: 'all',
      rules: [
        { type: 'country', preferences: { country_codes: ['US', 'CA'] } },
        { type: 'item_total', preferences: { amount_min: '50', operator_min: 'gte' } },
      ],
      actions: [
        {
          type: 'create_adjustment',
          calculator: { type: 'flat_percent_item_total', preferences: { flat_percent: '10' } },
        },
      ],
    })
    await promotion('singleCode', {
      description: 'Fifteen percent off each item for signed-in regulars.',
      kind: 'coupon_code',
      code: singleCode,
      starts_at: '2026-09-01T00:00:00.000Z',
      usage_limit: 100,
      match_policy: 'all',
      rules: [
        { type: 'customer', customer_ids: [customerIds.partlyRedeemed, customerIds.redeemed] },
        {
          type: 'customer_group',
          preferences: { customer_group_ids: [groupId('Wholesale')] },
        },
        { type: 'customer_logged_in' },
        { type: 'one_use_per_user' },
      ],
      actions: [
        {
          type: 'create_item_adjustments',
          calculator: { type: 'percent_on_line_item', preferences: { percent: '15' } },
        },
      ],
    })
    await promotion('manyCodes', {
      description: 'Sixty single-use codes for the winter gift guide.',
      kind: 'coupon_code',
      multi_codes: true,
      number_of_codes: numberOfCodes,
      code_prefix: codePrefix,
      starts_at: '2026-11-01T00:00:00.000Z',
      expires_at: '2027-01-31T23:59:00.000Z',
      match_policy: 'any',
      rules: [
        {
          type: 'product',
          product_ids: [promoProduct, kettleProduct],
          preferences: { match_policy: 'any' },
        },
        {
          type: 'category',
          category_ids: [promoCategory, kitchen],
          preferences: { match_policy: 'any' },
        },
      ],
      actions: [
        { type: 'free_shipping' },
        {
          type: 'create_adjustment',
          calculator: { type: 'flat_rate', preferences: { amount: '5', currency: 'USD' } },
        },
      ],
    })
    await promotion('notStarted', {
      description: 'Spring savings that grow with the order, online in the United States.',
      kind: 'automatic',
      starts_at: '2027-03-01T00:00:00.000Z',
      expires_at: '2027-04-30T23:59:00.000Z',
      match_policy: 'all',
      rules: [
        { type: 'channel', preferences: { channel_ids: [channelId('Online Store')] } },
        { type: 'market', preferences: { market_ids: [marketId('United States')] } },
        { type: 'currency', preferences: { currency: 'USD' } },
      ],
      actions: [
        {
          type: 'create_adjustment',
          calculator: {
            type: 'tiered_percent',
            preferences: {
              base_percent: '5',
              tiers: [
                { threshold: '100', value: '10' },
                { threshold: '250', value: '15' },
              ],
            },
          },
        },
        {
          type: 'create_item_adjustments',
          calculator: { type: 'flat_rate', preferences: { amount: '2', currency: 'USD' } },
        },
      ],
    })
    await promotion('expired', {
      description: 'A free kettle with a first order of black or silver appliances.',
      kind: 'automatic',
      starts_at: '2026-06-01T00:00:00.000Z',
      expires_at: '2026-08-31T23:59:00.000Z',
      match_policy: 'all',
      rules: [
        {
          type: 'option_value',
          preferences: { match_policy: 'any', eligible_values: optionValueIds },
        },
        { type: 'first_order' },
      ],
      actions: [
        {
          type: 'create_adjustment',
          calculator: {
            type: 'flexi_rate',
            preferences: { first_item: '10', additional_item: '5', max_items: 3, currency: 'USD' },
          },
        },
        { type: 'create_line_items', line_items: [{ variant_id: kettleVariant, quantity: 1 }] },
      ],
    })
    await promotion('tiered', {
      description: 'A larger discount the more a trade buyer spends.',
      kind: 'coupon_code',
      code: tieredCode,
      starts_at: '2026-10-15T00:00:00.000Z',
      match_policy: 'all',
      rules: [],
      actions: [
        {
          type: 'create_adjustment',
          calculator: {
            type: 'tiered_flat_rate',
            preferences: {
              base_amount: '0',
              currency: 'USD',
              tiers: [
                { threshold: '50', value: '5' },
                { threshold: '150', value: '20' },
              ],
            },
          },
        },
        {
          type: 'create_item_adjustments',
          calculator: {
            type: 'flexi_rate',
            preferences: { first_item: '3', additional_item: '1', max_items: 5, currency: 'USD' },
          },
        },
      ],
    })

    const giftCardIds = {} as Record<keyof typeof giftCards, string>
    const giftCard = async (key: keyof typeof giftCards, data: object) => {
      const code = giftCards[key]
      giftCardIds[key] =
        (
          await list<{ id: string }>(
            api,
            headers,
            `gift_cards?q[code_eq]=${encodeURIComponent(code)}&limit=1`,
          )
        )[0]?.id ?? (await post<{ id: string }>('gift_cards', { code, ...data })).id
    }
    await giftCard('withCustomer', {
      amount: '50.00',
      currency: 'USD',
      expires_at: '2027-06-30',
      customer_id: customerIds.withGiftCard,
    })
    await giftCard('withoutCustomer', { amount: '75.00', currency: 'USD' })
    await giftCard('partlyRedeemed', {
      amount: '100.00',
      currency: 'USD',
      customer_id: customerIds.partlyRedeemed,
    })
    await giftCard('redeemed', {
      amount: '10.00',
      currency: 'USD',
      customer_id: customerIds.redeemed,
    })
    await giftCard('expired', { amount: '30.00', currency: 'USD', expires_at: '2026-10-01' })
    await giftCard('euro', {
      amount: '40.00',
      currency: 'EUR',
      expires_at: '2027-12-31',
      customer_id: customerIds.euro,
    })
    const batches = await list<{ id: string; prefix: string }>(api, headers, 'gift_card_batches')
    const batch =
      batches.find((candidate) => candidate.prefix?.toUpperCase() === batchPrefix)?.id ??
      (
        await post<{ id: string }>('gift_card_batches', {
          prefix: batchPrefix,
          codes_count: 5,
          amount: '25.00',
          currency: 'USD',
          expires_at: '2027-01-31',
        })
      ).id

    const credits = await list<{ memo: string | null }>(api, headers, 'store_credits?limit=100')
    const credit = async (customer: keyof typeof customers, data: { memo: string }) => {
      if (credits.some((existing) => existing.memo === data.memo)) return
      await post(`customers/${customerIds[customer]}/store_credits`, data)
    }
    await credit('partlyUsedCredit', {
      amount: '200.00',
      currency: 'USD',
      memo: creditMemos.partlyUsed,
    } as never)
    await credit('euro', { amount: '60.00', currency: 'EUR', memo: creditMemos.euro } as never)
    await credit('outstandingCredit', {
      amount: '25.00',
      currency: 'USD',
      memo: creditMemos.outstanding,
    } as never)
    if (customerIds.erased) {
      await credit('erased', {
        amount: '15.00',
        currency: 'USD',
        memo: creditMemos.erased,
      } as never)
      await post(`customers/${customerIds.erased}/anonymize`)
    }
    // Erasing the customer also clears the credit's memo, so it is found by its customer.
    const erased = (
      await list<{ customer_id: string | null; customer?: { anonymized?: boolean } }>(
        api,
        headers,
        'store_credits?limit=100&expand=customer',
      )
    ).find((existing) => existing.customer?.anonymized)
    expect(erased, 'the credit of the erased customer').toBeTruthy()
    customerIds.erased = erased?.customer_id as string

    /**
     * An order for the customer, placed and completed through the Admin API,
     * paid as `pay` applies; a run that finds the order's marker in its
     * metadata reuses it.
     */
    const orders = await list<{ id: string; metadata?: Record<string, unknown> | null }>(
      api,
      headers,
      'orders?limit=100',
    )
    const order = async (
      marker: string,
      customer: keyof typeof customers,
      quantity: number,
      pay: (order: { id: string; total: string; currency: string }) => Promise<void>,
    ) => {
      const existing = orders.find((candidate) => candidate.metadata?.fidelity === marker)
      if (existing) return existing.id
      const [first, last] = customers[customer].split('@')[0].split('.')
      const created = await post<{ id: string; total: string; currency: string }>('orders', {
        customer_id: customerIds[customer],
        items: [{ variant_id: promoVariant, quantity }],
        shipping_address: address(first, last),
        billing_address: address(first, last),
        metadata: { fidelity: marker },
      })
      await pay(created)
      await patch(`orders/${created.id}/complete`)
      return created.id
    }
    const balance = async (id: string) => (await get<{ total: string }>(`orders/${id}`)).total

    const partlyRedeemedOrder = await order(
      'fidelity part 3: gift card partly redeemed',
      'partlyRedeemed',
      1,
      async ({ id }) => {
        await post(`orders/${id}/gift_cards`, { code: giftCards.partlyRedeemed })
      },
    )
    const redeemedOrder = await order(
      'fidelity part 3: gift card redeemed',
      'redeemed',
      2,
      async ({ id }) => {
        await post(`orders/${id}/gift_cards`, { code: giftCards.redeemed })
        // Spree refuses store credit on an order that has a gift card, so the
        // rest is paid by the sample check payment method.
        const placed = await get<{ total: string; gift_card_total: string }>(`orders/${id}`)
        const check = (
          await list<{ id: string; type: string }>(api, headers, 'payment_methods')
        ).find((method) => method.type === 'check')
        expect(check, 'the sample check payment method').toBeTruthy()
        await post(`orders/${id}/payments`, {
          payment_method_id: check?.id,
          amount: (Number(placed.total) - Number(placed.gift_card_total)).toFixed(2),
        })
      },
    )
    const partlyUsedCreditOrder = await order(
      'fidelity part 3: credit partly used',
      'partlyUsedCredit',
      2,
      async ({ id }) => {
        await post(`orders/${id}/store_credits`)
      },
    )
    const unusedCodes = await list<{ code: string; state: string | null }>(
      api,
      headers,
      `promotions/${promotionIds.manyCodes}/coupon_codes?limit=100`,
    )
    const couponUsedOrder = await order(
      'fidelity part 3: coupon code used',
      'couponUsed',
      3,
      async ({ id, currency }) => {
        const code = unusedCodes.find((candidate) => candidate.state === 'unused')?.code
        await post(`orders/${id}/discount_codes`, { code })
        await post(`customers/${customerIds.couponUsed}/store_credits`, {
          amount: await balance(id),
          currency,
          memo: 'Paid an order with a winter code',
        })
        await post(`orders/${id}/store_credits`)
      },
    )
    const usedCode = (
      await list<{ code: string; state: string | null }>(
        api,
        headers,
        `promotions/${promotionIds.manyCodes}/coupon_codes?limit=100`,
      )
    ).find((candidate) => candidate.state === 'used')?.code as string
    expect(usedCode, 'the winter code the order used').toBeTruthy()

    return {
      ids: {
        promotions: promotionIds,
        giftCards: giftCardIds,
        batch,
        customers: customerIds,
        usedCode,
        orders: {
          partlyRedeemed: partlyRedeemedOrder,
          redeemed: redeemedOrder,
          partlyUsedCredit: partlyUsedCreditOrder,
          couponUsed: couponUsedOrder,
        },
      },
    }
  } finally {
    await api.dispose()
  }
}

export { FIXTURE_PROMO_CUSTOMER_GROUP }
