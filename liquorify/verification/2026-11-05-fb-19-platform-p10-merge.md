---
title: FB-19 platform batch, step P10, merged with its delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P10), G-11, G-45, G-50, G-56, G-60, G-70, G-79, G-83, G-84 (gaps), SD-9, SD-28, SD-29, SD-30 (defects)
date: 2026-11-05
verifier: Claude (automated session, thread "Add P10 refusal checks"); not independent review
result: Delegated acceptance of P10 in #74 at `2427cf47`, under the owner's delegation of 2026-11-04. The tests in that commit are the same as at `d12407b2`, the revision both recorded runs used. All 36 checks on the final commit finished without a failure: 30 passed, and 6 release jobs were skipped, as on every pull request. They include Storybook's visual check, which passed 3,008 of 3,008 comparisons. The merge commit `02478d17` holds exactly that revision. P10 merged with its five failing controls visible, as the coordinating session asked. SD-9, SD-28, SD-29 and SD-30 stay open, and so do G-50, G-70 and G-11. G-45, G-56, G-60, G-79 and G-83 closed on P10's verification record, together with G-84's behaviours 11, 12 and 22. This merge changes nothing that record says. Tenant isolation stays NOT_RUN. This is not the owner's review.
---

# FB-19 platform batch, step P10, merged with its delegated acceptance

**Claim.** [#74](https://github.com/pateldhruval872/liquorify/pull/74) merged into `main` exactly as it was last revised, once every required CI check had passed on its final commit.

- **What #74 is.** The refusal checks within one store for the platform batch's [step P10](../work-items/fb-19-batch-platform.md#p10-the-remaining-refusals-within-one-store).
- **Where the tests are recorded.** P10's [verification record](2026-11-05-fb-19-platform-p10.md) gives the checks, their two local runs and their results.
- **What this record covers.** The delegated acceptance, the revision it applies to, the checks on GitHub, the merge, and what stays open. CI's results are kept here, separate from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Add P10 refusal checks" |
| Revision | #74's final commit, `2427cf47`. Its scripts are identical to those at `d12407b2`, the revision both recorded runs used. The two commits after `d12407b2` change only records. `09bd8b72` adds the verification record and its evidence. `2427cf47` renumbers P10's three defects as SD-28 to SD-30, the numbers the project's defect number register allocated. P10 had first entered them as SD-25 to SD-27, numbers the register had already given to P9 |
| Scope | As the verification record's [criteria and gap tables](2026-11-05-fb-19-platform-p10.md) give it: technical acceptance of the checks and their results. It also covers closing G-45, G-56, G-60, G-79 and G-83, with G-84's behaviours 11, 12 and 22, by the work item's closing table |
| Merged with failures visible | The five failing controls are 1.4 and 1.5 on SD-9, 3.6 on SD-29, 5.9 on SD-28, and 5.10's reservations list on SD-30. They stay failing and recorded. The coordinating session placed #74 ahead of #75 and said the defects need not hold the merge |
| Not accepted here | SD-28 to SD-30, which are recorded but not answered. The register's thread is adding them to the owner brief as one decision row, on their severity and on keeping them open until a fix is decided after the baseline. Also not accepted: any change to a capability's status, and FB-03's result, which stays with the owner |

What the checks did not show stays as the verification record's [§6](2026-11-05-fb-19-platform-p10.md#6-what-this-does-not-show) states it:

- Every request stayed within the default store.
- The requests were sent without a browser.
- 5.9's two refused exports were not read back.
- G-84's other 19 behaviours stay with P9.

## 2. The merge commit

`main` at `02478d17` is "Merge pull request #74". It merged at 07:21 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed.

- **Parents.** `main` at `01b2092d`, after the media picker investigation's #73, and #74's final commit `2427cf47`.
- **Tree.** `75c35a0e`, the same as `2427cf47`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 31 files:

- **Liquorify's browser-test scripts, 7 files** under `packages/liquorify-storybook/fidelity/`:
  - the two new check files, `p10-admin.spec.ts` and `p10-shoppers.spec.ts`;
  - the storefront helper `storefront-run.mjs`;
  - P7's judge `one-store.ts`, extended, with helpers moved there from `one-store-admin.spec.ts`;
  - its stand-in cases in `one-store-checks.spec.ts`;
  - `playwright.config.ts`.
- **Records, 24 files:**
  - the verification record and its 20 evidence files under `liquorify/verification/`;
  - LIQ-004, the platform work item and the README index.
- **Nothing else changed.** No file under `spree/`, no workflow, no `package.json`, no lockfile, no story and no reference image. Nothing in the storefront repository changed.

## 3. Checks on the final commit

All 36 checks on `2427cf47` finished without a failure: 30 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41980626604](https://github.com/pateldhruval872/liquorify/actions/runs/41980626604)) | Passed, 06:28 to 06:41 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41980626837](https://github.com/pateldhruval872/liquorify/actions/runs/41980626837)) | Passed, 06:28 to 06:38 UTC. "Typecheck, Test & Build" includes this package's lint and type check over the scripts |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, from the pull request ([41980626600](https://github.com/pateldhruval872/liquorify/actions/runs/41980626600)); advisory, not a required check | Passed, 06:29 to 07:20 UTC: 3,008 of 3,008 comparisons in 49.5 minutes, none retried |

P10 adds no story and no reference image, so the visual check compares the images of the batches merged before it.

P10's own checks are not part of CI. They run against Spree's browser-test server and a storefront built against it, as the verification record's §1 describes. Their results are the two local runs recorded there. No CI job sends P10's requests.

**Earlier heads.** No check ran on `1fb5e5a8`, the merge of `main` into the branch, because it was pushed together with `d12407b2`.

| Revision | Runs | Result |
|---|---|---|
| `0bab43cd`, the checks recorded before any script | [Tests 41973622267](https://github.com/pateldhruval872/liquorify/actions/runs/41973622267), [Packages 41973622100](https://github.com/pateldhruval872/liquorify/actions/runs/41973622100) | Both passed. Storybook's workflow did not start, because that commit changed no file it watches |
| `d12407b2`, the scripts | [Tests 41978141835](https://github.com/pateldhruval872/liquorify/actions/runs/41978141835), [Packages 41978141874](https://github.com/pateldhruval872/liquorify/actions/runs/41978141874), [Storybook 41978141739](https://github.com/pateldhruval872/liquorify/actions/runs/41978141739) | Tests and Packages passed. Storybook was cancelled when `09bd8b72` was pushed, which started the checks again on the new head |
| `09bd8b72`, the verification record | [Tests 41980037204](https://github.com/pateldhruval872/liquorify/actions/runs/41980037204), [Packages 41980037266](https://github.com/pateldhruval872/liquorify/actions/runs/41980037266), [Storybook 41980037168](https://github.com/pateldhruval872/liquorify/actions/runs/41980037168) | All three were cancelled when `2427cf47` was pushed with the renumbered defects. No job had failed before then |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: type checks, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41986658260](https://github.com/pateldhruval872/liquorify/actions/runs/41986658260) | Passed, 07:21 to 07:30 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check | None | It runs only on pull requests or when started by hand, and was not started. P10 changes no story, reference image or Storybook script, so `main`'s images are the ones the visual check passed on #74's final commit |
| Tests: the backend's builds, Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #74 changed neither. It passed on #74's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged.** P10 as merged at `2427cf47`, within its documented limits, by delegated acceptance. The acceptance changes no functional result.
- **Gaps closed.** G-45, G-56, G-60, G-79 and G-83 closed on P10's verification record, as LIQ-004 states, together with G-84's behaviours 11, 12 and 22. They closed as delegated acceptance, not the owner's review. The merge adds nothing to that.
- **Gaps still open.**
  - G-50 stays open on SD-9.
  - G-70 stays open on SD-29.
  - G-11 stays open through G-50, G-70, SD-28 and SD-30.
  - G-84's other 19 behaviours stay with P9.
- **Defects.** SD-9, SD-28, SD-29 and SD-30 stay open. 1.4, 1.5, 3.6, 5.9 and 5.10's reservations list keep failing while these defects stand. SD-28 to SD-30 were recorded in this pull request. They are over-refusals of an allowed caller. None of them is a security or tenant-isolation finding.
- **Tenant isolation.** It stays NOT_RUN, with ISO-1 to ISO-7 open, and nothing is claimed about it. FB-03's result stays with the owner.
- **Statuses.** The platform work item and LIQ-004 keep the statuses #74 gave them.
