import type { StockLevel } from '@spree/admin-sdk'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  IncomingCell,
  OnHandCell,
} from '../../../../../dashboard/src/components/spree/inventory-cells'
import { withStore } from '../../../decorators/store'
import { stockLevels, stockViewerRules } from '../../../fixtures/admin/inventory'
import { templateRules } from '../../../fixtures/admin/shell'
import { writeHeld } from '../../../mocks/handlers/admin/records'
import { inventoryParameters } from './inventory-page'

/**
 * A row's on-hand and incoming figures on the Inventory list (DA-INV-01), in
 * the list's own columns: on hand opens a correction, incoming the two ways
 * to bring more stock in.
 */
function InventoryCells({ level }: { level: StockLevel }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="text-right">Incoming</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="text-right tabular-nums">
            <OnHandCell level={level} />
          </TableCell>
          <TableCell className="text-right tabular-nums">
            <IncomingCell level={level} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

// The mug at the depot: six on the shelf and twelve on their way.
const depotMug = stockLevels[1]

const meta = {
  title: 'Admin dashboard/Stock/Inventory cells',
  component: InventoryCells,
  tags: ['CMP-DA-G-24'],
  args: { level: depotMug },
  decorators: [withStore],
  parameters: inventoryParameters({ column: 'page' }),
} satisfies Meta<typeof InventoryCells>

export default meta
type Story = StoryObj<typeof meta>

const openCorrection = async () => {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Edit on-hand count for Clay mug' }),
  )
  return screen.findByRole('spinbutton', { name: 'Amount' })
}

export const Figures: Story = {
  play: async () => {
    await screen.findByRole('button', { name: 'Add incoming stock' })
  },
}

// Set to a count, the form opens on the shelf's current figure.
export const CorrectionOpen: Story = {
  name: 'Correction open',
  parameters: inventoryParameters({ column: 'page', viewport: true }),
  play: async () => {
    await openCorrection()
  },
}

// Moved by a delta, with why: three written off as damaged.
export const Adjusting: Story = {
  parameters: inventoryParameters({ column: 'page', viewport: true }),
  play: async () => {
    await openCorrection()
    await userEvent.click(screen.getByRole('combobox', { name: 'How to change the count' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Adjust by' }))
    const amount = screen.getByRole('spinbutton', { name: 'Amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '-3')
    await userEvent.click(screen.getByRole('combobox', { name: 'Reason' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Damaged' }))
  },
}

export const Saving: Story = {
  parameters: inventoryParameters({
    column: 'page',
    viewport: true,
    first: writeHeld('stock_levels/:id', 'patch'),
  }),
  play: async () => {
    const amount = await openCorrection()
    await userEvent.clear(amount)
    await userEvent.type(amount, '5')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
  },
}

export const IncomingMenu: Story = {
  name: 'Incoming menu',
  parameters: inventoryParameters({ column: 'page', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add incoming stock' }))
    await screen.findByRole('link', { name: 'Create purchase order' })
  },
}

// The merchandiser template writes stock but holds no purchasing: the
// incoming menu offers a transfer only.
export const Merchandiser: Story = {
  parameters: inventoryParameters({
    column: 'page',
    viewport: true,
    rules: templateRules.merchandiser.rules,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add incoming stock' }))
    await screen.findByRole('link', { name: 'Create transfer' })
  },
}

// Reading stock, writing nothing: both figures are plain numbers.
export const ReadOnly: Story = {
  name: 'Read only',
  parameters: inventoryParameters({ column: 'page', rules: stockViewerRules }),
  play: async () => {
    await screen.findByText('12')
  },
}
