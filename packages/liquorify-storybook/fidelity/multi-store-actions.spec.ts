import { expect, type Page, request, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import {
  blockOutside,
  expectFailureWhenSabotaged,
  type Headers,
  list,
  recorder,
  reload,
  type Steps,
  sabotage,
  sabotaged,
  stamp,
  withBody,
} from './p9'
import { acceptancePath, admin, join, PASSWORD, pendingInvitation, roles } from './staff'
import { adminNavigation, navigation, openStaff, supportNavigation, switcher } from './stores'

/**
 * The platform batch's step P9, G-72: batch 15's multi-store actions as
 * browser tests. A teammate holds the admin role in the browser tests' default
 * store and a role made from the support template in their second store,
 * Winkel. The tests join the second store with an existing account, show the
 * teammate working in both, and switch between them. Each asserts what the
 * screen shows and, after a reload, what was kept.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes. Each worker adds two teammates of its own,
 * named with the run's stamp, by inviting them through the Admin API and
 * accepting as the invitation page does: one who holds the admin role in the
 * default store with an invitation to Winkel waiting, and one who already
 * holds both roles. Nothing is written to the database directly. With
 * `P9_SABOTAGE=1` each test undoes the change it looks for (see p9.ts).
 *
 * The switching tests fail on SD-18 while it stands: after a switch in the
 * page the navigation keeps the previous store's role until a reload. That
 * check is soft, so each test still checks, and records, the switch itself and
 * what a reload shows.
 *
 * Every check stays inside the two stores the teammates hold a role in.
 * Whether one store's data can be reached from another is FB-03's, and nothing
 * here looks.
 */

const { snap, save } = recorder('multi-store')

const person = (key: string, first: string) => ({
  email: `p9-${key}-${stamp}@example.com`,
  first,
  last: `P9 ${stamp}`,
})
/** Holds the admin role in the default store, with an invitation to Winkel waiting. */
const joiner = person('joins', 'Jo')
/** Holds the admin role in the default store and the support role in Winkel. */
const member = person('two-stores', 'Mo')

interface Stores {
  first: { id: string; name: string }
  second: { id: string; name: string }
}

let stores: Stores
let invitationId: string

const inStore = (headers: Headers, storeId: string) => ({ ...headers, 'X-Spree-Store-Id': storeId })

/** Accepts an invitation through the Admin API as an account that already exists, with its password. */
async function acceptAsExisting(baseURL: string, path: string) {
  const url = new URL(path, 'http://localhost')
  const id = url.pathname.split('/').filter(Boolean).at(-1)
  const invitee = await request.newContext({ baseURL })
  try {
    const accepted = await invitee.post(`/api/v3/admin/auth/invitations/${id}/accept`, {
      data: { token: url.searchParams.get('token'), password: PASSWORD },
    })
    expect(accepted.ok(), await accepted.text()).toBeTruthy()
  } finally {
    await invitee.dispose()
  }
}

test.beforeAll(async ({ baseURL }) => {
  const creds = getCredentials()
  stores = {
    first: { id: creds.store_id, name: creds.store_name },
    second: { id: creds.comma_store_id, name: 'Winkel' },
  }
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const first = inStore(headers, stores.first.id)
    const second = inStore(headers, stores.second.id)

    const adminRole = (await list<{ id: string; name: string }>(api, first, 'roles')).find(
      (role) => role.name === 'admin',
    )
    expect(adminRole, "the default store's admin role").toBeTruthy()
    let supportRole = (await list<{ id: string; name: string }>(api, second, 'roles')).find(
      (role) => role.name === roles.support.name,
    )
    if (!supportRole) {
      const created = await api.post('/api/v3/admin/roles', {
        headers: second,
        data: { name: roles.support.name, permissions: roles.support.permissions },
      })
      expect(created.status(), await created.text()).toBe(201)
      supportRole = (await created.json()) as { id: string; name: string }
    }

    for (const teammate of [joiner, member])
      await join(api, first, baseURL ?? '', teammate, (adminRole as { id: string }).id)
    invitationId = await pendingInvitation(api, second, joiner.email, supportRole.id)
    const memberInvitation = await pendingInvitation(api, second, member.email, supportRole.id)
    await acceptAsExisting(baseURL ?? '', await acceptancePath(api, second, memberInvitation))
  } finally {
    await api.dispose()
  }
})

async function signIn(page: Page, teammate: typeof member) {
  await page.goto('/login')
  await page.locator('#email').fill(teammate.email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
}

const storeMenu = (page: Page) => page.getByRole('menu')
const staffRow = (page: Page, email: string) => page.getByRole('row').filter({ hasText: email })

async function switchTo(page: Page, store: { id: string; name: string }) {
  await switcher(page).click()
  await storeMenu(page).getByRole('menuitem', { name: store.name }).click()
  await expect(page).toHaveURL(new RegExp(`/${store.id}(/|$)`), { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await expect(switcher(page)).toContainText(store.name)
}

/** In a sabotaged run, a choice in the store switcher goes nowhere. */
async function switchGoesNowhere(page: Page) {
  expectFailureWhenSabotaged()
  if (!sabotaged) return
  await page.addInitScript(() => {
    for (const type of ['pointerup', 'mouseup', 'click'])
      document.addEventListener(
        type,
        (event) => {
          if ((event.target as Element | null)?.closest('[role="menuitem"]')) {
            event.preventDefault()
            event.stopImmediatePropagation()
          }
        },
        true,
      )
  })
}

/** The store names as the record writes them, so no store id is written down. */
const named = (path: string) =>
  path.replace(stores.first.id, '<store>').replace(stores.second.id, '<Winkel>')

test.describe('multi-store administration (P9, G-72)', () => {
  test('joining a second store with an existing account', async ({ browser, baseURL }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      const outside = await blockOutside(page)
      await sabotage(
        page,
        'POST',
        /^\/api\/v3\/admin\/auth\/invitations\/[^/]+\/accept$/,
        withBody((body) => ({ ...body, password: `${PASSWORD}-not` })),
      )
      const api = await request.newContext({ baseURL })
      let path: string
      try {
        const { headers } = await admin(api)
        path = await acceptancePath(api, inStore(headers, stores.second.id), invitationId)
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
      const steps: Steps = [
        {
          step: 'opened the invitation signed out',
          heading: `Join ${stores.second.name}`,
          fields: await page
            .locator('form input')
            .evaluateAll((inputs) => inputs.map((input) => input.getAttribute('id'))),
        },
      ]
      await snap(page, 'joined-second-store-invitation')

      await page.locator('#password').fill(PASSWORD)
      await page.getByRole('button', { name: /^sign in & accept$/i }).click()
      await expect(page).toHaveURL(new RegExp(`/(${stores.first.id}|${stores.second.id})(/|$)`), {
        timeout: 15_000,
      })
      await page.waitForLoadState('networkidle')
      steps.push({
        step: 'entered the password and accepted',
        opened: named(new URL(page.url()).pathname),
      })

      await reload(page)
      await switcher(page).click()
      await expect(storeMenu(page).getByRole('menuitem')).toHaveText([
        stores.first.name,
        stores.second.name,
      ])
      steps.push({ step: 'reloaded; the switcher lists both stores' })
      await save(page, 'joined-second-store', steps, outside)
    } finally {
      await context.close()
    }

    const staff = await browser.newContext()
    const adminPage = await staff.newPage()
    try {
      const outside = await blockOutside(adminPage)
      await login(adminPage)
      await openStaff(adminPage, stores.second.id)
      await reload(adminPage)
      await expect(staffRow(adminPage, joiner.email)).toContainText(roles.support.name, {
        timeout: 15_000,
      })
      await expect(staffRow(adminPage, joiner.email)).not.toContainText('admin')
      await save(
        adminPage,
        'joined-second-store-staff-list',
        [
          {
            step: `as the store's admin, opened ${stores.second.name}'s staff list and reloaded`,
            listed: (await staffRow(adminPage, joiner.email).innerText()).replace(/\s+/g, ' '),
          },
        ],
        outside,
      )
    } finally {
      await staff.close()
    }
  })

  test('a teammate works in two stores, each with its own role', async ({ page, browser }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    // Sabotaged: every answer that tells the page who is signed in leaves the
    // second store out of the teammate's stores.
    if (sabotaged)
      await page.route(
        (url) =>
          ['/api/v3/admin/auth/login', '/api/v3/admin/auth/refresh', '/api/v3/admin/me'].includes(
            url.pathname,
          ),
        async (route) => {
          const response = await route.fetch()
          const body = await response.json()
          if (body.user?.stores)
            body.user.stores = body.user.stores.filter(
              (store: { id: string }) => store.id !== stores.second.id,
            )
          await route.fulfill({ response, json: body })
        },
      )
    await signIn(page, member)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(adminNavigation)
    await expect(switcher(page)).toBeVisible()
    await switcher(page).click()
    await expect(storeMenu(page).getByRole('menuitem')).toHaveText([
      stores.first.name,
      stores.second.name,
    ])
    await snap(page, 'two-stores-own-roles-switcher')
    await page.keyboard.press('Escape')
    const steps: Steps = [
      { step: `signed in; ${stores.first.name} opens with the admin role's navigation` },
      { step: 'the switcher lists both stores' },
    ]

    await page.goto(`/${stores.second.id}`)
    await page.waitForLoadState('networkidle')
    await expect(switcher(page)).toContainText(stores.second.name)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(supportNavigation)
    await reload(page)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(supportNavigation)
    steps.push({
      step: `opened ${stores.second.name} by its address, then reloaded`,
      navigation: await navigation(page),
    })
    await save(page, 'two-stores-own-roles', steps, outside)

    const staff = await browser.newContext()
    const adminPage = await staff.newPage()
    try {
      const adminOutside = await blockOutside(adminPage)
      await login(adminPage)
      const listed: Record<string, string> = {}
      for (const [store, role] of [
        [stores.first, 'admin'],
        [stores.second, roles.support.name],
      ] as const) {
        await openStaff(adminPage, store.id)
        await expect(staffRow(adminPage, member.email)).toContainText(role, { timeout: 15_000 })
        if (store === stores.second)
          await expect(staffRow(adminPage, member.email)).not.toContainText('admin')
        listed[store.name] = (await staffRow(adminPage, member.email).innerText()).replace(
          /\s+/g,
          ' ',
        )
        if (store === stores.first) await snap(adminPage, 'two-stores-own-roles-first-staff-list')
      }
      await save(
        adminPage,
        'two-stores-own-roles-second-staff-list',
        [{ step: "as the store's admin, opened each store's staff list", listed }],
        adminOutside,
      )
    } finally {
      await staff.close()
    }
  })

  test('switching from the first store to the second', async ({ page }) => {
    const outside = await blockOutside(page)
    await switchGoesNowhere(page)
    await signIn(page, member)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(adminNavigation)
    const steps: Steps = [
      { step: `signed in to ${stores.first.name}`, navigation: adminNavigation },
    ]

    await switchTo(page, stores.second)
    // SD-18: the navigation stays the first store's role until a reload.
    await expect.soft
      .poll(() => navigation(page), {
        message: `the ${roles.support.name} role's navigation within 15 seconds of the switch`,
        timeout: 15_000,
      })
      .toEqual(supportNavigation)
    steps.push({
      step: `chose ${stores.second.name} in the switcher`,
      navigation: await navigation(page),
    })
    await snap(page, 'switched-to-second-store-navigation')

    await reload(page)
    await expect(page).toHaveURL(new RegExp(`/${stores.second.id}(/|$)`))
    await expect(switcher(page)).toContainText(stores.second.name)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(supportNavigation)
    steps.push({
      step: `reloaded; still in ${stores.second.name}, with its role's navigation`,
      navigation: await navigation(page),
    })
    await save(page, 'switched-to-second-store', steps, outside)
  })

  test('switching back from the second store to the first', async ({ page }) => {
    const outside = await blockOutside(page)
    await switchGoesNowhere(page)
    await signIn(page, member)
    await page.goto(`/${stores.second.id}`)
    await page.waitForLoadState('networkidle')
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(supportNavigation)
    const steps: Steps = [
      { step: `opened ${stores.second.name} by its address`, navigation: supportNavigation },
    ]

    await switchTo(page, stores.first)
    // SD-18: the navigation stays the second store's role until a reload.
    await expect.soft
      .poll(() => navigation(page), {
        message: "the admin role's navigation within 15 seconds of the switch",
        timeout: 15_000,
      })
      .toEqual(adminNavigation)
    steps.push({
      step: `chose ${stores.first.name} in the switcher`,
      navigation: await navigation(page),
    })
    await snap(page, 'switched-to-first-store-navigation')

    await reload(page)
    await expect(page).toHaveURL(new RegExp(`/${stores.first.id}(/|$)`))
    await expect(switcher(page)).toContainText(stores.first.name)
    await expect.poll(() => navigation(page), { timeout: 15_000 }).toEqual(adminNavigation)
    steps.push({
      step: `reloaded; still in ${stores.first.name}, with its role's navigation`,
      navigation: await navigation(page),
    })
    await save(page, 'switched-to-first-store', steps, outside)
  })
})
