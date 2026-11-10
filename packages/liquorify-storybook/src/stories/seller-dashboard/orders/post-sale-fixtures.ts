import type { Claim, Exchange, Return } from '@spree/seller-sdk'
import { partialOrderClaims, shippedOrderReturns } from '../../../fixtures/seller/orders'
import { returnReasons } from '../../../fixtures/seller/settings'

const [approvedReturn] = shippedOrderReturns
const [line] = approvedReturn.return_line_items ?? []
const [openClaim] = partialOrderClaims

/** The shipped order's return, in each status a return reaches. */
export const returnIn = (status: Return['status'], changes: Partial<Return> = {}): Return => ({
  ...approvedReturn,
  status,
  ...changes,
})

export const requestedReturn = returnIn('requested', { approved_at: null })
export const receivedReturn = returnIn('received', {
  received_at: '2026-10-01T10:30:00.000Z',
  return_line_items: [{ ...line, received_quantity: 1, resellable: false }],
})
export const refundedReturn = returnIn('refunded', {
  received_at: '2026-10-01T10:30:00.000Z',
  refunded_at: '2026-10-01T11:00:00.000Z',
  refunded_total: '42.00',
  refundable_total: '0.00',
  return_line_items: [{ ...line, received_quantity: 1 }],
})

/** The part-shipped order's claim, in each status a claim reaches. */
export const claimIn = (status: Claim['status'], changes: Partial<Claim> = {}): Claim => ({
  ...openClaim,
  status,
  ...changes,
})

/**
 * An exchange of one shipped bottle for another. Invented: the Seller API
 * refuses every exchange on a product the seller owns (work item §10, see the
 * verification record), so the browser-test server has none to read.
 */
export const exchangeIn = (
  status: Exchange['status'],
  changes: Partial<Exchange> = {},
): Exchange => ({
  id: 'exch_4Rt8Yp2Kw6',
  number: 'EXC1001',
  status,
  order_id: openClaim.order_id,
  reason_id: returnReasons[0].id,
  price_difference: '0.00',
  approved_at: status === 'requested' ? null : '2026-10-01T09:00:00.000Z',
  received_at: ['received', 'fulfilled'].includes(status) ? '2026-10-01T10:00:00.000Z' : null,
  fulfilled_at: status === 'fulfilled' ? '2026-10-01T11:00:00.000Z' : null,
  canceled_at: status === 'canceled' ? '2026-10-01T11:00:00.000Z' : null,
  reason: returnReasons[0],
  exchange_line_items: [
    {
      id: 'exli_9Dk3Lq7Wm2',
      quantity: 1,
      received_quantity: status === 'received' || status === 'fulfilled' ? 1 : 0,
      resellable: true,
      original_price: '42.00',
      new_variant_price: '42.00',
      price_difference: '0.00',
      original_tax_total: '0.00',
      new_tax_total: '0.00',
      original_variant_id: line.variant_id,
      new_variant_id: line.variant_id,
      line_item_id: line.line_item_id,
      fulfillment_item_id: line.fulfillment_item_id,
      name: line.name,
      new_variant_name: line.name,
    },
  ],
  memo: 'Customer asked for a fresh bottle from the next batch.',
  stock_location_id: approvedReturn.stock_location_id,
  ...changes,
})
