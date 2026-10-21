---
document_id: LIQ-001
title: Liquorify Project Profile
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
applies: SES-001 2.0-draft, ENG-001 1.0-draft, ENG-002 1.0-draft
---

# Liquorify Project Profile

This profile applies the draft framework in [`framework/`](framework/) to Liquorify. It holds the Liquorify-specific facts, the proposed responsibilities and delegation, the review expectations, the conflicts with upstream conventions, and the decisions needed to adopt the foundation. The framework documents stay generic; Liquorify meaning lives here.

Every statement is marked as one of:

- **Fact:** observed or verified. The evidence is in [LIQ-003](LIQ-003-engineering-baseline.md).
- **Recorded instruction:** given by the project owner, with its date.
- **Proposal:** recommended and not decided.

## 1. Profile

This follows the table in [ENG-001 §1](framework/ENG-001-engineering-charter.md#1-project-profile).

| Item | Liquorify | Kind |
|---|---|---|
| Product and charter scope | Liquorify is a multi-tenant software platform for independent liquor merchants, built on Spree Commerce. The charter covers Liquorify-owned work in the two repositories below, and upstream Spree code only where Liquorify changes it or relies on it. | Product goal: recorded instruction. Charter scope: proposal |
| Repositories | `liquorify` (public): backend, admin dashboard, shared packages, and this documentation home. `liquorify-storefront` (private): customer storefront. They are independent Git repositories, even when the storefront is cloned inside the backend folder on a developer's machine. | Fact |
| Revisions assessed | Backend `394b53f`: Spree 6.0.0.rc4, unchanged from upstream. Storefront `c19c466`: the upstream Spree storefront, unchanged. | Fact |
| Accountable engineering owner | Dhruval (`@pateldhruval872`) | Proposal |
| Product decision-maker | Dhruval | Proposal |
| Technical, security and quality reviewers | Dhruval. No independent human reviewer is available. Legal, tax and payment-processor review is external and not yet engaged. | Assignment: proposal. Limitation: fact |
| Release and operational owners | Dhruval. Nothing is released or operated yet: there is no staging or production environment and no hosting decision. | Proposal |
| Stack, environments and delivery workflow | [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence) | Fact |
| Delegated actions | §3 | Proposal |
| Adoption decision | None recorded. §7 lists what is needed. | — |

### Recorded instructions that shape engineering work

- **Commerce posture (project goal).** Liquorify's intended posture is Technology Provider (non-MoR), with each merchant as legal seller and Merchant of Record. Merchants keep their licensing and merchant-compliance responsibilities. The non-MoR posture does not by itself decide or remove Liquorify's jurisdiction-specific tax, marketplace-facilitator, processor or other provider obligations. Final allocation follows applicable law, contracts, the implemented commerce flow and qualified review.
- **Spree is the foundation, not the requirement list.** Spree features become Liquorify requirements only when confirmed. Visible branding is Liquorify; internal Spree names stay unless a concrete requirement needs a change.
- **2026-10-20:** each shopper has a separate account with each merchant.
- **2026-10-20:** option A (one shared installation, a Spree store per merchant, plus a Liquorify layer) is the direction for technical validation only. It does not approve the merchant lifecycle specification or authorize implementation.
- **2026-10-20:** expected-failure tests are not proof of tenant isolation.
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

Proposal, using the risk classes in [ENG-001 §4](framework/ENG-001-engineering-charter.md#4-work-items-and-risk):

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

Because `liquorify` is public and `liquorify-storefront` is private, shared documentation here is public. Private storefront details, credentials, personal data and machine paths stay out of it.

## 6. Conflicts with upstream conventions

Both repositories carry upstream Spree's instructions (`CLAUDE.md`, `.github/CONTRIBUTING.md`, agent commands). They are useful and stay in force for code in Spree's areas. These points conflict with the draft framework or with Liquorify's situation. Each resolution is a proposal.

| # | Conflict | Proposed resolution |
|---|---|---|
| X1 | Backend `CLAUDE.md` says all feature plans live in `docs/plans/` and never elsewhere. ENG-002 wants one Liquorify home. | `docs/plans/` stays Spree's plan set, and its "constraints on current work" still apply when Liquorify changes Spree code. Liquorify plans and specifications go in this folder (decision D4). |
| X2 | Upstream plans use their own status labels (Draft, In Progress, Implemented, Superseded). ENG-002 uses DRAFT, PROPOSED, ACCEPTED, SUPERSEDED, RETIRED with YAML metadata. | Each convention applies only within its own scope. Upstream plans are not converted. |
| X3 | Backend `CLAUDE.md` says architecture changes are documented in `docs/developer/`, the public Spree documentation site. | Liquorify architecture and decisions are recorded here. `docs/developer/` changes only when Liquorify contributes something back to Spree. |
| X4 | Agent tooling targets upstream: `/project:implement-plan` opens pull requests on `spree/spree` and Linear issues, and `.claude/settings.local.json` allows any shell command. | Do not use upstream plan commands for Liquorify work until reviewed; align agent settings with §3 (FB-08). |
| X5 | `.github/SECURITY.md` sends vulnerability reports to Spree and lists Spree 5.x and 4.10 as supported. `liquorify` is public. | Publish a Liquorify security policy once a contact is decided (FB-07). |
| X6 | `.github/CONTRIBUTING.md` and `CLA.md` describe contributing to Spree under Spree's contributor agreement. | Keep them for upstream contributions. Liquorify's own contribution rules come from ENG-001 and this profile. |
| X7 | Spree's model treats every store in one installation as belonging to one organization: shopper accounts are shared, and an upstream spec expects a store admin to see customers with no tie to their store. SES-001 §5.4 and SP-09 require separation between tenants. | This is the main architectural conflict. It is being validated under option A (FB-03); the upstream assertion that encodes the shared behaviour must flip if option A is adopted. |
| X8 | Upstream setup scripts clone upstream `spree/storefront` and `spree/spree-starter`, and `server/` is untracked. Liquorify code must survive re-cloning. | Keep Liquorify code out of `server/`. Point the scripts at Liquorify repositories and decide the tracked host application (FB-05). |
| X9 | Upstream guidance assumes the full Ruby suite runs on CI for every push. On `liquorify`, CI has never run. | Treat backend CI as configured but unverified until FB-02 records a run. |
| X10 | Storefront end-to-end tests run against the published upstream Spree image, not a backend built from `liquorify`. | Verify storefront changes against a recorded `liquorify` revision (FB-06). |

### 6.1 Spree mechanisms mapped to the SES

This is a project-specific reuse proposal based on the existing inventory and baseline, not a second capability catalog or an adoption decision. These dispositions describe mechanisms: **reuse as-is**, **adapt**, **replace**, or **investigate**. They do not mean a capability is satisfied. Existing repository instructions continue to govern their current scope until an explicit decision changes them.

| SES area | Existing source or mechanism | Proposed disposition | Evidence, limitation and next action |
|---|---|---|---|
| PD-01 to PD-06: direction, discovery and requirements | Liquorify project goal and proposed merchant lifecycle; Spree commerce behavior as a reference | Adapt | Retain suitable commerce behavior after checking it against Liquorify requirements. Product direction, first-release scope and unmet requirements remain Liquorify decisions; available framework features are not requirements by themselves. |
| PD-07 to PD-12 and PD-19: information architecture, interactions, visual/content design, accessibility, prototyping and UX | Existing dashboard navigation, forms, sign-in, setup and Getting Started; storefront routes and components | Adapt | Preserve suitable flows and patterns. Define merchant onboarding, billing, operational states and the operator experience for their distinct users. Existing screens are not evidence that new experiences have been designed or evaluated. |
| PD-13: design system | `packages/dashboard-ui`, `packages/dashboard-core` and their component rules; the storefront's separate component system | Reuse as-is where suitable; adapt through documented extensions | Retain the dashboard's headless components and extension boundaries. The storefront uses a separate component system; shared branding or tokens are a design decision, not assumed. See LIQ-003 §2 and FB-14. |
| PD-14 to PD-18: analytics, experimentation, product practice, knowledge and roadmapping | Existing reporting and optional analytics hooks; Liquorify's proposed specification and backlog | Investigate when activated | Define product outcomes, privacy expectations and learning needs before selecting additional tracking or experiments. Keep current product decisions and evidence findable; defer inactive practices without claiming them implemented. |
| AE and AR: application and contract structure | Rails engines and workflows; API conventions, generated OpenAPI, SDKs; dashboard plugins and slots | Reuse as-is where compatible; adapt Liquorify boundaries | Code reading establishes the available patterns. Business ownership, shopper ownership and operator separation require design and validation. SDK compatibility and extension sufficiency remain open under FB-03, FB-05 and FB-06. |
| AR-08, AR-09, AE-08 and GG-19: data ownership and database conventions | Store-owned records and existing model/migration rules | Adapt | Retain conventions compatible with required integrity and isolation. Investigate constraints and schema choices against Liquorify's data requirements rather than adopting every existing database choice automatically. Open isolation findings remain failures. |
| DR and QV: dependencies, builds and verification | Lockfiles, package scripts, Ruby/TypeScript tests, browser tests and Actions workflows | Reuse existing checks; adapt their scope and configuration | Recorded TypeScript checks are evidence only for their tested revisions. Backend Ruby CI remains unverified. Storefront E2E failed before tests started because configuration was missing; configure and rerun before claiming a pass (FB-02, FB-06). |
| SP: identity, authorization, isolation and secrets | Existing staff roles, customer authentication, store selection and encrypted preferences | Adapt and investigate | Preserve useful mechanisms and verify actual control behavior. ISO-1 to ISO-7 remain open; no adoption decision makes them satisfied. Financial-role statements retain the qualified posture in §1. |
| PI and GG-13: development tooling and agent behavior | Setup scripts, generated host application, repository instructions and agent commands | Adapt; replace upstream-specific targets where necessary | Verify a reproducible tracked-source path and explicit delegation. Commands targeting upstream repositories and blanket local permissions need review (FB-04, FB-05, FB-08). |
| DR and RO: release and operations | Inherited publishing workflows; proposed Liquorify hosting and operating arrangements | Replace upstream publishing behavior; investigate Liquorify operation | Publication, production topology, recovery and monitoring need Liquorify-specific decisions and evidence. Do not adopt inherited upstream publishing as a Liquorify release procedure (FB-02, FB-16). |

Detailed product and design work proceeds with the next bounded feature. This mapping does not require every PD capability or all 172 engineering capabilities to be fully developed before implementation can begin.

## 7. Decisions needed to adopt the foundation

None of these is decided. Each can be answered separately; FB-02 needs only D3 and the CI authorization named in [LIQ-004](LIQ-004-foundation-backlog.md#recommended-next-work-item).

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Adopt the framework | Adopt SES-001 2.0-draft, ENG-001 1.0-draft and ENG-002 1.0-draft as written for both repositories; adopt named sections only; or keep them as drafts for now | Adopt as written, scoped to Liquorify-owned work, with this profile's adjustments and the bounded reuse choices in §6.1; revisit after the first release |
| D2 | Assign roles | Dhruval holds all roles (§2); or name other people for some roles | Dhruval for all, with the limitations in §2 recorded |
| D3 | Delegation | Accept §3 as written, or change the lists | Accept §3 |
| D4 | Documentation home and scope | This folder as the only Liquorify home (X1 to X3); or Liquorify documents inside `docs/` | This folder |
| D5 | What counts as acceptance | A merged pull request that sets `status: ACCEPTED` with `approved_by` and `approved_at`; or any merge; or a separate decision log | The first. A merge alone is not acceptance |
| D6 | Where work items live | Turn on issues in `liquorify` (they are off today); use the storefront repository's issues; or another tracker | Issues in `liquorify`, linked from pull requests in both repositories |
| D7 | Backend repository visibility | Keep `liquorify` public; or make it private | Decide before any Liquorify-specific security work. Public keeps Spree's large CI suite free to run but publishes everything here, including summaries of open defects; private limits CI minutes |
| D8 | Home for the merchant lifecycle specification | Move it into this folder as PROPOSED; or keep it in the project workspace | Move it here after D4 and D7, keeping reproduction detail out while the defect is unfixed |
