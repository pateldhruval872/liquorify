import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
} from '@spree/dashboard-ui/icons'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@spree/dashboard-ui/ui/dropdown-menu'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Dropdown menu',
  component: DropdownMenu,
  tags: ['CMP-DUI-P-21'],
  // A menu opens in a layer of its own, so its stories capture the window.
  // Spree's menus keep the default width, which follows the longest item.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
  await screen.findByRole('menu')
}

// A row's actions, as the staff list offers them: a label, the actions, and
// the destructive one set apart at the end.
export const Open: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Actions">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Jordan Lee</DropdownMenuLabel>
        <DropdownMenuItem>
          <PencilIcon />
          Edit
          <DropdownMenuShortcut>E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CopyIcon />
          Copy email
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserIcon />
          Resend invitation
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          Remove from store
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: openMenu,
}

// Choices kept in the menu: a set of switches and one pick from several.
export const Choices: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Email</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Roles</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false}>Last signed in</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="name">
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="joined">Date joined</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: openMenu,
}

export const SubmenuOpen: Story = {
  name: 'Submenu open',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Order manager</DropdownMenuItem>
            <DropdownMenuItem>Merchandiser</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async () => {
    await openMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Change role' }))
    await screen.findByRole('menuitem', { name: 'Support' })
  },
}
