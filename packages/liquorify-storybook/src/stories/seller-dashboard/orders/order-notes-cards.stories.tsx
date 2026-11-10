import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  InternalNoteCard,
  SpecialInstructionsCard,
} from '../../../../../seller-dashboard/src/components/orders/order-notes-cards'
import { newOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

const notes = panelParameters({
  page: 'orders/$orderId',
  path: `orders/${newOrder.id}`,
  column: 'sidebar',
})
const noted = {
  ...newOrder,
  customer_note: 'Please leave with the concierge if nobody answers.',
  internal_note_html: '<p>Gift wrap requested by phone. <strong>Use the green ribbon.</strong></p>',
}

/** What the buyer asked for, and the seller's own working note (SP-ORD-02's sidebar). */
const meta = {
  title: 'Seller panel/Orders/Order notes cards',
  component: SpecialInstructionsCard,
  tags: ['CMP-SP-G-02'],
  args: { order: newOrder },
  parameters: notes,
} satisfies Meta<typeof SpecialInstructionsCard>

export default meta
type Story = StoryObj<typeof meta>

export const NoInstructions: Story = { name: 'Special instructions, none' }

export const Instructions: Story = { name: 'Special instructions', args: { order: noted } }

export const EditingInstructions: Story = {
  name: 'Special instructions, editing',
  args: { order: noted },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /edit/i }))
    await screen.findByRole('textbox')
  },
}

export const NoInternalNote: Story = {
  name: 'Internal note, none',
  render: (args) => <InternalNoteCard {...args} />,
}

export const InternalNote: Story = {
  name: 'Internal note',
  args: { order: noted },
  render: (args) => <InternalNoteCard {...args} />,
}

export const EditingInternalNote: Story = {
  name: 'Internal note, editing',
  args: { order: noted },
  render: (args) => <InternalNoteCard {...args} />,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /edit/i }))
    await screen.findByRole('textbox', { name: 'Internal Note' })
  },
}
