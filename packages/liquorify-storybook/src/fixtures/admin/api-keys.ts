import type { ApiKey } from '@spree/admin-sdk'

function apiKey(fields: Partial<ApiKey> & Pick<ApiKey, 'id' | 'name' | 'key_type'>): ApiKey {
  return {
    token_prefix: null,
    scopes: [],
    created_at: '2026-06-01T10:00:00.000Z',
    updated_at: '2026-06-01T10:00:00.000Z',
    revoked_at: null,
    last_used_at: null,
    channel_id: null,
    plaintext_token: null,
    created_by_email: 'alex.morgan@example.com',
    created_by_type: 'admin_user',
    created_by_label: 'Alex Morgan',
    ...fields,
  }
}

export const channels = [{ id: 'ch_4Tn8vB2x', name: 'Online store' }]

// Invented tokens in the shape the API returns: a recognisable prefix followed
// by characters that are not a real credential.
export const publishableKeys: ApiKey[] = [
  apiKey({
    id: 'key_pk1Ab2Cd3E',
    name: 'Storefront',
    key_type: 'publishable',
    plaintext_token: 'pk_sample_storefront_000000000000',
    channel_id: 'ch_4Tn8vB2x',
    last_used_at: '2026-10-01T09:00:00.000Z',
  }),
  apiKey({
    id: 'key_pk4Fg5Hi6J',
    name: 'Mobile app',
    key_type: 'publishable',
    plaintext_token: 'pk_sample_mobile_00000000000000000',
    created_at: '2026-08-12T14:30:00.000Z',
    updated_at: '2026-08-12T14:30:00.000Z',
  }),
]

export const secretKeys: ApiKey[] = [
  apiKey({
    id: 'key_sk1Kl2Mn3O',
    name: 'Warehouse sync',
    key_type: 'secret',
    token_prefix: 'sk_sample_wh',
    scopes: ['read_products', 'write_stock', 'read_orders', 'write_orders', 'read_customers'],
    last_used_at: '2026-09-28T16:45:00.000Z',
  }),
  apiKey({
    id: 'key_sk4Pq5Rs6T',
    name: 'Accounting export',
    key_type: 'secret',
    token_prefix: 'sk_sample_ac',
    scopes: ['read_all'],
    created_by_label: null,
    created_by_email: null,
    created_by_type: null,
  }),
  apiKey({
    id: 'key_sk7Uv8Wx9Y',
    name: 'Old integration',
    key_type: 'secret',
    token_prefix: 'sk_sample_old',
    scopes: ['write_all'],
    revoked_at: '2026-07-04T08:00:00.000Z',
    last_used_at: '2026-07-01T11:00:00.000Z',
  }),
]
