import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import { CustomerProfileCard } from '../../../../../dashboard/src/components/spree/customers/customer-profile-card'
import { withStore } from '../../../decorators/store'
import { erasedRecord, newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { customerWriteHeld, profileEmailTaken } from '../../../mocks/handlers/admin/customers'
import { customerParameters } from './customer-page'

/**
 * Who the customer is (DA-CUS-02's sidebar): email, phone, whether they
 * accept marketing and since when they have been a customer, with a sheet to
 * change them and the customer's tags.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer profile card',
  component: CustomerProfileCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerProfileCard>

export default meta
type Story = StoryObj<typeof meta>

async function openSheet() {
  await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
  return screen.findByRole('dialog', { name: 'Edit customer' })
}

export const Subscribed: Story = { name: 'With phone, subscribed to marketing' }

export const NotSubscribed: Story = {
  name: 'No phone, not subscribed',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
}

// Spree keeps the erased record's address that cannot receive mail; the card
// blanks it and the phone rather than showing either.
export const Erased: Story = {
  args: { customer: erasedRecord },
  parameters: customerParameters({ customer: erasedRecord, column: 'sidebar' }),
}

export const EditSheet: Story = {
  name: 'Edit sheet',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const sheet = await openSheet()
    await within(sheet).findByDisplayValue(regularCustomer.email as string)
    await within(sheet).findByText('Regular')
    await expect(within(sheet).getByRole('checkbox')).toBeChecked()
  },
}

export const Saving: Story = {
  parameters: customerParameters({ column: 'sidebar', viewport: true, first: customerWriteHeld }),
  play: async () => {
    const sheet = await openSheet()
    await userEvent.clear(within(sheet).getByLabelText('Phone'))
    await userEvent.type(within(sheet).getByLabelText('Phone'), '555-0199')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findByRole('button', { name: 'Saving…' })
  },
}

export const EmailTaken: Story = {
  name: 'Email already taken',
  parameters: customerParameters({ column: 'sidebar', viewport: true, first: profileEmailTaken }),
  play: async () => {
    const sheet = await openSheet()
    const email = within(sheet).getByLabelText('Email')
    await userEvent.clear(email)
    await userEvent.type(email, newCustomer.email as string)
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findAllByText(/already been taken/)
    // Focus stays on Save or leaves it depending on how fast the refusal comes back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
