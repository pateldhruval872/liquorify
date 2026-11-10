---
title: FB-19 batch 13 part 2, the seller panel
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session); not independent review
result: PASS for the map, the 117 stories and their images, the running-screen captures of the seller panel and the storefront's seller checkout, the comparison with running screens, 28 cases and 4 earlier stories in both themes with every difference explained, and Spree's own specs for the Seller API and the seller audience's permissions, 659 examples with no failures. 80 states of the 22 screens, 2 overlays and 3 storefront screens are captured in 84 captures; the states no capture reached are recorded with the check made instead (G-116), and 5 states were reached by answering a request in the browser. The seller's steps of FL-11, FL-12 and FL-13 are traced, FL-13 with a purchase placed on the storefront. PASS for the eight rows of §10.5, each checked where it takes effect, with what could not be reached recorded. PASS for the emails: EM-S-02 and EM-S-03 read as sent by the browser-test server. Tenant isolation is NOT_RUN. Ten existing defects (SD-72 to SD-81) and five gaps (G-112 to G-116) are recorded for the owner. Criterion 8 counts CI on the final commit, named in the merge record
---

# FB-19 batch 13 part 2, the seller panel

**Claim.** The [batch 13 work item](../work-items/fb-19-batch-marketplace.md) reproduces what Spree already has for running a marketplace. Part 2, recorded here, is the seller panel ([work item §10](../work-items/fb-19-batch-marketplace.md#10-part-2-the-seller-panel)): signing in, the seller picker and the panel's chrome, home and onboarding, products, orders, earnings and payouts, the profile and settings, and the storefront's checkout of a cart holding two sellers' products. It gives the 27 seller panel components without stories 117 Storybook stories with light and dark reference images, and the seller panel story group its own providers. It captures every seller panel screen and overlay on the running panel in each state the work item lists that the browser-test server can reach, for each signed-in variant. It traces the seller's steps of FL-11, FL-12 and FL-13, and checks on the running stack that what a seller does takes effect where it should. Spree's code and the storefront are not changed. Whether Liquorify uses a marketplace at all is not decided here: LIQ-006 marks §10 "not needed yet".

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | #101, branch `claude/project-thread-tcfmf8`, from `main` at `1342549c`, the work item's part 2 commit, which follows part 1's merge record at `48e33669`. The captures, comparison, checks and emails were taken at that code with the pull request's stories and scripts; the final commit is named in the merge record |
| Spree's code: the seller panel, the dashboard packages, the SDKs and the gems | Unchanged: `git diff` between `main` and the branch over `spree/`, `packages/seller-dashboard`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/*sdk*`, `.github` and `pnpm-lock.yaml` is empty |
| Running screens | The seller panel built for production and served by its preview server, against the dashboard browser tests' own Rails server and fixtures (the browser-test server) on a fresh database, in Playwright 1.64.1's Chromium. Captures are 1280 by 960 pixels, and 390 by 844 for the phone captures; a page captured whole grows the window to the page's height |
| The storefront | `liquorify-storefront` at its `main` (`b3202e8`), unchanged, built for production and started against the same server. The work item named its development server; the production build was used because it serves each page without compiling it on the first visit, which kept the checkout's captures from timing out. The storefront's pages are the same |

**Results.**

| # | Criterion ([work item §10.9](../work-items/fb-19-batch-marketplace.md#109-acceptance-criteria-for-part-2)) | Result |
|---|---|---|
| 1 | Every in-scope capability of §10.1 is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no SP ID left unmapped | PASS: the map in §2 has CAP-10-02 to CAP-10-05, CAP-10-07 and CAP-10-09 with every SP screen and overlay, the seller's steps of FL-11 to FL-13, the seller's own role, the 27 components, Spree's 11 seller panel browser tests in eight files, and EM-S-02, EM-S-03 and EM-C-04, each with its evidence or a named gap |
| 2 | Every component the seller panel uses has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 27 components, 117 stories, 234 reference images, each looked at in both themes ([image review list](2026-11-10-fb-19-batch-marketplace-part-2-image-review.md)). The balance summary's three stories, from the pilot, were not redone. Every other component the panel draws comes from `@spree/dashboard-core` or `@spree/dashboard-ui` and has its story from an earlier batch (§1) |
| 3 | Every screen and overlay is captured on the running seller panel, at the pinned revision, in each state in §10.2, and the storefront's seller checkout at both widths | PASS for every state the browser-test server reaches: 80 states in 84 captures, each in light and dark or at 1280 and 390 pixels, 174 images (§2.1). The states it does not reach are recorded with the check made instead (§7, G-113 and G-116). 5 states were reached by answering a request in the browser, and say so |
| 4 | Each variant in §10.3 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): a member of one approved seller on every screen, a member of two sellers, members of a seller onboarding, ready, rejected and suspended, a signed-out visitor and a store staff member. The pending and invited sellers have no member to sign in as (G-113) |
| 5 | The seller's steps of FL-11 to FL-13 are traced step by step to their screens, and the browser tests covering them pass on the batch's revision; a step no test covers is recorded as a gap | PASS. The steps are traced in §2.2, FL-13 with two purchases placed on the storefront. The steps with browser tests map to Spree's `seller-panel-home.spec.ts`, `seller-invitation-acceptance.spec.ts`, `seller-panel-products.spec.ts`, `seller-catalog.spec.ts`, `seller-panel-earnings.spec.ts`, `seller-panel-settings.spec.ts`, `seller-delivery-methods.spec.ts` and `seller-package-types.spec.ts`, which run in CI at the pull request's revision (§10). The steps no browser test drives are listed under criterion 15 (G-114) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 28 cases of this part's stories and 4 earlier stories were compared in both themes, 64 comparisons. 29 match with no difference; the other three are explained by focus, by data and by SD-74. Seven stories were corrected to the column or frame the running panel draws them in, and their comparisons run again (§4.3) |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 89 of the 117 stories were not compared by the script; 21 show a state seen in a capture and 68 were checked against their source only, each with its reason (image review list). They and the states no capture reached are G-116 (§7). Every capture whose state was reached in the browser names how in its note |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | Recorded in the merge record, which names the two full runs on the final commit (§10). Nothing is merged unless both pass with Tests and Packages |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`. No workflow, lockfile or Spree file changes, and the storefront repository has no new commit |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where the captures show it is wrong | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column for CMP-SP-G-02 and CMP-SP-G-03, LIQ-008's SP-AUTH-01 and SP-ORD-02 rows (§6), LIQ-004's FB-19 entry, gap register, existing defects and comparison follow-up, the work item's status line and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at #101's final commit (§13). Not the owner's review. The defects and gaps the part records stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the Seller API's endpoints and the seller audience's permissions, runs them at the batch's revision, and lists what they exercise. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 659 examples, 0 failures, saved as `backend/seller-api-specs.json` (585) and `backend/core-permission-specs.json` (74) (§3.2). What a suspended seller's team may do has no spec and is NOT_RUN (G-107) |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records; a seller-scope check is recorded as such and not as isolation. A new isolation defect is reported to the owner privately and is not published while it is open | NOT_RUN (§3.3). ISO-1 to ISO-7 stay open. No check read or wrote another store's records. The member of two sellers sees each seller's own records only, a seller-scope observation within one store. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys, tokens, reset and invitation links are masked in every capture and replaced in every record | PASS: the stories use invented sellers, products, people and references; the running screens show the test server's records and those the scripts add, with `example.com` addresses. The reset and invitation links' tokens are written as `…`, local addresses as `<site>` and the storefront's order number in a path as `<order>`; no capture draws a key, token or link. The checks' answers mask every field named like a token, secret, password or acceptance link. Before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths (§10) |
| 15 | Behaviours on the seller panel that no browser test drives are listed for the owner's answer, as G-105's were. None is counted as tested | PASS: 16 behaviours are listed in §2.3, each with its evidence and the Spree specs for the server's side. None is counted as tested. They are G-114, for the owner's answer |
| 16 | Each row of §10.5 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row. A row that cannot be reached on the running stack is recorded with the check made instead | PASS (§8): the eight rows were checked where they take effect. Splitting shows a defect (SD-72); the operator's send back, a recorded delivery in a shopper's account and a stock location at checkout could not be reached, and say what was checked instead |
| 17 | EM-S-02 is rendered from Spree's mailer and read as sent, EM-S-03 is read as sent for a teammate, and EM-C-04 stays mapped to part 1 | PASS (§9): EM-S-02, asked for on SP-AUTH-02, and EM-S-03, sent from SP-SET-06, are read as the browser-test server wrote them and captured; EM-C-04 stays with part 1 and G-110 |
| 18 | The comparison follow-up's share (§10.7): every earlier story a part 2 running screen shows is compared and leaves its gap, and LIQ-004's comparison follow-up records what batch 13 leaves | PASS: three earlier stories held by gaps were compared and leave G-65 and G-93, and the pilot's balance summary was compared again; the storefront stories held by G-73 are in the storefront's own Storybook and stay with it ([image review list](2026-11-10-fb-19-batch-marketplace-part-2-image-review.md#earlier-stories), LIQ-004) |

## 1. What was built

- **Stories:** 117 stories for the 27 components of the work item's §10.7, in `packages/liquorify-storybook/src/stories/seller-dashboard/orders/` (16 components, CMP-SP-G-02) and `panel/` (11, CMP-SP-G-03), with fixtures in `src/fixtures/seller/` and Seller API mocks in `src/mocks/handlers/seller/`. They render Spree's own components with the seller panel's own providers (its seller session, tenant and routing context, `seller-panel.ts`). The shared router decorator now gives a page under a seller the seller's route above it, as it gave a page under a store the store's.
- **Reference images:** 234, one per story and theme.
- **Scripts,** in `packages/liquorify-storybook/fidelity/`, none of them a browser test:
  - `seller-panel.ts` adds, on top of part 1's marketplace, four Harbour Cask orders bought through the Store API and worked through the Seller API (new, partly shipped with a claim, canceled with a reason, and part 1's order shipped with deliveries and a return), a member of two sellers and a member of the turned-down seller.
  - `screens-batch-13-part-2.spec.ts` captures the seller panel; `screens-batch-13-part-2-storefront.spec.ts` buys from two sellers on the storefront as a guest.
  - `compare-batch-13-part-2.spec.ts` compares the stories with the running panel.
  - `seller-panel-checks.spec.ts` checks the rows of §10.5 where they take effect, and reproduces SD-72.
  - `seller-panel-mail.spec.ts` reads EM-S-02 and EM-S-03 as the server wrote them; `order-emails.spec.ts`, from batch 8, captures them.

The panel's other parts come from earlier batches' components and keep their stories: the package types and stock locations pages, the import button and export dialog, the address form dialog, the fulfil items form and fulfillment edit dialog, the return and claim dialogs, the product form's cards, and the shell's sidebar, menus and page header. LIQ-009's Storybook column now names the 27.

## 2. The part's map

| Capability | Screens | Flows | Emails | Browser tests | Evidence |
|---|---|---|---|---|---|
| CAP-10-03 The seller panel | SP-AUTH-01 to 04, SP-SHELL-01, SP-HOME-01, SP-PRF-01, SP-SET-01, SP-SET-04, SP-SET-06, SP-OVL-01, SP-OVL-02 | FL-11, the seller's steps | EM-S-02; EM-S-03 for a teammate | `seller-panel-home.spec.ts` (6), `seller-invitation-acceptance.spec.ts` (1), `seller-panel-settings.spec.ts` (5) | 32 states, 35 captures; the invitation and profile checks (§8) |
| CAP-10-02 Seller requirements and onboarding, the seller's side | SP-ONB-01; SP-OVL-01's badge | FL-11 | None | `seller-panel-home.spec.ts`: "accepting the marketplace terms ticks that step off"; `seller-package-types.spec.ts` (1) | 6 states, 6 captures; the requirement and package type checks (§8) |
| CAP-10-04 Product submissions, the seller's side | SP-PRD-01 to 03, with the import and export dialogs | FL-12, the seller's steps | None | `seller-panel-products.spec.ts` (3), `seller-catalog.spec.ts` (1) | 13 states, 14 captures; the product check (§8) |
| CAP-10-05 Orders split by seller | SP-ORD-01, SP-ORD-02; SF-SHOP-05, SF-CHK-01, SF-CHK-03 | FL-13, the seller's and shopper's steps | EM-C-04, mapped to part 1 | `seller-catalog.spec.ts`'s orders step, `seller-panel-earnings.spec.ts`'s order test; none on the storefront | 16 states, 16 captures; the fulfilment, reversal, split and storefront order checks (§8) |
| CAP-10-07 Seller earnings and payouts, the seller's side | SP-FIN-01 to 03 | FL-13 | None | `seller-panel-earnings.spec.ts` (3) | 6 states, 6 captures; the reversal check (§8) |
| CAP-10-09 The seller's delivery, packaging and stock | SP-SET-02, SP-SET-03, SP-SET-05 | None | None | `seller-delivery-methods.spec.ts` (1), `seller-package-types.spec.ts` (1), `seller-panel-settings.spec.ts`'s stock locations test | 7 states, 7 captures; the package type check (§8) |

**Earlier gaps taken in (work item §10.1):** G-85's seller stock locations are captured on SP-SET-05; batch 7's seller delivery methods and package types on SP-SET-02 and SP-SET-03; catalog part 2's seller imports and exports on SP-PRD-01. SD-3's question is answered: both storefront purchases reached Harbour Cask with their shipping and billing addresses (§8), and only part 1's seeded ledger order has none. G-107's question is seen in the panel (§8).

### 2.1 Screens and their states

Each capture is in the [evidence](evidence/2026-11-10-fb-19-batch-marketplace-part-2/README.md) as `screens/<screen>/<state>/<variant>-<theme>.webp`, with a note of how it was reached. The variants are named in §3.1; "member" is Harbour Cask's. "In the browser" marks a state reached by answering a request in the browser (G-108).

| Screen | States captured |
|---|---|
| SP-AUTH-01 Sign in | empty (and on a phone), a wrong password, a store staff member refused, redirected from a panel address |
| SP-AUTH-02 Forgot password | empty, sent |
| SP-AUTH-03 Reset password | the link from EM-S-02 opened, an invalid link, no token |
| SP-AUTH-04 Accept invitation | opened by its invitee, an invalid link; a revoked invitation's link in the invitation check (§8) |
| SP-SHELL-01 Seller picker | two sellers; one seller opens directly, as every member capture shows |
| SP-OVL-01 Panel chrome | the seller switcher open, the user menu open, the phone menu open; the onboarding badge on every seller with requirements outstanding |
| SP-OVL-02 Account dialog | open |
| SP-HOME-01 Home | a member of an approved (and on a phone), onboarding, ready, rejected and suspended seller |
| SP-ONB-01 Setup | the same five sellers; Submit for review disabled while requirements block |
| SP-PRD-01 Products | listed (approved and suspended), none, the import and export dialogs; loading and failed in the browser |
| SP-PRD-02 New product | empty |
| SP-PRD-03 Product | draft, proposed, active, rejected with its reason, the take down confirmation, a suspended seller's product |
| SP-ORD-01 Orders | listed, none; loading in the browser |
| SP-ORD-02 Order | new, partly shipped with a claim, canceled, shipped with deliveries and a return, no items or addresses (part 1's ledger order), the fulfil form, the cancel dialog, the new return dialog, not found; failed in the browser |
| SP-FIN-01 Earnings | a balance with sales, nothing earned |
| SP-FIN-02 Payouts | listed, none |
| SP-FIN-03 Payout | pending, completed |
| SP-PRF-01 Profile | filled (approved and onboarding), the edit profile sheet, the business name cleared (its save refused in the browser), the billing address dialog |
| SP-SET-01 Settings | the index |
| SP-SET-02 Delivery methods | listed, none (the rejected seller), the new method sheet |
| SP-SET-03 Package types | none, the add sheet; one added in the package type check (§8) |
| SP-SET-04 Policies | none, the new policy sheet |
| SP-SET-05 Stock locations | listed, the edit sheet |
| SP-SET-06 Team | a member and a pending invitation, the invite dialog, the only member (the suspended seller) and its menu, which keeps the last member |
| SF-SHOP-05 Cart | two sellers' products, at 1280 and 390 pixels |
| SF-CHK-01 Checkout | the delivery step with a shipment and rate for each seller ("Ships from Harbour Cask Co.", "Ships from Saltmarsh Gin Co."), at both widths |
| SF-CHK-03 Order placed | the order group placed, at both widths (SD-80) |

**Not reached** (G-116, with the check made instead): a pending or invited seller signed in (G-113); a requirement sent back with the operator's reason and one waived, seen only in part 1's operator captures; a product archived, withdrawn from review or with field errors on the new product form, whose Save stays disabled until the form changes; a split, a label and a recorded delivery's dialog on screen (the split is checked through the Seller API, §8); payouts processing, failed or unresolved, which need a real provider (P4); the package types and policies pages listed, and stock locations empty.

### 2.2 FL-11, FL-12 and FL-13, the seller's steps

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| FL-11: accept an invitation | SP-AUTH-04 | `seller-invitation-acceptance.spec.ts`: "an invited seller accepts and lands in their own panel" | opened-by-invitee, invalid-link |
| FL-11: sign in, reset a password | SP-AUTH-01 to 03 | `seller-panel-home.spec.ts`: "signs in with the form and lands on the seller home", "refuses a wrong password", "sends a password reset link", "signs out back to the sign-in page" | the captures; EM-S-02 read as sent and its link opened (§9) |
| FL-11: complete requirements | SP-ONB-01 | `seller-panel-home.spec.ts`: "accepting the marketplace terms ticks that step off"; `seller-package-types.spec.ts` | the requirement and package type checks (§8) |
| FL-11: submit for review | SP-ONB-01 | None | submit-while-requirements-block, the button disabled; no seller here met every requirement |
| FL-11: profile, policies, team | SP-PRF-01, SP-SET-04, SP-SET-06 | `seller-panel-settings.spec.ts`: the profile, policies and team tests | the profile and invitation checks (§8) |
| FL-12: list a product | SP-PRD-02 | `seller-catalog.spec.ts`: "a seller lists a product and sees their orders" | empty |
| FL-12: submit it for review | SP-PRD-03 | `seller-panel-products.spec.ts`: "submits a draft for review" | the product check (§8) |
| FL-12: see the operator's answer | SP-PRD-03 | None | rejected, with the operator's reason from part 1; active |
| FL-13: buy from two sellers | SF-SHOP-05, SF-CHK-01, SF-CHK-03 | None on the storefront | two guest purchases with the Check method, each one order group of two sellers' orders |
| FL-13: the seller's order | SP-ORD-01, SP-ORD-02 | `seller-panel-earnings.spec.ts`: "lists the seller's order and opens it with what it earned" | the storefront order check (§8); the captures, on orders bought through the Store API by `seller-panel.ts` |
| FL-13: fulfil, return, cancel | SP-ORD-02 | None | the fulfilment, reversal and split checks (§8) |
| FL-13: earnings and payouts | SP-FIN-01 to 03 | `seller-panel-earnings.spec.ts`: "shows the balance and the sale behind it", "lists payouts and opens one to see the earnings it covers" | the captures; the reversal check (§8) |

The captures of SP-ORD-02 show orders `seller-panel.ts` bought through the Store API before the storefront ran, as part 1 did, so each state is set up the same way on every run. The storefront's two purchases reached the seller panel as Harbour Cask's R1012-1 and R1013-1, paid, with their addresses (§8).

### 2.3 Behaviours no browser test drives (criterion 15)

Each was shown by a capture or a check, or is named as not shown, and none is counted as tested. The server's side of each is exercised by the Seller API specs in §3.2. They are G-114, for the owner's answer.

1. Fulfilling an order from the order page (fulfilment check).
2. Splitting a parcel (split check, through the Seller API; SD-72).
3. Recording a delivery and uploading a label (made through the Seller API by `seller-panel.ts`; not on screen).
4. Creating, receiving and refunding a return (new return dialog; reversal check).
5. Opening, approving, denying and resolving a claim (a claim opened through the Seller API; the rest not shown).
6. Exchanges, which the Seller API refuses (SD-73, G-112).
7. Cancelling an order, with its reason (cancel dialog; made through the Seller API).
8. Editing an order's special instructions, internal note and shipping address (not shown).
9. Taking a product down and archiving it (take down confirmation).
10. Importing and exporting products (the dialogs opened).
11. The billing address, returns address and tax registration on the profile (the billing dialog opened).
12. The account dialog: name, photo and language (opened; SD-78).
13. Switching between two sellers (switcher open).
14. Submitting for review when requirements are met (the button seen disabled while they block).
15. Choosing a new password from the reset link (the link opened; no password chosen).
16. A store staff member refused at sign-in (captured).

## 3. Permissions and isolation

### 3.1 What the interface shows each variant

Every member of a seller holds that seller's own role, with the whole seller vocabulary; Spree offers no narrower seller role, and none was made (work item §10.10, choice 2).

| Variant | Who | What the panel shows |
|---|---|---|
| member | Ines Carvalho, Harbour Cask Co., approved | Every screen with every control; the setup badge reads 3/9, because part 1 approved Harbour Cask with requirements outstanding through the override |
| twoSellers | Mara Quill, Harbour Cask and Saltmarsh Gin Co. | The seller picker, then the switcher listing both; each seller's own orders and products only |
| onboarding | Maya Okafor, Stonecrop Cellars | Home and Setup with 1 of 9 done, and Submit for review shown but disabled while 8 requirements remain; empty products, orders, earnings and payouts |
| ready | Theo Lindqvist, Juniper Row Distillers | Home with the status Ready For Review and "Your products are not on sale yet" |
| rejected | Elin Voss, Northgate Vintners | Home with the status Rejected and "Finish setting up" at 0 of 9, with Continue setup; settings still open, with no delivery methods |
| suspended | Sam Reyes, Copperline Brewing | Home with the status Suspended, "Finish setting up" at 1 of 9 and "Your products are not on sale yet", while the shopper can still buy its product (SD-60); products listed and editable; the team page with its only member, whose menu keeps the last member |
| signedOut | Nobody | The public screens; a panel address redirects to sign in |
| storeStaff | The browser-test server's admin | Refused at sign-in with the same message as a wrong password: "That email and password did not match a seller account." |

### 3.2 What the server refuses

Spree's own specs, run at `1342549c`: the Seller API's controller specs for every endpoint the work item names (auth, me, profile, onboarding, requirement submissions, products, product types, imports, exports, orders, fulfillments, deliveries, labels, notes, returns, exchanges, claims, cancellation and return reasons, balances, transfers, payouts, policies, team, invitations and their acceptance, password resets, delivery methods, profiles and zones, package types, stock locations and tax identifiers) and the seller integration specs: 585 examples, 0 failures (seed 17097). The core permission specs, `permission_configuration_spec.rb` and `ability_spec.rb`, with the seller audience's: 74 examples, 0 failures (seed 28184).

What they exercise: each endpoint as a member of the seller named in the request; 56 examples that another seller's record answers not found; 9 that naming no seller, or a seller the caller does not belong to, is forbidden; 4 that a missing or invalid token is refused; and that the seller audience gets the seller resources and never the operator's. 14 examples check that another store's records are left out; they are Spree's own and are not this batch's isolation check (§3.3). No spec exercises what a suspended seller's team may do, which stays NOT_RUN with G-107.

### 3.3 Whether each store's data stays in that store

NOT_RUN for the batch. The open isolation findings ISO-1 to ISO-7 ([LIQ-004](../LIQ-004-foundation-backlog.md)) stay open and the multi-tenant release block stays. Every check ran in the browser-test server's one store. The member of two sellers seeing each seller's own records only is a seller-scope observation within one store, recorded as such and not as isolation. No new isolation defect was found; none was looked for beyond Spree's own specs.

## 4. Comparison with running screens

### 4.1 Results

`compare-batch-13-part-2.spec.ts` puts each story beside the same component on the running seller panel, in light and dark, and compares the computed styles of every distinct element. The [evidence index](evidence/2026-11-10-fb-19-batch-marketplace-part-2/README.md#comparison-with-running-screens-light-and-dark) lists the 32 cases.

- **No difference:** 29 cases, among them the order's summary, customer, payment, notes, earnings, fulfillments, returns and claims cards, the fulfil form, the cancel dialog, the product status card, the business, tax and returns address cards, the balance summary, the switcher and the setup badge, and the package types page's two earlier stories.
- **b13p2-account-dialog (3 elements in each theme):** the close button's focus ring. The story's dialog opens with the close button focused and showing its ring; on the running panel the dialog was opened from the user menu with the pointer, and the browser shows no ring. Layout, text and colours otherwise match.
- **b13p2-new-return (3 elements in each theme):** heights. The running dialog's submit button reads the raw key `orders.post_sale.returns.create_submit`, which wraps onto two lines and makes the footer taller (SD-74); the story's Storybook translations hold the key's English, which is how the defect stayed hidden there (G-115).
- **b13p2-earlier-fulfill-items-form-all-units (6 elements in each theme):** data. The dashboard-ui story has two products with pictures and an option line, the running order one product with no picture, so the rows' heights differ and the story draws a divider between its two rows. It is drawn at the dashboard's card width (609 pixels) where the seller panel nests it in a fulfillment card (583).

### 4.2 Earlier stories

Batch 7's package types page, None and Add sheet (G-65), batch 8 part 2's fulfil items form, All units (G-93), and the pilot's balance summary, One currency, were compared ([image review list](2026-11-10-fb-19-batch-marketplace-part-2-image-review.md#earlier-stories)). The stock locations page, the import sheet and the address dialog's empty state, which part 2's screens also show, were compared by earlier batches. The storefront stories a seller's checkout shows stay with G-73, because they are in the storefront's own Storybook, which this part does not build.

### 4.3 Corrections

The first comparison run found seven stories drawn in a different column or frame from the running panel. Each was corrected in the story or its providers, never in Spree's component, its references written again, and its comparison run again:

- The business details, tax registration and returns address cards were drawn in the page's main column (635 pixels); the profile page puts them in its sidebar (306). Their titles now wrap as they do on the panel.
- The seller switcher was drawn without the rail's collapse button beside it, so it was 223 pixels wide instead of 184. Its story now draws the rail's header as the panel does.
- The fulfil form, the deliveries list and the label row were drawn at a main card's inner width (609 pixels); the panel draws them inside a fulfillment's own card within the Fulfillments card (583). The story providers gained that width.
- The balance case compared one card on the screen with the whole summary in the story; the case now compares the summary on both sides.

## 5. Behaviour found, recorded and not changed

Each is an existing defect in Spree's code at `1342549c`, recorded for the owner and not fixed. The numbers are the defect register's.

| ID | What happens | Evidence |
|---|---|---|
| SD-72 | Splitting a paid parcel adds a second delivery charge after payment, so the order is left partly paid and fulfilling the moved unit is refused: R1014, paid 90.50, became 97.00 with 6.50 due, and the fulfil answered 422 "This order is not paid for yet" | `checks/split-after-payment/answers.json` |
| SD-73 | The Seller API refuses every exchange on the seller's own products, answering 404 `variant_not_found`, because it looks the replacement up by a seller column Spree leaves blank on a product the seller owns; a claim's replacement uses the same lookup | `seller-panel.ts`'s exchange request, its answer kept in `checks/seed-state.json` (`exchangeRefused`); the claim's lookup read in `claims_controller.rb`, not sent |
| SD-74 | The New return dialog's submit button shows the raw key `orders.post_sale.returns.create_submit` | SP-ORD-02 new-return-dialog; §4.1 |
| SD-75 | Saving the label upload dialog with no tracking number shows the form library's raw message, "Too small: expected string to have >=1 characters" | the label upload dialog's "Saved with no file" story, which runs Spree's own dialog and its own form check in the browser; checked against its source |
| SD-76 | Untranslated wording: the seller picker shows statuses as stored ("approved"), and the order's note card is titled "Internal Note" | SP-SHELL-01 two-sellers; SP-ORD-02 new |
| SD-77 | Clearing the business name in Edit your profile outlines the field in red with no message | SP-PRF-01 edit-profile-name-cleared |
| SD-78 | The account dialog saves a blank first name, which the server accepts | the Seller API's `me` endpoint answered a blank first name with 200 and stored it empty (checked on the browser-test server for the two-seller member, then put back); the dialog has no check of its own |
| SD-79 | An order that does not exist reads "Something went wrong" rather than saying it was not found | SP-ORD-02 not-found |
| SD-80 | The storefront's order placed page for a two-seller purchase shows only the group's number, not each seller's order | SF-CHK-03 order-group-placed |
| SD-81 | The storefront checkout's payment method radio has no accessible name | SF-CHK-01; the storefront script waits for the method's text instead |

Seen again and given no new number: a failed list shows its empty state rather than an error (part 1's B17, SP-PRD-01 failed, which reads "No products yet"); a suspended seller's team can still edit and create products, and the shopper still sees them (G-107, SD-60); the storefront's checkout sends no order group confirmation the server writes (G-110).

## 6. Corrections

LIQ-008 is corrected where the captures show it is wrong:

- **SP-AUTH-01:** a store staff member who is not a seller's member is refused with the wrong password's message; added to its states.
- **SP-ORD-02:** the order page also opens and works claims, and shows an exchanges card only while an order has an exchange; added to its tasks and states.

## 7. Gaps

| ID | Gap | Proposed |
|---|---|---|
| G-112 | Exchange cards cannot be reached on the running stack while SD-73 stands; their five stories are checked against their source only | Close with SD-73's answer |
| G-113 | Pending and invited sellers have no member, so their home and setup screens are not captured signed in | For the owner's answer: add a member through the seed, or accept the operator's captures from part 1 |
| G-114 | 16 seller panel behaviours no browser test drives (§2.3) | For the owner's answer, as G-105 |
| G-115 | The seller panel stories load Storybook's translations, which differ from the running panel's, so a missing key (SD-74) reads correctly in a story | For the owner's answer: load the panel's own translation files in the seller panel story group |
| G-116 | 89 of the 117 stories not compared by the script (21 seen in a capture, 68 checked against their source only), and the states of §2.1 no capture reached | Defer to the comparison follow-up, as G-111 |

## 8. Changes checked where they take effect (criterion 16)

Each check is in `seller-panel-checks.spec.ts`, signed in to the panel as the seller's member, with the answers of both sides in `checks/<check>/answers.json`.

| Row of §10.5 | What was done | Where it took effect | Result |
|---|---|---|---|
| A product submitted, approved or sent back | Harbour Cask's draft sampler submitted from its page | The Admin API reads it proposed; the Store API answers 404 for it. Approved and sent back by the operator are seen on SP-PRD-03 active and rejected, with part 1's reason | PASS |
| A requirement completed | Stonecrop accepts the terms from Setup | The operator's onboarding reads 2 of 9 done, from 1 | PASS. The operator sending it back, seen again in the panel, was not reached (G-116); part 1's requirements check covers the operator's side |
| A delivery method, package type and stock location | A shipping box added: named only, then measured and set as default | Named only, Shipping box stays outstanding; measured and default, both the seller and the operator read 3 of 9. Each seller's delivery method is offered at the storefront's checkout for that seller's shipment (SF-CHK-01) | PASS. A requirement needs a default box with its measurements, as Spree's `package_type` requirement reads. Which stock location a shipment leaves from is not shown at checkout, so it was not checked there |
| Fulfilling, splitting, recording a delivery | R1009 fulfilled from the order page; a paid parcel split through the Seller API | The operator reads R1009 fulfilled with an earning transfer of 42.45, and the returned order's two recorded deliveries. The split leaves R1014 partly paid and its fulfil refused | PASS for fulfilling and deliveries; splitting shows SD-72. The shopper's order in a storefront account was not reached: the purchases are a guest's |
| A return or a cancellation | R1008-1's return received and refunded from the returns card; R1011-1 canceled by `seller-panel.ts` | A refund reversal of −35.95 on both the seller's and the operator's transfers, and the balance's earned and payable amounts after it; the canceled order has no transfers and its payment is voided | PASS |
| The seller's profile and policies | Read through the Store API a storefront uses | The store's seller answers with its name and description; the store's policies are listed. The storefront's checkout names each seller on its shipments | PASS. The storefront draws no seller profile or seller policy page |
| A teammate invited and revoked | Invited from SP-SET-06, then revoked | EM-S-03 written to the invitee, with a link to the panel; after revoking, the link reads "This invitation is no longer valid" | PASS |
| A suspended seller | Copperline's member, through the Seller API | Profile read, its product edited (200) and a new product created (201); the shopper still sees the product (200) | PASS as observed; what a suspended seller may do stays G-107, and the product on sale stays SD-60 |

**The storefront's purchases reached the seller.** Harbour Cask's share of the two storefront purchases, R1012-1 and R1013-1, read through the Seller API: placed, paid, unfulfilled, 42.00 plus 6.50 delivery, each with its shipping and billing address (`checks/storefront-order-reaches-seller/answers.json`). This answers SD-3's open question for a real order.

## 9. Emails (criterion 17)

| Email | How it was sent | Read as sent |
|---|---|---|
| EM-S-02 Seller user password reset | Asked for on SP-AUTH-02 by Harbour Cask's member, in the captures | The browser-test server wrote "Shop Password Reset Instructions" to the member, with a link to the panel's `/reset-password`; the link was opened for SP-AUTH-03 link-opened |
| EM-S-03 Invitation, for a teammate | Sent from SP-SET-06 in the invitation check | "Invitation to join Harbour Cask Co." written to the invitee, with a link to the panel's `/accept-invitation/<id>` |
| EM-C-04 Order group confirmation | Mapped to part 1 | Not written for the storefront's purchases; stays with G-110 |

Both are captured at 390 and 1280 pixels from the HTML the server wrote, rendered by Spree's own mailers, with their tokens masked (`emails/`). The server wrote them to its mail folder (`LIQUORIFY_MAIL_DIR`) rather than to an inbox.

## 10. CI runs and local checks

- **Local, at `1342549c` with the pull request's stories and scripts, on a fresh browser-test database:** the seller panel captures, 162 passed; the storefront captures, 2 passed; the comparison, 64 passed, 14 of them run again after the corrections of §4.3; the checks of §8, 9 passed; the emails, 1 passed, and their captures, 4 images.
- **Spree's specs:** 585 Seller API and 74 core permission examples, 0 failures (§3.2).
- **The visual check, locally in the pinned image:** the 234 new references written, and the changed stories' references written again after §4.3 (34 and 28 passed). The full suite runs in CI.
- **CI:** the two full visual runs, Tests and Packages on the final commit are named in the merge record. Spree's seller panel browser tests run in Tests.
- **Before each push:** every added line searched for the shapes of keys, tokens, passwords, personal addresses and machine paths; the image conversion checked pixel for pixel; the record's links checked.

## 11. Limitations

- The comparison is diagnostic and covers 28 of the 117 stories; the rest are seen in a capture or checked against their source (G-116).
- The captures show what the interface does; they claim nothing about the server beyond the answers recorded in §8.
- The pending and invited sellers, payouts beyond pending and completed, and carrier and label states need a member, a real provider or a carrier, and are not shown (G-113, P4).
- The storefront was captured as a guest; a signed-in customer's checkout stays blocked by SD-21.
- The run logs of the captures and the comparison were not kept; their counts are in §10, and every capture and comparison has its own note.

## 12. Evidence

The [evidence index](evidence/2026-11-10-fb-19-batch-marketplace-part-2/README.md) lists every capture, comparison, check, email and spec result, 244 lossless WebP images in all. The reference images are in `packages/liquorify-storybook/visual/__screenshots__/seller-panel-*`, listed in the [image review list](2026-11-10-fb-19-batch-marketplace-part-2-image-review.md).

## 13. Delegated acceptance

Criterion 11 is met by delegated acceptance, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at #101's final commit, once the acceptance criteria, both visual runs, Tests and Packages pass. That is not the owner's review. SD-72 to SD-81 and G-112 to G-116 stay for the owner's answers, with SD-60 to SD-70 and G-105 to G-111 from part 1. Tenant isolation stays NOT_RUN, ISO-1 to ISO-7 stay open, FB-03 stays paused and the multi-tenant release block stays. These deferrals do not mark unverified behaviour PASS.
