import type { Order } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  InternalNoteCard,
  SpecialInstructionsCard,
  TagsCard,
} from '../../../../../dashboard/src/components/spree/orders/order-notes-cards'
import { withStore } from '../../../decorators/store'
import { annotatedOrder, paidOrder } from '../../../fixtures/admin/orders'
import { orderWriteHeld } from '../../../mocks/handlers/admin/orders'
import { orderParameters } from './order-page'

const cards = {
  tags: TagsCard,
  instructions: SpecialInstructionsCard,
  internal: InternalNoteCard,
}

/**
 * The order page's three note cards in its sidebar (DA-ORD-04): the order's
 * tags, the customer's special instructions and the staff's internal note.
 * Each is edited in place and saved on its own.
 */
function NotesCard({ card, order }: { card: keyof typeof cards; order: Order }) {
  const Card = cards[card]
  return <Card order={order} />
}

const meta = {
  title: 'Admin dashboard/Orders/Order notes cards',
  component: NotesCard,
  tags: ['CMP-DA-G-11'],
  args: { card: 'tags', order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'sidebar' }),
} satisfies Meta<typeof NotesCard>

export default meta
type Story = StoryObj<typeof meta>

const edit = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
}

export const NoTags: Story = { name: 'Tags, none' }

export const Tags: Story = {
  args: { order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
}

export const EditingTags: Story = {
  name: 'Tags, editing',
  args: { order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
  play: async () => {
    await edit()
    await screen.findByRole('button', { name: 'Save' })
  },
}

// The store's tags are offered as they are typed.
export const TagSuggestions: Story = {
  name: 'Tags, suggestions',
  parameters: orderParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await edit()
    await userEvent.type(await screen.findByRole('combobox'), 'Fr')
    await screen.findByRole('option', { name: 'Fragile' })
  },
}

export const SavingTags: Story = {
  name: 'Tags, saving',
  args: { order: annotatedOrder },
  parameters: orderParameters({
    order: annotatedOrder,
    column: 'sidebar',
    first: orderWriteHeld('patch', 'orders/:id'),
  }),
  play: async () => {
    await edit()
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

export const NoInstructions: Story = {
  name: 'Special instructions, none',
  args: { card: 'instructions' },
}

export const Instructions: Story = {
  name: 'Special instructions',
  args: { card: 'instructions', order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
}

export const EditingInstructions: Story = {
  name: 'Special instructions, editing',
  args: { card: 'instructions', order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
  play: async () => {
    await edit()
    await screen.findByRole('textbox')
  },
}

export const NoInternalNote: Story = {
  name: 'Internal note, none',
  args: { card: 'internal' },
}

export const InternalNote: Story = {
  name: 'Internal note',
  args: { card: 'internal', order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
}

export const EditingInternalNote: Story = {
  name: 'Internal note, editing',
  args: { card: 'internal', order: annotatedOrder },
  parameters: orderParameters({ order: annotatedOrder, column: 'sidebar' }),
  play: async () => {
    await edit()
    await screen.findByRole('textbox', { name: 'Internal Note' })
  },
}
