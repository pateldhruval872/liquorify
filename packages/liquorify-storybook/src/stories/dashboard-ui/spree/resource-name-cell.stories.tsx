import { ResourceNameCell } from '@spree/dashboard-ui/spree/resource-name-cell'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Composed/Resource name cell',
  component: ResourceNameCell,
  tags: ['CMP-DUI-C-42'],
  // A webhook endpoint's row on the webhooks page (DA-SET-28), which opens
  // the endpoint's page. None of the developer settings tables gives it a
  // second line.
  args: { id: 'whe_3Jk9Lm2N', dataAttr: 'data-webhook-endpoint-id', name: 'Order sync' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResourceNameCell>

export default meta
type Story = StoryObj<typeof meta>

export const Openable: Story = {}

// An endpoint without a name is listed by its address, as an allowed origin
// always is (DA-SET-30).
export const AddressAsName: Story = {
  name: 'Address as name',
  args: { name: 'https://analytics.example.com/ingest' },
}

// Without the attribute the row cannot be opened, so the cell is plain text,
// as on the OAuth clients page (DA-SET-27).
export const NotOpenable: Story = {
  name: 'Not openable',
  args: { dataAttr: undefined, name: 'Inventory assistant' },
}

// The cell's button takes keyboard focus, but Spree removes its outline and
// draws nothing in its place, so nothing shows. Recorded as a finding.
export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
    await expect(screen.getByRole('button', { name: 'Order sync' })).toHaveFocus()
  },
}
