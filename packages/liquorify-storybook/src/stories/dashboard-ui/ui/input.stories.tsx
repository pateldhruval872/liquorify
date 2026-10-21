import { Input } from '@spree/dashboard-ui/ui/input'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Input',
  component: Input,
  tags: ['CMP-DUI-P-25'],
  args: { placeholder: 'Search products', 'aria-label': 'Search products' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = { args: { defaultValue: 'Linen shirt' } }

export const NumberInput: Story = {
  name: 'Number',
  args: { type: 'number', defaultValue: '12', placeholder: '0' },
}

export const FileInput: Story = {
  name: 'File',
  args: { type: 'file', 'aria-label': 'Image' },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 'Linen shirt' } }

export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: 'linen shirt' } }

export const Focused: Story = {
  play: async () => {
    await userEvent.tab()
  },
}
