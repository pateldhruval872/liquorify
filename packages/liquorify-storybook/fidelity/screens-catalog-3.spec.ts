import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, request, test } from '@playwright/test'
import {
  addListFilter,
  escapeRegex,
  login,
  narrowQuickFilter,
  rowButton,
  searchList,
  sortList,
} from '../../dashboard/e2e/helpers'
import {
  batchPrefix,
  creditMemos,
  customers,
  giftCards,
  type Loyalty,
  promotions,
  seedLoyalty,
} from './loyalty'
import { admin, openRowMenu, PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures catalog part 3's five screens (DA-PRM-01 to 03, DA-LOY-01 and 02)
 * in each state and role the work item maps (§12.2), as
 * `screens-batch-7.spec.ts` captures batch 7's. It gathers evidence for a
 * person to review and passes whenever it can capture a screen; it compares
 * nothing.
 *
 * Start the screens as `compare.spec.ts` describes. Before the first capture
 * it adds the staff and roles (`staff.ts`) and the promotions, gift cards and
 * store credits (`loyalty.ts`) the states need; running it again reuses them.
 * Nothing it captures is saved to a promotion, gift card or credit, except
 * the saved promotion (put back afterwards) and the customer made for the
 * issue dialog (removed afterwards).
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached, and every request
 * the server refused while the capture was made, which is what the narrower
 * roles' refusals in the record are read from.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'orderManager' | 'marketer' | 'loyaltyViewer' | 'merchandiser'

let seeded: Seeded
let baseURL: string
let loyalty: Loyalty

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
  reach: (page: Page) => Promise<void>
  /** Puts back what the capture changed, once it is saved. */
  after?: () => Promise<void>
}

const phone = { width: 390, height: 844 }

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

/** Sends one Admin API request as the store's admin, outside the browser. */
async function asAdmin(method: 'get' | 'post' | 'patch' | 'delete', path: string, data?: object) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const response = await api[method](`/api/v3/admin/${path}`, { headers, data })
    expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBeTruthy()
    return response.status() === 204 ? null : await response.json()
  } finally {
    await api.dispose()
  }
}

const dialog = (page: Page) => page.getByRole('dialog')
const confirmation = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Holds every request with this method to an Admin API path open. */
const hold = (page: Page, path: RegExp, method = 'GET') =>
  page.route(
    (url) => path.test(url.pathname),
    (route) => (route.request().method() === method ? new Promise(() => {}) : route.fallback()),
  )

/** The real answer to a list request, with its records taken out. */
const emptied = (page: Page, path: RegExp) =>
  page.route(
    (url) => path.test(url.pathname),
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

/** A request answered with a server error, after the dashboard asks again. */
const fails = (page: Page, path: RegExp) =>
  page.route(
    (url) => path.test(url.pathname),
    (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 500,
            json: { error: { code: 'internal_error', message: 'Internal error' } },
          })
        : route.fallback(),
  )

/** Scrolls an element to the middle of its scrolling area, for a state lower on a page. */
const toMiddle = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'center' }))

const optionIn = async (page: Page, field: Locator, option: string | RegExp) => {
  await field.click()
  await page.getByRole('option', { name: option }).first().click()
}

/**
 * The dashboard retries a refused request once before it shows the refusal, so
 * a page still reading "Loading…" is given time to reach what it settles on.
 */
const afterRetry = async (page: Page) => {
  await expect(page.getByText(/^Loading…$/))
    .toHaveCount(0, { timeout: 10_000 })
    .catch(() => {})
  await page.waitForTimeout(1_500)
}

/**
 * Adds a filter on related records by searching for one and ticking it, as
 * the browser tests' `addRecordFilter` does, but choosing the option by its
 * whole label, because the list's own rows carry the same text.
 */
const filterTo = async (page: Page, field: RegExp, value: string) => {
  await page.getByRole('button', { name: /add filter/i }).click()
  await page.locator('[data-slot="filter-panel-item"]').getByText(field).click()
  await page.getByPlaceholder(/filter to…/i).fill(value)
  await page.getByRole('button', { name: value, exact: true }).click()
  await page.keyboard.press('Escape')
}

const directVisit = (screen: string, path: string, variant: Variant): Capture => ({
  screen,
  state: 'direct-visit',
  variant,
  reach: async (page) => {
    await openStore(page, path)
    await afterRetry(page)
  },
})

const forRoles = (
  screen: string,
  state: string,
  variants: Variant[],
  reach: (page: Page) => Promise<void>,
): Capture[] => variants.map((variant) => ({ screen, state, variant, reach }))

// DA-PRM-01 Promotions

const promotionsPath = '/promotions'
const searchPromotions = /^search by name…$/i

const openPromotions = async (page: Page) => {
  await openStore(page, promotionsPath)
  await expect(rowButton(page, promotions.running)).toBeVisible({ timeout: 15_000 })
}

/** The list's filters, written into its address as the filter panel writes them. */
const filteredAddress = (
  path: string,
  rules: { field: string; operator: string; value: string }[],
) =>
  `${path}?filters=${encodeURIComponent(
    JSON.stringify(rules.map((rule, index) => ({ id: `fidelity-${index}`, ...rule }))),
  )}`

const today = () => new Date().toISOString().slice(0, 10)

const promotionListCaptures: Capture[] = [
  ...forRoles('DA-PRM-01', 'listed', ['admin', 'marketer', 'loyaltyViewer'], openPromotions),
  directVisit('DA-PRM-01', promotionsPath, 'orderManager'),
  directVisit('DA-PRM-01', promotionsPath, 'merchandiser'),
  {
    screen: 'DA-PRM-01',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openPromotions(page)
      await searchList(page, searchPromotions, 'winter')
      await expect(rowButton(page, promotions.running)).toBeHidden({ timeout: 15_000 })
      await expect(rowButton(page, promotions.manyCodes)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openPromotions(page)
      await searchList(page, searchPromotions, 'no promotion has this name')
      await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'filter-fields',
    variant: 'admin',
    reach: async (page) => {
      await openPromotions(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await expect(page.locator('[data-slot="filter-panel-item"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'filtered-start-and-expiry',
    variant: 'admin',
    intercepted:
      'Reached through the address, because the filter panel does not offer Starts or Expires (see filter-fields)',
    reach: async (page) => {
      await openStore(
        page,
        filteredAddress(promotionsPath, [
          { field: 'starts_at', operator: 'lteq', value: today() },
          { field: 'expires_at', operator: 'gteq', value: today() },
        ]),
      )
      await expect(rowButton(page, promotions.notStarted)).toBeHidden({ timeout: 15_000 })
      await expect(rowButton(page, promotions.running)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'sorted',
    variant: 'admin',
    reach: async (page) => {
      await openPromotions(page)
      await sortList(page, /^starts$/i, 'ascending')
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'none',
    variant: 'admin',
    intercepted: 'The promotions answer has its records taken out',
    reach: async (page) => {
      await emptied(page, /^\/api\/v3\/admin\/promotions$/)
      await openStore(page, promotionsPath)
      await expect(page.getByText('No promotions yet')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPromotions(page)
      await openRowMenu(page, promotions.notStarted)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-01',
    state: 'failing-to-load',
    variant: 'admin',
    intercepted: 'The promotions request is answered with a server error',
    reach: async (page) => {
      await fails(page, /^\/api\/v3\/admin\/promotions$/)
      await openStore(page, promotionsPath)
      await page.waitForTimeout(4_000)
    },
  },
]

// DA-PRM-02 New promotion

const newPromotionPath = '/promotions/new'

const openNewPromotion = async (page: Page) => {
  await openStore(page, newPromotionPath)
  await expect(page.locator('#name')).toBeVisible({ timeout: 15_000 })
}

const ruleKinds = {
  product: { label: /^product\(s\)/i, search: 'Kettle' },
  category: { label: /^categories/i, search: 'Kitchen' },
  customer: { label: /^customers/i, search: 'sarah' },
  customerGroup: { label: /^customer group\(s\)/i, search: 'E2E' },
  country: { label: /^country/i, search: 'Can' },
  channel: { label: /^channel\(s\)/i, search: 'E2E' },
  market: { label: /^market\(s\)/i, search: 'Eur' },
  optionValue: { label: /^option value\(s\)/i, search: 'Black' },
} as const

const settingFreeRules = {
  currency: /^currency/i,
  itemTotal: /^item total/i,
  firstOrder: /^first order/i,
  signedIn: /^only logged in customers/i,
  oneUsePerUser: /^one use per user/i,
} as const

const openRulePicker = async (page: Page) => {
  await page.getByRole('button', { name: /^add rule$/i }).click()
  await expect(page.getByRole('heading', { name: /^add rule$/i })).toBeVisible()
}

const openRuleEditor = async (page: Page, label: RegExp) => {
  await openRulePicker(page)
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(dialog(page).getByRole('button', { name: /^(save|add)$/i })).toBeVisible()
}

const openActionPicker = async (page: Page) => {
  await page.getByRole('button', { name: /^add action$/i }).click()
  await expect(page.getByRole('heading', { name: /^add action$/i })).toBeVisible()
}

const openActionEditor = async (page: Page, label: RegExp) => {
  await openActionPicker(page)
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(dialog(page).getByRole('button', { name: /^(save|add)$/i })).toBeVisible()
}

const addInEditor = (page: Page) =>
  dialog(page)
    .getByRole('button', { name: /^(save|add)$/i })
    .click()

/**
 * Chooses a calculator in an adjustment editor and fills its amounts: each
 * field in turn from `values`, or, with tiers, the base amount from the first
 * value and each tier's order total and discount from the pairs after it.
 */
const fillCalculator = async (page: Page, calculator: RegExp, values: string[], tiers = 0) => {
  const select = page.locator('#calculator-type')
  await expect(select).toBeEnabled({ timeout: 10_000 })
  await optionIn(page, select, calculator)
  const amounts = dialog(page).locator('input[type="number"]')
  await expect(amounts.first()).toBeVisible()
  if (tiers === 0) {
    const count = await amounts.count()
    for (let index = 0; index < count; index++) {
      await amounts.nth(index).fill(values[index % values.length])
    }
    return
  }
  await amounts.first().fill(values[0])
  for (let tier = 0; tier < tiers; tier++) {
    await dialog(page)
      .getByRole('button', { name: /^add tier$/i })
      .click()
    await dialog(page)
      .getByLabel(/^order total/i)
      .nth(tier)
      .fill(values[1 + tier * 2])
    await dialog(page)
      .getByLabel(/^discount$/i)
      .nth(tier)
      .fill(values[2 + tier * 2])
  }
}

const orderCalculators = [
  ['flat-percent', /^flat percent$/i, ['10'], 0],
  ['flat-rate', /^flat rate$/i, ['5'], 0],
  ['flexi-rate', /^flexi(ble)? rate$/i, ['10', '5', '3'], 0],
  ['tiered-flat-rate', /^tiered flat rate$/i, ['5', '100', '15', '250', '40'], 2],
  ['tiered-percent', /^tiered percent$/i, ['5', '100', '10', '250', '20'], 2],
] as const

const itemCalculators = [
  ['flat-rate', /^flat rate$/i, ['2'], 0],
  ['flexi-rate', /^flexi(ble)? rate$/i, ['3', '1', '5'], 0],
  ['percent-per-item', /^percent per (line )?item$/i, ['15'], 0],
] as const

const calculatorCaptures = (
  kind: 'order' | 'item',
  action: RegExp,
  calculators: typeof orderCalculators | typeof itemCalculators,
): Capture[] =>
  calculators.flatMap(([name, calculator, values, tiers]): Capture[] => [
    {
      screen: 'DA-PRM-02',
      state: `${kind}-calculator-${name}`,
      variant: 'admin',
      reach: async (page) => {
        await openNewPromotion(page)
        await openActionEditor(page, action)
        await fillCalculator(page, calculator, [...values], tiers)
      },
    },
    {
      screen: 'DA-PRM-02',
      state: `${kind}-calculator-${name}-summary`,
      variant: 'admin',
      reach: async (page) => {
        await openNewPromotion(page)
        await openActionEditor(page, action)
        await fillCalculator(page, calculator, [...values], tiers)
        await addInEditor(page)
        await expect(dialog(page)).toBeHidden()
        await toMiddle(page.getByRole('button', { name: /^add action$/i }))
      },
    },
  ])

/** Removes any promotion a refused or held capture might have left with this name. */
const removePromotionsNamed = async (name: string) => {
  const found = (await asAdmin('get', `promotions?q[name_eq]=${encodeURIComponent(name)}`)) as {
    data: { id: string }[]
  }
  for (const promotion of found.data) await asAdmin('delete', `promotions/${promotion.id}`)
}

const refusedName = 'Fidelity refused tiers'

const newPromotionCaptures: Capture[] = [
  ...forRoles('DA-PRM-02', 'coupon-code-default', ['admin', 'marketer'], openNewPromotion),
  directVisit('DA-PRM-02', newPromotionPath, 'orderManager'),
  directVisit('DA-PRM-02', newPromotionPath, 'merchandiser'),
  directVisit('DA-PRM-02', newPromotionPath, 'loyaltyViewer'),
  {
    screen: 'DA-PRM-02',
    state: 'automatic',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await optionIn(page, page.locator('#kind'), /automatic/i)
      await expect(page.locator('#code')).toBeHidden()
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'typed-code',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.locator('#name').fill('Fidelity typed code')
      await page.locator('#code').fill('AUTUMN10')
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'generated-code',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.getByRole('button', { name: /^generate$/i }).click()
      await expect(page.locator('#code')).not.toHaveValue('')
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'many-codes',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.getByText('Generate a batch of unique codes').click()
      await expect(page.locator('#number_of_codes')).toBeVisible()
      await page.locator('#number_of_codes').fill('250')
      await page.locator('#code_prefix').fill('SPRING')
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'usage-limit',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.locator('#usage_limit').fill('100')
      await toMiddle(page.locator('#usage_limit'))
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'schedule',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.getByRole('button', { name: /no start date/i }).click()
      await expect(page.getByRole('grid').first()).toBeVisible()
      await toMiddle(page.getByRole('grid').first())
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'rule-picker',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openRulePicker(page)
    },
  },
  ...(['admin', 'marketer'] as const).flatMap((variant) =>
    (Object.entries(ruleKinds) as [string, { label: RegExp; search: string }][]).map(
      ([kind, { label, search }]): Capture => ({
        screen: 'DA-PRM-02',
        state: `rule-${kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        variant,
        reach: async (page) => {
          await openNewPromotion(page)
          await openRuleEditor(page, label)
          const picker = dialog(page).getByRole('combobox').last()
          await picker.click()
          await picker.fill(search)
          await page.waitForTimeout(2_500)
        },
      }),
    ),
  ),
  ...(Object.entries(settingFreeRules) as [string, RegExp][]).map(
    ([kind, label]): Capture => ({
      screen: 'DA-PRM-02',
      state: `rule-${kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      variant: 'admin',
      reach: async (page) => {
        await openNewPromotion(page)
        await openRuleEditor(page, label)
      },
    }),
  ),
  {
    screen: 'DA-PRM-02',
    state: 'match-policy',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openRuleEditor(page, settingFreeRules.firstOrder)
      await addInEditor(page)
      await openRuleEditor(page, settingFreeRules.oneUsePerUser)
      await addInEditor(page)
      await expect(dialog(page)).toBeHidden()
      await page.locator('#match_policy').click()
      await expect(page.getByRole('option').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'editor-cancelled',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openRuleEditor(page, ruleKinds.country.label)
      await dialog(page)
        .getByRole('button', { name: /^cancel$/i })
        .click()
      await expect(dialog(page)).toBeHidden()
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'action-picker',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openActionPicker(page)
    },
  },
  ...calculatorCaptures('order', /^create whole-order adjustment/i, orderCalculators),
  ...calculatorCaptures('item', /^create per-line-item adjustment/i, itemCalculators),
  {
    screen: 'DA-PRM-02',
    state: 'free-line-items',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openActionEditor(page, /^create line items/i)
      const picker = dialog(page).getByRole('combobox').last()
      await picker.click()
      await picker.fill('Kettle')
      await page.getByRole('option').first().click()
      await page.waitForTimeout(800)
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'free-shipping',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await openActionEditor(page, /^free shipping/i)
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'tier-over-100-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.locator('#name').fill(refusedName)
      await page.locator('#code').fill('FIDTIERS')
      await openActionEditor(page, /^create whole-order adjustment/i)
      await fillCalculator(page, /^tiered percent$/i, ['5', '100', '500'], 1)
      await addInEditor(page)
      await expect(dialog(page)).toBeHidden()
      await page.getByRole('button', { name: /^create promotion$/i }).click()
      await expect(page.getByText(/between 0% and 100%/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: () => removePromotionsNamed(refusedName),
  },
  {
    screen: 'DA-PRM-02',
    state: 'field-errors',
    variant: 'admin',
    reach: async (page) => {
      await openNewPromotion(page)
      await page.getByRole('button', { name: /^create promotion$/i }).click()
      await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true')
    },
  },
  {
    screen: 'DA-PRM-02',
    state: 'saving',
    variant: 'admin',
    intercepted: 'The create request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, /^\/api\/v3\/admin\/promotions$/, 'POST')
      await openNewPromotion(page)
      await page.locator('#name').fill('Fidelity held promotion')
      await page.locator('#code').fill('FIDHELD')
      await page.getByRole('button', { name: /^create promotion$/i }).click()
      await expect(page.getByRole('button', { name: /creating|saving/i })).toBeVisible()
    },
    after: () => removePromotionsNamed('Fidelity held promotion'),
  },
]

// DA-PRM-03 Promotion

const promotionPath = (key: keyof typeof promotions) => `/promotions/${loyalty.ids.promotions[key]}`

const openPromotion = (key: keyof typeof promotions) => async (page: Page) => {
  await openStore(page, promotionPath(key))
  await expect(page.getByRole('heading', { name: promotions[key] })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText(/^actions$/i).first()).toBeVisible()
}

/** The bordered row of a rule or action, found by its title. */
const editorRow = (page: Page, title: RegExp) =>
  page.locator('div.items-stretch').filter({ hasText: title }).first()

const savedDescription = 'Fifteen percent off each item for signed-in regulars, saved again.'

const promotionCaptures: Capture[] = [
  ...forRoles('DA-PRM-03', 'rules-and-actions', ['admin', 'marketer'], openPromotion('manyCodes')),
  // The loyalty viewer may read promotions, but the page may not finish loading for it.
  ...(['manyCodes', 'running'] as const).map(
    (key): Capture => ({
      screen: 'DA-PRM-03',
      state: key === 'manyCodes' ? 'rules-and-actions' : 'summaries-running',
      variant: 'loyaltyViewer',
      reach: async (page) => {
        await openStore(page, promotionPath(key))
        await afterRetry(page)
        await page.waitForTimeout(5_000)
      },
    }),
  ),
  {
    screen: 'DA-PRM-03',
    state: 'rules-and-actions',
    variant: 'admin',
    phone: true,
    reach: openPromotion('manyCodes'),
  },
  {
    screen: 'DA-PRM-03',
    state: 'direct-visit',
    variant: 'orderManager',
    reach: async (page) => {
      await openStore(page, promotionPath('manyCodes'))
      await afterRetry(page)
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'direct-visit',
    variant: 'merchandiser',
    reach: async (page) => {
      await openStore(page, promotionPath('manyCodes'))
      await afterRetry(page)
    },
  },
  ...(
    [
      ['summaries-running', 'running'],
      ['summaries-expired', 'expired'],
      ['summaries-tiered', 'tiered'],
      ['summaries-not-started', 'notStarted'],
      ['locked-trigger-single-code', 'singleCode'],
    ] as const
  ).map(
    ([state, key]): Capture => ({
      screen: 'DA-PRM-03',
      state,
      variant: 'admin',
      reach: openPromotion(key),
    }),
  ),
  {
    screen: 'DA-PRM-03',
    state: 'rule-editor-opened',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('running')(page)
      await editorRow(page, /^country/i).click()
      await expect(dialog(page).getByRole('button', { name: /^save$/i })).toBeVisible()
      await page.waitForTimeout(1_000)
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'more-actions',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('notStarted')(page)
      await page.getByRole('button', { name: /more actions/i }).click()
      await expect(page.getByRole('menuitem').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'remove-rule-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('running')(page)
      await editorRow(page, /^country/i)
        .getByRole('button')
        .last()
        .click()
      await expect(page.getByRole('heading', { name: /remove rule\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'remove-action-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('manyCodes')(page)
      await editorRow(page, /^free shipping/i)
        .getByRole('button')
        .last()
        .click()
      await expect(page.getByRole('heading', { name: /remove action\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'rule-removed-unsaved',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('running')(page)
      await editorRow(page, /^country/i)
        .getByRole('button')
        .last()
        .click()
      await confirmation(page)
        .getByRole('button', { name: /^remove$/i })
        .click()
      await expect(page.getByText(/^united states, canada$/i)).toHaveCount(0, { timeout: 5_000 })
      await expect(page.getByRole('button', { name: /^save$/i })).toBeEnabled()
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'action-removed-unsaved',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('running')(page)
      await editorRow(page, /^create whole-order adjustment/i)
        .getByRole('button')
        .last()
        .click()
      await confirmation(page)
        .getByRole('button', { name: /^remove$/i })
        .click()
      await expect(page.getByText(/^flat percent · /i)).toHaveCount(0, { timeout: 5_000 })
      await expect(page.getByRole('button', { name: /^save$/i })).toBeEnabled()
    },
  },
  // A saved rule opened by the marketer, who may not read what it picks from.
  ...(
    [
      ['saved-rule-products-unreadable', 'manyCodes', /^product\(s\)/i],
      ['saved-rule-customers-unreadable', 'singleCode', /^customers/i],
    ] as const
  ).map(
    ([state, key, title]): Capture => ({
      screen: 'DA-PRM-03',
      state,
      variant: 'marketer',
      reach: async (page) => {
        await openPromotion(key)(page)
        await editorRow(page, title).click()
        await expect(dialog(page).getByRole('button', { name: /^save$/i })).toBeVisible()
        await afterRetry(page)
      },
    }),
  ),
  {
    screen: 'DA-PRM-03',
    state: 'tiers-editor',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('tiered')(page)
      await editorRow(page, /^create whole-order adjustment/i).click()
      await expect(page.locator('#calculator-type')).toContainText(/tiered flat rate/i, {
        timeout: 10_000,
      })
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'tier-added',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('tiered')(page)
      await editorRow(page, /^create whole-order adjustment/i).click()
      await expect(page.locator('#calculator-type')).toContainText(/tiered flat rate/i, {
        timeout: 10_000,
      })
      await dialog(page)
        .getByRole('button', { name: /^add tier$/i })
        .click()
      await dialog(page)
        .getByLabel(/^order total/i)
        .last()
        .fill('1000')
      await dialog(page)
        .getByLabel(/^discount$/i)
        .last()
        .fill('120')
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'tier-removed',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('tiered')(page)
      await editorRow(page, /^create whole-order adjustment/i).click()
      await expect(page.locator('#calculator-type')).toContainText(/tiered flat rate/i, {
        timeout: 10_000,
      })
      const tiers = dialog(page).getByLabel(/^order total/i)
      const before = await tiers.count()
      await dialog(page)
        .getByRole('button', { name: /^remove tier$/i })
        .first()
        .click()
      await expect(tiers).toHaveCount(before - 1)
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'codes-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('manyCodes')(page)
      await page.getByRole('button', { name: /^show codes$/i }).click()
      await expect(
        dialog(page).getByText(new RegExp(escapeRegex(loyalty.ids.usedCode), 'i')),
      ).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'codes-sheet-next-page',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('manyCodes')(page)
      await page.getByRole('button', { name: /^show codes$/i }).click()
      await expect(
        dialog(page)
          .getByText(/^winter/i)
          .first(),
      ).toBeVisible({ timeout: 15_000 })
      await dialog(page).getByRole('button', { name: /next/i }).click()
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'codes-export',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('manyCodes')(page)
      await page.getByRole('button', { name: /^show codes$/i }).click()
      await dialog(page)
        .getByRole('button', { name: /export csv/i })
        .click()
      await page.waitForTimeout(2_000)
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'unsaved',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('singleCode')(page)
      await page.locator('#description').fill(savedDescription)
      await expect(page.getByRole('button', { name: /^save$/i })).toBeEnabled()
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'saved',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('singleCode')(page)
      await page.locator('#description').fill(savedDescription)
      await page.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByText(/promotion saved/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: async () => {
      await asAdmin('patch', `promotions/${loyalty.ids.promotions.singleCode}`, {
        description: 'Fifteen percent off each item for signed-in regulars.',
      })
    },
  },
  // The browser's own number check stops a usage limit below one before any
  // request, so the server's refusal is reached with a name of spaces instead.
  {
    screen: 'DA-PRM-03',
    state: 'usage-limit-below-one',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('singleCode')(page)
      await page.locator('#usage_limit').fill('0')
      await page.getByRole('button', { name: /^save$/i }).click()
      await page.waitForTimeout(2_000)
      await toMiddle(page.locator('#usage_limit'))
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await openPromotion('singleCode')(page)
      await page.locator('#name').fill('   ')
      await page.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByText(/can't be blank/i).first()).toBeVisible({ timeout: 15_000 })
    },
    after: async () => {
      await asAdmin('patch', `promotions/${loyalty.ids.promotions.singleCode}`, {
        name: promotions.singleCode,
      })
    },
  },
  {
    screen: 'DA-PRM-03',
    state: 'failing-to-load',
    variant: 'admin',
    intercepted: 'The promotion request is answered with a server error',
    reach: async (page) => {
      await fails(page, /^\/api\/v3\/admin\/promotions\/promo_[A-Za-z0-9]+$/)
      await openStore(page, promotionPath('manyCodes'))
      await page.waitForTimeout(4_000)
    },
  },
]

// DA-LOY-01 Gift cards

const giftCardsPath = '/loyalty/gift-cards'
const searchGiftCards = /^search by code…$/i

const openGiftCards = async (page: Page) => {
  await openStore(page, giftCardsPath)
  await expect(page.getByText(giftCards.partlyRedeemed.toUpperCase()).first()).toBeVisible({
    timeout: 15_000,
  })
}

const openGiftCard = async (page: Page, code: string) => {
  await openGiftCards(page)
  await page.getByText(code.toUpperCase(), { exact: true }).first().click()
  await expect(page.getByRole('heading', { name: code.toUpperCase() })).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog(page).getByText(/^usage$/i)).toBeVisible({ timeout: 15_000 })
}

const openNewGiftCard = async (page: Page) => {
  await openGiftCards(page)
  await page.getByRole('button', { name: /new gift card/i }).click()
  await expect(page.getByRole('heading', { name: /new gift card/i })).toBeVisible()
}

/** No control for cancelling a gift card in its row menu or sheet (G-14). */
const noCancelControl = async (page: Page) => {
  await expect(page.getByRole('menuitem', { name: /cancel/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /cancel gift card|void/i })).toHaveCount(0)
}

const giftCardCaptures: Capture[] = [
  ...forRoles('DA-LOY-01', 'listed', ['admin', 'orderManager', 'loyaltyViewer'], openGiftCards),
  { screen: 'DA-LOY-01', state: 'listed', variant: 'admin', phone: true, reach: openGiftCards },
  directVisit('DA-LOY-01', giftCardsPath, 'marketer'),
  directVisit('DA-LOY-01', giftCardsPath, 'merchandiser'),
  {
    screen: 'DA-LOY-01',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await searchList(page, searchGiftCards, 'fidelity-p')
      await expect(page.getByText('FIDELITY-DESK')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await searchList(page, searchGiftCards, 'no-such-code')
      await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'status-options',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await page.getByRole('button', { name: /^status/i }).click()
      await expect(page.getByRole('menuitemcheckbox').first()).toBeVisible()
    },
  },
  ...(
    [
      ['active', /^active$/i],
      ['partly-redeemed', /^partially redeemed$/i],
      ['redeemed', /^redeemed$/i],
    ] as const
  ).map(
    ([status, keep]): Capture => ({
      screen: 'DA-LOY-01',
      state: `filtered-status-${status}`,
      variant: 'admin',
      reach: async (page) => {
        await openGiftCards(page)
        await narrowQuickFilter(page, /^status/i, keep)
        await page.waitForTimeout(1_500)
      },
    }),
  ),
  {
    screen: 'DA-LOY-01',
    state: 'filter-fields',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await expect(page.locator('[data-slot="filter-panel-item"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'filtered-currency',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^currency$/i)
        .click()
      await page.getByText(/^EUR/).last().click()
      await page.keyboard.press('Escape')
      await expect(page.getByText('FIDELITY-DESK')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'filtered-batch',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await filterTo(page, /^batch$/i, batchPrefix)
      await expect(page.getByText('FIDELITY-DESK')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'filtered-customer',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await filterTo(page, /^customer$/i, customers.withGiftCard)
      await expect(page.getByText('FIDELITY-DESK')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'none',
    variant: 'admin',
    intercepted: 'The gift cards answer has its records taken out',
    reach: async (page) => {
      await emptied(page, /^\/api\/v3\/admin\/gift_cards$/)
      await openStore(page, giftCardsPath)
      await page.waitForTimeout(2_000)
    },
  },
  ...forRoles('DA-LOY-01', 'create-sheet', ['admin', 'orderManager'], openNewGiftCard),
  {
    screen: 'DA-LOY-01',
    state: 'create-sheet-filled',
    variant: 'admin',
    reach: async (page) => {
      await openNewGiftCard(page)
      await page.locator('#code').fill('FIDELITY-THANKS')
      await page.locator('#amount').fill('40.00')
      await optionIn(page, dialog(page).getByRole('combobox').first(), /^EUR/)
      await dialog(page)
        .getByRole('button', { name: /no expiry/i })
        .click()
      await page.getByRole('gridcell').filter({ hasText: /^28$/ }).first().click()
      const customer = dialog(page).getByRole('combobox').last()
      await customer.click()
      await customer.fill(customers.euro)
      await page.getByRole('option', { name: new RegExp(escapeRegex(customers.euro)) }).click()
      await page.waitForTimeout(800)
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'create-sheet-batch',
    variant: 'admin',
    reach: async (page) => {
      await openNewGiftCard(page)
      await page.locator('#quantity').fill('3')
      await page.locator('#code').fill('FIDSPRING')
      await page.locator('#amount').fill('20.00')
      await expect(page.getByRole('button', { name: /create 3 gift cards/i })).toBeVisible()
    },
  },
  ...forRoles(
    'DA-LOY-01',
    'edit-sheet',
    ['admin', 'orderManager', 'loyaltyViewer'],
    async (page) => {
      await openGiftCard(page, giftCards.withCustomer)
      await noCancelControl(page)
    },
  ),
  {
    screen: 'DA-LOY-01',
    state: 'edit-sheet-partly-redeemed',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCard(page, giftCards.partlyRedeemed)
      await noCancelControl(page)
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'edit-sheet-without-customer',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCard(page, giftCards.withoutCustomer)
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'row-actions',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await openRowMenu(page, giftCards.withCustomer.toUpperCase())
      await expect(page.getByRole('menuitem').first()).toBeVisible()
      await noCancelControl(page)
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openGiftCards(page)
      await openRowMenu(page, giftCards.withoutCustomer.toUpperCase())
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete gift card\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'old-address-redirects',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/promotions/gift-cards')
      await expect(page).toHaveURL(/\/loyalty\/gift-cards/, { timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-01',
    state: 'failing-to-load',
    variant: 'admin',
    intercepted: 'The gift cards request is answered with a server error',
    reach: async (page) => {
      await fails(page, /^\/api\/v3\/admin\/gift_cards$/)
      await openStore(page, giftCardsPath)
      await page.waitForTimeout(4_000)
    },
  },
]

// DA-LOY-02 Store credits

const storeCreditsPath = '/loyalty/store-credits'

const openStoreCredits = async (page: Page) => {
  await openStore(page, storeCreditsPath)
  await expect(page.getByText(creditMemos.partlyUsed)).toBeVisible({ timeout: 15_000 })
}

const openCredit = async (page: Page, email: string) => {
  await openStoreCredits(page)
  await rowButton(page, email).click()
  await expect(dialog(page).getByRole('heading', { name: /^ledger$/i })).toBeVisible({
    timeout: 15_000,
  })
}

const openIssueDialog = async (page: Page) => {
  await openStoreCredits(page)
  await page.getByRole('button', { name: /issue store credit/i }).click()
  await expect(dialog(page).getByPlaceholder(/search customers/i)).toBeVisible()
}

const eventsPath = /^\/api\/v3\/admin\/store_credits\/[A-Za-z0-9_]+\/events$/

let newCustomerId: string | null = null

const storeCreditCaptures: Capture[] = [
  ...forRoles('DA-LOY-02', 'listed', ['admin', 'orderManager', 'loyaltyViewer'], openStoreCredits),
  { screen: 'DA-LOY-02', state: 'listed', variant: 'admin', phone: true, reach: openStoreCredits },
  directVisit('DA-LOY-02', storeCreditsPath, 'marketer'),
  directVisit('DA-LOY-02', storeCreditsPath, 'merchandiser'),
  ...(
    [
      ['outstanding', /^outstanding$/i],
      ['spent', /^spent$/i],
    ] as const
  ).map(
    ([standing, keep]): Capture => ({
      screen: 'DA-LOY-02',
      state: `filtered-${standing}`,
      variant: 'admin',
      reach: async (page) => {
        await openStoreCredits(page)
        await narrowQuickFilter(page, /^standing/i, keep)
        await page.waitForTimeout(1_500)
      },
    }),
  ),
  {
    screen: 'DA-LOY-02',
    state: 'filtered-from-gift-card',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await addListFilter(page, /^origin$/i, /^gift card$/i)
      await page.keyboard.press('Escape')
      await expect(page.getByText(creditMemos.partlyUsed)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'filtered-issuer',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await filterTo(page, /^issued by$/i, 'admin@example.com')
      await page.waitForTimeout(1_500)
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'filtered-customer',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await filterTo(page, /^customer$/i, customers.outstandingCredit)
      await expect(page.getByText(creditMemos.partlyUsed)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'filtered-currency',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^currency$/i)
        .click()
      await page.getByText(/^EUR/).last().click()
      await page.keyboard.press('Escape')
      await expect(page.getByText(creditMemos.partlyUsed)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await page.getByRole('searchbox').fill('birthday')
      await expect(page.getByText(creditMemos.partlyUsed)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'search-found-nothing',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await page.getByRole('searchbox').fill('no credit has this memo')
      await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'none',
    variant: 'admin',
    intercepted: 'The store credits answer has its records taken out',
    reach: async (page) => {
      await emptied(page, /^\/api\/v3\/admin\/store_credits$/)
      await openStore(page, storeCreditsPath)
      await page.waitForTimeout(2_000)
    },
  },
  ...forRoles('DA-LOY-02', 'issue-dialog', ['admin', 'orderManager'], openIssueDialog),
  {
    screen: 'DA-LOY-02',
    state: 'issue-dialog-filled',
    variant: 'admin',
    reach: async (page) => {
      await openIssueDialog(page)
      await dialog(page)
        .getByPlaceholder(/search customers/i)
        .fill(customers.outstandingCredit)
      await page
        .getByRole('option', { name: new RegExp(escapeRegex(customers.outstandingCredit)) })
        .click()
      await dialog(page)
        .getByLabel(/amount/i)
        .fill('20')
      await dialog(page).getByLabel(/memo/i).fill('Thanks for waiting on a back order')
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'issuing',
    variant: 'admin',
    intercepted: 'The issue request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, /^\/api\/v3\/admin\/customers\/[A-Za-z0-9_]+\/store_credits$/, 'POST')
      await openIssueDialog(page)
      await dialog(page)
        .getByPlaceholder(/search customers/i)
        .fill(customers.outstandingCredit)
      await page
        .getByRole('option', { name: new RegExp(escapeRegex(customers.outstandingCredit)) })
        .click()
      await dialog(page)
        .getByLabel(/amount/i)
        .fill('20')
      await dialog(page)
        .getByRole('button', { name: /^issue store credit$/i })
        .click()
      await expect(dialog(page).getByRole('button', { name: /issuing|saving/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'issue-to-customer-created-after-search',
    variant: 'admin',
    reach: async (page) => {
      const email = `fidelity-new-${Date.now()}@example.com`
      await openIssueDialog(page)
      await dialog(page)
        .getByPlaceholder(/search customers/i)
        .fill(email)
      await expect(page.getByText(/no customers match/i)).toBeVisible({ timeout: 15_000 })
      const created = (await asAdmin('post', 'customers', {
        email,
        first_name: 'Noor',
        last_name: 'Fidelity',
      })) as { id: string }
      newCustomerId = created.id
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
      await expect(dialog(page)).toHaveCount(0)
      await page.getByRole('button', { name: /issue store credit/i }).click()
      await dialog(page)
        .getByPlaceholder(/search customers/i)
        .fill(email)
      await expect(page.getByRole('option', { name: new RegExp(escapeRegex(email)) })).toBeVisible({
        timeout: 15_000,
      })
    },
    after: async () => {
      if (newCustomerId) await asAdmin('delete', `customers/${newCustomerId}`)
      newCustomerId = null
    },
  },
  ...forRoles('DA-LOY-02', 'credit-sheet', ['admin', 'orderManager', 'loyaltyViewer'], (page) =>
    openCredit(page, customers.partlyUsedCredit),
  ),
  {
    screen: 'DA-LOY-02',
    state: 'credit-sheet-from-gift-card',
    variant: 'admin',
    reach: (page) => openCredit(page, customers.partlyRedeemed),
  },
  {
    screen: 'DA-LOY-02',
    state: 'credit-sheet-empty-history',
    variant: 'admin',
    intercepted: "The credit's history answer has its records taken out",
    reach: async (page) => {
      await emptied(page, eventsPath)
      await openCredit(page, customers.outstandingCredit)
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'credit-sheet-history-failing',
    variant: 'admin',
    intercepted: "The credit's history request is answered with a server error",
    reach: async (page) => {
      await fails(page, eventsPath)
      await openCredit(page, customers.outstandingCredit)
      await page.waitForTimeout(4_000)
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'credit-sheet-erased-customer',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await page
        .getByRole('row')
        .filter({ hasText: '$15.00' })
        .filter({ hasText: /^—/ })
        .first()
        .getByRole('button')
        .first()
        .click()
      await expect(dialog(page).getByRole('heading', { name: /^ledger$/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'followed-to-customer',
    variant: 'admin',
    reach: async (page) => {
      await openCredit(page, customers.partlyUsedCredit)
      await dialog(page)
        .getByRole('link', { name: /open customer profile/i })
        .click()
      await expect(page.getByText(customers.partlyUsedCredit).first()).toBeVisible({
        timeout: 15_000,
      })
      await expect(page).toHaveURL(/\/customers\//)
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'edit-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await openRowMenu(page, creditMemos.outstanding)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(dialog(page).getByRole('heading', { name: /edit store credit/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'edit-dialog-partly-used',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await openRowMenu(page, creditMemos.partlyUsed)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(dialog(page).getByRole('heading', { name: /edit store credit/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openStoreCredits(page)
      await openRowMenu(page, creditMemos.outstanding)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page).getByRole('button', { name: /^delete$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-LOY-02',
    state: 'failing-to-load',
    variant: 'admin',
    intercepted: 'The store credits request is answered with a server error',
    reach: async (page) => {
      await fails(page, /^\/api\/v3\/admin\/store_credits$/)
      await openStore(page, storeCreditsPath)
      await page.waitForTimeout(4_000)
    },
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  loyalty = await seedLoyalty(baseURL)
})

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })

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

/** Every Admin API request the server refused while the capture was made. */
function watchRefusals(page: Page) {
  const refused: { method: string; path: string; status: number }[] = []
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (!url.pathname.startsWith('/api/v3/admin/') || ![401, 403, 404].includes(response.status()))
      return
    if (url.pathname.endsWith('/auth/refresh')) return
    const entry = {
      method: response.request().method(),
      path: decodeURIComponent(`${url.pathname}${url.search}`),
      status: response.status(),
    }
    if (!refused.some((seen) => JSON.stringify(seen) === JSON.stringify(entry))) refused.push(entry)
  })
  return refused
}

async function save(
  page: Page,
  item: Capture,
  theme: 'light' | 'dark',
  settled: boolean | null,
  outside: string[],
  refused: { method: string; path: string; status: number }[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({ path: `${folder}${name}.png` })
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
        viewport: page.viewportSize(),
        intercepted: item.intercepted ?? null,
        settled,
        outside,
        refused,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [
    ...promotionListCaptures,
    ...newPromotionCaptures,
    ...promotionCaptures,
    ...giftCardCaptures,
    ...storeCreditCaptures,
  ]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      const refused = watchRefusals(page)
      try {
        await signIn(page, item.variant)
        await item.reach(page)
        const settled = item.loading ? null : await settle(page)
        await page.waitForTimeout(400)
        await save(page, item, theme, settled, outside, refused)
      } finally {
        await item.after?.()
      }
    })
  }
}
