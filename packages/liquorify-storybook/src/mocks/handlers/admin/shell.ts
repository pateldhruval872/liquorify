import type { Customer, MeResponse, Order, Product, Store, UpdateStatus } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import {
  dashboardCounters,
  noUpdate,
  shellStore,
  twoStoreAdmin,
} from '../../../fixtures/admin/shell'
import { onePage } from '../../page'

/**
 * What the store layout asks for on every page: the store, the counts behind
 * the navigation badges, and whether a newer release exists.
 */
export function shellRequests(update: UpdateStatus = noUpdate, store: Store = shellStore) {
  return [
    http.get('/api/v3/admin/store', () => HttpResponse.json(store)),
    http.get('/api/v3/admin/dashboard/counters', () =>
      HttpResponse.json({ channel_id: null, counters: dashboardCounters }),
    ),
    http.get('/api/v3/admin/updates', () => HttpResponse.json(update)),
  ]
}

/**
 * The store layout's requests with the store never answered, so the switcher
 * and the phone's top bar stay loading. Replaces `shellRequests`.
 */
export const storeHeld = [
  http.get('/api/v3/admin/store', async () => {
    await delay('infinite')
  }),
  ...shellRequests().slice(1),
]

/**
 * A signed-in admin whose `/me` never answers, so their permissions, and with
 * them the navigation, stay loading. Replaces the session's handlers.
 */
export const permissionsHeld = [
  http.post('/api/v3/admin/auth/refresh', () =>
    HttpResponse.json({ token: 'story-access-token', user: twoStoreAdmin }),
  ),
  http.get('/api/v3/admin/me', async () => {
    await delay('infinite')
  }),
]

interface Found {
  products?: Product[]
  orders?: Order[]
  customers?: Customer[]
}

/**
 * The command palette's searches: one list request per searchable resource the
 * reader may read, each answering what the story found for it.
 */
export function searchResults({ products = [], orders = [], customers = [] }: Found = {}) {
  const list = (path: string, records: unknown[]) =>
    http.get(`/api/v3/admin/${path}`, () => HttpResponse.json(onePage(records)))
  return [
    list('products', products),
    list('categories', []),
    list('collections', []),
    list('orders', orders),
    list('customers', customers),
    list('customer_groups', []),
    list('companies', []),
    list('sellers', []),
    list('promotions', []),
  ]
}

/**
 * Refuses a profile change with a field error, in the shape the Admin API
 * reports one. The browser tests' server refused none of the changes tried, so
 * the refusal is Rails' own length limit, worded as Rails words it.
 */
export const profileRefused = [
  http.patch('/api/v3/admin/me', () =>
    HttpResponse.json(
      {
        error: {
          code: 'validation_error',
          message: 'First name is too long (maximum is 100 characters)',
          details: {
            first_name: [
              {
                code: 'too_long',
                message: 'is too long (maximum is 100 characters)',
                specific: false,
                count: 100,
              },
            ],
          },
        },
      },
      { status: 422 },
    ),
  ),
]

/** Answers a profile save with the saved profile. */
export function profileSaved(me: MeResponse) {
  return [
    http.patch('/api/v3/admin/me', async ({ request }) => {
      const changes = (await request.json()) as Partial<MeResponse['user']>
      return HttpResponse.json({ ...me, user: { ...me.user, ...changes } })
    }),
  ]
}
