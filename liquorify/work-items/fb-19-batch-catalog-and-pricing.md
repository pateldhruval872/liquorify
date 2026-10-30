---
title: FB-19 batch 5, catalog and pricing
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-30
updated: 2026-10-30
---

# FB-19 batch 5: catalog and pricing

The fourth backend batch organised by product area: the dashboard's side of [LIQ-006 §5](../LIQ-006-product-capability-baseline.md#5-catalog-and-pricing), where staff build and price what the store sells. It reproduces what Spree already has for products, variants and options, publishing, product types, the media library, categories and collections, catalogs, price lists, translations, imports and exports, promotions, gift cards and store credit. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED. It is batch 5 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), which depends on batch 3, setup, accepted and merged on 2026-10-26. On 2026-10-30 the owner asked for this proposal under the existing batch rules and the Spree-first scope. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 3](fb-19-batch-setup-stores-and-settings.md). The batch is too large for one review, so it comes in three parts, as LIQ-004 proposed. Part 1 is described in full in §2 to §9. Parts 2 and 3 are outlined in §10, and each is described in full in its own pull request before its work starts. This work item is reviewed in draft pull request [#33](https://github.com/pateldhruval872/liquorify/pull/33), and part 1's work starts once the owner answers the questions in §7.

**Reading of the instruction.** The owner's message of 2026-10-30 asked for the next batch's proposal: batch 5, catalog and pricing, following the existing batch rules and continuing the Spree-first scope. So this batch reproduces Spree's dashboard as it is at `main` `01a0365` and adds nothing of Liquorify's own. The storefront's side of §5, CAP-05-14, CAP-05-16 and CAP-05-17 and the shopper's side of CAP-05-01 and CAP-05-04, is batch 4's, accepted on 2026-10-29 and 2026-10-30; this batch maps those rows to batch 4's evidence and does not capture them again.

## 1. Outcome and summary

Every catalog, pricing and loyalty screen in the dashboard has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a step-by-step map of the flows it holds: FL-04, creating and publishing a product, in part 1; FL-21, importing from a CSV file, in part 2; and the dashboard's steps of FL-16 and FL-17, a promotion and a gift card, in part 3. The map links each capability to its evidence or to a named gap.

- **Bounded, in three parts:** the 24 screens and one overlay of §5 use 98 components that have no stories yet, about three times batch 3's 27. Part 1 holds 6 screens, FL-04 and 40 of those components (§2, §3); part 2 holds 13 screens and the import overlay and about 41; part 3 holds 5 screens and 15 (§10). The other 2 go to batch 13 (§2.3).
- **Same shape as batch 3:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function is recorded apart from coverage:** a capture shows one state of a screen, not that a flow works.

## 2. Part 1's scope: products

Part 1 covers the products themselves: the product list, a new product, the product page, the media library, options and product types, and FL-04.

| Capability (LIQ-006 §5) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-05-01 Products, variants and options, with bulk actions | DA-PRD-01, DA-PRD-02, DA-PRD-03, DA-PRD-05; the storefront's product page (SF-SHOP-04) is batch 4's | FL-04 | `products-list.spec.ts`, `products-bulk.spec.ts`, `products-new.spec.ts`, `products-edit.spec.ts`, `products-variants.spec.ts`, `products-prices-inventory.spec.ts`, `products-custom-fields.spec.ts`, `option-types.spec.ts`, `option-type-translations.spec.ts`; the option type filter in `list-filters.spec.ts` |
| CAP-05-02 Publishing per channel, with publication windows | The publishing card on DA-PRD-02 and DA-PRD-03; the channel filter and channel bulk actions on DA-PRD-01 | FL-04 | `products-publishing.spec.ts`; the two publishing card tests of `products-edit.spec.ts`; `channels.spec.ts` |
| CAP-05-03 Product types | DA-SET-20; the type chosen on DA-PRD-02 | None | `product-types.spec.ts`, `products-type-categories.spec.ts` |
| CAP-05-06 Media library | DA-PRD-04; the media card on DA-PRD-02 and DA-PRD-03 | FL-04 | `media-library.spec.ts`, `products-new-media.spec.ts`, `products-edit-media-variants.spec.ts`, `products-media-video.spec.ts` |
| CAP-05-07 Digital products and downloads, the product's files only | The digital files card on DA-PRD-02 and DA-PRD-03 | None | `digital-assets.spec.ts` |
| CAP-05-09 Prices in several currencies | The prices card and the bulk price editor on DA-PRD-02 and DA-PRD-03 | FL-04 | The currency tests of `products-prices-inventory.spec.ts` |
| CAP-05-11 Price history for the EU Omnibus rule | None: no screen shows it. P1's result stands, PASS for single price changes ([P1's record](../verification/2026-10-22-fb-19-platform-p1-checks.md)) | None | None |
| CAP-05-16 Search-friendly slugs, the product's own | The search engine card on DA-PRD-03; the storefront's addresses are batch 4's | None | None found |

The product page also shows parts that belong to other areas: stock per location and its history (batch 6), the tax category (batch 7), a product's translations (CAP-05-08, whose own page is part 2's), custom fields (batch 3's definitions) and the `product.form_sidebar` slot. Part 1 captures each as it renders on the product page and gives its components stories; the areas' own screens stay with their batches (§2.3).

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; the product list and the product page are also captured on a narrow screen.

| Screen | States |
|---|---|
| DA-PRD-01 Products | Listed, with draft, active and archived products and with stock in stock, on backorder and out of stock; no products; searched by name and by SKU, and finding nothing; each filter: status, price, category, channel, product type and tags; sorted by price; rows chosen, with the bulk action bar; each bulk action's dialog: set status, add to categories, add to collections, add to and remove from channels, add tags, and delete with its confirmation; the row actions duplicate and delete; the import and export buttons as they render (their wizard is part 2's); the list failing to load |
| DA-PRD-02 New product | The empty form; a product type chosen; a product with no options and one price; options chosen and variants built, with the bulk variants dialog and a variant's sheet; prices in two currencies; stock per location; media added before saving, uploading and removed; a video added, and a link that is not a video refused; the default channel ticked, a second channel added, the default unticked and a publication window; categories, tags and the tax category; custom fields; digital files; field errors; saving |
| DA-PRD-03 Product | Each status, draft, active and archived, and a scheduled publication; the description editor; variants and a variant's sheet; prices in several currencies with the bulk price editor, typed in an English and in a German admin's number format; stock per location and its history; media with its description and variants, the media sheet and a video with a poster image; digital files, with their download limits; the publishing card listing and unlisting a channel; categories and tags; the tax category with a variant's own; the search engine card with the product's address; the translations card and its dialog; custom fields; metadata; the `product.form_sidebar` slot; unsaved changes; saved; a save refused with its errors; the page failing to load |
| DA-PRD-04 Media library | Images and a video, used and unused; no files; uploading; describing a file for screen readers; where a file is used; deleting a file in use, with its warning |
| DA-PRD-05 Options | Listed, and filtered by kind; none; the create sheet with values, colours and images; values reordered by dragging; an option type and a value translated; edit; delete confirmation |
| DA-SET-20 Product types | Listed; none; the create sheet with default categories and a delivery profile; a type with no name refused; edit; delete confirmation |

### 2.2 Permission variants

The catalog has several permission scopes ([LIQ-008 §2](../LIQ-008-spree-screen-inventory.md#2-who-may-open-what)): `products` covers products, variants, options and prices; `publishing` covers which channels carry a product, and Spree's catalog says a staff role that manages them needs it beside write on `products`, although publishing is written through the products endpoint, so the key gates nothing of its own yet; `media` covers the library, while a product's own gallery needs only `products`; `product_types` and `stock` are their own. Four roles cover them:

- **Admin role:** every screen with every control.
- **A role made from the merchandiser template,** which holds write on products, categories, collections and stock and nothing on publishing, media or product types: the product screens with their controls, and what the publishing card, the media library entry and the product types entry show without those scopes, recorded as each screen shows them.
- **A custom role with read on `products`, `publishing`, `media`, `product_types` and `stock` and write on nothing:** the same screens, with create, edit and delete controls recorded as each screen shows them, since some screens keep controls the server then refuses, as batch 3 found.
- **A role made from the order manager template, which holds none of part 1's scopes:** the catalog entries hidden, and a direct visit to each screen recorded as it shows.

### 2.3 Left out, and where it goes

- **Part 2 (§10):** categories and collections (CAP-05-04), catalogs (CAP-05-05), translations (CAP-05-08's page, DA-PRD-06), price lists and price rules (CAP-05-10), and imports and exports (CAP-05-15) with the import wizard (DA-OVL-05), FL-21 and the two staff emails EM-S-05 and EM-S-06. `import-button`, `export-button`, `import-wizard-dialog` and `wizard` go there; part 1 captures the product list's import and export buttons as they render.
- **Part 3 (§10):** promotions (CAP-05-12) and gift cards and store credit (CAP-05-13).
- **A seller's product under review:** the review actions and the seller card on the product page (`product-review-actions`, `product-seller-card`) go to batch 13, the marketplace, where sellers and their submissions are set up, as §7's second question recommends. Part 1 captures the product page for the store's own products. The seller filter on the product list goes there too.
- **Stock:** the product page's stock per location and stock history are captured as they render; stock locations, transfers and receipts are batch 6's.
- **The tax category:** captured as it renders, with `products-tax-category.spec.ts`; tax categories and rates are batch 7's.
- **Digital downloads for a shopper:** the order's download links (DA-ORD-04) and the "digital files ready" email (EM-C-07) go to batch 8, with the orders that send them.
- **The storefront's side of §5:** batch 4's, accepted. FL-04's last step, the product on the storefront, is the subject of §7's third question.

## 3. Components

Part 1's screens use 40 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the screens import at `main` `01a0365`, followed through each file they import; the part's first step confirms it against the running screens.

| Layer | New in part 1 |
|---|---|
| Primitives (CMP-DUI-P) | `media-preview` (28), `rich-text-editor` (33) |
| Composed (CMP-DUI-C) | `bulk-dialog` (04), `bulk-price-table` (05), `bulk-variants-table` (06), `color-picker` (09), `data-grid/cells` (13), `data-grid/data-grid` (14), `data-grid/fill-handle` (15), `file-type-icon` (20), `form-section` (22), `metadata/metadata-card` (31), `products/status-card` (36), `resource-multi-autocomplete` (41), `tag-list` (50) |
| Framework (CMP-CORE) | `bulk-action-bar` (04), `file-upload-field` (10), `resource-multi-autocomplete` (24), `store-date-picker` (35), `tag-combobox` (38) |
| Product form modules (CMP-CORE-PF) | `add-video-dialog` (01), `bulk-variants-dialog` (02), `inventory-section` (03), `media-edit-sheet` (04), `product-bulk-price-editor` (05), `product-form-cards` (06), `variant-edit-sheet` (07), `variants-options-builder` (08), `variants-section` (09) |
| `custom-fields/` (CMP-DA-G-06) | `custom-fields-inline` |
| `products/` (CMP-DA-G-14) | `digital-asset-edit-sheet`, `digital-asset-provider-sheet`, `digital-assets-card`, `digital-files-form-card`, `product-custom-fields-provider`, `provider-settings-fields`, `publishing-card` |
| `translations/` (CMP-DA-G-23) | `resource-translations-card`, `resource-translations-dialog` |
| Admin dashboard (CMP-DA-G-24, top level) | `stock-history-card` |

`bulk-action-bar` and `store-date-picker` are the two batch 3 left for the first batch whose table has bulk actions or a date filter; the product list has both. `product-custom-fields-provider` draws nothing of its own, so its story shows what it does, a product's custom fields filled in, as `theme-provider`'s did in batch 3. `product-form-cards` holds the product page's nine cards (general, variants, prices, media, inventory, search engine, status, categories and tax), and each card gets its own stories.

**Already covered, reused here:** `resource-table`, `table-toolbar`, `page-header`, `can`, `slot`, `media-picker-sheet`, `image-upload-field`, `country-combobox`, `media-rich-text-editor`, `definition-form`, `resource-layout`, `resource-name-cell`, `row-actions`, `row-click-bridge`, `search-input`, `confirm-dialog`, `form-actions`, `drag-handle`, `back-button`, `json-preview-drawer`, `relative-time`, `route-error-boundary`, and the primitives from earlier batches, including `combobox`, `dialog`, `dropdown-menu`, `field`, `input-group`, `select`, `switch`, `card`, `badge`, `empty` and `thumbnail`.

## 4. Delivery

- **One backend pull request for part 1:** stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index, and LIQ-009's Storybook column. It builds on `main`.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batches 2 and 3 ran. Spree's sample catalog is loaded into that server's own database with Spree's sample data task, as lane A's shop batch did, so the lists show products with options, media and prices in US dollars. What a state needs beyond it, such as a second currency, an archived product, a scheduled publication, a product type, digital files and the roles in §2.2, is added through the Admin API on that database only. Spree's code, tests and fixtures are not changed.
- **Its own checkout and data:** the batch runs in its own checkout, with its own browser-test database and ports, so no other lane's data reaches it ([LIQ-004's lane rules](../LIQ-004-foundation-backlog.md#lanes-beside-batch-3-agreed-on-2026-10-26)).
- **The storefront, for FL-04's last step:** if the owner answers §7's third question as recommended, the storefront at `main` `8865498` is built against the same browser-test server, as lane A ran it, and opens the product part 1 created.
- **Emails:** none. Part 1's screens send no email.

**Size, estimated from batch 3:** about 220 stories and 440 reference images, and about 200 running-screen captures with their computed styles. Batch 3 came to 150 stories for 27 components and 122 captures; part 1 has 40 components, and the product page alone has nine cards.

## 5. Acceptance criteria

Batch 3's criteria applied to part 1, with one more for FL-04's storefront step. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scopes, meaningful states, components and browser tests, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-04 is mapped step by step to its screens, and the browser tests covering it pass on the part's revision; a step no test covers is recorded as a gap | Flow map with test titles and the CI run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | Recorded as for batch 3, until D5 decides how acceptance is recorded |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the part's endpoints, runs them at the part's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. For part 1: the Admin API controller specs for products and their variants, media and digital assets, variants, option types, product types, prices, the media library, tags, translations and stock levels; the integration specs for the same; Spree core's product, variant, option type, option value, product type, price, product publication, media and digital asset specs |
| 13 | Tenant isolation is NOT_RUN for the part, with links to the open isolation findings. None of ISO-1 to ISO-7 is about the catalog. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | No token, key or password appears in any committed file, checked by a search of the pull request's files before each push | The search's result in the record |
| 15 | If the owner answers §7's third question as recommended: a product created and published in the dashboard opens on the running storefront for its channel, and does not once it is unlisted from that channel | Storefront captures, with the product's state in the dashboard beside each |

## 6. Flow steps

### FL-04, create and publish a product

| Step | Browser tests |
|---|---|
| DA-PRD-02: create a product with no options and one price | `products-new.spec.ts`: "creates a no-options product with one price in one save"; `products-prices-inventory.spec.ts`: "sets and persists a price on a simple (no-options) product" |
| DA-PRD-02: create a product with options, variants, stock and prices in one save | `products-new.spec.ts`: "creates with options, SKUs, inline inventory, and prices in one save"; `products-prices-inventory.spec.ts`: "configures everything for a multi-variant product in one save" |
| DA-PRD-02: add media before saving | `products-new-media.spec.ts`: "uploads media pre-save and persists it through product creation", "removes a pending media item before save" |
| DA-PRD-02: choose its channels before saving | `products-publishing.spec.ts`: "new product seeds the default channel before save", "merchant can add a second channel before save", "merchant can untick the default channel and ship a no-channel product" |
| DA-PRD-03: edit its variants | `products-variants.spec.ts`: "builds variants from two option types and persists them", "removes a variant row and persists the deletion", "opens the per-variant edit sheet and edits SKU + weight" |
| DA-PRD-03: set prices in several currencies and stock per location | The other tests of `products-prices-inventory.spec.ts`, among them "sets prices in two currencies (USD period + EUR comma) in one save" |
| DA-PRD-03: add media and video | `products-edit-media-variants.spec.ts` (2 tests), `products-media-video.spec.ts` (3), and `media-library.spec.ts`: "a file added to a product from the library keeps its preview after saving" |
| DA-PRD-03: activate it, list it on channels and schedule it | `products-publishing.spec.ts`: "merchant can schedule a publication window via the inline editor", which sets the status to active; `products-edit.spec.ts`: "lists a product on an additional channel via the publishing card", "unlists a product from a channel via the publishing card" |
| SF-SHOP-04: the product on the storefront | None crosses from the dashboard to the storefront: criterion 15, or a gap (§7) |

The rest of part 1 is in no flow. Its browser tests: `products-list.spec.ts` (5 tests), `products-bulk.spec.ts` (6), `channels.spec.ts` (2), the other tests of `products-edit.spec.ts`, `products-custom-fields.spec.ts` (2), `products-tax-category.spec.ts` (1), `digital-assets.spec.ts` (1), `media-library.spec.ts` (the other 4), `option-types.spec.ts` (4), `option-type-translations.spec.ts` (1), `product-types.spec.ts` (4), `products-type-categories.spec.ts` (1), the product test of `validation-messages.spec.ts` and the option type filter of `list-filters.spec.ts`.

## 7. Questions for the owner

1. **Three parts, or four?** Part 1 has 40 new components, half again as many as batch 3, because the product page alone has nine cards and their sheets. Recommended: three parts, as §2 and §10 set out, with part 1 as one pull request. The alternative is four: part 1 split into the product list, options, product types and the media library first, then a new product and the product page with FL-04.
2. **A seller's product on the product page: now or with the marketplace?** The product page shows review actions and a seller card for a product a seller submitted. Showing them needs a seller with a submission, which Spree's seller sample data can give. Recommended: defer both components and their states to batch 13, the marketplace, where sellers are set up, so part 1 stays with the store's own products. The alternative is to load the seller sample data in part 1 and capture them now.
3. **FL-04's last step on the storefront?** No browser test follows a product from the dashboard to the storefront. Recommended: part 1 checks it, as batch 4 checked batch 3's settings: a product created and published in the dashboard opens on the running storefront for its channel, and does not once it is unlisted (criterion 15). The alternative is to record that step as a gap.

## 8. Gaps known before the work starts

Recorded now so none is lost. Part 1's record says which it closes.

| Gap | What would close it |
|---|---|
| FL-04's storefront step: no browser test crosses from the dashboard to the storefront | Criterion 15, if the owner answers §7's third question as recommended |
| A provider-backed digital file: the provider sheet opens only for a provider that declares settings, and the browser-test server may register none | Captured if one is registered; otherwise its story is checked against its source |
| States reached only by answering a request in the browser, such as the list failing to load and a save refused | Recorded as simulated interface-state coverage, as G-20, G-21, G-27 and G-43 were |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11 |
| A seller's product under review | Batch 13, if the owner answers §7's second question as recommended |
| First-run setup's sample data stops for a store that does not sell in US dollars (SD-8) | Not a gap of this batch: the browser-test store sells in US dollars, and SD-8 stays open in LIQ-004 |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change products, media, options and product types on the browser-test server, which is local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.

## 10. Parts 2 and 3, outlined

Each is described in full, with its states, permission variants, components, criteria and questions, in its own pull request before its work starts, as batch 4's part 2 was. Both follow part 1's acceptance, and use part 1's catalog data.

**Part 2: organising and pricing the catalog.** About 41 new components.

| Capability | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-05-04 Categories and collections, including rule-based collections | DA-PRD-07 to DA-PRD-12; the storefront's side is batch 4's | None | `categories.spec.ts` (4 tests), `collections.spec.ts` (7) |
| CAP-05-05 Catalogs | DA-PRD-13, DA-PRD-14 | None | `catalogs.spec.ts` (12) |
| CAP-05-08 Translations of catalog content | DA-PRD-06 | None | `products-translations.spec.ts` (5) |
| CAP-05-10 Price lists and price rules | DA-PRD-15 to DA-PRD-17 | None | `price-lists.spec.ts` (13) |
| CAP-05-15 Imports and exports as CSV | DA-OVL-05, DA-SET-31; the import and export buttons on the lists that have them; EM-S-05, EM-S-06 | FL-21 | `imports.spec.ts` (3) |

Its components include the category tree and list, the collection rules, the catalog wizard and its audience, terms and pricing parts, the price list form with its five rule editors, the bulk price editor, the product membership panels and the resource picker sheet, and the import wizard.

**Part 3: promotions, gift cards and store credit.** 15 new components: the promotion form and its eight rule editors, its two action editors and match policy picker, the calculator summary, and the two store credit dialogs.

| Capability | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-05-12 Promotions and coupon codes | DA-PRM-01 to DA-PRM-03 | FL-16, its dashboard step; its cart, checkout and order steps are batches 8 and 9's | `promotions.spec.ts` (21 tests) |
| CAP-05-13 Gift cards and store credit | DA-LOY-01, DA-LOY-02; the shopper's gift card list (SF-ACC-09) is the accounts batch's | FL-17, its dashboard step; redeeming at checkout is batch 9's | `gift-cards.spec.ts` (6), `store-credits.spec.ts` (5) |
