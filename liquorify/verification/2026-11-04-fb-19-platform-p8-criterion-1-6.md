---
title: FB-19 platform batch, step P8, criterion 1.6 corrected and G-57 closed
record: verification
work_item: FB-19, G-57
date: 2026-11-04
verifier: Claude (automated session, thread "Add browser tests for untested catalog behaviours"); not independent review
result: On 2026-11-04 the owner corrected criterion 1.6 to Spree's design (row E). Spree's dashboard warns before it deletes a library file that a product uses and names where the file is used. Cancelling must keep the file in the library and on the product, and confirming must remove it from both. One new browser test checks the cancel; the warning test now ends at the cancel, and the confirming test is unchanged. All 14 of P8's tests ran twice in a row on freshly started servers at `7ffc775`, with Spree's code as on `main` at `40126a7`. The three tests of the corrected 1.6 passed both times, and each was shown to fail when what it checks does not happen. The tests for SD-19 and SD-20 failed both times at the same assertions as before, and both defects stay open. G-57 closes, as delegated acceptance under the owner's delegation of 2026-11-04. P8 does not pass entirely: criteria 1.4, 1.5 and 3 stay PARTIAL on SD-19 and SD-20. CAP-05-01, CAP-05-03, CAP-05-06 and CAP-05-16 stay PARTIAL for other reasons, given in §6. Tenant isolation stays NOT_RUN
---

# FB-19 platform batch, step P8, criterion 1.6 corrected and G-57 closed

**Claim.** [P8's record](2026-11-04-fb-19-platform-p8.md) left criterion 1.6, a library file in use, awaiting the owner. As written, the criterion asked that the delete be refused with Spree's message. Spree's dashboard does not do that: it warns, then deletes the file from where it is used. This record covers four things: the owner's answer, the corrected criterion, the test the corrected criterion needs, and the run of all 14 of P8's tests at the revision that adds it. It also closes G-57. The tests are in Liquorify's own script, `packages/liquorify-storybook/fidelity/catalog-behaviours.spec.ts`, and change nothing in Spree's code, tests or workflows.

## 1. The owner's answer to row E

On 2026-11-04 the owner wrote, as row E of their decisions:

> Correct criterion 1.6 to test Spree's warning, cancellation preserving the file, and confirmation removing it from the library and product. Close G-57 only on the corrected condition's passing evidence. Preserve SD-19, SD-20 and their failing test results; do not describe P8 as entirely passing.

The criterion now reads ([P8's criteria](../work-items/fb-19-batch-platform.md#p8-the-catalogs-untested-behaviours)):

> **A library file in use:** asking to delete a file that a product uses shows Spree's warning naming where it is used; cancelling keeps the file in the library and on the product; and confirming removes it from the library and from the product.

## 2. What changed in the tests

| # | Test | Change at `7ffc775` |
|---|---|---|
| 12 | The warning | It now ends once the warning is cancelled. Until now it also checked that the file was kept, but its failure check only showed that the warning check fails, so the keeping moved to test 14 with a failure check of its own |
| 13 | Confirming the delete | Unchanged |
| 14 | Cancelling the warning | New. For a third file in use, on its own product, it opens the file and asserts the panel names the product. It then asks to delete the file, asserts the warning, cancels, and asserts the warning closes. Finally it reloads the library and the product, asserts the file is on both, and asserts no delete was sent |

The setup now adds twelve products and three pictures. Tests 1 to 11 are unchanged.

## 3. How the tests ran

| What | Detail |
|---|---|
| Script | `fidelity/catalog-behaviours.spec.ts` at `7ffc775` on this pull request's branch, which starts from `main` at `ba7a8d5` (#50's merge) |
| Spree's code | As on `main` at `40126a7`. Nothing under `spree/` or the dashboard's packages has changed since then, up to `ba7a8d5` |
| Server, data, dashboard, browser | As in [P8's record §1](2026-11-04-fb-19-platform-p8.md#1-how-the-tests-ran): Spree's browser-test server, started afresh with a new database before each run; the dashboard built from the same code on 2026-11-04 and served with `vite preview`; the pinned Playwright 1.64.1 image at 1280 by 800 pixels; signed in as the browser tests' admin. No request left the local servers |
| Runs | On 2026-11-04, each on a server started afresh just before it: the check run at 14:58 UTC, and the recorded runs at 15:03 and 15:05 UTC. Each recorded run took under two minutes. In both, 12 tests passed and the same two failed at the same assertion, and each test's JSON file was the same in both apart from the run's stamp and record ids. The evidence is the second recorded run's, whose records are stamped `mw2917sl` for tests 1 to 8, `mw292g4e` for tests 9 to 11 and `mw292xfr` for tests 12 to 14: after a failing test, Playwright starts a new worker, which adds its own records |
| Pictures | As in P8's record: no picture draws in this setup, so the screenshots show each picture's description in its place, and the tests find a picture by its description |

### 3.1 Showing that each test fails when it should

With `CATALOG_SABOTAGE=1`, each test makes the browser undo the change it then looks for, and is expected to fail. At `7ffc775` all 14 failed. Tests 1 to 13 failed at the same assertion as at `f1e947a` ([P8's record §1.2](2026-11-04-fb-19-platform-p8.md#12-showing-that-each-test-fails-when-it-should)). The three tests of 1.6:

| # | Test | What the browser undoes | Where it failed |
|---|---|---|---|
| 12 | The warning | Answers the file's usage as empty | The file's panel does not name the product |
| 13 | Confirming the delete | Answers the delete itself, so it never reaches the server | The library still lists the file after a reload |
| 14 | Cancelling the warning | Makes the warning's Cancel button press its Delete button, so cancelling deletes the file | The library no longer lists the file after a reload |

## 4. Results

| # | Behaviour | Result, both recorded runs | Evidence |
|---|---|---|---|
| 1 to 7, 9, 10 | 1.1 to 1.5 | PASS, as at `f1e947a` | In the [evidence folder](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/) |
| 8 | 1.4, deleting a type in use | FAIL, at Spree's message, which the dashboard never shows (SD-19), as at `f1e947a` | [JSON](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/product-type-delete-refused.json), [after confirming](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/product-type-delete-refused-after-confirming.png) |
| 11 | 1.5, three places with the keyboard | FAIL: the value moves at most one place (SD-20), as at `f1e947a` | [JSON](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/option-values-keyboard-three-places.json), [PNG](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/option-values-keyboard-three-places.png) |
| 12 | 1.6, the warning | PASS: the file's panel names the product that uses it, and asking to delete shows "Deleting “…” removes it from your library and from the 1 place using it." Cancelling closes it | [JSON](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-warning.json), [the warning](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-delete-warning.png) |
| 14 | 1.6, cancelling | PASS: after cancelling, the library and the product, each reloaded, still have the file, and no delete was sent | [JSON](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-cancelled.json), [PNG](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-cancelled.png) |
| 13 | 1.6, confirming | PASS: the delete is sent with `detach=true` and answered 204, "File deleted" shows, and after a reload neither the library nor the product has the file | [JSON](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-deleted.json), [PNG](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/library-file-in-use-deleted.png) |

The corrected criterion 1.6 is met: its three parts each have a test that passed twice and fails when what it checks does not happen.

## 5. P8's criteria now

| # | Criterion | Result |
|---|---|---|
| 1.1 to 1.3 | Filters, bulk add to a collection, the search engine card | PASS, as P8's record gives |
| 1.4 | Product types | PARTIAL: the refused delete's message is never shown (SD-19) |
| 1.5 | Option values | PARTIAL: the keyboard moves a value at most one place in one pick-up (SD-20) |
| 1.6 | A library file in use, as corrected on 2026-11-04 | PASS (§4) |
| 2 | The tests fail when they should | PASS: all 14 (§3.1) |
| 3 | A recorded run passing twice in a row | PARTIAL: 12 of 14 passed both times; the other two failed both times, on SD-19 and SD-20 |
| 4 | A record, with each failure a defect in LIQ-004 | PASS: P8's record and this one; SD-19 and SD-20 are open in LIQ-004 |
| 5 | Nothing else claimed | PASS (§6) |
| 6 | The owner's answer | MET for G-57: the owner decided that G-57 closes on passing evidence for the corrected 1.6, which §4 gives |

P8 does not pass entirely. Criteria 1.4, 1.5 and 3 stay PARTIAL while SD-19 and SD-20 are open, and their failing tests stay in the script, failing.

## 6. What this does not show, and what stays PARTIAL

Everything in [P8's record §5](2026-11-04-fb-19-platform-p8.md#5-what-this-does-not-show) still holds, apart from its first item, criterion 1.6. In brief:

- G-11 still holds the catalog's refusals to narrower roles (G-56).
- Tenant isolation stays FB-03's validation, NOT_RUN.
- No digital file source with settings is checked (G-55).
- Only Chromium at 1280 by 800 pixels was used.

With G-57 closed, each of the four capabilities stays PARTIAL for a reason of its own:

| Capability | What keeps it PARTIAL |
|---|---|
| CAP-05-01 Products, variants and options | SD-20; and the storefront's side, as the shop batch's part 2 recorded it |
| CAP-05-03 Product types | SD-19 |
| CAP-05-06 Media library | Part 1's B3: an uploaded video's poster is not drawn on its tile ([part 1's record §2](2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#2-the-parts-map-completed)). Nothing in P8 keeps it PARTIAL any more |
| CAP-05-16 Search-friendly slugs | The storefront's side, as the shop batch's part 2 recorded it |

## 7. Evidence

The [evidence folder](evidence/2026-11-04-fb-19-platform-p8-criterion-1-6/) holds the second recorded run's results. For each of the 14 tests there is a JSON file and a screenshot. There are also the screenshots taken mid-test: each filtered list, the refused delete just after it was confirmed, and the warning before a file in use is deleted. The folder also holds `checks.json`, which gives each test's outcome in the check run and the first line of the assertion it failed at. [P8's evidence](evidence/2026-11-04-fb-19-platform-p8/) stays as recorded, with the failing results of SD-19's and SD-20's tests at `f1e947a`. The records are the run's own, named with its stamp. No token, key or password is recorded.

## 8. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of the corrected criterion 1.6's tests and their results, as recorded here, and G-57's closure on them, as the owner's answer to row E sets out. The owner did not review this work |
| Accepted by | Claude, in the thread "Add browser tests for untested catalog behaviours" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |

What stays open:

- **SD-19 and SD-20** stay open in LIQ-004, with their failing tests. Neither is reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).
- **P8 does not pass entirely** (§5).
- **CAP-05-01, CAP-05-03, CAP-05-06 and CAP-05-16 stay PARTIAL** (§6).
- **G-11** stays open, holding G-56.
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.
