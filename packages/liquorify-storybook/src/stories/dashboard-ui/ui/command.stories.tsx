import {
  HomeIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
  ShoppingCartIcon,
} from '@spree/dashboard-ui/icons'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@spree/dashboard-ui/ui/command'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'

const meta = {
  title: 'Dashboard UI/Primitives/Command',
  component: Command,
  tags: ['CMP-DUI-P-15'],
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

function Commands({ query = '' }: { query?: string }) {
  return (
    <Command className="w-[42rem] border border-border">
      <CommandInput placeholder="Search products, orders, customers…" value={query} />
      <CommandList>
        <CommandEmpty>No results for "{query}".</CommandEmpty>
        <CommandGroup heading="Create">
          <CommandItem>
            <PlusIcon />
            New Product
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          <CommandItem>
            <HomeIcon />
            Home
          </CommandItem>
          <CommandItem>
            <ShoppingCartIcon />
            Orders
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <PackageIcon />
            Products
          </CommandItem>
          <CommandItem disabled>
            <SettingsIcon />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <CommandFooter />
    </Command>
  )
}

// The list the command palette is built on, with the first row selected.
export const Default: Story = { render: () => <Commands /> }

export const NothingMatches: Story = {
  name: 'Nothing matches',
  render: () => <Commands query="zzqx" />,
}

// The same list in its dialog, as the palette opens a third of the way down.
export const InADialog: Story = {
  name: 'In a dialog',
  parameters: { liquorify: { capture: 'viewport' } },
  render: () => (
    <CommandDialog open>
      <Command>
        <CommandInput placeholder="Search products, orders, customers…" />
        <CommandList>
          <CommandGroup heading="Go to">
            <CommandItem>
              <HomeIcon />
              Home
            </CommandItem>
            <CommandItem>
              <ShoppingCartIcon />
              Orders
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandFooter />
      </Command>
    </CommandDialog>
  ),
  play: async () => {
    await screen.findByRole('dialog')
  },
}
