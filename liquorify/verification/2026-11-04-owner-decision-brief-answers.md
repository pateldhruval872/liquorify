---
title: The owner's answers to the owner decision brief for the Spree baseline
record: owner decisions
work_item: FB-01, FB-03, FB-06, FB-07, FB-09 to FB-13, FB-19, SD-8, G-36 and sixteen pending gaps
date: 2026-11-04
recorded_by: Claude (automated session); not independent review
result: The owner approved 35 of the brief's 37 decisions on 2026-11-04, each within the clarifications below, and left decisions 9 and 34 pending. No capability, gap or defect result changes to PASS because of these answers, tenant isolation stays NOT_RUN, the proposed Liquorify entry criteria stay proposed, and Liquorify-specific features stay deferred.
---

# The owner's answers to the owner decision brief

**What this records.** On 2026-11-03 the owner received a brief of 37 numbered decisions that the remaining Spree baseline work waits on, each with a recommended answer. The brief itself is kept in the project workspace. On 2026-11-04 the owner answered it in writing:

- **Approved as recommended:** decisions 1 to 8, 10 to 18, 20, 22, 24 to 27, 29, 31 to 33, 35 and 36, subject to the clarifications in §2.
- **Decided with the owner's own wording:** 19, 21, 23, 28, 30 and 37.
- **Pending:** 9 and 34.

Each answer is recorded against its existing ID in the document that owns that ID, and the table in §1 says where. This record is the single list. Under D5 (decision 23), an answer recorded here is the owner's approval, its date and its scope; the status fields it changes are those §1 names, and no others.

## 1. Each decision, its answer and where it is recorded

| # | ID | The owner's answer, 2026-11-04 | Recorded in |
|---|---|---|---|
| 1 | Lanes A, B and C | Run the three implementation lanes as proposed, at most three at once | [Foundation lane §4](../work-items/foundation-lane-security-audit-and-storefront-backend.md#4-where-this-lane-fits-at-most-three-implementation-lanes); [LIQ-004, lanes](../LIQ-004-foundation-backlog.md#lanes-for-the-remaining-baseline-approved-on-2026-11-04) |
| 2 | Catalog part 2, question 1 | One implementation pull request. FL-21 is strengthened to check imported products' saved field values and representative exported row values, alongside the headers and row counts | The catalog batch's work item §10.9, in #36 |
| 3 | Catalog part 2, question 2 | The narrower roles' server refusals join G-11, consolidated in one check of the whole catalog after part 3, before Liquorify changes identity or access | The catalog batch's work item §10.9, in #36; G-11 |
| 4 | Batch 7, question 1 | One pull request | [Batch 7 §7](../work-items/fb-19-batch-payments-delivery-and-tax.md) |
| 5 | Batch 7, question 2 | Spree's test gateway and built-in rate providers; real-provider checks stay with P4, G-26 and G-39 | Batch 7 §7 |
| 6 | Batch 7, question 3 | A setting's effect on checkout in batch 9, on orders in batch 8; G-38 stays open until then | Batch 7 §7 |
| 7 | Multi-store administration, question 1 | Lane C, after batch 7, once a slot is available; FB-03 takes the next free slot ahead of it | [Multi-store administration §7](../work-items/fb-19-batch-multi-store-administration.md) |
| 8 | Multi-store administration, question 2 | The second role is made from Spree's support template | Multi-store administration §7 |
| 9 | FB-11, the `deepmerge` advisory | **Pending.** The owner asked first for where `deepmerge` is used and what reaches it, and a comparison of a dated exception with skipping unpublished fix versions while still reporting the advisory. Both are in the [foundation lane §1.1](../work-items/foundation-lane-security-audit-and-storefront-backend.md#11-the-deepmerge-advisory-where-it-runs-and-two-ways-to-handle-it), with a recommendation for the second | Foundation lane §1.1 and §5; FB-11 |
| 10 | FB-11, OA-6 | Allow GitHub Actions to open pull requests in `liquorify`. Not set yet; only the owner can change it | Foundation lane §5; [OA-6](../LIQ-004-foundation-backlog.md#owner-actions) |
| 11 | FB-06 | Option A: the storefront's test backend is built from a recorded `liquorify` revision inside the storefront's job, deciding where the host application lives with it (FB-05). The feasibility spike may run while decision 9 is pending | Foundation lane §5; FB-06 |
| 12 to 17 | FB-03, N1 to N6 | As the merchant lifecycle specification recommends; see §2 | FB-03 |
| 18 | FB-03's slot | The next free implementation slot, ahead of queued work | FB-03; Foundation lane §4 |
| 19 | SD-8, G-36 | Fix SD-8 now, in its own bounded pull request, after FB-03 takes its slot; see §2 | [SD-8 work item §6](../work-items/sd-8-sample-data-currency-fix.md#6-what-the-owner-decided); SD-8; G-36 |
| 20 | SD-8's demo price | The same number as the dollar price, labelled a demo amount | SD-8 work item §6 |
| 21 | Reporting SD-8 | Not reported to Spree. The same instruction stands for the other defects | SD-8 work item §6; [LIQ-004, existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) |
| 22 | Sixteen PENDING gaps | Each answered as the register proposed, within its limits: G-06, G-08, G-10, G-12, G-16, G-17, G-24, G-25, G-27, G-28, G-33, G-34, G-35, G-41, G-42 and G-43; see §2 | Each gap's row in LIQ-004 |
| 23 | D5 | Adopted with an explicit acceptance procedure; see §2 | [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation) |
| 24 | D6 | Issues in `liquorify`, linked from pull requests in both repositories. Not turned on yet (OA-7) | LIQ-001 §7; FB-10; OA-7 |
| 25 | D2 | Dhruval holds all roles, with LIQ-001 §2's limitations recorded | LIQ-001 §2 and §7 |
| 26 | D3 | LIQ-001 §3 accepted as written | LIQ-001 §3 and §7 |
| 27 | D7 | `liquorify` stays public through the baseline; decided again before the first Liquorify-specific security work | LIQ-001 §7; FB-13 |
| 28 | D8 | `liquorify/` is the specification's eventual home, marked PROPOSED, after a private, sanitized preview | LIQ-001 §7; FB-13 |
| 29 | The audit's Liquorify entry criteria | Not adopted yet: they stay proposed, to be decided with the baseline's completion record | This record |
| 30 | OA-5 | Follow the existing Figma plan. Buying and configuring the seat stays the owner's action; the owner confirms the intended team and its editing permissions before OA-5 is marked done | OA-5 |
| 31 | OA-8 | Backend Stripe and EasyPost sandbox keys when P4 is scheduled, handed over privately and never printed or committed. None exists yet | OA-8 |
| 32 | FB-12 | Finish the baseline on 6.0.0.rc4, record the move's plan now, and move after the baseline is declared complete; the storefront pins the matching rc.4 SDK until then | FB-12 |
| 33 | FB-04 | Native development, the path Spree's own worktree tooling uses; P5's Docker-based tool needs a machine with Docker when P5 is scheduled | FB-04 |
| 34 | FB-07 | **Pending** the owner's choice of a verified inbox for security reports. No address is invented or published | FB-07 |
| 35 | FB-09 | Spree's update check and usage data stay off in every Liquorify environment until hosting is decided | FB-09 |
| 36 | LIQ-004 "What waits" | The gift card line now says #30 merged on 2026-11-02; its open limitations stay in the private project notes | LIQ-004, What waits |
| 37 | Reporting SD-11 | Not reported to Spree | SD-11 |

## 2. The owner's clarifications

**Tenant isolation (decisions 12 to 18).** FB-03 is a private validation in the cloud environment, on PostgreSQL and SQLite, covering both the store and the business ownership analysis. Its tests live in the project files only, never in a public pull request. The surfaces tied to the reproduced defect are run; anything only read in code is recorded as code reading, which is not runtime verification. The owner accepts the result, for this work item only. This authorizes validation. It does not authorize a final tenancy architecture or unreviewed fixes.

**SD-8 (decisions 19 to 21).** Setup and the storefront are verified in US dollars and in Polish złoty. Keeping existing euro prices is a required automated regression check. The welcome screen's limitation stays explicit: a background load that fails is still not reported to it. Closing SD-8 or G-36 still needs the owner's acceptance of the resulting evidence.

**The sixteen gaps (decision 22).** These answers change no functional result to PASS and close no unrelated defect:

- States checked against their source, or not reachable on a stock screen, stay classified that way.
- States reached by simulating a request establish interface coverage only.
- Deferred functional gaps stay unverified, each with its named follow-up.
- G-16 stays deferred to email configuration and delivery verification.
- G-41's browser checks must come before any Liquorify change to those screens.

**Acceptance (decision 23).** Acceptance is the owner's approval, its date and its scope, and the status fields that apply, recorded through a merged pull request. A merge alone is not acceptance. Acceptances already recorded with a date stand. Only the artifacts actually accepted are marked: no draft is marked accepted, and no SES capability is marked satisfied.

**Settings, purchases and credentials (decisions 10, 24, 30 and 31).** These answers set the direction only. Nothing has been configured, bought or handed over yet, and the remaining owner actions are tracked as OA-5 to OA-8.

**Lanes.** At most three implementation lanes run at once. FB-03 takes the next free slot, ahead of queued work. SD-8's fix follows it. Multi-store administration follows when a slot is available.

## 3. What these answers do not change

- **No result changes.** Every capability result stays as recorded, and acceptance still does not turn a missing check into a pass. Tenant isolation stays NOT_RUN in every batch.
- **Defects stay open.** SD-8 and G-36 stay OPEN until the fix's evidence is accepted. The other defects keep their fix decisions for after the baseline.
- **Documents stay DRAFT.** Every document keeps its DRAFT or PROPOSED status, and every work item stays PROPOSED, until the owner accepts it under D5.
- **Entry criteria and features.** The proposed Liquorify entry criteria stay proposed, and Liquorify-specific features stay deferred.
- **Private detail stays private.** No reproduction of an unfixed defect, no credential and no exploit detail is in this record.
