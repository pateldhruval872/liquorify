import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { IssueStoreCreditDialog } from '../../../../../dashboard/src/components/spree/store-credits/issue-store-credit-dialog'
import { storeParameters, withStore } from '../../../decorators/store'
import { tom } from '../../../fixtures/admin/loyalty'
import {
  creditAmountRefused,
  creditWriteHeld,
  customerCreditRequests,
} from '../../../mocks/handlers/admin/loyalty'

/** Signed in, with the customers searched and credits written; `credits` replaces both. */
function dialogParameters(credits: HttpHandler[] = customerCreditRequests()) {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: { handlers: { ...base.msw.handlers, credits } },
  }
}

/**
 * The dialog that issues store credit (DA-LOY-02, DA-CUS-02): from a
 * customer's page it credits that customer; from the store credits list it
 * first asks which customer, searched by name or email and shown by email.
 * The amount is typed in the admin's own number format, in the store's
 * currency unless another is chosen, with an optional memo.
 */
const meta = {
  title: 'Admin dashboard/Store credits/Issue store credit dialog',
  component: IssueStoreCreditDialog,
  tags: ['CMP-DA-G-21'],
  args: { open: true, onOpenChange: fn(), onIssued: fn() },
  decorators: [withStore],
  parameters: dialogParameters(),
} satisfies Meta<typeof IssueStoreCreditDialog>

export default meta
type Story = StoryObj<typeof meta>

export const ChoosingCustomer: Story = {
  name: 'From the store credits list',
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await within(dialog).findByText('Choose a customer and the amount to add to their account.')
    await within(dialog).findByText('Customer')
    await expect(within(dialog).getByRole('combobox', { name: 'Currency' })).toHaveTextContent(
      'USD',
    )
  },
}

export const ForOneCustomer: Story = {
  name: 'From a customer’s page',
  args: { customerId: tom.id },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await within(dialog).findByText("Issue store credit to this customer's account.")
    await expect(within(dialog).queryByText('Customer')).not.toBeInTheDocument()
  },
}

export const SearchingCustomers: Story = {
  name: 'Searching customers',
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.type(within(dialog).getAllByRole('combobox')[0], 'tom')
    await screen.findByRole('option', { name: tom.email as string })
  },
}

export const Issued: Story = {
  name: 'Issued',
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.type(within(dialog).getAllByRole('combobox')[0], 'tom')
    await userEvent.click(await screen.findByRole('option', { name: tom.email as string }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '20.00')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Memo' }), 'Missing spoon')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Issue store credit' }))
    await waitFor(() =>
      expect(args.onIssued).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '20.00',
          currency: 'USD',
          memo: 'Missing spoon',
          customer_id: tom.id,
        }),
      ),
    )
  },
}

export const Issuing: Story = {
  name: 'Issuing',
  args: { customerId: tom.id },
  parameters: dialogParameters([...creditWriteHeld, ...customerCreditRequests()]),
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '20')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Issue store credit' }))
    await expect(await within(dialog).findByRole('button', { name: 'Saving…' })).toBeDisabled()
  },
}

/**
 * The amount field is required in the browser's own way, so the browser stops
 * the form before the dialog checks anything, and says so in a bubble of its
 * own that no image shows.
 */
export const NothingFilledIn: Story = {
  name: 'Nothing filled in',
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Issue store credit' }))
    await expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toBeInvalid()
    await expect(
      within(dialog).queryByText('Amount must be greater than 0'),
    ).not.toBeInTheDocument()
    await expect(args.onIssued).not.toHaveBeenCalled()
  },
}

export const AmountOfZero: Story = {
  name: 'Amount of zero',
  args: { customerId: tom.id },
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Issue store credit' }))
    await within(dialog).findByText('Amount must be greater than 0')
    await expect(args.onIssued).not.toHaveBeenCalled()
  },
}

/** The dialog lets an amount with three decimal places through, and Spree refuses it. */
export const AmountRefused: Story = {
  name: 'Amount refused by Spree',
  args: { customerId: tom.id },
  parameters: dialogParameters([...creditAmountRefused, ...customerCreditRequests()]),
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '0.001')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Issue store credit' }))
    await within(dialog).findByText('has more than 2 decimal places')
  },
}

export const InEuros: Story = {
  name: 'In euros',
  args: { customerId: tom.id },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Issue store credit' })
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Currency' }))
    await userEvent.click(await screen.findByRole('option', { name: /EUR/ }))
    await within(dialog).findByText('€')
  },
}
