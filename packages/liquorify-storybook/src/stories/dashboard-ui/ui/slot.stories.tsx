import { Slot } from '@spree/dashboard-ui/ui/slot'
import type { Meta, StoryObj } from '@storybook/react-vite'

// Slot draws nothing itself: it passes its props to its one child, which is
// how `asChild` lets a button or badge render as a link.
const meta = {
  title: 'Dashboard UI/Primitives/Slot',
  component: Slot,
  tags: ['CMP-DUI-P-40'],
} satisfies Meta<typeof Slot>

export default meta
type Story = StoryObj<typeof meta>

export const MergesOntoChild: Story = {
  name: 'Merges onto child',
  render: () => (
    <Slot className="rounded-md border px-3 py-1.5 text-sm" style={{ display: 'inline-block' }}>
      <a href="#orders" className="font-medium text-primary">
        View orders
      </a>
    </Slot>
  ),
}
