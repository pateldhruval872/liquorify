---
title: FB-19 batch 5, catalog and pricing
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-30
updated: 2026-11-04
---

# FB-19 batch 5: catalog and pricing

The fourth backend batch organised by product area: the dashboard's side of [LIQ-006 §5](../LIQ-006-product-capability-baseline.md#5-catalog-and-pricing), where staff build and price what the store sells. It reproduces what Spree already has for products, variants and options, publishing, product types, the media library, categories and collections, catalogs, price lists, translations, imports and exports, promotions, gift cards and store credit. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED. It is batch 5 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), which depends on batch 3, setup, accepted and merged on 2026-10-26. On 2026-10-30 the owner asked for this proposal under the existing batch rules and the Spree-first scope. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 3](fb-19-batch-setup-stores-and-settings.md). The batch is too large for one review, so it comes in three parts, as LIQ-004 proposed. Part 1 is described in full in §2 to §9, part 2 in §10 and part 3 in §12. This work item was proposed in draft pull request [#33](https://github.com/pateldhruval872/liquorify/pull/33). On 2026-11-02 the owner approved the three recommended answers in §7: three parts, with part 1 in one implementation pull request; sellers' submitted products, their review controls and the seller filter deferred to batch 13; and FL-04 checked on the running storefront against the same pinned backend (criterion 15). The owner kept the existing gap and defect decisions, and tenant isolation NOT_RUN. Part 1 is built in its own pull request, [#34](https://github.com/pateldhruval872/liquorify/pull/34), and the corrections its running screens found are in §11. On 2026-11-02 the owner accepted part 1's reference images, screen evidence and fidelity, within the documented limits, and answered its gaps G-53 to G-57, before its merge ([record §11](../verification/2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#11-the-owners-review-2026-11-02)). The owner merged #34 on 2026-11-03, recorded apart ([merge record](../verification/2026-11-03-fb-19-batch-catalog-and-pricing-part-1-merge.md)). Part 2's detailed proposal is §10, proposed in pull request [#36](https://github.com/pateldhruval872/liquorify/pull/36) on 2026-11-03 and aligned with the project's baseline completion audit, as the owner asked on 2026-11-02. On 2026-11-04 the owner answered its two questions as recommended, as decisions 2 and 3 of the owner decision brief: one implementation pull request, and the narrower roles' server refusals joining G-11, with the catalog's refusal checks consolidated after part 3, before Liquorify changes identity or access. The owner also strengthened FL-21's check to cover the imported products' saved values and representative exported rows (§10.9). Part 2 is built in its own pull request, [#42](https://github.com/pateldhruval872/liquorify/pull/42), on these answers, and the corrections its running screens found are in §13. Its reference images, screen evidence and fidelity were accepted on 2026-11-04 by delegated acceptance, under the owner's delegation of that day, not the owner's review, and #42 merged the same day ([merge record](../verification/2026-11-04-fb-19-batch-catalog-and-pricing-part-2-merge.md)). EM-S-05's link stays a baseline exception the owner accepted, tracked as SD-17, open. Part 3's detailed proposal is §12, proposed on 2026-11-04 in its own records pull request, [#43](https://github.com/pateldhruval872/liquorify/pull/43), under the owner's delegation of that day ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)). It has no question that needs the owner: its four choices are planning within this batch's approved scope, recorded as decided under the delegation (§12.9). #43 merged the same day under the delegation, once every required check passed. Its work starts after part 2's merge, when lane A frees, which it did on 2026-11-04. Part 3 was built in its own pull request, [#61](https://github.com/pateldhruval872/liquorify/pull/61), on 2026-11-04, and the corrections its running screens found are in §14. Its reference images, screen evidence and fidelity were accepted the same day by delegated acceptance, under the owner's delegation of that day, not the owner's review, and #61 merged the same day ([merge record](../verification/2026-11-04-fb-19-batch-catalog-and-pricing-part-3-merge.md)). With it, all three parts of the batch are merged.

**Reading of the instruction.** The owner's message of 2026-10-30 asked for the next batch's proposal: batch 5, catalog and pricing, following the existing batch rules and continuing the Spree-first scope. So this batch reproduces Spree's dashboard as it is at `main` `01a0365` and adds nothing of Liquorify's own. The storefront's side of §5, CAP-05-14, CAP-05-16 and CAP-05-17 and the shopper's side of CAP-05-01 and CAP-05-04, is batch 4's, accepted on 2026-10-29 and 2026-10-30; this batch maps those rows to batch 4's evidence and does not capture them again.

## 1. Outcome and summary

Every catalog, pricing and loyalty screen in the dashboard has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a step-by-step map of the flows it holds: FL-04, creating and publishing a product, in part 1; FL-21, importing from a CSV file, in part 2; and the dashboard's steps of FL-16 and FL-17, a promotion and a gift card, in part 3. The map links each capability to its evidence or to a named gap.

- **Bounded, in three parts:** the 24 screens and one overlay of §5 use 98 components that have no stories yet, about three times batch 3's 27. Part 1 holds 6 screens, FL-04 and 40 of those components (§2, §3); part 2 holds 13 screens and the import overlay and about 41 (§10); part 3 holds 5 screens and 15 (§12). The other 2 go to batch 13 (§2.3).
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
- **Part 3 (§12):** promotions (CAP-05-12) and gift cards and store credit (CAP-05-13), proposed in full on 2026-11-04.
- **A seller's product under review:** the review actions and the seller card on the product page (`product-review-actions`, `product-seller-card`) go to batch 13, the marketplace, where sellers and their submissions are set up, as the owner answered on 2026-11-02 (§7). The seller filter on the product list goes there too. Part 1 captures the product page and the product list for the store's own products.
- **Stock:** the product page's stock per location and stock history are captured as they render; stock locations, transfers and receipts are batch 6's.
- **The tax category:** captured as it renders, with `products-tax-category.spec.ts`; tax categories and rates are batch 7's.
- **Digital downloads for a shopper:** the order's download links (DA-ORD-04) and the "digital files ready" email (EM-C-07) go to batch 8, with the orders that send them.
- **The storefront's side of §5:** batch 4's, accepted. FL-04's last step, the product on the storefront, is checked on the running storefront, as the owner answered (§7, criterion 15); the storefront's own screens are not captured again.

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
- **The storefront, for FL-04's last step:** as the owner answered (§7), the storefront at `main` `8865498` is built against the same pinned browser-test server, as lane A ran it. The product is created and published through the dashboard, opened on the storefront for its channel, then unlisted from that channel and requested again (criterion 15).
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
| 15 | FL-04 on the running storefront, against the same pinned backend, as the owner answered (§7): a product created and published through the dashboard opens on the storefront for its channel; once it is unlisted from that channel, the storefront gives the expected unavailable response. A server error fails the check. Any caching or propagation limit, such as how long the storefront keeps showing the product after it is unlisted, is recorded | Storefront captures and each response's status, with the product's state in the dashboard beside each |

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
| SF-SHOP-04: the product on the storefront for its channel, and unavailable once unlisted | None crosses from the dashboard to the storefront: checked on the running storefront instead, as the owner answered (criterion 15) |

The rest of part 1 is in no flow. Its browser tests: `products-list.spec.ts` (5 tests), `products-bulk.spec.ts` (6), `channels.spec.ts` (2), the other tests of `products-edit.spec.ts`, `products-custom-fields.spec.ts` (2), `products-tax-category.spec.ts` (1), `digital-assets.spec.ts` (1), `media-library.spec.ts` (the other 4), `option-types.spec.ts` (4), `option-type-translations.spec.ts` (1), `product-types.spec.ts` (4), `products-type-categories.spec.ts` (1), the product test of `validation-messages.spec.ts` and the option type filter of `list-filters.spec.ts`.

## 7. Questions for the owner, and the owner's answers

1. **Three parts, or four?** Part 1 has 40 new components, half again as many as batch 3, because the product page alone has nine cards and their sheets. Recommended: three parts, as §2 and §10 set out, with part 1 as one pull request. The alternative is four: part 1 split into the product list, options, product types and the media library first, then a new product and the product page with FL-04.
   *The owner's answer, 2026-11-02:* three parts, with part 1 in one implementation pull request.
2. **A seller's product on the product page: now or with the marketplace?** The product page shows review actions and a seller card for a product a seller submitted. Showing them needs a seller with a submission, which Spree's seller sample data can give. Recommended: defer both components and their states to batch 13, the marketplace, where sellers are set up, so part 1 stays with the store's own products. The alternative is to load the seller sample data in part 1 and capture them now.
   *The owner's answer, 2026-11-02:* sellers' submitted products, their review controls and the seller filter are deferred to batch 13, the marketplace.
3. **FL-04's last step on the storefront?** No browser test follows a product from the dashboard to the storefront. Recommended: part 1 checks it, as batch 4 checked batch 3's settings: a product created and published in the dashboard opens on the running storefront for its channel, and does not once it is unlisted (criterion 15). The alternative is to record that step as a gap.
   *The owner's answer, 2026-11-02:* FL-04 is verified on the running storefront against the same pinned backend: the product is created and published through the dashboard, verified on its channel, then unlisted, and the expected unavailable response verified. A server error must fail the check. Any caching or propagation limitation is recorded.

The owner also asked for parts 2 and 3 to have their detailed proposals before their implementation, for the existing gap and defect decisions to be kept, and for tenant isolation to stay NOT_RUN.

## 8. Gaps known before the work starts

Recorded now so none is lost. Part 1's record says which it closes.

| Gap | What would close it |
|---|---|
| FL-04's storefront step: no browser test crosses from the dashboard to the storefront | Criterion 15, as the owner answered (§7); the check is made on the running storefront, so it is recorded apart from the browser tests |
| A provider-backed digital file: the provider sheet opens only for a provider that declares settings, and the browser-test server may register none | Captured if one is registered; otherwise its story is checked against its source |
| States reached only by answering a request in the browser, such as the list failing to load and a save refused | Recorded as simulated interface-state coverage, as G-20, G-21, G-27 and G-43 were |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11 |
| A seller's product under review, its review controls and the seller filter | Batch 13, as the owner answered (§7) |
| First-run setup's sample data stops for a store that does not sell in US dollars (SD-8) | Not a gap of this batch: the browser-test store sells in US dollars, and SD-8 stays open in LIQ-004 |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change products, media, options and product types on the browser-test server, which is local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.

## 10. Part 2: organising and pricing the catalog

Part 2 covers how staff organise and price what part 1 created: categories and collections, catalogs, the translations page, price lists and their rules, and imports and exports as CSV, with FL-21 and the two staff emails EM-S-05 and EM-S-06. It reproduces Spree's dashboard as `main` has it at `5794da6`, whose dashboard packages and SDKs are unchanged since `01a0365`, the revision part 1 pinned; `main` has changed only Spree's address and gift card models since, neither of which part 2's screens show. It builds on part 1's acceptance and merge (§11), uses part 1's catalog data, and follows the same batch rules. It was proposed on 2026-11-03, aligned with the project's baseline completion audit of 2026-11-02: part 2 is the next step on the dashboard's critical path, which runs through batch 5 to batches 6, 8, 10 and 12, and it stays in lane A, with its own checkout and data.

### 10.1 Capabilities, screens, flows and tests

| Capability (LIQ-006 §5) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-05-04 Categories and collections, including rule-based collections | DA-PRD-07 to DA-PRD-12; the storefront's side, SF-SHOP-03, is batch 4's | None | `categories.spec.ts` (4 tests), `collections.spec.ts` (7); a category's custom field in `custom-field-definitions.spec.ts` (1); the product list's category filter and adding to categories in bulk, part 1's, in `products-list.spec.ts` and `products-bulk.spec.ts` |
| CAP-05-05 Catalogs | DA-PRD-13, DA-PRD-14 | None | `catalogs.spec.ts` (12); the catalog wizard's blank name in `validation-messages.spec.ts` (1) |
| CAP-05-08 Translations of catalog content | DA-PRD-06; the translations card and dialog on the product page and an option type are part 1's | None | `products-translations.spec.ts` (5) |
| CAP-05-10 Price lists and price rules | DA-PRD-15 to DA-PRD-17; the bulk price editor on the product page is part 1's | None | `price-lists.spec.ts` (14) |
| CAP-05-15 Imports and exports as CSV | DA-OVL-05, DA-SET-31; the import and export buttons on the product list, the translations page, a catalog and a price list; EM-S-05, EM-S-06 | FL-21 | `imports.spec.ts` (3); the price list's import and export in `price-lists.spec.ts` (1) |

CAP-05-11, price history, keeps P1's result, as in part 1. With part 2, every capability of §5 but part 3's CAP-05-12 and CAP-05-13 has a map, some only in part, such as CAP-05-07, whose shopper downloads are batch 8's.

### 10.2 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; the category list, a collection and a price list are also captured on a narrow screen.

| Screen | States |
|---|---|
| DA-PRD-06 Translations | Coverage per language, with records fully, partly and not translated; no other language configured; each kind of record: products, categories, collections and option types; searched, and finding nothing; the translate dialog opened from a row, with a rich text description; the import and export buttons, and the import wizard for translations; the coverage failing to load |
| DA-PRD-07 Categories | The tree, expanded and collapsed; the list view; searched, and finding nothing; no categories; a top-level category moved by dragging; the delete confirmation; the list failing to load |
| DA-PRD-08 New category | The empty form; a parent chosen; an image added; products added before saving, with the resource picker; a category with no name refused |
| DA-PRD-09 Category | Edited, with its image and description; its products, added and removed, staged until Save with the removal restorable in one click, and reordered by dragging, which takes effect at once; custom fields; unsaved changes; saved; a save refused with its errors; the `category.form_sidebar` slot, as it renders; the page failing to load |
| DA-PRD-10 Collections | Listed, manual and automatic; filtered by kind; searched, and finding nothing; none; the delete confirmation |
| DA-PRD-11 New collection | The empty form; manual, with products added before saving; automatic, with rules of each kind Spree registers and the match policy; a collection with no name refused |
| DA-PRD-12 Collection | A manual collection: its name, image and default sorting, products added and removed, and several chosen for removal on Save, discardable until then; an automatic collection: its rules edited and its membership read-only; switching a manual collection to rules, which hides the curation before saving; unsaved changes; saved; the `collection.form_sidebar` slot, as it renders |
| DA-PRD-13 Catalogs | Listed, active and inactive, with each pricing mode; searched; none; the wizard's five steps, details, audience, products, pricing and review, with a step that needs fixing, no audience and no products warned of, and a blank name refused; closing an untouched wizard, and the confirmation before a part-filled one is discarded; the delete confirmation |
| DA-PRD-14 Catalog | Its settings, with the activate and deactivate confirmations; its audience of companies and customer groups, one added and one withdrawn with its undo; its terms, the minimum and multiple per product and the order minimums per currency, with their errors; its products, staged until Save, with the picker paging and choosing all matching results; its pricing, in each mode: normal prices, a percentage off base prices with its quantity tiers, and prices entered for the catalog, with the price columns and the bulk price editor; the import and export of its prices; staged changes; saved; the `catalog.form_sidebar` slot, as it renders; the page failing to load |
| DA-PRD-15 Price lists | Listed, in each status: draft, active, inactive and scheduled; searched, and finding nothing; none; the delete confirmation |
| DA-PRD-16 New price list | The empty form; its schedule; the rule type picker, without the superseded audience rules; a rule of each kind the picker offers: volume, market and channel, in its sheet; a price list with no name refused |
| DA-PRD-17 Price list | Its rules, edited and one removed; a customer rule and a customer group rule, which Spree no longer offers for new price lists but keeps for existing ones, as they render; its products, paged without saving; its prices in the spreadsheet, with a quantity break added; the bulk editor in two currencies; the import and export of its prices; unsaved changes; saved; the `price_list.form_sidebar` slot, as it renders |
| DA-OVL-05 Import wizard | Upload; a semicolon-separated file; mapping, with required fields not yet mapped and starting blocked; progress; results, with rows that failed and why; opened from the product list, the translations page, a catalog and a price list |
| DA-SET-31 Imports | Imports in each status Spree has: pending, mapping, mapping completed, processing, completed and failed; an import's results; downloading the original file; the delete confirmation; none |
| EM-S-05, EM-S-06 | Each rendered from Spree's own mailer preview, as the staff access batch rendered its emails, and each read as sent during the run (§10.6, criterion 15) |

### 10.3 Permission variants

Part 2's screens use three of the catalog's scopes ([LIQ-008 §2](../LIQ-008-spree-screen-inventory.md#2-who-may-open-what)): `categories`; `collections`; and `products`, which covers catalogs, their products and audiences, price lists, price rules, prices and imports. A record's translations need the scope of the record they translate, so a category's need `categories`. Spree gates importing products, their translations or a price list's prices on write on `products`, and exporting them on read. Four roles, as in part 1:

- **Admin role:** every screen with every control.
- **A role made from the merchandiser template,** which holds write on products, categories, collections and stock: every part 2 screen with its controls, recorded as each shows them.
- **The catalog viewer, part 1's custom role with read on its five scopes, given read on `categories` and `collections` too, and write on nothing:** the same screens, with create, edit, delete, import and reorder controls recorded as each screen shows them. Part 1 found that some screens keep controls the server then refuses, and that a teammate who cannot read a related record sees it by its id or not at all (its record's B14 to B17), so each is recorded, not assumed.
- **A role made from the order manager template, which holds none of these scopes:** the catalog entries hidden, and a direct visit to each screen recorded as it shows.

What the server refuses to the narrower roles is recorded from Spree's own specs (criterion 12); what no spec sends joins G-11, as G-56 did, as the owner answered on 2026-11-04 ([§10.9](#109-questions-for-the-owner-and-the-owners-answers)).

### 10.4 Left out, and where it goes

- **Part 3 (§12):** promotions, gift cards and store credit. The promotion editors' `editor-shell` gets its stories here, because the price list's rule sheets use it; the promotion's own editors stay with part 3.
- **Imports of customers and purchase orders:** the wizard is the same, and part 2 gives it its stories and captures it for products, translations, catalogs and price lists. Opening it from the customer list and the purchase orders list, and what those imports write, stay with batch 10, customers, and batch 6, inventory.
- **Reports' exports and FL-22:** EM-S-05 also announces a finished report export. The reports and FL-22 stay with batch 11; part 2 reads EM-S-05 for a product export.
- **A seller's imports:** the imports list's seller column and a seller's own imports are batch 13's, the marketplace, as part 1 left sellers' products there. Part 2 captures the store's own imports.
- **Companies and customer groups:** their own screens are batch 10's and, for wholesale, batch 12's. Part 2 uses the ones Spree's sample data creates, an "Acme Industrial" company with its division and the wholesale customer group, as a catalog's and a price rule's audience, and captures them only as those screens show them.
- **The storefront's side:** categories and collections on the storefront are batch 4's, accepted; a catalog's or a price list's prices for a signed-in buyer on the storefront are batch 12's, wholesale, with FL-10; translated content on the storefront follows the language decision in LIQ-006 §5.

### 10.5 Components

Part 2's screens use 41 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet, found as part 1's were: from what the screens import on `main`, followed through each file they import, after part 1's 40. The part's first step confirms the list against the running screens.

| Layer | New in part 2 |
|---|---|
| Composed (CMP-DUI-C) | `product-membership-list` (35), `quantity-tier-editor` (37), `resource-combobox` (39), `wizard` (54) |
| Framework (CMP-CORE) | `export-button` (09), `import-button` (12), `import-wizard-dialog` (13), `market-combobox` (15), `money` (18), `resource-picker-sheet` (25), `section-heading` (28) |
| `bulk-price-editor/` (CMP-DA-G-02) | `bulk-price-editor`, `bulk-price-editor-dialog` |
| `categories/` (CMP-DA-G-03) | `category-form`, `category-list`, `category-products-card`, `category-tree` |
| `collections/` (CMP-DA-G-04) | `collection-form`, `collection-products-card`, `collection-rules-card` |
| `imports/` (CMP-DA-G-09) | `import-wizard-dialog` |
| `price-list-editors/` (CMP-DA-G-13) | `price-list-form`, `rule-channel`, `rule-customer`, `rule-customer-group`, `rule-market`, `rule-volume`, `status-badge` |
| `promotion-editors/` (CMP-DA-G-15) | `editor-shell` |
| Admin dashboard (CMP-DA-G-24, top level) | `catalog-audience`, `catalog-price-columns`, `catalog-pricing-fields`, `catalog-terms-card`, `catalog-wizard-dialog`, `company-combobox-option`, `deferred-product-membership-card`, `price-list-csv-buttons`, `product-membership-staging`, `resource-image-field`, `route-pending`, `type-picker-sheet` |

`product-membership-staging` draws nothing of its own, so its story shows what it does, products staged for adding and removal on a category, as `product-custom-fields-provider`'s did in part 1. `route-pending` is the catalog page's loading state.

**Already covered, reused here:** 67 components with stories from earlier batches and part 1, among them `resource-table`, `table-toolbar`, `bulk-action-bar`, `store-date-picker`, `page-header`, `can`, `slot`, `confirm-dialog`, `form-actions`, `drag-handle`, `media-picker-sheet`, `image-upload-field`, `file-upload-field`, `currency-select`, `country-combobox`, the data grid with its cells and fill handle, `bulk-price-table`, `resource-multi-autocomplete`, the translations card and dialog, `custom-fields-inline`, `metadata-card`, `rich-text-editor`, and the primitives.

### 10.6 Delivery

- **One backend pull request for part 2,** as the owner answered on 2026-11-04 ([§10.9](#109-questions-for-the-owner-and-the-owners-answers)): stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index and LIQ-009's Storybook column. It builds on `main`.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as part 1 ran it, with Spree's sample catalog loaded into that server's own database. Spree's sample data already gives what most states need: categories, the "New Arrivals" and "On Sale" collections, product translations, a wholesale customer group, a "Wholesale" price list, two companies and the "Wholesale Assortment" catalog. What a state needs beyond it, such as a price list in each status, an automatic collection, an import in each status, a second language and the roles in §10.3, is added through the Admin API on that database only. A customer rule and a customer group rule are added the same way if Spree's API accepts them for an existing price list; if it does not, their stories are checked against their source and the record says so. Spree's code, tests and fixtures are not changed.
- **Its own checkout and data,** under LIQ-004's lane rules, as part 1 ran.
- **FL-21 and the emails on the running server (criterion 15):** a product CSV is imported through the wizard from the product list, and each imported product is read back through the Admin API and its saved values compared with the file's. The import's email, EM-S-06, is read from the folder the browser-test server writes its mail to, the method P1 established ([P1's mail record](../verification/2026-10-22-fb-19-platform-p1-mail.md)), and its link followed to DA-SET-31. An export is started from the product list, EM-S-05 is read the same way, and its download link is fetched: the file's header and row count are checked, and representative rows are compared with the products they describe, read through the Admin API. Nothing is sent outside the machine.
- **Emails rendered:** EM-S-05 and EM-S-06 from Spree's own mailer previews, as the staff access batch rendered its emails, at 1280 pixels.

**Size, estimated from part 1:** about 230 stories and 460 reference images, and about 170 running-screen captures with their computed styles. Part 1 came to 254 stories for 40 components and 140 captures for six screens; part 2 has 41 components and fourteen screens and overlays, most of them simpler than the product page.

### 10.7 Acceptance criteria

Part 1's criteria 1 to 14 apply to part 2, with its own screens, components, roles and flow: FL-21 in criterion 5 and the screens of §10.2 in criterion 3. Criterion 12 runs Spree's own specs for part 2's endpoints and models: the Admin API controller and integration specs for categories, collections and collection rules, catalogs and catalog assignments, price lists and prices, imports and import rows, exports, translations and translation coverage; and Spree core's category, collection, collection rule, catalog, catalog order minimum and quantity rule, price list, price rule, import, import mapping, import row, export and translation specs. Two criteria change:

| # | Criterion | Evidence |
|---|---|---|
| 15 | FL-21 on the running server, strengthened by the owner on 2026-11-04. A product CSV imported through the wizard from the product list reaches its results, and each product it imported, read back through the Admin API, holds the file's value in every field the file maps; a value missing or different fails the check. EM-S-06 is read as sent and its link opens DA-SET-31 showing the import. An export started from the product list sends EM-S-05, whose link downloads a CSV whose header is Spree's product format and whose rows cover the store's products. Representative rows hold the values their products have on the server: at least a product without options, a product with variants, with its variants' rows, and a product the same run imported. A server error fails the check. Any delay, such as the time the background job takes, is recorded | The captures; the emails as read; each imported product's saved values beside the file's; the export's header and row count, and its representative rows beside their products' values; and each response's status |
| 16 | EM-S-05 and EM-S-06 are rendered from Spree's previews, and the rendering is linked from the record | The rendered emails |

### 10.8 FL-21 step by step

| Step | Browser tests |
|---|---|
| DA-PRD-01: open the import wizard from the product list | `imports.spec.ts`: "imports products through the upload → mapping → progress → results wizard" |
| DA-OVL-05: upload a CSV file, including a semicolon-separated one | The same test; "imports a semicolon-separated file" |
| DA-OVL-05: map its columns; starting is blocked until the required fields are mapped | "blocks starting until required fields are mapped" |
| DA-OVL-05: follow its progress and see its results | "imports products through the upload → mapping → progress → results wizard" |
| The imported products, saved with the file's values | None: Spree's test checks the wizard's results; each product is read back through the Admin API and compared with the file instead (criterion 15) |
| EM-S-06: the import's email | None: read from the server's mail folder instead (criterion 15) |
| DA-SET-31: the import in the imports history | None found: captured, and opened from the email's link instead (criterion 15) |

Part 2's other browser tests are in no flow: `categories.spec.ts`, `collections.spec.ts`, `catalogs.spec.ts`, `products-translations.spec.ts`, `price-lists.spec.ts`, the category test of `custom-field-definitions.spec.ts` and the catalog wizard's test of `validation-messages.spec.ts`.

### 10.9 Questions for the owner, and the owner's answers

1. **One pull request, or two?** Part 2 has fourteen screens and overlays and 41 new components, about part 1's size in components with more, simpler screens. Recommended: one implementation pull request, as part 1 was. The alternative is two, built one after the other: categories, collections, translations and imports with FL-21 first, then catalogs and price lists. The shared membership and picker components would then land in the first.
   *The owner's answer, 2026-11-04 (decision 2 of the owner decision brief):* one implementation pull request.
2. **Server refusals for the narrower roles: join G-11, or check them now?** Spree's specs exercise some of part 2's refusals; the rest would join G-11 beside G-45, G-50 and G-56, which the owner kept open for the catalog. Recommended: record what the specs exercise and add the rest to G-11, and check the catalog's refusals once, for parts 1 to 3 together, in a platform step like P7 after part 3, so one run covers the whole catalog. The alternative is a P7-style check of part 2's own requests within part 2.
   *The owner's answer, 2026-11-04 (decision 3):* the refusals join G-11, and the catalog's refusal checks, for parts 1 to 3, are consolidated after part 3 under G-11, before Liquorify changes identity or access.

The owner also strengthened FL-21: it verifies the imported products' saved field values and representative exported rows' values, alongside the export's header and row count (criterion 15 in §10.7, and §10.8). Part 2's work starts on these answers. The owner kept the existing acceptance, gap and defect decisions as they are, and tenant isolation stays NOT_RUN for part 2: FB-03's validation is separate, and part 2 claims nothing about it.

### 10.10 Gaps known before the work starts

| Gap | What would close it |
|---|---|
| States reached only by answering a request in the browser, such as a list or the coverage failing to load and a save refused | Recorded as simulated interface-state coverage, as G-54 was |
| The superseded customer and customer group rules, if Spree's API refuses them for an existing price list | Their stories checked against their source, as G-55 was |
| Whether a catalog's or a price list's prices reach a buyer on the storefront | Batch 12, wholesale, with FL-10 |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, as the owner answered on 2026-11-04, for one consolidated check of the catalog after part 3, before Liquorify changes identity or access ([§10.9](#109-questions-for-the-owner-and-the-owners-answers)) |
| Imports opened from the customer and purchase order lists, and a seller's imports | Batches 10, 6 and 13 (§10.4) |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. None of them is about categories, collections, catalogs, price lists, translations or imports. The superseded customer rule picks shoppers from the customer list that ISO-1 concerns; part 2 captures it with the browser-test store's own shoppers and claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 11. Corrections found during part 1

Part 1's running screens showed where this proposal did not match Spree at `01a0365`. The proposal's text above is unchanged; these corrections govern. Each is recorded in part 1's [verification record](../verification/2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md) §5 and §6.

| Where | The proposal says | Spree does |
|---|---|---|
| §2.1, DA-PRD-03 | The `product.form_sidebar` slot, captured | The slot is in the page but draws nothing until a plugin registers something for it, so there is nothing to capture. P3 checked a slot's rendering generically |
| §2.1, DA-PRD-03 | Media with its description and variants | On a product without options, the edit media sheet shows the product's only variant under Assigned variants, labelled by its id (B13), where the story "Product without variants" shows none |
| §2.2 | The read-only role keeps some controls the server then refuses | The catalog viewer keeps Add product, a new product's form and the product page's Save, with every card's controls; the bulk action bar, Import, Upload files and the Add buttons of options and product types are hidden. A teammate who cannot read sales channels sees each channel by its id (B14), and one who cannot read product types or delivery profiles sees neither chosen (B15); a page the teammate cannot read shows its empty state, as if the store had none (B17) |
| §4 | The size estimate: about 220 stories, 440 reference images and 200 captures | 254 stories and 508 reference images, 10.0 MB; 140 captures, 280 images, and evidence of 22 MB in all |

## 12. Part 3: promotions, gift cards and store credit

Part 3 covers how staff reward and credit shoppers: promotions with their rules, actions and coupon codes (CAP-05-12), and gift cards and store credit (CAP-05-13), with the dashboard's steps of FL-16 and FL-17. It reproduces Spree's dashboard as `main` has it at `87a2ea8`, whose dashboard packages and SDKs are unchanged since `01a0365`, the revision part 1 pinned. Since then `main` has changed Spree's address models and how a gift card is applied to an order and released (#30, merged on 2026-11-02). Applying a gift card to an order belongs to checkout, batch 9, and part 3 claims nothing about it.

Part 3 builds on part 2's merge, because it reuses six components that part 2 gives stories to (§12.5). It uses the catalog data of parts 1 and 2, and follows the same batch rules. It was proposed on 2026-11-04, under the owner's delegation of that day ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)), and aligned with the project's baseline completion audit: it completes batch 5, which batch 6 depends on, and it stays in lane A, with its own checkout and data. After it, lane A runs the catalog's consolidated refusal check under G-11 (decision 3), which is proposed separately.

### 12.1 Capabilities, screens, flows and tests

| Capability (LIQ-006 §5) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-05-12 Promotions and coupon codes | DA-PRM-01 to DA-PRM-03. The coupon field on the cart and at checkout (SF-SHOP-05, SF-CHK-01) is batch 9's, and an order's discounts (DA-ORD-04) are batch 8's | FL-16, its dashboard step | `promotions.spec.ts` (21 tests) |
| CAP-05-13 Gift cards and store credit | DA-LOY-01, DA-LOY-02. The shopper's gift card list (SF-ACC-09) is the accounts batch's, accepted; a customer's store credit card on DA-CUS-02 is batch 10's | FL-17, its dashboard step; redeeming at checkout is batch 9's | `gift-cards.spec.ts` (6), `store-credits.spec.ts` (5); the store credit dialogs opened from the customer page in `customers.spec.ts` (5) |

With part 3, every capability of §5 has a map, some only in part. CAP-05-11, price history, keeps P1's result, as in parts 1 and 2. LIQ-006 notes that it is not known whether promotions on alcohol are restricted where Liquorify trades. That is a Liquorify question, deferred until the baseline is complete, and part 3 does not answer it.

### 12.2 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; the promotion page and both loyalty lists are also captured on a narrow screen.

| Screen | States |
|---|---|
| DA-PRM-01 Promotions | Listed, automatic and with a coupon code, by their start and expiry dates: not yet started, running and expired; searched, and finding nothing; filtered by start and expiry date; sorted; none; the delete confirmation; the list failing to load |
| DA-PRM-02 New promotion | The empty form, with a coupon code, which Spree chooses by default; automatic; one code typed, and one generated; many codes, with a prefix and their number; a usage limit; its schedule; the rule picker, with every rule Spree registers; each rule's editor: the eight that have their own editor (product, category, customer, customer group, country, channel, market and option value) and the generic editor that the currency, item total, first order, signed-in and one-use-per-customer rules use; the match policy, all or any; the action picker; each action: an order adjustment with each of its five calculators and item adjustments with each of their three, each with the calculator's summary, then free line items and free shipping; tiers, with a tier above 100 percent refused; an editor cancelled, which adds nothing; field errors; saving |
| DA-PRM-03 Promotion | Its rules and actions with their summaries; a rule and an action removed, each with its confirmation; tiers edited and removed; the settings that cannot change after creation, with their explanation; the codes sheet, with used, partly used and unused codes, paged, and the export of its codes; unsaved changes; saved; a save refused with its errors; the `promotion.form_sidebar` slot, as it renders; the page failing to load |
| DA-LOY-01 Gift cards | Listed in each status a running screen can reach: active, partly redeemed, redeemed and expired; with and without a customer; issued in a batch; searched, and finding nothing; filtered by status, currency, batch and customer; none; the create sheet, with an amount, a generated or typed code, a currency, an expiry date and a customer; a quantity above one, which issues a batch; the edit sheet, with what has been used and who issued it; the delete confirmation; the old promotions address opening the list; the list failing to load |
| DA-LOY-02 Store credits | What the store still owes, with what it issued and what was used, per currency; listed, outstanding and spent, issued from a gift card and not, and by who issued it; searched; filtered by customer, standing, currency, origin and who issued it; none; issuing to a customer picked on the page, including one created after the picker last searched; a credit's sheet with its history, an empty history, and the history failing to load; following a credit to its customer; editing and deleting a credit; a credit of a customer whose data was erased, as the list shows it; the list failing to load |

**A cancelled gift card.** Spree can cancel a gift card through its own workflow, but no staff screen or API request cancels one at `87a2ea8`, read in the code. DA-LOY-01's "canceled" status and its filter option are therefore checked against their source, as SF-ACC-09's were (G-14). Part 3's record confirms on the running screen that no staff control cancels a gift card. That is the evidence G-14's proposed answer waits for; answering G-14 stays with the owner.

### 12.3 Permission variants

Part 3's screens use three scopes ([LIQ-008 §2](../LIQ-008-spree-screen-inventory.md#2-who-may-open-what)): `promotions`, which no role template covers, and `gift_cards` and `store_credits`, which the order manager template holds. Picking a customer for a gift card or a credit needs read on `customers`. A promotion's rules pick from products, categories, customers, customer groups, channels and markets, each under its own scope. Five roles:

- **Admin role:** every screen with every control.
- **A role made from the order manager template,** which holds write on gift cards and store credits and read on customers, and nothing on promotions: both loyalty screens with their controls; the promotions entry hidden, and a direct visit to each promotion screen recorded as it shows.
- **The marketer, a custom role with write on `promotions` and nothing else.** No template covers promotions, so this is the role a store would make for the person who runs them. The promotion screens, with each rule editor's picker recorded as it shows to a teammate who cannot read what it picks from. Part 1 found that such a teammate sees a related record by its id or not at all (its record's B14 to B17), so each picker is recorded, not assumed.
- **The loyalty viewer, a custom role with read on `promotions`, `gift_cards`, `store_credits` and `customers` and write on nothing:** the same screens, with create, edit and delete controls recorded as each screen shows them.
- **A role made from the merchandiser template, which holds none of part 3's scopes:** the promotion and loyalty entries hidden, and a direct visit to each screen recorded as it shows.

What the server refuses to the narrower roles is recorded from Spree's own specs (criterion 12). What no spec sends joins G-11, for the catalog's consolidated refusal check after part 3, as the owner answered on 2026-11-04 (decision 3, [§10.9](#109-questions-for-the-owner-and-the-owners-answers)).

### 12.4 Left out, and where it goes

- **Using a promotion:** a coupon entered on the cart or at checkout, and an automatic promotion applied to a cart, are batch 9's, with FL-16's later steps; an order's discounts are batch 8's.
- **Redeeming a gift card or store credit at checkout:** batch 9's, with FL-17's later steps. Part 3 reaches used gift cards, credits and codes through the Admin API (§12.6) only so that their states can be captured, and claims nothing about checkout.
- **A customer's store credit card on DA-CUS-02:** batch 10's, with the customer page. The issue and edit dialogs get their stories here, and their tests from the customer page are listed, because the same dialogs open there.
- **Refunds to store credit:** batch 8's, with returns.
- **The shopper's gift cards (SF-ACC-09):** the accounts batch's, accepted.
- **The files that gift card and coupon code exports write:** the coupon code export is captured as it starts from the codes sheet, and Spree's export specs cover the files (criterion 12). The running check of an export's file is part 2's, for products (FL-21).
- **Whether promotions on alcohol are restricted:** a Liquorify question (§12.1).

### 12.5 Components

Part 3's screens use 15 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. They were found as parts 1 and 2 found theirs: from what the screens and their table definitions import on `main`, followed through each file they import, after parts 1 and 2. The part's first step confirms the list against the running screens.

| Layer | New in part 3 |
|---|---|
| Composed (CMP-DUI-C) | `calculator-summary` (07) |
| `promotion-editors/` (CMP-DA-G-15) | `promotion-form`, `match-policy-picker`, `action-adjustment`, `action-create-line-items`, `rule-category`, `rule-channel`, `rule-country`, `rule-customer-group`, `rule-market`, `rule-option-value`, `rule-product`, `rule-user` |
| `store-credits/` (CMP-DA-G-21) | `edit-store-credit-dialog`, `issue-store-credit-dialog` |

`promotion-form` holds the promotion page's cards, the rule and action pickers and the codes sheet, and each gets its own stories. The rules and actions that have no editor of their own use `preferences-form`, already covered. The gift card screen builds its sheets from primitives, with no component of its own, so its states are the screen's captures. `calendar` and `date-picker` are reached only through `store-date-picker`, whose stories part 1 made, as in parts 1 and 2.

**From part 2, so part 3 builds after part 2's merge:** `editor-shell`, `export-button`, `market-combobox`, `money`, `resource-combobox` and `type-picker-sheet`.

**Already covered, reused here:** 55 components with stories from earlier batches and part 1, among them `resource-table`, `table-toolbar`, `bulk-action-bar`, `store-date-picker`, `page-header`, `can`, `slot`, `preferences-form`, `confirm-dialog`, `country-combobox`, `currency-select`, `resource-multi-autocomplete`, `choice-card-picker`, `json-preview-drawer`, `relative-time`, and the primitives.

### 12.6 Delivery

- **One backend pull request for part 3:** stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index and LIQ-009's Storybook column. It builds on `main` after part 2's merge.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as parts 1 and 2 ran it, with Spree's sample catalog loaded into that server's own database. Spree's sample data gives one promotion, "Free Shipping", with the code FREESHIP. What a state needs beyond it is added through the Admin API on that database only: promotions with each rule and action, one with many codes, gift cards in a batch and with a customer, store credits in two currencies, and the roles in §12.3. States that need an order (a gift card partly and fully redeemed, a credit partly used, a coupon code used) are reached by applying them to orders that staff create and complete through the Admin API on that database, if Spree's API completes such an order with its test payment method. An expired gift card is made the same way, if Spree's API accepts an expiry date in the past. Any state the API cannot reach is checked against its source, and the record says so. Spree's code, tests and fixtures are not changed.
- **Its own checkout and data,** under LIQ-004's lane rules, as parts 1 and 2 ran.
- **Emails:** none. Part 3's screens send no email of their own; the coupon code export sends EM-S-05, which part 2 renders and reads for a product export.

**Size, estimated from part 1:** about 100 stories and 200 reference images, and about 90 running-screen captures with their computed styles. Part 1 came to 254 stories for 40 components; part 3 has 15, but the promotion form alone has many cards, pickers and editors.

### 12.7 Acceptance criteria

Part 1's criteria 1 to 14 apply to part 3, with its own screens, components, roles and flows: the dashboard steps of FL-16 and FL-17 in criterion 5, and the screens of §12.2 in criterion 3. Criterion 12 runs Spree's own specs for part 3's endpoints and models: the Admin API controller and integration specs for promotions, promotion actions and rules, coupon codes, gift cards and gift card batches, store credits and their history, a customer's store credits, and an order's gift cards and store credits; and Spree core's specs for promotions, their actions, rules and calculators, coupon codes, gift cards, gift card batches, store credits and their history, and the gift card workflows. Two criteria change, and one is added:

| # | Criterion | Evidence |
|---|---|---|
| 11 | The reference images, the screen evidence and fidelity are accepted under D5. Under the owner's delegation of 2026-11-04 this is a delegated acceptance, recorded as such and never as the owner's review. The gaps part 3 leaves stay for the owner's answers | The acceptance record |
| 15 | Each part 3 behaviour that no browser test drives is listed, with the check made instead, as part 1 listed its own under G-57. A behaviour is not counted as tested because a capture shows it | The record's gap list |
| 16 | The record states whether any staff control cancels a gift card on the running screen, for G-14 (§12.2). Answering G-14 stays with the owner | The record's G-14 section, with its captures |

### 12.8 FL-16 and FL-17, their dashboard steps

**FL-16, run a promotion:**

| Step | Browser tests |
|---|---|
| DA-PRM-02: create an automatic promotion with a rule and an action | `promotions.spec.ts`: "creates an automatic promotion with a rule and an action" |
| DA-PRM-02: its rules | "creates a promotion with a Country rule", "… with Channel and Market rules", "… with a Product rule", "… with a Category rule", "… with a Customer rule", "… with a Customer Group rule", "… with a Currency rule defaulting to store currency" |
| DA-PRM-02: its actions and their calculators | "creates a promotion with a Create Adjustment action", "reopens a Create Adjustment action on the configured calculator", "keeps a flat rate amount and an item total minimum exactly", "keeps a flat percent discount exactly", "saves the tiers of a tiered calculator, lowest threshold first", "refuses a tier discount above 100 percent", "creates a promotion with a Create Item Adjustments action", "creates a promotion with a Create Line Items action" |
| DA-PRM-02: a promotion with a coupon code, one or many | None found: the tests switch to an automatic promotion. Captured, and listed under criterion 15 |
| DA-PRM-03: edit it | "removes a rule and an action while editing", "edits and removes tiers on a saved promotion" |
| SF-SHOP-05 or SF-CHK-01: the coupon entered | Batch 9 |
| DA-ORD-04: the order's discounts | Batch 8 |

**FL-17, issue and redeem a gift card:**

| Step | Browser tests |
|---|---|
| DA-LOY-01: issue a gift card, with a generated or a typed code | `gift-cards.spec.ts`: "creates a gift card with an auto-generated code", "creates a gift card with a custom code and edits it" |
| DA-LOY-01: issue a batch | "bulk-issues a batch when quantity > 1" |
| SF-CHK-01: redeem it at checkout | Batch 9 |
| SF-ACC-09: the shopper's gift cards | The accounts batch's, accepted |

Part 3's other browser tests are in no flow: "lists promotions", "cancelling a rule or action editor does not add a row" and "deletes a promotion"; "lists gift cards", "deletes a gift card" and "the old promotions address opens the gift cards list"; the five tests of `store-credits.spec.ts`; and the five store credit tests of `customers.spec.ts`.

### 12.9 Choices made under the owner's delegation

Part 3 has no question that needs the owner. Its choices are planning within batch 5's approved scope, which the owner's delegation of 2026-11-04 lets the coordinating session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **One implementation pull request.** Part 3 has five screens and 15 new components, about a third of part 2. The alternative, promotions first and then gift cards and store credit, would add a pull request and a review without reducing risk.
2. **Part 3 builds after part 2's merge,** because it reuses six components that part 2 gives stories to. Starting earlier would make it write stories that part 2 also writes.
3. **States that need an order are reached through the Admin API,** on the browser-test database only (§12.6). This follows the rule every batch has used. It reaches no checkout screen, and redeeming at checkout stays batch 9's.
4. **A fifth role, the marketer,** with write on promotions only (§12.3), because no role template covers promotions and its pickers read scopes it may not have.

What stays with the owner: G-14's answer, the answers to the gaps part 3's record lists, and anything the record finds that would change scope, a defect or a criterion. Tenant isolation stays NOT_RUN for part 3: FB-03's validation is separate, and part 3 claims nothing about it.

### 12.10 Gaps known before the work starts

| Gap | What would close it |
|---|---|
| A cancelled gift card: no staff screen or API request cancels one at `87a2ea8`, read in the code | G-14, pending with the owner. Part 3's record confirms it on the running screen (criterion 16); the owner's answer decides |
| States that need an order or a past date, if Spree's API cannot reach them (§12.6) | Checked against their source, and recorded as coverage gaps |
| States reached only by answering a request in the browser, such as a list, a credit's history or the page failing to load, and a save refused | Recorded as simulated interface-state coverage, as G-54 was |
| Behaviours no browser test drives. Read in the tests so far: a promotion with a coupon code, one or many; the usage limit; the option value, signed-in and one-use-per-customer rules; the codes sheet and its export; the gift card list's filters and an expired gift card; the store credit list's filters and a credit's history | Listed in the record (criterion 15) for the owner's answer, as G-57 was |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, for the catalog's consolidated refusal check after part 3, before Liquorify changes identity or access (decision 3) |
| Using a promotion, a gift card or store credit at checkout | Batch 9, with FL-16's and FL-17's later steps |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. The customer rule and the gift card and store credit pickers choose shoppers from the customer list that ISO-1 concerns; part 3 captures them with the browser-test store's own shoppers and claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 13. Corrections found during part 2

Part 2's running screens showed where §10 did not match Spree at `5794da6`. The proposal's text above is unchanged; these corrections govern. Each is recorded in part 2's [verification record](../verification/2026-11-04-fb-19-batch-catalog-and-pricing-part-2.md) §5 and §6.

| Where | The proposal says | Spree does |
|---|---|---|
| §10.2, DA-PRD-07 | The list view | The categories page has no separate list view. It shows the tree, and a flat list of matches while a search is typed; the list is captured as the search results |
| §10.2, DA-PRD-07 | The delete confirmation | The page asks through the browser's own confirm box (B1), which a screenshot cannot show; the capture records its message |
| §10.2, DA-PRD-08 and DA-PRD-11 | Products added before saving, with the resource picker | A new category's and a new collection's pages have no products card until the record is saved, so products are added on the saved page, captured on DA-PRD-09 and DA-PRD-12 |
| §10.10 | The superseded customer and customer group rules, a known gap if Spree's API refuses them | Spree's API accepted both rules for an existing price list, so they are captured as they render, and the gap does not arise |
| §10.6 and criterion 15 | EM-S-05's download link is fetched, and its file checked | The email's button links back to the page the export was started from, the product list, not to the file (B17). The file checked is the one the dashboard downloads when the export finishes. This corrects what Spree does, not the criterion: that part of criterion 15 stays not met. On 2026-11-04 the owner accepted it as a baseline exception and had it tracked as SD-17, which stays open |
| §10.6 | The size estimate: about 230 stories, 460 reference images and 170 captures | 306 stories and 612 reference images, 16.8 MB; 199 captures, 398 images, and evidence of 21 MB in all |

## 14. Corrections found during part 3

Part 3's running screens showed where §12 did not match Spree. The proposal's text above is unchanged; these corrections govern. Each is recorded in part 3's [verification record](../verification/2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md) §6 and §7.

| Where | The proposal says | Spree does |
|---|---|---|
| §12.2, DA-PRM-03 | The codes sheet, with used, partly used and unused codes | A coupon code is either used or unused; there is no partly used code. The sheet is captured with used and unused codes |
| §12.2, DA-PRM-03 | The `promotion.form_sidebar` slot, as it renders | The slot draws nothing without a plugin, as the product page's does (part 1). Every capture of the page shows the sidebar as it renders |
| §12.2, DA-LOY-01 | Listed in each status: active, partly redeemed, redeemed and expired | Expired is not one of Spree's gift card statuses. It is worked out from the expiry date and shown as a badge in the list, and the status filter does not offer it (B15). The list is captured as it shows it |
| §12.2, DA-PRM-03 | A save refused with its errors | A usage limit below one is stopped by the browser's own number check before any request (B11). The state is captured twice: as the browser stops it, and as the server refuses a name of spaces |
| §12.3, the loyalty viewer | The promotion screens, with create, edit and delete controls recorded as each shows them | A promotion's page never finishes loading for this role, because Spree refuses its rules and actions to a teammate who may not change the promotion (B1). Its controls cannot be recorded there; the story "Read-only role" shows what the form would draw, checked against its source |
| §12.6 | States that need an order or a past date are checked against their source if the API cannot reach them | Spree's Admin API completed the orders with its sample check payment method and accepted a gift card expiry date in the past, so every such state was reached on the running server |
| §12.6 | The size estimate: about 100 stories, 200 reference images and 90 captures | 130 stories and 260 reference images; 163 captures, 326 images |
