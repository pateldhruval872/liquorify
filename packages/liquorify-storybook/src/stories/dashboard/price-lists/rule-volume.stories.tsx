import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { VolumeRuleEditor } from '../../../../../dashboard/src/components/spree/price-list-editors/rule-volume'
import { withStore } from '../../../decorators/store'
import { tradeRules } from '../../../fixtures/admin/merchandising'
import { RuleSheet, ruleSheetParameters } from './rule-sheet'

const [volumeRule] = tradeRules

/**
 * The volume rule's editor (DA-PRD-17): the smallest quantity of one item
 * the list's prices need, and optionally the largest, minimum first.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Volume rule editor',
  tags: ['CMP-DA-G-13'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: ruleSheetParameters,
  render: (args) => (
    <RuleSheet editor={VolumeRuleEditor} rule={volumeRule} type="volume_rule" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

// Six or more, with no upper limit.
export const Saved: Story = {
  play: async () => {
    await expect(await screen.findByLabelText('Minimum quantity')).toHaveValue(6)
    await expect(screen.getByLabelText('Maximum quantity')).toHaveAttribute(
      'placeholder',
      'Unlimited',
    )
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={VolumeRuleEditor} type="volume_rule" {...args} />,
  play: async () => {
    await expect(await screen.findByLabelText('Minimum quantity')).toHaveValue(1)
  },
}

export const Range: Story = {
  render: (args) => (
    <RuleSheet
      editor={VolumeRuleEditor}
      rule={{ ...volumeRule, preferences: { min_quantity: 6, max_quantity: 23 } }}
      type="volume_rule"
      {...args}
    />
  ),
  play: async () => {
    await expect(await screen.findByLabelText('Maximum quantity')).toHaveValue(23)
  },
}

// A blank maximum is saved as no limit.
export const SavingChange: Story = {
  name: 'Saving a change',
  play: async ({ args }) => {
    const minimum = await screen.findByLabelText('Minimum quantity')
    await userEvent.clear(minimum)
    await userEvent.type(minimum, '12')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ preferences: { min_quantity: 12, max_quantity: null } }),
    )
    await expect(args.onClose).toHaveBeenCalled()
  },
}
