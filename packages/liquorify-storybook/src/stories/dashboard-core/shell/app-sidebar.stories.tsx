import { AppSidebar } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { templateRules, templateTeammates } from '../../../fixtures/admin/shell'
import { permissionsHeld } from '../../../mocks/handlers/admin/shell'
import {
  pages,
  ShellPage,
  shellParameters,
  withStoreLayout,
} from '../../dashboard/shell/store-layout'

const meta = {
  title: 'Dashboard core/Shell/App sidebar',
  component: AppSidebar,
  tags: ['CMP-CORE-03'],
  // The rail lists what the reader's role may read (DA-OVL-01). The three
  // template roles' sidebars are the shell's permission evidence (§2.2).
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters({ route: pages.home }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ready = async () => {
  await screen.findByRole('link', { name: 'Home' })
}

// The admin role on the home page: every section, Orders closed with its count.
export const Admin: Story = { play: ready }

function template(key: keyof typeof templateRules): Story {
  const { rules, keys } = templateRules[key]
  return {
    parameters: shellParameters({ route: pages.home, rules, keys, user: templateTeammates[key] }),
    play: ready,
  }
}

export const OrderManager: Story = { name: 'Order manager', ...template('orderManager') }

export const Merchandiser: Story = template('merchandiser')

export const Support: Story = template('support')

// Until the reader's permissions arrive, no link is known yet, so the rail
// holds placeholder rows rather than a list that would then grow.
export const Loading: Story = {
  parameters: { msw: { handlers: { session: permissionsHeld } } },
}
