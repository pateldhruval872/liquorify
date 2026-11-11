import type { Meta, StoryObj } from '@storybook/react-vite'
import { EnterpriseUpsell } from '../../../../../dashboard/src/components/spree/enterprise-upsell'

/**
 * Marks something open-source Spree stops short of and links to Spree
 * Enterprise. On DA-CUS-05 it sits in the add member dialog, where company
 * roles would be (LIQ-006 §12).
 */
const meta = {
  title: 'Admin dashboard/Companies/Enterprise upsell',
  component: EnterpriseUpsell,
  tags: ['CMP-DA-G-24'],
  args: {
    title: 'Roles and approvals are an Enterprise feature',
    description:
      'Members you add here can buy for this company and manage its directory. Roles, approval workflows and spending limits come with Spree Enterprise.',
  },
  parameters: { liquorify: { column: 'inDialog' } },
} satisfies Meta<typeof EnterpriseUpsell>

export default meta
type Story = StoryObj<typeof meta>

export const CompanyRoles: Story = { name: 'Company roles' }
