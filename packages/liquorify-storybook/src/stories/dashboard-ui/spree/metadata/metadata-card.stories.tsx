import { MetadataCard } from '@spree/dashboard-ui/spree/metadata/metadata-card'
import type { Meta, StoryObj } from '@storybook/react-vite'

// The metadata card at the foot of the product page's main column (DA-PRD-03).
const meta = {
  title: 'Dashboard UI/Composed/Metadata/Metadata card',
  component: MetadataCard,
  tags: ['CMP-DUI-C-31'],
  args: {
    title: 'Metadata',
    emptyTitle: 'No metadata',
    emptyDescription: 'Apps and integrations populate this automatically.',
    metadata: {},
  },
  parameters: { liquorify: { column: 'main' } },
} satisfies Meta<typeof MetadataCard>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// Strings, numbers and booleans print as they are; anything else as JSON, and nothing as a dash.
export const Populated: Story = {
  args: {
    metadata: {
      erp_item_number: 'CM-0042',
      reorder_point: 12,
      kiln_fired: true,
      dimensions: { height_cm: 9, diameter_cm: 8 },
      discontinued_reason: null,
    },
  },
}

export const LongValue: Story = {
  name: 'Long value',
  args: {
    metadata: {
      sync_note:
        'Imported from the wholesale price sheet of the spring range; the supplier code and the colour name were merged into one field on import.',
    },
  },
}
