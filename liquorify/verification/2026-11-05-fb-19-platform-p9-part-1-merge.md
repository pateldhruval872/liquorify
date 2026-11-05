---
title: FB-19 platform batch, step P9, part 1, merged with its delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P9), G-37, G-68, G-69 (gaps), SD-7, SD-24 (defects)
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of P9 part 1 in #67 at `7e0db7d2`, whose tests are those of `231b2176`, the revision its two recorded runs used. All 36 checks on the final commit passed or were skipped as on every pull request, Storybook's visual check among them with 3,008 of 3,008 comparisons, and the merge commit `a4fa3d7c` holds exactly that revision. On the one earlier head every check passed. G-37, G-68 and G-69 closed on part 1's verification record, as that record states; this merge changes nothing it says. SD-7 and SD-24 stay open, the capabilities stay PARTIAL, and tenant isolation stays NOT_RUN. P9 is not complete. This is not the owner's review
---

# FB-19 platform batch, step P9, part 1, merged with its delegated acceptance

**Claim.** [#67](https://github.com/pateldhruval872/liquorify/pull/67), part 1 of the platform batch's [step P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), browser tests for Getting Started's tasks and batch 7's settings actions, merged into `main` exactly as it was last revised, once every required CI check had passed on its final commit. Its [verification record](2026-11-05-fb-19-platform-p9-part-1.md) gives the tests, their two local runs and their results. This record states the delegated acceptance, the revision it applies to, the checks on GitHub, the merge, and what stays open. CI's results are kept here, apart from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | #67's final commit, `7e0db7d2`. Its tests and shared helpers are identical to `231b2176`'s, the revision of the two recorded runs. The commits after it add the verification record and its evidence, at `871888a7`, and bring in `main` after batch 6's #64, at `7e0db7d2`, which changed no test |
| Scope | As the verification record's [§6](2026-11-05-fb-19-platform-p9-part-1.md#6-delegated-acceptance-and-what-stays-open) gives it: technical acceptance of the 17 tests and their results, and the closing of G-37, G-68 and G-69 under P9's criterion 7 |
| Not accepted here | SD-7 and SD-24, which are recorded, not answered. Any change to a capability's status. The refusals to narrower roles, which are P10's. FB-03's result, which stays with the owner |

What the tests did not show stays as the verification record's [§5](2026-11-05-fb-19-platform-p9-part-1.md#5-what-this-does-not-show) states it: every test signs in as the admin and stays in one store, payments and tax use stand-ins, effects at checkout are other batches', and every run used Chromium at one window size.

## 2. The merge commit

`main` at `a4fa3d7c`, "Merge pull request #67", merged at 03:01 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `273e0be8`, after batch 6's #64, and #67's final commit `7e0db7d2`. Its tree is `22659cb4`, the same as `7e0db7d2`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 48 files:

- **Liquorify's browser-test scripts, 5 files** under `packages/liquorify-storybook/fidelity/`: the two new test files, `getting-started-tasks.spec.ts` and `settings-actions.spec.ts`; their shared helpers, `p9.ts`; and changes to `playwright.config.ts` and `stack.spec.ts`.
- **Records, 43 files:** the verification record and its 40 evidence files under `liquorify/verification/`, LIQ-004 and the README index.
- **Nothing else.** No file under `spree/`, no workflow, no `package.json` and no lockfile changed, and no story or reference image.

## 3. Required checks on the final commit

All 36 checks on `7e0db7d2` finished without a failure: 30 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41953148249](https://github.com/pateldhruval872/liquorify/actions/runs/41953148249)) | Passed, 02:07 to 02:22 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41953148212](https://github.com/pateldhruval872/liquorify/actions/runs/41953148212)) | Passed, 02:07 to 02:17 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, from the pull request ([41953148221](https://github.com/pateldhruval872/liquorify/actions/runs/41953148221)) | Passed, 02:07 to 03:00 UTC: 3,008 of 3,008 comparisons in 51.0 minutes, none retried |

Part 1 adds no story and no reference image, so the visual check compares the images of the batches merged before it. P9's own browser tests are not part of CI: they run against Spree's browser-test server in the pinned Playwright image, as the verification record's §1 describes, and their results are the two local runs recorded there.

**The earlier head.** #67 was opened at `871888a7`, after its first three commits had been pushed, so no check ran on `02a5071d` or `231b2176`.

| Revision | Runs | Result |
|---|---|---|
| `871888a7` | [Tests 41938994641](https://github.com/pateldhruval872/liquorify/actions/runs/41938994641), [Packages 41938994678](https://github.com/pateldhruval872/liquorify/actions/runs/41938994678), [Storybook 41938994650](https://github.com/pateldhruval872/liquorify/actions/runs/41938994650) | All passed. Not merged then, because the coordinating session held it until batch 6's #64 was in. `main` then moved with #64, which was brought in by a merge commit at `7e0db7d2` with both sides' text kept, and the checks ran again |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41958940307](https://github.com/pateldhruval872/liquorify/actions/runs/41958940307) | Passed, 03:01 to 03:10 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check | None | Not started by hand. Part 1 changes no story, reference image or Storybook script, so `main`'s images are those the visual check passed on `273e0be8` ([41952612266](https://github.com/pateldhruval872/liquorify/actions/runs/41952612266)) and on #67's final commit |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #67 changes neither. It passed on #67's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 1 as merged, at `7e0db7d2`, within its documented limits, by delegated acceptance. The acceptance changes no functional result.
- **Gaps:** G-37, G-68 and G-69 closed on part 1's verification record, as LIQ-004 states, as delegated acceptance and not the owner's review. The merge adds nothing to that.
- **Defects:** SD-7 and SD-24 stay open, and tests 4 and 5 keep failing while they stand. SD-24 was recorded in this pull request.
- **Capabilities:** CAP-03-04, CAP-07-01, CAP-07-04 and CAP-07-11 stay PARTIAL, for the reasons the verification record's §5 gives.
- **Still open:** the refusals to batch 7's narrower roles stay in G-70, for P10. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open, and nothing is claimed about ISO-6. FB-03's result stays with the owner.
- **Statuses are unchanged.** The platform work item and LIQ-004 keep their statuses.
- **Next:** P9's other parts, each in its own pull request: part 2, multi-store administration (G-72), which carries this record; part 3, the catalog actions (G-61); part 4, promotions, gift cards and store credit (G-84); and the storefront checkout (G-75).
