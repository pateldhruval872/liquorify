import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import {
  CreateClaimDialog,
  CreateReturnDialog,
} from '../../../../../seller-dashboard/src/components/orders/post-sale-create-dialogs'
import { partialOrder, shippedOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

/** Recording a return or a claim on a shipped order (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Post-sale create dialogs',
  component: CreateReturnDialog,
  tags: ['CMP-SP-G-02'],
  args: { order: shippedOrder, open: true, onOpenChange: fn() },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${shippedOrder.id}`,
    viewport: true,
  }),
} satisfies Meta<typeof CreateReturnDialog>

export default meta
type Story = StoryObj<typeof meta>

export const NewReturn: Story = { name: 'New return' }

export const ReturnReasons: Story = {
  name: 'New return, choosing a reason',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Reason' }))
    await screen.findByRole('option', { name: 'Damaged/Defective' })
  },
}

export const NewClaim: Story = {
  name: 'New claim',
  args: { order: partialOrder },
  render: (args) => <CreateClaimDialog {...args} />,
}
