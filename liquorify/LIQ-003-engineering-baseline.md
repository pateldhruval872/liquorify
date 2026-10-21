---
document_id: LIQ-003
title: Engineering Baseline
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Engineering Baseline

This records where Liquorify stands against each of the 172 capabilities in [SES-001](framework/SES-001.md#3-capability-catalog). It lists the existing mechanism, applicability, finding, evidence and next action for each ID. Capability names and purposes are defined only in SES-001 and are not repeated here.

How Liquorify proposes to adopt each Spree mechanism is recorded in [LIQ-005](LIQ-005-spree-engineering-adoption.md). Adopting a convention changes no finding here.

A document existing does not prove a behaviour, and a configured tool does not prove it is enforced. Each control is labeled with its state from [SES-001 §4](framework/SES-001.md#4-assess-only-what-the-decision-needs): **Planned**, **Configured**, **Verified** or **Operating**.

## 1. Scope, revisions and evidence

**Scope.** Stage 0 of [ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc), and the path to a first release that onboards real merchants and takes real orders. The first release scope is not approved, so applicability is provisional and will be revised when it is.

**Revisions.** Backend `liquorify` at `394b53f` (Spree 6.0.0.rc4, unchanged upstream). Storefront `liquorify-storefront` at `c19c466` (unchanged upstream).

**Evidence codes** used in the tables:

| Code | What was done | Environment | Result and limitation |
|---|---|---|---|
| A | Codebase assessment: code reading of both repositories, 2026-10-20 | Cloud checkout, same revisions | Reading only; nothing was run |
| R | Code and configuration reading for this baseline, 2026-10-20 and 21 | Cloud checkout, same revisions | Reading only |
| C1 | Storefront: `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm exec tsc --noEmit`, `pnpm run test`, `pnpm run check:locales`, 2026-10-20 23:55 UTC | Cloud container: Node 22.22.0, pnpm 10.33.4 | **PASS**: Biome clean on 278 files, no type errors, 34 test files and 248 tests passed, 4 locales in sync. Not run: production build, end-to-end tests. CI uses Node 20 |
| C2 | Backend TypeScript workspace: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, 2026-10-20 23:58 UTC | Cloud container: Node 22.22.0, pnpm 11.1.1 | **PASS**: 13 lint, 18 type-check and 16 test tasks; 1,374 tests in 8 packages. Not run: Ruby specs, browser tests, generated-code drift checks |
| C3 | Cross-store shopper access reproduction (merchant lifecycle work), 2026-10-20 | Cloud container: Ruby 3.3.6, SQLite test app | **FAIL**: 9 examples, 6 failures. No same-store controls yet; not run on PostgreSQL. Details stay out of this public repository |
| G | GitHub repository state through the GitHub API, 2026-10-20 and 21 | GitHub | Backend: public, not a GitHub fork, no workflow run ever, and the Actions API lists no registered workflows although five workflow files are on `main` (2026-10-21); issues off; `main` unprotected. Storefront: private; CI runs on pull requests; `main` unprotected; 10 open Dependabot pull requests. Storefront end-to-end result: see Tests and CI in §2 |
| M | Owner's Mac, read-only: Git remotes, branch, working-tree status and file names (this baseline); setting names and request log (assessment), 2026-10-20 | Owner's Mac | Nothing run; no values read |
| U | Upstream documentation only | — | Not verified in code or behaviour |

**Tool versions: declared, CI, cloud and Mac.** The declarations disagree, which matters for reproducible setup (FB-04).

| Tool | Declared in the repositories | CI | Cloud container | Owner's Mac (M) |
|---|---|---|---|---|
| Ruby | 4.0.5 in the untracked `server/.ruby-version`; gems accept 3.2 or later | 4.0 | 3.3.6 | `server/` declares 4.0.5; runs in Docker |
| Node | Backend `.node-version` 22; backend `CLAUDE.md` asks for 24 or later for worktree tooling; storefront declares none | Backend 22; storefront 20 | 22.22.0 | Not checked |
| pnpm | Backend 11.1.1; storefront 10.33.4 | From each `packageManager` | 11.1.1 and 10.33.4 | Not checked |
| PostgreSQL | 18 in the starter's Docker Compose or Homebrew | 16 (backend tests); 18 (storefront end-to-end) | 16 installed, not started | 18 in Docker |
| Docker | Needed by the Docker path and storefront end-to-end tests | GitHub runners | Command present, no daemon | In use |

## 2. Cross-cutting findings

**Reusable Spree capabilities.** Store-owned records and server-side store selection; per-store staff roles with a permission catalog; separate shopper and staff account types; API v3 with generated OpenAPI, typed SDKs and Zod schemas; the dashboard design system (`@spree/dashboard-ui`) and plugin and slot extension points; store provisioning and the Getting Started checklist; workflows with statuses; background jobs that run in their record's store; events and webhooks; Liquid and MJML emails; the Stripe, EasyPost and Meilisearch providers; and an extensive test and CI setup.

**Required extensions.** A business record above the store and explicit shopper ownership; store lifecycle and holds; merchant sign-up and onboarding; Liquorify subscription billing; a minimal operator console with its own permissions; a storefront that can serve more than one merchant, or one deployment per merchant; a payment flow that fits the qualified Technology Provider goal. All are proposals in the merchant lifecycle specification, none accepted.

**Gaps and risks, in order of consequence.**

1. **Tenant isolation fails for shoppers** (SP-09, C3). Confirmed: one store's admin can list, open and rename another store's shopper; a shopper can sign in at another store; registration at one store is refused because the email exists at another, which also reveals that the account exists; one store's tax rate completes another store's tax setup task. Open until FB-03 and the fixes land.
2. **Backend checks have never run on `liquorify`** (DR-09, G). The workflows are configured but trigger only on changes under `spree/**`, `packages/**` and similar paths, with no manual trigger, and the Actions API lists no registered workflows, so Actions may be turned off for the repository. Nothing has verified that the Ruby suites pass at this revision.
3. **Nothing is enforced on `main`** (DR-03, QV-17, G). Neither repository protects `main` or requires checks.
4. **Upstream publishing workflows are live in this copy** (DR-13, R). `release.yml` publishes Spree's gems on a `v*` tag; six `… - Release` jobs in `packages.yml` publish Spree's npm packages on pushes to `main` that touch its paths; `docs-package.yml` publishes Spree's docs npm package on pushes to `main` that touch the developer docs, API reference or the package itself. They would fail without Spree's publishing rights, but they should not run here.
5. **The development path points at upstream** (PI-09, DR-02, R). Setup clones upstream `spree/storefront` and `spree/spree-starter`; `server/` is untracked, so the Ruby lockfile and host application are not reproducible from tracked files.
6. **Storefront end-to-end tests run against upstream** (QV-20, R). They boot `ghcr.io/spree/spree:latest`, not a backend built from `liquorify`. The storefront pins `@spree/sdk` 2.0.0-rc.3 while the backend ships rc.4.
7. **Security reporting and agent permissions are upstream's** (SP-14, GG-13, R). `SECURITY.md` routes reports to Spree. The tracked `.claude/settings.local.json` allows any shell command.
8. **Usage data goes to Spree by default** (SP-10, R). The daily update check sends the store's address and record counts to `spreecloud.io` unless turned off.

The proposed inheritance and Product & Design mapping is in [LIQ-001 §6.1](LIQ-001-project-profile.md#61-spree-mechanisms-mapped-to-the-ses). Its reuse dispositions do not replace the evidence-based findings below.

**Design system.** The dashboard and seller panel use `@spree/dashboard-ui` (shadcn components on Base UI, Tailwind, headless by design). The storefront has its own shadcn components on Radix (`components.json`, `radix-ui`). They share no tokens, and no Liquorify brand exists yet (PD-13).

**Repository boundaries.** Two independent repositories with different visibility. The backend is public, so everything here is public; the storefront is private. Locally, upstream scripts clone a storefront into the backend's ignored `storefront/` folder; that clone keeps its own Git history and is a different repository (DR-02).

**Tracked and generated source.** Tracked but generated, never edited by hand: SDK types (`packages/*/src/types/generated`), request types (`packages/*/src/types/params`), Zod schemas (`packages/*/src/zod/generated`) and the OpenAPI files in `docs/api-reference/`. A Lefthook hook regenerates types when serializers are committed, and CI checks the rest for drift. Ignored and regenerated: `server/`, `storefront/`, package `dist/` folders, the CLI's generated spec and starter templates, and engine `Gemfile.lock` files. The storefront lockfile is rewritten locally when the backend's SDK is linked in, and must not be committed; on the owner's Mac it is modified for that reason (M).

**Development setup.** Two upstream paths: Docker (`pnpm server:setup`, used on the Mac) and native worktrees (`wt`, Homebrew PostgreSQL, portless). `pnpm server:setup` and `pnpm server:teardown` delete the Docker database volume and `server/`; `scripts/worktree/make-template.sh` drops and rebuilds a database. A local test order is blocked until a payment method is visible to shoppers (A).

**Tests and CI.** Verified in the cloud: storefront lint, types, unit tests and locale parity (C1); backend TypeScript lint, types and unit tests (C2). Operating: storefront lint, type check and unit test jobs on pull requests (G), with one failure on the `jsdom` 30 bump. The reviewed storefront end-to-end runs on `main` and PR #13 failed at the Stripe-key preflight, before checkout or Playwright ran; browser tests are NOT_RUN. Dependabot skips that job. Supplying the configuration removes the preflight blocker; a new run is required to establish test results (G; runs 39368899612 and 39520058404). Key setup is owner action OA-1 in LIQ-004. Configured, never run here: backend Ruby suites on PostgreSQL and MySQL, Brakeman, dashboard end-to-end, SDK integration, generated-code drift checks and the weekly dependency audit.

**Security.** Configured, not verified for Liquorify: API rate limits, CanCanCan authorization, encryption of secret preferences when keys are set, a development-only store-scope guard. Verified: a staff member naming a store where they hold no role is refused, on the orders endpoint (C3). Missing: threat model, security contact, incident handling and secrets infrastructure.

**Release practice.** None for Liquorify. Standing instruction: nothing is merged or deployed without the owner's explicit instruction.

## 3. Capability baseline

**Applicability:** *Required* for this scope; *Conditional*, with the condition that activates it; or *Not required* for this scope.
**Finding:** *Satisfied*, *Partial*, *Gap*, *Decision* (depends on an unresolved decision), *Revalidate*, *Not assessed*, or *Not applicable* (outside this scope, reason given).
**Next:** the smallest action, usually a backlog item in [LIQ-004](LIQ-004-foundation-backlog.md).

Totals: 96 required, 63 conditional and 13 not required. Findings: 64 partial, 17 gaps, 20 waiting on a decision, 56 not assessed, 15 not applicable, and none fully satisfied. "Partial" usually means a reusable Spree mechanism exists but has not been verified or extended for Liquorify.

### PD

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| PD-01 | Required | Project goal in the project instructions; no vision document in either repository | Partial | R | Record in `liquorify/` when product documents start |
| PD-02 | Required | Decisions so far live in the merchant lifecycle specification and project threads | Partial | R | FB-10, D8 |
| PD-03 | Conditional: a product question needs evidence first (licensing, age checks, launch geography) | None | Not assessed | — | — |
| PD-04 | Conditional: before pricing or geography decisions | None | Not assessed | — | — |
| PD-05 | Conditional: before onboarding or storefront design | None | Not assessed | — | — |
| PD-06 | Required | Merchant lifecycle specification, PROPOSED; first release scope not approved; pricing, trial, geography, licence and age checks unresolved | Decision | R | Owner accepts or revises the specification |
| PD-07 | Conditional: Liquorify adds navigation or pages | Dashboard navigation registry (`packages/dashboard-core`); storefront routes under `src/app/[country]/[locale]` | Not assessed | R | — |
| PD-08 | Conditional: onboarding is approved | Flows and states described in prose in the specification; no designs | Decision | R | After the specification is accepted |
| PD-09 | Conditional: branding work starts | No Liquorify visual identity; upstream styling | Gap | R | FB-14 |
| PD-10 | Conditional: Liquorify copy is written | Dashboard locale files (`packages/dashboard/src/locales`, `packages/dashboard-core/src/locales`); storefront `messages/` in 5 languages with a parity check (Verified) | Partial | R, C1 | — |
| PD-11 | Required with the first Liquorify screen | No accessibility target; component libraries are not verified | Gap | R | FB-15 |
| PD-12 | Conditional: a design needs user testing | None | Not assessed | — | — |
| PD-13 | Required | `@spree/dashboard-ui` for dashboard and seller panel; separate shadcn and Radix components in the storefront; no shared tokens or brand | Partial | R, A | FB-14 |
| PD-14 | Conditional: launch measures are defined | Storefront Google Tag Manager and Vercel Analytics hooks; backend reports | Not assessed | R | — |
| PD-15 | Not required | — | Not applicable: no experiment is planned | — | — |
| PD-16 | Not required | — | Not applicable: one person, no separate product practice | — | — |
| PD-17 | Required | Product records sit outside the repositories; listed in the `liquorify/` index | Partial | R | M3 (LIQ-002) |
| PD-18 | Conditional: first release scope is set | Later work named only, in the specification | Decision | R | — |
| PD-19 | Conditional: onboarding or storefront design starts | None | Not assessed | — | — |

### AE

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| AE-01 | Required | Storefront (Next.js 16, React 19); dashboard (React, Vite). Storefront serves one store per deployment, chosen by environment variables | Partial | R, A, C1, C2 | Storefront hosting decision |
| AE-02 | Required | Spree engines `spree/core`, `spree/api`, `spree/emails`, `spree/dashboard`, 6.0.0.rc4; no Liquorify code | Partial | R, A | — |
| AE-03 | Not required | None | Not applicable: no mobile scope | — | — |
| AE-04 | Required | Extension gem pattern (`spree/providers/*`); dashboard plugins (`defineDashboardPlugin`, `packages/dashboard-plugin-example`). Liquorify engine and plugin are proposals | Decision | R | FB-05 |
| AE-05 | Required | API v3 controllers with declared request parameters; store chosen on the server from key or header (`key_store_context.rb`, `admin/store_context.rb`). Customer endpoints are not narrowed by store | Gap | A, C3 | FB-03 |
| AE-06 | Required | Stripe, EasyPost and Meilisearch providers in `spree/providers/`; Adyen and PayPal are separate gems. The existing Connect path needs review against the intended merchant-as-seller flow; charge routing alone does not establish the legal role | Decision | A | Payment model decision |
| AE-07 | Required | Active Job with Solid Queue; `Spree::BaseJob` runs in the record's store. Isolation of jobs not tested | Partial | A | FB-03 (later surfaces) |
| AE-08 | Required | `Spree::SingleStoreResource` on 59 models; lookups through the current store. Customers belong to no store; the tax task counts every store's rates | Gap | A, C3 | FB-03 |
| AE-09 | Required | Statuses and workflows (no state machines in 6.0); stores have no lifecycle status | Partial | A, R | After the specification is accepted |
| AE-10 | Required | Structured API errors; `SpreeError` in the SDKs; upstream rules for third-party errors | Not assessed | R | — |
| AE-11 | Required | `@spree/sdk` 2.0.0-rc.4 in the backend, rc.3 pinned in the storefront; generated types and Zod schemas; OpenAPI files | Partial | A, C2 | FB-06 |
| AE-12 | Conditional: merchant imports or exports are scoped | Spree imports and exports | Not assessed | — | — |
| AE-13 | Not required | None | Not applicable: no machine-learning feature | — | — |

### AR

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| AR-01 | Required | No Liquorify architecture record; option A is a direction for validation | Decision | R | FB-03, then a record in `liquorify/` |
| AR-02 | Required | Proposed: Liquorify engine gem, dashboard plugin, operator console; host application undecided (`server/` is untracked) | Decision | R | FB-05 |
| AR-03 | Required | Proposed business, store and people model; Spree has no business record | Decision | R | FB-03 |
| AR-04 | Required | Dashboard split into `dashboard-ui`, `dashboard-core` and `dashboard` (`docs/plans/6.0-admin-spa.md`); storefront App Router | Partial | R, U | — |
| AR-05 | Required | Rails engines, services and workflows under upstream conventions (`CLAUDE.md`) | Partial | R | — |
| AR-06 | Not required | None | Not applicable: no mobile scope | — | — |
| AR-07 | Conditional: an independent service need is shown | One Rails application, the dashboard and the storefront | Not applicable: no such need yet | R | — |
| AR-08 | Required | Spree data model; whether shoppers are owned by the store or the business is open; no data classification | Decision | A, R | FB-03 |
| AR-09 | Required | One shared database; `store_id` on store-owned tables; no foreign keys by convention; no row-level security; PostgreSQL, MySQL and SQLite supported | Decision | A, R | FB-03 |
| AR-10 | Required | API v3 conventions, prefixed IDs, OpenAPI generated from integration specs (`CLAUDE.md`) | Partial | R | — |
| AR-11 | Required | Provider registries and webhooks; flow of funds unresolved; point-of-sale and inventory integration not designed | Decision | A | Payment and integration decisions |
| AR-12 | Conditional: inventory sync or merchant webhooks are scoped | Spree events, subscribers and webhooks | Not assessed | R | — |
| AR-13 | Conditional: hosting is decided | None | Not assessed | — | — |
| AR-14 | Conditional: hosting is decided | Upstream deployment guides only | Not assessed | U | — |
| AR-15 | Conditional: hosting is decided | Upstream single-node option (`spree_dashboard` serves the dashboard); storefront `Dockerfile`; starter `render.yaml` in the untracked `server/` | Decision | R, M | FB-16 |
| AR-16 | Required | Spree upgrade guides (`docs/developer/upgrades/`); 6.0.0.rc4 is a release candidate; no plan for taking upstream changes | Gap | R | FB-12 |
| AR-17 | Required | Upstream `docs/plans/` and `decisions.md` for Spree; `liquorify/` created for Liquorify; no Liquorify decision records yet | Partial | R | D4, D5 |
| AR-18 | Required | Upstream principles in `CLAUDE.md` (store scoping, money, time zones); Liquorify quality attributes undefined | Partial | R | — |
| AR-19 | Conditional: hosting is decided | None | Not assessed | — | — |
| AR-20 | Conditional: before the first hosted environment | `spree_opentelemetry` gem; storefront Sentry | Not assessed | R | — |

### DR

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| DR-01 | Required | Git on GitHub, with upstream history. Mac remotes still named `liquor` and `liquor-storefront`, probably renamed repositories (not confirmed) | Partial | G, M | FB-04 |
| DR-02 | Required | Two independent repositories, one public and one private; upstream scripts clone upstream repositories | Partial | G, R | FB-05, D7 |
| DR-03 | Required | Pull requests are possible; `main` unprotected in both; one person | Gap | G | FB-02 |
| DR-04 | Required | Turbo, tsup and Vite builds (Verified during C2); storefront `next build` and `Dockerfile` (not run); gem builds (not run) | Partial | C2, R | — |
| DR-05 | Required | Frozen pnpm lockfiles (Verified, C1 and C2); release-age and trust settings in `pnpm-workspace.yaml`. Ruby lockfiles are ignored or untracked | Partial | C1, C2, R | FB-05 |
| DR-06 | Required | Dependabot in both repositories (storefront Operating; backend Configured, no pull requests yet); weekly audit workflow in the backend (never run; once Actions is on it opens pull requests with write access); no triage owner | Partial | G, R | FB-11 |
| DR-07 | Conditional: Liquorify builds deployable artifacts | Upstream trusted publishing for Spree's gems only | Not assessed | R | — |
| DR-08 | Conditional: Liquorify builds deployable artifacts | None | Not assessed | — | — |
| DR-09 | Required | Backend `tests.yml` and `packages.yml` (Configured, never run here, path-triggered, no manual trigger); storefront `ci.yml` (lint, types and unit tests Operating on pull requests; the end-to-end job fails at its configuration check) | Gap | G, R | FB-02 |
| DR-10 | Conditional: hosting is decided | None | Not assessed | — | — |
| DR-11 | Conditional: a second environment exists | None | Not applicable: development only | — | — |
| DR-12 | Required | Engine migrations installed into the host application; re-cloning `server/` renumbers them; no Liquorify migrations | Partial | R | FB-05 |
| DR-13 | Conditional: first deployable release | Upstream publishing jobs in `release.yml`, `packages.yml` and `docs-package.yml` are live in this copy | Gap | R | FB-02 |
| DR-14 | Conditional: hosting is decided | None | Not assessed | — | — |
| DR-15 | Not required | None | Not applicable: no live traffic | — | — |
| DR-16 | Conditional: first release | None | Not assessed | — | — |
| DR-17 | Conditional: before the first deployment | None | Not assessed | — | — |
| DR-18 | Required | Backend has `main` only; upstream branch prefixes in `CLAUDE.md`; no strategy for taking upstream changes | Partial | G, R | FB-12 |

### QV

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| QV-01 | Required | Effect-based risk classes and change-specific verification proposed in LIQ-001 §4; upstream testing rules in `CLAUDE.md` | Partial | R | D1 |
| QV-02 | Required | Biome and TypeScript in both repositories (Verified); Brakeman in backend CI (Configured); RuboCop and bundler-audit listed as gems, not wired in as gates | Partial | C1, C2, R | FB-02 |
| QV-03 | Required | Vitest: 1,374 backend and 248 storefront tests pass (Verified); RSpec per engine (not run here) | Partial | C1, C2 | FB-02 |
| QV-04 | Required | Testing Library component tests inside the Vitest runs (Verified) | Partial | C1, C2 | — |
| QV-05 | Required | RSpec request and integration specs; SDK integration tests in `packages.yml`. One targeted request spec ran on SQLite | Partial | C3, G | FB-02, FB-03 |
| QV-06 | Required | OpenAPI generated from integration specs; Zod schemas checked against recorded responses (Verified inside C2); drift checks in CI (Configured) | Partial | C2, R | FB-02 |
| QV-07 | Required | Playwright for the dashboard (`packages/dashboard/e2e`) and the storefront (`e2e/`); neither run here | Partial | R | FB-02, FB-06 |
| QV-08 | Conditional: Liquorify branding or screens ship | None found | Not assessed | R | — |
| QV-09 | Required with the first Liquorify screen | No accessibility checks found | Gap | R | FB-15 |
| QV-10 | Conditional: performance requirements are set | None | Not assessed | — | — |
| QV-11 | Conditional: billing or inventory integrations are scoped | Webhook ordering and repeat tests proposed in the specification | Not assessed | R | — |
| QV-12 | Required | Brakeman (never run here); isolation reproduction (C3) | Partial | C3, R | FB-02, FB-03 |
| QV-13 | Required | Factories (`spree/core/lib/spree/testing_support/factories`), sample data, storefront end-to-end seed script. Shared API test helpers fix the store, so they cannot show isolation | Partial | A, C3 | FB-03 |
| QV-14 | Required | Per-engine test app (`rake test_app`); CI service containers; cloud has PostgreSQL 16 installed but no Docker daemon | Partial | R, G | FB-03, FB-06 |
| QV-15 | Conditional: a change needs human judgment | Upstream QA environment flow (`.claude/commands/implement-plan.md`) | Not assessed | R | — |
| QV-16 | Required | Evidence codes in this baseline; reproduction output kept privately; no agreed location for verification records | Partial | R | FB-02 |
| QV-17 | Required | No required checks on either `main` | Gap | G | FB-02 |
| QV-18 | Required | Upstream practices (deterministic OpenAPI generation); no flake tracking | Not assessed | R | — |
| QV-19 | Required | Upstream test layers; a Liquorify isolation layer proposed in the specification | Partial | R | FB-03 |
| QV-20 | Required | Storefront end-to-end tests against the upstream Spree image; in CI the job fails at its Stripe configuration check, so the browser tests have not run; dashboard end-to-end tests | Partial | R, G | FB-06 |
| QV-21 | Required | Brakeman and the weekly dependency audit (Configured, never run here); no dynamic testing | Partial | R, G | FB-02 |

### SP

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| SP-01 | Required | Protected risk class proposed in LIQ-001 §4; upstream security rules in `CLAUDE.md` | Partial | R | D1 |
| SP-02 | Required | No Liquorify security design; option A safeguards proposed in the specification | Decision | R | FB-03 |
| SP-03 | Required | Rails conventions, CanCanCan, permitted parameters, API rate limits (`spree/api/lib/spree/api/configuration.rb`); all Configured | Partial | R | — |
| SP-04 | Required before protected implementation | None | Gap | — | With FB-03's results |
| SP-05 | Required | Separate shopper and staff account types; JWT, publishable and secret API keys, OAuth for MCP; no operator identity | Partial | A | After the specification is accepted |
| SP-06 | Required | JWT and refresh tokens; shopper tokens name no store; a shopper signs in at another store | Gap | A, C3 | FB-03 |
| SP-07 | Required | Per-store roles; naming a store without a role is refused (Verified, orders endpoint); the admin role reaches every store's shoppers | Partial | A, C3 | FB-03 |
| SP-08 | Required | Shopper and staff are separate models and tokens; no platform operator role; console proposed | Partial | A | After the specification is accepted |
| SP-09 | Required | Store-owned records, server-side store choice, store-scoped cache keys, jobs in store context, development-only scope guard. 6 of 9 isolation checks fail | Gap | A, C3 | FB-03 |
| SP-10 | Required | Spree data export and deletion requests; usage data sent to `spreecloud.io` by default; no privacy policy or data classification | Gap | R, U | FB-09 |
| SP-11 | Required | Encryption of secret preferences when keys are set (`secret_preferences.rb`), Configured | Partial | A | — |
| SP-12 | Required | `.env` files ignored in both repositories; examples hold names only; storefront CI requires a Stripe test secret and variable, which were unavailable to its runs; no secret store | Partial | R, M | FB-16 |
| SP-13 | Required | Dependabot (storefront Operating, backend Configured); audit workflow and bundler-audit not run | Partial | G, R | FB-11 |
| SP-14 | Required | `SECURITY.md` routes reports to Spree; no Liquorify triage | Gap | R | FB-07 |
| SP-15 | Conditional: hosting is decided | None | Not assessed | — | — |
| SP-16 | Conditional: before the first hosted environment | Logging of support access proposed in the specification | Not assessed | R | — |
| SP-17 | Conditional: before real merchant data | None | Not assessed | — | — |
| SP-18 | Required | Exception rules drafted in SES-001 §6; none recorded | Partial | R | D1 |
| SP-19 | Required | Staff invitations and per-store roles; one GitHub account; no access review | Partial | A, G | — |
| SP-20 | Required | Release-age and trust policy for npm packages; storefront and the backend audit workflow pin actions by commit, other backend workflows use version tags and one uses `@main`, despite a Dependabot comment saying all are pinned | Partial | R | FB-02 |

### PI

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| PI-01 | Conditional: hosting is decided | None | Not assessed | — | FB-16 |
| PI-02 | Conditional: hosting is decided | None | Not assessed | — | FB-16 |
| PI-03 | Conditional: hosting is decided | None | Not assessed | — | — |
| PI-04 | Conditional: merchant domains are scoped | Core returns the plain store address; custom domains are an Enterprise feature | Not assessed | A, U | — |
| PI-05 | Conditional: hosting is decided | Active Storage for images; storage isolation not reviewed | Not assessed | A | — |
| PI-06 | Conditional: hosting is decided | None | Not assessed | — | FB-16 |
| PI-07 | Required | Ruby and Node versions declared differently across files, CI and environments (§1) | Partial | R, C1, C2, M | FB-04 |
| PI-08 | Conditional: hosting is decided | None | Not assessed | — | — |
| PI-09 | Required (development) | Docker path (Mac) and native worktree path; cloud containers; no test, staging or production environment; destructive commands identified (§2) | Partial | R, M, A | FB-04 |
| PI-10 | Required | Environment variables and Spree preferences; storefront identity and Stripe key come from environment variables | Partial | R, A | — |
| PI-11 | Required | GitHub-hosted runners; storefront Operating, with its end-to-end job failing at its configuration check; backend has no registered workflows | Partial | G | FB-02 |
| PI-12 | Conditional: hosting is decided | None | Not assessed | — | — |
| PI-13 | Not required | — | Not applicable: no measured demand | — | — |
| PI-14 | Required | Spree CLI, worktree scripts, test wrappers (`scripts/test/`), Lefthook and agent hooks; all assume upstream repositories | Partial | R | FB-04, FB-05 |
| PI-15 | Conditional: hosting is decided | Storefront `Dockerfile` (Node 22); upstream Spree images | Not assessed | R | — |
| PI-16 | Not required | — | Not applicable: no orchestration need | — | — |
| PI-17 | Not required | — | Not applicable: no shared service hosting need | — | — |
| PI-18 | Not required | — | Not applicable: no separate services | — | — |
| PI-19 | Conditional: the first hosted environment | GitHub Actions secrets in the storefront | Not assessed | R | FB-16 |

### RO

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| RO-01 | Conditional: the first hosted environment | OpenTelemetry gem and storefront Sentry; nothing operating | Not assessed | R | FB-16 |
| RO-02 | Conditional: the first hosted environment | Rails logs; Sentry personal-data switches | Not assessed | R | — |
| RO-03 | Conditional: the first hosted environment | None | Not assessed | — | — |
| RO-04 | Conditional: tracing across services is needed | OpenTelemetry gem | Not assessed | R | — |
| RO-05 | Conditional: the first hosted environment | None | Not assessed | — | — |
| RO-06 | Conditional: before real merchants | None | Not assessed | — | — |
| RO-07 | Not required | — | Not applicable: no operating demand | — | — |
| RO-08 | Conditional: before real merchants | None | Not assessed | — | — |
| RO-09 | Conditional: before real merchants | None | Not assessed | — | — |
| RO-10 | Conditional: the first hosted environment | None | Not assessed | — | — |
| RO-11 | Conditional: before real merchant data | None | Not assessed | — | FB-16 |
| RO-12 | Not required | — | Not applicable: no critical workload | — | — |
| RO-13 | Conditional: after the first material incident | None | Not assessed | — | — |
| RO-14 | Conditional: before real merchant data | None. Development scripts can delete local databases | Not assessed | R | FB-16 |
| RO-15 | Conditional: before real merchant data | None | Not assessed | — | — |
| RO-16 | Not required | — | Not applicable: no continuity obligation yet | — | — |
| RO-17 | Conditional: first release | None | Not assessed | — | — |
| RO-18 | Conditional: the first hosted environment | None | Not assessed | — | — |
| RO-19 | Conditional: spending begins (hosting, or CI minutes if the backend goes private) | None | Not assessed | G | D7 |

### GG

| ID | Applicability | Current mechanism and location | Finding | Evidence | Next |
|---|---|---|---|---|---|
| GG-01 | Required | SES-001 2.0-draft in `liquorify/framework/`; not adopted | Decision | R | D1 |
| GG-02 | Required | ENG-001 1.0-draft and the LIQ-001 proposals | Decision | R | D1 to D3 |
| GG-03 | Required | ENG-002 1.0-draft; `liquorify/` home and index created in this change (Configured) | Partial | R | D4, D5 |
| GG-04 | Required | Upstream plan constraints for Spree code; nothing for Liquorify | Decision | R | D4 |
| GG-05 | Required | Upstream `decisions.md` for Spree; Liquorify decisions sit in the specification and project threads | Gap | R | D5, M3 |
| GG-06 | Required | ENG-002 §5 lifecycle, drafted | Decision | R | D1 |
| GG-07 | Required | Roles proposed in LIQ-001 §1 and §2; no ownership file | Decision | R | D2 |
| GG-08 | Required | `liquorify/README.md` index, including records held outside the repositories | Partial | R | — |
| GG-09 | Required | Debt and gaps listed in LIQ-004; no tracker | Partial | R | FB-10 |
| GG-10 | Conditional: Liquorify retires something | Upstream deprecation rules in `CLAUDE.md` | Not assessed | R | — |
| GG-11 | Required | Exception rules drafted in SES-001 §6; none recorded | Partial | R | D1 |
| GG-12 | Conditional: after the first release | None | Not assessed | — | — |
| GG-13 | Required | Project instructions and LIQ-001 §3 (proposal); tracked `.claude/settings.local.json` allows any shell command; agent hooks gate commits | Gap | R | FB-08 |
| GG-14 | Required | Monorepo layout table in `CLAUDE.md`; `server/` must not hold Liquorify code; code homes proposed in the specification | Decision | R | FB-05 |
| GG-15 | Required | ENG-002 metadata applied to `liquorify/` only (Configured); upstream documents keep their conventions | Partial | R | D4 |
| GG-16 | Required | Upstream standards in `CLAUDE.md`, used in practice but not adopted by decision; a default baseline is proposed in LIQ-001 §6 | Partial | R | D1 |
| GG-17 | Required | Upstream coding rules in both `CLAUDE.md` files; Biome (Verified); Lefthook pre-commit hooks; Ruby style not gated: RuboCop is a dependency, but no configuration is tracked and nothing runs it | Partial | C1, C2, R | D1 |
| GG-18 | Required | API v3 conventions in backend `CLAUDE.md` | Partial | R | D1 |
| GG-19 | Required | Model and migration rules in backend `CLAUDE.md`; the store-ownership rule is not met by shopper accounts | Partial | R, C3 | FB-03 |
| GG-20 | Required | Security sections of backend `CLAUDE.md`; nothing Liquorify-specific | Partial | R | — |
| GG-21 | Required | Storefront dependency rules (`CLAUDE.md`); backend Dependabot notes; pnpm supply-chain settings | Partial | R | FB-11 |
| GG-22 | Required | LIQ-001 §4 (proposal); upstream rule that each dashboard behaviour change ships an end-to-end test | Decision | R | D1 |
| GG-23 | Conditional: first release | Standing instruction: no merge or deploy without the owner's instruction | Partial | R | — |

## 4. Controls at a glance

| State | Controls |
|---|---|
| Verified | Storefront lint, types, unit tests and locale parity (C1); backend TypeScript lint, types and unit tests (C2); frozen lockfile installs (C1, C2); staff refused for a store where they hold no role, on one endpoint (C3) |
| Operating | Storefront lint, type check and unit test jobs, and Dependabot, on pull requests (G) |
| Configured, not verified here | Storefront end-to-end workflow (job FAIL on missing Stripe configuration; browser tests NOT_RUN); backend Ruby suites on PostgreSQL and MySQL, Brakeman, dashboard end-to-end, SDK integration and drift checks; weekly dependency audit; backend Dependabot; Lefthook and agent hooks; API rate limits; encryption of secret preferences; development-only store-scope guard |
| Planned (proposals) | Effect-based risk classes and proportionate review (LIQ-001 §4), delegation (LIQ-001 §3), isolation test suite and option A safeguards (specification), branch protection and CI baseline (FB-02) |
| Missing | Branch protection; Liquorify security contact; shopper isolation (failing); accessibility and visual checks; cross-repository compatibility check; work tracking in the backend; any staging or production environment, backups, monitoring or runbooks |
