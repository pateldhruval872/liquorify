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
  StockMovement,
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
  productTags,
  productTypes,
  stockMovements,
  taxCategories,
} from '../../../fixtures/admin/catalog'
import { channels, customFieldDefinitions } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
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

/** A product's downloadable files and the sources they can come from. */
export function digitalAssetRequests(
  records: DigitalAsset[] = digitalAssets,
  providers: DigitalAssetProvider[] = [fileProvider],
) {
  return [
    http.get('/api/v3/admin/products/:productId/digital_assets/providers', () =>
      HttpResponse.json({ data: providers }),
    ),
    http.get('/api/v3/admin/products/:productId/digital_assets', ({ request }) =>
      HttpResponse.json(paged(records, request)),
    ),
    http.patch(
      '/api/v3/admin/products/:productId/digital_assets/:id',
      async ({ params, request }) => {
        const found = records.find((record) => record.id === params.id) ?? records[0]
        return HttpResponse.json({ ...found, ...((await request.json()) as object) })
      },
    ),
  ]
}

export const digitalAssetsHeld = [
  http.get('/api/v3/admin/products/:productId/digital_assets/providers', () =>
    HttpResponse.json({ data: [fileProvider] }),
  ),
  http.get('/api/v3/admin/products/:productId/digital_assets', async () => {
    await delay('infinite')
  }),
]

/** A product's translation matrix, which the card counts and the editor fills in. */
export function translationRequests(matrix: ResourceTranslations = clayMugTranslations) {
  return [
    http.get('/api/v3/admin/products/:productId/translations', () =>
      HttpResponse.json({ data: matrix }),
    ),
  ]
}

export const translationsHeld = [
  http.get('/api/v3/admin/products/:productId/translations', async () => {
    await delay('infinite')
  }),
]

export const translationsFailed = [
  http.get('/api/v3/admin/products/:productId/translations', () =>
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
 * channels, stock locations and custom fields.
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
    customFieldDefinitions: customFieldDefinitionList(),
    media: productMediaList(product.media ?? []),
    digitalAssets: digitalAssetRequests(product.id === clayMug.id ? [] : digitalAssets),
    translations: translationRequests(),
    stockMovements: stockMovementList(),
  }
}
