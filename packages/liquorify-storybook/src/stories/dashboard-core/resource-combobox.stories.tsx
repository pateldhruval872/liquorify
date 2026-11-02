import type { Catalog } from '@spree/admin-sdk'
import { adminClient, ResourceCombobox } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { adminUser } from '../../fixtures/admin/session'
import { catalogs } from '../../fixtures/admin/settings'
import { adminSession } from '../../mocks/handlers/admin/session'
import { catalogList } from '../../mocks/handlers/admin/settings'
import { onePage } from '../../mocks/page'

const nothing = () => {}

// A channel's default catalog (DA-SET-08), searched and shown through the
// Admin API as the channel sheet asks for it.
const meta = {
  title: 'Dashboard core/Resource combobox',
  component: ResourceCombobox<Catalog>,
  tags: ['CMP-CORE-23'],
  args: {
    id: 'channel-default-catalog',
    queryKey: 'story-default-catalogs',
    search: (query) => adminClient.catalogs.list({ name_cont: query, limit: 10 }),
    hydrate: (ids) => adminClient.catalogs.list({ id_in: ids, limit: ids.length }),
    getOptionLabel: (catalog) => catalog.name,
    placeholder: 'All published products',
    emptyText: 'No catalogs found',
    value: undefined,
    onChange: nothing,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), catalogs: catalogList() } },
  },
} satisfies Meta<typeof ResourceCombobox<Catalog>>

export default meta
type Story = StoryObj<typeof meta>

// Base UI renders a second, hidden combobox for the form value, so the field is found by its id.
const field = () => document.getElementById('channel-default-catalog') as HTMLElement

const opened = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(field())
    await screen.findByRole('option', { name: 'Retail catalog' })
  },
} satisfies Story

export const NothingChosen: Story = { name: 'Nothing chosen' }

// The chosen catalog is looked up by its id, so the field names it on arrival.
export const Chosen: Story = {
  args: { value: catalogs[0].id },
  play: async () => {
    await screen.findByDisplayValue('Trade catalog')
  },
}

export const Open: Story = opened

export const Searched: Story = {
  ...opened,
  play: async () => {
    await userEvent.type(field(), 'trade')
    await screen.findByRole('option', { name: 'Trade catalog' })
  },
}

export const NothingFound: Story = {
  ...opened,
  name: 'Nothing found',
  play: async () => {
    await userEvent.type(field(), 'outlet')
    await screen.findByText('No catalogs found')
  },
}

// More records than the list shows, and a row for adding the one not found.
export const MoreAndAdd: Story = {
  name: 'More results, and add',
  args: {
    queryKey: 'story-catalogs-more',
    search: async () => ({ ...onePage(catalogs), meta: { ...onePage(catalogs).meta, count: 14 } }),
    action: { label: 'New catalog', onSelect: nothing },
  },
  parameters: opened.parameters,
  play: async () => {
    await userEvent.click(field())
    await screen.findByText('12 more results not shown. Type to search.')
  },
}

export const Disabled: Story = { args: { value: catalogs[0].id, disabled: true } }
