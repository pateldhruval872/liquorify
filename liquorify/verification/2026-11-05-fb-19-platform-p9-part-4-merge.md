---
title: FB-19 platform batch, step P9, part 4, merged with its delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P9), G-84 (gap), SD-26 and SD-27 (held)
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of P9 part 4 in #79 at `c8284917`, whose tests are those of `4a78cd88`, the revision its two recorded runs used, but for one corrected comment. All 40 checks on the final commit passed or were skipped as on every pull request, Storybook's visual check among them with 3,008 of 3,008 comparisons in four parts, and the merge commit `46c99cb7` holds exactly that revision. Checks ran on no other commit of #79. G-84 stays open, as part 4's verification record states: tests 21 and 28 fail on SD-26 and SD-27, held for the owner's answer to row 36. CAP-05-12 and CAP-05-13 stay PARTIAL and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 platform batch, step P9, part 4, merged with its delegated acceptance

**Claim.** [#79](https://github.com/pateldhruval872/liquorify/pull/79), part 4 of the platform batch's [step P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), browser tests for the promotion, gift card and store credit behaviours part 3 of the catalog and pricing batch left to G-84, merged into `main` exactly as it was last revised, once every required CI check had passed on its final commit. Its [verification record](2026-11-05-fb-19-platform-p9-part-4.md) gives the tests, their two local runs and their results. This record states the delegated acceptance, the revision it applies to, the checks on GitHub, the merge, and what stays open. CI's results are kept here, apart from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | #79's final commit, `c8284917`. Its test files, `loyalty-actions.spec.ts` and `p9.ts`, and part 3's `catalog-actions.spec.ts`, whose helpers moved into `p9.ts`, are identical to `4a78cd88`'s, the revision of the two recorded runs, but for one line of `loyalty-actions.spec.ts`'s opening comment, which `5ccab50b` corrected from four tests answering a request to three. Two files the tests use changed only by what `main` brought in: `staff.ts` gained batch 6's two roles and their teammates, and the tests use only its admin, which did not change; `playwright.config.ts` gained the lines batch 6 and P10 added to it. The commits after `5ccab50b` add the verification record and its evidence, bring in `main` once, after #78, and add the backlog entries and part 3's merge record; none of them changed a test |
| Scope | As the verification record's [§6](2026-11-05-fb-19-platform-p9-part-4.md#6-delegated-acceptance-and-what-stays-open) gives it: technical acceptance of the 42 tests and their results |
| Not accepted here | Whether part 3's B2 and B14 are defects, which is row 36 of the owner decision brief; SD-26's and SD-27's severity, which follows that answer; the three simulated tests, 21, 37 and 38, as functional verification, which they are not. Any change to a capability's status. The refusals to narrower roles, which are P10's. FB-03's result, which stays with the owner |

What the tests did not show stays as the verification record's [§5](2026-11-05-fb-19-platform-p9-part-4.md#5-what-this-does-not-show) states it.

## 2. The merge commit

`main` at `46c99cb7`, "Merge pull request #79: Added P9 part 4: browser tests for promotions, gift cards and store credit", merged at 09:16 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `7dc9e3e4`, after #78, and #79's final commit `c8284917`. Its tree is `ec96b359`, the same as `c8284917`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 99 files:

- **Liquorify's browser-test scripts, 4 files** under `packages/liquorify-storybook/fidelity/`: the new test file, `loyalty-actions.spec.ts`; `p9.ts`, which now holds the five helpers both scripts share; `catalog-actions.spec.ts`, which now imports them; and `playwright.config.ts`, which lists the new file.
- **Records, 95 files:** the verification record and its 91 evidence files, part 3's merge record, LIQ-004 and the README index.
- **Nothing else.** No file under `spree/`, no workflow, no `package.json` and no lockfile changed, and no story or reference image.

## 3. Required checks on the final commit

All 40 checks on `c8284917` finished without a failure: 34 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41998470999](https://github.com/pateldhruval872/liquorify/actions/runs/41998470999)) | Passed, 08:57 to 09:09 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41998470816](https://github.com/pateldhruval872/liquorify/actions/runs/41998470816)) | Passed, 08:57 to 09:06 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, in four parts, and its summary ([41998471142](https://github.com/pateldhruval872/liquorify/actions/runs/41998471142)) | Passed, 08:57 to 09:14 UTC: 3,008 of 3,008 comparisons, 752 in each part, in 15.0, 10.4, 12.0 and 11.0 minutes, none retried |

Part 4 adds no story and no reference image, so the visual check compares the images of the batches merged before it. P9's own browser tests are not part of CI: they run against Spree's browser-test server in the pinned Playwright image, as the verification record's §1 describes, and their results are the two local runs recorded there.

**The earlier heads.** #79 was opened at 08:57 UTC, after all six of its commits had been pushed, so no check ran on `4a78cd88`, `5ccab50b`, `ceec596c`, `5c041a15` or `02d3f21a`.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [42000998631](https://github.com/pateldhruval872/liquorify/actions/runs/42000998631) | Passed, 09:16 to 09:30 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check | None | Not started by hand. Part 4 changes no story, reference image or Storybook script, so `main`'s images are those the visual check passed on #79's final commit |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #79 changes neither. It passed on #79's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 4 as merged, at `c8284917`, within its documented limits, by delegated acceptance. The acceptance changes no functional result.
- **Gaps:** G-84 stays open, as part 4's verification record and LIQ-004 state. Every behaviour of item 1.6 has a test, but tests 21 and 28 fail on SD-26 and SD-27, which are held for the owner's answer to row 36, not defects recorded under P9's criterion 4. The merge adds nothing to that.
- **Held:** SD-26 and SD-27 stay in LIQ-004 as held at Low, and tests 21 and 28 keep failing while the behaviours stand.
- **Capabilities:** CAP-05-12 and CAP-05-13 stay PARTIAL.
- **Still open:** the refusals to narrower roles are P10's, which met behaviours 11, 12 and 22. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open. FB-03's result stays with the owner.
- **Statuses are unchanged.** The platform work item and LIQ-004 keep their statuses.
- **Next:** part 5, the storefront checkout (G-75), whose tests merged in the storefront's #27 and whose records carry this one.
