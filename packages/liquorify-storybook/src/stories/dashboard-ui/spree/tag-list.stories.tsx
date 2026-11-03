import { TagList } from '@spree/dashboard-ui/spree/tag-list'
import type { Meta, StoryObj } from '@storybook/react-vite'

// The products table's tags column (DA-PRD-01).
const meta = {
  title: 'Dashboard UI/Composed/Tag list',
  component: TagList,
  tags: ['CMP-DUI-C-50'],
} satisfies Meta<typeof TagList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { tags: ['handmade', 'ceramic'] },
}

// A narrow column wraps the badges onto further lines.
export const Wrapping: Story = {
  args: { tags: ['handmade', 'ceramic', 'gift idea', 'dishwasher safe', 'limited run'] },
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
}

export const NoTags: Story = {
  name: 'No tags',
  args: { tags: [] },
}
