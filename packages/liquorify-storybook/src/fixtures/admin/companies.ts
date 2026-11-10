import type { Address, Company, TaxExemptionCertificate } from '@spree/admin-sdk'
import { exemptionReasons } from './settings'

// Batch 12's companies (DA-CUS-04, DA-CUS-05), each shaped as the browser-test
// server answered the same request on 2026-11-10. Every name, address and
// number is invented.

const created = '2026-09-14T15:20:00.000Z'
const updated = '2026-11-02T10:05:00.000Z'

function company(
  id: string,
  name: string,
  parent: Company | null,
  fields: Partial<Company> = {},
): Company {
  return {
    id,
    name,
    kind: parent ? 'division' : 'company',
    po_number_required: false,
    parent_id: parent?.id ?? null,
    ancestors: parent
      ? [...parent.ancestors, { id: parent.id, name: parent.name, kind: parent.kind }]
      : [],
    external_references: {},
    metadata: {},
    created_at: created,
    updated_at: updated,
    children_count: 0,
    members_count: 0,
    ...fields,
  }
}

export const tradeGroup = company('comp_8Tg3Hq5W', 'Tidewater Trading Co.', null, {
  children_count: 2,
  members_count: 3,
})
export const tradeDivision = company('comp_9Td4Nr6X', 'Tidewater Coast', tradeGroup, {
  members_count: 2,
})

const resale = exemptionReasons.find((reason) => reason.code === 'RESALE') ?? exemptionReasons[0]
const charitable =
  exemptionReasons.find((reason) => reason.code === 'CHARITABLE') ?? exemptionReasons[0]

function certificate(
  id: string,
  number: string,
  fields: Partial<TaxExemptionCertificate> = {},
): TaxExemptionCertificate {
  return {
    id,
    certificate_number: number,
    status: 'pending',
    issuing_authority: null,
    metadata: {},
    issued_at: null,
    expires_at: null,
    verified_at: null,
    created_at: created,
    updated_at: updated,
    company_id: tradeGroup.id,
    tax_exemption_reason_id: resale.id,
    tax_exemption_reason: resale,
    country_code: 'US',
    state_code: 'WA',
    active: false,
    lapsed: false,
    can_be_deleted: true,
    document_filename: null,
    document_byte_size: null,
    document_url: null,
    ...fields,
  }
}

export const pendingCertificate = certificate('cert_2Pd5Rk8M', 'TW-RS-20481', {
  issuing_authority: 'Washington Department of Revenue',
  issued_at: '2026-08-03T00:00:00.000Z',
  document_filename: 'resale-certificate.pdf',
  document_byte_size: 48213,
  document_url: '/fixtures/resale-certificate.pdf',
})

export const verifiedCertificate = certificate('cert_3Vf6Sl9N', 'TW-RS-19902', {
  status: 'verified',
  issuing_authority: 'Washington Department of Revenue',
  issued_at: '2026-01-12T00:00:00.000Z',
  expires_at: '2028-01-12T00:00:00.000Z',
  verified_at: '2026-01-20T16:40:00.000Z',
  active: true,
  can_be_deleted: false,
})

export const revokedCertificate = certificate('cert_4Rv7Tm1P', 'TW-CH-00317', {
  status: 'revoked',
  tax_exemption_reason_id: charitable.id,
  tax_exemption_reason: charitable,
  country_code: null,
  state_code: null,
})

export const expiredCertificate = certificate('cert_5Ex8Un2Q', 'TW-RS-17533', {
  status: 'expired',
  issued_at: '2023-06-01T00:00:00.000Z',
  expires_at: '2025-06-01T00:00:00.000Z',
  verified_at: '2023-06-09T09:15:00.000Z',
  can_be_deleted: false,
})

export const lapsedCertificate = certificate('cert_6Lp9Vo3R', 'TW-RS-18210', {
  status: 'verified',
  issued_at: '2024-04-01T00:00:00.000Z',
  expires_at: '2026-04-01T00:00:00.000Z',
  verified_at: '2024-04-04T11:30:00.000Z',
  lapsed: true,
  can_be_deleted: false,
})

export const certificates: TaxExemptionCertificate[] = [
  pendingCertificate,
  verifiedCertificate,
  revokedCertificate,
  expiredCertificate,
  lapsedCertificate,
]

function companyAddress(id: string, fields: Partial<Address>): Address {
  return {
    id,
    label: null,
    first_name: null,
    last_name: null,
    full_name: '',
    address1: '',
    address2: null,
    postal_code: '',
    city: '',
    phone: null,
    company: tradeGroup.name,
    country_name: 'United States',
    country_code: 'US',
    state_text: 'WA',
    state_code: 'WA',
    quick_checkout: false,
    is_default_billing: false,
    is_default_shipping: false,
    state_name: 'Washington',
    metadata: {},
    created_at: created,
    updated_at: updated,
    latitude: null,
    longitude: null,
    customer_id: null,
    owner_id: tradeGroup.id,
    owner_type: 'company',
    ...fields,
  } as Address
}

export const headOffice = companyAddress('addr_7Ho1Wp4S', {
  label: 'Head office',
  address1: '210 Harbor Street',
  address2: 'Suite 500',
  postal_code: '98101',
  city: 'Seattle',
  phone: '555-0132',
  is_default_billing: true,
  is_default_shipping: true,
})
