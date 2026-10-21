import { PlusIcon } from '@spree/dashboard-ui/icons'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Button',
  component: Button,
  tags: ['CMP-DUI-P-07'],
  args: { children: 'Save changes' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: 'Save all changes' } }

export const Planted: Story = { name: 'Planted, no reference', args: { variant: 'outline' } }

export const Outline: Story = { args: { variant: 'outline' } }

export const Ghost: Story = { args: { variant: 'ghost' } }

export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } }

export const DestructiveGhost: Story = {
  name: 'Destructive ghost',
  args: { variant: 'destructive-ghost', children: 'Remove' },
}

export const Link: Story = { args: { variant: 'link', children: 'View order' } }

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
      {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((size) => (
        <Button key={size} {...args} size={size} aria-label="Add">
          <PlusIcon />
        </Button>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  name: 'With icon',
  args: {
    children: (
      <>
        <PlusIcon />
        Add product
      </>
    ),
  },
}

export const Disabled: Story = { args: { disabled: true } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
