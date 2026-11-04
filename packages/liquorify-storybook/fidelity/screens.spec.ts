import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import {
  addRecordFilter,
  addTextFilter,
  clickBulkAction,
  getCredentials,
  login,
  narrowQuickFilter,
  rowButton,
  searchList,
  sortList,
  switchAdminLocale,
} from '../../dashboard/e2e/helpers'
import { releaseNotes, updateAvailable } from '../src/fixtures/admin/shell'
import {
  type Catalog,
  products as catalogProducts,
  deleteProductsNamed,
  fixture,
  handbook,
  kettle,
  libraryFile,
  pdf,
  seedCatalog,
  translateProduct,
  updateProduct,
  videoLink,
} from './catalog'
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
import {
  category as coffeeCategory,
  createPriceList,
  deletePriceListsNamed,
  emptyPriceList,
  type Merchandising,
  catalogs as merchandisingCatalogs,
  collections as merchandisingCollections,
  priceLists as merchandisingPriceLists,
  seedMerchandising,
  updateRecord,
} from './merchandising'
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
let catalog: Catalog
let merchandising: Merchandising

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

/** The four roles of batch 5 part 1 (§2.2): every control, the merchandiser template, read only, and none. */
const catalogVariants = ['admin', 'merchandiser', 'catalogViewer'] as const

const productsPath = '/products'
const productRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('link', { name, exact: true }) })

const openProducts = async (page: Page) => {
  await openStore(page, productsPath)
  await expect(productRow(page, catalogProducts.scheduled)).toBeVisible({ timeout: 15_000 })
}

const chooseRows = async (page: Page, ...names: string[]) => {
  await openProducts(page)
  for (const name of names) {
    await productRow(page, name)
      .getByRole('checkbox', { name: /select row/i })
      .check()
  }
  await expect(page.getByText(`${names.length} selected`, { exact: true })).toBeVisible()
}

/** Two rows chosen and one bulk action opened, as far as its dialog. */
const bulkDialog = (action: RegExp, title: string) => async (page: Page) => {
  await chooseRows(page, catalogProducts.draft, catalogProducts.soldOut)
  await clickBulkAction(page, action)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

/** A list whose request is answered with a server error, after the dashboard asks again. */
const listFails = (path: RegExp) => async (page: Page) => {
  await page.route(
    (url) => path.test(url.pathname),
    (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 500,
            json: { error: { code: 'internal_error', message: 'Internal error' } },
          })
        : route.fallback(),
  )
}

const searchProducts = async (page: Page, text: string, shows: string | null) => {
  await openProducts(page)
  await searchList(page, /^search…$/i, text)
  if (shows) await expect(productRow(page, shows)).toBeVisible({ timeout: 15_000 })
  else await expect(page.getByText('No results', { exact: true })).toBeVisible({ timeout: 15_000 })
}

const productCaptures: Capture[] = [
  // DA-PRD-01 Products
  ...catalogVariants.map(
    (variant): Capture => ({ screen: 'DA-PRD-01', state: 'listed', variant, reach: openProducts }),
  ),
  directVisit('DA-PRD-01', productsPath),
  {
    screen: 'DA-PRD-01',
    state: 'listed-narrow',
    variant: 'admin',
    phone: true,
    reach: openProducts,
  },
  {
    screen: 'DA-PRD-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The product list request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/products$/, 'hold')
      await page.goto(`/${seeded.storeId}${productsPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'no-products',
    variant: 'admin',
    intercepted: 'The product list is answered with no products',
    reach: async (page) => {
      await emptied(page, 'products')
      await openStore(page, productsPath)
      await expect(page.getByText('No results', { exact: true })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The product list request is answered with a server error',
    reach: async (page) => {
      await listFails(/^\/api\/v3\/admin\/products$/)(page)
      await page.goto(`/${seeded.storeId}${productsPath}`)
      await page.waitForTimeout(12_000)
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'searched-by-name',
    variant: 'admin',
    reach: (page) => searchProducts(page, 'Fidelity', catalogProducts.draft),
  },
  {
    screen: 'DA-PRD-01',
    state: 'searched-by-sku',
    variant: 'admin',
    reach: (page) => searchProducts(page, 'ELECTRIC-KETTLE-1-7L-WHITE', 'Electric Kettle 1.7L'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: (page) => searchProducts(page, 'no product has this name', null),
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-status',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await narrowQuickFilter(page, /^status/i, /^draft$/i)
      await expect(productRow(page, catalogProducts.draft)).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-price',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await addTextFilter(page, /^price$/i, /^greater than$/i, '300')
      await expect(productRow(page, 'Air Purifier Pro')).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-category',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await addRecordFilter(page, /^categories$/i, 'Kettles')
      await expect(productRow(page, 'Electric Kettle 1.7L')).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-channel',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await addRecordFilter(page, /^sales channels$/i, 'Point of Sale')
      await expect(productRow(page, 'Electric Kettle 1.7L')).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-product-type',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await addRecordFilter(page, /^product type$/i, 'Digital')
      await expect(productRow(page, handbook)).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-tags',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await addRecordFilter(page, /^tags$/i, 'espresso')
      await expect(productRow(page, 'Automatic Espresso Machine')).toBeVisible({ timeout: 15_000 })
      await expect(productRow(page, catalogProducts.scheduled)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-01',
    // The panel offers only the first 50 product tags by name, which the
    // server sends when it is not searching, and filters those in the browser.
    state: 'tag-filter-missing-a-tag',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^tags$/i)
        .click()
      await page.getByPlaceholder(/filter to…/i).fill('handmade')
      await expect(page.getByRole('dialog').getByText('No results', { exact: true })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'sorted-by-price',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await sortList(page, /^price$/i, 'descending')
      await expect(page.getByRole('row').nth(1)).toContainText('Automatic Espresso Machine', {
        timeout: 15_000,
      })
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-01',
      state: 'rows-chosen',
      variant,
      reach: (page) => chooseRows(page, catalogProducts.draft, catalogProducts.soldOut),
    }),
  ),
  {
    screen: 'DA-PRD-01',
    state: 'more-bulk-actions',
    variant: 'admin',
    reach: async (page) => {
      await chooseRows(page, catalogProducts.draft, catalogProducts.soldOut)
      await page.getByRole('button', { name: /more actions/i }).click()
      await expect(page.getByRole('menuitem').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-set-status',
    variant: 'admin',
    reach: bulkDialog(/set status/i, 'Set product status'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-add-to-categories',
    variant: 'admin',
    reach: bulkDialog(/^add to categories/i, 'Add to categories'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-add-to-collections',
    variant: 'admin',
    reach: bulkDialog(/^add to collections/i, 'Add to collections'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-add-to-channels',
    variant: 'admin',
    reach: bulkDialog(/^add to sales channels/i, 'Add to sales channels'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-remove-from-channels',
    variant: 'admin',
    reach: bulkDialog(/^remove from sales channels/i, 'Remove from sales channels'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-add-tags',
    variant: 'admin',
    reach: bulkDialog(/^add tags/i, 'Add tags'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'bulk-delete-confirmation',
    variant: 'admin',
    reach: bulkDialog(/^delete$/i, 'Delete 2 products?'),
  },
  {
    screen: 'DA-PRD-01',
    state: 'row-actions',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await openRowMenu(page, catalogProducts.draft)
      await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'row-delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await openRowMenu(page, catalogProducts.draft)
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-01',
    state: 'duplicated',
    variant: 'admin',
    reach: async (page) => {
      await openProducts(page)
      await openRowMenu(page, catalogProducts.draft)
      await page.getByRole('menuitem', { name: 'Duplicate' }).click()
      await expect(
        page.getByRole('heading', { name: `COPY OF ${catalogProducts.draft}` }),
      ).toBeVisible({ timeout: 15_000 })
    },
    after: () => removeProducts(`COPY OF ${catalogProducts.draft}`),
  },
]

const newProductPath = `${productsPath}/new`
const newProduct = 'Fidelity glazed bowl'

/** A card on a product's page, by its exact title. */
const productCard = (page: Page, title: string) =>
  page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${title}$`) }),
  })

/**
 * A YouTube link shows YouTube's own still, which captures may not reach, so
 * the still is a local picture, unlike the poster the mug's uploaded video has.
 */
const localYouTubeStill = (page: Page) =>
  page.route(
    (url) => url.hostname === 'img.youtube.com',
    (route) => route.fulfill({ contentType: 'image/png', body: fixture('product-olive.png') }),
  )
const youTubeStill = "YouTube's still for the video link is answered with a local picture"

/** Moves the pointer off the controls a step clicked, so no hover shows. */
const rest = (page: Page) => page.mouse.move(700, 95)

/** A text cell of the prices or stock grid, typed into as a merchant does. */
const fillCell = async (page: Page, name: RegExp, value: string) => {
  const cell = page.getByRole('textbox', { name })
  await cell.dblclick()
  await cell.fill(value)
  await cell.blur()
}

const openNewProduct = async (page: Page) => {
  await openStore(page, newProductPath)
  await expect(page.getByRole('heading', { name: 'New product' })).toBeVisible()
}

const startProduct = async (page: Page) => {
  await openNewProduct(page)
  await page.getByRole('textbox', { name: 'Name' }).fill(newProduct)
}

const chooseColours = async (page: Page) => {
  const variants = productCard(page, 'Variants')
  await variants.getByRole('button', { name: /add option/i }).click()
  await variants.getByRole('combobox').first().click()
  await page.getByRole('option', { name: 'Color', exact: true }).click()
  for (const value of ['White', 'Black', 'Mint']) {
    await variants.getByRole('button', { name: value, exact: true }).click()
  }
}

const buildVariants = async (page: Page) => {
  await startProduct(page)
  await chooseColours(page)
  const variants = productCard(page, 'Variants')
  await variants.getByRole('button', { name: /^done$/i }).click()
  const skus = variants.getByRole('textbox', { name: /^sku$/i })
  await expect(skus).toHaveCount(3)
  for (const [index, sku] of ['FID-BOWL-WHITE', 'FID-BOWL-BLACK', 'FID-BOWL-MINT'].entries()) {
    await skus.nth(index).fill(sku)
  }
}

const addPicture = async (page: Page) => {
  await productCard(page, 'Media')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'glazed-bowl.png',
      mimeType: 'image/png',
      buffer: fixture('product-clay.png'),
    })
}

const addVideoLink = async (page: Page, link: string) => {
  await productCard(page, 'Media')
    .getByRole('button', { name: /add video link/i })
    .click()
  await sheet(page)
    .getByLabel(/video link/i)
    .fill(link)
  await sheet(page)
    .getByRole('button', { name: /^add video$/i })
    .click()
}

const manageChannels = async (page: Page) => {
  await productCard(page, 'Publishing')
    .getByRole('button', { name: /^manage$/i })
    .click()
  await expect(sheet(page).getByRole('heading', { name: 'Manage sales channels' })).toBeVisible()
}

/** Asks to create a product whose address another product already has. */
const refusedProduct = async (page: Page) => {
  await startProduct(page)
  await productCard(page, 'SEO').getByRole('textbox', { name: 'Slug' }).fill('electric-kettle-1-7l')
  await page.getByRole('button', { name: /^create product$/i }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Slug has already been taken' }),
  ).toBeVisible({
    timeout: 15_000,
  })
}

const newProductCaptures: Capture[] = [
  // DA-PRD-02 New product
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({ screen: 'DA-PRD-02', state: 'empty', variant, reach: openNewProduct }),
  ),
  { ...directVisit('DA-PRD-02', newProductPath), variant: 'catalogViewer' },
  directVisit('DA-PRD-02', newProductPath),
  {
    screen: 'DA-PRD-02',
    state: 'empty-narrow',
    variant: 'admin',
    phone: true,
    reach: openNewProduct,
  },
  {
    screen: 'DA-PRD-02',
    state: 'type-chosen',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await productCard(page, 'Categorization').getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Kitchen Appliance' }).click()
      await expect(page.getByText('This type adds Color to new products.')).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'one-price',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await fillCell(page, /^price for default$/i, '24.00')
      await fillCell(page, /^compare-at price for default$/i, '30.00')
      await toCard(page, 'Prices')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'option-values',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await chooseColours(page)
      await toCard(page, 'Variants')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'variants-built',
    variant: 'admin',
    reach: async (page) => {
      await buildVariants(page)
      await toCard(page, 'Variants')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'bulk-variants',
    variant: 'admin',
    reach: async (page) => {
      await buildVariants(page)
      await productCard(page, 'Variants')
        .getByRole('button', { name: /bulk edit/i })
        .click()
      await expect(page.getByRole('heading', { name: 'Bulk edit variants' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'variant-sheet',
    variant: 'admin',
    reach: async (page) => {
      await buildVariants(page)
      await productCard(page, 'Variants')
        .getByRole('button', { name: /^edit color: black$/i })
        .click()
      await expect(page.getByRole('heading', { name: 'Edit variant — Color: Black' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'second-currency',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await fillCell(page, /^price for default$/i, '24.00')
      await productCard(page, 'Prices').getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'EUR' }).click()
      await fillCell(page, /^price for default$/i, '22.00')
      await toCard(page, 'Prices')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'stock',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await fillCell(page, /^on hand at shop location$/i, '6')
      await fillCell(page, /^on hand at e2e destination warehouse$/i, '2')
      await page.getByRole('switch', { name: 'Allow backorder at Shop location' }).click()
      await toCard(page, 'Inventory')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'media-added',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await addPicture(page)
      const media = productCard(page, 'Media')
      await expect(media.locator('img[src]').first()).toBeVisible({ timeout: 15_000 })
      await expect(media.locator('.animate-spin')).toHaveCount(0, { timeout: 15_000 })
      await toCard(page, 'Media')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'media-uploading',
    variant: 'admin',
    intercepted: 'The file upload request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'POST', /^\/api\/v3\/admin\/files$/, 'hold')
      await startProduct(page)
      await addPicture(page)
      await expect(productCard(page, 'Media').locator('.animate-spin').first()).toBeVisible()
      await toCard(page, 'Media')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'media-remove-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await addPicture(page)
      const media = productCard(page, 'Media')
      await expect(media.locator('.animate-spin')).toHaveCount(0, { timeout: 15_000 })
      await toCard(page, 'Media')
      await media.locator('[data-slot="media-thumbnail"]').first().click({ button: 'right' })
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'media-removed',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await addPicture(page)
      const media = productCard(page, 'Media')
      await expect(media.locator('.animate-spin')).toHaveCount(0, { timeout: 15_000 })
      await toCard(page, 'Media')
      await media.locator('[data-slot="media-thumbnail"]').first().click({ button: 'right' })
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await confirmation(page)
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(media.locator('[data-slot="media-thumbnail"]')).toHaveCount(0)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'video-added',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await localYouTubeStill(page)
      await startProduct(page)
      await addVideoLink(page, videoLink)
      const media = productCard(page, 'Media')
      await expect(media.locator('[data-slot="media-thumbnail"]')).toHaveCount(1)
      await expect(media.locator('img[src]').first()).toBeVisible({ timeout: 15_000 })
      await toCard(page, 'Media')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'video-link-refused',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await addVideoLink(page, 'https://example.com/clip.mp4')
      await expect(sheet(page).getByText(/youtube or vimeo/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'channels-default',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await manageChannels(page)
      await expect(sheet(page).getByRole('button', { name: /online store/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'channel-added',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await manageChannels(page)
      await sheet(page)
        .getByRole('button', { name: /^wholesale/i })
        .click()
      await sheet(page)
        .getByRole('button', { name: /^done$/i })
        .click()
      await expect(productCard(page, 'Publishing').getByText('Wholesale')).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'default-unticked',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      await manageChannels(page)
      await sheet(page)
        .getByRole('button', { name: /^online store/i })
        .click()
      await sheet(page)
        .getByRole('button', { name: /^done$/i })
        .click()
      await expect(
        productCard(page, 'Publishing').getByText(/not listed on any sales channel/i),
      ).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    // The window opens on the 15th of the month after the run, so its dates
    // follow the day the capture is made.
    state: 'publication-window',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      const publishing = productCard(page, 'Publishing')
      await publishing.getByRole('button', { name: /online store/i }).click()
      await publishing
        .getByRole('group')
        .filter({ hasText: /^publish from/i })
        .getByRole('button')
        .first()
        .click()
      const calendar = page.getByRole('dialog')
      await calendar.getByRole('button', { name: /next month/i }).click()
      await calendar.getByRole('gridcell', { name: '15' }).click()
      await expect(publishing.getByText('Live immediately', { exact: true })).toBeHidden()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'categorized',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      const categorization = productCard(page, 'Categorization')
      await categorization
        .getByRole('group')
        .filter({ has: page.getByText('Categories', { exact: true }) })
        .getByRole('combobox')
        .fill('Kitchen')
      await page
        .getByRole('option', { name: /^kitchen$/i })
        .first()
        .click()
      const tags = categorization.getByRole('combobox', { name: /type to add tags/i })
      for (const tag of ['handmade', 'stoneware']) {
        await tags.fill(tag)
        await tags.press('Enter')
      }
      await productCard(page, 'Tax').getByRole('combobox').click()
      await page.getByRole('option', { name: 'Non-taxable' }).click()
      await toCard(page, 'Categorization')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'custom-fields',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      const fields = productCard(page, 'Custom fields')
      await fields.getByRole('textbox', { name: 'Material' }).fill('Stoneware')
      await fields.getByRole('textbox', { name: 'Capacity' }).fill('450 ml')
      await fields.getByRole('textbox', { name: 'Care instructions' }).fill('Dishwasher safe')
      await fields.getByRole('spinbutton', { name: 'Release year' }).fill('2026')
      await toCard(page, 'Custom fields')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'digital-file',
    variant: 'admin',
    reach: async (page) => {
      await startProduct(page)
      const files = productCard(page, 'Digital files')
      await files
        .locator('input[type="file"]')
        .setInputFiles({ name: 'glazing-guide.pdf', mimeType: 'application/pdf', buffer: pdf })
      await expect(files.getByText('glazing-guide.pdf')).toBeVisible({ timeout: 15_000 })
      await toCard(page, 'Digital files')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'refused',
    variant: 'admin',
    reach: async (page) => {
      await refusedProduct(page)
      await page.getByRole('heading', { name: 'New product' }).scrollIntoViewIfNeeded()
      await page
        .getByRole('alert')
        .filter({ hasText: 'Slug has already been taken' })
        .evaluate((element) => element.scrollIntoView({ block: 'center' }))
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'refused-field',
    variant: 'admin',
    reach: async (page) => {
      await refusedProduct(page)
      await toCard(page, 'SEO')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-02',
    state: 'saving',
    variant: 'admin',
    intercepted: 'The create request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'POST', /^\/api\/v3\/admin\/products$/, 'hold')
      await startProduct(page)
      await page.getByRole('button', { name: /^create product$/i }).click()
      await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled()
      await rest(page)
    },
  },
]

const productPath = (id: string) => `${productsPath}/${id}`

/** Opens a product's page, by its id from the seeded catalog, once its name shows. */
const openProduct = async (page: Page, id: keyof Catalog['ids'], name: string) => {
  await openStore(page, productPath(catalog.ids[id]))
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 15_000 })
}

const openKettle = (page: Page) => openProduct(page, 'kettle', kettle)
/**
 * The kettle's page scrolled to one card while that card's request is held, so
 * the network never goes quiet. Instead the scroll waits until every other card
 * has stopped loading and the page's pictures have arrived, since the cards
 * above the held one grow as they do.
 */
const kettleHoldingAtCard = (title: string) => async (page: Page) => {
  await page.goto(`/${seeded.storeId}${productPath(catalog.ids.kettle)}`)
  await expect(page.getByRole('heading', { name: kettle, level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  await page.waitForFunction(
    (heldTitle) => {
      const held = [...document.querySelectorAll('[data-slot="card"]')].find(
        (card) => card.querySelector('[data-slot="card-title"]')?.textContent?.trim() === heldTitle,
      )
      const elsewhere = (element: Element) =>
        !held?.contains(element) && (element as HTMLElement).offsetParent !== null
      const skeletons = [...document.querySelectorAll('[data-slot="skeleton"]')].filter(elsewhere)
      const loading = [...document.querySelectorAll('main *')].filter(
        (element) =>
          element.childElementCount === 0 &&
          /^Loading/.test(element.textContent?.trim() ?? '') &&
          elsewhere(element),
      )
      return (
        skeletons.length === 0 &&
        loading.length === 0 &&
        [...document.images].every((image) => image.complete)
      )
    },
    title,
    { timeout: 20_000 },
  )
  await page.waitForTimeout(1500)
  await toCard(page, title)
  await rest(page)
}
const openMug = (page: Page) => openProduct(page, 'scheduled', catalogProducts.scheduled)
const openHandbook = (page: Page) => openProduct(page, 'handbook', handbook)
const openLamp = (page: Page) => openProduct(page, 'draft', catalogProducts.draft)

/** A product page scrolled to one card, with the pointer off the controls. */
const productAtCard =
  (open: (page: Page) => Promise<void>, title: string) => async (page: Page) => {
    await open(page)
    await toCard(page, title)
    await rest(page)
  }

/** The admin's language for one capture, put back after it whatever happens. */
let restoreLocale: (() => Promise<void>) | null = null

/** Asks to save the draft lamp under an address another product already has. */
const refusedSave = async (page: Page) => {
  await openLamp(page)
  await productCard(page, 'SEO').getByRole('textbox', { name: 'Slug' }).fill('electric-kettle-1-7l')
  await page.getByRole('button', { name: /^save product$/i }).click()
  await expect(productCard(page, 'SEO').getByText('has already been taken')).toBeVisible({
    timeout: 15_000,
  })
}

const productPageCaptures: Capture[] = [
  // DA-PRD-03 Product
  ...catalogVariants.map(
    (variant): Capture => ({ screen: 'DA-PRD-03', state: 'active', variant, reach: openKettle }),
  ),
  {
    screen: 'DA-PRD-03',
    state: 'direct-visit',
    variant: 'orderManager',
    reach: (page) => openStore(page, productPath(catalog.ids.kettle)),
  },
  { screen: 'DA-PRD-03', state: 'active-narrow', variant: 'admin', phone: true, reach: openKettle },
  { screen: 'DA-PRD-03', state: 'draft', variant: 'admin', reach: openLamp },
  {
    screen: 'DA-PRD-03',
    state: 'archived',
    variant: 'admin',
    reach: (page) => openProduct(page, 'archived', catalogProducts.archived),
  },
  {
    screen: 'DA-PRD-03',
    state: 'scheduled',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await localYouTubeStill(page)
      await openMug(page)
      await expect(productCard(page, 'Publishing').getByText('Scheduled')).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'more-actions',
    variant: 'admin',
    reach: async (page) => {
      await openLamp(page)
      await page.getByRole('button', { name: 'More actions' }).click()
      await expect(page.getByRole('menuitem', { name: 'Delete product' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'description-edited',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      const description = page.locator('#product-description')
      await description.click()
      await description.press('Control+End')
      await description.press('Enter')
      await page.getByRole('button', { name: 'Bold' }).click()
      await description.pressSequentially('Now also in matte black.')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'variants',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Variants'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'variant-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Variants')
        .getByRole('button', { name: /^edit color: white$/i })
        .click()
      await expect(page.getByRole('heading', { name: 'Edit variant — Color: White' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'prices',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Prices'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'prices-second-currency',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Prices').getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'EUR' }).click()
      await toCard(page, 'Prices')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'price-cells-chosen',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await toCard(page, 'Prices')
      await page.getByRole('textbox', { name: 'Price for Color: White', exact: true }).click()
      await page
        .getByRole('textbox', { name: 'Price for Color: Stainless Steel', exact: true })
        .click({ modifiers: ['Shift'] })
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'price-shift-arrow',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await toCard(page, 'Prices')
      await page.getByRole('textbox', { name: 'Price for Color: White', exact: true }).click()
      await page.keyboard.press('Shift+ArrowDown')
      await page.keyboard.press('Shift+ArrowDown')
      await expect(
        page.getByRole('textbox', { name: 'Price for Color: Stainless Steel', exact: true }),
      ).toBeFocused()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'price-typed-english',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Prices').getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'EUR' }).click()
      await fillCell(page, /^price for color: white$/i, '1234.50')
      await toCard(page, 'Prices')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    // A German admin's whole dashboard is in German, and the cell takes a comma.
    state: 'price-typed-german',
    variant: 'admin',
    reach: async (page) => {
      restoreLocale = await switchAdminLocale(page, 'de')
      await openKettle(page)
      const prices = page
        .locator('[data-slot="card"]')
        .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Preise$/ }) })
      await prices.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'EUR' }).click()
      const cell = prices.getByRole('textbox').first()
      await cell.dblclick()
      await cell.fill('1.234,50')
      await cell.blur()
      await toCard(page, 'Preise')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'stock',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Inventory'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'stock-cell-chosen',
    variant: 'admin',
    reach: async (page) => {
      await productAtCard(openKettle, 'Inventory')(page)
      await page.getByRole('textbox', { name: 'On hand at Shop location' }).first().click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'stock-history',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Inventory').getByRole('button', { name: 'Stock history' }).click()
      await expect(page.getByRole('heading', { name: 'Stock history' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'media',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Media'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'media-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await toCard(page, 'Media')
      await productCard(page, 'Media').locator('[data-slot="media-thumbnail"]').first().click()
      await expect(page.getByRole('heading', { name: 'Edit media' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'videos',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await localYouTubeStill(page)
      await productAtCard(openMug, 'Media')(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'video-with-poster',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await localYouTubeStill(page)
      await openMug(page)
      await toCard(page, 'Media')
      await productCard(page, 'Media').locator('[data-slot="media-thumbnail"]').nth(1).click()
      await expect(page.getByRole('heading', { name: 'Edit media' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'digital-files',
    variant: 'admin',
    reach: productAtCard(openHandbook, 'Digital files'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'publishing',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Publishing')
        .getByRole('button', { name: /^manage$/i })
        .click()
      await expect(
        sheet(page).getByRole('heading', { name: 'Manage sales channels' }),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'channel-unlisted',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      const publishing = productCard(page, 'Publishing')
      await publishing.getByRole('button', { name: /^manage$/i }).click()
      await sheet(page)
        .getByRole('button', { name: /^wholesale/i })
        .click()
      await sheet(page)
        .getByRole('button', { name: /^done$/i })
        .click()
      await expect(publishing.getByText('Wholesale')).toBeHidden()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'channel-listed',
    variant: 'admin',
    reach: async (page) => {
      await openLamp(page)
      const publishing = productCard(page, 'Publishing')
      await publishing.getByRole('button', { name: /^manage$/i }).click()
      await sheet(page)
        .getByRole('button', { name: /^online store/i })
        .click()
      await sheet(page)
        .getByRole('button', { name: /^done$/i })
        .click()
      await expect(publishing.getByText('Online Store')).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'categorization',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Categorization'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'variant-tax-category',
    variant: 'admin',
    reach: productAtCard(openHandbook, 'Tax'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'search-engine',
    variant: 'admin',
    reach: productAtCard(openKettle, 'SEO'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'translations',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Translations'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'translations-loading',
    variant: 'admin',
    intercepted: "The product's translations request is held open",
    loading: true,
    reach: async (page) => {
      await interrupt(
        page,
        'GET',
        /^\/api\/v3\/admin\/products\/prod_[A-Za-z0-9]+\/translations$/,
        'hold',
      )
      await kettleHoldingAtCard('Translations')(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'translations-failed',
    variant: 'admin',
    intercepted: "The product's translations request is answered with a server error",
    reach: async (page) => {
      await listFails(/^\/api\/v3\/admin\/products\/prod_[A-Za-z0-9]+\/translations$/)(page)
      await productAtCard(openKettle, 'Translations')(page)
      await page.waitForTimeout(12_000)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'translations-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Translations')
        .getByRole('button', { name: 'Manage translations' })
        .click()
      await expect(page.getByRole('heading', { name: 'Translations' })).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'name de' })).toHaveValue(
        'Elektrischer Wasserkocher 1.7L',
      )
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'translations-saved',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await productCard(page, 'Translations')
        .getByRole('button', { name: 'Manage translations' })
        .click()
      await page
        .getByRole('textbox', { name: 'name de' })
        .fill('Elektrischer Wasserkocher 1,7 Liter')
      await page.getByRole('dialog').getByRole('button', { name: /^save/i }).click()
      await expect(page.getByText('Translations saved', { exact: true })).toBeAttached()
      await expect(page.getByRole('textbox', { name: 'name de' })).toHaveValue(
        'Elektrischer Wasserkocher 1,7 Liter',
      )
      await rest(page)
    },
    after: () =>
      translateProduct(baseURL, catalog.ids.kettle, 'de', {
        name: 'Elektrischer Wasserkocher 1.7L',
      }),
  },
  {
    screen: 'DA-PRD-03',
    state: 'custom-fields',
    variant: 'admin',
    reach: productAtCard(openKettle, 'Custom fields'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'custom-fields-type-loading',
    variant: 'admin',
    intercepted: "The product type's request is held open",
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/product_types\/pt_[A-Za-z0-9]+$/, 'hold')
      await kettleHoldingAtCard('Custom fields')(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'metadata',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await localYouTubeStill(page)
      await productAtCard(openMug, 'Metadata')(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'unsaved',
    variant: 'admin',
    reach: async (page) => {
      await openKettle(page)
      await page.getByRole('textbox', { name: 'Name' }).fill('Electric Kettle 1.7L, rapid boil')
      await expect(page.getByRole('button', { name: /^discard$/i })).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openLamp(page)
      await productCard(page, 'SEO')
        .getByRole('textbox', { name: 'Meta title' })
        .fill('Fidelity desk lamp | Brass and linen')
      await page.getByRole('button', { name: /^save product$/i }).click()
      await expect(page.getByRole('button', { name: /^save product$/i })).toBeDisabled({
        timeout: 15_000,
      })
      await rest(page)
    },
    after: () => updateProduct(baseURL, catalog.ids.draft, { meta_title: null }),
  },
  {
    screen: 'DA-PRD-03',
    state: 'refused',
    variant: 'admin',
    reach: async (page) => {
      await refusedSave(page)
      await toCard(page, 'SEO')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'failed',
    variant: 'admin',
    intercepted: "The product's request is answered with a server error",
    reach: async (page) => {
      await listFails(/^\/api\/v3\/admin\/products\/prod_[A-Za-z0-9]+$/)(page)
      await page.goto(`/${seeded.storeId}${productPath(catalog.ids.kettle)}`)
      await page.waitForTimeout(12_000)
    },
  },
]

const mediaPath = `${productsPath}/media`
const mediaTile = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ hasText: name }).getByRole('button').first()

const openMedia = async (page: Page) => {
  await localYouTubeStill(page)
  await openStore(page, mediaPath)
  await expect(page.getByRole('heading', { name: 'Media', level: 1 })).toBeVisible()
  await expect(mediaTile(page, libraryFile)).toBeVisible({ timeout: 15_000 })
}

const askDeleteFile = async (page: Page, name: string) => {
  await openMedia(page)
  await mediaTile(page, name).click({ button: 'right' })
  await page.getByRole('menuitem', { name: /^delete$/i }).click()
  await expect(page.getByRole('heading', { name: 'Delete this file?' })).toBeVisible()
}

const optionsPath = `${productsPath}/options`
const openOptions = async (page: Page) => {
  await openStore(page, optionsPath)
  await expect(page.getByRole('button', { name: 'color Color' })).toBeVisible({ timeout: 15_000 })
}
const openColour = async (page: Page) => {
  await openOptions(page)
  await page.getByRole('button', { name: 'color Color' }).click()
  await expect(sheet(page).getByRole('heading', { name: 'color' })).toBeVisible()
}

const productTypesPath = '/settings/product-types'
const openProductTypes = async (page: Page) => {
  await openStore(page, productTypesPath)
  await expect(page.getByText('Kitchen Appliance', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
}
const openNewProductType = async (page: Page) => {
  await openProductTypes(page)
  await page
    .getByRole('button', { name: /add product type|new product type/i })
    .first()
    .click()
  await expect(sheet(page).getByRole('heading', { name: 'New product type' })).toBeVisible()
}

const libraryCaptures: Capture[] = [
  // DA-PRD-04 Media library
  ...(['admin', 'catalogViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-04',
      state: 'listed',
      variant,
      intercepted: youTubeStill,
      reach: openMedia,
    }),
  ),
  // The merchandiser template holds nothing on media, so its menu has no Media entry.
  {
    ...directVisit('DA-PRD-04', mediaPath),
    variant: 'merchandiser',
    reach: async (page) => {
      await openStore(page, mediaPath)
      await expect(page.getByText('No files yet. Upload one to get started.')).toBeVisible()
    },
  },
  directVisit('DA-PRD-04', mediaPath),
  {
    screen: 'DA-PRD-04',
    state: 'listed-narrow',
    variant: 'admin',
    phone: true,
    intercepted: youTubeStill,
    reach: openMedia,
  },
  {
    screen: 'DA-PRD-04',
    state: 'no-files',
    variant: 'admin',
    intercepted: 'The library request is answered with no files',
    reach: async (page) => {
      await emptied(page, 'media')
      await openStore(page, mediaPath)
      await expect(page.getByRole('heading', { name: 'Media', level: 1 })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'unused-only',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await openMedia(page)
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Not used yet' }).click()
      await expect(mediaTile(page, 'Stoneware mug, side view')).toBeHidden({ timeout: 15_000 })
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'videos-only',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await openMedia(page)
      await page.getByRole('combobox').nth(1).click()
      await page.getByRole('option', { name: 'Videos', exact: true }).click()
      await expect(mediaTile(page, libraryFile)).toBeHidden({ timeout: 15_000 })
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'uploading',
    variant: 'admin',
    intercepted: 'The file upload request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'POST', /^\/api\/v3\/admin\/files$/, 'hold')
      await openMedia(page)
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
          name: 'spring-banner.png',
          mimeType: 'image/png',
          buffer: fixture('banner-lilac.png'),
        })
      await page.waitForTimeout(1_000)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'describing',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await openMedia(page)
      await mediaTile(page, libraryFile).click()
      await expect(sheet(page).getByText('Not used anywhere')).toBeVisible()
      await sheet(page).locator('#media-alt').fill('Lilac banner for the spring sale')
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'where-used',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: async (page) => {
      await openMedia(page)
      await mediaTile(page, 'Stoneware mug, side view').click()
      await expect(sheet(page).getByRole('link', { name: catalogProducts.scheduled })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-04',
    state: 'delete-in-use',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: (page) => askDeleteFile(page, 'Stoneware mug, side view'),
  },
  {
    screen: 'DA-PRD-04',
    state: 'delete-unused',
    variant: 'admin',
    intercepted: youTubeStill,
    reach: (page) => askDeleteFile(page, libraryFile),
  },

  // DA-PRD-05 Options
  ...catalogVariants.map(
    (variant): Capture => ({ screen: 'DA-PRD-05', state: 'listed', variant, reach: openOptions }),
  ),
  directVisit('DA-PRD-05', optionsPath),
  {
    screen: 'DA-PRD-05',
    state: 'filtered-by-kind',
    variant: 'admin',
    reach: async (page) => {
      await openOptions(page)
      await narrowQuickFilter(page, /^kind/i, /^color swatch$/i)
      await expect(page.getByRole('button', { name: 'condition Condition' })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-PRD-05',
    state: 'none',
    variant: 'admin',
    intercepted: 'The option type list is answered with no option types',
    reach: async (page) => {
      await emptied(page, 'option_types')
      await openStore(page, optionsPath)
      await expect(page.getByText('No option types yet', { exact: true })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-05',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openOptions(page)
      await page.getByRole('button', { name: /add option type/i }).click()
      const create = sheet(page)
      await create.getByRole('textbox', { name: 'Label' }).first().fill('Glaze')
      await create.getByRole('textbox', { name: 'Internal name' }).first().fill('glaze')
      await create.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Color swatch' }).click()
      for (const [index, [name, label, colour]] of [
        ['celadon', 'Celadon', '#9CBFA7'],
        ['tenmoku', 'Tenmoku', '#5A3A22'],
        ['shino', 'Shino', '#E8D8C3'],
      ].entries()) {
        await create.getByRole('button', { name: /add option value/i }).click()
        const row = create
          .locator('tbody tr')
          .filter({ has: page.getByLabel('Internal name') })
          .nth(index)
        await row.getByLabel('Internal name').fill(name)
        await row.getByLabel('Label').fill(label)
        await row.getByRole('button', { name: 'Pick a color' }).click()
        const picker = row.getByRole('dialog', { name: 'Pick a color' })
        await picker.getByRole('textbox').fill(colour)
        await picker.getByRole('textbox').press('Enter')
        await row.getByRole('button', { name: new RegExp(`change color|${colour}`, 'i') }).click()
      }
      await create
        .locator('tbody tr')
        .filter({ has: page.getByLabel('Internal name') })
        .first()
        .locator('input[type="file"]')
        .setInputFiles({
          name: 'celadon.png',
          mimeType: 'image/png',
          buffer: fixture('product-olive.png'),
        })
      await page.waitForTimeout(1_000)
      await rest(page)
    },
  },
  { screen: 'DA-PRD-05', state: 'edit', variant: 'admin', reach: openColour },
  {
    screen: 'DA-PRD-05',
    state: 'values-reordered',
    variant: 'admin',
    reach: async (page) => {
      await openColour(page)
      const grips = sheet(page).getByRole('button', { name: 'Drag to reorder' })
      const from = await grips.nth(0).boundingBox()
      const to = await grips.nth(2).boundingBox()
      if (!from || !to) throw new Error('The value rows have no grips to drag')
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(from.x + from.width / 2, to.y + to.height / 2 + 4, { steps: 12 })
      await page.mouse.up()
      // The first "Internal name" is the option type's own.
      await expect(sheet(page).getByLabel('Internal name').nth(3)).toHaveValue('matte-black')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-05',
    state: 'translated',
    variant: 'admin',
    reach: async (page) => {
      await openColour(page)
      await sheet(page)
        .getByRole('button', { name: /manage translations/i })
        .click()
      await expect(page.getByRole('heading', { name: 'Translations' })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-05',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOptions(page)
      await openRowMenu(page, 'condition')
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await expect(page.getByRole('heading', { name: /delete option type\?/i })).toBeVisible()
    },
  },

  // DA-SET-20 Product types
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-SET-20',
      state: 'listed',
      variant,
      reach: (page) => openStore(page, productTypesPath),
    }),
  ),
  directVisit('DA-SET-20', productTypesPath),
  {
    screen: 'DA-SET-20',
    state: 'none',
    variant: 'admin',
    intercepted: 'The product type list is answered with no product types',
    reach: async (page) => {
      await emptied(page, 'product_types')
      await openStore(page, productTypesPath)
      await expect(page.getByText('No product types yet', { exact: true })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-20',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openNewProductType(page)
      const create = sheet(page)
      await create.locator('#name').fill('Ceramics')
      const categories = create
        .locator('[data-slot="field"]')
        .filter({ has: page.getByText('Categories', { exact: true }) })
        .getByRole('combobox')
      await categories.fill('Kitchen')
      await page
        .getByRole('option', { name: /^kitchen$/i })
        .first()
        .click()
      for (const field of ['Material', 'Capacity', 'Care instructions']) {
        await create.getByRole('button', { name: field, exact: true }).click()
      }
      await create.locator('#name').click()
      await rest(page)
    },
  },
  {
    screen: 'DA-SET-20',
    state: 'no-name',
    variant: 'admin',
    reach: async (page) => {
      await openNewProductType(page)
      await sheet(page)
        .getByRole('button', { name: /create product type/i })
        .click()
      await expect(sheet(page).locator('[data-slot="field-error"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-20',
    state: 'edit',
    variant: 'admin',
    reach: async (page) => {
      await openProductTypes(page)
      await page.getByText('Kitchen Appliance', { exact: true }).click()
      await expect(sheet(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-20',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openProductTypes(page)
      await openRowMenu(page, 'Kitchen Appliance')
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-20',
    state: 'delete-refused',
    variant: 'admin',
    reach: async (page) => {
      await openProductTypes(page)
      await openRowMenu(page, 'Kitchen Appliance')
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await confirmation(page)
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(page.getByText('Kitchen Appliance', { exact: true })).toBeVisible()
      await page.waitForTimeout(1_000)
      await rest(page)
    },
  },
]

// Batch 5 part 2: organising and pricing the catalog (work item §10).

/** Every part 2 screen in the three roles that may open it, and a direct visit by a role that may not. */
const forRoles = (
  screen: string,
  state: string,
  path: string | (() => string),
  reach: Capture['reach'],
): Capture[] => [
  ...catalogVariants.map((variant): Capture => ({ screen, state, variant, reach })),
  {
    screen,
    state: 'direct-visit',
    variant: 'orderManager',
    reach: (page) => openStore(page, typeof path === 'string' ? path : path()),
  },
]

/** A record's page whose request is answered with a server error, after the dashboard asks again. */
const recordFails =
  (path: RegExp, open: string): Capture['reach'] =>
  async (page) => {
    await listFails(path)(page)
    await page.goto(`/${seeded.storeId}${open}`)
    await page.waitForTimeout(12_000)
  }

/** Picks up a row by its drag handle with the keyboard and moves it down one place, without dropping it. */
const liftRow = async (page: Page, handle: ReturnType<Page['locator']>) => {
  await handle.focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(400)
}

const translationsPath = '/products/translations'
const openTranslations = async (page: Page) => {
  await openStore(page, translationsPath)
  await expect(page.getByText('Translation coverage', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'E2E Promo Product' })).toBeVisible({
    timeout: 15_000,
  })
}
/** The kettle's translations, opened from its row: its description is rich text. */
const openKettleTranslations = async (page: Page) => {
  await openTranslations(page)
  await page.getByPlaceholder(/^search…$/i).fill('Kettle')
  await page.getByRole('button', { name: kettle }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(1_000)
}
const translationKind = async (page: Page, kind: string, shows: string) => {
  await openTranslations(page)
  await page.getByRole('combobox').filter({ hasText: 'Products' }).click()
  await page.getByRole('option', { name: kind, exact: true }).click()
  await expect(page.getByRole('button', { name: shows }).first()).toBeVisible({ timeout: 15_000 })
}

const categoriesPath = '/products/categories'
const categoryNode = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const openCategories = async (page: Page) => {
  await openStore(page, categoriesPath)
  await expect(categoryNode(page, 'Kitchen')).toBeVisible({ timeout: 15_000 })
}
const searchCategories = async (page: Page, text: string) => {
  await openCategories(page)
  await searchList(page, /^search categories…$/i, text)
}
const newCategoryPath = `${categoriesPath}/new`
const openNewCategory = async (page: Page) => {
  await openStore(page, newCategoryPath)
  await expect(page.getByRole('heading', { name: 'New category' })).toBeVisible()
}
const categoryPath = () => `${categoriesPath}/${merchandising.ids.category}`
const openCategory = async (page: Page) => {
  await openStore(page, categoryPath())
  await expect(page.getByRole('heading', { name: coffeeCategory })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Automatic Espresso Machine', { exact: true })).toBeVisible()
}
const categoryProduct = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name })
const saveButton = (page: Page) => page.getByRole('main').getByRole('button', { name: /^save$/i })

/** Opens the products picker from a record's products card and chooses products by name. */
const pickProducts = async (page: Page, ...names: string[]) => {
  await page.getByRole('button', { name: /add products/i }).click()
  const picker = page.getByRole('dialog')
  await expect(picker.getByRole('searchbox')).toBeVisible()
  for (const name of names) {
    await picker.getByRole('searchbox').fill(name)
    await picker
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .first()
      .click()
  }
  return picker
}

const organisingCaptures: Capture[] = [
  // DA-PRD-06 Translations
  ...forRoles('DA-PRD-06', 'coverage', translationsPath, openTranslations),
  {
    screen: 'DA-PRD-06',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The coverage request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/translations$/, 'hold')
      await page.goto(`/${seeded.storeId}${translationsPath}`)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-06',
    state: 'no-other-language',
    variant: 'admin',
    intercepted: 'The translation coverage is answered with no language besides the default',
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/translations',
        async (route) => {
          const response = await route.fetch()
          const body = (await response.json()) as {
            data: { records: { locales: Record<string, number> }[] }
          }
          await route.fulfill({
            response,
            json: {
              ...body,
              data: {
                ...body.data,
                locales: [],
                coverage: [],
                records: body.data.records.map((record) => ({ ...record, locales: {} })),
              },
            },
          })
        },
      )
      await openStore(page, translationsPath)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-06',
    state: 'categories',
    variant: 'admin',
    reach: (page) => translationKind(page, 'Categories', 'Kitchen'),
  },
  {
    screen: 'DA-PRD-06',
    state: 'collections',
    variant: 'admin',
    reach: (page) => translationKind(page, 'Collections', 'Best Sellers'),
  },
  {
    screen: 'DA-PRD-06',
    state: 'option-types',
    variant: 'admin',
    reach: (page) => translationKind(page, 'Option types', 'Color'),
  },
  {
    screen: 'DA-PRD-06',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openTranslations(page)
      await page.getByPlaceholder(/^search…$/i).fill('Kettle')
      await expect(page.getByRole('button', { name: kettle })).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-06',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openTranslations(page)
      await page.getByPlaceholder(/^search…$/i).fill('no record has this name')
      await expect(page.getByRole('button', { name: 'E2E Promo Product' })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-06',
      state: 'translate-dialog',
      variant,
      reach: openKettleTranslations,
    }),
  ),
  {
    screen: 'DA-PRD-06',
    state: 'import-wizard',
    variant: 'admin',
    reach: async (page) => {
      await openTranslations(page)
      await page.getByRole('button', { name: /^import$/i }).click()
      await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-06',
    state: 'export',
    variant: 'admin',
    reach: async (page) => {
      await openTranslations(page)
      await page.getByRole('button', { name: /^export$/i }).click()
      await page.waitForTimeout(1_000)
    },
  },
  {
    screen: 'DA-PRD-06',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The coverage request is answered with a server error',
    reach: recordFails(/^\/api\/v3\/admin\/translations$/, translationsPath),
  },

  // DA-PRD-07 Categories
  ...forRoles('DA-PRD-07', 'tree', categoriesPath, openCategories),
  {
    screen: 'DA-PRD-07',
    state: 'tree-narrow',
    variant: 'admin',
    phone: true,
    reach: openCategories,
  },
  {
    screen: 'DA-PRD-07',
    state: 'expanded',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await page.getByRole('button', { name: 'Expand' }).first().click()
      await expect(categoryNode(page, 'Coffee Machines')).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'searched-list',
    variant: 'admin',
    reach: async (page) => {
      await searchCategories(page, 'Air')
      await expect(page.getByText('Air Fryers').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await searchCategories(page, 'no category has this name')
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'no-categories',
    variant: 'admin',
    intercepted: 'The category list is answered with no categories',
    reach: async (page) => {
      await emptied(page, 'categories')
      await openStore(page, categoriesPath)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'dragging',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await liftRow(page, page.getByRole('button', { name: 'Drag to reorder' }).nth(2))
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await page.getByRole('button', { name: 'Open actions' }).nth(2).click()
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    screen: 'DA-PRD-07',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The category list request is answered with a server error',
    reach: recordFails(/^\/api\/v3\/admin\/categories$/, categoriesPath),
  },

  // DA-PRD-08 New category
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-08',
      state: 'empty',
      variant,
      reach: openNewCategory,
    }),
  ),
  { ...directVisit('DA-PRD-08', newCategoryPath), variant: 'catalogViewer' },
  directVisit('DA-PRD-08', newCategoryPath),
  {
    screen: 'DA-PRD-08',
    state: 'parent-chosen',
    variant: 'admin',
    reach: async (page) => {
      await openNewCategory(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity tea corner')
      await page.getByRole('combobox', { name: 'Top level' }).click()
      await page.getByRole('combobox', { name: 'Top level' }).fill('Kitchen')
      await page.getByRole('option', { name: 'Kitchen', exact: true }).click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-08',
    state: 'image-added',
    variant: 'admin',
    reach: async (page) => {
      await openNewCategory(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity tea corner')
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
          name: 'fidelity-tea-corner.png',
          mimeType: 'image/png',
          buffer: fixture('product-olive.png'),
        })
      await page.waitForTimeout(1_500)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-08',
    state: 'no-name',
    variant: 'admin',
    reach: async (page) => {
      await openNewCategory(page)
      await page.getByLabel('Meta title').fill('Fidelity tea corner')
      await saveButton(page).click()
      await page.waitForTimeout(800)
    },
  },

  // DA-PRD-09 Category
  ...forRoles('DA-PRD-09', 'edited', categoryPath, openCategory),
  {
    screen: 'DA-PRD-09',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The category request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/categories\/ctg_[A-Za-z0-9]+$/, 'hold')
      await page.goto(`/${seeded.storeId}${categoryPath()}`)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'products-picker',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await pickProducts(page, 'Electric Kettle 1.7L')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'products-staged',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      const picker = await pickProducts(page, 'Electric Kettle 1.7L')
      await picker.getByRole('button', { name: /^add 1$/i }).click()
      await categoryProduct(page, 'Drip Coffee Maker 1.5L')
        .getByRole('button', { name: /remove from category/i })
        .click()
      await expect(page.getByRole('button', { name: /restore/i })).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'products-dragging',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await liftRow(
        page,
        page
          .getByRole('row', { name: /Drag to reorder Automatic Espresso Machine/ })
          .getByRole('button', { name: 'Drag to reorder' }),
      )
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'custom-fields',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await toCard(page, 'Custom fields')
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'unsaved-changes',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await page.getByLabel('Meta title').fill('Coffee corner')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await page.getByLabel('Meta title').fill(`Coffee corner ${Date.now()}`)
      await saveButton(page).click()
      await expect(
        page.getByRole('region', { name: 'Notifications' }).getByRole('status').first(),
      ).toBeVisible()
      await rest(page)
    },
    after: () =>
      updateRecord(baseURL, 'categories', merchandising.ids.category, { meta_title: null }),
  },
  {
    screen: 'DA-PRD-09',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      const slug = page.getByLabel('Slug')
      await slug.scrollIntoViewIfNeeded()
      await slug.fill('kitchen/coffee-machines')
      await saveButton(page).click()
      await page.waitForTimeout(1_500)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'sidebar-slot',
    variant: 'admin',
    reach: async (page) => {
      await openCategory(page)
      await page
        .getByText('Search engine optimization', { exact: true })
        .evaluate((element) => element.scrollIntoView({ block: 'start' }))
    },
  },
  {
    screen: 'DA-PRD-09',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The category request is answered with a server error',
    reach: async (page) => {
      await listFails(/^\/api\/v3\/admin\/categories\/ctg_[A-Za-z0-9]+$/)(page)
      await page.goto(`/${seeded.storeId}${categoryPath()}`)
      await page.waitForTimeout(12_000)
    },
  },
]

const collectionsPath = '/products/collections'
const collectionRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}`) }) })
const openCollections = async (page: Page) => {
  await openStore(page, collectionsPath)
  await expect(collectionRow(page, 'Best Sellers')).toBeVisible({ timeout: 15_000 })
}
const newCollectionPath = `${collectionsPath}/new`
const openNewCollection = async (page: Page) => {
  await openStore(page, newCollectionPath)
  await expect(page.getByRole('heading', { name: 'New collection' })).toBeVisible()
}
const collectionPath = (key: 'manual' | 'automatic') => () =>
  `${collectionsPath}/${merchandising.ids.collections[key]}`
const openCollection = (key: 'manual' | 'automatic') => async (page: Page) => {
  await openStore(page, collectionPath(key)())
  await expect(
    page.getByRole('heading', {
      name: key === 'manual' ? 'Best Sellers' : merchandisingCollections.automatic,
    }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('row').nth(2)).toBeVisible({ timeout: 15_000 })
}
const membershipCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Membership' })
/** Adds a rule row and sets its kind, condition and value. */
const addCollectionRule = async (
  page: Page,
  index: number,
  kind: string,
  condition: string,
  value?: string,
) => {
  // Turning rules on starts the first rule, so only later ones need adding.
  const rules = membershipCard(page).getByRole('combobox', { name: 'Rule' })
  if ((await rules.count()) <= index) {
    await membershipCard(page).getByRole('button', { name: 'Add rule' }).click()
  }
  await rules.nth(index).click()
  await page.getByRole('option', { name: kind, exact: true }).click()
  await membershipCard(page).getByRole('combobox', { name: 'Condition' }).nth(index).click()
  await page.getByRole('option', { name: condition, exact: true }).click()
  if (value !== undefined) {
    await membershipCard(page).getByRole('textbox', { name: 'Value' }).nth(index).fill(value)
  }
}

const collectionCaptures: Capture[] = [
  // DA-PRD-10 Collections
  ...forRoles('DA-PRD-10', 'listed', collectionsPath, openCollections),
  {
    screen: 'DA-PRD-10',
    state: 'filtered-automatic',
    variant: 'admin',
    reach: async (page) => {
      await openCollections(page)
      await narrowQuickFilter(page, /^kind/i, /^automatic$/i)
      await expect(collectionRow(page, 'Best Sellers')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-10',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openCollections(page)
      await searchList(page, /^search collections…$/i, 'New')
      await expect(collectionRow(page, 'Best Sellers')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-10',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openCollections(page)
      await searchList(page, /^search collections…$/i, 'no collection has this name')
      await expect(page.getByText(/try adjusting your search/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-10',
    state: 'no-collections',
    variant: 'admin',
    intercepted: 'The collection list is answered with no collections',
    reach: async (page) => {
      await emptied(page, 'collections')
      await openStore(page, collectionsPath)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-10',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCollections(page)
      await openRowMenu(page, 'Best Sellers')
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-PRD-11 New collection
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-11',
      state: 'empty',
      variant,
      reach: openNewCollection,
    }),
  ),
  { ...directVisit('DA-PRD-11', newCollectionPath), variant: 'catalogViewer' },
  directVisit('DA-PRD-11', newCollectionPath),
  {
    screen: 'DA-PRD-11',
    state: 'manual',
    variant: 'admin',
    reach: async (page) => {
      await openNewCollection(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity desk picks')
      await page.getByRole('combobox', { name: 'Default sorting' }).click()
      await page.getByRole('option', { name: 'Name: A–Z' }).click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-11',
    state: 'automatic-rules',
    variant: 'admin',
    reach: async (page) => {
      await openNewCollection(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity new and compact')
      await page.getByRole('switch', { name: 'Set members automatically from rules' }).click()
      await addCollectionRule(page, 0, 'Tag', 'contains', 'compact')
      await addCollectionRule(page, 1, 'On sale', 'is equal to')
      await addCollectionRule(page, 2, 'Recently published', 'is equal to', '30')
      await membershipCard(page).getByRole('combobox').filter({ hasText: 'all conditions' }).click()
      await page.getByRole('option', { name: 'any condition' }).click()
      await membershipCard(page).evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-11',
    state: 'no-name',
    variant: 'admin',
    reach: async (page) => {
      await openNewCollection(page)
      await page.getByLabel('Meta title').fill('Fidelity gifts')
      await saveButton(page).click()
      await page.waitForTimeout(800)
    },
  },

  // DA-PRD-12 Collection
  ...forRoles('DA-PRD-12', 'manual', collectionPath('manual'), openCollection('manual')),
  {
    screen: 'DA-PRD-12',
    state: 'manual-narrow',
    variant: 'admin',
    phone: true,
    reach: openCollection('manual'),
  },
  {
    screen: 'DA-PRD-12',
    state: 'products-staged',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      const picker = await pickProducts(page, 'Electric Kettle 1.7L')
      await picker.getByRole('button', { name: /^add 1$/i }).click()
      await page
        .getByRole('row')
        .filter({ hasText: 'E2E Bulk Product A' })
        .getByRole('button', { name: /remove from collection/i })
        .click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-12',
    state: 'several-chosen-for-removal',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      const rows = page.getByRole('checkbox', { name: 'Select product' })
      for (const index of [0, 1, 2]) await rows.nth(index).check()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-12',
    state: 'several-removed-before-save',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      const rows = page.getByRole('checkbox', { name: 'Select product' })
      for (const index of [0, 1, 2]) await rows.nth(index).check()
      await page.getByRole('button', { name: /^remove$/i }).click()
      await rest(page)
    },
  },
  ...forRoles(
    'DA-PRD-12',
    'automatic',
    collectionPath('automatic'),
    openCollection('automatic'),
  ).filter((item) => item.variant !== 'orderManager'),
  {
    screen: 'DA-PRD-12',
    state: 'automatic-rule-edited',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('automatic')(page)
      await membershipCard(page).getByRole('textbox', { name: 'Value' }).first().fill('travel')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-12',
    state: 'switched-to-rules',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      await page.getByRole('switch', { name: 'Set members automatically from rules' }).click()
      await membershipCard(page).evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-12',
    state: 'unsaved-changes',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      await page.getByLabel('Meta title').fill('Our best sellers')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-12',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      await page.getByLabel('Meta title').fill(`Our best sellers ${Date.now()}`)
      await saveButton(page).click()
      await expect(
        page.getByRole('region', { name: 'Notifications' }).getByRole('status').first(),
      ).toBeVisible()
      await rest(page)
    },
    after: () =>
      updateRecord(baseURL, 'collections', merchandising.ids.collections.manual, {
        meta_title: null,
      }),
  },
  {
    screen: 'DA-PRD-12',
    state: 'sidebar-slot',
    variant: 'admin',
    reach: async (page) => {
      await openCollection('manual')(page)
      await page
        .getByText('Search engine optimization', { exact: true })
        .evaluate((element) => element.scrollIntoView({ block: 'start' }))
    },
  },
]

const catalogsPath = '/products/catalogs'
const catalogRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}`) }) })
const openCatalogs = async (page: Page) => {
  await openStore(page, catalogsPath)
  await expect(catalogRow(page, merchandisingCatalogs.percentage)).toBeVisible({ timeout: 15_000 })
}
const wizard = (page: Page) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'New catalog' }) })
const onWizardStep = (page: Page, step: string) =>
  expect(wizard(page).getByRole('button', { name: step, exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  )
const openWizard = async (page: Page) => {
  await openCatalogs(page)
  await page.getByRole('button', { name: /add catalog/i }).click()
  await onWizardStep(page, 'Details')
}
const wizardSteps = ['Details', 'Audience', 'Products', 'Pricing', 'Review']
/** The wizard on a later step: named, then moved on with Next to the step. */
const wizardAt = (step: string) => async (page: Page) => {
  await openWizard(page)
  await wizard(page).locator('#catalog-name').fill('Fidelity bakery trade')
  for (const next of wizardSteps.slice(1, wizardSteps.indexOf(step) + 1)) {
    await wizard(page)
      .getByRole('button', { name: /^next$/i })
      .click()
    await onWizardStep(page, next)
  }
  await rest(page)
}
const catalogPath = (key: keyof Merchandising['ids']['catalogs']) => () =>
  `${catalogsPath}/${merchandising.ids.catalogs[key]}`
const openCatalog = (key: keyof Merchandising['ids']['catalogs']) => async (page: Page) => {
  await openStore(page, catalogPath(key)())
  await expect(page.getByRole('heading', { name: merchandisingCatalogs[key] })).toBeVisible({
    timeout: 15_000,
  })
  await settle(page)
}
const sidebarCard = (page: Page, title: string) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) })
    .last()
const toSidebarCard = async (page: Page, title: string) => {
  await sidebarCard(page, title).evaluate((element) => element.scrollIntoView({ block: 'start' }))
  await rest(page)
}
const choosePricing = async (page: Page, option: RegExp) => {
  await page.getByRole('combobox', { name: 'Pricing' }).click()
  await page.getByRole('option', { name: option }).click()
}

const catalogCaptures: Capture[] = [
  // DA-PRD-13 Catalogs
  ...forRoles('DA-PRD-13', 'listed', catalogsPath, openCatalogs),
  {
    screen: 'DA-PRD-13',
    state: 'filtered-inactive',
    variant: 'admin',
    reach: async (page) => {
      await openCatalogs(page)
      await narrowQuickFilter(page, /^status/i, /^inactive$/i)
      await expect(catalogRow(page, merchandisingCatalogs.percentage)).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openCatalogs(page)
      await searchList(page, /^search catalogs/i, 'hotel')
      await expect(catalogRow(page, merchandisingCatalogs.percentage)).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'no-catalogs',
    variant: 'admin',
    intercepted: 'The catalog list is answered with no catalogs',
    reach: async (page) => {
      await emptied(page, 'catalogs')
      await openStore(page, catalogsPath)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCatalogs(page)
      await openRowMenu(page, merchandisingCatalogs.empty)
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  { screen: 'DA-PRD-13', state: 'wizard-details', variant: 'admin', reach: openWizard },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-details',
    variant: 'merchandiser',
    reach: openWizard,
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-blank-name',
    variant: 'admin',
    reach: async (page) => {
      await openWizard(page)
      await wizard(page)
        .getByRole('button', { name: /^next$/i })
        .click()
      await expect(
        wizard(page).getByText('Fix the highlighted field before continuing.'),
      ).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-audience-none',
    variant: 'admin',
    reach: wizardAt('Audience'),
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-audience-assigned',
    variant: 'admin',
    reach: async (page) => {
      await wizardAt('Audience')(page)
      await wizard(page).getByRole('button', { name: 'Assign' }).click()
      const audience = page.getByRole('combobox', { name: /^search companies/i })
      await audience.click()
      await audience.fill('Acme')
      await page.getByRole('option', { name: /Acme EMEA/ }).click()
      await wizard(page).getByRole('button', { name: /^add$/i }).click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-products-none',
    variant: 'admin',
    reach: wizardAt('Products'),
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-products-chosen',
    variant: 'admin',
    reach: async (page) => {
      await wizardAt('Products')(page)
      for (const name of ['2-Slice Toaster', '4-Slice Toaster']) {
        await wizard(page).getByRole('searchbox').fill(name)
        await wizard(page)
          .getByRole('button', { name: `Add ${name}` })
          .click()
      }
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-pricing',
    variant: 'admin',
    reach: async (page) => {
      await wizardAt('Pricing')(page)
      await wizard(page).getByRole('combobox', { name: 'Pricing' }).click()
      await page.getByRole('option', { name: /percentage off/i }).click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-pricing-needs-fixing',
    variant: 'admin',
    reach: async (page) => {
      await wizardAt('Pricing')(page)
      await wizard(page).getByRole('combobox', { name: 'Pricing' }).click()
      await page.getByRole('option', { name: /percentage off/i }).click()
      await wizard(page)
        .getByRole('button', { name: /^next$/i })
        .click()
      await expect(
        wizard(page).getByText('Fix the highlighted field before continuing.'),
      ).toBeVisible()
      await rest(page)
    },
  },
  { screen: 'DA-PRD-13', state: 'wizard-review', variant: 'admin', reach: wizardAt('Review') },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-closed-untouched',
    variant: 'admin',
    reach: async (page) => {
      await openWizard(page)
      await page.keyboard.press('Escape')
      await expect(wizard(page)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'wizard-discard-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openWizard(page)
      await wizard(page).locator('#catalog-name').fill('Fidelity bakery trade')
      await page.keyboard.press('Escape')
      await expect(page.getByRole('heading', { name: /discard this draft/i })).toBeVisible()
    },
  },

  // DA-PRD-14 Catalog
  ...forRoles('DA-PRD-14', 'settings', catalogPath('percentage'), openCatalog('percentage')),
  {
    screen: 'DA-PRD-14',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The catalog request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/catalogs\/cat_[A-Za-z0-9]+$/, 'hold')
      await page.goto(`/${seeded.storeId}${catalogPath('percentage')()}`)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'deactivate-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page.getByRole('button', { name: /^deactivate$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'activate-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('empty')(page)
      await page.getByRole('button', { name: /^activate$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-14',
      state: 'audience',
      variant,
      reach: async (page) => {
        await openCatalog('percentage')(page)
        await toSidebarCard(page, 'Audiences')
      },
    }),
  ),
  {
    screen: 'DA-PRD-14',
    state: 'audience-adding',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await toSidebarCard(page, 'Audiences')
      await sidebarCard(page, 'Audiences').getByRole('button', { name: 'Assign' }).click()
      const audience = page.getByRole('combobox', { name: /^search companies/i })
      await audience.click()
      await audience.fill('Acme')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'audience-withdrawn',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await toSidebarCard(page, 'Audiences')
      await sidebarCard(page, 'Audiences')
        .getByRole('button', { name: 'Remove', exact: true })
        .first()
        .click()
      await rest(page)
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-14',
      state: 'terms',
      variant,
      reach: async (page) => {
        await openCatalog('percentage')(page)
        await toSidebarCard(page, 'Order minimums')
      },
    }),
  ),
  {
    screen: 'DA-PRD-14',
    state: 'terms-errors',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page
        .getByRole('spinbutton', { name: /^Order multiple/ })
        .last()
        .fill('2.5')
      await page.getByRole('spinbutton', { name: 'Minimum amount' }).fill('-5')
      await saveButton(page).click()
      await toSidebarCard(page, 'Order minimums')
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'products-staged',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      const picker = await pickProducts(page, 'Electric Kettle 1.7L')
      await picker.getByRole('button', { name: /^add 1$/i }).click()
      await page
        .getByRole('row')
        .filter({ hasText: 'Drip Coffee' })
        .getByRole('button', { name: /remove from catalog/i })
        .click()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'products-picker-paged',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page.getByRole('button', { name: /add products/i }).click()
      const picker = page.getByRole('dialog')
      await expect(picker.getByRole('searchbox')).toBeVisible()
      // The picker pages by loading more below the first 25, not by page numbers.
      await picker.getByRole('button', { name: /^load more$/i }).click()
      await expect(picker.getByRole('button', { name: /^load more$/i })).toBeEnabled()
      await picker.getByRole('button', { name: /^load more$/i }).scrollIntoViewIfNeeded()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'products-picker-all-matching',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page.getByRole('button', { name: /add products/i }).click()
      const picker = page.getByRole('dialog')
      await picker.getByRole('searchbox').fill('a')
      await picker.getByRole('button', { name: /^select all \d+ match/i }).click()
      await expect(picker.getByText(/^\d+ selected$/)).toBeVisible()
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'pricing-normal',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('sample')(page)
      await toSidebarCard(page, 'Pricing')
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-14',
      state: 'pricing-percentage',
      variant,
      reach: async (page) => {
        await openCatalog('percentage')(page)
        await toSidebarCard(page, 'Pricing')
      },
    }),
  ),
  {
    screen: 'DA-PRD-14',
    state: 'pricing-tier-preview',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      // The ladder is a tooltip, so it opens on hover rather than on a click.
      await page.getByRole('button', { name: '+2 tiers' }).first().hover()
      await expect(page.locator('[data-slot="tooltip-content"]').first()).toBeVisible()
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-14',
      state: 'pricing-entered',
      variant,
      reach: openCatalog('entered'),
    }),
  ),
  {
    screen: 'DA-PRD-14',
    state: 'pricing-entered-editor',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('entered')(page)
      await page
        .getByRole('button', { name: /^enter prices$/i })
        .first()
        .click()
      await expect(
        page
          .getByRole('dialog')
          .getByLabel(/^price for/i)
          .first(),
      ).toBeVisible({
        timeout: 15_000,
      })
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'pricing-switched-to-percentage',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('entered')(page)
      await choosePricing(page, /percentage off/i)
      await toSidebarCard(page, 'Pricing')
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'prices-import',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('entered')(page)
      await toSidebarCard(page, 'Pricing')
      await sidebarCard(page, 'Pricing')
        .getByRole('button', { name: /^import$/i })
        .click()
      await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'prices-export',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('entered')(page)
      await toSidebarCard(page, 'Pricing')
      await sidebarCard(page, 'Pricing')
        .getByRole('button', { name: /^export$/i })
        .click()
      await page.waitForTimeout(1_000)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'staged-changes',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity café and bakery trade')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await page.getByLabel('Description', { exact: true }).fill(`Agreed terms ${Date.now()}`)
      await saveButton(page).click()
      await expect(
        page.getByRole('region', { name: 'Notifications' }).getByRole('status').first(),
      ).toBeVisible()
      await rest(page)
    },
    after: () =>
      updateRecord(baseURL, 'catalogs', merchandising.ids.catalogs.percentage, {
        description: 'Agreed terms for café accounts.',
      }),
  },
  {
    screen: 'DA-PRD-14',
    state: 'sidebar-slot',
    variant: 'admin',
    reach: async (page) => {
      await openCatalog('percentage')(page)
      await toSidebarCard(page, 'Audiences')
      await page.mouse.wheel(0, 2_000)
    },
  },
  {
    screen: 'DA-PRD-14',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The catalog request is answered with a server error',
    reach: async (page) => {
      await listFails(/^\/api\/v3\/admin\/catalogs\/cat_[A-Za-z0-9]+$/)(page)
      await page.goto(`/${seeded.storeId}${catalogPath('percentage')()}`)
      await page.waitForTimeout(12_000)
    },
  },
]

const priceListsPath = '/products/price-lists'
const priceListRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}`) }) })
const openPriceLists = async (page: Page) => {
  await openStore(page, priceListsPath)
  await expect(priceListRow(page, 'Wholesale')).toBeVisible({ timeout: 15_000 })
}
const newPriceListPath = `${priceListsPath}/new`
const openNewPriceList = async (page: Page) => {
  await openStore(page, newPriceListPath)
  await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible({ timeout: 15_000 })
}
const priceListPath = (key: keyof Merchandising['ids']['priceLists']) => () =>
  `${priceListsPath}/${merchandising.ids.priceLists[key]}`
const openPriceList = (key: keyof Merchandising['ids']['priceLists']) => async (page: Page) => {
  await openStore(page, priceListPath(key)())
  await expect(page.getByRole('heading', { name: merchandisingPriceLists[key] })).toBeVisible({
    timeout: 15_000,
  })
  await settle(page)
}
/** Opens the rule type picker and picks a kind, which opens that rule's sheet. */
const pickRuleType = async (page: Page, kind: RegExp) => {
  await page.getByRole('button', { name: 'Add rule' }).click()
  await expect(sheet(page)).toBeVisible()
  if (kind.source !== '^$') {
    await sheet(page).getByRole('button', { name: kind }).first().click()
    await page.waitForTimeout(800)
  }
  await rest(page)
}
const openPriceEditor = async (page: Page) => {
  await page.getByRole('button', { name: /^edit prices$/i }).click()
  await expect(
    page
      .getByRole('dialog')
      .getByLabel(/^price for/i)
      .first(),
  ).toBeVisible({
    timeout: 15_000,
  })
}

const priceListCaptures: Capture[] = [
  // DA-PRD-15 Price lists
  ...forRoles('DA-PRD-15', 'listed', priceListsPath, openPriceLists),
  ...['draft', 'active', 'inactive', 'scheduled'].map(
    (status): Capture => ({
      screen: 'DA-PRD-15',
      state: `filtered-${status}`,
      variant: 'admin',
      reach: async (page) => {
        await openPriceLists(page)
        await narrowQuickFilter(page, /^status/i, new RegExp(`^${status}$`, 'i'))
        await page.waitForTimeout(1_500)
      },
    }),
  ),
  {
    screen: 'DA-PRD-15',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openPriceLists(page)
      await searchList(page, /^search…$/i, 'Fidelity')
      await expect(priceListRow(page, 'Wholesale')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRD-15',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openPriceLists(page)
      await searchList(page, /^search…$/i, 'no price list has this name')
      await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-PRD-15',
    state: 'no-price-lists',
    variant: 'admin',
    intercepted: 'The price list list is answered with no price lists',
    reach: async (page) => {
      await emptied(page, 'price_lists')
      await openStore(page, priceListsPath)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-15',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPriceLists(page)
      await openRowMenu(page, merchandisingPriceLists.draft)
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },

  // DA-PRD-16 New price list
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-16',
      state: 'empty',
      variant,
      reach: openNewPriceList,
    }),
  ),
  { ...directVisit('DA-PRD-16', newPriceListPath), variant: 'catalogViewer' },
  directVisit('DA-PRD-16', newPriceListPath),
  {
    screen: 'DA-PRD-16',
    state: 'schedule',
    variant: 'admin',
    reach: async (page) => {
      await openNewPriceList(page)
      await page.getByLabel('Name', { exact: true }).fill('Fidelity autumn trade')
      await page.getByRole('button', { name: 'Immediately' }).click()
      await page.waitForTimeout(800)
    },
  },
  {
    screen: 'DA-PRD-16',
    state: 'rule-type-picker',
    variant: 'admin',
    reach: async (page) => {
      await openNewPriceList(page)
      await pickRuleType(page, /^$/)
    },
  },
  ...(
    [
      ['volume', /volume/i],
      ['market', /market/i],
      ['channel', /channel/i],
    ] as const
  ).map(
    ([kind, name]): Capture => ({
      screen: 'DA-PRD-16',
      state: `rule-${kind}`,
      variant: 'admin',
      reach: async (page) => {
        await openNewPriceList(page)
        await pickRuleType(page, name)
      },
    }),
  ),
  {
    screen: 'DA-PRD-16',
    state: 'no-name',
    variant: 'admin',
    reach: async (page) => {
      await openNewPriceList(page)
      await page.getByRole('button', { name: /^create$/i }).click()
      await page.waitForTimeout(800)
    },
  },

  // DA-PRD-17 Price list
  ...forRoles(
    'DA-PRD-17',
    'rules-and-products',
    priceListPath('wholesale'),
    openPriceList('wholesale'),
  ),
  {
    screen: 'DA-PRD-17',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The price list request is held open',
    loading: true,
    reach: async (page) => {
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/price_lists\/pl_[A-Za-z0-9]+$/, 'hold')
      await page.goto(`/${seeded.storeId}${priceListPath('wholesale')()}`)
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'rule-edited',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: /^volume pricing/i }).click()
      await expect(sheet(page)).toBeVisible()
      await page.waitForTimeout(800)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'rule-remove-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: 'Remove rule' }).last().click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'rule-removed',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: 'Remove rule' }).last().click()
      await confirmation(page)
        .getByRole('button', { name: /^remove/i })
        .click()
      await rest(page)
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-17',
      state: 'superseded-audience-rules',
      variant,
      reach: openPriceList('audience'),
    }),
  ),
  {
    screen: 'DA-PRD-17',
    state: 'products-page-2',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: 'Go to next page' }).click()
      await page.waitForTimeout(1_500)
      await page.getByRole('button', { name: 'Go to previous page' }).scrollIntoViewIfNeeded()
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'products-narrow',
    variant: 'admin',
    phone: true,
    // On a phone the header squeezes the list's name to no width, so the page is
    // known to be open by its rules card instead.
    reach: async (page) => {
      await openStore(page, priceListPath('wholesale')())
      await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible({ timeout: 15_000 })
      await settle(page)
    },
  },
  ...catalogVariants.map(
    (variant): Capture => ({
      screen: 'DA-PRD-17',
      state: 'prices-spreadsheet',
      variant,
      reach: async (page) => {
        await openPriceList('wholesale')(page)
        if (variant === 'catalogViewer') return
        await openPriceEditor(page)
        await rest(page)
      },
    }),
  ),
  {
    screen: 'DA-PRD-17',
    state: 'prices-break-added',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await openPriceEditor(page)
      const editor = page.getByRole('dialog')
      await editor
        .getByRole('button', { name: /^add quantity break$/i })
        .first()
        .click()
      await page.waitForTimeout(800)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'prices-euros',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await openPriceEditor(page)
      const editor = page.getByRole('dialog')
      await editor.getByRole('combobox').filter({ hasText: 'USD' }).first().click()
      await page.getByRole('option', { name: /EUR/ }).click()
      await page.waitForTimeout(1_500)
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'prices-import',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: /^import$/i }).click()
      await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'prices-export',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page.getByRole('button', { name: /^export$/i }).click()
      await page.waitForTimeout(1_000)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'unsaved-changes',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('draft')(page)
      await page
        .getByLabel('Description', { exact: true })
        .fill('Introductory prices, first week only.')
      await rest(page)
    },
  },
  {
    screen: 'DA-PRD-17',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('draft')(page)
      await page
        .getByLabel('Description', { exact: true })
        .fill(`Introductory prices ${Date.now()}`)
      await saveButton(page).click()
      await expect(
        page.getByRole('region', { name: 'Notifications' }).getByRole('status').first(),
      ).toBeVisible()
      await rest(page)
    },
    after: () =>
      updateRecord(baseURL, 'price_lists', merchandising.ids.priceLists.draft, {
        description: 'Introductory prices for the spring kitchen range.',
      }),
  },
  {
    screen: 'DA-PRD-17',
    state: 'activate-refused',
    variant: 'admin',
    reach: async (page) => {
      const id = await createPriceList(baseURL, emptyPriceList)
      await openStore(page, `${priceListsPath}/${id}`)
      await expect(page.getByRole('heading', { name: emptyPriceList })).toBeVisible({
        timeout: 15_000,
      })
      await page.getByRole('button', { name: /^activate$/i }).click()
      const confirm = confirmation(page).getByRole('button', { name: /^activate$/i })
      if (await confirm.isVisible()) await confirm.click()
      await page.waitForTimeout(1_500)
      await rest(page)
    },
    after: () => deletePriceListsNamed(baseURL, emptyPriceList),
  },
  {
    screen: 'DA-PRD-17',
    state: 'sidebar-slot',
    variant: 'admin',
    reach: async (page) => {
      await openPriceList('wholesale')(page)
      await page
        .getByText('Schedule', { exact: true })
        .evaluate((element) => element.scrollIntoView({ block: 'start' }))
    },
  },
]

const importsPath = '/settings/imports'
const importRow = (page: Page, number: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: number, exact: true }) })
const openImports = async (page: Page) => {
  await openStore(page, importsPath)
  // A role that may not list imports is shown the empty list instead.
  await expect(
    importRow(page, 'IM1001').or(page.getByRole('cell', { name: 'No imports yet' })),
  ).toBeVisible({ timeout: 15_000 })
}
/** The product list's import wizard, open at its upload step. */
const openProductImport = async (page: Page) => {
  await openProducts(page)
  await page.getByRole('button', { name: /^import$/i }).click()
  await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
}
const csv = (name: string, lines: string[]) => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(`${lines.join('\n')}\n`),
})
/** Uploads a file in the open wizard and continues to its mapping step. */
const uploadToMapping = async (page: Page, file: ReturnType<typeof csv>) => {
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles(file)
  await page.getByRole('button', { name: /^continue$/i }).click()
  await expect(page.getByText('Map columns')).toBeVisible({ timeout: 15_000 })
}
const wizardImport = 'Fidelity wizard jug'
const wizardFile = csv('fidelity-wizard-products.csv', [
  'slug,sku,name,price',
  `fidelity-wizard-jug,FID-WIZ-JUG,${wizardImport},21.00`,
  'fidelity-wizard-bad-1,FID-WIZ-BAD-1,,',
  'fidelity-wizard-bad-2,FID-WIZ-BAD-2,,',
])

const importCaptures: Capture[] = [
  // DA-OVL-05 Import wizard
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-OVL-05',
      state: 'upload',
      variant,
      reach: openProductImport,
    }),
  ),
  {
    screen: 'DA-OVL-05',
    state: 'semicolon-mapping',
    variant: 'admin',
    reach: async (page) => {
      await openProductImport(page)
      await page
        .getByRole('dialog')
        .locator('[data-slot="field"]')
        .filter({ hasText: /^column separator/i })
        .getByRole('combobox')
        .click()
      await page.getByRole('option', { name: /^semicolon/i }).click()
      await uploadToMapping(
        page,
        csv('fidelity-semicolon-products.csv', [
          'slug;sku;name;price',
          'fidelity-semicolon-cup;FID-SEMI-CUP;Fidelity semicolon cup;7.50',
        ]),
      )
      await rest(page)
    },
  },
  {
    screen: 'DA-OVL-05',
    state: 'mapping-required-unmapped',
    variant: 'admin',
    reach: async (page) => {
      await openProductImport(page)
      await uploadToMapping(
        page,
        csv('fidelity-unpriced-products.csv', [
          'slug,sku,name',
          'fidelity-unpriced-bowl,FID-UNPRICED,Fidelity unpriced bowl',
        ]),
      )
      await expect(page.getByRole('button', { name: /start import/i })).toBeDisabled()
      await rest(page)
    },
  },
  {
    screen: 'DA-OVL-05',
    state: 'progress',
    variant: 'admin',
    intercepted:
      "The import's status requests are held open once it starts, so the wizard stays on its progress step",
    loading: true,
    reach: async (page) => {
      await openProductImport(page)
      await uploadToMapping(
        page,
        csv('fidelity-progress-products.csv', [
          'slug,sku,name,price',
          'fidelity-progress-plate,FID-PROGRESS,Fidelity progress plate,9.00',
        ]),
      )
      await interrupt(page, 'GET', /^\/api\/v3\/admin\/imports\/imp_[A-Za-z0-9]+$/, 'hold')
      await page.getByRole('button', { name: /start import/i }).click()
      await expect(page.getByText('Processing rows', { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      })
      await page.waitForTimeout(1_000)
    },
    // The import goes on in the background after the capture, so its product is
    // removed once the job has had time to write it.
    after: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      await removeProducts('Fidelity progress plate')
    },
  },
  {
    screen: 'DA-OVL-05',
    state: 'results-with-failed-rows',
    variant: 'admin',
    reach: async (page) => {
      await openProductImport(page)
      await uploadToMapping(page, wizardFile)
      await page.getByRole('button', { name: /start import/i }).click()
      await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 120_000 })
      await page
        .getByRole('button', { name: /view row data/i })
        .first()
        .click()
      await rest(page)
    },
    after: () => removeProducts(wizardImport),
  },

  // DA-SET-31 Imports
  ...forRoles('DA-SET-31', 'listed', importsPath, openImports),
  {
    screen: 'DA-SET-31',
    state: 'each-status',
    variant: 'admin',
    intercepted:
      'The list is answered with four imports given the statuses no import on this server is left in: pending, queued (mapping completed), processing and failed',
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/imports',
        async (route) => {
          if (route.request().method() !== 'GET') return route.fallback()
          const response = await route.fetch()
          const body = (await response.json()) as { data: { number: string; status: string }[] }
          const statuses: Record<string, string> = {
            IM1001: 'failed',
            IM1002: 'processing',
            IM1003: 'completed_mapping',
            IM1004: 'pending',
          }
          await route.fulfill({
            response,
            json: {
              ...body,
              data: body.data.map((item) => ({
                ...item,
                status: statuses[item.number] ?? item.status,
              })),
            },
          })
        },
      )
      await openStore(page, importsPath)
      await expect(importRow(page, 'IM1001')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-31',
    state: 'results',
    variant: 'admin',
    reach: async (page) => {
      await openImports(page)
      await page.getByRole('button', { name: 'IM1001', exact: true }).click()
      await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 15_000 })
      await rest(page)
    },
  },
  {
    screen: 'DA-SET-31',
    state: 'mapping-reopened',
    variant: 'admin',
    reach: async (page) => {
      await openImports(page)
      await page.getByRole('button', { name: 'IM1005', exact: true }).click()
      await expect(page.getByText('Map columns')).toBeVisible({ timeout: 15_000 })
      await rest(page)
    },
  },
  {
    screen: 'DA-SET-31',
    state: 'row-actions',
    variant: 'admin',
    reach: async (page) => {
      await openImports(page)
      await openRowMenu(page, 'IM1001')
      await expect(page.getByRole('menuitem').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-31',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openImports(page)
      await openRowMenu(page, 'IM1005')
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-31',
    state: 'no-imports',
    variant: 'admin',
    intercepted: 'The import list is answered with no imports',
    reach: async (page) => {
      await emptied(page, 'imports')
      await openStore(page, importsPath)
      await page.waitForTimeout(1_500)
    },
  },
]

const removeProducts = (name: string) => deleteProductsNamed(baseURL, name)

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  developers = await seedDevelopers(baseURL)
  await seedSettings(baseURL)
  catalog = await seedCatalog(baseURL)
  merchandising = await seedMerchandising(baseURL)
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

test.afterEach(async () => {
  await restoreLocale?.()
  restoreLocale = null
})

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
  /** The messages of the browser's own dialogs the screen opened, which a screenshot cannot show. */
  dialogs: string[] = [],
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
        ...(dialogs.length > 0 && { dialogs }),
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [
    ...captures,
    ...developerCaptures,
    ...settingsCaptures,
    ...productCaptures,
    ...newProductCaptures,
    ...productPageCaptures,
    ...libraryCaptures,
    ...organisingCaptures,
    ...collectionCaptures,
    ...catalogCaptures,
    ...priceListCaptures,
    ...importCaptures,
  ]) {
    test(`${item.screen} ${item.state} ${item.variant} ${theme}`, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      // Dismissed as the browser would without a listener; their messages are recorded.
      const dialogs: string[] = []
      page.on('dialog', (dialog) => {
        dialogs.push(dialog.message())
        void dialog.dismiss()
      })
      await signIn(page, item.variant)
      // The clean-up runs whatever happens, so a failed capture leaves no record changed.
      try {
        await item.reach(page)
        const settled = item.loading ? null : await settle(page)
        await page.waitForTimeout(400)
        const role = item.variant in teammates ? roles[teammates[item.variant].role] : null
        await save(page, item, theme, settled, role, outside, item.masked, dialogs)
      } finally {
        await item.after?.()
      }
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
