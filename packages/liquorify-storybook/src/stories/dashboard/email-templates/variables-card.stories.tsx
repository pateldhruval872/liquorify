import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { EmailTemplateVariablesCard } from '../../../../../dashboard/src/components/spree/email-templates/variables-card'

/**
 * The data a template can show, with the fields worth pointing out
 * (DA-SET-05). For a role that may edit, each field inserts itself into the
 * template; for one that may only read, the fields are plain text. The width
 * is the template page's at 1280 pixels.
 */
function Card(props: ComponentProps<typeof EmailTemplateVariablesCard>) {
  return (
    <div style={{ width: 889 }}>
      <EmailTemplateVariablesCard {...props} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Email templates/Variables card',
  component: Card,
  tags: ['CMP-DA-G-08'],
  args: { templateId: 'spree.customer_mailer.password_reset_email', onInsert: fn() },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const PasswordReset: Story = { name: 'The password reset email' }

export const OrderConfirmation: Story = {
  name: 'An order email',
  args: { templateId: 'spree.order_mailer.confirm_email' },
}

export const Layout: Story = {
  name: 'The layout',
  args: { templateId: 'layouts.spree.base_mailer' },
}

export const ReadOnly: Story = {
  name: 'For a role that may only read',
  args: { onInsert: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0)
  },
}

/** A field inserts its Liquid, with `money` for an amount. */
export const Inserting: Story = {
  name: 'Inserting a field',
  args: { templateId: 'spree.order_mailer.confirm_email' },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /order\.total/ }))
    await expect(args.onInsert).toHaveBeenCalledWith(expect.stringContaining('order.total'))
    // On the page the field goes into the editor, which takes focus; here
    // nothing does, and a mouse click leaves no ring on the field.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
