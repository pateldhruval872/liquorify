---
title: FB-19 batch 5, catalog and pricing, part 3, promotions, gift cards and store credit
record: verification
work_item: FB-19
date: 2026-11-04
verifier: Claude (automated session); not independent review
result: ⟨RESULT⟩
---

# FB-19 batch 5, catalog and pricing, part 3, promotions, gift cards and store credit

**Claim.** Part 3 of the [catalog and pricing batch](../work-items/fb-19-batch-catalog-and-pricing.md) reproduces what Spree already has for rewarding and crediting shoppers: promotions with their rules, actions and coupon codes, gift cards, and store credit. It gives the 15 components those screens use 130 Storybook stories, with light and dark reference images. It captures the five screens on Spree's running dashboard in each state the work item lists and for each of five roles, maps the dashboard steps of FL-16 and FL-17 to Spree's browser tests, compares 18 of the new stories, and 8 earlier batches' stories the screens show, with the same components on the running screens, and runs Spree's own specs for the endpoints and models the screens rely on. It follows the work item's [§12](../work-items/fb-19-batch-catalog-and-pricing.md#12-part-3-promotions-gift-cards-and-store-credit), proposed and merged under the owner's delegation of 2026-11-04, and the owner's answers of that day: the requests no Spree spec sends for part 3's narrower roles join G-11, for the platform batch's step [P10](../work-items/fb-19-batch-platform.md#p10-the-remaining-refusals-within-one-store); source-only and simulated coverage stay apart from functional verification; and the acceptance is delegated acceptance, not the owner's review.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | Pull request ⟨PR⟩, branch `claude/project-thread-v8hgdz`. It started from `main` at `16380f5f`, #42's merge, which holds part 2. `4a05d9c8` added the stories, fixtures, mocks and the capture and comparison scripts; `d1fa609d` merged `main` at `ffc9f5e0`, which changed records only. ⟨REVISIONS⟩ |
| Spree's code: the dashboard, its packages, the SDKs and the gems | `main` at `ffc9f5e0`, whose last change to Spree's code is `bbf401c4` (Spree's sample data, SD-8). The dashboard, its packages and the SDKs last changed at `862ffb00`, so they are the code the work item names, `87a2ea8`. The branch changes none of it: `git diff` against `main` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk`, `packages/seller-sdk`, `spree/` and `.github/` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at that code, with Spree's sample catalog loaded into its database, in the pinned Playwright 1.64.1 image. Captures are 1280 by 960 pixels, and 390 by 844 for the three phone states; comparisons are 1280 by 800, and 1280 by 960 for the sheets and dialogs. ⟨RUNS⟩ |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-catalog-and-pricing.md#5-acceptance-criteria), as [§12.7](../work-items/fb-19-batch-catalog-and-pricing.md#127-acceptance-criteria) applies it to part 3) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scopes, meaningful states, components and browser tests, with no in-scope ID left unmapped | PASS: the map in §2 has CAP-05-12 and CAP-05-13, the five screens, the dashboard steps of FL-16 and FL-17, the `promotions`, `gift_cards`, `store_credits` and `customers` scopes and the scopes the rule pickers read, the 15 components and Spree's 37 browser tests in four files, each with its evidence or a named gap. With part 3, every capability of the work item's §5 is mapped, some only in part |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | PASS: 15 new components, 130 stories, 260 reference images, each looked at in both modes (§1, [image review list](2026-11-04-fb-19-batch-catalog-and-pricing-part-3-image-review.md)). The running screens use the 15 the work item named; the reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §12.2 | PASS for every listed state but two that Spree does not have, recorded as corrections (§7): a partly used coupon code, and a `promotion.form_sidebar` slot that draws something. ⟨STATES⟩ states of the five screens are captured, in ⟨CAPTURES⟩ captures with the role variants, each in light and dark. 11 states were reached by answering or holding a request in the browser, and say so (§2.1, G-82) |
| 4 | Each permission variant in §12.3 is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen; the marketer and the loyalty viewer on each listing and record page, and the marketer in each rule editor's picker; the order manager and the merchandiser on a direct visit to each screen they are not offered, and the order manager on both loyalty screens with their controls |
| 5 | FL-16 and FL-17 are mapped step by step to their screens, and the browser tests covering them pass on the part's revision; a step no test covers is recorded as a gap | PASS for the mapping, and for the browser tests in CI at the pull request's revision (§2.2, §9). The steps no browser test covers are listed under criterion 15 (§2.3) |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | ⟨COMPARISON⟩ |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | PASS: 112 of the 130 stories were not compared by the script; ⟨SEEN⟩ of them show a state seen in a running-screen capture, and ⟨SOURCE⟩ were checked against their source only (G-81, image review list). Every capture whose state was reached in the browser says how in its note, and claims nothing about the server (§2.1) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | See §9. The two full runs on the final revision, with Tests and Packages, are named in the merge record. The tolerance is the agreed one for every image of part 3 |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/`, apart from the merge of `main`. No workflow, lockfile or Spree file changes |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, progress tables and gap register, the work item's §14 and the README index, with the link check run (§9) |
| 11 | The reference images, the screen evidence and fidelity are accepted under D5. Under the owner's delegation of 2026-11-04 this is a delegated acceptance, recorded as such and never as the owner's review | DELEGATED ACCEPTANCE on 2026-11-04, under the owner's delegation of that day ([record](2026-11-04-delegated-acceptance-and-merging.md)), at this pull request's final commit, which the merge record names (§12). Not the owner's review. The gaps part 3 leaves stay for the owner's answers |
| 12 | Backend authorization is recorded separately from criterion 4, from Spree's own specs at the part's revision | ⟨SPECS⟩ What no spec exercises, such as each role's requests in §3.1, is NOT_RUN and joins G-11 (G-83) for P10 |
| 13 | Tenant isolation is NOT_RUN for the part, with links to the open isolation findings | NOT_RUN (§3.4). None of ISO-1 to ISO-7 is about promotions, gift cards or store credit; the customer pickers read the customer list that ISO-1 concerns. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | No token, key or password appears in any committed file, checked by a search of the pull request's files before each push | PASS: before each push, every line the pull request adds, in the text files it adds or changes, was searched for the shapes of keys, tokens and passwords and compared with the local values the part used; nothing matched (§9). The images are not text and were not searched; none of the screens part 3 captures draws a key |
| 15 | Each part 3 behaviour that no browser test drives is listed, with the check made instead. A behaviour is not counted as tested because a capture shows it | PASS: 22 behaviours are listed in §2.3, each with its capture and the Spree specs that cover the server's side. None is counted as tested. They are G-84, for the owner's answer |
| 16 | The record states whether any staff control cancels a gift card on the running screen, for G-14. Answering G-14 stays with the owner | PASS (§4): no staff control on the running screens cancels a gift card. The row menu offers Edit and Delete only, the sheet's Cancel button closes the sheet, the edit request carries no status, and the capture script checks for a cancel control on every gift card state and finds none. ⟨G14-API⟩ G-14 stays PENDING with the owner |

## 1. What was built

**Stories, 130, for the 15 new components of part 3.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-11-04-fb-19-batch-catalog-and-pricing-part-3-image-review.md) names each one. Stories use invented shoppers, codes and amounts. Under each layer, a component's stories are listed by name, separated by commas; some names hold a comma of their own, such as "New promotion, a coupon code by default".

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Composed | `calculator-summary` (CMP-DUI-C-07) | Flat percent, Flat rate, Flat rate, on full-priced items only, Flexible rate, Tiered flat rate, Tiered percent, Percent per item, An amount in euros, No settings yet, Named from its type, No calculator chosen (11) |
| `promotion-editors/` (CMP-DA-G-15) | `action-adjustment` | Flat percent of the order, Flat rate off the order, Flexible rate off the order, Tiered flat rate off the order, Tiered percent off the order, Flat rate off each item, Percent off each item, Flexible rate off each item, New whole-order action, New per-item action, Loading the calculators, Loading the calculators, a saved action, Choosing a calculator, Another calculator, its settings from their defaults, Adding a tier, Removing a tier, Saving the settings (17) |
|  | `action-create-line-items` | An item listed, New action, nothing listed, Loading the listed items, Searching, Adding a variant, Changing a quantity and saving, Removing the last item (7) |
|  | `match-policy-picker` | A product rule's policies, None of them chosen, A category rule's policies, Choosing, Its own label (5) |
|  | `promotion-form` | A promotion, Loading, New promotion, a coupon code by default, New promotion, applied automatically, A typed code, created, A generated code, Code missing, Name missing, A batch of codes, A batch of codes without a prefix, Ends before it starts, Adding a rule, every kind offered, Adding a rule, kinds already used left out, The currency rule's editor, The item total rule's editor, A rule with no settings, added, A rule's editor cancelled, nothing added, Adding an action, Free shipping, added, A whole-order discount, added, A single code, locked, A batch of codes, locked, The codes sheet, The codes sheet, second page, The codes sheet, loading, Exporting the codes, Choosing the match policy, One rule, no match policy, Editing a rule, Removing a rule, Rule removed, waiting for Save, Removing an action, Editing tiers, Saved, Save refused, a tier over 100%, Save refused, a name of spaces, Deleting, Read-only role, Marketer role (39) |
|  | `rule-category` | Saved, New rule, Searching, Saving a choice (4) |
|  | `rule-channel` | Saved, New rule, Choosing, Saving a choice (4) |
|  | `rule-country` | Saved, New rule, Choosing, Saving a choice (4) |
|  | `rule-customer-group` | Saved, New rule, Choosing, Saving a choice (4) |
|  | `rule-market` | Saved, New rule, Choosing, Saving a choice (4) |
|  | `rule-option-value` | Saved, New rule, Choosing, Saving a choice (4) |
|  | `rule-product` | Saved, New rule, Searching, None of these products, Saving a choice, May not read products (6) |
|  | `rule-user` | Saved, New rule, Searching, Saving a choice, May not read customers (5) |
| `store-credits/` (CMP-DA-G-21) | `edit-store-credit-dialog` | An unused credit, A partly used credit, its amount locked, In euros, Saved, Saving, Amount of zero, Used since the dialog opened (7) |
|  | `issue-store-credit-dialog` | From the store credits list, From a customer's page, Searching customers, Issued, Issuing, Nothing filled in, Amount of zero, Amount refused by Spree, In euros (9) |

**Already covered, reused by these screens:** the six components part 2 gave stories to, `editor-shell`, `export-button`, `market-combobox`, `money`, `resource-combobox` and `type-picker-sheet`, and 55 components with stories from earlier batches and part 1, among them `resource-table`, `table-toolbar`, `bulk-action-bar`, `store-date-picker`, `page-header`, `can`, `slot`, `preferences-form`, `confirm-dialog`, `country-combobox`, `currency-select`, `resource-multi-autocomplete`, `choice-card-picker`, `json-preview-drawer`, `relative-time`, and the primitives. The rules and actions with no editor of their own (the currency, item total, first order, signed-in and one-use-per-customer rules, and free shipping) use `preferences-form`; their states are the promotion form's stories and the screen's captures. The gift card screen builds its sheets from primitives, with no component of its own, so its states are the screen's captures.

**Providers and mocks.** Fixtures for promotions and loyalty (`src/fixtures/admin/loyalty.ts`), each shaped as the browser-test server answered the same request on 2026-11-04 and dated around the fixture clock, 1 October 2026: six promotions, not yet started, running and expired, automatic and with one or many codes, whose rules and actions between them use every rule and calculator Spree registers; the rule and action types and calculators as Spree's catalog lists them; a page and a half of coupon codes, used and unused; gift cards with and without a customer, in a batch, in two currencies, partly and fully redeemed and past their expiry date; store credits in two currencies with their history; shoppers, one of them erased; and the variants a free line items action adds. Mocked Admin API answers for them (`src/mocks/handlers/admin/loyalty.ts`). `editor-sheet.tsx` opens a rule or action editor in its sheet, as the promotion page does. The fixture test checks every new fixture against the admin SDK's schemas, and records where the server's answer differs from the generated type (B19).

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `loyalty.ts` (new) adds what the captures need beyond Spree's sample data, through the Admin API on the browser-test database only (§2.1).
- `staff.ts` adds the marketer and the loyalty viewer, each with its own teammate.
- `screens-catalog-3.spec.ts` (new) captures the five screens. Each capture blocks and records any request that would leave the local servers, and records each request the Admin API refused while the capture was made (§3.3). Each record a capture creates or changes is removed or restored afterwards.
- `compare-catalog-3.spec.ts` (new) compares the 18 new stories and the 8 earlier ones in 26 cases (§5).
- `playwright.config.ts` lists the two new files.

## 2. The part's map, completed

The map from the [work item §12.1](../work-items/fb-19-batch-catalog-and-pricing.md#121-capabilities-screens-flows-and-tests), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-11-04-fb-19-batch-catalog-and-pricing-part-3/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22 and again on 2026-11-04. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen; it does not show that the screen works. **Functionally verified** is whether each behaviour was shown to work at the part's revision, by a browser test or a spec (§2.2, §2.3).

| Capability | Screens | Flows | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-05-12 Promotions and coupon codes | DA-PRM-01 to DA-PRM-03. The coupon field on the cart and at checkout (SF-SHOP-05, SF-CHK-01) is batch 9's, and an order's discounts (DA-ORD-04) are batch 8's | FL-16, its dashboard step | `promotions`; the rule pickers read `products`, `categories`, `customers`, `customer_groups`, `channels`, `markets` and `option_types` | `promotion-form`, the rule and action editors, `match-policy-picker`, `calculator-summary`, and the reused `editor-shell`, `type-picker-sheet`, `preferences-form`, `export-button`, `store-date-picker` | ⟨PRM-STATES⟩; 16 new and 2 earlier cases compared; the 21 tests of `promotions.spec.ts`; Spree's promotion, rule, action, calculator and coupon code specs (§3.2) | PASS: every listed state captured but a partly used code, which Spree does not have (§7); 4 states reached in the browser | PARTIAL: creating an automatic promotion with rules and actions, the country, channel, market, product, category, customer, customer group, currency, item total and first order rules, the flat rate, flat percent and tiered percent calculators and their tiers, item adjustments, free line items and free shipping, cancelling an editor, removing a rule and an action, editing tiers and deleting pass in Spree's browser tests at the part's revision. The 13 promotion behaviours of §2.3 are not functionally verified (G-84) |
| CAP-05-13 Gift cards and store credit | DA-LOY-01, DA-LOY-02. The shopper's gift card list (SF-ACC-09) is the accounts batch's, accepted; a customer's store credit card on DA-CUS-02 is batch 10's | FL-17, its dashboard step; redeeming at checkout is batch 9's | `gift_cards`, `store_credits`; the customer pickers read `customers` | `issue-store-credit-dialog`, `edit-store-credit-dialog`, and the reused `resource-combobox`, `currency-select`, `store-date-picker`, `money`, `resource-table` | ⟨LOY-STATES⟩; 2 new and 6 earlier cases compared; the 6 tests of `gift-cards.spec.ts`, the 5 of `store-credits.spec.ts` and the 5 store credit tests of `customers.spec.ts`; Spree's gift card, batch, store credit and event specs and the gift card workflows (§3.2) | PASS: every listed state captured; 7 states reached in the browser | PARTIAL: issuing a gift card with a generated or a typed code, editing it, issuing a batch, deleting, the old address, the store credit list's totals, issuing to a picked customer and to one created after the search, opening a credit and following it to the customer, editing and deleting a credit, and the dialogs from the customer page pass in Spree's browser tests. The 9 loyalty behaviours of §2.3 are not functionally verified (G-84) |

With part 3, every capability of the work item's §5 is mapped, some only in part. CAP-05-11, price history, keeps P1's result, as in parts 1 and 2. Whether promotions on alcohol are restricted where Liquorify trades is a Liquorify question, deferred until the baseline is complete; part 3 does not answer it.

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-<theme>.webp` in the evidence folder, in light and dark, with a JSON note that records the path, the variant's role, how the state was reached, whether the page settled, any request blocked because it would have left the local servers, and each request the Admin API refused while the capture was made. "Answered" means the browser answered a request itself instead of the server, as the note says; "held" means it held a request open.

**The data.** Spree's sample data gives one promotion, "Free Shipping", with the code FREESHIP. `loyalty.ts` adds the rest through the Admin API, on the browser-test database only:
- six promotions: "Fidelity autumn welcome", automatic and running, with a country and an item total rule and a flat percent order discount; "Fidelity loyal shoppers", with the code LOYAL15, a customer, a customer group, a signed-in and a one-use-per-customer rule and a percent per item discount; "Fidelity winter gifts", 60 codes with the prefix WINTER, a product and a category rule, free shipping and a flat rate discount; "Fidelity spring preview", not yet started, with a channel, a market and a currency rule, a tiered percent order discount and a flat rate item discount; "Fidelity summer clearance", expired, with an option value and a first order rule, a flexible rate order discount and a free kettle; and "Fidelity bulk thanks", with the code BULKTHANKS, a tiered flat rate order discount and a flexible rate item discount;
- gift cards with and without a customer, in euros, past their expiry date (Spree's API accepted a date in the past), and a batch of five with the prefix FIDXMAS;
- store credits in dollars and euros, one issued from a gift card's redemption, and one of a shopper whose data was then erased through the Admin API;
- five orders that staff create and complete through the Admin API, paid by gift card, store credit and Spree's sample check payment method, so that a gift card is partly and fully redeemed, a credit is partly used and spent, and a winter code is used. Spree refuses store credit on an order that has a gift card (B16), so those orders pay the rest by check. None of this reaches a checkout screen.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| DA-PRM-01 Promotions | Listed, automatic and with a code, not yet started, running and expired (admin, marketer, loyalty viewer); searched, and finding nothing; the filter fields the panel offers (B4); filtered by start and expiry date, through the list's address; sorted; none (answered); the delete confirmation; the list failing to load (answered with a server error); a direct visit (order manager, merchandiser) | None |
| DA-PRM-02 New promotion | The empty form, with a coupon code by default (admin, marketer); automatic; one code typed, and one generated; 250 codes with a prefix; a usage limit; its schedule; the rule picker, with every rule Spree registers; the eight rule editors, each searching (admin, marketer); the five rules that use the generic editor; the match policy; an editor cancelled; the action picker; an order adjustment with each of its five calculators, and item adjustments with each of their three, each before and after it is added, with the calculator's summary; free line items; free shipping; a tier above 100 percent refused by the server; the browser's own field checks; saving (held); a direct visit (order manager, merchandiser, loyalty viewer) | None |
| DA-PRM-03 Promotion | Its rules and actions with their summaries (admin, marketer, loyalty viewer), on a phone; the summaries of every calculator, on the running, expired, tiered and not yet started promotions (admin; the running one also for the loyalty viewer); the locked trigger of a single code, and of many codes; a rule's editor opened; a saved product rule and a saved customer rule opened by the marketer, who may not read either; the more actions menu; the rule and action remove confirmations; a rule removed and an action removed, waiting for Save; the tiers editor, a tier added and a tier removed; the codes sheet, its second page and its export; unsaved changes; saved; a usage limit below one, stopped by the browser's own check (B11); a save refused by the server, a name of spaces; the page failing to load (answered with a server error); a direct visit (order manager, merchandiser) | A partly used code, which Spree does not have (§7). The `promotion.form_sidebar` slot draws nothing without a plugin; every capture of the page shows the sidebar as it renders |
| DA-LOY-01 Gift cards | Listed (admin, order manager, loyalty viewer), active, partly redeemed, redeemed and expired, with and without a customer, in a batch and in euros, on a phone; the status filter's options (B15), and filtered to active, partly redeemed and redeemed; searched, and finding nothing; the filter fields; filtered by currency, batch and customer; none (answered); the create sheet (admin, order manager), filled with an amount, a typed code, a currency, an expiry date and a customer, and with a quantity above one, which issues a batch; the edit sheet (admin, order manager, loyalty viewer), a partly redeemed card's, and one without a customer; the row's menu; the delete confirmation; the old promotions address opening the list; the list failing to load (answered with a server error); a direct visit (marketer, merchandiser) | None |
| DA-LOY-02 Store credits | What the store still owes per currency, with what it issued and what was used, and the credits listed, outstanding and spent, issued from a gift card and by hand, and by who issued them (admin, order manager, loyalty viewer), on a phone; filtered to outstanding, spent, issued from a gift card, by who issued it, by customer and by currency; searched, and finding nothing; none (answered); the issue dialog (admin, order manager), filled in euros, issuing (held), and issuing to a customer created after the picker last searched; a credit's sheet with its history (admin, order manager, loyalty viewer), one issued from a gift card, an empty history (answered), the history failing to load (answered with a server error), and the credit of an erased shopper; following a credit to its customer; the edit dialog, and a partly used credit's; the delete confirmation; the list failing to load (answered with a server error); a direct visit (marketer, merchandiser) | None |

**Reached in the browser.** 11 states were reached by answering or holding a request, each saying so in its note: on the promotions list, none and failing to load; on the new promotion page, saving; on a promotion, failing to load; on the gift cards list, none and failing to load; on the store credits list, none, failing to load and issuing, and in a credit's sheet, an empty history and the history failing to load. The promotions list filtered by start and expiry date was reached through the list's address, because the filter panel does not offer those fields (B4); the server answered it.

In DA-LOY-02's none, only the list's answer was emptied, so the cards above it still show what the store owes from the seeded credits. A store with no credits would show no cards; the capture is for the empty list only.

**Nothing secret is shown.** No capture shows a key or token. The admin's and the teammates' sign-ins are kept in memory.

**No request left the local servers.** Every capture blocked and recorded any request to a host other than the local servers. None was: each of the ⟨NOTES⟩ notes records an empty list.

### 2.2 FL-16 and FL-17 step by step

**FL-16, run a promotion.**

| Step | Screen | Browser tests | Result |
|---|---|---|---|
| Create an automatic promotion with a rule and an action | DA-PRM-02 | `promotions.spec.ts`: "creates an automatic promotion with a rule and an action" | PASS in CI (§9) |
| Its rules | DA-PRM-02 | "creates a promotion with a Country rule", "… with Channel and Market rules", "… with a Product rule", "… with a Category rule", "… with a Customer rule", "… with a Customer Group rule", "… with a Currency rule defaulting to store currency" | PASS in CI |
| Its actions and their calculators | DA-PRM-02 | "creates a promotion with a Create Adjustment action", "reopens a Create Adjustment action on the configured calculator", "keeps a flat rate amount and an item total minimum exactly", "keeps a flat percent discount exactly", "saves the tiers of a tiered calculator, lowest threshold first", "refuses a tier discount above 100 percent", "creates a promotion with a Create Item Adjustments action", "creates a promotion with a Create Line Items action" | PASS in CI |
| A promotion with a coupon code, one or many | DA-PRM-02 | None: the tests switch to an automatic promotion | Captured (typed-code, generated-code, many-codes); not functionally verified, criterion 15 (§2.3) |
| Edit it | DA-PRM-03 | "removes a rule and an action while editing", "edits and removes tiers on a saved promotion" | PASS in CI |
| The coupon entered on the cart or at checkout | SF-SHOP-05, SF-CHK-01 | Batch 9 | Not part 3's |
| The order's discounts | DA-ORD-04 | Batch 8 | Not part 3's |

**FL-17, issue and redeem a gift card.**

| Step | Screen | Browser tests | Result |
|---|---|---|---|
| Issue a gift card, with a generated or a typed code | DA-LOY-01 | `gift-cards.spec.ts`: "creates a gift card with an auto-generated code", "creates a gift card with a custom code and edits it" | PASS in CI |
| Issue a batch | DA-LOY-01 | "bulk-issues a batch when quantity > 1" | PASS in CI |
| Redeem it at checkout | SF-CHK-01 | Batch 9 | Not part 3's. Part 3 redeemed gift cards through the Admin API only to reach the list's states, and claims nothing about checkout |
| The shopper's gift cards | SF-ACC-09 | The accounts batch's, accepted | Not part 3's |

Part 3's other browser tests are in no flow: "lists promotions", "cancelling a rule or action editor does not add a row" and "deletes a promotion"; "lists gift cards", "deletes a gift card" and "the old promotions address opens the gift cards list"; the five tests of `store-credits.spec.ts`; and the five store credit tests of `customers.spec.ts`. All pass in CI at the pull request's revision (§9).

### 2.3 Behaviours no browser test drives (criterion 15)

Read in Spree's browser tests at the part's revision. Each is captured, and for each the server's side is covered, where it is, by Spree's specs (§3.2). A capture shows one state; it does not show that the behaviour works. None of these is functionally verified. They are G-84.

| # | Behaviour | Check made instead |
|---|---|---|
| 1 | A promotion with one coupon code, typed or generated | DA-PRM-02 typed-code and generated-code; DA-PRM-03 locked-trigger-single-code, on LOYAL15, which the Admin API created; Spree's promotion and coupon code specs |
| 2 | A promotion with a batch of codes, its prefix and number | DA-PRM-02 many-codes; DA-PRM-03 rules-and-actions, with WINTER's 60 codes; Spree's promotion and coupon code specs |
| 3 | The codes sheet: used and unused codes, its pages and its export | DA-PRM-03 codes-sheet, codes-sheet-next-page and codes-export; Spree's coupon code controller and integration specs. The export's file is not checked (§12.4 of the work item) |
| 4 | A usage limit | DA-PRM-02 usage-limit; DA-PRM-03 usage-limit-below-one, stopped by the browser (B11); Spree's promotion spec, which refuses a limit below one |
| 5 | A promotion's schedule, and an expiry before its start | DA-PRM-02 schedule; the not yet started and expired promotions on DA-PRM-01; Spree's promotion spec |
| 6 | The option value, signed-in and one-use-per-customer rules | DA-PRM-02 rule-option-value, rule-signed-in and rule-one-use-per-user; Spree's rule specs |
| 7 | The match policy, all or any, and a rule's own policy beyond a product rule's "all" | DA-PRM-02 match-policy; DA-PRM-03 rules-and-actions, "Any rule may match"; Spree's promotion and rule specs |
| 8 | The flexible rate, tiered flat rate and percent per item calculators | DA-PRM-02 order-calculator and item-calculator captures; DA-PRM-03 summaries; Spree's calculator specs |
| 9 | A save refused on a saved promotion | DA-PRM-03 save-refused; Spree's promotion controller spec, "returns 422 without a name" |
| 10 | The promotions list's search, start and expiry filters and sorting | DA-PRM-01 searched, filtered-start-and-expiry and sorted; Spree's promotions integration spec |
| 11 | A rule picker for a teammate who may not read what it picks from | DA-PRM-02 rule captures and DA-PRM-03 saved-rule captures, marketer (B5, B6); no Spree spec, G-83 |
| 12 | The promotion page for a teammate who may only read promotions | DA-PRM-03 rules-and-actions, loyalty viewer, which stays loading (B1); no Spree spec, G-83 |
| 13 | A promotion page that cannot load | DA-PRM-03 failing-to-load and direct-visit, which stay loading (B2) |
| 14 | The gift card list's status, currency, batch and customer filters, and its search | DA-LOY-01 filtered and searched captures; Spree's gift card controller spec |
| 15 | An expired gift card | DA-LOY-01 listed, FIDELITY-LAPSED; Spree's gift card spec |
| 16 | The edit sheet of a partly redeemed gift card, and of one without a customer | DA-LOY-01 edit-sheet-partly-redeemed (B14) and edit-sheet-without-customer; Spree's gift card controller spec |
| 17 | Issuing gift cards in a batch with a prefix, filtered by batch | DA-LOY-01 create-sheet-batch and filtered-batch; the browser test issues a batch but does not filter by it; Spree's gift card batch specs |
| 18 | The store credit list's filters: standing, origin, who issued it, customer and currency | DA-LOY-02 filtered captures; Spree's store credit controller spec, which narrows to outstanding credits |
| 19 | A credit's history, empty and failing to load | DA-LOY-02 credit-sheet-from-gift-card, credit-sheet-empty-history and credit-sheet-history-failing (answered); Spree's store credit events specs |
| 20 | The credit of a shopper whose data was erased | DA-LOY-02 credit-sheet-erased-customer (B17, B18); Spree's customer anonymize specs are batch 10's |
| 21 | The issue and edit dialogs refusing an amount | No capture: the stories Amount of zero and Amount refused by Spree, checked against their source; Spree's store credit controller spec, which refuses changing a used credit's amount |
| 22 | The loyalty screens for a teammate who may only read them | DA-LOY-01 and DA-LOY-02 captures, loyalty viewer (B23); no Spree spec, G-83 |

## 3. Permissions and isolation

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it.

| Variant | Role's permission keys, as the role was created through the Admin API | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Order manager template | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | No Promotions entry in the navigation. Both loyalty screens with the admin's controls: New gift card, the create and edit sheets with Save, the row menus, Issue store credit, and a credit's Edit and Delete. On a direct visit, the promotions list reads "No promotions yet", as if the store had none (B3); the new promotion page opens with its whole form and Create promotion (B24); a promotion's page reads "Loading…" without end (B2) |
| Marketer: write on `promotions` and nothing else | `write_promotions` | Only Home and Promotions in the navigation. The promotion screens with the admin's controls. Each rule picker that reads a scope the role does not hold finds nothing, and says so as if nothing matched (B5); a saved rule's products and customers show ⟨B6-RESULT⟩ (B6). On a direct visit, the gift cards and store credits lists read "No gift cards yet" and "No store credits yet" (B3) |
| Loyalty viewer: read on `promotions`, `gift_cards`, `store_credits` and `customers`, write on nothing | `read_promotions`, `read_gift_cards`, `read_store_credits`, `read_customers` | The promotions and gift cards lists without their add buttons, but with each row's menu (B23); the store credits list without Issue store credit and without row menus, and a credit's sheet without Edit and Delete. A gift card's sheet opens with its fields editable and Save (B23). A promotion's page reads "Loading…" without end, because Spree refuses its rules and actions to a teammate who may not change the promotion (B1). On a direct visit, the new promotion page opens with Create promotion (B24) |
| Merchandiser template | `write_products`, `write_categories`, `write_collections`, `write_stock` | No Promotions or Loyalty entry in the navigation. On a direct visit, the promotions, gift cards and store credits lists read as if the store had none (B3); the new promotion page opens with its form; a promotion's page reads "Loading…" without end (B2) |

### 3.2 What the server refuses

⟨SPEC-TABLE⟩

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends, as a staff JWT, the requests §3.1's roles could make or were shown the controls for: the loyalty viewer saving a gift card from its editable sheet, deleting a promotion or a gift card from a row menu, or creating a promotion from the new promotion page (B23, B24); the order manager and the merchandiser creating a promotion from the page they reach directly; the marketer's reads of products, categories, customers, customer groups, channels, markets and option types for the rule pickers, and of gift cards and store credits; and the order manager's and the merchandiser's reads of promotions. The specs above suggest the server refuses these by permission, and §3.3 records how it answered the reads the screens sent, but part 3 did not send the writes. They join G-11 (G-83), as the owner answered on 2026-11-04, for the catalog's consolidated refusal check, the platform batch's step [P10](../work-items/fb-19-batch-platform.md#p10-the-remaining-refusals-within-one-store).

### 3.3 The refusals the captures recorded, for P10

Each capture records every Admin API request answered 401, 403 or 404 while it was made, with the variant that made it. These are the reads the screens sent; they show how the server answered those requests on that run, not that it refuses every request a role may not make. P10 sends them again, with the writes of §3.2, as its exact refusals written before the run. The identifiers in the paths are shown as `…`.

| Variant | Request | Answer | Captures |
|---|---|---|---|
| Order manager | `GET promotions?page=1&sort=-created_at` | 403 | DA-PRM-01 direct-visit |
|  | `GET promotion_rules/types`, `GET promotion_actions/types` | 403 | DA-PRM-02 direct-visit |
|  | `GET promotions/promo_…`, and its `promotion_rules` and `promotion_actions` | 404 | DA-PRM-03 direct-visit |
|  | `GET channels?page=1&limit=100` | 403 | DA-LOY-02 issue-dialog |
| Merchandiser | `GET promotions?page=1&sort=-created_at` | 403 | DA-PRM-01 direct-visit |
|  | `GET promotion_rules/types`, `GET promotion_actions/types` | 403 | DA-PRM-02 direct-visit |
|  | `GET promotions/promo_…`, and its `promotion_rules` and `promotion_actions` | 404 | DA-PRM-03 direct-visit |
|  | `POST reporting/query` | 403 | DA-PRM-03 direct-visit |
|  | `GET gift_cards?page=1&sort=-created_at&expand=customer,created_by,gift_card_batch` | 403 | DA-LOY-01 direct-visit |
|  | `GET store_credits?page=1&sort=-created_at&expand=customer,created_by` | 403 | DA-LOY-02 direct-visit |
| Marketer | `GET products?q[name_cont]=…`, and `POST reporting/query` | 403 | DA-PRM-02 rule-product |
|  | `GET categories?q[name_cont]=…` | 403 | DA-PRM-02 rule-category |
|  | `GET customers?q[search]=…` | 403 | DA-PRM-02 rule-customer |
|  | `GET customer_groups`, with and without a search | 403 | DA-PRM-02 rule-customer-group |
|  | `GET channels`, with and without a search | 403 | DA-PRM-02 coupon-code-default, rule-category, rule-channel, rule-market |
|  | `GET markets?limit=100&sort=position` | 403 | DA-PRM-02 rule-market |
|  | `GET option_types?page=1&limit=100&expand=option_values` | 403 | DA-PRM-02 rule-option-value |
|  | ⟨B6-REQUESTS⟩ | ⟨B6-ANSWERS⟩ | DA-PRM-03 saved-rule-products-unreadable and saved-rule-customers-unreadable |
|  | `GET gift_cards?…` | 403 | DA-LOY-01 direct-visit |
|  | `GET store_credits?…` | 403 | DA-LOY-02 direct-visit |
| Loyalty viewer | `GET promotions/promo_…/promotion_rules?limit=100` and `…/promotion_actions?limit=100` | 404 | DA-PRM-03 rules-and-actions and summaries-running |
|  | `GET channels?page=1&limit=100` | 403 | DA-PRM-03 summaries-running, DA-LOY-01 edit-sheet |
| Every narrower role | `GET dashboard/counters` | 403 | Most captures of the marketer, the loyalty viewer, the order manager and the merchandiser; the navigation's counters, not part 3's |

Two answers matter for P10's expectations. Spree answers 404, not 403, for a promotion and its rules and actions to a teammate who may not read promotions, and for the rules and actions to one who may read but not change them: the promotion rules and actions controllers find their promotion among those the teammate may update (`promotion_rules_controller.rb`, line 53; `promotion_actions_controller.rb`, line 79), as Spree's customer store credit spec describes for a nested list. And the new promotion page's rule and action types answer 403 to roles without `promotions`, yet the page still offers Create promotion (B24).

### 3.4 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open; none of them is about promotions, gift cards or store credit. The customer rule and the gift card and store credit pickers choose shoppers from the customer list that ISO-1 concerns; part 3 captures them with the browser-test store's own shoppers and claims nothing about other stores.

Many of Spree's specs in §3.2 touch store boundaries: another store's promotions, rules, actions, coupon codes, gift cards, batches, store credits and their history are not listed, found or changed. They are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the part claims nothing about isolation from them. No new isolation defect was found; none was looked for beyond these specs.

## 4. A cancelled gift card (G-14, criterion 16)

**No staff control on the running screens cancels a gift card at this revision.** What was checked:
- **The row's menu** offers Edit and Delete only (DA-LOY-01 row-actions, admin; the same for the order manager and the loyalty viewer).
- **The edit sheet's** buttons are Cancel, which closes the sheet without saving, and Save (DA-LOY-01 edit-sheet, admin, order manager and loyalty viewer; edit-sheet-partly-redeemed; edit-sheet-without-customer). It edits the expiry date and the customer only.
- **The delete confirmation** reads "Delete gift card? This will void the gift card and prevent it from being redeemed." (DA-LOY-01 delete-confirmation). Deleting removes the card; it does not give it the canceled status.
- **The capture script** checks, on every DA-LOY-01 state that shows a gift card's menu or sheet, that no menu item is named cancel and no button is named "cancel gift card" or "void". None was found, in either theme, for any role.
- **The status filter** offers Active, Partially redeemed, Redeemed and Canceled (DA-LOY-01 status-options). No gift card on this server has the canceled status, so filtering to it lists nothing.
- **In the code:** the admin gift cards controller's request accepts the amount, currency, code, expiry date and customer, and no status; the Admin API's gift card routes are create, read, update and delete, with no cancel action. Spree's cancel workflow, `Spree::GiftCards::Cancel`, is reached only through `Spree::Dependencies.gift_card_cancel_workflow` and the deprecated `GiftCard#cancel!`. Its 5 core examples pass (§3.2): it cancels an unspent card, publishes `gift_card.canceled`, and refuses a card drawn against, spent against or already canceled.
- ⟨G14-API-DETAIL⟩

**What this means for G-14.** The pending proposal reads "Accept as checked against its source, unless a staff screen cancels one in the catalog batch (5)". The catalog batch's staff screen does not cancel one, so the condition that would change the proposal did not occur. DA-LOY-01's "canceled" status and filter option, and SF-ACC-09's, stay checked against their source only. Answering G-14 stays with the owner; part 3 does not close it.

## 5. Comparison with running screens

⟨COMPARISON-SECTION⟩

## 6. Behaviour found, recorded and not changed

Each is how Spree works at `ffc9f5e0`, whose dashboard is the code the work item names. The part reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | A teammate who may read promotions but not change them gets a promotion page that reads "Loading…" without end. Spree answers the promotion's rules and actions with 404, because those two controllers find their promotion among the ones the teammate may update (`promotion_rules_controller.rb`, line 53; `promotion_actions_controller.rb`, line 79), and the form waits for the promotion, its rules and its actions before it draws anything (`promotion-form.tsx`, line 248) | DA-PRM-03 rules-and-actions and summaries-running, loyalty viewer, with the two 404s in their notes; Promotion form: Read-only role, which shows what the form would draw |
| B2 | The promotion page reads "Loading…" without end when the promotion cannot be read or fails to load. The page does not read the requests' errors (`$promotionId.tsx`), and the form treats a missing promotion as still loading, so a refusal or a server error never becomes a message or a Try again button, as part 2's B23 found for a price list | DA-PRM-03 direct-visit, order manager and merchandiser, and failing-to-load, each still loading after more than ten seconds |
| B3 | A list shows its empty state, as if the store had none, when it is refused or fails to load. On a direct visit, the promotions list for the order manager and the merchandiser, and the gift cards and store credits lists for the marketer and the merchandiser, which Spree answers with 403; and each of the three lists for the admin when its request is answered with a server error, with no message and no Try again button. Part 1's B17 found the same | DA-PRM-01, DA-LOY-01 and DA-LOY-02 direct-visit and failing-to-load |
| B4 | The promotions list's filter panel offers Created at and Updated at, not Starts or Expires, although the list shows both and Spree accepts them as filters; the capture reached them through the list's address | DA-PRM-01 filter-fields and filtered-start-and-expiry |
| B5 | For the marketer, who may write promotions and read nothing else, each rule picker that reads a scope the role does not hold finds nothing and says so as if nothing matched, such as "No products match"; Spree answers each search with 403 | DA-PRM-02 rule captures, marketer, with the 403s in their notes |
| B6 | ⟨B6-TEXT⟩ | DA-PRM-03 saved-rule-products-unreadable and saved-rule-customers-unreadable, marketer; Product rule editor: May not read products; Customer rule editor: May not read customers |
| B7 | An action's remove button is named "Remove rule" for screen readers, as a rule's is: the action row reuses the rule row's label (`promotion-form.tsx`, line 1201), whose comment explains the name for rules | Read in `promotion-form.tsx`; DA-PRM-03 remove-action-confirmation |
| B8 | While the calculators load, a saved action's calculator choice shows Spree's raw type, such as `flat_percent_item_total`, instead of the loading message: the choice draws its value before the calculators' names arrive, and falls back to the raw value (`action-adjustment.tsx`, lines 101 to 111). The loading message shows only for a new action. On the running screen the calculators loaded too fast to show either | Adjustment action editor: Loading the calculators, a saved action, and Loading the calculators; read in `action-adjustment.tsx` |
| B9 | The batch's prefix is labelled "Code prefix (optional)", but leaving it blank is refused with "Prefix is required for multi-code batches" | Promotion form: A batch of codes without a prefix; read in `schemas/promotion.ts` and the dashboard's language file |
| B10 | In the free line items editor, a quantity emptied snaps back to 1, so typing 2 after clearing the field gives 12 | Free line items action editor: Changing a quantity and saving, found while writing it; read in `action-create-line-items.tsx` |
| B11 | Two refusals are made by the browser's own number check, not by the dashboard: a store credit issued with no amount, and a promotion's usage limit of 0, which reads "Value must be greater than or equal to 1." in the browser's own bubble, so the dashboard's message for it never shows | DA-PRM-03 usage-limit-below-one; Issue store credit dialog: Nothing filled in |
| B12 | The codes sheet reads "No codes generated yet." while its codes are still loading | Promotion form: The codes sheet, loading; read in `promotion-form.tsx` |
| B13 | ⟨B13-TEXT⟩ | ⟨B13-WHERE⟩ |
| B14 | A partly redeemed gift card's sheet shows its customer as a raw identifier, such as `cust_gbHJdmfrXB`, with no picker, under the description "Update the gift card's customer or expiry. The code and amount are immutable once issued." | DA-LOY-01 edit-sheet-partly-redeemed |
| B15 | The gift card list shows an "Expired" badge for a card past its expiry date, but its status filter offers Active, Partially redeemed, Redeemed and Canceled, not Expired: expired is worked out from the date, not stored as a status. Filtering to Active therefore lists the expired card too, with its Expired badge. The list's badge reads "Partially Redeemed" where the filter reads "Partially redeemed" | DA-LOY-01 listed, status-options and filtered-status-active, which lists FIDELITY-LAPSED |
| B16 | Spree refuses store credit on an order that already has a gift card, so an order cannot be paid by both. Seen while adding the data; paying at checkout is batch 9's | `loyalty.ts`, through the Admin API; Spree's order store credits spec, "cannot mix gift card and store credit" |
| B17 | Erasing a shopper's data clears the memo of their store credit, and the credit's sheet then has "—" as its title and memo, and still offers Open customer profile | DA-LOY-02 listed and credit-sheet-erased-customer |
| B18 | ⟨B18-TEXT⟩ | ⟨B18-WHERE⟩ |
| B19 | The server answers `gift_card_batch: null` for a gift card with no batch, where the admin SDK's generated type says the field is left out; the fixture test allows null, and says why | `fixtures.test.ts`; the browser-test server's answer on 2026-11-04 |
| B20 | Calculator names differ by where they are read: the calculator choice reads "Flexi Rate" and "Percent Per Line Item", where Spree's catalog of calculators says "Flexible Rate" and "Percent Per Item" | DA-PRM-02 order-calculator-flexi-rate and item-calculator-percent-per-item; the calculators endpoint's answer |
| B21 | Spree's refusals name its internal settings: a tier above 100 percent reads "Calculator preferred tiers should all have a value between 0% and 100%", and a base percent above 100 "Calculator preferred base percent must be less than or equal to 100" | DA-PRM-02 tier-over-100-refused; Promotion form: Save refused, a tier over 100% |
| B22 | In a saved tiered calculator's editor, each tier's order total and discount read as Spree stores them, such as "50.0" and "5.0", with no currency or percent sign, while the base amount beside them reads "$ 0.00" | DA-PRM-03 tiers-editor, tier-added and tier-removed |
| B23 | For the loyalty viewer, who may only read, a gift card's sheet opens with its fields editable and Save, and the promotions and gift cards lists keep each row's menu with Edit and Delete. The store credits list hides them | DA-LOY-01 edit-sheet and listed, and DA-PRM-01 listed, loyalty viewer |
| B24 | The new promotion page opens with its whole form and Create promotion for every role that reaches it, including the order manager, the merchandiser and the loyalty viewer, none of whom may create a promotion; the rule and action types it reads answer 403 to the first two | DA-PRM-02 direct-visit, order manager, merchandiser and loyalty viewer |
| B25 | The country rule's search matches anywhere in a country's name, so "Can" offers Canada and also other countries whose names contain those letters | DA-PRM-02 rule-country |
| B26 | The codes sheet says "Read-only — regenerate by changing the promotion's number-of-codes setting", but the promotion page locks that setting once the promotion is created: "Trigger settings can't be changed after creation." | DA-PRM-03 codes-sheet and rules-and-actions |

B1, B3, B5, B6, B23 and B24 matter for Liquorify's later staff access work, as parts 1 and 2's did; whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own staff access changes (F1). Some of the others affect a merchant directly: a promotion page that never says it cannot load (B1, B2), lists that look empty when they are refused or fail to load (B3), a list that cannot be filtered by its own dates (B4), a codes sheet that points to a setting that cannot change (B26), and refusals in Spree's internal words (B21). B7 affects screen-reader users. None is proposed here as a defect: the owner decides which, if any, to track as existing defects, as with SD-6 and SD-7. This pull request changes none of them.

## 7. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-catalog-and-pricing.md#14-corrections-found-during-part-3) §14, without changing the proposal's text:
- §12.2's DA-PRM-03 "the codes sheet, with used, partly used and unused codes": a coupon code is either used or unused in Spree (`coupon_code.rb`, line 7); there is no partly used code. The sheet is captured with used and unused codes.
- §12.2's DA-PRM-03 "the `promotion.form_sidebar` slot, as it renders": the slot draws nothing without a plugin, as part 1 found for the product page's. Every capture of the page shows the sidebar as it renders.
- §12.2's DA-LOY-01 "listed in each status a running screen can reach: active, partly redeemed, redeemed and expired": expired is not one of Spree's gift card statuses. It is worked out from the expiry date and shown as a badge, and the status filter does not offer it (B15). Each is captured as the list shows it.
- §12.2's DA-PRM-03 "a save refused with its errors": a usage limit below one is stopped by the browser's own check before any request (B11), so the state is captured twice: as the browser stops it (usage-limit-below-one), and as the server refuses a name of spaces (save-refused).
- §12.3's loyalty viewer, "the same screens, with create, edit and delete controls recorded as each screen shows them": the promotion page does not finish loading for this role (B1), so its controls cannot be recorded; what the page would draw is the story Promotion form: Read-only role, checked against its source.
- §12.6's states that need an order: Spree's Admin API completed the orders with its sample check payment method, and accepted a gift card expiry date in the past, so every such state was reached on the running server and none had to be checked against its source.
- §12.6's size estimate: 130 stories and 260 reference images, ⟨SIZE⟩, against about 100 stories, 200 images and 90 captures estimated.

## 8. Gaps

Each names what is missing, the check made instead and what would close it. Part 3's gaps are G-81 to G-84 in LIQ-004's [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), numbered after batch 9's G-73 to G-80. Answering a gap is the owner's, not part of the delegated acceptance, so each stays OPEN with its proposal until the owner answers. The work item's known gaps (§12.10) are among them or closed: G-14 is §4; the states that need an order or a past date were all reached (§7); the states reached in the browser are G-82; the behaviours no browser test drives are G-84; what the server refuses is G-83; using a promotion, a gift card or store credit at checkout is batch 9's. Tenant isolation is an outstanding item, not a gap.

| Gap | Check made instead | What would close it | Proposal | Status |
|---|---|---|---|---|
| G-81: 112 of the 130 stories not compared by the script | ⟨SEEN⟩ show a state seen in a running-screen capture; ⟨SOURCE⟩ checked against their source only. Each is named in the [image review list](2026-11-04-fb-19-batch-catalog-and-pricing-part-3-image-review.md) | Running screens that show those states | Defer, as G-58: each story keeps the comparison status the image review list gives it, and the later batch whose running screen first shows the state compares it, under the [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches). The issue dialog opened from a customer's page goes to batch 10 | OPEN, for the owner's answer |
| G-82: 11 states reached by answering or holding a request in the browser (§2.1) | Each capture says how its state was reached; none shows words the part wrote | A server that answers so | Accept as simulated interface-state coverage only, as G-54 and G-59 | OPEN, for the owner's answer |
| G-83: What the server refuses to the roles in §3.1 beyond Spree's specs | The reads the screens sent, as the server answered them (§3.3); the interface's behaviour (§3.1) | P10's check of the requests in §3.2 and §3.3 | Join G-11, as the owner answered for the catalog on 2026-11-04 (decision 3) | LINKED to G-11 by that answer, for P10; open |
| G-84: The 22 behaviours no browser test drives (§2.3) | The captures of each, and Spree's specs for the server's side | A browser test for each | Defer to the platform batch's browser-test work, step [P9](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration), as G-61 was. Those that depend on a narrower role (11, 12 and 22) join G-83 for P10 | OPEN, for the owner's answer |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap | Unchanged: NOT_RUN |

**Earlier gaps this part changes.** The 8 earlier stories compared in §5 leave G-33, G-53 and G-58 (§5.2). G-14 keeps its PENDING answer with the evidence of §4. G-11 gains part 3's requests through G-83.

## 9. CI runs and local checks

⟨CI⟩

## 10. Limitations

- **Coverage is not functional verification.** A capture shows one state of a screen at one moment. Only Spree's browser tests, run in CI, and Spree's specs show behaviour, and only for what they drive (§2.2, §2.3).
- **The data was added through the Admin API.** The used codes, redeemed gift cards and spent credits come from orders that staff created and completed through the Admin API with Spree's sample check payment method. They show the screens' states; they say nothing about checkout, which is batch 9's.
- **Simulated states.** 11 states were reached by answering or holding a request in the browser (G-82). They show what the interface draws; they claim nothing about the server.
- **The refusals in §3.3 are observations.** They are how the server answered the reads the screens sent on one run, not a check written before the run, and the writes were not sent (G-83, P10).
- **The comparison is diagnostic.** It informs the review of the images and does not decide it. Its style figures come from the browser's computed styles of the compared elements.
- **One browser, one size.** The captures use the pinned image's Chromium at 1280 pixels, and 390 for the three phone states. Other browsers and sizes are not checked.
- **Tenant isolation is not checked** (§3.4).
- **The verifier is not independent.** This record was written by the automated session that built the part, and the acceptance is delegated, not the owner's review.

## 11. Evidence

The [evidence index](evidence/2026-11-04-fb-19-batch-catalog-and-pricing-part-3/README.md) lists the captures with their notes, the comparison's side-by-sides and styles, and Spree's spec results, ⟨EVIDENCE-SIZE⟩ in all, as lossless WebP and JSON. The [image review list](2026-11-04-fb-19-batch-catalog-and-pricing-part-3-image-review.md) names every reference image, with its earlier stories section.

## 12. Acceptance

⟨ACCEPTANCE⟩
