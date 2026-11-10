import type { Fulfillment, Order, ShippingLabel } from '@spree/seller-sdk'
import { newOrder, partialOrder } from '../../../fixtures/seller/orders'

/** The parcel still owed on the part-shipped order. */
export const owedParcel = partialOrder.fulfillments[0] as Fulfillment
/** The parcel already shipped, with its tracked delivery. */
export const shippedParcel = partialOrder.fulfillments[1] as Fulfillment

/** A label the seller printed elsewhere and uploaded to the owed parcel. */
export const uploadedLabel: ShippingLabel = {
  id: 'shplbl_3Kd9Wq2Lm7',
  source: 'uploaded',
  status: 'purchased',
  carrier: 'ups',
  carrier_name: 'UPS',
  service: 'Ground',
  tracking_number: '1Z999AA10123456785',
  currency: 'USD',
  format: 'pdf',
  external_id: null,
  metadata: {},
  refunded_at: null,
  created_at: '2026-10-01T11:40:00.000Z',
  updated_at: '2026-10-01T11:40:00.000Z',
  owner_id: owedParcel.id,
  owner_type: 'fulfillment',
  cost: '8.40',
  integration_id: null,
  file_pending: false,
  download_url: `/api/v3/seller/orders/${partialOrder.id}/fulfillments/${owedParcel.id}/labels/shplbl_3Kd9Wq2Lm7/download`,
}

/** The part-shipped order, its owed parcel carrying an uploaded label. */
export const labelledOrder: Order = {
  ...partialOrder,
  fulfillments: [{ ...owedParcel, labels: [uploadedLabel] }, shippedParcel],
}

/** A new order of two bottles, one parcel, so the split dialog has something to move. */
export const twoBottleOrder: Order = {
  ...newOrder,
  fulfillments: newOrder.fulfillments.map((parcel) => ({
    ...parcel,
    fulfillment_items: parcel.fulfillment_items.map((item) => ({ ...item, quantity: 2 })),
  })),
  items: newOrder.items.map((item) => ({ ...item, quantity: 2 })),
}
