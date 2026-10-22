import {
  HomeIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingCartIcon,
  UsersIcon,
} from '@spree/dashboard-ui/icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@spree/dashboard-ui/ui/sidebar'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Sidebar',
  component: Sidebar,
  tags: ['CMP-DUI-P-38'],
  // The rail the shell is built from fills the window, so it is captured whole.
  parameters: { layout: 'fullscreen', liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

const entries = [
  { title: 'Home', icon: HomeIcon },
  { title: 'Orders', icon: ShoppingCartIcon, badge: '4' },
  { title: 'Products', icon: PackageIcon },
  { title: 'Customers', icon: UsersIcon },
]

function Rail({ open = true, loading = false }: { open?: boolean; loading?: boolean }) {
  return (
    <SidebarProvider defaultOpen={open}>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <span className="truncate px-2 font-medium text-sm group-data-[collapsible=icon]:hidden">
            Sample Store
          </span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Store</SidebarGroupLabel>
            <SidebarMenu>
              {loading
                ? Array.from({ length: 4 }, (_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                : entries.map(({ title, icon: Icon, badge }) => (
                    <SidebarMenuItem key={title}>
                      <SidebarMenuButton isActive={title === 'Orders'} tooltip={title}>
                        {/* The button leaves an icon at its own size; the shell
                            draws its navigation icons at 16 pixels. */}
                        <Icon size={16} />
                        {/* Hidden by name, as the shell's navigation does: a trailing badge
                            takes the last place the button's own rule hides. */}
                        <span className="group-data-[collapsible=icon]:hidden">{title}</span>
                        {badge && <SidebarMenuBadge className="ms-auto">{badge}</SidebarMenuBadge>}
                      </SidebarMenuButton>
                      {title === 'Orders' && !loading && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive>Returns</SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton>Exchanges</SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <SettingsIcon size={16} />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4">
        <SidebarTrigger />
      </SidebarInset>
    </SidebarProvider>
  )
}

export const Expanded: Story = { render: () => <Rail /> }

// Folded to icons, as the shell leaves it inside settings.
export const IconRail: Story = { name: 'Icon rail', render: () => <Rail open={false} /> }

export const Loading: Story = {
  // Each placeholder row picks a random width; a fixed sequence keeps the
  // image the same from run to run.
  beforeEach: () => {
    const random = Math.random
    const widths = [0.9, 0.3, 0.6, 0.1]
    let next = 0
    Math.random = () => widths[next++ % widths.length]
    return () => {
      Math.random = random
    }
  },
  render: () => <Rail loading />,
}
