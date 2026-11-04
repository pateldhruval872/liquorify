import { typeLabel } from '@spree/dashboard-core'
import { CalculatorSummary } from '@spree/dashboard-ui/spree/calculator-summary'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen } from 'storybook/test'
import {
  itemAdjustmentCalculators,
  orderAdjustmentCalculators,
} from '../../../fixtures/admin/loyalty'

/** A calculator Spree offers, with its catalog label and schema, holding these preferences. */
function calculator(
  type: string,
  preferences: Record<string, unknown>,
  catalog = orderAdjustmentCalculators,
) {
  const entry = catalog.find((each) => each.type === type)
  return { type, label: entry?.label, schema: entry?.schema, preferences }
}

/**
 * As the promotion page's action row renders it: the dashboard's own name for
 * the calculator, falling back to the catalog's, and the catalog's schema.
 */
const asThePageNamesIt: Meta<typeof CalculatorSummary>['render'] = (args) => (
  <CalculatorSummary
    {...args}
    calculator={
      args.calculator?.type
        ? {
            ...args.calculator,
            label: typeLabel('calculator', args.calculator.type, args.calculator.label),
          }
        : args.calculator
    }
  />
)

/**
 * The one-line summary of a promotion action's calculator, under the action's
 * name on the promotion page (DA-PRM-02, DA-PRM-03). Each story holds one of
 * the calculators Spree offers an order or item adjustment, with the
 * preferences the browser-test server saved for it.
 */
const meta = {
  title: 'Dashboard UI/Composed/Calculator summary',
  component: CalculatorSummary,
  tags: ['CMP-DUI-C-07'],
  args: { calculator: calculator('flat_percent_item_total', { flat_percent: '10.0' }) },
  render: asThePageNamesIt,
  decorators: [
    (Story) => (
      <div className="text-xs text-muted-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CalculatorSummary>

export default meta
type Story = StoryObj<typeof meta>

export const FlatPercent: Story = {
  name: 'Flat percent',
  play: async () => {
    await expect(await screen.findByText('Flat Percent · 10.0%')).toBeInTheDocument()
  },
}

export const FlatRate: Story = {
  name: 'Flat rate',
  args: {
    calculator: calculator('flat_rate', {
      amount: '5.00',
      currency: 'USD',
      apply_only_on_full_priced_items: false,
    }),
  },
  play: async () => {
    await expect(await screen.findByText('Flat Rate · $5.00')).toBeInTheDocument()
  },
}

export const FullPricedItemsOnly: Story = {
  name: 'Flat rate, on full-priced items only',
  args: {
    calculator: calculator('flat_rate', {
      amount: '5.00',
      currency: 'USD',
      apply_only_on_full_priced_items: true,
    }),
  },
  play: async () => {
    await screen.findByText('Flat Rate · $5.00, Apply only on full priced items')
  },
}

export const FlexibleRate: Story = {
  name: 'Flexible rate',
  args: {
    calculator: calculator('flexi_rate', {
      first_item: '10.00',
      additional_item: '5.00',
      max_items: 3,
      currency: 'USD',
      apply_only_on_full_priced_items: false,
    }),
  },
  play: async () => {
    await screen.findByText('Flexi Rate · $10.00, $5.00, Max items: 3')
  },
}

export const TieredFlatRate: Story = {
  name: 'Tiered flat rate',
  args: {
    calculator: calculator('tiered_flat_rate', {
      tiers: [
        { threshold: '50.0', value: '5.0' },
        { threshold: '150.0', value: '20.0' },
      ],
      base_amount: '0.00',
      currency: 'USD',
    }),
  },
  play: async () => {
    await screen.findByText('Tiered Flat Rate · Tiers: 2, $0.00')
  },
}

export const TieredPercent: Story = {
  name: 'Tiered percent',
  args: {
    calculator: calculator('tiered_percent', {
      tiers: [
        { threshold: '100.0', value: '10.0' },
        { threshold: '250.0', value: '15.0' },
      ],
      base_percent: '5.0',
    }),
  },
  play: async () => {
    await screen.findByText('Tiered Percent · Tiers: 2, 5.0%')
  },
}

export const PercentPerItem: Story = {
  name: 'Percent per item',
  args: {
    calculator: calculator(
      'percent_on_line_item',
      { percent: '15.0', apply_only_on_full_priced_items: false },
      itemAdjustmentCalculators,
    ),
  },
  play: async () => {
    await screen.findByText('Percent Per Line Item · 15.0%')
  },
}

export const InEuros: Story = {
  name: 'An amount in euros',
  args: {
    calculator: calculator('flat_rate', {
      amount: '4.50',
      currency: 'EUR',
      apply_only_on_full_priced_items: false,
    }),
  },
  play: async () => {
    await screen.findByText('Flat Rate · €4.50')
  },
}

export const NoSettingsYet: Story = {
  name: 'No settings yet',
  args: { calculator: { type: 'flat_rate', label: 'Flat Rate', schema: null, preferences: null } },
  play: async () => {
    await screen.findByText('Flat Rate')
  },
}

/** The component on its own: with no name given, it names the calculator from its class. */
export const NameFromItsType: Story = {
  name: 'Named from its type',
  render: (args) => <CalculatorSummary {...args} />,
  args: { calculator: { type: 'Spree::Calculator::FlatRate', preferences: null } },
  play: async () => {
    await screen.findByText('FlatRate')
  },
}

export const NoCalculator: Story = {
  name: 'No calculator chosen',
  args: { calculator: null, fallback: 'No calculator' },
  play: async () => {
    await screen.findByText('No calculator')
  },
}
