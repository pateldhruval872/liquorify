import type { OauthAccessToken, OauthApplication } from '@spree/admin-sdk'
import { delay, HttpResponse, http } from 'msw'
import { channels } from '../../../fixtures/admin/api-keys'
import { oauthApplications } from '../../../fixtures/admin/oauth'
import { webhookEvents } from '../../../fixtures/admin/webhooks'
import { onePage } from '../../page'

/** The store's channels, which a publishable key may be bound to. */
export const channelList = [
  http.get('/api/v3/admin/channels', () => HttpResponse.json(onePage(channels))),
]

/** Spree's refusal for one attribute, in the shape its Admin API answers with. */
export function refusal(attribute: string, code: string, message: string, fullMessage: string) {
  return HttpResponse.json(
    {
      error: {
        code: 'validation_error',
        message: fullMessage,
        details: { [attribute]: [{ code, message, specific: false }] },
      },
    },
    { status: 422 },
  )
}

/** The store's registered OAuth clients, and a registration that succeeds. */
export function oauthApplicationList(records: OauthApplication[] = oauthApplications) {
  return [
    http.get('/api/v3/admin/oauth/applications', () => HttpResponse.json(onePage(records))),
    http.post('/api/v3/admin/oauth/applications', async ({ request }) => {
      const params = (await request.json()) as { name: string; redirect_uri: string }
      return HttpResponse.json(
        {
          ...records[0],
          id: 'oapp_9Zx2Cv5B',
          client_id: 'sample-client-id-new',
          connected: false,
          scopes: [],
          ...params,
        },
        { status: 201 },
      )
    }),
  ]
}

/** Spree refuses a callback that is not https, in its own words. */
export const insecureCallbackRefused = [
  http.post('/api/v3/admin/oauth/applications', () =>
    refusal(
      'redirect_uri',
      'secured_uri',
      'must start with https, because authorization codes are delivered to it',
      'Redirect uri must start with https, because authorization codes are delivered to it',
    ),
  ),
]

/** Who is connected through each registration. */
export function connectionList(tokens: OauthAccessToken[]) {
  return [
    http.get('/api/v3/admin/oauth/applications/:id/tokens', () =>
      HttpResponse.json(onePage(tokens)),
    ),
    http.delete('/api/v3/admin/oauth/applications/:id/tokens/:tokenId', () =>
      HttpResponse.json(null, { status: 204 }),
    ),
  ]
}

/** Never answers, so a connections card stays loading. */
export const connectionsHeld = [
  http.get('/api/v3/admin/oauth/applications/:id/tokens', async () => {
    await delay('infinite')
  }),
]

/** The webhook event catalog the endpoint form picks from. */
export const eventCatalog = [
  http.get('/api/v3/admin/webhook_events', () =>
    HttpResponse.json({ data: webhookEvents, meta: { count: webhookEvents.length } }),
  ),
]

export const eventCatalogHeld = [
  http.get('/api/v3/admin/webhook_events', async () => {
    await delay('infinite')
  }),
]

/** The catalog fails to load; the form shows its own message, not the server's. */
export const eventCatalogFailed = [
  http.get('/api/v3/admin/webhook_events', () => new HttpResponse(null, { status: 500 })),
]

/**
 * An integration's connection check. A failure carries no reason of the
 * provider's, so the sheet shows Spree's own wording.
 */
export function integrationCheck(connected: boolean) {
  return [
    http.post('/api/v3/admin/integrations/:id/test', () =>
      HttpResponse.json({ connected, error_message: null }),
    ),
  ]
}
