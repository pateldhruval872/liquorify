import { expect, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { blockOutside, recorder, reload, type Seed, type Steps, seeded } from './p9'
import { card, type Order, openOrder, placed, product, rated, shipped, unitsOf } from './p11-orders'

/**
 * The bounded check the owner asked for on 2026-11-10 before deciding whether
 * Spree is right to hold a replacement after a refund (P11 part 3's record,
 * §4.4). It is a check, not a browser test: it records what happens and
 * asserts only that each request it makes is answered.
 *
 * Four orders, each paid in full by cheque and shipped, then given claims with
 * no return, resolved through the Admin API's claim resolution:
 *
 *   A   one claim on one unit, resolved with a refund and a replacement;
 *   B1  a line of 2: one claim refunded, another claim on the other unit
 *       replaced;
 *   B2  two lines: one product's claim refunded, the other product's claim
 *       replaced;
 *   C   one claim on one unit, replaced, with no refund (the control).
 *
 * Each refund is the unit's price, $20.00, to the original payment. After each step it records each line's
 * quantity, each claim, each refund, the order's total, what has been paid,
 * the amount due and the payment status. Then it asks the server to ship each
 * replacement without the force option, keeps the answer, and reads the
 * order page's Fulfillments card. Nothing is forced. Each replacement product
 * is stocked at one location, so SD-71 does not refuse it.
 */

const { snap, save } = recorder('held-replacement', 'p11')
const shop = 'Shop location'

test.beforeEach(async ({ page }) => {
  test.setTimeout(240_000)
  await login(page)
})

interface Claim {
  id: string
  number: string
}

interface Reading {
  id: string
  number: string
  total: string
  payment_total: string
  amount_due: string
  payment_status: string
  fulfillment_status: string
  items: { id: string; variant_id: string; quantity: number }[]
  fulfillments: { id: string; number: string; status: string }[]
}

async function reading(seed: Seed, order: Order) {
  const read = await seed.get<Reading>(`orders/${order.id}?expand=items,fulfillments`)
  const refunds = await seed.get<{ data: { amount: string; refund_reason_id?: string }[] }>(
    `orders/${order.id}/refunds`,
  )
  const claims = await seed.get<{
    data: { number: string; status: string; resolution?: string; refund_total?: string }[]
  }>(`orders/${order.id}/claims`)
  return {
    total: read.total,
    paid: read.payment_total,
    amount_due: read.amount_due,
    payment_status: read.payment_status,
    fulfillment_status: read.fulfillment_status,
    lines: read.items.map((item) => ({ id: item.id, quantity: item.quantity })),
    refunds: refunds.data.map((refund) => refund.amount),
    claims: claims.data.map((claim) => ({
      number: claim.number,
      status: claim.status,
      resolution: claim.resolution ?? null,
      refund_total: claim.refund_total ?? null,
    })),
    fulfilments: read.fulfillments.map((each) => ({ number: each.number, status: each.status })),
  }
}

async function claimOn(
  seed: Seed,
  order: Order,
  lineItemId: string,
  reasonId: string,
  replace: boolean,
) {
  const claim = await seed.post<Claim>(`orders/${order.id}/claims`, {
    items: [{ line_item_id: lineItemId, quantity: 1, send_replacement: replace }],
    reason_id: reasonId,
  })
  await seed.patch(`orders/${order.id}/claims/${claim.id}/approve`)
  return claim
}

const resolve = (seed: Seed, order: Order, claim: Claim, resolution: string) =>
  seed.patch(`orders/${order.id}/claims/${claim.id}/resolve`, {
    resolution,
    ...(resolution.includes('refund') && { refund_method: 'original_payment', amount: '20.00' }),
  })

/** Asks the server to ship each fulfilment not yet shipped, without force. */
async function shipWithoutForce(seed: Seed, order: Order) {
  const read = await seed.get<Reading>(`orders/${order.id}?expand=fulfillments`)
  const answers = []
  for (const each of read.fulfillments.filter((one) => one.status === 'unfulfilled')) {
    const res = await seed.api.fetch(
      `/api/v3/admin/orders/${order.id}/fulfillments/${each.id}/fulfill`,
      { method: 'PATCH', headers: seed.headers, data: { notify_customer: false } },
    )
    const body = await res.text()
    answers.push({
      fulfilment: each.number,
      status: res.status(),
      answer: res.ok() ? 'shipped' : body.slice(0, 400),
    })
  }
  return answers
}

type Scenario = 'A' | 'B1' | 'B2' | 'C'

const scenarios: { name: Scenario; what: string }[] = [
  { name: 'A', what: 'one claim on one unit, refunded and replaced' },
  { name: 'B1', what: 'a line of 2: one claim refunded, another claim on the other unit replaced' },
  { name: 'B2', what: "two lines: one product's claim refunded, the other's replaced" },
  { name: 'C', what: 'one claim on one unit, replaced, with no refund' },
]

test.describe('the replacement held after a refund (P11 part 3, §4.4)', () => {
  for (const scenario of scenarios) {
    test(`${scenario.name}: ${scenario.what}`, async ({ page, baseURL }) => {
      const outside = await blockOutside(page)
      const steps: Steps = []
      const order = await seeded(baseURL, async (seed) => {
        const label = `Held ${scenario.name}`
        const at = await rated(seed, label, baseURL as string, {}, shop)
        const reasons = await seed.get<{ data: { id: string; name: string }[] }>(
          'claim_reasons?limit=100',
        )
        const reason =
          reasons.data.find((each) => each.name === 'Arrived damaged') ?? reasons.data[0]
        expect(reason, 'a claim reason').toBeTruthy()

        let items = [{ variant_id: at.product.variantId, quantity: 1 }]
        if (scenario.name === 'B1') items = [{ variant_id: at.product.variantId, quantity: 2 }]
        if (scenario.name === 'B2') {
          const second = await product(
            seed,
            `${label} second`,
            '20.00',
            { delivery_profile_id: at.profileId },
            shop,
          )
          items.push({ variant_id: second.variantId, quantity: 1 })
        }
        const made = await placed(seed, at, { data: { items } })
        await shipped(seed, made)
        steps.push({
          step: 'placed, paid in full by cheque and shipped',
          ...(await reading(seed, made)),
        })

        const units = await unitsOf(seed, made)
        const lines = [...new Set(units.map((unit) => unit.line_item_id))]
        if (scenario.name === 'A') {
          const both = await claimOn(seed, made, lines[0], reason.id, true)
          await resolve(seed, made, both, 'refund_and_replacement')
          steps.push({
            step: `claim ${both.number} resolved with a refund and a replacement`,
            ...(await reading(seed, made)),
          })
        } else if (scenario.name === 'C') {
          const replaced = await claimOn(seed, made, lines[0], reason.id, true)
          await resolve(seed, made, replaced, 'replacement')
          steps.push({
            step: `claim ${replaced.number} resolved with a replacement`,
            ...(await reading(seed, made)),
          })
        } else {
          const refundedLine = lines[0]
          const replacedLine = scenario.name === 'B1' ? lines[0] : lines[1]
          const refunded = await claimOn(seed, made, refundedLine, reason.id, false)
          const replaced = await claimOn(seed, made, replacedLine, reason.id, true)
          await resolve(seed, made, refunded, 'refund')
          steps.push({
            step: `claim ${refunded.number} resolved with a refund`,
            ...(await reading(seed, made)),
          })
          await resolve(seed, made, replaced, 'replacement')
          steps.push({
            step: `claim ${replaced.number} resolved with a replacement`,
            ...(await reading(seed, made)),
          })
        }

        const answers = await shipWithoutForce(seed, made)
        steps.push({
          step: 'asked the server to ship each replacement without force',
          answers,
          ...(await reading(seed, made)),
        })
        return made
      })

      await openOrder(page, order)
      await reload(page)
      const fulfilments = card(page, /^fulfillments/i)
      await expect(fulfilments).toBeVisible({ timeout: 15_000 })
      await fulfilments.scrollIntoViewIfNeeded()
      steps.push({
        step: 'opened the order page',
        fulfillments_card: (await fulfilments.innerText()).replace(/\s+/g, ' ').trim(),
      })
      await snap(page, `${scenario.name}-order`)
      await save(page, `held-${scenario.name}`, steps, outside)
      expect(outside).toEqual([])
    })
  }
})
