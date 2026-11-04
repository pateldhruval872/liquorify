import type { PromotionAction } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { AdjustmentActionEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/action-adjustment'
import { withStore } from '../../../decorators/store'
import {
  autumnActions,
  bulkActions,
  loyalActions,
  springActions,
  summerActions,
  winterActions,
} from '../../../fixtures/admin/loyalty'
import { calculatorsHeld, promotionRequests } from '../../../mocks/handlers/admin/loyalty'
import { ActionSheet, editorSheetParameters } from './editor-sheet'

const [flatPercent] = autumnActions
const [, flatRate] = winterActions
const [flexibleRate] = summerActions
const [tieredFlatRate, itemFlexibleRate] = bulkActions
const [tieredPercent, itemFlatRate] = springActions
const [itemPercent] = loyalActions

function editing(action: PromotionAction) {
  return {
    render: (args: { onSave: () => void; onClose: () => void }) => (
      <ActionSheet editor={AdjustmentActionEditor} action={action} type={action.type} {...args} />
    ),
  }
}

/**
 * The editor for the whole-order and per-item adjustment actions (DA-PRM-02,
 * DA-PRM-03): the calculator, chosen from those Spree lists for the action,
 * and that calculator's settings, with tiers for the tiered ones. Choosing
 * another calculator starts its settings again from their defaults.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Adjustment action editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  ...editing(flatPercent),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const FlatPercent: Story = {
  name: 'Flat percent of the order',
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox')).toHaveTextContent('Flat Percent')
    await expect(screen.getByLabelText('Flat Percent')).toHaveValue(10)
  },
}

export const FlatRate: Story = {
  name: 'Flat rate off the order',
  ...editing(flatRate),
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'Flat Rate',
    )
  },
}

export const FlexibleRate: Story = {
  name: 'Flexible rate off the order',
  ...editing(flexibleRate),
  play: async () => {
    await screen.findByText('Calculator settings')
    await screen.findByText('First Item Cost')
    await screen.findByText('Max Items')
  },
}

export const TieredFlatRate: Story = {
  name: 'Tiered flat rate off the order',
  ...editing(tieredFlatRate),
  play: async () => {
    await screen.findByText('Tiers')
    await expect(screen.getAllByLabelText('Order total ≥')).toHaveLength(2)
  },
}

export const TieredPercent: Story = {
  name: 'Tiered percent off the order',
  ...editing(tieredPercent),
  play: async () => {
    await screen.findByText('Base Percent')
    await expect(screen.getAllByLabelText('Order total ≥')).toHaveLength(2)
  },
}

export const ItemFlatRate: Story = {
  name: 'Flat rate off each item',
  ...editing(itemFlatRate),
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'Flat Rate',
    )
  },
}

export const ItemPercent: Story = {
  name: 'Percent off each item',
  ...editing(itemPercent),
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'Percent Per Line Item',
    )
  },
}

export const ItemFlexibleRate: Story = {
  name: 'Flexible rate off each item',
  ...editing(itemFlexibleRate),
  play: async () => {
    await screen.findByText('Additional Item Cost')
  },
}

export const NewOrderAction: Story = {
  name: 'New whole-order action',
  render: (args) => (
    <ActionSheet editor={AdjustmentActionEditor} type="create_adjustment" {...args} />
  ),
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'Flat Percent',
    )
  },
}

export const NewItemAction: Story = {
  name: 'New per-item action',
  render: (args) => (
    <ActionSheet editor={AdjustmentActionEditor} type="create_item_adjustments" {...args} />
  ),
  play: async () => {
    await screen.findByText('Calculator settings')
    await expect(screen.getByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'Flat Rate',
    )
  },
}

/**
 * Until the calculators arrive the calculator field is disabled and blank: its
 * Loading calculators… placeholder never shows, because the field draws its
 * value, empty for a new action, instead.
 */
export const LoadingCalculators: Story = {
  name: 'Loading the calculators',
  render: (args) => (
    <ActionSheet editor={AdjustmentActionEditor} type="create_adjustment" {...args} />
  ),
  parameters: editorSheetParameters({ promotions: [...calculatorsHeld, ...promotionRequests()] }),
  play: async () => {
    const field = await screen.findByRole('combobox', { name: 'Calculator' })
    await expect(field).toBeDisabled()
    await expect(field).toHaveTextContent(/^$/)
    await expect(screen.queryByText('Loading calculators…')).not.toBeInTheDocument()
  },
}

/** Until the calculators arrive, a saved action's calculator shows as its code. */
export const LoadingSavedCalculator: Story = {
  name: 'Loading the calculators, a saved action',
  parameters: editorSheetParameters({ promotions: [...calculatorsHeld, ...promotionRequests()] }),
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Calculator' })).toHaveTextContent(
      'flat_percent_item_total',
    )
  },
}

export const ChoosingCalculator: Story = {
  name: 'Choosing a calculator',
  play: async () => {
    await screen.findByText('Calculator settings')
    await userEvent.click(screen.getByRole('combobox', { name: 'Calculator' }))
    await screen.findByRole('option', { name: 'Tiered Percent' })
    await expect(screen.getAllByRole('option')).toHaveLength(5)
  },
}

export const ChangingCalculator: Story = {
  name: 'Another calculator, its settings from their defaults',
  play: async ({ args }) => {
    await screen.findByText('Calculator settings')
    await userEvent.click(screen.getByRole('combobox', { name: 'Calculator' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Flat Rate' }))
    await screen.findByText('Amount')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        calculator: expect.objectContaining({
          type: 'flat_rate',
          preferences: expect.not.objectContaining({ flat_percent: '10.0' }),
        }),
      }),
    )
  },
}

export const AddingTier: Story = {
  name: 'Adding a tier',
  ...editing(tieredPercent),
  play: async () => {
    await screen.findByText('Tiers')
    await userEvent.click(screen.getByRole('button', { name: 'Add tier' }))
    await waitFor(() => expect(screen.getAllByLabelText('Order total ≥')).toHaveLength(3))
  },
}

export const RemovingTier: Story = {
  name: 'Removing a tier',
  ...editing(tieredPercent),
  play: async ({ args }) => {
    await screen.findByText('Tiers')
    const [first] = screen.getAllByRole('button', { name: 'Remove tier' })
    await userEvent.click(first)
    await waitFor(() => expect(screen.getAllByLabelText('Order total ≥')).toHaveLength(1))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        calculator: expect.objectContaining({
          preferences: expect.objectContaining({
            tiers: [expect.objectContaining({ threshold: '250.0' })],
          }),
        }),
      }),
    )
  },
}

export const Saving: Story = {
  name: 'Saving the settings',
  play: async ({ args }) => {
    const percent = await screen.findByLabelText('Flat Percent')
    await userEvent.clear(percent)
    await userEvent.type(percent, '12.5')
    await userEvent.tab()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        calculator: expect.objectContaining({
          type: 'flat_percent_item_total',
          preferences: expect.objectContaining({ flat_percent: '12.5' }),
        }),
      }),
    )
  },
}
