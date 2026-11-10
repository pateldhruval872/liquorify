import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmailTemplateProblemsAlert } from '../../../../../dashboard/src/components/spree/email-templates/problems-alert'
import { invalidTemplate } from '../../../fixtures/admin/email-templates'

/**
 * Why a template does not render (DA-SET-05), as Spree lists it when a
 * preview or a publish is refused: the email and line where it knows them.
 * A layout or partial is checked in every email that uses it, so one change
 * can break several. The width is the template page's at 1280 pixels.
 */
function Alert(props: {
  problems: Array<{ email: string; message: string; line?: number | null }>
}) {
  return (
    <div style={{ width: 889 }}>
      <EmailTemplateProblemsAlert {...props} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Email templates/Problems alert',
  component: Alert,
  tags: ['CMP-DA-G-08'],
  args: { problems: invalidTemplate.error.details.problems },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const OnALine: Story = { name: 'A problem on a line' }

/**
 * A shared partial with a misspelt filter, refused on publishing in each of
 * the four emails that render it, as the emails app answered.
 */
export const InSeveralEmails: Story = {
  name: 'In several emails',
  args: {
    problems: [
      'spree.order_mailer.confirm_email',
      'spree.order_mailer.cancel_email',
      'spree.fulfillment_mailer.fulfilled_email',
      'spree.return_mailer.refunded_email',
    ].map((email) => ({
      email,
      message: 'Liquid error (spree/shared/line_item line 22): undefined filter monee',
      line: 22,
    })),
  },
}
