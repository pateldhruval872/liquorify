---
title: FB-19 batch, home figures, reports and emails
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-09
updated: 2026-11-10
---

# FB-19 batch: home figures, reports and emails

Batch 11 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): [LIQ-006 §11](../LIQ-006-product-capability-baseline.md#11-analytics-emails-platform-and-developer-surfaces)'s CAP-11-01 to CAP-11-05, "home figures, reports and the email template editor, with the remaining emails". It reproduces what Spree already has for the dashboard's home page, built-in and saved reports with their CSV export, the store's email settings and branding, and the editor merchants use to change customer emails. It also maps every email in those capabilities to the batch that rendered it, and checks where the settings and figures these screens show take effect. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-09, under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)) and the owner's instruction of 2026-11-09 to start batches 10 and 11 within the approved baseline scope, independently where dependencies allow, with each work item's scope and acceptance criteria set before implementation. It depends on orders: batch 8 completed on 2026-11-08 ([merge record](../verification/2026-11-08-fb-19-batch-orders-returns-and-fulfilment-part-2-merge.md)). It runs beside batch 10, customers, which uses none of its screens; the two share only record files, and agreed on 2026-11-09 which emails each maps (§2.5). It has no question that needs the owner now: its choices are planning within the batch's scope and are recorded in §7 as decided under the delegation, never as the owner's answers. Two things read in the code while preparing it change how the batch is run, and are checked on the running stack (§2.7). It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as [batch 8](fb-19-batch-orders-returns-and-fulfilment.md). This work item stays PROPOSED until it is accepted under D5. Built in #89 on 2026-11-10 ([verification record](../verification/2026-11-10-fb-19-batch-home-reports-and-emails.md)): every criterion PASS but criterion 13, NOT_RUN, and criterion 8, recorded in the merge record. §2.7's two findings were confirmed (record §6): the second is SD-53, with LIQ-008 corrected. Corrections to §2.1's states no server reaches are in the record's §6.

## 1. Outcome and summary

Every home, report and email screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch traces FL-18 and FL-22 step by step and FL-01's last step, shows each of the eleven editable customer emails in the editor's preview, and checks on the running stack that a published template, the email branding and the home and report figures each take effect where they should.

- **One part,** one implementation pull request (§7, choice 1).
- **Bounded:** 7 dashboard screens and the storefront's 2 development email screens, 2 flows and the last step of a third, 3 browser test files with 13 tests, 16 new components, and the 27 email IDs of CAP-11-03 to CAP-11-05 mapped, none of them needing a new rendering from Spree's mailer previews.
- **Same shape as batch 8:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; on the running stack, by the batch's own scripted checks of what these screens save and summarise, which are evidence and not browser tests (criterion 16). Behaviours no browser test drives are listed for the owner's answer, as G-87's, G-90's and G-92's were.

## 2. Scope

LIQ-006 §11's CAP-11-01 to CAP-11-05, every screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the flows that run through them.

| Capability | Screens | Flows | Emails | Browser tests |
|---|---|---|---|---|
| CAP-11-01 Home dashboard: key figures, comparison chart, operations and rankings | DA-HOME-01 | FL-01's last step, handed over by batch 3 | None | `home-dashboard.spec.ts` (5 tests) |
| CAP-11-02 Reports: built-in and saved, with CSV export | DA-RPT-01 Reports; DA-RPT-02 New report; DA-RPT-03 Report | FL-22 | EM-S-05 for a report export | `reports.spec.ts` (3 tests) |
| CAP-11-03 Customer emails in Liquid and MJML, with a template editor and per-store colours and font | DA-SET-03 Emails; DA-SET-04 Email templates; DA-SET-05 Email template | FL-18 | EM-C-01 to EM-C-11, mapped (§2.5) | `store-settings.spec.ts`: the five "store settings — emails" tests, handed over by batch 3 |
| CAP-11-04 Store, seller and staff emails | None of its own | None | EM-O-01 to EM-O-05, EM-S-01 to EM-S-07, mapped (§2.5) | None |
| CAP-11-05 Storefront emails sent from webhooks | SF-DEV-01 Email previews list; SF-DEV-02 Email preview (development only) | None | EM-SF-01 to EM-SF-04, mapped (§2.5) | None |

Batch 3 handed DA-SET-03, its five browser tests and the Getting Started support email task's destination to this batch, and batch 8 handed it "a customer's orders card and the home page's order figures" for the home page's part. The home page's sellers ranking tab and the seller payouts built-in report are shown as the screens show them, and mapped by batch 13 with LIQ-006 §10 (§2.6).

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-HOME-01 is also captured on a narrow screen, since its widgets stack.

| Screen | States |
|---|---|
| DA-HOME-01 Home | Figures for the last 30 days with the comparison chart, each of the five metric tiles chosen, and growth up, down and new; a store selling in one currency, with no currency control, and in two, with the figures in each; one channel chosen, and the operations counts and their links scoped to it; the date range picker open, a preset and a custom range; no data for the period; the operations card with each counter the data reaches, low stock turned off, the counts failing to load, and nothing visible to the role; the rankings card on each tab the role may read, with no data, and with its "View report" link; top products with their trend, and hidden without read on products; loading; the figures unavailable to the role; the figures failing to load |
| DA-RPT-01 Reports | The built-in reports listed with their badge, saved reports beside them, searched and sorted; the delete confirmation; none beyond the built-in reports; the New report button hidden without write |
| DA-RPT-02 New report | The empty builder; metrics chosen in one group, and a metric from another group switching the report; grouped by a time dimension at each grain, and by a dimension such as payment status or channel; filters added and removed; compare to the previous period; sort and limit; no metric picked; a ranked table, a time series, and no data for the period; the query refused with its message; the save dialog, and a refused save |
| DA-RPT-03 Report | A built-in report, read-only with its hint and "Save a copy"; a saved report with Save, Rename, Save a copy, Export CSV and Delete; unsaved changes; the rename and copy dialogs; the delete confirmation; the export started, and its toast; each control hidden for a role that may not use it; loading; the report failing to load |
| DA-SET-03 Emails | Customer emails on, with the addresses and branding cards; turned off, with them hidden; sender, support and notification addresses saved; an invalid sender address refused inline; a logo uploaded and removed; colours and font changed, with the branding preview; the preview hidden without write on email templates; the email templates tab hidden without read on them; loading; the settings failing to load |
| DA-SET-04 Email templates | The eleven customer emails, the layout and the five shared partials, with default, customized, draft, "other languages" and "updated by Spree" badges as the data reaches them; the list empty, as the browser-test server shows it (§2.7); loading; the list failing to load; not allowed |
| DA-SET-05 Email template | A default template, read; edited and unsaved, with the leave confirmation; a draft saved, shown and discarded; published; a template with problems, with its alert and the line they are on; the preview card's HTML and text tabs, with a sample and with a chosen record, and the preview unavailable or needing a permission; the variables card, with a variable inserted; a second language; the history sheet empty and with versions, and the restore confirmation; the compare with default dialog; the revert confirmation, for one language and for every language; a test email sent, and its toast; the conflict dialog when another editor saved first; read-only for a role that may read but not write; loading; the template failing to load; not allowed |
| SF-DEV-01 Email previews list | The four storefront emails listed, on the storefront's development server; not found on a production build |
| SF-DEV-02 Email preview | Each of the four storefront emails with its sample data |

### 2.2 Permission variants

Spree's catalog has two analytics scopes, `dashboard` (read only, for the home page's counts) and `reports` (the figures, saved reports and report exports), and keeps `email_templates` apart from `settings` on purpose: "a template writes what every customer receives, links included, so managing store settings does not grant it". Eight variants cover them:

- **Admin role:** every screen with every control.
- **A role made from the support template,** which grants read on the dashboard but not on reports (§2.7): the home page as it shows, and a direct visit to the reports.
- **A role made from the merchandiser template,** which holds neither analytics scope: the home page as it shows, and the Reports entry hidden.
- **A custom analyst role,** with read on the dashboard, reports, products, categories and customers: the figures with the customers and categories ranking tabs and top products, the reports read-only, with New report, Save, Rename, Delete and Export hidden as each screen shows them.
- **A custom report builder role,** with read on the dashboard and write on reports, and nothing on products, categories or customers: every report control shown, the ranking tabs and top products hidden, and what the server answers its export recorded. *Corrected 2026-11-09:* the role was given read on orders too, as the figures it builds are order figures, and its report export was accepted (201), so SD-28 does not apply to report exports ([verification record §3](../verification/2026-11-10-fb-19-batch-home-reports-and-emails.md#32-what-the-server-refuses)).
- **A custom settings role,** with write on settings and nothing on email templates: DA-SET-03 editable without the branding preview or the templates tab, and a direct visit to DA-SET-04 and DA-SET-05.
- **A custom email editor role,** with read on settings and write on email templates: the templates editable, and DA-SET-03's Save as the screen shows it to a role that may only read settings, since earlier batches found screens that keep controls the server then refuses.
- **A custom email viewer role,** with read on settings and on email templates: the editor read-only.

### 2.3 Flows and their steps

#### FL-18, branding and editing customer emails

| Step | Browser tests |
|---|---|
| DA-SET-03: email settings, addresses, logo, colours and font | `store-settings.spec.ts`: "hides addresses + branding cards when consumer emails are turned off", "saves sender + support + notifications addresses and reloads them", "uploads the email logo, then removes it", "flags an invalid mail_from_address inline", "saves the email colors and font, and they survive a reload" |
| DA-SET-04: the templates listed | None |
| DA-SET-05: edit, save a draft, send a test, publish, revert | None: a gap. Driven by the batch's script on the emails gem's test app (§2.7), which is evidence, not a browser test |
| The EM-C emails: a published change and the branding seen in a sent email | None: shown by the batch's script (§2.4) |

#### FL-22, building and exporting a report

| Step | Browser tests |
|---|---|
| DA-RPT-02: build a report | `reports.spec.ts`: "builds, saves, renames and deletes a custom report", "switches the report to another metric group" |
| DA-RPT-03: save, rename, delete | `reports.spec.ts`: "builds, saves, renames and deletes a custom report", "lists the built-in reports and opens one" |
| DA-RPT-03: export CSV | None: "export not tested", as LIQ-008 records. Driven by the batch's script on a server that writes its mail to a folder, as catalog part 2's FL-21 was |
| EM-S-05: the export's email and its download | None: read as sent by the batch's script (§2.4) |

#### FL-01, the last step

| Step | Browser tests |
|---|---|
| DA-HOME-01 after first-run setup | Batch 3's `first-run/setup.spec.ts` lands on it; the five `home-dashboard.spec.ts` tests cover what it shows |

### 2.4 Settings and figures checked where they take effect

Each is saved through its dashboard screen, or read from it, and then seen, or not, where it takes effect, with captures of both sides and the result recorded per row (criterion 16). They are evidence, not browser tests.

| What | Where it is checked |
|---|---|
| A published template change | Edited and published on DA-SET-05, then seen in the email Spree sends for a real event on the emails gem's test app; reverted, and the default seen again. The event is a customer's password reset through the Store API, as P1 sent EM-C-08, unless another of the eleven proves easier to trigger there |
| A test email | Sent from DA-SET-05 and read from the mail folder, with its subject and the draft's change |
| The email branding and logo | Saved on DA-SET-03, then seen in the branding preview, in the editor's preview and in the sent email |
| The sender and support addresses | Saved on DA-SET-03, then seen in the sent email's sender and footer |
| The new order notification address and turning customer emails off | Saved on DA-SET-03; whether EM-O-01 goes to the address, and whether a customer email is still sent once they are off, is seen on the emails gem's test app for an order placed there, or recorded as not reachable with the check made instead |
| The home page's figures | Total sales and orders for a range and a channel, compared with the completed orders the Admin API lists for the same range, channel and currency |
| A report's figures and its CSV | A built-in report's figures compared with the same orders, and its exported CSV compared with the report on screen |
| The operations counts | Each count compared with the list its link opens |

### 2.5 Emails

Every email in CAP-11-03 to CAP-11-05 was rendered by an earlier batch or is mapped by a later one, so this batch renders none from Spree's mailer previews. It maps each to that evidence, shows the eleven editable customer emails in the editor's preview (DA-SET-05), and reads three as sent on the running stack.

| Emails | Rendered by | This batch |
|---|---|---|
| EM-C-01 | Batch 9 | Mapped; shown in the editor's preview |
| EM-C-02, EM-C-03, EM-C-07, EM-O-01 | Batch 8, part 1 | Mapped; the customer ones shown in the editor's preview |
| EM-C-05, EM-C-06 | Batch 8, part 2 | Mapped; shown in the editor's preview |
| EM-C-08 | The shopper accounts batch; sent on the emails gem's test app by P1 | Mapped; shown in the editor's preview, and sent again with a published change (§2.4) |
| EM-C-09, EM-C-10 | Batch 10, with CAP-08-06 and CAP-08-05, as the two batches agreed on 2026-11-09 | Mapped to batch 10's record; shown in the editor's preview |
| EM-C-11 | Batch 12, with the company screens | Mapped to batch 12; shown in the editor's preview |
| EM-C-04, EM-O-02 to EM-O-05, EM-S-02 | Batch 13, marketplace | Mapped to batch 13; EM-C-04 shown in the editor's preview |
| EM-S-01, EM-S-03, EM-S-04 | Staff access, part 1 | Mapped |
| EM-S-05, EM-S-06 | Catalog and pricing, part 2 | Mapped; EM-S-05 read as sent for a report export (FL-22) |
| EM-S-07 | Developer and integration settings (batch 2) | Mapped |
| EM-SF-01 | Batch 9 | Mapped; shown on SF-DEV-02 |
| EM-SF-02, EM-SF-03 | Batch 8 | Mapped; shown on SF-DEV-02 |
| EM-SF-04 | The shopper accounts batch | Mapped; shown on SF-DEV-02 |

The editor's preview renders a template with Spree's sample data or a chosen record, which is not the same as Spree sending it; each is recorded as a preview. Whether Spree sends each email on a Liquorify store, and through which mail service, stays with G-16 and G-77, deferred on 2026-11-04 (decision 22). The emails gem's test app writes its mail to a folder, and sending through a mail service is not run.

### 2.6 Left out, and where it goes

- **The marketplace parts of these screens:** the home page's sellers ranking tab, the seller payouts report and the marketplace emails. Captured as the screens show them, and mapped by batch 13 with LIQ-006 §10.
- **The data export, newsletter and company invitation emails as capabilities:** batch 10 for EM-C-09 and EM-C-10, batch 12 for EM-C-11 (§2.5).
- **The seller panel's home page:** batch 13.
- **Getting Started (DA-HOME-02):** batch 3's; this batch captures only where its support email task leads.
- **Sending through a mail service, and which path a Liquorify store uses for customer emails:** G-16 and G-77 (§2.5).
- **Liquorify's own emails** (verification, billing): new templates that wait with F1 and F3, as LIQ-006 notes.

### 2.7 Found while preparing this proposal

Read in the code at `main` `05b7c95b`. Both are checked on the running stack first, and what is confirmed is recorded before the captures depend on it.

- **The browser-test server lists no email templates.** The eleven editable emails, the layout and the partials are registered by the emails gem (`spree/emails/lib/spree/emails/engine.rb`), which the browser-test server does not load (G-16, G-77). DA-SET-04 there should list nothing, and DA-SET-05 has nothing to open. So DA-SET-04 is captured on the browser-test server as it shows, and DA-SET-04 and DA-SET-05 with their content are captured on the emails gem's own test app, given Spree's seeds and the same admin, with the same built dashboard pointed at it, as P1 sent EM-C-08 there. If the browser-test server does list the templates, the second server is not used.
- **The home page's figures need read on reports, which the support template does not grant.** LIQ-008 records DA-HOME-01 as opened with `dashboard`, which the support template grants. The figures come from the reporting endpoint, which needs `reports`, and when it refuses, the page shows "unavailable" in place of everything, including the operations counts the `dashboard` scope does allow. Read in the code, a role made from the support template, or the merchandiser template, sees no figures and no counts. If confirmed, the record corrects LIQ-008's DA-HOME-01 row and brings the behaviour to the owner as a candidate existing defect, with a number from the defect register, before it is settled.

Two existing defects were expected to affect FL-22, to be recorded where they show rather than found again: SD-28, no staff role short of a full admin can create an export, so the report builder role's export was expected to be refused; and SD-17, the export email links to the list it was started from, not the file, which part 2 of the catalog batch found for a product export. *Corrected 2026-11-09:* SD-28 does not apply here. SD-28's own entry says the report export is the one export type in the permission catalog, and the report builder's export was accepted. Whether SD-17 shows for a report export is recorded under FL-22 in the verification record.

## 3. Components

The screens use 16 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the seven dashboard screens import at `main` `05b7c95b`, followed through the components they import in turn; the first step of the work confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Design system, primitives (CMP-DUI-P) | `chart` (10), `code-editor` (12), `date-range-picker` (19) |
| Admin dashboard, `reporting/` (CMP-DA-G-17) | `growth-badge`, `report-builder`, `report-view`, `report-workspace`, `save-report-dialog` |
| Admin dashboard, `email-templates/` (CMP-DA-G-08) | `conflict-dialog`, `default-diff-dialog`, `email-preview-frame`, `emails-tabs`, `history-sheet`, `preview-card`, `problems-alert`, `variables-card` |

The home page's operations, rankings and top products cards are written inside its route file, not as component files, so LIQ-009 lists them under no component ID. They are captured as DA-HOME-01's states and get no stories of their own, as LIQ-010 §10 ties stories to component files. The saved reports table is a table definition shown through `resource-table`, as earlier listing pages were. The storefront's four email templates are emails, not storefront components, and stay out of the storefront's Storybook, as FB-19's scope sets out ("the email templates, which have their own previews").

**Already covered, reused here:** `resource-table`, `page-header`, `resource-layout`, `channel-select`, `currency-select`, `color-picker`, `image-upload-field`, `route-error-boundary`, `relative-time`, `actor-label`, `confirm-dialog`, `form-actions`, `can`, and the primitives from earlier batches, among them `alert`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `empty`, `field`, `input`, `item`, `progress`, `scroll-area`, `select`, `sheet`, `skeleton`, `switch`, `tabs`, `textarea`, `thumbnail` and `toast`. The email branding token page (`Tokens/Email branding`, TK-EM) exists since the pilot.

### 3.1 Earlier stories this batch's screens show

LIQ-004's [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) applies: the image review list has a section for stories held by G-01, G-33, G-53, G-58, G-65, G-81, G-85, G-88 or G-93 that one of the running screens shows, compared by the script as the batch's own stories are, each with the gap it came from. One is known already: batch 8 left the channel select's "All channels" story uncompared because that choice belongs to the home page's filters (G-88).

## 4. Delivery

- **One backend pull request,** with the stories, fixtures and mocks, reference images, capture and comparison scripts, verification record, image review list, evidence index and LIQ-009's Storybook column, followed by its merge record. This work item is its first commit.
- **Merge order:** LIQ-004's queue on `main` comes first. Batch 10 runs beside it and touches the same record files; whichever merges second brings itself up to date with `main` and keeps both entries.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batch 8 ran, in this session's own checkout, database and ports. The roles in §2.2, the saved reports, and the orders the figures need, are added through the Admin API on that server's database only. DA-SET-04 and DA-SET-05 with their content run on the emails gem's own test app (§2.7), on its own port and database, removed after the run.
- **The storefront:** run at its `main` on its development server, for SF-DEV-01 and SF-DEV-02 only, and as a production build for SF-DEV-01's not-found state. It is not changed, and no storefront pull request is expected.
- **Evidence logs** are saved as `.txt`, because the root `.gitignore` drops `*.log`. Local and CI results are reported apart.

**Size, estimated from batch 8:** about 110 stories and 220 reference images, and about 140 running-screen captures. With them the visual check passes 3,900 comparisons, about 1,000 in each of its four parts, before batch 10's.

## 5. Acceptance criteria

Batch 8's criteria, with criterion 12 naming this batch's specs, criterion 15 the behaviours no test drives, criterion 16 the settings and figures of §2.4, and criterion 17 the emails. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard or storefront, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | The flows are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 is confirmed | The pull request |
| 11 | The reference images, the screen evidence and fidelity are accepted | By delegated acceptance, under the owner's delegation of 2026-11-04, recorded in the merge record; never described as the owner's review |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run: the Admin API controller and integration specs for reporting, saved reports, dashboard counters, exports, the store, email templates and their drafts, publications, previews, test emails, sample records, revisions and restorations; the reporting query, schema, registry and counters specs; the saved report, report export, email template and email branding model specs; the email template preview service, the five email template workflows and the email template mailer; and the emails gem's rendered emails spec |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings, ISO-7 among them for the reports' customer totals. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys and tokens in a captured email or link are masked in every capture and replaced in every record | The search's result in the record |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's, G-90's and G-92's were. None is counted as tested | The record's list |
| 16 | Each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | Captures and the record |
| 17 | Every email ID in CAP-11-03 to CAP-11-05 is mapped to the batch that rendered it or will; the eleven editable customer emails are captured in the editor's preview; the test email, the published change and EM-S-05 for a report export are read as sent; SF-DEV-01 and SF-DEV-02 are captured | The emails section |

## 6. Spree's own tests for these screens

Browser tests, all in the dashboard's suite: `home-dashboard.spec.ts` (5 tests), `reports.spec.ts` (3 tests) and the five "store settings — emails" tests of `store-settings.spec.ts`. They pass in CI at the batch's revision; their titles are in §2.3. No browser test opens DA-SET-04 or DA-SET-05, exports a report, or opens the storefront's development previews.

## 7. Choices made under the owner's delegation

Batch 11 has no question that needs the owner. Its choices are planning within the batch's approved scope, which LIQ-004 set as "home figures, reports and the email template editor (CAP-11-01 to CAP-11-05), with the remaining emails", and which the owner's delegation of 2026-11-04 and instruction of 2026-11-09 let the implementing session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **One part, one implementation pull request.** Sixteen new components, fewer than batch 7's 21, and no new mailer rendering. Two parts would add a merge cycle without making either review much smaller, since the email screens and the reports share no components but the home page and the reports share most of theirs.
2. **The email template screens with content run on the emails gem's own test app** (§2.7), because the browser-test server registers no templates. The same built dashboard is pointed at it, so the screens are Spree's own at the same revision; only the server differs, and the record says which server each capture came from. This follows P1, which the owner accepted on 2026-10-23.
3. **States are reached through the Admin API,** on the browser-test database or the emails test app's, as every batch has done. A state the Admin API cannot reach, such as Spree changing a default template under a customized one ("updated by Spree"), is shown in a story, checked against its source and recorded as a coverage gap; a state reached by answering a request in the browser says so.
4. **Five custom roles,** beside the support and merchandiser templates (§2.2), because no template grants reports or email templates, and Spree's catalog keeps reports apart from the home page's counts and email templates apart from settings on purpose.
5. **Settings and figures are checked as evidence, not browser tests** (§2.4). Adding browser tests for them would be platform batch work, as P9 is for earlier batches; the record lists any that need one for the owner's answer (criterion 15).
6. **The emails are mapped, not rendered again** (§2.5). Every one was rendered by an earlier batch or is mapped by a later one; batch 10 takes EM-C-09 and EM-C-10, as the two batches agreed on 2026-11-09. The editor's preview shows all eleven customer emails as merchants see them.
7. **The storefront is run, not changed,** on its development server for its two development screens.

What stays with the owner: what §2.7's second finding becomes if it is confirmed, the answers to the gaps the record lists, and anything the batch finds that would change scope, a defect or a criterion, which comes back to the owner before it is settled. Tenant isolation stays NOT_RUN: FB-03's validation is separate, and this batch claims nothing about it.

## 8. Gaps known before the work starts

Recorded now so none is lost. The record says which it closes. Gap numbers are given by the defect register's allocating thread when the record is written.

| Gap | What would close it |
|---|---|
| No browser test opens DA-SET-04 or DA-SET-05, or saves a draft, publishes, sends a test, reverts, restores a version, compares with the default, or meets a conflict; none exports a report or reads EM-S-05 for one; none checks the home or report figures against the orders they count. Read in the tests | This batch's captures and scripted checks show them; the record lists them for the owner's answer (criterion 15), as G-87, G-90 and G-92 were |
| The email template screens with content are captured on the emails gem's test app, not the browser-test server (§2.7) | Recorded per capture; closes with G-16's email configuration, when the server Liquorify runs loads the emails gem or the owner decides it will not |
| The home page's figures and counts for a role without read on reports (§2.7) | Checked on the running stack; if confirmed, brought to the owner before it is settled |
| States the Admin API cannot reach: "updated by Spree", and a template whose saved draft Spree can no longer render | Shown in stories, checked against their source, and recorded as coverage gaps |
| States reached only by answering a request in the browser, such as loading and the pages failing to load | Recorded as simulated interface-state coverage, as G-54, G-86, G-89 and G-94 were |
| Whether Spree sends each customer email on a Liquorify store, and through which mail service | G-16 and G-77, deferred on 2026-11-04 (decision 22) |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11, whose refusal checks are platform step P10 |
| The marketplace parts of these screens and emails | Batch 13 (§2.6) |
| Tenant isolation (criterion 13), with ISO-7 for the reports' customer totals | FB-03's validation and the fixes for ISO-1 to ISO-7. The batch claims nothing about other stores. A new isolation defect is reported to the owner privately and is not published while it is open |

## 9. Ownership, risk and release impact

- **Owner.** An automated Claude session implements. Acceptance is delegated acceptance under the owner's delegation of 2026-11-04, which is not the owner's review and not independent review ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change reports, email settings and templates on the browser-test server and the emails test app, both local and discarded after the run.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
