import { Progress, ProgressValue } from '@spree/dashboard-ui/ui/progress'
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

// The getting started page's caption: the value after the bar, on one row.
export const WithValue: Story = {
  name: 'With value',
  args: { value: 2, max: 6, 'aria-label': undefined, className: 'flex-nowrap gap-3' },
  render: (args) => (
    <Progress {...args}>
      <ProgressValue className="order-last shrink-0">{() => '2 of 6 completed'}</ProgressValue>
    </Progress>
  ),
}

export const Indeterminate: Story = { args: { value: null } }
