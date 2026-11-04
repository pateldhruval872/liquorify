import type { PaymentMethod, PaymentMethodType } from '@spree/admin-sdk'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

/**
 * How the Admin API answers a secret setting it holds: sixteen bullets and the
 * value's last four characters. The value here is invented and short, so it
 * looks like nothing a provider issues.
 */
export const maskedSecret = `${'•'.repeat(16)}cret`

function paymentMethod(
  id: string,
  name: string,
  type: string,
  fields: Partial<PaymentMethod> = {},
): PaymentMethod {
  return {
    id,
    name,
    description: null,
    type,
    session_required: false,
    source_required: true,
    metadata: {},
    active: true,
    capture_method: null,
    resolved_capture_method: 'checkout',
    storefront_visible: true,
    position: 1,
    created_at: created,
    updated_at: updated,
    preferences: {},
    logo_url: null,
    docs_url: null,
    third_party: false,
    ...fields,
  }
}

export const storeCreditMethod = paymentMethod('pm_3Hd8Kq2W', 'Store Credit', 'store_credit', {
  description: 'Store Credit',
})

/** Spree's test gateway, with its one secret setting held by the server. */
export const testGateway = paymentMethod('pm_6Vn2Lr9C', 'Test card gateway', 'bogus', {
  description: 'Cards for trying checkout. Never charges anyone.',
  session_required: true,
  position: 2,
  third_party: true,
  preferences: { dummy_key: 'PUBLICKEY123', dummy_secret_key: maskedSecret },
})

/** Payment by cheque, taken off the storefront and switched off. */
export const chequeMethod = paymentMethod('pm_8Ps4Tm6B', 'Pay by cheque', 'check', {
  description: 'Post a cheque within seven days.',
  active: false,
  storefront_visible: false,
  capture_method: 'manual',
  resolved_capture_method: 'manual',
  position: 3,
})

export const paymentMethods: PaymentMethod[] = [storeCreditMethod, testGateway, chequeMethod]

function paymentMethodType(
  type: string,
  label: string,
  fields: Partial<PaymentMethodType> = {},
): PaymentMethodType {
  return {
    type,
    label,
    description: null,
    schema: { type: 'object', properties: {}, additionalProperties: false },
    logo_url: null,
    docs_url: null,
    third_party: false,
    installed: false,
    ...fields,
  }
}

/** Spree's test gateway, as the browser-test server describes it. */
export const bogusType = paymentMethodType('bogus', 'Bogus', {
  third_party: true,
  schema: {
    type: 'object',
    properties: {
      dummy_key: { type: 'string', default: 'PUBLICKEY123' },
      dummy_secret_key: { type: ['string', 'null'], 'x-spree-secret': true },
    },
    additionalProperties: false,
  },
})

export const checkType = paymentMethodType('check', 'Check')

/** The browser-test server lists it; the dashboard leaves it out of the picker. */
export const customSourceType = paymentMethodType(
  'custom_payment_source_method',
  'Custom Payment Source Method',
)

export const storeCreditType = paymentMethodType('store_credit', 'Store Credit', {
  installed: true,
})

/** The four providers the browser-test server registers, in its order. */
export const paymentMethodTypes: PaymentMethodType[] = [
  bogusType,
  checkType,
  customSourceType,
  storeCreditType,
]

/**
 * The same providers as the server answers for a store that already has the
 * test gateway and a cheque method: each is marked installed, so the add sheet
 * leaves it out and the edit sheet still finds its settings.
 */
export const installedPaymentMethodTypes: PaymentMethodType[] = paymentMethodTypes.map((type) =>
  ['bogus', 'check'].includes(type.type) ? { ...type, installed: true } : type,
)

/**
 * Stripe as its gem would list it, written from `SpreeStripe::Gateway`'s two
 * password preferences and its setup guide. The browser-test server does not
 * load the gem, so no running screen shows it; the logo is left out so the
 * story makes no request outside.
 */
export const stripeTypeFromSource = paymentMethodType('stripe', 'Stripe', {
  third_party: true,
  docs_url: 'https://spreecommerce.org/docs/integrations/payments/stripe',
  schema: {
    type: 'object',
    properties: {
      publishable_key: { type: ['string', 'null'], 'x-spree-secret': true },
      secret_key: { type: ['string', 'null'], 'x-spree-secret': true },
    },
    additionalProperties: false,
  },
})
