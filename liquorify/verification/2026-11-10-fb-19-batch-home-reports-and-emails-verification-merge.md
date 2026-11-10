---
title: FB-19 batch 11 verification, merged with its delegated acceptance
record: verification
work_item: FB-19, G-100, G-103 and G-117 (gaps)
date: 2026-11-10
verifier: Claude (automated session, thread "Verify batch 11 behaviours"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of the batch 11 verification work item in #105 at `94a8871b`. Criteria 1 to 6 stand as the verification record gives them. All 45 checks on the final commit passed or were skipped as on every pull request, both visual runs among them with 4,426 of 4,426 comparisons each, and the merge commit `651868f9` holds exactly that revision. Five earlier heads also passed every check but were overtaken by `main`. On `main`, Packages and the visual check started by hand both passed. G-100 is CLOSED; G-103 stays linked to G-11; G-117 stays open for the owner. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 11 verification, merged with its delegated acceptance

**Claim.** [#105](https://github.com/pateldhruval872/liquorify/pull/105) carries out the [batch 11 verification work item](../work-items/fb-19-batch-home-reports-and-emails-verification.md). It met the work item's acceptance criteria as its [verification record](2026-11-10-fb-19-batch-home-reports-and-emails-verification.md) gives them. Every required check passed on its final commit, including both runs of Storybook's visual check, and it merged into `main` exactly as last revised. This record covers:

- the delegated acceptance and the revision it applies to;
- the checks on GitHub, including the heads that `main` overtook;
- the merge;
- what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work. The owner did choose, on 2026-11-10, to record the analyst's two 404 answers as G-117 |
| Date | 2026-11-10 |
| Accepted by | Claude, in the thread for the batch 11 verification |
| Revision | #105's final commit, `94a8871b`. Its tests and evidence are those of `d78e0491` (`18d72f42` after the rebase), with the sabotage change `db602fdf`, as the verification record gives them. The commits after them bring in `main` only: `08666bd3` after #101 and #104, `803876d4` after #107, `f0bcb1d2` after #108, `9ad82e31` after #106 and `94a8871b` after #110. Each kept both sides' entries in LIQ-004, the README index and the browser tests' list. No test, expected answer or piece of evidence changed after the recorded runs |
| Criteria | 1: the 12 behaviours each have a browser test; ten pass, and behaviours 10 and 12 fail only at SD-52's and SD-51's checks.<br>2: the 28 permission checks are sent and recorded beside the expected answers; 26 match, and the analyst's rename and delete answer 404, recorded as G-117.<br>3: 45 comparison cases cover 43 of the 54 stories sent to this work item; the other 11 keep their coverage with a reason.<br>4: Spree's code, the storefront and every workflow are unchanged, and no credential, personal data or machine path is committed.<br>5: the verification record, LIQ-004's rows, the work item and the README index are updated.<br>6: tenant isolation stays NOT_RUN, and no check read or wrote another store's records |
| Not accepted here | • G-117, which is the owner's to answer. Its two checks stay failing.<br>• SD-51 and SD-52, which stay open with the owner's answers of 2026-11-10.<br>• Tenant isolation, which stays NOT_RUN. |

## 2. The merge commit

`main` at `651868f9`, "Merge pull request #105: Added batch 11 verification: behaviour tests, permission checks and comparisons", merged at 20:10 UTC on 2026-11-10 through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `0057cc53`, after #110, and #105's final commit `94a8871b`. Its tree is `64bf9c5a`, the same as `94a8871b`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 238 files:

- **The Storybook package, 8 files**, under `packages/liquorify-storybook/fidelity/`: the three browser test scripts and the comparison script, their shared helper `b11.ts`, the report helpers moved out of `fl-22.spec.ts` into `reporting.ts` so both scripts use them, and the test list.
- **Records, 230 files:** under `liquorify/verification/`, the verification record, its evidence and the image review list; LIQ-004, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

## 3. Required checks on the final commit

All 45 checks on `94a8871b` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Storybook's visual check ran twice, once from the pull request and once started by hand. No job was run again.

| Check | Result |
|---|---|
| Tests: Build (PostgreSQL) and (MySQL), each with its test jobs, and Brakeman ([42887868080](https://github.com/pateldhruval872/liquorify/actions/runs/42887868080)) | Passed, 19:42 to 20:07 UTC |
| Packages: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42887868152](https://github.com/pateldhruval872/liquorify/actions/runs/42887868152)) | Passed, 19:42 to 19:57 UTC |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42887868104](https://github.com/pateldhruval872/liquorify/actions/runs/42887868104)) | Passed, 19:42 to 20:05 UTC: 4,426 of 4,426 comparisons, every part passed |
| Storybook & visual check, started by hand, in four parts, and its summary ([42887874979](https://github.com/pateldhruval872/liquorify/actions/runs/42887874979)) | Passed, 19:42 to 20:07 UTC: 4,426 of 4,426 comparisons, every part passed |

**The earlier heads.** Each passed every check, both visual runs included, but none of them counts.

| Revision | Runs | What happened next |
|---|---|---|
| `72f2fa2e` | [Tests 42851947899](https://github.com/pateldhruval872/liquorify/actions/runs/42851947899), [Packages 42851947662](https://github.com/pateldhruval872/liquorify/actions/runs/42851947662), [Storybook 42851947797](https://github.com/pateldhruval872/liquorify/actions/runs/42851947797) and [42856563641](https://github.com/pateldhruval872/liquorify/actions/runs/42856563641) started by hand | `main` had moved (#101, #104), with conflicts in LIQ-004, the README index and the test list, resolved in `08666bd3` by keeping both sides |
| `08666bd3` | [Tests 42863351492](https://github.com/pateldhruval872/liquorify/actions/runs/42863351492), [Packages 42863350926](https://github.com/pateldhruval872/liquorify/actions/runs/42863350926), [Storybook 42863350813](https://github.com/pateldhruval872/liquorify/actions/runs/42863350813) and [42863346359](https://github.com/pateldhruval872/liquorify/actions/runs/42863346359) started by hand | `main` moved (#107), with a conflict in the README index, resolved in `803876d4` by keeping both rows |
| `803876d4` | [Tests 42869997215](https://github.com/pateldhruval872/liquorify/actions/runs/42869997215), [Packages 42869997297](https://github.com/pateldhruval872/liquorify/actions/runs/42869997297), [Storybook 42869997258](https://github.com/pateldhruval872/liquorify/actions/runs/42869997258) and [42869996546](https://github.com/pateldhruval872/liquorify/actions/runs/42869996546) started by hand | GitHub refused the merge because `main` had moved (#108); `f0bcb1d2` brought it in without a conflict |
| `f0bcb1d2` | [Tests 42877452802](https://github.com/pateldhruval872/liquorify/actions/runs/42877452802), [Packages 42877452904](https://github.com/pateldhruval872/liquorify/actions/runs/42877452904), [Storybook 42877452595](https://github.com/pateldhruval872/liquorify/actions/runs/42877452595) and [42877448041](https://github.com/pateldhruval872/liquorify/actions/runs/42877448041) started by hand | `main` moved (#106); `9ad82e31` brought it in without a conflict |
| `9ad82e31` | [Tests 42882718980](https://github.com/pateldhruval872/liquorify/actions/runs/42882718980), [Packages 42882718407](https://github.com/pateldhruval872/liquorify/actions/runs/42882718407), [Storybook 42882718459](https://github.com/pateldhruval872/liquorify/actions/runs/42882718459) and [42882718714](https://github.com/pateldhruval872/liquorify/actions/runs/42882718714) started by hand | `main` moved (#110), with a conflict in LIQ-004's G-99 and G-100 rows, resolved in `94a8871b` by taking G-99 from `main` and G-100 from #105. The other open pull requests then held their merges until #105 landed |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [42892621859](https://github.com/pateldhruval872/liquorify/actions/runs/42892621859) | Passed, 20:10 to 20:22 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `651868f9`, because #105 changes the fidelity scripts | [42892652659](https://github.com/pateldhruval872/liquorify/actions/runs/42892652659) | Passed, 20:10 to 20:31 UTC: all four parts, 4,426 of 4,426 comparisons |
| Tests: the backend's builds and Spree's test suites, and Brakeman | None | Did not start, as expected: on a push to `main` it runs only when `spree/` or its own workflow file changes, and #105 changes neither. It passed on #105's final commit |

## 5. What stays open

- G-117 stays open for the owner's answer. The analyst's rename and delete checks stay failing against the answers recorded first.
- G-103 stays linked to G-11, open, with P12's recorded scope unchanged.
- SD-51 and SD-52 stay open with the owner's answers of 2026-11-10; their checks in behaviours 12 and 10 stay failing.
- The 11 stories not compared keep the coverage the image review list gives them.
- Tenant isolation stays NOT_RUN.
