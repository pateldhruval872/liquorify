import {
  DeliveryFormDialog,
  type DeliveryFormFields,
} from '@spree/dashboard-ui/spree/delivery-form-dialog'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { fn, screen, userEvent } from 'storybook/test'
import { trackingCarriers } from '../../../fixtures/admin/after-sale'

const carrierKeys = trackingCarriers.map((carrier) => carrier.id)
const carrierLabel = (key: string) =>
  trackingCarriers.find((carrier) => carrier.id === key)?.name ?? key

/**
 * Records a tracked consignment on a parcel, or corrects one: the number, and
 * the carrier picked from Spree's list or typed as it is for a forwarder the
 * list does not know. The caller owns the form and its submit.
 */
function DeliveryDialog({
  editing = false,
  values,
  pending,
  refusal,
  fieldError,
}: {
  editing?: boolean
  values?: Partial<DeliveryFormFields>
  pending?: boolean
  refusal?: string
  fieldError?: string
}) {
  const form = useForm<DeliveryFormFields>({
    defaultValues: { tracking_number: '', carrier: '', ...values },
  })
  useEffect(() => {
    if (refusal) form.setError('root', { message: refusal })
    if (fieldError) form.setError('tracking_number', { message: fieldError })
  }, [form, refusal, fieldError])
  return (
    <DeliveryFormDialog
      form={form}
      open
      onOpenChange={fn()}
      editing={editing}
      carrierKeys={carrierKeys}
      carrierLabel={carrierLabel}
      onSubmit={fn()}
      pending={pending}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Delivery form dialog',
  component: DeliveryDialog,
  tags: ['CMP-DUI-C-16'],
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof DeliveryDialog>

export default meta
type Story = StoryObj<typeof meta>

// The carrier is left to be detected from the number.
export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Add tracking' })
  },
}

export const Edit: Story = {
  args: { editing: true, values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups' } },
  play: async () => {
    await screen.findByRole('heading', { name: 'Edit tracking' })
  },
}

// A forwarder Spree has no carrier for keeps the name as typed.
export const UnlistedCarrier: Story = {
  name: 'Unlisted carrier',
  args: {
    editing: true,
    values: { tracking_number: 'PRO-730418', carrier: 'Harbor Line Freight' },
  },
}

export const CarrierList: Story = {
  name: 'Carrier list open',
  args: { values: { tracking_number: '1Z4E7W8A0312845560' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await screen.findByRole('option', { name: 'Australia Post' })
  },
}

export const CarrierSearched: Story = {
  name: 'Carrier searched',
  args: { values: { tracking_number: '1Z4E7W8A0312845560' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await userEvent.type(await screen.findByPlaceholderText('Search carriers'), 'post')
    await screen.findByRole('option', { name: 'Deutsche Post' })
  },
}

// The parcel already carries this number.
export const TrackingNumberRefused: Story = {
  name: 'Tracking number refused',
  args: { values: { tracking_number: '1Z4E7W8A0312845560' }, fieldError: 'has already been taken' },
}

export const Saving: Story = {
  args: { pending: true, values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups' } },
}
