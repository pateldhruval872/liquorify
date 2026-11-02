import { MobileTopBar } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { updateAvailable } from '../../../fixtures/admin/shell'
import { storeHeld } from '../../../mocks/handlers/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Mobile top bar',
  component: MobileTopBar,
  // Exists only below 768 pixels, so every story is captured at a phone's width.
  tags: ['CMP-CORE-17', 'phone'],
  // The phone's bar: the drawer, the store's name, search, notifications and
  // the account menu (DA-OVL-01).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// A newer release is waiting, so the bell carries its dot.
export const UnreadNotification: Story = {
  name: 'Unread notification',
  parameters: shellParameters({ update: updateAvailable }),
  play: async () => {
    await screen.findByRole('button', { name: 'Notifications, 1 unread' })
  },
}

export const Loading: Story = {
  parameters: { msw: { handlers: { shell: storeHeld } } },
  play: async () => {
    await screen.findByRole('button', { name: 'Toggle Sidebar' })
  },
}

// The same account menu as the rail's, hung below the avatar, with the theme
// following the system as the running dashboard starts.
export const AccountMenuOpen: Story = {
  name: 'Account menu open',
  parameters: shellParameters({ systemTheme: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'User menu' }))
    await screen.findByRole('menuitem', { name: 'Log out' })
  },
}
