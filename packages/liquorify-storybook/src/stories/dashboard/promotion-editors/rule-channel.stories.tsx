import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { ChannelRuleEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/rule-channel'
import { withStore } from '../../../decorators/store'
import { springRules } from '../../../fixtures/admin/loyalty'
import { channels } from '../../../fixtures/admin/settings'
import { editorSheetParameters, RuleSheet } from './editor-sheet'

const [channelRule] = springRules
const [online, wholesale] = channels

/** The channel rule's editor (DA-PRM-02, DA-PRM-03): the sales channels an order must come through. */
const meta = {
  title: 'Admin dashboard/Promotion editors/Channel rule editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <RuleSheet editor={ChannelRuleEditor} rule={channelRule} type="channel" {...args} />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const Saved: Story = {
  play: async () => {
    await screen.findByText(online.name)
  },
}

export const NewRule: Story = {
  name: 'New rule',
  render: (args) => <RuleSheet editor={ChannelRuleEditor} type="channel" {...args} />,
  play: async () => {
    await screen.findByText('Channels')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Choosing: Story = {
  play: async () => {
    await screen.findByText(online.name)
    await userEvent.type(screen.getByRole('combobox'), 'whole')
    await screen.findByRole('option', { name: wholesale.name })
  },
}

export const SavingChoice: Story = {
  name: 'Saving a choice',
  play: async ({ args }) => {
    await screen.findByText(online.name)
    await userEvent.type(screen.getByRole('combobox'), 'whole')
    await userEvent.click(await screen.findByRole('option', { name: wholesale.name }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          channel_ids: expect.arrayContaining([online.id, wholesale.id]),
        }),
      }),
    )
  },
}
