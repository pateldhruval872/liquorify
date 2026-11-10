import type { PermissionRule, Seller } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import { harbourCask } from '../../../fixtures/admin/marketplace'
import { read, shellRules, shellStore, write } from '../../../fixtures/admin/shell'
import { marketplaceRequests } from '../../../mocks/handlers/admin/marketplace'

const store = shellStore.id

/** Each seller subject the seller screens check, so a role's reach reads at a glance. */
const sellerSubjects = ['seller', 'seller_requirement', 'seller_requirement_submission']

/** A custom role with read on sellers, commissions and payouts, and no write (§2.2's seller viewer). */
export const sellerViewerRules: PermissionRule[] = [
  ...shellRules,
  ...read([
    ...sellerSubjects,
    'commission_rate',
    'commission_line',
    'seller_payout',
    'seller_transfer',
  ]),
]

/** A custom role with read on sellers and write on payouts (§2.2's payouts clerk). */
export const payoutsClerkRules: PermissionRule[] = [
  ...shellRules,
  ...read(sellerSubjects),
  ...write(['seller_payout', 'seller_transfer']),
]

interface SellerOptions {
  seller?: Seller
  rules?: PermissionRule[]
  column?: Column
  /** A sheet, dialog or menu is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the marketplace's records, for a held or refused request. */
  first?: HttpHandler[]
  team?: boolean
}

/** A signed-in admin on a seller's page, with every record its cards read. */
export function sellerParameters({
  seller = harbourCask,
  rules,
  column,
  viewport = false,
  first = [],
  team,
}: SellerOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      route: {
        pattern: '/_authenticated/$storeId/sellers/$sellerId',
        path: `/${store}/sellers/${seller.id}`,
      },
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    msw: {
      handlers: { first, ...base.msw.handlers, marketplace: marketplaceRequests({ team }) },
    },
  }
}
