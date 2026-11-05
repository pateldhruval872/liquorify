---
title: FB-19 platform batch, step P9, part 1, browser tests for Getting Started and batch 7's settings actions
record: verification
work_item: FB-19
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Seventeen browser tests, each driven through the running dashboard as the admin and asserting what the screen shows and, after a reload, what was kept. Seven are item 1.4's, Getting Started's store address, storefront and payment method tasks (G-37 with G-68), and ten are G-69's payment, delivery and tax actions from batch 7. Run twice in a row in the pinned Playwright image at `231b2176`, on freshly started servers, as at `02a5071d` before it, with Spree's code as on `main` at `303d3410`. Fifteen passed both times and two failed both times, at the same assertion, on defects of Spree's dashboard. Each of the 17 was shown to fail when what it checks does not happen. The storefront sheet's refusal of "https://" saves nothing but its message is drawn beneath the sheet (SD-7, already recorded). The sheet saves "not an address" as the storefront address `https://not%20an%20address` and shows the task done (SD-24, new). Every action G-37, G-68 and G-69 name has a test that passes or fails only on a recorded defect, so the three gaps close on this record as delegated acceptance, not the owner's review. SD-7 and SD-24 stay open. Tenant isolation stays NOT_RUN, and nothing here is claimed about ISO-6. P9 is not complete
---

# FB-19 platform batch, step P9, part 1, browser tests for Getting Started and batch 7's settings actions

**Claim.** Step P9 of the [platform batch](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) asks for one browser test for each action its gaps name. It runs in parts, one for each gap. This record is part 1: item 1.4, Getting Started's tasks (G-37 with G-68), and item 1.1, batch 7's payment, delivery and tax actions (G-69). The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/getting-started-tasks.spec.ts` and `fidelity/settings-actions.spec.ts`, with what they share in `fidelity/p9.ts`. They change nothing in Spree's code, tests or workflows.

**Results against P9's completion criteria, for part 1.**

| # | Criterion | Result |
|---|---|---|
| 1.1 | G-69: deleting a zone and a delivery method, adding a zone's states and postal codes, creating a rate for a state, the external tax service's note, making a profile the default, narrowing a profile's origins, a payment method's name refused, and switching a method to admin only | PASS: ten tests, one for each action, twice (§2, tests 8 to 17) |
| 1.4.1 | The store address dialog: a required field left empty is refused with its message and nothing is saved; with the required fields filled, saving closes the dialog and the task shows done | PASS: two tests, twice (§2, tests 1 and 2) |
| 1.4.2 | The storefront address: saved, shown again after a reload, and the task done. A value that is not an address is not saved and its refusal message is visible | PARTIAL: saving an address PASSES, twice (§2, test 3). Two values that are not addresses FAIL, twice, each on a recorded defect: "https://" is refused and nothing is saved, but the message is drawn beneath the sheet (SD-7); "not an address" is saved as an address and the task shows done (SD-24, §4) (§2, tests 4 and 5) |
| 1.4.3 | The payment method task's link opens the payment methods page | PASS: one test, twice (§2, test 6) |
| 1.4.4 | After the store address, the storefront address and a payment method, a reload shows those three tasks done, the progress counts them, and a task not done still shows not done | PASS: one test, twice (§2, test 7) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all 17 failed, each at the assertion that checks that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS for the runs: at `231b2176`, twice in a row on freshly started servers, as at `02a5071d` before it, with the same 15 passing and the same two failing at the same assertion every time (§1) |
| 4 | A failure is a defect in LIQ-004, kept, not fixed in Spree, the test not weakened | PASS: SD-7 was already in LIQ-004; SD-24 is added. Both are open, Spree's code is unchanged, and both tests keep failing while their defect stands (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-37, G-68 and G-69 CLOSE on this record, as delegated acceptance under the owner's delegation of 2026-11-04, not the owner's review: every action they name has a test that passes, or fails only on SD-7 or SD-24 (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/getting-started-tasks.spec.ts`, `fidelity/settings-actions.spec.ts` and `fidelity/p9.ts`, at `231b2176` on this pull request's branch, with `fidelity/playwright.config.ts` listing both. `fidelity/stack.spec.ts` gains the stand-in tax engine below. The first version, `02a5071d`, ran the same way; looking at its screenshots found two that did not show what their test checks, corrected at `231b2176`, which changes no assertion (§1.3) |
| Spree's code | As on `main` at `303d3410`, which this branch does not change. The last change before it, #57, changes only the security audit workflow |
| Server and data | Spree's browser-test server, its database and its fixtures, started exactly as the dashboard's own browser tests start them (`fidelity/stack.spec.ts`), with Ruby 3.3.6 on SQLite. Before each run the server was stopped and started again with a new database. The Getting Started tests work in the fixtures' second store, Winkel, where no task is done, and put its address, storefront address and test payment methods back to that before each test. The settings tests work in the fixtures' default store and add their own records first through the Admin API, each named with the run's stamp: two delivery profiles, four zones, two delivery methods and a test gateway. What a test changes outside its own records, the store's default profile and its markets' tax engines, it puts back when it ends |
| The stand-in tax engine | The external tax service's note shows only for a market whose tax is worked out by an engine other than Spree's own rates, and Spree's test server registers none. Started with `LIQUORIFY_TAX_ENGINE=1`, `stack.spec.ts` writes an initializer into Spree's generated test app, which is not part of the repository, that registers "Stand-in tax engine", a copy of Spree's own internal engine under another name, and removes it when the server stops. Spree's dashboard tests register their own test integration the same way. The engine calls nothing outside and works out no tax in these tests: the note is shown from the market's saved setting, not from a real tax service, which stays P4's |
| Dashboard | Built from `packages/dashboard` with Vite on 2026-11-04 at `fc5cb555`, whose dashboard packages and Spree code are the same as at `303d3410`, and served with `vite preview` on port 5174, proxied to the server, as the dashboard's browser tests do in CI |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The browser tests' admin, whose role holds every permission in both stores |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | Each on a server started afresh just before it, on 2026-11-04 and 2026-11-05 UTC: at `02a5071d`, the check run at 23:48 and the recorded runs at 23:52 and 23:54; at `231b2176`, the check run at 23:57 and the recorded runs at 00:02 and 00:04. Each recorded run took under two minutes. In each, 15 tests passed and the same two failed at the same assertion; the JSON files of the two runs at each revision were the same apart from the run's stamp. The evidence is the last run's, whose records are stamped `mw2s9hx4`, `mw2sa0rq` and `mw2sa505` |
| Records per run | When a test fails, Playwright starts a new worker for the tests after it, with a new stamp. So each run used three stamps: one for tests 1 to 4, one for test 5 and one for tests 6 to 17 |
| Secrets | The test gateway's secret is made up for each run, never written down, and painted out in its screenshot. The storefront sheet's Store API address and publishable key are painted out of every screenshot that shows the sheet |

### 1.1 What each test asserts on the screen and after a reload

Each test drives the dashboard as a merchant would: it types, clicks and reads what the screen shows. It then reloads the page, or opens the record again after a reload, and asserts what was kept. It writes a JSON file of what each step showed, and a screenshot of where it ended.

### 1.2 Showing that each test fails when it should

With `P9_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo the change the test then looks for: in the request the dashboard sends, by answering that request itself, or by stopping a click. Three Getting Started tests check that nothing is saved, so for those the sabotage saves the value through the Admin API, as a screen that ignored its own refusal would. The run passes only if every test fails. Each failure was then read to check it came from the assertion that checks the change, not from an earlier step.

| # | Test | What is undone | Where it failed |
|---|---|---|---|
| 1 | The store address refused | The address is saved through the Admin API after the refusal | The task shows done after the reload |
| 2 | The store address saved | The street is left out of the save | The task is not done after saving |
| 3 | The storefront address saved | The address is left out of the save | The task is not done after saving |
| 4 | "https://" | The address is saved through the Admin API after the refusal | The task shows done after the reload. The message's check fails as in every run (SD-7) |
| 5 | "not an address" | The same | Fails as in every run, at the requests that saved the value (SD-24): while SD-24 stands, this check shows nothing more than the run does |
| 6 | The payment method task's link | A click on the link is stopped | The page is still Getting Started |
| 7 | Three tasks done after a reload | The street, the storefront address and the payment method's visibility are left out of their saves | The address task is not done after the reload |
| 8 | Deleting a zone | The delete is answered in the browser, so it never reaches the server | The zone is still listed once the delete is confirmed |
| 9 | Deleting a delivery method | The same, for the method | The method is still listed once the delete is confirmed |
| 10 | A zone's states | The states are left out of the zone's save | The zone's card lacks Colorado after the reload |
| 11 | A zone's postal code rule | The rule is left out of the zone's save | The zone opens without the rule after the reload |
| 12 | Making a profile the default | Left out of the save | The profile does not show as the default |
| 13 | Narrowing a profile's origins | The chosen locations are left out of the save | The profile ships from all locations after the reload |
| 14 | A rate for a state | The state is left out of the create | The rate is listed for the whole country after the reload |
| 15 | The external tax service's note | The market's tax engine is left out of its save | No note on the tax rates page |
| 16 | A payment method's name refused | The name is changed in the create, so it is not refused | The name field is not marked as refused |
| 17 | Switching a method to admin only | Its visibility is left out of the save | The list does not show it admin only |

The check runs at `02a5071d` and at `231b2176` each failed all 17, each where the table says. Tests 4 and 5 also fail at the message above the sheet, as in every run. Test 4's sabotage is then caught by the task check after the reload; test 5 fails at the requests that saved the value, as in every run (SD-24).

### 1.3 The screenshots, corrected at `231b2176`

Every screenshot of the second run at `02a5071d` was looked at. Two needed correcting, both in the evidence and neither in an assertion:

- **The store address refusal** was taken just after the refusal, then overwritten by the test's last screenshot, which has the same name. It is now `store-address-refused-message.png`.
- **The zone's states** ended with the state list at its top, so neither ticked state showed. The test now scrolls to Colorado before its screenshot.

The check run and both recorded runs were then repeated at `231b2176`. The two corrected screenshots of the last run were looked at; the others were looked at in the run at `02a5071d`, and their steps did not change.

## 2. Results

| # | Item | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 1 | 1.4.1 | In Winkel, asserts the store address task not done. Opens its dialog, fills every required field but the address, and saves. Asserts "Address is required" on the field, marked as refused, and the dialog still open. Cancels, asserts no request changed the address, reloads, and asserts the task still not done, the progress unchanged and the address not shown | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/store-address-refused.json), [refused](evidence/2026-11-05-fb-19-platform-p9-part-1/store-address-refused-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-1/store-address-refused.png) |
| 2 | 1.4.1 | Opens the dialog, fills the company, street, city, postal code and country, saves, and asserts the dialog closes, the task shows done with the progress one higher and the street shown in the task. Reloads and asserts the task done and the progress, the saved address shown in the task, and the dialog opening again with the saved street, city, postal code and company | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/store-address-saved.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/store-address-saved.png) |
| 3 | 1.4.2 | Opens the storefront sheet from its task, enters an `example.com` address of the run, saves, and asserts "Storefront URL saved: …", the sheet closed, the task done and the progress one higher. Reloads, asserts the task done and the progress, and opens the sheet to assert it shows the address | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-address-saved.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-address-saved.png) |
| 4 | 1.4.2 | Enters "https://" and saves. Records whether "This doesn't look like a valid storefront URL." is in the page and whether it is what a person sees at its place, and asserts it is. Closes the sheet, reloads, and asserts no request saved an address, the task not done and the sheet's field empty | FAIL, both runs, at the message only: it is in the page but drawn beneath the sheet, so it does not show (SD-7). Nothing was saved and the task stayed not done: that part passes | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-scheme.json), [after saving](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-scheme-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-scheme.png) |
| 5 | 1.4.2 | The same with "not an address" | FAIL, both runs: no message; the sheet says "Storefront URL saved: https://not%20an%20address", saves it as the store's storefront address and adds it to the store's allowed origins, and after the reload the task shows done and the sheet shows the value (SD-24, §4) | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-words.json), [after saving](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-words-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-1/storefront-not-an-address-words.png) |
| 6 | 1.4.3 | Opens the payment method task and follows its link. Asserts the address is Winkel's payment methods page (DA-SET-12), its heading "Payment Methods" and its Add payment method button | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-task-link.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-task-link.png) |
| 7 | 1.4.4 | Records the six tasks and the progress. Saves the store address through its dialog and the storefront address through its sheet, then adds a cheque payment method on the payment methods page, visible in the storefront and active. Goes back to Getting Started, reloads, and asserts the address, payment method and storefront tasks done, the products and support email tasks not done, and the progress three higher. The taxes task is recorded, not asserted (§5) | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/tasks-done-after-reload.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/tasks-done-after-reload.png) |
| 8 | 1.1 | Opens the run's profile, deletes a zone from its menu, asserts the confirmation names it, confirms, and asserts "Delivery zone deleted" and the zone gone. Reloads and asserts it gone and the profile's three other zones there | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-deleted.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-deleted.png) |
| 9 | 1.1 | The same for one of a zone's two delivery methods: "Delivery method deleted"; after the reload the method is gone and the other one stays | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/method-deleted.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/method-deleted.png) |
| 10 | 1.1 | Edits a zone that covers Canada, opens the United States' states and ticks Colorado and Utah. Asserts "1 countries, 2 states", saves and asserts "Delivery zone updated". Reloads, asserts the zone's card names both states, and opens the zone to assert both ticked and Canada still ticked | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-states-added.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-states-added.png) |
| 11 | 1.1 | Edits a zone that covers Mexico, opens its postal code rules, adds a rule for the United States with the prefix 80, asserts "1 countries, 0 states, 1 postal code rules", saves and asserts "Delivery zone updated". Reloads, opens the zone, and asserts the rule's country and prefix | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-postal-code-added.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/zone-postal-code-added.png) |
| 12 | 1.1 | Opens a second profile of the run, chooses Make default, asserts the confirmation "Make this the default profile" and confirms. Asserts "Products without a profile of their own ship on this one." and no Make default button. Reloads and asserts the same, then asserts the profiles list marks it Default and General no longer. Afterwards makes General the default again through the Admin API | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/profile-made-default.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/profile-made-default.png) |
| 13 | 1.1 | On the run's profile, asserts the Ships from card on All locations, chooses Selected locations, ticks Shop location, saves and asserts "Shipping profile updated". Reloads and asserts Selected locations, Shop location ticked and the store's two other locations not | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/profile-origins-narrowed.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/profile-origins-narrowed.png) |
| 14 | 1.1 | On the tax rates page, adds a rate named for the run at 6.25% in the Default category for Texas, United States, and asserts "Tax rate created". Reloads, asserts the list shows 6.25% for "United States — TX", and opens it to assert its state Texas | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/tax-rate-for-a-state.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/tax-rate-for-a-state.png) |
| 15 | 1.1 | Asserts no note on the tax rates page. Opens the Europe market's sheet, chooses Stand-in tax engine, saves and asserts "Market updated". On the tax rates page, and again after a reload, asserts "These rates are not used in Europe (Stand-in tax engine), which work out tax with an external service." Puts the United States market on the engine the same way, reloads, and asserts the note says none of the markets use these rates and names both. Afterwards puts both markets back on Spree's rates through the Admin API | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/external-tax-note.json), [one market](evidence/2026-11-05-fb-19-platform-p9-part-1/external-tax-note-one-market.png), [both](evidence/2026-11-05-fb-19-platform-p9-part-1/external-tax-note.png) |
| 16 | 1.1 | Asserts one payment method named Store Credit. Adds a Check method named Store Credit and asserts the name field refused with "has already been taken" and the sheet still open. Closes it, reloads, and asserts still one Store Credit and no cheque method. Afterwards deletes any cheque method through the Admin API | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-name-refused.json), [refused](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-name-refused-message.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-name-refused.png) |
| 17 | 1.1 | Opens the run's test gateway, listed Visible and Active, switches Visible in storefront off, saves and asserts "Payment method updated" and the row "Admin only". Reloads, asserts the row admin only and still active, and opens it to assert Visible in storefront off and Active on | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-admin-only.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-1/payment-method-admin-only.png) |

## 3. Choices made while writing the tests

- **Two values that are not addresses.** Item 1.4.2 names a value that is not an address. Batch 3 found SD-7 with "https://", so test 4 uses it. Test 5 adds a value of words, which a merchant is as likely to type, and which found SD-24. Both are kept, each failing on its own defect.
- **SD-7 is checked by what a person sees.** Playwright counts a message as visible even when something is drawn above it, so test 4 also asks the browser which element is on top at the message's centre. That check is soft, so the test still checks and records whether anything was saved, then fails.
- **The taxes task is not asserted.** It shows done once any store has a tax rate (ISO-6), so in Winkel it depends on the default store's rates. Test 7 records it and asserts the products and support email tasks instead as the tasks not done.
- **The stand-in tax engine** (§1) was chosen over answering the market's request in the browser, as batch 7's capture did (G-66), so test 15 drives a saved setting and a reload rather than a simulated answer.

## 4. Defects found

One new, SD-24, and one already recorded, SD-7, both in Spree's dashboard, recorded in LIQ-004 and not fixed. SD-24 was numbered by the baseline audit, which keeps the register, and is distinct from SD-7: SD-7 is a refusal whose message is hidden, SD-24 a value that is not an address being accepted. Neither is reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).

| # | Defect | Severity | Seen |
|---|---|---|---|
| SD-7 | The storefront sheet refuses an address that is not one but draws its message beneath the sheet, so the merchant is not told why nothing was saved. Batch 3 recorded it as B7 | Medium | Test 4, in every run: the message is in the page, but at its centre the sheet's layer is on top |
| SD-24 | The storefront sheet accepts "not an address". It says "Storefront URL saved: https://not%20an%20address", saves that as the store's storefront address, adds it to the store's allowed origins, and after a reload the storefront task shows done and the sheet shows the value. Read in code, the sheet puts `https://` before a value without one and keeps whatever the browser reads as its origin; Chromium reads the spaces into the host as `%20`, where the URL standard, and Node, refuse the value. The server accepts both requests | Medium: the task shows done with an address no storefront can have, and the store gains an allowed origin no site can have | Test 5, in every run. Only that value was tried, in Chromium |

The tests stay as they are: test 4 passes once the message shows above the sheet, and test 5 once such a value is refused with its message shown.

## 5. What this does not show

- **Refusals to narrower roles (G-11, P10).** Every test signs in as the admin. What the server refuses batch 7's narrower roles stays in G-70, for P10.
- **Tenant isolation, ISO-6 included.** Each test stays within one store: the Getting Started tests in Winkel, the settings tests in the default store. Nothing here shows that one store's records stay out of another's. ISO-6, where one store's tax rate marks another store's taxes task done, is why test 7 does not assert the taxes task; this record claims nothing about it. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- **Real providers.** Payments use Spree's test gateway and the cheque method; the tax note uses a stand-in engine that works out no tax. Real payment and tax providers stay P4's, with G-39.
- **Effects outside the dashboard.** That a zone, a method, a rate, a default profile or an admin-only method changes what a shopper is offered at checkout is G-71's, with G-38, and batch 9's. That a storefront address connects a storefront is FL-19's.
- **G-66.** Batch 7's capture reached the note's states by answering a request in the browser. Test 15 reaches them through a saved setting, with a stand-in engine; G-66 stays as the owner accepted it, simulated coverage of the captures only.
- **Other browsers and window sizes.** Every run used Chromium at 1280 by 800 pixels. SD-24 depends on how the browser reads an address, and may not happen in another browser.

**The capabilities.** This record changes no capability's status. With G-37, G-68 and G-69 closed, these keep each one PARTIAL:

| Capability | What keeps it PARTIAL |
|---|---|
| CAP-03-04 Getting started checklist | SD-7 and SD-24 on the storefront task; each task's own work, which is its batch's; the taxes task, which ISO-6 affects |
| CAP-07-01 Payment methods | The methods offered at checkout, batch 9's, and real providers, P4's |
| CAP-07-04 Delivery profiles, zones, methods and rates | Rates at checkout, batch 9's |
| CAP-07-11 Tax categories and rates, an external tax service | No browser test shows the taxes task done, where ISO-6 shows; tax on a cart or an order, batches 8's and 9's; a real tax engine, P4's, with G-39 |

The server refusals of all four stay open in G-70, for P10, and tenant isolation in FB-03.

## 6. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of these 17 tests and their results, as recorded here, and the closing of G-37, G-68 and G-69 under criterion 7. The owner did not review this work |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |
| Closed | G-37 and G-68: every action item 1.4 names has a test that passes, or fails only on SD-7 or SD-24. G-69: all ten of its actions have a test that passes |
| Not accepted here | SD-7 and SD-24, which are recorded, not answered |

What stays open:

- **P9 is not complete.** G-61, G-72, G-75 and G-84 have their own parts, each in its own pull request.
- **SD-7 and SD-24 are open** in LIQ-004, and tests 4 and 5 fail while they stand.
- **The capabilities stay PARTIAL** (§5).
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.

## 7. Evidence

The [evidence folder](evidence/2026-11-05-fb-19-platform-p9-part-1/) holds each test's JSON file and screenshot from the second recorded run at `231b2176`, the screenshots taken mid-test (the refused store address, both storefront values just after saving, the refused payment method name and the note for one market), and `checks.json`, which gives, for the check run at `231b2176`, each test's outcome, the first line of each assertion it failed at, and that assertion's line in the test. Each JSON file names its test, the revision, the run's stamp and every request blocked because it would have left the local servers; none was. The records are the run's own, named with its stamp, and the storefront addresses are `example.com` ones. Winkel's store id is written as `<Winkel>`. No token, key or password is recorded, and the screenshots paint out the test gateway's secret and the storefront sheet's Store API address and publishable key.
