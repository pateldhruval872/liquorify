import type { CustomFieldDefinition, Product, ProductType } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http } from 'msw'
import { expect, screen } from 'storybook/test'
import { CustomFieldsInlineCard } from '../../../../../dashboard/src/components/spree/custom-fields/custom-fields-inline'
import { ProductCustomFieldsProvider } from '../../../../../dashboard/src/components/spree/products/product-custom-fields-provider'
import { withStore } from '../../../decorators/store'
import {
  clayMug,
  linenApron,
  productFieldDefinitions,
  productTypes,
  slateCap,
} from '../../../fixtures/admin/catalog'
import {
  customFieldDefinitionList,
  productTypeRequests,
} from '../../../mocks/handlers/admin/catalog'
import { ProductFormFor, productParameters } from '../../dashboard-core/products/product-form'

/**
 * The product page's custom fields, narrowed to the product's type. The
 * provider draws nothing of its own, so its stories show the Custom fields
 * card it feeds: the type decides which fields show, in its order, and marks
 * the ones it recommends; a product with no type shows every product field.
 */
function TypedCustomFields({ product }: { product: Product }) {
  return (
    <ProductFormFor product={product}>
      {(form) => (
        <ProductCustomFieldsProvider form={form} productTypeId={product.product_type_id}>
          <CustomFieldsInlineCard />
        </ProductCustomFieldsProvider>
      )}
    </ProductFormFor>
  )
}

const [mugType] = productTypes
const [care, releaseYear, , dishwasherSafe] = productFieldDefinitions

/** The type's own entry for a field it adds, in the order it sets. */
const typeField = (definition: CustomFieldDefinition, sortOrder: number, required = false) => ({
  id: definition.id,
  key: definition.key,
  namespace: definition.namespace,
  label: definition.label,
  field_type: definition.field_type,
  required,
  sort_order: sortOrder,
})

/** The Mug type adding three fields, release year first, and recommending care instructions. */
const recommendingMug: ProductType = {
  ...mugType,
  custom_field_definitions: [
    typeField(releaseYear, 1),
    typeField(care, 2, true),
    typeField(dishwasherSafe, 3),
  ],
}

const page = (product: Product, types = productTypeRequests()) =>
  productParameters({
    product,
    handlers: {
      customFieldDefinitions: customFieldDefinitionList(productFieldDefinitions),
      productTypes: types,
    },
  })

const meta = {
  title: 'Admin dashboard/Products/Product custom fields provider',
  component: TypedCustomFields,
  tags: ['CMP-DA-G-14'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: page(clayMug),
} satisfies Meta<typeof TypedCustomFields>

export default meta
type Story = StoryObj<typeof meta>

// The mug's type adds care instructions only, so the other five product
// fields stay off its page.
export const FromItsType: Story = {
  name: 'Fields from its type',
  play: async () => {
    await screen.findByLabelText('Care instructions')
    await expect(screen.queryByLabelText('Material')).toBeNull()
  },
}

export const Recommended: Story = {
  name: 'In the type’s order, one recommended',
  parameters: page(clayMug, productTypeRequests([recommendingMug, ...productTypes.slice(1)])),
  play: async () => {
    await screen.findByRole('switch', { name: 'Dishwasher safe' })
    await screen.findByTitle('Recommended by this product type')
  },
}

export const NoType: Story = {
  name: 'No type, every field',
  args: { product: slateCap },
  parameters: page(slateCap),
  play: async () => {
    await screen.findByLabelText('Specifications')
  },
}

// The apron's type adds no fields, so its page offers to set some up.
export const TypeWithoutFields: Story = {
  name: 'A type that adds no fields',
  args: { product: linenApron },
  parameters: page(linenApron),
  play: async () => {
    await screen.findByText('No custom fields yet')
  },
}

// While the type loads, the card has no fields to show and says the store
// has none, then fills in when the type arrives. The provider means to hold
// the space; the card shows its empty state instead, which looks like a Spree
// defect.
export const TypeLoading: Story = {
  name: 'Its type loading',
  parameters: page(clayMug, [
    http.get('/api/v3/admin/product_types/:id', async () => {
      await delay('infinite')
    }),
    ...productTypeRequests(),
  ]),
  play: async () => {
    await screen.findByText('No custom fields yet')
  },
}
