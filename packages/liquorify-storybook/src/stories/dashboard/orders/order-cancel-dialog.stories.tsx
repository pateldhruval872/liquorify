import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { fn, screen, userEvent, within } from 'storybook/test'
import { OrderCancelDialog } from '../../../../../dashboard/src/components/spree/orders/order-cancel-dialog'
import { withStore } from '../../../decorators/store'
import { paidOrder } from '../../../fixtures/admin/orders'
import { orderWriteHeld } from '../../../mocks/handlers/admin/orders'
import { reasonRequests } from '../../../mocks/handlers/admin/settings'
import { orderParameters } from './order-page'

/**
 * What the order header opens to cancel a placed order (DA-ORD-04): the
 * store's cancellation reasons, a note only staff see, whether to hand back
 * money already taken, and whether to email the customer.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order cancel dialog',
  component: OrderCancelDialog,
  tags: ['CMP-DA-G-11'],
  args: { orderId: paidOrder.id, onClose: fn() },
  decorators: [withStore],
  parameters: orderParameters({ viewport: true }),
} satisfies Meta<typeof OrderCancelDialog>

export default meta
type Story = StoryObj<typeof meta>

const reasonPicker = () => screen.findByRole('combobox', { name: 'Reason' })

export const Open: Story = {
  play: async () => {
    await screen.findByText('No reason given')
  },
}

export const ReasonsListed: Story = {
  name: "The store's reasons",
  play: async () => {
    await userEvent.click(await reasonPicker())
    await screen.findByRole('option', { name: 'Out of stock' })
  },
}

export const Filled: Story = {
  name: 'Reason, note and refund chosen',
  play: async () => {
    await userEvent.click(await reasonPicker())
    await userEvent.click(
      await screen.findByRole('option', { name: 'Customer changed their mind' }),
    )
    const dialog = screen.getByRole('dialog')
    await userEvent.type(
      within(dialog).getByLabelText('Note'),
      'Called on Monday morning and asked us to stop it before it shipped.',
    )
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Refund the customer/ }))
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Email the customer' }))
  },
}

// A store that has curated no reasons can still cancel, with none recorded.
export const NoReasons: Story = {
  name: 'No reasons curated',
  parameters: orderParameters({
    viewport: true,
    first: reasonRequests('order-cancellation-reasons', []),
  }),
  play: async () => {
    await userEvent.click(await reasonPicker())
    await screen.findByRole('option', { name: 'No reason given' })
  },
}

export const Canceling: Story = {
  parameters: orderParameters({
    viewport: true,
    first: orderWriteHeld('patch', 'orders/:id/cancel'),
  }),
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel order' }))
  },
}

// The server's refusal of the whole cancellation lands above the fields.
export const Refused: Story = {
  parameters: orderParameters({
    viewport: true,
    first: [
      http.patch('/api/v3/admin/orders/:id/cancel', () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'Order cannot be canceled once it has shipped',
              details: {
                base: [
                  {
                    code: 'invalid',
                    message: 'Order cannot be canceled once it has shipped',
                    specific: true,
                  },
                ],
              },
            },
          },
          { status: 422 },
        ),
      ),
    ],
  }),
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel order' }))
    await within(dialog).findByRole('alert')
    // Where focus lands after the refusal depends on how fast it came back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
