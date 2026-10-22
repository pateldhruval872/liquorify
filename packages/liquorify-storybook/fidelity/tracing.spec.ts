import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { gunzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

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
const COLLECTOR_PORT = 4318
const results = new URL('./results/', import.meta.url).pathname

const KINDS = ['unspecified', 'internal', 'server', 'client', 'producer', 'consumer']

interface Span {
  service: string
  scope: string
  trace: string
  id: string
  parent: string
  name: string
  kind: string
  attributeKeys: string[]
}

/** The fields of one protobuf message: OTLP's export body, decoded without a schema library. */
function fieldsOf(buffer: Buffer) {
  const fields: { field: number; value: Buffer | bigint }[] = []
  let offset = 0
  const varint = () => {
    let result = 0n
    let shift = 0n
    for (;;) {
      const byte = buffer[offset++]
      result |= BigInt(byte & 0x7f) << shift
      if (byte < 0x80) return result
      shift += 7n
    }
  }
  while (offset < buffer.length) {
    const key = Number(varint())
    const wire = key & 7
    const field = key >> 3
    if (wire === 0) fields.push({ field, value: varint() })
    else if (wire === 1 || wire === 5) {
      const size = wire === 1 ? 8 : 4
      fields.push({ field, value: buffer.subarray(offset, offset + size) })
      offset += size
    } else if (wire === 2) {
      const size = Number(varint())
      fields.push({ field, value: buffer.subarray(offset, offset + size) })
      offset += size
    } else throw new Error(`Unexpected protobuf wire type ${wire}`)
  }
  return fields
}

const messages = (buffer: Buffer, field: number) =>
  fieldsOf(buffer)
    .filter((entry) => entry.field === field && Buffer.isBuffer(entry.value))
    .map((entry) => entry.value as Buffer)
const text = (buffer: Buffer, field: number) => messages(buffer, field)[0]?.toString('utf8') ?? ''
const hex = (buffer: Buffer, field: number) => messages(buffer, field)[0]?.toString('hex') ?? ''

function spansIn(body: Buffer): Span[] {
  return messages(body, 1).flatMap((resourceSpans) => {
    const resource = messages(resourceSpans, 1)[0] ?? Buffer.alloc(0)
    const service =
      messages(resource, 1)
        .filter((attribute) => text(attribute, 1) === 'service.name')
        .map((attribute) => text(messages(attribute, 2)[0] ?? Buffer.alloc(0), 1))[0] ?? ''
    return messages(resourceSpans, 2).flatMap((scopeSpans) => {
      const scope = text(messages(scopeSpans, 1)[0] ?? Buffer.alloc(0), 1)
      return messages(scopeSpans, 2).map((span) => ({
        service,
        scope,
        trace: hex(span, 1),
        id: hex(span, 2),
        parent: hex(span, 4),
        name: text(span, 5),
        kind:
          KINDS[Number(fieldsOf(span).find((entry) => entry.field === 6)?.value ?? 0n)] ??
          'unspecified',
        attributeKeys: messages(span, 9).map((attribute) => text(attribute, 1)),
      }))
    })
  })
}

test.skip(!KEY || !SERVICE, 'needs TRACING_PUBLISHABLE_KEY and TRACING_SERVICE_NAME')

test('A request to Spree reaches a collector as a trace', async ({ request }) => {
  const spans: Span[] = []
  const exports: { path: string; encoding: string | null; bytes: number }[] = []
  const collector: Server = createServer((incoming, answer) => {
    const chunks: Buffer[] = []
    incoming.on('data', (chunk: Buffer) => chunks.push(chunk))
    incoming.on('end', () => {
      const raw = Buffer.concat(chunks)
      const encoding = incoming.headers['content-encoding'] ?? null
      const body = encoding === 'gzip' ? gunzipSync(raw) : raw
      exports.push({ path: incoming.url ?? '', encoding, bytes: body.length })
      if (incoming.url === '/v1/traces') spans.push(...spansIn(body))
      answer.writeHead(200, { 'Content-Type': 'application/x-protobuf' }).end()
    })
  })
  await new Promise<void>((resolve) => collector.listen(COLLECTOR_PORT, resolve))

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
    await new Promise<void>((resolve) => collector.close(() => resolve()))
  }
})
