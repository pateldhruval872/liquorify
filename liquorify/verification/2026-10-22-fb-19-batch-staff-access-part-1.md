---
title: FB-19 staff access batch, part 1
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens after six corrections to the stories, the emails rendered from Spree's previews, and Spree's own staff and role specs. Two listed states and four flow steps are gaps. The interface shows two behaviours the work item did not expect, recorded as Spree's behaviour. Tenant isolation and the owner's acceptance are NOT_RUN. The CI results are recorded in the pull request at the revision that carries this record
---

# FB-19 staff access batch, part 1

**Claim.** Part 1 of the [staff access and dashboard shell batch](../work-items/fb-19-batch-staff-access-and-shell.md) reproduces what Spree already has for staff sign-in, invitations, staff and roles. It gives the 16 components those screens use 72 Storybook stories, with light and dark reference images. It captures the eight screens on Spree's running dashboard in each meaningful state and permission variant, compares 21 cases with their stories, renders the three staff emails, and runs Spree's own staff and role specs. It is the first batch under [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch), so it records the batch map, the flows and the three permission claims as well as the components.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and this record | Draft pull request [#11](https://github.com/pateldhruval872/liquorify/pull/11), at the revision that carries this record. It builds on #9's branch |
| Spree's code: the dashboard, its packages and the gems | `main` `a4a1708`. The branch changes none of it: `git diff a4a1708 HEAD` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui` and `spree/` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at `a4a1708`, in the pinned Playwright 1.64.1 image at 1280 by 960 pixels (captures) and 1280 by 800 (comparison) |

**Results.**

| # | Criterion ([work item §5 and §7.3](../work-items/fb-19-batch-staff-access-and-shell.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope feature is mapped to its screens, flows, permission scope, states, components, browser tests and emails | PASS: the map in §2 has every ID from the work item's part 1 rows, with its evidence or a named gap |
| 2 | Every component the part's screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed | PASS: 16 new components, 72 stories, 144 reference images, each looked at in both modes (§1, [image review list](2026-10-22-fb-19-batch-staff-access-part-1-image-review.md)). The 15 reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard in each state listed under Scope | PASS for 34 of the 36 states the work item lists. The captures show 48 states of the eight screens in all, and the navigation for each variant. Two listed states are gaps: DA-AUTH-03 "saved" and DA-SHELL-02 "not authorized" (§2.1, §7) |
| 4 | Each permission variant is captured, showing what its role allows | PASS as evidence of what the interface shows, for all seven variants with their roles' permission keys (§3.1). Two of the work item's expectations do not match Spree: the staff page keeps its write controls for a read-only teammate, and a direct visit without the staff scope shows the page, not "not authorized". Both are recorded as Spree's behaviour (§5) and corrected in the work item |
| 5 | Each flow is mapped step by step, and the browser tests covering it pass on the part's revision | PASS for the mapping (§2.2): 19 test titles cover the three flows. Five steps no test covers are gaps. The CI result is recorded in the pull request's run at the revision that carries this record (§8) |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | PASS, as a diagnostic: 21 cases, 20 of them new stories, show no unexplained difference after six corrections to the stories (§4). The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is recorded as a gap, with the check made instead | PASS: 52 of the 72 stories were not compared by the script; 12 of them show a state seen in a running-screen capture, and 40 were checked against their source only (§7, image review list) |
| 8 | The visual check passes twice in CI on the same revision; Tests and Packages pass; the check stays advisory | Recorded in the pull request at the revision that carries this record (§8). Locally, in the pinned image, every comparison passed (§8) |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | NOT_RUN: #11 is a draft |
| 12 | Backend authorization is recorded apart from criterion 4, from Spree's own specs at the part's revision | PASS for what Spree's specs exercise: 183 examples in 15 files, no failures (§3.2). What no Spree spec exercises is NOT_RUN as a spec result; the refusal check observed each such request refused, as an observation only |
| 13 | Tenant isolation is recorded as NOT_RUN, with links to the open findings | NOT_RUN (§3.3). No new isolation defect was found; none was looked for beyond Spree's own specs |

## 1. What was built

**Stories, 72, for the 16 new components of part 1.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-22-fb-19-batch-staff-access-part-1-image-review.md) names each one.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `data-table` (CMP-DUI-P-17) | Default (the staff page's members card), Hovered row, Roles (the roles page's table) |
| | `dialog` (CMP-DUI-P-20) | Default (the invite dialog), Field errors, Wide, Full screen, Long content, Without close button |
| | `sheet` (CMP-DUI-P-37) | Default (the edit teammate sheet), Field errors, Loading, Scrolled, Wide |
| | `toast` (CMP-DUI-P-45) | Success, Error, Info, Loading, With description, Stacked |
| | `tooltip` (CMP-DUI-P-46) | Default, Bottom, Aligned to start, List, Wrapping |
| Composed | `confirm-dialog` (CMP-DUI-C-10) | Default, Remove teammate, Revoke invitation, Delete role |
| | `external-link` (CMP-DUI-C-19) | Default, In a description |
| | `relative-time` (CMP-DUI-C-38) | Past, Future, With prefix, Exact time, Missing |
| | `route-error-boundary` (CMP-DUI-C-44) | Default, Not found, Not authorized, Caught error |
| | `row-actions` (CMP-DUI-C-45) | Closed, Open, Custom actions, Disabled action |
| Framework | `page-header` (CMP-CORE-20) | Default (the staff page), Without actions (the roles page for a reader), Detail page, More actions open |
| | `slot` (CMP-CORE-34) | Fallback, One entry, By position, Hidden by condition |
| Admin dashboard (CMP-DA-G-24) | `auth-shell` | With a form, With a message, With a card |
| | `no-store-access` | Default, Replaced by a plugin |
| | `role-sheet` | New role, From a template, Edit, Duplicate, Protected role, Read only for a viewer, Limited by the reader, Name required, Loading |
| | `permission-picker` | Nothing granted, From a template, Full access, Read only, Disabled, Limited by the reader |

**Already covered, reused by these screens:** `button`, `select` and `back-button` from the pilot; `alert`, `avatar`, `badge`, `breadcrumb`, `card`, `checkbox`, `empty`, `field`, `input`, `label`, `skeleton` and `textarea` from #9. Part 1 compares #9's alert story with a running screen for the first time (§4).

**Providers and mocks.** Staff, invitation and role fixtures and handlers for the Admin API; a signed-in session whose permission keys a story can narrow; and a `storeId` need, so a story's store-scoped queries are keyed apart from the session's permissions as they are in the dashboard (§4.3).

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `staff.ts` adds the roles and teammates the permission variants need to the browser-test data, through the Admin API only: one role for each of the role sheet's three templates, three custom roles (`write_staff`, `read_staff`, `write_settings`), an unused role, a teammate holding each, a teammate removed from the store, and two pending invitations. Running it again reuses them.
- `screens.spec.ts` captures each screen in each state and variant, and writes how each state was reached beside each capture.
- `refusals.spec.ts` sends each staff and role request the interface offers as teammates whose roles do not allow it, and records each status (§3.2).
- `compare.spec.ts` gains part 1's 21 cases.

**The visual check now fails a story that throws.** A play function that throws still ends in Storybook's finished phase, so the visual check recorded such a story as passing. It now listens for Storybook's error events and fails the story. This found two broken play functions: the role sheet's Name required, and the pilot's API key table "Scopes open", whose assertion still looked for the label "Write orders" where Spree shows "Manage Orders". Its image was already right and is unchanged.

## 2. The batch map, completed

The map from the [work item §7.1](../work-items/fb-19-batch-staff-access-and-shell.md#71-links-from-capabilities-to-evidence), with the evidence and result of each row. Capture paths are in the [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-1/README.md).

| Capability | Screens | Flows | Emails | Permission | Components | Evidence | Result |
|---|---|---|---|---|---|---|---|
| CAP-04-01 Staff sign-in and password reset | DA-AUTH-01, DA-AUTH-02, DA-AUTH-03 | FL-03 | EM-S-01 | Public | `auth-shell`; reused `alert`, `button`, `card`, `input`, `label`, `skeleton` | 3 stories; 16 states captured; 1 case compared; 5 `auth.spec.ts` titles; EM-S-01 rendered | PASS, with two gaps: DA-AUTH-03 "saved", and the email and the new password in FL-03 |
| CAP-04-02 Sign-in through an identity provider | DA-AUTH-01, provider states | None | None | Public | `auth-shell`, the provider list in `login.tsx` | 4 provider states captured, three by answering or holding the providers request (§2.1); the alert compared | PASS for the states. Signing in through a real provider stays a gap |
| CAP-04-03 Staff invitations | DA-SET-24, DA-AUTH-04, DA-SHELL-01 | FL-02 | EM-S-03, EM-S-04 | `staff`; DA-AUTH-04 public with the link; DA-SHELL-01 any signed-in staff | `dialog`, `sheet`, `data-table`, `toast`, `confirm-dialog`, `relative-time`, `row-actions`, `page-header`, `external-link`, `no-store-access`, `slot`; reused `avatar`, `badge`, `checkbox`, `empty`, `field`, `select` | Stories; 20 states captured, with the permission variants; 12 cases compared; 7 test titles; both emails rendered; the three permission claims | PASS, with gaps: whether the emails are sent during the flow, and the slot (no stock screen registers an entry) |
| CAP-04-04 Roles and permissions, with role templates | DA-SET-25, DA-SHELL-02 | FL-24 | None | `staff`; DA-SHELL-02 any signed-in staff | `role-sheet`, `permission-picker`, `tooltip`, `route-error-boundary`, and the shared components above; reused `textarea` | Stories; 12 states captured, with the permission variants; 7 cases compared; 7 test titles; the three permission claims | PASS, with gaps: DA-SHELL-02 "not authorized", and the teammate's own view after a role is given |

CAP-04-05, the shell's overlays, is part 2's. Part 1 captured the main and settings navigation for every variant (DA-OVL-01) because it is the shell's permission evidence (§3.1); part 2 adds the overlay's own states and stories.

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-<theme>.webp` in the evidence folder, in light and dark, with a JSON note that records the path, the variant's role and how the state was reached. "Held" means the browser held a request open; "answered" means the browser answered it.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| DA-AUTH-01 Sign in | default; providers loading (held); providers failed (answered with a server error); with an identity provider (an invented provider added to the server's answer); wrong credentials; provider error on return; fresh installation (setup status answered as required); field errors | None |
| DA-AUTH-02 Forgot password | default; field errors; sending (held); sent | None |
| DA-AUTH-03 Reset password | default; missing link; invalid link; field errors | **saved**: needs a reset token, which only the email carries; the test app does not deliver email anywhere the scripts can read |
| DA-AUTH-04 Accept invitation | new account, which shows who invited and as which role; existing account; loading (held); missing link; invalid link; field errors | None |
| DA-SHELL-01 Store selection | opens the first store (admin); no store access (a teammate removed from the store) | None |
| DA-SHELL-02 Not found | not found (admin) | **not authorized**: no stock route shows it; see §5 |
| DA-SET-24 Staff | loading (held); populated with pending invitations (admin, staff manager, staff viewer); teammate actions open; invitation actions open; invite dialog; its role list open; a role is required; invitation resent; revoke confirmation; remove confirmation; edit teammate sheet; direct visit without the staff scope (support, store settings) | None. The listed "resend confirmation" does not exist: Spree resends at once and shows a toast, which is captured |
| DA-SET-25 Roles | loading (held); populated (admin, staff manager, staff viewer); create sheet; from a template; name required; edit sheet (admin, staff viewer); the admin role read-only; a role in use cannot be deleted; delete confirmation; the permissions overflow tooltip; direct visit without the staff scope (support, store settings) | None |
| DA-OVL-01 App shell, for permissions only | main navigation and settings navigation, for all seven variants | Part 2 |

### 2.2 Flows, step by step

The browser tests are Spree's own, in `packages/dashboard/e2e/`, unchanged. They run in the Packages workflow, in four shards, at the part's revision (§8).

| Flow | Step | Covered by | Gap |
|---|---|---|---|
| FL-03 Staff password reset | DA-AUTH-01: reach password reset | `auth.spec.ts`: "reaches the forgot-password page from the login form" | |
| | DA-AUTH-02: request a link | "confirms the reset request without revealing whether the email exists" | |
| | EM-S-01: the email | None in the browser. Rendered from Spree's preview (§2.3); Spree's API spec "publishes the password reset event and returns 202" | **Gap:** no test sees the email sent |
| | DA-AUTH-03: choose a new password | "shows an invalid-link message when the reset token is missing" | **Gap:** saving a new password, which needs a token from the email. Spree's API spec "sets the new password and returns a JWT with the admin user" covers the request, not the screen |
| | DA-AUTH-01: sign in again | "signs in via the login form and lands on the dashboard"; "rejects invalid credentials with an inline error" | |
| FL-02 Invite a staff member | DA-SET-24: invite | `staff.spec.ts`: "an invitation needs a role"; `invitation-acceptance.spec.ts`: "admin invites a teammate and the invitee signs up via the link" | |
| | EM-S-03: the invitation email | None in the browser: the test takes the link from the screen | **Gap:** no test sees the email sent |
| | DA-AUTH-04: accept | "admin invites a teammate and the invitee signs up via the link"; "shows an error for an invalid token" | |
| | EM-S-04: the acceptance email to the inviter | None | **Gap:** no test sees the email sent |
| | DA-SHELL-01: the new teammate's first store | "admin invites a teammate and the invitee signs up via the link" | |
| | Managing the invitation and the teammate | `staff.spec.ts`: "lists the signed-in admin as a member", "resends a pending invitation", "revokes a pending invitation after confirming", "renames a teammate and then removes them from the store" | |
| FL-24 Set up a role and give it to a teammate | DA-SET-25: create or edit a role | `roles.spec.ts`: "lists roles with the protected admin role", "creates a role from the permission grid and edits it", "starts from a template", "duplicates a role", "the admin role opens read-only", "the overflow count does not open the editor" | |
| | DA-SET-24: give it to a teammate | `roles.spec.ts`: "blocks deleting a role while staff hold it, allows after unassign", which assigns the role in the edit teammate sheet and removes it again | |
| | The teammate's navigation shows only what the role allows | None: no test signs in as the teammate. The permission variant captures show it as interface evidence (§3.1) | **Gap** for the flow's tests |

### 2.3 Emails

Rendered from Spree's own mailer previews (`spree/core/lib/spree/core/previews/`) in the browser-test Rails app's test environment, against a copy of the browser-test database, then captured in the pinned image at 1280 pixels wide. Nothing was delivered or saved: the copy was rendered inside a transaction that was rolled back. The invitation previews were asked for their built-in example invitation, so no real invitation's token reached a rendering. The templates have no dark styles, so each has one capture.

| Email | Subject | Captures |
|---|---|---|
| EM-S-01 Staff password reset | "Shop Password Reset Instructions" | As the browser-test data has it, and with the staff member given a name |
| EM-S-03 Invitation | "Invitation to join Shop" | Both, as above |
| EM-S-04 Invitation accepted | "has accepted your invitation to join Shop", where the invitee's name is blank; "Alex Doe has accepted your invitation to join Shop" once named | Both, as above |

The browser-test data's first staff member has no name, and two of the three templates show a blank where the name goes (§5). Which of these emails is sent during each flow is not checked here (§2.2).

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request.

| Variant | Role's permission keys | Main navigation | Settings navigation | Staff page (DA-SET-24) | Roles page (DA-SET-25) |
|---|---|---|---|---|---|
| Admin | The admin role: every key | Everything | Everything | Every control | Add role; the admin role opens read-only |
| Staff manager | `write_staff` | Home and Settings | Staff and Roles only | Every control | Add role; every role editable except the admin role |
| Staff viewer | `read_staff` | Home and Settings | Staff and Roles only | **Invite teammate and every row's actions still show** (§5); the server refuses each (§3.2) | No Add role; each role opens read-only, marked "Protected" (§5) |
| Store settings | `write_settings` | Home and Settings | Settings without Staff and Roles | Direct visit: the page with "No staff yet" and Invite teammate; both lists refused | Direct visit: "No roles yet"; the list refused |
| Support template | `read_orders`, `read_customers`, `read_dashboard` | Home, Orders, Customers; no Settings | None | Direct visit: as for store settings | Direct visit: as for store settings |
| Order manager template | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | Home, Orders, Customers, Loyalty | None | Not visited | Not visited |
| Merchandiser template | `write_products`, `write_categories`, `write_collections`, `write_stock` | Home, Products, Inventory, Settings | Stock locations and imports | Not visited | Not visited |
| No role in any store | None | None | None | DA-SHELL-01 "You don't have access to any store" | |

None of the three templates holds a staff key, as the work item expected.

### 3.2 What the server refuses

**Spree's own specs, at this branch, whose Spree code is `a4a1708`.** Run in this session on SQLite with Spree's test apps: the API engine's controller specs and the core engine's model specs for staff, roles, invitations, permissions and abilities. 183 examples, 0 failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-22-fb-19-batch-staff-access-part-1/backend/api-specs.json) and [core-specs.json](evidence/2026-10-22-fb-19-batch-staff-access-part-1/backend/core-specs.json).

| Endpoint or rule | Spec file (examples) | What the examples exercise, by caller |
|---|---|---|
| `PATCH /admin_users/:id` | `admin_users_controller_spec.rb` (14) | A staff JWT without staff permissions cannot promote, assign or change roles. A `write_staff` JWT can assign a role it may grant, and cannot grant admin, a role beyond its own grant, or remove a store owner. A super-admin can grant admin and cannot remove the last admin. A secret key cannot grant admin |
| `POST /invitations`, `GET /invitations` | `invitations_controller_spec.rb` (8) | A non-admin staff JWT cannot invite into admin or into a role beyond its grant, and an invitation needs a role. A super-admin can invite as admin. A secret key cannot invite into admin. The list never shows the acceptance token |
| `GET /invitations/:id/acceptance_link` | `invitations/acceptance_links_controller_spec.rb` (5) | A super-admin gets the link, and not for another store's invitation. A secret key that can only read staff is refused. A `write_staff` teammate gets it for a role it may grant, and is refused for an admin invitation |
| Invitation lookup and acceptance | `invitation_acceptances_controller_spec.rb` (9) | A wrong token or an expired invitation answers 404. Accepting checks the password of an existing account, and creates a new one |
| `/roles` | `roles_controller_spec.rb` (17) | A limited staffer can grant only keys within its own grant on this store. A secret key is bounded by its scopes. The admin role cannot be renamed, changed or deleted. A role still held cannot be deleted. Roles of another resource are not listed |
| `GET /permissions` | `permissions_controller_spec.rb` (5) | The catalog is readable by any staff JWT, and refused without a credential |
| `GET /me`, `PATCH /me` | `me_controller_spec.rb` (24) | The permission keys of the current store only. A staff member with no role who names a store is refused. Without authentication, 401 |
| Password reset | `password_resets_controller_spec.rb` (10) | No answer reveals whether an email exists. A reset revokes every earlier session |
| `Spree::Ability` | `ability_spec.rb` (27), `ability_helpers.rb` (4) | A read key grants read and admin on its subjects only; a write key grants manage; no keys grant only the staff baseline. Roles on other stores or on non-store resources do not apply in this store |
| Models | `role_spec.rb` (27), `role_user_spec.rb` (3), `invitation_spec.rb` (16), `admin_user_spec.rb` (9), `account_lockout.rb` (5) | The admin role and host-locked roles are protected; a held role cannot be deleted; an invitation needs a role; accounts lock after repeated failed sign-ins |

**What no Spree spec exercises, NOT_RUN as a spec result.** No Spree spec sends, as a staff JWT whose role does not allow it: a list request to `/admin_users`, `/invitations` or `/roles`; `PATCH` or `DELETE` on a role; `DELETE` on a teammate; resending or revoking an invitation; or asking for an acceptance link with `read_staff` only.

**An observation of the running server, not a spec.** The refusal check sent each of these, and every other staff and role request the interface offers, to the running browser-test server at `a4a1708`, as the staff viewer (`read_staff`), support and store settings teammates. All 33 requests were refused: 23 with 403 `access_denied` naming `write_staff` or `read_staff`, and 10 with 404 for a record the caller may not read ([refusals.json](evidence/2026-10-22-fb-19-batch-staff-access-part-1/backend/refusals.json)). This shows the server refused these requests at that revision. It is not one of Spree's specs and is not run in CI.

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings). None of them is about staff or roles; all seven stay open.

Some of Spree's specs above touch store boundaries: an acceptance link of another store's invitation is not found, roles of another resource are not listed, and a role held on another store does not apply. They are listed so they are not lost. They are Spree's own unit checks, not FB-03's validation, and the batch claims nothing about isolation from them. No new isolation defect was found during the batch; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-1/README.md).

### 4.1 Results, after the corrections

| ID | Case | Story | Running screen | Styles that differ, light and dark | Explained |
|---|---|---|---|---|---|
| CMP-CORE-20 | page-header-staff | Page header: Default | Staff page header | None; 938 pixels wide on both sides | |
| CMP-DUI-C-19 | external-link-in-a-description | External link: In a description | Staff page description | None | |
| CMP-DUI-P-17 | data-table-members | Data table: Default | Staff page, Members card | height | The screen lists more teammates, and its admin has no name, so one line |
| CMP-DUI-P-17 | data-table-roles | Data table: Roles | Roles page | height | The screen lists more roles |
| CMP-DUI-C-38 | relative-time-future | Relative time: Future | Staff page, an invitation's expiry | height | An inline element; the screen's table cell gives it a computed height |
| CMP-DUI-C-45 | row-actions-open | Row actions: Open | Staff page, a teammate's menu | None | |
| CMP-DUI-P-20 | dialog-invite | Dialog: Default | Invite teammate dialog | None; a `form` element on the screen only | The screen wraps the fields in a form; the story's layout matches |
| CMP-DUI-P-20 | dialog-role-required | Dialog: Field errors | The same dialog, sent without a role | background-color on the button; border colours and box-shadow on the email field; a `form` element on the screen only | On the screen Send was just clicked, so it keeps its hover colour and holds focus; in the story the email field holds focus and shows its ring |
| CMP-DUI-P-37 | sheet-edit-teammate | Sheet: Default | Edit teammate sheet | height | The screen's role list holds more roles |
| CMP-DUI-C-10 | confirm-remove-teammate | Confirm dialog: Remove teammate | Remove confirmation | border colours, box-shadow | The story opens with keyboard focus, so Cancel shows its focus ring; the screen was opened with a pointer |
| CMP-DUI-C-10 | confirm-delete-role | Confirm dialog: Delete role | Delete confirmation | border colours, box-shadow | As above |
| CMP-DUI-P-45 | toast-invitation-resent | Toast: Success | "Invitation resent" | None | |
| CMP-DUI-P-46 | tooltip-more-permissions | Tooltip: List | Roles page, "+4 more" | None | |
| CMP-DUI-C-44 | route-error-not-found | Route error boundary: Not found | A page that does not exist | height | The screen's empty state fills the page |
| CMP-DUI-P-02 | alert-sign-in-providers-failed | Alert: Destructive (#9's story) | Sign in, providers request answered with a server error | height | The sign-in card holds the alert at 384 pixels wide, the story's column at 448, so the text wraps onto more lines on the screen |
| CMP-DA-G-24 | auth-shell-forgot-password | Auth shell: With a form | Forgot password | None | |
| CMP-DA-G-24 | auth-shell-invitation-not-found | Auth shell: With a message | Accept invitation, invalid link | None | |
| CMP-DA-G-24 | no-store-access | No store access: Default | A teammate removed from the store | None | |
| CMP-DA-G-24 | permission-grid-new-role | Permission picker: Nothing granted | New role sheet, the grid | None | |
| CMP-DA-G-24 | role-sheet-new-role | Role sheet: New role | New role sheet | border colours, box-shadow | Focus modality: the story's first template button shows its focus ring |
| CMP-DA-G-24 | role-sheet-admin-role | Role sheet: Protected role | The admin role, read-only | None | |

### 4.2 Corrections made to the stories

Each was a defect in the story, fixed there; no Spree component changed. The comparison was run again after them, and all 21 cases and the refusal check passed.

| # | Story | Was | Now, as on the screen |
|---|---|---|---|
| 1 | Page header | Sat in a narrower column than the screen's | Runs across the settings column and its padding, 938 pixels, and the page column for the detail stories |
| 2 | Dialog (the invite dialog) | The role field showed "Select a role" | The role field is blank: Spree's value renderer answers the empty value, so its placeholder never shows |
| 3 | Sheet (the edit teammate sheet) | No "Manage roles" link; Save enabled | "Manage roles" below the role list; Save disabled until something changes |
| 4 | Auth shell, With a form (forgot password) | No way back; nothing focused | "Back to sign in" below the button; the email field focused |
| 5 | Data table, Roles | "+4 more" was plain text; the name sat outside the column wrapper | "+4 more" is a focusable button whose tooltip lists the rest; the name sits in its column wrapper |
| 6 | Permission picker | The page's text size | The sheet's 14 pixel text size |

### 4.3 Defects found before the comparison

- **Every role sheet story was read-only.** The role sheet's permission catalog and the reader's own permissions were stored under the same query key in Storybook, because no store was set, so the catalog answer replaced the reader's permissions. In the dashboard they are keyed by different stores. Stories now set the store the component sits on, which keys them apart. After the fix, Save appears, templates grant their permissions, and Edit and Duplicate show their roles' boxes checked.
- **Two images were wrong when first looked at.** The sheet's Scrolled story did not scroll, because the sheet's opening focus scrolled back to the top; it now waits for focus first. The tooltip's List story opened below its trigger for lack of room; its frame is taller, so it opens above as on the roles page.

## 5. Spree's behaviour found, recorded and not changed

Each is how Spree works at `a4a1708`. The batch reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | The staff page shows Invite teammate and every row's actions to a teammate who may only read staff. The server refuses each request (§3.2) | DA-SET-24, staff viewer |
| B2 | A direct visit to Staff or Roles without the staff scope shows the page itself, with "No staff yet" or "No roles yet", while its list requests are refused. "Not authorized" (DA-SHELL-02) appears only for a plugin route that declares a permission subject; no stock route does | DA-SET-24 and DA-SET-25, support and store settings |
| B3 | The roles page hides Add role from a teammate who may only read staff | DA-SET-25, staff viewer |
| B4 | The role sheet marks a role "Protected" whenever the reader cannot change it, including a mutable role opened by a read-only teammate, and while a role is still loading. Its hint then reads "This role is protected and cannot be edited." | DA-SET-25, staff viewer; the role sheet's Loading story |
| B5 | The admin role's read-only sheet shows its permission boxes unchecked, while the roles list shows it as "Full access" | DA-SET-25, the admin role |
| B6 | The invite dialog's role field never shows its "Select a role" placeholder | DA-SET-24, invite dialog |
| B7 | Resending an invitation has no confirmation; it shows a toast | DA-SET-24 |
| B8 | In EM-S-04 the greeting and the invitee's name are blank when the staff member has no name, and in EM-S-03 the inviter's name is. EM-S-01's greeting and EM-S-03's greeting fall back to the email address, and so does the accept invitation page | EM-S-03, EM-S-04 |

B1, B2 and B4 matter for Liquorify's later staff work; whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own staff access changes (F1).

## 6. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-staff-access-and-shell.md) §7.6, without changing the proposal's text:
- DA-SET-24 invites through a dialog, and edits a teammate in a sheet; there is no invite sheet.
- §2.2's "`read_staff` only: controls hidden" holds for the roles page and not the staff page (B1, B3).
- §2.2's "a direct visit shows DA-SHELL-02, not authorized" does not hold for the stock staff and roles routes (B2).
- §2.1's "resend confirmation" does not exist (B7).
- FL-24's "give it to a teammate" is covered by `roles.spec.ts` "blocks deleting a role while staff hold it, allows after unassign".

## 7. Gaps

Each names what is missing, the check made instead and what would close it.

| Gap | Check made instead | What would close it |
|---|---|---|
| DA-AUTH-03 "saved" | The reset request in Spree's API spec; the other DA-AUTH-03 states captured | A browser test or capture with a valid reset token |
| DA-SHELL-02 "not authorized" on a running screen | The route error boundary's Not authorized story, against its source | A plugin route that declares a subject, which the baseline does not have |
| Whether EM-S-01, EM-S-03 and EM-S-04 are sent during their flows | Rendered from Spree's previews; Spree's API spec for the reset event | A browser test that reads the sent mail |
| The teammate's own navigation after a role is given (FL-24, last step) | The permission variant captures (§3.1) | A browser test that signs in as the teammate |
| Signing in through a real identity provider (CAP-04-02) | The provider states, reached by answering the providers request | A configured provider |
| The slot (CMP-CORE-34) on a running screen | Its four stories, against its source | A stock screen that registers an entry |
| 52 of the 72 stories not compared by the script | 12 show a state seen in a running-screen capture; 40 checked against their source only. Each is named in the [image review list](2026-10-22-fb-19-batch-staff-access-part-1-image-review.md) | Running screens that show those states |
| Requests no Spree spec sends (§3.2) | The refusal check's observation | Specs in Spree's suites, which this batch does not change |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 |
| The pilot's 35 source-only stories, its pointer-opened cart drawer and OA-1; #9's 83 source-only stories | Part 1 compared #9's destructive alert, so 82 of #9's stay open. Part 1's captures also show a disabled and an invalid input and a label beside a control, but #9's stories for them were not compared | Running screens that show those states |

## 8. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Packages 39703670323](https://github.com/pateldhruval872/liquorify/actions/runs/39703670323) | `9b0b0ad`, the work item and the LIQ-010 amendment only | The dashboard's browser tests passed in all four shards, at Spree code identical to `a4a1708` |
| [Tests 39703670458](https://github.com/pateldhruval872/liquorify/actions/runs/39703670458) | `9b0b0ad` | `PostgreSQL - core (1/3)` failed; every other job passed. The commit changed only records, so the failure is not this batch's; it is examined in the pull request |

The runs at the revision that carries this record are recorded in the pull request; the visual check is run a second time on the same revision for criterion 8.

**Local checks, in this session, before the commit.** Lint (Biome), the type check and the fixture tests passed; the token check and the coverage report ran. Every visual comparison passed in the pinned image, 454 of 454 for 227 stories in two modes, the older stories included under the stricter check of §1. The comparison and the refusal check passed against the browser-test server.

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the browser tests' data on screens.** Names, counts and icons differ on purpose.
- **Seeded data.** The variants' roles and teammates were added to the browser-test database through the Admin API. They exist only in that database, and Spree's tests and fixtures are unchanged.
- **States reached by holding or answering a request** show how the screen renders that answer, not that the server would send it.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL.
- **Size.** The reference images are 7.1 MB and the evidence 13 MB, more than the work item's estimate for both parts together: overlays are captured as whole 1280 by 800 frames, and the screens as whole 1280 by 960 pages. The evidence images are lossless WebP, converted from the PNG captures with every pixel checked equal, which keeps them at less than half the size: 8.8 MB in place of 21 MB for the screens.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-22-fb-19-batch-staff-access-part-1/README.md) lists every capture, comparison, email and result file, by inventory ID. The [image review list](2026-10-22-fb-19-batch-staff-access-part-1-image-review.md) lists every reference image for the owner's review.
