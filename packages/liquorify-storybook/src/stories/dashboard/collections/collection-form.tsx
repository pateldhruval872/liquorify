import { zodResolver } from '@hookform/resolvers/zod'
import type { Collection, PermissionRule, Product } from '@spree/admin-sdk'
import { type ReactNode, useEffect } from 'react'
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form'
import { ProductMembershipStagingProvider } from '../../../../../dashboard/src/components/spree/product-membership-staging'
import {
  COLLECTION_DEFAULTS,
  type CollectionFormValues,
  collectionFormSchema,
  collectionToForm,
} from '../../../../../dashboard/src/schemas/collection'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import {
  collectionFieldDefinitions,
  newArrivals,
  summerEdit,
  summerProducts,
  summerTranslations,
} from '../../../fixtures/admin/merchandising'
import { mediaLibrary } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  customFieldDefinitionList,
  translationRequests,
} from '../../../mocks/handlers/admin/catalog'
import {
  collectionRequests,
  membershipRequests,
  productPickerList,
} from '../../../mocks/handlers/admin/merchandising'
import { mediaList } from '../../../mocks/handlers/admin/settings'

export type CollectionForm = UseFormReturn<CollectionFormValues>

const libraryFiles = mediaLibrary.map((file) => ({ ...file, signed_id: `story-blob-${file.id}` }))

/**
 * The collection page's form, filled from the collection the way the page
 * fills it, with its products staged in the form until Save, or the new
 * collection page's defaults when there is no collection yet.
 */
export function CollectionFormFor({
  collection,
  validate = false,
  children,
}: {
  collection?: Collection
  validate?: boolean
  children: (form: CollectionForm) => ReactNode
}) {
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: collection ? collectionToForm(collection) : { ...COLLECTION_DEFAULTS },
  })
  useEffect(() => {
    if (validate) void form.trigger()
  }, [form, validate])
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
 * A part of the collection page: signed in to the store, at the collection's
 * own address (or the new collection page's), with every request its cards
 * make answered.
 */
export function collectionParameters({
  collection,
  column = 'main',
  rules,
  viewport = false,
  members = summerProducts,
  handlers = {},
}: {
  collection?: Collection
  column?: Column
  rules?: PermissionRule[]
  viewport?: boolean
  members?: Product[]
  handlers?: Record<string, unknown>
} = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column,
      ...(viewport && { capture: 'viewport' }),
      route: collection
        ? {
            pattern: '/_authenticated/$storeId/products/collections/$collectionId',
            path: `/${shellStore.id}/products/collections/${collection.id}`,
          }
        : {
            pattern: '/_authenticated/$storeId/products/collections/new',
            path: `/${shellStore.id}/products/collections/new`,
          },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        collections: collectionRequests([summerEdit, newArrivals]),
        members: membershipRequests('collections', members),
        products: productPickerList(),
        customFieldDefinitions: customFieldDefinitionList(collectionFieldDefinitions),
        translations: translationRequests(summerTranslations),
        media: mediaList(libraryFiles),
        ...handlers,
      },
    },
  }
}
