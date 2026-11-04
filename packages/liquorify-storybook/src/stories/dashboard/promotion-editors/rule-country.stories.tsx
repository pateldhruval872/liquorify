import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { CountryRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-country'
import { withStore } from '../../../decorators/store'
import { autumnRules } from '../../../fixtures/admin/loyalty'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [countryRule] = autumnRules

/**
 * The country rule's editor (DA-PRM-02, DA-PRM-03): the countries an order
 * must ship to, by their names in the dashboard's language.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Country rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={CountryRuleEditor} rule={countryRule} type="country" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText('Canada')
    await screen.findByText('United States')
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={CountryRuleEditor} type="country" {...args} />,
  play: async () => {
    await screen.findByText('Countries')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText('Canada')
    await userEvent.type(screen.getByRole('combobox'), 'ger')
    await screen.findByRole('option', { name: /Germany/ })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText('Canada')
    await userEvent.type(screen.getByRole('combobox'), 'ger')
    await userEvent.click(await screen.findByRole('option', { name: /Germany/ }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          country_codes: expect.arrayContaining(['US', 'CA', 'DE']),
        }),
      }),
    )
  },
}
