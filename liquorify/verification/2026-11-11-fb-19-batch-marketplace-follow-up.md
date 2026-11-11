---
title: FB-19 batch 13 follow-up, the marketplace browser checks (G-105 and G-114)
record: verification
work_item: FB-19
date: 2026-11-11
verifier: Claude (automated session); not independent review
result: G-105, 12 of 14 operator behaviours PASS in both recorded runs; rows 6 and 14 FAIL on the new defects SD-101 and SD-102. G-114, 13 of 16 seller panel behaviours PASS in both recorded runs; rows 2 and 6 FAIL solely on SD-72 and SD-73, as the owner's exceptions expect; row 11 FAILS on the new defect SD-103. Every check was first shown to fail under a deliberate change. G-105 and G-114 stay open.
---

# FB-19 batch 13 follow-up, the marketplace browser checks (G-105 and G-114)

**Claim.** The bounded browser checks scoped in the [batch 13 work item §11](../work-items/fb-19-batch-marketplace.md#11-the-marketplace-follow-up-the-browser-checks-of-g-105-and-g-114-and-the-refusals-of-g-106) were written and run: the operator's 14 behaviours (G-105, §11.2) and the seller panel's 16 (G-114, §11.3). This record gives each behaviour's result in both recorded runs, the deliberate failures, the corrections made before the first recorded run, and the defects found.

**Revisions.**

| What | Revision |
|---|---|
| Scripts | Branch `claude/project-thread-xx3cgk`, commit `72bd337c`, from `main` at `f9894eaf` |
| Spree's code, the dashboards, the seller panel and the SDKs | Unchanged: `git diff f9894eaf 72bd337c` over `spree/` and `packages/` other than `packages/liquorify-storybook` is empty |
| Running screens | The dashboard and the seller panel built for production and served by their preview servers (5174 and 5175), against Spree's browser-test server (`stack.config.ts`) on a fresh database, in Playwright 1.64.1's Chromium from the pinned image (`mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a…`) |

## 1. How the checks ran

- **Scripts.** `packages/liquorify-storybook/fidelity/marketplace-operator.spec.ts` (G-105) and `marketplace-seller.spec.ts` (G-114), with their records made by `marketplace-follow-up.ts`. Each check signs in through the sign-in form, drives the behaviour through controls found by role and name, asserts the screen, then reads the server back through the Admin or Seller API. Each check blocks and lists any request leaving the machine; none was made.
- **Records.** Every seller is created and invited by the operator and accepted by its member, then taken through onboarding through the Seller API (G-113). Products, orders and payouts are made by the run and named with its stamp. Order rows start from a guest's purchase from two sellers through the Store API, paid by cheque.
- **Mail.** The server ran with the emails gem in its bundle (`fidelity/emails-bundle/Gemfile`) and wrote mail to a local folder, read by subject and recipient (§11.1). This shows mail sent on the event, not a provider's delivery (G-110).
- **Recorded runs.** Two runs in a row, each after stopping the server and starting it again on a fresh database: `run-1.txt` and `run-2.txt` in the [evidence folder](evidence/2026-11-11-fb-19-batch-marketplace-follow-up/), with each check's `record.json` (the server's read-back) and its lossless WebP captures under `run-1/` and `run-2/`.

**Setup differences from §11.1**, each recorded rather than hidden:

1. Orders are placed through the Store API as a guest, not through the storefront's pages. The storefront is not changed or needed for any expected result.
2. The browser-test server builds stored files' links (photos, logos, labels) for port 3000, which the generated test app's `config/environments/test.rb` names, while it serves on 3010. `fidelity/file-links.mjs` forwards 3000 to 3010 so a stored photo opens in the browser. It changes nothing Spree answers. Without it, behaviour 12's photo cannot load on this stack.
3. The admin's session expires during a run, so the scripts sign in again once when an admin request is refused (`Api.request`).

## 2. The operator's 14 behaviours (G-105)

| # | Behaviour | Run 1 | Run 2 | Server read-back |
|---|---|---|---|---|
| 1 | Approving a seller with nothing outstanding | PASS | PASS | Seller `approved`; "You're approved to sell on Shop" sent to the contact |
| 2 | Approving with requirements outstanding | PASS | PASS | Without the override the server answers 422 and the seller stays `ready_for_review`; with it, `approved`, and the `seller.approved` event names `unmet_requirements: ["Shipping box"]` |
| 3 | Suspending a seller | PASS | PASS | Seller `suspended` |
| 4 | Reinstating a suspended seller | PASS | PASS | Seller `approved` |
| 5 | Rejecting a seller | PASS | PASS | Seller `rejected`; no mail names a reason. An approved seller's menu has no Reject, and the server refuses it with 422 |
| 6 | Sending a seller back to onboarding | **FAIL, SD-101** | **FAIL, SD-101** | Seller back in `onboarding`, but no note is kept: the dashboard's confirmation has no note field |
| 7 | Deciding an onboarding requirement | PASS | PASS | One submission accepted, one sent back, "Shipping box" waived; progress up by 2 |
| 8 | Approving a seller's product | PASS | PASS | Product `active` |
| 9 | Sending a seller's product back | PASS | PASS | The reason kept as the submission's `review_note` |
| 10 | Filtering products and orders by seller | PASS | PASS | Each list holds only the run's seller's records, after a reload too |
| 11 | A marketplace order's cards | PASS | PASS | The seller, commission (12%) and seller transfer cards match the server's lines and transfers |
| 12 | Settling a seller by hand | PASS | PASS | A payout for the balance is created, then marked paid; the balance reads $0.00 |
| 13 | Automatic approval of sellers and products | PASS | PASS | With the settings on, seller and product approved without an operator; with them off, a new seller waits as `ready_for_review` and a product as proposed |
| 14 | The sellers ranking and the payouts report | **FAIL, SD-102** | **FAIL, SD-102** | The ranking matches. The report's seller payout reads $495.00 where the ledger paid $501.50, leaving out the seller's $6.50 delivery earning |

## 3. The seller panel's 16 behaviours (G-114)

| # | Behaviour | Run 1 | Run 2 | Server read-back |
|---|---|---|---|---|
| 1 | Fulfilling an order | PASS | PASS | Fulfilment `fulfilled` with its tracking number; "Fulfillment Notification" sent to the customer |
| 2 | Splitting a parcel | **FAIL, SD-72** | **FAIL, SD-72** | Two parcels, but the order's total went from $70.50 to $77.00 with a second $6.50 delivery charge, and $6.50 is due. The test asserts the intended result and stays FAIL (owner's exception) |
| 3 | Recording a delivery and uploading a label | PASS | PASS | The delivery's tracking number and one label with its tracking number and $7.25 cost |
| 4 | Creating, receiving and refunding a return | PASS | PASS | Return `refunded`, a $32.00 refund, and a new negative seller transfer for the reversal |
| 5 | A claim | PASS | PASS | One claim `resolved`, one `denied`. A replacement is not driven (SD-73, G-112) |
| 6 | Exchanges | **FAIL, SD-73** | **FAIL, SD-73** | The order page offers no way to start an exchange (its menu holds Copy number, Copy ID and Cancel order), and the Seller API answers 404 `variant_not_found` to the exchange. The test asserts the intended result and stays FAIL (owner's exception). Every step past the start is NOT_RUN under G-112 |
| 7 | Cancelling an order | PASS | PASS | Order `canceled` with its reason and note; the order's seller transfers net to zero and the balance changes to match |
| 8 | An order's instructions, note and address | PASS | PASS | The customer note, internal note and shipping address match after a reload |
| 9 | Taking a product down and archiving it | PASS | PASS | Product `draft`, then `archived`; the Store API answers 404 for it |
| 10 | Importing and exporting products | PASS | PASS | Both imported rows are the seller's own and absent from the other seller's list; the export holds them and none of the other seller's products |
| 11 | The profile's addresses and tax registration | **FAIL, SD-103** | **FAIL, SD-103** | The billing address and the US EIN registration match. The returns address shown after a reload is not the one the server gives: Spree's returns address is still the default warehouse's, because the card saved onto another location |
| 12 | The account dialog | PASS | PASS | First name, language `de` and photo saved; the panel reads in German after a reload |
| 13 | Switching between two sellers | PASS | PASS | One member of two sellers; after switching, the second seller's orders and products and none of the first's, on the screen and through the Seller API |
| 14 | Submitting for review | PASS | PASS | Submit is disabled with the terms outstanding and enabled once they are accepted; seller `ready_for_review` |
| 15 | Choosing a new password | PASS | PASS | The reset mail's link sets the new password; the new one signs in, the old one is refused (401), and the link fails a second time |
| 16 | A store staff member at sign-in | PASS | PASS | Refused with the panel's message and no seller data; the Seller API refuses the sign-in |

## 4. The deliberate failures

Before the first recorded run, every check was run with `MARKETPLACE_SABOTAGE=1`, which marks it as expected to fail and changes what the application does or what the server serves, never the assertions: a stand-in answer that keeps a mutation from reaching the server, or a served read with data removed (each check's `sabotage` call). All 30 failed (`sabotage.txt`). Seller behaviour 14 first failed for another reason, the admin's expired session, so it was run again after the scripts learned to sign in again, and failed on its change. Seller behaviour 13's first change (an emptied order list) did not make it fail, so it was replaced with one that leaves the second seller out of the member's sellers, which did. Seller behaviours 11 and 12 failed on a control left waiting behind the stand-in rather than at an assertion; the change caused both.

## 5. Corrections made before the first recorded run

Each correction has its reason in Spree's code (P10, §11.4). None turns a lost or misplaced record, or one seller's data shown to another, into an expected result.

| Behaviour | Correction | Reason in Spree's code |
|---|---|---|
| Operator 2 | "Without the override" is checked as: the dialog names what is outstanding, Cancel leaves the seller ready for review, and the server refuses a request sent without the override | The dashboard never sends an approval without the override while requirements block; its comment says the dialog "is the only way past it" |
| Operator 3, 5 and 7 | No reason is typed when suspending, rejecting or sending a requirement back where the confirmation has no reason field | The dashboard's confirmations offer none |
| Operator 12 | The payout is marked paid before the balance is read | Spree's built-in payout provider leaves a payout pending until it is marked paid, and the balance is payable less paid |
| Seller 3, 4 and 5 | A dialog's submit button is found by its word or by the raw key it shows | Shared dialogs read keys only the admin dashboard's locale defines (SD-85; the New return dialog is a second instance) |

## 6. Defects

Numbered by the audit thread and decided under the owner's delegation, recorded here and not fixed in this lane. They join the fix queue: SD-102 and SD-103 in R3 (seller money and after-sale), SD-101 in R9.

| ID | Defect | Severity | Evidence |
|---|---|---|---|
| SD-101 | The dashboard's Send back to onboarding confirmation has no note field, although the Admin API accepts a note and the workflow keeps it (`onboarding_reopened_note`), so the operator cannot tell the seller why | Low | Operator 6, both runs |
| SD-102 | The seller payouts report's seller payout leaves out the seller's delivery earning, which the ledger pays: $495.00 shown, $501.50 paid. Distinct from SD-68 | Medium | Operator 14, both runs |
| SD-103 | The profile's Returns address card picks the first location that takes returns in list order, so for a seller with Spree's own location and a default warehouse it shows "Not added" and saves onto the empty location, while Spree keeps sending returns to the warehouse's address | Medium | Seller 11, both runs: the stock locations before and after in `record.json` |
| SD-85 (second instance) | The seller panel's New return dialog shows the raw key `admin.pages.orders.detail.returns.actions.create` on its submit button | Low, as SD-85 | Seller 4's captures |

## 7. How G-105 and G-114 stand

- **G-105** stays open: 12 of 14 pass in both runs. Rows 6 and 14 fail on SD-101 and SD-102 and have no exception. It closes when they pass after their fixes.
- **G-114** stays open: 13 of 16 pass in both runs, and rows 2 and 6 fail solely on SD-72 and SD-73, as the owner's exceptions require. Row 11 fails on SD-103, which has no exception, so the closing condition of §11.4 is not met. SD-72 and SD-73 stay open as High defects, the capabilities they affect stay PARTIAL, and G-112 stays BLOCKED. The exceptions do not authorize releasing the affected workflows.

**What these checks claim nothing about:** tenant isolation (FB-03, NOT_RUN, ISO-1 to ISO-7 open); G-106's refusals (P14); a provider's delivery of mail (G-110); a real payout provider (G-109, P4); what a suspended seller may do (G-107).
