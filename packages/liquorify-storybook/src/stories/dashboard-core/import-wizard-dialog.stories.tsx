import type { Import } from '@spree/admin-sdk'
import { ImportWizardDialog } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { withToaster } from '../../decorators/toaster'
import {
  completedImport,
  failedImport,
  mappingImport,
  partlyFailedImport,
  processingImport,
  queuedImport,
  unmappedImport,
} from '../../fixtures/admin/merchandising'
import {
  importFailedToLoad,
  importHeld,
  importRequests,
  mappingRefused,
} from '../../mocks/handlers/admin/merchandising'

/**
 * The CSV import wizard (DA-OVL-05) both panels share, driving one product
 * import from its column mapping through processing to its results. It opens
 * over the page that started it, from the product list, the translations
 * page (DA-PRD-06), a catalog or price list (DA-PRD-14, DA-PRD-17), or the
 * imports history (DA-SET-31).
 */
const meta = {
  title: 'Dashboard core/Import wizard dialog',
  component: ImportWizardDialog,
  tags: ['CMP-CORE-13'],
  args: { importId: mappingImport.id, onClose: fn(), onViewRecords: fn() },
  decorators: [withStore, withToaster],
} satisfies Meta<typeof ImportWizardDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The wizard at one import. A story's own answers go ahead of the import's
 * usual ones, since the first handler to match a request answers it.
 */
function at(
  record: Import,
  options: Parameters<typeof importRequests>[1] = {},
  first: ReturnType<typeof importRequests> = [],
) {
  return {
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
    msw: {
      handlers: {
        ...storeParameters().msw.handlers,
        imports: [...first, ...importRequests(record, options)],
      },
    },
  }
}

const wizard = () => screen.findByRole('dialog', { name: 'Import' })

export const Mapping: Story = {
  parameters: at(mappingImport),
  play: async () => {
    await screen.findByText('Match the columns from your file to Products fields.')
    await expect(screen.getByRole('button', { name: 'Start import' })).toBeEnabled()
  },
}

// A required field with no column holds Start, and the footer names it.
export const RequiredNotMapped: Story = {
  name: 'Required field not mapped',
  args: { importId: unmappedImport.id },
  parameters: at(unmappedImport),
  play: async () => {
    await screen.findByText('Map the required fields to continue: Price')
    await expect(screen.getByRole('button', { name: 'Start import' })).toBeDisabled()
  },
}

// A column already given to another field cannot be picked twice.
export const ChoosingColumn: Story = {
  name: 'Choosing a column',
  args: { importId: unmappedImport.id },
  parameters: at(unmappedImport),
  play: async () => {
    const row = (await screen.findByText('Price')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('combobox'))
    await screen.findByRole('option', { name: 'unit_price' })
    await expect(screen.getByRole('option', { name: 'slug' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

export const Started: Story = {
  parameters: at(mappingImport, { next: queuedImport }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Start import' }))
    await screen.findByText('Preparing rows…')
  },
}

// Someone else started the import first, so Spree refuses this Start.
export const StartRefused: Story = {
  name: 'Start refused',
  parameters: at(mappingImport, {}, mappingRefused),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Start import' }))
    await screen.findByText('Import is not in the mapping state')
  },
}

export const DiscardingMapping: Story = {
  name: 'Discarding mapping changes',
  parameters: at(mappingImport),
  play: async () => {
    const row = (await screen.findByText('Tags')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Not mapped' }))
    await userEvent.keyboard('{Escape}')
    await screen.findByRole('dialog', { name: 'Discard this draft?' })
  },
}

export const Preparing: Story = {
  args: { importId: queuedImport.id },
  parameters: at(queuedImport),
  play: async () => {
    await screen.findByText('Preparing rows…')
  },
}

export const Processing: Story = {
  args: { importId: processingImport.id },
  parameters: at(processingImport),
  play: async () => {
    await screen.findByText('7 of 12 rows processed')
    await screen.findByText('Failed rows')
  },
}

export const Completed: Story = {
  args: { importId: completedImport.id },
  parameters: at(completedImport, { rows: [] }),
  play: async () => {
    await screen.findByText('12 rows imported · 0 failed')
    await screen.findByRole('button', { name: 'View Products' })
  },
}

export const CompletedWithFailures: Story = {
  name: 'Completed with failures',
  args: { importId: partlyFailedImport.id },
  parameters: at(partlyFailedImport),
  play: async () => {
    await screen.findByText('10 rows imported · 2 failed')
    await screen.findByText('price must be a number like 16.50, got 18,00.')
    await screen.findByRole('button', { name: 'Retry failed rows (2)' })
  },
}

export const ViewingRowData: Story = {
  name: 'Viewing a failed row',
  args: { importId: partlyFailedImport.id },
  parameters: at(partlyFailedImport),
  play: async () => {
    const [first] = await screen.findAllByRole('button', { name: 'View row data' })
    await userEvent.click(first)
    await screen.findByText(/"sku": "MUG-SPECKLED"/)
  },
}

export const Retrying: Story = {
  args: { importId: partlyFailedImport.id },
  parameters: at(partlyFailedImport),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Retry failed rows (2)' }))
    await screen.findByText('Retrying failed rows · 2 remaining')
  },
}

export const ViewingRecords: Story = {
  name: 'Viewing the records',
  args: { importId: completedImport.id },
  parameters: at(completedImport, { rows: [] }),
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'View Products' }))
    await expect(args.onViewRecords).toHaveBeenCalledWith('products', expect.anything())
    await expect(args.onClose).toHaveBeenCalled()
  },
}

// A panel that names nowhere to go shows the results without the button.
export const WithoutRecordsLink: Story = {
  name: 'Without a records link',
  args: { importId: completedImport.id, onViewRecords: undefined },
  parameters: at(completedImport, { rows: [] }),
  play: async () => {
    await screen.findByText('Import completed')
    await expect(screen.queryByRole('button', { name: 'View Products' })).toBeNull()
  },
}

export const Failed: Story = {
  args: { importId: failedImport.id },
  parameters: at(failedImport, { rows: [] }),
  play: async () => {
    await screen.findByText('Import failed')
    await screen.findByText(/Unquoted fields do not allow new line/)
  },
}

export const Loading: Story = {
  parameters: at(mappingImport, {}, importHeld),
  play: async () => {
    await wizard()
  },
}

export const LoadError: Story = {
  name: 'Load error',
  parameters: at(mappingImport, {}, importFailedToLoad),
  play: async () => {
    await screen.findByText('Could not load the import.', {}, { timeout: 15000 })
  },
}
