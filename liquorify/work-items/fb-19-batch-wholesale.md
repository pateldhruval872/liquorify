---
title: FB-19 batch, wholesale
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-10
updated: 2026-11-11
---

# FB-19 batch: wholesale

Batch 12 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): [LIQ-006 §9](../LIQ-006-product-capability-baseline.md#9-wholesale), CAP-09-01 to CAP-09-06, "Wholesale (§9)", which depends on customers, catalog pricing and checkout. It reproduces what Spree already has for selling to businesses: companies with their divisions, members, invitations, address books, tax registrations and tax exemption certificates; purchase order numbers a company can require; a company's catalog and price list; and the storefront's wholesale portal, where a business buyer applies, is approved and orders at trade prices. It also takes the pieces earlier batches handed to "batch 12". Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-10, under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)) and the owner's instructions of 2026-11-10 to continue batch 12 within the three-lane limit. It depends on customers (batch 10, merged in #94), catalog pricing (batch 5, merged) and checkout (batch 9, merged). It takes one of the three lanes. It has no question that needs the owner now: its choices are planning within the batch's scope and are recorded in §7 as decided under the delegation, never as the owner's answers. One thing read in the code while preparing it, where the company invitation email sends its buyer, is checked on the running stack and brought to the owner if confirmed (§2.7). It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 10](fb-19-batch-customers.md) and [batch 13](fb-19-batch-marketplace.md). This work item stays PROPOSED until it is accepted under D5. Part 1 is built in #109 ([verification record](../verification/2026-11-10-fb-19-batch-wholesale.md)) and merged at `e3af0d59` with its delegated acceptance on 2026-11-11 ([merge record](../verification/2026-11-10-fb-19-batch-wholesale-merge.md)); its corrections to this work item are recorded there (§6) and below.

Liquorify's own direction is not decided here. LIQ-006 marks every §9 capability "not needed yet". The baseline still reproduces and verifies what Spree has, so that a later decision about selling to licensed trade buyers starts from evidence. Whether Liquorify sells to businesses, and under which licences, is the owner's and stays open.

**Tenant isolation is not tested here.** Companies, their members and their certificates are store records, and ISO-1 to ISO-7 stay open ([LIQ-004](../LIQ-004-foundation-backlog.md)). FB-03's validation is paused. This batch works inside the browser tests' default store and claims nothing about other stores (criterion 13).

## 1. Outcome and summary

Every wholesale screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch renders the company invitation email, traces FL-10's staff side in part 1 and the buyer's side in part 2, and checks on the running stack that what these screens save takes effect where it should.

- **In two parts** (§7, choice 1). Part 1 is the dashboard: the companies list and a company's page with every card, a company's purchase order requirement and tax exemptions seen on its orders, and a company's catalog and price list seen as the Store API prices them for its buyer. Part 2 is the storefront's wholesale portal, SF-WHL-01 to SF-WHL-06, with FL-10 end to end and SD-9 checked again. Each part is one implementation pull request with its own merge record.
- **Bounded, part 1:** 2 screens of their own, the wholesale states of 3 screens other batches captured, FL-10's staff step and the company invitation, 1 email, 1 browser test file with 9 tests, and 4 new components, with the 15 stories batch 10's G-96 sent here and the customer page stories it sent to the comparison follow-up for batch 12.
- **Part 2** is set out in §10, on 2026-11-11 after part 1 merged, as batch 13's part 2 was.
- **Same shape as batches 10 and 13:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; on the running stack, by the batch's own scripted checks of what these screens save, which are evidence and not browser tests (criterion 16). Behaviours no browser test drives are listed for the owner's answer, as G-97's and G-105's were.

## 2. Scope of part 1

LIQ-006 §9's dashboard side, every dashboard screen it uses in [LIQ-008](../LIQ-008-spree-screen-inventory.md), the wholesale pieces other batches left here, and the staff side of the flows that run through them.

| Capability | Screens | Flows | Emails | Browser tests |
|---|---|---|---|---|
| CAP-09-01 Companies and divisions, members, invitations and address books | DA-CUS-04 Companies; DA-CUS-05 Company, with its divisions, members, pending invitations, address book, tax registrations, tax exemption certificates and Enterprise prompt; DA-CUS-01's company column and filter, as batch 10 captured them | The company invitation, from DA-CUS-05 to the email and its link (§2.7) | EM-C-11 | `companies.spec.ts` (9 tests) |
| CAP-09-03 Wholesale approval, the staff step | DA-CUS-01, DA-CUS-02: adding a customer to the Wholesale group, captured by batch 10 | FL-10's staff step, mapped to batch 10's evidence | None | `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" (batch 10) |
| CAP-09-04 Gated channels, the dashboard side | DA-SET-02's storefront access and DA-SET-08's per-channel override, captured by batches 3 and 4 | None | None | `store-settings.spec.ts`, `channels-settings.spec.ts` (batch 3) |
| CAP-09-05 Purchase order numbers and documents on orders; negotiated prices on staff orders | DA-CUS-05's "requires a purchase order number" switch; DA-ORD-03 with a company chosen, its help and its purchase order fields; DA-ORD-04's purchase order card; DA-ORD-05's negotiated price, captured by batch 8 | None | None | `companies.spec.ts`: "creates a company and requires PO numbers on its orders"; `orders.spec.ts`: "carries a PO number and its document onto the created order", "sets a negotiated unit price on a draft order line" |
| CAP-09-06 B2B catalogs, price lists and freight | DA-PRD-13 to DA-PRD-17 and DA-SET-19, captured by batches 5 and 7; the catalog audience card with a company chosen | None | None | `catalogs.spec.ts`, `price-lists.spec.ts`, `package-types.spec.ts` (batches 5 and 7) |

CAP-09-02, the wholesale portal, is part 2's, with the buyer's side of CAP-09-03 and CAP-09-04. Screens that earlier batches captured are mapped to their evidence, and recaptured only for the wholesale states named in §2.1.

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list and detail states that apply. Each state is captured in light and dark at 1280 pixels; DA-CUS-05 is also captured on a narrow screen, since its sidebar stacks under the main column.

| Screen | States |
|---|---|
| DA-CUS-04 Companies | Listed, with companies and divisions, their kind badge, parent and member count; filtered by kind; searched; sorted; the new company sheet, empty, filled and refused with its errors; the delete confirmation; none; the New button hidden without write |
| DA-CUS-05 Company | A company with divisions, members and a pending invitation; a division, with its breadcrumb, its "tax registrations live on the legal entity" pointer and no certificates card; the profile card with the purchase order switch, saved and refused; the divisions card empty and with divisions, and its add dialog for a company and for a division; the members card empty and with members, the add member dialog with its Enterprise prompt, an email with no account becoming an invitation, the remove member confirmation and the revoke invitation confirmation; the address book empty and with addresses, default billing and shipping, the row menu, the add and edit address dialog, a refused save, and the delete confirmation; the tax registrations card empty, with a registration, the add and edit sheet and the delete confirmation; the tax exemption certificates card empty, with a pending, verified, expired, revoked and lapsed certificate, the add sheet with its reasons, the verify and revoke actions with their confirmations, the download, and the delete confirmation; read-only for a role that may read but not write; the JSON drawer; loading; not found; the page failing to load; the delete confirmation from the header |
| DA-ORD-03 New order, wholesale states | A company chosen, with its help; a company that requires a purchase order number, with the order refused without one, as the screen shows it. Corrected by part 1: Spree exempts staff orders from the requirement by design, so the order is not refused; the state is captured with the company chosen and its purchase order field, and the refusal is checked at the buyer's own cart ([record §6](../verification/2026-11-10-fb-19-batch-wholesale.md#6-corrections)) |
| DA-PRD-13 Catalog, wholesale state | The audience card with a company chosen, as an invented catalog made through the Admin API shows it |
| DA-CUS-02 Customer, wholesale states | An invented wholesale buyer, in the Wholesale group and a member of a division, with the cards batch 10's G-96 sent to the comparison follow-up for batch 12 (§3.1) |

### 2.2 Permission variants

Spree's catalog puts companies, their memberships, invitations, addresses, tax registrations and certificates under the `customers` scope, as LIQ-008 records. Batch 10's five variants cover them, made the same way:

- **Admin role:** every screen with every control.
- **A role made from the order manager template,** with read on customers: DA-CUS-04 and DA-CUS-05 read-only, with each write control recorded as the screen shows it, and DA-ORD-03 with a company chosen, which this role may create.
- **A role made from the support template,** with read on customers: the company screens read-only, recorded as each shows them.
- **The custom customer manager role,** with write on customers and nothing on orders: the company screens editable.
- **A role made from the merchandiser template,** which holds no customer scope: the Companies entry hidden, and a direct visit to each screen recorded as it shows.

### 2.3 Hand-offs from earlier batches

Each piece below was handed to "batch 12" by an earlier batch's record. Each is shown on the browser-test server, with captures and the result recorded per piece (criterion 16).

| Piece | Handed over by | What is shown |
|---|---|---|
| The company screens, DA-CUS-04 and DA-CUS-05, their components and EM-C-11 | Batch 10 (§7, choice 2), correcting catalog part 2 and batch 7 | §2.1 and §2.5 |
| A company's tax exemption certificates on DA-CUS-05 | Batch 7, through batch 10 | The card's states (§2.1), and whether a verified certificate exempts the company's order from tax (§2.4) |
| Companies and the Wholesale group as a catalog's and a price list's audience | Catalog part 2, which captured them as its screens showed them | The audience card with a company chosen; whether the company's buyer is priced by its catalog and the Wholesale price list (§2.4) |
| Whether a catalog's or a price list's prices reach a buyer | Catalog part 2 | Part 1 reads them through the Store API for an invented buyer (§2.4); part 2 shows them on the storefront |
| Purchase order numbers and negotiated prices as a capability (CAP-09-05) | Batch 8 | Mapped to batch 8's captures, and a company's requirement checked on a new order (§2.4) |
| G-96's 15 stories and its comparison follow-up stories expected here | Batch 10, at the owner's answer of 2026-11-10 | Compared on DA-CUS-05 and on the wholesale buyer's DA-CUS-02 (§3.1) |
| CAP-09-04's storefront access, which fails for a signed-in customer (SD-9) | Shop part 2 | Part 2, on the storefront |

### 2.4 Decisions and settings checked where they take effect

Each is made or saved through its dashboard screen, and then seen, or not, where it takes effect, with captures or read values of both sides and the result recorded per row (criterion 16). They are evidence, not browser tests. A row the running stack cannot reach is recorded with the check made instead.

| What | Where it is checked |
|---|---|
| A company's "requires a purchase order number" switch (DA-CUS-05) | A new order for the company on DA-ORD-03, without a purchase order number and with one, as the screen and the Admin API answer |
| A member added, and an invitation sent and revoked (DA-CUS-05) | The member's company as the Store API answers that customer; the invitation's token refused once revoked |
| A tax exemption certificate verified, pending, revoked and expired (DA-CUS-05) | The tax on a draft order for the company made through the Admin API, for a taxed address, against the same order with no certificate |
| A company's address book defaults (DA-CUS-05) | What the Store API lists for a member as the company's addresses, and which is default |
| A company's catalog and the Wholesale price list (DA-PRD-13, DA-PRD-14) | The prices the Store API gives an invented buyer, a member of the company's division and of the Wholesale group, beside a guest's and another customer's, below and at the price list's minimum quantity |
| A division's tax registrations pointer (DA-CUS-05) | Which company's registrations the order reads for a division's purchase, read in the code and on the order |

### 2.5 Emails

| Email | When Spree sends it | How it is rendered |
|---|---|---|
| EM-C-11 Company invitation | `company_invitation.created`, when staff invite an email that has no account, through the emails gem's subscriber | Spree's mailer preview, `Spree::CompanyPreview`, as batch 10 rendered its emails, captured at 390 and 1280 pixels in the pinned Playwright image; its link is read and followed (§2.7) |

Rendering is not sending. The browser-test server does not load the emails gem (G-77), so whether Spree sends EM-C-11 is read on the emails gem's own test app, as batch 13 read its seller emails, or recorded as not reachable; sending through a mail service stays with G-16.

### 2.6 Left out of part 1, and where it goes

- **The storefront's wholesale portal:** SF-WHL-01 to SF-WHL-06, CAP-09-02, the buyer's side of CAP-09-03 and CAP-09-04, FL-10's buyer steps, the home page's wholesale section and SD-9 checked again. Part 2 (§10).
- **Enterprise company features:** company roles, purchase approvals and spending limits are Enterprise only (LIQ-006 §12). The dashboard's Enterprise prompt is captured as it shows; nothing behind it is in scope.
- **Real tax providers:** Spree's built-in tax engine applies the exemptions here; provider-specific exemption codes stay with P4.
- **Tenant isolation:** ISO-1 to ISO-7 stay open, and FB-03 stays paused. No check reads or writes another store's records.
- **Whether Liquorify sells to businesses at all:** LIQ-006 marks §9 "not needed yet". This batch records what Spree does and decides nothing about it.

### 2.7 Found while preparing this proposal

Read in the code at `main` `a3a427fc`. It is checked on the running stack first, and what is confirmed is recorded before the captures depend on it.

- **The company invitation sends its buyer to a page the storefront does not have.** `Spree::CompanyMailer#invitation_email` builds its link as the store's storefront address followed by `/account/company-invitation` and the token. The storefront's `main` has no such page: its account pages are sign-in, register, password reset, orders, profile, cards, gift cards and addresses, and nothing in it calls the Store API's company invitation endpoints. Read in the code, the invited buyer has no page to accept on. If the storefront answers not found on the running stack, it is brought to the owner as a candidate existing defect, with a number from the defect register, before it is settled, as SD-32 was. The Store API's accept endpoint is called directly so the rest of the flow is still shown. Confirmed by part 1 on the running storefront and recorded as SD-86, for the owner's answer ([record §5](../verification/2026-11-10-fb-19-batch-wholesale.md#5-behaviour-found-recorded-and-not-changed)).

## 3. Components

Part 1's screens use 4 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the two company screens and their table definition import at `main` `a3a427fc`, followed through the components they import in turn; the first step of the work confirms it against the running screens.

| Layer | New in part 1 |
|---|---|
| Admin dashboard, top level (CMP-DA-G-24) | `company-address-sheet`, `company-kind-badge`, `enterprise-upsell`, `tax-exemption-certificates-card` |

The company page's profile, divisions, members, address book and tax registrations cards, its add division and add member dialogs, and the new company sheet are written inside their route files rather than as components, so they are captured as their screens' states and get no stories, as LIQ-010 §10 ties stories to component files. The companies table is a table definition shown through `resource-table`.

**Already covered, reused here:** `address-book-row` and the design system's `tax-identifiers-card` (batch 10, with the stories G-96 sent here), the dashboard's `tax-identifiers-card`, `company-combobox-option`, `catalog-audience`, `resource-table`, `table-toolbar`, `page-header`, `resource-layout`, `slot`, `can`, `confirm-dialog`, `row-actions`, `address-form-dialog`, `address-block`, `country-combobox`, `country-state-fields`, `store-date-picker`, `file-upload-field`, `status-badge`, `json-preview-drawer`, `route-pending`, `route-error-boundary`, and the primitives from earlier batches, among them `alert`, `badge`, `button`, `card`, `combobox`, `dialog`, `dropdown-menu`, `field`, `input`, `pagination`, `select`, `sheet`, `switch` and `toast`.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies, and this batch runs its share inside the batch: the image review list has a section for stories held by G-01, G-33, G-53, G-58, G-65, G-81, G-85, G-88, G-93, G-96, G-101, G-111 or G-116 that one of part 1's running screens shows, compared by the script as the batch's own stories are, each with the gap it came from.

- **G-96's 15 stories for batch 12:** the address book row's S2 to S5, S7 and S8 on DA-CUS-05's address book, and the design system's tax identifiers card's S11, S13 and S16 to S22 on DA-CUS-05's tax registrations. Each is compared, or keeps its status with the reason no part 1 screen shows it.
- **G-96's comparison follow-up stories expected in batch 12:** S24, S30, S33, S35, S40, S43, S46, S51, S55, S57, S61, S71, S74 and S78, on the wholesale buyer's DA-CUS-02 where the state shows. The seven states that pass before a settled capture can show them stay at their status, as the owner's answer says.

A story compared there leaves its gap; one no part 1 screen shows keeps its status and its gap's destination.

## 4. Delivery

- **One backend pull request for part 1,** with the stories, fixtures and mocks, reference images, capture and comparison scripts, verification record, image review list, evidence index and LIQ-009's Storybook column, followed by its merge record. This work item is its first commit.
- **Merge order:** LIQ-004's queue on `main` comes first. Pull requests from other lanes touch the same record files (LIQ-004, LIQ-009, the README index and the fidelity configuration's notes); whichever merges second brings itself up to date with `main` and keeps both entries.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batches 10 and 13 ran, in this session's own checkout, database and ports. The roles in §2.2 and the companies, members, invitations, addresses, registrations, certificates and orders each state needs are added through the Admin API on that server's database only, in the browser tests' default store.
- **The storefront** is run only to follow EM-C-11's link (§2.7), built from its `main` against the same server, and changed nowhere.
- **Evidence logs** are saved as `.txt`, because the root `.gitignore` drops `*.log`. Local and CI results are reported apart.

**Size, estimated from batch 10:** about 35 new stories and 70 reference images, the 29 earlier stories of §3.1 compared where shown, and about 80 running-screen captures with the role and phone variants.

## 5. Acceptance criteria for part 1

Batch 10's and batch 13's criteria, with criterion 12 naming this batch's specs, criterion 15 the behaviours no test drives, criterion 16 the hand-offs and settings of §2.3 and §2.4, and criterion 17 the email. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped, and every part 2 ID named with its part | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-10's staff step and the company invitation are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 or the captures show it is wrong | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Admin API controller and integration specs for companies, their addresses, memberships, invitations, tax registrations and tax exemption certificates, and tax exemption reasons; the Store API specs for companies, their addresses, members, invitations and orders, the account's companies and company invitations, with storefront gating and price gating; the company, company membership, company invitation, tax exemption, certificate and reason model specs, the purchase's company concern, the channel gating spec, the add member and accept invitation services, the certificate verification workflow; and the emails gem's company mailer and subscriber specs |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email, phone number, tax number, certificate number and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Invitation tokens and links in a captured email or page are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-97's and G-105's were. None is counted as tested | The record's list |
| 16 | Each hand-off in §2.3 and each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | Captures and the record |
| 17 | EM-C-11 is rendered from Spree's mailer preview and captured at 390 and 1280 pixels, its mailer specs are run, its link is followed (§2.7), and whether it is sent is read where the stack sends it or recorded as not reachable | The emails section |
| 18 | The comparison follow-up's share (§3.1): every earlier story a part 1 running screen shows is compared and leaves its gap, and every other story held for batch 12 keeps its status with part 2 or the follow-up named as its destination | The image review list's earlier stories section and LIQ-004's comparison follow-up |

## 6. Flow steps

### FL-10's staff step, and the company invitation

| Step | Part | Browser tests |
|---|---|---|
| SF-WHL-02, SF-WHL-01 (pending): a buyer applies | 2 | None |
| DA-CUS-01 or DA-CUS-02: add the customer to the Wholesale group | 1, batch 10's evidence | `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" |
| DA-CUS-05: add an existing customer as a member | 1 | `companies.spec.ts`: "adds an existing customer as a member and removes them" |
| DA-CUS-05: invite an email with no account | 1 | `companies.spec.ts`: "invites an email with no account, then revokes the invitation" |
| EM-C-11 and its link | 1 | None: rendered (§2.5), and its link followed on the running storefront (§2.7) |
| Accepting the invitation | 1, through the Store API (§2.7) | None: a gap. Shown by the batch's script |
| SF-WHL-03, SF-WHL-01, SF-WHL-06 or SF-WHL-04, SF-WHL-05, SF-CHK-01: sign in and order at trade prices | 2 | None |

The rest of part 1 is in no flow. Its other browser tests are `companies.spec.ts`'s remaining tests and `orders.spec.ts`'s purchase order and negotiated price tests (§2). No browser test edits a company's profile, adds or edits a division beyond creating one, edits or deletes an address or sets a default one, adds, edits or deletes a company's tax registration, verifies, revokes, downloads or deletes a certificate, filters or searches the companies list, or deletes a company from its own page.

## 7. Choices made under the owner's delegation

Batch 12 has no question that needs the owner now. Its choices are planning within the batch's approved scope, which LIQ-004 set as "Wholesale (§9)", and which the owner's delegation of 2026-11-04 and instructions of 2026-11-10 let the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **Two parts, each one implementation pull request.** The dashboard's company screens and the storefront's wholesale portal are in different repositories and share no components. Batch 9 and batches 4 and 10 kept the storefront and the dashboard apart in the same way.
2. **The dashboard comes first,** because FL-10's buyer reaches the portal only after staff approve them, and because the company invitation's link (§2.7) is settled before the portal is captured.
3. **Screens other batches captured are mapped, not redone.** DA-CUS-01, DA-CUS-02, DA-SET-02, DA-SET-08, DA-ORD-03 to DA-ORD-05, DA-PRD-13 to DA-PRD-17 and DA-SET-19 are mapped to their accepted evidence, and only their wholesale states are captured (§2.1).
4. **States are reached through the Admin and Store APIs,** on the browser-test database only, in its default store, as every batch has done. That database holds no sample data, so every company, catalog and price list is invented and made through the Admin API. A state they cannot reach is checked against its source and recorded as a coverage gap; a state reached by answering a request in the browser says so.
5. **Batch 10's five permission variants** are reused, since companies share the customers scope (§2.2).
6. **Settings are checked as evidence, not browser tests** (§2.4). Adding browser tests for them would be platform batch work; the record lists any that need one for the owner's answer (criterion 15).
7. **Spree's built-in tax engine only.** Provider exemption codes stay with P4.
8. **The comparison follow-up's share runs inside the batch** (§3.1), as batch 13 ran its share.

What stays with the owner: what §2.7's finding becomes if it is confirmed, the answers to the gaps the record lists, and anything the batch finds that would change scope, a defect or a criterion, which comes back to the owner before it is settled. New defect and gap numbers come only from the defect register's allocating thread, which reserved SD-86 to SD-93 and G-123 to G-128 for part 1 on 2026-11-10. Tenant isolation stays NOT_RUN.

## 8. Gaps known before the work starts

Recorded now so none is lost. The record says which it closes.

| Gap | What would close it |
|---|---|
| The behaviours listed at the end of §6 that no browser test drives | This batch's captures and scripted checks show them; the record lists them for the owner's answer (criterion 15) |
| The company invitation's link (§2.7) | Checked on the running stack; if confirmed, brought to the owner before it is settled |
| EM-C-11 is rendered from a preview and read as sent on the emails gem's test app, not the browser-test server | Recorded; closes with G-16's email configuration, as G-110 proposes for the seller emails |
| States the APIs cannot reach, such as a certificate that lapsed without being marked expired, if no date in the past can be saved | Shown in stories, checked against their source, and recorded as coverage gaps |
| States reached only by answering a request in the browser, such as loading and the page failing to load | Recorded as simulated interface-state coverage, as G-98 and G-108 were |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest is proposed to join G-11 |
| The storefront's wholesale portal and FL-10's buyer steps | Part 2 (§2.6, §10) |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change companies, members, certificates and orders on the browser-test server and the emails test app, both local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.

## 10. Part 2: the storefront's wholesale portal

Set out on 2026-11-11, after part 1 merged at `e3af0d59` ([merge record](../verification/2026-11-10-fb-19-batch-wholesale-merge.md)), from the backend at `main` `f9894eaf` and the storefront at its `main` `4a4324e`. It has the same shape as part 1, and the choices in §7 hold unless this section says otherwise. It runs in the storefront's repository, with its records in this one.

**The owner's instruction of 2026-11-11.** Later the same day the owner replaced the instruction to defer defect fixes until after the baseline, and widened the delegation to the decisions on defects and gaps (relayed by the coordinator). Under it, the baseline audit thread decided on 2026-11-11 that SD-86 is confirmed High and SD-9 stays High, that both are fixed in this lane, each in its own storefront pull request with a regression test that fails before the fix, and that G-128 is Spree's intended behaviour on one condition this part checks (§10.5). Those decisions are recorded in the audit's remediation ledger and are the delegation's, never the owner's answers. This section was amended for them before it merged.

### 10.1 Scope

LIQ-006 §9's buyer side: every wholesale screen in [LIQ-008](../LIQ-008-spree-screen-inventory.md), the home page's wholesale section, FL-10's buyer steps, and the pieces part 1 left here (§2.3, §2.6).

| Capability | Screens | Flows | Emails | Browser tests |
|---|---|---|---|---|
| CAP-09-02 The wholesale portal: trade-price catalog, product pages, wholesale cart and quick order by SKU | SF-WHL-01, SF-WHL-04, SF-WHL-05, SF-WHL-06; SF-CHK-01 and SF-CHK-03 for a wholesale cart; SF-OVL-01's wholesale link, mapped to the shop batch | FL-10, the buyer's ordering steps | EM-C-01 and EM-SF-01 for the wholesale order, mapped to batch 9 | None |
| CAP-09-03 Wholesale application and approval, the buyer's side | SF-WHL-02, SF-WHL-03; SF-WHL-01 pending and approved; SF-SHOP-01's wholesale section | FL-10, the buyer's application and sign-in steps | None (§10.6) | None |
| CAP-09-04 Gated channels, the buyer's side | SF-WHL-01, SF-WHL-04 to SF-WHL-06 under each access setting of the wholesale channel; SF-SHOP-01 to SF-SHOP-04 under the store's own setting, before and after SD-9's fix | None | None | None for the wholesale channel; SD-9's new regression tests for the store's pages (§10.12) |
| CAP-09-01 The company invitation, the buyer's side | The new page at `/account/company-invitation` that SD-86's fix adds, with EM-C-11's link followed to it | FL-10's invitation step | EM-C-11, mapped to part 1 | SD-86's new regression tests (§10.12) |

The storefront has no wholesale browser test at its `main`: `e2e/` holds account, sign-in, cart, catalog, checkout, order tracking and product tests, and `src/lib/__tests__/wholesale.test.ts` unit-tests only the portal's sign-in link. Every buyer step is therefore a gap for the owner's answer (§10.4, criterion 15).

Taken from part 1 (§2.3, §2.6): whether a catalog's or a price list's prices reach a buyer, shown on the storefront, with G-128's condition; CAP-09-04's storefront access for a signed-in customer, SD-9, now fixed here; the company invitation's link, SD-86, now fixed here; and the buyer's own checkout for a company that requires a purchase order number, which part 1 checked through the Store API (§6 of its record).

### 10.2 Screens and their states

Every state LIQ-008 lists for the six screens and the home page's section, and these besides, each captured at 390 and 1280 pixels:

- **Wholesale off:** every `/wholesale` address answering not found, the home page without its wholesale section and the header without its wholesale link.
- **The catalog (SF-WHL-01):** the sign-in wall, on a sign-in-required channel and on a public one, with a return address carried; guest browsing with "sign in for pricing" on a prices-hidden channel; application pending, with the applicant's name and email and its sign-out; the approved buyer's catalog with trade prices and the minimum quantity note; searched, filtered and sorted; no product matching a search; empty.
- **Applying (SF-WHL-02):** empty, filled, refused with the server's message (an email already registered, a short password), submitting, application received; the page reached by a signed-in customer.
- **Signing in (SF-WHL-03):** empty, a wrong password, and the return to the address the buyer came from.
- **The product page (SF-WHL-04):** the trade price and its hint for the approved buyer; the price hidden for a guest on a prices-hidden channel, with no way to add to the cart; a product with variants; out of stock or not purchasable; a product outside the buyer's company catalog, as the storefront shows it.
- **The wholesale cart (SF-WHL-05):** empty; items below the minimum quantity at the retail price with the nudge to unlock a better price; items at the minimum at the trade price; an item removed; the cart drawer bound to the wholesale cart; checkout opened.
- **Quick order (SF-WHL-06):** one row and several; the SKU search searching, with suggestions and with none; a SKU not found; a variant that cannot be bought; added; adding failed, reached by failing the request in the browser, which its capture says.
- **Checkout and the order placed page (SF-CHK-01, SF-CHK-03)** for a wholesale cart, with the wholesale channel's delivery and payment and its trade prices; a company that requires a purchase order number, as the buyer's checkout shows it.
- **The home page's wholesale section (SF-SHOP-01):** shown, at both widths, and its links followed.
- **The company invitation page (SD-86's fix):** a guest creating the account to accept; a signed-in invitee accepting; accepted; an invitation that is expired, already used or revoked, and a customer signed in with another email, each refused with the message the page shows.
- **Loading and failed states** across the portal, reached by holding or failing a request in the browser, which each capture says (as G-124).

### 10.3 Variants

There are no staff roles on the storefront. The variants are who visits and how the wholesale channel's access is set, on DA-SET-08's per-channel override, with the storefront built with the wholesale channel named (`SPREE_WHOLESALE_CHANNEL`) and once without it:

| Visitor | Public | Prices hidden | Sign-in required |
|---|---|---|---|
| A guest | Each screen as it shows | Each screen as it shows | Each screen as it shows |
| A signed-in customer not in the Wholesale group | Pending | Pending | Pending |
| An approved buyer, in the Wholesale group and no company | Every screen with trade prices | The same | The same |
| An approved buyer who is a member of a company with its own catalog | The catalog and prices the storefront shows, for G-128 | The same | The same |

The approved buyer also orders on a company that requires a purchase order number (§10.5). The store's own access setting, on DA-SET-02, is set to prices hidden and to sign-in required for SD-9, with a guest and a signed-in customer on SF-SHOP-01 to SF-SHOP-04, as the shop batch captured it.

What each visitor sees is decided in the storefront, by `WholesaleGate` reading the customer's groups. What the server answers the same visitor on the wholesale channel is recorded apart (§10.5), so the interface's gate is never counted as the server's.

### 10.4 FL-10, the buyer's steps

| Step | Screens | Browser tests |
|---|---|---|
| A buyer applies | SF-WHL-02 | None: a gap |
| The buyer sees the pending page | SF-WHL-01 pending | None: a gap |
| Staff add the customer to the Wholesale group | DA-CUS-01 or DA-CUS-02 | Batch 10's, mapped in §6 |
| The buyer signs in | SF-WHL-03 | None: a gap |
| The buyer browses at trade prices | SF-WHL-01, SF-WHL-04 | None: a gap |
| The buyer orders by SKU or from a product page | SF-WHL-06, SF-WHL-04 | None: a gap |
| The buyer reviews the cart | SF-WHL-05 | None: a gap |
| The buyer checks out and sees the order placed | SF-CHK-01, SF-CHK-03 | None for a wholesale cart; batch 9's checkout tests run the store's own cart |

FL-10 runs end to end on the running stack with Spree's Check method, as batch 13 placed its marketplace order. If the storefront cannot complete a wholesale checkout against the browser-test server, the record says so and a Store API order on the wholesale channel is placed instead.

### 10.5 Checked where it takes effect

Each is made or saved on its screen and seen, or not, where it takes effect, with captures or read values of both sides and the result recorded per row (criterion 16). They are evidence, not browser tests.

| What | Where it is checked |
|---|---|
| An application on SF-WHL-02, with a company name and phone | The customer on DA-CUS-01 and DA-CUS-02: the phone, and the company name the storefront sends as metadata, as staff see them. Whether anything tells staff that someone applied, read in the storefront's and Spree's code and on the emails gem's test app |
| The customer added to the Wholesale group, and removed (DA-CUS-02) | SF-WHL-01 for that buyer on the next visit, from pending to the portal and back |
| The Wholesale price list's prices and minimum quantity (DA-PRD-14, DA-PRD-15) | The prices on SF-WHL-01, SF-WHL-04, SF-WHL-05 and SF-WHL-06 below and at the minimum; then the minimum changed in the dashboard and the storefront's own note and nudge read again, since the storefront states the minimum as a fixed number (`WHOLESALE_MIN_QUANTITY` in `src/lib/wholesale.ts`) |
| The wholesale channel's access setting (DA-SET-08) | Each screen for each visitor in §10.3, beside what the Store API answers the same visitor for the same request on the wholesale channel |
| A signed-in customer not in the Wholesale group | What the Store API gives that customer on the wholesale channel when the storefront's pending page is bypassed: products, prices and cart, recorded as the server's answer and not as an isolation check |
| A company with its own catalog, and a buyer who is its member and in the Wholesale group (DA-CUS-05, DA-PRD-13) | G-128's condition. By Spree's documented contract (`docs/developer/core-concepts/catalogs.mdx`, "How pricing resolves") the catalog's assortment limits what the company's buyers can buy, and prices resolve from the catalog's own price list, then any price list whose rules match, then the base price. The portal is captured for that buyer with three products: one outside the assortment (not offered, by design); one inside it that the catalog prices (the catalog's price); and one inside it that the catalog does not price (the Wholesale price, at and above its minimum quantity). If the third shows the base price, that is a defect, numbered SD-101 by the audit thread and fixed in this lane. G-128 closes on this evidence either way |
| A company that requires a purchase order number (DA-CUS-05) | The member buyer's checkout of a wholesale cart on SF-CHK-01: whether the storefront asks for a purchase order number, and what the buyer sees when Spree refuses the order without one |
| A wholesale order placed (SF-CHK-03) | The order on DA-ORD-04: its channel, its trade prices and its customer; and the wholesale channel's guest checkout setting, with a guest's cart refused as the screen shows it |
| SD-9, the store's access setting (DA-SET-02) | SF-SHOP-01 to SF-SHOP-04 for a signed-in customer and a guest under prices hidden and sign-in required, on the storefront at its `main` and again with SD-9's fix (§10.12) |
| SD-86, the company invitation (DA-CUS-05) | An invitation sent from the company page, EM-C-11's link followed on the storefront at its `main` and again with SD-86's fix, accepted, and the membership seen on DA-CUS-05 and through the Store API (§10.12) |

### 10.6 Emails

No email belongs to FL-10's buyer steps. The storefront registers the applicant through the shared sign-up, and neither it nor Spree sends an email to tell staff of an application or the buyer of an approval, read in the code at the revisions above and confirmed on the emails gem's test app where it can be; what is found is recorded under §10.5's first row. The wholesale order's confirmation, EM-C-01 and EM-SF-01, stays mapped to batch 9, and whether it is sent for an order on the wholesale channel is read where the stack sends it or recorded with G-127's route to G-16.

### 10.7 Components

8 components have no stories yet, all in the storefront's wholesale route group: `WholesaleApplicationPending` (CMP-SF-PG-05), `WholesaleGate` (CMP-SF-PG-06), `WholesaleGuestBrowse` (CMP-SF-PG-07), `WholesaleHeader` (CMP-SF-PG-08), `WholesaleSignInWall` (CMP-SF-PG-09), `WholesaleCartView` (CMP-SF-PG-10), `QuickOrderView` (CMP-SF-PG-11) and `SkuCombobox` (CMP-SF-PG-12). `WholesaleGate` is a server component that reads the session and the channel; it gets stories for each branch through the storefront's existing data mocks if they can hold it, and otherwise is recorded under LIQ-009's U-codes with the running screens as its evidence, as `DocumentShell` was.

The wholesale section of CMP-SF-G-05 has its story already (`Storefront/Home/Wholesale section`); it is compared with the running home page, not redone. The pages in `(wholesale)/wholesale/` (apply, sign in, catalog, product, cart and quick order) are screens, captured as their states, as LIQ-010 §10 ties stories to component files. Everything else the portal uses, among them `ProductListing`, `CartDrawer`, `CartProvider`, the checkout components and the `ui/` primitives, has its story from an earlier storefront batch; any the first step finds without one is added and listed.

**Earlier stories:** the comparison follow-up's share for the storefront runs inside this part, as §3.1 did for part 1: every story held by a gap that a part 2 running screen shows, among them batch 9's checkout stories held by G-73, is compared and leaves its gap, or keeps its status with its destination.

**Size, estimated from the storefront batches:** about 30 stories and 60 reference images, and about 110 running-screen captures at both widths.

### 10.8 Delivery

- **Three storefront pull requests,** each on storefront `main`: SD-86's fix, then SD-9's fix, each with its regression tests and nothing else (§10.12); and the batch's stories, fixtures and mocks, reference images, and the capture and comparison additions in `visual/fidelity/`, which changes no application code. The captures are made with both fixes in place, and the "before" states of SD-9 and SD-86 at `main` `4a4324e`.
- **One backend records pull request** after it: the verification record, the published evidence, the image review list, LIQ-009's storefront column, LIQ-004's FB-19 status and the README index, then its merge record. This section is committed and merged on its own first, before anything is built.
- **Running screens:** the storefront built for production at its `main`, once with `SPREE_WHOLESALE_CHANNEL=wholesale` and once without, against the backend's browser-test server at `main`, in this session's own checkout, database and ports. Spree's sample catalog is loaded with Spree's own task, which seeds the wholesale channel, the Wholesale group and price list; every buyer, company and catalog in a capture is invented and made through the storefront or the Admin API.
- **Captures:** in the storefront's pinned Playwright image, at 390 and 1280 pixels, with the fonts served offline. Evidence logs are saved as `.txt`.

### 10.9 Acceptance criteria for part 2

Part 1's criteria (§5), read for the storefront's portal, with the storefront batches' widths. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability of §10.1 is mapped to its screens, flow steps, visitors, meaningful states, components, browser tests and emails, with no SF-WHL ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the portal uses has a story for each meaningful state, at both widths, with a reference image; components already covered are listed, not redone; a component no story can hold is recorded with its U-code | Coverage report and image review list |
| 3 | Every screen is captured on the running storefront, at the pinned revision, in each state in §10.2, at both widths | Running-screen captures, indexed by screen ID and state |
| 4 | Each variant in §10.3 is captured, showing what the interface does for it | Captures per variant |
| 5 | FL-10's buyer steps are traced step by step to their screens and run end to end on the running stack; each step with no browser test is recorded as a gap | Flow map and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its fixtures or its mocks, never in the storefront's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision; the storefront's lint, type check, unit tests and browser tests pass; the check stays advisory | CI runs, named in the merge record |
| 9 | Spree's code and every workflow are unchanged; the storefront's application code changes only for SD-86's and SD-9's fixes, each in its own pull request; nothing carries Liquorify branding or features | The pull requests' file lists |
| 10 | The records are updated: a verification record, LIQ-009's storefront column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where the captures show it is wrong | The records pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | What the server refuses or gives each visitor is recorded apart from criterion 4: the record names Spree's own specs, runs them at the batch's revision, and lists what they exercise. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Store API specs for products, channels, customers (registration), carts and their items and orders on a channel, with storefront gating and price gating; the channel gating spec; the price list, price rule and customer group pricing specs |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. What a non-member gets on the wholesale channel is a check within one store, recorded as such and not as isolation. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, company, address, email, phone number, SKU and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull requests' files before each push. Publishable keys, tokens and invitation links are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on the portal that no browser test drives are listed for the owner's answer, as G-105's and G-123's were. None is counted as tested | The record's list |
| 16 | Each row of §10.5 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | Captures and the record |
| 17 | §10.6's reading of the emails is recorded, and EM-C-01 and EM-SF-01 stay mapped to batch 9 | The emails section |
| 18 | The comparison follow-up's share (§10.7): every earlier story a part 2 running screen shows is compared and leaves its gap, and LIQ-004's comparison follow-up records what batch 12 leaves | The image review list's earlier stories section and LIQ-004 |
| 19 | SD-86 and SD-9 are fixed as §10.12 sets out: each regression test fails at storefront `main` and passes with the fix, its controls succeed and its refusals are refused, in CI on the fix's final commit, and each defect's register and LIQ-004 rows record the fix and its evidence | The two fix pull requests, their CI runs and the records |
| 20 | G-128 closes on §10.5's evidence: the product inside the assortment that the catalog does not price shows the Wholesale price, or SD-101 is recorded and fixed with the same test rule | The captures, the price readings and the records |

### 10.10 Choices made under the owner's delegation

As §7, with these for part 2. Each is recorded as decided under the delegation, never as the owner's answer, and the owner may change any of them.

1. **One storefront pull request and one records pull request,** as batch 9 delivered the storefront's checkout: the stories and capture scripts belong with the storefront's own visual check.
2. **The company invitation page is added as SD-86's fix,** decided by the audit thread under the owner's instruction of 2026-11-11: Spree's mailer and Store API already define the page's address and its accept endpoint, so the fix completes Spree's contract and adds no Liquorify feature.
3. **Trade prices are shown first for a buyer in the Wholesale group who belongs to no company with its own catalog,** the case Spree's sample data and the storefront are built for; the company member's portal is then captured for G-128's condition (§10.5).
4. **No browser tests are added for the portal.** Adding them would be platform batch work; the record lists the behaviours for the owner's answer (criterion 15).
5. **Spree's Check method pays for the wholesale order,** as batch 13 placed its marketplace order; real payment providers stay with P4 and G-130.

Under the owner's instruction of 2026-11-11, decisions on defects and gaps found here are made in the project and recorded with their reasons, by the audit thread; the owner is asked only for credentials, a purchase or contract, a change to payment responsibility or a destructive production action. New numbers come only from the defect register's allocating thread, from SD-101 and G-131. Tenant isolation stays NOT_RUN.

### 10.11 Gaps known before the work starts

| Gap | What would close it |
|---|---|
| FL-10's buyer steps, which no browser test drives (§10.4) | Captured and run end to end; listed for the owner's answer (criterion 15) |
| States reached only by answering a request in the browser, such as loading and a failed quick order add | Recorded as simulated interface-state coverage, as G-124 |
| `WholesaleGate`, if no story can hold a server component that reads the session | Recorded under its U-code, with the running screens as its evidence |
| How a company's catalog and the Wholesale price list combine (G-128) | §10.5's condition checked; closes on that evidence, or SD-101 is fixed |
| The company invitation's acceptance (SD-86) | SD-86's fix and its tests (§10.12) |
| Signed-in customers treated as guests under gated access (SD-9) | SD-9's fix and its tests (§10.12) |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7 |

### 10.12 The two fixes in this lane

Each fix is its own storefront pull request, with only the change and its tests, reviewed and merged on its own before the captures depend on it. Each regression test is shown failing at storefront `main` `4a4324e` and passing with the fix, and the record keeps both runs.

| Defect | The fix | Tests |
|---|---|---|
| SD-86, High: the company invitation email's link goes to a storefront page that does not exist | A page at `/account/company-invitation` that reads the token from the link, looks the invitation up through the Store API and shows the company being joined, then accepts it through the existing accept endpoint: a guest creates the account with the invited email, as the endpoint expects, and a signed-in invitee accepts directly. No backend change: Spree's mailer and Store API already define both ends | A browser test that opens the link and accepts it (fails at `main` with not found); controls: a valid invitation accepted by a guest who creates the account, and by a signed-in invitee; refusals: an expired, already used and revoked invitation, which Spree does not find, and a customer signed in with another email, whom Spree refuses, each shown as refused with no membership made |
| SD-9, High: the storefront treats every shopper as a guest under prices hidden and sign-in required | Send the signed-in customer's token with the store's own product, category and search requests, as the wholesale pages already do, without letting one customer's answer be cached for another | Browser tests: a signed-in customer sees prices under prices hidden and browses under sign-in required (both fail at `main`); controls: a guest under public, and the customer's prices matching the product page; refusals: a guest under prices hidden sees no price and under sign-in required is refused, and a guest after a customer's visit gets no customer's answer from the cache |

