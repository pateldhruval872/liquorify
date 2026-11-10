import { Toaster } from '@spree/dashboard-ui/ui/toast'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { CustomerPrivacyCard } from '../../../../../dashboard/src/components/spree/customers/customer-privacy-card'
import { withStore } from '../../../decorators/store'
import { erasedRecord, newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { exportHeld, exportRefused } from '../../../mocks/handlers/admin/customers'
import { customerParameters } from './customer-page'

/**
 * A data protection request answered from the customer's page (DA-CUS-02's
 * sidebar, FL-23): a copy of the customer's data downloaded as a file, or
 * their personal details erased while their orders and balances are kept.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer privacy card',
  component: CustomerPrivacyCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerPrivacyCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithConsent: Story = { name: 'With a consent date' }

export const NoConsent: Story = {
  name: 'No consent recorded',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'sidebar' }),
}

export const EraseConfirm: Story = {
  name: 'Erase confirmation',
  parameters: customerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Erase personal data' }))
    await screen.findByRole('dialog', { name: "Erase this customer's personal data?" })
  },
}

// Erasing again stays, for personal data added after the first erasure; the
// export goes, since it would hand back only the erased record.
export const Erased: Story = {
  args: { customer: erasedRecord },
  parameters: customerParameters({ customer: erasedRecord, column: 'sidebar' }),
  play: async () => {
    await screen.findByRole('button', { name: 'Erase again' })
    await expect(screen.queryByRole('button', { name: 'Export data' })).not.toBeInTheDocument()
  },
}

export const Exporting: Story = {
  parameters: customerParameters({ column: 'sidebar', first: exportHeld }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export data' }))
    await expect(screen.getByRole('button', { name: 'Export data' })).toBeDisabled()
  },
}

// The failure is raised as a toast, which the dashboard's shell shows; the
// pointer rests on it so it stays until the capture.
export const ExportFailed: Story = {
  name: 'Export refused',
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  parameters: customerParameters({ column: 'sidebar', viewport: true, first: exportRefused }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Export data' }))
    await userEvent.hover(await screen.findByText('Could not export the data'))
    await screen.findByText('Download failed: 403')
  },
}
