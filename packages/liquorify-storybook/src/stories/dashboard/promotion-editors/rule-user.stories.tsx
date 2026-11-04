import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { UserRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-user'
import { withStore } from '../../../decorators/store'
import { loyalRules, morgan, tom } from '../../../fixtures/admin/loyalty'
import { pickerForbidden, promotionPickers } from '../../../mocks/handlers/admin/loyalty'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [customerRule] = loyalRules

/**
 * The customer rule's editor (DA-PRM-02, DA-PRM-03): the shoppers the
 * promotion is for, searched by name or email.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Customer rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={UserRuleEditor} rule={customerRule} type="customer" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(morgan.full_name as string)
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={UserRuleEditor} type="customer" {...args} />,
  play: async () => {
    await screen.findByPlaceholderText('Search customers by name or email…')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Searching: Story = {
  play: async () => {
    await screen.findByText(morgan.full_name as string)
    await userEvent.type(screen.getByRole('combobox'), 'tom')
    await screen.findByRole('option', { name: tom.full_name as string })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText(morgan.full_name as string)
    await userEvent.type(screen.getByRole('combobox'), 'tom')
    await userEvent.click(await screen.findByRole('option', { name: tom.full_name as string }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ customer_ids: expect.arrayContaining([tom.id]) }),
    )
  },
}

/**
 * The marketer may not read customers, so Spree refuses both the search and
 * the read back of a saved rule's customers, which show as ids.
 */
export const MayNotReadCustomers: Story = {
  name: 'May not read customers',
  parameters: editorSheetParameters({
    pickers: [...pickerForbidden('customers'), ...promotionPickers],
  }),
  play: async () => {
    const sheet = await screen.findByRole('dialog')
    await within(sheet).findByText(morgan.id)
    await userEvent.type(within(sheet).getByRole('combobox'), 'tom')
    await screen.findByText('No customers match', {}, { timeout: 15_000 })
  },
}
