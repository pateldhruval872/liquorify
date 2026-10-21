---
title: Changing an address's state by name keeps the old state code
record: verification
work_item: none; a defect in Spree's code found by FB-19's CI runs
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS locally and in CI for six regression cases, which fail without the proposed fix and pass with it; the fix changes Spree's behaviour and awaits the owner's review
---

# Changing an address's state by name keeps the old state code

**Claim.** When an address changes its state by name, without a state code, Spree keeps the code the address already holds whenever that code is also valid in the address's country. The address then shows the wrong state. The proposed fix makes the named state replace the old code. It is a change to Spree's behaviour, so it is proposed in its own pull request, separate from the pilot.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The defect is reproduced by cases that do not depend on a random country | PASS: four of the six new cases fail at `main` `e408a63` |
| 2 | The proposed fix makes every new case pass | PASS |
| 3 | The fix breaks no other address, state or country spec | PASS: 236 examples, 0 failures, 1 pending that was pending before |
| 4 | CI passes on the pull request | PASS at `10774ed`: [Tests](https://github.com/pateldhruval872/liquorify/actions/runs/39668752402), which runs every engine's specs on PostgreSQL and MySQL, and [Packages](https://github.com/pateldhruval872/liquorify/actions/runs/39668752680) |
| 5 | The owner accepts the change in behaviour | NOT_RUN: pending review |

## 1. How it was found

`PostgreSQL - core (1/3)` failed on [#6](https://github.com/pateldhruval872/liquorify/pull/6) at `d0898ad` and on [#9](https://github.com/pateldhruval872/liquorify/pull/9) at `e69b514`, in `spree/core/spec/services/spree/addresses/update_spec.rb` ("updates address"). It expected the Hungarian county Bács-Kiskun and got Nyíregyháza. A re-run passed. Neither pull request changes anything under `spree/` ([the comment on #6](https://github.com/pateldhruval872/liquorify/pull/6#issuecomment-6322907935)).

The address factory gives every address the United States and New York, whose code is `NY`. That spec moves the address to a random country from the test pool and names the new state without its code. `NY` is also Hungary's code for Nyíregyháza. When the random country is Hungary, `Spree::Address#normalize_state` finds the old code valid, keeps it and ignores the name. So the spec fails only on runs that pick Hungary.

## 2. What customers would see

An address moved from one country to another by state name, as a form for a country without state codes would send it, can keep a state from the old country's code. The same happens within one country: an address in New York renamed to California keeps `NY`.

## 3. The fix

In `Spree::Address#normalize_state`, before the held code is checked: when a state name is given and the code is not, the code is cleared if the name matches a subdivision of the address's country, or if the country changed. The existing steps then resolve the name to its code. Nothing changes when a code is sent, with or without a name, or when the name matches nothing in the same country.

## 4. Regression cases

All run without a random country. The first four fail without the fix.

| Case | Without the fix | With the fix |
|---|---|---|
| United States, New York, moved to Hungary by the name Bács-Kiskun | Keeps `NY` | `BK`, and the name is cleared |
| New York renamed to California, in the United States | Keeps `NY` | `CA` |
| Moved to Hungary with a name that matches nothing | Keeps `NY` | No code, the name kept |
| The address update service, moving New York to Bács-Kiskun | Keeps `NY` | `BK` |
| A name that matches nothing, in the same country | Keeps `NY` | Keeps `NY` |
| Moved to Hungary with both a code and a name | `BK` | `BK` |

The model cases are in `spree/core/spec/models/spree/address_spec.rb` ("changing the state by name") and the service case in `spree/core/spec/services/spree/addresses/update_spec.rb`.

## 5. Revisions and method

- **Base.** `main` at `e408a63`.
- **Run.** Spree core's test app on SQLite, built with `bundle exec rake test_app`. The new cases were run with the fix removed, then with it. Then the address, address service, state and country specs were run with the fix.

## 6. Limitations

- **Automated, not independent.** The same session found the defect, wrote the cases and wrote the fix.
- **SQLite locally.** CI ran the specs on PostgreSQL and MySQL too, once; the defect only appeared on runs that picked Hungary, so a single green run says little on its own, which is why the cases no longer pick a random country.
- **Other callers.** Checkout, the Store and Admin APIs and imports all write addresses through the model, so the fix reaches them; their own specs were left to CI.
