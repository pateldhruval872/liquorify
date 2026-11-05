---
title: FB-19 batch, orders, returns and fulfilment
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-05
updated: 2026-11-05
---

# FB-19 batch: orders, returns and fulfilment

Batch 8 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): the dashboard's side of [LIQ-006 §6](../LIQ-006-product-capability-baseline.md#6-cart-checkout-and-orders), with the order emails. It reproduces what Spree already has for the order lists, draft orders made by staff, the order page with its payments, discounts, fees, taxes and notes, editing a placed order's items, fulfilment with tracking and labels, and returns, exchanges and claims. It also checks, on real orders, the settings that batches 3, 5, 6, 7 and 9 handed to it. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-05 under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)). It is the next item in lane C, after batch 6 and SD-21's fix, as LIQ-004's lane table sets out. It depends on the catalog (all three parts merged), inventory (batch 6, merged on 2026-11-05), and payments and delivery (batch 7, merged on 2026-11-04). It has no question that needs the owner now: its choices are planning within the batch's scope, which LIQ-004 set as "§6 in the dashboard, with the order emails", and are recorded in §7 as decided under the delegation, never as the owner's answers. One finding read in the code while preparing it, that nothing sends the payment link email (§2.7), is checked on the running stack in part 1 and brought to the owner if confirmed. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 6](fb-19-batch-inventory.md) and [batch 7](fb-19-batch-payments-delivery-and-tax.md). Before its stories land, the Storybook visual check runs in four parts (#75), because one job took up to 51 minutes for 3,008 comparisons against a 60-minute limit. This work item stays PROPOSED until it is accepted under D5. Part 1, the order and its money, was built in #80 ([verification record](../verification/2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md)). §2.7's finding was confirmed on the running stack: nothing sends the payment link email, and its link does not open checkout. It is held for the owner's decision as SD-32 (row 39 of the owner decision brief), and FL-08 is traced as far as its draft steps. The record's §6 lists the corrections to this proposal for part 1: a card payment's failed checks and its details dialog, which only the second store's data has, shown in stories only; a taxability reason, which no rate names; the downloads card's expired and used-up links, shown in stories only; the risky order, reached in the browser; and the negotiated price, captured on a draft. Part 2 follows in its own pull request. The proposal's text below is unchanged.

## 1. Outcome and summary

Every order, fulfilment and after-sale screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch traces FL-06, FL-07 and FL-08 step by step, with FL-06's storefront step on the running storefront and FL-08's as far as the code allows (§2.7), renders the eight order emails, and checks each setting other batches handed to "batch 8, on real orders".

- **In two parts** (§7, choice 1). Part 1 is the order and its money: the lists, drafts, the new order page, the order page's header, payments, discounts, fees, taxes, customer and notes, and editing items. Part 2 is what happens after the sale: fulfilment, tracking and labels, and returns, exchanges and claims with their lists.
- **Bounded:** 8 screens, 3 flows and the order steps of 3 more, 8 emails, 5 browser test files and 42 new components: 20 in part 1 and 22 in part 2. Each part is one implementation pull request with its own merge record.
- **Same shape as batches 6 and 7:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; on real orders, by the batch's own scripted checks of the settings handed to it, which are evidence and not browser tests (criterion 16). Behaviours no browser test drives are listed for the owner's answer, as G-87's were.

## 2. Scope

LIQ-006 §6's dashboard capabilities, the order parts of CAP-07-01 and CAP-07-06, every screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the flows that run through them.

| Capability | Screens | Flows | Browser tests | Part |
|---|---|---|---|---|
| CAP-06-03 Orders, with separate payment and fulfilment statuses | DA-ORD-01 Orders; DA-ORD-04 Order | FL-05's last two steps, handed over by batch 9 | `orders-list.spec.ts` (6 tests); `orders.spec.ts`: "lists completed orders with the New Order CTA", "New Order CTA on the orders list navigates to the new-order page" | 1; the fulfilment statuses in 2 |
| CAP-06-04 Draft orders created by staff, and payment links | DA-ORD-02 Draft orders; DA-ORD-03 New order; EM-C-03 | FL-08 | `orders.spec.ts`: the "draft orders" and "new order" tests; `customers.spec.ts`: "shows no orders on the profile of a customer who has not ordered", which makes an order on DA-ORD-03 | 1 |
| CAP-06-05 Editing a placed order's items, with a totals preview | DA-ORD-05 Edit order items | None | `orders.spec.ts`: "returns to the order view after saving" | 1 |
| CAP-06-06 Order tags, internal notes and special instructions | DA-ORD-04's sidebar cards | None | `orders.spec.ts`: "tags an order and offers the tag on another order" | 1 |
| CAP-06-08 Fees | DA-ORD-04's fees card | None | None found | 1 |
| CAP-07-01 Refunds and payments on an order | DA-ORD-04's payments card and its details dialog | FL-08's payment | `orders.spec.ts`: the two "order payments" tests | 1 |
| CAP-07-06 Fulfilment: labels, deliveries and tracking | DA-ORD-04's fulfilments card; EM-C-05, EM-SF-03 | FL-06 | `order-fulfillments.spec.ts` (5 tests) | 2 |
| CAP-06-07 Returns, exchanges and claims | DA-ORD-04's after-sale cards; DA-ORD-06 Returns, DA-ORD-07 Exchanges, DA-ORD-08 Claims; EM-C-06 | FL-07 | `post-sale.spec.ts` (3 tests) | 2 |

The order steps of three flows other batches mapped are checked here too: FL-05's DA-ORD-01 and DA-ORD-04, which batch 9 handed over; FL-16's DA-ORD-04 discounts, which part 3 of the catalog batch handed over; and FL-17's gift card on an order. CAP-06-09, the shopper's order history, was mapped by the shopper accounts batch; this batch adds only FL-06's last step on SF-ACC-06.

### 2.1 Meaningful states to capture, part 1

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-ORD-04 is also captured on a narrow screen, since its sidebar stacks under the main column.

| Screen | States |
|---|---|
| DA-ORD-01 Orders | Listed, with each payment and fulfilment status the data reaches; searched by number, by billing name and by SKU; filtered by payment status, fulfilment status, total, channel, currency and tags; sorted by total; the export dialog; none |
| DA-ORD-02 Draft orders | Listed; none |
| DA-ORD-03 New order | The empty form; a customer chosen, with the default addresses switch; an email typed instead; a company chosen, with its help; variants added; a coupon code; the channel picker when the store has more than one channel; a refused save with its errors. The purchase order number and document fields are captured as the form shows them; CAP-09-05 itself is batch 12's (§2.6) |
| DA-ORD-04 Order, the order and its money | A draft, with no tracking or label controls, its complete and delete actions and their confirmations; a placed order, unpaid, authorized, paid, partly refunded and refunded; a canceled order, with its reason, note and who canceled it; a risky order awaiting approval, and approved; the header's menu with preview and resend confirmation; the cancel dialog with the store's cancellation reasons, a note, the refund and email choices; the payments card empty, with a card payment's failed checks, with capture and void offered, and its details dialog with checks and captures; the add payment dialog, with a method needing a saved card and no customer; the taxes card with included and added tax, with no rate matched, and with a taxability reason; the discounts card empty and with a promotion and a manual discount, and its add dialog by amount and by percent with the preview; the fees card empty and with a fee, and its add dialog; the sidebar's discount code and gift card dialogs, a gift card applied, store credit applied and requiring a customer; the customer card with a customer, with an email only and with neither, and the address edit dialog; tags, special instructions and the internal note, viewed and edited; the logistics card with freight figures, complete and incomplete; the purchase order card empty and with a number and document; the downloads card with available, expired and used-up links, the reset confirmation and resend; custom fields and metadata as the order shows them; loading; the page failing to load |
| DA-ORD-05 Edit order items | Items listed with prices and totals; a quantity changed and an item removed, not yet saved; the add product dialog; a negotiated unit price, kept and reset; a quantity below what was already fulfilled, refused; the totals preview; a fully fulfilled order, which cannot be edited; unsaved changes |

### 2.2 Meaningful states to capture, part 2

| Screen | States |
|---|---|
| DA-ORD-04 Order, fulfilment | A draft's unclaimed items, with the hint that they can be fulfilled once placed; a placed order with items still to fulfil, and the add fulfilment dialog; one fulfilment ready, with its location, delivery method and cost; the fulfil form, all units and some, with a tracking number and the notify switch; fulfilled, with its tracking; tracking added, edited and removed, with each carrier status the data reaches; marked delivered; the edit dialog changing the origin and method, with "move and re-quote" and no rates; split into a second fulfilment, and a split that would empty it refused; a label uploaded, with its postage, and deleted; shipping documents; the packing slip; a backordered fulfilment; a canceled fulfilment after its confirmation; fulfilments from two locations; a line priced by a price list or catalog |
| DA-ORD-04 Order, after the sale | The returns, exchanges and claims cards empty, with nothing yet returnable, and with records; the create return dialog with return locations and reasons; a return requested, approved, received with some units not resellable, and refunded or completed, with its refund dialog by original payment and by store credit, nothing owed, and tax included in the refund; a return canceled; an exchange requested, approved, received and fulfilled, with its replacement variant and price difference; a claim opened, approved, resolved by refund, store credit or replacement, and denied; the cancel confirmations |
| DA-ORD-06 Returns | Listed, with each status the data reaches; searched; none |
| DA-ORD-07 Exchanges | Listed; none |
| DA-ORD-08 Claims | Listed; none |

### 2.3 Permission variants

Spree's catalog splits an order's work into four scopes: `orders` for the order, its items, discounts, fees, tax lines, returns, exchanges, claims and digital links; `payments`; `fulfillments`, with labels and deliveries; and `refunds`. Five roles cover them, in both parts:

- **Admin role:** every screen with every control.
- **A role made from the order manager template,** with write on orders, payments, fulfilments, refunds, gift cards and store credit, and read on customers: every order screen editable.
- **A role made from the support template,** with read on orders, customers and the home page, and nothing on payments, fulfilments or refunds: every order screen, with what the payments, fulfilment and after-sale cards show to a role that may read the order but not its money or shipments recorded as each screen shows them, since earlier batches found screens that keep controls the server then refuses.
- **A custom packer role,** with read on orders and write on fulfilments, and nothing on payments or refunds: fulfilment editable, with the payment, refund and after-sale controls recorded as each screen shows them.
- **A role made from the merchandiser template, which holds no order scope:** the order entries hidden, and a direct visit to each order screen recorded as it shows.

### 2.4 Emails

| Email | When Spree sends it | How it is rendered | Part |
|---|---|---|---|
| EM-C-02 Order canceled | `order.canceled` | Spree's mailer preview, `Spree::OrderPreview#cancel_email` | 1 |
| EM-C-03 Payment link | LIQ-008 says staff send it. Read in the code at `08bca2e2`, nothing does (§2.7) | Spree's mailer, called directly as its own spec calls it, since it has no preview | 1 |
| EM-C-07 Digital files ready | `order.placed` for downloadable items, and the downloads card's resend | `Spree::DigitalAssetPreview#files_ready_email` | 1 |
| EM-O-01 New order notification | `order.placed`, to the store | `Spree::OrderPreview#store_owner_notification_email` | 1 |
| EM-SF-02 The storefront's order canceled | The storefront receives `order.canceled` | By the storefront's webhook handler on a signed event from the browser-test server, as batch 9 did for EM-SF-01; otherwise by the same call the handler makes | 1 |
| EM-C-05 Shipment sent | A fulfilment ships | `Spree::FulfillmentPreview#fulfilled_email` | 2 |
| EM-C-06 Return refunded | A return is refunded | `Spree::ReturnPreview#refunded_email` | 2 |
| EM-SF-03 The storefront's shipment shipped | The storefront receives `order.fulfilled` | As EM-SF-02 | 2 |

Spree's emails are rendered in the browser-test app's test environment with the emails gem loaded, against a copy of this lane's database inside a transaction that is rolled back, as batch 9 rendered EM-C-01, and captured at 390 and 1280 pixels in the pinned Playwright image. Whether Spree sends them on the running stack is not shown: the browser-test server does not load the emails gem (G-77), and sending through a mail service stays with G-16. The storefront writes its emails to a file because no mail service key is set; sending through Resend is not run. EM-C-01 and EM-SF-01 were batch 9's.

### 2.5 Settings checked on real orders

Each setting below was saved and captured in its own batch, which handed its effect on orders to batch 8. Each is saved through its dashboard screen on the browser-test server and then seen, or not, on a real order, with captures of both sides and the result recorded per setting (criterion 16). An order is placed through the storefront, as batch 9 did, or made on DA-ORD-03 and completed, whichever the setting needs.

| Setting | Handed over by | What is checked | Part |
|---|---|---|---|
| Order number format | Batch 3 (G-38) | A new order's number follows the store's setting | 1 |
| Cancellation reasons | Batch 3 (G-38) | The cancel dialog offers the store's reasons, and the canceled order shows the one chosen | 1 |
| A payment captured later, when the store or method does not charge at checkout | Batch 7 (G-71), batch 9 (R1007's authorized payment) | An authorized payment captured from the order's payments card, and the order's payment status after it | 1 |
| Tax categories and rates, included or added | Batch 7 (G-71) | The order's tax lines and totals, for a store that includes tax and one that adds it | 1 |
| A promotion and a coupon code | Catalog part 3 (FL-16) | The order's discounts card and summary | 1 |
| A gift card and store credit | Catalog part 3 (FL-17) | The order's discounts and credit card and payments | 1 |
| Digital delivery and a product's files | Batch 7 (G-71), catalog part 1 | The order's downloads card, and the shopper's download through the link, read from the server's answer | 1 |
| A method that charges on dispatch | Batch 7 (G-71) | A payment captured when the order's fulfilment ships | 2 |
| A method's tracking address | Batch 7 (G-71) | The tracking link a fulfilment shows | 2 |
| A method's fulfilment provider | Batch 7 (G-71) | The provider a fulfilment records | 2 |
| Origin groups, the default profile and a channel's order routing rules | Batch 7 (G-71), batch 3 (G-38) | Which location each fulfilment ships from, and an order split across locations | 2 |
| Return reasons and a location's returns setting | Batch 3 (G-38), batch 6 | The create return dialog's reasons and locations, and where returned units go | 2 |
| Tax on a refund | Batch 7 (G-71) | The tax a return's refund includes | 2 |
| Stock moved by orders | Batch 6 | The inventory list and a location's history after an order is placed, shipped, canceled before shipping and returned | 2 |

Labels bought through EasyPost, and refunds through a real gateway, need providers the browser-test server does not load; they stay with P4, as decision 5 set out, with G-26 and CAP-07-07.

### 2.6 Left out, and where it goes

- **Marketplace orders:** the order page's marketplace, seller transfers and commission cards (`order-marketplace-card`, `order-seller-transfers-card`, `order-commission-lines-card`), an order group's "part of a larger purchase" note and its completion as several orders, and EM-C-04 and EM-O-02. They belong to LIQ-006 §10 (CAP-10-05 to CAP-10-07), which LIQ-004 gives batch 13, as part 1 of the catalog batch left the seller's submitted products there (§7, choice 2).
- **Purchase order numbers and negotiated prices as a wholesale capability (CAP-09-05):** batch 12. This batch captures the fields and cards as the order screens show them, since every order page shows the purchase order card, and does not map the capability.
- **The shopper's checkout and order pages:** batch 9 and the shopper accounts batch. This batch adds FL-08's checkout through a payment link and FL-06's shipped order on SF-ACC-06 only.
- **A customer's orders card and the home page's order figures:** batches 10 and 11.
- **Buying labels and real-gateway refunds:** P4 (§2.5).
- **The remaining emails:** batch 11, and the marketplace ones batch 13.

### 2.7 Found while preparing this proposal: nothing sends a payment link

LIQ-008 records FL-08 as a staff-created order paid by link, DA-ORD-03 → DA-ORD-02 → DA-ORD-04 → EM-C-03 → SF-CHK-01 → SF-CHK-03, and EM-C-03 as sent when "staff send a payment link for an order". Read in the code at `08bca2e2`, two things do not hold:

- **Nothing calls `Spree::OrderMailer#payment_link_email`.** No Admin API endpoint, event subscriber, job or dashboard action sends it, and the admin SDK has no call for it. Only the mailer's own specs and the rendered-emails spec call it directly. Spree's developer docs list the template's variables and no way to send it.
- **The link's address may not open checkout.** The mailer builds `<storefront>/checkout/<order token>/payment`. The storefront's checkout page is `/<country>/<locale>/checkout/<cart id>`, with no `payment` page under it.

This is read in the code only. Part 1 checks both on the running stack: whether any screen or endpoint sends the email, and what the storefront answers for the link the mailer builds. If either is confirmed, part 1 records it and brings it to the owner before it is settled, as a candidate existing defect or as a correction to LIQ-008's FL-08 and EM-C-03, since it changes what FL-08 can show. Until then FL-08 is traced as far as its draft steps, and its payment steps are not promised.

## 3. Components

The screens use 42 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the eight screens and their table definitions import at `main` `08bca2e2`, followed through the components they import in turn, less the three marketplace cards (§2.6); the first step of each part confirms it against the running screens.

| Part | Layer | New in this part |
|---|---|---|
| 1 | Admin dashboard, `orders/` (CMP-DA-G-11) | `line-item-dialogs`, `order-adjustments-cards`, `order-cancel-dialog`, `order-customer-card`, `order-discounts-sidebar-card`, `order-edit-items-table`, `order-header`, `order-logistics-card`, `order-notes-cards`, `order-payments-card`, `order-purchase-order-card`, `order-skeleton`, `order-summary-card`, `payment-details-dialog` |
| 1 | Admin dashboard, top level (CMP-DA-G-24) | `actor-label`, `channel-select`, `order-digital-links-card`, `reason-field` |
| 1 | Design system, composed (CMP-DUI-C) | `editable-note-card` (18), `order-cancel-dialog` (32) |
| 2 | Admin dashboard, `orders/` (CMP-DA-G-11) | `fulfillment-deliveries`, `fulfillment-delivery-dialog`, `fulfillment-edit-dialog`, `fulfillment-fulfill-form`, `fulfillment-label-upload-dialog`, `fulfillments-card`, `line-item-price-source`, `shipping-documents`, `shipping-label-row` |
| 2 | Admin dashboard, top level (CMP-DA-G-24) | `order-post-sale-cards`, `order-returns-card`, `post-sale-create-dialogs` |
| 2 | Design system, composed (CMP-DUI-C) | `claim-resolve-dialog` (08), `delivery-form-dialog` (16), `fulfill-items-form` (23), `fulfillment-edit-dialog` (24), `fulfillment-item-list` (25), `fulfillment-panel` (26), `label-upload-dialog` (29), `post-sale-create-dialogs` (33), `post-sale-fields` (34), `return-dialogs` (43) |

The fulfilments card holds the order's items, so every order page capture in part 1 shows it; its stories are part 2's, and part 1's comparisons leave it out.

**Already covered, reused here:** `resource-table`, `table-toolbar`, `page-header`, `slot`, `can`, `confirm-dialog`, `address-form-dialog`, `address-block`, `country-combobox`, `country-state-fields`, `export-button`, `file-upload-field`, `locale-select`, `money`, `resource-combobox`, `resource-layout`, `route-error-boundary`, `store-date-picker`, `tag-combobox`, `tag-list`, `custom-fields-inline`, `metadata-card`, `company-combobox-option`, `form-actions`, `json-preview-drawer`, `relative-time`, `search-input`, `back-button`, `external-link`, and the primitives from earlier batches, among them `alert`, `badge`, `button`, `card`, `checkbox`, `combobox`, `dialog`, `empty`, `field`, `input-group`, `input`, `item`, `pagination`, `rich-text-editor`, `select`, `switch`, `textarea`, `thumbnail`, `toast` and `tooltip`.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies: each part's image review list has a section for stories held by G-01, G-33, G-53, G-58, G-65, G-81 or G-85 that one of its running screens shows, compared by the script as the batch's own stories are, each with the gap it came from. A story compared there leaves its gap; the rest keep the status their gap gave them.

## 4. Delivery

- **Two backend pull requests, one per part** (§7, choice 1), each with its stories, fixtures and mocks, reference images, capture and comparison scripts, verification record, image review list, evidence index and LIQ-009's Storybook column, and each followed by its merge record. Part 2 starts from `main` once part 1 has merged. This thread pushes to one branch, so its pull requests go one after another, which the coordinating session agreed on 2026-11-05.
- **Merge order:** LIQ-004's queue on `main` comes first. The coordinating session places each pull request before it merges; #75, the visual check in parts, merges before part 1's pull request.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batches 6 and 7 ran, in this lane's own checkout, database and ports. The roles in §2.3, and the orders, payments, fulfilments, returns, exchanges and claims each state needs, are added through the Admin API on that server's database only, or placed through the storefront where a setting needs a real checkout (§2.5).
- **The storefront:** built at its `main` and run against the same server for FL-06's and FL-08's storefront steps and the storefront emails, as batch 9 and G-78's check ran. It is not changed, and no storefront pull request is expected. If a storefront story turns out to be needed, it goes in its own storefront pull request.
- **Evidence logs** are saved as `.txt`, because the root `.gitignore` drops `*.log`. Local and CI results are reported apart.

**Size, estimated from batches 6 and 7:** part 1 about 150 stories and 300 reference images, and about 130 running-screen captures; part 2 about 160 stories and 320 reference images, and about 140 captures. With part 1 the visual check reaches about 3,300 comparisons, and with part 2 about 3,600, about 900 in each of the four parts.

## 5. Acceptance criteria

Batch 6's criteria applied to each part, with criterion 12 naming this batch's specs, criterion 15 the behaviours no test drives, and two added: criterion 16 for the settings handed to this batch, and criterion 17 for the emails. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the part's screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 or §2.2 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.3 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | The part's flows are traced step by step to their screens, and the browser tests covering these screens pass on the part's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the part's endpoints, runs them at the part's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. Part 1: the Admin API controller specs for orders, their items, payments, refunds, discounts, discount codes, gift cards, store credits, fees, tax lines and digital links, and order completion, approval and cancellation, with the matching integration specs, and the order, payment, refund, adjustment and digital link model specs with their workflows. Part 2: fulfilments, deliveries, labels, returns, exchanges and claims, with their integration specs and the fulfilment, delivery, shipping label, return, exchange, claim and stock movement model specs with their workflows. The order and fulfilment mailer specs are run with the email of each part |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email, card and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Payment settings, publishable keys and webhook signing secrets are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-57's and G-87's were. None is counted as tested | The record's list |
| 16 | Each setting in §2.5 for the part is saved through its dashboard screen and seen, or not, on a real order, with captures of both sides and the result recorded per setting. A setting that needs a provider the browser-test server does not load is recorded with who checks it | Captures and the record |
| 17 | Each email in §2.4 for the part is rendered and captured at 390 and 1280 pixels, with the mailer specs run, and whether it was sent is recorded, or kept as a gap | The emails section |

## 6. Flow steps

### FL-08, a staff-created order paid by link (part 1)

| Step | Browser tests |
|---|---|
| DA-ORD-03: make a draft for a customer, with items | `orders.spec.ts`: "creates a draft order with email + variant and lands on the detail page", "carries a PO number and its document onto the created order" |
| DA-ORD-02: the draft listed | `orders.spec.ts`: "newly-created draft shows up in the drafts list" |
| DA-ORD-04: the draft, sending the payment link | None, and read in the code nothing sends it (§2.7). Checked on the running stack |
| EM-C-03: the payment link email | None: rendered by calling the mailer (§2.4) |
| SF-CHK-01 to SF-CHK-03: the customer pays through the link | None in Spree's or the storefront's tests. The link the mailer builds is opened on the running storefront and what it answers is recorded (§2.7); the payment steps are shown only if the link opens checkout |

### FL-06, fulfilling an order (part 2)

| Step | Browser tests |
|---|---|
| DA-ORD-04: the items still to fulfil, and a fulfilment added | `order-fulfillments.spec.ts`: "lists the unclaimed line item on a draft with no shipping address", "does not offer manual creation on an incomplete order", "lists item rows without per-row actions", "offers no tracking or label controls on a draft" |
| DA-ORD-04: fulfil, with tracking | Read in the tests so far, none fulfils an order: a gap |
| DA-ORD-04: a label | `order-fulfillments.spec.ts`: "uploads a label bought elsewhere onto a placed order". Buying one is P4's |
| DA-ORD-04: deliveries | None found: a gap |
| EM-C-05 or EM-SF-03 | None: rendered (§2.4) |
| SF-ACC-06: the shopper sees the shipment and its tracking | None: shown on the running storefront by the batch's script |

### FL-07, a return, exchange or claim (part 2)

| Step | Browser tests |
|---|---|
| DA-ORD-04: a return from request to refund | `post-sale.spec.ts`: "takes a return from request to refund, and lists it store-wide" |
| DA-ORD-04: a claim opened and denied | `post-sale.spec.ts`: "opens a claim for a missing item, denies it, and lists it store-wide" |
| DA-ORD-04: an exchange | None found: a gap. `post-sale.spec.ts`: "lists exchanges store-wide" lists them only |
| DA-ORD-06 to DA-ORD-08 | The three tests above, each listing its records store-wide |
| EM-C-06 | None: rendered (§2.4) |

The rest of the batch is in no flow. Its browser tests: `orders-list.spec.ts` (6 tests), and `orders.spec.ts`'s "deletes a draft order from its actions menu", "sets a negotiated unit price on a draft order line", "saves an edited shipping address onto the order", "tags an order and offers the tag on another order" and its two "order payments" tests.

## 7. Choices made under the owner's delegation

Batch 8 has no question that needs the owner. Its choices are planning within the batch's approved scope, which the owner's delegation of 2026-11-04 lets the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **Two parts, each one implementation pull request.** The batch has 42 new components, twice batch 7's 21, and eight emails. The order page splits cleanly between the order and its money, and what happens after the sale, and part 2's after-sale states need placed and fulfilled orders that part 1's screens make. Two parts keep each review near the size of batch 7's, as the catalog batch's parts did. One pull request would save a merge cycle but double the size of the review and of a failing CI run.
2. **The marketplace cards stay with batch 13, and CAP-09-05 with batch 12.** LIQ-004 gives batch 8 "§6 in the dashboard"; the marketplace cards serve LIQ-006 §10 and the purchase order and negotiated price capability §9. This follows the owner's answer of 2026-11-02 for the catalog batch, which left the seller's submitted products to batch 13. The purchase order card is still given stories here, because every order page shows it.
3. **States are reached through the Admin API, or a real checkout,** on the browser-test database only, as every batch has done. A state the Admin API cannot reach is checked against its source and recorded as a coverage gap; a state reached by answering a request in the browser says so.
4. **One custom role, the packer,** beside the order manager, support and merchandiser templates (§2.3), because no template splits fulfilment from money, and Spree's catalog keeps them apart on purpose.
5. **Settings handed to batch 8 are checked as evidence, not as browser tests** (§2.5). Each is shown once on a real order, with what the server answered. Adding browser tests for them would be platform batch work, as P9 is for earlier batches; the record lists any that need one for the owner's answer (criterion 15).
6. **The storefront is run, not changed.** FL-06's and FL-08's storefront steps and the storefront emails use the storefront's `main` against the same server, as batch 9 and G-78's check did.

What stays with the owner: what §2.7's finding becomes if part 1 confirms it, the answers to the gaps each part's record lists, and anything a part finds that would change scope, a defect or a criterion, which comes back to the owner before it is settled. Tenant isolation stays NOT_RUN: FB-03's validation is separate, and this batch claims nothing about it.

## 8. Gaps known before the work starts

Recorded now so none is lost. Each part's record says which it closes. Gap numbers are given when the records are written, after G-87.

| Gap | What would close it |
|---|---|
| No browser test fulfils an order, records a delivery, makes an exchange, sends a payment link, adds a fee or a manual discount, applies a discount code, gift card or store credit on DA-ORD-04, captures or voids a payment, cancels a placed order, approves a risky order, or resets or resends digital links. Read in the tests so far | This batch's captures show the states; each part's record lists them for the owner's answer (criterion 15), as G-57 and G-87 were |
| Nothing sends EM-C-03, and the link it builds may not open checkout, read in the code (§2.7) | Checked on the running stack in part 1; if confirmed, brought to the owner before it is settled |
| FL-06's shipment on SF-ACC-06 has no browser test in either repository | Shown on the running storefront by the batch's script, which is not a browser test; listed for the owner's answer |
| States the Admin API cannot reach, or that need a provider the server does not load: a bought label and its refund, a carrier's status updates, a real gateway's refund | Checked against their source, and recorded as coverage gaps; the provider parts stay with P4 |
| States reached only by answering a request in the browser, such as the page failing to load | Recorded as simulated interface-state coverage, as G-54 and G-86 were |
| Whether Spree sends each order email on the running stack | Joins G-16 and G-77: the browser-test server does not load the emails gem, and sending through a mail service is deferred (decision 22) |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, whose refusal checks are platform step P10 |
| Marketplace orders and CAP-09-05 | Batches 13 and 12 (§2.6) |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. The batch claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens and the storefront change orders, payments and stock on the browser-test server, which is local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.
