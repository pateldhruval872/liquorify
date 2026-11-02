import type { AdminUser, MeResponse, PermissionRule } from '@spree/admin-sdk'
import { everyPermissionKey } from './staff'

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

/**
 * `/me` for the story's admin. `keys` are the permission keys their roles
 * hold, which decide what a role or key they create may grant. Spree lists
 * an admin's one by one, every key in the catalog, rather than `write_all`.
 * The read-only default is a role holding every read key.
 */
export function meResponse(
  permissions: PermissionRule[],
  keys: string[] = permissions === fullAccess
    ? everyPermissionKey
    : everyPermissionKey.filter((key) => key.startsWith('read_')),
  user: AdminUser = adminUser,
): MeResponse {
  return { user, permissions, permission_keys: keys }
}
