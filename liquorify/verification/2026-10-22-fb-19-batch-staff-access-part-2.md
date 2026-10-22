---
title: FB-19 staff access batch, part 2, the shell and its overlays
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens after five corrections to the stories, and Spree's own specs for the shell and for the command palette's searches. Every state the work item lists for DA-OVL-01 to DA-OVL-04 is captured; two of them only by answering a request. Coverage and functional verification are recorded apart (§2): CAP-04-05 is PARTIAL, because the theme, the store switcher, the notifications and the palette's record search have no browser test. The teammate's own navigation after a role is given (G-07) was observed, as part 1 proposed. The interface shows eleven behaviours the work item did not expect, recorded as Spree's behaviour. Tenant isolation and the owner's acceptance are NOT_RUN. CI at `b56b647`: Packages with the dashboard's browser tests passed, and the visual check passed twice, 594 of 594 each time, after correcting a story whose image CI found could settle two ways. Tests passed apart from one Spree address example, the existing defect #10 fixes, which failed in two jobs and passed when they were re-run once (§8).
---

# FB-19 staff access batch, part 2, the shell and its overlays

**Claim.** Part 2 of the [staff access and dashboard shell batch](../work-items/fb-19-batch-staff-access-and-shell.md) reproduces what Spree already has for the dashboard's shell: the rail and its menus, the phone's top bar, the command palette, the notifications and the profile dialog. It gives the 22 components those overlays use 70 Storybook stories, with light and dark reference images. It captures the four overlays on Spree's running dashboard in each listed state, on a desktop and a phone, compares 32 cases with their stories, and runs Spree's own specs for the endpoints the shell and the palette call. It starts from part 1's corrections, which the owner accepted on 2026-10-22 with part 1's gaps left pending ([record](https://github.com/pateldhruval872/liquorify/blob/8f97e679f1f0f837f20bd484f33f2c8a636652e6/liquorify/verification/2026-10-22-fb-19-batch-staff-access-part-1-merge.md), in #12, which has not merged yet).

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | Draft pull request [#14](https://github.com/pateldhruval872/liquorify/pull/14) at `b56b647`, which starts from `main` `4a4940e`, after #11's merge. Its first commit, `e2d282b`, differs only by the correction to one story's answer that CI found (§4.2). The CI results in §8 were added in a later commit that changes only records |
| Spree's code: the dashboard, its packages and the gems | Identical to `a4a1708`, the revision part 1 ran at. The branch changes none of it: `git diff a4a1708 HEAD` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui` and `spree/` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at `a4a1708`, in the pinned Playwright 1.64.1 image: at 1280 by 960 pixels (captures), 1280 by 800 (comparison), and 390 by 844 for the phone |

**Results.**

| # | Criterion ([work item §5 and §7.3](../work-items/fb-19-batch-staff-access-and-shell.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope feature is mapped to its screens, flows, permission scope, states, components, browser tests and emails | PASS: the map in §2 has CAP-04-05 with DA-OVL-01 to DA-OVL-04, its 22 components and the browser test titles that touch the shell, with its evidence or a named gap. It has no flow in LIQ-008 and no email |
| 2 | Every component the part's screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed | PASS: 22 new components, 70 stories, 140 reference images, 20 of them at a phone's width, each looked at in both modes (§1, [image review list](2026-10-22-fb-19-batch-staff-access-part-2-image-review.md)). The 11 reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard in each state listed under Scope | PASS for all 13 listed states. The captures show 31 states of the four overlays, 10 of them on a phone. Two listed states could only be reached by answering a request: DA-OVL-03 "populated", because the test environment never checks for a newer release, and DA-OVL-04 "field errors", because the server took every value tried (§2.1, §5) |
| 4 | Each permission variant is captured, showing what its role allows | PASS as evidence of what the interface shows (§3.1): the three template sidebars, compared with their stories; the support teammate's account menu and command palette; and a teammate's navigation before and after a role is given. One does not match what the rail suggests: the palette offers the support teammate Getting Started, which the rail hides (§5, B1) |
| 5 | Each flow is mapped step by step, and the browser tests covering it pass on the part's revision | PASS for the mapping (§2.2): 11 of Spree's browser test titles touch the shell. No LIQ-008 flow is in scope. Five behaviours no test covers are gaps. The 11 titles are among the dashboard's browser tests, which passed in all four shards in CI at `e2d282b` and `b56b647` (§8) |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | PASS, as a diagnostic: 32 cases, each a new story, after five corrections to the stories. 26 show no style difference in either theme, and the other 6 are explained (§4). The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is recorded as a gap, with the check made instead | PASS: 38 of the 70 stories were not compared by the script; 23 of them show a state seen in a running-screen capture, and 15 were checked against their source only (§7, image review list) |
| 8 | The visual check passes twice in CI on the same revision; Tests and Packages pass; the check stays advisory | PASS at `b56b647` (§8): the visual check passed twice in CI, 594 of 594 each time, the second run started by hand; Packages passed, and Tests passed apart from one Spree address example that is not this change's; the check is still advisory and never accepts an image. At `e2d282b` the second run failed one image, which was the story's defect and is corrected (§4.2) |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-010 §8, LIQ-004's FB-19 entry, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | NOT_RUN: the pull request is a draft |
| 12 | Backend authorization is recorded apart from criterion 4, from Spree's own specs at the part's revision | PASS for what Spree's specs exercise: 521 examples in 14 files, no failures (§3.2). What no Spree spec exercises is NOT_RUN as a spec result; the refusal check observed each such request answered as the role allows, as an observation only |
| 13 | Tenant isolation is recorded as NOT_RUN, with links to the open findings | NOT_RUN (§3.3). No new isolation defect was found; none was looked for beyond Spree's own specs |

## 1. What was built

**Stories, 70, for the 22 new components of part 2.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-22-fb-19-batch-staff-access-part-2-image-review.md) names each one. Stories tagged `phone` show a part of the dashboard that exists only below its 768-pixel breakpoint, and are captured at 390 by 844 pixels instead of 1280 by 800 (LIQ-010 §8).

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `command` (CMP-DUI-P-15) | Default, Nothing matches, In a dialog |
| | `dropdown-menu` (CMP-DUI-P-21) | Open (a teammate's row menu), Choices, Submenu open |
| | `sidebar` (CMP-DUI-P-38) | Expanded, Icon rail, Loading |
| Composed | `language-menu-items` (CMP-DUI-C-30) | Default, Long name, Focus visible |
| | `search-input` (CMP-DUI-C-47) | Empty, With a query, Focus visible (the settings menu's search) |
| | `theme-toggle` (CMP-DUI-C-53) | Default, Following the system, Focus visible |
| Framework | `app-shell` (CMP-CORE-02) | Expanded, Collapsed, In settings, On a phone, On a phone with the navigation open |
| | `app-sidebar` (CMP-CORE-03) | Admin, Order manager, Merchandiser, Support, Loading |
| | `image-upload-field` (CMP-CORE-11) | Empty, Saved, Wide, Just uploaded, Uploading, Disabled, Focus visible |
| | `mobile-top-bar` (CMP-CORE-17) | Unread notification, Loading, Account menu open |
| | `nav-main` (CMP-CORE-19) | Child page, Collapsed with a section's menu open |
| | `settings-sidebar` (CMP-CORE-29) | Searching, Nothing matches, Staff manager, On a phone with the menu open |
| | `sheet-top-bar` (CMP-CORE-30) | Record page |
| | `sidebar-search` (CMP-CORE-31) | Focus visible, Collapsed |
| | `sidebar-user` (CMP-CORE-32) | Open, Store with a storefront, Teammate without a name |
| | `skip-link` (CMP-CORE-33) | Focus visible |
| | `store-switcher` (CMP-CORE-36) | Open, One store, Loading |
| | `top-bar-breadcrumbs` (CMP-CORE-39) | Child page, On a phone on a record page, On a phone in settings |
| Admin dashboard | `command-palette` (CMP-DA-G-05) | Open, Results, Create actions, Nothing matches, On a phone |
| | `notifications` (CMP-DA-G-24) | Nothing new, Unread, New release |
| | `profile-dialog` (CMP-DA-G-24) | Default, With a photo, Field errors, On a phone |
| | `release-notes` (CMP-DA-G-24) | Default |

**Already covered, reused by these overlays:** `button` and `select` from the pilot; `avatar`, `breadcrumb`, `field`, `input` and `skeleton` from #9; `dialog`, `sheet`, `toast`, `tooltip` and the route error boundary's error state from part 1.

**The store layout frame.** The shell renders only inside the dashboard's generated route tree. `src/stories/dashboard/shell/store-layout.tsx` renders the same tree as the store layout (`routes/_authenticated/$storeId.tsx`), line for line: the store, the command palette and the shell's providers, the shell with its bell and profile dialog, and the palette. It loads the dashboard's own navigation, settings navigation and palette registrations. Every story of a part of the shell shows it in this frame, as every store page does.

**Providers and mocks.** Store, counter, update status and search fixtures, each checked against the Admin API's own schemas in `fixtures.test.ts`; handlers for what the store layout asks for, with variants that hold the store or the permissions open, answer the palette's searches, and refuse or answer a profile save. A signed-in session can now name its user, and a story can leave the theme on "System", where the running dashboard starts.

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `staff.ts` adds one more teammate, who starts each run with the support role, for FL-24's last step.
- `screens.spec.ts` gains part 2's captures, on a desktop and a phone, and a test that gives a teammate a role and captures their navigation before and after (§2.2). Each capture now blocks and records any request that would leave the local servers (`outside` in its notes). A further test records what the server takes on a profile save (§5, B6).
- `compare.spec.ts` gains part 2's 32 cases.
- `refusals.spec.ts` gains the palette's nine searches, sent as four teammates (§3.2).

**The visual check captures phone stories at a phone's width.** A story tagged `phone` is captured at 390 by 844 pixels in both themes, and its images are named `phone-light.png` and `phone-dark.png`. LIQ-010 §8 records it.

**A fix to part 1's script.** Part 1's `screens.spec.ts` used the browser tests' `getCredentials` without importing it, so its wrong-credentials capture would have failed on a rerun. The import is added; the capture passed again in both themes ([wrong-credentials](evidence/2026-10-22-fb-19-batch-staff-access-part-2/screens/DA-AUTH-01/wrong-credentials/public-light.webp)).

## 2. The batch map, completed

The map's CAP-04-05 row from the [work item §7.1](../work-items/fb-19-batch-staff-access-and-shell.md#71-links-from-capabilities-to-evidence), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-2/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of an overlay; it does not show that the overlay works. **Functionally verified** is whether each behaviour was shown to work at the part's revision, by a browser test or by an observation that asserts the change (§2.2).

| Capability | Screens | Flows | Emails | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|---|
| CAP-04-05 Staff profile, language and theme, command palette, notifications | DA-OVL-01 to DA-OVL-04 | None in LIQ-008; FL-24's last step, from part 1 | None | Any signed-in staff; the navigation and the palette follow what the role reads; the update check needs `manage` on the store | The 22 components in §1; reused `avatar`, `breadcrumb`, `button`, `dialog`, `field`, `input`, `select`, `sheet`, `skeleton`, `toast`, `tooltip` | 70 stories; 31 states captured; 32 cases compared; 11 browser test titles; Spree's specs for the shell and the palette's searches; the refusal check for the searches; no request left the local servers (§2.1) | PASS: every listed state captured, two by answering a request | PARTIAL: the profile, the language, the palette's create actions and empty search, and the settings index search pass in Spree's browser tests (in CI at `b56b647`, §8). The theme, the store switcher, the notifications, the palette's record search and the rail's own settings search have no browser test |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-<theme>.webp` in the evidence folder, in light and dark, with a JSON note that records the path, the variant's role, how the state was reached and any request blocked because it would have left the local servers. "Held" means the browser held a request open; "answered" means the browser answered it.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| DA-OVL-01 App shell | Expanded sidebar and settings navigation, for all seven variants, in part 1's captures; collapsed sidebar; a section's menu with the rail collapsed; the search button's tooltip with the rail collapsed; store loading (held); navigation loading (the permissions held); an order with the rail collapsed, which shows the top bar's breadcrumbs; settings search; settings search, nothing matches; store switcher open; account menu with language and theme (admin, support); a teammate's navigation before and after a role is given (FL-24). On a phone: the top bar; the navigation drawer open; the account menu; store loading (held); an unread notification (answered); an order's breadcrumbs; the settings menu open; settings breadcrumbs | None |
| DA-OVL-02 Command palette | Open (admin, support); results for "E2E"; create actions for "new"; nothing matches; on a phone | None |
| DA-OVL-03 Notifications | Empty; unread (the update check answered with a newer release); populated (answered, with that release's notes stored in the browser beforehand, §5 B5) | None, though "populated" is reached only by answering |
| DA-OVL-04 Profile dialog | Default; field errors (the save answered with a field error, §5 B6); on a phone | None, though "field errors" is reached only by answering |

**No request left the local servers.** Every capture blocked and recorded any request to a host other than the local servers. None was: each of the 68 notes this part wrote records an empty list. The work item planned "outside update requests blocked and recorded"; Spree's update check runs on the server, not in the browser, and the test environment switches it off (§6).

### 2.2 Browser tests, by overlay

The browser tests are Spree's own, in `packages/dashboard/e2e/`, unchanged. They run in the Packages workflow, in four shards, at the part's revision (§8). CAP-04-05 has no flow in LIQ-008, so the tests are mapped by behaviour.

| Overlay | Behaviour | Covered by | Gap |
|---|---|---|---|
| DA-OVL-04 Profile dialog | Open it from the account menu | `profile.spec.ts`: "opens the profile dialog from the user menu" | |
| | Save a name, and keep it after a reload | "edits personal details and persists across reload" | |
| | Change the language in the dialog | "switching the language translates the admin UI" | |
| DA-OVL-01 App shell | Change the language from the account menu | "switches the language from the top-bar menu and persists it" | |
| | No "View store" until the store has a storefront address | `store-settings.spec.ts`: "shows no storefront address until one is set" | |
| | Change the theme | None | **Gap** |
| | Switch store | None | **Gap** |
| | Search the settings menu | `settings-index.spec.ts`: "searches settings on a narrow screen" searches the settings index page, not the rail's settings menu | **Gap** for the rail's search |
| DA-OVL-02 Command palette | Open it with the keyboard shortcut | `command-palette.spec.ts`: "opens with the keyboard shortcut" | |
| | Create actions | '"add product" opens the product create page', '"new customer" opens the create sheet on the customers page', "a bare verb lists the create actions" | |
| | Nothing matches | "reports when a query matches nothing" | |
| | Find a record | None: no test searches for a product, order or customer | **Gap** |
| DA-OVL-03 Notifications | A newer release is announced | None: the test environment never checks for one | **Gap** |
| FL-24's last step (G-07) | The teammate's own navigation after a role is given | No Spree browser test. Part 2's script signs in as a teammate holding the support role, has an admin add the merchandiser role in the edit teammate sheet, and signs in again: Products appears beside Orders, and both states are captured ([before](evidence/2026-10-22-fb-19-batch-staff-access-part-2/screens/DA-OVL-01/role-given-before/roleChange-light.webp), [after](evidence/2026-10-22-fb-19-batch-staff-access-part-2/screens/DA-OVL-01/role-given-after/roleChange-light.webp)). An observation that asserts the change, not one of Spree's tests | Proposed to close G-07, as part 1 planned; the owner decides |

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each role

From the running-screen captures and the comparison. This shows only what the interface displays; hiding an entry does not stop a request.

| Variant | Role's permission keys | Rail | Command palette | Account menu and bell |
|---|---|---|---|---|
| Admin | Every key | Everything, with Getting Started and its count, and the counters on Orders | Every page the rail offers, then signing out | Preferences, Edit Profile, the outbound links, Log out; the bell |
| Support template | `read_orders`, `read_customers`, `read_dashboard` | Home, Orders, Customers; no Settings (part 1) and no Getting Started | **Getting Started**, Home, Orders and its children, Customers (§5, B1) | The same menu, with the teammate's name; the bell, whose update check this role may not make (§5, B4) |
| Order manager template | As in part 1 | Home, Orders, Customers, Loyalty, compared with its story | Not captured | Not captured |
| Merchandiser template | As in part 1 | Home, Products, Inventory, Settings, compared with its story | Not captured | Not captured |
| Support, then given the merchandiser role (FL-24) | The support keys, then the merchandiser keys added | Orders and Customers, then Products and Inventory as well | Not captured | Not captured |

The comparison's four rail cases put each template's sidebar beside its story: [admin](evidence/2026-10-22-fb-19-batch-staff-access-part-2/comparison/app-sidebar-admin/light-side-by-side.webp), [order manager](evidence/2026-10-22-fb-19-batch-staff-access-part-2/comparison/app-sidebar-order-manager/light-side-by-side.webp), [merchandiser](evidence/2026-10-22-fb-19-batch-staff-access-part-2/comparison/app-sidebar-merchandiser/light-side-by-side.webp), [support](evidence/2026-10-22-fb-19-batch-staff-access-part-2/comparison/app-sidebar-support/light-side-by-side.webp). None differs in a style.

### 3.2 What the server refuses

**Spree's own specs, at this branch, whose Spree code is `a4a1708`.** Run in this session on SQLite with Spree's API test app. 521 examples in 14 files, 0 failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-22-fb-19-batch-staff-access-part-2/backend/api-specs.json) (the shell's endpoints) and [search-specs.json](evidence/2026-10-22-fb-19-batch-staff-access-part-2/backend/search-specs.json) (the palette's searches).

| Endpoint | Spec file (examples) | What the examples exercise, by caller |
|---|---|---|
| `GET /store`, `PATCH /store` | `store_controller_spec.rb` (51) | A staffer without the settings permission still reads the store, and cannot update it. A secret key without the settings scope is denied |
| `GET /me`, `PATCH /me` | `me_controller_spec.rb` (24) | The permission keys of the current store only. A staff member with no role who names a store is refused. Without authentication, 401 |
| `POST /files` (the profile photo) | `files_controller_spec.rb` (10) | Refusals of what may not be uploaded, and 401 without a key |
| `GET /dashboard/counters` | `dashboard_controller_spec.rb` (8) | A role without order access gets only the stock counters. Another store's channel is refused. A secret key is bounded by its scopes |
| `GET /updates` | `updates_controller_spec.rb` (3) | A staffer who cannot manage the store is forbidden |
| The palette's nine searches | `products` (158), `orders` (90), `sellers` (32), `customers` (31), `promotions` (30), `categories` (29), `companies` (23), `customer_groups` (16), `collections` (16) controller specs | Each list, its search and filters, as an admin JWT or a secret key; key scopes where the spec sets them |

**What no Spree spec exercises, NOT_RUN as a spec result.** No Spree spec sends one of the palette's nine searches as a staff JWT whose role does not allow reading that resource.

**An observation of the running server, not a spec.** The refusal check sent each of the nine searches as the palette sends them (`?q[search]=e2e&limit=5`), as four teammates: the staff viewer, support, the order manager and the merchandiser. All 36 answers were what each role allows: the 11 searches a teammate may read answered 200, and the other 25 answered 403 `access_denied`, each naming the permission missing (`read_products`, `read_categories`, `read_collections`, `read_orders`, `read_customers` for customers, customer groups and companies, `read_sellers` or `read_promotions`). The check expects each exact answer and fails on any other ([refusals-search.json](evidence/2026-10-22-fb-19-batch-staff-access-part-2/backend/refusals-search.json)). The palette searches only what the reader may read, so a teammate's palette never sends a refused search; the check sends them anyway. This shows the server answered these requests so at that revision. It is not one of Spree's specs and is not run in CI. It joins G-11.

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings). None of them is about the shell; all seven stay open.

Some of Spree's specs above touch store boundaries: the counters refuse another store's channel, and a staff member with no role who names a store is refused. They are listed so they are not lost. They are Spree's own unit checks, not FB-03's validation, and the batch claims nothing about isolation from them. The store switcher lists the two stores the browser tests' admin holds a role in; which stores another teammate sees was not checked beyond the support teammate's one. No new isolation defect was found during the batch; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-2/README.md). Nothing is open in the browser tests' store, so the rail's counters would be empty; the cases that show the rail answer the counters request with the stories' counts.

### 4.1 Results, after the corrections

| ID | Case | Story | Running screen | Styles that differ, light and dark | Explained |
|---|---|---|---|---|---|
| CMP-CORE-03 | app-sidebar-admin | App sidebar: Admin | The rail, as the admin | None | |
| CMP-CORE-03 | app-sidebar-order-manager | App sidebar: Order manager | The rail, as the order manager | None | |
| CMP-CORE-03 | app-sidebar-merchandiser | App sidebar: Merchandiser | The rail, as the merchandiser | None | |
| CMP-CORE-03 | app-sidebar-support | App sidebar: Support | The rail, as support | None | |
| CMP-CORE-03 | app-sidebar-loading | App sidebar: Loading | The rail with the permissions held | None | |
| CMP-CORE-02 | app-shell-collapsed | App shell: Collapsed | The rail folded to icons | None | |
| CMP-CORE-29 | settings-sidebar | App shell: In settings | The settings menu on the staff page | None | |
| CMP-CORE-36 | store-switcher-open | Store switcher: Open | The switcher, open | None | |
| CMP-CORE-32 | sidebar-user-open | Sidebar user: Teammate without a name | The account menu; the browser tests' admin has no name | None | |
| CMP-CORE-31 | sidebar-search | Sidebar search: Focus visible | The rail's search button, focused | None | |
| CMP-CORE-33 | skip-link-focus-visible | Skip link: Focus visible | The skip link, reached with Tab | None | |
| CMP-CORE-17 | mobile-top-bar | App shell: On a phone | The phone's top bar | None | |
| CMP-CORE-02 | app-shell-phone-navigation-open | App shell: On a phone, navigation open | The phone's drawer | None | |
| CMP-CORE-17 | mobile-account-menu | Mobile top bar: Account menu open | The account menu on a phone, as the support teammate, who has a name | None | |
| CMP-CORE-39 | breadcrumbs-phone-settings | Top bar breadcrumbs: On a phone, in settings | The breadcrumb bar on a phone, in settings | None | |
| CMP-CORE-39 | breadcrumbs-child-page | Top bar breadcrumbs: Child page | Returns, with the rail folded | None | |
| CMP-CORE-30 | sheet-top-bar-record-page | Sheet top bar: Record page | An order, with the rail folded | None | |
| CMP-CORE-19 | nav-main-child-page | Nav main: Child page | The rail on Returns | None | |
| CMP-DA-G-05 | command-palette-open | Command palette: Open | The palette, open | None | |
| CMP-DA-G-05 | command-palette-create-actions | Command palette: Create actions | The palette, searching "new" | None | |
| CMP-DA-G-05 | command-palette-nothing-matches | Command palette: Nothing matches | The palette, searching "zzqx" | None | |
| CMP-DA-G-24 | notifications-empty | Notifications: Nothing new | Notifications, nothing new | border colours and box-shadow on the close button | Focus modality, as in part 1: the story opens with keyboard focus, so the close button shows its focus ring; the screen was opened with a pointer |
| CMP-DA-G-24 | notifications-new-release | Notifications: New release | Notifications, the update check answered with the story's release | None | |
| CMP-DA-G-24 | profile-dialog | Profile dialog: Default | The profile dialog | border colours and box-shadow on the close button | As for notifications |
| CMP-DA-G-24 | profile-dialog-field-errors | Profile dialog: Field errors | The dialog, its save answered with a field error | None | |
| CMP-DUI-P-38 | sidebar-primitive-expanded | Sidebar: Expanded | The rail | height, colour and text on several elements; 44 elements on the screen only, 6 in the story only | The primitive's story shows sample content, not the dashboard's navigation, which the App sidebar stories reproduce and match |
| CMP-DUI-P-21 | dropdown-menu-open | Dropdown menu: Open | A teammate's menu on the staff page | height; colour of one icon; 3 elements on the screen only, 9 in the story only | The story shows the menu's parts (a label, icons, shortcuts) in one menu; the staff row's menu has two items. Widths match within 2 pixels, both following the longest item |
| CMP-DUI-P-15 | command-in-a-dialog | Command: In a dialog | The command palette | height and padding of the list | The palette widens the dialog to 672 pixels, from the primitive's 500, and lists every page the reader may open |
| CMP-DUI-C-53 | theme-toggle-system | Theme toggle: Following the system | The theme row of the account menu | None | |
| CMP-DUI-C-30 | language-menu-items | Language menu items: Default | The language row of the account menu | None | |
| CMP-DUI-C-47 | search-input-empty | Search input: Empty | The settings menu's search box | None | |
| CMP-CORE-11 | image-upload-field-empty | Image upload field: Empty | The profile dialog's photo field | font-size and line-height of the field's text | The profile dialog holds the field at 466 pixels wide and sets 13-pixel text; the story shows it on its own, at 448 pixels and 14-pixel text. The dialog's own case matches |

### 4.2 Corrections made to the stories

Each was a defect in the story, fixed there; no Spree component changed. The comparison was run again after them, and all 32 cases passed with the differences above.

| # | Story | Was | Now, as on the screen |
|---|---|---|---|
| 1 | Sheet top bar: Record page | A short page, so the bar kept its full 40 pixels | The page runs past the window, as an order does, and the bar gives up 8 pixels (§5, B2) |
| 2 | Dropdown menu (three stories) | Fixed widths of 224 and 192 pixels | The default width, which follows the longest item, as Spree's menus keep it |
| 3 | Search input (three stories) | A free-standing box at the page's text size | The settings menu's search box: 224 pixels wide, 32 high, 14-pixel text |
| 4 | Sidebar primitive (three stories) | The icons at the button's own size | The icons at 16 pixels, as the shell draws navigation icons |
| 5 | Command palette (all five) | Waited only until nothing was loading, which can pass before the permissions are even asked for. In the comparison's run the palette then opened with Home picked (§5, B3) | Waits until the permissions have arrived, so the first page, Getting Started, is picked as on the screen. The reference images already showed Getting Started picked and are unchanged |

**A correction found by CI.** The second visual check in CI failed one image: Profile dialog, Field errors, dark, with a focus ring on Save that its reference does not show (§8). The story's refused save was answered at once, so the dialog sometimes skipped its saving state, in which Save is disabled and loses its focus. The failure was reproduced locally, once in 50 runs, with the same 469 pixels. The answer now waits 100 milliseconds, as a server's does, so the saving state always shows; the reference images were already right and are unchanged. The running screen's comparison presses Save with a real click, which never shows the ring, so it is unaffected. After the correction, the story passed 150 runs of 150 in the pinned image, 75 in each theme. The comparison case, run again, recorded the same styles as before; its dark image differs from the recorded one in 60 pixels of the rail behind the dialog's backdrop, by at most 5 of 255 in a colour channel, and its light image not at all.

**Corrections to the comparison script, not the stories.** The loading case holds a request open, so it no longer waits for the network to go quiet. The rail's counters are answered with the stories' counts (§4). The pointer is moved off the controls a step clicked, so they do not keep a hover colour. The skip link is reached by Tab from the top of the page. The phone's account menu is opened as the support teammate, who has a name like the story's admin.

## 5. Spree's behaviour found, recorded and not changed

Each is how Spree works at `a4a1708`. The batch reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | The command palette lists every page whose subject the reader may read, and ignores the extra conditions the rail applies. So it offers Getting Started to a teammate who cannot update the store, while the rail hides it; and, read in code, it would still offer Getting Started once every setup task is done, when the rail drops it | DA-OVL-02, support ([capture](evidence/2026-10-22-fb-19-batch-staff-access-part-2/screens/DA-OVL-02/open/support-light.webp)); `command-palette.tsx` |
| B2 | On a page taller than the window, the top bar above a record shrinks to 32 pixels, less than its button and top padding need, because nothing stops it shrinking | DA-OVL-01 record-page |
| B3 | Opened before the reader's permissions arrive, the palette lists only Home, and keeps Home picked when the other pages arrive above it | Storybook, before correction 5; read in `command-palette.tsx`. The running screens open it after the page has loaded |
| B4 | Only a teammate who may manage the store asks for the update status, so for every other teammate the bell always reads "You're all caught up" | Read in `use-update-status.ts`; Spree's spec forbids the request to such a teammate |
| B5 | The only notification is a newer release, which the server's update check reports. The test environment switches the check off, so the populated state needs the check answered. Its notes come from GitHub, so they were stored in the browser beforehand | DA-OVL-03 |
| B6 | The profile dialog accepts what the server accepts. Saved through the Admin API as the role-change teammate, the server took a 300-letter first name, and the language code `xx`, for which Spree has no translations, and saved both on the browser tests' SQLite database; the test then put the profile back. So its field errors were reached by answering the save. A refused save then shows the message twice: in a banner at the top of the dialog and under the field | DA-OVL-04 field-errors; [profile-saves.json](evidence/2026-10-22-fb-19-batch-staff-access-part-2/backend/profile-saves.json) |
| B7 | On a desktop, the top bar's breadcrumbs show only while the rail is folded; expanded, the rail gives the page's place | DA-OVL-01 record-page |
| B8 | On a phone, the navigation drawer has no store switcher, search or account row: the top bar holds the store's name, the search and the account menu | DA-OVL-01 mobile-navigation-open |
| B9 | The browser-test store has no storefront address, so the account menu has no "View store", as Spree's browser test expects | DA-OVL-01 user-menu-open |
| B10 | The Orders badge counts open orders, returns, exchanges and claims together; each child carries its own count | The rail, read in `nav/default.ts` and shown in the stories |
| B11 | In the light theme the rail's loading skeletons cannot be seen against the rail, so it looks empty while the permissions load; in the dark theme they show | DA-OVL-01 navigation-loading, light |

B1 and B4 matter for Liquorify's later staff work; whether to change either is a Liquorify product decision, deferred with the rest of Liquorify's own staff access changes (F1).

## 6. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-staff-access-and-shell.md) §7.7, without changing the proposal's text:
- §7.1's "outside update requests blocked and recorded": the update check is made by Spree's server, not the browser, and the test environment switches it off. The captures blocked and recorded every outside request instead, and there were none (§2.1).
- §2.1's DA-OVL-03 "populated": reachable only by answering the update check (B5).
- §2.1's DA-OVL-04 "field errors": reachable only by answering the save (B6).
- §2.2's template sidebars: compared with their stories here, beyond part 1's captures.

## 7. Gaps

Each names what is missing, the check made instead and what would close it. Part 2's gaps join the gap register in LIQ-004 once #12, which holds it, merges; until then they are listed here.

| Gap | Check made instead | What would close it | Proposal |
|---|---|---|---|
| 38 of the 70 stories not compared by the script | 23 show a state seen in a running-screen capture; 15 checked against their source only. Each is named in the [image review list](2026-10-22-fb-19-batch-staff-access-part-2-image-review.md) | Running screens that show those states | As G-01 |
| DA-OVL-03 with a real update check, and release notes fetched from GitHub | The check answered in the browser; the notes stored beforehand | An environment where the update check runs | Accept as checked by answering; the baseline does not enable the check |
| DA-OVL-04 field errors from the server | The save answered with Rails' own length message | A server that refuses a value the dialog lets through | Accept as checked by answering |
| The theme, the store switcher, the notifications, the palette's record search and the rail's settings search in a browser test | The captures, which show each state | Spree's browser tests, which this batch does not change | Defer to the platform batch, with G-11's negative tests |
| The palette's searches as a teammate who may not read the resource | The refusal check's observation (§3.2) | Specs in Spree's suites | Joins G-11 |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap |

**G-07 from part 1.** Part 1 deferred the teammate's own navigation after a role is given to this part. Part 2's script now shows it (§2.2). The proposal is to close G-07 on that observation; it stays PENDING until the owner decides.

## 8. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Storybook 39865519847](https://github.com/pateldhruval872/liquorify/actions/runs/39865519847) | `e2d282b`, every story, image, script and record of part 2 | Built, token check and coverage passed, and all 594 comparisons passed in 11.2 minutes under the explicit tolerance |
| [Storybook 39867924526](https://github.com/pateldhruval872/liquorify/actions/runs/39867924526) | `e2d282b`, started by hand | 593 comparisons passed and one failed: Profile dialog, Field errors, dark, with 469 pixels different, a focus ring on Save. A defect in the story, corrected in `b56b647` (§4.2) |
| [Tests 39865519875](https://github.com/pateldhruval872/liquorify/actions/runs/39865519875) | `e2d282b` | All 21 jobs passed, on PostgreSQL and MySQL, every core shard included, and Brakeman |
| [Packages 39865519870](https://github.com/pateldhruval872/liquorify/actions/runs/39865519870) | `e2d282b` | Every job passed, the dashboard's browser tests in all four shards among them; its six release jobs were skipped, as on every pull request |
| [Storybook 39871090963](https://github.com/pateldhruval872/liquorify/actions/runs/39871090963) | `b56b647`, the story's correction | Built, token check and coverage passed, and all 594 comparisons passed in 11.2 minutes |
| [Storybook 39871093841](https://github.com/pateldhruval872/liquorify/actions/runs/39871093841) | `b56b647`, started by hand | All 594 comparisons passed again, in 9.2 minutes |
| [Tests 39871091243](https://github.com/pateldhruval872/liquorify/actions/runs/39871091243) | `b56b647` | `PostgreSQL - core (1/3)` and `MySQL - core (1/3)` each failed on one example, `spec/services/spree/addresses/update_spec.rb:90`; the other 19 jobs passed. The commit changed no Spree code. The example depends on randomly generated countries and states and fails when they collide: it is the Spree defect #10 fixes, which the owner kept separate, so the fix is not carried here ([comment](https://github.com/pateldhruval872/liquorify/pull/14#issuecomment-6353627526)). Both jobs were re-run once and passed, so the run passed on its second attempt |
| [Packages 39871090999](https://github.com/pateldhruval872/liquorify/actions/runs/39871090999) | `b56b647` | Every job passed, the dashboard's browser tests in all four shards among them; its six release jobs were skipped |

The commit that adds these results changes only this record and the evidence index.

**Local checks, in this session, before the commit.** Lint (Biome), the package's type check and the fixture tests passed. The fidelity scripts, which the package's type check leaves out, type-checked apart from one error in Spree's own browser test helpers, which they import (`packages/dashboard/e2e/helpers.ts` line 226, which returns a value that may be missing as if it were always there). The token check and the coverage report ran: the coverage report counts 297 stories in all, and the 22 new components. The visual check ran twice in the pinned image after the palette's correction, and both runs passed all 594 comparisons, for 297 stories in two modes each, in 11.9 and 11.1 minutes. The comparison, the captures and the refusal check passed against the browser-test server.

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the browser tests' data on screens.** Names, counts and icons differ on purpose; the counters are answered so the rail's badges show.
- **Seeded data.** The variants' roles and teammates were added to the browser-test database through the Admin API, and the FL-24 teammate is put back to the support role after each run. They exist only in that database, and Spree's tests and fixtures are unchanged.
- **States reached by holding or answering a request** show how the screen renders that answer, not that the server would send it.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL.
- **Size.** Part 2's 140 reference images are 4.2 MB and its evidence 7.8 MB. The evidence images are lossless WebP, converted from the PNG captures with every pixel checked equal.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-2/README.md) lists every capture, comparison and result file, by inventory ID. The [image review list](2026-10-22-fb-19-batch-staff-access-part-2-image-review.md) lists every reference image for the owner's review.
