import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { CustomerInternalNoteCard } from '../../../../../dashboard/src/components/spree/customers/customer-internal-note-card'
import { withStore } from '../../../decorators/store'
import { newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { customerWriteHeld } from '../../../mocks/handlers/admin/customers'
import { customerParameters } from './customer-page'

/**
 * Staff's own note on a customer (DA-CUS-02's sidebar), which the customer
 * never sees, written in the rich text editor.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer internal note card',
  component: CustomerInternalNoteCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerInternalNoteCard>

export default meta
type Story = StoryObj<typeof meta>

async function edit() {
  await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  return screen.findByRole('textbox', { name: 'Internal note' })
}

export const Note: Story = {}

export const NoNote: Story = {
  name: 'No note',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
}

export const Editing: Story = {
  play: async () => {
    const editor = await edit()
    await within(editor).findByText('glaze samples')
  },
}

export const EditingEmpty: Story = {
  name: 'Editing, empty',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
  play: async () => {
    await edit()
  },
}

export const Saving: Story = {
  parameters: customerParameters({ column: 'sidebar', first: customerWriteHeld }),
  play: async () => {
    const editor = await edit()
    await userEvent.type(editor, ' Call first.')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
