import type { CustomFieldDefinition } from '@spree/admin-sdk'
import type { CustomFieldFormValues } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import {
  CustomFieldsInlineCard,
  FormBackedCustomFieldsProvider,
} from '../../../../../dashboard/src/components/spree/custom-fields/custom-fields-inline'
import { withStore } from '../../../decorators/store'
import { productFieldDefinitions, slateCap } from '../../../fixtures/admin/catalog'
import {
  customFieldDefinitionList,
  customFieldDefinitionsHeld,
} from '../../../mocks/handlers/admin/catalog'
import { resourceTypeList } from '../../../mocks/handlers/admin/settings'
import { ProductFormFor, productParameters } from '../../dashboard-core/products/product-form'

/**
 * The Custom fields card as the product page holds it (DA-PRD-02, DA-PRD-03):
 * one field for each of the store's product definitions, kept in the page's
 * form and saved with it. The cap has no product type, so every definition
 * shows; how a type narrows them is the product custom fields provider's
 * stories. The card's other mode, saving on its own, belongs to the customer
 * and order pages.
 */
function CustomFields({ values }: { values?: CustomFieldFormValues[] }) {
  return (
    <ProductFormFor product={slateCap} values={values ? { custom_fields: values } : undefined}>
      {(form) => (
        <FormBackedCustomFieldsProvider form={form} resourceType="product">
          <CustomFieldsInlineCard />
        </FormBackedCustomFieldsProvider>
      )}
    </ProductFormFor>
  )
}

/**
 * The cap's page, with the store's product definitions answered by
 * `definitions`, and the kinds of record a new definition can belong to.
 */
const card = (definitions = customFieldDefinitionList(productFieldDefinitions), viewport = false) =>
  productParameters({
    product: slateCap,
    viewport,
    handlers: { customFieldDefinitions: definitions, resourceTypes: resourceTypeList },
  })

const [care, releaseYear, material, dishwasherSafe, story, specifications] = productFieldDefinitions

const value = (definition: CustomFieldDefinition, fieldValue: unknown) => ({
  custom_field_definition_id: definition.id,
  value: fieldValue,
})

const meta = {
  title: 'Admin dashboard/Custom fields/Custom fields inline card',
  component: CustomFields,
  tags: ['CMP-DA-G-06'],
  decorators: [withStore],
  parameters: card(),
} satisfies Meta<typeof CustomFields>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  name: 'Every kind, empty',
  play: async () => {
    await screen.findByLabelText('Specifications')
  },
}

export const Filled: Story = {
  args: {
    values: [
      value(care, 'Hand wash to keep the glaze bright. Not for the microwave.'),
      value(releaseYear, 2026),
      value(material, 'Stoneware'),
      value(dishwasherSafe, true),
      value(story, '<p>Thrown on the wheel in small batches, then glazed by hand.</p>'),
      value(specifications, { capacity_ml: 350, height_cm: 9.5 }),
    ],
  },
  play: async () => {
    await expect(await screen.findByLabelText('Material')).toHaveValue('Stoneware')
  },
}

// A keystroke the number field cannot read keeps the value it had.
export const NumberTyped: Story = {
  name: 'A number typed',
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Release year'), '2025')
    await expect(screen.getByLabelText('Release year')).toHaveValue(2025)
  },
}

export const Loading: Story = {
  parameters: card(customFieldDefinitionsHeld),
}

export const NoFields: Story = {
  name: 'No fields yet',
  parameters: card(customFieldDefinitionList([])),
  play: async () => {
    await screen.findByText('No custom fields yet')
  },
}

// From the empty state a merchant can define the first field without leaving
// the page. The sheet's fields are the definition form's stories (DA-SET-09).
export const NewField: Story = {
  name: 'Setting up the first field',
  parameters: card(customFieldDefinitionList([]), true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Set up custom fields' }))
    await screen.findByText('New custom field')
  },
}
