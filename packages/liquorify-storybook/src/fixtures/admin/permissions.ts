import type { Permission } from '@spree/admin-sdk'

function entry(resource: string, label: string, kind: 'read' | 'write', group: string): Permission {
  return {
    key: `${kind}_${resource}`,
    resource,
    kind,
    group,
    group_label: group.charAt(0).toUpperCase() + group.slice(1),
    label: `${kind === 'read' ? 'Read' : 'Write'} ${label}`,
    description: `${kind === 'read' ? 'View' : 'Create, update and delete'} ${label}`,
  }
}

export const permissionCatalog: Permission[] = [
  entry('products', 'products', 'read', 'catalog'),
  entry('products', 'products', 'write', 'catalog'),
  entry('orders', 'orders', 'read', 'orders'),
  entry('orders', 'orders', 'write', 'orders'),
  entry('customers', 'customers', 'read', 'customers'),
  entry('customers', 'customers', 'write', 'customers'),
  entry('stock', 'stock', 'read', 'catalog'),
  entry('stock', 'stock', 'write', 'catalog'),
]
