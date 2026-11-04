import type {
  DeliveryMethod,
  DeliveryMethodRule,
  DeliveryOriginGroup,
  DeliveryProfile,
  DeliveryRateProviderOption,
  DeliveryZone,
  DeliveryZoneMember,
  FulfillmentProviderOption,
  IntegrationTypeDefinition,
  PackageType,
  PreferenceSchema,
} from '@spree/admin-sdk'
import { cartonPackageType, taxCategories } from './catalog'
import { stockLocations } from './settings'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

const [shopLocation, eastDepot, downtownCounter] = stockLocations

// ---------------------------------------------------------------------------
// What the server offers: providers, calculators and rule kinds, as the
// browser-test server lists them at the pinned revision.
// ---------------------------------------------------------------------------

function fulfillmentProvider(
  type: string,
  name: string,
  fields: Partial<FulfillmentProviderOption> = {},
): FulfillmentProviderOption {
  return {
    type,
    name,
    integration_type: null,
    available: true,
    digital: false,
    pickup: false,
    pickup_point: false,
    requires_address: true,
    ...fields,
  }
}

export const fulfillmentProviders: FulfillmentProviderOption[] = [
  fulfillmentProvider('manual', 'Manual'),
  fulfillmentProvider('digital', 'Digital', { digital: true, requires_address: false }),
  fulfillmentProvider('pickup', 'Pickup', { pickup: true, requires_address: false }),
  fulfillmentProvider('pickup_point', 'Pickup Point', {
    pickup_point: true,
    requires_address: false,
  }),
]

function rateProvider(
  type: string,
  name: string,
  fields: Partial<DeliveryRateProviderOption> = {},
): DeliveryRateProviderOption {
  return {
    type,
    name,
    integration_type: null,
    available: true,
    requires_address: false,
    uses_calculator: true,
    service_catalog: [],
    service_catalog_error: null,
    ...fields,
  }
}

export const internalRates = rateProvider('internal', 'Internal')

/** Freight quotes a booking itself, so it uses no calculator and names no services. */
export const freightRates = rateProvider('freight', 'Freight', {
  requires_address: true,
  uses_calculator: false,
})

export const rateProviders: DeliveryRateProviderOption[] = [internalRates, freightRates]

/**
 * EasyPost's rate provider as its gem would list it once connected, written
 * from `SpreeEasyPost::DeliveryRateProvider`: it quotes each shipment live and
 * names the carrier services it can quote. The browser-test server does not
 * load the gem; the services are invented examples of a carrier's names.
 */
export const easyPostRatesFromSource = rateProvider('easy_post', 'EasyPost', {
  integration_type: 'easy_post',
  requires_address: true,
  uses_calculator: false,
  service_catalog: [
    { carrier: 'USPS', service: 'Priority', label: 'USPS Priority' },
    { carrier: 'USPS', service: 'GroundAdvantage', label: 'USPS Ground Advantage' },
    { carrier: 'UPS', service: 'Ground', label: 'UPS Ground' },
  ],
})

/** The same provider before EasyPost is connected in the store's integrations. */
export const easyPostRatesNotConnected: DeliveryRateProviderOption = {
  ...easyPostRatesFromSource,
  available: false,
  service_catalog: [],
}

/** EasyPost's fulfilment provider as its gem would list it, for buying labels. */
export const easyPostFulfillmentFromSource = fulfillmentProvider('easy_post', 'EasyPost', {
  integration_type: 'easy_post',
})

/** EasyPost's integration as the gem would offer it, unconnected; settings from its source. */
export const easyPostIntegrationType: IntegrationTypeDefinition = {
  type: 'easy_post',
  name: 'EasyPost',
  group: 'shipping',
  description: null,
  logo_url: null,
  docs_url: null,
  schema: {
    type: 'object',
    properties: {
      api_key: { type: ['string', 'null'], 'x-spree-secret': true },
      webhook_secret: { type: ['string', 'null'], 'x-spree-secret': true },
      customs_signer: { type: ['string', 'null'] },
    },
    additionalProperties: false,
  },
} as IntegrationTypeDefinition

const decimal = { pattern: '^-?\\d+(\\.\\d+)?$' }
const money = { type: 'string', format: 'money', ...decimal }
const optionalMoney = { type: ['string', 'null'], format: 'money', ...decimal }
const optionalDecimal = { type: ['string', 'null'], ...decimal }
const currency = { type: 'string', format: 'currency', pattern: '^[A-Z]{3}$' }

/** A calculator priced as an amount, which a store selling in several currencies sets per currency. */
const amountSchema = {
  type: 'object',
  properties: {
    amounts: {
      type: 'object',
      propertyNames: currency,
      additionalProperties: money,
      default: {},
    },
    amount: { ...money, default: '0' },
    currency,
  },
  additionalProperties: false,
} as PreferenceSchema

const schema = (properties: Record<string, unknown>) =>
  ({ type: 'object', properties, additionalProperties: false }) as PreferenceSchema

export const calculators = [
  {
    type: 'flat_percent_item_total',
    name: 'Flat Percent',
    schema: schema({ flat_percent: { type: 'string', ...decimal, default: '0' } }),
  },
  { type: 'flat_rate', name: 'Flat rate', schema: amountSchema },
  {
    type: 'flexi_rate',
    name: 'Flexible Rate per package item',
    schema: schema({
      first_item: { ...money, default: '0' },
      additional_item: { ...money, default: '0' },
      max_items: { type: 'integer', default: 0 },
      currency,
    }),
  },
  { type: 'per_item', name: 'Flat rate per package item', schema: amountSchema },
  {
    type: 'price_sack',
    name: 'Price sack',
    schema: schema({
      minimal_amount: { ...money, default: '0' },
      normal_amount: { ...money, default: '0' },
      discount_amount: { ...money, default: '0' },
      currency,
    }),
  },
  { type: 'digital_delivery', name: 'Digital Delivery', schema: amountSchema },
]

export const ruleTypes = [
  {
    type: 'item_total_rule',
    name: 'Item total',
    description: 'Limits the delivery method to carts within an item total range',
    schema: schema({ minimum_amount: optionalMoney, maximum_amount: optionalMoney }),
    association_fields: [],
  },
  {
    type: 'weight_rule',
    name: 'Weight',
    description: 'Limits the delivery method to packages within a weight range',
    schema: schema({ minimum_weight: optionalDecimal, maximum_weight: optionalDecimal }),
    association_fields: [],
  },
  {
    type: 'excluded_products_rule',
    name: 'Excluded products',
    description: 'Blocks the delivery method for packages containing the selected products',
    schema: schema({}),
    association_fields: ['product_ids'],
  },
  {
    type: 'channel_rule',
    name: 'Channel',
    description: 'Offers the delivery method only on the selected channels',
    schema: schema({
      channel_ids: {
        type: 'array',
        items: {
          type: 'string',
          format: 'prefixed-id',
          pattern: '^ch_[A-Za-z0-9]+$',
          'x-spree-prefix': 'ch',
        },
        default: [],
      },
    }),
    association_fields: [],
  },
  {
    type: 'volume_rule',
    name: 'Volume',
    description: 'Limits the delivery method to shipments within a volume range, in cubic meters',
    schema: schema({ minimum_volume: optionalDecimal, maximum_volume: optionalDecimal }),
    association_fields: [],
  },
  {
    type: 'company_rule',
    name: 'Company',
    description:
      'Offers the delivery method only to orders placed for a company, or only to orders that are not',
    schema: schema({ company_orders_only: { type: 'boolean', default: true } }),
    association_fields: [],
  },
]

export const profileKinds = [{ kind: 'shipping' }, { kind: 'digital' }]

// ---------------------------------------------------------------------------
// Profiles, their origin groups, zones and methods
// ---------------------------------------------------------------------------

function originGroup(
  id: string,
  profileId: string,
  name: string | null,
  locationIds: string[],
  position: number,
): DeliveryOriginGroup {
  return {
    id,
    name,
    position,
    created_at: created,
    updated_at: updated,
    delivery_profile_id: profileId,
    stock_location_ids: locationIds,
    delivery_zones_count: 1,
    delivery_methods_count: 2,
  }
}

const embedded = (group: DeliveryOriginGroup) => ({
  id: group.id,
  name: group.name,
  position: group.position,
  stock_location_ids: group.stock_location_ids,
})

function profile(id: string, name: string, fields: Partial<DeliveryProfile> = {}): DeliveryProfile {
  return {
    id,
    name,
    default: false,
    position: 1,
    created_at: created,
    updated_at: updated,
    kind: 'shipping',
    digital: false,
    offers_pickup: false,
    offers_shipping: true,
    stock_location_ids: [],
    origin_groups: [],
    products_count: 0,
    delivery_methods_count: 0,
    delivery_zones_count: 0,
    ...fields,
  }
}

export const generalGroup = originGroup('og_3Fb7Hn2K', 'fp_6Hq2Wm8c', null, [], 1)

/** The store's default profile, shipping from every location, with two zones and pickup. */
export const generalProfile = profile('fp_6Hq2Wm8c', 'General', {
  default: true,
  offers_pickup: true,
  origin_groups: [embedded(generalGroup)],
  products_count: 14,
  delivery_methods_count: 6,
  delivery_zones_count: 2,
})

export const westGroup = originGroup(
  'og_5Jd2Lp8M',
  'fp_2Tc9Rv4X',
  'West coast',
  [shopLocation.id],
  1,
)
export const eastGroup = originGroup('og_8Nq4Sw1P', 'fp_2Tc9Rv4X', 'East coast', [eastDepot.id], 2)

/** Heavy goods, split into two origin groups, each pricing its own zone. */
export const furnitureProfile = profile('fp_2Tc9Rv4X', 'Furniture', {
  position: 2,
  origin_groups: [embedded(westGroup), embedded(eastGroup)],
  stock_location_ids: [shopLocation.id, eastDepot.id],
  products_count: 3,
  delivery_methods_count: 2,
  delivery_zones_count: 2,
})

export const freshGroup = originGroup('og_1Gx6Mz9Q', 'fp_7Wd5Yk3N', null, [], 1)

/** Created a moment ago, with no zone or method yet. */
export const freshProfile = profile('fp_7Wd5Yk3N', 'Fragile items', {
  position: 3,
  offers_shipping: false,
  origin_groups: [embedded(freshGroup)],
})

export const digitalGroup = originGroup('og_4Hv8Bc5R', 'fp_8Dg4Xn1v', null, [], 1)

export const digitalProfile = profile('fp_8Dg4Xn1v', 'Digital delivery', {
  position: 4,
  kind: 'digital',
  digital: true,
  offers_shipping: false,
  origin_groups: [embedded(digitalGroup)],
  products_count: 1,
  delivery_methods_count: 1,
})

export const shippingProfiles: DeliveryProfile[] = [
  generalProfile,
  furnitureProfile,
  freshProfile,
  digitalProfile,
]

function member(
  id: string,
  type: DeliveryZoneMember['member_type'],
  fields: Partial<DeliveryZoneMember>,
): DeliveryZoneMember {
  return {
    id,
    member_type: type,
    country_code: null,
    state_code: null,
    postal_code_prefix: null,
    postal_code_from: null,
    postal_code_to: null,
    country_name: null,
    state_name: null,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

const country = (id: string, code: string, name: string) =>
  member(id, 'country', {
    country_code: code as DeliveryZoneMember['country_code'],
    country_name: name,
  })

function zone(
  id: string,
  name: string,
  profileId: string,
  groupId: string,
  members: DeliveryZoneMember[],
  methodIds: string[],
): DeliveryZone {
  return {
    id,
    name,
    description: null,
    members,
    created_at: created,
    updated_at: updated,
    delivery_profile_id: profileId,
    delivery_origin_group_id: groupId,
    delivery_method_ids: methodIds,
  }
}

export const domesticZone = zone(
  'dz_4Km7Pq2S',
  'Domestic',
  generalProfile.id,
  generalGroup.id,
  [country('dzm_1Ab2Cd3E', 'US', 'United States')],
  ['dm_2Qs8Hd5L', 'dm_5Wr1Jt7N', 'dm_8Ex4Kc2V'],
)

export const europeZone = zone(
  'dz_7Lm3Rt9U',
  'Europe',
  generalProfile.id,
  generalGroup.id,
  [
    country('dzm_2Fg3Hi4J', 'DE', 'Germany'),
    country('dzm_3Kl4Mn5O', 'FR', 'France'),
    country('dzm_4Pq5Rs6T', 'IE', 'Ireland'),
    country('dzm_5Uv6Wx7Y', 'PL', 'Poland'),
    country('dzm_6Za7Bc8D', 'GB', 'United Kingdom'),
  ],
  ['dm_9Pv3Lb6M'],
)

/** A zone narrower than a country: two states and a postal code rule. */
export const westCoastZone = zone(
  'dz_9Np5Vw1X',
  'West coast',
  furnitureProfile.id,
  westGroup.id,
  [
    member('dzm_7Ef8Gh9I', 'state', {
      country_code: 'US',
      state_code: 'CA',
      state_name: 'California',
    }),
    member('dzm_8Jk9Lm1N', 'state', { country_code: 'US', state_code: 'TX', state_name: 'Texas' }),
    member('dzm_9Op1Qr2S', 'postal_code', { country_code: 'US', postal_code_prefix: '941' }),
  ],
  ['dm_3Yk6Fr9B'],
)

export const eastCoastZone = zone(
  'dz_2Rx8Zy4A',
  'East coast',
  furnitureProfile.id,
  eastGroup.id,
  [
    member('dzm_1Tu2Vw3X', 'state', {
      country_code: 'US',
      state_code: 'NY',
      state_name: 'New York',
    }),
  ],
  ['dm_6Gn2Ws4C'],
)

export const generalZones = [domesticZone, europeZone]
export const furnitureZones = [westCoastZone, eastCoastZone]

function rule(
  id: string,
  type: string,
  preferences: Record<string, unknown>,
  productIds: string[] = [],
): DeliveryMethodRule {
  return {
    id,
    active: true,
    created_at: created,
    updated_at: updated,
    type,
    preferences,
    product_ids: productIds,
  }
}

function method(id: string, name: string, fields: Partial<DeliveryMethod> = {}): DeliveryMethod {
  return {
    id,
    name,
    code: null,
    estimated_transit_business_days_min: null,
    estimated_transit_business_days_max: null,
    digital: false,
    pickup: false,
    pickup_point: false,
    admin_name: null,
    storefront_visible: true,
    tracking_url: null,
    available_to_sellers: false,
    created_at: created,
    updated_at: updated,
    // The server answers null for a method that is not deleted, although the
    // generated type says a string (see fixtures.test.ts).
    deleted_at: null as unknown as string,
    markup_flat: '0.00',
    markup_percent: '0',
    seller_id: null,
    seller_name: null,
    services: [],
    rules: [],
    tax_category_id: null,
    delivery_profile_id: generalProfile.id,
    delivery_origin_group_id: generalGroup.id,
    delivery_zone_id: null,
    stock_location_ids: [],
    fulfillment_provider: 'manual',
    pickup_point_provider: null,
    rate_provider: null,
    calculator: {
      type: 'flat_rate',
      preferences: { amounts: {}, amount: '0.00', currency: 'USD' },
    } as DeliveryMethod['calculator'],
    ...fields,
  }
}

const flatRate = (amounts: Record<string, string>) =>
  ({ type: 'flat_rate', preferences: { amounts } }) as DeliveryMethod['calculator']

export const standardMethod = method('dm_2Qs8Hd5L', 'Standard', {
  code: 'STD',
  estimated_transit_business_days_min: 3,
  estimated_transit_business_days_max: 5,
  delivery_zone_id: domesticZone.id,
  tax_category_id: taxCategories[0].id,
  tracking_url: 'https://carrier.example/track?num=:tracking',
  calculator: flatRate({ USD: '5.00' }),
})

/** Priced in both of the store's currencies. */
export const expressMethod = method('dm_5Wr1Jt7N', 'Express', {
  estimated_transit_business_days_min: 1,
  estimated_transit_business_days_max: 2,
  delivery_zone_id: domesticZone.id,
  calculator: flatRate({ USD: '15.00', EUR: '14.00' }),
})

/** Free above an item total, and not for heavy parcels or one channel. */
export const freeOverMethod = method('dm_8Ex4Kc2V', 'Free over $75', {
  delivery_zone_id: domesticZone.id,
  calculator: flatRate({}),
  rules: [
    rule('dmrule_3Gt7Hy2U', 'item_total_rule', { minimum_amount: '75.00', maximum_amount: null }),
    rule('dmrule_6Jk1Lp4O', 'weight_rule', { minimum_weight: null, maximum_weight: '20' }),
  ],
})

export const europeMethod = method('dm_9Pv3Lb6M', 'Europe tracked', {
  delivery_zone_id: europeZone.id,
  calculator: flatRate({ USD: '24.00', EUR: '22.00' }),
  storefront_visible: false,
})

/** Priced through the freight rate provider, with a markup on its quote. */
export const freightMethod = method('dm_3Yk6Fr9B', 'Pallet freight', {
  delivery_profile_id: furnitureProfile.id,
  delivery_origin_group_id: westGroup.id,
  delivery_zone_id: westCoastZone.id,
  rate_provider: 'freight',
  markup_flat: '10.00',
  markup_percent: '5',
  calculator: null,
  rules: [rule('dmrule_8Mn2Bv5C', 'volume_rule', { minimum_volume: '1', maximum_volume: null })],
})

export const eastFreightMethod = method('dm_6Gn2Ws4C', 'Two-person delivery', {
  delivery_profile_id: furnitureProfile.id,
  delivery_origin_group_id: eastGroup.id,
  delivery_zone_id: eastCoastZone.id,
  calculator: flatRate({ USD: '89.00' }),
})

export const pickupMethod = method('dm_4Cv9Nm2Z', 'Collect in store', {
  pickup: true,
  fulfillment_provider: 'pickup',
  stock_location_ids: [downtownCounter.id],
  calculator: flatRate({}),
})

export const digitalMethod = method('dm_7Bx3Qa8W', 'Digital Delivery', {
  digital: true,
  delivery_profile_id: digitalProfile.id,
  delivery_origin_group_id: digitalGroup.id,
  fulfillment_provider: 'digital',
  calculator: {
    type: 'digital_delivery',
    preferences: { amounts: {}, amount: '0.00', currency: 'USD' },
  } as DeliveryMethod['calculator'],
})

/** A carrier method quoted live, wherever the profile reaches, as EasyPost's gem would price it. */
export const carrierMethodFromSource = method('dm_1Ls5Kd7F', 'EasyPost', {
  rate_provider: 'easy_post',
  fulfillment_provider: 'manual',
  calculator: null,
  services: [
    {
      id: 'dms_2Hj4Kl6M',
      carrier: 'USPS',
      service: 'Priority',
      label: 'Priority Mail',
      markup_flat: '1.00',
      markup_percent: null,
      position: 1,
    },
  ],
})

export const generalMethods = [
  standardMethod,
  expressMethod,
  freeOverMethod,
  europeMethod,
  pickupMethod,
]

export const furnitureMethods = [freightMethod, eastFreightMethod]

export const deliveryMethods: DeliveryMethod[] = [
  ...generalMethods,
  ...furnitureMethods,
  digitalMethod,
]

// ---------------------------------------------------------------------------
// Package types
// ---------------------------------------------------------------------------

function packageType(
  id: string,
  name: string,
  kind: PackageType['kind'],
  fields: Partial<PackageType> = {},
): PackageType {
  return {
    ...cartonPackageType,
    id,
    name,
    kind,
    default: false,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

export const packageTypes: PackageType[] = [
  packageType('pkgtype_2Bx5Cn8D', 'Small box', 'box', {
    length: '20.0',
    width: '15.0',
    height: '10.0',
    weight: '0.2',
    max_weight: '5.0',
    volume: '3000.0',
    default: true,
  }),
  { ...cartonPackageType, id: 'pkgtype_4Ct8Rn2B' },
  packageType('pkgtype_7Pl3Ty6K', 'Euro pallet', 'pallet', {
    length: '120.0',
    width: '80.0',
    height: '14.4',
    weight: '25.0',
    max_weight: '1500.0',
    volume: '138240.0',
  }),
]
