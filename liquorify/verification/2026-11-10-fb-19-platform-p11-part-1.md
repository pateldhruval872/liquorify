---
title: FB-19 platform batch, step P11, part 1, browser tests for the inventory actions (G-87)
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session, thread "Add P11 browser tests"); not independent review
result: Twelve browser tests, one for each of G-87's actions 1.1 to 1.12. Each is driven through the running dashboard as the admin and asserts what the screen shows and, where something is kept, what a reload shows. Run twice in a row in the pinned Playwright image at `69bb4eef`, on freshly started servers, with Spree's code as on `main` at `1dc43170`. Ten passed both times. Two failed both times, each only at the check of a known or held behaviour. Test 1.11 fails on SD-23, as the work item expects: the Overdue filter lists nothing and the columns menu does not offer the three late columns. Its Past cancel-by check passes when the filter is chosen from Add filter, which corrects part of SD-23's description. Test 1.9 fails on batch 6's B5: Spree refuses a supplier name already used, and no second supplier is saved, but the refusal is drawn beneath the open sheet, so the merchant cannot read it. The baseline audit numbered it SD-57, proposed Low, held for the owner's answer; it is not an approved defect. Each of the 12 tests was shown to fail when what it checks does not happen. G-87 stays OPEN until the owner answers SD-57. Tenant isolation stays NOT_RUN. P11 is not complete
---

# FB-19 platform batch, step P11, part 1, browser tests for the inventory actions (G-87)

**Claim.** Step P11 of the [platform batch](../work-items/fb-19-batch-platform.md#p11-browser-tests-for-inventory-orders-and-what-happens-after-the-sale) asks for one browser test for each of 47 inventory, order and after-sale actions, and may run in parts, one for each gap. This record is part 1: G-87's actions 1.1 to 1.12, the inventory behaviours [batch 6](2026-11-04-fb-19-batch-inventory.md#23-behaviours-no-browser-test-drives-criterion-15) captured and no browser test drove. The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/inventory-actions.spec.ts`, with P9's shared helpers in `fidelity/p9.ts`. They change nothing in Spree's code, tests or workflows. Parts 2 (G-90) and 3 (G-92) follow in their own pull requests.

**Results against P11's completion criteria, for part 1.**

| # | Criterion | Result |
|---|---|---|
| 1 | One browser test for each action, 1.1 to 1.12 | PASS: 12 tests (§2) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all 12 failed, each at a check of that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS: at `69bb4eef`, twice in a row on freshly started servers, with the same 10 passing and tests 1.9 and 1.11 failing at the same checks both times (§1) |
| 4 | A failure is kept, never hidden | PASS for SD-23 (1.11), which is expected and kept. PENDING with the owner for 1.9: the failure is kept and the test is not weakened, but B5 is a behaviour batch 6 recorded and the owner has not made a defect. The audit thread numbered it SD-57, held for the owner's answer, as SD-26 and SD-27 were (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-87 stays OPEN. Every action has a test, and every test passes but 1.11, which fails only on SD-23, and 1.9, which fails only on B5. Until the owner answers SD-57, 1.9 is not a failure on a defect recorded under criterion 4, so G-87 cannot close on this record (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/inventory-actions.spec.ts` at `69bb4eef`, with `fidelity/p9.ts`, `fidelity/staff.ts`, the dashboard's own browser-test helpers, and `fidelity/playwright.config.ts` listing the new script. `p9.ts` gains an optional results folder name and reads `P11_SABOTAGE` and `P11_STAMP` beside P9's variables; P9's scripts behave as before |
| Spree's code | As on `main` at `1dc43170`, which this branch does not change |
| Server and data | Spree's browser-test server, its database and its fixtures, started exactly as the dashboard's browser tests start them (`fidelity/stack.spec.ts`): the API engine's test app, in its test environment, on SQLite, with Ruby 3.3.6, in this session's cloud container. It was stopped and started again with a new database before each run. Every test works in the fixtures' default store, Shop. Each test first adds its own records through the Admin API, named with the run's stamp: products of one variant with their own SKUs, stocked where the test needs them, and, as the test needs, a stock location, suppliers, transfers between the browser tests' two warehouses and purchase orders to the destination warehouse. Nothing is written to the database directly, and no shared setting is changed |
| Dashboard | Built from `packages/dashboard` with Vite at `1dc43170` and served with `vite preview` on port 5174, proxied to the server, as the dashboard's browser tests do in CI |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The browser tests' admin, whose role holds every permission |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | On 2026-11-10 UTC, each on a server started afresh just before it: the check run (§1.2), then the two recorded runs, each taking about a minute and a half. In each recorded run the same 10 tests passed and 1.9 and 1.11 failed at the same checks, and the JSON files of the two runs were the same apart from the run's stamp and the numbers Spree gave the documents. The evidence is the second run's |
| Secrets | The admin's password is the browser tests' fixed test password, never written to a record. No token, key or download link is recorded. Store ids are not recorded |

### 1.1 What each test asserts on the screen and after a reload

Each test drives the dashboard as the admin would: it opens the page, makes the change with the page's own controls, and asserts what the screen then shows. Where the change is kept, it reloads the page and asserts what was kept. A search keeps its words in the page's address; the stock levels panel's search does not, so its test checks each search as typed. Each test writes a JSON file of what each step showed, and screenshots.

### 1.2 Showing that each test fails when it should

With `P11_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo what the test then looks for, or, where the change is not a request, types or sends something else. The run passes only if every test fails. Each failure was then read in Playwright's JSON report to check it came from a check of the change, not from an earlier step.

| # | What is undone | Where it failed |
|---|---|---|
| 1.1 | The transfer's receipt is sent with 1 unit accepted, not 6 | The transfer page never reads "6 received of 6 shipped" |
| 1.2 | The purchase order's receipt is sent with 1 unit accepted on each line | The page never reads "14 received of 14 ordered" |
| 1.3 | The row's save is answered with an empty success and never reaches the server | After the reload, the row reads 5 and not backorderable |
| 1.4 | The panel's list is read with its search left out | The other product is still listed after the search |
| 1.5 | The location's stock movements are read as empty | The history does not list the +7 movement |
| 1.6 | The file names other references | The orders opened are not the file's references with their lines |
| 1.7 | The export is asked for with a search nothing matches | The downloaded file holds neither of the test's orders |
| 1.8 | The suppliers are read as all deletable | The supplier with history offers Delete |
| 1.9 | A name nobody has is typed | No refusal is shown |
| 1.10 | Each receipt is sent with one unit fewer, exactly what was sent or ordered | The transfer page never reads "5 received of 4 shipped" |
| 1.11 | The list is read with its filters left out | Overdue lists the order on time, Past cancel-by lists all three, and the columns menu lacks the three columns |
| 1.12 | Taking each document back to draft is answered with an empty success | After the reload, the transfer still reads Ready to ship |

For 1.1, 1.2 and 1.10 the failure comes at the document page's count of what was received, which is the screen showing the change, before the inventory list or the status after a reload is read. 1.9 and 1.11 fail at the same checks in the recorded runs as in the check run, because those checks also fail on B5 and SD-23.

### 1.3 Before the recorded runs

The tests were tried on the same stack from the uncommitted and then the committed files, as written and with their sabotage, until each passed or failed only where it should. Those tries corrected how the tests found what they look for, none of which changes what they assert: a document's status is read from its status badge's text rather than its displayed text, which capitalises each word; a search uses the run's stamp; the import test opens the imported orders by their numbers; a row's Save is found from its own count field; the panel's search result is read once its answer is in, since the panel briefly shows "Loading…"; the supplier list is counted by rows, since a row holds its name twice; the refusal is looked for by its own words, since an earlier supplier name held the word "taken" and let a sabotaged run pass; and the Past cancel-by filter's value is chosen from the filter panel's second step. The tries also showed the Past cancel-by result in §4. None of these tries is a recorded run.

## 2. Results

Every test PASSED in both runs at `69bb4eef` except 1.9 and 1.11. Evidence is in [`evidence/2026-11-10-fb-19-platform-p11-part-1/`](evidence/2026-11-10-fb-19-platform-p11-part-1/).

| # | Action | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 1.1 | Receiving a transfer, then opening the inventory list | A product with 20 at the source and 0 at the destination; a transfer of 6 sent through the Admin API. Asserts the list then reads 14 and 0; receives the 6 on the transfer page, "6 received of 6 shipped"; opens the list, reloads and asserts 14 at the source and 6 at the destination | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/inventory-after-transfer.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-1/inventory-after-transfer.png) |
| 1.2 | Receiving a purchase order's delivery, then opening the inventory list | Two products at the destination, 2 and 0; a placed order of 10 and 4. Receives both lines on the order's page, "14 received of 14 ordered", Received; opens the list for each, reloads and asserts 12 and 4 | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/inventory-after-purchase-order.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-1/inventory-after-purchase-order.png) |
| 1.3 | Correcting a row's count and backorder setting in a location's stock levels panel | In a new location's sheet, sets a row from 5 to 17, turns backorders on and saves the row. Reloads and asserts 17 and backorderable; the inventory list reads 17 | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-level-corrected.json), [sheet](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-level-corrected-sheet.png), [list](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-level-corrected.png) |
| 1.4 | Searching the stock levels panel | In a new location with two products, searches for one: only it is listed. Searches for nothing it holds: "No stock levels match your search." Clears the search: both are listed | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-levels-search.json), [found](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-levels-search-found.png), [no match](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-levels-search-no-match.png), [cleared](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-levels-search.png) |
| 1.5 | A location's stock history after a stock change there | Adjusts a product in a new location by +7, reason Count, on the inventory list, 5 to 12. The location's sheet's stock history lists the movement, +7, Adjusted, Count | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-history.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-1/stock-history.png) |
| 1.6 | Importing a purchase order file through the wizard | Runs a file of 3 rows for 2 orders, written in the wizard's columns, from the list's Import to "Import completed", "3 rows imported · 0 failed". Reloads, searches and asserts 2 orders of 8 units each; opens each, Draft, one with its 2 lines and one with its 1 | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-import.json), [mapping](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-import-mapping.png), [completed](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-import-completed.png), [order](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-import.png) |
| 1.7 | Exporting purchase orders | Exports every purchase order from the list. The dashboard downloads the file, "Export downloaded", and the file holds a line for each of the test's two orders. The email sent for a slow export is SD-17's and is not checked | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-export.json), [dialog](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-export-dialog.png), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-order-export.png) |
| 1.8 | The row menu of a supplier with purchasing history | A supplier never ordered from offers Edit and Delete; a supplier named on a purchase order offers Edit only | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/supplier-with-history.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-1/supplier-with-history-menu.png) |
| 1.9 | Saving a supplier with a name already used in the store | Types another supplier's name in the New supplier sheet and presses Save. Records the sheet still open, the refusal's text in the page and whether it is readable; reloads the list searched for the name and asserts one supplier; then asserts the refusal was shown where the merchant can read it | FAIL, both runs, at the last check only (B5, SD-57, held). No second supplier was saved. The sheet stayed open with no field error; the refusal, "has already been taken", was in the page but beneath the sheet | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/supplier-name-taken.json), [refused](evidence/2026-11-10-fb-19-platform-p11-part-1/supplier-name-taken-refused.png), [after the reload](evidence/2026-11-10-fb-19-platform-p11-part-1/supplier-name-taken.png) |
| 1.10 | Receiving more than was sent, and more than was ordered | Receives 5 on a transfer of 4 and 4 on an order of 3; after each reload the status reads Over-received | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/over-received.json), [transfer](evidence/2026-11-10-fb-19-platform-p11-part-1/transfer-over-received.png), [order](evidence/2026-11-10-fb-19-platform-p11-part-1/over-received.png) |
| 1.11 | The Overdue and Past cancel-by filters, and the columns menu | Three placed orders: late, past its cancel-by date, and on time. Keeps only Overdue; chooses Past cancel-by from Add filter; opens the columns menu. Each part is checked and recorded | FAIL, both runs, on SD-23, as expected. Overdue lists nothing and reads "No purchase orders yet". The columns menu offers neither Cancel by, Overdue nor Past cancel-by. Past cancel-by PASSES: it lists only the order past its cancel-by date (§4) | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-orders-late-filters.json), [Overdue](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-orders-filtered-overdue.png), [Past cancel-by](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-orders-filtered-past-cancel-by.png), [columns](evidence/2026-11-10-fb-19-platform-p11-part-1/purchase-orders-columns-menu.png) |
| 1.12 | Taking a transfer and a placed purchase order back to draft | Takes a transfer from Ready to ship, and an order from Ordered before anything arrived, back to draft, "Back in draft". After each reload: Draft, with Edit offered | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-1/back-to-draft.json), [transfer](evidence/2026-11-10-fb-19-platform-p11-part-1/transfer-back-to-draft.png), [order](evidence/2026-11-10-fb-19-platform-p11-part-1/back-to-draft.png) |

The run logs are [check-run.txt](evidence/2026-11-10-fb-19-platform-p11-part-1/check-run.txt), [run-1.txt](evidence/2026-11-10-fb-19-platform-p11-part-1/run-1.txt) and [run-2.txt](evidence/2026-11-10-fb-19-platform-p11-part-1/run-2.txt).

## 3. Simulated coverage

None. Every test reaches its state on the running server; no answer is made up in the browser outside the sabotaged run.

## 4. Failures kept, and one correction

**1.11, SD-23.** Expected by the work item and kept. The Overdue filter is still refused and the columns are still not offered. One part of SD-23's description does not hold: it says the Past cancel-by filter "sends its scope the same way (read in code)". Chosen from Add filter, where it is offered, Past cancel-by sends a single value, and the list showed only the order past its cancel-by date. SD-23's other effects stand, and its proposed severity is unchanged. LIQ-004's SD-23 row is corrected in this pull request.

**1.9, B5, numbered SD-57 and held.** Batch 6 recorded B5 as Spree's behaviour, not a defect. P11's criterion 4 holds such a failure for the owner's answer. The audit thread allocated SD-57 for it on 2026-11-10, proposed severity Low: the merchant is not told why the supplier was not saved; nothing is lost or wrongly saved. It is in LIQ-004 as held, not as an approved defect. It is not a security or tenant-isolation finding. The test is kept and is not weakened.

## 5. Nothing else claimed

What the server refuses to narrower roles stays with G-11, P10 and P12. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. No real provider is called. Whether the export's email is delivered, and its link, stay with G-16 and SD-17. Parts 2 and 3 of P11 have not run.

## 6. Closing

Under the owner's delegation, as delegated acceptance, not the owner's review. G-87 closes when every action 1.1 to 1.12 passes in both recorded runs or fails only on SD-23 or another defect recorded under criterion 4. Ten pass and 1.11 fails only on SD-23. 1.9 fails only on B5, which waits for the owner's answer to SD-57. If the owner accepts SD-57 as a defect, G-87 closes on this record. Until then G-87 stays OPEN, and CAP-07-09 and CAP-07-10 stay PARTIAL.

**The owner's answer, 2026-11-10** ([record](2026-11-10-fb-19-platform-p11-owner-decisions.md)). SD-57 is accepted as a Low existing defect, with its fix deferred, and 1.9 is kept failing. G-87 is CLOSED under its closing rule.
