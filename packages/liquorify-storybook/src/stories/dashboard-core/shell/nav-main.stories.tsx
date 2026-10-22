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
  title: 'Dashboard core/Shell/Nav main',
  tags: ['CMP-CORE-19'],
  // The rail's list of sections (DA-OVL-01).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters({ route: pages.returns }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// A child's page: its section stays open and lit, the child is marked, and
// each count sits beside the entry it belongs to.
export const ChildPage: Story = {
  name: 'Child page',
  play: async () => {
    await screen.findByRole('link', { name: /^Returns/ })
  },
}

// Collapsed to icons, a section with children opens them in a menu on hover,
// led by the section itself.
export const CollapsedMenu: Story = {
  name: 'Collapsed, section menu open',
  beforeEach: railLeft(false),
  play: async () => {
    await userEvent.hover(await screen.findByRole('link', { name: 'Products' }))
    await screen.findByRole('menuitem', { name: 'Categories' })
  },
}
