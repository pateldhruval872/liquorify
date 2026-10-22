import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { releaseNotes, updateAvailable } from '../src/fixtures/admin/shell'
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

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
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
) {
  const folder = `${results}${item.screen}/${item.state}/`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({ path: `${folder}${item.variant}-${theme}.png` })
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
          .replace(orderId, '<order>'),
        viewport: page.viewportSize(),
        intercepted: item.intercepted ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of captures) {
    test(`${item.screen} ${item.state} ${item.variant} ${theme}`, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item.variant)
      await item.reach(page)
      const settled = item.loading ? null : await settle(page)
      await page.waitForTimeout(400)
      const role = item.variant in teammates ? roles[teammates[item.variant].role] : null
      await save(page, item, theme, settled, role, outside)
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
