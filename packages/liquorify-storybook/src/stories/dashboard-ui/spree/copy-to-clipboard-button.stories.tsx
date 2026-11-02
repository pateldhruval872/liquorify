import { CopyToClipboardButton } from '@spree/dashboard-ui/spree/copy-to-clipboard-button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

// A browser may refuse a copy the story makes, so the clipboard is replaced
// with one that always accepts.
function acceptingClipboard() {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.resolve() },
  })
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original)
  }
}

const meta = {
  title: 'Dashboard UI/Composed/Copy to clipboard button',
  component: CopyToClipboardButton,
  tags: ['CMP-DUI-C-11'],
  // The agent server's address in the AI agents connect sheet (DA-SET-07).
  // Every use on the developer settings screens is this bare icon button.
  args: { value: 'https://store.example.com/api/v3/admin/mcp', 'aria-label': 'Copy address' },
  beforeEach: acceptingClipboard,
  render: (args) => (
    <div className="flex w-[28rem] items-center gap-2 rounded-md bg-muted px-3 py-2">
      <code className="flex-1 truncate font-mono text-xs">{args.value}</code>
      <CopyToClipboardButton {...args} />
    </div>
  ),
} satisfies Meta<typeof CopyToClipboardButton>

export default meta
type Story = StoryObj<typeof meta>

export const Icon: Story = {}

// The copied mark stays long enough to capture.
export const Copied: Story = {
  args: { resetMs: 600_000 },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Copy address' }))
  },
}
