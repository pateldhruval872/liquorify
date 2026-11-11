import type { PermissionRule } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import { storeParameters } from '../../../decorators/store'
import {
  certificateRequests,
  companyAddressRequests,
} from '../../../mocks/handlers/admin/companies'

interface CompanyOptions {
  rules?: PermissionRule[]
  column?: Column
  /** A sheet, dialog, menu or toast is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the company's records, for a held or changed request. */
  first?: HttpHandler[]
}

/**
 * A signed-in admin on a company's page (DA-CUS-05), with the records its
 * cards read and write: the company's certificates, the store's exemption
 * reasons, the countries, and the address book's writes.
 */
export function companyParameters({
  rules,
  column,
  viewport = false,
  first = [],
}: CompanyOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    // `first` leads, so its answers win over the company's own.
    msw: {
      handlers: {
        first,
        ...base.msw.handlers,
        companies: [...certificateRequests(), ...companyAddressRequests],
      },
    },
  }
}
