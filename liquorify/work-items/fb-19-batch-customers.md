---
title: FB-19 batch, customers in the dashboard
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-09
updated: 2026-11-09
---

# FB-19 batch: customers in the dashboard

Batch 10 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): the dashboard's side of [LIQ-006 §8](../LIQ-006-product-capability-baseline.md#8-customers-and-shopper-accounts), CAP-08-02 to CAP-08-06, with the two customer emails those capabilities own. It reproduces what Spree already has for the customer list, a customer's page with its profile, addresses, groups, orders, lifetime figures, store credit, tax identifiers, internal note and privacy actions, and customer groups. It also takes the pieces earlier batches handed to it: the customer import, the issue store credit dialog opened from a customer's page, a customer's orders card on real orders and a customer's tax identifiers. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-09 under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)), after the owner asked on 2026-11-09 for batches 10 and 11 to start within the approved Spree baseline scope, each with its scope and acceptance criteria set before implementation. It depends on orders (batch 8, complete on 2026-11-08). It runs beside batch 11, home figures, reports and the email template editor, in its own thread, and the two agreed which emails each takes (§2.4). It has no question that needs the owner now: its choices are planning within the batch's scope, which LIQ-004 set as "Customers in the dashboard (CAP-08-02 to CAP-08-06)", and are recorded in §7 as decided under the delegation, never as the owner's answers. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 6](fb-19-batch-inventory.md) and [batch 8](fb-19-batch-orders-returns-and-fulfilment.md). This work item stays PROPOSED until it is accepted under D5.

**Tenant isolation is the open question on these screens.** ISO-1 to ISO-3 are about the customer list and a shopper's record, and ISO-7 about a customer's order totals ([LIQ-004](../LIQ-004-foundation-backlog.md)). FB-03's validation ran privately on 2026-11-04 and its result, with who owns a shopper account, waits for the owner. This batch captures what Spree's screens show inside one store and claims nothing about other stores or about whose shopper a record is (criterion 13, §7 choice 6).

## 1. Outcome and summary

Every customer screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch traces FL-23 step by step and FL-21's customer entry, renders the two customer emails, and shows on real records each piece an earlier batch handed to "batch 10".

- **One part, one implementation pull request** (§7, choice 1): 3 screens, 1 flow and the customer steps of 2 more, 2 emails, 3 browser test files and 13 new components.
- **Same shape as batches 6 and 8:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; for the hand-offs, by the batch's own scripted checks on the browser-test server, which are evidence and not browser tests (criterion 16). Behaviours no browser test drives are listed for the owner's answer, as G-87's and G-90's were.

## 2. Scope

LIQ-006 §8's dashboard capabilities, the customer part of CAP-07-12, every screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the flows that run through them.

| Capability | Screens | Flows | Browser tests |
|---|---|---|---|
| CAP-08-02 Customer records for staff: profile, addresses, groups, tags, lifetime figures, store credit, internal notes | DA-CUS-01 Customers; DA-CUS-02 Customer | FL-21's customer entry: DA-CUS-01 → DA-OVL-05 | `customers-list.spec.ts` (4 tests); `customers.spec.ts` (15 tests, less the two privacy tests); `store-credits.spec.ts`: "opens a credit and follows it to the customer" |
| CAP-08-03 Customer groups | DA-CUS-03 Customer groups; the groups card and the list's bulk group actions | FL-10's staff step, adding a customer to the Wholesale group, as a group membership only (§2.5) | `customer-groups.spec.ts` (5 tests); `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" |
| CAP-08-04 Wishlists | None: no dashboard screen, and no storefront page at this revision | None | None. Spree's Store API specs only (criterion 12) |
| CAP-08-05 Newsletter sign-ups with email confirmation | DA-CUS-01's newsletter column and filter; DA-CUS-02's marketing line and the profile sheet's switch; EM-C-10 | None | `customers-list.spec.ts`: "filters by newsletter subscription" |
| CAP-08-06 Data privacy: exports, erasure, consent records | DA-CUS-02's privacy card; EM-C-09 | FL-23 | `customers.spec.ts`: "erases a customer and says so afterwards", "keeps erased customers out of the list until asked for" |
| CAP-07-12 Tax identifiers, the customer's part, handed over by batch 7 | DA-CUS-02's tax identifiers card | None | None found |

CAP-08-01, the shopper's own account, was mapped by the shopper accounts batch and is not repeated. A customer's orders card shows orders batch 8 captured; this batch captures the card, not the orders.

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-CUS-02 is also captured on a narrow screen, since its sidebar stacks under the main column.

| Screen | States |
|---|---|
| DA-CUS-01 Customers | Listed, with orders, total spent and last order; searched by name and by email; filtered by group, company, tags, newsletter, phone and erased; erased customers shown when asked for; sorted by email; the optional columns shown; rows selected, with the bulk group and tag actions and each of their four dialogs; the new customer sheet, empty, filled and refused with its errors; the export dialog; the import wizard opened from the list, with a customer file's column mapping, progress and results; none |
| DA-CUS-02 Customer | A customer with orders, with the last order card, the orders card's "view all" link, lifetime figures and tags in the header; a customer with no orders; the profile card with phone and marketing consent, and its edit sheet, saved and refused; the groups card empty and with groups, and its edit sheet; the addresses card empty and with addresses, default billing and shipping, the row menu, the add and edit address dialog and the delete confirmation; the store credit card empty and with credits, the issue dialog opened from it, the edit dialog and the delete confirmation; the tax identifiers card empty, with an identifier not checked and with one nothing can check, the add and edit sheet, a refused save, and the delete confirmation; the internal note empty, viewed and edited; the privacy card with a consent date, the export, the erase confirmation, and an erased customer with its badge, blanked fields, "erase again" and no export; custom fields defined for customers, empty and filled; metadata; the JSON drawer; loading; the page failing to load |
| DA-CUS-03 Customer groups | Listed with member counts; the create sheet, empty, filled and refused; the edit sheet with its link to the filtered customers; the delete confirmation; none |

### 2.2 Permission variants

Spree's catalog puts customers, customer groups, addresses, tax identifiers and privacy requests under one scope, `customers`; a customer's store credit is `store_credits`, and its orders `orders`. No role template holds write on customers. Five variants cover them:

- **Admin role:** every screen with every control.
- **A role made from the order manager template,** with read on customers and write on orders and store credits: every customer screen, with the profile, groups, addresses, tax identifiers, note, privacy and bulk controls recorded as each screen shows them, and the store credit card's controls, which this role may use.
- **A role made from the support template,** with read on orders, customers and the home page: every customer screen read-only, with the write controls recorded as each screen shows them, since earlier batches found screens that keep controls the server then refuses.
- **A custom customer manager role,** with write on customers and nothing on orders or store credits: the customer screens editable, with the orders and store credit cards recorded as each screen shows them to a role that may not read them.
- **A role made from the merchandiser template, which holds no customer scope:** the customer entries hidden, and a direct visit to each screen recorded as it shows.

### 2.3 Hand-offs from earlier batches

Each piece below was handed to "batch 10" by an earlier batch's record. Each is shown on the browser-test server, with captures and the result recorded per piece (criterion 16).

| Piece | Handed over by | What is shown |
|---|---|---|
| A customer's tax identifiers (CAP-07-12) | Batch 7 | The card's states (§2.1), with an identifier added, edited, checked where a validator exists, and deleted |
| The customer import, opened from DA-CUS-01, and what it writes | Catalog part 2 (FL-21) | A small customer file imported through the wizard, and the customers it adds seen on DA-CUS-01 and DA-CUS-02 |
| The issue store credit dialog opened from a customer's page | Catalog part 3 (G-81) | The dialog on DA-CUS-02, its story compared with the running screen, and the credit it issues seen on the card and in the lifetime figures |
| A customer's store credit card | Catalog part 3 | The card's states (§2.1) |
| Spree's customer erasure specs | Catalog part 3 (row 20 of its record) | Run under criterion 12 |
| A customer's orders card | Batch 8 | The card with real orders made through the Admin API and completed, and its "view all" link opening the order list filtered to the customer |
| A customer field defined on the custom fields screen | Batch 3 (DA-SET-09) | A field defined for customers, then seen and filled on DA-CUS-02 |

### 2.4 Emails

| Email | When Spree sends it | How it is rendered |
|---|---|---|
| EM-C-09 Data export ready | `data_request.completed`, for an access request whose file is ready, when the store sends customer emails. The privacy card's export downloads the file directly and makes no such request; read in the code at `05b7c95b`, only the Admin API's data requests and the Store API make one | Spree's mailer preview, `Spree::CustomerPreview#data_export_email` |
| EM-C-10 Newsletter confirmation | `newsletter_subscriber.subscribed`, when someone subscribes through the Store API. The storefront has no sign-up form at its `main` | `Spree::NewsletterPreview#email_confirmation` |

Spree's emails are rendered in the browser-test app's test environment with the emails gem loaded, against a copy of this lane's database inside a transaction that is rolled back, as batch 8 rendered its order emails, and captured at 390 and 1280 pixels in the pinned Playwright image. Whether Spree sends them on the running stack is not shown: the browser-test server does not load the emails gem (G-77), and sending through a mail service stays with G-16. EM-C-11, the company invitation, stays with the company screens in batch 12, and batch 11 maps every email ID to the batch that rendered it; both threads agreed this on 2026-11-09.

### 2.5 Left out, and where it goes

- **Companies (DA-CUS-04, DA-CUS-05), their tax exemption certificates and EM-C-11:** batch 12, wholesale, with CAP-09-01, which LIQ-006 places in §9 (§7, choice 2). The customer list's company column and filter are captured here as the list shows them.
- **Wholesale applications and approval (FL-10, CAP-09-03):** batch 12. This batch captures adding a customer to a group, which is FL-10's staff step, and claims nothing about what a wholesale buyer then sees.
- **Signing up for the newsletter and keeping a wishlist as a shopper:** no storefront page at its `main`. The Store API's endpoints are mapped to Spree's specs only (criterion 12), and no storefront page is added.
- **Data requests made through the Admin API or the Store API:** no dashboard screen makes one. They are mapped to Spree's specs (criterion 12), and EM-C-09 is rendered (§2.4).
- **The shopper's own account pages:** the shopper accounts batch, accepted.
- **Store credits as a list (DA-LOY-02) and its dialogs' own stories:** part 3 of the catalog batch, accepted. This batch compares the issue dialog opened from a customer's page (§2.3).
- **The home page's customer figures:** batch 11.
- **Whether a store's customer data stays in that store, and who owns a shopper account:** FB-03 and the owner (criterion 13).

## 3. Components

The screens use 13 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the three screens and their table definitions import at `main` `05b7c95b`, followed through the components they import in turn; the batch's first step confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Admin dashboard, `customers/` (CMP-DA-G-07) | `customer-addresses-card`, `customer-groups-card`, `customer-internal-note-card`, `customer-last-order-card`, `customer-lifetime-stats-card`, `customer-orders-card`, `customer-privacy-card`, `customer-profile-card`, `customer-store-credits-card`, `customer-tax-identifiers-card` |
| Admin dashboard, top level (CMP-DA-G-24) | `tax-identifiers-card` |
| Design system, composed (CMP-DUI-C) | `address-book-row` (02), `tax-identifiers-card` (51) |

`address-book-row` and the design system's `tax-identifiers-card` are shared with the company page and the seller panel, which are batches 12 and 13; their stories here use a customer's data, and those batches reuse them. The customer list's new customer sheet and bulk dialogs, and the customer groups page's sheet, are written inside their route files rather than as components, so they are captured on the running screens and have no story of their own.

**Already covered, reused here:** `resource-table`, `table-toolbar`, `page-header`, `slot`, `can`, `confirm-dialog`, `bulk-dialog`, `bulk-action-bar`, `row-actions`, `resource-layout`, `route-pending`, `route-error-boundary`, `address-form-dialog`, `address-block`, `country-combobox`, `country-state-fields`, `currency-select`, `export-button`, `import-button`, `import-wizard-dialog`, `money`, `resource-combobox`, `resource-multi-autocomplete`, `tag-combobox`, `tag-list`, `custom-fields-inline`, `metadata-card`, `json-preview-drawer`, `relative-time`, `editable-note-card`, the store credit dialogs, and the primitives from earlier batches, among them `badge`, `button`, `card`, `checkbox`, `combobox`, `dialog`, `dropdown-menu`, `field`, `input`, `item`, `rich-text-editor`, `sheet`, `status-badge`, `table`, `textarea`, `thumbnail` and `toast`.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies: the image review list has a section for stories held by G-01, G-33, G-53, G-58, G-65, G-81, G-85, G-88 or G-93 that one of this batch's running screens shows, compared by the script as the batch's own stories are, each with the gap it came from. A story compared there leaves its gap; the rest keep the status their gap gave them. The issue store credit dialog's story opened from a customer's page, which G-81 sent here, is one of them.

## 4. Delivery

- **One backend pull request** (§7, choice 1): this proposal first, then the stories, fixtures and mocks, reference images, the capture and comparison scripts, the verification record, the image review list, the evidence index and LIQ-009's Storybook column, followed by its merge record.
- **Merge order:** LIQ-004's queue on `main` comes first. Batch 11's pull request touches the same records (LIQ-004, LIQ-009, the README index and the fidelity configuration's notes); whichever merges second brings in `main` and keeps both entries. Gap and defect numbers come from the register the "Audit Spree baseline completion status" thread keeps, as every batch since 2026-11-04 has done.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batches 6 and 8 ran, in this lane's own checkout, database and ports. The roles in §2.2, and the customers, groups, addresses, identifiers, credits and orders each state needs, are added through the Admin API on that server's database only, in the browser tests' default store.
- **The storefront:** not run and not changed. No customer screen needs it.

**Size, estimated from batch 8's part 1:** about 90 stories and 180 reference images, and about 90 running-screen captures with the role and phone variants. With them the visual check reaches about 3,900 comparisons, under 1,000 in each of its four parts.

## 5. Acceptance criteria

Batch 8's criteria applied to this batch, with criterion 12 naming this batch's specs, criterion 13 strengthened for these screens, criterion 15 the behaviours no test drives, criterion 16 the hand-offs of §2.3 and criterion 17 the emails. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-23 and FL-21's customer entry are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Admin API controller specs for customers, their addresses, groups, store credits, tax identifiers, export and erasure, customer groups, data requests and the customer import and export, with the matching integration specs; the Store API specs for wishlists, wishlist items and newsletter subscribers; and the customer, address, customer group, store credit, tax identifier, data request, consent record, newsletter subscriber and wishlist model specs, with their workflows and the customer erasure specs. The customer and newsletter mailer specs are run with the emails |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to ISO-1 to ISO-3 and ISO-7, which concern these screens. No check reads or writes another store's records or opens another store's shopper. If a list the batch captures would show a shopper the batch did not add to the default store, the capture is narrowed to the batch's own records and the record says so without describing the other record. The batch claims nothing about who owns a shopper account. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email, phone number, tax identifier and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. The exported customer file is not committed; what it contains is described | The search's result in the record |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's and G-90's were. None is counted as tested | The record's list |
| 16 | Each hand-off in §2.3 is shown on the browser-test server, with captures and the result recorded per piece | Captures and the record |
| 17 | Each email in §2.4 is rendered and captured at 390 and 1280 pixels, with the mailer specs run, and whether it was sent is recorded, or kept as a gap | The emails section |

## 6. Flow steps

### FL-23, a customer privacy request

| Step | Browser tests |
|---|---|
| DA-CUS-02: the privacy card, with the consent date | None found |
| DA-CUS-02: export the customer's data | None found: a gap. The batch downloads the file on the running screen and records what it holds, without committing it |
| EM-C-09: the data export email | None: rendered (§2.4). The privacy card's export sends no email (§2.4) |
| DA-CUS-02: erase, after its confirmation, then the erased page | `customers.spec.ts`: "erases a customer and says so afterwards" |
| DA-CUS-01: erased customers out of the list until asked for | `customers.spec.ts`: "keeps erased customers out of the list until asked for" |

### FL-21's customer entry, an import from CSV

| Step | Browser tests |
|---|---|
| DA-CUS-01: open the import from the list | None for customers; `imports.spec.ts` imports products |
| DA-OVL-05: upload, map columns, follow progress, see results | `imports.spec.ts`, for products. The customer file's mapping and results are shown by the batch's script (§2.3) |
| EM-S-06 and DA-SET-31 | Catalog part 2 rendered EM-S-06 and captured DA-SET-31 for a product import; not repeated |

### FL-10's staff step, as a group membership

| Step | Browser tests |
|---|---|
| DA-CUS-01 or DA-CUS-02: add the customer to a group | `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" |

The rest of FL-10 is batch 12's. The rest of the batch is in no flow. Its browser tests: `customers-list.spec.ts` (4 tests), `customers.spec.ts`'s remaining tests, `customer-groups.spec.ts` (5 tests) and `store-credits.spec.ts`'s "opens a credit and follows it to the customer".

## 7. Choices made under the owner's delegation

Batch 10 has no question that needs the owner. Its choices are planning within the batch's approved scope, which the owner's delegation of 2026-11-04 lets the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **One part, one implementation pull request.** Thirteen new components, three screens and two emails are smaller than batch 8's part 1 (20 components, five screens, five emails). Two parts would add a merge cycle without making either review small enough to matter.
2. **Companies stay with batch 12.** LIQ-004 gives batch 10 "CAP-08-02 to CAP-08-06" and batch 12 "Wholesale (§9)"; companies are CAP-09-01, in §9. Two earlier records named batch 10 for them: part 2 of the catalog batch for the company screens, and batch 7 for a company's tax exemption certificates on DA-CUS-05. This proposal follows LIQ-004's capability split and corrects both hand-offs to batch 12, which takes DA-CUS-04, DA-CUS-05, their components and EM-C-11. A customer's own tax identifiers stay here.
3. **States are reached through the Admin API,** on the browser-test database only, in its default store, as every batch has done. A state the Admin API cannot reach is checked against its source and recorded as a coverage gap; a state reached by answering a request in the browser says so.
4. **One custom role, the customer manager,** beside the order manager, support and merchandiser templates (§2.2), because no template holds write on customers.
5. **Hand-offs are shown as evidence, not as browser tests** (§2.3). Each is shown once on the browser-test server, with what the server answered. Adding browser tests for them would be platform batch work, as P9 is for earlier batches; the record lists any that need one for the owner's answer (criterion 15).
6. **Isolation is left to FB-03.** These screens are where ISO-1 to ISO-3 and ISO-7 appear, and FB-03's private validation and the owner's choice of who owns a shopper account are pending. The batch works in the default store, opens no other store's shopper, narrows any capture that would show one (criterion 13), and publishes nothing from FB-03's private report.

What stays with the owner: the answers to the gaps the record lists, and anything the batch finds that would change scope, a defect or a criterion, which comes back to the owner before it is settled. Tenant isolation stays NOT_RUN.

## 8. Gaps known before the work starts

Recorded now so none is lost. The batch's record says which it closes. Gap numbers come from the register when the record is written.

| Gap | What would close it |
|---|---|
| No browser test exports a customer's data, edits or deletes an address or sets a default one, adds, edits, checks or deletes a tax identifier, edits the internal note, deletes a store credit from the customer's page, removes customers from groups or tags in bulk, filters by group, company, tags or erased, or imports a customer file. Read in the tests so far | This batch's captures show the states; the record lists them for the owner's answer (criterion 15), as G-87 and G-90 were |
| EM-C-09 is sent only for a data request, which no dashboard screen makes, and EM-C-10 only for a Store API subscription, which no storefront page makes (§2.4) | Rendered here; whether either is sent joins G-16 and G-77 |
| Wishlists and newsletter sign-ups have no screen at this revision | Mapped to Spree's specs (criterion 12); a screen is a product decision, not baseline work |
| States the Admin API cannot reach, such as a tax identifier with each validation result, if no validator is registered on the browser-test server | Checked against their source, and recorded as coverage gaps |
| States reached only by answering a request in the browser, such as the page failing to load | Recorded as simulated interface-state coverage, as G-54, G-86, G-89 and G-94 were |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, whose refusal checks are platform step P10 |
| Companies and their certificates | Batch 12 (§7, choice 2) |
| Tenant isolation and who owns a shopper account (criterion 13) | FB-03's validation, the owner's choice of shopper ownership, and the fixes for ISO-1 to ISO-7. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change customers, groups and credits on the browser-test server, which is local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
