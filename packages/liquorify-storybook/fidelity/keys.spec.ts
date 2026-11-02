import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { paintOut } from './developers'
import { openRowMenu } from './staff'

/**
 * API keys, for the platform batch's step P2: a publishable key and a secret
 * key created on the API keys screen (DA-SET-26), then used from outside the
 * browser against Spree's browser-test server, within their scope and outside
 * it, before and after each is revoked on the screen. Start the screens first
 * (see compare.spec.ts).
 *
 * The keys are read from the screen into memory and never written anywhere:
 * the results keep each request's status, and the screenshots paint the keys
 * out.
 */

const API = process.env.P2_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p2/', import.meta.url).pathname

const publishableName = `P2 storefront key ${Date.now()}`
const secretName = `P2 catalog reader ${Date.now()}`

async function call(path: string, key: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (key) headers.set('X-Spree-API-Key', key)
  if (init.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API}${path}`, { ...init, headers })
  return res.status
}

async function openSheet(page: Page) {
  await page.getByRole('button', { name: /new key/i }).click()
  await expect(page.getByRole('dialog').getByText('Create API key')).toBeVisible()
}

async function revoke(page: Page, name: string) {
  await openRowMenu(page, name)
  await page.getByRole('menuitem', { name: 'Revoke key' }).click()
  await page
    .getByRole('dialog')
    .filter({ hasText: 'Revoke key?' })
    .getByRole('button', { name: 'Revoke', exact: true })
    .click()
  await expect(page.locator('tbody tr').filter({ hasText: name }).getByText('Revoked')).toBeVisible(
    { timeout: 15_000 },
  )
}

test('API keys created on the screen work from outside, within their scope', async ({ page }) => {
  mkdirSync(results, { recursive: true })
  const session = await login(page)
  await page.goto(`/${session.store_id}/settings/api-keys`)
  await expect(page.getByText('Secret keys', { exact: true })).toBeVisible({ timeout: 15_000 })

  await openSheet(page)
  const sheet = page.getByRole('dialog')
  await sheet.locator('#api-key-name').fill(publishableName)
  await sheet.getByText('Publishable key', { exact: true }).click()
  await sheet.getByRole('button', { name: 'Create key' }).click()
  const publishableRow = page.locator('tbody tr').filter({ hasText: publishableName })
  await expect(publishableRow).toBeVisible({ timeout: 15_000 })
  const publishable = ((await publishableRow.locator('code').textContent()) ?? '').replace(/…$/, '')
  expect(publishable).toMatch(/^pk_/)

  await openSheet(page)
  await sheet.locator('#api-key-name').fill(secretName)
  await sheet.getByRole('checkbox', { name: 'View Products' }).click()
  await sheet.getByRole('button', { name: 'Create key' }).click()
  const reveal = page.getByRole('dialog').filter({ hasText: 'Save your secret key' })
  await expect(reveal).toBeVisible({ timeout: 15_000 })
  const secret = (await reveal.locator('code').textContent()) ?? ''
  expect(secret).toMatch(/^sk_/)
  await reveal.getByRole('button', { name: /^done$/i }).click()
  await expect(page.locator('tbody tr').filter({ hasText: secretName })).toBeVisible()
  writeFileSync(
    `${results}keys-created.png`,
    await page.screenshot({ fullPage: true, style: paintOut('tbody code') }),
  )

  const product = JSON.stringify({ name: `P2 refused ${Date.now()}` })
  const before = {
    storeProductsWithPublishable: await call('/api/v3/store/products', publishable),
    storeProductsWithoutKey: await call('/api/v3/store/products', null),
    adminProductsWithSecret: await call('/api/v3/admin/products', secret),
    adminProductCreateWithSecret: await call('/api/v3/admin/products', secret, {
      method: 'POST',
      body: product,
    }),
    adminOrdersWithSecret: await call('/api/v3/admin/orders', secret),
    adminProductsWithPublishable: await call('/api/v3/admin/products', publishable),
  }

  await revoke(page, publishableName)
  await revoke(page, secretName)
  writeFileSync(
    `${results}keys-revoked.png`,
    await page.screenshot({ fullPage: true, style: paintOut('tbody code') }),
  )
  const after = {
    storeProductsWithPublishable: await call('/api/v3/store/products', publishable),
    adminProductsWithSecret: await call('/api/v3/admin/products', secret),
  }

  writeFileSync(
    `${results}keys.json`,
    `${JSON.stringify(
      {
        check: 'P2 criterion 1: API keys created on DA-SET-26, used from outside',
        revision: process.env.FIDELITY_REVISION ?? null,
        keys: {
          publishable: { name: publishableName, scopes: 'none: publishable' },
          secret: { name: secretName, scopes: ['read_products'] },
        },
        before,
        afterRevoking: after,
      },
      null,
      2,
    )}\n`,
  )

  expect(before.storeProductsWithPublishable).toBe(200)
  expect(before.storeProductsWithoutKey).toBe(401)
  expect(before.adminProductsWithSecret).toBe(200)
  expect(before.adminProductCreateWithSecret).toBe(403)
  expect(before.adminOrdersWithSecret).toBe(403)
  expect(before.adminProductsWithPublishable).toBe(401)
  expect(after.storeProductsWithPublishable).toBe(401)
  expect(after.adminProductsWithSecret).toBe(401)
})
