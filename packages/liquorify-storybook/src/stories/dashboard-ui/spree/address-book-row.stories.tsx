import { AddressBookRow } from '@spree/dashboard-ui/spree/address-book-row'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import {
  homeAddress,
  onlyAddress,
  plainAddress,
  studioAddress,
} from '../../../fixtures/admin/customers'

/**
 * One address in an address book (CMP-DUI-C-02): its label, the defaults it
 * holds and a menu of what can be done with it. A customer's book uses it on
 * DA-CUS-02; a company's and a seller's use it in batches 12 and 13.
 */
const meta = {
  title: 'Dashboard UI/Composed/Address book row',
  component: AddressBookRow,
  tags: ['CMP-DUI-C-02'],
  args: {
    address: studioAddress,
    onEdit: fn(),
    onRemove: fn(),
    onSetDefaultBilling: fn(),
    onSetDefaultShipping: fn(),
  },
  parameters: { liquorify: { column: 'inSidebarCard' } },
} satisfies Meta<typeof AddressBookRow>

export default meta
type Story = StoryObj<typeof meta>

const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

export const Labelled: Story = { name: 'Labelled, no default' }

export const DefaultShipping: Story = {
  name: 'Default for shipping',
  args: { address: homeAddress },
}

export const DefaultForBoth: Story = {
  name: 'Default for both, no label',
  args: { address: onlyAddress },
}

// With neither a label nor a default, the row has no title line.
export const Plain: Story = {
  name: 'No label or default',
  args: { address: plainAddress },
}

export const ReadOnly: Story = {
  name: 'Read-only',
  args: { canEdit: false },
  play: async () => {
    await expect(screen.queryByRole('button', { name: 'Open actions' })).not.toBeInTheDocument()
  },
}

export const Menu: Story = {
  name: 'Menu open',
  parameters: { liquorify: { column: 'inSidebarCard', capture: 'viewport' } },
  play: async () => {
    const menu = await openMenu()
    await within(menu).findByRole('menuitem', { name: 'Set as default shipping' })
  },
}

// A default already held leaves its action out of the menu.
export const MenuOnDefault: Story = {
  name: 'Menu on the default shipping address',
  args: { address: homeAddress },
  parameters: { liquorify: { column: 'inSidebarCard', capture: 'viewport' } },
  play: async () => {
    const menu = await openMenu()
    await within(menu).findByRole('menuitem', { name: 'Set as default billing' })
    await expect(
      within(menu).queryByRole('menuitem', { name: 'Set as default shipping' }),
    ).not.toBeInTheDocument()
  },
}

// An owner that leaves the defaults out, as a book with one address does.
export const MenuWithoutDefaults: Story = {
  name: 'Menu without default actions',
  args: { onSetDefaultBilling: undefined, onSetDefaultShipping: undefined },
  parameters: { liquorify: { column: 'inSidebarCard', capture: 'viewport' } },
  play: async () => {
    const menu = await openMenu()
    await within(menu).findByRole('menuitem', { name: 'Edit' })
    await expect(within(menu).queryAllByRole('menuitem')).toHaveLength(2)
  },
}
