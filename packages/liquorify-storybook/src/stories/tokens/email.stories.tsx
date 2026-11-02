import type { Meta, StoryObj } from '@storybook/react-vite'
import tokens from '../../../tokens/email.tokens.json'
import { TokenTable } from './token-table'

const meta = {
  title: 'Tokens/Email branding',
  component: TokenTable,
  tags: ['TK-EM'],
  args: { document: tokens, idPattern: /^TK-EM-/, live: false },
} satisfies Meta<typeof TokenTable>

export default meta
type Story = StoryObj<typeof meta>

export const Defaults: Story = {}
