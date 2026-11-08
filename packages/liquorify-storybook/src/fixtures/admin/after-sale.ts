import type {
  Claim,
  ClaimLineItem,
  Delivery,
  DeliveryMethod,
  DeliveryRate,
  Exchange,
  ExchangeLineItem,
  Fulfillment,
  FulfillmentItem,
  LineItem,
  Order,
  Return,
  ReturnLineItem,
  ShippingLabel,
  TrackingCarrierOption,
  Variant,
} from '@spree/admin-sdk'
import { clayMug, linenApron } from './catalog'
import { expressMethod, freeOverMethod, freightMethod, standardMethod } from './delivery'
import {
  apronItem,
  draftOrder,
  freightOrder,
  mugItem,
  negotiatedApronItem,
  paidOrder,
  staffActor,
  toteItem,
} from './orders'
import { claimReasons, returnReasons, stockLocations } from './settings'

/**
 * Batch 8's orders, part 2: what happens after the sale. Each order below is
 * one state of the order page's fulfilments card or its returns, exchanges
 * and claims cards, shaped on what Spree's Admin API answered for the same
 * state on the browser-test server. Every name, number and address is
 * invented. Dates sit around the frozen clock, 1 October 2026 (`../clock.ts`).
 */

const placed = '2026-09-28T09:20:00.000Z'
const packed = '2026-09-28T15:10:00.000Z'
const shipped = '2026-09-29T10:45:00.000Z'
const arrived = '2026-09-30T13:20:00.000Z'
const settled = '2026-09-30T16:05:00.000Z'

const [shopLocation, eastDepot] = stockLocations
const [damaged, differentItem] = returnReasons
const [arrivedDamaged, neverArrived] = claimReasons
const [oliveApron, , slateApron] = linenApron.variants as Variant[]
const mugVariant = clayMug.default_variant as Variant

// ---------------------------------------------------------------------------
// Carriers
// ---------------------------------------------------------------------------

/** The carriers Spree registers, as the tracking dialogs list them. */
export const trackingCarriers: TrackingCarrierOption[] = [
  { id: 'australia_post', name: 'Australia Post' },
  { id: 'canada_post', name: 'Canada Post' },
  { id: 'chronopost', name: 'Chronopost' },
  { id: 'colissimo', name: 'Colissimo' },
  { id: 'dhl', name: 'DHL' },
  { id: 'dpd', name: 'DPD' },
  { id: 'deutsche_post', name: 'Deutsche Post' },
  { id: 'evri', name: 'Evri' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'gls', name: 'GLS' },
  { id: 'inpost', name: 'InPost' },
  { id: 'poczta_polska', name: 'Poczta Polska' },
  { id: 'postnl', name: 'PostNL' },
  { id: 'royal_mail', name: 'Royal Mail' },
  { id: 'ups', name: 'UPS' },
  { id: 'usps', name: 'USPS' },
]

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

function rate(
  id: string,
  method: DeliveryMethod,
  cost: string,
  fields: Partial<DeliveryRate> = {},
): DeliveryRate {
  return {
    id,
    delivery_method_id: method.id,
    name: method.name,
    selected: false,
    cost,
    total: cost,
    additional_tax_total: '0.00',
    included_tax_total: '0.00',
    tax_total: '0.00',
    carrier: null,
    service_level: null,
    estimated_delivery_date: null,
    unpriced: false,
    freight_summary: null,
    metadata: {},
    created_at: placed,
    updated_at: placed,
    ...fields,
  }
}

export const standardRate = rate('dr_2St7Hk4q', standardMethod, '8.00', { selected: true })
export const expressRate = rate('dr_3Ex8Jl5r', expressMethod, '15.00')
export const freeRate = rate('dr_4Fr9Km6s', freeOverMethod, '0.00')
/** Freight waiting on a forwarder's quote: no price yet, which is not the same as free. */
export const freightRate = rate('dr_5Pf1Ln7t', freightMethod, '0.00', {
  selected: true,
  unpriced: true,
})

// ---------------------------------------------------------------------------
// Deliveries and labels
// ---------------------------------------------------------------------------

const trackingAt = (number: string) => `https://carrier.example/track?num=${number}`

function delivery(
  id: string,
  trackingNumber: string,
  carrier: string | null,
  carrierName: string | null,
  status: Delivery['status'],
  fields: Partial<Delivery> = {},
): Delivery {
  return {
    id,
    tracking_number: trackingNumber,
    carrier,
    carrier_name: carrierName,
    service: null,
    status,
    tracking_url: carrier ? trackingAt(trackingNumber) : null,
    estimated_delivery_at: null,
    delivered_at: status === 'delivered' ? arrived : null,
    details: null,
    created_at: shipped,
    updated_at: shipped,
    shipping_label_id: null,
    ...fields,
  }
}

export const upsDelivery = delivery('dlv_2Up6Ts8a', '1Z4E7W8A0312845560', 'ups', 'UPS', 'pending')
export const uspsDelivered = delivery(
  'dlv_3Us7Vt9b',
  '9400108205496312784501',
  'usps',
  'USPS',
  'delivered',
)
/** A forwarder Spree has no carrier for, kept as typed, with no tracking page. */
export const freightDelivery = delivery(
  'dlv_4Fr8Wu1c',
  'PRO-730418',
  'Harbor Line Freight',
  'Harbor Line Freight',
  'pending',
)

/** One consignment in each carrier status a delivery can carry. */
export const everyCarrierStatus: Delivery[] = (
  [
    'pending',
    'pre_transit',
    'in_transit',
    'out_for_delivery',
    'available_for_pickup',
    'delivered',
    'return_to_sender',
    'failure',
    'unknown',
  ] as const
).map((status, index) =>
  delivery(`dlv_9St${index}Xy${index}d`, `1Z4E7W8A03128455${60 + index}`, 'ups', 'UPS', status),
)

function label(id: string, fields: Partial<ShippingLabel> = {}): ShippingLabel {
  return {
    id,
    source: 'uploaded',
    status: 'purchased',
    carrier: 'ups',
    carrier_name: 'UPS',
    service: null,
    tracking_number: '1Z4E7W8A0312845560',
    currency: 'USD',
    format: 'pdf',
    external_id: null,
    metadata: {},
    refunded_at: null,
    created_at: packed,
    updated_at: packed,
    owner_id: 'ful_5Lb2Rq8n',
    owner_type: 'fulfillment',
    cost: '9.40',
    integration_id: null,
    file_pending: false,
    download_url: `/api/v3/admin/orders/or_5Lb1Kt7m/fulfillments/ful_5Lb2Rq8n/labels/${id}/download`,
    ...fields,
  }
}

/** Postage bought on the carrier's own site and recorded with its PDF. */
export const uploadedLabel = label('lbl_2Up5Pd9e')

/** Bought through a connected carrier account, so it can be given back. */
export const purchasedLabel = label('lbl_3Pc6Qe1f', {
  source: 'purchased',
  carrier: 'usps',
  carrier_name: 'USPS',
  service: 'Ground Advantage',
  tracking_number: '9400108205496312784501',
  cost: '7.85',
  external_id: 'shp_7f2c91',
  integration_id: 'int_4Ep8Kc2r',
})

export const refundRequestedLabel = label('lbl_4Rr7Rf2g', {
  ...purchasedLabel,
  id: 'lbl_4Rr7Rf2g',
  status: 'refund_requested',
})

export const refundedLabel = label('lbl_5Rd8Sg3h', {
  ...purchasedLabel,
  id: 'lbl_5Rd8Sg3h',
  status: 'refunded',
  refunded_at: shipped,
})

/** The carrier is still producing the file, so there is nothing to print yet. */
export const filePendingLabel = label('lbl_6Fp9Th4i', {
  ...purchasedLabel,
  id: 'lbl_6Fp9Th4i',
  file_pending: true,
  download_url: null,
})

/** The paperwork a carrier files beside a label for a parcel crossing a border. */
export const customsDocuments = [
  { kind: 'commercial_invoice', url: 'https://carrier.example/documents/ci-730418.pdf' },
  { kind: 'cn23', url: 'https://carrier.example/documents/cn23-730418.pdf' },
  { kind: 'export_declaration', url: 'https://carrier.example/documents/ed-730418.pdf' },
]

// ---------------------------------------------------------------------------
// Fulfilments
// ---------------------------------------------------------------------------

function unit(
  id: string,
  line: LineItem,
  quantity = line.quantity,
  status: FulfillmentItem['status'] = 'on_hand',
): FulfillmentItem {
  return {
    id,
    quantity,
    status,
    variant_id: line.variant_id,
    line_item_id: line.id,
    name: line.name,
    options_text: line.options_text || null,
  }
}

function fulfillment(
  id: string,
  number: string,
  units: FulfillmentItem[],
  fields: Partial<Fulfillment> = {},
): Fulfillment {
  return {
    id,
    number,
    tracking: null,
    tracking_url: null,
    pickup_point_data: null,
    selected_delivery_rate_id: standardRate.id,
    unpriced: false,
    cost: '8.00',
    total: '8.00',
    discount_total: '0.00',
    additional_tax_total: '0.00',
    included_tax_total: '0.00',
    tax_total: '0.00',
    status: 'unfulfilled',
    fulfillment_type: 'shipping',
    fulfilled_at: null,
    delivered_at: null,
    items: units.map((each) => ({
      item_id: each.line_item_id as string,
      variant_id: each.variant_id as string,
      quantity: each.quantity,
    })),
    deliveries: [],
    delivery_method: standardMethod,
    stock_location: shopLocation,
    delivery_rates: [standardRate, expressRate, freeRate],
    tax_lines: [],
    external_references: {},
    metadata: {},
    created_at: placed,
    updated_at: placed,
    adjustment_total: '0.00',
    pre_tax_amount: '8.00',
    order_id: paidOrder.id,
    stock_location_id: shopLocation.id,
    documents: [],
    labels: [],
    provider_generates_labels: false,
    fulfillment_items: units,
    ...fields,
  }
}

const bothItems = (prefix: string, status: FulfillmentItem['status'] = 'on_hand') => [
  unit(`fi_${prefix}Mg`, mugItem, mugItem.quantity, status),
  unit(`fi_${prefix}Ap`, apronItem, apronItem.quantity, status),
]

/** Placed and allocated: one parcel ready at the shop, by Standard, for $8.00. */
export const readyFulfillment = fulfillment('ful_2Rd4Kp7a', 'H100301-1', bothItems('2Rd4'))

/** Sent with a UPS number, which the carrier has not picked up yet. */
export const fulfilledFulfillment = fulfillment(
  'ful_3Sh5Lq8b',
  'H100302-1',
  bothItems('3Sh5', 'shipped'),
  {
    status: 'fulfilled',
    fulfilled_at: shipped,
    tracking: upsDelivery.tracking_number,
    tracking_url: upsDelivery.tracking_url,
    deliveries: [upsDelivery],
  },
)

/** Three consignments: two carriers Spree knows, and a freight forwarder it does not. */
export const trackedFulfillment = fulfillment(
  'ful_4Tr6Mr9c',
  'H100303-1',
  bothItems('4Tr6', 'shipped'),
  {
    status: 'fulfilled',
    fulfilled_at: shipped,
    tracking: upsDelivery.tracking_number,
    tracking_url: upsDelivery.tracking_url,
    deliveries: [upsDelivery, uspsDelivered, freightDelivery],
  },
)

/** Every carrier status a consignment can carry, one after another. */
export const everyStatusFulfillment = fulfillment(
  'ful_1Ev3Ks6z',
  'H100313-1',
  bothItems('1Ev3', 'shipped'),
  { status: 'fulfilled', fulfilled_at: shipped, deliveries: everyCarrierStatus },
)

/** Received by the customer, so the returns window has started. */
export const deliveredFulfillment = fulfillment(
  'ful_5Dl7Ns1d',
  'H100304-1',
  bothItems('5Dl7', 'shipped'),
  {
    status: 'delivered',
    fulfilled_at: shipped,
    delivered_at: arrived,
    tracking: uspsDelivered.tracking_number,
    tracking_url: uspsDelivered.tracking_url,
    deliveries: [uspsDelivered],
  },
)

/** Canceled before it shipped: its units went back on the shelf. */
export const canceledFulfillment = fulfillment('ful_6Cn8Ot2e', 'H100305-1', bothItems('6Cn8'), {
  status: 'canceled',
})

/** Nothing on the shelf, sold on backorder, so it waits for stock. */
export const backorderedFulfillment = fulfillment(
  'ful_7Bk9Pu3f',
  'H100306-1',
  bothItems('7Bk9', 'backordered'),
)

/** A label bought elsewhere and recorded with its file, number and postage. */
export const labelledFulfillment = fulfillment('ful_5Lb2Rq8n', 'H100307-1', bothItems('5Lb2'), {
  tracking: uploadedLabel.tracking_number,
  tracking_url: trackingAt(uploadedLabel.tracking_number as string),
  labels: [uploadedLabel],
  deliveries: [{ ...upsDelivery, shipping_label_id: uploadedLabel.id }],
})

/** Carried by a method whose provider buys labels, with none bought yet. */
export const labelReadyFulfillment = fulfillment('ful_8Pv1Qw4g', 'H100308-1', bothItems('8Pv1'), {
  provider_generates_labels: true,
})

/** A label bought through the carrier account, which can be given back while unused. */
export const purchasedLabelFulfillment = fulfillment(
  'ful_9Pl2Rx5h',
  'H100309-1',
  bothItems('9Pl2'),
  {
    provider_generates_labels: true,
    labels: [purchasedLabel],
    deliveries: [
      {
        ...uspsDelivered,
        status: 'pre_transit',
        delivered_at: null,
        shipping_label_id: purchasedLabel.id,
      },
    ],
  },
)

/** Sent abroad with a bought label and the customs paperwork the carrier filed. */
export const customsFulfillment = fulfillment(
  'ful_1Cs3Sy6i',
  'H100310-1',
  bothItems('1Cs3', 'shipped'),
  {
    status: 'fulfilled',
    fulfilled_at: shipped,
    provider_generates_labels: true,
    labels: [purchasedLabel],
    documents: customsDocuments,
    deliveries: [
      {
        ...uspsDelivered,
        status: 'in_transit',
        delivered_at: null,
        shipping_label_id: purchasedLabel.id,
      },
    ],
  },
)

/** The mugs ship from the shop, and the apron from the east coast depot. */
export const splitFulfillments = [
  fulfillment('ful_2Sp4Tz7j', 'H100311-1', [unit('fi_2Sp4Mg', mugItem)]),
  fulfillment('ful_3Sp5Ua8k', 'H100311-2', [unit('fi_3Sp5Ap', apronItem)], {
    stock_location: eastDepot,
    stock_location_id: eastDepot.id,
  }),
]

/** A wholesale pallet waiting on the forwarder's quote. */
export const freightFulfillment = fulfillment(
  'ful_4Fq6Vb9l',
  'H100256-1',
  [unit('fi_4Fq6Tt', freightOrder.items?.[0] as LineItem)],
  {
    selected_delivery_rate_id: freightRate.id,
    unpriced: true,
    cost: '0.00',
    total: '0.00',
    delivery_method: freightMethod,
    delivery_rates: [freightRate],
  },
)

/** A parcel whose method was since deleted and that costs nothing: no delivery row. */
export const unpricedPickupFulfillment = fulfillment(
  'ful_5Np7Wc1m',
  'H100312-1',
  bothItems('5Np7'),
  { delivery_method: undefined, cost: '0.00', total: '0.00', delivery_rates: [] },
)

// ---------------------------------------------------------------------------
// Orders, by what their fulfilments show
// ---------------------------------------------------------------------------

function placedOrder(id: string, number: string, fields: Partial<Order> = {}): Order {
  return { ...paidOrder, id, number, ...fields }
}

/** A draft with no address: its items wait, unclaimed, until it is placed. */
export const unaddressedDraft: Order = {
  ...draftOrder,
  id: 'or_1Ud3Xe5n',
  number: 'R100300',
  // The server gives a draft its statuses once it has an address.
  payment_status: null,
  fulfillment_status: null,
  shipping_address: null,
  fulfillments: [],
}

/** A draft with an address already has its parcel, but nothing can ship until it is placed. */
export const addressedDraft: Order = {
  ...draftOrder,
  id: 'or_2Ad4Yf6o',
  number: 'R100314',
  fulfillments: [
    fulfillment('ful_2Ad5Ze7p', 'H100314-1', [
      unit('fi_2Ad5Mg', mugItem),
      unit('fi_2Ad5Ap', negotiatedApronItem),
    ]),
  ],
}

/** Placed, with every unit still waiting for a parcel. */
export const awaitingOrder = placedOrder('or_3Aw5Zg7p', 'R100315', { fulfillments: [] })

export const readyOrder = placedOrder('or_2Rd3Jt6q', 'R100301', {
  fulfillments: [readyFulfillment],
})

export const shippedOrder = placedOrder('or_3Sh4Ku7r', 'R100302', {
  fulfillment_status: 'fulfilled',
  fulfillments: [fulfilledFulfillment],
})

export const trackedOrder = placedOrder('or_4Tr5Lv8s', 'R100303', {
  fulfillment_status: 'fulfilled',
  fulfillments: [trackedFulfillment],
})

export const everyStatusOrder = placedOrder('or_1Ev2Ja5x', 'R100313', {
  fulfillment_status: 'fulfilled',
  fulfillments: [everyStatusFulfillment],
})

export const deliveredOrder = placedOrder('or_5Dl6Mw9t', 'R100304', {
  fulfillment_status: 'delivered',
  fulfillments: [deliveredFulfillment],
})

/** Its only parcel canceled, which keeps the units it held. */
export const canceledFulfillmentOrder = placedOrder('or_6Cn7Nx1u', 'R100305', {
  fulfillments: [canceledFulfillment],
})

export const backorderedOrder = placedOrder('or_7Bk8Oy2v', 'R100306', {
  fulfillment_status: 'backorder',
  fulfillments: [backorderedFulfillment],
})

export const labelledOrder = placedOrder('or_5Lb1Kt7m', 'R100307', {
  fulfillments: [labelledFulfillment],
})

export const labelReadyOrder = placedOrder('or_8Pv9Pz3w', 'R100308', {
  fulfillments: [labelReadyFulfillment],
})

export const purchasedLabelOrder = placedOrder('or_9Pl1Qa4x', 'R100309', {
  fulfillments: [purchasedLabelFulfillment],
})

export const customsOrder = placedOrder('or_1Cs2Rb5y', 'R100310', {
  fulfillment_status: 'fulfilled',
  fulfillments: [customsFulfillment],
})

/** Split across two locations, the second adding its own delivery cost. */
export const splitOrder = placedOrder('or_2Sp3Sc6z', 'R100311', {
  fulfillments: splitFulfillments,
  delivery_total: '16.00',
  total: '109.52',
  amount_due: '8.00',
  payment_status: 'partially_paid',
})

/** The mugs went out first; the apron waits for its own parcel. */
export const partlyShippedOrder = placedOrder('or_3Ps4Td7a', 'R100316', {
  fulfillment_status: 'partial',
  fulfillments: [
    fulfillment('ful_3Ps5Ue8b', 'H100316-1', [unit('fi_3Ps5Mg', mugItem, 2, 'shipped')], {
      status: 'fulfilled',
      fulfilled_at: shipped,
      deliveries: [upsDelivery],
    }),
    fulfillment('ful_4Ps6Vf9c', 'H100316-2', [unit('fi_4Ps6Ap', apronItem)]),
  ],
})

export const freightPendingOrder: Order = {
  ...freightOrder,
  fulfillments: [freightFulfillment],
}

export const noDeliveryRowOrder = placedOrder('or_5Np6Wg1d', 'R100312', {
  fulfillments: [unpricedPickupFulfillment],
})

/** A line priced by a standalone price list, and one by a catalog's. */
export const pricedMugItem: LineItem = {
  ...mugItem,
  id: 'li_4Pl8Mg3h',
  quantity: 12,
  price: '19.50',
  total: '234.00',
  pre_tax_amount: '234.00',
  discounted_amount: '234.00',
  additional_tax_total: '0.00',
  adjustment_total: '0.00',
  price_source: 'price_list',
  price_list_id: 'pl_3Wh7Vs2k',
  price_list_name: 'Wholesale',
}
export const cataloguedToteItem: LineItem = {
  ...toteItem,
  id: 'li_5Ct9Tt4i',
  quantity: 24,
  price: '12.80',
  total: '307.20',
  pre_tax_amount: '307.20',
  discounted_amount: '307.20',
  price_source: 'catalog',
  price_list_id: 'pl_4Tr8Ct3l',
  price_list_name: 'Trade prices',
  catalog_id: 'cat_2Tr6Hb9q',
  catalog_name: 'Trade catalog',
}

export const pricedOrder = placedOrder('or_4Pc5Uh8e', 'R100317', {
  items: [pricedMugItem, cataloguedToteItem],
  item_total: '541.20',
  tax_total: '0.00',
  additional_tax_total: '0.00',
  adjustment_total: '0.00',
  total: '549.20',
  payment_total: '549.20',
  total_quantity: 36,
  fulfillments: [
    fulfillment('ful_4Pc6Wi9f', 'H100317-1', [
      unit('fi_4Pc6Mg', pricedMugItem),
      unit('fi_4Pc6Tt', cataloguedToteItem),
    ]),
  ],
})

/** An exchange sent its replacement: the second parcel holds the slate apron at no charge. */
export const replacementOrder = placedOrder('or_5Rp6Vj1g', 'R100318', {
  fulfillment_status: 'partial',
  fulfillments: [
    fulfillment('ful_5Rp7Xk2h', 'H100318-1', bothItems('5Rp7', 'shipped'), {
      status: 'fulfilled',
      fulfilled_at: shipped,
      deliveries: [upsDelivery],
    }),
    fulfillment(
      'ful_6Rp8Yl3i',
      'H100318-2',
      [
        {
          id: 'fi_6Rp8Ap',
          quantity: 1,
          status: 'on_hand',
          variant_id: slateApron.id,
          line_item_id: apronItem.id,
          name: 'Linen apron',
          options_text: slateApron.options_text,
        },
      ],
      { cost: '0.00', total: '0.00', pre_tax_amount: '0.00' },
    ),
  ],
})

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

const withName = (variant: Variant, productName: string): Variant => ({
  ...variant,
  product_name: productName,
})
const mugReturned = withName(mugVariant, 'Clay mug')
const oliveApronReturned = withName(oliveApron, 'Linen apron')
const slateApronOffered = withName(slateApron, 'Linen apron')

function returnLine(
  id: string,
  line: LineItem,
  variant: Variant,
  quantity: number,
  fields: Partial<ReturnLineItem> = {},
): ReturnLineItem {
  return {
    id,
    quantity,
    received_quantity: 0,
    resellable: true,
    pre_tax_amount: '24.00',
    included_tax_total: '0.00',
    additional_tax_total: '1.92',
    tax_total: '1.92',
    refund_amount: '25.92',
    variant_id: variant.id,
    line_item_id: line.id,
    fulfillment_item_id: `fi_3Sh5${line === mugItem ? 'Mg' : 'Ap'}`,
    variant,
    created_at: arrived,
    updated_at: arrived,
    ...fields,
  }
}

function returnRecord(
  id: string,
  number: string,
  status: Return['status'],
  fields: Partial<Return> = {},
): Return {
  return {
    id,
    number,
    status,
    order_id: shippedOrder.id,
    reason_id: damaged.id,
    refund_total: '25.92',
    refund_tax_total: '1.92',
    approved_at: null,
    received_at: null,
    refunded_at: null,
    canceled_at: null,
    reason: damaged,
    return_line_items: [returnLine('rli_2Mg4Kc7a', mugItem, mugReturned, 1)],
    external_references: {},
    memo: 'Chipped on the rim when it arrived.',
    metadata: {},
    created_at: arrived,
    updated_at: arrived,
    stock_location_id: shopLocation.id,
    created_by_id: staffActor.id,
    created_by_type: 'admin_user',
    created_by: staffActor,
    refunded_total: '0.00',
    refundable_total: '25.92',
    stock_location: shopLocation,
    documents: [],
    labels: [],
    deliveries: [],
    ...fields,
  }
}

export const requestedReturn = returnRecord('ret_2Rq5Ld8b', 'RA100201', 'requested')

export const approvedReturn = returnRecord('ret_3Ap6Me9c', 'RA100202', 'approved', {
  approved_at: arrived,
})

/** Two mugs promised back, one arrived, and that one cannot be sold again. */
export const receivedReturn = returnRecord('ret_4Rc7Nf1d', 'RA100203', 'received', {
  approved_at: arrived,
  received_at: settled,
  return_line_items: [
    returnLine('rli_4Mg6Mf9c', mugItem, mugReturned, 2, {
      received_quantity: 1,
      resellable: false,
    }),
  ],
})

export const refundedReturn = returnRecord('ret_5Rf8Og2e', 'RA100204', 'refunded', {
  approved_at: arrived,
  received_at: settled,
  refunded_at: settled,
  refunded_total: '25.92',
  refundable_total: '0.00',
  return_line_items: [
    returnLine('rli_5Mg7Ng1d', mugItem, mugReturned, 1, { received_quantity: 1 }),
  ],
})

/** A restocking fee kept back, so less went back than the return was worth. */
export const shortRefundedReturn = returnRecord('ret_6Sr9Ph3f', 'RA100205', 'refunded', {
  approved_at: arrived,
  received_at: settled,
  refunded_at: settled,
  refund_total: '41.04',
  refund_tax_total: '3.04',
  refunded_total: '35.00',
  refundable_total: '0.00',
  return_line_items: [
    returnLine('rli_6Ap8Oh2e', apronItem, oliveApronReturned, 1, {
      received_quantity: 1,
      pre_tax_amount: '38.00',
      additional_tax_total: '3.04',
      tax_total: '3.04',
      refund_amount: '41.04',
    }),
  ],
})

export const canceledReturn = returnRecord('ret_7Cn1Qi4g', 'RA100206', 'canceled', {
  canceled_at: settled,
})

/** A free gift sent back: received, owed nothing, so it is completed instead of refunded. */
export const nothingOwedReturn = returnRecord('ret_8No2Rj5h', 'RA100207', 'received', {
  approved_at: arrived,
  received_at: settled,
  refund_total: '0.00',
  refund_tax_total: '0.00',
  refundable_total: '0.00',
  return_line_items: [
    returnLine('rli_8Tt9Pi3f', toteItem, withName(mugVariant, 'Sand tote'), 1, {
      received_quantity: 1,
      pre_tax_amount: '0.00',
      additional_tax_total: '0.00',
      tax_total: '0.00',
      refund_amount: '0.00',
    }),
  ],
})

/** Two lines, received in full, with the tax the refund gives back. */
export const taxedReturn = returnRecord('ret_9Tx3Sk6i', 'RA100208', 'received', {
  approved_at: arrived,
  received_at: settled,
  refund_total: '66.96',
  refund_tax_total: '4.96',
  refundable_total: '66.96',
  return_line_items: [
    returnLine('rli_9Mg1Qj4g', mugItem, mugReturned, 1, { received_quantity: 1 }),
    returnLine('rli_9Ap2Rk5h', apronItem, oliveApronReturned, 1, {
      received_quantity: 1,
      pre_tax_amount: '38.00',
      additional_tax_total: '3.04',
      tax_total: '3.04',
      refund_amount: '41.04',
    }),
  ],
})

/** Approved, with a prepaid label for the parcel coming back and its customs form. */
export const labelledReturn = returnRecord('ret_1Lb4Tl7j', 'RA100209', 'approved', {
  approved_at: arrived,
  labels: [
    { ...purchasedLabel, id: 'lbl_7Rt1Uj5k', owner_type: 'return', owner_id: 'ret_1Lb4Tl7j' },
  ],
  documents: [customsDocuments[1]],
})

/** The location the goods go back to no longer takes returns, so the card names it. */
export const elsewhereReturn = returnRecord('ret_2El5Um8k', 'RA100210', 'requested', {
  stock_location_id: eastDepot.id,
  stock_location: eastDepot,
})

// ---------------------------------------------------------------------------
// Exchanges
// ---------------------------------------------------------------------------

function exchangeLine(fields: Partial<ExchangeLineItem> = {}): ExchangeLineItem {
  return {
    id: 'eli_2Ap6Vn9l',
    quantity: 1,
    received_quantity: 0,
    resellable: true,
    original_price: '38.00',
    new_variant_price: '38.00',
    price_difference: '0.00',
    original_tax_total: '3.04',
    new_tax_total: '3.04',
    original_variant_id: oliveApron.id,
    new_variant_id: slateApron.id,
    line_item_id: apronItem.id,
    fulfillment_item_id: 'fi_3Sh5Ap',
    original_variant: oliveApronReturned,
    new_variant: slateApronOffered,
    created_at: arrived,
    updated_at: arrived,
    ...fields,
  }
}

function exchange(
  id: string,
  number: string,
  status: Exchange['status'],
  fields: Partial<Exchange> = {},
): Exchange {
  return {
    id,
    number,
    status,
    order_id: shippedOrder.id,
    reason_id: differentItem.id,
    price_difference: '0.00',
    approved_at: null,
    received_at: null,
    fulfilled_at: null,
    canceled_at: null,
    reason: differentItem,
    exchange_line_items: [exchangeLine()],
    memo: null,
    metadata: {},
    created_at: arrived,
    updated_at: arrived,
    stock_location_id: shopLocation.id,
    created_by_id: staffActor.id,
    created_by_type: 'admin_user',
    created_by: staffActor,
    ...fields,
  }
}

export const requestedExchange = exchange('exch_2Rq7Wo1m', 'EX100201', 'requested')
export const approvedExchange = exchange('exch_3Ap8Xp2n', 'EX100202', 'approved', {
  approved_at: arrived,
})

/** The slate apron costs more, so sending it leaves the customer owing the difference. */
export const receivedExchange = exchange('exch_4Rc9Yq3o', 'EX100203', 'received', {
  approved_at: arrived,
  received_at: settled,
  price_difference: '6.00',
  exchange_line_items: [
    exchangeLine({
      received_quantity: 1,
      new_variant_price: '44.00',
      new_tax_total: '3.52',
      price_difference: '6.00',
    }),
  ],
})

/** The same exchange at no extra cost, so fulfilling it asks nothing. */
export const evenExchange = exchange('exch_5Ev1Zr4p', 'EX100204', 'received', {
  approved_at: arrived,
  received_at: settled,
  exchange_line_items: [exchangeLine({ received_quantity: 1 })],
})

export const fulfilledExchange = exchange('exch_6Fl2As5q', 'EX100205', 'fulfilled', {
  approved_at: arrived,
  received_at: settled,
  fulfilled_at: settled,
  price_difference: '6.00',
  exchange_line_items: [
    exchangeLine({
      received_quantity: 1,
      new_variant_price: '44.00',
      price_difference: '6.00',
    }),
  ],
})

export const canceledExchange = exchange('exch_7Cn3Bt6r', 'EX100206', 'canceled', {
  canceled_at: settled,
})

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

function claimLine(fields: Partial<ClaimLineItem> = {}): ClaimLineItem {
  return {
    id: 'cli_2Mg8Cu7s',
    quantity: 1,
    send_replacement: false,
    description: null,
    refund_amount: '25.92',
    paid_amount: '25.92',
    pre_tax_amount: '24.00',
    included_tax_total: '0.00',
    additional_tax_total: '1.92',
    tax_total: '1.92',
    variant_id: mugVariant.id,
    replacement_variant_id: null,
    line_item_id: mugItem.id,
    variant: mugReturned,
    created_at: arrived,
    updated_at: arrived,
    ...fields,
  }
}

function claim(
  id: string,
  number: string,
  status: Claim['status'],
  fields: Partial<Claim> = {},
): Claim {
  return {
    id,
    number,
    status,
    resolution: null,
    order_id: shippedOrder.id,
    reason_id: arrivedDamaged.id,
    refund_total: '25.92',
    approved_at: null,
    resolved_at: null,
    denied_at: null,
    canceled_at: null,
    reason: arrivedDamaged,
    claim_line_items: [claimLine({ description: 'Handle snapped off in the box' })],
    memo: 'Photos sent by email.',
    metadata: {},
    created_at: arrived,
    updated_at: arrived,
    created_by_id: staffActor.id,
    created_by_type: 'admin_user',
    created_by: staffActor,
    ...fields,
  }
}

export const openClaim = claim('claim_2Op9Dv8t', 'CL100201', 'open')
export const approvedClaim = claim('claim_3Ap1Ew9u', 'CL100202', 'approved', {
  approved_at: arrived,
})

/** Opened with no amount, so resolving it offers what the customer paid. */
export const unpricedClaim = claim('claim_4Up2Fx1v', 'CL100203', 'approved', {
  approved_at: arrived,
  refund_total: '0.00',
  claim_line_items: [claimLine({ refund_amount: '0.00' })],
})

/** Opened asking for a replacement, which the resolve dialog turns on for it. */
export const replacementClaim = claim('claim_5Rp3Gy2w', 'CL100204', 'approved', {
  approved_at: arrived,
  claim_line_items: [claimLine({ send_replacement: true })],
})

/** Settled for less than it asked: the card still shows what it asked. */
export const resolvedRefundClaim = claim('claim_6Rf4Hz3x', 'CL100205', 'resolved', {
  approved_at: arrived,
  resolved_at: settled,
  resolution: 'refund',
})

export const resolvedReplacementClaim = claim('claim_7Rs5Ia4y', 'CL100206', 'resolved', {
  approved_at: arrived,
  resolved_at: settled,
  resolution: 'replacement',
  claim_line_items: [claimLine({ send_replacement: true })],
})

export const deniedClaim = claim('claim_8Dn6Jb5z', 'CL100207', 'denied', {
  reason_id: neverArrived.id,
  reason: neverArrived,
  denied_at: settled,
  claim_line_items: [claimLine()],
})

export const canceledClaim = claim('claim_9Cn7Kc6a', 'CL100208', 'canceled', {
  canceled_at: settled,
})

/** Two lines at once, one of them the apron, so the resolve dialog lists both. */
export const twoLineClaim = claim('claim_1Tw8Ld7b', 'CL100209', 'approved', {
  approved_at: arrived,
  refund_total: '66.96',
  claim_line_items: [
    claimLine({ send_replacement: true }),
    claimLine({
      id: 'cli_3Ap9Dv8t',
      variant_id: oliveApron.id,
      variant: oliveApronReturned,
      line_item_id: apronItem.id,
      refund_amount: '41.04',
      paid_amount: '41.04',
      pre_tax_amount: '38.00',
      additional_tax_total: '3.04',
      tax_total: '3.04',
    }),
  ],
})
