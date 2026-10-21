import type { AdminUser, MeResponse, PermissionRule } from '@spree/admin-sdk'

export const adminUser: AdminUser = {
  id: 'admin_7xQ2pL9m',
  email: 'alex.morgan@example.com',
  first_name: 'Alex',
  last_name: 'Morgan',
  full_name: 'Alex Morgan',
  selected_locale: null,
  created_at: '2026-01-15T09:00:00.000Z',
  updated_at: '2026-09-20T09:00:00.000Z',
  avatar_url: null,
  roles: [{ id: 'role_3kD8sW1z', name: 'admin' }],
  stores: [{ id: 'store_9Fh2Lq4c', name: 'Sample Store', code: 'sample' }],
}

export const fullAccess: PermissionRule[] = [
  { allow: true, actions: ['manage'], subjects: ['all'], has_conditions: false },
]

export const readOnly: PermissionRule[] = [
  { allow: true, actions: ['read'], subjects: ['all'], has_conditions: false },
]

export function meResponse(permissions: PermissionRule[]): MeResponse {
  return {
    user: adminUser,
    permissions,
    permission_keys: permissions === fullAccess ? ['write_all'] : ['read_all'],
  }
}
