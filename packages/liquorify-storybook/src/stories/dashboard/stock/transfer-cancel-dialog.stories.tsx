import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { TransferCancelDialog } from '../../../../../dashboard/src/components/spree/transfer-cancel-dialog'
import { withStore } from '../../../decorators/store'
import { draftTransfer, inTransitTransfer } from '../../../fixtures/admin/inventory'
import { transferCancelHeld } from '../../../mocks/handlers/admin/inventory'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const dialog = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.transfer, viewport: true, ...options })

// Calling a transfer off from its page (DA-INV-04). Before it ships nothing
// has moved; once it has, the merchant says what became of the units before
// Cancel is offered.
const meta = {
  title: 'Admin dashboard/Stock/Transfer cancel dialog',
  component: TransferCancelDialog,
  tags: ['CMP-DA-G-24'],
  args: { transfer: draftTransfer, onClose: fn() },
  decorators: [withStore],
  parameters: dialog(),
} satisfies Meta<typeof TransferCancelDialog>

export default meta
type Story = StoryObj<typeof meta>

export const NotShipped: Story = {
  name: 'Not shipped',
  play: async () => {
    await screen.findByText('No stock has moved yet, so nothing will be reversed.')
  },
}

// In transit, nothing is chosen for the merchant, so Cancel waits.
export const InTransit: Story = {
  name: 'In transit',
  args: { transfer: inTransitTransfer },
  play: async () => {
    await screen.findByText('Put the units back at the source')
  },
}

export const Restock: Story = {
  args: { transfer: inTransitTransfer },
  play: async () => {
    await userEvent.click(await screen.findByText('Put the units back at the source'))
  },
}

export const WriteOff: Story = {
  name: 'Write off',
  args: { transfer: inTransitTransfer },
  play: async () => {
    await userEvent.click(await screen.findByText('Write the units off as lost'))
  },
}

export const Cancelling: Story = {
  args: { transfer: inTransitTransfer },
  parameters: dialog({ first: transferCancelHeld }),
  play: async () => {
    await userEvent.click(await screen.findByText('Write the units off as lost'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel transfer' }))
  },
}
