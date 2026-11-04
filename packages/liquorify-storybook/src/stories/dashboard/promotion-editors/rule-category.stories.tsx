import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { CategoryRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-category'
import { withStore } from '../../../decorators/store'
import { categories } from '../../../fixtures/admin/catalog'
import { winterRules } from '../../../fixtures/admin/loyalty'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [, categoryRule] = winterRules
const aprons = categories[3]

/**
 * The category rule's editor (DA-PRM-02, DA-PRM-03): whether the order must
 * hold a product in any or every chosen category, and the categories, shown by
 * their full path.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Category rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={CategoryRuleEditor} rule={categoryRule} type="category" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText('Kitchen -> Mugs')
    await expect(screen.getByRole('radio', { name: /Any of these categories/ })).toBeChecked()
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={CategoryRuleEditor} type="category" {...args} />,
  play: async () => {
    await screen.findByPlaceholderText('Search categories…')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Searching: Story = {
  play: async () => {
    await screen.findByText('Kitchen -> Mugs')
    await userEvent.type(screen.getByRole('combobox'), 'apr')
    await screen.findByRole('option', { name: aprons.pretty_name })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('Kitchen -> Mugs')
    await userEvent.type(screen.getByRole('combobox'), 'apr')
    await userEvent.click(await screen.findByRole('option', { name: aprons.pretty_name }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('radio', { name: /All of these categories/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({ match_policy: 'all' }),
        category_ids: expect.arrayContaining([aprons.id]),
      }),
    )
  },
}
