---
title: The owner's answers to row 36, the behaviours batch 9 and catalog part 3 recorded
record: owner decisions
work_item: FB-19 (batch 9, catalog and pricing part 3, P9), SD-22, SD-26, SD-27, SD-41, SD-42, SD-43, G-84
date: 2026-11-09
recorded_by: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: On 2026-11-09 the owner answered row 36 of the decision brief in full, in two messages, and approved the severities in a third. Six of the 47 behaviours that batch 9 and part 3 of the catalog and pricing batch recorded are now tracked as defects, each with its fix deferred until after the baseline. They are batch 9's B18 as SD-22, B12 as SD-41, B13 as SD-42 and B16 as SD-43, all four Medium, and part 3's B2 as SD-26 and B14 as SD-27, both Low, each severity set or approved by the owner. Each fix must come with a meaningful regression test that shows the defect before the fix and passes after it. SD-22, SD-41 and SD-42 are display defects; nothing here shows that a card lost funds or that the server calculated or charged a wrong amount. The other 41 behaviours stay recorded observations for later product review; this does not approve them as correct or acceptable for release. Promotion-code uniqueness and how an erased customer's financial records are kept do not change without an explicit product decision. Four capabilities gain failing parts and stay PARTIAL. No result changes to PASS, and tenant isolation stays NOT_RUN
---

# The owner's answers to row 36, the behaviours batch 9 and catalog part 3 recorded

**What this records.** Batch 9, the storefront's cart and checkout ([record §8](2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#8-behaviour-found-recorded-and-not-changed)), recorded 20 behaviours, B1 to B20. Part 3 of the catalog and pricing batch, promotions, gift cards and store credit ([record §6](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md#6-behaviour-found-recorded-and-not-changed)), recorded 27, B1 to B27. Each was recorded as how Spree or the storefront behaves, and none was counted as a defect. Row 36 of the owner decision brief asked whether batch 9's B18 becomes a defect, and what becomes of the other behaviours the two records list ([record §3](2026-11-04-owner-decision-brief-answers-3.md#3-what-stays-pending)).

The owner answered on 2026-11-09 in two messages, and approved the severities in a third. The first, at 21:19 UTC, answered SD-26 and SD-27, part 3's B2 and B14, as its item 5. That answer is listed with that message's other decisions in [the owner's fourth set of answers](2026-11-09-owner-decision-brief-answers-4.md) and recorded in [P9 part 4's record §8](2026-11-05-fb-19-platform-p9-part-4.md#8-the-owners-answer-to-row-36-2026-11-09). The second, at 21:35 UTC, answered the rest of row 36. The third, at 21:43 UTC, approved Medium for SD-41, SD-42 and SD-43 and set conditions for their fixes. This record gives all three and lists every behaviour row 36 covers and what it now is. Under D5, an answer recorded here is the owner's approval, its date and its scope.

The defect numbers were assigned without duplicates. SD-22 is the number the owner named. SD-41, SD-42 and SD-43 were the next unused numbers, confirmed with the baseline audit, which keeps the register of numbers. SD-15, SD-16 and SD-32 stay held for other rows.

## 1. The owner's words

The first message, item 5:

> SD-26 and SD-27: Accept both as Low-severity defects and keep their fixes deferred. Accept their documented failures as baseline exceptions for G-84 under P9's existing closure rule. Record that decision explicitly, retain the failing tests and keep affected functional results FAIL/PARTIAL.

The second message:

> Please record the remaining row 36 decisions:
>
> * Batch 9 B18: track as SD-22, a Medium-severity display defect. The order page reports the wrong remaining gift-card balance. Preserve the evidence that the card’s actual balance remained correct; do not describe this as lost funds.
> * Batch 9 B12 and B13: track the inconsistent line/subtotal presentation and unclear tax-included presentation as checkout display defects. Keep display correctness separate from whether the server calculated or charged the wrong amount, which this evidence does not establish.
> * Batch 9 B16: track missing visible keyboard focus as an accessibility defect.
>
> Assign unused defect IDs where needed and avoid duplicates. These decisions authorize recording the defects, with fixes deferred until after the baseline.
> Keep the other listed behaviours as recorded observations for later product review. This does not approve them as correct or acceptable for release. In particular, do not change promotion-code uniqueness or erased-customer financial-record handling without an explicit product decision.
> Continue #88’s merge under the existing delegation once its checks pass. Keep G-84’s accepted exceptions and the failing test results recorded as agreed.

The third message:

> Approve Medium severity for SD-41, SD-42 and SD-43. SD-22 remains Medium.
>
> Proceed with the records-only PR after #88 merges, under the existing delegation. All four defects remain open, with fixes deferred until after the baseline. The other 41 behaviours remain observations for later product review, not approved as correct.
>
> Keep existing failing test results unchanged. Run the required repository checks on the final commit and verify the record links. No additional application test run is needed solely for these documentation changes.
>
> Each eventual fix must include a meaningful regression test that demonstrates the defect before the fix and passes afterward. Reassess severity if later evidence establishes incorrect charging or a blocked checkout.

## 2. The six defects

Each is in [LIQ-004's defect table](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline), where its row gives where it was seen, how often and what follows. Each fix is deferred until after the baseline, in its own pull request. None is reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)), and none is a security or tenant-isolation finding.

| Defect | From | What it is | Severity | Capability it is a failing part of |
|---|---|---|---|---|
| SD-22 | Batch 9's B18 | The order placed page reports the wrong remaining balance for a gift card: "Applied $94.99 — $0.00 remaining" shows the remainder of the store credit Spree made for order R1010, not of the card | Medium, set by the owner | CAP-05-13 |
| SD-41 | Batch 9's B12 | Checkout presents its line items and subtotal inconsistently: each line includes what the order adds or takes off, the subtotal does not, so the lines do not add up, and a coupon's discount is listed twice | Medium, approved by the owner | CAP-07-11 and CAP-05-12 |
| SD-42 | Batch 9's B13 | With prices that include tax, the cart and checkout show the tax in a plain "Tax" row, as if it were added, though the total does not grow | Medium, approved by the owner | CAP-07-11 |
| SD-43 | Batch 9's B16 | The storefront's radio buttons and checkboxes show no visible keyboard focus | Medium, approved by the owner | CAP-06-01 |
| SD-26 | Part 3's B2 | A promotion whose request fails reads "Loading…" without end | Low, set by the owner | CAP-05-12 |
| SD-27 | Part 3's B14 | A partly redeemed gift card's sheet names its customer by a raw identifier | Low, set by the owner | CAP-05-13 |

**SD-22 is a wrong figure on the screen, not lost funds.** The card's actual balance stayed correct. FIDELITY-WHOLE-500, a $500.00 card, paid R1010's $94.99 and kept the rest of its balance, as the server's answer and the dashboard's gift card list, DA-LOY-01 "balances after orders", showed ([batch 9's record §6](2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#6-settings-saved-in-the-dashboard-seen-at-checkout-criterion-14-g-38s-and-g-71s-checkout-part)). That evidence is kept as it was recorded.

**SD-41 and SD-42 concern what the screens display.** The evidence shows the amounts checkout and the cart displayed. It does not establish that the server calculated or charged a wrong amount, and nothing here claims that it did. That includes the tax on shipping B12 also saw: the tax went from $7.20 on the cart page to $7.60 at checkout once $5.00 shipping was added, and whether that is right is not established.

**SD-43 is an accessibility defect.** It was seen in the stories and read in the two components' code. A keyboard was not driven through checkout.

**The severities.** The owner set Medium for SD-22 and Low for SD-26 and SD-27 in the first two messages. Medium was then proposed for SD-41, SD-42 and SD-43 by LIQ-004's table of meanings, where Medium is a task that completes while the screen shows wrong or misleading information, and the owner approved it in the third message.

**The fixes of SD-22, SD-41, SD-42 and SD-43.** Each fix is made after the baseline, in its own pull request, and must include a meaningful regression test that shows the defect before the fix and passes after it. A defect's severity is reassessed if later evidence shows a wrong amount charged or a checkout that cannot be completed.

**SD-26 and SD-27 and G-84.** As the first message says, their documented failures, P9 part 4's tests 21 and 28, are accepted as baseline exceptions for G-84 under P9's closure rule. G-84 closed on 2026-11-09 and P9 is complete, with both tests kept and failing ([P9 part 4's record §8](2026-11-05-fb-19-platform-p9-part-4.md#8-the-owners-answer-to-row-36-2026-11-09)).

## 3. The other 41 behaviours, kept as recorded observations

These stay as their records describe them, as observations for later product review. Keeping them as observations does not approve any of them as correct or acceptable for release. None is a defect, and none is changed.

| Record | Behaviours | Count |
|---|---|---|
| Batch 9 ([§8](2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#8-behaviour-found-recorded-and-not-changed)) | B1 to B11, B14, B15, B17, B19 and B20 | 16 |
| Part 3 of the catalog and pricing batch ([§6](2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md#6-behaviour-found-recorded-and-not-changed)) | B1, B3 to B13, and B15 to B27 | 25 |

The brief listed some of these as affecting someone directly, and they stay observations too: batch 9's B5, Credit Card chosen first though the storefront cannot take it, and B8, the Store Credit method that checkout never lists; and part 3's B1, a promotion page that never loads for a teammate who may only read promotions, and B3, lists that look empty when they are refused or fail to load.

Two need an explicit product decision before anything about them changes:

- **Promotion-code uniqueness**, part 3's B13. Spree accepts a second promotion with a coupon code another promotion already has, and its own spec expects it. Nothing is changed about whether codes must be unique.
- **How an erased customer's financial records are kept**, part 3's B17 and B18. Erasing a shopper's data clears their store credit's memo and keeps the credit and its balance, still counted as owed. Nothing is changed about whether such a credit is kept, written off or refunded.

## 4. What these answers change, and what they do not

- **Defects.** LIQ-004 gains SD-22, SD-41, SD-42 and SD-43, each open at Medium with its fix deferred, and each fix needing its regression test. SD-26 and SD-27 were recorded in #88. Nothing is fixed, and no storefront or Spree code, test or workflow changes.
- **Capabilities.** CAP-05-12, CAP-05-13, CAP-07-11 and CAP-06-01 stay PARTIAL, each now with the failing parts §2 gives. No capability changes to PASS, and none changes to FAIL.
- **Flows.** FL-05, FL-16 and FL-17, whose checkout and dashboard steps these behaviours were seen on, keep their statuses, PARTIAL.
- **The two records.** Batch 9's and part 3's records keep their behaviour tables as they were recorded. This record says what each behaviour now is.
- **Row 36 is answered.** No part of it stays pending.
- **Test results.** Existing failing test results stay as they were recorded, P9 part 4's tests 21 and 28 among them. Nothing was run again for this record: by the owner's instruction, these documentation changes need no extra application test run.
- **Still open.** Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open. Real providers stay with P4. Simulated and source-reviewed coverage stay distinct from functional verification.
