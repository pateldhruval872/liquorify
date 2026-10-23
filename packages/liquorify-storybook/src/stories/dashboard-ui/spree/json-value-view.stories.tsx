import { JsonValueView } from '@spree/dashboard-ui/spree/json-value-view'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { orderCompletedPayload } from '../../../fixtures/admin/webhooks'

const meta = {
  title: 'Dashboard UI/Composed/JSON value view',
  component: JsonValueView,
  tags: ['CMP-DUI-C-28'],
  // A delivery's payload in its detail sheet on a webhook endpoint's page
  // (DA-SET-29). The view keeps its dark surface in both themes.
  args: { value: orderCompletedPayload },
  decorators: [
    (Story) => (
      <div className="w-[36rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JsonValueView>

export default meta
type Story = StoryObj<typeof meta>

// Below the second level the payload starts folded, as the sheet shows it.
export const Payload: Story = {}

// Spree documents `collapsed: false` as expanding everything and `true` as
// collapsing everything. The view does the opposite, and so do the preview
// drawer's "Expand all" and "Collapse all", which pass these values. Recorded
// as a finding; the stories keep what each value really shows.
export const AskedToExpandAll: Story = {
  name: 'Asked to expand all',
  args: { collapsed: false },
}

export const AskedToCollapseAll: Story = {
  name: 'Asked to collapse all',
  args: { collapsed: true },
}

// A delivery Spree recorded without a payload shows an empty object.
export const EmptyPayload: Story = { name: 'Empty payload', args: { value: {} } }
