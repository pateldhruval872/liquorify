import type { OptionValue } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { OptionValueRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-option-value'
import { withStore } from '../../../decorators/store'
import { sizeOption } from '../../../fixtures/admin/catalog'
import { summerRules } from '../../../fixtures/admin/loyalty'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [optionValueRule] = summerRules
const [, medium] = sizeOption.option_values as OptionValue[]

/**
 * The option value rule's editor (DA-PRM-02, DA-PRM-03): the option values an
 * order's products must carry, each shown with its option, from every option
 * the store has.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Option value rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet
      editor={OptionValueRuleEditor}
      rule={optionValueRule}
      type="option_value"
      {...args}
    />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText('Color: Olive')
    await screen.findByText('Color: Slate')
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={OptionValueRuleEditor} type="option_value" {...args} />,
  play: async () => {
    await screen.findByText('Option values')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText('Color: Olive')
    await userEvent.type(screen.getByRole('combobox'), 'size')
    await screen.findByRole('option', { name: 'Size: M' })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('Color: Olive')
    await userEvent.type(screen.getByRole('combobox'), 'size')
    await userEvent.click(await screen.findByRole('option', { name: 'Size: M' }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          eligible_values: expect.arrayContaining([medium.id]),
        }),
      }),
    )
  },
}
