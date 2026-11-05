import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent, within } from 'storybook/test'
import {
  type VariantLine,
  VariantLineEditor,
} from '../../../../../dashboard/src/components/spree/variant-line-editor'
import { withStore } from '../../../decorators/store'
import { pickerVariants } from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const [mug, oliveApron] = pickerVariants

/**
 * The lines of a new transfer (DA-INV-03) or purchase order (DA-INV-07), as
 * the form holds them: products picked in one pass, each with its quantity
 * and, on a purchase order, its unit cost.
 */
function LineEditor({
  initial,
  withCost,
  currency,
  quantityLabel,
  stockLocationId,
  requireStockLocation,
}: {
  initial: VariantLine[]
  withCost?: boolean
  currency?: string
  quantityLabel: string
  stockLocationId?: string | null
  requireStockLocation?: boolean
}) {
  const [lines, setLines] = useState(initial)
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <VariantLineEditor
      lines={lines}
      onChange={setLines}
      withCost={withCost}
      currency={currency}
      quantityLabel={quantityLabel}
      stockLocationId={stockLocationId}
      requireStockLocation={requireStockLocation}
      pickerOpen={pickerOpen}
      onPickerOpenChange={setPickerOpen}
    />
  )
}

const editor = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.newTransfer, column: 'inMainCard', ...options })

const meta = {
  title: 'Admin dashboard/Stock/Variant line editor',
  component: LineEditor,
  tags: ['CMP-DA-G-24'],
  args: {
    initial: [],
    quantityLabel: 'Shipped',
    stockLocationId: stockLocations[0].id,
    requireStockLocation: true,
  },
  decorators: [withStore],
  parameters: editor(),
} satisfies Meta<typeof LineEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async () => {
    await screen.findByRole('button', { name: 'Add a product' })
  },
}

// A transfer with no source chosen: the picker stays shut until one is.
export const SourceNotChosen: Story = {
  name: 'Source not chosen',
  args: { stockLocationId: null },
  play: async () => {
    await screen.findByText(/Choose the warehouse it leaves from first/)
  },
}

export const PickerOpen: Story = {
  name: 'Picker open',
  parameters: editor({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add a product' }))
    await within(await screen.findByRole('dialog')).findByText('Slate cap')
  },
}

// Several products picked in one pass, then a quantity raised.
export const Lines: Story = {
  args: {
    initial: [
      { variant: mug, quantity: 12 },
      { variant: oliveApron, quantity: 6 },
    ],
  },
  play: async () => {
    await screen.findByText('APRON-OLV-M')
  },
}

export const WithCosts: Story = {
  name: 'With costs',
  args: {
    initial: [
      { variant: mug, quantity: 24, unitCost: '6.50' },
      { variant: oliveApron, quantity: 10, unitCost: '' },
    ],
    withCost: true,
    currency: 'USD',
    quantityLabel: 'Ordered',
    stockLocationId: null,
    requireStockLocation: false,
  },
  parameters: editor({ route: inventoryRoutes.newPurchaseOrder }),
  play: async () => {
    await screen.findByDisplayValue('6.50')
  },
}

// A purchase order's picker is not limited to one warehouse's stock.
export const PurchaseOrderEmpty: Story = {
  name: 'Purchase order, empty',
  args: {
    withCost: true,
    currency: 'USD',
    quantityLabel: 'Ordered',
    stockLocationId: null,
    requireStockLocation: false,
  },
  parameters: editor({ route: inventoryRoutes.newPurchaseOrder }),
  play: async () => {
    await screen.findByText('Add the products this order is for.')
  },
}
