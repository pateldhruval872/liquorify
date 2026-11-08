import type {
  Claim,
  Exchange,
  Fulfillment,
  Order,
  Return,
  TrackingCarrierOption,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { trackingCarriers } from '../../../fixtures/admin/after-sale'
import { claimReasons, returnReasons } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { stockLevelRequests } from './inventory'
import { reasonRequests, stockLocationList } from './settings'

const admin = '/api/v3/admin'

/** An order's returns, exchanges and claims. */
export interface AfterSaleRecords {
  returns?: Return[]
  exchanges?: Exchange[]
  claims?: Claim[]
}

/**
 * What the fulfilments card reads beside the order and every change it makes,
 * answered as succeeding: the carriers a tracking number can name, the
 * store's locations and their stock, and each write on a fulfilment, its
 * labels and its consignments. A write answers with the fulfilment
 * unchanged; the story's own state is what it shows.
 */
export function fulfillmentRequests(
  orders: Order[],
  carriers: TrackingCarrierOption[] = trackingCarriers,
) {
  const all = orders.flatMap((order) => order.fulfillments ?? [])
  const find = (id: unknown): Fulfillment | undefined => all.find((each) => each.id === id)
  const base = `${admin}/orders/:id/fulfillments`
  return [
    http.get(`${admin}/tracking_carriers`, () => HttpResponse.json({ data: carriers })),
    ...stockLocationList(),
    ...stockLevelRequests(),
    http.patch(`${base}/:fulfillmentId/split`, ({ params }) =>
      HttpResponse.json({ data: [find(params.fulfillmentId)].filter(Boolean) }),
    ),
    http.patch(`${base}/:fulfillmentId/:action`, ({ params }) =>
      HttpResponse.json(find(params.fulfillmentId) ?? {}),
    ),
    http.patch(`${base}/:fulfillmentId`, ({ params }) =>
      HttpResponse.json(find(params.fulfillmentId) ?? {}),
    ),
    http.post(`${base}/:fulfillmentId/labels`, ({ params }) =>
      HttpResponse.json(find(params.fulfillmentId)?.labels?.[0] ?? {}, { status: 201 }),
    ),
    http.patch(`${base}/:fulfillmentId/labels/:labelId/refund`, ({ params }) =>
      HttpResponse.json(
        find(params.fulfillmentId)?.labels?.find((each) => each.id === params.labelId) ?? {},
      ),
    ),
    http.delete(
      `${base}/:fulfillmentId/labels/:labelId`,
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.post(`${base}/:fulfillmentId/deliveries`, ({ params }) =>
      HttpResponse.json(find(params.fulfillmentId)?.deliveries?.[0] ?? {}, { status: 201 }),
    ),
    http.patch(`${base}/:fulfillmentId/deliveries/:deliveryId/mark_delivered`, ({ params }) =>
      HttpResponse.json(
        find(params.fulfillmentId)?.deliveries?.find((each) => each.id === params.deliveryId) ?? {},
      ),
    ),
    http.patch(`${base}/:fulfillmentId/deliveries/:deliveryId`, ({ params }) =>
      HttpResponse.json(
        find(params.fulfillmentId)?.deliveries?.find((each) => each.id === params.deliveryId) ?? {},
      ),
    ),
    http.delete(
      `${base}/:fulfillmentId/deliveries/:deliveryId`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ]
}

/**
 * An order's returns, exchanges and claims, by order id, with the reasons
 * their dialogs offer and every status change answered as succeeding.
 */
export function afterSaleRequests(records: Record<string, AfterSaleRecords> = {}) {
  const of = (id: unknown, kind: keyof AfterSaleRecords): { id: string }[] =>
    records[id as string]?.[kind] ?? []
  const everyRecord = Object.values(records).flatMap((each) => [
    ...(each.returns ?? []),
    ...(each.exchanges ?? []),
    ...(each.claims ?? []),
  ])
  const find = (id: unknown) => everyRecord.find((each) => each.id === id) ?? {}
  return [
    ...(['returns', 'exchanges', 'claims'] as const).map((kind) =>
      http.get(`${admin}/orders/:id/${kind}`, ({ params }) =>
        HttpResponse.json(onePage(of(params.id, kind))),
      ),
    ),
    http.patch(`${admin}/orders/:id/:kind/:recordId/:action`, ({ params }) =>
      HttpResponse.json(find(params.recordId)),
    ),
    http.post(`${admin}/orders/:id/returns/:returnId/labels`, () =>
      HttpResponse.json({}, { status: 201 }),
    ),
    http.patch(`${admin}/orders/:id/returns/:returnId/labels/:labelId/refund`, () =>
      HttpResponse.json({}),
    ),
    http.delete(
      `${admin}/orders/:id/returns/:returnId/labels/:labelId`,
      () => new HttpResponse(null, { status: 204 }),
    ),
    ...reasonRequests('return-reasons', returnReasons),
    ...reasonRequests('claim-reasons', claimReasons),
  ]
}

/** A write on a fulfilment held open, so its button shows that it is working. */
export function fulfillmentWriteHeld(path: string) {
  const [method, route] = path.split(' ') as ['post' | 'patch' | 'delete', string]
  return [
    http[method](`${admin}/orders/:id/fulfillments${route}`, async () => {
      await delay('infinite')
    }),
  ]
}

/** The carriers never answer, so the carrier field has nothing to list yet. */
export const trackingCarriersHeld = [
  http.get(`${admin}/tracking_carriers`, async () => {
    await delay('infinite')
  }),
]
