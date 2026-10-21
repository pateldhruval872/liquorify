---
document_id: LIQ-000
title: Liquorify Engineering Documentation
version: 0.1-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Liquorify Engineering Documentation

This folder is the one canonical home for shared Liquorify engineering documentation. It serves both Liquorify repositories:

- [`pateldhruval872/liquorify`](https://github.com/pateldhruval872/liquorify) (this repository, public): commerce backend, admin dashboard and shared packages.
- [`pateldhruval872/liquorify-storefront`](https://github.com/pateldhruval872/liquorify-storefront) (private): the customer storefront. It points here and keeps only its own local rules.

**Status: draft.** Nothing in this folder has been adopted. The framework documents are draft inputs, the project profile holds proposals, and the baseline records what was observed. Adoption follows the decisions listed in [LIQ-001 §7](LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation).

## Index

| ID | Document | Version | Status | Purpose |
|---|---|---|---|---|
| SES-001 | [Software Engineering System](framework/SES-001.md) | 2.0-draft | DRAFT | Capability catalog (172 IDs) and baseline principles |
| ENG-001 | [Engineering Charter](framework/ENG-001-engineering-charter.md) | 1.0-draft | DRAFT | Responsibilities, delivery stages, work items, release practice |
| ENG-002 | [Documentation System](framework/ENG-002-documentation-system.md) | 1.0-draft | DRAFT | Document ownership, lifecycle, metadata and evidence records |
| LIQ-001 | [Project Profile](LIQ-001-project-profile.md) | 0.1-draft | DRAFT | Liquorify facts, proposed roles and delegation, review expectations, conflicts with upstream conventions, adoption decisions |
| LIQ-002 | [Documentation Inventory](LIQ-002-documentation-inventory.md) | 0.1-draft | DRAFT | Existing documentation in both repositories and the migration plan |
| LIQ-003 | [Engineering Baseline](LIQ-003-engineering-baseline.md) | 0.1-draft | DRAFT | The 172 capabilities measured against the current repositories, with evidence |
| LIQ-004 | [Foundation Backlog](LIQ-004-foundation-backlog.md) | 0.1-draft | DRAFT | Prioritized foundation work, the open isolation findings, and the recommended next work item |

## Supplied framework sources

The three framework documents were supplied by the project owner on 2026-10-20 as explicitly authorized draft inputs. They are kept exactly as supplied, so their original wording and relative links stay intact. Liquorify's interpretation of them lives in LIQ-001, never in the files themselves.

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

Every other document in both repositories is upstream Spree documentation. It keeps its own conventions and is not converted (see [LIQ-002](LIQ-002-documentation-inventory.md)). Upstream rules in `CLAUDE.md` still govern code written in Spree's areas, except where an adopted Liquorify decision says otherwise. Known conflicts are listed in [LIQ-001 §6](LIQ-001-project-profile.md#6-conflicts-with-upstream-conventions).

## Records kept outside the repositories

These Liquorify records live in the Liquorify project workspace, not in Git. They are referenced by title so their history stays in one place until they are migrated (LIQ-002, migration plan).

| Record | Kind | State |
|---|---|---|
| Liquorify codebase assessment (2026-10-20) | Evidence: code reading of both repositories and a read-only look at the owner's Mac | Historical; its findings are carried into LIQ-003 with their evidence |
| Merchant lifecycle specification | Product specification | PROPOSED, not approved for implementation; option A is a direction for technical validation only |
| Cross-store shopper access reproduction and its run output (2026-10-20) | Verification evidence | Kept out of this public repository while the defect is unfixed |

## Changing these documents

Until the framework is adopted, changes here go through a pull request reviewed by the project owner. Merging a change does not make a document accepted. A document becomes ACCEPTED only when its `status`, `approved_by` and `approved_at` fields record the owner's decision (proposed in LIQ-001, decision D5).
