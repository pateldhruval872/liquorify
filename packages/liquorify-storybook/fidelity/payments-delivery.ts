import { randomUUID } from 'node:crypto'
import { type APIRequestContext, expect, request } from '@playwright/test'
import { admin } from './staff'

/**
 * The payment methods, tax categories and rates, delivery profiles, zones,
 * methods and package types batch 7's captures need, added to the
 * browser-test data through the Admin API only. Every record's name starts
 * with "Fidelity", and seeding again reuses them.
 *
 * Payments use Spree's test gateway (`bogus`) and cheque method only, so no
 * provider is called. The gateway's secret setting is made up at run time and
 * never written to a file: screenshots paint it out, and records name only
 * that it was set.
 */

type Headers = Record<string, string>
type Row = Record<string, unknown> & { id: string; name?: string }

const prefix = 'Fidelity'

export const paymentNames = {
  gateway: `${prefix} test gateway`,
  cheque: `${prefix} cheque`,
} as const

export const taxNames = {
  category: `${prefix} reduced rate`,
  country: `${prefix} Germany VAT`,
  state: `${prefix} California sales tax`,
  precise: `${prefix} New York reduced`,
} as const

export const deliveryNames = {
  profile: `${prefix} home goods`,
  splitGroup: `${prefix} east depot`,
  domestic: `${prefix} domestic`,
  germany: `${prefix} Germany`,
  westCoast: `${prefix} west coast`,
  eastCoast: `${prefix} east coast`,
  standard: `${prefix} standard`,
  express: `${prefix} express`,
  freight: `${prefix} pallet freight`,
  germanyTracked: `${prefix} Germany tracked`,
  twoPerson: `${prefix} two-person delivery`,
  pickup: `${prefix} collect in store`,
} as const

export const packageNames = {
  box: `${prefix} small box`,
  carton: `${prefix} shipping carton`,
  pallet: `${prefix} euro pallet`,
} as const

export interface PaymentsDelivery {
  profileId: string
  /** The profile's own first origin group, which ships from every location. */
  firstGroupId: string
  splitGroupId: string
  zoneIds: Record<'domestic' | 'germany' | 'westCoast' | 'eastCoast', string>
  methodIds: Record<
    'standard' | 'express' | 'freight' | 'germanyTracked' | 'twoPerson' | 'pickup',
    string
  >
  generalProfileId: string
  generalFirstGroupId: string
  digitalProfileId: string
  digitalMethodId: string
  shopLocationId: string
  packageTypeIds: Record<keyof typeof packageNames, string>
  taxRateIds: Record<'country' | 'state' | 'precise', string>
  taxCategoryId: string
}

async function list<T extends Row>(api: APIRequestContext, headers: Headers, path: string) {
  const res = await api.get(`/api/v3/admin/${path}${path.includes('?') ? '&' : '?'}limit=100`, {
    headers,
  })
  expect(res.ok(), `listing ${path}: ${res.status()}`).toBeTruthy()
  return ((await res.json()) as { data: T[] }).data
}

async function create(api: APIRequestContext, headers: Headers, path: string, data: object) {
  const res = await api.post(`/api/v3/admin/${path}`, { headers, data })
  const body = (await res.json()) as Row & { error?: { message?: string } }
  expect(res.status(), `creating in ${path}: ${res.status()} ${body.error?.message ?? ''}`).toBe(
    201,
  )
  return body
}

/** Finds a record by name in a list, or creates it, and answers its id. */
async function ensure(
  api: APIRequestContext,
  headers: Headers,
  path: string,
  name: string,
  data: object,
) {
  const found = (await list(api, headers, path)).find((record) => record.name === name)
  if (found) return found.id
  return (await create(api, headers, path, { name, ...data })).id
}

async function remove(api: APIRequestContext, headers: Headers, path: string, id: string) {
  const res = await api.delete(`/api/v3/admin/${path}/${id}`, { headers })
  expect([200, 204, 404], `deleting ${path}/${id}: ${res.status()}`).toContain(res.status())
}

async function withAdmin<T>(
  baseURL: string,
  work: (api: APIRequestContext, headers: Headers) => T,
) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    return await work(api, headers)
  } finally {
    await api.dispose()
  }
}

/**
 * The test gateway, on the storefront and active, and the cheque method,
 * switched off and for staff only. A provider is installed once per store, so
 * the add sheet offers neither while they exist (see `removePaymentMethods`).
 */
export const ensurePaymentMethods = (baseURL: string) =>
  withAdmin(baseURL, async (api, headers) => {
    const existing = await list(api, headers, 'payment_methods')
    if (!existing.some((method) => method.name === paymentNames.gateway)) {
      await create(api, headers, 'payment_methods', {
        name: paymentNames.gateway,
        type: 'bogus',
        description: 'Cards for trying checkout. Never charges anyone.',
        active: true,
        storefront_visible: true,
        preferences: { dummy_secret_key: `fidelity-${randomUUID()}` },
      })
    }
    if (!existing.some((method) => method.name === paymentNames.cheque)) {
      await create(api, headers, 'payment_methods', {
        name: paymentNames.cheque,
        type: 'check',
        active: false,
        storefront_visible: false,
      })
    }
  })

/**
 * Takes away the store's test gateway and cheque methods, so the add sheet
 * offers each provider the server registers, and the payment task is not done.
 */
export const removePaymentMethods = (baseURL: string) =>
  withAdmin(baseURL, async (api, headers) => {
    for (const method of await list(api, headers, 'payment_methods')) {
      if (['bogus', 'check'].includes(method.type as string)) {
        await remove(api, headers, 'payment_methods', method.id)
      }
    }
  })

/** Deletes records of a kind whose name starts with this, after a capture made one on the screen. */
export const removeNamed = (baseURL: string, path: string, name: string) =>
  withAdmin(baseURL, async (api, headers) => {
    for (const record of await list(api, headers, path)) {
      if (record.name?.startsWith(name)) await remove(api, headers, path, record.id)
    }
  })

/** Switches pickup on or off at the store's first location, which the pickup card lists. */
export const setPickup = (baseURL: string, locationId: string, enabled: boolean) =>
  withAdmin(baseURL, async (api, headers) => {
    const res = await api.patch(`/api/v3/admin/stock_locations/${locationId}`, {
      headers,
      data: { pickup_enabled: enabled },
    })
    expect(res.ok(), `pickup at ${locationId}: ${res.status()}`).toBeTruthy()
  })

/** Takes away the profile's split origin group, if a capture left it, so it ships from one group. */
export const removeSplitGroups = (baseURL: string, profileId: string, keep: string[]) =>
  withAdmin(baseURL, async (api, headers) => {
    const profile = (await (
      await api.get(`/api/v3/admin/delivery_profiles/${profileId}`, { headers })
    ).json()) as { origin_groups: { id: string }[] }
    for (const group of profile.origin_groups) {
      if (!keep.includes(group.id)) {
        await remove(api, headers, `delivery_profiles/${profileId}/origin_groups`, group.id)
      }
    }
  })

const flatRate = (amounts: Record<string, string>) => ({
  type: 'flat_rate',
  preferences: { amounts },
})

export const seedPaymentsDelivery = (baseURL: string): Promise<PaymentsDelivery> =>
  withAdmin(baseURL, async (api, headers) => {
    await ensurePaymentMethods(baseURL)

    const categories = await list(api, headers, 'tax_categories')
    const defaultCategory = categories.find((category) => category.is_default)
    expect(defaultCategory, 'the store has a default tax category').toBeTruthy()
    const taxCategoryId = await ensure(api, headers, 'tax_categories', taxNames.category, {
      tax_code: 'FIDELITY-REDUCED',
      description: 'Goods taxed at a reduced rate.',
    })
    const taxRateIds = {
      country: await ensure(api, headers, 'tax_rates', taxNames.country, {
        rate_percent: '19',
        tax_category_id: defaultCategory?.id,
        country_code: 'DE',
      }),
      state: await ensure(api, headers, 'tax_rates', taxNames.state, {
        rate_percent: '7.25',
        tax_category_id: defaultCategory?.id,
        country_code: 'US',
        state_code: 'CA',
      }),
      precise: await ensure(api, headers, 'tax_rates', taxNames.precise, {
        rate_percent: '4.375',
        tax_category_id: taxCategoryId,
        country_code: 'US',
        state_code: 'NY',
        show_rate_in_label: false,
      }),
    }

    const locations = await list(api, headers, 'stock_locations')
    const shopLocation = locations.find((location) => location.default) ?? locations[0]
    const depot = locations.find((location) => !location.default) ?? shopLocation

    const profiles = await list<Row & { origin_groups: Row[]; kind: string; default: boolean }>(
      api,
      headers,
      'delivery_profiles',
    )
    const general = profiles.find((profile) => profile.default)
    const digital = profiles.find((profile) => profile.kind === 'digital')
    expect(general && digital, 'the store has its default and digital profiles').toBeTruthy()

    let profile = profiles.find((item) => item.name === deliveryNames.profile)
    if (!profile) {
      const created = await create(api, headers, 'delivery_profiles', {
        name: deliveryNames.profile,
        kind: 'shipping',
      })
      profile = (await (
        await api.get(`/api/v3/admin/delivery_profiles/${created.id}`, { headers })
      ).json()) as Row & { origin_groups: Row[]; kind: string; default: boolean }
    }
    const profileId = profile.id
    const firstGroupId = profile.origin_groups[0].id
    const splitGroupId =
      profile.origin_groups.find((group) => group.name === deliveryNames.splitGroup)?.id ??
      (
        await create(api, headers, `delivery_profiles/${profileId}/origin_groups`, {
          name: deliveryNames.splitGroup,
          stock_location_ids: [depot.id],
        })
      ).id

    const inGroup = (groupId: string) => ({
      delivery_profile_id: profileId,
      delivery_origin_group_id: groupId,
    })
    const zoneIds = {
      domestic: await ensure(api, headers, 'delivery_zones', deliveryNames.domestic, {
        ...inGroup(firstGroupId),
        members: [{ member_type: 'country', country_code: 'US' }],
      }),
      germany: await ensure(api, headers, 'delivery_zones', deliveryNames.germany, {
        ...inGroup(firstGroupId),
        members: [{ member_type: 'country', country_code: 'DE' }],
      }),
      westCoast: await ensure(api, headers, 'delivery_zones', deliveryNames.westCoast, {
        ...inGroup(firstGroupId),
        members: [
          { member_type: 'state', country_code: 'US', state_code: 'CA' },
          { member_type: 'state', country_code: 'US', state_code: 'OR' },
          { member_type: 'state', country_code: 'US', state_code: 'WA' },
          { member_type: 'postal_code_prefix', country_code: 'US', postal_code_prefix: '941' },
        ],
      }),
      eastCoast: await ensure(api, headers, 'delivery_zones', deliveryNames.eastCoast, {
        ...inGroup(splitGroupId),
        members: [
          { member_type: 'state', country_code: 'US', state_code: 'NY' },
          { member_type: 'state', country_code: 'US', state_code: 'NJ' },
        ],
      }),
    }

    const inZone = (zone: keyof typeof zoneIds, groupId = firstGroupId) => ({
      ...inGroup(groupId),
      delivery_zone_id: zoneIds[zone],
    })
    const methodIds = {
      standard: await ensure(api, headers, 'delivery_methods', deliveryNames.standard, {
        ...inZone('domestic'),
        code: 'FID-STD',
        estimated_transit_business_days_min: 3,
        estimated_transit_business_days_max: 5,
        calculator: flatRate({ USD: '5.00', EUR: '4.50' }),
      }),
      express: await ensure(api, headers, 'delivery_methods', deliveryNames.express, {
        ...inZone('domestic'),
        estimated_transit_business_days_min: 1,
        estimated_transit_business_days_max: 2,
        calculator: flatRate({ USD: '15.00' }),
        rules: [
          { type: 'item_total_rule', preferences: { minimum_amount: '50' } },
          { type: 'weight_rule', preferences: { maximum_weight: '20' } },
        ],
      }),
      freight: await ensure(api, headers, 'delivery_methods', deliveryNames.freight, {
        ...inZone('domestic'),
        rate_provider: 'freight',
        markup_percent: '7.5',
        markup_flat: '2.50',
      }),
      germanyTracked: await ensure(api, headers, 'delivery_methods', deliveryNames.germanyTracked, {
        ...inZone('germany'),
        storefront_visible: false,
        calculator: flatRate({ EUR: '9.00' }),
      }),
      twoPerson: await ensure(api, headers, 'delivery_methods', deliveryNames.twoPerson, {
        ...inZone('eastCoast', splitGroupId),
        calculator: flatRate({ USD: '89.00' }),
      }),
      pickup: await ensure(api, headers, 'delivery_methods', deliveryNames.pickup, {
        ...inGroup(firstGroupId),
        fulfillment_provider: 'pickup',
      }),
    }

    const digitalMethod = (await list(api, headers, 'delivery_methods')).find(
      (method) => method.delivery_profile_id === digital?.id,
    )
    expect(digitalMethod, 'the digital profile has its digital method').toBeTruthy()

    const packageTypeIds = {
      box: await ensure(api, headers, 'package_types', packageNames.box, {
        kind: 'box',
        length: 20,
        width: 15,
        height: 10,
        dimensions_unit: 'cm',
        weight: 0.2,
        max_weight: 5,
        weight_unit: 'kg',
      }),
      carton: await ensure(api, headers, 'package_types', packageNames.carton, {
        kind: 'carton',
        length: 40,
        width: 30,
        height: 20,
        dimensions_unit: 'cm',
        weight: 0.5,
        max_weight: 20,
        weight_unit: 'kg',
      }),
      pallet: await ensure(api, headers, 'package_types', packageNames.pallet, {
        kind: 'pallet',
        length: 120,
        width: 80,
        height: 15,
        dimensions_unit: 'cm',
        weight: 25,
        max_weight: 1000,
        weight_unit: 'kg',
      }),
    }

    return {
      profileId,
      firstGroupId,
      splitGroupId,
      zoneIds,
      methodIds,
      generalProfileId: (general as Row).id,
      generalFirstGroupId: (general as Row & { origin_groups: Row[] }).origin_groups[0].id,
      digitalProfileId: (digital as Row).id,
      digitalMethodId: (digitalMethod as Row).id,
      shopLocationId: shopLocation.id,
      packageTypeIds,
      taxRateIds,
      taxCategoryId,
    }
  })
