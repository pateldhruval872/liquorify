---
title: The owner's fourth set of answers to the owner decision brief
record: owner decisions
work_item: FB-19 (batch 3's media picker images, batch 6, batch 8, batches 10 and 11, P4, P9, P11, P12), FB-03, SD-26, SD-27, G-11, G-84, G-87, G-90 to G-95
date: 2026-11-09
recorded_by: Claude (automated session); not independent review
result: On 2026-11-09 the owner answered in one message, in six items. Item 3 adds P11, a bounded browser-test follow-up for G-87, G-90 and G-92. Item 4 approves G-92's assignment to it, defers G-93 to the comparison follow-up with each story named and its provider-specific stories assigned to P4, accepts G-94 as simulated interface-state coverage only, and links G-95, with G-91's outstanding requests, to G-11 through P12, a named follow-up to P10. Items 1, 2 and 5 are recorded where their work is. Recording item 6, FB-03, is blocked by the platform's safety classifier, so that work is paused and only its status is recorded. No capability, gap or defect result changes to PASS because of these answers. Tenant isolation stays NOT_RUN, and G-85, G-86, G-88, G-89 and every other unanswered decision stay pending.
---

# The owner's fourth set of answers to the owner decision brief

**What this records.** The owner decision brief is kept in the project workspace and lists the questions only the owner can answer. Batch 8's part 2 merged on 2026-11-08 (#84). On 2026-11-09 the owner answered in writing, in six items:

1. **#77:** batch 3's two new media picker reference images.
2. **Batches 10 and 11:** whether they start.
3. **The outstanding browser tests:** G-87, G-90 and G-92 (rows 37 and 40 of the brief).
4. **Batch 8's gaps:** G-91 to G-95 (row 40).
5. **SD-26 and SD-27:** part of row 36.
6. **FB-03:** its validation report.

The owner asked that the approved baseline work then resume under the delegation of 2026-11-04, within the three-lane limit. Later the same day the owner asked that the FB-03 work stay paused, with its status tracked as item 6 gives it.

Each answer is recorded against its own ID in the document that owns that ID, and §1 says where. This record is the single list. Under D5, an answer recorded here is the owner's approval, its date and its scope.

## 1. Each answer and where it is recorded

| Item | ID | The owner's answer, 2026-11-09 | Recorded in |
|---|---|---|---|
| 1 | #77, batch 3's media picker images | The owner delegated acceptance of both new reference images. The supplied comparisons are reviewed, delegated acceptance is recorded, and #77 merges once the agreed checks and visual evidence hold on its final revision. The tolerance stays at 25, and the change stays scoped to that story. The record is corrected to describe every measured difference: the dark image's table includes pixels beyond the photo's corners | #77 and its own record |
| 2 | Batches 10 and 11 | Both start, within the approved Spree baseline scope: the dashboard's customers, then the home figures, reports and email templates, running independently where their dependencies permit. Each work item's scope and acceptance criteria are set before implementation. At most three implementation lanes run | Each batch's work item; [LIQ-004's backlog](../LIQ-004-foundation-backlog.md#backlog) |
| 3 | G-87, G-90, G-92 | A bounded platform follow-up is added for the three gaps. It lists every outstanding action, its dependencies, its expected result and its closure condition. Known-defect failures are kept, and real-provider work stays with P4 | The platform work item's step [P11](../work-items/fb-19-batch-platform.md#p11-browser-tests-for-inventory-orders-and-what-happens-after-the-sale); each gap in [LIQ-004's gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) |
| 4 | G-91 to G-95 | G-92's assignment to P11 is approved. G-93 is deferred to the existing comparison follow-up, with each remaining story identified (§3) and its provider-specific states assigned to P4. G-94 is accepted as simulated interface-state coverage only. G-95 is linked to G-11 through a named follow-up to the completed P10 work, which also holds G-91's outstanding requests, without implying that P10 tested them | P11; the platform work item's step [P12](../work-items/fb-19-batch-platform.md#p12-the-order-refusals-a-follow-up-to-p10); each gap in LIQ-004's gap register; §3 of this record |
| 5 | SD-26, SD-27, G-84 | Both are accepted as Low-severity defects, and their fixes stay deferred. Their documented failures are accepted as baseline exceptions for G-84 under P9's existing closure rule. The failing tests are kept, and the affected functional results stay FAIL or PARTIAL | [SD-26 and SD-27](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) and G-84 in LIQ-004, and P9 part 4's record, in their own pull request |
| 6 | FB-03 | The report and its reproduction evidence stay private. The owner gave decisions on it in the conversation. Recording those decisions and preparing the remediation plan are blocked by the platform's safety classifier, so the FB-03 work is paused until that block is resolved through the platform's support or review process. This is not a failed validation, and the decisions are not missing. No fix has started, ISO-1 to ISO-7 stay open, and a multi-tenant release stays blocked. Which candidates are accepted, and who owns a shopper account, stay pending. This repository records only that status | [FB-03's status](../LIQ-004-foundation-backlog.md#open-isolation-findings) in LIQ-004; the private evidence stays in the project files as it is |

## 2. Work items and closure conditions

| Gap | Kind | Work item | Closes when |
|---|---|---|---|
| G-87 | Function, browser tests | P11, actions 1.1 to 1.12 | Every action has a browser test that passes in both recorded runs, or fails only on SD-23 (action 1.11) or on another defect recorded under P11's criterion 4 |
| G-90 | Function, browser tests | P11, actions 2.1 to 2.21 | As G-87, with SD-34 kept where a test reads the Summary card's rows. Action 2.21, the payment link, follows the owner's answer to row 39 (SD-32). Action 2.3 left NOT_RUN keeps G-90 open |
| G-92 | Function, browser tests | P11, actions 3.1 to 3.15. Buying a return label, action 3.11, stays with P4 | Actions 3.1 to 3.10 and 3.12 to 3.15 pass, or fail only on SD-35, SD-36, SD-37 or another defect recorded under P11's criterion 4. G-92 then stays open for action 3.11 alone, DEFERRED to P4 |
| G-91 | Function, refusals | P12, request 1, linked to G-11 | P12's evidence passes for every request it names, in both recorded runs. A refused caller answered with a success, or with the protected record's values, is a defect and a security finding for the owner |
| G-95 | Function, refusals | P12, request 2, linked to G-11 | As G-91 |
| G-93 | Coverage, comparisons | The [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches), as G-58, for its 147 stories that a dashboard screen can show. Its 15 provider-specific stories go to P4 | Every story it holds has been compared with a running screen in a later batch's image review list, or, for the 15, in P4's run with real provider responses. When the last of those batches merges, a story still not compared keeps its status, and the gap stays DEFERRED for it, named in §3 |

**Accepted, not deferred.** G-94 is simulated interface-state coverage only, as G-54, G-59 and G-82. Its four states were reached by answering a request in the browser, and the server's behaviour in them is not verified.

**Which P10 and P11 are.** P10 ran on 2026-11-05 and its record is unchanged: it sent no request of G-91 or G-95 and claims nothing about them. P11's actions and P12's requests are listed, with their dependencies and expected results, in the platform work item, and neither step has run.

**How these gaps close.** Under the delegation of 2026-11-04, a gap closes only on passing evidence for its recorded condition. That closing is recorded as delegated acceptance, not as the owner's review. A failure on a behaviour a batch recorded that the owner has not made a defect is held for the owner's answer. Anything else comes back to the owner.

## 3. G-93's remaining stories

Batch 8's part 2 left 162 of its 212 stories not compared with a running screen by the script: 68 seen in a capture or in the settings check, and 94 checked against their source only ([image review list](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2-image-review.md)). Each keeps the status the image review list gives it until it is compared. The 15 marked P4 show what only a real provider's answer produces: a bought label and its customs paperwork, a label's refund, shipping documents and every carrier status. The other 147 go to the comparison follow-up, for the later batches whose running screens show them.

| # | Inventory ID | Story | Status | Goes to |
|---|---|---|---|---|
| S2 | CMP-DUI-C-08 | Claim resolve dialog: Resolutions open | Seen in a capture | Comparison follow-up |
| S3 | CMP-DUI-C-08 | Claim resolve dialog: Refund, to the original payment | Checked against its source | Comparison follow-up |
| S4 | CMP-DUI-C-08 | Claim resolve dialog: Refund, part of the amount | Checked against its source | Comparison follow-up |
| S5 | CMP-DUI-C-08 | Claim resolve dialog: Nothing to refund | Checked against its source | Comparison follow-up |
| S6 | CMP-DUI-C-08 | Claim resolve dialog: Replacement | Checked against its source | Comparison follow-up |
| S7 | CMP-DUI-C-08 | Claim resolve dialog: Replacement, as the claim asked | Checked against its source | Comparison follow-up |
| S8 | CMP-DUI-C-08 | Claim resolve dialog: Refund and replacement | Checked against its source | Comparison follow-up |
| S9 | CMP-DUI-C-08 | Claim resolve dialog: Saving | Checked against its source | Comparison follow-up |
| S11 | CMP-DUI-C-16 | Delivery form dialog: Edit | Seen in a capture | Comparison follow-up |
| S12 | CMP-DUI-C-16 | Delivery form dialog: Unlisted carrier | Checked against its source | Comparison follow-up |
| S13 | CMP-DUI-C-16 | Delivery form dialog: Carrier list open | Seen in a capture | Comparison follow-up |
| S14 | CMP-DUI-C-16 | Delivery form dialog: Carrier searched | Checked against its source | Comparison follow-up |
| S15 | CMP-DUI-C-16 | Delivery form dialog: Tracking number refused | Checked against its source | Comparison follow-up |
| S16 | CMP-DUI-C-16 | Delivery form dialog: Saving | Checked against its source | Comparison follow-up |
| S17 | CMP-DUI-C-23 | Fulfill items form: All units | Seen in a capture | Comparison follow-up |
| S18 | CMP-DUI-C-23 | Fulfill items form: Some units | Seen in a capture | Comparison follow-up |
| S19 | CMP-DUI-C-23 | Fulfill items form: Item unticked | Checked against its source | Comparison follow-up |
| S20 | CMP-DUI-C-23 | Fulfill items form: Nothing picked | Checked against its source | Comparison follow-up |
| S21 | CMP-DUI-C-23 | Fulfill items form: With tracking | Seen in a capture | Comparison follow-up |
| S22 | CMP-DUI-C-23 | Fulfill items form: Carrier list open | Seen in a capture | Comparison follow-up |
| S23 | CMP-DUI-C-23 | Fulfill items form: Units no row can name | Checked against its source | Comparison follow-up |
| S24 | CMP-DUI-C-23 | Fulfill items form: Empty | Checked against its source | Comparison follow-up |
| S25 | CMP-DUI-C-23 | Fulfill items form: Refused | Checked against its source | Comparison follow-up |
| S26 | CMP-DUI-C-23 | Fulfill items form: Saving | Checked against its source | Comparison follow-up |
| S29 | CMP-DUI-C-24 | Fulfillment edit dialog: Method list open | Seen in a capture | Comparison follow-up |
| S30 | CMP-DUI-C-24 | Fulfillment edit dialog: Origin moved | Seen in a capture | Comparison follow-up |
| S31 | CMP-DUI-C-24 | Fulfillment edit dialog: No rates | Checked against its source | Comparison follow-up |
| S32 | CMP-DUI-C-24 | Fulfillment edit dialog: Quoted after review | Checked against its source | Comparison follow-up |
| S33 | CMP-DUI-C-24 | Fulfillment edit dialog: No origin | Checked against its source | Comparison follow-up |
| S34 | CMP-DUI-C-24 | Fulfillment edit dialog: Saving | Checked against its source | Comparison follow-up |
| S35 | CMP-DUI-C-25 | Fulfillment item list: Default | Seen in a capture | Comparison follow-up |
| S36 | CMP-DUI-C-25 | Fulfillment item list: Price source | Seen in a capture | Comparison follow-up |
| S37 | CMP-DUI-C-25 | Fulfillment item list: Name and count only | Seen in a capture | Comparison follow-up |
| S38 | CMP-DUI-C-25 | Fulfillment item list: Long names | Checked against its source | Comparison follow-up |
| S40 | CMP-DUI-C-26 | Fulfillment panel: Fulfilled | Seen in a capture | Comparison follow-up |
| S41 | CMP-DUI-C-26 | Fulfillment panel: Delivered | Seen in a capture | Comparison follow-up |
| S42 | CMP-DUI-C-26 | Fulfillment panel: Canceled | Seen in a capture | Comparison follow-up |
| S43 | CMP-DUI-C-26 | Fulfillment panel: Named status | Checked against its source | Comparison follow-up |
| S44 | CMP-DUI-C-26 | Fulfillment panel: Long location | Checked against its source | Comparison follow-up |
| S45 | CMP-DUI-C-26 | Fulfillment panel: Bare | Checked against its source | Comparison follow-up |
| S47 | CMP-DUI-C-29 | Label upload dialog: Filled | Checked against its source | Comparison follow-up |
| S48 | CMP-DUI-C-29 | Label upload dialog: Without currency | Checked against its source | Comparison follow-up |
| S49 | CMP-DUI-C-29 | Label upload dialog: Refused | Checked against its source | Comparison follow-up |
| S50 | CMP-DUI-C-29 | Label upload dialog: Cost refused | Checked against its source | Comparison follow-up |
| S51 | CMP-DUI-C-29 | Label upload dialog: Saving | Checked against its source | Comparison follow-up |
| S53 | CMP-DUI-C-33 | Post-sale create dialogs: Return, filled in | Checked against its source | Comparison follow-up |
| S54 | CMP-DUI-C-33 | Post-sale create dialogs: Return, locations open | Seen in a capture | Comparison follow-up |
| S55 | CMP-DUI-C-33 | Post-sale create dialogs: Return, units and note only | Checked against its source | Comparison follow-up |
| S56 | CMP-DUI-C-33 | Post-sale create dialogs: Return, saving | Checked against its source | Comparison follow-up |
| S58 | CMP-DUI-C-33 | Post-sale create dialogs: Claim, filled in | Seen in a capture | Comparison follow-up |
| S59 | CMP-DUI-C-33 | Post-sale create dialogs: Claim, two lines | Checked against its source | Comparison follow-up |
| S60 | CMP-DUI-C-33 | Post-sale create dialogs: Claim, saving | Checked against its source | Comparison follow-up |
| S62 | CMP-DUI-C-34 | Post-sale fields: Chosen | Checked against its source | Comparison follow-up |
| S63 | CMP-DUI-C-34 | Post-sale fields: Reasons open | Seen in a capture | Comparison follow-up |
| S64 | CMP-DUI-C-34 | Post-sale fields: With a "no reason" choice | Checked against its source | Comparison follow-up |
| S65 | CMP-DUI-C-34 | Post-sale fields: No reasons kept | Seen in a capture | Comparison follow-up |
| S66 | CMP-DUI-C-34 | Post-sale fields: No reasons kept, with a "no reason" choice | Checked against its source | Comparison follow-up |
| S68 | CMP-DUI-C-43 | Return dialogs: Receive, partly and not resellable | Seen in a capture | Comparison follow-up |
| S69 | CMP-DUI-C-43 | Return dialogs: Receive, saving | Checked against its source | Comparison follow-up |
| S71 | CMP-DUI-C-43 | Return dialogs: Refund, tax included | Seen in a capture | Comparison follow-up |
| S72 | CMP-DUI-C-43 | Return dialogs: Refund, to store credit | Seen in a capture | Comparison follow-up |
| S73 | CMP-DUI-C-43 | Return dialogs: Refund, methods open | Seen in a capture | Comparison follow-up |
| S75 | CMP-DUI-C-43 | Return dialogs: Refund, saving | Checked against its source | Comparison follow-up |
| S77 | CMP-DA-G-11 | Fulfillment deliveries: Several | Seen in a capture | Comparison follow-up |
| S78 | CMP-DA-G-11 | Fulfillment deliveries: Every carrier status | Checked against its source | P4 |
| S79 | CMP-DA-G-11 | Fulfillment deliveries: Menu open | Seen in a capture | Comparison follow-up |
| S80 | CMP-DA-G-11 | Fulfillment deliveries: Arrived, menu open | Checked against its source | Comparison follow-up |
| S81 | CMP-DA-G-11 | Fulfillment deliveries: From a label, menu open | Checked against its source | Comparison follow-up |
| S82 | CMP-DA-G-11 | Fulfillment deliveries: Remove confirmation | Seen in a capture | Comparison follow-up |
| S84 | CMP-DA-G-11 | Fulfillment delivery dialog: Edit | Seen in a capture | Comparison follow-up |
| S85 | CMP-DA-G-11 | Fulfillment delivery dialog: Edit, unlisted carrier | Checked against its source | Comparison follow-up |
| S86 | CMP-DA-G-11 | Fulfillment delivery dialog: Spree's carriers | Seen in a capture | Comparison follow-up |
| S87 | CMP-DA-G-11 | Fulfillment delivery dialog: Carriers loading | Checked against its source | Comparison follow-up |
| S88 | CMP-DA-G-11 | Fulfillment delivery dialog: Number already on the parcel | Checked against its source | Comparison follow-up |
| S89 | CMP-DA-G-11 | Fulfillment delivery dialog: Saving | Checked against its source | Comparison follow-up |
| S91 | CMP-DA-G-11 | Fulfillment edit dialog: Locations, by stock | Seen in a capture | Comparison follow-up |
| S92 | CMP-DA-G-11 | Fulfillment edit dialog: Delivery methods | Seen in a capture | Comparison follow-up |
| S93 | CMP-DA-G-11 | Fulfillment edit dialog: Origin moved | Seen in a capture | Comparison follow-up |
| S94 | CMP-DA-G-11 | Fulfillment edit dialog: Moving | Checked against its source | Comparison follow-up |
| S95 | CMP-DA-G-11 | Fulfillment edit dialog: No rates | Checked against its source | Comparison follow-up |
| S96 | CMP-DA-G-11 | Fulfillment edit dialog: Freight, quoted after review | Checked against its source | Comparison follow-up |
| S98 | CMP-DA-G-11 | Fulfillment fulfill form: Some units | Seen in a capture | Comparison follow-up |
| S99 | CMP-DA-G-11 | Fulfillment fulfill form: With tracking | Seen in a capture | Comparison follow-up |
| S100 | CMP-DA-G-11 | Fulfillment fulfill form: Carriers open | Seen in a capture | Comparison follow-up |
| S101 | CMP-DA-G-11 | Fulfillment fulfill form: Backordered, refused | Checked against its source | Comparison follow-up |
| S102 | CMP-DA-G-11 | Fulfillment fulfill form: Saving | Checked against its source | Comparison follow-up |
| S104 | CMP-DA-G-11 | Fulfillment label upload dialog: File and figures | Checked against its source | Comparison follow-up |
| S105 | CMP-DA-G-11 | Fulfillment label upload dialog: No file, refused | Seen in a capture | Comparison follow-up |
| S106 | CMP-DA-G-11 | Fulfillment label upload dialog: No tracking number | Seen in a capture | Comparison follow-up |
| S107 | CMP-DA-G-11 | Fulfillment label upload dialog: Uploading | Checked against its source | Comparison follow-up |
| S108 | CMP-DA-G-11 | Fulfillment label upload dialog: Refused | Checked against its source | Comparison follow-up |
| S109 | CMP-DA-G-11 | Fulfillment label upload dialog: Saving | Checked against its source | Comparison follow-up |
| S112 | CMP-DA-G-11 | Fulfillments card: No items | Checked against its source | Comparison follow-up |
| S113 | CMP-DA-G-11 | Fulfillments card: Placed, items still to fulfil | Checked against its source | Comparison follow-up |
| S114 | CMP-DA-G-11 | Fulfillments card: Add fulfilment | Checked against its source | Comparison follow-up |
| S115 | CMP-DA-G-11 | Fulfillments card: Add fulfilment, refused | Checked against its source | Comparison follow-up |
| S118 | CMP-DA-G-11 | Fulfillments card: Mark as fulfilled | Seen in a capture | Comparison follow-up |
| S119 | CMP-DA-G-11 | Fulfillments card: Edit dialog | Seen in a capture | Comparison follow-up |
| S121 | CMP-DA-G-11 | Fulfillments card: Split, would empty the parcel | Seen in a capture | Comparison follow-up |
| S122 | CMP-DA-G-11 | Fulfillments card: Split confirmation | Checked against its source | Comparison follow-up |
| S124 | CMP-DA-G-11 | Fulfillments card: Add tracking, before it ships | Seen in a capture | Comparison follow-up |
| S125 | CMP-DA-G-11 | Fulfillments card: Upload label | Seen in a capture | Comparison follow-up |
| S129 | CMP-DA-G-11 | Fulfillments card: Freight, quoted after review | Checked against its source | Comparison follow-up |
| S130 | CMP-DA-G-11 | Fulfillments card: No delivery method or cost | Checked against its source | Comparison follow-up |
| S132 | CMP-DA-G-11 | Fulfillments card: Label to buy | Checked against its source | P4 |
| S133 | CMP-DA-G-11 | Fulfillments card: Buy label confirmation | Checked against its source | P4 |
| S134 | CMP-DA-G-11 | Fulfillments card: Buying a label | Checked against its source | P4 |
| S135 | CMP-DA-G-11 | Fulfillments card: Label bought | Checked against its source | P4 |
| S137 | CMP-DA-G-11 | Fulfillments card: Shipped, menu open | Seen in a capture | Comparison follow-up |
| S139 | CMP-DA-G-11 | Fulfillments card: Every carrier status | Checked against its source | P4 |
| S140 | CMP-DA-G-11 | Fulfillments card: Bought label and customs paperwork | Checked against its source | P4 |
| S142 | CMP-DA-G-11 | Fulfillments card: Partly shipped | Seen in a capture | Comparison follow-up |
| S145 | CMP-DA-G-11 | Line item price source: Price list | Seen in a capture | Comparison follow-up |
| S146 | CMP-DA-G-11 | Line item price source: Catalog | Checked against its source | Comparison follow-up |
| S147 | CMP-DA-G-11 | Line item price source: Price list with no name | Checked against its source | Comparison follow-up |
| S149 | CMP-DA-G-24 | Order post-sale cards: Exchanges, nothing to exchange | Seen in a capture | Comparison follow-up |
| S150 | CMP-DA-G-24 | Order post-sale cards: Exchange requested, menu open | Seen in a capture | Comparison follow-up |
| S151 | CMP-DA-G-24 | Order post-sale cards: Exchange, cancel confirmation | Seen in a capture | Comparison follow-up |
| S152 | CMP-DA-G-24 | Order post-sale cards: Exchange approved, menu open | Checked against its source | Comparison follow-up |
| S155 | CMP-DA-G-24 | Order post-sale cards: Exchange received, same price | Checked against its source | Comparison follow-up |
| S156 | CMP-DA-G-24 | Order post-sale cards: Exchanges, every status | Checked against its source | Comparison follow-up |
| S157 | CMP-DA-G-24 | Order post-sale cards: New exchange | Seen in a capture | Comparison follow-up |
| S159 | CMP-DA-G-24 | Order post-sale cards: Claim open, menu open | Seen in a capture | Comparison follow-up |
| S161 | CMP-DA-G-24 | Order post-sale cards: Claim, cancel confirmation | Seen in a capture | Comparison follow-up |
| S162 | CMP-DA-G-24 | Order post-sale cards: Claim approved, menu open | Checked against its source | Comparison follow-up |
| S163 | CMP-DA-G-24 | Order post-sale cards: Claim, resolve | Seen in a capture | Comparison follow-up |
| S164 | CMP-DA-G-24 | Order post-sale cards: Claim with no amount, resolve | Checked against its source | Comparison follow-up |
| S165 | CMP-DA-G-24 | Order post-sale cards: Claim asking for a replacement, resolve | Checked against its source | Comparison follow-up |
| S167 | CMP-DA-G-24 | Order post-sale cards: Claim resolved by refund | Seen in a capture | Comparison follow-up |
| S168 | CMP-DA-G-24 | Order post-sale cards: Claim resolved by replacement | Seen in a capture | Comparison follow-up |
| S169 | CMP-DA-G-24 | Order post-sale cards: Claims, every status | Checked against its source | Comparison follow-up |
| S170 | CMP-DA-G-24 | Order post-sale cards: New claim | Seen in a capture | Comparison follow-up |
| S172 | CMP-DA-G-24 | Order returns card: Nothing to return against | Seen in a capture | Comparison follow-up |
| S176 | CMP-DA-G-24 | Order returns card: Buy return label confirmation | Seen in a capture | Comparison follow-up |
| S177 | CMP-DA-G-24 | Order returns card: Approved, menu open | Checked against its source | Comparison follow-up |
| S178 | CMP-DA-G-24 | Order returns card: Receive items | Seen in a capture | Comparison follow-up |
| S180 | CMP-DA-G-24 | Order returns card: Refund | Seen in a capture | Comparison follow-up |
| S181 | CMP-DA-G-24 | Order returns card: Refund, tax included | Seen in a capture | Comparison follow-up |
| S182 | CMP-DA-G-24 | Order returns card: Nothing owed, complete | Seen in a capture | Comparison follow-up |
| S184 | CMP-DA-G-24 | Order returns card: Refunded in part | Checked against its source | Comparison follow-up |
| S186 | CMP-DA-G-24 | Order returns card: Label bought, with customs paperwork | Checked against its source | P4 |
| S187 | CMP-DA-G-24 | Order returns card: Returning to another location | Seen in a capture | Comparison follow-up |
| S188 | CMP-DA-G-24 | Order returns card: Every status | Checked against its source | Comparison follow-up |
| S189 | CMP-DA-G-24 | Order returns card: New return | Seen in a capture | Comparison follow-up |
| S191 | CMP-DA-G-24 | Post-sale create dialogs: Return, reasons open | Seen in a capture | Comparison follow-up |
| S192 | CMP-DA-G-24 | Post-sale create dialogs: Return, locations open | Seen in a capture | Comparison follow-up |
| S194 | CMP-DA-G-24 | Post-sale create dialogs: Exchange, replacement searched | Seen in a capture | Comparison follow-up |
| S196 | CMP-DA-G-24 | Post-sale create dialogs: Claim, one mug | Seen in a capture | Comparison follow-up |
| S197 | CMP-DA-G-24 | Post-sale create dialogs: Claim, reasons open | Checked against its source | Comparison follow-up |
| S199 | CMP-DA-G-24 | Post-sale create dialogs: Resolve, claim with no amount | Checked against its source | Comparison follow-up |
| S200 | CMP-DA-G-24 | Post-sale create dialogs: Resolve, replacement asked for | Checked against its source | Comparison follow-up |
| S201 | CMP-DA-G-24 | Post-sale create dialogs: Resolve, two lines | Checked against its source | Comparison follow-up |
| S202 | CMP-DA-G-11 | Shipping documents: Customs | Checked against its source | P4 |
| S203 | CMP-DA-G-11 | Shipping documents: One | Checked against its source | P4 |
| S205 | CMP-DA-G-11 | Shipping label row: Uploaded, menu open | Seen in a capture | Comparison follow-up |
| S206 | CMP-DA-G-11 | Shipping label row: Delete confirmation | Seen in a capture | Comparison follow-up |
| S207 | CMP-DA-G-11 | Shipping label row: Purchased | Checked against its source | P4 |
| S208 | CMP-DA-G-11 | Shipping label row: Refund confirmation | Checked against its source | P4 |
| S209 | CMP-DA-G-11 | Shipping label row: Refunding | Checked against its source | P4 |
| S210 | CMP-DA-G-11 | Shipping label row: Refund requested | Checked against its source | P4 |
| S211 | CMP-DA-G-11 | Shipping label row: Refunded | Checked against its source | P4 |
| S212 | CMP-DA-G-11 | Shipping label row: File not ready | Checked against its source | Comparison follow-up |

## 4. What stays pending

- **Row 36, apart from SD-26 and SD-27:** whether batch 9's B18 becomes a defect (SD-22, held), and the other behaviours batch 9 and part 3 recorded.
- **Row 37's G-85 and G-86, and row 40's G-88 and G-89:** the comparisons and simulated states of batch 6 and batch 8's part 1.
- **Row 38:** the proposed severities of the fifteen other new defects.
- **Row 39:** what the payment link becomes (SD-32, held). P11's action 2.21 follows that answer.
- **Rows 18, 22, 24 and 33:** the earlier behaviours and gaps the owner was asked to classify or close.
- **Rows 25 to 29:** the gaps answered as their batches report, where P5 runs, FB-04's last step, a verified inbox for security reports, and the completion record.
- **FB-03:** which candidates are accepted, and who owns a shopper account. Recording the owner's 2026-11-09 decisions on FB-03 is paused by the platform block above.
- **The owner actions still open in the brief,** among them the Figma purchase (OA-5) and the backend sandbox keys P4 needs (OA-8).

## 5. What these answers do not change

- **No result changes.** No capability, gap or defect result changes to PASS because of these answers. A deferred gap stays unverified until its closure condition holds, and simulated or source-reviewed coverage is not functional verification.
- **Defects stay open.** SD-23 to SD-31 and SD-33 to SD-40 stay open, with their failing results kept where they have one, and SD-22 and SD-32 stay held. Nothing is reported to Spree.
- **Tenant isolation** stays NOT_RUN in every batch, with ISO-1 to ISO-7 open.
- **Criteria and tolerances.** No criterion changes. Every image keeps the tolerance of 25.
- **Lanes.** At most three implementation lanes run at once.
- **Liquorify-specific work** stays deferred until the baseline is complete. The proposed entry criteria stay proposed.
