import { Separator } from '@spree/dashboard-ui/ui/separator'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Separator',
  component: Separator,
  tags: ['CMP-DUI-P-36'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64 text-sm">
      <p>Subtotal</p>
      <Separator {...args} className="my-2" />
      <p>Total</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Orders</span>
      <Separator {...args} orientation="vertical" />
      <span>Returns</span>
      <Separator {...args} orientation="vertical" />
      <span>Drafts</span>
    </div>
  ),
}
