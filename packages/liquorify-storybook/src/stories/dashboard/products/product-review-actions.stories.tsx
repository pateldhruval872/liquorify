import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { ProductReviewActions } from '../../../../../dashboard/src/components/spree/products/product-review-actions'
import { withStore } from '../../../decorators/store'
import { proposedProduct, rejectedProduct } from '../../../fixtures/admin/marketplace'
import { productParameters } from '../../dashboard-core/products/product-form'

/**
 * The operator's decision on a product a seller submitted, on DA-PRD-03's
 * status card: approve, or send it back with a reason. A product already sent
 * back offers its reason to edit.
 */
const meta = {
  title: 'Admin dashboard/Products/Product review actions',
  component: ProductReviewActions,
  tags: ['CMP-DA-G-14'],
  args: { productId: proposedProduct.id, status: 'proposed' },
  decorators: [withStore],
  parameters: productParameters({ product: proposedProduct, column: 'inSidebarCard' }),
} satisfies Meta<typeof ProductReviewActions>

export default meta
type Story = StoryObj<typeof meta>

export const InReview: Story = { name: 'In review' }

export const ApproveConfirm: Story = {
  name: 'Approve confirmation',
  parameters: productParameters({
    product: proposedProduct,
    column: 'inSidebarCard',
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await screen.findByText('Approve this product?')
  },
}

export const Reason: Story = {
  name: 'Sending back, with a reason',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Send back' }))
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Reason' }),
      'Add the bottle size and the ABV.',
    )
  },
}

export const SentBack: Story = {
  name: 'Sent back',
  args: { productId: rejectedProduct.id, status: 'rejected' },
  parameters: productParameters({ product: rejectedProduct, column: 'inSidebarCard' }),
}
