import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { ProductRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-product'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { winterRules } from '../../../fixtures/admin/loyalty'
import { pickerForbidden, promotionPickers } from '../../../mocks/handlers/admin/loyalty'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [productRule] = winterRules

/**
 * The product rule's editor (DA-PRM-02, DA-PRM-03): whether the order must
 * hold any, all or none of the chosen products, and the products, searched by
 * name.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Product rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={ProductRuleEditor} rule={productRule} type="product" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(clayMug.name)
    await expect(screen.getByRole('radio', { name: /Any of these products/ })).toBeChecked()
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={ProductRuleEditor} type="product" {...args} />,
  play: async () => {
    await screen.findByPlaceholderText('Search products by name…')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Searching: Story = {
  play: async () => {
    await screen.findByText(clayMug.name)
    await userEvent.type(screen.getByRole('combobox'), 'apron')
    await screen.findByRole('option', { name: linenApron.name })
  },
}

export const NoneOfThem: Story = {
  name: 'None of these products',
  play: async () => {
    await screen.findByText(clayMug.name)
    await userEvent.click(screen.getByRole('radio', { name: /None of these products/ }))
    await expect(screen.getByRole('radio', { name: /None of these products/ })).toBeChecked()
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText(clayMug.name)
    await userEvent.type(screen.getByRole('combobox'), 'apron')
    await userEvent.click(await screen.findByRole('option', { name: linenApron.name }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('radio', { name: /All of these products/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ match_policy: 'all' }),
        product_ids: expect.arrayContaining([linenApron.id]),
      }),
    )
  },
}

/**
 * The marketer may write promotions and read nothing else, so Spree refuses
 * the product list. The editor reads a saved rule's products back by id, so
 * they show as ids, and a search finds nothing.
 */
export const MayNotReadProducts: Story = {
  name: 'May not read products',
  parameters: editorSheetParameters({
    pickers: [...pickerForbidden('products'), ...promotionPickers],
  }),
  play: async () => {
    const sheet = await screen.findByRole('dialog')
    await within(sheet).findByText(clayMug.id)
    await userEvent.type(within(sheet).getByRole('combobox'), 'apron')
    await screen.findByText('No products match', {}, { timeout: 15_000 })
  },
}
