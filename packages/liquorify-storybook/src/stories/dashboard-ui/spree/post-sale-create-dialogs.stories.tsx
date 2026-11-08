import {
  CreateClaimDialog,
  CreateReturnDialog,
} from '@spree/dashboard-ui/spree/post-sale-create-dialogs'
import { ReasonField } from '@spree/dashboard-ui/spree/post-sale-fields'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@spree/dashboard-ui/ui/select'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, screen, userEvent, within } from 'storybook/test'
import { claimReasons, returnReasons } from '../../../fixtures/admin/settings'

const units = [
  { id: 'fi_3Sh5Mg', label: 'Clay mug', quantity: 2 },
  { id: 'fi_3Sh5Ap', label: 'Linen apron — Color: Olive, Size: M', quantity: 1 },
]
const lines = [
  {
    id: 'li_2Mg6Kp8a',
    label: 'Clay mug',
    quantity: 2,
    paidFor: (quantity: number) => ['', '25.92', '51.84'][quantity] ?? '',
  },
  {
    id: 'li_5Ap3Ln7b',
    label: 'Linen apron — Color: Olive, Size: M',
    quantity: 1,
    paidFor: () => '41.04',
  },
]
const locations = [
  { value: 'sloc_4Rt6Yu8I', label: 'Shop location' },
  { value: 'sloc_2Wq5Er7T', label: 'East coast depot (does not accept returns)' },
]

function Reason({ kind }: { kind: 'return' | 'claim' }) {
  const [value, setValue] = useState('')
  const reasons = (kind === 'return' ? returnReasons : claimReasons)
    .filter((reason) => reason.active)
    .map((reason) => ({ id: reason.id, name: reason.name }))
  return <ReasonField id={kind} reasons={reasons} value={value} onChange={setValue} />
}

function Location() {
  const [value, setValue] = useState('')
  return (
    <Field>
      <FieldLabel htmlFor="return-location">Return to</FieldLabel>
      <Select items={locations} value={value} onValueChange={(next) => setValue(next as string)}>
        <SelectTrigger id="return-location">
          <SelectValue placeholder="Default returns location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/**
 * Opening a return, which names fulfilled units, or a claim, which names the
 * order's lines and what to give back for each. Both take a reason and a
 * note; the admin dashboard adds where a return goes back to.
 */
function CreateDialogs({
  kind = 'return',
  withReason = true,
  withLocation = true,
  pending,
}: {
  kind?: 'return' | 'claim'
  withReason?: boolean
  withLocation?: boolean
  pending?: boolean
}) {
  return kind === 'return' ? (
    <CreateReturnDialog
      units={units}
      reasonField={withReason ? <Reason kind="return" /> : undefined}
      extraFields={withLocation ? <Location /> : undefined}
      onClose={fn()}
      onSubmit={fn()}
      pending={pending}
    />
  ) : (
    <CreateClaimDialog
      lines={lines}
      currencySymbol="$"
      reasonField={withReason ? <Reason kind="claim" /> : undefined}
      onClose={fn()}
      onSubmit={fn()}
      pending={pending}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Post-sale create dialogs',
  component: CreateDialogs,
  tags: ['CMP-DUI-C-33'],
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof CreateDialogs>

export default meta
type Story = StoryObj<typeof meta>

const setQuantity = async (label: string, quantity: string) => {
  const dialog = await screen.findByRole('dialog')
  const field = within(dialog).getByRole('spinbutton', { name: label })
  await userEvent.clear(field)
  await userEvent.type(field, quantity)
  return dialog
}

export const Return: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'New return' })
  },
}

export const ReturnFilled: Story = {
  name: 'Return, filled in',
  play: async () => {
    const dialog = await setQuantity('Clay mug', '1')
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Note' }),
      'Chipped on the rim when it arrived.',
    )
  },
}

export const ReturnLocations: Story = {
  name: 'Return, locations open',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Return to' }))
    await screen.findByRole('option', { name: 'East coast depot (does not accept returns)' })
  },
}

// The seller panel offers no locations, and a store may keep no reasons.
export const ReturnBare: Story = {
  name: 'Return, units and note only',
  args: { withReason: false, withLocation: false },
}

export const ReturnSaving: Story = {
  name: 'Return, saving',
  args: { pending: true },
}

export const Claim: Story = {
  args: { kind: 'claim' },
  play: async () => {
    await screen.findByRole('heading', { name: 'New claim' })
  },
}

// The refund follows what the customer paid for the units chosen.
export const ClaimFilled: Story = {
  name: 'Claim, filled in',
  args: { kind: 'claim' },
  play: async () => {
    const dialog = await setQuantity('Clay mug', '1')
    await within(dialog).findByRole('spinbutton', { name: 'Refund amount' })
  },
}

export const ClaimTwoLines: Story = {
  name: 'Claim, two lines',
  args: { kind: 'claim' },
  play: async () => {
    await setQuantity('Clay mug', '2')
    await setQuantity('Linen apron — Color: Olive, Size: M', '1')
  },
}

export const ClaimSaving: Story = {
  name: 'Claim, saving',
  args: { kind: 'claim', pending: true },
}
