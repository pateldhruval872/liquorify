---
document_id: LIQ-000
title: Liquorify Engineering Documentation
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Liquorify Engineering Documentation

This folder is the one canonical home for shared Liquorify engineering documentation. It serves both Liquorify repositories:

- [`pateldhruval872/liquorify`](https://github.com/pateldhruval872/liquorify) (this repository, public): commerce backend, admin dashboard and shared packages.
- [`pateldhruval872/liquorify-storefront`](https://github.com/pateldhruval872/liquorify-storefront) (public since 2026-10-21): the customer storefront. It points here and keeps only its own local rules.

**Status.** On 2026-10-21 the owner adopted the three framework documents as the working process for Liquorify-owned work, with the project profile's exceptions (decision D1 in [LIQ-001 §7](LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation)). Unresolved product and architecture decisions stay proposed, and the adoption marks no capability satisfied. Every document here still carries DRAFT status, except the design system decision record LIQ-007, which is PROPOSED for the owner's decision apart from the three questions the owner decided on 2026-10-21. How acceptance is recorded is decision D5, which is open.

## Index

| ID | Document | Version | Status | Purpose |
|---|---|---|---|---|
| SES-001 | [Software Engineering System](framework/SES-001.md) | 2.0-draft | DRAFT | Capability catalog (172 IDs) and baseline principles |
| ENG-001 | [Engineering Charter](framework/ENG-001-engineering-charter.md) | 1.0-draft | DRAFT | Responsibilities, delivery stages, work items, release practice |
| ENG-002 | [Documentation System](framework/ENG-002-documentation-system.md) | 1.0-draft | DRAFT | Document ownership, lifecycle, metadata and evidence records |
| LIQ-001 | [Project Profile](LIQ-001-project-profile.md) | 0.3-draft | DRAFT | Liquorify facts, proposed roles and delegation, proportionate review, Spree engineering and Product & Design reuse mapping, the default baseline, its exceptions and the adoption decisions |
| LIQ-002 | [Documentation Inventory](LIQ-002-documentation-inventory.md) | 0.3-draft | DRAFT | Existing documentation in both repositories and the migration plan |
| LIQ-003 | [Engineering Baseline](LIQ-003-engineering-baseline.md) | 0.3-draft | DRAFT | The 172 capabilities measured against the current repositories, with evidence |
| LIQ-004 | [Foundation Backlog](LIQ-004-foundation-backlog.md) | 0.7-draft | DRAFT | Prioritized foundation work, owner actions and their steps, the open isolation findings, the work item in progress, the next documentation item and the Spree baseline reproduction work items |
| LIQ-005 | [Spree Engineering Adoption Record](LIQ-005-spree-engineering-adoption.md) | 0.2-draft | DRAFT | Each relevant Spree engineering mechanism, the capabilities it supports, and whether to reuse, adapt, replace or investigate it |
| LIQ-006 | [Spree Product Capability Baseline](LIQ-006-product-capability-baseline.md) | 0.2-draft | DRAFT | Every existing Spree product area and surface at the pinned revisions, with a proposed disposition for each feature, Enterprise and documentation-only features listed separately, the deferred Liquorify needs and the baseline's completion criteria |
| LIQ-007 | [Design System Adoption and Extension](LIQ-007-design-system-adoption-and-extension.md) | 0.4 | PROPOSED | Decision record: how Figma, Storybook and Playwright's screenshot comparisons reproduce Spree's design systems first, and how Liquorify would extend them afterward. Q4, Q7 and Q10 are decided, Q10 superseding Q5 (Chromatic); the rest stays proposed |
| LIQ-008 | [Spree Screen Inventory](LIQ-008-spree-screen-inventory.md) | 0.1-draft | DRAFT | Every existing screen, overlay and email, with IDs, routes, roles, permissions, workflows, meaningful states and code, and the cross-screen flows |
| LIQ-009 | [Spree Component and Token Inventory](LIQ-009-spree-component-and-token-inventory.md) | 0.4-draft | DRAFT | Every existing component and design token, with IDs, light and dark values, the SES capabilities each supports, and the Storybook story that covers it |
| LIQ-010 | [Design System Reproduction Architecture](LIQ-010-design-system-reproduction-architecture.md) | 0.3-draft | DRAFT | Spree's existing design system architecture, and the proposed Storybook, Playwright and Figma arrangement around it: stories, providers and mocks, the token mapping, ID traceability, the visual checks, the update and verification workflow, the pilot and the external-tool blockers. Version 0.2 corrects it with the pilot's findings, and 0.3 with the first batch's |

## Verification records

Records of what was run, on which revision, with its result and limitations ([ENG-002 §6](framework/ENG-002-documentation-system.md#verification-record)). Each record stays as written; a new run gets a new record.

| Date | Record | Work item | Result |
|---|---|---|---|
| 2026-10-21 | [FB-02 pull request checks](verification/2026-10-21-fb-02-pull-request-checks.md) | FB-02 | BLOCKED: no workflow started on the pull request |
| 2026-10-21 | [FB-02 first workflow run](verification/2026-10-21-fb-02-first-workflow-run.md) | FB-02 | PASS: all 29 pull request jobs passed. Codecov refused the coverage uploads because no token is set |
| 2026-10-21 | [FB-02 merge push and branch protection](verification/2026-10-21-fb-02-merge-push-and-protection.md) | FB-02 | PASS: the merge push passed with all six release jobs skipped, and both saved rulesets match the agreed settings. NOT_RUN: the direct-push refusal, by the owner's instruction |
| 2026-10-21 | [FB-18 baseline completion check](verification/2026-10-21-fb-18-baseline-completion.md) | FB-18 | PASS: all seven completion criteria hold after four corrections made in the same change. Behaviour was not run |
| 2026-10-21 | [FB-19 pilot](verification/2026-10-21-fb-19-pilot.md) | FB-19 | PASS: both Storybooks build in CI, every comparison passed under the tolerance then configured on two runs of the same revision, and a planted change failed with its images published. The diagnostic comparison with running screens found no unexplained difference after two corrections. NOT_RUN: the owner's acceptance of the images and of fidelity |
| 2026-10-21 | [FB-19 pilot compared with running screens](verification/2026-10-21-fb-19-pilot-fidelity.md) | FB-19 | Diagnostic comparison: no unexplained difference for 18 stories and 8 token pages after two corrections, with the side-by-side images and computed styles published. Coverage gaps: 35 stories checked against their source only, and the cart drawer opened with a pointer. NOT_RUN: the owner's acceptance of fidelity, and of the images with a [review list](verification/2026-10-21-fb-19-pilot-image-review.md) |
| 2026-10-21 | [Screenshot tolerance for the visual checks](verification/2026-10-21-fb-19-screenshot-tolerance.md) | FB-19 | PASS: a threshold of 0.005 with 25 pixels allowed passes every unchanged run and fails every deliberate background and colour token change measured, in both repositories, and both pilots passed twice in CI under it |
| 2026-10-21 | [FB-19 dashboard primitives, part 1](verification/2026-10-21-fb-19-batch-dashboard-primitives-1.md) | FB-19 | PASS: 114 stories for 24 primitives, each image looked at, and all 310 comparisons passed in CI under the tolerance then configured. NOT_RUN: the comparison with running screens, and the owner's review of the images |

## Supplied framework sources

The three framework documents were supplied by the project owner on 2026-10-20 as explicitly authorized draft inputs, and adopted as the working process on 2026-10-21. They are kept exactly as supplied, so their original wording and relative links stay intact. Liquorify's interpretation and adoption of them live in LIQ-001, never in the files themselves.

| File | Supplied version | SHA-256 of the file as supplied |
|---|---|---|
| `framework/SES-001.md` | 2.0-draft | `51d19d37f35f151bbccf2e0b4f8177f5f50d5d1c1afd9d6f15c7520e4cb157d1` |
| `framework/ENG-001-engineering-charter.md` | 1.0-draft | `480a69c6f3755c2a05c432d66337b4d7d64c2d41e482025f1ae298e97843094c` |
| `framework/ENG-002-documentation-system.md` | 1.0-draft | `2bd656faa5be02ec4151f109c68c9bbe678678c3edb0670c61da3c72982a6fc9` |

No other material from the Liquorify-Company workspace, and no earlier product decisions, were imported.

## Declared Liquorify-owned documentation scope

The metadata, index and lifecycle rules of ENG-002 apply only to:

- everything in this folder;
- the short "Liquorify" pointer sections in `CLAUDE.md` and `README.md` of both repositories.

Every other document in both repositories is upstream Spree documentation. It keeps its own conventions and is not converted (see [LIQ-002](LIQ-002-documentation-inventory.md)). Upstream rules in `CLAUDE.md` still govern code written in Spree's areas, except where an adopted Liquorify decision says otherwise. The default baseline for Liquorify-owned work is in [LIQ-001 §6.2](LIQ-001-project-profile.md#62-default-baseline), and its conflicts and exceptions are in [§6.3](LIQ-001-project-profile.md#63-conflicts-and-exceptions).

## Records kept outside the repositories

These Liquorify records live in the Liquorify project workspace, not in Git. They are referenced by title so their history stays in one place until they are migrated (LIQ-002, migration plan).

| Record | Kind | State |
|---|---|---|
| Liquorify codebase assessment (2026-10-20) | Evidence: code reading of both repositories and a read-only look at the owner's Mac | Historical; its findings are carried into LIQ-003 with their evidence |
| Merchant lifecycle specification | Product specification | PROPOSED, not approved for implementation; option A is a direction for technical validation only |
| Cross-store shopper access reproduction and its run output (2026-10-20) | Verification evidence | Kept out of this public repository while the defect is unfixed |

## Changing these documents

Changes here go through a pull request reviewed by the project owner. Each change is classed by its effect ([LIQ-001 §4](LIQ-001-project-profile.md#4-review-and-verification-expectations)): rewording is Low, and a change to a rule, role, delegation or acceptance condition is Protected where it changes authority or a control. Merging a change does not make a document accepted. A document becomes ACCEPTED only when its `status`, `approved_by` and `approved_at` fields record the owner's decision (proposed in LIQ-001, decision D5).
