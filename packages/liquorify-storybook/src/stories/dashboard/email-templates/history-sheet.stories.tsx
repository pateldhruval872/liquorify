import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen } from 'storybook/test'
import { EmailTemplateHistorySheet } from '../../../../../dashboard/src/components/spree/email-templates/history-sheet'
import { revisions } from '../../../fixtures/admin/email-templates'

/**
 * A template's published versions, newest first (DA-SET-05), each one
 * restorable into the draft by a role that may edit templates. Opened from
 * the page's menu.
 */
const meta = {
  title: 'Admin dashboard/Email templates/History sheet',
  component: EmailTemplateHistorySheet,
  tags: ['CMP-DA-G-08'],
  args: {
    open: true,
    onOpenChange: fn(),
    revisions,
    isLoading: false,
    canRestore: true,
    restoring: false,
    onRestore: fn(),
  },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof EmailTemplateHistorySheet>

export default meta
type Story = StoryObj<typeof meta>

const opened = async () => {
  await screen.findByRole('dialog', { name: 'History' })
}

export const Versions: Story = { name: 'Published versions', play: opened }

export const Empty: Story = {
  name: 'Never published',
  args: { revisions: [] },
  play: opened,
}

export const Loading: Story = {
  name: 'Loading',
  args: { revisions: undefined, isLoading: true },
  play: opened,
}

export const ReadOnly: Story = {
  name: 'For a role that may only read',
  args: { canRestore: false },
  play: async () => {
    await opened()
    await expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument()
  },
}

export const Restoring: Story = {
  name: 'Restoring a version',
  args: { restoring: true },
  play: opened,
}
