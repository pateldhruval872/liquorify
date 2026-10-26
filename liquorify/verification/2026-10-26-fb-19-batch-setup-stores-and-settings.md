---
title: FB-19 batch, setup, stores and settings
record: verification
work_item: FB-19
date: 2026-10-26
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens after five corrections to the stories, what first-run setup gives a new store, and Spree's own specs for the batch's endpoints and services, 379 examples with no failures. Every state the work item lists is captured on the running dashboard but one, a routing rule with settings of its own, which none of Spree's three rule kinds has (G-35); one listed state, a policy's address following its name as it is typed, is not how Spree works and is recorded as a correction (§6). 25 states were reached by answering a request in the browser, and say so; one of them, the store's refused save, shows an error the batch wrote. First-run setup ran without sample data, as the owner answered, and the new store had all 24 defaults Spree's two provisioning services give it (§3.4). Coverage and functional verification are recorded apart (§2): CAP-03-03 stays PARTIAL for setup with sample data, deferred to batch 4, and the capabilities whose settings take effect outside the dashboard are PARTIAL until the batches that own those areas check them. The interface shows 14 behaviours the work item did not expect, recorded as Spree's and not changed (§5). No setup token, key or password is in any committed file. Tenant isolation is NOT_RUN. The CI runs at the batch's revision are recorded in §8. The owner's acceptance is PENDING.
---

# FB-19 batch, setup, stores and settings

**Claim.** The [setup, stores and settings batch](../work-items/fb-19-batch-setup-stores-and-settings.md) reproduces what Spree already has for first-run setup, the getting started checklist, store settings, policies, channels, custom fields, markets and reasons. It gives the 27 components those screens use 150 Storybook stories, with light and dark reference images. It captures the eleven screens on Spree's running dashboard in each listed state and for each role, runs first-run setup on its own server and reads what the new store was given, compares 29 cases with their stories, and runs Spree's own specs for the endpoints and services the screens rely on. It follows the owner's answers of 2026-10-25: one implementation pull request, and first-run setup without sample data, with the sample data option's test deferred to batch 4.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | Draft pull request [#19](https://github.com/pateldhruval872/liquorify/pull/19), branch `claude/fb-19-batch-3-setup-proposal`, where the batch was proposed. `881a619` brought `main` at `afd97cd` into the branch. The batch's revision is the commit that adds this record, with the stories, reference images, fixtures, mocks, scripts, evidence and records; §8 names it with its CI runs |
| Spree's code: the dashboard, its packages, the SDKs and the gems | Identical to `main` at `afd97cd`. The branch changes none of it: `git diff afd97cd HEAD` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk` and `spree/` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at that code, in the pinned Playwright 1.64.1 image. First-run setup ran on the first-run browser test's own server, which starts with no admin, with the dashboard served on its port. Captures are 1280 by 960 pixels, and 390 by 844 for the settings page's three phone states; comparisons are 1280 by 800, 1280 by 2400 for the two cases taller than the window, and 390 by 844 for the phone case. The capture and comparison notes name `881a619`, the commit the scripts ran from, which has the same Spree code |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-setup-stores-and-settings.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components and browser tests | PASS: the map in §2 has CAP-03-01 to CAP-03-12, the eleven screens, FL-01 step by step, the `settings` scope, the 27 components and Spree's 40 browser test titles, each with its evidence or a named gap |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed | PASS: 27 new components, 150 stories, 300 reference images, each looked at in both modes (§1, [image review list](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md)). The screens use the 27 the work item named. The reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard in each state §2.1 lists | PASS for every listed state but one. 109 states of the eleven screens are captured, in 122 captures with the role variants, light and dark. A routing rule configured cannot be shown: none of Spree's rule kinds has a setting (G-35). A policy's address does not follow its name as it is typed; Spree derives it on save (§6). 25 states were reached by answering a request in the browser (§2.1, G-34) |
| 4 | Each permission variant is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every settings screen and Getting Started; a role with read on `settings` and write on nothing on every screen, the store page and Getting Started by direct visit; a role from the order manager template on a direct visit to each. First-run setup has no role and is captured as the installer sees it |
| 5 | FL-01 is mapped step by step, and the browser tests covering it pass on the batch's revision, the first-run tests included; a step no test covers is a gap | PASS for the mapping (§2.2): all 40 of Spree's browser test titles the work item names exist, in ten files. Whether they pass at the batch's revision is in §8. The steps no test covers are gaps: what the new store was given is criterion 15's (§3.4); the store address task's dialog, and completing any task from the page (G-37); the tasks' own work is their batches' |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story, its providers or its mocks | PASS, as a diagnostic: 29 cases after five corrections to the stories (§4). 23 show no style difference in either theme, and the other 6 are explained. The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is a coverage gap, with the check made instead; a state reached by answering a request says so | PASS: 121 of the 150 stories were not compared by the script; 51 of them show a state seen in a running-screen capture, and 70 were checked against their source only (G-33, image review list). Every capture whose state was reached in the browser says how in its note, and claims nothing about the server (§2.1) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | See §8 |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, its progress tables and gap register, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | PENDING the owner's review. Recorded as for batch 2 while D5 is open |
| 12 | Backend authorization is recorded apart from criterion 4, from Spree's own specs at the batch's revision | PASS for what Spree's specs exercise: 379 examples in 18 files, no failures (§3.2). What no spec exercises, such as each role's requests in §3.1, is NOT_RUN and joins G-11 (G-40) |
| 13 | Tenant isolation is NOT_RUN, with links to the open isolation findings, including ISO-6 | NOT_RUN (§3.3). No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | No setup token, key or password appears in any committed file | PASS: the search of every text file the pull request adds or changes found none, and the storefront sheet's address and key are painted out in every capture and comparison that shows them (§10) |
| 15 | What first-run setup gives a new store is read through the Admin API and compared with Spree's two provisioning services | PASS: all 24 defaults present for a store set up for Poland in English, without sample data (§3.4). Setup with sample data is batch 4's, and CAP-03-03 stays PARTIAL for it |

## 1. What was built

**Stories, 150, for the 27 new components of the batch.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md) names each one. Stories use invented values, and the storefront sheet's key is drawn as a plain sample that does not look like one.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `combobox` (CMP-DUI-P-14) | Placeholder, Selected, Invalid, Disabled, Open, Filtered, Nothing found, Search field, Chips, Chips open |
| Composed | `address-block` (CMP-DUI-C-01) | Business, Person, Not provided |
| | `country-flag` (CMP-DUI-C-12) | Default, Square, Larger |
| | `drag-handle` (CMP-DUI-C-17) | Default, Focus visible |
| | `form-actions` (CMP-DUI-C-21) | Unchanged, Changed, Saving |
| | `row-click-bridge` (CMP-DUI-C-46) | Rows, Row opened |
| | `theme-provider` (CMP-DUI-C-52) | Chosen, Following the system |
| Framework | `address-form-dialog` (CMP-CORE-01) | No address yet, Address given, Required, Region as text, Person, with label and defaults, Refused |
| | `country-state-fields` (CMP-CORE-07) | Placeholder, Selected, Invalid, Disabled, Open, Nothing found |
| | `currency-select` (CMP-CORE-08) | Store default, Selected, Open, Any currency, searched, Nothing found, Invalid, Disabled, Small |
| | `locale-select` (CMP-CORE-14) | Selected, Placeholder, Open, Invalid, Disabled, Several, Several, open, Several, none chosen |
| | `media-picker-sheet` (CMP-CORE-16) | Library, Two picked, Searched, Nothing matches, Empty library, Loading, One file, with upload |
| | `resource-combobox` (CMP-CORE-23) | Nothing chosen, Chosen, Open, Searched, Nothing found, More results, and add, Disabled |
| Framework pages | `settings-index` (CMP-CORE-PG-02) | Every card, Settings viewer, Order manager, On a phone, On a phone, searched, On a phone, nothing found |
| `custom-fields/` (CMP-DA-G-06) | `definition-form` | New, Required, Applies to, open, Field types, open, Editing long text, shown on the storefront, Editing a number, sortable, Editing rich text, For a known record |
| `reasons/` (CMP-DA-G-16) | `reason-section` | Return reasons, Claim reasons, Refund reasons, Cancellation reasons, None, Loading, Failed, Add, Name required, Edit, Delete confirmation, Settings viewer, Tax exemption reasons, Tax exemption, code typed, Tax exemption, engine codes |
| `setup-tasks/` (CMP-DA-G-19) | `add-products-task` | Not done, Done |
| | `store-address-task` | No address yet, Address given, Loading, No location, Failed, Dialog open |
| | `storefront-connect-task` | Not done, Done, Sheet opened, Back from deploying |
| `shipping/` (CMP-DA-G-20) | `stock-location-scope-field` | All locations, Some chosen, None chosen yet, No locations |
| Admin dashboard, top level (CMP-DA-G-24) | `getting-started-nav-badge` | Some done, None done, All done |
| | `media-rich-text-editor` | Empty, Written, Picking an image, Library loading, Image placed |
| | `order-routing-rules-section` | Rules, None, Loading, Adding a rule, Rule settings, Delete confirmation, Settings viewer |
| | `settings-list-card` | Rows, Empty, Loading, Failed, Without action |
| | `store-setup-fields` | Country suggested, Country list, Country chosen, Languages, Currencies, Required, Country list loading |
| | `storefront-connect-sheet` | Key hidden, Key shown, Address already saved, Key loading, Key failed, Not an address, Saved |
| | `tax-provider-field` | Store default, Spree's rates only, Engine chosen, Engine not connected, open |

**Already covered, reused by these screens:** `resource-table`, `table-toolbar`, `preferences-form`, `can`, `page-header`, `slot`, `confirm-dialog`, `row-actions`, `search-input`, `copy-to-clipboard-button`, `auth-shell`, `country-combobox`, `resource-layout`, `resource-name-cell`, `route-error-boundary`, and the primitives from earlier batches, among them `sheet`, `dialog`, `select`, `switch`, `card`, `field`, `accordion`, `item` and `progress`.

**`row-click-bridge` and `theme-provider` draw nothing of their own.** The bridge's stories show a table whose rows open on click, as the policies, channels, custom fields and markets tables do; the theme provider's show the same page in the theme chosen and following the system. **Rule settings** shows a rule kind an extension could register, with a setting of its own, because none of Spree's three kinds has one (G-35).

**Providers and mocks.** Fixtures for the store and its setup tasks, policies, channels and catalogs, stock locations, routing rules and their kinds, custom field definitions, markets, tax engines, every kind of reason, setup's countries and a media library of four invented pictures, each record checked against the Admin API's own schemas in `fixtures.test.ts`; handlers for each list, sheet and setup request, with variants that hold a request open, refuse it with a message Spree sends, or answer with nothing. A `withStore` decorator places a component inside the dashboard's store, as the store layout does, so it reads the store's currencies, languages, default country and setup tasks.

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `settings.ts` (new) adds what the captures need to the browser-test database through the Admin API only: an inactive sales channel, five custom field definitions of several types and owners, and a retired return reason and tax exemption reason.
- `staff.ts` adds the settings viewer, a role with read on `settings` and write on nothing, and a teammate for it.
- `screens.spec.ts` gains the batch's captures of the ten settings and getting started screens. Each paints out the storefront sheet's address and key before the screenshot, and blocks and records any request that would leave the local servers.
- `setup.spec.ts` (new) captures first-run setup and the sign-in page's pointer to it on the first-run server, completes setup once without sample data, and then reads the new store through the Admin API into the provisioning result (§3.4). It opens the setup link without writing it down, and makes up the merchant's password for the run.
- `stack.spec.ts` gains "Spree first-run server", which starts the first-run browser test's own server exactly as Spree's first-run test does, and keeps it running until the scripts are done. Setup closes for good once it completes, so each run of `setup.spec.ts` needs the server started afresh.
- `compare.spec.ts` gains the batch's 29 cases, with the corrections in §4.3.

## 2. The batch map, completed

The map from the [work item §2](../work-items/fb-19-batch-setup-stores-and-settings.md#2-scope), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/README.md). The batch's screens send no email.

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen; it does not show that the screen works. **Functionally verified** is whether each behaviour was shown to work at the batch's revision, by a browser test, a spec or the batch's own provisioning check (§2.2, §3.4).

| Capability | Screens | Flows | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-03-01 Stores | DA-SHELL-01, DA-SHELL-02, DA-OVL-01 | None | Any staff role | Covered by the staff access batch | The staff access batch's captures, mapped and not captured again | PASS, in the staff access batch | PARTIAL: the shell and the store switcher pass in the staff access batch's and P6's browser tests; whether a store's data stays in that store is tenant isolation, NOT_RUN (§3.3) |
| CAP-03-02 First-run setup | DA-SETUP-01, and DA-AUTH-01's pointer to it | FL-01 | None: the setup link's token | `store-setup-fields`, `combobox`, `country-flag`, with `auth-shell` and `theme-provider` | 15 captures; 2 cases compared; 5 browser test titles; Spree's setup specs (§3.2) | PASS: every listed state captured, four of them reached in the browser | PASS in Spree's browser tests and specs (§8): the pointer, a wrong token refused, setup completing and signing in, and setup closing behind the new admin. Setup with sample data is batch 4's |
| CAP-03-03 Store provisioning | None | FL-01 | None | None | The provisioning result, 24 defaults (§3.4); Spree's provisioning specs | PASS for setup without sample data | PARTIAL: all 24 defaults present after setup without sample data (§3.4). Setup with sample data is deferred to batch 4 at the owner's answer (G-36) |
| CAP-03-04 Getting started checklist | DA-HOME-02, with its navigation entry | FL-01 | Write on the store | The `setup-tasks/` group, `storefront-connect-sheet`, `getting-started-nav-badge`, `address-form-dialog`, `country-state-fields`, `address-block` | 21 captures; 7 cases compared; 2 browser test titles; Spree's setup tasks spec | PASS: every listed state captured, fourteen of them reached in the browser | PARTIAL: progress and the taxes task's link pass in Spree's browser test, and the storefront sheet's empty address in another. No test drives the address dialog or completes a task from the page (G-37); each task's own work is its batch's |
| CAP-03-05 Store settings | DA-SET-01, DA-SET-02 | None | `settings` | `settings-index`, `form-actions`, `combobox` | 18 captures; 3 cases compared; 7 browser test titles; Spree's store specs | PASS: every listed state captured, two of them reached in the browser | PARTIAL: every card opening its page, the narrow screen's search, renaming the store, switching the admin language and saving standards, storefront access, order numbers and payments pass in Spree's browser tests. Where each setting takes effect, on the storefront, in checkout or on orders, is other batches' (G-38) |
| CAP-03-06 Channels | DA-SET-08 | None | `settings` | `order-routing-rules-section`, `stock-location-scope-field`, `resource-combobox`, `drag-handle`, `row-click-bridge` | 16 captures; 4 cases compared; 8 browser test titles; Spree's channel and routing rule specs | PASS for every listed state but a rule configured (G-35) | PARTIAL: listing, creating with a derived and a typed code, editing, overriding store settings and clearing them, the catalog picker's name, managing routing rules and deleting pass in Spree's browser tests. How a channel routes orders is batch 8's (G-38) |
| CAP-03-07 Markets | DA-SET-11 | None | `settings` | `tax-provider-field`, `currency-select`, `locale-select`, `combobox`, `drag-handle`, `row-click-bridge` | 12 captures; 6 cases compared; 5 browser test titles; Spree's market specs | PASS: every listed state captured | PARTIAL: listing, creating, regional languages, editing and deleting pass in Spree's browser tests. Markets on the storefront are batch 4's (G-38), and a tax engine of a market's own batch 7's and P4's (G-39) |
| CAP-03-08 Languages | A market's languages (DA-SET-11) and the admin language (DA-SET-02) | None | `settings` | `locale-select` | The regional languages and store captures; 2 cases compared; 2 browser test titles | PASS | PARTIAL: regional languages on a market and the admin language switching the dashboard pass in Spree's browser tests. The storefront's languages are batch 4's (G-38) |
| CAP-03-09 Store policies | DA-SET-06 | None | `settings` | `media-rich-text-editor`, `media-picker-sheet`, `row-click-bridge` | 10 captures; 2 cases compared; 3 browser test titles; Spree's policy specs | PASS: every listed state captured, one reached in the browser; the address follows the name on save, not while typing (§6) | PARTIAL, with a failing part: creating, writing content and deleting pass in Spree's browser tests. Policies on the storefront are batch 4's (G-38), and the consent at registration FAILs, as the accounts batch recorded (SD-2) |
| CAP-03-10 Custom fields | DA-SET-09 | None | `settings` | `definition-form`, `row-click-bridge` | 15 captures; 1 case compared; 6 browser test titles; Spree's definition specs | PASS: every listed state captured, one reached in the browser | PARTIAL: listing, creating, editing and deleting pass in Spree's browser tests, and a definition is offered and kept on a category and on a customer. A field shown on the storefront is batch 4's (G-38) |
| CAP-03-11 Reasons | DA-SET-21, DA-SET-15 | None | `settings` | `reason-section`, `settings-list-card` | 15 captures; 4 cases compared; 5 browser test titles; Spree's specs for the five kinds | PASS: every listed state captured, three of them reached in the browser | PARTIAL: one card per kind, adding to one list, retiring, deleting after confirming and adding an exemption reason with its code pass in Spree's browser tests. Reasons used on orders and returns are batch 8's (G-38); an exemption code with a tax engine is batch 7's and P4's (G-39) |
| CAP-03-12 External references | None | None | None | None | [P1](2026-10-22-fb-19-platform-p1-checks.md) | PASS in P1 | PASS in P1 |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-<theme>.webp` in the evidence folder, in light and dark, with a JSON note that records the path, the variant's role, how the state was reached, what was painted out and any request blocked because it would have left the local servers. "Answered" means the browser answered a request itself instead of the server, as the note says; "held" means it held a request open.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| DA-AUTH-01 Sign in, FL-01's first step | A fresh installation pointed to setup; the ordinary sign-in once setup is done (installer) | None; not in §2.1, captured for FL-01 |
| DA-SETUP-01 First-run setup | The form; the country list open; a country chosen, bringing its currency and language; field errors; passwords that do not match; the country list failing to load (answered with a server error); a link with no token; a wrong token refused; its status failing to load (answered with a server error); its status refused as too many attempts (answered so); completing (held); setup closed once an admin exists; the welcome message after signing in, on Getting Started (installer) | None |
| DA-HOME-02 Getting started | Progress with some tasks done, as the browser-test store stands, with the navigation entry and its progress; none done and all done, with the entry gone (answered); each of the six tasks done and not done (answered), the products task with its import button; the store address dialog its task opens; the storefront sheet with its key hidden, and no storefront address yet; with its key shown; an address it refuses (B7); a direct visit (settings viewer, order manager) | None. The user menu without View store, while no storefront address is set, is checked by Spree's test "shows no storefront address until one is set", not captured |
| DA-SET-01 Settings index | Every card (admin); the cards each role may open (settings viewer, order manager); on a phone; its search finding something; and finding nothing | None |
| DA-SET-02 Store | General, with standards and formats (admin, settings viewer); storefront access; addresses and order numbers; payments; inventory and the pricing and inventory data sources; catalog and digital downloads; unsaved changes; saved; a save refused with its errors (answered with an error the batch wrote, see below); the page failing to load (answered with a server error; B1); a direct visit (order manager) | None. The store page has no storefront address of its own; it is set from the storefront sheet (DA-HOME-02) |
| DA-SET-06 Policies | Listed (admin, settings viewer); none (answered with no records); the create sheet; a name typed, the address's placeholder unchanged (§6); the content editor's media picker; edit (admin, settings viewer); delete confirmation; a direct visit (order manager) | An address that follows the name as it is typed: Spree derives it on save (§6) |
| DA-SET-08 Channels | Listed, with the default and an inactive channel (admin, settings viewer); the create sheet; a code derived from the name; a code typed by hand; store settings overridden for a channel; and cleared back; the default catalog picker with nothing to pick; fulfilment locations, Selected locations chosen; routing rules (admin, settings viewer); a rule added once one is removed (B14), with the kinds to add; a rule's delete confirmation; delete confirmation; a direct visit (order manager) | A rule configured: none of Spree's three kinds has a setting (G-35). Fulfilment locations, all of them, is the comparison's screen side (§4.1) |
| DA-SET-09 Custom fields | Listed (admin, settings viewer); none (answered with no records); filtered by resource; filtered by type; the create sheet for each of the six field types; shown on the storefront; edit; delete confirmation; a direct visit (order manager) | None |
| DA-SET-11 Markets | Listed, with the default (admin, settings viewer); the create sheet; filled with countries, currency and languages; the same, scrolled to tax included and the tax engine; the tax engine list open, with Spree's own rates; regional languages; edit (admin, settings viewer); reordered by dragging; delete confirmation; a direct visit (order manager) | None |
| DA-SET-21 Reasons | Return reasons with a retired one (admin, settings viewer); claim and refund reasons; cancellation reasons; a kind with no reasons (answered with no records); add; a reason in use (answered marking one in use); delete confirmation; a direct visit (order manager) | None |
| DA-SET-15 Tax exemption reasons | Inside the taxes layout: listed with their codes and a retired one (admin, settings viewer); none (answered with no records); add with a code; delete confirmation; a direct visit (order manager) | None |

**25 states reached in the browser** (G-34): DA-SETUP-01 completing, the country list failing, its status failing and its status refused as too many attempts; DA-HOME-02 none done and all done, and each of the twelve task states; DA-SET-02 the save refused and the page failing to load; DA-SET-06, DA-SET-09 and DA-SET-15 none; DA-SET-21 a kind with no reasons and a reason in use. Each shows how the screen renders that answer, not that the server would send it. The setup tasks' states were answered because the browser-test store's tasks cannot all be done or undone without the other batches' screens; the reason in use, because no browser-test record uses one.

**One answer carries words the batch wrote.** The store's refused save shows "Name is too long (maximum is 100 characters)", in the shape Spree's validation errors take. Spree's store has no such limit on its name. Every value the store page sends is either checked by the page first or chosen from a list the server accepts, so the batch found no way to make the server refuse a save from the page; the state shows only how the page renders a refusal. Every other answered state shows the dashboard's own words or Spree's.

**Nothing secret is shown.** The storefront sheet's Store API address and publishable key are painted out in the page before the screenshot, in each of its three captures, and its deploy link, which carries the key, was never followed. First-run setup's link carries its token: the script reads it from the file the first-run server writes and only opens it, and every capture of setup shows the page, not the address bar. The passwords typed during setup are made up for the run and kept in memory.

**No request left the local servers.** Every capture blocked and recorded any request to a host other than the local servers. None was: each of the 244 notes records an empty list.

### 2.2 Flows step by step

The browser tests are Spree's own, in `packages/dashboard/e2e/`, unchanged. All 40 titles the work item names exist, in the ten files below. The first-run tests run in their own step of the Packages workflow's first shard, and the others across its four shards (§8).

**FL-01, install the platform and its first store.**

| Step | Screen | Browser tests | Functionally verified |
|---|---|---|---|
| The sign-in page points a fresh installation to setup | DA-AUTH-01 | `first-run/setup.spec.ts`: "the sign-in page points a fresh installation to setup" | See §8 |
| Open the setup link | DA-SETUP-01 | "refuses a setup link with the wrong token" | See §8 |
| Create the admin and the store, and sign in | DA-SETUP-01 | "creates the admin account, sets up the store and signs the merchant in" | See §8. The form ticks Load sample data until it is unticked; Spree's test and this batch's script untick it |
| Setup closes behind the new admin | DA-SETUP-01 | "closes setup once an admin exists", "the new admin signs in with the account created during setup" | See §8 |
| What the new store was given | None | None | PASS by the batch's own check: all 24 defaults present (§3.4). With sample data: batch 4 (G-36) |
| The home page | DA-HOME-01 | Batch 11's | Not this batch |
| The six tasks, each linked to where it is done | DA-HOME-02 | `getting-started.spec.ts`: "shows setup progress and links each step to where it is done", which follows the taxes task's link only | See §8, for the progress and that one link |
| The store address task | DA-HOME-02 | None drives its dialog | **Gap** G-37. The batch's captures show the dialog and the task done and not done |
| The storefront task, FL-19's first step | DA-HOME-02 | `store-settings.spec.ts`: "shows no storefront address until one is set", which opens the storefront sheet | See §8. Saving an address and connecting a storefront are not driven by a test (G-37); the storefront is batch 4's |
| The payment method, products, support email and taxes tasks | DA-SET-12, DA-SET-13, DA-SET-14, the catalog, DA-SET-03 | Their own batches' | Not this batch |

The rest of LIQ-006 §3 is in no flow. Its browser tests, with what each covers:
- `settings-index.spec.ts`: "each card opens its settings page", "searches settings on a narrow screen".
- `store-settings.spec.ts`, the general tests: "loads the store settings page", "renames the store and persists across reload", "setting the store admin language switches the dashboard UI", "saves standards, storefront access, order numbers and payments, and they survive a reload", and the storefront address test above. The five emails tests are batch 11's.
- `policies.spec.ts`: "creates a policy whose address follows its name", "writes the policy content", "deletes a policy after confirming".
- `channels-settings.spec.ts`: "lists channels", "auto-derives the code from the name and lists the new channel without a reload", "stops auto-deriving once the user edits the code field", "edits an existing channel", "overrides store settings per channel and clears them back to inherit", "names the default catalog picker for assistive technology", "manages order routing rules on a channel", "deletes a non-default channel".
- `custom-field-definitions.spec.ts`: "lists custom field definitions", "creates a new definition", "edits a definition", "deletes a definition", "a definition for categories is offered on a category and keeps its value", "a definition for customers is offered on a customer and keeps its value".
- `markets.spec.ts`: "lists markets", "creates a new market", "creates a market with non-standard regional supported locales", "edits a market", "deletes a market".
- `reasons.spec.ts`: "lists the seeded vocabularies, one card per kind", "adds a reason to the list it was added from only", "retires a reason so new records stop offering it", "deletes an unused reason after confirming".
- `taxes.spec.ts`: "adds a tax exemption reason with its code". The file's other test, of the taxes layout's tabs, is batch 7's.

## 3. Permissions, isolation and provisioning

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it.

| Variant | Role's permission keys, as the role was created through the Admin API | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Settings viewer: read on `settings`, write on nothing | `read_settings` | The settings page and menu list Policies, Sales channels, Custom fields, Markets, Payment methods, Taxes, Delivery profiles, Stock locations, Returns and reasons and Allowed origins, but not Store or Emails; the store page opens on a direct visit, with Save (B2). Policies, channels and markets keep each row's menu with Edit and open sheets that can be edited and saved, with no Add button (B3). Reasons and tax exemption reasons hide Add and the row menus (B4). Custom fields hide the row menus, and a field's name does not open it (B5). A channel's routing rules show their switches disabled, drawn like enabled ones (B9). Getting Started is gone from the navigation; a direct visit shows the progress and "Failed to load" on the address task (B6) |
| Order manager template | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | No settings entry; the settings page and its menu read `No settings match ""` though nothing was searched. A direct visit to policies, channels, markets and custom fields shows each page's empty state, as if the store had none; the reasons cards read "Failed to load"; the store page shows every section with Save; the tax exemption reasons are listed (B8). Getting Started is gone from the navigation, and a direct visit shows it as for the settings viewer (B6) |
| Installer, before any staff account | None: the setup link's token | DA-SETUP-01 and DA-AUTH-01's pointer, on the first-run server |

### 3.2 What the server refuses

**Spree's own specs, at this branch, whose Spree code is `afd97cd`.** Run in this session on SQLite with Spree's API and core test apps. 379 examples in 18 files, 0 failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/backend/api-specs.json) (216 examples, seed 42597) and [core-specs.json](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/backend/core-specs.json) (163, seed 10029).

| Endpoint or service | Spec file (examples) | What the examples exercise, by caller |
|---|---|---|
| First-run setup | `setup_controller_spec.rb` (28), `setup_spec.rb` (4) | A missing, wrong or spent token, or a store with no token, answers 404 and creates nothing; once an admin exists, even a valid token answers 404; token submissions share the sign-in rate limit, and the status and country reads do not; an unknown country, currency or language is refused and leaves the token usable; sample data is queued only when asked for, and into the new store only |
| The store | `store_controller_spec.rb` (51), `store_spec.rb` (4) | A secret key needs the settings scope to read the store and `write_settings` to change it, and is told which scope it lacks; a staffer without any settings permission still reads the store but cannot update it; no credentials answers 401; a negative low stock threshold, a commission tax rate above 1, a colour that is not a colour and an unknown provider policy are refused |
| Policies | `policies_controller_spec.rb` (13) | Another store's policy is not listed, not found and not updated |
| Channels | `channels_controller_spec.rb` (28) | Another store's channel, catalog or location answers 404, and another store's product is not published; the default channel cannot be deleted |
| Order routing rules | `order_routing_rules_controller_spec.rb` (13) | Another store's channel answers 404 for its rules; a read-only secret key may list the rule kinds but not change a rule; a rule's kind cannot be switched |
| Custom field definitions | `custom_field_definitions_controller_spec.rb` (26) | A secret key with no relevant scope is refused with 403, and one with `read_settings` may list but not write; another store's definition is not listed, found, updated or deleted |
| Markets | `markets_controller_spec.rb` (8) | Another store's market answers 404; a tax engine the installation does not have is refused |
| Return, claim and refund reasons | `return_reasons_controller_spec.rb` (11), `claim_reasons_controller_spec.rb` (4), `refund_reasons_controller_spec.rb` (7) | Another store's reasons are not listed or found; a reason in use cannot be deleted, and says so |
| Cancellation reasons | `order_cancellation_reasons_controller_spec.rb` (7) | Staff authorized by permission keys alone list and create them; another store's are not exposed; one in use cannot be deleted |
| Tax exemption reasons | `tax_exemption_reasons_controller_spec.rb` (12) | A key or a staffer that manages customers but not settings reads the reasons but cannot change or create them; another store's are not listed; one a certificate records cannot be deleted |
| The store model | `store_spec.rb` (121), core | Codes, defaults and settings validation; another store's default location is ignored |
| Provisioning | `provision_defaults_spec.rb` (30), `store_resources_spec.rb` (4) | What setup builds from the chosen country, including a box measured in inches for an imperial store; the store resources seeded for one store, leaving every other store untouched |
| Setup tasks | `setup_tasks_spec.rb` (8) | The six default tasks, in order, each judged against the given store |

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends the requests §3.1's roles could make as a staff JWT: the settings viewer saving the store, a policy, a channel or a market from the sheets it is shown (B2, B3); the order manager saving the store page it is shown (B8). Spree's spec says a staffer without settings permission cannot update the store, which suggests the server refuses both store saves, but the batch did not send them. They join G-11 (G-40).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open. ISO-6 concerns the taxes the getting started page's tax task leads to.

Some of Spree's specs above touch store boundaries: another store's policies, channels, catalogs, locations, products, routing rules, custom field definitions, markets and reasons are not listed, found or changed, and the store resources seeded for one store leave every other store untouched. They are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the batch claims nothing about isolation from them. No new isolation defect was found; none was looked for beyond these specs.

### 3.4 What first-run setup gives a new store

Criterion 15. `setup.spec.ts` completed setup once on the first-run server, without sample data, as a merchant in Poland who keeps the dashboard in English: store name "Fidelity First Run", country Poland, language English, the currency setup suggests for Poland, PLN. It then signed in as the new admin and read the new store through the Admin API. Each default Spree's two provisioning services give a store, `Spree::Seeds::StoreResources` before setup and `Spree::Stores::ProvisionDefaults` from the merchant's answers, is one check, with what was found. All 24 are present. The result is [first-run.json](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/provisioning/first-run.json).

| Service | Default | Found |
|---|---|---|
| ProvisionDefaults | The store's country, currency and language | Poland, PLN, English |
| | The dashboard's language for the store | English, as chosen |
| | The default market | "Poland", in PLN and English, for Poland |
| | The default stock location | "Shop location", in Poland, active and open for pickup |
| | The default shipping profile | "General", with "Digital" beside it |
| | A domestic zone and an international one | "Domestic" for Poland, "International" for the other 239 countries |
| | Standard and international delivery in the store's currency | 5.00 and 20.00 PLN |
| | Store pickup | Free, in PLN, shown on the storefront |
| | Digital delivery restated in the store's currency | 0.00 PLN |
| | A default box | 12 by 9 by 4 inches, 0.5 pounds: the store is imperial (B12) |
| StoreResources | Tax categories | Default, Non-taxable |
| | Tax exemption reasons | Six, from Agricultural to Resale |
| | Channels | Online Store and Wholesale |
| | The admin role | Present |
| | Digital delivery | Present |
| | Store credit as a payment method | Present |
| | Product types | Default, Digital |
| | The wholesale customer group | Present |
| | Reasons | 9 return, 5 claim, 1 refund and 7 cancellation reasons |
| | The marketplace's catch-all commission rate | Present, disabled |
| | Seller requirements | Seven |
| | Publishable keys for the storefront and the wholesale channel | Two, by name and type only |
| | Saved reports | Twenty |
| | An allowed origin | One |

After setup, Getting Started showed one of its six tasks done, the support email: the store seeded before setup carries Spree's placeholder support address, which setup does not change (B13). Setup with sample data, which loads Spree's catalog over the network, was not run, as the owner answered: it is batch 4's, and CAP-03-03 stays PARTIAL for that path until it is verified there (G-36).

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/README.md). The storefront sheet's address and key are painted out on both sides.

### 4.1 Results, after the corrections

| ID | Case | Story | Running screen | Styles that differ, light and dark | Explained |
|---|---|---|---|---|---|
| CMP-CORE-PG-02 | settings-index-store-cards | Settings index: Every card | The settings page's cards, as an admin sees them | None | |
| CMP-CORE-PG-02 | settings-index-on-a-phone | Settings index: On a phone | The settings page on a phone, with its own search | None | |
| CMP-DA-G-16 | reason-section-return-reasons | Reason section: Return reasons | The return reasons card | height; 1 element in the story only | Data: the browser-test store has more return reasons, so its card is taller, and one of the story's reasons is in use, so it carries an In use badge no browser-test reason has |
| CMP-DA-G-16 | reason-section-exemption-reasons | Reason section: Tax exemption reasons | The tax exemption reasons card | height; 1 element in the story only | As above |
| CMP-DA-G-16 | reason-section-add | Reason section: Add | The add reason sheet, from the return reasons card | None | |
| CMP-DA-G-16 | reason-section-delete-confirmation | Reason section: Delete confirmation | A return reason's delete confirmation | border colours, box-shadow and height | The story's reason has a longer name, so its question wraps onto a second line; and focus modality, as in batch 2: the story's dialog opens with keyboard focus on Cancel, which shows its ring, while the screen's was opened by a click |
| CMP-DA-G-06 | definition-form-new | Definition form: New | The add custom field sheet's form | None | |
| CMP-DA-G-24 | order-routing-rules-section-rules | Order routing rules section: Rules | The Wholesale channel's routing rules | None | |
| CMP-DA-G-24 | order-routing-rules-section-delete-confirmation | Order routing rules section: Delete confirmation | A routing rule's delete confirmation | border colours and box-shadow | Focus modality, as above |
| CMP-DA-G-20 | stock-location-scope-field-all-locations | Stock location scope field: All locations | The Wholesale channel's fulfilment locations, all of them | None | |
| CMP-DA-G-24 | tax-provider-field-store-default | Tax provider field: Store default | The add market sheet's tax engine, the store's default | None | |
| CMP-CORE-08 | currency-select-store-default | Currency select: Store default | The add market sheet's currency, the store's default | None | |
| CMP-DUI-P-14 | combobox-open | Combobox: Open | The add market sheet's currency list, open | height; 594 and 316 pixels wide | Data: the screen lists every currency, the story a few, so its list is shorter; the screen's list is as wide as the sheet's field, the story's as its 316-pixel frame |
| CMP-CORE-14 | locale-select-selected | Locale select: Selected | The add market sheet's default language | None | |
| CMP-CORE-14 | locale-select-none-chosen | Locale select: Several, none chosen | The add market sheet's supported languages, none chosen | None | |
| CMP-DUI-C-12 | country-flag-beside-a-name | Country flag: Default | The flag beside the setup form's country | None | |
| CMP-DUI-C-17 | drag-handle-default | Drag handle: Default | A market's drag handle on the markets page | None | |
| CMP-DUI-C-21 | form-actions-unchanged | Form actions: Unchanged | The store page's Save button, nothing changed | None | |
| CMP-CORE-23 | resource-combobox-nothing-found | Resource combobox: Nothing found | The Wholesale channel's default catalog picker, with no catalog to find | None | The browser-test store has no catalog, so the picker finds nothing |
| CMP-DA-G-24 | media-rich-text-editor-empty | Media rich text editor: Empty | The add policy sheet's content editor, empty | None | |
| CMP-CORE-16 | media-picker-sheet-one-file-with-upload | Media picker sheet: One file, with upload | The media library opened from a policy's image button | None; 1 element on the screen only, 6 in the story only | The story is the picker as a policy's editor opens it: one image, an upload button and no footer. The browser-test store's library is empty, so the screen shows its empty message where the story shows its files |
| CMP-CORE-01 | address-form-dialog-no-address-yet | Address form dialog: No address yet | The shipping address sheet, opened from Getting Started | None | |
| CMP-CORE-07 | country-state-fields-placeholder | Country state fields: Placeholder | The shipping address sheet's state, nothing chosen | None | |
| CMP-DA-G-19 | store-address-task-no-address-yet | Store address task: No address yet | The shipping address task, no address yet | None | |
| CMP-DA-G-19 | add-products-task-done | Add products task: Done | The add products task, done | None | |
| CMP-DA-G-19 | storefront-connect-task-not-done | Storefront connect task: Not done | The storefront task, not done | None | |
| CMP-DA-G-24 | storefront-connect-sheet-key-hidden | Storefront connect sheet: Key hidden | The connect storefront sheet, its key hidden; the address and key painted out on both sides | None | |
| CMP-DA-G-24 | getting-started-nav-badge-some-done | Getting started nav badge: Some done | Getting Started's badge in the navigation, seen from the orders page | None | |
| CMP-DA-G-24 | store-setup-fields-suggested | Store setup fields: Country suggested | The setup form's country, the United States suggested | None | |

### 4.2 Corrections made to the stories

Each was a defect in a story or its fixtures, fixed there; no Spree component changed. The comparison was run again after them, and all 29 cases passed. 21 stories' reference images were made again, 42 images in all.

| # | Story | Was | Now, as on the screen |
|---|---|---|---|
| 1 | Order routing rules section (seven stories) | 480 pixels wide at the page's 14-pixel text | 566 pixels and the sheet's 13-pixel text, as the channel's sheet gives it |
| 2 | Tax provider field (four stories) | 416 pixels wide at the page's text | 566 pixels and 13-pixel text, as the market's sheet gives it |
| 3 | Stock location scope field (four stories) | The page's text | The sheet's 13-pixel text; its 384-pixel width was right |
| 4 | Media rich text editor (five stories) | 566 pixels wide at the page's text | 826 pixels and 13-pixel text, as the policy's wider sheet gives it |
| 5 | Country flag: Default | Canada's flag | The United States', the flag the setup form shows beside the country it suggests |

**A note on batch 2's record.** A sheet's text is the dashboard's `text-sm`, 13 pixels; the page's is 14. Batch 2's record says its sheet corrections moved stories to "the sheet's 14-pixel text", but those stories use the same `text-sm` class as this batch's, so their text is 13 pixels as on the screen. Only the record's words were wrong; its images are right.

### 4.3 Corrections to the comparison script

- **Getting Started's badge is compared from the orders page.** On Getting Started itself the navigation entry is the current page and drawn as such; the story shows it from elsewhere.
- **The country flag is compared on the setup form,** beside the country it suggests, instead of a chip in the market sheet; the case opens the first-run server's setup page without completing it.
- **The media picker is compared with the story of the picker a policy opens** (One file, with upload) instead of Empty library: the mode the editor opens it in, with its upload button and no footer, matters more than the browser-test store's empty library.
- **Two cases use a window 2400 pixels tall,** the settings cards and the return reasons card, which are taller than the window, and the phone case a 390 by 844 window.

## 5. Spree's behaviour found, recorded and not changed

Each is how Spree works at `afd97cd`. The batch reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | When the store's request fails, the store page keeps its loading placeholder for good: it checks for a missing store before it checks for an error, so the error message is never reached. The emails and marketplace settings pages read their store the same way | DA-SET-02 request-failed; read in `settings/store.tsx` line 149, `settings/emails/index.tsx` line 111 and `settings/marketplace.tsx` line 71 |
| B2 | The settings viewer, who may read settings, sees no Store or Emails card or menu entry, yet the store page opens on a direct visit, every section filled, with Save | DA-SET-01 cards and DA-SET-02 general, settings viewer |
| B3 | For the same role, policies, channels and markets keep each row's menu with Edit, and open sheets that can be edited, with Save; only their Add buttons are hidden | DA-SET-06, DA-SET-08 and DA-SET-11 listed and edit, settings viewer |
| B4 | For the same role, reasons and tax exemption reasons hide Add and every row menu | DA-SET-21 and DA-SET-15 listed, settings viewer; Reason section: Settings viewer |
| B5 | For the same role, custom fields hide every row menu, and a field's name does not open it: unlike B3, nothing can be edited | DA-SET-09 listed, settings viewer; read in `custom-field-definitions.tsx` |
| B6 | Getting Started is gone from the navigation of the settings viewer and the order manager, but a direct visit shows the store's progress, three of six, and "Failed to load" on the address task | DA-HOME-02 direct-visit, both roles |
| B7 | The storefront sheet refuses an address that is not one with a message drawn beneath the sheet's layer, so nothing shows; the sheet stays as it was | DA-HOME-02 storefront-sheet-not-an-address; Storefront connect sheet: Not an address |
| B8 | The order manager, who holds no settings permission, sees `No settings match ""` on the settings page and menu though nothing was searched. On a direct visit, policies, channels, markets and custom fields show their empty states, as if the store had none; the reasons cards read "Failed to load"; the store page shows every section with Save; the tax exemption reasons are listed, as Spree's spec allows a role that reads customers | DA-SET-01 cards and DA-SET-* direct-visit, order manager |
| B9 | Disabled switches are drawn exactly like enabled ones, as the settings viewer's routing rules show | DA-SET-08 routing-rules, settings viewer; Order routing rules section: Settings viewer |
| B10 | A country flag's size classes change its height only: the flag picture's own width outranks them, so Larger is taller but no wider | Country flag: Square and Larger; read in `country-flag.tsx` |
| B11 | The Admin API refuses a custom field definition without a namespace, although its request schema describes `custom` as the default | The batch's seeding (`settings.ts`) |
| B12 | A store set up for Poland is imperial: its default box measures 12 by 9 by 4 inches and 0.5 pounds, because setup leaves the store's unit system at its default and asks nothing about it. Spree's spec expects an imperial store's box in inches | §3.4; read in `provision_defaults.rb` |
| B13 | Straight after setup, one of the six setup tasks is already done, the support email: the store seeded before setup carries Spree's placeholder support address, at `example.com`, and setup changes only the store's name. A merchant who does not open the task keeps that address | DA-SETUP-01 welcome; read in `seeds/stores.rb` and `setup_controller.rb` |
| B14 | Every channel holds one routing rule of each of Spree's three kinds, none with settings, so Add rule appears only once a rule is removed | DA-SET-08 routing-rules and routing-rule-add-picker |

B2 to B6 and B8 matter for Liquorify's later staff access work; whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own staff access changes (F1). B12 matters for a store that trades in metric units, and B13 for every new store. None is proposed as a defect. B1 is the nearest: a merchant who loses the connection on the store page sees it load for good, with no message and nothing to retry. Whether to track it as one is the owner's call.

## 6. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-setup-stores-and-settings.md#10-corrections-found-during-the-batch) §10, without changing the proposal's text:
- §2.1's DA-SET-06 "an address that follows the name": the sheet's address keeps a fixed placeholder while the name is typed; left blank, Spree derives the address from the name on save, as the field's help says and Spree's test "creates a policy whose address follows its name" checks.
- §2.1's DA-SET-08 "order routing rules added, configured and removed": none of Spree's three rule kinds has a setting, so no rule can be configured (G-35), and a rule can be added only once one is removed (B14).
- §2.1's DA-SET-02 "a save refused with its errors": every value the store page sends is checked by the page first or chosen from a list the server accepts, so the batch found no way to make the server refuse it; the state was reached by answering the save with an error the batch wrote (§2.1).
- §2.1's DA-SET-02 "no storefront address until one is set": the store page has no storefront address; it is set from the storefront sheet on Getting Started, where it is captured.
- §2.2's read-only role: some screens keep their controls, as the work item expected, but the role also loses the store's card while the store page stays open to it, and custom fields hide their controls where policies, channels and markets keep them (B2 to B5).
- §4's size estimate: 150 stories and 300 reference images, 10.2 MB; 122 captures, and evidence of 13.5 MB in all.

## 7. Gaps

Each names what is missing, the check made instead and what would close it. The batch's gaps are G-33 to G-40 in LIQ-004's [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), each PENDING until the owner answers. The work item's seven known gaps are among them or closed: what setup provisions is closed by §3.4. Tenant isolation is an outstanding item, not a gap.

| Gap | Check made instead | What would close it | Proposal |
|---|---|---|---|
| G-33: 121 of the 150 stories not compared by the script | 51 show a state seen in a running-screen capture; 70 checked against their source only. Each is named in the [image review list](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md) | Running screens that show those states | As G-01 |
| G-34: 25 states reached by answering a request in the browser (§2.1) | Each capture says how its state was reached; the one answer with words the batch wrote is named | A server that answers so | Accept as simulated interface-state coverage, as G-20, G-21 and G-27 were |
| G-35: A routing rule configured | The story Rule settings, with a rule kind an extension could register, checked against its source | A rule kind with settings, which Spree does not have | Accept as checked against source |
| G-36: First-run setup with sample data | Spree's spec that sample data is queued only when asked for, into the new store only (§3.2) | Setup run with sample data and the catalog checked | Deferred to batch 4 by the owner on 2026-10-25; CAP-03-03 PARTIAL until then |
| G-37: No browser test drives the store address dialog, saves a storefront address or completes a task from Getting Started | The captures of the dialog, the sheet and each task done and not done | A browser test for each | Defer to a platform batch's browser tests, as P6's were |
| G-38: Where a setting takes effect outside the dashboard: markets, languages, storefront access, policies and custom fields on the storefront; payment capture; order numbers, reasons and channels' routing on orders and returns; inventory and the data sources | The settings saved and read back in Spree's browser tests | The batches that own those areas | Batches 4, 6, 7 and 8, and P4 |
| G-39: An exemption reason's code, and a market's tax engine, where a real tax engine decides | The stories Tax exemption, engine codes, and Engine chosen and Engine not connected, checked against their source; the tax engine list captured with the store's own | A connected tax engine | Batch 7 and P4, with the providers' test keys |
| G-40: What the server refuses to the roles in §3.1 beyond Spree's specs | None; the interface's behaviour is recorded (§3.1) | Negative access-control tests | Join G-11 |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap |

## 8. CI runs and local checks

The CI runs at the batch's revision are added here by a later commit that changes only records.

**Local checks, in this session, before the commit.** Lint (Biome), the package's type check and the fixture tests passed. The fidelity scripts, which the package's type check leaves out, type-checked apart from the known error in Spree's own browser test helpers, which they import (`packages/dashboard/e2e/helpers.ts` line 226), and two in P2's `collector.ts` and `receiver.ts`, which `main` already has and this batch does not change: each declares a constructor parameter as a property, which the package's TypeScript settings refuse. The Storybook built, with 554 stories in all, and the visual check passed in the pinned image for every story, 1,108 comparisons, the batch's 150 stories among them. The captures, the setup run, the provisioning check and the comparison passed against the browser-test and first-run servers. Spree's specs passed as in §3.2. Criterion 14's search covered the 354 text files that differ from `main` and matched once, on an invitation link in the comparison script whose token is made of invented words; `main` already has that line, from the staff access batch's part 1 (#11). Every evidence image was converted to lossless WebP and checked equal to its capture, pixel for pixel.

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the browser tests' data on screens.** Names, counts and records differ on purpose.
- **Seeded data.** The role, teammate, inactive channel, custom field definitions and retired reasons were added to the browser-test database through the Admin API. They exist only in that database, which is local and discarded, and Spree's tests and fixtures are unchanged. First-run setup ran on its own server's database, also discarded.
- **States reached by answering a request** show how the screen renders that answer, not that the server would send it; the store's refused save shows words the batch wrote (§2.1).
- **One country.** Setup ran once, for Poland in English. ProvisionDefaults works from the chosen country, so another country gives other zones, a currency and a language; Spree's provisioning spec covers more than one.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL.
- **Size.** The batch's 300 reference images are 10.2 MB, more than the work item estimated, because many sheets and the settings pages are tall; its evidence is 13.5 MB. The evidence images are lossless WebP.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-26-fb-19-batch-setup-stores-and-settings/README.md) lists every capture, comparison and result file, by inventory ID. The [image review list](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md) lists every reference image for the owner's review.

**Criterion 14's search.** Before the push, every text file the pull request adds or changes is searched for publishable and secret key prefixes, webhook secrets, JSON web tokens, bearer values, password fields, setup links with a token, and long runs mixing letters and digits, as generated values do. The search prints where a pattern matched, never the value; its result is given in §8 for the push it ran before. The setup token is read from a file the first-run server writes, which is ignored by git, and appears in no capture, note or log the batch keeps. The storefront sheet's address and key are painted out before each screenshot; the images cannot be searched as text, and a check of each image's painted area found no unpainted gap inside it. One of Spree's spec titles names a local address; the backend results replace it with `<a local address>`.
