---
id: FB-23
title: Remediation to a working, verified Spree baseline
status: ACTIVE
updated: 2026-11-11
---

# FB-23: Remediation to a working, verified Spree baseline

**Status.** ACTIVE since 2026-11-11. This is the single completion ledger for the non-Figma engineering milestone. Each defect and each gap that is not closed has an owner, an implementation, its evidence and a closure condition here. LIQ-004 keeps each item's history; this file says what happens to it next. Neither the owner's earlier decisions nor any record is rewritten: remediation evidence is added beside them.

## 1. The owner's instruction of 2026-11-11

On 2026-11-11 the owner replaced the instruction to defer defect fixes until after the baseline. In summary:

- Finish a working, verified Spree open-source baseline in both repositories. All non-Figma work comes first; Figma is the final phase.
- **Expanded delegation.** The project's Claude sessions make the engineering and baseline behaviour decisions: triage, severity, the remaining gap questions, implementation approaches, scheduling, evidence review, technical and visual acceptance, and merges under the existing delegation. Decisions are recorded with their reasons. Established product decisions and Spree's intended contracts are respected. Liquorify-specific SaaS features, branding and a new tenant architecture stay outside this phase.
- **Resolve the underlying problems.** Every outstanding in-scope gap is completed and every confirmed in-scope High, Medium and Low defect is fixed. Accepted exceptions and deferred gaps are revisited wherever the behaviour is still broken or unverified. Completion is never reached by accepting known failures, deferring again, weakening tests, narrowing criteria or relabelling. A finding that is not a defect is reclassified with its evidence. Missing verification, application defects, configuration problems and capabilities absent from the open-source scope are kept apart, and an absent capability is never described as working.
- **At most three isolated implementation lanes**, each with its own checkout, database and ports. Priority: isolation and data correctness; payment and refund accounting; checkout; fulfilment and authorization; then the remaining functional, accessibility and presentation defects.
- **Every repair is verified** by a regression test that fails before the fix and passes after it, with successful controls and the relevant refusals. Flaky tests are fixed, not rerun until green. Synthetic data and sandbox accounts only; real provider delivery is kept apart from simulated or relayed events.
- **The owner is asked only** for access or credentials only the owner can supply, a purchase or contract, a material change to payment responsibility, or a destructive production action.
- **FB-03.** Its status is corrected (§3). The non-Figma milestone is not declared complete while isolation is broken or unverified.
- **The engineering milestone** is declared only when every in-scope defect is resolved, the required verification passes, setup is reproducible and the final integrated checks succeed. It stays separate from full baseline completion, which also needs Figma.

## 2. The rule every item closes by

A **defect** closes when its fix is merged and:

1. a regression test reproduces it on the revision before the fix and passes on the fix, with the assertion unchanged between the two;
2. a successful control shows the intended behaviour for a caller or state that should succeed, and, where access is involved, a refusal shows the wrong caller is still refused;
3. the batch or step test that recorded it as failing now passes, unchanged, at the merged revision, twice in a row on freshly started servers;
4. the capability that carried it as a failing part is re-rated from that evidence; it stays PARTIAL or FAIL until then.

A **verification gap** closes when the check it names has run at a recorded revision, twice in a row, with its expected results written before the run, and passes; a failing check opens or names a defect instead.

An item that is **not a defect** is reclassified only with the evidence that shows Spree's intended contract, cited in its row.

An **absent capability**, one the open-source code does not implement, is recorded as absent. It is never shown as working and never counted as passing.

## 3. Tenant isolation (FB-03): corrected status

The private validation ran on 2026-11-04 at its recorded revision and **found isolation failures**. Its evidence stays private. Remediation is **paused by the reported platform block**, and **current `main` has not been revalidated** since that run. ISO-1 to ISO-7 stay open. When the block is legitimately resolved, the authorized private remediation and its verification are completed. The non-Figma engineering milestone is not declared complete while isolation is broken or unverified.

| Owner | Implementation | Evidence | Closure condition |
|---|---|---|---|
| The FB-03 thread, private | The authorized remediation, once the platform block is resolved | Private project notes only | Every isolation finding fixed and revalidated privately on current `main`, on PostgreSQL and SQLite, with same-store controls; ISO-1 to ISO-7 closed on that evidence |

## 4. Severity totals, reconciled

The total reported on 2026-11-11, "92 open, 14 High, 36 Medium and 41 Low", was wrong: those three add up to 91. LIQ-004 holds 94 defect rows (SD-1 to SD-100, without SD-15 and SD-16, which are held numbers with no row, and without SD-90 to SD-93, released unused):

| Status | High | Medium | Low | None | Total |
|---|---|---|---|---|---|
| Open | 14 | 36 | 41 | | **91** |
| Closed (SD-8, SD-21) | 1 | 1 | | | 2 |
| Observation for product review (SD-78) | | | | 1 | 1 |
| **All rows** | 15 | 37 | 41 | 1 | **94** |

The 92 came from counting SD-78, an observation, as an open defect.

### 4.1 Severity decisions under the delegation

| Defect | Decision | Reason |
|---|---|---|
| SD-23 | High, confirmed | Staff cannot find late purchase orders at all: the filter is refused, so the task cannot be completed (LIQ-004's High) |
| SD-31 | High, confirmed | A customer's gift card balance stays spent after the draft that used it is deleted: a money record is wrong |
| SD-86 | High, confirmed | An invited buyer cannot accept a company invitation, because the storefront page the mailer links to does not exist |
| SD-87 | Medium, confirmed | The delete completes, but the confirmation does not warn that the company's sub-units go too |
| SD-88, SD-89 | Low, confirmed | A count shown two ways, and wording |
| SD-100 | High, kept; cause to be settled first | No seller can be onboarded for payouts. P4 has not shown whether Spree's request or the Stripe account's Connect settings cause it. The provider lane settles that first; if the account's settings are the cause, it is a configuration problem and is reclassified, and the setting is the owner's action |
| SD-78 | Not a defect; observation closed | The Seller API accepting a blank first name follows Spree's user model, which does not require one; the owner on 2026-11-10 found that accepting it does not establish that the contract requires a name |

## 5. The work packages, in priority order

Each package is one lane at a time, and each defect is its own reviewable commit or pull request inside it. "Owner" is the lane that holds it; "Queued" means it starts when a lane frees, in this order. Verification packages (V) are interleaved where they close gaps the fixes depend on.

| # | Package | Tier | Items | Owner | Implementation | Closure |
|---|---|---|---|---|---|---|
| 0 | Tenant isolation | Isolation | FB-03, ISO-1 to ISO-7 | FB-03 thread, paused by the platform block | §3 | §3 |
| V1 | Running verification | Several | G-105, G-114 (marketplace browser checks); batch 12 part 2 with SD-86 and SD-9 (below) and G-128. P14 (G-106) has run: see the note below this table | Two running lanes; the third freed for R1 | Their recorded scopes | Their recorded closure criteria and §2 |
| R1 | Gift card and order money | Data, payment accounting | SD-31, SD-22, SD-82, SD-34, SD-35 | Queued 1st | Release a gift card's spent amount when a draft that holds it is deleted, inside the same workflow, with the card's balance and its ledger kept consistent; show the remaining balance from the card, not the payment; show refused gift card codes with their reason; count discounts and added tax once in the Summary card; show what a claim's resolution paid | §2; a test per defect in Spree's core and API specs and the dashboard's browser tests |
| R2 | Marketplace sales rules | Data, checkout | SD-60, SD-61, SD-69, G-107 | Queued 2nd | Refuse a suspended seller's product at cart and checkout, where Spree already marks it not purchasable; put an approved seller product on the store's sales channel as the approval says; drop the requirements override from reinstating; G-107's policy (§6) enforced and tested action by action | §2, with a refusal at add-to-cart and at checkout and a control for an active seller |
| R3 | Seller money and after-sale | Payment, fulfilment | SD-72, SD-73, SD-71, SD-68, then G-112 | Queued 3rd | Splitting a paid parcel moves its delivery charge instead of adding one; the Seller API finds a replacement variant by the seller's product, not a seller column the variant lacks; a partial replacement asks stock planning for the replacement's quantity, not the whole line's; the payouts report leaves the store's own sales out of seller payouts | §2; then G-112's exchange comparisons run on the running seller panel |
| R4 | Payment and shipping providers | Payment, refund | SD-97, SD-99, SD-100, SD-98, SD-32; G-26, G-109, G-130, G-13, G-67 | Queued 4th | Require a scheme in the store URL, or build the webhook URL with one, and refuse to save a payment method whose endpoint Stripe refuses; apply EasyPost's signed refund event through Spree's refund confirmation; settle SD-100's cause (§4.1); a readable 422 message; complete the payment link (send EM-C-03 from the draft page and the Admin API); run G-130's storefront Stripe checks in the storefront's CI, where OA-1's keys exist and no proxy alters Stripe.js's requests | §2; provider events recorded as real deliveries or as relayed, never mixed |
| R5 | Storefront checkout and account | Checkout | SD-86 and SD-9 (in batch 12 part 2's lane, separate pull requests), then SD-1, SD-2, SD-41, SD-42, SD-43, SD-81, SD-80, SD-10; G-44 | Batch 12 part 2's lane, then queued 5th | The company invitation page at the mailer's address; signed-in customers priced and admitted under gated access; a saved card with no brand shown safely; the policy consent sent at registration; line items and subtotal that add up; tax shown as Spree's contract states for tax-inclusive prices; visible keyboard focus; accessible names; each seller's order on the order placed page; failed list requests reported with a retry; G-44's duplicate link name | §2, in the storefront's browser tests against the Liquorify backend |
| R6 | Authorization and roles | Authorization | SD-70 first (P14 row 14.8's second control is its regression check, then P14 rerun twice to close G-106), then SD-28, SD-29, SD-30, SD-18, SD-53, SD-56, SD-62, SD-63, SD-55; G-11 with G-50, G-70, G-103, G-126 | Queued 6th; SD-70 may start earlier as a small fix | Let each role template do what Spree's role definitions grant (exports, delivery profile origins), fixed at the record check, not by widening keys; show a checkout's stock hold in the reservations list; reload permissions on store switch; show only the controls a role can use and an error, not "Loading…", when a read is refused; then send G-11's remaining requests | §2, every fix with a refusal for a role that must stay refused |
| R7 | Fulfilment and order screens | Fulfilment | SD-36, SD-39, SD-47, SD-48, SD-49, SD-50, SD-58, SD-59, SD-83, SD-84, SD-33, SD-37, SD-38, SD-40 | Queued 7th | Offer to ship units again after a fulfilment is canceled; route from a delivery profile's ships-from locations; for SD-47 to SD-50, the owner's 2026-11-10 decision stands: server permissions are kept and the dashboard stops offering what the role cannot do; Preview Order opens the storefront's order page; show and change an order's company; quantity and leave-page guards with reasons; weight rounding; wording; the return email lists what was returned | §2 |
| R8 | Data validation, customers, exports and sample data | Data | SD-45, SD-95, SD-94, SD-44, SD-46, SD-96, SD-11, SD-13, SD-14, SD-17, SD-52, SD-51, SD-23, SD-24, SD-25 | Queued 8th | Setting one default address keeps the other; validate an email's format on the model, as the dashboard already says the server does; an emptied note saves as empty; keep a typed registration kind; show the regime's refusal; a readable filter chip; unique export file names; sample orders that find products in any language; tell the merchant when sample data fails; export emails that link to the file; counts and lists that agree; the overdue filter sent as Spree expects; a URL check on the storefront sheet; price list positions across the whole list | §2 |
| V2 | Final comparison follow-up | Verification | G-01, G-02, G-10, G-17, G-19, G-24, G-33, G-42, G-47, G-53, G-58, G-65, G-73, G-81, G-85, G-88, G-93, G-96, G-101, G-111, G-116, G-125 | Queued after R4, and run whenever a lane is free between fixes | Compare every remaining story with a running screen at the merged revision, using synthetic data to reach each state; a story no running screen can show is listed with the reason, never counted as compared | Every story compared and passing, or listed as unreachable with its reason |
| V3 | Remaining browser and registry checks | Verification | G-123, G-41, G-46, G-113, G-97's registry check, G-117 | Queued with V2 | Bounded browser checks with expected results written first; G-113 captured through Spree's invitation lifecycle; G-117's expectation corrected (§6) | §2 |
| V4 | Email integration | Verification | G-16, G-77, G-110, G-127, G-104 | Queued | Send each customer email from its triggering event on the browser-test server with Spree's emails gem loaded, caught by a local mail catcher; rendering, event-triggered sending and provider delivery are recorded separately; provider delivery needs a sending account (§7) | Rendering and event-triggered sending pass for every customer email; provider delivery passes or stays BLOCKED on §7 |
| V5 | Reproducible setup | Verification | P5 (a project made with Spree's command line tool), FB-04's last step, FB-09's update check with G-20 | Queued | Run P5 where Docker runs in the cloud environment, if it does; otherwise §7 | A fresh project and both repositories set up from their documented steps, twice, with the final integrated checks passing |
| R9 | Dashboard presentation and accessibility | Presentation | SD-5, SD-6, SD-7, SD-19, SD-20, SD-26, SD-27, SD-54, SD-57, SD-64, SD-65, SD-66, SD-74, SD-75, SD-76, SD-77, SD-79, SD-85, SD-87, SD-88, SD-89 | Queued last among fixes | Error messages drawn above their sheets; failed requests shown with a way back; keyboard reordering by more than one place; raw keys and form-library messages replaced by translated, specific text; accessible names | §2 |
| R10 | Kits and published references | Presentation | SD-3, SD-4, SD-12, SD-67 | Queued with R9 | Kit types that match what the APIs send; the Admin API reference regenerated from the integration specs; `Vary` appended to, not replaced | §2 |

**P14 (G-106), 2026-11-11.** Ran at `5dcbf7ec`, twice on freshly started servers with identical results ([record](../verification/2026-11-11-fb-19-platform-p14.md)). 25 of its 26 rows pass. Row 14.8 fails on its second control, which is SD-70. G-106 and G-11 stay open; G-106 closes when SD-70 is fixed in R6 (or earlier as a small fix) and P14 passes twice again.

## 6. Gap decisions under the delegation

| Gap | Decision | Reason | Owner |
|---|---|---|---|
| G-85, G-88 | Compared in V2, not deferred again | Stories not compared are unverified until compared | V2 |
| G-86, G-89, G-124 | Accepted as simulated interface-state coverage | Loading, empty and failed-request states are the client's own states; answering the request in the browser is the correct way to reach them, and what the server answers is checked separately in the batch and refusal checks. This matches G-54, G-59 and G-82 | Closed by this decision |
| G-107 | Policy: a suspended seller's team may still sign in, read and fulfil the orders it already has, refund and handle their returns, and edit its profile; nothing of the seller's can be bought, newly listed or put on sale | Spree's plans say only that suspension stops new purchases. Customers who already paid must still be served, so obligations on existing orders continue; anything that creates new sales does not | R2 enforces and tests it action by action |
| G-117 | Not a defect: the expected answer is corrected to 404, and the two checks are rerun unchanged otherwise | Spree's Admin API looks a saved report up within the caller's own reports, so another user's report is not found rather than forbidden; answering 404 does not reveal that the record exists, which is Spree's intended contract for scoped lookups. The first expectation of 403 was the error, and stays recorded as such | V3 |
| G-123 | Bounded browser checks for its 17 behaviours | Behaviours with no browser test are unverified | V3 |
| G-125 | Compared in V2; the expired certificate reached with a synthetic certificate whose expiry date is past | Synthetic data can reach the state | V2 |
| G-126 | Sent in R6 with G-11's other requests, expected answers written first | Joining G-11 is only bookkeeping; the requests must run | R6 |
| G-127, G-110, G-16, G-77, G-104 | Completed in V4 | Email integration is part of the work the owner listed | V4 |
| G-128 | Intended, on one condition checked in batch 12 part 2 | Spree's documented contract (`docs/developer/core-concepts/catalogs.mdx`, "How pricing resolves") limits a company's buyers to its catalog's assortment, then checks the catalog's price list, then ordinary price lists whose rules match. A product inside the assortment that the catalog does not price must still get the Wholesale list when its rules match; if not, that is a defect | Batch 12 part 2 |
| G-129 | Absent capability | No real tax engine is implemented in either repository; Spree's open-source code ships only its own engine. It is recorded as absent and never as working | None; recorded |
| G-39 | Its exemption reason code is verified with Spree's own engine in R4; its real tax engine part is G-129 | Splits what can be verified from what is absent | R4 |
| G-76 | Stripe in R4. Adyen and PayPal stay unverified until sandbox accounts exist (§7); their status is unverified, not working | Source review is not verification | R4, then §7 |
| G-14 | Absent capability in the API: no endpoint cancels a gift card | Spree's cancel workflow exists, but nothing exposes it | None; recorded |
| G-08 | Verified in V5 with a local test identity provider, if Spree's open-source code supports one; otherwise recorded as absent | Signing in through a provider is unverified today | V5 |
| G-01, G-10, G-17, G-19, G-24, G-33, G-42, G-101 (accepted earlier) | Reopened into V2 | They were accepted on the promise that later batches would compare each state; that promise is kept by actually comparing | V2 |
| G-67 | Reopened into R4: the Stripe and EasyPost stories compared on a server that loads both | The cloud environment now has sandbox keys | R4 |
| G-20 | Reopened into V5: a real update check against a stand-in server | Simulated coverage stands for the dialog's states, not for the check itself | V5 |
| G-06, G-12, G-25, G-28, G-35, G-51, G-55 | Kept as recorded, each relabelled as "not reachable on a stock screen" or "absent from the storefront", never as passing | No stock configuration reaches them; nothing is claimed to work | None |
| Other simulated-state acceptances (G-21, G-27, G-34, G-43, G-48, G-54, G-59, G-66, G-74, G-82, G-94, G-98, G-102, G-108) | Kept | Same reason as G-86 | None |

## 7. What only the owner can supply

None of these blocks the packages above; each blocks only what is named.

| Need | Blocks | Exact action |
|---|---|---|
| Sandbox accounts for Adyen and PayPal, added as network secrets like Stripe's | G-76's Adyen and PayPal parts | Asked only when R4 reaches them |
| A sending account for real email delivery | V4's provider delivery part only | Asked only when V4 reaches it |
| A place where Docker runs, if the cloud environment has none | P5 in V5 | Asked only if V5 finds Docker unavailable |
| A Stripe Connect setting, if R4 shows SD-100 is configuration | SD-100 and G-109 | Asked only if R4 shows it |
| The Figma seat (OA-5) | The Figma phase, which comes last | Already listed |
| The platform block on FB-03 | Package 0 | Being resolved through the platform's process |

## 8. Order of lanes

Running on 2026-11-11: the marketplace browser checks, batch 12 part 2 (with SD-86 and SD-9), and R1, which took the lane P14 freed. As each frees, the next starts in this order: R2, R3, R4, R5's rest, R6, R7, R8, then V2, V3, V4 and V5 alongside R9 and R10. Package 0 resumes whenever its block is resolved, ahead of everything else.
