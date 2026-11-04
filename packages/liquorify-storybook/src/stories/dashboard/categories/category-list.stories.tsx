import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { CategoryList } from '../../../../../dashboard/src/components/spree/categories/category-list'
import { storeParameters, withStore } from '../../../decorators/store'
import { categoryTree } from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'

/**
 * The categories page while searching (DA-PRD-07): the tree gives way to a
 * flat list of matches, each named with its place in the tree.
 */
const meta = {
  title: 'Admin dashboard/Categories/Category list',
  component: CategoryList,
  tags: ['CMP-DA-G-03'],
  args: {
    categories: categoryTree.filter((category) => category.pretty_name.includes('Kitchen')),
    onEdit: fn(),
    onTranslate: fn(),
    onDelete: fn(),
  },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'page' },
  },
} satisfies Meta<typeof CategoryList>

export default meta
type Story = StoryObj<typeof meta>

export const Matches: Story = {
  play: async () => {
    await screen.findByText('Kitchen -> Teaware')
  },
}

export const NoMatches: Story = {
  name: 'No matches',
  args: { categories: [] },
  play: async () => {
    await screen.findByText('No categories match your search.')
  },
}

export const RowMenu: Story = {
  name: 'Row menu',
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    const row = (await screen.findByText('Kitchen -> Mugs')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const RowMenuWithoutDelete: Story = {
  name: 'Row menu, without delete',
  parameters: {
    ...storeParameters(undefined, readOnly),
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    const row = (await screen.findByText('Kitchen -> Mugs')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
    await screen.findByRole('menuitem', { name: 'Edit' })
    await expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
  },
}
