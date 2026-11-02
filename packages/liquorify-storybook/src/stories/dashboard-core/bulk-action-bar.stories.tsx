import { type BulkAction, BulkActionBar, Subject } from '@spree/dashboard-core'
import {
  FolderMinusIcon,
  FolderPlusIcon,
  LayersIcon,
  RadioTowerIcon,
  TagIcon,
  TagsIcon,
  Trash2Icon,
} from '@spree/dashboard-ui/icons'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { expect, screen, userEvent, within } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { withToaster } from '../../decorators/toaster'
import { clayMug, linenApron } from '../../fixtures/admin/catalog'
import { readOnly } from '../../fixtures/admin/session'

/**
 * The bar the product list (DA-PRD-01) shows over its rows once products are
 * chosen, with the list's own actions in its order. The actions that fit sit
 * in the bar and the rest go under "More actions". Each action that asks for
 * categories, collections, channels, tags or a status opens a dialog (the
 * bulk dialog's stories, CMP-DUI-C-04); Delete asks first. A role that may
 * not change products sees the count alone.
 */
function ProductListBar({ selectedIds }: { selectedIds: string[] }) {
  const { t } = useTranslation()
  const actions = useMemo<BulkAction<unknown>[]>(() => {
    const form = (key: string, label: string, icon: React.ReactNode) => ({
      key,
      label: t(label),
      icon,
      subject: Subject.Product,
      form: () => null,
      run: async () => undefined,
    })
    return [
      form(
        'set-status',
        'admin.pages.products.bulk.set_status_action',
        <TagIcon className="size-4" />,
      ),
      form(
        'add-to-categories',
        'admin.pages.products.bulk.add_categories_action',
        <FolderPlusIcon className="size-4" />,
      ),
      form(
        'remove-from-categories',
        'admin.pages.products.bulk.remove_categories_action',
        <FolderMinusIcon className="size-4" />,
      ),
      form(
        'add-to-collections',
        'admin.pages.products.bulk.add_collections_action',
        <LayersIcon className="size-4" />,
      ),
      form(
        'remove-from-collections',
        'admin.pages.products.bulk.remove_collections_action',
        <LayersIcon className="size-4" />,
      ),
      form(
        'add-to-channels',
        'admin.pages.products.bulk.add_channels_action',
        <RadioTowerIcon className="size-4" />,
      ),
      form(
        'remove-from-channels',
        'admin.pages.products.bulk.remove_channels_action',
        <RadioTowerIcon className="size-4" />,
      ),
      form(
        'add-tags',
        'admin.pages.products.bulk.add_tags_action',
        <TagsIcon className="size-4" />,
      ),
      form(
        'remove-tags',
        'admin.pages.products.bulk.remove_tags_action',
        <TagsIcon className="size-4" />,
      ),
      {
        key: 'delete',
        label: t('admin.actions.delete'),
        icon: <Trash2Icon className="size-4" />,
        subject: Subject.Product,
        action: 'destroy',
        confirm: {
          title: t('admin.pages.products.bulk.delete_confirm.title'),
          message: t('admin.pages.products.bulk.delete_confirm.message'),
          confirmLabel: t('admin.actions.delete'),
          variant: 'destructive',
        },
        run: async () => undefined,
        successMessage: t('admin.pages.products.bulk.deleted'),
        errorMessage: t('admin.pages.products.bulk.delete_failed'),
      },
    ]
  }, [t])
  return (
    <div className="flex h-12 items-center rounded-md border bg-muted/50 px-2">
      <BulkActionBar selectedIds={selectedIds} actions={actions} onDone={() => {}} />
    </div>
  )
}

/** The actions appear once the admin's permissions have loaded. */
const actionsShown = () => screen.findByRole('button', { name: 'Set status…' })

const deleteButton = async () => {
  await actionsShown()
  const inBar = screen.queryByRole('button', { name: 'Delete' })
  if (inBar) return userEvent.click(inBar)
  await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
}

const meta = {
  title: 'Dashboard core/Bulk action bar',
  component: ProductListBar,
  tags: ['CMP-CORE-04'],
  args: { selectedIds: [clayMug.id, linenApron.id] },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'page' },
  },
} satisfies Meta<typeof ProductListBar>

export default meta
type Story = StoryObj<typeof meta>

export const TwoChosen: Story = {
  name: 'Two products chosen',
  play: async () => {
    await actionsShown()
  },
}

export const MoreActions: Story = {
  name: 'More actions open',
  parameters: {
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    await actionsShown()
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: {
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    await deleteButton()
    await screen.findByText('Delete 2 products?')
  },
}

export const Deleted: Story = {
  decorators: [withToaster],
  parameters: {
    liquorify: { ...storeParameters().liquorify, column: 'page', capture: 'viewport' },
  },
  play: async () => {
    await deleteButton()
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    )
    await screen.findByText('Deleted 2 products')
  },
}

export const WithoutWriteAccess: Story = {
  name: 'A role that may not change products',
  parameters: {
    ...storeParameters(undefined, readOnly),
    liquorify: { ...storeParameters().liquorify, column: 'page' },
  },
  play: async () => {
    await screen.findByText('2 selected')
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
  },
}
