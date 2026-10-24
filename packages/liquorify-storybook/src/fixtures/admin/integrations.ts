import type { Integration, IntegrationTypeDefinition } from '@spree/admin-sdk'

/**
 * An integration type with one setting of each kind a provider gem declares
 * most: text, a secret, a number and a switch. It mirrors the browser tests'
 * own integration, under an invented name.
 */
export const relayType: IntegrationTypeDefinition = {
  type: 'warehouse_relay',
  name: 'Warehouse Relay',
  group: 'shipping',
  description: 'Sends paid orders to your warehouse and keeps stock levels in step.',
  logo_url: null,
  docs_url: 'https://docs.example.com/warehouse-relay',
  schema: {
    type: 'object',
    properties: {
      account_id: { type: ['string', 'null'] },
      api_secret: { type: ['string', 'null'], 'x-spree-secret': true },
      sync_interval: { type: 'integer', default: 15 },
      sandbox_mode: { type: 'boolean', default: true },
    },
    additionalProperties: false,
  },
}

/** Connected, with its secret stored, which the API only ever returns masked. */
export const relayIntegration: Integration = {
  id: 'int_5Tg7Yh2U',
  name: 'Warehouse Relay',
  active: true,
  created_at: '2026-09-05T10:00:00.000Z',
  updated_at: '2026-09-20T16:00:00.000Z',
  type: 'warehouse_relay',
  group: 'shipping',
  preferences: {
    account_id: 'acct-sample',
    api_secret: '••••••••••••••••0000',
    sync_interval: 30,
    sandbox_mode: false,
  },
}
