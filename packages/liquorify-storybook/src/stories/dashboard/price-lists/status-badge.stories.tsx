import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { PriceListStatusBadge } from '../../../../../dashboard/src/components/spree/price-list-editors/status-badge'
import {
  draftList,
  inactiveList,
  liveScheduledList,
  scheduledList,
  tradeList,
} from '../../../fixtures/admin/merchandising'

/**
 * A price list's status beside its name (DA-PRD-15, DA-PRD-17). A scheduled
 * list whose start has passed reads as active, since it is applying now.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Status badge',
  component: PriceListStatusBadge,
  tags: ['CMP-DA-G-13'],
  args: { priceList: tradeList },
} satisfies Meta<typeof PriceListStatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  play: async () => {
    await screen.findByText('Active')
  },
}

export const Scheduled: Story = {
  args: { priceList: scheduledList },
  play: async () => {
    await screen.findByText('Scheduled')
  },
}

export const ScheduledAndLive: Story = {
  name: 'Scheduled and live',
  args: { priceList: liveScheduledList },
  play: async () => {
    await screen.findByText('Active')
  },
}

export const Draft: Story = {
  args: { priceList: draftList },
  play: async () => {
    await screen.findByText('Draft')
  },
}

export const Inactive: Story = {
  args: { priceList: inactiveList },
  play: async () => {
    await screen.findByText('Inactive')
  },
}

// Deactivated stays deactivated even if Spree still reports it live.
export const InactiveReportedLive: Story = {
  name: 'Inactive, reported live',
  args: { priceList: { ...inactiveList, currently_active: true } },
  play: async () => {
    await screen.findByText('Inactive')
  },
}
