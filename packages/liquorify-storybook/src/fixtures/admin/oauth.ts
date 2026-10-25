import type { AdminUser, OauthAccessToken, OauthApplication } from '@spree/admin-sdk'
import { adminUser } from './session'

function application(
  fields: Partial<OauthApplication> & Pick<OauthApplication, 'id' | 'name' | 'client_id'>,
): OauthApplication {
  return {
    redirect_uri: null,
    created_at: '2026-09-02T10:00:00.000Z',
    updated_at: '2026-09-02T10:00:00.000Z',
    connected: false,
    scopes: [],
    last_authorized_at: null,
    authorized_at: null,
    authorized_by: null,
    ...fields,
  }
}

// Invented client ids: Spree generates its own, and these only fill the shape.
export const claudeApplication = application({
  id: 'oapp_4Hd7kQ2s',
  name: 'Claude',
  client_id: 'sample-client-id-claude',
  redirect_uri: 'https://claude.ai/api/mcp/auth_callback\nhttp://127.0.0.1/callback',
  connected: true,
  scopes: ['read_products', 'write_products', 'read_orders', 'read_customers'],
  authorized_at: '2026-09-02T10:05:00.000Z',
  last_authorized_at: '2026-09-28T15:30:00.000Z',
  authorized_by: adminUser.email,
})

export const customApplication = application({
  id: 'oapp_8Mn3vR6t',
  name: 'Inventory assistant',
  client_id: 'sample-client-id-inventory',
  redirect_uri: 'https://assistant.example.com/oauth/callback',
  created_at: '2026-08-20T09:00:00.000Z',
  updated_at: '2026-08-20T09:00:00.000Z',
})

export const oauthApplications = [claudeApplication, customApplication]

const teammate: AdminUser = {
  ...adminUser,
  id: 'admin_2Rt5wE8y',
  email: 'jordan.lee@example.com',
  first_name: 'Jordan',
  last_name: 'Lee',
  full_name: 'Jordan Lee',
}

function connection(
  fields: Partial<OauthAccessToken> & Pick<OauthAccessToken, 'id' | 'scopes'>,
): OauthAccessToken {
  return {
    created_at: '2026-09-28T15:30:00.000Z',
    owner_id: null,
    owner_type: null,
    expired: false,
    ...fields,
  }
}

/** Who is connected through Claude: two teammates, and a token whose owner is gone. */
export const claudeConnections: OauthAccessToken[] = [
  connection({
    id: 'oat_1Ab2Cd3E',
    owner_id: adminUser.id,
    owner_type: 'admin_user',
    owner: adminUser,
    scopes: ['read_products', 'write_products', 'read_orders', 'read_customers'],
  }),
  connection({
    id: 'oat_4Fg5Hi6J',
    created_at: '2026-09-15T08:10:00.000Z',
    owner_id: teammate.id,
    owner_type: 'admin_user',
    owner: { ...teammate, first_name: null, last_name: null, full_name: null },
    scopes: ['read_orders'],
  }),
  connection({
    id: 'oat_7Kl8Mn9O',
    created_at: '2026-08-30T17:45:00.000Z',
    scopes: ['read_products'],
  }),
]
