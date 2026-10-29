---
title: FB-19 batch 4, the storefront shop
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-26
updated: 2026-10-26
---

# FB-19 batch 4: the storefront shop

The storefront's second FB-19 batch organised by product area. It reproduces what the storefront already has for shopping: the home page, the header, footer and menus, search, the region and language preferences, the policy page, the error and not-found pages, and then the product lists, categories and the product page. Nothing here changes the storefront's code or Spree's, or adds a Liquorify feature.

**Status.** PROPOSED. On 2026-10-26 the owner approved this batch as lane A beside batch 3, in two reviewable parts, under the existing Spree-first baseline rules ([LIQ-004](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), batch 4). It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch), as the [shopper accounts batch](fb-19-batch-storefront-shopper-accounts.md) did. This work item is reviewed in part 1's records pull request. Part 1 is described in full in §2 to §9; part 2 is described in full in §10, in its own records pull request, before its work starts. The owner answered the questions in §7 on 2026-10-26, as recommended, and part 1 was built on those answers ([verification record](../verification/2026-10-26-fb-19-batch-storefront-shop-part-1.md)). What part 1 found that differs from this proposal is in §11. Part 2 was built on 2026-10-26 on branches of its own, at the owner's choice, so part 1's pull requests stay as reviewed ([verification record](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md)); what it found that differs from §10 is in §12. The owner accepted batch 3 on 2026-10-26 and #19 merged the same day, so part 2's checks that wait for batch 3 can now run. Part 1's records (#21) and stories (storefront #20) merged on 2026-10-27, recorded apart from acceptance at the owner's instruction; part 1's acceptance is pending ([merge record](../verification/2026-10-27-fb-19-batch-storefront-shop-part-1-merge.md)). The owner accepted part 2's reference images, screen evidence and fidelity on 2026-10-29, before its merge ([verification record §15](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md#15-the-owners-review-2026-10-29)).

**Reading of the instruction.** The owner's message of 2026-10-26 named the storefront checks for G-38, first-run setup with sample data (G-36) and CAP-05-16 as part of this batch, and said that checks depending on batch 3 run only after batch 3 is accepted and #19 merges. All three are in part 2. Part 1 depends on nothing in batch 3: its data is added through Spree's own APIs and sample data task in this lane's own test database, not through batch 3's screens.

## 1. Outcome and summary

Every screen and overlay of part 1 has Storybook stories for the components it uses, captures of the running screen in each meaningful state at the storefront's two widths, a step-by-step map of the flow steps it holds, and the three permission claims recorded apart. The map links each capability to its evidence or to a named gap.

- **Bounded:** 3 screens, 3 overlays, the 2 system pages, the first steps of one flow and about 18 new components in part 1, in one storefront pull request and one backend records pull request.
- **Same shape as the accounts batch:** screens, flow steps, visitors, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function is recorded apart from coverage:** a capture shows one state of a screen, not that a flow works.

## 2. Part 1's scope

### 2.1 Capabilities, screens, flows and tests

| Capability ([LIQ-006](../LIQ-006-product-capability-baseline.md)) | Screens ([LIQ-008](../LIQ-008-spree-screen-inventory.md)) | Flow | Browser tests |
|---|---|---|---|
| CAP-05-17 Storefront home, header, footer and menus, with the error and not-found pages | SF-SHOP-01, SF-OVL-01, SF-SYS-01, SF-SYS-02 | FL-05, its first step | `e2e/catalog.spec.ts`: "shows featured products that open their product page", "the header menu opens a category" |
| CAP-05-14 Product search and filters (the search overlay only) | SF-OVL-03 | FL-05, searching instead of browsing | None |
| CAP-03-07 Markets and CAP-03-08 Languages (the shopper's region and language preferences only) | SF-OVL-04 | None | None |
| CAP-03-09 Store policies (the policy page only) | SF-SHOP-06 | None | None |

The storefront's own unit tests for these components run with the batch and are recorded: `MobileMenu.test.tsx`, `RegionPreferences.test.tsx`, `DocumentShell.test.tsx`, the policy page's `page.test.tsx` and the layouts' tests.

### 2.2 Meaningful states to capture

From LIQ-008 and from what the components render at storefront `321fa1c`, at the mobile (390 pixels) and desktop (1280 pixels) widths the storefront's stories use. The storefront shows no dark mode ([LIQ-010 §8](../LIQ-010-design-system-reproduction-architecture.md#8-themes-and-widths-captured)).

| Screen | States |
|---|---|
| SF-SHOP-01 Home | Hero and featured products; featured products loading; no products to feature; with the wholesale section, when wholesale is on |
| SF-OVL-01 Header, footer and mobile menu | The header with an empty cart; with a cart count; with the wholesale link; the mobile menu's main panel with the categories; a category's panel; a subcategory's panel; the menu with the wholesale link; the footer with its category and policy links; the footer with the wholesale link |
| SF-OVL-03 Search | Open and empty; one letter typed, nothing suggested; searching; suggestions listed with "view all results"; a suggestion chosen with the keyboard; no results |
| SF-OVL-04 Region and language | The header's control; the menu's control; the dialog with the current country and language; another country chosen, with its languages; updating; failed; the storefront after switching, in the other country's currency and language |
| SF-SHOP-06 Policy | A policy with formatted content; a policy with no content; not found |
| SF-SYS-01 Application error page | The page as the storefront shows it when a page fails to render |
| SF-SYS-02 Not found | An unknown policy; an unknown page; a language the storefront does not have in the address |

A state reached by holding, failing or answering a request in the browser says so in its note and claims nothing about the server, as G-27 and G-34 recorded. A state no running screen shows with the available data is a gap, with its story checked against its source.

### 2.3 Who sees what

The storefront has no roles. The variants are who is asking and how the storefront is set up:
- **A guest and a signed-in customer:** the header, menu and footer are the same for both; the captures show it.
- **Wholesale off and on:** the wholesale section and links appear only when the storefront runs with a wholesale channel (`SPREE_WHOLESALE_CHANNEL`). The storefront is captured both ways.
- **Two markets:** the United States in English and dollars, and a second market with another currency and language, so the region dialog has a choice and the switch can be shown.

### 2.4 Left out, and where it goes

- Product lists, search results, filters and sorting (SF-SHOP-02), categories (SF-SHOP-03) and the product page (SF-SHOP-04): part 2. Part 1's search ends where the results page starts.
- The cart drawer (SF-OVL-02) and the cart page (SF-SHOP-05): batch 9. The header's cart button is part 1's; opening the drawer from it is the part of G-02 named in §7.
- The wholesale portal (SF-WHL): batch 12. Part 1 shows only the home page section and the links that lead to it.
- Whether markets, languages, storefront access, policies and custom fields saved in the dashboard take effect on the storefront: G-38's storefront checks, in part 2, after batch 3 is accepted and #19 merges.
- The structured data for search engines (`seo/`, CMP-SF-G-12): it renders nothing visible. Its presence on the home page is recorded from the page's source, without a story.

## 3. Part 1's components

New stories, about 18 components ([LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) §5):

| Layer | Components |
|---|---|
| Primitives (`src/components/ui/`) | `input-group` (CMP-SF-P-11), used by the search bar; `sheet` (CMP-SF-P-20), used by the mobile menu |
| `home/` (CMP-SF-G-05) | FeaturedProductsSection, WholesaleSection |
| `layout/` (CMP-SF-G-06) | Header, SearchToggle, CartButton, MobileMenu, RegionPreferences, Footer, CurrentYear |
| `search/` (CMP-SF-G-11) | SearchBar |
| `products/` (CMP-SF-G-10), the featured products only, if the owner agrees (§7, question 1) | FeaturedProducts, ProductCarousel, ProductCard, ProductCardSkeleton, HiddenPricePrompt |
| Page level | `global-error` (CMP-SF-PG-13), if Storybook can render a component that draws its own document; otherwise captured on the running screen only and recorded |

`DocumentShell` (CMP-SF-G-06) draws the document element and its body classes, which Storybook's preview already applies, so it is named with the reason rather than given a story. `CurrentYear` renders only the year inside the footer, so its story may be the footer's, as LIQ-009 allows for a part only rendered inside its parent.

Already covered and reused: `button` (CMP-SF-P-04), `dialog` (P-08), `field` (P-10), `native-select` (P-14), `product-image` (P-16) and `sonner` (P-21), from the pilot and the accounts batch, and the pilot's HeroSection.

## 4. Delivery

- **Storefront pull request:** stories, fixtures and mocks, reference images, and additions to the scripts that capture and compare the running screens. It builds on storefront `main`.
- **Backend records pull request:** this work item, then the verification record, the published evidence, the image review list and LIQ-009's storefront column. It builds on `main`, merges after #19 and the pull request that records the lanes, and is brought up to date after each.
- **Running screens:** the storefront built for production at its `main`, against the backend's browser-test server at `main`, in this lane's own checkout, so its database is its own. Spree's sample catalog is loaded into that database with Spree's own `spree:load_sample_data` task, which fetches its pictures over the network; this is not first-run setup's sample data option, which is G-36's, in part 2. A second market, a wholesale channel, a policy with no content and a customer are added through Spree's Admin and Store APIs. If the sample catalog cannot load, an invented catalog is added through the Admin API instead, and the record says so.
- **Captures:** in the storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels, with the fonts served offline, as the accounts batch did.

**Size, estimated from the accounts batch:** about 70 stories and 140 reference images (about 2 MB), and about 60 running-screen captures (about 4 MB).

## 5. Acceptance criteria

The accounts batch's criteria, applied to part 1.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record |
| 2 | Every component part 1's screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | The image review list |
| 3 | Every screen and overlay is captured on the running storefront in each state in §2.2, at both widths | The evidence index |
| 4 | Each variant in §2.3 is captured, showing what the interface does for it | The captures |
| 5 | FL-05's first step is mapped to the browser tests that cover it, and their result at the part's revision is recorded, in CI where the end-to-end job runs them | The flow map |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | The comparison record |
| 7 | A state no running screen shows is a gap, with the check made instead; a state reached in the browser says so | The gaps section |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | The CI runs |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | The pull requests' file lists |
| 10 | The records are updated, with every link checked | The record and the link check |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | The owner's review |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for the endpoints part 1's screens read (products, categories, markets, countries, policies and the store), run at the part's revision. What no spec exercises is NOT_RUN | The spec run |
| 13 | Tenant isolation is NOT_RUN. None of the open findings ISO-1 to ISO-7 is about these screens; whether one store's catalog, markets or policies can show on another store's storefront is FB-03's. A new isolation defect is reported to the owner privately | The isolation section |

## 6. FL-05's first step

| Step | Browser tests |
|---|---|
| SF-SHOP-01: open the home page and a featured product | `catalog.spec.ts`: "shows featured products that open their product page" |
| SF-OVL-01: open a category from the header's menu | "the header menu opens a category" |
| SF-OVL-03: search, and open a suggestion or the results page | None |
| SF-SHOP-02 to SF-SHOP-04, and the rest of FL-05 | Part 2, and batch 9 for the cart and checkout |

## 7. Questions for the owner

1. **Do the product card's stories belong in part 1 or part 2?** The home page's featured products are the first screen that shows the product card and its carousel. The accounts batch made the address editor's stories where a screen first used them, and checkout reuses them. Recommended: part 1, with the states the card has (a sale price, sold out, a hidden price, no picture), so part 2 reuses them. It also evens the two parts: about 18 components in part 1 and about 25 in part 2, rather than 13 and 30. The alternative is part 2, with the product lists; part 1's home captures would still show the cards.
2. **Is the storefront captured with wholesale on as well as off?** The home page's wholesale section and the wholesale links in the header, menu and footer appear only when the storefront runs with a wholesale channel, and LIQ-008 lists them as meaningful states. Recommended: yes, by running the storefront a second time with a wholesale channel made through the Admin API; the portal's own pages stay with batch 12.
3. **Does part 1 take the part of G-02 its screens show?** G-02, from the pilot, keeps 35 stories checked against their source only and the cart drawer opened only with a pointer, deferred to batches 4 and 9. Recommended: yes for what part 1's screens show: the hero section and the pilot's button compared where they appear, and the cart drawer opened from the header's cart button with the keyboard. The drawer's own states stay with batch 9. G-02 closes only on the owner's acceptance.

**The owner's answers, 2026-10-26.** The owner approved this work item with all three recommended answers:
1. The product card's stories belong in part 1, with the states the card has.
2. The storefront is captured with wholesale on as well as off.
3. Part 1 takes the part of G-02 its screens show: the hero section and the pilot's button compared where they appear, and the cart drawer opened from the header's cart button with the keyboard.

## 8. Gaps known before the work starts

| Gap | What would close it |
|---|---|
| The search overlay and the region and language dialog have no browser test; their behaviour is shown by captures and the storefront's unit tests | A browser test for each, which the batch does not add |
| Loading states streamed by the server, such as the featured products' skeleton, may show too briefly to capture | A capture if one can be made; otherwise the story, checked against its source |
| The application error page appears only when a page fails to render; whether it can be reached without changing code is found during the part | A capture of a page failing, or the story alone |
| Settings saved in the dashboard taking effect on the storefront | G-38's storefront checks, in part 2, after batch 3 is accepted and #19 merges |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. Data added for the captures goes only to this lane's browser-test database.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Part 1's verification record in `liquorify/verification/`, with the published evidence.

## 10. Part 2

Described in full here, in part 2's own records pull request, before its work starts, as §1 said. It is built on part 1's stories and follows the same rules as part 1 (§2 to §9) where this section says nothing else. Batch 3's prerequisite is met: the owner accepted batch 3 on 2026-10-26 and #19 merged the same day.

### 10.1 Capabilities, screens, flows and tests

| Capability ([LIQ-006](../LIQ-006-product-capability-baseline.md)) | Screens ([LIQ-008](../LIQ-008-spree-screen-inventory.md)) | Flow | Browser tests |
|---|---|---|---|
| CAP-05-14 Product search and filters, the rest of it: the results page, its filters and sorting | SF-SHOP-02 | FL-05, the browsing step | `e2e/catalog.spec.ts`: "sorts products by name"; no test searches or filters |
| CAP-05-04 Categories and collections, the shopper's category page only | SF-SHOP-03 | FL-05, the browsing step | `catalog.spec.ts`: "lists the category's products with a count and breadcrumb", "a subcategory narrows the listing", "a product card opens its product page" |
| CAP-05-01 Products, variants and options, the shopper's product page only | SF-SHOP-04 | FL-05, choosing a product; FL-04's last step | `e2e/product.spec.ts`: its five tests |
| CAP-05-16 Search-friendly addresses for products, categories and stores | SF-SHOP-03, SF-SHOP-04 | None | None; Spree's slug specs |
| CAP-03-03 Store provisioning, setup with sample data (G-36) | DA-SETUP-01, then SF-SHOP-01 to SF-SHOP-04 | FL-01 | Batch 3's first-run setup script, run with sample data |
| CAP-03-07, CAP-03-08, CAP-03-09, CAP-03-10, and CAP-09-04 for the store's storefront access, where a setting saved in the dashboard takes effect on the storefront (G-38's storefront part) | DA-SET-02, DA-SET-06, DA-SET-09, DA-SET-11, then the storefront screens they change | None | Spree's dashboard tests for saving each setting; none crosses to the storefront |

The storefront's own unit tests for these components run with the part and are recorded, among them `ProductDetails.test.tsx` and the tests in `components/products/__tests__/`.

The staff side of CAP-05-01 and CAP-05-04, and FL-04's steps in the dashboard, are batch 5's, catalog and pricing; FL-04's last step, the product page, is mapped to SF-SHOP-04 here. CAP-09-04's channels and the wholesale portal are batch 12's; part 2 covers only the store-wide setting on the storefront.

### 10.2 Meaningful states to capture

From LIQ-008 and from what the components render at storefront `321fa1c`, at 390 and 1280 pixels.

| Screen | States |
|---|---|
| SF-SHOP-02 Products and search | All products, the first page with the filter bar; loading; each filter's dropdown open (an option, price, availability) and the sort dropdown; filters applied, with their chips and "Clear all"; the filters drawer on a narrow screen, empty and with choices; no products found for the filters; search results for a word; no products matching a word; loading more; the end of the list; the filter bar missing when its request fails |
| SF-SHOP-03 Category | A category with its picture, description, subcategories and breadcrumb; a category without a picture; a subcategory, with its parent in the breadcrumb; the category's products filtered and sorted, as SF-SHOP-02; not found |
| SF-SHOP-04 Product | Several pictures with thumbnails; the picture enlarged, with previous and next; no picture; colour and size chosen; a sold-out choice, which can be picked but not added; a sale price; custom fields; a quantity chosen; adding to the cart; the price withheld by the store's storefront access; in a second market's currency and language; not found |

As in part 1, a state reached by holding, failing or answering a request in the browser or through the capture script's proxy says so in its note and claims nothing about the server. A state no running screen shows is a gap, with its story checked against its source.

### 10.3 Who sees what, and the settings that change it

- **A guest and a signed-in customer, wholesale off and on, and two markets:** as part 1 (§2.3). The listing and the product page are the same for a guest and a customer unless the store withholds prices; the captures show it.
- **The store's storefront access:** public, prices hidden and sign-in required. Each is set in the dashboard's store settings (DA-SET-02) and the storefront captured under it, as a guest and a customer, then set back to public.

### 10.4 Settings saved in the dashboard, seen on the storefront (G-38's storefront part)

Each setting is saved through the dashboard's own screen in a browser, the same screen batch 3 captured, against this lane's server. The storefront is then captured where the setting should show. Every setting is put back afterwards.

| Setting | Saved on | Seen on the storefront |
|---|---|---|
| A new market with its currency, countries and languages | DA-SET-11 | The region dialog offers it; lists and the product page show its currency |
| A language added to a market | DA-SET-11 | The region dialog offers it, and the storefront switches to it |
| The store's storefront access: prices hidden, then sign-in required | DA-SET-02 | What a guest and a customer see on the home page, the lists and the product page |
| A policy's content, and a new policy | DA-SET-06 | The policy page shows the content; the footer lists the new policy |
| A product custom field shown on the storefront, given a value on a product, and one that is not | DA-SET-09, then the product's page in the dashboard | The product page shows the first under its properties and not the second |

The rest of G-38, payment capture, order numbers, reasons, channels' routing and inventory, stays with batches 6, 7 and 8 and P4. G-38 closes only on the owner's acceptance.

### 10.5 First-run setup with sample data (G-36)

On a second browser-test server with its own empty database and no admin, as batch 3's first-run script needs, setup is run through the dashboard with the sample data option chosen. Batch 3's provisioning check then runs against the new store. A storefront built against that server, with the new store's publishable key, is captured on the home page, the menu, a product list and a product page, to show the sample catalog arrived. Spree's sample data fetches its pictures over the network. If it cannot load, the step is recorded as FAIL or BLOCKED with the reason. CAP-03-03 stays PARTIAL until the owner accepts the evidence.

### 10.6 Search-friendly addresses (CAP-05-16)

On the running storefront: a product opens at its address and at its address in the second language; a subcategory's address holds its parent's; after a product is renamed in the dashboard, its new address opens and its old one answers not found, which Spree's documentation describes. Spree's slug specs are run and listed. The store's own address name (`code`) has no storefront screen and is recorded from the specs alone.

### 10.7 Components

New stories, about 25 components ([LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) §5):

| Layer | Components |
|---|---|
| Primitives | `dropdown-menu` (CMP-SF-P-09), used by the filter and sort dropdowns; `quantity-picker` (CMP-SF-P-17), used by the product page's quantity |
| `cart/` (CMP-SF-G-03) | QuantityPickerField, as the product page uses it; the cart's own states stay with batch 9 |
| `products/` (CMP-SF-G-10) | ProductListing, ProductListingSkeleton, InfiniteProductList, ListingFilterBar, ProductGrid, ProductGridSkeleton, MediaGallery, MediaLightbox, VariantPicker, ProductCustomFields |
| `products/filters/` (CMP-SF-G-10) | FilterBar, FilterBarSkeleton, FilterDropdown, OptionDropdownContent, PriceDropdownContent, AvailabilityDropdownContent, SortDropdownContent, FilterChips, MobileFilterDrawer |
| `navigation/` (CMP-SF-G-07) | Breadcrumbs |
| Page level | CategoryBanner (CMP-SF-PG-03), ProductDetails (CMP-SF-PG-04) |

`ProductGrid` is used by no screen at `321fa1c`; its story says so rather than inventing a layout. `ListingAnalytics` (CMP-SF-G-10) and `JsonLd` (CMP-SF-G-12) draw nothing: the first sends analytics events and the second writes structured data for search engines. Both are named with that reason rather than given a story, and the structured data on the category and product pages is recorded from their source. Already covered and reused: part 1's product card, its skeleton and the hidden price prompt, the pilot's button and part 1's sheet.

### 10.8 Delivery

- **Storefront pull request:** built on part 1's storefront branch, and merged after it.
- **Backend records pull request:** this description, then part 2's verification record, evidence, image review list and LIQ-009's column. Built on part 1's records branch, and merged after it.
- **Running screens:** as part 1, on this lane's server and database, with Spree's sample catalog. Data the states need that the catalog lacks, such as a sold-out variant, a sale price or a custom field value, is added through the Admin API, or through the dashboard where §10.4 says so. The second server for §10.5 has its own database.
- **Size, estimated from part 1:** about 65 stories and 130 reference images, and about 80 running-screen captures.

### 10.9 Acceptance criteria

Part 1's criteria 1 to 13 (§5), applied to part 2's screens, components and flow steps, with criterion 12's specs being Spree's Store API specs for products, filters, categories, custom fields and the store. And:

| # | Criterion | Evidence |
|---|---|---|
| 14 | Each setting in §10.4 is saved through its dashboard screen and seen, or not, on the storefront, with the result recorded per setting; a difference from what the dashboard says is recorded as Spree's behaviour, not changed | Captures of both sides, and the record |
| 15 | First-run setup with sample data runs on its own server; the provisioning check and the storefront captures show what the new store was given | The setup run, the check's report and the captures |
| 16 | Each address in §10.6 is checked on the running storefront, and Spree's slug specs pass | Captures and the spec run |

### 10.10 Gaps known before the work starts

| Gap | What would close it |
|---|---|
| No browser test searches or filters, and none checks a setting from the dashboard on the storefront | Browser tests the part does not add; the captures and the storefront's unit tests are recorded instead |
| Loading more and the listing's loading skeleton may show too briefly to capture | Holding the request, as part 1 did, said so in the note |
| The cart drawer that opens after adding to the cart | Batch 9; part 2 records only that it opens |
| Sample data fetched over the network may change or fail | The run records what it fetched and when |
| Tenant isolation | FB-03's validation and the fixes for ISO-1 to ISO-7 |

There are no questions for the owner: the scope, the variants and the checks that wait for batch 3 follow the answers already given.

## 11. Corrections found during part 1

Recorded on 2026-10-26 from part 1's [verification record](../verification/2026-10-26-fb-19-batch-storefront-shop-part-1.md#6-the-owners-answers-and-corrections-to-the-work-item), without changing the proposal's text above:
- **The data (§4).** The wholesale channel, a publishable key for it and the four policies, all without content, came with Spree's sample catalog. Part 1 added through the Admin API only a market in euros, the returns policy's content, two subcategories and, for the proxied runs, a market in pounds. The customer was registered by the capture run.
- **§8's gaps for the loading state and the error page close.** Both were reached without changing code, through a proxy in the capture script that held or failed the product list.
- **SF-SYS-01** has a second state, a malformed address, which is answered with a plain-text error rather than the application error page.
- **SF-SYS-02** "a language the storefront does not have in the address" is not a not-found page: the storefront sends it to `/us/en`, as it does an unknown country.
- **SF-SHOP-06** "not found" and **SF-SYS-02** "an unknown policy" are the same page, answered with status 200.
- **Widths.** The header's region control and wholesale link show only from 1024 pixels wide, and the menu's region control only below it, so those states are captured at one width each.
- **The menu's subcategory panel** needs categories two levels deep, which the sample catalog lacks.
- **`DocumentShell`** is recorded in LIQ-009 as U5.
- **Browser tests (§6).** The two cart tests ran beside the two catalog tests, because the header's cart button opens the drawer (question 3). One fails against Spree's sample catalog on a duplicate link name; it passed in CI.

## 12. Corrections found during part 2

Recorded on 2026-10-26 from part 2's [verification record](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md#10-corrections-to-the-work-item), without changing the proposal's text above:
- **The filter bar's stories (§10.7)** are titled "Product filters", after `ProductFilters.tsx`, the file that holds `FilterBar`, so the coverage report counts the file.
- **`ListingFilterBar` and `ListingAnalytics`** are rendered only inside `ProductListing`, whose stories render both, so LIQ-009 records them as U1. `ListingAnalytics` draws nothing.
- **`JsonLd`'s structured data** is written for products and categories only when the storefront is built with its site address. Lane A's builds have none, so it was recorded from a second build.
- **`ProductGrid`** is used by no screen, and is compared with the grid the infinite list draws with the same classes.
- **"No picture" (§10.2)** is shown by the browser tests' two-option product, which has no pictures, so its captures serve both states.
- **The data (§10.8).** Coffee Machines' picture and description were added through the Admin API, and the two-option product, with its sale price and sold-out size, through the storefront's own browser-test bootstrap script. The Spain market, two custom fields, a policy and a renamed product were saved through the dashboard, as §10.4 says.
- **Widths.** The filter dropdowns show only from 768 pixels wide and the filters drawer only below, so those states are captured at one width each.
- **The second market's address (§10.6).** The product opens at its German address, and its English address opens the same page in that market.
- **Setup with sample data (§10.5)** ran for a store in Polish złoty, as batch 3's first-run check sets up, and stopped at the sample data's wholesale step (SD-8).
- **More states** than §10.2 lists: the next page failing, a subcategory with no products, the cart drawer after adding, and the storefront access settings on the home page.
