---
title: FB-19 batch 12 part 2, the storefront's wholesale portal
record: verification
work_item: FB-19
date: 2026-11-11
verifier: Claude (automated session); not independent review
result: PASS for the map, the 32 stories and their 64 reference images, the running-screen captures (86 states under four access settings, 172 images at 390 and 1280 pixels), FL-10's buyer steps run end to end with a wholesale order placed, the comparison with running screens (8 cases at both widths, every difference explained), and Spree's own specs for the batch, 604 examples with no failures. PASS for every row of §10.5, each checked where it takes effect. Four defects were fixed in this lane with regression tests that fail before and pass after (SD-86, SD-9, SD-104, SD-105) and G-128 closes on its evidence. Tenant isolation is NOT_RUN. Four defects found here go to R5 (SD-106, SD-107, SD-110, SD-111), and four gaps are recorded (G-131 to G-134). Criterion 8 counts CI on the final commits, named in the merge record
---

# FB-19 batch 12 part 2, the storefront's wholesale portal

**Claim.** The [batch 12 work item](../work-items/fb-19-batch-wholesale.md) §10 reproduces the buyer's side of Spree's selling to businesses on the storefront: the wholesale portal's catalog, product pages, cart and quick order (CAP-09-02), applying and signing in (the buyer's side of CAP-09-03), the wholesale channel's access settings as each visitor meets them (the buyer's side of CAP-09-04), and accepting a company invitation (the buyer's side of CAP-09-01). It gives the portal's components 32 Storybook stories with reference images, captures every state of §10.2 on the running storefront at both widths under each access setting and with wholesale off, runs FL-10's buyer steps end to end, compares the stories with the running screens, and checks on the running stack that what these screens do takes effect where it should. Its application code changes only for the defects fixed in this lane, each in its own pull request with its regression tests. It adds no Liquorify feature.

**Revisions.**

| What | Revision |
|---|---|
| The fixes | Storefront #30 (SD-86), #32 (SD-9), #33 and #34 (SD-104), #35 (SD-105), each merged on 2026-11-11 on its own, with only the change and its tests. Storefront `main` after them is `e9d80d5` |
| Stories, captures and comparison | Storefront #36, branch `claude/project-thread-kotvok` from `main` `e9d80d5`: the stories, fixtures, mocks and reference images `9989697`, the purchase order field's stories `9fe2167`, the capture spec `6ce5085`, the comparison cases `53bccd3`. It changes no application code. Its final commit is named in the merge record |
| Running screens | The storefront built for production at `e9d80d5`, once with the wholesale channel named and once without, against the storefront's own browser-test backend (Spree at `e7fd2953`, the revision its browser tests pin), in the storefront's pinned Playwright 1.60 image, at 390 and 1280 pixels, one fresh server per access setting (§6) |
| Spree's specs | Spree at `e7fd2953`, the same backend, on SQLite (§3.2) |
| Spree's code | Unchanged. This repository changes only `liquorify/` |

**Results.**

| # | Criterion ([work item §10.9](../work-items/fb-19-batch-wholesale.md#109-acceptance-criteria-for-part-2)) | Result |
|---|---|---|
| 1 | Every in-scope capability of §10.1 is mapped to its screens, flow steps, visitors, meaningful states, components, browser tests and emails, with no SF-WHL ID left unmapped | PASS: the map in §2 has CAP-09-01 to CAP-09-04's buyer sides with SF-WHL-01 to SF-WHL-06, SF-SHOP-01's section, SF-CHK-01 and SF-CHK-03 for a wholesale cart, and SF-ACC-11, the company invitation page SD-86's fix added, now in LIQ-008 |
| 2 | Every component the portal uses has a story for each meaningful state, at both widths, with a reference image; components already covered are listed, not redone; a component no story can hold is recorded with its U-code | PASS: 9 components, 32 stories, 64 reference images, each looked at ([image review list](2026-11-11-fb-19-batch-wholesale-part-2-image-review.md)). `WholesaleGate` holds its six branches in stories through the storefront's data mocks, so it needs no U-code. The reused components are §10.7's list |
| 3 | Every screen is captured on the running storefront, at the pinned revision, in each state in §10.2, at both widths | PASS for every listed state, with the states no server reaches recorded as corrections (§6): 86 states in 172 images, each with a note of what the page read |
| 4 | Each variant in §10.3 is captured, showing what the interface does for it | PASS: a guest, an applicant not in the Wholesale group, an approved buyer, and a buyer of a company with its own catalog, under sign-in required, prices hidden and public, and a guest with wholesale off (§2.1) |
| 5 | FL-10's buyer steps are traced step by step to their screens and run end to end on the running stack; each step with no browser test is recorded as a gap | PASS (§2.2): applied, approved by staff through the Admin API, signed in, browsed, ordered by SKU, reviewed the cart and placed order R1042 with Check, at both widths, twice on fresh servers. The steps no browser test drives are G-132 |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen | PASS (§4): 8 cases at both widths, 16 comparisons; every difference is the font's fallback name, the portal's page background, or the data. The comparison found SD-110 on the running page, which is the component's own behaviour, not a story's |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so | PASS: 24 stories were not compared and are checked against their running capture or their source (G-134). Four states were reached by holding or failing a request in the browser, and their notes say so (G-133) |
| 8 | The visual check passes twice in CI on the same revision; the storefront's lint, type check, unit tests and browser tests pass; the check stays advisory | Recorded in the merge record, which names the runs on #36's final commit. Locally at `53bccd3`: 716 of 716 story comparisons pass, and Biome, the type check and the fixture tests pass (§10) |
| 9 | Spree's code and every workflow are unchanged; the storefront's application code changes only for the fixes, each in its own pull request; nothing carries Liquorify branding or features | PASS: #30, #32, #33, #34 and #35 each hold one defect's change and its tests; #36 changes `stories/`, `.storybook/preview.tsx`'s mock wiring and `visual/` only; no workflow or lockfile changes |
| 10 | The records are updated, with every link checked; LIQ-008 corrected where the captures show it is wrong | PASS: this record, the image review list, the evidence index, LIQ-009's storefront column, LIQ-008's SF-ACC-11 row, LIQ-004's FB-19 entry, progress row, defects and gaps, the work item's §10.12 and the README index, with the link check run (§10) |
| 11 | The reference images, the screen evidence and fidelity are accepted | For delegated acceptance at the final commits, under the owner's delegation of 2026-11-04, recorded in the merge record. Not the owner's review |
| 12 | What the server refuses or gives each visitor is recorded apart from criterion 4, with Spree's own specs run at the batch's revision | PASS for Spree's own specs: 604 examples, 0 failures, 1 pending (§3.2). What the Store API answers each visitor under each setting is read and recorded apart (§8). What no spec exercises is NOT_RUN |
| 13 | Tenant isolation is NOT_RUN, with links to the open isolation findings; a non-member's answer is a check within one store | NOT_RUN (§3.3). ISO-1 to ISO-7 stay open. No check read or wrote another store's records. What a customer outside the Wholesale group gets on the wholesale channel was checked within one store, and its result is recorded privately (§8) |
| 14 | Every name, company, address, email, phone number, SKU and reference is invented, no credential appears in any committed file, and keys, tokens and invitation links are masked | PASS: the stories and the capture spec use invented names and `example.com` or `.example` addresses; the capture notes record paths without tokens; the search's result is in §10 |
| 15 | Behaviours on the portal that no browser test drives are listed for the owner's answer | PASS: 16 behaviours in §2.3, none counted as tested. They are G-132 |
| 16 | Each row of §10.5 is checked where it takes effect, with the result recorded per row | PASS (§8): every row, with the read values of both sides |
| 17 | §10.6's reading of the emails is recorded, and EM-C-01 and EM-SF-01 stay mapped to batch 9 | PASS (§9) |
| 18 | The comparison follow-up's share | PASS: the earlier stories part 2's screens show keep their recorded status (image review list, Earlier stories); no story leaves G-73 here, and LIQ-004's comparison follow-up says so |
| 19 | The fixes are made as §10.12 sets out, with each regression test failing before and passing after, controls succeeding and refusals refused, in CI on each fix's final commit, and each defect's rows recording the fix | PASS for SD-86, SD-9, SD-104 and SD-105 (§7). Each stays open until its closure conditions in FB-23 §2 are met |
| 20 | G-128 closes on §10.5's evidence | PASS: the product inside a company's catalog that the catalog does not price shows the Wholesale price at the minimum quantity, so SD-101's condition does not arise and G-128 closes (§8) |

## 1. What was built

- **Stories (storefront #36):** 27 stories for the eight wholesale components of §10.7 in `stories/wholesale/`, and 5 for the purchase order number field SD-105's fix added, in `stories/checkout/`. The fixtures in `stories/fixtures/wholesale.ts` and the mocks in `stories/mocks/server-actions.ts` hold invented companies, products and SKUs.
- **Reference images:** 64, one per story and width.
- **Scripts,** in the storefront's `visual/fidelity/`, none of them a browser test: `wholesale-screens.spec.ts` captures the running screens, setting the wholesale channel's access through the Admin API and making the buyers, company, catalog and orders it needs through the storefront and the Admin API; `compare.spec.ts` gains eight wholesale cases.
- **Fixes:** five storefront pull requests (§7), each with its regression tests.

LIQ-009's storefront column names the stories.

## 2. The batch's map

| Capability | Screens | Flows | Emails | Browser tests | Evidence |
|---|---|---|---|---|---|
| CAP-09-02 The wholesale portal | SF-WHL-01, SF-WHL-04, SF-WHL-05, SF-WHL-06; SF-CHK-01 and SF-CHK-03 for a wholesale cart | FL-10's ordering steps | EM-C-01, EM-SF-01 (batch 9) | `e2e/purchase-order-number.spec.ts` (SD-105, 3); Quick order's component tests (SD-104) | 57 states under sign-in required; §8 |
| CAP-09-03 Applying and approval, the buyer's side | SF-WHL-02, SF-WHL-03; SF-WHL-01 pending and approved; SF-SHOP-01's section | FL-10's application and sign-in steps | None (§9) | None | SF-WHL-02 and SF-WHL-03 under three settings; §8's group rows |
| CAP-09-04 Gated channels, the buyer's side | SF-WHL-01, SF-WHL-04, SF-WHL-05 under each setting; SF-SHOP-01 to SF-SHOP-04 under the store's own setting | None | None | SD-9's browser tests (`e2e/storefront-access.spec.ts`, 5) and unit tests (2) | Captures under each setting; §8's Store API row |
| CAP-09-01 The company invitation, the buyer's side | SF-ACC-11, the page at `/account/company-invitation` | FL-10's invitation step | EM-C-11 (part 1) | SD-86's browser tests (`e2e/company-invitation.spec.ts`, 8) | SF-ACC-11's 11 states |

### 2.1 Screens and their states

Each capture is in the [evidence](evidence/2026-11-11-fb-19-batch-wholesale-part-2/README.md) as `screens/<setting>/<screen>/<state>/<variant>-light-<width>.png`, with a `.json` note of what the page read. "In the browser" marks a state reached by holding or failing a request in the browser (G-133).

| Setting | Screen | States |
|---|---|---|
| Sign-in required | SF-WHL-01 | sign-in wall; the wall on an ordering page, with its return address; application pending; the approved buyer's catalog; searched; filtered; sorted; no match; the company buyer's catalog |
| | SF-WHL-02 | empty; filled; submitting; received; refused (email registered, short password); reached signed in |
| | SF-WHL-03 | empty; wrong password; returned to the address the buyer came from |
| | SF-WHL-04 | the trade price hint with variants; a single variant; a sold-out choice; outside the company's catalog; priced by the company's catalog; in it and not priced by it |
| | SF-WHL-05 | empty; below the minimum; at the minimum; an item removed; the cart drawer; the company buyer's cart, at one and at ten |
| | SF-WHL-06 | one row and several; searching (in the browser); suggestions; no suggestions; row results; a quantity refused; adding failed and answered with a server error (both in the browser) |
| | SF-CHK-01, SF-CHK-03 | a wholesale cart at checkout; its delivery and payment; the order placed; a purchase order number required and refused; given and placed |
| | SF-ACC-11 | a guest creating the account; the form filled; accepted; a signed-in invitee; accepted signed in; signed in as someone else; expired; already accepted; revoked; unknown; no token |
| | SF-SHOP-01 | the wholesale section |
| Prices hidden | SF-WHL-01 to SF-WHL-05, SF-SHOP-01 | guest browsing with sign in for pricing; the product's price hidden with no add; the cart walled; the wall on an ordering page; applying, signing in, pending and approved as above |
| Public | SF-WHL-01 to SF-WHL-03, SF-SHOP-01 | the sign-in wall; the wall on an ordering page; applying, signing in, pending and approved as above |
| Wholesale off | SF-WHL-01, SF-WHL-02, SF-SHOP-01 | the portal and apply page not found; the home page without its section |

### 2.2 FL-10, the buyer's steps

| Step | Screens | Browser tests | Run |
|---|---|---|---|
| A buyer applies | SF-WHL-02 | None (G-132) | received, with the phone and company reaching staff (§8) |
| The buyer sees the pending page | SF-WHL-01 | None (G-132) | application-pending |
| Staff add the customer to the Wholesale group | DA-CUS-02 (part 1) | Batch 10's | through the Admin API, as the dashboard saves it |
| The buyer signs in | SF-WHL-03 | None (G-132) | returned-to-the-address |
| The buyer browses at trade prices | SF-WHL-01, SF-WHL-04 | None (G-132) | approved-buyer; trade-price-hint-with-variants |
| The buyer orders by SKU or from a product page | SF-WHL-06, SF-WHL-04 | Quick order's component tests (SD-104) | row-results; quantity-refused |
| The buyer reviews the cart | SF-WHL-05 | None (G-132) | below and at the minimum |
| The buyer checks out and sees the order placed | SF-CHK-01, SF-CHK-03 | SD-105's browser tests for the purchase order number | R1042 placed with Check at the trade price |

The whole flow ran at both widths, twice, on fresh production builds (`fixes/sd-104/cap-fresh-*.txt`).

### 2.3 Behaviours no browser test drives (criterion 15)

Each was shown by a capture or a check, and none is counted as tested. They are G-132, for the owner's answer.

1. Applying, with its refusals (SF-WHL-02).
2. Seeing the pending page, and signing out from it.
3. Signing in on the wall and returning to the address the buyer came from (SF-WHL-03).
4. Searching, filtering and sorting the catalog, and a search with no match (SF-WHL-01).
5. The trade price hint, and a sold-out variant (SF-WHL-04).
6. A product outside the buyer's company catalog (SF-WHL-04).
7. The cart below and at the minimum, with the storefront's nudge (SF-WHL-05, SD-106).
8. Removing an item from the wholesale cart.
9. The cart drawer bound to the wholesale cart.
10. Quick order with several rows, its SKU suggestions and no suggestions (SF-WHL-06).
11. Quick order's refused and failed rows, which SD-104's component tests drive but no browser test does.
12. A wholesale cart's checkout, delivery and payment, and the order placed (SF-CHK-01, SF-CHK-03).
13. Guest browsing under prices hidden, and the wall on ordering pages.
14. The portal with wholesale off.
15. The home page's wholesale section and its links.
16. Removing a buyer from the Wholesale group, seen on their next visit (§8).

## 3. Permissions and isolation

### 3.1 What the interface shows each visitor

There are no staff roles on the storefront. What each visitor sees is decided by the storefront's `WholesaleGate`, reading the channel's setting and the customer's groups:

| Visitor | Sign-in required | Prices hidden | Public |
|---|---|---|---|
| A guest | the sign-in wall on every page | the catalog and product pages with "sign in for pricing"; the wall on the cart and quick order | the sign-in wall |
| A signed-in customer outside the Wholesale group | the pending page | the pending page | the pending page |
| An approved buyer | the portal with trade prices | the same | the same |
| A buyer of a company with its own catalog | the catalog's assortment and prices (§8) | the same | the same |

### 3.2 What the server refuses

Spree's own specs at `e7fd2953`, on SQLite: 604 examples, 0 failures, 1 pending, saved as `backend/api-specs.json` (331) and `backend/core-specs.json` (273).

- **Store API:** storefront gating and price gating, channel binding and resolution, the channel endpoint, company invitations, companies and the account's companies, customer registration, carts and their items, purchase order documents.
- **Admin API:** channels, price lists, customer groups.
- **Core:** channel gating, channels, price lists, customer group and channel price rules, customer groups, company invitations, companies, a purchase's company, the checkout requirements, and setting a catalog's price list.

They run as a guest, a customer, a company's buyer or the store's admin. What no spec exercises was read on the running stack where §10.5 asks (§8).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's validation; ISO-1 to ISO-7 stay open ([LIQ-004](../LIQ-004-foundation-backlog.md#open-isolation-findings)). No check read or wrote another store's records. No finding of this batch is an isolation finding.

## 4. Comparison with running screens

### 4.1 Results

`compare.spec.ts`'s wholesale cases put each story beside the same component on the running portal in the same browser, at both widths, and save both images, a side-by-side and the computed styles with their differences (`comparison/<case>/`).

| Case | Story | Setting | Differences |
|---|---|---|---|
| wholesale-sign-in-wall | Sign-in wall: Sign in required | Sign-in required | Font fallback name; the page's background around the wall |
| wholesale-sign-in-wall-prices-hidden | Sign-in wall: Prices hidden | Prices hidden | The same |
| wholesale-application-pending | Application pending: Default | Sign-in required | Font fallback name; the page's background; the applicant's name and email (data) |
| wholesale-header | Wholesale header: Signed in, empty cart | Sign-in required | Font fallback name |
| wholesale-quick-order | Quick order view: Default | Sign-in required | Font fallback name; the page's background |
| wholesale-sku-suggestions | SKU combobox: Suggestions | Sign-in required | Font fallback name; the products (data); at 390 the list is 154 pixels wide on the page and 356 in the story (SD-110) |
| wholesale-cart-empty | Wholesale cart view: Empty | Sign-in required | Font fallback name |
| wholesale-guest-browse | Guest browse: Default (its header) | Prices hidden | Font fallback name |

**Font fallback name.** Every case's `font-family` reads `Geist, "Geist Fallback", system-ui, sans-serif` on the page and `Geist, system-ui, sans-serif` in Storybook: the same face, with the fallback the font loader adds on the built storefront, as earlier storefront batches recorded.

**The page's background.** The portal's layout paints the page slate-50 around the pending card, the wall and quick order; the story's canvas is white. It belongs to the layout, not to the components.

### 4.2 Earlier stories

The earlier stories part 2's screens show (the home page's wholesale section, the header's, footer's and mobile menu's wholesale link, and the product card and details with prices withheld) were compared when they were added and keep their status. Batch 9's checkout stories held by G-73 were not compared here and stay with G-73.

### 4.3 Corrections

Two cases were first set against the wrong story: the cart against "below the minimum" while the buyer's running cart was empty, and the header against "signed in with cart" while it was empty. Both were set to the story of the state the page showed and run again. No story was changed.

## 5. Behaviour found, recorded and not changed

| Number | What | Severity | Where it goes |
|---|---|---|---|
| SD-106 | The cart's minimum nudge and "Trade price applied" come from the storefront's fixed minimum (`WHOLESALE_MIN_QUANTITY`, 10), not from Spree's price list: with the minimum changed to 5 in the price list, Spree charged 5 blenders at the trade price while the cart read "Add 5 more to unlock trade pricing"; and the tower fan, which the price list does not price, read "Trade price applied" at 10 while still at its catalog price | Low | R5 |
| SD-107 | An access control defect on the wholesale channel, held privately by the owner's instruction until it is fixed | High | R5, ahead of its queue |
| SD-110 | Quick order's SKU suggestions at phone width take the SKU field's width, 154 pixels, and cut every name and SKU short, so the variants of one product cannot be told apart | Medium | R5, after SD-107 |
| SD-111 | The storefront's not-found pages answer with status 200: the wholesale pages with wholesale off, and a product outside a buyer's catalog, show "404 This page could not be found" while the response's status is 200 | Low | R5, after SD-110 |

## 6. Corrections

- **The backend.** The work item named the backend's browser-test server at `main`. The captures ran against the storefront's own browser-test backend, Spree at `e7fd2953`, the revision the storefront's browser tests pin, so the storefront and its tests met the Spree they are built for. Spree's specs ran at the same revision.
- **The approved buyer's empty catalog** is not reached: every product of the sample catalog is published on the wholesale channel, and unpublishing them would change the data the other states share. The state is shown by its story.
- **One fresh server per setting.** Each access setting was captured on a newly started production server, so no cached answer from one setting reached another. The guest's home page step under sign-in required first failed on a wrong locator in the new spec, was corrected, and ran again on the same server; the other settings ran with the correction.
- **LIQ-008.** SF-ACC-11, the company invitation page, is added; SD-86's fix created it.

## 7. The fixes in this lane (criterion 19)

| Defect | Fix | Regression tests | Closing checks |
|---|---|---|---|
| SD-86, High | Storefront #30: the page at `/account/company-invitation` | 8 browser tests fail at `main` and pass after, twice; controls: a guest creating the account and a signed-in invitee; refusals: expired, already used, revoked, unknown, no token, and another customer's email | SF-ACC-11's 11 states captured at both widths |
| SD-9, High | Storefront #32: the signed-in customer's token sent with the store's own product, category and search requests, never cached across customers | 5 browser tests and 2 unit tests fail before and pass after; 2 guest controls; 7 of 7 pass twice | Recorded with P10's rows in FB-23 |
| SD-104, Medium | Storefront #33: the cart's add tells its caller whether Spree added the item; #34: a failed SKU lookup ends the row with "Couldn't add this item. Please try again." | Quick order's tests: 2 of 3 fail before #33 and 3 of 3 pass after; 1 of 4 fails before #34 and 4 of 4 pass after; the successful add is the control, the refused and failed adds the refusals | The buyer's run passed twice on fresh servers at both widths: a refused quantity shows Spree's reason, a dropped connection shows the retry message, and the order is placed |
| SD-105, High | Storefront #35: the purchase order number field at checkout, shown when the buyer's company requires one or the cart carries one, saved to the cart before payment | Browser tests: the regression and the refusal fail before (no field) and all three pass after, twice; the control checks out with no field | The member's run passed twice on fresh servers at both widths: an empty required number is refused at the field, 4 of 4, and the numbers given were recorded on orders R1035 to R1038, each read back exactly |

Each fix's before and after runs are in `fixes/<defect>/`. Each defect stays open until FB-23 §2's closure conditions are met ([fix log](../work-items/fb-23-remediation-ledger.md#9-fix-log)).

## 8. Checked where it takes effect (criterion 16)

| Row of §10.5 | Result |
|---|---|
| An application with a company name and phone | PASS. The applicants' customer records carry the phone and `metadata.company` through the Admin API, and the dashboard's customer page shows the phone on its profile card and the metadata on its metadata card. Nothing tells staff of an application (§9) |
| The customer added to the Wholesale group, and removed | PASS. Added, the buyer's next visit shows the Wholesale Catalog; removed while signed in, the next load of `/wholesale` shows "Your application is under review" |
| The price list's prices and minimum | PASS for the prices; SD-106 for the storefront's note. Spree prices the blender at $49.99 at one and $29.99 at ten. With the minimum changed to 5, Spree charged five at $29.99 while the cart's nudge still asked for five more. The minimum was set back to 10 |
| The wholesale channel's access setting | PASS. Each screen per visitor per setting is captured (§2.1). The Store API with the wholesale channel's key answers a guest 401 for products and carts under sign-in required; under prices hidden a guest's products and cart totals come back with no price; under public a guest gets the prices. The rest of this row's readings are recorded privately, by the owner's instruction |
| A signed-in customer not in the Wholesale group | Checked within one store; the result is recorded privately, by the owner's instruction. Not an isolation check |
| A company with its own catalog (G-128) | PASS, G-128 closes. For the company's buyer: the pedestal fan, outside the assortment, is not found; the tower fan, which the catalog prices, shows the catalog's $70.00 at one and at ten; the blender, in the assortment and not priced by the catalog, shows $49.99 at one and the Wholesale price, $29.99, at ten |
| A company that requires a purchase order number | PASS after SD-105's fix: the field shows, an empty number is refused at the field, and the number given is recorded on the order |
| A wholesale order placed | PASS. R1036 as staff read it: the Wholesale channel, the company, the purchase order number, the blender at $29.99 and the tower fan at $70.00, ten each. The channel refuses a guest's cart under sign-in required (401) and has guest checkout off |
| SD-9, the store's access setting | PASS after SD-9's fix (§7) |
| SD-86, the company invitation | PASS after SD-86's fix: accepted from the email's link, with the membership read back |

## 9. Emails (criterion 17)

No email belongs to FL-10's buyer steps. Neither the storefront nor Spree, read in the code at the revisions above, sends an email to tell staff of an application or the buyer of an approval: the applicant registers through the shared sign-up, and the emails gem and core have no template or subscriber for either. EM-C-01 and EM-SF-01, the wholesale order's confirmation, stay mapped to batch 9. EM-C-11 is part 1's; its link now reaches SF-ACC-11.

## 10. CI runs and local checks

- **Local, storefront #36 at `53bccd3`:** the visual check passed 716 of 716 story comparisons after the purchase order field's references were written; Biome, the type check and the fixture tests pass.
- **Captures at `e9d80d5`:** every test passed under each setting (`screens/<setting>-run.txt`).
- **CI:** the merge record names #36's runs on its final commit, and each fix's CI on its final commit is in its pull request.
- **Search before each push:** the pull requests' files were searched for keys, tokens, absolute paths and addresses; none was found, and the evidence's run logs have local paths and the host's address replaced.
- **Links:** every link in the changed records was checked.

## 11. Gaps

| Gap | What | Destination |
|---|---|---|
| G-131 | Limiting a sales channel to particular customers; recorded privately with SD-107 | R5 with SD-107 |
| G-132 | The 16 portal behaviours no browser test drives (§2.3) | The owner's answer, as G-123 |
| G-133 | Portal states reached only by holding or failing a request in the browser: quick order searching, adding failed and answered with a server error | V2, with G-124 |
| G-134 | 24 stories not compared with a running screen, each checked against its running capture or its source ([image review list](2026-11-11-fb-19-batch-wholesale-part-2-image-review.md)) | V2, with G-125 |

G-128 closes (§8).

## 12. Limitations

- The captures are light only; the storefront has no dark mode.
- The backend is the storefront's pinned browser-test backend, not this repository's `main` (§6).
- Real payment providers are not used: the wholesale order is paid by Check, as §10.10 chose.

## 13. Evidence

The [evidence index](evidence/2026-11-11-fb-19-batch-wholesale-part-2/README.md) lists the captures, the comparison, Spree's spec results, the fixes' runs and the checks.

## 14. Delegated acceptance

Recorded in the merge record, at the final commits, under the owner's delegation of 2026-11-04. Not the owner's review.
