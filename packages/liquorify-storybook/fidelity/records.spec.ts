import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { createAdminClient } from '@spree/admin-sdk'
import { getCredentials } from '../../dashboard/e2e/helpers'

/**
 * Writes and reads external references and price history through the Admin
 * kit on the running browser-test server, for the platform batch's step P1:
 * a connector's own key for a product, used to find, update and delete it, and
 * the lowest recent price Spree keeps for each price change. Each run adds its
 * own products, deletes them at the end, and puts the store's price history
 * setting back as it found it.
 *
 * Start the server as stack.spec.ts describes; no browser is needed. Results go
 * to `results/records.json`, with no tokens.
 */

const API = 'http://localhost:3010'
const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

async function refusal(promise: Promise<unknown>) {
  try {
    await promise
    return null
  } catch (error) {
    const { status, code } = error as { status?: number; code?: string }
    return { status: status ?? null, code: code ?? null }
  }
}

test('External references and price history through the Admin kit', async () => {
  const credentials = getCredentials()
  const admin = createAdminClient({ baseUrl: API, retry: false })
  const session = await admin.auth.login({
    email: credentials.admin_email,
    password: credentials.admin_password,
  })
  admin.setToken(session.token)
  admin.setStore(credentials.store_id)

  const store = await admin.store.get()
  const currency = store.default_currency
  const stamp = Date.now()
  const observed: { check: string; step: string; result: unknown }[] = []
  const created: string[] = []

  try {
    await test.step('External references', async () => {
      const check = 'external references'
      const erp = `ERP-${stamp}`
      const product = await admin.products.create({
        name: `P1 reference ${stamp}`,
        status: 'draft',
        external_references: { erp },
        prices: [{ currency, amount: '20.00' }],
      })
      created.push(product.id)
      expect(product.external_references).toEqual({ erp })
      observed.push({ check, step: 'create with a key', result: product.external_references })

      const found = await admin.products.get(`external:erp:${erp}`)
      expect(found.id).toBe(product.id)
      observed.push({ check, step: 'read by the key', result: { sameProduct: true } })

      const again = await admin.products.create({
        name: `P1 reference ${stamp} again`,
        external_references: { erp },
      })
      const named = await admin.products.list({ name_cont: `P1 reference ${stamp}` })
      expect(again.id).toBe(product.id)
      expect(again.name).toBe(`P1 reference ${stamp} again`)
      expect(named.meta.count).toBe(1)
      observed.push({
        check,
        step: 'create again with the same key',
        result: { sameProduct: true, renamed: true, productsWithTheName: named.meta.count },
      })

      const pim = `PIM-${stamp}`
      const updated = await admin.products.update(`external:erp:${erp}`, {
        external_references: { pim },
      })
      expect(updated.external_references).toEqual({ erp, pim })
      observed.push({
        check,
        step: 'add a second system, addressed by the first key',
        result: updated.external_references,
      })

      const other = await admin.products.create({
        name: `P1 other ${stamp}`,
        status: 'draft',
        external_references: { erp: `${erp}-other` },
      })
      created.push(other.id)
      const conflict = await refusal(
        admin.products.update(other.id, { external_references: { erp } }),
      )
      expect(conflict).toEqual({ status: 422, code: 'conflicting_external_reference' })
      observed.push({
        check,
        step: "give another product the first product's key",
        result: conflict,
      })

      await admin.products.delete(`external:erp:${erp}`)
      const gone = await refusal(admin.products.get(product.id))
      expect(gone?.status).toBe(404)
      created.splice(created.indexOf(product.id), 1)
      observed.push({ check, step: 'delete by the key', result: gone })
    })

    await test.step('Price history', async () => {
      const check = 'price history'
      observed.push({
        check,
        step: "the store's setting before the run",
        result: { trackPriceHistory: store.track_price_history },
      })
      if (!store.track_price_history) await admin.store.update({ track_price_history: true })
      const product = await admin.products.create({
        name: `P1 price ${stamp}`,
        status: 'draft',
        prices: [{ currency, amount: '20.00' }],
      })
      created.push(product.id)
      const {
        data: [price],
      } = await admin.prices.list({
        variant_id_eq: product.default_variant_id,
        currency_eq: currency,
        price_list_id_null: true,
      })
      await admin.prices.update(price.id, { amount: '15.00' })
      await admin.prices.update(price.id, { amount: '25.00' })
      const changed = await admin.products.get(product.id, { expand: ['prior_price'] })
      expect(changed.prior_price?.amount).toBe('15.00')
      observed.push({
        check,
        step: 'prior price after 20.00, 15.00 and 25.00',
        result: changed.prior_price?.amount,
      })

      await admin.prices.bulkUpsert({
        prices: [
          { id: price.id, variant_id: product.default_variant_id, currency, amount: '10.00' },
        ],
      })
      const current = await admin.prices.get(price.id)
      const afterBulk = await admin.products.get(product.id, { expand: ['prior_price'] })
      expect(current.amount).toBe('10.00')
      expect(afterBulk.prior_price?.amount).toBe('15.00')
      observed.push({
        check,
        step: 'prior price after a bulk upsert to 10.00',
        result: { price: current.amount, priorPrice: afterBulk.prior_price?.amount },
      })
    })
  } finally {
    for (const id of created) await admin.products.delete(id).catch(() => undefined)
    if (!store.track_price_history) await admin.store.update({ track_price_history: false })
    mkdirSync(results, { recursive: true })
    writeFileSync(`${results}records.json`, `${JSON.stringify({ revision, observed }, null, 2)}\n`)
  }
})
