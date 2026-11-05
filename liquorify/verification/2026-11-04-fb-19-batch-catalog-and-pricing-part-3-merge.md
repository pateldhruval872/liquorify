---
title: FB-19 catalog and pricing batch, part 3, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-05-12, CAP-05-13, the dashboard steps of FL-16 and FL-17), G-14, G-81 to G-84 (gaps)
date: 2026-11-04
verifier: Claude (automated session, thread "Build dashboard catalog part 3"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of part 3 in #61 at `6ec566ee`, whose stories and scripts are those of `e040f9d1` and whose reference images are those of `5db32bb1`. Criteria 1 to 16 of the work item's §12.7 stand as the verification record gives them. All 37 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them, and the merge commit `fc5cb555` holds exactly that revision. On the five earlier heads the same checks passed or were cancelled by a newer push, but for one MySQL job on `a3fa9975`, which failed on SD-11, a recorded defect in code this pull request does not touch, and passed on its one re-run. Part 3's first count of capabilities double-counted CAP-05-13; the count is 60 of 93. It closes nothing. G-14 stays PENDING with the owner, G-81, G-82 and G-84 stay OPEN, G-83 stays linked to the open G-11, and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 catalog and pricing batch, part 3, merged with its delegated acceptance

**Claim.** [#61](https://github.com/pateldhruval872/liquorify/pull/61), part 3 of FB-19's [catalog and pricing batch](../work-items/fb-19-batch-catalog-and-pricing.md#12-part-3-promotions-gift-cards-and-store-credit), promotions, gift cards and store credit, met the acceptance criteria of the work item's §12.7 as its [verification record](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md) gives them. Every required CI check passed on its final commit, both full runs of Storybook's visual check among them, and it merged into `main` exactly as it was last revised. This record states the delegated acceptance, the revision it applies to, the merge, and what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-04 |
| Accepted by | Claude, in the thread "Build dashboard catalog part 3" |
| Revision | #61's final commit, `6ec566ee`. Its part 3 stories, fixtures and scripts are identical to `e040f9d1`'s, and its reference images to `5db32bb1`'s. The commits after them add the evidence and records, or bring in `main`: at `60176e51`, which changed records only; at `ec2173ee`, after #59, which changed records and corrected part 2's import button story, with no image changed; at `b926ee4b`, after batch 9's #55 and #62; and at `5b23b5af`, after batch 6's proposal in #63. The last two changed records only |
| Scope | As the verification record's [§12](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md#12-acceptance) gives it: the 260 reference images of the [image review list](2026-11-04-fb-19-batch-catalog-and-pricing-part-3-image-review.md), each looked at in light and dark; the running-screen evidence; fidelity, judged from the comparison of 18 cases and 8 earlier stories, every difference explained; and technical acceptance of criteria 1 to 10 and 12 to 16 |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status. G-81, G-82 and G-84 stay OPEN for the owner's answers, with their handling proposed, not decided. G-83 is linked to G-11 for P10, and G-11 stays open. G-14 stays PENDING with the owner. B1 to B27 stay recorded as Spree's behaviour. FB-03's result stays with the owner |

What the checks did not show stays as the verification record's §10 states it: coverage is not functional verification, 11 states were reached in the browser, the refusals of §3.3 are observations of one run, nothing is claimed at checkout or on orders, and tenant isolation is NOT_RUN, with ISO-1 to ISO-7 open.

## 2. The merge commit

`main` at `fc5cb555`, "Merge pull request #61", merged at 23:04 UTC on 2026-11-04 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `5b23b5af`, after #63, and #61's final commit `6ec566ee`. Its tree is `eccb1f10`, the same as `6ec566ee`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 1,050 files:

- **The Storybook package, 284 files:** 16 story files, 2 fixture files and 1 mock under `packages/liquorify-storybook/src/`; the 260 reference images under `visual/__screenshots__/`; and the capture and comparison scripts under `fidelity/`.
- **Records, 766 files:** the verification record, the image review list and 760 evidence files under `liquorify/verification/`; LIQ-004, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/`, no workflow, no `package.json` and no lockfile changed.

**Why the final commit is `6ec566ee`.** Every required check passed on `2e7b1c45`, but `main` had moved with #59 before it could merge, and the branch no longer merged cleanly. `main` moved three times while #61's checks ran: #59, part 2's merge record; #55 and #62, batch 9's records; and #63, batch 6's proposal. Each conflicted in LIQ-004 or the README index, so GitHub refused the merge, and each was brought in by a merge commit, with both sides' text kept. The coordinating session then held the other lanes' merges until #61 was in. Bringing in batch 9 showed that part 3's first count of capabilities was wrong (§5).

## 3. Required checks on the final commit

All 37 checks on `6ec566ee` finished without a failure: 31 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages ran once on this commit, and Storybook's visual check twice, once from the pull request and once started by hand, as criterion 8 asks.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 41924793773](https://github.com/pateldhruval872/liquorify/actions/runs/41924793773)) | Passed, 22:23 to 22:34 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 41924793687](https://github.com/pateldhruval872/liquorify/actions/runs/41924793687)) | Passed, 22:23 to 22:32 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, from the pull request ([41924793633](https://github.com/pateldhruval872/liquorify/actions/runs/41924793633)) | Passed on its first attempt: 2,804 of 2,804 comparisons, in 36.4 minutes |
| Storybook & visual check, started by hand ([41924792631](https://github.com/pateldhruval872/liquorify/actions/runs/41924792631)) | Passed on its first attempt: 2,804 of 2,804 comparisons, in 39.3 minutes |

The 2,804 comparisons are part 3's 260 and the 2,544 of the batches before it. Every image held the agreed tolerance, and no comparison was retried.

**The earlier heads.** Every run on #61 is listed.

| Revision | Runs | Result |
|---|---|---|
| `e86b9746`, `4b79664f` | Tests, Packages and Storybook from the pull request, and Storybook started by hand on `4b79664f` | Cancelled, unfinished, by the concurrency rules when the next commit was pushed |
| `2e7b1c45` | [Tests 41900568479](https://github.com/pateldhruval872/liquorify/actions/runs/41900568479), [Packages 41900568651](https://github.com/pateldhruval872/liquorify/actions/runs/41900568651), [Storybook 41900568687](https://github.com/pateldhruval872/liquorify/actions/runs/41900568687) from the pull request and [41900565840](https://github.com/pateldhruval872/liquorify/actions/runs/41900565840) started by hand | All passed; the pull request's visual run passed 2,804 of 2,804. Not merged, because `main` had moved with #59 and the branch conflicted |
| `a3fa9975`, after #59 | [Tests 41909298794](https://github.com/pateldhruval872/liquorify/actions/runs/41909298794), first attempt | MySQL - core (2/3) failed 1 of 3,665 examples: `spec/models/spree/exports/products_spec.rb:39` could not open its export's temporary file, `Errno::ENOENT`. This is SD-11, already recorded: two exports of one kind for one store in the same second share a temporary file, and two test workers exported at once. #61 changes nothing under `spree/`, and the other 20 jobs passed, PostgreSQL's core (2/3) among them. The failure was explained on the pull request, and the job was re-run once |
| `a3fa9975` | [Tests 41909298794](https://github.com/pateldhruval872/liquorify/actions/runs/41909298794), the failed job run once more; [Packages 41909298793](https://github.com/pateldhruval872/liquorify/actions/runs/41909298793); [Storybook 41909298751](https://github.com/pateldhruval872/liquorify/actions/runs/41909298751) and [41909308257](https://github.com/pateldhruval872/liquorify/actions/runs/41909308257) | All passed; both visual runs passed 2,804 of 2,804. Not merged, because `main` had moved with #55 and #62 |
| `fc154039`, after #55 and #62 | [Tests 41917278411](https://github.com/pateldhruval872/liquorify/actions/runs/41917278411), [Packages 41917278416](https://github.com/pateldhruval872/liquorify/actions/runs/41917278416), [Storybook 41917278166](https://github.com/pateldhruval872/liquorify/actions/runs/41917278166) and [41917274790](https://github.com/pateldhruval872/liquorify/actions/runs/41917274790) | All passed. Not merged, because `main` had moved with #63 |

SD-11 stays open, by the owner's decision; its fix is a temporary file for each export, in its own pull request if the owner wants one ([record](2026-10-27-sd-11-export-file-name-collision.md)).

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41930706437](https://github.com/pateldhruval872/liquorify/actions/runs/41930706437) | Passed, 23:04 to 23:13 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `fc5cb555`, as after part 2 | [41930741378](https://github.com/pateldhruval872/liquorify/actions/runs/41930741378) | Passed, 23:04 to 23:48 UTC, on its first attempt: 2,804 of 2,804 comparisons in 42.2 minutes |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #61 changes neither. It passed on #61's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 3 as merged, at `6ec566ee`, within its documented limits, by delegated acceptance. The image review list records every image as DELEGATED ACCEPTANCE. The acceptance changes no functional result.
- **Capabilities:** the dashboard's side of CAP-05-12 and CAP-05-13 is PARTIAL: the dashboard steps of FL-16 and FL-17 map to Spree's browser tests, and the 22 behaviours no browser test drives are G-84. Batch 9, merged before this, maps their use at checkout, PARTIAL for G-75, and an order's discounts are batch 8's. Both capabilities were already counted, CAP-05-13 from the accounts batch's gift card list and CAP-05-12 from batch 9, so LIQ-004's count stays 60 of 93. Its first draft on this branch counted CAP-05-13 again, as 58 of 93 before batch 9; bringing in `main` after batch 9 corrected it. With part 3 and batch 9, every capability of LIQ-006 §5 is mapped.
- **Flows:** with batch 9's checkout step and the accounts batch's gift card list, FL-17 is mapped step by step, which makes 11 of 24: PARTIAL, for G-84 and G-75. FL-16's last step, an order's discounts, is batch 8's.
- **G-14:** no staff control and no Admin API request cancels a gift card at this revision, so the condition in G-14's proposal did not occur. G-14 stays PENDING with the owner.
- **For P10:** the verification record's §3.3 lists the reads each narrower role was refused while the captures ran. Spree answers 404, not 403, for a promotion and its rules and actions to a teammate who may not read promotions, and for the rules and actions to one who may read but not change them; P10's expectations should say so.
- **Still open:** G-81, G-82 and G-84 wait for the owner's answers. G-83 is linked to G-11. B1 to B27 stay recorded and not changed. Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open, and FB-03's result stays with the owner.
- **Statuses are unchanged.** The work item stays PROPOSED until it is accepted under D5, and LIQ-004 stays DRAFT.
- **Next:** batch 6, inventory, proposed in #63 and being built in lane C, merges after part 3, as its work item expects.
