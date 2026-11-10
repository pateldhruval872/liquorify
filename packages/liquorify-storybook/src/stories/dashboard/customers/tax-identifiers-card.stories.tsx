import { SpreeError } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'
import { TaxIdentifiersCard } from '../../../../../dashboard/src/components/spree/tax-identifiers-card'
import { storeParameters, withStore } from '../../../decorators/store'
import { customerIdentifiers } from '../../../fixtures/admin/customers'
import { formatRefusalBody } from '../../../mocks/handlers/admin/customers'

const saved = () => Promise.resolve()

/** Spree's refusal of an EU VAT number whose format its core check rejects. */
const formatRefused = new SpreeError(formatRefusalBody, 422)

/**
 * The shared tax registrations card wired to the admin dashboard's errors
 * (CMP-DA-G-24): the owner, a customer here and a company in batch 12, supplies
 * the writes, and a refused save lands on the form's fields.
 */
const meta = {
  title: 'Admin dashboard/Customers/Tax identifiers card',
  component: TaxIdentifiersCard,
  tags: ['CMP-DA-G-24'],
  args: {
    identifiers: customerIdentifiers,
    canEdit: true,
    mutations: {
      create: fn(saved),
      update: fn(saved),
      remove: fn(saved),
      validate: fn(saved),
    },
  },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'sidebar' },
  },
} satisfies Meta<typeof TaxIdentifiersCard>

export default meta
type Story = StoryObj<typeof meta>

export const Identifiers: Story = {}

export const Refused: Story = {
  name: 'Refused, on the field',
  args: {
    mutations: {
      create: fn(() => Promise.reject(formatRefused)),
      update: fn(saved),
      remove: fn(saved),
      validate: fn(saved),
    },
  },
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'sidebar', capture: 'viewport' },
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add registration' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add tax registration' })
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Kind' }))
    await userEvent.click(await screen.findByRole('option', { name: 'EU VAT' }))
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Number' }), 'DE12345')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    // The code's generic text, not the server's wording (SD-46).
    await within(sheet).findByText('is invalid')
    // Focus stays on Save or leaves it depending on how fast the refusal comes back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
