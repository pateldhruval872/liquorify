---
document_id: ENG-001
title: Engineering Charter
version: 1.0-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-20
---

# Engineering Charter

This reusable charter applies the [Software Engineering System](SES-001.md) to a project. It defines how work is owned, designed, implemented, verified, released, and operated. It supports a solo developer or a larger team and can be adapted to existing codebases.

This is a draft. At adoption, record the project scope, responsible people, applicable repositories, and any adjustments. Record actual controls separately from proposed controls.

## 1. Project profile

Complete this compact profile when adopting the charter. An existing project records its current state instead of assuming a new implementation.

| Item | Project assignment |
|---|---|
| Product or system and charter scope | To be recorded |
| Repositories and authoritative documentation | To be recorded |
| Accountable engineering owner | To be assigned |
| Product decision-maker | To be assigned |
| Technical, security, and quality reviewers | To be assigned as needed |
| Release and operational owners | To be assigned |
| Existing stack, environments, and delivery workflow | To be recorded with evidence |
| Delegated actions and actions requiring additional authorization | To be recorded |
| Adoption decision | Exact version, date, scope, and responsible person |

Assignments can refer to an existing team directory or ownership file rather than duplicate it here. Unassigned responsibilities that affect current work are made explicit.

## 2. Responsibility and delegation

- The **product owner** decides intended behavior, priorities, and acceptance criteria.
- The **engineering owner** coordinates architecture, implementation standards, dependencies, and technical decisions.
- The **implementer** produces the change and its verification evidence.
- The **reviewer** evaluates the change and evidence, with specialist input when risk requires it.
- The **release owner** is accountable for the candidate and target environment.
- The **operational owner** is accountable for monitoring, incidents, and recovery.

One person may hold several roles. Record consequential limits of review independence and available expertise. Choose additional review according to risk rather than creating a fixed approval queue for every role.

People and automation may act within explicitly delegated scope, including standing authorization for routine work. Do not repeatedly seek approval for actions already covered. Changes to consequential scope, security-risk acceptance, destructive actions, or production access follow the project's stated authority rules. Executing an action does not confer authority to approve it.

## 3. Iterative SDLC

Use small increments. Stages may overlap or repeat when evidence changes. Routine fixes use only the parts they affect. An investigation can precede a final design when its scope, data, and limits are clear.

| Stage | Outcome | Evidence needed to proceed |
|---|---|---|
| 0. Establish the foundation | Shared working rules and a verified baseline | Responsibilities, repository boundaries, development setup, applicable checks, and known gaps are recorded |
| 1. Define the work | A bounded problem and intended result | Scope, users, behavior, acceptance criteria, and blocking decisions are understood |
| 2. Design and plan | A feasible approach divided into manageable changes | Relevant flows, data and trust boundaries, contracts, failure behavior, decisions, dependencies, and verification plan |
| 3. Implement and integrate | A focused change in source control | Code or configuration, appropriate tests, documentation, and migration details |
| 4. Verify and review | Evidence that the change meets its scope | Required checks pass on the identified candidate, review is recorded, and limitations are visible |
| 5. Release | A controlled change in the target environment | Authorized candidate and deployment workflow, configuration, operational readiness, and recovery plan |
| 6. Operate and improve | An understood outcome and corrective learning | Post-release observations, support or incident findings, and owned follow-up work |

Before a feature is built, classify existing framework and application capabilities as reusable, needing extension, or missing. Existing tests and automation are evaluated and reused where suitable.

## 4. Work items and risk

A work item can be an issue or another durable record. It needs only enough detail to make the change and its verification understandable.

Record:

- Intended outcome and in/out scope.
- Accountable owner and implementer; reviewers where needed.
- Acceptance criteria, dependencies, and material unknowns.
- Relevant requirements, capability IDs, or design decisions.
- Risk, verification, and any release or recovery impact.

| Risk | Typical effects | Handling |
|---|---|---|
| Low | Editorial or presentation change with no material behavior or control impact | Compact record, owner review, and a relevant inspection or check |
| Standard | Bounded behavior with understood contracts and reversible effects | Acceptance criteria, proportionate design, change review, and relevant verification |
| Protected | Identity, authorization, tenant boundaries, important data or financial invariants, sensitive integrations, consequential migrations, or production controls | Explicit failure/recovery analysis, affected-domain review, targeted evidence, and scoped authorization where required |

Classify by effects rather than file type or size. An access-policy change in a document may be protected. Small changes do not need redundant tests that merely restate their implementation.

## 5. Ready, done, and release-ready

**Ready for implementation:** scope and acceptance criteria are agreed; an owner is assigned; important states and failures are understood; consequential decisions are recorded; and dependencies are verified or the work is explicitly bounded to research or simulation. Unrelated work may proceed while a dependency remains unresolved.

**Done for a change:** acceptance criteria are met; required checks pass on the identified candidate; proportionate review is recorded; affected documentation, configuration, and migration concerns are addressed; and remaining limitations have an owner. A skipped required check does not count as a pass.

**Release-ready:** the candidate has suitable target-environment verification, configuration, access controls, monitoring, a responder, and a recovery path. Required release authority is recorded or supplied by an existing authorized workflow. Merging alone does not establish release readiness.

## 6. Source, review, and continuous integration

- Use source control, small changes, and a branch strategy appropriate to the repository. A reviewable change links its work item and records what changed, why, validation, and material limitations.
- Choose checks according to the affected source and behavior. Avoid rerunning unrelated expensive checks without a reason.
- Apply review and merge controls that the project can actually enforce. Distinguish automated gates from procedural agreements.
- Evaluate the final candidate. Changes after verification require relevant checks to be rerun; unrelated evidence can remain valid.
- Record coordinated changes across repositories and verify compatible revisions together. Keep upstream conventions and notices where applicable.
- Manage dependency introduction and upgrades deliberately, including compatibility, support, security, and license obligations.

No particular source host, CI service, package manager, or release tool is mandated by this charter.

## 7. Design and verification expectations

Use the existing architecture and design system where suitable. Add a separate design or decision record for a consequential boundary, data model, contract, or tradeoff; a small change can carry its design in the work item.

Verification follows the relevant baseline in [SES-001](SES-001.md#5-baseline-engineering-principles). Test important business rules, integration boundaries, critical user journeys, and failure behavior. Include positive and negative access-control tests when changing identity or isolation.

Record the revision, environment, command or procedure, result, and limitation. Keep historical results when new evidence supersedes them. Coverage percentages and green builds are supporting signals rather than proof that every requirement is met.

## 8. Environments, migrations, and operations

Define development, test, staging or preview, and production boundaries as the system needs them. Document required versions, configuration, startup, and verification commands. Keep secrets separate from source and use safe test data.

Verify a clean setup before relying on it. Distinguish ordinary startup from commands that reset data or regenerate files. All deployable source and necessary configuration must have an identified, recoverable home.

For consequential migrations, record ordering, compatibility, locking or duration, data validation, and recovery. Preserve the distinction between reverting application code and recovering data.

Before a workload is released, establish proportionate health checks, logs or metrics, a response owner, and recovery procedures. Restore and recovery exercises should match the importance of the data and service. Incidents and failed releases produce owned corrective work.

## 9. Documentation and exceptions

Follow the [Documentation System](ENG-002-documentation-system.md). Keep one authoritative home per rule or decision and link related records. Update affected records with the change or identify a bounded follow-up that does not hide a current blocker.

Record exceptions with scope, risk, compensating measures, owner, approval, and an expiry or review trigger. Deferred requirements remain visible and are not marked satisfied. Review the charter when team responsibilities, architecture, operating conditions, or authority materially change.

## 10. Initial adoption checklist

- [ ] Project profile and delegation are clear.
- [ ] Existing source, tools, environments, and controls have an evidence-based baseline.
- [ ] Work items, review expectations, and relevant checks are usable.
- [ ] Development setup is reproducible and destructive commands are identified.
- [ ] Important data, trust, and integration boundaries have owners.
- [ ] Required controls are distinguished from improvements planned for later.
- [ ] The next bounded work item has acceptance criteria and a verification plan.

Adoption does not require implementing every capability, completing production infrastructure, or writing documents for work that has not been activated.
