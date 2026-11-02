import { StoreSwitcher } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { adminUser } from '../../../fixtures/admin/session'
import { storeHeld } from '../../../mocks/handlers/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Store switcher',
  component: StoreSwitcher,
  tags: ['CMP-CORE-36'],
  // The current store at the top of the rail, and the way to the admin's
  // other stores (DA-OVL-01).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const openSwitcher = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Switch store' }))
  await screen.findByRole('menuitem', { name: 'Outlet Store' })
}

// The admin's stores, the current one ticked. On a phone the switcher is not
// drawn: the top bar names the store, and the drawer is only for navigating.
export const Open: Story = { play: openSwitcher }

// With only one store there is nothing to switch to, so the name is a label.
export const OneStore: Story = {
  name: 'One store',
  parameters: shellParameters({ user: adminUser }),
  play: async () => {
    await screen.findByRole('link', { name: /^Orders/ })
  },
}

export const Loading: Story = {
  parameters: { msw: { handlers: { shell: storeHeld } } },
  play: async () => {
    await screen.findByRole('link', { name: /^Orders/ })
  },
}
