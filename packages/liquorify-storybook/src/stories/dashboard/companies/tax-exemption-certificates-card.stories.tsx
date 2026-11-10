import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import { TaxExemptionCertificatesCard } from '../../../../../dashboard/src/components/spree/tax-exemption-certificates-card'
import { withStore } from '../../../decorators/store'
import {
  pendingCertificate,
  tradeGroup,
  verifiedCertificate,
} from '../../../fixtures/admin/companies'
import { certificateRequests, certificatesHeld } from '../../../mocks/handlers/admin/companies'
import { companyParameters } from './company-page'

/**
 * A company's tax exemption certificates (DA-CUS-05's main column, CAP-09-01),
 * which the store accepts or revokes. Spree's own tax engine leaves a taxed
 * line untaxed for a company whose accepted certificate covers the place it
 * ships to. Nothing writes the Expired status, so the expired certificate is
 * shown here only; a certificate past its date reads Lapsed.
 */
const meta = {
  title: 'Admin dashboard/Companies/Tax exemption certificates card',
  component: TaxExemptionCertificatesCard,
  tags: ['CMP-DA-G-24'],
  args: { companyId: tradeGroup.id, canEdit: true },
  decorators: [withStore],
  parameters: companyParameters({ column: 'main' }),
} satisfies Meta<typeof TaxExemptionCertificatesCard>

export default meta
type Story = StoryObj<typeof meta>

async function openMenu(number: string) {
  const row = (await screen.findByText(number)).closest('[role="listitem"]') as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

async function openAddSheet() {
  await userEvent.click(await screen.findByRole('button', { name: 'Add certificate' }))
  return screen.findByRole('dialog', { name: 'Add exemption certificate' })
}

export const EachStatus: Story = { name: 'Each status' }

export const None: Story = {
  name: 'None on file',
  parameters: companyParameters({ column: 'main', first: certificateRequests([]) }),
}

export const Loading: Story = {
  parameters: companyParameters({ column: 'main', first: certificatesHeld }),
  play: async () => {
    await screen.findByText('Loading…')
  },
}

// A role that may read customers but not change them.
export const ReadOnly: Story = {
  name: 'Read-only',
  args: { canEdit: false },
  play: async () => {
    await screen.findByText(pendingCertificate.certificate_number)
    await expect(screen.queryByRole('button', { name: 'Add certificate' })).not.toBeInTheDocument()
  },
}

export const PendingMenu: Story = {
  name: 'Menu on a certificate awaiting review',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openMenu(pendingCertificate.certificate_number)
    await within(menu).findByRole('menuitem', { name: 'Accept' })
    await within(menu).findByRole('menuitem', { name: 'Download document' })
  },
}

export const AcceptedMenu: Story = {
  name: 'Menu on an accepted certificate',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openMenu(verifiedCertificate.certificate_number)
    await within(menu).findByRole('menuitem', { name: 'Revoke' })
    await expect(within(menu).queryByRole('menuitem', { name: 'Accept' })).not.toBeInTheDocument()
  },
}

export const RevokeConfirm: Story = {
  name: 'Revoke confirmation',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openMenu(verifiedCertificate.certificate_number)
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Revoke' }))
    await screen.findByRole('dialog', { name: 'Revoke this certificate?' })
  },
}

export const DeleteConfirm: Story = {
  name: 'Delete confirmation',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const menu = await openMenu(pendingCertificate.certificate_number)
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByRole('dialog', { name: 'Delete this certificate?' })
  },
}

export const AddSheet: Story = {
  name: 'Add sheet',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const sheet = await openAddSheet()
    await within(sheet).findByText('Certificate number')
  },
}

// Only the reasons the store still offers: Manufacturing is switched off.
export const ReasonsListed: Story = {
  name: 'Reasons listed',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Reason' }))
    await screen.findByRole('option', { name: 'Resale' })
    await expect(screen.queryByRole('option', { name: 'Manufacturing' })).not.toBeInTheDocument()
  },
}

export const Required: Story = {
  name: 'Nothing entered',
  parameters: companyParameters({ column: 'main', viewport: true }),
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Create' }))
    await within(sheet).findAllByText(/required/i)
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
