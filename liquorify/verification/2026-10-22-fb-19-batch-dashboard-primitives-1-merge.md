---
title: FB-19 dashboard primitives, part 1, merged and checked on main, and G-01's deferral accepted
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 310 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected; the owner accepted G-01's deferral, and every other gap stays pending
---

# FB-19 dashboard primitives, part 1, merged and checked on main, and G-01's deferral accepted

**Claim.** [#9](https://github.com/pateldhruval872/liquorify/pull/9), the stories for 24 dashboard primitives, merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. The owner then accepted the deferral of G-01, the batch's one open gap. That acceptance does not complete FB-19, and it closes no other gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 310 of 310 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |
| 4 | The owner answers G-01 | ACCEPTED on 2026-10-22 at 16:19 UTC (§3) |

## 1. The merge commit

The owner merged #9 on 2026-10-22. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#9](https://github.com/pateldhruval872/liquorify/pull/9) |
| Merged at | 16:16:55 UTC |
| Merge commit | `496b8dc` |
| Its parents | `a4a1708` (`main` before) and `79f22ac` (the pull request, with the capture correction) |
| Tree | `147ccba`, the same as `79f22ac` |
| Changed | 473 files, all under `packages/liquorify-storybook/` and `liquorify/`. Nothing in Spree's code, workflows or lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [39812845791](https://github.com/pateldhruval872/liquorify/actions/runs/39812845791) | PASS: the Storybook built, the token and inventory checks and the coverage report ran (155 stories), and all 310 comparisons passed in the pinned image |
| Packages | The merge changed files under `packages/` | [39812693118](https://github.com/pateldhruval872/liquorify/actions/runs/39812693118) | PASS: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

## 3. The owner's answer on G-01

On 2026-10-22 at 16:19 UTC, three minutes after the merge, the owner answered the question "Does merging #9 also accept G-01's deferral?" with "Yes, accept G-01's deferral". The owner had chosen on 2026-10-22 to answer the deferred gaps pull request by pull request, and G-01 is #9's only gap. With the merge and this answer recorded, #9 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition: the owner merged it and the acceptance is recorded.

What is accepted is G-01 as the [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) states it:

- 83 of the 114 primitive stories are checked against their source only, stories of the alert and the slot among them ([fidelity record §3](2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity.md#3-coverage-gaps-and-what-was-checked-instead));
- 82 remain once #11 compares the destructive alert with the sign-in page;
- later batches compare each state when one of their running screens shows it, and what no stock screen shows stays checked against its source.

Every other gap in the register, G-02 to G-18, stays PENDING. G-10 and G-17 are proposed on the same terms as G-01, but they belong to other pull requests, so this answer does not cover them.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. With the pilot and #9, 27 of the 46 dashboard primitives have stories. #11, #12 with storefront #18, and #13 stay pending, each with its own acceptance. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and the gap register carry the answer, and no document's `status`, `approved_by` or `approved_at` changes.
