---
title: FB-19 catalog and pricing batch, part 1, merged and checked on main
record: verification
work_item: FB-19
date: 2026-11-03
verifier: Claude (automated session); not independent review
result: PASS for the merge commit, which holds exactly the reviewed revision; PASS for Storybook started by hand on `main`, all 1,616 comparisons; PASS for Packages on `main`, every job, with its six release jobs skipped as intended; Tests did not start, as expected. The owner accepted part 1's reference images, screen evidence and fidelity at `5f1a7c2` on 2026-11-02, before the merge, and answered G-53 to G-57. Neither the acceptance nor the merge closes a gap or changes a capability's result
---

# FB-19 catalog and pricing batch, part 1, merged and checked on main

**Claim.** [#34](https://github.com/pateldhruval872/liquorify/pull/34), part 1 of FB-19 batch 5, [catalog and pricing](../work-items/fb-19-batch-catalog-and-pricing.md), merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. The owner accepted part 1's reference images, screen evidence and fidelity at `5f1a7c2` before merging, within the documented limits, and answered its gaps G-53 to G-57 ([the part's record §11](2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#11-the-owners-review-2026-11-02)). With the merge, part 1 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition. It does not complete batch 5 or FB-19, and it closes no gap: the owner kept the existing gap and defect decisions as they were.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 1,616 of 1,616 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed every job, with its six release jobs skipped as intended; Tests did not start, because no file it watches changed (§2) |

## 1. The merge commit

The owner accepted part 1 at 22:04 UTC on 2026-11-02, at `5f1a7c2`, and asked for #34 to be marked ready. `75878c6` then recorded the acceptance and the gap answers, changing only records, and every required check passed on it. The owner merged #34 at 03:24 UTC on 2026-11-03. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#34](https://github.com/pateldhruval872/liquorify/pull/34) |
| Merged at | 03:24 UTC on 2026-11-03 |
| Merge commit | `5794da6` |
| Its parents | `bd594d9` (`main` before, the merge of #35) and `75878c6` (the pull request's final revision, which records the owner's review) |
| Tree | `9fa977c`, the same as `75878c6` |
| Changed | 1,360 files: 579 under `packages/liquorify-storybook/` and 779 under `liquorify/`; the Storybook workflow's time limit, from 30 to 45 minutes; and three lines of `pnpm-lock.yaml`, which record the Storybook package's development dependency `@hookform/resolvers` 5.9.1. Nothing in Spree's code changed: `git diff` between the merge's parents over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk` and `packages/admin-sdk` is empty |
| Since the owner's review | `75878c6` differs from `5f1a7c2` in nine record files under `liquorify/` and nothing else |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [41572244298](https://github.com/pateldhruval872/liquorify/actions/runs/41572244298) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 1,616 comparisons, for 808 stories in two modes, passed in the pinned image in 29.7 minutes |
| Packages | The merge changed `pnpm-lock.yaml` and files under `packages/` | [41572060999](https://github.com/pateldhruval872/liquorify/actions/runs/41572060999) | PASS in 9 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

The fidelity scripts, the comparison and FL-04's storefront check run locally against the browser tests' own servers, not in CI. Their runs are in [the part's record](2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#8-ci-runs-and-local-checks).

## 3. What the merge changes, and what it leaves open

- **Accepted:** part 1 as merged, at `5f1a7c2`, within its documented limits: its stories and reference images, the running-screen captures and the comparison evidence. The [image review list](2026-11-02-fb-19-batch-catalog-and-pricing-part-1-image-review.md) records every image as accepted. The acceptance changes no functional result.
- **Unlocked:** batch 5's part 2, whose detailed proposal comes first, then the owner's answers, then the build, as the owner asked on 2026-11-02, aligned with the project's baseline completion audit of the same day. Part 3 follows with the same steps. The platform batch's step [P8](../work-items/fb-19-batch-platform.md#p8-the-catalogs-untested-behaviours) can now run, in its own pull request, on the owner's instruction.
- **Still open, as the owner answered:** G-53 and G-57 are deferred, G-57 to P8, and the functional verification G-57 names stays open until the owner accepts P8's record. G-54 and G-55 are accepted within their limits: simulated interface states only, and source-reviewed coverage only, with no provider integration verified. G-56 is linked to G-11, and the catalog's server-refusal testing stays open there. CAP-05-02 and CAP-05-09 pass for the dashboard within their limits, CAP-05-11 stays PASS from P1, and CAP-05-01, CAP-05-03, CAP-05-06, CAP-05-07 and CAP-05-16 stay PARTIAL. Behaviours B1 to B19 stay recorded and not changed. SD-1 to SD-11 stay as LIQ-004 gives them, SD-8 open. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open.

**What this does not complete.** Batch 5 is complete only when parts 2 and 3 are built and accepted, and FB-19 only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify's own features stay deferred.
