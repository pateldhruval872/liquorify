import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { type Developers, endpoints, seedDevelopers } from './developers'
import { seed } from './staff'

/**
 * Reproduces B16 on Spree's running dashboard: the JSON drawer's Expand all and
 * Collapse all do the opposite of what they say. It opens the order sync
 * endpoint's record in the drawer, uses the toolbar's two buttons and the depth
 * list's two options of the same names, and saves after each step what the
 * drawer should show, what it shows and a screenshot of it, in light and dark.
 * Start the screens first (see compare.spec.ts).
 *
 * The record's 16 fields sit one level down and its two subscriptions two, so
 * the drawer shows one of three things: the record folded to one line, the
 * fields with the subscriptions folded, or everything. The test passes while
 * the drawer behaves as B16 records, and fails once a step shows what its
 * label says, so a change in Spree's behaviour cannot pass unnoticed.
 */

const results = new URL('./results/json-drawer/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Shown = 'the record folded to one line' | 'the fields, subscriptions folded' | 'everything'

interface Step {
  name: string
  control: string
  act: (sheet: Locator) => Promise<void>
  expected: Shown
  /** What the drawer showed when B16 was recorded. */
  recorded: Shown
}

const button = (label: string) => (sheet: Locator) =>
  sheet.getByRole('button', { name: label, exact: true }).click()
const depth = (value: string) => (sheet: Locator) =>
  sheet
    .locator('select')
    .selectOption(value)
    .then(() => undefined)

const steps: Step[] = [
  {
    name: 'opened',
    control: 'None: the drawer as it opens, at depth 2',
    act: async () => {},
    expected: 'everything',
    recorded: 'everything',
  },
  {
    name: 'expand-all-button',
    control: 'The Expand all button',
    act: button('Expand all'),
    expected: 'everything',
    recorded: 'the record folded to one line',
  },
  {
    name: 'depth-1',
    control: 'Depth 1, in the depth list',
    act: depth('1'),
    expected: 'the fields, subscriptions folded',
    recorded: 'the fields, subscriptions folded',
  },
  {
    name: 'collapse-all-button',
    control: 'The Collapse all button',
    act: button('Collapse all'),
    expected: 'the record folded to one line',
    recorded: 'everything',
  },
  {
    name: 'expand-all-option',
    control: 'Expand all, in the depth list',
    act: depth('open'),
    expected: 'everything',
    recorded: 'the record folded to one line',
  },
  {
    name: 'collapse-all-option',
    control: 'Collapse all, in the depth list',
    act: depth('all'),
    expected: 'the record folded to one line',
    recorded: 'everything',
  },
]

let developers: Developers

test.beforeAll(async ({ baseURL }) => {
  await seed(baseURL as string)
  developers = await seedDevelopers(baseURL as string)
})

async function openDrawer(page: Page) {
  const session = await login(page)
  await page.goto(`/${session.store_id}/settings/webhooks/${developers.endpointIds.orderSync}`)
  await expect(page.getByRole('heading', { level: 1, name: endpoints.orderSync.name })).toBeVisible(
    { timeout: 15_000 },
  )
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: /view as json/i }).click()
  const sheet = page.locator('[data-slot="sheet-content"]')
  await expect(sheet.getByText(`"${endpoints.orderSync.url}"`)).toBeVisible({ timeout: 15_000 })
  return sheet
}

async function shown(sheet: Locator): Promise<Shown> {
  const { fields, subscriptions } = await sheet.evaluate((root) => ({
    fields: root.querySelectorAll('.w-rjv-object-key').length,
    subscriptions: (root as HTMLElement).innerText.includes('order.placed'),
  }))
  if (subscriptions) return 'everything'
  return fields > 0 ? 'the fields, subscriptions folded' : 'the record folded to one line'
}

for (const theme of ['light', 'dark'] as const) {
  test(`B16 on the JSON drawer ${theme}`, async ({ page }) => {
    mkdirSync(results, { recursive: true })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    const sheet = await openDrawer(page)
    const observed = []
    for (const step of steps) {
      await step.act(sheet)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(500)
      writeFileSync(`${results}${step.name}-${theme}.png`, await sheet.screenshot())
      observed.push({
        step: step.name,
        control: step.control,
        expected: step.expected,
        shown: await shown(sheet),
        depthList: await sheet.locator('select').inputValue(),
      })
    }
    writeFileSync(
      `${results}b16-${theme}.json`,
      JSON.stringify(
        {
          defect: 'B16',
          theme,
          revision,
          path: `/settings/webhooks/${developers.endpointIds.orderSync}`,
          record: 'The order sync endpoint, viewed as JSON from More actions',
          steps: observed,
        },
        null,
        2,
      ),
    )
    expect(observed.map((item) => item.shown)).toEqual(steps.map((step) => step.recorded))
  })
}
