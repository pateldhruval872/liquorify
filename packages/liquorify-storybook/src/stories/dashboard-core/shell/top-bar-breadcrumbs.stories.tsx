import { TopBarBreadcrumbs } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import {
  pages,
  railLeft,
  ShellPage,
  shellParameters,
  withStoreLayout,
} from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Top bar breadcrumbs',
  component: TopBarBreadcrumbs,
  tags: ['CMP-CORE-39'],
  // The trail named from the navigation, shown above the page on a desktop
  // when the rail is collapsed and in its own row on a phone (DA-OVL-01).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  beforeEach: railLeft(false),
  parameters: shellParameters({ route: pages.returns }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const trail = async () => {
  await screen.findByRole('navigation', { name: 'Breadcrumb' })
}

// A child page: its section, then the page itself.
export const ChildPage: Story = { name: 'Child page', play: trail }

// A record the navigation cannot name stops at its section, as a link.
export const OnAPhoneRecordPage: Story = {
  name: 'On a phone, record page',
  tags: ['phone'],
  parameters: shellParameters({ route: pages.order }),
  play: trail,
}

// In settings on a phone the first crumb opens the settings menu.
export const OnAPhoneInSettings: Story = {
  name: 'On a phone, in settings',
  tags: ['phone'],
  parameters: shellParameters({ route: pages.staffSettings }),
  play: async () => {
    await screen.findByRole('button', { name: 'Settings' })
  },
}
