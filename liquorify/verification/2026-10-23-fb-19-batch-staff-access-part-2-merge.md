---
title: FB-19 staff access batch, part 2, merged and checked on main
record: verification
work_item: FB-19
date: 2026-10-23
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 594 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected. The owner had accepted part 2's reference images and diagnostic fidelity, and answered its gaps, before the merge
---

# FB-19 staff access batch, part 2, merged and checked on main

**Claim.** [#14](https://github.com/pateldhruval872/liquorify/pull/14), part 2 of the [staff access and dashboard shell batch](../work-items/fb-19-batch-staff-access-and-shell.md), merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. The owner accepted part 2 and answered its gaps before merging ([part 2's record §11](2026-10-22-fb-19-batch-staff-access-part-2.md#11-the-owners-review-2026-10-23)), so with the merge, part 2 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition. That completes the batch's two parts. It does not complete FB-19, and it closes no further gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 594 of 594 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |

## 1. The merge commit

The owner merged #14 on 2026-10-23 at 19:34 UTC. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#14](https://github.com/pateldhruval872/liquorify/pull/14) |
| Merged at | 19:34 UTC |
| Merge commit | `3081c8b` |
| Its parents | `0965f32` (`main` before, #13's merge) and `32d6661` (the pull request's final revision, with the owner's acceptance and LIQ-004's reconciled progress tables) |
| Tree | `9e6a691`, the same as `32d6661` |
| Changed | 458 files, all under `packages/liquorify-storybook/` and `liquorify/`. Nothing in Spree's code, workflows or lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [40012667076](https://github.com/pateldhruval872/liquorify/actions/runs/40012667076) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 594 comparisons, for 297 stories in two modes, passed in the pinned image in 9.4 minutes |
| Packages | The merge changed files under `packages/` | [40012421633](https://github.com/pateldhruval872/liquorify/actions/runs/40012421633) | PASS in 16 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

The fidelity scripts run locally against the browser-test server, not in CI. Their last runs are in [part 2's record](2026-10-22-fb-19-batch-staff-access-part-2.md).

## 3. What the merge changes, and what it leaves open

- **Accepted:** part 2 as merged, with the owner's answers of 2026-10-23 on G-07 (CLOSED), G-19, G-20, G-21 and G-22 (ACCEPTED), and G-23 (linked to G-11), as [LIQ-004's gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) records them.
- **Unlocked:** batch 2, developer and integration settings, and batch 3, setup, stores and settings, which depend on part 2; and the platform batch's steps P3, which depends on part 2, and P6, which depends on its merge. P3 and P6 ran the same day ([P3's record](2026-10-23-fb-19-platform-p3.md), [P6's record](2026-10-23-fb-19-platform-p6.md)).
- **Still open:** CAP-04-05 stays PARTIAL until the owner accepts P6's record (G-22). G-11, which now also holds G-23's checks, G-16 and the other pending gaps stay PENDING. SD-1 to SD-4 stay open. Tenant isolation stays NOT_RUN.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merge, and no document's `status`, `approved_by` or `approved_at` changes.
