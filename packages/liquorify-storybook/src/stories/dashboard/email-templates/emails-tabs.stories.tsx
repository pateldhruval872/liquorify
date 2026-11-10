import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmailsTabs } from '../../../../../dashboard/src/components/spree/email-templates/emails-tabs'
import { storeParameters } from '../../../decorators/store'
import { shellStore } from '../../../fixtures/admin/shell'

/** Placed on the email settings page, as the store layout places it. */
function onPage(path: string) {
  const base = storeParameters()
  return {
    ...base,
    liquorify: {
      ...base.liquorify,
      route: { pattern: `/$storeId${path}`, path: `/${shellStore.id}${path}` },
    },
  }
}

/**
 * The tabs between the email settings and the templates (DA-SET-03,
 * DA-SET-04). A role that may not read email templates sees neither tab; the
 * running screens show that, since nothing renders here.
 */
const meta = {
  title: 'Admin dashboard/Email templates/Emails tabs',
  component: EmailsTabs,
  tags: ['CMP-DA-G-08'],
  args: { current: 'settings' },
  parameters: onPage('/settings/emails'),
} satisfies Meta<typeof EmailsTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Settings: Story = { name: 'On the settings' }

export const Templates: Story = {
  name: 'On the templates',
  args: { current: 'templates' },
  parameters: onPage('/settings/emails/templates'),
}
