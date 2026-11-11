import { mkdirSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from '@playwright/test'
import { login, searchList, sortList } from '../../dashboard/e2e/helpers'
import {
  buyers,
  catalogName,
  certificateNumbers,
  companyAddresses,
  companyNames,
  companyTaxNumber,
  invitedEmail,
  type SeededCompanies,
  seedCompanies,
} from './companies'
import { call, type Headers, type Json, list } from './orders'
import { admin, PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures batch 12's screens (DA-CUS-04, DA-CUS-05) in each state the work
 * item maps (§2.1), its five permission variants (§2.2), the hand-offs it
 * shows (§2.3), and the wholesale states of DA-ORD-03, DA-PRD-13 and DA-CUS-02,
 * as `screens-batch-10.spec.ts` captures batch 10's. It gathers evidence for a
 * person to review and passes whenever it can capture a screen; it compares
 * nothing.
 *
 * Start the screens as `compare.spec.ts` describes. Before the first capture
 * it adds the staff and roles (`staff.ts`) and the companies, buyers,
 * invitation, addresses, registration, certificates, catalog and price list
 * the states need (`companies.ts`), all invented and all in the default store;
 * running it again reuses them. A capture that saves through the screen saves
 * on a company made for it and puts back what it changed. No capture opens
 * another store or its records.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached. A state reached by
 * answering a request in the browser says so in `intercepted`, and claims
 * nothing about the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'orderManager' | 'support' | 'customerManager' | 'merchandiser'
type Theme = 'light' | 'dark'

let seeded: Seeded
let companies: SeededCompanies
let api: APIRequestContext
let headers: Headers

interface Capture {
  screen: string
  state: string
  variant: Variant
  intercepted?: string
  loading?: true
  phone?: true
  fullPage?: true
  handOff?: string
  reach: (page: Page, theme: Theme) => Promise<void>
  after?: (theme: Theme) => Promise<void>
}

const phone = { width: 390, height: 844 }
const readers: Variant[] = ['orderManager', 'support']

async function signIn(page: Page, variant: Variant) {
  if (variant === 'admin') {
    await login(page)
    return
  }
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammates[variant].email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
}

async function openStore(page: Page, path: string) {
  await page.goto(`/${seeded.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

const hold = (page: Page, match: (path: string) => boolean) =>
  page.route(
    (url) => match(url.pathname),
    (route) => (route.request().method() === 'GET' ? new Promise(() => {}) : route.fallback()),
  )

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

const toMiddle = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'center' }))

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const directVisit = (screen: string, path: () => string, state = 'direct-visit'): Capture => ({
  screen,
  state,
  variant: 'merchandiser',
  reach: async (page) => {
    await openStore(page, path())
    await expect(
      page
        .getByRole('heading')
        .first()
        .or(page.getByRole('button', { name: /try again/i })),
    ).toBeVisible({ timeout: 30_000 })
  },
})

// DA-CUS-04 Companies

const listPath = '/companies'
const searchBox = /search companies/i
const row = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name })

const openList = async (page: Page) => {
  await openStore(page, listPath)
  await expect(page.getByRole('heading', { name: /^companies$/i })).toBeVisible({ timeout: 15_000 })
  await expect(row(page, companyNames.group).first()).toBeVisible({ timeout: 15_000 })
}

async function openNewSheet(page: Page) {
  await openList(page)
  await page.getByRole('button', { name: /^add company$/i }).click()
  await expect(page.getByRole('heading', { name: /^new company$/i })).toBeVisible()
}

const listCaptures: Capture[] = [
  ...(['admin', ...readers, 'customerManager'] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-CUS-04', state: 'listed', variant, reach: openList }),
  ),
  {
    screen: 'DA-CUS-04',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The companies request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === '/api/v3/admin/companies')
      await page.goto(`/${seeded.storeId}${listPath}`)
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'none',
    variant: 'admin',
    intercepted: 'The companies answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'companies')
      await openStore(page, listPath)
      await expect(page.getByText(/no companies yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await searchList(page, searchBox, 'Larkspur')
      await expect(row(page, companyNames.bistro)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'filtered-kind',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      // Both kinds start ticked ("All"), so unticking Company leaves the divisions.
      await page.getByRole('button', { name: /^kind/i }).first().click()
      await page
        .getByRole('option', { name: /^company$/i })
        .or(page.getByRole('menuitemcheckbox', { name: /^company$/i }))
        .first()
        .click()
      await page.keyboard.press('Escape')
      await expect(row(page, companyNames.bistro)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'sorted',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await sortList(page, /^name$/i, 'ascending')
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'new-sheet',
    variant: 'admin',
    reach: openNewSheet,
  },
  {
    screen: 'DA-CUS-04',
    state: 'new-sheet-filled',
    variant: 'admin',
    reach: async (page) => {
      await openNewSheet(page)
      await dialog(page).locator('#name').fill('Fidelity Harbor Supply')
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'new-sheet-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewSheet(page)
      await dialog(page)
        .getByRole('button', { name: /^create company$/i })
        .click()
      await expect(dialog(page).locator('[data-slot="field-error"]').first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-CUS-04',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await row(page, companyNames.empty).first().getByRole('button').last().click()
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete company\?/i })).toBeVisible()
    },
  },
  directVisit('DA-CUS-04', () => listPath),
]

// DA-CUS-05 Company

const companyPath = (company: Json) => `/companies/${company.id}`

async function openCompany(page: Page, company: Json) {
  await openStore(page, companyPath(company))
  await expect(page.getByRole('heading', { name: String(company.name) }).first()).toBeVisible({
    timeout: 15_000,
  })
  await settle(page)
}

const openGroup = (page: Page) => openCompany(page, companies.group)
const openEmpty = (page: Page) => openCompany(page, companies.empty)

/** Scrolls to a card on the company page and opens its add button. */
async function openAdd(page: Page, title: RegExp, button: RegExp) {
  const target = card(page, title)
  await toMiddle(target)
  await target.getByRole('button', { name: button }).click()
  await expect(dialog(page)).toBeVisible()
}

async function rowMenu(page: Page, title: RegExp, text: string) {
  const target = card(page, title)
  await toMiddle(target)
  await target
    .locator('[data-slot="item"], [role="listitem"]')
    .filter({ hasText: text })
    .first()
    .getByRole('button', { name: /open actions/i })
    .click()
  await expect(page.getByRole('menu')).toBeVisible()
}

const certificates = /^exemption certificates/i

/** A pending certificate on the bistro, for a capture that acts on it. */
async function freshCertificate(number: string) {
  const reasons = await list(api, headers, 'tax_exemption_reasons')
  const path = `companies/${companies.bistro.id}/tax_exemption_certificates`
  const existing = (await list(api, headers, path)).find(
    (each) => each.certificate_number === number,
  )
  if (existing) await removeCertificate(existing)
  return call(api, headers, 'post', path, {
    certificate_number: number,
    tax_exemption_reason_id: reasons[0].id,
    country_code: 'US',
    state_code: 'OR',
  })
}

async function removeCertificate(certificate: Json) {
  const path = `companies/${companies.bistro.id}/tax_exemption_certificates/${certificate.id}`
  if (certificate.status !== 'revoked' && certificate.status !== 'pending') {
    await api.patch(`/api/v3/admin/${path}/revoke`, { headers })
  }
  await api.delete(`/api/v3/admin/${path}`, { headers })
}

const companyCaptures: Capture[] = [
  ...(['admin', ...readers, 'customerManager'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-CUS-05',
      state: 'company',
      variant,
      fullPage: true,
      reach: openGroup,
    }),
  ),
  {
    screen: 'DA-CUS-05',
    state: 'company',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: openGroup,
  },
  {
    screen: 'DA-CUS-05',
    state: 'division',
    variant: 'admin',
    fullPage: true,
    reach: (page) => openCompany(page, companies.north),
  },
  {
    screen: 'DA-CUS-05',
    state: 'empty-company',
    variant: 'admin',
    fullPage: true,
    reach: openEmpty,
  },
  {
    screen: 'DA-CUS-05',
    state: 'purchase-order-required',
    variant: 'admin',
    fullPage: true,
    reach: (page) => openCompany(page, companies.bistro),
  },
  {
    screen: 'DA-CUS-05',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The company request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === `/api/v3/admin/companies/${companies.group.id}`)
      await page.goto(`/${seeded.storeId}${companyPath(companies.group)}`)
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/companies/comp_doesNotExist')
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'load-failed',
    variant: 'admin',
    intercepted: 'The company request is answered with a server error',
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === `/api/v3/admin/companies/${companies.group.id}`,
        (route) =>
          route.request().method() === 'GET'
            ? route.fulfill({
                status: 500,
                json: {
                  error: { code: 'internal_server_error', message: 'Internal server error' },
                },
              })
            : route.fallback(),
      )
      await openStore(page, companyPath(companies.group))
      await page.waitForTimeout(2000)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'json-drawer',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await page.getByRole('button', { name: /more actions/i }).click()
      await page.getByRole('menuitem', { name: /view as json/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      await page.getByRole('button', { name: /more actions/i }).click()
      await page.getByRole('menuitem', { name: /delete company/i }).click()
      await expect(dialog(page).getByRole('button', { name: /delete company/i })).toBeVisible()
    },
  },
  // The profile card
  {
    screen: 'DA-CUS-05',
    state: 'profile-saved',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      const profile = card(page, /^company$/i)
      await profile.getByRole('switch').click()
      await profile.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByText(/company updated/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: async () => {
      await call(api, headers, 'patch', `companies/${companies.empty.id}`, {
        po_number_required: false,
      })
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'profile-refused',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      const profile = card(page, /^company$/i)
      await profile.locator('input[type="text"], input:not([type])').first().fill('')
      await profile.getByRole('button', { name: /^save$/i }).click()
      await expect(
        profile.locator('[data-slot="field-error"]').or(page.getByRole('alert')).first(),
      ).toBeVisible({ timeout: 15_000 })
    },
  },
  // Sub-units
  {
    screen: 'DA-CUS-05',
    state: 'sub-unit-add-company',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await openAdd(page, /^sub-units/i, /add sub-unit/i)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'sub-unit-add-division',
    variant: 'admin',
    reach: async (page) => {
      await openCompany(page, companies.north)
      await openAdd(page, /^sub-units/i, /add sub-unit/i)
    },
  },
  // Members
  {
    screen: 'DA-CUS-05',
    state: 'member-add',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      await openAdd(page, /^members/i, /add member/i)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'member-added',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      await openAdd(page, /^members/i, /add member/i)
      await dialog(page).getByRole('textbox').first().fill(buyers.toAdd.email)
      await dialog(page).getByRole('button', { name: /^add$/i }).click()
      await expect(card(page, /^members/i).getByText(buyers.toAdd.email)).toBeVisible({
        timeout: 15_000,
      })
    },
    after: async () => {
      const members = await list(api, headers, `companies/${companies.empty.id}/memberships`)
      for (const member of members.filter((each) => each.email === buyers.toAdd.email)) {
        await call(
          api,
          headers,
          'delete',
          `companies/${companies.empty.id}/memberships/${member.id}`,
        )
      }
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'invitation-made',
    variant: 'admin',
    reach: async (page, theme) => {
      await openEmpty(page)
      await openAdd(page, /^members/i, /add member/i)
      await dialog(page).getByRole('textbox').first().fill(`fidelity-invited-${theme}@example.com`)
      await dialog(page).getByRole('button', { name: /^add$/i }).click()
      await expect(page.getByText(`fidelity-invited-${theme}@example.com`)).toBeVisible({
        timeout: 15_000,
      })
      await toMiddle(card(page, /^members/i))
    },
    after: async (theme) => {
      const path = `companies/${companies.empty.id}/invitations`
      const invitations = await list(api, headers, path)
      for (const invitation of invitations.filter(
        (each) =>
          each.email === `fidelity-invited-${theme}@example.com` && each.status === 'pending',
      )) {
        await call(api, headers, 'delete', `${path}/${invitation.id}`)
      }
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'member-remove-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      const members = card(page, /^members/i)
      await toMiddle(members)
      await members
        .getByText(buyers.member.email, { exact: true })
        .locator('xpath=ancestor::div[.//button][1]')
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: /remove member/i }).click()
      await expect(page.getByRole('heading', { name: /remove this member\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'invitation-revoke-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      const members = card(page, /^members/i)
      await toMiddle(members)
      await members
        .getByText(invitedEmail, { exact: true })
        .locator('xpath=ancestor::div[.//button][1]')
        .getByRole('button', { name: /revoke invitation/i })
        .click()
      await expect(page.getByRole('heading', { name: /revoke this invitation\?/i })).toBeVisible()
    },
  },
  // Address book
  {
    screen: 'DA-CUS-05',
    state: 'address-menu',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^address book/i, companyAddresses.warehouse.address1)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'address-add',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await openAdd(page, /^address book/i, /add address/i)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'address-edit',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^address book/i, companyAddresses.head.address1)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.getByRole('heading', { name: /edit address/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'address-refused',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await openAdd(page, /^address book/i, /add address/i)
      const sheet = dialog(page)
      await sheet.locator('#addr-a1').fill('18 Pier Road')
      await sheet.locator('#addr-city').fill('Tacoma')
      await sheet.locator('#addr-zip').fill('98402')
      await sheet.getByRole('button', { name: /^save$/i }).click()
      await expect(sheet.locator('[data-slot="field-error"]').first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'address-delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^address book/i, companyAddresses.warehouse.address1)
      await page.getByRole('menuitem', { name: /^(delete|remove)$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this address\?/i })).toBeVisible()
    },
  },
  // Tax registration
  {
    screen: 'DA-CUS-05',
    state: 'tax-menu',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^tax registration/i, companyTaxNumber.value)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'tax-add',
    variant: 'admin',
    reach: async (page) => {
      await openEmpty(page)
      await openAdd(page, /^tax registration/i, /add registration/i)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'tax-edit',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^tax registration/i, companyTaxNumber.value)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.getByRole('heading', { name: /edit tax registration/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'tax-delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, /^tax registration/i, companyTaxNumber.value)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this registration\?/i })).toBeVisible()
    },
  },
  // Exemption certificates
  {
    screen: 'DA-CUS-05',
    state: 'certificates',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await toMiddle(card(page, certificates))
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-menu-pending',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, certificates, certificateNumbers.pending)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-menu-accepted',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, certificates, certificateNumbers.verified)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-add',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await openAdd(page, certificates, /add certificate/i)
      await dialog(page).locator('#tax_exemption_reason_id').click()
      await expect(page.getByRole('option').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-add-refused',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await openAdd(page, certificates, /add certificate/i)
      await dialog(page)
        .getByRole('button', { name: /^create$/i })
        .click()
      await expect(dialog(page).locator('[data-slot="field-error"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-accepted',
    variant: 'admin',
    reach: async (page, theme) => {
      const number = `FID-ACCEPT-${theme.toUpperCase()}`
      await freshCertificate(number)
      await openCompany(page, companies.bistro)
      await rowMenu(page, certificates, number)
      await page.getByRole('menuitem', { name: /^accept$/i }).click()
      await expect(page.getByText(/certificate accepted/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: async (theme) => {
      const path = `companies/${companies.bistro.id}/tax_exemption_certificates`
      const made = (await list(api, headers, path)).find(
        (each) => each.certificate_number === `FID-ACCEPT-${theme.toUpperCase()}`,
      )
      if (made) await removeCertificate(made)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-revoke-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, certificates, certificateNumbers.verified)
      await page.getByRole('menuitem', { name: /^revoke$/i }).click()
      await expect(page.getByRole('heading', { name: /revoke this certificate\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-revoked',
    variant: 'admin',
    reach: async (page, theme) => {
      const number = `FID-REVOKE-${theme.toUpperCase()}`
      const made = await freshCertificate(number)
      await call(
        api,
        headers,
        'patch',
        `companies/${companies.bistro.id}/tax_exemption_certificates/${made.id}/verify`,
      )
      await openCompany(page, companies.bistro)
      await rowMenu(page, certificates, number)
      await page.getByRole('menuitem', { name: /^revoke$/i }).click()
      await dialog(page)
        .getByRole('button', { name: /^revoke$/i })
        .click()
      await expect(page.getByText(/certificate revoked/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: async (theme) => {
      const path = `companies/${companies.bistro.id}/tax_exemption_certificates`
      const made = (await list(api, headers, path)).find(
        (each) => each.certificate_number === `FID-REVOKE-${theme.toUpperCase()}`,
      )
      if (made) await removeCertificate(made)
    },
  },
  {
    screen: 'DA-CUS-05',
    state: 'certificate-delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroup(page)
      await rowMenu(page, certificates, certificateNumbers.pending)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this certificate\?/i })).toBeVisible()
    },
  },
  directVisit('DA-CUS-05', () => companyPath(companies.group)),
]

// Wholesale states of earlier screens

const fieldNamed = (page: Page, label: RegExp) =>
  page
    .locator('[data-slot="field"]')
    .filter({ has: page.locator('[data-slot="field-label"]', { hasText: label }) })
    .first()

async function chooseCompany(page: Page, name: string) {
  await openStore(page, '/orders/new')
  await expect(page.getByRole('heading', { name: /^new order$/i })).toBeVisible({ timeout: 15_000 })
  const company = fieldNamed(page, /^company/i).getByRole('combobox')
  await company.click()
  await page.keyboard.type(name.split(' ')[0])
  await page
    .getByRole('option', { name: new RegExp(name.replace('&', '.'), 'i') })
    .first()
    .click()
}

const wholesaleCaptures: Capture[] = [
  ...(['admin', 'orderManager'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-03',
      state: 'company-chosen',
      variant,
      reach: (page) => chooseCompany(page, companyNames.group),
    }),
  ),
  {
    screen: 'DA-ORD-03',
    state: 'purchase-order-company',
    variant: 'admin',
    fullPage: true,
    // Spree asks for the number only at a buyer's checkout, and never of an
    // order staff key in (Spree::Checkout::DefaultRequirements), so the screen
    // has no refusal to show: the company that requires one is chosen, with a
    // member and a product, and the order is not created.
    reach: async (page) => {
      await chooseCompany(page, companyNames.bistro)
      const customer = fieldNamed(page, /^select customer$/i).getByRole('combobox')
      await customer.click()
      await page.keyboard.type('fidelity-company-member')
      await page
        .getByRole('option', { name: /fidelity-company-member|kapoor/i })
        .first()
        .click()
      await page.getByPlaceholder(/search variant/i).click()
      await page.keyboard.type('Fidelity trade')
      await page
        .getByRole('option', { name: /fidelity trade sampler/i })
        .first()
        .click()
      await expect(
        page.getByRole('cell', { name: /fidelity trade sampler/i }).first(),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-13',
    state: 'audience-company',
    variant: 'admin',
    handOff: 'Catalog part 2: a company as a catalog’s audience',
    reach: async (page) => {
      await openStore(page, `/products/catalogs/${companies.catalog.id}`)
      await expect(page.getByRole('heading', { name: catalogName }).first()).toBeVisible({
        timeout: 15_000,
      })
      await settle(page)
      const audiences = card(page, /^audiences/i)
      if (await audiences.isVisible().catch(() => false)) await toMiddle(audiences)
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'wholesale-buyer',
    variant: 'admin',
    fullPage: true,
    handOff: 'Batch 10, G-96: the company and wholesale states of the customer page',
    reach: async (page) => {
      await openStore(page, `/customers/${companies.wholesaleBuyer.id}`)
      await expect(page.getByRole('heading', { name: /marisol ortega/i }).first()).toBeVisible({
        timeout: 15_000,
      })
      await settle(page)
    },
  },
]

let baseURL = 'http://localhost:5174'

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  seeded = await seed(baseURL)
  companies = await seedCompanies(baseURL)
  api = await request.newContext({ baseURL })
  headers = (await admin(api)).headers
})

test.afterAll(async () => {
  await api?.dispose()
})

test.use({ viewport: { width: 1280, height: 960 } })

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

async function save(
  page: Page,
  item: Capture,
  theme: Theme,
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
  writeFileSync(
    `${folder}${name}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        role: item.variant === 'admin' ? null : roles[teammates[item.variant].role],
        theme,
        revision,
        path: new URL(page.url()).pathname.replace(seeded.storeId, '<store>'),
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        handOff: item.handOff ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

const only = process.env.FIDELITY_ONLY ? new RegExp(process.env.FIDELITY_ONLY) : null

for (const theme of ['light', 'dark'] as const) {
  for (const item of [...listCaptures, ...companyCaptures, ...wholesaleCaptures]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    if (only && !only.test(label)) continue
    test(label, async ({ page }) => {
      // A full run outlasts the admin's token, so each capture signs in afresh.
      headers = (await admin(api)).headers
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      try {
        await signIn(page, item.variant)
        await item.reach(page, theme)
        const settled = item.loading ? null : await settle(page)
        await page.waitForTimeout(400)
        await save(page, item, theme, settled, outside)
      } finally {
        await item.after?.(theme)
      }
    })
  }
}
