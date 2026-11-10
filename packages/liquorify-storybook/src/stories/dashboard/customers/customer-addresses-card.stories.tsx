import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { CustomerAddressesCard } from '../../../../../dashboard/src/components/spree/customers/customer-addresses-card'
import { withStore } from '../../../decorators/store'
import {
  newCustomer,
  onlyAddress,
  regularCustomer,
  studioAddress,
} from '../../../fixtures/admin/customers'
import { customerParameters } from './customer-page'

/**
 * A customer's address book (DA-CUS-02's sidebar): each address with its
 * label and the defaults it holds, defaults first, and a menu to edit it,
 * make it a default or delete it.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer addresses card',
  component: CustomerAddressesCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerAddressesCard>

export default meta
type Story = StoryObj<typeof meta>

const withOneAddress = {
  ...newCustomer,
  addresses: [onlyAddress],
  default_billing_address_id: onlyAddress.id,
  default_shipping_address_id: onlyAddress.id,
}

/** Opens the menu on the studio address, the one that holds no default. */
async function openStudioMenu() {
  const row = (await screen.findByText(studioAddress.address1 as string)).closest(
    '[data-slot="item"]',
  ) as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

export const Addresses: Story = { name: 'Three addresses, with defaults' }

export const OneAddress: Story = {
  name: 'One address, default for both',
  args: { customer: withOneAddress },
  parameters: customerParameters({ customer: withOneAddress, column: 'sidebar' }),
}

export const NoAddresses: Story = {
  name: 'No addresses',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
}

export const RowMenu: Story = {
  name: 'Row menu',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openStudioMenu()
    await within(menu).findByRole('menuitem', { name: 'Set as default billing' })
  },
}

// The new address starts from the customer's name and phone.
export const AddAddress: Story = {
  name: 'Add address',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add address' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add address' })
    await within(dialog).findByDisplayValue(regularCustomer.phone as string)
  },
}

export const EditAddress: Story = {
  name: 'Edit address',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openStudioMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit address' })
    await within(dialog).findByDisplayValue('Studio')
    await within(dialog).findByDisplayValue(studioAddress.address1 as string)
  },
}

export const DeleteConfirm: Story = {
  name: 'Delete confirmation',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openStudioMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Delete this address?')
  },
}
