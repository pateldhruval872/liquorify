import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { EditStoreCreditDialog } from '../../../../../dashboard/src/components/spree/store-credits/edit-store-credit-dialog'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  birthdayCredit,
  goodwillCredit,
  ines,
  morgan,
  returnCredit,
  tom,
} from '../../../fixtures/admin/loyalty'
import {
  creditInUseRefused,
  creditWriteHeld,
  customerCreditRequests,
} from '../../../mocks/handlers/admin/loyalty'

/** Signed in, with credits written; `credits` replaces the default answers. */
function dialogParameters(credits: HttpHandler[] = customerCreditRequests()) {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: { handlers: { ...base.msw.handlers, credits } },
  }
}

/**
 * The dialog that edits a store credit (DA-LOY-02, DA-CUS-02): its amount,
 * locked once any of it was used, and its memo. The currency shows, and
 * cannot change.
 */
const meta = {
  title: 'Admin dashboard/Store credits/Edit store credit dialog',
  component: EditStoreCreditDialog,
  tags: ['CMP-DA-G-21'],
  args: { customerId: tom.id, credit: birthdayCredit, onOpenChange: fn() },
  decorators: [withStore],
  parameters: dialogParameters(),
} satisfies Meta<typeof EditStoreCreditDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Unused: Story = {
  name: 'An unused credit',
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    await expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('25.00')
    await expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toBeEnabled()
    await expect(within(dialog).getByRole('textbox', { name: 'Memo' })).toHaveValue(
      'Birthday credit',
    )
  },
}

export const PartlyUsed: Story = {
  name: 'A partly used credit, its amount locked',
  args: { customerId: morgan.id, credit: goodwillCredit },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    await within(dialog).findByText('Adjust the amount or memo. Used balance cannot be edited.')
    await expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toBeDisabled()
  },
}

export const InEuros: Story = {
  name: 'In euros',
  args: { customerId: ines.id, credit: returnCredit },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    await within(dialog).findByText('€')
  },
}

export const Saved: Story = {
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    const amount = within(dialog).getByRole('textbox', { name: 'Amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '30.00')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false))
  },
}

export const Saving: Story = {
  parameters: dialogParameters([...creditWriteHeld, ...customerCreditRequests()]),
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await expect(await within(dialog).findByRole('button', { name: 'Saving…' })).toBeDisabled()
  },
}

export const AmountInvalid: Story = {
  name: 'Amount of zero',
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    const amount = within(dialog).getByRole('textbox', { name: 'Amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await within(dialog).findByText('Amount must be greater than 0')
    await expect(args.onOpenChange).not.toHaveBeenCalled()
  },
}

/** The credit was used after the dialog opened, so Spree refuses a new amount. */
export const UsedMeanwhile: Story = {
  name: 'Used since the dialog opened',
  parameters: dialogParameters([...creditInUseRefused, ...customerCreditRequests()]),
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Edit store credit' })
    const amount = within(dialog).getByRole('textbox', { name: 'Amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '30.00')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await within(dialog).findByRole('alert')
  },
}
