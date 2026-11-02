import type {
  Category,
  Channel,
  Collection,
  CustomFieldDefinition,
  DigitalAsset,
  DigitalAssetProvider,
  Media,
  OptionType,
  PackageType,
  Product,
  ProductType,
  ResourceTranslations,
  ResourceTranslationsNode,
  StockMovement,
  TranslationBatchEntry,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import {
  cartonPackageType,
  categories,
  clayMug,
  clayMugTranslations,
  collections,
  deliveryProfiles,
  digitalAssets,
  optionTypes,
  pooledAsset,
  productTags,
  productTypes,
  stockMovements,
  taxCategories,
} from '../../../fixtures/admin/catalog'
import { channels, customFieldDefinitions } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { countries } from './countries'
import { uploadedFile } from './files'
import { searchable, stockLocationList } from './settings'

/** The one digital asset source Spree registers, which takes an uploaded file. */
export const fileProvider: DigitalAssetProvider = {
  type: 'file',
  name: 'File',
  requires_attachment: true,
  settings_schema: [],
}

/**
 * The source Spree's own digital asset specs register: no file, and one
 * setting naming the pool it hands keys out from. Spree ships no such source;
 * an extension would add one like it.
 */
export const pooledProvider: DigitalAssetProvider = {
  type: 'stub',
  name: 'Stub',
  requires_attachment: false,
  settings_schema: [{ key: 'pool_name', type: 'string' }],
}

/** One page of a product's records, ten or twenty-five at a time as the cards ask. */
function paged<T>(records: T[], request: Request, fallbackLimit = 25) {
  const params = new URL(request.url).searchParams
  const limit = Number(params.get('limit') ?? fallbackLimit)
  const page = Number(params.get('page') ?? 1)
  const pages = Math.max(1, Math.ceil(records.length / limit))
  const data = records.slice((page - 1) * limit, page * limit)
  const from = data.length > 0 ? (page - 1) * limit + 1 : 0
  return {
    data,
    meta: {
      page,
      limit,
      count: records.length,
      pages,
      from,
      to: from + Math.max(data.length - 1, 0),
      in: data.length,
      previous: page > 1 ? page - 1 : null,
      next: page < pages ? page + 1 : null,
    },
  }
}

export function optionTypeList(records: OptionType[] = optionTypes) {
  return [http.get('/api/v3/admin/option_types', () => HttpResponse.json(onePage(records)))]
}

/** Categories, searched by name and hydrated by id as the category picker asks. */
export function categoryList(records: Category[] = categories) {
  return [searchable('/api/v3/admin/categories', records)]
}

export function collectionList(records: Collection[] = collections) {
  return [searchable('/api/v3/admin/collections', records)]
}

/** The store's product types, and each one on its own for the fields it adds. */
export function productTypeRequests(records: ProductType[] = productTypes) {
  return [
    http.get('/api/v3/admin/product_types', () => HttpResponse.json(onePage(records))),
    http.get('/api/v3/admin/product_types/:id', ({ params }) => {
      const found = records.find((record) => record.id === params.id)
      return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
    }),
  ]
}

export const taxCategoryList = [
  http.get('/api/v3/admin/tax_categories', () => HttpResponse.json(onePage(taxCategories))),
]

export const deliveryProfileList = [
  http.get('/api/v3/admin/delivery_profiles', () => HttpResponse.json(onePage(deliveryProfiles))),
]

export function packageTypeList(records: PackageType[] = [cartonPackageType]) {
  return [http.get('/api/v3/admin/package_types', () => HttpResponse.json(onePage(records)))]
}

/** The tag vocabulary, narrowed by what the merchant has typed. */
export function tagList(names: string[] = productTags) {
  return [
    http.get('/api/v3/admin/tags', ({ request }) => {
      const query = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase()
      return HttpResponse.json({
        data: names.filter((name) => name.includes(query)).map((name) => ({ name })),
      })
    }),
  ]
}

export function channelList(records: Channel[] = channels) {
  return [http.get('/api/v3/admin/channels', () => HttpResponse.json(onePage(records)))]
}

/** The store's custom field definitions, for the resource type the card asks about. */
export function customFieldDefinitionList(
  records: CustomFieldDefinition[] = customFieldDefinitions,
) {
  return [
    http.get('/api/v3/admin/custom_field_definitions', ({ request }) => {
      const type = new URL(request.url).searchParams.get('q[resource_type_eq]')
      return HttpResponse.json(
        onePage(records.filter((record) => !type || record.resource_type === type)),
      )
    }),
  ]
}

export const customFieldDefinitionsHeld = [
  http.get('/api/v3/admin/custom_field_definitions', async () => {
    await delay('infinite')
  }),
]

export function productMediaList(records: Media[] = clayMug.media ?? []) {
  return [
    http.get('/api/v3/admin/products/:productId/media', () => HttpResponse.json(onePage(records))),
  ]
}

/**
 * A product's downloadable files and the sources they can come from. A file
 * added or deleted changes what the list answers next, as the card refetches.
 */
export function digitalAssetRequests(
  initial: DigitalAsset[] = digitalAssets,
  providers: DigitalAssetProvider[] = [fileProvider],
) {
  let records = [...initial]
  return [
    http.get('/api/v3/admin/products/:productId/digital_assets/providers', () =>
      HttpResponse.json({ data: providers }),
    ),
    http.get('/api/v3/admin/products/:productId/digital_assets', ({ request }) =>
      HttpResponse.json(paged(records, request)),
    ),
    http.post('/api/v3/admin/products/:productId/digital_assets', async ({ request }) => {
      const body = (await request.json()) as {
        signed_id?: string
        provider_type?: string
        provider_settings?: Record<string, unknown>
      }
      const provider = providers.find((candidate) => candidate.type === body.provider_type)
      const file = body.signed_id ? uploadedFile(body.signed_id) : undefined
      const created: DigitalAsset = {
        ...(provider ? pooledAsset : digitalAssets[0]),
        id: `dasset_9Nw${records.length}Up`,
        ...(file && {
          filename: file.filename,
          content_type: file.content_type,
          byte_size: file.byte_size,
          download_url: `/fixtures/${file.filename}`,
        }),
        ...(provider && {
          provider_type: provider.type,
          provider_name: provider.name,
          provider_settings: body.provider_settings ?? {},
        }),
      }
      records = [created, ...records]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.delete('/api/v3/admin/products/:productId/digital_assets/:id', ({ params }) => {
      records = records.filter((record) => record.id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
    http.patch(
      '/api/v3/admin/products/:productId/digital_assets/:id',
      async ({ params, request }) => {
        const found = records.find((record) => record.id === params.id) ?? records[0]
        return HttpResponse.json({ ...found, ...((await request.json()) as object) })
      },
    ),
  ]
}

/**
 * Spree refusing a key from a source no extension registers any more, as when
 * the extension was removed after the page loaded.
 */
export const notRegistered = () =>
  HttpResponse.json(
    {
      error: {
        code: 'validation_error',
        message: 'Provider type is not a registered provider',
        details: { provider_type: ['is not a registered provider'] },
      },
    },
    { status: 422 },
  )

export const digitalAssetsHeld = [
  http.get('/api/v3/admin/products/:productId/digital_assets/providers', () =>
    HttpResponse.json({ data: [fileProvider] }),
  ),
  http.get('/api/v3/admin/products/:productId/digital_assets', async () => {
    await delay('infinite')
  }),
]

/**
 * A record's translation matrix, which the card counts and the editor fills
 * in. A save is applied to the matrix, so the editor reads it back as Spree's
 * would, and counts each locale's translated fields again.
 */
export function translationRequests(initial: ResourceTranslations = clayMugTranslations) {
  let matrix = initial
  return [
    http.get('/api/v3/admin/:resources/:resourceId/translations', () =>
      HttpResponse.json({ data: matrix }),
    ),
    http.post('/api/v3/admin/translations/batch', async ({ request }) => {
      const { translations } = (await request.json()) as { translations: TranslationBatchEntry[] }
      matrix = translations.reduce(applyTranslations, matrix)
      return HttpResponse.json({ data: [] })
    }),
  ]
}

function applyTranslations<T extends ResourceTranslations | ResourceTranslationsNode>(
  node: T,
  entry: TranslationBatchEntry,
): T {
  if (node.resource_id !== entry.resource_id) {
    return {
      ...node,
      children: node.children?.map((child) => applyTranslations(child, entry)),
    }
  }
  const translations = { ...node.translations }
  for (const [locale, values] of Object.entries(entry.values)) {
    const merged = { ...translations[locale], ...values }
    const translated = node.fields.filter((field) => {
      const value = merged[field.key]
      return value != null && value !== ''
    }).length
    translations[locale] = { ...merged, translated_field_count: translated }
  }
  return { ...node, translations }
}

/**
 * Spree refusing a translation save for a product deleted since the editor
 * opened, with the message it gives for the first entry it cannot find.
 */
export const translationSaveRefused = [
  http.post('/api/v3/admin/translations/batch', () =>
    HttpResponse.json(
      {
        error: {
          code: 'validation_error',
          message: `Resource not found: ${clayMug.id}`,
          details: { translations: { '0': [`Resource not found: ${clayMug.id}`] } },
        },
      },
      { status: 422 },
    ),
  ),
]

export const translationsHeld = [
  http.get('/api/v3/admin/:resources/:resourceId/translations', async () => {
    await delay('infinite')
  }),
]

export const translationsFailed = [
  http.get('/api/v3/admin/:resources/:resourceId/translations', () =>
    HttpResponse.json(
      { error: { code: 'internal_error', message: 'Something went wrong' } },
      { status: 500 },
    ),
  ),
]

/** The stock history, ten movements a page as the history table asks. */
export function stockMovementList(records: StockMovement[] = stockMovements) {
  return [
    http.get('/api/v3/admin/stock_movements', ({ request }) =>
      HttpResponse.json(paged(records, request, 10)),
    ),
  ]
}

export const stockMovementsHeld = [
  http.get('/api/v3/admin/stock_movements', async () => {
    await delay('infinite')
  }),
]

/**
 * Everything the product page's cards read for one product: its media, files,
 * translations and stock history, and the store's options, categories,
 * collections, types, tax categories, delivery profiles, cartons, tags,
 * channels, stock locations, countries and custom fields.
 */
export function productPageHandlers(product: Product = clayMug) {
  return {
    optionTypes: optionTypeList(),
    categories: categoryList(),
    collections: collectionList(),
    productTypes: productTypeRequests(),
    taxCategories: taxCategoryList,
    deliveryProfiles: deliveryProfileList,
    packageTypes: packageTypeList(),
    tags: tagList(),
    channels: channelList(),
    stockLocations: stockLocationList(),
    countries,
    customFieldDefinitions: customFieldDefinitionList(),
    media: productMediaList(product.media ?? []),
    digitalAssets: digitalAssetRequests(product.id === clayMug.id ? [] : digitalAssets),
    translations: translationRequests(),
    stockMovements: stockMovementList(),
  }
}
