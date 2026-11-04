import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { CustomerRuleEditor } from '../../../../../dashboard/src/components/spree/price-list-editors/rule-customer'
import { withStore } from '../../../decorators/store'
import { customerRule } from '../../../fixtures/admin/merchandising'
import { searchCustomers } from '../../../fixtures/admin/shell'
import { RuleSheet, ruleSheetParameters } from './rule-sheet'

/**
 * The customer rule's editor (DA-PRD-17), for named customers. Like the
 * customer group rule, Spree no longer offers it for new rules, and a list
 * that has one still shows and edits it.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Customer rule editor',
  tags: ['CMP-DA-G-13'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: ruleSheetParameters,
  render: (args) => (
    <RuleSheet editor={CustomerRuleEditor} rule={customerRule} type="user_rule" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(searchCustomers[0].email as string)
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={CustomerRuleEditor} type="user_rule" {...args} />,
  play: async () => {
    await screen.findByText('Customers')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText(searchCustomers[0].email as string)
    await userEvent.type(screen.getByRole('combobox'), 'tote')
    await screen.findByRole('option', { name: searchCustomers[0].email as string })
  },
}
