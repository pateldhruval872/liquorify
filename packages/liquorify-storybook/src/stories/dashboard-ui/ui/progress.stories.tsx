import { Progress, ProgressLabel, ProgressValue } from '@spree/dashboard-ui/ui/progress'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Progress',
  component: Progress,
  tags: ['CMP-DUI-P-31'],
  args: { value: 40, 'aria-label': 'Import progress' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = { args: { value: 0 } }

export const Complete: Story = { args: { value: 100 } }

// The getting started page's caption: a label and the value beside it.
export const WithLabel: Story = {
  name: 'With label',
  args: { value: 60, 'aria-label': undefined },
  render: (args) => (
    <Progress {...args}>
      <ProgressLabel>3 of 5 steps done</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

export const Indeterminate: Story = { args: { value: null } }
