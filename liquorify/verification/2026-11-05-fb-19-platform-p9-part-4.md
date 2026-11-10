---
title: FB-19 platform batch, step P9, part 4, browser tests for promotions, gift cards and store credit
record: verification
work_item: FB-19
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Forty-two browser tests for G-84's promotion, gift card and store credit behaviours from part 3 of the catalog and pricing batch, apart from the three that need a narrower role, which are P10's. Each is driven through the running dashboard as the admin and asserts what the screen shows and, where something is kept, what a reload shows. Run twice in a row in the pinned Playwright image at `4a78cd88`, on freshly started servers, with Spree's code as on `main` at `303d3410`. Forty passed both times. Two failed both times, each only at the check of a behaviour part 3 recorded and did not count as a defect. A promotion whose request fails reads "Loading…" without end and never says it could not be loaded (part 3's B2). A partly redeemed gift card's sheet names its customer by a raw identifier, `cust_…`, not by email (part 3's B14). The baseline audit numbered them SD-26 and SD-27, at Low, held for the owner's answer to row 36 of the decision brief; they are not approved defects. Each of the 42 was shown to fail when what it checks does not happen. Three tests reach their state by answering a request in the browser: they are simulated coverage, not functional verification. G-84 stays OPEN until the owner answers row 36. Tenant isolation stays NOT_RUN. P9 is not complete. Since 2026-11-09 (§8): the owner accepted SD-26 and SD-27 as Low-severity defects with their fixes deferred, and their documented failures as baseline exceptions for G-84 under P9's closure rule. G-84 closed on this record that day, as delegated acceptance, not the owner's review of the tests. Tests 21 and 28 are kept and still fail, CAP-05-12 and CAP-05-13 stay PARTIAL, each with a failing part, and P9 is complete
---

# FB-19 platform batch, step P9, part 4, browser tests for promotions, gift cards and store credit

**Claim.** Step P9 of the [platform batch](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) asks for one browser test for each action its gaps name, and runs in parts. [Part 1](2026-11-05-fb-19-platform-p9-part-1.md) covered Getting Started's tasks and batch 7's settings actions, [part 2](2026-11-05-fb-19-platform-p9-part-2.md) batch 15's multi-store actions, and [part 3](2026-11-05-fb-19-platform-p9-part-3.md) the catalog's actions. This record is part 4: item 1.6, the promotion, gift card and store credit behaviours that [part 3 of the catalog and pricing batch](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md) captured and no browser test drove (G-84), which the owner added to P9 on 2026-11-04 (row 35 of the decision brief, [record](2026-11-04-owner-decision-brief-answers-3.md)). Behaviours 11, 12 and 22 of [that record's §2.3](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md#23-behaviours-no-browser-test-drives-criterion-15) need a narrower role and are P10's, so they have no test here. The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/loyalty-actions.spec.ts`, with part 1's `fidelity/p9.ts`. They change nothing in Spree's code, tests or workflows.

**Results against P9's completion criteria, for part 4.**

| # | Criterion | Result |
|---|---|---|
| 1.6 | G-84: behaviours 1 to 10, 13 to 21 of part 3's §2.3 | PARTIAL: 40 tests PASS, twice (§2). Two FAIL, twice, each only at the check of a behaviour part 3 recorded as Spree's, B2 and B14, numbered SD-26 and SD-27 and held for the owner's answer to row 36: a promotion page that cannot load (§2, test 21), and a partly redeemed gift card's customer (§2, test 28), whose other checks pass. Three tests are simulated coverage (§3) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all 42 failed, each at the assertion that checks that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS for the runs: at `4a78cd88`, twice in a row on freshly started servers, with the same 40 passing and tests 21 and 28 failing at the same assertions both times (§1) |
| 4 | A failure is a defect in LIQ-004, kept, not fixed in Spree, the test not weakened | PENDING with the owner: both failures are kept, Spree's code is unchanged, and neither test is weakened. Whether B2 and B14 are defects is row 36 of the decision brief, which the owner has not answered. SD-26 and SD-27 are in LIQ-004 as held for that answer, not as approved defects (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-84 stays OPEN. Every behaviour of item 1.6 has a test, and every test passes but tests 21 and 28, which fail only on SD-26 and SD-27. Until the owner answers row 36, those two are not defects recorded under criterion 4, so G-84 cannot close on this record (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/loyalty-actions.spec.ts` at `4a78cd88`, with part 1's `fidelity/p9.ts` and `fidelity/staff.ts`, the dashboard's own browser-test helpers, and `fidelity/playwright.config.ts` listing the new script. `4a78cd88` sits on part 3's last commit, `b46e41f6`. It also moves five helpers part 3's `catalog-actions.spec.ts` defined for itself, for reading the Admin API, a toast, a confirmation and a date picker, into `p9.ts` unchanged, so both scripts share them; the one change is that a write through the Admin API may now leave out its body. Part 3's tests were run again at `4a78cd88` to show the move changed nothing (§1.4). The next commit, `5ccab50b`, corrects the script's opening comment, which counted four tests answering a request where there are three; it changes no test |
| Spree's code | As on `main` at `303d3410`, which this branch does not change |
| Server and data | Spree's browser-test server, its database and its fixtures, started exactly as the dashboard's own browser tests start them (`fidelity/stack.spec.ts`), with Ruby 3.3.6 on SQLite, and stopped and started again with a new database before each run. It was started with part 1's stand-in tax engine registered, which no test here uses. Every test works in the fixtures' default store, Shop. Each test first adds the records it opens through the Admin API, named with the run's stamp: promotions, customers, gift cards and batches of them, store credits, an option type, and orders for the fixtures' promotion product, placed and paid with a gift card or with store credit, for the used codes, cards and credits. One test erases a customer's data through the Admin API. Nothing is written to the database directly |
| Dashboard | Built from `packages/dashboard` with Vite on 2026-11-04 at `fc5cb555`, whose dashboard packages and Spree code are the same as at `303d3410`, and served with `vite preview` on port 5174, proxied to the server, as the dashboard's browser tests do in CI |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The browser tests' admin, whose role holds every permission in both stores |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | On 2026-11-05 UTC, each on a server started afresh just before it: the check run at 02:54, taking twelve minutes, and the recorded runs at 03:07 and 03:11, each taking a little over four minutes, and part 3's tests at 03:16 (§1.4). In each recorded run the same 40 tests passed and tests 21 and 28 failed at the same assertions, and the JSON files of the two runs were the same apart from the run's stamp, the codes Spree generated, the order's times and the exported file's name. The evidence is the second run's, whose records are stamped `mw2yytz8` for tests 1 to 21, `mw2z1lj9` for tests 22 to 28 and `mw2z2hgi` for tests 29 to 42: when a test fails, Playwright starts a new worker for the tests after it, with its own stamp |
| Secrets | The admin's password is the browser tests' fixed test password, never written to a record. The codes file test 4 downloads is read in the browser; no token, download link or key is recorded. Customers' emails are made up for the run, at `example.com`. Store ids are not recorded |

### 1.1 What each test asserts on the screen and after a reload

Each test drives the dashboard as the admin would: it opens the page, makes the change with the page's own controls, and asserts what the screen then shows. Where the change is kept, it then reloads the page and asserts what was kept: the saved field, the codes, the rule or calculator, the search, filter or sort and its result. A test whose action is refused asserts the refusal, then reloads and asserts that nothing changed. A list's search, filters and sort are kept in the page's address, so a reload shows the same narrowed list again. The three tests that show how a page handles a failed or empty answer have nothing to keep, and assert the screen only. Each test writes a JSON file of what each step showed, and a screenshot of where it ended.

### 1.2 Showing that each test fails when it should

With `P9_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo what the test then looks for. The run passes only if every test fails. Each failure was then read to check it came from the assertion that checks the change, not from an earlier step.

| # | Test | What is undone | Where it failed |
|---|---|---|---|
| 1, 2 | A promotion with a typed code, with a generated code | The new promotion is sent with another code | The page shows the other code |
| 3 | A batch of codes | The new promotion is sent asking for 3 codes, not 60 | The page does not describe 60 codes with the prefix |
| 4 | The codes sheet | The codes are read as all unused | The used code shows "Unused" |
| 5 | A usage limit | The save is sent without the limit | After the reload, the limit is empty |
| 6 | A usage limit below one is refused | A limit of 5 is typed instead of 0 | Nothing is refused |
| 7 | A schedule | The save is sent without the start and expiry | After the reload, the schedule is not the one chosen |
| 8 | An expiry before the start is refused | An expiry after the start is picked | Nothing is refused |
| 9 to 11 | The option value, signed-in and one-use-per-customer rules | The save is sent without the rules | After the reload, the rule is not listed |
| 12 | The match policy | The save is sent with "all" | After the reload, the policy reads "All rules must match" |
| 13 | A product rule's own policy | The save is sent with the rule's policy "any" | After the reload, "None of these products" is not chosen |
| 14 to 16 | The flexible rate, tiered flat rate and percent per item calculators | The save is sent without the actions | After the reload, the action is not listed |
| 17 | A save refused | The save is sent with the promotion's name, which Spree accepts | No refusal shows |
| 18 | Searching promotions | The list is read with its search left out | The promotion searched past is still listed |
| 19 | Filtering by start and expiry | The list is read with its filters left out | A promotion not yet started is still listed |
| 20 | Sorting | The list is read with its sort left out | The promotions are not in order of their start |
| 21 | A promotion page that cannot load | The promotion's request is left to Spree, which answers it | No failure is shown, because the page loads |
| 22 to 26 | The gift card list's status, currency, batch and customer filters, and its search | The list is read with its filters or search left out | The card filtered or searched past is still listed |
| 27 | An expired gift card | The cards are read as active, expiring in 2099 | The card's status is not "Expired" |
| 28 | A partly redeemed gift card's sheet | The card is read as unused | The sheet does not show $19.99 used |
| 29 | A gift card given a customer | The save is sent without the customer | After the reload, the list does not name the customer |
| 30 | Issuing a batch of gift cards | The batch is sent asking for 1 card | Three cards never appear |
| 31 to 35 | The store credit list's standing, origin, issuer, customer and currency filters | The list is read with its filters left out | The credit filtered past is still listed |
| 36 | A credit's history | The history is read as empty | The history does not list the credit's use |
| 37, 38 | A credit's history when empty, and when it cannot load | The history's request is left to Spree, which answers with the credit's entry | Neither message shows |
| 39 | An erased shopper's credit | The credits' customers are read as not erased | No row names the customer as "—" |
| 40 | Issuing an amount of zero is refused | 12.00 is typed instead of 0 | Nothing is refused |
| 41 | Issuing an amount Spree refuses | The amount 12.345 is sent as 12.35, which Spree accepts | No refusal shows |
| 42 | A used credit's amount cannot be changed | The credit is read as unused | The amount field is not locked |

The check run at `4a78cd88` failed all 42, each where the table says. Tests 21 and 28 also fail on SD-26 and SD-27 in every recorded run, but at a later check than their sabotage: test 21's sabotage stops the page failing at all, so its first check fails, and test 28's fails at its sheet's usage, before it reaches the customer.

### 1.3 Before the recorded runs

The tests were tried on the same stack from the uncommitted files, as written and with their sabotage, until each passed or failed only where it should. Those tries corrected five ways the tests found what they look for, none of which changes what they assert: the promotion's trigger card and the gift card's usage panel are found by their text, the chosen customer is read from the picker's value, the ledger's entries are read as one run of text, and a sheet is closed before a reload, since a reload with the sheet open reopens it from the address. None of these tries is a recorded run.

### 1.4 Part 3's tests after the helpers moved

`4a78cd88` moves five of part 3's helpers into `p9.ts`. Part 3's 28 tests were run once more at `4a78cd88`, after the recorded runs, on a freshly started server. As in part 3's recorded runs at `bc5c3fcb`, 27 passed and test 25, the price lists' priority order, failed only at its check after the reload, on SD-25. The move changed no result.

## 2. Results

Every test PASSED in both runs at `4a78cd88` except tests 21 and 28. "Simulated" marks the three tests that answer a request in the browser (§3).

### 2.1 Promotions

| # | Behaviour | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 1 | 1 | Creates a promotion with a code typed in the Code field. Asserts the promotion's page, "Single coupon code" and the code; reloads and asserts the code | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-typed-code.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-typed-code.png) |
| 2 | 1 | Creates a promotion with the code the Generate button makes. Asserts the code shown is the one generated; reloads and asserts it again | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-generated-code.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-generated-code.png) |
| 3 | 2 | Creates a promotion with a batch of 60 codes and a prefix. Asserts `Multi-code coupon (60 codes with prefix "…")`; reloads, opens the codes and asserts each starts with the prefix. Spree keeps the codes in lower case, so the test compares them without regard to case | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-batch-of-codes.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-batch-of-codes.png) |
| 4 | 3 | Opens a promotion with 60 codes, one of them used by a placed order. Asserts that code "Used" and the only one on the first page, "Page 1 of 2", the next page all "Unused", and 60 different codes. Exports the codes and asserts the file: 60 lines after its heading, the used code's line with `used` and the order's number, and 59 lines `unused`. Reloads, opens the codes and asserts the code still "Used" | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-codes-sheet.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-codes-sheet.png) |
| 5 | 4 | Sets a usage limit of 25 on a promotion with none and saves. Reloads and asserts 25 | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-usage-limit.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-usage-limit.png) |
| 6 | 4 | Types a limit of 0 over a limit of 10 and presses Save. Asserts the browser's own refusal, "Value must be greater than or equal to 1.", and no "Promotion saved"; reloads and asserts 10 is kept. The refusal is the browser's number check, not the dashboard's message (part 3's B11) | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-usage-limit-below-one.json), [the refusal](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-usage-limit-below-one-refused.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-usage-limit-below-one.png) |
| 7 | 5 | Picks a start on the 15th of next month at 9:30 and an expiry on the 20th of the month after at 18:00, and saves. Reloads and asserts both as chosen | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-schedule.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-schedule.png) |
| 8 | 5 | Picks a start on the 15th of next month and an expiry on the 10th, and presses Save. Asserts "Expiry must be after the start date" under Expires and no "Promotion saved"; reloads and asserts the schedule unchanged, with no expiry | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-expiry-before-start.json), [the refusal](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-expiry-before-start-refused.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-expiry-before-start.png) |
| 9 | 6 | Adds an option value rule for one value of an option type made for the run, and saves. Asserts the rule's summary, "Option Value(s) Colour: Red" with the run's names; reloads and asserts it | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-option-value.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-option-value.png) |
| 10 | 6 | Adds the "Only logged in customers" rule and saves; reloads and asserts it | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-signed-in.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-signed-in.png) |
| 11 | 6 | Adds the "One use per user" rule and saves; reloads and asserts it | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-one-use-per-user.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-one-use-per-user.png) |
| 12 | 7 | On a promotion with two rules, which reads "All rules must match", chooses "Any rule may match" and saves. Reloads and asserts "Any rule may match" | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-match-policy-any.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-match-policy-any.png) |
| 13 | 7 | Adds a product rule for "None of these products", with the fixtures' promotion product, and saves. Reloads, opens the rule and asserts the product and "None of these products" chosen | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-product-none.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-rule-product-none.png) |
| 14 | 8 | Adds a whole-order action with the flexible rate calculator, $10.00 for the first item, $5.00 for each more, at most 3, and saves. Asserts its summary; reloads, opens it and asserts the calculator and the three amounts | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-flexi-rate.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-flexi-rate.png) |
| 15 | 8 | The same with the tiered flat rate calculator: tiers of $15 off from $100 and $40 off from $250, and $5 below them | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-tiered-flat-rate.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-tiered-flat-rate.png) |
| 16 | 8 | The same with a per-item action and the percent per line item calculator, 15% | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-percent-per-item.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-calculator-percent-per-item.png) |
| 17 | 9 | Replaces a saved promotion's name with spaces and presses Save. Asserts Spree's refusal, "can't be blank", and no "Promotion saved"; reloads and asserts the name unchanged | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-save-refused.json), [the refusal](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-save-refused-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-save-refused.png) |
| 18 | 10 | Searches the promotions for one of two named for the run, and asserts only it is listed. Reloads and asserts the search and its result are kept | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-search.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-search.png) |
| 19 | 10 | Opens the list filtered to promotions started by today and expiring from today, written into the page's address, since the filter panel offers only "Created at" and "Updated at" (part 3's B4, seen again and recorded in the JSON file). Asserts the running promotion listed and those not yet started and expired not; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-filter-start-and-expiry.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-filter-start-and-expiry.png) |
| 20 | 10 | Sorts three promotions by their start, ascending, with the column's control, and asserts their order; reloads and asserts it kept | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-sort.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-sort.png) |
| 21 | 13 | Opens a promotion whose request the browser answers with a server error, and asserts a message that it could not be loaded and the page no longer reading "Loading…". Simulated | FAIL, both runs, at both checks (SD-26, held). After 20 seconds the page still read "Loading…" and "Loading promotion…", with no message and no way to try again. The JSON file's `shows` holds the start of the page's text, which is its navigation; the screenshot shows the page | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-failing-to-load.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/promotion-failing-to-load.png) |

### 2.2 Gift cards

| # | Behaviour | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 22 | 14 | Narrows the status to "Partially redeemed" and asserts the active card gone and the partly redeemed one listed; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-status.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-status.png) |
| 23 | 14 | Filters the currency to euros and asserts the euro card listed and the dollar card gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-currency.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-currency.png) |
| 24 | 14, 17 | Filters to a batch of two cards issued through the Admin API, beside a single card with the same start to its code. Asserts the two cards listed and the single one gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-batch.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-batch.png) |
| 25 | 14 | Filters to one customer's cards and asserts that customer's card listed and another's gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-customer.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-filter-customer.png) |
| 26 | 14 | Searches for one code and asserts only it is listed; reloads and asserts the search and its result are kept | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-search.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-search.png) |
| 27 | 15 | Lists a card that expired on 1 October 2026 and asserts "Expired"; reloads, opens it and asserts "Expired" and its expiry date | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-expired.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-expired.png) |
| 28 | 16 | Opens a customer's $100.00 card, $19.99 of which paid for an order. Asserts its usage, $100.00, $19.99 used and $80.01 remaining, and the amount locked; closes the sheet, reloads, opens it and asserts the same. Then asserts the sheet names the card's customer by email, as the list does | FAIL, both runs, at the last check only (SD-27, held). Every check of the card's usage and its locked amount passed, before and after the reload. The sheet's Customer field showed `cust_…`, the customer's raw identifier, while the list beneath named the customer's email | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-partly-redeemed-sheet.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-partly-redeemed-sheet.png) |
| 29 | 16 | Opens a card with no customer, chooses one in the sheet's picker and saves. Reloads and asserts the list names the customer and the sheet's picker holds the customer's email | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-customer-added.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-customer-added.png) |
| 30 | 17 | Issues three $20.00 cards with a prefix from the New gift card sheet. Reloads until the three cards show, since they are made after the batch is saved, then filters to the batch, reloads and asserts the three | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-batch-issued.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/gift-card-batch-issued.png) |

### 2.3 Store credit

| # | Behaviour | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 31 | 18 | Narrows the standing to "Outstanding". Asserts a credit spent to $0.00 gone and an unspent one listed; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-standing.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-standing.png) |
| 32 | 18 | Filters the origin to "Gift card". Asserts the credit a gift card became at checkout listed and one issued by hand gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-origin.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-origin.png) |
| 33 | 18 | Filters to credits the admin issued. Asserts the one issued by hand listed and the one from a gift card gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-issuer.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-issuer.png) |
| 34 | 18 | Filters to one customer's credits and asserts another's gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-customer.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-customer.png) |
| 35 | 18 | Filters the currency to euros and asserts the dollar credit gone; reloads and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-currency.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-filter-currency.png) |
| 36 | 19 | Opens a $50.00 credit, $19.99 of which paid for an order. Asserts its history, newest first, from "Used $19.99" to "Added $50.00", and $19.99 used and $30.01 remaining; closes the sheet, reloads, opens it and asserts the same | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history.png) |
| 37 | 19 | Opens a credit whose history the browser answers as empty, and asserts "No movements recorded yet." and $50.00 remaining. Simulated | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history-empty.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history-empty.png) |
| 38 | 19 | Opens a credit whose history the browser answers with a server error, and asserts "Could not load the ledger." and $50.00 remaining. Simulated | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history-failing.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-history-failing.png) |
| 39 | 20 | Issues a $15.00 credit to a customer, then erases the customer's data through the Admin API. Asserts the list's row names the customer "—" with $15.00 remaining, and the page shows neither the customer's email nor an address ending in `@invalid`. Reloads, opens the credit and asserts the title "—", $15.00 remaining, and neither the memo nor the email shown. The credit and its balance are kept and its memo is cleared, as part 3's B17 and B18 recorded | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-erased-shopper.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-erased-shopper.png) |
| 40 | 21 | Chooses a customer, types 0 in the Issue store credit dialog and presses Issue. Asserts "Amount must be greater than 0" and the field marked invalid; reloads, searches for the memo and asserts no credit was issued | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-zero.json), [the refusal](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-zero-refused.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-zero.png) |
| 41 | 21 | The same with 12.345, which the dialog sends and Spree refuses. Asserts Spree's message, "amount has more than 2 decimal places", in the dialog; reloads, searches for the memo and asserts no credit was issued | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-refused-by-spree.json), [the refusal](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-refused-by-spree-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-issue-refused-by-spree.png) |
| 42 | 21 | Opens the Edit dialog of a credit $19.99 of which is used. Asserts the amount field locked at 50.00, and the dialog's description, "Used balance cannot be edited.", which it shows for every credit; changes the memo and saves. Closes the sheet, reloads, opens the credit and asserts the new memo and the amount still $50.00 | PASS | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-used-amount-locked.json), [the dialog](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-used-amount-locked-editor.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-4/store-credit-used-amount-locked.png) |

Every screenshot of the second recorded run was looked at, 48 in all.

## 3. Simulated coverage, and coverage that is not a browser test of the server

The owner asked on 2026-11-04 that simulated and source-reviewed coverage be kept apart from functional verification. In this part:

| Kind | Tests | What they show, and what they do not |
|---|---|---|
| Functional verification | 1 to 20, 22 to 36, 39 to 42 | Each drives Spree's running dashboard against Spree's running server, with records the server holds, and checks what the server kept by reloading. Tests 4, 22, 28, 31 to 33, 36 and 42 also place orders through the Admin API, so a code, a card or a credit is really used |
| Simulated coverage | 21, 37 and 38 | The browser answers one request itself: a server error for the promotion (21), an empty history (37), a server error for the history (38). They show how the screen handles that answer, not that the server gives it, nor when. A credit's history is never empty on this server, since issuing a credit records its first entry, and a server error cannot be made to happen on demand without changing Spree. Their sabotage leaves the request to Spree |
| Source-reviewed only | None | No behaviour of item 1.6 rests on reading code alone. SD-26's and SD-27's causes are read in code (§4), but the behaviours themselves were seen in the browser |

Test 42 shows the Edit dialog locks a used credit's amount, so the dashboard never sends a change to it. The server's own refusal of such a change, which part 3 noted in Spree's specs, is not reached through the dashboard and is not checked here.

## 4. Failures kept, held for the owner's answer to row 36

Since 2026-11-09 both are defects the owner accepted at Low, with their fixes deferred and their failures accepted as baseline exceptions for G-84 ([§8](#8-the-owners-answer-to-row-36-2026-11-09)). This section gives them as they stood when this record was made.

Both failures are behaviours part 3 of the catalog and pricing batch recorded as Spree's, not as defects: B2 and B14 ([part 3's record](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md)). Row 36 of the owner decision brief asks the owner whether batch 9's B18 becomes a defect, and the other behaviours batch 9 and part 3 recorded ([record](2026-11-04-owner-decision-brief-answers-3.md)); it is not answered. The baseline audit numbered the two SD-26 and SD-27 on 2026-11-05, at Low, held for that answer. They are in LIQ-004 as held, not as approved defects, and are not reported to Spree.

| # | Behaviour | Severity, as numbered | Seen |
|---|---|---|---|
| SD-26 (part 3's B2) | A promotion whose request fails reads "Loading…" without end. The page does not read the request's error, and treats a missing promotion as still loading, so a server error never becomes a message or a way to try again. Read in code by part 3: `packages/dashboard/src/routes/_authenticated/$storeId/promotions/$promotionId.tsx`, not traced further | Low: the merchant sees no promotion and no reason, and may wait; nothing is lost or wrongly saved | Test 21, in both runs, with the request answered with a server error in the browser. Simulated: the server was not made to fail |
| SD-27 (part 3's B14) | A partly redeemed gift card's sheet names its customer by the raw identifier, `cust_…`, where the list names the customer's email. The sheet lets a card be changed only while it is active, and for any other card shows its customer field read-only, as the stored identifier, where an active card has a picker that shows the email. Read in code here, not traced further: `packages/dashboard/src/routes/_authenticated/$storeId/loyalty/gift-cards.tsx`, where `editable` is the card's `active` and the read-only field shows `field.value` | Low: the card and its usage are right, and the list beside it names the customer; the sheet alone does not say whose card it is | Test 28, in both runs, after the reload. Every other check of the sheet passed |

Neither test is weakened: each keeps asserting what part 3's capture showed a merchant needs, a message that the promotion could not be loaded, and the card's customer by name. If the owner makes them defects, they stay open as SD-26 and SD-27, the tests keep failing while they stand, and G-84 can close on this record. If the owner decides they are not defects, the numbers are released, and what tests 21 and 28 should expect is settled by that answer before G-84 closes.

Seen again and not new: the filter panel offering neither Starts nor Expires (part 3's B4, test 19), the browser's own refusal of a usage limit below one (B11, test 6), and an erased shopper's credit kept with its memo cleared (B17 and B18, test 39). They stay recorded behaviours of part 3, and none changes what the tests assert.

## 5. What this does not show

- **Refusals to the narrower roles (G-83, P10).** Every test signs in as the admin. Behaviours 11, 12 and 22, which need a narrower role, are P10's with G-83, and P10's checks met them on 2026-11-05 ([record](2026-11-05-fb-19-platform-p10.md)); this record adds nothing to that. Nothing here sends a request the admin may not make.
- **Tenant isolation.** Every test works within the default store. Nothing here shows that one store's promotions, cards or credits stay out of another's. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- **The storefront and checkout.** The tests check what the dashboard shows and keeps. Whether a code, a rule, a calculator, a usage limit or a schedule then changes what a shopper pays is not checked here: applying a coupon, a gift card and store credit at checkout is G-75, P9's storefront part. The orders the tests place through the Admin API only make a code, card or credit used.
- **What the simulated tests do not show** (§3): when the server fails, or answers an empty history.
- **The server's refusal of a used credit's amount** (§3).
- **Other browsers and window sizes.** Every run used Chromium at 1280 by 800 pixels. Test 6's message is the browser's own and may read differently in another browser.

**The capabilities.** The dashboard's side of CAP-05-12, promotions and coupon codes, and CAP-05-13, gift cards and store credit, was PARTIAL for G-84. With every behaviour of item 1.6 tested, G-84 holds them open now only for SD-26 and SD-27, pending row 36. Both stay PARTIAL: G-84 is open, the refusals stay with G-83 and G-11, their use at checkout stays with G-75, and tenant isolation is NOT_RUN.

## 6. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of these 42 tests and their results, as recorded here. The owner did not review this work |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |
| Closed | Nothing. G-84 stays OPEN: every behaviour of item 1.6 has a test, but tests 21 and 28 fail on SD-26 and SD-27, which are held for the owner's answer to row 36, not defects recorded under criterion 4 |
| Not accepted here | Whether B2 and B14 are defects, which is row 36's; SD-26's and SD-27's severity, which follows that answer; and the three simulated tests as functional verification, which they are not |

What stays open, as it stood at the merge. Since 2026-11-09 G-84 is closed and P9 is complete ([§8](#8-the-owners-answer-to-row-36-2026-11-09)):

- **G-84 is OPEN**, for behaviour 13 and behaviour 16's partly redeemed sheet, until the owner answers row 36. Its other behaviours, 1 to 10, 14, 15, the rest of 16, and 17 to 21, have tests that pass, with behaviour 19's empty and failing history as simulated coverage only.
- **SD-26 and SD-27 are held** in LIQ-004 for the owner's answer to row 36, and tests 21 and 28 fail while the behaviours stand.
- **P9 is not complete.** G-75, the storefront's checkout, has its own part.
- **CAP-05-12 and CAP-05-13 stay PARTIAL** (§5).
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.

## 7. Evidence

The [evidence folder](evidence/2026-11-05-fb-19-platform-p9-part-4/) holds each test's JSON file and screenshot from the second recorded run at `4a78cd88`, and the screenshots five tests take of a refusal or a dialog before their reload. `checks.json` gives, for the check run at `4a78cd88`, each test's outcome, the first line of each assertion it failed at, and that assertion's lines in the test. Each JSON file names its test, the revision, the run's stamp and every request blocked because it would have left the local servers; none was. Records are named with the run's stamp. No token, download link, store id or password is recorded.

## 8. The owner's answer to row 36, 2026-11-09

On 2026-11-09 the owner answered row 36 of the decision brief for SD-26 and SD-27, in these words:

> SD-26 and SD-27: Accept both as Low-severity defects and keep their fixes deferred. Accept their documented failures as baseline exceptions for G-84 under P9's existing closure rule. Record that decision explicitly, retain the failing tests and keep affected functional results FAIL/PARTIAL.

The answer is listed with that day's other decisions in [the owner's fourth set of answers](2026-11-09-owner-decision-brief-answers-4.md). It answers row 36 only for SD-26 and SD-27. The owner answered the rest of row 36, batch 9's B18 and the other behaviours batch 9 and part 3 recorded, later the same day ([record](2026-11-09-row-36-recorded-behaviours.md)).

| What | Since 2026-11-09 |
|---|---|
| SD-26 (part 3's B2, test 21) | A defect at Low, accepted by the owner. It stays open in LIQ-004, and its fix is deferred until after the baseline, in its own pull request. It is not reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)) |
| SD-27 (part 3's B14, test 28) | The same: a defect at Low, accepted by the owner, open, with its fix deferred and not reported to Spree |
| Their failures | Tests 21 and 28 fail as §2 and §4 document them. The owner accepted those failures as baseline exceptions for G-84, under P9's closure rule, criterion 7 of [P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) |
| Tests 21 and 28 | Kept as they are, unchanged and not weakened. They keep failing while SD-26 and SD-27 stand. Test 21 stays simulated coverage: the browser answered the promotion's request with a server error, and the server was not made to fail |
| G-84 | **CLOSED** on 2026-11-09 on this record. Each of the 19 behaviours left to P9 has a test that passes, or fails only on a defect now recorded under criterion 4, SD-26 or SD-27. P10 met behaviours 11, 12 and 22. The closing is delegated acceptance under the owner's delegation of 2026-11-04, on the results this record gives. The owner decided how the two failures count; the owner did not review the tests |
| CAP-05-12 and CAP-05-13 | Stay PARTIAL, now each with a failing part: SD-26 for CAP-05-12, on the promotion page, and SD-27 for CAP-05-13, on the gift card sheet. Tenant isolation, which both also wait on, stays NOT_RUN |
| FL-16 and FL-17 | Stay PARTIAL |
| P9 | **Complete** on 2026-11-09. All seven of its criteria hold. Every gap it holds has closed on a P9 record: G-69, G-37 and G-68 on part 1's, G-72 on part 2's, G-61 on part 3's, G-84 on this one, and G-75 on part 5's. Its failing tests are kept on SD-7, SD-24, SD-18, SD-25, SD-26 and SD-27, all still open. This is delegated acceptance, not the owner's review |

Nothing was run again for this section. The results are those of §2, at `4a78cd88`, and no test changed. Simulated coverage stays distinct from functional verification. Real providers stay with P4, and tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open.
