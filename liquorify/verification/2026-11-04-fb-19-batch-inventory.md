---
title: FB-19 batch 6, inventory
record: verification
work_item: FB-19
date: 2026-11-04
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens, and Spree's own specs for the batch's endpoints, models and workflows, 528 examples with no failures and 5 pending. Every state the work item lists for the eleven screens is captured, or recorded as a correction where Spree does not have it; 13 states were reached in the browser. CAP-07-09 and CAP-07-10 PARTIAL: FL-14's and FL-15's dashboard steps map to Spree's browser tests, apart from their last step on the inventory list, and 12 behaviours no browser test drives are G-87. G-78's check ran at the owner's approval of 2026-11-04 and met its closing condition at both widths. 18 behaviours recorded and not changed, and one existing defect, SD-23, recorded. G-85 to G-87 OPEN for the owner; the narrower roles' requests join G-11 for P10. Tenant isolation NOT_RUN. Delegated acceptance, under the owner's delegation of 2026-11-04, at #64's final commit, which the merge record names; not the owner's review
---

# FB-19 batch 6, inventory

**Claim.** Batch 6 of the [inventory work item](../work-items/fb-19-batch-inventory.md) reproduces what Spree already has for the stock a store holds and the ways it changes: stock locations, stock levels, transfers between locations, suppliers and purchase orders. It gives the 14 new components those screens use, and the stock history card's three scopes, 102 Storybook stories with light and dark reference images. It captures the eleven screens on Spree's running dashboard in each state the work item lists and for each of five roles, maps FL-14 and FL-15 step by step to Spree's browser tests, compares 17 of the new stories, and 15 earlier batches' stories the screens show, with the same components on the running screens, and runs Spree's own specs for the endpoints, models and workflows the screens rely on. At the owner's approval of G-78 on 2026-11-04, it also shows one shopper's checkout holding the last unit of an item and a second shopper refused it on the running storefront, at both of the storefront's widths, with what the server answered (§8.1). It follows the work item, proposed and merged under the owner's delegation of 2026-11-04, and the owner's answers of that day: source-only and simulated coverage stay apart from functional verification, the refusals a narrower role meets go to the platform batch's step P10, and the acceptance is delegated acceptance, not the owner's review.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | Pull request [#64](https://github.com/pateldhruval872/liquorify/pull/64), branch `claude/project-thread-k6z7d9`. It started from `main` at `5b23b5af`, #63's merge, which holds the work item. `47d14284` added the stories, fixtures, mocks, reference images and the capture and comparison scripts; `bb83f4b1` corrected the scripts and one story's fixture, rewriting its two reference images (§4.2); `99751176` merged `main` at `fc5cb555`, part 3 of the catalog batch, and `0c61c46b` merged `main` at `43a47b5e`, part 3's merge record and the security audit repair. The next commit adds the evidence, the records and G-78's script; later commits change Liquorify's records only |
| Spree's code: the dashboard, its packages, the SDKs and the gems | The same at `b926ee4b`, the revision the work item names, at `5b23b5af`, at `fc5cb555` and at `43a47b5e`: `git diff` between each of them over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk` and `packages/admin-sdk` is empty. The branch changes none of it, nor any workflow or lockfile |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at that code, in the pinned Playwright 1.64.1 image. Captures are 1280 by 960 pixels, and 390 by 844 for the three phone captures; comparisons are 1280 by 800, or 1280 by 960 where a case names a taller window. The captures and the comparison ran from the branch's working tree on `5b23b5af`, with the script corrections committed in `bb83f4b1`, and their notes name `5b23b5af` |
| G-78's check (§8.1) | Run from the working tree at `99751176` with `g-78-stock-hold.spec.ts` as the records commit adds it, on 2026-11-05 shortly after midnight UTC. The storefront at `ad77c3d`, its `main` with #23, built for production and served against the same browser-test server through the script's recording proxy. Its answers name both revisions |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-inventory.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components and browser tests, with no in-scope ID left unmapped | PASS: the map in §2 has CAP-07-09 and CAP-07-10, the eleven screens, FL-14 and FL-15 step by step, the `stock`, `purchasing` and `settings` scopes and the `products` scope the line pickers read, the 14 components and Spree's 31 browser tests in six files, each with its evidence or a named gap |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 14 new components and the stock history card's three scopes, 102 stories, 204 reference images, each looked at in both modes (§1, [image review list](2026-11-04-fb-19-batch-inventory-image-review.md)). The running screens use the 14 the work item named; the reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | PASS for every listed state, with three recorded as corrections (§6): the inventory list with no location or no variant, the purchase order list's overdue and past cancel-by orders, which the list cannot show (SD-23), and a past cancel-by date, which the server accepted. 94 states of the eleven screens are captured, in 132 captures with the role variants, each in light and dark. 13 states were reached by answering or holding a request in the browser, and say so (§2.1, G-86) |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen; the merchandiser, the purchaser and the stock viewer on each list and document they are offered; and a direct visit by each role to the screens it is not offered |
| 5 | FL-14 and FL-15 are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | PASS for the mapping, and for the browser tests in CI at the pull request's revision (§2.2, §9). Each flow's last step, the stock on the inventory list, has no browser test; it is captured, and listed under criterion 15 (§2.3, G-87) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 17 cases of batch 6's stories were compared in both themes, and every difference is explained by the data, by what holds the component, or by the screen's own content. One story listed its deliveries in another order than the screen, and its fixture was corrected (§4.2). 15 earlier stories were compared too, and all leave their gap |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 85 of the 102 stories were not compared by the script; 58 of them show a state seen in a running-screen capture, and 27 were checked against their source only (G-85, image review list). Every capture whose state was reached in the browser says how in its note, and claims nothing about the server (§2.1, G-86) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | See §9. The two full runs on the final revision, with Tests and Packages, are named in the merge record. The tolerance is the agreed one for every image of batch 6 |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from the merges of `main`. No workflow, lockfile or Spree file changes. The storefront was built and run for G-78's check and not changed |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, progress tables, gap register and existing defects, the work item's status and the README index, with the link check run (§9) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at this pull request's final commit, which the merge record names (§12). Not the owner's review. The gaps batch 6 leaves stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 528 examples in 30 files, 0 failures and 5 pending, saved as `backend/api-specs.json` and `backend/core-specs.json` (§3.2). They run as the store's admin, apart from three examples with a secret key's scopes. What no spec exercises for the four narrower roles is NOT_RUN and joins G-11 for P10 |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | NOT_RUN (§3.3). None of ISO-1 to ISO-7 is about stock. No check of this batch read or wrote another store's records. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, supplier, address and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push | PASS: the stories use invented warehouses, suppliers, products and people; the running screens show the browser tests' own records and those the scripts add, each named "Fidelity" or with an `example.com` or `.example` address. Before each push, every line the pull request adds, in the text files it adds or changes, was searched for the shapes of keys, tokens and passwords and compared with the local values the batch used; nothing matched (§9). No capture draws a key |
| 15 | Every effect of stock outside the dashboard is listed with the batch or step that checks it. Behaviours on these screens that no browser test drives are listed for the owner's answer. None is claimed here | PASS: §8 lists each effect with who checks it, and G-78's check, which the owner brought into this batch, ran and met its condition (§8.1). 12 behaviours no browser test drives are listed in §2.3, each with its capture and the Spree specs for the server's side. None is counted as tested. They are G-87, for the owner's answer |

## 1. What was built

**Stories, 102: 97 for the 14 new components and 5 for the stock history card's scopes.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-11-04-fb-19-batch-inventory-image-review.md) names each one. Stories use invented warehouses, suppliers, products, people and references.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Framework pages | `stock-locations` (CMP-CORE-PG-03) | Listed, None, Loading, Add sheet, Adding, Edit sheet, Save refused, Delete confirmation, Read-only role, Merchandiser, Order manager, opened directly (11) |
| Admin dashboard, top level (CMP-DA-G-24) | `close-short-dialog` | Transfer, Purchase order, With a reason, Closing (4) |
|  | `inventory-cells` | Figures, Correction open, Adjusting, Saving, Incoming menu, Merchandiser, Read only (7) |
|  | `inventory-status-badge` | Each transfer status, draft, ready to ship, in transit, partially received, received, over received and canceled, and each purchase order status, draft, ordered, partially received, received, over received and canceled (13) |
|  | `purchase-order-form` | Empty, Filled, Cost missing, Choosing a supplier, Adding a supplier, From inventory, Creating, Edit draft (8) |
|  | `quantity-cell` | Editable, Typed, Read only (3) |
|  | `receive-delivery-card` | Empty, Counted, Refusal without a reason, Damaged on arrival, Second delivery, Purchase order, Saving, Read-only role, Merchandiser on a purchase order (9) |
|  | `stock-levels-panel` | Listed, Searched, No match, Edited, Saving, Empty, Loading, Read-only role (8) |
|  | `stock-receipts-card` | One delivery, Two deliveries, Purchase order, None, Loading, Failed (6) |
|  | `stock-transfer-form` | Empty, Source chosen, With lines, Picking products, From inventory, Same warehouse, Creating, Edit draft (8) |
|  | `supplier-sheet` | Add, Name required, Edit, Saving, Name taken (5) |
|  | `transfer-cancel-dialog` | Not shipped, In transit, Restock, Write off, Cancelling (5) |
|  | `variant-line-editor` | Empty, Source not chosen, Picker open, Lines, With costs, Purchase order, empty (6) |
|  | `variant-link` | Linked, No picture, Discontinued, No SKU (4) |
|  | `stock-history-card`, its scopes | Location, Transfer, Purchase order, Nothing changed yet, Loading (5), titled "Stock history card" beside part 1's "Stock history" stories of the product page's dialog |

**Already covered, reused by these screens:** `resource-table`, `page-header`, `slot`, `can`, `confirm-dialog`, `row-actions`, `resource-layout`, `route-pending`, `import-wizard-dialog`, `country-state-fields`, `currency-select`, `resource-combobox`, `resource-picker-sheet`, `store-date-picker`, `export-button`, `import-button`, `money`, and the primitives from earlier batches, among them `sheet`, `dialog`, `popover`, `collapsible`, `select`, `switch`, `input-group`, `input`, `textarea`, `table`, `badge`, `thumbnail`, `empty` and `pagination`. Fifteen of their stories that these screens show were compared (§4.1).

**Providers and mocks.** Fixtures for inventory (`src/fixtures/admin/inventory.ts`), each shaped as the browser-test server answered the same request on 2026-11-04 and dated around the fixture clock, 1 October 2026: three locations, stock levels with low, backorderable, reserved and incoming stock, suppliers with and without purchasing history, a transfer in each status with its deliveries and movements, and a purchase order in each status with its lines, costs and deliveries. Mocked Admin API answers for them (`src/mocks/handlers/admin/inventory.ts`), and `inventory-page.tsx`, which places a component on the page that holds it. The fixture test checks every new fixture against the admin SDK's schemas.

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `inventory.ts` (new) adds what the captures need beyond the browser tests' data, through the Admin API on the browser-test database only: two products, two suppliers, a transfer in each status and a purchase order in each status, with their deliveries (§2.1).
- `staff.ts` adds the purchaser and the stock viewer, each with its own teammate.
- `screens-batch-6.spec.ts` (new) captures the eleven screens. Each capture blocks and records any request that would leave the local servers. No capture saves a change: forms are filled and dialogs opened, never confirmed, so the seeded documents keep their states.
- `compare-batch-6.spec.ts` (new) compares the 17 new stories and the 15 earlier ones in 32 cases (§4).
- `g-78-stock-hold.spec.ts` (new) runs G-78's check on the dashboard and the storefront (§8.1).
- `playwright.config.ts` lists the new files.

## 2. The batch's map, completed

The map from the [work item §2](../work-items/fb-19-batch-inventory.md#2-scope), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-11-04-fb-19-batch-inventory/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22 and again on 2026-11-04. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen; it does not show that the screen works. **Functionally verified** is whether each behaviour was shown to work at the batch's revision, by a browser test or a spec (§2.2, §2.3).

| Capability | Screens | Flows | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-07-09 Stock locations, stock levels, reservations | DA-SET-18, with the stock levels and history in a location's sheet; DA-INV-01. What a shopper meets is the storefront's (§8) | FL-14's and FL-15's last step, the stock on DA-INV-01 | `stock` for both screens; DA-SET-18 also opens with `settings`; deleting a location needs `settings` | `stock-locations`, `stock-levels-panel`, `inventory-cells`, `stock-history-card`, and the reused `resource-table`, `country-state-fields` | 25 states of DA-SET-18 and DA-INV-01 in 40 captures, light and dark; 7 new cases compared; the 4 tests of `stock-locations.spec.ts` and the 6 of `inventory.spec.ts`; Spree's stock location, stock level, movement and reservation specs (§3.2); G-78's check (§8.1) | PASS: every listed state captured, the empty inventory list reached in the browser (§6) | PARTIAL: listing, creating, editing and deleting a location, and the inventory list's figures, explanations, filters, in-place correction and the purchase order raised from a row, pass in Spree's browser tests. A hold made by a checkout, and refused to another shopper, was shown on the running storefront (§8.1). The stock levels panel, the location's history and the list after a transfer or a delivery are not functionally verified (§2.3, G-87) |
| CAP-07-10 Stock transfers, purchase orders, suppliers | DA-INV-02 to DA-INV-05, the transfers; DA-INV-06 to DA-INV-09, the purchase orders; DA-INV-10 | FL-14; FL-15 | `stock` for transfers, `purchasing` for suppliers and purchase orders; receiving a purchase order books a stock receipt, which either covers | `stock-transfer-form`, `purchase-order-form`, `variant-line-editor`, `variant-link`, `quantity-cell`, `receive-delivery-card`, `stock-receipts-card`, `close-short-dialog`, `transfer-cancel-dialog`, `inventory-status-badge`, `supplier-sheet`, and the reused `resource-picker-sheet`, `resource-combobox`, `store-date-picker`, `currency-select`, `money`, `import-wizard-dialog` | 69 states of DA-INV-02 to DA-INV-10 in 92 captures, light and dark; 10 new cases and the 15 earlier ones compared; the 7 tests of `stock-transfers.spec.ts`, the 4 of `inventory-line-picker.spec.ts`, the 6 of `purchase-orders.spec.ts` and the 4 of `suppliers.spec.ts`; Spree's transfer, purchase order, supplier and receipt specs and workflows (§3.2) | PASS: every listed state captured but the list's late orders, which it cannot show (SD-23, §6); 9 states reached in the browser | PARTIAL: raising, packing, sending, receiving in one or two deliveries, counting damage and cancelling a transfer in flight; raising, placing, receiving, closing short, correcting, cancelling and deleting a purchase order; and adding, editing, refusing a nameless and deleting a supplier pass in Spree's browser tests. The 10 transfer, purchase order and supplier behaviours of §2.3 are not functionally verified (G-87) |

With batch 6, both capabilities of LIQ-006 §7 that LIQ-004 gave it are mapped, each in part. Whether a licensed seller of alcohol must keep stock records that Spree does not, such as by batch or by bonded warehouse, is a Liquorify question, deferred until the baseline is complete; batch 6 does not answer it.

### 2.1 Screens and their states

Each state below is captured in light and dark, at 1280 pixels, for the admin unless a role is named. "Reached in the browser" means the capture answered or held one request itself, and its note says which; such a state shows what the interface draws and claims nothing about the server (G-86).

| Screen | States captured | Reached in the browser |
|---|---|---|
| DA-SET-18 Stock locations | Listed, for the admin and three narrower roles; none; loading; the create sheet, and its pickup section; edit, for four roles; the stock levels panel, for the admin and the stock viewer, with a low-stock marker and a backorderable row; the panel searched with no match; the location's stock history; a save refused by Spree, a name another location has; delete confirmation; the order manager's direct visit (12 states) | None, loading |
| DA-INV-01 Inventory | Listed, for four roles; each column's explanation; filtered by low stock, by reserved, and by location; a row with stock on its way, searched, for four roles, with its menu for three; the on-hand count opened, set and adjusted, with a reason; no match; none; loading; the order manager's direct visit (13 states). The reserved row is the browser tests' own fixture | None, loading |
| DA-INV-02 Stock transfers | Listed, with each status, for four roles; none; loading; the delete confirmation for a draft; the order manager's direct visit (5 states) | None, loading |
| DA-INV-03 New transfer | Empty, for the admin and the merchandiser; the line picker; lines added in one pass; the same warehouse chosen twice; a refused save; prefilled from a row; the purchaser's and the stock viewer's direct visits (7 states) | The refused save |
| DA-INV-04 Transfer | Draft; ready to ship; in transit, for four roles and on a phone; a delivery counted with damage; partially received, and on a phone; its two deliveries; received; over received; the close short dialog and closed short; the cancel dialog for a transfer in flight; canceled; the page failing to load; the order manager's direct visit (14 states) | The page failing to load |
| DA-INV-05 Edit transfer | A draft being corrected; a transfer already packed, whose edit page says only that it can no longer be changed (2 states) | |
| DA-INV-06 Purchase orders | Listed, with each status, for three roles; filtered by status, by supplier, and by Overdue, which shows nothing (SD-23); the columns menu; the import dialog; none; loading; the delete confirmation for a draft; the merchandiser's and the order manager's direct visits (10 states) | None, loading |
| DA-INV-07 New purchase order | Empty, for the admin and the purchaser; the add-supplier sheet opened from the form; lines with costs; a refused save; prefilled from an inventory row; the merchandiser's and the stock viewer's direct visits (6 states) | The refused save |
| DA-INV-08 Purchase order | Draft; the place confirmation; ordered, for three roles; an order past its expected and cancel-by dates; partially received, and on a phone; received; over received; the close short dialog and closed short; the cancel confirmation; canceled; the page failing to load; the merchandiser's direct visit (13 states) | The page failing to load |
| DA-INV-09 Edit purchase order | A draft being corrected; a line's cost left empty, which keeps Save unavailable; a placed order, which cannot be edited (3 states) | |
| DA-INV-10 Suppliers | Listed, for three roles; none; the add sheet; a name required; a name taken, refused by Spree; edit, for three roles; the delete confirmation for a supplier without history; the menu of one with history, without Delete; the merchandiser's and the order manager's direct visits (9 states) | None |

94 states in 132 captures, 264 images. The three phone captures are the two documents' pages whose sidebar stacks under the main column, as the work item asked. The two refused saves on the new document pages are answered in the browser with a refusal naming the field, because the forms check the warehouse and supplier before sending; the refusals on DA-SET-18 and DA-INV-10 are Spree's own.

### 2.2 FL-14 and FL-15 step by step

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| FL-14: raise a draft with lines | DA-INV-03 | `stock-transfers.spec.ts`: "raises a draft from the form, packs it and sends it"; `inventory-line-picker.spec.ts`, its 4 tests | DA-INV-03 empty, picker, lines-added |
| FL-14: mark it ready, then send it | DA-INV-04 | "raises a draft from the form, packs it and sends it", "sends a draft, then counts in a delivery with damage" | DA-INV-04 draft, ready-to-ship, in-transit |
| FL-14: receive it, in one or more deliveries | DA-INV-04 | "sends a draft, then counts in a delivery with damage", "counts a transfer in over two deliveries, each its own stock receipt" | DA-INV-04 counted-with-damage, partially-received, deliveries, received, over-received |
| FL-14: cancel a transfer in flight | DA-INV-04 | "makes the merchant say what happened to units already gone" | DA-INV-04 cancel-in-flight, canceled |
| FL-14: the moved stock on the inventory list | DA-INV-01 | None (G-87) | DA-INV-01 searched-incoming: the destination's row after the seeded transfers |
| FL-15: add a supplier | DA-INV-10 | `suppliers.spec.ts`: "adds a supplier and edits their contact" | DA-INV-10 add-sheet, edit |
| FL-15: raise a draft | DA-INV-07 | `purchase-orders.spec.ts`: "raises a draft from the form and places it with the supplier" | DA-INV-07 empty, lines-with-costs, supplier-sheet |
| FL-15: place it with the supplier | DA-INV-08 | The same test | DA-INV-08 draft, place-confirmation, ordered |
| FL-15: receive deliveries, or close short | DA-INV-08 | "counts in part of a delivery, then closes the order short", "books each delivery as its own stock receipt" | DA-INV-08 partially-received, received, over-received, close-short, closed-short |
| FL-15: the received stock on the inventory list | DA-INV-01 | None (G-87) | DA-INV-01 searched-incoming, with the stock on its way from the open orders |

The six files hold 31 tests, and all passed in CI at the pull request's revision (§9). The rest of the batch is in no flow; its tests are the remaining ones in those files, as the work item's §6 lists them.

### 2.3 Behaviours no browser test drives (criterion 15)

Read from the six files' test titles and steps. Each is captured, which shows it exists, not that it works; Spree's specs cover the server's side where named. They are G-87, for the owner's answer.

| # | Behaviour | Capture | Spree's specs for the server's side |
|---|---|---|---|
| 1 | The inventory list after a transfer moves stock (FL-14's last step) | DA-INV-01 searched-incoming | The stock transfer lifecycle and receipt specs |
| 2 | The inventory list after a purchase order's delivery (FL-15's last step) | DA-INV-01 searched-incoming | The purchase order lifecycle and receipt specs |
| 3 | The stock levels panel in a location's sheet: correcting a row's on-hand count or backorder setting and saving it | DA-SET-18 edit-stock-levels | `stock_levels_controller_spec.rb`'s update and bulk upsert examples |
| 4 | The stock levels panel's search | DA-SET-18 edit-stock-levels-no-match | None for the search itself |
| 5 | A location's stock history in its sheet | DA-SET-18 edit-history | `stock_movements_controller_spec.rb`, filtered by warehouse |
| 6 | Importing a purchase order file end to end; only the wizard opened from the list is captured | DA-INV-06 import-dialog | None for purchase order imports in this batch's run |
| 7 | Exporting purchase orders | DA-INV-06 listed, with Export | None in this batch's run |
| 8 | A supplier with purchasing history, whose row offers Edit but not Delete | DA-INV-10 with-history-menu | `suppliers_controller_spec.rb`: "refuses while purchase orders still point at it" |
| 9 | A supplier name already used in the store, refused (B5) | DA-INV-10 name-taken | `suppliers_controller_spec.rb`: "returns 422 for a name already in use in this store" |
| 10 | A transfer and a purchase order over received | DA-INV-04 over-received, DA-INV-08 over-received | The receipt specs |
| 11 | The purchase order list's Overdue and Past cancel-by filters and columns (SD-23) | DA-INV-06 filtered-overdue, columns-menu | None: no spec sends the two scopes |
| 12 | A transfer taken back to draft, and a placed purchase order taken back to draft before anything arrives | DA-INV-08 overdue, with Back to draft | The two controllers' lifecycle examples |

## 3. Permissions and isolation

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it.

| Variant | Role's permission keys, as the role was created through the Admin API | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Merchandiser template | `write_products`, `write_categories`, `write_collections`, `write_stock` | Inventory and Transfers in the navigation, without Purchase orders or Suppliers. The inventory list, transfers and stock locations with the admin's controls; a row's incoming menu offers Create transfer only. On a direct visit, the purchase order and supplier lists read "No purchase orders yet" and as if the store had no suppliers, and the purchase order list still offers Export (B6). The new purchase order page opens with its whole form and Create draft (B4), and a purchase order's page reads "This purchase order could not be loaded. Missing permission: read_purchasing" with Try again (B7) |
| Purchaser: write on `purchasing`, read on `stock` and `products` | `write_purchasing`, `read_stock`, `read_products` | The purchase orders and suppliers with the admin's controls. The inventory list, transfers and stock locations without their add buttons; a location's sheet keeps its fields and Save (B4). On a direct visit, the new transfer page opens with its whole form and Create draft (B4) |
| Stock viewer: read on `stock`, `purchasing` and `products`, write on nothing | `read_stock`, `read_purchasing`, `read_products` | Every inventory screen, without the lists' add buttons and the inventory list's correction controls. A location's sheet keeps its fields, the stock levels panel's inputs and Save buttons, and the sheet's Save; a supplier's sheet keeps its fields and Save; an in-transit transfer and an ordered purchase order keep their Receive a delivery card. On a direct visit, the new transfer and new purchase order pages open with their whole form and Create draft (B4) |
| Order manager template | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | No Inventory entry in the navigation. On a direct visit, the lists read as if the store had none, and the purchase order list still offers Export (B6); a transfer's page reads "This transfer could not be loaded. Missing permission: read_stock" with Try again (B7) |

### 3.2 What the server refuses

**Spree's own specs, at Spree's code `5b23b5af`.** Run in this session on SQLite with Spree's API and core test apps. 528 examples in 30 files, 0 failures, and 5 pending: four metadata queries Spree runs on PostgreSQL only, and one Spree marks pending in its source. Every example is listed with its result in [api-specs.json](evidence/2026-11-04-fb-19-batch-inventory/backend/api-specs.json) (192 examples in 9 controller and 7 integration specs, seed 57598) and [core-specs.json](evidence/2026-11-04-fb-19-batch-inventory/backend/core-specs.json) (336 examples in 14 model and workflow specs, seed 53929). Two of the core files, `purchase/quantity_rules_spec.rb` (9) and `purchase/freight_spec.rb` (8), matched the run's file pattern but concern carts, not purchase orders; they are kept in the count.

Every example runs as the store's admin, with a secret key and an admin's token, apart from those that send no credentials and are answered 401, and three that use a secret key's scopes on stock locations. No example runs as a narrower role.

| Endpoint or model | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Stock locations | `stock_locations_controller_spec.rb` (19), `stock_locations_spec.rb` (9); `stock_location_spec.rb` (52) | A location without a name, or with a pickup policy Spree does not have, is refused (422); making a location the default demotes the previous one; a key with only `write_stock` may read the list but not delete a location, and one with `write_settings` may; no credentials answers 401 |
| Stock levels | `stock_levels_controller_spec.rb` (27), `stock_levels_spec.rb` (4); `stock_level_spec.rb` (72), `stock_levels/bulk_upsert_spec.rb` (7) | A count that is negative or not a whole number, an adjustment that is not a whole number, and a count and an adjustment sent together are refused, and the rest of the payload is not written; each correction is recorded as an adjustment movement; a bulk upsert refuses another store's stock; the list filters by the availability scopes the inventory page sends; the reserved and incoming counters never go below zero |
| Stock movements | `stock_movements_controller_spec.rb` (11), `stock_movements_spec.rb` (4); `stock_movement_spec.rb` (30), `stock_movement/custom_events_spec.rb` (6) | Movements have no create, update or delete route; another store's movements are left out and answer 404; the list filters by warehouse, variant and kind |
| Stock reservations | `stock_reservations_controller_spec.rb` (7), `stock_reservations_spec.rb` (1); `stock_reservation_spec.rb` (12) | Reservations have no write routes; another store's answers 404; a hold expires after the store's time, ten minutes by default; the reserved counter is given back when the item is removed |
| Stock transfers and their receipts | `stock_transfers_controller_spec.rb` (27), `stock_transfers/stock_receipts_controller_spec.rb` (7), `stock_transfers_spec.rb` (17); `stock_transfer_spec.rb` (23), `stock_transfers/lifecycle_spec.rb` (34), `stock_receipt_spec.rb` (8) | Another store's warehouse or variant answers 404, and another store's transfers are not listed; a line with no quantity is refused; a shipped transfer cannot go back to draft; cancelling one in transit needs a decision about the units already gone; a delivery against a transfer that has not shipped is refused; units are taken off the source when it ships and counted in at the destination |
| Suppliers | `suppliers_controller_spec.rb` (10), `suppliers_spec.rb` (8); `supplier_spec.rb` (20) | A supplier without a name, or with a name already used in the store, is refused (422); one that purchase orders still point at cannot be deleted; another store's suppliers are not listed and answer 404 |
| Purchase orders and their receipts | `purchase_orders_controller_spec.rb` (20), `purchase_orders/stock_receipts_controller_spec.rb` (7), `purchase_orders_spec.rb` (14); `purchase_order_spec.rb` (22), `purchase_orders/lifecycle_spec.rb` (33) | Another store's supplier, warehouse, variant or order answers 404, and another store's orders are not listed; a placed order cannot be rewritten or deleted; it goes back to draft only while nothing has arrived; it cannot be closed short before anything arrives; a delivery against an order not placed is refused; the list filters by status. No example sends the Overdue or Past cancel-by scope (SD-23) |

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends, as a staff token, the requests §3.1's roles could make or were shown the controls for: the stock viewer saving a location, its stock levels or a supplier, receiving a delivery, or creating a transfer or a purchase order from the page it reaches directly; the purchaser saving a location's stock levels or creating a transfer; the merchandiser's reads of purchase orders and suppliers, and its export; and the order manager's reads of every inventory list and document. Batch 6's captures did not record how the server answered the reads the screens sent, as part 3's did, and the writes were not sent. These join G-11, as the owner answered on 2026-11-04 for the applicable refusals (row 31), for the platform batch's step [P10](../work-items/fb-19-batch-platform.md#p10-the-remaining-refusals-within-one-store).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open; none of them is about stock. Batch 6 captures the browser-test store's own locations, suppliers and documents, and claims nothing about other stores.

Twenty of Spree's specs in §3.2, 17 API and 3 core examples, touch store boundaries: another store's suppliers, transfers, purchase orders, warehouses, variants, movements, reservations and stock are not listed, found or written. They are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the batch claims nothing about isolation from them. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

`compare-batch-6.spec.ts` puts each story beside the same component on the running screen, in light and dark, and records both images side by side and the computed styles of every distinct element on both sides. 32 cases, 64 comparisons, all completed. The comparison is diagnostic: it informs the review of the images and does not decide it.

### 4.1 Results

The [evidence index](evidence/2026-11-04-fb-19-batch-inventory/README.md#comparison-with-running-screens-light-and-dark) lists each case with its images and styles. The stories show invented data and the screens the browser tests' data, so text, counts and row heights differ on purpose. Every difference the styles record is explained below; none is a defect in a story.

| Cases | What differs, and why |
|---|---|
| The inventory status badges, the quantity cell, the close short and transfer cancel dialogs, the stock transfer and purchase order forms' details, the stock locations table (7) | Nothing |
| The supplier sheet, Edit | The story's country field shows its placeholder in a state the screen does not reach |
| The variant link, the receive delivery card, the stock receipts card, the variant line editor | The browser tests' products have no image, so the screen draws the package icon where the story draws a picture. The rows' heights follow: the screen's product names wrap onto two lines in the card's narrower column. In the line editor, the icon's outline takes the colour and size of its own row's text. The variant link is 299 pixels wide in its table cell and 1,248 alone in the story |
| The inventory cells | The story draws the cells alone, so the first of them takes the row's first-cell padding, 16 pixels, and the screen's, after the product cell, 8; the screen's row is taller because of the product's thumbnail. The other 9 elements on the screen only are that product cell |
| The stock levels panel, the stock history card in a location's sheet, the location's edit sheet | The sheet sets its text at 13 pixels and the story's frame at 14, so the panel's text, line heights and heights follow; the story lists more products than the destination warehouse holds, and its last row is another row, so its bottom border falls elsewhere. The screen's history has a second page, and its pagination is the 14 elements on the screen only; the sheet's country field holds a value in the story and none on the screen |
| Earlier: Empty, With action (G-01) | The empty state takes its content from the screen: the line editor's package icon, its two-line wording and an outline button, where the story shows the API keys page's key icon and a filled button |
| Earlier: Input group, Currency prefix; Input, Number; Textarea, Filled (G-01) | The purchase order form sets its own width and right alignment on the cost and quantity fields, 144 and 80 pixels, where the stories fill their 320-pixel frame; the cost field shows the currency's code before the amount, where the story shows its sign before and its code after |
| Earlier: Country state fields, Selected; Currency select, Disabled (G-33) | Only the width: the supplier's sheet and the purchase order form are wider and narrower than the stories' frame |
| Earlier: Resource combobox, Open and Searched (G-33) | The supplier list offers "New supplier" at its foot, which the story's list has no reason to; the list's height follows |
| Earlier: Store date picker, Date empty, Date chosen and Date choosing (G-53) | The purchase order form draws the trigger without a shadow and at the form's width; the open calendar matches with no difference |
| Earlier: Money, Dollars (G-58) | The screen's amount sits in a table cell and the story's alone in a span, so the compared elements are the cell and the span |
| Earlier: Resource picker sheet, Picking, Searching and No results (G-58) | The transfer's picker has no description under its title, so its header is shorter and the list taller; it has a clear button in its search; the row compared is checked on the screen and not in the story, hence the checkbox's colours; the products have no image |

All 15 earlier stories leave their gap: four G-01, four G-33, three G-53 and four G-58. The three store date picker stories leave G-53 because the purchase order form draws its dates in the popover mode, the mode the stories draw. The image review list's earlier stories section names each one.

### 4.2 Corrections

The comparison found one difference in a story: the stock receipts card's Two deliveries story listed the later delivery first, and the running screen lists deliveries in the order they were booked, since the endpoint names no order and the database's own decides. The story's fixture was corrected in `bb83f4b1`, and its two reference images were written again; each was looked at beside the image it replaced, and only the order of the two deliveries changed. Four comparison locators were corrected in the same commit, so that every case reached its component; no story changed for them.

## 5. Behaviour found, recorded and not changed

What the running screens and the source showed that the work item did not expect. Each is recorded as Spree's behaviour, as it is; whether to track one as a defect is the owner's, apart from SD-23, which the audit thread confirmed and LIQ-004 records.

| # | Behaviour | Where seen | Effect |
|---|---|---|---|
| B1 | The purchase order list's Overdue filter, with Overdue kept and On time cleared, shows "No purchase orders yet": the list sends the scope as a list of values, and Spree refuses it with 400, "wrong number of arguments". The Past cancel-by filter sends its scope the same way (read in code) | DA-INV-06 filtered-overdue; `packages/dashboard/src/tables/purchase-orders.tsx` | SD-23 |
| B2 | The list's columns menu offers only the columns shown by default, so the Cancel by, Overdue and Past cancel-by columns the table defines cannot be shown | DA-INV-06 columns-menu | SD-23 |
| B3 | A purchase order past its expected and cancel-by dates reads only "Ordered" on its page; the dates are shown, but nothing says it is late | DA-INV-08 overdue | Part of SD-23's effect: late orders are found only by reading each one |
| B4 | Roles that may only read a resource are offered its writes: the stock viewer keeps a location's fields and Save, the stock levels panel's inputs and Save buttons, a supplier's sheet with Save, and the Receive a delivery card; the purchaser keeps a location's fields and Save; the purchaser and the stock viewer reach the new transfer page, and the merchandiser and the stock viewer the new purchase order page, each with its whole form and Create draft. The stock levels panel checks no permission (`stock-levels-panel.tsx`) | DA-SET-18 edit, for the purchaser and the stock viewer, and edit-stock-levels, DA-INV-10 edit, DA-INV-04 in-transit and DA-INV-08 ordered for the stock viewer; DA-INV-03 and DA-INV-07 direct visits | What the server answers is NOT_RUN and joins G-11 (§3.2) |
| B5 | A supplier name already used is refused by Spree, but the refusal is a toast drawn beneath the open sheet, so nothing shows: the sheet stays open with no field error | DA-INV-10 name-taken | The merchant is not told why the supplier was not saved. The same kind of behaviour as SD-7 |
| B6 | A direct visit by a role that may not read a list shows its empty state, "No purchase orders yet" and the like, as if the store had none; the purchase order list still offers Export, to the merchandiser and the order manager | DA-SET-18, DA-INV-01, DA-INV-02, DA-INV-06 and DA-INV-10 direct visits | As B3 of part 3 |
| B7 | A transfer's page opened by a role without `read_stock` reads "This transfer could not be loaded. Missing permission: read_stock" with Try again, which cannot succeed; a purchase order's page opened by a role without `read_purchasing` reads the same with that permission | DA-INV-04 direct-visit, for the order manager; DA-INV-08 direct-visit, for the merchandiser | The message names the permission; the button does not help |
| B8 | On a new transfer, choosing the source warehouse as the destination too makes the destination field show the location's identifier, `sloc_…`, rather than its name, beside "The two warehouses must be different.", because the destination list no longer offers it | DA-INV-03 same-warehouse | The field reads as a code |
| B9 | A transfer's empty lines, once a source is chosen, read "Add the products this order is for.", a purchase order's wording (`admin.inventory_lines.empty_description`) | DA-INV-03 and the line editor's stories | Wording only |
| B10 | The stock levels panel names its inputs "On hand for …" and "Backorderable for …" in English in the code, not through the dashboard's translations (`stock-levels-panel.tsx`, lines 245 and 252) | Read in code | A screen reader hears English in every language |
| B11 | The receive delivery card always draws its quantity cells editable, so no running screen draws the cell read-only; the cell's read-only state is reached only in its story | DA-INV-04 and DA-INV-08, every role that sees the card | The story is checked against its source |
| B12 | The stock receipts card reads "No deliveries yet" while its request is loading, since it has no loading state; it shows an error when the request fails | Read in code (`stock-receipts-card.tsx`) | For a moment the card says something false |
| B13 | The inventory list's Available is on hand less allocated and reserved, and goes below zero when more is held than is there: the browser tests' reserved row reads on hand 0, reserved 3, available −3. The source says this is on purpose | DA-INV-01 filtered-reserved | Shown, as the source intends |
| B14 | The Admin API's `available_count` is on hand less allocated, not the list's Available, which is its `purchasable_count`; during G-78's hold the API read available 1 while the list read 0 | G-78's check (§8.1); Spree's stock level serializer and model | Two figures named "available" for a developer to tell apart |
| B15 | The Admin API accepted a purchase order with expected and cancel-by dates in the past, so the state the work item expected to be refused was reached (§6) | DA-INV-08 overdue | None; the work item's expectation is corrected |
| B16 | The stock movements tables on a transfer's page and in a location's sheet scroll sideways at 1280 pixels, so their last column, what happened, starts off screen | DA-INV-04 received, DA-SET-18 edit-history | The reason for each change is out of sight until scrolled |
| B17 | On the storefront, a cart whose item Spree removed because a checkout holds it opens at checkout as "Your Cart is Empty", with no reason. Spree's answer carried a `line_item_removed` warning, "… was removed because it was sold out", and the storefront shows no alert or message for it. The first shopper's `delivery_unavailable` warning was not shown either | G-78's check (§8.1), storefront `ad77c3d` | The shopper loses the item without being told why |
| B18 | On the storefront, a product page keeps saying "In Stock" with Add to Cart while another checkout holds the last unit, for as long as its page is cached, ten minutes; the Store API already answers `in_stock: false`. Adding it is refused with a toast that quotes Spree's message, "Quantity selected of … is not available." | G-78's check (§8.1), storefront `ad77c3d` | The shopper is refused only after trying |

**SD-23, recorded as an existing defect.** B1 to B3: the purchase order list cannot show which orders are late. Proposed severity High: a staff member cannot find late orders on the list. Confirmed with the audit thread, which keeps the register, and recorded in LIQ-004's [existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline). Neither Spree's specs nor its browser tests send the two scopes. Batch 6 keeps the behaviour as it is; a fix decision is after the baseline, in its own pull request. It is not a security or tenant-isolation finding.

B17 and B18 are the storefront's, found by G-78's check; they belong with the storefront's batches and are recorded here because this batch found them.

## 6. Corrections to the work item

Recorded in the work item's status, without changing the proposal's text:
- §2.1's DA-INV-01 "none, with no location and with no variant": the browser-test data has both, and the batch adds no store, so the empty list is reached by answering the list's request with the server's own response, emptied (G-86).
- §2.1's DA-INV-06 "overdue and past cancel-by": the list cannot show either (SD-23). The Overdue filter is captured as it shows, the columns menu as it offers, and an order past both dates on its own page (DA-INV-08 overdue).
- §7, choice 3, and §8's "a purchase order past its cancel-by date, if the server refuses a past date": the Admin API accepted past dates, so the state was reached on the running server (B15).
- §2.3 and §7, choice 5, "G-78 waits for the owner's answer": the owner approved G-78's proposal on 2026-11-04 (row 31), and its check ran as this batch's last step (§8.1).
- §3's "14 components": confirmed against the running screens. The stock history card, which part 1 gave stories, gained stories for its three scopes, because the location's sheet and the two documents' pages hold it.
- §4's size estimate: 102 stories and 204 reference images, against about 90 and 180; 132 captures, against about 120.

## 7. Gaps

Each names what is missing, the check made instead and what would close it. Batch 6's gaps are G-85 to G-87 in LIQ-004's [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), numbered after part 3's G-81 to G-84 with the audit thread. Answering a gap is the owner's, not part of the delegated acceptance, so each stays OPEN with its proposal until the owner answers. The work item's known gaps (§8) are among them or closed: the inventory list after a transfer or a delivery is in G-87; a past cancel-by date was reached (§6); the states reached in the browser are G-86; the behaviours no browser test drives are G-87; what the server refuses joins G-11; a checkout holding stock is G-78, met in §8.1; stock moved by orders is batch 8's. Tenant isolation is an outstanding item, not a gap.

| Gap | Check made instead | What would close it | Proposal | Status |
|---|---|---|---|---|
| G-85: 85 of the 102 stories not compared by the script | 58 show a state seen in a running-screen capture; 27 checked against their source only. Each is named in the [image review list](2026-11-04-fb-19-batch-inventory-image-review.md) | Running screens that show those states | Defer, as G-58 and G-81: each story keeps the comparison status the image review list gives it, and the later batch whose running screen first shows the state compares it, under the [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches). A seller's stock locations go to batch 13 | OPEN, for the owner's answer |
| G-86: 13 states reached by answering or holding a request in the browser (§2.1) | Each capture says how its state was reached; none shows words the batch wrote | A server that answers so | Accept as simulated interface-state coverage only, as G-54, G-59 and G-82 | OPEN, for the owner's answer |
| G-87: the 12 behaviours no browser test drives (§2.3) | The captures of each, and Spree's specs for the server's side | A browser test for each | Defer to the platform batch's browser-test work, step [P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), as G-61 and G-84 were. Behaviour 11 stays with SD-23 | OPEN, for the owner's answer |
| The narrower roles' requests beyond Spree's specs (§3.2) | The interface's behaviour (§3.1) | P10's check of the requests in §3.2 | Join G-11, as the owner answered on 2026-11-04 for the applicable refusals (row 31) | Joined to G-11 for P10; G-11 stays open |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap | Unchanged: NOT_RUN |

**Earlier gaps this batch changes.** G-78 meets its closing condition (§8.1). Of the 15 earlier stories compared in §4.1, four leave G-01, four G-33, three G-53 and four G-58. G-11 gains batch 6's requests.

## 8. Stock outside the dashboard (criterion 15)

| Where stock takes effect | Who checks it | Status |
|---|---|---|
| The storefront's stock messages: in stock, low and sold out on product pages and lists | Batch 4, the storefront shop, accepted | Captured there. B18 adds what the product page shows while another checkout holds the last unit |
| A checkout holding stock, and a second shopper refused it | Batch 6, at the owner's approval of G-78 (row 31) | Met, at both widths (§8.1) |
| Orders: allocating, shipping, cancelling and returning, and the movements they write | Batch 8, with FL-06 | Not this batch's. The stock history captures show the allocation and adjustment rows the browser tests' data has, and claim nothing about orders |
| A seller's stock locations and stock (SP-SET-05 and the seller panel) | Batch 13 | Not this batch's |
| Stock locations as delivery origins | Batch 7, accepted | Not changed by this batch |
| Low-stock emails and notifications | None exist | Read in the code at `b926ee4b`, no mailer or template mentions stock |

### 8.1 G-78: an item held by one checkout and refused to a second shopper

**The owner's condition.** On 2026-11-04 the owner approved G-78's proposal for this batch (row 31 of the owner decision brief, recorded in #65): "batch 6's record shows the second shopper's checkout refusing the held item, at both widths, with what the server answered".

**What ran.** `g-78-stock-hold.spec.ts`, at the storefront's two widths, 1280 by 960 and 390 by 844, in the pinned image. One fresh product, "Fidelity stoneware teapot", SKU `FID-TEAPOT`, was added through the Admin API on the store's online channel, with stock only at the shop location, at 0 and not backorderable, so no hold left by an earlier run could count. At each width:
1. The admin set the shop location's on-hand count to 1 on the inventory list, with the reason Count.
2. A second shopper put the teapot in their cart.
3. A first shopper put it in their cart and entered checkout as a guest, with an email and a shipping address, which is when Spree holds stock for a cart.
4. The inventory list showed the unit reserved.
5. A third shopper opened the teapot's page and added it.
6. The second shopper went to checkout from their cart.

Afterwards the first shopper's item was removed through the Store API, which gave the hold back, and the count was set to 0 again; the product was deleted at the end. No order was placed and nothing was paid. Every shopper, email and address is invented. The browser-test data offers no delivery method for a physical item, so the first shopper's checkout lists no rate and no payment method; the hold does not depend on either. Each width's three shoppers had their own carts, and the third shopper's cart was new.

**What the server answered, the same at both widths.**

| Step | Stock level, as the Admin API read it | What the screen showed, and the Store API's answer |
|---|---|---|
| 1. Count set to 1 | On hand 1, reserved 0 | "Stock updated"; the list reads on hand 1, available 1 |
| 2. Second shopper's cart | On hand 1, reserved 0 | The cart drawer with the teapot |
| 3. First shopper in checkout | On hand 1, reserved 1 | Checkout with the email and address saved, and no message. The hold is Spree's reservation for that cart. Spree's answers to this cart carried a `delivery_unavailable` warning, "Fidelity stoneware teapot cannot be delivered to the selected address", when the item was added and again once the address was saved, since the data has no delivery method for it; the page did not show it |
| 4. Inventory list | On hand 1, reserved 1 | Reserved 1, available 0 (B14) |
| 5. Third shopper | On hand 1, reserved 1 | The Store API's product answered `in_stock: false`, `purchasable: false`; the page, from its cache, still read "In Stock" with Add to Cart enabled. Adding it was refused: 422, `validation_error`, "Quantity selected of "Fidelity stoneware teapot" is not available.", shown in a toast (B18) |
| 6. Second shopper's checkout | On hand 1, reserved 1 | The Store API answered the cart with 200, a `line_item_removed` warning, "Fidelity stoneware teapot was removed because it was sold out", no items and a quantity of 0. Checkout showed "Your Cart is Empty" and nothing else (B17) |
| Afterwards | On hand 1, reserved 0 | The hold given back when the first shopper's item was removed |

**Result.** At both widths, the second shopper's checkout refused the held item: Spree took it out of their cart because the first shopper's checkout held the last unit, and said so in its answer. The condition is met, and G-78 closes on this evidence, as the owner's answer provides. What the storefront shows the second shopper, an empty cart without the reason, is B17, recorded and not changed. The check shows one hold and one refusal at one revision; it does not show what happens when a hold expires, which needs Spree's expiry job, not run by the browser-test server.

**Evidence.** The [evidence index](evidence/2026-11-04-fb-19-batch-inventory/README.md#g-78-stock-hold) lists the 14 captures, seven at each width, and each width's `answers.json`: the stock level after each step, what each page said, and the Store API's answers to the shoppers' cart requests. No key, cart token or password is recorded.

## 9. CI runs and local checks

**CI.** At `99751176`, the pull request's runs passed Tests, on PostgreSQL and MySQL, with Spree's dashboard browser tests in four shards, among them the 31 tests of §2.2, and Packages. The runs on the final commit, the visual check twice, once from the pull request and once started by hand, with Tests and Packages, are named in the merge record, as criterion 8 asks. If any of them fails, nothing is merged.

The visual check stays advisory: it runs on every pull request, and nothing approves a changed screenshot automatically. CI does not run the capture, comparison or G-78 scripts, which were run locally (§2, §4, §8.1).

**The browser-test database was emptied by Spree's API specs, as planned.** Spree's API specs use the same SQLite database as the browser-test server, so they ran after every capture and the comparison, with the server stopped (§3.2). G-78's check ran later, against a server started again and seeded afresh.

**Local checks, in this session.** After `main` was merged at `99751176`, lint (Biome, 383 files), the package's type check, the 70 fixture tests and the token check passed, and the Storybook built, with 1,504 stories in all. In the pinned image, the visual check of batch 6's 102 stories ran in update mode and wrote their 204 reference images. The first runs stopped on play functions that did not finish in six stories, which were corrected before any image was kept; the corrected stories then passed, and the two receipts card images were written again after §4.2's correction. Every new image was looked at in both themes, on contact sheets of light beside dark. Two full local runs of the visual check were stopped before the end, at 1,441 of 2,748 and 2,298 of 3,008, the second by a restart of this session's machine, with no failure up to there; the full check is counted only in CI.

**Before each push.** `scratchpad/tools/secrets.sh` searched every line the pull request adds, in the text files it adds or changes, for the shapes of keys, tokens and passwords, and for the local values the batch used, among them the browser-test server's publishable key; nothing matched. The link check found every relative link in the changed records resolving to a file and, for links with an anchor, a heading.

## 10. Limitations

- **Coverage is not functional verification.** A capture shows one state of a screen at one moment. Only Spree's browser tests, run in CI, and Spree's specs show behaviour, and only for what they drive (§2.2, §2.3).
- **The data was added through the Admin API.** The transfers, purchase orders and deliveries were created and moved through their statuses by the Admin API on the browser-test database. They show the screens' states; they say nothing about orders, which are batch 8's.
- **Simulated states.** 13 states were reached by answering or holding a request in the browser (G-86). They show what the interface draws; they claim nothing about the server.
- **The roles' requests were not sent.** §3.1 records what each role is shown; what the server would answer is NOT_RUN (§3.2, G-11).
- **G-78's check is one run of one hold.** It ran against the browser-test server, whose data has no delivery method for a physical item and which does not run Spree's expiry job, so an expired hold was not shown. Real payment and delivery providers stay with P4.
- **The comparison is diagnostic.** It informs the review of the images and does not decide it. Its style figures come from the browser's computed styles of the compared elements.
- **One browser, one size.** The captures use the pinned image's Chromium at 1280 pixels, and 390 for the three phone captures and G-78's phone width. Other browsers and sizes are not checked.
- **Tenant isolation is not checked** (§3.3).
- **The verifier is not independent.** This record was written by the automated session that built the batch, and the acceptance is delegated, not the owner's review.

## 11. Evidence

The [evidence index](evidence/2026-11-04-fb-19-batch-inventory/README.md) lists the captures with their notes, the comparison's side-by-sides and styles, G-78's captures and answers, and Spree's spec results, as lossless WebP and JSON. The [image review list](2026-11-04-fb-19-batch-inventory-image-review.md) names every reference image, with its earlier stories section.

## 12. Delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Build dashboard inventory (batch 6)" |
| Revision | #64's final commit, which the merge record names. Its stories and fixtures are those of `bb83f4b1`, its reference images those of `47d14284` with the two receipts card images of `bb83f4b1`, and its scripts those of the records commit; every later commit changes Liquorify's records only, or brings in `main` |
| Scope | Criterion 11: the 204 reference images of the [image review list](2026-11-04-fb-19-batch-inventory-image-review.md), each looked at in light and dark (§9); the running-screen evidence of §2 and §3.1; fidelity, judged from the comparison of §4, 17 cases and 15 earlier stories with every difference explained; and the evidence of G-78's check (§8.1). Technical acceptance of criteria 1 to 10 and 12 to 15 as this record gives them. Criterion 8 counts the two full visual runs on the final revision, which the merge record names; if either fails, or Tests or Packages fails, nothing is merged |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status the owner has not decided. G-85 to G-87 stay OPEN for the owner's answers, with their handling proposed, not decided; the narrower roles' requests join G-11 for P10, as the owner answered, and G-11 stays open. G-78 closes because its check met the condition the owner set. SD-23 stays open with its proposed severity. B1 to B18 stay recorded as Spree's and the storefront's behaviour, and whether to track any other of them as a defect is the owner's. Whether Liquorify must keep stock records Spree does not is deferred with Liquorify's own work. Tenant isolation stays NOT_RUN (§3.3), ISO-1 to ISO-7 stay open, and FB-03's result stays with the owner. The work item stays PROPOSED and LIQ-004 DRAFT |

What the checks did not show stays as §10 states it. In lane C, P9 follows batch 6.
