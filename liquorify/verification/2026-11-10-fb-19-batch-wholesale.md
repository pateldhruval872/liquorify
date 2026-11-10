---
title: FB-19 batch 12 part 1, wholesale in the dashboard
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session); not independent review
result: PASS for the map, the 17 stories and their 34 reference images, the running-screen captures (52 states in 60 captures, each in light and dark), the comparison with running screens (16 of the batch's cases and 20 earlier stories in both themes, every difference explained), and Spree's own specs for the batch's endpoints, models, services, workflow and mailer, 511 examples with no failures. FL-10's staff step and the company invitation are traced step by step. PASS for the hand-offs of §2.3 and the six rows of §2.4, each checked where it takes effect. EM-C-11 is rendered by Spree's own mailer, read as sent on the emails gem's test app, and its link followed on the running storefront, where it ends on a page that does not exist (SD-86). Backend authorization for the narrower roles beyond Spree's own specs, and tenant isolation, are NOT_RUN. Four existing defects (SD-86 to SD-89) and six gaps (G-123 to G-128) are recorded for the owner. Criterion 8 counts CI on the final commit, named in the merge record
---

# FB-19 batch 12 part 1, wholesale in the dashboard

**Claim.** The [batch 12 work item](../work-items/fb-19-batch-wholesale.md) reproduces what Spree already has for selling to businesses. Part 1, recorded here, is the dashboard's side: the companies list and a company's page with every card, a company's purchase order requirement and tax exemption certificates seen on its orders, and a company's catalog and the Wholesale price list seen as the Store API prices them for its buyers. It gives the four new components those screens use 17 Storybook stories with light and dark reference images. It captures the two company screens and the wholesale states of three other screens on Spree's running dashboard, compares the stories with them, and checks on the running stack that what these screens save takes effect where it should. It changes no Spree code and adds no Liquorify feature.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | #109, branch `claude/project-thread-qike5i`. It starts from `main` at `a3a427fc`, the revision the work item names: the work item is `5ddc696e`, the stories, fixtures, mocks and reference images `6770f76f`. The seed, capture, comparison, check and email scripts and these records follow. Later commits that bring in `main` change no file this batch uses. The final commit is named in the merge record |
| Spree's code: the dashboard, its packages, the SDKs and the gems | Unchanged: `git diff` between `main` and the branch over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk`, `.github` and `pnpm-lock.yaml` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures (the browser-test server), at that code, in the pinned Playwright 1.64.1 image. Captures are 1280 by 960 pixels, and 390 by 844 for the phone capture; a page captured whole grows the window to the page's height |
| The storefront | Built from its `main` at `4a4324e`, unchanged, against the same server, and used only to follow EM-C-11's link (§9) |
| The emails | Rendered and sent on the emails gem's own test app, against a copy of the browser-test server's database (§9) |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-wholesale.md#5-acceptance-criteria-for-part-1)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped, and every part 2 ID named with its part | PASS: the map in §2 has CAP-09-01 and CAP-09-03 to CAP-09-06 with their screens, FL-10's staff step and the company invitation, the `customers` scope, the four components, Spree's `companies.spec.ts` (9 tests) and the earlier batches' tests, and EM-C-11, each with its evidence or a named gap. CAP-09-02, the buyer's side of CAP-09-03 and CAP-09-04, SF-WHL-01 to SF-WHL-06 and FL-10's buyer steps are named as part 2's |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 4 new components, 17 stories, 34 reference images, each looked at in both modes ([image review list](2026-11-10-fb-19-batch-wholesale-image-review.md)). The running screens use the four the work item named. The reused components are the work item's §3 list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | PASS for every listed state, with the states no server reaches recorded as corrections (§6). 52 states of the five screens are captured, in 60 captures with the role and phone variants, each in light and dark, 120 images. 4 states were reached by answering a request in the browser, and say so (§2.1, G-124) |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen, the order manager, support and customer manager roles on both company screens, the order manager on DA-ORD-03, and the merchandiser's direct visits |
| 5 | FL-10's staff step and the company invitation are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | PASS. The steps are traced in §2.2. The steps with browser tests map to Spree's `companies.spec.ts` and batch 10's `customers.spec.ts` tests, which run in CI at the pull request's revision (§10). The email's link and the acceptance have no browser test; the acceptance is shown through the Store API (§8) and listed under criterion 15 (G-123) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 16 cases of the batch's stories were compared in both themes, 32 comparisons, and every difference is explained by the data, by where the pointer or focus is, or by the page around a popup. Two stories were corrected (§4.3) |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: one of the 17 stories, the certificates card loading, was not compared, and is checked against its source (G-125). The expired certificate status is reached by no workflow and is shown in a story only (§6). Every capture whose state was reached in the browser names how in its note, and claims nothing about the server (§2.1, G-124) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | Recorded in the merge record, which names the two full runs on the final commit (§10). Nothing is merged unless both pass with Tests and Packages |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from merges of `main`. No workflow, lockfile or Spree file changes, and the storefront has no commit |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 or the captures show it is wrong | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-008's DA-CUS-04, DA-CUS-05 and DA-ORD-03 rows (§6), LIQ-004's FB-19 entry, progress table, gap register, existing defects and comparison follow-up, the work item's corrections and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at #109's final commit (§14). Not the owner's review. The defects and gaps the batch records stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 511 examples, 0 failures and 3 pending, saved as `backend/api-specs.json` (209), `backend/core-specs.json` (295) and `backend/email-specs.json` (7) (§3.2). Most run as the store's admin or as a customer of the company; none sends a narrower staff role. What no spec exercises for the narrower roles is NOT_RUN (G-126) |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | NOT_RUN (§3.3). ISO-1 to ISO-7 stay open. No check read or wrote another store's records. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, address, email, phone number, tax number, certificate number and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Invitation tokens and links in a captured email or page are masked in every capture and replaced in every record | PASS: the stories use invented companies, people, addresses, tax numbers and certificate numbers; the running screens show the test server's records and the records the scripts add, with `example.com` addresses. The invitation's token is replaced by `<token>` and the storefront's address by `<site>` in EM-C-11 and its record; the storefront link check used a made-up token; the acceptance check reads a token in memory and writes none out. The search's result is in §10 |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-97's and G-105's were. None is counted as tested | PASS: 17 behaviours no browser test drives are listed in §2.3, each with its evidence and the Spree specs for the server's side. None is counted as tested. They are G-123, for the owner's answer |
| 16 | Each hand-off in §2.3 and each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | PASS (§7 and §8): the seven hand-offs are shown, the last named as part 2's, and the six rows are checked where they take effect. The purchase order row is checked at the buyer's checkout, where Spree applies it, because staff orders are exempt by design (§6). The catalog and price list row shows that the Wholesale price list never reaches a company's buyer while the company's catalog limits what they can buy (§8, G-128) |
| 17 | EM-C-11 is rendered from Spree's mailer preview and captured at 390 and 1280 pixels, its mailer specs are run, its link is followed (§2.7), and whether it is sent is read where the stack sends it or recorded as not reachable | PASS (§9): rendered by Spree's mailer as its preview builds it, captured at both widths, its 7 mailer and subscriber examples pass, and it is read as sent on the emails gem's test app when staff invite an email with no account. Its link was followed on the running storefront and ends on a page that does not exist (SD-86) |
| 18 | The comparison follow-up's share (§3.1): every earlier story a part 1 running screen shows is compared and leaves its gap, and every other story held for batch 12 keeps its status with part 2 or the follow-up named as its destination | PASS: 14 of G-96's 15 stories for batch 12 and 6 of its follow-up stories expected here were compared and leave G-96; S19 and eight follow-up stories keep their status, each with the reason ([image review list](2026-11-10-fb-19-batch-wholesale-image-review.md#earlier-stories)) |

## 1. What was built

- **Stories:** 17 stories for the four components of the work item's §3, in `packages/liquorify-storybook/src/stories/dashboard/companies/`, with fixtures and mocks for the companies, their addresses, certificates and tax exemption reasons. The stories hold canonical values only and render Spree's own components with Spree's own providers, as earlier batches do. A new column width, `inDialog`, holds the Enterprise prompt at the width of the add member dialog it sits in.
- **Reference images:** 34, one per story and theme.
- **Scripts,** in `packages/liquorify-storybook/fidelity/`, none of them a browser test:
  - `companies.ts` makes the wholesale data on the browser-test server through the Admin API: five companies and divisions, four buyers, a pending invitation, addresses, a tax registration, certificates in each status a workflow reaches, two published trade products, the company's catalog and the Wholesale price list.
  - `screens-batch-12.spec.ts` captures the running screens; `compare-batch-12.spec.ts` compares the stories with them.
  - `wholesale-checks.spec.ts` checks the rows of §2.4 where they take effect, and follows the invitation's link on the storefront.
  - `company-emails.rb` renders EM-C-11 with Spree's own mailer and reads what the emails gem sends when staff invite an email with no account; `order-emails.spec.ts`, from batch 8, captures it.

The coverage report lists the four components with their stories, and LIQ-009's Storybook column now names them.

## 2. The batch's map

| Capability | Screens | Flows | Emails | Browser tests | Evidence |
|---|---|---|---|---|---|
| CAP-09-01 Companies and divisions, members, invitations and address books | DA-CUS-04, DA-CUS-05; DA-CUS-01's company column and filter (batch 10) | The company invitation | EM-C-11 | `companies.spec.ts` (9) | 48 states, 55 captures; the members, invitation and address book checks (§8) |
| CAP-09-03 Wholesale approval, the staff step | DA-CUS-01, DA-CUS-02 (batch 10); the wholesale buyer's DA-CUS-02 | FL-10's staff step | None | `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" (batch 10) | Batch 10's captures; DA-CUS-02 wholesale-buyer |
| CAP-09-04 Gated channels, the dashboard side | DA-SET-02, DA-SET-08 (batches 3 and 4) | None | None | `store-settings.spec.ts`, `channels-settings.spec.ts` (batch 3) | Batch 3's and 4's captures; the gating specs (§3.2) |
| CAP-09-05 Purchase order numbers; negotiated prices | DA-CUS-05's purchase order switch; DA-ORD-03 with a company chosen; DA-ORD-04's purchase order card and DA-ORD-05's negotiated price (batch 8) | None | None | `companies.spec.ts`: "creates a company and requires PO numbers on its orders"; `orders.spec.ts`: "carries a PO number and its document onto the created order", "sets a negotiated unit price on a draft order line" | DA-CUS-05 purchase-order-required; DA-ORD-03 company-chosen and purchase-order-company; the purchase order check (§8) |
| CAP-09-06 B2B catalogs, price lists and freight | DA-PRD-13 to DA-PRD-17, DA-SET-19 (batches 5 and 7); DA-PRD-13 with a company chosen | None | None | `catalogs.spec.ts`, `price-lists.spec.ts`, `package-types.spec.ts` (batches 5 and 7) | DA-PRD-13 audience-company; the prices check (§8) |

**Part 2's:** CAP-09-02, the buyer's side of CAP-09-03 and CAP-09-04, SF-WHL-01 to SF-WHL-06, FL-10's buyer steps, the home page's wholesale section and SD-9 checked again (work item §2.6).

### 2.1 Screens and their states

Each capture is in the [evidence](evidence/2026-11-10-fb-19-batch-wholesale/README.md) as `screens/<screen>/<state>/<variant>-<theme>.webp`, with a note of how it was reached. "In the browser" marks a state reached by answering a request in the browser (G-124).

| Screen | States captured |
|---|---|
| DA-CUS-04 Companies | listed (four roles), searched, filtered by kind, sorted, the new company sheet empty, filled and refused, the delete confirmation, the merchandiser's direct visit; loading and none in the browser |
| DA-CUS-05 Company | a company with divisions, members, a pending invitation, addresses, a registration and certificates (four roles, and on a phone); a division; a company with nothing yet; the purchase order switch on; the profile saved and refused; the add sub-unit dialog for a company and for a division; the add member dialog with its Enterprise prompt, a member added, an invitation made, the remove member and revoke invitation confirmations; the address row menu, the add and edit sheets, a refused save, the delete confirmation; the tax registration menu, add and edit sheets and delete confirmation; the certificates card with pending, accepted, revoked and lapsed certificates, the menus on a pending and an accepted certificate, the add sheet, a refused add, a certificate accepted, the revoke confirmation, a certificate revoked, the delete confirmation; the JSON drawer; not found; the header's delete confirmation; the merchandiser's direct visit; loading and the page failing to load in the browser |
| DA-ORD-03 New order | a company chosen, with its help (two roles); a company that requires a purchase order number |
| DA-PRD-13 Catalog | the audience card with a company chosen |
| DA-CUS-02 Customer | the wholesale buyer, in the Wholesale group and a member of a division |

### 2.2 FL-10's staff step, and the company invitation

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| Add the customer to the Wholesale group | DA-CUS-01, DA-CUS-02 | `customers.spec.ts`: "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" | Batch 10's captures; DA-CUS-02 wholesale-buyer, whose Customer groups card holds Wholesale |
| Add an existing customer as a member | DA-CUS-05 | `companies.spec.ts`: "adds an existing customer as a member and removes them" | member-add, member-added, member-remove-confirm; the members check (§8) |
| Invite an email with no account | DA-CUS-05 | `companies.spec.ts`: "invites an email with no account, then revokes the invitation" | invitation-made, invitation-revoke-confirm |
| EM-C-11 and its link | Email; the storefront | None | Rendered and read as sent (§9); the link ends on a page that does not exist (SD-86) |
| Accepting the invitation | Store API | None | The acceptance check (§8): looked up, accepted with a new account, and the new buyer reads the company as theirs |

### 2.3 Behaviours no browser test drives (criterion 15)

Each was shown by a capture or a check, and none is counted as tested. The server's side of each is exercised by the Spree specs named in §3.2. They are G-123, for the owner's answer.

1. Searching, filtering by kind and sorting the companies list (DA-CUS-04 searched, filtered-kind, sorted).
2. A refused new company (DA-CUS-04 new-sheet-refused).
3. Editing a company's profile, saved and refused (DA-CUS-05 profile-saved, profile-refused).
4. Adding a sub-unit under a division (DA-CUS-05 sub-unit-add-division).
5. Editing an address, setting a default from the row menu, and deleting one (address-menu, address-edit, address-delete-confirm).
6. A refused address save beyond the missing state (address-refused).
7. Adding, editing and deleting a company's tax registration (tax-add, tax-edit, tax-delete-confirm).
8. Accepting a pending certificate (certificate-accepted).
9. Revoking an accepted certificate (certificate-revoke-confirm, certificate-revoked).
10. Deleting a certificate (certificate-delete-confirm).
11. Downloading a certificate's document: the menu offers it, and no seeded certificate holds a document, so it was not opened (certificate-menu-pending).
12. A refused certificate (certificate-add-refused).
13. Deleting a company from its own page (delete-confirm), whose confirmation does not warn about its sub-units (SD-87).
14. The JSON drawer (json-drawer).
15. Accepting an invitation through its link (the acceptance check, §8).
16. A company's purchase order requirement at a buyer's checkout (the purchase order check, §8).
17. Whether an accepted certificate exempts a company's order, and which company's certificate a division's order reads (the tax check, §8).

## 3. Permissions and isolation

### 3.1 What the interface shows each role

What the interface shows is not what the server enforces; §3.2 records the server's side.

| Role | Permission keys | What the captures show |
|---|---|---|
| Admin | All | Every screen with every control |
| Order manager (template) | write orders, payments, fulfilments, refunds, gift cards and store credits; read customers | DA-CUS-04 without the Add company button, each row keeping its menu button, which was not opened; DA-CUS-05 read-only: no Add buttons, no row menus, the name field and the purchase order switch disabled, and no Save. DA-ORD-03 with a company chosen, which this role may create |
| Support (template) | read orders, customers and the dashboard | As the order manager on both company screens |
| Customer manager (custom) | write customers only | Both company screens editable, with every Add button, row menu and Save; no Orders entry |
| Merchandiser (template) | write products, categories, collections and stock; no customer scope | The Customers and Companies entries hidden. A direct visit to DA-CUS-04 shows an empty list, "No companies yet", and one to DA-CUS-05 "Could not load this company" and "Company not found", rather than a refusal |

### 3.2 What the server refuses

**Spree's own specs, at Spree's code `a3a427fc`.** Run in this session on SQLite with Spree's API, core and emails test apps. 511 examples, 0 failures and 3 pending: SQLite cannot query records by metadata, so the shared metadata example skips itself there. Every example is listed with its result in [api-specs.json](evidence/2026-11-10-fb-19-batch-wholesale/backend/api-specs.json) (209 examples, seed 29100), [core-specs.json](evidence/2026-11-10-fb-19-batch-wholesale/backend/core-specs.json) (295, seed 9164) and [email-specs.json](evidence/2026-11-10-fb-19-batch-wholesale/backend/email-specs.json) (7, seed 1033).

| Endpoint or model | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Companies, their addresses, memberships and invitations, in the Admin API | `companies_controller_spec.rb` (23), `companies/addresses_controller_spec.rb` (7), `companies/memberships_controller_spec.rb` (5), `companies/invitations_controller_spec.rb` (6), and the integration specs (14) | As the store's admin: listing, the kind filter and the tree; creating, updating and deleting with the subtree; an email with an account becoming a member and one without becoming an invitation; revoking; another store's company answers 404 |
| Tax registrations, certificates and reasons, in the Admin API | `companies/tax_identifiers_controller_spec.rb` (11), `companies/tax_exemption_certificates_controller_spec.rb` (21), `tax_exemption_reasons_controller_spec.rb` (12), and the integration specs (21) | Registrations only on a legal entity, a division refused; certificates added, accepted, revoked and deleted, with their documents; a reason of another store refused |
| The buyer's side in the Store API | `store/companies_controller_spec.rb` (6), `store/companies/addresses_controller_spec.rb` (8), `store/companies/members_controller_spec.rb` (7), `store/companies/invitations_controller_spec.rb` (5), `store/companies/orders_controller_spec.rb` (4), `store/account/companies_controller_spec.rb` (3), `store/company_invitations_controller_spec.rb` (9), and the integration spec (17) | As a member and as a non-member customer: a company not theirs answers 404; members invite and revoke; an invitation is looked up and accepted by its token, and a revoked or expired token answers 404 |
| Storefront access and price gating | `store/storefront_gating_spec.rb` (13), `price_gating_spec.rb` (21), core `channel/gating_spec.rb` (13) | A gated channel's answers to a guest, a signed-in customer and a customer in the allowed group |
| Companies, memberships, invitations and the purchase's company | core `company_spec.rb` (30), `company_membership_spec.rb` (6), `company_invitation_spec.rb` (9), `purchase/company_spec.rb` (32), `companies/add_member_spec.rb` (6), `company_invitations/accept_spec.rb` (9), `checkout/requirements_spec.rb` (31) | The tree and the legal entity; members counted across the subtree; a cart resolving its buyer's company; the purchase order requirement for a buyer, and none for staff orders |
| Tax exemptions | core `tax_exemption_spec.rb` (12), `tax_exemption_certificate_spec.rb` (22), `tax_exemption_reason_spec.rb` (7), `tax/resolve_exemptions_spec.rb` (11), `tax_exemption_certificates/verify_spec.rb` (7), `tax_provider/internal_spec.rb` (37), `purchase/taxation_spec.rb` (39) | Which certificates exempt an order: accepted, current and for the tax address's region, read through the legal entity |
| The invitation email | emails `company_mailer_spec.rb` (3), `company_email_subscriber_spec.rb` (4) | The email's recipient, subject and link, and that the subscriber sends it on an invitation's creation |

What no spec exercises for the batch's narrower roles, such as the order manager's and support's refusals on the company write endpoints and the merchandiser's on the reads, is NOT_RUN. It is proposed to join G-11 (G-126).

### 3.3 Whether each store's data stays in that store

NOT_RUN. FB-03's validation stays paused and ISO-1 to ISO-7 stay open. No check read or wrote another store's records. Spree's own specs above include refusals of another store's records; they are not a validation of isolation.

## 4. Comparison with running screens

### 4.1 Results

16 cases of the batch's stories, each in light and dark, from `compare-batch-12.spec.ts`; the [evidence index](evidence/2026-11-10-fb-19-batch-wholesale/README.md) links every side-by-side image and its computed styles. Eight cases have no difference in computed style. The other eight:

| Case | Differences | Explained by |
|---|---|---|
| b12-certificates-card, b12-certificates-card-read-only | 7 and 8, on the card's and each certificate's height and the gap between certificates | Data: the story's certificates hold documents, each with a small download button, which also narrows the list's gap; no seeded certificate holds one |
| b12-certificates-card-pending-menu | 1, the menu's height | Data: the menu offers Download document only when the certificate holds one |
| b12-certificates-card-revoke-confirm, b12-certificates-card-delete-confirm | 3 each, on the dialog's Cancel button | Focus: the story's dialog has focus on Cancel, the screen's on the dialog |
| b12-certificates-card-required, b12-company-address-sheet-state-missing | 1 each, the Save button's background | Pointer: on the screen the pointer rests on Save after clicking it |
| b12-company-address-sheet-state-missing | And the message at the top of the sheet | Data: the browser-test server's United States does not say states are required, so the screen's sheet sends the address and shows Spree's refusal, "State / Province can't be blank"; the story's country says they are, so the sheet asks for the state itself, "State / Province is required", as it does on a store with Spree's own country data |
| b12-certificates-card-reasons-listed | 39 | The page around the list: the reasons open in a layer over the whole page, so the case compares the page, and the dashboard's page differs from the story's empty canvas. The list itself matches |

Values that differ on purpose, with the same layout: the companies, people, numbers and dates, which are the invented Larkspur ones on the screen and the invented Tidewater ones in the stories.

### 4.2 Earlier stories

20 cases, compared as the batch's own stories ([image review list](2026-11-10-fb-19-batch-wholesale-image-review.md#earlier-stories)). 14 of G-96's 15 stories for batch 12 and 6 of its follow-up stories expected here, each in light and dark. Six cases have no difference in computed style. The others are explained as the batch's own cases are:

- **The address book row's four rows and its menu on the default address:** heights only, from the data: the screen's rows hold a company line, a second address line or a phone the story's rows do not, and the menu holds the items the row's defaults give it.
- **The shared tax identifiers card read-only, and the customer's read-only card:** heights and the rows one side has: the story's cards hold registrations, the screen's company holds one and the wholesale buyer none.
- **The refused registrations and the nothing entered sheet:** the Save button under the pointer, and in the sheet the number field's focus ring.
- **The delete confirmation:** focus on Cancel in the story.
- **The kinds listed:** the page around the list, as b12-certificates-card-reasons-listed.
- **The customer groups card with a group removed, and the profile card's email taken:** the story's customer is in two groups, so one chip stays when Wholesale is removed, and is subscribed to marketing, so its box is ticked; the wholesale buyer is in one group and not subscribed. The Save button is under the pointer on the screen.

S19 and the eight follow-up stories not compared keep their status and their gap; the image review list gives each one's reason.

### 4.3 Corrections

- The address sheet's Edit story showed "Select a state" for its address, because the fixture's state, Washington, was not among the states the story's United States lists. The fixture's address is now in Oregon, which is listed, and the story's two reference images were made again.
- The Enterprise prompt's story first rendered in the default dialog column, 568 pixels wide, while the add member dialog it sits in is 466 pixels wide inside. A new `inDialog` column holds it at that width, and its two reference images were made again.

## 5. Behaviour found, recorded and not changed

Each is an existing defect in Spree's code or the storefront's, numbered from the defect register, and deferred for the owner's decision. None was fixed. Severities are proposed.

| Defect | What was seen | Evidence | Proposed |
|---|---|---|---|
| SD-86 | The company invitation email sends the invited buyer to a page the storefront does not have. `CompanyMailer` links to the storefront's `/account/company-invitation` with the token; the storefront at its `main` has no such page and nothing in it calls the Store API's invitation endpoints. A guest who follows the link is sent to sign in, and after signing in lands on a "page not found". So an invited buyer cannot accept, although the Store API accepts the same token (§8) | [the link followed](evidence/2026-11-10-fb-19-batch-wholesale/checks/invitation-link/2-signed-in.webp); [EM-C-11](evidence/2026-11-10-fb-19-batch-wholesale/emails/EM-C-11-1280.webp) | High: an invited buyer cannot join their company from the email. Not an isolation finding |
| SD-87 | Deleting a company from its own page asks only "Are you sure? This action cannot be undone.", while the same delete from the list says it removes the whole subtree, its sub-units, members, addresses and certificates | [DA-CUS-05 delete-confirm](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-05/delete-confirm/admin-light.webp); [DA-CUS-04 delete-confirm](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-04/delete-confirm/admin-light.webp) | Medium: staff are not told that deleting a company deletes its divisions and their members |
| SD-88 | The companies list's Members column counts everyone across a company's sub-units, while the company's Members card counts only its direct members, and neither says which. Larkspur Hospitality Group reads 2 in the list and 1 on its page | [DA-CUS-04 listed](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-04/listed/admin-light.webp); [DA-CUS-05 company](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-05/company/admin-light.webp); `Company#members_count` counts the subtree | Low: the two numbers disagree without explanation |
| SD-89 | Three dialogs describe a company as a "node": the address sheet ("A labeled ship-to or bill-to site for this node"), the add member dialog ("Members can buy for this node and everything below it") and the catalog's audience dialog | [DA-CUS-05 address-add](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-05/address-add/admin-light.webp), [member-add](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-05/member-add/admin-light.webp) | Low: wording only |

**Observations, not numbered.** A role without a customer scope that visits the companies directly reads an empty list, "No companies yet", and on a company "Could not load this company" and "Company not found", rather than a refusal. The customer page shows nothing of a customer's companies: the wholesale buyer's page has no company card, and the company's page is the only place their membership shows. Staff orders are exempt from a company's purchase order requirement by design (§6).

## 6. Corrections

States the work item lists that no server reached, or that were reached differently:

- **DA-ORD-03, a company that requires a purchase order number, with the order refused without one:** Spree applies the requirement only at a buyer's own checkout; a staff order is exempt by design (`Spree::Checkout::DefaultRequirements`, and the core requirements spec). The order is not refused, so the state is captured as the company chosen with its purchase order field (purchase-order-company), and the refusal is checked at the buyer's cart (§8).
- **The expired certificate status:** reached by no workflow; a certificate whose date has passed reads as accepted and lapsed. It is shown in the certificates card's Each status story only.
- **The certificate's download:** offered in the menu; no seeded certificate holds a document, so it was not opened.
- **The divisions card empty and with divisions:** captured as the empty company's and the group's Sub-units card, the name the screen uses.
- **A division's page** shows the pointer the work item expected, "A division holds no tax registrations of its own. Its purchases are taxed through its legal entity: Larkspur Hospitality Group", and no certificates card, as listed.
- **The New button hidden without write:** it is the Add company button, hidden for the order manager and support.
- **LIQ-008's rows** for DA-CUS-04 and DA-CUS-05 did not say that the list counts members across the subtree or that the header's delete confirmation is generic (SD-87, SD-88), and the DA-ORD-03 row did not say that staff orders are exempt from a company's purchase order requirement. The rows now say so.

## 7. Hand-offs from earlier batches (criterion 16)

| Piece | Handed over by | Result |
|---|---|---|
| The company screens, their components and EM-C-11 | Batch 10 | Shown: §2.1, §4 and §9 |
| A company's tax exemption certificates | Batch 7, through batch 10 | Shown: the card's states (§2.1), and the tax check (§8): an accepted, current certificate for the address's state exempts the order |
| Companies and the Wholesale group as a catalog's and a price list's audience | Catalog part 2 | Shown: DA-PRD-13 audience-company, and the prices check (§8) |
| Whether a catalog's or a price list's prices reach a buyer | Catalog part 2 | Shown through the Store API (§8); part 2 shows them on the storefront |
| Purchase order numbers and negotiated prices | Batch 8 | Mapped to batch 8's captures; the requirement checked at the buyer's cart (§8) |
| G-96's 15 stories and its follow-up stories expected here | Batch 10 | Compared, or kept at their status with the reason (§4.2) |
| CAP-09-04's storefront access for a signed-in customer (SD-9) | Shop part 2 | Part 2's |

## 8. Decisions and settings checked where they take effect (criterion 16)

From `wholesale-checks.spec.ts`. Each decision is the one its dashboard screen saves, made through the Admin API as the screen makes it; what follows was read through the Admin and Store APIs as the buyer or staff. Answers are in `checks/<row>.json`, with no token written out.

| Row of §2.4 | Checked | Result |
|---|---|---|
| A company's purchase order requirement | Cedar & Vine Bistro requires a number; a member's cart for it, without and with a number; a cart for Larkspur Hospitality Group, which does not; a staff order for the bistro with no number | PASS. The bistro's cart lists `po_number_required` among its requirements until a number is given, then not; the group's cart never lists it; the staff order is created (201) with no number, as Spree intends (§6) |
| A member added, an invitation accepted, and one revoked | Ines Duarte made a member of Quillon Provisions and removed; an email with no account invited, looked up and accepted through the Store API with the token its email carries; another invited and revoked | PASS. Ines's companies read none, then Quillon Provisions, then none. An email with no account was invited, looked up by its token (200, Quillon Provisions), accepted with a new account (201), and the new buyer then read Quillon Provisions as their company; the same token then answered 404. Another invitation answered 200 before it was revoked and 404 after, and accepting it was refused (404). The token was read from the server's own database, since only the email carries it, and was never written out |
| A certificate pending, accepted, revoked and expired | The tax on a draft order for each company through the Admin API, for an Oregon address, against an invented 10% Oregon rate removed afterwards | PASS. No certificate: tax 2.00 on 20.00. Larkspur Hospitality Group, with an accepted certificate: 0. Larkspur North, a division: 0, through its legal entity's certificate. The bistro with a pending certificate 2.00, accepted 0, revoked 2.00, accepted but past its date 2.00, and accepted for Washington only 2.00 |
| A company's address book defaults | The group's addresses as the Store API lists them to a member and to a non-member | PASS. The member reads Head office as default billing and shipping and the Receiving dock as neither; a customer who is not a member gets 404 |
| A company's catalog and the Wholesale price list | The two trade products' prices for a guest, a customer in neither, a member of the group, and Tomas Reyes, in the Wholesale group and no company, at quantities 5 and 6 | PASS for each audience on its own: a guest and the outsider pay 20.00 and 10.00; the group's members pay 16.00 for the sampler, the catalog's 20% off; Tomas pays 10.00 for the tonic case at 5 and 7.50 at 6, the price list's minimum. The company's members are refused the tonic case ("Variant not found"), because the catalog holds only the sampler, so the Wholesale price list never reaches a buyer in a company with a catalog (G-128) |
| A division's tax registrations pointer | Read in the code and on the order | PASS. The division's page points at Larkspur Hospitality Group ([DA-CUS-05 division](evidence/2026-11-10-fb-19-batch-wholesale/screens/DA-CUS-05/division/admin-light.webp)); `Company#legal_entity` walks up to the nearest company, and Larkspur North's order reads the group's accepted certificate and is exempt (row above) |

## 9. Emails (criterion 17)

Rendered by `company-emails.rb` in the emails gem's own test app, against a copy of the browser-test server's database, and captured at 390 and 1280 pixels by `order-emails.spec.ts`. The browser-test server does not load the emails gem (work item §2.5), so the invitation is not sent there.

| Email | Built from | Read as sent | Evidence |
|---|---|---|---|
| EM-C-11 Company invitation | `CompanyMailer.invitation_email`, as `Spree::CompanyPreview` builds it, for the pending invitation to Larkspur Hospitality Group. Subject "Shop invitation to join Larkspur Hospitality Group"; text and HTML parts; links to `<site>`, `<site>/account/company-invitation?token=<token>` and the store's support address; the site is the store's storefront address | Yes, on the emails gem's test app: staff adding an email with no account to the company made an invitation, and the emails gem's subscriber delivered this email to it | [390](evidence/2026-11-10-fb-19-batch-wholesale/emails/EM-C-11-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-wholesale/emails/EM-C-11-1280.webp) |

**The link, followed** on the storefront at its `main`, built against the browser-test server, with a made-up token: a guest is sent to sign in, with the invitation's address kept as where to return; signed in, the buyer lands on the storefront's "page not found" (SD-86). The sent check ran Spree's events and jobs in the same process, with mail kept by the test delivery method; it shows what Spree's subscriber sends, not which mail service delivers it, which stays with G-16 and G-77 (G-127).

## 10. CI runs and local checks

- **Local:** the 120 captures, the 72 comparisons and the six checks passed on the browser-test server in the pinned image. The run logs are `screens-run.txt`, `comparison-run.txt` and `checks-run.txt`. Two things were run again after the first full runs, each in the pinned image: one capture, DA-CUS-05 certificate-accepted in dark, failed in the first screens run because the admin's sign-in had expired, and passed when run again after the script signed in afresh for each capture; and the acceptance row, which recorded NOT_RUN in the first checks run because the database was not named, passed when run with it. After the corrections of §4.3, the two corrected cases were compared again. Each log says what was run again.
- **Spree's specs:** 511 examples, 0 failures (§3.2).
- **Credential search:** before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths and compared with the local values the batch used. The store's prefixed ID and the local addresses were replaced in the evidence. The buyers' and teammates' password is a test value set only on the local browser-test server, as earlier batches did; nothing else was found.
- **CI:** the two visual runs, Tests and Packages on the final commit are named in the merge record.

## 11. Gaps

Numbered from the defect register's block for this batch, G-123 to G-128; all six are used. Each is for the owner's answer.

| Gap | What | Proposed |
|---|---|---|
| G-123 | The 17 behaviours of §2.3 that no browser test drives | For the owner's answer, as G-105 |
| G-124 | 4 states reached only by answering a request in the browser: DA-CUS-04 loading and none, DA-CUS-05 loading and load-failed | Simulated interface-state coverage, as G-108 |
| G-125 | The certificates card's Loading story, not compared, checked against its source; and the expired status, which no workflow reaches | Defer to the comparison follow-up, as G-111 |
| G-126 | What the server refuses to the order manager, support and merchandiser on the company endpoints beyond Spree's specs (§3.2) | Join G-11 |
| G-127 | EM-C-11 is read as sent only on the emails gem's test app (§9) | Close with G-16, as G-110 |
| G-128 | How a company's catalog and the Wholesale price list combine for a buyer in both: the catalog limits what the company's buyers can buy, so the price list never reaches them, and Spree's plans do not say whether that is intended | The owner's answer, before part 2 shows trade prices on the storefront |

## 12. Limitations

- The running screens are Spree's browser-test server with its own fixtures and the records the scripts add, not a Liquorify deployment.
- The checks make their decisions through the Admin API, as the screens make them; the screens' own saves are captured separately.
- The emails were rendered and sent on a copy of the database in the emails gem's test app, not on the server the screens ran against.
- The storefront was used only to follow the email's link; its wholesale portal is part 2's.
- Comparison is diagnostic, and no comparison is functional verification.

## 13. Evidence

The [evidence index](evidence/2026-11-10-fb-19-batch-wholesale/README.md) lists every capture, comparison, check and email. Every image is lossless WebP, all 196 checked pixel for pixel against the PNG each script wrote.

## 14. Delegated acceptance

Accepted by Claude under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)) at #109's final commit, once both visual runs, Tests and Packages pass. This is not the owner's review and not independent review. The owner's rules carried over: FB-03 stays paused with its private evidence preserved; the multi-tenant release block stays; "These deferrals do not mark unverified behaviour PASS"; server permissions are preserved, and nothing here authorizes broader access. The owner's instruction of 2026-11-10 holds: approved defects stay open and production fixes are deferred until after the baseline. SD-86 to SD-89 and G-123 to G-128 are recorded for the owner's answers and are not fixed here.
