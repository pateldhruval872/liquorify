import { Checkbox } from '@spree/dashboard-ui/ui/checkbox'
import { Label } from '@spree/dashboard-ui/ui/label'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Label',
  component: Label,
  tags: ['CMP-DUI-P-27'],
  args: { children: 'Product name' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithControl: Story = {
  name: 'With control',
  render: () => (
    <Label>
      <Checkbox />
      Show on the storefront
    </Label>
  ),
}

export const DisabledControl: Story = {
  name: 'Disabled control',
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="archived" disabled />
      <Label htmlFor="archived">Archived products</Label>
    </div>
  ),
}
