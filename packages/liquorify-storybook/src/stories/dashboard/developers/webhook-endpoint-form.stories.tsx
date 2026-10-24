import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { WebhookEndpointFormFields } from '../../../../../dashboard/src/components/spree/webhook-endpoint-form'
import {
  DEFAULT_WEBHOOK_ENDPOINT_VALUES,
  type WebhookEndpointFormValues,
  webhookEndpointFormSchema,
} from '../../../../../dashboard/src/schemas/webhook-endpoint'
import { adminUser } from '../../../fixtures/admin/session'
import { orderSyncEndpoint } from '../../../fixtures/admin/webhooks'
import {
  eventCatalog,
  eventCatalogFailed,
  eventCatalogHeld,
} from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'

interface Props {
  values?: Partial<WebhookEndpointFormValues>
  /** Runs the form's own validation on the values, as saving would. */
  validate?: boolean
}

// The sheets validate with this schema through react-hook-form's zod resolver,
// which this package does not depend on; this reports the schema's issues the
// same way for these flat fields.
const resolver: Resolver<WebhookEndpointFormValues> = async (values) => {
  const result = webhookEndpointFormSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    errors[field] ??= { type: issue.code, message: issue.message }
  }
  return { values: {}, errors: errors as never }
}

// The fields of the webhooks page's create sheet and the endpoint page's edit
// sheet (DA-SET-28, DA-SET-29), at the width and text size the sheets give
// them, in a form set up as theirs is.
function EndpointForm({ values, validate = false }: Props) {
  const form = useForm<WebhookEndpointFormValues>({
    resolver,
    defaultValues: { ...DEFAULT_WEBHOOK_ENDPOINT_VALUES, ...values },
  })
  useEffect(() => {
    if (validate) form.trigger()
  }, [validate, form])
  return (
    <form className="flex w-[566px] flex-col gap-4 text-sm">
      <WebhookEndpointFormFields form={form} />
    </form>
  )
}

const meta = {
  title: 'Admin dashboard/Webhooks/Endpoint form',
  component: EndpointForm,
  tags: ['CMP-DA-G-24'],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), events: eventCatalog } },
  },
} satisfies Meta<typeof EndpointForm>

export default meta
type Story = StoryObj<typeof meta>

const catalog = () => screen.findByText('order.completed')

// Choosing no events subscribes the endpoint to all of them.
export const AllEvents: Story = { name: 'All events', play: async () => void (await catalog()) }

export const ChosenEvents: Story = {
  name: 'Chosen events',
  args: {
    values: {
      name: orderSyncEndpoint.name,
      url: orderSyncEndpoint.url,
      subscriptions: orderSyncEndpoint.subscriptions,
    },
  },
  play: async () => void (await catalog()),
}

// A deprecated event is offered only to an endpoint still subscribed to it,
// and an event outside the catalog is listed on its own.
export const DeprecatedAndCustomEvents: Story = {
  name: 'Deprecated and custom events',
  args: {
    values: { url: orderSyncEndpoint.url, subscriptions: ['digital.created', 'warehouse.synced'] },
  },
  play: async () => void (await catalog()),
}

export const AddingACustomEvent: Story = {
  name: 'Adding a custom event',
  play: async () => {
    await catalog()
    await userEvent.type(screen.getByPlaceholderText(/custom/i), 'warehouse.synced')
  },
}

export const UrlRequired: Story = {
  name: 'URL required',
  args: { validate: true },
  play: async () => {
    await catalog()
    await waitFor(() =>
      expect(screen.getByLabelText('Destination URL')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}

export const UrlInvalid: Story = {
  name: 'URL invalid',
  args: { values: { url: 'hooks.example.com/orders' }, validate: true },
  play: async () => void (await catalog()),
}

export const EventsLoading: Story = {
  name: 'Events loading',
  parameters: { msw: { handlers: { events: eventCatalogHeld } } },
}

// The catalog failed to load; the form offers to try again.
export const EventsFailed: Story = {
  name: 'Events failed',
  parameters: { msw: { handlers: { events: eventCatalogFailed } } },
  play: async () => {
    await screen.findByRole('button', { name: 'Try again' }, { timeout: 15_000 })
  },
}
