import type { Market, TaxRate } from '@spree/admin-sdk'
import { taxCategories } from './catalog'
import { connectedEngine, markets } from './settings'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

const [defaultTax, clothingTax] = taxCategories

function taxRate(
  id: string,
  name: string,
  ratePercent: string,
  fields: Partial<TaxRate> = {},
): TaxRate {
  return {
    id,
    name,
    show_rate_in_label: true,
    metadata: {},
    created_at: created,
    updated_at: updated,
    deleted_at: null,
    rate: String(Number(ratePercent) / 100),
    rate_percent: ratePercent,
    tax_category_id: defaultTax.id,
    store_id: 'store_9Fh2Lq4c',
    country_code: null,
    state_code: null,
    ...fields,
  }
}

/** A rate for a country, one for a state, one with three decimals and one everywhere. */
export const taxRates: TaxRate[] = [
  taxRate('tax_2Lk7Qp4D', 'California sales tax', '7.25', {
    country_code: 'US',
    state_code: 'CA',
  }),
  taxRate('tax_5Rf9Sd3G', 'Germany VAT', '19', { country_code: 'DE' }),
  taxRate('tax_7Ux1Ve6H', 'New York clothing', '4.375', {
    country_code: 'US',
    state_code: 'NY',
    tax_category_id: clothingTax.id,
  }),
  taxRate('tax_9Yb3Wn8J', 'Flat import duty', '2', { show_rate_in_label: false }),
]

/** The store's three markets, the European one working tax out with an external engine. */
export const marketsWithOneEngine: Market[] = markets.map((market) =>
  market.currency === 'EUR' ? { ...market, tax_provider: connectedEngine.id } : market,
)

/** Every market on the external engine, so the store's rates apply nowhere. */
export const marketsAllOnEngine: Market[] = markets.map((market) => ({
  ...market,
  tax_provider: connectedEngine.id,
}))
