import { type APIRequestContext, expect, request } from '@playwright/test'
import { admin } from './staff'

/**
 * The products, suppliers, stock transfers and purchase orders batch 6's
 * captures need, added to the browser-test data through the Admin API only,
 * between the browser tests' own two warehouses. Every record's name or
 * reference starts with "Fidelity", and seeding again reuses them: a document
 * already made for a state is found by its reference and kept as it is.
 */

type Headers = Record<string, string>
type Row = Record<string, unknown> & { id: string }

const prefix = 'Fidelity'

/** The browser tests' warehouses (`packages/dashboard/e2e/helpers.ts`). */
export const locationNames = {
  shop: 'Shop location',
  source: 'E2E Source Warehouse',
  destination: 'E2E Destination Warehouse',
} as const

export const productNames = {
  mug: `${prefix} speckled mug`,
  tote: `${prefix} canvas tote`,
} as const

export const skus = { mug: 'FID-MUG', tote: 'FID-TOTE' } as const

export const supplierNames = {
  /** Ordered from, so it cannot be deleted. */
  kilnworks: `${prefix} Kilnworks`,
  /** Never ordered from: the one whose delete is offered. */
  harbor: `${prefix} Harbor Canvas`,
} as const

export const transferStates = [
  'draft',
  'ready',
  'inTransit',
  'partial',
  'received',
  'over',
  'closedShort',
  'canceled',
] as const
export type TransferState = (typeof transferStates)[number]

export const orderStates = [
  'draft',
  'ordered',
  'late',
  'partial',
  'received',
  'over',
  'closedShort',
  'canceled',
] as const
export type OrderState = (typeof orderStates)[number]

/** Each document's reference, which is how a later run finds it again. */
export const transferReference = (state: TransferState) => `${prefix} transfer ${state}`
export const orderReference = (state: OrderState) => `${prefix} order ${state}`

export interface Inventory {
  locationIds: Record<keyof typeof locationNames, string>
  variantIds: Record<keyof typeof productNames, string>
  productIds: Record<keyof typeof productNames, string>
  supplierIds: Record<keyof typeof supplierNames, string>
  transferIds: Record<TransferState, string>
  transferNumbers: Record<TransferState, string>
  orderIds: Record<OrderState, string>
  orderNumbers: Record<OrderState, string>
}

async function ok<T>(response: Awaited<ReturnType<APIRequestContext['get']>>, what: string) {
  expect(response.ok(), `${what}: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

function client(api: APIRequestContext, headers: Headers) {
  const path = (rest: string) => `/api/v3/admin/${rest}`
  return {
    list: async <T extends Row>(rest: string) =>
      (
        await ok<{ data: T[] }>(
          await api.get(path(`${rest}${rest.includes('?') ? '&' : '?'}limit=100`), { headers }),
          `listing ${rest}`,
        )
      ).data,
    post: <T>(rest: string, data: object = {}) =>
      api.post(path(rest), { headers, data }).then((res) => ok<T>(res, `POST ${rest}`)),
    patch: <T>(rest: string, data: object = {}) =>
      api.patch(path(rest), { headers, data }).then((res) => ok<T>(res, `PATCH ${rest}`)),
  }
}

type Client = ReturnType<typeof client>
type Document = { id: string; number: string; reference: string | null; items: Row[] }

async function product(api: Client, key: keyof typeof productNames, amount: string) {
  const existing = await api.list<Row & { name: string; default_variant_id: string }>(
    `products?q[name_cont]=${encodeURIComponent(productNames[key])}`,
  )
  const found =
    existing.find((each) => each.name === productNames[key]) ??
    (await api.post<Row & { default_variant_id: string }>('products', {
      name: productNames[key],
      status: 'active',
      prices: [{ amount, currency: 'USD' }],
    }))
  await api.patch(`products/${found.id}/variants/${found.default_variant_id}`, { sku: skus[key] })
  return { productId: found.id, variantId: found.default_variant_id }
}

async function supplier(api: Client, name: string, fields: object) {
  const existing = (await api.list<Row & { name: string }>('suppliers')).find(
    (each) => each.name === name,
  )
  return existing?.id ?? (await api.post<Row>('suppliers', { name, ...fields })).id
}

/** What the dock counted for each line, by the line's position on the document. */
type Count = { accepted: number; rejected?: number; reason?: string }

const receive = (api: Client, path: string, document: Document, counts: Count[], extra = {}) =>
  api.post(`${path}/${document.id}/stock_receipts`, {
    items: counts.flatMap((count, index) =>
      count.accepted || count.rejected
        ? [
            {
              id: document.items[index].id,
              quantity_accepted: count.accepted,
              quantity_rejected: count.rejected ?? 0,
              rejection_reason: count.rejected ? count.reason : undefined,
            },
          ]
        : [],
    ),
    ...extra,
  })

export async function seedInventory(baseURL: string): Promise<Inventory> {
  const context = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(context)
    const api = client(context, headers)

    const locations = await api.list<Row & { name: string }>('stock_locations')
    const locationId = (name: string) => {
      const found = locations.find((location) => location.name === name)
      expect(found, `the ${name} location`).toBeTruthy()
      return found?.id as string
    }
    const locationIds = {
      shop: locationId(locationNames.shop),
      source: locationId(locationNames.source),
      destination: locationId(locationNames.destination),
    }

    const mug = await product(api, 'mug', '18.00')
    const tote = await product(api, 'tote', '30.00')

    const supplierIds = {
      kilnworks: await supplier(api, supplierNames.kilnworks, {
        contact_name: 'Maren Holt',
        email: 'orders@kilnworks.example',
        phone: '+1 503 555 0172',
        address1: '88 Foundry Lane',
        city: 'Portland',
        state_code: 'OR',
        country_code: 'US',
        postal_code: '97209',
        notes: 'Ships Tuesdays.',
      }),
      harbor: await supplier(api, supplierNames.harbor, { email: 'sales@harborcanvas.example' }),
    }

    // Deep enough at the source for every transfer this seeds to leave.
    await api.post('stock_levels/bulk_upsert', {
      stock_levels: [mug, tote].map(({ variantId }) => ({
        variant_id: variantId,
        stock_location_id: locationIds.source,
        count_on_hand: 500,
      })),
    })

    const transfers = await api.list<Document & Row>('stock_transfers?expand=items')
    const transferIds = {} as Record<TransferState, string>
    const transferNumbers = {} as Record<TransferState, string>
    for (const state of transferStates) {
      const reference = transferReference(state)
      let transfer = transfers.find((each) => each.reference === reference)
      if (!transfer) {
        const lines =
          state === 'over'
            ? [{ variant_id: mug.variantId, quantity_shipped: 10 }]
            : [
                { variant_id: mug.variantId, quantity_shipped: 12 },
                { variant_id: tote.variantId, quantity_shipped: 6 },
              ]
        const created = await api.post<Document>('stock_transfers?expand=items', {
          source_location_id: locationIds.source,
          destination_location_id: locationIds.destination,
          reference,
          notes: state === 'draft' ? 'Pack the mugs in the double-walled cartons.' : undefined,
          items: lines,
        })
        const path = `stock_transfers/${created.id}`
        if (state === 'ready') await api.patch(`${path}/mark_ready`)
        if (state !== 'draft' && state !== 'ready') await api.patch(`${path}/mark_in_transit`)
        if (['partial', 'received', 'closedShort'].includes(state)) {
          await receive(
            api,
            'stock_transfers',
            created,
            [{ accepted: 8, rejected: 1, reason: 'damaged' }, { accepted: 6 }],
            { reference: `${prefix} van 2, first drop`, notes: 'One mug chipped in the crate.' },
          )
        }
        if (state === 'received') {
          await receive(api, 'stock_transfers', created, [{ accepted: 3 }, { accepted: 0 }], {
            reference: `${prefix} van 2, second drop`,
          })
        }
        if (state === 'over') {
          await receive(api, 'stock_transfers', created, [{ accepted: 11 }])
        }
        if (state === 'closedShort') {
          await api.patch(`${path}/close`, {
            reason: 'Three mugs lost in transit; the carrier has the claim.',
          })
        }
        if (state === 'canceled') await api.patch(`${path}/cancel`, { on_in_transit: 'restock' })
        transfer = created
      }
      transferIds[state] = transfer.id
      transferNumbers[state] = transfer.number
    }

    const orders = await api.list<Document & Row>('purchase_orders?expand=items')
    const orderIds = {} as Record<OrderState, string>
    const orderNumbers = {} as Record<OrderState, string>
    for (const state of orderStates) {
      const reference = orderReference(state)
      let order = orders.find((each) => each.reference === reference)
      if (!order) {
        const late = state === 'late'
        const created = await api.post<Document>('purchase_orders?expand=items', {
          supplier_id: supplierIds.kilnworks,
          destination_location_id: locationIds.destination,
          currency: 'USD',
          expected_at: late ? '2026-10-20' : '2026-12-08',
          cancel_by: late ? '2026-10-28' : '2026-12-20',
          reference,
          notes: state === 'draft' ? 'Ask about the new speckled glaze.' : undefined,
          items:
            state === 'over'
              ? [{ variant_id: mug.variantId, quantity_ordered: 12, unit_cost: '6.50' }]
              : [
                  { variant_id: mug.variantId, quantity_ordered: 24, unit_cost: '6.50' },
                  { variant_id: tote.variantId, quantity_ordered: 20, unit_cost: '9.25' },
                ],
        })
        const path = `purchase_orders/${created.id}`
        if (state !== 'draft') await api.patch(`${path}/mark_ordered`)
        if (['partial', 'closedShort'].includes(state)) {
          await receive(
            api,
            'purchase_orders',
            created,
            [{ accepted: 12, rejected: 2, reason: 'damaged' }, { accepted: 0 }],
            { reference: `${prefix} packing slip 5531` },
          )
        }
        if (state === 'received') {
          await api.post(`${path}/stock_receipts`, { reference: `${prefix} packing slip 5540` })
        }
        if (state === 'over') await receive(api, 'purchase_orders', created, [{ accepted: 14 }])
        if (state === 'closedShort') {
          await api.patch(`${path}/close`, {
            reason: 'Kiln failure; the last mugs will not be made.',
          })
        }
        if (state === 'canceled') {
          await api.patch(`${path}/cancel`, { reason: 'Ordered twice by mistake.' })
        }
        order = created
      }
      orderIds[state] = order.id
      orderNumbers[state] = order.number
    }

    // Set last, after the deliveries above have added to it: at the
    // destination the mug is low and the tote is out but takes backorders.
    await api.post('stock_levels/bulk_upsert', {
      stock_levels: [
        {
          variant_id: mug.variantId,
          stock_location_id: locationIds.destination,
          count_on_hand: 3,
          backorderable: false,
        },
        {
          variant_id: tote.variantId,
          stock_location_id: locationIds.destination,
          count_on_hand: 0,
          backorderable: true,
        },
      ],
    })

    return {
      locationIds,
      variantIds: { mug: mug.variantId, tote: tote.variantId },
      productIds: { mug: mug.productId, tote: tote.productId },
      supplierIds,
      transferIds,
      transferNumbers,
      orderIds,
      orderNumbers,
    }
  } finally {
    await context.dispose()
  }
}
