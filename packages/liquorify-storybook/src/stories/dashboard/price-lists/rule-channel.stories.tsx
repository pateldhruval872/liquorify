import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { ChannelRuleEditor } from '../../../../../dashboard/src/components/spree/price-list-editors/rule-channel'
import { withStore } from '../../../decorators/store'
import { tradeRules } from '../../../fixtures/admin/merchandising'
import { channels } from '../../../fixtures/admin/settings'
import { RuleSheet, ruleSheetParameters } from './rule-sheet'

/**
 * The channel rule's editor (DA-PRD-17): the sales channels the list's
 * prices apply on, or every channel when none is chosen.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Channel rule editor',
  tags: ['CMP-DA-G-13'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: ruleSheetParameters,
  render: (args) => (
    <RuleSheet editor={ChannelRuleEditor} rule={tradeRules[1]} type="channel_rule" {...args} />
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
  render: (args) => <RuleSheet editor={ChannelRuleEditor} type="channel_rule" {...args} />,
  play: async () => {
    await screen.findByText('Sales channels')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText('Wholesale')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Online Store' }))
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('Wholesale')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Online Store' }))
    // The list stays open for more picks; Escape closes it.
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          channel_ids: expect.arrayContaining([channels[0].id]),
        }),
      }),
    )
  },
}
