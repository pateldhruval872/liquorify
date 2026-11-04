import { randomUUID } from 'node:crypto'
import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from '@playwright/test'
import { escapeRegex, getCredentials, login, rowButton } from '../../dashboard/e2e/helpers'
import {
  answeredEmpty,
  blockOutside,
  type Headers,
  json,
  list,
  openIn,
  recorder,
  reload,
  type Steps,
  sabotage,
  stamp,
  withBody,
} from './p9'
import { admin } from './staff'

/**
 * The platform batch's step P9, G-69: the payment, delivery and tax actions
 * batch 7 captured but no browser test drives. Each test drives the dashboard
 * as the browser tests' admin in their default store, asserts what the screen
 * shows and, after a reload, what was kept.
 *
 * Start Spree's browser-test server with `LIQUORIFY_TAX_ENGINE=1` (see
 * stack.spec.ts), so it registers a stand-in tax engine beside Spree's own for
 * the external tax service's note, and the built dashboard as
 * `compare.spec.ts` describes. The profiles, zones, methods and the test
 * gateway the tests open are added first through the Admin API, named with this
 * run's stamp. What a test changes outside its own records, the store's
 * default profile and its markets' tax engines, it puts back afterwards.
 * With `P9_SABOTAGE=1` each test undoes the change it looks for (see p9.ts).
 *
 * Every request stays inside the default store. Nothing here looks at another
 * store, and no real provider is called: payments use Spree's test gateway and
 * cheque method, and the stand-in engine calls nothing outside.
 */

const { snap, save } = recorder('settings')

const named = (name: string) => `P9 ${name} ${stamp}`

const names = {
  profile: named('home goods'),
  defaultProfile: named('new default'),
  zones: {
    deleted: named('zone to delete'),
    states: named('zone for states'),
    postal: named('zone for postal codes'),
    methods: named('zone with methods'),
  },
  methods: {
    deleted: named('method to delete'),
    kept: named('method kept'),
  },
  taxRate: named('Texas sales tax'),
  gateway: named('test gateway'),
}

/** A name the store's payment methods already use, which Spree refuses for another. */
const takenName = 'Store Credit'
const engine = 'Stand-in tax engine'

interface Records {
  storeId: string
  profileId: string
  defaultProfileId: string
  generalProfileId: string
  gatewayId: string
  markets: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

let records: Records

async function asAdmin<T>(baseURL: string, work: (api: APIRequestContext, headers: Headers) => T) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    return await work(api, headers)
  } finally {
    await api.dispose()
  }
}

const flatRate = (amount: string) => ({
  type: 'flat_rate',
  preferences: { amounts: { USD: amount } },
})

test.beforeAll(async ({ baseURL }) => {
  records = await asAdmin(baseURL ?? '', async (api, headers) => {
    const post = <T>(path: string, data: object) =>
      api.post(`/api/v3/admin/${path}`, { headers, data }).then((res) => json<T>(res))
    const profile = async (name: string) => {
      const created = await post<{ id: string }>('delivery_profiles', { name, kind: 'shipping' })
      return json<{ id: string; origin_groups: { id: string }[] }>(
        await api.get(`/api/v3/admin/delivery_profiles/${created.id}`, { headers }),
      )
    }
    const home = await profile(names.profile)
    const newDefault = await profile(names.defaultProfile)
    const inGroup = {
      delivery_profile_id: home.id,
      delivery_origin_group_id: home.origin_groups[0].id,
    }
    const zone = (name: string, members: object[]) =>
      post<{ id: string }>('delivery_zones', { name, ...inGroup, members })
    await zone(names.zones.deleted, [{ member_type: 'country', country_code: 'DE' }])
    await zone(names.zones.states, [{ member_type: 'country', country_code: 'CA' }])
    await zone(names.zones.postal, [{ member_type: 'country', country_code: 'MX' }])
    const withMethods = await zone(names.zones.methods, [
      { member_type: 'country', country_code: 'FR' },
    ])
    for (const [name, amount] of [
      [names.methods.deleted, '7.00'],
      [names.methods.kept, '9.00'],
    ])
      await post('delivery_methods', {
        name,
        ...inGroup,
        delivery_zone_id: withMethods.id,
        calculator: flatRate(amount),
      })

    const gateway = await post<{ id: string }>('payment_methods', {
      name: names.gateway,
      type: 'bogus',
      active: true,
      storefront_visible: true,
      // Made up for this run and never written down; screenshots paint the field out.
      preferences: { dummy_secret_key: `p9-${randomUUID()}` },
    })

    const profiles = await list<{ id: string; default: boolean }>(api, headers, 'delivery_profiles')
    const general = profiles.find((item) => item.default)
    expect(general, 'the store has a default profile').toBeTruthy()

    return {
      storeId: getCredentials().store_id,
      profileId: home.id,
      defaultProfileId: newDefault.id,
      generalProfileId: (general as { id: string }).id,
      gatewayId: gateway.id,
      markets: await list<{ id: string; name: string }>(api, headers, 'markets'),
      locations: await list<{ id: string; name: string }>(api, headers, 'stock_locations'),
    }
  })
})

const openStore = (page: Page, path: string) => openIn(page, records.storeId, path)
const sheet = (page: Page) => page.getByRole('dialog')
const confirmation = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))
const toast = (page: Page, text: string) => page.getByText(text, { exact: true }).first()

// --- Delivery profiles -------------------------------------------------------

const profilePath = (id: string) => `/settings/delivery-profiles/${id}`

async function openProfile(page: Page, id: string, name: string) {
  await openStore(page, profilePath(id))
  await expect(page.locator('h1', { hasText: name })).toBeVisible({ timeout: 15_000 })
}

const openHome = (page: Page) => openProfile(page, records.profileId, names.profile)

/** A zone's card, by the name in its title. */
const zoneBox = (page: Page, name: string) =>
  page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', {
      hasText: new RegExp(`^${escapeRegex(name)}$`),
    }),
  })

/** A method's button in its list, whose name also carries the method's conditions when it has some. */
const methodButton = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${escapeRegex(name)}( |$)`) })

/** The nearest box around an element that also holds a button with this name. */
const around = (target: Locator, button: string) =>
  target.locator(
    `xpath=ancestor::*[.//button[@aria-label="${button}" or contains(normalize-space(.), "${button}")]][1]`,
  )

async function openZone(page: Page, name: string) {
  await zoneBox(page, name).getByRole('button', { name: 'Open actions' }).first().click()
  await page.getByRole('menuitem', { name: /^edit$/i }).click()
  await expect(sheet(page).locator('#name')).toHaveValue(name, { timeout: 15_000 })
}

/** The zone's members as its PATCH sends them, so a sabotaged run can leave some out. */
const withoutMembers = (kind: string) =>
  withBody((body) => ({
    ...body,
    members: ((body.members as { member_type: string }[] | undefined) ?? []).filter(
      (member) => member.member_type !== kind,
    ),
  }))

test.describe('payment, delivery and tax actions (P9, G-69)', () => {
  test('deleting a delivery zone removes it and keeps the others', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/delivery_zones\/[^/]+$/, answeredEmpty)
    await login(page)
    await openHome(page)
    await expect(zoneBox(page, names.zones.deleted)).toBeVisible()
    const steps: Steps = [{ step: 'opened the profile', zone: names.zones.deleted }]

    await zoneBox(page, names.zones.deleted)
      .getByRole('button', { name: 'Open actions' })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await expect(confirmation(page).getByText('Delete delivery zone')).toBeVisible()
    await expect(confirmation(page)).toContainText(names.zones.deleted)
    await confirmation(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(toast(page, 'Delivery zone deleted')).toBeVisible()
    await expect(zoneBox(page, names.zones.deleted)).toHaveCount(0)
    steps.push({ step: 'deleted it from its menu and confirmed', shown: 'Delivery zone deleted' })

    await reload(page)
    await expect(zoneBox(page, names.zones.states)).toBeVisible({ timeout: 15_000 })
    await expect(zoneBox(page, names.zones.deleted)).toHaveCount(0)
    for (const kept of [names.zones.states, names.zones.postal, names.zones.methods])
      await expect(zoneBox(page, kept)).toBeVisible()
    steps.push({ step: 'reloaded; the zone is gone and the other three stay' })
    await save(page, 'zone-deleted', steps, outside)
  })

  test('deleting a delivery method removes it and keeps the zone’s other method', async ({
    page,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/delivery_methods\/[^/]+$/, answeredEmpty)
    await login(page)
    await openHome(page)
    await expect(methodButton(page, names.methods.deleted)).toBeVisible()
    const steps: Steps = [{ step: 'opened the profile', method: names.methods.deleted }]

    await around(methodButton(page, names.methods.deleted), 'Open actions')
      .getByRole('button', { name: 'Open actions' })
      .click()
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await expect(confirmation(page).getByText('Delete delivery method')).toBeVisible()
    await expect(confirmation(page)).toContainText(names.methods.deleted)
    await confirmation(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(toast(page, 'Delivery method deleted')).toBeVisible()
    await expect(methodButton(page, names.methods.deleted)).toHaveCount(0)
    steps.push({ step: 'deleted it from its menu and confirmed', shown: 'Delivery method deleted' })

    await reload(page)
    await expect(methodButton(page, names.methods.kept)).toBeVisible({ timeout: 15_000 })
    await expect(methodButton(page, names.methods.deleted)).toHaveCount(0)
    steps.push({ step: 'reloaded; the method is gone and the other stays' })
    await save(page, 'method-deleted', steps, outside)
  })

  test("adding a zone's states keeps them after a reload", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/delivery_zones\/[^/]+$/,
      withoutMembers('state'),
    )
    await login(page)
    await openHome(page)
    await openZone(page, names.zones.states)
    const steps: Steps = [{ step: 'opened the zone', zone: names.zones.states }]

    await sheet(page).getByRole('button', { name: 'Show states of United States' }).click()
    await sheet(page).getByRole('checkbox', { name: 'Colorado', exact: true }).check()
    await sheet(page).getByRole('checkbox', { name: 'Utah', exact: true }).check()
    await expect(sheet(page).getByText(/1 countries, 2 states/)).toBeVisible()
    await sheet(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(toast(page, 'Delivery zone updated')).toBeVisible()
    await expect(sheet(page)).toBeHidden()
    steps.push({ step: 'ticked Colorado and Utah under the United States and saved' })

    await reload(page)
    await expect(zoneBox(page, names.zones.states)).toContainText('Colorado', { timeout: 15_000 })
    await expect(zoneBox(page, names.zones.states)).toContainText('Utah')
    const card = (await zoneBox(page, names.zones.states).innerText()).replace(/\s+/g, ' ')
    await openZone(page, names.zones.states)
    await expect(sheet(page).getByText(/1 countries, 2 states/)).toBeVisible()
    await sheet(page).getByRole('button', { name: 'Show states of United States' }).click()
    await expect(sheet(page).getByRole('checkbox', { name: 'Colorado', exact: true })).toBeChecked()
    await expect(sheet(page).getByRole('checkbox', { name: 'Utah', exact: true })).toBeChecked()
    await expect(sheet(page).getByRole('checkbox', { name: 'Canada', exact: true })).toBeChecked()
    steps.push({
      step: 'reloaded; the card names both states, and the zone opens with them ticked',
      card,
      summary: await sheet(page)
        .getByText(/countries, .* states/)
        .innerText(),
    })
    await sheet(page)
      .getByRole('checkbox', { name: 'Colorado', exact: true })
      .scrollIntoViewIfNeeded()
    await save(page, 'zone-states-added', steps, outside)
  })

  test("adding a zone's postal code rule keeps it after a reload", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/delivery_zones\/[^/]+$/,
      withoutMembers('postal_code'),
    )
    await login(page)
    await openHome(page)
    await openZone(page, names.zones.postal)
    const steps: Steps = [{ step: 'opened the zone', zone: names.zones.postal }]

    await sheet(page)
      .getByRole('button', { name: /^Postal code rules/ })
      .click()
    await sheet(page).getByRole('button', { name: 'Add rule' }).click()
    const rule = around(sheet(page).getByPlaceholder('Prefix').last(), 'Remove rule')
    await rule.getByRole('combobox').click()
    await page.getByRole('option', { name: 'United States', exact: true }).click()
    await rule.getByPlaceholder('Prefix').fill('80')
    await expect(sheet(page).getByText(/1 countries, 0 states, 1 postal code rules/)).toBeVisible()
    steps.push({ step: 'added a postal code rule for the United States', prefix: '80' })
    await sheet(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(toast(page, 'Delivery zone updated')).toBeVisible()
    await expect(sheet(page)).toBeHidden()

    await reload(page)
    await expect(zoneBox(page, names.zones.postal)).toBeVisible({ timeout: 15_000 })
    const card = (await zoneBox(page, names.zones.postal).innerText()).replace(/\s+/g, ' ')
    await openZone(page, names.zones.postal)
    await expect(sheet(page).getByText(/1 countries, 0 states, 1 postal code rules/)).toBeVisible()
    await sheet(page)
      .getByRole('button', { name: /^Postal code rules/ })
      .click()
    const saved = around(sheet(page).getByPlaceholder('Prefix').last(), 'Remove rule')
    await expect(saved.getByRole('combobox')).toContainText('United States')
    await expect(saved.getByPlaceholder('Prefix')).toHaveValue('80')
    steps.push({
      step: 'reloaded; the zone opens with its rule',
      card,
      summary: await sheet(page)
        .getByText(/postal code rules/)
        .first()
        .innerText(),
    })
    await save(page, 'zone-postal-code-added', steps, outside)
  })

  test('making a profile the default moves the default to it', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/delivery_profiles\/[^/]+$/,
      withBody(({ default: _default, ...rest }) => rest),
    )
    try {
      await login(page)
      await openProfile(page, records.defaultProfileId, names.defaultProfile)
      const steps: Steps = [{ step: 'opened the profile', profile: names.defaultProfile }]

      await page.getByRole('button', { name: 'Make default' }).click()
      await expect(confirmation(page).getByText('Make this the default profile')).toBeVisible()
      await confirmation(page).getByRole('button', { name: 'Make default' }).click()
      await expect(
        page.getByText('Products without a profile of their own ship on this one.'),
      ).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('button', { name: 'Make default' })).toHaveCount(0)
      steps.push({ step: 'made it the default and confirmed' })

      await reload(page)
      await expect(
        page.getByText('Products without a profile of their own ship on this one.'),
      ).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('button', { name: 'Make default' })).toHaveCount(0)
      await openStore(page, '/settings/delivery-profiles')
      const row = (name: string) => page.locator('tr').filter({ has: rowButton(page, name) })
      await expect(row(names.defaultProfile)).toContainText('Default', { timeout: 15_000 })
      await expect(row('General')).not.toContainText('Default')
      steps.push({
        step: 'reloaded; the profile shows as the default, here and in the list, and General no longer does',
        listed: (await row(names.defaultProfile).innerText()).replace(/\s+/g, ' '),
        general: (await row('General').innerText()).replace(/\s+/g, ' '),
      })
      await save(page, 'profile-made-default', steps, outside)
    } finally {
      await asAdmin(baseURL ?? '', (api, headers) =>
        api.patch(`/api/v3/admin/delivery_profiles/${records.generalProfileId}`, {
          headers,
          data: { default: true },
        }),
      )
    }
  })

  test("narrowing a profile's origins to one location keeps it after a reload", async ({
    page,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/delivery_profiles\/[^/]+$/,
      withBody(({ stock_location_ids: _ids, ...rest }) => rest),
    )
    const [chosen, ...others] = records.locations
    expect(others.length, 'the store has more than one location').toBeGreaterThan(0)
    await login(page)
    await openHome(page)
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'Ships from' })
    await expect(card.getByRole('radio', { name: 'All locations' })).toBeChecked()
    const steps: Steps = [{ step: 'opened the profile; it ships from all locations' }]

    await card.getByRole('radio', { name: 'Selected locations' }).click()
    await card.getByRole('checkbox', { name: chosen.name, exact: true }).check()
    await card.getByRole('button', { name: /^save$/i }).click()
    await expect(toast(page, 'Shipping profile updated')).toBeVisible()
    steps.push({ step: 'chose Selected locations, ticked one and saved', location: chosen.name })

    await reload(page)
    await expect(card.getByRole('radio', { name: 'Selected locations' })).toBeChecked({
      timeout: 15_000,
    })
    await expect(card.getByRole('checkbox', { name: chosen.name, exact: true })).toBeChecked()
    for (const other of others)
      await expect(card.getByRole('checkbox', { name: other.name, exact: true })).not.toBeChecked()
    steps.push({
      step: 'reloaded; the card shows the one location ticked and the others not',
      ticked: chosen.name,
      notTicked: others.map((other) => other.name),
    })
    await card.scrollIntoViewIfNeeded()
    await save(page, 'profile-origins-narrowed', steps, outside)
  })

  // --- Taxes -----------------------------------------------------------------

  test('creating a tax rate for a state lists it for that state after a reload', async ({
    page,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/tax_rates$/,
      withBody(({ state_code: _state, ...rest }) => rest),
    )
    await login(page)
    await openStore(page, '/settings/taxes/rates')
    await page.getByRole('button', { name: /add tax rate/i }).click()
    await expect(page.getByRole('heading', { name: /new tax rate/i })).toBeVisible()
    await page.locator('#name').fill(names.taxRate)
    await page.locator('#rate_percent').fill('6.25')
    await page.locator('#tax_category_id').click()
    await page
      .getByRole('option', { name: /^default$/i })
      .first()
      .click()
    await page.getByRole('combobox', { name: /^country$/i }).click()
    await page.getByPlaceholder(/^search countries/i).fill('United States')
    await page.getByRole('option', { name: 'United States' }).first().click()
    await page.getByRole('combobox', { name: /^state$/i }).click()
    await page
      .getByPlaceholder(/^search/i)
      .last()
      .fill('Texas')
    await page.getByRole('option', { name: 'Texas' }).first().click()
    await page.getByRole('button', { name: /create tax rate/i }).click()
    await expect(toast(page, 'Tax rate created')).toBeVisible()
    const steps: Steps = [
      { step: 'created a rate of 6.25% for Texas, United States', name: names.taxRate },
    ]

    await reload(page)
    const row = page.locator('tr').filter({ has: rowButton(page, names.taxRate) })
    await expect(row).toContainText('6.25%', { timeout: 15_000 })
    await expect(row).toContainText(/United States\s*—\s*TX/)
    steps.push({
      step: 'reloaded; the list shows it',
      listed: (await row.innerText()).replace(/\s+/g, ' '),
    })
    await rowButton(page, names.taxRate).click()
    await expect(page.getByRole('combobox', { name: /^state$/i })).toContainText('Texas', {
      timeout: 15_000,
    })
    steps.push({ step: 'opened it; its state is Texas' })
    await save(page, 'tax-rate-for-a-state', steps, outside)
  })

  test('the taxes page notes the markets an external tax service works out', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/markets\/[^/]+$/,
      withBody(({ tax_provider: _engine, ...rest }) => rest),
    )
    const europe = records.markets.find((market) => market.name === 'Europe')
    const others = records.markets.filter((market) => market !== europe)
    expect(europe, 'the store has its Europe market').toBeTruthy()
    const note = page.getByRole('alert').filter({ hasText: 'external service' })
    try {
      await login(page)
      await openStore(page, '/settings/taxes/rates')
      await expect(page.getByRole('button', { name: /add tax rate/i })).toBeVisible({
        timeout: 15_000,
      })
      await expect(note).toHaveCount(0)
      const steps: Steps = [{ step: 'opened tax rates; no note, every market on Spree’s rates' }]

      const putOnEngine = async (market: string) => {
        await openStore(page, '/settings/markets')
        await rowButton(page, market).click()
        await expect(sheet(page).locator('#market-tax-provider')).toBeVisible({ timeout: 15_000 })
        await sheet(page).locator('#market-tax-provider').click()
        await page.getByRole('option', { name: engine }).click()
        await sheet(page)
          .getByRole('button', { name: /^(save|update market)$/i })
          .click()
        await expect(toast(page, 'Market updated')).toBeVisible()
        steps.push({ step: `put ${market} on the ${engine} from its sheet and saved` })
      }

      await putOnEngine('Europe')
      await openStore(page, '/settings/taxes/rates')
      await expect(note).toHaveText(
        `These rates are not used in Europe (${engine}), which work out tax with an external service.`,
        { timeout: 15_000 },
      )
      await reload(page)
      await expect(note).toHaveText(
        `These rates are not used in Europe (${engine}), which work out tax with an external service.`,
        { timeout: 15_000 },
      )
      steps.push({
        step: 'tax rates, then reloaded; the note names Europe',
        note: await note.innerText(),
      })
      await snap(page, 'external-tax-note-one-market')

      for (const market of others) await putOnEngine(market.name)
      await openStore(page, '/settings/taxes/rates')
      await reload(page)
      await expect(note).toContainText('None of your markets use these rates', { timeout: 15_000 })
      for (const market of records.markets)
        await expect(note).toContainText(`${market.name} (${engine})`)
      steps.push({
        step: 'every market on the engine, then reloaded',
        note: await note.innerText(),
      })
      await save(page, 'external-tax-note', steps, outside)
    } finally {
      await asAdmin(baseURL ?? '', async (api, headers) => {
        for (const market of records.markets)
          await api.patch(`/api/v3/admin/markets/${market.id}`, {
            headers,
            data: { tax_provider: null },
          })
      })
    }
  })

  // --- Payment methods -------------------------------------------------------

  test('a payment method name the store already uses is refused, and nothing is added', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/payment_methods$/,
      withBody((body) => ({ ...body, name: named('cheque renamed') })),
    )
    try {
      await login(page)
      await openStore(page, '/settings/payment-methods')
      await expect(rowButton(page, takenName)).toHaveCount(1, { timeout: 15_000 })
      const steps: Steps = [{ step: 'opened payment methods; one is named Store Credit' }]

      await page.getByRole('button', { name: /add payment method/i }).click()
      await page.locator('#type').click()
      await page.getByRole('option', { name: 'Check' }).click()
      await sheet(page).locator('#name').fill(takenName)
      await sheet(page)
        .getByRole('button', { name: /create payment method/i })
        .click()
      await expect(sheet(page).locator('#name')).toHaveAttribute('aria-invalid', 'true', {
        timeout: 15_000,
      })
      const message = sheet(page).locator('[data-slot="field-error"]').first()
      await expect(message).toBeVisible()
      await expect(sheet(page)).toBeVisible()
      steps.push({
        step: 'chose Check, named it Store Credit and created',
        shown: await message.innerText(),
      })
      await snap(page, 'payment-method-name-refused-message')

      await page.keyboard.press('Escape')
      await reload(page)
      await expect(rowButton(page, names.gateway)).toBeVisible({ timeout: 15_000 })
      await expect(rowButton(page, takenName)).toHaveCount(1)
      await expect(page.locator('tr').filter({ hasText: /\bcheck\b/ })).toHaveCount(0)
      steps.push({ step: 'closed the sheet and reloaded; still one Store Credit and no cheque' })
      await save(page, 'payment-method-name-refused', steps, outside)
    } finally {
      await asAdmin(baseURL ?? '', async (api, headers) => {
        for (const method of await list<{ id: string; type: string }>(
          api,
          headers,
          'payment_methods',
        ))
          if (method.type === 'check')
            await api.delete(`/api/v3/admin/payment_methods/${method.id}`, { headers })
      })
    }
  })

  test('switching a payment method to admin only keeps it after a reload', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/payment_methods\/[^/]+$/,
      withBody(({ storefront_visible: _visible, ...rest }) => rest),
    )
    const secret = '#preference-dummy_secret_key'
    await login(page)
    await openStore(page, '/settings/payment-methods')
    const row = page.locator('tr').filter({ has: rowButton(page, names.gateway) })
    await expect(row).toContainText('Visible', { timeout: 15_000 })
    const steps: Steps = [
      { step: 'opened payment methods', listed: (await row.innerText()).replace(/\s+/g, ' ') },
    ]

    await rowButton(page, names.gateway).click()
    const visible = sheet(page).getByRole('switch', { name: 'Visible in storefront' })
    await expect(visible).toBeChecked({ timeout: 15_000 })
    await visible.click()
    await expect(visible).not.toBeChecked()
    await sheet(page)
      .getByRole('button', { name: /^(save|update payment method)$/i })
      .click()
    await expect(toast(page, 'Payment method updated')).toBeVisible()
    await expect(row).toContainText('Admin only')
    steps.push({ step: 'switched Visible in storefront off and saved' })

    await reload(page)
    await expect(row).toContainText('Admin only', { timeout: 15_000 })
    await expect(row).toContainText('Active')
    steps.push({
      step: 'reloaded; the list shows it admin only and still active',
      listed: (await row.innerText()).replace(/\s+/g, ' '),
    })
    await rowButton(page, names.gateway).click()
    await expect(
      sheet(page).getByRole('switch', { name: 'Visible in storefront' }),
    ).not.toBeChecked({
      timeout: 15_000,
    })
    await expect(sheet(page).getByRole('switch', { name: 'Active' })).toBeChecked()
    steps.push({ step: 'opened it; Visible in storefront is off, Active on' })
    await save(page, 'payment-method-admin-only', steps, outside, { mask: secret })
  })
})
