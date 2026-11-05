---
title: SD-8 fix merged, with its delegated acceptance
record: verification
work_item: SD-8 (defect), G-36 (gap)
date: 2026-11-04
verifier: Claude (automated session, thread "Fix SD-8 demo prices"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of the SD-8 fix in #44 at `f38b3b3`, whose code is `bbf401c`. Every required check of the work item passed, and every required CI check passed on the final commit. The merge commit `c283660` holds exactly that revision. Tests and Packages passed on `main` at `c283660`. SD-8 and G-36 are CLOSED on passing evidence for the conditions their rows record. SD-13 and SD-14 stay open, and CAP-03-03 stays PARTIAL with a failing part, SD-13. This is not the owner's review
---

# SD-8 fix merged, with its delegated acceptance

**Claim.** The SD-8 fix in [#44](https://github.com/pateldhruval872/liquorify/pull/44) met the acceptance criteria the owner approved in the [work item](../work-items/sd-8-sample-data-currency-fix.md) (§5, and decisions 19 to 21). Every required CI check passed on its final commit, and it merged into `main` exactly as it was last revised. This record states the delegated acceptance, the revision it applies to, and what it closes and leaves open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-04 |
| Accepted by | Claude, in the thread "Fix SD-8 demo prices" |
| Revision | #44's final commit, `f38b3b3`. Its code is `bbf401c`; the commits after `bbf401c` change records only, and bring in `main` |
| Scope | Technical acceptance of the fix against the work item's §5: Spree's spec before and after the fix on PostgreSQL and SQLite, the required euro check (2a), first-run setup with sample data and the storefront in US dollars and Polish złoty (3, 4) and in euros (5), CI (6) and the search for credentials and paths (7) ([verification record](2026-11-04-sd-8-sample-data-currency-fix.md)). Image acceptance: no reference image changed, and Storybook's visual check passed. The welcome screen and storefront captures in the evidence were looked at; they are evidence, not reference images |
| Not accepted here | Any answer to a gap, any exception or security risk, and any change of status. SD-13 and SD-14 are recorded, not answered |

What the checks did not show stays as the verification record states it: German and French stores were not run in the browser, product images were not checked, the welcome screen's limitation is unchanged, and tenant isolation is NOT_RUN.

## 2. The merge commit

`main` at `c283660`, "Merge pull request #44", has two parents: `main` at `55e2950`, after #43, and #44's final commit `f38b3b3`. Its tree is `b450f78`, the same as `f38b3b3`'s, so the merge brought in exactly the reviewed revision and nothing else. #44 had already brought in `main` after #43, so GitHub showed it as up to date and clean before the merge. It merged through GitHub's protected merge, with no rule bypassed.

## 3. Required checks on the final commit

All 36 checks on `f38b3b3` finished without a failure: 30 passed, and 6 release jobs were skipped, as on every pull request. The required ones:

| Check | Result |
|---|---|
| Build (PostgreSQL) and the 9 PostgreSQL test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers | Passed |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests | Passed |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check | Passed |

The same checks had passed on the previous head, `e11f52e`, before `main` after #43 was brought in. The three PostgreSQL core parts took between 5 and 7 minutes each on `f38b3b3`. The loader spec's own added time, about 90 seconds, was measured locally (verification record, check 6).

## 4. Workflows on `main`

Both workflows that run on a push to `main` passed on the merge commit `c283660`:

| Workflow | Run | Result |
|---|---|---|
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | [41788883876](https://github.com/pateldhruval872/liquorify/actions/runs/41788883876) | Passed, 06:56 to 07:09 UTC |
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41788883860](https://github.com/pateldhruval872/liquorify/actions/runs/41788883860) | Passed, 06:56 to 07:05 UTC |

Storybook's visual check runs on pull requests only, and passed on #44's final commit.

## 5. What the acceptance closes, and what stays open

- **SD-8 is CLOSED** on 2026-11-04. Its row's condition, from decision 19, was a fix verified in US dollars and in Polish złoty, with existing euro prices kept as a required automated check, and closed only on passing evidence that is accepted. Checks 2, 2a, 3 and 4 passed, and this acceptance records it. The fix is a change to Spree's sample data that Liquorify carries until Spree makes its own or Liquorify moves to a release that does. It was not reported to Spree (decision 21).
- **G-36 is CLOSED** on 2026-11-04. Its condition, set by the owner on 2026-10-27, was that SD-8 is resolved and setup with sample data is verified in US dollars and in another currency. Checks 3 and 4 show both, and this acceptance records it.
- **SD-13 stays open:** a store whose language is German or French gets no sample orders. **SD-14 stays open:** the welcome screen still says the store is ready when the background load fails. Whether to fix either is a separate decision, and neither is reported to Spree (decision 37).
- **CAP-03-03 stays PARTIAL** with a failing part, now SD-13 instead of SD-8, and for tenant isolation. **FL-01 stays PARTIAL:** setup with sample data is shown working in US dollars, Polish złoty and euros, in English, and the getting started tasks' own steps are still not shown (G-37).
- **Statuses are unchanged.** The work item stays PROPOSED, and LIQ-004 stays DRAFT.

## 6. Correction, 2026-11-05: logs not committed

The logs the [evidence README](evidence/2026-11-04-sd-8-sample-data-currency-fix/README.md) names, Spree's spec runs and each first-run's setup check and storefront build, are not in the repository: it ignores files ending in `.log`, so they were left out of #44 without anyone noticing. This acceptance was given on them in the accepting thread's own working copy. No copy was found to add back.

This does not change what §5 closes. SD-8's and G-36's conditions rest on checks 2, 2a, 3 and 4. The committed first-run results show checks 3 and 4. Spree's spec holds checks 2 and 2a and is committed. It passed in CI's core jobs on PostgreSQL and MySQL on the final commit (§3), and it runs on every later pull request. What has no committed record is the spec failing before the fix, and the SQLite runs. Those are stated in the verification record's text only.
