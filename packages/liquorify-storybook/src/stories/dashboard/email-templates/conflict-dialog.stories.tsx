import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen } from 'storybook/test'
import { EmailTemplateConflictDialog } from '../../../../../dashboard/src/components/spree/email-templates/conflict-dialog'
import { staleDraftMessage } from '../../../fixtures/admin/email-templates'

/**
 * Asked when another editor saved the template's draft after this one opened
 * it (DA-SET-05): keep editing, reload theirs, or overwrite it. The message is
 * Spree's, naming who saved last.
 */
const meta = {
  title: 'Admin dashboard/Email templates/Conflict dialog',
  component: EmailTemplateConflictDialog,
  tags: ['CMP-DA-G-08'],
  args: { message: staleDraftMessage, onReload: fn(), onOverwrite: fn(), onClose: fn() },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof EmailTemplateConflictDialog>

export default meta
type Story = StoryObj<typeof meta>

export const SavedFirst: Story = {
  name: 'Another editor saved first',
  play: async () => {
    await screen.findByRole('dialog')
  },
}
