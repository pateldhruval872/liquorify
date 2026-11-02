import type { Category } from '@spree/admin-sdk'
import { ResourceMultiAutocomplete } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { categories } from '../../../fixtures/admin/catalog'

/**
 * A picker for several records at once, which shows the chosen ones as chips
 * and the matches for what was typed in a list beneath. It holds no data of
 * its own; the dashboard's version (CMP-CORE-24) searches and loads names
 * from the API. Here it is the product page's categories field, with the
 * store's categories as the matches.
 */
function CategoryPicker({ chosen, disabled }: { chosen: string[]; disabled?: boolean }) {
  const [value, setValue] = useState(chosen)
  const [input, setInput] = useState('')
  const byId = new Map(categories.map((category) => [category.id, category]))
  return (
    <ResourceMultiAutocomplete<Category>
      value={value}
      onChange={setValue}
      items={categories.filter((category) =>
        category.pretty_name?.toLowerCase().includes(input.trim().toLowerCase()),
      )}
      selectedOptions={value.map((id) => byId.get(id) ?? ({ id } as Category))}
      inputValue={input}
      onInputChange={setInput}
      getOptionLabel={(category) => category.pretty_name ?? category.name}
      disabled={disabled}
    />
  )
}

const [kitchen, mugs, apparel, aprons] = categories

const meta = {
  title: 'Dashboard UI/Composed/Resource multi autocomplete',
  component: CategoryPicker,
  tags: ['CMP-DUI-C-41'],
  args: { chosen: [] },
  parameters: { liquorify: { column: 'inSidebarCard' } },
} satisfies Meta<typeof CategoryPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Chosen: Story = {
  args: { chosen: [kitchen.id, mugs.id] },
}

export const ManyChosen: Story = {
  name: 'Many chosen',
  args: { chosen: [kitchen.id, mugs.id, apparel.id, aprons.id] },
}

export const Open: Story = {
  parameters: { liquorify: { column: 'inSidebarCard', capture: 'viewport' } },
  args: { chosen: [mugs.id] },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'Apparel -> Aprons' })
  },
}

export const Disabled: Story = {
  args: { chosen: [kitchen.id, mugs.id], disabled: true },
}
