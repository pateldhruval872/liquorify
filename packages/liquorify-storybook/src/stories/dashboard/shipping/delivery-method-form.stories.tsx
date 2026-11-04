import type { DeliveryMethod, DeliveryProfile, DeliveryZone } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { DeliveryMethodFormCards } from '../../../../../dashboard/src/components/spree/shipping/delivery-method-form'
import {
  DELIVERY_METHOD_DEFAULTS,
  type DeliveryMethodFormValues,
} from '../../../../../dashboard/src/schemas/delivery-method'
import { withStore } from '../../../decorators/store'
import {
  carrierMethodFromSource,
  digitalMethod,
  digitalProfile,
  easyPostIntegrationType,
  easyPostRatesFromSource,
  easyPostRatesNotConnected,
  expressMethod,
  freeOverMethod,
  freightMethod,
  furnitureProfile,
  furnitureZones,
  generalProfile,
  generalZones,
  pickupMethod,
  rateProviders,
  standardMethod,
} from '../../../fixtures/admin/delivery'
import { profilePageRequests } from '../../../mocks/handlers/admin/delivery'
import { profileParameters, profileRoute } from './profile-page'

/** A saved method as the method sheet loads it into the form, rules left out. */
function valuesOf(method: DeliveryMethod): DeliveryMethodFormValues {
  const amount = (value: string | null) => (value && Number(value) !== 0 ? value : '')
  return {
    ...DELIVERY_METHOD_DEFAULTS,
    name: method.name,
    code: method.code ?? '',
    fulfillment_provider: method.fulfillment_provider ?? 'manual',
    rate_provider: method.rate_provider ?? '',
    storefront_visible: method.storefront_visible,
    tracking_url: method.tracking_url ?? '',
    estimated_transit_business_days_min:
      method.estimated_transit_business_days_min?.toString() ?? '',
    estimated_transit_business_days_max:
      method.estimated_transit_business_days_max?.toString() ?? '',
    tax_category_id: method.tax_category_id ?? '',
    calculator: {
      type: method.calculator?.type ?? '',
      preferences: method.calculator?.preferences ?? {},
    },
    delivery_zone_id: method.delivery_zone_id ?? '',
    stock_location_ids: method.stock_location_ids ?? [],
    markup_flat: amount(method.markup_flat),
    markup_percent: amount(method.markup_percent),
    services: (method.services ?? []).map((row) => ({
      id: row.id,
      carrier: row.carrier,
      service: row.service,
      label: row.label ?? '',
      markup_flat: amount(row.markup_flat),
      markup_percent: amount(row.markup_percent),
    })),
    rules: (method.rules ?? []).map((rule) => ({
      id: rule.id,
      type: rule.type,
      preferences: rule.preferences as Record<string, unknown>,
      product_ids: rule.product_ids,
      takes_products: false,
    })),
  }
}

interface FormProps {
  method?: DeliveryMethod
  profile?: DeliveryProfile
  zones?: DeliveryZone[]
  zonePreselected?: boolean
  provider?: 'pickup' | 'digital'
}

/**
 * The sections of the method sheet on a delivery profile's page (DA-SET-17),
 * at the sheet's width and in its smaller text.
 */
function MethodForm({
  method,
  profile = generalProfile,
  zones = generalZones,
  zonePreselected,
  provider,
}: FormProps) {
  const form = useForm<DeliveryMethodFormValues>({
    defaultValues: method
      ? valuesOf(method)
      : { ...DELIVERY_METHOD_DEFAULTS, fulfillment_provider: provider ?? 'manual' },
  })
  return (
    <div className="flex w-[566px] flex-col gap-4 text-sm">
      <DeliveryMethodFormCards
        form={form}
        profile={profile}
        zones={zones}
        zonePreselected={zonePreselected}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Shipping/Delivery method form',
  component: MethodForm,
  tags: ['CMP-DA-G-20'],
  decorators: [withStore],
  parameters: profileParameters(),
} satisfies Meta<typeof MethodForm>

export default meta
type Story = StoryObj<typeof meta>

// A new method shipped by hand and priced by Spree, with no calculator yet.
export const NewMethod: Story = { name: 'New method' }

// Added from inside a zone: the zone is decided, so its section is left out.
export const FromAZone: Story = { name: 'From a zone', args: { zonePreselected: true } }

// A flat rate in the store's currency, with a delivery estimate and tracking link.
export const FlatRate: Story = {
  name: 'Flat rate',
  args: { method: standardMethod },
  play: async () => {
    await screen.findByDisplayValue('5.00')
  },
}

// A flat rate set for each of the store's currencies.
export const AmountsPerCurrency: Story = {
  name: 'Amounts per currency',
  args: { method: expressMethod },
  play: async () => {
    await screen.findByDisplayValue('14.00')
  },
}

// Offered only above an item total and under a weight.
export const Conditions: Story = {
  args: { method: freeOverMethod },
  play: async () => {
    await screen.findByDisplayValue('75.00')
  },
}

// Another calculator: its own settings replace the old one's values.
export const CalculatorChanged: Story = {
  name: 'Calculator changed',
  args: { method: standardMethod },
  parameters: profileParameters({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Rate calculator' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Flexi Rate' }))
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  },
}

// Priced through the freight rate provider, with a markup on its quote.
export const Freight: Story = {
  args: { method: freightMethod, profile: furnitureProfile, zones: furnitureZones },
  parameters: profileParameters({ route: profileRoute(furnitureProfile) }),
  play: async () => {
    await screen.findByDisplayValue('10.00')
  },
}

export const RateProviders: Story = {
  name: 'Rate providers',
  parameters: profileParameters({ viewport: true }),
  play: async () => {
    // The provider fields carry no label element of their own, so the select is found by its field.
    const field = (await screen.findByText('Rate provider')).closest('[data-slot="field"]')
    await userEvent.click(within(field as HTMLElement).getByRole('combobox'))
    await screen.findByRole('option', { name: 'Freight' })
  },
}

// Collected at a counter: no zone or carrier services, and the counters to collect from.
export const Pickup: Story = {
  args: { method: pickupMethod },
  play: async () => {
    await screen.findByText('Collection locations')
  },
}

// Delivered digitally, on a digital profile.
export const Digital: Story = {
  args: { method: digitalMethod, profile: digitalProfile, zones: [] },
  parameters: profileParameters({ route: profileRoute(digitalProfile) }),
}

/**
 * EasyPost as its gem would offer it, from provider lists written for this
 * story: not connected yet, so the form offers to connect it. The
 * browser-test server does not load the gem.
 */
export const EasyPostNotConnected: Story = {
  name: 'EasyPost, not connected, from its source',
  parameters: profileParameters({
    requests: profilePageRequests({
      rates: [...rateProviders, easyPostRatesNotConnected],
      integrationTypes: [easyPostIntegrationType],
    }),
  }),
  play: async () => {
    await screen.findByText(/EasyPost can quote live carrier rates/)
  },
}

// Connected, quoting live and offering one chosen service with a markup.
export const EasyPostServices: Story = {
  name: 'EasyPost services, from its source',
  args: { method: carrierMethodFromSource },
  parameters: profileParameters({
    requests: profilePageRequests({ rates: [...rateProviders, easyPostRatesFromSource] }),
  }),
  play: async () => {
    await screen.findByText('Carrier services')
  },
}
