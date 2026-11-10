import type {
  Claim,
  Exchange,
  MeResponse,
  OnboardingResponse,
  Order,
  Profile,
  Return,
  Transfer,
} from '@spree/seller-sdk'
import { delay, HttpResponse, http } from 'msw'
import { countries as countryList } from '../../../fixtures/admin/countries'
import { balances } from '../../../fixtures/seller/balances'
import { payouts, transfers } from '../../../fixtures/seller/ledger'
import {
  canceledOrder,
  ledgerOrder,
  newOrder,
  partialOrder,
  partialOrderClaims,
  shippedOrder,
  shippedOrderReturns,
  shippedOrderTransfers,
} from '../../../fixtures/seller/orders'
import { products } from '../../../fixtures/seller/products'
import { onboarding, profile } from '../../../fixtures/seller/profile'
import { me } from '../../../fixtures/seller/session'
import {
  cancellationReasons,
  claimReasons,
  invitations,
  returnReasons,
  stockLocations,
  team,
  trackingCarriers,
} from '../../../fixtures/seller/settings'
import { onePage } from '../../page'

export const seller = '/api/v3/seller'

/** The countries, with Oregon among the United States' states, where the fixtures' shopper lives. */
const countries = countryList.map((country) =>
  country.iso === 'US'
    ? {
        ...country,
        states: [...(country.states ?? []), { abbr: 'OR', name: 'Oregon' }],
      }
    : country,
)

/** A signed-in member of the seller team, as the auth provider finds them on mount. */
export function sellerSession(answer: MeResponse = me) {
  return [
    http.post(`${seller}/auth/refresh`, () =>
      HttpResponse.json({ token: 'story-access-token', user: answer.user }),
    ),
    http.get(`${seller}/me`, () => HttpResponse.json(answer)),
  ]
}

const allOrders = [newOrder, partialOrder, canceledOrder, shippedOrder, ledgerOrder]

/** A record by its id, or the 404 Spree answers for one it cannot find. */
function found<T extends { id: string }>(records: T[], id: unknown) {
  const record = records.find((candidate) => candidate.id === id)
  return record ? HttpResponse.json(record) : new HttpResponse(null, { status: 404 })
}

export interface SellerRecords {
  profile?: Profile
  onboarding?: OnboardingResponse
  orders?: Order[]
  /** The shipped order's returns. */
  returns?: Return[]
  /** The part-shipped order's exchanges and claims. */
  exchanges?: Exchange[]
  claims?: Claim[]
  orderTransfers?: Transfer[]
}

/**
 * The seller panel's reads, from the fixtures read off the Seller API, and the
 * writes its screens send, answered as they succeed by echoing the record.
 */
export function sellerRequests({
  profile: answeredProfile = profile,
  onboarding: answeredOnboarding = onboarding,
  orders = allOrders,
  returns = shippedOrderReturns,
  exchanges = [],
  claims = partialOrderClaims,
  orderTransfers = shippedOrderTransfers,
}: SellerRecords = {}) {
  const orderReturns = (id: unknown) => (id === shippedOrder.id ? returns : [])
  const postSale = <T>(id: unknown, records: T[]) => ({
    data: id === partialOrder.id ? records : [],
  })
  return [
    http.get(`${seller}/profile`, () => HttpResponse.json(answeredProfile)),
    http.patch(`${seller}/profile`, async ({ request }) =>
      HttpResponse.json({ ...answeredProfile, ...((await request.json()) as object) }),
    ),
    http.get(`${seller}/onboarding`, () => HttpResponse.json(answeredOnboarding)),
    http.get(`${seller}/countries`, () => HttpResponse.json({ data: countries })),
    http.get(`${seller}/tax_identifiers`, () => HttpResponse.json({ data: [] })),
    http.get(`${seller}/team`, () => HttpResponse.json({ data: team })),
    http.get(`${seller}/invitations`, () => HttpResponse.json({ data: invitations })),
    http.get(`${seller}/products/:id`, ({ params }) => found(products, params.id)),
    http.get(`${seller}/products`, () => HttpResponse.json(onePage(products))),
    http.patch(`${seller}/products/:id/:action`, ({ params }) => found(products, params.id)),
    http.get(`${seller}/orders/:id/returns`, ({ params }) =>
      HttpResponse.json({ data: orderReturns(params.id) }),
    ),
    http.get(`${seller}/orders/:id/exchanges`, ({ params }) =>
      HttpResponse.json(postSale(params.id, exchanges)),
    ),
    http.get(`${seller}/orders/:id/claims`, ({ params }) =>
      HttpResponse.json(postSale(params.id, claims)),
    ),
    http.get(`${seller}/orders/:id`, ({ params }) => found(orders, params.id)),
    http.get(`${seller}/orders`, () => HttpResponse.json(onePage(orders))),
    http.get(`${seller}/transfers`, ({ request }) => {
      const order = new URL(request.url).searchParams.get('q[order_id_eq]')
      if (!order) return HttpResponse.json(onePage(transfers))
      return HttpResponse.json(onePage(order === shippedOrder.id ? orderTransfers : []))
    }),
    http.get(`${seller}/payouts/:id`, ({ params }) => found(payouts, params.id)),
    http.get(`${seller}/payouts`, () => HttpResponse.json(onePage(payouts))),
    http.get(`${seller}/balances`, () => HttpResponse.json({ data: balances })),
    http.get(`${seller}/stock_locations`, () => HttpResponse.json(onePage(stockLocations))),
    http.get(`${seller}/return_reasons`, () => HttpResponse.json({ data: returnReasons })),
    http.get(`${seller}/claim_reasons`, () => HttpResponse.json({ data: claimReasons })),
    http.get(`${seller}/order_cancellation_reasons`, () =>
      HttpResponse.json({ data: cancellationReasons }),
    ),
    http.get(`${seller}/tracking_carriers`, () => HttpResponse.json({ data: trackingCarriers })),
  ]
}

/** Holds a Seller API read open, so the screen stays in its loading state. */
export function sellerReadHeld(path: string) {
  return [
    http.get(`${seller}/${path}`, async () => {
      await delay('infinite')
    }),
  ]
}

/** A Seller API read that fails as a server error does. */
export function sellerReadFailed(path: string) {
  return [http.get(`${seller}/${path}`, () => new HttpResponse(null, { status: 500 }))]
}

/** Holds a Seller API write open, so the control stays in its saving state. */
export function sellerWriteHeld(path: string, method: 'post' | 'patch' | 'delete' = 'patch') {
  return [
    http[method](`${seller}/${path}`, async () => {
      await delay('infinite')
    }),
  ]
}
