import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen } from 'storybook/test'
import { DefaultDiffDialog } from '../../../../../dashboard/src/components/spree/email-templates/default-diff-dialog'
import { passwordResetTemplate } from '../../../fixtures/admin/email-templates'

/**
 * Spree's default as the store's version started from it, beside the default
 * now (DA-SET-05), opened from the "Updated by Spree" notice so a merchant can
 * see what an upgrade changed before keeping theirs or starting over. Lines
 * removed are tinted on the left, added on the right, changed on both.
 */
const now = passwordResetTemplate.default_body
const before = now
  .replace(
    'We received a request to reset your password. Click the button below to choose a new password.',
    'Someone asked to reset your password. Use the button below to set a new one.',
  )
  .replace(/\s*<mj-text mj-class="note" padding="16px 0 0">[^\n]*\n/, '\n')

const meta = {
  title: 'Admin dashboard/Email templates/Default diff dialog',
  component: DefaultDiffDialog,
  tags: ['CMP-DA-G-08'],
  args: {
    open: true,
    onOpenChange: fn(),
    before,
    after: now,
    pending: false,
    onKeepMine: fn(),
    onStartOver: fn(),
  },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof DefaultDiffDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Changed: Story = {
  name: 'What Spree changed',
  play: async () => {
    await screen.findByRole('dialog')
  },
}

/**
 * Opened already saving, so the dialog focuses the first thing it can, its
 * close button, and keeps focus inside however it is cleared.
 */
export const Saving: Story = {
  name: 'Keeping the store’s version',
  args: { pending: true },
  play: async () => {
    await screen.findByRole('dialog')
  },
}
