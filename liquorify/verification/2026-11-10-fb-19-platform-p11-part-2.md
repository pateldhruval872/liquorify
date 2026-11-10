---
title: FB-19 platform batch, step P11, part 2, browser tests for the order actions (G-90)
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session, thread "Add P11 browser tests"); not independent review
result: Twenty browser tests, one for each of G-90's actions 2.1 to 2.21 but 2.3. Each is driven through the running dashboard as the admin and asserts what the screen shows and, where something is kept, what a reload shows. Run twice in a row in the pinned Playwright image at `759e1832`, on freshly started servers, with Spree's code as on `main` at `fd55bda6`, unchanged since part 1. Thirteen passed both times. Seven failed both times, each only at the check of a known or held behaviour. Test 2.8 fails on SD-34. Test 2.21 fails on SD-32, held for the owner's answer to row 39. Tests 2.9, 2.17 and 2.20 fail on batch 8 part 1's B10, B13 and B14, held under criterion 4. Test 2.15 fails because Preview Order opens nothing, which the baseline audit numbered SD-58, held, proposed Low. Test 2.19 fails because the new order's company is kept but shown nowhere on the order page, numbered SD-59, held, proposed Low; the owner may still decide it is only an observation. Action 2.3, approving a risky order, is NOT_RUN: no order can be made risky without changing Spree's code. Each of the 20 tests was shown to fail when what it checks does not happen. G-90 stays OPEN. Tenant isolation stays NOT_RUN. P11 is not complete
---

# FB-19 platform batch, step P11, part 2, browser tests for the order actions (G-90)

**Claim.** This record is part 2 of step P11 of the [platform batch](../work-items/fb-19-batch-platform.md#p11-browser-tests-for-inventory-orders-and-what-happens-after-the-sale): G-90's actions 2.1 to 2.21, the order behaviours [batch 8 part 1](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md#23-behaviours-no-browser-test-drives-criterion-15) captured and no browser test drove. Part 1 is [its own record](2026-11-10-fb-19-platform-p11-part-1.md). The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/order-actions.spec.ts`, with P9's shared helpers in `fidelity/p9.ts`. They change nothing in Spree's code, tests or workflows. Part 3 (G-92) follows in its own pull request.

**Results against P11's completion criteria, for part 2.**

| # | Criterion | Result |
|---|---|---|
| 1 | One browser test for each action, 2.1 to 2.21 | PASS for 20 actions (§2). 2.3 is NOT_RUN with its reason, as the work item allows (§2.1) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all 20 failed, each at a check of that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS: at `759e1832`, twice in a row on freshly started servers, with the same 13 passing and the same 7 failing at the same checks both times (§1) |
| 4 | A failure is kept, never hidden | PASS for SD-34 (2.8), which is expected and kept. PENDING with the owner for the other six: SD-32 (2.21) waits for row 39; B10 (2.9), B13 (2.17) and B14 (2.20) are behaviours the work item holds under criterion 4; SD-58 (2.15) and SD-59 (2.19) were numbered by the audit thread and are held. Every failure is kept and no test is weakened (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-90 stays OPEN: 2.3 is NOT_RUN, row 39 is unanswered, and five failures wait for the owner (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/order-actions.spec.ts` at `759e1832`, with `fidelity/p9.ts`, `fidelity/orders.ts` (P9's cheque payment methods), the dashboard's own browser-test helpers, and `fidelity/playwright.config.ts` listing the new script. `4f549b1c` then changed only what 2.17 types in the sabotaged run (§1.2) |
| Spree's code | As on `main` at `fd55bda6`, the same as part 1's `1dc43170`. This branch does not change it |
| Server and data | As part 1: Spree's browser-test server, its database and fixtures, on SQLite, with Ruby 3.3.6, in this session's cloud container, stopped and started again with a new database before each run. Every test works in the fixtures' default store, Shop. Each test first adds its own records through the Admin API, named with the run's stamp: products with their own SKUs, stocked and backorderable; customers with default addresses (a made-up name and street); drafts and placed orders paid with P9's cheque methods; and, as the test needs, a cancellation reason, a promotion with a code, a gift card, a store credit, a company, a sales channel, tags, a digital delivery profile with a file, and a fulfilment shipping part of a line. Nothing is written to the database directly. One store setting is added where missing: a Store credit payment method, which Spree needs before credit can pay for an order |
| Dashboard | Built from `packages/dashboard` with Vite at `fd55bda6` and served with `vite preview` on port 5174, proxied to the server |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The browser tests' admin, whose role holds every permission |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | On 2026-11-10 UTC, each on a server started afresh just before it: the check run (§1.2), then the two recorded runs, each taking about three and a half minutes. In each recorded run the same 13 tests passed and the same 7 failed at the same checks. The evidence is the second run's |
| Secrets | The admin's password is the browser tests' fixed test password, never written to a record. No token, key or download link is recorded: test 2.14 downloads the file once through its link and records only that the link was there. Customer emails are made up on `example.com` |

### 1.1 What each test asserts on the screen and after a reload

As part 1: each test opens the page, makes the change with the page's own controls, asserts what the screen then shows, and, where the change is kept, reloads and asserts what was kept. Each writes a JSON file of what each step showed, and screenshots. Where a test reads the Summary card's rows, it checks that they add up to the total; that is the check that fails on SD-34.

### 1.2 Showing that each test fails when it should

With `P11_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo what the test then looks for, or types or looks for something else. The run passes only if every test fails. Each failure was read in Playwright's JSON report to check it came from a check of the change.

| # | What is undone | Where it failed |
|---|---|---|
| 2.1 | Completing the draft is answered with an empty success | "Order completed" is never shown |
| 2.2 | The cancellation is sent without its note and its refund | After the reload, the note is not kept |
| 2.4 | The capture and the void are answered with an empty success | After the reload, the payment is not completed |
| 2.5 | Adding the payment is answered with an empty success | After the reload, no $7.50 payment is listed |
| 2.6 | Adding a discount is answered with an empty success | The discount is not listed |
| 2.7 | Adding a fee is answered with an empty success | The fee is not listed |
| 2.8 | Applying the code is answered with an empty success | The code is not listed |
| 2.9 | Applying the card is answered with an empty success | The amount due stays $40.00, not $25.00 |
| 2.10 | Adding the credit is answered with an empty success | The amount due stays $40.00, not $28.00 |
| 2.11 | Saving the notes is answered with an empty success | After the reload, the new instructions are not shown |
| 2.12 | Saving the address is answered with an empty success | After the reload, the card does not show the new billing street |
| 2.13 | Saving the purchase order is answered with an empty success | After the reload, the new number is not shown |
| 2.14 | The reset is answered with an empty success | Downloads used stays 1 |
| 2.15 | Resend Confirmation is refused | "Confirmation sent" is not shown |
| 2.16 | Saving the items is answered with an empty success | After the reload, the added product is not listed |
| 2.17 | 4 is typed, a quantity the line may take | The line does not keep its quantity of 3 |
| 2.18 | The Paid payment status is chosen instead of Authorized | The filter does not list only the authorized order |
| 2.19 | The draft is created without its company, coupon and channel | After the reload, the channel is not kept |
| 2.20 | No quantity is changed before leaving | No warning is shown (also the recorded failure, B14) |
| 2.21 | The link is looked for under a name nothing has | No control is offered (also the recorded failure, SD-32) |

In the check run at `759e1832`, 19 failed as above and 2.17 did not: typing 2 fulfilled the whole line, the edit page closed, and the test ran out of time on a later step. `4f549b1c` makes it type 4, and a check run of 2.17 alone then failed at the line keeping its quantity ([check-run-2-17.txt](evidence/2026-11-10-fb-19-platform-p11-part-2/check-run-2-17.txt)). The change touches only the sabotaged run, so the recorded runs at `759e1832` stand.

### 1.3 Before the recorded runs

The tests were tried on the same stack until each passed or failed only where it should. Those tries corrected how the tests set up and found what they look for, none of which changes what they assert. Two cases changed the setup: Spree keeps one checkout payment per method on an order, so 2.4 captures on one order and voids on another; and store credit added on the order page stays at Checkout until staff capture it, so 2.10 captures it before reading the customer's balance (§4.3). Other tries read the store credit row by its memo, the billing address after the card's last heading, the edit page's quantity field for 2.17, the orders list by the customer's email, and the channel from the new order page's Sales channel card. Each test also gained early checks, so a run where the change did not happen stops right after it. None of these tries is a recorded run.

## 2. Results

Every test PASSED in both runs at `759e1832` except 2.8, 2.9, 2.15, 2.17, 2.19, 2.20 and 2.21. Evidence is in [`evidence/2026-11-10-fb-19-platform-p11-part-2/`](evidence/2026-11-10-fb-19-platform-p11-part-2/).

| # | Action | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 2.1 | Completing a draft from its page | Completes a draft with Complete Order. After the reload it shows Completed with its number and no longer offers Complete; it is in the orders list and not the drafts list | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/draft-completed.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/draft-completed.png) |
| 2.2 | Canceling a placed order with a reason, a note, a refund and the email choice | Cancels with a reason the test added, a note, the refund chosen and the email not chosen. After the reload the Summary shows Canceled, the reason and the note, and the payment reads Void | PASS. See §4.3 on the payment reading Void | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/order-canceled.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/order-canceled.png) |
| 2.3 | Approving a risky order | Not written | NOT_RUN (§2.1) | — |
| 2.4 | Capturing an authorized payment, and voiding another | Two orders paid later by cheque. Captures one: Completed, and the order reads Paid. Voids the other: Void | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-captured-and-voided.json), [captured](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-captured.png), [voided](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-voided.png) |
| 2.5 | Adding a payment, and choosing a method that needs a saved card | Adds a $7.50 cheque payment; after the reload it is listed. The test gateway for a customer with no saved card: "Customer has no saved cards for this payment method.", Add disabled. On a guest order: "Assign a customer to the order first", Add disabled | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-added.json), [added](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-added.png), [no saved card](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-no-saved-card.png), [no customer](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-no-customer.png) |
| 2.6 | Adding a manual discount by amount and by percent, then deleting one | Adds $5.00 off and 10% off a $40.00 draft: both listed, total $31.50. Deletes the $5.00: total $36.50. Both after a reload, and the Summary's rows add up | PASS (§4.3) | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/discounts-added.json), [added](evidence/2026-11-10-fb-19-platform-p11-part-2/discounts-added.png), [deleted](evidence/2026-11-10-fb-19-platform-p11-part-2/discount-deleted.png) |
| 2.7 | Adding a fee, then deleting it | Adds a $4.50 fee to a $20.00 draft: total $24.50; deletes it: $20.00. Both after a reload | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/fee-added.json), [added](evidence/2026-11-10-fb-19-platform-p11-part-2/fee-added.png), [deleted](evidence/2026-11-10-fb-19-platform-p11-part-2/fee-deleted.png) |
| 2.8 | Applying a discount code, removing it, and entering a code that is refused | Applies the code of a $6.00 promotion: listed, total $34.00 after the reload; removes it: $40.00. A code nobody has: "The coupon code you entered doesn't exist. Please try again.", total unchanged | FAIL, both runs, at the last check only (SD-34): the Summary shows Promotions −$6.00 and Adjustments −$6.00, so its rows do not add up to the $34.00 total | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/discount-code.json), [applied](evidence/2026-11-10-fb-19-platform-p11-part-2/discount-code-applied.png), [refused](evidence/2026-11-10-fb-19-platform-p11-part-2/discount-code-refused.png) |
| 2.9 | Applying a gift card, removing it, and entering a card that is refused | Applies a $15.00 card to a $40.00 order: due $25.00, and the gift card list shows $15.00 used. Removes it: $40.00 and $15.00 left. A card nobody has | FAIL, both runs, at the last check only (B10, held): the card is not applied, but the dialog stays open and says nothing | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/gift-card.json), [applied](evidence/2026-11-10-fb-19-platform-p11-part-2/gift-card-applied.png), [refused](evidence/2026-11-10-fb-19-platform-p11-part-2/gift-card-refused.png) |
| 2.10 | Applying store credit | Adds $12.00 of a customer's credit to a $40.00 order: due $28.00 after the reload. Captures the payment: the customer's page shows $12.00 used and $0.00 left | PASS (§4.3) | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/store-credit.json), [order](evidence/2026-11-10-fb-19-platform-p11-part-2/store-credit-applied.png), [customer](evidence/2026-11-10-fb-19-platform-p11-part-2/store-credit-customer.png) |
| 2.11 | Editing the special instructions and the internal note | Edits both; after the reload each shows its new text | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/notes-edited.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/notes-edited.png) |
| 2.12 | Editing the billing address from the customer card | Changes the billing street; after the reload the card shows it and the shipping address is unchanged | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/billing-address-edited.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/billing-address-edited.png) |
| 2.13 | Editing the purchase order number and document on a placed order | Sets the number and attaches a PDF; after the reload both are shown | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/purchase-order-edited.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/purchase-order-edited.png) |
| 2.14 | Resetting and resending a digital order's download links | A digital product with a file, ordered and downloaded once. Reset: "Download access restored", downloads used 1 to 0 after the reload. Resend email: "Download email sent" | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/downloads-reset-and-resent.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/downloads-reset-and-resent.png) |
| 2.15 | The header's Resend Confirmation and Preview Order | Resend Confirmation: "Confirmation sent". Preview Order | FAIL, both runs, at the last check only (SD-58, held): Preview Order opens no page | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/header-actions.json), [resent](evidence/2026-11-10-fb-19-platform-p11-part-2/confirmation-resent.png), [preview](evidence/2026-11-10-fb-19-platform-p11-part-2/preview-order.png) |
| 2.16 | Editing a placed order's items, with the totals preview | Sets a line to 3, removes another and adds a product. Before saving the preview shows $49.00 becoming $67.00; after saving and a reload the order shows the two lines and a $67.00 total | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/items-edited.json), [preview](evidence/2026-11-10-fb-19-platform-p11-part-2/items-edited-preview.png), [saved](evidence/2026-11-10-fb-19-platform-p11-part-2/items-edited.png) |
| 2.17 | Setting a quantity below what has shipped | A line of 3 with 2 shipped. Types 1 and presses Save. The line keeps 3; then asserts the page says why | FAIL, both runs, at the last check only (B13, held): only the browser's own check stops it, "Value must be greater than or equal to 2.", and the page says nothing | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/below-shipped.json), [refused](evidence/2026-11-10-fb-19-platform-p11-part-2/below-shipped-refused.png), [after](evidence/2026-11-10-fb-19-platform-p11-part-2/below-shipped.png) |
| 2.18 | The orders list's payment status, channel and tags filters, and its export | Two orders, one paid, one authorized on a second channel, one tagged. Each filter lists only the matching order, and the list without filters lists both. The export downloads a file holding both | PASS | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/orders-list.json), [payment](evidence/2026-11-10-fb-19-platform-p11-part-2/orders-filtered-payment.png), [channel](evidence/2026-11-10-fb-19-platform-p11-part-2/orders-filtered-channel.png), [tags](evidence/2026-11-10-fb-19-platform-p11-part-2/orders-filtered-tags.png), [export](evidence/2026-11-10-fb-19-platform-p11-part-2/orders-exported.png) |
| 2.19 | The new order page with default addresses, a company, a coupon code and a channel | Chooses a company, its customer (addresses fill in), a product, a coupon code and a channel, and creates the draft. After the reload it keeps the customer's addresses, the code and the channel, and the Admin API holds the company; then asserts the page shows the company | FAIL, both runs, at the last check only (SD-59, held): the company is kept but shown nowhere on the order page | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/new-order.json), [filled](evidence/2026-11-10-fb-19-platform-p11-part-2/new-order-filled.png), [saved](evidence/2026-11-10-fb-19-platform-p11-part-2/new-order-saved.png) |
| 2.20 | Leaving the edit page by a link with unsaved item edits | Changes a quantity from 2 to 4 and follows the back link | FAIL, both runs (B14, held): no warning; the page is left and the order keeps 2, so nothing is wrongly saved | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/left-edit-page.json), [PNG](evidence/2026-11-10-fb-19-platform-p11-part-2/left-edit-page.png) |
| 2.21 | Sending a payment link from a draft | Looks on the draft's page and its menu for a way to send a payment link | FAIL, both runs (SD-32, held for row 39): none is offered | [JSON](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-link.json), [page](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-link.png), [menu](evidence/2026-11-10-fb-19-platform-p11-part-2/payment-link-menu.png) |

The run logs are [check-run.txt](evidence/2026-11-10-fb-19-platform-p11-part-2/check-run.txt), [check-run-2-17.txt](evidence/2026-11-10-fb-19-platform-p11-part-2/check-run-2-17.txt), [run-1.txt](evidence/2026-11-10-fb-19-platform-p11-part-2/run-1.txt) and [run-2.txt](evidence/2026-11-10-fb-19-platform-p11-part-2/run-2.txt).

### 2.1 Why 2.3 is NOT_RUN

Spree marks an order risky only when one of its payments has a risky address or security code check, or has failed. A test cannot make such a payment without changing Spree's code: the Admin API cannot create a saved card (its card endpoint only lists, shows and deletes), and Spree's test gateway answers every check as a match. The work item allows this: the action is NOT_RUN with that reason, and G-90 stays open for it. A real provider's risky payment would belong with P4.

## 3. Simulated coverage

None. Every test reaches its state on the running server; no answer is made up in the browser outside the sabotaged run.

## 4. Failures kept

### 4.1 Expected by the work item

**2.8, SD-34.** The Summary card counts the promotion twice, as Promotions and as Adjustments. Kept.

**2.21, SD-32.** Held for the owner's answer to row 39. If the owner makes it a defect, the failing result is kept; if the owner records paying by link as not offered, the action leaves P11 with that record.

**2.9, 2.17 and 2.20: B10, B13 and B14.** The work item holds these batch 8 part 1 behaviours under criterion 4. They are not defects until the owner says so. The tests are kept and fail while the behaviours are there.

### 4.2 Numbered by the audit thread and held

**2.15, SD-58.** Preview Order, in the order page's header menu, opens no page, so staff cannot see the order as the customer does. Proposed Low. Held for the owner's answer; it is in LIQ-004 as held, not as an approved defect.

**2.19, SD-59.** A company chosen on the new order page is kept: the Admin API's order carries it, and its own description says it is sent "so the dashboard can show and change it". The order page shows it nowhere. Proposed Low, held as a defect candidate. The owner may still decide it is only an observation, in which case 2.19's last check leaves the test with that record.

Neither is a security or tenant-isolation finding. Neither is reported to Spree, by the owner's standing instruction.

### 4.3 Observations, not numbered

- Store credit added on the order page stays at Checkout, and the customer's balance does not fall, until staff capture the payment. The dialog hides its "Capture immediately" switch for store credit. 2.10 captures it before reading the balance.
- Manual discounts and fees appear only in the Summary's Adjustments row, so its rows add up for them (2.6, 2.7). SD-34's double count shows only with a promotion (2.8 and 2.19).
- Canceling with the refund chosen, on a cheque payment not yet collected, voids the payment rather than recording a refund.

## 5. Nothing else claimed

Whether the confirmation, cancellation and download emails are delivered stays with G-16 and G-77. What the server refuses to narrower roles stays with G-11, P10 and P12. A card saved through a real provider stays with P4. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. Part 3 of P11 has not run.

## 6. Closing

Under the owner's delegation, as delegated acceptance, not the owner's review. G-90 closes when every action 2.1 to 2.21 has a test that passes in both recorded runs or fails only on SD-34 or another defect recorded under criterion 4, and action 2.21 follows the owner's answer to row 39. Thirteen pass, and 2.8 fails only on SD-34. G-90 stays OPEN because 2.3 is NOT_RUN, row 39 is unanswered, and 2.9, 2.15, 2.17, 2.19 and 2.20 fail on behaviours held for the owner.

**The owner's answer, 2026-11-10** ([record](2026-11-10-fb-19-platform-p11-owner-decisions.md)). SD-32 is accepted as a High defect, an incomplete payment-link capability, and FL-08's payment steps stay failing or unavailable. SD-58 and SD-59 are accepted as Low. B10 and B13 are recorded as SD-82 and SD-83, Low, and B14 as SD-84, Medium. Every failing test is kept. G-90 stays OPEN for 2.3 alone, DEFERRED to P4.
