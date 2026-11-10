---
title: FB-19 batch, marketplace
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-10
updated: 2026-11-10
---

# FB-19 batch: marketplace

Batch 13 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): [LIQ-006 §10](../LIQ-006-product-capability-baseline.md#10-marketplace)'s CAP-10-01 to CAP-10-09, "the operator's seller screens, then the seller panel, with the dashboard's seller-submitted products, their review controls and the product list's seller filter". It reproduces what Spree already has for running a marketplace: admitting and managing sellers, their onboarding checklist, commission rates, what each seller earned and the payouts that settle it, the marketplace settings, a seller's product under review, and an order split between sellers. It also takes in the marketplace parts that batches 5, 8 and 11 left here. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-10, under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)) and the owner's instructions of 2026-11-10 to continue the Spree-first baseline and start eligible remaining work within the three-lane limit. It depends on orders and payments, as LIQ-004's row 13 says: batch 7 merged on 2026-11-04 and batch 8 on 2026-11-08 ([merge record](../verification/2026-11-08-fb-19-batch-orders-returns-and-fulfilment-part-2-merge.md)). It takes one of the three lanes. It has no question that needs the owner now: its choices are planning within the batch's scope and are recorded in §7 as decided under the delegation, never as the owner's answers. Three things read in the code or earlier records while preparing it change how the batch is run, and are checked on the running stack (§2.7). It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 8](fb-19-batch-orders-returns-and-fulfilment.md) and [batch 11](fb-19-batch-home-reports-and-emails.md). This work item stays PROPOSED until it is accepted under D5. Part 1 was built in #98 ([record](../verification/2026-11-10-fb-19-batch-marketplace-part-1.md)) and merged on 2026-11-10 with its delegated acceptance ([merge record](../verification/2026-11-10-fb-19-batch-marketplace-part-1-merge.md)). Part 2's scope and criteria are set out in §10.

Liquorify's own direction is not decided here. LIQ-006 marks every §10 capability "not needed yet", because the specification gives each merchant its own store and does not use a marketplace. The baseline still reproduces and verifies what Spree has, so that a later decision starts from evidence. Nothing in this batch makes merchants sellers or chooses a tenancy option.

## 1. Outcome and summary

Every marketplace screen in the dashboard, and then in the seller panel, has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch traces the operator's steps of FL-11, FL-12 and FL-13 in part 1 and the seller's steps in part 2, renders the marketplace emails, and checks on the running stack that the operator's decisions and settings take effect where they should.

- **In two parts** (§7, choice 1). Part 1 is the operator's side in the dashboard: sellers, their onboarding, commission rates, transfers and payouts, the marketplace settings and seller requirements, and the marketplace parts of the product, order, home and report screens. Part 2 is the seller panel. Each part is one implementation pull request with its own merge record.
- **Bounded, part 1:** 8 screens of their own, the marketplace states of 6 screens other batches captured, 3 flows' operator steps, 5 emails, 6 browser test files with 25 tests, and 19 new components.
- **Part 2** is set out in §10, with its own scope and criteria, as part 2 of the catalog batch was. It holds the seller panel's 22 screens and 2 overlays, the seller's steps of FL-11 to FL-13, EM-S-02 and the 28 seller panel components (CMP-SP-G), 27 of them without stories, with the parts of earlier gaps that need a seller's screens (§2.6).
- **Same shape as batches 8 and 11:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; on the running stack, by the batch's own scripted checks of what these screens decide and save, which are evidence and not browser tests (criterion 16). Behaviours no browser test drives are listed for the owner's answer, as G-87's, G-90's, G-92's and G-100's were.

## 2. Scope of part 1

LIQ-006 §10's dashboard capabilities, every dashboard screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), the marketplace parts other batches left here, and the operator's steps of the flows that run through them.

| Capability | Screens | Flows | Emails | Browser tests |
|---|---|---|---|---|
| CAP-10-01 Sellers: invitation, onboarding, approval, rejection, suspension | DA-SEL-01 Sellers; DA-SEL-02 Seller | FL-11, the operator's steps | EM-O-03 to EM-O-05; EM-S-03 for a seller invitation, mapped | `sellers.spec.ts` (9 tests); `list-filters.spec.ts`: "filters sellers by status" |
| CAP-10-02 Seller requirements and onboarding, the operator's side | DA-SET-23 Seller requirements; DA-SEL-02's onboarding card | FL-11 | None | `seller-requirements.spec.ts` (3 tests) |
| CAP-10-04 Product submissions and review, the operator's side | DA-PRD-03's seller card, status card and review actions; DA-PRD-01's seller column and filter, deferred here from batch 5 | FL-12, the review step | None | None |
| CAP-10-05 Orders split by seller, the operator's side | DA-ORD-04's marketplace card and its "part of a larger purchase" note; DA-ORD-01's seller column and filter, left here by batch 8 | FL-13's checkout, through the Store API (§2.7) | EM-C-04, EM-O-02 | None |
| CAP-10-06 Commissions | DA-SEL-03 Commission rates; DA-ORD-04's commission card, left here by batch 8 | None | None | `commission-rates.spec.ts` (6 tests) |
| CAP-10-07 Seller earnings, transfers and payouts, the operator's side | DA-SEL-04 Seller transfers; DA-SEL-05 Payouts; DA-SEL-06 Payout; DA-SEL-02's balance and settlement cards; DA-ORD-04's seller transfers card, left here by batch 8; DA-HOME-01's sellers ranking tab and DA-RPT-03's seller payouts report, left here by batch 11 | FL-13, the operator's step | None | `seller-ledger.spec.ts` (4 tests) |
| CAP-10-08 Marketplace settings | DA-SET-22 Marketplace | None | None | `marketplace-settings.spec.ts` (2 tests) |

CAP-10-03 and CAP-10-09 are the seller panel's, and part 2's. The dashboard's two old settings addresses that now redirect (S/`settings/commission-rates.tsx` to DA-SEL-03 and S/`settings/payouts.tsx` to DA-SET-22) are covered by the browser tests named above and captured once each.

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list and detail states that apply. Each state is captured in light and dark at 1280 pixels; DA-SEL-02 is also captured on a narrow screen, since its sidebar stacks under the main column.

| Screen | States |
|---|---|
| DA-SEL-01 Sellers | Listed, with each status the data reaches (pending, invited, onboarding, ready for review, approved, rejected, suspended, canceled); filtered by status; searched; the add seller sheet, empty and with a refused save; the delete confirmation; none; the Add button hidden without write |
| DA-SEL-02 Seller | Each status, with the header's actions it offers: invite and re-invite, approve and reinstate, suspend, reject, reopen onboarding; the onboarding progress badge; the suspend, reject and reopen confirmations; approving with requirements outstanding, and its override confirmation; the invite sheet; the brand card with placeholders for details not filled in, and filled in; the edit profile sheet; the onboarding card with each requirement status the data reaches (pending, accepted, rejected, waived), all done, and its accept, reject and waive actions with their confirmations; the team card empty, with members and with a pending invitation, and its remove, resend and revoke confirmations; the balance card with earned, pending, payable and paid, and the settle confirmation; the settlement card and its edit sheet; the contact and address cards; read-only for a role that may read but not write; loading; not found; the seller failing to load |
| DA-SEL-03 Commission rates | Listed, enabled and not; a percentage rate, a flat fee per currency, a floor, a cap and tax; seller and category conditions; the create and edit sheets, with a refused save; the delete confirmation; none; read-only without write |
| DA-SEL-04 Seller transfers | Listed, with each status the data reaches (pending, processing, completed, failed, unresolved) and kind (earning, reversal); a row linking to its order; filtered; none |
| DA-SEL-05 Payouts | Listed, with each status the data reaches; the mark paid dialog with its reference; none; the action hidden without write |
| DA-SEL-06 Payout | A pending payout with the earnings it covers and the mark paid action; a completed payout with its reference; not found |
| DA-SET-22 Marketplace | Saved with each card: payouts (provider, schedule, minimum), admission (automatic approval of sellers and of their products), communication (seller emails) and commission tax; the payout provider not connected, with its hint; a refused save; read-only without write on settings; loading; the store failing to load (SD-6, as it shows) |
| DA-SET-23 Seller requirements | The starting checklist; each kind's settings sheet; a requirement added, switched off and deleted, with the delete confirmation; none; read-only without write on sellers |
| DA-PRD-01 Products, marketplace states | The seller column with a seller's product beside the store's own; filtered by seller |
| DA-PRD-03 Product, marketplace states | A seller's product proposed, with the seller card and the approve and reject actions; the approve confirmation; the reject reason field; rejected, with "edit reason"; approved; a product from a suspended seller, with the seller's status on the card; the store's own product, with no seller card |
| DA-ORD-01 Orders, marketplace states | The seller column with sellers' orders beside the store's own; filtered by seller |
| DA-ORD-04 Order, marketplace states | A seller's order with the marketplace card and its "part of a larger purchase" note; the store's own order with no card; the commission card with its lines, and failing to load (§2.7); the seller transfers card, settled and not settled, with its payout link |
| DA-HOME-01 Home, marketplace states | The sellers ranking tab with data, with no data, and with its "View report" link; hidden without read on sellers |
| DA-RPT-03 Report, marketplace states | The seller payouts built-in report |

### 2.2 Permission variants

Spree's catalog has three seller scopes, `sellers`, `commissions` and `payouts`, and none of the three role templates grants any of them. Eight variants cover them:

- **Admin role:** every screen with every control.
- **A custom seller manager role,** with write on sellers and read on products and orders: DA-SEL-01 and DA-SEL-02 with every lifecycle control, DA-SET-23 editable, the Commission rates and Payouts entries hidden, and what the review controls and the order cards show it.
- **A custom seller viewer role,** with read on sellers, commissions and payouts: every seller screen read-only, with each write control hidden as the screen shows it.
- **A custom payouts clerk role,** with read on sellers and write on payouts: DA-SEL-05 and DA-SEL-06 with Mark paid, DA-SEL-02's settle action as it shows, and the seller's other controls hidden.
- **A custom commission manager role,** with read on sellers and write on commissions: DA-SEL-03 editable, and the payouts screens on a direct visit.
- **A role made from the merchandiser template,** which holds products but no seller scope: DA-PRD-01's seller column and filter, DA-PRD-03's seller card and review actions on a proposed product, and the seller link from the card.
- **A role made from the order manager template,** which holds orders but no seller scope: DA-ORD-01's seller column and filter, and DA-ORD-04's marketplace, commission and seller transfers cards (§2.7).
- **A custom settings role,** with write on settings and nothing on sellers: DA-SET-22 editable, and DA-SET-23 and the seller screens on a direct visit.

### 2.3 Flows and their steps

Part 1 traces the operator's steps; the seller's steps are part 2's, and each step names its part.

#### FL-11, admitting a seller

| Step | Part | Browser tests |
|---|---|---|
| DA-SEL-01: add a seller | 1 | `sellers.spec.ts`: "back from a new seller lands on the list", "lists sellers"; `list-filters.spec.ts`: "filters sellers by status" |
| DA-SEL-02: invite | 1 | `sellers.spec.ts`: "invites someone to run the seller" |
| EM-S-03: the invitation | 1, mapped | Rendered by staff access part 1; read as sent for a seller invitation by the batch's script (§2.4) |
| SP-AUTH-04, SP-ONB-01: accept and onboard | 2 | `seller-invitation-acceptance.spec.ts`, `seller-panel-home.spec.ts` |
| DA-SEL-02: review the onboarding, approve, and the override when requirements are outstanding | 1 | None: a gap. Driven by the batch's script, which is evidence, not a browser test |
| DA-SEL-02: reject, suspend, reinstate, reopen onboarding | 1 | None: a gap. Driven by the batch's script |
| EM-O-03 to EM-O-05 | 1 | None: rendered from Spree's mailer previews, and whether each is sent is checked by the batch's script (§2.4, §2.5) |
| SP-HOME-01: the approved seller's home | 2 | `seller-panel-home.spec.ts` |

#### FL-12, a seller's product reviewed

| Step | Part | Browser tests |
|---|---|---|
| SP-PRD-02, SP-PRD-03: list and submit | 2 | `seller-catalog.spec.ts`; `seller-panel-products.spec.ts`: "submits a draft for review" |
| DA-PRD-01: find it by seller | 1 | None: a gap. Shown by the batch's captures |
| DA-PRD-03: approve or reject with a reason | 1 | None: a gap. Driven by the batch's script |
| SP-PRD-01: the result as the seller sees it | 2 | `seller-panel-products.spec.ts` |

#### FL-13, a seller's order, earnings and payout

| Step | Part | Browser tests |
|---|---|---|
| SF-CHK-01: an order with two sellers' products | 1 through the Store API (§2.7); the storefront's own checkout in part 2 | None |
| EM-C-04, EM-O-02 | 1 | None: rendered from Spree's mailer previews, and read as sent where the stack sends them (§2.5) |
| DA-ORD-01, DA-ORD-04: the order group's orders, their commission and transfers | 1 | None: a gap. Shown by the batch's captures |
| SP-ORD-01, SP-ORD-02: fulfil | 2 | `seller-panel-earnings.spec.ts` |
| SP-FIN-01: the balance | 2 | `seller-panel-earnings.spec.ts` |
| DA-SEL-04: the transfer | 1 | `seller-ledger.spec.ts`: "lists what a seller earned", "links an earning to the order that produced it" |
| DA-SEL-05, DA-SEL-06: mark paid | 1 | `seller-ledger.spec.ts`: "marks a payout as paid, with the reference it went out under", "a payout itemises the earnings it covers" |
| SP-FIN-02, SP-FIN-03 | 2 | `seller-panel-earnings.spec.ts` |

### 2.4 Decisions and settings checked where they take effect

Each is made or saved through its dashboard screen, and then seen, or not, where it takes effect, with captures or read values of both sides and the result recorded per row (criterion 16). They are evidence, not browser tests. A row the running stack cannot reach is recorded with the check made instead.

| What | Where it is checked |
|---|---|
| Approving, rejecting, suspending and reinstating a seller | The seller's status on DA-SEL-01 and DA-SEL-02, and what the Seller API answers that seller's user (signs in, is refused), read through the API, not the panel |
| Approving with requirements outstanding | Refused without the override, accepted with it, as the server answers |
| Accepting, rejecting and waiving a requirement | The onboarding card's progress and the approve button's override, and the seller's onboarding as the Seller API answers it |
| Approving and rejecting a seller's product | The product's status on DA-PRD-01 and DA-PRD-03; whether it is on sale through the Store API; the rejection reason as the Seller API returns it |
| Automatic approval of sellers and of their products (DA-SET-22) | A new seller and a new submitted product, with the switch on and off |
| The seller emails switch (DA-SET-22) | Whether EM-O-03 is written to the mail folder for an approval, with the switch on and off |
| The payout minimum and the commission tax (DA-SET-22) | Read back on the screen, as the browser test does, and the commission tax seen on the commission card of an order placed after it is saved |
| A commission rate (DA-SEL-03) | The commission card's lines on an order placed after it is saved, against the rate's percentage, floor, cap and tax |
| Marking a payout paid (DA-SEL-05) | The payout's status and reference on DA-SEL-06, the transfers it covers, and the seller's balance card |
| The sellers ranking and the seller payouts report | Compared with the sellers' orders and transfers the Admin API lists for the same range |

### 2.5 Emails

| Emails | This batch |
|---|---|
| EM-O-03 Seller approved, EM-O-04 Seller rejected, EM-O-05 Seller suspended | Rendered from Spree's mailer previews, in light and dark clients as earlier batches rendered emails; read as sent on the stack where the emails gem is loaded (§2.7) |
| EM-C-04 Order group confirmation, EM-O-02 New order group notification | Rendered from Spree's mailer previews; read as sent for FL-13's order where the stack sends them. EM-C-04 was shown in the editor's preview by batch 11 |
| EM-S-03 Invitation, for a seller | Rendered by staff access part 1; mapped, and read as sent for FL-11's invitation |
| EM-S-02 Seller user password reset | Part 2 |

Rendering is not sending. Whether Spree sends each email on a Liquorify store, and through which mail service, stays with G-16 and G-77, deferred on 2026-11-04 (decision 22).

### 2.6 Left out of part 1, and where it goes

- **The seller panel:** every SP screen and overlay, the seller's steps of FL-11 to FL-13, EM-S-02, and the parts of earlier gaps that need a seller's screens: G-85's seller stock locations (SP-SET-05), batch 7's seller delivery methods and package types (SP-SET-02, SP-SET-03), catalog part 2's seller imports, SD-3's check of whether a real order reaches a seller without addresses, and the storefront's seller checkout under G-73. Part 2 (§10).
- **Real payout providers:** Stripe Connect and any other provider's onboarding and payouts stay with P4. Part 1 uses Spree's built-in provider, which records payouts marked paid by hand.
- **Tenant isolation:** ISO-1 to ISO-7 stay open, and FB-03 stays paused. No check reads or writes another store's records.
- **Whether Liquorify uses a marketplace at all:** LIQ-006 marks §10 "not needed yet". This batch records what Spree does and decides nothing about Liquorify's tenancy.

### 2.7 Found while preparing this proposal

Read in the code and earlier records at `main` `0950e2de`. Each is checked on the running stack first, and what is confirmed is recorded before the captures depend on it.

- **The commission card fails for roles without a seller scope.** Batch 8 recorded as B7 that support and the packer see a Commission card reading "Failed to load" on every placed order, while the admin sees no card on the same orders. Read in the code, the card hides itself only when the request succeeds with no lines; a refused request shows the error. If confirmed for the order manager template too, it is brought to the owner as a candidate existing defect, with a number from the defect register, before it is settled.
- **A marketplace order needs the Store API.** Spree splits an order into an order group of per-seller orders only at checkout, and the Admin API's new order screen makes a single store order. So FL-13's order is placed through the Store API on the browser-test server, with two sellers' products and Spree's test gateway, as batch 9's flows placed orders, and the storefront's own seller checkout waits for part 2. If the browser-test server cannot complete such a checkout, the record says so and the cards are captured on the orders the browser tests' own fixtures give.
- **The seller emails are in the emails gem.** EM-O-02 to EM-O-05 and EM-C-04 are registered by the emails gem, which the browser-test server does not load, as batch 11 found for the templates. They are rendered from Spree's mailer previews. Whether each is sent is read on the emails gem's own test app with the same built dashboard pointed at it, as batch 11 did for FL-18, or recorded as not reachable with the check made instead.

## 3. Components

The part 1 screens use 19 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the eight screens, the four table definitions and the marketplace cards import at `main` `0950e2de`, followed through the components they import in turn; the first step of the work confirms it against the running screens.

| Layer | New in part 1 |
|---|---|
| Admin dashboard, `sellers/` (CMP-DA-G-18) | `payout-complete-dialog`, `seller-address-card`, `seller-at-a-glance-card`, `seller-balance-card`, `seller-brand-card`, `seller-contact-card`, `seller-edit-profile-sheet`, `seller-edit-settlement-sheet`, `seller-invite-sheet`, `seller-onboarding-card`, `seller-read-row`, `seller-settlement-card`, `seller-status-card`, `seller-team-card` |
| Admin dashboard, `orders/` (CMP-DA-G-11) | `order-commission-lines-card`, `order-marketplace-card`, `order-seller-transfers-card` |
| Admin dashboard, `products/` (CMP-DA-G-14) | `product-review-actions`, `product-seller-card` |

The sellers, seller ledger, commission rates and seller requirements tables are table definitions shown through `resource-table`, as earlier listing pages were, and get no stories of their own. `commission-rule-subjects.ts` is a helper module, not a component. The add seller sheet, the commission rate sheet, the requirement sheets and the marketplace settings cards are written inside their route files, so they are captured as their screens' states and get no stories, as LIQ-010 §10 ties stories to component files. Three primitives with no stories, `attachment`, `calendar` and `date-picker`, are reached only through components already covered (`file-upload-field`, `store-date-picker`), and stay with the batch that first draws them on their own.

**Already covered, reused here:** `resource-table`, `table-toolbar`, `page-header`, `resource-layout`, `preferences-form`, `resource-multi-autocomplete`, `currency-select`, `country-combobox`, `country-state-fields`, `address-form-dialog`, `image-upload-field`, `file-upload-field`, `resource-image-field`, `store-date-picker`, `money`, `slot`, `can`, `route-pending`, `route-error-boundary`, `relative-time`, `confirm-dialog`, `form-actions`, `secret-input`, `address-block`, `row-actions`, and the primitives from earlier batches, among them `alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `combobox`, `dialog`, `dropdown-menu`, `empty`, `field`, `input`, `input-group`, `pagination`, `progress`, `rich-text-editor`, `select`, `sheet`, `skeleton`, `switch`, `textarea`, `toast` and `tooltip`. The product status card's proposed and rejected states are captured on DA-PRD-03; its stories came with part 1 of the catalog batch.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies, and this batch runs its share inside the batch: the image review list has a section for stories held by G-01, G-33, G-53, G-58, G-65, G-81, G-85, G-88, G-93, G-96 or G-101 that one of part 1's running screens shows, compared by the script as the batch's own stories are, each with the gap it came from. Two are known already: batch 7's "Delivery method list: Marketplace" story, if a seller's delivery method shows on a dashboard screen part 1 captures, and the product list's and order list's filter stories, whose seller filter part 1 opens. Stories that only a seller panel screen shows wait for part 2. A story compared there leaves its gap; one no part 1 screen shows keeps its status and its gap's destination.

## 4. Delivery

- **One backend pull request for part 1,** with the stories, fixtures and mocks, reference images, capture and comparison scripts, verification record, image review list, evidence index and LIQ-009's Storybook column, followed by its merge record. This work item is its first commit.
- **Merge order:** LIQ-004's queue on `main` comes first. Batch 10's #94 and the records pull requests touch the same record files; whichever merges second brings itself up to date with `main` and keeps both entries.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batches 8 and 11 ran, in this session's own checkout, database and ports. The roles in §2.2, the sellers, requirements, commission rates, a seller's submitted products and FL-13's order are added through the Admin, Seller and Store APIs on that server's database only. Sent seller emails are read on the emails gem's own test app (§2.7), on its own port and database, removed after the run.
- **Emails:** rendered from Spree's mailer previews, as batch 8 rendered the order emails.
- **Evidence logs** are saved as `.txt`, because the root `.gitignore` drops `*.log`. Local and CI results are reported apart.

**Size, estimated from batch 8's part 2:** about 100 stories and 200 reference images, and about 130 running-screen captures.

## 5. Acceptance criteria for part 1

Batch 11's criteria, with criterion 12 naming this batch's specs, criterion 15 the behaviours no test drives, criterion 16 the decisions and settings of §2.4, and criterion 17 the emails. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped, and every part 2 ID named with its part | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | The operator's flow steps are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 or the captures show it is wrong | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Admin API controller and integration specs for sellers, their invitations, team, balances and payouts, seller onboarding, seller requirements and their submissions, commission rates, commission lines, seller transfers, seller payouts, payout providers, order groups and product approval; the seller, seller requirement, seller balance, seller transfer, seller payout, commission rate and line, and order group model specs; the seller, requirement submission, seller transfer and seller payout workflow specs; the commission services; and the emails gem's seller and order group mailer specs |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys, tokens and invitation links in a captured email or page are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's, G-90's, G-92's and G-100's were. None is counted as tested | The record's list |
| 16 | Each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | Captures and the record |
| 17 | EM-O-03 to EM-O-05, EM-C-04 and EM-O-02 are rendered from Spree's mailer previews, EM-S-03 is mapped, and each is read as sent where the stack sends it or recorded as not reachable | The emails section |
| 18 | The comparison follow-up's share (§3.1): every earlier story a part 1 running screen shows is compared and leaves its gap, and every other story held for batch 13 keeps its status with part 2 or the follow-up named as its destination | The image review list's earlier stories section and LIQ-004's comparison follow-up |

## 6. Spree's own tests for these screens

Browser tests, all in the dashboard's suite: `sellers.spec.ts` (9 tests), `commission-rates.spec.ts` (6), `seller-ledger.spec.ts` (4), `seller-requirements.spec.ts` (3), `marketplace-settings.spec.ts` (2) and `list-filters.spec.ts`'s "filters sellers by status". They pass in CI at the batch's revision; their titles are in §2.3. No browser test approves, rejects, suspends or reinstates a seller, reviews a seller's onboarding, reviews a seller's product in the dashboard, filters products or orders by seller, or opens a marketplace order's cards.

## 7. Choices made under the owner's delegation

Batch 13 has no question that needs the owner now. Its choices are planning within the batch's approved scope, which LIQ-004 set as "the operator's seller screens, then the seller panel, with the dashboard's seller-submitted products, their review controls and the product list's seller filter", and which the owner's delegation of 2026-11-04 and instructions of 2026-11-10 let the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **Two parts, each one implementation pull request.** LIQ-004 names the order: the operator's seller screens, then the seller panel. Part 1 has 19 new components and part 2 about 28 more, so one pull request would be twice batch 8's largest part. The two share no components: the seller panel has its own (CMP-SP-G).
2. **The marketplace parts other batches left here go in part 1:** batch 5's seller's products, review controls and seller filter; batch 8's order page cards and the order list's seller filter; batch 11's sellers ranking tab and seller payouts report. They are the operator's side, and all are dashboard screens.
3. **States are reached through the Admin, Seller and Store APIs, or the workflows they call,** on the browser-test database, as every batch has done. A state they cannot reach is shown in a story, checked against its source and recorded as a coverage gap; a state reached by answering a request in the browser says so.
4. **Five custom roles,** beside the merchandiser and order manager templates (§2.2), because no template grants a seller scope.
5. **Decisions and settings are checked as evidence, not browser tests** (§2.4). Adding browser tests for them would be platform batch work; the record lists any that need one for the owner's answer (criterion 15).
6. **FL-13's order goes through the Store API in part 1** (§2.7), so the order cards are seen on a real order group; the storefront's own seller checkout is part 2's.
7. **Spree's built-in payout provider only.** Real providers stay with P4.
8. **The comparison follow-up's share runs inside the batch** (§3.1), as the coordinator asked, so batch 13's stories and the earlier stories its screens show are compared in one list.

What stays with the owner: what §2.7's first finding becomes if it is confirmed, the answers to the gaps the record lists, and anything the batch finds that would change scope, a defect or a criterion, which comes back to the owner before it is settled. New defect and gap numbers come only from the defect register's allocating thread. Tenant isolation stays NOT_RUN: FB-03's validation is separate and paused, and this batch claims nothing about it.

## 8. Gaps known before the work starts

Recorded now so none is lost. The record says which it closes. Gap numbers are given by the defect register's allocating thread when the record is written.

| Gap | What would close it |
|---|---|
| No browser test approves, rejects, suspends, reinstates or reopens a seller, accepts, rejects or waives a requirement, approves with the override, reviews a seller's product in the dashboard, filters products or orders by seller, or opens a marketplace order's cards. Read in the tests | This batch's captures and scripted checks show them; the record lists them for the owner's answer (criterion 15) |
| The commission card for roles without a seller scope (§2.7) | Checked on the running stack; if confirmed, brought to the owner before it is settled |
| The seller emails are rendered from previews and read as sent on the emails gem's test app, not the browser-test server (§2.7) | Recorded per email; closes with G-16's email configuration |
| States the APIs cannot reach, such as a transfer that failed or is unresolved without a real provider | Shown in stories, checked against their source, and recorded as coverage gaps; real providers' states stay with P4 |
| States reached only by answering a request in the browser, such as loading and the pages failing to load | Recorded as simulated interface-state coverage, as G-54, G-86, G-89, G-94, G-98 and G-102 were |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest is proposed to join G-11 |
| The seller panel and the seller's flow steps | Part 2 (§2.6, §10) |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. The batch claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change sellers, requirements, commission rates, products, orders and settings on the browser-test server and the emails test app, both local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.

## 10. Part 2: the seller panel

Set out on 2026-11-10, after part 1 merged at `e7fd2953` ([merge record](../verification/2026-11-10-fb-19-batch-marketplace-part-1-merge.md)), from the code at `main` `48e33669`. It has the same shape as part 1, and the choices in §7 hold unless this section says otherwise.

### 10.1 Scope

LIQ-006 §10's seller capabilities, every seller panel screen and overlay in [LIQ-008](../LIQ-008-spree-screen-inventory.md), the seller's steps of the three marketplace flows, the storefront's checkout of a cart holding two sellers' products, and the parts of earlier gaps that need a seller's screens (§2.6).

| Capability | Screens | Flows | Emails | Browser tests |
|---|---|---|---|---|
| CAP-10-03 The seller panel: signing in, the seller picker, home, profile, settings and team | SP-AUTH-01 to SP-AUTH-04; SP-SHELL-01; SP-HOME-01; SP-PRF-01; SP-SET-01, SP-SET-04, SP-SET-06; SP-OVL-01, SP-OVL-02 | FL-11, the seller's steps | EM-S-02; EM-S-03 for a teammate, mapped | `seller-panel-home.spec.ts` (6 tests), `seller-invitation-acceptance.spec.ts` (2), `seller-panel-settings.spec.ts`'s profile, policies, team and settings tests |
| CAP-10-02 Seller requirements and onboarding, the seller's side | SP-ONB-01; SP-OVL-01's onboarding badge | FL-11 | None | `seller-panel-home.spec.ts`: "accepting the marketplace terms ticks that step off"; `seller-package-types.spec.ts` (1) |
| CAP-10-04 Product submissions and review, the seller's side | SP-PRD-01 to SP-PRD-03, with the product list's import and export | FL-12, the seller's steps | None | `seller-panel-products.spec.ts` (3), `seller-catalog.spec.ts` (1) |
| CAP-10-05 Orders split by seller, the seller's and the shopper's side | SP-ORD-01, SP-ORD-02; on the storefront, the cart, checkout and the order placed page for a cart holding two sellers' products (SF-SHOP-05, SF-CHK-01, SF-CHK-03) | FL-13, the seller's and the shopper's steps | EM-C-04, mapped from part 1 | `seller-catalog.spec.ts`'s orders step, `seller-panel-earnings.spec.ts`'s order test; on the storefront, none for a seller's cart |
| CAP-10-07 Seller earnings, transfers and payouts, the seller's side | SP-FIN-01 to SP-FIN-03 | FL-13 | None | `seller-panel-earnings.spec.ts` (3) |
| CAP-10-09 The seller's own delivery, packaging and stock | SP-SET-02, SP-SET-03, SP-SET-05 | None | None | `seller-delivery-methods.spec.ts` (1), `seller-package-types.spec.ts` (1), `seller-panel-settings.spec.ts`'s stock locations test |

Taken from earlier gaps (§2.6): G-85's seller stock locations (SP-SET-05); batch 7's seller delivery methods and package types (SP-SET-02, SP-SET-03), and its stories held by G-65 and G-67 that these screens show; catalog part 2's seller imports and exports (SP-PRD-01); SD-3's open question, whether a real order reaches a seller without addresses, checked on the order FL-13 places; G-73's storefront stories that a seller's checkout shows; and G-107's question, what a suspended seller's team can still do, seen in the panel.

### 10.2 Screens and their states

Every state LIQ-008 lists for the 22 screens and 2 overlays, and these besides, each captured in light and dark:

- **Signing in (SP-AUTH-01 to SP-AUTH-04):** empty, a wrong password, a reset requested, a reset link opened, and refused as invalid; an invitation opened by someone signed out, by its own invitee, and as invalid or used.
- **The seller picker and the chrome (SP-SHELL-01, SP-OVL-01, SP-OVL-02):** one seller, which opens directly, and several; the onboarding badge while requirements are outstanding and gone when done; the account dialog.
- **Home (SP-HOME-01) and onboarding (SP-ONB-01):** a seller in each status a workflow reaches, from invited to approved, rejected and suspended; requirements outstanding, submitted, sent back with the operator's reason, accepted and waived; a submission for review refused while a requirement blocks.
- **Products (SP-PRD-01 to SP-PRD-03):** draft, proposed, active, rejected with its reason, archived, a product withdrawn from review, field errors on a new product, and the import and export dialogs. A suspended seller's products as the panel shows them.
- **Orders (SP-ORD-01, SP-ORD-02):** a new order from FL-13 with its earnings card; fulfilled in part and in full, split, with a label and a delivery recorded; a return and a cancellation, where the Seller API reaches them; an order with no addresses (SD-3).
- **Money (SP-FIN-01 to SP-FIN-03):** a balance with sales and a reversal; payouts pending and completed, and one opened. Other payout statuses need a real provider and stay with P4.
- **Profile and settings (SP-PRF-01, SP-SET-01 to SP-SET-06):** the profile with every card filled and empty, its sheets and their field errors; the settings index; each settings page empty, listed and with its sheet open; the team with a pending invitation, a colleague and the last member kept.
- **Loading, failed and empty states** across the panel, reached by holding or failing a request in the browser, which each capture says (as G-108).

**The storefront:** the cart holding two sellers' products, checkout's delivery step with each seller's rates, and the order placed page showing the order group's per-seller orders, at both widths, on the storefront at its `main` against the browser-test server, as batch 9 ran it.

### 10.3 Permission variants

Every member of a seller's team holds that seller's own role, which carries the whole seller vocabulary: Spree's Seller API offers no narrower seller role ("No custom roles" in `team_controller.rb`), and this batch does not make one, since that would change a role's permissions. So the variants are who is signed in and which seller they reach, not roles:

| Variant | What it shows |
|---|---|
| A member of one approved seller | Every screen with every control |
| A member of two sellers | The seller picker, the switcher, and each seller's own records only |
| A member of a seller still onboarding, rejected or suspended | What the panel lets each do; for a suspended seller, what its team can still do (G-107) |
| An invited person before accepting, and a signed-out visitor | The public screens, and the redirect from a panel address |
| A store staff member with no seller | Refused at sign-in or shown no seller, as the Seller API answers |

### 10.4 Flows

The seller's steps of FL-11, FL-12 and FL-13, traced step by step with the browser tests above, as §2.3 traced the operator's. FL-13 is placed on the storefront this time, with two sellers' products and Spree's Check method, so the seller's order, earnings and payout come from a real order group; if the storefront cannot complete such a checkout against the browser-test server, the record says so and the Store API order of part 1's method is used instead.

### 10.5 Checked where it takes effect

| What | Where it is checked |
|---|---|
| A product the seller submits, approved or sent back by the operator | Its status and the operator's reason on SP-PRD-03; whether it reaches the store (SD-61) |
| A requirement completed by the seller | The operator's onboarding card, and the operator sending it back, seen again in the panel |
| A delivery method, package type and stock location the seller adds | Offered at the storefront's checkout for that seller's product, and the package type completing its requirement |
| Fulfilling, splitting and recording a delivery | The operator's order page and the shopper's order in the storefront account |
| A return or cancellation the seller records | The transfer reversal on the seller's balance and on the operator's transfers list |
| The seller's profile and policies | Where the storefront shows a seller's details, if it does; otherwise recorded as not shown |
| A teammate invited and revoked | EM-S-03 read as sent, and the revoked invitation refused at SP-AUTH-04 |
| A suspended seller | What the panel and the Seller API still allow its team (G-107), and its product at the storefront's checkout (SD-60) |

### 10.6 Emails

| Email | This part |
|---|---|
| EM-S-02 Seller user password reset | Rendered from Spree's mailer, in the emails gem's test app as part 1 rendered the seller emails, and read as sent after a reset is requested on SP-AUTH-02 there |
| EM-S-03 Invitation, for a teammate | Mapped to staff access part 1 and part 1 of this batch; read as sent when a teammate is invited from SP-SET-06 |
| EM-C-04 Order group confirmation | Mapped to part 1; whether the storefront's checkout sends it joins G-110 |

### 10.7 Components

27 seller panel components have no stories yet: `orders/` (CMP-SP-G-02), 16, and the top level (CMP-SP-G-03), 11. `balance-summary` (CMP-SP-G-01) has its story already. The pages in `packages/seller-dashboard/src/pages/` and the panel chrome are screens, captured as their states, as LIQ-010 §10 ties stories to component files. Everything else the panel uses comes from `@spree/dashboard-core` and `@spree/dashboard-ui` and has its story from an earlier batch, among them the shared settings, package type and stock location pages, the fulfilment, return and claim dialogs, the product form's cards, the import wizard and the export button; any the first step finds without one is added and listed. The seller panel story group needs the panel's own providers (its seller, permission and routing context) in Storybook, added beside the dashboard's.

**Earlier stories:** the comparison follow-up's share for the seller panel runs inside this part, as §3.1 did for part 1: every story held by a gap that a part 2 running screen shows is compared and leaves its gap, among them batch 7's delivery method and package type stories (G-65, G-67), batch 6's stock location stories (G-85), batch 8's fulfilment and post-sale dialogs (G-88, G-93) and batch 9's checkout stories a seller's cart shows (G-73).

**Size, estimated from part 1:** about 90 stories and 180 reference images, and about 130 running-screen captures, with about 15 storefront captures.

### 10.8 Delivery

- **One backend pull request** with the stories, fixtures, mocks, reference images, scripts and records, followed by its merge record, as part 1. The storefront's captures are made by a script in the backend's fidelity folder against the storefront at its `main`; the storefront repository is not changed.
- **Running screens:** the seller panel built at the pull request's revision against the browser-test server, as part 1 ran the dashboard, and the storefront's development server against the same server.

### 10.9 Acceptance criteria for part 2

Part 1's criteria (§5), read for the seller panel and the storefront's seller checkout. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability of §10.1 is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no SP ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the seller panel uses has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen and overlay is captured on the running seller panel, at the pinned revision, in each state in §10.2, and the storefront's seller checkout at both widths | Running-screen captures, indexed by screen ID and state |
| 4 | Each variant in §10.3 is captured, showing what the interface does for it | Captures per variant |
| 5 | The seller's steps of FL-11 to FL-13 are traced step by step to their screens, and the browser tests covering them pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs, named in the merge record |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list, and the storefront unchanged at its `main` |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where the captures show it is wrong | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the Seller API's endpoints and the seller audience's permissions, runs them at the batch's revision, and lists what they exercise. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Seller API controller specs (auth, me, profile, onboarding, requirement submissions, products, imports, exports, orders and their fulfilments, deliveries, labels, notes, returns, exchanges and claims, balances, transfers, payouts, policies, team, invitations, delivery methods, profiles and zones, package types, stock locations and tax identifiers) and the seller integration specs, with the core specs for the seller audience's permissions |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records; a check that one seller's member cannot reach another seller's records is a seller-scope check within one store, recorded as such and not as isolation. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys, tokens, reset and invitation links in a captured email or page are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on the seller panel that no browser test drives are listed for the owner's answer, as G-105's were. None is counted as tested | The record's list |
| 16 | Each row of §10.5 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | Captures and the record |
| 17 | EM-S-02 is rendered from Spree's mailer and read as sent, EM-S-03 is read as sent for a teammate, and EM-C-04 stays mapped to part 1 | The emails section |
| 18 | The comparison follow-up's share (§10.7): every earlier story a part 2 running screen shows is compared and leaves its gap, and LIQ-004's comparison follow-up records what batch 13 leaves | The image review list's earlier stories section and LIQ-004 |

### 10.10 Choices made under the owner's delegation

As §7, with these for part 2. Each is recorded as decided under the delegation, never as the owner's answer.

1. **One implementation pull request for part 2.** The seller panel's 27 components are fewer than part 1's screens' share of shared components, and its screens share one set of providers.
2. **No narrower seller role is made** (§10.3): Spree offers none, and making one would change a role's permissions, which the owner's rules keep as they are.
3. **The storefront's seller checkout is captured, not changed,** with the storefront at its `main` against the browser-test server.
4. **Spree's built-in payout provider only;** real providers stay with P4.

What stays with the owner: SD-60 to SD-70 and G-105 to G-111 from part 1, the answers to the gaps part 2 records, and anything it finds that would change scope, a defect or a criterion. New numbers come only from the defect register's allocating thread. Tenant isolation stays NOT_RUN.
