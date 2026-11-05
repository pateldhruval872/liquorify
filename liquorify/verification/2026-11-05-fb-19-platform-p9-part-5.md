---
title: FB-19 platform batch, step P9, part 5, browser tests for the storefront's checkout
record: verification
work_item: FB-19
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Nine browser tests in the storefront's repository, one for each checkout action G-75 names, driven through the storefront as a guest or a signed-in customer. Each asserts what checkout shows and, after a reload, what was kept. Run twice in a row in the storefront's pinned Playwright image at storefront `2e3bdcaa`, against the pinned Liquorify backend at `68236c59` with a new database each time. All nine passed both times, and with each test's change undone in the browser all nine failed at the check of that change. G-75 closes on this record as delegated acceptance under the owner's delegation of 2026-11-04, not the owner's review. No capability changes status here. Refusals stay with P10 and tenant isolation stays NOT_RUN. P9 has no other part to run
---

# FB-19 platform batch, step P9, part 5, browser tests for the storefront's checkout

**Claim.** Step P9 of the [platform batch](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) asks for one browser test for each action its gaps name, and runs in parts. [Part 1](2026-11-05-fb-19-platform-p9-part-1.md) covered Getting Started's tasks and batch 7's settings actions, [part 2](2026-11-05-fb-19-platform-p9-part-2.md) batch 15's multi-store actions, [part 3](2026-11-05-fb-19-platform-p9-part-3.md) the catalog's actions, and [part 4](2026-11-05-fb-19-platform-p9-part-4.md) the promotion, gift card and store credit behaviours. This record is part 5: item 1.5, the checkout actions that [batch 9](2026-11-04-fb-19-batch-storefront-cart-and-checkout.md) did once in its capture scripts with no browser test (G-75). The owner added them to P9 on 2026-11-04 (row 31 of the decision brief, [record](2026-11-04-owner-decision-brief-answers-3.md)). As item 1.5 asks, the tests are in the storefront's repository, `e2e/checkout-actions.spec.ts`, and run against the backend its browser tests use, the pinned Liquorify backend since storefront #23. They were added in [storefront #27](https://github.com/pateldhruval872/liquorify-storefront/pull/27). Nothing in Spree's code, tests or workflows, or in the storefront's application code, changes.

**Results against P9's completion criteria, for part 5.**

| # | Criterion | Result |
|---|---|---|
| 1.5 | G-75: applying a coupon and a gift card, placing an order with Check and with nothing to pay, choosing a saved address, completing a signed-in checkout, using checkout's address editor, and checkout showing tax and a second market's currency | PASS: one test for each of the nine actions, each passing twice (§2) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all nine failed, each at the assertion that checks that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS: at storefront `2e3bdcaa`, against the backend at `68236c59`, twice in a row on freshly started servers with a new database, all nine passing both times (§1) |
| 4 | A failure is a defect in LIQ-004, kept, not fixed in Spree, the test not weakened | Nothing to record: no test failed. SD-21, which the owner expected the signed-in tests to fail on, was fixed in storefront #26 before these tests were written (§2) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-75 closes on this record, as delegated acceptance (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Tests | `e2e/checkout-actions.spec.ts` at storefront `2e3bdcaa`, on `main` at `ba6ddcd`, which holds SD-21's fix (#26). The same commit moves three checkout helpers that `customer-checkout.spec.ts` defined for itself into `e2e/support.ts`, so both files share them, lets the checkout address filler take another address, and lets the address book helper add a second address. `bootstrap-spree.sh` gains a step that adds the tests' data (below) |
| Backend | The pinned Liquorify backend, as `e2e-backend/liquorify-backend.env` records it: Liquorify at `68236c59`, hosted in Spree's starter at `a853a630`, with the gems in `e2e-backend/Gemfile.lock`. It was started and seeded by the storefront's own scripts, `liquorify-backend.sh start` and `bootstrap-spree.sh`, as CI starts it |
| Ruby and database | CI's Ruby, 4.0.5, in the `ruby:4.0.5` image by digest, and PostgreSQL 18 in the `postgres:18-alpine` image by digest, as CI's service. Before each run the database server was replaced with a new one, so each run started from an empty database, then seeded with Spree's seeds and sample data |
| Data | Spree's sample data, with what `bootstrap-spree.sh` adds through Spree's models: Check shown at checkout and the product with colour and size options, as before, and now two gift cards, E2E-GIFT-PART for $25.00 and E2E-GIFT-WHOLE for $100,000.00, one for each test that applies one; the E2E Taxed Mug, $20.00, in a tax category of its own with an 8% rate in the United States, so no other product is taxed; and a market for Spain in euros, with €18.00 for International Shipping. The coupon is Spree's sample FREESHIP. The tests' guests and customers are made up for each test, with `example.com` addresses |
| Storefront | `next dev` on port 3001, as the storefront's Playwright configuration starts it, with the publishable key the bootstrap wrote, started afresh before each run. Node 22.23.4, where CI uses Node 20 |
| Stripe | The bootstrap requires Stripe keys of the test shape. Placeholder values of that shape were given, not real keys, and Stripe's servers cannot be reached from this machine, so the E2E Stripe method shows a connection error at checkout. No test uses it: every order is placed with Check or paid in full by a gift card. CI runs with the repository's Stripe test keys |
| Browser | The storefront's pinned Playwright 1.60.0 image, by the digest in `visual/in-image.sh`, on the host's network; Chromium at 1280 by 720 pixels; one worker and no retries |
| Runs | On 2026-11-05 UTC, each on servers started afresh with a new database just before it: the check run at 03:55, and the recorded runs at 04:04 and 04:08, each taking under three minutes. All nine tests passed in both recorded runs, with no retry |
| Secrets | No key, token or password is recorded. The customers' password is the storefront tests' fixed test password, and the publishable key the bootstrap writes stays in an ignored file |

### 1.1 What each test asserts on the screen and after a reload

Each test reaches checkout as a shopper does: it opens a product's page, adds it to the cart and follows the cart drawer's Checkout link. A guest then enters an email and a New York address, or a Spanish one in the euro market, and moves focus out of the form, which saves it. The test makes its change with checkout's own controls and asserts what the page shows: the code applied, the totals, the address chosen, the order placed page. It then reloads and asserts the same again, which checkout reads afresh from Spree. A test that places an order reloads the order placed page, which reads the order from Spree. The signed-in customer's test also opens the account's order history. Checkout shows a saved address chosen before Spree has saved it, so the saved address tests wait for the storefront's request to answer before reloading.

### 1.2 Showing that each test fails when it should

With `E2E_SABOTAGE=1`, each test is marked as expected to fail and undoes the change it then looks for: the browser stops the storefront's request that carries the change, or the test is given an input that does not make the change. The run passes only if every test fails. Each failure was then read to check it came from the assertion that checks the change, not from an earlier step.

| # | Test | What is undone | Where it failed |
|---|---|---|---|
| 1 | A guest applies a coupon | The request applying FREESHIP is stopped | The summary does not list "freeship" with -$5.00 |
| 2 | A guest applies a gift card | The request applying E2E-GIFT-PART is stopped | The summary does not list the gift card with -$25.00 |
| 3 | A guest places an order with Check | Every request after the address is saved is stopped | The order placed page never opens |
| 4 | A guest places an order with nothing to pay | The request applying E2E-GIFT-WHOLE is stopped | The summary's gift card row does not read -$94.99 |
| 5 | A customer chooses another saved address | The request saving the chosen address is stopped | After the reload, the address chosen is not checked |
| 6 | A signed-in customer completes checkout | Every request after the address is saved is stopped | The order placed page never opens |
| 7 | A customer edits a saved address at checkout | The request saving the edited address is stopped | The address editor stays open |
| 8 | Checkout shows tax | The untaxed coffee maker is bought instead of the taxed mug | The summary has no tax of $1.60 |
| 9 | Checkout shows a second market's currency | The product is bought in the United States market | International Shipping at €18.00 is not offered |

The check run at `2e3bdcaa` failed all nine, each where the table says ([checks.json](evidence/2026-11-05-fb-19-platform-p9-part-5/checks.json)).

### 1.3 Before the recorded runs

The tests were tried on the same stack until each passed, and failed where it should. Those tries corrected three things, none of which changes what the tests assert:

- The order placed page names a gift card payment "Gift card", not "Gift Card".
- With two saved addresses, checkout opens on the one saved last, listed first, so the saved address test chooses the older one.
- The saved address test reloaded straight after the choice, before the storefront's request saving it had answered. The reloaded page showed the address checkout opened with, while Spree had kept the choice, as read through the server. The test now waits for that request to answer. The tax test's checks were also put in an order that makes its sabotage fail at the tax.

None of these tries is a recorded run.

### 1.4 The storefront's other browser tests

The commit moves helpers that `customer-checkout.spec.ts` used and changes the address book helper that `account.spec.ts` uses. After the recorded runs, on the same servers, the storefront's other 22 browser tests passed ([other-tests.json](evidence/2026-11-05-fb-19-platform-p9-part-5/other-tests.json)), the signed-in checkout tests of SD-21's fix among them. The guest's Stripe checkout test was not run, since Stripe's servers cannot be reached here. The storefront's lint and type check passed.

## 2. Results

All nine tests PASSED in both recorded runs at `2e3bdcaa` ([run1.json](evidence/2026-11-05-fb-19-platform-p9-part-5/run1.json), [run2.json](evidence/2026-11-05-fb-19-platform-p9-part-5/run2.json)). The coffee maker is Spree's sample Drip Coffee Maker, $89.99 or €84.99, with Standard delivery at $5.00.

| # | Action | What the test does and asserts | Result | Screenshot |
|---|---|---|---|---|
| 1 | Applying a coupon | A guest with the coffee maker, total $94.99, enters FREESHIP. Asserts the summary lists "freeship" with -$5.00, a discount of -$5.00 and a total of $89.99; reloads and asserts all three again. Spree keeps the code in lower case | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/01-a-guest-applies-a-coupon.png) |
| 2 | Applying a gift card | A guest with the coffee maker enters E2E-GIFT-PART. Asserts "Gift card E2E-GIFT-PART" with -$25.00, the gift card row -$25.00, the total still $94.99 and $69.99 due; reloads and asserts the card and the amount due | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/02-a-guest-applies-a-gift-card.png) |
| 3 | Placing an order with Check | A guest with the coffee maker chooses Check, agrees to the policies and places the order. Asserts the order placed page with its number, and Check with $94.99 under Payment; reloads and asserts both again | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/03-a-guest-places-an-order-with-check.png) |
| 4 | Placing an order with nothing to pay | A guest with the coffee maker enters E2E-GIFT-WHOLE. Asserts the gift card row -$94.99, "No payment required — your order is fully covered." and no Check to choose; places the order, and asserts the order placed page with "Gift card", "Applied $94.99" and no Check; reloads and asserts them again | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/04-a-guest-places-an-order-with-nothing-to-pay.png) |
| 5 | Choosing a saved address | A customer saves two addresses in the account's address book and goes to checkout, which opens on the newer one. Chooses the older one and asserts it checked and the newer not; waits for the choice to be saved, reloads and asserts the same | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/05-a-customer-chooses-another-saved-address.png) |
| 6 | Completing a signed-in checkout | A customer with no saved address goes to checkout. Asserts the account's email in the email field, locked; enters an address, pays with Check and places the order. Asserts "Thanks for your order, Grace!", the order number and the email; reloads and asserts them again; opens the order history and asserts the order is listed | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/06-a-signed-in-customer-completes-checkout.png) |
| 7 | Using checkout's address editor | A customer with one saved address opens it with Edit at checkout. Asserts the editor shows the address, changes its street and saves. Asserts the editor closes, the edited address is listed and chosen, and the old street is gone; waits for checkout to set it on the cart, reloads and asserts the same | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/07-a-customer-edits-a-saved-address-at-checkout.png) |
| 8 | Checkout showing tax | A guest with the E2E Taxed Mug. Asserts tax $1.60, subtotal $20.00, shipping $5.00 and total $26.60; reloads and asserts the tax and the total | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/08-checkout-shows-tax-on-a-taxed-product.png) |
| 9 | Checkout showing a second market's currency | A guest in the Spain market, `/es/en`, with the coffee maker and an address in Madrid. Asserts International Shipping at €18.00 chosen, subtotal €84.99, shipping €18.00 and a total of €102.99 in EUR; reloads and asserts the totals again | PASS | [PNG](evidence/2026-11-05-fb-19-platform-p9-part-5/screenshots/09-checkout-shows-a-second-market-s-currency.png) |

**SD-21.** The owner expected the signed-in tests to fail on SD-21 until its fix merged. The fix, storefront #26, merged on 2026-11-05 at 03:03 UTC, before these tests were written, so tests 5 to 7 ran on a storefront that holds it and passed. No failing result was produced, so none is kept. SD-21's own record is its thread's.

**What the screenshots show.** Each is the page where its test ended, after the reload: checkout for tests 1, 2, 5, 7, 8 and 9, the order placed page for tests 3 and 4, and the order history for test 6. They are of the window only, so a part the test asserted lower on the page may be out of view. The JSON files give each test's result and timing.

## 3. Functional verification, and what is not

| Kind | Tests | What they show |
|---|---|---|
| Functional verification | All nine | Each drives the running storefront against the running backend, with what the backend holds, and checks what was kept by reloading. No request is answered in the browser, except to stop one in the sabotaged run |
| Simulated coverage | None | |
| Source-reviewed only | None | |

The test data is not a shopper's action: the gift cards, the taxed product, its tax rate and the Spain market are added by the bootstrap through Spree's models, as the tests' other products are. Making them through the dashboard is part 4's and batch 9's.

## 4. Found while writing the tests

Recorded as the storefront at `ba6ddcd` and Spree at `68236c59` behave. Nothing was changed, and none is proposed here as a defect. Whether any becomes one is the owner's call, as for the behaviours batch 9 recorded.

- **Checkout opens on the address saved last.** With two saved addresses, the newer is listed first and chosen when checkout opens, and the storefront saves it on the cart. The customer chooses the other one if it is wanted.
- **A chosen address shows before it is saved.** Choosing a saved address marks it at once, while the storefront's request saving it is still on its way. A reload straight after the choice showed the address checkout opened with, though Spree then kept the choice. Seen once, in a try, when the test reloaded within a second of the choice.
- **A gift card payment's remainder.** Test 4's order placed page reads "Applied $94.99 — $0.00 remaining", the remainder of the store credit Spree made for the order, not of the card. This is batch 9's B18, held with row 36 of the owner decision brief. Test 4 asserts "Applied $94.99" only and leaves the remainder to that answer.
- **Codes in lower case.** Spree keeps coupon codes and gift card codes in lower case. The summary lists the coupon as "freeship" and the gift card as typed, "E2E-GIFT-PART". This is batch 9's B6 for coupons.

## 5. What this does not show

- **Real payment providers (P4, G-76).** Every order is paid with Check or a gift card. The Stripe method shows a connection error here because its keys are placeholders, and no test uses it. Stripe at checkout stays P4's.
- **Store credit at checkout.** The storefront has no control for it (batch 9's B7), and G-75 does not name it.
- **Tax included in prices.** Test 8 shows tax added to the price, for one rate in one country. Prices that include tax, which batch 9 captured (B13), are not tested.
- **A second language.** The Spain market has English as its only language, so test 9 shows euros in English. A second language at checkout stays G-80's.
- **Refusals (G-79, P10).** No test sends a request a shopper may not make, such as another guest's cart or another customer's address. Those stay with P10.
- **Tenant isolation.** Every test works in the default store. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- **Other browsers and window sizes.** Every run used Chromium at 1280 by 720 pixels, where the order summary is the side column. At phone widths it is folded under a button, which the tests do not open.
- **CI's exact setup.** The recorded runs used CI's Ruby, database and Playwright image, but Node 22 where CI uses Node 20, placeholder Stripe keys, and no retries where CI allows two. The pull request's CI run is recorded apart (§6.1).

**The capabilities and flows.** G-75 named the checkout steps batch 9 left without a browser test, for CAP-06-01, CAP-05-12, CAP-05-13, CAP-07-04, CAP-07-11, and FL-05, FL-16 and FL-17. This record adds those tests. It changes no capability's or flow's status: each row in LIQ-004 says what else it waits on, such as a real provider (P4), the refusals (P10), the order screens (batch 8) and tenant isolation.

## 6. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of these nine tests and their results, as recorded here. The owner did not review this work |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | Storefront #27's final commit, once every required check passed on it, and this pull request's final commit |
| Closed | **G-75**, under P9's criterion 7: each action it names has a test that passes |
| Not accepted here | Whether any behaviour of §4 is a defect, which is the owner's; and any change to a capability's status |

### 6.1 Storefront #27's checks

To be completed when storefront #27's checks finish and it merges.

What stays open:

- **P9's parts are all run.** Parts 2 to 5 merge in turn, each with its own record. P9 is complete once they have merged and G-84 has its answer: G-84 stays OPEN for SD-26 and SD-27, pending row 36 (part 4).
- **The refusals** stay with P10, G-79 among them.
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.

## 7. Evidence

The [evidence folder](evidence/2026-11-05-fb-19-platform-p9-part-5/) holds:

- `run1.json` and `run2.json`: each test's result, timing and retries in the two recorded runs, summarised from Playwright's report.
- `checks.json`: the sabotaged run's outcome for each test, with the assertion it failed at.
- `other-tests.json`: the storefront's other 22 browser tests, run once after the recorded runs.
- `screenshots/`: where each test ended in the second recorded run.

No machine path, key, token or password is recorded.
