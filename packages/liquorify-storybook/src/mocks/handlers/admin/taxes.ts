import type { TaxCategory, TaxRate } from '@spree/admin-sdk'
import { taxCategories } from '../../../fixtures/admin/catalog'
import { taxRates } from '../../../fixtures/admin/taxes'
import { recordRequests } from './records'

export function taxRateRequests(records: TaxRate[] = taxRates) {
  return recordRequests('tax_rates', records)
}

export function taxCategoryRequests(records: TaxCategory[] = taxCategories) {
  return recordRequests('tax_categories', records)
}
