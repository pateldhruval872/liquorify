import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, test } from '@playwright/test'
import { createAdminClient } from '@spree/admin-sdk'
import * as adminSchemas from '@spree/admin-sdk/zod'
import { createSellerClient } from '@spree/seller-sdk'
import * as sellerSchemas from '@spree/seller-sdk/zod'
import type { ZodType } from 'zod'
import {
  FIXTURE_SELLER_PASSWORD,
  FIXTURE_SELLER_USER_EMAIL,
  getCredentials,
} from '../../dashboard/e2e/helpers'

/**
 * Calls every read method of the Admin and Seller kits against the running
 * browser-test server, as the store's admin and as the browser tests' seller,
 * and checks each answer against the schema the API reference declares for its
 * route, with the kit's own Zod schemas. It is the live counterpart of each
 * kit's `zod-schemas.test.ts`, which checks the responses recorded in the
 * reference rather than a running server.
 *
 * A read that takes records is called with records found through its parents'
 * own list methods, trying the next ones while it is refused or, for a list,
 * answers with nothing. A read the reference does not document is checked
 * against the schema of its resource's list, when it has one. A read the
 * script cannot give its arguments to, or that has nothing to read, is recorded
 * with the reason. The run fails on a server error from any request it sends,
 * the searches for records included, and on any issue a schema finds that is
 * not one already recorded as a defect; a refusal is recorded as it happened.
 *
 * Start the server as stack.spec.ts describes; no browser is needed. Results go
 * to `results/kits.json`, with no response bodies and no tokens.
 */

const API = 'http://localhost:3010'
const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const reference = (api: string) =>
  new URL(`../../../docs/api-reference/${api}.yaml`, import.meta.url)
// The parser the kits' own schema test reads the reference with.
const { parse } = createRequire(new URL('../../sdk-core/package.json', import.meta.url))('yaml')

// Arrow functions as the test runner prints them: `(id, options) =>`, or `options =>`.
const READ = /^(?:\(([^)]*)\)|(\w+))\s*=>\s*(?:\{[\s\S]*?return\s+)?this\.request\(\s*"GET",/
const RECORD_ARGUMENT = /^(id|idOrSlug|iso|\w+Id)$/
const OPTIONAL_ARGUMENTS = new Set(['params', 'options', 'expand'])
const CANDIDATES_PER_LEVEL = 25
const ATTEMPTS_PER_READ = 25

/** Arguments that are not records, and the read whose answers supply each. */
const SUPPLIED: Record<string, (owner: string) => { read: string; field: string }> = {
  type: (owner) => ({ read: `${owner}.types`, field: 'type' }),
  resourceType: () => ({ read: 'translatableResources.list', field: 'resource_type' }),
}

const SD_3 = [
  'shipping_address: Invalid input: expected object, received null',
  'billing_address: Invalid input: expected object, received null',
]

/**
 * The exact issues a kit's schema finds in a read's answers for a reason
 * already recorded as a Spree defect in LIQ-004. Any other issue fails the run,
 * and so does one of these no longer appearing, so the list stays true.
 */
const KNOWN_REJECTIONS: Record<string, { defect: string; issues: string[] }> = {
  'seller orders.list': { defect: 'SD-3', issues: SD_3 },
  'seller orders.get': { defect: 'SD-3', issues: SD_3 },
  'seller orders.notes.get': { defect: 'SD-3', issues: SD_3 },
}

type Reader = (...args: unknown[]) => Promise<unknown>

interface Call {
  kit: string
  method: string
  path: string
  status: number
}

interface Read {
  name: string
  owner: string
  method: string
  args: string[]
  call: Reader
}

interface Attempt {
  values: string[]
  status: number | null
  path: string | null
  answer: unknown
  error: string | null
}

interface Outcome {
  kit: string
  read: string
  called: boolean
  route: string | null
  status: number | null
  error: string | null
  schema: string | null
  schemaFrom: 'route' | 'its list' | null
  checked: number
  rejected: string[]
  defect: string | null
  note: string | null
}

interface Route {
  template: string
  segments: string[]
  literals: number
  schema: string | null
  shape: 'record' | 'data' | 'list' | 'array' | null
}

function readsOf(node: object, path: string[] = [], found: Read[] = [], seen = new Set<object>()) {
  seen.add(node)
  for (const key in node) {
    const value = (node as Record<string, unknown>)[key]
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) continue
    if (typeof value === 'function') {
      const match = value.toString().match(READ)
      if (match) {
        found.push({
          name: [...path, key].join('.'),
          owner: path.join('.'),
          method: key,
          args: (match[1] ?? match[2])
            .split(',')
            .map((argument) => argument.trim())
            .filter(Boolean),
          call: value as Reader,
        })
      }
    }
    if (!seen.has(value)) readsOf(value, [...path, key], found, seen)
  }
  return found
}

function routesOf(api: string): Route[] {
  const spec = parse(readFileSync(reference(api), 'utf8'))
  return Object.entries<Record<string, Record<string, unknown>>>(spec.paths)
    .filter(([, operations]) => operations.get)
    .map(([template, operations]) => {
      const responses = (operations.get as { responses?: Record<string, unknown> }).responses ?? {}
      const content = (
        responses['200'] as { content?: Record<string, { schema?: Record<string, unknown> }> }
      )?.content?.['application/json']
      const schema = content?.schema as
        | {
            $ref?: string
            items?: { $ref?: string }
            properties?: { data?: { $ref?: string; items?: { $ref?: string } } }
          }
        | undefined
      const named = (ref?: string) => ref?.split('/').pop() ?? null
      const [name, shape]: [string | null, Route['shape']] = schema?.$ref
        ? [named(schema.$ref), 'record']
        : schema?.properties?.data?.$ref
          ? [named(schema.properties.data.$ref), 'data']
          : schema?.properties?.data?.items?.$ref
            ? [named(schema.properties.data.items.$ref), 'list']
            : schema?.items?.$ref
              ? [named(schema.items.$ref), 'array']
              : [null, null]
      const segments = template.split('/')
      return {
        template,
        segments,
        literals: segments.filter((segment) => !segment.startsWith('{')).length,
        schema: name,
        shape,
      }
    })
}

/** The documented route a request reached: its parameters must be the values the script passed. */
function routeFor(routes: Route[], path: string, values: string[]) {
  const segments = path.split('/')
  return routes
    .filter(
      (route) =>
        route.segments.length === segments.length &&
        route.segments.every((segment, index) =>
          segment.startsWith('{')
            ? values.includes(decodeURIComponent(segments[index]))
            : segment === segments[index],
        ),
    )
    .sort((left, right) => right.literals - left.literals)[0]
}

function recordsIn(answer: unknown): Record<string, unknown>[] {
  if (Array.isArray(answer)) return answer
  const data = (answer as { data?: unknown } | null)?.data
  return Array.isArray(data) ? data : []
}

const idOf = (record: Record<string, unknown>) =>
  (record.id ?? record.iso ?? record.code ?? null) as string | null

const succeeded = (attempt: Attempt) =>
  attempt.error === null && attempt.status !== null && attempt.status < 300

const label = (outcome: Outcome) => `${outcome.kit} ${outcome.read}`

/** A refusal is an answer; anything else, such as an unreachable server, stops the run. */
function refusal(error: unknown) {
  const failure = error as { status?: number; code?: string; message?: string }
  if (typeof failure.status !== 'number') throw error
  return failure.code ?? failure.message ?? 'refused'
}

async function check(
  kit: string,
  client: object,
  schemas: Record<string, unknown>,
  calls: Call[],
  only?: Set<string>,
): Promise<Outcome[]> {
  const reads = readsOf(client)
  const byName = new Map(reads.map((read) => [read.name, read]))
  const lists = new Map(
    reads.filter((read) => read.method === 'list').map((read) => [read.owner, read]),
  )
  const routes = routesOf(kit)
  const answers = new Map<string, Record<string, unknown>[]>()

  async function recordsFrom(read: Read, args: string[]) {
    const key = [read.name, ...args].join(' ')
    if (!answers.has(key)) {
      const answer = await read.call(...args).catch((error) => {
        refusal(error)
        return null
      })
      answers.set(key, recordsIn(answer))
    }
    return answers.get(key) ?? []
  }

  async function* chains(levels: Read[], chosen: string[] = []): AsyncGenerator<string[]> {
    if (chosen.length === levels.length) {
      yield chosen
      return
    }
    for (const record of (await recordsFrom(levels[chosen.length], chosen)).slice(
      0,
      CANDIDATES_PER_LEVEL,
    )) {
      const id = idOf(record)
      if (id) yield* chains(levels, [...chosen, id])
    }
  }

  async function attempt(read: Read, ids: string[], supplied: Map<string, string>) {
    const queue = [...ids]
    const args = read.args.map((argument) =>
      RECORD_ARGUMENT.test(argument) ? queue.shift() : supplied.get(argument),
    )
    const before = calls.length
    const result: Attempt = {
      values: [...ids, ...supplied.values()],
      status: null,
      path: null,
      answer: null,
      error: null,
    }
    try {
      result.answer = await read.call(...args)
    } catch (error) {
      result.error = refusal(error)
    }
    const request = calls.slice(before).pop()
    result.status = request?.status ?? null
    result.path = request?.path ?? null
    return result
  }

  const outcomes: Outcome[] = []
  each: for (const read of reads) {
    if (only && !only.has(read.name)) continue
    const outcome: Outcome = {
      kit,
      read: read.name,
      called: false,
      route: null,
      status: null,
      error: null,
      schema: null,
      schemaFrom: null,
      checked: 0,
      rejected: [],
      defect: null,
      note: null,
    }
    outcomes.push(outcome)

    const records = read.args.filter((argument) => RECORD_ARGUMENT.test(argument))
    const others = read.args.filter(
      (argument) => !RECORD_ARGUMENT.test(argument) && !OPTIONAL_ARGUMENTS.has(argument),
    )
    const unsupplied = others.filter((argument) => !SUPPLIED[argument])
    if (unsupplied.length > 0) {
      outcome.note = `needs ${unsupplied.join(' and ')}, which the script does not supply`
      continue
    }
    let choices = [new Map<string, string>()]
    for (const argument of others) {
      const source = SUPPLIED[argument](read.owner)
      const from = byName.get(source.read)
      const values = (from ? await recordsFrom(from, []) : [])
        .map((record) => record[source.field])
        .filter((value): value is string => typeof value === 'string')
        .slice(0, CANDIDATES_PER_LEVEL)
      if (values.length === 0) {
        outcome.note = `no ${argument} to supply`
        continue each
      }
      choices = choices.flatMap((choice) =>
        values.map((value) => new Map([...choice, [argument, value]])),
      )
    }

    const owners = read.owner.split('.')
    const levels = owners
      .map((_, index) => lists.get(owners.slice(0, index + 1).join('.')))
      .filter((list): list is Read => Boolean(list))
      .slice(0, records.length)
    if (levels.length < records.length) {
      outcome.note = 'no list method gives its records'
      continue
    }

    const rank = (candidate: Attempt) =>
      !succeeded(candidate)
        ? 0
        : read.method === 'list' && recordsIn(candidate.answer).length === 0
          ? 1
          : 2
    let best: Attempt | null = null
    let attempts = 0
    search: for await (const ids of chains(levels)) {
      for (const supplied of choices) {
        const result = await attempt(read, ids, supplied)
        if (!best || rank(result) > rank(best)) best = result
        if (rank(best) === 2 || ++attempts >= ATTEMPTS_PER_READ) break search
      }
    }
    if (!best) {
      outcome.note = 'no record to read'
      continue
    }

    outcome.called = best.path !== null
    outcome.status = best.status
    outcome.error = best.error
    if (!best.path) continue

    const documented = routeFor(routes, best.path, best.values)
    outcome.route = documented?.template ?? best.path
    if (!documented) outcome.note = 'the reference does not document this route'
    if (!succeeded(best)) continue

    const list =
      !documented && read.method === 'get'
        ? routeFor(routes, best.path.split('/').slice(0, -1).join('/'), best.values)
        : undefined
    const route =
      documented ?? (list?.shape === 'list' || list?.shape === 'array' ? list : undefined)
    if (!route?.schema) continue

    outcome.schema = route.schema
    outcome.schemaFrom = documented ? 'route' : 'its list'
    const schema = schemas[`${route.schema}Schema`] as ZodType | undefined
    if (!schema) {
      outcome.note = 'the kit has no schema for it'
      continue
    }
    const checkedRecords = !documented
      ? [best.answer]
      : route.shape === 'record'
        ? [best.answer]
        : route.shape === 'data'
          ? [(best.answer as { data?: unknown }).data]
          : recordsIn(best.answer)
    for (const record of checkedRecords) {
      outcome.checked++
      const result = schema.safeParse(record)
      if (!result.success) {
        outcome.rejected.push(
          ...result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        )
      }
    }
    outcome.rejected = [...new Set(outcome.rejected)]
    const known = KNOWN_REJECTIONS[label(outcome)]
    if (outcome.rejected.some((issue) => known?.issues.includes(issue)))
      outcome.defect = known.defect
    if (outcome.checked === 0) outcome.note = 'the answer held no records'
  }
  return outcomes
}

function recordingFetch(kit: string, calls: Call[], send: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const response = await send(input, init)
    const url = new URL(input instanceof Request ? input.url : input.toString())
    calls.push({ kit, method: init?.method ?? 'GET', path: url.pathname, status: response.status })
    return response
  }
}

const described = (call: Call) => `${call.kit} ${call.method} ${call.path}: ${call.status}`

const serverErrors = (calls: Call[]) => calls.filter((call) => call.status >= 500).map(described)

const unexplainedRejections = (outcomes: Outcome[]) =>
  outcomes.flatMap((outcome) =>
    outcome.rejected
      .filter((issue) => !KNOWN_REJECTIONS[label(outcome)]?.issues.includes(issue))
      .map((issue) => `${label(outcome)}: ${issue}`),
  )

const missingRejections = (outcomes: Outcome[]) =>
  Object.entries(KNOWN_REJECTIONS).flatMap(([read, known]) =>
    known.issues
      .filter(
        (issue) => !outcomes.find((outcome) => label(outcome) === read)?.rejected.includes(issue),
      )
      .map((issue) => `${read}: ${issue} (${known.defect}) no longer appears`),
  )

function statusCounts(calls: Call[]) {
  const counts: Record<string, Record<string, number>> = {}
  for (const call of calls) {
    counts[call.kit] ??= {}
    counts[call.kit][call.status] = (counts[call.kit][call.status] ?? 0) + 1
  }
  return counts
}

test('Admin and Seller kits read from the running server', async () => {
  test.setTimeout(600_000)
  const outcomes: Outcome[] = []

  const calls: Call[] = []
  const admin = createAdminClient({
    baseUrl: API,
    retry: false,
    fetch: recordingFetch('admin', calls),
  })
  const credentials = getCredentials()
  const adminSession = await admin.auth.login({
    email: credentials.admin_email,
    password: credentials.admin_password,
  })
  admin.setToken(adminSession.token)
  admin.setStore(credentials.store_id)
  outcomes.push(...(await check('admin', admin, adminSchemas, calls)))

  const seller = createSellerClient({
    baseUrl: API,
    retry: false,
    fetch: recordingFetch('seller', calls),
  })
  const sellerSession = await seller.auth.login({
    email: FIXTURE_SELLER_USER_EMAIL,
    password: FIXTURE_SELLER_PASSWORD,
  })
  seller.setToken(sellerSession.token)
  const me = await seller.me.get()
  seller.setSeller(me.sellers[0].id)
  outcomes.push(...(await check('seller', seller, sellerSchemas, calls)))

  const requests = {
    statuses: statusCounts(calls),
    refused: calls.filter((call) => call.status >= 400 && call.status < 500).map(described),
    serverErrors: serverErrors(calls),
  }
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}kits.json`,
    `${JSON.stringify({ revision, requests, outcomes }, null, 2)}\n`,
  )

  expect(outcomes.some((outcome) => outcome.checked > 0)).toBe(true)
  expect(requests.serverErrors).toEqual([])
  expect(unexplainedRejections(outcomes)).toEqual([])
  expect(missingRejections(outcomes)).toEqual([])
})

/**
 * The rules above, fed answers that must fail them. The Seller kit runs against
 * a stand-in server that answers its order reads with the reference's own
 * recorded order, changed as each case says. No server is needed.
 */
test.describe('the kit check fails when it should', () => {
  const ORDERS = '/api/v3/seller/orders'
  const recorded = () =>
    parse(readFileSync(reference('seller'), 'utf8')).paths[`${ORDERS}/{id}`].get.responses['200']
      .content['application/json'].example as Record<string, unknown>
  const withoutAddresses = { shipping_address: null, billing_address: null }

  async function run(answers: Record<string, unknown[]>, only: string[]) {
    const served = new Map<string, number>()
    const server: typeof fetch = async (input) => {
      const path = new URL(input.toString()).pathname
      const turn = served.get(path) ?? 0
      served.set(path, turn + 1)
      const answer = answers[path]?.[Math.min(turn, answers[path].length - 1)]
      const failure = (status: number) =>
        Response.json({ error: { code: 'failed', message: 'Failed' } }, { status })
      return answer === undefined
        ? failure(404)
        : answer === 500
          ? failure(500)
          : Response.json(answer)
    }
    const calls: Call[] = []
    const seller = createSellerClient({
      baseUrl: 'http://kit.test',
      retry: false,
      fetch: recordingFetch('seller', calls, server),
    })
    const outcomes = await check('seller', seller, sellerSchemas, calls, new Set(only))
    return { calls, outcomes }
  }

  const list = (...orders: Record<string, unknown>[]) => ({
    data: orders,
    meta: { page: 1, limit: 25, count: orders.length, pages: 1, from: 1, to: orders.length },
  })

  test("SD-3's two null addresses pass, and an unrelated mismatch beside them fails", async () => {
    const order = { ...recorded(), id: 'or_first', ...withoutAddresses }
    const reads = ['orders.list', 'orders.get', 'orders.notes.get']
    const answers = (get: unknown) => ({
      [ORDERS]: [list(order)],
      [`${ORDERS}/or_first`]: [get],
      [`${ORDERS}/or_first/notes`]: [order],
    })

    const documented = await run(answers(order), reads)
    expect(documented.outcomes.map((outcome) => outcome.defect)).toEqual(['SD-3', 'SD-3', 'SD-3'])
    expect(unexplainedRejections(documented.outcomes)).toEqual([])
    expect(missingRejections(documented.outcomes)).toEqual([])

    const unrelated = await run(answers({ ...order, total: 12 }), reads)
    expect(unexplainedRejections(unrelated.outcomes)).toEqual([
      'seller orders.get: total: Invalid input: expected string, received number',
    ])
  })

  test('a server error fails the run though the next candidate answers', async () => {
    const order = recorded()
    const { calls, outcomes } = await run(
      {
        [ORDERS]: [list({ ...order, id: 'or_first' }, { ...order, id: 'or_second' })],
        [`${ORDERS}/or_first`]: [500],
        [`${ORDERS}/or_second`]: [{ ...order, id: 'or_second' }],
      },
      ['orders.get'],
    )
    expect(outcomes.map((outcome) => [outcome.status, outcome.checked])).toEqual([[200, 1]])
    expect(serverErrors(calls)).toEqual([`seller GET ${ORDERS}/or_first: 500`])
  })

  test('a server error fails the run when it answers the search for records', async () => {
    const { calls, outcomes } = await run({ [ORDERS]: [500] }, ['orders.get'])
    expect(outcomes.map((outcome) => [outcome.called, outcome.note])).toEqual([
      [false, 'no record to read'],
    ])
    expect(serverErrors(calls)).toEqual([`seller GET ${ORDERS}: 500`])
  })
})
