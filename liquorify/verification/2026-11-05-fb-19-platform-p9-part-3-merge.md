---
title: FB-19 platform batch, step P9, part 3, merged with its delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P9), G-61 (gap), SD-25 (defect)
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of P9 part 3 in #78 at `611f9a35`, whose tests are those of `bc5c3fcb`, the revision its two recorded runs used. All 40 checks on the final commit passed or were skipped as on every pull request, Storybook's visual check among them with 3,008 of 3,008 comparisons in four parts, and the merge commit `7dc9e3e4` holds exactly that revision. Checks ran on no other commit of #78. G-61 closed on part 3's verification record, as that record states; this merge changes nothing it says. SD-25 stays open, CAP-05-10 stays PARTIAL with a failing part, and tenant isolation stays NOT_RUN. P9 is not complete. This is not the owner's review
---

# FB-19 platform batch, step P9, part 3, merged with its delegated acceptance

**Claim.** [#78](https://github.com/pateldhruval872/liquorify/pull/78), part 3 of the platform batch's [step P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), browser tests for the catalog actions part 2 of the catalog and pricing batch captured, merged into `main` exactly as it was last revised, once every required CI check had passed on its final commit. Its [verification record](2026-11-05-fb-19-platform-p9-part-3.md) gives the tests, their two local runs and their results. This record states the delegated acceptance, the revision it applies to, the checks on GitHub, the merge, and what stays open. CI's results are kept here, apart from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | #78's final commit, `611f9a35`. Its test files, `catalog-actions.spec.ts` and `catalog.ts`, are identical to `bc5c3fcb`'s, the revision of the two recorded runs. Two files the tests use changed only by what `main` brought in: `staff.ts` gained batch 6's two roles and their teammates, and the tests use only its admin, which did not change; `playwright.config.ts` gained the lines batch 6 and P10 added to it. The commits after `bc5c3fcb` add the verification record and its evidence, bring in `main` once, after #69 to #76, and add part 2's merge record; none of them changed a test |
| Scope | As the verification record's [§6](2026-11-05-fb-19-platform-p9-part-3.md#6-delegated-acceptance-and-what-stays-open) gives it: technical acceptance of the 28 tests and their results, and the closing of G-61 under P9's criterion 7 |
| Not accepted here | SD-25, which is recorded, not answered, and any decision on fixing it. Any change to a capability's status. The refusals to narrower roles, which are P10's. FB-03's result, which stays with the owner |

What the tests did not show stays as the verification record's [§5](2026-11-05-fb-19-platform-p9-part-3.md#5-what-this-does-not-show) states it.

## 2. The merge commit

`main` at `7dc9e3e4`, "Merge pull request #78: Added P9 part 3: browser tests for the catalog's actions", merged at 08:42 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `be094507`, after #76, and #78's final commit `611f9a35`. Its tree is `439e861e`, the same as `611f9a35`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 68 files:

- **Liquorify's browser-test scripts, 3 files** under `packages/liquorify-storybook/fidelity/`: the new test file, `catalog-actions.spec.ts`; `catalog.ts`, which now shares its upload helper with it; and `playwright.config.ts`, which lists the new file.
- **Records, 65 files:** the verification record and its 61 evidence files, part 2's merge record, LIQ-004 and the README index.
- **Nothing else.** No file under `spree/`, no workflow, no `package.json` and no lockfile changed, and no story or reference image.

## 3. Required checks on the final commit

All 40 checks on `611f9a35` finished without a failure: 34 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt. Since #75, Storybook's visual check runs in four parts with a summary check, so a pull request now has 40 checks where part 2's had 36.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41993601041](https://github.com/pateldhruval872/liquorify/actions/runs/41993601041)) | Passed, 08:19 to 08:41 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41993600949](https://github.com/pateldhruval872/liquorify/actions/runs/41993600949)) | Passed, 08:19 to 08:35 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, in four parts, and its summary ([41993600914](https://github.com/pateldhruval872/liquorify/actions/runs/41993600914)) | Passed, 08:19 to 08:37 UTC: 3,008 of 3,008 comparisons, 752 in each part, in 12.4, 10.2, 8.5 and 10.8 minutes, none retried |

Part 3 adds no story and no reference image, so the visual check compares the images of the batches merged before it. P9's own browser tests are not part of CI: they run against Spree's browser-test server in the pinned Playwright image, as the verification record's §1 describes, and their results are the two local runs recorded there.

**The earlier heads.** #78 was opened at 08:19 UTC, after all five of its commits had been pushed, so no check ran on `c7a2227a`, `bc5c3fcb`, `b46e41f6` or `906cadaf`.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41996511327](https://github.com/pateldhruval872/liquorify/actions/runs/41996511327) | Passed, 08:42 to 08:56 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check | None | Not started by hand. Part 3 changes no story, reference image or Storybook script, so `main`'s images are those the visual check passed on #78's final commit |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #78 changes neither. It passed on #78's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 3 as merged, at `611f9a35`, within its documented limits, by delegated acceptance. The acceptance changes no functional result.
- **Gaps:** G-61 closed on part 3's verification record, as LIQ-004 states, as delegated acceptance and not the owner's review. The merge adds nothing to that.
- **Defects:** SD-25 stays open, and the price lists' priority order test keeps failing while it stands.
- **Capabilities:** CAP-05-04, CAP-05-05, CAP-05-08, CAP-05-10 and CAP-05-15 stay PARTIAL. CAP-05-10 has a failing part, SD-25, and CAP-05-15 keeps its failing part, SD-17.
- **Still open:** the refusals to narrower roles are P10's. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open. FB-03's result stays with the owner.
- **Statuses are unchanged.** The platform work item and LIQ-004 keep their statuses.
- **Next:** P9's other parts, each in its own pull request: part 4, promotions, gift cards and store credit (G-84), which carries this record; and part 5, the storefront checkout (G-75), whose tests merged in the storefront's #27 and whose records follow part 4.
