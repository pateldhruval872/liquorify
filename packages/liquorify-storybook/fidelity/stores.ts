import { expect, type Page } from '@playwright/test'

/**
 * The shell's store switcher and navigation, and a store's staff list, as the
 * multi-store administration batch and P9's tests for it read them.
 */

export const switcher = (page: Page) => page.getByRole('button', { name: 'Switch store' })

/**
 * The names of the main navigation's links, in order, once two readings half
 * a second apart agree: some links, such as Getting Started, appear only when
 * their own request has answered.
 */
export async function navigation(page: Page) {
  await expect(page.locator('[data-sidebar="content"] [data-slot="skeleton"]')).toHaveCount(0, {
    timeout: 15_000,
  })
  const read = async () =>
    (await page.locator('[data-sidebar="content"] a').allInnerTexts()).map((name) =>
      name.split('\n')[0].trim(),
    )
  let previous = await read()
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.waitForTimeout(500)
    const next = await read()
    if (next.join('|') === previous.join('|')) return next
    previous = next
  }
  return previous
}

/** What each role's navigation holds when its store is opened fresh, as the staff access batch saw them. */
export const adminNavigation = [
  'Getting Started',
  'Home',
  'Orders',
  'Products',
  'Inventory',
  'Customers',
  'Sellers',
  'Loyalty',
  'Promotions',
  'Reports',
]
export const supportNavigation = ['Home', 'Orders', 'Customers']

export async function openStaff(page: Page, storeId: string) {
  await page.goto(`/${storeId}/settings/staff`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Staff', exact: true })).toBeVisible({
    timeout: 15_000,
  })
}
