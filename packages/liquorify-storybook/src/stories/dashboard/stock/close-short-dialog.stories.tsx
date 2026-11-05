import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTranslation } from 'react-i18next'
import { fn, screen, userEvent } from 'storybook/test'
import { CloseShortDialog } from '../../../../../dashboard/src/components/spree/close-short-dialog'
import {
  partiallyReceivedOrder,
  partiallyReceivedTransfer,
} from '../../../fixtures/admin/inventory'

/**
 * Ending a transfer (DA-INV-04) or a purchase order (DA-INV-08) whose missing
 * units are not coming, worded as each page words it.
 */
function CloseShort({
  document,
  pending,
  onConfirm,
  onClose,
}: {
  document: 'stock_transfers' | 'purchase_orders'
  pending: boolean
  onConfirm: (reason: string | undefined) => Promise<unknown>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const outstanding =
    document === 'stock_transfers'
      ? partiallyReceivedTransfer.quantity_shipped_total -
        partiallyReceivedTransfer.quantity_received_total
      : partiallyReceivedOrder.quantity_ordered_total -
        partiallyReceivedOrder.quantity_received_total
  return (
    <CloseShortDialog
      title={t(`admin.${document}.close_confirm.title`)}
      description={t(`admin.${document}.close_confirm.message`, { outstanding })}
      pending={pending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

const meta = {
  title: 'Admin dashboard/Stock/Close short dialog',
  component: CloseShort,
  tags: ['CMP-DA-G-24'],
  args: {
    document: 'stock_transfers',
    pending: false,
    onConfirm: fn(async () => undefined),
    onClose: fn(),
  },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof CloseShort>

export default meta
type Story = StoryObj<typeof meta>

export const Transfer: Story = {
  play: async () => {
    await screen.findByRole('dialog')
  },
}

export const PurchaseOrder: Story = {
  name: 'Purchase order',
  args: { document: 'purchase_orders' },
  play: async () => {
    await screen.findByRole('dialog')
  },
}

export const WithReason: Story = {
  name: 'With a reason',
  play: async () => {
    await userEvent.type(
      await screen.findByLabelText('Reason'),
      'Three mugs lost in transit; the carrier has the claim.',
    )
  },
}

export const Closing: Story = {
  args: { pending: true },
  play: async () => {
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
