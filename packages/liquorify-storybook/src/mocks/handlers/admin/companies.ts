import type { TaxExemptionCertificate } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { certificates, headOffice, tradeGroup } from '../../../fixtures/admin/companies'
import { exemptionReasons } from '../../../fixtures/admin/settings'
import { onePage } from '../../page'
import { countries } from './countries'
import { reasonRequests } from './settings'

const admin = '/api/v3/admin'
const certificatesPath = `${admin}/companies/:companyId/tax_exemption_certificates`

/**
 * A company's tax exemption certificates, as Spree answers them: listed,
 * added, verified, revoked and deleted, each change echoed onto the record.
 * The store's exemption reasons and the countries come with them, for the add
 * sheet.
 */
export function certificateRequests(records: TaxExemptionCertificate[] = certificates) {
  const find = (id: unknown) => records.find((record) => record.id === id) ?? records[0]
  return [
    ...countries,
    ...reasonRequests('tax-exemption-reasons', exemptionReasons),
    http.get(certificatesPath, () => HttpResponse.json(onePage(records))),
    http.post(certificatesPath, async ({ request }) => {
      const body = (await request.json()) as Partial<TaxExemptionCertificate>
      await delay(200)
      return HttpResponse.json(
        { ...certificates[0], ...body, id: 'cert_9Nw2Ce5T', status: 'pending' },
        { status: 201 },
      )
    }),
    http.patch(`${certificatesPath}/:id/verify`, async ({ params }) => {
      await delay(200)
      return HttpResponse.json({ ...find(params.id), status: 'verified', active: true })
    }),
    http.patch(`${certificatesPath}/:id/revoke`, async ({ params }) => {
      await delay(200)
      return HttpResponse.json({ ...find(params.id), status: 'revoked', active: false })
    }),
    http.delete(`${certificatesPath}/:id`, async () => {
      await delay(200)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/** The certificate list held open, so the card stays loading. */
export const certificatesHeld = [http.get(certificatesPath, () => new Promise<never>(() => {}))]

/** A company's address book entry saved, as Spree echoes it. */
export const companyAddressRequests = [
  ...countries,
  http.post(`${admin}/companies/:companyId/addresses`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    await delay(200)
    return HttpResponse.json(
      { ...headOffice, ...body, id: 'addr_8Nw3Ad7y', owner_id: tradeGroup.id },
      { status: 201 },
    )
  }),
  http.patch(`${admin}/companies/:companyId/addresses/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    await delay(200)
    return HttpResponse.json({ ...headOffice, ...body })
  }),
]
