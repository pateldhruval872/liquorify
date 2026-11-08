import {
  type FulfillableRowData,
  FulfillItemsForm,
  type FulfillItemsValues,
} from '@spree/dashboard-ui/spree/fulfill-items-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { fn, screen, userEvent } from 'storybook/test'
import { trackingCarriers } from '../../../fixtures/admin/after-sale'

const rows: FulfillableRowData[] = [
  {
    key: 'li_2Mg6Kp8a',
    itemId: 'li_2Mg6Kp8a',
    name: 'Clay mug',
    thumbnailUrl: '/fixtures/product-clay.png',
    quantity: 2,
  },
  {
    key: 'li_5Ap3Ln7b',
    itemId: 'li_5Ap3Ln7b',
    name: 'Linen apron',
    optionsText: 'Color: Olive, Size: M',
    thumbnailUrl: '/fixtures/product-olive.png',
    quantity: 1,
  },
]

const carrierOptions = [
  { value: '', label: 'Detect automatically' },
  ...trackingCarriers.map((carrier) => ({ value: carrier.id, label: carrier.name })),
]

/**
 * Picks what ships out of one parcel, in place of its contents: every unit by
 * default, or some of them, which split into a new parcel that ships while
 * the rest stay. With a tracking number, a carrier and the shipment email.
 */
function FulfillForm({
  formRows = rows,
  values,
  canShipWholeParcel,
  pending,
  refusal,
}: {
  formRows?: FulfillableRowData[]
  values?: Partial<FulfillItemsValues>
  canShipWholeParcel?: boolean
  pending?: boolean
  refusal?: string
}) {
  const form = useForm<FulfillItemsValues>({
    defaultValues: {
      items: formRows.map((row) => ({
        item_id: row.itemId,
        selected: true,
        quantity: row.quantity,
      })),
      tracking: '',
      tracking_carrier: '',
      notify_customer: true,
      ...values,
    },
  })
  useEffect(() => {
    if (refusal) form.setError('root', { message: refusal })
  }, [form, refusal])
  return (
    <FulfillItemsForm
      form={form}
      rows={formRows}
      idPrefix="fulfill-ful_2Rd4Kp7a"
      carrierOptions={carrierOptions}
      onSubmit={fn()}
      onCancel={fn()}
      canShipWholeParcel={canShipWholeParcel}
      pending={pending}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Fulfill items form',
  component: FulfillForm,
  tags: ['CMP-DUI-C-23'],
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof FulfillForm>

export default meta
type Story = StoryObj<typeof meta>

export const AllUnits: Story = { name: 'All units' }

// One mug held back: it stays on this parcel, which remains open.
export const SomeUnits: Story = {
  name: 'Some units',
  play: async () => {
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity to ship of Clay mug' })
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '1')
    await screen.findByText(/move into a new fulfillment that ships now/)
  },
}

export const ItemUnticked: Story = {
  name: 'Item unticked',
  play: async () => {
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ship Linen apron' }))
    await screen.findByText(/move into a new fulfillment that ships now/)
  },
}

// Nothing picked, so there is nothing to ship.
export const NothingPicked: Story = {
  name: 'Nothing picked',
  play: async () => {
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ship Clay mug' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ship Linen apron' }))
    await screen.findByText('Units to ship: 0 / 3')
  },
}

export const WithTracking: Story = {
  name: 'With tracking',
  args: {
    values: { tracking: '1Z4E7W8A0312845560', tracking_carrier: 'ups', notify_customer: false },
  },
}

export const CarrierOpen: Story = {
  name: 'Carrier list open',
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await screen.findByRole('option', { name: 'Canada Post' })
  },
}

// Units no line item names still ship when the whole parcel goes.
export const UnaddressableParcel: Story = {
  name: 'Units no row can name',
  args: { formRows: [], canShipWholeParcel: true },
}

export const Empty: Story = {
  args: { formRows: [] },
}

export const Refused: Story = {
  args: { refusal: 'This fulfillment holds backordered units and cannot be handed over yet' },
}

export const Saving: Story = {
  args: { pending: true },
}
