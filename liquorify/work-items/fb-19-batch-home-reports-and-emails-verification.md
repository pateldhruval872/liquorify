---
title: FB-19 batch 11 verification, home figures, reports and emails
record: work item
work_item: FB-19
status: DONE
owner: the owner reviews and accepts; an automated Claude session implements, under the owner's delegation of 2026-11-04
created: 2026-11-10
updated: 2026-11-10
---

# FB-19 batch 11 verification: home figures, reports and emails

**Status.** DONE on 2026-11-10 ([verification record](../verification/2026-11-10-fb-19-batch-home-reports-and-emails-verification.md)): G-100 closed, with behaviours 10 and 12 keeping SD-52's and SD-51's failing parts; G-103's 28 answers recorded, 26 as expected and two recorded as G-117 at the owner's choice; 43 of the 54 stories sent here compared. IN PROGRESS from 2026-11-10 (§7 was settled and committed before any test was written). PROPOSED on 2026-11-10, at the owner's answer of the same day to G-100 and G-103 ([batch 11 record §14](../verification/2026-11-10-fb-19-batch-home-reports-and-emails.md#14-the-owners-answers-2026-11-10)). It is bounded to batch 11's screens. Each expected result and closure condition below is recorded before anything is built, as the owner asked. Nothing here changes Spree's code or the storefront, and nothing in it marks an unverified behaviour PASS before its evidence exists.

## 1. Outcome

Two things batch 11 showed only by scripts or by the interface are verified at a recorded revision:

- **The 12 behaviours of G-100** ([record §2.3](../verification/2026-11-10-fb-19-batch-home-reports-and-emails.md#23-behaviours-no-browser-test-drives-criterion-15)), each driven by a browser test in `packages/liquorify-storybook/` against Spree's built dashboard and the test servers batch 11 used, with its expected result asserted.
- **The permission checks of G-103** (§4): each request the narrower roles could make or were shown the controls for, sent with that role's token, with the answer compared with the expected one.

It also compares the remaining stories its runs reach, as the [image review list](../verification/2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md#remaining-stories-and-their-destinations) names them, and captures the states of batch 11's §6 that its runs reach.

## 2. Rules

- A failure that a known defect causes is kept as that defect's failing part, and the behaviour is recorded as FAIL with the defect's number. It is not worked around, retried until it passes, or counted as PASS. The known defects are SD-51 to SD-56, SD-17 and SD-28.
- A behaviour closes only when its closure condition (§3) is met at the recorded revision, by passing evidence. A closed behaviour leaves G-100; G-100 closes when all 12 have.
- A permission check (§4) passes only when the answer matches the expected status and, for a refusal, the expected error. A different answer is recorded as found, and a refusal the interface did not hint at, or a success the interface hid, is brought to the owner. A new tenant-isolation defect is reported privately and not published while it is open.
- Tenant isolation stays NOT_RUN: no check reads or writes another store's records. P12's recorded scope is unchanged; G-103 stays linked to G-11.
- The browser tests are this work item's evidence. Whether they join Spree's own dashboard browser tests is not decided here.

## 3. The 12 behaviours

| # | Behaviour | Expected result | Closure condition |
|---|---|---|---|
| 1 | Editing a template, with the leave confirmation | On DA-SET-05, typing in the editor marks it unsaved; leaving asks to confirm; Stay keeps the text, Leave discards it and the template reads as before | A test asserts each of the three, on the emails gem's test app |
| 2 | Saving a draft, which does not reach customers | Save draft shows the draft badge; a password reset requested through the Store API is sent with the published text, not the draft's | A test asserts the badge and reads the sent email from the mail folder |
| 3 | Sending a test email | Send test email shows its toast; the mail folder holds one email to the signed-in admin whose subject starts "[Test]" and holds the draft's change | A test asserts the toast and reads the email |
| 4 | Publishing, and the change reaching customers | Publish clears the draft badge; the next password reset is sent with the change | A test asserts the badge and reads the sent email |
| 5 | The history, and restoring a version | The history lists the published version as Latest; restoring an earlier one asks to confirm and loads it as a draft | A test asserts the list, the confirmation and the draft's text |
| 6 | The conflict when another editor saved first | After a second save through the Admin API, saving shows "Someone else saved this draft"; choosing their version loads it | A test asserts the dialog and the loaded text |
| 7 | Reverting to Spree's default | Revert asks to confirm; afterwards the editor shows the default and the next password reset is sent with the default | A test asserts the confirmation, the editor and the sent email |
| 8 | Choosing a record for the preview, and inserting a variable | Choosing an order re-renders the preview with that order's number; inserting a variable puts its Liquid tag at the cursor | A test asserts the order number in the preview and the inserted tag |
| 9 | The templates list | DA-SET-04 lists the eleven customer emails and the layout, each opening its editor, and a customized one carries its badge | A test asserts the list, one opened editor and the badge after FL-18's change |
| 10 | Exporting a report, and its email | Export CSV shows its toast; the mail folder holds EM-S-05 within a minute. The email has no link to the file (SD-52): this part is recorded as FAIL on SD-52, and the file's figures are asserted against the report | A test asserts the toast, the email's arrival and the CSV's figures; the missing link stays SD-52's failing part |
| 11 | Saving a copy of a built-in report, and searching and sorting the reports list | Save a copy creates a saved report with the given name that opens with the built-in's figures; search narrows the list to matching names; sorting by name orders it | A test asserts each |
| 12 | The home page's date range, rankings tabs and operations links | A preset and a custom range change the figures to the Admin API's for that range; each rankings tab the role may read shows its list; each operations link opens a list whose count matches the card. Payments to collect does not match (SD-51): that link is recorded as FAIL on SD-51 | A test asserts each range against the Admin API, each tab, and each link's count; the Payments to collect mismatch stays SD-51's failing part |

## 4. Permission checks (G-103)

Each request is sent with the role's own token on the browser-test server, or on the emails gem's test app for the email template endpoints, to the store's own records only. The roles are batch 11's, created by `staff.ts`. The expected answers are read from Spree's permission catalog (`spree/core/lib/spree/core/permissions/default_catalog.rb`) and the endpoints' checks at `main`, and are recorded here before any request is sent.

| Role | Request | Expected answer |
|---|---|---|
| Support (`read_orders`, `read_customers`, `read_dashboard`) | `GET /api/v3/admin/dashboard/counters` | 200, with the order counters and without the stock counters it may not read |
| Support | `POST /api/v3/admin/reporting/query` (total sales, last 30 days) | 403, access denied (SD-53's cause) |
| Support | `GET /api/v3/admin/reporting/saved_reports` | 403, access denied |
| Merchandiser (`write_products`, `write_categories`, `write_collections`, `write_stock`) | `GET /api/v3/admin/dashboard/counters` | 403, access denied: the role holds no `dashboard` scope |
| Merchandiser | `POST /api/v3/admin/reporting/query` | 403, access denied |
| Analyst (`read_dashboard`, `read_reports`, `read_products`, `read_categories`, `read_customers`) | `POST /api/v3/admin/reporting/query` (total sales by channel) | 200 |
| Analyst | `POST /api/v3/admin/reporting/saved_reports` | 403, "Missing permission: write_reports" (SD-56) |
| Analyst | `PATCH` and `DELETE /api/v3/admin/reporting/saved_reports/{id}` | 403, access denied |
| Analyst | `POST /api/v3/admin/exports` (a report) | 403, access denied, as batch 11 saw |
| Report builder (`read_dashboard`, `write_reports`, `read_orders`) | `POST`, `PATCH` and `DELETE` on saved reports | 201, 200 and 204 |
| Report builder | `POST /api/v3/admin/exports` (a report) | 201, as batch 11 saw |
| Report builder | `POST /api/v3/admin/reporting/query` grouped by product | 403, access denied: the role may not read products |
| Store settings (`write_settings`) | `PATCH /api/v3/admin/store` (the sender address) | 200 |
| Store settings | `GET /api/v3/admin/email_templates` | 403, access denied |
| Email editor (`read_settings`, `write_email_templates`) | `PATCH /api/v3/admin/store` (the sender address) | 403, access denied (B11's Save) |
| Email editor | `PUT` a draft, `POST` a publication and a test email | 200, 201 and 201 or 202, as Spree's specs give them |
| Email viewer (`read_settings`, `read_email_templates`) | `GET /api/v3/admin/email_templates` and a template's revisions | 200 |
| Email viewer | `PATCH /api/v3/admin/store` | 403, access denied (B11's Save) |
| Email viewer | `PUT` a draft, `POST` a preview, a publication and a test email | 403, access denied: each needs update on email templates |

The exact success codes for the email editor's writes are taken from Spree's controller specs before the run and written into the test; the expected refusals above do not change.

## 5. Acceptance criteria

| # | Criterion | Evidence |
|---|---|---|
| 1 | Each of the 12 behaviours is driven by a browser test at a recorded revision, with its expected result asserted; each is PASS, or FAIL with a known defect's number | The run, with its result per behaviour |
| 2 | Each permission check is sent and its answer recorded beside the expected one | The answers, per role and request |
| 3 | The stories and §6 states the runs reach are compared or captured, and the rest keep their recorded coverage | Comparison images and captures, with the image review list updated |
| 4 | Spree's code, the storefront and every workflow outside Storybook are unchanged; no credential, personal data or machine path is committed | The pull request's file list and the search before each push |
| 5 | The records are updated: a verification record, LIQ-004's G-100 and G-103 rows, and the README index | The pull request |
| 6 | Tenant isolation stays NOT_RUN, and no check reads or writes another store's records | The record's isolation section |

## 6. Size and risk

About 12 browser tests in one file per screen group, one permission script of about 30 requests, and their records. Low risk: test and record files only, run against local test servers.

## 7. Settled before the run

Committed on 2026-11-10 before any test of this work item was written or run, so the expected answers cannot follow the results. Nothing in §3 or §4 changes; this section only pins what they left to be read from Spree's code.

**The email editor's success codes,** from Spree's controller specs at `main` (`spree/api/spec/controllers/spree/api/v3/admin/email_templates/`): saving a draft (`PUT …/draft`) answers 200, a publication (`POST …/publication`) 201, and a test email (`POST …/test_email`) 202. A preview (`POST …/preview`), which §4 expects the email viewer to be refused, answers 200 to a caller allowed to make it. The test asserts these four codes.

**The roles the run signs in with** are the ones `staff.ts` creates, unchanged. One differs from §4's list: the analyst also holds `read_orders`, as batch 11's captures used it. No expected answer in §4 depends on it, so none changes; the record names the role's actual keys.

**Where each request goes.** The reporting, saved report, export, counter and store requests go to the browser-test server, and every change they make is undone: the saved reports the report builder creates are deleted, and the sender address the store settings role saves is put back. The email template requests go to the emails gem's test app, and the drafts and publications they make are reverted to Spree's default at the end. Each request names the store it is sent for in `X-Spree-Store-Id`, and no request names another store.

**What each behaviour test asserts,** as §3 gives it:

| # | The assertions |
|---|---|
| 1 | After typing, "Unsaved changes" shows. Back opens "Leave without saving?". Stay closes it with the typed text still in the editor. Leave returns to the templates list, and the template opened again shows no "Unsaved changes" and not the typed text |
| 2 | Save draft shows "Draft saved" and the "Draft" badge. A password reset requested through the Store API is read from the mail folder, and its body does not hold the draft's text |
| 3 | Send test email shows "Test email sent to" the admin's address. The admin's mail folder holds one more email, whose subject starts "[Test]" and whose body holds the draft's text |
| 4 | Publish shows "Published." and the "Draft" badge is gone. The next password reset holds the change |
| 5 | The History sheet lists the published version marked "Latest". Restore opens "Restore this version?"; confirming shows "Version restored into the draft", the "Draft" badge, and the restored version's text in the editor |
| 6 | After a second save through the Admin API, as another editor's, Save draft shows "Someone else saved this draft"; "Load their version" puts their subject in the editor |
| 7 | Revert to default opens "Revert to Spree's default?"; confirming shows "Reverted to Spree's default", the editor holds Spree's default subject, and the next password reset holds neither change |
| 8 | Choosing a completed order in "Preview with record" shows "Subject:" with that order's number. Clicking a variable's insert button puts its Liquid tag in the editor where the cursor was, and shows "Unsaved changes" |
| 9 | DA-SET-04 lists the eleven customer emails of `Spree.editable_email_templates` and the email layout, each opening its editor; after behaviour 4's publish the password reset row carries "Customized" |
| 10 | Export CSV shows "Export downloaded"; EM-S-05 reaches the admin's mail folder within 60 seconds; the CSV's rows match the report's rows on screen. A check that the email links to the file is kept and fails on SD-52 |
| 11 | Save a copy, with a new name, opens a saved report under that name whose figures equal the built-in's; a search narrows the list to names that match; sorting by name puts the rows in name order |
| 12 | Last 7 days and a custom range each set total sales and orders to what the Admin API's completed orders give for the range the page sends. Each rankings tab shows its list or its empty message. Each operations link opens a list whose count equals the card's. Payments to collect's check is kept and fails on SD-51 |

**Showing that each test fails when it should.** As P11 did, a run with `B11_SABOTAGE=1` marks every behaviour test and permission check as expected to fail, and makes each look for something that is not there at its first key check. That run passes only if every test fails, and each failure is read to confirm it came from that check.
