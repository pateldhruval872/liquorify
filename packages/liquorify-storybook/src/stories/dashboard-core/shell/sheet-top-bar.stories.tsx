import { SheetTopBar } from '@spree/dashboard-core'
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
  title: 'Dashboard core/Shell/Sheet top bar',
  component: SheetTopBar,
  tags: ['CMP-CORE-30'],
  // Above the page while the rail is collapsed: the way to expand it, and the
  // trail (DA-OVL-01). With the rail expanded it is not drawn at all, as the
  // app shell's "Expanded" story shows, and in settings it keeps only the
  // trail, as its "In settings" story shows.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  beforeEach: railLeft(false),
  parameters: shellParameters({ route: pages.order }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// An order's page: the trail ends at the section, the way back up. An order
// runs past the bottom of the window, and on a page that does the bar gives
// up 8 pixels of its height, since it may shrink to its 32-pixel minimum.
export const RecordPage: Story = {
  name: 'Record page',
  render: () => (
    <>
      <ShellPage />
      {/* Stands in for the order's cards. */}
      <div aria-hidden="true" className="h-[150vh]" />
    </>
  ),
  play: async () => {
    await screen.findByRole('button', { name: 'Toggle Sidebar' })
  },
}
