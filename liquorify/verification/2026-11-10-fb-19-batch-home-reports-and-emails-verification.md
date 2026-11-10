---
title: FB-19 batch 11 verification, home figures, reports and emails (G-100, G-103)
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session, thread "Verify batch 11 behaviours"); not independent review
result: G-100's 12 behaviours each have a browser test, run twice in a row on freshly started servers in the pinned Playwright image at `d78e0491`, with the same results both times. Ten pass. Behaviour 10 fails only at its SD-52 check and behaviour 12 only at its SD-51 check, as the work item expected, so all 12 meet their closure conditions and G-100 closes. G-103's 28 permission checks were sent with each role's own token. 26 answered as recorded before the run. The analyst's rename and delete of a saved report were refused and left the report unchanged, but with 404 "not found" where 403 "access denied" was recorded; the owner chose on 2026-11-10 to keep both checks failing and record the difference as G-117. G-103 stays linked to G-11, with P12's scope unchanged. 45 comparison cases ran in light and dark, which compare 43 of the 54 stories the image review list sent here. Each test was shown to fail when what it checks does not happen. Tenant isolation stays NOT_RUN
---

# FB-19 batch 11 verification: home figures, reports and emails (G-100, G-103)

**Claim.** This record carries out the [batch 11 verification work item](../work-items/fb-19-batch-home-reports-and-emails-verification.md). The owner created it on 2026-11-10 by deferring G-100 and adding G-103's permission checks to it ([batch 11 record §14](2026-11-10-fb-19-batch-home-reports-and-emails.md#14-the-owners-answers-2026-11-10)). Each expected result, closure condition and permission answer was committed in the work item's §3, §4 and §7 before any test was written (`fa11abee`).

The tests are Liquorify's own scripts in `packages/liquorify-storybook/fidelity/`:

- `b11-email-behaviours.spec.ts` covers behaviours 1 to 9, on the emails gem's test app.
- `b11-report-behaviours.spec.ts` covers behaviours 10 to 12, on the browser-test server.
- `b11-permissions.spec.ts` sends G-103's 28 requests.
- `compare-batch-11-verification.spec.ts` holds the comparison cases.
- `b11.ts` holds what they share. `reporting.ts` holds the reporting helpers, moved out of `fl-22.spec.ts`, which now imports them.

None of this changes Spree's code, Spree's tests, the storefront or a workflow.

**Results against the work item's acceptance criteria.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each behaviour driven by a browser test at a recorded revision; PASS, or FAIL with a known defect's number | PASS. 10 PASS; 10 FAIL on SD-52 and 12 FAIL on SD-51, each only at that defect's check, in both runs (§2) |
| 2 | Each permission check sent and its answer recorded beside the expected one | PASS: 28 sent and recorded, 26 as expected, 2 different and kept failing as G-117 (§3) |
| 3 | The stories and §6 states the runs reach compared or captured; the rest keep their recorded coverage | PASS: 45 cases in light and dark, comparing 43 of the 54 stories the image review list sent here; the other 11 keep their coverage, each with its reason (§4) |
| 4 | Spree's code, the storefront and workflows unchanged; no credential, personal data or machine path committed | PASS: the pull request changes only `packages/liquorify-storybook/fidelity/` and `liquorify/`; every added line was searched before each push (§1) |
| 5 | The records updated | PASS: this record, LIQ-004's G-100, G-103 and G-117 rows, the work item, the image review list and the README index |
| 6 | Tenant isolation NOT_RUN; nothing reads or writes another store's records | PASS (§5) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | At `d78e0491` for both recorded runs. `d26c3e45` then changed only how the permission script is sabotaged (§1.1); the permission script was run once more after it, with the same 26 matches and the same two differences ([permissions-after-sabotage-change.txt](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/runs/permissions-after-sabotage-change.txt)). The branch was then rebased onto `main` at `a3a427fc`, which renamed its commits: `fa11abee` is now `e5ea4a10` (authored 14:17 UTC, before every test commit), `d78e0491` is `18d72f42` and `d26c3e45` is `db602fdf`. What `main` added is records and batch 10's own Storybook files, among them one more role in `staff.ts` that these tests do not use; nothing these tests run changed |
| Spree's code | As on `main`. This branch does not change it |
| Servers | As batch 11: Spree's dashboard browser-test server (`spree/api/spec/dummy`, port 3010) with its fixtures, and the emails gem's test app (`spree/emails/spec/dummy`, port 3040) with Spree's seeds, each started by its fidelity stack script and writing its mail to its own folder. Both on SQLite, with Ruby 3.3.6, in this session's cloud container |
| Data | Before each run both servers were stopped and started again: the emails app reloads its schema, and the browser-test server its fixtures. Spree's sample data was then loaded into each. On the browser-test server the sample loader stops at the sample orders, because the fixtures already hold orders R1001 and R1002; the sample catalog and customers, which the report tests use, load before that. Each test adds its own records through the Admin API, named with the run's stamp, and removes or reverts them afterwards |
| Dashboard | Spree's dashboard built with Vite and served by `vite preview`: port 5174 to the browser-test server and port 5175 to the emails app |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 960 pixels unless a case sets its window. One worker, no retries |
| Signed in as | The behaviours: the browser tests' admin on the browser-test server and the emails app's admin on the emails app. The permission checks: the roles `staff.ts` creates on each server, each with its own token |
| Requests outside | Every request that would leave the local servers was blocked and listed. The email previews ask Google's font service for fonts, as in batch 11; nothing else left |
| Runs | All on 2026-11-10 UTC: run 1 from 15:43 to 15:45, run 2 from 15:47 to 15:49, each on servers started afresh just before it, then the sabotage run and the comparisons on run 2's servers. The evidence is run 2's |
| Secrets | No token, key or password is recorded. Store identifiers are written as `<store>`, the servers' addresses as `<site>`, and machine paths are removed. Customer addresses are made up, on `example.com` |

### 1.1 Showing that each test fails when it should

With `B11_SABOTAGE=1` each behaviour test and the permission script are marked as expected to fail, and each looks for something that is not there at its first key check (work item §7). The run passes only if every test fails. Each failure was read in Playwright's JSON report ([sabotage-failures.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/runs/sabotage-failures.json)):

| # | Where it failed |
|---|---|
| 1 | "Saved changes" looked for where "Unsaved changes" shows |
| 2 | The reset email checked for the draft's marker replaced by text every email holds |
| 3 | The test email's draft text check |
| 4 | The published change looked for with a suffix nothing sent |
| 5 | Three Restore buttons looked for where two versions are listed |
| 6 | "Nobody else saved this draft" looked for |
| 7 | Spree's default subject looked for with a character added |
| 8 | An order number no record has looked for in the preview's subject |
| 9 | Twelve customer emails looked for where there are eleven |
| 10 | The toast "Export refused" looked for |
| 11 | The copy's heading looked for with a character added |
| 12 | Last 7 days' order count looked for as one more than the Admin API gives |
| Permissions | First run: only the expected list changed, so the script also failed on the two real differences. `d26c3e45` makes every check expect a status no server answers (599); the sabotaged run then lists all 28 checks as different |

## 2. Results: the 12 behaviours (G-100)

Both recorded runs at `d78e0491`. Evidence is in [`evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/`](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/): `behaviours/` holds each test's JSON and images, `runs/` the run logs.

| # | Behaviour | What the test asserted | Result | Evidence |
|---|---|---|---|---|
| 1 | Editing a template, with the leave confirmation | Typing shows "Unsaved changes"; Back opens "Leave without saving?"; Stay keeps the typed text; Leave returns to the templates list, and the template opened again holds neither the text nor the badge | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/1-editing.json), [image](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/1-leave-confirmation.webp) |
| 2 | Saving a draft, which does not reach customers | "Draft saved" and the badge "Draft — customers receive the published version"; a password reset requested through the Store API was read from the mail folder and does not hold the draft's text | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/2-draft.json) |
| 3 | Sending a test email | "Test email sent to" the admin; one more email in the admin's folder, subject "[Test] Shop Password Reset Instructions (B11 …)", holding the draft's text | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/3-test-email.json) |
| 4 | Publishing, and the change reaching customers | "Published.", the draft badge gone, and the next password reset holds the change | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/4-published.json) |
| 5 | The history, and restoring a version | Two published versions, the newer marked Latest; Restore on the earlier opens "Restore this version?"; confirming shows "Version restored into the draft", the draft badge and the earlier version's text | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/5-history.json) |
| 6 | The conflict when another editor saved first | After a second save through the Admin API, Save draft shows "Someone else saved this draft"; "Load their version" puts their subject in the editor | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/6-conflict.json) |
| 7 | Reverting to Spree's default | "Revert to Spree's default?"; confirming shows "Reverted to Spree's default", Spree's default subject, and the next password reset holds no change | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/7-reverted.json) |
| 8 | Choosing a record for the preview, and inserting a variable | Choosing order R1002 shows "Subject:" with R1002; Insert order.total puts `{{ order.total \| money }}` at the cursor and shows "Unsaved changes" | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/8-preview-and-variable.json) |
| 9 | The templates list | The eleven customer emails of `Spree.editable_email_templates` and the layout, each opening its editor; after behaviour 4's publish the password reset carries "Customized" | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/9-templates-list.json) |
| 10 | Exporting a report, and its email | "Export downloaded"; EM-S-05 in the admin's folder 2 seconds later; the CSV's rows equal the report's rows on screen. The check that the email links to the file fails | FAIL on SD-52, at that check only | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/10-export.json) |
| 11 | Saving a copy of a built-in report, and searching and sorting the list | Save a copy of "Sales by channel" opens the copy under its new name with the built-in's figures; searching "payments" leaves 3 of 21 reports, each matching; sorting by name descending and then ascending puts the rows in name order each time | PASS | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/11-copy-search-sort.json) |
| 12 | The home page's date range, rankings tabs and operations links | Last 7 days and a custom range each show the total sales and orders the Admin API's completed orders give for the range the page sent; the four rankings tabs each show their list; six of the seven operations counts equal their list's. Payments to collect shows 2 and its list holds 3 | FAIL on SD-51, at that check only | [JSON](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/behaviours/12-home.json) |

Two limits of the test data, recorded rather than worked around:

- **Behaviour 12's ranges hold the same orders.** Every completed order in the fixtures is dated today, so Last 7 days (4 to 10 November) and the custom range (2 to 10 November) both show $6,214.22 and 16 orders. Both are asserted against the Admin API for the range the page sent; neither shows a range with fewer orders. Batch 11's FL-22 checked four ranges and channels with different figures.
- **The custom range is chosen with one click.** With Last 7 days chosen, a click on a day before its start moves the start there and keeps the end, as batch 11's B5 records. Two clicks that end on the range's own end leave it unchanged, so the test uses one.

During the work two test-side errors were fixed before the recorded runs. They are recorded because they changed what the tests ask:

- Behaviour 12 first read the rankings after the custom range, which then held no orders, so every tab showed its empty message. It now reads them over the page's default range, where each tab shows its list.
- The report builder's query "grouped by product" first asked for total sales and orders. The server refuses that query as invalid (422, "cannot be grouped by product") before it checks the role, so the permission it was meant to test was never reached. It now asks for net sales, which can be split per product. The expected answer did not change.

## 3. Results: the permission checks (G-103)

Each request was sent with the role's own token, to its own server's default store. Every success was undone afterwards: the report builder's saved report deleted, the sender address put back, and the emails app's drafts and publications reverted. The full answers, with each refusal's message, are in [g-103-permissions.json](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/permissions/g-103-permissions.json).

| Role | Request | Expected | Answer | Result |
|---|---|---|---|---|
| Support | `GET /api/v3/admin/dashboard/counters` | 200, order counters, no stock counters | 200: orders to fulfill, payments to collect, open returns, exchanges and claims; no low or out of stock | As expected |
| Support | `POST /api/v3/admin/reporting/query` | 403, access denied | 403, access denied | As expected |
| Support | `GET /api/v3/admin/reporting/saved_reports` | 403, access denied | 403, access denied | As expected |
| Merchandiser | `GET /api/v3/admin/dashboard/counters` | 403, access denied | 403, access denied | As expected |
| Merchandiser | `POST /api/v3/admin/reporting/query` | 403, access denied | 403, access denied | As expected |
| Analyst | `POST /api/v3/admin/reporting/query`, total sales by channel | 200 | 200 | As expected |
| Analyst | `POST /api/v3/admin/reporting/saved_reports` | 403, "Missing permission: write_reports" | 403, "Missing permission: write_reports" | As expected |
| Analyst | `PATCH /api/v3/admin/reporting/saved_reports/{id}` | 403, access denied | **404, record not found**, "Saved report not found" | **Different: G-117** |
| Analyst | `DELETE /api/v3/admin/reporting/saved_reports/{id}` | 403, access denied | **404, record not found**, "Saved report not found" | **Different: G-117** |
| Analyst | `POST /api/v3/admin/exports`, a report | 403, access denied | 403, access denied | As expected |
| Report builder | `POST`, `PATCH` and `DELETE` on saved reports | 201, 200 and 204 | 201, 200 and 204 | As expected |
| Report builder | `POST /api/v3/admin/exports`, a report | 201 | 201 | As expected |
| Report builder | `POST /api/v3/admin/reporting/query` grouped by product | 403, access denied | 403, access denied | As expected |
| Store settings | `PATCH /api/v3/admin/store`, the sender address | 200 | 200 | As expected |
| Store settings | `GET /api/v3/admin/email_templates` | 403, access denied | 403, access denied | As expected |
| Email editor | `PATCH /api/v3/admin/store` | 403, access denied | 403, access denied | As expected |
| Email editor | `PUT` a draft, `POST` a publication and a test email | 200, 201 and 202 | 200, 201 and 202 | As expected |
| Email viewer | `GET /api/v3/admin/email_templates` and a template's revisions | 200 | 200 and 200 | As expected |
| Email viewer | `PATCH /api/v3/admin/store` | 403, access denied | 403, access denied | As expected |
| Email viewer | `PUT` a draft, `POST` a preview, a publication and a test email | 403, access denied | 403, access denied, all four | As expected |

The report builder's three saved report requests, the email editor's three writes and the email viewer's two reads and four writes are each a separate check, which makes 28.

**The two differences, G-117.** The analyst's rename and delete were both refused, and the saved report was read back afterwards unchanged, under its original name. But Spree answered 404, "Saved report not found", not 403. Spree's Admin API looks a record up within what the role may do with it, for the action asked (`Spree::Api::V3::Admin::ResourceController#scope`, `accessible_by(current_ability, ability_action_for_request)`), so a record the role may read but not change is answered as missing. This is how every Admin API record is looked up, not something special to saved reports. The work item's §2 brings a different answer to the owner; on 2026-11-10 the owner chose to keep both checks failing against the answer recorded first and to record the difference as a new gap, G-117. Nothing was changed by either request.

## 4. Comparisons and batch 11's §6 states

`compare-batch-11-verification.spec.ts` ran 43 cases in light and dark on run 2's servers, 86 comparisons, all of which captured both sides ([comparison.txt](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/runs/comparison.txt)). Two more cases, S80 and S87, were added after a check of the list and ran on the same servers, 4 comparisons ([comparison-extra.txt](evidence/2026-11-10-fb-19-batch-home-reports-and-emails-verification/runs/comparison-extra.txt)). Each case's folder under `comparison/` holds the running screen beside the story, for each theme, and every computed style that differs. Every image is lossless WebP, checked pixel for pixel against the PNG the script wrote.

### 4.1 The stories the image review list sent here

The [image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md#remaining-stories-and-their-destinations) sent 54 of its 58 remaining stories to this work item. 43 are now compared:

| Story | Case |
|---|---|
| S1 Conflict dialog: Another editor saved first | `b11v-conflict-dialog` |
| S5, S6, S7 Email preview frame: the email, at a phone's width, plain text | `b11v-email-preview-frame-desktop`, `-phone`, `-plain-text` |
| S12, S14 History sheet: for a role that may only read, published versions | `b11v-history-sheet-read-only`, `b11v-history-sheet-versions` |
| S18 Preview card: Needing a permission | `b11v-preview-card-needs-permission` |
| S26, S30 Variables card: inserting a field, for a role that may only read | `b11v-variables-card-inserting`, `b11v-variables-card-read-only` |
| S35 to S41, S43, S45, S46 Report builder: adding a filter, another family, choosing the interval, the grouping and the time range, a custom range, filtered, grouped by product, no metric, not compared | `b11v-report-builder-*` |
| S47, S49, S51, S52, S54 to S57, S59, S62, S64 Report view: another figure, by customer, five figures, by hour, by month, no orders, over time, by payment status, ranked and compared, figures alone compared, by week | `b11v-report-view-*` |
| S66, S67 Report workspace: a new report, a ranking | `b11v-report-workspace-new-report`, `-ranking` |
| S68, S71 Save report dialog: saving a copy, renaming | `b11v-save-report-dialog-copy`, `-rename` |
| S74, S75, S76 Chart: no figures, this period, tooltip on a day | `b11v-chart-no-figures`, `-this-period`, `-tooltip` |
| S77 to S80 Code editor: a problem on a line, read only, suggesting fields, suggesting filters | `b11v-code-editor-problem`, `-read-only`, `-suggesting-fields`, `-suggesting-filters` |
| S84, S87 Date range picker: a custom range, year to date | `b11v-date-range-picker-custom-range`, `-year-to-date` |

The differences, read side by side, are of three kinds, none a styling difference:

- **The data.** Heights of tables, cards and lists follow the number of rows, versions or days, and the growth marks follow the figures: the test data has nothing in any earlier period, so the running screens show "New" or an unchanged mark where the stories show rises and falls.
- **Focus.** In the conflict dialog and the history sheet the story's first button holds the focus ring; on the running screen the pointer was moved away, so it does not.
- **Where the page puts it.** The running preview card needing a permission stretches to its column's height; the time range list opens lower in the running window and scrolls. The filtered builder has one payment status filter where the story also filters by channel.

The other 11 keep their coverage:

| Story | Why it is not compared here |
|---|---|
| S4 Email preview frame: nothing rendered yet; S11 History sheet: loading; S23 Preview card: rendering the first preview; S53 Report view: loading; S65 Report workspace: loading | Reached only by holding a request in the browser, which G-102 accepted as simulated coverage; not held here. Each stays checked against its source |
| S13 History sheet: restoring a version | The case captured the confirmation, which the story does not draw; the story's state, a restore in progress, is not held here. It stays checked against its source |
| S19 Preview card: nothing to preview with | Not attempted: the emails app has a record for every email it previews |
| S24 Problems alert: in several emails | Not reached: saving a layout that does not render lists one problem, not one per email. The case is kept, and its image shows the single line |
| S31, S33, S34 Growth badge: down, unchanged, up | Not reached: the test data has no completed orders in an earlier period, so every figure reads New. They stay checked against their source |

### 4.2 Batch 11's §6 states

Of the states [batch 11's §6](2026-11-10-fb-19-batch-home-reports-and-emails.md#6-corrections) lists as not captured, the preview needing a permission is now compared (S18). Leaving with unsaved changes is driven by behaviour 1; the template's Discard draft action is not. DA-HOME-01's low stock turned off and the logo uploaded and removed on DA-SET-03 are not reached by these runs and keep their recorded coverage.

## 5. Nothing else claimed

- Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. Every request named its own server's default store, and none read or wrote another store's records.
- P12's recorded scope is unchanged. G-103 stays linked to G-11.
- Whether Spree sends each email on a Liquorify store, and through which mail service, stays with G-16 and G-77. The emails here were read from the test servers' mail folders.
- The browser tests are this work item's evidence. Whether they join Spree's own dashboard browser tests is not decided here.
- Every failure is kept: SD-51 and SD-52 at their checks, and G-117 at its two checks. No test was weakened, retried or skipped.

## 6. Closing

Under the owner's delegation of 2026-11-04, as delegated acceptance, not the owner's review.

- **G-100 CLOSED** on 2026-11-10. Each of the 12 behaviours meets its closure condition at `d78e0491`: ten pass, and behaviours 10 and 12 fail only at the checks that stay SD-52's and SD-51's failing parts, as their closure conditions say.
- **G-103** has its answers: 26 as expected and two different. It stays LINKED to G-11, open, with P12's scope unchanged.
- **G-117** is new, recorded at the owner's choice of 2026-11-10: the analyst's rename and delete of a saved report are refused as 404 "not found", not the 403 recorded first. Both checks stay failing until the owner decides otherwise.
- SD-51 and SD-52 stay open, with the owner's answers of 2026-11-10.
