import type { Product, Variant } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
import { StockHistoryDialog } from '../../../../../dashboard/src/components/spree/stock-history-card'
import { withStore } from '../../../decorators/store'
import { apronStockMovements, clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { stockMovementList, stockMovementsHeld } from '../../../mocks/handlers/admin/catalog'
import { productParameters } from '../../dashboard-core/products/product-form'

/**
 * The stock history on a product's page (DA-PRD-03): a button beside the
 * inventory card that opens every change to the product's stock, across its
 * variants and locations, newest first and ten to a page, with what caused
 * each. The same history as a card belongs to the stock location, transfer
 * and purchase order pages, which are batch 6's.
 */
function StockHistory({ product }: { product: Product }) {
  const variants = product.variants?.length ? product.variants : [product.default_variant]
  return <StockHistoryDialog variantIds={(variants as Variant[]).map((variant) => variant.id)} />
}

const history = (product: Product, movements: HttpHandler[], viewport = true) =>
  productParameters({ product, viewport, handlers: { stockMovements: movements } })

const open = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Stock history' }))
  return screen.findByRole('dialog')
}

const meta = {
  title: 'Admin dashboard/Stock/Stock history',
  component: StockHistory,
  tags: ['CMP-DA-G-24'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: history(clayMug, stockMovementList(), false),
} satisfies Meta<typeof StockHistory>

export default meta
type Story = StoryObj<typeof meta>

export const Button: Story = {}

// The mug's four changes at the shop: a delivery from a purchase order, two
// corrections a merchant made with their reasons, and a shipment.
export const OneProduct: Story = {
  name: 'One product',
  parameters: history(clayMug, stockMovementList()),
  play: async () => {
    const dialog = await open()
    await within(dialog).findByText('Chipped in storage')
  },
}

// Across the apron's variants and locations, every kind of change and cause.
export const EveryCause: Story = {
  name: 'Every kind of change, first page',
  args: { product: linenApron },
  parameters: history(linenApron, stockMovementList(apronStockMovements)),
  play: async () => {
    const dialog = await open()
    await within(dialog).findByText('Exchange EX1001')
  },
}

export const SecondPage: Story = {
  name: 'Second page',
  args: { product: linenApron },
  parameters: history(linenApron, stockMovementList(apronStockMovements)),
  play: async () => {
    const dialog = await open()
    await within(dialog).findByText('Exchange EX1001')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Go to next page' }))
    await within(dialog).findByText('Count correction')
  },
}

export const Loading: Story = {
  parameters: history(clayMug, stockMovementsHeld),
  play: async () => {
    const dialog = await open()
    await within(dialog).findByText('Loading…')
  },
}

export const NoChanges: Story = {
  name: 'Nothing changed yet',
  parameters: history(clayMug, stockMovementList([])),
  play: async () => {
    const dialog = await open()
    await within(dialog).findByText('Nothing has changed this stock yet')
  },
}
