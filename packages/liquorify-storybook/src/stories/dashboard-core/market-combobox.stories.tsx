import { MarketMultiCombobox } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { markets } from '../../fixtures/admin/settings'

/**
 * The markets a price list's market rule applies in (DA-PRD-16, DA-PRD-17),
 * picked as chips with the selection held as the rule editor holds it.
 */
function MarketRule({ initial = [], disabled }: { initial?: string[]; disabled?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <MarketMultiCombobox
      markets={markets}
      value={value}
      onValueChange={setValue}
      disabled={disabled}
    />
  )
}

const meta = {
  title: 'Dashboard core/Market combobox',
  component: MarketRule,
  tags: ['CMP-CORE-15'],
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof MarketRule>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async () => {
    await screen.findByPlaceholderText('Search markets…')
  },
}

export const Chosen: Story = {
  args: { initial: [markets[1].id, markets[2].id] },
  play: async () => {
    await screen.findByText('Europe')
    await screen.findByText('United Kingdom')
  },
}

export const Open: Story = {
  args: { initial: [markets[1].id] },
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByPlaceholderText('Search markets…'))
    await screen.findByRole('option', { name: 'North America' })
  },
}

export const Picking: Story = {
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search markets…'), 'eur')
    await userEvent.click(await screen.findByRole('option', { name: 'Europe' }))
    await expect(screen.getByPlaceholderText('Search markets…')).toHaveValue('')
  },
}

export const NoMatch: Story = {
  name: 'No match',
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search markets…'), 'asia')
    await screen.findByText('No markets match')
  },
}

// A market the store has since deleted still shows, by its id, until removed.
export const UnknownMarket: Story = {
  name: 'Unknown market',
  args: { initial: [markets[0].id, 'mkt_9Zz9Zz9Z'] },
  play: async () => {
    await screen.findByText('mkt_9Zz9Zz9Z')
  },
}

export const Disabled: Story = {
  args: { initial: [markets[0].id], disabled: true },
}
