import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { CustomerGroupRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-customer-group'
import { withStore } from '../../../decorators/store'
import { loyalRules } from '../../../fixtures/admin/loyalty'
import { customerGroups } from '../../../fixtures/admin/merchandising'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [, groupRule] = loyalRules
const [wholesale, vip] = customerGroups

/** The customer group rule's editor (DA-PRM-02, DA-PRM-03): the groups whose shoppers qualify. */
const meta = {
  title: 'Admin dashboard/Promotion editors/Customer group rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={CustomerGroupRuleEditor} rule={groupRule} type="customer_group" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(wholesale.name)
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={CustomerGroupRuleEditor} type="customer_group" {...args} />,
  play: async () => {
    await screen.findByText('Customer groups')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText(wholesale.name)
    await userEvent.type(screen.getByRole('combobox'), 'vi')
    await screen.findByRole('option', { name: vip.name })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText(wholesale.name)
    await userEvent.type(screen.getByRole('combobox'), 'vi')
    await userEvent.click(await screen.findByRole('option', { name: vip.name }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          customer_group_ids: expect.arrayContaining([vip.id]),
        }),
      }),
    )
  },
}
