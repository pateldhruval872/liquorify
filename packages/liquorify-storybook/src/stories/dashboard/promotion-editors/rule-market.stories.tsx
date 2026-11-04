import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { MarketRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-market'
import { withStore } from '../../../decorators/store'
import { springRules } from '../../../fixtures/admin/loyalty'
import { markets } from '../../../fixtures/admin/settings'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [, marketRule] = springRules
const [northAmerica, europe] = markets

/** The market rule's editor (DA-PRM-02, DA-PRM-03): the markets an order must be placed in. */
const meta = {
  title: 'Admin dashboard/Promotion editors/Market rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={MarketRuleEditor} rule={marketRule} type="market" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(northAmerica.name)
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={MarketRuleEditor} type="market" {...args} />,
  play: async () => {
    await screen.findByText('Markets')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText(northAmerica.name)
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: europe.name })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText(northAmerica.name)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: europe.name }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          market_ids: expect.arrayContaining([northAmerica.id, europe.id]),
        }),
      }),
    )
  },
}
