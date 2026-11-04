import { ExportButton, ExportRecordButton } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { withToaster } from '../../decorators/toaster'
import { exportHeld, exportRefused, exportRequests } from '../../mocks/handlers/admin/merchandising'

/**
 * Export from a list page's toolbar, as the translations page (DA-PRD-06)
 * places it: the dialog asks whether to export what the search shows or
 * everything, then the file is prepared, polled for and downloaded.
 */
const meta = {
  title: 'Dashboard core/Export button',
  component: ExportButton,
  tags: ['CMP-CORE-09'],
  args: {
    type: 'product_translations',
    filters: [],
    search: '',
    searchParam: 'name_cont',
    columns: [],
    totalCount: 6,
  },
  decorators: [withStore, withToaster],
  parameters: {
    ...storeParameters(),
    msw: { handlers: { ...storeParameters().msw.handlers, exports: exportRequests() } },
  },
} satisfies Meta<typeof ExportButton>

export default meta
type Story = StoryObj<typeof meta>

const dialog = { liquorify: { ...storeParameters().liquorify, capture: 'viewport' } }

export const Button: Story = {
  play: async () => {
    await screen.findByRole('button', { name: 'Export' })
  },
}

// With no search, the filtered choice says it is the same as exporting everything.
export const NoFilter: Story = {
  name: 'Dialog, no filter',
  parameters: dialog,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await screen.findByText('No filter active — same as exporting all records.')
  },
}

export const Filtered: Story = {
  name: 'Dialog, filtered',
  args: { search: 'mug', totalCount: 2 },
  parameters: dialog,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await screen.findByText('Export the 2 records matching your current filter.')
  },
}

// The count is still loading when the dialog opens.
export const CountUnknown: Story = {
  name: 'Dialog, count unknown',
  args: { search: 'mug', totalCount: undefined },
  parameters: dialog,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await screen.findByText('Export the records matching your current filter.')
  },
}

export const ChoosingAll: Story = {
  name: 'Choosing all records',
  args: { search: 'mug', totalCount: 2 },
  parameters: dialog,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    const all = await screen.findByRole('radio', { name: /All records/ })
    await userEvent.click(all)
    await expect(all).toBeChecked()
  },
}

export const Preparing: Story = {
  parameters: {
    ...dialog,
    msw: { handlers: { ...storeParameters().msw.handlers, exports: exportHeld } },
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Export' }),
    )
    await screen.findByText('Preparing export…')
  },
}

export const Downloaded: Story = {
  parameters: dialog,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Export' }),
    )
    await screen.findByText('Export downloaded')
  },
}

export const Refused: Story = {
  parameters: {
    ...dialog,
    msw: { handlers: { ...storeParameters().msw.handlers, exports: exportRefused } },
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Export' }),
    )
    await screen.findByText(/Export failed/)
  },
}

/**
 * Export from a record's own page, one price list's prices (DA-PRD-17): the
 * page has decided what the file holds, so one press queues it.
 */
export const RecordButton: StoryObj<typeof ExportRecordButton> = {
  name: 'Record button',
  render: () => (
    <ExportRecordButton
      type="price_list_prices"
      searchParams={{ price_list_id_eq: 'pl_6Tr8Dw2S' }}
    />
  ),
  play: async () => {
    await screen.findByRole('button', { name: 'Export' })
  },
}

export const RecordButtonExporting: StoryObj<typeof ExportRecordButton> = {
  name: 'Record button, exporting',
  render: RecordButton.render,
  parameters: {
    ...dialog,
    msw: { handlers: { ...storeParameters().msw.handlers, exports: exportHeld } },
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))
    await expect(await screen.findByRole('button', { name: 'Exporting…' })).toBeDisabled()
  },
}
