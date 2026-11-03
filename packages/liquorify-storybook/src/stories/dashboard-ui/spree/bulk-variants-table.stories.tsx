import type { Variant } from '@spree/admin-sdk'
import { type BulkVariantsRow, BulkVariantsTable } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { cartonSize } from '../../../../../dashboard-core/src/products/carton-size'
import { composeOptionsText } from '../../../../../dashboard-core/src/products/variants-matrix'
import {
  cartonPackageType,
  linenApron,
  optionTypes,
  taxCategories,
} from '../../../fixtures/admin/catalog'
import { countries } from '../../../fixtures/admin/countries'

const labels = {
  variant: 'Variant',
  sku: 'SKU',
  barcode: 'Barcode',
  weight: 'Weight',
  weightUnit: 'Unit',
  height: 'Height',
  width: 'Width',
  depth: 'Depth',
  dimensionsUnit: 'Unit',
  preorderable: 'Available for pre-order',
  backorderLimit: 'Backorder limit',
  taxCategory: 'Tax category',
  hsCode: 'HS code',
  countryOfOrigin: 'Country of origin',
  customsDescription: 'Customs description',
  unitsPerCarton: 'Units per carton',
  cartonPackageType: 'Carton',
  cartonWeight: 'Carton weight',
  cartonsPerPallet: 'Cartons per pallet',
  variantDefault: 'Default variant',
  unitDefault: 'None',
  taxCategoryNone: 'Inherit from product',
  countryOfOriginNone: 'None',
  cartonPackageTypeNone: 'None',
  gridAriaLabel: 'Variant bulk edit spreadsheet',
}

const unitOptions = (units: string[]) => units.map((unit) => ({ value: unit, label: unit }))
const regionName = new Intl.DisplayNames(['en'], { type: 'region' })

/**
 * The linen apron's variants as the bulk editor projects them, with the
 * shipping, customs and packing details a merchant has filled in for the
 * olive ones.
 */
function variantRows(): BulkVariantsRow[] {
  return ((linenApron.variants ?? []) as Variant[]).map((variant, index) => {
    const olive = variant.sku?.startsWith('APRON-OLV') ?? false
    return {
      id: `variant:${index}`,
      variantLabel: composeOptionsText(
        (variant.option_values ?? []).map((value) => ({
          name: value.option_type_name,
          value: value.name,
        })),
        optionTypes,
      ),
      sku: variant.sku ?? null,
      barcode: olive ? `5901234123${457 + index}` : null,
      weight: index % 2 === 0 ? '0.35' : '0.38',
      weightUnit: 'kg',
      height: null,
      width: null,
      depth: null,
      dimensionsUnit: 'cm',
      preorderable: variant.sku === 'APRON-SLT-M',
      backorderLimit: variant.sku === 'APRON-SLT-M' ? '20' : null,
      taxCategoryId: null,
      hsCode: olive ? '621149' : null,
      countryOfOrigin: olive ? 'PL' : null,
      customsDescription: olive ? 'Linen apron' : null,
      unitsPerCarton: olive ? '20' : null,
      cartonPackageTypeId: olive ? cartonPackageType.id : null,
      cartonWeight: olive ? '7.6' : null,
      cartonsPerPallet: olive ? '24' : null,
    }
  })
}

/**
 * The spreadsheet inside the product page's bulk variant editor (DA-PRD-03):
 * every field of the variant sheet across all of a product's variants. Each
 * group of columns appears only when the store has what it needs: tax
 * categories, the country list for customs, and at least one carton for
 * packing. It is wider than any window, so it scrolls sideways.
 */
function VariantsTable({
  taxed = true,
  customs = true,
  cartons = true,
}: {
  taxed?: boolean
  customs?: boolean
  cartons?: boolean
}) {
  const [rows, setRows] = useState(variantRows)
  return (
    <div className="overflow-hidden rounded border">
      <BulkVariantsTable
        rows={rows}
        labels={labels}
        weightUnitOptions={unitOptions(['g', 'kg', 'lb', 'oz'])}
        dimensionUnitOptions={unitOptions(['mm', 'cm', 'in'])}
        taxCategoryOptions={
          taxed
            ? taxCategories.map((category) => ({ value: category.id, label: category.name }))
            : undefined
        }
        countryOptions={
          customs
            ? countries.map((country) => ({
                value: country.iso,
                label: regionName.of(country.iso) ?? country.iso,
              }))
            : undefined
        }
        cartonOptions={
          cartons
            ? [
                {
                  value: cartonPackageType.id,
                  label: cartonPackageType.name,
                  hint: cartonSize(cartonPackageType) ?? undefined,
                },
              ]
            : undefined
        }
        onChange={(rowId, change) =>
          setRows((current) =>
            current.map((row) =>
              row.id === rowId ? { ...row, [change.field]: change.value } : row,
            ),
          )
        }
      />
    </div>
  )
}

const scrollTo = (canvas: HTMLElement, label: string) => {
  const scroller = canvas.querySelector('.themed-scrollbar') as HTMLElement
  const cell = screen.getAllByLabelText(new RegExp(`^${label} — `))[0]
  const offset = cell.getBoundingClientRect().left - scroller.getBoundingClientRect().left
  scroller.scrollLeft = offset - 160
}

const meta = {
  title: 'Dashboard UI/Composed/Bulk variants table',
  component: VariantsTable,
  tags: ['CMP-DUI-C-06'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof VariantsTable>

export default meta
type Story = StoryObj<typeof meta>

export const EveryColumn: Story = {
  name: 'Every column',
}

export const Customs: Story = {
  name: 'Scrolled to customs and packing',
  play: async ({ canvasElement }) => {
    scrollTo(canvasElement, 'HS code')
    await expect(screen.getAllByLabelText(/^HS code — /)[0]).toHaveValue('621149')
  },
}

export const WithoutCartons: Story = {
  name: 'No cartons in the store',
  args: { cartons: false },
  play: async ({ canvasElement }) => {
    scrollTo(canvasElement, 'HS code')
    await expect(screen.queryAllByLabelText(/^Carton — /)).toHaveLength(0)
  },
}

export const WithoutTaxCategories: Story = {
  name: 'No tax categories, countries or cartons',
  args: { taxed: false, customs: false, cartons: false },
  play: async () => {
    await expect(screen.queryAllByLabelText(/^Tax category — /)).toHaveLength(0)
  },
}

export const ChoosingACarton: Story = {
  name: 'Choosing a carton',
  parameters: { liquorify: { column: 'page', capture: 'viewport' } },
  play: async ({ canvasElement }) => {
    scrollTo(canvasElement, 'Carton')
    await userEvent.click(screen.getAllByLabelText(/^Carton — /)[2])
    await screen.findByRole('option', { name: /Shipping carton/ })
  },
}
