import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { CompanyAddressSheet } from '../../../../../dashboard/src/components/spree/company-address-sheet'
import { withStore } from '../../../decorators/store'
import { headOffice, tradeGroup } from '../../../fixtures/admin/companies'
import { companyParameters } from './company-page'

/**
 * Adds an entry to a company's address book, or edits one (DA-CUS-05's
 * address book). The address is the company's, so no contact name is asked
 * for, the company line is fixed, and a new entry starts as both defaults.
 */
const meta = {
  title: 'Admin dashboard/Companies/Company address sheet',
  component: CompanyAddressSheet,
  tags: ['CMP-DA-G-24'],
  args: {
    companyId: tradeGroup.id,
    companyName: tradeGroup.name,
    open: true,
    onOpenChange: fn(),
  },
  decorators: [withStore],
  parameters: companyParameters({ viewport: true }),
} satisfies Meta<typeof CompanyAddressSheet>

export default meta
type Story = StoryObj<typeof meta>

const form = () => screen.findByRole('dialog')

export const Add: Story = {
  name: 'New address',
  play: async () => {
    const dialog = await form()
    await within(dialog).findByDisplayValue(tradeGroup.name)
  },
}

export const Edit: Story = {
  name: 'Edit address',
  args: { entry: headOffice },
  play: async () => {
    const dialog = await form()
    await within(dialog).findByDisplayValue(headOffice.address1 ?? '')
  },
}

// The sheet asks for the state itself, before Spree's own refusal is reached.
export const StateMissing: Story = {
  name: 'State missing',
  parameters: companyParameters({ viewport: true }),
  play: async () => {
    const dialog = await form()
    const field = (id: string) => dialog.querySelector(`#${id}`) as HTMLInputElement
    await userEvent.type(field('addr-a1'), '18 Pier Road')
    await userEvent.type(field('addr-city'), 'Tacoma')
    await userEvent.type(field('addr-zip'), '98402')
    await userEvent.click(within(dialog).getByRole('button', { name: /^save$/i }))
    await expect(
      await within(dialog).findByText(/state \/ province/i, {
        selector: '[data-slot="field-error"], [data-slot="field-error"] *',
      }),
    ).toBeVisible()
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
