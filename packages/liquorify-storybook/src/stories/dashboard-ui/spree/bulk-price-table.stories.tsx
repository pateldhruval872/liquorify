import type { Product, Variant } from '@spree/admin-sdk'
import { type BulkPriceRow, BulkPriceTable } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen } from 'storybook/test'
import { composeOptionsText } from '../../../../../dashboard-core/src/products/variants-matrix'
import { clayMug, linenApron, optionTypes, slateCap } from '../../../fixtures/admin/catalog'

const labels = {
  variant: 'Variant',
  sku: 'SKU',
  price: 'Price',
  compareAt: 'Compare-at price',
  variantDefault: 'Default',
  loading: 'Loading…',
  pageOf: 'Page {page} of {total}',
  prev: 'Prev',
  next: 'Next',
  emptyMessage: 'Add at least one variant to start editing prices.',
  gridAriaLabel: 'Variant prices',
  priceAriaTemplate: 'Price for {label}',
  compareAtAriaTemplate: 'Compare-at price for {label}',
}

/** A product's variants in one currency, as the product page's price grid projects them. */
function priceRows(product: Product, currency: string, decimal: string): BulkPriceRow[] {
  const variants = (
    (product.variant_count ?? 0) > 0 ? product.variants : [product.default_variant]
  ) as Variant[]
  const display = (amount?: string | null) => (amount ? amount.replace('.', decimal) : null)
  return [
    { id: 'header:product', kind: 'header', groupLabel: product.name },
    ...variants.map((variant, index) => {
      const price = variant.prices?.find((each) => each.currency === currency)
      const options = (variant.option_values ?? []).map((value) => ({
        name: value.option_type_name,
        value: value.name,
      }))
      return {
        id: `variant:${index}`,
        kind: 'item' as const,
        variantLabel: options.length > 0 ? composeOptionsText(options, optionTypes) : null,
        sku: variant.sku ?? null,
        amount: display(price?.amount),
        compareAt: display(price?.compare_at_amount),
      }
    }),
  ]
}

/**
 * The spreadsheet of variant prices on the product page's prices card
 * (DA-PRD-02), for one product in one currency: the product's name over its
 * variants, each with a price and a compare-at price. Prices show in the
 * admin's own number format. The search, pages, quantity breaks and refusal
 * message this table also offers belong to the price list editor, in part 2.
 */
function PriceTable({
  product,
  currency,
  symbol,
  decimal,
}: {
  product: Product
  currency: string
  symbol: string
  decimal: string
}) {
  const [rows, setRows] = useState(() => priceRows(product, currency, decimal))
  return (
    <div className="overflow-hidden rounded border">
      <BulkPriceTable
        rows={rows}
        symbol={symbol}
        decimal={decimal}
        labels={labels}
        onChange={(rowId, field, value) =>
          setRows((current) =>
            current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
          )
        }
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Bulk price table',
  component: PriceTable,
  tags: ['CMP-DUI-C-05'],
  args: { product: linenApron, currency: 'USD', symbol: '$', decimal: '.' },
  parameters: { liquorify: { column: 'main' } },
} satisfies Meta<typeof PriceTable>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  play: async () => {
    await expect(screen.getByLabelText('Compare-at price for Color: Slate, Size: L')).toHaveValue(
      '48.00',
    )
  },
}

export const OneVariant: Story = {
  name: 'One variant',
  args: { product: clayMug },
  play: async () => {
    await expect(screen.getByLabelText('Price for Default')).toHaveValue('18.00')
  },
}

export const NoPriceInThisCurrency: Story = {
  name: 'No price in this currency',
  args: { product: slateCap, currency: 'EUR', symbol: '€' },
  play: async () => {
    await expect(screen.getByLabelText('Price for Default')).toHaveValue('')
  },
}

export const CommaDecimalMark: Story = {
  name: 'Euros, with a comma decimal mark',
  args: { currency: 'EUR', symbol: '€', decimal: ',' },
  play: async () => {
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('41,00')
  },
}
