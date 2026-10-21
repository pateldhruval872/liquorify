import type { PermissionRule } from '@spree/admin-sdk'
import { HttpResponse, http } from 'msw'
import { adminUser, fullAccess, meResponse } from '../../../fixtures/admin/session'

/** A signed-in admin with the given permissions, as the auth provider finds them on mount. */
export function adminSession(permissions: PermissionRule[] = fullAccess) {
  return [
    http.post('/api/v3/admin/auth/refresh', () =>
      HttpResponse.json({ token: 'story-access-token', user: adminUser }),
    ),
    http.get('/api/v3/admin/me', () => HttpResponse.json(meResponse(permissions))),
  ]
}
