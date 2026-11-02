---
title: FB-19 storefront shopper accounts batch, merged and checked on both main branches, and the batch accepted
record: verification
work_item: FB-19
date: 2026-10-23
verifier: Claude (automated session); not independent review
result: PASS for both merge commits; PASS for Storybook started by hand on each `main`, 454 of 454 comparisons on the backend and 244 of 244 on the storefront; PASS for the storefront's CI on `main`, its end-to-end job included, 21 of 21 browser tests; Packages and Tests did not start on the backend, as expected; the owner accepted the batch and left its gaps, G-11 to G-17, pending
---

# FB-19 storefront shopper accounts batch, merged and checked on both main branches, and the batch accepted

**Claim.** The [storefront shopper accounts batch](../work-items/fb-19-batch-storefront-shopper-accounts.md) merged into both `main` branches exactly as reviewed: its records in backend [#12](https://github.com/pateldhruval872/liquorify/pull/12), and its stories, images and scripts in storefront [#18](https://github.com/pateldhruval872/liquorify-storefront/pull/18). Each repository's Storybook builds and passes its visual check on `main`, and the storefront's CI passed there after the merge, its end-to-end job included. The owner then accepted the batch, and chose to leave its gaps pending. That acceptance does not complete FB-19. This closes no gap: G-11 to G-17 stay PENDING, G-18 was closed before the merge, FB-06 stays open, and SD-1 and SD-2 stay Open and High.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on each `main`, builds the Storybook and passes every visual comparison | PASS: 454 of 454 on the backend and 244 of 244 on the storefront (§2) |
| 3 | The other workflows that run on each `main` for this change give the result expected from before the merge | PASS: the storefront's CI passed Lint, Type Check, Unit Tests and E2E, 21 of 21 browser tests; on the backend, Packages and Tests did not start, because no file they watch changed (§2) |
| 4 | The owner answers whether merging #12 and #18 accepts the batch | Batch ACCEPTED on 2026-10-23 at 13:43 UTC; G-11 to G-17 stay PENDING (§3) |

## 1. The merge commits

The owner merged both pull requests on 2026-10-23, a minute apart. Each merge commit's tree is identical to the tree of its pull request's final revision, so each `main` holds exactly what was reviewed and nothing else.

| | Backend | Storefront |
|---|---|---|
| Pull request | [#12](https://github.com/pateldhruval872/liquorify/pull/12) | [#18](https://github.com/pateldhruval872/liquorify-storefront/pull/18) |
| Merged at | 13:15 UTC | 13:16 UTC |
| Merge commit | `1a70936` | `93e2f11` |
| Its parents | `4a4940e` (`main` before, #11's merge) and `a4ec714` (the pull request, with G-18's closure) | `8153a6b` (`main` before, the pilot's merge) and `2e5f119` (the pull request, with the capture correction) |
| Tree | `4199cf8`, the same as `a4ec714` | `876599d`, the same as `2e5f119` |
| Changed | 259 files, all under `liquorify/`. Nothing in Spree's code, workflows or lockfile changed | 267 files, all under `.storybook/`, `stories/` and `visual/`. The storefront's code, tests, workflows and lockfile are unchanged |

## 2. Workflows on each `main`

Storybook runs only on pull requests and when started by hand, in both repositories, so it was started by hand on each `main` after the merges.

| Repository | Workflow | Why it ran | Run | Result |
|---|---|---|---|---|
| Backend | Storybook | Started by hand | [39960585181](https://github.com/pateldhruval872/liquorify/actions/runs/39960585181) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 454 comparisons passed in the pinned image in 5.7 minutes. #12 changed no story, so this is the same set as after #11's merge |
| Backend | Packages | Did not start: it runs on `main` only when files under `packages/`, parts of `spree/` and `docs/`, or the workspace's build files change, and the merge changed none of them | None | NOT_RUN, as expected |
| Backend | Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes | None | NOT_RUN, as expected |
| Storefront | Storybook | Started by hand | [39960907979](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39960907979) | PASS: all 244 comparisons passed in the pinned image in 2.3 minutes, the same 244 as on #18 |
| Storefront | CI | The push to `main` | [39959790431](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39959790431) | PASS: Lint, Type Check and Unit Tests. [E2E](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39959790431/job/120434595392) ran all 21 browser tests in 2.5 minutes, and none failed, was retried or was skipped. It booted Spree's published `ghcr.io/spree/spree:latest` image, the default its compose file names, not Liquorify's backend (FB-06) |

This is the first end-to-end run on the storefront's `main` to pass since the pilot's merge, whose record found it stopping at the Stripe keys check (OA-1). The run on #18 that closed G-18 is in the [batch's record](2026-10-22-fb-19-batch-storefront-shopper-accounts.md#8-ci-runs-and-local-checks).

## 3. The owner's answer on the batch

On 2026-10-23 at 13:43 UTC, about half an hour after the merges, the owner answered the question "Does merging #12 and #18 also accept the shopper accounts batch?" with "Accept the batch; gaps stay pending". With the merges and this answer recorded, the batch counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition: the owner merged it and the acceptance is recorded.

What the answer covers, and what it leaves open:

- **Accepted:** the batch as merged: its map, its 103 stories and 206 reference images, the ten account screens captured for four kinds of visitor, the comparison with running screens, the two password reset emails, the three claims kept apart, and the eleven behaviours of the storefront recorded and not changed.
- **Still PENDING:** each of the batch's gaps in the [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), G-11 to G-17, waits for its own answer. Accepting the batch does not accept their deferrals. G-15 and G-16 also close only when the owner accepts the platform batch's mail check (#13).
- **Already closed:** G-18, which the owner closed earlier the same day on the end-to-end run at `2e5f119`. Checking the storefront against Liquorify's own backend stays FB-06.
- **Not accepted for production:** SD-1, the saved cards page failing for a card with no brand, and SD-2, registration not sending the policy consent to Spree, stay Open and High in LIQ-004's defect table. Accepting the batch records how the storefront behaves today, not that this behaviour is fine for customers.
- **Not part of this answer:** the rest of #12. The platform batch's work item stays PROPOSED, with its first step in #13. LIQ-006's criteria 8 and 9 are merged, and LIQ-006 stays DRAFT. Tenant isolation stays NOT_RUN, an outstanding item rather than a gap.

**What follows.** The pull requests that built on these two now target `main`, with `main` brought in, and their checks ran again: platform step P1 in [#13](https://github.com/pateldhruval872/liquorify/pull/13), part 2 of the staff access batch in [#14](https://github.com/pateldhruval872/liquorify/pull/14), whose gaps joined the register as G-19 to G-23, and the storefront's reset email check in [#19](https://github.com/pateldhruval872/liquorify-storefront/pull/19). Each stays a draft with its own acceptance.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. Checking the storefront against Liquorify's own backend stays FB-06, tenant isolation stays NOT_RUN as FB-03's validation, and the existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the answer, and no document's `status`, `approved_by` or `approved_at` changes.
