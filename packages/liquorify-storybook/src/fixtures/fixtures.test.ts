import {
  AdminUserSchema,
  ApiKeySchema,
  CatalogSchema,
  CategorySchema,
  ChannelSchema,
  ClaimReasonSchema,
  CollectionSchema,
  CountrySchema,
  CustomerSchema,
  CustomFieldDefinitionSchema,
  DashboardCounterSchema,
  DeliveryMethodSchema,
  DeliveryOriginGroupSchema,
  DeliveryProfileSchema,
  DeliveryZoneSchema,
  DigitalAssetSchema,
  MarketSchema,
  MediaSchema,
  OptionTypeSchema,
  OrderCancellationReasonSchema,
  OrderRoutingRuleSchema,
  OrderSchema,
  PackageTypeSchema,
  PaymentMethodSchema,
  PermissionSchema,
  PolicySchema,
  ProductSchema,
  ProductTypeSchema,
  RefundReasonSchema,
  ReturnReasonSchema,
  StockLocationSchema,
  StockMovementSchema,
  StoreSchema,
  TaxCategorySchema,
  TaxExemptionReasonSchema,
  TaxRateSchema,
  UpdateStatusSchema,
} from '@spree/admin-sdk/zod'
import { BalanceSchema } from '@spree/seller-sdk/zod'
import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import { publishableKeys, secretKeys } from './admin/api-keys'
import {
  apronFiles,
  apronStockMovements,
  categories,
  clayMugWithVideos,
  collections,
  deliveryProfiles,
  digitalAssets,
  optionTypes,
  pooledAsset,
  productFieldDefinitions,
  products,
  productTypes,
  scheduledMug,
  stockMovements,
  taxCategories,
} from './admin/catalog'
import { countries } from './admin/countries'
import {
  carrierMethodFromSource,
  deliveryMethods,
  digitalGroup,
  eastGroup,
  freshGroup,
  furnitureZones,
  generalGroup,
  generalZones,
  packageTypes,
  shippingProfiles,
  westGroup,
} from './admin/delivery'
import { paymentMethods } from './admin/payments'
import { permissionCatalog } from './admin/permissions'
import { adminUser } from './admin/session'
import {
  addressedLocation,
  cancellationReasons,
  catalogs,
  channels,
  claimReasons,
  customFieldDefinitions,
  exemptionReasons,
  extensionRoutingRule,
  freshStore,
  markets,
  mediaLibrary,
  overriddenChannel,
  policies,
  refundReasons,
  returnReasons,
  routingRules,
  setUpStore,
  shopLocation,
  stockLocations,
} from './admin/settings'
import {
  dashboardCounters,
  noUpdate,
  searchCustomers,
  searchOrders,
  searchProducts,
  shellStore,
  templateTeammates,
  twoStoreAdmin,
  unnamedAdmin,
  updateAvailable,
} from './admin/shell'
import { marketsAllOnEngine, marketsWithOneEngine, taxRates } from './admin/taxes'
import { balances } from './seller/balances'

/**
 * The generated type says a delivery method's `deleted_at` is a string, but
 * the server answers null for one that is not deleted, as the browser-test
 * server did on 2026-11-04. The fixtures follow the server.
 */
const LiveDeliveryMethodSchema = DeliveryMethodSchema.extend({
  deleted_at: DeliveryMethodSchema.shape.deleted_at.nullable(),
})

// A fixture that no longer parses means the API changed and the mock now shows
// something Spree would not (LIQ-010 §7.3).
const fixtures: [string, ZodType, unknown[]][] = [
  [
    'admin users',
    AdminUserSchema,
    [adminUser, twoStoreAdmin, unnamedAdmin, ...Object.values(templateTeammates)],
  ],
  ['API keys', ApiKeySchema, [...publishableKeys, ...secretKeys]],
  ['countries', CountrySchema, countries],
  ['permission catalog', PermissionSchema, permissionCatalog],
  ['store', StoreSchema, [shellStore, freshStore, setUpStore]],
  ['policies', PolicySchema, policies],
  ['channels', ChannelSchema, [...channels, overriddenChannel]],
  ['catalogs', CatalogSchema, catalogs],
  ['stock locations', StockLocationSchema, [shopLocation, addressedLocation, ...stockLocations]],
  ['order routing rules', OrderRoutingRuleSchema, [...routingRules, extensionRoutingRule]],
  ['custom field definitions', CustomFieldDefinitionSchema, customFieldDefinitions],
  ['product field definitions', CustomFieldDefinitionSchema, productFieldDefinitions],
  ['markets', MarketSchema, [...markets, ...marketsWithOneEngine, ...marketsAllOnEngine]],
  ['return reasons', ReturnReasonSchema, returnReasons],
  ['claim reasons', ClaimReasonSchema, claimReasons],
  ['refund reasons', RefundReasonSchema, refundReasons],
  ['cancellation reasons', OrderCancellationReasonSchema, cancellationReasons],
  ['tax exemption reasons', TaxExemptionReasonSchema, exemptionReasons],
  ['media', MediaSchema, [...mediaLibrary, ...clayMugWithVideos]],
  ['dashboard counters', DashboardCounterSchema, dashboardCounters],
  ['update status', UpdateStatusSchema, [noUpdate, updateAvailable]],
  ['products', ProductSchema, [...searchProducts, ...products, scheduledMug]],
  ['option types', OptionTypeSchema, optionTypes],
  ['categories', CategorySchema, categories],
  ['collections', CollectionSchema, collections],
  ['tax categories', TaxCategorySchema, taxCategories],
  ['delivery profiles', DeliveryProfileSchema, deliveryProfiles],
  ['product types', ProductTypeSchema, productTypes],
  ['digital assets', DigitalAssetSchema, [...digitalAssets, pooledAsset, ...apronFiles]],
  ['stock movements', StockMovementSchema, [...stockMovements, ...apronStockMovements]],
  ['orders', OrderSchema, searchOrders],
  ['customers', CustomerSchema, searchCustomers],
  ['payment methods', PaymentMethodSchema, paymentMethods],
  ['tax rates', TaxRateSchema, taxRates],
  ['shipping profiles', DeliveryProfileSchema, shippingProfiles],
  [
    'origin groups',
    DeliveryOriginGroupSchema,
    [generalGroup, westGroup, eastGroup, freshGroup, digitalGroup],
  ],
  ['delivery zones', DeliveryZoneSchema, [...generalZones, ...furnitureZones]],
  ['delivery methods', LiveDeliveryMethodSchema, [...deliveryMethods, carrierMethodFromSource]],
  ['package types', PackageTypeSchema, packageTypes],
  ['seller balances', BalanceSchema, balances],
]

describe('fixtures match the SDK schemas', () => {
  it.each(fixtures)('%s', (_name, schema, records) => {
    for (const record of records) {
      expect(schema.safeParse(record).error?.issues ?? []).toEqual([])
    }
  })
})
