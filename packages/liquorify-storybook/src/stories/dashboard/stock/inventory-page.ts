import type { PermissionRule } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { draftTransfer, placedOrder } from '../../../fixtures/admin/inventory'
import { shellStore } from '../../../fixtures/admin/shell'
import { inventoryRequests } from '../../../mocks/handlers/admin/inventory'

const store = shellStore.id

/** The inventory screens, by the dashboard's route ids, at an address in the sample store. */
export const inventoryRoutes = {
  inventory: { pattern: '/_authenticated/$storeId/inventory', path: `/${store}/inventory` },
  newTransfer: {
    pattern: '/_authenticated/$storeId/transfers/new',
    path: `/${store}/transfers/new`,
  },
  transfer: {
    pattern: '/_authenticated/$storeId/transfers/$transferId',
    path: `/${store}/transfers/${draftTransfer.id}`,
  },
  newPurchaseOrder: {
    pattern: '/_authenticated/$storeId/purchase-orders/new',
    path: `/${store}/purchase-orders/new`,
  },
  purchaseOrder: {
    pattern: '/_authenticated/$storeId/purchase-orders/$purchaseOrderId',
    path: `/${store}/purchase-orders/${placedOrder.id}`,
  },
  suppliers: { pattern: '/_authenticated/$storeId/suppliers', path: `/${store}/suppliers` },
} satisfies Record<string, StoryRoute>

interface InventoryOptions {
  route?: StoryRoute
  rules?: PermissionRule[]
  column?: Column
  /** A sheet, dialog or popover is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the store's records, for a held or refused request. */
  first?: HttpHandler[]
}

/** A signed-in admin on an inventory screen, with every record the components read. */
export function inventoryParameters({
  route = inventoryRoutes.inventory,
  rules,
  column,
  viewport = false,
  first = [],
}: InventoryOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      route,
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    // `first` leads, so the key keeps its place when a story's handlers
    // are merged over the meta's, and its answers win.
    msw: { handlers: { first, ...base.msw.handlers, ...inventoryRequests() } },
  }
}
