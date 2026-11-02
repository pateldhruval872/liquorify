import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'
import { TaxProviderField } from '../../../../../dashboard/src/components/spree/tax-provider-field'
import { adminUser } from '../../../fixtures/admin/session'
import {
  connectedEngine,
  internalTaxProvider,
  unconnectedEngine,
} from '../../../fixtures/admin/settings'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { taxProviderList } from '../../../mocks/handlers/admin/settings'

/**
 * The field in the market sheet's form (DA-SET-11), at the form's width and
 * in the sheet's smaller text, holding the market's chosen engine.
 */
function MarketTaxProvider({ taxProvider = '' }: { taxProvider?: string }) {
  const form = useForm<{ tax_provider?: string }>({ defaultValues: { tax_provider: taxProvider } })
  return (
    <div className="w-[566px] text-sm">
      <TaxProviderField form={form} />
    </div>
  )
}

function parameters(providers = [internalTaxProvider, connectedEngine]) {
  return {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), taxProviders: taxProviderList(providers) } },
  }
}

const meta = {
  title: 'Admin dashboard/Markets/Tax provider field',
  component: MarketTaxProvider,
  tags: ['CMP-DA-G-24'],
  parameters: parameters(),
} satisfies Meta<typeof MarketTaxProvider>

export default meta
type Story = StoryObj<typeof meta>

// A market left on the store's default engine shows what that engine cannot do.
export const StoreDefault: Story = {
  name: 'Store default',
  play: async () => {
    await screen.findByText(/US local tax/)
  },
}

// The only engine Spree installs, as the browser-test server lists it, open.
export const SpreeRatesOnly: Story = {
  name: "Spree's rates only",
  parameters: { ...parameters([internalTaxProvider]), liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Spree tax rates' })
  },
}

export const EngineChosen: Story = {
  name: 'Engine chosen',
  args: { taxProvider: connectedEngine.id },
  play: async () => {
    await screen.findByText('Sample tax engine')
  },
}

// An engine whose credentials are not given yet is listed but cannot be chosen.
export const NotConnectedOpen: Story = {
  name: 'Engine not connected, open',
  parameters: {
    liquorify: { capture: 'viewport' },
    msw: { handlers: { taxProviders: taxProviderList([internalTaxProvider, unconnectedEngine]) } },
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Sample tax engine (not configured)' })
  },
}
