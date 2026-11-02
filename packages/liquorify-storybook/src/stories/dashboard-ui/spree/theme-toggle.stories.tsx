import { ThemeMenuItems } from '@spree/dashboard-ui/spree/theme-toggle'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Composed/Theme toggle',
  component: ThemeMenuItems,
  tags: ['CMP-DUI-C-53'],
  // The theme row of the account menu's preferences, set at the menu's width.
  // The pressed button is the story's theme: light in the light capture, dark
  // in the dark one.
  decorators: [
    (Story) => (
      <div className="w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThemeMenuItems>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The running dashboard starts here, following the system's colours.
export const FollowingTheSystem: Story = {
  name: 'Following the system',
  parameters: { liquorify: { systemTheme: true } },
}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
