import type { MeResponse } from '@spree/seller-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../decorators/providers'
import { profile } from '../../fixtures/seller/profile'
import { me } from '../../fixtures/seller/session'
import {
  type SellerRecords,
  sellerRequests,
  sellerSession,
} from '../../mocks/handlers/seller/panel'

export const sellerId = profile.id

interface PanelOptions extends SellerRecords {
  /** The page under the seller the component sits on, such as `orders/$orderId`. */
  page?: string
  /** The address of that page, such as `orders/or_HOVtlDrOmL`. */
  path?: string
  column?: Column
  /** A sheet, dialog or menu is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the panel's records, for a held or refused request. */
  first?: HttpHandler[]
  session?: MeResponse
}

/**
 * A signed-in member of Harbour Cask in the seller panel, on one of its
 * pages, with every record the panel reads answered from the fixtures.
 */
export function panelParameters({
  page = 'profile',
  path = page,
  column,
  viewport = false,
  first = [],
  session = me,
  ...records
}: PanelOptions = {}) {
  return {
    liquorify: {
      panel: 'seller' as const,
      signedIn: true,
      sellerId,
      route: {
        pattern: `/_authenticated/$sellerId/${page}`,
        path: `/${sellerId}/${path}`,
      },
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    msw: {
      handlers: { first, session: sellerSession(session), seller: sellerRequests(records) },
    },
  }
}
