---
document_id: LIQ-002
title: Documentation Inventory and Migration Plan
version: 0.3-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Documentation Inventory and Migration Plan

This maps the existing documentation in both repositories by purpose, origin, current relevance and authoritative location, and recommends what to do with each group. It was taken at backend `394b53f` and storefront `c19c466` on 2026-10-20.

The backend tracks 774 Markdown and MDX files, almost all from upstream Spree. The storefront tracks 2 Markdown files and 2 environment examples. Files are grouped by purpose rather than listed one by one.

## How to read this

- **Origin:** *Upstream* means copied unchanged from `spree/spree`, `spree/storefront` or `spree/spree-starter`. *Liquorify* means written for this project. *Supplied* means given by the project owner as an input.
- **Relevance to Liquorify:** High, Medium, Low or None, for current and near-term work.
- **Recommendation:** *Retain and reference* (keep as is and link to it), *Update*, *Migrate* (move or copy its substance into the Liquorify home), *Consolidate*, *Archive*, or *Leave alone*.
- **ENG-002 rules** (metadata, index, lifecycle) apply only to the declared Liquorify-owned scope: the `liquorify/` folder and the short Liquorify pointer sections in both repositories' `CLAUDE.md` and `README.md` ([index](README.md#declared-liquorify-owned-documentation-scope)). Upstream documents keep their own conventions.

## Backend repository (`liquorify`)

| Group | Files | Purpose | Origin | Relevance | Recommendation | Authoritative for |
|---|---:|---|---|---|---|---|
| `liquorify/` | 13 | Liquorify engineering home: framework, profile, inventory, baseline, Spree adoption record, backlog, product capability baseline, design system decision record, verification records | Liquorify, plus 3 supplied | High | Retain; the canonical home | Liquorify engineering rules, decisions, baseline and backlog |
| `CLAUDE.md` (and `AGENTS.md`, a link to it) | 1 | Rules for agents and developers: monorepo layout, setup, architecture, API, models, testing, git policy, docs | Upstream, plus a Liquorify pointer added now | High | Retain and reference. Its coding, API and database rules are Liquorify's working standards for Spree code until replaced. The proposed baseline and its exceptions are in LIQ-001 §6, mechanism by mechanism in LIQ-005 | Spree coding, API and database conventions |
| `README.md` | 1 | Spree product overview | Upstream, plus a Liquorify pointer added now | Low | Update when Liquorify branding is defined | Nothing for Liquorify |
| `.github/CONTRIBUTING.md` | 1 | Setup (Docker and native), running tests, TypeScript packages | Upstream | High | Retain and reference. A Liquorify setup guide (FB-04) links to it instead of copying it | Development setup, until FB-04 verifies a Liquorify path |
| `.github/SECURITY.md` | 1 | Vulnerability reporting | Upstream | High, because the repository is public | Update after a contact is decided (FB-07) | Nothing for Liquorify today: it routes reports to Spree |
| `.github/CLA.md`, `signatures/`, `ISSUE_TEMPLATE*`, `CODE_OF_CONDUCT.md` | 5 | Spree's contribution process | Upstream | Low | Leave alone. Not Liquorify's process (issues are turned off on this repository) | Upstream contributions only |
| `.claude/` (commands, agent, hooks, skills, settings) | 21 | Agent commands for Spree plans, pre-commit and formatting hooks, skills, permissions | Upstream | Medium | Update before Liquorify agent use: commands target `spree/spree` and Linear, and tracked local settings allow any shell command (FB-08) | Agent behaviour in this repository |
| `.agents/skills/`, `skills-lock.json` | 28 | Design and animation skills for agents | Upstream | Low | Leave alone | — |
| `docs/plans/` | 119 | Spree 6.x design plans, plan template and decision log (`decisions.md`) | Upstream | High as reference: their constraints apply when changing Spree code | Retain and reference. Do not add Liquorify plans here (LIQ-001 X1, decision D4) | Spree's design decisions |
| `docs/developer/` | 163 | Spree developer guide: core concepts, customization, dashboard plugins and slots, deployment, security, SDKs | Upstream | High for customization, dashboard extension, deployment and security pages | Retain and reference. Liquorify-specific architecture goes in `liquorify/` | Spree developer guidance |
| `docs/developer/multi-tenant/` | 3 | Spree Enterprise multi-tenant edition | Upstream, describes a paid product that is not in the repository | Medium | Retain. Never cite as an implemented Liquorify capability | Spree Enterprise's documented behaviour only |
| `docs/developer/deployment/usage-data.mdx` | 1 | Update check and usage data sent to Spree | Upstream | High: on by default (FB-09) | Retain and reference | Upstream telemetry behaviour |
| `docs/user/` | 85 | Merchant-facing guide to the admin | Upstream | Medium, later | Retain. Liquorify merchant help is future product documentation | Upstream admin usage |
| `docs/api-reference/` | 36 | API reference pages and generated OpenAPI files | Upstream; the OpenAPI files are generated from integration specs | High | Retain. Never edit generated files by hand | Store, Admin, Seller and Platform API contracts |
| `docs/integrations/` | 17 | Payment, tax, shipping, search and email integrations | Upstream | Medium | Retain and reference | Upstream integration behaviour |
| `docs/v5/` | 260 | Frozen Spree 5 documentation | Upstream | None | Leave alone (upstream rule: never touch). Exclude from Liquorify searches | Spree 5 only |
| `docs/` site files (`docs.json`, `index.mdx`, `changelog.mdx`, `snippets/`, `.mintlify/`, `README.md`, `LICENSE.md`) | 22 | Mintlify site configuration and shared snippets | Upstream | Low | Leave alone | The Spree documentation site |
| `spree/*` and `packages/*` README, CHANGELOG and LICENSE files | 49 | Package overviews, release notes, licences | Upstream | Medium; licence notices are required | Retain. Keep every copyright and licence notice | Each package |
| `packages/dashboard-starter/CLAUDE.md` and `AGENTS.md` | 2 | Rules for the dashboard starter app | Upstream | Medium | Retain and reference | That package |
| `.changeset/` | 2 | Release notes mechanism for Spree's npm packages | Upstream | Low | Leave alone until a Liquorify release process exists | Spree package releases |

Not tracked, so never authoritative: `server/` (cloned from upstream `spree-starter`; on the owner's Mac it carries its own `README.md`, `CLAUDE.md`, `AGENTS.md` and a `render.yaml`) and `storefront/` (a local clone). Anything Liquorify needs from them must move to tracked files.

## Storefront repository (`liquorify-storefront`)

| Group | Files | Purpose | Origin | Relevance | Recommendation | Authoritative for |
|---|---:|---|---|---|---|---|
| `CLAUDE.md` | 1 | Next.js, React, SDK and Biome rules for the storefront | Upstream, plus a Liquorify pointer added now | High | Retain and reference. Local rules for that repository; shared rules live in `liquorify/` | Storefront code conventions |
| `README.md` | 1 | Storefront overview, setup, testing and deployment | Upstream, plus a Liquorify pointer added now | Medium | Update when Liquorify branding and hosting are defined. Its notice that the reader is on upstream's `6-0-dev` branch is stale here | Storefront setup |
| `.env.example`, `.env.local.example` | 2 | Environment variable names | Upstream | High | Retain | Storefront configuration names |
| `.github/dependabot.yml`, workflow comments | 2 | Dependency and CI policy notes | Upstream | Medium | Retain and reference | Storefront CI and dependency behaviour |
| `e2e/`, `e2e-backend/`, `scripts/e2e/` comments | — | How end-to-end tests boot a Spree backend | Upstream | High | Retain. They boot the upstream Spree image, not `liquorify` (FB-06) | Storefront end-to-end setup |
| `LICENSE` | 1 | MIT licence | Upstream | Required | Retain | — |

## Liquorify records outside the repositories

| Record | Kind | Recommendation |
|---|---|---|
| Three framework documents (supplied 2026-10-20) | Supplied draft framework | Migrated unchanged to `liquorify/framework/` in this change |
| Liquorify codebase assessment (2026-10-20) | Evidence | Keep as the historical record. Its findings are carried into LIQ-003 with their evidence; do not copy it |
| Merchant lifecycle specification | Product specification, PROPOSED | Migrate into `liquorify/` after decisions D7 and D8 |
| Cross-store shopper access reproduction and run output | Verification evidence | Keep out of the public repository while the defect is unfixed (decision D7) |

## Migration plan

Ordered by priority. Only M1 is done.

| # | Step | Depends on | Size |
|---|---|---|---|
| M1 | Create `liquorify/` with the framework, profile, inventory, baseline, Spree adoption record and backlog; add pointers in both repositories | — | Done |
| M2 | Replace `.github/SECURITY.md` with a Liquorify policy | Security contact decided (FB-07) | Small |
| M3 | Move the merchant lifecycle specification into `liquorify/` as PROPOSED, without reproduction detail | D7, D8 | Small |
| M4 | Write a short Liquorify development setup guide that links to `CONTRIBUTING.md` and records the verified path, versions and destructive commands | FB-04 | Small |
| M5 | Align `.claude/` commands and settings with the delegation in LIQ-001 §3 | D3 (FB-08) | Small |
| M6 | Rebrand the two `README.md` files | Branding defined | Small |
| M7 | Add link, metadata and capability-ID checks for `liquorify/` only | Drift actually appears | Small, optional |

Not planned: converting upstream documents to ENG-002 metadata, editing `docs/v5/`, or copying upstream guidance into `liquorify/`.
