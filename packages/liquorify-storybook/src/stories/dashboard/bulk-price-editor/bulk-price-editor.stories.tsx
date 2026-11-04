import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, type Mock, screen, userEvent, waitFor, within } from 'storybook/test'
import {
  BulkPriceEditor,
  type BulkPriceEditorProps,
  type BulkPriceEditorState,
} from '../../../../../dashboard/src/components/spree/bulk-price-editor/bulk-price-editor'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { longPriceList, tradeList } from '../../../fixtures/admin/merchandising'
import {
  priceRequests,
  priceSaveRefused,
  pricesHeld,
} from '../../../mocks/handlers/admin/merchandising'

/** The state the editor last reported to the dialog around it. */
function latest(args: BulkPriceEditorProps): BulkPriceEditorState {
  const calls = (args.onStateChange as unknown as Mock).mock.calls
  return calls[calls.length - 1][0] as BulkPriceEditorState
}

/** Waits for the prices and then the mug's quantity breaks, which load after them. */
async function loaded() {
  await screen.findByText('6 prices in USD')
  await screen.findByLabelText('Price for From qty 24')
}

async function typeInto(label: string, value: string, index = 0) {
  const cells = await screen.findAllByLabelText(label)
  await userEvent.dblClick(cells.at(index) as HTMLElement)
  await userEvent.keyboard(`${value}{Enter}`)
}

/**
 * The spreadsheet of one price list's prices inside the bulk price editor
 * (DA-PRD-17, and the catalog page that owns a list, DA-PRD-14): each
 * product's variants with the list's price and compare-at price, and below
 * each variant its quantity breaks, ending in an empty break to type into.
 * It searches by product, SKU or option and pages fifty variants at a time.
 * Its unsaved changes and its save are reported to the dialog around it,
 * which these stories stand in for. Spree's dashboard opens it only for a
 * price list, so its mode for shop prices, with no list, is not shown.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Bulk price editor',
  component: BulkPriceEditor,
  tags: ['CMP-DA-G-02'],
  args: { priceListId: tradeList.id, currency: 'USD', onStateChange: fn() },
  decorators: [
    // Innermost, so the editor sits in a box laid out as the dialog's body
    // is, at a fixed height, and scrolls as it does there.
    (Story) => (
      <div className="flex h-[640px] min-h-0 flex-col overflow-y-auto rounded border">
        <Story />
      </div>
    ),
    withStore,
    withToaster,
  ],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'page' },
    msw: { handlers: { ...storeParameters().msw.handlers, prices: priceRequests() } },
  },
} satisfies Meta<typeof BulkPriceEditor>

export default meta
type Story = StoryObj<typeof meta>

export const PriceList: Story = {
  name: "A price list's prices",
  play: async () => {
    await loaded()
    await expect(screen.getByLabelText('Price for From qty 24')).toHaveValue('14.00')
    await expect(screen.getByLabelText('Price for From qty 48')).toHaveValue('13.00')
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('')
    await expect(screen.getByLabelText('Compare-at price for Color: Olive, Size: M')).toHaveValue(
      '44.00',
    )
  },
}

export const Euros: Story = {
  name: 'In euros',
  args: { currency: 'EUR' },
  play: async () => {
    await screen.findByText('1 price in EUR')
    // Spree sends an empty options text for a product without options, so the
    // mug's price field is named "Price for" and nothing more.
    await expect(screen.getByLabelText('Price for')).toHaveValue('14.00')
  },
}

export const Loading: Story = {
  parameters: { msw: { handlers: { prices: pricesHeld } } },
  play: async () => {
    await screen.findByText('Loading…')
  },
}

export const NoProducts: Story = {
  name: 'No products on the list',
  parameters: { msw: { handlers: { prices: priceRequests([]) } } },
  play: async () => {
    await screen.findByText('Pick products on the price list to start setting prices.')
    await screen.findByText('No prices match the current filters.')
  },
}

export const Pages: Story = {
  name: 'A long list, in pages',
  parameters: { msw: { handlers: { prices: priceRequests(longPriceList) } } },
  play: async () => {
    await screen.findByText('55 prices in USD')
    await screen.findByText('Page 1 of 2')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Page 2 of 2')
    await screen.findByText('Walnut whisk')
    await expect(screen.queryByText('Clay basket')).not.toBeInTheDocument()
  },
}

export const Searching: Story = {
  play: async () => {
    await loaded()
    await userEvent.type(screen.getByPlaceholderText('Search by product, SKU, or option…'), 'slate')
    await screen.findByText('2 prices in USD')
    await expect(screen.getByLabelText('Price for Color: Slate, Size: M')).toHaveValue('34.00')
    await expect(screen.queryByText('Clay mug')).not.toBeInTheDocument()
  },
}

export const NoSearchMatches: Story = {
  name: 'No search matches',
  play: async () => {
    await loaded()
    await userEvent.type(
      screen.getByPlaceholderText('Search by product, SKU, or option…'),
      'walnut',
    )
    await screen.findByText('No prices match "walnut".')
  },
}

export const EditingAPrice: Story = {
  name: 'Editing a price',
  play: async ({ args }) => {
    await loaded()
    await typeInto('Price for Color: Slate, Size: L', '38.00')
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('38.00')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
  },
}

export const AddingABreak: Story = {
  name: 'Adding a quantity break',
  play: async ({ args }) => {
    await loaded()
    await typeInto('From quantity', '12', -1)
    await typeInto('Price for From qty 12', '10.50')
    await expect(screen.getByLabelText('Price for From qty 12')).toHaveValue('10.50')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
  },
}

export const RemovingABreak: Story = {
  name: 'Removing a quantity break',
  play: async ({ args }) => {
    await loaded()
    const [first] = screen.getAllByRole('button', { name: 'Remove this quantity break' })
    await userEvent.click(first)
    await expect(screen.getByLabelText('Price for From qty 24')).toHaveValue('')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
  },
}

export const BreakWithoutPrice: Story = {
  name: 'A quantity break with no price, at save',
  play: async ({ args }) => {
    await loaded()
    await typeInto('From quantity', '12', -1)
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
    await expect(await latest(args).save()).toBe(false)
    await screen.findByText(
      'Enter a price for the quantity break starting at 12, or clear the quantity to remove it.',
    )
  },
}

export const Saved: Story = {
  play: async ({ args }) => {
    await loaded()
    await typeInto('Price for Color: Slate, Size: L', '38.00')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
    await expect(await latest(args).save()).toBe(true)
    await screen.findByText('Saved 1 price')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(0))
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('38.00')
  },
}

export const SaveRefused: Story = {
  name: 'Save refused',
  parameters: {
    msw: { handlers: { prices: [...priceSaveRefused, ...priceRequests()] } },
  },
  play: async ({ args }) => {
    await loaded()
    await typeInto('Price for From qty 48', '16.00')
    await waitFor(() => expect(latest(args).dirtyCount).toBe(1))
    await expect(await latest(args).save()).toBe(false)
    const alert = await screen.findByRole('alert')
    await expect(
      within(alert).getByText(
        'A quantity break cannot cost more than the price a buyer pays below it',
      ),
    ).toBeVisible()
  },
}
