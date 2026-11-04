import type { Catalog } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { CatalogTermsCard } from '../../../../../dashboard/src/components/spree/catalog-terms-card'
import { withStore } from '../../../decorators/store'
import { cafeCatalog, springCatalog } from '../../../fixtures/admin/merchandising'
import { CatalogFormFor, catalogParameters } from './catalog-form'

interface Args {
  catalog: Catalog
  canEdit: boolean
  validate?: boolean
  values?: Record<string, string>
}

/**
 * A catalog's commercial terms on the catalog page's sidebar (DA-PRD-14): the
 * least a buyer may order of one product and the step size, both defaults a
 * product can override on the products card, and the least a whole order
 * must come to, one minimum per store currency. Each term explains itself on
 * hover or focus.
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Catalog terms card',
  tags: ['CMP-DA-G-24'],
  args: { catalog: cafeCatalog, canEdit: true },
  decorators: [withStore],
  parameters: catalogParameters(),
  render: ({ catalog, canEdit, validate, values }) => (
    <CatalogFormFor catalog={catalog} validate={validate} values={values}>
      {(form) => <CatalogTermsCard form={form} canEdit={canEdit} />}
    </CatalogFormFor>
  ),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Terms: Story = {
  play: async () => {
    await expect(
      await screen.findByRole('spinbutton', { name: /^Minimum order quantity/ }),
    ).toHaveValue(6)
    await expect(screen.getByRole('spinbutton', { name: /^Order multiple/ })).toHaveValue(6)
    await expect(screen.getByRole('spinbutton', { name: 'Minimum amount' })).toHaveValue(150)
  },
}

export const NoTerms: Story = {
  name: 'No terms',
  args: { catalog: springCatalog },
  play: async () => {
    await screen.findByText('No order minimum. Buyers may check out with any total.')
    await expect(
      screen.getByRole('spinbutton', { name: /^Minimum order quantity/ }),
    ).toHaveAttribute('placeholder', 'No rule')
  },
}

export const TermExplained: Story = {
  name: 'A term explained',
  parameters: catalogParameters({ viewport: true }),
  play: async () => {
    await userEvent.hover(await screen.findByRole('button', { name: /^The step size\./ }))
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent(
        /^The step size\./,
      ),
    )
  },
}

export const AddingMinimum: Story = {
  name: 'Adding a minimum in another currency',
  play: async () => {
    await screen.findByRole('spinbutton', { name: 'Minimum amount' })
    // Add offers the next store currency, so it stays disabled until the store loads.
    const add = screen.getByRole('button', { name: 'Add' })
    await waitFor(() => expect(add).toBeEnabled())
    await userEvent.click(add)
    const amounts = await screen.findAllByRole('spinbutton', { name: 'Minimum amount' })
    await expect(amounts).toHaveLength(2)
    await expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  },
}

export const AmountNotPositive: Story = {
  name: 'A minimum below zero',
  play: async () => {
    const amount = await screen.findByRole('spinbutton', { name: 'Minimum amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '-5')
    await screen.findByText('Enter an amount greater than zero.')
  },
}

export const QuantityNotWhole: Story = {
  name: 'A quantity that is not whole',
  args: { values: { minimum_order_quantity: '2.5' }, validate: true },
  play: async () => {
    const field = await screen.findByRole('spinbutton', { name: /^Minimum order quantity/ })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await screen.findByText('Enter a whole number greater than zero, or leave blank.')
  },
}

export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  args: { canEdit: false },
  play: async () => {
    await expect(
      await screen.findByRole('spinbutton', { name: /^Minimum order quantity/ }),
    ).toBeDisabled()
    await expect(screen.getByRole('spinbutton', { name: 'Minimum amount' })).toBeDisabled()
    await expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    // The minimum's currency stays selectable: the card does not pass the role
    // to it. The page shows this role no Save, so a change goes nowhere.
    await expect(screen.getByRole('combobox')).toBeEnabled()
  },
}
