import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { Collector, type Span } from './collector'
import { Receiver } from './receiver'

/**
 * Tracing of webhook deliveries, for the platform batch's step P2
 * (CAP-11-10), the layer P1's tracing check left. Spree's browser-test server
 * does not load the tracing gem, so this runs against the gem's own test app
 * (`spree/opentelemetry`, `rake test_app`), as `tracing.spec.ts` does. The
 * script starts that app on port 3030 in its test environment, with a
 * database of its own given Spree's seeds, the standard OpenTelemetry
 * settings pointing at a collector it runs on port 4318, and
 * `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS=localhost`, so a webhook may reach
 * its receiver on port 4415. At the end it stops the app and removes that
 * database.
 *
 * The test environment only queues jobs, so no delivery would be sent. A
 * settings file the script writes into the generated test app, and removes
 * when it stops, runs jobs in the server, as `customer-mail.spec.ts` does.
 * Spree's code and its test settings are unchanged. It runs on this machine,
 * not in the Playwright image, because it starts the test app; it opens no
 * browser.
 *
 * Through the Admin API, with a secret key the seeds step creates, it adds an
 * endpoint for the receiver, sends the endpoint's test delivery and creates a
 * product, whose event the endpoint is subscribed to. For each delivery it
 * compares the trace context the receiver got with the spans the server
 * exported. Results go to `results/p2/webhook-tracing.json`: span names,
 * kinds and attribute names, and whether the identifiers match, never the
 * identifiers or attribute values.
 */

const PORT = 3030
const API = `http://127.0.0.1:${PORT}/api/v3/admin`
const RECEIVER_PORT = 4415
const SERVICE = 'liquorify-p2-webhook-tracing'
const APP = new URL('../../../spree/opentelemetry/spec/dummy/', import.meta.url).pathname
const SETTINGS = `${APP}config/initializers/liquorify_webhook_tracing.rb`
const DATABASE = `${APP}db/spree_test_liquorify.sqlite3`
const results = new URL('./results/p2/', import.meta.url).pathname
const run = Date.now()
const environment = {
  ...process.env,
  RAILS_ENV: 'test',
  TEST_ENV_NUMBER: '_liquorify',
  LIQUORIFY_WEBHOOK_TRACING: '1',
  LANG: 'C.UTF-8',
  SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS: 'localhost',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
  OTEL_SERVICE_NAME: SERVICE,
  OTEL_BSP_SCHEDULE_DELAY: '500',
}

const collector = new Collector()
const receiver = new Receiver(RECEIVER_PORT)
let server: ChildProcess | undefined
let key = ''

/** Preparing the database exports nothing: tracing is off for these commands. */
const rails = (...args: string[]) =>
  execFileSync('bin/rails', args, {
    cwd: APP,
    env: { ...environment, OTEL_SDK_DISABLED: 'true' },
    stdio: 'pipe',
    timeout: 300_000,
  })

async function admin(method: string, path: string, body?: object) {
  const response = await fetch(`${API}/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Spree-API-Key': key },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, body: (await response.json()) as Record<string, unknown> }
}

test.beforeAll(async () => {
  test.setTimeout(600_000)
  writeFileSync(
    SETTINGS,
    [
      '# Written by packages/liquorify-storybook/fidelity/webhook-tracing.spec.ts — safe to delete.',
      "if ENV['LIQUORIFY_WEBHOOK_TRACING'] == '1'",
      '  Rails.application.config.after_initialize do',
      '    ActiveJob::Base.queue_adapter = :async',
      '  end',
      'end',
      '',
    ].join('\n'),
  )
  mkdirSync(`${results}tmp`, { recursive: true })
  const keyFile = `${results}tmp/webhook-tracing-key.json`
  rails('db:schema:load')
  rails(
    'runner',
    [
      'Spree::Seeds::All.call',
      "key = Spree::Store.default.api_keys.create!(name: 'P2 webhook tracing', key_type: 'secret', scopes: %w[write_webhooks write_products])",
      'File.write(ARGV[0], { key: key.plaintext_token }.to_json, perm: 0o600)',
    ].join('; '),
    keyFile,
  )
  key = JSON.parse(readFileSync(keyFile, 'utf8')).key
  rmSync(keyFile)

  await collector.start()
  await receiver.start()
  server = spawn(
    'bin/rails',
    ['server', '-p', String(PORT), '-b', '127.0.0.1', '-P', `${results}tmp/webhook-tracing.pid`],
    { cwd: APP, env: environment, stdio: 'ignore' },
  )
  await expect
    .poll(
      () =>
        fetch(`${API}/products`).then(
          () => true,
          () => false,
        ),
      { timeout: 120_000 },
    )
    .toBe(true)
})

test.afterAll(async () => {
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server?.once('exit', resolve))
    server.kill('SIGTERM')
    await stopped
  }
  await receiver.stop()
  await collector.stop()
  rmSync(SETTINGS, { force: true })
  for (const file of [DATABASE, `${DATABASE}-shm`, `${DATABASE}-wal`]) rmSync(file, { force: true })
})

test('A webhook delivery is a span, and its request carries the trace context', async () => {
  mkdirSync(results, { recursive: true })
  const { spans } = collector
  const ours = (path: string) => path === `/hooks/${run}`

  const endpoint = await admin('POST', 'webhook_endpoints', {
    name: `P2 tracing ${run}`,
    url: `http://localhost:${RECEIVER_PORT}/hooks/${run}`,
    subscriptions: ['product.created'],
  })
  expect(endpoint.status).toBe(201)
  const sendTest = await admin('POST', `webhook_endpoints/${endpoint.body.id}/send_test`)
  const product = await admin('POST', 'products', { name: `P2 traced product ${run}` })
  expect(product.status).toBe(201)

  // Traces reached from `trace` by following span links: a job's trace links
  // to the trace that queued it.
  const linkedFrom = (trace: string) => {
    const reached = new Set([trace])
    const queue = [trace]
    while (queue.length > 0) {
      const current = queue.shift()
      for (const span of spans.filter((candidate) => candidate.trace === current)) {
        for (const link of span.links) {
          if (reached.has(link.trace)) continue
          reached.add(link.trace)
          queue.push(link.trace)
        }
      }
    }
    return reached
  }

  const requestSpan = (method: string, path: string) =>
    spans.find(
      (span) => span.kind === 'server' && span.name.startsWith(method) && span.name.includes(path),
    )

  const deliveries = []
  for (const [event, origin] of [
    ['webhook.test', ['POST', 'send_test']],
    ['product.created', ['POST', 'products']],
  ] as const) {
    const arrived = await receiver.next(
      (item) => ours(item.path) && item.headers['x-spree-webhook-event'] === event,
      60_000,
    )
    const [, trace, parent] = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/.exec(
      String(arrived.headers.traceparent ?? ''),
    ) ?? ['', '', '']
    const deliverName = `spree.webhook.deliver ${event}`
    await expect
      .poll(() => spans.some((span) => span.name === deliverName && span.trace === trace), {
        timeout: 30_000,
      })
      .toBe(true)
    const deliver = spans.find((span) => span.name === deliverName && span.trace === trace) as Span
    const inTrace = spans.filter((span) => span.trace === trace)
    const parentSpan = inTrace.find((span) => span.id === parent)
    const descends = (span: Span | undefined): boolean =>
      Boolean(span) &&
      (span?.id === deliver.id || descends(inTrace.find((other) => other.id === span?.parent)))
    await expect
      .poll(() => Boolean(requestSpan(origin[0], origin[1])), { timeout: 30_000 })
      .toBe(true)
    const request = requestSpan(origin[0], origin[1]) as Span
    const reachesTheRequest = await expect
      .poll(() => linkedFrom(trace).has(request.trace), { timeout: 15_000 })
      .toBe(true)
      .then(
        () => true,
        () => false,
      )
    deliveries.push({
      event,
      cause: `${origin[0]} ${origin[1]}`,
      headers: Object.keys(arrived.headers)
        .filter((name) => ['traceparent', 'tracestate', 'baggage'].includes(name))
        .sort(),
      deliverySpan: {
        name: deliver.name,
        kind: deliver.kind,
        scope: deliver.scope,
        service: deliver.service,
        attributeKeys: [...deliver.attributeKeys].sort(),
      },
      spansInTheDeliveryTrace: [...new Set(inTrace.map((span) => `${span.kind} ${span.name}`))],
      traceparentNamesTheDeliveryTrace: trace === deliver.trace,
      traceparentParent: parentSpan ? `${parentSpan.kind} ${parentSpan.name}` : null,
      traceparentParentIsTheDeliveryOrWithinIt: descends(parentSpan),
      requestThatCausedIt: {
        sameTrace: request.trace === trace,
        reachedByFollowingLinks: reachesTheRequest,
        tracesOnTheWay: linkedFrom(trace).size - 1,
      },
    })
  }

  const summary = {
    check: 'P2 criterion 6: tracing of webhook deliveries (CAP-11-10)',
    revision: process.env.FIDELITY_REVISION ?? null,
    service: SERVICE,
    testDelivery: { status: sendTest.status },
    receiver: 'A local receiver on this machine, over plain http',
    deliveries,
  }
  writeFileSync(`${results}webhook-tracing.json`, `${JSON.stringify(summary, null, 2)}\n`)

  for (const delivery of deliveries) {
    expect(delivery.deliverySpan.kind).toBe('client')
    expect(delivery.deliverySpan.service).toBe(SERVICE)
    expect(delivery.headers).toContain('traceparent')
    expect(delivery.headers).not.toContain('baggage')
    expect(delivery.traceparentNamesTheDeliveryTrace).toBe(true)
    expect(delivery.traceparentParentIsTheDeliveryOrWithinIt).toBe(true)
  }
})
