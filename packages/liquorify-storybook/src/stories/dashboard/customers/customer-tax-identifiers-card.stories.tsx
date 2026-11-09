import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import { CustomerTaxIdentifiersCard } from '../../../../../dashboard/src/components/spree/customers/customer-tax-identifiers-card'
import { withStore } from '../../../decorators/store'
import { euIdentifier, regularCustomer } from '../../../fixtures/admin/customers'
import { templateRules } from '../../../fixtures/admin/shell'
import {
  taxIdentifierRefused,
  taxIdentifierRequests,
  taxIdentifiersHeld,
} from '../../../mocks/handlers/admin/customers'
import { customerParameters } from './customer-page'

/**
 * A customer's VAT and business numbers (DA-CUS-02's sidebar, CAP-07-12),
 * read and written through the customer. Spree's core checks only the format
 * of an EU VAT number, which is not a registry check, so on Spree's core every
 * row says nothing can check it.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer tax identifiers card',
  component: CustomerTaxIdentifiersCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerTaxIdentifiersCard>

export default meta
type Story = StoryObj<typeof meta>

async function openAddSheet() {
  await userEvent.click(await screen.findByRole('button', { name: 'Add registration' }))
  return screen.findByRole('dialog', { name: 'Add tax registration' })
}

async function openEuMenu() {
  const row = (await screen.findByText(euIdentifier.value)).closest(
    '[role="listitem"]',
  ) as HTMLElement
  // The actions appear once the session says the role may change customers.
  await userEvent.click(await within(row).findByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

export const Identifiers: Story = { name: 'Two numbers, nothing to check them' }

export const NoIdentifiers: Story = {
  name: 'None on file',
  parameters: customerParameters({ column: 'sidebar', first: taxIdentifierRequests([]) }),
}

export const Loading: Story = {
  parameters: customerParameters({ column: 'sidebar', first: taxIdentifiersHeld }),
  play: async () => {
    await screen.findByText('Loading…')
  },
}

// A role made from the support template reads customers but may not change them.
export const ReadOnly: Story = {
  name: 'Read-only role',
  parameters: customerParameters({ column: 'sidebar', rules: templateRules.support.rules }),
  play: async () => {
    await screen.findByText(euIdentifier.value)
    await expect(screen.queryByRole('button', { name: 'Add registration' })).not.toBeInTheDocument()
  },
}

// With no validator that checks a registry, the check is offered and disabled.
export const RowMenu: Story = {
  name: 'Row menu',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openEuMenu()
    await expect(
      within(menu).getByRole('menuitem', { name: 'Check with registry' }),
    ).toHaveAttribute('aria-disabled', 'true')
  },
}

export const AddSheet: Story = {
  name: 'Add sheet',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const sheet = await openAddSheet()
    await within(sheet).findByText('Kind')
  },
}

export const Refused: Story = {
  name: 'Number refused',
  parameters: customerParameters({
    column: 'sidebar',
    viewport: true,
    first: taxIdentifierRefused,
  }),
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Kind' }))
    await userEvent.click(await screen.findByRole('option', { name: 'EU VAT' }))
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Number' }), 'DE12345')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findAllByText(/does not look like a valid EU VAT registration/)
  },
}

export const EditSheet: Story = {
  name: 'Edit sheet',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openEuMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit tax registration' })
    await within(sheet).findByDisplayValue(euIdentifier.value)
  },
}

export const DeleteConfirm: Story = {
  name: 'Delete confirmation',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const menu = await openEuMenu()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByRole('dialog', { name: 'Delete this registration?' })
  },
}
