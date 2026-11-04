import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { TypePickerSheet } from '../../../../../dashboard/src/components/spree/type-picker-sheet'
import { priceRuleTypes } from '../../../fixtures/admin/merchandising'

const offered = priceRuleTypes.filter((type) => !type.superseded)

/**
 * The sheet a price list's Add rule opens (DA-PRD-17): the rule kinds Spree
 * registers, less those it no longer offers and those the list already has.
 * Picking one opens its editor.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Type picker sheet',
  component: TypePickerSheet,
  tags: ['CMP-DA-G-24'],
  args: {
    family: 'price_rule',
    types: offered,
    title: 'Add rule',
    description: 'Pick a rule type to configure.',
    emptyMessage: 'Every available rule type is already on this list.',
    open: true,
    onOpenChange: fn(),
    onPicked: fn(),
  },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof TypePickerSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Kinds: Story = {
  play: async () => {
    await screen.findByText('Volume pricing')
    await expect(screen.queryByText('Customer group')).toBeNull()
  },
}

// The trade list already has volume and channel rules.
export const SomeUsed: Story = {
  name: 'Some already used',
  args: { types: offered.filter((type) => type.type === 'market_rule') },
  play: async () => {
    await screen.findByText('Market')
  },
}

export const AllUsed: Story = {
  name: 'All already used',
  args: { types: [] },
  play: async () => {
    await screen.findByText('Every available rule type is already on this list.')
  },
}

export const NoneRegistered: Story = {
  name: 'None registered',
  args: { types: [], emptyMessage: 'No rule types registered.' },
  play: async () => {
    await screen.findByText('No rule types registered.')
  },
}

export const Picking: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: /Volume pricing/ }))
    await expect(args.onPicked).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'volume_rule' }),
    )
  },
}
