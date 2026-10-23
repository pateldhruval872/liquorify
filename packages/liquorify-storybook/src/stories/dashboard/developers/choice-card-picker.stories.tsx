import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userEvent } from 'storybook/test'
import { ChoiceCardPicker } from '../../../../../dashboard/src/components/spree/choice-card-picker'

// The AI agents connect sheet's first step (DA-SET-07), worded as it is, at
// the width the sheet gives it.
function ClientChoice({ initial = 'claude' }: { initial?: string }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initial)
  return (
    <div className="w-[542px]">
      <ChoiceCardPicker
        options={[
          { value: 'claude', label: 'Claude', description: t('admin.mcp_connect.clients.claude') },
          {
            value: 'chatgpt',
            label: 'ChatGPT',
            description: t('admin.mcp_connect.clients.chatgpt'),
          },
          {
            value: 'other',
            label: t('admin.mcp_connect.other_title'),
            description: t('admin.mcp_connect.other_help'),
          },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/AI agents/Choice card picker',
  component: ClientChoice,
  tags: ['CMP-DA-G-24'],
} satisfies Meta<typeof ClientChoice>

export default meta
type Story = StoryObj<typeof meta>

export const FirstChosen: Story = { name: 'First chosen' }

export const LastChosen: Story = { name: 'Last chosen', args: { initial: 'other' } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
