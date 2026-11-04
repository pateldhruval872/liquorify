import type { Customer, Export, Promotion, StoreCredit } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { categories, optionTypes } from '../../../fixtures/admin/catalog'
import { countries as countryList } from '../../../fixtures/admin/countries'
import {
  itemAdjustmentCalculators,
  lineItemVariants,
  loyaltyCustomers,
  orderAdjustmentCalculators,
  promotionActions,
  promotionActionTypes,
  promotionRules,
  promotionRuleTypes,
  promotions,
  winterCodes,
} from '../../../fixtures/admin/loyalty'
import {
  customerGroups,
  pickableProducts,
  productExport,
} from '../../../fixtures/admin/merchandising'
import { channels, markets } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { paged, searchList } from './merchandising'

const admin = '/api/v3/admin'

/** The coupon code export Spree starts from a promotion's codes sheet, finished by the first poll. */
export const couponCodesExport: Export = {
  ...productExport,
  id: 'exp_6Cc9Ex3U',
  number: 'EF482913058',
  type: 'coupon_codes',
  filename: 'coupon_codes-sample-20261001120000.csv',
  byte_size: 5_705,
  download_url: '/api/v3/admin/exports/exp_6Cc9Ex3U/download',
}

const couponCodesCsv = [
  'code,state,promotion,order',
  ...winterCodes.slice(0, 3).map((code) => `${code.code},${code.state},Winter gifts,`),
].join('\n')

/**
 * A promotion's own requests as its page makes them: the promotion, its rules
 * and actions, its coupon codes 50 a page, the rule and action kinds Spree
 * registers and each adjustment's calculators, and the export of its codes.
 * Saves and deletes are answered as Spree answers them, echoing what was sent.
 */
export function promotionRequests(records: Promotion[] = promotions) {
  return [
    http.get(`${admin}/promotion_rules/types`, () =>
      HttpResponse.json({ data: promotionRuleTypes }),
    ),
    http.get(`${admin}/promotion_actions/types`, () =>
      HttpResponse.json({ data: promotionActionTypes }),
    ),
    http.get(`${admin}/promotion_actions/calculators`, ({ request }) => {
      const type = new URL(request.url).searchParams.get('type')
      if (type === 'create_adjustment')
        return HttpResponse.json({ data: orderAdjustmentCalculators })
      if (type === 'create_item_adjustments') {
        return HttpResponse.json({ data: itemAdjustmentCalculators })
      }
      return HttpResponse.json(
        { error: { code: 'unknown_promotion_action_type', message: 'Unknown type' } },
        { status: 422 },
      )
    }),
    http.get(`${admin}/promotions/:id`, ({ params }) => {
      const found = records.find((record) => record.id === params.id)
      return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
    }),
    http.get(`${admin}/promotions/:id/promotion_rules`, ({ params, request }) =>
      HttpResponse.json(paged(promotionRules[params.id as string] ?? [], request, 100)),
    ),
    http.get(`${admin}/promotions/:id/promotion_actions`, ({ params, request }) =>
      HttpResponse.json(paged(promotionActions[params.id as string] ?? [], request, 100)),
    ),
    http.get(`${admin}/promotions/:id/coupon_codes`, ({ params, request }) =>
      HttpResponse.json(
        paged(
          winterCodes.filter((code) => code.promotion_id === params.id),
          request,
          50,
        ),
      ),
    ),
    http.patch(`${admin}/promotions/:id`, async ({ params, request }) => {
      const record = records.find((candidate) => candidate.id === params.id) ?? records[0]
      return HttpResponse.json({ ...record, ...((await request.json()) as Partial<Promotion>) })
    }),
    http.post(`${admin}/exports`, async ({ request }) => {
      const body = (await request.json()) as { type: string }
      await delay(400)
      return HttpResponse.json(
        { ...couponCodesExport, type: body.type, done: false, download_url: null },
        { status: 201 },
      )
    }),
    http.get(`${admin}/exports/:id`, () => HttpResponse.json(couponCodesExport)),
    http.get(
      `${admin}/exports/:id/download`,
      () =>
        new HttpResponse(couponCodesCsv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${couponCodesExport.filename}"`,
          },
        }),
    ),
  ]
}

/** A promotion's codes held open, so the sheet stays on its first answer. */
export const couponCodesHeld = [
  http.get(`${admin}/promotions/:id/coupon_codes`, async () => {
    await delay('infinite')
  }),
]

/** The calculators held open, so the adjustment editor stays loading. */
export const calculatorsHeld = [
  http.get(`${admin}/promotion_actions/calculators`, async () => {
    await delay('infinite')
  }),
]

/**
 * What a promotion's rules and actions pick from: products, categories,
 * customers, customer groups, countries, channels, markets, option values and
 * variants, each searched and read back by id as its picker asks.
 */
export const promotionPickers = [
  searchList(`${admin}/products`, pickableProducts, (product) => product.name),
  searchList(`${admin}/categories`, categories, (category) => category.pretty_name),
  searchList(
    `${admin}/customers`,
    loyaltyCustomers,
    (customer) => `${customer.full_name ?? ''} ${customer.email ?? ''}`,
  ),
  searchList(`${admin}/customer_groups`, customerGroups, (group) => group.name),
  searchList(`${admin}/channels`, channels, (channel) => channel.name),
  searchList(`${admin}/markets`, markets, (market) => market.name),
  http.get(`${admin}/countries`, () => HttpResponse.json(onePage(countryList))),
  http.get(`${admin}/option_types`, () => HttpResponse.json(onePage(optionTypes))),
  http.get(`${admin}/variants`, ({ request }) => {
    const query = (new URL(request.url).searchParams.get('q[search]') ?? '').toLowerCase()
    return HttpResponse.json(
      paged(
        lineItemVariants.filter(
          (variant) =>
            !query || `${variant.product_name} ${variant.sku}`.toLowerCase().includes(query),
        ),
        request,
      ),
    )
  }),
  http.get(`${admin}/variants/:id`, ({ params }) => {
    const found = lineItemVariants.find((variant) => variant.id === params.id)
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
  }),
]

/**
 * A picker's list refused as Spree refuses a teammate without read access to
 * it, so the editor shows what the marketer, who may write promotions and
 * nothing else, sees.
 */
export function pickerForbidden(path: string) {
  return [
    http.get(`${admin}/${path}`, () =>
      HttpResponse.json(
        {
          error: { code: 'access_denied', message: 'You are not authorized to access this page.' },
        },
        { status: 403 },
      ),
    ),
  ]
}

/**
 * A customer's store credit as the issue and edit dialogs write it: issued
 * with what was sent, and updated by echoing it.
 */
export function customerCreditRequests(customers: Customer[] = loyaltyCustomers) {
  return [
    searchList(
      `${admin}/customers`,
      customers,
      (customer) => `${customer.full_name ?? ''} ${customer.email ?? ''}`,
    ),
    http.post(`${admin}/customers/:customerId/store_credits`, async ({ params, request }) => {
      const body = (await request.json()) as Partial<StoreCredit>
      await delay(200)
      return HttpResponse.json(
        {
          id: 'credit_9Nw1Is2Q',
          amount: body.amount,
          amount_used: '0.00',
          amount_remaining: body.amount,
          amount_authorized: '0.00',
          currency: body.currency,
          memo: body.memo ?? null,
          metadata: {},
          outstanding: true,
          customer_id: params.customerId,
          created_by_id: null,
          originator_type: null,
          originator_id: null,
          created_at: '2026-10-01T12:00:00.000Z',
          updated_at: '2026-10-01T12:00:00.000Z',
        },
        { status: 201 },
      )
    }),
    http.patch(`${admin}/customers/:customerId/store_credits/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Partial<StoreCredit>
      await delay(200)
      return HttpResponse.json({ id: params.id, ...body })
    }),
  ]
}

/** A credit's write held open, so its dialog stays saving. */
export const creditWriteHeld = [
  http.post(`${admin}/customers/:customerId/store_credits`, async () => {
    await delay('infinite')
  }),
  http.patch(`${admin}/customers/:customerId/store_credits/:id`, async () => {
    await delay('infinite')
  }),
]

/** Spree's refusal to change the amount of a credit some of which was used, as it answered on 2026-11-04. */
export const creditInUseRefused = [
  http.patch(`${admin}/customers/:customerId/store_credits/:id`, async () => {
    await delay(200)
    return HttpResponse.json(
      {
        error: {
          code: 'store_credit_in_use',
          message: 'Cannot change amount on a store credit that has already been used',
        },
      },
      { status: 422 },
    )
  }),
]

/**
 * Spree's refusal of an amount with more decimal places than the currency
 * has, which the dialog lets through, as the browser-test server answered on
 * 2026-11-04.
 */
export const creditAmountRefused = [
  http.post(`${admin}/customers/:customerId/store_credits`, async () => {
    await delay(200)
    return HttpResponse.json(
      {
        error: {
          code: 'invalid_money_format',
          message: 'amount has more than 2 decimal places',
          details: { amount: ['has more than 2 decimal places'] },
        },
      },
      { status: 422 },
    )
  }),
]
