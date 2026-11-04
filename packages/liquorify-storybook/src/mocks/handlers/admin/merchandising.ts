import type {
  Category,
  Collection,
  Export,
  Import,
  ImportRow,
  Price,
  PriceList,
  Product,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import {
  categoryTree,
  collectionRuleTypes,
  companies,
  customerGroups,
  failedImportRows,
  kitchenProducts,
  pickableProducts,
  priceLists,
  priceRuleTypes,
  productExport,
  productExportCsv,
  springCatalog,
  tradeBreaks,
  tradePrices,
} from '../../../fixtures/admin/merchandising'
import { channels, markets } from '../../../fixtures/admin/settings'
import { searchCustomers } from '../../../fixtures/admin/shell'
import { onePage } from '../../page'

/** One page of records, as many at a time as the request asks. */
export function paged<T>(records: T[], request: Request, fallbackLimit = 25) {
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

const refused = (message: string, details: Record<string, string[]> = {}) =>
  HttpResponse.json({ error: { code: 'validation_error', message, details } }, { status: 422 })

/**
 * The category tree's requests: the list, searched by name as the page's
 * search box and the parent picker send it, each category on its own, and a
 * move in the tree.
 */
export function categoryRequests(records: Category[] = categoryTree) {
  return [
    http.get('/api/v3/admin/categories', ({ request }) => {
      const params = new URL(request.url).searchParams
      const query = (
        params.get('q[name_cont]') ??
        params.get('name_cont') ??
        params.get('q[search]') ??
        params.get('search') ??
        ''
      ).toLowerCase()
      const ids = params.getAll('q[id_in][]').concat(params.getAll('id_in[]'))
      return HttpResponse.json(
        paged(
          records.filter(
            (record) =>
              (!query || record.pretty_name.toLowerCase().includes(query)) &&
              (ids.length === 0 || ids.includes(record.id)),
          ),
          request,
          100,
        ),
      )
    }),
    http.get('/api/v3/admin/categories/:id', ({ params }) => {
      const found = records.find((record) => record.id === params.id)
      return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
    }),
    http.patch('/api/v3/admin/categories/:id/reposition', ({ params }) =>
      HttpResponse.json(records.find((record) => record.id === params.id) ?? records[0]),
    ),
  ]
}

/** Each collection on its own, and the rule kinds an automatic collection offers. */
export function collectionRequests(records: Collection[], ruleTypes = collectionRuleTypes) {
  return [
    http.get('/api/v3/admin/collection_rules/types', () => HttpResponse.json({ data: ruleTypes })),
    http.get('/api/v3/admin/collections/:id', ({ params }) => {
      const found = records.find((record) => record.id === params.id)
      return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
    }),
  ]
}

export const categoriesHeld = [
  http.get('/api/v3/admin/categories', async () => {
    await delay('infinite')
  }),
]

/**
 * A grouping's products — a category's, a collection's, a catalog's or a
 * price list's — 25 a page as its card asks, and the bulk add, remove and
 * reorder its Save sends.
 */
export function membershipRequests(
  parent: 'categories' | 'collections' | 'catalogs' | 'price_lists',
  initial: { id: string; name: string }[] = kitchenProducts,
) {
  let members = [...initial]
  const path = `/api/v3/admin/${parent}/:parentId/products`
  return [
    http.get(path, ({ request }) => HttpResponse.json(paged(members, request))),
    http.post(path, async ({ request }) => {
      const { product_ids } = (await request.json()) as { product_ids: string[] }
      const added = pickableProducts.filter(
        (product) => product_ids.includes(product.id) && !members.some((m) => m.id === product.id),
      )
      members = [...members, ...added]
      return HttpResponse.json({ added_count: added.length })
    }),
    http.delete(path, async ({ request }) => {
      const { product_ids } = (await request.json()) as { product_ids: string[] }
      const before = members.length
      members = members.filter((member) => !product_ids.includes(member.id))
      return HttpResponse.json({ removed_count: before - members.length })
    }),
    http.patch(`${path}/:productId/reposition`, () => new HttpResponse(null, { status: 204 })),
  ]
}

export function membershipHeld(parent: 'categories' | 'collections' | 'catalogs' | 'price_lists') {
  return [
    http.get(`/api/v3/admin/${parent}/:parentId/products`, async () => {
      await delay('infinite')
    }),
  ]
}

/**
 * The store's products as the membership picker searches them: by name, 25 a
 * page, leaving out what the grouping already holds.
 */
export function productPickerList(records: Product[] = pickableProducts) {
  return [
    http.get('/api/v3/admin/products', ({ request }) => {
      const params = new URL(request.url).searchParams
      const query = (params.get('q[name_cont]') ?? '').toLowerCase()
      const excluded = params.getAll('q[id_not_in][]')
      return HttpResponse.json(
        paged(
          records.filter(
            (record) =>
              (!query || record.name.toLowerCase().includes(query)) &&
              !excluded.includes(record.id),
          ),
          request,
        ),
      )
    }),
  ]
}

/**
 * An export from queueing to download: Spree accepts it, has finished it by
 * the first poll, and serves the file.
 */
export function exportRequests(finished: Export = productExport) {
  return [
    http.post('/api/v3/admin/exports', async ({ request }) => {
      const body = (await request.json()) as { type: string }
      // Answered after 0.4 seconds, as a server does. Answered at once, the
      // export could finish before the dialog had closed, and whether its
      // button got focus back depended on the machine's speed.
      await delay(400)
      return HttpResponse.json(
        { ...finished, type: body.type, done: false, download_url: null },
        { status: 201 },
      )
    }),
    http.get('/api/v3/admin/exports/:id', () => HttpResponse.json(finished)),
    http.get(
      '/api/v3/admin/exports/:id/download',
      () =>
        new HttpResponse(productExportCsv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${finished.filename}"`,
          },
        }),
    ),
  ]
}

/** Spree still writing the file, so the toast stays on "Preparing export…". */
export const exportHeld = [
  http.post('/api/v3/admin/exports', async () => {
    await delay('infinite')
  }),
]

/** Spree refusing an export of a dataset it has no export for. */
export const exportRefused = [
  http.post('/api/v3/admin/exports', async () => {
    await delay(200)
    return refused('Type is not included in the list', { type: ['is not included in the list'] })
  }),
]

/**
 * One import's requests, as the wizard makes them: the import, its failed
 * rows, Start (which moves it on to `next`), and a retry of the failed rows.
 */
export function importRequests(
  initial: Import,
  {
    next,
    rows = failedImportRows,
    created,
  }: { next?: Import; rows?: ImportRow[]; created?: Import } = {},
) {
  let current = initial
  return [
    http.get('/api/v3/admin/imports/:id', () => HttpResponse.json(current)),
    http.get('/api/v3/admin/imports/:id/rows', ({ request }) =>
      HttpResponse.json(paged(rows, request)),
    ),
    http.patch('/api/v3/admin/imports/:id/complete_mapping', async () => {
      await delay(200)
      current = next ?? { ...current, status: 'completed_mapping', rows_count: 0 }
      return HttpResponse.json(current)
    }),
    http.patch('/api/v3/admin/imports/:id/retry_failed_rows', () => {
      current = { ...current, status: 'processing' }
      return HttpResponse.json(current)
    }),
    http.post('/api/v3/admin/imports', () =>
      HttpResponse.json(created ?? initial, { status: 201 }),
    ),
    http.get(
      '/api/v3/admin/imports/template',
      () => new HttpResponse('slug,sku,name,price\n', { headers: { 'Content-Type': 'text/csv' } }),
    ),
    http.get(
      '/api/v3/admin/imports/example',
      () =>
        new HttpResponse('slug,sku,name,price\nclay-mug,MUG-CLAY,Clay mug,18.00\n', {
          headers: { 'Content-Type': 'text/csv' },
        }),
    ),
  ]
}

export const importHeld = [
  http.get('/api/v3/admin/imports/:id', async () => {
    await delay('infinite')
  }),
]

export const importFailedToLoad = [
  http.get('/api/v3/admin/imports/:id', () =>
    HttpResponse.json(
      { error: { code: 'internal_error', message: 'Something went wrong' } },
      { status: 500 },
    ),
  ),
]

/**
 * Spree refusing Start for an import someone already started, from another
 * tab or teammate, with the message it gives.
 */
export const mappingRefused = [
  http.patch('/api/v3/admin/imports/:id/complete_mapping', async () => {
    await delay(200)
    return refused('Import is not in the mapping state')
  }),
]

/**
 * Answers a picker's list request: searched by `search` or `name_cont` on the
 * field it shows, and narrowed by `id_in` when it reads back what is chosen.
 */
export function searchList<T extends { id: string }>(
  path: string,
  records: T[],
  label: (record: T) => string,
) {
  return http.get(path, ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = (
      params.get('q[search]') ??
      params.get('q[name_cont]') ??
      params.get('q[email_cont]') ??
      ''
    ).toLowerCase()
    const ids = params.getAll('q[id_in][]')
    return HttpResponse.json(
      paged(
        records.filter(
          (record) =>
            (!query || label(record).toLowerCase().includes(query)) &&
            (ids.length === 0 || ids.includes(record.id)),
        ),
        request,
        100,
      ),
    )
  })
}

/** What price rules and catalogs are aimed at: channels, markets, companies, customer groups and customers. */
export const audienceLists = [
  searchList('/api/v3/admin/companies', companies, (company) => company.name),
  searchList('/api/v3/admin/channels', channels, (channel) => channel.name),
  searchList('/api/v3/admin/markets', markets, (market) => market.name),
  searchList('/api/v3/admin/customer_groups', customerGroups, (group) => group.name),
  searchList('/api/v3/admin/customers', searchCustomers, (customer) => customer.email ?? ''),
]

/**
 * The store's price lists, the rule kinds Spree offers, and each list's save,
 * activation and deletion as Spree answers them.
 */
export function priceListRequests(records: PriceList[] = priceLists) {
  const lists = new Map(records.map((record) => [record.id, record]))
  const found = (id: unknown) => lists.get(String(id))
  const answer = (record: PriceList | undefined) =>
    record ? HttpResponse.json(record) : new HttpResponse(null, { status: 404 })
  return [
    http.get('/api/v3/admin/price_lists/price_rule_types', () =>
      HttpResponse.json({ data: priceRuleTypes }),
    ),
    http.get('/api/v3/admin/price_lists', ({ request }) =>
      HttpResponse.json(paged([...lists.values()], request)),
    ),
    http.get('/api/v3/admin/price_lists/:id', ({ params }) => answer(found(params.id))),
    http.patch('/api/v3/admin/price_lists/:id/activate', async ({ params }) => {
      await delay(200)
      const record = found(params.id)
      if (!record) return answer(record)
      const later = !!record.starts_at && new Date(record.starts_at) > new Date()
      const next = { ...record, status: later ? 'scheduled' : 'active', currently_active: !later }
      lists.set(record.id, next as PriceList)
      return answer(next as PriceList)
    }),
    http.patch('/api/v3/admin/price_lists/:id/deactivate', async ({ params }) => {
      await delay(200)
      const record = found(params.id)
      if (!record) return answer(record)
      const next = { ...record, status: 'inactive', currently_active: false } as PriceList
      lists.set(record.id, next)
      return answer(next)
    }),
    http.patch('/api/v3/admin/price_lists/:id', async ({ params, request }) => {
      await delay(200)
      const record = found(params.id)
      if (!record) return answer(record)
      const { name, description, starts_at, ends_at, match_policy } =
        (await request.json()) as Partial<PriceList>
      const next = {
        ...record,
        name: name ?? record.name,
        description: description ?? null,
        starts_at: starts_at ?? null,
        ends_at: ends_at ?? null,
        match_policy: match_policy ?? record.match_policy,
      }
      lists.set(record.id, next)
      return answer(next)
    }),
    http.delete('/api/v3/admin/price_lists/:id', () => new HttpResponse(null, { status: 204 })),
  ]
}

/** A catalog created from the wizard, named as the wizard sent it. */
export const catalogCreated = [
  http.post('/api/v3/admin/catalogs', async ({ request }) => {
    await delay(200)
    const { name, description } = (await request.json()) as { name: string; description?: string }
    return HttpResponse.json(
      { ...springCatalog, name, description: description ?? null },
      { status: 201 },
    )
  }),
]

interface PriceRowParams {
  variant_id: string
  currency: string
  price_list_id?: string
  min_quantity?: number
  amount: string | null
  compare_at_amount?: string | null
}

/**
 * The prices endpoint as the bulk price editor uses it: rows filtered by
 * list, currency, quantity, variant and product, searched by product name,
 * SKU or option from three characters, and a bulk save that writes each row
 * by variant, currency, list and quantity, removing a row sent with no amount.
 */
export function priceRequests(rows: Price[] = [...tradePrices, ...tradeBreaks]) {
  let stored = [...rows]
  let nextId = 1
  return [
    http.get('/api/v3/admin/prices', ({ request }) => {
      const params = new URL(request.url).searchParams
      const filter = (name: string) => params.get(`q[${name}]`)
      const list = filter('price_list_id_eq')
      const quantity = filter('min_quantity_eq')
      const above = filter('min_quantity_gt')
      const variants = params.getAll('q[variant_id_in][]')
      const excluded = params.getAll('q[variant_product_id_not_in][]')
      const search = (filter('search') ?? '').toLowerCase()
      const matches = stored.filter((row) => {
        const variant = row.variant as unknown as Record<string, string | null>
        const text = [variant.product_name, variant.sku, variant.options_text]
          .join(' ')
          .toLowerCase()
        return (
          (list ? row.price_list_id === list : row.price_list_id === null) &&
          row.currency === (filter('currency_eq') ?? row.currency) &&
          (quantity === null || row.min_quantity === Number(quantity)) &&
          (above === null || row.min_quantity > Number(above)) &&
          (variants.length === 0 || variants.includes(row.variant_id ?? '')) &&
          !excluded.includes(variant.product_id ?? '') &&
          (search.length < 3 || text.includes(search))
        )
      })
      return HttpResponse.json(paged(matches, request))
    }),
    http.post('/api/v3/admin/prices/bulk_upsert', async ({ request }) => {
      await delay(300)
      const { prices } = (await request.json()) as { prices: PriceRowParams[] }
      const sameKey = (row: Price, sent: PriceRowParams) =>
        row.variant_id === sent.variant_id &&
        row.currency === sent.currency &&
        row.price_list_id === (sent.price_list_id ?? null) &&
        row.min_quantity === (sent.min_quantity ?? 1)
      for (const sent of prices) {
        const existing = stored.find((row) => sameKey(row, sent))
        if (sent.amount === null && (sent.min_quantity ?? 1) > 1) {
          stored = stored.filter((row) => row !== existing)
          continue
        }
        const template = existing ?? stored.find((row) => row.variant_id === sent.variant_id)
        const next: Price = {
          ...(template as Price),
          id: existing?.id ?? `price_9Nw${nextId++}Sv`,
          currency: sent.currency as Price['currency'],
          price_list_id: sent.price_list_id ?? null,
          min_quantity: sent.min_quantity ?? 1,
          amount: sent.amount,
          compare_at_amount: sent.compare_at_amount ?? existing?.compare_at_amount ?? null,
        }
        stored = existing ? stored.map((row) => (row === existing ? next : row)) : [...stored, next]
      }
      return HttpResponse.json({ price_count: prices.length })
    }),
  ]
}

/** A bulk price save Spree refuses, with the message it gives for a break dearer than the price below it. */
export const priceSaveRefused = [
  http.post('/api/v3/admin/prices/bulk_upsert', async () => {
    await delay(200)
    return HttpResponse.json(
      {
        error: {
          code: 'price_rises_with_quantity',
          message: 'A quantity break cannot cost more than the price a buyer pays below it',
          details: { ladders: [{ variant_id: 'variant_3Mq7Lk2c' }] },
        },
      },
      { status: 422 },
    )
  }),
]

/** A price list's prices still loading. */
export const pricesHeld = [
  http.get('/api/v3/admin/prices', async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),
]

export { onePage }
