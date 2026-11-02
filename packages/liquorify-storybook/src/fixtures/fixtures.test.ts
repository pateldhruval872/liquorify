import {
  AdminUserSchema,
  ApiKeySchema,
  CatalogSchema,
  ChannelSchema,
  ClaimReasonSchema,
  CountrySchema,
  CustomerSchema,
  CustomFieldDefinitionSchema,
  DashboardCounterSchema,
  MarketSchema,
  MediaSchema,
  OrderCancellationReasonSchema,
  OrderRoutingRuleSchema,
  OrderSchema,
  PermissionSchema,
  PolicySchema,
  ProductSchema,
  RefundReasonSchema,
  ReturnReasonSchema,
  StockLocationSchema,
  StoreSchema,
  TaxExemptionReasonSchema,
  UpdateStatusSchema,
} from '@spree/admin-sdk/zod'
import { BalanceSchema } from '@spree/seller-sdk/zod'
import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import { publishableKeys, secretKeys } from './admin/api-keys'
import { countries } from './admin/countries'
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
import { balances } from './seller/balances'

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
  ['markets', MarketSchema, markets],
  ['return reasons', ReturnReasonSchema, returnReasons],
  ['claim reasons', ClaimReasonSchema, claimReasons],
  ['refund reasons', RefundReasonSchema, refundReasons],
  ['cancellation reasons', OrderCancellationReasonSchema, cancellationReasons],
  ['tax exemption reasons', TaxExemptionReasonSchema, exemptionReasons],
  ['media', MediaSchema, mediaLibrary],
  ['dashboard counters', DashboardCounterSchema, dashboardCounters],
  ['update status', UpdateStatusSchema, [noUpdate, updateAvailable]],
  ['products', ProductSchema, searchProducts],
  ['orders', OrderSchema, searchOrders],
  ['customers', CustomerSchema, searchCustomers],
  ['seller balances', BalanceSchema, balances],
]

describe('fixtures match the SDK schemas', () => {
  it.each(fixtures)('%s', (_name, schema, records) => {
    for (const record of records) {
      expect(schema.safeParse(record).error?.issues ?? []).toEqual([])
    }
  })
})
