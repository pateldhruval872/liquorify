import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen } from 'storybook/test'
import { PaymentDetailsDialog } from '../../../../../dashboard/src/components/spree/orders/payment-details-dialog'
import {
  authorizedPayment,
  capturedPayment,
  chequePayment,
  failedPayment,
  riskyPayment,
  splitCapturedPayment,
} from '../../../fixtures/admin/orders'

/**
 * One payment's details, opened from the payments card (DA-ORD-04): what the
 * card issuer reported about the address and security code, the transaction
 * ID, each capture of the money, and a link to the payment at its gateway.
 */
const meta = {
  title: 'Admin dashboard/Orders/Payment details dialog',
  component: PaymentDetailsDialog,
  tags: ['CMP-DA-G-11'],
  args: { payment: capturedPayment, currency: 'USD', open: true, onOpenChange: fn() },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof PaymentDetailsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Captured: Story = {
  play: async () => {
    await screen.findByRole('link', { name: 'View at Test card gateway' })
  },
}

export const TwoCaptures: Story = {
  name: 'Captured in two parts',
  args: { payment: splitCapturedPayment },
}

export const NothingCaptured: Story = {
  name: 'Authorized, nothing captured',
  args: { payment: authorizedPayment },
  play: async () => {
    await screen.findByText('Nothing has been captured yet.')
  },
}

export const ChecksFailed: Story = {
  name: 'Card checks failed',
  args: { payment: riskyPayment },
}

// A failed payment reached no card issuer, so neither check ran.
export const NotChecked: Story = {
  name: 'Not checked',
  args: { payment: failedPayment },
}

// A cheque is not a card, so there are no card checks.
export const NotACard: Story = {
  name: 'Not a card',
  args: { payment: chequePayment },
}
