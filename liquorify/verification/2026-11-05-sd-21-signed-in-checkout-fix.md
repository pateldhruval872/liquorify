---
title: SD-21 fixed, a signed-in customer completes checkout, merged with its delegated acceptance
record: verification
work_item: SD-21 (defect); FB-19 batch 9's CAP-06-01 and FL-05
date: 2026-11-05
verifier: Claude (automated session, thread "Fix signed-in checkout (SD-21)"); not independent review
result: PASS for all five of SD-21's closure conditions (owner's answer to row 34). Against the pinned Liquorify backend, two new browser tests of a signed-in checkout, one with the account's loading held back and the cart's email empty, failed before the fix, locally and in CI on all three tries, where SD-21 says. With the fix, both pass, locally and in CI, and each order is paid, linked to the customer who placed it and listed in that customer's order history. The guest's Stripe checkout test passed in CI before and after the fix. Storefront pull request 26 merged under the owner's delegation as `ba6ddcd`, holding exactly its final commit `38ad098`, after every check passed on it, and the storefront's CI passed on `main` at `ba6ddcd`, all 23 browser tests among it. SD-21 is CLOSED by delegated acceptance, not the owner's review. Real-provider verification stays with P4, G-73 and G-75 stay open, and tenant isolation stays NOT_RUN
---

# SD-21 fixed: a signed-in customer completes checkout

**Claim.** SD-21, found in batch 9, stopped every signed-in customer at checkout ([LIQ-004](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline); [batch 9 §9](2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#9-defects-found)). On 2026-11-04 the owner brought its fix forward, in its own bounded storefront pull request, on five conditions ([the owner's answer to row 34, §2](2026-11-04-owner-decision-brief-answers-3.md#2-work-items-and-closure-conditions)). The fix is in [storefront #26](https://github.com/pateldhruval872/liquorify-storefront/pull/26). This record keeps the runs before and after it, locally and in CI, shows each condition met, and records the merge as delegated acceptance.

**Revisions.**

| What | Revision |
|---|---|
| The storefront before the fix | `main` at `ad77c3d`, storefront #23's merge. The checkout code is the same as at `8865498`, where batch 9 found SD-21 |
| The tests, before the fix | `c2baa20`, the pull request's first commit. It adds the tests and changes no storefront code |
| The fix | `38ad098`, the pull request's second and final commit. It changes only `src/components/checkout/AddressSection.tsx` |
| The merge | Storefront `main` at `ba6ddcd` |
| The backend the browser tests ran against | Liquorify `68236c5`, in Spree Starter `a853a63`, as the storefront's `e2e-backend/liquorify-backend.env` pins them (FB-06) |

## 1. The cause and the fix

**The cause.** Checkout's email field took its first value from the cart's email, or the account's, once, when the page first rendered. The account loads in the browser after that. A cart made while signed in has no email of its own: Spree's cart creation does not copy the customer's email onto the cart, and only joining a guest's cart to an account does. So the field's value was empty. Once the account loaded, the field locked, because the account has an email, and it stayed empty. Checkout saves the shipping address only with an email, so the address was never saved, no delivery rate was offered and the order could not be placed.

**The fix.** The field now shows the account's email whenever the account has loaded, instead of a copy taken before it loaded. Anyone else, a guest or a customer whose account has not loaded yet, still types an email. Once the account's email arrives, checkout saves the first saved address with it, as it was meant to on opening. Nothing else in checkout, the account or the backend changes. It is the cause of SD-21, not a change in a test.

**The tests.**

- `e2e/customer-checkout.spec.ts`, two new browser tests. Each signs up a new customer, adds a product from the product page and goes to checkout from the cart drawer, pays with Spree's Check method and places the order. It then checks the order placed page and finds the order in the account's order history.
  - "a customer places an order to their saved address" first saves an address in the address book. Checkout must show the account's email, locked, and the saved address chosen. The order placed page must greet the customer by name.
  - "a customer places an order when their account loads late" holds back the request that loads the account until checkout is on screen. While it is held, the field must be open and empty: the cart, made while signed in, has no email. Once the account loads, the field must show the account's email, locked. The customer then types a new address.
- A unit test of the address section, with the same order of events: the account arrives after checkout renders, and checkout saves the saved address with its email.
- `scripts/e2e/bootstrap-spree.sh` turns on Spree's Check method at checkout, after the Stripe gateway, so no payment provider is involved in the new tests. The guest's Stripe test still opens on Stripe's form, and is unchanged.
- The address book and checkout address steps move into `e2e/support.ts` for the tests to share. The account and guest checkout tests that used them are otherwise unchanged.

## 2. SD-21's closure conditions

| # | Condition (owner's answer to row 34, §2) | Result |
|---|---|---|
| 1 | **A failing test first.** A browser regression test signs a customer in and checks out with the account's loading delayed and the cart's email empty, shown to fail at the storefront's revision before the fix | **PASS.** The late-account test holds back the account's loading and checks that the email field is then empty, because the cart has no email. At `c2baa20`, before the fix, it failed where SD-21 says, locally (§3) and in CI on all three tries (§4). The field was open and empty while the account was held back, then locked and empty once it loaded. The saved-address test failed in the same way |
| 2 | **The cause is fixed**, not worked around in the test | **PASS.** The fix is one change to the address section (§1). The tests are the same at `c2baa20` and `38ad098`, and they pass only with the fix. With the email checks taken out, the tests failed later before the fix, at the delivery rates, which shows the empty email was what stopped checkout (§3) |
| 3 | **The customer completes checkout** against the pinned Liquorify backend, and the order is linked to that customer | **PASS.** At `38ad098` both tests placed their orders and found them in the account's order history, locally (§3) and in CI (§4). Locally, the database shows each of the four orders the tests placed is paid by Check, belongs to the customer who placed it and carries that customer's email (§5) |
| 4 | **Guest checkout still works**: the storefront's existing guest checkout tests still pass | **PASS in CI**, where Stripe's test keys are set: the guest's Stripe checkout test, the storefront's only guest checkout test, passed at `c2baa20` and at `38ad098` (§4). Locally it failed at Stripe's card form before it reached payment, because the keys there are placeholders (§3) |
| 5 | **Merging** under the delegation once the agreed checks pass on its final commit, recorded as delegated acceptance | **PASS.** Every check passed on `38ad098`, and #26 merged as `ba6ddcd` (§6). This record is its delegated acceptance |

## 3. Local runs

Local runs used the pinned backend, started with the storefront's own `scripts/e2e/` steps on a local Postgres. There are three differences from CI. Ruby was 3.3.6 instead of 4.0.5, because 4.0.5 could not be installed here; the host app's Ruby version was changed locally to match and not committed. Stripe's keys were placeholders. Chromium was the machine's own, revision 1243, through a local Playwright setting.

| Run | Storefront | Result |
|---|---|---|
| 1. The two new tests | `c2baa20`, before the fix | Both failed at the email field. The saved-address test read an open, empty field 4 times, then a locked, empty one 59 times. The late-account test passed its checks while the account was held back, then read the same field locked and empty once it loaded. Screenshots of both show "Using your account email address" under an empty, locked field. With the saved address chosen, "Enter your shipping address to view available shipping methods" |
| 2. The same, with the email checks taken out | `c2baa20`, before the fix | Both failed later, waiting for a chosen delivery rate that never appeared. This copy of the tests was run once and not committed |
| 3. The two new tests | `38ad098`, the fix | Both passed, in 36.6 and 34.3 seconds |
| 4. All 23 browser tests | `38ad098`, the fix | 22 passed. The guest's Stripe test failed at Stripe's card form, which does not load with placeholder keys. By then its address was saved and three delivery rates were offered |
| The address section's unit test | Before and after the fix | Failed before, passed after. Lint, the type check, all 265 unit tests and the locale check passed at `38ad098` |

## 4. CI runs

The storefront's CI ran on both commits of #26, against the same pinned backend, with Ruby 4.0.5, Stripe's test keys from the repository's secrets, two retries and one worker. Lint, Type Check and Unit Tests are the required checks. `E2E (Playwright + Spree)` is advisory in branch protection, as agreed, but conditions 1, 3 and 4 rest on it, so the merge waited for it. The Storybook and visual check is advisory.

| Run | Revision | Result |
|---|---|---|
| [CI 41957152545](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41957152545) | `c2baa20`, the tests | As expected before the fix. **E2E**: 21 of 23 passed, the guest's Stripe test among them. Both new tests failed on all three tries at the email field. The saved-address test read a locked, empty field 63 or 64 times. The late-account test read an open, empty field 3 or 4 times, then a locked, empty one 59 to 61 times. **Unit Tests**: 264 of 265; the new address section test failed, expecting the account's email and receiving an empty field. **Lint** and **Type Check** passed |
| [Storybook 41957152491](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41957152491) | `c2baa20` | Passed |
| [CI 41958211670](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41958211670) | `38ad098`, the fix | Passed. **E2E**: all 23 browser tests, with no retry, in 2.4 minutes. **Unit Tests**: all 265. **Lint** and **Type Check** passed |
| [Storybook 41958211635](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41958211635) | `38ad098` | Passed. The fix changes no story or reference image |
| [CI 41959158297](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41959158297), on the push to `main` | `ba6ddcd`, the merge | Passed, 03:03 to 03:08 UTC: Lint, Type Check, Unit Tests, and all 23 browser tests with no retry, in 3.0 minutes. Its Storybook workflow runs on pull requests and by hand only |

A comment on #26 said, before the fix was pushed, that the first CI run was expected to fail.

## 5. The orders and their customers

The browser tests check what a customer sees: the order placed page, and the order in the account's order history, which lists only that customer's orders. The local database was also read after the runs. It shows what the tests cannot see ([`local/5-orders.txt`](evidence/2026-11-05-sd-21-signed-in-checkout-fix/local/5-orders.txt)):

| Order | Run | Customer | Order's email is the customer's | Paid by | Shipped to |
|---|---|---|---|---|---|
| R1003 | 3, saved address | Ada Lovelace, signed up in that test | Yes | Check, completed | 12 Difference Engine Row, the saved address |
| R1004 | 3, account loading late | Alan Turing, signed up in that test | Yes | Check, completed | 123 Test St, typed at checkout |
| R1005 | 4, saved address | Ada Lovelace, a new customer of the same name | Yes | Check, completed | 12 Difference Engine Row |
| R1006 | 4, account loading late | Alan Turing, a new customer of the same name | Yes | Check, completed | 123 Test St |

The four orders belong to four different customers, and each customer has exactly one completed order. The runs before the fix placed none. R1001 and R1002 are Spree's sample orders. The CI database is discarded with its runner, so in CI the link to the customer rests on the order history, as the tests check it.

## 6. The delegated acceptance and the merge

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)), with the owner's instruction for row 34 to merge the fix under the delegation once the agreed checks pass. The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Fix signed-in checkout (SD-21)" |
| Revision | Storefront #26's final commit, `38ad098` |
| Scope | Technical acceptance of SD-21's fix against the five conditions of §2, as this record gives them |
| Not accepted here | Any answer to a gap, any exception or security risk, and the statuses below that stay as they are |

**The merge.** Storefront `main` at `ba6ddcd`, "Merge pull request #26", merged at 03:03 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `ad77c3d` and #26's final commit `38ad098`. Its tree is the same as `38ad098`'s, so it holds exactly the accepted revision. It changed seven files: `src/components/checkout/AddressSection.tsx`, its new unit test, the three browser test files and their shared steps in `e2e/`, and `scripts/e2e/bootstrap-spree.sh`.

## 7. What changes, and what stays open

- **SD-21 is CLOSED** on passing evidence for its five conditions, by delegated acceptance, not the owner's review. It was not reported to Spree, by the owner's standing instruction (decisions 21 and 37).
- **CAP-06-01** stays PARTIAL, without SD-21 as a failing part: a signed-in customer's checkout now completes in the browser tests. Its other open parts stay open. Real-provider checks belong to P4, and G-75 lists the rest.
- **FL-05**, the checkout flow, is no longer failing on its signed-in path. Its saved address, a typed address, Check and the order history are now covered by these tests against the pinned backend. Its coupon, gift card, address editor, tax and second-market steps stay as G-75 records them.
- **G-75**, browser tests for checkout's other actions, stays with P9 item 1.5 and stays open. Its signed-in tests can now run. These two tests cover a signed-in checkout, a saved address and an order paid with Check. Whether they count toward G-75's closing condition, two runs in a row at a recorded revision, is for P9 to record.
- **G-73**, the stories not compared with a running screen, stays open. Its signed-in stories can now be compared. SF-CHK-03's greeting by name was checked by the first test, but no capture was taken for batch 9's image review list.
- **Real-provider verification** stays with P4. The new tests pay with Check. The guest's Stripe test runs in Stripe's test mode, as before.
- **Tenant isolation** stays NOT_RUN, with ISO-1 to ISO-7 open. SD-21 was never a security or tenant-isolation finding.
- **Statuses are unchanged** otherwise. Batch 9's work item stays PROPOSED, and LIQ-004 stays DRAFT.

## 8. Limitations

- **Local and CI differ.** The local runs used Ruby 3.3.6, placeholder Stripe keys and the machine's Chromium. CI used Ruby 4.0.5, Stripe's test keys and Playwright's own Chromium. Locally the guest's Stripe test could not reach payment, so condition 4 rests on CI.
- **The account's loading was held back by the test.** The test holds the server action that loads the account until checkout is on screen. That reproduces the order of events batch 9 saw, but not a slow network or server.
- **One market and one language.** The tests ran in the United States market, in English and US dollars.
- **A cart that already carries the customer's email**, such as a guest's cart joined to the account on signing in, was not run. The fix shows the account's email in either case.
- **The orders' link to their customers** was read from the database locally only (§5).
- **Runs after the fix.** The new tests passed once locally at `38ad098`, and twice in CI on the same files: at `38ad098`, then on `main` at `ba6ddcd`, whose tree is the same (§4). Whether those two count as G-75's two runs in a row is for P9 to record.

## 9. Searches of the pull requests

Every line storefront #26 adds was searched for `sk_`, `pk_`, `token`, `password`, `secret`, `/home/`, `/tmp/`, `/root/` and `/Users/`, ignoring case. Nothing matched. The tests make up their customers' email addresses and passwords, which are not saved. Every line this records pull request adds was searched for the same words. The only matches are prose in this record and the evidence's README that names the search, the keys or the repository's secrets they come from; two test titles about passwords in the local logs; and CI's runner paths under `/home/runner/`, which GitHub's logs print. The local logs had their checkout and scratch paths replaced.

## 10. Evidence

[`evidence/2026-11-05-sd-21-signed-in-checkout-fix/`](evidence/2026-11-05-sd-21-signed-in-checkout-fix/README.md) holds the local logs and screenshots before and after the fix, the orders read from the local database, and the CI log of the tests failing before the fix and of all 23 passing with it.
