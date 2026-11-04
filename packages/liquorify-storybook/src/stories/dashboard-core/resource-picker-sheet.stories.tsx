import type { Product } from '@spree/admin-sdk'
import { adminClient, ResourcePickerSheet } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http } from 'msw'
import { useState } from 'react'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { products } from '../../fixtures/admin/catalog'
import { kitchenProducts } from '../../fixtures/admin/merchandising'
import { productPickerList } from '../../mocks/handlers/admin/merchandising'

/**
 * The sheet a category's products card (DA-PRD-09) opens to add products,
 * searching the store's products as the card does. Products already in the
 * category are listed as added.
 */
function AddProducts({
  selectedIds = kitchenProducts.map((product) => product.id),
  onConfirm,
}: {
  selectedIds?: string[]
  onConfirm: (ids: string[], options: Product[]) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <ResourcePickerSheet<Product>
      open={open}
      onOpenChange={setOpen}
      queryKey="story-category-products-picker"
      selectedIds={selectedIds}
      onConfirm={onConfirm}
      search={(query, page) =>
        adminClient.products.list({
          ...(query ? { name_cont: query } : {}),
          limit: 25,
          page,
          sort: 'name',
        })
      }
      getOptionLabel={(product) => product.name ?? product.id}
      getOptionImageUrl={(product) => product.thumbnail_url}
      getOptionSubtitle={(product) => product.slug ?? null}
      title="Add products to category"
      description="Search and select products to add to this category."
      searchPlaceholder="Search products…"
    />
  )
}

const meta = {
  title: 'Dashboard core/Resource picker sheet',
  component: AddProducts,
  tags: ['CMP-CORE-25'],
  args: { onConfirm: fn() },
  decorators: [withStore],
  parameters: {
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
    msw: { handlers: { ...storeParameters().msw.handlers, products: productPickerList() } },
  },
} satisfies Meta<typeof AddProducts>

export default meta
type Story = StoryObj<typeof meta>

const option = (name: string) => screen.findByRole('button', { name: new RegExp(name) })

export const Results: Story = {
  play: async () => {
    await option('Linen apron')
    await expect(await option('Clay mug')).toBeDisabled()
  },
}

export const Picking: Story = {
  play: async () => {
    await userEvent.click(await option('Linen apron'))
    await userEvent.click(await option('Slate cap'))
    await screen.findByText('2 selected')
    await screen.findByRole('button', { name: 'Add 2' })
  },
}

export const SelectingPage: Story = {
  name: 'Selecting the page',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /on this page/ }))
    await screen.findByText(`${products.length - kitchenProducts.length} selected`)
  },
}

export const Searching: Story = {
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search products…'), 'apron')
    await option('Linen apron')
    await expect(screen.queryByRole('button', { name: /Slate cap/ })).toBeNull()
  },
}

export const NoResults: Story = {
  name: 'No results',
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Search products…'), 'teapot')
    await screen.findByText('No results found.')
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: {
        products: [
          http.get('/api/v3/admin/products', async () => {
            await delay('infinite')
          }),
        ],
      },
    },
  },
  play: async () => {
    await screen.findByRole('dialog', { name: 'Add products to category' })
  },
}

// More products than one page: the rest load on request.
export const MoreToLoad: Story = {
  name: 'More to load',
  parameters: {
    msw: {
      handlers: {
        products: productPickerList(
          Array.from({ length: 30 }, (_, index) => ({
            ...products[index % products.length],
            id: `prod_${String(index).padStart(4, '0')}Pk`,
            name: `${products[index % products.length].name} ${index + 1}`,
          })),
        ),
      },
    },
  },
  play: async () => {
    await screen.findByRole('button', { name: 'Load more' })
    await screen.findByRole('button', { name: 'Select all 30 matches' })
  },
}

export const Confirming: Story = {
  play: async ({ args }) => {
    await userEvent.click(await option('Linen apron'))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Add 1' }),
    )
    await expect(args.onConfirm).toHaveBeenCalledWith(
      [products[1].id],
      [expect.objectContaining({ name: 'Linen apron' })],
    )
  },
}
