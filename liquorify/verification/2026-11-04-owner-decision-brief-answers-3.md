---
title: The owner's third set of answers to the owner decision brief
record: owner decisions
work_item: FB-11, FB-19 (batch 6, batch 9, catalog part 3, P4, P9, P10), SD-21, G-14, G-73 to G-82, G-84, the media picker sheet's visual check
date: 2026-11-04
recorded_by: Claude (automated session); not independent review
result: On 2026-11-04 the owner answered seven rows of the owner decision brief. Rows G and H cover the security audit's repair and its dependency updates. Row 30 covers one media picker image's visual check. Rows 31 and 35 cover the gaps from batch 9 and catalog part 3, row 32 covers Adyen and PayPal, and row 34 covers SD-21. Rows 33 and 36 and every other open decision stay pending. No capability, gap or defect result changes to PASS because of these answers. Tenant isolation stays NOT_RUN, and Liquorify-specific features stay deferred.
---

# The owner's third set of answers to the owner decision brief

**What this records.** The owner decision brief is kept in the project workspace and lists the questions only the owner can answer. Batch 9 merged on 2026-11-04 (storefront #24, records in #55 and #62), and so did part 3 of the catalog and pricing batch (#61). Later that day the owner answered these rows of the brief in writing:

- **Rows G and H:** whether to merge the security audit's repair, #57, and the dependency updates its run by hand opened, #58.
- **Row 30:** whether one media picker image may be allowed more counted pixels.
- **Rows 31 and 35:** the proposals for batch 9's and part 3's gaps, and G-14.
- **Row 32:** Adyen and PayPal, in G-76.
- **Row 34:** whether SD-21 is fixed now.

The owner asked that the approved Spree-first work continue within the three-lane limit, and that every other unanswered decision stay pending.

Each answer is recorded against its own ID in the document that owns that ID, and §1 says where. This record is the single list. Under D5, an answer recorded here is the owner's approval, its date and its scope.

## 1. Each answer and where it is recorded

| Row | ID | The owner's answer, 2026-11-04 | Recorded in |
|---|---|---|---|
| G | FB-11, #57 | #57, the security audit's repair, may merge under the delegation. The `deepmerge` advisory it cannot fix stays visible, and no new ignore entry is added. The audit's result after the merge is recorded | [Foundation lane §5, question 4](../work-items/foundation-lane-security-audit-and-storefront-backend.md#5-questions-for-the-owner-and-the-owners-answers); [FB-11](../LIQ-004-foundation-backlog.md#backlog) |
| H | FB-11, #58 | #58's dependency updates are approved. #57 merges first. #58 is then brought up to date with `main`, any conflicts are resolved, and the affected checks run again on its final commit before it merges. The review of its major-version moves and the unresolved advisory are kept in the verification record | Foundation lane §5, question 4; FB-11 |
| 30 | Batch 3's "Media picker sheet: Two picked", light | An investigation is authorized, and with it an allowance of 60 counted pixels for that one light image, on the conditions of §2. If that evidence cannot be obtained, the existing tolerance stays | This record, §2; [LIQ-004's lanes](../LIQ-004-foundation-backlog.md#lanes-for-the-remaining-baseline-approved-on-2026-11-04) |
| 31 | G-73, G-74, G-75, G-77, G-78, G-79, G-80 | The proposed coverage classifications and follow-ups are approved. G-75 is added to P9, the applicable refusals (G-79) to P10, and G-78's stock-hold check to batch 6. Simulated and source-reviewed coverage stay distinct from functional verification | Each gap in [LIQ-004's gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance); [P9 item 1.5 and P10 item 4](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) |
| 32 | G-76 | Adyen and PayPal stay source-reviewed coverage until the provider decision. Stripe's outstanding real-provider checks stay with P4 | G-76 |
| 34 | SD-21 | Brought forward: fixed now, in its own bounded storefront pull request, on the conditions of §2. It merges under the delegation once the agreed checks pass. Real-provider verification stays with P4 | [SD-21](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline); LIQ-004's lanes |
| 35 | G-81, G-82, G-84, G-14 | The proposed classifications and follow-ups are approved. G-84 is added to P9, and its three behaviours that need a narrower role go to P10 with G-83. G-14 is accepted as source-reviewed coverage only. This makes no claim that cancelling a gift card works through a staff screen or the Admin API | Each gap in LIQ-004; P9 item 1.6 and P10 item 2 |

## 2. Work items and closure conditions

| Gap | Kind | Work item | Closes when |
|---|---|---|---|
| G-73 | Coverage, comparisons | The [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches), extended to the storefront's batches 12 and 13 and to SD-21's fix | Every story it holds has been compared with a running screen in one of those batches' image review lists. A story no stock screen shows keeps its status, and the gap stays DEFERRED for it |
| G-75 | Function, browser tests | P9, item 1.5, in the storefront's repository, against the pinned Liquorify backend its browser tests use | Each action has a browser test, run twice in a row at a recorded revision and shown to fail when its assertion does not hold, that passes or fails only on a recorded defect. The signed-in tests fail on SD-21 until its fix merges |
| G-76 | Coverage and function, real provider | Stripe: P4, with the backend sandbox keys (OA-8) | P4 shows Stripe's payment form, a decline, an express checkout button and SF-CHK-02 after a real 3-D Secure check with a Stripe test card on the storefront, at a recorded revision, twice in a row. Adyen and PayPal are accepted, not deferred (below) |
| G-77 | Function, email | With G-16, email configuration and delivery verification | As G-16: which path a Liquorify store uses for customer emails is decided, and the chosen email is shown sent through a mail service |
| G-78 | Function | Batch 6, as step 5 of [its work item](../work-items/fb-19-batch-inventory.md) sets out | Batch 6's record shows a second shopper's checkout refusing the item another checkout holds, at both widths, with what the server answered |
| G-79 | Function, refusals | P10, item 4, linked to G-11 | P10's evidence passes for every request it names. A request answered that should have been refused is a defect and a security finding for the owner |
| G-80 | Coverage | Batch 12, wholesale | Batch 12's record shows the cart and checkout in a second language at both widths, with what the server translated and what it did not |
| G-81 | Coverage, comparisons | The comparison follow-up, as G-58. The issue store credit dialog opened from a customer's page goes to batch 10 | As G-58 |
| G-84 | Function, browser tests | P9, item 1.6, for 19 of its behaviours. Behaviours 11, 12 and 22 go to P10 with G-83 | P9: as G-75's first sentence. P10: as G-83, with G-11 |

**Accepted, not deferred.** These are not functional verification:

- G-74 and G-82 are simulated interface-state coverage only. Their states were reached by holding, failing or answering a request in the browser, and the server's and any provider's behaviour in them is not verified.
- G-14 is source-reviewed coverage only. No staff screen or Admin API request cancels a gift card at the recorded revision, and nothing here claims that one can.
- Adyen and PayPal, in G-76, are source-reviewed coverage only until Liquorify chooses its payment providers. Their stories stay labelled mocked, and no Adyen or PayPal screen or call is verified.

**SD-21's fix (row 34).** It runs in its own bounded pull request in the storefront's repository. It closes SD-21 only when all of these hold:

1. **A failing test first.** A browser regression test signs a customer in and checks out with the account's loading delayed and the cart's email empty. The test is shown to fail at the storefront's revision before the fix.
2. **The cause is fixed.** The change fixes why the email field starts empty and locked. It is not a workaround in the test.
3. **The customer completes checkout.** Against the pinned Liquorify backend, the signed-in customer places the order, and the order is linked to that customer.
4. **Guest checkout still works.** The storefront's existing guest checkout tests still pass.
5. **Merging.** It merges under the delegation once the agreed checks pass on its final commit, recorded as delegated acceptance.

Real-provider verification stays with P4. SD-21 is not reported to Spree, by the owner's standing instruction (decisions 21 and 37). Once it merges, G-75's signed-in tests and G-73's signed-in stories can run.

**The media picker image (row 30).** An investigation in its own thread, when a slot frees after SD-21's fix. The allowance of 60 counted pixels applies to batch 3's "Media picker sheet: Two picked", in light mode only. It is applied only when all four of these hold:

1. **The difference is explained.** The actual difference in the failing CI run is found and explained. Until now its image could not be downloaded.
2. **Unchanged runs stay within it.** Runs with nothing changed differ by no more than 60 counted pixels.
3. **Real changes still fail.** Deliberate changes to what the image shows, such as the picked tiles' borders, still fail under 60.
4. **CI passes twice.** Two full visual runs pass in CI with the allowance in place.

If that evidence cannot be obtained, the image keeps the tolerance of 25 every other image has, and no allowance is added. The threshold and every other image's tolerance stay unchanged either way.

**How these gaps close.** Under the delegation of 2026-11-04, a gap closes only on passing evidence for its recorded condition. That closing is recorded as delegated acceptance, not as the owner's review. Anything else comes back to the owner.

## 3. What stays pending

- **Row 33:** closing what batch 9 checked for G-02, G-44 with G-49, and G-71's transit days, and where G-71's origin groups and tax exemption reasons go.
- **Row 36:** whether batch 9's B18 becomes a defect, and the other behaviours batch 9 and part 3 recorded.
- **Rows 18, 22 apart from B17, and 24:** the earlier behaviours the owner was asked to classify.
- **Rows 6 to 8 and 26 to 29:** the merchant lifecycle specification's preview (D8), FB-03's validation result, which stays private, who owns a shopper account, where P5 runs, FB-04's last step, a verified inbox for security reports, and the completion record.
- **Owner actions OA-5, OA-7 and OA-8.**
- **The gaps whose work has not reported:** G-11 with the gaps linked to it (P10), G-26 and G-39 (P4), G-37 with G-68 (P9), and G-38 with G-71.

## 4. What these answers do not change

- **No result changes.** No capability, gap or defect result changes to PASS because of these answers. Coverage checked against source or reached by simulating a request is not functional verification. A deferred gap stays unverified until its closure condition holds.
- **Defects stay open.** SD-17 to SD-21 stay open, with their failing results kept. SD-21 stays open until its fix merges with the evidence §2 asks for. Nothing is reported to Spree.
- **Tenant isolation** stays NOT_RUN in every batch, with ISO-1 to ISO-7 open.
- **Criteria and tolerances.** No criterion changes. The media picker image keeps the tolerance of 25 until row 30's four conditions hold.
- **Lanes.** At most three implementation lanes run at once. SD-21's fix takes the next free slot, ahead of P10. Row 30's investigation follows it, then P10.
- **Liquorify-specific work** stays deferred until the baseline is complete. The proposed entry criteria stay proposed.
