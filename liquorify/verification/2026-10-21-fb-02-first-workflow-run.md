---
title: FB-02 first workflow run
record: verification
work_item: FB-02
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS
---

# FB-02 first workflow run

**Claim.** FB-02 acceptance criterion 1: `tests.yml` and `packages.yml` each have a run on a recorded `liquorify` revision, with a result for every job ([LIQ-004](../LIQ-004-foundation-backlog.md#recommended-next-work-item)). This follows the [blocked record](2026-10-21-fb-02-pull-request-checks.md), which stays as written.

**Result: PASS.** Both workflows ran on the FB-02 pull request once the owner turned Actions on (OA-2). All 29 jobs that run on a pull request passed, and the six npm release jobs reported skipped. One step failed without failing its jobs: Codecov refused the coverage uploads because the run has no Codecov token (see Failures). The result covers Spree's own suites only. It says nothing about tenant isolation.

## Revision and environment

- **Pull request head.** [Pull request #2](https://github.com/pateldhruval872/liquorify/pull/2) at `0e86f0b4da242b3a9588ad2d34b6edd7edc09519` on `claude/project-thread-r9n2qu`, base `main` at `225aa3ac293c2bd242a8239a3784c5ebc8f142a0`.
- **What the jobs tested.** A pull request run checks out GitHub's merge of the head into the base. Every job log shows that merge commit: `ab0d8a10dc9c08da31776f68e25bacd6569a754b`. Its application code is the same as at `394b53f`, the revision assessed in [LIQ-003](../LIQ-003-engineering-baseline.md).
- **Workflow definitions.** The pull request's FB-02 versions: no pull request path filter, and a manual trigger.
- **Runners.** GitHub-hosted `ubuntu-latest` (Ubuntu 24.04, image 20261012.334.1), Ruby 4.0.7, Rails `~> 8.1.0`, Node 22. The Ruby test jobs use a PostgreSQL 16 or MySQL 8.0 service container, chosen by `DB=postgres` or `DB=mysql`.
- **Trigger.** The push of `0e86f0b` at 01:57 UTC on 2026-10-21. Event `pull_request`, first attempt for both runs.
- **Where it was read.** The GitHub API, through this session's GitHub tools, from 02:11 to 02:30 UTC: run and job conclusions, the check runs on the head commit, and the summary lines in each job's log.

## Runs

| Workflow | Run | Started (UTC) | Finished (UTC) | Conclusion |
|---|---|---|---|---|
| Tests | [39530237950](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950) | 01:57:05 | 02:10:18 | success |
| Packages | [39530237976](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976) | 01:57:05 | 02:07:55 | success |

## Results

Counts are the totals each job's log prints. Pending examples are ones Spree's specs mark as pending; they count as neither passed nor failed.

### Tests workflow: proposed required checks

| Check | Result | What ran |
|---|---|---|
| [`Build (PostgreSQL)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994205785) | PASS | Gem install and cache for the test jobs |
| [`PostgreSQL - core (1/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887585) | PASS | 3,625 examples, 0 failures, 10 pending |
| [`PostgreSQL - core (2/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887700) | PASS | 3,566 examples, 0 failures, 9 pending |
| [`PostgreSQL - core (3/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887506) | PASS | 3,641 examples, 0 failures, 11 pending |
| [`PostgreSQL - api (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887632) | PASS | 5,765 examples, 0 failures, 1 pending |
| [`PostgreSQL - emails (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887545) | PASS | 194 examples, 0 failures |
| [`PostgreSQL - providers (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887522) | PASS | 517 examples, 0 failures: EasyPost 93, Meilisearch 127, Stripe 297 |
| [`PostgreSQL - dashboard (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887613) | PASS | 14 examples, 0 failures |
| [`PostgreSQL - mcp (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887637) | PASS | 56 examples, 0 failures |
| [`PostgreSQL - opentelemetry (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887663) | PASS | 26 examples, 0 failures |
| [`Brakeman`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994887340) | PASS | No security warnings in `spree/core` or `spree/api`. Each has one warning ignored by its `brakeman.ignore` file |

PostgreSQL total: 17,404 examples, 0 failures, 31 pending.

### Tests workflow: advisory MySQL checks

They stay advisory until Liquorify decides whether it supports MySQL ([LIQ-001](../LIQ-001-project-profile.md#63-conflicts-and-exceptions) X12).

| Check | Result | What ran |
|---|---|---|
| [`Build (MySQL)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994205589) | PASS | Gem install and cache for the test jobs |
| [`MySQL - core (1/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743752) | PASS | 3,624 examples, 0 failures, 10 pending |
| [`MySQL - core (2/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743756) | PASS | 3,566 examples, 0 failures, 9 pending |
| [`MySQL - core (3/3)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743700) | PASS | 3,640 examples, 0 failures, 12 pending |
| [`MySQL - api (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743669) | PASS | 5,765 examples, 0 failures, 1 pending |
| [`MySQL - emails (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743699) | PASS | 194 examples, 0 failures |
| [`MySQL - providers (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743670) | PASS | 488 examples, 0 failures: EasyPost 93, Meilisearch 98, Stripe 297 |
| [`MySQL - dashboard (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743655) | PASS | 14 examples, 0 failures |
| [`MySQL - mcp (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743785) | PASS | 56 examples, 0 failures |
| [`MySQL - opentelemetry (1/1)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237950/job/118994743765) | PASS | 26 examples, 0 failures |

MySQL total: 17,373 examples, 0 failures, 32 pending. The MySQL job has no Meilisearch service container, which probably explains its 29 fewer Meilisearch examples; this was not checked.

### Packages workflow

| Check | Result | What ran |
|---|---|---|
| [`Typecheck, Test & Build`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206144) | PASS | Zod schema, SDK filter type, request type and code list drift checks; then 47 Turbo lint, type check, test and build tasks, none from cache, including 1,374 Vitest tests in 8 packages |
| [`Scaffolded app - Typecheck & Lint`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206058) | PASS | A project created from the packed packages; its Dashboard and Seller Panel checked, then checked again on TypeScript 6 |
| [`SDK Integration Tests`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994205844) | PASS | 22 tests in 5 files against a test Rails app |
| [`Dashboard - E2E (1/4)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206017) | PASS | 113 Playwright tests passed, then 5 first-run setup tests passed |
| [`Dashboard - E2E (2/4)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206218) | PASS | 111 passed, 1 skipped |
| [`Dashboard - E2E (3/4)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206039) | PASS | 98 passed |
| [`Dashboard - E2E (4/4)`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118994206002) | PASS | 107 passed |
| [`Dashboard - E2E`](https://github.com/pateldhruval872/liquorify/actions/runs/39530237976/job/118997495413) | PASS | Checks that all four shards passed. This is the proposed required check for the end-to-end tests |
| `SDK - Release`, `Admin SDK - Release`, `CLI - Release`, `Dashboard packages - Release`, `Seller packages - Release`, `create-spree-app - Release` | Skipped | Release jobs never run on a pull request, with or without the FB-02 guard |

Dashboard end-to-end total: 434 passed, 1 skipped. In CI, Playwright retries a failed test up to twice; the logs report no flaky tests, so none needed a retry.

### Check names that reported

The head commit has 35 check runs, all from these two runs: 29 successful and 6 skipped. Every name in the proposed required list in [LIQ-004](../LIQ-004-foundation-backlog.md#recommended-next-work-item) reported exactly as written there, so the list can now be selected in the repository's settings. No other workflow ran: `docs-package.yml` is still path-filtered, and `release.yml` and `security-audit.yml` do not run on pull requests.

## Failures

No job failed. One step failed inside passing jobs:

| Where | What happened | Effect | Owner and follow-up |
|---|---|---|---|
| `Upload coverage to Codecov`, in seven of the nine PostgreSQL test jobs | Codecov refused each upload: "Token required - not valid tokenless upload". The run has no `CODECOV_TOKEN` secret (the log shows a token length of 0). The `mcp` and `opentelemetry` jobs found no coverage files to send | The step is set not to fail its job (`fail_ci_if_error: false`), so the jobs passed. No coverage was recorded | Project owner. Decide in a later CI change whether to add the secret, which sends coverage reports to Codecov, or remove the step ([LIQ-005](../LIQ-005-spree-engineering-adoption.md) SA-44). Not part of FB-02 |

## Limitations

- **Spree's suites only.** A green upstream suite shows that Spree's own tests pass at this revision. It is not evidence of tenant isolation. ISO-1 to ISO-7 stay open, and the shopper isolation reproduction (C3 in LIQ-003) still fails.
- **One run, on a pull request.** These checks are Verified at `ab0d8a1`, not Operating. `main` keeps its old path filters until FB-02 merges, nothing requires the checks yet, and every later revision needs its own run.
- **The filter change is not shown yet.** This pull request changes both workflow files, so the old filters would also have started both workflows. That a documentation-only pull request now runs them shows on the first such pull request after merge.
- **Publishing guards are still verified by reading.** The release jobs skip on every pull request, guard or not. The guarded skip on the merge push, and the `release.yml` and `docs-package.yml` guards, are still to be shown (acceptance criterion 3).
- **Manual trigger not exercised.** GitHub offers it only once the default branch declares it, after merge.
- **Database by configuration.** The logs show `DB=postgres` or `DB=mysql`, and the test app's database template reads that value; the logs do not print the database adapter itself.
- **Pending and skipped tests** (31 pending on PostgreSQL, 32 on MySQL, 1 skipped dashboard test) were not examined.
- **Read, not rerun.** The counts come from the jobs' log summaries, read through the GitHub API; nothing was rerun locally. GitHub deletes logs after the repository's retention period (90 days by default), so this record keeps the counts.
- **This record's own commit** starts both workflows again. Its results are reported on the pull request and are not part of this record.

## Next

1. The owner reviews pull request #2. At the final approval step, the owner merges it and applies the branch protection settings with the check names above (OA-3).
2. After the merge, a new record shows the six `packages.yml` release jobs skipped on the merge push, and branch protection refusing a direct push in each repository (acceptance criteria 3 and 4).
