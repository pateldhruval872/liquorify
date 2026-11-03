import type { DigitalAssetProvider } from '@spree/admin-sdk'

/**
 * A key pool with one setting of each kind a source can declare: the three
 * Spree's own provider spec declares (a pool name, a region chosen from two
 * with a default, and a switch that defaults off), and a number, which the
 * form also supports. Spree ships no source like it; an extension would.
 */
export const regionalPool: DigitalAssetProvider = {
  type: 'regional_pool',
  name: 'Regional key pool',
  requires_attachment: false,
  settings_schema: [
    { key: 'pool_name', type: 'string' },
    { key: 'region', type: 'select', default: 'us', in: ['us', 'eu'] },
    { key: 'auto_revoke', type: 'boolean', default: false },
    { key: 'keys_per_order', type: 'number', default: 1 },
  ],
}
