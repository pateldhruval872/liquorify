# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: compare-batch-6.spec.ts >> CMP-DA-G-24 b6-status-badge-over-received light
- Location: fidelity/comparison.ts:154:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-slot="badge"]').filter({ hasText: /^Over-received$|^Over received$/ }).first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-slot="badge"]').filter({ hasText: /^Over-received$|^Over received$/ }).first() with timeout 20000ms
  - waiting for locator('[data-slot="badge"]').filter({ hasText: /^Over-received$|^Over received$/ }).first()

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- list:
  - listitem:
    - button "Switch store": S Shop
- button "Toggle Sidebar"
- list:
  - listitem:
    - button "Search anything… CTRL K"
- list:
  - listitem:
    - link "Getting Started 2 /6":
      - /url: /store_UkLWZg9DAJ/getting-started
  - listitem:
    - link "Home":
      - /url: /store_UkLWZg9DAJ
  - listitem:
    - link "Orders":
      - /url: /store_UkLWZg9DAJ/orders
  - listitem:
    - link "Products":
      - /url: /store_UkLWZg9DAJ/products
  - listitem:
    - link "Inventory":
      - /url: /store_UkLWZg9DAJ/inventory
    - list:
      - listitem:
        - link "Transfers":
          - /url: /store_UkLWZg9DAJ/transfers
      - listitem:
        - link "Purchase orders":
          - /url: /store_UkLWZg9DAJ/purchase-orders
      - listitem:
        - link "Suppliers":
          - /url: /store_UkLWZg9DAJ/suppliers
  - listitem:
    - link "Customers":
      - /url: /store_UkLWZg9DAJ/customers
  - listitem:
    - link "Sellers":
      - /url: /store_UkLWZg9DAJ/sellers
  - listitem:
    - link "Loyalty":
      - /url: /store_UkLWZg9DAJ/loyalty/gift-cards
  - listitem:
    - link "Promotions":
      - /url: /store_UkLWZg9DAJ/promotions
  - listitem:
    - link "Reports":
      - /url: /store_UkLWZg9DAJ/reports
- list:
  - listitem:
    - link "Settings":
      - /url: /store_UkLWZg9DAJ/settings
- list:
  - listitem:
    - button "User menu": a admin@example.com
- button "Notifications"
- main:
  - button "Back"
  - heading "PO1006" [level=1]
  - text: Over-received
  - button "More actions"
  - text: Items
  - table:
    - rowgroup:
      - row "Product Ordered Received Rejected Over Unit cost Line total":
        - columnheader "Product"
        - columnheader "Ordered"
        - columnheader "Received"
        - columnheader "Rejected"
        - columnheader "Over"
        - columnheader "Unit cost"
        - columnheader "Line total"
    - rowgroup:
      - row "Fidelity speckled mug FID-MUG 12 14 0 2 $6.50 $78.00":
        - cell "Fidelity speckled mug FID-MUG":
          - link "Fidelity speckled mug FID-MUG":
            - /url: /store_UkLWZg9DAJ/products/prod_ROeNhrwyV9
        - cell "12"
        - cell "14"
        - cell "0"
        - cell "2"
        - cell "$6.50"
        - cell "$78.00"
  - text: Deliveries 1 SR1008
  - time: 15 minutes ago
  - text: 14 accepted · 0 rejected
  - table:
    - rowgroup:
      - row "Product Accepted Rejected Reason":
        - columnheader "Product"
        - columnheader "Accepted"
        - columnheader "Rejected"
        - columnheader "Reason"
    - rowgroup:
      - row "Fidelity speckled mug FID-MUG 14 0 —":
        - cell "Fidelity speckled mug FID-MUG":
          - link "Fidelity speckled mug FID-MUG":
            - /url: /store_UkLWZg9DAJ/products/prod_ROeNhrwyV9
        - cell "14"
        - cell "0"
        - cell "—"
  - text: Stock movements for this order
  - table:
    - rowgroup:
      - row "Date Product Where Change What happened Why":
        - columnheader "Date"
        - columnheader "Product"
        - columnheader "Where"
        - columnheader "Change"
        - columnheader "What happened"
        - columnheader "Why"
    - rowgroup:
      - row "15 minutes ago Fidelity speckled mug FID-MUG E2E Destination Warehouse +14 Received Purchase order PO1006":
        - cell "15 minutes ago":
          - time: 15 minutes ago
        - cell "Fidelity speckled mug FID-MUG"
        - cell "E2E Destination Warehouse"
        - cell "+14"
        - cell "Received"
        - cell "Purchase order PO1006":
          - link "Purchase order PO1006":
            - /url: /store_UkLWZg9DAJ/purchase-orders/po_OIJLhNcSbf
  - text: Details
  - term: Supplier
  - definition:
    - link "Fidelity Kilnworks":
      - /url: /store_UkLWZg9DAJ/suppliers?edit=sup_gbHJdmfrXB
  - term: Deliver to
  - definition:
    - link "E2E Destination Warehouse":
      - /url: /store_UkLWZg9DAJ/settings/stock-locations?edit=sloc_EfhxLZ9ck8
  - term: Units
  - definition: 14 received of 12 ordered
  - term: Total
  - definition: $78.00
  - term: Expected
  - definition: 2026-12-08
  - term: Cancel by
  - definition: 2026-12-20
  - term: Supplier reference
  - definition: Fidelity order over
  - term: Ordered
  - definition:
    - time: 15 minutes ago
  - term: Received
  - definition:
    - time: 15 minutes ago
- region "Notifications"
```

# Test source

```ts
  62  |       const key = [
  63  |         element.tagName.toLowerCase(),
  64  |         element.getAttribute('data-slot') ?? '',
  65  |         element.getAttribute('class') ?? '',
  66  |       ].join('|')
  67  |       if (!styles[key]) {
  68  |         const computed = getComputedStyle(element)
  69  |         styles[key] = Object.fromEntries(
  70  |           names.map((name) => [name, computed.getPropertyValue(name)]),
  71  |         )
  72  |       }
  73  |       for (const child of element.children) visit(child)
  74  |     }
  75  |     visit(root)
  76  |     return styles
  77  |   }, properties)
  78  | }
  79  | 
  80  | function compareStyles(screen: Styles, story: Styles) {
  81  |   const differences: { element: string; property: string; screen: string; story: string }[] = []
  82  |   for (const [element, values] of Object.entries(screen)) {
  83  |     const other = story[element]
  84  |     if (!other) continue
  85  |     for (const property of properties) {
  86  |       if (values[property] !== other[property]) {
  87  |         differences.push({ element, property, screen: values[property], story: other[property] })
  88  |       }
  89  |     }
  90  |   }
  91  |   return {
  92  |     compared: Object.keys(screen).filter((element) => element in story).length,
  93  |     onlyOnScreen: Object.keys(screen).filter((element) => !(element in story)),
  94  |     onlyInStory: Object.keys(story).filter((element) => !(element in screen)),
  95  |     differences,
  96  |   }
  97  | }
  98  | 
  99  | export async function openStory(page: Page, id: string, theme: 'light' | 'dark', held = false) {
  100 |   await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  101 |   await page.waitForFunction(() =>
  102 |     ['completed', 'finished', 'afterEach'].includes(
  103 |       window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
  104 |     ),
  105 |   )
  106 |   await page.evaluate(() => document.fonts.ready)
  107 |   // A story that holds a request open never lets the network go quiet.
  108 |   if (!held) await page.waitForLoadState('networkidle')
  109 | }
  110 | 
  111 | async function sideBySide(page: Page, screen: Buffer, story: Buffer, path: string) {
  112 |   const image = (buffer: Buffer) => `data:image/png;base64,${buffer.toString('base64')}`
  113 |   await page.setContent(`
  114 |     <body style="margin:0;font:14px sans-serif;display:flex;gap:16px;padding:16px;background:#ddd;width:max-content">
  115 |       <figure style="margin:0"><figcaption>Running screen</figcaption><img src="${image(screen)}"></figure>
  116 |       <figure style="margin:0"><figcaption>Story</figcaption><img src="${image(story)}"></figure>
  117 |     </body>`)
  118 |   await page.screenshot({ path, fullPage: true })
  119 | }
  120 | 
  121 | export interface Case {
  122 |   /** LIQ-009 inventory ID. */
  123 |   id: string
  124 |   /** What is compared, for the results folder. */
  125 |   name: string
  126 |   /** The story's ID in the built Storybook. */
  127 |   story: string
  128 |   /** Opens the running screen and returns the component there. */
  129 |   screen: (page: Page) => Promise<Locator>
  130 |   /** The component in the story. */
  131 |   inStory: (page: Page) => Promise<Locator> | Locator
  132 |   /** Captures the window instead of the component, for popups. */
  133 |   viewport?: boolean
  134 |   /** Opens both sides in a window this size, for a component taller than the default. */
  135 |   window?: { width: number; height: number }
  136 |   /** The story holds a request open, to show what loads. */
  137 |   held?: boolean
  138 |   /** Elements painted out of both images, because they show a secret. */
  139 |   paintedOut?: string
  140 |   /** Removes or restores what the case changed through the running screen. */
  141 |   after?: () => Promise<void>
  142 | }
  143 | 
  144 | export async function adminPage(page: Page, path: string) {
  145 |   const session = await login(page)
  146 |   await page.goto(`/${session.store_id}${path}`)
  147 |   await page.waitForLoadState('networkidle')
  148 | }
  149 | 
  150 | /** Registers each case in light and dark, saving both images side by side with their styles. */
  151 | export function compareCases(cases: Case[]) {
  152 |   for (const theme of ['light', 'dark'] as const) {
  153 |     for (const item of cases) {
  154 |       test(`${item.id} ${item.name} ${theme}`, async ({ page, browser }) => {
  155 |         const folder = `${results}${item.name}/`
  156 |         mkdirSync(folder, { recursive: true })
  157 |         if (item.window) await page.setViewportSize(item.window)
  158 |         await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  159 |         const hidden = item.paintedOut ? { style: paintOut(item.paintedOut) } : {}
  160 |         try {
  161 |           const onScreen = await item.screen(page)
> 162 |           await expect(onScreen).toBeVisible({ timeout: 20_000 })
      |                                  ^ Error: expect(locator).toBeVisible() failed
  163 |           await page.waitForTimeout(500)
  164 |           // Styles first: a value painted out for the screenshot fades back
  165 |           // afterwards, and its colours would be read halfway.
  166 |           const screenStyles = await collectStyles(onScreen)
  167 |           const screenImage = await (item.viewport ? page : onScreen).screenshot(hidden)
  168 |           const screenWidth = (await onScreen.boundingBox())?.width
  169 | 
  170 |           const storyPage = await browser.newPage({
  171 |             viewport: item.window ?? { width: 1280, height: 800 },
  172 |           })
  173 |           await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  174 |           await openStory(storyPage, item.story, theme, item.held)
  175 |           const inStory = await item.inStory(storyPage)
  176 |           await expect(inStory).toBeVisible()
  177 |           await storyPage.waitForTimeout(500)
  178 |           const storyStyles = await collectStyles(inStory)
  179 |           const storyImage = await (item.viewport ? storyPage : inStory).screenshot(hidden)
  180 |           const storyWidth = (await inStory.boundingBox())?.width
  181 | 
  182 |           writeFileSync(`${folder}${theme}-screen.png`, screenImage)
  183 |           writeFileSync(`${folder}${theme}-story.png`, storyImage)
  184 |           await sideBySide(storyPage, screenImage, storyImage, `${folder}${theme}-side-by-side.png`)
  185 |           writeFileSync(
  186 |             `${folder}${theme}-styles.json`,
  187 |             JSON.stringify(
  188 |               {
  189 |                 id: item.id,
  190 |                 story: item.story,
  191 |                 theme,
  192 |                 revision,
  193 |                 screenWidth,
  194 |                 storyWidth,
  195 |                 ...compareStyles(screenStyles, storyStyles),
  196 |                 styles: { screen: screenStyles, story: storyStyles },
  197 |               },
  198 |               null,
  199 |               2,
  200 |             ),
  201 |           )
  202 |           await storyPage.close()
  203 |         } finally {
  204 |           await item.after?.()
  205 |         }
  206 |       })
  207 |     }
  208 |   }
  209 | }
  210 | 
```