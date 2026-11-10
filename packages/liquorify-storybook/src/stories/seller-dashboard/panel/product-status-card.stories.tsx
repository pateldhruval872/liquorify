import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { ProductStatusCard } from '../../../../../seller-dashboard/src/components/product-status-card'
import { products } from '../../../fixtures/seller/products'
import { panelParameters } from '../seller-panel'

const [proposed, listedRejected, active, draft] = products
/** As the product page reads it, with its submission expanded (read from the Seller API). */
const rejected = {
  ...listedRejected,
  submission: {
    id: 'prodsub_gbHJdmfrXB',
    status: 'rejected',
    review_note: 'Add the bottle size and the ABV to the description.',
    reviewed_at: '2026-10-01T11:59:56.950Z',
    created_at: '2026-10-01T11:59:56.891Z',
    product_id: listedRejected.id,
  },
} as typeof listedRejected
const card = (viewport = false) =>
  panelParameters({
    page: 'products/$productId',
    path: `products/${draft.id}`,
    column: 'sidebar',
    viewport,
  })

/** Where a product stands with the marketplace, and the one move from here (SP-PRD-03's sidebar). */
const meta = {
  title: 'Seller panel/Products/Product status card',
  component: ProductStatusCard,
  tags: ['CMP-SP-G-03'],
  args: { product: draft, onDone: fn() },
  parameters: card(),
} satisfies Meta<typeof ProductStatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Draft: Story = {}

export const Proposed: Story = { name: 'Awaiting review', args: { product: proposed } }

export const Active: Story = { name: 'On sale', args: { product: active } }

export const Rejected: Story = { name: 'Sent back, with the reason', args: { product: rejected } }

export const Archived: Story = { args: { product: { ...draft, status: 'archived' } } }

export const TakeDownConfirm: Story = {
  name: 'Take down confirmation',
  args: { product: active },
  parameters: card(true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Take down' }))
    await screen.findByRole('button', { name: 'Take down' })
  },
}

export const ArchiveConfirm: Story = {
  name: 'Archive confirmation',
  parameters: card(true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Archive' }))
    await screen.findAllByRole('button', { name: 'Archive' })
  },
}
