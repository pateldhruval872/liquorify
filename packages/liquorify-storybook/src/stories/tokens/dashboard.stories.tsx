import type { Meta, StoryObj } from '@storybook/react-vite'
import tokens from '../../../tokens/dashboard.tokens.json'
import { TokenTable } from './token-table'

const meta = {
  title: 'Tokens/Dashboard',
  component: TokenTable,
  tags: ['TK-DUI', 'TK-DUI-T', 'TK-DUI-A', 'TK-TW-D'],
  args: { document: tokens, idPattern: /^TK-DUI-\d+$/ },
} satisfies Meta<typeof TokenTable>

export default meta
type Story = StoryObj<typeof meta>

export const SemanticTokens: Story = { name: 'Semantic tokens' }

export const ThemeEntries: Story = { name: 'Theme entries', args: { idPattern: /^TK-DUI-T-/ } }

export const ColourUtilityAliases: Story = {
  name: 'Colour utility aliases',
  args: { idPattern: /^TK-DUI-A$/ },
}

export const TailwindPalette: Story = {
  name: 'Tailwind palette',
  args: { idPattern: /^TK-TW-D$/ },
}
