import { readFileSync } from 'node:fs'
import { type APIRequestContext, expect, request } from '@playwright/test'
import { admin } from './staff'

/**
 * The catalog part 1's captures need beyond Spree's sample catalog, added
 * through the Admin API only: a draft, an archived, a sold-out and a
 * backordered product, a product scheduled on one channel with an image, an
 * uploaded video with its poster, a video link and metadata, a second downloadable file
 * with limits of its own on the sample handbook, and a file in the media
 * library that no product uses. The pictures and the video are the invented
 * ones the stories use. Seeding again reuses them. Nothing in Spree's code,
 * tests or fixtures changes.
 */

export const products = {
  draft: 'Fidelity desk lamp',
  archived: 'Fidelity copper kettle',
  soldOut: 'Fidelity oak tray',
  backordered: 'Fidelity linen apron',
  scheduled: 'Fidelity stoneware mug',
} as const

/** Spree's sample digital product, whose downloadable file the sample data attaches. */
export const handbook = 'The Spree Commerce Handbook'
/** The sample product with variants, prices in two currencies and tags, opened on the product page. */
export const kettle = 'Electric Kettle 1.7L'

export const videoLink = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
export const scheduledFrom = '2027-03-01T09:00:00.000Z'
export const libraryFile = 'fidelity-unused-banner.png'
export const ownLimitsFile = 'fidelity-care-guide.pdf'
/** What an integration might have written on the scheduled mug, for the metadata card. */
export const mugMetadata = { supplier_code: 'CLAY-0042', kiln_batch: '2026-10' }

export interface Catalog {
  ids: Record<keyof typeof products, string> & { handbook: string; kettle: string }
}

export const fixture = (name: string) =>
  readFileSync(new URL(`../public/fixtures/${name}`, import.meta.url))

/** A one-page PDF, written here so no document from elsewhere is committed. */
export const pdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
)

type Headers = Record<string, string>

async function json<T>(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as T
}

export async function upload(
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

async function productId(api: APIRequestContext, headers: Headers, name: string) {
  const found = await json<{ data: { id: string }[] }>(
    await api.get(`/api/v3/admin/products?q[name_eq]=${encodeURIComponent(name)}&limit=1`, {
      headers,
    }),
  )
  return found.data[0]?.id
}

export async function seedCatalog(baseURL: string): Promise<Catalog> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const locations = await json<{ data: { id: string; name: string }[] }>(
      await api.get('/api/v3/admin/stock_locations?limit=100', { headers }),
    )
    const shop = locations.data.find((location) => location.name === 'Shop location')
    expect(shop, 'the sample stock location').toBeTruthy()
    const channels = await json<{ data: { id: string; name: string }[] }>(
      await api.get('/api/v3/admin/channels?limit=100', { headers }),
    )
    const channel = (name: string) => {
      const found = channels.data.find((item) => item.name === name)
      expect(found, `the ${name} channel`).toBeTruthy()
      return found?.id as string
    }

    const simple = async (
      name: string,
      status: string,
      amount: string,
      count: number,
      backorderable: boolean,
      extra: object = {},
    ) => {
      const existing = await productId(api, headers, name)
      if (existing) return existing
      const created = await json<{ id: string; default_variant_id: string }>(
        await api.post('/api/v3/admin/products', {
          headers,
          data: {
            name,
            status,
            prices: [{ amount, currency: 'USD' }],
            ...extra,
          },
        }),
      )
      await json(
        await api.post('/api/v3/admin/stock_levels/bulk_upsert', {
          headers,
          data: {
            stock_levels: [
              {
                variant_id: created.default_variant_id,
                stock_location_id: shop?.id,
                count_on_hand: count,
                backorderable,
              },
            ],
          },
        }),
      )
      return created.id
    }

    const draft = await simple(products.draft, 'draft', '24.00', 6, false)
    const archived = await simple(products.archived, 'archived', '59.00', 2, false)
    const soldOut = await simple(products.soldOut, 'active', '18.00', 0, false)
    const backordered = await simple(products.backordered, 'active', '32.00', 0, true)

    let scheduled = await productId(api, headers, products.scheduled)
    if (!scheduled) {
      const image = await upload(
        api,
        headers,
        'stoneware-mug.png',
        'image/png',
        fixture('product-clay.png'),
      )
      const video = await upload(
        api,
        headers,
        'glazing.webm',
        'video/webm',
        fixture('video-clay.webm'),
      )
      const poster = await upload(
        api,
        headers,
        'glazing-poster.png',
        'image/png',
        fixture('product-sand.png'),
      )
      scheduled = await simple(products.scheduled, 'active', '16.00', 12, false, {
        description: 'A stoneware mug, thrown by hand and glazed in clay.',
        tags: ['handmade', 'stoneware'],
        media: [
          { signed_id: image, alt: 'Stoneware mug, side view' },
          {
            signed_id: video,
            media_type: 'video',
            poster_signed_id: poster,
            alt: 'Glazing the mug',
          },
          {
            media_type: 'external_video',
            external_video_url: videoLink,
            alt: 'How the mug is thrown',
          },
        ],
        product_publications: [
          { channel_id: channel('Online Store'), published_at: scheduledFrom },
          { channel_id: channel('Wholesale') },
        ],
      })
    }

    const mug = await json<{ metadata: Record<string, unknown> | null }>(
      await api.get(`/api/v3/admin/products/${scheduled}`, { headers }),
    )
    if (!mug.metadata || Object.keys(mug.metadata).length === 0) {
      await json(
        await api.patch(`/api/v3/admin/products/${scheduled}`, {
          headers,
          data: { metadata: mugMetadata },
        }),
      )
    }

    const handbookId = (await productId(api, headers, handbook)) as string
    expect(handbookId, 'the sample handbook').toBeTruthy()
    const assets = await json<{ data: { filename: string | null }[] }>(
      await api.get(`/api/v3/admin/products/${handbookId}/digital_assets?limit=25`, { headers }),
    )
    if (!assets.data.some((asset) => asset.filename === ownLimitsFile)) {
      const signed = await upload(api, headers, ownLimitsFile, 'application/pdf', pdf, 'private')
      await json(
        await api.post(`/api/v3/admin/products/${handbookId}/digital_assets`, {
          headers,
          data: { signed_id: signed, authorized_clicks: 3, authorized_days: 14 },
        }),
      )
    }

    const library = await json<{ data: { filename?: string; alt?: string | null }[] }>(
      await api.get(`/api/v3/admin/media?limit=100&q[filename_cont]=${libraryFile}`, { headers }),
    )
    if (library.data.length === 0) {
      const signed = await upload(
        api,
        headers,
        libraryFile,
        'image/png',
        fixture('banner-lilac.png'),
      )
      await json(await api.post('/api/v3/admin/media', { headers, data: { signed_id: signed } }))
    }

    const kettleId = (await productId(api, headers, kettle)) as string
    expect(kettleId, 'the sample kettle').toBeTruthy()
    return {
      ids: {
        draft,
        archived,
        soldOut,
        backordered,
        scheduled,
        handbook: handbookId,
        kettle: kettleId,
      },
    }
  } finally {
    await api.dispose()
  }
}

/** Puts attributes a capture saved through a product's page back as they were. */
export async function updateProduct(baseURL: string, id: string, data: Record<string, unknown>) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    await json(await api.patch(`/api/v3/admin/products/${id}`, { headers, data }))
  } finally {
    await api.dispose()
  }
}

/** Writes one product's translations in one language, as the translations dialog saves them. */
export async function translateProduct(
  baseURL: string,
  id: string,
  locale: string,
  values: Record<string, string>,
) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    await json(
      await api.post('/api/v3/admin/translations/batch', {
        headers,
        data: {
          translations: [
            { resource_type: 'product', resource_id: id, values: { [locale]: values } },
          ],
        },
      }),
    )
  } finally {
    await api.dispose()
  }
}

/** Deletes every product with this exact name, such as a copy a capture made. */
export async function deleteProductsNamed(baseURL: string, name: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const found = await json<{ data: { id: string; name: string }[] }>(
      await api.get(`/api/v3/admin/products?q[name_eq]=${encodeURIComponent(name)}&limit=25`, {
        headers,
      }),
    )
    for (const product of found.data.filter((item) => item.name === name)) {
      const res = await api.delete(`/api/v3/admin/products/${product.id}`, { headers })
      expect(res.ok(), await res.text()).toBeTruthy()
    }
  } finally {
    await api.dispose()
  }
}
