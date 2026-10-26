import { StateCombobox } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { countries } from '../../fixtures/admin/countries'

const unitedStatesStates = countries.find((country) => country.iso === 'US')?.states ?? []

const meta = {
  title: 'Dashboard core/Country state fields',
  component: StateCombobox,
  tags: ['CMP-CORE-07'],
  args: { countryCode: 'US', states: unitedStatesStates, value: null, onValueChange: () => {} },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StateCombobox>

export default meta
type Story = StoryObj<typeof meta>

const opened = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'New York' })
  },
} satisfies Story

export const Placeholder: Story = {}

export const Selected: Story = { args: { value: 'TX' } }

export const Invalid: Story = { args: { invalid: true } }

export const Disabled: Story = { args: { value: 'TX', disabled: true } }

export const Open: Story = { ...opened, args: { value: 'CA' } }

export const NothingFound: Story = {
  ...opened,
  name: 'Nothing found',
  play: async () => {
    await opened.play()
    await userEvent.type(screen.getByPlaceholderText('Search states…'), 'Bavaria')
    await screen.findByText('No states found')
  },
}
