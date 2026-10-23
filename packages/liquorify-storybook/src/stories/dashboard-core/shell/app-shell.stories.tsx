import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  pages,
  railLeft,
  ShellPage,
  shellParameters,
  withStoreLayout,
} from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/App shell',
  tags: ['CMP-CORE-02'],
  // The frame of every store page (DA-OVL-01), as the admin role sees it.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Orders carries its count in its name, "Orders 4", until the rail collapses.
const navigationReady = async () => {
  await screen.findByRole('link', { name: /^Orders/ })
}

export const Expanded: Story = { play: navigationReady }

// The rail as a merchant leaves it after collapsing it: icons only, with the
// way back above the page. A top-level page names itself, so no trail shows.
export const Collapsed: Story = {
  beforeEach: railLeft(false),
  play: navigationReady,
}

// Inside settings the rail folds to icons by itself and the settings menu
// opens beside it, with the trail above the page.
export const InSettings: Story = {
  name: 'In settings',
  parameters: shellParameters({ route: pages.staffSettings }),
  play: async () => {
    await screen.findByRole('link', { name: 'Staff' })
  },
}

// Below 768 pixels the rail becomes a drawer, and a top bar opens it.
export const OnAPhone: Story = {
  name: 'On a phone',
  tags: ['phone'],
  play: async () => {
    await screen.findByRole('button', { name: 'Toggle Sidebar' })
  },
}

export const OnAPhoneNavigationOpen: Story = {
  name: 'On a phone, navigation open',
  tags: ['phone'],
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Toggle Sidebar' }))
    await navigationReady()
  },
}
