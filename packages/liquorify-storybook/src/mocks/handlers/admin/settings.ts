import type {
  ApiKey,
  Catalog,
  Market,
  Media,
  OrderRoutingRule,
  Policy,
  ResourceTypeDefinition,
  StockLocation,
  Store,
  TaxProviderOption,
} from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { publishableKeys } from '../../../fixtures/admin/api-keys'
import {
  catalogs,
  customFieldResourceTypes,
  internalTaxProvider,
  markets,
  mediaLibrary,
  routingRules,
  routingRuleTypes,
  stockLocations,
} from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { onePage } from '../../page'

/** The store the page sits in, as the store provider reads it. */
export function storeRequest(store: Store = shellStore) {
  return [http.get('/api/v3/admin/store', () => HttpResponse.json(store))]
}

/** Answers a list request, filtering records by the `name_cont` and `id_in` the pickers send. */
function searchable<T extends { id: string; name: string }>(path: string, records: T[]) {
  return http.get(path, ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = (params.get('q[name_cont]') ?? params.get('name_cont') ?? '').toLowerCase()
    const ids = params.getAll('q[id_in][]').concat(params.getAll('id_in[]'))
    const found = records.filter(
      (record) =>
        (!query || record.name.toLowerCase().includes(query)) &&
        (ids.length === 0 || ids.includes(record.id)),
    )
    return HttpResponse.json(onePage(found))
  })
}

/** The store's catalogs, which a channel's default catalog is picked from. */
export function catalogList(records: Catalog[] = catalogs) {
  return [searchable('/api/v3/admin/catalogs', records)]
}

/**
 * The store's stock locations. The store address task asks for the store's
 * own active location that takes returns, so the filters it sends are applied.
 */
export function stockLocationList(records: StockLocation[] = stockLocations) {
  return [
    http.get('/api/v3/admin/stock_locations', ({ request }) => {
      const params = new URL(request.url).searchParams
      const returnsOnly = [...params.entries()].some(
        ([key, value]) => key.includes('returns_enabled_eq') && value === 'true',
      )
      const found = returnsOnly ? records.filter((record) => record.returns_enabled) : records
      return HttpResponse.json(onePage(found))
    }),
    http.patch('/api/v3/admin/stock_locations/:id', async ({ request, params }) => {
      const changes = (await request.json()) as Partial<StockLocation>
      const record = records.find((location) => location.id === params.id) ?? records[0]
      return HttpResponse.json({ ...record, ...changes })
    }),
  ]
}

/** The location lookup never answers, so the task stays loading. */
export const stockLocationsHeld = [
  http.get('/api/v3/admin/stock_locations', async () => {
    await delay('infinite')
  }),
]

export const stockLocationsFailed = [
  http.get('/api/v3/admin/stock_locations', () => new HttpResponse(null, { status: 500 })),
]

/** A channel's routing rules, the kinds that can be added, and changes to them that succeed. */
export function routingRuleRequests(
  rules: OrderRoutingRule[] = routingRules,
  types: ResourceTypeDefinition[] = routingRuleTypes,
) {
  return [
    http.get('/api/v3/admin/order_routing_rules/types', () =>
      HttpResponse.json({ data: types, meta: { count: types.length } }),
    ),
    http.get('/api/v3/admin/channels/:channelId/order_routing_rules', () =>
      HttpResponse.json(onePage(rules)),
    ),
    http.post('/api/v3/admin/channels/:channelId/order_routing_rules', async ({ request }) => {
      const { type } = (await request.json()) as { type: string }
      return HttpResponse.json(
        { ...rules[0], id: 'orr_9Mn8Bv7C', type, position: rules.length + 1 },
        { status: 201 },
      )
    }),
    http.patch('/api/v3/admin/channels/:channelId/order_routing_rules/:id', ({ params }) =>
      HttpResponse.json(rules.find((rule) => rule.id === params.id) ?? rules[0]),
    ),
    http.delete(
      '/api/v3/admin/channels/:channelId/order_routing_rules/:id',
      () => new HttpResponse(null, { status: 204 }),
    ),
  ]
}

/** Never answers, so the rules section stays loading. */
export const routingRulesHeld = [
  http.get('/api/v3/admin/order_routing_rules/types', () =>
    HttpResponse.json({ data: routingRuleTypes, meta: { count: routingRuleTypes.length } }),
  ),
  http.get('/api/v3/admin/channels/:channelId/order_routing_rules', async () => {
    await delay('infinite')
  }),
]

/** What a custom field definition may be attached to. */
export const resourceTypeList = [
  http.get('/api/v3/admin/custom_field_definitions/resource_types', () =>
    HttpResponse.json({ data: customFieldResourceTypes }),
  ),
]

/** The tax engines a market can use. */
export function taxProviderList(providers: TaxProviderOption[] = [internalTaxProvider]) {
  return [
    http.get('/api/v3/admin/tax_providers', () =>
      HttpResponse.json({ data: providers, meta: { count: providers.length } }),
    ),
  ]
}

/** The store's markets, which decide which tax engines are in use. */
export function marketList(records: Market[] = markets) {
  return [http.get('/api/v3/admin/markets', () => HttpResponse.json(onePage(records)))]
}

/** The path each kind of reason is listed under. */
const reasonPaths = {
  'return-reasons': 'return_reasons',
  'claim-reasons': 'claim_reasons',
  'refund-reasons': 'refund_reasons',
  'order-cancellation-reasons': 'order_cancellation_reasons',
  'tax-exemption-reasons': 'tax_exemption_reasons',
} as const

export type ReasonKind = keyof typeof reasonPaths

/** One kind of reason: its list, and changes to it that succeed. */
export function reasonRequests<T extends { id: string }>(kind: ReasonKind, records: T[]) {
  const path = `/api/v3/admin/${reasonPaths[kind]}`
  return [
    http.get(path, () => HttpResponse.json(onePage(records))),
    http.post(path, async ({ request }) =>
      HttpResponse.json({ ...records[0], ...((await request.json()) as object) }, { status: 201 }),
    ),
    http.patch(`${path}/:id`, async ({ request, params }) =>
      HttpResponse.json({
        ...(records.find((record) => record.id === params.id) ?? records[0]),
        ...((await request.json()) as object),
      }),
    ),
    http.delete(`${path}/:id`, () => new HttpResponse(null, { status: 204 })),
  ]
}

export function reasonsHeld(kind: ReasonKind) {
  return [
    http.get(`/api/v3/admin/${reasonPaths[kind]}`, async () => {
      await delay('infinite')
    }),
  ]
}

export function reasonsFailed(kind: ReasonKind) {
  return [
    http.get(`/api/v3/admin/${reasonPaths[kind]}`, () => new HttpResponse(null, { status: 500 })),
  ]
}

/** The media library, searched by file name as the picker does. */
export function mediaList(records: Media[] = mediaLibrary) {
  return [
    http.get('/api/v3/admin/media', ({ request }) => {
      const params = new URL(request.url).searchParams
      const query = (params.get('q[filename_cont]') ?? '').toLowerCase()
      return HttpResponse.json(
        onePage(records.filter((record) => record.filename?.toLowerCase().includes(query))),
      )
    }),
  ]
}

export const mediaHeld = [
  http.get('/api/v3/admin/media', async () => {
    await delay('infinite')
  }),
]

// The storefront's key with an invented value that does not look like a key.
const storefrontKeys = [{ ...publishableKeys[0], plaintext_token: 'sample-storefront-key' }]

/**
 * The storefront sheet's key and save. The sheet reuses the store's first
 * unrevoked publishable key; saving allows the address as an origin, then
 * records it on the store.
 */
export function storefrontRequests(keys: ApiKey[] = storefrontKeys, store: Store = shellStore) {
  return [
    http.get('/api/v3/admin/api_keys', () => HttpResponse.json(onePage(keys))),
    http.post('/api/v3/admin/allowed_origins', async ({ request }) =>
      HttpResponse.json(
        {
          id: 'ao_6Hn8Jm2K',
          ...((await request.json()) as object),
          created_at: '',
          updated_at: '',
        },
        { status: 201 },
      ),
    ),
    http.patch('/api/v3/admin/store', async ({ request }) =>
      HttpResponse.json({ ...store, ...((await request.json()) as Partial<Store>) }),
    ),
  ]
}

export const storefrontKeyHeld = [
  http.get('/api/v3/admin/api_keys', async () => {
    await delay('infinite')
  }),
]

export const storefrontKeyFailed = [
  http.get('/api/v3/admin/api_keys', () => new HttpResponse(null, { status: 500 })),
]

/** Keeps a policy list's requests answered for stories of the policies page's sheets. */
export function policyList(records: Policy[]) {
  return [http.get('/api/v3/admin/policies', () => HttpResponse.json(onePage(records)))]
}
