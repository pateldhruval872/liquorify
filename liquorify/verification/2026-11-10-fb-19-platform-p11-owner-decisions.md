---
title: The owner's answers on P11's held defects, its tally and the held replacement
record: owner decisions
work_item: FB-19 (platform batch, P11 and P4), SD-32, SD-57 to SD-59, SD-71, SD-82 to SD-84, G-87, G-90, G-92
date: 2026-11-10
recorded_by: Claude (automated session); not independent review
result: On 2026-11-10 the owner accepted SD-57, SD-58 and SD-59 as Low existing defects and SD-71 as Medium; accepted SD-32 as a High defect, an incomplete payment-link capability, with its fix deferred and FL-08's payment steps kept failing or unavailable; and had batch 8 part 1's B10 and B13 recorded as Low defects and B14 as Medium, numbered SD-82, SD-83 and SD-84. Every failing test is kept and no failing capability becomes PASS. G-87 is CLOSED under its closing rule. G-90 stays OPEN for 2.3 alone and G-92 for 3.11 alone, both DEFERRED to P4. Part 3's tally is corrected to 10 passing, 4 failing and 1 deferred to P4. The replacement held after a refund stays an observation until a bounded check, recorded in part 3's record, has run in its own pull request
---

# The owner's answers on P11's held defects, its tally and the held replacement

**What this records.** P11's three parts ran on 2026-11-10 ([part 1](2026-11-10-fb-19-platform-p11-part-1.md), [part 2](2026-11-10-fb-19-platform-p11-part-2.md), [part 3](2026-11-10-fb-19-platform-p11-part-3.md)). Each left failures held for the owner. On 2026-11-10 the owner answered them in writing, in items 1 and 2 of one message. That message's other items, on the marketplace batch, are recorded with that batch. Under D5, an answer recorded here is the owner's approval, its date and its scope. The owner also asked that approved defects stay open and that production fixes wait until after the baseline.

## 1. Each answer and where it is recorded

| ID | The owner's answer, 2026-11-10 | Recorded in |
|---|---|---|
| SD-57, SD-58, SD-59 | Accepted as Low existing defects | Their rows in [LIQ-004's existing defects](../LIQ-004-foundation-backlog.md) |
| SD-71 | Accepted as a Medium existing defect | Its row in LIQ-004 |
| SD-32, row 39 of the owner decision brief | Recorded as a High defect: the payment link is an incomplete capability. Its fix is deferred, and FL-08's payment steps stay failing or unavailable | A new row in LIQ-004, which replaces the note that held it; FL-08's and CAP-06-04's summaries in LIQ-004 |
| Batch 8 part 1's B10, B13 and B14 | Recorded as defects. B10, a refused gift card with no explanation, is Low. B13, a quantity check with no useful reason, is Low. B14, unsaved edits lost on leaving the page, is Medium. The baseline audit numbered them SD-82, SD-83 and SD-84 | New rows in LIQ-004 |
| The failing tests | Kept unchanged: 1.9, 1.11, 2.8, 2.9, 2.15, 2.17, 2.19, 2.20, 2.21, 3.2, 3.7, 3.12 and 3.13 | Nothing in the tests changes |
| G-87 | Closed under its recorded closing rule: its 12 actions pass, or fail only on SD-23 (1.11) and SD-57 (1.9) | Its row in LIQ-004; part 1's record |
| G-90 | Kept deferred for 2.3, approving a risky order, assigned to P4 | Its row in LIQ-004; P4's row in the [platform work item](../work-items/fb-19-batch-platform.md#5-when-each-check-runs); part 2's record |
| G-92 | Kept deferred for 3.11, buying a return label, in P4 | Its row in LIQ-004; part 3's record |
| Part 3's tally | Corrected: its table shows 10 passing actions, 4 failing and 1 deferred to P4. The record had said nine pass | Part 3's record §6 and its result; G-92's row in LIQ-004; the platform work item |
| The held replacement after a refund | Not approved as intended. A bounded check is added to tell a refund and a replacement for the same item apart from a refund on one claim and a legitimate replacement on another, recording item quantities, refunds and amounts due. It stays an observation until that evidence exists. No production change | [Part 3's record §4.4](2026-11-10-fb-19-platform-p11-part-3.md#44-the-bounded-check-for-the-held-replacement) |

## 2. What it changes for P11

- **No failing capability becomes PASS.** The functional results each failure touches stay FAIL or PARTIAL. FL-08 stays PARTIAL with a failing part, and CAP-06-04 and CAP-06-07 stay PARTIAL.
- **G-87 is CLOSED.** It is the first of P11's three gaps to close.
- **G-90 and G-92 stay OPEN, one action each, DEFERRED to P4.** Action 2.3 needs an order Spree marks risky, which only a payment's failed or risky checks do; P4 holds the real payment provider. Action 3.11 buys a return label from a real carrier.
- **P11's own runs are done.** Its remaining two actions are P4's. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.

## 3. What is not changed

No Spree code, Spree test, workflow or production setting changes. The defects are not reported to Spree, by the owner's standing instruction (decisions 21 and 37). None is a security or tenant-isolation finding. The bounded check is recorded here before it runs, and runs in its own pull request.
