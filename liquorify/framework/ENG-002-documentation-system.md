---
document_id: ENG-002
title: Documentation System
version: 1.0-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-20
---

# Documentation System

A reusable approach to keeping engineering information accurate, findable, and proportionate. It supports the [Software Engineering System](SES-001.md) and [Engineering Charter](ENG-001-engineering-charter.md).

This is a draft for adaptation. It applies to project-owned documentation within an explicitly chosen scope. Existing upstream or third-party documentation keeps its own conventions unless deliberately brought into scope.

## 1. Principles

1. **One authoritative home per meaning.** Put a rule, requirement, or decision in one place and link to it from elsewhere.
2. **Separate facts, proposals, decisions, and evidence.** Documentation should make clear what is intended, agreed, implemented, tested, and still unknown.
3. **Keep records close to the work.** Prefer versioned documentation and linked issues or change reviews. Use tools already suitable for the project.
4. **Scale detail to consequence.** A small change can keep its context, decision, and evidence in one issue or review. Create dedicated documents for durable or cross-cutting meaning.
5. **Maintain rather than accumulate.** Update affected information and archive or retire obsolete guidance. Create folders and record types when first needed.

## 2. What belongs where

| Information | Authoritative record | Typical owner |
|---|---|---|
| Engineering capabilities and baseline principles | SES-001 | Engineering governance owner |
| Responsibilities, SDLC, review, and release practices | ENG-001 | Engineering owner |
| Documentation rules | ENG-002 | Documentation or engineering owner |
| Product scope, behavior, and acceptance criteria | Product requirements | Product owner |
| User flows, screen states, content, and design-system usage | Design documentation | Product/design owner |
| Architecture, contracts, data boundaries, and tradeoffs | Technical design or decision record | Technical owner |
| Current work and dependencies | Issue or work item | Work owner |
| What was verified and its limitations | Evidence in a review, test report, or verification record | Verifier |
| Candidate, deployment, and authorization | Release record or authorized pipeline record | Release owner |
| Recovery and incident learning | Runbook or incident record | Operational owner |

A register or index summarizes and links these records; it does not redefine their contents. Supplied sources can be retained with origin and date when their original wording matters.

## 3. Structure and discovery

Keep a concise engineering entry point linking current policies, setup instructions, architecture, and work practices. Choose paths that fit the repository. These three files can live together in any agreed documentation directory; keep their relative links intact.

Additional documentation may be grouped by product, design, decisions, verification, releases, or operations as needed. Avoid empty directory trees and duplicate indexes.

For several repositories, designate one canonical home for shared policies and link to it from each repository. Local rules may add constraints for that repository. Record conflicts and intentional exceptions. Do not maintain independently edited copies of the same shared policy.

Index requirements and automated checks apply only to the declared project-owned scope. They do not require converting an upstream documentation tree to this system.

## 4. Metadata and identifiers

For durable policies, specifications, and designs, record:

```yaml
document_id: <stable ID>
title: <descriptive title>
version: <identified version>
status: DRAFT
owner: <responsible person or role; unassigned while being prepared>
```

Add an update date, approval or adoption information, supersession reference, or review trigger when useful. Draft documents do not claim approval. The optional fields `approved_by` and `approved_at` remain null until a real decision is recorded.

Work items, evidence, and operational records need only the fields that make their scope, ownership, state, and result understandable. Native issue, review, and pipeline metadata may supply those fields.

Keep existing project ID conventions where suitable. Introduce stable IDs when they help cross-references; avoid a numbering scheme for every note. Never reuse a retired ID. Choose descriptive, portable filenames and use relative links for versioned files that move together.

## 5. Lifecycle and authority

| State | Meaning |
|---|---|
| DRAFT | Working content; no approval claimed |
| PROPOSED | An identified candidate submitted for a decision |
| ACCEPTED | The responsible authority has adopted a named version and scope |
| SUPERSEDED | Another identified record replaces it |
| RETIRED | It no longer governs current work |

Use the degree of ceremony required by consequence. Routine setup notes and operational guidance can use normal review and merge authority without separate acceptance signatures. Policies and consequential specifications identify their adoption decision and effective scope.

An explicit instruction from an authorized decision-maker applies within its stated scope when given. Record consequential instructions promptly and flag affected documents. Automation may faithfully transcribe the decision; it does not invent acceptance. A merge counts as acceptance only when the project's declared workflow makes it so.

Revise accepted meaning through an identifiable new version and decision. Keep the governing version reachable while a replacement is being reviewed. A draft revision does not silently inherit earlier approval. Minor editorial corrections may follow normal review without repeating adoption.

For partial adoption, name the sections and exact revision that apply and identify what remains draft. For supersession or retirement, retain a pointer to the successor or explain why none is needed.

## 6. Decisions, work, and evidence

### Decision record

Record the question and context, options, decision, rationale, consequences, owner, date, and affected scope. Identify open questions explicitly. One issue or review can hold a small decision; a durable architecture decision merits its own record.

### Work item

Use the fields in [ENG-001](ENG-001-engineering-charter.md#4-work-items-and-risk): outcome, scope, ownership, acceptance criteria, dependencies, risk, verification, and material release impacts. Link existing requirements and designs rather than copying their normative text.

### Verification record

Record:

- Claim or acceptance criterion.
- Exact revision or artifact and relevant environment/configuration.
- Procedure or commands, prerequisites, and safe test data.
- Result: **PASS**, **FAIL**, **BLOCKED**, or **NOT_RUN**.
- Output location, verifier, date, and limitations.

Historical results remain unchanged. If a change invalidates current reliance, add a revalidation note and record the new run separately. A test result proves only the behavior exercised in the identified context.

### Release or operational record

Identify the candidate, target, verification, migration effects, authorization, responder, and recovery procedure as applicable. An existing pipeline or incident system may be the authoritative record. Link to it instead of duplicating its entire history.

## 7. Traceability and change propagation

Maintain enough linkage to answer: why was this built, what behavior was agreed, what changed, how was it checked, and what was released?

The useful chain is:

**Outcome → requirement → design/decision → work/change → verification → release → operating feedback.**

Not every change needs every record. An issue and review can carry the whole chain for small work. Dedicated traceability tooling is justified by actual scale or obligations.

When requirements, designs, interfaces, schema, configuration, or policy change, identify the affected documents and evidence. Update them with the change where practical. Otherwise create an owned follow-up and state any resulting limits on use or release. Reassess the affected scope rather than invalidating unrelated work.

## 8. Documentation checks

Select checks that reduce demonstrated maintenance work. Useful checks include broken links, invalid metadata, duplicate IDs, unresolved references, formatting, and examples that no longer match the implementation.

Validate capability references against [SES-001](SES-001.md). Preserve the catalog's IDs, names, and purposes unless an explicit revision changes them. Checks are restricted to the agreed documentation scope.

Distinguish a proposed check, a configured workflow, a demonstrated detection, and an enforced merge gate. Do not claim a checker exists or works without evidence. Structural checks do not establish factual accuracy, product approval, security sufficiency, or provider compatibility.

## 9. Sensitive information and maintenance

Keep credentials, access tokens, unnecessary personal data, and confidential customer records out of documentation and test output. Reference an appropriate secure location when needed and apply access and retention rules to the records themselves.

If preserving an external or supplied source, record origin and revision or retrieval date. Keep original evidence distinct from interpretation; do not rewrite it to match later expectations.

Review documentation when its dependencies materially change or users encounter incorrect instructions. Remove unnecessary duplication, preserve useful history in version control, and give each important record an accountable owner.
