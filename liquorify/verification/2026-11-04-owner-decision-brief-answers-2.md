---
title: The owner's second set of answers to the owner decision brief
record: owner decisions
work_item: FB-05, FB-06, FB-11, FB-19 (catalog part 2, batch 9, P4, P8, P9, P10), OA-6, SD-17, G-11, G-13, G-37, G-45, G-57 to G-59, G-61, G-65 to G-72
date: 2026-11-04
recorded_by: Claude (automated session); not independent review
result: On 2026-11-04 the owner answered 19 rows of the owner decision brief, and the part of a 20th that concerns B17. Every other open decision stays pending, among them shopper-account ownership and the acceptance of FB-03's private report. No capability, gap or defect result changes to PASS because of these answers, tenant isolation stays NOT_RUN, and Liquorify-specific features stay deferred.
---

# The owner's second set of answers to the owner decision brief

**What this records.** The owner decision brief is kept in the project workspace and lists the questions only the owner can answer. On 2026-11-04 the owner answered these rows of it in writing, and asked that work continue under the delegation of the same day ([record](2026-11-04-delegated-acceptance-and-merging.md)):

- **Rows A to E:** the questions that held catalog part 2's merge, FB-06's step 2.2 and G-57's closing.
- **Row 1:** decision 9, the security audit's unpublished `deepmerge` fix.
- **Rows 9 to 17, 19 to 21 and 23:** gaps from batch 7, catalog part 2 and batch 15, and where G-13 goes.
- **Row 22, in part:** B17 is tracked as SD-17. The rest of row 22 stays pending.

The owner added one condition to the deferrals: each deferred check must have a named work item and a closure condition, and coverage checked against source only or reached by simulating a request must stay distinguished from functional verification. §2 gives each one.

Each answer is recorded against its own ID in the document that owns that ID, and §1 says where. This record is the single list. Under D5, an answer recorded here is the owner's approval, its date and its scope.

## 1. Each answer and where it is recorded

| Row | ID | The owner's answer, 2026-11-04 | Recorded in |
|---|---|---|---|
| A | B17, catalog part 2's criterion 15 | Accepted as a baseline exception to criterion 15. The dashboard downloads the export's file, but the export email's link does not download it. B17 is tracked as SD-17, and stays open | Catalog part 2's record and SD-17 in LIQ-004, in #42 |
| B | Catalog part 2's visual check | An allowance of 60 counted pixels for the two named dark price list images only, "Price list form: Choosing the match policy" and "Price list form: A price list". Every other tolerance is unchanged. The unchanged-run and deliberate-change evidence is committed, and two full visual runs pass on the final revision | Catalog part 2's record §8, in #42: approved, then not applied, because the two images stopped varying under `main`'s new Storybook preview; the evidence is kept there |
| C | FB-05, for FB-06's step 2.2 | Spree's starter, pinned at a recorded commit, is the test host, with Liquorify's backend pinned separately. The job fails on any unintended change to a third-party dependency. This decides the test host only | [Foundation lane §2.1](../work-items/foundation-lane-security-audit-and-storefront-backend.md#21-the-spikes-result-2026-11-04); [FB-05 and FB-06](../LIQ-004-foundation-backlog.md#backlog) |
| D | FB-06's step 2.2 | Local browser test runs and CI both move to that same backend, and the documentation is updated | Foundation lane §2.1; FB-06 |
| E | P8's criterion 1.6, G-57 | The criterion is corrected to test Spree's warning, that cancelling keeps the file, and that confirming removes it from the library and the product. G-57 closes only on passing evidence for the corrected criterion. SD-19, SD-20 and their failing test results are kept, and P8 is not described as entirely passing | P8's criterion 1.6 and G-57, in P8's follow-up pull request |
| 1 | Decision 9, FB-11 | Skip fix versions that are definitively unpublished, and keep reporting the advisories they leave unresolved. No ignore entry is added. A registry or network failure stays a failure | [Foundation lane §1, §1.1 and §5](../work-items/foundation-lane-security-audit-and-storefront-backend.md#11-the-deepmerge-advisory-where-it-runs-and-two-ways-to-handle-it); FB-11 |
| 9 | G-45 | Linked to G-11, as G-50 and G-56 are | G-45; G-11; the platform batch's step P10 |
| 10 | G-13 and batch 9's real Stripe states | Both move to P4. Batch 9 continues with Spree's Check method and provider forms in stories clearly labelled as mocked. Real-provider verification stays open | G-13; batch 9's row in LIQ-004; the platform batch's step P4; batch 9's work item §7, in batch 9's pull request |
| 11 | G-65 | Deferred, as G-53 | G-65; [LIQ-004, comparisons deferred to later batches](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) |
| 12 | G-66 | Accepted as simulated interface-state coverage only, as G-54 | G-66 |
| 13 | G-67 | Accepted as source-reviewed coverage only, as G-55. The running screens and sandbox calls stay with P4, G-26 and G-39 | G-67 |
| 14 | G-68 | Linked to G-37 | G-68 |
| 15 | G-69 | Deferred to the platform batch's browser-test work | G-69; the platform batch's step P9 |
| 16 | G-70 | Linked to G-11, as G-56 is | G-70; G-11; the platform batch's step P10 |
| 17 | G-71 | Handed to batch 9 for checkout, batch 8 for orders and P4 for real providers, as decision 6 set out. G-38 stays open until then | G-71 |
| 19 | G-58 | Deferred, as G-53 | G-58, in #42; LIQ-004, comparisons deferred to later batches |
| 20 | G-59 | Accepted as simulated interface-state coverage only, as G-54 | G-59, in #42 |
| 21 | G-61 | Deferred to the platform batch's browser-test work | G-61, in #42; the platform batch's step P9 |
| 23 | G-72 | Deferred to the platform batch's browser-test work | G-72; the platform batch's step P9 |

## 2. Each deferred check's work item and closure condition

Two platform steps were added for the owner's condition, as P8 was added for G-57 on 2026-11-02: [P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) for the actions no browser test drives, and [P10](../work-items/fb-19-batch-platform.md#p10-the-remaining-refusals-within-one-store) for the refusal check that G-11 holds. The comparison follow-up for stories is [a subsection of LIQ-004](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches).

| Gap | Kind | Work item | Closes when |
|---|---|---|---|
| G-13 | Function, real provider | P4, with the backend sandbox keys (OA-8) | P4 shows the saved card list and its remove confirmation with a real Stripe test card on the storefront, at a recorded revision, twice in a row |
| G-45, G-70 | Function, refusals | P10, after catalog part 3 merges | P10's evidence passes for every request the gap names. A request answered that should have been refused is a defect and a security finding for the owner, and the gap stays open |
| G-58, G-65 | Coverage, comparisons | The comparison follow-up in each later dashboard batch: catalog part 3, then batches 6, 8 and 10 to 13 | Every story the gap holds has been compared with a running screen in one of those batches' image review lists. A story no stock screen shows keeps its status, and the gap stays DEFERRED for it |
| G-61, G-69, G-72 | Function, browser tests | P9, in parts as each batch merges | Each action the gap names has a browser test, run twice in a row at a recorded revision and shown to fail when its assertion does not hold, that passes or fails only on a recorded defect, whose failing result is kept. G-72's tests fail on SD-18 until it is fixed |
| G-68 | Function, browser tests | G-37's, in P9 since the owner's answer to row F later the same day (§5) | G-37's browser tests pass, as §5 sets out |
| G-71 | Function, where settings take effect | Batch 9 for checkout, batch 8 for orders, P4 for real providers | Each setting in batch 7's record §8 has passing evidence from the work it is handed to. Mocked provider forms do not count for the real-provider part |

**Accepted, not deferred.** G-59 and G-66 are simulated interface-state coverage only: the states were reached by answering or holding a request in the browser, and the server's behaviour in them is not verified. G-67 is source-reviewed coverage only: no Stripe or EasyPost screen, call or integration is verified. None of the three is functional verification.

**How these gaps close.** Under the delegation of 2026-11-04, a gap closes only on passing evidence for its recorded condition. That closing is recorded as delegated acceptance, not the owner's review. Anything else comes back to the owner.

## 3. What stays pending

- **Row 18:** whether B7 and B15, from batch 7, become SD-15 and SD-16, and B13 stays recorded behaviour.
- **Row 22, apart from B17:** the other 23 behaviours that catalog part 2 recorded.
- **Row 24:** the store switcher missing on a phone, batch 15's B2.
- **Rows 6 to 8:** the merchant lifecycle specification's preview (D8), FB-03's validation result, which stays private, and who owns a shopper account.
- **Rows 26 to 29:** where P5 runs, FB-04's last step, decision 34 (a verified inbox for security reports) and the completion record.
- **Owner actions OA-5 to OA-8:** none done yet.
- **G-37,** with G-68 linked to it. Its batch reported on 2026-10-26 and its work item was not named; P9 was proposed to the owner for it as row F, which the owner answered later the same day (§5).
- **The other open gaps,** answered when the batch that holds each one reports: G-02, G-14, G-26, G-38, G-39, G-44 with G-49, and G-11 with the gaps linked to it.

## 4. What these answers do not change

- **No result changes.** No capability, gap or defect result changes to PASS because of these answers. Coverage checked against source or reached by simulating a request is not functional verification, and a deferred gap stays unverified until its closure condition holds.
- **Defects stay open.** SD-17, SD-18, SD-19 and SD-20 stay open, and their failing results are kept. Nothing is reported to Spree.
- **Tenant isolation** stays NOT_RUN in every batch, with ISO-1 to ISO-7 open.
- **Criteria.** Only criterion 1.6 of P8 and criterion 15 of catalog part 2 change, by the owner's answers to rows E and A. Every other criterion and tolerance stays as it was.
- **Hosting.** Rows C and D decide the storefront's test host only. Where the host application lives for development and hosting stays FB-05's open question.
- **Liquorify-specific work** stays deferred until the baseline is complete, and the proposed entry criteria stay proposed.

## 5. Later the same day

On 2026-11-04 the owner sent three more answers and one report. Each is recorded against its own ID.

| ID | The owner's answer, 2026-11-04 | Recorded in |
|---|---|---|
| Storefront #23, FB-06's step 2.2 | The CI workflow change in storefront #23 may merge under the delegation, with no further personal review by the owner. Before it merges, its technical review is completed, the branch is brought up to date with any conflicts resolved, and two passing browser-test runs are recorded on its final revision. Main is checked after the merge. It does not depend on OA-6 | [Foundation lane §3](../work-items/foundation-lane-security-audit-and-storefront-backend.md#3-risk-and-release-impact); [FB-06](../LIQ-004-foundation-backlog.md#backlog) |
| Row F: G-37 with G-68 | G-37 and G-68 are added to the platform batch's step P9. The scope covers the store address dialog, saving the storefront address, following the payment method task's link, and Getting Started showing the tasks done after a reload. The tests, their expected results and the closure conditions are recorded before implementation, failures and defects stay visible, and these checks support no tenant-isolation claim | [P9, item 1.4](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration); G-37; G-68 |
| Catalog part 3 and batch 9 | Both continue. Their records keep local results apart from CI results. The next eligible approved work starts as capacity opens | Each batch's own record |
| OA-6 | The owner reported the setting saved. FB-11's security audit repair continues, checks that the workflow can open its pull request, and records the result. It is not read from here, because this environment cannot read the repository's Actions settings | [OA-6](../LIQ-004-foundation-backlog.md#owner-actions); FB-11; [Foundation lane §5](../work-items/foundation-lane-security-audit-and-storefront-backend.md#5-questions-for-the-owner-and-the-owners-answers) |

**What this does not change.** G-37 and G-68 stay open until P9's record meets their closure condition. P9's test of a value that is not an address fails on SD-7 until SD-7 is fixed, and that failing result is kept. Item 1.4 runs within one store and claims nothing about ISO-6 or any other isolation finding. Every other unanswered owner decision stays pending.
