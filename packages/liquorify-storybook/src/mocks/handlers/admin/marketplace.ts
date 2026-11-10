import type { SellerTransfer } from '@spree/admin-sdk'
import { HttpResponse, http } from 'msw'
import {
  completedPayout,
  harbourBalances,
  harbourCommissionLines,
  harbourInvitations,
  harbourOnboarding,
  harbourTeam,
  juniperOnboarding,
  pendingPayout,
  sellers,
  stonecropOnboarding,
} from '../../../fixtures/admin/marketplace'
import { onePage } from '../../page'
import { found } from './records'

const admin = '/api/v3/admin'

const onboardings: Record<string, unknown> = {
  [sellers[2].id]: stonecropOnboarding,
  [sellers[3].id]: juniperOnboarding,
  [sellers[4].id]: harbourOnboarding,
}

interface MarketplaceOptions {
  /** The transfers an order's card lists. */
  transfers?: SellerTransfer[]
  /** Harbour Cask's team and pending invitations, empty for a seller nobody runs yet. */
  team?: boolean
}

/**
 * The seller screens' reads: each seller, its onboarding, team, invitations
 * and balance, the payouts, an order's commission lines and transfers, and
 * the writes those screens send, answered as they succeed.
 */
export function marketplaceRequests({ transfers = [], team = true }: MarketplaceOptions = {}) {
  return [
    http.get(`${admin}/sellers/:id/onboarding`, ({ params }) =>
      HttpResponse.json(onboardings[params.id as string] ?? harbourOnboarding),
    ),
    http.get(`${admin}/sellers/:id/team`, () =>
      HttpResponse.json({ data: team ? harbourTeam : [] }),
    ),
    http.get(`${admin}/sellers/:id/invitations`, () =>
      HttpResponse.json({ data: team ? harbourInvitations : [] }),
    ),
    http.get(`${admin}/sellers/:id/balances`, () => HttpResponse.json({ data: harbourBalances })),
    http.get(`${admin}/sellers/:id`, ({ params }) => found(sellers, params.id)),
    http.get(`${admin}/sellers`, () => HttpResponse.json(onePage(sellers))),
    http.patch(`${admin}/sellers/:id`, async ({ params, request }) => {
      const seller = sellers.find((each) => each.id === params.id) ?? sellers[0]
      return HttpResponse.json({ ...seller, ...((await request.json()) as object) })
    }),
    http.get(`${admin}/seller_payouts/:id`, ({ params }) =>
      found([completedPayout, pendingPayout], params.id),
    ),
    http.patch(`${admin}/seller_payouts/:id/complete`, async ({ request }) =>
      HttpResponse.json({
        ...pendingPayout,
        status: 'completed',
        ...((await request.json()) as object),
      }),
    ),
    http.get(`${admin}/seller_transfers`, () => HttpResponse.json(onePage(transfers))),
    http.get(`${admin}/commission_lines`, () => HttpResponse.json(onePage(harbourCommissionLines))),
  ]
}

/** An order with no commission charged on it. */
export const noCommissionLines = [
  http.get(`${admin}/commission_lines`, () => HttpResponse.json(onePage([]))),
]
