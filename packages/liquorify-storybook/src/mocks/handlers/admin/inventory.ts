import type {
  PurchaseOrder,
  StockLevel,
  StockLocation,
  StockTransfer,
  Supplier,
  Variant,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import {
  pickerVariants,
  purchaseOrders,
  stockLevels,
  stockTransfers,
  suppliers,
} from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { stockMovementList } from './catalog'
import { countries } from './countries'
import { marketCountries } from './delivery'
import { paged } from './merchandising'
import { recordRequests } from './records'

const admin = '/api/v3/admin'

/** The value of the first query parameter whose name holds `key`, such as a Ransack predicate. */
function filter(request: Request, key: string) {
  for (const [name, value] of new URL(request.url).searchParams) {
    if (name.includes(key)) return value
  }
  return null
}

const matches = (query: string, ...values: (string | null | undefined)[]) =>
  values.some((value) => value?.toLowerCase().includes(query.toLowerCase()))

/**
 * Stock levels as the Inventory list and a location's panel read them, by
 * location and by a search on the SKU or product name, and a change to one
 * that succeeds: a count set, a count moved by a delta, or backorders turned
 * on or off.
 */
export function stockLevelRequests(records: StockLevel[] = stockLevels) {
  return [
    http.get(`${admin}/stock_levels`, ({ request }) => {
      const location = filter(request, 'stock_location_id_eq')
      const query = filter(request, '_cont')
      const listed = records.filter(
        (level) =>
          (!location || level.stock_location_id === location) &&
          (!query || matches(query, level.variant_sku, level.variant_name)),
      )
      return HttpResponse.json(paged(listed, request))
    }),
    http.patch(`${admin}/stock_levels/:id`, async ({ params, request }) => {
      const level = records.find((each) => each.id === params.id) ?? records[0]
      const change = (await request.json()) as {
        count_on_hand?: number
        adjustment?: number
        backorderable?: boolean
      }
      const onHand = change.count_on_hand ?? level.count_on_hand + (change.adjustment ?? 0)
      return HttpResponse.json({
        ...level,
        count_on_hand: onHand,
        backorderable: change.backorderable ?? level.backorderable,
      })
    }),
  ]
}

/** The store's stock locations: listed, one opened, added, changed and deleted. */
export function stockLocationRequests(records: StockLocation[] = stockLocations) {
  return recordRequests('stock_locations', records)
}

/**
 * The store's suppliers: listed, searched by name, contact or email as the
 * purchase order's supplier field searches them, one opened, added, changed
 * and deleted.
 */
export function supplierRequests(records: Supplier[] = suppliers) {
  return [
    http.get(`${admin}/suppliers`, ({ request }) => {
      const ids = filter(request, 'id_in')
      const query = filter(request, '_cont')
      const listed = records.filter(
        (supplier) =>
          (!ids || ids.split(',').includes(supplier.id)) &&
          (!query || matches(query, supplier.name, supplier.contact_name, supplier.email)),
      )
      return HttpResponse.json(onePage(listed))
    }),
    ...recordRequests('suppliers', records).slice(1),
  ]
}

/** The variants the line picker searches, by product name or SKU. */
export function variantList(records: Variant[] = pickerVariants) {
  return [
    http.get(`${admin}/variants`, ({ request }) => {
      const query = new URL(request.url).searchParams.get('q[search]')
      const listed = query
        ? records.filter((variant) => matches(query, variant.product_name, variant.sku))
        : records
      return HttpResponse.json(paged(listed, request))
    }),
  ]
}

/**
 * The store's stock transfers, each with the deliveries booked against it,
 * and a cancellation that succeeds.
 */
export function stockTransferRequests(records: StockTransfer[] = stockTransfers) {
  return [
    ...recordRequests('stock_transfers', records),
    http.get(`${admin}/stock_transfers/:id/stock_receipts`, ({ params }) => {
      const transfer = records.find((each) => each.id === params.id)
      return HttpResponse.json(onePage(transfer?.stock_receipts ?? []))
    }),
    http.patch(`${admin}/stock_transfers/:id/cancel`, ({ params }) => {
      const transfer = records.find((each) => each.id === params.id) ?? records[0]
      return HttpResponse.json({ ...transfer, status: 'canceled', editable: false })
    }),
  ]
}

/** The store's purchase orders, each with the deliveries booked against it. */
export function purchaseOrderRequests(records: PurchaseOrder[] = purchaseOrders) {
  return [
    ...recordRequests('purchase_orders', records),
    http.get(`${admin}/purchase_orders/:id/stock_receipts`, ({ params }) => {
      const order = records.find((each) => each.id === params.id)
      return HttpResponse.json(onePage(order?.stock_receipts ?? []))
    }),
  ]
}

/** A document's deliveries never answer. */
export function receiptsHeld(path: 'stock_transfers' | 'purchase_orders') {
  return [
    http.get(`${admin}/${path}/:id/stock_receipts`, async () => {
      await delay('infinite')
    }),
  ]
}

/** A document's deliveries fail to load. */
export function receiptsFailed(path: 'stock_transfers' | 'purchase_orders') {
  return [
    http.get(`${admin}/${path}/:id/stock_receipts`, () => new HttpResponse(null, { status: 500 })),
  ]
}

/** A transfer's cancellation never answers, so the dialog stays pending. */
export const transferCancelHeld = [
  http.patch(`${admin}/stock_transfers/:id/cancel`, async () => {
    await delay('infinite')
  }),
]

/** The location a sheet opens never answers, so the sheet stays loading. */
export const stockLocationHeld = [
  http.get(`${admin}/stock_locations/:id`, async () => {
    await delay('infinite')
  }),
]

/** Every request the inventory components make, answered from the fixtures. */
export function inventoryRequests() {
  return {
    stockLevels: stockLevelRequests(),
    stockLocations: stockLocationRequests(),
    suppliers: supplierRequests(),
    variants: variantList(),
    stockTransfers: stockTransferRequests(),
    purchaseOrders: purchaseOrderRequests(),
    stockMovements: stockMovementList(),
    countries,
    countryStates: marketCountries(),
  }
}
