import { zodResolver } from '@hookform/resolvers/zod'
import type { Catalog, PermissionRule } from '@spree/admin-sdk'
import { type ReactNode, useEffect } from 'react'
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form'
import { ProductMembershipStagingProvider } from '../../../../../dashboard/src/components/spree/product-membership-staging'
import type { AssignmentEntry } from '../../../../../dashboard/src/schemas/catalog'
import {
  CATALOG_DEFAULTS,
  type CatalogFormValues,
  catalogFormSchema,
  catalogPricingValues,
} from '../../../../../dashboard/src/schemas/catalog'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import { cafeCatalog, cafeProducts } from '../../../fixtures/admin/merchandising'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  audienceLists,
  membershipRequests,
  priceRequests,
  productPickerList,
} from '../../../mocks/handlers/admin/merchandising'

export type CatalogForm = UseFormReturn<CatalogFormValues>

/** The catalog page's form values for a saved catalog, as the page reads them in. */
function catalogToForm(catalog: Catalog): CatalogFormValues {
  return {
    ...CATALOG_DEFAULTS,
    name: catalog.name,
    description: catalog.description ?? '',
    minimum_order_quantity: catalog.minimum_order_quantity?.toString() ?? '',
    order_multiple: catalog.order_multiple?.toString() ?? '',
    assignments: (catalog.assignments ?? []).map((assignment) => ({
      id: assignment.id,
      assignable_type: assignment.assignable_type as AssignmentEntry['assignable_type'],
      assignable_id: assignment.assignable_id,
      assignable_name: assignment.assignable_name,
    })),
    order_minimums: (catalog.order_minimums ?? []).map((minimum) => ({
      id: minimum.id,
      currency: minimum.currency,
      amount: minimum.amount,
    })),
    ...catalogPricingValues(catalog.price_list),
  }
}

/**
 * The catalog page's form, filled from the catalog the way the page fills it,
 * with its products staged until Save, or the wizard's empty defaults when
 * there is no catalog. `validate` runs the form's checks as pressing Save does.
 */
export function CatalogFormFor({
  catalog,
  values,
  validate = false,
  children,
}: {
  catalog?: Catalog
  values?: Partial<CatalogFormValues>
  validate?: boolean
  children: (form: CatalogForm) => ReactNode
}) {
  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema) as any,
    defaultValues: { ...(catalog ? catalogToForm(catalog) : CATALOG_DEFAULTS), ...values },
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
 * A part of the catalog page: signed in to the store, at the catalog's own
 * address, with every request its cards make answered.
 */
export function catalogParameters({
  catalog = cafeCatalog,
  column = 'sidebar',
  rules,
  viewport = false,
  members = cafeProducts,
  handlers = {},
}: {
  catalog?: Catalog
  column?: Column
  rules?: PermissionRule[]
  viewport?: boolean
  members?: { id: string; name: string }[]
  handlers?: Record<string, unknown>
} = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column,
      ...(viewport && { capture: 'viewport' }),
      route: {
        pattern: '/$storeId/products/catalogs/$catalogId',
        path: `/${shellStore.id}/products/catalogs/${catalog.id}`,
      },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        audience: audienceLists,
        members: membershipRequests('catalogs', members),
        products: productPickerList(),
        prices: priceRequests(),
        ...handlers,
      },
    },
  }
}
