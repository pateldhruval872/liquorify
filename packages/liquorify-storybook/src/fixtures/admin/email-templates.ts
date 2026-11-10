import type {
  EmailTemplate,
  EmailTemplateDraft,
  EmailTemplatePreview,
  EmailTemplateRevision,
  EmailTemplateSampleRecord,
} from '@spree/admin-sdk'
import recorded from './email-templates.json'
import { staffActor, teammateActor } from './orders'

/**
 * Spree's own templates as `GET /api/v3/admin/email_templates?language=en`
 * answers on the emails gem's test app at the pinned revision: the password
 * reset and order confirmation emails, the layout every email shares, and
 * the line item partial. Their bodies are Spree's defaults, unchanged.
 */
const templates = recorded.templates as Record<string, EmailTemplate>

export const passwordResetTemplate = templates['spree.customer_mailer.password_reset_email']
export const orderConfirmationTemplate = templates['spree.order_mailer.confirm_email']
export const layoutTemplate = templates['layouts.spree.base_mailer']
export const lineItemPartial = templates['spree.shared.line_item']

/**
 * The password reset email rendered with Spree's sample data, as
 * `POST …/preview` answers. Its web fonts are left out, because a story makes
 * no request outside Storybook; the running screens' captures block them too,
 * so both draw the email in its fallback fonts. The store's name and id are
 * the stories' own.
 */
export const passwordResetPreview = recorded.passwordResetPreview as EmailTemplatePreview

/** The order confirmation rendered with the emails app's latest order, Spree's sample order R1001, the same way. */
export const orderConfirmationPreview = recorded.orderConfirmationPreview as EmailTemplatePreview

const reworded = passwordResetTemplate.body.replace(
  'We received a request to reset your password.',
  'Someone asked to reset the password for your Sample Store account.',
)

/** The password reset email with a change saved as a draft, not yet published. */
export const savedDraft: EmailTemplateDraft = {
  id: 'etd_5Mn8Pq2R',
  subject: passwordResetTemplate.subject,
  body: reworded,
  lock_version: 2,
  created_at: '2026-09-30T15:20:00.000Z',
  updated_at: '2026-10-01T09:45:00.000Z',
  updated_by_id: teammateActor.id,
  updated_by_type: 'admin_user',
  updated_by: teammateActor,
}

/** The store's own version of the password reset email, published, with nothing waiting. */
export const customizedTemplate: EmailTemplate = {
  ...passwordResetTemplate,
  body: reworded,
  customized: true,
  customized_languages: ['en'],
  published_at: '2026-09-28T10:00:00.000Z',
  published_language: 'en',
}

/** The published version with a newer draft waiting. */
export const draftedTemplate: EmailTemplate = { ...customizedTemplate, draft: savedDraft }

/** A body Spree cannot render: a variable left open on line 5. */
export const brokenBody = passwordResetTemplate.body.replace('{{ name }},', '{{ name },')

/** Published versions of the password reset email, newest first. */
export const revisions: EmailTemplateRevision[] = [
  {
    id: 'etr_8Kd2Lp5W',
    subject: passwordResetTemplate.subject,
    body: reworded,
    created_at: '2026-09-28T10:00:00.000Z',
    published_by_id: teammateActor.id,
    published_by_type: 'admin_user',
    published_by: teammateActor,
  },
  {
    id: 'etr_3Hj7Nm1Q',
    subject: 'Reset your {{ store.name }} password',
    body: passwordResetTemplate.body,
    created_at: '2026-09-12T14:30:00.000Z',
    published_by_id: staffActor.id,
    published_by_type: 'admin_user',
    published_by: staffActor,
  },
]

/**
 * The store's latest orders, as `GET …/sample_records` lists them for an order
 * email: newest completed first, each dated by when it was created. "Latest"
 * previews the first, R1001, which was started before R1002 and completed
 * after it, as the emails app's two sample orders were.
 */
export const sampleOrders: EmailTemplateSampleRecord[] = [
  { id: 'or_7Gh2Jk4L', label: 'R1001', created_at: '2026-09-29T11:05:00.000Z' },
  { id: 'or_4Tn8Vb2X', label: 'R1002', created_at: '2026-09-30T16:12:00.000Z' },
]

/** Spree's words when an order email has no order to preview with, as the emails app answered before it had one. */
export const noSample = {
  error: {
    code: 'email_template_no_sample',
    message: 'There is no order in this store to preview this email with yet.',
  },
}

/** Spree's words when another editor saved the draft after this one opened it. */
export const staleDraftMessage = `${teammateActor.label} saved this draft after you opened it. Reload to see their changes before saving yours.`

/** Spree's refusal of a body it cannot render, naming the email and line, as the emails app answered. */
export const invalidTemplate = {
  error: {
    code: 'email_template_invalid',
    message:
      "Liquid syntax error (line 5): Variable '{{ name }' was not properly terminated with regexp: /\\}\\}/",
    details: {
      problems: [
        {
          email: 'spree.customer_mailer.password_reset_email',
          message:
            "Liquid syntax error (line 5): Variable '{{ name }' was not properly terminated with regexp: /\\}\\}/",
          line: 5,
        },
      ],
    },
  },
}
