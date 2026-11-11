import { type APIRequestContext, expect, request } from '@playwright/test'
import { call, type Headers, type Json, list } from './orders'
import { admin } from './staff'

/**
 * What batch 12's captures and checks need, made through the Admin API in the
 * default store only: two companies, one with two divisions, two buyers who
 * are members, a pending invitation, an address book, a tax registration,
 * tax exemption certificates in each status the API can reach, the Wholesale
 * group with one buyer in it, a catalog for one company, and a Wholesale price
 * list for the group with a minimum quantity. Every name, address, number and
 * email is invented.
 *
 * Seeding again reuses what it made, found by name or email.
 */

export const companyNames = {
  group: 'Larkspur Hospitality Group',
  north: 'Larkspur North',
  south: 'Larkspur South',
  bistro: 'Cedar & Vine Bistro',
  empty: 'Quillon Provisions',
} as const

export const buyers = {
  wholesale: {
    email: 'fidelity-wholesale-buyer@example.com',
    first_name: 'Marisol',
    last_name: 'Ortega',
    phone: '555-0143',
  },
  member: {
    email: 'fidelity-company-member@example.com',
    first_name: 'Dev',
    last_name: 'Kapoor',
  },
  /** In the Wholesale group and in no company, so only the price list prices them. */
  groupOnly: {
    email: 'fidelity-wholesale-only@example.com',
    first_name: 'Tomas',
    last_name: 'Reyes',
  },
  /** An existing customer the add member dialog makes a member through the screen. */
  toAdd: {
    email: 'fidelity-company-newcomer@example.com',
    first_name: 'Ines',
    last_name: 'Duarte',
  },
} as const

/** An email with no account, so adding it makes an invitation. */
export const invitedEmail = 'fidelity-invited-buyer@example.com'

export const companyAddresses = {
  head: {
    label: 'Head office',
    company: companyNames.group,
    address1: '400 Larkspur Avenue',
    address2: 'Floor 3',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97205',
    phone: '555-0150',
  },
  warehouse: {
    label: 'Receiving dock',
    company: companyNames.group,
    address1: '18 Freight Row',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97217',
    phone: '555-0151',
  },
}

/**
 * Rows the address book row's stories show, for the comparison (G-96): an
 * unlabelled default for both and a plain one at the bistro, and a labelled
 * default for shipping only at the south division.
 */
export const comparisonAddresses = {
  bothNoLabel: {
    company: companyNames.bistro,
    address1: '22 Vine Street',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97209',
    default_billing: true,
    default_shipping: true,
  },
  plain: {
    company: companyNames.bistro,
    address1: '9 Cellar Lane',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97210',
    default_billing: false,
    default_shipping: false,
  },
  shippingOnly: {
    label: 'South loading bay',
    company: companyNames.south,
    address1: '75 Wharf Road',
    city: 'Salem',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97301',
    default_billing: false,
    default_shipping: true,
  },
}

export const companyTaxNumber = { kind: 'eu_vat', value: 'DE298765435' }

export const certificateNumbers = {
  pending: 'FID-RES-1001',
  verified: 'FID-RES-1002',
  revoked: 'FID-RES-1003',
  lapsed: 'FID-RES-1004',
} as const

/** The buyers' Store API password, set on the local browser-test server only. */
export const BUYER_PASSWORD = 'fidelity-buyer-password-123'

export const catalogName = 'Larkspur trade assortment'
/** The catalog prices its products this far below the store's. */
export const catalogAdjustment = '-20.0'
export const catalogSku = 'FID-TRADE-SAMPLER'
export const priceListName = 'Wholesale trade prices'
export const priceListMinimum = 6
export const priceListSku = 'FID-TONIC-CASE'

/** Two invented products on the store's online channel, so the Store API sells them. */
export const tradeProducts = [
  { name: 'Fidelity trade sampler', sku: catalogSku, amount: '20.00' },
  { name: 'Fidelity tonic water case', sku: priceListSku, amount: '10.00' },
] as const
export const priceListAmount = '7.50'

export interface SeededCompanies {
  group: Json
  north: Json
  south: Json
  bistro: Json
  empty: Json
  wholesaleBuyer: Json
  member: Json
  toAdd: Json
  invitation: Json
  wholesaleGroupId: string
  certificates: Record<keyof typeof certificateNumbers, Json>
  addresses: { head: Json; warehouse: Json }
  catalog: Json
  priceList: Json
  catalogVariant: Json
  listVariant: Json
}

async function findCompany(api: APIRequestContext, headers: Headers, name: string) {
  const found = await list(api, headers, `companies?q[name_eq]=${encodeURIComponent(name)}`)
  return found[0]
}

async function company(
  api: APIRequestContext,
  headers: Headers,
  fields: { name: string } & Record<string, unknown>,
) {
  return (
    (await findCompany(api, headers, fields.name)) ??
    (await call(api, headers, 'post', 'companies', fields))
  )
}

async function customer(
  api: APIRequestContext,
  headers: Headers,
  fields: { email: string } & Record<string, unknown>,
) {
  const [found] = await list(
    api,
    headers,
    `customers?q[email_eq]=${encodeURIComponent(fields.email)}`,
  )
  const password = { password: BUYER_PASSWORD, password_confirmation: BUYER_PASSWORD }
  if (found) return call(api, headers, 'patch', `customers/${found.id}`, password)
  return call(api, headers, 'post', 'customers', { ...fields, ...password })
}

async function member(api: APIRequestContext, headers: Headers, companyId: string, email: string) {
  const members = await list(api, headers, `companies/${companyId}/memberships`)
  const existing = members.find((each) => each.email === email)
  return (
    existing ??
    (await call(api, headers, 'post', `companies/${companyId}/memberships`, {
      customer_email: email,
    }))
  )
}

async function certificate(
  api: APIRequestContext,
  headers: Headers,
  companyId: string,
  existing: Json[],
  fields: Record<string, unknown> & { certificate_number: string },
) {
  return (
    existing.find((each) => each.certificate_number === fields.certificate_number) ??
    (await call(api, headers, 'post', `companies/${companyId}/tax_exemption_certificates`, fields))
  )
}

export async function seedCompanies(baseURL: string): Promise<SeededCompanies> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)

    const group = await company(api, headers, { name: companyNames.group, kind: 'company' })
    const north = await company(api, headers, {
      name: companyNames.north,
      kind: 'division',
      parent_id: group.id,
    })
    const south = await company(api, headers, {
      name: companyNames.south,
      kind: 'division',
      parent_id: group.id,
    })
    const bistro = await company(api, headers, {
      name: companyNames.bistro,
      kind: 'company',
      po_number_required: true,
    })
    const empty = await company(api, headers, { name: companyNames.empty, kind: 'company' })

    const wholesaleBuyer = await customer(api, headers, buyers.wholesale)
    const memberCustomer = await customer(api, headers, buyers.member)
    const toAdd = await customer(api, headers, buyers.toAdd)
    const groupOnly = await customer(api, headers, buyers.groupOnly)

    const groups = await list(api, headers, 'customer_groups')
    const wholesaleGroup = groups.find((each) => each.name === 'Wholesale')
    expect(wholesaleGroup, 'the Wholesale group Spree seeds').toBeTruthy()
    for (const buyer of [wholesaleBuyer, groupOnly]) {
      await call(api, headers, 'patch', `customers/${buyer.id}`, {
        customer_group_ids: [wholesaleGroup?.id],
      })
    }

    await member(api, headers, north.id, buyers.wholesale.email)
    await member(api, headers, group.id, buyers.member.email)
    await member(api, headers, bistro.id, buyers.member.email)

    const invitations = await list(api, headers, `companies/${group.id}/invitations`)
    const invitation =
      invitations.find((each) => each.email === invitedEmail && each.status === 'pending') ??
      (await call(api, headers, 'post', `companies/${group.id}/memberships`, {
        customer_email: invitedEmail,
      }))

    const addresses = await list(api, headers, `companies/${group.id}/addresses`)
    const head =
      addresses.find((each) => each.label === companyAddresses.head.label) ??
      (await call(api, headers, 'post', `companies/${group.id}/addresses`, {
        ...companyAddresses.head,
        default_billing: true,
        default_shipping: true,
      }))
    const warehouse =
      addresses.find((each) => each.label === companyAddresses.warehouse.label) ??
      (await call(api, headers, 'post', `companies/${group.id}/addresses`, {
        ...companyAddresses.warehouse,
        default_billing: false,
        default_shipping: false,
      }))

    for (const [owner, entry] of [
      [bistro, comparisonAddresses.bothNoLabel],
      [bistro, comparisonAddresses.plain],
      [south, comparisonAddresses.shippingOnly],
    ] as const) {
      const held = await list(api, headers, `companies/${owner.id}/addresses`)
      if (!held.some((each) => each.address1 === entry.address1)) {
        await call(api, headers, 'post', `companies/${owner.id}/addresses`, entry)
      }
    }

    const registrations = await list(api, headers, `companies/${group.id}/tax_identifiers`)
    if (!registrations.some((each) => each.value === companyTaxNumber.value)) {
      await call(api, headers, 'post', `companies/${group.id}/tax_identifiers`, companyTaxNumber)
    }

    const reasons = await list(api, headers, 'tax_exemption_reasons')
    const resale = reasons.find((each) => each.code === 'RESALE') ?? reasons[0]
    const existing = await list(api, headers, `companies/${group.id}/tax_exemption_certificates`)
    const base = { tax_exemption_reason_id: resale.id, country_code: 'US', state_code: 'OR' }
    const pending = await certificate(api, headers, group.id, existing, {
      ...base,
      certificate_number: certificateNumbers.pending,
      issuing_authority: 'Oregon Department of Revenue',
    })
    let verified = await certificate(api, headers, group.id, existing, {
      ...base,
      certificate_number: certificateNumbers.verified,
      issuing_authority: 'Oregon Department of Revenue',
      issued_at: '2026-01-15T00:00:00Z',
      expires_at: '2028-01-15T00:00:00Z',
    })
    if (verified.status === 'pending') {
      verified = await call(
        api,
        headers,
        'patch',
        `companies/${group.id}/tax_exemption_certificates/${verified.id}/verify`,
      )
    }
    let revoked = await certificate(api, headers, group.id, existing, {
      ...base,
      certificate_number: certificateNumbers.revoked,
    })
    if (revoked.status !== 'revoked') {
      revoked = await call(
        api,
        headers,
        'patch',
        `companies/${group.id}/tax_exemption_certificates/${revoked.id}/revoke`,
      )
    }
    let lapsed = await certificate(api, headers, group.id, existing, {
      ...base,
      certificate_number: certificateNumbers.lapsed,
      issued_at: '2024-03-01T00:00:00Z',
      expires_at: '2025-03-01T00:00:00Z',
    })
    if (lapsed.status === 'pending') {
      lapsed = await call(
        api,
        headers,
        'patch',
        `companies/${group.id}/tax_exemption_certificates/${lapsed.id}/verify`,
      )
    }

    const channels = await list(api, headers, 'channels?limit=100')
    const online = channels.find((each) => each.default)
    const [location] = await list(api, headers, 'stock_locations?limit=1')
    const variant = async (product: (typeof tradeProducts)[number]) => {
      const [found] = await list(
        api,
        headers,
        `variants?q[sku_eq]=${encodeURIComponent(product.sku)}`,
      )
      if (found) return found
      const made = await call(api, headers, 'post', 'products', {
        name: product.name,
        status: 'active',
        prices: [{ amount: product.amount, currency: 'USD' }],
        product_publications: [{ channel_id: online?.id }],
      })
      await call(api, headers, 'patch', `products/${made.id}/variants/${made.default_variant_id}`, {
        sku: product.sku,
      })
      await call(api, headers, 'post', 'stock_levels/bulk_upsert', {
        stock_levels: [
          {
            variant_id: made.default_variant_id,
            stock_location_id: location.id,
            count_on_hand: 100,
            backorderable: true,
          },
        ],
      })
      const [created] = await list(
        api,
        headers,
        `variants?q[sku_eq]=${encodeURIComponent(product.sku)}`,
      )
      return created
    }
    const catalogVariant = await variant(tradeProducts[0])
    const listVariant = await variant(tradeProducts[1])

    const catalogs = await list(api, headers, 'catalogs')
    let catalog = catalogs.find((each) => each.name === catalogName)
    if (!catalog) {
      catalog = await call(api, headers, 'post', 'catalogs', {
        name: catalogName,
        assignments: [{ assignable_type: 'company', assignable_id: group.id }],
        price_list: {
          price_adjustment_percentage: catalogAdjustment,
          adjust_compare_at: false,
          rules: [],
          price_adjustment_tiers: [],
        },
      })
      await call(api, headers, 'post', `catalogs/${catalog.id}/products`, {
        product_ids: [catalogVariant.product_id],
      })
      catalog = await call(api, headers, 'patch', `catalogs/${catalog.id}/activate`)
    }
    const inCatalog = await list(api, headers, `catalogs/${catalog.id}/products?limit=100`)
    if (!inCatalog.some((each) => each.id === catalogVariant.product_id)) {
      await call(api, headers, 'post', `catalogs/${catalog.id}/products`, {
        product_ids: [catalogVariant.product_id],
      })
    }

    const priceLists = await list(api, headers, 'price_lists')
    let priceList = priceLists.find((each) => each.name === priceListName)
    if (!priceList) {
      priceList = await call(api, headers, 'post', 'price_lists', {
        name: priceListName,
        match_policy: 'all',
        rules: [
          {
            type: 'customer_group_rule',
            preferences: { customer_group_ids: [wholesaleGroup?.id] },
          },
          { type: 'volume_rule', preferences: { min_quantity: priceListMinimum } },
        ],
        prices: [{ variant_id: listVariant.id, currency: 'USD', amount: priceListAmount }],
      })
      priceList = await call(api, headers, 'patch', `price_lists/${priceList.id}/activate`)
    } else {
      await call(api, headers, 'patch', `price_lists/${priceList.id}`, {
        prices: [{ variant_id: listVariant.id, currency: 'USD', amount: priceListAmount }],
      })
    }

    return {
      group,
      north,
      south,
      bistro,
      empty,
      wholesaleBuyer,
      member: memberCustomer,
      toAdd,
      invitation,
      wholesaleGroupId: wholesaleGroup?.id as string,
      certificates: { pending, verified, revoked, lapsed },
      addresses: { head, warehouse },
      catalog,
      priceList,
      catalogVariant,
      listVariant,
    }
  } finally {
    await api.dispose()
  }
}
