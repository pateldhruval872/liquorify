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

**Status.** PROPOSED. On 2026-10-26 the owner approved this batch as lane A beside batch 3, in two reviewable parts, under the existing Spree-first baseline rules ([LIQ-004](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), batch 4). It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch), as the [shopper accounts batch](fb-19-batch-storefront-shopper-accounts.md) did. This work item is reviewed in part 1's records pull request. Part 1 is described in full below; part 2 is outlined in §10 and described in full in its own records pull request before its work starts. The owner answered the questions in §7 on 2026-10-26, as recommended, and part 1 was built on those answers ([verification record](../verification/2026-10-26-fb-19-batch-storefront-shop-part-1.md)). What part 1 found that differs from this proposal is in §11. The owner accepted batch 3 on 2026-10-26 and #19 merged the same day, so part 2's checks that wait for batch 3 can now run. Part 1's records (#21) and stories (storefront #20) merged on 2026-10-27, recorded apart from acceptance at the owner's instruction; part 1's acceptance is pending ([merge record](../verification/2026-10-27-fb-19-batch-storefront-shop-part-1-merge.md)).

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

## 10. Part 2, outlined

Described in full in its own records pull request before its work starts, and built on part 1's stories.

- **Screens:** product lists and search results with their filters and sorting (SF-SHOP-02), categories (SF-SHOP-03) and the product page (SF-SHOP-04), with their meaningful states from LIQ-008.
- **Capabilities:** CAP-05-14, the rest of it; CAP-05-16, search-friendly addresses for products, categories and stores; the rest of FL-05's browsing steps, with `catalog.spec.ts` and `product.spec.ts`.
- **After batch 3 is accepted and #19 merges:** G-38's storefront checks, where a setting saved in the dashboard (markets, languages, storefront access, policies and custom fields) is seen to take effect on the storefront; and first-run setup with sample data (G-36), run on its own server, with the catalog it loads checked on the storefront. Until then CAP-03-03 stays PARTIAL for that path.
- **Delivery:** a storefront pull request and a backend records pull request, merged after part 1's.

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
