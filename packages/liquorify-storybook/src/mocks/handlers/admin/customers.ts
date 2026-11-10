import type { Address, Customer, TaxIdentifier } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { customerIdentifiers, regularCustomer } from '../../../fixtures/admin/customers'
import { customerGroups } from '../../../fixtures/admin/merchandising'
import { tagList } from './catalog'
import { countries } from './countries'
import { refusal } from './developers'
import { searchList } from './merchandising'

const admin = '/api/v3/admin'

/** The tags the store's customers carry. */
export const customerTags = ['Local pickup', 'Regular', 'Trade', 'Wholesale lead']

/**
 * What a customer's cards write, as Spree answers them: the profile, note and
 * groups saved by echoing what was sent onto the customer, addresses added,
 * changed and removed, store credit removed, and the customer erased.
 */
export function customerRequests(customer: Customer = regularCustomer) {
  return [
    ...countries,
    searchList(`${admin}/customer_groups`, customerGroups, (group) => group.name),
    ...tagList(customerTags),
    http.get(`${admin}/customers/:customerId`, () => HttpResponse.json(customer)),
    http.patch(`${admin}/customers/:customerId`, async ({ request }) => {
      const body = (await request.json()) as Partial<Customer> & { internal_note?: string }
      await delay(200)
      return HttpResponse.json({
        ...customer,
        ...body,
        ...(body.internal_note !== undefined && { internal_note_html: body.internal_note }),
        ...(body.customer_group_ids && {
          customer_groups: customerGroups.filter((group) =>
            body.customer_group_ids?.includes(group.id),
          ),
        }),
      })
    }),
    http.post(`${admin}/customers/:customerId/addresses`, async ({ request }) => {
      const body = (await request.json()) as Partial<Address>
      await delay(200)
      return HttpResponse.json(
        { ...customer.addresses?.[0], ...body, id: 'addr_9Nw4Ad6x' },
        {
          status: 201,
        },
      )
    }),
    http.patch(`${admin}/customers/:customerId/addresses/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Partial<Address>
      await delay(200)
      const address = customer.addresses?.find((each) => each.id === params.id)
      return HttpResponse.json({ ...address, ...body })
    }),
    http.delete(`${admin}/customers/:customerId/addresses/:id`, async () => {
      await delay(200)
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${admin}/customers/:customerId/store_credits/:id`, async () => {
      await delay(200)
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${admin}/customers/:customerId/anonymize`, async () => {
      await delay(200)
      return HttpResponse.json({ ...customer, anonymized: true })
    }),
  ]
}

/** Spree's refusal of an email another customer already has. */
export const profileEmailTaken = [
  http.patch(`${admin}/customers/:customerId`, async () => {
    await delay(200)
    return refusal('email', 'taken', 'has already been taken', 'Email has already been taken')
  }),
]

/** A customer's write held open, so the card or sheet stays saving. */
export const customerWriteHeld = [
  http.patch(`${admin}/customers/:customerId`, async () => {
    await delay('infinite')
  }),
]

/**
 * A customer's write refused as Spree refuses a teammate whose role may read
 * customers but not change them, for the roles that still see the controls.
 */
export const customerWriteForbidden = [
  http.patch(`${admin}/customers/:customerId`, async () => {
    await delay(200)
    return HttpResponse.json(
      {
        error: {
          code: 'access_denied',
          message: 'Missing permission: write_customers',
          details: { required_permission: 'write_customers' },
        },
      },
      { status: 403 },
    )
  }),
]

/**
 * The customer's export refused as Spree refuses a role that may read
 * customers but not everything the file holds: the support template has no
 * `read_payments` (`Admin::CustomersController::EXPORT_PERMISSIONS`).
 */
export const exportRefused = [
  http.get(`${admin}/customers/:customerId/export`, async () => {
    await delay(200)
    return HttpResponse.json(
      {
        error: {
          code: 'access_denied',
          message: 'Missing permission: read_payments',
          details: { required_permission: 'read_payments' },
        },
      },
      { status: 403 },
    )
  }),
]

/** The customer's export held open, so its button stays waiting. */
export const exportHeld = [
  http.get(`${admin}/customers/:customerId/export`, async () => {
    await delay('infinite')
  }),
]

/**
 * A customer's tax identifiers, as Spree lists and writes them: added and
 * changed by echoing what was sent, removed, and checked with the registry.
 */
export function taxIdentifierRequests(records: TaxIdentifier[] = customerIdentifiers) {
  return [
    http.get(`${admin}/customers/:customerId/tax_identifiers`, () =>
      HttpResponse.json({
        data: records,
        meta: { page: 1, limit: 25, count: records.length, pages: 1 },
      }),
    ),
    http.post(`${admin}/customers/:customerId/tax_identifiers`, async ({ request }) => {
      const body = (await request.json()) as Partial<TaxIdentifier>
      await delay(200)
      return HttpResponse.json({ ...records[0], ...body, id: 'txi_9Nw5Tx7S' }, { status: 201 })
    }),
    http.patch(
      `${admin}/customers/:customerId/tax_identifiers/:id`,
      async ({ params, request }) => {
        const body = (await request.json()) as Partial<TaxIdentifier>
        await delay(200)
        return HttpResponse.json({ ...records.find((each) => each.id === params.id), ...body })
      },
    ),
    http.delete(`${admin}/customers/:customerId/tax_identifiers/:id`, async () => {
      await delay(200)
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${admin}/customers/:customerId/tax_identifiers/:id/validate`, async ({ params }) => {
      await delay(200)
      return HttpResponse.json(records.find((each) => each.id === params.id))
    }),
  ]
}

/** The identifiers held open, so the card stays loading. */
export const taxIdentifiersHeld = [
  http.get(`${admin}/customers/:customerId/tax_identifiers`, async () => {
    await delay('infinite')
  }),
]

/**
 * Spree's refusal of an EU VAT number whose format its core check rejects,
 * as its Admin API answers it: the model's own wording, under the generic
 * `invalid` code and marked not specific, so the sheet shows the code's
 * generic text instead (SD-46).
 */
export const formatRefusalBody = {
  error: {
    code: 'validation_error',
    message: 'Number does not look like a valid EU VAT registration',
    details: {
      value: [
        {
          kind: 'EU VAT',
          code: 'invalid',
          message: 'does not look like a valid EU VAT registration',
          specific: false,
        },
      ],
    },
  },
}

export const taxIdentifierRefused = [
  http.post(`${admin}/customers/:customerId/tax_identifiers`, async () => {
    await delay(200)
    return HttpResponse.json(formatRefusalBody, { status: 422 })
  }),
]
