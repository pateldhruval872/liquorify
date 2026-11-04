import type { Meta, StoryObj } from '@storybook/react-vite'
import { JurisdictionLabel } from '../../../../../dashboard/src/components/spree/jurisdiction-label'

/** The rates table's region cell (DA-SET-14), in the table's text. */
function RegionCell(props: { countryCode?: string | null; stateCode?: string | null }) {
  return (
    <span className="text-sm">
      <JurisdictionLabel {...props} />
    </span>
  )
}

// Where a tax rate applies, on the tax rates tab (DA-SET-14); exemption
// certificates on a customer use it too, in batch 10.
const meta = {
  title: 'Admin dashboard/Taxes/Jurisdiction label',
  component: RegionCell,
  tags: ['CMP-DA-G-24'],
} satisfies Meta<typeof RegionCell>

export default meta
type Story = StoryObj<typeof meta>

export const Country: Story = { args: { countryCode: 'DE' } }

// A state shows as its code after the country's name.
export const State: Story = { args: { countryCode: 'US', stateCode: 'CA' } }

// No country is everywhere, never missing.
export const Everywhere: Story = { args: { countryCode: null } }
