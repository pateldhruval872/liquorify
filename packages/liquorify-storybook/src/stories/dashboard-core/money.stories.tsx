import { Money } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'

/**
 * An amount from the API, in the admin's own number format, as a catalog's
 * price column (DA-PRD-14) and a price list's prices (DA-PRD-16, DA-PRD-17)
 * show it. The amount is the API's canonical decimal string.
 */
const meta = {
  title: 'Dashboard core/Money',
  component: Money,
  tags: ['CMP-CORE-18'],
  args: { amount: '18.00', currency: 'USD' },
  decorators: [
    (Story) => (
      <span className="text-sm tabular-nums">
        <Story />
      </span>
    ),
    withStore,
  ],
  parameters: storeParameters(),
} satisfies Meta<typeof Money>

export default meta
type Story = StoryObj<typeof meta>

export const Dollars: Story = {
  play: async () => {
    await screen.findByText('$18.00')
  },
}

// Without a currency the amount is the store's default, US dollars here.
export const StoreCurrency: Story = {
  name: 'Store currency',
  args: { amount: '1249.5', currency: undefined },
  play: async () => {
    await screen.findByText('$1,249.50')
  },
}

export const Euros: Story = {
  args: { amount: '16.50', currency: 'EUR' },
  play: async () => {
    await screen.findByText('€16.50')
  },
}

// A currency with no minor unit shows none.
export const Yen: Story = {
  args: { amount: '2400', currency: 'JPY' },
  play: async () => {
    await screen.findByText('¥2,400')
  },
}

export const Negative: Story = {
  args: { amount: '-4.25', currency: 'USD' },
  play: async () => {
    await expect(await screen.findByText(/4\.25/)).toHaveTextContent('-$4.25')
  },
}

export const Missing: Story = {
  args: { amount: null },
  play: async () => {
    await screen.findByText('—')
  },
}

// A catalog's price column names a product it does not price.
export const MissingWithFallback: Story = {
  name: 'Missing, with fallback',
  args: { amount: null, fallback: 'No price' },
  play: async () => {
    await screen.findByText('No price')
  },
}
