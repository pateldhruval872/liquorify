---
title: FB-02 pull request checks
record: verification
work_item: FB-02
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: BLOCKED
---

# FB-02 pull request checks

**Claim.** FB-02 acceptance criterion 1: `tests.yml` and `packages.yml` each run on a recorded `liquorify` revision, with a result for every job ([LIQ-004](../LIQ-004-foundation-backlog.md#recommended-next-work-item)). Criterion 3, the publishing guards, is checked by reading.

**Result: BLOCKED.** Neither workflow started on the pull request. GitHub reports no registered workflows and no runs for the repository, so GitHub Actions is most likely turned off for it (owner action OA-2). No backend job has a result, and none is counted as passing.

## Revision and environment

- **Candidate.** [Pull request #2](https://github.com/pateldhruval872/liquorify/pull/2), head `32db00074be508f0a02d7f5662138fb7bcc12742` on `claude/project-thread-r9n2qu`, base `main` at `225aa3ac293c2bd242a8239a3784c5ebc8f142a0`.
- **Application code** at this head is the same as at `394b53f`, the revision assessed in [LIQ-003](../LIQ-003-engineering-baseline.md). Since then only `liquorify/`, the Liquorify sections of `CLAUDE.md` and `README.md`, and the four workflow files have changed.
- **Workflow definitions.** A pull request run uses the workflow files from the pull request, so these are the FB-02 versions: no pull request path filter, and a manual trigger.
- **Where it was checked.** The GitHub API, through this session's GitHub tools, from 01:39 to 01:47 UTC. Static checks ran in a cloud container.

## Procedure

1. Pushed the head commit and opened the pull request at 01:39:22 UTC. Both workflows trigger on every pull request at this revision. They would have triggered under the old filters too, because the pull request changes both workflow files.
2. Read the pull request's check runs and commit statuses, the repository's workflow runs, and its registered workflows.
3. Ran `actionlint` 1.7.7 on the four changed workflow files, without its shellcheck and pyflakes integrations, and parsed every workflow file as YAML.
4. Read every job condition in the five workflow files.

## Results

| Check | Result | Evidence |
|---|---|---|
| Workflow syntax and expressions (`actionlint`) | PASS | No findings on `tests.yml`, `packages.yml`, `release.yml`, `docs-package.yml` |
| Triggers as intended | PASS | `tests.yml` and `packages.yml`: `pull_request` with no filter, `workflow_dispatch`, push filters unchanged |
| Publishing guards, by reading | PASS (reading only) | `Release gems to RubyGems`, `SDK - Release`, `Admin SDK - Release`, `CLI - Release`, `Dashboard packages - Release`, `Seller packages - Release`, `create-spree-app - Release` and the docs package `Release` each require `github.repository == 'spree/spree'`. `security-audit.yml` publishes nothing and is unchanged |
| Tests workflow: `Build (PostgreSQL)`, `PostgreSQL - core (1/3)`, `PostgreSQL - core (2/3)`, `PostgreSQL - core (3/3)`, `PostgreSQL - api (1/1)`, `PostgreSQL - emails (1/1)`, `PostgreSQL - providers (1/1)`, `PostgreSQL - dashboard (1/1)`, `PostgreSQL - mcp (1/1)`, `PostgreSQL - opentelemetry (1/1)`, `Brakeman` | BLOCKED | No check run on the head commit |
| Tests workflow, advisory: `Build (MySQL)` and the nine `MySQL - …` jobs with the same names as above | BLOCKED | No check run on the head commit |
| Packages workflow: `Typecheck, Test & Build`, `Scaffolded app - Typecheck & Lint`, `SDK Integration Tests`, `Dashboard - E2E (1/4)` to `(4/4)`, `Dashboard - E2E` | BLOCKED | No check run on the head commit |
| Packages workflow release jobs | NOT_RUN | They never run on a pull request |

What GitHub returned:

- Check runs on the head commit: 0. Combined commit status: pending, with no statuses.
- Workflow runs in the repository: 0, ever.
- Registered workflows: 0. Looking up `tests.yml` by file name returns 404 Not Found, although the file is on `main`.
- For comparison, `liquorify-storefront` registers its workflows and ran CI on its own merge at 01:25 UTC the same day.

**Cause, not confirmed.** Actions is off for the repository, or an account policy blocks it. This session's tools cannot read the repository's Actions setting.

## Failures

None observed, because nothing ran.

## Storefront checks used for the protection proposal

Run [39527209865](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39527209865), the push to `main` at `ac53c5b6a0f80943edf0137343b3a0c35f523a2f`, 2026-10-21 01:25 UTC:

| Check | Result |
|---|---|
| `Lint` | PASS |
| `Type Check` | PASS |
| `Unit Tests` | PASS |
| `E2E (Playwright + Spree)` | FAIL at its step "Fail if Stripe keys are not configured". The browser tests did not run (NOT_RUN) |

The pull request run before it ([39520058404](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39520058404), head `e9e8918`) reported the same four results.

## Limitations

- A BLOCKED result says nothing about whether the backend suites pass. Backend Ruby CI stays unverified (LIQ-001 X9).
- The publishing guards are verified only by reading. After merge, with Actions on, the merge push changes `packages.yml`, so its six release jobs should show as skipped. `release.yml` runs only on `v*` tags and `docs-package.yml` only on documentation changes, so their guards stay verified by reading until such an event happens.
- `actionlint` ran without shellcheck and pyflakes, so shell steps were not checked. No shell step was changed.
- Tenant isolation is not touched by this work. ISO-1 to ISO-7 stay open.
- The commit that adds this record changes only documentation. Whether its checks started is reported on the pull request.

## Next

1. **OA-2.** The owner turns Actions on for `liquorify`. Until FB-02 merges, the unguarded publishing jobs on `main` become live with it, so no `v*` tag is pushed and nothing else that touches the `packages.yml` paths is merged in that window. Turning Actions on also starts the weekly dependency audit (Mondays 06:00 UTC).
2. The next commit on the pull request then starts both workflows. That run gets its own record; this one stays as written.
