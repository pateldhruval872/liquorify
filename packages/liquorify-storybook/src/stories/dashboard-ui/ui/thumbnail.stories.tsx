import { PackageIcon } from '@spree/dashboard-ui/icons'
import { Thumbnail } from '@spree/dashboard-ui/ui/thumbnail'
import type { Meta, StoryObj } from '@storybook/react-vite'

const sizes = ['xs', 'sm', 'md', 'lg'] as const

const meta = {
  title: 'Dashboard UI/Primitives/Thumbnail',
  component: Thumbnail,
  tags: ['CMP-DUI-P-44'],
  args: { src: '/fixtures/product-sand.png', alt: 'Linen shirt' },
} satisfies Meta<typeof Thumbnail>

export default meta
type Story = StoryObj<typeof meta>

export const Image: Story = {}

export const Placeholder: Story = { args: { src: null } }

export const CustomFallback: Story = {
  name: 'Custom fallback',
  args: { src: null, fallback: <PackageIcon /> },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {sizes.map((size) => (
        <Thumbnail key={size} {...args} size={size} />
      ))}
      {sizes.map((size) => (
        <Thumbnail key={size} size={size} />
      ))}
    </div>
  ),
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['rounded', 'square', 'circle'] as const).map((shape) => (
        <Thumbnail key={shape} {...args} shape={shape} size="lg" />
      ))}
    </div>
  ),
}
