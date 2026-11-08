import {
  LabelUploadDialog,
  type LabelUploadFields,
} from '@spree/dashboard-ui/spree/label-upload-dialog'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { fn, screen } from 'storybook/test'
import { trackingCarriers } from '../../../fixtures/admin/after-sale'

const carrierKeys = trackingCarriers.map((carrier) => carrier.id)
const carrierLabel = (key: string) =>
  trackingCarriers.find((carrier) => carrier.id === key)?.name ?? key

/** Stands in for the panel's own upload field, which needs an API client. */
const fileField = (
  <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
    <Button type="button" size="sm" variant="outline">
      Choose file
    </Button>
    label-1Z4E7W8A0312845560.pdf
  </div>
)

/**
 * Records a label bought elsewhere, such as postage from the carrier's own
 * site: its file, its tracking number, the carrier and what it cost. The file
 * field comes from the caller, which owns the upload.
 */
function UploadDialog({
  values,
  currency = 'USD',
  pending,
  refusal,
  costError,
}: {
  values?: Partial<LabelUploadFields>
  currency?: string
  pending?: boolean
  refusal?: string
  costError?: string
}) {
  const form = useForm<LabelUploadFields>({
    defaultValues: { tracking_number: '', carrier: '', cost: '', ...values },
  })
  useEffect(() => {
    if (refusal) form.setError('root', { message: refusal })
    if (costError) form.setError('cost', { message: costError })
  }, [form, refusal, costError])
  return (
    <LabelUploadDialog
      form={form}
      open
      onOpenChange={fn()}
      fileField={fileField}
      carrierKeys={carrierKeys}
      carrierLabel={carrierLabel}
      currency={currency || undefined}
      onSubmit={fn()}
      pending={pending}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Label upload dialog',
  component: UploadDialog,
  tags: ['CMP-DUI-C-29'],
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof UploadDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Upload label' })
  },
}

export const Filled: Story = {
  args: { values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups', cost: '9.40' } },
}

// The seller panel has no currency of its own to show beside the cost.
export const WithoutCurrency: Story = {
  name: 'Without currency',
  args: { currency: '', values: { tracking_number: '1Z4E7W8A0312845560', cost: '9.40' } },
}

export const Refused: Story = {
  args: {
    values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups', cost: '9.40' },
    refusal: 'This parcel already has an active shipping label',
  },
  play: async () => {
    await screen.findByRole('alert')
  },
}

export const CostRefused: Story = {
  name: 'Cost refused',
  args: {
    values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups', cost: '-9.40' },
    costError: 'must be greater than or equal to 0',
  },
}

export const Saving: Story = {
  args: {
    pending: true,
    values: { tracking_number: '1Z4E7W8A0312845560', carrier: 'ups', cost: '9.40' },
  },
}
