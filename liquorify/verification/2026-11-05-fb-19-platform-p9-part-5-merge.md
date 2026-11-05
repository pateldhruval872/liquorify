---
title: FB-19 platform batch, step P9, part 5, records merged with their delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P9), G-75 (gap)
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of P9 part 5's records in #81 at `f1dbe2e6`. The tests themselves are in the storefront's repository and merged there in storefront #27 at `cbb7ddc6`, as part 5's verification record states. All 35 checks on #81's final commit passed or were skipped as on every pull request; Storybook's visual check did not run, since #81 changes no file it watches. The merge commit `e0a6683b` holds exactly that revision. G-75 closed on part 5's verification record, as that record states; this merge changes nothing it says. Every part of P9 has run and merged, but P9 is not complete while G-84 waits on the owner's answer to row 36. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 platform batch, step P9, part 5, records merged with their delegated acceptance

**Claim.** [#81](https://github.com/pateldhruval872/liquorify/pull/81), the records of part 5 of the platform batch's [step P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), merged into `main` exactly as it was last revised, once every required CI check had passed on its final commit. Part 5's tests, nine browser tests of the storefront's checkout, are in the storefront's repository and merged there in [storefront #27](https://github.com/pateldhruval872/liquorify-storefront/pull/27); its [verification record](2026-11-05-fb-19-platform-p9-part-5.md) gives the tests, their two local runs, their results and #27's checks. This record states the delegated acceptance of #81, the checks on GitHub, the merge, and what stays open. CI's results are kept here, apart from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | #81's final commit, `f1dbe2e6`, which holds records only. The tests it records are storefront `cbb7ddc6`, #27's final commit, on which every required check of the storefront passed, as the verification record's [§6.1](2026-11-05-fb-19-platform-p9-part-5.md#61-storefront-27s-checks) gives them |
| Scope | As the verification record's [§6](2026-11-05-fb-19-platform-p9-part-5.md#6-delegated-acceptance-and-what-stays-open) gives it: technical acceptance of the nine tests and their results, and the closing of G-75 under P9's criterion 7 |
| Not accepted here | Whether any behaviour the verification record's §4 lists is a defect, which is the owner's. Any change to a capability's or flow's status. Real payment providers, which are P4's; the refusals, which are P10's; FB-03's result, which stays with the owner |

What the tests did not show stays as the verification record's [§5](2026-11-05-fb-19-platform-p9-part-5.md#5-what-this-does-not-show) states it.

## 2. The merge commit

`main` at `e0a6683b`, "Merge pull request #81: Added P9 part 5's records: the storefront checkout tests, and G-75 closed", merged at 10:00 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `46c99cb7`, after #79, and #81's final commit `f1dbe2e6`. Its tree is `9ffff2c5`, the same as `f1dbe2e6`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 20 files, all under `liquorify/`: part 5's verification record and its 16 evidence files, part 4's merge record, LIQ-004 and the README index. No test, no file under `spree/` or `packages/`, no workflow, no `package.json` and no lockfile changed, and no story or reference image.

## 3. Required checks on the final commit

All 35 checks on `f1dbe2e6` finished without a failure: 29 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 42003387765](https://github.com/pateldhruval872/liquorify/actions/runs/42003387765)) | Passed, 09:33 to 09:58 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 42003387725](https://github.com/pateldhruval872/liquorify/actions/runs/42003387725)) | Passed, 09:33 to 09:47 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check | Did not run, as expected. On a pull request it runs only when a file it watches changes, such as the Storybook package, the dashboard packages, the lockfile or its own workflow, and #81 changes none of them. GitHub counted #81 mergeable without it |

**The earlier heads.** #81 was opened at 09:33 UTC, after all seven of its commits had been pushed, so no check ran on the earlier ones. Part 5's two record commits, `909642ec` and `a3b4ee98`, were made before #79 merged and were brought up to date by two merges of part 4 and `main` before the pull request was opened.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages | None | Did not start, as expected. On a push to `main` it runs only when the packages, the API's or core's application code, the developer documentation, the lockfile or its own workflow changes, and #81 changes none of them. It passed on #81's final commit |
| Tests | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes. It passed on #81's final commit |
| Storybook's visual check | None | Runs on pull requests only. #81 changes no story, reference image or Storybook script, so `main`'s images are those the visual check passed on #79's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 5's records as merged, at `f1dbe2e6`, within their documented limits, by delegated acceptance. The acceptance changes no functional result.
- **Gaps:** G-75 closed on part 5's verification record, as LIQ-004 states, as delegated acceptance and not the owner's review. The merge adds nothing to that.
- **Capabilities and flows:** no status changes. CAP-06-01, CAP-05-12, CAP-05-13, CAP-07-04 and CAP-07-11, and FL-05, FL-16 and FL-17, keep their statuses for what else each waits on in LIQ-004.
- **P9:** every part has run and merged: part 1 in #67, part 2 in #69, part 3 in #78, part 4 in #79, and part 5 in storefront #27 with its records in #81. P9 is not complete while G-84 stays open on SD-26 and SD-27, held for the owner's answer to row 36 of the decision brief. SD-25 and SD-18 stay open with their failing tests kept.
- **Still open:** real payment providers are P4's, and the refusals P10's. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open. FB-03's result stays with the owner.
- **Statuses are unchanged.** The platform work item and LIQ-004 keep their statuses.
