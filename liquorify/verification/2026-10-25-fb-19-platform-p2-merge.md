---
title: FB-19 platform step P2, merged and checked on main
record: verification
work_item: FB-19
date: 2026-10-25
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 808 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected. The owner accepted P2 within its documented limits before the merge
---

# FB-19 platform step P2, merged and checked on main

**Claim.** [#17](https://github.com/pateldhruval872/liquorify/pull/17), step P2 of the [platform batch](../work-items/fb-19-batch-platform.md#p2-keys-oauth-clients-the-agent-server-and-webhooks-used-from-outside), merged into `main` exactly as reviewed, and the Storybook still builds and passes its visual check on `main`. The owner accepted P2 before merging, within the limits [its record](2026-10-25-fb-19-platform-p2.md) documents ([§9](2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)). The merge closes nothing further, and it does not complete the platform batch or FB-19.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 808 of 808 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |

## 1. The merge commit

The owner accepted P2 on 2026-10-25 and merged #17 at 22:10 UTC. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#17](https://github.com/pateldhruval872/liquorify/pull/17) |
| Merged at | 22:10 UTC |
| Merge commit | `1539f0e` |
| Its parents | `38597cd` (`main` before, batch 2's merge) and `3e5f475` (the pull request's final revision, with the owner's acceptance recorded) |
| Tree | `c72067d`, the same as `3e5f475` |
| Changed | 42 files: Liquorify's records and evidence under `liquorify/`, and 12 fidelity scripts under `packages/liquorify-storybook/fidelity/`. Nothing in Spree's code, Storybook's stories, the workflows or the lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge, as it was for batch 2.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [40239103858](https://github.com/pateldhruval872/liquorify/actions/runs/40239103858) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 808 comparisons, for 404 stories in two modes, passed in the pinned image in 11.4 minutes. P2 added no story, so the count is batch 2's |
| Packages | The merge changed files under `packages/` | [40238934457](https://github.com/pateldhruval872/liquorify/actions/runs/40238934457) | PASS in 10 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

The fidelity scripts run locally against the browser-test server and the gems' own test apps, not in CI. Their last runs are in [P2's record](2026-10-25-fb-19-platform-p2.md).

## 3. What the merge changes, and what it leaves open

- **Accepted:** P2 as merged, within its documented limits. G-29, G-30 and G-31 closed with the owner's acceptance; CAP-11-10 is PASS for requests and webhook deliveries; FL-20 has every step shown to work.
- **Still open, as the owner asked:** G-32, and G-16 for the email configuration alone. CAP-04-06 and CAP-04-07 stay PARTIAL for G-32, CAP-04-08 for G-32 and the providers' inbound webhooks, which are P4's, and CAP-04-09 for G-26. FL-19 stays PARTIAL for its first step, which is batch 3's. Every other gap and defect is unchanged, and tenant isolation stays NOT_RUN.
- **Next:** batch 3, setup, stores and settings, is proposed in draft [#19](https://github.com/pateldhruval872/liquorify/pull/19) ([work item](../work-items/fb-19-batch-setup-stores-and-settings.md)), with two questions for the owner. P4 and P5 have not run.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merge, and no document's `status`, `approved_by` or `approved_at` changes.
