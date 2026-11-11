import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { eventually, publishableKey } from './p4'
import { revision, type Seed, seeded, stamp } from './p9'

/**
 * The platform batch's step P4, check 4.23: Meilisearch on the storefront
 * (CAP-05-14's Meilisearch part).
 *
 * Meilisearch runs locally from its published release, and the server is
 * started with `MEILISEARCH_URL` and `MEILISEARCH_API_KEY` pointing at it
 * (`stack.spec.ts`), which puts the store's product search on Meilisearch.
 * The storefront is built for production against the same server and served
 * on port 3001 (`STOREFRONT_URL`), with that server's default publishable key.
 *
 * The check adds two bottles whose names Spree's database search would not
 * match when misspelt, one in stock, each with a value of a filterable option,
 * then searches on the storefront with a misspelt name and filters by one
 * value. Meilisearch's own answer to the same misspelt query is recorded
 * beside the storefront's, so the results are seen to come from it.
 *
 * Results go to `results/p4/meilisearch/`. The Meilisearch key is the local
 * server's own and is never written out.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const meilisearch = process.env.MEILISEARCH_URL ?? 'http://127.0.0.1:7700'
const results = new URL('./results/p4/meilisearch/', import.meta.url).pathname
const word = `Glenkinchie${stamp}`
const misspelt = word.replace('chie', 'chy')
const optionLabel = `P4 Cask ${stamp}`

function save(name: string, data: object) {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ revision, stamp, ...data }, null, 2)}\n`,
  )
}

async function snap(page: Page, name: string) {
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}${name}.png`, fullPage: true })
}

async function bottles(seed: Seed) {
  const channels = await seed.get<{ data: { id: string; default: boolean }[] }>('channels?limit=20')
  const online = channels.data.find((channel) => channel.default)
  const optionName = `p4-cask-${stamp}`
  await seed.post('option_types', {
    name: optionName,
    label: optionLabel,
    filterable: true,
    option_values: [
      { name: 'oak', label: 'Oak' },
      { name: 'sherry', label: 'Sherry' },
    ],
  })
  const { data: locations } = await seed.get<{ data: { id: string }[] }>('stock_locations?limit=5')
  const made: Record<string, string> = {}
  for (const [cask, inStock] of [
    ['Oak', true],
    ['Sherry', false],
  ] as const) {
    const name = `${word} Reserve ${cask}`
    const product = await seed.post<{ id: string }>('products', {
      name,
      status: 'active',
      product_publications: online ? [{ channel_id: online.id }] : [],
      variants: [
        {
          sku: `P4-MS-${cask.toUpperCase()}-${stamp}`,
          options: [{ name: optionName, value: cask.toLowerCase() }],
          prices: [{ amount: '45.00', currency: 'USD' }],
        },
      ],
    })
    if (inStock) {
      const { data: variants } = await seed.get<{ data: { id: string; sku: string }[] }>(
        `products/${product.id}/variants`,
      )
      const variant = variants.find((each) => each.sku?.startsWith('P4-MS-'))
      await seed.post('stock_levels/bulk_upsert', {
        stock_levels: [
          { variant_id: variant?.id, stock_location_id: locations[0].id, count_on_hand: 10 },
        ],
      })
    }
    made[cask] = name
  }
  return made
}

test('4.23 searching and filtering on the storefront through Meilisearch', async ({
  page,
  baseURL,
}) => {
  const names = await seeded(baseURL, bottles)
  const key = await seeded(baseURL, publishableKey)

  // Spree indexes a product after it is saved, in the background.
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { 'X-Spree-API-Key': key } })
  const storeApi = await eventually(async () => {
    const res = await api.get(`/api/v3/store/products?q[search]=${encodeURIComponent(misspelt)}`)
    const body = (await res.json()) as { data: { name: string }[] }
    return body.data.length === 2 ? body.data.map((each) => each.name).sort() : undefined
  }, 60_000)
  await api.dispose()

  const index = await request.newContext({
    baseURL: meilisearch,
    extraHTTPHeaders: { Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY ?? ''}` },
  })
  const indexes = (await (await index.get('/indexes')).json()) as { results: { uid: string }[] }
  const fromMeilisearch: Record<string, string[]> = {}
  for (const { uid } of indexes.results) {
    const res = await index.post(`/indexes/${uid}/search`, {
      data: { q: misspelt, attributesToRetrieve: ['name'], limit: 10 },
    })
    fromMeilisearch[uid] = ((await res.json()) as { hits: { name: string }[] }).hits.map(
      (hit) => hit.name,
    )
  }
  const version = ((await (await index.get('/version')).json()) as { pkgVersion: string })
    .pkgVersion
  await index.dispose()

  await page.goto(`${storefront}/us/en/products?q=${encodeURIComponent(misspelt)}`)
  const oak = page.getByText(names.Oak).first()
  const sherry = page.getByText(names.Sherry).first()
  await expect(oak).toBeVisible({ timeout: 30_000 })
  const foundBoth = await sherry.isVisible()
  await snap(page, '4.23-misspelt-search')

  await page
    .getByRole('button', { name: new RegExp(optionLabel) })
    .first()
    .click()
  const oakOption = page.getByRole('menuitemcheckbox', { name: /^Oak/ })
  const optionsBefore = await page.getByRole('menuitemcheckbox').allInnerTexts()
  await oakOption.click()
  await expect(sherry).toBeHidden({ timeout: 30_000 })
  const sherryOption = page.getByRole('menuitemcheckbox', { name: /^Sherry/ })
  if (!(await sherryOption.isVisible()))
    await page
      .getByRole('button', { name: new RegExp(optionLabel) })
      .first()
      .click()
  await expect(sherryOption).toBeVisible({ timeout: 15_000 })
  const optionsAfter = await page.getByRole('menuitemcheckbox').allInnerTexts()
  await snap(page, '4.23-filtered-by-oak')

  save('4.23', {
    meilisearchVersion: version,
    misspelt,
    storeApi,
    fromMeilisearch,
    storefront: { foundBoth, optionsBefore, optionsAfter, url: page.url().replace(storefront, '') },
  })
  expect(storeApi, 'the Store API finds both bottles by the misspelt name').toEqual(
    [names.Oak, names.Sherry].sort(),
  )
  expect(
    Object.values(fromMeilisearch).flat(),
    'Meilisearch finds them by the misspelt name',
  ).toEqual(expect.arrayContaining([names.Oak, names.Sherry]))
  expect(foundBoth, 'the storefront shows both for the misspelt name').toBe(true)
  expect(optionsBefore.map((text) => text.replace(/\s+/g, ' ').trim())).toEqual([
    'Oak (1)',
    'Sherry (1)',
  ])
  // Disjunctive: choosing Oak leaves Sherry's count across the other values.
  expect(optionsAfter.map((text) => text.replace(/\s+/g, ' ').trim())).toEqual([
    'Oak (1)',
    'Sherry (1)',
  ])
})
