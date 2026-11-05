---
title: FB-19 batch, inventory
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-04
updated: 2026-11-04
---

# FB-19 batch: inventory

Batch 6 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): the stock a store holds and the ways it changes, from [LIQ-006 §7](../LIQ-006-product-capability-baseline.md#7-payments-delivery-inventory-and-tax). It reproduces what Spree already has for stock locations, stock levels, stock transfers between locations, suppliers and purchase orders. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-04 under the owner's delegation of that day ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)). It is the next item in lane C, after batch 7 and multi-store administration, as the coordinating session and the audit thread agreed on 2026-11-04. It has no question that needs the owner: its choices are planning within the batch's scope, which LIQ-004 set as CAP-07-09 and CAP-07-10, and are recorded in §7 as decided under the delegation, never as the owner's answers. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 7](fb-19-batch-payments-delivery-and-tax.md). This work item stays PROPOSED until it is accepted under D5. Built in #64 ([verification record](../verification/2026-11-04-fb-19-batch-inventory.md)). On 2026-11-04 the owner approved G-78's check for this batch (row 31 of the owner decision brief), so it ran as the batch's last step, not as §7's choice 5 had it. The record's §6 lists the corrections to this proposal: the inventory list's empty state reached in the browser, the purchase order list's late orders, which it cannot show (SD-23), a past cancel-by date, which the server accepted, G-78's check, and the size, 102 stories and 132 captures. The proposal's text below is unchanged.

## 1. Outcome and summary

Every inventory screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch also traces FL-14, moving stock between locations, and FL-15, buying stock from a supplier, step by step to their screens and browser tests.

- **Bounded:** 11 screens, 2 flows, no email, 6 browser test files and 14 new components, in one implementation pull request (§7).
- **Same shape as batch 7:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs. Where stock takes effect somewhere else, on the storefront, at checkout or on orders, the batch names who checks it (criterion 15) and claims nothing itself.

## 2. Scope

LIQ-006's CAP-07-09 and CAP-07-10, every screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the two flows that run through them.

| Capability (LIQ-006 §7) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-07-09 Stock locations, stock levels, reservations | DA-SET-18 Stock locations, with the stock levels and history a location's sheet shows; DA-INV-01 Inventory | FL-14's and FL-15's last step, the stock on DA-INV-01 | `stock-locations.spec.ts`; `inventory.spec.ts` |
| CAP-07-10 Stock transfers, purchase orders, suppliers | DA-INV-02 to DA-INV-05, the transfers; DA-INV-06 to DA-INV-09, the purchase orders; DA-INV-10 Suppliers | FL-14; FL-15 | `stock-transfers.spec.ts`; `inventory-line-picker.spec.ts`; `purchase-orders.spec.ts`; `suppliers.spec.ts` |

Reservations are the stock a checkout holds. The dashboard shows them as the inventory list's "Reserved" column and its "Has reserved" filter, which this batch captures with the browser tests' own reserved fixture. What a shopper meets is batch 9's, where G-78 holds it (§2.3).

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-INV-04 and DA-INV-08 are also captured on a narrow screen, since their sidebar stacks under the main column.

| Screen | States |
|---|---|
| DA-SET-18 Stock locations | Listed, with the default location; none; the create sheet with its four sections (details, behaviour, pickup, returns); edit, with the location's stock levels panel, a low-stock marker and a backorderable row; the stock levels panel searched with no match; the location's stock history; a save refused with its errors; delete confirmation |
| DA-INV-01 Inventory | Listed per location, with on hand, committed, reserved, available and incoming; each column's explanation; filtered by stock status and by location; a row with stock on its way; the on-hand count opened for correction, set and adjusted, with a reason; a purchase order raised from a row; none, with no location and with no variant |
| DA-INV-02 Stock transfers | Listed, with each status the browser tests reach; none; the delete confirmation for a draft |
| DA-INV-03 New transfer | The empty form; lines added through the line picker, one pass with several products; a refused save with its field errors; prefilled from a variant |
| DA-INV-04 Transfer | Draft, with its planned lines and actions; ready to ship; in transit, with the receive card; a delivery counted with damage; partially received over two deliveries, each its own receipt; received; over received; closed short; the cancel dialog for a transfer in flight, asking what happened to units already gone; canceled; the page failing to load |
| DA-INV-05 Edit transfer | A draft corrected; a shipped transfer, which cannot be edited |
| DA-INV-06 Purchase orders | Listed, with each status the browser tests reach; filtered by status and supplier; overdue and past cancel-by; the import dialog; none; the delete confirmation for a draft |
| DA-INV-07 New purchase order | The empty form; a supplier added from the form; lines with costs; a refused save with its field errors; prefilled from an inventory row |
| DA-INV-08 Purchase order | Draft; ordered, after the place confirmation; partially received; received; over received; closed short; the cancel confirmation; canceled; the page failing to load |
| DA-INV-09 Edit purchase order | A draft corrected; a line without a cost refused; a placed order, which cannot be edited |
| DA-INV-10 Suppliers | Listed; none; the add sheet; a name required; edit; delete confirmation for a supplier without purchasing history; a supplier with history, whose delete is not offered |

### 2.2 Permission variants

Spree's catalog keeps stock and purchasing apart: `stock` covers locations, levels, movements, transfers, reservations and receipts, and `purchasing` covers suppliers, purchase orders and their receipts, so that moving stock does not also mean ordering from suppliers. DA-SET-18 opens with `stock` or `settings`. Five variants cover them:

- **Admin role:** every screen with every control.
- **A role made from the merchandiser template,** with write on products, categories, collections and stock and nothing on purchasing: the inventory, transfers and stock locations editable, and the purchase order and supplier entries hidden, with a direct visit to each recorded as it shows. The inventory row's "raise a purchase order" action is recorded as the screen shows it to this role.
- **A custom role with read on stock, purchasing and products, and write on nothing:** every screen, with create, edit, delete, correction and status controls recorded as each screen shows them, since earlier batches found screens that keep controls the server then refuses.
- **A custom role with write on purchasing, and read on stock and products:** the purchase orders and suppliers editable and the transfers read-only, recorded as each screen shows them. Receiving a purchase order books a stock receipt, which both scopes cover; what the screen offers this role is recorded.
- **A role made from the order manager template, which holds neither scope:** the inventory entries hidden, and a direct visit to each screen recorded as it shows.

### 2.3 Left out, and where it goes

- **What a shopper meets when stock is held, low or gone:** the storefront's stock messages are batch 4's, and a checkout holding stock is batch 9's. G-78, PENDING with the owner, proposes that batch 6 show one checkout holding an item and a second refused it on the storefront; this batch runs that check only once the owner answers G-78 (§7, choice 5).
- **Stock moved by orders:** shipping, cancelling and returning an order, and the stock movements they write, are batch 8's, with FL-06.
- **Stock on the product page:** the inventory card and its per-location counts were part 1 of the catalog batch's, and `stock-history-card` has its stories from it.
- **Stock locations as shipping origins:** batch 7 captured the delivery profile's origin groups, and `stock-location-scope-field` has its story from batch 3.
- **Importing purchase orders:** the import wizard's stories are part 2 of the catalog batch's. This batch captures the wizard opened from the purchase order list; a purchase order file imported end to end is recorded as a behaviour no browser test drives, if that is what the batch finds (criterion 15).
- **A seller's stock locations and stock (SP-SET-05 and the seller panel's stock):** batch 13.
- **Low-stock emails and notifications:** none. Read in the code at `b926ee4b`, no mailer or email template mentions stock levels, transfers, suppliers or purchase orders. The store's low-stock threshold, which the inventory list's "Low stock" filter reads, is a store setting that batch 3 captured.

## 3. Components

The screens use 14 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the 11 screens and their table definitions import at `main` `b926ee4b`, followed through the components they import in turn; the batch's first step confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Framework pages (CMP-CORE-PG) | `stock-locations` (03) |
| Admin dashboard (CMP-DA-G-24, top level) | `close-short-dialog`, `inventory-cells`, `inventory-status-badge`, `purchase-order-form`, `quantity-cell`, `receive-delivery-card`, `stock-levels-panel`, `stock-receipts-card`, `stock-transfer-form`, `supplier-sheet`, `transfer-cancel-dialog`, `variant-line-editor`, `variant-link` |

`inventory-cells` holds the inventory list's on-hand and incoming cells, with the correction popover; `variant-line-editor` is the line picker the transfer and purchase order forms share; `stock-levels-panel` is the stock a location's sheet lists.

**Already covered, reused here:** `resource-table`, `page-header`, `slot`, `can`, `confirm-dialog`, `row-actions`, `row-click-bridge`, `resource-layout`, `route-pending`, `stock-history-card`, `import-wizard-dialog`, `choice-card-picker`, `country-combobox`, `country-state-fields`, `currency-select`, `resource-combobox`, `resource-picker-sheet`, `store-date-picker`, `export-button`, `import-button`, `money`, and the primitives from earlier batches, including `sheet`, `dialog`, `popover`, `collapsible`, `select`, `switch`, `input-group`, `textarea`, `table`, `status-badge`, `badge`, `thumbnail`, `relative-time`, `error-state`, `empty` and `pagination`.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies: the image review list has a section for stories held by G-01, G-33, G-53, G-58 or G-65 that one of this batch's running screens shows, compared by the script as the batch's own stories are, each with the gap it came from. A story compared there leaves its gap; the rest keep the status their gap gave them.

## 4. Delivery

- **One backend pull request** (§7, choice 1): stories, fixtures and mocks, reference images, the capture and comparison scripts, the verification record, the image review list, the evidence index, and LIQ-009's Storybook column. It builds on `main` and merges after part 3 of the catalog batch (§7, choice 2).
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batch 7 ran, in this lane's own checkout, database and ports. The roles in §2.2, and the locations, suppliers, transfers, purchase orders and deliveries each state needs, are added through the Admin API on that server's database only.
- **Emails:** none. These screens send no email.

**Size, estimated from batch 7:** about 90 stories and 180 reference images, and about 120 running-screen captures with their computed styles. Batch 7 came to 158 stories for 21 components; the transfer and purchase order pages here have more statuses each but fewer components.

## 5. Acceptance criteria

Batch 7's criteria applied to this batch, with criterion 14 about invented data and criterion 15 naming who checks stock's effect elsewhere. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components and browser tests, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-14 and FL-15 are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. For this batch: the Admin API controller specs for stock locations, stock levels, stock transfers and their status changes and receipts, suppliers, purchase orders and their status changes and receipts; the matching integration specs; the stock location, stock item or level, stock movement, stock transfer, stock receipt, supplier and purchase order model specs, with their workflows |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, supplier, address and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push | The search's result in the record |
| 15 | Every effect of stock outside the dashboard is listed with the batch or step that checks it: the storefront (batch 4), checkout (batch 9, G-78), orders (batch 8). Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-57's were. None is claimed here | The record's hand-off section |

## 6. Flow steps

### FL-14, moving stock between locations

| Step | Browser tests |
|---|---|
| DA-INV-03: raise a draft with lines | `stock-transfers.spec.ts`: "raises a draft from the form, packs it and sends it"; `inventory-line-picker.spec.ts` (4 tests) |
| DA-INV-04: mark ready, then send | `stock-transfers.spec.ts`: "raises a draft from the form, packs it and sends it", "sends a draft, then counts in a delivery with damage" |
| DA-INV-04: receive, in one or more deliveries | `stock-transfers.spec.ts`: "sends a draft, then counts in a delivery with damage", "counts a transfer in over two deliveries, each its own stock receipt" |
| DA-INV-04: cancel a transfer in flight | `stock-transfers.spec.ts`: "makes the merchant say what happened to units already gone" |
| DA-INV-01: the moved stock on the inventory list | Read in the tests so far, none checks the list after a transfer: a gap, with this batch's captures |

### FL-15, buying stock from a supplier

| Step | Browser tests |
|---|---|
| DA-INV-10: add a supplier | `suppliers.spec.ts`: "adds a supplier and edits their contact" |
| DA-INV-07: raise a draft | `purchase-orders.spec.ts`: "raises a draft from the form and places it with the supplier" |
| DA-INV-08: place it with the supplier | The same test |
| DA-INV-08: receive deliveries, or close short | `purchase-orders.spec.ts`: "counts in part of a delivery, then closes the order short", "books each delivery as its own stock receipt" |
| DA-INV-01: the received stock on the inventory list | Read in the tests so far, none checks the list after a delivery: a gap, with this batch's captures |

The rest of the batch is in no flow. Its browser tests: `inventory.spec.ts` (6 tests), `stock-transfers.spec.ts` ("lists transfers", "offers the create form", "a draft can be corrected, a shipped one cannot"), `purchase-orders.spec.ts` ("corrects a draft, but not into a line without a cost", "cancels a placed order after confirming", "deletes a draft from the list"), `suppliers.spec.ts` ("lists suppliers", "a supplier needs a name", "deletes a supplier with no purchasing history") and `stock-locations.spec.ts` (4 tests).

## 7. Choices made under the owner's delegation

Batch 6 has no question that needs the owner. Its choices are planning within the batch's approved scope, which the owner's delegation of 2026-11-04 lets the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **One implementation pull request.** The batch has 11 screens and 14 new components, smaller in components than batch 7, which was one pull request. The alternative, stock locations and transfers first and then suppliers and purchase orders, would add a pull request and a review without reducing risk.
2. **Batch 6 builds beside part 3 of the catalog batch, and merges after it.** LIQ-004 makes batch 6 depend on the catalog. Its screens show the products and variants of part 1, and its purchase order list opens part 2's import wizard; both parts are merged. None of part 3's promotions, gift cards or store credit, and none of its components, appear on an inventory screen, so waiting for part 3 would delay batch 6 without changing it. Batch 6's pull request merges after part 3's (#61), is brought up to date from `main` after that merge, and reruns its affected checks there.
3. **States are reached through the Admin API,** on the browser-test database only, as every batch has done: the locations, suppliers, transfers, purchase orders and their deliveries. A state the Admin API cannot reach, such as a purchase order past its cancel-by date if the server refuses a past date, is checked against its source and recorded as a coverage gap.
4. **Two custom roles,** a stock viewer and a purchaser (§2.2), beside the merchandiser and order manager templates, because no template covers purchasing and the two scopes are separate on purpose.
5. **G-78 waits for the owner's answer.** G-78 is PENDING with the owner, with batch 6 as its proposed follow-up. This batch does not answer a gap, so it does not run that check yet. If the owner approves G-78's proposal, the check runs as the last step of this batch, or as its own follow-up if this batch has merged by then, with the storefront built against the same server.

What stays with the owner: G-78's answer, the answers to the gaps this batch's record lists, and anything the record finds that would change scope, a defect or a criterion. Tenant isolation stays NOT_RUN: FB-03's validation is separate, and this batch claims nothing about it.

## 8. Gaps known before the work starts

Recorded now so none is lost. The batch's record says which it closes.

| Gap | What would close it |
|---|---|
| No browser test checks the inventory list after a transfer or a delivery (FL-14 and FL-15's last steps) | This batch's captures show the states; the gap stays for the tests, for the owner's answer (criterion 15) |
| States the Admin API cannot reach, such as a purchase order past its cancel-by date, if the server refuses one | Checked against their source, and recorded as coverage gaps |
| States reached only by answering a request in the browser, such as the page failing to load | Recorded as simulated interface-state coverage, as G-54 was |
| Behaviours no browser test drives. Read in the tests so far: the purchase order list's filters, overdue and past cancel-by; importing and exporting purchase orders; a supplier with purchasing history, whose delete is not offered; the stock locations' stock levels panel and its search; a transfer's over-received status | Listed in the record (criterion 15) for the owner's answer, as G-57 was |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, whose refusal checks are platform step P10 |
| A checkout holding stock, as a shopper meets it | G-78, PENDING with the owner (§7, choice 5) |
| Stock moved by orders, shipping and returns | Batch 8 |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. None of the open findings concerns stock; the batch claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change stock on the browser-test server, which is local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
