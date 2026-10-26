import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@spree/dashboard-ui'
import { MapIcon } from '@spree/dashboard-ui/icons'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { GettingStartedNavBadge } from '../../../../../dashboard/src/components/spree/getting-started-nav-badge'
import { storeParameters, withStore } from '../../../decorators/store'
import { freshStore, setUpStore } from '../../../fixtures/admin/settings'

/**
 * The Getting Started entry in the main navigation (`nav-main.tsx`), with the
 * badge after its name, on the sidebar's background and padding. The provider
 * would otherwise be as tall as the window.
 */
function NavEntry() {
  return (
    <SidebarProvider className="w-64 bg-sidebar p-2 text-sidebar-foreground not-has-data-[variant=inset]:min-h-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="#getting-started">
              <MapIcon />
              <span>Getting Started</span>
              <span className="ml-auto shrink-0">
                <GettingStartedNavBadge />
              </span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarProvider>
  )
}

const meta = {
  title: 'Admin dashboard/Getting started/Getting started nav badge',
  component: NavEntry,
  tags: ['CMP-DA-G-24'],
  decorators: [withStore],
  // Two of the six tasks done, as on the browser tests' store.
  parameters: storeParameters(),
} satisfies Meta<typeof NavEntry>

export default meta
type Story = StoryObj<typeof meta>

export const SomeDone: Story = { name: 'Some done' }

export const NoneDone: Story = { name: 'None done', parameters: storeParameters(freshStore) }

// Every task done: the badge is gone, and so is the entry in the running dashboard.
export const AllDone: Story = { name: 'All done', parameters: storeParameters(setUpStore) }
