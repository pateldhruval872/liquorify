---
title: FB-19 batch 11, home figures, reports and emails, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-11-01 to CAP-11-05, FL-18, FL-22), G-100 to G-104 (gaps), SD-51 to SD-56 (defects)
date: 2026-11-10
verifier: Claude (automated session, the thread for batch 11); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 11 in #89 at `3b6c8a7b`. Criteria 1 to 7 and 9 to 17 stand as the verification record gives them. All 45 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them with 3,896 of 3,896 comparisons each, and the merge commit `0950e2de` holds exactly that revision. On `main`, Packages and the visual check started by hand both passed. The owner's answers of 2026-11-10 on SD-51 to SD-56 and G-100 to G-104 are the owner's, recorded in the verification record's §14, and are not part of this acceptance. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 11, home figures, reports and emails, merged with its delegated acceptance

**Claim.** [#89](https://github.com/pateldhruval872/liquorify/pull/89) holds FB-19's [batch 11](../work-items/fb-19-batch-home-reports-and-emails.md): the home page's figures, reports with their CSV export, and the email settings and customer email template editor. It met the work item's acceptance criteria as its [verification record](2026-11-10-fb-19-batch-home-reports-and-emails.md) gives them. Every required check passed on its final commit, including both full runs of Storybook's visual check, and it merged into `main` exactly as last revised. This record covers:

- the delegated acceptance and the revision it applies to;
- the checks on GitHub, including the heads that `main` overtook;
- the merge;
- what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work. The owner did answer its defects and gaps, which is recorded separately ([record §14](2026-11-10-fb-19-batch-home-reports-and-emails.md#14-the-owners-answers-2026-11-10)) |
| Date | 2026-11-10 |
| Accepted by | Claude, in the thread for batch 11 |
| Revision | #89's final commit, `3b6c8a7b`. Its stories, fixtures, mocks, reference images and scripts are those of `cbb38d3d` and `e3692b9b`, as the verification record's revisions give them. The commits after them change only Liquorify's records (`59911b44`, and `53497866` with the owner's answers), or bring in `main` (`176d16a8` after #91, `817402b3` after #92 and `3b6c8a7b` after #95). No story or image changed after the images were reviewed |
| Scope | As the verification record's §13 gives it: the 174 reference images of the [image review list](2026-11-10-fb-19-batch-home-reports-and-emails-image-review.md), each looked at in light and dark; the running-screen evidence; fidelity, judged from the comparison of 29 cases and 1 earlier story, with every difference explained; and technical acceptance of criteria 1 to 10 and 12 to 17 |
| Not accepted here | • The owner's answers on SD-51 to SD-56 and G-100 to G-104, which are the owner's.<br>• B1 to B14, which stay observations for later product review, not approved as correct.<br>• The 12 behaviours of G-100 and the permission checks of G-103, which go to the [batch 11 verification work item](../work-items/fb-19-batch-home-reports-and-emails-verification.md). Nothing unverified becomes PASS.<br>• Tenant isolation, which stays NOT_RUN. |

## 2. The merge commit

`main` at `0950e2de`, "Merge pull request #89: Added batch 11, home figures, reports and emails", merged at 05:18 UTC on 2026-11-10 through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `1f0e2c63`, after #95, and #89's final commit `3b6c8a7b`. Its tree is `180444b0`, the same as `3b6c8a7b`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 894 files:

- **The Storybook package, 206 files**, under `packages/liquorify-storybook/`: the story files, fixtures and mocks, the 174 reference images, and the fidelity scripts.
- **Records, 688 files:** under `liquorify/verification/`, the verification record, the image review list and the evidence; LIQ-004, LIQ-008, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

## 3. Required checks on the final commit

All 45 checks on `3b6c8a7b` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages each ran once on this commit. Storybook's visual check ran twice, once from the pull request and once started by hand, as criterion 8 asks. No job was run again.

| Check | Result |
|---|---|
| Tests: Build (PostgreSQL) and (MySQL), each with 9 test jobs, and Brakeman ([42759205138](https://github.com/pateldhruval872/liquorify/actions/runs/42759205138)) | Passed, 04:58 to 05:13 UTC |
| Packages: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42759205224](https://github.com/pateldhruval872/liquorify/actions/runs/42759205224)) | Passed, 04:58 to 05:12 UTC |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42759205461](https://github.com/pateldhruval872/liquorify/actions/runs/42759205461)) | Passed, 04:58 to 05:18 UTC: 3,896 of 3,896 comparisons, every part passed |
| Storybook & visual check, started by hand, in four parts, and its summary ([42759205886](https://github.com/pateldhruval872/liquorify/actions/runs/42759205886)) | Passed, 04:58 to 05:18 UTC: 3,896 of 3,896 comparisons, every part passed |

The 3,896 comparisons are batch 11's 174 and the 3,722 of the batches merged before it.

**The earlier heads.** None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `53497866` | [Tests 42751979894](https://github.com/pateldhruval872/liquorify/actions/runs/42751979894), [Packages 42751979912](https://github.com/pateldhruval872/liquorify/actions/runs/42751979912), [Storybook 42751979813](https://github.com/pateldhruval872/liquorify/actions/runs/42751979813) and [42751984029](https://github.com/pateldhruval872/liquorify/actions/runs/42751984029) started by hand | All passed. `main` then moved (#92), with conflicts in LIQ-004 and the README index, resolved in `817402b3` by keeping both sides' entries |
| `817402b3` | [Tests 42756462062](https://github.com/pateldhruval872/liquorify/actions/runs/42756462062), [Packages 42756462377](https://github.com/pateldhruval872/liquorify/actions/runs/42756462377), [Storybook 42756462138](https://github.com/pateldhruval872/liquorify/actions/runs/42756462138) and [42756468297](https://github.com/pateldhruval872/liquorify/actions/runs/42756468297) started by hand | All passed. GitHub refused the merge because `main` had moved again (#95); `3b6c8a7b` brought it in without a conflict |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [42761344878](https://github.com/pateldhruval872/liquorify/actions/runs/42761344878) | Passed, 05:18 to 05:31 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `0950e2de`, because batch 11 adds stories and reference images | [42761356905](https://github.com/pateldhruval872/liquorify/actions/runs/42761356905) | Passed, 05:18 to 05:43 UTC: all four parts, 3,896 of 3,896 comparisons |
| Tests: the backend's builds and Spree's test suites, and Brakeman | None | Did not start, as expected: on a push to `main` it runs only when `spree/` or its own workflow file changes, and #89 changes neither. It passed on #89's final commit |

## 5. What stays open

- SD-51 to SD-56 stay open with the owner's severities, SD-53 Medium and the rest Low, fixes deferred until after the baseline.
- G-100 and G-103 stay open until the [batch 11 verification work item](../work-items/fb-19-batch-home-reports-and-emails-verification.md) closes them. G-103 stays linked to G-11, and P12's recorded scope is unchanged.
- G-101 is deferred to the comparison follow-up, G-102 accepted as simulated interface-state coverage only, and G-104 accepted within its documented limits, with verification on the selected host deferred to G-16 and G-77.
- Tenant isolation stays NOT_RUN.
