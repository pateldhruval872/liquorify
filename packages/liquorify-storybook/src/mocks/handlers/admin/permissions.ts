import { delay, HttpResponse, http } from 'msw'
import { permissionCatalog } from '../../../fixtures/admin/permissions'

export const permissions = [
  http.get('/api/v3/admin/permissions', () =>
    HttpResponse.json({ data: permissionCatalog, meta: { count: permissionCatalog.length } }),
  ),
]

/** Never answers, so whatever draws the catalog stays loading. */
export const permissionsHeld = [
  http.get('/api/v3/admin/permissions', async () => {
    await delay('infinite')
  }),
]
