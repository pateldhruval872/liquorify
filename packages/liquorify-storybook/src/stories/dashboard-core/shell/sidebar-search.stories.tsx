import { SidebarSearch } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  railLeft,
  ShellPage,
  shellParameters,
  withStoreLayout,
} from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Sidebar search',
  component: SidebarSearch,
  tags: ['CMP-CORE-31'],
  // The rail's way into the command palette, with its keyboard shortcut
  // (DA-OVL-01). The palette itself has its own stories.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await screen.findByRole('link', { name: /^Orders/ })
    const search = await screen.findByRole('button', { name: /Search anything/ })
    search.focus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Tab}')
  },
}

// Collapsed, it is an icon that names itself in a tooltip.
export const Collapsed: Story = {
  beforeEach: railLeft(false),
  play: async () => {
    await userEvent.hover(await screen.findByRole('button', { name: 'Search anything…' }))
    // Base UI's tooltip carries no role; collapsed, only it shows the words.
    await screen.findByText('Search anything…')
  },
}
