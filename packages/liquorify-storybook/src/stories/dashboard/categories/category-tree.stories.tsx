import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { CategoryTree } from '../../../../../dashboard/src/components/spree/categories/category-tree'
import { storeParameters, withStore } from '../../../decorators/store'
import { categoryTree } from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'

/**
 * The categories page's tree (DA-PRD-07): each root with its children folded
 * away until opened, each row dragged by its handle to a new place or parent,
 * and a menu to edit, translate or delete.
 */
const meta = {
  title: 'Admin dashboard/Categories/Category tree',
  component: CategoryTree,
  tags: ['CMP-DA-G-03'],
  args: {
    categories: categoryTree,
    onEdit: fn(),
    onTranslate: fn(),
    onDelete: fn(),
    onReorder: fn(),
  },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'page' },
  },
} satisfies Meta<typeof CategoryTree>

export default meta
type Story = StoryObj<typeof meta>

const menuParameters = {
  ...storeParameters(),
  liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
}

export const Collapsed: Story = {
  play: async () => {
    await screen.findByText('Kitchen')
    await expect(screen.queryByText('Mugs')).toBeNull()
  },
}

export const Expanded: Story = {
  play: async () => {
    for (const toggle of await screen.findAllByRole('button', { name: 'Expand' }))
      await userEvent.click(toggle)
    // Hats, opened in turn, shows its own child.
    await userEvent.click(await screen.findByRole('button', { name: 'Expand' }))
    await screen.findByText('Winter')
    await screen.findByText('Teaware')
  },
}

export const Empty: Story = {
  args: { categories: [] },
  play: async () => {
    await screen.findByText('No categories yet.')
  },
}

export const RowMenu: Story = {
  name: 'Row menu',
  parameters: menuParameters,
  play: async () => {
    const row = (await screen.findByText('Kitchen')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
    await screen.findByRole('menuitem', { name: 'Manage translations' })
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

// A teammate who may not delete categories is not offered Delete.
export const RowMenuWithoutDelete: Story = {
  name: 'Row menu, without delete',
  parameters: {
    ...storeParameters(undefined, readOnly),
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    const row = (await screen.findByText('Kitchen')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
    await screen.findByRole('menuitem', { name: 'Edit' })
    await expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull()
  },
}

// While one category is being deleted, Delete waits.
export const Deleting: Story = {
  args: { deleting: true },
  parameters: menuParameters,
  play: async () => {
    const row = (await screen.findByText('Kitchen')).closest('tr') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
    await expect(await screen.findByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

export const Editing: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Guides' }))
    await expect(args.onEdit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Guides' }))
  },
}

// Moved down one place with the keyboard, under the same parent.
export const Reordering: Story = {
  play: async ({ args }) => {
    const [first] = await screen.findAllByRole('button', { name: 'Drag to reorder' })
    first.focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(' ')
    await expect(args.onReorder).toHaveBeenCalled()
  },
}
