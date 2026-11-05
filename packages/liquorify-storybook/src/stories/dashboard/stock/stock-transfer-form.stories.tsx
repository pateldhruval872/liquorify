import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTranslation } from 'react-i18next'
import { fn, screen, userEvent, within } from 'storybook/test'
import {
  EMPTY_STOCK_TRANSFER,
  StockTransferForm,
  type StockTransferFormValues,
} from '../../../../../dashboard/src/components/spree/stock-transfer-form'
import { withStore } from '../../../decorators/store'
import { draftTransfer, pickerVariants } from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const [shop, depot] = stockLocations
const [mug, oliveApron] = pickerVariants

/**
 * A transfer's form as its two pages render it: new (DA-INV-03), and a
 * draft's edit page (DA-INV-05), which the page titles with its number.
 */
function TransferForm({
  initial,
  number,
  pending,
  onSubmit,
}: {
  initial: StockTransferFormValues
  number?: string
  pending: boolean
  onSubmit: (values: StockTransferFormValues) => void
}) {
  const { t } = useTranslation()
  return (
    <StockTransferForm
      initial={initial}
      title={
        number
          ? t('admin.stock_transfers.edit_title', { number })
          : t('admin.stock_transfers.new_title')
      }
      backTo="transfers"
      submitLabel={
        number ? t('admin.actions.save') : t('admin.stock_transfers.actions.create_draft')
      }
      pendingLabel={number ? t('admin.actions.saving') : t('admin.actions.creating')}
      pending={pending}
      onSubmit={onSubmit}
      onCancel={() => undefined}
    />
  )
}

const page = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.newTransfer, column: 'page', ...options })

const meta = {
  title: 'Admin dashboard/Stock/Stock transfer form',
  component: TransferForm,
  tags: ['CMP-DA-G-24'],
  args: { initial: EMPTY_STOCK_TRANSFER, pending: false, onSubmit: fn() },
  decorators: [withStore],
  parameters: page(),
} satisfies Meta<typeof TransferForm>

export default meta
type Story = StoryObj<typeof meta>

const packed: StockTransferFormValues = {
  sourceId: shop.id,
  destinationId: depot.id,
  reference: 'Restock the depot',
  notes: 'Pack the mugs in the double-walled cartons.',
  lines: [
    { variant: mug, quantity: 12 },
    { variant: oliveApron, quantity: 6 },
  ],
}

// Nothing chosen: Create draft waits for both warehouses.
export const Empty: Story = {
  play: async () => {
    await screen.findByText('Select the warehouse it leaves from')
  },
}

export const SourceChosen: Story = {
  name: 'Source chosen',
  parameters: page({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'From' }))
    await userEvent.click(await screen.findByRole('option', { name: shop.name }))
    await userEvent.click(screen.getByRole('combobox', { name: 'To' }))
    await screen.findByRole('option', { name: depot.name })
  },
}

// With lines on it the source is fixed, since they were picked for it.
export const WithLines: Story = {
  name: 'With lines',
  args: { initial: packed },
  play: async () => {
    await screen.findByText(/Fixed while the transfer has lines/)
  },
}

export const PickingProducts: Story = {
  name: 'Picking products',
  args: { initial: { ...packed, lines: [] } },
  parameters: page({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add a product' }))
    const picker = await screen.findByRole('dialog')
    await userEvent.click(await within(picker).findByText('Slate cap'))
    await userEvent.click(within(picker).getByText('Sand tote'))
  },
}

// From an Inventory row: the depot is short, so it is the destination, and
// the row's product is the first line.
export const FromInventory: Story = {
  name: 'From the inventory list',
  args: {
    initial: {
      ...EMPTY_STOCK_TRANSFER,
      destinationId: depot.id,
      lines: [{ variant: mug, quantity: 1 }],
    },
  },
  play: async () => {
    await screen.findByText('MUG-CLAY')
  },
}

// Two warehouses the same, as a saved draft can arrive: the field says so.
export const SameWarehouse: Story = {
  name: 'Same warehouse twice',
  args: { initial: { ...packed, destinationId: shop.id } },
  play: async () => {
    await screen.findByText('The two warehouses must be different.')
  },
}

export const Creating: Story = {
  args: { initial: packed, pending: true },
  play: async () => {
    await screen.findByRole('button', { name: 'Creating…' })
  },
}

// A draft's edit page.
export const EditDraft: Story = {
  name: 'Edit a draft',
  args: { initial: packed, number: draftTransfer.number },
  play: async () => {
    await screen.findByRole('heading', { name: `Edit transfer ${draftTransfer.number}` })
  },
}
