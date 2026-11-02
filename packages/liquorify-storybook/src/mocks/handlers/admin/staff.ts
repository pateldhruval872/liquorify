import type { Role } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { roles, staffPermissionCatalog } from '../../../fixtures/admin/staff'

/** Spree's whole permission catalog, in place of the shorter one the API key stories use. */
export const staffPermissions = [
  http.get('/api/v3/admin/permissions', () =>
    HttpResponse.json({
      data: staffPermissionCatalog,
      meta: { count: staffPermissionCatalog.length },
    }),
  ),
]

/** Answers for one role at a time, as the role sheet asks when it edits or duplicates one. */
export function roleRecords(records: Role[] = roles) {
  return [
    http.get('/api/v3/admin/roles/:id', ({ params }) => {
      const role = records.find((record) => record.id === params.id)
      return role
        ? HttpResponse.json(role)
        : HttpResponse.json(
            { error: { code: 'record_not_found', message: 'Role not found' } },
            { status: 404 },
          )
    }),
  ]
}

/** Never answers, so the role sheet stays in its loading state. */
export const roleRecordHeld = [
  http.get('/api/v3/admin/roles/:id', async () => {
    await delay('infinite')
  }),
]
