import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, request } from '@playwright/test'
import { call, type Headers, type Json, list, orderCustomerEmail } from './orders'
import { admin } from './staff'

/**
 * What batch 10's captures need beyond Spree's sample customers and batch 8's
 * orders, made through the Admin API in the default store only: a VIP group, a
 * field defined for customers, the sample customer with orders given a note, a
 * group, a labelled second address and two tax numbers, a customer with
 * nothing added, an erased customer, and one customer for each theme that a
 * capture erases through the screen.
 *
 * Seeding again reuses what it made. An erased customer loses its email, so
 * its id is kept in `results/customers-batch-10.json`; the customers a capture
 * erases are made again whenever their email no longer finds them.
 */

const state = new URL('./results/customers-batch-10.json', import.meta.url).pathname

export const vipGroupName = 'VIP'
export const customerField = { key: 'pickup_day', label: 'Preferred pickup day' }
export const regularNote =
  '<p>Prefers a call before large orders ship.</p><p>Asked for the <strong>glaze samples</strong> to be held for the studio.</p>'

export const studioAddress = {
  label: 'Studio',
  first_name: 'Sarah',
  last_name: 'Johnson',
  company: 'Johnson Ceramics',
  address1: '1520 Kiln Street',
  address2: 'Unit 4',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97209',
  phone: '555-0186',
}

export const taxNumbers = [
  { kind: 'eu_vat', value: 'DE811907980' },
  { kind: 'gb_vat', value: 'GB987654321' },
]

export const newcomer = {
  email: 'fidelity-new-customer@example.com',
  first_name: 'Priya',
  last_name: 'Shah',
}

const toErase = {
  email: 'fidelity-erased-customer@example.com',
  first_name: 'Jordan',
  last_name: 'Lee',
  phone: '555-0177',
  accepts_email_marketing: true,
  tags: ['Trade'],
}

/** One per theme, so the light and dark captures each erase a customer of their own. */
export const eraseThroughScreen = (theme: 'light' | 'dark') => ({
  email: `fidelity-erase-${theme}@example.com`,
  first_name: 'Alex',
  last_name: theme === 'light' ? 'Morgan' : 'Rivera',
  phone: '555-0163',
})

/** The customer file the import captures upload: two invented customers. */
export const customerImportFile = `${[
  'email,first_name,last_name,phone,accepts_email_marketing,tags,company,address1,address2,city,province_code,country_code,zip',
  'fidelity-import-1@example.com,Noor,Haddad,555-0121,true,Imported,,410 Alder Street,,Portland,OR,US,97204',
  'fidelity-import-2@example.com,Tomas,Varga,555-0122,false,Imported;Trade,Varga Studio,77 Birch Avenue,Suite 2,Portland,OR,US,97211',
].join('\n')}\n`

export interface SeededCustomers {
  regular: Json
  newcomer: Json
  erased: Json
  eraseLight: Json
  eraseDark: Json
  vipGroupId: string
  customerFieldId: string
}

async function findByEmail(api: APIRequestContext, headers: Headers, email: string) {
  const [found] = await list(api, headers, `customers?q[email_eq]=${encodeURIComponent(email)}`)
  return found
}

async function customer(
  api: APIRequestContext,
  headers: Headers,
  fields: { email: string } & Record<string, unknown>,
) {
  return (
    (await findByEmail(api, headers, fields.email)) ??
    (await call(api, headers, 'post', 'customers', fields))
  )
}

export async function seedCustomers(baseURL: string): Promise<SeededCustomers> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const kept = existsSync(state)
      ? (JSON.parse(readFileSync(state, 'utf8')) as { erasedId?: string })
      : {}

    const groups = await list(api, headers, 'customer_groups')
    const vip =
      groups.find((group) => group.name === vipGroupName) ??
      (await call(api, headers, 'post', 'customer_groups', { name: vipGroupName }))

    const definitions = await list(api, headers, 'custom_field_definitions')
    const field =
      definitions.find(
        (item) => item.resource_type === 'customer' && item.key === customerField.key,
      ) ??
      (await call(api, headers, 'post', 'custom_field_definitions', {
        resource_type: 'customer',
        namespace: 'custom',
        key: customerField.key,
        label: customerField.label,
        field_type: 'short_text',
      }))

    // Spree's sample customer, who has batch 8's orders and store credit.
    const regular = await findByEmail(api, headers, orderCustomerEmail)
    await call(api, headers, 'patch', `customers/${regular.id}`, {
      internal_note: regularNote,
      customer_group_ids: [vip.id],
    })
    const addresses = await list(api, headers, `customers/${regular.id}/addresses`)
    const home =
      addresses.find((address) => address.label === 'Home') ??
      addresses.find((address) => address.is_default_shipping)
    // Both flags are always sent: Spree's address update takes a flag it is
    // not sent as a request to give that default up.
    if (home && (home.label !== 'Home' || !home.is_default_shipping || !home.is_default_billing)) {
      await call(api, headers, 'patch', `customers/${regular.id}/addresses/${home.id}`, {
        label: 'Home',
        is_default_shipping: true,
        is_default_billing: true,
      })
    }
    if (!addresses.some((address) => address.label === studioAddress.label)) {
      await call(api, headers, 'post', `customers/${regular.id}/addresses`, studioAddress)
    }
    const numbers = await list(api, headers, `customers/${regular.id}/tax_identifiers`)
    for (const number of taxNumbers) {
      if (!numbers.some((item) => item.kind === number.kind)) {
        await call(api, headers, 'post', `customers/${regular.id}/tax_identifiers`, number)
      }
    }

    const fresh = await customer(api, headers, newcomer)

    let erased = kept.erasedId
      ? await call(api, headers, 'get', `customers/${kept.erasedId}`).catch(() => undefined)
      : undefined
    if (!erased) {
      const made = await customer(api, headers, toErase)
      await call(api, headers, 'post', `customers/${made.id}/addresses`, {
        ...studioAddress,
        label: null,
        first_name: toErase.first_name,
        last_name: toErase.last_name,
        company: null,
      })
      erased = await call(api, headers, 'post', `customers/${made.id}/anonymize`)
    }

    const eraseLight = await customer(api, headers, eraseThroughScreen('light'))
    const eraseDark = await customer(api, headers, eraseThroughScreen('dark'))

    mkdirSync(new URL('./results/', import.meta.url).pathname, { recursive: true })
    writeFileSync(state, JSON.stringify({ erasedId: erased.id }, null, 2))

    return {
      regular: await call(api, headers, 'get', `customers/${regular.id}`),
      newcomer: fresh,
      erased,
      eraseLight,
      eraseDark,
      vipGroupId: vip.id,
      customerFieldId: field.id,
    }
  } finally {
    await api.dispose()
  }
}

/**
 * Points the regular customer's default addresses at the addresses with these
 * labels, sending both flags on each update, for a capture that moves one.
 */
export async function placeDefaults(
  baseURL: string,
  customerId: string,
  defaults: { shipping: string; billing: string },
) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const addresses = await list(api, headers, `customers/${customerId}/addresses`)
    const labelled = (label: string) => addresses.find((address) => address.label === label)
    const same = defaults.shipping === defaults.billing
    await call(
      api,
      headers,
      'patch',
      `customers/${customerId}/addresses/${labelled(defaults.shipping)?.id}`,
      {
        is_default_shipping: true,
        is_default_billing: same,
      },
    )
    if (!same) {
      await call(
        api,
        headers,
        'patch',
        `customers/${customerId}/addresses/${labelled(defaults.billing)?.id}`,
        {
          is_default_shipping: false,
          is_default_billing: true,
        },
      )
    }
  } finally {
    await api.dispose()
  }
}

/** Removes a tax number a capture added through the screen. */
export async function removeTaxNumber(baseURL: string, customerId: string, value: string) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const numbers = await list(api, headers, `customers/${customerId}/tax_identifiers`)
    for (const number of numbers.filter((item) => item.value === value)) {
      await call(api, headers, 'delete', `customers/${customerId}/tax_identifiers/${number.id}`)
    }
  } finally {
    await api.dispose()
  }
}
