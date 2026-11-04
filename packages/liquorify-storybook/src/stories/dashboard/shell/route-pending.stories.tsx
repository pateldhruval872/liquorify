import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import {
  ResourceDetailSkeleton,
  RoutePending,
} from '../../../../../dashboard/src/components/spree/route-pending'

/**
 * What shows while a page loads: a title and body for any page, and for a
 * record's page, such as a catalog's (DA-PRD-14), its header with the main
 * column and sidebar, so the page does not shift when the record arrives.
 */
const meta = {
  title: 'Admin dashboard/Shell/Route pending',
  component: RoutePending,
  tags: ['CMP-DA-G-24'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof RoutePending>

export default meta
type Story = StoryObj<typeof meta>

export const AnyPage: Story = {
  name: 'Any page',
  play: async () => {
    await screen.findByRole('status')
  },
}

export const RecordPage: StoryObj<typeof ResourceDetailSkeleton> = {
  name: 'Record page',
  render: () => <ResourceDetailSkeleton />,
  play: async () => {
    await screen.findByRole('status')
  },
}

export const RecordPageWithoutSidebar: StoryObj<typeof ResourceDetailSkeleton> = {
  name: 'Record page, without a sidebar',
  render: () => <ResourceDetailSkeleton sidebar={false} />,
  play: async () => {
    await screen.findByRole('status')
  },
}
