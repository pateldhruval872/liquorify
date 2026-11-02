/**
 * What first-run setup gives a new store, checked against the two services
 * that build it at the pinned code: `Spree::Seeds::StoreResources` (each seed
 * under `spree/core/app/services/spree/seeds/`, run before setup) and
 * `Spree::Stores::ProvisionDefaults`
 * (`spree/core/app/services/spree/stores/provision_defaults.rb`, run by setup
 * from the merchant's country, currency and language), with the store's own
 * defaults and setup's renaming where those write a record. Each check names its
 * records by the identity its service finds them by, and compares the values
 * that service writes: a missing record, a record of another type or kind, a
 * wrong amount, currency or link, and a record no service writes all fail.
 *
 * The names are Spree's English ones (`spree/core/config/locales/en.yml`), as
 * the store was set up in English.
 */

export type Row = Record<string, unknown>

export interface Records {
  markets: Row[]
  stockLocations: Row[]
  deliveryProfiles: Row[]
  deliveryZones: Row[]
  deliveryMethods: Row[]
  packageTypes: Row[]
  taxCategories: Row[]
  taxExemptionReasons: Row[]
  channels: Row[]
  roles: Row[]
  paymentMethods: Row[]
  productTypes: Row[]
  customerGroups: Row[]
  returnReasons: Row[]
  claimReasons: Row[]
  refundReasons: Row[]
  cancellationReasons: Row[]
  commissionRates: Row[]
  sellerRequirements: Row[]
  apiKeys: Row[]
  savedReports: Row[]
  allowedOrigins: Row[]
  countries: Row[]
}

/** What the merchant answered at setup. */
export interface SetupAnswers {
  storeName: string
  country: { name: string; code: string; currency: string }
  locale: string
}

export interface ProvisioningCheck {
  id: string
  /** The service, and the file at the pinned code, that should have given the store this. */
  source: string
  what: string
  status: 'correct' | 'missing' | 'incorrect'
  /** Each difference from what the service writes; empty when correct. */
  problems: string[]
  expected: unknown
  /** What the store has, with no key, token or address. */
  found: unknown
  /** Records no provisioning service writes, in a store that also loaded the sample data. */
  addedBySampleData?: string[]
}

const seeds = 'spree/core/app/services/spree/seeds/'
const provision = 'ProvisionDefaults (spree/core/app/services/spree/stores/provision_defaults.rb)'
const seed = (name: string, file: string) => `StoreResources › ${name} (${seeds}${file})`

// The seeded allowed origin is a local address, which no record shows.
const seededOrigin = 'http://localhost'
const originLabel = (origin: unknown) =>
  origin === seededOrigin ? 'the seeded local origin' : 'another origin'

const show = (value: unknown) => JSON.stringify(value)
const same = (a: unknown, b: unknown) => show(a) === show(b)

/** Compares the fields `expected` names; the record's other fields are not the service's. */
function differences(label: string, expected: Row, found: Row): string[] {
  return Object.entries(expected)
    .filter(([field, value]) => !same(found[field], value))
    .map(
      ([field, value]) => `${label}: ${field} should be ${show(value)}, is ${show(found[field])}`,
    )
}

/**
 * Matches `found` to `expected` by `identity` (a field, or a function of the
 * row), so a missing record, a record no service writes and a wrong field
 * each name themselves.
 */
function compareSet(
  expected: Row[],
  found: Row[],
  identity: string | ((row: Row) => unknown),
  pick: (row: Row) => Row,
) {
  const key = typeof identity === 'string' ? (row: Row) => row[identity] : identity
  const missing: string[] = []
  const problems: string[] = []
  for (const want of expected) {
    const matches = found.filter((row) => same(key(row), key(want)))
    if (matches.length === 0) missing.push(`missing: ${show(key(want))}`)
    else problems.push(...differences(show(key(want)), want, pick(matches[0])))
    if (matches.length > 1) problems.push(`${show(key(want))}: ${matches.length} records, not one`)
  }
  for (const have of found) {
    if (!expected.some((want) => same(key(have), key(want)))) {
      problems.push(`not written by the service: ${show(pick(have))}`)
    }
  }
  return { missing, problems, found: found.map(pick) }
}

function result(
  id: string,
  source: string,
  what: string,
  expected: unknown,
  outcome: { missing: string[]; problems: string[]; found: unknown },
): ProvisioningCheck {
  const status =
    outcome.missing.length > 0 ? 'missing' : outcome.problems.length > 0 ? 'incorrect' : 'correct'
  return {
    id,
    source,
    what,
    status,
    problems: [...outcome.missing, ...outcome.problems],
    expected,
    found: outcome.found,
  }
}

const only =
  (...fields: string[]) =>
  (row: Row): Row =>
    Object.fromEntries(fields.map((field) => [field, row[field]]))

const zoneCountries = (zone: Row | undefined) =>
  ((zone?.members ?? []) as Row[])
    .filter((member) => member.member_type === 'country')
    .map((member) => member.country_code as string)
    .sort()

// The calculator's type and preferences, flattened so a wrong amount names itself.
const deliveryMethod = (row: Row): Row => {
  const { type, preferences } = (row.calculator ?? {}) as {
    type?: string
    preferences?: { amount?: string; currency?: string }
  }
  return {
    ...only(
      'name',
      'fulfillment_provider',
      'delivery_profile_id',
      'delivery_zone_id',
      'storefront_visible',
      'seller_id',
    )(row),
    calculator: type,
    amount: preferences?.amount,
    currency: preferences?.currency,
  }
}

// Kilograms per unit, from `Spree::Measurement::WEIGHT_IN_KILOGRAMS`:
// provision_package_type weighs the box at half a pound in the store's own
// weight unit, rounded to three places.
const kilogramsPer: Record<string, number> = { g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523125 }
const halfPoundIn = (unit: string) =>
  unit in kilogramsPer ? Math.round(((0.5 * 0.45359237) / kilogramsPer[unit]) * 1000) / 1000 : null

// Sizes and weights read as numbers, so `12.0` and `12` are the same box.
const packageType = (row: Row): Row => ({
  ...only('name', 'kind', 'default', 'dimensions_unit', 'weight_unit', 'seller_id')(row),
  ...Object.fromEntries(
    ['length', 'width', 'height', 'weight'].map((field) => [
      field,
      row[field] == null ? null : Number(row[field]),
    ]),
  ),
})

const notWritten = /^not written by the service: /

/**
 * For a store that also loaded Spree's sample data, whose own files add
 * delivery methods, package types, channels, payment methods and product types:
 * the records no provisioning service writes are listed apart rather than
 * counted as problems. A missing or wrong default still fails.
 */
export function withSampleData(checks: ProvisioningCheck[]): ProvisioningCheck[] {
  return checks.map((check) => {
    const added = check.problems.filter((problem) => notWritten.test(problem))
    if (added.length === 0) return check
    const problems = check.problems.filter((problem) => !notWritten.test(problem))
    return {
      ...check,
      status: problems.length === 0 ? 'correct' : check.status,
      problems,
      addedBySampleData: added.map((problem) => problem.replace(notWritten, '')),
    }
  })
}

/** Every default, checked; nothing is skipped when an earlier one fails. */
export function provisioningChecks(
  store: Row,
  records: Records,
  answers: SetupAnswers,
): ProvisioningCheck[] {
  const { country, locale } = answers
  const currency = country.currency
  const byName = (rows: Row[], name: string) => rows.find((row) => row.name === name)
  const general = byName(records.deliveryProfiles, 'General')
  const digitalProfile = byName(records.deliveryProfiles, 'Digital')
  const domestic = byName(records.deliveryZones, 'Domestic')
  const international = byName(records.deliveryZones, 'International')
  const wholesale = records.channels.find((row) => row.code === 'wholesale')
  const metric = store.unit_system === 'metric'
  const flatRate = (amount: string) => ({ calculator: 'flat_rate', amount, currency })

  const record = (
    id: string,
    source: string,
    what: string,
    expected: Row,
    found: Row | undefined,
    pick: (row: Row) => Row,
  ) => {
    const picked = found ? pick(found) : null
    return result(id, source, what, expected, {
      missing: picked ? [] : ['missing: no record matches'],
      problems: picked ? differences(id, expected, picked) : [],
      found: picked,
    })
  }

  const set = (
    id: string,
    source: string,
    what: string,
    expected: Row[],
    found: Row[],
    identity: string | ((row: Row) => unknown),
    pick: (row: Row) => Row,
  ) => result(id, source, what, expected, compareSet(expected, found, identity, pick))

  const storeFields = only(
    'name',
    'default_country_code',
    'default_currency',
    'default_locale',
    'admin_locale',
    'unit_system',
    'weight_unit',
  )

  const everywhereElse = records.countries
    .map((row) => row.iso as string)
    .filter((iso) => iso !== country.code)
    .sort()
  // Named by what differs from every other country, not as 239 codes.
  const everyOther = (zone: Row) => {
    const codes = zoneCountries(zone)
    const absent = everywhereElse.filter((iso) => !codes.includes(iso))
    const extra = codes.filter((iso) => !everywhereElse.includes(iso))
    if (absent.length === 0 && extra.length === 0) {
      return `every other country (${everywhereElse.length})`
    }
    return { absent, extra }
  }

  const methods = [
    {
      name: 'Standard',
      fulfillment_provider: 'manual',
      delivery_profile_id: general?.id ?? 'the General profile',
      delivery_zone_id: domestic?.id ?? 'the Domestic zone',
      storefront_visible: true,
      seller_id: null,
      ...flatRate('5.00'),
    },
    {
      name: 'International Shipping',
      fulfillment_provider: 'manual',
      delivery_profile_id: general?.id ?? 'the General profile',
      delivery_zone_id: international?.id ?? 'the International zone',
      storefront_visible: true,
      seller_id: null,
      ...flatRate('20.00'),
    },
    {
      name: 'Store Pickup',
      fulfillment_provider: 'pickup',
      delivery_profile_id: general?.id ?? 'the General profile',
      delivery_zone_id: null,
      storefront_visible: true,
      seller_id: null,
      ...flatRate('0.00'),
    },
    {
      name: 'Digital Delivery',
      fulfillment_provider: 'digital',
      delivery_profile_id: digitalProfile?.id ?? 'the Digital profile',
      delivery_zone_id: null,
      storefront_visible: true,
      seller_id: null,
      calculator: 'digital_delivery',
      amount: '0.00',
      currency,
    },
  ]
  // Each method is matched as its service finds it: pickup and digital
  // delivery by their provider, the two shipping methods by name.
  const methodIdentity = (row: Row) =>
    ['pickup', 'digital'].includes(row.fulfillment_provider as string)
      ? row.fulfillment_provider
      : row.name
  const method = (name: string) => {
    const want = methods.find((row) => row.name === name) as Row
    return records.deliveryMethods.find((row) => same(methodIdentity(row), methodIdentity(want)))
  }

  return [
    record(
      'store-name',
      'Setup (spree/api/app/controllers/spree/api/v3/admin/setup_controller.rb, adopt_default_store)',
      "The seeded store, renamed to the merchant's store name",
      { name: answers.storeName },
      store,
      storeFields,
    ),
    record(
      'store-locale',
      `${provision}, update_default_market and adopt_admin_locale`,
      "The store's country, currency and language, and the dashboard's language",
      {
        default_country_code: country.code,
        default_currency: currency,
        default_locale: locale,
        admin_locale: locale,
      },
      store,
      storeFields,
    ),
    set(
      'market',
      `${provision}, update_default_market`,
      'The default market, named after the country, in its currency and language',
      [
        {
          name: country.name,
          default: true,
          currency,
          default_locale: locale,
          country_codes: [country.code],
        },
      ],
      records.markets,
      'name',
      only('name', 'default', 'currency', 'default_locale', 'country_codes'),
    ),
    set(
      'stock-location',
      `${provision}, provision_stock_location and provision_pickup`,
      'The default stock location, in the country, active and open for pickup',
      [
        {
          name: 'Shop location',
          default: true,
          country_code: country.code,
          active: true,
          pickup_enabled: true,
          propagate_all_variants: false,
          seller_id: null,
        },
      ],
      records.stockLocations,
      'name',
      only(
        'name',
        'default',
        'country_code',
        'active',
        'pickup_enabled',
        'propagate_all_variants',
        'seller_id',
      ),
    ),
    set(
      'delivery-profiles',
      `Spree::Store#create_default_delivery_profile (spree/core/app/models/spree/store.rb), which ${provision} falls back on in provision_delivery_zones; ${seed('DigitalDelivery', 'digital_delivery.rb')}`,
      'The default shipping profile, and the digital profile',
      [
        { name: 'General', kind: 'shipping', default: true },
        { name: 'Digital', kind: 'digital', default: false },
      ],
      records.deliveryProfiles,
      'name',
      only('name', 'kind', 'default'),
    ),
    set(
      'delivery-zones',
      `${provision}, provision_delivery_zones`,
      'A domestic zone for the country and an international one for every other country, on the default profile',
      [
        {
          name: 'Domestic',
          description: country.name,
          delivery_profile_id: general?.id ?? 'the General profile',
          countries: [country.code],
        },
        {
          name: 'International',
          description: 'Everywhere else',
          delivery_profile_id: general?.id ?? 'the General profile',
          countries: `every other country (${everywhereElse.length})`,
        },
      ],
      records.deliveryZones.map((row) => ({
        ...row,
        countries: row.name === 'International' ? everyOther(row) : zoneCountries(row),
      })),
      'name',
      only('name', 'description', 'delivery_profile_id', 'countries'),
    ),
    record(
      'standard',
      `${provision}, provision_delivery_zones`,
      `Standard delivery in the domestic zone, a flat 5.00 ${currency}`,
      methods[0],
      method('Standard'),
      deliveryMethod,
    ),
    record(
      'international',
      `${provision}, provision_delivery_zones`,
      `International shipping in the international zone, a flat 20.00 ${currency}`,
      methods[1],
      method('International Shipping'),
      deliveryMethod,
    ),
    record(
      'pickup',
      `${provision}, provision_pickup`,
      `Store pickup on the default profile, free, in ${currency}, shown on the storefront`,
      methods[2],
      method('Store Pickup'),
      deliveryMethod,
    ),
    record(
      'digital-delivery',
      `${seed('DigitalDelivery', 'digital_delivery.rb')}; ${provision}, restate_seeded_calculators`,
      `Digital delivery on the digital profile, free, restated in ${currency}`,
      methods[3],
      method('Digital Delivery'),
      deliveryMethod,
    ),
    set(
      'delivery-methods',
      `${provision}; ${seed('DigitalDelivery', 'digital_delivery.rb')}`,
      'Those four delivery methods, and no other',
      methods.map((row) => only('name', 'fulfillment_provider')(row)),
      records.deliveryMethods,
      methodIdentity,
      only('name', 'fulfillment_provider'),
    ),
    set(
      'package-type',
      `${provision}, provision_package_type`,
      `A default box, sized in the store's ${metric ? 'metric' : 'imperial'} units`,
      [
        {
          name: 'Shipping box',
          kind: 'box',
          default: true,
          length: metric ? 30 : 12,
          width: metric ? 23 : 9,
          height: metric ? 10 : 4,
          dimensions_unit: metric ? 'cm' : 'in',
          weight: halfPoundIn(store.weight_unit as string),
          weight_unit: store.weight_unit,
          seller_id: null,
        },
      ],
      records.packageTypes.map(packageType),
      'name',
      packageType,
    ),
    set(
      'tax-categories',
      seed('TaxCategories', 'tax_categories.rb'),
      'Tax categories, Default the default',
      [
        { name: 'Default', is_default: true },
        { name: 'Non-taxable', is_default: false },
      ],
      records.taxCategories,
      'name',
      only('name', 'is_default'),
    ),
    set(
      'tax-exemption-reasons',
      seed('TaxExemptionReasons', 'tax_exemption_reasons.rb'),
      'Tax exemption reasons, each with its code',
      [
        ['RESALE', 'Resale'],
        ['GOVERNMENT', 'Government'],
        ['CHARITABLE', 'Charitable organization'],
        ['EDUCATIONAL', 'Educational institution'],
        ['MANUFACTURING', 'Manufacturing'],
        ['AGRICULTURAL', 'Agricultural'],
      ].map(([code, name]) => ({ code, name, active: true })),
      records.taxExemptionReasons,
      'code',
      only('code', 'name', 'active'),
    ),
    set(
      'channels',
      `${seed('Channels', 'channels.rb')}, with Spree::Stores::Channels#ensure_default_channel`,
      'The default channel, and the wholesale channel behind a login with no guest checkout',
      [
        { code: 'online', name: 'Online Store', default: true, active: true },
        {
          code: 'wholesale',
          name: 'Wholesale',
          default: false,
          active: true,
          storefront_access: 'login_required',
          guest_checkout: false,
        },
      ],
      records.channels,
      'code',
      only('code', 'name', 'default', 'active', 'storefront_access', 'guest_checkout'),
    ),
    set(
      'admin-role',
      seed('Roles', 'roles.rb'),
      "The store's admin role, which cannot be changed",
      [{ name: 'admin', mutable: false }],
      records.roles,
      'name',
      only('name', 'mutable'),
    ),
    set(
      'payment-methods',
      seed('PaymentMethods', 'payment_methods.rb'),
      'Store credit, the only payment method, active',
      [{ name: 'Store Credit', type: 'store_credit', description: 'Store Credit', active: true }],
      records.paymentMethods,
      'name',
      only('name', 'type', 'description', 'active'),
    ),
    set(
      'product-types',
      seed('ProductTypes', 'product_types.rb'),
      'The default product type, and the digital one on the digital profile',
      [
        { name: 'Default', delivery_profile_id: null },
        { name: 'Digital', delivery_profile_id: digitalProfile?.id ?? 'the Digital profile' },
      ],
      records.productTypes,
      'name',
      only('name', 'delivery_profile_id'),
    ),
    set(
      'customer-groups',
      seed('CustomerGroups', 'customer_groups.rb'),
      'The wholesale customer group',
      [{ name: 'Wholesale' }],
      records.customerGroups,
      'name',
      only('name'),
    ),
    set(
      'refund-reasons',
      `${seed('ReturnsEnvironment', 'returns_environment.rb')}, through Spree::RefundReason.return_processing_reason`,
      'The refund reason returns are processed with',
      [{ name: 'Return processing', active: true }],
      records.refundReasons,
      'name',
      only('name', 'active'),
    ),
    set(
      'return-reasons',
      seed('ReturnsEnvironment', 'returns_environment.rb'),
      'Return reasons',
      [
        'Better price available',
        'Missed estimated delivery date',
        'Missing parts or accessories',
        'Damaged/Defective',
        'Different from what was ordered',
        'Different from description',
        'No longer needed/wanted',
        'Accidental order',
        'Unauthorized purchase',
      ].map((name) => ({ name, active: true })),
      records.returnReasons,
      'name',
      only('name', 'active'),
    ),
    set(
      'claim-reasons',
      seed('ReturnsEnvironment', 'returns_environment.rb'),
      'Claim reasons',
      [
        'Arrived damaged',
        'Never arrived',
        'Wrong item sent',
        'Missing item from order',
        'Item not as described',
      ].map((name) => ({ name, active: true })),
      records.claimReasons,
      'name',
      only('name', 'active'),
    ),
    set(
      'cancellation-reasons',
      seed('ReturnsEnvironment', 'returns_environment.rb'),
      'Order cancellation reasons',
      [
        'Customer changed their mind',
        'Payment declined',
        'Suspected fraud',
        'Out of stock',
        'Duplicate order',
        'Staff error',
        'Order expired',
      ].map((name) => ({ name, active: true })),
      records.cancellationReasons,
      'name',
      only('name', 'active'),
    ),
    set(
      'commission-rate',
      seed('CommissionRates', 'commission_rates.rb'),
      "The marketplace's catch-all commission rate: a percentage of 0, disabled, at the bottom",
      [
        {
          code: 'marketplace-default',
          name: 'Marketplace default',
          kind: 'percentage',
          value: '0',
          enabled: false,
          position: records.commissionRates.length,
        },
      ],
      records.commissionRates,
      'code',
      only('code', 'name', 'kind', 'value', 'enabled', 'position'),
    ),
    set(
      'seller-requirements',
      `${seed('SellerRequirements', 'seller_requirements.rb')}, through Spree::SellerRequirement.provision_defaults`,
      'The seven default seller requirements, in order, each active and required',
      [
        'accept_terms',
        'complete_profile',
        'billing_address',
        'returns_address',
        'delivery_method',
        'package_type',
        'minimum_products',
      ].map((kind, index) => ({ kind, position: index + 1, active: true, required: true })),
      records.sellerRequirements,
      'kind',
      only('kind', 'position', 'active', 'required'),
    ),
    set(
      'api-keys',
      seed('ApiKeys', 'api_keys.rb'),
      'Publishable keys for the storefront and for the wholesale channel, neither revoked',
      [
        { name: 'Default', key_type: 'publishable', channel_id: null, revoked_at: null },
        {
          name: 'Storefront (Wholesale)',
          key_type: 'publishable',
          channel_id: wholesale?.id ?? 'the wholesale channel',
          revoked_at: null,
        },
      ],
      records.apiKeys,
      'name',
      // Never the key itself.
      only('name', 'key_type', 'channel_id', 'revoked_at'),
    ),
    set(
      'saved-reports',
      seed('SavedReports', 'saved_reports.rb'),
      'The 20 seeded reports',
      [
        'Sales over time',
        'Net sales over time',
        'Sales by channel',
        'Sales by market',
        'Sales by country',
        'Top products',
        'Top categories',
        'Top companies',
        'Top customers',
        'Product margin',
        'Returns over time',
        'First-time vs returning',
        'Seller payouts',
        'Payments over time',
        'Payments by method',
        'Failed payments',
        'Stock movement over time',
        'Sell-through by variant',
        'Orders by payment status',
        'Orders by fulfillment status',
      ].map((name) => ({ name, seeded: true })),
      records.savedReports,
      'name',
      only('name', 'seeded'),
    ),
    set(
      'allowed-origin',
      seed('AllowedOrigins', 'allowed_origins.rb'),
      'The seeded allowed origin',
      [{ origin: originLabel(seededOrigin) }],
      records.allowedOrigins.map((row) => ({ origin: originLabel(row.origin) })),
      'origin',
      only('origin'),
    ),
  ]
}

/** One line per check that is not correct. */
export function failures(checks: ProvisioningCheck[]): string[] {
  return checks
    .filter((check) => check.status !== 'correct')
    .map((check) => `${check.id} (${check.status}): ${check.problems.join('; ')}`)
}

/** Throws, naming every check that is not correct. */
export function assertProvisioned(checks: ProvisioningCheck[]): void {
  const failing = failures(checks)
  if (failing.length > 0) {
    throw new Error(
      `${failing.length} of ${checks.length} provisioning checks failed:\n${failing.join('\n')}`,
    )
  }
}
