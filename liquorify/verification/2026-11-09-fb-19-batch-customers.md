---
title: FB-19 batch 10, customers in the dashboard
record: verification
work_item: FB-19
date: 2026-11-09
verifier: Claude (automated session); not independent review
result: PASS for the map, the 78 stories and their images, the running-screen captures, the comparison with running screens, 45 cases in both themes with every difference explained, and Spree's own specs for the batch's endpoints, models, workflows and mailers, 1,154 examples with no failures and 2 pending. Every state the work item lists for the three screens is captured or recorded as a correction, and 4 states were reached in the browser. FL-23, FL-21's customer entry and FL-10's staff step are traced step by step. PASS for the seven hand-offs from earlier batches, each shown on the browser-test server. PASS for the two emails, rendered and captured at both widths, neither sent. Three existing defects recorded: SD-44, a typed tax registration kind that disappears from its field; SD-45, an address change that gives up the defaults it does not name; and SD-46, a refused tax number that says only "is invalid"; 11 behaviours recorded and not changed. G-96 to G-99 OPEN for the owner. Six earlier stories compared, each leaving its gap. Tenant isolation NOT_RUN. Delegated acceptance, under the owner's delegation of 2026-11-04, at the pull request's final commit, named in the merge record; not the owner's review
---

# FB-19 batch 10, customers in the dashboard

**Claim.** The [batch 10 work item](../work-items/fb-19-batch-customers.md) reproduces what Spree already has for customers in the dashboard: the customer list, a customer's page with its profile, groups, addresses, orders, lifetime figures, store credit, tax registrations, internal note and privacy actions, and customer groups. It gives the 13 new components those screens use 78 Storybook stories with light and dark reference images. It captures the three screens on Spree's running dashboard in each state the work item lists and for each of five roles, traces FL-23, FL-21's customer entry and FL-10's staff step, compares 39 of the new stories and six earlier batches' stories with the same components on the running screens, and runs Spree's own specs for the endpoints, models, workflows and mailers the screens rely on. It shows on the browser-test server the seven pieces earlier batches handed to batch 10, and renders the two customer emails. It follows the work item, proposed under the owner's delegation of 2026-11-04: coverage stays apart from functional verification, the refusals a narrower role meets join G-11, and the acceptance is delegated acceptance, not the owner's review.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | The batch's pull request, branch `claude/project-thread-d402n2`. It starts from `main` at `05b7c95b`, #87's merge, and holds the work item (`64bc5b57`), the stories and reference images (`cdd58e34`), and then the scripts, corrections, evidence and records. The final commit and the merge are named in the merge record |
| Spree's code: the dashboard, its packages, the SDKs and the gems | The same at `05b7c95b`, at `87a2ea80` and at `main`'s `44be970f` when the records were written: `git diff` between them over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk` and `packages/admin-sdk` is empty. The branch changes none of it, nor any workflow or lockfile |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at that code, in the pinned Playwright 1.64.1 image. Captures are 1280 by 960 pixels, and 390 by 844 for the one phone capture; a customer page captured whole grows the window to the page's height, or, on the phone, is captured down the whole page. Comparisons are 1280 by 800, or taller where a case names it. The scripts ran from the branch's working tree on `05b7c95b`. The first full capture run wrote `87a2ea80` into its notes, a stale local name for `main` with the same Spree code; the evidence's notes name `05b7c95b` |
| The storefront | Not run and not changed. No customer screen needs it |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-customers.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | PASS: the map in §2 has CAP-08-02 to CAP-08-06 and the customer part of CAP-07-12, the three screens, FL-23, FL-21's customer entry and FL-10's staff step, the `customers`, `store_credits` and `orders` scopes, the 13 components, Spree's 25 browser tests in four files, and the two emails, each with its evidence or a named gap. Wishlists and newsletter sign-ups have no screen and are mapped to Spree's specs |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 13 new components, 78 stories, 156 reference images, each looked at in both modes (§1, [image review list](2026-11-09-fb-19-batch-customers-image-review.md)). The running screens use the 13 the work item named. The reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | PASS for every listed state, with five recorded as corrections (§6). 72 states, 71 of the three screens and one of DA-SET-09, are captured in 86 captures with the role and phone variants, each in light and dark, 172 images. 4 states were reached by answering a request in the browser, and say so (§2.1, G-98) |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen; the order manager, support and the customer manager on each list and on a customer with orders, with support's groups sheet and its refusal and each role's export; and the merchandiser's direct visit to each of the three screens |
| 5 | FL-23 and FL-21's customer entry are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | PASS. FL-23, FL-21's customer entry and FL-10's staff step are traced (§2.2). The steps with browser tests map to Spree's `customers.spec.ts`, `customers-list.spec.ts`, `customer-groups.spec.ts` and `store-credits.spec.ts`, which pass in CI at the pull request's revision (§10). Exporting a customer's data and importing a customer file have no browser test, and are listed under criterion 15 (G-97) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 39 cases of the batch's stories were compared in both themes, and every difference is explained by the data, by which element holds focus, or by the pointer. Two story fixtures drew what the server never sends, and were corrected (§4.3). Six earlier batches' stories were compared too, and each leaves its gap |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 39 of the 78 stories were not compared by the script; 15 of them show a state seen in a capture, and 24 were checked against their source only (G-96, image review list). Every capture whose state was reached in the browser says how in its note, and claims nothing about the server (§2.1, G-98) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | Recorded in the merge record, on the pull request's final commit (§10) |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from merges of `main`. No workflow, lockfile or Spree file changes. The storefront was not run |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, progress tables, gap register, existing defects and comparison follow-up, the work item's status and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at the pull request's final commit (§13). Not the owner's review. The gaps the batch leaves stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 1,154 examples from 71 spec files, 0 failures and 2 pending, saved as `backend/api-specs.json`, `backend/core-specs.json` and `backend/email-specs.json` (§3.2). What no spec exercises for the four narrower roles is NOT_RUN and joins G-11 (G-99) |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to ISO-1 to ISO-3 and ISO-7. No check reads or writes another store's records or opens another store's shopper. A list showing a shopper the batch did not add to the default store is narrowed. The batch claims nothing about who owns a shopper account. A new isolation defect is reported to the owner privately | NOT_RUN (§3.3). No check read or wrote another store's records, and no capture opened the browser tests' second store or a shopper of it. No list needed narrowing (§3.3). No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, address, email, phone number, tax identifier and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. The exported customer file is not committed; what it contains is described | PASS: the stories use invented shops, people, addresses, phone numbers and registration numbers; the running screens show Spree's sample customers, the browser tests' own records and those the scripts add, named "Fidelity" or with an `example.com` address. The exported file was read only for its outline, which §2.2 describes; the file is not kept. The download and confirmation tokens in the emails are replaced by `<token>`, and the test app's address by `<site>`. Before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths and compared with the local values the batch used; nothing matched but the test accounts' password the scripts set on the local server, as earlier batches' scripts do (§10) |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's and G-90's were. None is counted as tested | PASS: 14 behaviours no browser test drives are listed in §2.3, each with its capture and the Spree specs for the server's side. None is counted as tested. They are G-97, for the owner's answer |
| 16 | Each hand-off in §2.3 is shown on the browser-test server, with captures and the result recorded per piece | PASS (§8): all seven pieces were shown, with captures: a customer's tax registrations added and deleted, the customer import, the issue store credit dialog and the credit it issued, the store credit card, the erasure specs, the orders card with its link, and a customer field defined and filled |
| 17 | Each email in §2.4 is rendered and captured at 390 and 1280 pixels, with the mailer specs run, and whether it was sent is recorded, or kept as a gap | PASS (§9): both emails were rendered and captured at both widths, and Spree's 27 mailer and subscriber examples pass. Neither was sent; whether Spree sends them on the running stack joins G-77 and G-16. The privacy card's export sends no EM-C-09 (B8) |

## 1. What was built

**Stories, 78, for 13 new components.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-11-09-fb-19-batch-customers-image-review.md) names each one. Stories use invented shops, people, addresses, phone numbers and registration numbers.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Design system, composed | `address-book-row` (CMP-DUI-C-02) | Labelled, no default; Default for shipping; Default for both, no label; No label or default; Read-only; Menu open; Menu on the default shipping address; Menu without default actions (8) |
|  | `tax-identifiers-card` (CMP-DUI-C-51) | Each verdict; Nothing to check them; None on file; Loading; Read-only; Check under way; Menu, number a registry can check; Add sheet; Kinds listed; A kind typed in; A kind typed in, saved; Nothing entered; Edit sheet; Delete confirmation (14) |
| Admin dashboard, `customers/` (CMP-DA-G-07) | `customer-addresses-card` | Three addresses, with defaults; One address, default for both; No addresses; Row menu; Add address; Edit address; Delete confirmation (7) |
|  | `customer-groups-card` | In two groups; In one group; Not in any groups; Edit sheet; Group removed, not saved; Saving; Refused for a read-only role (7) |
|  | `customer-internal-note-card` | Note; No note; Editing; Editing, empty; Saving (5) |
|  | `customer-last-order-card` | Paid, not shipped; Partly refunded (2) |
|  | `customer-lifetime-stats-card` | With orders and credit; No orders (2) |
|  | `customer-orders-card` | Every order shown; More orders than shown; No orders; Loading (4) |
|  | `customer-privacy-card` | With a consent date; No consent recorded; Erase confirmation; Erased; Exporting; Export refused (6) |
|  | `customer-profile-card` | With phone, subscribed to marketing; No phone, not subscribed; Erased; Edit sheet; Saving; Email already taken (6) |
|  | `customer-store-credits-card` | Three credits, one in euros; No credit; Row menu; Issue dialog; Edit dialog; Delete confirmation (6) |
|  | `customer-tax-identifiers-card` | Two numbers, nothing to check them; None on file; Loading; Read-only role; Row menu; Add sheet; Number refused; Edit sheet; Delete confirmation (9) |
| Admin dashboard, top level (CMP-DA-G-24) | `tax-identifiers-card` | Identifiers; Refused, on the field (2) |

**Already covered, reused by these screens:** `resource-table`, `table-toolbar`, `page-header`, `slot`, `can`, `confirm-dialog`, `bulk-dialog`, `bulk-action-bar`, `row-actions`, `resource-layout`, `route-pending`, `route-error-boundary`, `address-form-dialog`, `address-block`, `country-combobox`, `country-state-fields`, `currency-select`, `export-button`, `import-button`, `import-wizard-dialog`, `money`, `resource-combobox`, `resource-multi-autocomplete`, `tag-combobox`, `tag-list`, `custom-fields-inline`, `metadata-card`, `json-preview-drawer`, `relative-time`, the store credit dialogs, and the primitives from earlier batches. The work item listed `editable-note-card` too; the internal note card does not use it (§6). Six earlier stories these screens show were compared (§4.2).

**Providers and mocks.** Fixtures for customers (`src/fixtures/admin/customers.ts`), each shaped as the browser-test server answered the same request on 2026-11-09: a customer with orders, groups, tags, three addresses, two registration numbers, store credits in two currencies, a note and a consent date; a customer with none of them; an erased customer; and their last order and lifetime figures. Mocked Admin API answers for them (`src/mocks/handlers/admin/customers.ts`), with the server's refusals in its own shapes. The fixture test checks every new fixture against the admin SDK's schemas.

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `customers.ts` (new) adds what the captures need beyond the browser tests' data, through the Admin API on the browser-test database only, in the default store: a "Fidelity VIP" group and a customer field, "Preferred pickup day"; for the browser tests' customer, Sarah Johnson, a note, the group, a Studio address beside her Home address and two registration numbers; a newcomer with nothing added, Priya Shah; an erased customer; two customers the erase capture erases, one per theme; and the two-row customer file the import captures upload. Every name is invented, and every email is at `example.com`.
- `orders.ts`, batch 8's, gives Sarah her orders, and `staff.ts` adds the customer manager role, with its own teammate.
- `screens-batch-10.spec.ts` (new) captures the three screens and DA-SET-09's customer field. Each capture blocks and records any request that would leave the local servers. A capture that saves through the screen saves on a customer made for it, or puts back what it changed.
- `compare-batch-10.spec.ts` (new) compares the 39 new stories and six earlier ones in 45 cases (§4).
- `customer-emails.rb` (new) renders the two emails, and `order-emails.spec.ts` captures them (§9).
- `playwright.config.ts` lists the new files.

## 2. The batch's map, completed

The map from the [work item §2](../work-items/fb-19-batch-customers.md#2-scope), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-11-09-fb-19-batch-customers/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22 and again on 2026-11-04. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen; it does not show that the screen works. **Functionally verified** is whether each behaviour was shown to work at the batch's revision, by a browser test or a spec (§2.2, §2.3).

| Capability | Screens | Flows | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-08-02 Customer records for staff | DA-CUS-01, DA-CUS-02 | FL-21's customer entry | `customers`; the store credit card `store_credits`; the orders cards `orders` | Every component in §1 | DA-CUS-01's 26 states and DA-CUS-02's 36, light and dark; Spree's `customers-list.spec.ts` and `customers.spec.ts`; the hand-offs (§8); Spree's customer, address, store credit, tag and import specs (§3.2) | PASS: every listed state captured, five as corrections (§6) | PARTIAL: listing, searching, filtering by newsletter and phone, sorting by email, creating a customer, editing a profile, adding an address, issuing and editing store credit, bulk group and tag adds and erasure pass in Spree's browser tests. The behaviours of §2.3 are not functionally verified (G-97) |
| CAP-08-03 Customer groups | DA-CUS-03; the groups card and the list's bulk group actions | FL-10's staff step | `customers` | `customer-groups-card` | DA-CUS-03's 9 states; the groups card and bulk dialogs on DA-CUS-01 and DA-CUS-02; Spree's group specs | PASS | PASS for what `customer-groups.spec.ts` and two `customers.spec.ts` tests drive: listing, creating, editing, the members link, deleting, bulk assigning and assigning and removing on a customer's page. Bulk removal is not (G-97) |
| CAP-08-04 Wishlists | None | None | Store API | None | Spree's wishlist and wishlist item specs (§3.2) | Mapped to specs only: no screen | By Spree's specs only |
| CAP-08-05 Newsletter sign-ups | DA-CUS-01's newsletter filter; DA-CUS-02's marketing line and the profile sheet's switch; EM-C-10 | None | `customers`; the Store API | `customer-profile-card` | DA-CUS-01 filtered-newsletter; DA-CUS-02 profile-sheet; EM-C-10 rendered (§9); Spree's newsletter specs | PASS | PARTIAL: the newsletter filter passes in `customers-list.spec.ts`; signing up has no storefront page, and Spree's specs cover the Store API |
| CAP-08-06 Data privacy | DA-CUS-02's privacy card; EM-C-09 | FL-23 | `customers`, and for the export `read_orders`, `read_payments`, `read_store_credits` and `read_gift_cards` | `customer-privacy-card`, `customer-profile-card` | DA-CUS-02 export for three roles, erase-confirm, erase-done, erased; DA-CUS-01 erased-shown; EM-C-09 rendered (§9); Spree's erasure, data request and export specs | PASS | PARTIAL: erasing and keeping erased customers out of the list pass in `customers.spec.ts`. The export has no browser test (G-97) |
| CAP-07-12 Tax identifiers, the customer's part | DA-CUS-02's tax registration card | None | `customers` | `customer-tax-identifiers-card`, both `tax-identifiers-card`s | DA-CUS-02's ten tax states; Spree's tax identifier specs | PASS, with verdicts in the stories only (§6) | Not functionally verified: no browser test (G-97). Adding and deleting were shown once on the server (§8) |

### 2.1 Screens and their states

Each state below is captured in light and dark, at 1280 pixels, for the admin unless a role is named. "Reached in the browser" means the capture answered or held one request itself, and its note says which; such a state shows what the interface draws and claims nothing about the server (G-98). Every capture settled, apart from the two loading states, which were captured while their request was held.

| Screen | States captured | Reached in the browser |
|---|---|---|
| DA-CUS-01 Customers | Listed, for four roles; loading; none; searched by name and by email; filtered by group, tags, newsletter and phone; the companies filter's choices; erased customers shown; sorted by email; the columns menu; two rows selected; the four bulk dialogs, add to groups, remove from groups, add tags and remove tags; the new customer sheet empty, filled and refused; the export dialog; the import's column mapping and its results, and the imported customers listed; the merchandiser's direct visit (26 states) | Loading, none |
| DA-CUS-02 Customer | A customer with orders, whole page, for four roles and on a phone; a customer with no orders, for the admin and support; erased; loading; not found; the JSON drawer; the orders card's View all; the profile sheet, saved and refused; the groups sheet, for the admin and support, and its refusal for support; the address menu, add and edit dialogs, delete confirmation and Set as default billing; the issue store credit dialog, a credit issued, the edit dialog and the delete confirmation; the tax registration menu, add and edit sheets, a refused number, a kind typed in and saved, an identifier added and deleted, and the delete confirmation; the internal note being edited; the erase confirmation and a customer erased through it; the export, for the admin, support and the customer manager; the customer field filled; the merchandiser's direct visit (36 states) | Loading |
| DA-CUS-03 Customer groups | Listed with member counts, for four roles; none; the create sheet empty, filled and refused; the edit sheet with its members link; the members link followed; the delete confirmation; the merchandiser's direct visit (9 states) | None |
| DA-SET-09 Custom fields | The customer field defined (1 state) | |

72 states in 86 captures, 172 images. The captures of a whole customer page grow the window to the page; the phone capture is the whole page, whose sidebar stacks under the main column. The captures run every light capture first, then every dark one, so a dark capture of a customer a light capture changed shows the change: the newcomer's dark no-orders capture has the phone number and the $10 credit the light profile-saved and credit-issued captures added, where the light one shows the newcomer as made.

### 2.2 FL-23, FL-21's customer entry and FL-10's staff step

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| FL-23: the privacy card, with the consent date | DA-CUS-02 | None | with-orders, no-orders. The consent line reads "Marketing consent last changed" with its date |
| FL-23: export the customer's data | DA-CUS-02 | None | export, for the admin, support and the customer manager. The admin's download, `customer-<id>.json`, was read for its outline only and not kept ([outline](evidence/2026-11-09-fb-19-batch-customers/screens/DA-CUS-02/export/admin-light-file-outline.json)): the account, with the internal note (B7); marketing consent; 0 consent records; 2 addresses; 16 orders and 1 draft; 2 store credits; 1 custom field; 2 registration numbers; and empty lists of order groups, carts, payment sources, connected logins, gift cards, wishlists and companies. Support and the customer manager are refused (B6) |
| FL-23: EM-C-09 | None | None: rendered (§9) | The export makes and completes its own access request without its event, so it sends no EM-C-09 (B8) |
| FL-23: erase, after its confirmation, then the erased page | DA-CUS-02 | `customers.spec.ts`: "erases a customer and says so afterwards" | erase-confirm, erase-done, erased |
| FL-23: erased customers out of the list until asked for | DA-CUS-01 | "keeps erased customers out of the list until asked for" | listed, erased-shown |
| FL-21: open the import from the list | DA-CUS-01 | None for customers | import-mapping |
| FL-21: upload, map, follow progress, see results | DA-OVL-05 | `imports.spec.ts`, for products | import-mapping, import-results, imported-listed. The progress step finished before a capture could show it (§6) |
| FL-10's staff step: add the customer to a group | DA-CUS-01, DA-CUS-02 | "bulk-assigns selected customers to a group", "assigns and removes a customer group from the detail page" | bulk-add-group, groups-sheet, filtered-group |

The tests named above passed in CI at the pull request's revision (§10).

### 2.3 Behaviours no browser test drives (criterion 15)

Read from the test titles and steps of `customers-list.spec.ts`, `customers.spec.ts`, `customer-groups.spec.ts` and `store-credits.spec.ts`. Each is captured, which shows it exists, not that it works; Spree's specs cover the server's side where named. They are G-97, for the owner's answer.

| # | Behaviour | Capture | Spree's specs for the server's side |
|---|---|---|---|
| 1 | Exporting a customer's data | DA-CUS-02 export | `customers_gdpr_spec.rb`; `customers/data_export_spec.rb`; `data_requests/fulfill_spec.rb` |
| 2 | Editing and deleting an address | address-edit, address-delete | `customers/addresses_controller_spec.rb`; `addresses/update_spec.rb` |
| 3 | Setting a default billing or shipping address from the row menu | address-menu, address-default-billing-set (SD-45) | `customers/addresses_controller_spec.rb`; `addresses/update_spec.rb` |
| 4 | Adding, editing, checking and deleting a tax registration | tax-menu, tax-add, tax-edit, tax-refused, tax-kind-typed-saved, tax-added, tax-deleted, tax-delete-confirm | `customers/tax_identifiers_controller_spec.rb`; `tax_identifier_spec.rb`; `tax_identifiers/validate_spec.rb` |
| 5 | Editing the internal note | note-editing | `customers_controller_spec.rb`'s update examples |
| 6 | Deleting a store credit from the customer's page | credit-delete | `customers/store_credits_controller_spec.rb` |
| 7 | Removing customers from groups, and removing tags, in bulk | bulk-remove-group, bulk-remove-tags | `customers_controller_spec.rb`'s bulk examples; `tags/bulk_remove_spec.rb` |
| 8 | Filtering the list by group, company, tags or erased | filtered-group, filtered-company-panel, filtered-tags, erased-shown | `customers_controller_spec.rb`'s filter examples |
| 9 | Importing a customer file | import-mapping, import-results, imported-listed | `imports_controller_spec.rb`; `imports/row_processors/customer_spec.rb`; `imports/pipeline_spec.rb` |
| 10 | Exporting the customer list | DA-CUS-01 export | `exports_controller_spec.rb`; `exports/customers_spec.rb` |
| 11 | A profile refused for an email already taken, and a new customer refused for the same | profile-refused, new-refused | `customers_controller_spec.rb` |
| 12 | The orders card's View all link | orders-view-all | None: the dashboard builds the link |
| 13 | The JSON drawer | json-drawer | None: the dashboard draws it |
| 14 | A customer field filled on a customer's page | custom-field-filled | The custom field value specs, run in batch 3 |

## 3. Permissions and isolation

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it.

| Variant | Role's permission keys, as the role was created through the Admin API | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Order manager template | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | Every customer screen, keeping the write controls on the profile, groups, addresses, note and privacy cards and the list's New customer and bulk actions (B1). The tax registration card is read-only |
| Support template | `read_orders`, `read_customers`, `read_dashboard` | As the order manager, with Issue store credit too (B1). The store credit card reads "No store credits issued" (B2), the custom fields card offers "Set up custom fields" (B4), Export data is refused with "Download failed: 403" (B6), and saving the groups sheet is refused with "Missing permission: write_customers" (B10) |
| Customer manager: write on `customers`, nothing on orders or store credits | `write_customers` | Every customer screen editable. The orders card reads "No orders yet." while the figures read 16 orders, with no last order card (B3); the store credit card reads "No store credits issued", with Issue store credit (B2, B3); the custom fields card offers "Set up custom fields" (B4); Export data is refused (B6) |
| Merchandiser template | `write_products`, `write_categories`, `write_collections`, `write_stock` | No Customers entry in the navigation. On a direct visit, the customer list reads "No customers yet" with Export and New Customer; the customer page reads "Failed to load customer. Missing permission: read_customers" with Try again; the groups list reads "No customer groups yet" (B9) |

### 3.2 What the server refuses

**Spree's own specs, at Spree's code `05b7c95b`.** Run in this session on SQLite with Spree's API, core and emails test apps. 1,154 examples from 71 spec files, 0 failures, and 2 pending: metadata queries Spree runs on PostgreSQL only. Every example is listed with its result in [api-specs.json](evidence/2026-11-09-fb-19-batch-customers/backend/api-specs.json) (364 examples in 17 controller and serializer specs and 11 integration specs, seed 11294), [core-specs.json](evidence/2026-11-09-fb-19-batch-customers/backend/core-specs.json) (763 examples in 37 model, service, job, presenter, subscriber and workflow specs, 41 of them written in three of Spree's shared example files, 2 pending, seed 40991) and [email-specs.json](evidence/2026-11-09-fb-19-batch-customers/backend/email-specs.json) (27 examples in 3 mailer and 3 subscriber specs, seed 1459).

**Who calls in these examples.** Most Admin API examples sign in as a full admin with a staff token, which passes every permission check, so they show what a request does, not who may make it. The examples that test a narrower caller are few: a staff role that may read customers but not their orders, or may read orders but not payments, refused the export with the missing permission named (`customers_gdpr_spec.rb`); a role that cannot read customers refused a customer's addresses and store credits, and a read-only customer role refused issuing store credit (`customers/addresses_controller_spec.rb`, `customers/store_credits_controller_spec.rb`); and secret keys holding one scope, `read_customers` dropping a customer's orders and store credits from the answer and listing customer tags, `read_store_credits` refused writing credit, and a products or promotions key confined to its own export and import types. Store API examples call with the store's publishable key and, where named, a signed-in customer's token. Several examples check another store's records within these specs: groups, store credits, tags, exports, imports and newsletter sign-ups of a second store are left out or answer 404. Those are Spree's own tests; they are not this batch's isolation check (§3.3).

| Endpoint or model | Spec files (examples) | What the examples exercise |
|---|---|---|
| Customers (`/admin/customers`) | `customers_controller_spec.rb` (31), `customers_spec.rb` (9), `customer_serializer_spec.rb` (5) | Listing, searching and filtering by company standing, a company of another store giving nothing; showing with figures, and a `read_customers` key dropping orders and store credits; creating with and without a password; updating, tags replaced and groups replaced or cleared; deleting, refused with 422 for a customer with completed orders; the four bulk actions, groups of other stores ignored |
| A customer's addresses | `customers/addresses_controller_spec.rb` (13), `customers/addresses_spec.rb` (4) | Listing, refused for a role that cannot read customers; adding with each default flag; changing, an address on a completed order edited as a copy; deleting, kept for orders and shipments. Every change example sends the flags it means, so none shows SD-45 |
| A customer's store credit | `customers/store_credits_controller_spec.rb` (17), `customers/store_credits_spec.rb` (4), `store_credits_controller_spec.rb` (19) | Listing, issuing with its author, a used credit's amount refused with 422 and its memo allowed, deleting refused once used; a read-only role and a `read_store_credits` key refused writing; another store's credits left out or 404 |
| A customer's tax registrations | `customers/tax_identifiers_controller_spec.rb` (8), `customers/tax_identifiers_spec.rb` (2) | Listing with each verdict and whether the kind can be checked here; adding, the number normalized; changing; removing; checking queued only where a validator is registered |
| Privacy: export and erasure | `customers_gdpr_spec.rb` (17), `customer_privacy_spec.rb` (6) | The export's sections and its extension hook, the access request it records, and refusals naming the first missing permission; erasure through Spree's workflow, recorded, repeatable, and keeping completed orders |
| Customer groups | `customer_groups_controller_spec.rb` (16), `customer_groups_spec.rb` (10) | Listing and showing in the store, another store's group answering 404; creating, a name refused when missing or taken in the store; changing members by prefixed ID; soft deletion |
| Imports and exports | `imports_controller_spec.rb` (44), `import_rows_controller_spec.rb` (5), `imports_spec.rb` (11), `exports_controller_spec.rb` (32), `exports_spec.rb` (5) | Imports and exports of the store only; a signed-out caller refused with 401; keys confined to the types their scopes cover; a processing import not deleted |
| Tags | `tags_controller_spec.rb` (7) | Each store's own tag vocabulary; listing customer tags refused for a key without `read_customers` |
| Data requests, the shopper's side | `store/customer/data_requests_controller_spec.rb` (10), `data_request_downloads_controller_spec.rb` (7), `store/data_requests_spec.rb` (5) | A signed-in customer's own requests; the emailed download handed over without a session, refused while building, once expired or with an unknown token |
| Newsletter sign-ups | `store/newsletter_subscribers_controller_spec.rb` (9), `store/newsletter_subscribers_spec.rb` (23) | Subscribing, confirming and unsubscribing; an unsubscribe request answering 202 whatever the email, another store's subscriber included, so it reveals nothing |
| Wishlists | `store/wishlists_controller_spec.rb` (18), `store/wishlist_items_controller_spec.rb` (15), `store/wishlists_spec.rb` (12) | A signed-in customer's wishlists and items; a signed-out caller refused with 401 and another customer's wishlist answering 404 |
| Customer model, groups, consent and personal data | `customer_spec.rb` (6), `customer_group_spec.rb` (15), `customer_marketing_consent_spec.rb` (8), `customer_personal_data_coverage_spec.rb` (6), `customer_standing_scope_spec.rb` (7), `consent_record_spec.rb` (7), `customers/create_spec.rb` (20) | A group's name is unique in its store; consent changes are recorded with their source; every column holding personal data is covered by erasure |
| Addresses | `address_spec.rb` (135), `addresses/create_spec.rb` (12), `addresses/update_spec.rb` (40), `addresses/phone_validator_spec.rb` (16) | A missing default flag leaves the owner's default where it is, and false gives it up; an address used by an order is replaced rather than changed |
| Store credits | `store_credit_spec.rb` (97) | A used credit's amount cannot fall below what was used; currencies and categories |
| Tax registrations | `tax_identifier_spec.rb` (30), `tax_identifiers/validator/eu_vat_spec.rb` (11), `tax_identifiers/validate_spec.rb` (9), `tax_identifiers/validate_job_spec.rb` (3), `tax_identifier_validation_subscriber_spec.rb` (5) | A number that fails its kind's format is refused in the regime's words; checks run only where a validator is registered |
| Privacy | `customers/anonymize_spec.rb` (60), `customers/data_export_spec.rb` (33), `data_requests/create_spec.rb` (11), `data_requests/fulfill_spec.rb` (13), `data_requests/process_job_spec.rb` (3) | Erasure blanks every personal field and keeps orders and balances; an export gathers every section of §2.2 |
| Newsletter and wishlists | `newsletter_subscriber_spec.rb` (13), `newsletter/subscribe_spec.rb` (20), `newsletter/verify_spec.rb` (5), `wishlist_spec.rb` (7), `wishlist_item_spec.rb` (8) | A sign-up is confirmed by its token; a wishlist holds one of each variant |
| Imports, exports and tags | `import_spec.rb` (31), `import_row_spec.rb` (14), `import_mapping_spec.rb` (13), `import_tenancy_spec.rb` (13), `imports/row_processors/customer_spec.rb` (17), `imports/pipeline_spec.rb` (14), `exports/customers_spec.rb` (2), `csv/customer_presenter_spec.rb` (7), `tags/bulk_add_spec.rb` (7), `tags/bulk_remove_spec.rb` (4) | A customer row creates or updates the customer and its address; an import's records stay in its store |
| Customer and newsletter emails | `customer_mailer_spec.rb` (5), `newsletter_mailer_spec.rb` (6), `rendered_emails_spec.rb` (2), `customer_email_subscriber_spec.rb` (4), `data_request_email_subscriber_spec.rb` (5), `newsletter_subscriber_email_subscriber_spec.rb` (5) | The export and confirmation emails render in the store's language with their links; the subscribers send them on `data_request.completed` and `newsletter_subscriber.subscribed` |

The core specs also include Spree's shared examples for lifecycle events (20), metadata (16, 2 of them pending) and account lockout (5).

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends, as a staff token holding one of §3.1's narrower roles, the writes the order manager and support were shown the controls for on profiles, groups, addresses, notes, privacy and the list's bulk actions, nor the customer manager's reads of a customer's orders and store credits, nor the merchandiser's reads of the list and groups. Support's group save and support's and the customer manager's export were refused on the running server (B6, B10), which is observed, not tested. These join G-11 (G-99).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation, run privately on 2026-11-04, waits for the owner with the choice of who owns a shopper account. The open findings on these screens are [ISO-1, ISO-2, ISO-3 and ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all stay open. The batch captures the browser tests' default store only and claims nothing about other stores or about whose shopper a record is.

The lists show Spree's sample customers, the browser tests' own customers and the batch's own records. The browser tests' setup gives their second store no shopper account of its own (`packages/dashboard/e2e/global-setup.ts`), and the batch made none there, so no capture showed a shopper the record could tie to another store, and none was narrowed. No check read or wrote the second store's records. Spree's specs that touch store boundaries, among them `import_tenancy_spec.rb` and the controller specs' other-store examples, are Spree's own checks, not FB-03's validation. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

`compare-batch-10.spec.ts` puts each story beside the same component on the running screen, in light and dark, and records both images side by side and the computed styles of every distinct element on both sides. 45 cases, 90 comparisons, all completed: 80 in one run, the six address cases again after their fixture was corrected (§4.3), and the earlier stories' ten. The comparison is diagnostic: it informs the review of the images and does not decide it.

### 4.1 Results

The [evidence index](evidence/2026-11-09-fb-19-batch-customers/README.md#comparison-with-running-screens-light-and-dark) lists each case with its images and styles. The stories show invented data and the screens the browser tests' data and the customers the batch added, so text, counts and row heights differ on purpose. The products' pictures did not load on the screens during the comparison run, so the last order card's rows draw an empty frame where the story draws a picture; the styles do not record pictures. Widths that differ by a fraction of a pixel come from the page's columns and are not listed. Every difference the styles record is explained below; none is a defect in a story.

| Cases | What differs, and why |
|---|---|
| The profile card, subscribed, erased and its edit sheet; the groups card in one group, in none and its edit sheet; the addresses card empty, its row menu and its add and edit dialogs; the tax registration card with numbers, empty, its row menu and its add and edit sheets; the internal note, empty and editing; the privacy card with a consent date; the store credit card empty, its row menu and its issue dialog; the orders card empty; the lifetime figures, with orders and with none; the address book row and its menu; both shared tax registration cards; earlier: the issue store credit dialog (30) | Nothing in the styles |
| The addresses card | The screen's Home address carries both default badges, which wrap its title to a second line, and the story has three addresses where the screen has two, so the card is shorter on the screen |
| The store credit card | The screen has two credits and the story three, so the card is shorter on the screen |
| The orders card | The screen lists ten orders, and the story fewer, one of them with a danger dot the screen's orders do not have |
| The last order card | The screen's last order is partly fulfilled, with an information dot, and the story's unfulfilled, with a warning dot; the screen's product lines carry an option line, "Color: White" |
| The erased privacy card | The screen's erased customer still shows the consent line, so it is 49 pixels taller |
| The store credit card's edit dialog | The screen's $40.00 credit is fully used, so its amount is locked and focus opens on the memo; the story's $40.00 credit is unused, so focus opens on the amount, with its ring |
| The delete confirmations of an address, a tax registration and a credit, and the erase confirmation (4) | Which element holds focus: the story's dialog leaves its focus ring on Cancel, and the screen's dialog does not |

### 4.2 Earlier stories

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) asks each later dashboard batch to compare the earlier stories its running screens show. Six were found on these screens and compared as the batch's own stories are; each leaves its gap. The image review list's earlier stories section names each one.

| Earlier story | Gap | What differs, and why |
|---|---|---|
| Issue store credit dialog: From a customer's page (catalog part 3, S123) | G-81 | Nothing in the styles |
| Address form dialog: Person, with label and defaults (batch 3, S107) | G-33 | The story is the empty Add address dialog and the screen's the Edit address dialog of the Studio address, so the story's State field shows its placeholder, "Select a state", where the screen's reads Oregon |
| Custom fields inline card: Every kind, empty (catalog part 1, S177) | G-53 | The story defines a field of every kind, and the screen one short text field, so the card is shorter on the screen and draws its edit button and a single row |
| Tag combobox: Empty (catalog part 1, S172) | G-53 | The screen's field, in the bulk add tags dialog, has focus when the dialog opens, with its ring, and is 466 pixels wide there, against 280 in the story |
| Import wizard dialog: Mapping (catalog part 2, S53) | G-58 | The story's import type has many more columns to map than the customer file, so the dialog is 2,801 pixels tall in the story against 941 on the screen; the screen's Start import button has the hover background, since the pointer rests where Continue was |
| Import wizard dialog: Completed (catalog part 2, S61) | G-58 | The screen's View customers button has the hover background, for the same reason |

### 4.3 Corrections

The comparison and the captures found two story fixtures that drew what the server never sends. Both were corrected in the fixtures and mocks, never in Spree's components.

- **An address's state.** The story addresses had no state text, and the story country list had no Oregon, so the addresses cards drew "Portland, 97209" where the server writes "Portland, OR, 97209", and the edit dialog's State field read "Select a state". The shared address builder in `src/fixtures/admin/orders.ts` now gives its addresses `state_text: 'OR'`, as the server sends, and `src/fixtures/admin/countries.ts` lists Oregon. The builder is shared with batch 8's order stories, so their address lines change too: the visual check found every story whose image the change touched, and each was written again and looked at beside the image it replaced; only ", OR" in an address line, Oregon in a state list, or a state field filled had changed. The image review list names each one. The address cases were compared again and the state difference is gone.
- **Refusals in the server's words.** The group sheet's refusal story drew "You are not authorized to access this page." where the running server answers support "Missing permission: write_customers"; the export refusal story drew the same where the server answers "Missing permission: read_payments"; and the two tax registration refusal stories drew the regime's wording where the server marks that message not specific, so the sheet shows "is invalid" (SD-46). The mocks now answer in the server's shapes and words, and the four tax refusal images and the two group refusal images were written again and looked at: only the message changed. The refusal stories also take focus off after the refusal, as batch 8's do, so their images do not depend on how fast the refusal comes back.

## 5. Behaviour found, recorded and not changed

What the running screens and the source showed that the work item did not expect. Each is recorded as Spree's behaviour, as it is; whether to track one as a defect is the owner's, apart from SD-44 to SD-46, which were numbered with the audit thread and which LIQ-004 records.

| # | Behaviour | Where seen | Effect |
|---|---|---|---|
| B1 | Roles that may not write customers are offered the writes: the order manager and support keep the edit controls on the profile, groups, addresses, note and privacy cards and the list's New customer and bulk actions, and support keeps Issue store credit. Only the tax registration card is read-only for them | DA-CUS-01 listed and DA-CUS-02 with-orders, for both roles | What the server answers is NOT_RUN and joins G-11 (G-99); support's group save was refused (B10) |
| B2 | For support and the customer manager, the store credit card reads "No store credits issued" while the customer holds two | DA-CUS-02 with-orders, for both roles | A reader is told the customer has no credit |
| B3 | For the customer manager, the orders card reads "No orders yet." while the figures read 16 orders, and the last order card is missing; Issue store credit is still offered | DA-CUS-02 with-orders, for the customer manager | The page contradicts itself |
| B4 | For support and the customer manager, the custom fields card shows its empty state with "Set up custom fields", although a customer field is defined: the definitions are read under settings | DA-CUS-02 with-orders and export, for both roles | The field the store defined is not shown or offered |
| B5 | The orders card counts 17 orders, a draft among them, where the figures count 16 | DA-CUS-02 with-orders | The two counts differ without saying why |
| B6 | Export data is offered to support and the customer manager, and the server refuses it, since the export also needs `read_orders`, `read_payments`, `read_store_credits` and `read_gift_cards`; the toast reads "Could not export the data. Download failed: 403" | DA-CUS-02 export, for both roles | The message does not say what is missing |
| B7 | The export file holds the internal note, written for staff | §2.2 | A customer asking for their data receives what staff wrote about them |
| B8 | The privacy card's export makes its own access request and completes it without its event, so no `data_request.completed` is published and EM-C-09 is not sent (`customers_controller.rb`, `export`) | §2.2, §9 | Corrects the work item §2.4, which said the export makes no request |
| B9 | The merchandiser's direct visits: the customer list reads "No customers yet" and offers Export and New Customer; the customer page reads "Failed to load customer. Missing permission: read_customers" with Try again, which cannot succeed; the groups list reads "No customer groups yet" | DA-CUS-01, DA-CUS-02 and DA-CUS-03 direct-visit | The lists read as if the store had none, as batch 8's B5 |
| B10 | Support's groups sheet is refused on save with "Missing permission: write_customers", shown at the top of the sheet | DA-CUS-02 groups-refused, for support | The sheet offered the change it then refuses |
| B11 | EM-C-10's confirmation link is the storefront's address with the token added, unless the subscribe call names its own page (`newsletter_mailer.rb`); the storefront at its `main` has no page that confirms a sign-up | §9 | Read in the code and not followed: a storefront that adds a sign-up form must also confirm it |

### 5.1 SD-44: a typed tax registration kind disappears from its field

Found in the tax registration captures. The Kind field accepts any kind, since any string is a valid kind and a validator registered for it decides what it means. A kind typed in that matches no listed kind, such as `nz_gst`, is kept in the form, but when focus moves on the field is emptied, because the field shows only a listed kind (`packages/dashboard-ui/src/spree/tax-identifiers-card.tsx`, the Kind combobox). Saving still sends it: the row then reads `nz_gst` (DA-CUS-02 tax-kind-typed, tax-kind-typed-saved). Proposed severity Low: staff see an empty Kind field for a kind they typed, and may type it again or think it lost. Numbered with the audit thread and recorded in LIQ-004's [existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline). The batch keeps the behaviour as it is. It is not a security or tenant-isolation finding.

### 5.2 SD-45: an address change gives up the defaults it does not name

Found on the address captures, and checked through the Admin API on the browser-test server ([trace](evidence/2026-11-09-fb-19-batch-customers/sd-45/address-defaults-check.txt)). With Sarah's Studio address the default shipping address and Home the default billing, the row menu's Set as default billing on Studio left Studio the default billing address only, and no address the default shipping one (DA-CUS-02 address-default-billing-set). Through the API, a change to Home naming only its default shipping flag cleared its billing default, and a change naming only its label, with nothing else changed, cleared both. Read in the code, the Admin API's customer addresses controller turns a flag it is not sent into false (`spree/api/app/controllers/spree/api/v3/admin/customers/addresses_controller.rb`, `default_billing_flag` and `default_shipping_flag`), while Spree's address update service treats false as giving the default up and only a missing flag as leaving it (`spree/core/app/services/spree/addresses/update.rb`). The edit dialog sends both checkboxes, so it is not affected. Proposed severity Medium: setting one default from the menu silently removes the other, and the customer's next order prefills without the address they used. Numbered with the audit thread and recorded in LIQ-004's existing defects. The check put both defaults back on Home. It is not a security or tenant-isolation finding.

### 5.3 SD-46: a refused tax number says only "is invalid"

Found in the tax registration captures. Spree refuses a number that fails its kind's format in the regime's words, "does not look like a valid EU VAT registration". The Admin API marks that message not specific, since it compares it with the default message for the same code on the same model, which is the model's own wording (`spree/api/app/controllers/concerns/spree/api/v3/admin/validation_details.rb`, `specific_message?`). The dashboard then shows the code's generic text, "is invalid", under Number (DA-CUS-02 tax-refused). Proposed severity Low: staff are not told what is wrong with the number. Numbered with the audit thread and recorded in LIQ-004's existing defects. The batch keeps the behaviour as it is. It is not a security or tenant-isolation finding.

## 6. Corrections to the work item

Recorded in the work item's status, without changing the proposal's text:
- §2.4 said the privacy card's export "makes no such request". It makes its own access request and completes it, without the event that sends EM-C-09 (B8).
- §3 listed `editable-note-card` as reused. The internal note card does not use it.
- §2.1's "the import wizard ... with a customer file's column mapping, progress and results": the two-row file was imported before a capture could show its progress, so the mapping, the results and the imported customers on the list are captured, and the progress step is the catalog batch's part 2 product import's.
- §2.1's "the store credit card empty": captured for the admin in light, on the newcomer before the light pass issued a credit to it, and for support and the customer manager in both themes, who are shown no credit (B2). The admin's empty card in dark is in the comparison, on a customer with no credit.
- §2.1's "filtered by ... company": captured with the companies filter's choices open. No customer the batch made belongs to a company, which is batch 12's.
- §2.1's "the tax identifiers card ... with an identifier not checked and with one nothing can check": no validator is registered on the browser-test server, so both numbers read "Not checked" with "No registry to check this kind against". Each verdict, a check under way and the menu's check action are in the stories only.
- §2.3's "the customers it adds seen on DA-CUS-01 and DA-CUS-02": the imported customers are captured on the list; their pages were not opened.

## 7. Gaps

| Gap | What | Kind | Proposed answer | Status |
|---|---|---|---|---|
| **G-96** | 39 of the batch's 78 stories not compared by the script: 15 seen in a capture, and 24 checked against their source only ([image review list](2026-11-09-fb-19-batch-customers-image-review.md)) | Coverage | Defer, as G-58, G-81, G-85, G-88 and G-93: each story keeps the comparison status the image review list gives it, and the later batch whose running screen first shows the state compares it, under the [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches). The address book row's and the shared tax registration card's company and seller states go to batches 12 and 13 | OPEN, for the owner's answer |
| **G-97** | 14 customer behaviours no browser test drives (§2.3) | Function | Defer to the platform batch's browser-test work, as a further bounded step or as an addition to P11, for the owner to choose; P11 is bounded to G-87, G-90 and G-92 by the owner's answer of 2026-11-09 and does not include these | OPEN, for the owner's answer |
| **G-98** | 4 states reached by answering or holding a request in the browser: DA-CUS-01's loading and none, DA-CUS-02's loading and DA-CUS-03's none (§2.1) | Coverage | Accept as simulated interface-state coverage only, as G-54, G-59, G-82, G-86, G-89 and G-94 | OPEN, for the owner's answer |
| **G-99** | What the server answers to the requests the order manager, support, the customer manager and the merchandiser could make or were shown the controls for (§3.1, §3.2, B1 to B4, B6, B9, B10) | Function | Join G-11. P10 has finished and cannot take new requests, so send them in P12 if P12 has not yet recorded its checks, or otherwise in a later named follow-up; the owner decides which | OPEN, for the owner's answer |

G-81, G-33, G-53 and G-58 each lose the earlier stories compared here (§4.2). The work item's other known gaps: whether Spree sends EM-C-09 and EM-C-10 on the running stack joins G-77 and G-16 (§9); wishlists and newsletter sign-ups have no screen, which is a product decision; companies and their certificates are batch 12's; and tenant isolation and who owns a shopper account stay with FB-03 and the owner.

## 8. Hand-offs from earlier batches (criterion 16)

Each piece was shown on the browser-test server by `screens-batch-10.spec.ts` at `05b7c95b`, with the captures named.

| Piece | Handed over by | Shown | Result |
|---|---|---|---|
| A customer's tax registrations (CAP-07-12) | Batch 7 | The card with Sarah's two numbers and its menu (tax-menu); an Australian Business Number added to the newcomer, which the card lists (tax-added), and deleted, after which the card reads "No tax registration on file" (tax-deleted); a typed kind saved (tax-kind-typed-saved, SD-44); a refused number (tax-refused, SD-46). No validator is registered, so no number was checked | PASS, without a check (§6) |
| The customer import, opened from DA-CUS-01 | Catalog part 2 (FL-21) | The two-row customer file mapped, its columns matched by name (import-mapping); "Import completed" (import-results); Noor Haddad and Tomas Varga on the list (imported-listed) | PASS |
| The issue store credit dialog opened from a customer's page | Catalog part 3 (G-81) | The dialog on Sarah's page (credit-issue), compared with its story (§4.2); a $10.00 credit issued to the newcomer, on its card with its memo, "Fidelity check" (credit-issued), and in the figures' Store credit, $10.00 (no-orders, dark) | PASS |
| A customer's store credit card | Catalog part 3 | The card's states: two credits, the row menu, the edit dialog, the delete confirmation, and empty (§2.1, §6) | PASS |
| Spree's customer erasure specs | Catalog part 3 | `customers/anonymize_spec.rb` (60 examples) and `customers_gdpr_spec.rb` (17 examples) pass (§3.2) | PASS |
| A customer's orders card | Batch 8 | The card with batch 8's orders, placed through the Admin API and completed; View all opens the order list filtered to Sarah (orders-view-all) | PASS |
| A customer field defined on the custom fields screen | Batch 3 (DA-SET-09) | "Preferred pickup day" defined for customers (DA-SET-09 customer-field-defined), shown empty on the newcomer's page (no-orders) and filled with "Saturday" on Sarah's (custom-field-filled) | PASS |

## 9. Emails (criterion 17)

Spree's two emails were rendered by `fidelity/customer-emails.rb` in the emails gem's test app, against a copy of the browser-test server's database inside a transaction that was rolled back, as batch 8 rendered its order emails: EM-C-09 by calling `Spree::CustomerMailer#data_export_email` for Sarah's last completed access request, the one the privacy card's export made, and EM-C-10 by calling `Spree::NewsletterMailer#email_confirmation` for an unconfirmed sign-up made in the transaction as the Store API's subscribe makes one, as Spree's previews call them for their samples. Each was captured at 390 and 1280 pixels in the pinned image by `fidelity/order-emails.spec.ts` ([emails evidence](evidence/2026-11-09-fb-19-batch-customers/emails/)). The download and confirmation tokens are replaced by `<token>`, and the test app's address by `<site>`, before capture. Recipients are not written out.

| Email | Subject | What it shows | Sent |
|---|---|---|---|
| EM-C-09 Data export ready (`Spree::CustomerMailer#data_export_email`) | "Shop Your Data Is Ready to Download" | "Download Your Data", "Hello,", a Download Your Data button linked to the Store API's download for the request, and "If you did not request a copy of your data, please contact us." | No: the privacy card's export publishes no event (B8), and the browser-test server does not load the emails gem (G-77) |
| EM-C-10 Newsletter confirmation (`Spree::NewsletterMailer#email_confirmation`) | "Verify your email address" | "Verify your email address", "Hey,", a Verify email address button and the same link written out, to the store's address with the token (B11), and "If you didn't request this, please ignore this email." | No: no storefront page subscribes, and the browser-test server does not load the emails gem (G-77) |

Both have a plain-text and an HTML part. Spree's specs for these emails pass: `customer_mailer_spec.rb` (5 examples), `newsletter_mailer_spec.rb` (6), `rendered_emails_spec.rb` (2), `customer_email_subscriber_spec.rb` (4), `data_request_email_subscriber_spec.rb` (5) and `newsletter_subscriber_email_subscriber_spec.rb` (5), 27 examples with no failures (§3.2). Sending through a mail service stays with G-16.

## 10. CI runs and local checks

**CI.** The runs on the final commit, the visual check twice, once from the pull request and once started by hand, each in its four parts, with Tests and Packages, are named in the merge record, as criterion 8 asks. If any of them fails, nothing is merged. Runs on earlier commits of the pull request are not counted. The Packages workflow runs Spree's dashboard browser tests in four shards, among them the four files of §2.2.

The visual check stays advisory: it runs on every pull request, and nothing approves a changed screenshot automatically. CI does not run the capture, comparison or email scripts, which were run locally (§2, §4, §8, §9).

**Local checks, in this session.** On `05b7c95b`'s working tree with the batch's changes, lint (Biome), the package's type check, the fixture tests and the token check passed. The Storybook built. In the pinned image, the visual check wrote the batch's 156 reference images in update mode, and after the corrections of §4.3 it ran over every story the changed fixtures and mocks reach: the dashboard core and dashboard UI stories in full, and every admin dashboard story, the orders, customers, store credit, shipping and tax stories in both themes and the rest in light. It found the earlier images those corrections changed, which were written again and looked at (§4.3), and one image of an order payments story that differed by the focus ring alone, which was left as committed. The two full runs in CI are the check (§10). Every new and changed image was looked at in both themes ([image review list](2026-11-09-fb-19-batch-customers-image-review.md)). Every evidence image was converted to lossless WebP and checked equal to its capture, pixel for pixel: 266 converted, none differs. Criterion 14's search, before each push: every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths and compared with the local values this batch used, the browser tests' admin password, the test app's secret and the tokens the emails carried; nothing matched but the test accounts' password the scripts set on the local server. The link check found no broken relative link in the pull request's Markdown files.

## 11. Limitations

- Coverage is not function. A capture shows that a state exists on the running screen; the 14 behaviours of §2.3 are not functionally verified.
- What the interface shows each role is not what the server allows (§3.1, §3.2). The narrower roles' requests were not sent, apart from the two refusals observed (G-99).
- No tax registration validator is registered on the browser-test server, so no number was checked (§6).
- The comparison run's screens drew no product pictures (§4.1).
- Spree's specs ran on SQLite. The pending examples run on PostgreSQL only.
- The emails were rendered, not sent (§9).
- Tenant isolation is NOT_RUN (§3.3).

## 12. Evidence

The [evidence index](evidence/2026-11-09-fb-19-batch-customers/README.md) lists every capture, comparison, email capture, the SD-45 trace and the spec results, with how each was made.

## 13. Delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-09 |
| Accepted by | Claude, in the thread "Build dashboard customers (batch 10)" |
| Revision | The pull request's final commit, named with the merge in the merge record |
| Scope | Criterion 11: the 156 reference images of the [image review list](2026-11-09-fb-19-batch-customers-image-review.md), each looked at in light and dark, the corrected ones again after their correction (§4.3), with the earlier images the correction changed; the running-screen evidence of §2 and §3.1; and fidelity, judged from the comparison of §4, 39 cases and 6 earlier stories with every difference explained. Technical acceptance of criteria 1 to 10 and 12 to 17 as this record gives them, with criterion 8 as the merge record gives it |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status the owner has not decided. G-96 to G-99 stay OPEN for the owner's answers, with their handling proposed, not decided; G-11 stays open. G-33, G-53, G-58 and G-81 stay open for their other stories. SD-44 to SD-46 stay open with their proposed severities. B1 to B11 stay recorded as Spree's behaviour, and whether to track any of them as a defect is the owner's. Tenant isolation stays NOT_RUN (§3.3), ISO-1 to ISO-7 stay open, and FB-03's result and who owns a shopper account stay with the owner. The work item stays PROPOSED and LIQ-004 DRAFT |

What the checks did not show stays as §11 states it.
