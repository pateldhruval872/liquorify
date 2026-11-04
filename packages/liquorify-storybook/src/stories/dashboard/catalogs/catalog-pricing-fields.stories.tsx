import type { Catalog } from '@spree/admin-sdk'
import { Card, CardContent, CardHeader, CardTitle, FieldGroup } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import i18n from 'i18next'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { CatalogPricingFields } from '../../../../../dashboard/src/components/spree/catalog-pricing-fields'
import {
  type CatalogFormValues,
  catalogPricingValues,
} from '../../../../../dashboard/src/schemas/catalog'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import {
  cafeCatalog,
  harborCatalog,
  priceListPricesImport,
  springCatalog,
  tradePrices,
} from '../../../fixtures/admin/merchandising'
import { uploadAccepted } from '../../../mocks/handlers/admin/files'
import {
  exportRequests,
  importRequests,
  priceRequests,
} from '../../../mocks/handlers/admin/merchandising'
import { CatalogFormFor, catalogParameters } from './catalog-form'

interface Args {
  catalog: Catalog
  canEdit: boolean
  validate?: boolean
  values?: Partial<CatalogFormValues>
  hasStagedProducts?: boolean
}

const harborPrices = tradePrices.map((row) => ({
  ...row,
  price_list_id: harborCatalog.price_list?.id ?? null,
}))

/**
 * What a catalog charges (DA-PRD-14, and the wizard's pricing step): normal
 * prices, a percentage off them with an optional starting quantity and
 * quantity tiers, or prices entered by hand in the bulk price editor, with
 * CSV import and export. Switching away from a list that holds prices warns
 * what Save will remove.
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Catalog pricing fields',
  tags: ['CMP-DA-G-24'],
  args: { catalog: cafeCatalog, canEdit: true },
  decorators: [withStore, withToaster],
  parameters: catalogParameters({
    handlers: {
      prices: priceRequests(harborPrices),
      upload: uploadAccepted,
      imports: importRequests(priceListPricesImport),
      exports: exportRequests(),
    },
  }),
  render: ({ catalog, canEdit, validate, values, hasStagedProducts }) => (
    <CatalogFormFor catalog={catalog} validate={validate} values={values}>
      {(form) => (
        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('admin.catalogs.detail.pricing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <CatalogPricingFields
                form={form}
                canEdit={canEdit}
                priceList={catalog.price_list}
                savedMode={catalogPricingValues(catalog.price_list).pricing_mode}
                excludeProductIds={[]}
                hasStagedProducts={hasStagedProducts}
                onImportCreated={fn()}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      )}
    </CatalogFormFor>
  ),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

async function choosePricing(name: string) {
  await userEvent.click(await screen.findByRole('combobox', { name: 'Pricing' }))
  await userEvent.click(await screen.findByRole('option', { name }))
}

export const NormalPrices: Story = {
  name: 'Normal prices',
  args: { catalog: springCatalog },
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Pricing' })).toHaveTextContent(
      'Normal prices',
    )
  },
}

export const Percentage: Story = {
  name: 'A percentage off',
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Pricing' })).toHaveTextContent(
      'A percentage off base prices',
    )
    await expect(screen.getAllByRole('spinbutton', { name: 'Percentage' })[0]).toHaveValue(15)
    await expect(screen.getByRole('spinbutton', { name: 'Minimum quantity' })).toHaveValue(12)
    await expect(screen.getAllByRole('spinbutton', { name: 'From quantity' })).toHaveLength(2)
  },
}

export const AddingTier: Story = {
  name: 'Adding a quantity tier',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add quantity tier' }))
    await expect(screen.getAllByRole('spinbutton', { name: 'From quantity' })).toHaveLength(3)
  },
}

export const PercentageMissing: Story = {
  name: 'Percentage missing',
  args: { catalog: springCatalog, values: { pricing_mode: 'automatic' }, validate: true },
  play: async () => {
    await screen.findByText('Enter a percentage.')
  },
}

export const PercentageTooDeep: Story = {
  name: 'A discount of 100 percent',
  args: {
    catalog: springCatalog,
    values: { pricing_mode: 'automatic', adjustment_magnitude: '100' },
    validate: true,
  },
  play: async () => {
    await screen.findByText('Must be less than 100%.')
  },
}

export const EnteredPrices: Story = {
  name: 'Prices entered by hand',
  args: { catalog: harborCatalog },
  play: async () => {
    await screen.findByRole('button', { name: 'Enter prices' })
    await screen.findByRole('button', { name: 'Export' })
    await screen.findByText('Set the price each product costs this audience.')
  },
}

export const EnteredPricesAfterProductChanges: Story = {
  name: 'Prices entered by hand, products changed',
  args: { catalog: harborCatalog, hasStagedProducts: true },
  play: async () => {
    await screen.findByText(
      'Set the price each product costs this audience. Save first to price the products you just changed.',
    )
  },
}

export const EnteredPricesBeforeSave: Story = {
  name: 'Prices entered by hand, not saved yet',
  args: { catalog: springCatalog, values: { pricing_mode: 'fixed' } },
  play: async () => {
    await screen.findByText('Save the catalog, then enter the prices for this audience.')
  },
}

export const EnteringPrices: Story = {
  name: 'Entering prices',
  args: { catalog: harborCatalog },
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Enter prices' }))
    await screen.findByRole('dialog', { name: 'Edit prices — Harbor contract' })
    await screen.findByText('6 prices in USD')
  },
}

export const SwitchingToNormal: Story = {
  name: 'Switching to normal prices',
  play: async () => {
    await choosePricing('Normal prices')
    await screen.findByText(
      'Saving will remove this catalog’s price list and the prices in it. This audience will pay normal prices.',
    )
  },
}

export const SwitchingToPercentage: Story = {
  name: 'Switching from entered prices to a percentage',
  args: { catalog: harborCatalog },
  play: async () => {
    await choosePricing('A percentage off base prices')
    await screen.findByText(
      'Switching to a percentage will discard the prices entered for this catalog. They cannot be recovered.',
    )
  },
}

export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  args: { canEdit: false },
  play: async () => {
    await waitFor(() =>
      expect(screen.getAllByRole('spinbutton', { name: 'Percentage' })[0]).toBeDisabled(),
    )
    await expect(screen.queryByRole('button', { name: 'Add quantity tier' })).toBeNull()
  },
}
