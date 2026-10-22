import { Textarea } from '@spree/dashboard-ui/ui/textarea'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Textarea',
  component: Textarea,
  tags: ['CMP-DUI-P-43'],
  args: { placeholder: 'Add a note for your team', 'aria-label': 'Note' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: {
    defaultValue:
      'The customer asked for the order to be gift wrapped and sent without a printed receipt.',
  },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 'Read only note' } }

export const Invalid: Story = { args: { 'aria-invalid': true } }

export const Focused: Story = {
  play: async () => {
    await userEvent.tab()
  },
}
