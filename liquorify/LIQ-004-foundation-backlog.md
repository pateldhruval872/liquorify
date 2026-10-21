---
document_id: LIQ-004
title: Foundation Backlog
version: 0.1-draft
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

Risk classes follow [LIQ-001 §4](LIQ-001-project-profile.md#4-review-and-verification-expectations). "Repo" is B for `liquorify` and S for `liquorify-storefront`.

### P0: before any application change

| # | Task | Repo | Risk | Done when | Depends on |
|---|---|---|---|---|---|
| FB-01 | Record the adoption decisions D1 to D8 | — | Low | Each decision is recorded in LIQ-001 with its date, and the documents' status fields match | Owner |
| FB-02 | **Run the backend's existing checks on `liquorify` and protect `main` in both repositories** (recommended next, below) | B, S | Protected | See below | CI authorization |
| FB-03 | Validate option A: same-store controls, the tax task before-and-after control, PostgreSQL and SQLite runs, the wider surfaces chosen, and the shopper-ownership analysis, as defined at the end of the merchant lifecycle specification | B | Protected | A validation report with results per surface and database, accepted or rejected by the owner | Decisions N1 to N6 in the specification |
| FB-04 | Verify one development path from a clean checkout to a local test order through the Liquorify storefront: choose Docker or native, settle Ruby and Node versions, list destructive commands, make a payment method visible, confirm the Mac's `liquor` remotes are the renamed repositories | B, S | Standard | A short setup guide (migration step M4) whose steps were run once, with the evidence recorded | FB-01 |
| FB-05 | Point the setup scripts at the Liquorify repositories (they clone upstream `spree/storefront` and `spree/spree-starter`) and decide where the tracked host application and its Ruby lockfile live | B | Standard | A fresh setup uses `liquorify-storefront`; the host application and lockfile are tracked or their home is decided | Hosting direction |

### P1: soon after

| # | Task | Repo | Risk | Done when | Depends on |
|---|---|---|---|---|---|
| FB-06 | Check the storefront against the Liquorify backend, not the upstream Spree image, and align the SDK version (storefront pins rc.3, backend ships rc.4) | S, B | Standard | Storefront end-to-end tests run against a backend built from a recorded `liquorify` revision | FB-02 |
| FB-07 | Publish a Liquorify security policy for the public repository | B | Low | `SECURITY.md` names a Liquorify contact and the supported revision; upstream reporting text removed | Contact decided |
| FB-08 | Align agent configuration with the delegation in LIQ-001 §3: review the tracked `.claude/settings.local.json`, and the upstream commands that open pull requests on `spree/spree` | B | Protected | Agent settings and commands match the accepted delegation | D3 |
| FB-09 | Decide whether Liquorify environments send Spree's update check and usage data (on by default; it includes the store's address) | B | Standard | The setting is decided and documented for each environment | Owner |
| FB-10 | Set up work tracking and move this backlog into it | B, S | Low | Each P0 and P1 item is a tracked work item, linked from here | D6 |
| FB-11 | Triage dependencies: 10 open storefront Dependabot pull requests (the `jsdom` 30 one fails CI); backend Dependabot and the weekly audit have not run | S, B | Standard | Each open update is merged, closed or deferred with a reason; an owner and cadence are recorded | FB-02 |
| FB-12 | Plan how upstream Spree changes are taken in, from 6.0.0.rc4 to the final 6.0 release, and record the base revision | B, S | Standard | A short decision record in `liquorify/` | D4 |

### P2: when the work activates them

| # | Task | Activated by |
|---|---|---|
| FB-13 | Move the merchant lifecycle specification into `liquorify/` (migration step M3) | D4, D7, D8 |
| FB-14 | Decide the branding approach across `@spree/dashboard-ui` and the storefront's own components | First Liquorify screen |
| FB-15 | Set an accessibility target and add automated accessibility checks | First Liquorify screen |
| FB-16 | Hosting, staging environment, secrets storage, backups, monitoring and runbooks | Hosting decision; required before any real merchant data |
| FB-17 | Link, metadata and capability-ID checks for `liquorify/` only | Documentation drift actually appears |

## Recommended next work item

**FB-02: run the backend's existing checks on `liquorify` and protect `main` in both repositories.**

Why this one: the backend has a large test suite, but it has never run on this repository, and nothing stops an unverified change from reaching `main` in either repository. Every later result, including the option A validation, is only as reliable as the checks behind it. It changes no application code. FB-03 can proceed in parallel in the cloud once its own decisions are made.

- **Outcome.** The backend's existing workflows have one recorded run at a known revision, upstream publishing jobs cannot run here, and both `main` branches accept changes only through pull requests with required checks.
- **In scope.** Confirm GitHub Actions is enabled on `liquorify`. Add a manual trigger to `tests.yml` and `packages.yml`. Restrict `release.yml` and the release job in `docs-package.yml` to the upstream repository. Run both workflows on `main`. Turn on branch protection in both repositories.
- **Out of scope.** Fixing failing upstream tests, changing dependencies, adding Liquorify tests, any deployment.
- **Acceptance criteria.**
  1. `tests.yml` (PostgreSQL, MySQL, Brakeman) and `packages.yml` each have a run on a recorded `liquorify` revision. A verification record in `liquorify/` lists each job as PASS, FAIL, BLOCKED or NOT_RUN, with a link to the run.
  2. Every failing job is recorded as FAIL with an owner and a follow-up item. Nothing is skipped or marked as expected to fail.
  3. The publishing jobs carry a condition that limits them to the upstream repository, confirmed by reading the workflow files.
  4. `main` in both repositories rejects direct pushes and requires the agreed checks before merge, shown on one pull request in each.
  5. No application code, dependency or database changes.
- **Risk.** Protected: it changes CI configuration and repository settings.
- **Decisions needed.**
  - The owner authorizes the CI file edits and the branch protection settings.
  - The owner chooses which checks are required. Proposal: storefront Lint, Type Check and Unit Tests; backend Packages and the PostgreSQL test jobs, with MySQL advisory until Liquorify decides whether it supports MySQL.
  - Decision D7 (backend visibility) does not block this item. Note that the suite is free to run only while the repository is public.
- **Limitations.** A green upstream suite shows only that Spree's own tests pass. It says nothing about tenant isolation, which stays open under ISO-1 to ISO-7. GitHub offers branch protection on private repositories only on paid plans; if the storefront's plan does not include it, that is recorded as a limitation rather than worked around.
