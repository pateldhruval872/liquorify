---
title: The owner's delegation of routine acceptance and merging for the Spree baseline
record: owner decisions
work_item: FB-01, FB-19 to FB-21, the platform batch and every approved baseline work item
date: 2026-11-04
recorded_by: Claude (automated session); not independent review
result: On 2026-11-04 the owner delegated to Claude's sessions the routine technical, image and fidelity acceptance of approved Spree baseline work, and the merging of that work, on the owner's behalf. Each acceptance under it is recorded as delegated acceptance, never as the owner's review. Owner decisions, gap answers, and material changes to scope, architecture, cost or security stay with the owner. No defect, gap, exception or completion criterion changes because of this delegation.
---

# The owner's delegation of routine acceptance and merging

**What the owner said.** On 2026-11-04 the owner asked Claude to take responsibility for completing the approved Spree baseline. The plan is the baseline completion audit, [LIQ-004](../LIQ-004-foundation-backlog.md) and the owner's recorded decisions. In the owner's words:

> "I authorize you to perform routine technical, image and fidelity acceptance and merge approved baseline work on my behalf. Record this as delegated acceptance; do not describe it as my personal review."

The same instruction sets how the work runs:

- Keep the remaining work in dependency order, with a dedicated thread for each eligible work item and at most three implementation lanes active.
- Each thread implements its approved scope, runs the tests it needs, reviews its images and fidelity, and opens a pull request with its evidence.
- The coordinating session runs the final review. It merges a pull request when the approved acceptance criteria and the required checks pass on the final commit. Merges go in dependency order; dependent branches are then brought up to date, and the relevant checks are verified on `main`.
- The next eligible item starts as soon as a lane frees, until the audit's agreed completion criteria are met.

The owner also set these limits:

- Keep verification within each development work item.
- Preserve branch protection and the agreed boundaries for private evidence.
- Keep unresolved defects, gaps and accepted exceptions accurately recorded. Do not close them silently, and do not weaken the completion criteria.
- Ask the owner only for outstanding owner decisions, or for material changes to scope, architecture, cost or security. Group those questions into one brief, and carry on with the work they do not block.
- Keep Liquorify-specific product development deferred until the Spree baseline's completion gate is met.

## 1. What is delegated

The delegation applies only to **approved Spree baseline work**. That is the work items whose scope, acceptance criteria and owner's answers are already recorded, within the baseline that [LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete) and LIQ-004 define.

| Delegated | What it allows |
|---|---|
| Technical acceptance | Accepting a work item's tests, Spree's own specs and CI results against its approved acceptance criteria |
| Image acceptance | Accepting reference images and screen captures. Each changed reference image is reviewed in its pull request, and CI never approves one automatically |
| Fidelity acceptance | Accepting the comparison between stories and running screens, within the limits the work item's record states |
| Merging | Merging the work item's pull requests through GitHub's protected merge. This happens only once the approved acceptance criteria and every required check pass on the final commit. Merges go in dependency order, the other open pull requests are then brought up to date and their affected checks rerun, and the relevant checks are verified on `main` |
| Planning within approved scope | Splitting or sequencing a batch's work, or choosing between options that change neither its scope nor any defect, gap or criterion. The recommended answer is recorded as decided under this delegation |

## 2. How a delegated acceptance is recorded

D5's procedure still applies ([LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation)): an approval, its date, its scope and the status fields it sets, recorded through a merged pull request. Under this delegation:

- The record says **"delegated acceptance, under the owner's delegation of 2026-11-04"**. It gives the date, the scope accepted, and the session that accepted it, by its thread's title.
- It never says the owner reviewed, accepted or approved the work. Where a status field names an approver, it reads `delegated acceptance (Claude, under the owner's delegation of 2026-11-04)`.
- Each batch keeps its verification record and its merge record. The merge record states the delegated acceptance and the revision it applies to.
- What a check did not show stays recorded as not shown. Delegated acceptance never turns a missing check, a simulated state or code reading into a pass.

## 3. What stays with the owner

| Stays with the owner | Why |
|---|---|
| Answering a gap: accepting it, deferring it, linking it to another, or closing it without passing evidence | LIQ-006 §14 criterion 9 requires the owner's explicit acceptance of each remaining gap. A gap may be closed under this delegation only on passing evidence for the closing condition its row records, and the record must say so |
| Accepting an exception or a security risk, such as decision 9 on the `deepmerge` advisory | Security and exceptions are outside routine acceptance |
| FB-03's validation result | N1 reserves it to the owner, for that work item only |
| Accepting a specification, including publishing the merchant lifecycle specification (D8) | A specification is not routine acceptance |
| Declaring the baseline complete, and the Liquorify entry criteria (decision 29) | Both are decided with the baseline's completion record. Delegated sessions prepare that record |
| Any material change to scope, architecture, cost or security | The owner's instruction |
| Repository settings, branch protection, accounts, purchases and credentials (OA-5 to OA-8) | Only the owner can make them; LIQ-001 §3 |
| Deploying anything | Not part of this delegation |
| Liquorify-specific product work | Deferred until the baseline's completion gate |

These questions go into one owner brief, each with the work it blocks. Work they do not block carries on.

## 4. What this delegation does not change

- **Records stay accurate.** Every defect, gap and accepted exception stays as recorded. Tenant isolation stays NOT_RUN in every batch, and ISO-1 to ISO-7 stay open.
- **Completion criteria are unchanged.** LIQ-006 §14 and the audit's completion criteria still apply.
- **Earlier acceptances stand.** Acceptances the owner gave personally keep their dates and wording.
- **Statuses stay as they are.** Every document stays DRAFT or PROPOSED, and every work item PROPOSED, until it is accepted under D5.
- **Branch protection is kept.** No merge bypasses a rule or a required check, and nothing is pushed to `main` directly.
- **Private evidence stays private.** Reproductions of unfixed defects, FB-03's tests and results, credentials and exploit details stay in the private project notes.
