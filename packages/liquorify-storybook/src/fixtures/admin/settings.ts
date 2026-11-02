import type {
  Catalog,
  Channel,
  ClaimReason,
  CustomFieldDefinition,
  CustomFieldResourceType,
  Market,
  Media,
  OrderCancellationReason,
  OrderRoutingRule,
  PermissionRule,
  Policy,
  RefundReason,
  ResourceTypeDefinition,
  ReturnReason,
  SetupCountry,
  SetupTask,
  StockLocation,
  Store,
  TaxExemptionReason,
  TaxProviderOption,
} from '@spree/admin-sdk'
import { shellStore } from './shell'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

// The store's setup checklist, in the order Spree lists its six tasks.
const taskNames = [
  'setup_address',
  'setup_payment_method',
  'add_products',
  'set_customer_support_email',
  'setup_taxes_collection',
  'setup_storefront',
]

/** The store with the named setup tasks done and the rest still to do. */
export function storeWithTasksDone(done: string[], fields: Partial<Store> = {}): Store {
  const setup_tasks: SetupTask[] = taskNames.map((name) => ({ name, done: done.includes(name) }))
  return { ...shellStore, ...fields, setup_tasks }
}

/** A store that has just been set up: nothing done yet. */
export const freshStore = storeWithTasksDone([])

/** Every task done, so the checklist leaves the navigation. */
export const setUpStore = storeWithTasksDone(taskNames, {
  storefront_url: 'https://shop.example.com',
})

// Spree seeds four policies with an empty body; the stories give two of them text.
function policy(id: string, name: string, slug: string, body: string): Policy {
  return { id, name, slug, body, body_html: body, created_at: created, updated_at: updated }
}

export const policies: Policy[] = [
  policy(
    'pol_2Hq8Lm4N',
    'Privacy Policy',
    'privacy-policy',
    '<p>We collect only what we need to deliver your order.</p>',
  ),
  policy(
    'pol_6Tz3Vb7K',
    'Returns Policy',
    'returns-policy',
    '<h2>Returns</h2><p>Unused items can be returned within <strong>30 days</strong> of delivery.</p><ul><li>Keep the original packaging.</li><li>Include the order number.</li></ul>',
  ),
  policy('pol_9Ws5Xc1R', 'Shipping Policy', 'shipping-policy', ''),
  policy('pol_4Jd7Fg2P', 'Terms of Service', 'terms-of-service', ''),
]

export const returnsPolicy = policies[1]

function channel(id: string, name: string, code: string, fields: Partial<Channel> = {}): Channel {
  return {
    id,
    name,
    code,
    active: true,
    default: false,
    storefront_access: null,
    guest_checkout: null,
    created_at: created,
    updated_at: updated,
    order_routing_strategy: null,
    stock_location_ids: [],
    default_catalog_id: null,
    ...fields,
  }
}

/** Spree seeds the default channel and Wholesale; a store adds its own beside them. */
export const channels: Channel[] = [
  channel('ch_3Kd9Lp2W', 'Online Store', 'online', { default: true }),
  channel('ch_8Vn4Qs6T', 'Wholesale', 'wholesale', {
    storefront_access: 'login_required',
    guest_checkout: false,
  }),
  channel('ch_5Bx7Hj1M', 'Pop-up market', 'pop-up-market', { active: false }),
]

/** Wholesale with store settings of its own, a default catalog and two locations. */
export const overriddenChannel = channel('ch_8Vn4Qs6T', 'Wholesale', 'wholesale', {
  storefront_access: 'login_required',
  guest_checkout: false,
  order_routing_strategy: 'rules',
  default_catalog_id: 'cat_7Gh2Jk4L',
  stock_location_ids: ['sloc_4Rt6Yu8I', 'sloc_2Wq5Er7T'],
})

function catalog(id: string, name: string, fields: Partial<Catalog> = {}): Catalog {
  return {
    id,
    name,
    description: null,
    active: true,
    position: 1,
    metadata: {},
    minimum_order_quantity: null,
    order_multiple: null,
    created_at: created,
    updated_at: updated,
    products_count: 0,
    pricing_strategy: 'base',
    ...fields,
  }
}

export const catalogs: Catalog[] = [
  catalog('cat_7Gh2Jk4L', 'Trade catalog', { products_count: 48, position: 1 }),
  catalog('cat_3Df6Gh8J', 'Retail catalog', { products_count: 112, position: 2 }),
]

function stockLocation(
  id: string,
  name: string,
  fields: Partial<StockLocation> = {},
): StockLocation {
  return {
    id,
    name,
    address1: null,
    city: null,
    zipcode: null,
    country_code: 'US',
    country_name: 'United States',
    state_code: null,
    state_text: null,
    pickup_ready_in_minutes: null,
    pickup_instructions: null,
    external_references: {},
    admin_name: null,
    address2: null,
    state_name: null,
    phone: null,
    company: null,
    active: true,
    default: false,
    backorderable_default: false,
    propagate_all_variants: false,
    kind: 'warehouse',
    pickup_enabled: false,
    pickup_stock_policy: 'local',
    returns_enabled: true,
    created_at: created,
    updated_at: updated,
    seller_id: null,
    seller_name: null,
    ...fields,
  }
}

/** The location Spree provisions at setup, before anyone gives it an address. */
export const shopLocation = stockLocation('sloc_4Rt6Yu8I', 'Shop location', { default: true })

/** The same location once the store address task is done. */
export const addressedLocation = stockLocation('sloc_4Rt6Yu8I', 'Shop location', {
  default: true,
  company: 'Sample Store',
  address1: '410 Market Street',
  address2: 'Unit 2',
  city: 'San Francisco',
  zipcode: '94111',
  state_code: 'CA',
  state_text: 'CA',
  state_name: 'California',
  phone: '+1 415 555 0134',
})

export const stockLocations: StockLocation[] = [
  addressedLocation,
  stockLocation('sloc_2Wq5Er7T', 'East coast depot', { returns_enabled: false }),
  stockLocation('sloc_9Op1As3D', 'Downtown counter', {
    kind: 'store',
    pickup_enabled: true,
    returns_enabled: false,
  }),
]

/** The three rule kinds Spree registers. None of them has settings of its own. */
export const routingRuleTypes: ResourceTypeDefinition[] = [
  {
    type: 'default_location',
    label: 'Default location',
    description: 'Prefer the stock location marked as default',
    schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'minimize_splits',
    label: 'Minimize splits',
    description:
      'Prefer the location that can fulfill the most items on its own, avoiding split shipments',
    schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'preferred_location',
    label: 'Preferred location',
    description: 'Fulfill from the location pinned on the order, when one is set',
    schema: { type: 'object', properties: {}, additionalProperties: false },
  },
]

/**
 * A rule kind an extension registers, with a setting of its own. The section
 * shows a settings button only for such a kind; Spree's three have none.
 */
export const extensionRuleType: ResourceTypeDefinition = {
  type: 'nearest_location',
  label: 'Nearest location',
  description: 'Prefer the closest location within a distance',
  schema: {
    type: 'object',
    properties: { max_distance_km: { type: 'integer', default: 50 } },
    additionalProperties: false,
  },
}

function routingRule(
  id: string,
  type: string,
  position: number,
  fields: Partial<OrderRoutingRule> = {},
): OrderRoutingRule {
  return {
    id,
    position,
    active: true,
    created_at: created,
    updated_at: updated,
    type,
    channel_id: overriddenChannel.id,
    preferences: {},
    ...fields,
  }
}

export const routingRules: OrderRoutingRule[] = [
  routingRule('orr_6Yh2Nm8B', 'preferred_location', 1),
  routingRule('orr_3Gt5Vc9X', 'minimize_splits', 2),
  routingRule('orr_8Lk4Jh1F', 'default_location', 3, { active: false }),
]

export const extensionRoutingRule = routingRule('orr_2Qa7Sd5G', 'nearest_location', 1, {
  preferences: { max_distance_km: 80 },
})

function definition(
  id: string,
  label: string,
  key: string,
  resource_type: string,
  field_type: CustomFieldDefinition['field_type'],
  fields: Partial<CustomFieldDefinition> = {},
): CustomFieldDefinition {
  return {
    id,
    namespace: 'custom',
    key,
    label,
    field_type,
    storefront_visible: false,
    searchable: false,
    sortable: false,
    filter_key: `custom.${key}`,
    created_at: created,
    updated_at: updated,
    resource_type,
    ...fields,
  }
}

export const customFieldDefinitions: CustomFieldDefinition[] = [
  definition('cfd_5Rt8Yu2I', 'Care instructions', 'care_instructions', 'product', 'long_text', {
    storefront_visible: true,
    searchable: true,
  }),
  definition('cfd_7Ui9Op3L', 'Release year', 'release_year', 'product', 'number', {
    storefront_visible: true,
    sortable: true,
  }),
  definition('cfd_2As4Df6G', 'Loyalty tier', 'loyalty_tier', 'customer', 'short_text'),
  definition('cfd_9Hj1Kl3Z', 'Gift message', 'gift_message', 'order', 'rich_text'),
]

/** The first few of the 32 resources Spree registers, as its endpoint names them. */
export const customFieldResourceTypes: CustomFieldResourceType[] = [
  { resource_type: 'address', name: 'Addresses' },
  { resource_type: 'category', name: 'Categories' },
  { resource_type: 'customer', name: 'Customers' },
  { resource_type: 'order', name: 'Orders' },
  { resource_type: 'product', name: 'Products' },
  { resource_type: 'store', name: 'Stores' },
  { resource_type: 'variant', name: 'Variants' },
]

function market(id: string, name: string, fields: Partial<Market>): Market {
  return {
    id,
    name,
    currency: 'USD',
    default_locale: 'en',
    tax_inclusive: false,
    default: false,
    country_codes: [],
    supported_locales: ['en'],
    created_at: created,
    updated_at: updated,
    tax_provider: null,
    ...fields,
  }
}

export const markets: Market[] = [
  market('mkt_4Ws6Ed8R', 'North America', {
    default: true,
    country_codes: ['US', 'CA'],
    supported_locales: ['en', 'fr'],
  }),
  market('mkt_7Tg9Yh2U', 'Europe', {
    currency: 'EUR',
    default_locale: 'de',
    country_codes: ['DE', 'FR'],
    supported_locales: ['de', 'fr'],
    tax_inclusive: true,
  }),
  market('mkt_3Ik5Ol7P', 'United Kingdom', {
    currency: 'GBP',
    country_codes: ['GB'],
    tax_inclusive: true,
  }),
]

/** Spree's own tax engine, as the browser-test server describes it. */
export const internalTaxProvider: TaxProviderOption = {
  id: 'internal',
  name: 'Spree tax rates',
  available: true,
  default: true,
  exemption_reason_codes: null,
  unsupported_capabilities: [
    {
      key: 'us_local_tax',
      label: 'US local tax',
      description:
        'County, city and district rates are not applied — only the rates configured per country or state. Sales into US states that levy local tax will be under-collected.',
    },
    {
      key: 'reverse_charge',
      label: 'EU reverse charge',
      description:
        'A VAT-registered business buyer is charged tax instead of receiving a zero-rated invoice. Their registration number is recorded but does not change the tax.',
    },
    {
      key: 'oss_thresholds',
      label: 'Distance-selling thresholds',
      description:
        'Crossing the EU-wide cross-border threshold does not switch to destination-country rates automatically, because it depends on annual turnover across every destination rather than on any single order.',
    },
    {
      key: 'proportional_delivery_tax',
      label: 'Proportional delivery tax',
      description:
        'Delivery is taxed at the single rate its delivery method names, not split across the rates of the goods being delivered. A basket mixing tax rates collects the wrong amount on delivery.',
    },
  ],
}

/**
 * A tax engine a provider gem would register, connected, which reads
 * exemption codes of its own. No such gem is installed at the pinned
 * revision, so only a story shows it.
 */
export const connectedEngine: TaxProviderOption = {
  id: 'sample_engine',
  name: 'Sample tax engine',
  available: true,
  default: false,
  unsupported_capabilities: [],
  exemption_reason_codes: [
    { value: 'A', label: 'Federal government' },
    { value: 'G', label: 'Resale' },
    { value: 'E', label: 'Charitable organization' },
  ],
}

/** The same engine before its credentials are given. */
export const unconnectedEngine: TaxProviderOption = {
  ...connectedEngine,
  available: false,
}

function reason<T extends ReturnReason>(id: string, name: string, fields: Partial<T> = {}): T {
  return {
    id,
    name,
    active: true,
    created_at: created,
    updated_at: updated,
    can_be_deleted: true,
    ...fields,
  } as T
}

// The first of each list Spree seeds, with one in use and one retired.
export const returnReasons: ReturnReason[] = [
  reason('rar_1Qw3Er5T', 'Damaged/Defective', { can_be_deleted: false }),
  reason('rar_2Yu4Io6P', 'Different from what was ordered'),
  reason('rar_3As5Df7G', 'No longer needed/wanted'),
  reason('rar_4Hj6Kl8Z', 'Better price available', { active: false }),
]

export const claimReasons: ClaimReason[] = [
  reason('clr_1Xc3Vb5N', 'Arrived damaged'),
  reason('clr_2Mn4Bv6C', 'Never arrived'),
  reason('clr_3Lk5Jh7G', 'Wrong item sent'),
]

export const refundReasons: RefundReason[] = [
  reason('rr_1Fd3Sa5Q', 'Return processing', { can_be_deleted: false }),
]

export const cancellationReasons: OrderCancellationReason[] = [
  reason('ocr_1Pl3Ok5I', 'Customer changed their mind'),
  reason('ocr_2Uj4Yh6T', 'Payment declined'),
  reason('ocr_3Gb5Vf7R', 'Out of stock'),
]

function exemptionReason(
  id: string,
  name: string,
  code: string,
  fields: Partial<TaxExemptionReason> = {},
): TaxExemptionReason {
  return { ...reason<ReturnReason>(id, name), code, metadata: {}, ...fields }
}

/** Spree seeds six, each with a neutral code its own engine keeps for reference. */
export const exemptionReasons: TaxExemptionReason[] = [
  exemptionReason('txr_1Aq2Ws3E', 'Agricultural', 'AGRICULTURAL'),
  exemptionReason('txr_2Rf4Tg5Y', 'Charitable organization', 'CHARITABLE'),
  exemptionReason('txr_3Hu6Ji7K', 'Educational institution', 'EDUCATIONAL'),
  exemptionReason('txr_4Lo8Pz9X', 'Government', 'GOVERNMENT', { can_be_deleted: false }),
  exemptionReason('txr_5Cv1Bn2M', 'Manufacturing', 'MANUFACTURING', { active: false }),
  exemptionReason('txr_6Qa3Zs4W', 'Resale', 'RESALE'),
]

function media(id: string, file: string, alt: string | null, fields: Partial<Media> = {}): Media {
  const url = `/fixtures/${file}`
  return {
    id,
    product_id: null,
    variant_ids: [],
    position: 1,
    alt,
    media_type: 'image',
    external_video_url: null,
    focal_point_x: null,
    focal_point_y: null,
    video_provider: null,
    video_embed_url: null,
    video_url: null,
    poster_url: null,
    original_url: url,
    mini_url: url,
    small_url: url,
    medium_url: url,
    large_url: url,
    xlarge_url: url,
    og_image_url: url,
    external_references: {},
    created_at: created,
    updated_at: updated,
    attached: true,
    filename: file,
    content_type: 'image/png',
    byte_size: 640,
    embed_url: url,
    signed_id: null,
    viewable_id: null,
    download_url: url,
    metadata: {},
    viewable_type: null,
    ...fields,
  }
}

/** The store's media library: three product photos and a banner without a description. */
export const mediaLibrary: Media[] = [
  media('med_1Za2Xs3C', 'product-olive.png', 'Olive canvas tote'),
  media('med_2Vf3Bg4N', 'product-clay.png', 'Clay mug'),
  media('med_3Hy4Ju5M', 'product-slate.png', 'Slate cap'),
  media('med_4Ki5Lo6P', 'banner-lilac.png', null),
]

/**
 * Countries first-run setup offers, each with the currency and languages
 * choosing it brings. A short list; the server sends about 250.
 */
export const setupCountries: SetupCountry[] = [
  { code: 'CA', currency: 'CAD', locales: ['en', 'fr'] },
  { code: 'CH', currency: 'CHF', locales: ['de', 'fr', 'it', 'rm'] },
  { code: 'DE', currency: 'EUR', locales: ['de'] },
  { code: 'FR', currency: 'EUR', locales: ['fr'] },
  { code: 'GB', currency: 'GBP', locales: ['en'] },
  { code: 'JP', currency: 'JPY', locales: ['ja'] },
  { code: 'PL', currency: 'PLN', locales: ['pl'] },
  { code: 'US', currency: 'USD', locales: ['en'] },
]

function rule(actions: string[], subject: string): PermissionRule {
  return { allow: true, actions, subjects: [subject], has_conditions: false }
}

/** What every staff member reads, whatever their role. */
const baseRules = [rule(['read'], 'country'), rule(['read'], 'state'), rule(['read'], 'store')]

const settingsSubjects = [
  'store',
  'payment_method',
  'gateway',
  'delivery_zone',
  'delivery_zone_member',
  'stock_location',
  'delivery_profile',
  'market',
  'tax_category',
  'tax_rate',
  'allowed_origin',
  'refund_reason',
  'return_reason',
  'claim_reason',
  'order_cancellation_reason',
  'tax_exemption_reason',
  'channel',
  'order_routing_rule',
  'custom_field_definition',
  'policy',
]

/**
 * The rules Spree answers `/me` with, at the pinned revision, for a staffer
 * whose only role holds `read_settings`.
 */
export const settingsViewerRules: PermissionRule[] = [
  ...baseRules,
  ...settingsSubjects.map((subject) => rule(['read', 'admin'], subject)),
]

/** Written by a key, read and managed; the order manager template's scopes, as `/me` lists them. */
function written(subjects: string[]) {
  return [
    ...subjects.map((subject) => rule(['read', 'admin'], subject)),
    ...subjects.map((subject) => rule(['manage'], subject)),
  ]
}

/** The same for a role made from the role sheet's "Order manager" template, which holds no settings. */
export const orderManagerRules: PermissionRule[] = [
  ...baseRules,
  ...written([
    'order',
    'order_group',
    'line_item',
    'tax_line',
    'discount',
    'fee',
    'return',
    'exchange',
    'claim',
    'tax_identifier',
    'custom_field',
    'digital_link',
  ]),
  ...written(['payment', 'payment_split']),
  ...written(['fulfillment', 'shipping_label', 'delivery']),
  ...written(['refund']),
  ...[
    'customer',
    'address',
    'credit_card',
    'customer_group',
    'company',
    'company_membership',
    'company_invitation',
    'tax_identifier',
    'tax_exemption_certificate',
    'data_request',
    'consent_record',
    'custom_field',
  ].map((subject) => rule(['read', 'admin'], subject)),
  ...written(['gift_card', 'gift_card_batch']),
  ...written(['store_credit', 'store_credit_event']),
]
