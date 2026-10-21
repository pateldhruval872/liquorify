import { CheckIcon } from '@spree/dashboard-ui/icons'
import { ActiveBadge, Badge, StatusBadge, StatusDot } from '@spree/dashboard-ui/ui/badge'
import type { Meta, StoryObj } from '@storybook/react-vite'

const variants = [
  'default',
  'secondary',
  'destructive',
  'success',
  'info',
  'warning',
  'outline',
  'ghost',
  'link',
] as const

const meta = {
  title: 'Dashboard UI/Primitives/Badge',
  component: Badge,
  tags: ['CMP-DUI-P-05'],
  args: { children: 'Paid' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  name: 'With icon',
  args: {
    variant: 'success',
    children: (
      <>
        <CheckIcon data-icon="inline-start" />
        Fulfilled
      </>
    ),
  },
}

export const Linked: Story = {
  render: () => (
    <Badge asChild variant="info">
      <a href="#order">Order R123456789</a>
    </Badge>
  ),
}

// Status codes from the shared tone map, one per tone, with the labels the
// app layer passes in.
export const Statuses: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusBadge status="paid" label="Paid" />
      <StatusBadge status="balance_due" label="Balance due" />
      <StatusBadge status="failed" label="Failed" />
      <StatusBadge status="in_transit" label="In transit" />
      <StatusBadge status="draft" label="Draft" />
      <StatusBadge status="partially_refunded" />
    </div>
  ),
}

export const Dots: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['success', 'warning', 'destructive', 'info', 'neutral'] as const).map((tone) => (
        <StatusDot key={tone} status={tone} tone={tone} />
      ))}
    </div>
  ),
}

export const Active: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ActiveBadge active />
      <ActiveBadge active={false} />
      <ActiveBadge active activeLabel="Enabled" inactiveLabel="Disabled" />
      <ActiveBadge active={false} dashWhenInactive />
    </div>
  ),
}
