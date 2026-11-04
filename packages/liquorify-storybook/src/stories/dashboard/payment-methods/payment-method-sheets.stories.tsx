import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import {
  CreatePaymentMethodSheet,
  EditPaymentMethodSheet,
} from '../../../../../dashboard/src/components/spree/payment-method-editors/payment-method-sheets'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  bogusType,
  chequeMethod,
  installedPaymentMethodTypes,
  paymentMethods,
  paymentMethodTypes,
  storeCreditMethod,
  stripeTypeFromSource,
  testGateway,
} from '../../../fixtures/admin/payments'
import { paymentMethodRequests } from '../../../mocks/handlers/admin/payments'
import { readHeld, takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'

const nothing = () => {}

/**
 * A store whose only payment method is store credit, so the add sheet offers
 * the test gateway and the cheque method, with `first` answering before it. A
 * sheet renders outside the story, against the window's edge.
 */
function sheetParameters(
  first: HttpHandler[] = [],
  types = paymentMethodTypes,
  methods = [storeCreditMethod],
) {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: {
      handlers: {
        ...base.msw.handlers,
        payments: [...first, ...paymentMethodRequests(methods, types)],
      },
    },
  }
}

/** A store with the test gateway and a cheque method installed, for the edit sheet. */
const editParameters = (first: HttpHandler[] = []) =>
  sheetParameters(first, installedPaymentMethodTypes, paymentMethods)

// Opened from the payment methods page (DA-SET-12) and, with a provider
// chosen, from a provider card on the integrations page (DA-SET-10).
const meta = {
  title: 'Admin dashboard/Payment methods/Payment method sheets',
  component: CreatePaymentMethodSheet,
  tags: ['CMP-DA-G-12'],
  args: { open: true, onOpenChange: nothing },
  decorators: [withStore],
  parameters: sheetParameters(),
} satisfies Meta<typeof CreatePaymentMethodSheet>

export default meta
type Story = StoryObj<typeof meta>

// Waits for the list to close, which hands focus back to the field, so a later
// click does not race it.
const chooseProvider = async (name: string) => {
  await userEvent.click(await screen.findByRole('combobox', { name: 'Provider' }))
  await userEvent.click(await screen.findByRole('option', { name }))
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
}

export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Add payment method' })
  },
}

// The provider list still loading names nothing yet.
export const ProvidersLoading: Story = {
  name: 'Providers loading',
  parameters: sheetParameters(readHeld('payment_methods/types')),
}

// Spree's test gateway, with its two settings.
export const AddTestGateway: Story = {
  name: 'Add the test gateway',
  play: async () => {
    await chooseProvider('Bogus')
    await screen.findByText('Provider configuration')
  },
}

// Saving with no provider: the form marks the provider without asking the server.
export const ProviderRequired: Story = {
  name: 'Provider required',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Create payment method' }))
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Provider' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    )
  },
}

// The name the provider filled in, cleared: the form refuses before sending.
export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await chooseProvider('Check')
    await userEvent.clear(screen.getByLabelText('Name'))
    await userEvent.click(screen.getByRole('button', { name: 'Create payment method' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}

// A name another of the store's methods holds, refused by the server in its words.
export const NameTaken: Story = {
  name: 'Name taken',
  parameters: sheetParameters(takenNameRefused('payment_methods')),
  play: async () => {
    await chooseProvider('Check')
    const field = screen.getByLabelText('Name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Store Credit')
    await userEvent.click(screen.getByRole('button', { name: 'Create payment method' }))
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Creating: Story = {
  parameters: sheetParameters(writeHeld('payment_methods')),
  play: async () => {
    await chooseProvider('Check')
    await userEvent.click(screen.getByRole('button', { name: 'Create payment method' }))
    await screen.findByRole('button', { name: 'Creating…' })
  },
}

// From the integrations page's test gateway card: the provider is decided.
export const FromIntegrations: Story = {
  name: 'From the integrations page',
  args: { initialType: bogusType },
  play: async () => {
    await screen.findByText('Provider: Bogus')
  },
}

/**
 * Stripe's card as its gem would offer it, from a provider list written for
 * this story, with the link to its setup guide. The browser-test server does
 * not load the gem.
 */
export const StripeFromSource: Story = {
  name: 'Stripe, from its source',
  args: { initialType: stripeTypeFromSource },
  parameters: sheetParameters([], [...paymentMethodTypes, stripeTypeFromSource]),
  play: async () => {
    await screen.findByText('Provider: Stripe')
  },
}

type EditStory = StoryObj<Meta<typeof EditPaymentMethodSheet>>

const editArgs = (id: string) => ({ id, open: true, onOpenChange: nothing })

// The test gateway as saved: its secret setting kept on the server, shown masked.
export const Edit: EditStory = {
  render: (args) => <EditPaymentMethodSheet {...args} />,
  args: editArgs(testGateway.id),
  parameters: editParameters(),
  play: async () => {
    await screen.findByDisplayValue(testGateway.name)
  },
}

export const EditLoading: EditStory = {
  name: 'Edit, loading',
  render: (args) => <EditPaymentMethodSheet {...args} />,
  args: editArgs(testGateway.id),
  parameters: editParameters(readHeld('payment_methods/:id')),
}

// Switched off, admin only and captured by hand.
export const EditInactive: EditStory = {
  name: 'Edit, inactive',
  render: (args) => <EditPaymentMethodSheet {...args} />,
  args: editArgs(chequeMethod.id),
  parameters: editParameters(),
  play: async () => {
    await screen.findByDisplayValue(chequeMethod.name)
  },
}

// A rename to another method's name, refused by the server in its words.
export const EditRefused: EditStory = {
  name: 'Edit refused',
  render: (args) => <EditPaymentMethodSheet {...args} />,
  args: editArgs(chequeMethod.id),
  parameters: editParameters(takenNameRefused('payment_methods/:id', 'patch')),
  play: async () => {
    const field = await screen.findByLabelText('Name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Store Credit')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Saving: EditStory = {
  render: (args) => <EditPaymentMethodSheet {...args} />,
  args: editArgs(chequeMethod.id),
  parameters: editParameters(writeHeld('payment_methods/:id', 'patch')),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Description'), ' Allow ten days abroad.')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
