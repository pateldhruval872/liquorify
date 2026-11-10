import { mkdirSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  type Route,
  request,
  test,
} from '@playwright/test'
import { animationsFinished } from './animations'
import { admin } from './staff'

/**
 * What the platform batch's step P9 and P11 scripts share: where each writes
 * its results, the run's stamp and revision, blocking requests that would
 * leave the local servers, and the sabotaged run that shows each test failing
 * when what it checks does not happen.
 *
 * With `P9_SABOTAGE=1` (or `P11_SABOTAGE=1`), each test marks itself as
 * expected to fail and makes the browser undo the change it then looks for.
 * The run passes only if every test fails, and each failure is read to check
 * it came from the assertion that checks that change.
 */

export const sabotaged =
  process.env.P9_SABOTAGE === '1' ||
  process.env.P11_SABOTAGE === '1' ||
  process.env.P13_SABOTAGE === '1'
export const revision = process.env.FIDELITY_REVISION ?? null
export const stamp =
  process.env.P9_STAMP ?? process.env.P11_STAMP ?? process.env.P13_STAMP ?? Date.now().toString(36)

export type Steps = Record<string, unknown>[]
export type Headers = Record<string, string>

/** The folder a P9 or P11 script writes to, apart for a sabotaged run. */
export const resultsFor = (part: string, step = 'p9') =>
  new URL(`./results/${step}/${sabotaged ? `${part}-checks` : part}/`, import.meta.url).pathname

/** Blocks and records every request to a host other than the local servers. */
export async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

/** A screenshot and a JSON file of what each step showed, for one test. */
export function recorder(part: string, step = 'p9') {
  const results = resultsFor(part, step)
  const snap = async (page: Page, name: string, options: { mask?: string } = {}) => {
    mkdirSync(results, { recursive: true })
    // Some states keep an animation running, such as a toast held beneath a
    // sheet; after ten seconds the screenshot is taken with animations stopped.
    await Promise.race([
      animationsFinished(page),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ])
    await page.screenshot({
      path: `${results}${name}.png`,
      animations: 'disabled',
      ...(options.mask && { mask: [page.locator(options.mask)], maskColor: '#7f7f7f' }),
    })
  }
  const save = async (
    page: Page,
    name: string,
    steps: Steps,
    outside: string[],
    options: { mask?: string } = {},
  ) => {
    await snap(page, name, options)
    writeFileSync(
      `${results}${name}.json`,
      `${JSON.stringify({ test: name, revision, stamp, sabotaged, steps, outside }, null, 2)}\n`,
    )
  }
  return { snap, save }
}

/**
 * In a sabotaged run, marks the test as expected to fail and hands each
 * matching request to `undo`, which sends it without the change the test then
 * looks for.
 */
export async function sabotage(
  page: Page,
  method: string,
  path: RegExp,
  undo: (route: Route) => Promise<unknown>,
) {
  expectFailureWhenSabotaged()
  if (!sabotaged) return
  await page.route(
    (url) => path.test(url.pathname),
    (route) => (route.request().method() === method ? undo(route) : route.fallback()),
  )
}

/** Marks a test whose sabotage is not a request as expected to fail in a sabotaged run. */
export function expectFailureWhenSabotaged() {
  test.fail(sabotaged, 'Sabotaged: the change this test looks for is undone in the browser')
}

/** Sends a JSON request on with `edit` applied to its body. */
export const withBody =
  (edit: (body: Record<string, unknown>) => Record<string, unknown>) => (route: Route) =>
    route.continue({ postData: JSON.stringify(edit(route.request().postDataJSON() ?? {})) })

/** Answers a request with an empty success, so it never reaches the server. */
export const answeredEmpty = (route: Route) => route.fulfill({ status: 204, body: '' })

export async function openIn(page: Page, storeId: string, path = '') {
  await page.goto(`/${storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

export async function reload(page: Page) {
  await page.reload()
  await page.waitForLoadState('networkidle')
}

export async function json<T>(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as T
}

/** Lists up to 100 records of an Admin API path. */
export async function list<T>(api: APIRequestContext, headers: Headers, path: string) {
  const res = await api.get(`/api/v3/admin/${path}${path.includes('?') ? '&' : '?'}limit=100`, {
    headers,
  })
  return (await json<{ data: T[] }>(res)).data
}

/**
 * Whether an element is what a person sees at its own centre: the topmost
 * element there is it or inside it. Playwright's visibility check does not
 * look at what is drawn above an element, so a message beneath an overlay
 * passes it.
 */
export const onTop = (page: Page, selectorText: string) =>
  page
    .getByText(selectorText)
    .first()
    .evaluate((element) => {
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) return false
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return !!top && (top === element || element.contains(top))
    })

/** The Admin API as the browser tests' admin, for the records a test opens first. */
export async function seeded<T>(baseURL: string | undefined, work: (seed: Seed) => Promise<T>) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const call = async <R>(method: string, path: string, data?: object) => {
      const res = await api.fetch(`/api/v3/admin/${path}`, { method, headers, data })
      const text = await res.text()
      expect(res.ok(), `${method} ${path}: ${text}`).toBeTruthy()
      return (text ? JSON.parse(text) : undefined) as R
    }
    return await work({
      api,
      headers,
      get: (path) => call('GET', path),
      post: (path, data) => call('POST', path, data ?? {}),
      patch: (path, data) => call('PATCH', path, data ?? {}),
    })
  } finally {
    await api.dispose()
  }
}

export interface Seed {
  api: APIRequestContext
  headers: Headers
  get: <R>(path: string) => Promise<R>
  post: <R>(path: string, data?: object) => Promise<R>
  patch: <R>(path: string, data?: object) => Promise<R>
}

export const toast = (page: Page, text: string | RegExp) =>
  page.getByRole('region', { name: 'Notifications' }).getByText(text).first()

export const confirmation = (page: Page) =>
  page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Picks a day some months ahead, at a time, in a date field. */
export async function pickDate(
  page: Page,
  trigger: Locator,
  monthsAhead: number,
  day: string,
  time: string,
) {
  await trigger.click()
  const calendar = page.getByRole('dialog')
  for (let month = 0; month < monthsAhead; month++)
    await calendar.getByRole('button', { name: /next month/i }).click()
  await calendar
    .getByRole('gridcell')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first()
    .click()
  await calendar.locator('input[type="time"]').fill(time)
  await page.keyboard.press('Escape')
  await expect(calendar).toBeHidden()
}
