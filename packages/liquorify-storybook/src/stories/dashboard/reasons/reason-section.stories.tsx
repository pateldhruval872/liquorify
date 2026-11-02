import type { PermissionRule } from '@spree/admin-sdk'
import { Subject } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { ReasonSection } from '../../../../../dashboard/src/components/spree/reasons/reason-section'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  cancellationReasons,
  claimReasons,
  connectedEngine,
  exemptionReasons,
  internalTaxProvider,
  markets,
  refundReasons,
  returnReasons,
  settingsViewerRules,
} from '../../../fixtures/admin/settings'
import {
  marketList,
  reasonRequests,
  reasonsFailed,
  reasonsHeld,
  taxProviderList,
} from '../../../mocks/handlers/admin/settings'

/**
 * One kind's list on a settings page, signed in with the given rules, with
 * the tax engines and markets a code is chosen from. A story that opens a
 * sheet is captured as the window, since the sheet renders outside its root.
 */
function reasonParameters(
  handlers: Record<string, unknown>,
  { rules, sheet = false }: { rules?: PermissionRule[]; sheet?: boolean } = {},
) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: { ...base.liquorify, column: 'settings', ...(sheet && { capture: 'viewport' }) },
    msw: {
      handlers: {
        ...base.msw.handlers,
        taxProviders: taxProviderList(),
        markets: marketList(),
        ...handlers,
      },
    },
  }
}

const returns = { reasons: reasonRequests('return-reasons', returnReasons) }

// The return reasons card of the reasons page (DA-SET-21).
const meta = {
  title: 'Admin dashboard/Reasons/Reason section',
  component: ReasonSection,
  tags: ['CMP-DA-G-16'],
  args: {
    kind: 'return-reasons',
    subject: Subject.ReturnReason,
    titleKey: 'admin.reasons.return.title',
    helpKey: 'admin.reasons.return.help',
  },
  decorators: [withStore],
  parameters: reasonParameters(returns),
} satisfies Meta<typeof ReasonSection>

export default meta
type Story = StoryObj<typeof meta>

const rowMenu = async (name: string) => {
  const row = (await screen.findByText(name)).closest('tr') as HTMLElement
  await userEvent.click(await within(row).findByRole('button', { name: 'Open actions' }))
}

// One reason in use, which cannot be deleted, and one retired.
export const ReturnReasons: Story = {
  name: 'Return reasons',
  play: async () => {
    await screen.findByText('Damaged/Defective')
  },
}

export const ClaimReasons: Story = {
  name: 'Claim reasons',
  args: {
    kind: 'claim-reasons',
    subject: Subject.ClaimReason,
    titleKey: 'admin.reasons.claim.title',
    helpKey: 'admin.reasons.claim.help',
  },
  parameters: reasonParameters({ reasons: reasonRequests('claim-reasons', claimReasons) }),
}

export const RefundReasons: Story = {
  name: 'Refund reasons',
  args: {
    kind: 'refund-reasons',
    subject: Subject.RefundReason,
    titleKey: 'admin.reasons.refund.title',
    helpKey: 'admin.reasons.refund.help',
  },
  parameters: reasonParameters({ reasons: reasonRequests('refund-reasons', refundReasons) }),
}

export const CancellationReasons: Story = {
  name: 'Cancellation reasons',
  args: {
    kind: 'order-cancellation-reasons',
    subject: Subject.OrderCancellationReason,
    titleKey: 'admin.reasons.order_cancellation.title',
    helpKey: 'admin.reasons.order_cancellation.help',
  },
  parameters: reasonParameters({
    reasons: reasonRequests('order-cancellation-reasons', cancellationReasons),
  }),
}

export const None: Story = {
  parameters: reasonParameters({ reasons: reasonRequests('return-reasons', []) }),
  play: async () => {
    await screen.findByText('No reasons yet')
  },
}

export const Loading: Story = {
  parameters: reasonParameters({ reasons: reasonsHeld('return-reasons') }),
}

export const Failed: Story = {
  parameters: reasonParameters({ reasons: reasonsFailed('return-reasons') }),
  play: async () => {
    await screen.findByText('Failed to load', undefined, { timeout: 15_000 })
  },
}

export const Add: Story = {
  parameters: reasonParameters(returns, { sheet: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add reason' }))
    await screen.findByRole('heading', { name: 'Add reason' })
  },
}

export const NameRequired: Story = {
  name: 'Name required',
  parameters: reasonParameters(returns, { sheet: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add reason' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Create' }))
    await screen.findByText(/required/i)
  },
}

export const Edit: Story = {
  parameters: reasonParameters(returns, { sheet: true }),
  play: async () => {
    await rowMenu('Better price available')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    await screen.findByDisplayValue('Better price available')
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: reasonParameters(returns, { sheet: true }),
  play: async () => {
    await rowMenu('No longer needed/wanted')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByRole('heading', { name: 'Delete reason?' })
  },
}

// Read on settings and write on nothing: no add button, and no row actions.
export const SettingsViewer: Story = {
  name: 'Settings viewer',
  parameters: reasonParameters(returns, { rules: settingsViewerRules }),
  play: async () => {
    await screen.findByText('Damaged/Defective')
  },
}

const exemption = {
  kind: 'tax-exemption-reasons',
  subject: Subject.TaxExemptionReason,
  titleKey: 'admin.reasons.tax_exemption.title',
  helpKey: 'admin.reasons.tax_exemption.help',
  withCode: true,
} as const

// Tax exemption reasons (DA-SET-15) carry the code a tax engine receives.
export const ExemptionReasons: Story = {
  name: 'Tax exemption reasons',
  args: exemption,
  parameters: reasonParameters({
    reasons: reasonRequests('tax-exemption-reasons', exemptionReasons),
  }),
  play: async () => {
    await screen.findByText('AGRICULTURAL')
  },
}

// With Spree's own tax rates, the code is the merchant's own, typed in capitals.
export const ExemptionCodeTyped: Story = {
  name: 'Tax exemption, code typed',
  args: exemption,
  parameters: reasonParameters(
    { reasons: reasonRequests('tax-exemption-reasons', exemptionReasons) },
    { sheet: true },
  ),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add reason' }))
    await userEvent.type(await screen.findByLabelText('Code'), 'nonprofit')
    await screen.findByDisplayValue('NONPROFIT')
  },
}

// A market taxed by an engine with codes of its own: the code is picked from them.
export const ExemptionEngineCodes: Story = {
  name: 'Tax exemption, engine codes',
  args: exemption,
  parameters: reasonParameters(
    {
      reasons: reasonRequests('tax-exemption-reasons', exemptionReasons),
      taxProviders: taxProviderList([internalTaxProvider, connectedEngine]),
      markets: marketList([
        { ...markets[0], tax_provider: connectedEngine.id },
        ...markets.slice(1),
      ]),
    },
    { sheet: true },
  ),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add reason' }))
    await userEvent.click(await screen.findByRole('combobox', { name: 'Code' }))
    await screen.findByRole('option', { name: 'G — Resale' })
  },
}
