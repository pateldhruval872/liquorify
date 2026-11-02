import { BulkDialog } from '@spree/dashboard-ui/spree/bulk-dialog'
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
import { fn, screen, userEvent } from 'storybook/test'

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

/**
 * The products list's "Set status…" bulk action (DA-PRD-01), as the list
 * builds it: one field, applied to every chosen product. The other bulk
 * actions' dialogs use the same frame with their own pickers.
 */
function SetStatus({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  const [status, setStatus] = useState('active')
  return (
    <BulkDialog
      title="Set product status"
      description="Pick the status to apply to the selected products."
      submitLabel="Apply"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select items={statuses} value={status} onValueChange={(next) => setStatus(next as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </BulkDialog>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Bulk dialog',
  component: SetStatus,
  tags: ['CMP-DUI-C-04'],
  args: { onCancel: fn(), onSubmit: fn() },
  // The dialog renders outside the story's root, against the window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof SetStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async () => {
    await screen.findByRole('dialog', { name: 'Set product status' })
  },
}

export const Choosing: Story = {
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Archived' })
  },
}
