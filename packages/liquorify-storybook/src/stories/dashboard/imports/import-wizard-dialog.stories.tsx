import type { Import } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { ImportWizardDialog } from '../../../../../dashboard/src/components/spree/imports/import-wizard-dialog'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import {
  completedImport,
  mappingImport,
  priceListPricesImport,
} from '../../../fixtures/admin/merchandising'
import { shellStore } from '../../../fixtures/admin/shell'
import { importRequests } from '../../../mocks/handlers/admin/merchandising'

/**
 * The shared import wizard (DA-OVL-05) as the admin dashboard opens it: the
 * same steps, plus where "View records" leads when an import finishes, which
 * depends on what was imported. Its steps have their own stories under
 * Dashboard core.
 */
const meta = {
  title: 'Admin dashboard/Imports/Import wizard dialog',
  component: ImportWizardDialog,
  tags: ['CMP-DA-G-09'],
  args: { importId: mappingImport.id, onClose: fn() },
  decorators: [withStore, withToaster],
} satisfies Meta<typeof ImportWizardDialog>

export default meta
type Story = StoryObj<typeof meta>

/** The wizard over the imports history, at one import. */
function from(record: Import) {
  const base = storeParameters()
  return {
    liquorify: {
      ...base.liquorify,
      capture: 'viewport',
      route: {
        pattern: '/$storeId/settings/imports',
        path: `/${shellStore.id}/settings/imports`,
        showDestination: true,
      },
    },
    msw: {
      handlers: { ...base.msw.handlers, imports: importRequests(record, { rows: [] }) },
    },
  }
}

export const Mapping: Story = {
  parameters: from(mappingImport),
  play: async () => {
    await screen.findByText('Match the columns from your file to Products fields.')
  },
}

// A finished product import leads to the product list.
export const ViewingProducts: Story = {
  name: 'Viewing imported products',
  args: { importId: completedImport.id },
  parameters: from(completedImport),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'View Products' }))
    await screen.findByText(`Opened /${shellStore.id}/products`)
  },
}

// Prices imported into a price list lead back to that price list.
export const ViewingPriceList: Story = {
  name: 'Viewing imported prices',
  args: { importId: priceListPricesImport.id },
  parameters: from(priceListPricesImport),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /^View / }))
    await screen.findByText(
      `Opened /${shellStore.id}/products/price-lists/${priceListPricesImport.price_list_id}`,
    )
  },
}
