import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'

/**
 * SF-DEV-01 and SF-DEV-02, the storefront's development email previews, for
 * batch 11 (criterion 17). Run the storefront at its `main`, unchanged, on its
 * development server (`next dev`) at `FIDELITY_STOREFRONT_DEV`, and for the
 * not-found state as a production build (`next build`, `next start`) at
 * `FIDELITY_STOREFRONT_PRODUCTION`; a step whose server is not given is
 * skipped. The pages read no store data, so no Spree server is needed. They
 * set their own colours inline and follow no colour scheme; each is still
 * captured in light and dark, as every screen is, to show that.
 */

const development = process.env.FIDELITY_STOREFRONT_DEV ?? ''
const production = process.env.FIDELITY_STOREFRONT_PRODUCTION ?? ''
const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_STOREFRONT_REVISION ?? null

const templates = ['order-confirmation', 'order-canceled', 'shipment-shipped', 'password-reset']

async function save(
  page: Page,
  screen: string,
  state: string,
  theme: string,
  server: string,
  extra: Record<string, unknown> = {},
) {
  const folder = `${results}${screen}/${state}/`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({ path: `${folder}storefront-${theme}.png`, fullPage: true })
  const path = new URL(page.url())
  writeFileSync(
    `${folder}storefront-${theme}.json`,
    JSON.stringify(
      {
        screen,
        state,
        variant: 'storefront',
        server,
        theme,
        revision,
        path: `${path.pathname}${path.search}`,
        viewport: page.viewportSize(),
        fullPage: true,
        ...extra,
      },
      null,
      2,
    ),
  )
}

test.use({ viewport: { width: 1280, height: 960 } })

for (const theme of ['light', 'dark'] as const) {
  test.describe(`storefront email previews ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.context().route(
        (url) =>
          !['data:', 'blob:', 'about:'].includes(url.protocol) &&
          !['localhost', '127.0.0.1'].includes(url.hostname),
        (route) => route.abort(),
      )
    })

    test(`SF-DEV-01 listed ${theme}`, async ({ page }) => {
      test.skip(!development, 'Set FIDELITY_STOREFRONT_DEV')
      await page.goto(`${development}/dev/emails`)
      await expect(page.getByRole('heading', { name: 'Email Previews' })).toBeVisible({
        timeout: 60_000,
      })
      await expect(page.getByRole('link')).toHaveCount(templates.length)
      await save(page, 'SF-DEV-01', 'listed', theme, 'storefront development server')
    })

    for (const template of templates) {
      for (const format of ['html', 'text'] as const) {
        test(`SF-DEV-02 ${template} ${format} ${theme}`, async ({ page }) => {
          test.skip(!development, 'Set FIDELITY_STOREFRONT_DEV')
          await page.goto(
            `${development}/dev/emails/${template}${format === 'text' ? '?format=text' : ''}`,
          )
          // The plain text is the page itself, with no links back.
          await expect(
            format === 'text'
              ? page.locator('pre')
              : page.getByRole('link', { name: /All templates/ }),
          ).toBeVisible({ timeout: 60_000 })
          await page.waitForLoadState('networkidle')
          await save(
            page,
            'SF-DEV-02',
            `${template}${format === 'text' ? '-text' : ''}`,
            theme,
            'storefront development server',
          )
        })
      }
    }

    test(`SF-DEV-01 not-found-in-production ${theme}`, async ({ page }) => {
      test.skip(!production, 'Set FIDELITY_STOREFRONT_PRODUCTION')
      // The page streams before it finds it should not exist, so the answer
      // can be 200 with the not-found page drawn in place of the list.
      const response = await page.goto(`${production}/dev/emails`)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Email Previews' })).toHaveCount(0)
      await save(
        page,
        'SF-DEV-01',
        'not-found-in-production',
        theme,
        'storefront production build',
        {
          status: response?.status() ?? null,
        },
      )
    })
  })
}
