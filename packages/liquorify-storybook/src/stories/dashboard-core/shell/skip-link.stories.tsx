import { SkipLink } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { ShellPage, shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/Skip link',
  component: SkipLink,
  tags: ['CMP-CORE-33'],
  // Hidden until the first press of Tab on a page, then the way past the rail
  // to the page itself (DA-OVL-01).
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
    // The shell focuses the page when it opens; the first Tab of a fresh page
    // starts from the document itself.
    ;(document.activeElement as HTMLElement | null)?.blur()
    await userEvent.tab()
    await screen.findByRole('link', { name: 'Skip to content' })
  },
}
