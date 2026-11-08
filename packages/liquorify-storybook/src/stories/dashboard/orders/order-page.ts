import type { Order, PermissionRule } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { paidOrder } from '../../../fixtures/admin/orders'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  type AfterSaleRecords,
  afterSaleRequests,
  fulfillmentRequests,
} from '../../../mocks/handlers/admin/after-sale'
import { type OrderLines, orderPageRequests } from '../../../mocks/handlers/admin/orders'

const store = shellStore.id

/** The order screens, by the dashboard's route ids, at an address in the sample store. */
export const orderRoutes = {
  orders: { pattern: '/_authenticated/$storeId/orders/', path: `/${store}/orders` },
  drafts: { pattern: '/_authenticated/$storeId/orders/drafts', path: `/${store}/orders/drafts` },
  newOrder: { pattern: '/_authenticated/$storeId/orders/new', path: `/${store}/orders/new` },
  order: (order: Order = paidOrder): StoryRoute => ({
    pattern: '/_authenticated/$storeId/orders/$orderId/',
    path: `/${store}/orders/${order.id}`,
  }),
  editOrder: (order: Order = paidOrder): StoryRoute => ({
    pattern: '/_authenticated/$storeId/orders/$orderId/edit',
    path: `/${store}/orders/${order.id}/edit`,
  }),
} as const

interface OrderOptions {
  order?: Order
  route?: StoryRoute
  rules?: PermissionRule[]
  column?: Column
  /** A sheet, dialog or menu is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** The order's tax lines, discounts and fees, by order. */
  lines?: Record<string, OrderLines>
  /** Answers before the store's records, for a held or refused request. */
  first?: HttpHandler[]
  /** The order's returns, exchanges and claims, by order. */
  afterSale?: Record<string, AfterSaleRecords>
}

/**
 * A signed-in admin on an order's page, with every record its cards read:
 * the order, its fulfilments' carriers, locations and stock, and its returns,
 * exchanges and claims.
 */
export function orderParameters({
  order = paidOrder,
  route,
  rules,
  column,
  viewport = false,
  lines,
  first = [],
  afterSale = {},
}: OrderOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      route: route ?? orderRoutes.order(order),
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    // `first` leads, so its answers win over the order's own.
    msw: {
      handlers: {
        first,
        ...base.msw.handlers,
        orders: [
          ...orderPageRequests([order], lines),
          ...fulfillmentRequests([order]),
          ...afterSaleRequests(afterSale),
        ],
      },
    },
  }
}
