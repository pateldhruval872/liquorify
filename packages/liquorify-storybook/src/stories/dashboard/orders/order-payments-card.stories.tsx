import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { PaymentsCard } from '../../../../../dashboard/src/components/spree/orders/order-payments-card'
import { withStore } from '../../../decorators/store'
import {
  authorizedOrder,
  giftCardOrder,
  guestOrder,
  mixedPaymentsOrder,
  paidOrder,
  riskyOrder,
  unpaidOrder,
} from '../../../fixtures/admin/orders'
import { orderWriteHeld, savedCardList } from '../../../mocks/handlers/admin/orders'
import { orderParameters } from './order-page'

/**
 * An order's payments (DA-ORD-04): each with its method, state and amount,
 * the card checks that failed, the menu that captures, voids or shows a
 * payment's details, and the dialog that charges a payment method.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order payments card',
  component: PaymentsCard,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'main' }),
} satisfies Meta<typeof PaymentsCard>

export default meta
type Story = StoryObj<typeof meta>

const openRowMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
}
const openAddDialog = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Add' }))
  return screen.findByRole('dialog')
}
const chooseMethod = async (dialog: HTMLElement, name: string) => {
  await userEvent.click(within(dialog).getByRole('combobox', { name: 'Payment method' }))
  await userEvent.click(await screen.findByRole('option', { name }))
}

export const None: Story = {
  args: { order: unpaidOrder },
  parameters: orderParameters({ order: unpaidOrder, column: 'main' }),
}

export const Paid: Story = {}

export const Authorized: Story = {
  args: { order: authorizedOrder },
  parameters: orderParameters({ order: authorizedOrder, column: 'main' }),
}

export const FailedCardChecks: Story = {
  name: 'Failed card checks',
  args: { order: riskyOrder },
  parameters: orderParameters({ order: riskyOrder, column: 'main' }),
}

// A failed card payment, a voided one, and a cheque waiting to be counted.
export const Mixed: Story = {
  name: 'Failed, voided and waiting',
  args: { order: mixedPaymentsOrder },
  parameters: orderParameters({ order: mixedPaymentsOrder, column: 'main' }),
}

export const StoreCreditAndCard: Story = {
  name: 'Store credit and a card',
  args: { order: giftCardOrder },
  parameters: orderParameters({ order: giftCardOrder, column: 'main' }),
}

// A captured payment can be voided, not captured again.
export const PaidMenu: Story = {
  name: 'Paid, menu open',
  parameters: orderParameters({ column: 'main', viewport: true }),
  play: async () => {
    await openRowMenu()
    await screen.findByRole('menuitem', { name: 'View at Test card gateway' })
  },
}

export const AuthorizedMenu: Story = {
  name: 'Authorized, menu open',
  args: { order: authorizedOrder },
  parameters: orderParameters({ order: authorizedOrder, column: 'main', viewport: true }),
  play: async () => {
    await openRowMenu()
    await screen.findByRole('menuitem', { name: 'Capture' })
  },
}

export const CaptureConfirmation: Story = {
  name: 'Capture confirmation',
  args: { order: authorizedOrder },
  parameters: orderParameters({ order: authorizedOrder, column: 'main', viewport: true }),
  play: async () => {
    await openRowMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Capture' }))
    await screen.findByText('Capture this payment?')
  },
}

export const VoidConfirmation: Story = {
  name: 'Void confirmation',
  args: { order: authorizedOrder },
  parameters: orderParameters({ order: authorizedOrder, column: 'main', viewport: true }),
  play: async () => {
    await openRowMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Void' }))
    await screen.findByText('Void this payment?')
  },
}

export const Details: Story = {
  name: 'Payment details',
  parameters: orderParameters({ column: 'main', viewport: true }),
  play: async () => {
    await openRowMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'View details' }))
    await screen.findByRole('heading', { name: 'Payment PJ4N8XRT' })
  },
}

export const AddPayment: Story = {
  name: 'Add payment',
  args: { order: unpaidOrder },
  parameters: orderParameters({ order: unpaidOrder, column: 'main', viewport: true }),
  play: async () => {
    const dialog = await openAddDialog()
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Payment method' }))
    await screen.findByRole('option', { name: 'Store Credit' })
  },
}

// The test gateway charges a saved card, so the customer's cards are offered.
export const AddPaymentSavedCard: Story = {
  name: 'Add payment, saved card',
  args: { order: unpaidOrder },
  parameters: orderParameters({ order: unpaidOrder, column: 'main', viewport: true }),
  play: async () => {
    const dialog = await openAddDialog()
    await chooseMethod(dialog, 'Test card gateway')
    await userEvent.click(await within(dialog).findByRole('combobox', { name: 'Source' }))
    await userEvent.click(await screen.findByRole('option', { name: /visa •••• 4242/ }))
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Capture immediately' }))
  },
}

export const AddPaymentNoCards: Story = {
  name: 'Add payment, no saved cards',
  args: { order: unpaidOrder },
  parameters: orderParameters({
    order: unpaidOrder,
    column: 'main',
    viewport: true,
    first: savedCardList([]),
  }),
  play: async () => {
    const dialog = await openAddDialog()
    await chooseMethod(dialog, 'Test card gateway')
    await within(dialog).findByText('Customer has no saved cards for this payment method.')
  },
}

// A guest's order has no customer, so no card can be chosen.
export const AddPaymentNoCustomer: Story = {
  name: 'Add payment, no customer',
  args: { order: guestOrder },
  parameters: orderParameters({ order: guestOrder, column: 'main', viewport: true }),
  play: async () => {
    const dialog = await openAddDialog()
    await chooseMethod(dialog, 'Test card gateway')
    await within(dialog).findByText(/Assign a customer to the order first/)
  },
}

// Store credit is charged at once, so there is nothing to capture.
export const AddPaymentStoreCredit: Story = {
  name: 'Add payment, store credit',
  args: { order: unpaidOrder },
  parameters: orderParameters({ order: unpaidOrder, column: 'main', viewport: true }),
  play: async () => {
    const dialog = await openAddDialog()
    await chooseMethod(dialog, 'Store Credit')
    await within(dialog).findByText('Leave blank to default to the outstanding balance.')
  },
}

export const AddPaymentSaving: Story = {
  name: 'Add payment, saving',
  args: { order: unpaidOrder },
  parameters: orderParameters({
    order: unpaidOrder,
    column: 'main',
    viewport: true,
    first: orderWriteHeld('post', 'orders/:id/payments'),
  }),
  play: async () => {
    const dialog = await openAddDialog()
    await chooseMethod(dialog, 'Pay by cheque')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await within(dialog).findByRole('button', { name: 'Saving…' })
  },
}
