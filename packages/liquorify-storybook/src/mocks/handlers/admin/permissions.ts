import { HttpResponse, http } from 'msw'
import { permissionCatalog } from '../../../fixtures/admin/permissions'

export const permissions = [
  http.get('/api/v3/admin/permissions', () =>
    HttpResponse.json({ data: permissionCatalog, meta: { count: permissionCatalog.length } }),
  ),
]
