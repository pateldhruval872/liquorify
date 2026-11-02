import { TagCombobox } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { tagList } from '../../mocks/handlers/admin/catalog'

/**
 * The tags field on the product page (DA-PRD-02, DA-PRD-03) and in the
 * product list's "Add tags…" dialog. It offers the tags the store's products
 * already carry, and typing a new one offers to create it; Enter adds it.
 */
function TagsField({ chosen }: { chosen: string[] }) {
  const [value, setValue] = useState(chosen)
  return <TagCombobox taggableType="product" value={value} onChange={setValue} />
}

const meta = {
  title: 'Dashboard core/Tag combobox',
  component: TagsField,
  tags: ['CMP-CORE-38'],
  args: { chosen: [] },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'inSidebarCard', capture: 'viewport' },
    msw: { handlers: { ...storeParameters().msw.handlers, tags: tagList() } },
  },
} satisfies Meta<typeof TagsField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Chosen: Story = {
  args: { chosen: ['linen', 'kitchen'] },
}

export const Open: Story = {
  name: "The store's tags offered",
  args: { chosen: ['linen'] },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'gift idea' })
  },
}

export const NewTag: Story = {
  name: 'A new tag typed',
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('stoneware')
    await screen.findByRole('option', { name: 'Create "stoneware"' })
  },
}

export const NoTagsYet: Story = {
  name: 'No tags in the store yet',
  parameters: { msw: { handlers: { tags: tagList([]) } } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByText('Type and press Enter to create a tag')
  },
}
