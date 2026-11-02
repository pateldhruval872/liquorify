import { JsonPreviewDrawer } from '@spree/dashboard-ui/spree/json-preview-drawer'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { spreeJsonLinkResolver } from '../../../../../dashboard/src/lib/json-link-resolver'
import { adminUser } from '../../../fixtures/admin/session'
import { orderSyncEndpoint } from '../../../fixtures/admin/webhooks'

const storeId = adminUser.stores[0].id
const nothing = () => {}

const meta = {
  title: 'Dashboard UI/Composed/JSON preview drawer',
  component: JsonPreviewDrawer,
  tags: ['CMP-DUI-C-27'],
  // Opened from a webhook endpoint's page header (DA-SET-29), which reads the
  // endpoint again from the Admin API.
  args: {
    open: true,
    onOpenChange: nothing,
    title: `Webhook ${orderSyncEndpoint.url}`,
    endpoint: `/api/v3/admin/webhook_endpoints/${orderSyncEndpoint.id}`,
    fetch: (): Promise<unknown> => Promise.resolve(orderSyncEndpoint),
    resolveLink: spreeJsonLinkResolver(storeId),
  },
  // The drawer renders outside the story's root, against the window's edge.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof JsonPreviewDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Loaded: Story = {
  play: async () => {
    await screen.findByText(`"${orderSyncEndpoint.url}"`)
  },
}

export const Loading: Story = { args: { fetch: () => new Promise(() => {}) } }

export const Failed: Story = {
  args: { fetch: () => Promise.reject(new Error('Webhook endpoint not found')) },
  play: async () => {
    await screen.findByText(/Webhook endpoint not found/)
  },
}
