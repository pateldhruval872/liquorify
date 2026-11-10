---
title: FB-19 batch 10, customers in the dashboard, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-08-02 to CAP-08-06, FL-23, FL-21's customer entry, FL-10's staff step), G-96 to G-99 (gaps), SD-44 to SD-46 (defects)
date: 2026-11-10
verifier: Claude (automated session, the thread for batch 10); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 10 in #94 at `4eb647d1`. Criteria 1 to 7 and 9 to 17 stand as the verification record gives them. All 45 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them with 4,192 of 4,192 comparisons each, and the merge commit `a3a427fc` holds exactly that revision. On `main`, Packages and the visual check started by hand both passed. The owner's answers of 2026-11-10 on G-96 to G-99 and SD-44 to SD-46 are the owner's, recorded separately, and are not part of this acceptance. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 10, customers in the dashboard, merged with its delegated acceptance

**Claim.** [#94](https://github.com/pateldhruval872/liquorify/pull/94) holds FB-19's [batch 10](../work-items/fb-19-batch-customers.md): the customer list, a customer's page with its cards, the new customer page, and the import and export of customers. It met the work item's acceptance criteria as its [verification record](2026-11-09-fb-19-batch-customers.md) gives them. Every required check passed on its final commit, including both full runs of Storybook's visual check, and it merged into `main` exactly as last revised. This record covers:

- the delegated acceptance and the revision it applies to;
- the checks on GitHub, including the heads that `main` overtook;
- the merge;
- what stays open.

The owner's answers on the batch's gaps and defects are recorded apart from this, in [the owner's answers on batch 10](2026-11-10-owner-answers-batch-10.md).

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work. The owner did answer its gaps and defects, which is recorded separately ([record](2026-11-10-owner-answers-batch-10.md)) |
| Date | 2026-11-10 |
| Accepted by | Claude, in the thread for batch 10 |
| Revision | #94's final commit, `4eb647d1`. Its stories, fixtures, mocks and scripts are those of the verification record's revisions. After the images were reviewed, two commits changed what the visual check compares: `be95d07f` brought in `main` with batches 11 and 13 part 1, and `a048191d` wrote again the eight images of four of batch 13's seller address card stories, which take their addresses from the order fixtures batch 10 corrected; each was looked at and listed in the [image review list](2026-11-09-fb-19-batch-customers-image-review.md#earlier-images-changed-by-the-address-correction). The other commits change only Liquorify's records (`f08dd1b4`, with the owner's answers and step P13) or bring in `main` again (`4eb647d1`, after #103) |
| Scope | As the verification record's §13 gives it: the 156 reference images of the image review list, each looked at in light and dark, with the earlier images the address correction changed; the running-screen evidence; fidelity, judged from the comparison of 39 cases and 6 earlier stories, with every difference explained; and technical acceptance of criteria 1 to 10 and 12 to 17 |
| Not accepted here | • The owner's answers on G-96 to G-99 and SD-44 to SD-46, which are the owner's.<br>• B1 to B11, which stay recorded as Spree's behaviour, not approved as correct.<br>• The 14 behaviours of G-97 and the refusal checks of G-99, which go to the platform batch's step [P13](../work-items/fb-19-batch-platform.md#p13-customer-verification-a-follow-up-to-batch-10). Nothing unverified becomes PASS.<br>• Tenant isolation, which stays NOT_RUN. |

## 2. The merge commit

`main` at `a3a427fc`, "Merge pull request #94: Added batch 10, customers in the dashboard", merged at 15:37 UTC on 2026-11-10 through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `7a7eb507`, after #103, and #94's final commit `4eb647d1`. Its tree is `2eca13aa`, the same as `4eb647d1`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 752 files:

- **The Storybook package, 208 files**, under `packages/liquorify-storybook/`: the story files, fixtures and mocks, the 156 reference images with the earlier images the address correction changed, and the fidelity scripts.
- **Records, 544 files:** under `liquorify/verification/`, the verification record, the image review list, the owner's answers and the evidence; LIQ-004, LIQ-009, the README index, the work item and the platform work item with step P13.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

## 3. Required checks on the final commit

All 45 checks on `4eb647d1` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Storybook's visual check ran twice, once from the pull request and once started by hand, as criterion 8 asks.

| Check | Result |
|---|---|
| Tests: Build (PostgreSQL) and (MySQL), each with 9 test jobs, and Brakeman ([42840860966](https://github.com/pateldhruval872/liquorify/actions/runs/42840860966)) | Passed on its second attempt, 15:06 to 15:35 UTC. On the first, one of Spree's core examples failed on MySQL, part 2 of 3: `Spree::Export#generate sends the export done email` could not open its temporary CSV file. #94 changes nothing under `spree/`, the same example passed on PostgreSQL and on `a048191d`, so the failed job was run again once, and passed |
| Packages: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42840860904](https://github.com/pateldhruval872/liquorify/actions/runs/42840860904)) | Passed, 15:06 to 15:15 UTC, on its first attempt |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42840860932](https://github.com/pateldhruval872/liquorify/actions/runs/42840860932)) | Passed, 15:06 to 15:27 UTC: 4,192 of 4,192 comparisons, every part passed |
| Storybook & visual check, started by hand, in four parts, and its summary ([42840853392](https://github.com/pateldhruval872/liquorify/actions/runs/42840853392)) | Passed, 15:06 to 15:27 UTC: 4,192 of 4,192 comparisons, every part passed |

The 4,192 comparisons are batch 10's 156 and the 4,036 of the batches merged before it.

**The earlier heads.** None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `1a731f45` | [Tests 42741774119](https://github.com/pateldhruval872/liquorify/actions/runs/42741774119), [Packages 42741774006](https://github.com/pateldhruval872/liquorify/actions/runs/42741774006), [Storybook 42741774144](https://github.com/pateldhruval872/liquorify/actions/runs/42741774144), attempts 1 and 2 | All passed. `main` then moved by 74 commits, with batches 11 and 13 part 1, and conflicts in LIQ-004, LIQ-009, the README index and three fidelity scripts, resolved in `be95d07f` by keeping both sides' entries and counting batch 10's totals after the batches already merged |
| `be95d07f` | Tests, Packages and Storybook started | Overtaken by `f08dd1b4` before they finished |
| `f08dd1b4` | [Storybook 42832659733](https://github.com/pateldhruval872/liquorify/actions/runs/42832659733) and [42832672178](https://github.com/pateldhruval872/liquorify/actions/runs/42832672178) started by hand | Both failed in part 4 on the same eight images: batch 13's seller address cards now read "Portland, OR", from batch 10's address correction. Fixed in `a048191d` |
| `a048191d` | [Tests 42836484991](https://github.com/pateldhruval872/liquorify/actions/runs/42836484991), [Packages 42836485033](https://github.com/pateldhruval872/liquorify/actions/runs/42836485033), [Storybook 42836485276](https://github.com/pateldhruval872/liquorify/actions/runs/42836485276) and [42836480000](https://github.com/pateldhruval872/liquorify/actions/runs/42836480000) started by hand | All passed, Packages on its second attempt after one German number format test in Spree's dashboard browser tests failed once. GitHub refused the merge because `main` had moved (#103), with a conflict in LIQ-004's progress table, resolved in `4eb647d1` |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [42846282786](https://github.com/pateldhruval872/liquorify/actions/runs/42846282786) | Passed, 15:37 to 15:52 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `a3a427fc`, because batch 10 adds stories and reference images | [42846329377](https://github.com/pateldhruval872/liquorify/actions/runs/42846329377) | Passed, 15:37 to 16:03 UTC: all four parts, 4,192 of 4,192 comparisons |
| Tests: the backend's builds and Spree's test suites, and Brakeman | None | Did not start, as expected: on a push to `main` it runs only when `spree/` or its own workflow file changes, and #94 changes neither. It passed on #94's final commit |

## 5. What stays open

- SD-44 to SD-46 stay open with the owner's severities, SD-45 Medium and SD-44 and SD-46 Low, fixes deferred until after the baseline.
- G-97 and G-99 stay open until the platform batch's step [P13](../work-items/fb-19-batch-platform.md#p13-customer-verification-a-follow-up-to-batch-10) closes them, G-97 through its browser tests and G-99 through its refusal checks. G-99 stays linked to G-11, and P11's and P12's scopes are unchanged.
- G-96 is deferred, each of its 39 stories to batch 12, batch 13 or the comparison follow-up, keeping its comparison status. G-98 is accepted as simulated interface-state coverage only.
- CAP-08-02, CAP-08-03, CAP-08-05 and CAP-08-06 stay PARTIAL, and FL-23 PARTIAL.
- Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open, FB-03 paused and the multi-tenant release block kept.
