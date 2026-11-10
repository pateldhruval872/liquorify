---
title: FB-19 platform batch, step P11, part 3, browser tests for fulfilment and what happens after the sale (G-92)
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session, thread "Add P11 browser tests"); not independent review
result: Fourteen browser tests, one for each of G-92's actions 3.1 to 3.15 but 3.11, which stays with P4. Thirteen drive the running dashboard as the admin; 3.15 drives the storefront as a signed-in customer, in the storefront's repository. Each asserts what the screen shows and what a reload shows. The dashboard tests ran twice in a row in the pinned Playwright image at `f467aeb6`, on freshly started servers, with Spree's code as on `main`. Nine passed both times, so with 3.15 ten of the 14 pass. Four failed both times, each only at the check of a known or numbered defect. Tests 3.2 and 3.7 fail on SD-36. Test 3.12 fails on SD-37 and on SD-71. Test 3.13 fails on SD-35 and SD-37. SD-71 is new: a replacement for part of an order line is refused as out of stock when the replacement is stocked at more than one location. The baseline audit numbered it; it is proposed Medium and held for the owner. Test 3.15 passed twice in a row in the storefront's pinned image at storefront `6ca5e70`. It ran against the storefront's pinned backend, moved in that pull request to Liquorify `e7fd2953` so that it includes batch 8's part 2. Batch 8's B11 (empty pictures on the packing slip) and B29 (Track Items without the number) did not reproduce. Each of the 14 tests was shown to fail when what it checks does not happen. G-92 stays OPEN while SD-71 is held, and then for 3.11 alone, DEFERRED to P4. Tenant isolation stays NOT_RUN. P11 is not complete
---

# FB-19 platform batch, step P11, part 3, browser tests for fulfilment and what happens after the sale (G-92)

**Claim.** This record is part 3 of step P11 of the [platform batch](../work-items/fb-19-batch-platform.md#p11-browser-tests-for-inventory-orders-and-what-happens-after-the-sale). It covers G-92's actions 3.1 to 3.15: the fulfilment and after-sale behaviours [batch 8 part 2](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2.md#23-behaviours-no-browser-test-drives-criterion-15) captured and no browser test drove. Parts 1 and 2 are [part 1's record](2026-11-10-fb-19-platform-p11-part-1.md) and [part 2's record](2026-11-10-fb-19-platform-p11-part-2.md).

The dashboard tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/`:

- `fulfilment-actions.spec.ts` covers 3.1 to 3.9.
- `after-sale-actions.spec.ts` covers 3.10 and 3.12 to 3.14.
- `p11-orders.ts` holds the order helpers that parts 2 and 3 share. They were moved out of `order-actions.spec.ts` and `inventory-actions.spec.ts`, which now import them.

Action 3.15 is in the storefront's repository, `e2e/order-tracking.spec.ts`, in [storefront #28](https://github.com/pateldhruval872/liquorify-storefront/pull/28). None of this changes Spree's code, Spree's tests or a workflow. Action 3.11, buying a return label, stays with P4 and has no test here.

**Results against P11's completion criteria, for part 3.**

| # | Criterion | Result |
|---|---|---|
| 1 | One browser test for each action, apart from 3.11 | PASS: 14 tests, 3.1 to 3.10 and 3.12 to 3.15 (§2) |
| 2 | The tests fail when they should | PASS: with each test's change undone, all 14 failed, each at a check of that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row; 3.15 against the storefront's pinned backend | PASS. The dashboard tests ran at `f467aeb6`, twice in a row on freshly started servers. The same 9 passed and the same 4 failed at the same checks both times. Test 3.15 ran at storefront `6ca5e70` against the pinned backend at `e7fd2953`, twice in a row with a new database each time, and passed both times (§1) |
| 4 | A failure is kept, never hidden | PASS for SD-35, SD-36 and SD-37, which are expected and kept. PENDING with the owner for SD-71 (3.12), which the audit thread numbered and holds. Every failure is kept, and no test is weakened (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-92 stays OPEN while SD-71 is held. Once the owner records SD-71 as a defect, G-92 stays open for 3.11 alone, DEFERRED to P4 (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Dashboard scripts | `fidelity/fulfilment-actions.spec.ts` and `fidelity/after-sale-actions.spec.ts` at `f467aeb6`. They use `fidelity/p11-orders.ts`, `fidelity/p9.ts`, `fidelity/orders.ts` (P9's cheque payment methods), `fidelity/catalog.ts` (uploads), the dashboard's own browser-test helpers, and `fidelity/playwright.config.ts`, which lists the two scripts. The branch was then rebased onto `main` at `48e33669`, which added only records. The tests are unchanged |
| Spree's code | As on `main`. This branch does not change it |
| Dashboard server and data | As in parts 1 and 2: Spree's browser-test server with its database and fixtures, on SQLite, with Ruby 3.3.6, in this session's cloud container. It was stopped and started again with a new database before each run. The dashboard was built with Vite and served with `vite preview` on port 5174. Every test works in the fixtures' default store, Shop. Each test first adds its own records through the Admin API, named with the run's stamp (§1.3). Nothing is written to the database directly |
| Storefront script | `e2e/order-tracking.spec.ts` at storefront `6ca5e70`, on `next dev` on port 3001, started afresh before each run, with Node 22.23.4 |
| Storefront backend | The pinned Liquorify backend, as `e2e-backend/liquorify-backend.env` records it. Storefront #28 moved the pin from `68236c59`, which predates batch 8's part 2 (#84), to `e7fd2953`, `main` at the time. The gems are unchanged, so the lockfile installed as recorded. The backend is hosted in Spree's starter at `a853a630`. It ran in CI's Ruby, 4.0.5, from the `ruby:4.0.5` image, pulled through Google's Docker Hub mirror because Docker Hub refused this machine's pulls. The database was PostgreSQL 18 from the `postgres:18-alpine` image. Before each run the database server was replaced with a new one and seeded by the storefront's own `bootstrap-spree.sh`. Stripe's keys were placeholders of the test shape, as in P9 part 5; no test here pays with Stripe |
| Browser | Dashboard: the pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels. Storefront: its pinned Playwright 1.60.0 image, by the digest in `visual/in-image.sh`, on the host's network; one worker and no retries |
| Signed in as | Dashboard: the browser tests' admin, whose role holds every permission. Storefront: a customer the test registers, with staff acting through the Admin API as the administrator the bootstrap seeds |
| Requests outside | Every request from the dashboard tests that would leave the local servers was blocked and recorded. None was made |
| Runs | All on 2026-11-10 UTC, each on servers started afresh just before it. Dashboard: the check run (§1.2), then two recorded runs of about three minutes each. Storefront: two recorded runs of under a minute each, then the check run. The evidence is the second run's |
| Secrets | The admin's password is the browser tests' fixed test password and is never written to a record. No token or key is recorded. Customer emails are made up, on `example.com`. Tracking numbers are the carriers' published sample numbers |

### 1.1 What each test asserts on the screen and after a reload

As in parts 1 and 2: each test opens the page and makes the change with the page's own controls. It asserts what the screen then shows and, after a reload, what was kept. Each dashboard test writes a JSON file of what each step showed, and screenshots. Test 3.15 records the Track Items link in its report.

### 1.2 Showing that each test fails when it should

With `P11_SABOTAGE=1` (dashboard) or `E2E_SABOTAGE=1` (storefront), each test is marked as expected to fail. It then undoes what it looks for, or looks for something that is not there. The run passes only if every test fails. Each failure was read in Playwright's JSON report to check that it came from a check of the change.

| # | What is undone | Where it failed |
|---|---|---|
| 3.1 | Fulfilling is answered with an empty success | After the reload, the fulfilment does not show Fulfilled |
| 3.2 | The add control is looked for under a name nothing has | No add control is offered (also the recorded failure, SD-36) |
| 3.3 | Adding tracking is answered with an empty success | After the reload, the tracking added before shipping is not shown |
| 3.4 | Marking delivered is answered with an empty success | The fulfilment still offers Mark as delivered |
| 3.5 | Saving the fulfilment is answered with an empty success | The new delivery method is not shown |
| 3.6 | The split is answered with an empty success | There is no second fulfilment |
| 3.7 | Canceling is answered with an empty success | The panels do not show Canceled |
| 3.8 | Deleting the label is answered with an empty success | The label is still listed |
| 3.9 | The order's shipping address is removed from what the page reads | The slip does not show the ship-to address |
| 3.10 | Receiving is answered with an empty success | The return does not read "1 of 2 received" |
| 3.12 | Shipping the replacement is answered with an empty success | The exchange still reads Received |
| 3.13 | Resolving is answered with an empty success | The claim resolved by replacement does not show Resolved |
| 3.14 | The lists' search and filter terms are removed from their requests | The returns search does not list only the record searched for |
| 3.15 | Staff do not ship the order | After the reload, the order page does not show Fulfilled |

The logs are [check-run.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/check-run.txt) and [storefront-check-run.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-check-run.txt), with [storefront-check-run.json](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-check-run.json).

### 1.3 Before the recorded runs

The tests were tried on the same stacks until each passed or failed only where it should. Those tries corrected how the tests set up and how they find what they look for. None of the corrections changes what a test asserts.

The setup is as follows:

- Each order is for a product with its own delivery profile, a United States zone, and two flat-rate methods named after the test. A fresh database has only digital delivery, and method names must be unique in the store.
- Orders are paid by cheque and shipped through the Admin API where a test starts after shipping.
- 3.10 sets up a 10% Oregon tax rate.
- 3.10's return owed nothing is of a unit sold for $0.00, because receiving no units is not accepted.
- Returns, exchanges and claims that a test only needs in place are opened through the Admin API.
- The packing slip's product has an uploaded picture.

Other tries:

- They read the right card and panel for each record.
- They read the lists' rows rather than the page.
- 3.14 waits for the list to settle after each search, because one recorded run read the list while it was still loading. The runs were then repeated, and this record gives the repeated runs.
- 3.13 resolves the replacement claim before the refunds (§4.3).
- 3.12's and 3.13's other replacements are stocked at one location, so their later steps still run (§4.2).

None of these tries is a recorded run.

## 2. Results

Dashboard tests at `f467aeb6`, both runs. Storefront test at `6ca5e70`, both runs. Evidence is in [`evidence/2026-11-10-fb-19-platform-p11-part-3/`](evidence/2026-11-10-fb-19-platform-p11-part-3/).

| # | Action | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 3.1 | Fulfilling every unit, then some units, with tracking, a carrier and the notify switch | Fulfils all 3 units of one order with a UPS number and the notify switch on, then 2 of 3 units of another with a USPS number and the switch off. After each reload, the fulfilment shows Fulfilled with its number and carrier, the second order keeps 1 unit unfulfilled, and the shop's stock falls by 5 | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilled.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilled.png), [forms](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfil-every-unit-form.png) |
| 3.2 | Adding a fulfilment for units no fulfilment holds, after one is canceled | An order of 2 units whose only fulfilment is canceled. Asserts Add fulfillment is offered | FAIL, both runs, at that check (SD-36): the card offers no way to ship the units again | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-added.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-added.png) |
| 3.3 | Adding, editing and removing tracking, before and after the parcel ships | Adds, edits and removes a UPS number before shipping, then a USPS number after. Each change shows after a reload | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/tracking.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/tracking.png) |
| 3.4 | Marking a fulfilment delivered, and one of its consignments delivered | Marks one fulfilment delivered: Delivered after the reload. On another with two UPS consignments, marks one arrived: it reads Delivered, the other Awaiting Carrier, and the fulfilment stays Fulfilled | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/delivered.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/delivered.png) |
| 3.5 | Editing a fulfilment's origin and delivery method, with Move and re-quote | Moves the fulfilment from the shop to the destination warehouse with Move and re-quote; the dialog re-quotes Ground at $5.00. After the reload, it ships from the destination. Then Express is chosen: $12.00 after the reload | PASS. Store Pickup (B20) is not exercised | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-edited.json), [moved](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-edit-moved.png), [edited](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-edited.png) |
| 3.6 | Splitting a fulfilment, and a split that would empty it | Moves 1 of 3 units into a new fulfilment: two fulfilments, holding 2 and 1, after the reload. Moving the new fulfilment's only unit says "Leave at least one unit behind, or change the origin of the whole fulfillment instead.", Split is disabled, and the reload shows nothing changed | PASS. A split to another location (B13) is not exercised | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/split.json), [split](evidence/2026-11-10-fb-19-platform-p11-part-3/split.png), [refused](evidence/2026-11-10-fb-19-platform-p11-part-3/split-would-empty.png) |
| 3.7 | Canceling a fulfilment | Cancels a fulfilment of 2 units from its menu. After the reload it shows Canceled, and its stock is released: the inventory row's 2 committed units return, available rising from 48 to 50. Then asserts its units are offered to a new fulfilment | FAIL, both runs, at the last check only (SD-36) | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-canceled.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/fulfilment-canceled.png) |
| 3.8 | Deleting an uploaded label | Uploads a label with its tracking number through the Admin API, then deletes it from its menu. After the reload it is gone | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/label-deleted.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/label-deleted.png) |
| 3.9 | Printing the packing slip | Print packing slip opens the slip. It lists the product at $20.00 × 2 = $40.00, shows its picture, and shows the ship-to address | PASS. B11 did not reproduce: the picture is shown | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/packing-slip.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-3/packing-slip.png) |
| 3.10 | A return: its location, a partial and a not resellable receipt, a refund with tax, a return owed nothing, and a cancel | Opens a return of 2 to the destination warehouse, then approves it. Receives 1 of 2: "1 of 2 received". Refunds $22.00, of which $2.00 is tax, to the original payment; the Admin API records one $22.00 refund against that payment. Another return, received as not resellable, reads Not resellable. The destination's stock rises by 1 and the shop's is unchanged. A third is canceled: Canceled. A return of a unit sold for $0.00 is received, then completed with "Nothing is owed on this return…", and no refund is made. Each step is checked after a reload | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/return.json), [new](evidence/2026-11-10-fb-19-platform-p11-part-3/return-new.png), [refund](evidence/2026-11-10-fb-19-platform-p11-part-3/return-refund.png), [complete](evidence/2026-11-10-fb-19-platform-p11-part-3/return-complete.png), [after](evidence/2026-11-10-fb-19-platform-p11-part-3/return.png) |
| 3.11 | Buying a return label | Stays with P4 | Not tested here | — |
| 3.12 | An exchange opened, approved, received and its dearer replacement shipped, and another canceled | Opens an exchange of 1 unit for a $30.00 product: "Price difference $10.00". Approves and receives it. Ship replacement asks first ("…adds the difference to the order as a balance due…"). The exchange then reads Fulfilled, the replacement is in its own fulfilment, and $10.00 is outstanding. Cancels another exchange: Canceled. Then ships a replacement stocked at every location, for 1 unit of a line of 3 | FAIL, both runs, at its last two checks only. SD-37: the cancel confirmation asks "Cancel this return?". SD-71: the replacement stocked at every location is not shipped, the exchange stays Received, and the page shows no message | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/exchange.json), [new](evidence/2026-11-10-fb-19-platform-p11-part-3/exchange-new.png), [cancel](evidence/2026-11-10-fb-19-platform-p11-part-3/exchange-cancel-confirmation.png), [SD-71](evidence/2026-11-10-fb-19-platform-p11-part-3/exchange-replacement-everywhere.png), [after](evidence/2026-11-10-fb-19-platform-p11-part-3/exchange.png) |
| 3.13 | Claims resolved by refund, by store credit and by replacement, and another canceled | Resolves one claim by a replacement and ships it with a UPS number: the replacement is Fulfilled after the reload. Resolves another by a $12.00 refund to the original payment; the Admin API records it against the payment. Resolves a third by store credit; the customer's page shows "Store credit $20.00". Cancels a fourth: Canceled | FAIL, both runs, at its last two checks only. SD-35: the refunded claim's card reads "Refund total $0.00", not $12.00. SD-37: the cancel confirmation asks "Cancel this return?" | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/claim.json), [refund](evidence/2026-11-10-fb-19-platform-p11-part-3/claim-resolve-refund.png), [replacement](evidence/2026-11-10-fb-19-platform-p11-part-3/claim-resolve-replacement.png), [shipped](evidence/2026-11-10-fb-19-platform-p11-part-3/claim-replacement-fulfilled.png), [cancel](evidence/2026-11-10-fb-19-platform-p11-part-3/claim-cancel-confirmation.png), [after](evidence/2026-11-10-fb-19-platform-p11-part-3/claim.png) |
| 3.14 | The returns list's search and status filter, and the exchanges and claims lists' search | Two orders, each with a return, an exchange and a claim; one return canceled. On each list, searching for the first record's number lists only it, and clearing the search lists both. The returns list with only Canceled kept lists only the canceled return, and opening it again lists both | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-3/lists.json), [returns](evidence/2026-11-10-fb-19-platform-p11-part-3/returns-searched.png), [exchanges](evidence/2026-11-10-fb-19-platform-p11-part-3/exchanges-searched.png), [claims](evidence/2026-11-10-fb-19-platform-p11-part-3/claims-searched.png), [filtered](evidence/2026-11-10-fb-19-platform-p11-part-3/returns-filtered.png) |
| 3.15 | FL-06's shipment on the shopper's order page, as the signed-in customer | A new customer orders on the storefront and pays with Check. The order page shows "No tracking information present." and a disabled Track Items. Staff ship it through the Admin API with a UPS number. After a reload the page shows Fulfilled, the no-tracking text is gone, and Track Items links to `https://www.ups.com/track?tracknum=1Z999AA10123456784` | PASS. B29 did not reproduce on this backend | [run 1](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-run-1.json), [run 2](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-run-2.json) |

The run logs are [run-1.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/run-1.txt), [run-2.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/run-2.txt), [storefront-run-1.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-run-1.txt) and [storefront-run-2.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-run-2.txt).

### 2.1 The storefront's other tests on the moved backend

The storefront's other 32 browser tests were run once against the moved backend, after the recorded runs ([storefront-other-tests.txt](evidence/2026-11-10-fb-19-platform-p11-part-3/storefront-other-tests.txt)). Thirty passed. The guest's Stripe checkout failed because Stripe cannot be reached from this machine, as in P9 part 5. "A customer chooses another saved address" timed out once while choosing a state in the address book, and passed when run again on its own. Storefront #28's CI runs all of them with the repository's Stripe test keys.

## 3. Simulated coverage

None. Every test reaches its state on a running server. No answer is made up in the browser outside the sabotaged runs.

## 4. Failures kept

### 4.1 Expected by the work item

**3.2 and 3.7, SD-36.** Once a fulfilment is canceled, the order page never offers to ship its units again. Kept.

**3.12 and 3.13, SD-37.** The exchange's and the claim's cancel confirmations ask "Cancel this return?". Kept.

**3.13, SD-35.** The claim's card shows the amount claimed, $0.00 for a claim opened with no amount, not the $12.00 its resolution paid. Kept.

### 4.2 Numbered by the audit thread and held: SD-71

Shipping a replacement for part of an order line is refused with "Replacement out of stock" whenever the replacement is stocked at more than one location, however much stock there is. In 3.12, an exchange of 1 unit of a line of 3, for a product stocked at all three locations, is received. Then Ship replacement leaves it Received. The Admin API answers the same request `422` with "Replacement out of stock", and the page shows no message.

The cause, read from Spree's code:

- A replacement unit's required quantity is taken from the whole order line, not from the replacement: `Spree::FulfillmentItem#required_quantity` is the line item's quantity.
- Stock planning therefore packs one unit from each of two locations (`Spree::Stock::Prioritizer` with its `Adjuster`).
- `Spree::Fulfillments::Replacements#build_replacements` then finds 2 units planned for a replacement of 1, and reports out of stock.

The same code serves exchanges and claim replacements. With the replacement stocked at one location, both ship (3.12's dearer replacement and 3.13's claim replacement). The audit thread numbered it SD-71, proposed Medium, held for the owner. It is not a security or tenant-isolation finding. It is not reported to Spree, by the owner's standing instruction.

### 4.3 Observations, not numbered

- A replacement is held after a refund to the original payment, which is recorded for the owner's product review. It is neither approved as correct nor called a defect. On 2026-11-10 the owner kept it an observation, not approved as intended, until the bounded check in §4.4 has run. In a first try, one claim on the order was refunded to the original payment. The order then read Partially Refunded, and another claim's replacement fulfilment said "This order is not paid for yet" and was not shipped. Spree may intend to hold a replacement until the order is paid again, since a customer who is both refunded and sent a replacement is paid back twice. Only the owner can say whether that is right here. 3.13 therefore resolves the replacement claim before the refunds.
- A return owed nothing, once completed, reads Refunded with "Refunded $0.00".
- The returns, exchanges and claims lists search by the record's own number only: an order's number finds nothing.
- The packing slip opens in a new window.

### 4.4 The bounded check for the held replacement

The owner asked on 2026-11-10 for a bounded check before deciding whether the hold is intended ([record](2026-11-10-fb-19-platform-p11-owner-decisions.md)). It separates a refund and a replacement for the same item, which pays the customer back twice, from a refund on one claim and a replacement on another, which does not. It is recorded here before it runs. It runs in its own pull request, on Spree's browser-test server at a recorded revision, twice in a row on freshly started servers, and changes no Spree code, test or production setting. It is a check, not a browser test: it makes each order through the Admin API, as 3.13 does, and reads each replacement's fulfilment on the order page.

Each order is paid in full by Check, shipped, and given claims with no return. Each claim is resolved through the Admin API's claim resolution. For each order the check records, after each step:

- each line's quantity, and the units each claim names;
- each refund and its amount;
- the order's total, what has been paid (`payment_total`), the amount due and the payment state;
- whether the replacement's fulfilment ships without the force option, and the message the order page shows for it.

| Order | Claims | What it shows |
|---|---|---|
| A, the same item | One claim on one unit, resolved with a refund and a replacement | The customer is paid back for the unit and sent a new one |
| B1, other claims, the same line | A line of 2: one claim on one unit refunded, another claim on the other unit replaced | A refund and a legitimate replacement on the same line |
| B2, other claims, other lines | Two lines: one product's claim refunded, the other product's claim replaced | A refund and a legitimate replacement on different items |
| C, the control | One claim on one unit, replaced, with no refund | A replacement with nothing refunded |

The expected results are not predictions of what Spree does, but what each answer would show:

- C ships without force, with nothing due. If it does not, the hold is not caused by the refund, and the check says so.
- If A is held and B1 and B2 ship, the hold tells the two cases apart, and the owner can decide whether it is intended.
- If A, B1 and B2 are all held, with an amount due equal to the refund in each, the hold reads only the order's balance and does not tell a double payment from a legitimate replacement. That is the first try's result in §4.3.
- Any other result is recorded as it is.

Every result stays an observation for the owner's product review. Nothing is numbered as a defect or approved as intended until the owner has read it.

## 5. Nothing else claimed

- Buying a return label (3.11), a carrier's rates and statuses, and labels bought or refunded through a provider stay with P4.
- Whether the shipment emails are delivered stays with G-16 and G-77. 3.1 checks only the notify switch that is sent.
- What the server refuses to narrower roles stays with G-11 and P12.
- Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- Batch 8's B13 and B20 are not exercised: no split to another location, and no move to Store Pickup.

## 6. Closing

Under the owner's delegation, as delegated acceptance, not the owner's review. G-92 closes when actions 3.1 to 3.10 and 3.12 to 3.15 pass, or fail only on SD-35, SD-36, SD-37 or another defect recorded under criterion 4. Action 3.11 then joins P4's checks, and G-92 stays open for it alone, DEFERRED to P4.

Of the 14 actions tested:

- Ten pass: 3.1, 3.3 to 3.6, 3.8 to 3.10, and 3.14 and 3.15. This line first said nine; the owner corrected it on 2026-11-10.
- 3.2 and 3.7 fail only on SD-36.
- 3.13 fails only on SD-35 and SD-37.
- 3.12 fails on SD-37 and on SD-71.

G-92 stays OPEN until the owner answers on SD-71. If the owner records SD-71 as a defect, G-92 stays open for 3.11 alone, DEFERRED to P4. All three parts of P11 have now run. P11 is not complete while G-87, G-90 and G-92 stay open.

**The owner's answer, 2026-11-10** ([record](2026-11-10-fb-19-platform-p11-owner-decisions.md)). SD-71 is accepted as a Medium existing defect, with its fix deferred, and 3.12 is kept failing. G-92 stays OPEN for 3.11 alone, DEFERRED to P4. The tally above is corrected to ten. The held replacement stays an observation until §4.4 has run.
