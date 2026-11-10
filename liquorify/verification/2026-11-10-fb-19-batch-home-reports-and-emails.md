---
title: FB-19 batch 11, home figures, reports and emails
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session); not independent review
result: PASS for the map, the 87 stories and their images, the running-screen captures, the comparison with running screens, 29 cases and 1 earlier story in both themes with every difference explained, and Spree's own specs for the batch's endpoints, models, workflows and mailers, 461 examples with no failures. Every state the work item lists for the seven dashboard screens and the two storefront screens is captured or recorded as a correction, and 16 states were reached by answering a request in the browser. FL-18 and FL-22 are traced step by step, and FL-01's last step, with the steps no browser test drives recorded. PASS for the eight settings and figures of §2.4, each checked where it takes effect, with one counter that does not match its list (SD-51). PASS for the emails, mapped, previewed and three read as sent. Backend authorization for the narrower roles beyond Spree's own specs, and tenant isolation, are NOT_RUN. Six existing defects (SD-51 to SD-56) and five gaps (G-100 to G-104) are recorded for the owner. Criterion 8 counts CI on the final commit, named in the merge record
---

# FB-19 batch 11, home figures, reports and emails

**Claim.** The [batch 11 work item](../work-items/fb-19-batch-home-reports-and-emails.md) reproduces what Spree already has for the home page's figures, the reports and the customer email templates. It gives the 16 new components those screens use 87 Storybook stories with light and dark reference images. It captures the seven dashboard screens on Spree's running dashboard in each state the work item lists and for each of eight roles, and the storefront's two development email screens. It traces FL-18 and FL-22 step by step, and FL-01's last step, and checks on the running stack that a published template, the email branding, the email addresses, the home page's figures, a report's figures and its export, and the operations counts each take effect where they should. Spree's code and the storefront are not changed.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | #89, branch `claude/project-thread-vptx49`. It starts from `main` at `05b7c95b`, the revision the work item names: the proposal is `dea463fe`, the stories, fixtures, mocks and reference images `cbb38d3d`, and the capture, comparison and flow scripts `e3692b9b`. Later commits change Liquorify's records only, or bring in `main`. The final commit is named in the merge record |
| Spree's code: the dashboard, its packages, the SDKs and the gems | Unchanged: `git diff` between `main` and the branch over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk`, `.github` and `pnpm-lock.yaml` is empty |
| Running screens | The built admin dashboard against two servers, at that code, in the pinned Playwright 1.64.1 image: the dashboard browser tests' own Rails server and fixtures (the browser-test server), and the emails gem's own test app, given Spree's seeds and sample data, for DA-SET-04 and DA-SET-05 with their content and for FL-18 (§2.7 of the work item, confirmed in §6). Captures are 1280 by 960 pixels, and 390 by 844 for the phone capture; a page captured whole grows the window to the page's height |
| The storefront | `b3202e8`, its `main`, run on its development server for SF-DEV-01 and SF-DEV-02, and built for production for SF-DEV-01's not-found state. It was not changed |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-home-reports-and-emails.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | PASS: the map in §2 has CAP-11-01 to CAP-11-05, the nine screens, FL-18, FL-22 and FL-01's last step, the `dashboard`, `reports`, `settings` and `email_templates` scopes, the 16 components, Spree's 13 browser tests in three files, and the 27 email IDs, each with its evidence or a named gap |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 16 new components, 87 stories, 174 reference images, each looked at in both modes ([image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md)). The running screens use the 16 the work item named. The reused components are the work item's §3 list |
| 3 | Every screen is captured on the running dashboard or storefront, at the pinned revision, in each state in §2.1 | PASS for every listed state, with the states no server reaches recorded as corrections (§6). 95 states of the seven dashboard screens are captured, in 116 captures with the role and phone variants, and 10 states of the two storefront screens, each in light and dark, 252 images. 16 states were reached by answering a request in the browser, and say so (§2.1, G-102) |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen, and the seven narrower roles on the screens and states their variant names |
| 5 | The flows are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | PASS. FL-18, FL-22 and FL-01's last step are traced step by step (§2.2). The steps with browser tests map to Spree's `home-dashboard.spec.ts`, `reports.spec.ts` and `store-settings.spec.ts`, which run in CI at the pull request's revision (§10). The template editor, the report export and its email have no browser test, and are listed under criterion 15 (G-100) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 29 cases of the batch's stories and 1 earlier story were compared in both themes, 60 comparisons, and every difference is explained by the data, by what holds the component, by where the pointer or focus is, or by the screen's layout. No story needed a correction |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 58 of the 87 stories were not compared by the script; 27 of them show a state seen in a capture or a flow script's images, and 31 were checked against their source only (G-101, image review list). Every capture whose state was reached in the browser names how in its note, and claims nothing about the server (§2.1, G-102) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | Recorded in the merge record, which names the two full runs on the final commit (§10). Nothing is merged unless both pass with Tests and Packages |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from merges of `main`. No workflow, lockfile or Spree file changes. The storefront was run and built, and not changed |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 is confirmed | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-008's DA-HOME-01 row (§6), LIQ-004's FB-19 entry, progress tables, gap register, existing defects and comparison follow-up, the work item's status and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at #89's final commit (§13). Not the owner's review. The gaps the batch leaves stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 461 examples from 40 spec files, 0 failures, saved as `backend/api-specs.json`, `backend/core-specs.json` and `backend/email-specs.json` (§3.2). Most run as the store's admin; 39 send no credentials, a staff role's permission keys or a secret key's scopes. What no spec exercises for the narrower roles is NOT_RUN and is proposed to join G-11 for P12 (G-103) |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings, ISO-7 among them for the reports' customer totals. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | NOT_RUN (§3.3). ISO-7 stays open. No check read or wrote another store's records. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys and tokens in a captured email or link are masked in every capture and replaced in every record | PASS: the stories use invented shops, products, people and references; the running screens show the test servers' records and the records the scripts add, with `example.com` addresses. The reset link's token in the three sent password reset emails, and the signed storage address of the logo in the six sent emails, are replaced by `…`, and the test servers' addresses by `<store-url>` and `<site>`. No capture draws a key or a token. Before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths and compared with the local values the batch used; one machine path, in the API spec results, was found and replaced before the first push of the evidence (§10) |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's, G-90's and G-92's were. None is counted as tested | PASS: 12 behaviours no browser test drives are listed in §2.3, each with its evidence and the Spree specs for the server's side. None is counted as tested. They are G-100, for the owner's answer |
| 16 | Each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row | PASS (§8): all eight rows were checked where they take effect. Six of the seven operations counts match the list their link opens; Payments to collect counts 2 and its list shows 3, including the canceled order (SD-51) |
| 17 | Every email ID in CAP-11-03 to CAP-11-05 is mapped to the batch that rendered it or will; the eleven editable customer emails are captured in the editor's preview; the test email, the published change and EM-S-05 for a report export are read as sent; SF-DEV-01 and SF-DEV-02 are captured | PASS (§9): the 27 IDs are mapped; the eleven customer emails are captured in the editor's preview; the test email, the published change and EM-S-05 were read from the mail folders; SF-DEV-01 and SF-DEV-02 are captured. EM-S-05 promises a link it does not carry (SD-52) |

## 1. What was built

- **Stories:** 87 stories for the 16 components of the work item's §3, in `packages/liquorify-storybook/stories/`, with fixtures and mocks for the reporting, saved report, export, store and email template endpoints. The stories hold canonical values only and render Spree's own components with Spree's own providers, as earlier batches do.
- **Reference images:** 174, one per story and theme.
- **Scripts,** in `packages/liquorify-storybook/fidelity/`: `screens-batch-11.spec.ts` captures the running screens, `compare-batch-11.spec.ts` compares the stories with them, `fl-22.spec.ts` builds, saves, renames, exports and deletes a report and checks the home page's figures and the operations counts, and `fl-18.spec.ts` checks the email settings and a published template where they take effect. `staff.ts` creates the batch's seven narrower roles through the Admin API. `emails-stack.config.ts` starts the emails gem's test app with its mail written to a folder. None is a browser test.

The coverage report lists the 16 components with their stories, and LIQ-009's Storybook column now names them.

## 2. The batch's map

| Capability | Screens | Flows | Emails | Browser tests | Evidence |
|---|---|---|---|---|---|
| CAP-11-01 Home dashboard | DA-HOME-01 | FL-01's last step | None | `home-dashboard.spec.ts` (5) | 21 states, 25 captures (§2.1); the figures checked (§8) |
| CAP-11-02 Reports, built-in and saved, with CSV export | DA-RPT-01, DA-RPT-02, DA-RPT-03 | FL-22 | EM-S-05 for a report export | `reports.spec.ts` (3) | 37 states, 46 captures; FL-22 (§2.2, §8) |
| CAP-11-03 Customer emails and the template editor | DA-SET-03, DA-SET-04, DA-SET-05 | FL-18 | EM-C-01 to EM-C-11 | `store-settings.spec.ts`, the five email tests | 37 states, 45 captures; FL-18 (§2.2, §8); the eleven previews (§9) |
| CAP-11-04 Store, seller and staff emails | None | None | EM-O-01 to EM-O-05, EM-S-01 to EM-S-07 | None | Mapped (§9); EM-O-01 read as sent |
| CAP-11-05 Storefront emails from webhooks | SF-DEV-01, SF-DEV-02 | None | EM-SF-01 to EM-SF-04 | None | 10 states, 20 images |

### 2.1 Screens and their states

Every capture is in the [evidence folder](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/README.md) under `screens/<screen>/<state>/`, with a note naming the server, the role, the path and, where the state was reached in the browser, what was answered.

| Screen | States captured | Roles beyond the admin | Reached in the browser |
|---|---|---|---|
| DA-HOME-01 | figures (also at phone width), the four other metric tiles, a second currency (EUR), one channel, the date picker open, a preset (Last 7 days), a custom range, no data, the rankings' categories, customers, companies and sellers tabs, loading, unavailable, failed, the operations card failing and with nothing visible | The analyst and the report builder on the figures; support and the merchandiser on unavailable | one currency, loading, failed, the operations card failing and with nothing visible |
| DA-RPT-01 | listed, searched, sorted, the delete confirmation, the built-in reports alone | The analyst and the report builder listed; support and the merchandiser on a direct visit | the built-in reports alone |
| DA-RPT-02 | empty, a time series, another metric group, each grain (hour, week, month), a grain not offered for the range, grouped by payment status and by channel, compared, a filter added, the figures alone, no data, refused, the save dialog, a name missing, a name taken, a save refused by the server | The analyst on a direct visit and on Save (SD-56) | refused |
| DA-RPT-03 | a built-in report, its menu and its copy, a saved report and its menu, unsaved changes, rename, copy, the delete confirmation, loading, failed | The analyst and the report builder on both reports; the report builder's menus; support on a direct visit (SD-55) | loading, failed |
| DA-SET-03 | the settings, customer emails turned off, an invalid sender, colours changed, loading, failed | The store settings role, the email editor and the email viewer | loading, failed |
| DA-SET-04 | listed (emails gem's test app), empty (browser-test server), loading, failed | The email editor and the email viewer listed; the store settings role on a direct visit | loading, failed |
| DA-SET-05 | the default (password reset), the order confirmation, the layout and the nine other customer emails, edited, the leave confirmation, problems, the preview's phone and text views, choosing a record and a record chosen, a variable inserted, the history empty, the menu, loading, failed, the preview unavailable, and a direct visit on the browser-test server | The email editor and the email viewer on the default; the store settings role on a direct visit | loading, failed, the preview unavailable |
| SF-DEV-01 | listed on the development server; not found on a production build | The storefront | None |
| SF-DEV-02 | the four emails, each as HTML and as text | The storefront | None |

The draft saved, the test email sent, published, the history with versions, the restore confirmation, the conflict dialog, the revert confirmation and reverted are FL-18's images (§2.2); the export started, its toast and the email are FL-22's.

### 2.2 FL-18, FL-22 and FL-01 step by step

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| FL-18: addresses, logo, colours and font | DA-SET-03 | `store-settings.spec.ts`: "hides addresses + branding cards when consumer emails are turned off", "saves sender + support + notifications addresses and reloads them", "uploads the email logo, then removes it", "flags an invalid mail_from_address inline", "saves the email colors and font, and they survive a reload" | settings, turned-off, invalid-sender, colours-changed; [fl-18 a1](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-18/a1-settings-saved.webp) with the sender, support and notification addresses, an accent colour and a logo saved |
| FL-18: the templates listed | DA-SET-04 | None | listed, for three roles |
| FL-18: edit, save a draft, send a test, publish, history, restore, conflict, revert | DA-SET-05 | None | fl-18 b1 to b12, driven by `fl-18.spec.ts` on the emails gem's test app (§8) |
| FL-18: the change and the branding in sent emails | None | None | fl-18 a3, b3, b5, b13, c1, c2, read from the mail folder (§8) |
| FL-22: build a report | DA-RPT-02 | `reports.spec.ts`: "builds, saves, renames and deletes a custom report", "switches the report to another metric group" | [fl-22 1-built](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/1-built.webp): sales by channel over the last 4 weeks, compared |
| FL-22: save, rename, delete | DA-RPT-03 | "builds, saves, renames and deletes a custom report", "lists the built-in reports and opens one" | fl-22 2 to 4, 8, 9; the saved report read through the Admin API, then 404 after delete |
| FL-22: export CSV | DA-RPT-03 | None | [fl-22 5-exported](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/5-exported.webp); the CSV compared with the screen (§8) |
| FL-22: EM-S-05 | None | None | [fl-22 6-export-email](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/6-export-email.webp), read from the mail folder two seconds after the export (SD-52) |
| FL-01's last step: the home page after first-run setup | DA-HOME-01 | Batch 3's `first-run/setup.spec.ts` lands on it; the five `home-dashboard.spec.ts` tests cover what it shows | figures |

The tests named above run in CI at the pull request's revision (§10). FL-18's and FL-22's steps without a test were driven by the batch's scripts, which are not browser tests (G-100).

### 2.3 Behaviours no browser test drives (criterion 15)

Each was shown by a capture or a flow script, and none is counted as tested. The server's side of each is exercised by the Spree specs named in §3.2.

1. Editing a template, with the leave confirmation (DA-SET-05 edited, leave-confirmation).
2. Saving a draft, and that a draft alone does not reach customers (fl-18 b2, §8).
3. Sending a test email (fl-18 b3).
4. Publishing, and the published change reaching customers (fl-18 b4, b5).
5. The history, and restoring a version (fl-18 b6 to b8).
6. The conflict when another editor saved first (fl-18 b9, b10).
7. Reverting to Spree's default (fl-18 b11 to b13).
8. Choosing a record for the preview, and inserting a variable (DA-SET-05 choosing-record, chosen-record, variable-inserted).
9. The templates list (DA-SET-04).
10. Exporting a report, and its email (fl-22 5, 6).
11. Saving a copy of a built-in report, and searching and sorting the reports list (DA-RPT-03 built-in-copy; DA-RPT-01 searched, sorted).
12. The home page's date range, its rankings tabs and every operations link but Orders to fulfill (DA-HOME-01 preset, custom-range, rankings-*; §8's counts).

## 3. Permissions and isolation

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it. The roles were created through the Admin API with the keys below.

| Variant | Role's permission keys | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Support template | `read_orders`, `read_customers`, `read_dashboard` | The home page reads "Reports are unavailable for your role" in place of everything, the operations counts included, though `dashboard` allows them (SD-53). On a direct visit, the reports list reads "No reports yet. Create one to get started.", as if the store had none, and a report reads "Loading…" without end (SD-55) |
| Merchandiser template | `write_products`, `write_categories`, `write_collections`, `write_stock` | The home page as support's (SD-53). No Reports entry in the navigation; on a direct visit, the list as support's |
| Analyst | `read_dashboard`, `read_reports`, `read_products`, `read_categories`, `read_customers` | The figures with the customers and categories ranking tabs and top products. The reports list without New report; a saved report keeps its menu, which was not opened for the analyst. Save is still offered on a new report, and the server answers 403 "Missing permission: write_reports" (SD-56). The built-in "Failed payments" report reads "Could not load this report. Missing permission: read_settings" (B10) |
| Report builder | `read_dashboard`, `write_reports`, `read_orders` | Every report control, and the menus with Rename, Save a copy, Export CSV and Delete. The home page without the ranking tabs and top products it may not read |
| Store settings | `write_settings` | DA-SET-03 editable, without the Settings and Templates tabs, so the templates cannot be reached from it. On a direct visit, DA-SET-04 and DA-SET-05 refuse it, with messages that differ from screen to screen (B7) |
| Email editor | `read_settings`, `write_email_templates` | The templates editable. DA-SET-03 keeps its Save, though the role may only read settings (B11) |
| Email viewer | `read_settings`, `read_email_templates` | The editor read-only. DA-SET-03 keeps its Save, as the editor's (B11) |

### 3.2 What the server refuses

**Spree's own specs, at Spree's code `05b7c95b`.** Run in this session on SQLite with Spree's API, core and emails test apps. 461 examples from 40 spec files, 0 failures and none pending. Every example is listed with its result in [api-specs.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/backend/api-specs.json) (186 examples in 13 controller and 5 integration specs, seed 6377), [core-specs.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/backend/core-specs.json) (200 examples in 16 model, library, service and workflow specs, seed 22912) and [email-specs.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/backend/email-specs.json) (75 examples in 6 mailer, service and subscriber specs, seed 63081).

Most examples run as the store's admin. Those that do not: 6 send no credentials and are answered 401; 12 use a staff role's permission keys, among them a role without order access, which gets only the stock counters, a role without any settings permission, which reads the store and cannot update it, and roles refused the dimensions, filters and records they may not read; and 21 use a secret key's scopes, among them `read_reports` reading saved reports but needing `write_reports` to create one, and keys without the settings or email templates scope refused.

| Endpoint or model | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Reporting: query, schema and saved reports | `reporting_controller_spec.rb` (20), `reporting/saved_reports_controller_spec.rb` (8), `reporting_spec.rb` (1), `reporting/saved_reports_spec.rb` (3); `query_spec.rb` (109), `schema_spec.rb` (6), `registry_spec.rb` (13), `saved_report_spec.rb` (4), `seeds/saved_reports_spec.rb` (4) | A channel filter from another store answers 404, and the query never counts other stores or other currencies; a role is refused dimensions and filters whose subject it cannot read, and the schema leaves them out; a secret key needs each member's scope; another store's saved report answers 404, and a built-in one cannot be edited; a range too wide for its grain is refused, naming a coarser grain |
| Dashboard counters | `dashboard_controller_spec.rb` (8), `counters_spec.rb` (16) | Counts narrow to a channel, and a channel of another store is refused; a role without order access gets only the stock counters; a key with the dashboard scope alone gets an empty list, not counts over data it cannot read |
| Exports, the report export among them | `exports_controller_spec.rb` (32), `exports_spec.rb` (5), `exports/report_spec.rb` (7) | Other stores' exports are not listed; a report export refuses a member the requesting user may not read and gates on the reports scope; secret keys are gated per export type |
| The store and its email settings | `store_controller_spec.rb` (51), `store_spec.rb` (4), `emails/branding_spec.rb` (6) | A staffer without settings permission reads and cannot update; a key needs the settings scope to write; a branding value that is not a colour or a known font is refused |
| Email templates, drafts, publications, previews, test emails, sample records, revisions and restorations | `email_templates_controller_spec.rb` (10), the seven `email_templates/*_controller_spec.rb` (30), `email_templates_spec.rb` (14); `email_template_spec.rb` (4), `email_templates/preview_spec.rb` (7), the five workflow specs (22), `email_template_mailer_spec.rb` (2) | Another store's version and revision are never read or restored; a key without the email templates scope is refused; a staffer without it cannot read the history; a stale save or publish answers 409 naming who saved last; a draft that does not render is refused with each problem and its line; a preview or sample that shows records the caller may not read is refused; a secret key cannot send a test email |
| Customer emails | `order_mailer_spec.rb` (35), `customer_mailer_spec.rb` (5), `rendered_emails_spec.rb` (2), `samples_spec.rb` (6), `order_email_subscriber_spec.rb` (23), `customer_email_subscriber_spec.rb` (4) | The emails render in the store's language with a subject and both parts; the subscribers send them on their events |

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends, as a staff token, the requests §3.1's roles could make or were shown the controls for: support's and the merchandiser's reads of the figures, counters and reports; the analyst's save; the store settings role's reads of the templates; and the email editor's and viewer's writes to the store. Two answers were seen in this run, through the screens or the Admin API, and are evidence, not spec results: the analyst's save answered 403 "Missing permission: write_reports" (SD-56), and a report export answered 201 for the report builder and 403 for the analyst ([report-export-by-role.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/report-export-by-role.json)). The rest is proposed to join G-11 for the platform batch's step P12, as G-91 and G-95 did; the owner decides (G-103).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open; ISO-7 concerns the reports' customer totals. The batch captures the test servers' own store, and claims nothing about other stores.

Spree's specs in §3.2 that touch store boundaries (another store's channel, saved report, export, template version and revision, and the query's scoping by store) are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the batch claims nothing about isolation from them. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

`compare-batch-11.spec.ts` puts each story beside the same component on the running screen, in light and dark, and records both images side by side and the computed styles of every distinct element on both sides. The reporting cases ran on the browser-test server, and the email template cases on the emails gem's test app. 30 cases, 60 comparisons, all completed. The comparison is diagnostic: it informs the review of the images and does not decide it.

### 4.1 Results

| Case | Inventory ID | Elements compared | Differences | Why |
|---|---|---|---|---|
| b11-chart-this-period | CMP-DUI-P-10 | 43 | None | |
| b11-code-editor-template | CMP-DUI-P-12 | 21 | None | |
| b11-code-editor-suggesting-variables | CMP-DUI-P-12 | 5 | A detail line only on the screen | The data: one of Spree's variables carries a description, the story's invented ones do not |
| b11-date-range-picker-last-30-days, -open | CMP-DUI-P-19 | 5, 30 | None | |
| b11-emails-tabs-settings, -templates | CMP-DA-G-08 | 2, 2 | None | |
| b11-history-sheet-empty | CMP-DA-G-08 | 10 | The close button's border and ring | Focus: the story's sheet opens with focus on its close button, drawing the ring; the screen's was opened with the pointer |
| b11-preview-card-email, -phone, -plain-text | CMP-DA-G-08 | 20, 20, 19 | The card's height, 732 against 723 pixels | What holds it: everything inside the card measures the same; the screen's side column stretches the card to its height |
| b11-preview-card-order-email, -layout, -choosing-order | CMP-DA-G-08 | 28, 28, 7 | None | |
| b11-problems-alert-on-a-line | CMP-DA-G-08 | 8 | None | |
| b11-variables-card-password-reset, -order-confirmation, -layout | CMP-DA-G-08 | 11 each | None | |
| b11-growth-badge-new | CMP-DA-G-17 | 1 | None | |
| b11-report-builder-new-report, -grouped-by-channel | CMP-DA-G-17 | 26, 29 | None | |
| b11-report-view-compared | CMP-DA-G-17 | 73 | The growth badges, and one icon's colour | The data: the screen's days have no orders before them, so they read unchanged, with a muted minus; the story's rise and fall |
| b11-report-view-ranked | CMP-DA-G-17 | 21 | The table's height | The data: one channel sold on the screen, several in the story |
| b11-report-view-empty, -refused, -totals | CMP-DA-G-17 | 8, 9, 6 | None | |
| b11-save-report-dialog-save, -refused | CMP-DA-G-17 | 18, 20 | None | |
| b11-save-report-dialog-name-missing | CMP-DA-G-17 | 19 | The Save button's background | The pointer: the screen's script clicked Save and left the pointer on it, which draws the hover colour |

Each difference is the same in both themes.

### 4.2 Earlier stories

The channel select's "All channels" story, left uncompared by batch 8 (G-88), was compared beside the home page's channel filter: 5 elements, no difference in either theme. It leaves G-88.

### 4.3 Corrections

None. No story was corrected after the comparison.

## 5. Behaviour found, recorded and not changed

Recorded as Spree's behaviour, and not changed. Six were brought to the owner as candidate existing defects, numbered from the register through the audit thread, unfixed and not reported to Spree, by the owner's standing instruction. The owner approved SD-53 as Medium and the other five as Low on 2026-11-10, with every fix deferred until after the baseline (§14).

| # | What | Where | Evidence |
|---|---|---|---|
| SD-51 | The "Payments to collect" count reads 2, and its link lists 3 orders: the count leaves out the canceled order, and the list's filter does not | DA-HOME-01's operations card | [count-payments-to-collect](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/count-payments-to-collect.webp), operations-counts.json |
| SD-52 | The report export email says to use the link below, and has no link to the file | EM-S-05 for a report export | 6-export-email, em-s-05.html |
| SD-53 | A role with `dashboard` and without `reports` sees "Reports are unavailable for your role" in place of the whole home page, the operations counts included | DA-HOME-01 for support and the merchandiser | DA-HOME-01 unavailable |
| SD-54 | The save dialog shows the raw "Too small: expected string to have >=1 characters" when no name is given | DA-RPT-02 and DA-RPT-03's save dialog | DA-RPT-02 save-name-missing |
| SD-55 | A report that fails to load reads "Loading…" without end | DA-RPT-03, seen on support's direct visit | DA-RPT-03 direct-visit (support) |
| SD-56 | Save is offered to a role that may only read reports, and the server refuses it with 403 "Missing permission: write_reports" | DA-RPT-02 for the analyst | DA-RPT-02 save-refused-by-server (analyst) |

Their entries, with the approved severities, are in [LIQ-004's existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline).

**Other behaviours, recorded only.** The owner kept them on 2026-11-10 as observations for later product review, without approving them as correct (§14).
- B1. The home page's figure tiles truncate a long amount ("$6,214....") at 1280 pixels.
- B2. The rankings card's tabs clip "Sellers" at 1280 pixels.
- B3. A report link whose `?query=` holds raw JSON instead of the encoded string breaks the page.
- B4. The interval select shows the raw value "hour" when a range does not offer it (DA-RPT-02 grain-not-offered), and a year by day draws 366 rows.
- B5. The date range picker has no half-chosen state: one click on a complete range moves its start.
- B6. Liquid keywords have low contrast in the code editor's dark theme.
- B7. The email template screens refuse the store settings role with messages that differ from screen to screen.
- B8. An invalid sender address is stopped only by the browser's own check on DA-SET-03, before the request.
- B9. On a production storefront build, `/dev/emails` answers 200 with the not-found page.
- B10. The built-in "Failed payments" report reads "Could not load this report. Missing permission: read_settings" for the analyst.
- B11. DA-SET-03 keeps its Save for the email editor and viewer, who may only read settings.
- B12. On the browser-test server, a direct visit to DA-SET-05 reads "Couldn't load email templates, record not found", since that server does not load the emails gem (§6).
- B13. The report export's CSV leaves out the screen's rank and Change columns; the figures match (§8).
- B14. The multi-seller order confirmation cannot be previewed on the test app: "There is no order group in this store to preview this email with yet."

## 6. Corrections

**To LIQ-008.** The work item's §2.7 second point was confirmed on the running stack: the home page's figures come from the reporting endpoint, which needs `reports`, and when it refuses, the page shows "unavailable" in place of everything. LIQ-008's DA-HOME-01 row now names `dashboard` for the operations counts and `reports` for the figures, with SD-53.

**To the work item,** recorded in its status, without changing the proposal's text:
- §2.7's first point was confirmed: the browser-test server lists no email templates (DA-SET-04 empty), and a direct visit to DA-SET-05 there finds none (B12). DA-SET-04 and DA-SET-05 with their content were captured on the emails gem's test app.
- §2.2's report builder role was given read on orders, and its report export was accepted, so SD-28 does not apply to report exports (corrected 2026-11-09).
- DA-HOME-01's growth up and down: the test data has no orders in any period before, so every figure reads New or unchanged. The growth badge's stories draw both, checked against their source.
- DA-HOME-01's low stock turned off was not captured; the operations card is captured with its counters, failing and with nothing visible.
- DA-SET-04's "other languages" and "updated by Spree" badges need a second language and a default changed by Spree after a store customized it, which the test app does not have; DA-SET-05's second language, its compare with default dialog and the revert for every language need the same. The default diff dialog's stories draw it.
- DA-SET-05's draft discarded, the preview needing a permission and the logo uploaded and removed on DA-SET-03 were not captured; the logo saved is in fl-18 a1, and Spree's "uploads the email logo, then removes it" covers the rest.

## 7. Gaps

| Gap | What | Kind | Proposed answer | Status |
|---|---|---|---|---|
| **G-100** | 12 home, report and email template behaviours no browser test drives (§2.3) | Function | Defer to a further browser-test step in the platform batch, as G-87, G-90 and G-92 propose | DEFERRED on 2026-11-10 to the batch 11 verification work item (§14) |
| **G-101** | 58 of the batch's 87 stories not compared by the script: 27 seen in a capture or a flow script's images, and 31 checked against their source only ([image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md)) | Coverage | Defer, as G-88 and G-93: each story keeps the comparison status the image review list gives it, and the later batch whose running screen first shows the state compares it, under the [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) | ACCEPTED on 2026-11-10 (§14) |
| **G-102** | 16 states reached by answering a request in the browser (§2.1) | Coverage | Accept as simulated interface-state coverage only, as G-89 and G-94 | ACCEPTED on 2026-11-10 (§14) |
| **G-103** | What the server answers to the requests support, the merchandiser, the analyst, the store settings role and the email editor and viewer could make or were shown the controls for (§3.1, §3.2) | Function | Join G-11, for the platform batch's step P12, as G-91 and G-95 did; the owner decides | LINKED to G-11 on 2026-11-10, and open (§14) |
| **G-104** | DA-SET-04 and DA-SET-05 with their content were captured on the emails gem's test app, not the browser-test server, which does not load the emails gem (§6) | Coverage | Close with G-16, when whether a Liquorify store loads the emails gem is decided | ACCEPTED on 2026-11-10 within its documented limits (§14) |

G-88 loses the channel select's "All channels" story (§4.2). Whether Spree sends each email on a Liquorify store, and through which mail service, stays with G-16 and G-77 (§9).

## 8. Settings and figures checked where they take effect (criterion 16)

| What | Saved or read | Where it takes effect | Result |
|---|---|---|---|
| A published template change | The password reset's subject and body changed on DA-SET-05, saved as a draft, then published; then reverted | The password reset Spree sent for a Store API request on the emails gem's test app | PASS. With the draft only, the sent email had no change (fl-18 b2); after publishing, the subject read "Shop Password Reset Instructions (FL-18)" and the body held the change (b5); after reverting, the default again (b13). The history, a restore and the conflict dialog "Someone else saved this draft" were shown on the way (b6 to b10) |
| A test email | Sent from DA-SET-05 with the draft | The mail folder | PASS: "[Test] Shop Password Reset Instructions (FL-18)", to the signed-in admin, with the draft's change (b3) |
| The branding and logo | Accent colour `#0B6E4F` and a logo saved on DA-SET-03 | The branding preview, the editor's preview and the sent email | PASS: both previews (a1, a2) and every sent email (a3, b5, c2) show the accent and the logo |
| The sender and support addresses | `orders@fl-18.example.com` and `help@fl-18.example.com` saved on DA-SET-03 | The sent email's sender and footer | PASS: every sent email is from the sender, and the password reset's footer names the support address |
| The new order notification address, and customer emails turned off | `ops@fl-18.example.com` saved; then customer emails turned off | The emails sent for orders placed on the test app | PASS: R1007's notification went to the address, with the branded order confirmation to the customer (c1, c2). With customer emails off, R1008 sent the notification and no order email to the customer, and a password reset request sent none (c3). Every setting was put back afterwards |
| The home page's figures | Total sales and orders read from the tiles for the last 30 days, for all channels, Online Store and Wholesale, and for the last 7 days | The completed orders the Admin API lists for the same range, channel and currency | PASS: 16 orders and $6,214.22 for all channels and Online Store, 0 for Wholesale, and the 7 days alike, each matched order by order ([home-figures.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/home-figures.json)) |
| A report's figures and its CSV | The built-in "Sales by channel" and FL-22's saved report | The same orders; the exported CSV | PASS: both reports read 16 orders and $6,214.22 on Online Store, matching the orders; the CSV holds the same figures, without the screen's rank and Change columns (B13) |
| The operations counts | Each of the seven counts | The list its link opens | Six match. Payments to collect counts 2 and lists 3 (SD-51) ([operations-counts.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/fl-22/operations-counts.json)) |

The template and email checks ran on the emails gem's test app with its mail written to a folder; the figures and counts on the browser-test server. These are evidence, not browser tests.

## 9. Emails (criterion 17)

| Emails | Rendered by | This batch |
|---|---|---|
| EM-C-01 | Batch 9 | Shown in the editor's preview (DA-SET-05 email-order-group-confirmation, for the multi-seller version, which has nothing to preview with, B14) |
| EM-C-02, EM-C-03, EM-C-07, EM-O-01 | Batch 8, part 1 | EM-C-02, EM-C-03 and EM-C-07 shown in the editor's preview (order-confirmation, email-payment-link, email-order-canceled); EM-C-02 and EM-O-01 read as sent (§8) |
| EM-C-05, EM-C-06 | Batch 8, part 2 | Shown in the editor's preview (email-fulfilled, email-return-refunded) |
| EM-C-08 | The shopper accounts batch | Shown in the editor's preview (default), and sent with a published change (§8) |
| EM-C-09, EM-C-10 | Batch 10 | Shown in the editor's preview (email-data-export, email-newsletter-confirmation) |
| EM-C-11 | Batch 12 | Shown in the editor's preview (email-company-invitation) |
| EM-C-04, EM-O-02 to EM-O-05, EM-S-02 | Batch 13 | EM-C-04 shown in the editor's preview (email-files-ready) |
| EM-S-01, EM-S-03, EM-S-04 | Staff access, part 1 | Mapped |
| EM-S-05, EM-S-06 | Catalog and pricing, part 2 | EM-S-05 read as sent for a report export (SD-52) |
| EM-S-07 | Developer and integration settings (batch 2) | Mapped |
| EM-SF-01 to EM-SF-04 | Batches 9 and 8, and the shopper accounts batch | Shown on SF-DEV-02, as HTML and text |

The editor's preview renders a template with Spree's sample data or a chosen record, which is not the same as Spree sending it. Spree's specs for the mailers and subscribers pass (§3.2). The previews request their fonts from Google's font service, which this session's network blocks, so they draw fallback fonts (§11). Whether Spree sends each email on a Liquorify store, and through which mail service, stays with G-16 and G-77.

## 10. CI runs and local checks

**CI.** The runs on the final commit, the visual check twice, once from the pull request and once started by hand, each in its four parts, with Tests and Packages, are named in the merge record, as criterion 8 asks. If any of them fails, nothing is merged. Runs on earlier commits are not counted. The Packages workflow runs Spree's dashboard browser tests in four shards, among them `home-dashboard.spec.ts`, `reports.spec.ts` and `store-settings.spec.ts` (§2.2).

The visual check stays advisory. CI does not run the capture, comparison or flow scripts, which were run locally.

**Local checks, in this session.** On the branch's working tree, lint (Biome), the package's type check, the 82 fixture tests, the token check and the coverage report passed. The Storybook built, and in the pinned image the visual check wrote the batch's 174 reference images; the pull request changes no earlier image. A full local run of the visual check over every story is recorded in the evidence index. Every evidence image was converted to lossless WebP and checked equal to its capture, pixel for pixel: 352 converted, none differs. Criterion 14's search covered every line the pull request adds; it found one machine path, the gem path of the integration specs in `api-specs.json`, which was replaced by each example's own spec file, the local address left in three sent emails' reset links, replaced by `<store-url>`, and the logo's signed storage addresses in the six sent emails, replaced by `…`. The links in the changed records were checked.

## 11. Limitations

- Coverage is not function. A capture shows that a state exists on the running screen; the 12 behaviours of §2.3 are not functionally verified.
- What the interface shows each role is not what the server allows (§3.1, §3.2). The narrower roles' requests were not sent, apart from the two answers named in §3.2 (G-103).
- The template screens with content ran on the emails gem's test app, which only has English and Spree's own defaults (§6, G-104).
- The orders behind the figures were made and completed through the Admin API and Spree's sample data; none was placed on the storefront in this run. No orders fall in any period before, so no growth up or down was seen.
- The email previews drew fallback fonts, since Google's font service was blocked (4 to 8 blocked requests per capture).
- The emails were read from mail folders; no mail service was used.
- Spree's specs ran on SQLite.
- Tenant isolation is NOT_RUN (§3.3).

## 12. Evidence

The [evidence index](evidence/2026-11-10-fb-19-batch-home-reports-and-emails/README.md) lists every capture, comparison, flow image, email and spec result, with how each was made.

## 13. Delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-10 |
| Accepted by | Claude, in the thread for batch 11 |
| Revision | #89's final commit, named in the merge record |
| Scope | Criterion 11: the 174 reference images of the [image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md), each looked at in light and dark; the running-screen evidence of §2 and §3.1; and fidelity, judged from the comparison of §4, 29 cases and 1 earlier story with every difference explained. Technical acceptance of criteria 1 to 10 and 12 to 17 as this record gives them, with criterion 8 as the merge record gives it |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status the owner has not decided. The owner's answers of 2026-11-10 are the owner's (§14), not part of this acceptance: G-100 and G-103 stay open, and G-101, G-102 and G-104 are accepted only as §14 records. SD-51 to SD-56 stay open with the severities the owner approved. B1 to B14 stay observations, not approved as correct. Tenant isolation stays NOT_RUN (§3.3), ISO-1 to ISO-7 stay open, and FB-03's result stays with the owner |

What the checks did not show stays as §11 states it.

## 14. The owner's answers, 2026-11-10

The owner answered the batch's defects, gaps and recorded behaviours on 2026-11-10, in the project chat, and asked for #89 to be merged under the delegation once its checks pass. They are the owner's answers, recorded here as given; nothing in them marks an unverified behaviour PASS.

| Item | The owner's answer | Where it is recorded |
|---|---|---|
| SD-53 | Approved as Medium. Kept open, with the fix deferred until after the baseline | [LIQ-004's existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) |
| SD-51, SD-52, SD-54, SD-55, SD-56 | Approved as Low. Kept open, with the fixes deferred until after the baseline | The same |
| All six | When the interface is later corrected, the server's permissions stay as they are | The same, in each entry's follow-up |
| G-100 | Deferred to one bounded batch 11 verification work item. It records each of the 12 behaviours' expected result and closure condition before anything is built, and keeps any failure a known defect causes as that defect's failing part | LIQ-004's gap register; the work item follows this pull request |
| G-101 | Deferral to the comparison follow-up accepted. Each remaining story is listed with its destination, and the states of §6 no capture shows are accounted for, with their actual coverage | [Image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md#remaining-stories-and-their-destinations) |
| G-102 | The 16 states accepted as simulated interface-state coverage only | LIQ-004's gap register |
| G-103 | Linked to G-11. The batch 11 verification work item gets its own permission-check section, recording each expected refusal and each control that should succeed before it runs. P12's recorded scope is unchanged | The same |
| G-104 | The captures on the emails gem's test app accepted within their documented limits. Verification on the chosen host is deferred to G-16 and G-77's email integration work, with template rendering, application integration and delivery through a mail service recorded separately. This does not choose Liquorify's production email architecture | The same |
| B1 to B14 | Kept as observations for later product review, without approving them as correct | §5 |
