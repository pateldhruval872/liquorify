import type { WebhookDelivery, WebhookEndpoint, WebhookEvent } from '@spree/admin-sdk'

function event(name: string, fields: Partial<WebhookEvent> = {}): WebhookEvent {
  return {
    name,
    group: name.split('.')[0],
    credential_permission: null,
    credential: false,
    deprecated: false,
    replaced_by: null,
    ...fields,
  }
}

/**
 * A part of Spree's event catalog, with each kind of entry the picker marks:
 * an event carrying a credential, and a deprecated one with its replacement.
 */
export const webhookEvents: WebhookEvent[] = [
  event('customer.created'),
  event('customer.password_reset_requested', {
    credential: true,
    credential_permission: 'write_customers',
  }),
  event('customer.updated'),
  event('digital.created', { deprecated: true, replaced_by: 'digital_asset.created' }),
  event('digital_asset.created'),
  event('order.canceled'),
  event('order.completed'),
  event('order.paid'),
  event('order.updated'),
  event('product.created'),
  event('product.deleted'),
  event('product.updated'),
]

function endpoint(
  fields: Partial<WebhookEndpoint> & Pick<WebhookEndpoint, 'id' | 'url'>,
): WebhookEndpoint {
  return {
    name: null,
    active: true,
    subscriptions: [],
    disabled_reason: null,
    created_at: '2026-08-01T09:00:00.000Z',
    updated_at: '2026-08-01T09:00:00.000Z',
    disabled_at: null,
    secret_key: null,
    last_delivery_at: null,
    recent_delivery_count: 0,
    recent_failure_count: 0,
    total_delivery_count: 0,
    successful_delivery_count: 0,
    failed_delivery_count: 0,
    ...fields,
  }
}

export const orderSyncEndpoint = endpoint({
  id: 'whe_3Jk9Lm2N',
  name: 'Order sync',
  url: 'https://hooks.example.com/spree/orders',
  subscriptions: ['order.completed', 'order.canceled', 'order.paid'],
  last_delivery_at: '2026-10-01T11:40:00.000Z',
  recent_delivery_count: 42,
  recent_failure_count: 1,
  total_delivery_count: 1280,
  successful_delivery_count: 1271,
  failed_delivery_count: 9,
})

export const everyEventEndpoint = endpoint({
  id: 'whe_5Pq7Rs4T',
  url: 'https://analytics.example.com/ingest',
  created_at: '2026-09-10T14:00:00.000Z',
  updated_at: '2026-09-10T14:00:00.000Z',
})

export const disabledEndpoint = endpoint({
  id: 'whe_8Uv1Wx6Y',
  name: 'Old warehouse',
  url: 'https://warehouse.example.com/webhooks',
  active: false,
  subscriptions: ['order.completed'],
  disabled_reason: 'Automatically disabled after repeated delivery failures',
  disabled_at: '2026-09-29T03:15:00.000Z',
  last_delivery_at: '2026-09-29T03:14:00.000Z',
  recent_delivery_count: 15,
  recent_failure_count: 15,
  total_delivery_count: 310,
  successful_delivery_count: 290,
  failed_delivery_count: 20,
})

export const webhookEndpoints = [orderSyncEndpoint, everyEventEndpoint, disabledEndpoint]

function delivery(
  fields: Partial<WebhookDelivery> & Pick<WebhookDelivery, 'id' | 'event_name'>,
): WebhookDelivery {
  return {
    event_id: null,
    response_code: 200,
    execution_time: 184,
    error_type: null,
    request_errors: null,
    response_body: '{"ok":true}',
    success: true,
    created_at: '2026-10-01T11:40:00.000Z',
    updated_at: '2026-10-01T11:40:00.000Z',
    delivered_at: '2026-10-01T11:40:00.000Z',
    payload: null,
    webhook_endpoint_id: orderSyncEndpoint.id,
    webhook_endpoint_url: orderSyncEndpoint.url,
    ...fields,
  }
}

/** One delivery's payload, as Spree sends it to an endpoint. */
export const orderCompletedPayload = {
  id: 'evt_6Gh2Jk8L',
  name: 'order.completed',
  created_at: '2026-10-01T11:40:00.000Z',
  data: {
    id: 'or_9Xc4Vb7N',
    number: 'R123456789',
    email: 'customer@example.com',
    status: 'complete',
    total: '84.50',
    currency: 'USD',
    item_count: 3,
    line_items: [
      { id: 'li_2Qw5Er8T', name: 'Linen shirt', quantity: 1, total: '54.50' },
      { id: 'li_7Yu1Io4P', name: 'Canvas tote', quantity: 2, total: '30.00' },
    ],
  },
}

export const webhookDeliveries: WebhookDelivery[] = [
  delivery({
    id: 'whd_1Aa2Bb3C',
    event_name: 'order.completed',
    event_id: orderCompletedPayload.id,
    payload: orderCompletedPayload,
  }),
  delivery({
    id: 'whd_4Dd5Ee6F',
    event_name: 'order.paid',
    response_code: 500,
    execution_time: 2034,
    error_type: 'server_error',
    response_body: 'Internal Server Error',
    success: false,
    created_at: '2026-10-01T10:05:00.000Z',
    updated_at: '2026-10-01T10:05:00.000Z',
    delivered_at: '2026-10-01T10:05:00.000Z',
  }),
  delivery({
    id: 'whd_7Gg8Hh9I',
    event_name: 'order.canceled',
    response_code: null,
    execution_time: null,
    response_body: null,
    success: null,
    delivered_at: null,
    created_at: '2026-10-01T11:58:00.000Z',
    updated_at: '2026-10-01T11:58:00.000Z',
  }),
]
