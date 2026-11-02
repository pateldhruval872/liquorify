import type {
  AdminUser,
  Customer,
  DashboardCounter,
  Order,
  PermissionRule,
  Product,
  Store,
  UpdateStatus,
} from '@spree/admin-sdk'
import { adminUser } from './session'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

/**
 * The store every shell story sits in, as `GET /api/v3/admin/store` answers at
 * the pinned revision. Two of its six setup tasks are done, as on the browser
 * tests' store, so Getting Started shows in the navigation with its count, and
 * it has no storefront address, so the account menu offers no "View store".
 */
export const shellStore: Store = {
  id: adminUser.stores[0].id,
  metadata: {},
  name: adminUser.stores[0].name,
  code: adminUser.stores[0].code,
  default_currency: 'USD',
  default_locale: 'en',
  default_country_code: 'US',
  mail_from_address: 'no-reply@example.com',
  customer_support_email: 'support@example.com',
  new_order_notifications_email: null,
  created_at: created,
  updated_at: updated,
  order_routing_strategy: 'rules',
  payout_provider: null,
  admin_locale: null,
  timezone: 'UTC',
  storefront_url: null,
  weight_unit: 'lb',
  unit_system: 'imperial',
  storefront_access: 'public',
  guest_checkout: true,
  always_include_confirm_step: false,
  company_field_enabled: false,
  address_requires_company: false,
  address_requires_phone: false,
  capture_method: 'checkout',
  track_inventory_levels: true,
  stock_reservations_enabled: true,
  low_stock_threshold: 5,
  tax_using_ship_address: true,
  track_price_history: true,
  show_products_without_price: false,
  disable_sku_validation: false,
  pricing_provider: 'internal',
  inventory_provider: 'internal',
  pricing_provider_failure_policy: 'strict',
  inventory_provider_failure_policy: 'fallback',
  default_payouts_schedule_interval: 'monthly',
  auto_approve_sellers: false,
  auto_approve_seller_products: false,
  send_seller_transactional_emails: true,
  document_number_format: 'sequential',
  order_number_prefix: 'R',
  order_number_suffix: '',
  order_number_sequence_start: 1001,
  limit_digital_download_count: true,
  digital_asset_authorized_clicks: 5,
  limit_digital_download_days: true,
  digital_asset_authorized_days: 7,
  send_consumer_transactional_emails: true,
  email_accent_color: null,
  email_background_color: null,
  email_card_color: null,
  email_text_color: null,
  email_heading_color: null,
  email_font: null,
  order_number_sequence_started: true,
  default_minimum_payout_amount: '0.00',
  default_commission_tax_rate: '0',
  url: 'sample-store.example.com',
  api_url: 'sample-store.example.com',
  setup_tasks: [
    { name: 'setup_address', done: false },
    { name: 'setup_payment_method', done: false },
    { name: 'add_products', done: true },
    { name: 'set_customer_support_email', done: true },
    { name: 'setup_taxes_collection', done: false },
    { name: 'setup_storefront', done: false },
  ],
  supported_currencies: ['USD', 'EUR'],
  supported_locales: ['en', 'de'],
  available_locales: ['de', 'en', 'es', 'fr', 'pl'],
  logo_url: null,
  mailer_logo_url: null,
}

/** The same admin with a role in a second store, so the store switcher opens. */
export const twoStoreAdmin: AdminUser = {
  ...adminUser,
  stores: [...adminUser.stores, { id: 'store_4Tn8Vb2x', name: 'Outlet Store', code: 'outlet' }],
}

/** An admin who has not given a name, as the browser tests' admin is. */
export const unnamedAdmin: AdminUser = {
  ...twoStoreAdmin,
  first_name: null,
  last_name: null,
  full_name: null,
}

function counter(key: string, value: number, nav: string | null): DashboardCounter {
  return { key, value, link: null, nav }
}

/**
 * The counts the shell asks for once, in the order the server registers them.
 * Three orders to fulfil and one open return badge Orders with 4, and Returns
 * with 1 once the section is open.
 */
export const dashboardCounters: DashboardCounter[] = [
  counter('orders_to_fulfill', 3, 'orders'),
  counter('payments_to_collect', 0, null),
  counter('open_returns', 1, 'returns'),
  counter('open_exchanges', 0, 'exchanges'),
  counter('open_claims', 0, 'claims'),
  counter('low_stock_items', 0, null),
  counter('out_of_stock_items', 1, null),
]

/** What `GET /api/v3/admin/updates` answers while update checks are off, as on the browser tests' server. */
export const noUpdate: UpdateStatus = {
  current_version: '6.0.0.rc4',
  enabled: false,
  checked_at: null,
  update_available: false,
  latest_version: null,
  latest_release_url: null,
  latest_release_published_at: null,
}

/** A newer release is out. The version and notes are invented for the stories. */
export const updateAvailable: UpdateStatus = {
  current_version: '6.0.0.rc4',
  enabled: true,
  checked_at: '2026-10-01T06:00:00.000Z',
  update_available: true,
  latest_version: '6.0.1',
  latest_release_url: 'https://github.com/spree/spree/releases/tag/v6.0.1',
  latest_release_published_at: '2026-09-29T14:00:00.000Z',
}

/** Release notes as GitHub publishes them: Markdown with headings, lists, links and code. */
export const releaseNotes = [
  '## Highlights',
  '',
  'This release fixes issues reported after 6.0.0 and makes the dashboard faster on large catalogs.',
  '',
  '### Fixes',
  '',
  '- Orders list keeps its filters when you return from an order',
  '- Gift card balances show in the customer’s currency',
  '- Store credit events list the staff member who issued them',
  '',
  '### Upgrading',
  '',
  'Run the migrations after updating the gems:',
  '',
  '```',
  'bin/rails spree:install:migrations db:migrate',
  '```',
  '',
  'See the [upgrade guide](https://spreecommerce.org/docs) for details.',
].join('\n')

function rule(actions: string[], subjects: string[]): PermissionRule[] {
  return subjects.map((subject) => ({
    allow: true,
    actions,
    subjects: [subject],
    has_conditions: false,
  }))
}

const shellRules = rule(['read'], ['country', 'state', 'store'])
const orderSubjects = [
  'order',
  'order_group',
  'line_item',
  'tax_line',
  'discount',
  'fee',
  'return',
  'exchange',
  'claim',
  'tax_identifier',
  'custom_field',
  'digital_link',
]
const customerSubjects = [
  'customer',
  'address',
  'credit_card',
  'customer_group',
  'company',
  'company_membership',
  'company_invitation',
  'tax_identifier',
  'tax_exemption_certificate',
  'data_request',
  'consent_record',
  'custom_field',
]
const productSubjects = [
  'product',
  'variant',
  'option_type',
  'option_value',
  'price',
  'price_list',
  'price_rule',
  'catalog',
  'catalog_product',
  'catalog_assignment',
  'custom_field',
  'digital_asset',
  'import',
  'import_row',
]
const stockSubjects = [
  'stock_level',
  'stock_location',
  'stock_movement',
  'stock_transfer',
  'stock_transfer_item',
  'stock_reservation',
  'stock_receipt',
  'stock_receipt_item',
]

/** Read and administer the subjects, then manage them, as each write permission expands. */
const write = (subjects: string[]) => [
  ...rule(['read', 'admin'], subjects),
  ...rule(['manage'], subjects),
]
const read = (subjects: string[]) => rule(['read', 'admin'], subjects)

/**
 * The rules Spree answers `/me` with for a teammate holding only a role made
 * from one of the role sheet's templates, as captured from the browser tests'
 * server at the pinned revision. Each decides the sidebar that template
 * produces, which is the shell's permission evidence (work item §2.2).
 */
export const templateRules: Record<
  'orderManager' | 'merchandiser' | 'support',
  { rules: PermissionRule[]; keys: string[] }
> = {
  orderManager: {
    rules: [
      ...shellRules,
      ...write(orderSubjects),
      ...write(['payment', 'payment_split']),
      ...write(['fulfillment', 'shipping_label', 'delivery']),
      ...write(['refund']),
      ...read([...customerSubjects, 'gift_card', 'gift_card_batch']),
      ...rule(['manage'], ['gift_card', 'gift_card_batch']),
      ...write(['store_credit', 'store_credit_event']),
    ],
    keys: [
      'read_orders',
      'write_orders',
      'read_payments',
      'write_payments',
      'read_fulfillments',
      'write_fulfillments',
      'read_refunds',
      'write_refunds',
      'read_customers',
      'read_gift_cards',
      'write_gift_cards',
      'read_store_credits',
      'write_store_credits',
    ],
  },
  merchandiser: {
    rules: [
      ...shellRules,
      ...write(productSubjects),
      ...write(['category', 'product_category']),
      ...write(['collection', 'product_collection', 'collection_rule']),
      ...write(stockSubjects),
    ],
    keys: [
      'read_products',
      'write_products',
      'read_categories',
      'write_categories',
      'read_collections',
      'write_collections',
      'read_stock',
      'write_stock',
    ],
  },
  support: {
    rules: [...shellRules, ...read(['dashboard', ...orderSubjects, ...customerSubjects])],
    keys: ['read_dashboard', 'read_orders', 'read_customers'],
  },
}

function product(
  id: string,
  name: string,
  slug: string,
  amount: string,
  stock: { in_stock: boolean; backorderable: boolean },
  status: Product['status'],
): Product {
  return {
    id,
    name,
    slug,
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    variant_count: 1,
    available_on: null,
    preorder_ships_at: null,
    purchasable: status === 'active',
    preorder: false,
    in_stock: stock.in_stock,
    backorderable: stock.backorderable,
    available: status === 'active',
    description: null,
    description_html: null,
    default_variant_id: `variant_${id.slice(5)}`,
    buy_box_variant_id: `variant_${id.slice(5)}`,
    thumbnail_url: null,
    tags: [],
    price: {
      id: `price_${id.slice(5)}`,
      currency: 'USD',
      amount,
      compare_at_amount: null,
      price_list_id: null,
      min_quantity: 1,
      variant_id: `variant_${id.slice(5)}`,
      created_at: created,
      updated_at: updated,
    },
    original_price: null,
    seller_id: null,
    external_references: {},
    status,
    metadata: {},
    deleted_at: null,
    created_at: created,
    updated_at: updated,
    delivery_profile_id: 'fp_6Hq2Wm8c',
    seller_name: null,
    product_type_id: null,
    tax_category_id: 'taxcat_2Jd7Ns4k',
  }
}

/** What the command palette finds for "tote": two products, an order and a customer. */
export const searchProducts: Product[] = [
  product(
    'prod_8Kc3Tz1q',
    'Spree Tote',
    'spree-tote',
    '15.99',
    { in_stock: true, backorderable: false },
    'active',
  ),
  product(
    'prod_5Vw9Rb2m',
    'Canvas Tote Bag',
    'canvas-tote-bag',
    '24.00',
    { in_stock: false, backorderable: false },
    'draft',
  ),
]

export const searchOrders: Order[] = [
  {
    id: 'or_7Fp2Kd9s',
    market_id: 'mkt_3Lq8Zr5v',
    withdrawal_period_ends_at: null,
    within_withdrawal_period: true,
    cart_id: null,
    channel_id: 'ch_9Tb4Wx1n',
    company_id: null,
    company_name: null,
    po_document_filename: null,
    po_document_byte_size: null,
    number: 'R1042',
    email: 'tote.shopper@example.com',
    customer_note: null,
    po_number: null,
    currency: 'USD',
    locale: 'en',
    total_quantity: 1,
    coupon_code: null,
    fulfillment_status: 'unfulfilled',
    payment_status: 'paid',
    completed_at: '2026-09-30T15:20:00.000Z',
    item_total: '15.99',
    discount_total: '0.00',
    tax_total: '0.00',
    included_tax_total: '0.00',
    additional_tax_total: '0.00',
    delivery_total: '5.00',
    fee_total: '0.00',
    gift_card_total: '0.00',
    store_credit_total: '0.00',
    total: '20.99',
    amount_due: '0.00',
    covered_by_store_credit: false,
    adjustment_total: '0.00',
    gift_card: null,
    market: {
      id: 'mkt_3Lq8Zr5v',
      name: 'United States',
      currency: 'USD',
      default_locale: 'en',
      tax_inclusive: false,
      default: true,
      country_codes: ['US'],
      supported_locales: ['en'],
      created_at: created,
      updated_at: updated,
      tax_provider: null,
    },
    external_references: {},
    status: 'placed',
    last_ip_address: null,
    considered_risky: false,
    confirmation_delivered: true,
    store_owner_notification_delivered: null,
    metadata: {},
    cancel_note: null,
    canceled_at: null,
    approved_at: null,
    created_at: '2026-09-30T15:18:00.000Z',
    updated_at: '2026-09-30T15:20:00.000Z',
    payment_total: '20.99',
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
    customer_id: 'cust_4Gm7Yp2d',
    freight_summary: null,
  },
]

export const searchCustomers: Customer[] = [
  {
    id: 'cust_4Gm7Yp2d',
    email: 'tote.shopper@example.com',
    first_name: 'Jordan',
    last_name: 'Lee',
    phone: null,
    accepts_email_marketing: false,
    email_marketing_consent_updated_at: '2026-09-30T15:18:00Z',
    full_name: 'Jordan Lee',
    available_store_credit_total: '0.00',
    failed_attempts: 0,
    metadata: {},
    email_marketing_consent_source: 'unknown',
    created_at: '2026-09-30T15:18:00.000Z',
    updated_at: '2026-09-30T15:20:00.000Z',
    anonymized_at: null,
    anonymized: false,
    tags: [],
    internal_note: null,
    internal_note_html: null,
    default_billing_address_id: null,
    default_shipping_address_id: null,
    orders_count: 1,
    total_spent: '20.99',
    last_order_completed_at: '2026-09-30T15:20:00.000Z',
    customer_group_ids: [],
  },
]

/** A teammate holding one role in the store, as a template role's sidebar is seen. */
function teammate(id: string, first: string, last: string, role: string): AdminUser {
  return {
    ...adminUser,
    id,
    email: `${first}.${last}@example.com`.toLowerCase(),
    first_name: first,
    last_name: last,
    full_name: `${first} ${last}`,
    roles: [{ id: `role_${id.slice(6)}`, name: role }],
  }
}

export const templateTeammates = {
  orderManager: teammate('admin_5Rk2Vn8p', 'Priya', 'Shah', 'Order manager'),
  merchandiser: teammate('admin_9Lw3Cx6t', 'Tom', 'Becker', 'Merchandiser'),
  support: teammate('admin_2Qz7Hm4j', 'Maria', 'Lopez', 'Support'),
}
