---
document_id: LIQ-004
title: Foundation Backlog
version: 0.3-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Foundation Backlog

These are the smallest engineering tasks needed for reproducible development, relevant checks and reliable verification, in priority order. Each one traces to findings in [LIQ-003](LIQ-003-engineering-baseline.md). Implementing all 172 capabilities is not a prerequisite for anything here; most stay "not assessed" until real work activates them.

This list is a planning record. Once decision D6 picks a tracker, each item becomes a work item there and this file links to it instead of describing it ([ENG-002 §2](framework/ENG-002-documentation-system.md#2-what-belongs-where)). Nothing here is authorized for implementation until the owner says so. FB-02 was authorized on 2026-10-21 ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)).

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
| FB-01 | Record the adoption decisions D1 to D8, resolving only those needed by the next work item. D1 and D4 were decided on 2026-10-21; D2, D3 and D5 to D8 are open | — | Protected where authority or control policy changes | Each decision is recorded in LIQ-001 with its date, and the documents' status fields match | Owner |
| FB-02 | **Run the backend's existing checks on `liquorify` and protect `main` in both repositories** (recommended next, below) | B, S | Protected | See below | CI authorization (given 2026-10-21); OA-2 and OA-3 (done 2026-10-21) |
| FB-03 | Validate option A: same-store controls, the tax task before-and-after control, PostgreSQL and SQLite runs, the wider surfaces chosen, and the shopper-ownership analysis, as defined at the end of the merchant lifecycle specification | B | Protected | A validation report with results per surface and database, accepted or rejected by the owner | Decisions N1 to N6 in the specification |
| FB-04 | Verify one development path from a clean checkout to a local test order through the Liquorify storefront: choose Docker or native, settle Ruby and Node versions, list destructive commands, make a payment method visible, confirm the Mac's `liquor` remotes are the renamed repositories | B, S | Standard | A short setup guide (migration step M4) whose steps were run once, with the evidence recorded | FB-01 |
| FB-05 | Point the setup scripts at the Liquorify repositories (they clone upstream `spree/storefront` and `spree/spree-starter`) and decide where the tracked host application and its Ruby lockfile live | B | Standard | A fresh setup uses `liquorify-storefront`; the host application and lockfile are tracked or their home is decided | Hosting direction |
| FB-18 | **Prepare the Spree product capability baseline and the Design System Adoption and Extension decision record** (the next documentation item, below; tracked, not started) | B | Standard. The decision record stays PROPOSED until the owner decides, and any CI, account or service change it leads to is Protected | Both documents are in `liquorify/` and reviewed by the owner | The owner's instruction to start |

### P1: soon after

| # | Task | Repo | Risk | Done when | Depends on |
|---|---|---|---|---|---|
| FB-06 | Check the storefront against the Liquorify backend, not the upstream Spree image, and align the SDK version (storefront pins rc.3, backend ships rc.4). The end-to-end job first needs Stripe sandbox test keys: without them it stops before any test. Adding configuration enables a rerun; its test outcome is not yet known | S, B | Standard | Storefront end-to-end tests run against a backend built from a recorded `liquorify` revision | FB-02; the owner adds the test keys (OA-1) |
| FB-07 | Publish a Liquorify security policy for the public repository | B | Protected: it decides where vulnerability reports go | `SECURITY.md` names a Liquorify contact and the supported revision; upstream reporting text removed | Contact decided |
| FB-08 | Align agent configuration with the delegation in LIQ-001 §3: review the tracked `.claude/settings.local.json`, and the upstream plan commands that open Linear issues and `spree/spree` issues and pull requests (LIQ-005 SA-34, SA-35) | B | Protected | Agent settings and commands match the accepted delegation | D3 |
| FB-09 | Decide whether Liquorify environments send Spree's update check and usage data (on by default; it includes the store's address) | B | Standard | The setting is decided and documented for each environment | Owner |
| FB-10 | Set up work tracking and move this backlog into it | B, S | Standard | Each P0 and P1 item is a tracked work item, linked from here | D6 |
| FB-11 | Triage dependencies: 10 open storefront Dependabot pull requests (the `jsdom` 30 one fails CI; with branches required to be up to date, each must be updated before it can merge); backend Dependabot and the weekly audit have not run | S, B | Standard | Each open update is merged, closed or deferred with a reason; an owner and cadence are recorded; whether the storefront takes the backend's pnpm release-age and trust settings is decided (LIQ-005 SA-27) | FB-02 |
| FB-12 | Plan how upstream Spree changes are taken in, from 6.0.0.rc4 to the final 6.0 release, and record the base revision | B, S | Standard | A short decision record in `liquorify/` | — |

### P2: when the work activates them

| # | Task | Activated by |
|---|---|---|
| FB-13 | Move the merchant lifecycle specification into `liquorify/` (migration step M3) | D7, D8 |
| FB-14 | Decide the branding approach across `@spree/dashboard-ui` and the storefront's own components | First Liquorify screen |
| FB-15 | Set an accessibility target and add automated accessibility checks | First Liquorify screen |
| FB-16 | Hosting, staging environment, secrets storage, backups, monitoring and runbooks | Hosting decision; required before any real merchant data |
| FB-17 | Link, metadata and capability-ID checks for `liquorify/` only | Documentation drift actually appears |

## Owner actions

These change repository settings or credentials, so they stay with the owner and outside the engineering items.

| # | Action | Unblocks | Note |
|---|---|---|---|
| OA-1 | Add a Stripe sandbox test key pair to `liquorify-storefront`: a `STRIPE_SECRET_KEY` repository secret and a `STRIPE_PUBLISHABLE_KEY` repository variable | The storefront end-to-end job's configuration check (FB-06) | Adding the keys removes only this blocker. The next run determines whether the browser tests pass |
| OA-2 | Turn GitHub Actions on for `liquorify` (Settings, then Actions) | Every backend workflow, including the FB-02 checks | **Done 2026-10-21.** Both workflows then ran on the FB-02 pull request ([record](verification/2026-10-21-fb-02-first-workflow-run.md)). FB-02 has since merged, so the publishing jobs on `main` run only upstream. The weekly dependency audit is now live too; its first scheduled run is Monday 2026-10-26 |
| OA-3 | Apply the proposed branch protection settings in both repositories, after the backend checks have reported once | FB-02 acceptance criterion 4 | **Done 2026-10-21.** The owner saved a "Protect main" ruleset in each repository; both match the proposal ([record](verification/2026-10-21-fb-02-merge-push-and-protection.md)). The storefront turned out to be public, which GitHub Free enforces, and the owner chose to keep it public |

## Recommended next work item

**FB-02: run the backend's existing checks on `liquorify` and protect `main` in both repositories.**

**Status (2026-10-21).** In progress; the open parts need the owner. [Pull request #2](https://github.com/pateldhruval872/liquorify/pull/2) merged at 02:36 UTC. The first check attempt was BLOCKED because Actions was off ([record](verification/2026-10-21-fb-02-pull-request-checks.md)). Once the owner turned it on (OA-2), all 29 pull request jobs passed at `0e86f0b`; Codecov refused the coverage uploads, which does not fail a job ([record](verification/2026-10-21-fb-02-first-workflow-run.md)). Both workflows passed again on the merge push, and the owner saved the branch rulesets in both repositories (OA-3; [record](verification/2026-10-21-fb-02-merge-push-and-protection.md)). Against the acceptance criteria below:

1. Met.
2. Nothing to record, since no job failed.
3. Met for `packages.yml`: its six release jobs skipped on the merge push. The `release.yml` and `docs-package.yml` guards are shown only by reading until their first trigger.
4. Met for required checks, by GitHub's reported merge state. The refusal of a direct push is unverified, because the owner asked that it not be tested by pushing to `main`.
5. Holds.

Whether FB-02 closes with those two parts open is the owner's call.

Why this one: the backend has a large test suite, but it had never run on this repository before FB-02, and nothing stopped an unverified change from reaching `main` in either repository. Every later result, including the option A validation, is only as reliable as the checks behind it. It changes no application code. FB-03 can proceed in parallel in the cloud once its own decisions are made.

- **Outcome.** The backend's existing workflows have one recorded run at a known revision, upstream publishing jobs cannot run here, and both `main` branches accept changes only through pull requests with required checks.
- **In scope.** The workflow changes in the table below; one run of `tests.yml` and `packages.yml` on the FB-02 pull request; branch protection in both repositories once those checks have reported.
- **Out of scope.** Fixing failing upstream tests, changing dependencies, adding Liquorify tests, adding credentials, any deployment.

| Repository | Workflow file | Change in FB-02 | Proposed required checks (source: GitHub Actions) |
|---|---|---|---|
| `liquorify` | `.github/workflows/tests.yml` | Add a manual trigger; drop the pull request path filter | Reported and passing at `0e86f0b` ([record](verification/2026-10-21-fb-02-first-workflow-run.md)): `Build (PostgreSQL)`, `PostgreSQL - core (1/3)`, `PostgreSQL - core (2/3)`, `PostgreSQL - core (3/3)`, `PostgreSQL - api (1/1)`, `PostgreSQL - emails (1/1)`, `PostgreSQL - providers (1/1)`, `PostgreSQL - dashboard (1/1)`, `PostgreSQL - mcp (1/1)`, `PostgreSQL - opentelemetry (1/1)`, `Brakeman`. Advisory until Liquorify decides on MySQL: `Build (MySQL)` and the nine `MySQL - …` jobs |
| `liquorify` | `.github/workflows/packages.yml` | Add a manual trigger; drop the pull request path filter; limit its six `… - Release` jobs to the upstream repository | Reported and passing at `0e86f0b`: `Typecheck, Test & Build`, `Scaffolded app - Typecheck & Lint`, `SDK Integration Tests`, `Dashboard - E2E` (the job that summarizes the four `Dashboard - E2E (n/4)` shards) |
| `liquorify` | `.github/workflows/release.yml` | Limit `Release gems to RubyGems` to the upstream repository | None |
| `liquorify` | `.github/workflows/docs-package.yml` | Limit its `Release` job to the upstream repository | None |
| `liquorify` | `.github/workflows/security-audit.yml` | None; it already has a manual trigger | None: it runs on a schedule, not on pull requests |
| `liquorify-storefront` | `.github/workflows/ci.yml` | None | `Lint`, `Type Check`, `Unit Tests`, all reported and passing on `main` at `ac53c5b`. `E2E (Playwright + Spree)` stays advisory until OA-1 is done and a run passes |

`Build (PostgreSQL)` is required as well as the test jobs because a job skipped after its build fails reports as skipped, and GitHub accepts a skipped check as satisfying a required check.

**What stands in the way of running these checks from a pull request branch:**

1. **Actions was off** (OA-2, done). No workflow started on the FB-02 pull request until the owner turned Actions on, on 2026-10-21. The next commit then started both workflows.
2. **Path filters.** On `main`, `tests.yml` runs on a pull request only when it changes `spree/**` or the workflow file, and `packages.yml` only for its listed paths, so a documentation-only pull request, such as the one that added this folder, runs neither. FB-02 drops both pull request filters, so both run on every pull request, including its own. The push filters stay.
3. **Required checks and path filters conflict.** A required check from a path-filtered workflow never reports on a pull request outside those paths, so that pull request waits indefinitely. The other option was one always-running summary job per workflow, with only those required. The owner chose to drop the filters for now (2026-10-21); runner minutes are free while the repository is public.
4. **The manual trigger works only after merge.** GitHub offers a manual trigger only for a workflow whose file on the default branch declares it, so until FB-02 merges, the pull request run is the evidence.
5. **Checks must report before they can be required.** GitHub's settings offer a check for selection once it has reported in the repository, and names must match exactly; a matrix change renames its checks.
6. **Release guards must ship in the same change.** Merging FB-02 is a push to `main` that changes `packages.yml`, which would start its release jobs. Release jobs never run on a pull request branch, so their guards are verified by reading the files and, after merge, by the jobs' skipped results.
7. **Storefront branch protection** looked as if it needed a paid GitHub plan, because the repository was private. It became public on 2026-10-21 and the owner kept it public, so GitHub Free enforces its rules ([record](verification/2026-10-21-fb-02-merge-push-and-protection.md#enforcement)).

One consequence of requiring checks, rather than a blocker to running them: the weekly dependency audit opens its pull requests with the default token, which does not start CI, so once checks are required those pull requests wait until CI is started another way ([LIQ-005](LIQ-005-spree-engineering-adoption.md) SA-28).

- **Acceptance criteria.**
  1. `tests.yml` and `packages.yml` each have a run on a recorded `liquorify` revision. A verification record in `liquorify/` lists each job as PASS, FAIL, BLOCKED or NOT_RUN, with a link to the run.
  2. Every failing job is recorded as FAIL with an owner and a follow-up item. Nothing is skipped or marked as expected to fail.
  3. Every publishing job carries a condition that limits it to the upstream repository, confirmed by reading the workflow files. The six `packages.yml` release jobs show as skipped on the merge push; the `release.yml` and `docs-package.yml` jobs show as skipped on the first tag or documentation change after it.
  4. `main` in both repositories refuses direct pushes and requires the agreed checks before merge, shown on one pull request in each.
  5. No application code, dependency, credential or database changes.
- **Risk.** Protected: it changes CI configuration and repository settings. Its verification is the workflow runs and the branch protection demonstration above, not application or isolation tests.
- **Decisions.**
  - Made on 2026-10-21: the CI file edits are authorized, the pull request path filters are dropped, and MySQL checks stay advisory until Liquorify decides whether it supports MySQL.
  - Made at the final approval step on 2026-10-21: the owner merged pull request #2 and saved the branch protection settings and required checks below.
  - Made on 2026-10-21: protection is not tested by pushing directly to `main`, and the storefront stays public.
  - Decision D7 (backend visibility) does not block this item. The suite is free to run only while the repository is public.
- **Limitations.** A green upstream suite shows only that Spree's own tests pass. It says nothing about tenant isolation, which stays open under ISO-1 to ISO-7. If the storefront's plan does not include branch protection, that is recorded as a limitation rather than worked around.

### Proposed branch protection settings

Applied by the owner on 2026-10-21 as one "Protect main" ruleset per repository, matching this table ([record](verification/2026-10-21-fb-02-merge-push-and-protection.md#saved-rulesets)). Each repository gets one ruleset for its default branch (Settings, then Rules, then Rulesets), or a classic branch protection rule with the same effect.

| Setting | `liquorify` and `liquorify-storefront` | Why |
|---|---|---|
| Target | The default branch, `main` | — |
| Require a pull request before merging | On, with 0 required approvals | GitHub does not let authors approve their own pull requests, and one person has access, so a required approval would block every merge (LIQ-001 §2). Owner review stays a process rule; raise it to 1 when a second reviewer joins |
| Require status checks to pass | On, with the proposed required checks in the table above, each from the GitHub Actions source | Checks from the workflow files, not from another app reporting the same name |
| Require branches to be up to date before merging | On | The checks then cover what `main` becomes after the merge, which LIQ-001 §4 asks for. With one person merging, the extra runs are rare |
| Require conversation resolution before merging | On | Review comments are answered before merge |
| Block force pushes, restrict deletions | On | Keeps `main`'s history |
| Bypass list | Empty, so the rule applies to administrators too | Acceptance criterion 4 asks `main` to refuse direct pushes. Turning the rule off for an urgent change is itself a Protected change |

Effects to expect:

- **Backend checks are selectable now.** GitHub offers a check once it has reported in the repository. Every name in the backend list reported on 2026-10-21, exactly as written above ([record](verification/2026-10-21-fb-02-first-workflow-run.md)).
- **Every backend pull request runs the full suite,** documentation included, because the path filters are gone. Runner minutes are free while the repository is public (D7).
- **Dependency audit pull requests wait.** The weekly audit opens them with the default token, which does not start CI, so their required checks do not report until CI is started another way ([LIQ-005](LIQ-005-spree-engineering-adoption.md) SA-28).
- **A renamed job needs the list updated** in the same change, or pull requests wait for a check that no longer exists.
- **The storefront is public** since 2026-10-21, so GitHub Free enforces its rules. If it were made private again, they would need GitHub Pro or a team plan.

## Next documentation work item

**FB-18: the Spree product capability baseline and the Design System Adoption and Extension decision record.** Tracked on 2026-10-21 at the owner's request; not started.

- **Product capability baseline.** What Spree already offers merchants, shoppers and operators, measured against the Product & Design capabilities in [SES-001](framework/SES-001.md#3-capability-catalog) and the merchant lifecycle specification, and recorded for each feature as reuse, extend, not needed or unknown. It describes what exists. Under the recorded instruction in [LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work), no Spree feature becomes a requirement by being listed.
- **Design System Adoption and Extension decision record.** How Liquorify adopts and extends `@spree/dashboard-ui` and the storefront's components ([LIQ-005](LIQ-005-spree-engineering-adoption.md) SA-24, SA-25), including tokens and branding (FB-14) and the accessibility target (FB-15). It also sets how Liquorify uses the tools the owner selected on 2026-10-21 ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)): Figma for design files, Storybook for component documentation, and Chromatic for visual review. For each tool it states the cost, the accounts and CI secrets it needs, and what it would expose. It stays PROPOSED until the owner accepts it.
- **Relation to other items.** It prepares the decisions that FB-14 and FB-15 make when the first Liquorify screen activates them. Setting up the selected tools adds accounts, dependencies, CI steps and credentials, so that is a separate Protected item.
