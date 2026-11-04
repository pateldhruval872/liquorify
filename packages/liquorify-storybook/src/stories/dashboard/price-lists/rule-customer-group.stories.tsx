import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { CustomerGroupRuleEditor } from '../../../../../dashboard/src/components/spree/price-list-editors/rule-customer-group'
import { withStore } from '../../../decorators/store'
import { customerGroups, tradeRules } from '../../../fixtures/admin/merchandising'
import { RuleSheet, ruleSheetParameters } from './rule-sheet'

/**
 * The customer group rule's editor (DA-PRD-17). Spree no longer offers the
 * kind for new rules, since catalogs now say who a price is for, but a list
 * that has one, like Spree's sample list, still shows and edits it.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Customer group rule editor',
  tags: ['CMP-DA-G-13'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: ruleSheetParameters,
  render: (args) => (
    <RuleSheet
      editor={CustomerGroupRuleEditor}
      rule={tradeRules[2]}
      type="customer_group_rule"
      {...args}
    />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText('Wholesale')
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => (
    <RuleSheet editor={CustomerGroupRuleEditor} type="customer_group_rule" {...args} />
  ),
  play: async () => {
    await screen.findByText('Customer groups')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText('Wholesale')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'VIP' }))
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('Wholesale')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'VIP' }))
    // The list stays open for more picks; Escape closes it.
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          customer_group_ids: expect.arrayContaining([customerGroups[1].id]),
        }),
      }),
    )
  },
}
