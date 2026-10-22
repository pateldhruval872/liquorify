import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import {
  currentAcceptancePath,
  openRoleMenu,
  openRowMenu,
  PASSWORD,
  pendingEmail,
  removed,
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
  /** Opens the screen in the state; the browser is already signed in as the variant. */
  reach: (page: Page) => Promise<void>
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
})

test.use({ viewport: { width: 1280, height: 960 } })

for (const theme of ['light', 'dark'] as const) {
  for (const item of captures) {
    test(`${item.screen} ${item.state} ${item.variant} ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await signIn(page, item.variant)
      await item.reach(page)
      const settled = item.loading ? null : await settle(page)
      await page.waitForTimeout(400)
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
            role: item.variant in teammates ? roles[teammates[item.variant].role] : null,
            theme,
            revision,
            path: new URL(page.url()).pathname.replace(seeded.storeId, '<store>'),
            intercepted: item.intercepted ?? null,
            settled,
          },
          null,
          2,
        ),
      )
    })
  }
}
