---
document_id: LIQ-004
title: Foundation Backlog
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Foundation Backlog

These are the smallest engineering tasks needed for reproducible development, relevant checks and reliable verification, in priority order. Each one traces to findings in [LIQ-003](LIQ-003-engineering-baseline.md). Implementing all 172 capabilities is not a prerequisite for anything here; most stay "not assessed" until real work activates them.

This list is a planning record. Once decision D6 picks a tracker, each item becomes a work item there and this file links to it instead of describing it ([ENG-002 §2](framework/ENG-002-documentation-system.md#2-what-belongs-where)). Nothing here is authorized for implementation until the owner says so.

## Open isolation findings

Reproduced on 2026-10-20 at backend `394b53f` with real requests and nothing stubbed (LIQ-003, evidence C3). They stay open until the option A validation (FB-03) and the fixes that follow it pass on PostgreSQL with same-store controls.

| # | Finding | Status |
|---|---|---|
| ISO-1 | A store's admin sees shoppers of other stores in the customer list | Open |
| ISO-2 | A store's admin can open another store's shopper record | Open |
| ISO-3 | A store's admin can change another store's shopper record | Open |
| ISO-4 | A shopper of one store can sign in at another store | Open |
| ISO-5 | Registering at one store fails if the email has an account at another store, which also reveals that the account exists | Open |
| ISO-6 | One store's tax rate marks another store's tax setup task as done | Open |
| ISO-7 | Customer order totals appear to be summed across stores | Seen in code, not tested |

What this evidence does not show yet: same-store controls, a before-and-after check on the tax task, any PostgreSQL run, and the wider surfaces listed in the merchant lifecycle specification. The reproduction itself stays out of this public repository while the defect is open.

## Backlog

Risk classes follow [LIQ-001 §4](LIQ-001-project-profile.md#4-review-and-verification-expectations) and depend on effects, including for documentation. "Repo" is B for `liquorify` and S for `liquorify-storefront`. Each item is gated by its own actual dependencies; unrelated decisions do not block bounded work.

### P0: foundation priorities

| # | Task | Repo | Risk | Done when | Depends on |
|---|---|---|---|---|---|
| FB-01 | Record the adoption decisions D1 to D8, resolving only those needed by the next work item | — | Protected where authority or control policy changes | Each decision is recorded in LIQ-001 with its date, and the documents' status fields match | Owner |
| FB-02 | **Run the backend's existing checks on `liquorify` and protect `main` in both repositories** (recommended next, below) | B, S | Protected | See below | CI authorization; OA-2 |
| FB-03 | Validate option A: same-store controls, the tax task before-and-after control, PostgreSQL and SQLite runs, the wider surfaces chosen, and the shopper-ownership analysis, as defined at the end of the merchant lifecycle specification | B | Protected | A validation report with results per surface and database, accepted or rejected by the owner | Decisions N1 to N6 in the specification |
| FB-04 | Verify one development path from a clean checkout to a local test order through the Liquorify storefront: choose Docker or native, settle Ruby and Node versions, list destructive commands, make a payment method visible, confirm the Mac's `liquor` remotes are the renamed repositories | B, S | Standard | A short setup guide (migration step M4) whose steps were run once, with the evidence recorded | FB-01 |
| FB-05 | Point the setup scripts at the Liquorify repositories (they clone upstream `spree/storefront` and `spree/spree-starter`) and decide where the tracked host application and its Ruby lockfile live | B | Standard | A fresh setup uses `liquorify-storefront`; the host application and lockfile are tracked or their home is decided | Hosting direction |

### P1: soon after

| # | Task | Repo | Risk | Done when | Depends on |
|---|---|---|---|---|---|
| FB-06 | Check the storefront against the Liquorify backend, not the upstream Spree image, and align the SDK version (storefront pins rc.3, backend ships rc.4). The end-to-end job first needs Stripe sandbox test keys: without them it stops before any test. Adding configuration enables a rerun; its test outcome is not yet known | S, B | Standard | Storefront end-to-end tests run against a backend built from a recorded `liquorify` revision | FB-02; the owner adds the test keys (OA-1) |
| FB-07 | Publish a Liquorify security policy for the public repository | B | Protected: it decides where vulnerability reports go | `SECURITY.md` names a Liquorify contact and the supported revision; upstream reporting text removed | Contact decided |
| FB-08 | Align agent configuration with the delegation in LIQ-001 §3: review the tracked `.claude/settings.local.json`, and the upstream plan commands that open Linear issues and `spree/spree` issues and pull requests (LIQ-005 SA-34, SA-35) | B | Protected | Agent settings and commands match the accepted delegation | D3 |
| FB-09 | Decide whether Liquorify environments send Spree's update check and usage data (on by default; it includes the store's address) | B | Standard | The setting is decided and documented for each environment | Owner |
| FB-10 | Set up work tracking and move this backlog into it | B, S | Standard | Each P0 and P1 item is a tracked work item, linked from here | D6 |
| FB-11 | Triage dependencies: 10 open storefront Dependabot pull requests (the `jsdom` 30 one fails CI); backend Dependabot and the weekly audit have not run | S, B | Standard | Each open update is merged, closed or deferred with a reason; an owner and cadence are recorded; whether the storefront takes the backend's pnpm release-age and trust settings is decided (LIQ-005 SA-27) | FB-02 |
| FB-12 | Plan how upstream Spree changes are taken in, from 6.0.0.rc4 to the final 6.0 release, and record the base revision | B, S | Standard | A short decision record in `liquorify/` | D4 |

### P2: when the work activates them

| # | Task | Activated by |
|---|---|---|
| FB-13 | Move the merchant lifecycle specification into `liquorify/` (migration step M3) | D4, D7, D8 |
| FB-14 | Decide the branding approach across `@spree/dashboard-ui` and the storefront's own components | First Liquorify screen |
| FB-15 | Set an accessibility target and add automated accessibility checks | First Liquorify screen |
| FB-16 | Hosting, staging environment, secrets storage, backups, monitoring and runbooks | Hosting decision; required before any real merchant data |
| FB-17 | Link, metadata and capability-ID checks for `liquorify/` only | Documentation drift actually appears |

## Owner actions

These change repository settings or credentials, so they stay with the owner and outside the engineering items.

| # | Action | Unblocks | Note |
|---|---|---|---|
| OA-1 | Add a Stripe sandbox test key pair to `liquorify-storefront`: a `STRIPE_SECRET_KEY` repository secret and a `STRIPE_PUBLISHABLE_KEY` repository variable | The storefront end-to-end job's configuration check (FB-06) | Adding the keys removes only this blocker. The next run determines whether the browser tests pass |
| OA-2 | Confirm GitHub Actions is turned on for `liquorify` (Settings, then Actions) | Every backend workflow, including FB-02 | The Actions API lists no registered workflows although five workflow files are on `main` |

## Recommended next work item

**FB-02: run the backend's existing checks on `liquorify` and protect `main` in both repositories.**

Why this one: the backend has a large test suite, but it has never run on this repository, and nothing stops an unverified change from reaching `main` in either repository. Every later result, including the option A validation, is only as reliable as the checks behind it. It changes no application code. FB-03 can proceed in parallel in the cloud once its own decisions are made.

- **Outcome.** The backend's existing workflows have one recorded run at a known revision, upstream publishing jobs cannot run here, and both `main` branches accept changes only through pull requests with required checks.
- **In scope.** The workflow changes in the table below; one run of `tests.yml` and `packages.yml` on the FB-02 pull request; branch protection in both repositories once those checks have reported.
- **Out of scope.** Fixing failing upstream tests, changing dependencies, adding Liquorify tests, adding credentials, any deployment.

| Repository | Workflow file | Change in FB-02 | Proposed required checks |
|---|---|---|---|
| `liquorify` | `.github/workflows/tests.yml` | Add a manual trigger; settle the pull request path filter (below) | `Build (PostgreSQL)`, `PostgreSQL - core (1/3)`, `PostgreSQL - core (2/3)`, `PostgreSQL - core (3/3)`, `PostgreSQL - api (1/1)`, `PostgreSQL - emails (1/1)`, `PostgreSQL - providers (1/1)`, `PostgreSQL - dashboard (1/1)`, `PostgreSQL - mcp (1/1)`, `PostgreSQL - opentelemetry (1/1)`, `Brakeman`. Advisory until Liquorify decides on MySQL: `Build (MySQL)` and the nine `MySQL - …` jobs |
| `liquorify` | `.github/workflows/packages.yml` | Add a manual trigger; limit its six `… - Release` jobs to the upstream repository; settle the path filter | `Typecheck, Test & Build`, `Scaffolded app - Typecheck & Lint`, `SDK Integration Tests`, `Dashboard - E2E` (the job that summarizes the four `Dashboard - E2E (n/4)` shards) |
| `liquorify` | `.github/workflows/release.yml` | Limit `Release gems to RubyGems` to the upstream repository | None |
| `liquorify` | `.github/workflows/docs-package.yml` | Limit its `Release` job to the upstream repository | None |
| `liquorify` | `.github/workflows/security-audit.yml` | None; it already has a manual trigger | None: it runs on a schedule, not on pull requests |
| `liquorify-storefront` | `.github/workflows/ci.yml` | None | `Lint`, `Type Check`, `Unit Tests`. `E2E (Playwright + Spree)` stays advisory until OA-1 is done and a run passes |

`Build (PostgreSQL)` is required as well as the test jobs because a job skipped after its build fails reports as skipped, and GitHub accepts a skipped check as satisfying a required check.

**What stands in the way of running these checks from a pull request branch:**

1. **Actions may be off** (OA-2). Until it is on, no workflow runs on any branch.
2. **Path filters.** `tests.yml` runs on a pull request only when it changes `spree/**` or the workflow file, and `packages.yml` only for its listed paths. The FB-02 pull request edits both files, so both run on its branch. A documentation-only pull request, such as the one that added this folder, runs neither.
3. **Required checks and path filters conflict.** A required check from a path-filtered workflow never reports on a pull request outside those paths, so that pull request waits indefinitely. FB-02 must either drop the pull request path filters from both workflows (simplest; runner minutes are free while the repository is public) or add one always-running summary job per workflow and require only those. This is the owner's choice.
4. **The manual trigger works only after merge.** GitHub offers a manual trigger only for a workflow whose file on the default branch declares it, so until FB-02 merges, the pull request run is the evidence.
5. **Checks must report before they can be required.** GitHub's settings offer a check for selection once it has reported in the repository, and names must match exactly; a matrix change renames its checks.
6. **Release guards must ship in the same change.** Merging FB-02 is a push to `main` that changes `packages.yml`, which would start its release jobs. Release jobs never run on a pull request branch, so their guards are verified by reading the files and, after merge, by the jobs' skipped results.
7. **Storefront branch protection** may need a paid GitHub plan, because the repository is private.

One consequence of requiring checks, rather than a blocker to running them: the weekly dependency audit opens its pull requests with the default token, which does not start CI, so once checks are required those pull requests wait until CI is started another way ([LIQ-005](LIQ-005-spree-engineering-adoption.md) SA-28).

- **Acceptance criteria.**
  1. `tests.yml` and `packages.yml` each have a run on a recorded `liquorify` revision. A verification record in `liquorify/` lists each job as PASS, FAIL, BLOCKED or NOT_RUN, with a link to the run.
  2. Every failing job is recorded as FAIL with an owner and a follow-up item. Nothing is skipped or marked as expected to fail.
  3. Every publishing job carries a condition that limits it to the upstream repository, confirmed by reading the workflow files, and shows as skipped on the first push to `main` after merge.
  4. `main` in both repositories refuses direct pushes and requires the agreed checks before merge, shown on one pull request in each.
  5. No application code, dependency, credential or database changes.
- **Risk.** Protected: it changes CI configuration and repository settings. Its verification is the workflow runs and the branch protection demonstration above, not application or isolation tests.
- **Decisions needed.**
  - The owner authorizes the CI file edits and the branch protection settings, and completes OA-2.
  - The owner chooses the required checks (proposal above) and how to resolve the path filters (point 3).
  - Decision D7 (backend visibility) does not block this item. The suite is free to run only while the repository is public.
- **Limitations.** A green upstream suite shows only that Spree's own tests pass. It says nothing about tenant isolation, which stays open under ISO-1 to ISO-7. If the storefront's plan does not include branch protection, that is recorded as a limitation rather than worked around.
