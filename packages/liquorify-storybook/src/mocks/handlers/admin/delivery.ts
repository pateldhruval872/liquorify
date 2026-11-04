import type {
  Country,
  DeliveryMethod,
  DeliveryProfile,
  DeliveryRateProviderOption,
  DeliveryZone,
  FulfillmentProviderOption,
  IntegrationTypeDefinition,
  Market,
  PackageType,
} from '@spree/admin-sdk'
import { HttpResponse, http } from 'msw'
import { countries } from '../../../fixtures/admin/countries'
import {
  calculators,
  deliveryMethods,
  fulfillmentProviders,
  furnitureZones,
  generalZones,
  packageTypes,
  profileKinds,
  rateProviders,
  ruleTypes,
  shippingProfiles,
} from '../../../fixtures/admin/delivery'
import { markets } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { recordRequests } from './records'
import { stockLocationList } from './settings'
import { taxCategoryRequests } from './taxes'

const admin = '/api/v3/admin'

/** The store's markets with their countries, which the zone picker offers, and each country's states. */
export function marketCountries(records: Market[] = markets) {
  const byIso = new Map(countries.map((country) => [country.iso as string, country]))
  return [
    http.get(`${admin}/markets`, () =>
      HttpResponse.json(
        onePage(
          records.map((market) => ({
            ...market,
            countries: market.country_codes
              .map((iso) => byIso.get(iso))
              .filter((country): country is Country => !!country),
          })),
        ),
      ),
    ),
    http.get(`${admin}/countries/:iso`, ({ params }) => {
      const country = byIso.get(params.iso as string)
      return country ? HttpResponse.json(country) : new HttpResponse(null, { status: 404 })
    }),
  ]
}

/**
 * What the method form offers: fulfilment and rate providers, calculators,
 * rule kinds, the integrations a provider may need, and a store with no
 * sellers, so the sharing switch stays hidden.
 */
export function methodCatalog({
  fulfillment = fulfillmentProviders,
  rates = rateProviders,
  integrationTypes = [],
}: {
  fulfillment?: FulfillmentProviderOption[]
  rates?: DeliveryRateProviderOption[]
  integrationTypes?: IntegrationTypeDefinition[]
} = {}) {
  return [
    http.get(`${admin}/delivery_methods/calculators`, () =>
      HttpResponse.json({ data: calculators }),
    ),
    http.get(`${admin}/delivery_methods/fulfillment_providers`, () =>
      HttpResponse.json({ data: fulfillment }),
    ),
    http.get(`${admin}/delivery_methods/rate_providers`, () =>
      HttpResponse.json({ data: rates, default: 'internal' }),
    ),
    http.get(`${admin}/delivery_method_rules/types`, () => HttpResponse.json({ data: ruleTypes })),
    http.get(`${admin}/integrations/types`, () => HttpResponse.json({ data: integrationTypes })),
    http.get(`${admin}/integrations`, () => HttpResponse.json(onePage([]))),
    http.get(`${admin}/sellers`, () => HttpResponse.json(onePage([]))),
  ]
}

export function deliveryMethodRequests(records: DeliveryMethod[] = deliveryMethods) {
  return recordRequests('delivery_methods', records)
}

export function deliveryZoneRequests(
  records: DeliveryZone[] = [...generalZones, ...furnitureZones],
) {
  return recordRequests('delivery_zones', records)
}

/** The store's profiles and their kinds, with writes to a profile and its origin groups that succeed. */
export function deliveryProfileRequests(records: DeliveryProfile[] = shippingProfiles) {
  const groups = `${admin}/delivery_profiles/:profileId/origin_groups`
  return [
    http.get(`${admin}/delivery_profiles/kinds`, () => HttpResponse.json({ data: profileKinds })),
    ...recordRequests('delivery_profiles', records),
    http.post(groups, async ({ request }) =>
      HttpResponse.json({ id: 'og_new', ...((await request.json()) as object) }, { status: 201 }),
    ),
    http.patch(`${groups}/:id`, async ({ params, request }) =>
      HttpResponse.json({ id: params.id, ...((await request.json()) as object) }),
    ),
    http.delete(`${groups}/:id`, () => new HttpResponse(null, { status: 204 })),
  ]
}

/**
 * Everything a profile page and its sheets read, for the store's records. The
 * method catalog comes before the methods, whose `/delivery_methods/:id`
 * would otherwise answer `/delivery_methods/calculators` with a 404.
 */
export function profilePageRequests({
  profiles = shippingProfiles,
  zones = [...generalZones, ...furnitureZones],
  methods = deliveryMethods,
  rates = rateProviders,
  integrationTypes = [],
}: {
  profiles?: DeliveryProfile[]
  zones?: DeliveryZone[]
  methods?: DeliveryMethod[]
  rates?: DeliveryRateProviderOption[]
  integrationTypes?: IntegrationTypeDefinition[]
} = {}) {
  return {
    catalog: methodCatalog({ rates, integrationTypes }),
    profiles: deliveryProfileRequests(profiles),
    zones: deliveryZoneRequests(zones),
    methods: deliveryMethodRequests(methods),
    markets: marketCountries(),
    taxCategories: taxCategoryRequests(),
    stockLocations: stockLocationList(),
  }
}

export function packageTypeRequests(records: PackageType[] = packageTypes) {
  return recordRequests('package_types', records)
}
