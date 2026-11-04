import type { PackageType, PermissionRule } from '@spree/admin-sdk'
import { PackageTypesPage, packageTypesSearchSchema } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRouterState } from '@tanstack/react-router'
import type { HttpHandler } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
// The owner column the admin dashboard adds to the shared table, as its route does.
import '../../../../../dashboard/src/tables/package-types'
import { packageTypes } from '../../../fixtures/admin/delivery'
import {
  deliveryEditorRules,
  deliveryViewerRules,
  orderManagerRules,
} from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { packageTypeRequests } from '../../../mocks/handlers/admin/delivery'
import { readHeld, writeHeld } from '../../../mocks/handlers/admin/records'
import { shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

/** The settings area's container around the page, reading its sheets from the address as its route does. */
function PackageTypes() {
  const search = packageTypesSearchSchema.parse(
    useRouterState({ select: (state) => state.location.search }),
  )
  return (
    <div className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <PackageTypesPage search={search} />
    </div>
  )
}

interface PageOptions {
  search?: string
  rules?: PermissionRule[]
  records?: PackageType[]
  first?: HttpHandler[]
}

function pageParameters({
  search = '',
  rules,
  records = packageTypes,
  first = [],
}: PageOptions = {}) {
  const base = shellParameters({
    route: {
      pattern: '/$storeId/settings/package-types',
      path: `/${shellStore.id}/settings/package-types${search}`,
    },
    rules,
  })
  const { handlers } = base.msw as { handlers: Record<string, HttpHandler[]> }
  return {
    ...base,
    msw: { handlers: { first, ...handlers, packageTypes: packageTypeRequests(records) } },
  }
}

// The package types page (DA-SET-19), in the store layout as the dashboard renders it.
const meta = {
  title: 'Dashboard core/Pages/Package types',
  component: PackageTypes,
  tags: ['CMP-CORE-PG-01'],
  decorators: [withStoreLayout],
  parameters: pageParameters(),
} satisfies Meta<typeof PackageTypes>

export default meta
type Story = StoryObj<typeof meta>

const rowMenu = async (name: string) => {
  const row = (await screen.findByText(name)).closest('tr') as HTMLElement
  await userEvent.click(await within(row).findByRole('button', { name: 'Open actions' }))
}

// A box, a carton and a pallet, each with its measurements; the box is the default.
export const Listed: Story = {
  play: async () => {
    await screen.findByText('Euro pallet')
  },
}

export const None: Story = {
  parameters: pageParameters({ records: [] }),
  play: async () => {
    await screen.findByText(/No packaging yet/)
  },
}

export const Loading: Story = {
  parameters: pageParameters({ first: readHeld('package_types') }),
}

export const AddSheet: Story = {
  name: 'Add sheet',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add package type' }))
    await screen.findByRole('heading', { name: 'Add package type' })
  },
}

export const Adding: Story = {
  parameters: pageParameters({ search: '?new=true', first: writeHeld('package_types') }),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Name'), 'Wine box')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  },
}

// The edit sheet, from its own address.
export const EditSheet: Story = {
  name: 'Edit sheet',
  parameters: pageParameters({ search: `?edit=${packageTypes[2].id}` }),
  play: async () => {
    await screen.findByDisplayValue('Euro pallet')
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  play: async () => {
    await rowMenu('Euro pallet')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Products packed into it must be repacked first/)
  },
}

// Read on package types: no add button and no row actions.
export const Viewer: Story = {
  parameters: pageParameters({ rules: deliveryViewerRules }),
  play: async () => {
    await screen.findByText('Euro pallet')
  },
}

// Write on package types while reading settings: the page is fully editable.
export const Editor: Story = {
  parameters: pageParameters({ rules: deliveryEditorRules }),
  play: async () => {
    await screen.findByRole('button', { name: 'Add package type' })
  },
}

// The order manager template holds no settings scope: the settings menu
// leaves the page out. Opened directly, the page shows what the browser's
// answers give it; what the server answers is recorded from the running screen.
export const OrderManager: Story = {
  name: 'Order manager, opened directly',
  parameters: pageParameters({ rules: orderManagerRules }),
}
