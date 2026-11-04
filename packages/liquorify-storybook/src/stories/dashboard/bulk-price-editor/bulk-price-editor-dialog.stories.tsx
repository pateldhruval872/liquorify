import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { BulkPriceEditorDialog } from '../../../../../dashboard/src/components/spree/bulk-price-editor/bulk-price-editor-dialog'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { linenApron } from '../../../fixtures/admin/catalog'
import { longPriceList, tradeList } from '../../../fixtures/admin/merchandising'
import { priceRequests } from '../../../mocks/handlers/admin/merchandising'

const title = 'Edit prices — Trade prices'

/** Waits for the prices and the mug's quantity breaks, which load after them. */
async function loaded() {
  await screen.findByText('6 prices in USD')
  await screen.findByLabelText('Price for From qty 24')
}

async function priceSlateLarge() {
  await loaded()
  await userEvent.dblClick(screen.getByLabelText('Price for Color: Slate, Size: L'))
  await userEvent.keyboard('38.00{Enter}')
  await screen.findByText('1 unsaved change')
}

/**
 * The full-screen dialog the price list page and the catalog page open to
 * edit a list's prices (DA-PRD-17, DA-PRD-14): the bulk price editor under a
 * header with the list's name, the count of unsaved changes, a currency
 * choice from the store's currencies, Discard, Save prices and Close. Closing
 * or changing currency with unsaved changes asks first; Escape leaves the
 * dialog open, since it belongs to the cell being edited.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Bulk price editor dialog',
  component: BulkPriceEditorDialog,
  tags: ['CMP-DA-G-02'],
  args: { open: true, onOpenChange: fn(), priceList: tradeList },
  decorators: [withStore, withToaster],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
    msw: { handlers: { ...storeParameters().msw.handlers, prices: priceRequests() } },
  },
} satisfies Meta<typeof BulkPriceEditorDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    await screen.findByRole('dialog', { name: title })
    await loaded()
    await expect(screen.getByRole('button', { name: 'Save prices' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled()
  },
}

export const UnsavedChanges: Story = {
  name: 'With unsaved changes',
  play: async () => {
    await priceSlateLarge()
    await expect(screen.getByRole('button', { name: 'Save prices' })).toBeEnabled()
    await expect(screen.getByRole('button', { name: 'Discard' })).toBeEnabled()
  },
}

export const Saved: Story = {
  play: async () => {
    await priceSlateLarge()
    await userEvent.click(screen.getByRole('button', { name: 'Save prices' }))
    await screen.findByText('Saved 1 price')
    await waitFor(() => expect(screen.queryByText('1 unsaved change')).not.toBeInTheDocument())
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('38.00')
  },
}

export const Discarded: Story = {
  play: async () => {
    await priceSlateLarge()
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    await waitFor(() => expect(screen.queryByText('1 unsaved change')).not.toBeInTheDocument())
    await expect(screen.getByLabelText('Price for Color: Slate, Size: L')).toHaveValue('')
  },
}

export const ClosingUnchanged: Story = {
  name: 'Closing with nothing changed',
  play: async ({ args }) => {
    await loaded()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await expect(args.onOpenChange).toHaveBeenCalledWith(false)
  },
}

export const ClosingWithChanges: Story = {
  name: 'Closing with unsaved changes',
  play: async ({ args }) => {
    await priceSlateLarge()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    const confirm = await screen.findByRole('dialog', { name: 'Discard unsaved prices?' })
    await within(confirm).findByText('You have 1 unsaved price. Closing will discard it.')
    await expect(args.onOpenChange).not.toHaveBeenCalled()
  },
}

export const ClosedDiscardingChanges: Story = {
  name: 'Closed, discarding changes',
  play: async ({ args }) => {
    await priceSlateLarge()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    const confirm = await screen.findByRole('dialog', { name: 'Discard unsaved prices?' })
    await userEvent.click(within(confirm).getByRole('button', { name: /discard/i }))
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false))
  },
}

export const EscapeLeavesItOpen: Story = {
  name: 'Escape leaves it open',
  play: async ({ args }) => {
    await loaded()
    await userEvent.keyboard('{Escape}')
    await expect(screen.getByRole('dialog', { name: title })).toBeVisible()
    await expect(args.onOpenChange).not.toHaveBeenCalled()
  },
}

export const Euros: Story = {
  name: 'Switched to euros',
  play: async () => {
    await loaded()
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'EUR' }))
    await screen.findByText('1 price in EUR')
  },
}

export const SwitchingCurrencyWithChanges: Story = {
  name: 'Switching currency with unsaved changes',
  play: async () => {
    await priceSlateLarge()
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'EUR' }))
    const confirm = await screen.findByRole('dialog', { name: 'Discard unsaved prices?' })
    await within(confirm).findByText('Switching currency will discard your unsaved prices.')
  },
}

export const Pages: Story = {
  name: 'A long list, in pages',
  parameters: { msw: { handlers: { prices: priceRequests(longPriceList) } } },
  play: async () => {
    await screen.findByText('55 prices in USD')
    await screen.findByText('Page 1 of 2')
  },
}

export const ProductsLeftOut: Story = {
  name: 'Products being removed, left out',
  args: { excludeProductIds: [linenApron.id] },
  play: async () => {
    await screen.findByText('2 prices in USD')
    await expect(screen.queryByText('Linen apron')).not.toBeInTheDocument()
  },
}
