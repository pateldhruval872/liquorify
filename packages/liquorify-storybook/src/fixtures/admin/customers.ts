import type { Address, Customer, Order, StoreCredit, TaxIdentifier } from '@spree/admin-sdk'
import { erasedShopper, goodwillCredit, morgan, priya } from './loyalty'
import { customerGroups } from './merchandising'
import {
  billingAddress,
  canceledOrder,
  draftOrder,
  paidOrder,
  partlyRefundedOrder,
  shippingAddress,
  unpaidOrder,
} from './orders'

/**
 * Batch 10's customers: a customer's page in each state its cards show, with
 * the addresses, groups, store credit, tax identifiers and orders they read.
 * Every name, address, phone number, identifier and reference is invented.
 * Dates sit around the frozen clock, 1 October 2026 (`../clock.ts`).
 */

const consented = '2026-08-14T09:30:00.000Z'
const checked = '2026-09-30T08:15:00.000Z'
const created = '2026-03-10T14:00:00.000Z'

const [wholesaleGroup, vipGroup] = customerGroups

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/** Where Morgan's orders go: the default for shipping. */
export const homeAddress: Address = {
  ...shippingAddress,
  label: 'Home',
  is_default_shipping: true,
}

/** Where Morgan's invoices go: the default for billing. */
export const billingBookAddress: Address = {
  ...billingAddress,
  label: 'Billing',
  is_default_billing: true,
}

/** A third address, labelled and default for nothing. */
export const studioAddress: Address = {
  ...shippingAddress,
  id: 'addr_8St2Ud5w',
  label: 'Studio',
  company: 'Reyes Ceramics',
  address1: '1520 Kiln Street',
  address2: 'Unit 4',
  postal_code: '97209',
  phone: '555-0186',
}

/** An address with no label, default for both. */
export const onlyAddress: Address = {
  ...shippingAddress,
  id: 'addr_3On6Ly8z',
  label: null,
  is_default_billing: true,
  is_default_shipping: true,
}

/** An address with neither a label nor a default. */
export const plainAddress: Address = {
  ...billingAddress,
  id: 'addr_5Pl8Nx2c',
  label: null,
}

// ---------------------------------------------------------------------------
// Store credit
// ---------------------------------------------------------------------------

/** Issued as a refund and not yet used. */
export const refundCredit: StoreCredit = {
  ...goodwillCredit,
  id: 'credit_7Rf8Nd9G',
  amount: '40.00',
  amount_used: '0.00',
  amount_remaining: '40.00',
  memo: null,
  created_at: '2026-09-22T15:10:00.000Z',
}

/** In euros, spent in full. */
export const euroCredit: StoreCredit = {
  ...goodwillCredit,
  id: 'credit_8Eu9Rc1H',
  amount: '25.00',
  amount_used: '25.00',
  amount_remaining: '0.00',
  currency: 'EUR',
  outstanding: false,
  memo: 'Paris pop-up voucher',
  created_at: '2026-07-02T11:00:00.000Z',
}

export const customerCredits: StoreCredit[] = [goodwillCredit, refundCredit, euroCredit]

// ---------------------------------------------------------------------------
// Tax identifiers
// ---------------------------------------------------------------------------

function identifier(id: string, kind: string, value: string, fields: Partial<TaxIdentifier> = {}) {
  return {
    id,
    kind,
    value,
    validation_status: null,
    validation_evidence: null,
    source: 'customer',
    validated_at: null,
    created_at: created,
    updated_at: created,
    validatable: false,
    customer_id: morgan.id,
    cart_id: null,
    order_id: null,
    ...fields,
  } satisfies TaxIdentifier
}

/**
 * An EU VAT number. Spree's core checks only its format, which does not count
 * as a registry check, so nothing can check it until a validator gem is added
 * (`Spree::TaxIdentifier#validatable?`).
 */
export const euIdentifier = identifier('txi_2Vf5Eu8K', 'eu_vat', 'DE811907980')
/** A UK VAT number, which nothing in Spree's core checks either. */
export const ukIdentifier = identifier('txi_3Uc6Gb9L', 'gb_vat', 'GB987654321')

/** The customer's identifiers, as the card lists them on Spree's core. */
export const customerIdentifiers: TaxIdentifier[] = [euIdentifier, ukIdentifier]

// The verdicts below need a validator gem that checks a registry, which no
// batch adds; the shared card's stories show how it draws each one.

/** Checked with the registry and found valid. */
export const verifiedIdentifier = identifier('txi_4Vf6Eu1M', 'eu_vat', 'DE811907980', {
  validation_status: 'verified',
  validated_at: checked,
  validatable: true,
})
/** A registry exists for it, and it has not been checked yet. */
export const checkableIdentifier = identifier('txi_5Ck7Eu2N', 'eu_vat', 'NL853746333B01', {
  validatable: true,
})
/** The registry did not recognise it. */
export const unverifiedIdentifier = identifier('txi_6Uv8Eu3P', 'eu_vat', 'FR40303265045', {
  validation_status: 'unverified',
  validated_at: checked,
  validatable: true,
})
/** The registry could not answer. */
export const unavailableIdentifier = identifier('txi_7Ua9Eu4Q', 'eu_vat', 'IT00743110157', {
  validation_status: 'unavailable',
  validated_at: checked,
  validatable: true,
})
/** A check waiting on the registry. */
export const pendingIdentifier = identifier('txi_8Pd1Eu5R', 'eu_vat', 'BE0403170701', {
  validation_status: 'pending',
  validatable: true,
})
/** The registry's validator does not cover this number. */
export const unsupportedIdentifier = identifier('txi_9Us2Eu6S', 'eu_vat', 'EL094259216', {
  validation_status: 'unsupported',
  validated_at: checked,
  validatable: true,
})
/** A kind the merchant typed, which Spree has no name or validator for. */
export const customKindIdentifier = identifier('txi_1Ck3Nz7T', 'nz_gst', '123-456-789')

/** One of each verdict, as the shared card draws them with a registry validator. */
export const identifierVerdicts: TaxIdentifier[] = [
  verifiedIdentifier,
  checkableIdentifier,
  unverifiedIdentifier,
  unavailableIdentifier,
  pendingIdentifier,
  unsupportedIdentifier,
  ukIdentifier,
  customKindIdentifier,
]

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** A regular customer with everything their page can show. */
export const regularCustomer: Customer = {
  ...morgan,
  phone: '555-0142',
  accepts_email_marketing: true,
  email_marketing_consent_updated_at: consented,
  email_marketing_consent_source: 'storefront',
  tags: ['Regular', 'Local pickup'],
  internal_note:
    'Prefers a call before large orders ship. Asked for the glaze samples to be held for the studio.',
  internal_note_html:
    '<p>Prefers a call before large orders ship.</p><p>Asked for the <strong>glaze samples</strong> to be held for the studio.</p>',
  addresses: [homeAddress, billingBookAddress, studioAddress],
  default_billing_address_id: billingBookAddress.id,
  default_shipping_address_id: homeAddress.id,
  customer_groups: [vipGroup],
  customer_group_ids: [vipGroup.id],
  store_credits: customerCredits,
  available_store_credit_total: '195.02',
  orders_count: 12,
  total_spent: '1284.60',
  last_order_completed_at: '2026-09-28T09:20:00.000Z',
}

/** In two groups. */
export const groupedCustomer: Customer = {
  ...regularCustomer,
  customer_groups: [vipGroup, wholesaleGroup],
  customer_group_ids: [vipGroup.id, wholesaleGroup.id],
}

/** Signed up, never ordered, and nothing added yet. */
export const newCustomer: Customer = {
  ...priya,
  created_at: '2026-09-29T10:05:00.000Z',
  orders_count: 0,
  total_spent: '0.00',
  last_order_completed_at: null,
  available_store_credit_total: '0.00',
  addresses: [],
  store_credits: [],
  customer_groups: [],
}

/**
 * A customer who asked to be erased: Spree keeps the record, its orders and
 * its store credit, names it Redacted, gives it an address that cannot receive
 * mail and clears its phone, consent, tags, note and memos
 * (`Spree::Customers::Anonymize`).
 */
export const erasedRecord: Customer = {
  ...regularCustomer,
  id: erasedShopper.id,
  email: erasedShopper.email,
  first_name: 'Redacted',
  last_name: 'Redacted',
  full_name: 'Redacted Redacted',
  phone: null,
  accepts_email_marketing: false,
  email_marketing_consent_updated_at: null,
  metadata: {},
  tags: [],
  internal_note: null,
  internal_note_html: null,
  addresses: [],
  default_billing_address_id: null,
  default_shipping_address_id: null,
  customer_groups: [],
  customer_group_ids: [],
  store_credits: [{ ...refundCredit, memo: null, customer_id: erasedShopper.id }],
  available_store_credit_total: '40.00',
  anonymized: true,
  anonymized_at: erasedShopper.anonymized_at,
}

// ---------------------------------------------------------------------------
// A customer's orders
// ---------------------------------------------------------------------------

/** The orders card's first page: placed, partly refunded, canceled, unpaid, and a draft. */
export const customerOrders: Order[] = [
  paidOrder,
  partlyRefundedOrder,
  canceledOrder,
  unpaidOrder,
  draftOrder,
]

/** The last order Morgan placed, with its items. */
export const lastPlacedOrder: Order = paidOrder
