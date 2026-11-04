import type { PaymentMethod, PaymentMethodType } from '@spree/admin-sdk'
import { HttpResponse, http } from 'msw'
import { paymentMethods, paymentMethodTypes } from '../../../fixtures/admin/payments'
import { recordRequests } from './records'

/** The store's payment methods, the providers it may add, and writes that succeed. */
export function paymentMethodRequests(
  records: PaymentMethod[] = paymentMethods,
  types: PaymentMethodType[] = paymentMethodTypes,
) {
  return [
    http.get('/api/v3/admin/payment_methods/types', () => HttpResponse.json({ data: types })),
    ...recordRequests('payment_methods', records),
  ]
}
