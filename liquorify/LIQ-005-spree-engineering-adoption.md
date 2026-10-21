---
document_id: LIQ-005
title: Spree Engineering Adoption Record
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Spree Engineering Adoption Record

Liquorify intends to reuse Spree's existing engineering foundation through the framework in [`framework/`](framework/), and to extend it only where Liquorify needs more. This record lists the relevant Spree mechanisms, the capabilities in [SES-001](framework/SES-001.md#3-capability-catalog) they support, and a recommendation for each. The default baseline and its exceptions are in [LIQ-001 §6](LIQ-001-project-profile.md#6-spree-engineering-baseline-and-exceptions). Decision D1 put them into effect for Liquorify-owned work on 2026-10-21, except the parts that wait on an open decision. The rules named in §6.2 are therefore in effect; every other recommendation here stays a proposal until its next action settles it.

It builds on the [documentation inventory](LIQ-002-documentation-inventory.md) and the [engineering baseline](LIQ-003-engineering-baseline.md). [LIQ-001 §6.1](LIQ-001-project-profile.md#61-spree-mechanisms-mapped-to-the-ses) maps the same mechanisms to capability areas, including Product & Design; this record goes down to each mechanism for the engineering areas. Only missing or conflicting evidence was investigated for it, on 2026-10-21. It links to the authoritative guidance instead of copying it.

## How to read this

**Adopting a convention is not verifying an implementation.** A recommendation says whether Liquorify work should follow a Spree rule or use a Spree mechanism. The state column says what has actually been shown about it. Adopting a rule never marks a capability satisfied, and it does not change any finding in LIQ-003. Failing and unverified findings stay as they are.

- **Source:** **B** is `liquorify` at `394b53f` (Spree 6.0.0.rc4). **S** is `liquorify-storefront` at `c19c466`. Section names refer to that repository's `CLAUDE.md` unless a file is named. The backend rules are in [`CLAUDE.md`](../CLAUDE.md).
- **Recommendation:**
  - *Reuse as-is:* adopt the rule or mechanism unchanged.
  - *Adapt:* adopt it with the Liquorify change named in the row.
  - *Replace:* it does not apply to Liquorify work, and Liquorify uses its own.
  - *Investigate:* the evidence is missing or conflicting, and the next action gets it.
- **State and evidence:** the control states from [SES-001 §4](framework/SES-001.md#4-assess-only-what-the-decision-needs) (Configured, Verified, Operating), with the evidence codes from [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence). *Rule only* means a written rule that no tool checks.

## Coding conventions

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-01 | General rules: comments, reuse before adding code, defensive coding, plain-English communication | B [§ General rules](../CLAUDE.md#general-rules) | GG-16, GG-17 | Reuse as-is | Rule only (R) | Review is the only check, and it is not independent (LIQ-001 §2) | — |
| SA-02 | Ruby conventions: Rails conventions, RESTful actions, services only when needed, readable names, documentation comments on public methods | B [§ Architecture Principles](../CLAUDE.md#architecture-principles), [§ Code Organization](../CLAUDE.md#code-organization) | GG-17, AR-05 | Adapt: Liquorify's own code uses its own namespace, as the provider gems do (`SpreeStripe`), instead of `Spree::` | Rule only (R) | The namespace and code home are not decided | FB-05 |
| SA-03 | Ruby style check (RuboCop) | B `spree/common_spree_dependencies.rb` | QV-02, GG-17 | Investigate | The gems are dependencies, but no RuboCop configuration is tracked and no workflow runs it (R, 2026-10-21) | Ruby style is checked by review only | Decide whether Liquorify gates Ruby style; not part of FB-02 |
| SA-04 | TypeScript lint and format (Biome) | B `biome.json` and per-package configs; S `biome.json` and its § Code Quality with Biome | QV-02, GG-17 | Reuse as-is | Verified in the cloud (C1, C2). Storefront job Operating (G). Backend job Configured, never run here | — | FB-02 |
| SA-05 | Git policy: commit message form, `Fix:` prefix, feature branches, public pull request descriptions, no agent co-author | B [§ Git Policy](../CLAUDE.md#git-policy) | DR-01, DR-18 | Adapt: automation may use the branch name its session is given. Because `liquorify` is public, the rule against credentials and personal data in pull requests also covers every Liquorify document | Rule only; `main` is unprotected in both repositories (G) | Nothing enforces it | FB-02 |
| SA-06 | Storefront rules for React 19, Next.js 16, state, TypeScript and code style | S `CLAUDE.md` | AE-01, GG-17 | Adapt: the rules apply, but their code examples are illustrative. At `c19c466` the cart and sign-in examples use method and cookie names that differ from the storefront's own code (R, 2026-10-21). The code is authoritative | Lint, types and unit tests Verified (C1) | An agent copying an example would write code that does not match | Say so in the storefront's Liquorify pointer section after D1 |

## Application structure

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-07 | Monorepo layout: engines, provider gems, packages | B [§ Monorepo Structure](../CLAUDE.md#monorepo-structure) | AE-02, AR-05, GG-14 | Reuse as-is | Matches the tracked tree (R) | `server/` and `storefront/` are untracked local clones (X8) | — |
| SA-08 | Extension points: provider gems, `Spree::Dependencies`, extension-permitted attributes, dashboard plugins, and slots on every detail page | B `spree/providers/`, [§ Dependencies System](../CLAUDE.md#dependencies-system), [§ API Controllers](../CLAUDE.md#api-controllers), [§ @spree/dashboard](../CLAUDE.md#spreedashboard--admin-ui-react-spa), `packages/dashboard-plugin-example`, `docs/developer/dashboard/slots-catalog.mdx` | AE-04, AR-02 | Adapt: Liquorify code lives in a tracked Liquorify engine and dashboard plugin, never in `server/` (X8) | Configured upstream; no Liquorify extension exists (R) | The host application and code homes are not decided | FB-05 |
| SA-09 | Store scoping: `Spree::SingleStoreResource`, `Spree::Current`, lookups through `current_store` | B [§ Models](../CLAUDE.md#models), [§ Spree::Current](../CLAUDE.md#spreecurrent), [§ Architecture Principles](../CLAUDE.md#architecture-principles) | AE-08, SP-09, GG-19 | Adapt: the rule extends to shopper accounts and every shopper-facing surface, which Spree shares across the stores of one installation (X7) | Gap: 6 of 9 isolation checks fail (C3) | Following the rule does not by itself separate merchants | FB-03 |
| SA-10 | Statuses and workflows instead of state machines | B [§ Models](../CLAUDE.md#models), `docs/plans/6.0-normalize-state-to-status.md` | AE-09 | Reuse as-is | Configured upstream (R); stores have no lifecycle status | — | After the specification is accepted |
| SA-11 | Background jobs that run in their record's store | B [§ Architecture Principles](../CLAUDE.md#architecture-principles), `Spree::BaseJob` | AE-07 | Reuse as-is | Configured (A); job isolation not tested | — | FB-03, later surfaces |
| SA-12 | Events, subscribers and webhooks | B [§ Events System](../CLAUDE.md#events-system) | AR-12, AE-06 | Reuse as-is | Configured; not assessed for Liquorify (R) | Delivery per store not tested | When integrations are scoped |
| SA-13 | Emails in Liquid and MJML, fed by serializers, styled from store branding | B [§ Emails](../CLAUDE.md#emails-liquid--mjml) | AE-02, PD-10 | Reuse as-is | Configured; not run here (R) | — | When Liquorify emails are scoped |
| SA-14 | Plans in `docs/plans/` and architecture pages in `docs/developer/` | B [§ Plans & Architecture Decisions](../CLAUDE.md#plans--architecture-decisions), [§ Mintlify Documentation](../CLAUDE.md#mintlify-documentation) | GG-04, GG-05, GG-15 | Replace for Liquorify work: Liquorify plans and records go in `liquorify/` (X1 to X3, D4). Upstream plan constraints still apply when Liquorify changes Spree code | Rule only (R) | — | D4 |

## APIs

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-15 | API v3 controllers: base controllers, declared request parameters, matching read and write names, workflows for writes | B [§ API Controllers](../CLAUDE.md#api-controllers) | AE-05, AR-10, GG-18 | Reuse as-is | Configured (R) | Customer endpoints are not narrowed by store (C3) | FB-03 |
| SA-16 | Prefixed IDs and short type names on the wire | B [§ Prefixed IDs](../CLAUDE.md#prefixed-ids), [§ Typed values](../CLAUDE.md#typed-values-api_type-never-the-ruby-class-name) | AR-10, GG-18 | Reuse as-is | Configured (R) | — | — |
| SA-17 | Store and admin serializers; webhook payloads from store serializers | B [§ Serializers](../CLAUDE.md#serializers-alba) | AR-10, SP-10 | Reuse as-is | Configured (R) | — | — |
| SA-18 | API authentication: publishable keys, secret keys with scopes, user tokens, guest cart tokens | B [§ API Authentication](../CLAUDE.md#api-authentication) | SP-05, SP-06 | Adapt: a shopper's token must be tied to the merchant it was issued for (X7) | Gap: a shopper can sign in at another store (C3) | — | FB-03 |
| SA-19 | Generated contracts: OpenAPI from integration specs; SDK types, Zod schemas and request types generated from it, regenerated by a commit hook and checked for drift in CI | B [§ Type Generation Pipeline](../CLAUDE.md#type-generation-pipeline), [§ Documentation](../CLAUDE.md#documentation), `lefthook.yml` | AE-11, QV-06 | Reuse as-is | Zod schemas checked against recorded responses, Verified inside C2. Drift checks Configured, never run here (R) | The storefront pins SDK rc.3; the backend ships rc.4 | FB-06 |

## Database practices

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-20 | Model rules: base class, explicit associations, string statuses, scoped uniqueness backed by an index, `normalizes`, no hardcoded table names, Arel over raw SQL | B [§ Models](../CLAUDE.md#models) | AE-08, GG-19 | Reuse as-is | Rule only (R). Shopper accounts do not meet the store-ownership rule (C3) | — | FB-03 |
| SA-21 | Migration rules: no foreign keys, no defaults on string columns, portable JSON columns, data changes in rake tasks | B [§ Migrations](../CLAUDE.md#migrations) | DR-12, AR-09, GG-19 | Investigate: whether Liquorify-owned tables keep the no-foreign-key rule is decided with the tenant model (AR-09) | Rule only. Engine migrations are renumbered when `server/` is re-cloned (R) | — | FB-03, FB-05 |
| SA-22 | Supported databases: PostgreSQL, MySQL and SQLite, with SQLite the default for local specs | B [§ Backend (Ruby — RSpec)](../CLAUDE.md#backend-ruby--rspec), `.github/workflows/tests.yml` | AR-09, QV-14 | Adapt: PostgreSQL is the database for Liquorify verification evidence (LIQ-001 §4). SQLite stays a quick local check. Whether Liquorify supports MySQL is decided before MySQL checks become required | CI suites on PostgreSQL 16 and MySQL Configured, never run here (G). C3 ran on SQLite only | — | FB-02, FB-03 |
| SA-23 | Money, time zones and translations | B [§ Money](../CLAUDE.md#money), [§ Time zones](../CLAUDE.md#time-zones), [§ I18n](../CLAUDE.md#i18n) | AE-02, GG-19 | Reuse as-is | Rule only (R) | — | — |

## Design system

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-24 | Dashboard design system and screen rules: `@spree/dashboard-ui` (headless, shadcn on Base UI), listing tables, forms, translations, confirmations, date and money inputs; the dashboard is the reference for the seller panel | B [§ @spree/dashboard](../CLAUDE.md#spreedashboard--admin-ui-react-spa), `packages/dashboard-ui` | PD-13, AR-04 | Reuse as-is for the dashboard and seller panel | Configured; component tests Verified inside C2 | No Liquorify brand and no accessibility target (PD-09, PD-11) | FB-14, FB-15 |
| SA-25 | Storefront components: shadcn on Radix (`components.json`) | S | PD-13, AE-01 | Investigate: whether the storefront keeps its own components or shares tokens with the dashboard | Verified only as part of the C1 tests | The two systems share no tokens | FB-14 |

## Dependencies

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-26 | Backend Dependabot: gems per engine, GitHub Actions, npm with a cooldown | B `.github/dependabot.yml` | DR-06, SP-13 | Reuse as-is | Configured; no pull requests yet (G) | No triage owner | FB-11 |
| SA-27 | Backend pnpm supply-chain settings: minimum release age, no non-registry sub-dependencies, trust policy, approved install scripts | B `pnpm-workspace.yaml` | DR-05, SP-20, GG-21 | Adapt: apply the same settings to the storefront, which has only an approved-build list (R, 2026-10-21) | Frozen installs Verified (C1, C2) | The storefront accepts new releases immediately | FB-11 |
| SA-28 | Weekly dependency audit that pins patched versions and opens a pull request | B `.github/workflows/security-audit.yml` | SP-13, DR-06 | Reuse as-is | Configured, never run (G). Once Actions is on, it runs every Monday with write access and opens a pull request in `liquorify` when it finds a fix. Whether Actions may open pull requests here depends on a repository setting that was not checked | It opens pull requests with the default token, so CI does not start on them (its own comment says so). Once checks are required, such a pull request cannot merge until CI is started on it another way | OA-2, FB-02, FB-11 |
| SA-29 | Storefront dependency rules and Dependabot | S § Dependency Security, `.github/dependabot.yml` | DR-06, GG-21 | Reuse as-is | Dependabot Operating; 10 open pull requests, one failing (G) | No triage owner or cadence | FB-11 |
| SA-30 | Ruby lockfiles | B: engine lockfiles ignored; the host lockfile sits in the untracked `server/` | DR-05 | Adapt: Liquorify tracks the lockfile of the host application it decides on | Gap (R) | Ruby dependencies cannot be reproduced from tracked files | FB-05 |

## Development tooling

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-31 | Development paths: Docker (`pnpm server:setup`) and native worktrees (`wt`, Homebrew PostgreSQL, portless) | B `.github/CONTRIBUTING.md`, [§ Development Server](../CLAUDE.md#development-server-worktrees), `scripts/worktree/` | PI-09, PI-14 | Investigate: choose one path and verify it from a clean checkout | The Mac uses Docker (M). Neither path verified end to end. Setup and teardown delete local databases (R) | Both paths clone upstream repositories | FB-04, FB-05 |
| SA-32 | Test wrappers: `scripts/test/rspec`, `pnpm test:changed`, one full suite at a time | B [§ Testing](../CLAUDE.md#testing), `scripts/test/` | PI-14, QV-03 | Reuse as-is | Configured; it falls back to the Linux core count when the macOS tools are missing (R, 2026-10-21); not run here | — | — |
| SA-33 | Commit hooks (Lefthook): Biome, and regeneration of generated types | B `lefthook.yml`; S `lefthook.yml` | GG-17, QV-06 | Reuse as-is | Configured; runs only where Lefthook is installed (R) | Local only; CI is the gate | — |
| SA-34 | Agent hooks and permissions: format after each edit, block bare full-suite runs, lint and type check before a commit; tracked local permissions | B `.claude/settings.json`, `.claude/hooks/`, `.claude/settings.local.json` | GG-13, PI-14 | Adapt: keep the hooks. Replace the tracked local permissions, which allow any shell command and upstream's own monitoring and documentation tools, with settings that match LIQ-001 §3 (X4) | Configured (R) | — | FB-08 |
| SA-35 | Agent commands: `create-plan`, `update-plan`, `implement-plan`, `reviews-plans`, `schema-review`, `autofix-pr`, and the architect agent | B `.claude/commands/`, `.claude/agents/` | GG-13 | Replace the plan commands for Liquorify work: `create-plan` opens Linear and `spree/spree` issues, `implement-plan` opens pull requests on `spree/spree`, and both work in `docs/plans/` (X1, X4). Investigate the others, which act on the current branch | Configured (R) | — | FB-08 |

## Builds

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-36 | TypeScript builds: Turbo, tsup and Vite | B `turbo.json`, `packages/*` | DR-04 | Reuse as-is | Verified during C2 | — | — |
| SA-37 | Storefront build: `next build` and its `Dockerfile` | S | DR-04, PI-15 | Reuse as-is | Not run (R). The `Dockerfile` uses Node 22 and CI uses Node 20 | Node versions disagree (PI-07) | FB-04 |
| SA-38 | Gem builds and the host application cloned from upstream `spree-starter` | B `spree/*.gemspec`, `scripts/server-setup.sh` | DR-04, AR-15 | Adapt: Liquorify builds no gems for release. The host application comes from a tracked Liquorify source (X8) | Not run (R) | — | FB-05 |

## Tests

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-39 | RSpec rules: factories, `render_views` in controller specs, integration specs for happy paths and simple failures, frozen time, never changing the shared default store | B [§ Testing](../CLAUDE.md#testing), [§ Backend (Ruby — RSpec)](../CLAUDE.md#backend-ruby--rspec) | QV-03, QV-05, QV-13 | Adapt: a change that touches store-owned data, tenant isolation, identity or authorization adds permitted and denied tests, with a same-store success for each cross-store refusal, run on PostgreSQL (LIQ-001 §4) | Not run here, except one targeted spec on SQLite (C3) | The shared API test helpers fix one store, so on their own they cannot show isolation | FB-02, FB-03 |
| SA-40 | Vitest and Testing Library | B, S | QV-03, QV-04 | Reuse as-is | Verified (C1, C2) | — | — |
| SA-41 | Dashboard end-to-end rules: every dashboard behaviour change ships a Playwright test with assertions on what the user sees | B [§ Admin SPA E2E](../CLAUDE.md#admin-spa-e2e-playwright) | QV-07, QV-20, GG-22 | Reuse as-is | Configured, never run here (R) | — | FB-02 |
| SA-42 | Storefront end-to-end tests that boot a Spree backend | S `e2e/`, `e2e-backend/`, `.github/workflows/ci.yml` | QV-07, QV-20 | Adapt: run them against a backend built from a recorded `liquorify` revision (X10) | The job failed at its Stripe configuration check on pull request #13 and on `main`; the browser tests did not run (G) | — | OA-1, FB-06 |
| SA-43 | "Run the changed specs locally; the full suite is CI's job" | B [§ Testing](../CLAUDE.md#testing) | DR-09, QV-17 | Adapt: this holds only once FB-02 shows the suites run on `liquorify`. Until then, a change that relies on CI records the Ruby suites as NOT_RUN (X9) | CI has never run here (G) | — | FB-02 |

## CI

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-44 | `tests.yml`: Ruby suites on PostgreSQL and MySQL, Brakeman, coverage upload | B `.github/workflows/tests.yml` | DR-09, QV-17, PI-11 | Adapt as in FB-02: manual trigger, path filter decision, required PostgreSQL checks. The coverage upload expects a `CODECOV_TOKEN` secret and does not fail the run without one | Configured, never run. The Actions API lists no registered workflows (G) | — | OA-2, FB-02 |
| SA-45 | `packages.yml`: TypeScript checks, scaffolded app, SDK integration, dashboard end-to-end shards | B `.github/workflows/packages.yml` | DR-09, QV-06, QV-07 | Adapt as in FB-02 | Configured, never run (G) | — | FB-02 |
| SA-46 | Storefront `ci.yml` | S `.github/workflows/ci.yml` | DR-09, QV-17 | Reuse as-is | Lint, type check and unit test jobs Operating; the end-to-end job fails at its configuration check (G) | `main` unprotected | FB-02, OA-1 |
| SA-47 | Pinning actions by commit | B and S workflows | SP-20 | Adapt: pin every backend action by commit, as the backend's Dependabot comment already says they are | The storefront and the audit workflow pin by commit; other backend workflows use version tags, and one uses `@main` (R) | — | A CI change after FB-02 |

## Security

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-48 | Security rules: lookups through the current store, CanCanCan checks, permitted parameters, Ransack allowlists, `Spree.user_class` | B [§ Security](../CLAUDE.md#security), [§ Architecture Principles](../CLAUDE.md#architecture-principles) | SP-03, SP-07, GG-20 | Adapt: add shopper ownership and same-store controls (X7) | Configured. Staff refused for a store where they hold no role, Verified on one endpoint; the admin role reaches every store's shoppers (C3) | CanCanCan filters by role, not by tenant, as the rule itself warns | FB-03 |
| SA-49 | Third-party API rules: official SDKs, recorded responses with secrets filtered, structured errors, timeouts and retries | B [§ 3rd party APIs](../CLAUDE.md#3rd-party-apis) | AE-06, AE-10 | Reuse as-is | Rule only (R) | — | When an integration is built |
| SA-50 | Encrypted secret preferences; secret API keys with scopes | B [§ Migrations](../CLAUDE.md#migrations), [§ API Authentication](../CLAUDE.md#api-authentication) | SP-11, SP-12 | Reuse as-is | Configured when encryption keys are set (A) | No secret store for Liquorify | FB-16 |
| SA-51 | Static security testing: Brakeman in CI; bundler-audit | B `.github/workflows/tests.yml`, `spree/common_spree_dependencies.rb` | QV-21 | Reuse as-is | Brakeman Configured, never run here (G). bundler-audit is a dependency that nothing runs (R) | — | FB-02 |
| SA-52 | Security policy and vulnerability reporting | B `.github/SECURITY.md`, `docs/developer/security/security_policy.mdx` | SP-14 | Replace: reports go to Spree, and the supported versions listed are Spree 5.x and 4.10, not 6.0 (X5) | — | — | FB-07 |
| SA-53 | Update check and usage data sent to Spree | B `docs/developer/deployment/usage-data.mdx` | SP-10 | Investigate | On by default (R) | — | FB-09 |

## Release practices

| # | Mechanism | Source | SES | Recommendation | State and evidence | Limitation | Next |
|---|---|---|---|---|---|---|---|
| SA-54 | Spree's publishing: Changesets configured for `spree/spree`, gem release on `v*` tags, six npm release jobs, documentation package release | B [§ Changesets & Versioning](../CLAUDE.md#changesets--versioning), `.changeset/config.json`, `.github/workflows/release.yml`, `packages.yml`, `docs-package.yml` | DR-13, DR-16, GG-23 | Replace: Liquorify publishes no gems, npm packages or documentation site. Limit the jobs to the upstream repository (X11) | Configured and live on `main`; the FB-02 pull request limits every publishing job to `spree/spree` (R) | Shown skipped only after merge | FB-02 |
| SA-55 | Upstream deprecation rules and upgrade guides | B [§ Serializers](../CLAUDE.md#serializers-alba), `docs/developer/upgrades/` | GG-10, AR-16 | Reuse as-is for Spree code | Rule only. The base is a release candidate, with no plan for taking later upstream releases (R) | — | FB-12 |

Liquorify has no release practice of its own yet. When a first release is scoped, it follows [ENG-001 §5](framework/ENG-001-engineering-charter.md#5-ready-done-and-release-ready) and §8, recorded in LIQ-001. Until then the standing instruction holds: nothing is merged or deployed without the owner's explicit instruction.

## Questions the adoption leaves open

Each one is already tracked, or is new here and marked so.

| Question | Where it is decided |
|---|---|
| Adopt the baseline as a whole, by area, or later | Answered on 2026-10-21 by D1 in LIQ-001: in effect for Liquorify-owned work, with the exceptions |
| Liquorify's namespace and code home, and the tracked host application | FB-05 |
| Whether Liquorify supports MySQL, which decides whether the MySQL checks become required | Open. The MySQL checks stay advisory until it is decided (instruction of 2026-10-21) |
| Whether Liquorify-owned tables use foreign keys | With FB-03 (AR-09) |
| Whether Ruby style is gated | New; no item yet |
| Which development path Liquorify verifies | FB-04 |
| Whether the storefront shares the dashboard's design tokens | FB-14, prepared by the FB-18 decision record |
| What replaces the upstream plan commands for Liquorify work | FB-08, after D3 |
