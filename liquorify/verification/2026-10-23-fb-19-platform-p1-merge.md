---
title: FB-19 platform batch, step P1, merged and checked on both main branches, and P1 accepted
record: verification
work_item: FB-19
date: 2026-10-23
verifier: Claude (automated session); not independent review
result: PASS for both merge commits; PASS for Packages on the backend's `main`; PASS for the storefront's CI on `main`, its end-to-end job included, 21 of 21 browser tests; Tests and Storybook did not start on the backend, as expected; the owner accepted P1 and left the gaps it holds evidence for, G-03, G-04, G-05, G-15 and G-16, pending
---

# FB-19 platform batch, step P1, merged and checked on both main branches, and P1 accepted

**Claim.** Step P1 of the [platform batch](../work-items/fb-19-batch-platform.md) merged into both `main` branches exactly as reviewed. Its scripts and records are in backend [#13](https://github.com/pateldhruval872/liquorify/pull/13), and the storefront's reset email check is in storefront [#19](https://github.com/pateldhruval872/liquorify-storefront/pull/19). The workflows that run on each `main` for this change passed there. The owner then accepted P1, and chose to leave its gaps pending. That acceptance does not complete the platform batch or FB-19. This closes no gap, and SD-1 to SD-4 stay open.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | The workflows that run on each `main` for this change give the result expected from before the merge | PASS: Packages on the backend, and the storefront's CI with its end-to-end job, 21 of 21 browser tests; on the backend, Tests did not start because no file it watches changed, and Storybook does not run on `main` by itself (§2) |
| 3 | The owner answers whether merging #13 and #19 accepts P1 | P1 ACCEPTED on 2026-10-23 at 17:07 UTC; G-03, G-04, G-05, G-15 and G-16 stay PENDING (§3) |

## 1. The merge commits

The owner merged both pull requests on 2026-10-23 at 16:59 UTC, within a minute of each other. Each merge commit's tree is identical to the tree of its pull request's final revision, so each `main` holds exactly what was reviewed and nothing else.

| | Backend | Storefront |
|---|---|---|
| Pull request | [#13](https://github.com/pateldhruval872/liquorify/pull/13) | [#19](https://github.com/pateldhruval872/liquorify-storefront/pull/19) |
| Merge commit | `0965f32` | `321fa1c` |
| Its parents | `1a70936` (`main` before, #12's merge) and `ef21380` (the pull request, with the review corrections) | `93e2f11` (`main` before, #18's merge) and `2456e86` (the pull request) |
| Tree | `7d6f382`, the same as `ef21380` | `a21487f`, the same as `2456e86` |
| Changed | 23 files: P1's records and evidence under `liquorify/`, and nine fidelity scripts under `packages/liquorify-storybook/fidelity/`. Nothing in Spree's code, workflows or lockfile changed | 2 files: the reset email check and its configuration under `visual/fidelity/`. The storefront's code, tests, workflows and lockfile are unchanged |

## 2. Workflows on each `main`

| Repository | Workflow | Why it ran | Run | Result |
|---|---|---|---|---|
| Backend | Packages | The push to `main`: the merge changed files under `packages/` | [39991333458](https://github.com/pateldhruval872/liquorify/actions/runs/39991333458) | PASS in 16 minutes: Typecheck, Test & Build, the SDK integration tests, the scaffolded app's typecheck and lint, and all four Dashboard E2E shards. The six release jobs were skipped, because they run only in Spree's own repository |
| Backend | Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed none | None | NOT_RUN, as expected |
| Backend | Storybook | Not started: it runs only on pull requests and when started by hand. P1 changed no story, component or reference image, and it passed on #13 at `ef21380`, whose tree `main` now holds | [On #13](https://github.com/pateldhruval872/liquorify/actions/runs/39973445174) | NOT_RUN on `main`; PASS at the identical tree |
| Storefront | CI | The push to `main` | [39991374580](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39991374580) | PASS: Lint, Type Check and Unit Tests. [E2E](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39991374580/job/120543696407) ran all 21 browser tests in 2.5 minutes, all passing. It booted Spree's published image, not Liquorify's backend (FB-06) |

P1's own scripts run locally, not in CI, so no workflow repeats them. Their results are in P1's [mail record](2026-10-22-fb-19-platform-p1-mail.md) and [checks record](2026-10-22-fb-19-platform-p1-checks.md), at the revisions those records name.

## 3. The owner's answer on P1

On 2026-10-23 at 17:07 UTC, eight minutes after the merges, the owner answered the question "Does merging #13 and #19 also accept platform step P1?" with "Accept P1; its gaps stay pending".

What the answer covers, and what it leaves open:

- **Accepted:** P1 as merged, with the corrections the owner asked for on 2026-10-23. That covers the mail check, the API reference comparison, the Admin and Seller kit check, external references, price history, the hosted dashboards and tracing, each with the result its record gives. Those results stand as recorded: CAP-11-06 stays PARTIAL, CAP-05-11 PASSES for single price changes only, and EM-C-08 is shown only on the emails gem's own test app.
- **Still PENDING:** G-03, G-04, G-05, G-15 and G-16 in the [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance). The register said each would close when the owner accepted P1. The owner chose instead to answer each one separately, so P1's evidence is named on each row and none is closed.
- **Not accepted for production:** SD-3, the Seller kit's order addresses, and SD-4, the stale Admin reference, stay Open in LIQ-004's defect table with SD-1 and SD-2. The kit check allows SD-3's two issues so that it can run, not because the behaviour is right.
- **Not part of this answer:** the platform batch's other steps, P2 to P5, which have not run. Its work item stays PROPOSED.

**What follows.** Part 2 of the staff access batch, [#14](https://github.com/pateldhruval872/liquorify/pull/14), has `main` brought in again and carries this record. It stays a draft with its own acceptance.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the answer, and no document's `status`, `approved_by` or `approved_at` changes.
