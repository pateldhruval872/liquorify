import { type APIRequestContext, expect, request } from '@playwright/test'
import { fixture } from './catalog'
import { admin } from './staff'

/**
 * What part 2's captures need beyond Spree's sample catalog, added through the
 * Admin API only: a price list in each status Spree's sample data leaves out,
 * one with the superseded customer and customer group rules, catalogs priced
 * by a percentage with quantity tiers and by entered prices, an inactive
 * catalog with nothing in it, an automatic collection with two rules, a
 * category with a picture, a description and a custom
 * field, and an import left at its mapping step. Seeding again reuses what an
 * earlier run added. Nothing in Spree's code, tests or fixtures changes.
 */

export const priceLists = {
  /** Spree's sample list: active, 55 products, prices in USD and EUR. */
  wholesale: 'Wholesale',
  draft: 'Fidelity spring launch',
  inactive: 'Fidelity clearance',
  scheduled: 'Fidelity summer trade',
  audience: 'Fidelity hotel accounts',
} as const

export const catalogs = {
  /** Spree's sample catalog: inactive, normal prices, 20 products. */
  sample: 'Wholesale Assortment',
  percentage: 'Fidelity café trade',
  entered: 'Fidelity hotel contract',
  empty: 'Fidelity spring samplers',
} as const

export const collections = {
  manual: 'Best Sellers',
  automatic: 'Fidelity gift ideas',
} as const

export const category = 'Fidelity coffee corner'
export const categoryField = 'Buying guide'
export const categoryDescription =
  'Espresso machines and drip brewers for the morning routine, chosen for easy cleaning.'
export const scheduledFrom = '2027-06-01T00:00:00.000Z'
export const scheduledUntil = '2027-09-01T00:00:00.000Z'
/** The file left at the mapping step, so the imports list has an import in that status. */
export const mappingFile = 'fidelity-unfinished-products.csv'

export interface Merchandising {
  ids: {
    priceLists: Record<keyof typeof priceLists, string>
    catalogs: Record<keyof typeof catalogs, string>
    collections: Record<keyof typeof collections, string>
    category: string
    mappingImport: string
  }
}

type Headers = Record<string, string>
type Response = Awaited<ReturnType<APIRequestContext['get']>>

async function json<T>(response: Response) {
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as T
}

async function list<T extends { id: string }>(
  api: APIRequestContext,
  headers: Headers,
  path: string,
) {
  return (await json<{ data: T[] }>(await api.get(`/api/v3/admin/${path}`, { headers }))).data
}

async function byName(api: APIRequestContext, headers: Headers, path: string, name: string) {
  const found = await list<{ id: string; name: string }>(
    api,
    headers,
    `${path}?q[name_eq]=${encodeURIComponent(name)}&limit=1`,
  )
  return found[0]?.id
}

async function required(api: APIRequestContext, headers: Headers, path: string, name: string) {
  const id = await byName(api, headers, path, name)
  expect(id, `the sample ${path} "${name}"`).toBeTruthy()
  return id as string
}

export async function seedMerchandising(baseURL: string): Promise<Merchandising> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const product = (name: string) => required(api, headers, 'products', name)
    const products = async (...names: string[]) => Promise.all(names.map(product))
    const company = (name: string) => required(api, headers, 'companies', name)
    const group = (name: string) => required(api, headers, 'customer_groups', name)

    /**
     * Creates the record if it is missing, then brings it to the state the
     * captures need, so a run stopped part way is completed by the next.
     */
    const ensure = async (
      path: 'price_lists' | 'catalogs',
      name: string,
      data: object,
      then: (record: Record<string, unknown> & { id: string }) => Promise<void>,
    ) => {
      const id =
        (await byName(api, headers, path, name)) ??
        (
          await json<{ id: string }>(
            await api.post(`/api/v3/admin/${path}`, { headers, data: { name, ...data } }),
          )
        ).id
      await then(
        await json<Record<string, unknown> & { id: string }>(
          await api.get(`/api/v3/admin/${path}/${id}`, { headers }),
        ),
      )
      return id
    }
    const priceList = (
      name: string,
      data: object,
      then: (record: Record<string, unknown> & { id: string }) => Promise<void>,
    ) => ensure('price_lists', name, data, then)
    const transition = async (path: string, id: string, action: 'activate' | 'deactivate') => {
      await json(await api.patch(`/api/v3/admin/${path}/${id}/${action}`, { headers }))
    }
    const addProducts = async (path: string, id: string, ids: string[]) => {
      await json(
        await api.post(`/api/v3/admin/${path}/${id}/products`, {
          headers,
          data: { product_ids: ids },
        }),
      )
    }

    const customers = await list<{ id: string; email: string }>(
      api,
      headers,
      'customers?q[email_eq]=wholesale%40example.com&limit=1',
    )
    expect(customers[0], 'the sample wholesale customer').toBeTruthy()

    const draft = await priceList(
      priceLists.draft,
      {
        description: 'Introductory prices for the spring kitchen range.',
        rules: [{ type: 'volume_rule', preferences: { min_quantity: 6 } }],
      },
      async (record) => {
        if (record.products_count) return
        await addProducts(
          'price_lists',
          record.id,
          await products('Electric Kettle 1.7L', 'Temperature Control Kettle 1.7L'),
        )
      },
    )
    const inactive = await priceList(
      priceLists.inactive,
      { description: 'End-of-line floor care, no longer offered.' },
      async (record) => {
        if (record.status === 'inactive') return
        if (!record.products_count) {
          await addProducts(
            'price_lists',
            record.id,
            await products('Bagless Upright Vacuum', 'Cordless Stick Vacuum 18V'),
          )
        }
        if (record.status === 'draft') await transition('price_lists', record.id, 'activate')
        await transition('price_lists', record.id, 'deactivate')
      },
    )
    const scheduled = await priceList(
      priceLists.scheduled,
      {
        description: 'Summer prices for trade buyers in Europe.',
        starts_at: scheduledFrom,
        ends_at: scheduledUntil,
      },
      async ({ id, status }) => {
        if (status === 'scheduled') return
        const markets = await list<{ id: string; name: string }>(api, headers, 'markets')
        const europe = markets.find((market) => market.name === 'Europe')
        expect(europe, 'the sample Europe market').toBeTruthy()
        await json(
          await api.patch(`/api/v3/admin/price_lists/${id}`, {
            headers,
            data: {
              rules: [{ type: 'market_rule', preferences: { market_ids: [europe?.id] } }],
            },
          }),
        )
        await transition('price_lists', id, 'activate')
      },
    )
    // Spree no longer offers these two rule kinds for a new list, and keeps
    // them on lists that have them; written here to an existing list.
    const audience = await priceList(
      priceLists.audience,
      { description: 'Negotiated prices for hotel buyers.' },
      async ({ id, products_count }) => {
        if (products_count) return
        await json(
          await api.patch(`/api/v3/admin/price_lists/${id}`, {
            headers,
            data: {
              match_policy: 'any',
              rules: [
                { type: 'user_rule', preferences: { user_ids: [customers[0].id] } },
                {
                  type: 'customer_group_rule',
                  preferences: { customer_group_ids: [await group('Wholesale')] },
                },
              ],
            },
          }),
        )
        await addProducts(
          'price_lists',
          id,
          await products('Steam Iron 2400W', 'Professional Garment Steamer'),
        )
      },
    )

    const catalog = (
      name: string,
      data: object,
      then: (record: Record<string, unknown> & { id: string }) => Promise<void> = async () => {},
    ) => ensure('catalogs', name, data, then)

    const cafe = await catalog(
      catalogs.percentage,
      {
        description: 'Agreed terms for café accounts.',
        minimum_order_quantity: 6,
        order_multiple: 6,
        order_minimums: [{ currency: 'USD', amount: '150.00' }],
        assignments: [
          { assignable_type: 'company', assignable_id: await company('Acme EMEA') },
          { assignable_type: 'customer_group', assignable_id: await group('Wholesale') },
        ],
        price_list: {
          price_adjustment_percentage: '-15.0',
          price_adjustment_tiers: [
            { min_quantity: 24, percentage: '-20.0' },
            { min_quantity: 48, percentage: '-25.0' },
          ],
        },
      },
      async ({ id, active, products_count }) => {
        if (!products_count) {
          await addProducts(
            'catalogs',
            id,
            await products(
              'Automatic Espresso Machine',
              'Semi-Automatic Espresso Machine',
              'Drip Coffee Maker 1.5L',
            ),
          )
        }
        if (!active) await transition('catalogs', id, 'activate')
      },
    )

    const hotel = await catalog(
      catalogs.entered,
      {
        description: 'Contract prices for Acme Industrial.',
        assignments: [
          { assignable_type: 'company', assignable_id: await company('Acme Industrial') },
        ],
      },
      async ({ id, active, products_count }) => {
        if (active) return
        const members = await products('Steam Iron 2400W', 'Handheld Garment Steamer')
        if (!products_count) await addProducts('catalogs', id, members)
        const variants = (
          await Promise.all(
            members.map((member) =>
              list<{ id: string; is_master?: boolean }>(
                api,
                headers,
                `variants?q[product_id_eq]=${member}&limit=10`,
              ),
            ),
          )
        ).flat()
        await json(
          await api.patch(`/api/v3/admin/catalogs/${id}`, {
            headers,
            data: {
              price_list: {
                prices: variants.map((variant, index) => ({
                  variant_id: variant.id,
                  currency: 'USD',
                  amount: (49 + index * 5).toFixed(2),
                })),
              },
            },
          }),
        )
        await transition('catalogs', id, 'activate')
      },
    )

    const empty = await catalog(catalogs.empty, {
      description: 'Sampler boxes for the spring season, not yet offered.',
    })

    const automatic =
      (await byName(api, headers, 'collections', collections.automatic)) ??
      (
        await json<{ id: string }>(
          await api.post('/api/v3/admin/collections', {
            headers,
            data: {
              name: collections.automatic,
              description: 'Compact appliances, and anything on sale.',
              automatic: true,
              rules_match_policy: 'any',
              rules: [
                { type: 'tag', value: 'compact', match_policy: 'contains' },
                { type: 'sale', value: 'true', match_policy: 'is_equal_to' },
              ],
            },
          }),
        )
      ).id

    const definitions = await list<{ id: string; key: string; resource_type: string }>(
      api,
      headers,
      'custom_field_definitions?limit=100',
    )
    const definition =
      definitions.find((item) => item.resource_type === 'category' && item.key === 'buying_guide')
        ?.id ??
      (
        await json<{ id: string }>(
          await api.post('/api/v3/admin/custom_field_definitions', {
            headers,
            data: {
              resource_type: 'category',
              namespace: 'custom',
              key: 'buying_guide',
              label: categoryField,
              field_type: 'short_text',
            },
          }),
        )
      ).id

    const coffee =
      (await byName(api, headers, 'categories', category)) ??
      (await (async () => {
        const created = await json<{ id: string }>(
          await api.post('/api/v3/admin/categories', {
            headers,
            data: {
              name: category,
              parent_id: await required(api, headers, 'categories', 'Kitchen'),
              description: categoryDescription,
              custom_fields: [
                {
                  custom_field_definition_id: definition,
                  value: 'Pick a grinder before a machine.',
                },
              ],
            },
          }),
        )
        await addProducts(
          'categories',
          created.id,
          await products(
            'Automatic Espresso Machine',
            'Semi-Automatic Espresso Machine',
            'Drip Coffee Maker 1.5L',
          ),
        )
        return created.id
      })())
    const coffeeRecord = await json<{ image_url: string | null }>(
      await api.get(`/api/v3/admin/categories/${coffee}`, { headers }),
    )
    // Spree takes the picture on an update; sent with the create, it is not attached.
    if (!coffeeRecord.image_url) {
      await json(
        await api.patch(`/api/v3/admin/categories/${coffee}`, {
          headers,
          data: {
            image_signed_id: await upload(
              api,
              headers,
              'fidelity-coffee-corner.png',
              'image/png',
              fixture('product-sand.png'),
            ),
          },
        }),
      )
    }

    const imports = await list<{ id: string; status: string; filename?: string | null }>(
      api,
      headers,
      'imports?q[status_eq]=mapping&limit=10',
    )
    const mappingImport =
      imports[0]?.id ??
      (
        await json<{ id: string }>(
          await api.post('/api/v3/admin/imports', {
            headers,
            data: {
              type: 'products',
              attachment_signed_id: await upload(
                api,
                headers,
                mappingFile,
                'text/csv',
                Buffer.from(
                  'name,sku,price\nFidelity unfinished jug,FID-JUG,18.00\nFidelity unfinished cup,FID-CUP,6.00\n',
                ),
                'private',
              ),
            },
          }),
        )
      ).id

    return {
      ids: {
        priceLists: {
          wholesale: await required(api, headers, 'price_lists', priceLists.wholesale),
          draft,
          inactive,
          scheduled,
          audience,
        },
        catalogs: {
          sample: await required(api, headers, 'catalogs', catalogs.sample),
          percentage: cafe,
          entered: hotel,
          empty,
        },
        collections: {
          manual: await required(api, headers, 'collections', collections.manual),
          automatic,
        },
        category: coffee,
        mappingImport,
      },
    }
  } finally {
    await api.dispose()
  }
}

async function upload(
  api: APIRequestContext,
  headers: Headers,
  filename: string,
  contentType: string,
  bytes: Buffer,
  visibility: 'public' | 'private' = 'public',
) {
  const created = await json<{ signed_id: string }>(
    await api.post('/api/v3/admin/files', {
      headers,
      multipart: {
        filename,
        content_type: contentType,
        byte_size: String(bytes.length),
        visibility,
        file: { name: filename, mimeType: contentType, buffer: bytes },
      },
    }),
  )
  return created.signed_id
}

/** Writes fields of a record, such as putting back what a capture saved. */
export async function updateRecord(
  baseURL: string,
  path: 'categories' | 'collections' | 'catalogs' | 'price_lists',
  id: string,
  data: Record<string, unknown>,
) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    await json(await api.patch(`/api/v3/admin/${path}/${id}`, { headers, data }))
  } finally {
    await api.dispose()
  }
}

/** A draft price list with no rules and no products, which Spree refuses to activate. */
export const emptyPriceList = 'Fidelity empty list'

/** Creates a draft price list with only a name, or finds the one an earlier run left. */
export async function createPriceList(baseURL: string, name: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    return (
      (await byName(api, headers, 'price_lists', name)) ??
      (
        await json<{ id: string }>(
          await api.post('/api/v3/admin/price_lists', { headers, data: { name } }),
        )
      ).id
    )
  } finally {
    await api.dispose()
  }
}

/** Deletes every price list with this exact name. */
export async function deletePriceListsNamed(baseURL: string, name: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    let id = await byName(api, headers, 'price_lists', name)
    while (id) {
      const res = await api.delete(`/api/v3/admin/price_lists/${id}`, { headers })
      expect(res.ok(), await res.text()).toBeTruthy()
      id = await byName(api, headers, 'price_lists', name)
    }
  } finally {
    await api.dispose()
  }
}
