import { RelativeTime } from '@spree/dashboard-ui/spree/relative-time'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

// Dated from the instant every story is captured at (`fixtures/clock.ts`).
const inFourteenDays = '2026-10-15T12:00:00.000Z'
const threeDaysAgo = '2026-09-28T12:00:00.000Z'

const meta = {
  title: 'Dashboard UI/Composed/Relative time',
  component: RelativeTime,
  tags: ['CMP-DUI-C-38'],
  args: { iso: inFourteenDays },
  decorators: [
    (Story) => (
      <span className="text-sm text-muted-foreground">
        <Story />
      </span>
    ),
  ],
} satisfies Meta<typeof RelativeTime>

export default meta
type Story = StoryObj<typeof meta>

// When a pending invitation expires (DA-SET-24).
export const Future: Story = {}

export const Past: Story = { args: { iso: threeDaysAgo } }

export const WithPrefix: Story = {
  name: 'With prefix',
  args: { iso: threeDaysAgo, prefix: 'Updated' },
}

export const Missing: Story = { args: { iso: null } }

// The exact date and time, in the reader's own time zone, on hover.
export const ExactTime: Story = {
  name: 'Exact time',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.hover(await screen.findByText('in 14 days'))
    await screen.findByText(/Oct 15, 2026/)
  },
}
