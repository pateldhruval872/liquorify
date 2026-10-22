import { LanguageMenuItems } from '@spree/dashboard-ui/spree/language-menu-items'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Composed/Language menu items',
  component: LanguageMenuItems,
  tags: ['CMP-DUI-C-30'],
  // The language row of the account menu's preferences, set at the menu's
  // width. Its list is the browser's own and opens outside the page, so only
  // the closed row can be captured.
  args: {
    label: 'Language',
    locales: [
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'pt-BR', name: 'Português (Brasil)' },
    ],
    value: 'en',
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LanguageMenuItems>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongName: Story = { name: 'Long name', args: { value: 'pt-BR' } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
