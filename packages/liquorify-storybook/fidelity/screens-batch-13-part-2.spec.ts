import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { linkIn, mailTo, nextMail } from './mail'
import { SELLER_PASSWORD, sellerHeaders } from './marketplace'
import {
  rejectedEmail,
  type SellerPanel,
  seedSellerPanel,
  suspendedEmail,
  twoSellerEmail,
} from './seller-panel'

/**
 * Captures batch 13 part 2's screens, the seller panel's, in each state the
 * work item maps (§10.2), and each permission variant (§10.3). It gathers
 * evidence for a person to review and passes whenever it can capture a
 * screen; it compares nothing.
 *
 * Captured on the browser-test server, as `compare.spec.ts` describes, with
 * the seller panel built and served on port 5175. Before the first capture the
 * script adds part 1's marketplace (`marketplace.ts`) and part 2's seller
 * orders (`seller-panel.ts`).
 *
 * No capture saves a change: each dialog, sheet and confirmation is captured
 * open and left unanswered, except signing in, asking for a reset link and
 * opening a reset or invitation link, which change nothing a later capture
 * reads. Each capture is saved as
 * `results/screens/<screen ID>/<state>/<variant>-<theme>.png` with a `.json`
 * that records how the state was reached. A state reached by answering a
 * request in the browser says so in `intercepted`, and claims nothing about
 * the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const PANEL = process.env.FIDELITY_SELLER_URL ?? 'http://localhost:5175'

type Variant =
  | 'member'
  | 'twoSellers'
  | 'onboarding'
  | 'ready'
  | 'rejected'
  | 'suspended'
  | 'signedOut'
  | 'storeStaff'

let panel: SellerPanel

const members = (): Record<Exclude<Variant, 'signedOut' | 'storeStaff'>, string> => ({
  member: panel.market.users.approved,
  twoSellers: twoSellerEmail,
  onboarding: panel.market.users.onboarding,
  ready: panel.market.users.ready,
  rejected: rejectedEmail,
  suspended: suspendedEmail,
})

/** The seller each member acts for. */
const sellerOf = (variant: Variant) =>
  ({
    member: panel.market.sellers.approved,
    twoSellers: panel.market.sellers.approved,
    onboarding: panel.market.sellers.onboarding,
    ready: panel.market.sellers.ready,
    rejected: panel.market.sellers.rejected,
    suspended: panel.market.sellers.suspended,
    signedOut: panel.market.sellers.approved,
    storeStaff: panel.market.sellers.approved,
  })[variant]

interface Capture {
  screen: string
  state: string
  variant: Variant
  intercepted?: string
  phone?: true
  fullPage?: true
  reach: (page: Page) => Promise<unknown>
}

const phone = { width: 390, height: 844 }

async function signIn(page: Page, variant: Variant) {
  if (variant === 'signedOut') return
  const credentials =
    variant === 'storeStaff'
      ? { email: getCredentials().admin_email, password: getCredentials().admin_password }
      : { email: members()[variant], password: SELLER_PASSWORD }
  const res = await page.request.post(`${PANEL}/api/v3/seller/auth/login`, { data: credentials })
  if (variant === 'storeStaff') return res
  expect(res.ok(), await res.text()).toBeTruthy()
  return res
}

/** Pages holding a request unanswered, whose network never goes quiet. */
const holding = new WeakSet<Page>()

/** Opens a page under the variant's seller, as `/$sellerId/...`. */
async function open(page: Page, variant: Variant, path = '') {
  await page.goto(`${PANEL}/${sellerOf(variant)}${path}`)
  if (!holding.has(page)) await page.waitForLoadState('networkidle')
}

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const seller = (path: string) => (url: URL) => url.pathname === `/api/v3/seller/${path}`

const failing = (page: Page, matches: (url: URL) => boolean) =>
  page.route(matches, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 500,
          json: { error: { code: 'internal_error', message: 'Internal server error' } },
        })
      : route.fallback(),
  )

const held = (page: Page, matches: (url: URL) => boolean) => {
  holding.add(page)
  return page.route(matches, (route) =>
    route.request().method() === 'GET' ? new Promise<void>(() => {}) : route.fallback(),
  )
}

const visible = (page: Page, text: RegExp | string) =>
  expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 })

const heading = (page: Page, name: RegExp | string) =>
  expect(page.getByRole('heading', { name }).first()).toBeVisible({ timeout: 20_000 })

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

const opened = (
  screen: string,
  state: string,
  variant: Variant,
  path: string,
  wait: RegExp | string,
  extra: Partial<Capture> = {},
): Capture => ({
  screen,
  state,
  variant,
  reach: async (page) => {
    await open(page, variant, path)
    await visible(page, wait)
  },
  ...extra,
})

// SP-AUTH-01 to SP-AUTH-04, signed out

const authCaptures: Capture[] = [
  {
    screen: 'SP-AUTH-01',
    state: 'empty',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/login`)
      await heading(page, 'Sign in to your seller panel')
    },
  },
  {
    screen: 'SP-AUTH-01',
    state: 'empty',
    variant: 'signedOut',
    phone: true,
    reach: async (page) => {
      await page.goto(`${PANEL}/login`)
      await heading(page, 'Sign in to your seller panel')
    },
  },
  {
    screen: 'SP-AUTH-01',
    state: 'wrong-password',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/login`)
      await page.getByLabel(/^email$/i).fill(panel.market.users.approved)
      await page.getByLabel(/^password$/i).fill('not-the-password')
      await page.getByRole('button', { name: /^sign in$/i }).click()
      await visible(page, /did not match a seller account/i)
    },
  },
  {
    screen: 'SP-AUTH-01',
    state: 'store-staff-refused',
    variant: 'storeStaff',
    reach: async (page) => {
      await page.goto(`${PANEL}/login`)
      await page.getByLabel(/^email$/i).fill(getCredentials().admin_email)
      await page.getByLabel(/^password$/i).fill(getCredentials().admin_password)
      await page.getByRole('button', { name: /^sign in$/i }).click()
      await expect(
        page
          .getByText(/did not match a seller account/i)
          .or(page.getByRole('heading', { name: /hello|pick|seller/i }))
          .first(),
      ).toBeVisible({ timeout: 20_000 })
    },
  },
  {
    screen: 'SP-AUTH-01',
    state: 'redirected-from-panel-address',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/${panel.market.sellers.approved}/orders`)
      await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
      await heading(page, 'Sign in to your seller panel')
    },
  },
  {
    screen: 'SP-AUTH-02',
    state: 'empty',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/forgot-password`)
      await heading(page, 'Forgot your password?')
    },
  },
  {
    screen: 'SP-AUTH-02',
    state: 'sent',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/forgot-password`)
      await page.getByLabel(/^email$/i).fill('nobody@harbour-cask.example.com')
      await page.getByRole('button', { name: /send reset link/i }).click()
      await heading(page, /check your email/i)
    },
  },
  {
    screen: 'SP-AUTH-03',
    state: 'link-opened',
    variant: 'signedOut',
    reach: async (page) => {
      const email = panel.market.users.approved
      const already = mailTo(email).length
      await page.goto(`${PANEL}/forgot-password`)
      await page.getByLabel(/^email$/i).fill(email)
      await page.getByRole('button', { name: /send reset link/i }).click()
      await heading(page, /check your email/i)
      const link = linkIn(await nextMail(email, already), /reset-password/)
      await page.goto(`${PANEL}${link.pathname}${link.search}`)
      await heading(page, 'Choose a new password')
    },
  },
  {
    screen: 'SP-AUTH-03',
    state: 'invalid-link',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/reset-password?token=not-a-real-token`)
      await heading(page, 'Choose a new password')
      await page
        .getByLabel(/^new password$|^password$/i)
        .first()
        .fill('fidelity-new-pass-1')
      const confirm = page.getByLabel(/confirm/i)
      if (await confirm.count()) await confirm.first().fill('fidelity-new-pass-1')
      await page.getByRole('button', { name: /change password/i }).click()
      await expect(
        page
          .getByRole('link', { name: /request a new link/i })
          .or(page.getByRole('alert'))
          .first(),
      ).toBeVisible({
        timeout: 20_000,
      })
    },
  },
  {
    screen: 'SP-AUTH-03',
    state: 'no-token',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/reset-password`)
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'SP-AUTH-04',
    state: 'invalid-link',
    variant: 'signedOut',
    reach: async (page) => {
      await page.goto(`${PANEL}/accept-invitation/inv_notarealone?token=not-a-real-token`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
    },
  },
  {
    screen: 'SP-AUTH-04',
    state: 'opened-by-invitee',
    variant: 'signedOut',
    reach: async (page) => {
      const link = await invitationLink()
      await page.goto(link)
      await heading(page, 'Join the team')
    },
  },
]

/** The pending invitation's acceptance link, as its email carries it, opened on the panel. */
async function invitationLink() {
  const api = await request.newContext({ baseURL: PANEL })
  try {
    const headers = await sellerHeaders(
      api,
      panel.market.users.approved,
      panel.market.sellers.approved,
    )
    const invitations = (await (await api.get('/api/v3/seller/invitations', { headers })).json())
      .data as { id: string }[]
    expect(invitations.length, 'a pending invitation on Harbour Cask').toBeGreaterThan(0)
    const link = await (
      await api.get(`/api/v3/seller/invitations/${invitations[0].id}/acceptance_link`, { headers })
    ).json()
    const url = new URL(link.acceptance_url as string)
    return `${PANEL}${url.pathname}${url.search}`
  } finally {
    await api.dispose()
  }
}

// SP-SHELL-01, SP-HOME-01, SP-ONB-01 and the chrome, per seller status

const statusVariants = ['member', 'onboarding', 'ready', 'rejected', 'suspended'] as const

const shellCaptures: Capture[] = [
  {
    screen: 'SP-SHELL-01',
    state: 'two-sellers',
    variant: 'twoSellers',
    reach: async (page) => {
      await page.goto(PANEL)
      await visible(page, /pick which to manage/i)
    },
  },
  {
    screen: 'SP-OVL-01',
    state: 'seller-switcher-open',
    variant: 'twoSellers',
    reach: async (page) => {
      await open(page, 'twoSellers')
      await page.getByRole('button', { name: /switch seller/i }).click()
      await expect(page.getByRole('menuitem', { name: /saltmarsh/i })).toBeVisible()
    },
  },
  {
    screen: 'SP-OVL-01',
    state: 'phone-menu-open',
    variant: 'member',
    phone: true,
    reach: async (page) => {
      await open(page, 'member')
      await page
        .getByRole('button', { name: /toggle sidebar|menu/i })
        .first()
        .click()
      await page.waitForTimeout(500)
    },
  },
  {
    screen: 'SP-OVL-01',
    state: 'user-menu-open',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member')
      await page.getByRole('button', { name: /user menu/i }).click()
      await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible()
    },
  },
  {
    screen: 'SP-OVL-02',
    state: 'open',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member')
      await page.getByRole('button', { name: /user menu/i }).click()
      await page
        .getByRole('menuitem', { name: /edit profile/i })
        .first()
        .click()
      await expect(dialog(page).getByLabel('First name')).toBeVisible({ timeout: 20_000 })
    },
  },
  {
    screen: 'SP-ONB-01',
    state: 'submit-while-requirements-block',
    variant: 'onboarding',
    reach: async (page) => {
      await open(page, 'onboarding', '/onboarding')
      const submit = page.getByRole('button', { name: 'Submit for review' })
      await expect(submit).toBeVisible()
      if (await submit.isEnabled()) {
        await submit.click()
        await page.waitForTimeout(1500)
      }
    },
  },
  ...statusVariants.map(
    (variant): Capture => ({
      screen: 'SP-HOME-01',
      state: `status-${variant}`,
      variant,
      fullPage: true,
      reach: async (page) => {
        await open(page, variant)
        await heading(page, /hello/i)
      },
    }),
  ),
  ...statusVariants.map(
    (variant): Capture => ({
      screen: 'SP-ONB-01',
      state: `status-${variant}`,
      variant,
      fullPage: true,
      reach: async (page) => {
        await open(page, variant, '/onboarding')
        await heading(page, 'Setup')
      },
    }),
  ),
  {
    screen: 'SP-HOME-01',
    state: 'status-member',
    variant: 'member',
    phone: true,
    fullPage: true,
    reach: async (page) => {
      await open(page, 'member')
      await heading(page, /hello/i)
    },
  },
]

// SP-PRD-01 to SP-PRD-03

const products = () => panel.market.products

const productCaptures: Capture[] = [
  opened('SP-PRD-01', 'listed', 'member', '/products', 'Harbour Cask Navy Strength Rum'),
  {
    screen: 'SP-PRD-01',
    state: 'loading',
    variant: 'member',
    intercepted: 'The product list request was held unanswered in the browser.',
    reach: async (page) => {
      await held(page, seller('products'))
      await open(page, 'member', '/products')
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'SP-PRD-01',
    state: 'failed',
    variant: 'member',
    intercepted: 'The product list request was answered with a server error in the browser.',
    reach: async (page) => {
      await failing(page, seller('products'))
      await open(page, 'member', '/products')
      await page.waitForTimeout(2000)
    },
  },
  {
    screen: 'SP-PRD-01',
    state: 'empty',
    variant: 'onboarding',
    reach: async (page) => {
      await open(page, 'onboarding', '/products')
      await page.waitForTimeout(1000)
    },
  },
  {
    screen: 'SP-PRD-01',
    state: 'import-open',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/products')
      await page
        .getByRole('button', { name: /import/i })
        .first()
        .click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-PRD-01',
    state: 'export-open',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/products')
      await page
        .getByRole('button', { name: /export/i })
        .first()
        .click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-PRD-01',
    state: 'listed',
    variant: 'suspended',
    reach: async (page) => {
      await open(page, 'suspended', '/products')
      await visible(page, 'Copperline Harbour Porter')
    },
  },
  opened('SP-PRD-02', 'empty', 'member', '/products/new', 'New product', { fullPage: true }),
  ...(['draft', 'proposed', 'active', 'rejected'] as const).map(
    (status): Capture => ({
      screen: 'SP-PRD-03',
      state: status,
      variant: 'member',
      fullPage: true,
      reach: async (page) => {
        await open(page, 'member', `/products/${products()[status]}`)
        await visible(page, /Harbour Cask/)
      },
    }),
  ),
  {
    screen: 'SP-PRD-03',
    state: 'take-down-confirm',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', `/products/${products().active}`)
      await page.getByRole('button', { name: 'Take down' }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-PRD-03',
    state: 'suspended-seller-product',
    variant: 'suspended',
    fullPage: true,
    reach: async (page) => {
      await open(page, 'suspended', `/products/${products().suspended}`)
      await visible(page, 'Copperline Harbour Porter')
    },
  },
]

// SP-ORD-01, SP-ORD-02

const orderCaptures: Capture[] = [
  opened('SP-ORD-01', 'listed', 'member', '/orders', /R10/, { fullPage: true }),
  {
    screen: 'SP-ORD-01',
    state: 'loading',
    variant: 'member',
    intercepted: 'The order list request was held unanswered in the browser.',
    reach: async (page) => {
      await held(page, seller('orders'))
      await open(page, 'member', '/orders')
      await page.waitForTimeout(1500)
    },
  },
  opened('SP-ORD-01', 'empty', 'onboarding', '/orders', /orders/i),
  ...(['new', 'partial', 'canceled', 'returned'] as const).map(
    (kind): Capture => ({
      screen: 'SP-ORD-02',
      state: kind,
      variant: 'member',
      fullPage: true,
      reach: async (page) => {
        await open(page, 'member', `/orders/${panel.orders[kind]}`)
        await visible(page, 'Summary')
      },
    }),
  ),
  {
    screen: 'SP-ORD-02',
    state: 'no-items-or-addresses',
    variant: 'member',
    fullPage: true,
    reach: async (page) => {
      await open(page, 'member', `/orders/${panel.ledgerOrder}`)
      await visible(page, 'Summary')
    },
  },
  {
    screen: 'SP-ORD-02',
    state: 'cancel-dialog',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', `/orders/${panel.orders.new}`)
      await visible(page, 'Summary')
      await page
        .getByRole('button', { name: /more actions|actions/i })
        .first()
        .click()
      await page.getByRole('menuitem', { name: /cancel order/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-ORD-02',
    state: 'fulfilling',
    variant: 'member',
    fullPage: true,
    reach: async (page) => {
      await open(page, 'member', `/orders/${panel.orders.new}`)
      await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
      await visible(page, /units to ship/i)
    },
  },
  {
    screen: 'SP-ORD-02',
    state: 'new-return-dialog',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', `/orders/${panel.orders.partial}`)
      await page.getByRole('button', { name: 'New return' }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-ORD-02',
    state: 'failed',
    variant: 'member',
    intercepted: 'The order request was answered with a server error in the browser.',
    reach: async (page) => {
      await failing(page, seller(`orders/${panel.orders.new}`))
      await open(page, 'member', `/orders/${panel.orders.new}`)
      await page.waitForTimeout(2500)
    },
  },
  {
    screen: 'SP-ORD-02',
    state: 'not-found',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/orders/or_notarealone')
      await page.waitForTimeout(2500)
    },
  },
]

// SP-FIN-01 to SP-FIN-03

const moneyCaptures: Capture[] = [
  opened('SP-FIN-01', 'balance-and-earnings', 'member', '/earnings', 'Earnings', {
    fullPage: true,
  }),
  opened('SP-FIN-01', 'nothing-earned', 'onboarding', '/earnings', 'Earnings'),
  opened('SP-FIN-02', 'listed', 'member', '/payouts', /payouts/i, { fullPage: true }),
  opened('SP-FIN-02', 'empty', 'onboarding', '/payouts', /payouts/i),
  ...(['completed', 'pending'] as const).map(
    (status): Capture => ({
      screen: 'SP-FIN-03',
      state: status,
      variant: 'member',
      fullPage: true,
      reach: async (page) => {
        const payout = panel.market.payouts.find(([, each]) => each === status)?.[0]
        await open(page, 'member', `/payouts/${payout}`)
        await page.waitForTimeout(1500)
      },
    }),
  ),
]

// SP-PRF-01, SP-SET-01 to SP-SET-06

const settingsCaptures: Capture[] = [
  opened('SP-PRF-01', 'filled', 'member', '/profile', 'Business details', { fullPage: true }),
  opened('SP-PRF-01', 'filled', 'onboarding', '/profile', 'Business details', { fullPage: true }),
  {
    screen: 'SP-PRF-01',
    state: 'edit-profile-sheet',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/profile')
      await page.getByRole('button', { name: 'Edit' }).first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'SP-PRF-01',
    state: 'edit-profile-name-cleared',
    variant: 'member',
    intercepted: 'A save, had the sheet sent one, was refused in the browser so nothing changed.',
    reach: async (page) => {
      await page.route(seller('profile'), (route) =>
        route.request().method() === 'PATCH' ? route.abort() : route.fallback(),
      )
      await open(page, 'member', '/profile')
      await page.getByRole('button', { name: 'Edit' }).first().click()
      await dialog(page).getByLabel('Name').first().fill('')
      await dialog(page).getByRole('button', { name: /save/i }).click()
      await page.waitForTimeout(1000)
    },
  },
  {
    screen: 'SP-PRF-01',
    state: 'billing-address-dialog',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/profile')
      await page
        .getByRole('button', { name: /add address/i })
        .first()
        .click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  opened('SP-SET-01', 'index', 'member', '/settings', 'Team & access'),
  opened('SP-SET-02', 'listed', 'member', '/settings/delivery-methods', 'Harbour Cask courier'),
  opened('SP-SET-02', 'empty', 'rejected', '/settings/delivery-methods', /delivery methods/i),
  {
    screen: 'SP-SET-02',
    state: 'new-sheet',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/settings/delivery-methods')
      await page.getByRole('button', { name: 'Add delivery method' }).first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  opened('SP-SET-03', 'empty', 'member', '/settings/package-types', /package|packaging|box/i),
  {
    screen: 'SP-SET-03',
    state: 'new-sheet',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/settings/package-types')
      await page.getByRole('button', { name: /add/i }).first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  opened('SP-SET-04', 'empty', 'member', '/settings/policies', /policies/i),
  {
    screen: 'SP-SET-04',
    state: 'new-sheet',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/settings/policies')
      await page.getByRole('button', { name: 'Add policy' }).first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  opened('SP-SET-05', 'listed', 'member', '/settings/stock-locations', 'Harbour Cask Co.'),
  {
    screen: 'SP-SET-05',
    state: 'edit-sheet',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/settings/stock-locations')
      await page
        .getByRole('button', { name: 'Harbour Cask Co.' })
        .or(page.getByText('Harbour Cask Co.'))
        .last()
        .click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  opened('SP-SET-06', 'member-and-invitation', 'member', '/settings/team', 'Your team'),
  opened('SP-SET-06', 'only-member', 'suspended', '/settings/team', 'Your team'),
  {
    screen: 'SP-SET-06',
    state: 'last-member-menu',
    variant: 'suspended',
    reach: async (page) => {
      await open(page, 'suspended', '/settings/team')
      await page
        .getByRole('button', { name: /actions|more|open menu/i })
        .first()
        .click()
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  {
    screen: 'SP-SET-06',
    state: 'invite-dialog',
    variant: 'member',
    reach: async (page) => {
      await open(page, 'member', '/settings/team')
      await page.getByRole('button', { name: 'Invite member' }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
]

const captures: Capture[] = [
  ...authCaptures,
  ...shellCaptures,
  ...productCaptures,
  ...orderCaptures,
  ...moneyCaptures,
  ...settingsCaptures,
]

test.beforeAll(async () => {
  test.setTimeout(600_000)
  panel = await seedSellerPanel('http://localhost:3010')
})

test.use({ viewport: { width: 1280, height: 960 } })

async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:', 'about:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

async function save(
  page: Page,
  item: Capture,
  theme: 'light' | 'dark',
  settled: boolean | null,
  outside: string[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  const window = page.viewportSize()
  if (item.fullPage && window) {
    const hidden = await page.evaluate(() =>
      Math.max(
        0,
        ...[...document.querySelectorAll('*')]
          .filter((element) => /(auto|scroll)/.test(getComputedStyle(element).overflowY))
          .map((element) => element.scrollHeight - element.clientHeight),
      ),
    )
    if (hidden > 0) {
      await page.setViewportSize({ width: window.width, height: window.height + hidden })
      await page.waitForTimeout(300)
    }
  }
  const captured = page.viewportSize()
  await page.screenshot({ path: `${folder}${name}.png`, fullPage: item.fullPage ?? false })
  const path = new URL(page.url())
  writeFileSync(
    `${folder}${name}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        signedInAs:
          item.variant === 'signedOut'
            ? null
            : item.variant === 'storeStaff'
              ? 'the store admin'
              : members()[item.variant],
        server: 'browser-test server',
        panel: 'seller panel',
        theme,
        revision,
        path: `${path.pathname}${path.search ? '?<query>' : ''}`,
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

const only = process.env.CAPTURE_ONLY ? new RegExp(process.env.CAPTURE_ONLY) : null

for (const theme of ['light', 'dark'] as const) {
  for (const item of captures) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    if (only && !only.test(label)) continue
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      page.setDefaultTimeout(20_000)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item.variant)
      await item.reach(page)
      const holds = holding.has(page)
      const settled = holds ? null : await settle(page)
      await page.waitForTimeout(holds ? 1500 : 400)
      await save(page, item, theme, settled, outside)
    })
  }
}
