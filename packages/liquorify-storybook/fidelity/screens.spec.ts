import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { getCredentials, login, rowButton } from '../../dashboard/e2e/helpers'
import { releaseNotes, updateAvailable } from '../src/fixtures/admin/shell'
import {
  agent,
  type Developers,
  disabledReason,
  endpoints,
  gateway,
  origins,
  paintOut,
  pkce,
  removeNamed,
  secretKeys,
  seedDevelopers,
  setGateway,
  setRelay,
} from './developers'
import { inactiveChannel, retiredExemptionReason, seedSettings, setStoreName } from './settings'
import {
  admin,
  currentAcceptancePath,
  openRoleMenu,
  openRowMenu,
  PASSWORD,
  pendingEmail,
  removed,
  roleChange,
  roleRow,
  roles,
  type Seeded,
  seed,
  teammates,
} from './staff'

/**
 * Captures Spree's running screens in each meaningful state and permission
 * variant a batch maps (LIQ-010 §12.1, step 4). Like `compare.spec.ts`, it
 * gathers evidence for a person to review and passes whenever it can capture a
 * screen; it compares nothing.
 *
 * Start the screens as `compare.spec.ts` describes. Before the first capture it
 * adds the staff and roles the variants need (`staff.ts`); running it again
 * reuses them.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`,
 * with a `<variant>-<theme>.json` that records how the state was reached. A
 * state reached by holding or answering a request in the browser says so.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'public' | keyof typeof teammates | 'removed'

let seeded: Seeded
let baseURL: string
/** The browser-test data's first order, for the record page's top bar. */
let orderId: string
let developers: Developers

/** Signs in through the API, as the dashboard's browser tests do, and opens the store. */
async function signIn(page: Page, variant: Variant) {
  if (variant === 'public') return
  if (variant === 'admin') {
    await login(page)
    return
  }
  const email = variant === 'removed' ? removed.email : teammates[variant].email
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  if (variant !== 'removed') {
    await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
  }
}

async function openPublic(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function openStore(page: Page, path: string) {
  await page.goto(`/${seeded.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

/** Holds every request for a path open, so the screen stays in its loading state. */
const hold = (page: Page, pattern: string) => page.route(pattern, () => new Promise(() => {}))

/**
 * Waits for the screen's skeletons to clear, so a capture shows the settled
 * state rather than a moment in a retried request. Answers whether it settled.
 */
async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const confirmation = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** A loading state: captured as soon as it shows, without waiting for skeletons to clear. */
  loading?: true
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  /** Opens the screen in the state; the browser is already signed in as the variant. */
  reach: (page: Page) => Promise<void>
  /** What is masked in the screenshot, because it shows a key, token or secret. */
  masked?: { what: string; selector: string }
  /** Removes what the capture made through the screen, once it is saved. */
  after?: () => Promise<void>
}

const phone = { width: 390, height: 844 }

const collapseRail = async (page: Page) => {
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toBeVisible()
}

const settingsMenu = (page: Page) =>
  page.getByRole('complementary', { name: 'Settings navigation' })

const answerUpdate = (page: Page) =>
  page.route('**/api/v3/admin/updates', (route) => route.fulfill({ json: updateAvailable }))

const openUserMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'User menu' }).click()
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible()
}

async function openPalette(page: Page, query?: string) {
  await page.getByRole('button', { name: /search anything/i }).click()
  const input = page.getByPlaceholder('Search products, orders, customers…')
  await expect(input).toBeVisible()
  if (query) await input.fill(query)
}

async function openProfile(page: Page) {
  await openUserMenu(page)
  await page.getByRole('menuitem', { name: 'Edit Profile' }).click()
  await expect(page.getByLabel('First name')).toBeVisible()
}

const invented = 'fidelity-invented-token'
const missingInvitation = `/accept-invitation/inv_doesnotexist?token=${invented}`

/** Every navigation the batch's permission variants produce (DA-OVL-01's permission evidence). */
const navigationVariants = [
  'admin',
  'staffManager',
  'staffViewer',
  'storeSettings',
  'orderManager',
  'merchandiser',
  'support',
] as const

const captures: Capture[] = [
  // DA-AUTH-01 Sign in
  {
    screen: 'DA-AUTH-01',
    state: 'default',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/login')
      await expect(page.locator('#email')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'field-errors',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/login')
      await page.getByRole('button', { name: /^sign in$/i }).click()
      await expect(page.locator('form p.text-destructive').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'providers-loading',
    variant: 'public',
    intercepted: 'The sign-in providers request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/auth/providers')
      await page.goto('/login')
      await expect(page.locator('[data-slot="skeleton"]')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'providers-failed',
    variant: 'public',
    intercepted: 'The sign-in providers request is answered with a server error',
    reach: async (page) => {
      await page.route('**/api/v3/admin/auth/providers', (route) =>
        route.fulfill({
          status: 500,
          json: { error: { code: 'internal_error', message: 'Internal error' } },
        }),
      )
      await page.goto('/login')
      await expect(page.locator('[data-slot="alert"]')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'with-identity-provider',
    variant: 'public',
    intercepted:
      "The sign-in providers response gains an invented identity provider beside the server's password provider",
    reach: async (page) => {
      await page.route('**/api/v3/admin/auth/providers', async (route) => {
        const response = await route.fetch()
        const body = (await response.json()) as { providers: Record<string, unknown>[] }
        body.providers.push({
          key: 'example_sso',
          kind: 'redirect',
          label: 'Example SSO',
          authorization_url: 'https://sso.example.com/authorize',
        })
        await route.fulfill({ response, json: body })
      })
      await page.goto('/login')
      await expect(page.getByText('Example SSO')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'wrong-credentials',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/login')
      await page.locator('#email').fill(getCredentials().admin_email)
      await page.locator('#password').fill('not-the-password')
      await page.getByRole('button', { name: /^sign in$/i }).click()
      await expect(page.locator('form p.text-destructive')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'provider-error-on-return',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/login?error=account_not_provisioned')
      await expect(page.locator('p.text-destructive')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'fresh-installation',
    variant: 'public',
    intercepted: 'The setup status request is answered with setup required',
    reach: async (page) => {
      await page.route('**/api/v3/admin/auth/setup', (route) =>
        route.fulfill({ json: { setup_required: true } }),
      )
      await page.goto('/login')
      await expect(page.getByRole('link', { name: /go to setup/i })).toBeVisible()
    },
  },

  // DA-AUTH-02 Forgot password
  {
    screen: 'DA-AUTH-02',
    state: 'default',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/forgot-password')
      await expect(page.locator('#email')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-02',
    state: 'field-errors',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/forgot-password')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('form p.text-destructive').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-02',
    state: 'sending',
    variant: 'public',
    intercepted: 'The reset request is held open',
    reach: async (page) => {
      await openPublic(page, '/forgot-password')
      await hold(page, '**/api/v3/admin/auth/password_resets')
      await page.locator('#email').fill('someone@example.com')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('form button[type="submit"]')).toBeDisabled()
    },
  },
  {
    screen: 'DA-AUTH-02',
    state: 'sent',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/forgot-password')
      await page.locator('#email').fill('someone@example.com')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('[data-slot="card-title"]')).toBeVisible({ timeout: 15_000 })
    },
  },

  // DA-AUTH-03 Reset password
  {
    screen: 'DA-AUTH-03',
    state: 'missing-link',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, '/reset-password')
      await expect(page.locator('[data-slot="card-title"]')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-03',
    state: 'default',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, `/reset-password?token=${invented}`)
      await expect(page.locator('#password')).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-03',
    state: 'field-errors',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, `/reset-password?token=${invented}`)
      await page.locator('#password').fill('short')
      await page.locator('#password_confirmation').fill('different')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('form p.text-destructive').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-03',
    state: 'invalid-link',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, `/reset-password?token=${invented}`)
      await page.locator('#password').fill(PASSWORD)
      await page.locator('#password_confirmation').fill(PASSWORD)
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('form p.text-destructive').first()).toBeVisible({ timeout: 15_000 })
    },
  },

  // DA-AUTH-04 Accept invitation
  {
    screen: 'DA-AUTH-04',
    state: 'missing-link',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, missingInvitation.replace(/\?.*$/, ''))
      await expect(page.getByRole('heading', { name: /missing invitation token/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-04',
    state: 'loading',
    variant: 'public',
    intercepted: 'The invitation lookup is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/auth/invitations/**')
      await page.goto(await currentAcceptancePath(baseURL, seeded.pendingInvitationId))
      await expect(page.getByText(/loading invitation/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-04',
    state: 'new-account',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, await currentAcceptancePath(baseURL, seeded.pendingInvitationId))
      await expect(page.locator('#first_name')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-AUTH-04',
    state: 'field-errors',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, await currentAcceptancePath(baseURL, seeded.pendingInvitationId))
      await page.locator('#password').fill('short')
      await page.locator('#password_confirmation').fill('different')
      await page.locator('form button[type="submit"]').click()
      await expect(page.locator('form p.text-destructive').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-04',
    state: 'existing-account',
    variant: 'public',
    reach: async (page) => {
      await openPublic(
        page,
        await currentAcceptancePath(baseURL, seeded.existingAccountInvitationId),
      )
      await expect(page.locator('#password')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-AUTH-04',
    state: 'invalid-link',
    variant: 'public',
    reach: async (page) => {
      await openPublic(page, missingInvitation)
      await expect(
        page.getByRole('heading', { name: /invitation not found|could not load/i }),
      ).toBeVisible({
        timeout: 15_000,
      })
    },
  },

  // DA-SHELL-01 Store selection
  {
    screen: 'DA-SHELL-01',
    state: 'opens-first-store',
    variant: 'admin',
    reach: async (page) => {
      await openPublic(page, '/')
      await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`))
    },
  },
  {
    screen: 'DA-SHELL-01',
    state: 'no-store-access',
    variant: 'removed',
    reach: async (page) => {
      await expect(page.getByRole('button', { name: /^sign out$/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },

  // DA-SHELL-02 Not found inside a store
  {
    screen: 'DA-SHELL-02',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/does-not-exist')
      await expect(page.getByText(/page not found/i)).toBeVisible()
    },
  },

  // DA-OVL-01 App shell: the navigation each variant sees
  ...navigationVariants.map(
    (variant): Capture => ({
      screen: 'DA-OVL-01',
      state: 'main-navigation',
      variant,
      reach: async (page) => {
        await openStore(page, '')
      },
    }),
  ),
  ...navigationVariants.map(
    (variant): Capture => ({
      screen: 'DA-OVL-01',
      state: 'settings-navigation',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings')
      },
    }),
  ),

  // DA-OVL-01 App shell: the rail, its menus and the phone's top bar (part 2)
  {
    screen: 'DA-OVL-01',
    state: 'collapsed-sidebar',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await collapseRail(page)
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'collapsed-section-menu',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await collapseRail(page)
      await page.getByRole('link', { name: 'Products' }).hover()
      await expect(page.getByRole('menuitem', { name: 'Categories' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'collapsed-search-tooltip',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await collapseRail(page)
      await page
        .getByRole('button', { name: /search anything/i })
        .first()
        .hover()
      await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'store-loading',
    variant: 'admin',
    intercepted: "The store's request is held open",
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/store')
      await page.goto(`/${seeded.storeId}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'record-page',
    variant: 'admin',
    reach: async (page) => {
      // The top bar's breadcrumbs show once the rail is folded, as the
      // collapsed sidebar stops giving the page's place.
      await openStore(page, `/orders/${orderId}`)
      await collapseRail(page)
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'settings-search',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await settingsMenu(page).getByRole('searchbox').fill('tax')
      await expect(settingsMenu(page).getByRole('link', { name: 'Taxes' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'settings-search-nothing-matches',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await settingsMenu(page).getByRole('searchbox').fill('zzz')
      await expect(settingsMenu(page).getByRole('link', { name: 'Staff' })).toHaveCount(0)
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'store-switcher-open',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await page.getByRole('button', { name: 'Switch store' }).click()
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  ...(['admin', 'support'] as const).map(
    (variant): Capture => ({
      screen: 'DA-OVL-01',
      state: 'user-menu-open',
      variant,
      reach: async (page) => {
        await openStore(page, '')
        await openUserMenu(page)
      },
    }),
  ),
  {
    screen: 'DA-OVL-01',
    state: 'navigation-loading',
    variant: 'admin',
    intercepted: "The signed-in teammate's permissions request is held open",
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/me')
      await page.goto(`/${seeded.storeId}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-top-bar',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '')
      await expect(page.getByRole('button', { name: 'Toggle Sidebar' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-navigation-open',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '')
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-account-menu',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '')
      await openUserMenu(page)
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-store-loading',
    variant: 'admin',
    phone: true,
    intercepted: "The store's request is held open",
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/store')
      await page.goto(`/${seeded.storeId}`)
      await expect(page.getByRole('button', { name: 'Toggle Sidebar' })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-unread-notification',
    variant: 'admin',
    phone: true,
    intercepted: 'The update check is answered with a newer release',
    reach: async (page) => {
      await answerUpdate(page)
      await openStore(page, '')
      await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-record-breadcrumbs',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, `/orders/${orderId}`)
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).last()).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-settings-menu-open',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await page.getByRole('button', { name: 'Settings' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-01',
    state: 'mobile-settings-breadcrumbs',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    },
  },

  // DA-OVL-02 Command palette
  ...(['admin', 'support'] as const).map(
    (variant): Capture => ({
      screen: 'DA-OVL-02',
      state: 'open',
      variant,
      reach: async (page) => {
        await openStore(page, '')
        await openPalette(page)
        await expect(page.getByRole('option', { name: 'Home' })).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-OVL-02',
    state: 'results',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await openPalette(page, 'E2E')
      await expect(page.getByRole('option', { name: /E2E/ }).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-OVL-02',
    state: 'create-actions',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await openPalette(page, 'new')
      await expect(page.getByRole('option', { name: 'New Product' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-02',
    state: 'nothing-matches',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await openPalette(page, 'zzqx')
      await expect(page.getByText('No results for "zzqx".')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-OVL-02',
    state: 'on-a-phone',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '')
      await openPalette(page)
      await expect(page.getByRole('option', { name: 'Home' })).toBeVisible()
    },
  },

  // DA-OVL-03 Notifications. The browser-test server never checks for a newer
  // release, so "populated" answers the check with one and stores its notes
  // where the dashboard keeps notes it fetched from GitHub.
  {
    screen: 'DA-OVL-03',
    state: 'empty',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await page.getByRole('button', { name: 'Notifications' }).click()
      await expect(page.getByText("You're all caught up.")).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-03',
    state: 'unread',
    variant: 'admin',
    intercepted: 'The update check is answered with a newer release',
    reach: async (page) => {
      await answerUpdate(page)
      await openStore(page, '')
      await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-03',
    state: 'populated',
    variant: 'admin',
    intercepted:
      "The update check is answered with a newer release, and that release's notes are stored in the browser beforehand",
    reach: async (page) => {
      await answerUpdate(page)
      await page.addInitScript(
        ([key, notes]) => window.localStorage.setItem(key, notes),
        [`spree-release-notes:v${updateAvailable.latest_version}`, releaseNotes],
      )
      await openStore(page, '')
      await page.getByRole('button', { name: 'Notifications, 1 unread' }).click()
      await expect(page.getByRole('heading', { name: 'Highlights' })).toBeVisible()
    },
  },

  // DA-OVL-04 Profile dialog. The server accepted every name and language
  // tried, so the field error answers the save the way the Admin API reports
  // Rails' length limit, and nothing is saved.
  {
    screen: 'DA-OVL-04',
    state: 'default',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '')
      await openProfile(page)
    },
  },
  {
    screen: 'DA-OVL-04',
    state: 'field-errors',
    variant: 'admin',
    intercepted: 'The profile save is answered with a field error and never reaches the server',
    reach: async (page) => {
      await page.route('**/api/v3/admin/me', (route) =>
        route.request().method() === 'PATCH'
          ? route.fulfill({
              status: 422,
              json: {
                error: {
                  code: 'validation_error',
                  message: 'First name is too long (maximum is 100 characters)',
                  details: {
                    first_name: [
                      {
                        code: 'too_long',
                        message: 'is too long (maximum is 100 characters)',
                        specific: false,
                        count: 100,
                      },
                    ],
                  },
                },
              },
            })
          : route.fallback(),
      )
      await openStore(page, '')
      await openProfile(page)
      await page.getByLabel('First name').fill('Fidelity')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(
        page.getByText('is too long (maximum is 100 characters)', { exact: true }),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-OVL-04',
    state: 'on-a-phone',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '')
      await openProfile(page)
    },
  },

  // DA-SET-24 Staff
  {
    screen: 'DA-SET-24',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The staff and invitations requests are held open',
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/admin_users?**')
      await hold(page, '**/api/v3/admin/invitations?**')
      await page.goto(`/${seeded.storeId}/settings/staff`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  ...(['admin', 'staffManager', 'staffViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-24',
      state: 'populated-with-pending-invitations',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings/staff')
        await expect(page.locator('tr').filter({ hasText: pendingEmail })).toBeVisible({
          timeout: 15_000,
        })
      },
    }),
  ),
  ...(['support', 'storeSettings'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-24',
      state: 'direct-visit-without-permission',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings/staff')
      },
    }),
  ),
  {
    screen: 'DA-SET-24',
    state: 'invite-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await page.getByRole('button', { name: /invite teammate/i }).click()
      await expect(page.locator('#invite-email')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'invite-role-list-open',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await page.getByRole('button', { name: /invite teammate/i }).click()
      await page.locator('#invite-role').click()
      await expect(page.getByRole('option').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'role-required',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await page.getByRole('button', { name: /invite teammate/i }).click()
      await page.locator('#invite-email').fill('fidelity-unsent@example.com')
      await page.getByRole('button', { name: /send invitation/i }).click()
      await expect(page.getByRole('alert').filter({ hasText: /pick a role/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'teammate-actions-open',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, teammates.support.email)
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'edit-teammate-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, teammates.support.email)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.locator('#staff-first-name')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'remove-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, teammates.support.email)
      await page.getByRole('menuitem', { name: /remove from staff/i }).click()
      await expect(page.getByRole('heading', { name: /remove from store\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'invitation-actions-open',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, pendingEmail)
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'revoke-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, pendingEmail)
      await page.getByRole('menuitem', { name: /^revoke$/i }).click()
      await expect(page.getByRole('heading', { name: /revoke invitation\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-24',
    state: 'invitation-resent',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/staff')
      await openRowMenu(page, pendingEmail)
      await page.getByRole('menuitem', { name: /^resend$/i }).click()
      await expect(page.getByText(/invitation resent/i)).toBeVisible({ timeout: 15_000 })
    },
  },

  // DA-SET-25 Roles
  {
    screen: 'DA-SET-25',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The roles request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, '**/api/v3/admin/roles?**')
      await page.goto(`/${seeded.storeId}/settings/roles`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  ...(['admin', 'staffManager', 'staffViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-25',
      state: 'populated',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings/roles')
        await expect(roleRow(page, roles.unused.name)).toBeVisible({ timeout: 15_000 })
      },
    }),
  ),
  ...(['support', 'storeSettings'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-25',
      state: 'direct-visit-without-permission',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings/roles')
      },
    }),
  ),
  {
    screen: 'DA-SET-25',
    state: 'permissions-overflow-tooltip',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await roleRow(page, roles.orderManager.name)
        .getByRole('button', { name: /\+\d+ more/i })
        .hover()
      await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-25',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await page.getByRole('button', { name: /add role/i }).click()
      await expect(page.locator('#role-name')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-25',
    state: 'from-template',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await page.getByRole('button', { name: /add role/i }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^order manager$/i })
        .click()
      await expect(
        page.getByRole('dialog').getByRole('checkbox', { name: /manage orders/i }),
      ).toBeChecked()
    },
  },
  {
    screen: 'DA-SET-25',
    state: 'name-required',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await page.getByRole('button', { name: /add role/i }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(
        page.getByRole('dialog').locator('[data-slot="field-error"]').first(),
      ).toBeVisible()
    },
  },
  ...(['admin', 'staffViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-25',
      state: 'edit-sheet',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings/roles')
        await page.getByRole('cell', { name: roles.staffManager.name, exact: true }).click()
        await expect(page.locator('#role-name')).toHaveValue(roles.staffManager.name, {
          timeout: 15_000,
        })
      },
    }),
  ),
  {
    screen: 'DA-SET-25',
    state: 'admin-role-read-only',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await page.getByRole('cell', { name: /^admin/i }).click()
      await expect(page.locator('#role-name')).toBeDisabled({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-25',
    state: 'role-in-use-cannot-be-deleted',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await openRoleMenu(page, roles.support.name)
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeDisabled()
    },
  },
  {
    screen: 'DA-SET-25',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/roles')
      await openRoleMenu(page, roles.unused.name)
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
]

/*
 * Batch 2, developer and integration settings (DA-SET-26 to DA-SET-30,
 * DA-SET-07, DA-SET-32, DA-SET-10). The records each state needs are seeded by
 * `developers.ts`. A key, token or secret on screen is masked in the
 * screenshot, and a capture that makes a record through the screen removes it.
 */

const keyValues: Capture['masked'] = {
  what: 'Every key, token and secret value on the screen',
  selector: 'code',
}

/** The real answer to a list request, with its records taken out. */
const emptied = (page: Page, path: string) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/${path}`,
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const body = (await response.json()) as { meta?: Record<string, unknown> }
      await route.fulfill({
        response,
        json: {
          ...body,
          data: [],
          ...(body.meta && { meta: { ...body.meta, count: 0, pages: 1, from: 0, to: 0, in: 0 } }),
        },
      })
    },
  )

/** Holds or drops one kind of request to a path, so its answer never arrives. */
async function interrupt(page: Page, method: string, path: RegExp, how: 'hold' | 'abort') {
  await page.route(
    (url) => path.test(url.pathname),
    (route) => {
      if (route.request().method() !== method) return route.fallback()
      return how === 'hold' ? new Promise(() => {}) : route.abort()
    },
  )
}

const directVisit = (screen: string, path: string): Capture => ({
  screen,
  state: 'direct-visit',
  variant: 'orderManager',
  reach: (page) => openStore(page, path),
})

const apiKeysPath = '/settings/api-keys'
const openApiKeys = async (page: Page) => {
  await openStore(page, apiKeysPath)
  await expect(page.getByText(secretKeys.partner.name)).toBeVisible({ timeout: 15_000 })
}
const openKeySheet = async (page: Page) => {
  await openApiKeys(page)
  await page.getByRole('button', { name: /new key/i }).click()
  await expect(page.getByRole('checkbox', { name: 'View Products' })).toBeVisible()
}
const captureKey = 'Fidelity capture key'

const clientsPath = '/settings/oauth-clients'
const openClients = async (page: Page) => {
  await openStore(page, clientsPath)
  await expect(page.getByRole('row', { name: /Inventory assistant/ })).toBeVisible({
    timeout: 15_000,
  })
}

const originsPath = '/settings/allowed-origins'
const openOrigins = async (page: Page) => {
  await openStore(page, originsPath)
  await expect(rowButton(page, origins[0])).toBeVisible({ timeout: 15_000 })
}

const agentsPath = '/settings/ai-agents'
const agentCard = (page: Page) => page.locator('[data-slot="card"]').filter({ hasText: /^Claude/ })
const openAgents = async (page: Page) => {
  await openStore(page, agentsPath)
  await expect(agentCard(page).getByText('Ari Connector')).toBeVisible({ timeout: 15_000 })
}
const openConnectSheet = async (page: Page) => {
  await openAgents(page)
  await page.getByRole('button', { name: /connect an agent/i }).click()
  await expect(page.getByRole('dialog').getByText(/choose the assistant/i)).toBeVisible()
}

/**
 * What the batch's agent asks for: one permission the agent connector's role
 * holds, and two it does not.
 */
const authorizePath = (clientId = developers.agentClientId) =>
  `/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: agent.callback,
    response_type: 'code',
    scope: 'read_webhooks read_products write_orders',
    state: 'sample-state',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  })}`
const openAuthorize = async (page: Page) => {
  await openStore(page, authorizePath())
  await expect(page.getByRole('button', { name: 'Allow access' })).toBeEnabled({
    timeout: 15_000,
  })
}
const authorizeRequest = /\/api\/v3\/admin\/oauth\/authorize$/

const webhooksPath = '/settings/webhooks'
const openWebhooks = async (page: Page) => {
  await openStore(page, webhooksPath)
  await expect(rowButton(page, endpoints.orderSync.name)).toBeVisible({ timeout: 15_000 })
}
const openEndpointSheet = async (page: Page) => {
  await openWebhooks(page)
  await page.getByRole('button', { name: /new endpoint/i }).click()
  await expect(page.getByRole('heading', { name: /add webhook endpoint/i })).toBeVisible()
}
const captureEndpoint = {
  name: 'Fidelity capture endpoint',
  url: 'https://capture.example.test/hooks',
}
const endpointPath = (key: keyof typeof endpoints) =>
  `${webhooksPath}/${developers.endpointIds[key]}`
const openEndpoint = async (page: Page, key: keyof typeof endpoints) => {
  await openStore(page, endpointPath(key))
  await expect(page.getByRole('heading', { level: 1, name: endpoints[key].name })).toBeVisible({
    timeout: 15_000,
  })
}

const integrationsPath = '/settings/integrations'
const relayCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'E2E Relay' })
const gatewaySwitch = (page: Page) =>
  page.getByRole('switch', { name: `Turn ${gateway.name} on or off` })
const openIntegrations = async (page: Page) => {
  await openStore(page, integrationsPath)
  await expect(relayCard(page)).toBeVisible({ timeout: 15_000 })
  await expect(gatewaySwitch(page)).toBeVisible()
}
const relaySheet = (page: Page) => page.getByRole('dialog')

const developerCaptures: Capture[] = [
  // DA-SET-26 API keys
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-26',
      state: 'listed',
      variant,
      masked: keyValues,
      reach: openApiKeys,
    }),
  ),
  directVisit('DA-SET-26', apiKeysPath),
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-26',
      state: 'create-sheet',
      variant,
      masked: keyValues,
      reach: openKeySheet,
    }),
  ),
  {
    screen: 'DA-SET-26',
    state: 'create-full-access',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openKeySheet(page)
      const fullAccess = page.getByRole('checkbox', { name: /Full access/ })
      await fullAccess.click()
      await expect(fullAccess).toBeChecked()
    },
  },
  {
    screen: 'DA-SET-26',
    state: 'create-chosen-scopes',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openKeySheet(page)
      await page.locator('#api-key-name').fill('Warehouse sync')
      await page.getByRole('checkbox', { name: 'View Orders' }).click()
      await page.getByRole('checkbox', { name: 'Manage Orders' }).click()
      await expect(page.getByRole('checkbox', { name: 'Manage Orders' })).toBeChecked()
    },
  },
  {
    screen: 'DA-SET-26',
    state: 'token-shown-once',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openKeySheet(page)
      await page.locator('#api-key-name').fill(captureKey)
      await page.getByText(/read all \(read_all\)/i).click()
      await page.getByRole('button', { name: /create key/i }).click()
      await expect(page.getByText('Save your secret key')).toBeVisible({ timeout: 15_000 })
    },
    after: () => removeNamed(baseURL, 'api_keys', captureKey),
  },
  {
    screen: 'DA-SET-26',
    state: 'edit-renaming',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openApiKeys(page)
      await openRowMenu(page, secretKeys.partner.name)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.locator('#edit-api-key-name')).toHaveValue(secretKeys.partner.name)
      await page.locator('#edit-api-key-name').fill('Fulfilment partner, Europe')
    },
  },
  {
    screen: 'DA-SET-26',
    state: 'revoke-confirmation',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openApiKeys(page)
      await openRowMenu(page, secretKeys.partner.name)
      await page.getByRole('menuitem', { name: 'Revoke key' }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-26',
    state: 'delete-confirmation',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openApiKeys(page)
      await openRowMenu(page, secretKeys.revoked.name)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-SET-27 OAuth clients
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({ screen: 'DA-SET-27', state: 'listed', variant, reach: openClients }),
  ),
  directVisit('DA-SET-27', clientsPath),
  {
    screen: 'DA-SET-27',
    state: 'none',
    variant: 'admin',
    intercepted: "The client list's answer has its records taken out in the browser",
    reach: async (page) => {
      await emptied(page, 'oauth/applications')
      await openStore(page, clientsPath)
      await expect(page.getByText(/no clients registered/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-27',
    state: 'register-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openClients(page)
      await page.getByRole('button', { name: /register a client/i }).click()
      await expect(page.locator('#oauth-application-name')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-27',
    state: 'callback-refused',
    variant: 'admin',
    reach: async (page) => {
      await openClients(page)
      await page.getByRole('button', { name: /register a client/i }).click()
      const sheet = page.getByRole('dialog')
      await sheet.locator('#oauth-application-name').fill('Reporting tool')
      await sheet
        .locator('#oauth-application-redirect-uri')
        .fill('http://reports.example.test/callback')
      await sheet.getByRole('button', { name: /^save$/i }).click()
      await expect(
        sheet.getByRole('alert').filter({ hasText: /must start with https/i }),
      ).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-27',
    state: 'rename',
    variant: 'admin',
    reach: async (page) => {
      await openClients(page)
      await openRowMenu(page, 'Inventory assistant')
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.locator('#oauth-application-name')).toHaveValue('Inventory assistant')
      await page.locator('#oauth-application-name').fill('Inventory assistant, staging')
    },
  },
  {
    screen: 'DA-SET-27',
    state: 'remove-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openClients(page)
      await openRowMenu(page, 'Inventory assistant')
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-SET-30 Allowed origins
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({ screen: 'DA-SET-30', state: 'listed', variant, reach: openOrigins }),
  ),
  directVisit('DA-SET-30', originsPath),
  {
    screen: 'DA-SET-30',
    state: 'none',
    variant: 'admin',
    intercepted: "The origin list's answer has its records taken out in the browser",
    reach: async (page) => {
      await emptied(page, 'allowed_origins')
      await openStore(page, originsPath)
      await expect(page.getByRole('button', { name: /add allowed origin/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-30',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openOrigins(page)
      await page.getByRole('button', { name: /add allowed origin/i }).click()
      await expect(page.getByRole('heading', { name: /add allowed origin/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-30',
    state: 'malformed-refused',
    variant: 'admin',
    reach: async (page) => {
      await openOrigins(page)
      await page.getByRole('button', { name: /add allowed origin/i }).click()
      await page.locator('#origin').fill('not a url')
      await page.getByRole('button', { name: /add origin/i }).click()
      await expect(page.getByText(/must be a bare origin/i).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-30',
    state: 'edit',
    variant: 'admin',
    reach: async (page) => {
      await openOrigins(page)
      await rowButton(page, origins[0]).click()
      await expect(page.locator('#origin')).toHaveValue(origins[0], { timeout: 15_000 })
      await page.locator('#origin').fill('https://shop.example.net')
    },
  },
  {
    screen: 'DA-SET-30',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrigins(page)
      await openRowMenu(page, origins[1])
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-30',
    state: 'nothing-found',
    variant: 'admin',
    reach: async (page) => {
      await openOrigins(page)
      await page.getByPlaceholder(/search by origin/i).fill('checkout')
      await expect(rowButton(page, origins[0])).toHaveCount(0, { timeout: 15_000 })
    },
  },

  // DA-SET-07 AI agents
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({ screen: 'DA-SET-07', state: 'connected', variant, reach: openAgents }),
  ),
  directVisit('DA-SET-07', agentsPath),
  {
    screen: 'DA-SET-07',
    state: 'nothing-connected',
    variant: 'admin',
    intercepted: "The registration list's answer has its records taken out in the browser",
    reach: async (page) => {
      await emptied(page, 'oauth/applications')
      await openStore(page, agentsPath)
      await expect(page.getByText(/no agents have been connected/i)).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-07',
    state: 'unknown-person',
    variant: 'admin',
    intercepted:
      "The connection list's answer has the second person taken out in the browser, as when their account no longer exists",
    reach: async (page) => {
      await page.route(
        (url) => /\/oauth\/applications\/[^/]+\/tokens$/.test(url.pathname),
        async (route) => {
          const response = await route.fetch()
          const body = (await response.json()) as {
            data: { owner?: { email?: string } | null; owner_id: string | null }[]
          }
          const data = body.data.map((token) =>
            token.owner?.email === teammates.agentConnector.email
              ? { ...token, owner: null, owner_id: null }
              : token,
          )
          await route.fulfill({ response, json: { ...body, data } })
        },
      )
      await openStore(page, agentsPath)
      await expect(agentCard(page).getByText('Unknown')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-07',
    state: 'connect-sheet',
    variant: 'admin',
    reach: openConnectSheet,
  },
  {
    screen: 'DA-SET-07',
    state: 'connect-something-else',
    variant: 'admin',
    reach: async (page) => {
      await openConnectSheet(page)
      await page
        .getByRole('dialog')
        .getByText(/any other client that speaks mcp/i)
        .click()
      await expect(page.getByRole('dialog').getByText(/callback url/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-07',
    state: 'connect-ready',
    variant: 'admin',
    reach: async (page) => {
      await openConnectSheet(page)
      const sheet = page.getByRole('dialog')
      await sheet.getByText(/claude\.ai, claude desktop/i).click()
      await sheet.getByRole('button', { name: /^continue$/i }).click()
      await expect(sheet.getByText(/ready to connect/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-07',
    state: 'connect-claude-code',
    variant: 'admin',
    reach: async (page) => {
      await openConnectSheet(page)
      const sheet = page.getByRole('dialog')
      await sheet.getByText(/claude\.ai, claude desktop/i).click()
      await sheet.getByRole('button', { name: /^continue$/i }).click()
      await sheet.getByRole('tab', { name: /claude code/i }).click()
      await expect(sheet.getByText(/claude mcp add/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-07',
    state: 'revoke-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openAgents(page)
      await agentCard(page)
        .getByRole('button', { name: /open actions/i })
        .first()
        .click()
      await page.getByRole('menuitem', { name: /revoke/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-SET-32 Authorize an application. Approving and refusing on this page
  // are platform step P2's; here their requests are held, so nothing is decided.
  {
    screen: 'DA-SET-32',
    state: 'permissions-requested',
    variant: 'admin',
    reach: openAuthorize,
  },
  {
    screen: 'DA-SET-32',
    state: 'permissions-withheld',
    variant: 'agentConnector',
    reach: async (page) => {
      await openAuthorize(page)
      await expect(page.getByText(/not offered, because your own role/i)).toBeVisible()
    },
  },
  // Connecting an agent takes write on OAuth applications, so Spree refuses
  // the read-only role the request itself.
  {
    screen: 'DA-SET-32',
    state: 'not-permitted',
    variant: 'developerViewer',
    reach: async (page) => {
      await openStore(page, authorizePath())
      await expect(page.locator('[data-slot="alert"]')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-32',
    state: 'approving',
    variant: 'admin',
    intercepted: 'The approval request is held open in the browser, so nothing is approved',
    reach: async (page) => {
      await openAuthorize(page)
      await interrupt(page, 'POST', authorizeRequest, 'hold')
      await page.getByRole('button', { name: 'Allow access' }).click()
      await expect(page.getByRole('button', { name: 'Allow access' })).toBeDisabled()
    },
  },
  {
    screen: 'DA-SET-32',
    state: 'refusing',
    variant: 'admin',
    intercepted: 'The refusal request is held open in the browser, so nothing is refused',
    reach: async (page) => {
      await openAuthorize(page)
      await interrupt(page, 'DELETE', authorizeRequest, 'hold')
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('button', { name: 'Allow access' })).toBeDisabled()
    },
  },
  {
    screen: 'DA-SET-32',
    state: 'decision-failed',
    variant: 'admin',
    intercepted:
      'The approval request is dropped in the browser, as a lost connection would drop it, so nothing is approved',
    reach: async (page) => {
      await openAuthorize(page)
      await interrupt(page, 'POST', authorizeRequest, 'abort')
      await page.getByRole('button', { name: 'Allow access' }).click()
      // The browser's own message for the dropped request.
      await expect(page.getByText('Failed to fetch')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-32',
    state: 'invalid-request',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, authorizePath('sample-unknown-client'))
      await expect(page.locator('[data-slot="alert"]')).toBeVisible({ timeout: 15_000 })
    },
  },

  // DA-SET-28 Webhooks
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({ screen: 'DA-SET-28', state: 'listed', variant, reach: openWebhooks }),
  ),
  directVisit('DA-SET-28', webhooksPath),
  {
    screen: 'DA-SET-28',
    state: 'none',
    variant: 'admin',
    intercepted: "The endpoint list's answer has its records taken out in the browser",
    reach: async (page) => {
      await emptied(page, 'webhook_endpoints')
      await openStore(page, webhooksPath)
      await expect(page.getByText(/no webhook endpoints yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-28',
    state: 'create-all-events',
    variant: 'admin',
    reach: async (page) => {
      await openEndpointSheet(page)
      await expect(page.getByRole('checkbox', { name: 'order.placed', exact: true })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-28',
    state: 'create-chosen-events',
    variant: 'admin',
    reach: async (page) => {
      await openEndpointSheet(page)
      await page.locator('#webhook-name').fill(captureEndpoint.name)
      await page.locator('#webhook-url').fill(captureEndpoint.url)
      for (const event of ['order.placed', 'order.canceled']) {
        await page.getByRole('checkbox', { name: event, exact: true }).click()
      }
      await expect(
        page.getByRole('checkbox', { name: 'order.canceled', exact: true }),
      ).toBeChecked()
    },
  },
  {
    screen: 'DA-SET-28',
    state: 'events-failed',
    variant: 'admin',
    intercepted: 'The event catalog requests are dropped in the browser',
    reach: async (page) => {
      await interrupt(page, 'GET', /\/api\/v3\/admin\/webhook_events$/, 'abort')
      await openEndpointSheet(page)
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible({
        timeout: 20_000,
      })
    },
  },
  {
    screen: 'DA-SET-28',
    state: 'secret-shown-once',
    variant: 'admin',
    masked: keyValues,
    reach: async (page) => {
      await openEndpointSheet(page)
      await page.locator('#webhook-name').fill(captureEndpoint.name)
      await page.locator('#webhook-url').fill(captureEndpoint.url)
      await page.getByRole('checkbox', { name: 'order.placed', exact: true }).click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^create$/i })
        .click()
      await expect(page.getByRole('heading', { name: /save your signing secret/i })).toBeVisible({
        timeout: 15_000,
      })
    },
    after: () => removeNamed(baseURL, 'webhook_endpoints', captureEndpoint.name),
  },
  {
    screen: 'DA-SET-28',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openWebhooks(page)
      await openRowMenu(page, endpoints.priceFeed.name)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-SET-29 Webhook endpoint
  ...(['admin', 'developerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-29',
      state: 'details-and-deliveries',
      variant,
      reach: async (page) => {
        await openEndpoint(page, 'orderSync')
        await expect(page.getByText('webhook.test', { exact: true }).first()).toBeVisible({
          timeout: 15_000,
        })
      },
    }),
  ),
  {
    screen: 'DA-SET-29',
    state: 'delivery-details',
    variant: 'admin',
    reach: async (page) => {
      await openEndpoint(page, 'orderSync')
      await page.getByText('webhook.test', { exact: true }).first().click()
      await expect(page.getByText('Delivery details')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'rename',
    variant: 'admin',
    reach: async (page) => {
      await openEndpoint(page, 'orderSync')
      await page.getByRole('button', { name: /^edit$/i }).click()
      await expect(page.locator('#webhook-name')).toHaveValue(endpoints.orderSync.name, {
        timeout: 15_000,
      })
      await page.locator('#webhook-name').fill('Order sync, Europe')
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'test-sent',
    variant: 'admin',
    reach: async (page) => {
      await openEndpoint(page, 'stockFeed')
      await page.getByRole('button', { name: /send test/i }).click()
      await expect(page.getByText(/test webhook queued/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'test-failed',
    variant: 'admin',
    intercepted: 'The send test request is dropped in the browser, so no test is sent',
    reach: async (page) => {
      await openEndpoint(page, 'stockFeed')
      await interrupt(page, 'POST', /\/send_test$/, 'abort')
      await page.getByRole('button', { name: /send test/i }).click()
      await expect(page.locator('[data-type="error"]').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'no-deliveries',
    variant: 'admin',
    reach: async (page) => {
      await openEndpoint(page, 'priceFeed')
      await expect(page.getByText(/no deliveries yet/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'disabled-with-reason',
    variant: 'admin',
    reach: async (page) => {
      await openEndpoint(page, 'legacy')
      await expect(page.getByText(disabledReason).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-29',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${webhooksPath}/whe_doesnotexist`)
      await expect(page.getByText(/couldn't load this webhook endpoint/i)).toBeVisible({
        timeout: 20_000,
      })
    },
  },

  // DA-SET-10 Integrations. Each capture first puts E2E Relay and the test
  // gateway in the state it shows.
  ...(
    [
      ['not-connected', 'none'],
      ['connected', 'active'],
      ['connected-inactive', 'inactive'],
    ] as const
  ).map(
    ([state, relay]): Capture => ({
      screen: 'DA-SET-10',
      state,
      variant: 'admin',
      reach: async (page) => {
        await setRelay(baseURL, relay)
        await setGateway(baseURL, developers.gatewayId, true)
        await openIntegrations(page)
      },
    }),
  ),
  // Recorded as it shows: the read-only role's page lists less than the admin's.
  {
    screen: 'DA-SET-10',
    state: 'connected',
    variant: 'developerViewer',
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await setGateway(baseURL, developers.gatewayId, true)
      await openStore(page, integrationsPath)
      await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-10',
    state: 'direct-visit',
    variant: 'orderManager',
    reach: (page) => openStore(page, integrationsPath),
  },
  ...(['hidden', 'shown'] as const).map(
    (secret): Capture => ({
      screen: 'DA-SET-10',
      state: `connect-sheet-secret-${secret}`,
      variant: 'admin',
      reach: async (page) => {
        await setRelay(baseURL, 'none')
        await openIntegrations(page)
        await relayCard(page)
          .getByRole('button', { name: /^connect$/i })
          .click()
        const sheet = relaySheet(page)
        await expect(sheet.getByRole('heading', { name: 'E2E Relay' })).toBeVisible({
          timeout: 15_000,
        })
        await sheet.locator('#preference-account_id').fill('sample-account')
        await sheet.locator('#preference-api_secret').fill('sample-relay-secret-0000')
        if (secret === 'shown') await sheet.getByRole('button', { name: /^show$/i }).click()
      },
    }),
  ),
  {
    screen: 'DA-SET-10',
    state: 'configure-sheet',
    variant: 'admin',
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await openIntegrations(page)
      await relayCard(page)
        .getByRole('button', { name: /^configure$/i })
        .click()
      await expect(relaySheet(page).getByRole('heading', { name: 'E2E Relay' })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-10',
    state: 'disconnect-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await openIntegrations(page)
      await relayCard(page)
        .getByRole('button', { name: /^configure$/i })
        .click()
      await relaySheet(page)
        .getByRole('button', { name: /^disconnect$/i })
        .click()
      // A dialog above the sheet, not an alert dialog.
      await expect(page.getByRole('dialog', { name: /disconnect integration/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-10',
    state: 'payment-provider-off',
    variant: 'admin',
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await setGateway(baseURL, developers.gatewayId, false)
      await openIntegrations(page)
      await expect(gatewaySwitch(page)).not.toBeChecked()
    },
  },
  {
    screen: 'DA-SET-10',
    state: 'switch-moved-while-saving',
    variant: 'admin',
    intercepted: "The gateway's save is held open in the browser",
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await setGateway(baseURL, developers.gatewayId, true)
      await openIntegrations(page)
      await interrupt(page, 'PATCH', /\/api\/v3\/admin\/payment_methods\/[^/]+$/, 'hold')
      await gatewaySwitch(page).click()
      await expect(gatewaySwitch(page)).not.toBeChecked()
    },
  },
  {
    screen: 'DA-SET-10',
    state: 'switch-reverted',
    variant: 'admin',
    intercepted: "The gateway's save is dropped in the browser, so nothing is saved",
    reach: async (page) => {
      await setRelay(baseURL, 'active')
      await setGateway(baseURL, developers.gatewayId, true)
      await openIntegrations(page)
      await interrupt(page, 'PATCH', /\/api\/v3\/admin\/payment_methods\/[^/]+$/, 'abort')
      await gatewaySwitch(page).click()
      await expect(page.locator('[data-type="error"]').first()).toBeVisible({ timeout: 15_000 })
      await expect(gatewaySwitch(page)).toBeChecked()
    },
  },
]

/**
 * Batch 3's screens: the getting started page, the settings index, the store,
 * policies, channels, custom fields, markets and reasons (LIQ-006 §3). The
 * storefront sheet shows the store's publishable key and the server's own
 * address, so both are painted out wherever it is open.
 */

const storefrontCredentials: Capture['masked'] = {
  what: "The storefront sheet's Store API address and publishable key",
  selector: '[role="dialog"] input[readonly]',
}

const sheet = (page: Page) => page.getByRole('dialog')

const card = (page: Page, title: string) =>
  page.locator('[data-slot="card"]').filter({ hasText: title })

/**
 * Scrolls the card with this title to the top of the page's scrolling area,
 * below the page's title, which stays pinned.
 */
const toCard = (page: Page, title: string) =>
  page
    .locator('[data-slot="card-title"]')
    .getByText(title, { exact: true })
    .evaluate((element) => {
      const section = element.closest('[data-slot="card"]') ?? element
      section.scrollIntoView({ block: 'start' })
      let pinned = document.querySelector('h1') as Element | null
      while (pinned && getComputedStyle(pinned).position !== 'sticky') pinned = pinned.parentElement
      let scroller = section.parentElement
      while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
        scroller = scroller.parentElement
      }
      const covered =
        (pinned?.getBoundingClientRect().bottom ?? 0) - section.getBoundingClientRect().top
      scroller?.scrollBy(0, -(covered + 16))
    })

/** The real store, with every setup task marked done or not done. */
const answerTasks = (page: Page, done: boolean) =>
  page.route(
    (url) => url.pathname === '/api/v3/admin/store',
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const body = (await response.json()) as { setup_tasks?: { name: string; done: boolean }[] }
      await route.fulfill({
        response,
        json: { ...body, setup_tasks: body.setup_tasks?.map((task) => ({ ...task, done })) },
      })
    },
  )

const openGettingStarted = async (page: Page) => {
  await openStore(page, '/getting-started')
  await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible()
}

const openTask = async (page: Page, title: string) => {
  await openGettingStarted(page)
  // The first task not done opens on its own.
  const task = page.getByRole('button', { name: title })
  if ((await task.getAttribute('aria-expanded')) !== 'true') await task.click()
  await expect(page.getByRole('region', { name: title })).toBeVisible()
}

const openStorefrontSheet = async (page: Page) => {
  await openTask(page, 'Set up storefront')
  await page.getByRole('button', { name: 'Connect storefront' }).click()
  await expect(sheet(page).getByText('Publishable API key')).toBeVisible()
}

const openStoreSettings = async (page: Page) => {
  await openStore(page, '/settings/store')
  await expect(page.getByRole('textbox', { name: 'Store name' })).toBeVisible()
}

/** Opens a list page's create sheet by its button. */
const openCreate = (path: string, button: string) => async (page: Page) => {
  await openStore(page, `/settings/${path}`)
  await page.getByRole('button', { name: button }).click()
  await expect(sheet(page)).toBeVisible()
}

/** Opens a record's sheet from its name in the list. */
const openRecord = async (page: Page, path: string, name: string) => {
  await openStore(page, `/settings/${path}`)
  await page
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click()
  await expect(sheet(page)).toBeVisible()
}

const channelSheet = (page: Page) =>
  page.getByRole('dialog').filter({ hasText: 'Order routing rules' })
const routingRule = (page: Page, name: string) =>
  channelSheet(page).locator('li').filter({ hasText: name })
const showRoutingRules = (page: Page) =>
  channelSheet(page)
    .getByText('Order routing rules')
    .evaluate((element) => element.scrollIntoView({ block: 'start' }))

const askDelete = async (page: Page, path: string, rowText: string) => {
  await openStore(page, `/settings/${path}`)
  await openRowMenu(page, rowText)
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await expect(confirmation(page)).toBeVisible()
}

const chooseOption = async (page: Page, field: string, option: string) => {
  await sheet(page).getByRole('combobox', { name: field }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

/** The three roles of the batch (§2.2): every control, read only, and none of these settings. */
const settingsVariants = ['admin', 'settingsViewer'] as const

const listed = (screen: string, path: string, shows: string): Capture[] => [
  ...settingsVariants.map(
    (variant): Capture => ({
      screen,
      state: 'listed',
      variant,
      reach: async (page) => {
        await openStore(page, `/settings/${path}`)
        await expect(page.getByText(shows, { exact: true }).first()).toBeVisible()
      },
    }),
  ),
  directVisit(screen, `/settings/${path}`),
]

/** A new market with its name, currency, a second language, a country and tax included. */
const fillMarket = async (page: Page) => {
  await openCreate('markets', 'Add market')(page)
  await sheet(page).getByRole('textbox', { name: 'Name' }).fill('Canada')
  await chooseOption(page, 'Currency', 'CAD — Canadian Dollar')
  await sheet(page).getByRole('combobox', { name: 'Supported locales' }).fill('fr-')
  await page.getByRole('option', { name: /^FR-CA/ }).click()
  await sheet(page).getByRole('combobox', { name: 'Search countries…' }).fill('Canada')
  await page
    .getByRole('option', { name: /Canada/ })
    .first()
    .click()
  await sheet(page).getByRole('switch', { name: 'Prices include tax' }).click()
}

/** The six setup tasks, by the name the store's answer gives each and the title it shows. */
const setupTasks = [
  ['address', 'Add your shipping address'],
  ['payment-methods', 'Set up payment methods'],
  ['products', 'Add products'],
  ['support-email', 'Set customer support email'],
  ['taxes', 'Set up taxes collection'],
  ['storefront', 'Set up storefront'],
] as const

const fieldTypes = ['Long text', 'Rich text', 'Number', 'Boolean', 'JSON'] as const

const settingsCaptures: Capture[] = [
  // DA-HOME-02 Getting started, with its navigation entry
  {
    screen: 'DA-HOME-02',
    state: 'some-done',
    variant: 'admin',
    reach: openGettingStarted,
  },
  {
    screen: 'DA-HOME-02',
    state: 'none-done',
    variant: 'admin',
    intercepted: "The store's answer has every setup task marked not done",
    reach: async (page) => {
      await answerTasks(page, false)
      await openGettingStarted(page)
      await expect(page.getByText('0 of 6 completed')).toBeVisible()
    },
  },
  {
    screen: 'DA-HOME-02',
    state: 'all-done',
    variant: 'admin',
    intercepted: "The store's answer has every setup task marked done",
    reach: async (page) => {
      await answerTasks(page, true)
      await openStore(page, '/getting-started')
      await expect(page.getByRole('link', { name: /Getting Started/ })).toHaveCount(0)
    },
  },
  ...setupTasks.flatMap(([task, title]) =>
    [false, true].map(
      (done): Capture => ({
        screen: 'DA-HOME-02',
        state: `task-${task}-${done ? 'done' : 'not-done'}`,
        variant: 'admin',
        intercepted: `The store's answer has every setup task marked ${done ? 'done' : 'not done'}`,
        reach: async (page) => {
          await answerTasks(page, done)
          await openTask(page, title)
        },
      }),
    ),
  ),
  {
    screen: 'DA-HOME-02',
    state: 'address-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openGettingStarted(page)
      await page.getByRole('button', { name: 'Save address' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    screen: 'DA-HOME-02',
    state: 'storefront-sheet-key-hidden',
    variant: 'admin',
    masked: storefrontCredentials,
    reach: openStorefrontSheet,
  },
  {
    screen: 'DA-HOME-02',
    state: 'storefront-sheet-key-shown',
    variant: 'admin',
    masked: storefrontCredentials,
    reach: async (page) => {
      await openStorefrontSheet(page)
      await sheet(page).getByRole('button', { name: 'Show' }).click()
      await expect(sheet(page).getByRole('button', { name: 'Hide' })).toBeVisible()
    },
  },
  {
    screen: 'DA-HOME-02',
    state: 'storefront-sheet-not-an-address',
    variant: 'admin',
    masked: storefrontCredentials,
    reach: async (page) => {
      await openStorefrontSheet(page)
      await sheet(page).getByLabel('Storefront URL').fill('https://')
      await sheet(page).getByRole('button', { name: 'Save & finish setup' }).click()
      await expect(page.getByText("This doesn't look like a valid storefront URL.")).toBeAttached()
    },
  },
  {
    screen: 'DA-HOME-02',
    state: 'direct-visit',
    variant: 'settingsViewer',
    reach: (page) => openStore(page, '/getting-started'),
  },
  directVisit('DA-HOME-02', '/getting-started'),

  // DA-SET-01 Settings index
  ...(['admin', 'settingsViewer', 'orderManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-01',
      state: 'cards',
      variant,
      reach: async (page) => {
        await openStore(page, '/settings')
        await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-SET-01',
    state: 'phone',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '/settings')
      await expect(page.getByRole('searchbox', { name: 'Search settings' })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-01',
    state: 'phone-searched',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '/settings')
      await page.getByRole('searchbox', { name: 'Search settings' }).fill('tax')
      await expect(page.getByRole('link', { name: /^Taxes/ })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-01',
    state: 'phone-nothing-found',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openStore(page, '/settings')
      await page.getByRole('searchbox', { name: 'Search settings' }).fill('zzz')
      await expect(page.getByText('No settings match “zzz”.')).toBeVisible()
    },
  },

  // DA-SET-02 Store
  ...(
    [
      ['storefront-access', 'Storefront access'],
      ['addresses-and-order-numbers', 'Addresses'],
      ['payments', 'Payments'],
      ['inventory-and-data-sources', 'Inventory'],
      ['catalog-and-downloads', 'Catalog'],
    ] as const
  ).map(
    ([state, section]): Capture => ({
      screen: 'DA-SET-02',
      state,
      variant: 'admin',
      reach: async (page) => {
        await openStoreSettings(page)
        await toCard(page, section)
      },
    }),
  ),
  ...settingsVariants.map(
    (variant): Capture => ({
      screen: 'DA-SET-02',
      state: 'general',
      variant,
      reach: openStoreSettings,
    }),
  ),
  directVisit('DA-SET-02', '/settings/store'),
  {
    screen: 'DA-SET-02',
    state: 'unsaved-changes',
    variant: 'admin',
    reach: async (page) => {
      await openStoreSettings(page)
      await page.getByRole('textbox', { name: 'Store name' }).fill(`${seeded.storeName} Outlet`)
      await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-02',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openStoreSettings(page)
      await page.getByRole('textbox', { name: 'Store name' }).fill(`${seeded.storeName} Outlet`)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.locator('[data-type="success"]').first()).toBeVisible({ timeout: 15_000 })
    },
    after: () => setStoreName(baseURL, seeded.storeName),
  },
  {
    screen: 'DA-SET-02',
    state: 'save-refused',
    variant: 'admin',
    intercepted: "The store's save is answered with a field error and never reaches the server",
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/store',
        (route) =>
          route.request().method() === 'PATCH'
            ? route.fulfill({
                status: 422,
                json: {
                  error: {
                    code: 'validation_error',
                    message: 'Name is too long (maximum is 100 characters)',
                    details: {
                      name: [
                        {
                          code: 'too_long',
                          message: 'is too long (maximum is 100 characters)',
                          specific: false,
                          count: 100,
                        },
                      ],
                    },
                  },
                },
              })
            : route.fallback(),
      )
      await openStoreSettings(page)
      await page.getByRole('textbox', { name: 'Store name' }).fill(`${seeded.storeName} Outlet`)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.getByText(/is too long/).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-02',
    // The page keeps its loading placeholder: it checks for a missing store
    // before it checks for an error, so its failure message never shows.
    state: 'request-failed',
    variant: 'admin',
    intercepted: "The store's request is answered with a server error",
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/store',
        (route) =>
          route.request().method() === 'GET'
            ? route.fulfill({
                status: 500,
                json: { error: { code: 'internal_error', message: 'Internal error' } },
              })
            : route.fallback(),
      )
      await page.goto(`/${seeded.storeId}/settings/store`)
      await page.waitForTimeout(12_000)
    },
  },

  // DA-SET-06 Policies
  ...listed('DA-SET-06', 'policies', 'Returns Policy'),
  {
    screen: 'DA-SET-06',
    state: 'none',
    variant: 'admin',
    intercepted: 'The policies list is answered with its records taken out',
    reach: async (page) => {
      await emptied(page, 'policies')
      await openStore(page, '/settings/policies')
    },
  },
  {
    screen: 'DA-SET-06',
    state: 'create-sheet',
    variant: 'admin',
    reach: openCreate('policies', 'Add policy'),
  },
  {
    screen: 'DA-SET-06',
    // The slug's placeholder is a fixed example; a blank slug is made from the name on save.
    state: 'create-name-typed',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('policies', 'Add policy')(page)
      await sheet(page).getByRole('textbox', { name: 'Name' }).fill('Gift card terms')
      await expect(sheet(page).getByRole('textbox', { name: 'Slug' })).toHaveValue('')
    },
  },
  {
    screen: 'DA-SET-06',
    state: 'media-picker',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('policies', 'Add policy')(page)
      await sheet(page).getByRole('button', { name: 'Image' }).click()
      await expect(page.getByText('Media library')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-06',
    state: 'edit',
    variant: 'admin',
    reach: (page) => openRecord(page, 'policies', 'Returns Policy'),
  },
  {
    screen: 'DA-SET-06',
    state: 'edit',
    variant: 'settingsViewer',
    reach: (page) => openRecord(page, 'policies', 'Returns Policy'),
  },
  {
    screen: 'DA-SET-06',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'policies', 'Returns Policy'),
  },

  // DA-SET-08 Channels
  ...listed('DA-SET-08', 'channels', inactiveChannel.name),
  {
    screen: 'DA-SET-08',
    state: 'create-sheet',
    variant: 'admin',
    reach: openCreate('channels', 'New sales channel'),
  },
  {
    screen: 'DA-SET-08',
    state: 'create-code-derived',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('channels', 'New sales channel')(page)
      await sheet(page).getByRole('textbox', { name: 'Name' }).fill('Pop-up market')
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'create-code-typed',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('channels', 'New sales channel')(page)
      await sheet(page).getByRole('textbox', { name: 'Name' }).fill('Pop-up market')
      await sheet(page).getByRole('textbox', { name: 'Code' }).fill('summer-popup')
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'store-settings-overridden',
    variant: 'admin',
    reach: (page) => openRecord(page, 'channels', 'Wholesale'),
  },
  {
    screen: 'DA-SET-08',
    state: 'store-settings-cleared',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', 'Wholesale')
      await chooseOption(page, 'Storefront access', 'Inherit from store')
      await chooseOption(page, 'Guest checkout', 'Inherit from store')
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'catalog-picker-empty',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', 'Wholesale')
      await sheet(page).getByRole('combobox', { name: 'Default catalog' }).click()
      await expect(page.getByText('No catalogs found')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'fulfilment-locations-chosen',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', 'Wholesale')
      await sheet(page).getByRole('radio', { name: 'Selected locations' }).click()
      await sheet(page).getByText('Shop location').scrollIntoViewIfNeeded()
    },
  },
  ...settingsVariants.map(
    (variant): Capture => ({
      screen: 'DA-SET-08',
      state: 'routing-rules',
      variant,
      reach: async (page) => {
        await openRecord(page, 'channels', 'Wholesale')
        await expect(routingRule(page, 'Default location')).toBeVisible()
        await showRoutingRules(page)
      },
    }),
  ),
  {
    screen: 'DA-SET-08',
    state: 'routing-rule-delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', 'Wholesale')
      await sheet(page)
        .locator('li')
        .filter({ hasText: 'Minimize splits' })
        .getByRole('button', { name: 'Delete' })
        .click()
      await expect(page.getByText('Delete routing rule?')).toBeVisible()
    },
  },
  // Every channel starts with one rule of each of Spree's three kinds, so Add
  // rule shows only once one is removed. The pop-up channel, which the
  // captures added, loses its default location rule and gets it back.
  {
    screen: 'DA-SET-08',
    state: 'routing-rule-add-picker',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', inactiveChannel.name)
      await expect(routingRule(page, 'Minimize splits')).toBeVisible()
      if ((await routingRule(page, 'Default location').count()) > 0) {
        await routingRule(page, 'Default location').getByRole('button', { name: 'Delete' }).click()
        await page
          .getByRole('dialog')
          .filter({ hasText: 'Delete routing rule?' })
          .getByRole('button', { name: 'Delete' })
          .click()
        await expect(routingRule(page, 'Default location')).toHaveCount(0)
      }
      await channelSheet(page).getByRole('button', { name: 'Add rule' }).click()
      await expect(channelSheet(page).getByText('Add a routing rule')).toBeVisible()
      await showRoutingRules(page)
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'routing-rule-added',
    variant: 'admin',
    reach: async (page) => {
      await openRecord(page, 'channels', inactiveChannel.name)
      await expect(routingRule(page, 'Minimize splits')).toBeVisible()
      if ((await routingRule(page, 'Default location').count()) === 0) {
        await channelSheet(page).getByRole('button', { name: 'Add rule' }).click()
        await channelSheet(page).getByText('Prefer the stock location marked as default').click()
        await expect(routingRule(page, 'Default location')).toBeVisible()
      }
      await showRoutingRules(page)
    },
  },
  {
    screen: 'DA-SET-08',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'channels', inactiveChannel.name),
  },

  // DA-SET-09 Custom fields
  ...listed('DA-SET-09', 'custom-field-definitions', 'Material'),
  {
    screen: 'DA-SET-09',
    state: 'none',
    variant: 'admin',
    intercepted: 'The custom field list is answered with its records taken out',
    reach: async (page) => {
      await emptied(page, 'custom_field_definitions')
      await openStore(page, '/settings/custom-field-definitions')
      await expect(page.getByText('No custom field definitions yet')).toBeVisible()
    },
  },
  ...(
    [
      ['filtered-by-resource', 'Applies to', 'Orders'],
      ['filtered-by-type', 'Type', 'Short text'],
    ] as const
  ).map(
    ([state, filter, value]): Capture => ({
      screen: 'DA-SET-09',
      state,
      variant: 'admin',
      reach: async (page) => {
        await openStore(page, '/settings/custom-field-definitions')
        await page.getByRole('button', { name: 'Add filter' }).click()
        await page.getByRole('button', { name: filter, exact: true }).click()
        await page.getByText(value, { exact: true }).last().click()
        await page.keyboard.press('Escape')
        await page.waitForLoadState('networkidle')
      },
    }),
  ),
  {
    screen: 'DA-SET-09',
    state: 'create-sheet',
    variant: 'admin',
    reach: openCreate('custom-field-definitions', 'Add custom field'),
  },
  ...fieldTypes.map(
    (type): Capture => ({
      screen: 'DA-SET-09',
      state: `create-${type.toLowerCase().replace(' ', '-')}`,
      variant: 'admin',
      reach: async (page) => {
        await openCreate('custom-field-definitions', 'Add custom field')(page)
        await chooseOption(page, 'Type', type)
      },
    }),
  ),
  {
    screen: 'DA-SET-09',
    state: 'create-shown-on-storefront',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('custom-field-definitions', 'Add custom field')(page)
      await sheet(page).getByRole('switch', { name: 'Visible on storefront' }).click()
      await expect(sheet(page).getByRole('switch', { name: 'Visible on storefront' })).toBeChecked()
    },
  },
  {
    screen: 'DA-SET-09',
    state: 'edit',
    variant: 'admin',
    reach: (page) => openRecord(page, 'custom-field-definitions', 'Material'),
  },
  {
    screen: 'DA-SET-09',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'custom-field-definitions', 'Loyalty tier'),
  },

  // DA-SET-11 Markets
  ...listed('DA-SET-11', 'markets', 'Europe'),
  {
    screen: 'DA-SET-11',
    state: 'create-sheet',
    variant: 'admin',
    reach: openCreate('markets', 'Add market'),
  },
  {
    screen: 'DA-SET-11',
    state: 'create-filled',
    variant: 'admin',
    reach: async (page) => {
      await fillMarket(page)
      await sheet(page)
        .getByRole('textbox', { name: 'Name' })
        .evaluate((element) => element.scrollIntoView({ block: 'end' }))
    },
  },
  {
    screen: 'DA-SET-11',
    state: 'create-filled-tax',
    variant: 'admin',
    reach: async (page) => {
      await fillMarket(page)
      await sheet(page)
        .getByRole('button', { name: 'Create market' })
        .evaluate((element) => element.scrollIntoView({ block: 'end' }))
    },
  },
  {
    screen: 'DA-SET-11',
    state: 'regional-languages',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('markets', 'Add market')(page)
      await sheet(page).getByRole('combobox', { name: 'Supported locales' }).fill('de-')
      await expect(page.getByRole('option', { name: /Austrian German/ })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-11',
    state: 'tax-engine-open',
    variant: 'admin',
    reach: async (page) => {
      await openCreate('markets', 'Add market')(page)
      await sheet(page).getByRole('combobox', { name: 'Tax engine' }).click()
      await expect(page.getByRole('option', { name: 'Spree tax rates', exact: true })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-11',
    state: 'edit',
    variant: 'admin',
    reach: (page) => openRecord(page, 'markets', 'Europe'),
  },
  {
    screen: 'DA-SET-11',
    state: 'edit',
    variant: 'settingsViewer',
    reach: (page) => openRecord(page, 'markets', 'Europe'),
  },
  {
    screen: 'DA-SET-11',
    state: 'dragging',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/markets')
      const handle = page
        .getByRole('row')
        .filter({ hasText: 'Europe' })
        .getByRole('button', { name: 'Drag to reorder' })
      const box = await handle.boundingBox()
      if (!box) throw new Error('The drag handle has no box')
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2, box.y - 12, { steps: 8 })
      await page.mouse.move(box.x + box.width / 2, box.y - 24, { steps: 8 })
    },
  },
  {
    screen: 'DA-SET-11',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'markets', 'Europe'),
  },

  // DA-SET-21 Reasons
  ...listed('DA-SET-21', 'reasons', 'Return reasons'),
  ...(
    [
      ['claim-and-refund-reasons', 'Claim reasons'],
      ['cancellation-reasons', 'Order cancellation reasons'],
    ] as const
  ).map(
    ([state, title]): Capture => ({
      screen: 'DA-SET-21',
      state,
      variant: 'admin',
      reach: async (page) => {
        await openStore(page, '/settings/reasons')
        await toCard(page, title)
      },
    }),
  ),
  {
    screen: 'DA-SET-21',
    state: 'reason-in-use',
    variant: 'admin',
    intercepted:
      "The return reasons' answer marks Damaged/Defective as in use, which no browser-test record is",
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/return_reasons',
        async (route) => {
          if (route.request().method() !== 'GET') return route.fallback()
          const response = await route.fetch()
          const body = (await response.json()) as {
            data: { name: string; can_be_deleted: boolean }[]
          }
          await route.fulfill({
            response,
            json: {
              ...body,
              data: body.data.map((reason) =>
                reason.name === 'Damaged/Defective' ? { ...reason, can_be_deleted: false } : reason,
              ),
            },
          })
        },
      )
      await openStore(page, '/settings/reasons')
      await expect(page.getByText('In use').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-21',
    state: 'kind-with-none',
    variant: 'admin',
    intercepted: 'The claim reasons list is answered with its records taken out',
    reach: async (page) => {
      await emptied(page, 'claim_reasons')
      await openStore(page, '/settings/reasons')
      await toCard(page, 'Claim reasons')
    },
  },
  {
    screen: 'DA-SET-21',
    state: 'add',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/reasons')
      await card(page, 'Return reasons').first().getByRole('button', { name: 'Add reason' }).click()
      await expect(sheet(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-21',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'reasons', 'Accidental order'),
  },

  // DA-SET-15 Tax exemption reasons, inside the taxes layout
  ...listed('DA-SET-15', 'taxes/exemption-reasons', retiredExemptionReason.name),
  {
    screen: 'DA-SET-15',
    state: 'none',
    variant: 'admin',
    intercepted: 'The tax exemption reasons list is answered with its records taken out',
    reach: async (page) => {
      await emptied(page, 'tax_exemption_reasons')
      await openStore(page, '/settings/taxes/exemption-reasons')
    },
  },
  {
    screen: 'DA-SET-15',
    state: 'add-with-code',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/settings/taxes/exemption-reasons')
      await page.getByRole('button', { name: 'Add reason' }).click()
      await sheet(page).getByRole('textbox', { name: 'Name' }).fill('Nonprofit')
      await sheet(page).getByLabel('Code').fill('nonprofit')
      await expect(sheet(page).getByLabel('Code')).toHaveValue('NONPROFIT')
    },
  },
  {
    screen: 'DA-SET-15',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: (page) => askDelete(page, 'taxes/exemption-reasons', 'Manufacturing'),
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  developers = await seedDevelopers(baseURL)
  await seedSettings(baseURL)
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const res = await api.get('/api/v3/admin/orders?limit=1', { headers })
    expect(res.ok(), await res.text()).toBeTruthy()
    orderId = ((await res.json()) as { data: { id: string }[] }).data[0].id
  } finally {
    await api.dispose()
  }
})

test.use({ viewport: { width: 1280, height: 960 } })

/**
 * Blocks every request that would leave the local servers, and records it, as
 * the visual check does for stories. Spree's update check, the shell's one
 * call outside, runs on the server, and the test environment switches it off.
 */
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

/** Saves what the page shows now, with how it was reached, under the screen and state. */
async function save(
  page: Page,
  item: Pick<Capture, 'screen' | 'state' | 'intercepted'> & { variant: string },
  theme: 'light' | 'dark',
  settled: boolean | null,
  /** The role the variant holds, or the roles, as `staff.ts` defines them. */
  role: unknown,
  /** Requests blocked because they would have left the local servers. */
  outside: string[],
  masked?: Capture['masked'],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({
    path: `${folder}${item.variant}-${theme}.png`,
    style: masked ? paintOut(masked.selector) : undefined,
  })
  writeFileSync(
    `${folder}${item.variant}-${theme}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        role,
        theme,
        revision,
        path: new URL(page.url()).pathname
          .replace(seeded.storeId, '<store>')
          .replace(orderId, '<order>')
          .replace(/\/whe_[A-Za-z0-9]+/, '/<endpoint>'),
        viewport: page.viewportSize(),
        intercepted: item.intercepted ?? null,
        masked: masked?.what ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [...captures, ...developerCaptures, ...settingsCaptures]) {
    test(`${item.screen} ${item.state} ${item.variant} ${theme}`, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item.variant)
      await item.reach(page)
      const settled = item.loading ? null : await settle(page)
      await page.waitForTimeout(400)
      const role = item.variant in teammates ? roles[teammates[item.variant].role] : null
      await save(page, item, theme, settled, role, outside, item.masked)
      await item.after?.()
    })
  }
}

/**
 * FL-24's last step (G-07): an admin gives a teammate a role in the edit
 * teammate sheet, and the teammate's own navigation shows it the next time
 * they open the store. Unlike the captures, this asserts what changes. The
 * teammate starts each run with the support role alone (`staff.ts`) and is put
 * back afterwards.
 */
test("FL-24 a teammate's navigation after a role is given", async ({ browser }) => {
  const products = (page: Page) => page.getByRole('link', { name: /^Products/ })
  const orders = (page: Page) => page.getByRole('link', { name: /^Orders/ })

  async function asTeammate(state: string, check: (page: Page) => Promise<void>) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } })
    const page = await context.newPage()
    const outside = await blockOutside(page)
    try {
      const res = await page.request.post('/api/v3/admin/auth/login', {
        data: { email: roleChange.email, password: PASSWORD },
      })
      expect(res.ok(), await res.text()).toBeTruthy()
      await page.goto('/')
      await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
      await page.waitForLoadState('networkidle')
      await check(page)
      for (const theme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.waitForTimeout(400)
        await save(
          page,
          { screen: 'DA-OVL-01', state, variant: 'roleChange' },
          theme,
          await settle(page),
          state === 'role-given-before' ? [roles.support] : [roles.support, roles.merchandiser],
          outside,
        )
      }
    } finally {
      await context.close()
    }
  }

  try {
    await asTeammate('role-given-before', async (page) => {
      await expect(orders(page)).toBeVisible()
      await expect(products(page)).toHaveCount(0)
    })

    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } })
    const page = await context.newPage()
    try {
      await signIn(page, 'admin')
      await openStore(page, '/settings/staff')
      await openRowMenu(page, roleChange.email)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      const sheet = page.getByRole('dialog')
      await sheet.getByRole('checkbox', { name: roles.merchandiser.name, exact: true }).check()
      await sheet.getByRole('button', { name: /^save$/i }).click()
      await expect(
        page.locator('tr').filter({ hasText: roleChange.email }).getByText(roles.merchandiser.name),
      ).toBeVisible({ timeout: 15_000 })
    } finally {
      await context.close()
    }

    await asTeammate('role-given-after', async (page) => {
      await expect(products(page)).toBeVisible()
      await expect(orders(page)).toBeVisible()
    })
  } finally {
    const api = await request.newContext({ baseURL })
    try {
      const { headers } = await admin(api)
      const res = await api.patch(`/api/v3/admin/admin_users/${seeded.roleChangeId}`, {
        headers,
        data: { role_ids: [seeded.roleIds.support] },
      })
      expect(res.ok(), await res.text()).toBeTruthy()
    } finally {
      await api.dispose()
    }
  }
})

/**
 * Why DA-OVL-04's field errors are reached by answering the save: the server
 * takes what the dialog lets a teammate type. Saves a 300-letter first name,
 * then a language Spree has no translations for, as the role-change teammate,
 * records both answers, and puts the profile back.
 */
test('DA-OVL-04 what the server takes on a profile save', async () => {
  const api = await request.newContext({ baseURL })
  try {
    const res = await api.post('/api/v3/admin/auth/login', {
      data: { email: roleChange.email, password: PASSWORD },
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    const { token } = (await res.json()) as { token: string }
    const headers = { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': seeded.storeId }
    type Profile = Record<string, string | null>
    const me = async () =>
      ((await (await api.get('/api/v3/admin/me', { headers })).json()) as { user: Profile }).user
    const before = await me()
    const answers: { field: string; length: number; status: number; saved: boolean }[] = []
    try {
      for (const [field, value] of [
        ['first_name', 'x'.repeat(300)],
        ['selected_locale', 'xx'],
      ] as const) {
        const save = await api.patch('/api/v3/admin/me', { headers, data: { [field]: value } })
        answers.push({
          field,
          length: value.length,
          status: save.status(),
          saved: (await me())[field] === value,
        })
      }
    } finally {
      const restore = await api.patch('/api/v3/admin/me', {
        headers,
        data: {
          first_name: before.first_name,
          last_name: before.last_name,
          selected_locale: before.selected_locale,
        },
      })
      expect(restore.ok(), await restore.text()).toBeTruthy()
    }
    const after = await me()
    mkdirSync(`${results}DA-OVL-04/`, { recursive: true })
    writeFileSync(
      `${results}DA-OVL-04/profile-saves.json`,
      JSON.stringify(
        {
          revision,
          teammate: 'roleChange',
          answers,
          restored: ['first_name', 'last_name', 'selected_locale'].every(
            (field) => after[field] === before[field],
          ),
        },
        null,
        2,
      ),
    )
  } finally {
    await api.dispose()
  }
})
