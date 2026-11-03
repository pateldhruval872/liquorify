import { zodResolver } from '@hookform/resolvers/zod'
import { type Media, type PermissionRule, type Product, SpreeError } from '@spree/admin-sdk'
import {
  mapSpreeErrorsToForm,
  newProductFormDefaults,
  type ProductFormValues,
  productFormSchema,
  productToFormValues,
} from '@spree/dashboard-core'
import { type ReactNode, useEffect } from 'react'
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import { clayMug } from '../../../fixtures/admin/catalog'
import { shellStore } from '../../../fixtures/admin/shell'
import { productPageHandlers } from '../../../mocks/handlers/admin/catalog'

export type ProductForm = UseFormReturn<ProductFormValues>

/**
 * The answer Spree gives a save that fails validation, in the shape its error
 * handler renders: each field with the error's code and Rails' message.
 */
export function validationError(details: Record<string, { code: string; message: string }>) {
  return new SpreeError(
    {
      error: {
        code: 'validation_error',
        message: Object.entries(details)
          .map(([field, { message }]) => `${field[0].toUpperCase()}${field.slice(1)} ${message}`)
          .join(' and '),
        details: Object.fromEntries(
          Object.entries(details).map(([field, detail]) => [field, [detail]]),
        ),
      },
    },
    422,
  )
}

/**
 * The product page's form, filled from the product the way the page fills it,
 * with the same validation, or with the new product page's defaults when there
 * is no product yet. A card story renders its card from the form. `validate` runs the page's checks as pressing Save does; `serverError` is
 * a refused save, mapped onto the fields as the page maps it.
 */
export function ProductFormFor({
  product = clayMug,
  media = product?.media,
  values,
  validate = false,
  serverError,
  children,
}: {
  product?: Product | null
  media?: Media[]
  /** Values the merchant has already chosen on the page, over the product's own. */
  values?: Partial<ProductFormValues>
  validate?: boolean
  serverError?: SpreeError
  children: (form: ProductForm) => ReactNode
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      ...(product ? productToFormValues(product, media) : newProductFormDefaults()),
      ...values,
    },
  })
  useEffect(() => {
    if (validate) void form.trigger()
    if (serverError) mapSpreeErrorsToForm(serverError, form.setError)
  }, [form, validate, serverError])
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="flex flex-col gap-6">
        {children(form)}
      </form>
    </FormProvider>
  )
}

/**
 * A card on the product page: signed in to the store, at the product's own
 * address (or the new product page's, with no product), with every request
 * the page's cards make answered.
 */
export function productParameters({
  product = clayMug,
  column = 'main',
  rules,
  viewport = false,
  handlers = {},
}: {
  product?: Product | null
  column?: Column
  rules?: PermissionRule[]
  /** A card that opens a sheet or dialog is captured as the window. */
  viewport?: boolean
  handlers?: Record<string, unknown>
} = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column,
      ...(viewport && { capture: 'viewport' }),
      route: {
        pattern: '/$storeId/products/$productId',
        path: `/${shellStore.id}/products/${product?.id ?? 'new'}`,
      },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        ...productPageHandlers(product ?? undefined),
        ...handlers,
      },
    },
  }
}
