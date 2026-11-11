import type { CreditCard, Discount, Fee, Order, PaymentMethod, TaxLine } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { promotions } from '../../../fixtures/admin/loyalty'
import {
  addedTaxLines,
  draftOrders,
  listedOrders,
  orderPaymentMethods,
  savedCard,
  secondCard,
} from '../../../fixtures/admin/orders'
import { cancellationReasons, channels } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { tagList } from './catalog'
import { countries } from './countries'
import { variantList } from './inventory'
import { paged } from './merchandising'
import { reasonRequests } from './settings'

const admin = '/api/v3/admin'

/** The value of the first query parameter whose name holds `key`, such as a Ransack predicate. */
function filter(request: Request, key: string) {
  for (const [name, value] of new URL(request.url).searchParams) {
    if (name.includes(key)) return value
  }
  return null
}

/** An order's adjustment rows, keyed by the order they belong to. */
export interface OrderLines {
  taxLines?: TaxLine[]
  discounts?: Discount[]
  fees?: Fee[]
}

/**
 * The store's orders as the order screens read them: the placed list and the
 * drafts, one order opened with its tax lines, discounts and fees, and every
 * change the order page makes, answered as succeeding. A write answers with
 * the order unchanged; the story's own state is what it shows.
 */
export function orderRequests(
  orders: Order[] = [...listedOrders, ...draftOrders],
  lines: Record<string, OrderLines> = {},
) {
  const find = (id: unknown) => orders.find((order) => order.id === id) ?? orders[0]
  return [
    http.get(`${admin}/orders`, ({ request }) => {
      const params = new URL(request.url).searchParams
      const drafts = params.get('incomplete') === '1'
      const query = (params.get('search') ?? '').toLowerCase()
      const listed = orders.filter(
        (order) =>
          (drafts ? !order.completed_at : !!order.completed_at) &&
          (!query ||
            order.number.toLowerCase().includes(query) ||
            order.email.toLowerCase().includes(query)),
      )
      return HttpResponse.json(paged(listed, request))
    }),
    http.get(`${admin}/orders/:id`, ({ params }) => HttpResponse.json(find(params.id))),
    http.get(`${admin}/orders/:id/tax_lines`, ({ params }) =>
      HttpResponse.json(onePage(lines[params.id as string]?.taxLines ?? addedTaxLines)),
    ),
    http.get(`${admin}/orders/:id/discounts`, ({ params }) =>
      HttpResponse.json(onePage(lines[params.id as string]?.discounts ?? [])),
    ),
    http.get(`${admin}/orders/:id/fees`, ({ params }) =>
      HttpResponse.json(onePage(lines[params.id as string]?.fees ?? [])),
    ),
    http.patch(`${admin}/orders/:id`, ({ params }) => HttpResponse.json(find(params.id))),
    http.patch(`${admin}/orders/:id/:action`, ({ params }) => HttpResponse.json(find(params.id))),
    http.delete(`${admin}/orders/:id`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${admin}/orders/:id/resend_confirmation`, ({ params }) =>
      HttpResponse.json(find(params.id)),
    ),
    http.post(`${admin}/orders/:id/resend_digital_links`, ({ params }) =>
      HttpResponse.json(find(params.id)),
    ),
    http.patch(`${admin}/digital_links/:id/reset`, ({ params }) =>
      HttpResponse.json({ id: params.id }),
    ),
    http.post(`${admin}/orders/:id/:collection`, ({ params }) =>
      HttpResponse.json(find(params.id), { status: 201 }),
    ),
    http.delete(
      `${admin}/orders/:id/:collection/:rowId`,
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.patch(`${admin}/orders/:id/payments/:paymentId/:action`, ({ params }) =>
      HttpResponse.json(
        find(params.id).payments?.find((each) => each.id === params.paymentId) ?? {},
      ),
    ),
  ]
}

/** The methods the add payment dialog lists. */
export function orderPaymentMethodList(records: PaymentMethod[] = orderPaymentMethods) {
  return [http.get(`${admin}/payment_methods`, () => HttpResponse.json(onePage(records)))]
}

/** A customer's saved cards, for a method that charges one. */
export function savedCardList(records: CreditCard[] = [savedCard, secondCard]) {
  return [
    http.get(`${admin}/customers/:customerId/credit_cards`, () =>
      HttpResponse.json(onePage(records)),
    ),
  ]
}

/** The promotions the code dialog suggests: those with a single code. */
export function couponPromotionList() {
  return [
    http.get(`${admin}/promotions`, ({ request }) => {
      const kind = filter(request, 'kind_eq')
      return HttpResponse.json(
        onePage(promotions.filter((promotion) => !kind || promotion.kind === kind)),
      )
    }),
  ]
}

/** Everything the order page's cards read, answered from the fixtures. */
export function orderPageRequests(orders?: Order[], lines?: Record<string, OrderLines>) {
  return [
    ...orderRequests(orders, lines),
    ...orderPaymentMethodList(),
    ...savedCardList(),
    ...couponPromotionList(),
    ...reasonRequests('order-cancellation-reasons', cancellationReasons),
    ...tagList(['VIP', 'Gift', 'Wholesale lead', 'Fragile', 'Repeat']),
    http.get(`${admin}/channels`, () => HttpResponse.json(onePage(channels))),
    ...variantList(),
    ...countries,
  ]
}

/** A write the order page sends, held open so its button shows that it is working. */
export function orderWriteHeld(method: 'post' | 'patch' | 'delete', path: string) {
  return [
    http[method](`${admin}/${path}`, async () => {
      await delay('infinite')
    }),
  ]
}

/** A gift card code the server does not know. */
export const giftCardRefused = [
  http.post(`${admin}/orders/:id/gift_cards`, () =>
    HttpResponse.json(
      { error: { code: 'processing_error', message: 'The Gift Card was not found.' } },
      { status: 422 },
    ),
  ),
]

/** A discount code no promotion takes. */
export const discountCodeRefused = [
  http.post(`${admin}/orders/:id/discount_codes`, () =>
    HttpResponse.json(
      {
        error: {
          code: 'validation_error',
          message: "The coupon code you entered doesn't exist. Please try again.",
          details: {},
        },
      },
      { status: 422 },
    ),
  ),
]

/** The order itself, held or failing, for the page's loading and error states. */
export const orderReadHeld = [
  http.get(`${admin}/orders/:id`, async () => {
    await delay('infinite')
  }),
]
export const orderReadFailed = [
  http.get(`${admin}/orders/:id`, () =>
    HttpResponse.json(
      { error: { code: 'record_not_found', message: 'The order could not be found' } },
      { status: 404 },
    ),
  ),
]
export const adjustmentLinesFailed = [
  http.get(`${admin}/orders/:id/tax_lines`, () => new HttpResponse(null, { status: 500 })),
]
export const adjustmentLinesHeld = [
  http.get(`${admin}/orders/:id/tax_lines`, async () => {
    await delay('infinite')
  }),
]
