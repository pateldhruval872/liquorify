import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { linkIn, MAIL_DIR, type Mail, mailTo, nextMail } from './mail'

/**
 * FL-21 on the running server (batch 5 part 2, criterion 15, as the owner
 * strengthened it on 2026-11-04). A product file is imported through the
 * wizard from the product list, and each product it imported is read back
 * through the Admin API and compared with the file, field by field. EM-S-06 is
 * read where the server writes its mail, and its link followed to DA-SET-31.
 * Then every product is exported from the product list; EM-S-05 is read the
 * same way and its link followed; and the file the dashboard downloads is
 * checked: its header against Spree's product format, its rows against every
 * product the Admin API lists, and representative rows value by value.
 *
 * Start the stack as for mail.spec.ts: Spree's browser-test server with
 * `LIQUORIFY_MAIL_DIR`, and the built dashboard on port 5174. The imported
 * products are deleted afterwards, so the store's counts are as they were;
 * the import and the export stay in the store's history.
 */

const RESULTS = new URL('./results/fl-21/', import.meta.url)

/** Spree's product export columns, in order (spree/core/app/presenters/spree/csv/product_variant_presenter.rb). */
const PRODUCT_COLUMNS = [
  'product_id',
  'sku',
  'name',
  'slug',
  'status',
  'seller_name',
  'description',
  'meta_title',
  'meta_description',
  'meta_keywords',
  'tags',
  'labels',
  'price',
  'compare_at_price',
  'currency',
  'width',
  'height',
  'depth',
  'dimensions_unit',
  'weight',
  'weight_unit',
  'available_on',
  'discontinue_on',
  'track_inventory',
  'inventory_count',
  'inventory_backorderable',
  'stock_location',
  'tax_category',
  'product_type',
  'image1_src',
  'image2_src',
  'image3_src',
  'option1_name',
  'option1_value',
  'option2_name',
  'option2_value',
  'option3_name',
  'option3_value',
  'category1',
  'category2',
  'category3',
]

/** The export's columns not compared value by value, and why. */
const NOT_COMPARED = {
  product_id: "the database's own number; the Admin API gives only prefixed ids",
  labels: 'the Admin API product response has no labels',
  available_on:
    "read from the product's publication on the default channel, which the product response does not carry",
  discontinue_on:
    "read from the product's publication on the default channel, which the product response does not carry",
  image1_src: 'image addresses are signed for each response, so two reads differ',
  image2_src: 'image addresses are signed for each response, so two reads differ',
  image3_src: 'image addresses are signed for each response, so two reads differ',
}

interface Price {
  currency: string
  amount: string
  compare_at_amount: string | null
  price_list_id: string | null
  min_quantity: number | null
}
interface StockLevel {
  count_on_hand: number
  backorderable: boolean
  stock_location_id: string
}
interface OptionValue {
  label: string
  option_type_label: string
}
interface Variant {
  id: string
  sku: string | null
  track_inventory: boolean
  weight: number | null
  height: number | null
  width: number | null
  depth: number | null
  weight_unit: string | null
  dimensions_unit: string | null
  tax_category_id: string | null
  prices: Price[]
  stock_levels: StockLevel[]
  option_values: OptionValue[]
}
interface Product {
  id: string
  name: string
  slug: string
  status: string
  description: string | null
  description_html: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  tags: string[]
  seller_name: string | null
  tax_category_id: string | null
  product_type_id: string | null
  variants: Variant[]
  categories: { pretty_name: string; depth: number }[]
}

interface Comparison {
  field: string
  file: string
  server: string
  same: boolean
  /** Why a difference is not the file disagreeing with the server. */
  explained?: string
}

const expand = 'variants,variants.prices,variants.stock_levels,variants.option_values,categories'

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index++
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const csvCell = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value

const sameNumber = (file: string, server: number | string | null) =>
  file === '' ? server === null || server === '' : Number(file) === Number(server)
const sameSet = (file: string[], server: string[]) =>
  JSON.stringify([...file].sort()) === JSON.stringify([...server].sort())

function record(name: string, facts: unknown) {
  mkdirSync(RESULTS, { recursive: true })
  writeFileSync(new URL(name, RESULTS), `${JSON.stringify(facts, null, 2)}\n`)
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: new URL(`${name}.png`, RESULTS).pathname })

// A link's query can carry a credential: the record keeps only its parameter names.
const described = (link: URL) =>
  `${link.origin}${link.pathname}${[...link.searchParams.keys()].length > 0 ? `?${[...link.searchParams.keys()].map((key) => `${key}=…`).join('&')}` : ''}`

async function read<T>(api: APIRequestContext, headers: Record<string, string>, path: string) {
  const response = await api.get(`/api/v3/admin${path}`, { headers })
  expect(response.status(), `GET ${path}`).toBe(200)
  return (await response.json()) as T
}

async function allProducts(api: APIRequestContext, headers: Record<string, string>) {
  const products: Product[] = []
  for (let page = 1; ; page++) {
    const body = await read<{ data: Product[]; meta: { pages: number } }>(
      api,
      headers,
      `/products?limit=100&page=${page}&expand=${expand}`,
    )
    products.push(...body.data)
    if (page >= body.meta.pages) return products
  }
}

const basePrice = (variant: Variant, currency: string) =>
  variant.prices.find(
    (price) =>
      price.currency === currency && price.price_list_id === null && (price.min_quantity ?? 1) <= 1,
  )

test.describe('FL-21', () => {
  test.skip(!MAIL_DIR, 'Start the stack with LIQUORIFY_MAIL_DIR (see mail.spec.ts)')

  test('FL-21: a product file imported from the product list, and the catalog exported', async ({
    page,
  }) => {
    test.setTimeout(600_000)
    mkdirSync(RESULTS, { recursive: true })
    const session = await login(page)
    const api = page.request
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      'X-Spree-Store-Id': session.store_id,
    }
    const store = await read<{
      default_currency: string
      weight_unit: string
      unit_system: string
    }>(api, headers, '/store')
    const locations = await read<{ data: { id: string; name: string; default: boolean }[] }>(
      api,
      headers,
      '/stock_locations',
    )
    const defaultLocation = locations.data.find((location) => location.default)
    expect(defaultLocation).toBeTruthy()
    const lookups = {
      taxCategories: Object.fromEntries(
        (
          await read<{ data: { id: string; name: string }[] }>(
            api,
            headers,
            '/tax_categories?limit=100',
          )
        ).data.map((category) => [category.id, category.name]),
      ),
      productTypes: Object.fromEntries(
        (
          await read<{ data: { id: string; name: string }[] }>(
            api,
            headers,
            '/product_types?limit=100',
          )
        ).data.map((type) => [type.id, type.name]),
      ),
    }

    // The file: a product without options, and a product with two variants,
    // its second variant on a row of its own as Spree's own export writes it.
    const suffix = Date.now()
    const columns = [
      'slug',
      'sku',
      'name',
      'price',
      'compare_at_price',
      'status',
      'description',
      'meta_title',
      'meta_description',
      'tags',
      'weight',
      'weight_unit',
      'width',
      'height',
      'depth',
      'dimensions_unit',
      'track_inventory',
      'inventory_count',
      'option1_name',
      'option1_value',
      'category1',
    ]
    const tray = `fidelity-fl21-tray-${suffix}`
    const jug = `fidelity-fl21-jug-${suffix}`
    const fileRows: Record<string, string>[] = [
      {
        slug: tray,
        sku: `FL21-TRAY-${suffix}`,
        name: `Fidelity FL-21 serving tray ${suffix}`,
        price: '24.50',
        compare_at_price: '29.00',
        status: 'active',
        description: 'An oak serving tray, sized for breakfast in bed.',
        meta_title: 'Oak serving tray',
        meta_description: 'A serving tray made of oiled oak.',
        tags: 'fl21, tray',
        weight: '0.8',
        weight_unit: 'kg',
        width: '40',
        height: '3',
        depth: '28',
        dimensions_unit: 'cm',
        track_inventory: 'true',
        inventory_count: '12',
        option1_name: '',
        option1_value: '',
        category1: 'Kitchen -> Coffee Machines',
      },
      {
        slug: jug,
        sku: `FL21-JUG-SM-${suffix}`,
        name: `Fidelity FL-21 water jug ${suffix}`,
        price: '18.00',
        compare_at_price: '21.00',
        status: 'draft',
        description: 'A glass water jug with a beech lid.',
        meta_title: 'Glass water jug',
        meta_description: 'A glass jug for water, with a beech lid.',
        tags: 'fl21, jug',
        weight: '0.5',
        weight_unit: 'kg',
        width: '10',
        height: '24',
        depth: '10',
        dimensions_unit: 'cm',
        track_inventory: 'true',
        inventory_count: '5',
        option1_name: 'Size',
        option1_value: 'Small',
        category1: 'Kitchen -> Coffee Machines',
      },
      {
        slug: jug,
        sku: `FL21-JUG-LG-${suffix}`,
        name: '',
        price: '22.00',
        compare_at_price: '25.00',
        status: '',
        description: '',
        meta_title: '',
        meta_description: '',
        tags: '',
        weight: '0.7',
        weight_unit: 'kg',
        width: '12',
        height: '28',
        depth: '12',
        dimensions_unit: 'cm',
        track_inventory: 'true',
        inventory_count: '7',
        option1_name: 'Size',
        option1_value: 'Large',
        category1: '',
      },
    ]
    const file = [
      columns.join(','),
      ...fileRows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
    ]
    writeFileSync(new URL('import.csv', RESULTS), `${file.join('\n')}\n`)

    const importMails = mailTo(session.admin_email).length
    try {
      // DA-PRD-01 → DA-OVL-05: upload, map, start, and wait for the results.
      await page.goto(`/${session.store_id}/products`)
      await page.getByRole('button', { name: /^import$/i }).click()
      await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
      await page
        .getByRole('dialog')
        .locator('input[type="file"]')
        .setInputFiles({
          name: `fidelity-fl21-${suffix}.csv`,
          mimeType: 'text/csv',
          buffer: Buffer.from(`${file.join('\n')}\n`),
        })
      await page.getByRole('button', { name: /^continue$/i }).click()
      await expect(page.getByText('Map columns')).toBeVisible({ timeout: 15_000 })
      await shot(page, '1-import-mapping')
      const importStarted = Date.now()
      await page.getByRole('button', { name: /start import/i }).click()
      await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 180_000 })
      const importSeconds = Math.round((Date.now() - importStarted) / 1000)
      await shot(page, '2-import-results')

      // EM-S-06, read as sent, and its link to DA-SET-31.
      const importMail = await nextMail(session.admin_email, importMails)
      const importMailSeconds = Math.round((Date.now() - importStarted) / 1000)
      const importLink = linkIn(importMail, /\/settings\/imports/)
      const importId = importLink.searchParams.get('import') ?? ''
      expect(importId).toMatch(/^imp_/)
      const imported = await read<{
        number: string
        status: string
        rows_count?: number
      }>(api, headers, `/imports/${importId}`)
      await page.goto(importLink.href)
      await expect(page.getByText(imported.number).first()).toBeVisible({ timeout: 15_000 })
      await shot(page, '3-import-email-link')

      // Each imported product, read back, against every field the file maps.
      const importComparisons: Record<string, Comparison[]> = {}
      for (const row of fileRows) {
        const body = await read<{ data: Product[] }>(
          api,
          headers,
          `/products?q%5Bslug_eq%5D=${row.slug}&expand=${expand}`,
        )
        expect(body.data, row.slug).toHaveLength(1)
        const product = body.data[0]
        const variant = product.variants.find((candidate) => candidate.sku === row.sku)
        const checks: Comparison[] = []
        const check = (field: string, server: string, same?: boolean) => {
          const value = row[field]
          if (value === '') return
          checks.push({ field, file: value, server, same: same ?? value === server })
        }
        const price = variant ? basePrice(variant, store.default_currency) : undefined
        const stock = variant?.stock_levels.find(
          (level) => level.stock_location_id === defaultLocation?.id,
        )
        check('slug', product.slug)
        check('sku', variant?.sku ?? '(no variant with this SKU)')
        check('name', product.name)
        check('price', price?.amount ?? '', sameNumber(row.price, price?.amount ?? null))
        check(
          'compare_at_price',
          price?.compare_at_amount ?? '',
          sameNumber(row.compare_at_price, price?.compare_at_amount ?? null),
        )
        check('status', product.status)
        check('description', product.description_html ?? product.description ?? '')
        check('meta_title', product.meta_title ?? '')
        check('meta_description', product.meta_description ?? '')
        check(
          'tags',
          product.tags.join(', '),
          sameSet(
            row.tags.split(',').map((tag) => tag.trim()),
            product.tags,
          ),
        )
        for (const field of ['weight', 'width', 'height', 'depth'] as const) {
          check(
            field,
            String(variant?.[field] ?? ''),
            sameNumber(row[field], variant?.[field] ?? null),
          )
        }
        check('weight_unit', variant?.weight_unit ?? '')
        check('dimensions_unit', variant?.dimensions_unit ?? '')
        check('track_inventory', String(variant?.track_inventory ?? ''))
        check('inventory_count', String(stock?.count_on_hand ?? ''))
        const option = variant?.option_values.find(
          (value) => value.option_type_label === row.option1_name,
        )
        check('option1_name', option?.option_type_label ?? '')
        check('option1_value', option?.label ?? '')
        check(
          'category1',
          product.categories.map((category) => category.pretty_name).join(' | '),
          product.categories.some((category) => category.pretty_name === row.category1),
        )
        importComparisons[`${row.slug} ${row.sku}`] = checks
      }
      record('import.json', {
        file: { columns, rows: fileRows.length },
        import: { id: importId, number: imported.number, status: imported.status },
        seconds_to_results: importSeconds,
        seconds_to_email: importMailSeconds,
        'EM-S-06': { subject: importMail.subject, link: described(importLink) },
        'DA-SET-31': `opened from the email's link, showing ${imported.number}`,
        compared: importComparisons,
      })
      for (const [key, checks] of Object.entries(importComparisons)) {
        for (const comparison of checks) {
          expect
            .soft(comparison.same, `${key} ${comparison.field}: ${JSON.stringify(comparison)}`)
            .toBe(true)
        }
      }

      // The export, from the product list: every record.
      const exportMails = mailTo(session.admin_email).length
      await page.goto(`/${session.store_id}/products`)
      await page.getByRole('button', { name: /^export$/i }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio', { name: /^all records/i }).click()
      await shot(page, '4-export-dialog')
      const exportStarted = Date.now()
      const downloading = page.waitForEvent('download', { timeout: 180_000 })
      await dialog.getByRole('button', { name: /^export$/i }).click()
      const download = await downloading
      const downloadSeconds = Math.round((Date.now() - exportStarted) / 1000)
      const downloaded = new URL(`export-${download.suggestedFilename()}`, RESULTS).pathname
      await download.saveAs(downloaded)
      await expect(page.getByText(/export downloaded/i)).toBeVisible({ timeout: 15_000 })
      await shot(page, '5-export-downloaded')

      // EM-S-05, read as sent; its link, followed.
      const exportMail: Mail = await nextMail(session.admin_email, exportMails)
      const exportMailSeconds = Math.round((Date.now() - exportStarted) / 1000)
      // The email also links the store's own site from its logo; the export's
      // button links back into the dashboard.
      const exportLink = linkIn(exportMail, new RegExp(`/${session.store_id}/`))
      const exportLinkResponse = await page.goto(exportLink.href)
      await page.waitForTimeout(1_500)
      await shot(page, '6-export-email-link')
      const exportLinkLands = {
        status: exportLinkResponse?.status() ?? null,
        page: new URL(page.url()).pathname.replace(session.store_id, '<store>'),
        downloads: false,
      }
      page.once('download', () => {
        exportLinkLands.downloads = true
      })
      await page.waitForTimeout(3_000)

      // The same export, fetched through the Admin API, is the file the dashboard downloaded.
      const exports = await read<{
        data: { id: string; number: string; download_url: string | null; done?: boolean }[]
      }>(api, headers, '/exports?limit=1&sort=-created_at')
      const latest = exports.data[0]
      expect(latest?.download_url).toBeTruthy()
      const fetched = await api.get(latest.download_url as string, { headers })
      expect(fetched.status()).toBe(200)
      const text = (await fetched.text()).replace(/^﻿/, '')
      const { readFileSync } = await import('node:fs')
      const browserText = readFileSync(downloaded, 'utf8').replace(/^﻿/, '')
      expect(text, 'the file fetched through the API is the file the dashboard downloaded').toBe(
        browserText,
      )

      // The header: Spree's product columns, then the store's custom field columns.
      const [header, ...rows] = parseCsv(browserText).filter(
        (row) => !(row.length === 1 && row[0] === ''),
      )
      expect(header.slice(0, PRODUCT_COLUMNS.length)).toEqual(PRODUCT_COLUMNS)
      const at = (row: string[], column: string) => row[header.indexOf(column)] ?? ''

      // The rows cover the store's products: each variant's row in the store's
      // currency, a row for each variant priced in another currency, and a row
      // for each other location holding its stock.
      const products = (await allProducts(api, headers)).filter(
        (product) => product.status !== 'archived',
      )
      const otherCurrencies = [
        ...new Set(
          products.flatMap((product) =>
            product.variants.flatMap((variant) => variant.prices.map((price) => price.currency)),
          ),
        ),
      ].filter((currency) => currency !== store.default_currency)
      const kind = (row: string[]) =>
        at(row, 'stock_location') !== ''
          ? 'stock'
          : at(row, 'currency') !== store.default_currency
            ? 'price'
            : 'variant'
      const fileKeys = (wanted: string) =>
        rows
          .filter((row) => kind(row) === wanted)
          .map((row) =>
            [
              at(row, 'slug'),
              at(row, 'sku'),
              wanted === 'price' ? at(row, 'currency') : '',
              wanted === 'stock' ? at(row, 'stock_location') : '',
            ].join(' '),
          )
          .sort()
      const locationNames = Object.fromEntries(
        locations.data.map((location) => [location.id, location.name]),
      )
      const serverKeys = {
        variant: products
          .flatMap((product) =>
            product.variants.map((variant) => `${product.slug} ${variant.sku ?? ''}  `),
          )
          .sort(),
        price: products
          .flatMap((product) =>
            product.variants.flatMap((variant) =>
              otherCurrencies
                .filter((currency) => basePrice(variant, currency))
                .map((currency) => `${product.slug} ${variant.sku ?? ''} ${currency} `),
            ),
          )
          .sort(),
        stock: products
          .flatMap((product) =>
            product.variants
              .filter((variant) => variant.track_inventory)
              .flatMap((variant) =>
                variant.stock_levels
                  .filter(
                    (level) =>
                      level.stock_location_id !== defaultLocation?.id && level.count_on_hand !== 0,
                  )
                  .map(
                    (level) =>
                      `${product.slug} ${variant.sku ?? ''}  ${locationNames[level.stock_location_id] ?? level.stock_location_id}`,
                  ),
              ),
          )
          .sort(),
      }
      const coverage = Object.fromEntries(
        (['variant', 'price', 'stock'] as const).map((wanted) => {
          const inFile = fileKeys(wanted)
          const onServer = serverKeys[wanted]
          return [
            wanted,
            {
              file: inFile.length,
              server: onServer.length,
              missing_from_file: onServer.filter((key) => !inFile.includes(key)),
              not_on_server: inFile.filter((key) => !onServer.includes(key)),
            },
          ]
        }),
      )

      // Representative rows, value by value: a product without options, a
      // product with variants and each of its variants' rows, and both
      // products this run imported.
      const withoutOptions = products.find(
        (product) =>
          !product.slug.startsWith('fidelity-fl21-') &&
          product.variants.length === 1 &&
          product.variants[0].option_values.length === 0,
      )
      const withVariants = products.find((product) => product.name === 'Drip Coffee Maker 1.5L')
      const chosen = [
        withoutOptions,
        withVariants,
        products.find((product) => product.slug === tray),
        products.find((product) => product.slug === jug),
      ].filter((product): product is Product => Boolean(product))
      expect(chosen).toHaveLength(4)
      const exportComparisons: Record<string, Comparison[]> = {}
      for (const product of chosen) {
        product.variants.forEach((variant, index) => {
          const row = rows.find(
            (candidate) =>
              kind(candidate) === 'variant' &&
              at(candidate, 'slug') === product.slug &&
              at(candidate, 'sku') === (variant.sku ?? ''),
          )
          const checks: Comparison[] = []
          // A check that reads several columns passes what it read as `file`.
          const add = (column: string, server: string, same?: boolean, file?: string) => {
            const value = row ? (file ?? at(row, column)) : '(no row)'
            checks.push({ field: column, file: value, server, same: same ?? value === server })
          }
          const first = index === 0
          const price = basePrice(variant, store.default_currency)
          const stock = variant.stock_levels.find(
            (level) => level.stock_location_id === defaultLocation?.id,
          )
          add('sku', variant.sku ?? '')
          add('slug', product.slug)
          add('name', first ? product.name : '')
          add('status', first ? product.status : '')
          add('seller_name', first ? (product.seller_name ?? '') : '')
          add('description', first ? (product.description_html ?? product.description ?? '') : '')
          add('meta_title', first ? (product.meta_title ?? '') : '')
          add('meta_description', first ? (product.meta_description ?? '') : '')
          add('meta_keywords', first ? (product.meta_keywords ?? '') : '')
          const fileTags = row ? at(row, 'tags') : ''
          add(
            'tags',
            first ? product.tags.join(', ') : '',
            first
              ? sameSet(
                  fileTags === '' ? [] : fileTags.split(',').map((tag) => tag.trim()),
                  product.tags,
                )
              : fileTags === '',
          )
          add(
            'price',
            price?.amount ?? '',
            sameNumber(row ? at(row, 'price') : '', price?.amount ?? '0'),
          )
          add(
            'compare_at_price',
            price?.compare_at_amount ?? '',
            sameNumber(row ? at(row, 'compare_at_price') : '', price?.compare_at_amount ?? '0'),
          )
          add('currency', store.default_currency)
          for (const field of ['width', 'height', 'depth', 'weight'] as const) {
            add(
              field,
              String(variant[field] ?? ''),
              sameNumber(row ? at(row, field) : '', variant[field]),
            )
          }
          // The export writes a variant's own unit, blank when it has none; the
          // Admin API answers the store's unit in that case, as Spree's variant
          // falls back to it (spree/core/app/models/spree/variant.rb).
          const storeUnits = {
            dimensions_unit: store.unit_system === 'metric' ? 'cm' : 'in',
            weight_unit: store.weight_unit,
          }
          for (const field of ['dimensions_unit', 'weight_unit'] as const) {
            add(field, variant[field] ?? '')
            const last = checks[checks.length - 1]
            if (!last.same && last.file === '' && last.server === storeUnits[field]) {
              last.explained =
                "Blank in the file: the variant has no unit of its own, and the Admin API answers the store's"
            }
          }
          add('track_inventory', String(variant.track_inventory))
          add('inventory_count', variant.track_inventory ? String(stock?.count_on_hand ?? '') : '∞')
          add('inventory_backorderable', stock ? String(stock.backorderable) : '')
          add('stock_location', '')
          add(
            'tax_category',
            lookups.taxCategories[variant.tax_category_id ?? product.tax_category_id ?? ''] ?? '',
          )
          add('product_type', lookups.productTypes[product.product_type_id ?? ''] ?? '')
          for (const number of [1, 2, 3]) {
            const name = row ? at(row, `option${number}_name`) : ''
            const value = row ? at(row, `option${number}_value`) : ''
            const match = variant.option_values.find((option) => option.option_type_label === name)
            add(
              `option${number}_name and value`,
              match ? `${match.option_type_label}: ${match.label}` : '',
              name === '' ? value === '' : match?.label === value,
              name === '' && value === '' ? '' : `${name}: ${value}`,
            )
          }
          const fileCategories = row
            ? ['category1', 'category2', 'category3']
                .map((column) => at(row, column))
                .filter(Boolean)
            : []
          const serverCategories = first
            ? [...product.categories]
                .sort((a, b) => b.depth - a.depth)
                .slice(0, 3)
                .map((category) => category.pretty_name)
            : []
          add(
            'category1 to category3',
            serverCategories.join(' | '),
            sameSet(fileCategories, serverCategories),
            fileCategories.join(' | '),
          )
          exportComparisons[`${product.slug} ${variant.sku ?? ''}`] = checks
        })
      }

      record('export.json', {
        export: { number: latest.number },
        seconds_to_download: downloadSeconds,
        seconds_to_email: exportMailSeconds,
        file: download.suggestedFilename(),
        'EM-S-05': {
          subject: exportMail.subject,
          link: described(exportLink).replace(session.store_id, '<store>'),
          link_opens: exportLinkLands,
        },
        header: {
          product_columns: PRODUCT_COLUMNS.length,
          others: header.slice(PRODUCT_COLUMNS.length),
        },
        rows: rows.length,
        products: products.length,
        other_currencies: otherCurrencies,
        coverage,
        not_compared: NOT_COMPARED,
        representative: {
          without_options: withoutOptions?.name,
          with_variants: withVariants?.name,
          imported: [tray, jug],
        },
        compared: exportComparisons,
      })
      for (const [wanted, result] of Object.entries(coverage)) {
        expect.soft(result.missing_from_file, `${wanted} rows missing from the file`).toEqual([])
        expect.soft(result.not_on_server, `${wanted} rows not on the server`).toEqual([])
      }
      for (const [key, checks] of Object.entries(exportComparisons)) {
        for (const comparison of checks) {
          expect
            .soft(
              comparison.same || Boolean(comparison.explained),
              `${key} ${comparison.field}: ${JSON.stringify(comparison)}`,
            )
            .toBe(true)
        }
      }
    } finally {
      for (const slug of [tray, jug]) {
        const found = await api.get(`/api/v3/admin/products?q%5Bslug_eq%5D=${slug}`, { headers })
        for (const product of ((await found.json()) as { data?: { id: string }[] }).data ?? []) {
          await api.delete(`/api/v3/admin/products/${product.id}`, { headers })
        }
      }
    }
  })
})
