---
title: FB-19 platform batch, step P13, merged with its delegated acceptance
record: verification
work_item: FB-19 (platform batch, step P13), G-11, G-97, G-99 (gaps), SD-44, SD-45, SD-46, SD-94, SD-95, SD-96 (defects)
date: 2026-11-10
verifier: Claude (automated session); not independent review
result: Delegated acceptance of P13 in #110 at `4a006adc`, under the owner's delegation of 2026-11-04. Its scripts are the same as at `4a269571`, the revision both recorded runs used. All 45 checks on the final commit finished without a failure. 39 passed, and 6 release jobs were skipped, as on every pull request. Storybook's visual check ran twice, once from the pull request and once started by hand, and every part of both runs passed. The merge commit `0057cc53` holds exactly that revision. P13 merged with its three failing browser tests kept, on SD-44, SD-45, SD-46 and SD-94. G-99 closed on P13's verification record. G-97 stays open for A.4's registry check alone, and G-11 stays open. SD-94 to SD-96 are held for the owner. Tenant isolation stays NOT_RUN. On `main`, Packages passed. This is not the owner's review
---

# FB-19 platform batch, step P13, merged with its delegated acceptance

**Claim.** [#110](https://github.com/pateldhruval872/liquorify/pull/110) merged into `main` exactly as it was last revised, once every required check had passed on its final commit, both visual runs included.

- **What #110 is.** The platform batch's [step P13](../work-items/fb-19-batch-platform.md#p13-customer-verification-a-follow-up-to-batch-10), the customer verification follow-up to batch 10. It holds the browser tests for G-97 (part A) and the refusal checks for G-99 (part B).
- **Where the tests are recorded.** P13's [verification record](2026-11-10-fb-19-platform-p13.md) gives the tests, the checks, their two local runs and their results.
- **What this record covers.** The delegated acceptance, the revision it applies to, the checks on GitHub, the merge, and what stays open. CI's results are kept here, separate from the local runs.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-10 |
| Revision | #110's final commit, `4a006adc`. Its scripts are identical to those at `4a269571`, the revision both recorded runs used. The commits after `4a269571` change only records or bring in `main`. `10a1f382` brought in `main` with #108. `e3f13baa` adds the verification record, its evidence and the backlog's updates. `4a006adc` brought in `main` again, with #106, batch 10's merge record |
| Scope | Technical acceptance of the tests, the checks and their results, as the verification record's criteria and gap tables give them. It covers closing G-99 by the work item's closing table |
| Merged with failures visible | A.3 fails on SD-45. A.4 fails on SD-46 and SD-44. A.5 fails on SD-94. Each stays failing and recorded, as P13's criterion 4 requires |
| Not accepted here | SD-94, SD-95 and SD-96, which are recorded but held for the owner's answer. Also not accepted: any change to a capability's status, and FB-03's result, which stays with the owner |

## 2. The merge commit

`main` at `0057cc53` is "Merge pull request #110". It merged at 19:31 UTC on 2026-11-10.

- **Parents.** `main` at `3f0325e7`, after #106, and #110's final commit `4a006adc`.
- **Tree.** `e530c3b4`, the same as `4a006adc`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 53 files:

- **Liquorify's browser-test scripts, 4 files** under `packages/liquorify-storybook/fidelity/`:
  - the two new files, `p13-admin.spec.ts` and `p13-customers.spec.ts`
  - P9's helpers, `p9.ts`, which now also read P13's sabotage and stamp settings
  - `playwright.config.ts`
- **Records, 49 files:**
  - the verification record and its 46 evidence files under `liquorify/verification/`
  - LIQ-004 and the platform work item
- **Nothing else changed.** No file under `spree/`, no workflow, no `package.json`, no lockfile, no story and no reference image.

## 3. Checks on the final commit

All 45 checks on `4a006adc` finished without a failure. 39 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once, on its first attempt.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs, Build (MySQL) and its 9 test jobs, and Brakeman ([Tests 42880727095](https://github.com/pateldhruval872/liquorify/actions/runs/42880727095)) | Passed, 18:59 to 19:27 UTC |
| Typecheck, Test & Build, Scaffolded app - Typecheck & Lint, SDK Integration Tests, and Dashboard - E2E in four parts with its summary ([Packages 42880727036](https://github.com/pateldhruval872/liquorify/actions/runs/42880727036)) | Passed, 18:59 to 19:13 UTC. "Typecheck, Test & Build" includes this package's lint and type check over the scripts |
| Storybook & visual check, from the pull request, in four parts with its summary ([42880727001](https://github.com/pateldhruval872/liquorify/actions/runs/42880727001)) | Passed, 18:59 to 19:29 UTC: every part passed |
| Storybook & visual check, started by hand, in four parts with its summary ([42880720966](https://github.com/pateldhruval872/liquorify/actions/runs/42880720966)) | Passed, 18:59 to 19:24 UTC: every part passed |

P13 adds no story and no reference image, so the visual check compares the images of the batches merged before it.

P13's own tests and checks are not part of CI. They run against Spree's browser-test server, as the verification record's §1 describes, and their results are the two local runs recorded there.

**The earlier head.** On `e3f13baa`, every check also passed: [Tests 42872896083](https://github.com/pateldhruval872/liquorify/actions/runs/42872896083), [Packages 42872895966](https://github.com/pateldhruval872/liquorify/actions/runs/42872895966) and [Storybook 42872895876](https://github.com/pateldhruval872/liquorify/actions/runs/42872895876). `main` then moved with #106, so `4a006adc` brought it in and the checks ran again.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages | [42886198820](https://github.com/pateldhruval872/liquorify/actions/runs/42886198820) | Passed, 19:31 to 19:40 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check | None | It runs only on pull requests or when started by hand. P13 changes no story, reference image or Storybook script, so `main`'s images are the ones both visual runs passed on #110's final commit |
| Tests | None | It runs on a push to `main` only when `spree/` or its own workflow file changes, and #110 changed neither. It passed on #110's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged.** P13 as merged at `4a006adc`, by delegated acceptance. The acceptance changes no result in the verification record.
- **Gap closed.** G-99 closed on P13's verification record, as delegated acceptance, not the owner's review.
- **Gaps still open.**
  - G-97 stays open for A.4's registry check alone, until a validator is registered on the server the tests use.
  - G-11 stays open through G-50, G-70, SD-28 and SD-30.
- **Defects.** SD-44, SD-45 and SD-46 stay open with their fixes deferred. SD-94, SD-95 and SD-96 are held for the owner's answer. None of them is a security or tenant-isolation finding.
- **Tenant isolation.** It stays NOT_RUN, with ISO-1 to ISO-7 open, and a multi-tenant release stays blocked.
