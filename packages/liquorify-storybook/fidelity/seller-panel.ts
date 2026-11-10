import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, request } from '@playwright/test'
import { runRailsBootstrap } from '../../dashboard/e2e/rails'
import {
  type Marketplace,
  SELLER_PASSWORD,
  seedMarketplace,
  sellerHeaders,
  send,
  shopper,
} from './marketplace'
import type { Json } from './orders'
import { admin } from './staff'

/**
 * Batch 13 part 2's seller orders on the browser-test server (work item §10.2,
 * §10.4), added after part 1's marketplace (`marketplace.ts`).
 *
 * A shopper buys through the Store API, and Harbour Cask's member works each
 * order through the Seller API, as the seller panel would: one order left new,
 * one shipped in part, one withdrawn from with a reason, and part
 * 1's fulfilled order given a delivery and a return. A second teammate is made
 * a member of two sellers, for the seller picker, and the turned-down seller
 * is given a member, so each seller status is seen signed in (§10.3). Made once; a later
 * run reuses what the state file names.
 */

const state = new URL('./results/seller-panel-batch-13.json', import.meta.url).pathname

/** A member of Harbour Cask and of Saltmarsh, for the picker and the switcher. */
export const twoSellerEmail = 'mara.quill@harbour-cask.example.com'
/** A member of Northgate Vintners, whose application was turned down. */
export const rejectedEmail = 'elin.voss@northgate.example.com'
/** The member of Copperline Brewing, which is suspended (marketplace-seed.rb). */
export const suspendedEmail = 'sam.reyes@copperline.example.com'

export interface SellerPanel {
  market: Marketplace
  orders: Record<'new' | 'partial' | 'canceled' | 'returned', string>
  /** Part 1's ledger orders, placed by the seed with no items or addresses (SD-3). */
  ledgerOrder: string
  returnId: string
  /** The Seller API's answer to an exchange on the seller's own product. */
  exchangeRefused: string
  claimId: string
}

const rows = (body: Json) => body.data as Json[]

export async function seedSellerPanel(baseURL: string): Promise<SellerPanel> {
  const market = await seedMarketplace(baseURL)
  if (existsSync(state)) return JSON.parse(readFileSync(state, 'utf-8')) as SellerPanel

  runRailsBootstrap(
    `
      user = Spree.admin_user_class.find_by(email: ENV['TWO_SELLER_EMAIL']) ||
             Spree.admin_user_class.create!(email: ENV['TWO_SELLER_EMAIL'], password: ENV['MARKETPLACE_PASSWORD'],
                                            password_confirmation: ENV['MARKETPLACE_PASSWORD'],
                                            first_name: 'Mara', last_name: 'Quill')
      %w[${market.sellers.approved} ${market.sellers.second}].each do |id|
        seller = Spree::Seller.find_by_prefix_id!(id)
        seller.add_user(user) unless seller.users.include?(user)
      end
      rejected = Spree.admin_user_class.find_by(email: ENV['REJECTED_EMAIL']) ||
                 Spree.admin_user_class.create!(email: ENV['REJECTED_EMAIL'], password: ENV['MARKETPLACE_PASSWORD'],
                                                password_confirmation: ENV['MARKETPLACE_PASSWORD'],
                                                first_name: 'Elin', last_name: 'Voss')
      northgate = Spree::Seller.find_by_prefix_id!('${market.sellers.rejected}')
      northgate.add_user(rejected) unless northgate.users.include?(rejected)
      puts({ user: user.email }.to_json)
    `,
    {
      ...process.env,
      RAILS_ENV: 'test',
      DASHBOARD_E2E: '1',
      MARKETPLACE_PASSWORD: SELLER_PASSWORD,
      TWO_SELLER_EMAIL: twoSellerEmail,
      REJECTED_EMAIL: rejectedEmail,
    },
  )

  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const checkout = await shopper(api, headers)
    const seller = await sellerHeaders(api, market.users.approved, market.sellers.approved)
    const call = (method: 'get' | 'post' | 'patch', path: string, data?: object) =>
      send(api, seller, method, `seller/${path}`, data)
    const harbourOrder = async (placed: Json) => {
      const ids = ((placed.orders as Json[] | undefined) ?? [placed]).map(
        (each) => each.id as string,
      )
      const mine = rows(await call('get', 'orders?limit=100')).map((each) => each.id)
      const id = ids.find((each) => mine.includes(each))
      expect(id, "Harbour Cask's share of the purchase").toBeTruthy()
      return id as string
    }

    // A new order, untouched.
    const newOrder = await harbourOrder(await checkout([market.products.active]))

    // Three bottles, two of them shipped: fulfilling only some lines moves the
    // rest onto a parcel of their own, which is still owed.
    const partial = await harbourOrder(
      await checkout([market.products.active, market.products.active, market.products.active]),
    )
    const [parcel] = rows(await call('get', `orders/${partial}/fulfillments`))
    const line = ((parcel.fulfillment_items as Json[])[0] as Json).line_item_id as string
    await call('patch', `orders/${partial}/fulfillments/${parcel.id}/fulfill`, {
      tracking: '1Z999AA10123456784',
      tracking_carrier: 'UPS',
      notify_customer: false,
      items: [{ item_id: line, quantity: 2 }],
    })

    // An order from both sellers, which Harbour Cask withdraws from.
    const canceled = await harbourOrder(
      await checkout([market.products.active, market.products.second]),
    )
    const [reason] = rows(await call('get', 'order_cancellation_reasons'))
    await call('patch', `orders/${canceled}/cancel`, {
      ...(reason && { cancel_reason_id: reason.id }),
      cancel_note: 'Out of stock until the next bottling.',
      refund_payments: true,
      notify_customer: false,
    })

    // Part 1's fulfilled order: a tracked delivery, and a return the seller approves.
    const returned = market.fulfilledOrder
    const [shipped] = rows(await call('get', `orders/${returned}/fulfillments`))
    await call('post', `orders/${returned}/fulfillments/${shipped.id}/deliveries`, {
      tracking_number: '9400111899223197428490',
      carrier: 'USPS',
    })
    const [returnReason] = rows(await call('get', 'return_reasons'))
    const [location] = rows(await call('get', 'stock_locations?limit=100'))
    const created = await call('post', `orders/${returned}/returns`, {
      items: [
        {
          fulfillment_item_id: ((shipped.fulfillment_items as Json[])[0] as Json).id,
          quantity: 1,
        },
      ],
      ...(returnReason && { reason_id: returnReason.id }),
      ...(location && { stock_location_id: location.id }),
      memo: 'Bottle arrived with a cracked seal.',
    })
    await call('patch', `orders/${returned}/returns/${created.id}/approve`)

    // The part-shipped order's two shipped bottles: one claimed as damaged,
    // with a partial refund. An exchange is asked for too, and the Seller API's
    // answer kept: it looks the replacement up among the variants carrying the
    // seller's own column, which Spree keeps blank on a product the seller owns.
    const sent = rows(await call('get', `orders/${partial}/fulfillments`)).find(
      (each) => each.status === 'fulfilled',
    ) as Json
    const sentItem = (sent.fulfillment_items as Json[])[0] as Json
    const exchangeAnswer = await api.post(`/api/v3/seller/orders/${partial}/exchanges`, {
      headers: seller,
      data: {
        items: [
          { fulfillment_item_id: sentItem.id, new_variant_id: sentItem.variant_id, quantity: 1 },
        ],
        memo: 'Customer asked for a fresh bottle from the next batch.',
      },
    })
    const exchangeRefused = `${exchangeAnswer.status()} ${await exchangeAnswer.text()}`
    const [claimReason] = rows(await call('get', 'claim_reasons'))
    const claim = await call('post', `orders/${partial}/claims`, {
      items: [
        {
          line_item_id: sentItem.line_item_id,
          quantity: 1,
          description: 'Label torn in transit.',
          send_replacement: false,
          refund_amount: '10.00',
        },
      ],
      ...(claimReason && { reason_id: claimReason.id }),
    })

    const ledgerOrder = rows(await call('get', 'orders?limit=100')).find(
      (each) => (each.items as Json[]).length === 0,
    )?.id as string

    const panel: SellerPanel = {
      market,
      orders: { new: newOrder, partial, canceled, returned },
      ledgerOrder,
      returnId: created.id as string,
      exchangeRefused,
      claimId: claim.id as string,
    }
    writeFileSync(state, JSON.stringify(panel, null, 2))
    return panel
  } finally {
    await api.dispose()
  }
}
