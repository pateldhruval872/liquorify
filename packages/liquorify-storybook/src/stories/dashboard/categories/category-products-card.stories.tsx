import type { Product } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { CategoryProductsCard } from '../../../../../dashboard/src/components/spree/categories/category-products-card'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { kitchenProducts, kitchenWithImages } from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'
import { membershipHeld } from '../../../mocks/handlers/admin/merchandising'
import { CategoryFormFor, categoryParameters } from './category-form'

/**
 * A category's products (DA-PRD-09): added through the product picker and
 * removed from the list, both held until the page's Save, and dragged into
 * the order the storefront shows them in, which saves at once.
 */
const meta = {
  title: 'Admin dashboard/Categories/Category products card',
  component: CategoryProductsCard,
  tags: ['CMP-DA-G-03'],
  args: { categoryId: kitchenWithImages.id },
  decorators: [withStore, withToaster],
  parameters: categoryParameters({ category: kitchenWithImages }),
  render: (args) => (
    <CategoryFormFor category={kitchenWithImages}>
      {() => <CategoryProductsCard {...args} />}
    </CategoryFormFor>
  ),
} satisfies Meta<typeof CategoryProductsCard>

export default meta
type Story = StoryObj<typeof meta>

/** Thirty products, for a category that runs to a second page. */
const manyProducts: Product[] = Array.from({ length: 30 }, (_, index) => {
  const product = kitchenProducts[index % kitchenProducts.length]
  return { ...product, id: `${product.id}${index}`, name: `${product.name} ${index + 1}` }
})

export const Members: Story = {
  play: async () => {
    await screen.findByText('Clay mug')
    await screen.findByText('Olive candle')
  },
}

export const Empty: Story = {
  parameters: categoryParameters({ category: kitchenWithImages, members: [] }),
  play: async () => {
    await screen.findByText('No products in this category yet.')
  },
}

export const Loading: Story = {
  parameters: categoryParameters({
    category: kitchenWithImages,
    handlers: { members: membershipHeld('categories') },
  }),
  play: async () => {
    await screen.findByText('Loading…')
  },
}

export const Paginated: Story = {
  parameters: categoryParameters({ category: kitchenWithImages, members: manyProducts }),
  play: async () => {
    await screen.findByText('Page 1 of 2')
    await screen.findByText('30')
  },
}

// The picker offers only products the category does not hold yet.
export const AddingProducts: Story = {
  name: 'Adding products',
  parameters: categoryParameters({ category: kitchenWithImages, viewport: true }),
  play: async () => {
    await screen.findByText('Clay mug')
    await userEvent.click(screen.getByRole('button', { name: 'Add products' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add products to category' })
    await within(sheet).findByText('Linen apron')
    await expect(within(sheet).queryByText('Glazing guide')).toBeNull()
  },
}

// An addition and a removal waiting for Save: the new product is badged and
// pinned on top, the removed one struck through with Restore, and dragging
// is off until they are saved.
export const PendingChanges: Story = {
  name: 'Pending changes',
  play: async () => {
    await screen.findByText('Clay mug')
    await userEvent.click(screen.getByRole('button', { name: 'Add products' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add products to category' })
    await userEvent.click(await within(sheet).findByRole('button', { name: /Linen apron/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add 1' }))
    // The sheet hands focus back to Add products as it closes; waiting for that
    // keeps a slower machine from moving focus there after the next click.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add products' })).toHaveFocus())
    // The new product is pinned on top, so the clay mug's row is found by name.
    const mugRow = (await screen.findByText('Clay mug')).closest('tr') as HTMLElement
    await userEvent.click(within(mugRow).getByRole('button', { name: 'Remove from category' }))
    await screen.findByText('Changes to the product list apply when you save.')
    await screen.findByText('New')
    await screen.findByRole('button', { name: 'Restore' })
    await expect(screen.queryByRole('button', { name: 'Drag to reorder' })).toBeNull()
  },
}

export const SelectingRows: Story = {
  name: 'Selecting rows',
  play: async () => {
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select all' }))
    await screen.findByRole('button', { name: 'Remove' })
  },
}

// The card does not check the role itself: a read-only teammate is offered
// Add products and Remove, and Spree refuses the Save.
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  parameters: categoryParameters({ category: kitchenWithImages, rules: readOnly }),
  play: async () => {
    await screen.findByText('Clay mug')
    await screen.findByRole('button', { name: 'Add products' })
  },
}
