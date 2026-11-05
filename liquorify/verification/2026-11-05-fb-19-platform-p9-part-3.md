---
title: FB-19 platform batch, step P9, part 3, browser tests for the catalog's actions
record: verification
work_item: FB-19
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Twenty-eight browser tests for G-61's catalog actions from part 2 of the catalog and pricing batch, one for each action, each driven through the running dashboard as the admin and asserting what the screen shows and, after a reload, what was kept. Run twice in a row in the pinned Playwright image at `bc5c3fcb`, on freshly started servers, with Spree's code as on `main` at `303d3410`. Twenty-seven passed both times. The price lists' priority order failed both times, after the reload only: the screen showed the list moved one place down, and after the reload it was one place up instead, because a catalog's own price list, which the page does not show, shares the order (SD-25, new). Run alone in a store with no catalog price list, the same test passed. Each of the 28 was shown to fail when what it checks does not happen. Every action G-61 names has a test that passes or fails only on SD-25, so G-61 closes on this record as delegated acceptance, not the owner's review. SD-25 stays open. Tenant isolation stays NOT_RUN. P9 is not complete
---

# FB-19 platform batch, step P9, part 3, browser tests for the catalog's actions

**Claim.** Step P9 of the [platform batch](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) asks for one browser test for each action its gaps name, and runs in parts. [Part 1](2026-11-05-fb-19-platform-p9-part-1.md) covered Getting Started's tasks and batch 7's settings actions, and [part 2](2026-11-05-fb-19-platform-p9-part-2.md) batch 15's multi-store actions. This record is part 3: item 1.2, the category, collection, catalog, translation, price list and import actions that [part 2 of the catalog and pricing batch](2026-11-04-fb-19-batch-catalog-and-pricing-part-2.md) captured and no browser test drove (G-61). The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/catalog-actions.spec.ts`, with part 1's `fidelity/p9.ts` and the catalog batch's `fidelity/catalog.ts`, whose upload helper is now exported for it. They change nothing in Spree's code, tests or workflows.

**Results against P9's completion criteria, for part 3.**

| # | Criterion | Result |
|---|---|---|
| 1.2 | G-61: a category's parent, image, deletion, product order and search; a collection's image, search and kind filter; a catalog's activation, audience, price import and export, deletion and search; the translations page's other record types and its import and export; a price list's channel rule, schedule, activation and priority order; the imports page's results, original file and deletion; and the import wizard opened from the translations page and from a catalog | PARTIAL, as criterion 4 expects: 27 tests PASS, twice (§2, tests 1 to 24 and 26 to 28). The price lists' priority order FAILS, twice, after the reload only, on SD-25 (§2, test 25); run alone in a store with no catalog price list, it PASSES (§1.3) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all 28 failed, each at the assertion that checks that change. Test 25 also fails on SD-25, so its check was run as well in the store with no catalog price list, where only the undone change can fail it, and it failed there at the reload (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS for the runs: at `bc5c3fcb`, twice in a row on freshly started servers, as at `c7a2227a` before it, with the same 27 passing and test 25 failing at the same assertion every time (§1) |
| 4 | A failure is a defect in LIQ-004, kept, not fixed in Spree, the test not weakened | PASS: SD-25 is added to LIQ-004 and is open. Spree's code is unchanged, and test 25 keeps failing while it stands (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-61 CLOSES on this record, as delegated acceptance under the owner's delegation of 2026-11-04, not the owner's review: every action it names has a test that passes, or fails only on SD-25 (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/catalog-actions.spec.ts` at `bc5c3fcb`, with part 1's `fidelity/p9.ts` and `fidelity/staff.ts`, the catalog batch's `fidelity/catalog.ts`, and `fidelity/playwright.config.ts` listing the new script. `bc5c3fcb` sits on part 2's last commit, `5f1a4960`. The first version, `c7a2227a`, ran the same way; looking at its screenshots found two that did not show what their test checks, corrected at `bc5c3fcb`, which changes no assertion (§1.4) |
| Spree's code | As on `main` at `303d3410`, which this branch does not change |
| Server and data | Spree's browser-test server, its database and its fixtures, started exactly as the dashboard's own browser tests start them (`fidelity/stack.spec.ts`), with Ruby 3.3.6 on SQLite, and stopped and started again with a new database before each run. It was started with part 1's stand-in tax engine registered, which no test here uses. Every test works in the fixtures' default store, Shop. Before its tests, each Playwright worker adds through the Admin API the categories, products and collections the category and collection tests open; every other test adds its own records as it starts. Each record is named with the run's stamp, and a test that needs a file to import or export makes one with the stamp in it. Nothing is written to the database directly |
| Dashboard | Built from `packages/dashboard` with Vite on 2026-11-04 at `fc5cb555`, whose dashboard packages and Spree code are the same as at `303d3410`, and served with `vite preview` on port 5174, proxied to the server, as the dashboard's browser tests do in CI |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The browser tests' admin, whose role holds every permission in both stores |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | On 2026-11-05 UTC, each on a server started afresh just before it: at `bc5c3fcb`, the check run at 01:52, taking six and a half minutes, the recorded runs at 01:59 and 02:02, each taking a little under three minutes, and test 25's control run and its check run at 02:05 and 02:06. In each recorded run the same 27 tests passed and test 25 failed at the same assertion, and the JSON files of the two runs were the same apart from the run's stamp and the times in the exported files' names. The evidence is the second run's, whose records are stamped `mw2whsnb` for tests 1 to 25 and `mw2wkyrj` for tests 26 to 28: when a test fails, Playwright starts a new worker for the tests after it, with its own stamp. The control run's record is stamped `mw2wm02g`. The same five runs at `c7a2227a`, from 01:36 to 01:50, are described in §1.4 |
| Secrets | The admin's password is the browser tests' fixed test password, never written to a record. The files the tests download are read in the browser and, after the reload, through the Admin API with the admin's session; no token, download link or key is recorded. Store ids are not recorded |

### 1.1 What each test asserts on the screen and after a reload

Each test drives the dashboard as the admin would: it opens the page, makes the change with the page's own controls, and asserts what the screen then shows. It then reloads the page and asserts what was kept: the saved field, the record gone, the order, or the search or filter and its result. A download is checked twice: its contents as the browser receives them, and, after the reload, the file the server holds under the same name, which Spree's dashboard has no page to list. Each test writes a JSON file of what each step showed, and a screenshot of where it ended.

### 1.2 Showing that each test fails when it should

With `P9_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo the change the test then looks for. The run passes only if every test fails. Each failure was then read to check it came from the assertion that checks the change, not from an earlier step.

| # | Test | What is undone | Where it failed |
|---|---|---|---|
| 1 | A category's parent | The save is sent without the parent | After the reload, the category has no parent |
| 2 | A category's image | The save is sent without the image | After the reload, the image field shows no picture |
| 3 | Deleting a category | The deletion is answered as done without reaching the server | The category is still listed after the deletion |
| 4 | Reordering a category's products | The move is answered as done without reaching the server | After the reload, the products are in their first order |
| 5 | Searching categories | The list is read with its search left out | The category searched past is still listed |
| 6 | A collection's image | The save is sent without the image | After the reload, the image field shows no picture |
| 7 | Searching collections | The list is read with its search left out | The collection searched past is still listed |
| 8 | The collections' kind filter | The list is read with its filter left out | Hand-picked collections are still listed with only "Automatic" ticked |
| 9 | Activating a catalog | The activation is answered as done without reaching the server | The catalog still shows inactive |
| 10 | Deactivating a catalog | The deactivation is answered as done without reaching the server | The catalog still shows active |
| 11 | Assigning a catalog's audience | The save is sent without the audience | After the reload, the company is not the catalog's audience |
| 12 | Withdrawing a catalog's audience | The save is sent without the audience | After the reload, the company is still the catalog's audience |
| 13 | Importing a catalog's prices | The import is sent to another price list | The catalog's prices show no price |
| 14 | Exporting a catalog's prices | The export is asked for another price list | The file has no line for the catalog's product |
| 15 | Deleting a catalog | The deletion is answered as done without reaching the server | After the reload, the catalog is still listed |
| 16 | Searching catalogs | The list is read with its search left out | The catalog searched past is still listed |
| 17 to 19 | Translating categories, collections and option types | The translations' save is answered as done without reaching the server | The record's German column still shows none |
| 20 | Importing translations | The import's mapping leaves out the column with the German name | The product's German column still shows none |
| 21 | Exporting translations | The export is asked for another search | The file does not hold the one product searched for |
| 22 | A price list's channel rule | The save is sent without the rules | After the reload, the list has no channel rule |
| 23 | A price list's schedule | The save is sent without the start and end | After the reload, the schedule is not the one chosen |
| 24 | Activating a price list | The activation is answered as done without reaching the server | The list still shows draft |
| 25 | The price lists' priority order | The move is answered as done without reaching the server | After the reload, the lists are in their first order |
| 26 | An import's results | The import's answer is changed to count no rows | The results do not show one row imported and one failed |
| 27 | Downloading an import's original file | The download is answered with another file | The file is not the one imported |
| 28 | Deleting an import | The deletion is answered as done without reaching the server | The import is still listed after the deletion |

The check run at `bc5c3fcb` failed all 28, each where the table says. Test 25 also fails on SD-25 in every recorded run, and at the same assertion, so in that run its failing does not show the sabotage worked. Its check was therefore run again alone, with `P9_NO_CATALOG_LIST=1`, which leaves out the catalog price list that brings SD-25 on (§1.3). There the test passes when nothing is undone, and with the move undone it failed at the reload: the lists were back in their first order. The screen showed the move before the reload in that run too, which is why the test checks after a reload.

### 1.3 The priority order's control run

Test 25 adds a catalog that prices by hand, which owns a price list, before it adds the two price lists it moves, as the catalog tests before it also do. The Price lists page lists only the lists no catalog owns, but each of a store's lists, a catalog's among them, has a place in one order on the server (§4). With `P9_NO_CATALOG_LIST=1`, the test leaves the catalog out. Run alone that way on a freshly started server, after the recorded runs and at the same revision, it passed: the screen showed the first list one place down, and after the reload it was still there. So the test passes when the order is kept, and in the recorded runs it fails on SD-25, not on the way it moves the list. Both control runs are recorded in the evidence.

### 1.4 Before the recorded runs

The tests were tried on the same stack from the uncommitted files, as written and with their sabotage, until each passed or failed only where it should. Those tries found the setup Spree requires before some actions: a catalog is activated only with an audience, and a price list only with a rule, so tests 9 and 24 add one first. They found test 25's failure, which a test run alone did not show, and SD-25 behind it (§4). They also found that dnd-kit, the drag and drop library the dashboard uses, starts listening for the arrow keys a moment after a row is picked up, so the keyboard moves in tests 4 and 25 wait for its announcement of each step. None of these tries is a recorded run.

The first committed version, `c7a2227a`, then made the same check run, two runs and two control runs as `bc5c3fcb`, with the same results: all 28 failed where they should with their change undone, the same 27 passed in both runs, test 25 failed at the reload in both, and the control runs passed and failed as above. Looking at its 30 screenshots found two, tests 11 and 12, that ended at the top of the catalog's page, with the Audiences card they check below the window. `bc5c3fcb` scrolls to the card before the screenshot and changes nothing else. Every run was then made again from the start.

Every screenshot of the second recorded run at `bc5c3fcb`, and of its control run, was looked at, thirty in all.

## 2. Results

Every test PASSED in both runs at `bc5c3fcb` except test 25.

| # | Action | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 1 | A category's parent | Opens a top-level category, chooses another category as its parent in the Navigation card's picker and saves. Reloads and asserts the parent is still chosen; opens the categories, asserts the category is no longer at the top level, expands the parent and asserts the category is listed beneath it | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/category-parent.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/category-parent.png) |
| 2 | A category's image | Opens a category with no image, adds one in the Images card and saves. Reloads and asserts the image field shows a picture from the server, named as the file added | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/category-image.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/category-image.png) |
| 3 | Deleting a category | Deletes a category from its row's menu. The browser's own box asks `Delete the category "…" and all its subcategories?`, which the test accepts and records (B1 in part 2's record). Asserts the toast and the category gone; reloads and asserts it is still gone | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/category-deleted.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/category-deleted.png) |
| 4 | Reordering a category's products | Opens a category of three products and moves the first one place down with the keyboard: Space, the down arrow, Space. Asserts the new order; reloads and asserts it is kept | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/category-products-reordered.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/category-products-reordered.png) |
| 5 | Searching categories | Searches the categories for one of two named for the run, and asserts only it is listed. Reloads and asserts the search is cleared and both are listed again: the page keeps no search | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/category-search.json), [the search](evidence/2026-11-05-fb-19-platform-p9-part-3/category-search-found.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-3/category-search.png) |
| 6 | A collection's image | As test 2, for a collection | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-image.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-image.png) |
| 7 | Searching collections | Searches the collections for one of two named for the run, and asserts only it is listed. Reloads and asserts the search and its result are kept | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-search.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-search.png) |
| 8 | The collections' kind filter | Unticks "Manual" in the kind filter, and asserts the hand-picked collection gone, the rule-made one listed and every row's kind "Automatic". Reloads and asserts the filter still reads 1 of 2 and the same rows | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-kind-filter.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/collection-kind-filter.png) |
| 9 | Activating a catalog | Opens an inactive catalog with a company as its audience, activates it and confirms. Asserts the toast and "Active"; reloads and asserts "Active" and the Deactivate button | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-activated.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-activated.png) |
| 10 | Deactivating a catalog | The same in reverse, from an active catalog | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-deactivated.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-deactivated.png) |
| 11 | Assigning a catalog's audience | Opens a catalog with no audience, assigns a company in the Audiences card's dialog and saves. Reloads and asserts the company is the audience | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-audience-assigned.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-audience-assigned.png) |
| 12 | Withdrawing a catalog's audience | Opens a catalog with a company as its audience, removes it and saves. Reloads and asserts the catalog has no audience. The undo the row offers once removed is named `admin.actions.restore`, the raw translation key part 2 recorded as B6; the test records the name and does not assert it | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-audience-withdrawn.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-audience-withdrawn.png) |
| 13 | Importing a catalog's prices | Opens a catalog that prices by hand, with one product, and opens the import wizard from its Pricing card. Imports a file with a price of 17.25 for the product and a row for a SKU the store does not have, and asserts the wizard's summary, "1 rows imported · 1 failed", and the catalog's prices showing 17.25. Reloads and asserts the price again | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-prices-imported.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-prices-imported.png) |
| 14 | Exporting a catalog's prices | Opens a catalog whose product was given a price of 19.50 through an import, and exports from its Pricing card. Asserts the downloaded file's line for the product, `…,USD,1,19.50,`. Reloads and asserts the server holds the same file under the downloaded file's name | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-prices-exported.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-prices-exported.png) |
| 15 | Deleting a catalog | Deletes a catalog from its page's menu and confirms. Asserts the toast, the catalogs page, and the catalog not found by its name; reloads and asserts the search kept and the catalog still not listed | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-deleted.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-deleted.png) |
| 16 | Searching catalogs | As test 7, for catalogs | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-search.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/catalog-search.png) |
| 17 | Translating categories | On the translations page, chooses Categories, finds a category with no German, enters its German name and saves. Asserts the toast and the German column showing it translated. Reloads and asserts Categories still chosen, the column and the German name | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-categories.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-categories.png) |
| 18 | Translating collections | As test 17, for a collection | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-collections.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-collections.png) |
| 19 | Translating option types | As test 17, for an option type's German label | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-option-types.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-option-types.png) |
| 20 | Importing translations | Opens the import wizard from the translations page and imports a file with a product's German name. Asserts "1 rows imported · 0 failed", the product's German column and its German name. Reloads and asserts the German name | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-imported.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-imported.png) |
| 21 | Exporting translations | Searches the translations page for one product with a German name and exports the current filter. Asserts the file holds that one product and its German name. Reloads and asserts the server holds the same file under its name | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-exported.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/translations-exported.png) |
| 22 | A price list's channel rule | Opens a price list with no rules, adds a channel rule for the fixtures' "E2E Bulk Channel" and saves. Reloads and asserts the rule names the channel | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-channel-rule.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-channel-rule.png) |
| 23 | A price list's schedule | Opens a price list that starts at once and never ends, picks a start on the 15th of next month at 9:30 and an end on the 20th of the month after at 18:00, and saves. Reloads and asserts both are shown as chosen | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-schedule.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-schedule.png) |
| 24 | Activating a price list | Opens a draft price list with a volume rule from 1,000 items, which no other test's order reaches, activates it and confirms. Asserts the toast and "Active"; reloads and asserts "Active" and the Deactivate button | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-activated.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-activated.png) |
| 25 | The price lists' priority order | Adds a catalog that prices by hand, then two price lists, and opens the Price lists page with the two last, in the order added. Moves the first one place down with the keyboard and asserts the second now above it. Reloads and asserts the same order | FAIL, both runs, after the reload only (SD-25). The screen showed the move. After the reload the first list was one place up instead, above the list that had been above it, and the second still below them | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-priority.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-priority.png); control run: [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-priority-control.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/price-list-priority-control.png) |
| 26 | An import's results | Adds a price import of one row imported and one failed, finds it by its number on the imports page and views it. Asserts "Import completed", "1 rows imported · 1 failed" and the failed rows. Reloads and asserts the results open again | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/import-results.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/import-results.png) |
| 27 | Downloading an import's original file | Finds an import and downloads its original file from the row's menu. Asserts the file's name and contents are the file imported; reloads, downloads it again and asserts the same file | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/import-original-file.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/import-original-file.png) |
| 28 | Deleting an import | Finds an import, deletes it from the row's menu and confirms. Asserts it gone; reloads and asserts the search kept and the import still not listed | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-3/import-deleted.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-3/import-deleted.png) |

The import wizard was opened from a catalog in test 13 and from the translations page in test 20.

## 3. Choices made while writing the tests

- **Records of the run's own.** Every test opens records added for it and named with the run's stamp, never the fixtures' own, so no test depends on what another left behind, and a test that fails leaves nothing the next one reads. Test 25 is the one exception in effect, not in intent: the Price lists page shows every list in the store, so the lists the other tests add are on it too. The test asserts only the order of its own two.
- **Pictures by their address.** Spree's browser-test server gives every file an address on port 3000, where nothing answers, so a picture it serves cannot be seen; the screenshots of tests 2 and 6 show a broken picture for that reason, as P8 found. The tests assert instead that the image field's picture comes from the server and is named as the file added, which only the saved record gives after a reload.
- **Downloads after the reload.** The dashboard has no page that lists exports: the export email's link opens the product list instead (B17 in part 2's record, SD-17). Tests 14 and 21 therefore check, after the reload, the file the server holds under the downloaded file's name, through the Admin API as the admin, and that it is the file downloaded.
- **A row the store does not have.** Each price file the tests import has a row for a SKU the store does not have, so the results show a failed row as well as an imported one, as merchants' files can.
- **Searches that are kept and one that is not.** The collections', catalogs' and imports' searches are kept in the page's address and survive a reload; the categories' search is not. Each test asserts what its page does. The categories' search, cleared by a reload, is recorded as the page's behaviour, not as a defect: G-61 asks that the search works, and it does.
- **The keyboard for moves.** Tests 4 and 25 move rows with the keys dnd-kit offers, as SD-20's tests in P8 did, and wait for its announcement of each key, so the move does not depend on where a pointer lands.

## 4. Defects found

One new, SD-25, numbered by the baseline audit on 2026-11-05 and added to LIQ-004. It is in Spree's dashboard, recorded and not fixed, and not reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).

| # | Defect | Severity | Seen |
|---|---|---|---|
| SD-25 | A price list moved on the Price lists page lands in the wrong place once the page is reloaded. The page lists only the lists no catalog owns, but sends the moved row's place on the page as its place among all the store's lists, a catalog's own among them. Read in code: the page asks for lists without a catalog (`price-lists/index.tsx`), the table sends the row's place on the page, counted from one (`resource-table.tsx`), and the server orders every price list in a store in one order (`acts_as_list scope: :store_id` in `price_list.rb`). The screen shows the move until the page is reloaded | Medium: the move completes and the screen shows it, but the order kept is not the one the merchant chose. Where more than one list applies, the order decides which list's prices apply first; that was not checked here | Test 25, in every run with a catalog price list in the store, after the reload: the moved list one place up instead of one place down. In a store with no catalog price list, the move is kept |

The test stays as it is: it passes once a moved list keeps the place it was moved to.

Seen again and not new: the category's deletion asked through the browser's own box (B1 in part 2's record), and the catalog audience's undo named by a raw translation key (B6). Both are recorded behaviours of part 2, not defects in LIQ-004, and neither changes what the tests assert.

## 5. What this does not show

- **Refusals to the narrower roles (G-60, P10).** Every test signs in as the admin. What the server refuses the catalog's narrower roles was G-60's, under G-11, for P10. P10 has since closed G-60 on its own record ([record](2026-11-05-fb-19-platform-p10.md)); this record adds nothing to that. Nothing here sends a request the admin may not make.
- **Tenant isolation.** Every test works within the default store. Nothing here shows that one store's catalog stays out of another's. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- **The storefront.** The tests check what the dashboard shows and keeps. Whether the storefront then shows a category's parent or image, a collection's members, a catalog's prices to its audience, a translation, or a price list's prices, is not checked here; the shopper's side of the catalog stays with the shop batch's records and their gaps.
- **Which price applies.** Test 25 checks the order the page keeps, and SD-25 is recorded from it. Whether a different order changes the price a shopper pays was not checked.
- **What part 2 captured but G-61 does not name.** Part 2's other captured states, such as the bulk price editor, a catalog's commercial terms and the narrower roles' screens, have no new browser test here and none is claimed.
- **The pictures themselves.** Tests 2 and 6 show a picture is saved and served under the file's name, not what the picture looks like.
- **Other browsers and window sizes.** Every run used Chromium at 1280 by 800 pixels.

**The capabilities.** CAP-05-05, CAP-05-08, CAP-05-10 and CAP-05-15 and the dashboard's side of CAP-05-04 were PARTIAL for G-61. G-61 no longer holds them open. CAP-05-10, the price lists, gains a failing part, SD-25. CAP-05-15 keeps its failing part, SD-17. All stay PARTIAL: the refusals stay with G-60 and G-11, and tenant isolation is NOT_RUN.

## 6. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of these 28 tests and their results, as recorded here, and the closing of G-61 under criterion 7. The owner did not review this work |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |
| Closed | G-61: every action it names has a test that passes, but the price lists' priority order, whose test fails only on SD-25 |
| Not accepted here | SD-25, which is recorded, not answered, and any decision on fixing it |

What stays open:

- **P9 is not complete.** G-75 and G-84 have their own parts, each in its own pull request.
- **SD-25 is open** in LIQ-004, and test 25 fails while it stands.
- **CAP-05-04, CAP-05-05, CAP-05-08, CAP-05-10 and CAP-05-15 stay PARTIAL** (§5).
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.

## 7. Evidence

The [evidence folder](evidence/2026-11-05-fb-19-platform-p9-part-3/) holds each test's JSON file and screenshot from the second recorded run at `bc5c3fcb`, the screenshot test 5 takes of its search before the reload, and the control run's JSON file and screenshot for test 25. `checks.json` gives, for the check run at `bc5c3fcb`, each test's outcome, the first line of each assertion it failed at, and that assertion's lines in the test; `checks-control.json` gives the same for test 25's check run in the store with no catalog price list. Each JSON file names its test, the revision, the run's stamp and every request blocked because it would have left the local servers; none was. Records are named with the run's stamp. No token, download link, store id or password is recorded.
