import {
  type CancelOrderFields,
  OrderCancelDialog,
} from '@spree/dashboard-ui/spree/order-cancel-dialog'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@spree/dashboard-ui/ui/select'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { fn, screen } from 'storybook/test'

const reasons = [
  { value: '', label: 'No reason given' },
  { value: 'ocr_1Pl3Ok5I', label: 'Customer changed their mind' },
  { value: 'ocr_2Uj4Yh6T', label: 'Payment declined' },
]

/**
 * The cancellation form both panels share, given its form and its reason
 * picker by the caller: the admin dashboard offers a refund, and the seller
 * panel, whose endpoint takes none, does not.
 */
function CancelDialog({
  showRefund,
  showNotify,
  pending,
  withReason,
  refusal,
  values,
}: {
  showRefund?: boolean
  showNotify?: boolean
  pending?: boolean
  withReason?: boolean
  refusal?: string
  values?: Partial<CancelOrderFields>
}) {
  const form = useForm<CancelOrderFields>({
    defaultValues: {
      cancel_reason_id: '',
      cancel_note: '',
      refund_payments: false,
      notify_customer: false,
      ...values,
    },
  })
  useEffect(() => {
    if (refusal) form.setError('root', { message: refusal })
  }, [form, refusal])
  return (
    <OrderCancelDialog
      form={form}
      showRefund={showRefund}
      showNotify={showNotify}
      pending={pending}
      reasonField={
        withReason ? (
          <Field>
            <FieldLabel htmlFor="cancel-reason">Reason</FieldLabel>
            <Select items={reasons} value={form.watch('cancel_reason_id')}>
              <SelectTrigger id="cancel-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : undefined
      }
      onSubmit={fn()}
      onClose={fn()}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Order cancel dialog',
  component: CancelDialog,
  tags: ['CMP-DUI-C-32'],
  args: { withReason: true },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof CancelDialog>

export default meta
type Story = StoryObj<typeof meta>

// As the seller panel asks: no refund, and the customer may be emailed.
export const Default: Story = {
  play: async () => {
    await screen.findByRole('checkbox', { name: 'Email the customer' })
  },
}

export const WithRefund: Story = {
  name: 'With refund',
  args: { showRefund: true },
}

export const Filled: Story = {
  args: {
    showRefund: true,
    values: {
      cancel_reason_id: 'ocr_1Pl3Ok5I',
      cancel_note: 'The customer asked us to stop it before it shipped.',
      refund_payments: true,
      notify_customer: true,
    },
  },
}

export const WithoutReasonOrEmail: Story = {
  name: 'Without reason or email',
  args: { withReason: false, showNotify: false },
}

export const Refused: Story = {
  args: { showRefund: true, refusal: 'Order cannot be canceled once it has shipped' },
  play: async () => {
    await screen.findByRole('alert')
  },
}

export const Pending: Story = {
  args: { showRefund: true, pending: true },
}
