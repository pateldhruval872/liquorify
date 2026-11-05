import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { StockLevelsPanel } from '../../../../../dashboard/src/components/spree/stock-levels-panel'
import { withStore } from '../../../decorators/store'
import { stockViewerRules } from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { readHeld, writeHeld } from '../../../mocks/handlers/admin/records'
import { inventoryParameters } from './inventory-page'

const [shop, depot] = stockLocations

const settingsRoute = {
  pattern: '/_authenticated/$storeId/settings/stock-locations',
  path: `/${shellStore.id}/settings/stock-locations?edit=${shop.id}`,
}

const panel = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: settingsRoute, column: 'inSheet', ...options })

// The stock a location holds, in its sheet on the stock locations page
// (DA-SET-18): each product's variants with the count on the shelf and
// whether it takes backorders, each row saved on its own.
const meta = {
  title: 'Admin dashboard/Stock/Stock levels panel',
  component: StockLevelsPanel,
  tags: ['CMP-DA-G-24'],
  args: { stockLocationId: shop.id },
  decorators: [withStore],
  parameters: panel(),
} satisfies Meta<typeof StockLevelsPanel>

export default meta
type Story = StoryObj<typeof meta>

// The shop's five variants: the slate apron and the cap are low, and the tote
// is out but takes backorders, so it is not marked.
export const Listed: Story = {
  play: async () => {
    await screen.findByText('Sand tote')
  },
}

export const Searched: Story = {
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search SKU or product…'), 'apron')
    await screen.findByText('Linen apron')
  },
}

export const NoMatch: Story = {
  name: 'No match',
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search SKU or product…'), 'teapot')
    await screen.findByText('No stock levels match your search.')
  },
}

// A count changed and backorders turned on: the row's Save button lights up.
export const Edited: Story = {
  play: async () => {
    const onHand = await screen.findByRole('spinbutton', { name: /On hand for Color: Slate/ })
    await userEvent.clear(onHand)
    await userEvent.type(onHand, '9')
    await userEvent.click(screen.getByRole('switch', { name: /Backorderable for Color: Slate/ }))
  },
}

export const Saving: Story = {
  parameters: panel({ first: writeHeld('stock_levels/:id', 'patch') }),
  play: async () => {
    const onHand = await screen.findByRole('spinbutton', { name: /On hand for Color: Slate/ })
    await userEvent.clear(onHand)
    await userEvent.type(onHand, '9')
    const [save] = screen
      .getAllByRole('button', { name: 'Save' })
      .filter((button) => !(button as HTMLButtonElement).disabled)
    await userEvent.click(save)
  },
}

// The depot, which this store holds nothing at.
export const Empty: Story = {
  args: { stockLocationId: 'sloc_0Em9Pt7y' },
  play: async () => {
    await screen.findByText('No stock levels at this location yet.')
  },
}

export const Loading: Story = {
  parameters: panel({ first: readHeld('stock_levels') }),
}

// Reading stock and writing nothing: the panel offers the same fields and
// buttons, which the server then refuses (recorded from the running screen).
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  args: { stockLocationId: depot.id },
  parameters: panel({ rules: stockViewerRules }),
  play: async () => {
    await screen.findByText('Clay mug')
  },
}
