import { ReturnReceiveDialog, ReturnRefundDialog } from '@spree/dashboard-ui/spree/return-dialogs'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'

const lines = [
  { id: 'rli_4Mg6Mf9c', label: 'Clay mug', quantity: 2 },
  { id: 'rli_9Ap2Rk5h', label: 'Linen apron — Color: Olive, Size: M', quantity: 1 },
]

/**
 * The two steps of a return that take more than a click: recording what
 * arrived, line by line and whether each can be sold again, and giving the
 * money back, by the original payment or as store credit. A return owed
 * nothing is completed instead.
 */
function ReturnDialogs({
  step = 'receive',
  refundableTotal = '66.96',
  refundTaxTotal,
  pending,
}: {
  step?: 'receive' | 'refund'
  refundableTotal?: string
  refundTaxTotal?: string
  pending?: boolean
}) {
  return step === 'receive' ? (
    <ReturnReceiveDialog lines={lines} onClose={fn()} onSubmit={fn()} pending={pending} />
  ) : (
    <ReturnRefundDialog
      refundableTotal={refundableTotal}
      owesNothing={refundableTotal === '0.00'}
      refundTaxTotal={refundTaxTotal}
      currencySymbol="$"
      onClose={fn()}
      onSubmit={fn()}
      pending={pending}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Return dialogs',
  component: ReturnDialogs,
  tags: ['CMP-DUI-C-43'],
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof ReturnDialogs>

export default meta
type Story = StoryObj<typeof meta>

export const Receive: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Receive returned items' })
  },
}

// One mug of two arrived, and it cannot go back on the shelf.
export const ReceivePartly: Story = {
  name: 'Receive, partly and not resellable',
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    const [mugQuantity] = within(dialog).getAllByRole('spinbutton', { name: 'Received' })
    await userEvent.clear(mugQuantity)
    await userEvent.type(mugQuantity, '1')
    const [mugResellable] = within(dialog).getAllByRole('switch', { name: 'Resellable' })
    await userEvent.click(mugResellable)
  },
}

export const ReceiveSaving: Story = {
  name: 'Receive, saving',
  args: { pending: true },
}

export const Refund: Story = {
  args: { step: 'refund' },
  play: async () => {
    await screen.findByRole('heading', { name: 'Refund return' })
  },
}

// The amount offered gives the tax back too, and says how much.
export const RefundWithTax: Story = {
  name: 'Refund, tax included',
  args: { step: 'refund', refundTaxTotal: '$4.96' },
}

export const RefundToStoreCredit: Story = {
  name: 'Refund, to store credit',
  args: { step: 'refund', refundTaxTotal: '$4.96' },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Refund to' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Store credit' }))
  },
}

export const RefundMethods: Story = {
  name: 'Refund, methods open',
  args: { step: 'refund' },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Refund to' }))
    await screen.findByRole('option', { name: 'Store credit' })
  },
}

export const NothingOwed: Story = {
  name: 'Nothing owed',
  args: { step: 'refund', refundableTotal: '0.00' },
  play: async () => {
    await screen.findByRole('heading', { name: 'Complete return' })
  },
}

export const RefundSaving: Story = {
  name: 'Refund, saving',
  args: { step: 'refund', pending: true },
}
