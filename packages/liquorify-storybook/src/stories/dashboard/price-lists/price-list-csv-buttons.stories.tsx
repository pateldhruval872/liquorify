import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PriceListCsvButtons } from '../../../../../dashboard/src/components/spree/price-list-csv-buttons'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { priceListPricesImport, tradeList } from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'
import { uploadAccepted } from '../../../mocks/handlers/admin/files'
import { exportRequests, importRequests } from '../../../mocks/handlers/admin/merchandising'

const handlers = {
  upload: uploadAccepted,
  imports: importRequests(priceListPricesImport),
  exports: exportRequests({
    ...priceListPricesImport,
    id: 'exp_6Pl9Ex3U',
    number: 'EF593024168',
    type: 'price_list_prices',
    done: true,
    filename: 'price_list_prices-sample-20261001115800.csv',
    download_url: '/api/v3/admin/exports/exp_6Pl9Ex3U/download',
  } as never),
}

/**
 * One price list's prices in and out as CSV (DA-PRD-17, and the catalog page
 * that owns a list, DA-PRD-14): the import is bound to the list before its
 * sheet opens, and the export holds only its prices.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Price list CSV buttons',
  component: PriceListCsvButtons,
  tags: ['CMP-DA-G-24'],
  args: { priceList: tradeList, onImportCreated: fn() },
  decorators: [withStore, withToaster],
  parameters: {
    ...storeParameters(),
    msw: { handlers: { ...storeParameters().msw.handlers, ...handlers } },
  },
} satisfies Meta<typeof PriceListCsvButtons>

export default meta
type Story = StoryObj<typeof meta>

export const Buttons: Story = {
  play: async () => {
    await screen.findByRole('button', { name: 'Import' })
    await screen.findByRole('button', { name: 'Export' })
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const ImportSheet: Story = {
  name: 'Import sheet',
  parameters: { liquorify: { ...storeParameters().liquorify, capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Import' }))
    const sheet = await screen.findByRole('dialog', { name: 'Import from CSV' })
    await within(sheet).findByText('Download an example CSV')
  },
}

/**
 * Spree's answer to the import the sheet creates, carrying back the price
 * list the request named, so the story shows the import was bound to it.
 */
const createdForList = http.post('/api/v3/admin/imports', async ({ request }) => {
  const body = (await request.json()) as { price_list_id?: string }
  return HttpResponse.json(
    { ...priceListPricesImport, status: 'mapping', price_list_id: body.price_list_id ?? null },
    { status: 201 },
  )
})

// The file never names a list: the import is made for this one.
export const ImportingForList: Story = {
  name: 'Importing for this list',
  parameters: {
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
    msw: {
      handlers: {
        ...storeParameters().msw.handlers,
        ...handlers,
        imports: [createdForList, ...importRequests(priceListPricesImport)],
      },
    },
  },
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Import' }))
    await screen.findByRole('dialog', { name: 'Import from CSV' })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement
    await userEvent.upload(
      input,
      new File(['sku,currency,amount\nMUG-CLAY,USD,15.00\n'], 'trade-prices.csv', {
        type: 'text/csv',
      }),
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(args.onImportCreated).toHaveBeenCalledWith(
        expect.objectContaining({ price_list_id: tradeList.id }),
      ),
    )
  },
}

// A role that may only read price lists can still export them.
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  parameters: {
    ...storeParameters(undefined, readOnly),
    msw: { handlers: { ...storeParameters(undefined, readOnly).msw.handlers, ...handlers } },
  },
  play: async () => {
    await screen.findByRole('button', { name: 'Export' })
    await expect(screen.queryByRole('button', { name: 'Import' })).toBeNull()
  },
}
