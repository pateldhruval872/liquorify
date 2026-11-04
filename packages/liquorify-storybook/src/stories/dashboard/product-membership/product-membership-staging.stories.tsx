import { useResourceKey } from '@spree/dashboard-core'
import { Button } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { CategoryProductsCard } from '../../../../../dashboard/src/components/spree/categories/category-products-card'
import { flushProductMembership } from '../../../../../dashboard/src/components/spree/product-membership-staging'
import {
  useAddCategoryProducts,
  useRemoveCategoryProducts,
} from '../../../../../dashboard/src/hooks/use-categories'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { kitchenWithImages } from '../../../fixtures/admin/merchandising'
import { type CategoryForm, CategoryFormFor, categoryParameters } from '../categories/category-form'

/**
 * Holds a grouping's product changes in its page's form, so the page's Save
 * writes them and Discard drops them, like any other field. It draws nothing
 * of its own; these stories show the category's products card above the
 * page's Save and Discard, with the form's unsaved state beside them.
 */
function SaveBar({ form }: { form: CategoryForm }) {
  const queryClient = useQueryClient()
  const add = useAddCategoryProducts(kitchenWithImages.id)
  const remove = useRemoveCategoryProducts(kitchenWithImages.id)
  const productsKey = useResourceKey('categories', kitchenWithImages.id, 'products')
  const [saving, setSaving] = useState(false)
  const { isDirty } = form.formState

  async function save() {
    setSaving(true)
    const values = form.getValues()
    await flushProductMembership({
      staging: values.staged_products,
      add: (ids) => add.mutateAsync(ids),
      remove: (ids) => remove.mutateAsync(ids),
      queryClient,
      productsKey,
    })
    form.reset({ ...values, staged_products: { adds: [], removes: [] } })
    setSaving(false)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="mr-auto text-muted-foreground text-sm">
        {isDirty ? 'Unsaved changes' : 'All changes saved'}
      </span>
      <Button type="button" variant="outline" disabled={!isDirty} onClick={() => form.reset()}>
        Discard
      </Button>
      <Button type="button" disabled={!isDirty || saving} onClick={save}>
        Save
      </Button>
    </div>
  )
}

function StagingPage() {
  return (
    <CategoryFormFor category={kitchenWithImages}>
      {(form) => (
        <>
          <CategoryProductsCard categoryId={kitchenWithImages.id} />
          <SaveBar form={form} />
        </>
      )}
    </CategoryFormFor>
  )
}

const meta = {
  title: 'Admin dashboard/Product membership/Product membership staging',
  tags: ['CMP-DA-G-24'],
  decorators: [withStore, withToaster],
  parameters: categoryParameters({ category: kitchenWithImages }),
  render: () => <StagingPage />,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

async function stageChanges() {
  await screen.findByText('Clay mug')
  await userEvent.click(screen.getByRole('button', { name: 'Add products' }))
  const sheet = await screen.findByRole('dialog', { name: 'Add products to category' })
  await userEvent.click(await within(sheet).findByRole('button', { name: /Linen apron/ }))
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add 1' }))
  // The new product is pinned on top, so the clay mug's row is found by name.
  const mugRow = (await screen.findByText('Clay mug')).closest('tr') as HTMLElement
  await userEvent.click(within(mugRow).getByRole('button', { name: 'Remove from category' }))
  await screen.findByText('Unsaved changes')
}

export const NothingStaged: Story = {
  name: 'Nothing staged',
  play: async () => {
    await screen.findByText('All changes saved')
  },
}

export const Staged: Story = {
  play: stageChanges,
}

// Restoring the removed product and taking out the new one leaves nothing to save.
export const Unstaged: Story = {
  play: async () => {
    await stageChanges()
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
    const newRow = (await screen.findByText('New')).closest('tr') as HTMLElement
    await userEvent.click(within(newRow).getByRole('button', { name: 'Remove from category' }))
    await screen.findByText('All changes saved')
  },
}

export const Discarded: Story = {
  play: async () => {
    await stageChanges()
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    await screen.findByText('All changes saved')
    await waitFor(() => expect(screen.queryByText('Linen apron')).toBeNull())
  },
}

// Save removes, then adds, then reads the list back once.
export const Saved: Story = {
  play: async () => {
    await stageChanges()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('All changes saved')
    await screen.findByText('Linen apron')
    await expect(screen.queryByText('New')).toBeNull()
    await expect(screen.queryByText('Clay mug')).toBeNull()
  },
}
