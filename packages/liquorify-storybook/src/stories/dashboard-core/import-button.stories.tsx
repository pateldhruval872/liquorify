import { ImportButton, Subject } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, HttpResponse, http } from 'msw'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { withToaster } from '../../decorators/toaster'
import { mappingImport } from '../../fixtures/admin/merchandising'
import { readOnly } from '../../fixtures/admin/session'
import { uploadAccepted } from '../../mocks/handlers/admin/files'
import { importRequests } from '../../mocks/handlers/admin/merchandising'

// A story's own answers go ahead of the import's usual ones, since the
// first handler to match a request answers it.
const handlers = (first: ReturnType<typeof importRequests> = []) => ({
  ...storeParameters().msw.handlers,
  upload: uploadAccepted,
  imports: [...first, ...importRequests(mappingImport)],
})

/**
 * The toolbar's import entry point, as the translations page (DA-PRD-06) and
 * the product list place it: a sheet takes the CSV, which uploads on pick,
 * and Continue creates the import for the wizard (DA-OVL-05) to map.
 */
const meta = {
  title: 'Dashboard core/Import button',
  component: ImportButton,
  tags: ['CMP-CORE-12'],
  args: { type: 'products', subject: Subject.Product, onCreated: fn() },
  decorators: [withStore, withToaster],
  parameters: { ...storeParameters(), msw: { handlers: handlers() } },
} satisfies Meta<typeof ImportButton>

export default meta
type Story = StoryObj<typeof meta>

const sheet = { ...storeParameters().liquorify, capture: 'viewport' }

const openSheet = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Import' }))
  return screen.findByRole('dialog', { name: 'Import from CSV' })
}

const pickFile = async () => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement
  await userEvent.upload(
    input,
    new File(
      ['slug,sku,name,price\nstoneware-teapot,TEAPOT-STONE,Stoneware teapot,46.00\n'],
      'kitchen-products.csv',
      {
        type: 'text/csv',
      },
    ),
  )
  await screen.findByText('kitchen-products.csv')
  // Continue waits for the upload to finish.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
}

export const Button: Story = {
  play: async () => {
    await screen.findByRole('button', { name: 'Import' })
  },
}

// A teammate who may not create products is not offered the import.
export const WithoutPermission: Story = {
  name: 'Without permission',
  parameters: {
    ...storeParameters(undefined, readOnly),
    msw: { handlers: { ...handlers(), ...storeParameters(undefined, readOnly).msw.handlers } },
  },
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await expect(screen.queryByRole('button', { name: 'Import' })).toBeNull()
  },
}

export const Sheet: Story = {
  parameters: { liquorify: sheet },
  play: async () => {
    await openSheet()
    await screen.findByRole('button', { name: 'Download an example CSV' })
    await expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  },
}

// A type with no example file in Spree offers the template only.
export const WithoutExample: Story = {
  name: 'Without an example file',
  args: { type: 'purchase_orders', subject: Subject.PurchaseOrder },
  parameters: { liquorify: sheet },
  play: async () => {
    await openSheet()
    await screen.findByRole('button', { name: 'Download CSV template' })
    await expect(screen.queryByRole('button', { name: 'Download an example CSV' })).toBeNull()
  },
}

export const ChoosingSeparator: Story = {
  name: 'Choosing the separator',
  parameters: { liquorify: sheet },
  play: async () => {
    await openSheet()
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Semicolon (;)' })
  },
}

export const FileChosen: Story = {
  name: 'File chosen',
  parameters: { liquorify: sheet },
  play: async () => {
    await openSheet()
    await pickFile()
    await expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  },
}

export const Creating: Story = {
  parameters: {
    liquorify: sheet,
    msw: {
      handlers: handlers([
        http.post('/api/v3/admin/imports', async () => {
          await delay('infinite')
        }),
      ]),
    },
  },
  play: async () => {
    await openSheet()
    await pickFile()
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await expect(await screen.findByRole('button', { name: 'Creating…' })).toBeDisabled()
  },
}

// Continue hands the created import on, for the page to open the wizard,
// once the server has answered.
export const Created: Story = {
  parameters: { liquorify: sheet },
  play: async ({ args }) => {
    await openSheet()
    await pickFile()
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(args.onCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: mappingImport.id }),
      ),
    )
  },
}

export const Refused: Story = {
  parameters: {
    liquorify: sheet,
    msw: {
      handlers: handlers([
        http.post('/api/v3/admin/imports', async () => {
          await delay(200)
          return HttpResponse.json(
            {
              error: {
                code: 'validation_error',
                message: 'Attachment has not allowed content type',
                details: { attachment: ['has not allowed content type'] },
              },
            },
            { status: 422 },
          )
        }),
      ]),
    },
  },
  play: async () => {
    await openSheet()
    await pickFile()
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByText(/Import failed/)
  },
}
