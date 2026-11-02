---
title: FB-19 staff access batch, part 1, merged and checked on main, and part 1 accepted
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 454 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected; the owner accepted part 1 and left its gaps, G-03 to G-10, pending
---

# FB-19 staff access batch, part 1, merged and checked on main, and part 1 accepted

**Claim.** [#11](https://github.com/pateldhruval872/liquorify/pull/11), part 1 of the [staff access and dashboard shell batch](../work-items/fb-19-batch-staff-access-and-shell.md), merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. The owner then accepted part 1, and chose to leave its gaps pending. That acceptance does not complete FB-19 or the batch, and it closes no gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 454 of 454 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |
| 4 | The owner answers whether merging #11 accepts part 1 and its gaps | Part 1 ACCEPTED on 2026-10-22 at 19:47 UTC; G-03 to G-10 stay PENDING (§3) |

## 1. The merge commit

The owner merged #11 on 2026-10-22. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#11](https://github.com/pateldhruval872/liquorify/pull/11) |
| Merged at | 19:37 UTC |
| Merge commit | `4a4940e` |
| Its parents | `496b8dc` (`main` before, #9's merge) and `493a8a6` (the pull request, with the refusal check corrected) |
| Tree | `6d9d5c2`, the same as `493a8a6` |
| Changed | 553 files, all under `packages/liquorify-storybook/` and `liquorify/`. Nothing in Spree's code, workflows or lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [39841894754](https://github.com/pateldhruval872/liquorify/actions/runs/39841894754) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 454 comparisons, for 227 stories in two modes, passed in the pinned image in 4.6 minutes |
| Packages | The merge changed files under `packages/` | [39841720936](https://github.com/pateldhruval872/liquorify/actions/runs/39841720936) | PASS: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

The refusal check, like the other fidelity scripts, runs locally against the browser-test server and not in CI. Its last runs are in the [part 1 record](2026-10-22-fb-19-batch-staff-access-part-1.md#refusal-check-correction-on-2026-10-22).

## 3. The owner's answer on part 1

On 2026-10-22 at 19:47 UTC, ten minutes after the merge, the owner answered the question "Does merging #11 also accept part 1 and its gap deferrals?" with "Accept part 1; gaps stay pending". With the merge and this answer recorded, part 1 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition: the owner merged it and the acceptance is recorded.

What the answer covers, and what it leaves open:

- **Accepted:** part 1 as merged: its 72 stories and 144 reference images, the eight screens captured in their states and permission variants, the comparison with running screens, the three staff emails, the three permission claims kept apart, the refusal check as corrected, the LIQ-010 0.4 amendment and LIQ-006's capability IDs.
- **Still PENDING:** each of part 1's gaps in the [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), G-03 to G-10, waits for its own answer. Accepting part 1 does not accept their deferrals. G-03 to G-05 also close only when the owner accepts the platform batch's mail check (#13).
- **Not part of this answer:** G-11, which #11 shares with #12, stays with #12. Tenant isolation stays NOT_RUN, an outstanding item rather than a gap.

**What follows.** Part 2, the shell and its overlays (DA-OVL-01 to DA-OVL-04, the template sidebars and 22 components), was to start once part 1 was accepted. It starts from `main` at `4a4940e`, with the corrections in the work item's §7.6.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The batch is complete only when part 2 is accepted as well. #12 with storefront #18, and #13, stay pending, each with its own acceptance. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the answer, and no document's `status`, `approved_by` or `approved_at` changes.
