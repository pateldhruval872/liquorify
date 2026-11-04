---
title: FB-19 batch, payments, delivery and tax settings
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-11-03
updated: 2026-11-04
---

# FB-19 batch: payments, delivery and tax settings

Batch 7 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches): the settings in [LIQ-006 §7](../LIQ-006-product-capability-baseline.md#7-payments-delivery-inventory-and-tax) that decide how a store is paid, how it ships and how it charges tax. It reproduces what Spree already has for payment methods, tax categories and rates, delivery profiles with their zones and methods, pickup, digital delivery and package types. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-03, at the owner's request to prepare it beside part 2 of the catalog batch. It depends on the setup batch, which the owner accepted and merged on 2026-10-26, and LIQ-004 lists "test keys for the providers' states" beside it; question 2 in §7 asks whether the batch waits for them. It follows the batch rules of LIQ-010 0.4 and has the same shape as the [setup batch](fb-19-batch-setup-stores-and-settings.md). The owner answered §7 on 2026-11-04, approving all three recommended answers: one pull request, Spree's built-in test providers, and checkout and order effects left to batches 9 and 8. It runs in lane C, which the owner started with decision 1 the same day; at most three implementation lanes run at once, as the owner asked on 2026-11-03. It was built on 2026-11-04 in pull request #41 ([record](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax.md)), which records where the running screens differ from §2.1 and §4 (record §6). Its reference images, screen evidence and fidelity were accepted on 2026-11-04 by delegated acceptance, under the owner's delegation of 2026-11-04, at #41's final commit ([record §12](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax.md#12-delegated-acceptance)); this is not the owner's review, and G-65 to G-71 wait for the owner's answers. #41 merged the same day as `675bc42c` ([merge record](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax-merge.md)). This work item stays PROPOSED until it is accepted under D5.

## 1. Outcome and summary

Every payment, delivery and tax settings screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a map from each capability to its evidence or to a named gap. The batch also finishes the two steps of FL-01 that the setup batch left to these screens: the payment method and taxes tasks on Getting Started.

- **Bounded:** 6 screens, 2 steps of an existing flow, no email, 6 browser test files and 21 new components, in one pull request if the owner agrees (§7).
- **Same shape as the setup batch:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **No secret is published:** a payment provider's secret settings are masked in every capture and replaced in every record; stories use invented values that do not look like a key (§5, criterion 14).
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs. Where a setting takes effect somewhere else, at checkout, on orders or through a real provider, the batch names who checks it (criterion 15) and claims nothing itself.

## 2. Scope

The rest of LIQ-006 §7 that the earlier and later batches do not own, every screen it uses in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and FL-01's last two tasks.

| Capability (LIQ-006 §7) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-07-01 Payment methods: the methods a store offers | DA-SET-12; DA-SET-10's provider sheet, captured by batch 2, gets its stories here | FL-01, the payment method task | `payment-methods.spec.ts` |
| CAP-07-02 Stripe: its configuration only | DA-SET-12 and DA-SET-10, with the providers the browser-test server registers. The Stripe gem is not loaded there (§2.3) | None | None that reach Stripe |
| CAP-07-04 Delivery profiles, zones, methods and rates | DA-SET-16, DA-SET-17 | None | `delivery-settings.spec.ts` |
| CAP-07-05 Pickup points and pickup delivery: the setting | DA-SET-17, the pickup card | None | `delivery-settings.spec.ts`: "offers pickup from a fresh profile, on a form with no zone" |
| CAP-07-07 EasyPost: where it would be chosen | DA-SET-17's rate provider field. The EasyPost gem is not loaded on the browser-test server (§2.3) | None | None that reach EasyPost |
| CAP-07-08 Package types, and the freight rate provider | DA-SET-19; DA-SET-17's freight rate provider with a markup | None | `package-types.spec.ts`; `delivery-settings.spec.ts`: "prices a method through the freight rate provider with a markup, and it reopens that way" |
| CAP-07-11 Tax categories and rates, included or added tax, an external tax service | DA-SET-13, DA-SET-14, the taxes layout | FL-01, the taxes task | `tax-categories.spec.ts`; `tax-rates.spec.ts`; `taxes.spec.ts`: "opens on categories and switches between the tabs" |
| CAP-07-12 Tax exemptions | DA-SET-15: covered by the setup batch, mapped here and not captured again. Certificates and identifiers on a customer go to batch 10 | None | `taxes.spec.ts`: "adds a tax exemption reason with its code", the setup batch's |

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-SET-17 is also captured on a narrow screen, since its zone and method cards stack.

| Screen | States |
|---|---|
| DA-SET-12 Payment methods | Listed, with an active and an inactive method, shown on the storefront and not; none; the add sheet for each provider the server registers; the provider changed, swapping its settings; a secret setting kept on edit and shown masked; edit; a save refused with its errors; delete confirmation |
| DA-SET-13 Tax categories | Inside the taxes layout's tabs: listed, with the default; none; the create sheet; edit; a save refused with its errors; delete confirmation |
| DA-SET-14 Tax rates | No tax category yet, asking for one first; listed, with each rate's country or state and its percentage; none; the note that shows where a market uses an external tax service; create for a country and for a state; three decimals kept; a fourth decimal and a blank rate refused without saving; edit; delete confirmation |
| DA-SET-16 Delivery profiles | Listed, with the store default; physical and digital profiles; the create sheet |
| DA-SET-17 Delivery profile | The general card; shipping origins in one group, split into a second group, and collapsed back; a profile with no zones; a zone added, with its countries and states; methods priced with a flat rate in the store's currency, with amounts per currency and with conditions; a calculator changed, resetting its settings; a method priced through the freight rate provider with a markup; pickup offered from a fresh profile; a digital profile with a digital method; the method sheet opened from its own address; delete confirmations for a zone and a method; the page failing to load |
| DA-SET-19 Package types | Listed, with each carton's measurements; none; the add sheet; edit; delete confirmation |

### 2.2 Permission variants

Spree's catalog puts payment methods, tax categories and rates, delivery profiles and zones under `settings`, and gives delivery methods and package types their own scopes, `delivery_methods` and `package_types`, because a marketplace seller may own their own. Four roles cover them:

- **Admin role:** every screen with every control.
- **A custom role with read on `settings`, `delivery_methods` and `package_types`, and write on nothing:** the same screens, with create, edit and delete controls recorded as each screen shows them, since earlier batches found screens that keep controls the server then refuses.
- **A custom role with read on `settings` and write on `delivery_methods` and `package_types`:** DA-SET-17 with its profile and zones read-only and its methods editable, and DA-SET-19 editable. This is the boundary the two separate scopes draw, recorded as the screen shows it.
- **A role made from the order manager template, which holds no settings:** the settings entries hidden, and a direct visit to each screen recorded as it shows.

### 2.3 Left out, and where it goes

- **Real providers:** the browser-test server loads neither the Stripe nor the EasyPost gem, so their settings sheets and EasyPost's rate provider do not appear on a running screen. Stories may show them from a mocked list of provider types, checked against their source and labelled as such. Sandbox calls stay with platform step P4, with G-26 and G-39, which this batch does not close (question 2).
- **Payment sessions, saved cards and refunds (the rest of CAP-07-01):** checkout in batch 9, saved cards with the accounts batch, refunds in batch 8.
- **The storefront's payment forms (CAP-07-03):** batch 9.
- **Fulfilment, labels and tracking (CAP-07-06):** batch 8, with FL-06.
- **Stock locations (DA-SET-18), stock and transfers (CAP-07-09, CAP-07-10):** batch 6. `stock-location-scope-field` already has its story from the setup batch.
- **Integrations (DA-SET-10):** captured by batch 2. Only the payment method sheets it opens get their stories here, as batch 2 decided.
- **A seller's own delivery methods and package types (SP-SET-02, SP-SET-03):** batch 13.
- **Tax exemption certificates and tax identifiers on a customer (DA-CUS-02, DA-CUS-05):** batch 10.
- **Where a setting takes effect outside the dashboard:** delivery rates, pickup, digital delivery, tax included or added, and the payment methods offered at checkout in batch 9; refunds and labels on orders in batch 8; providers' sandbox calls in P4 (criterion 15).

## 3. Components

The screens use 21 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the six screens and the delivery method routes import at `main` `5794da6a`, followed through the components they import in turn; the batch's first step confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Composed (CMP-DUI-C) | `storefront-visible-switch` (49) |
| Framework pages (CMP-CORE-PG) | `package-types` (01) |
| `payment-method-editors/` (CMP-DA-G-12) | `payment-method-form`, `payment-method-sheets` |
| `shipping/` (CMP-DA-G-20) | `delivery-digital-methods-card`, `delivery-method-form`, `delivery-method-list`, `delivery-method-sheet`, `delivery-origin-group-dialog`, `delivery-origin-group-section`, `delivery-pickup-card`, `delivery-profile-general-card`, `delivery-profile-origins-card`, `delivery-zone-card`, `delivery-zone-region-picker`, `delivery-zone-sheet`, `delivery-zones-and-methods-section` |
| `taxes/` (CMP-DA-G-22) | `market-tax-providers`, `taxes-tabs` |
| Admin dashboard (CMP-DA-G-24, top level) | `jurisdiction-label`, `tax-category-label` |

`market-tax-providers` holds the note the tax rates page shows and the hook the exemption reasons section reads; its story shows the note with no external tax service, with one market using one, and with several. `tax-category-label` also renders on the product page, which part 1 of the catalog batch captured as it renders.

**Already covered, reused here:** `resource-table`, `preferences-form`, `can`, `page-header`, `slot`, `confirm-dialog`, `row-actions`, `row-click-bridge`, `resource-layout`, `route-error-boundary`, `country-combobox`, `country-state-fields`, `resource-multi-autocomplete`, `configure-integration-sheet`, `setup-guide-link`, `settings-list-card`, `stock-location-scope-field`, and the primitives from earlier batches, including `sheet`, `dialog`, `select`, `switch`, `radio-group`, `tabs`, `tooltip`, `input-group`, `data-table`, `badge`, `empty` and `pagination`.

## 4. Delivery

- **One backend pull request,** if the owner agrees (§7): stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index, and LIQ-009's Storybook column. It builds on `main`.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as the setup batch ran. The roles in §2.2, and the payment methods, tax categories, rates, profiles, zones, methods and package types each state needs, are added through the Admin API on that server's database only.
- **Providers:** Spree's test gateway and the delivery rate providers built into Spree. No real provider account is used and no provider is called.
- **Secrets:** a payment method's secret settings are masked in every screenshot and replaced in every record; stories use invented values that do not look like a key.
- **Emails:** none. These screens send no email.

**Size, estimated from the setup batch:** about 120 stories and 240 reference images, and about 110 running-screen captures with their computed styles. The setup batch came to 150 stories and 122 captures for 27 components; the shipping cards here are fewer but have more states each.

## 5. Acceptance criteria

The setup batch's criteria applied to this batch, with criterion 14 covering a payment provider's secrets, and criterion 15 changed from what setup provisions to who checks each setting's effect. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components and browser tests, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-01's payment method and taxes tasks are mapped to their screens, and the browser tests covering these screens pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the CI run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | Recorded as for earlier batches, until D5 decides how acceptance is recorded |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. For this batch: the Admin API controller specs for payment methods, tax categories, tax rates, tax providers, delivery profiles and their origin groups, delivery zones, delivery methods and their rules, and package types; the matching integration specs; the payment method, gateway, tax category, tax rate, delivery profile, zone, method, rule, origin group, rate, rate provider and package type model specs |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings, including ISO-6, which concerns tax rates. No check reads or writes another store's records. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | No provider secret, key or password appears in any committed file: screenshots mask them and records replace them, checked by a search of the pull request's files before each push | The search's result in the record |
| 15 | Every setting this batch captures whose effect lies outside the dashboard is listed with the batch or step that checks it: checkout (batch 9), orders (batch 8), real providers (P4). None is claimed here | The record's hand-off section |

## 6. Flow steps

### FL-01, the two tasks the setup batch left to these screens

| Step | Browser tests |
|---|---|
| DA-HOME-02's payment method task opens DA-SET-12 | None follows this task's link: a gap, with this batch's captures |
| DA-SET-12: add a payment method | `payment-methods.spec.ts`: "creates a payment method with provider settings, keeping its secret on edit" |
| DA-HOME-02's taxes task opens the taxes layout | `getting-started.spec.ts`: "shows setup progress and links each step to where it is done", the setup batch's, which follows this link |
| DA-SET-13 and DA-SET-14: a tax category, then a rate | `tax-rates.spec.ts`: "asks for a tax category before creating a rate", "creates a rate for one country and shows it as a percentage" |
| The task shows as done on Getting Started | None: a gap. The taxes task's done state is where ISO-6 shows, so it is captured for this store only |

The rest of the batch is in no flow. Its browser tests: `payment-methods.spec.ts` ("lists payment methods", "swaps the preferences editor when the provider changes", "edits a payment method", "deletes a payment method"); `tax-categories.spec.ts` (4 tests); `tax-rates.spec.ts` ("edits a rate", "keeps a rate with three decimals exactly", "refuses a fourth decimal and a blank rate without saving", "deletes a rate after confirming"); `taxes.spec.ts`, "opens on categories and switches between the tabs"; `delivery-settings.spec.ts` (10 tests); and `package-types.spec.ts` (3 tests). `products-tax-category.spec.ts` stays with part 1 of the catalog batch, which mapped it.

## 7. Questions for the owner, and the owner's answers

1. **One pull request, or two parts?** The batch is smaller than the setup batch, which the owner kept to one pull request. Recommended: one pull request. The alternative is two: payments and taxes first, then delivery and package types.
   *The owner's answer, 2026-11-04 (decision 4 of the owner decision brief):* one implementation pull request.
2. **Does the batch wait for provider test keys?** Recommended: no. The batch runs with Spree's test gateway and its built-in rate providers, shows the Stripe and EasyPost settings only in stories from a mocked provider list, and leaves sandbox calls, G-26 and G-39 with P4, which waits for the keys. The alternative is to wait for backend sandbox keys and capture the real providers' sheets in this batch, which also needs both gems loaded on a server and keeps the batch blocked until the keys exist.
   *The owner's answer, 2026-11-04 (decision 5):* proceed with Spree's built-in test providers. Real-provider verification stays with P4, with G-26 and G-39, and the backend sandbox keys are provided when P4 is scheduled (decision 31), which does not mean they exist yet.
3. **Where is a setting's effect at checkout checked?** G-38 lists batch 7 among the batches that check where the setup batch's settings take effect, such as payment capture. That effect, like this batch's own delivery, tax and payment settings, shows only on a cart or an order. Recommended: batch 7 records where each setting is read and what Spree's specs exercise, and the check on a real cart or order moves to batch 9 for checkout and batch 8 for orders, with G-38 staying open until then. The alternative keeps it here, which needs carts and orders built through the Store API in this batch.
   *The owner's answer, 2026-11-04 (decision 6):* as recommended. Checkout effects are checked in batch 9 and order effects in batch 8; G-38 stays open until then.

## 8. Gaps known before the work starts

Recorded now so none is lost. The batch's record says which it closes.

| Gap | What would close it |
|---|---|
| Stripe and EasyPost settings on a running screen: neither gem is loaded on the browser-test server | P4, with keys and a server that loads the gems (question 2) |
| G-26: a payment provider in test mode, and the providers that need a real account | P4, as the owner deferred it |
| G-39: an exemption reason's code and a market's tax engine where a real tax engine decides | P4, with the providers' test keys |
| No browser test follows the payment method task's link, or shows a task done on Getting Started | This batch's captures show the states; the gap stays for the tests |
| A delivery, tax or payment setting's effect at checkout and on orders | Batches 8 and 9 (criterion 15, question 3) |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11 |
| Tenant isolation (criterion 13), including ISO-6 | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens change settings on the browser-test server, which is local and discarded after the run, and criterion 14 keeps provider secrets out of the repository.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
