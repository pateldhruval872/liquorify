---
title: FB-19 storefront shop batch, part 1, merged and checked on both main branches
record: verification
work_item: FB-19
date: 2026-10-27
verifier: Claude (automated session); not independent review
result: PASS for both merge commits, each holding exactly its pull request's final revision; PASS for Storybook started by hand on each `main`, 1,108 of 1,108 comparisons on the backend and 342 of 342 comparisons on the storefront; PASS for the storefront's CI on `main`, its end-to-end job included, 21 of 21 browser tests; Packages and Tests did not start on the backend for this merge, as expected. NOT_RUN: the owner's acceptance of part 1, which stays pending, apart from the merges, at the owner's instruction of 2026-10-27; G-41 to G-45 stay PENDING
---

# FB-19 storefront shop batch, part 1, merged and checked on both main branches

**Claim.** Part 1 of the [storefront shop batch](../work-items/fb-19-batch-storefront-shop.md) merged into both `main` branches exactly as it was last revised: its records in backend [#21](https://github.com/pateldhruval872/liquorify/pull/21), and its stories, reference images and scripts in storefront [#20](https://github.com/pateldhruval872/liquorify-storefront/pull/20). Each repository's Storybook builds and passes its visual check on `main`, and the storefront's CI passed there after the merge, its end-to-end job included. This record covers the merges only. On 2026-10-27 the owner asked that they be recorded apart from acceptance, and that part 1's acceptance and its unresolved gap decisions stay pending until the owner answers them explicitly. So part 1 is merged and not accepted, under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition, and this closes no gap.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each merge commit holds exactly its pull request's final revision | PASS (§1) |
| 2 | Storybook, started by hand on each `main`, builds the Storybook and passes every visual comparison | PASS: 1,108 of 1,108 on the backend and 342 of 342 on the storefront (§2) |
| 3 | The other workflows that run on each `main` for this change give the result expected from before the merge | PASS: the storefront's CI passed Lint, Type Check, Unit Tests and E2E, 21 of 21 browser tests; on the backend, Packages and Tests did not start for #21's merge, because no file they watch changed (§2) |
| 4 | The owner's acceptance of part 1 and answers on its gaps | NOT_RUN: pending until the owner answers explicitly, at the owner's instruction of 2026-10-27 (§3) |

## 1. The merge commits

The owner merged both pull requests on 2026-10-27, a minute apart. Each merge commit's tree is identical to the tree of its pull request's final revision, so each `main` holds exactly that revision's files and nothing else.

| | Backend | Storefront |
|---|---|---|
| Pull request | [#21](https://github.com/pateldhruval872/liquorify/pull/21) | [#20](https://github.com/pateldhruval872/liquorify-storefront/pull/20) |
| Merged at | 00:26 UTC | 00:27 UTC |
| Merge commit | `c8567a0` | `1760ddd` |
| Its parents | `d5a5661` (`main` before, #20's lanes record) and `8864f60` (the pull request's final revision, which brought in `main` after #20, #23 and #25 and changed none of part 1's own changes) | `321fa1c` (`main` before, #19's merge) and `da06743` (the pull request's one commit) |
| Tree | `c84ecac`, the same as `8864f60` | `bebd3b7`, the same as `da06743` |
| Changed | 262 files, all under `liquorify/`. Nothing in Spree's code, the packages, workflows or lockfile changed | 136 files: 2 under `.storybook/`, 29 under `stories/` and 105 under `visual/`. The storefront's code, tests, messages, workflows and lockfile are unchanged: `git diff 321fa1c 1760ddd` over `src/`, `messages/`, `public/`, `e2e/`, `.github/`, `package.json` and `pnpm-lock.yaml` is empty |

## 2. Workflows on each `main`

Storybook runs only on pull requests and when started by hand, in both repositories, so it was started by hand on each `main` after the merges. On the backend it ran at `69da903`, after platform step P7's merge (#22) at 01:35 UTC. #22 changed P7's records and its refusal checks in `packages/liquorify-storybook/fidelity/`, which the Storybook neither builds nor runs, and no story, Spree code or workflow, so the run covers the stories `c8567a0` has.

| Repository | Workflow | Why it ran | Run | Result |
|---|---|---|---|---|
| Backend | Storybook | Started by hand on `main` at `69da903` | [40433775081](https://github.com/pateldhruval872/liquorify/actions/runs/40433775081) | PASS: built, and the token check and coverage report passed; all 1,108 comparisons passed in the pinned image in 19.9 minutes |
| Backend | Packages | Did not start for #21's merge: it runs on `main` only when files under `packages/`, parts of `spree/` and `docs/`, or the workspace's build files change, and the merge changed none of them | None | NOT_RUN, as expected. It ran for #22's merge, which changed `packages/` ([40433522854](https://github.com/pateldhruval872/liquorify/actions/runs/40433522854)); that run belongs to P7's record |
| Backend | Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and neither #21 nor #22 changed one | None | NOT_RUN, as expected |
| Storefront | CI | The push to `main` | [40426487997](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40426487997) | PASS: Lint, Type Check and Unit Tests, 258 in 35 files. [E2E](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40426487997/job/121933417724) ran all 21 browser tests in 2.5 minutes, and none failed. It booted Spree's published image, the default its compose file names, not Liquorify's backend (FB-06) |
| Storefront | Storybook | Started by hand on `main` at `1760ddd` | [40433777470](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40433777470) | PASS: all 342 comparisons passed in the pinned image in 3.3 minutes, the same 342 as on #20 at `da06743` |

The fidelity scripts, the capture and comparison scripts among them, run locally against lane A's servers, not in CI. Their last runs are in [part 1's record](2026-10-26-fb-19-batch-storefront-shop-part-1.md#8-ci-runs-and-local-checks).

## 3. What the merges change, and what they leave open

- **Merged, not accepted.** The owner merged both pull requests and asked, on 2026-10-27, that the merges be recorded apart from acceptance. Part 1's acceptance, its 98 reference images in the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-1-image-review.md), whose review stays NOT_RUN, and the diagnostic fidelity of its comparison all wait for the owner's explicit answer. Since then, on 2026-10-30, the owner accepted them, within the documented limits and with part 2's corrected comparison of the hero at 390 pixels, closing no gap ([part 1's record §11](2026-10-26-fb-19-batch-storefront-shop-part-1.md#11-the-owners-review-2026-10-30)).
- **Still PENDING,** and still after the acceptance of 2026-10-30: G-41 to G-45, each waiting for its own answer in the [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), and G-02, with what part 1 showed for it noted there. The merges close none of them.
- **Unchanged:** the capabilities part 1 maps, CAP-05-17 and the storefront's parts of CAP-03-07, CAP-03-08, CAP-03-09 and CAP-05-14, keep the results [its record](2026-10-26-fb-19-batch-storefront-shop-part-1.md#2-the-batch-map-completed) gives them. The existing defects SD-1 to SD-7 stay open. Tenant isolation stays NOT_RUN, an outstanding item rather than a gap.
- **What follows.** Part 2's two pull requests, built on part 1's branches at the owner's choice, now target `main`, with `main` brought in, and their checks ran again: storefront [#21](https://github.com/pateldhruval872/liquorify-storefront/pull/21) at `e84ea41`, and backend [#26](https://github.com/pateldhruval872/liquorify/pull/26), brought up to date again after #22's merge. Both stay drafts, with their own review.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. Checking the storefront against Liquorify's own backend stays FB-06, tenant isolation stays NOT_RUN as FB-03's validation, and the existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merges, and no document's `status`, `approved_by` or `approved_at` changes.
