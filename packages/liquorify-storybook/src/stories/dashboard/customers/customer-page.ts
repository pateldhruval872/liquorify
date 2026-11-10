import type { Customer, PermissionRule } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { regularCustomer } from '../../../fixtures/admin/customers'
import { shellStore } from '../../../fixtures/admin/shell'
import { customerRequests, taxIdentifierRequests } from '../../../mocks/handlers/admin/customers'
import { customerCreditRequests } from '../../../mocks/handlers/admin/loyalty'

/** A customer's page, by the dashboard's route id, at an address in the sample store. */
export function customerRoute(customer: Customer = regularCustomer): StoryRoute {
  return {
    pattern: '/_authenticated/$storeId/customers/$customerId',
    path: `/${shellStore.id}/customers/${customer.id}`,
  }
}

interface CustomerOptions {
  customer?: Customer
  rules?: PermissionRule[]
  column?: Column
  /** A sheet, dialog, menu or toast is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the customer's records, for a held or refused request. */
  first?: HttpHandler[]
}

/**
 * A signed-in admin on a customer's page (DA-CUS-02), with every record its
 * cards read and write: the customer, the store's groups, customer tags and
 * countries, the customer's tax identifiers and its store credit.
 */
export function customerParameters({
  customer = regularCustomer,
  rules,
  column,
  viewport = false,
  first = [],
}: CustomerOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      route: customerRoute(customer),
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    // `first` leads, so its answers win over the customer's own.
    msw: {
      handlers: {
        first,
        ...base.msw.handlers,
        customers: [
          ...customerRequests(customer),
          ...taxIdentifierRequests(),
          ...customerCreditRequests([customer]),
        ],
      },
    },
  }
}
