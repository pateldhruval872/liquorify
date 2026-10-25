---
title: FB-19 batch, setup, stores and settings
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-25
updated: 2026-10-25
---

# FB-19 batch: setup, stores and settings

The third backend batch organised by product area: [LIQ-006 §3](../LIQ-006-product-capability-baseline.md#3-setup-stores-and-settings), installing the platform, starting a store, and the store-wide settings that every later area builds on. It reproduces what Spree already has for first-run setup, the getting started checklist, store settings, policies, channels, custom fields, markets and reasons. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED. It is batch 3 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), which depends on part 2 of the [staff access batch](fb-19-batch-staff-access-and-shell.md), merged on 2026-10-23. It follows the batch rules of LIQ-010 0.4 and has the same shape as [batch 2](fb-19-batch-developer-and-integration-settings.md). On 2026-10-25 the owner answered the two questions in §7: one implementation pull request, and first-run setup without sample data, with the sample data option's test deferred to batch 4. The owner asked for the batch to proceed under the acceptance criteria in §5, with its acceptance pending until review. The sections below follow those answers, and the batch is built in draft pull request [#19](https://github.com/pateldhruval872/liquorify/pull/19), where it was proposed.

## 1. Outcome and summary

Every setup and store settings screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, and a step-by-step map of FL-01, installing the platform and its first store. The batch also records what first-run setup gives a new store, which is the check the [platform batch](fb-19-batch-platform.md#4-coverage-and-functional-verification-kept-apart) left to it for CAP-03-03. The map links each capability to its evidence or to a named gap.

- **Bounded:** 10 screens, 1 flow, no email, 10 browser test files and 27 new components, in one bounded pull request, as the owner answered (§7).
- **Same shape as batch 2:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **No secret is published:** the setup link's token, the publishable key the storefront sheet shows, and the passwords typed during setup are kept out of every capture and record (§5, criterion 14).
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function, where it is checked:** inside the dashboard, by Spree's browser tests and specs; what first-run setup provisions, by this batch through the Admin API (criterion 15); where a setting takes effect somewhere else, such as the storefront, checkout or orders, by the batch that owns that area (§2.3).

## 2. Scope

The batch covers LIQ-006 §3, every screen it uses in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and FL-01.

| Capability (LIQ-006 §3) | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-03-01 Stores | DA-SHELL-01, DA-SHELL-02, DA-OVL-01: covered by the staff access batch, mapped here and not captured again | None | None |
| CAP-03-02 First-run setup | DA-SETUP-01 | FL-01 | `first-run/setup.spec.ts` |
| CAP-03-03 Store provisioning | None: what setup gives the new store, read through the Admin API (criterion 15) | FL-01 | `first-run/setup.spec.ts` |
| CAP-03-04 Getting started checklist | DA-HOME-02, with its navigation entry | FL-01 | `getting-started.spec.ts` |
| CAP-03-05 Store settings | DA-SET-01, DA-SET-02 | None | `settings-index.spec.ts`; the five "general" tests of `store-settings.spec.ts` |
| CAP-03-06 Channels | DA-SET-08 | None | `channels-settings.spec.ts` |
| CAP-03-07 Markets | DA-SET-11 | None | `markets.spec.ts` |
| CAP-03-08 Languages | A market's languages (DA-SET-11) and the store's admin language (DA-SET-02) | None | The markets test with regional languages; the store test that switches the admin language |
| CAP-03-09 Store policies | DA-SET-06 | None | `policies.spec.ts` |
| CAP-03-10 Custom fields | DA-SET-09 | None | `custom-field-definitions.spec.ts` |
| CAP-03-11 Reasons | DA-SET-21, DA-SET-15 | None | `reasons.spec.ts`; the exemption reason test of `taxes.spec.ts` |
| CAP-03-12 External references | None: PASS in [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) | None | None |

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels; DA-SET-01 is also captured on a narrow screen.

| Screen | States |
|---|---|
| DA-SETUP-01 First-run setup | The form, with a country bringing its currency and language; field errors; passwords that do not match; the country list failing to load; a link with no token; a wrong token refused; its status failing to load; setup closed once an admin exists; completing; the welcome message after signing in |
| DA-HOME-02 Getting started | Progress with no task done, some done and all done; each of the six tasks, done and not done; the store address dialog its task opens; the storefront sheet, with its key hidden and shown, and no storefront address yet; the products task's import button; the navigation entry with its progress, and gone once every task is done |
| DA-SET-01 Settings index | Every card; the cards each role in §2.2 may open; the search on a narrow screen, finding something and finding nothing |
| DA-SET-02 Store | Each section: general, standards, storefront access, addresses, order numbers, payments, inventory, the pricing and inventory data sources, catalog and digital downloads; no storefront address until one is set; unsaved changes; saved; a save refused with its errors; the page failing to load |
| DA-SET-06 Policies | Listed; none; the create sheet, with an address that follows the name; the content editor and its media picker; edit; delete confirmation |
| DA-SET-08 Channels | Listed, with the default and an inactive channel; the create sheet, with a code derived from the name and then typed by hand; store settings overridden for a channel and cleared back; the default catalog picker with nothing to pick; fulfilment locations, all and chosen; order routing rules added, configured and removed; delete confirmation |
| DA-SET-09 Custom fields | Listed; none; filtered by resource and by type; the create sheet for each field type; shown on the storefront or not; edit; delete confirmation |
| DA-SET-11 Markets | Listed, with the default; the create sheet with countries, currency, languages, tax included and the tax provider; regional languages; edit; reordered by dragging; delete confirmation |
| DA-SET-21 Reasons | One card for each kind: refund, return, claim and cancellation; a kind with no reasons; add; a retired reason; a reason in use; delete confirmation |
| DA-SET-15 Tax exemption reasons | Inside the taxes layout, as it renders: listed with their codes; none; add with a code; a retired reason; delete confirmation |

### 2.2 Permission variants

Every settings screen here sits under one permission scope, `settings`: Spree's catalog puts the store, policies, channels and their routing rules, custom field definitions, markets and every kind of reason under it. The getting started page and its navigation entry need write on the store. Three roles cover them, as in batch 2:

- **Admin role:** every screen with every control.
- **A custom role with read on `settings` and write on nothing:** the same screens, with create, edit and delete controls recorded as each screen shows them, since some screens keep controls the server then refuses ([staff access work item](fb-19-batch-staff-access-and-shell.md) §7.6). The getting started entry is hidden from this role, and a direct visit to the page is recorded as it shows.
- **A role made from the order manager template, which holds no settings:** the settings entries hidden, and a direct visit to each screen recorded as it shows.

DA-SETUP-01 has no role: the person installing the platform opens it with the setup link's token, before any staff account exists. It is captured on a server with no admin, before and after setup completes.

### 2.3 Left out, and where it goes

- **Where the setup tasks lead:** the payment method (DA-SET-12) and taxes (DA-SET-13, DA-SET-14) tasks lead to batch 7's screens, products to the catalog batch's, and the support email to DA-SET-03, batch 11's. This batch captures each task and its link; doing the task is that batch's.
- **The products task's CSV import:** `import-button`, `file-upload-field` and `attachment` go to the catalog batch, with DA-SET-31 and FL-21, as batch 2 decided for imports. The button is captured here as it renders.
- **The taxes layout's own components:** `taxes-tabs` and `market-tax-providers` (CMP-DA-G-22) go to batch 7, with tax categories and rates. DA-SET-15 is captured inside that layout as it renders, and its own body is the reason section DA-SET-21 uses.
- **Email settings:** DA-SET-03 and the five "emails" tests of `store-settings.spec.ts` go to batch 11, with the email template editor (CAP-11-03).
- **`bulk-action-bar` and `store-date-picker`** (CMP-CORE-04, CMP-CORE-35): none of this batch's tables has bulk actions or a date filter, so they go to the first batch whose table does.
- **The rest of FL-01:** signing in (DA-AUTH-01) is covered by the staff access batch, and the home page (DA-HOME-01) is batch 11's.
- **Translations and the storefront's languages:** DA-PRD-06 goes to the catalog batch, and SF-OVL-04 to batch 4.
- **Where a setting takes effect outside the dashboard:** markets, languages, storefront access, policies and custom fields on the storefront in batch 4, with the consent at registration (SF-ACC-02) recorded by the accounts batch as SD-2; payment capture in batches 7 and 9; order numbers, reasons and channels' order routing on orders and returns in batch 8; the inventory and data source settings in batch 6 and P4.
- **Setup with sample data:** batch 4, as the owner answered (§7). CAP-03-03 stays PARTIAL for that path until it is verified there.

## 3. Components

The screens use 27 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the screens import at `main` `38597cd`; the batch's first step confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Primitives (CMP-DUI-P) | `combobox` (14) |
| Composed (CMP-DUI-C) | `address-block` (01), `country-flag` (12), `drag-handle` (17), `form-actions` (21), `row-click-bridge` (46), `theme-provider` (52) |
| Framework (CMP-CORE) | `address-form-dialog` (01), `country-state-fields` (07), `currency-select` (08), `locale-select` (14), `media-picker-sheet` (16), `resource-combobox` (23) |
| Framework pages (CMP-CORE-PG) | `settings-index` (02) |
| `custom-fields/` (CMP-DA-G-06) | `definition-form` |
| `reasons/` (CMP-DA-G-16) | `reason-section` |
| `setup-tasks/` (CMP-DA-G-19) | `add-products-task`, `store-address-task`, `storefront-connect-task` |
| `shipping/` (CMP-DA-G-20) | `stock-location-scope-field` |
| Admin dashboard (CMP-DA-G-24, top level) | `getting-started-nav-badge`, `media-rich-text-editor`, `order-routing-rules-section`, `settings-list-card`, `store-setup-fields`, `storefront-connect-sheet`, `tax-provider-field` |

`combobox` and `country-flag` render inside `country-combobox`, which has had stories since the pilot; they get their own here. `row-click-bridge` and `theme-provider` draw nothing of their own, so their stories show what they do, a table row that opens on click and a page in light and dark, as `can`'s did in batch 2. `theme-provider` has been reached through the sign-in page's shell since part 1, without a story until now.

**Already covered, reused here:** `resource-table`, `table-toolbar`, `preferences-form`, `can`, `page-header`, `slot`, `confirm-dialog`, `row-actions`, `search-input`, `secret-input`, `copy-to-clipboard-button`, `choice-card-picker`, `auth-shell`, `country-combobox`, `resource-layout`, `resource-name-cell`, `route-error-boundary`, and the primitives from earlier batches, including `sheet`, `dialog`, `select`, `switch`, `card`, `field`, `accordion`, `item` and `progress`.

## 4. Delivery

- **One backend pull request,** as the owner answered (§7): stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index, and LIQ-009's Storybook column. It builds on `main`.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as batch 2 ran. The roles in §2.2 and the policies, channels, custom fields, markets and reasons each state needs are added through the Admin API on that server's database only.
- **First-run setup:** captured on the first-run browser test's own server, which starts with no admin, as CI runs it. Once setup completes there, the batch reads the new store through the Admin API and compares it with what Spree's two provisioning services give it: the store resources seeded before setup, and the defaults setup builds from the chosen country (its default market, currency and language, a stock location, delivery zones and methods, a package type, pickup, and delivery prices in the store's currency).
- **Secrets:** the setup link's token never appears in a capture, a record or a log the batch keeps; the publishable key on the storefront sheet is masked in the screenshot and replaced in the records; the sheet's deploy link, which carries the key, is never followed; the passwords typed during setup are made up for the run and never recorded. Stories use invented values that do not look like a key.
- **Emails:** none. This batch's screens send no email.

**Size, estimated from batch 2:** about 110 stories and 220 reference images, and about 160 running-screen captures with their computed styles. Batch 2 came to 107 stories and 150 captures.

## 5. Acceptance criteria

Batch 2's criteria applied to this batch, with criterion 14 covering the setup token and the publishable key, and one more for what setup provisions. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components and browser tests, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-01 is mapped step by step to its screens, and the browser tests covering it pass on the batch's revision, the first-run tests included; a step no test covers is recorded as a gap | Flow map with test titles and the CI run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | Recorded as for batch 2, until D5 decides how acceptance is recorded |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. For this batch: the Admin API controller specs for the store, setup, policies, channels, order routing rules, custom field definitions, markets and the five kinds of reason; the setup and store integration specs; the setup tasks, store and provisioning specs |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings, including ISO-6, which the getting started page's tax task shows. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | No setup token, key or password appears in any committed file: screenshots mask them and records replace them, checked by a search of the pull request's files before each push | The search's result in the record |
| 15 | What first-run setup gives a new store is read through the Admin API on the first-run server and compared with Spree's two provisioning services; each default is recorded as present or as a gap | The record's provisioning section |

## 6. Flow steps

### FL-01, install the platform and its first store

| Step | Browser tests |
|---|---|
| DA-AUTH-01: the sign-in page points a fresh installation to setup | `first-run/setup.spec.ts`: "the sign-in page points a fresh installation to setup" |
| DA-SETUP-01: open the setup link | "refuses a setup link with the wrong token" |
| DA-SETUP-01: create the admin and the store, and sign in | "creates the admin account, sets up the store and signs the merchant in" |
| DA-SETUP-01: setup closes behind the new admin | "closes setup once an admin exists", "the new admin signs in with the account created during setup" |
| What the new store was given | None: criterion 15 |
| DA-HOME-01: the home page | Batch 11 |
| DA-HOME-02: the six tasks, each linked to where it is done | `getting-started.spec.ts`: "shows setup progress and links each step to where it is done", which follows the taxes task's link only |
| The store address task | None drives its dialog: a gap, with this batch's captures |
| The storefront task, FL-19's first step | `store-settings.spec.ts`: "shows no storefront address until one is set", which opens the storefront sheet |
| The payment method, products, support email and taxes tasks | Their own batches' screens (§2.3) |

The rest of LIQ-006 §3 is in no flow. Its browser tests: `settings-index.spec.ts` ("each card opens its settings page", "searches settings on a narrow screen"); `store-settings.spec.ts` ("loads the store settings page", "renames the store and persists across reload", "setting the store admin language switches the dashboard UI", "saves standards, storefront access, order numbers and payments, and they survive a reload"); `policies.spec.ts` (3 tests); `channels-settings.spec.ts` (8); `custom-field-definitions.spec.ts` (6, two of which finish on a category and a customer); `markets.spec.ts` (5); `reasons.spec.ts` (4); and `taxes.spec.ts`, "adds a tax exemption reason with its code".

## 7. Questions for the owner, and the owner's answers

1. **One pull request, or two parts?** The batch is about the size of batch 2, which the owner kept to one pull request. Recommended: one pull request. The alternative is two: FL-01 first (first-run setup, getting started, the settings index and the store), then the store's other settings (policies, channels, custom fields, markets and reasons).
   *The owner's answer, 2026-10-25:* one implementation pull request.
2. **Does first-run setup run with sample data here?** Setup can load Spree's sample catalog, which downloads product images over the network for several minutes. Recommended: no. This batch runs setup without it, and the sample data is loaded and checked by the first batch that needs a catalog (batch 4 depends on sample catalog data), so CAP-03-03 stays PARTIAL for that part until then. The alternative is a second setup run with sample data in this batch.
   *The owner's answer, 2026-10-25:* first-run setup runs without sample data. Testing the "load sample data" option is deferred explicitly to batch 4, and CAP-03-03 stays PARTIAL for that path until it is verified.

## 8. Gaps known before the work starts

Recorded now so none is lost. The batch's record says which it closes.

| Gap | What would close it |
|---|---|
| What first-run setup provisions, seen only through Spree's specs and the first-run browser test | Criterion 15, in this batch |
| Setup's sample data option | Batch 4, as the owner answered (§7); CAP-03-03 stays PARTIAL for it until then |
| No browser test drives the store address task's dialog, or completes a task from the getting started page; the test follows one task's link | This batch's captures show the states; the gap stays for the tests |
| A setting's effect outside the dashboard: on the storefront, in checkout, on orders and returns | The batches named in §2.3 |
| An exemption reason's code where a market's own tax engine decides exemptions: no external tax engine is connected | Batch 7 and P4, with the providers' test keys |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11 |
| Tenant isolation (criterion 13), including ISO-6 | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. Setup runs on the first-run browser test's own server and the screens change settings on the browser-test server; both are local and discarded after the run, and criterion 14 keeps the setup token and keys out of the repository.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
