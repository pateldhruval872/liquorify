import { CountryCombobox } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { countries } from '../../mocks/handlers/admin/countries'

const meta = {
  title: 'Dashboard core/Country combobox',
  component: CountryCombobox,
  tags: ['CMP-CORE-06'],
  args: { value: null, onValueChange: () => {} },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  parameters: { msw: { handlers: { countries } } },
} satisfies Meta<typeof CountryCombobox>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Selected: Story = { args: { value: 'DE' } }

export const Disabled: Story = { args: { value: 'DE', disabled: true } }

export const Invalid: Story = { args: { invalid: true } }

export const Open: Story = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByText('Germany')
  },
}
