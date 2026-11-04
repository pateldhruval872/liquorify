// Opens the storefront built against the first-run store and records what a
// shopper sees: the home page, the products page and the espresso machine's page.
// Usage: node check.mjs <country code> <out dir>
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const [cc, out] = process.argv.slice(2)
const base = `http://localhost:3301/${cc}/en`
const priceRe = {
  us: /\$\s?\d[\d,]*\.\d{2}/g,
  pl: /\d[\d\s .,]*\s?zł|zł\s?\d[\d\s .,]*|PLN\s?\d[\d.,]*/g,
  de: /\d[\d\s .,]*\s?€|€\s?\d[\d\s .,]*/g,
}[cc]
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } })
const outside = []
await page.route((url) => !['localhost', '127.0.0.1'].includes(url.hostname) && !['data:', 'blob:'].includes(url.protocol), (route) => { outside.push(route.request().url()); return route.abort() })
const result = { country: cc, base, pages: {}, outsideBlocked: 0 }
async function visit(name, path, extra) {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.waitForTimeout(1500)
  const main = (await page.locator('main').first().innerText().catch(() => '')) ?? ''
  const prices = [...new Set(main.match(priceRe) ?? [])].map((p) => p.trim())
  const entry = {
    url: page.url().replace('http://localhost:3301', ''),
    status: response?.status() ?? null,
    title: await page.title(),
    h1: (await page.locator('h1').allInnerTexts()).map((t) => t.trim()),
    productHeadings: (await page.locator('main h3').allInnerTexts()).map((t) => t.trim()).length,
    noProductsFound: /No products found/i.test(main),
    productCount: (main.match(/\b\d+ products?\b/) ?? [null])[0],
    pricesShown: prices.length,
    priceExamples: prices.slice(0, 6),
    ...(extra ? await extra() : {}),
  }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false })
  result.pages[name] = entry
}
await visit('home', '')
await visit('products', '/products')
await visit('espresso-machine', '/products/automatic-espresso-machine', async () => ({
  addToCart: await page.getByRole('button', { name: /add to cart/i }).count(),
}))
result.outsideBlocked = outside.length
writeFileSync(`${out}/storefront.json`, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
await browser.close()
