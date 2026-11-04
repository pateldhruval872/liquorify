import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import {
  blockOutside,
  expectFailureWhenSabotaged,
  type Headers,
  list,
  onTop,
  openIn,
  recorder,
  reload,
  type Steps,
  sabotage,
  sabotaged,
  stamp,
  withBody,
} from './p9'
import { admin } from './staff'

/**
 * The platform batch's step P9, item 1.4: Getting Started's store address
 * dialog, the storefront address, the payment method task's link and the
 * tasks shown done after a reload (G-37 with G-68). The tests, their expected
 * results and the closing conditions were recorded in the work item before
 * these were written.
 *
 * Every test runs as the browser tests' admin in their second store, Winkel,
 * which starts with none of its six tasks done. Each test first puts the store
 * back to that: no address on the location the address task reads, no
 * storefront address and no payment method of this script's own. Everything
 * stays inside Winkel; nothing here looks at another store, and the taxes
 * task, which any store's tax rate marks done (ISO-6), is recorded but never
 * asserted.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes. With `P9_SABOTAGE=1` each test undoes the
 * change it looks for (see p9.ts). The storefront sheet shows the store's
 * Store API address and publishable key: both are painted out in every
 * screenshot taken while it is open, and neither is written to a file.
 */

const { snap, save } = recorder('getting-started')

const tasks = {
  address: 'Add your shipping address',
  payment: 'Set up payment methods',
  products: 'Add products',
  supportEmail: 'Set customer support email',
  taxes: 'Set up taxes collection',
  storefront: 'Set up storefront',
} as const

type Task = keyof typeof tasks

const address = {
  company: `P9 Winkel ${stamp}`,
  street: 'Keizersgracht 123',
  city: 'Amsterdam',
  postalCode: '1015 CJ',
  country: 'Netherlands',
}
const storefrontUrl = `https://p9-${stamp}.example.com`
/**
 * Two values that are not an address: the one batch 3 recorded the sheet
 * refusing (SD-7), and words with spaces, which Chromium's address parser
 * accepts.
 */
const notAddresses = {
  scheme: 'https://',
  words: 'not an address',
}
const invalidUrlMessage = "This doesn't look like a valid storefront URL."
const paymentPrefix = 'P9 cheque'
const paymentName = `${paymentPrefix} ${stamp}`

/** The storefront sheet's Store API address and publishable key. */
const credentialsInSheet = '[role="dialog"] input[readonly]'

const winkel = () => getCredentials().comma_store_id

// --- Putting Winkel back to no tasks done ------------------------------------

async function inWinkel<T>(baseURL: string, work: (api: APIRequestContext, headers: Headers) => T) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    return await work(api, { ...headers, 'X-Spree-Store-Id': winkel() })
  } finally {
    await api.dispose()
  }
}

/** The location the address task reads, chosen as the task chooses it. */
async function addressLocation(api: APIRequestContext, headers: Headers) {
  const firstParty = 'q[seller_id_null]=true&q[active_eq]=true'
  const [returns] = await list<{ id: string }>(
    api,
    headers,
    `stock_locations?${firstParty}&q[returns_enabled_eq]=true`,
  )
  const location =
    returns ?? (await list<{ id: string }>(api, headers, `stock_locations?${firstParty}`))[0]
  expect(location, "Winkel's address location").toBeTruthy()
  return location.id
}

const blankAddress = {
  address1: null,
  address2: null,
  city: null,
  zipcode: null,
  phone: null,
  company: null,
}

async function noTasksDone(baseURL: string) {
  await inWinkel(baseURL, async (api, headers) => {
    const locationId = await addressLocation(api, headers)
    const cleared = await api.patch(`/api/v3/admin/stock_locations/${locationId}`, {
      headers,
      data: blankAddress,
    })
    expect(cleared.ok(), await cleared.text()).toBeTruthy()
    const store = await api.patch('/api/v3/admin/store', {
      headers,
      data: { storefront_url: null },
    })
    expect(store.ok(), await store.text()).toBeTruthy()
    for (const method of await list<{ id: string; name: string }>(api, headers, 'payment_methods'))
      if (method.name.startsWith(paymentPrefix)) {
        const removed = await api.delete(`/api/v3/admin/payment_methods/${method.id}`, { headers })
        expect([204, 404]).toContain(removed.status())
      }
    // The allowed origins a saved storefront address adds.
    for (const origin of await list<{ id: string; origin: string }>(
      api,
      headers,
      'allowed_origins',
    ))
      if (/^https:\/\/(p9-[a-z0-9]+\.example\.com|not%20an%20address)$/.test(origin.origin)) {
        const removed = await api.delete(`/api/v3/admin/allowed_origins/${origin.id}`, { headers })
        expect([204, 404]).toContain(removed.status())
      }
  })
}

/** Saves the address through the Admin API, as if the dialog had saved it. */
async function addressSavedAnyway(baseURL: string) {
  await inWinkel(baseURL, async (api, headers) => {
    const locationId = await addressLocation(api, headers)
    await api.patch(`/api/v3/admin/stock_locations/${locationId}`, {
      headers,
      data: {
        address1: address.street,
        city: address.city,
        zipcode: address.postalCode,
        company: address.company,
        country_code: 'NL',
      },
    })
  })
}

// --- Getting Started ---------------------------------------------------------

const progress = (page: Page) => page.getByText(/^\d+ of \d+ completed$/)
const trigger = (page: Page, task: Task) => page.getByRole('button', { name: tasks[task] })
const region = (page: Page, task: Task) => page.getByRole('region', { name: tasks[task] })
/** A task's icon: a green tick once done, an empty grey circle until then. */
const icon = (page: Page, task: Task) => trigger(page, task).locator('svg').first()

async function openGettingStarted(page: Page) {
  await openIn(page, winkel(), '/getting-started')
  await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(progress(page)).toBeVisible({ timeout: 15_000 })
}

async function expectTask(page: Page, task: Task, done: boolean) {
  await expect(icon(page, task), `${tasks[task]} shows ${done ? 'done' : 'not done'}`).toHaveClass(
    done ? /text-success/ : /text-muted-foreground/,
    { timeout: 15_000 },
  )
}

async function taskStates(page: Page) {
  const states: Record<string, 'done' | 'not done'> = {}
  for (const task of Object.keys(tasks) as Task[])
    states[task] = /text-success/.test((await icon(page, task).getAttribute('class')) ?? '')
      ? 'done'
      : 'not done'
  return states
}

const doneCount = (states: Record<string, string>) =>
  Object.values(states).filter((state) => state === 'done').length

async function openTask(page: Page, task: Task) {
  if ((await trigger(page, task).getAttribute('aria-expanded')) !== 'true')
    await trigger(page, task).click()
  await expect(region(page, task)).toBeVisible()
}

// --- The store address dialog ------------------------------------------------

const dialog = (page: Page) => page.getByRole('dialog')

async function openAddressDialog(page: Page) {
  await openTask(page, 'address')
  await region(page, 'address').getByRole('button', { name: 'Save address' }).click()
  await expect(dialog(page).getByRole('heading', { name: tasks.address })).toBeVisible()
}

async function fillAddress(page: Page, { street }: { street: boolean }) {
  await dialog(page).getByLabel('Company').fill(address.company)
  if (street) await dialog(page).getByLabel('Address', { exact: true }).fill(address.street)
  const country = dialog(page).getByRole('combobox', { name: 'Country' })
  if ((await country.innerText()).trim() !== address.country) {
    await country.click()
    await page.getByRole('combobox', { name: 'Search countries…' }).fill(address.country)
    await page.getByRole('option', { name: `${address.country} (NL)` }).click()
  }
  await expect(country).toHaveText(address.country)
  await dialog(page).getByLabel('City').fill(address.city)
  await dialog(page).getByLabel('Postal code').fill(address.postalCode)
}

/** Records every request that would change the address location. */
function locationWrites(page: Page) {
  const writes: string[] = []
  page.on('request', (sent) => {
    if (sent.method() === 'PATCH' && /\/api\/v3\/admin\/stock_locations\//.test(sent.url()))
      writes.push(sent.url().replace(/.*\/api/, '/api'))
  })
  return writes
}

async function saveAddressThroughDialog(page: Page, steps: Steps) {
  await openAddressDialog(page)
  await fillAddress(page, { street: true })
  await dialog(page).getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
  steps.push({ step: 'filled every required field and saved; the dialog closed' })
}

test.describe('Getting Started tasks (P9 item 1.4)', () => {
  test.beforeEach(async ({ baseURL }) => {
    await noTasksDone(baseURL ?? '')
  })

  test('the store address dialog refuses an empty required field and saves nothing', async ({
    page,
    baseURL,
  }) => {
    expectFailureWhenSabotaged()
    const outside = await blockOutside(page)
    const writes = locationWrites(page)
    await login(page)
    await openGettingStarted(page)
    await expectTask(page, 'address', false)
    const before = await progress(page).innerText()
    const steps: Steps = [{ step: 'opened Getting Started in Winkel', progress: before }]

    await openAddressDialog(page)
    await fillAddress(page, { street: false })
    await dialog(page).getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog(page).getByText('Address is required')).toBeVisible()
    await expect(dialog(page).getByLabel('Address', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(dialog(page)).toBeVisible()
    steps.push({
      step: 'filled every required field but the address and saved',
      shown: await dialog(page).locator('[data-slot="field-error"]').allInnerTexts(),
      dialogOpen: await dialog(page).isVisible(),
    })
    await snap(page, 'store-address-refused')
    // Sabotaged: the address is saved all the same, as a dialog that ignored its refusal would.
    if (sabotaged) await addressSavedAnyway(baseURL ?? '')

    await dialog(page).getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog(page)).toBeHidden()
    expect(writes, 'no request changed the address').toEqual([])
    await reload(page)
    await expectTask(page, 'address', false)
    await expect(progress(page)).toHaveText(before)
    await openTask(page, 'address')
    await expect(region(page, 'address')).not.toContainText(address.city)
    await expect(region(page, 'address')).not.toContainText(address.company)
    steps.push({
      step: 'cancelled, then reloaded',
      requestsChangingTheAddress: writes,
      task: 'not done',
      progress: await progress(page).innerText(),
    })
    await save(page, 'store-address-refused', steps, outside)
  })

  test('saving the store address closes the dialog and shows the task done', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/stock_locations\/[^/]+$/,
      withBody(({ address1: _street, ...rest }) => rest),
    )
    await login(page)
    await openGettingStarted(page)
    await expectTask(page, 'address', false)
    const before = await taskStates(page)
    const steps: Steps = [{ step: 'opened Getting Started in Winkel', tasks: before }]

    await saveAddressThroughDialog(page, steps)
    await expectTask(page, 'address', true)
    await expect(progress(page)).toHaveText(`${doneCount(before) + 1} of 6 completed`)
    await expect(region(page, 'address')).toContainText(address.street)
    steps.push({ step: 'the task after saving', progress: await progress(page).innerText() })

    await reload(page)
    await expectTask(page, 'address', true)
    await expect(progress(page)).toHaveText(`${doneCount(before) + 1} of 6 completed`)
    await openTask(page, 'address')
    for (const value of [address.company, address.street, address.postalCode, address.city])
      await expect(region(page, 'address')).toContainText(value)
    const shown = (await region(page, 'address').innerText()).replace(/\s+/g, ' ')
    const tasksAfter = await taskStates(page)
    await region(page, 'address').getByRole('button', { name: 'Save address' }).click()
    await expect(dialog(page).getByLabel('Address', { exact: true })).toHaveValue(address.street)
    await expect(dialog(page).getByLabel('City')).toHaveValue(address.city)
    await expect(dialog(page).getByLabel('Postal code')).toHaveValue(address.postalCode)
    await expect(dialog(page).getByLabel('Company')).toHaveValue(address.company)
    steps.push({
      step: 'reloaded; the task is done, and the dialog opens with the saved address',
      shown,
      tasks: tasksAfter,
    })
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()
    await save(page, 'store-address-saved', steps, outside)
  })

  test('saving the storefront address keeps it after a reload and shows the task done', async ({
    page,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/store$/,
      withBody(({ storefront_url: _url, ...rest }) => rest),
    )
    await login(page)
    await openGettingStarted(page)
    await expectTask(page, 'storefront', false)
    const before = await taskStates(page)
    const steps: Steps = [{ step: 'opened Getting Started in Winkel', tasks: before }]

    await openStorefrontSheet(page)
    await expect(storefrontField(page)).toHaveValue('')
    await storefrontField(page).fill(storefrontUrl)
    await dialog(page).getByRole('button', { name: 'Save & finish setup' }).click()
    await expect(page.getByText(`Storefront URL saved: ${storefrontUrl}`)).toBeVisible()
    await expect(dialog(page)).toBeHidden()
    await expectTask(page, 'storefront', true)
    await expect(progress(page)).toHaveText(`${doneCount(before) + 1} of 6 completed`)
    steps.push({ step: 'entered the address and saved; the sheet closed', address: storefrontUrl })

    await reload(page)
    await expectTask(page, 'storefront', true)
    await expect(progress(page)).toHaveText(`${doneCount(before) + 1} of 6 completed`)
    const tasksAfter = await taskStates(page)
    await openStorefrontSheet(page)
    await expect(storefrontField(page)).toHaveValue(storefrontUrl)
    steps.push({
      step: 'reloaded; the task is done, and the sheet shows the address again',
      shown: await storefrontField(page).inputValue(),
      tasks: tasksAfter,
    })
    await save(page, 'storefront-address-saved', steps, outside, { mask: credentialsInSheet })
  })

  for (const [kind, value] of Object.entries(notAddresses) as [keyof typeof notAddresses, string][])
    test(`a storefront value that is not an address, "${value}", is not saved and its message shows`, async ({
      page,
      baseURL,
    }) => {
      expectFailureWhenSabotaged()
      const outside = await blockOutside(page)
      const storeWrites: string[] = []
      page.on('request', (sent) => {
        if (
          sent.method() !== 'GET' &&
          /\/api\/v3\/admin\/(store|allowed_origins)$/.test(new URL(sent.url()).pathname)
        )
          storeWrites.push(`${sent.method()} ${new URL(sent.url()).pathname}`)
      })
      await login(page)
      await openGettingStarted(page)
      await expectTask(page, 'storefront', false)
      const steps: Steps = [{ step: 'opened Getting Started in Winkel' }]

      await openStorefrontSheet(page)
      await storefrontField(page).fill(value)
      await dialog(page).getByRole('button', { name: 'Save & finish setup' }).click()
      // Whatever the screen says next: a refusal, or a save it should not make.
      const said = page.getByText(invalidUrlMessage).or(page.getByText(/^Storefront URL saved: /))
      await expect(said.first()).toBeAttached({ timeout: 15_000 })
      const shown = {
        refusalInThePage: await page.getByText(invalidUrlMessage).count(),
        refusalAboveTheSheet:
          (await page.getByText(invalidUrlMessage).count()) > 0
            ? await onTop(page, invalidUrlMessage)
            : false,
        savedNotice:
          (await page.getByText(/^Storefront URL saved: /).count()) > 0
            ? await page
                .getByText(/^Storefront URL saved: /)
                .first()
                .innerText()
            : null,
      }
      steps.push({ step: `entered "${value}" and saved`, shown })
      await snap(page, `storefront-not-an-address-${kind}-message`, { mask: credentialsInSheet })
      // SD-7: the refusal is drawn beneath the sheet, so nobody sees it. Kept
      // soft so the run still checks, and records, whether anything was saved.
      expect
        .soft(shown.refusalAboveTheSheet, 'the refusal message shows above the sheet')
        .toBe(true)
      // Sabotaged: the value is saved all the same, as a sheet that ignored its refusal would.
      if (sabotaged)
        await inWinkel(baseURL ?? '', (api, headers) =>
          api.patch('/api/v3/admin/store', { headers, data: { storefront_url: storefrontUrl } }),
        )

      if (await dialog(page).isVisible()) await page.keyboard.press('Escape')
      await expect(dialog(page)).toBeHidden()
      await reload(page)
      const task = (await taskStates(page)).storefront
      await openStorefrontSheet(page)
      const field = await storefrontField(page).inputValue()
      steps.push({
        step: 'closed the sheet and reloaded',
        requestsSavingAnAddress: storeWrites,
        task,
        field,
      })
      await save(page, `storefront-not-an-address-${kind}`, steps, outside, {
        mask: credentialsInSheet,
      })
      expect(storeWrites, 'no request saved a storefront address').toEqual([])
      expect(task, 'the storefront task after a reload').toBe('not done')
      expect(field, 'the storefront address after a reload').toBe('')
    })

  test("the payment method task's link opens the payment methods page", async ({ page }) => {
    expectFailureWhenSabotaged()
    const outside = await blockOutside(page)
    // Sabotaged: a click on the link goes nowhere.
    if (sabotaged)
      await page.addInitScript(() => {
        document.addEventListener(
          'click',
          (event) => {
            const link = (event.target as Element | null)?.closest('a')
            if (link?.getAttribute('href')?.endsWith('/settings/payment-methods')) {
              event.preventDefault()
              event.stopImmediatePropagation()
            }
          },
          true,
        )
      })
    await login(page)
    await openGettingStarted(page)
    await openTask(page, 'payment')
    const link = region(page, 'payment').getByRole('link')
    await expect(link).toHaveCount(1)
    const steps: Steps = [{ step: 'opened the payment method task', link: await link.innerText() }]

    await link.click()
    await expect(page).toHaveURL(new RegExp(`/${winkel()}/settings/payment-methods(\\?|$)`))
    await expect(page.getByRole('heading', { name: 'Payment Methods' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /add payment method/i })).toBeVisible()
    steps.push({
      step: 'followed the link',
      path: new URL(page.url()).pathname.replace(winkel(), '<Winkel>'),
    })
    await save(page, 'payment-method-task-link', steps, outside)
  })

  test('after a reload, Getting Started shows the three tasks done and counts them', async ({
    page,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/stock_locations\/[^/]+$/,
      withBody(({ address1: _street, ...rest }) => rest),
    )
    if (sabotaged) {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/store',
        (route) =>
          route.request().method() === 'PATCH'
            ? withBody(({ storefront_url: _url, ...rest }) => rest)(route)
            : route.fallback(),
      )
      await page.route(
        (url) => url.pathname === '/api/v3/admin/payment_methods',
        (route) =>
          route.request().method() === 'POST'
            ? withBody((body) => ({ ...body, storefront_visible: false }))(route)
            : route.fallback(),
      )
    }
    await login(page)
    await openGettingStarted(page)
    for (const task of ['address', 'payment', 'storefront'] as const)
      await expectTask(page, task, false)
    const before = await taskStates(page)
    const steps: Steps = [
      {
        step: 'opened Getting Started in Winkel',
        tasks: before,
        progress: await progress(page).innerText(),
      },
    ]

    await saveAddressThroughDialog(page, steps)

    await openStorefrontSheet(page)
    await storefrontField(page).fill(storefrontUrl)
    await dialog(page).getByRole('button', { name: 'Save & finish setup' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'saved the storefront address', address: storefrontUrl })

    await openTask(page, 'payment')
    await region(page, 'payment').getByRole('link').click()
    await expect(page.getByRole('button', { name: /add payment method/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /add payment method/i }).click()
    await page.locator('#type').click()
    await page.getByRole('option', { name: 'Check' }).click()
    await dialog(page).locator('#name').fill(paymentName)
    const visible = dialog(page).getByRole('switch', { name: 'Visible in storefront' })
    const active = dialog(page).getByRole('switch', { name: 'Active' })
    if (!(await visible.isChecked())) await visible.click()
    if (!(await active.isChecked())) await active.click()
    await dialog(page)
      .getByRole('button', { name: /create payment method/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText(paymentName)).toBeVisible()
    steps.push({ step: 'added a cheque payment method, visible in the storefront and active' })

    await openGettingStarted(page)
    await reload(page)
    for (const task of ['address', 'payment', 'storefront'] as const)
      await expectTask(page, task, true)
    // Done or not in Winkel alone; the taxes task is left out (ISO-6).
    for (const task of ['products', 'supportEmail'] as const) await expectTask(page, task, false)
    const after = await taskStates(page)
    await expect(progress(page)).toHaveText(`${doneCount(before) + 3} of 6 completed`)
    expect(doneCount(after)).toBe(doneCount(before) + 3)
    steps.push({
      step: 'went back to Getting Started and reloaded',
      tasks: after,
      progress: await progress(page).innerText(),
    })
    await save(page, 'tasks-done-after-reload', steps, outside)
  })
})

// --- The storefront sheet ----------------------------------------------------

const storefrontField = (page: Page) => dialog(page).getByLabel('Storefront URL')

async function openStorefrontSheet(page: Page) {
  await openTask(page, 'storefront')
  await region(page, 'storefront').getByRole('button', { name: 'Connect storefront' }).click()
  await expect(dialog(page).getByText('Publishable API key')).toBeVisible()
}
