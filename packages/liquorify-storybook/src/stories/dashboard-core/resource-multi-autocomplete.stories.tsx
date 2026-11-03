import { ResourceMultiAutocomplete } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http } from 'msw'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { categoryAutocompleteProps } from '../../../../dashboard-core/src/products/use-product-form-data'
import { storeParameters, withStore } from '../../decorators/store'
import { categories } from '../../fixtures/admin/catalog'
import { categoryList } from '../../mocks/handlers/admin/catalog'

/**
 * The product page's categories field (DA-PRD-02, DA-PRD-03) and the product
 * list's "Add to categories…" dialog: chosen categories are loaded by id to
 * show their names, typing searches by name, and the store's categories are
 * offered before anything is typed. How the chips and list look on their own
 * is the headless picker's stories (CMP-DUI-C-41).
 */
function CategoriesField({ chosen, offered }: { chosen: string[]; offered: boolean }) {
  const [value, setValue] = useState(chosen)
  return (
    <ResourceMultiAutocomplete
      {...categoryAutocompleteProps('story-category-picker')}
      initialItems={offered ? categories : undefined}
      value={value}
      onChange={setValue}
    />
  )
}

const held = [
  http.get('/api/v3/admin/categories', async () => {
    await delay('infinite')
  }),
]

const [kitchen, mugs] = categories
const typeInto = async (text: string) => {
  await userEvent.click(screen.getByRole('combobox'))
  await userEvent.keyboard(text)
}

const meta = {
  title: 'Dashboard core/Resource multi autocomplete',
  component: CategoriesField,
  tags: ['CMP-CORE-24'],
  args: { chosen: [], offered: false },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'inSidebarCard', capture: 'viewport' },
    msw: { handlers: { ...storeParameters().msw.handlers, categories: categoryList() } },
  },
} satisfies Meta<typeof CategoriesField>

export default meta
type Story = StoryObj<typeof meta>

export const ChosenNamesLoaded: Story = {
  name: 'Chosen, names loaded',
  args: { chosen: [kitchen.id, mugs.id] },
  play: async () => {
    await screen.findByText('Kitchen -> Mugs')
  },
}

export const LoadingChosenNames: Story = {
  name: 'Chosen, names loading',
  args: { chosen: [kitchen.id, mugs.id] },
  parameters: { msw: { handlers: { categories: held } } },
  play: async () => {
    await screen.findByText(mugs.id)
  },
}

export const Offered: Story = {
  name: "The store's categories offered",
  args: { offered: true },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'Guides' })
  },
}

export const Found: Story = {
  name: 'Found by name',
  play: async () => {
    await typeInto('mug')
    await screen.findByRole('option', { name: 'Kitchen -> Mugs' })
  },
}

export const Searching: Story = {
  parameters: { msw: { handlers: { categories: held } } },
  play: async () => {
    await typeInto('mug')
    await screen.findByText('Searching…')
  },
}

export const NoMatch: Story = {
  name: 'No match',
  play: async () => {
    await typeInto('candles')
    await screen.findByText('No results')
  },
}
