import { zodResolver } from '@hookform/resolvers/zod'
import type { Category, PermissionRule, SpreeError } from '@spree/admin-sdk'
import { mapSpreeErrorsToForm } from '@spree/dashboard-core'
import { type ReactNode, useEffect } from 'react'
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form'
import { ProductMembershipStagingProvider } from '../../../../../dashboard/src/components/spree/product-membership-staging'
import {
  CATEGORY_DEFAULTS,
  type CategoryFormValues,
  categoryFormSchema,
  categoryToForm,
} from '../../../../../dashboard/src/schemas/category'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import {
  categoryFieldDefinitions,
  categoryTree,
  kitchenProducts,
  kitchenTranslations,
} from '../../../fixtures/admin/merchandising'
import { mediaLibrary } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  customFieldDefinitionList,
  translationRequests,
} from '../../../mocks/handlers/admin/catalog'
import {
  categoryRequests,
  membershipRequests,
  productPickerList,
} from '../../../mocks/handlers/admin/merchandising'
import { mediaList } from '../../../mocks/handlers/admin/settings'

export type CategoryForm = UseFormReturn<CategoryFormValues>

/**
 * The media library as Spree lists it to the dashboard, each file with the
 * signed id of its stored image, which an image field reuses when one is chosen.
 */
const libraryFiles = mediaLibrary.map((file) => ({ ...file, signed_id: `story-blob-${file.id}` }))

/**
 * The category page's form, filled from the category the way the page fills
 * it, with its products staged in the form until Save, or the new category
 * page's defaults when there is no category yet.
 */
export function CategoryFormFor({
  category,
  values,
  validate = false,
  serverError,
  children,
}: {
  category?: Category
  values?: Partial<CategoryFormValues>
  validate?: boolean
  serverError?: SpreeError
  children: (form: CategoryForm) => ReactNode
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { ...(category ? categoryToForm(category) : CATEGORY_DEFAULTS), ...values },
  })
  useEffect(() => {
    if (validate) void form.trigger()
    if (serverError) mapSpreeErrorsToForm(serverError, form.setError)
  }, [form, validate, serverError])
  return (
    <FormProvider {...form}>
      <ProductMembershipStagingProvider form={form} name="staged_products">
        <form onSubmit={form.handleSubmit(() => {})} className="flex flex-col gap-6">
          {children(form)}
        </form>
      </ProductMembershipStagingProvider>
    </FormProvider>
  )
}

/**
 * A part of the category page: signed in to the store, at the category's own
 * address (or the new category page's), with every request its cards make
 * answered. The products card reads its route by the dashboard's route id.
 */
export function categoryParameters({
  category,
  column = 'main',
  rules,
  viewport = false,
  members = kitchenProducts,
  handlers = {},
}: {
  category?: Category
  column?: Column
  rules?: PermissionRule[]
  viewport?: boolean
  members?: typeof kitchenProducts
  handlers?: Record<string, unknown>
} = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column,
      ...(viewport && { capture: 'viewport' }),
      route: category
        ? {
            pattern: '/_authenticated/$storeId/products/categories/$categoryId',
            path: `/${shellStore.id}/products/categories/${category.id}`,
          }
        : {
            pattern: '/_authenticated/$storeId/products/categories/new',
            path: `/${shellStore.id}/products/categories/new`,
          },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        categories: categoryRequests(categoryTree),
        members: membershipRequests('categories', members),
        products: productPickerList(),
        customFieldDefinitions: customFieldDefinitionList(categoryFieldDefinitions),
        translations: translationRequests(kitchenTranslations),
        media: mediaList(libraryFiles),
        ...handlers,
      },
    },
  }
}
