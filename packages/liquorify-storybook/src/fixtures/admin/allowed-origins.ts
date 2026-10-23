import type { AllowedOrigin } from '@spree/admin-sdk'

function origin(id: string, address: string, created: string): AllowedOrigin {
  return { id, origin: address, created_at: created, updated_at: created }
}

/** Where the store's own storefronts are served from, by name alone. */
export const allowedOrigins: AllowedOrigin[] = [
  origin('ao_1Qa2Ws3E', 'http://localhost:3001', '2026-09-30T08:00:00.000Z'),
  origin('ao_4Rf5Tg6Y', 'https://shop.example.com', '2026-06-12T10:00:00.000Z'),
  origin('ao_7Hu8Ji9K', 'https://staging.shop.example.com', '2026-08-03T15:30:00.000Z'),
]

/** Enough origins to fill more than one page at the table's page size. */
export const manyAllowedOrigins: AllowedOrigin[] = Array.from({ length: 30 }, (_, index) =>
  origin(
    `ao_m${String(index + 1).padStart(7, '0')}`,
    `https://store-${String(index + 1).padStart(2, '0')}.example.com`,
    '2026-07-01T09:00:00.000Z',
  ),
)
