---
title: Changing an address's state by name, merged, accepted and checked on main
record: verification
work_item: none; a defect in Spree's code found by FB-19's CI runs
date: 2026-11-02
verifier: Claude (automated session); not independent review
result: PASS for the merge commit, which holds exactly the reviewed revision; PASS for Tests on `main`, every engine's specs on PostgreSQL and MySQL, and for Packages there, with its six release jobs skipped as intended. The owner accepted the corrected fix on 2026-11-02, before the merge (§3)
---

# Changing an address's state by name, merged, accepted and checked on main

**Claim.** [#10](https://github.com/pateldhruval872/liquorify/pull/10), the fix for an address that kept its old state code when its state was changed by name, merged into `main` exactly as reviewed, and Spree's specs still pass on `main` with it. The owner accepted the corrected behaviour before the merge, and asked for that acceptance to be recorded here once the merge was checked (§3). It accepts this fix only. It changes no gap or defect decision, and no other part of Spree.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | The workflows that run on `main` for this change pass | PASS: Tests and Packages passed; Storybook did not run, as expected (§2) |
| 3 | The owner's acceptance is recorded | PASS: accepted on 2026-11-02 (§3) |

## 1. The merge commit

The owner merged #10 at 18:24 UTC on 2026-11-02. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#10](https://github.com/pateldhruval872/liquorify/pull/10) |
| Merged at | 18:24 UTC |
| Merge commit | `739e0ea` |
| Its parents | `d8506a6` (`main` before, the merge of batch 5's proposal, #33) and `d45bd04` (the pull request's final revision, with `main` at `d8506a6` merged in) |
| Tree | `b261bb8`, the same as `d45bd04` |
| Changed | 5 files: the fix in `spree/core/app/models/spree/address.rb`; its cases in `spree/core/spec/models/spree/address_spec.rb` and `spree/core/spec/services/spree/addresses/update_spec.rb`; [the fix's record](2026-10-21-address-state-by-name.md) and the README index under `liquorify/`. The fix's change since the owner's review is only the merge of `main`, which changed none of these files' lines |

## 2. Workflows on `main`

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Tests | The merge changed files under `spree/` | [41500258320](https://github.com/pateldhruval872/liquorify/actions/runs/41500258320) | PASS in 11 minutes: all 21 jobs, the two builds, Brakeman, and every engine's specs, core in three shards, on PostgreSQL and on MySQL |
| Packages | The merge changed files under `spree/core/app/` | [41500258342](https://github.com/pateldhruval872/liquorify/actions/runs/41500258342) | PASS in 9 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Storybook | Not run: it runs only on pull requests and when started by hand, and the merge changed nothing it builds | None | NOT_RUN, as expected |

## 3. The owner's answer, 2026-11-02

Before the merge, the owner reviewed the corrected fix and found its behaviour acceptable, and asked for the acceptance to be recorded after the merge was checked. What is accepted is this fix, as [its record](2026-10-21-address-state-by-name.md) describes it:

- A state name sent without a state code replaces the code the address holds when the name matches a subdivision of the address's country, or when the country changed.
- A state code the caller sends always keeps precedence, including the code the address already holds, with or without a name.
- A name that matches nothing in the same country leaves the code as it is.

The fix's [limitations](2026-10-21-address-state-by-name.md#6-limitations) stand: a code counts as sent until the address is saved or reloaded, and the other callers that write addresses through the model, checkout, the Store and Admin APIs and imports, rely on their own specs in CI. Liquorify now carries this change to Spree's address model, so a later Spree release that changes `normalize_state` has to be merged with it. No gap or defect decision changes, and tenant isolation stays NOT_RUN.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and the fix's record carry the acceptance, and no document's `status`, `approved_by` or `approved_at` changes.
