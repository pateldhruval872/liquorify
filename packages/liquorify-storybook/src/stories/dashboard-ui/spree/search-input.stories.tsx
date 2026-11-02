import { SearchInput } from '@spree/dashboard-ui/spree/search-input'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent } from 'storybook/test'

// The settings menu's search box, as wide as it is in the settings rail.
function Search({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="w-56">
      <SearchInput
        value={value}
        onValueChange={setValue}
        placeholder="Search settings"
        aria-label="Search settings"
        clearLabel="Clear"
        className="h-8 text-sm in-data-[mobile=true]:h-11 in-data-[mobile=true]:text-base"
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Search input',
  tags: ['CMP-DUI-C-47'],
  // The search box of the settings menu, and of the pickers.
  render: () => <Search />,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// Once there is something to clear, the clear button appears.
export const WithAQuery: Story = { name: 'With a query', render: () => <Search initial="tax" /> }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
