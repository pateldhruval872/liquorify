import type { Category } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, within } from 'storybook/test'
import {
  CategoryMain,
  CategorySidebar,
} from '../../../../../dashboard/src/components/spree/categories/category-form'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { categoryTree, kitchenWithImages } from '../../../fixtures/admin/merchandising'
import { validationError } from '../../dashboard-core/products/product-form'
import { CategoryFormFor, categoryParameters } from './category-form'

/**
 * The category page (DA-PRD-08 and DA-PRD-09): its main column, with the
 * name and description and, once the category exists, its products, custom
 * fields, translations and metadata; and its sidebar, with the two images,
 * the parent category and the search listing.
 */
const meta = {
  title: 'Admin dashboard/Categories/Category form',
  tags: ['CMP-DA-G-03'],
  decorators: [withStore, withToaster],
  parameters: categoryParameters({ category: kitchenWithImages }),
  render: () => (
    <CategoryFormFor category={kitchenWithImages}>
      {(form) => <CategoryMain form={form} category={kitchenWithImages} />}
    </CategoryFormFor>
  ),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const teaware = categoryTree.find((category) => category.id === 'ctg_6Tw9Ar3G') as Category

function Sidebar({ category, validate }: { category?: Category; validate?: boolean }) {
  return (
    <CategoryFormFor category={category} validate={validate}>
      {(form) => <CategorySidebar form={form} category={category} />}
    </CategoryFormFor>
  )
}

export const Main: Story = {
  play: async () => {
    await screen.findByText('Clay mug')
    await screen.findByText('Banner text')
    await screen.findByText('Manage translations')
  },
}

// A new category asks only for its name and description; the cards that
// need a saved category appear after the first save.
export const NewCategory: Story = {
  name: 'New category',
  parameters: categoryParameters(),
  render: () => <CategoryFormFor>{(form) => <CategoryMain form={form} />}</CategoryFormFor>,
  play: async () => {
    await screen.findByLabelText('Name')
    await expect(screen.queryByText('Products')).toBeNull()
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  parameters: categoryParameters(),
  render: () => (
    <CategoryFormFor validate>{(form) => <CategoryMain form={form} />}</CategoryFormFor>
  ),
  play: async () => {
    await expect(await screen.findByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  },
}

// Spree refusing a second category at the same address in this store.
export const AddressTaken: Story = {
  name: 'Address taken',
  parameters: categoryParameters({ category: teaware, column: 'sidebar' }),
  render: () => (
    <CategoryFormFor
      category={teaware}
      serverError={validationError({
        permalink: { code: 'taken', message: 'has already been taken' },
      })}
    >
      {(form) => <CategorySidebar form={form} category={teaware} />}
    </CategoryFormFor>
  ),
  play: async () => {
    await screen.findByText('has already been taken')
  },
}

export const SidebarSaved: Story = {
  name: 'Sidebar',
  parameters: categoryParameters({ category: kitchenWithImages, column: 'sidebar' }),
  render: () => <Sidebar category={kitchenWithImages} />,
  play: async () => {
    await screen.findByText('Kitchen: handmade mugs and teaware')
    await screen.findByPlaceholderText('Top level')
  },
}

// A subcategory names its parent, read back by id when the page opens.
export const SidebarWithParent: Story = {
  name: 'Sidebar, with a parent',
  parameters: categoryParameters({ category: teaware, column: 'sidebar' }),
  render: () => <Sidebar category={teaware} />,
  play: async () => {
    await screen.findByDisplayValue('Kitchen')
  },
}

export const SidebarNew: Story = {
  name: 'Sidebar, new category',
  parameters: categoryParameters({ column: 'sidebar' }),
  render: () => <Sidebar />,
  play: async () => {
    await screen.findByText('example.com/t/category-slug')
  },
}

// The parent picker searches by the name typed, and leaves out the category
// itself: Teaware is not offered as its own parent.
export const ChoosingParent: Story = {
  name: 'Choosing a parent',
  parameters: categoryParameters({ category: teaware, column: 'sidebar', viewport: true }),
  render: () => <Sidebar category={teaware} />,
  play: async () => {
    await userEvent.click(await screen.findByDisplayValue('Kitchen'))
    const options = await screen.findAllByRole('option')
    await expect(options.some((option) => option.textContent?.includes('Mugs'))).toBe(true)
    await expect(options.some((option) => option.textContent?.includes('Teaware'))).toBe(false)
  },
}

// The listing preview follows the search title as it is typed.
export const EditingListing: Story = {
  name: 'Editing the listing',
  parameters: categoryParameters({ category: kitchenWithImages, column: 'sidebar' }),
  render: () => <Sidebar category={kitchenWithImages} />,
  play: async () => {
    const title = await screen.findByLabelText('Meta title')
    await userEvent.clear(title)
    await userEvent.type(title, 'Handmade kitchenware')
    const preview = (await screen.findByText('example.com/t/kitchen')).parentElement as HTMLElement
    await within(preview).findByText('Handmade kitchenware')
  },
}
