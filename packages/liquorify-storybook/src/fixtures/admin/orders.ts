import type {
  Actor,
  Address,
  CreditCard,
  Customer,
  DigitalLink,
  Discount,
  Fee,
  Fulfillment,
  GiftCard,
  LineItem,
  Order,
  Payment,
  PaymentMethod,
  PermissionRule,
  TaxLine,
} from '@spree/admin-sdk'
import { clayMug, linenApron, sandTote, slateCap } from './catalog'
import { erasedShopper, morgan } from './loyalty'
import { chequeMethod, storeCreditMethod, testGateway } from './payments'
import { channels, markets } from './settings'
import { read, shellRules, templateRules, write } from './shell'

/**
 * Batch 8's orders, part 1: an order and its money, in each state the order
 * page shows, with the payments, discounts, fees, tax lines and download links
 * its cards read. Every name, address, card and reference is invented. Dates
 * sit around the frozen clock, 1 October 2026 (`../clock.ts`).
 */

const created = '2026-09-28T09:12:00.000Z'
const placed = '2026-09-28T09:20:00.000Z'
const updated = '2026-09-29T16:40:00.000Z'

const [onlineStore, wholesale] = channels
const [northAmerica] = markets

// ---------------------------------------------------------------------------
// Who acts on an order
// ---------------------------------------------------------------------------

export const staffActor: Actor = { id: 'admin_7xQ2pL9m', type: 'admin_user', label: 'Alex Morgan' }
export const teammateActor: Actor = {
  id: 'admin_3Rk8Wn5c',
  type: 'admin_user',
  label: 'Jordan Lee',
}
/** An integration that called the Admin API with its secret key. */
export const connectorActor: Actor = {
  id: 'key_5Pd2Hs8v',
  type: 'api_key',
  label: 'Warehouse connector',
}
/** A member of staff who left no name. */
export const unnamedActor: Actor = { id: 'admin_9Lc4Tq1z', type: 'admin_user', label: null }

// ---------------------------------------------------------------------------
// Addresses and customers
// ---------------------------------------------------------------------------

function address(id: string, fields: Partial<Address> = {}): Address {
  return {
    id,
    label: null,
    first_name: 'Morgan',
    last_name: 'Reyes',
    full_name: 'Morgan Reyes',
    address1: '214 Larkspur Lane',
    address2: 'Apt 3B',
    postal_code: '97205',
    city: 'Portland',
    phone: '555-0142',
    company: null,
    country_name: 'United States',
    country_code: 'US',
    state_text: null,
    state_code: 'OR',
    quick_checkout: false,
    is_default_billing: false,
    is_default_shipping: false,
    state_name: 'Oregon',
    metadata: {},
    created_at: created,
    updated_at: created,
    latitude: null,
    longitude: null,
    customer_id: morgan.id,
    owner_id: null,
    owner_type: null,
    ...fields,
  }
}

export const shippingAddress = address('addr_4Ln7Qw2e')
export const billingAddress = address('addr_6Tp9Xc3r', {
  address1: '88 Fernhill Road',
  address2: null,
  postal_code: '97214',
})

export const orderCustomer: Customer = morgan

/** A customer who asked to be erased: the order keeps its figures, not their name. */
export const erasedCustomer: Customer = erasedShopper

// ---------------------------------------------------------------------------
// Line items
// ---------------------------------------------------------------------------

const apronVariant = linenApron.variants?.[0]

function lineItem(id: string, fields: Partial<LineItem>): LineItem {
  return {
    id,
    variant_id: 'variant_0',
    seller_id: null,
    preorder: false,
    preorder_ships_at: null,
    quantity: 1,
    currency: 'USD',
    name: 'Item',
    slug: 'item',
    options_text: '',
    price: '0.00',
    total: '0.00',
    adjustment_total: '0.00',
    additional_tax_total: '0.00',
    included_tax_total: '0.00',
    discount_total: '0.00',
    pre_tax_amount: '0.00',
    discounted_amount: '0.00',
    compare_at_amount: null,
    thumbnail_url: null,
    option_values: [],
    digital_links: [],
    external_references: {},
    metadata: {},
    price_source: null,
    created_at: created,
    updated_at: created,
    catalog_price: null,
    price_list_id: null,
    price_list_name: null,
    catalog_id: null,
    catalog_name: null,
    cost_price: null,
    tax_category_id: null,
    ...fields,
  }
}

export const mugItem = lineItem('li_2Mg6Kp8a', {
  variant_id: clayMug.default_variant?.id ?? 'variant_mug',
  quantity: 2,
  name: 'Clay mug',
  slug: clayMug.slug,
  price: '24.00',
  total: '51.84',
  additional_tax_total: '3.84',
  adjustment_total: '3.84',
  pre_tax_amount: '48.00',
  discounted_amount: '48.00',
  catalog_price: '24.00',
  thumbnail_url: '/fixtures/product-clay.png',
})

export const apronItem = lineItem('li_5Ap3Ln7b', {
  variant_id: apronVariant?.id ?? 'variant_apron',
  quantity: 1,
  name: 'Linen apron',
  slug: linenApron.slug,
  options_text: 'Color: Olive, Size: M',
  price: '38.00',
  total: '41.04',
  additional_tax_total: '3.04',
  adjustment_total: '3.04',
  pre_tax_amount: '38.00',
  discounted_amount: '38.00',
  catalog_price: '38.00',
  thumbnail_url: '/fixtures/product-olive.png',
})

/** The draft's apron, at a price agreed with the customer. */
export const negotiatedApronItem: LineItem = {
  ...apronItem,
  id: 'li_8Ng4Ap2c',
  price: '32.00',
  total: '32.00',
  additional_tax_total: '0.00',
  adjustment_total: '0.00',
  pre_tax_amount: '32.00',
  discounted_amount: '32.00',
  price_source: 'manual',
}

export const capItem = lineItem('li_3Cp7Sl9d', {
  variant_id: slateCap.default_variant?.id ?? 'variant_cap',
  quantity: 1,
  name: 'Slate cap',
  slug: slateCap.slug,
  price: '18.00',
  total: '18.00',
  pre_tax_amount: '18.00',
  discounted_amount: '18.00',
  catalog_price: '18.00',
  thumbnail_url: '/fixtures/product-slate.png',
})

export const toteItem = lineItem('li_9Tt2Sd4e', {
  variant_id: sandTote.default_variant?.id ?? 'variant_tote',
  quantity: 3,
  name: 'Sand tote',
  slug: sandTote.slug,
  price: '16.00',
  total: '48.00',
  pre_tax_amount: '48.00',
  discounted_amount: '48.00',
  catalog_price: '16.00',
  thumbnail_url: '/fixtures/product-sand.png',
})

// ---------------------------------------------------------------------------
// Download links
// ---------------------------------------------------------------------------

function digitalLink(id: string, filename: string, fields: Partial<DigitalLink> = {}): DigitalLink {
  return {
    id,
    access_counter: 0,
    filename,
    content_type: 'application/pdf',
    download_url: `https://downloads.example.com/${id}`,
    expires_at: '2026-10-05T09:20:00.000Z',
    authorizable: true,
    expired: false,
    access_limit_exceeded: false,
    created_at: placed,
    updated_at: placed,
    ...fields,
  }
}

export const availableLink = digitalLink('dlink_2Av5Kq8m', 'glazing-guide.pdf', {
  access_counter: 1,
})
export const expiredLink = digitalLink('dlink_4Ex7Lr9n', 'kiln-schedule.pdf', {
  access_counter: 2,
  expires_at: '2026-09-21T09:20:00.000Z',
  authorizable: false,
  expired: true,
})
export const usedUpLink = digitalLink('dlink_6Us9Ms2p', 'glaze-recipes.zip', {
  content_type: 'application/zip',
  access_counter: 5,
  authorizable: false,
  access_limit_exceeded: true,
})
export const endlessLink = digitalLink('dlink_8Nv3Pt4q', 'studio-playlist.mp3', {
  content_type: 'audio/mpeg',
  expires_at: null,
})

export const guideItem = lineItem('li_6Gd8Gl2f', {
  variant_id: 'variant_guide',
  quantity: 1,
  name: 'Glazing guide',
  slug: 'glazing-guide',
  price: '12.00',
  total: '12.00',
  pre_tax_amount: '12.00',
  discounted_amount: '12.00',
  digital_links: [availableLink, expiredLink, usedUpLink],
})

export const playlistItem = lineItem('li_7Pl2Sp5g', {
  variant_id: 'variant_playlist',
  quantity: 1,
  name: 'Studio playlist',
  slug: 'studio-playlist',
  price: '4.00',
  total: '4.00',
  pre_tax_amount: '4.00',
  discounted_amount: '4.00',
  digital_links: [endlessLink],
})

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const savedCard: CreditCard = {
  id: 'card_3Vs8Kd2w',
  brand: 'visa',
  last4: '4242',
  month: 8,
  year: 2029,
  name: 'Morgan Reyes',
  default: true,
  gateway_payment_profile_id: null,
  customer_id: morgan.id,
  payment_method_id: testGateway.id,
  metadata: {},
  created_at: '2026-06-02T10:00:00.000Z',
  updated_at: '2026-06-02T10:00:00.000Z',
}

export const secondCard: CreditCard = {
  ...savedCard,
  id: 'card_7Mc2Ln6x',
  brand: 'mastercard',
  last4: '4444',
  month: 2,
  year: 2028,
  default: false,
}

/** Methods the add payment dialog offers: Spree's test gateway needs a saved card. */
export const orderPaymentMethods: PaymentMethod[] = [
  testGateway,
  { ...chequeMethod, active: true, source_required: false },
  storeCreditMethod,
]

function payment(id: string, number: string, fields: Partial<Payment> = {}): Payment {
  return {
    id,
    payment_method_id: testGateway.id,
    response_code: null,
    number,
    status: 'completed',
    amount: '101.52',
    source_type: 'credit_card',
    source_id: savedCard.id,
    source: savedCard,
    payment_method: testGateway,
    metadata: {},
    avs_response: 'D',
    cvv_response_code: 'M',
    cvv_response_message: null,
    gateway_dashboard_payment_url: null,
    created_at: placed,
    updated_at: placed,
    avs_risky: false,
    cvv_risky: false,
    captured_amount: '0.00',
    order_id: null,
    capture_events: [],
    refunds: [],
    ...fields,
  }
}

export const authorizedPayment = payment('pay_2Au6Hq9k', 'PCK7Z2LM', {
  status: 'pending',
  response_code: '12345-AUTH',
})

export const capturedPayment = payment('pay_4Cp8Jr2l', 'PJ4N8XRT', {
  response_code: '12345-SALE',
  captured_amount: '101.52',
  capture_events: [
    { id: 'pce_1Ca3Pt5r', created_at: placed, updated_at: placed, amount: '101.52' },
  ],
  gateway_dashboard_payment_url: 'https://gateway.example.com/payments/12345-SALE',
})

/** Taken in two captures, as an order shipped in two parts is charged. */
export const splitCapturedPayment = payment('pay_5Sc9Ks3m', 'PW2K9DQE', {
  response_code: '12345-SPLIT',
  captured_amount: '101.52',
  capture_events: [
    { id: 'pce_2Sp4Qu6s', created_at: placed, updated_at: placed, amount: '51.84' },
    {
      id: 'pce_3Sp5Rv7t',
      created_at: '2026-09-30T14:05:00.000Z',
      updated_at: '2026-09-30T14:05:00.000Z',
      amount: '49.68',
    },
  ],
})

/** The card issuer said the billing address and the security code did not match. */
export const riskyPayment = payment('pay_6Rk2Lt4n', 'PR6M3VYH', {
  status: 'pending',
  response_code: '12345-RISK',
  avs_response: 'N',
  avs_risky: true,
  cvv_response_code: 'N',
  cvv_response_message: 'Security code does not match',
  cvv_risky: true,
})

export const failedPayment = payment('pay_7Fl3Mu5o', 'PF8T4WBN', {
  status: 'failed',
  response_code: null,
  avs_response: null,
  cvv_response_code: null,
})

export const voidedPayment = payment('pay_8Vd4Nv6p', 'PV3H7KCX', {
  status: 'void',
  response_code: '12345-VOID',
})

export const chequePayment = payment('pay_9Cq5Ow7q', 'PC5L2JZA', {
  status: 'checkout',
  payment_method_id: chequeMethod.id,
  payment_method: chequeMethod,
  source_type: null,
  source_id: null,
  source: null,
  avs_response: null,
  cvv_response_code: null,
  amount: '101.52',
})

export const storeCreditPayment = payment('pay_1Sc6Px8r', 'PS9Q6MHE', {
  payment_method_id: storeCreditMethod.id,
  payment_method: storeCreditMethod,
  source_type: 'store_credit',
  source_id: 'sc_4Mr8Tz2h',
  source: null,
  amount: '40.00',
  captured_amount: '40.00',
  avs_response: null,
  cvv_response_code: null,
})

// ---------------------------------------------------------------------------
// Tax lines, discounts and fees
// ---------------------------------------------------------------------------

function taxLine(
  id: string,
  label: string,
  amount: string,
  fields: Partial<TaxLine> = {},
): TaxLine {
  return {
    id,
    label,
    included: false,
    credit: false,
    rate: '0.08',
    tax_rate_id: 'trate_4Or8Ws2d',
    line_item_id: mugItem.id,
    fulfillment_id: null,
    fee_id: null,
    return_line_item_id: null,
    claim_line_item_id: null,
    exchange_line_item_id: null,
    amount,
    provider_id: null,
    metadata: null,
    taxability_reason: 'standard_rated',
    country_code: 'US',
    state_code: 'OR',
    data: null,
    created_at: placed,
    updated_at: placed,
    original_tax_line_id: null,
    ...fields,
  }
}

/** Oregon sales tax, added on the items and on delivery. */
export const addedTaxLines: TaxLine[] = [
  taxLine('tline_1Or2Mg4a', 'Oregon sales tax 8%', '3.84'),
  taxLine('tline_2Or3Ap5b', 'Oregon sales tax 8%', '3.04', { line_item_id: apronItem.id }),
  taxLine('tline_3Or4Dl6c', 'Delivery tax 8%', '0.64', {
    line_item_id: null,
    fulfillment_id: 'ful_2Rd6Kp9w',
  }),
]

/** German VAT, already inside the prices. */
export const includedTaxLines: TaxLine[] = [
  taxLine('tline_4De5Mg7d', 'VAT 19% (included)', '7.66', {
    included: true,
    rate: '0.19',
    country_code: 'DE',
    state_code: null,
  }),
  taxLine('tline_5De6Ap8e', 'VAT 19% (included)', '6.07', {
    included: true,
    rate: '0.19',
    line_item_id: apronItem.id,
    country_code: 'DE',
    state_code: null,
  }),
]

/** One line taxed, one zero-rated and one exempt under a resale certificate. */
export const reasonedTaxLines: TaxLine[] = [
  taxLine('tline_6Rs7Mg9f', 'Oregon sales tax 8%', '3.84'),
  taxLine('tline_7Rs8Bk1g', 'Oregon sales tax 8%', '0.00', {
    line_item_id: guideItem.id,
    rate: '0',
    taxability_reason: 'zero_rated',
  }),
  taxLine('tline_8Rs9Ap2h', 'Oregon sales tax 8%', '0.00', {
    line_item_id: apronItem.id,
    rate: '0',
    taxability_reason: 'customer_exempt',
    data: {
      exemption: {
        reason_code: 'RESALE',
        reason_name: 'Resale',
        certificate_number: 'RS-4471-OR',
      },
    },
  }),
]

function discount(
  id: string,
  label: string,
  amount: string,
  fields: Partial<Discount> = {},
): Discount {
  return {
    id,
    label,
    kind: 'manual',
    code: null,
    value_type: 'flat',
    value: amount.replace('-', ''),
    promotion_id: null,
    line_item_id: null,
    fulfillment_id: null,
    amount,
    metadata: null,
    created_at: placed,
    updated_at: placed,
    ...fields,
  }
}

export const promotionDiscount = discount('disc_2Pr5Au8i', 'Promotion (Autumn welcome)', '-8.60', {
  kind: 'promotion',
  code: 'AUTUMN10',
  value_type: 'percent',
  value: '10',
  promotion_id: 'promo_4Aw6Lc8m',
})
export const manualDiscount = discount('disc_3Mn6Gw9j', 'Goodwill for the late delivery', '-5.00')

function fee(id: string, label: string, kind: Fee['kind'], amount: string): Fee {
  return {
    id,
    label,
    kind,
    line_item_id: null,
    fulfillment_id: null,
    amount,
    metadata: null,
    created_at: placed,
    updated_at: placed,
  }
}

export const giftWrapFee = fee('fee_2Gw7Hx3k', 'Gift wrap', 'gift_wrap', '4.50')
export const exchangeFee = fee('fee_3Ex8Jy4l', 'Exchange price difference', 'exchange', '6.00')
/** A kind an extension registered, which the card shows as it arrives. */
export const insuranceFee = fee('fee_4In9Kz5m', 'Parcel insurance', 'insurance', '2.00')

// ---------------------------------------------------------------------------
// Gift card
// ---------------------------------------------------------------------------

export const orderGiftCard: GiftCard = {
  id: 'gc_6Bd3Fh8q',
  code: 'GIFT-7QK2-M4PZ',
  status: 'partially_redeemed',
  currency: 'USD',
  amount: '50.00',
  amount_used: '25.00',
  amount_authorized: '0.00',
  amount_remaining: '25.00',
  expires_at: '2027-06-30',
  redeemed_at: null,
  expired: false,
  active: true,
  created_at: '2026-05-01T09:00:00.000Z',
  updated_at: placed,
  customer_id: null,
  created_by_id: null,
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** The two items, delivery and tax every placed order below starts from. */
function order(id: string, number: string, fields: Partial<Order> = {}): Order {
  return {
    id,
    market_id: northAmerica.id,
    withdrawal_period_ends_at: null,
    within_withdrawal_period: true,
    cart_id: null,
    channel_id: onlineStore.id,
    company_id: null,
    company_name: null,
    po_document_filename: null,
    po_document_byte_size: null,
    number,
    email: morgan.email,
    customer_note: null,
    po_number: null,
    currency: 'USD',
    locale: 'en',
    total_quantity: 3,
    coupon_code: null,
    fulfillment_status: 'unfulfilled',
    payment_status: 'paid',
    completed_at: placed,
    item_total: '86.00',
    discount_total: '0.00',
    tax_total: '7.52',
    included_tax_total: '0.00',
    additional_tax_total: '7.52',
    delivery_total: '8.00',
    fee_total: '0.00',
    gift_card_total: '0.00',
    store_credit_total: '0.00',
    total: '101.52',
    amount_due: '0.00',
    covered_by_store_credit: false,
    payments: [capturedPayment],
    adjustment_total: '7.52',
    items: [mugItem, apronItem],
    fulfillments: [],
    billing_address: billingAddress,
    shipping_address: shippingAddress,
    gift_card: null,
    market: northAmerica,
    external_references: {},
    status: 'placed',
    last_ip_address: '203.0.113.24',
    considered_risky: false,
    confirmation_delivered: true,
    store_owner_notification_delivered: true,
    metadata: {},
    cancel_note: null,
    canceled_at: null,
    approved_at: null,
    created_at: created,
    updated_at: updated,
    payment_total: '101.52',
    commission_amount_total: '0.00',
    commission_tax_total: '0.00',
    commission_total: '0.00',
    preferred_stock_location_id: null,
    po_document_url: null,
    seller_id: null,
    order_group_id: null,
    tags: [],
    internal_note: null,
    internal_note_html: null,
    approver_id: null,
    approver_type: null,
    canceler_id: null,
    canceler_type: null,
    created_by_id: null,
    created_by_type: null,
    cancel_reason_id: null,
    cancel_reason_name: null,
    customer_id: morgan.id,
    customer: morgan,
    channel: onlineStore,
    payment_splits: [],
    freight_summary: null,
    ...fields,
  }
}

/** Placed and paid by card, captured at checkout. */
export const paidOrder = order('or_2Pd5Kq8w', 'R100241')

/** Placed with nothing paid yet. */
export const unpaidOrder = order('or_3Un6Lr9x', 'R100242', {
  payment_status: 'none',
  payments: [],
  payment_total: '0.00',
  amount_due: '101.52',
})

/** Placed and authorized at checkout; the store captures later. */
export const authorizedOrder = order('or_4Au7Ms2y', 'R100243', {
  payment_status: 'authorized',
  payments: [authorizedPayment],
  payment_total: '0.00',
  amount_due: '101.52',
})

/** One card payment failed, another was voided, and a cheque waits to be counted. */
export const mixedPaymentsOrder = order('or_5Mx8Nt3z', 'R100244', {
  payment_status: 'none',
  payments: [failedPayment, voidedPayment, chequePayment],
  payment_total: '0.00',
  amount_due: '101.52',
})

export const partlyRefundedOrder = order('or_6Pr9Ou4a', 'R100245', {
  payment_status: 'partially_refunded',
  payments: [splitCapturedPayment],
  payment_total: '63.52',
  fulfillment_status: 'fulfilled',
})

export const refundedOrder = order('or_7Rf1Pv5b', 'R100246', {
  payment_status: 'refunded',
  payments: [{ ...capturedPayment, id: 'pay_2Rf7Qx9s', number: 'PB7D3NGU' }],
  payment_total: '0.00',
  fulfillment_status: 'canceled',
})

/**
 * Canceled by a teammate, with the store's reason and a note, and the payment
 * voided. Nothing was captured, so the payment status reads none, as the
 * server answered for a canceled order whose only payment was voided.
 */
export const canceledOrder = order('or_8Cn2Qw6c', 'R100247', {
  status: 'canceled',
  payment_status: 'none',
  fulfillment_status: 'canceled',
  payments: [voidedPayment],
  payment_total: '0.00',
  canceled_at: '2026-09-29T11:05:00.000Z',
  canceler_id: teammateActor.id,
  canceler_type: 'admin_user',
  canceler: teammateActor,
  cancel_reason_id: 'ocr_1Pl3Ok5I',
  cancel_reason_name: 'Customer changed their mind',
  cancel_note: 'Called on Monday morning and asked us to stop it before it shipped.',
})

/** Canceled by the warehouse's integration, with no reason given. */
export const canceledByKeyOrder = order('or_9Ck3Rx7d', 'R100248', {
  status: 'canceled',
  payment_status: 'none',
  fulfillment_status: 'canceled',
  payments: [voidedPayment],
  payment_total: '0.00',
  canceled_at: '2026-09-29T11:05:00.000Z',
  canceler_id: connectorActor.id,
  canceler_type: 'api_key',
  canceler: connectorActor,
})

/** Card checks failed, so the order waits for someone to approve it. */
export const riskyOrder = order('or_1Rk4Sy8e', 'R100249', {
  considered_risky: true,
  payment_status: 'authorized',
  payments: [riskyPayment],
  payment_total: '0.00',
  amount_due: '101.52',
})

export const approvedOrder = order('or_2Ap5Tz9f', 'R100250', {
  considered_risky: true,
  approved_at: '2026-09-28T13:00:00.000Z',
  approver_id: staffActor.id,
  approver_type: 'admin_user',
  approver: staffActor,
  payments: [{ ...riskyPayment, status: 'completed', captured_amount: '101.52' }],
})

/** A draft a teammate is putting together, with an agreed price on the apron. */
export const draftOrder = order('or_3Dr6Ua1g', 'R100251', {
  status: 'draft',
  completed_at: null,
  payment_status: 'none',
  fulfillment_status: 'unfulfilled',
  payments: [],
  payment_total: '0.00',
  items: [mugItem, negotiatedApronItem],
  item_total: '80.00',
  tax_total: '0.00',
  additional_tax_total: '0.00',
  delivery_total: '0.00',
  adjustment_total: '0.00',
  total: '80.00',
  amount_due: '80.00',
  confirmation_delivered: false,
  store_owner_notification_delivered: null,
  created_by_id: teammateActor.id,
  created_by_type: 'admin_user',
  created_by: teammateActor,
  channel_id: wholesale.id,
  channel: wholesale,
  last_ip_address: null,
})

/** A draft with a code typed in that no promotion has taken up yet. */
export const draftWithCodeOrder = order('or_4Dc7Vb2h', 'R100252', {
  ...draftOrder,
  id: 'or_4Dc7Vb2h',
  number: 'R100252',
  coupon_code: 'SPRING25',
})

/** A promotion's code and a manual discount, as the discounts card and summary show them. */
export const discountedOrder = order('or_5Ds8Wc3i', 'R100253', {
  coupon_code: 'AUTUMN10',
  discount_total: '-8.60',
  adjustment_total: '-6.08',
  total: '87.92',
  payment_total: '87.92',
  tags: ['VIP', 'Gift'],
})

export const giftCardOrder = order('or_6Gc9Xd4j', 'R100254', {
  gift_card: orderGiftCard,
  gift_card_total: '25.00',
  store_credit_total: '40.00',
  payments: [storeCreditPayment, { ...capturedPayment, amount: '36.52', captured_amount: '36.52' }],
})

/** Delivered by download: three files, each in a different state. */
export const digitalOrder = order('or_7Dg1Ye5k', 'R100255', {
  items: [guideItem, playlistItem],
  item_total: '16.00',
  tax_total: '0.00',
  additional_tax_total: '0.00',
  delivery_total: '0.00',
  adjustment_total: '0.00',
  total: '16.00',
  payment_total: '16.00',
  total_quantity: 2,
  shipping_address: null,
  fulfillment_status: 'fulfilled',
})

/** A wholesale order with its freight measured. */
export const freightOrder = order('or_8Fr2Zf6l', 'R100256', {
  channel_id: wholesale.id,
  channel: wholesale,
  company_id: 'comp_3Hb7Nd2s',
  company_name: 'Harbor Kitchen Supply',
  po_number: 'HKS-PO-20931',
  po_document_filename: 'HKS-PO-20931.pdf',
  po_document_byte_size: 182_400,
  po_document_url: '/api/v3/admin/orders/or_8Fr2Zf6l/po_document',
  items: [{ ...toteItem, quantity: 120, total: '1920.00' }],
  item_total: '1920.00',
  tax_total: '0.00',
  additional_tax_total: '0.00',
  delivery_total: '145.00',
  adjustment_total: '0.00',
  total: '2065.00',
  payment_total: '0.00',
  amount_due: '2065.00',
  payment_status: 'none',
  payments: [],
  total_quantity: 120,
  freight_summary: {
    total_units: 120,
    total_cartons: 10,
    total_pallets: 1,
    total_volume: '0.84',
    total_weight: '96.0',
    complete: true,
    lines: [],
  },
})

/** Measured, but one product has no carton size, so the figures fall short. */
export const incompleteFreightOrder = order('or_9Fi3Ag7m', 'R100257', {
  ...freightOrder,
  id: 'or_9Fi3Ag7m',
  number: 'R100257',
  freight_summary: {
    total_units: 132,
    total_cartons: 10,
    total_pallets: null,
    total_volume: '0.84',
    total_weight: '96.0',
    complete: false,
    lines: [],
  },
})

/** Placed by a guest who gave only an email. */
export const guestOrder = order('or_1Gs4Bh8n', 'R100258', {
  customer_id: null,
  customer: undefined,
  email: 'river.okafor@example.com',
})

/** No customer and no email, as a draft starts. */
export const anonymousDraft = order('or_2An5Ci9o', 'R100259', {
  ...draftOrder,
  id: 'or_2An5Ci9o',
  number: 'R100259',
  customer_id: null,
  customer: undefined,
  email: '',
  billing_address: null,
  shipping_address: null,
})

export const erasedCustomerOrder = order('or_3Er6Dj1p', 'R100260', {
  customer_id: erasedCustomer.id,
  customer: erasedCustomer,
  email: erasedCustomer.email,
})

/** Taxed in a market whose prices include VAT. */
export const vatIncludedOrder = order('or_4Vt7Ek2q', 'R100261', {
  currency: 'EUR',
  market_id: markets[1].id,
  market: markets[1],
  locale: 'de',
  tax_total: '13.73',
  included_tax_total: '13.73',
  additional_tax_total: '0.00',
  adjustment_total: '0.00',
  total: '94.00',
  payment_total: '94.00',
})

/** Notes, tags and instructions filled in, as the sidebar's note cards show them. */
export const annotatedOrder = order('or_5An8Fl3r', 'R100262', {
  tags: ['VIP', 'Gift', 'Wholesale lead'],
  customer_note: 'Please leave it with the neighbour at number 216 if no one is home.',
  internal_note: 'Repeat customer. Offer the loyalty code on the next order.',
  internal_note_html:
    '<p>Repeat customer. Offer the <strong>loyalty code</strong> on the next order.</p>',
  metadata: { source: 'phone', campaign: 'autumn-2026' },
})

/** One fulfilment sent, so the order can no longer be edited. */
export const fulfilledOrder = order('or_6Ff9Gm4s', 'R100263', {
  fulfillment_status: 'fulfilled',
})

/** Both mugs shipped in a first parcel, so the mug line cannot drop below two. */
export const partlyFulfilledOrder = order('or_7Pf1Hn5t', 'R100264', {
  fulfillment_status: 'partial',
  fulfillments: [
    {
      id: 'ful_3Pf7Lq1x',
      number: 'H100264-1',
      status: 'fulfilled',
      fulfillment_items: [
        {
          id: 'fi_1Pf2Mg3a',
          quantity: 2,
          status: 'fulfilled',
          variant_id: mugItem.variant_id,
          line_item_id: mugItem.id,
          name: mugItem.name,
          options_text: null,
        },
      ],
    } as Fulfillment,
  ],
})

/** The orders list: one of each payment and fulfilment status the list shows. */
export const listedOrders: Order[] = [
  paidOrder,
  unpaidOrder,
  authorizedOrder,
  partlyRefundedOrder,
  refundedOrder,
  canceledOrder,
  riskyOrder,
  discountedOrder,
  giftCardOrder,
  digitalOrder,
  freightOrder,
  guestOrder,
  vatIncludedOrder,
  partlyFulfilledOrder,
]

export const draftOrders: Order[] = [draftOrder, draftWithCodeOrder, anonymousDraft]

// ---------------------------------------------------------------------------
// The narrower roles the permission variants use
// ---------------------------------------------------------------------------

export const orderManagerRules = templateRules.orderManager.rules
export const supportRules = templateRules.support.rules

/** A packer: reads orders and writes fulfilments, with nothing on payments or refunds. */
export const packerRules: PermissionRule[] = [
  ...shellRules,
  ...read(['order', 'order_group', 'line_item', 'tax_line', 'discount', 'fee', 'digital_link']),
  ...write(['fulfillment', 'shipping_label', 'delivery']),
]
