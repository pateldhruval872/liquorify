import { Sidebar, SidebarHeader, SidebarProvider, SidebarTrigger } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { SellerSwitcher } from '../../../../../seller-dashboard/src/components/seller-switcher'
import { me } from '../../../fixtures/seller/session'
import { sellerReadHeld } from '../../../mocks/handlers/seller/panel'
import { panelParameters } from '../seller-panel'

/** A member of Harbour Cask and of Saltmarsh (work item §10.3). */
const twoSellers = {
  ...me,
  sellers: [
    ...me.sellers,
    {
      id: 'sel_98FqgRua4h',
      name: 'Saltmarsh Gin Co.',
      slug: 'saltmarsh-gin-co',
      status: 'approved',
    },
  ],
}

/** The seller the panel acts for, at the top of the rail (SP-OVL-01). */
const meta = {
  title: 'Seller panel/Panel/Seller switcher',
  component: SellerSwitcher,
  tags: ['CMP-SP-G-03'],
  render: () => (
    <SidebarProvider>
      {/* The rail's header as the panel draws it, with the collapse button
          beside the switcher. */}
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">
              <SellerSwitcher />
            </div>
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" />
          </div>
        </SidebarHeader>
      </Sidebar>
    </SidebarProvider>
  ),
  parameters: { ...panelParameters({ page: 'orders' }), layout: 'fullscreen' },
} satisfies Meta<typeof SellerSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const OneSeller: Story = { name: 'One seller, a label' }

export const TwoSellers: Story = {
  name: 'Two sellers',
  parameters: { ...panelParameters({ page: 'orders', session: twoSellers }), layout: 'fullscreen' },
}

export const Open: Story = {
  name: 'Two sellers, open',
  parameters: { ...panelParameters({ page: 'orders', session: twoSellers }), layout: 'fullscreen' },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Switch seller' }))
    await screen.findByRole('menuitem', { name: /Saltmarsh/ })
  },
}

export const Loading: Story = {
  parameters: {
    ...panelParameters({ page: 'orders', first: sellerReadHeld('me') }),
    layout: 'fullscreen',
  },
}
