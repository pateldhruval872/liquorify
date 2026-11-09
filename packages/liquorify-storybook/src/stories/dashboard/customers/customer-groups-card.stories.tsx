import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import { CustomerGroupsCard } from '../../../../../dashboard/src/components/spree/customers/customer-groups-card'
import { withStore } from '../../../decorators/store'
import { groupedCustomer, newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { templateRules } from '../../../fixtures/admin/shell'
import { customerWriteForbidden, customerWriteHeld } from '../../../mocks/handlers/admin/customers'
import { customerParameters } from './customer-page'

/**
 * The groups a customer belongs to (DA-CUS-02's sidebar), which price lists
 * and promotions can be limited to, with a sheet that replaces the whole
 * membership in one save.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer groups card',
  component: CustomerGroupsCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: groupedCustomer },
  decorators: [withStore],
  parameters: customerParameters({ customer: groupedCustomer, column: 'sidebar' }),
} satisfies Meta<typeof CustomerGroupsCard>

export default meta
type Story = StoryObj<typeof meta>

async function openSheet() {
  await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  const sheet = await screen.findByRole('dialog', { name: 'Edit customer groups' })
  await within(sheet).findByText('Wholesale')
  return sheet
}

async function removeWholesale(sheet: HTMLElement) {
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove Wholesale' }))
}

export const InGroups: Story = { name: 'In two groups' }

export const NoGroups: Story = {
  name: 'Not in any groups',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
}

// Save waits until the membership differs from what is saved.
export const EditSheet: Story = {
  name: 'Edit sheet',
  parameters: customerParameters({ customer: groupedCustomer, column: 'sidebar', viewport: true }),
  play: async () => {
    const sheet = await openSheet()
    await expect(within(sheet).getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}

export const Changed: Story = {
  name: 'Group removed, not saved',
  parameters: customerParameters({ customer: groupedCustomer, column: 'sidebar', viewport: true }),
  play: async () => {
    const sheet = await openSheet()
    await removeWholesale(sheet)
    await expect(within(sheet).getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Saving: Story = {
  parameters: customerParameters({
    customer: groupedCustomer,
    column: 'sidebar',
    viewport: true,
    first: customerWriteHeld,
  }),
  play: async () => {
    const sheet = await openSheet()
    await removeWholesale(sheet)
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findByRole('button', { name: 'Saving…' })
  },
}

// A role made from the support template reads customers and still sees the
// sheet; Spree refuses the save, and the sheet shows its message.
export const Refused: Story = {
  name: 'Refused for a read-only role',
  parameters: customerParameters({
    customer: groupedCustomer,
    rules: templateRules.support.rules,
    column: 'sidebar',
    viewport: true,
    first: customerWriteForbidden,
  }),
  play: async () => {
    const sheet = await openSheet()
    await removeWholesale(sheet)
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findByRole('alert')
  },
}

export const OneGroup: Story = {
  name: 'In one group',
  args: { customer: regularCustomer },
  parameters: customerParameters({ column: 'sidebar' }),
}
