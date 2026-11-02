import { SidebarUser } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { shellStore, unnamedAdmin } from '../../../fixtures/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Sidebar user',
  component: SidebarUser,
  tags: ['CMP-CORE-32'],
  // The account menu at the foot of the rail (DA-OVL-01). The running
  // dashboard starts with its theme following the system, so the menu is shown
  // that way, the screen's own colours following the browser's.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters({ systemTheme: true }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'User menu' }))
  await screen.findByRole('menuitem', { name: 'Log out' })
}

// Preferences, the profile, the outbound links and signing out. The store has
// no storefront address, so there is no "View store".
export const Open: Story = { play: openMenu }

export const WithAStorefront: Story = {
  name: 'Store with a storefront',
  parameters: shellParameters({
    store: { ...shellStore, storefront_url: 'https://shop.example.com' },
    systemTheme: true,
  }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'View store' })
  },
}

// A teammate with no name is shown by their email address.
export const Unnamed: Story = {
  name: 'Teammate without a name',
  parameters: shellParameters({ user: unnamedAdmin, systemTheme: true }),
  play: openMenu,
}
