import type {
  EmailTemplate,
  EmailTemplatePreview,
  EmailTemplateSampleRecord,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import {
  layoutTemplate,
  lineItemPartial,
  orderConfirmationTemplate,
  passwordResetPreview,
  passwordResetTemplate,
} from '../../../fixtures/admin/email-templates'

/**
 * What the template page's preview asks for: the rendered preview, the
 * store's latest records to preview with, and the store's templates, which a
 * layout or partial lists as the emails it can be shown in.
 */
export function previewRequests({
  preview = passwordResetPreview,
  records = [],
  templates = [orderConfirmationTemplate, passwordResetTemplate, layoutTemplate, lineItemPartial],
}: {
  preview?: EmailTemplatePreview
  records?: EmailTemplateSampleRecord[]
  templates?: EmailTemplate[]
} = {}) {
  return [
    http.post('/api/v3/admin/email_templates/:id/preview', () => HttpResponse.json(preview)),
    http.get('/api/v3/admin/email_templates/:id/sample_records', () =>
      HttpResponse.json({ data: records }),
    ),
    http.get('/api/v3/admin/email_templates', () => HttpResponse.json({ data: templates })),
  ]
}

/** Spree refuses to render the preview, with the body it answers. */
export function previewRefused(body: object) {
  return [
    http.post('/api/v3/admin/email_templates/:id/preview', () =>
      HttpResponse.json(body, { status: 422 }),
    ),
  ]
}

/** The preview never answers, so the card waits for its first render. */
export const previewHeld = [
  http.post('/api/v3/admin/email_templates/:id/preview', async () => {
    await delay('infinite')
  }),
]
