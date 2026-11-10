import type { Meta, StoryObj } from '@storybook/react-vite'
import { GrowthBadge } from '../../../../../dashboard/src/components/spree/reporting/growth-badge'

/**
 * The change against the period before, beside a figure on the home page's
 * tiles and in a compared report's tiles and Change column (DA-HOME-01,
 * DA-RPT-02, DA-RPT-03). Spree sends growth as a decimal string, and none when
 * the period before had nothing to compare with.
 */
const meta = {
  title: 'Admin dashboard/Reporting/Growth badge',
  component: GrowthBadge,
  tags: ['CMP-DA-G-17'],
} satisfies Meta<typeof GrowthBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Up: Story = { name: 'Up', args: { growth: '12.5' } }

export const Down: Story = { name: 'Down', args: { growth: '-8.3' } }

export const Unchanged: Story = { name: 'Unchanged', args: { growth: '0' } }

export const New: Story = { name: 'New, with nothing before', args: { growth: null } }
