import {
  AdminUserSchema,
  ApiKeySchema,
  CountrySchema,
  PermissionSchema,
} from '@spree/admin-sdk/zod'
import { BalanceSchema } from '@spree/seller-sdk/zod'
import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import { publishableKeys, secretKeys } from './admin/api-keys'
import { countries } from './admin/countries'
import { permissionCatalog } from './admin/permissions'
import { adminUser } from './admin/session'
import { balances } from './seller/balances'

// A fixture that no longer parses means the API changed and the mock now shows
// something Spree would not (LIQ-010 §7.3).
const fixtures: [string, ZodType, unknown[]][] = [
  ['admin user', AdminUserSchema, [adminUser]],
  ['API keys', ApiKeySchema, [...publishableKeys, ...secretKeys]],
  ['countries', CountrySchema, countries],
  ['permission catalog', PermissionSchema, permissionCatalog],
  ['seller balances', BalanceSchema, balances],
]

describe('fixtures match the SDK schemas', () => {
  it.each(fixtures)('%s', (_name, schema, records) => {
    for (const record of records) {
      expect(schema.safeParse(record).error?.issues ?? []).toEqual([])
    }
  })
})
