---
title: FB-19 setup, stores and settings batch, merged and checked on main
record: verification
work_item: FB-19
date: 2026-10-26
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 1,108 comparisons; FAIL for Packages on `main` in one required job, the scaffolded app's type check, for a cause outside the merge, a release Spree published to npm that morning, while its other jobs passed and its six release jobs were skipped as intended; Tests did not start, as expected. The owner accepted the batch at `c3ffc4d`, within its documented Spree baseline scope, before the merge. Neither the acceptance nor the merge closes a gap
---

# FB-19 setup, stores and settings batch, merged and checked on main

**Claim.** [#19](https://github.com/pateldhruval872/liquorify/pull/19), batch 3 of FB-19, [setup, stores and settings](../work-items/fb-19-batch-setup-stores-and-settings.md), merged into `main` exactly as reviewed, and the Storybook builds and passes its visual check on `main`. One required Packages job, the scaffolded app's type check, fails on `main` for a cause outside the merge, a release Spree published to npm that morning (§2.1). The owner accepted the batch at `c3ffc4d` before merging, within its documented Spree baseline scope ([the batch record §11](2026-10-26-fb-19-batch-setup-stores-and-settings.md#11-the-owners-review-2026-10-26)). With the merge, batch 3 counts as accepted under [LIQ-004](../LIQ-004-foundation-backlog.md#baseline-progress-by-product-area)'s definition. It does not complete FB-19, and it closes no gap: the owner asked that no outstanding gap be closed merely because the batch is accepted or merged.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 1,108 of 1,108 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | FAIL for one required job, the scaffolded app's type check, which fails on any revision since Spree's release to npm at 11:23 UTC, not because of the merge (§2.1). Packages' other jobs passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |

## 1. The merge commit

The owner accepted the batch at 14:26 UTC on 2026-10-26, asking for #19 to be marked ready for review, and merged it at 16:02 UTC. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#19](https://github.com/pateldhruval872/liquorify/pull/19) |
| Merged at | 16:02 UTC |
| Merge commit | `5a83c35` |
| Its parents | `afd97cd` (`main` before) and `c3ffc4d` (the pull request's final revision, which records the CI runs for the strengthened provisioning check) |
| Tree | `0d378ba`, the same as `c3ffc4d` |
| Changed | 962 files, all under `packages/liquorify-storybook/` and `liquorify/`. Nothing in Spree's code, workflows or lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [40355576487](https://github.com/pateldhruval872/liquorify/actions/runs/40355576487) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 1,108 comparisons, for 554 stories in two modes, passed in the pinned image in 19.9 minutes |
| Packages | The merge changed files under `packages/` | [40355178111](https://github.com/pateldhruval872/liquorify/actions/runs/40355178111) | FAIL in one job. Typecheck, Test and Build passed; so did the SDK integration tests and the dashboard's browser tests in all four shards. The scaffolded app's type check failed, for the reason in §2.1. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

### 2.1 The scaffolded app's type check

The job creates a new project with Spree's own scaffolding tool, then points its dashboard and seller panel at this repository's packed packages and builds and type checks them. It passed on #19 at `c3ffc4d` at 04:26 UTC, on the same files `main` now has. At 11:23 UTC the same day, Spree published version 1.0.0-rc.6 of its dashboard packages to npm, whose dashboard UI uses version 6.43.15 of its code editor library, `@codemirror/view`, where this repository's uses 6.43.13. The job's first install takes the newest release the new app's version range allows, which is now rc.6. Its next step swaps in this repository's packages but keeps the other code editor packages as the first install resolved them. Two copies of the library then sit side by side, and the dashboard's code editor, `packages/dashboard-ui/src/ui/code-editor.tsx`, fails to type check on lines 179 to 184, in the dashboard and again on TypeScript 6. The seller panel passed.

The failure was reproduced locally with the job's own steps on `main`'s files, with the same six errors. Installing the app afresh after swapping in this repository's packages leaves one copy, 6.43.13, and the build, type check and lint then pass for both apps, and on TypeScript 6. #20's run at `238c5c2` fails the same way. The check is required on `main`, so no pull request can merge until it is fixed; the fix goes in its own pull request, as the owner chooses, and changes neither Spree's application code nor this batch's records.

The fidelity scripts, the first-run provisioning check among them, run locally against the browser tests' own servers, not in CI. Their last runs are in [the batch record](2026-10-26-fb-19-batch-setup-stores-and-settings.md#8-ci-runs-and-local-checks), and the provisioning check's in its [§3.4](2026-10-26-fb-19-batch-setup-stores-and-settings.md#34-what-first-run-setup-gives-a-new-store).

## 3. What the merge changes, and what it leaves open

- **Accepted:** batch 3 as merged, at `c3ffc4d`, within its documented Spree baseline scope: its stories and reference images, the running-screen captures, the comparison evidence and what first-run setup gives a new store. The owner answered for the batch as a whole, so the [image review list](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md) records its images as accepted with the batch, none answered one by one.
- **Unlocked:** the checks that waited for batch 3. Batch 4 tests first-run setup with sample data, which the owner deferred there (G-36). The draft pull requests that waited for this merge, [#20](https://github.com/pateldhruval872/liquorify/pull/20), [#21](https://github.com/pateldhruval872/liquorify/pull/21) and [#22](https://github.com/pateldhruval872/liquorify/pull/22), are brought up to date with `main` and their checks rerun, each in its own pull request.
- **Still open, as the owner asked:** G-33 to G-35 and G-37 to G-40 stay PENDING. G-40, the server refusals for the batch's narrower roles, belongs with platform step P7, as the owner said on 2026-10-26, and stays PENDING until its own evidence is reviewed. G-36 stays DEFERRED to batch 4, and CAP-03-03 stays PARTIAL until then. The other capabilities of §3 stay as the batch record gives them, PARTIAL where their effects outside the dashboard or the steps no browser test drives are outstanding. SD-6 and SD-7 stay open, with SD-1 to SD-5. Tenant isolation stays NOT_RUN.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the merge, and no document's `status`, `approved_by` or `approved_at` changes.
