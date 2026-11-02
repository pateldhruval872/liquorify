---
title: FB-19 developer and integration settings batch, merged and checked on main
record: verification
work_item: FB-19
date: 2026-10-25
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 808 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected. The owner accepted the batch at `1166151`, for its documented Spree baseline scope, before the merge
---

# FB-19 developer and integration settings batch, merged and checked on main

**Claim.** [#16](https://github.com/pateldhruval872/liquorify/pull/16), batch 2 of FB-19, [developer and integration settings](../work-items/fb-19-batch-developer-and-integration-settings.md), merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. The owner accepted the batch at `1166151` before merging, for its documented Spree baseline scope, including its reference images and comparison evidence ([the batch record §11](2026-10-24-fb-19-batch-developer-settings.md#11-the-owners-review-2026-10-25)). With the merge, batch 2 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition. It does not complete FB-19, and it closes no gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 808 of 808 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |

## 1. The merge commit

The owner accepted the batch at 15:05 UTC on 2026-10-25 and merged #16 at 15:12 UTC. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#16](https://github.com/pateldhruval872/liquorify/pull/16) |
| Merged at | 15:12 UTC |
| Merge commit | `38597cd` |
| Its parents | `9aae2dd` (`main` before) and `1166151` (the pull request's final revision, with batch 2's checks recorded after the review corrections) |
| Tree | `0ad43ab`, the same as `1166151` |
| Changed | 685 files, all under `packages/liquorify-storybook/` and `liquorify/`. Nothing in Spree's code, workflows or lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [40205837698](https://github.com/pateldhruval872/liquorify/actions/runs/40205837698) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 808 comparisons, for 404 stories in two modes, passed in the pinned image in 14.6 minutes |
| Packages | The merge changed files under `packages/` | [40205812029](https://github.com/pateldhruval872/liquorify/actions/runs/40205812029) | PASS in 8 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

The fidelity scripts run locally against the browser-test server, not in CI. Their last runs are in [the batch record](2026-10-24-fb-19-batch-developer-settings.md#8-ci-runs-and-local-checks).

## 3. What the merge changes, and what it leaves open

- **Accepted:** batch 2 as merged, for its documented Spree baseline scope, with its reference images ([the image review](2026-10-24-fb-19-batch-developer-settings-image-review.md)) and comparison evidence.
- **Unlocked:** the platform batch's step P2, which waited for this batch ([the platform batch, P2](../work-items/fb-19-batch-platform.md#p2-keys-oauth-clients-the-agent-server-and-webhooks-used-from-outside)). It starts in a separate draft pull request.
- **Still open, as the owner asked:** G-24 to G-32 stay PENDING, CAP-04-06 to CAP-04-09 stay PARTIAL, and SD-5 stays open, with SD-1 to SD-4. G-11, G-16 and the other pending gaps stay PENDING. Tenant isolation stays NOT_RUN.
- **Tracked apart:** the gift card concurrency failure recorded at `2cdac50` ([the batch record §8](2026-10-24-fb-19-batch-developer-settings.md#8-ci-runs-and-local-checks)), where one run of Spree's own test came to 160.00 in store credits from one gift card worth 100.00 before a re-run passed, is investigated separately, with the failed run and its seed kept. It is not part of this batch's evidence.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merge, and no document's `status`, `approved_by` or `approved_at` changes.
