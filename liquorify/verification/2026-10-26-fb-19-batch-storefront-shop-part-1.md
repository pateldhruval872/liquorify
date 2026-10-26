---
title: FB-19 storefront shop batch, part 1
record: verification
work_item: FB-19
date: 2026-10-26
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens, Spree's own specs for the endpoints part 1's screens read, and the storefront's own browser tests in CI. All 33 states the work item lists were captured, at each width the storefront shows them, and two more were found on the way; five were reached by holding or failing a request, and their notes say so. 28 cases were compared with their stories, the pilot's six among them, with no unexplained difference and no story needing a correction. Coverage and functional verification are recorded apart (§2): CAP-05-17 is PARTIAL, its home page and menu steps passing the storefront's browser tests; the search overlay, the region switch and the policy page have no browser test (G-41). The storefront shows nine behaviours the work item did not expect, recorded as its behaviour (§5). Tenant isolation and the owner's acceptance are NOT_RUN. CI at `da06743`: the visual check passed twice, 342 of 342 each time, and Lint, Type Check, Unit Tests and the end-to-end job passed, all 21 browser tests. Locally, one cart browser test failed on a duplicate link name with Spree's sample catalog (B9); it passed in CI
---

# FB-19 storefront shop batch, part 1

**Claim.** Part 1 of the [storefront shop batch](../work-items/fb-19-batch-storefront-shop.md) reproduces what the storefront already has for its home page, header, footer and menus, search, region and language preferences, the policy page, and the error and not-found pages. It gives the 18 components those screens use 49 Storybook stories, with a reference image at each of the storefront's two widths. It captures the screens and overlays on the running storefront in each meaningful state, as a guest and a customer, with wholesale off and on, and in two markets. It compares 28 cases with their stories, runs Spree's own specs for the endpoints these screens read and the storefront's own browser tests, and records the three permission claims apart. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch), as the [shopper accounts batch](2026-10-22-fb-19-batch-storefront-shopper-accounts.md) did, and the owner's answers of 2026-10-26 to the work item's three questions (§6).

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and reference images | Storefront draft pull request [#20](https://github.com/pateldhruval872/liquorify-storefront/pull/20) at `da06743`, one commit on storefront `main` `321fa1c` |
| This record and its evidence | Draft pull request [#21](https://github.com/pateldhruval872/liquorify/pull/21), on backend `main` `afd97cd`. It merges after #19 and #20, as [LIQ-004's lanes](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches) set out, and is brought up to date after each |
| The storefront's code | `main` `321fa1c`. The branch changes none of it: `git diff 321fa1c da06743` over `src/`, `messages/`, `public/`, `e2e/`, `.github/`, `package.json` and `pnpm-lock.yaml` is empty |
| Spree's code: the API and the browser-test server | Backend `d6a0fb8`, whose Spree code is `main` `afd97cd`'s. Neither pull request changes it |
| Running screens | The storefront at `321fa1c`, built for production, against lane A's own browser-test Rails server at `d6a0fb8`, with Spree's sample catalog in its own database. Captured in the storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels wide, with the fonts served offline |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-storefront-shop.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails | PASS: the map in §2 has every ID from the work item's §2.1, with its evidence or a named gap. None of part 1's screens sends an email |
| 2 | Every component part 1's screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | PASS: 18 new components, 49 stories, 98 reference images, each looked at before it was committed (§1, [image review list](2026-10-26-fb-19-batch-storefront-shop-part-1-image-review.md)). The reused components are listed in §1. `DocumentShell` has no story, for the reason LIQ-009 records (U5) |
| 3 | Every screen and overlay is captured on the running storefront in each state in §2.2, at both widths | PASS: all 33 listed states are captured. 30 at both widths; the header's region control and its wholesale link at 1280 pixels only, and the menu's region control at 390 only, because the storefront shows each only at that width. Two more states were found and captured (§2.1). 73 images in all |
| 4 | Each variant in §2.3 is captured, showing what the interface does for it | PASS as evidence of what the interface shows: a guest and a customer, wholesale off and on, and the United States beside a second market in euros, German and French (§3.1) |
| 5 | FL-05's first step is mapped to the browser tests that cover it, and their result at the part's revision is recorded, in CI where the end-to-end job runs them | PASS for the mapping (§2.2). In CI at `da06743` the end-to-end job ran all 21 of the storefront's browser tests, and all passed, against Spree's published image. Locally, against lane A's server, both home page tests passed; of the two cart tests run for the header's cart button, one failed on a duplicate link name that only Spree's sample catalog produces (B9). Searching has no browser test (G-41) |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | PASS, as a diagnostic: 22 new cases and the pilot's six, 53 comparisons across the three set-ups, show no unexplained difference, and no story needed a correction (§4). The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is a gap, with the check made instead; a state reached in the browser says so | PASS: 19 of the 49 stories were not compared by the script; 8 show a state seen in a running-screen capture and 11 were checked against their source only (G-42). Five states were reached by holding or failing a request, three in the browser and two through the capture script's proxy, and their notes say so (G-43) |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | PASS: at `da06743` the visual check passed twice in CI, 342 of 342 comparisons each time, once on the pull request and once started by hand. It stays advisory. Lint, Type Check, Unit Tests and the end-to-end job passed (§8) |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: #20 changes only `stories/`, `visual/` and Storybook's configuration, which now serves three local image folders and replaces four more server modules with mocks inside Storybook only. #21 changes only `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's storefront Storybook column, LIQ-004's progress, gaps and G-02's row, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | NOT_RUN: #20 and #21 are drafts |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for the endpoints part 1's screens read, run at the part's revision. What no spec exercises is NOT_RUN | PASS for what Spree's specs exercise: 304 examples in 18 files, no failures (§3.2). What no spec exercises is NOT_RUN (G-45) |
| 13 | Tenant isolation is NOT_RUN; a new isolation defect is reported to the owner privately | NOT_RUN (§3.3). None of the open findings ISO-1 to ISO-7 is about these screens. No new isolation defect was found; none was looked for beyond Spree's own specs |

## 1. What was built

**Stories, 49, for the 18 new components.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-1-image-review.md) names each one. Each has a reference image at 390 pixels (mobile) and 1280 pixels (desktop). The storefront shows no dark mode, so there is one theme ([LIQ-010 §8](../LIQ-010-design-system-reproduction-architecture.md#8-themes-and-widths-captured)).

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `input-group` (CMP-SF-P-11) | Default, Disabled, Filled, Focused |
| | `sheet` (CMP-SF-P-20) | Right, Left, Without close button |
| `home/` (CMP-SF-G-05) | FeaturedProductsSection | Default, Loading, No products |
| | WholesaleSection | Default |
| `layout/` (CMP-SF-G-06) | Header | Empty cart, Cart count, Wholesale link |
| | CartButton | Empty, With items |
| | SearchToggle | Open |
| | MobileMenu | Main panel, Category panel, Subcategory panel, Wholesale link |
| | RegionPreferences | Header control, Menu control, Dialog, Another country with languages, Updating, Failed |
| | Footer | Default, No categories, Wholesale link |
| | CurrentYear | Default |
| `products/` (CMP-SF-G-10), the featured products only | FeaturedProducts | Default |
| | ProductCarousel | Default, No products |
| | ProductCard | Default, On sale, Sold out, No picture with a long name, On sale with no picture, Price withheld, Price withheld in wholesale |
| | ProductCardSkeleton | Default |
| | HiddenPricePrompt | Default |
| `search/` (CMP-SF-G-11) | SearchBar | One letter, Searching, Suggestions, Keyboard choice, No results |
| Page level | `global-error` (CMP-SF-PG-13) | Default |

**Already covered, reused by these screens:** `button` (CMP-SF-P-04), `dialog` (CMP-SF-P-08), `field` (CMP-SF-P-10), `native-select` (CMP-SF-P-14), `product-image` (CMP-SF-P-16) and the toaster (CMP-SF-P-21), from the pilot and the accounts batch, and the pilot's HeroSection (CMP-SF-G-05). The policy page's content is written inside its page file rather than as a component, so the running-screen captures show it (§2.1).

**Not given a story.** `DocumentShell` (CMP-SF-G-06) draws the page's `html` element, which a story cannot hold inside Storybook's own page. Storybook's preview applies the same font and body classes, and every running-screen capture shows it. LIQ-009 records it as U5. The structured data for search engines (CMP-SF-G-12) renders nothing visible; its presence on the home page is recorded from the page's source (§2.1).

**Fixtures and mocks.** An invented catalog of nine products, with a sale, no picture, sold out and a withheld price among them,, three top-level categories with two levels below, a second market, and four small product pictures, with a check that the fixtures match the SDK's types. Storybook's preview now also replaces the storefront's product, checkout, configuration and cookie modules, so stories give them fixtures as they already did for the cart and the customer, and serves the storefront's flags and the logo from local files. The application code is unchanged.

**Scripts beside the Storybook (`visual/fidelity/`).**
- `shop-screens.spec.ts` captures each part 1 screen on the built storefront in each state and for each variant, and writes beside each image how the state was reached and what the browser observed that a picture cannot show. It registers a customer, so it writes to the backend's database: it is pointed only at a test server.
- `proxy.ts` stands between the storefront and the backend for the `proxied` set-up, and holds the product list for 20 seconds or answers it with a server error.
- `capture.ts` holds what the accounts and shop captures share; `screens.spec.ts` now reads it from there.
- `compare.spec.ts` gains 22 cases and runs a case only on the set-up it names.
- `visual/stories.spec.ts` now fails a story whose play function throws, which it let pass before. Every story's play function passed in both CI runs.

## 2. The batch map, completed

The map from the [work item §2.1](../work-items/fb-19-batch-storefront-shop.md#21-capabilities-screens-flows-and-tests), with the evidence and result of each row. Capture paths are in the [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/README.md).

Coverage and functional verification are kept apart ([LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete), criterion 9). **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen, not that a flow works. **Functionally verified** is whether the capability's flow, or the behaviour named, was shown to work end to end at the part's revisions. No capability in part 1 is functionally verified in full.

| Capability | Screens | Flow | Who may see it | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-05-17 Storefront home, header, footer and menus, with the error and not-found pages | SF-SHOP-01, SF-OVL-01, SF-SYS-01, SF-SYS-02 | FL-05, its first step | Anyone | `home/`, `layout/` but RegionPreferences and SearchToggle, the featured products from `products/`, `global-error`, `sheet`; reused `button`, HeroSection | 33 stories; 19 states captured; 22 cases compared, the pilot's six among them; the storefront's browser tests; Spree's product, category, channel and cart specs | PASS, with found behaviour B1 to B9 | PARTIAL: opening a featured product from the home page and a category from the header's menu pass the storefront's browser tests, locally and in CI (§2.2). The error and not-found pages are captured, not tested, and answer as B4 to B7 describe |
| CAP-05-14 Product search and filters, the search overlay only | SF-OVL-03 | FL-05, searching instead of browsing | Anyone | SearchToggle, SearchBar, `input-group` | 10 stories; 6 states captured; 4 cases compared; Spree's product specs | PASS for the overlay | NOT_RUN for the overlay as a browser test (G-41). The capture run typed into the running storefront and saw Spree's suggestions and a keyboard choice, once. The rest of CAP-05-14 is part 2's |
| CAP-03-07 Markets and CAP-03-08 Languages, the shopper's region and language preferences only | SF-OVL-04 | None | Anyone | RegionPreferences; reused `dialog`, `field`, `native-select` | 6 stories; 7 states captured; 2 cases compared; the storefront's unit tests; Spree's market, country, currency and language specs | PASS | PARTIAL: the capture run chose Germany and German and arrived at `/de/de` in euros, once; the storefront's unit tests for the dialog and the switch passed. No browser test switches region (G-41). The markets' own settings are batch 3's (#19) |
| CAP-03-09 Store policies, the policy page only | SF-SHOP-06 | None | Anyone | None of its own: the page's content is in its page file | 3 states captured; the policy page's unit test; Spree's policy specs | PASS, with found behaviour B4 | NOT_RUN for the page as a browser test (G-41). CAP-03-09 keeps its failing part, the consent at registration (SD-2) |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-light-<width>.webp` in the evidence folder, with a JSON note that records the path, the variant, how the state was reached, and what the browser observed that a picture cannot show.

**Counts, from the capture notes.** 35 states captured, 73 images: 33 states the work item lists and two found on the way (SF-SYS-01 "malformed address" and SF-SYS-02 "unknown country"). 32 states at both widths; three at one width, where the storefront shows them only. Three states were captured for both a guest and a customer, and their captures show the same header, menu and home page.

| Screen | States captured (set-up, variant) | How the state was reached, where it matters |
|---|---|---|
| SF-SHOP-01 Home | hero and featured products (standard; guest and customer); featured products loading (proxied); no products to feature (proxied); with the wholesale section (wholesale) | **Loading:** the proxy held the product list for 20 seconds, so the page showed what the storefront streams while it waits; one visit shows it once, so the page was captured at 390 pixels and then widened to 1280 without reloading. **No products:** a market in pounds, in which no sample product has a price, added for the proxied runs only and removed after each; Spree lists only the products priced in the market's currency. The home page featured 8 products, and its source holds one block of structured data, an Organization |
| SF-OVL-01 Header, footer and menu | header with an empty cart (guest and customer); with a cart count, one item; with the wholesale link, at 1280 (wholesale); the menu's main panel (guest and customer); Kitchen's panel; Coffee Machines' panel; the menu with the wholesale link (wholesale); the footer; the footer with the wholesale link (wholesale) | **Subcategory panel:** the sample catalog's categories have one level below the top, so two subcategories of Coffee Machines were added through the Admin API. **Wholesale link:** the header shows it from 1024 pixels wide; below that the menu holds it. The header shows the menu button at 1280 pixels too, where the menu is a side panel with its own title. The browser saw B1 and B2 |
| SF-OVL-03 Search | open and empty; one letter typed, nothing suggested; searching; suggestions listed, two products, with "view all results"; a suggestion chosen with the keyboard; no results | **Searching:** the search request was left unanswered in the browser. **Keyboard choice:** the down arrow pressed twice; the field names the chosen suggestion as its active option |
| SF-OVL-04 Region and language | the header's control, at 1280; the menu's control, at 390; the dialog with the United States and English; Germany chosen, offering German, English and French; updating; failed; the storefront after switching, at `/de/de` in euros and German | **Updating and failed:** with a product in the cart, whose currency changes first; that request was left unanswered, or failed, in the browser. **Controls:** the header shows its control from 1024 pixels; below that the menu holds it. After switching, product names and the storefront's own text are German; the footer's category names stay as the sample catalog names them |
| SF-SHOP-06 Policy | a policy with formatted content (the returns policy); a policy with no content (the shipping policy); not found | **Formatted content:** the sample policies have no content, so invented content was given to the returns policy through the Admin API. **Not found:** answered with status 200 (B4) |
| SF-SYS-01 Application error page | the page failing to load its data; a malformed address | **Failing:** the proxy answered the product list with a server error, so the products page could not render; answered with status 200 (B7). **Malformed address:** `/us/en/products/%E0%A4%A`, answered with a plain-text 500 (B6) |
| SF-SYS-02 Not found | an unknown policy; an unknown page; a language the storefront does not have; an unknown country | **Unknown page:** status 404, Next.js's built-in page (B5). **Unknown language and country:** `/us/xx` and `/zz/en` are sent to `/us/en`, status 200 (B8) |

**The data behind the captures.** Lane A's own browser-test database, made from Spree's seeds, the browser tests' admin and Spree's sample catalog, loaded with `Spree::SampleData::Loader`, which `spree:load_sample_data` calls: 38 products, 24 categories, one market, four policies without content, and the online, wholesale and point-of-sale channels, with a publishable key for the wholesale channel. Added through Spree's Admin API: a "Europe" market in euros, with German, English and French, for Germany and France; invented formatted content for the returns policy; two subcategories of Coffee Machines; and, for the proxied runs only, a "United Kingdom" market in pounds. The customer was registered by the capture run through the storefront, with an `example.com` address. Nothing about the data, the customer's password or the keys is committed.

**Three set-ups.** `standard`, the storefront as built for production; `wholesale`, the same storefront built with `SPREE_WHOLESALE_CHANNEL=wholesale`; and `proxied`, the standard storefront reaching the backend through `proxy.ts`. Each state names its set-up in the evidence index.

### 2.2 FL-05's first step

The browser tests are the storefront's own, in `e2e/`, unchanged.

**In CI.** The end-to-end job ran at `da06743` ([run 40273183995](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40273183995)). It booted Spree's published image, not the Liquorify backend, and ran all 21 of the storefront's browser tests: 21 passed in 2.5 minutes. Its reporter prints only the totals.

**Locally.** The four tests below ran against lane A's server at `d6a0fb8`, with Spree's sample catalog, in the pinned Playwright 1.60.0 image ([storefront-browser-tests.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/flows/storefront-browser-tests.json)). Three passed. "A customer changes the quantity and removes the item" failed in the test's own helper, which looks for one link with the product's name: in the cart drawer, the item's picture is a link too, described by the product's name, and the sample catalog's first featured product has a picture (B9). The same test passed unchanged in CI, against Spree's published image.

| Step | Covered by | Result | Gap |
|---|---|---|---|
| SF-SHOP-01: open the home page and a featured product | `catalog.spec.ts`: "shows featured products that open their product page" | Passed locally and in CI | |
| SF-OVL-01: open a category from the header's menu | "the header menu opens a category" | Passed locally and in CI | |
| SF-OVL-01: the header's cart button, for G-02 | `cart.spec.ts`: "an empty cart points back to the catalog", "a customer changes the quantity and removes the item" | The first passed locally; the second failed locally (B9). Both passed in CI | The cart's own flow is batch 9's (G-44) |
| SF-OVL-03: search, and open a suggestion or the results page | None. Captured: every listed state; Spree's product specs | | **G-41:** no browser test |
| SF-SHOP-02 to SF-SHOP-04, and the rest of FL-05 | Part 2, and batch 9 for the cart and checkout | | |

**The storefront's unit tests for part 1's components,** run locally at `da06743`, whose `src/` is `321fa1c`'s: 30 tests in 9 files passed (`MobileMenu.test.tsx`, `RegionPreferences.test.tsx`, `DocumentShell.test.tsx`, `ProductCard.test.tsx`, the policy page's `page.test.tsx` and its data module's `policies.test.ts`, `useCountrySwitch.test.ts`, and the locale and storefront layouts' tests). The locale layout's tests include "redirects an unknown country to the default Market and keeps the page" (B8). The whole suite, 258 tests, passed locally and in CI.

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each visitor

From the running-screen captures. This shows only what the storefront displays; a page that hides something does not stop a request.

| Variant | What the storefront does | Evidence |
|---|---|---|
| Guest and signed-in customer | The same header, menu and home page for both; the storefront has no roles | SF-SHOP-01 "hero and featured", SF-OVL-01 "header empty cart" and "menu main panel", for both |
| Wholesale off | No wholesale section or links | Every standard capture |
| Wholesale on | The home page's wholesale section; the wholesale link in the header from 1024 pixels, in the menu and in the footer | SF-SHOP-01 "wholesale section"; SF-OVL-01 "header", "menu" and "footer wholesale link" |
| The United States, in English and dollars | The default market | Every capture but those below |
| Germany, in German and euros | Offered by the region dialog; after switching, the same pages at `/de/de` | SF-OVL-04 "another country" and "after switching" |
| A market whose currency no product is priced in | The home page with no products to feature | SF-SHOP-01 "no products" |

### 3.2 What the server refuses

**Spree's own specs, at `d6a0fb8`.** Run in this session on SQLite with Spree's test app: the API engine's Store API controller and integration specs for every endpoint part 1's screens read, and the cart, whose count the header shows and whose currency the region switch changes. 304 examples in 18 files, no failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/backend/api-specs.json). The Store API has no endpoint for the store itself; what the storefront reads about it comes from the channel, markets, countries, currencies and languages endpoints, which are among them.

| Endpoint or rule | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Products and their filters | `products_controller_spec.rb` (52), `products_spec.rb` (12), `products/filters_controller_spec.rb` (17) | A missing or invalid key answers 401. Another store's product, a draft product and a slug in another language answer 404, and drafts and other stores' products are not listed. A product outside the buyer's catalogs answers 404. A channel that hides prices from guests leaves the price range out for a guest |
| Categories | `categories_controller_spec.rb` (32), `categories_spec.rb` (7) | A missing key answers 401. Another store's category, an unknown one, an invalid ID and a permalink in another language answer 404 |
| Storefront access and channels | `storefront_gating_spec.rb` (13), `channel_binding_spec.rb` (7), `channel_controller_spec.rb` (4), `channel_spec.rb` (2) | Where prices are hidden, a guest gets no price; where sign-in is required, a guest gets 401 for products and orders, while countries stay open. A key bound to a channel refuses a header naming another channel with 422 and a deactivated channel with 403, and refuses a guest before revealing whether a product exists. The channel endpoint needs a key, and falls back to the request's store's default channel |
| Markets, countries, currencies and languages | `markets_controller_spec.rb` (10), `markets_spec.rb` (9), `countries_spec.rb` (6), `currencies_spec.rb` (2), `locales_spec.rb` (2) | A missing key answers 401. An unknown market, a country in no market, an invalid country code, a country outside the market and an unknown country answer 404 |
| Policies | `policies_controller_spec.rb` (9), `policies_spec.rb` (4) | A missing key answers 401; an unknown policy answers 404; other stores' policies are not listed |
| Carts | `carts_controller_spec.rb` (103), `carts_spec.rb` (13) | A missing key answers 401, and listing carts without a token answers 401. Other customers' and other stores' carts are not listed. Another customer's cart answers 403 to a signed-in customer; another store's cart, a completed one and an unknown one answer 404. Taking over a guest cart needs its token. Changing the market refuses an unknown market and follows the currency, keeping the market when none has the currency |

**What no Spree spec exercises, NOT_RUN as a spec result.** None sends these requests through the storefront's own server code, which keeps the cart's token in a cookie and calls these endpoints for the shopper. Part 1 adds no refusal check (G-45). The storefront's unit tests passed in CI, but this part did not review them for authorization.

**Observations of the running system, not specs.** No capture made a request as the wrong customer. The region switch changed the cart's currency before the address, as the storefront's code describes, and a failed change kept the shopper where they were (SF-OVL-04 "failed").

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. None of the open findings [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings) is about these screens. Whether one store's catalog, markets or policies can show on another store's storefront is FB-03's.

Some of Spree's specs above touch store boundaries: another store's products, categories, policies and carts are not listed or not found, and the channel falls back to the request's store. They are listed so they are not lost. They are Spree's own unit checks, not FB-03's validation, and the part claims nothing about isolation from them. Every capture used the one store in lane A's database. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, at 390 and 1280 pixels, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/README.md). Each case ran on the set-up its screen needs; the results below are the final run of each, at `da06743` against the storefront at `321fa1c`: 40 comparisons on the standard set-up, 7 with wholesale on and 6 through the proxy, all passed.

Every case shows one difference on every element, the font list: the built storefront names `Geist, "Geist Fallback", …` and Storybook names `Geist, …`. It is the pilot's explained difference D6: Next.js's font loader adds a fallback face that keeps text the same size while Geist loads, and Storybook's stand-in makes none ([pilot fidelity record §5](2026-10-21-fb-19-pilot-fidelity.md#5-differences-found)). The tables list the other differences. Text, counts and pictures differ on purpose, because the stories show invented data.

### 4.1 Part 1's cases

| ID | Case | Story | Running screen | Other styles that differ | Explained |
|---|---|---|---|---|---|
| CMP-SF-G-06 | header-empty-cart | Header: Empty cart | The header | None | |
| CMP-SF-G-06 | header-cart-count | Header: Cart count | The header, one item in the cart | None | |
| CMP-SF-G-06 | header-wholesale-link | Header: Wholesale link | The header with wholesale on, at 1280 | None | Shown at 1280 only, where the link is |
| CMP-SF-G-06 | footer | Footer: Default | The footer | height | The sample catalog has five top-level categories and the story's catalog three, so the screen's shop column is longer |
| CMP-SF-G-06 | footer-wholesale-link | Footer: Wholesale link | The footer with wholesale on | height | As for the footer |
| CMP-SF-G-06 | mobile-menu-main-panel | Mobile menu: Main panel | The menu's main panel | border-radius at 1280, on the back button | The back button is invisible on the main panel; on the screen it was caught at a different point of its transition. It draws nothing on either side |
| CMP-SF-G-06 | mobile-menu-category-panel | Mobile menu: Category panel | Kitchen's panel | None | |
| CMP-SF-G-06 | mobile-menu-subcategory-panel | Mobile menu: Subcategory panel | Coffee Machines' panel | None | |
| CMP-SF-G-06 | mobile-menu-wholesale-link | Mobile menu: Wholesale link | The menu with wholesale on | border-radius at 1280, on the back button | As for the main panel |
| CMP-SF-P-20 | sheet-left | Sheet: Left | The menu's sheet, at 1280 | The styles of one icon only; elements on one side only | Both sheets are 384 pixels wide. The menu gives the sheet classes of its own and draws its own header and close button in place of the sheet's, so the script matched only one element by its classes: the menu's back arrow beside the story's close icon, whose colour and text styles come from different buttons. The sheet's place, width and colours are compared in the images only |
| CMP-SF-G-06 | region-header-control | Region preferences: Header control | The header's control, at 1280 | None | Shown at 1280 only, where the header has it |
| CMP-SF-G-06 | region-dialog | Region preferences: Dialog | The region and language dialog | None | |
| CMP-SF-G-06 | search-open | Search toggle: Open | The header with the search open | None | |
| CMP-SF-G-11 | search-suggestions | Search bar: Suggestions | Suggestions listed | height of the list | The story suggests three products and the screen two |
| CMP-SF-G-11 | search-keyboard-choice | Search bar: Keyboard choice | A suggestion chosen with the keyboard | height of the list | As above |
| CMP-SF-P-11 | input-group-search | Input group: Focused | The search field, focused | None | The field takes the width of the search bar on the screen, and the story's frame in Storybook |
| CMP-SF-G-05 | featured-products-section | Featured products section: Default | The home page's featured products | height; elements on one side only | The story's products include a sale, a missing picture and a sold-out product, whose badge, crossed-out price, placeholder and "out of stock" line appear in the story only and make its cards taller. The carousel library adds state classes as it runs, to its wrapper and, at 390, to its arrows, and they differ on each side, so the script did not pair those elements |
| CMP-SF-G-10 | product-card | Product card: Default | The first featured product | height | The card takes its column's width and its picture is square, so its height follows the width: 350 and 278 pixels on the screen, 288 in the story |
| CMP-SF-G-05 | wholesale-section | Wholesale section: Default | The home page with wholesale on | None | |
| CMP-SF-G-05 | featured-products-section-loading | Featured products section: Loading | The home page, the product list held | opacity of the placeholders | The placeholders pulse; each side was captured at a different point of the pulse |
| CMP-SF-G-05 | featured-products-section-no-products | Featured products section: No products | A market no product has a price in | None | |
| CMP-SF-PG-13 | global-error | Global error: Default | The products page, its product list failing | font-size, line-height and height of one plain `div`; elements on one side only | The page draws its own document. Storybook's preview keeps its own wrappers and loaders inside the page's body, and the running page's head has a stylesheet link; the plain `div` matched on each side is a different one. The heading, message and button match |

The parts captured inside a page, such as the input group, the product card and the search bar, take their container's width, so their stories are compared by style rather than by width.

### 4.2 Components compared within another

Eight stories are compared as part of a larger component that holds them: the cart button's two stories within the header cases, the current year within the footer, the featured products and the product carousel's two stories within the featured products cases, the product card skeleton within the loading case, and the right-hand sheet within the cart drawer cases below.

### 4.3 The pilot's cases, run again, and G-02

At the owner's answer of 2026-10-26 to the work item's third question, part 1 takes the part of G-02 its screens show. The pilot's six storefront cases ran again at part 1's revision, against lane A's server with Spree's sample catalog.

| ID | Case | Story | Running screen | Other styles that differ | Explained |
|---|---|---|---|---|---|
| CMP-SF-G-05 | hero-section | Hero section: Default | The home page's hero | None | |
| CMP-SF-P-04 | button-large | Button: Sizes, the large one | A product page's Add to Cart button | An icon on the screen only | The screen's button holds an icon and its label (the pilot's D4) |
| CMP-SF-G-03 | cart-drawer-empty | Cart drawer: Empty | The drawer opened from the header with a pointer | border colour of the close button | The story opens as from the keyboard, so its close button shows its focus ring; opened with a pointer, the screen's does not (the pilot's D7) |
| CMP-SF-G-03 | cart-drawer-with-items | Cart drawer: With items | The drawer with one item, opened with a pointer | border colour; heights; elements on one side only | D7, and the data (the pilot's D3): the story holds two items, with options and a sale price, and the screen one |
| CMP-SF-G-03 | cart-drawer-empty-keyboard | Cart drawer: Empty | The drawer opened from the header's cart button with the keyboard | None | |
| CMP-SF-G-03 | cart-drawer-with-items-keyboard | Cart drawer: With items | The same, with one item | heights; elements on one side only | The data (D3) |

**What this changes in G-02,** which held 35 stories checked against their source only, and the cart drawer opened with a pointer, since the pilot's acceptance:
- **The hero and the button.** The hero and the large button were compared again on part 1's data, with the pilot's results. Four of the button's nine stories that G-02 holds show variants part 1's screens use, and those variants were compared within their parents: the primary button in the hero, the outline button in the hero and the wholesale section, the ghost icon buttons in the header and the link button in the featured products. The stories themselves were not put beside a screen. Secondary, Destructive, With icon, Disabled and Focus visible stay checked against their source.
- **The cart drawer.** Opened from the header's cart button with the keyboard, it matches its stories with no difference but the data. Opened with a pointer, the difference D7 remains: no story shows the drawer without its focus ring, because no story opens it by clicking. That state, the drawer's own states, the toaster's error and the drawer's loading state stay with the cart batch (9).
- G-02 stays PENDING. Its row in LIQ-004 records what part 1 showed; it closes only on the owner's acceptance.

### 4.4 Tokens

Every custom property Storybook's root defines has the same value on the running storefront's home page, at part 1's revision. The running page also defines ten properties from the toast and carousel libraries' own stylesheets, which the story page does not load, as the pilot found (D8) ([tokens.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/comparison/tokens.json)).

## 5. The storefront's behaviour found, recorded and not changed

Each is how the storefront and Spree work at `321fa1c` and `d6a0fb8`. Part 1 reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | The cart button's accessible name is "Open cart", which replaces what it shows, so a screen reader does not hear the count | SF-OVL-01 "header cart count", observed by the browser |
| B2 | From 768 pixels wide, opening the menu moves focus to the back button in the menu's header, which is invisible on the main panel and has no name. The menu's close button has no name either. Below 768 pixels the menu has no header row, and focus moves to the first category, Kitchen | SF-OVL-01 "menu main panel", observed by the browser at 390 and 1280, and again at 800 in this session |
| B3 | The menu's "Contact" link opens `/#contact`, the home page, where nothing has that name, so it lands at the top of the page | SF-OVL-01 menu; the storefront's `MobileMenu.tsx` |
| B4 | An unknown policy shows Next.js's built-in "This page could not be found." page, but is answered with status 200, not 404 | SF-SHOP-06 "not found", SF-SYS-02 "unknown policy" |
| B5 | Not-found pages are Next.js's built-in page, without the storefront's header, footer or font, because the storefront has no `not-found.tsx`, as LIQ-008 records. An unknown page is answered with status 404 | SF-SYS-02 "unknown page" |
| B6 | An address the storefront cannot decode is answered with status 500 and the plain text "Internal Server Error", not the application error page | SF-SYS-01 "malformed address" |
| B7 | The application error page is answered with status 200, because the page has started to stream before its data fails, and draws in the browser's default serif font, without the header and footer. The accounts batch saw the same page (its B1) | SF-SYS-01 "page fails" |
| B8 | A country or a language the storefront does not have in the address is sent to `/us/en`, keeping the rest of the address, rather than to a not-found page. The storefront's unit tests expect it | SF-SYS-02 "unknown language", "unknown country" |
| B9 | In the cart drawer, an item's picture is a link described by the product's name, beside the link of its name, so the drawer has two links with the same name. With Spree's sample catalog, the storefront's own cart test fails on it | §2.2; the local browser test results |

B1 and B2 concern accessibility, which FB-15 owns. B4 to B7 concern how the storefront answers search engines and shoppers when something is missing or fails. Whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own features.

## 6. The owner's answers, and corrections to the work item

**The owner's answers of 2026-10-26,** to the work item's three questions, all as recommended. They are recorded in the [work item §7](../work-items/fb-19-batch-storefront-shop.md#7-questions-for-the-owner):
1. The product card's stories belong in part 1. Part 1 made seven, with the featured products, the carousel, the skeleton and the hidden price prompt.
2. The storefront is captured with wholesale on as well as off.
3. Part 1 takes the part of G-02 its screens show: the hero and the pilot's button compared where they appear, and the cart drawer opened from the header's cart button with the keyboard (§4.3).

**Corrections,** recorded in the [work item](../work-items/fb-19-batch-storefront-shop.md) §11 without changing the proposal's text:
- The wholesale channel, a publishable key for it and the four policies, all without content, came with Spree's sample catalog. Part 1 added through the Admin API only the Europe market, the returns policy's content, two subcategories and, for the proxied runs, the pounds market. The customer was registered by the capture run.
- SF-SHOP-01 "featured products loading" and SF-SYS-01 were both reached without changing code, through the capture script's proxy, so the work item's §8 gaps for them close.
- SF-SYS-01 has a second state, "malformed address", which does not show the application error page (B6).
- SF-SYS-02 "a language the storefront does not have" is not a not-found page: the storefront sends it to `/us/en`, as it does an unknown country (B8).
- SF-SHOP-06 "not found" and SF-SYS-02 "an unknown policy" are the same page, answered with status 200 (B4).
- The header's region control and wholesale link show only from 1024 pixels wide, and the menu's control only below it, so those three states have one width each.
- The menu's subcategory panel needs categories two levels deep, which the sample catalog lacks.
- `DocumentShell` is recorded as U5 in LIQ-009.
- The two cart tests were run as well as the work item's two catalog tests, because the header's cart button opens the drawer (G-02).

## 7. Gaps

Each names what is missing, the check made instead and what would close it. They are proposed in [LIQ-004's register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) as G-41 to G-45, after batch 3's G-33 to G-40 in #19, and wait for the owner's answers.

| Gap | Check made instead | What would close it |
|---|---|---|
| G-41: no browser test drives the search overlay, the region and language switch or the policy page | Captures of every listed state; the storefront's unit tests for the dialog, the switch and the policy page; Spree's specs | A browser test for each, before Liquorify first changes these screens |
| G-42: 19 of the 49 stories not compared by the script | 8 show a state seen in a running-screen capture; 11 checked against their source only. Each is named in the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-1-image-review.md) | Running screens that show those states: part 2's product lists for the product card's states, the wholesale batch (12) for a withheld price |
| G-43: 5 states reached by holding or failing a request: SF-OVL-03 "searching" and SF-OVL-04 "updating" and "failed" in the browser; SF-SHOP-01 "featured products loading" and SF-SYS-01 "page fails" through the proxy | Each note says how the state was reached and claims nothing about the server | Accept as simulated interface-state coverage, as G-20, G-21 and G-27 |
| G-44: the cart test "a customer changes the quantity and removes the item" fails against Spree's sample catalog (B9) | The same test passed in CI at `da06743` against Spree's published image | The cart batch (9), which runs the cart's tests against its own data |
| G-45: requests no Spree spec sends for part 1's endpoints, and the storefront's own server code for them (§3.2) | Spree's specs; no capture made a request as the wrong customer | Join G-11 |
| G-02's part for batch 9: the cart drawer opened with a pointer, its own states, the toaster's error and the drawer's loading state, and five button stories | §4.3 | The cart batch (9), as G-02's row says |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 8. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Storybook 40273184196](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40273184196) | `da06743`, every story, image and script of part 1 | Built, token check and coverage passed, and all 342 comparisons passed in 3.3 minutes under the explicit tolerance: part 1's 98 images, and the 244 of the pilot and the accounts batch |
| [Storybook 40273896390](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40273896390) | `da06743`, started by hand | All 342 comparisons passed again, in 2.9 minutes |
| [CI 40273183995](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40273183995) | `da06743` | Lint, Type Check and Unit Tests passed. "E2E (Playwright + Spree)" booted Spree's published image and ran all 21 browser tests: 21 passed in 2.5 minutes |

The coverage report at `da06743` counts 14 of the storefront's 22 primitives, 32 of its 66 feature component files and 1 of its 13 page-level components with stories. #21 changes only records; the backend's checks on it are shown on that pull request.

**Local checks, in this session.** At `da06743`: lint and format (Biome, 352 files), the type check and the unit tests (258, the fixture check among them) passed. The reference images were written in the pinned image by the storefront's own visual check, and compared by it in CI (above). The capture runs reached every listed state: 73 images, 60 on the standard set-up, 7 with wholesale on and 6 through the proxy. The comparison passed on all three set-ups. Spree's specs passed, 304 examples. The four browser tests: 3 passed and 1 failed (§2.2).

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the sample catalog on screens.** Names, counts and pictures differ on purpose.
- **Data added by hand through the APIs.** The Europe and pounds markets, the returns policy's content and the two subcategories were added during the session through Spree's Admin API, not by a committed script, so this record lists them (§2.1). They exist only in lane A's test database. Spree's tests, fixtures and code are unchanged.
- **The sample catalog's pictures** were fetched from the network by Spree's loader when the database was made. The captures show them as the storefront serves them.
- **Two storefront builds.** The wholesale set-up is the same revision built with a wholesale channel, so the two differ only by that setting.
- **Different SDK versions.** The storefront pins `@spree/sdk` 2.0.0-rc.3 while the backend ships rc.4 (FB-06). The captures show the pinned pair.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL; #21 changes no Spree code, so they are not run for it.
- **CI's browser tests used Spree's published image,** not the Liquorify backend, as FB-06 records.
- **Size.** The reference images are 1.1 MB and the evidence 8.5 MB, in 256 files. The evidence images are lossless WebP, converted from the PNG captures with every pixel checked equal.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-1/README.md) lists every capture, comparison and result file, by inventory ID. The [image review list](2026-10-26-fb-19-batch-storefront-shop-part-1-image-review.md) lists every reference image for the owner's review.
