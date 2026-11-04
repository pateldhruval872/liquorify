import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { MarketRuleEditor } from '../../../../../dashboard/src/components/spree/price-list-editors/rule-market'
import { withStore } from '../../../decorators/store'
import { marketRule } from '../../../fixtures/admin/merchandising'
import { markets } from '../../../fixtures/admin/settings'
import { RuleSheet, ruleSheetParameters } from './rule-sheet'

/**
 * The market rule's editor (DA-PRD-17): the markets the list's prices apply
 * in, or every market when none is chosen.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Market rule editor',
  tags: ['CMP-DA-G-13'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: ruleSheetParameters,
  render: (args) => (
    <RuleSheet editor={MarketRuleEditor} rule={marketRule} type="market_rule" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText('North America')
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={MarketRuleEditor} type="market_rule" {...args} />,
  play: async () => {
    await screen.findByText('Markets')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText('North America')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Europe' }))
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('North America')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Europe' }))
    // The list stays open for more picks; Escape closes it.
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          market_ids: expect.arrayContaining([markets[1].id]),
        }),
      }),
    )
  },
}
