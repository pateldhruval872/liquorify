import { CheckIcon } from '@spree/dashboard-ui/icons'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@spree/dashboard-ui/ui/avatar'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Avatar',
  component: Avatar,
  tags: ['CMP-DUI-P-04'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Image: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="/fixtures/avatar.png" alt="Avery Jordan" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  ),
}

export const Initials: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}

export const WithBadge: Story = {
  name: 'With badge',
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>AJ</AvatarFallback>
          <AvatarBadge>
            <CheckIcon />
          </AvatarBadge>
        </Avatar>
      ))}
    </div>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="/fixtures/avatar.png" alt="Avery Jordan" />
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
}
