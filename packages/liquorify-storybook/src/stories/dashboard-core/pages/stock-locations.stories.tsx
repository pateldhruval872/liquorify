import type { PermissionRule, StockLocation } from '@spree/admin-sdk'
import { StockLocationsPage, stockLocationsSearchSchema } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRouterState } from '@tanstack/react-router'
import type { HttpHandler } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
import { StockHistoryCard } from '../../../../../dashboard/src/components/spree/stock-history-card'
import { StockLevelsPanel } from '../../../../../dashboard/src/components/spree/stock-levels-panel'
// The seller column the admin dashboard adds to the shared table, as its route does.
import '../../../../../dashboard/src/tables/stock-locations'
import { stockViewerRules } from '../../../fixtures/admin/inventory'
import { orderManagerRules, stockLocations } from '../../../fixtures/admin/settings'
import { shellStore, templateRules } from '../../../fixtures/admin/shell'
import { inventoryRequests, stockLocationRequests } from '../../../mocks/handlers/admin/inventory'
import { readHeld, takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'
import { shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

/** What changed at a location, as the admin dashboard's route hands the page its history. */
function ActivityPanel({ stockLocationId }: { stockLocationId: string }) {
  return <StockHistoryCard stockLocationId={stockLocationId} />
}

/**
 * The settings area's container around the page, reading its sheets from the
 * address and handing it the stock and history panels, as its route does.
 */
function StockLocations() {
  const search = stockLocationsSearchSchema.parse(
    useRouterState({ select: (state) => state.location.search }),
  )
  return (
    <div className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <StockLocationsPage
        search={search}
        stockLevelsPanel={StockLevelsPanel}
        activityPanel={ActivityPanel}
      />
    </div>
  )
}

interface PageOptions {
  search?: string
  rules?: PermissionRule[]
  records?: StockLocation[]
  first?: HttpHandler[]
}

function pageParameters({
  search = '',
  rules,
  records = stockLocations,
  first = [],
}: PageOptions = {}) {
  const base = shellParameters({
    route: {
      pattern: '/_authenticated/$storeId/settings/stock-locations',
      path: `/${shellStore.id}/settings/stock-locations${search}`,
    },
    rules,
  })
  const { handlers } = base.msw as { handlers: Record<string, HttpHandler[]> }
  return {
    ...base,
    msw: {
      handlers: {
        first,
        ...handlers,
        ...inventoryRequests(),
        stockLocations: stockLocationRequests(records),
      },
    },
  }
}

const [shop] = stockLocations

// The stock locations page (DA-SET-18), in the store layout as the dashboard renders it.
const meta = {
  title: 'Dashboard core/Pages/Stock locations',
  component: StockLocations,
  tags: ['CMP-CORE-PG-03'],
  decorators: [withStoreLayout],
  parameters: pageParameters(),
} satisfies Meta<typeof StockLocations>

export default meta
type Story = StoryObj<typeof meta>

const rowMenu = async (name: string) => {
  const row = (await screen.findByText(name)).closest('tr') as HTMLElement
  await userEvent.click(await within(row).findByRole('button', { name: 'Open actions' }))
}

// The shop, which is the default, a depot and a counter that is a store.
export const Listed: Story = {
  play: async () => {
    await screen.findByText('Downtown counter')
  },
}

export const None: Story = {
  parameters: pageParameters({ records: [] }),
  play: async () => {
    await screen.findByText('No stock locations yet')
  },
}

export const Loading: Story = {
  parameters: pageParameters({ first: readHeld('stock_locations') }),
}

// The add sheet, with its details, behaviour, address, returns and pickup sections.
export const AddSheet: Story = {
  name: 'Add sheet',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add stock location' }))
    await screen.findByRole('heading', { name: 'Add stock location' })
  },
}

export const Adding: Story = {
  parameters: pageParameters({ search: '?new=true', first: writeHeld('stock_locations') }),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Name'), 'Harbour warehouse')
    await userEvent.click(screen.getByRole('button', { name: 'Create stock location' }))
  },
}

// The shop's sheet, from its own address, with its stock and its history below the form.
export const EditSheet: Story = {
  name: 'Edit sheet',
  parameters: pageParameters({ search: `?edit=${shop.id}` }),
  play: async () => {
    await screen.findByText('Stock at this location')
    await screen.findByText('Sand tote')
  },
}

export const SaveRefused: Story = {
  name: 'Save refused',
  parameters: pageParameters({
    search: `?edit=${shop.id}`,
    first: takenNameRefused('stock_locations/:id', 'patch'),
  }),
  play: async () => {
    const name = await screen.findByDisplayValue(shop.name)
    await userEvent.clear(name)
    await userEvent.type(name, 'East coast depot')
    // The panel's rows have Save buttons too, which stay off until a row changes.
    const [save] = screen
      .getAllByRole('button', { name: 'Save' })
      .filter((button) => !(button as HTMLButtonElement).disabled)
    await userEvent.click(save)
    // Under the name field and in the banner above the form.
    await screen.findAllByText(/already been taken/)
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  play: async () => {
    await rowMenu('Downtown counter')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Stock levels at this location will be deleted as well/)
  },
}

// Reading stock, writing nothing: no add button and no delete.
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  parameters: pageParameters({ rules: stockViewerRules }),
  play: async () => {
    await screen.findByText('Downtown counter')
  },
}

// The merchandiser template writes stock, which covers locations.
export const Merchandiser: Story = {
  parameters: pageParameters({ rules: templateRules.merchandiser.rules }),
  play: async () => {
    await screen.findByRole('button', { name: 'Add stock location' })
  },
}

// The order manager template holds neither stock nor settings: the settings
// menu leaves the page out. Opened directly, the page shows what the
// browser's answers give it; what the server answers is recorded from the
// running screen.
export const OrderManager: Story = {
  name: 'Order manager, opened directly',
  parameters: pageParameters({ rules: orderManagerRules }),
}
