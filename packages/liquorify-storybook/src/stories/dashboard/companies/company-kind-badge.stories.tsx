import type { Meta, StoryObj } from '@storybook/react-vite'
import { CompanyKindBadge } from '../../../../../dashboard/src/components/spree/company-kind-badge'

/**
 * Whether a node in a company's tree is a legal entity or a part of one
 * (DA-CUS-04's Kind column, DA-CUS-05's header and divisions card).
 */
const meta = {
  title: 'Admin dashboard/Companies/Company kind badge',
  component: CompanyKindBadge,
  tags: ['CMP-DA-G-24'],
  args: { kind: 'company' },
} satisfies Meta<typeof CompanyKindBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Company: Story = {}

export const Division: Story = { args: { kind: 'division' } }
