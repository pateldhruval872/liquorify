import { isDeepStrictEqual } from 'node:util'
import { type APIRequestContext, expect } from '@playwright/test'

/**
 * The judge for step P7's refusal checks within one store (the platform work
 * item's "P7: refusals within one store"). Each check sends one request as
 * callers who may not make it and as one caller who may, and passes only when
 * all of these hold:
 *
 * - each refused caller gets exactly the answer written for it here, before the
 *   run: its status, its error code and, for a 403, the permission the answer
 *   names. A server error, a success or any other refusal fails;
 * - the allowed caller's request succeeds with its expected status, so a server
 *   that refuses everything cannot pass;
 * - no refused answer carries the protected record's known values, and a read's
 *   allowed answer carries them, so the values looked for are really the
 *   record's;
 * - after a refused write, an allowed caller reads the record back unchanged, or
 *   finds it was not created, and after the allowed write finds it changed, so
 *   the read-back can see a change.
 *
 * Answers are read in memory and never saved: a result keeps the statuses, the
 * codes and each check's outcome. `one-store-checks.spec.ts` shows each part of
 * the judge failing against a stand-in server.
 */

export interface Answer {
  status: number
  code: string | null
  requiredPermission: string | null
}

export const denied = (permission: string | null): Answer => ({
  status: 403,
  code: 'access_denied',
  requiredPermission: permission,
})
export const notFound = (code = 'record_not_found'): Answer => ({
  status: 404,
  code,
  requiredPermission: null,
})
export const unauthenticated: Answer = {
  status: 401,
  code: 'authentication_required',
  requiredPermission: null,
}
/** An answer that is not a refusal: a request that names no record, answered for the caller's own. */
export const ownOnly: Answer = { status: 200, code: null, requiredPermission: null }

export interface Caller {
  name: string
  headers: Record<string, string>
  /** The permission keys `/me` reports, recorded beside each answer. */
  keys?: string[]
}

export interface Probe {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  data?: Record<string, unknown>
}

export interface Sent extends Answer {
  text: string
}

export interface Case {
  gap: 'G-11' | 'G-23' | 'G-32' | 'stand-in'
  area: string
  /** What the case asks, in words, for the record. */
  title: string
  request: Probe
  attempts: { caller: Caller; expected: Answer }[]
  control: { caller: Caller; status: number; request?: Probe }
  /** The protected record's known values: no attempt's answer may carry one. */
  protectedValues?: string[]
  /** Patterns no attempt's answer may match, such as a token's shape. */
  protectedPatterns?: RegExp[]
  /**
   * For a read, more values taken from the allowed answer itself (the records a
   * search found), checked like `protectedValues`. The allowed request is then
   * sent first, which a read allows.
   */
  valuesFromControl?: (body: unknown) => string[]
  /** The allowed answer must carry these: for a read, `protectedValues` unless set. */
  controlCarries?: (string | RegExp)[]
  /** For a write: how an allowed caller reads the record's state. */
  state?: {
    caller: Caller
    request: Probe
    pick?: (sent: { status: number; body: unknown }) => unknown
    /** Set, with the reason, when the allowed write leaves nothing the read-back can see. */
    controlLeavesNoTrace?: string
  }
}

export interface AttemptResult {
  caller: string
  permissionKeys: string[] | null
  expected: Answer
  actual: Answer
  asExpected: boolean
  exposureChecked: number
  exposed: string[]
  unchanged: boolean | null
}

export interface CaseResult {
  gap: Case['gap']
  area: string
  title: string
  request: string
  attempts: AttemptResult[]
  control: {
    caller: string
    permissionKeys: string[] | null
    expectedStatus: number
    status: number
    succeeded: boolean
    carried: boolean | null
    changed: boolean | null
  }
  failures: string[]
  result: 'PASS' | 'FAIL'
}

/**
 * Prefixed ids in a path (`or_98FqgRua4h`), masked so a result names the
 * request and not a record. An id's random part carries a capital or a digit,
 * which keeps names such as `payment_methods` from being taken for one.
 */
export const maskIds = (path: string) =>
  path
    .replace(/(\/|%2F)[a-z]+_(?=[A-Za-z0-9]*[A-Z0-9])[A-Za-z0-9]{6,}(?![A-Za-z0-9_])/g, '$1<id>')
    .replace(/([?&](?:client_id|code_challenge|state)=)[^&]+/g, '$1<value>')

export async function send(api: APIRequestContext, caller: Caller, probe: Probe): Promise<Sent> {
  const res = await api.fetch(probe.path, {
    method: probe.method,
    headers: caller.headers,
    data: probe.data,
    maxRedirects: 0,
  })
  const text = await res.text()
  let body: {
    error?: { code?: string; details?: { required_permission?: string } }
  } | null = null
  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }
  return {
    status: res.status(),
    code: body?.error?.code ?? null,
    requiredPermission: body?.error?.details?.required_permission ?? null,
    text,
  }
}

export const matches = (answer: Answer, expected: Answer) =>
  answer.status === expected.status &&
  answer.code === expected.code &&
  answer.requiredPermission === expected.requiredPermission

/** The values and patterns an answer carries, compared without regard to case. */
export function carried(text: string, values: (string | RegExp)[]) {
  const lower = text.toLowerCase()
  return values.filter((value) =>
    typeof value === 'string'
      ? value !== '' && lower.includes(value.toLowerCase())
      : value.test(text),
  )
}

const parse = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function readState(api: APIRequestContext, state: NonNullable<Case['state']>) {
  const sent = await send(api, state.caller, state.request)
  const read = { status: sent.status, body: parse(sent.text) }
  return state.pick ? state.pick(read) : read
}

const describeAnswer = (answer: Answer) =>
  [answer.status, answer.code, answer.requiredPermission].filter(Boolean).join(' ')

const describe = (value: string | RegExp) =>
  typeof value === 'string' ? 'a known value' : `a match for ${value}`

/** Sends one case and judges it. Never throws for a wrong answer: the result says why. */
export async function runCase(api: APIRequestContext, item: Case): Promise<CaseResult> {
  const failures: string[] = []
  const controlRequest = item.control.request ?? item.request
  const isRead = item.request.method === 'GET'
  let looked: (string | RegExp)[] = [
    ...(item.protectedValues ?? []),
    ...(item.protectedPatterns ?? []),
  ]

  // A read changes nothing, so its allowed request goes first and can name
  // the records its answer holds.
  let controlSent: Sent | null = null
  if (isRead) {
    controlSent = await send(api, item.control.caller, controlRequest)
    if (item.valuesFromControl && controlSent.status === item.control.status) {
      const found = item.valuesFromControl(parse(controlSent.text))
      if (found.length === 0) failures.push('the allowed answer named no record to look for')
      looked = [...looked, ...found]
    }
  }

  const attempts: AttemptResult[] = []
  for (const attempt of item.attempts) {
    const before = item.state ? await readState(api, item.state) : null
    const sent = await send(api, attempt.caller, item.request)
    const actual = {
      status: sent.status,
      code: sent.code,
      requiredPermission: sent.requiredPermission,
    }
    const asExpected = matches(actual, attempt.expected)
    const exposed = carried(sent.text, looked).map(describe)
    const unchanged = item.state
      ? isDeepStrictEqual(before, await readState(api, item.state))
      : null
    if (!asExpected) {
      failures.push(
        `${attempt.caller.name}: answered ${describeAnswer(actual)}, expected ${describeAnswer(attempt.expected)}`,
      )
    }
    if (exposed.length > 0)
      failures.push(`${attempt.caller.name}: the answer carried ${exposed.join(', ')}`)
    if (unchanged === false) failures.push(`${attempt.caller.name}: the record changed`)
    attempts.push({
      caller: attempt.caller.name,
      permissionKeys: attempt.caller.keys ?? null,
      expected: attempt.expected,
      actual,
      asExpected,
      exposureChecked: looked.length,
      exposed,
      unchanged,
    })
  }

  let changed: boolean | null = null
  if (!controlSent) {
    const before = item.state ? await readState(api, item.state) : null
    controlSent = await send(api, item.control.caller, controlRequest)
    if (item.state && !item.state.controlLeavesNoTrace) {
      changed = !isDeepStrictEqual(before, await readState(api, item.state))
      if (!changed)
        failures.push('the allowed write left the record as it was, so the read-back saw no change')
    }
  }
  const succeeded = controlSent.status === item.control.status
  if (!succeeded) {
    failures.push(
      `the allowed caller ${item.control.caller.name} got ${controlSent.status}, expected ${item.control.status}`,
    )
  }
  let carriedAll: boolean | null = null
  if (isRead || item.controlCarries) {
    const wanted = item.controlCarries ?? item.protectedValues ?? []
    carriedAll = carried(controlSent.text, wanted).length === wanted.length
    if (!carriedAll)
      failures.push('the allowed answer did not carry the values the check looks for')
  }

  return {
    gap: item.gap,
    area: item.area,
    title: item.title,
    request: `${item.request.method} ${maskIds(item.request.path)}`,
    attempts,
    control: {
      caller: item.control.caller.name,
      permissionKeys: item.control.caller.keys ?? null,
      expectedStatus: item.control.status,
      status: controlSent.status,
      succeeded,
      carried: carriedAll,
      changed,
    },
    failures,
    result: failures.length === 0 ? 'PASS' : 'FAIL',
  }
}

/** Runs cases in order, so a later case may rely on an earlier one's allowed write. */
export async function runCases(api: APIRequestContext, cases: Case[]) {
  const results: CaseResult[] = []
  for (const item of cases) results.push(await runCase(api, item))
  return results
}

/** A gap's result from its cases' results, as the work item's criterion 8 defines it. */
export function gapResult(results: CaseResult[]) {
  const requests = results.flatMap((item) => item.attempts.length)
  return {
    cases: results.length,
    attempts: requests.reduce((sum, count) => sum + count, 0),
    passed: results.filter((item) => item.result === 'PASS').length,
    failed: results.filter((item) => item.result === 'FAIL').map((item) => item.title),
  }
}

/**
 * The storefront's own server code, reached as a browser reaches it: a page,
 * or one of its server actions, posted with the `Next-Action` id its build
 * gives it. A caller is a request context holding that visitor's cookies.
 */
export interface StorefrontProbe {
  page: string
  action?: { id: string; args: unknown[] }
}

/** What a storefront answer must be: an action's exact result, a redirect, or a page showing these texts. */
export type StorefrontExpected =
  | { result: unknown }
  | { redirectTo: string }
  | { page: number; shows: string[] }
  /** A request that names no record, answered for the caller's own. */
  | { ownResult: true }

export interface StorefrontCase {
  gap: 'G-11' | 'stand-in'
  title: string
  attempts: { caller: string; probe: StorefrontProbe; expected: StorefrontExpected }[]
  control: { caller: string; probe: StorefrontProbe; expected: StorefrontExpected }
  protectedValues: string[]
  /** The record's state, read through the Store API as its own customer. */
  state?: () => Promise<unknown>
}

interface StorefrontSent {
  status: number
  location: string | null
  result: unknown
  text: string
}

/** The value an action answered: the row the payload's first row points to. */
export function actionResult(text: string): unknown {
  const rows = new Map<string, string>()
  for (const line of text.split('\n')) {
    const match = line.match(/^([0-9a-f]+):(.*)$/)
    if (match) rows.set(match[1], match[2])
  }
  const head = rows.get('0')
  const pointer = head ? (JSON.parse(head) as { a?: string }).a : undefined
  const row = pointer?.startsWith('$@') ? rows.get(pointer.slice(2)) : undefined
  return row === undefined ? undefined : JSON.parse(row)
}

export async function sendStorefront(
  api: APIRequestContext,
  probe: StorefrontProbe,
): Promise<StorefrontSent> {
  const res = probe.action
    ? await api.post(probe.page, {
        headers: {
          'Next-Action': probe.action.id,
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: 'text/x-component',
        },
        data: JSON.stringify(probe.action.args),
        maxRedirects: 0,
      })
    : await api.get(probe.page, { maxRedirects: 0 })
  const text = await res.text()
  return {
    status: res.status(),
    location: res.headers().location ?? null,
    result: probe.action && res.status() === 200 ? actionResult(text) : undefined,
    text,
  }
}

/** Whether every key `expected` names holds the same value in `actual`, at any depth. */
export function partlyEqual(actual: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== 'object') return isDeepStrictEqual(actual, expected)
  if (actual === null || typeof actual !== 'object') return false
  return Object.entries(expected).every(([key, value]) =>
    partlyEqual((actual as Record<string, unknown>)[key], value),
  )
}

export function storefrontAsExpected(
  sent: StorefrontSent,
  expected: StorefrontExpected,
  partly = false,
) {
  if ('redirectTo' in expected) return sent.status === 307 && sent.location === expected.redirectTo
  if ('page' in expected)
    return (
      sent.status === expected.page &&
      carried(sent.text, expected.shows).length === expected.shows.length
    )
  if ('ownResult' in expected)
    return sent.status === 200 && sent.result !== undefined && sent.result !== null
  if (sent.status !== 200 || sent.result === undefined) return false
  return partly
    ? partlyEqual(sent.result, expected.result)
    : isDeepStrictEqual(sent.result, expected.result)
}

const describeSent = (sent: StorefrontSent) =>
  sent.status === 307
    ? `a redirect to ${sent.location}`
    : sent.result === undefined
      ? `${sent.status} with no action result`
      : `${sent.status} with ${JSON.stringify(sent.result)?.slice(0, 120)}`

/**
 * Judges a storefront case as `runCase` judges an API one. A refused attempt
 * must give exactly its expected answer; the allowed request's result must
 * hold every key its expectation names.
 */
export async function runStorefrontCase(
  contexts: Record<string, APIRequestContext>,
  item: StorefrontCase,
) {
  const failures: string[] = []
  const attempts = []
  for (const attempt of item.attempts) {
    const before = item.state ? await item.state() : null
    const sent = await sendStorefront(contexts[attempt.caller], attempt.probe)
    const asExpected = storefrontAsExpected(sent, attempt.expected)
    const exposed = carried(sent.text, item.protectedValues).map(describe)
    const unchanged = item.state ? isDeepStrictEqual(before, await item.state()) : null
    if (!asExpected) failures.push(`${attempt.caller}: answered ${describeSent(sent)}`)
    if (exposed.length > 0)
      failures.push(`${attempt.caller}: the answer carried ${exposed.join(', ')}`)
    if (unchanged === false) failures.push(`${attempt.caller}: the record changed`)
    attempts.push({
      caller: attempt.caller,
      page: maskIds(attempt.probe.page),
      action: attempt.probe.action ? 'server action' : null,
      expected: 'result' in attempt.expected ? 'an exact action result' : attempt.expected,
      expectedResult: 'result' in attempt.expected ? attempt.expected.result : undefined,
      status: sent.status,
      redirectedTo: sent.location ? maskIds(sent.location) : null,
      asExpected,
      exposureChecked: item.protectedValues.length,
      exposed,
      unchanged,
    })
  }
  const before = item.state ? await item.state() : null
  const sent = await sendStorefront(contexts[item.control.caller], item.control.probe)
  const succeeded = storefrontAsExpected(sent, item.control.expected, true)
  if (!succeeded)
    failures.push(`the allowed caller ${item.control.caller} got ${describeSent(sent)}`)
  let changed: boolean | null = null
  let carriedAll: boolean | null = null
  if (item.state) {
    changed = !isDeepStrictEqual(before, await item.state())
    if (!changed)
      failures.push('the allowed write left the record as it was, so the read-back saw no change')
  } else {
    carriedAll = carried(sent.text, item.protectedValues).length === item.protectedValues.length
    if (!carriedAll)
      failures.push('the allowed answer did not carry the values the check looks for')
  }
  return {
    gap: item.gap,
    area: 'storefront',
    title: item.title,
    attempts,
    control: {
      caller: item.control.caller,
      page: maskIds(item.control.probe.page),
      status: sent.status,
      succeeded,
      carried: carriedAll,
      changed,
    },
    failures,
    result: failures.length === 0 ? 'PASS' : 'FAIL',
  }
}

/** Signs in to the Admin API and answers the caller, with the keys `/me` reports for the store. */
export async function adminCaller(
  api: APIRequestContext,
  name: string,
  email: string,
  password: string,
  storeId: string,
): Promise<Caller> {
  const res = await api.post('/api/v3/admin/auth/login', { data: { email, password } })
  expect(res.status(), `signing in ${name}`).toBe(200)
  const { token } = (await res.json()) as { token: string }
  const headers = { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': storeId }
  const me = await api.get('/api/v3/admin/me', { headers })
  expect(me.status(), `reading /me for ${name}`).toBe(200)
  const body = (await me.json()) as { permission_keys: string[] }
  return { name, headers, keys: body.permission_keys }
}
