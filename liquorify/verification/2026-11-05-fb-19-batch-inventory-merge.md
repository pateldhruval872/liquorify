---
title: FB-19 batch 6, inventory, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-07-09, CAP-07-10, FL-14, FL-15), G-78, G-85 to G-87 (gaps), SD-23
date: 2026-11-05
verifier: Claude (automated session, thread "Build dashboard inventory (batch 6)"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 6 in #64 at `62cb2fe3`, whose stories, fixtures, mocks and reference images are those of `bb83f4b1` and whose G-78 script is that of `602c2066`. Criteria 1 to 15 of the work item stand as the verification record gives them. All 37 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them, and the merge commit `273e0be8` holds exactly that revision. On the earlier heads every check passed or was cancelled by a newer push. G-78 closed on its check's evidence, as the owner's answer provides, and the merge closes nothing else. G-85 to G-87 stay OPEN, SD-23 stays open, the narrower roles' requests stay with G-11, and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 6, inventory, merged with its delegated acceptance

**Claim.** [#64](https://github.com/pateldhruval872/liquorify/pull/64), FB-19's [inventory batch](../work-items/fb-19-batch-inventory.md), met the work item's acceptance criteria as its [verification record](2026-11-04-fb-19-batch-inventory.md) gives them. Every required CI check passed on its final commit, both full runs of Storybook's visual check among them, and it merged into `main` exactly as it was last revised. This record states the delegated acceptance, the revision it applies to, the merge, and what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Build dashboard inventory (batch 6)" |
| Revision | #64's final commit, `62cb2fe3`. Its stories, fixtures, mocks and reference images are identical to `bb83f4b1`'s. The commits after it add the evidence and records, or bring in `main`: `99751176` brought in part 3 of the catalog batch (#61), which added its own roles and fixture tests to two files batch 6 shares, the fidelity roles and the fixture tests; `0c61c46b` brought in part 3's merge record (#66) and the security audit's fix (#57); `602c2066` added the verification record, the evidence and G-78's script; and `62cb2fe3` brought in the dependency updates (#58), which changed the lockfile and the workspace's overrides and no file of batch 6 |
| Scope | As the verification record's [§12](2026-11-04-fb-19-batch-inventory.md#12-delegated-acceptance) gives it: the 204 reference images of the [image review list](2026-11-04-fb-19-batch-inventory-image-review.md), each looked at in light and dark; the running-screen evidence; fidelity, judged from the comparison of 17 cases and 15 earlier stories, every difference explained; the evidence of G-78's check; and technical acceptance of criteria 1 to 10 and 12 to 15 |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status. G-85 to G-87 stay OPEN for the owner's answers, with their handling proposed, not decided. The narrower roles' requests join G-11 for P10, and G-11 stays open. SD-23 stays open with its proposed severity. B1 to B18 stay recorded as Spree's and the storefront's behaviour. FB-03's result stays with the owner |

What the checks did not show stays as the verification record's §10 states it: coverage is not functional verification, 13 states were reached in the browser, the narrower roles' requests were not sent, G-78's check is one run of one hold and shows no expired hold, and tenant isolation is NOT_RUN, with ISO-1 to ISO-7 open.

## 2. The merge commit

`main` at `273e0be8`, "Merge pull request #64", merged at 02:02 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `953a281d`, after #58, and #64's final commit `62cb2fe3`. Its tree is `22e64ef5`, the same as `62cb2fe3`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 914 files:

- **The Storybook package, 233 files:** 15 story files and the page helper they share, 3 fixture files, 1 mock and 2 decorators under `packages/liquorify-storybook/src/`; the 204 reference images under `visual/__screenshots__/`; 6 capture, comparison and G-78 files under `fidelity/`; and the package's `.gitignore`, which leaves out the scripts' local results.
- **Records, 681 files:** the verification record, the image review list and 675 evidence files under `liquorify/verification/`; LIQ-004, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/`, no workflow, no `package.json` and no lockfile changed.

**Why the final commit is `62cb2fe3`.** The coordinating session held merges to `main` from 00:25 UTC until the dependency updates in #58 were in. #58 merged as `953a281d` at 01:07 UTC, and `62cb2fe3` brought it in at 01:08, with no conflict. The coordinating session then set the order of the next merges, #64 first, to avoid another round of re-runs, and #64 merged once every check had passed on `62cb2fe3`.

## 3. Required checks on the final commit

All 37 checks on `62cb2fe3` finished without a failure: 31 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages ran once on this commit, and Storybook's visual check twice, once from the pull request and once started by hand, as criterion 8 asks. No job was run again.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41946510188](https://github.com/pateldhruval872/liquorify/actions/runs/41946510188)) | Passed, 01:09 to 01:22 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41946510142](https://github.com/pateldhruval872/liquorify/actions/runs/41946510142)) | Passed, 01:09 to 01:17 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed, with the 31 browser tests of FL-14 and FL-15 among them |
| Storybook & visual check, from the pull request ([41946510132](https://github.com/pateldhruval872/liquorify/actions/runs/41946510132)) | Passed on its first attempt: 3,008 of 3,008 comparisons, in 51.1 minutes |
| Storybook & visual check, started by hand ([41946509996](https://github.com/pateldhruval872/liquorify/actions/runs/41946509996)) | Passed on its first attempt: 3,008 of 3,008 comparisons, in 50.5 minutes |

The 3,008 comparisons are batch 6's 204 and the 2,804 of the batches before it. Every image held the agreed tolerance, and no comparison was retried.

**The earlier heads.** Every run on #64 is listed. The runs on `8f13af9e` belong to #63, the batch's proposal, and are not counted here.

| Revision | Runs | Result |
|---|---|---|
| `47d14284`, `bb83f4b1` | None | Both were committed before #64 was opened at 23:19 UTC on 2026-11-04, and had no runs of their own |
| `99751176`, after #61 | [Tests 41932848442](https://github.com/pateldhruval872/liquorify/actions/runs/41932848442), [Packages 41932848705](https://github.com/pateldhruval872/liquorify/actions/runs/41932848705), [Storybook 41932848707](https://github.com/pateldhruval872/liquorify/actions/runs/41932848707) from the pull request | All passed; the visual run passed 3,008 of 3,008 in 50.8 minutes. Not merged: the records and G-78's check were still to come |
| `0c61c46b`, after #66 and #57 | None | It had no runs of its own |
| `602c2066` | [Tests 41941383931](https://github.com/pateldhruval872/liquorify/actions/runs/41941383931), [Packages 41941383909](https://github.com/pateldhruval872/liquorify/actions/runs/41941383909), [Storybook 41941383932](https://github.com/pateldhruval872/liquorify/actions/runs/41941383932) from the pull request and [41941437234](https://github.com/pateldhruval872/liquorify/actions/runs/41941437234) started by hand | Tests and Packages passed. Every step of the pull request's visual run succeeded, its comparison passing 3,008 of 3,008 in 41.0 minutes, but GitHub marked the run cancelled, because the push of `62cb2fe3` asked it to stop as it was finishing; the run started by hand was cancelled unfinished by the same push. Not merged, because merges were held until #58 was in |

**The time the visual check takes.** At 3,008 comparisons, the four full runs on #64 took 41.0 to 51.1 minutes, and the run on `main` 39.9 (§4), against the workflow's limit of 60, which part 2 of the catalog batch set when 2,228 comparisons took 39.7. The time depends on the runner as much as on the count. The next batch that adds stories may need a longer limit, or the run split in parts; that is a workflow change for its own pull request to propose.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41952560029](https://github.com/pateldhruval872/liquorify/actions/runs/41952560029) | Passed, 02:02 to 02:14 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `273e0be8`, as after part 3 | [41952612266](https://github.com/pateldhruval872/liquorify/actions/runs/41952612266) | Passed, 02:03 to 02:44 UTC, on its first attempt: 3,008 of 3,008 comparisons in 39.9 minutes |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #64 changes neither. It passed on #64's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** batch 6 as merged, at `62cb2fe3`, within its documented limits, by delegated acceptance. The image review list records every image as DELEGATED ACCEPTANCE. The acceptance changes no functional result.
- **Capabilities:** CAP-07-09 and CAP-07-10 are mapped, both PARTIAL, for G-87, with stock moved by orders handed to batch 8. LIQ-004's count is 62 of 93; CAP-07-06 is the last of §7 not started.
- **Flows:** FL-14 and FL-15 are mapped step by step, which makes 13 of 24: both PARTIAL, their dashboard steps passing Spree's browser tests in CI and their last step, the stock on the inventory list, captured with no browser test (G-87).
- **Screens and components:** 67 of the dashboard's and seller panel's 117 screens captured, and 251 of the dashboard side's 379 components with stories.
- **G-78:** CLOSED on 2026-11-05, on the evidence the owner's answer asked for: one checkout held the last unit, and the second shopper's checkout refused it, at both widths, with what the server answered. What the storefront shows that shopper, an empty cart without the reason, is B17, recorded and not changed. An expired hold was not shown.
- **Still open:** G-85 to G-87 wait for the owner's answers. SD-23, the purchase order list's late orders, stays open with its proposed severity. The narrower roles' requests join G-11 for P10, and G-11 stays open. B1 to B18 stay recorded and not changed. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open, and FB-03's result stays with the owner.
- **Statuses are unchanged.** The work item stays PROPOSED until it is accepted under D5, and LIQ-004 stays DRAFT.
- **Next:** in lane C, the platform batch's step P9 follows batch 6. Its first part is #67.
