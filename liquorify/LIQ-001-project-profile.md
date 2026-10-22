---
document_id: LIQ-001
title: Liquorify Project Profile
version: 0.3-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-22
applies: SES-001 2.0-draft, ENG-001 1.0-draft, ENG-002 1.0-draft
---

# Liquorify Project Profile

This profile applies the framework in [`framework/`](framework/) to Liquorify. It holds the Liquorify-specific facts, the proposed responsibilities and delegation, the review expectations, the Spree engineering baseline and its exceptions, and the decisions that adopt the foundation. The framework documents stay generic; Liquorify meaning lives here.

Every statement is marked as one of:

- **Fact:** observed or verified. The evidence is in [LIQ-003](LIQ-003-engineering-baseline.md).
- **Recorded instruction:** given by the project owner, with its date.
- **Proposal:** recommended and not decided.

## 1. Profile

This follows the table in [ENG-001 §1](framework/ENG-001-engineering-charter.md#1-project-profile).

| Item | Liquorify | Kind |
|---|---|---|
| Product and charter scope | Liquorify is a multi-tenant software platform for independent liquor merchants, built on Spree Commerce. The charter covers Liquorify-owned work in the two repositories below, and upstream Spree code only where Liquorify changes it or relies on it. | Product goal: recorded instruction. Charter scope: proposal |
| Repositories | `liquorify` (public): backend, admin dashboard, shared packages, and this documentation home. `liquorify-storefront` (public since 2026-10-21; private before): customer storefront. They are independent Git repositories, even when the storefront is cloned inside the backend folder on a developer's machine. | Fact |
| Revisions assessed | Backend `394b53f`: Spree 6.0.0.rc4, unchanged from upstream. Storefront `c19c466`: the upstream Spree storefront, unchanged. | Fact |
| Accountable engineering owner | Dhruval (`@pateldhruval872`) | Proposal |
| Product decision-maker | Dhruval | Proposal |
| Technical, security and quality reviewers | Dhruval. No independent human reviewer is available. Legal, tax and payment-processor review is external and not yet engaged. | Assignment: proposal. Limitation: fact |
| Release and operational owners | Dhruval. Nothing is released or operated yet: there is no staging or production environment and no hosting decision. | Proposal |
| Stack, environments and delivery workflow | [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence) | Fact |
| Delegated actions | §3 | Proposal |
| Adoption decision | D1, 2026-10-21: the framework is the working process for Liquorify-owned work, with this profile's exceptions. D2 to D8 are open (§7) | Recorded instruction |

### Recorded instructions that shape engineering work

- **Commerce posture (project goal).** Liquorify's intended posture is Technology Provider (non-MoR), with each merchant as legal seller and Merchant of Record. Merchants keep their licensing and merchant-compliance responsibilities. The non-MoR posture does not by itself decide or remove Liquorify's jurisdiction-specific tax, marketplace-facilitator, processor or other provider obligations. Final allocation follows applicable law, contracts, the implemented commerce flow and qualified review.
- **Spree is the foundation, not the requirement list.** Spree features become Liquorify requirements only when confirmed. Visible branding is Liquorify; internal Spree names stay unless a concrete requirement needs a change.
- **2026-10-20:** each shopper has a separate account with each merchant.
- **2026-10-20:** option A (one shared installation, a Spree store per merchant, plus a Liquorify layer) is the direction for technical validation only. It does not approve the merchant lifecycle specification or authorize implementation.
- **2026-10-20:** expected-failure tests are not proof of tenant isolation.
- **2026-10-21:** payment-role statements follow the commerce posture above. The legal seller or Merchant of Record is never inferred solely from how Stripe routes charges or how an account is configured.
- **2026-10-21 (correction to these drafts):** risk is classed by effects, and verification fits the change. §4 reflects this.
- **2026-10-21 (decision D1):** SES-001, ENG-001 and ENG-002 are the working process for Liquorify-owned work, with this profile's exceptions. Unresolved product and architecture decisions stay proposed. Adopting conventions does not mark any capability satisfied. What this settles is in §7.
- **2026-10-21 (design tools):** Figma, Storybook and Chromatic are the selected design system tools. The FB-18 decision record sets how Liquorify uses them. Setting them up (accounts, dependencies, CI and credentials) is separate Protected work. Chromatic was replaced by Playwright later the same day (visual regression tool, below).
- **2026-10-21 (FB-02 authorization):** the documentation and CI-file changes for FB-02 are authorized, and its pull request is opened for review. Merging and repository-setting changes wait for a final approval. MySQL checks stay advisory until Liquorify decides whether it supports MySQL. The storefront end-to-end result stays as recorded until configuration and a rerun establish a new one.
- **2026-10-21 (storefront visibility):** `liquorify-storefront` stays public. It became public on 2026-10-21, and the owner chose to keep it public once that was found ([record](verification/2026-10-21-fb-02-merge-push-and-protection.md#enforcement)). While it is public, GitHub Free enforces its branch rules.
- **2026-10-21 (FB-02 protection check):** branch protection is not tested by pushing directly to `main`, because such a push could land if enforcement were unavailable. An unproven refusal is recorded as unverified.
- **2026-10-21 (baseline first):** the existing Spree product baseline is completed first, across the pinned revisions of both repositories; Liquorify-specific product work comes afterward. The baseline covers every existing product area and surface, including features whose later disposition is "not needed", with Enterprise and documentation-only features identified separately. It includes a screen inventory, a component and token inventory, and work items for reproducing the existing design systems, screens, wireframes and flows in Figma and documenting the existing components in Storybook with Chromatic baselines. Spree baselining activates that work (FB-19 to FB-21); it does not wait for a Liquorify component or Liquorify branding. Liquorify branding, merchant onboarding, the merchant subscription and the platform Admin Console stay deferred, and LIQ-007 stays PROPOSED while the owner reviews the revised scope.
- **2026-10-21 (reproduction start):** the existing Spree baseline reproduction proceeds. FB-18's completion is verified first and its gaps recorded; FB-19 is then implemented through manageable pull requests, and FB-20's token preparation runs alongside it. Figma components follow the component states FB-19 records. Three LIQ-007 questions are decided for this work (Q4, Q5 and Q7, in [LIQ-007 §7](LIQ-007-design-system-adoption-and-extension.md#decided-on-2026-10-21)): one Figma Professional Full seat, reusing a suitable existing seat if there is one, with Code Connect deferred and the exact billing choice shown before any purchase; Chromatic's free plan, advisory only, with snapshots budgeted across both Storybooks, the full coverage requirement kept, and any paid upgrade a separate decision; and Storybook coverage of every existing component in LIQ-009, with mocked data and providers where needed and unsupported cases recorded. The other LIQ-007 decisions stay PROPOSED. Spree's existing appearance and behaviour are preserved; Liquorify branding and features stay deferred. Q5 was superseded later the same day (visual regression tool, below).
- **2026-10-21 (architecture first):** the design system implementation architecture is made explicit before FB-19 and FB-20 grow: the existing component layers and package boundaries, how stories, providers and mocks are organized, the CSS-to-Figma token mapping, traceability to the inventory IDs, and the update and verification workflow ([LIQ-010](LIQ-010-design-system-reproduction-architecture.md)). Spree's existing architecture is kept apart from the proposed tooling. The approach is validated with a small batch from both design systems before coverage grows, and external-tool blockers are recorded separately.
- **2026-10-21 (visual regression tool):** Playwright replaces Chromatic for visual regression testing, superseding the Chromatic selection and Q5 (LIQ-007 Q10). Storybook, Figma and the full coverage of the existing Spree components stay. Playwright compares screenshots against the built Storybooks, in a consistent browser environment with deterministic sample data. Reference images are kept under version control, and comparison reports and failure images are published as CI artifacts with an appropriate retention. An intentional change to a reference image needs review in its pull request; CI never approves a changed screenshot automatically. The visual checks stay advisory at first. The Chromatic account action OA-4 is superseded, with the decision history kept. The architecture work continues, a representative batch from both design systems is verified before coverage grows, unrelated decisions stay proposed, and Liquorify-specific features stay deferred.
- **2026-10-21 (FB-19 pilot acceptance):** the owner merged the FB-19 pilot in both repositories and accepted it within the scope its records describe ([record](verification/2026-10-21-fb-19-pilot-merge-and-acceptance.md)). Three gaps stay open: the 35 stories checked against their source only, the cart drawer opened with a pointer, and the storefront's end-to-end job, which needs the Stripe test keys (OA-1). The acceptance does not complete FB-19 or the existing Spree baseline. Work proceeds toward the full baseline across both repositories in product-area batches built from the existing capability, screen and component inventories, with screens, workflows, permissions, meaningful states and verification evidence progressing alongside component coverage. Liquorify-specific extensions stay deferred. How acceptance is recorded in document status fields is still D5.
- **2026-10-22 (product-area batches):** the staff access and dashboard shell batch proceeds in two pull requests, and the storefront's shopper accounts baseline may run alongside it in its own. The batch's proposal, its 11 acceptance criteria and the exact LIQ-010 §12.1 amendment are included for review. The batch process links capabilities, screens, workflows, permissions, meaningful states and components to their inventory IDs and verification evidence. What the interface shows each role stays distinct from verified backend authorization and from tenant isolation. The screenshot, fidelity and review requirements stay, and unresolved gaps stay explicit. Existing Spree behaviour is reproduced; Liquorify-specific features stay deferred, and Figma waits for its setup ([work item](work-items/fb-19-batch-staff-access-and-shell.md)).
- **2026-10-20:** the three framework documents are authorized draft inputs. Nothing else from the Liquorify-Company workspace, and no earlier product decision, is imported.
- **Standing:** do not merge or deploy without an explicit instruction. Treat the owner's Mac as read-only unless told otherwise.

## 2. Responsibilities

Proposal: Dhruval holds all six roles in [ENG-001 §2](framework/ENG-001-engineering-charter.md#2-responsibility-and-delegation) (product owner, engineering owner, implementer, reviewer, release owner, operational owner), with automation acting as an implementer within delegated scope.

Consequences to keep visible:

- **Review is not independent.** The person who asks for a change also reviews it. Review by an AI agent is automated review and is labeled as such; it is not independent human review ([SES-001 §5.7](framework/SES-001.md#57-automation-and-ai)).
- **No specialist security review is available.** Protected changes (§4) carry targeted verification and written failure analysis, with the missing specialist review recorded as a limitation. These checks do not replace qualified review where it is required. An external security review before the first real merchant goes live is recommended, not decided.
- **GitHub cannot require a second approver** while only one person has access, so required status checks and pull-request-only merges are the controls that can actually be enforced ([ENG-001 §6](framework/ENG-001-engineering-charter.md#6-source-review-and-continuous-integration)).

## 3. Delegation

Proposal. Automation, such as a Claude session, and any future contributor may do the following without asking again:

- Read both repositories, and read the owner's approved Mac folder without changing it.
- Create branches, write documentation and tests, and open pull requests.
- Push fixes to pull requests they opened.
- Run non-destructive checks (lint, type checks, unit, integration and browser tests) in cloud environments.

These need the owner's explicit authorization for the specific scope:

- Merging, releasing or deploying anything.
- Changing application code before a work item authorizes it; changing dependencies, CI configuration, repository settings, infrastructure or credentials.
- Anything on the owner's Mac beyond reading, and any setup, reset or teardown script where data matters.
- Contacting outside parties (Spree, Stripe or other vendors).
- Publishing a reproduction or exploit-level detail of an unfixed security defect in the public repository.
- Accepting a specification, a validation result or a security risk.

Carrying out an action never grants authority to approve it. Note that the backend's tracked `.claude/settings.local.json` gives agents blanket shell permission; that is upstream's local setup, not this delegation ([LIQ-004 FB-08](LIQ-004-foundation-backlog.md)).

## 4. Review and verification expectations

In use under D1 (2026-10-21), with the risk classes in [ENG-001 §4](framework/ENG-001-engineering-charter.md#4-work-items-and-risk). A change is classed by its effects, not by its file type or size. A documentation or policy change is not automatically Low: a change to a rule, a role, the delegation, an acceptance condition, security reporting or agent instructions changes a control and is classed by that effect.

| Risk | Liquorify examples | Minimum before merge |
|---|---|---|
| Low | Editorial documentation, copy or comment changes with no material behavior, policy or control effect | Owner review and relevant inspection; check links and metadata where affected |
| Standard | Catalog, dashboard screens, storefront pages, reports | Acceptance criteria in the work item; relevant automated checks pass on the final commit; owner review |
| Protected | Tenant isolation, shopper and staff accounts, authorization, API keys, payments, subscription billing, tax, consequential migrations, secrets, CI and repository settings, agent permissions, and policy changes with equivalent effects | Acceptance criteria and relevant checks on the final candidate; written failure and recovery analysis; affected-domain review with limitations stated; explicit owner approval. Verify permitted and denied cases for access changes, include same-store controls for cross-store refusals, and run PostgreSQL when database behavior is affected. Verify CI and repository settings through their own relevant controls. |

Evidence follows [SES-001 §5.3](framework/SES-001.md#53-verification-and-evidence): the claim, exact revision, environment, procedure, result (PASS, FAIL, BLOCKED or NOT_RUN), date and limitation. A skipped, pending or expected-to-fail test is never evidence of isolation.

A change that needs both repositories names its companion pull request and the backend revision the storefront was checked against.

## 5. Environments

Facts; details and evidence are in [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence).

- **Cloud sessions** run in fresh containers. They cannot reach services on the owner's Mac, and their evidence names the container's own tools.
- **The owner's Mac** uses the Docker development path (PostgreSQL 18 and Mailpit in Docker Compose) with an untracked `server/` folder cloned from upstream `spree-starter`. Its Git remotes are still named `liquor` and `liquor-storefront`.
- **No staging or production environment exists.**

Both repositories are public: `liquorify` from the start and `liquorify-storefront` since 2026-10-21 (§1). Everything in either is public, so credentials, personal data, machine paths and the isolation reproduction stay out of both.

## 6. Spree engineering baseline and exceptions

Liquorify reuses Spree's engineering foundation through the framework and extends it only where Liquorify needs more. Both repositories carry upstream Spree's instructions (`CLAUDE.md`, `.github/CONTRIBUTING.md`, agent commands); this section names which of them are Liquorify's default engineering baseline, and the exceptions. Decision D1 (2026-10-21) put the baseline in §6.2 and the exceptions in §6.3 into effect for Liquorify-owned work, except the parts that wait on an open product or architecture decision, which each subsection names. The reuse mapping in §6.1 stays a proposal. Each mechanism, with its capabilities, evidence and next action, is in [LIQ-005](LIQ-005-spree-engineering-adoption.md). Section links below point to the backend [`CLAUDE.md`](../CLAUDE.md); storefront rules are in that repository's own `CLAUDE.md`.

**Adopting a convention is not verifying an implementation.** Adopting a rule means Liquorify work must follow it and reviews check it. It does not show that Spree's code meets the rule, and it marks no capability in LIQ-003 satisfied. Each mechanism keeps its own state and finding there and in LIQ-005, including the failing and unverified ones.

### 6.1 Spree mechanisms mapped to the SES

This is a project-specific reuse proposal based on the existing inventory and baseline, not a second capability catalog or an adoption decision. These dispositions describe mechanisms: **reuse as-is**, **adapt**, **replace**, or **investigate**. They do not mean a capability is satisfied. Existing repository instructions continue to govern their current scope until an explicit decision changes them.

| SES area | Existing source or mechanism | Proposed disposition | Evidence, limitation and next action |
|---|---|---|---|
| PD-01 to PD-06: direction, discovery and requirements | Liquorify project goal and proposed merchant lifecycle; Spree commerce behavior as a reference | Adapt | Retain suitable commerce behavior after checking it against Liquorify requirements. Product direction, first-release scope and unmet requirements remain Liquorify decisions; available framework features are not requirements by themselves. |
| PD-07 to PD-12 and PD-19: information architecture, interactions, visual/content design, accessibility, prototyping and UX | Existing dashboard navigation, forms, sign-in, setup and Getting Started; storefront routes and components | Adapt | Preserve suitable flows and patterns. Define merchant onboarding, billing, operational states and the operator experience for their distinct users. Existing screens are not evidence that new experiences have been designed or evaluated. |
| PD-13: design system | `packages/dashboard-ui`, `packages/dashboard-core` and their component rules; the storefront's separate component system | Reuse as-is where suitable; adapt through documented extensions | Retain the dashboard's headless components and extension boundaries. The storefront uses a separate component system; shared branding or tokens are a design decision, not assumed. See LIQ-003 §2 and FB-14. Figma and Storybook are the selected tools, with Playwright screenshot comparisons as the visual check (2026-10-21; Playwright replaced Chromatic the same day, LIQ-007 Q10). [LIQ-007](LIQ-007-design-system-adoption-and-extension.md) (PROPOSED) proposes how both systems are adopted and extended and how the tools are used; the Spree features behind these screens are in [LIQ-006](LIQ-006-product-capability-baseline.md). |
| PD-14 to PD-18: analytics, experimentation, product practice, knowledge and roadmapping | Existing reporting and optional analytics hooks; Liquorify's proposed specification and backlog | Investigate when activated | Define product outcomes, privacy expectations and learning needs before selecting additional tracking or experiments. Keep current product decisions and evidence findable; defer inactive practices without claiming them implemented. |
| AE and AR: application and contract structure | Rails engines and workflows; API conventions, generated OpenAPI, SDKs; dashboard plugins and slots | Reuse as-is where compatible; adapt Liquorify boundaries | Code reading establishes the available patterns. Business ownership, shopper ownership and operator separation require design and validation. SDK compatibility and extension sufficiency remain open under FB-03, FB-05 and FB-06. |
| AR-08, AR-09, AE-08 and GG-19: data ownership and database conventions | Store-owned records and existing model/migration rules | Adapt | Retain conventions compatible with required integrity and isolation. Investigate constraints and schema choices against Liquorify's data requirements rather than adopting every existing database choice automatically. Open isolation findings remain failures. |
| DR and QV: dependencies, builds and verification | Lockfiles, package scripts, Ruby/TypeScript tests, browser tests and Actions workflows | Reuse existing checks; adapt their scope and configuration | Recorded TypeScript checks are evidence only for their tested revisions. Backend Ruby CI passed once, on the FB-02 pull request, and is evidence only for that revision (LIQ-003 V2). Storefront E2E failed before tests started because configuration was missing; configure and rerun before claiming a pass (FB-02, FB-06). |
| SP: identity, authorization, isolation and secrets | Existing staff roles, customer authentication, store selection and encrypted preferences | Adapt and investigate | Preserve useful mechanisms and verify actual control behavior. ISO-1 to ISO-7 remain open; no adoption decision makes them satisfied. Financial-role statements retain the qualified posture in §1. |
| PI and GG-13: development tooling and agent behavior | Setup scripts, generated host application, repository instructions and agent commands | Adapt; replace upstream-specific targets where necessary | Verify a reproducible tracked-source path and explicit delegation. Commands targeting upstream repositories and blanket local permissions need review (FB-04, FB-05, FB-08). |
| DR and RO: release and operations | Inherited publishing workflows; proposed Liquorify hosting and operating arrangements | Replace upstream publishing behavior; investigate Liquorify operation | Publication, production topology, recovery and monitoring need Liquorify-specific decisions and evidence. Do not adopt inherited upstream publishing as a Liquorify release procedure (FB-02, FB-16). |

Detailed product and design work proceeds with the next bounded feature. This mapping does not require every PD capability or all 172 engineering capabilities to be fully developed before implementation can begin.

### 6.2 Default baseline

§6.1 gives the disposition for each capability area. This table names the written rules that are Liquorify's default for each engineering area, in effect for Liquorify-owned work since D1.

These adaptations stay proposals, because each depends on an open decision: Liquorify code in a tracked engine and dashboard plugin (X8, FB-05); shopper tokens and store ownership of shopper accounts (X7, FB-03); foreign keys on Liquorify-owned tables (FB-03); the storefront taking the backend's release-age and trust settings, and the triage owner (FB-11); the development path (FB-04); the storefront's components (FB-14); and Liquorify's release practice.

| Area | Adopt as the default | Liquorify adaptation |
|---|---|---|
| Coding conventions | Backend [General rules](../CLAUDE.md#general-rules), [Git Policy](../CLAUDE.md#git-policy), [Architecture Principles](../CLAUDE.md#architecture-principles) and [Code Organization](../CLAUDE.md#code-organization); Biome in both repositories; the storefront rules for React, Next.js, state, TypeScript and code style | Liquorify's own Ruby code uses its own namespace. Automation may use the branch name its session is given. Storefront code examples are illustrative, and the code wins where they differ (LIQ-005 SA-02, SA-05, SA-06) |
| Application structure | [Monorepo Structure](../CLAUDE.md#monorepo-structure); the extension points (provider gems, [Dependencies System](../CLAUDE.md#dependencies-system), extension-permitted attributes, dashboard plugins and slots); statuses and workflows; jobs in their store; [Events System](../CLAUDE.md#events-system); [Emails](../CLAUDE.md#emails-liquid--mjml) | Liquorify code lives in a tracked Liquorify engine and dashboard plugin (X8). Liquorify plans and records live in `liquorify/` (X1 to X3) |
| APIs | [API Controllers](../CLAUDE.md#api-controllers), [Prefixed IDs](../CLAUDE.md#prefixed-ids), [Typed values](../CLAUDE.md#typed-values-api_type-never-the-ruby-class-name), [Serializers](../CLAUDE.md#serializers-alba), [API Authentication](../CLAUDE.md#api-authentication), [Type Generation Pipeline](../CLAUDE.md#type-generation-pipeline) and generated OpenAPI ([Documentation](../CLAUDE.md#documentation)) | A shopper's token is tied to the merchant it was issued for (X7) |
| Database practices | [Models](../CLAUDE.md#models), [Migrations](../CLAUDE.md#migrations), [Money](../CLAUDE.md#money), [Time zones](../CLAUDE.md#time-zones), [I18n](../CLAUDE.md#i18n) | Store ownership extends to shopper accounts (X7). PostgreSQL is the database for verification evidence (X12). Whether Liquorify-owned tables use foreign keys is decided with FB-03 |
| Design system | The dashboard rules in [@spree/dashboard](../CLAUDE.md#spreedashboard--admin-ui-react-spa) and `@spree/dashboard-ui`, for the dashboard and seller panel | The storefront keeps its own components until FB-14 decides |
| Dependencies | Backend Dependabot, the pnpm supply-chain settings and the weekly audit; the storefront's Dependency Security rules | The storefront also takes the backend's release-age and trust settings, and a triage owner and cadence are named (FB-11) |
| Development tooling | The test wrappers in `scripts/test/`; Lefthook; the agent hooks in `.claude/settings.json` | One development path is chosen and verified (FB-04). The tracked agent permissions and the upstream plan commands are not adopted (X4) |
| Builds | Turbo, tsup and Vite; the storefront's `next build` and `Dockerfile` | No gems or npm packages are built for release (X11) |
| Tests | [Testing](../CLAUDE.md#testing), [Backend (Ruby — RSpec)](../CLAUDE.md#backend-ruby--rspec) and [Admin SPA E2E](../CLAUDE.md#admin-spa-e2e-playwright); the storefront's Vitest and Playwright setup | Isolation, identity and authorization changes add permitted and denied tests with same-store controls on PostgreSQL (§4). Storefront end-to-end tests run against `liquorify` (X10). "The full suite is CI's job" holds only after FB-02 (X9) |
| CI | Backend `tests.yml` and `packages.yml`; storefront `ci.yml` | Changed as in FB-02, and actions pinned by commit (SA-47) |
| Security | [Security](../CLAUDE.md#security) and [3rd party APIs](../CLAUDE.md#3rd-party-apis): store-scoped lookups, CanCanCan checks, permitted parameters, encrypted secret preferences, Brakeman | Shopper ownership and same-store controls (X7). A Liquorify security policy replaces Spree's (X5). Whether usage data goes to Spree is decided for each environment (FB-09) |
| Release practices | Spree's deprecation rules and upgrade guides, for Spree code only | Spree's publishing is not adopted and is limited to upstream (X11). Liquorify's release practice follows ENG-001 when the first release is scoped |

The backend sections not named here ([Plans & Architecture Decisions](../CLAUDE.md#plans--architecture-decisions), [Mintlify Documentation](../CLAUDE.md#mintlify-documentation), [Changesets & Versioning](../CLAUDE.md#changesets--versioning) and [Development Server](../CLAUDE.md#development-server-worktrees)) are covered by the exceptions below and by FB-04. Upstream rules keep governing code in Spree's areas. This baseline adds to them for Liquorify-owned work and overrides them only where an exception below says so.

### 6.3 Conflicts and exceptions

These points conflict with the framework or with Liquorify's situation, so they are the exceptions to §6.2. Tenant isolation is X7; code and record placement are X8 and X1 to X3; upstream publishing is X11; agent commands that target upstream repositories are X4.

The resolutions are in effect since D1, approved by the owner on 2026-10-21, with three limits. X7's shopper ownership waits for the option A validation (FB-03), and X8's code placement and host application wait for FB-05; both stay proposals. X5 waits for a security contact (FB-07). Each exception is reviewed when the decision it depends on is made, and all of them after the first release.

| # | Conflict | Resolution |
|---|---|---|
| X1 | Backend `CLAUDE.md` says all feature plans live in `docs/plans/` and never elsewhere. ENG-002 wants one Liquorify home. | `docs/plans/` stays Spree's plan set, and its "constraints on current work" still apply when Liquorify changes Spree code. Liquorify plans and specifications go in this folder (decision D4, decided through D1 on 2026-10-21). |
| X2 | Upstream plans use their own status labels (Draft, In Progress, Implemented, Superseded). ENG-002 uses DRAFT, PROPOSED, ACCEPTED, SUPERSEDED, RETIRED with YAML metadata. | Each convention applies only within its own scope. Upstream plans are not converted. |
| X3 | Backend `CLAUDE.md` says architecture changes are documented in `docs/developer/`, the public Spree documentation site. | Liquorify architecture and decisions are recorded here. `docs/developer/` changes only when Liquorify contributes something back to Spree. |
| X4 | Agent tooling targets upstream. `/project:create-plan` opens Linear issues and `spree/spree` issues, `/project:implement-plan` opens pull requests on `spree/spree`, and both work in `docs/plans/`. The tracked `.claude/settings.local.json` allows any shell command and upstream's own monitoring and documentation tools. | Do not use the upstream plan commands for Liquorify work. Keep the agent hooks. Align agent settings and commands with §3 (FB-08). |
| X5 | `.github/SECURITY.md` sends vulnerability reports to Spree and lists Spree 5.x and 4.10 as supported. `liquorify` is public. | Publish a Liquorify security policy once a contact is decided (FB-07). |
| X6 | `.github/CONTRIBUTING.md` and `CLA.md` describe contributing to Spree under Spree's contributor agreement. | Keep them for upstream contributions. Liquorify's own contribution rules come from ENG-001 and this profile. |
| X7 | Spree's model treats every store in one installation as belonging to one organization: shopper accounts are shared, and an upstream spec expects a store admin to see customers with no tie to their store. SES-001 §5.4 and SP-09 require separation between tenants. | This is the main architectural conflict. Spree's store-scoping rules are adopted (§6.2), but they are not enough on their own: Liquorify extends store ownership to shopper accounts and every shopper-facing surface, and its tests add same-store controls (§4). It is being validated under option A (FB-03); the upstream assertion that encodes the shared behaviour must flip if option A is adopted. |
| X8 | Upstream setup scripts clone upstream `spree/storefront` and `spree/spree-starter`, and `server/` is untracked. Liquorify code must survive re-cloning. | Keep Liquorify code out of `server/`. It lives in a tracked Liquorify engine and dashboard plugin under its own namespace. Point the scripts at Liquorify repositories and decide the tracked host application (FB-05). |
| X9 | Upstream guidance assumes the full Ruby suite runs on CI for every push. On `liquorify`, CI had never run, and the Actions API listed no registered workflows. | Treat backend CI as configured but unverified until FB-02 records a run. FB-02 recorded one on 2026-10-21 (LIQ-003 V2): it verifies that revision only. FB-02 merged the same day, so the suites now run on every pull request, and they passed on the merge push (LIQ-003 V3). |
| X10 | Storefront end-to-end tests run against the published upstream Spree image, not a backend built from `liquorify`. | Verify storefront changes against a recorded `liquorify` revision (FB-06). |
| X11 | Spree's publishing is live in this copy. `release.yml` publishes Spree's gems on a `v*` tag, six jobs in `packages.yml` publish Spree's npm packages on pushes to `main`, `docs-package.yml` publishes Spree's documentation package, and the Changesets configuration names `spree/spree`. | Limit every publishing job to the upstream repository in FB-02, in the same change as any other edit to those files. Liquorify publishes nothing until it adopts a release practice. |
| X12 | Upstream specs default to SQLite locally, and CI also runs every Ruby suite on MySQL. Liquorify's isolation and migration evidence needs PostgreSQL (§4). | PostgreSQL is the database for Liquorify verification evidence. SQLite stays a quick local check. MySQL checks stay advisory until Liquorify decides whether it supports MySQL. |

## 7. Decisions needed to adopt the foundation

D1 and D4 were decided on 2026-10-21, D4 through D1's exceptions X1 to X3. The others are open, and each can be answered separately. FB-02 goes ahead on its own authorization, recorded on 2026-10-21 in §1, so it does not wait for D3 ([LIQ-004](LIQ-004-foundation-backlog.md#recommended-next-work-item)).

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Adopt the framework | Adopt SES-001 2.0-draft, ENG-001 1.0-draft and ENG-002 1.0-draft as written for both repositories; adopt named sections only; or keep them as drafts for now. The Spree baseline in §6.2 can be adopted whole or by area | Adopt as written, scoped to Liquorify-owned work, with this profile's adjustments, the bounded reuse choices in §6.1, and the default baseline and exceptions in §6.2 and §6.3; revisit after the first release | Decided 2026-10-21 as recorded below. §6.1 stays a proposal |
| D2 | Assign roles | Dhruval holds all roles (§2); or name other people for some roles | Dhruval for all, with the limitations in §2 recorded | Open |
| D3 | Delegation | Accept §3 as written, or change the lists | Accept §3 | Open |
| D4 | Documentation home and scope | This folder as the only Liquorify home (X1 to X3); or Liquorify documents inside `docs/` | This folder | Decided 2026-10-21 through D1's exceptions X1 to X3 |
| D5 | What counts as acceptance | A merged pull request that sets `status: ACCEPTED` with `approved_by` and `approved_at`; or any merge; or a separate decision log | The first. A merge alone is not acceptance | Open |
| D6 | Where work items live | Turn on issues in `liquorify` (they are off today); use the storefront repository's issues; or another tracker | Issues in `liquorify`, linked from pull requests in both repositories | Open |
| D7 | Backend repository visibility | Keep `liquorify` public; or make it private | Decide before any Liquorify-specific security work. Public keeps Spree's large CI suite free to run but publishes everything here, including summaries of open defects; private limits CI minutes and, on GitHub Free, removes the branch rules. The storefront's visibility was decided separately on 2026-10-21: it stays public (§1) | Open |
| D8 | Home for the merchant lifecycle specification | Move it into this folder as PROPOSED; or keep it in the project workspace | Move it here after D7, keeping reproduction detail out while the defect is unfixed | Open |

**D1 as recorded.** On 2026-10-21 the owner wrote: "Use SES-001, ENG-001, and ENG-002 as our working process for Liquorify-owned work. Record this scoped adoption with the profile's exceptions. Keep unresolved product and architecture decisions proposed; adopting conventions does not mark capabilities satisfied."

What it settles:

- The three framework documents are the working process for Liquorify-owned work, which is the charter scope in §1. Where Liquorify changes upstream Spree code, both the framework and the upstream rules for that code apply.
- §4 is the working risk classification. The §6.2 baseline is the default for Liquorify-owned work, and the §6.3 exceptions resolve the conflicts, within the limits each subsection names.
- Exceptions X1 to X3 keep Liquorify documentation in this folder, which decides D4 as recommended.

What it leaves open:

- D2, D3 and D5 to D8; the §6.1 reuse mapping; the merchant lifecycle specification and option A; and every adaptation or resolution that §6.2 or §6.3 names as waiting on a decision.
- Status fields. Every document here stays DRAFT, and the framework files keep the status they were supplied with, because how acceptance is recorded is D5.
- Capability findings. Nothing in LIQ-003 becomes Satisfied because a rule was adopted.
