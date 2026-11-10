// Read from the Seller API on the browser-test server (work item §10), dated
// relative to FIXTURE_NOW. Every name, address and reference is invented.
import type { Invitation, Reason, StockLocation, TeamMember } from '@spree/seller-sdk'

export const stockLocations: StockLocation[] = [
  {
    id: 'sloc_nJqfPa3Cpe',
    name: 'Harbour Cask Co.',
    address1: null,
    city: null,
    zipcode: null,
    country_code: 'US',
    country_name: 'United States',
    state_code: null,
    state_text: null,
    pickup_ready_in_minutes: null,
    pickup_instructions: null,
    address2: null,
    state_name: null,
    phone: null,
    company: null,
    active: true,
    default: true,
    kind: 'warehouse',
    returns_enabled: true,
    created_at: '2026-10-01T11:59:55.877Z',
    updated_at: '2026-10-01T11:59:55.877Z',
  },
]

export const team: TeamMember[] = [
  {
    id: 'adm_OIJLhNcSbf',
    email: 'ines.carvalho@harbour-cask.example.com',
    first_name: 'Ines',
    last_name: 'Carvalho',
    full_name: 'Ines Carvalho',
    created_at: '2026-10-01T11:59:55.890Z',
    avatar_url: null,
  },
  {
    id: 'adm_nJqfPa3Cpe',
    email: 'mara.quill@harbour-cask.example.com',
    first_name: 'Mara',
    last_name: 'Quill',
    full_name: 'Mara Quill',
    created_at: '2026-10-01T12:01:24.285Z',
    avatar_url: null,
  },
]

export const invitations: Invitation[] = [
  {
    id: 'inv_gbHJdmfrXB',
    email: 'cellar@harbour-cask.example.com',
    created_at: '2026-10-01T11:59:56.009Z',
    expires_at: '2026-10-15T11:59:56.006Z',
    accepted_at: null,
    status: 'pending',
  },
]

export const returnReasons: Reason[] = [
  {
    id: 'rar_p6klVeMgbn',
    name: 'Accidental order',
    active: true,
  },
  {
    id: 'rar_UkLWZg9DAJ',
    name: 'Better price available',
    active: true,
  },
  {
    id: 'rar_VqXmZF31wY',
    name: 'Damaged/Defective',
    active: true,
  },
  {
    id: 'rar_OIJLhNcSbf',
    name: 'Different from description',
    active: true,
  },
  {
    id: 'rar_uw2YK1rnl0',
    name: 'Different from what was ordered',
    active: true,
  },
  {
    id: 'rar_gbHJdmfrXB',
    name: 'Missed estimated delivery date',
    active: true,
  },
  {
    id: 'rar_EfhxLZ9ck8',
    name: 'Missing parts or accessories',
    active: true,
  },
  {
    id: 'rar_AXs1igzRC6',
    name: 'No longer needed/wanted',
    active: true,
  },
  {
    id: 'rar_nJqfPa3Cpe',
    name: 'Unauthorized purchase',
    active: true,
  },
]

export const claimReasons: Reason[] = [
  {
    id: 'clr_UkLWZg9DAJ',
    name: 'Arrived damaged',
    active: true,
  },
  {
    id: 'clr_uw2YK1rnl0',
    name: 'Item not as described',
    active: true,
  },
  {
    id: 'clr_VqXmZF31wY',
    name: 'Missing item from order',
    active: true,
  },
  {
    id: 'clr_gbHJdmfrXB',
    name: 'Never arrived',
    active: true,
  },
  {
    id: 'clr_EfhxLZ9ck8',
    name: 'Wrong item sent',
    active: true,
  },
]

export const cancellationReasons: Reason[] = [
  {
    id: 'ocr_UkLWZg9DAJ',
    name: 'Customer changed their mind',
    active: true,
  },
  {
    id: 'ocr_uw2YK1rnl0',
    name: 'Duplicate order',
    active: true,
  },
  {
    id: 'ocr_AXs1igzRC6',
    name: 'Order expired',
    active: true,
  },
  {
    id: 'ocr_VqXmZF31wY',
    name: 'Out of stock',
    active: true,
  },
  {
    id: 'ocr_gbHJdmfrXB',
    name: 'Payment declined',
    active: true,
  },
  {
    id: 'ocr_OIJLhNcSbf',
    name: 'Staff error',
    active: true,
  },
  {
    id: 'ocr_EfhxLZ9ck8',
    name: 'Suspected fraud',
    active: true,
  },
]

export const trackingCarriers: { id: string; name: string }[] = [
  {
    id: 'australia_post',
    name: 'Australia Post',
  },
  {
    id: 'canada_post',
    name: 'Canada Post',
  },
  {
    id: 'chronopost',
    name: 'Chronopost',
  },
  {
    id: 'colissimo',
    name: 'Colissimo',
  },
  {
    id: 'dhl',
    name: 'DHL Express',
  },
  {
    id: 'dpd',
    name: 'DPD',
  },
  {
    id: 'deutsche_post',
    name: 'Deutsche Post DHL',
  },
  {
    id: 'evri',
    name: 'Evri',
  },
  {
    id: 'fedex',
    name: 'FedEx',
  },
  {
    id: 'gls',
    name: 'GLS',
  },
  {
    id: 'inpost',
    name: 'InPost',
  },
  {
    id: 'poczta_polska',
    name: 'Poczta Polska',
  },
  {
    id: 'postnl',
    name: 'PostNL',
  },
  {
    id: 'royal_mail',
    name: 'Royal Mail',
  },
  {
    id: 'ups',
    name: 'UPS',
  },
  {
    id: 'usps',
    name: 'USPS',
  },
]
