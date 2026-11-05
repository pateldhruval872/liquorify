import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { ReasonField } from '../../../../../dashboard/src/components/spree/reason-field'
import { storeParameters, withStore } from '../../../decorators/store'
import { cancellationReasons, returnReasons } from '../../../fixtures/admin/settings'
import { reasonRequests } from '../../../mocks/handlers/admin/settings'

/**
 * The reason picker every record that says why something happened shares: an
 * order's cancellation, and a return's, exchange's or claim's reason. Only the
 * store's active reasons are offered. With no "none" choice it hides itself
 * when the store has curated none.
 */
function Field({
  kind,
  label,
  emptyOptionLabel,
}: {
  kind: 'order-cancellation-reasons' | 'return-reasons'
  label?: string
  emptyOptionLabel?: string
}) {
  const [value, setValue] = useState('')
  return (
    <div className="w-80">
      <ReasonField
        kind={kind}
        value={value}
        onChange={setValue}
        label={label}
        emptyOptionLabel={emptyOptionLabel}
      />
      {/* Marks where the field would be when it hides itself. */}
      <p className="text-muted-foreground text-xs">End of form</p>
    </div>
  )
}

const base = storeParameters()
const parameters = (
  cancellation = cancellationReasons,
  returns = returnReasons,
  viewport = false,
) => ({
  liquorify: { ...base.liquorify, ...(viewport && { capture: 'viewport' }) },
  msw: {
    handlers: {
      ...base.msw.handlers,
      reasons: [
        ...reasonRequests('order-cancellation-reasons', cancellation),
        ...reasonRequests('return-reasons', returns),
      ],
    },
  },
})

const meta = {
  title: 'Admin dashboard/Orders/Reason field',
  component: Field,
  tags: ['CMP-DA-G-24'],
  args: {
    kind: 'order-cancellation-reasons',
    label: 'Reason',
    emptyOptionLabel: 'No reason given',
  },
  decorators: [withStore],
  parameters: parameters(),
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const WithNoneChoice: Story = {
  name: 'With a "none" choice',
  play: async () => {
    await screen.findByText('No reason given')
  },
}

export const Open: Story = {
  parameters: parameters(undefined, undefined, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Reason' }))
    await screen.findByRole('option', { name: 'Payment declined' })
  },
}

// A return's reason, with no "none" choice: the placeholder asks for one.
export const ReturnReason: Story = {
  name: 'Return reason',
  args: { kind: 'return-reasons', label: undefined, emptyOptionLabel: undefined },
  play: async () => {
    await screen.findByRole('combobox')
  },
}

// No reasons curated and no "none" choice: the field is left out.
export const Hidden: Story = {
  name: 'Hidden with no reasons',
  args: { kind: 'return-reasons', label: undefined, emptyOptionLabel: undefined },
  parameters: parameters(cancellationReasons, []),
  play: async () => {
    await screen.findByText('End of form')
  },
}
