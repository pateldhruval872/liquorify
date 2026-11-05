import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { SupplierSheet } from '../../../../../dashboard/src/components/spree/supplier-sheet'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { kilnworks } from '../../../fixtures/admin/inventory'
import { takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const sheet = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.suppliers, viewport: true, ...options })

// A supplier's sheet, from the suppliers page (DA-INV-10) or a new purchase
// order's supplier field (DA-INV-07): who the store buys from and how to
// reach them.
const meta = {
  title: 'Admin dashboard/Stock/Supplier sheet',
  component: SupplierSheet,
  tags: ['CMP-DA-G-24'],
  args: { open: true, onOpenChange: fn(), onCreated: fn() },
  decorators: [withStore],
  parameters: sheet(),
} satisfies Meta<typeof SupplierSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'New supplier' })
  },
}

// Saved without a name, the field says what it needs.
export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Email'), 'orders@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('A supplier needs a name.')
  },
}

export const Edit: Story = {
  args: { id: kilnworks.id },
  play: async () => {
    await screen.findByDisplayValue(kilnworks.name)
  },
}

export const Saving: Story = {
  parameters: sheet({ first: writeHeld('suppliers') }),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Name'), 'Saltmarsh Linen')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  },
}

// The server refuses a name another supplier has.
// The sheet has no place for a field's error, so the refusal is a toast.
export const NameTaken: Story = {
  name: 'Name taken',
  decorators: [withToaster],
  parameters: sheet({ first: takenNameRefused('suppliers') }),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Name'), 'Kilnworks Pottery')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/already been taken/)
  },
}
