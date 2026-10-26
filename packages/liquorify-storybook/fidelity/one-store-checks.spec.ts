import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { type APIRequestContext, expect, request as playwright, test } from '@playwright/test'
import {
  type Caller,
  type Case,
  denied,
  notFound,
  ownOnly,
  runCase,
  runStorefrontCase,
  type StorefrontCase,
} from './one-store'

/**
 * Step P7's criterion 6: each kind of assertion in `one-store.ts` shown to
 * fail when it should. A stand-in server, started here on a free port, gives
 * each case one wrong answer: a success where a refusal was due, the wrong
 * code, the wrong permission, a server error, a refused answer that carries
 * the protected record's data, a refused write that changes the record, an
 * allowed request that is refused, and an allowed write the read-back cannot
 * see. Its storefront part answers as a storefront page or server action
 * would. One case of each judge gets right answers, to show the stand-in's
 * cases fail for their wrong answer and not for the stand-in itself.
 *
 * Needs no Spree server. Results go to `results/p7/checks.json`.
 */

const results = new URL('./results/p7/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

interface Reply {
  status: number
  body?: unknown
  html?: string
  headers?: Record<string, string>
}
type Handler = (caller: string, body: unknown) => Reply
const routes = new Map<string, Handler>()
const route = (method: string, path: string, handler: Handler) =>
  routes.set(`${method} ${path}`, handler)

const PROTECTED = 'Protected Name 7'
const refusal = (permission = 'read_things'): Reply => ({
  status: 403,
  body: {
    error: {
      code: 'access_denied',
      message: `Missing permission: ${permission}`,
      details: { required_permission: permission },
    },
  },
})
const record = (name = PROTECTED): Reply => ({ status: 200, body: { id: 'thing_Ab12Cd34', name } })
/** A server action's answer, in the shape `actionResult` reads. */
const rsc = (value: unknown): Reply => ({
  status: 200,
  html: `0:{"a":"$@1","f":"","b":"stand-in"}\n1:${JSON.stringify(value)}\n`,
  headers: { 'content-type': 'text/x-component' },
})

const refused: Caller = { name: 'refused', headers: { 'X-Caller': 'refused' } }
const allowed: Caller = { name: 'allowed', headers: { 'X-Caller': 'allowed' } }

/** A read, `GET /api/<n>`, whose refused caller gets `wrong` and whose allowed caller gets the record. */
function read(n: number, wrong: Reply, extra: Partial<Case> = {}): Case {
  route('GET', `/api/${n}`, (caller) => (caller === 'allowed' ? record() : wrong))
  return {
    gap: 'stand-in',
    area: 'stand-in',
    title: '',
    request: { method: 'GET', path: `/api/${n}` },
    attempts: [{ caller: refused, expected: denied('read_things') }],
    control: { caller: allowed, status: 200 },
    protectedValues: [PROTECTED],
    ...extra,
  }
}

/**
 * A write, `PATCH /api/<n>`, refused correctly unless `changeOnRefusal`, with
 * its record readable at `GET /api/<n>/state`. The allowed write changes the
 * record unless `allowedChangesNothing`.
 */
function write(
  n: number,
  options: { changeOnRefusal?: boolean; allowedChangesNothing?: boolean; allowed?: Reply },
) {
  const state = { name: PROTECTED }
  route('GET', `/api/${n}/state`, () => ({ status: 200, body: state }))
  route('PATCH', `/api/${n}`, (caller, body) => {
    const name = String((body as { name?: string })?.name)
    if (caller === 'allowed') {
      if (!options.allowedChangesNothing) state.name = name
      return options.allowed ?? { status: 200, body: state }
    }
    if (options.changeOnRefusal) state.name = name
    return refusal('write_things')
  })
  return {
    gap: 'stand-in',
    area: 'stand-in',
    title: '',
    request: { method: 'PATCH', path: `/api/${n}`, data: { name: `Edited ${n}` } },
    attempts: [{ caller: refused, expected: denied('write_things') }],
    control: {
      caller: allowed,
      status: 200,
      request: { method: 'PATCH', path: `/api/${n}`, data: { name: `Allowed ${n}` } },
    },
    protectedValues: [PROTECTED],
    state: { caller: allowed, request: { method: 'GET', path: `/api/${n}/state` } },
  } satisfies Case
}

/** Each API case, the answer it is given, and the failure the judge must report. */
const apiCases: { title: string; failure: RegExp | null; item: () => Case }[] = [
  { title: 'Right answers throughout', failure: null, item: () => read(1, refusal()) },
  {
    title: 'A success where a refusal was due',
    failure: /refused: answered 200/,
    item: () => read(2, { status: 200, body: { data: [] } }),
  },
  {
    title: 'The wrong error code',
    failure: /refused: answered 403 forbidden/,
    item: () =>
      read(3, {
        status: 403,
        body: { error: { code: 'forbidden', details: { required_permission: 'read_things' } } },
      }),
  },
  {
    title: 'The wrong permission named',
    failure: /refused: answered 403 access_denied read_other/,
    item: () => read(4, refusal('read_other')),
  },
  {
    title: 'Another refusal than the one written',
    failure: /refused: answered 404 record_not_found/,
    item: () => read(5, { status: 404, body: { error: { code: 'record_not_found' } } }),
  },
  {
    title: 'A server error, as JSON',
    failure: /refused: answered 500 internal_server_error/,
    item: () => read(6, { status: 500, body: { error: { code: 'internal_server_error' } } }),
  },
  {
    title: 'A server error, as a page',
    failure: /refused: answered 500, expected 403/,
    item: () => read(7, { status: 500, html: '<h1>We are sorry</h1>' }),
  },
  {
    title: 'A redirect where a refusal was due',
    failure: /refused: answered 302/,
    item: () => read(8, { status: 302, headers: { location: '/login' } }),
  },
  {
    title: "A refusal that carries the record's data",
    failure: /refused: the answer carried a known value/,
    item: () => {
      const leaky = refusal()
      ;(leaky.body as { error: { message: string } }).error.message =
        `Missing permission to read ${PROTECTED}`
      return read(9, leaky)
    },
  },
  {
    title: "A refusal that matches a protected pattern, such as a token's",
    failure: /refused: the answer carried a match for/,
    item: () => {
      const leaky = refusal()
      ;(leaky.body as { error: { message: string } }).error.message = 'See /accept?token=abc'
      return read(10, leaky, { protectedPatterns: [/token=/i] })
    },
  },
  {
    title: 'A refusal that carries a record the allowed answer found',
    failure: /refused: the answer carried a known value/,
    item: () => {
      const item = read(11, refusal())
      route('GET', '/api/11', (caller) =>
        caller === 'allowed'
          ? { status: 200, body: { data: [{ name: 'Found Record 11' }] } }
          : {
              status: 403,
              body: { ...(refusal().body as object), data: [{ name: 'Found Record 11' }] },
            },
      )
      return {
        ...item,
        protectedValues: [],
        valuesFromControl: (body) =>
          ((body as { data: { name: string }[] }).data ?? []).map((item) => item.name),
      }
    },
  },
  {
    title: 'An allowed read that finds nothing to look for',
    failure: /the allowed answer named no record to look for/,
    item: () => {
      const item = read(12, refusal())
      route('GET', '/api/12', (caller) =>
        caller === 'allowed' ? { status: 200, body: { data: [] } } : refusal(),
      )
      return {
        ...item,
        protectedValues: [],
        valuesFromControl: (body) =>
          ((body as { data: { name: string }[] }).data ?? []).map((item) => item.name),
      }
    },
  },
  {
    title: "An allowed read that does not carry the record's values",
    failure: /the allowed answer did not carry the values/,
    item: () => {
      const item = read(13, refusal())
      route('GET', '/api/13', (caller) =>
        caller === 'allowed' ? record('Someone Else') : refusal(),
      )
      return item
    },
  },
  {
    title: 'A refused write that changes the record',
    failure: /refused: the record changed/,
    item: () => write(14, { changeOnRefusal: true }),
  },
  {
    title: 'A refused create that creates the record',
    failure: /refused: the record changed/,
    item: () => {
      const created: string[] = []
      route('GET', '/api/15/state', () => ({ status: 200, body: { data: created } }))
      route('POST', '/api/15', (caller, body) => {
        created.push(String((body as { name: string }).name))
        return caller === 'allowed' ? { status: 201, body: {} } : refusal('write_things')
      })
      return {
        gap: 'stand-in',
        area: 'stand-in',
        title: '',
        request: { method: 'POST', path: '/api/15', data: { name: 'Created 15' } },
        attempts: [{ caller: refused, expected: denied('write_things') }],
        control: { caller: allowed, status: 201 },
        state: { caller: allowed, request: { method: 'GET', path: '/api/15/state' } },
      }
    },
  },
  {
    title: 'An allowed caller refused too, as a server refusing everything',
    failure: /the allowed caller allowed got 403, expected 200/,
    item: () => write(16, { allowedChangesNothing: true, allowed: refusal('write_things') }),
  },
  {
    title: 'An allowed write the read-back cannot see',
    failure: /the allowed write left the record as it was/,
    item: () => write(17, { allowedChangesNothing: true }),
  },
  {
    title: "A list answered with the first customer's records",
    failure: /refused: the answer carried a known value/,
    item: () => ({
      ...read(18, record()),
      attempts: [{ caller: refused, expected: ownOnly }],
    }),
  },
  {
    title: 'A guest answered 404 where 401 was due',
    failure: /refused: answered 404 record_not_found, expected 401/,
    item: () => ({
      ...read(19, { status: 404, body: { error: { code: 'record_not_found' } } }),
      attempts: [
        {
          caller: refused,
          expected: { status: 401, code: 'authentication_required', requiredPermission: null },
        },
      ],
    }),
  },
  {
    title: "Another customer's order answered with the generic not-found code",
    failure: /refused: answered 404 record_not_found, expected 404 order_not_found/,
    item: () => ({
      ...read(20, { status: 404, body: { error: { code: 'record_not_found' } } }),
      attempts: [{ caller: refused, expected: notFound('order_not_found') }],
    }),
  },
]

/** The storefront's own server code: a page at `/sf/<n>`, or a server action posted to it. */
const LINE = 'Protected Line 9'
const signIn = (n: number) => `/us/en/account?redirect=${encodeURIComponent(`/sf/${n}`)}`
function storefront(
  n: number,
  answers: { refused: Reply; allowed: Reply },
  item: Omit<StorefrontCase, 'gap' | 'title' | 'protectedValues'> & { protectedValues?: string[] },
): StorefrontCase {
  const handler: Handler = (caller) => (caller === 'allowed' ? answers.allowed : answers.refused)
  route('GET', `/sf/${n}`, handler)
  route('POST', `/sf/${n}`, handler)
  return { gap: 'stand-in', title: '', protectedValues: [LINE], ...item }
}
const action = (n: number) => ({
  page: `/sf/${n}`,
  action: { id: 'stand-in', args: ['addr_Ab12Cd34'] },
})
const kept = { id: 'addr_Ab12Cd34', address1: LINE }

const storefrontCases: { title: string; failure: RegExp | null; item: () => StorefrontCase }[] = [
  {
    title: 'Right answers throughout',
    failure: null,
    item: () =>
      storefront(
        101,
        {
          refused: rsc({ success: false, error: 'Address not found' }),
          allowed: rsc({ success: true, address: kept }),
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: action(101),
              expected: { result: { success: false, error: 'Address not found' } },
            },
          ],
          control: {
            caller: 'allowed',
            probe: action(101),
            expected: { result: { success: true } },
          },
        },
      ),
  },
  {
    title: 'An action that succeeds where a refusal was due',
    failure: /refused: answered 200 with \{"success":true\}/,
    item: () =>
      storefront(
        102,
        { refused: rsc({ success: true }), allowed: rsc({ success: true, address: kept }) },
        {
          attempts: [
            {
              caller: 'refused',
              probe: action(102),
              expected: { result: { success: false, error: 'Address not found' } },
            },
          ],
          control: {
            caller: 'allowed',
            probe: action(102),
            expected: { result: { success: true } },
          },
        },
      ),
  },
  {
    title: 'An action that refuses with another message',
    failure: /refused: answered 200 with \{"success":false,"error":"Something went wrong"\}/,
    item: () =>
      storefront(
        103,
        {
          refused: rsc({ success: false, error: 'Something went wrong' }),
          allowed: rsc({ success: true, address: kept }),
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: action(103),
              expected: { result: { success: false, error: 'Address not found' } },
            },
          ],
          control: {
            caller: 'allowed',
            probe: action(103),
            expected: { result: { success: true } },
          },
        },
      ),
  },
  {
    title: "An action that answers with the other customer's record",
    failure: /refused: the answer carried a known value/,
    item: () =>
      storefront(
        104,
        { refused: rsc(kept), allowed: rsc(kept) },
        {
          attempts: [{ caller: 'refused', probe: action(104), expected: { result: null } }],
          control: { caller: 'allowed', probe: action(104), expected: { result: { id: kept.id } } },
        },
      ),
  },
  {
    title: "A page that shows the other customer's order",
    failure: /refused: the answer carried a known value/,
    item: () =>
      storefront(
        105,
        {
          refused: { status: 200, html: `<p>Order R105, ${LINE}</p>` },
          allowed: { status: 200, html: `<p>Order R105, ${LINE}</p>` },
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: { page: '/sf/105' },
              expected: { page: 200, shows: ['Order not found'] },
            },
          ],
          control: {
            caller: 'allowed',
            probe: { page: '/sf/105' },
            expected: { page: 200, shows: ['R105'] },
          },
        },
      ),
  },
  {
    title: 'A redirect to another page than the sign-in for this one',
    failure: /refused: answered a redirect to \/us\/en\/account$/,
    item: () =>
      storefront(
        106,
        {
          refused: { status: 307, headers: { location: '/us/en/account' } },
          allowed: { status: 200, html: `<p>${LINE}</p>` },
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: { page: '/sf/106' },
              expected: { redirectTo: signIn(106) },
            },
          ],
          control: {
            caller: 'allowed',
            probe: { page: '/sf/106' },
            expected: { page: 200, shows: [LINE] },
          },
        },
      ),
  },
  {
    title: 'A page where a redirect to sign in was due',
    failure: /refused: answered 200 with no action result/,
    item: () =>
      storefront(
        107,
        {
          refused: { status: 200, html: '<p>Your account</p>' },
          allowed: { status: 200, html: `<p>${LINE}</p>` },
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: { page: '/sf/107' },
              expected: { redirectTo: signIn(107) },
            },
          ],
          control: {
            caller: 'allowed',
            probe: { page: '/sf/107' },
            expected: { page: 200, shows: [LINE] },
          },
        },
      ),
  },
  {
    title: 'A server error from an action',
    failure: /refused: answered 500 with no action result/,
    item: () =>
      storefront(
        108,
        { refused: { status: 500, html: 'Internal Server Error' }, allowed: rsc(kept) },
        {
          attempts: [{ caller: 'refused', probe: action(108), expected: { result: null } }],
          control: { caller: 'allowed', probe: action(108), expected: { result: { id: kept.id } } },
        },
      ),
  },
  {
    title: 'A refused action that changes the record',
    failure: /refused: the record changed/,
    item: () => {
      const state = { address1: LINE }
      const item = storefront(
        109,
        {
          refused: rsc({ success: false, error: 'Address not found' }),
          allowed: rsc({ success: true }),
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: action(109),
              expected: { result: { success: false, error: 'Address not found' } },
            },
          ],
          control: {
            caller: 'allowed',
            probe: action(109),
            expected: { result: { success: true } },
          },
          state: async () => ({ ...state }),
        },
      )
      route('POST', '/sf/109', (caller) => {
        state.address1 = `Changed by ${caller}`
        return caller === 'allowed'
          ? rsc({ success: true })
          : rsc({ success: false, error: 'Address not found' })
      })
      return item
    },
  },
  {
    title: 'An allowed customer refused their own record',
    failure: /the allowed caller allowed got 200 with null/,
    item: () =>
      storefront(
        110,
        { refused: rsc(null), allowed: rsc(null) },
        {
          attempts: [{ caller: 'refused', probe: action(110), expected: { result: null } }],
          control: { caller: 'allowed', probe: action(110), expected: { result: { id: kept.id } } },
        },
      ),
  },
  {
    title: "A list answered with the first customer's records",
    failure: /refused: the answer carried a known value/,
    item: () =>
      storefront(
        111,
        { refused: rsc({ data: [kept] }), allowed: rsc({ data: [kept] }) },
        {
          attempts: [{ caller: 'refused', probe: action(111), expected: { ownResult: true } }],
          control: { caller: 'allowed', probe: action(111), expected: { ownResult: true } },
        },
      ),
  },
  {
    title: 'An allowed write the read-back cannot see',
    failure: /the allowed write left the record as it was/,
    item: () =>
      storefront(
        112,
        {
          refused: rsc({ success: false, error: 'Address not found' }),
          allowed: rsc({ success: true }),
        },
        {
          attempts: [
            {
              caller: 'refused',
              probe: action(112),
              expected: { result: { success: false, error: 'Address not found' } },
            },
          ],
          control: {
            caller: 'allowed',
            probe: action(112),
            expected: { result: { success: true } },
          },
          state: async () => ({ address1: LINE }),
        },
      ),
  },
]

const readBody = (req: IncomingMessage) =>
  new Promise<unknown>((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : null)
      } catch {
        resolve(raw)
      }
    })
  })

test('each kind of assertion fails against a stand-in server that answers wrongly', async () => {
  const api = apiCases.map((entry) => ({
    ...entry,
    built: { ...entry.item(), title: entry.title },
  }))
  const sf = storefrontCases.map((entry) => ({
    ...entry,
    built: { ...entry.item(), title: entry.title },
  }))

  const server = createServer(async (req, res) => {
    const path = (req.url ?? '/').split('?')[0]
    const body = await readBody(req)
    const handler = routes.get(`${req.method} ${path}`)
    const reply = handler
      ? handler(String(req.headers['x-caller']), body)
      : { status: 404, body: { error: { code: 'no_such_route' } } }
    res.writeHead(reply.status, {
      'content-type': reply.html === undefined ? 'application/json' : 'text/html',
      ...reply.headers,
    })
    res.end(reply.html ?? (reply.body === undefined ? '' : JSON.stringify(reply.body)))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const contexts: Record<string, APIRequestContext> = {}
  try {
    const client = await playwright.newContext({ baseURL })
    for (const name of ['refused', 'allowed'])
      contexts[name] = await playwright.newContext({
        baseURL,
        extraHTTPHeaders: { 'X-Caller': name },
      })

    const outcomes = []
    for (const entry of api)
      outcomes.push({ judge: 'api', entry, result: await runCase(client, entry.built) })
    for (const entry of sf)
      outcomes.push({
        judge: 'storefront',
        entry,
        result: await runStorefrontCase(contexts, entry.built),
      })
    await client.dispose()

    const checked = outcomes.map(({ judge, entry, result }) => {
      const caught = entry.failure
        ? result.result === 'FAIL' &&
          result.failures.some((failure) => entry.failure?.test(failure))
        : result.result === 'PASS'
      return {
        judge,
        case: entry.title,
        wrongAnswer: entry.failure ? entry.failure.source : null,
        result: result.result,
        failures: result.failures,
        asIntended: caught,
      }
    })
    mkdirSync(results, { recursive: true })
    writeFileSync(
      `${results}checks.json`,
      JSON.stringify(
        {
          revision,
          cases: checked.length,
          asIntended: checked.filter((item) => item.asIntended).length,
          checks: checked,
        },
        null,
        2,
      ),
    )
    expect(
      checked.filter((item) => !item.asIntended),
      'each stand-in case failed for its wrong answer, and the right answers passed',
    ).toEqual([])
  } finally {
    for (const context of Object.values(contexts)) await context.dispose()
    server.close()
  }
})
