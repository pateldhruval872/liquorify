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
 * with the reason. The run fails on a server error, or on an answer its schema
 * rejects that is not a defect already recorded; a refusal is recorded as it
 * happened.
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

/**
 * Answers a kit's schema rejects for a reason already recorded as a Spree
 * defect in LIQ-004. The run fails when one of them stops being rejected, so
 * the list stays true.
 */
const KNOWN_REJECTIONS: Record<string, string> = {
  'seller orders.list': 'SD-3',
  'seller orders.get': 'SD-3',
  'seller orders.notes.get': 'SD-3',
}

type Reader = (...args: unknown[]) => Promise<unknown>

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

async function check(
  kit: string,
  client: object,
  schemas: Record<string, unknown>,
  calls: { path: string; status: number }[],
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
    if (!answers.has(key)) answers.set(key, recordsIn(await read.call(...args).catch(() => null)))
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
      const failure = error as { status?: number; code?: string; message?: string }
      if (typeof failure.status !== 'number') throw error
      result.error = failure.code ?? failure.message ?? 'refused'
    }
    const request = calls.slice(before).pop()
    result.status = request?.status ?? null
    result.path = request?.path ?? null
    return result
  }

  const outcomes: Outcome[] = []
  each: for (const read of reads) {
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
    if (outcome.rejected.length > 0)
      outcome.defect = KNOWN_REJECTIONS[`${kit} ${read.name}`] ?? null
    if (outcome.checked === 0) outcome.note = 'the answer held no records'
  }
  return outcomes
}

function recordingFetch(calls: { path: string; status: number }[]): typeof fetch {
  return async (input, init) => {
    const response = await fetch(input, init)
    const url = new URL(input instanceof Request ? input.url : input.toString())
    if ((init?.method ?? 'GET') === 'GET')
      calls.push({ path: url.pathname, status: response.status })
    return response
  }
}

test('Admin and Seller kits read from the running server', async () => {
  test.setTimeout(600_000)
  const outcomes: Outcome[] = []

  const adminCalls: { path: string; status: number }[] = []
  const admin = createAdminClient({ baseUrl: API, retry: false, fetch: recordingFetch(adminCalls) })
  const credentials = getCredentials()
  const adminSession = await admin.auth.login({
    email: credentials.admin_email,
    password: credentials.admin_password,
  })
  admin.setToken(adminSession.token)
  admin.setStore(credentials.store_id)
  outcomes.push(...(await check('admin', admin, adminSchemas, adminCalls)))

  const sellerCalls: { path: string; status: number }[] = []
  const seller = createSellerClient({
    baseUrl: API,
    retry: false,
    fetch: recordingFetch(sellerCalls),
  })
  const sellerSession = await seller.auth.login({
    email: FIXTURE_SELLER_USER_EMAIL,
    password: FIXTURE_SELLER_PASSWORD,
  })
  seller.setToken(sellerSession.token)
  const me = await seller.me.get()
  seller.setSeller(me.sellers[0].id)
  outcomes.push(...(await check('seller', seller, sellerSchemas, sellerCalls)))

  mkdirSync(results, { recursive: true })
  writeFileSync(`${results}kits.json`, `${JSON.stringify({ revision, outcomes }, null, 2)}\n`)

  const label = (outcome: Outcome) => `${outcome.kit} ${outcome.read}`
  expect(outcomes.some((outcome) => outcome.checked > 0)).toBe(true)
  expect(outcomes.filter((outcome) => (outcome.status ?? 0) >= 500).map(label)).toEqual([])
  expect(
    outcomes
      .filter((outcome) => outcome.rejected.length > 0)
      .map(label)
      .sort(),
  ).toEqual(Object.keys(KNOWN_REJECTIONS).sort())
})
