import { EditableNoteCard, NoteHtml, NoteText } from '@spree/dashboard-ui/spree/editable-note-card'
import { Textarea } from '@spree/dashboard-ui/ui/textarea'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, screen, userEvent } from 'storybook/test'

/**
 * A note on a record, read as text and edited in place behind its pencil. The
 * order page shows two: the customer's special instructions, a plain note, and
 * the staff's internal note, a rich-text one. The editor comes from the caller.
 */
function NoteCard({
  title,
  note,
  html,
  startEditing = false,
  pending = false,
}: {
  title: string
  note?: string
  html?: string
  startEditing?: boolean
  pending?: boolean
}) {
  const [editing, setEditing] = useState(startEditing)
  const [draft, setDraft] = useState(note ?? '')
  return (
    <EditableNoteCard
      title={title}
      editing={editing}
      onEditingChange={setEditing}
      editor={
        <Textarea
          aria-label={title}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      }
      pending={pending}
      onSave={fn()}
    >
      {html ? <NoteHtml html={html} /> : note ? <NoteText value={note} /> : null}
    </EditableNoteCard>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Editable note card',
  component: NoteCard,
  tags: ['CMP-DUI-C-18'],
  args: { title: 'Special instructions' },
  parameters: { liquorify: { column: 'sidebar' } },
} satisfies Meta<typeof NoteCard>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithNote: Story = {
  name: 'With a note',
  args: { note: 'Please leave it with the neighbour at number 216.\nNo signature needed.' },
}

export const RichNote: Story = {
  name: 'Rich-text note',
  args: {
    title: 'Internal note',
    html: '<p>Repeat customer. Offer the <strong>loyalty code</strong> on the next order.</p><ul><li>Prefers email</li></ul>',
  },
}

export const Editing: Story = {
  args: { note: 'Please leave it with the neighbour at number 216.' },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    await screen.findByRole('button', { name: 'Save' })
  },
}

export const Saving: Story = {
  args: { note: 'Ring twice.', startEditing: true, pending: true },
  play: async () => {
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
