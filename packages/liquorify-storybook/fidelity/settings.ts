import { type APIRequestContext, expect, request } from '@playwright/test'
import { admin } from './staff'

/**
 * The store settings the batch 3 captures need, added to the browser-test
 * data through the Admin API only: an inactive sales channel, custom field
 * definitions of several types and owners, and a retired return reason and tax
 * exemption reason. The data has no catalog, and no reason in use, so those
 * states are captured as they are or by answering a request in the browser.
 * Seeding again reuses them.
 *
 * Each field names its namespace: the API refuses a definition without one,
 * although its request schema describes `custom` as the default.
 */

export const inactiveChannel = { name: 'Fidelity pop-up', code: 'fidelity-popup', active: false }

export const customFields = [
  {
    namespace: 'custom',
    label: 'Material',
    key: 'material',
    resource_type: 'product',
    field_type: 'short_text',
    storefront_visible: true,
  },
  {
    namespace: 'custom',
    label: 'Care instructions',
    key: 'care_instructions',
    resource_type: 'product',
    field_type: 'long_text',
    storefront_visible: true,
  },
  {
    namespace: 'custom',
    label: 'Release year',
    key: 'release_year',
    resource_type: 'product',
    field_type: 'number',
    storefront_visible: false,
  },
  {
    namespace: 'custom',
    label: 'Gift message',
    key: 'gift_message',
    resource_type: 'order',
    field_type: 'rich_text',
    storefront_visible: false,
  },
  {
    namespace: 'custom',
    label: 'Loyalty tier',
    key: 'loyalty_tier',
    resource_type: 'customer',
    field_type: 'short_text',
    storefront_visible: false,
  },
] as const

export const retiredReturnReason = { name: 'Fidelity retired reason', active: false }

export const retiredExemptionReason = {
  name: 'Fidelity retired exemption',
  code: 'FIDELITY_RETIRED',
  active: false,
}

export interface Settings {
  inactiveChannelId: string
  customFieldIds: Record<(typeof customFields)[number]['key'], string>
}

type Headers = Record<string, string>

async function list<T>(api: APIRequestContext, headers: Headers, path: string) {
  const res = await api.get(`/api/v3/admin/${path}?limit=100`, { headers })
  expect(res.ok(), `listing ${path}: ${res.status()}`).toBeTruthy()
  return ((await res.json()) as { data: T[] }).data
}

/** Finds a record by name, or creates it, and answers its id. */
async function ensure(
  api: APIRequestContext,
  headers: Headers,
  path: string,
  match: (record: Record<string, unknown>) => boolean,
  data: object,
) {
  const found = (await list<Record<string, unknown>>(api, headers, path)).find(match)
  if (found) return found.id as string
  const res = await api.post(`/api/v3/admin/${path}`, { headers, data })
  const refusal =
    res.status() === 201
      ? ''
      : ((await res.json()) as { error?: { message?: string } }).error?.message
  expect(res.status(), `creating in ${path}: ${res.status()} ${refusal}`).toBe(201)
  return ((await res.json()) as { id: string }).id
}

export async function seedSettings(baseURL: string): Promise<Settings> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const inactiveChannelId = await ensure(
      api,
      headers,
      'channels',
      (channel) => channel.code === inactiveChannel.code,
      inactiveChannel,
    )
    const customFieldIds = {} as Settings['customFieldIds']
    for (const field of customFields) {
      customFieldIds[field.key] = await ensure(
        api,
        headers,
        'custom_field_definitions',
        (definition) =>
          definition.key === field.key && definition.resource_type === field.resource_type,
        field,
      )
    }
    await ensure(
      api,
      headers,
      'return_reasons',
      (reason) => reason.name === retiredReturnReason.name,
      retiredReturnReason,
    )
    await ensure(
      api,
      headers,
      'tax_exemption_reasons',
      (reason) => reason.code === retiredExemptionReason.code,
      retiredExemptionReason,
    )
    return { inactiveChannelId, customFieldIds }
  } finally {
    await api.dispose()
  }
}

/** Puts the store's name back after a capture that saves it through the screen. */
export async function setStoreName(baseURL: string, name: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const res = await api.patch('/api/v3/admin/store', { headers, data: { name } })
    expect(res.ok(), `renaming the store: ${res.status()}`).toBeTruthy()
  } finally {
    await api.dispose()
  }
}
