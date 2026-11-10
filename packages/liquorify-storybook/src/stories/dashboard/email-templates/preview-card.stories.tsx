import type { EmailTemplate } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { expect, screen, userEvent, within } from 'storybook/test'
import {
  EmailTemplatePreviewCard,
  useLivePreview,
} from '../../../../../dashboard/src/components/spree/email-templates/preview-card'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  layoutTemplate,
  noSample,
  orderConfirmationPreview,
  orderConfirmationTemplate,
  passwordResetTemplate,
  sampleOrders,
} from '../../../fixtures/admin/email-templates'
import {
  previewHeld,
  previewRefused,
  previewRequests,
} from '../../../mocks/handlers/admin/email-templates'

/**
 * The template's preview (DA-SET-05): Spree renders the template, with the
 * editor's unsaved changes, once typing pauses, from sample data or one of
 * the store's latest records. It shows the email or its plain text, at a
 * desktop or a phone's width; a layout or partial is shown inside an email
 * that uses it. The width is the card's beside the editor at 1280 pixels.
 */
function Preview({ template, enabled = true }: { template: EmailTemplate; enabled?: boolean }) {
  const preview = useLivePreview(
    template.id,
    { language: 'en', subject: template.subject ?? undefined, body: template.body },
    enabled,
  )
  return (
    <div style={{ width: 437 }}>
      <EmailTemplatePreviewCard template={template} preview={preview} />
    </div>
  )
}

function previewParameters(handlers: HttpHandler[] = previewRequests()) {
  const base = storeParameters()
  return { ...base, msw: { handlers: { ...base.msw.handlers, preview: handlers } } }
}

const rendered = async () => {
  await screen.findByText(/^Subject: /, {}, { timeout: 5000 })
}

const meta = {
  title: 'Admin dashboard/Email templates/Preview card',
  component: Preview,
  tags: ['CMP-DA-G-08'],
  args: { template: passwordResetTemplate },
  decorators: [withStore],
  parameters: previewParameters(),
} satisfies Meta<typeof Preview>

export default meta
type Story = StoryObj<typeof meta>

export const Email: Story = { name: 'The email, with sample data', play: rendered }

export const PlainText: Story = {
  name: 'Plain text',
  play: async ({ canvasElement }) => {
    await rendered()
    await userEvent.click(within(canvasElement).getByRole('tab', { name: 'Plain text' }))
    await within(canvasElement).findByText(/We received a request to reset your password/)
  },
}

export const Phone: Story = {
  name: 'At a phone’s width',
  play: async ({ canvasElement }) => {
    await rendered()
    const phone = within(canvasElement).getByRole('button', { name: 'Mobile width' })
    await userEvent.click(phone)
    await expect(phone).toHaveAttribute('aria-pressed', 'true')
    // A mouse click leaves no focus ring on the button; the story's click does.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

/** An order email offers the store's latest orders to preview with. */
export const OrderEmail: Story = {
  name: 'An order email, with orders to choose from',
  args: { template: orderConfirmationTemplate },
  parameters: previewParameters(
    previewRequests({ preview: orderConfirmationPreview, records: sampleOrders }),
  ),
  play: async ({ canvasElement }) => {
    await rendered()
    await within(canvasElement).findByText('Preview with record')
  },
}

export const ChoosingOrder: Story = {
  name: 'Choosing an order',
  args: { template: orderConfirmationTemplate },
  parameters: {
    ...previewParameters(
      previewRequests({ preview: orderConfirmationPreview, records: sampleOrders }),
    ),
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
  },
  play: async ({ canvasElement }) => {
    await rendered()
    await userEvent.click(
      within(canvasElement).getByRole('combobox', { name: 'Preview with record' }),
    )
    await screen.findByRole('option', { name: /R1001/ })
  },
}

/** A layout is previewed inside one of the emails that use it. */
export const Layout: Story = {
  name: 'The layout, shown in an email',
  args: { template: layoutTemplate },
  parameters: previewParameters(
    previewRequests({ preview: orderConfirmationPreview, records: sampleOrders }),
  ),
  play: async ({ canvasElement }) => {
    await rendered()
    await within(canvasElement).findByText('Show inside')
  },
}

export const NoSample: Story = {
  name: 'Nothing to preview with',
  args: { template: orderConfirmationTemplate },
  parameters: previewParameters([...previewRefused(noSample), ...previewRequests()]),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(noSample.error.message, {}, { timeout: 5000 })
  },
}

export const NeedsPermission: Story = {
  name: 'Needing a permission',
  args: { enabled: false },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(
      'Previews are rendered for people who can edit email templates.',
    )
  },
}

export const Rendering: Story = {
  name: 'Rendering the first preview',
  parameters: previewParameters([...previewHeld, ...previewRequests()]),
}
