---
title: FB-19 batch 12 part 1, wholesale in the dashboard, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-09-01, CAP-09-05 and CAP-09-06, the staff step of CAP-09-03 and the dashboard side of CAP-09-04; FL-10's staff step and the company invitation), G-96 (batch 12's share), G-123 to G-128 (gaps), SD-86 to SD-89 (defects)
date: 2026-11-11
verifier: Claude (automated session, the thread for batch 12); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 12 part 1 in #109 at `7be9cf73`. Criteria 1 to 7 and 9 to 18 stand as the verification record gives them, and criterion 8 is met here. All 40 checks on the final commit passed or were skipped as on every pull request, and Storybook's visual check passed twice on it. The merge commit `e3af0d59` holds exactly that revision. On `main`, Packages from the push and a Storybook visual run started by hand both passed on `e3af0d59`. The approved defects stay open with their fixes deferred, and SD-86 to SD-89 and G-123 to G-128 wait for the owner's answers. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 12 part 1, wholesale in the dashboard, merged with its delegated acceptance

**Claim.** [#109](https://github.com/pateldhruval872/liquorify/pull/109) holds part 1 of FB-19's [batch 12](../work-items/fb-19-batch-wholesale.md): the wholesale screens of the admin dashboard, the company invitation email, and batch 12's share of G-96. It met the work item's acceptance criteria as its [verification record](2026-11-10-fb-19-batch-wholesale.md) gives them. Every required check passed on its final commit, including both full runs of Storybook's visual check. It merged into `main` exactly as last revised.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-11 |
| Accepted by | Claude, in the thread for batch 12 |
| Conditions | The owner's message of 2026-11-10 allowed the merge only after the acceptance criteria and every required check passed: both visual runs, Tests and Packages. All of these were met (§4). The merge then waited, at the coordinator's request, for #105 and #111 to land first, so that `main` took one change at a time |
| Revision | #109's final commit, `7be9cf73`. Its stories, fixtures, mocks and scripts are those of `f0af94b5`. The later commits change only Liquorify's records (`7704795b`; `e61ffcee`, which renumbered the gaps), or bring in `main` (`11ef9a16`, `81695b3f`, the merge in `e61ffcee` after #105 and #113, and `7be9cf73` after #111). Every merge with `main` conflicted only in Liquorify's records: in LIQ-004 and the README index, where both sides' rows were kept, and once in `providers.tsx` and the fidelity configuration, where both sides were kept too |
| Scope | As the verification record's §14 gives it: the 34 reference images of the [image review list](2026-11-10-fb-19-batch-wholesale-image-review.md), each looked at in light and dark; the running-screen evidence; fidelity, judged from the comparison of 36 cases, 16 new and 20 earlier, with every difference explained; and technical acceptance of criteria 1 to 10 and 12 to 18 |
| Not accepted here | • The approved defects of earlier batches, which stay open with their fixes deferred until after the baseline.<br>• SD-86 to SD-89 and G-123 to G-128, recorded for the owner's answers. SD-86 is proposed High: the company invitation email sends the buyer to a storefront page that does not exist.<br>• The 17 behaviours of G-123, which no browser test drives. Nothing unverified becomes PASS.<br>• Tenant isolation, which stays NOT_RUN. ISO-1 to ISO-7 stay open and FB-03 stays paused. |

## 2. The gaps' numbers

#105, the batch 11 verification, took G-117 on `main` before this batch merged. The register thread therefore moved this batch's six gaps up by six, from G-117 to G-122 to G-123 to G-128, and released G-118 to G-122, which are never reused. `e61ffcee` renumbered every record this pull request changes and left `main`'s own G-117 as it was. SD-86 to SD-89 did not change.

## 3. The merge commit

`main` at `e3af0d59`, "Merge pull request #109: Added batch 12 part 1, wholesale in the dashboard", merged on 2026-11-11 at 01:37 UTC through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `fd711171`, after #111, and #109's final commit `7be9cf73`. Its tree is `e447a2a1`, the same as `7be9cf73`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 460 files:

- **The Storybook package, 50 files**, under `packages/liquorify-storybook/`: the story files, fixtures, mocks and providers (9), the reference images (34), and the fidelity scripts and configuration (7).
- **Records, 410 files:** under `liquorify/verification/`, the verification record, the image review list and the evidence (405); LIQ-004, LIQ-008, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

## 4. Required checks on the final commit

All 40 checks on `7be9cf73` finished without a failure: 34 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages each ran once on this commit. Storybook's visual check ran twice, once from the pull request and once started by hand as a second attempt of the same run, as criterion 8 asks. Spree's own browser test for these screens, `companies.spec.ts`, ran in Packages' Dashboard - E2E parts.

| Check | Result |
|---|---|
| Tests: Build (PostgreSQL) and (MySQL), each with 9 test jobs, and Brakeman ([42921766247](https://github.com/pateldhruval872/liquorify/actions/runs/42921766247)) | Passed, 23:15 to 23:29 UTC on 2026-11-10 |
| Packages: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42921766400](https://github.com/pateldhruval872/liquorify/actions/runs/42921766400)) | Passed, 23:15 to 23:23 UTC |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42921766611, attempt 1](https://github.com/pateldhruval872/liquorify/actions/runs/42921766611/attempts/1)) | Passed, 23:15 to 23:35 UTC, every part passed |
| Storybook & visual check, started by hand, in four parts, and its summary ([42921766611, attempt 2](https://github.com/pateldhruval872/liquorify/actions/runs/42921766611/attempts/2)) | Passed, 23:36 to 23:55 UTC, every part passed |

**The earlier heads.** None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `e61ffcee` | [Tests 42912700267](https://github.com/pateldhruval872/liquorify/actions/runs/42912700267), [Packages 42912700231](https://github.com/pateldhruval872/liquorify/actions/runs/42912700231), [Storybook 42912700192](https://github.com/pateldhruval872/liquorify/actions/runs/42912700192), twice | Passed. Superseded by `7be9cf73` when #111 merged into `main` |
| `81695b3f` | [Tests 42872244942](https://github.com/pateldhruval872/liquorify/actions/runs/42872244942), [Packages 42872245205](https://github.com/pateldhruval872/liquorify/actions/runs/42872245205), [Storybook 42872245005](https://github.com/pateldhruval872/liquorify/actions/runs/42872245005), twice | Passed. Superseded by the gaps' renumbering (§2) |
| `7704795b` | None | GitHub ran no pull request workflow while the branch conflicted with `main` |
| `11ef9a16` | [Tests 42866806295](https://github.com/pateldhruval872/liquorify/actions/runs/42866806295), [Packages 42866806350](https://github.com/pateldhruval872/liquorify/actions/runs/42866806350), [Storybook 42866806340](https://github.com/pateldhruval872/liquorify/actions/runs/42866806340) | Passed. Superseded by the registers' commit `7704795b` |

## 5. `main` after the merge

Both runs on `main` at `e3af0d59` passed. Tests did not start on the push, because the merge changes no file its workflow watches; it passed on the same tree as `7be9cf73` (§4).

| Check | Result |
|---|---|
| Packages, from the push to `main`: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42940333176](https://github.com/pateldhruval872/liquorify/actions/runs/42940333176)) | Passed, 01:37 to 01:51 UTC on 2026-11-11. The 6 release jobs were skipped |
| Storybook & visual check, started by hand on `main`, in four parts, and its summary ([42940454140](https://github.com/pateldhruval872/liquorify/actions/runs/42940454140)) | Passed, 01:38 to 02:00 UTC, every part passed |

## 6. What stays open

- SD-86 to SD-89, for the owner's answers. SD-86 is proposed High, because an invited buyer cannot accept from the email; SD-87 is proposed Medium; SD-88 and SD-89 are Low.
- G-123 to G-128, for the owner's answers: the behaviours no browser test drives, the states reached in the browser, the uncompared story and the expired status, the narrower roles' refusals with G-11, EM-C-11 with G-16, and how a company's catalog and the Wholesale price list combine before part 2 shows trade prices on the storefront.
- Part 2 of batch 12, the storefront's wholesale portal. The work item stays PROPOSED until it is accepted under D5.
- Tenant isolation, NOT_RUN, with the multi-tenant release block kept. Server permissions are unchanged, and nothing here authorizes broader access or role-template changes.
