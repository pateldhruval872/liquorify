import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTranslation } from 'react-i18next'
import { fn, screen, userEvent } from 'storybook/test'
import {
  EMPTY_PURCHASE_ORDER,
  PurchaseOrderForm,
  type PurchaseOrderFormValues,
  type PurchaseOrderSubmitValues,
} from '../../../../../dashboard/src/components/spree/purchase-order-form'
import { withStore } from '../../../decorators/store'
import { draftOrder, kilnworks, pickerVariants } from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const [shop, depot] = stockLocations
const [mug, , , cap] = pickerVariants

/**
 * A purchase order's form as its two pages render it: new (DA-INV-07), and a
 * draft's edit page (DA-INV-09), where the currency is fixed.
 */
function OrderForm({
  initial,
  number,
  pending,
  onSubmit,
}: {
  initial: PurchaseOrderFormValues
  number?: string
  pending: boolean
  onSubmit: (values: PurchaseOrderSubmitValues) => void
}) {
  const { t } = useTranslation()
  return (
    <PurchaseOrderForm
      initial={initial}
      title={
        number
          ? t('admin.purchase_orders.edit_title', { number })
          : t('admin.purchase_orders.new_title')
      }
      backTo="purchase-orders"
      currencyLocked={!!number}
      submitLabel={
        number ? t('admin.actions.save') : t('admin.purchase_orders.actions.create_draft')
      }
      pendingLabel={number ? t('admin.actions.saving') : t('admin.actions.creating')}
      pending={pending}
      onSubmit={onSubmit}
      onCancel={() => undefined}
    />
  )
}

const page = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.newPurchaseOrder, column: 'page', ...options })

const meta = {
  title: 'Admin dashboard/Stock/Purchase order form',
  component: OrderForm,
  tags: ['CMP-DA-G-24'],
  args: { initial: EMPTY_PURCHASE_ORDER, pending: false, onSubmit: fn() },
  decorators: [withStore],
  parameters: page(),
} satisfies Meta<typeof OrderForm>

export default meta
type Story = StoryObj<typeof meta>

const filled: PurchaseOrderFormValues = {
  supplierId: kilnworks.id,
  destinationId: shop.id,
  currency: 'USD',
  expectedAt: '2026-10-08',
  cancelBy: '2026-10-20',
  reference: 'KW-88412',
  notes: 'Ask about the new speckled glaze.',
  lines: [
    { variant: mug, quantity: 24, unitCost: '6.50' },
    { variant: cap, quantity: 20, unitCost: '9.25' },
  ],
}

export const Empty: Story = {
  play: async () => {
    await screen.findByRole('combobox', { name: 'Supplier' })
    await screen.findByText('No products yet')
  },
}

export const Filled: Story = {
  args: { initial: filled },
  play: async () => {
    await screen.findByDisplayValue(kilnworks.name)
  },
}

// A line without a cost: Create draft waits until every line has one.
export const CostMissing: Story = {
  name: 'A cost missing',
  args: {
    initial: { ...filled, lines: [filled.lines[0], { variant: cap, quantity: 20, unitCost: '' }] },
  },
  play: async () => {
    await screen.findByDisplayValue('6.50')
  },
}

export const ChoosingSupplier: Story = {
  name: 'Choosing a supplier',
  parameters: page({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Supplier' }))
    await screen.findByRole('option', { name: 'Flax & Loom' })
  },
}

// A new supplier added from the supplier field, without leaving the order.
export const AddingSupplier: Story = {
  name: 'Adding a supplier',
  parameters: page({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Supplier' }))
    await userEvent.click(await screen.findByRole('button', { name: 'New supplier' }))
    await screen.findByRole('heading', { name: 'New supplier' })
  },
}

// From an Inventory row: delivered to the depot the row was at, with the
// row's product and no cost yet.
export const FromInventory: Story = {
  name: 'From the inventory list',
  args: {
    initial: {
      ...EMPTY_PURCHASE_ORDER,
      destinationId: depot.id,
      lines: [{ variant: mug, quantity: 1, unitCost: '' }],
    },
  },
  play: async () => {
    await screen.findByText('MUG-CLAY')
  },
}

export const Creating: Story = {
  args: { initial: filled, pending: true },
  play: async () => {
    await screen.findByRole('button', { name: 'Creating…' })
  },
}

// A draft's edit page: the currency is fixed, since every cost is in it.
export const EditDraft: Story = {
  name: 'Edit a draft',
  args: { initial: filled, number: draftOrder.number },
  play: async () => {
    await screen.findByText(/Fixed after the order is opened/)
  },
}
