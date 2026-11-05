# Evidence: SD-21 fixed, a signed-in customer completes checkout

The runs behind the [verification record](../../2026-11-05-sd-21-signed-in-checkout-fix.md). Local checkout and scratch paths are replaced with `<storefront checkout>`, `<checkout>` and `<scratch>`. CI's paths are GitHub's runner paths and are left as they are. No key or token is saved here. Each test signs up a new customer with a made-up `e2e-<time>-<random>@example.com` address, which the logs show.

Every run used the backend the storefront's browser tests pin, Liquorify `68236c5` in Spree Starter `a853a63`, with the Postgres database, production mode and seed steps of `scripts/e2e/`. The local runs and the CI runs are kept apart below because they differ in Ruby and in the Stripe keys.

## `local/`: this machine

Ruby 3.3.6 instead of CI's 4.0.5, because 4.0.5 could not be installed here; the host app's Ruby version was changed locally to match and not committed. Stripe's keys were placeholders, so Stripe's card form does not load. Chromium revision 1243, the machine's own, through a local Playwright setting that is not committed.

| File | What ran | Result |
|---|---|---|
| `1-before-fix.txt` | The two new tests at storefront `c2baa20`: the tests, before the fix | Both fail at the email field, which stays empty. The late-account test passes its first checks, an open and empty field while the account is held back, then fails once the account loads: the field locks and stays empty |
| `1-before-fix-saved-address.png`, `1-before-fix-late-account.png` | The checkout page each failing test left | The email field locked, empty and labelled "Using your account email address". With the saved address chosen, "Enter your shipping address to view available shipping methods" |
| `2-before-fix-without-email-checks.txt` | The same, with the two email checks taken out of a copy of the tests that was run once and not committed | Both fail later, waiting for a chosen delivery rate that never appears, because the address is never saved |
| `3-after-fix.txt` | The two new tests at `38ad098`, the fix | Both pass |
| `4-after-fix-all-browser-tests.txt` | All 23 browser tests at `38ad098` | 22 pass. The guest's Stripe test fails at Stripe's card form, because the keys are placeholders; it passed in CI with Stripe's test keys (`ci/`) |
| `4-guest-stripe-placeholder-keys.png` | The guest's Stripe test as it stopped locally | E2E Stripe chosen by default, with its card form not loaded. The address saved and three delivery rates offered |
| `5-orders.txt` | The orders in the local database after the runs | Each order the new tests placed is paid by Check, belongs to the customer who placed it and carries that customer's email; four orders, four customers. The runs before the fix placed none |

## `ci/`: GitHub Actions

Pull request [#26](https://github.com/pateldhruval872/liquorify-storefront/pull/26) in the storefront's repository, and its merge on `main`. Ruby 4.0.5, Stripe's test keys from the repository's secrets, `retries: 2`, one worker.

| File | What ran | Result |
|---|---|---|
| `1-c2baa20-browser-tests.txt` | All 23 browser tests at `c2baa20`, [run 41957152545](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41957152545) | 21 passed, the guest's Stripe test among them. Both new tests failed on all three tries at the email field: the saved-address test read a locked, empty field 63 or 64 times; the late-account test read an open, empty field 3 or 4 times, then a locked, empty one 59 to 61 times |
| `2-38ad098-browser-tests.txt` | All 23 browser tests at `38ad098`, [run 41958211670](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41958211670) | 23 passed, none retried |
| `3-ba6ddcd-main-browser-tests.txt` | All 23 browser tests on storefront `main` at `ba6ddcd`, #26's merge, whose tree is `38ad098`'s, [run 41959158297](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41959158297) | 23 passed, none retried |

The other checks on the same runs, read from GitHub:

| Check | `c2baa20` | `38ad098` |
|---|---|---|
| Lint | Passed | Passed |
| Type Check | Passed | Passed |
| Unit Tests | 1 failed of 265: the new address section test, "uses the account email once the account loads after checkout renders", expecting the account's email and receiving an empty field | 265 of 265 passed |
| Storybook and visual check, advisory | Passed | Passed |

On `main` at `ba6ddcd`, Lint, Type Check and Unit Tests passed too.
