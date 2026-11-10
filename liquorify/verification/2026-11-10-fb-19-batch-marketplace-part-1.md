---
title: FB-19 batch 13 part 1, the operator's seller screens
record: verification
work_item: FB-19
date: 2026-11-10
verifier: Claude (automated session); not independent review
result: PASS for the map, the 70 stories and their images, the running-screen captures, the comparison with running screens, 26 cases and 2 earlier stories in both themes with every difference explained, and Spree's own specs for the batch's endpoints, models, workflows and mailers, 973 examples with no failures. Every state the work item lists for the eight seller screens and the six screens' marketplace states is captured or recorded as a correction, and 14 states were reached by answering a request in the browser. FL-11, FL-12 and FL-13's operator steps are traced step by step, with the steps no browser test drives recorded. PASS for the ten rows of §2.4, each checked where it takes effect; two of them show existing defects (SD-60, SD-61). PASS for the emails, rendered from Spree's own mailers, with the seller emails switch and the seller invitation read as sent on the emails gem's test app. Backend authorization for the narrower roles beyond Spree's own specs, and tenant isolation, are NOT_RUN. Eleven existing defects (SD-60 to SD-70) and seven gaps (G-105 to G-111) are recorded for the owner. Criterion 8 counts CI on the final commit, named in the merge record
---

# FB-19 batch 13 part 1, the operator's seller screens

**Claim.** The [batch 13 work item](../work-items/fb-19-batch-marketplace.md) reproduces what Spree already has for running a marketplace. Part 1, recorded here, is the operator's side in the dashboard: sellers and their onboarding, commission rates, seller transfers and payouts, the marketplace settings and seller requirements, and the marketplace states of the product, order, home and report screens. It gives the 19 new components those screens use 70 Storybook stories with light and dark reference images. It captures the fourteen screens on Spree's running dashboard in each state the work item lists and for each of eight roles. It traces the operator's steps of FL-11, FL-12 and FL-13, and checks on the running stack that the operator's decisions and the marketplace settings take effect where they should. Spree's code and the storefront are not changed. Whether Liquorify uses a marketplace at all is not decided here: LIQ-006 marks §10 "not needed yet".

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | #98, branch `claude/project-thread-tcfmf8`. It starts from `main` at `0950e2de`, the revision the work item names: the work item is `6b163aad`, the stories, fixtures, mocks, reference images, seed and capture script `7b11756c`, the comparison `495e704f`, the checks of §2.4 `44363bfb`, and the email rendering `bbe95678`. `main` was merged in at `bb831c0f`, bringing #96 and #97, which change no file this batch uses. Later commits change Liquorify's records only, or bring in `main`. The final commit is named in the merge record |
| Spree's code: the dashboard, its packages, the SDKs and the gems | Unchanged: `git diff` between `main` and the branch over `spree/`, `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk`, `.github` and `pnpm-lock.yaml` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures (the browser-test server), at that code, in the pinned Playwright 1.64.1 image. The emails were rendered on the emails gem's own test app against a copy of that server's database (§9). Captures are 1280 by 960 pixels, and 390 by 844 for the phone captures; a page captured whole grows the window to the page's height |
| The storefront | Not used. FL-13's purchase went through the Store API (§2.2) |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-marketplace.md#5-acceptance-criteria-for-part-1)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped, and every part 2 ID named with its part | PASS: the map in §2 has CAP-10-01, 02 and 04 to 08 with their fourteen screens, the operator's steps of FL-11 to FL-13, the `sellers`, `commissions`, `payouts`, `products`, `orders` and `settings` scopes, the 19 components, Spree's 25 browser tests in six files, and the six email IDs, each with its evidence or a named gap. CAP-10-03, CAP-10-09, EM-S-02 and the seller's flow steps are named as part 2's |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 19 new components, 70 stories, 140 reference images, each looked at in both modes ([image review list](2026-11-10-fb-19-batch-marketplace-part-1-image-review.md)). The running screens use the 19 the work item named. The reused components are the work item's §3 list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | PASS for every listed state, with the states no server reaches recorded as corrections (§6). 86 states of the fourteen screens are captured, in 127 captures with the role and phone variants, each in light and dark, 254 images. 14 states were reached by answering a request in the browser, and say so (§2.1, G-108) |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen, and the seven narrower roles on the screens and states their variant names |
| 5 | The operator's flow steps are traced step by step to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | PASS. The operator's steps of FL-11, FL-12 and FL-13 are traced (§2.2). The steps with browser tests map to Spree's `sellers.spec.ts`, `commission-rates.spec.ts`, `seller-ledger.spec.ts`, `seller-requirements.spec.ts`, `marketplace-settings.spec.ts` and `list-filters.spec.ts`, which run in CI at the pull request's revision (§10). The steps no browser test drives are listed under criterion 15 (G-105) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | PASS (§4): 26 cases of the batch's stories and 2 earlier stories were compared in both themes, 56 comparisons, and every difference is explained by the data, by where the pointer or focus is, or by the screen's layout. One story's data was corrected (§4.3) |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 44 of the 70 stories were not compared by the script; 31 show a state seen in a capture, and 13 were checked against their source only (G-111, image review list). Every capture whose state was reached in the browser names how in its note, and claims nothing about the server (§2.1, G-108) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance, every part of each run; Tests and Packages pass; the check stays advisory | Recorded in the merge record, which names the two full runs on the final commit (§10). Nothing is merged unless both pass with Tests and Packages |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from merges of `main`. No workflow, lockfile or Spree file changes |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked; LIQ-008 corrected where §2.7 or the captures show it is wrong | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-008's DA-ORD-04 row (§6), LIQ-004's FB-19 entry, progress tables, gap register, existing defects and comparison follow-up, the work item's status and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | DELEGATED ACCEPTANCE, under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), at #98's final commit (§13). Not the owner's review. The defects and gaps the batch records stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | PASS for Spree's own specs: 973 examples, 0 failures and 3 pending, saved as `backend/api-specs.json` (359), `backend/core-specs.json` (559) and `backend/email-specs.json` (55) (§3.2). Most run as the store's admin; a few send a narrower role or a key's scopes. What no spec exercises for the narrower roles is NOT_RUN and is proposed to join G-11 (G-106) |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | NOT_RUN (§3.3). ISO-1 to ISO-7 stay open. No check read or wrote another store's records. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Every name, address, email and reference in stories and captures is invented, and no credential appears in any committed file, checked by a search of the pull request's files before each push. Publishable keys, tokens and invitation links in a captured email or page are masked in every capture and replaced in every record | PASS: the stories use invented sellers, products, people and references; the running screens show the test server's records and the records the scripts add, with `example.com` addresses. The invitation link's token in EM-S-03 is replaced by `<token>`, the store's ID by `<store>` and the test servers' addresses by `<site>`. The checks' answers mask every field named like a token, secret or password. No capture draws a key or a token. Before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths (§10) |
| 15 | Behaviours on these screens that no browser test drives are listed for the owner's answer, as G-87's, G-90's, G-92's and G-100's were. None is counted as tested | PASS: 14 behaviours no browser test drives are listed in §2.3, each with its evidence and the Spree specs for the server's side. None is counted as tested. They are G-105, for the owner's answer |
| 16 | Each row of §2.4 is checked where it takes effect, with captures or the read values of both sides and the result recorded per row | PASS (§8): all ten rows were checked where they take effect. Two show defects: a suspended seller's product can still be bought (SD-60), and an approved seller's product goes on no sales channel, so it is not on sale (SD-61) |
| 17 | EM-O-03 to EM-O-05, EM-C-04 and EM-O-02 are rendered from Spree's mailer previews, EM-S-03 is mapped, and each is read as sent where the stack sends it or recorded as not reachable | PASS (§9): the six emails are rendered by Spree's own mailers on the emails gem's test app. Spree ships previews for the order group emails and none for the seller emails, so those three are built by calling the mailer as a preview would. EM-O-03, EM-O-05 and EM-S-03 are read as sent through Spree's workflows and subscribers; EM-O-04, EM-C-04 and EM-O-02 are not read as sent (G-110) |
| 18 | The comparison follow-up's share: every earlier story a part 1 running screen shows is compared and leaves its gap, and every other story held for batch 13 keeps its status with part 2 or the follow-up named as its destination | PASS: two earlier stories were compared and leave G-65 and G-24; the seller panel's earlier stories wait for part 2 ([image review list](2026-11-10-fb-19-batch-marketplace-part-1-image-review.md#earlier-stories)) |

## 1. What was built

- **Stories:** 70 stories for the 19 components of the work item's §3, in `packages/liquorify-storybook/src/stories/dashboard/sellers/`, `orders/` and `products/`, with fixtures and mocks for the seller, onboarding, team, invitation, balance, payout, transfer and commission line endpoints. The stories hold canonical values only and render Spree's own components with Spree's own providers, as earlier batches do.
- **Reference images:** 140, one per story and theme.
- **Scripts,** in `packages/liquorify-storybook/fidelity/`, none of them a browser test:
  - `marketplace-seed.rb` and `marketplace.ts` make the marketplace on the browser-test server: eight sellers in each status a workflow reaches, their onboarding, products and ledger, delivery methods recorded through the Seller API, two commission rates, and the store's own order and an order group bought through the Store API, with one of its orders fulfilled.
  - `staff.ts` adds the batch's five custom roles and their teammates through the Admin API.
  - `screens-batch-13.spec.ts` captures the running screens; `compare-batch-13.spec.ts` compares the stories with them.
  - `marketplace-checks.spec.ts` checks the ten rows of §2.4 where they take effect.
  - `marketplace-emails.rb` renders the six emails with Spree's own mailers and reads what the seller emails switch and a seller invitation send; `order-emails.spec.ts`, from batch 8, captures them.

The coverage report lists the 19 components with their stories, and LIQ-009's Storybook column now names them.

## 2. The batch's map

| Capability | Screens | Flows | Emails | Browser tests | Evidence |
|---|---|---|---|---|---|
| CAP-10-01 Sellers | DA-SEL-01, DA-SEL-02 | FL-11, the operator's steps | EM-O-03 to EM-O-05; EM-S-03 for a seller | `sellers.spec.ts` (9); `list-filters.spec.ts`: "filters sellers by status" | 35 states, 62 captures; the lifecycle and override checks (§8) |
| CAP-10-02 Seller requirements and onboarding, the operator's side | DA-SET-23; DA-SEL-02's onboarding card | FL-11 | None | `seller-requirements.spec.ts` (3) | 6 states, 10 captures; the requirements check (§8) |
| CAP-10-04 Product submissions and review, the operator's side | DA-PRD-01's seller column and filter; DA-PRD-03's seller card, status and review actions | FL-12, the review step | None | None | 9 states, 14 captures; the product checks (§8) |
| CAP-10-05 Orders split by seller, the operator's side | DA-ORD-01's seller column and filter; DA-ORD-04's marketplace card | FL-13's checkout, through the Store API | EM-C-04, EM-O-02 | None | 7 states, 11 captures |
| CAP-10-06 Commissions | DA-SEL-03; DA-ORD-04's commission card | None | None | `commission-rates.spec.ts` (6) | 8 states, 10 captures; the commission check (§8) |
| CAP-10-07 Seller earnings, transfers and payouts, the operator's side | DA-SEL-04, DA-SEL-05, DA-SEL-06; DA-SEL-02's balance and settlement cards; DA-ORD-04's seller transfers card; DA-HOME-01's sellers ranking; DA-RPT-03's seller payouts report | FL-13, the operator's step | None | `seller-ledger.spec.ts` (4) | 16 states, 20 captures; the mark paid and ranking checks (§8) |
| CAP-10-08 Marketplace settings | DA-SET-22 | None | None | `marketplace-settings.spec.ts` (2) | 5 states, 9 captures; the settings checks (§8) |

**Part 2's:** CAP-10-03 and CAP-10-09, every seller panel screen, the seller's steps of FL-11 to FL-13, EM-S-02, and the parts of earlier gaps that need a seller's screens (work item §2.6).

### 2.1 Screens and their states

Each capture is in the [evidence](evidence/2026-11-10-fb-19-batch-marketplace-part-1/README.md) as `screens/<screen>/<state>/<variant>-<theme>.webp`, with a note of how it was reached. "In the browser" marks a state reached by answering a request in the browser (G-108).

| Screen | States captured |
|---|---|
| DA-SEL-01 Sellers | listed (five roles), filtered by status, searched, the add sheet, a refused add, the delete confirmation, direct visits by three roles; none, loading and failed in the browser |
| DA-SEL-02 Seller | each of the seven statuses a workflow reaches, approved on a phone and for four roles, onboarding for two; the invite sheet; the suspend, reject and reopen confirmations; the approve override confirmation; reinstate; the edit profile and settlement sheets; the onboarding send back and waive confirmations; the team's invite sheet and revoke and remove confirmations; the settle confirmation for the admin and the payouts clerk; not found; direct visits; loading and failed in the browser |
| DA-SEL-03 Commission rates | listed (three roles), the create and edit sheets, a refused create, the delete confirmation, the old settings address, direct visits; none in the browser |
| DA-SEL-04 Seller transfers | listed, direct visits; none in the browser |
| DA-SEL-05 Payouts | listed, searched, the old settings address, direct visits; none in the browser |
| DA-SEL-06 Payout | pending (three roles), the mark paid dialog, completed, not found |
| DA-SET-22 Marketplace | saved (two roles and a phone), direct visits; loading, failed and a refused save in the browser |
| DA-SET-23 Seller requirements | listed (three roles), the add and edit sheets, the delete confirmation, direct visits; none in the browser |
| DA-PRD-01 Products | the seller column (two roles), filtered by seller |
| DA-PRD-03 Product | proposed (three roles), the approve confirmation, the reject reason, rejected, approved, a suspended seller's product, the store's own |
| DA-ORD-01 Orders | the seller column (two roles), filtered by seller |
| DA-ORD-04 Order | a seller's order settled (two roles) and not settled, the store's own (two roles), a direct visit; the commission card failing in the browser |
| DA-HOME-01 Home | the sellers ranking, hidden for three roles; no data in the browser |
| DA-RPT-03 Report | the seller payouts report |

### 2.2 FL-11, FL-12 and FL-13, the operator's steps

| Step | Screen | Browser tests | Evidence |
|---|---|---|---|
| FL-11: add a seller | DA-SEL-01 | `sellers.spec.ts`: "back from a new seller lands on the list", "lists sellers"; `list-filters.spec.ts`: "filters sellers by status" | DA-SEL-01 add-sheet, add-refused (SD-66) |
| FL-11: invite | DA-SEL-02 | `sellers.spec.ts`: "invites someone to run the seller" | invite-sheet; EM-S-03 read as sent (§9) |
| FL-11: review the onboarding, accept, send back and waive | DA-SEL-02 | None | the requirements check (§8) |
| FL-11: approve, and the override | DA-SEL-02 | None | the lifecycle and override checks (§8) |
| FL-11: reject, suspend, reinstate, send back to onboarding | DA-SEL-02 | None | the lifecycle check (§8) |
| FL-12: find a seller's product | DA-PRD-01 | None | filtered-by-seller; the products check's list by seller (§8) |
| FL-12: approve, or send back with a reason | DA-PRD-03 | None | the products check (§8) |
| FL-13: a purchase from two sellers | Store API | None | `marketplace.ts` bought the store's own product (R1007) and then one product from each of two sellers (order group R1008), through the Store API with the browser-test server's cheque method |
| FL-13: the group's orders, their commission and transfers | DA-ORD-01, DA-ORD-04 | None | the captures; the commission check (§8) |
| FL-13: the transfer | DA-SEL-04 | `seller-ledger.spec.ts`: "lists what a seller earned", "links an earning to the order that produced it" | listed |
| FL-13: mark paid | DA-SEL-05, DA-SEL-06 | `seller-ledger.spec.ts`: "marks a payout as paid, with the reference it went out under", "a payout itemises the earnings it covers" | the mark paid check (§8) |

### 2.3 Behaviours no browser test drives (criterion 15)

Each was shown by a capture or a check, and none is counted as tested. The server's side of each is exercised by the Spree specs named in §3.2. They are G-105, for the owner's answer.

1. Approving a seller from ready for review, with no confirmation when nothing is outstanding (lifecycle check, 3-approved).
2. Approving with requirements outstanding, refused without the override and accepted with it (override check).
3. Suspending a seller, from the More actions menu, with its confirmation (lifecycle check, 4-suspended).
4. Reinstating a suspended seller (lifecycle check, 6-reinstated).
5. Rejecting a seller not yet admitted, and the server refusing to reject one already approved (lifecycle check, 7-rejected).
6. Sending a seller back to onboarding from ready for review (lifecycle check, 1-sent-back-to-onboarding).
7. Accepting, sending back and waiving an onboarding requirement (requirements check).
8. Approving a seller's product, with its confirmation (products check, 1-approved).
9. Sending a seller's product back with a reason (products check, 2-reason, 3-sent-back).
10. Filtering products and orders by seller (DA-PRD-01 and DA-ORD-01 filtered-by-seller).
11. A marketplace order's marketplace, commission and seller transfers cards (DA-ORD-04).
12. Settling a seller by hand from the balance card (DA-SEL-02 settle-confirm; opened, not answered).
13. Automatic approval of sellers and of their products (§8).
14. The sellers ranking and the seller payouts report (§8).

## 3. Permissions and isolation

### 3.1 What the interface shows each role

What the interface shows is not what the server enforces; §3.2 records the server's side.

| Role | Permission keys | What the captures show |
|---|---|---|
| Admin | All | Every screen with every control |
| Seller manager (custom) | write sellers, read products and orders | DA-SEL-01 and DA-SEL-02 with every lifecycle control and the onboarding checklist; the Commission rates and Payouts entries hidden; DA-PRD-03's seller card and review actions on a proposed product |
| Seller viewer (custom) | read sellers, commissions and payouts | Every seller screen read-only. The Onboarding card says "Loading…" for good, because the server refuses the onboarding read to a role that cannot write sellers (SD-70). A direct visit to an order shows the order without the seller cards |
| Payouts clerk (custom) | read sellers, write payouts | DA-SEL-05 and DA-SEL-06 with Mark as paid; DA-SEL-02's settle action; the Onboarding card stuck on "Loading…" as for the seller viewer (SD-70) |
| Commission manager (custom) | read sellers, write commissions | DA-SEL-03 editable; DA-SEL-02 read-only |
| Merchandiser (template) | products, no seller scope | DA-PRD-01's seller column and filter; DA-PRD-03's seller card with the seller's name and status, and the review actions; the seller list hidden |
| Order manager (template) | orders, no seller scope | DA-ORD-01's seller column; on DA-ORD-04 the Seller card shows the raw seller ID (SD-63), the Commission card reads "Failed to load" (SD-62, batch 8's B7 confirmed for this template) and the seller transfers card is absent; the sellers ranking hidden |
| Store settings (custom) | write settings, nothing on sellers | DA-SET-22 editable; DA-SET-23 and the seller screens refused on a direct visit |

### 3.2 What the server refuses

**Spree's own specs, at Spree's code `0950e2de`.** Run in this session on SQLite with Spree's API, core and emails test apps. 973 examples, 0 failures and 3 pending: SQLite cannot query records by metadata, so the shared metadata example skips itself there. Every example is listed with its result in [api-specs.json](evidence/2026-11-10-fb-19-batch-marketplace-part-1/backend/api-specs.json) (359 examples, seed 25637), [core-specs.json](evidence/2026-11-10-fb-19-batch-marketplace-part-1/backend/core-specs.json) (559, seed 5354) and [email-specs.json](evidence/2026-11-10-fb-19-batch-marketplace-part-1/backend/email-specs.json) (55, seed 44727).

| Endpoint or model | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Sellers, their invitations, team, balances and hand payouts | `sellers_controller_spec.rb` (32), `sellers/team_controller_spec.rb` (4), `sellers/invitations_controller_spec.rb` (7), `sellers/invitations/acceptance_links_controller_spec.rb` (2), `sellers/balances_controller_spec.rb` (3), `sellers/payouts_controller_spec.rb` (7), and the integration specs | Each lifecycle move answers through its workflow and a refused move answers 422; inviting refuses a role from another team; another store's seller is refused; a role that may read sellers but not the ledger is refused the balances; a role that may read payouts but not write them is refused a hand payout; a key that may only read sellers cannot fetch an invitation's link; a request without credentials answers 401 |
| Onboarding, requirements and submissions | `seller_onboarding_spec.rb` (11), `seller_requirements_controller_spec.rb` (19), `seller_requirement_submissions_controller_spec.rb` (9); the requirement, submission and onboarding workflow and model specs | The checklist's statuses and which requirement blocks; accepting, rejecting and waiving; a requirement of another store answers 404; submitting for review is refused while a requirement blocks; approving is refused without the override |
| Commission rates and lines | `commission_rates_controller_spec.rb` (20), `commission_lines_controller_spec.rb` (6); the rate, rule, value, line and commission service specs | A rate or line of another store is refused; a rule naming another store's record is refused; a product the store cannot reach is dropped; the rate ladder, floors, caps and the tax on commission |
| Seller transfers and payouts | `seller_transfers_controller_spec.rb` (7), `seller_payouts_controller_spec.rb` (9), `payout_providers_controller_spec.rb` (4); the transfer, payout, balance, sweep and reversal specs | Listing and completing; the sweep and its minimum; reversals on refunds |
| Order groups | `order_groups_controller_spec.rb` (7), `order_group_spec.rb` (28), the order group services | Another store's groups are not listed; the split and its totals |
| Product review | `products_controller_spec.rb` (158), `products/review_spec.rb` (24), `products/lifecycle_spec.rb` (36) | Approving and rejecting a proposed product and the reason; bulk channel and status actions drop other stores' products |
| Seller and order group emails | `seller_mailer_spec.rb` (9), `seller_email_subscriber_spec.rb` (7), `seller_lifecycle_emails_spec.rb` (5), `order_group_mailer_spec.rb` (22), `order_group_email_subscriber_spec.rb` (12) | Who receives each email, the switch that silences seller emails, and that no reason reaches the seller |

What no spec exercises for the batch's narrower roles, such as the seller viewer's refusals beyond the balances, the order manager's refusals on the commission and transfer endpoints, and a store settings role on the seller endpoints, is NOT_RUN. It is proposed to join G-11 (G-106).

### 3.3 Whether each store's data stays in that store

NOT_RUN. FB-03's validation stays paused and ISO-1 to ISO-7 stay open. No check read or wrote another store's records. Spree's own specs above include refusals of another store's records; they are not a validation of isolation.

## 4. Comparison with running screens

### 4.1 Results

26 cases, each in light and dark, from `compare-batch-13.spec.ts`; the [evidence index](evidence/2026-11-10-fb-19-batch-marketplace-part-1/README.md) links every side-by-side image and its computed styles. 22 cases have no difference in computed style. The other four:

| Case | Differences | Explained by |
|---|---|---|
| b13-edit-profile-sheet | 4, on the first logo drop zone | Focus and pointer: on the screen the pointer rests over the zone, which tints it; in the story the zone holds the initial focus, which rings it |
| b13-onboarding-send-back-confirm, b13-product-approve-confirm, b13-settle-confirm | 3 each, on the dialog's Cancel button | Focus: the story's dialog has focus on Cancel, the screen's on the dialog |

Values that differ on purpose, with the same layout: the created date on the at a glance card and the transfer's date, which follow when each was made. The onboarding cards are taller than the default window, so their two cases open a window 1800 pixels high; without it the page's sticky header covered the card's title (§4.3).

### 4.2 Earlier stories

Two, compared as the batch's own stories ([image review list](2026-11-10-fb-19-batch-marketplace-part-1-image-review.md#earlier-stories)): batch 7's delivery method list with a seller's methods leaves G-65, and the table toolbar's open filter panel leaves G-24. Each differs in three styles, all from the data it holds: the screen's list has three methods and its card a zone header, and the product list's filter panel holds twelve fields to the story's two.

### 4.3 Corrections

- The commission card's story named its rate "Spirits and wine, 12%", while the seeded rate is "Spirits and wine"; the card adds the percentage itself, so the story read "Spirits and wine, 12% · 12%". The fixture was corrected and its two reference images updated.
- The onboarding cases first opened the default window, where the sticky page header covered the card's title. They now open a taller window.

## 5. Behaviour found, recorded and not changed

Each is an existing defect in Spree's code, numbered from the defect register, and deferred for the owner's decision. None was fixed. Severities are proposed.

| Defect | What was seen | Evidence | Proposed |
|---|---|---|---|
| SD-60 | A suspended seller's product can still be bought. The Store API answers the product with `purchasable: false` and hides the seller (404), yet a cart takes the product and checkout completes. Two orders, R1009 and R1010, were placed and paid by cheque for Copperline Brewing while it was suspended. **What it means for money and fulfilment:** each is a real paid order assigned to the suspended seller, with commission charged on it (the rate's floor, 2.00 plus 0.40 tax, each). The suspended seller's team can still sign in to the Seller API and sees both orders unfulfilled in its list (G-107), so the order waits on a seller the marketplace has stopped; the shopper has paid, and the operator must fulfil, cancel or refund it by hand. Spree's plan says a suspended seller's products are not purchasable; the cart and checkout do not apply that | [suspended-seller-checkout](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/suspended-seller-checkout/answers.json), [lifecycle](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/seller-lifecycle/answers.json) ("shopper adds the suspended seller product") | Medium |
| SD-61 | Approving a seller's product does not put it on sale. The approve confirmation says "It goes on sale as soon as you approve it", and the automatic publishing switch says a product "goes on sale the moment they submit it". Approved and automatically published products are active but on no sales channel, so the Store API answers "Product not found". Added to the store's default channel by the operator, the same product is found | [products](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/products/answers.json), [products-on-a-channel](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/products-on-a-channel/answers.json) | Medium |
| SD-62 | Batch 8's B7, confirmed for the order manager template: on a seller's order the Commission card reads "Failed to load", because the server refuses the commission lines to a role without a seller scope, and the card shows a refusal as an error | [DA-ORD-04 seller-order-settled, order manager](evidence/2026-11-10-fb-19-batch-marketplace-part-1/screens/DA-ORD-04/seller-order-settled/orderManager-light.webp) | Low |
| SD-63 | On the same order the Seller card shows the raw seller ID to a role that cannot read sellers, and the seller transfers card is absent | As above | Low |
| SD-64 | Each onboarding requirement's menu button has no accessible name, so a screen reader announces only "button" | DA-SEL-02 onboarding-waive-confirm; the capture script finds it beside its requirement for that reason | Low |
| SD-65 | The invite sheet answers a filled-in but invalid address with "Email is required" | Seen in the invite sheet's story when the field held an invalid address | Low |
| SD-66 | Adding a seller with a blank name also reports "Slug can't be blank", a field the sheet does not show | [DA-SEL-01 add-refused](evidence/2026-11-10-fb-19-batch-marketplace-part-1/screens/DA-SEL-01/add-refused/admin-light.webp) | Low |
| SD-67 | The admin SDK's onboarding type declares `progress.percentage`, which the API never sends; the stories cast their fixtures for it | The onboarding answers in [requirements](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/requirements/answers.json) | Low |
| SD-68 | The seller payouts report counts the store's own sales as an "Unassigned" seller with a seller payout (18.00 this month), inside the report's total seller payout | [report-query-month-to-date.json](evidence/2026-11-10-fb-19-batch-marketplace-part-1/checks/ranking-and-report/report-query-month-to-date.json) | Low |
| SD-69 | Reinstating a suspended seller with requirements outstanding asks the operator to override them, while the server does not check requirements when it lifts a suspension | [DA-SEL-02 reinstate](evidence/2026-11-10-fb-19-batch-marketplace-part-1/screens/DA-SEL-02/reinstate/admin-light.webp); `approve.rb` skips the check for a suspended seller | Low |
| SD-70 | A role that may read sellers but not write them is refused the onboarding read (403), and the Onboarding card then says "Loading…" for good, with no checklist and no message | [DA-SEL-02 status-approved, seller viewer](evidence/2026-11-10-fb-19-batch-marketplace-part-1/screens/DA-SEL-02/status-approved/sellerViewer-light.webp); the seller viewer and payouts clerk answered 403 | Low |

**Observations, not numbered.** Approving a seller with nothing outstanding takes one click with no confirmation, while approving a product asks first. The dashboard sends no reason when it suspends or rejects a seller, though the API takes one and Spree keeps it. Completing a payout already completed answers 200 and keeps the first reference. The seller emails tell a rejected or suspended seller to write to the store's sender address, which on the test app is a no-reply address. EM-S-03 begins "has invited you" without a name, because the test app's operator has none.

## 6. Corrections

States the work item lists that no server reached, or that were reached differently:

- **Seller statuses:** canceled is reached by no workflow, so it is in a story only. Each other status is captured.
- **Transfer and payout statuses:** pending, processing, failed and unresolved transfers need a real payout provider, which Spree's built-in one is not; only completed earnings and reversals were reached (G-109, P4).
- **DA-SET-22's provider not connected hint:** no provider needing a connection is installed on the browser-test server; checked against its source (P4).
- **DA-SEL-05's mark paid dialog** opens on DA-SEL-06, where it is captured.
- **The sellers ranking's "View report" link** is drawn on the captured tab.
- **Read-only onboarding** is replaced on the screen by the stuck loading state (SD-70).
- **LIQ-008's DA-ORD-04 row** listed the marketplace and commission cards without saying what a role without a seller scope sees on a seller's order: the seller's raw ID, "Failed to load" on the commission card and no seller transfers card (SD-62, SD-63). The row now says so.

## 7. Gaps

Numbered from the defect register; each is for the owner's answer.

| Gap | What | Proposed |
|---|---|---|
| G-105 | The 14 behaviours of §2.3 that no browser test drives | For the owner's answer, as G-100 |
| G-106 | What the server refuses to the narrower seller roles beyond Spree's specs (§3.2) | Join G-11 |
| G-107 | What a suspended seller's team may still do: sign in to the Seller API, read its orders, edit the profile and add delivery methods. Spree's plans do not say | The owner's answer, with SD-60 |
| G-108 | 14 states reached only by answering a request in the browser (§2.1) | Simulated interface-state coverage, as G-102 |
| G-109 | Transfer and payout states the APIs cannot reach without a real payout provider (§6) | Stays with P4 |
| G-110 | EM-O-04, EM-C-04 and EM-O-02 are rendered but not read as sent, and the seller emails are read as sent only on the emails gem's test app (§9) | Close with G-16 |
| G-111 | 44 of the 70 stories not compared by the script: 31 seen in a capture and 13 checked against their source only ([image review list](2026-11-10-fb-19-batch-marketplace-part-1-image-review.md)) | Defer to the comparison follow-up, as G-101 |

## 8. Decisions and settings checked where they take effect (criterion 16)

From `marketplace-checks.spec.ts`. Each decision was made through its dashboard screen as the admin; what follows was read through the Admin, Seller and Store APIs. Captures and answers are in `checks/<check>/`. Two checks were run twice: the first run of the requirements check sent the background check back before stopping on a text assertion, and the second run of the mark paid check found the payout already paid; each folder's `first-run.txt` says what the first run did and read.

| Row of §2.4 | Checked | Result |
|---|---|---|
| Approving, rejecting, suspending and reinstating a seller | Juniper Row sent back to onboarding, resubmitted by its person through the Seller API (ready for review), approved, suspended and reinstated through DA-SEL-02; Fennel & Oak rejected; rejecting an approved seller tried through the API | PASS. Each status reads back on the Admin API and the seller's page. The seller's person signs in and reads the status at each step; the store lists the seller when approved and answers 404 when suspended. Rejecting an approved seller answers 422 "Cannot reject approved". While suspended, the person still signs in and writes the profile (G-107) |
| Approving with requirements outstanding | Fennel & Oak, rejected with nine requirements outstanding | PASS. Without the override the API answers 422, naming each requirement; the dashboard's Approve shows the override confirmation, and confirming it approves the seller, whom the store then lists |
| Accepting, rejecting and waiving a requirement | Stonecrop's background check sent back, resubmitted through the Seller API and accepted; its terms waived | PASS. Progress moves from 1 to 2 to 3 of 9 on both the Admin and Seller APIs; the card reads Sent back, Done and Waived; Approve still asks for the override while other requirements block |
| Approving and rejecting a seller's product | The proposed 12 Year approved on DA-PRD-03; a product the seller made through the Seller API sent back with a reason | PASS for the statuses and the reason: active and rejected on the Admin API, and the seller reads "Add the bottle size of each miniature." in its submission. FAIL for being on sale: the approved product is on no channel, and the store answers "not found" (SD-61) |
| Automatic approval of sellers and products | The two switches on DA-SET-22, each on and off | PASS. With automatic approval on, Stonecrop's submission for review answered approved; off, Juniper's stayed ready for review. With automatic publishing on, a submitted product became active at once; off, it stayed proposed. Both switches were put back off |
| The seller emails switch | On the emails gem's test app (§9) | PASS. With the switch on, approving and suspending a seller each sent its email to the seller's two addresses; with it off, approving sent nothing |
| The payout minimum and the commission tax | Saved as 25 and 10% on DA-SET-22, reloaded, then an order group bought | PASS. Both read back after a reload and on the Admin API. The new orders' commission tax stayed at 20%, the rate's own, because the store's default applies only when the rate has none, as the field's help says. Put back to 0 and 20% |
| A commission rate | The lines on four orders against the two rates | PASS. "Spirits and wine" (12%, floor 2.00, cap 40.00, 20% tax): 12% of 42.00 is 5.04, tax 1.01; on a 6.00 product the floor applies, 2.00 and 0.40. "Saltmarsh flat fee" (1.50, 20% tax): 1.50 and 0.30 |
| Marking a payout paid | Harbour Cask's pending payout of 42.50, marked paid on DA-SEL-06 with reference FID-PAY-1310 | PASS. The payout reads completed with its reference; it covers two transfers, an earning of 102.00 and a reversal of 59.50; the balance card's paid out rose from 153.00 to 195.50 and the balance fell from 203.95 to 161.45 |
| The sellers ranking and the seller payouts report | The ranking's query and the report's, against the orders and commission lines the Admin API lists | PASS for the ranking: Harbour Cask 84.00, Saltmarsh 68.00, the store's own 18.00 and Copperline 12.00, the item totals of the month's orders. The report's built-in range is last month, which holds only seeded orders with no lines, so it is empty; for this month its commissions match the lines (12.10, 3.60, 4.80). It counts the store's own sales as a seller payout (SD-68) |

## 9. Emails (criterion 17)

Rendered by `marketplace-emails.rb` in the emails gem's own test app, against a copy of the browser-test server's database after the checks, and captured at 390 and 1280 pixels by `order-emails.spec.ts`. The browser-test server does not load the emails gem (work item §2.7), so no seller or order group email is sent there.

| Email | Built from | Read as sent | Evidence |
|---|---|---|---|
| EM-O-03 Seller approved | `SellerMailer.approved_email`, Juniper Row; Spree has no preview for it | Yes: Spree's approve workflow, with the seller emails switch on, sent it to the seller's two addresses; with it off, nothing | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-03-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-03-1280.webp) |
| EM-O-04 Seller rejected | `SellerMailer.rejected_email`, Northgate; no preview | No (G-110) | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-04-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-04-1280.webp) |
| EM-O-05 Seller suspended | `SellerMailer.suspended_email`, Copperline; no preview | Yes: Spree's suspend workflow sent it | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-05-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-05-1280.webp) |
| EM-C-04 Order group confirmation | `OrderGroupMailer.confirm_email`, as Spree's preview builds it, group R1008 | No (G-110); shown in the editor's preview by batch 11 | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-C-04-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-C-04-1280.webp) |
| EM-O-02 New order group notification | `OrderGroupMailer.store_owner_notification_email`, as Spree's preview builds it, group R1008 | No (G-110) | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-02-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-O-02-1280.webp) |
| EM-S-03 Invitation, for a seller | Mapped to staff access part 1; read as sent here | Yes: Spree's invite workflow sent it to the invited address, Larkspur Ciderworks | [390](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-S-03-390.webp) · [1280](evidence/2026-11-10-fb-19-batch-marketplace-part-1/emails/EM-S-03-1280.webp) |

The sent checks ran Spree's events and jobs in the same process, with mail kept by the test delivery method; they show what Spree's subscribers send, not which mail service delivers it, which stays with G-16 and G-77. `emails.json` lists each email's subject, parts and links, and what each step delivered, with recipients counted and not written out.

## 10. CI runs and local checks

- **Local:** the 254 captures, the 56 comparisons and the ten checks passed on the browser-test server; the visual check for the corrected story passed in the pinned image. The run logs are `screens-run.txt` and `comparison-run.txt`; the comparison log is the first full run, and three cases (the two onboarding cards and the commission card) were run again after the corrections of §4.3.
- **Spree's specs:** 973 examples, 0 failures (§3.2).
- **Credential search:** before each push, every line the pull request adds was searched for the shapes of keys, tokens, passwords and machine paths and compared with the local values the batch used. The store's prefixed ID and the local addresses were replaced in the evidence; nothing else was found.
- **CI:** the two visual runs, Tests and Packages on the final commit are named in the merge record.

## 11. Limitations

- The running screens are Spree's browser-test server with its own fixtures and the records the scripts add, not a Liquorify deployment.
- FL-13's purchase used the Store API, not the storefront's seller checkout, which is part 2's.
- The checks moved the sellers the captures show. They run after the captures, and their order is set in the script.
- The emails were rendered and sent on a copy of the database in the emails gem's test app, not on the server the screens ran against.
- Comparison is diagnostic, and no comparison is functional verification.

## 12. Evidence

The [evidence index](evidence/2026-11-10-fb-19-batch-marketplace-part-1/README.md) lists every capture, comparison, check and email. Every image is lossless WebP, checked pixel for pixel against the PNG each script wrote.

## 13. Delegated acceptance

Accepted by Claude under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)) at #98's final commit, once both visual runs, Tests and Packages pass. This is not the owner's review and not independent review. The owner's rules carried over: FB-03 stays paused with its private evidence preserved; the multi-tenant release block stays; "These deferrals do not mark unverified behaviour PASS"; server permissions are preserved, and nothing here authorizes broader access or role-template changes; Figma editing access and the private P4 backend sandbox keys stay owner actions. SD-60 to SD-70 and G-105 to G-111 are recorded for the owner's decision and are not fixed.
