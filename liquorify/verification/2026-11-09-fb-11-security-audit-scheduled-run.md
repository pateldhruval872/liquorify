---
title: FB-11's security audit, first scheduled run after the repair
record: verification
work_item: FB-11
date: 2026-11-09
verifier: Claude (automated session, thread "Test storefront against Liquorify backend"); not independent review
result: PASS in CI. The weekly security audit's scheduled run on 2026-11-09, the first since the repair (#57) and the dependency updates (#58) merged, passed on `main` at `934e6eea`. It skipped the unpublished `deepmerge` fix version, changed no file, opened no pull request, and still reports the `deepmerge` advisory as unresolved, with no ignore entry. This was the last part of step 1's done-when, so step 1 of the foundation lane is done. FB-11 stays open for the storefront's Dependabot pull requests. This is not the owner's review
---

# FB-11's security audit, first scheduled run after the repair

**Claim.** Step 1 of the [foundation lane](../work-items/foundation-lane-security-audit-and-storefront-backend.md#12-the-result-2026-11-04-and-2026-11-05) was done when the run by hand and the next scheduled Monday run both passed. The run by hand passed on 2026-11-04 and again on `main` on 2026-11-05 ([record](2026-11-04-fb-11-security-audit-repair.md)). This record states the scheduled run's result. Everything below is from CI; nothing was run locally.

## 1. The run

| What | Detail |
|---|---|
| Run | [42637665774](https://github.com/pateldhruval872/liquorify/actions/runs/42637665774), started by the schedule (Mondays 06:00 UTC). GitHub started it at 14:44 UTC, and it finished at 14:45 UTC |
| Revision | `main` at `934e6eea`. The workflow file is unchanged since #57's final commit `8a972334`, and `pnpm-workspace.yaml` and `pnpm-lock.yaml` are unchanged since #58's merge `953a281d` |
| Result | Passed, every step |

## 2. What each step did

| Step | Result |
|---|---|
| Report current advisories | One low advisory: GHSA-gcqx-w48m-w2h4, `deepmerge` versions 4.2.0 to 4.3.1, through the `shadcn` tool's four paths in `@spree/dashboard` and `@spree/dashboard-ui` |
| Pin available fixes | pnpm proposed one override, `deepmerge` to `^4.3.2`, with a release-age exclusion for `deepmerge@4.3.2`. The registry answered that 4.3.2 is not published, so the step warned "deepmerge@4.3.2 is not published, so its advisory stays unresolved", removed both entries, and the lockfile refresh completed |
| Collect remaining advisories | The same low `deepmerge` advisory |
| Open pull request | Nothing to propose: no file differed from `main`. The workflow reset `chore/security-audit` to `main` (`934e6eea`) and opened no pull request |

The ignore list still holds only the `braces` entry (GHSA-vfj7-8cjw-p6xm); nothing was added for `deepmerge`.

## 3. Against step 1's done-when

| Done when | Result |
|---|---|
| The run by hand passes | Done on 2026-11-04 and 2026-11-05 ([record](2026-11-04-fb-11-security-audit-repair.md)) |
| The next scheduled Monday run passes | **Done:** this run |
| The pull request it opens is reviewed under FB-11 | Done: #58 was reviewed and merged. This run opened none |
| FB-11's text in LIQ-004 says what ran and what was decided | Done, with this record |

## 4. What stays open

- **The `deepmerge` advisory** stays reported and unresolved until a fixed version is published. It affects the `shadcn` developer tool only. Each weekly run will keep skipping the unpublished version and reporting it.
- **GitHub's schedule ran about nine hours late.** The two earlier scheduled runs also started hours after 06:00 UTC. Nothing depends on the hour.
- **FB-11** stays open for the storefront's Dependabot pull requests.
