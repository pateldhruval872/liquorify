import type { Catalog, CatalogProduct, PermissionRule } from '@spree/admin-sdk'
import { mergeExtraColumns } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import i18n from 'i18next'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import {
  catalogPriceColumns,
  catalogVariantRows,
} from '../../../../../dashboard/src/components/spree/catalog-price-columns'
import {
  catalogTermColumns,
  savedTermLookup,
} from '../../../../../dashboard/src/components/spree/catalog-terms-card'
import { DeferredProductMembershipCard } from '../../../../../dashboard/src/components/spree/deferred-product-membership-card'
import {
  listCatalogProductsPage,
  useCatalogProducts,
} from '../../../../../dashboard/src/hooks/use-catalogs'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { products } from '../../../fixtures/admin/catalog'
import {
  cafeCatalog,
  cafeProducts,
  harborCatalog,
  harborProducts,
} from '../../../fixtures/admin/merchandising'
import { shellStore } from '../../../fixtures/admin/shell'
import { CatalogFormFor, catalogParameters } from './catalog-form'

const t = (key: string) => i18n.t(key)

interface Args {
  catalog: Catalog
  canEdit: boolean
  stageAddition?: boolean
}

/**
 * The catalog page's products card with the columns a catalog adds
 * (DA-PRD-14): each variant on its own row with what the catalog charges, a
 * badge saying where that price comes from and, for a price with quantity
 * breaks, a preview of its ladder; and per product the least a buyer may
 * order and the step size, each blank to take the catalog's own. The price
 * list page reads the same price columns (DA-PRD-17).
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Catalog price columns',
  tags: ['CMP-DA-G-24'],
  args: { catalog: cafeCatalog, canEdit: true },
  decorators: [withStore, withToaster],
  parameters: catalogParameters({ column: 'main', members: cafeProducts }),
  render: ({ catalog, canEdit, stageAddition }) => (
    <CatalogFormFor
      catalog={catalog}
      values={stageAddition ? { staged_products: { adds: [products[2]], removes: [] } } : {}}
    >
      {(form) => (
        <DeferredProductMembershipCard
          parentId={catalog.id}
          storeId={shellStore.id}
          canEdit={canEdit}
          useProducts={useCatalogProducts}
          listMembersPage={listCatalogProductsPage}
          translationNamespace="admin.catalogs"
          renderSubRows={(rows) =>
            catalogVariantRows<CatalogProduct>({
              products: rows,
              variantsOf: (product) => product.catalog_variants,
            })
          }
          extraColumns={(rows) =>
            mergeExtraColumns(
              catalogPriceColumns({
                headers: {
                  price: t('admin.catalogs.prices.column_price'),
                  source: t('admin.catalogs.prices.column_source'),
                },
              }),
              catalogTermColumns({
                form,
                canEdit,
                savedTermFor: savedTermLookup(rows),
                headers: {
                  minimum: t('admin.catalogs.terms.column_minimum'),
                  multiple: t('admin.catalogs.terms.column_multiple'),
                  minimumLabel: t('admin.fields.minimum_order_quantity.label'),
                  multipleLabel: t('admin.fields.order_multiple.label'),
                  minimumHelp: t('admin.catalogs.terms.help.minimum'),
                  multipleHelp: t('admin.catalogs.terms.help.multiple'),
                  invalid: t('admin.catalogs.terms.validation.positive_integer'),
                  mixed: t('admin.catalogs.terms.mixed'),
                  defaultHint: t('admin.catalogs.terms.inherits'),
                },
              }),
            )
          }
        />
      )}
    </CatalogFormFor>
  ),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

const minimums = () => screen.findAllByRole('spinbutton', { name: 'Minimum order quantity' })

function harbor(rules?: PermissionRule[]) {
  return catalogParameters({
    catalog: harborCatalog,
    column: 'main',
    members: harborProducts,
    rules,
  })
}

export const Adjusted: Story = {
  name: 'A percentage off',
  play: async () => {
    await screen.findByText('$15.30')
    await expect(screen.getAllByText('Adjusted')).toHaveLength(6)
    const [mug, apron] = await minimums()
    await expect(mug).toHaveValue(12)
    await expect(apron).toHaveAttribute('placeholder', '6')
  },
}

export const Entered: Story = {
  name: 'Prices entered by hand',
  args: { catalog: harborCatalog },
  parameters: harbor(),
  play: async () => {
    await screen.findByText('$14.00')
    await screen.findByRole('button', { name: '+2 tiers' })
    await expect(screen.getAllByText('Entered')).toHaveLength(5)
    await screen.findByText('Shop price')
  },
}

export const TierPreview: Story = {
  name: 'A price with quantity breaks, previewed',
  args: { catalog: harborCatalog },
  parameters: harbor(),
  play: async () => {
    await userEvent.hover(await screen.findByRole('button', { name: '+2 tiers' }))
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent(
        'What this agreement charges',
      ),
    )
    const preview = document.querySelector('[data-slot="tooltip-content"]') as HTMLElement
    await expect(preview).toHaveTextContent('From 48')
    await expect(preview).toHaveTextContent('$12.00')
  },
}

export const SourceExplained: Story = {
  name: 'Where a price comes from, explained',
  args: { catalog: harborCatalog },
  parameters: harbor(),
  play: async () => {
    await userEvent.hover(
      await screen.findByRole('button', {
        name: 'The normal shop price — this catalog does not price this product.',
      }),
    )
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent(
        'The normal shop price — this catalog does not price this product.',
      ),
    )
  },
}

export const AddedProduct: Story = {
  name: 'A product added, priced after Save',
  args: { stageAddition: true },
  play: async () => {
    await screen.findByText('Slate cap')
    await screen.findByText('After save')
  },
}

export const TermEdited: Story = {
  name: "A product's own minimum",
  play: async () => {
    const [, apron] = await minimums()
    await userEvent.type(apron, '24')
    await expect(apron).toHaveValue(24)
  },
}

export const TermNotWhole: Story = {
  name: "A product's minimum that is not whole",
  play: async () => {
    const [, apron] = await minimums()
    await userEvent.type(apron, '2.5')
    await screen.findByText('Enter a whole number greater than zero, or leave blank.')
  },
}

export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  args: { canEdit: false },
  play: async () => {
    const [mug] = await minimums()
    await expect(mug).toBeDisabled()
    await expect(screen.queryByRole('button', { name: 'Add products' })).not.toBeInTheDocument()
  },
}
