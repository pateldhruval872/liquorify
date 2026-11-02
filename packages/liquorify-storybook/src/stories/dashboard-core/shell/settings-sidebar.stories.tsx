import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { staffManagerRules } from '../../../fixtures/admin/staff'
import {
  pages,
  ShellPage,
  shellParameters,
  withStoreLayout,
} from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Settings sidebar',
  tags: ['CMP-CORE-29'],
  // The settings menu beside every settings page (DA-OVL-01). The admin's
  // whole menu shows in the app shell's "In settings" story.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters({ route: pages.staffSettings }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const settingsMenu = async () =>
  within(await screen.findByRole('complementary', { name: 'Settings navigation' }))

// Typing narrows the menu to the pages whose names match.
export const Searching: Story = {
  play: async () => {
    const menu = await settingsMenu()
    await userEvent.type(await menu.findByRole('searchbox'), 'tax')
    await menu.findByRole('link', { name: 'Taxes' })
  },
}

export const NothingMatches: Story = {
  name: 'Nothing matches',
  play: async () => {
    const menu = await settingsMenu()
    await userEvent.type(await menu.findByRole('searchbox'), 'zzz')
  },
}

// A role holding only `write_staff` reaches the staff and roles pages and
// nothing else in settings.
export const StaffManager: Story = {
  name: 'Staff manager',
  parameters: shellParameters({ route: pages.staffSettings, rules: staffManagerRules }),
  play: async () => {
    const menu = await settingsMenu()
    await menu.findByRole('link', { name: 'Staff' })
  },
}

// Below 1024 pixels the menu is gone from beside the page, so the trail's
// first crumb opens it in a sheet.
export const OnAPhone: Story = {
  name: 'On a phone, menu open',
  tags: ['phone'],
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog')
  },
}
