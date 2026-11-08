import {
  type PostSaleSelection,
  QuantityPicker,
  ReasonField,
} from '@spree/dashboard-ui/spree/post-sale-fields'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { returnReasons } from '../../../fixtures/admin/settings'

const units = [
  { id: 'fi_3Sh5Mg', label: 'Clay mug', quantity: 2 },
  { id: 'fi_3Sh5Ap', label: 'Linen apron — Color: Olive, Size: M', quantity: 1 },
]
const reasons = returnReasons
  .filter((reason) => reason.active)
  .map((reason) => ({ id: reason.id, name: reason.name }))

/**
 * The two fields every after-sale record starts from: how many of each unit
 * it covers, and why, from the merchant's own list of reasons.
 */
function PostSaleFields({
  selection: initial = {},
  reasonList = reasons,
  reason = '',
  emptyOptionLabel,
}: {
  selection?: PostSaleSelection
  reasonList?: { id: string; name: string }[]
  reason?: string
  emptyOptionLabel?: string
}) {
  const [selection, setSelection] = useState(initial)
  const [reasonId, setReasonId] = useState(reason)
  return (
    <div className="flex flex-col gap-4">
      <QuantityPicker units={units} selection={selection} onChange={setSelection} />
      <ReasonField
        id="return"
        reasons={reasonList}
        value={reasonId}
        onChange={setReasonId}
        emptyOptionLabel={emptyOptionLabel}
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Post-sale fields',
  component: PostSaleFields,
  tags: ['CMP-DUI-C-34'],
  parameters: { liquorify: { column: 'inSheet' } },
} satisfies Meta<typeof PostSaleFields>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Chosen: Story = {
  args: { selection: { fi_3Sh5Mg: 1 }, reason: returnReasons[0].id },
}

export const ReasonsOpen: Story = {
  name: 'Reasons open',
  parameters: { liquorify: { column: 'inSheet', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Reason' }))
    await screen.findByRole('option', { name: 'No longer needed/wanted' })
  },
}

// Where the reason is the point, "none" can be said.
export const NoReasonChoice: Story = {
  name: 'With a "no reason" choice',
  args: { emptyOptionLabel: 'No reason given' },
}

// No reasons kept yet: the field steps aside rather than block the record.
export const NoReasons: Story = {
  name: 'No reasons kept',
  args: { reasonList: [] },
}

export const NoReasonsWithChoice: Story = {
  name: 'No reasons kept, with a "no reason" choice',
  args: { reasonList: [], emptyOptionLabel: 'No reason given' },
}
