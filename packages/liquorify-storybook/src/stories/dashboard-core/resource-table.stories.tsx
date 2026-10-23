import type { AllowedOrigin, WebhookEndpoint } from '@spree/admin-sdk'
import { ResourceTable, resourceSearchSchema } from '@spree/dashboard-core'
import { PlusIcon } from '@spree/dashboard-ui/icons'
import { RowActions } from '@spree/dashboard-ui/spree/row-actions'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import '../../../../dashboard/src/tables/allowed-origins'
import '../../../../dashboard/src/tables/webhook-endpoints'
import { allowedOrigins, manyAllowedOrigins } from '../../fixtures/admin/allowed-origins'
import { adminUser } from '../../fixtures/admin/session'
import { webhookEndpoints } from '../../fixtures/admin/webhooks'
import { adminSession } from '../../mocks/handlers/admin/session'

const nothing = () => {}

/** One page of `records`, in the `{ data, meta }` shape list endpoints answer with. */
function pageOf<T>(records: T[], page = 1, limit = 25) {
  const pages = Math.max(1, Math.ceil(records.length / limit))
  const data = records.slice((page - 1) * limit, page * limit)
  const from = data.length > 0 ? (page - 1) * limit + 1 : 0
  return {
    data,
    meta: {
      page,
      limit,
      count: records.length,
      pages,
      from,
      to: from + data.length - (data.length > 0 ? 1 : 0),
      in: data.length,
      previous: page > 1 ? page - 1 : null,
      next: page < pages ? page + 1 : null,
    },
  }
}

/** Answers as the Admin API does: by the `search` term, a page at a time. */
function listing<T>(records: T[], text: (record: T) => string) {
  return async (params: { page?: number; limit?: number; search?: string }) => {
    const term = params.search?.toLowerCase()
    const found = term ? records.filter((record) => text(record).includes(term)) : records
    return pageOf(found, params.page ?? 1, params.limit ?? 25)
  }
}

const never = () => new Promise<never>(() => {})

// The allowed origins page (DA-SET-30): its table, with the page's own Add
// button and each row's edit and delete actions.
function AllowedOriginsTable({
  queryFn = listing(allowedOrigins, (origin) => origin.origin) as never,
  page,
  search,
}: {
  queryFn?: (params: never) => Promise<unknown>
  page?: number
  search?: string
}) {
  return (
    <ResourceTable<AllowedOrigin>
      tableKey="allowed-origins"
      queryKey="allowed-origins"
      queryFn={queryFn as never}
      searchParams={resourceSearchSchema.parse({ page, search })}
      rowActions={() => (
        <RowActions
          actions={[
            { key: 'edit', onSelect: nothing },
            { key: 'delete', destructive: true, onSelect: nothing },
          ]}
        />
      )}
      actions={
        <Button size="sm" className="h-[2.125rem]">
          <PlusIcon className="size-4" />
          Add allowed origin
        </Button>
      }
    />
  )
}

const meta = {
  title: 'Dashboard core/Resource table',
  component: AllowedOriginsTable,
  tags: ['CMP-CORE-26'],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, column: 'settings' },
    msw: { handlers: { session: adminSession() } },
  },
} satisfies Meta<typeof AllowedOriginsTable>

export default meta
type Story = StoryObj<typeof meta>

const rows = async () => {
  await screen.findByText('https://shop.example.com')
}

export const Listed: Story = { play: rows }

export const Loading: Story = { args: { queryFn: never } }

export const Empty: Story = {
  args: { queryFn: listing([], () => '') as never },
  play: async () => {
    await screen.findByText('No allowed origins yet')
  },
}

// A search that matches nothing says so, and suggests changing it. The search
// arrives in the address, as it does on the running page.
export const NothingFound: Story = {
  name: 'Nothing found',
  args: { search: 'checkout' },
  play: async () => {
    await screen.findByText(/adjust/i)
  },
}

export const SecondPage: Story = {
  name: 'Second page',
  args: {
    queryFn: listing(manyAllowedOrigins, (origin) => origin.origin) as never,
    page: 2,
  },
  play: async () => {
    await screen.findByText('https://store-26.example.com')
  },
}

export const RowActionsOpen: Story = {
  name: 'Row actions open',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await rows()
    await userEvent.click(screen.getAllByRole('button', { name: 'Open actions' })[0])
    await screen.findByRole('menu')
  },
}

// The webhooks page (DA-SET-28), whose columns state each endpoint's health.
export const WebhookEndpoints: Story = {
  name: 'Webhook endpoints',
  render: () => (
    <ResourceTable<WebhookEndpoint>
      tableKey="webhook-endpoints"
      queryKey="webhook-endpoints"
      queryFn={listing(webhookEndpoints, (endpoint) => endpoint.url) as never}
      searchParams={resourceSearchSchema.parse({})}
      rowActions={() => <RowActions actions={[{ key: 'edit', onSelect: nothing }]} />}
    />
  ),
  play: async () => {
    await screen.findByText('Order sync')
  },
}
