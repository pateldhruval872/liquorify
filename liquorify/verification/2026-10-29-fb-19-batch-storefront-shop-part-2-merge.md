---
title: FB-19 storefront shop batch, part 2, merged and checked on both main branches
record: verification
work_item: FB-19
date: 2026-10-29
verifier: Claude (automated session); not independent review
result: PASS for both merge commits, each holding exactly its pull request's final revision; PASS for Storybook started by hand on each `main`, 1,108 of 1,108 comparisons on the backend and 490 of 490 comparisons on the storefront; PASS for the storefront's CI on `main`, its end-to-end job included, 21 of 21 browser tests; PASS for Packages on the backend's `main`, and Tests did not start, as expected. Part 2's acceptance of 2026-10-29 was recorded before the merges and is not changed by them; it closes no gap, SD-8 to SD-11 stay open, tenant isolation stays NOT_RUN and G-52 stays open. Part 1's acceptance stays separate and pending
---

# FB-19 storefront shop batch, part 2, merged and checked on both main branches

**Claim.** Part 2 of the [storefront shop batch](../work-items/fb-19-batch-storefront-shop.md) merged into both `main` branches exactly as it was last revised: its records in backend [#26](https://github.com/pateldhruval872/liquorify/pull/26), and its stories, reference images and scripts in storefront [#21](https://github.com/pateldhruval872/liquorify-storefront/pull/21). Each repository's Storybook builds and passes its visual check on `main`, the storefront's CI passed there after the merge, its end-to-end job included, and the backend's Packages passed. This record covers the merges only, apart from acceptance, as part 1's merges were recorded. The owner accepted part 2's reference images, screen evidence and fidelity on 2026-10-29, before the merges ([part 2's record §15](2026-10-26-fb-19-batch-storefront-shop-part-2.md#15-the-owners-review-2026-10-29)), so part 2 is now merged and accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition. The merges close no gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each merge commit holds exactly its pull request's final revision | PASS (§1) |
| 2 | Storybook, started by hand on each `main`, builds the Storybook and passes every visual comparison | PASS: 1,108 of 1,108 on the backend and 490 of 490 on the storefront (§2) |
| 3 | The other workflows that run on each `main` for this change give the result expected from before the merge | PASS: the storefront's CI passed Lint, Type Check, Unit Tests and E2E, 21 of 21 browser tests; on the backend, Packages passed, and Tests did not start, because no file it watches changed (§2) |
| 4 | The owner's acceptance of part 2 | Recorded before the merges, on 2026-10-29, in [part 2's record §15](2026-10-26-fb-19-batch-storefront-shop-part-2.md#15-the-owners-review-2026-10-29); unchanged here (§3) |

## 1. The merge commits

The owner merged both pull requests on 2026-10-29, 13 seconds apart, after #28, part 1's merge record. Each merge commit's tree is identical to the tree of its pull request's final revision, so each `main` holds exactly that revision's files and nothing else.

| | Backend | Storefront |
|---|---|---|
| Pull request | [#26](https://github.com/pateldhruval872/liquorify/pull/26) | [#21](https://github.com/pateldhruval872/liquorify-storefront/pull/21) |
| Merged at | 19:07 UTC | 19:07 UTC |
| Merge commit | `0716245` | `8865498` |
| Its parents | `20eb2dc` (`main` before, #28's merge) and `d61ba14` (the pull request's final revision, which brought in `main` after #28 and recorded the owner's acceptance) | `1760ddd` (`main` before, #20's merge) and `4ee76ba` (the pull request's final revision, the comparison script's header correction) |
| Tree | `fb5471b`, the same as `d61ba14` | `8c04b20`, the same as `4ee76ba` |
| Changed | 436 files: 434 under `liquorify/`, 430 of them part 2's record, image review list and evidence, and 2 under `packages/liquorify-storybook/fidelity/`, batch 3's first-run check with its sample data run. Nothing in Spree's code, the Storybook's stories, workflows or lockfile changed | 189 files: 32 under `stories/` and 157 under `visual/`. The storefront's code, tests, messages, workflows and lockfile are unchanged: `git diff 1760ddd 8865498` over `src/`, `messages/`, `public/`, `e2e/`, `.github/`, `package.json` and `pnpm-lock.yaml` is empty |

## 2. Workflows on each `main`

Storybook runs only on pull requests and when started by hand, in both repositories, so it was started by hand on each `main` after the merges, at the merge commits.

| Repository | Workflow | Why it ran | Run | Result |
|---|---|---|---|---|
| Backend | Storybook | Started by hand on `main` at `0716245` | [40937420468](https://github.com/pateldhruval872/liquorify/actions/runs/40937420468) | PASS: built, and the token check and coverage report passed; all 1,108 comparisons passed in the pinned image in 18.3 minutes, the same 1,108 as after part 1's merge |
| Backend | Packages | The push to `main`: the merge changed files under `packages/` | [40937163561](https://github.com/pateldhruval872/liquorify/actions/runs/40937163561) | PASS: Typecheck, Test & Build, the SDK integration tests, the scaffolded app's checks and the dashboard's end-to-end tests in four shards passed; the release jobs were skipped, as on every push that releases nothing |
| Backend | Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and #26 changed neither | None | NOT_RUN, as expected. It passed on #26 at `d61ba14` ([40890383557](https://github.com/pateldhruval872/liquorify/actions/runs/40890383557)) |
| Storefront | CI | The push to `main` | [40937193933](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40937193933) | PASS: Lint, Type Check and Unit Tests, 260 in 35 files. [E2E](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40937193933/job/123670757847) ran all 21 browser tests in 2.0 minutes, and none failed. It booted Spree's published image, the default its compose file names, not Liquorify's backend (FB-06) |
| Storefront | Storybook | Started by hand on `main` at `8865498` | [40937426197](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40937426197) | PASS: all 490 comparisons passed in the pinned image in 4.9 minutes, the same 490 as on #21 at `c198b60`: part 2's 148 images and the 342 of the pilot, the accounts batch and part 1 |

The fidelity scripts, the capture and comparison scripts among them, run locally against lane A's servers, not in CI. Their last runs are in [part 2's record](2026-10-26-fb-19-batch-storefront-shop-part-2.md#12-ci-runs-and-local-checks).

## 3. What the merges change, and what they leave open

- **Merged and accepted.** The owner accepted part 2's reference images, its screen evidence and its fidelity, the corrected header captures included, within the documented limits, on 2026-10-29 before the merges, and every image in the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) reads ACCEPTED. The merges add nothing to that acceptance and take nothing from it.
- **Gaps unchanged.** The answers of 2026-10-27 stand as [part 2's record §11](2026-10-26-fb-19-batch-storefront-shop-part-2.md#11-gaps) gives them: G-46 and G-47 deferred, G-48 and G-51 accepted, G-49 linked to G-44, G-50 linked to G-11, and G-36 and G-38 open. G-52, the five shopper accounts batch comparisons that the storefront's header covers, stays open for follow-up. The merges close none of them.
- **Unchanged:** the capabilities part 2 maps keep the results [its record](2026-10-26-fb-19-batch-storefront-shop-part-2.md#2-the-batch-map-completed) gives them: CAP-05-01, CAP-05-04, CAP-05-14 and CAP-05-16 PARTIAL, CAP-03-03 and CAP-09-04 with a failing part. SD-8 to SD-11 stay open. Tenant isolation stays NOT_RUN, an outstanding item rather than a gap.
- **Part 1.** Its merges are recorded in [their own record](2026-10-27-fb-19-batch-storefront-shop-part-1-merge.md). Its acceptance, its reference images and G-41 to G-45 still wait for the owner's explicit answer. Since then, on 2026-10-30, the owner accepted part 1, with part 2's corrected comparison of the hero at 390 pixels, keeping G-41 to G-45 pending ([part 1's record §11](2026-10-26-fb-19-batch-storefront-shop-part-1.md#11-the-owners-review-2026-10-30)).

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. Checking the storefront against Liquorify's own backend stays FB-06, tenant isolation stays NOT_RUN as FB-03's validation, and the existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merges, and no document's `status`, `approved_by` or `approved_at` changes.
