import type { Meta, StoryObj } from '@storybook/react-vite'
import { OnboardingNavBadge } from '../../../../../seller-dashboard/src/components/onboarding-nav-badge'
import { onboarding } from '../../../fixtures/seller/profile'
import { panelParameters } from '../seller-panel'

/** How far through onboarding the seller is, beside its nav entry (SP-OVL-01). */
const meta = {
  title: 'Seller panel/Panel/Onboarding nav badge',
  component: OnboardingNavBadge,
  tags: ['CMP-SP-G-03'],
  parameters: panelParameters({ page: 'onboarding' }),
} satisfies Meta<typeof OnboardingNavBadge>

export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = { name: 'Three of nine done' }

/** The badge draws nothing once every task is done. */
export const AllDone: Story = {
  name: 'Every task done',
  parameters: panelParameters({
    page: 'onboarding',
    onboarding: { ...onboarding, progress: { done: 9, total: 9 } },
  }),
}
