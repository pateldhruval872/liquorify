import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { Collector, type Span } from './collector'

/**
 * Tracing, for the platform batch's step P1: Spree's server exports the trace
 * of a request to a collector, here a local one this script runs on port 4318.
 * Spree's browser-test server does not load the tracing gem, so this runs
 * against the gem's own test app (`spree/opentelemetry`, `rake test_app`),
 * given Spree's seeds. Start it on port 3030 with the standard OpenTelemetry
 * settings, `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` and
 * `OTEL_SERVICE_NAME`, and pass the store's publishable key as
 * `TRACING_PUBLISHABLE_KEY` and the service name as `TRACING_SERVICE_NAME`.
 *
 * The script registers a shopper through the Store API, which runs a Spree
 * workflow, and lists products, then reads the spans the server exports.
 * Results go to `results/tracing.json`: span names, kinds and the instrumenting
 * library, never attribute values.
 */

const API = process.env.TRACING_API_URL ?? 'http://localhost:3030'
const KEY = process.env.TRACING_PUBLISHABLE_KEY ?? ''
const SERVICE = process.env.TRACING_SERVICE_NAME ?? ''
const results = new URL('./results/', import.meta.url).pathname

test.skip(!KEY || !SERVICE, 'needs TRACING_PUBLISHABLE_KEY and TRACING_SERVICE_NAME')

test('A request to Spree reaches a collector as a trace', async ({ request }) => {
  const collector = new Collector()
  const { spans, exports } = collector
  await collector.start()

  try {
    const headers = { 'X-Spree-Api-Key': KEY }
    const products = await request.get(`${API}/api/v3/store/products`, { headers })
    const registration = await request.post(`${API}/api/v3/store/customers`, {
      headers,
      data: {
        email: `p1-tracing-${Date.now()}@example.com`,
        password: 'tracing-password-123',
        password_confirmation: 'tracing-password-123',
        first_name: 'Trace',
        last_name: 'Check',
        terms_of_service: true,
      },
    })
    expect(products.status()).toBe(200)
    expect(registration.status()).toBe(201)

    const server = (method: string, path: string) =>
      spans.find(
        (span) =>
          span.kind === 'server' && span.name.startsWith(method) && span.name.includes(path),
      )
    await expect
      .poll(() => Boolean(server('POST', 'customers') && server('GET', 'products')), {
        timeout: 30_000,
      })
      .toBe(true)
    // The workflow's spans finish with the request; give the batch they ride in time to arrive.
    await expect
      .poll(
        () => spans.filter((span) => span.trace === server('POST', 'customers')?.trace).length,
        { timeout: 15_000 },
      )
      .toBeGreaterThan(1)

    const traces = ['GET products', 'POST customers'].map((label) => {
      const [method, path] = label.split(' ')
      const root = server(method, path) as Span
      const inTrace = spans.filter((span) => span.trace === root.trace)
      return {
        request: label,
        service: root.service,
        spans: inTrace.length,
        names: [...new Set(inTrace.map((span) => `${span.kind} ${span.name}`))],
        scopes: [...new Set(inTrace.map((span) => span.scope))],
        spree: inTrace
          .filter((span) => span.scope === 'spree')
          .map((span) => ({ name: span.name, kind: span.kind, attributeKeys: span.attributeKeys })),
        allShareTheTrace: inTrace.every((span) => span.trace === root.trace),
      }
    })
    mkdirSync(results, { recursive: true })
    writeFileSync(
      `${results}tracing.json`,
      `${JSON.stringify({ exports: exports.length, traces }, null, 2)}\n`,
    )

    for (const trace of traces) expect(trace.service).toBe(SERVICE)
    const registered = traces[1]
    expect(registered.spree.length).toBeGreaterThan(0)
    expect(registered.scopes.some((scope) => /ActiveRecord/.test(scope))).toBe(true)
  } finally {
    await collector.stop()
  }
})
