import { ALL_CURRENCY_CODES, CurrencySelect } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'

const meta = {
  title: 'Dashboard core/Currency select',
  component: CurrencySelect,
  tags: ['CMP-CORE-08'],
  args: { onChange: () => {} },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
    withStore,
  ],
  // The store trades in US dollars and euros, US dollars first.
  parameters: storeParameters(),
} satisfies Meta<typeof CurrencySelect>

export default meta
type Story = StoryObj<typeof meta>

const opened = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: /^EUR/ })
  },
} satisfies Story

// With nothing chosen, the field shows the store's default currency.
export const StoreDefault: Story = { name: 'Store default' }

export const Selected: Story = { args: { value: 'EUR' } }

export const Open: Story = opened

// A market may use any currency, not only the ones the store already trades in.
export const AnyCurrency: Story = {
  name: 'Any currency, searched',
  args: { options: ALL_CURRENCY_CODES, value: 'GBP' },
  parameters: opened.parameters,
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await userEvent.type(screen.getByPlaceholderText('Search currencies…'), 'franc')
    await screen.findByRole('option', { name: /^CHF/ })
  },
}

export const NothingFound: Story = {
  ...opened,
  name: 'Nothing found',
  play: async () => {
    await opened.play()
    await userEvent.type(screen.getByPlaceholderText('Search currencies…'), 'yen')
    await screen.findByText('No currencies found')
  },
}

export const Invalid: Story = { args: { invalid: true } }

export const Disabled: Story = { args: { value: 'EUR', disabled: true } }

// The size used beside the toolbar's other controls.
export const Small: Story = { args: { triggerSize: 'sm', value: 'EUR' } }
