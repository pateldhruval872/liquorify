import { queryClient } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { CommandPalette } from '../../../../../dashboard/src/components/spree/command-palette/command-palette'
import { searchCustomers, searchOrders, searchProducts } from '../../../fixtures/admin/shell'
import { searchResults } from '../../../mocks/handlers/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from './store-layout'

const meta = {
  title: 'Admin dashboard/Shell/Command palette',
  component: CommandPalette,
  tags: ['CMP-DA-G-05'],
  // Search and commands over every store page (DA-OVL-02), opened from the
  // rail's search box as a merchant would, or with Ctrl K or ⌘ K.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Waits for the page to finish loading, as a merchant does before searching.
 * Opened earlier, while the permissions are still on their way, the palette
 * lists only Home, and keeps Home picked when the other pages arrive above it.
 * The permissions are asked for only once the session is restored, so nothing
 * loading is not enough: they must have arrived.
 */
async function pageLoaded() {
  await waitFor(
    () => {
      expect(
        queryClient.getQueryCache().find({ queryKey: ['permissions'], exact: false })?.state.data,
      ).toBeDefined()
      expect(queryClient.isFetching()).toBe(0)
    },
    { timeout: 5000 },
  )
}

async function openPalette(query?: string) {
  await pageLoaded()
  await userEvent.click(await screen.findByRole('button', { name: /Search anything/ }))
  const field = await screen.findByPlaceholderText('Search products, orders, customers…')
  if (query) await userEvent.type(field, query)
}

// Before anything is typed: every page the reader may open, then signing out.
export const Open: Story = {
  play: async () => {
    await openPalette()
    await screen.findByRole('option', { name: 'Home' })
  },
}

// A search runs once two letters are typed, one request per kind of record
// the reader may read, and each kind that found something gets its group.
export const Results: Story = {
  parameters: {
    msw: {
      handlers: {
        search: searchResults({
          products: searchProducts,
          orders: searchOrders,
          customers: searchCustomers,
        }),
      },
    },
  },
  play: async () => {
    await openPalette('tote')
    await screen.findByRole('option', { name: /Spree Tote/ })
    await screen.findByRole('option', { name: /R1042/ })
  },
}

// A bare verb lists everything the reader may create.
export const CreateActions: Story = {
  name: 'Create actions',
  play: async () => {
    await openPalette('new')
    await screen.findByRole('option', { name: 'New Product' })
  },
}

export const NothingMatches: Story = {
  name: 'Nothing matches',
  play: async () => {
    await openPalette('zzqx')
    await screen.findByText('No results for "zzqx".')
  },
}

// On a phone the palette opens from the top bar's search button, without the
// keyboard hints.
export const OnAPhone: Story = {
  name: 'On a phone',
  tags: ['phone'],
  play: async () => {
    await pageLoaded()
    await userEvent.click(await screen.findByRole('button', { name: 'Search anything…' }))
    await screen.findByRole('option', { name: 'Home' })
  },
}
