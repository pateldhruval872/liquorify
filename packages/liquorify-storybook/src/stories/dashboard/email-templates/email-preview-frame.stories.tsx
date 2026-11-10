import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { EmailPreviewFrame } from '../../../../../dashboard/src/components/spree/email-templates/email-preview-frame'
import { passwordResetPreview } from '../../../fixtures/admin/email-templates'

/**
 * A rendered email in a sandboxed frame, or its plain-text part (DA-SET-05),
 * at a desktop or a phone's width, at the size the preview card gives it at
 * 1280 pixels.
 */
function Frame(props: ComponentProps<typeof EmailPreviewFrame>) {
  return (
    <div style={{ width: 410 }}>
      <EmailPreviewFrame className="h-[36rem]" {...props} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Email templates/Email preview frame',
  component: Frame,
  tags: ['CMP-DA-G-08'],
  args: { html: passwordResetPreview.html, text: passwordResetPreview.text },
} satisfies Meta<typeof Frame>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = { name: 'The email' }

export const Phone: Story = { name: 'At a phone’s width', args: { width: 'mobile' } }

export const PlainText: Story = { name: 'Plain text', args: { view: 'text' } }

export const Blank: Story = { name: 'Nothing rendered yet', args: { html: undefined } }
