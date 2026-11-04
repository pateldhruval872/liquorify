import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  type Response,
  request,
  test,
} from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { animationsFinished } from './animations'
import {
  acceptancePath,
  admin,
  join,
  openRowMenu,
  PASSWORD,
  pendingInvitation,
  roles,
} from './staff'

/**
 * The multi-store administration batch (CAP-11-12): one teammate who holds the
 * admin role in the browser tests' default store and a role made from the
 * support template in their second store, Winkel, walked through the states
 * the work item lists, in order. Like `screens.spec.ts` it captures each state
 * for a person to review, and like FL-24's test it also asserts what each
 * step shows, since the states follow from one another.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes; the Storybook and the seller panel are not
 * needed. The teammate joins the default store by an invitation accepted
 * through the Admin API, and Winkel by an invitation opened and accepted in
 * the browser with that existing account. Both invitations are made through
 * the Admin API, the dashboard's own path; nothing is written to the database
 * directly. Running it again on the same server first takes the teammate out
 * of Winkel.
 *
 * Every check stays inside the two stores the teammate holds a role in. After
 * the teammate leaves Winkel, only the default store is opened as them.
 * Whether one store's data can be reached from another is FB-03's, and
 * nothing here looks.
 *
 * Captures go to `results/screens/<screen ID>/<state>/<variant>-<theme>.png`,
 * as `screens.spec.ts` writes them, and `results/multi-store/` holds the
 * walkthrough's steps and two side-by-side images of the running store
 * switcher beside its stories' reference images.
 */

const results = new URL('./results/', import.meta.url).pathname
const references = new URL('../visual/__screenshots__/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

const teammate = { email: 'fidelity-two-stores@example.com', first: 'Mona', last: 'Multi' }

const desktop = { width: 1280, height: 960 }
/** The narrowest width that still draws the switcher: the dashboard's phone layout starts below 768 pixels. */
const narrow = { width: 768, height: 960 }
const phone = { width: 390, height: 844 }

interface Stores {
  first: { id: string; name: string }
  second: { id: string; name: string }
}

let baseURL: string
let stores: Stores
let invitationId: string
let roleIds: { admin: string; support: string }
const steps: Record<string, unknown>[] = []

/** The roles each variant holds, as the record states them. */
const holdings = {
  teammate: () => ({
    [stores.first.name]: 'admin',
    [stores.second.name]: { name: roles.support.name, permissions: roles.support.permissions },
  }),
  teammateAfterLeaving: () => ({ [stores.first.name]: 'admin' }),
  admin: () => ({ [stores.first.name]: 'admin', [stores.second.name]: 'admin' }),
  public: () => null,
}

type Variant = keyof typeof holdings

function storeHeaders(headers: Record<string, string>, storeId: string) {
  return { ...headers, 'X-Spree-Store-Id': storeId }
}

async function list<T>(api: APIRequestContext, path: string, headers: Record<string, string>) {
  const res = await api.get(`/api/v3/admin/${path}`, { headers })
  expect(res.ok(), await res.text()).toBeTruthy()
  return ((await res.json()) as { data: T[] }).data
}

async function blockOutside(page: Page): Promise<string[]> {
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

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

/** The page's path with the stores and the invitation named by placeholders, and no query. */
function placeholderPath(page: Page) {
  return new URL(page.url()).pathname
    .replace(stores.first.id, '<store>')
    .replace(stores.second.id, '<second-store>')
    .replace(invitationId, '<invitation>')
}

/**
 * Saves the state in light and then dark, as `screens.spec.ts` names its
 * files. The open menus and dialogs stay open while the colour scheme changes.
 */
async function capture(
  page: Page,
  screen: string,
  state: string,
  variant: Variant,
  outside: string[],
  checked: string,
  /** The main navigation's links, where the step records what it shows. */
  shown?: Record<string, string[]>,
  /** The statuses of the page's own API requests, where the step records them. */
  answered?: { path: string; status: number }[],
) {
  const folder = `${results}screens/${screen}/${state}/`
  mkdirSync(folder, { recursive: true })
  const settled = await settle(page)
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.waitForTimeout(400)
    await animationsFinished(page)
    await page.screenshot({ path: `${folder}${variant}-${theme}.png` })
    writeFileSync(
      `${folder}${variant}-${theme}.json`,
      `${JSON.stringify(
        {
          screen,
          state,
          variant,
          role: holdings[variant](),
          theme,
          revision,
          path: placeholderPath(page),
          viewport: page.viewportSize(),
          intercepted: null,
          settled,
          checked,
          navigation: shown ?? null,
          answered: answered ?? null,
          outside,
        },
        null,
        2,
      )}\n`,
    )
  }
  steps.push({
    screen,
    state,
    variant,
    path: placeholderPath(page),
    checked,
    navigation: shown ?? null,
    answered: answered ?? null,
    settled,
  })
}

/** The running component beside its story's reference image, for the review. */
async function besideReference(page: Page, name: string, story: string, browser: Browser) {
  const folder = `${results}multi-store/`
  mkdirSync(folder, { recursive: true })
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.waitForTimeout(400)
    await animationsFinished(page)
    const screen = await page.screenshot()
    const reference = readFileSync(`${references}${story}/${theme}.png`)
    const image = (buffer: Buffer) => `data:image/png;base64,${buffer.toString('base64')}`
    const sheet = await browser.newPage()
    try {
      await sheet.setContent(`
        <body style="margin:0;font:14px sans-serif;display:flex;gap:16px;padding:16px;background:#ddd;width:max-content">
          <figure style="margin:0"><figcaption>Running screen</figcaption><img src="${image(screen)}"></figure>
          <figure style="margin:0"><figcaption>Story's reference image: ${story}</figcaption><img src="${image(reference)}"></figure>
        </body>`)
      await sheet.screenshot({ path: `${folder}${name}-${theme}-side-by-side.png`, fullPage: true })
    } finally {
      await sheet.close()
    }
  }
}

const switcher = (page: Page) => page.getByRole('button', { name: 'Switch store' })
const storeHeader = (page: Page) => page.locator('[data-sidebar="header"]').first()
const productsLink = (page: Page) => page.getByRole('link', { name: /^Products/ })
const ordersLink = (page: Page) => page.getByRole('link', { name: /^Orders/ })
const staffRow = (page: Page) => page.getByRole('row').filter({ hasText: teammate.email })

/** The names of the main navigation's links, in order. */
async function navigation(page: Page) {
  await expect(page.locator('[data-sidebar="content"] [data-slot="skeleton"]')).toHaveCount(0, {
    timeout: 15_000,
  })
  const names = await page.locator('[data-sidebar="content"] a').allInnerTexts()
  return names.map((name) => name.split('\n')[0].trim())
}

/** What each role's navigation holds when its store is opened fresh, as the staff access batch saw them. */
const adminNavigation = [
  'Getting Started',
  'Home',
  'Orders',
  'Products',
  'Inventory',
  'Customers',
  'Sellers',
  'Loyalty',
  'Promotions',
  'Reports',
]
const supportNavigation = ['Home', 'Orders', 'Customers']

/** Signs the teammate in through the API, as the browser tests do, and waits for the first store. */
async function signInTeammate(page: Page) {
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammate.email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
}

async function openStaff(page: Page, storeId: string) {
  await page.goto(`/${storeId}/settings/staff`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Staff', exact: true })).toBeVisible({
    timeout: 15_000,
  })
}

test.use({ viewport: desktop })

/**
 * The teammate joins the default store with the admin role, the support
 * template's role exists in Winkel, and an invitation to Winkel with that
 * role waits for them. A run on the same server first takes the teammate out
 * of Winkel, so it starts from the same place.
 */
test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  const creds = getCredentials()
  stores = {
    first: { id: creds.store_id, name: creds.store_name },
    second: { id: creds.comma_store_id, name: 'Winkel' },
  }
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const first = storeHeaders(headers, stores.first.id)
    const second = storeHeaders(headers, stores.second.id)

    const firstRoles = await list<{ id: string; name: string }>(api, 'roles?limit=100', first)
    const adminRole = firstRoles.find((role) => role.name === 'admin')
    expect(adminRole, "the default store's admin role").toBeTruthy()

    const secondRoles = await list<{ id: string; name: string }>(api, 'roles?limit=100', second)
    let supportRole = secondRoles.find((role) => role.name === roles.support.name)
    if (!supportRole) {
      const created = await api.post('/api/v3/admin/roles', {
        headers: second,
        data: { name: roles.support.name, permissions: roles.support.permissions },
      })
      expect(created.status(), await created.text()).toBe(201)
      supportRole = (await created.json()) as { id: string; name: string }
    }
    roleIds = { admin: (adminRole as { id: string }).id, support: supportRole.id }

    await join(api, first, baseURL, teammate, roleIds.admin)

    const inSecond = (
      await list<{ id: string; email: string }>(api, 'admin_users?limit=100', second)
    ).find((member) => member.email === teammate.email)
    if (inSecond) {
      const res = await api.delete(`/api/v3/admin/admin_users/${inSecond.id}`, { headers: second })
      expect(res.ok(), await res.text()).toBeTruthy()
    }
    invitationId = await pendingInvitation(api, second, teammate.email, roleIds.support)
  } finally {
    await api.dispose()
  }
})

test.afterAll(() => {
  mkdirSync(`${results}multi-store/`, { recursive: true })
  writeFileSync(
    `${results}multi-store/steps.json`,
    `${JSON.stringify(
      {
        revision,
        teammate: { email: teammate.email, roles: stores ? holdings.teammate() : null },
        stores: stores
          ? { '<store>': stores.first.name, '<second-store>': stores.second.name }
          : null,
        steps,
      },
      null,
      2,
    )}\n`,
  )
})

test.describe.configure({ mode: 'serial' })

test('the teammate accepts the invitation to their second store with their existing account', async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: desktop })
  const page = await context.newPage()
  try {
    const outside = await blockOutside(page)
    const api = await request.newContext({ baseURL })
    let path: string
    try {
      const { headers } = await admin(api)
      path = await acceptancePath(api, storeHeaders(headers, stores.second.id), invitationId)
    } finally {
      await api.dispose()
    }
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: `Join ${stores.second.name}` })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(roles.support.name, { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign in & accept$/i })).toBeVisible()
    await expect(page.locator('#first_name')).toHaveCount(0)
    await capture(
      page,
      'DA-AUTH-04',
      'existing-account-second-store',
      'public',
      outside,
      `The heading names ${stores.second.name}, the text names the ${roles.support.name} role, and the form asks only for the existing account's password`,
    )

    await page.locator('#password').fill(PASSWORD)
    await page.getByRole('button', { name: /^sign in & accept$/i }).click()
    await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`), { timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await expect(switcher(page)).toContainText(stores.first.name)
    await capture(
      page,
      'DA-AUTH-04',
      'accepted-second-store',
      'teammate',
      outside,
      `Accepting signs the teammate in and opens ${stores.first.name}, the first of their stores by name, not ${stores.second.name}, the store just joined`,
    )
  } finally {
    await context.close()
  }
})

test('the teammate signs in and opens the first store they hold a role in', async ({ page }) => {
  const outside = await blockOutside(page)
  await page.goto('/login')
  await page.locator('#email').fill(teammate.email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toContainText(stores.first.name)
  await expect(productsLink(page)).toBeVisible()
  await capture(
    page,
    'DA-SHELL-01',
    'opens-first-of-two-stores',
    'teammate',
    outside,
    `Signing in through the form opens ${stores.first.name}, the first of the teammate's two stores by name, with the admin role's navigation`,
  )
})

test('the store switcher lists both stores, and what each store shows after a switch', async ({
  page,
  browser,
}) => {
  const outside = await blockOutside(page)
  await signInTeammate(page)
  expect(await navigation(page)).toEqual(adminNavigation)

  await switcher(page).click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveText([stores.first.name, stores.second.name])
  await expect(menu.getByRole('menuitem', { name: stores.first.name }).locator('svg')).toHaveCount(
    1,
  )
  await expect(menu.getByRole('menuitem', { name: stores.second.name }).locator('svg')).toHaveCount(
    0,
  )
  await capture(
    page,
    'DA-OVL-01',
    'switcher-two-stores-open',
    'teammate',
    outside,
    `The switcher lists ${stores.first.name} and ${stores.second.name}, in that order, with ${stores.first.name} ticked`,
  )
  await besideReference(page, 'switcher-open', 'dashboard-core-shell-store-switcher--open', browser)

  // Switched in the page, without a reload: what the navigation shows is
  // recorded, not asserted, because it is not the second store's role (SD-18).
  await menu.getByRole('menuitem', { name: stores.second.name }).click()
  await expect(page).toHaveURL(new RegExp(`/${stores.second.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toContainText(stores.second.name)
  const afterSwitch = await navigation(page)
  await page.waitForTimeout(10_000)
  const tenSecondsLater = await navigation(page)
  await capture(
    page,
    'DA-OVL-01',
    'second-store-after-switching',
    'teammate',
    outside,
    `Switched to ${stores.second.name} from the switcher, without a reload. The navigation is recorded as shown, straight after the switch and ten seconds later`,
    { afterSwitch, tenSecondsLater },
  )

  // The statuses of the page's own requests for products, observed only to
  // describe what the screen shows; no request is made for the check.
  const answered: { path: string; status: number }[] = []
  const observe = (response: Response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/v3/admin/products')) {
      answered.push({ path: url.pathname, status: response.status() })
    }
  }
  page.on('response', observe)
  await productsLink(page).click()
  await page.waitForLoadState('networkidle')
  page.off('response', observe)
  await capture(
    page,
    'DA-OVL-01',
    'second-store-products-link-after-switching',
    'teammate',
    outside,
    `The Products link the navigation shows after the switch, followed in ${stores.second.name}, whose ${roles.support.name} role does not read products. The statuses of the page's own product requests are recorded`,
    undefined,
    answered,
  )

  await page.goto(`/${stores.second.id}`)
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toContainText(stores.second.name)
  await expect(ordersLink(page)).toBeVisible()
  await expect(productsLink(page)).toHaveCount(0)
  expect(await navigation(page)).toEqual(supportNavigation)
  await capture(
    page,
    'DA-OVL-01',
    'second-store-support-navigation',
    'teammate',
    outside,
    `${stores.second.name} opened by its address: the navigation is the ${roles.support.name} role's, with Orders and no Products`,
  )

  await page.goto(`/${stores.second.id}/settings`)
  await page.waitForLoadState('networkidle')
  await capture(
    page,
    'DA-OVL-01',
    'second-store-support-settings-navigation',
    'teammate',
    outside,
    `The settings navigation of the ${roles.support.name} role in ${stores.second.name}, opened by its address`,
  )

  await page.goto(`/${stores.second.id}`)
  await page.waitForLoadState('networkidle')
  await switcher(page).click()
  await expect(
    page.getByRole('menu').getByRole('menuitem', { name: stores.second.name }).locator('svg'),
  ).toHaveCount(1)
  await page.getByRole('menu').getByRole('menuitem', { name: stores.first.name }).click()
  await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toContainText(stores.first.name)
  await capture(
    page,
    'DA-OVL-01',
    'first-store-after-switching-back',
    'teammate',
    outside,
    `Switched back to ${stores.first.name} from the switcher, without a reload. The navigation is recorded as shown`,
    { afterSwitch: await navigation(page) },
  )

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(productsLink(page)).toBeVisible()
  expect(await navigation(page)).toEqual(adminNavigation)
  await capture(
    page,
    'DA-OVL-01',
    'first-store-admin-navigation',
    'teammate',
    outside,
    `${stores.first.name} after a reload: the navigation is the admin role's, with Products and Orders`,
  )
})

test('the switcher on a narrow screen and on a phone', async ({ page }) => {
  const outside = await blockOutside(page)
  await page.setViewportSize(narrow)
  await signInTeammate(page)
  await switcher(page).click()
  await expect(page.getByRole('menu').getByRole('menuitem')).toHaveText([
    stores.first.name,
    stores.second.name,
  ])
  await capture(
    page,
    'DA-OVL-01',
    'switcher-two-stores-open-narrow',
    'teammate',
    outside,
    'At 768 pixels, the narrowest width that draws the switcher, it opens with both stores',
  )
  await page.keyboard.press('Escape')

  await page.setViewportSize(phone)
  await page.goto(`/${stores.first.id}`)
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toBeHidden()
  await capture(
    page,
    'DA-OVL-01',
    'phone-two-stores',
    'teammate',
    outside,
    'On a phone the top bar names the store, and no switcher is drawn',
  )
  await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click()
  await expect(page.locator('[data-mobile="true"][data-sidebar="sidebar"]')).toBeVisible()
  await expect(switcher(page)).toBeHidden()
  await capture(
    page,
    'DA-OVL-01',
    'phone-two-stores-drawer-open',
    'teammate',
    outside,
    'With the navigation drawer open on a phone, the drawer has no switcher either, so a teammate in two stores has no control to change store',
  )
})

test('the teammate is listed in each store with that store’s role, and removed from the second', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await login(page)

  await openStaff(page, stores.first.id)
  await expect(staffRow(page)).toBeVisible({ timeout: 15_000 })
  await expect(staffRow(page)).toContainText('admin')
  await capture(
    page,
    'DA-SET-24',
    'teammate-in-two-stores-first-store',
    'admin',
    outside,
    `${stores.first.name}'s staff list shows the teammate with the admin role`,
  )

  await openStaff(page, stores.second.id)
  await expect(staffRow(page)).toBeVisible({ timeout: 15_000 })
  await expect(staffRow(page)).toContainText(roles.support.name)
  await expect(staffRow(page)).not.toContainText('admin')
  await capture(
    page,
    'DA-SET-24',
    'teammate-in-two-stores-second-store',
    'admin',
    outside,
    `${stores.second.name}'s staff list shows the same teammate with the ${roles.support.name} role only`,
  )

  await openRowMenu(page, teammate.email)
  await page.getByRole('menuitem', { name: /remove from staff/i }).click()
  await expect(page.getByRole('heading', { name: /remove from store\?/i })).toBeVisible()
  await capture(
    page,
    'DA-SET-24',
    'remove-from-second-store-confirmation',
    'admin',
    outside,
    `Removing the teammate from ${stores.second.name} asks for confirmation first`,
  )
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^remove$/i })
    .click()
  await expect(staffRow(page)).toHaveCount(0, { timeout: 15_000 })
  await capture(
    page,
    'DA-SET-24',
    'removed-from-second-store',
    'admin',
    outside,
    `Once confirmed, the teammate is no longer in ${stores.second.name}'s staff list`,
  )

  await openStaff(page, stores.first.id)
  await expect(staffRow(page)).toBeVisible({ timeout: 15_000 })
  await expect(staffRow(page)).toContainText('admin')
  await capture(
    page,
    'DA-SET-24',
    'still-in-first-store-after-removal',
    'admin',
    outside,
    `${stores.first.name}'s staff list still shows the teammate with the admin role`,
  )
})

test('with a role in one store only, the switcher is gone', async ({ page, browser }) => {
  const outside = await blockOutside(page)
  await signInTeammate(page)
  await expect(switcher(page)).toHaveCount(0)
  await expect(storeHeader(page)).toContainText(stores.first.name)
  await expect(productsLink(page)).toBeVisible()
  await capture(
    page,
    'DA-OVL-01',
    'switcher-gone-one-store',
    'teammateAfterLeaving',
    outside,
    `After leaving ${stores.second.name}, the teammate signs in to ${stores.first.name}, whose name is a label with no switcher`,
  )
  await besideReference(
    page,
    'switcher-gone',
    'dashboard-core-shell-store-switcher--one-store',
    browser,
  )
})
