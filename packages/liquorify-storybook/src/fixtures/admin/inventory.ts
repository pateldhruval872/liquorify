import type {
  PermissionRule,
  PurchaseOrder,
  PurchaseOrderItem,
  StockLevel,
  StockReceipt,
  StockReceiptItem,
  StockTransfer,
  StockTransferItem,
  Supplier,
  Variant,
} from '@spree/admin-sdk'
import { clayMug, linenApron, sandTote, slateCap } from './catalog'
import { stockLocations } from './settings'
import { productSubjects, read, shellRules, stockSubjects, write } from './shell'

/**
 * Batch 6's inventory: the stock the sample store's three locations hold, the
 * transfers between them, the suppliers it buys from and its purchase orders,
 * one for each status the two documents can reach, with the deliveries booked
 * against them. Every name, reference and address is invented. Dates sit
 * around the frozen clock, 1 October 2026 (`../clock.ts`).
 */

const created = '2026-09-10T09:00:00.000Z'
const updated = '2026-09-28T15:30:00.000Z'

const [shop, depot, counter] = stockLocations

// ---------------------------------------------------------------------------
// The variants the documents carry
// ---------------------------------------------------------------------------

interface LineVariant {
  id: string
  product_id: string
  name: string
  sku: string
  options_text: string | null
  thumbnail_url: string | null
}

function lineVariant(variant: Variant, name: string, thumbnail: string | null): LineVariant {
  return {
    id: variant.id,
    product_id: variant.product_id as string,
    name,
    sku: variant.sku as string,
    options_text: variant.options_text || null,
    thumbnail_url: thumbnail,
  }
}

const apronVariants = linenApron.variants as Variant[]

export const mugLine = lineVariant(
  clayMug.default_variant as Variant,
  'Clay mug',
  '/fixtures/product-clay.png',
)
export const oliveApronLine = lineVariant(
  apronVariants[0],
  'Linen apron',
  '/fixtures/product-olive.png',
)
export const slateApronLine = lineVariant(
  apronVariants[3],
  'Linen apron',
  '/fixtures/product-slate.png',
)
export const capLine = lineVariant(
  slateCap.default_variant as Variant,
  'Slate cap',
  '/fixtures/product-slate.png',
)
export const toteLine = lineVariant(sandTote.default_variant as Variant, 'Sand tote', null)

/** A line whose variant was deleted after the document was raised: no product to link to. */
export const discontinuedLine: LineVariant = {
  id: 'variant_0Xd3Ns8q',
  product_id: '',
  name: 'Speckled bowl',
  sku: 'BOWL-SPECK',
  options_text: null,
  thumbnail_url: null,
}

// ---------------------------------------------------------------------------
// Stock levels, as the Inventory list and a location's panel read them
// ---------------------------------------------------------------------------

function level(
  id: string,
  line: LineVariant,
  locationIndex: number,
  counts: Partial<
    Pick<
      StockLevel,
      'count_on_hand' | 'allocated_count' | 'reserved_count' | 'incoming_count' | 'backorderable'
    >
  >,
): StockLevel {
  const location = stockLocations[locationIndex]
  const onHand = counts.count_on_hand ?? 0
  const allocated = counts.allocated_count ?? 0
  const reserved = counts.reserved_count ?? 0
  return {
    id,
    count_on_hand: onHand,
    backorderable: counts.backorderable ?? false,
    stock_location_id: location.id,
    variant_id: line.id,
    external_references: {},
    metadata: {},
    reserved_count: reserved,
    incoming_count: counts.incoming_count ?? 0,
    purchasable_count: onHand - allocated - reserved,
    variant_name: line.name,
    variant_sku: line.sku,
    created_at: created,
    updated_at: updated,
    stock_location_name: location.name,
    product_id: line.product_id,
    options_text: line.options_text,
    thumbnail_url: line.thumbnail_url,
    allocated_count: allocated,
    available_count: onHand - allocated - reserved,
  }
}

/**
 * Every figure the Inventory list shows: stock committed to orders, held by
 * checkouts, on its way from a transfer or a supplier, low, out and
 * backorderable.
 */
export const stockLevels: StockLevel[] = [
  level('sl_9Iv1Mg0a', mugLine, 0, { count_on_hand: 24, allocated_count: 2, reserved_count: 1 }),
  level('sl_9Iv1Mg0b', mugLine, 1, { count_on_hand: 6, incoming_count: 12 }),
  level('sl_9Iv1Ap0a', oliveApronLine, 0, { count_on_hand: 8, reserved_count: 3 }),
  level('sl_9Iv1Ap0b', oliveApronLine, 1, { count_on_hand: 2, incoming_count: 6 }),
  level('sl_9Iv1Ap3a', slateApronLine, 0, { count_on_hand: 3, allocated_count: 1 }),
  level('sl_9Iv1Cp0a', capLine, 0, { count_on_hand: 0, incoming_count: 20 }),
  level('sl_9Iv1Tt0a', toteLine, 0, { count_on_hand: 0, backorderable: true }),
  level('sl_9Iv1Tt0c', toteLine, 2, { count_on_hand: 2 }),
]

/** The shop's own levels, as its location's sheet lists them. */
export const shopStockLevels = stockLevels.filter((each) => each.stock_location_id === shop.id)

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

function supplier(id: string, name: string, fields: Partial<Supplier> = {}): Supplier {
  return {
    id,
    name,
    contact_name: null,
    email: null,
    phone: null,
    notes: null,
    address1: null,
    address2: null,
    city: null,
    state_name: null,
    state_code: null,
    country_code: null,
    postal_code: null,
    purchase_orders_count: 0,
    metadata: {},
    created_at: created,
    updated_at: updated,
    deleted_at: null,
    can_be_deleted: true,
    ...fields,
  }
}

/** A potter the shop has ordered from, so it cannot be deleted. */
export const kilnworks = supplier('supp_4Kw7Ln2a', 'Kilnworks Pottery', {
  contact_name: 'Maren Holt',
  email: 'orders@kilnworks.example',
  phone: '+1 503 555 0172',
  address1: '88 Foundry Lane',
  city: 'Portland',
  state_name: 'Oregon',
  state_code: 'OR',
  country_code: 'US',
  postal_code: '97209',
  notes: 'Ships Tuesdays. Glaze batches vary slightly.',
  purchase_orders_count: 6,
  can_be_deleted: false,
})

/** A weaver with an order history too. */
export const flaxAndLoom = supplier('supp_6Fl3Mo8b', 'Flax & Loom', {
  contact_name: 'Ines Duarte',
  email: 'hello@flaxandloom.example',
  country_code: 'PT',
  city: 'Porto',
  purchase_orders_count: 2,
  can_be_deleted: false,
})

/** Added but never ordered from: the one that can be deleted. */
export const harborCanvas = supplier('supp_2Hc9Pq5c', 'Harbor Canvas Co.', {
  email: 'sales@harborcanvas.example',
})

export const suppliers: Supplier[] = [kilnworks, flaxAndLoom, harborCanvas]

// ---------------------------------------------------------------------------
// Deliveries, booked as stock receipts
// ---------------------------------------------------------------------------

function receiptItem(
  id: string,
  line: LineVariant,
  lineType: StockReceiptItem['line_type'],
  lineId: string,
  accepted: number,
  rejected = 0,
  reason: StockReceiptItem['rejection_reason'] = null,
): StockReceiptItem {
  return {
    id,
    quantity_accepted: accepted,
    quantity_rejected: rejected,
    rejection_reason: rejected > 0 ? reason : null,
    notes: null,
    line_type: lineType,
    line_id: lineId,
    variant_id: line.id,
    product_id: line.product_id || null,
    variant_name: line.name,
    variant_sku: line.sku,
    thumbnail_url: line.thumbnail_url,
  }
}

function receipt(
  id: string,
  number: string,
  receivable: { type: StockReceipt['receivable_type']; id: string },
  receivedAt: string,
  items: StockReceiptItem[],
  fields: Partial<StockReceipt> = {},
): StockReceipt {
  return {
    id,
    number,
    reference: null,
    notes: null,
    metadata: {},
    quantity_accepted_total: items.reduce((sum, item) => sum + item.quantity_accepted, 0),
    quantity_rejected_total: items.reduce((sum, item) => sum + item.quantity_rejected, 0),
    received_at: receivedAt,
    created_at: receivedAt,
    updated_at: receivedAt,
    receivable_type: receivable.type,
    receivable_id: receivable.id,
    received_by_id: 'admin_7xQ2pL9m',
    received_by_type: 'admin_user',
    received_by: { id: 'admin_7xQ2pL9m', type: 'admin_user', label: 'Alex Morgan' },
    items_count: items.length,
    items,
    ...fields,
  }
}

// ---------------------------------------------------------------------------
// Stock transfers
// ---------------------------------------------------------------------------

interface TransferLineSpec {
  line: LineVariant
  shipped: number
  received?: number
  rejected?: number
}

function transferItem(
  transferId: string,
  index: number,
  spec: TransferLineSpec,
): StockTransferItem {
  const received = spec.received ?? 0
  const rejected = spec.rejected ?? 0
  return {
    id: `${transferId.replace('xfer_', 'xferi_')}${index}`,
    quantity_shipped: spec.shipped,
    quantity_received: received,
    quantity_rejected: rejected,
    quantity_over: Math.max(received + rejected - spec.shipped, 0),
    outstanding: Math.max(spec.shipped - received - rejected, 0),
    created_at: created,
    updated_at: updated,
    stock_transfer_id: transferId,
    variant_id: spec.line.id,
    product_id: spec.line.product_id || null,
    variant_name: spec.line.name,
    variant_sku: spec.line.sku,
    options_text: spec.line.options_text,
    thumbnail_url: spec.line.thumbnail_url,
  }
}

function transfer(
  id: string,
  number: string,
  status: string,
  lines: TransferLineSpec[],
  fields: Partial<StockTransfer> = {},
): StockTransfer {
  const items = lines.map((spec, index) => transferItem(id, index, spec))
  const shipped = !['draft', 'ready_to_ship'].includes(status)
  return {
    id,
    number,
    reference: null,
    created_at: created,
    updated_at: updated,
    source_location_id: shop.id,
    destination_location_id: depot.id,
    status,
    notes: null,
    metadata: {},
    close_reason: null,
    items_count: items.length,
    quantity_received_total: items.reduce((sum, item) => sum + item.quantity_received, 0),
    quantity_rejected_total: items.reduce((sum, item) => sum + item.quantity_rejected, 0),
    shipped_at: shipped ? '2026-09-24T10:00:00.000Z' : null,
    received_at: null,
    closed_short_at: null,
    deleted_at: null,
    closed_short: false,
    quantity_shipped_total: items.reduce((sum, item) => sum + item.quantity_shipped, 0),
    editable: !shipped && status !== 'canceled',
    items,
    stock_receipts: [],
    source_location: shop,
    destination_location: depot,
    ...fields,
  }
}

const draftLines: TransferLineSpec[] = [
  { line: mugLine, shipped: 12 },
  { line: oliveApronLine, shipped: 6 },
]

export const draftTransfer = transfer('xfer_1Dr4Ft7a', 'T100021', 'draft', draftLines, {
  reference: 'Restock the depot',
  notes: 'Pack the mugs in the double-walled cartons.',
})

export const readyTransfer = transfer('xfer_2Rd5Gu8b', 'T100020', 'ready_to_ship', draftLines, {
  reference: 'Restock the depot',
})

export const inTransitTransfer = transfer('xfer_3It6Hv9c', 'T100019', 'in_transit', draftLines, {
  reference: 'Weekly depot run',
})

const partialReceipt = receipt(
  'srcpt_4Pa7Iw0d',
  'R200031',
  { type: 'stock_transfer', id: 'xfer_4Pa7Iw0d' },
  '2026-09-27T14:10:00.000Z',
  [
    receiptItem(
      'srcpti_4Pa7Iw0a',
      mugLine,
      'stock_transfer_item',
      'xferi_4Pa7Iw0d0',
      8,
      1,
      'damaged',
    ),
    receiptItem('srcpti_4Pa7Iw0b', oliveApronLine, 'stock_transfer_item', 'xferi_4Pa7Iw0d1', 6),
  ],
  { reference: 'Van 2, first drop', notes: 'One mug chipped in the crate.' },
)

export const partiallyReceivedTransfer = transfer(
  'xfer_4Pa7Iw0d',
  'T100018',
  'partially_received',
  [
    { line: mugLine, shipped: 12, received: 8, rejected: 1 },
    { line: oliveApronLine, shipped: 6, received: 6 },
  ],
  { reference: 'Weekly depot run', stock_receipts: [partialReceipt] },
)

const secondDelivery = receipt(
  'srcpt_5Rc8Jx1e',
  'R200029',
  { type: 'stock_transfer', id: 'xfer_5Rc8Jx1e' },
  '2026-09-22T16:45:00.000Z',
  [receiptItem('srcpti_5Rc8Jx1b', slateApronLine, 'stock_transfer_item', 'xferi_5Rc8Jx1e1', 4)],
  { reference: 'Van 1, second drop' },
)

const firstDelivery = receipt(
  'srcpt_5Rc8Jx1f',
  'R200028',
  { type: 'stock_transfer', id: 'xfer_5Rc8Jx1e' },
  '2026-09-21T09:20:00.000Z',
  [
    receiptItem('srcpti_5Rc8Jx1a', toteLine, 'stock_transfer_item', 'xferi_5Rc8Jx1e0', 2),
    receiptItem('srcpti_5Rc8Jx1c', slateApronLine, 'stock_transfer_item', 'xferi_5Rc8Jx1e1', 2),
  ],
  { reference: 'Van 1, first drop' },
)

export const receivedTransfer = transfer(
  'xfer_5Rc8Jx1e',
  'T100017',
  'received',
  [
    { line: toteLine, shipped: 2, received: 2 },
    { line: slateApronLine, shipped: 6, received: 6 },
  ],
  {
    source_location: counter,
    source_location_id: counter.id,
    received_at: '2026-09-22T16:45:00.000Z',
    stock_receipts: [secondDelivery, firstDelivery],
  },
)

export const overReceivedTransfer = transfer(
  'xfer_6Ov9Ky2f',
  'T100016',
  'over_received',
  [{ line: capLine, shipped: 10, received: 11 }],
  {
    received_at: '2026-09-19T11:00:00.000Z',
    stock_receipts: [
      receipt(
        'srcpt_6Ov9Ky2f',
        'R200027',
        { type: 'stock_transfer', id: 'xfer_6Ov9Ky2f' },
        '2026-09-19T11:00:00.000Z',
        [receiptItem('srcpti_6Ov9Ky2a', capLine, 'stock_transfer_item', 'xferi_6Ov9Ky2f0', 11)],
      ),
    ],
  },
)

export const closedShortTransfer = transfer(
  'xfer_7Cs0Lz3g',
  'T100015',
  'received',
  [
    { line: mugLine, shipped: 10, received: 7 },
    { line: discontinuedLine, shipped: 4, received: 4 },
  ],
  {
    closed_short: true,
    closed_short_at: '2026-09-18T17:00:00.000Z',
    close_reason: 'Three mugs lost in transit; the carrier has the claim.',
    received_at: '2026-09-18T17:00:00.000Z',
  },
)

export const canceledTransfer = transfer('xfer_8Cn1Ma4h', 'T100014', 'canceled', draftLines, {
  reference: 'Superseded by T100019',
})

export const stockTransfers: StockTransfer[] = [
  draftTransfer,
  readyTransfer,
  inTransitTransfer,
  partiallyReceivedTransfer,
  receivedTransfer,
  overReceivedTransfer,
  closedShortTransfer,
  canceledTransfer,
]

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

/** A canonical amount ("6.50") in cents, and back, so no total is worked out in floating point. */
const cents = (amount: string) => {
  const [whole, fraction = ''] = amount.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
}
const amount = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, '0')}`

interface OrderLineSpec {
  line: LineVariant
  ordered: number
  cost: string
  received?: number
  rejected?: number
}

function orderItem(orderId: string, index: number, spec: OrderLineSpec): PurchaseOrderItem {
  const received = spec.received ?? 0
  const rejected = spec.rejected ?? 0
  return {
    id: `${orderId.replace('po_', 'poi_')}${index}`,
    quantity_ordered: spec.ordered,
    quantity_received: received,
    quantity_rejected: rejected,
    quantity_over: Math.max(received + rejected - spec.ordered, 0),
    outstanding: Math.max(spec.ordered - received - rejected, 0),
    currency: 'USD',
    created_at: created,
    updated_at: updated,
    unit_cost: spec.cost,
    total_cost: amount(cents(spec.cost) * BigInt(spec.ordered)),
    purchase_order_id: orderId,
    variant_id: spec.line.id,
    product_id: spec.line.product_id || null,
    variant_name: spec.line.name,
    variant_sku: spec.line.sku,
    options_text: spec.line.options_text,
    thumbnail_url: spec.line.thumbnail_url,
  }
}

function purchaseOrder(
  id: string,
  number: string,
  status: string,
  lines: OrderLineSpec[],
  fields: Partial<PurchaseOrder> = {},
): PurchaseOrder {
  const items = lines.map((spec, index) => orderItem(id, index, spec))
  const placed = status !== 'draft'
  const subtotal = amount(items.reduce((sum, item) => sum + cents(item.total_cost), 0n))
  return {
    id,
    number,
    status,
    currency: 'USD',
    reference: null,
    notes: null,
    metadata: {},
    close_reason: null,
    items_count: items.length,
    quantity_received_total: items.reduce((sum, item) => sum + item.quantity_received, 0),
    quantity_rejected_total: items.reduce((sum, item) => sum + item.quantity_rejected, 0),
    ordered_at: placed && status !== 'canceled' ? '2026-09-15T10:00:00.000Z' : null,
    received_at: null,
    closed_short_at: null,
    created_at: created,
    updated_at: updated,
    expected_at: '2026-10-08',
    cancel_by: '2026-10-20',
    closed_short: false,
    quantity_ordered_total: items.reduce((sum, item) => sum + item.quantity_ordered, 0),
    editable: !placed,
    subtotal,
    supplier_id: kilnworks.id,
    destination_location_id: shop.id,
    items,
    stock_receipts: [],
    supplier: kilnworks,
    destination_location: shop,
    ...fields,
  }
}

const mugOrder: OrderLineSpec[] = [
  { line: mugLine, ordered: 24, cost: '6.50' },
  { line: capLine, ordered: 20, cost: '9.25' },
]

export const draftOrder = purchaseOrder('po_1Dq2Rs3a', 'PO300012', 'draft', mugOrder, {
  reference: 'Autumn restock',
  notes: 'Ask about the new speckled glaze.',
})

export const placedOrder = purchaseOrder('po_2Pl3St4b', 'PO300011', 'ordered', mugOrder, {
  reference: 'KW-88412',
})

/** Placed, expected last week and still not here: overdue, and past its cancel-by date too. */
export const lateOrder = purchaseOrder(
  'po_3Lt4Tu5c',
  'PO300010',
  'ordered',
  [{ line: oliveApronLine, ordered: 30, cost: '14.00' }],
  {
    supplier: flaxAndLoom,
    supplier_id: flaxAndLoom.id,
    reference: 'FL-2026-117',
    expected_at: '2026-09-24',
    cancel_by: '2026-09-29',
    ordered_at: '2026-09-01T10:00:00.000Z',
  },
)

const partialOrderReceipt = receipt(
  'srcpt_4Po5Uv6d',
  'R200030',
  { type: 'purchase_order', id: 'po_4Pr5Uv6d' },
  '2026-09-26T13:30:00.000Z',
  [
    receiptItem(
      'srcpti_4Po5Uv6a',
      mugLine,
      'purchase_order_item',
      'poi_4Pr5Uv6d0',
      12,
      2,
      'damaged',
    ),
  ],
  { reference: 'Packing slip 5531' },
)

export const partiallyReceivedOrder = purchaseOrder(
  'po_4Pr5Uv6d',
  'PO300009',
  'partially_received',
  [
    { line: mugLine, ordered: 24, cost: '6.50', received: 12, rejected: 2 },
    { line: capLine, ordered: 20, cost: '9.25' },
  ],
  { reference: 'KW-88390', stock_receipts: [partialOrderReceipt] },
)

export const receivedOrder = purchaseOrder(
  'po_5Rv6Vw7e',
  'PO300008',
  'received',
  [{ line: toteLine, ordered: 10, cost: '11.00', received: 10 }],
  {
    supplier: harborCanvas,
    supplier_id: harborCanvas.id,
    received_at: '2026-09-12T09:00:00.000Z',
    stock_receipts: [
      receipt(
        'srcpt_5Rv6Vw7e',
        'R200026',
        { type: 'purchase_order', id: 'po_5Rv6Vw7e' },
        '2026-09-12T09:00:00.000Z',
        [receiptItem('srcpti_5Rv6Vw7a', toteLine, 'purchase_order_item', 'poi_5Rv6Vw7e0', 10)],
      ),
    ],
  },
)

export const overReceivedOrder = purchaseOrder(
  'po_6Ov7Wx8f',
  'PO300007',
  'over_received',
  [{ line: slateApronLine, ordered: 12, cost: '15.50', received: 14 }],
  {
    supplier: flaxAndLoom,
    supplier_id: flaxAndLoom.id,
    received_at: '2026-09-08T09:00:00.000Z',
  },
)

export const closedShortOrder = purchaseOrder(
  'po_7Cs8Xy9g',
  'PO300006',
  'received',
  [
    { line: mugLine, ordered: 24, cost: '6.50', received: 18 },
    { line: discontinuedLine, ordered: 6, cost: '12.00', received: 6 },
  ],
  {
    closed_short: true,
    closed_short_at: '2026-09-05T16:00:00.000Z',
    close_reason: 'Kiln failure; the last six mugs will not be made.',
    received_at: '2026-09-05T16:00:00.000Z',
  },
)

export const canceledOrder = purchaseOrder('po_8Cn9Yz0h', 'PO300005', 'canceled', mugOrder, {
  reference: 'Duplicate of PO300011',
})

export const purchaseOrders: PurchaseOrder[] = [
  draftOrder,
  placedOrder,
  lateOrder,
  partiallyReceivedOrder,
  receivedOrder,
  overReceivedOrder,
  closedShortOrder,
  canceledOrder,
]

/** Every delivery booked, newest first, as a document's receipts card lists them. */
export const stockReceipts: StockReceipt[] = [
  partialReceipt,
  partialOrderReceipt,
  secondDelivery,
  firstDelivery,
]

// ---------------------------------------------------------------------------
// What the line picker offers
// ---------------------------------------------------------------------------

const withThumbnail = (variant: Variant, line: LineVariant): Variant => ({
  ...variant,
  product_name: line.name,
  thumbnail_url: line.thumbnail_url,
})

/** The variants the transfer and purchase order line picker lists, with their pictures. */
export const pickerVariants: Variant[] = [
  withThumbnail(clayMug.default_variant as Variant, mugLine),
  withThumbnail(apronVariants[0], oliveApronLine),
  withThumbnail(apronVariants[3], slateApronLine),
  withThumbnail(slateCap.default_variant as Variant, capLine),
  withThumbnail(sandTote.default_variant as Variant, toteLine),
]

// ---------------------------------------------------------------------------
// The custom roles the batch's permission variants use
// ---------------------------------------------------------------------------

/** Spree's `purchasing` scope: suppliers, purchase orders and the deliveries booked against them. */
const purchasingSubjects = [
  'supplier',
  'purchase_order',
  'purchase_order_item',
  'stock_receipt',
  'stock_receipt_item',
]

/** A role reading stock, purchasing and products, and writing nothing. */
export const stockViewerRules: PermissionRule[] = [
  ...shellRules,
  ...read([...productSubjects, ...stockSubjects, ...purchasingSubjects]),
]

/** A role writing purchasing, and reading stock and products. */
export const purchaserRules: PermissionRule[] = [
  ...shellRules,
  ...read([...productSubjects, ...stockSubjects]),
  ...write(purchasingSubjects),
]
