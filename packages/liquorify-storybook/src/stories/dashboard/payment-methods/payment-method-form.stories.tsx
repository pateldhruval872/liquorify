import type { PaymentMethod, PaymentMethodType } from '@spree/admin-sdk'
import { defaultPreferences } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'
import { PaymentMethodForm } from '../../../../../dashboard/src/components/spree/payment-method-editors/payment-method-form'
import type { PaymentMethodFormValues } from '../../../../../dashboard/src/components/spree/payment-method-editors/types'
import {
  filterPaymentMethodProviderTypes,
  PAYMENT_METHOD_CREATE_DEFAULTS,
} from '../../../../../dashboard/src/schemas/payment-method'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  bogusType,
  chequeMethod,
  paymentMethodTypes,
  stripeTypeFromSource,
  testGateway,
} from '../../../fixtures/admin/payments'

interface FieldsProps {
  /** The record being edited; absent while adding one. */
  method?: PaymentMethod
  /** The provider already chosen, as the integrations gallery opens the sheet. */
  lockedType?: PaymentMethodType
  types?: PaymentMethodType[]
  /** An error the server returned for a field, shown as the sheet shows it. */
  refusal?: { field: 'name' | 'type'; message: string }
}

/**
 * The fields of the add and edit sheets of the payment methods page
 * (DA-SET-12), at the sheet's width and in its smaller text. The sheet seeds
 * the form the same way: a new method starts empty or with the chosen
 * provider's defaults, an edited one from its record.
 */
function PaymentMethodFields({
  method,
  lockedType,
  types = paymentMethodTypes,
  refusal,
}: FieldsProps) {
  const providerTypes = filterPaymentMethodProviderTypes(types)
  const form = useForm<PaymentMethodFormValues>({
    defaultValues: method
      ? {
          name: method.name,
          description: method.description ?? '',
          storefront_visible: method.storefront_visible ?? true,
          active: method.active,
          capture_method: (method.capture_method ??
            '') as PaymentMethodFormValues['capture_method'],
        }
      : {
          ...PAYMENT_METHOD_CREATE_DEFAULTS,
          type: lockedType?.type ?? '',
          name: lockedType?.label ?? '',
        },
  })
  const [preferences, setPreferences] = useState<Record<string, unknown>>(
    () =>
      (method?.preferences as Record<string, unknown> | undefined) ??
      defaultPreferences(lockedType?.schema, { currency: 'USD' }),
  )
  const providerType = method?.type ?? form.watch('type') ?? ''
  const schema = [...types, stripeTypeFromSource].find(
    (entry) => entry.type === providerType,
  )?.schema

  useEffect(() => {
    if (refusal) form.setError(refusal.field, { message: refusal.message })
  }, [refusal, form])

  return (
    <div className="w-[566px] text-sm">
      <PaymentMethodForm
        mode={method ? 'edit' : 'create'}
        form={form}
        providerTypes={providerTypes}
        preferenceSchema={schema}
        providerType={providerType}
        paymentMethod={method ?? null}
        preferences={preferences}
        onPreferencesChange={setPreferences}
        onProviderTypeChange={(next) =>
          setPreferences(defaultPreferences(types.find((entry) => entry.type === next)?.schema))
        }
        providerLocked={!!lockedType}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Payment methods/Payment method form',
  component: PaymentMethodFields,
  tags: ['CMP-DA-G-12'],
  decorators: [withStore],
  parameters: storeParameters(),
} satisfies Meta<typeof PaymentMethodFields>

export default meta
type Story = StoryObj<typeof meta>

// Nothing chosen yet: the provider list comes first, and no settings show.
export const NewMethod: Story = { name: 'New method' }

// The providers the browser-test server registers, less the one the picker
// hides and the one the store has already.
export const ProviderList: Story = {
  name: 'Provider list',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Provider' }))
    await screen.findByRole('option', { name: 'Check' })
  },
}

// Choosing Spree's test gateway names the method after it and shows its two
// settings, the secret one empty and typed in the clear.
export const TestGatewayChosen: Story = {
  name: 'Test gateway chosen',
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Provider' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Bogus' }))
    await screen.findByText('Provider configuration')
  },
}

// A provider with no settings of its own shows no settings block.
export const ChequeChosen: Story = {
  name: 'Cheque chosen',
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Provider' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Check' }))
    await screen.findByDisplayValue('Check')
  },
}

// The provider swapped after another was chosen: the settings follow it.
export const ProviderChanged: Story = {
  name: 'Provider changed',
  play: async () => {
    const provider = screen.getByRole('combobox', { name: 'Provider' })
    await userEvent.click(provider)
    await userEvent.click(await screen.findByRole('option', { name: 'Bogus' }))
    await screen.findByText('Provider configuration')
    await userEvent.click(provider)
    await userEvent.click(await screen.findByRole('option', { name: 'Check' }))
    await screen.findByDisplayValue('Check')
  },
}

// Opened from a provider card on the integrations page (DA-SET-10): the
// provider is decided, so no list shows.
export const ProviderChosenElsewhere: Story = {
  name: 'Provider chosen elsewhere',
  args: { lockedType: bogusType },
}

/**
 * Stripe's settings as its gem declares them, from a provider list written
 * for this story. The browser-test server does not load the gem, so no
 * running screen shows this.
 */
export const StripeFromSource: Story = {
  name: 'Stripe, from its source',
  args: { lockedType: stripeTypeFromSource, types: [...paymentMethodTypes, stripeTypeFromSource] },
}

// Editing keeps a stored secret on the server and shows only its mask.
export const EditTestGateway: Story = {
  name: 'Edit, secret kept',
  args: { method: testGateway },
  play: async () => {
    await screen.findByDisplayValue(testGateway.name)
  },
}

// Switched off, hidden from the storefront, and capturing by hand.
export const EditInactive: Story = {
  name: 'Edit, inactive and admin only',
  args: { method: chequeMethod },
}

// The refusal Spree returns for a blank name, on the field.
export const NameRefused: Story = {
  name: 'Name refused',
  args: { method: testGateway, refusal: { field: 'name', message: "can't be blank" } },
}
