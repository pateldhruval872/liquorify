import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { CustomerStoreCreditsCard } from '../../../../../dashboard/src/components/spree/customers/customer-store-credits-card'
import { withStore } from '../../../decorators/store'
import { newCustomer, refundCredit, regularCustomer } from '../../../fixtures/admin/customers'
import { customerParameters } from './customer-page'

/**
 * The store credit a customer holds (DA-CUS-02's main column): each credit
 * with what was used and what remains, in its own currency, and the dialogs
 * that issue, change and delete credit (DA-LOY-02's, opened from here).
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer store credits card',
  component: CustomerStoreCreditsCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'main' }),
} satisfies Meta<typeof CustomerStoreCreditsCard>

export default meta
type Story = StoryObj<typeof meta>

/** Opens the menu on the unused refund credit, the second row. */
async function openRefundMenu() {
  const [amount] = await screen.findAllByText('$40.00')
  const row = amount.closest('tr') as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Actions' }))
  return screen.findByRole('menu')
}

export const Credits: Story = { name: 'Three credits, one in euros' }

export const NoCredit: Story = {
  name: 'No credit',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'main' }),
}

export const RowMenu: Story = {
  name: 'Row menu',
  parameters: customerParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openRefundMenu()
    await within(menu).findByRole('menuitem', { name: 'Delete' })
  },
}

export const IssueDialog: Story = {
  name: 'Issue dialog',
  parameters: customerParameters({ column: 'main', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Issue store credit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await within(dialog).findByText("Issue store credit to this customer's account.")
  },
}

export const EditDialog: Story = {
  name: 'Edit dialog',
  parameters: customerParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openRefundMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    await within(dialog).findByDisplayValue(refundCredit.amount as string)
  },
}

export const DeleteConfirm: Story = {
  name: 'Delete confirmation',
  parameters: customerParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openRefundMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Delete this store credit?')
  },
}
