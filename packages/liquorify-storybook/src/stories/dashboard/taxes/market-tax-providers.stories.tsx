import type { Market, PermissionRule } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import {
  TaxProviderSummary,
  TaxRatesUsageNote,
} from '../../../../../dashboard/src/components/spree/taxes/market-tax-providers'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import {
  connectedEngine,
  internalTaxProvider,
  markets,
  orderManagerRules,
} from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { marketsAllOnEngine, marketsWithOneEngine } from '../../../fixtures/admin/taxes'
import { marketList, taxProviderList } from '../../../mocks/handlers/admin/settings'

const ratesPage: StoryRoute = {
  pattern: '/$storeId/settings/taxes/rates',
  path: `/${shellStore.id}/settings/taxes/rates`,
}

/** The store's markets and the engines they may use, on the taxes layout's rates tab. */
function taxParameters(records: Market[], rules?: PermissionRule[]) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: { ...base.liquorify, route: ratesPage, column: 'settings' },
    msw: {
      handlers: {
        ...base.msw.handlers,
        taxProviders: taxProviderList([internalTaxProvider, connectedEngine]),
        markets: marketList(records),
      },
    },
  }
}

/**
 * The taxes layout's summary of which engine each market uses, above the
 * tabs (DA-SET-13 to DA-SET-15), and the note on the rates tab (DA-SET-14)
 * naming the markets that ignore the store's rates.
 */
const meta = {
  title: 'Admin dashboard/Taxes/Market tax providers',
  component: TaxProviderSummary,
  tags: ['CMP-DA-G-22'],
  parameters: taxParameters(markets),
} satisfies Meta<typeof TaxProviderSummary>

export default meta
type Story = StoryObj<typeof meta>

// Every market on Spree's own rates, as the browser-test server has it.
export const SpreeRatesEverywhere: Story = {
  name: "Spree's rates everywhere",
  play: async () => {
    await screen.findByText(/Spree tax rates in North America/)
  },
}

// One market works tax out with an external engine.
export const OneMarketOnEngine: Story = {
  name: 'One market on an engine',
  parameters: taxParameters(marketsWithOneEngine),
  play: async () => {
    await screen.findByText('Sample tax engine in Europe')
  },
}

// A staffer who cannot read markets sees no summary.
export const MarketsUnreadable: Story = {
  name: 'Markets unreadable',
  parameters: taxParameters(markets, orderManagerRules),
}

// With no external engine in use the rates apply everywhere, and no note shows.
export const NoteNotNeeded: Story = {
  name: 'Note, not needed',
  render: () => <TaxRatesUsageNote />,
}

export const NoteForOneMarket: Story = {
  name: 'Note, one market',
  render: () => <TaxRatesUsageNote />,
  parameters: taxParameters(marketsWithOneEngine),
  play: async () => {
    await screen.findByText(/These rates are not used in Europe \(Sample tax engine\)/)
  },
}

export const NoteForEveryMarket: Story = {
  name: 'Note, every market',
  render: () => <TaxRatesUsageNote />,
  parameters: taxParameters(marketsAllOnEngine),
  play: async () => {
    await screen.findByText(/None of your markets use these rates/)
  },
}
