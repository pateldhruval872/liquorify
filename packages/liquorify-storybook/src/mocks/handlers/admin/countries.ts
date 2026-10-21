import { HttpResponse, http } from 'msw'
import { countries as countryList } from '../../../fixtures/admin/countries'
import { onePage } from '../../page'

export const countries = [
  http.get('/api/v3/admin/countries', () => HttpResponse.json(onePage(countryList))),
]
