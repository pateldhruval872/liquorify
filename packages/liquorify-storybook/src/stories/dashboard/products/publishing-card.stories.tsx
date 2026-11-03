import type { Product } from '@spree/admin-sdk'
import type { ProductPublicationFormValues } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http } from 'msw'
import { expect, screen, userEvent, within } from 'storybook/test'
import { PublishingCard } from '../../../../../dashboard/src/components/spree/products/publishing-card'
import { withStore } from '../../../decorators/store'
import { clayMug, scheduledMug, slateCap } from '../../../fixtures/admin/catalog'
import { channels } from '../../../fixtures/admin/settings'
import { channelList } from '../../../mocks/handlers/admin/catalog'
import { ProductFormFor, productParameters } from '../../dashboard-core/products/product-form'

const [onlineStore, wholesale, popUpMarket] = channels

interface Props {
  product: Product | null
  /** The channels the merchant has chosen on the page, over the product's own. */
  publications?: ProductPublicationFormValues[]
  seedDefaultChannel?: boolean
}

/**
 * The product page's Publishing card in the sidebar: each channel that lists
 * the product, whether customers can see it there now, and its dates. Rows read
 * the time against the capture's fixed clock, 1 October 2026 at noon.
 */
function Publishing({ product, publications, seedDefaultChannel }: Props) {
  return (
    <ProductFormFor
      product={product}
      values={publications ? { product_publications: publications } : undefined}
    >
      {(form) => <PublishingCard form={form} seedDefaultChannel={seedDefaultChannel} />}
    </ProductFormFor>
  )
}

const sidebar = (
  product: Product | null,
  viewport = false,
  handlers: Record<string, unknown> = {},
) => productParameters({ product, column: 'sidebar', viewport, handlers })

const publication = (
  channelId: string,
  publishedAt: string | null = null,
  unpublishedAt: string | null = null,
): ProductPublicationFormValues => ({
  channel_id: channelId,
  published_at: publishedAt,
  unpublished_at: unpublishedAt,
})

const openManage = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Manage' }))
  return screen.findByRole('dialog')
}

const meta = {
  title: 'Admin dashboard/Products/Publishing card',
  component: Publishing,
  tags: ['CMP-DA-G-14'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: sidebar(clayMug),
} satisfies Meta<typeof Publishing>

export default meta
type Story = StoryObj<typeof meta>

export const Live: Story = {
  name: 'Live on two channels',
  play: async () => {
    await screen.findByText('Wholesale')
    await expect(screen.getAllByText('Visible to customers now')).toHaveLength(2)
  },
}

// One row for each schedule an active product can be in: listed until a date,
// listed for a window that has not started, and taken down on a date now past.
// The inactive pop-up market still lists it, as Spree allows.
export const Schedules: Story = {
  name: 'Ending, scheduled and hidden',
  args: {
    publications: [
      publication(onlineStore.id, null, '2026-12-31T23:00:00.000Z'),
      publication(wholesale.id, '2026-11-15T09:00:00.000Z', '2026-12-31T23:00:00.000Z'),
      publication(popUpMarket.id, '2026-06-01T09:00:00.000Z', '2026-09-01T09:00:00.000Z'),
    ],
  },
  play: async () => {
    await screen.findByText('Pop-up market')
    await screen.findByText(/^Comes down December 31st, 2026/)
    await screen.findByText(/^Live November 15th, 2026 9:00 AM →/)
    await screen.findByText(/^Was hidden on September 1st, 2026/)
  },
}

export const GoesLive: Story = {
  name: 'Goes live on a date',
  args: { publications: [publication(onlineStore.id, '2026-10-15T09:00:00.000Z')] },
  play: async () => {
    await screen.findByText('Goes live October 15th, 2026 9:00 AM')
  },
}

// The product's status comes first: a draft is hidden on every channel, even
// inside the window its publication sets.
export const Draft: Story = {
  name: 'Not available while a draft',
  args: { product: scheduledMug },
  parameters: sidebar(scheduledMug),
  play: async () => {
    await screen.findByText('Hidden — product is Draft')
  },
}

export const NoChannels: Story = {
  name: 'On no channels',
  args: { product: slateCap },
  parameters: sidebar(slateCap),
  play: async () => {
    await screen.findByText('Not listed on any sales channel yet.')
  },
}

// Pressing a row opens its dates in place, with the calendars inline as the
// sidebar has no room for a popup.
export const EditingDates: Story = {
  name: "Editing a channel's dates",
  args: {
    publications: [
      publication(onlineStore.id),
      publication(wholesale.id, '2026-11-15T09:00:00.000Z', '2026-12-31T23:00:00.000Z'),
    ],
  },
  play: async () => {
    await userEvent.click(await screen.findByText(/^Live November 15th/))
    await screen.findByText('Publish from')
    await screen.findByRole('button', { name: /November 15th, 2026 9:00 AM/ })
    await screen.findByRole('button', { name: /December 31st, 2026 11:00 PM/ })
  },
}

// The new product page adds the store's default channel once channels load,
// so a product saved without opening Manage is still listed. A new product
// starts as a draft, so the row reads hidden.
export const NewProduct: Story = {
  name: 'New product, default channel added',
  args: { product: null, seedDefaultChannel: true },
  parameters: sidebar(null),
  play: async () => {
    await screen.findByText('Online Store')
    await screen.findByText('Hidden — product is Draft')
  },
}

export const Manage: Story = {
  name: 'Choosing channels',
  parameters: sidebar(clayMug, true),
  play: async () => {
    const sheet = await openManage()
    await within(sheet).findByText('Inactive')
  },
}

export const ChannelRemoved: Story = {
  name: 'A channel removed',
  play: async () => {
    const sheet = await openManage()
    await userEvent.click(await within(sheet).findByRole('button', { name: /Wholesale/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Done' }))
    await expect(screen.getAllByText('Visible to customers now')).toHaveLength(1)
  },
}

export const ChannelsLoading: Story = {
  name: 'Choosing channels, loading',
  parameters: sidebar(clayMug, true, {
    channels: [
      http.get('/api/v3/admin/channels', async () => {
        await delay('infinite')
      }),
    ],
  }),
  play: async () => {
    const sheet = await openManage()
    await within(sheet).findByText('Manage sales channels')
  },
}

export const NoChannelsInStore: Story = {
  name: 'Choosing channels, none in the store',
  args: { product: slateCap },
  parameters: sidebar(slateCap, true, { channels: channelList([]) }),
  play: async () => {
    const sheet = await openManage()
    await within(sheet).findByText(/No sales channels available/)
  },
}
