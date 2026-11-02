import type { Permission, PermissionRule, Role } from '@spree/admin-sdk'

type Group = [group: string, groupLabel: string]

const analytics: Group = ['analytics', 'Analytics']
const orders: Group = ['orders', 'Orders']
const catalog: Group = ['catalog', 'Catalog']
const customers: Group = ['customers', 'Customers']
const sellers: Group = ['sellers', 'Sellers']
const loyalty: Group = ['loyalty', 'Loyalty']
const marketing: Group = ['marketing', 'Marketing']
const settings: Group = ['settings', 'Settings']
const access: Group = ['access', 'Access']

/** A resource's read entry and, unless it is read-only, its write entry. */
function resource(
  name: string,
  label: string,
  description: string,
  [group, groupLabel]: Group,
  kinds: ('read' | 'write')[] = ['read', 'write'],
): Permission[] {
  return kinds.map((kind) => ({
    key: `${kind}_${name}`,
    resource: name,
    kind,
    group,
    group_label: groupLabel,
    label,
    description,
  }))
}

/**
 * Spree's whole permission catalog, in the order and wording the Admin API
 * answers `GET /api/v3/admin/permissions` with at the pinned revision
 * (`Spree.permissions`, worded in `spree/core/config/locales/en.yml`). The
 * role sheet's grid lays every one of these out, so a shorter list would draw
 * a different sheet.
 */
export const staffPermissionCatalog: Permission[] = [
  ...resource('dashboard', 'Analytics dashboard', 'Sales and performance analytics', analytics, [
    'read',
  ]),
  ...resource('reports', 'Reports', '', analytics),
  ...resource('orders', 'Orders', 'Orders, line items, returns, exchanges and claims', orders),
  ...resource('payments', 'Payments', 'Order payments and payment capture', orders),
  ...resource('fulfillments', 'Fulfillments', 'Pack, ship and track order fulfillments', orders),
  ...resource('refunds', 'Refunds', 'Issue and view refunds', orders),
  ...resource('products', 'Products', 'Products, variants, options, prices and media', catalog),
  ...resource('product_types', 'Product types', '', catalog),
  ...resource('publishing', 'Publishing', '', catalog),
  ...resource('media', 'Media', '', catalog),
  ...resource('categories', 'Categories', 'Category tree and taxonomies', catalog),
  ...resource('collections', 'Collections', 'Manual and rule-based product collections', catalog),
  ...resource('stock', 'Inventory', 'Stock levels, locations, movements and transfers', catalog),
  ...resource('purchasing', 'Purchasing', 'Suppliers and purchase orders', catalog),
  ...resource(
    'customers',
    'Customers',
    'Customer accounts, addresses, cards and groups',
    customers,
  ),
  ...resource('sellers', 'Sellers', '', sellers),
  ...resource('commissions', 'Commissions', '', sellers),
  ...resource('payouts', 'Payouts', '', sellers),
  ...resource('gift_cards', 'Gift cards', 'Gift cards and gift card batches', loyalty),
  ...resource('store_credits', 'Store credits', 'Customer store credit balances', loyalty),
  ...resource('promotions', 'Promotions', 'Promotions, rules and coupon codes', marketing),
  ...resource(
    'settings',
    'Store settings',
    'Store, payment, delivery, tax and channel configuration',
    settings,
  ),
  ...resource('delivery_methods', 'Delivery methods', '', settings),
  ...resource('package_types', 'Package types', '', settings),
  ...resource('webhooks', 'Webhooks', 'Webhook endpoints and deliveries', settings),
  ...resource(
    'email_templates',
    'Email templates',
    'Customer email templates and the email layout',
    settings,
  ),
  ...resource('integrations', 'Integrations', '', settings),
  ...resource('api_keys', 'API keys', 'Create and revoke API credentials', access),
  ...resource('oauth_applications', 'Oauth applications', '', access),
  ...resource(
    'staff',
    'Staff & roles',
    'Team members, invitations, roles and their permissions',
    access,
  ),
]

/** What an admin holding the admin role may grant: every key in the catalog. */
export const everyPermissionKey = staffPermissionCatalog.map((entry) => entry.key)

function rule(actions: string[], subject: string): PermissionRule {
  return { allow: true, actions, subjects: [subject], has_conditions: false }
}

const staffSubjects = ['admin_user', 'invitation', 'role', 'role_user']

/**
 * The rules Spree answers `/me` with for a staffer whose only role holds
 * `read_staff`, at the pinned revision.
 */
export const staffViewerRules: PermissionRule[] = [
  rule(['read'], 'country'),
  rule(['read'], 'state'),
  rule(['read'], 'store'),
  ...staffSubjects.map((subject) => rule(['read', 'admin'], subject)),
]

/** The same for a role holding `write_staff`, which adds managing every staff subject. */
export const staffManagerRules: PermissionRule[] = [
  ...staffViewerRules,
  ...staffSubjects.map((subject) => rule(['manage'], subject)),
]

const created = '2026-09-01T09:00:00.000Z'

function role(
  id: string,
  name: string,
  permissions: string[],
  usersCount: number,
  extra: Partial<Role> = {},
): Role {
  return {
    id,
    name,
    description: null,
    created_at: created,
    updated_at: created,
    permissions,
    mutable: true,
    users_count: usersCount,
    ...extra,
  }
}

/** Spree's protected role. It holds the whole catalog and cannot be edited. */
export const adminRole = role('role_3kD8sW1z', 'admin', everyPermissionKey, 1, { mutable: false })

/** A role made from the role sheet's "Order manager" template. */
export const orderManagerRole = role(
  'role_5mQ1vN8c',
  'Order manager',
  [
    'write_orders',
    'write_payments',
    'write_fulfillments',
    'write_refunds',
    'write_gift_cards',
    'write_store_credits',
    'read_customers',
  ],
  2,
  { description: 'Handles orders from payment to delivery' },
)

export const supportRole = role(
  'role_8tR4bK2x',
  'Support',
  ['read_orders', 'read_customers', 'read_dashboard'],
  3,
)

export const staffManagerRole = role('role_2hW6yJ4p', 'Staff manager', ['write_staff'], 1)

export const roles: Role[] = [orderManagerRole, supportRole, staffManagerRole, adminRole]
