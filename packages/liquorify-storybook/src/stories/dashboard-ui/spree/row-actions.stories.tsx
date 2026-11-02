import { BanIcon, CopyIcon, LinkIcon, MailIcon, UserMinusIcon } from '@spree/dashboard-ui/icons'
import { RowActions } from '@spree/dashboard-ui/spree/row-actions'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

const nothing = () => {}

const meta = {
  title: 'Dashboard UI/Composed/Row actions',
  component: RowActions,
  tags: ['CMP-DUI-C-45'],
  // A teammate's actions on the staff page (DA-SET-24).
  args: {
    actions: [
      { key: 'edit', onSelect: nothing },
      {
        key: 'remove',
        label: 'Remove from staff',
        icon: <UserMinusIcon className="size-4" />,
        destructive: true,
        onSelect: nothing,
      },
    ],
  },
} satisfies Meta<typeof RowActions>

export default meta
type Story = StoryObj<typeof meta>

const open = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Open actions' }))
    await screen.findByRole('menu')
  },
} satisfies Story

// An action the reader may not take is left out of the menu, and with none
// left the menu does not render at all, which leaves nothing to capture.
export const Closed: Story = {}

export const Open: Story = { ...open }

// A pending invitation's actions, with custom labels and icons.
export const CustomActions: Story = {
  ...open,
  name: 'Custom actions',
  args: {
    actions: [
      { key: 'resend', label: 'Resend', icon: <MailIcon className="size-4" />, onSelect: nothing },
      {
        key: 'copy-link',
        label: 'Copy invitation link',
        icon: <LinkIcon className="size-4" />,
        onSelect: nothing,
      },
      {
        key: 'revoke',
        label: 'Revoke',
        icon: <BanIcon className="size-4" />,
        destructive: true,
        onSelect: nothing,
      },
    ],
  },
}

// A role still held by staff: delete stays in the menu, greyed out (DA-SET-25).
export const DisabledAction: Story = {
  ...open,
  name: 'Disabled action',
  args: {
    actions: [
      { key: 'edit', onSelect: nothing },
      {
        key: 'duplicate',
        label: 'Duplicate',
        icon: <CopyIcon className="size-4" />,
        onSelect: nothing,
      },
      { key: 'delete', destructive: true, disabled: true, onSelect: nothing },
    ],
  },
}
