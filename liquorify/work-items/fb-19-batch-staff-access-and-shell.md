---
title: FB-19 batch, staff access and the dashboard shell
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-21
updated: 2026-10-23
---

# FB-19 batch: staff access and the dashboard shell

The first FB-19 batch organised by product area, under [LIQ-010 §12.1](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) as amended in LIQ-010 0.4. It reproduces what Spree already has for staff access and the admin dashboard's shell. Nothing here changes Spree's code or adds a Liquorify feature.

**Status.** PROPOSED. The owner asked on 2026-10-21 for the proposal below, and on 2026-10-22 instructed that the batch proceed in two pull requests, with this proposal, its 11 acceptance criteria and the exact LIQ-010 §12.1 amendment included for review ([LIQ-001 §1](../LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)). This work item, the amendment and part 1's evidence are reviewed together in part 1's draft pull request. Sections 1 to 6 are the proposal as the owner saw it, with the proposal's "Part A" and "Part B" called part 1 and part 2 here, because LIQ-010 already has a Part A and a Part B. Section 7 adds what the owner's instruction of 2026-10-22 asked for, and marks each addition.

**Part 1.** Built and recorded in the [part 1 verification record](../verification/2026-10-22-fb-19-batch-staff-access-part-1.md), with its [image review list](../verification/2026-10-22-fb-19-batch-staff-access-part-1-image-review.md). The owner merged #11 on 2026-10-22 and accepted part 1, leaving its gaps pending ([record](../verification/2026-10-22-fb-19-batch-staff-access-part-1-merge.md)).

**Part 2.** Built and recorded in the [part 2 verification record](../verification/2026-10-22-fb-19-batch-staff-access-part-2.md), with its [image review list](../verification/2026-10-22-fb-19-batch-staff-access-part-2-image-review.md), in #14. On 2026-10-23 the owner accepted its reference images and diagnostic fidelity at `4e9c196` and answered its gaps ([record](../verification/2026-10-22-fb-19-batch-staff-access-part-2.md#11-the-owners-review-2026-10-23)); its merge is the owner's. CAP-04-05 stays PARTIAL until the platform batch's step P6 adds the five browser tests G-22 names.

What part 1 found that differs from this proposal is in §7.6; the proposal's text is left as the owner saw it.

## 1. Outcome and summary

The batch covers staff access and the admin dashboard's shell: the first half of [LIQ-006 §4](../LIQ-006-product-capability-baseline.md#4-authentication-staff-and-access), "Authentication, staff and access". It is the frame every later dashboard screen sits in, and the roles it sets up are what every later batch needs for its permission variants.

- **Bounded:** 8 screens, 4 overlays, 3 flows, 3 staff emails and 38 new components, in two pull requests.
- **Same shape as later batches:** screens, workflows, permissions, meaningful states and running-screen evidence progress alongside component coverage.
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change. Liquorify's own changes to staff access (the public sign-up page and owner-only invitations in F1) stay deferred.
- **Before it starts:** #8 is merged and accepted, and #9 finishes its own comparison with running screens, because this batch reuses #9's primitive stories. Both hold since 2026-10-22: #8 merged, and #9's comparison is recorded ([fidelity record](../verification/2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity.md)); the owner merged #9 on 2026-10-22.

## 2. Scope

The batch covers four of the nine features in LIQ-006 §4, every screen and overlay those features use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the flows that cross them. Dispositions such as "Reuse" or "Not needed yet" do not narrow the baseline, so the sign-in provider states on the sign-in screen are included.

| Feature (LIQ-006 §4) | Screens and overlays | Flows | Emails | Browser tests |
|---|---|---|---|---|
| Staff sign-in and password reset, with the sign-in provider states | DA-AUTH-01, DA-AUTH-02, DA-AUTH-03 | FL-03 | EM-S-01 | `auth.spec.ts` |
| Staff invitations | DA-SET-24, DA-AUTH-04, DA-SHELL-01 | FL-02 | EM-S-03, EM-S-04 | `invitation-acceptance.spec.ts`, `staff.spec.ts` |
| Roles and permissions, with role templates | DA-SET-25, DA-SHELL-02 | FL-24 | None | `roles.spec.ts`, `staff.spec.ts` |
| Staff profile, language and theme, command palette, notifications | DA-OVL-01 to DA-OVL-04 | None | None | `profile.spec.ts`, `command-palette.spec.ts` |

### 2.1 Meaningful states to capture

These come from LIQ-008, plus the shared list and detail states that apply.

| Screen or overlay | States |
|---|---|
| DA-AUTH-01 Sign in | Default; providers loading; providers failed; wrong credentials; provider error on return; fresh installation pointing to setup |
| DA-AUTH-02 Forgot password | Default; sending; sent |
| DA-AUTH-03 Reset password | Default; missing or invalid link; field errors; saved |
| DA-AUTH-04 Accept invitation | New account; existing account; who invited and as which role; invalid link; field errors |
| DA-SHELL-01 Store selection | Opens the first store; no store access |
| DA-SHELL-02 Not found inside a store | Not found; not authorized |
| DA-SET-24 Staff | Loading; populated; pending invitation; invite sheet; a role is required; resend, revoke and remove confirmations |
| DA-SET-25 Roles | Loading; populated; create from the grid or a template; the admin role read-only; a role in use cannot be deleted; delete confirmation |
| DA-OVL-01 App shell | Expanded and collapsed sidebar; settings navigation; mobile top bar; store switcher open; user menu with language and theme |
| DA-OVL-02 Command palette | Open; results; nothing matches |
| DA-OVL-03 Notifications | Populated; empty |
| DA-OVL-04 Profile dialog | Default; field errors |

Each state is captured in light and dark at 1280 pixels, and the shell's mobile top bar also on a phone width.

### 2.2 Permission variants

- **Admin role:** full access; the roles screen shows the admin role read-only.
- **Custom role with `write_staff`:** the staff and roles screens with every control.
- **Custom role with `read_staff` only:** the same screens with create, edit and delete controls hidden.
- **Role without the `staff` scope:** the navigation entry is hidden, and a direct visit shows DA-SHELL-02, "not authorized".
- **The three templates (order manager, merchandiser, support):** the sidebar each one produces, which is the shell's permission evidence. None of them covers `staff`.
- **No role in any store:** DA-SHELL-01, "no store access".

### 2.3 Left out, and where it goes

- API keys, OAuth clients, allowed origins, AI agent connections, webhooks and integrations (the rest of §4): the next backend batch.
- First-run setup (DA-SETUP-01, FL-01): the setup and stores batch (LIQ-006 §3).
- Seller sign-in, team and shell (SP-AUTH-01 to SP-AUTH-04, SP-SET-06, SP-SHELL-01): the marketplace batch (§10).
- Shopper accounts on the storefront (SF-ACC-01 to SF-ACC-04): the storefront's customers batch (§8).
- The CSV import wizard (DA-OVL-05): the catalog batch that first uses it.
- Figma (FB-20 and FB-21): blocked on OA-5. The batch records the states as component properties and the flows by ID, ready for Figma.

## 3. Components

The screens use 53 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md): 38 have no stories yet, and 15 are already covered by the pilot or #9. The list comes from what the screens import at `main` `9cc46d3`; the batch's first step confirms it against the running screens.

| Layer | New in this batch | Part |
|---|---|---|
| Primitives (CMP-DUI-P) | `dialog` (20), `sheet` (37), `tooltip` (46), `data-table` (17), `toast` (45) | 1 |
| Primitives (CMP-DUI-P) | `sidebar` (38), `dropdown-menu` (21), `command` (15) | 2 |
| Composed (CMP-DUI-C) | `confirm-dialog` (10), `external-link` (19), `relative-time` (38), `route-error-boundary` (44), `row-actions` (45) | 1 |
| Composed (CMP-DUI-C) | `language-menu-items` (30), `search-input` (47), `theme-toggle` (53) | 2 |
| Framework (CMP-CORE) | `page-header` (20), `slot` (34) | 1 |
| Framework (CMP-CORE) | `app-shell` (02), `app-sidebar` (03), `image-upload-field` (11), `mobile-top-bar` (17), `nav-main` (19), `settings-sidebar` (29), `sheet-top-bar` (30), `sidebar-search` (31), `sidebar-user` (32), `skip-link` (33), `store-switcher` (36), `top-bar-breadcrumbs` (39) | 2 |
| Admin dashboard (CMP-DA-G-24, top level) | `auth-shell`, `no-store-access`, `role-sheet`, `permission-picker` | 1 |
| Admin dashboard | `command-palette` (CMP-DA-G-05); `notifications`, `release-notes`, `profile-dialog` (CMP-DA-G-24) | 2 |

Part 1 has 16 new components and part 2 has 22.

**Already covered, reused here:** `button`, `select` and `back-button` from the pilot; `alert`, `avatar`, `badge`, `breadcrumb`, `card`, `checkbox`, `empty`, `field`, `input`, `label`, `skeleton` and `textarea` from #9. The batch's running screens give these their first comparison in a real screen, which can close part of the pilot's and #9's source-only gaps.

## 4. Delivery

The batch lands in two pull requests, each with its own verification record, so each stays small enough to review.

1. **Part 1, sign-in, invitations, staff and roles:** DA-AUTH-01 to DA-AUTH-04, DA-SHELL-01, DA-SHELL-02, DA-SET-24, DA-SET-25; flows FL-02, FL-03 and FL-24; emails EM-S-01, EM-S-03 and EM-S-04; the 16 part 1 components. It also amends [LIQ-010 §12.1](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) so that every batch carries screens, flows, permissions and states alongside its components.
2. **Part 2, the shell and its overlays:** DA-OVL-01 to DA-OVL-04, the template sidebars, and the 22 part 2 components. It starts after part 1's review, so any correction part 1 finds reaches it first.

**Base branch.** Part 1 builds on #9's branch, because it reuses #9's primitive stories, and moves to `main` once #9 merges, as #8 did after #6.

**Evidence in each part:**

- stories and reference images, light and dark, compared by the advisory visual check;
- running-screen captures of every state and permission variant, made with the pilot's comparison scripts on the dashboard's browser-test set-up at the part's revision, with the staff members and roles seeded for the variants;
- the staff emails rendered from Spree's mailer previews in the test app, or recorded as NOT_RUN if the previews cannot be reached there;
- the browser tests for each flow, run in CI on the part's revision, with each test title mapped to its flow step;
- a verification record, an image review list by inventory ID, and an evidence index.

**Size, estimated from #9 and the pilot:** about 140 stories and 280 reference images (about 1.3 MB) across both parts, and about 120 running-screen captures with their computed styles (about 5 MB).

## 5. Acceptance criteria

Each part passes when all of these hold for its own scope; the batch passes when both parts do. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope feature is mapped to its screens, flows, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the part's screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen and overlay is captured on the running dashboard, at the pinned revision, in each state listed under Scope | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant shows what its role allows: controls hidden without write, the entry hidden without read, "not authorized" on a direct visit, and "no store access" without a role | Captures per variant, with the role's permission keys |
| 5 | Each flow is mapped step by step to its screens and emails, and the browser tests covering it pass on the part's revision; a step no test covers is recorded as a gap | Flow map with test titles and the CI run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles, published as for the pilot |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | Recorded as for the pilot, until D5 decides how acceptance is recorded |

The gaps the pilot left open stay open unless this batch's screens close one, in which case the record says which.

## 6. Risks, dependencies and open questions

**Dependencies**

- #8 is merged and accepted before part 1 starts. Done: #8 merged on 2026-10-22.
- #9 finishes its own comparison with running screens and its review; part 1 builds on it. Both are done: the comparison is recorded, and the owner merged #9 on 2026-10-22.
- Figma work waits for OA-5. The storefront's end-to-end gap (OA-1) does not affect this backend batch.

**Risks, with the fallback**

| Risk | Fallback |
|---|---|
| The browser-test set-up has no staff members holding custom roles for the permission variants | The capture scripts seed them through the Admin API in the test app, without changing Spree's tests |
| The sign-in provider states need a configured provider, which the test app does not have | Stories mock the provider list; the running-screen captures intercept that request, or record the state as a coverage gap |
| Notifications and release notes ask an outside service for update information | Stories mock it; running-screen captures block the request and record what the screen shows |
| The mailer previews are not reachable from the test app | The emails are recorded as NOT_RUN and mapped only |
| The random Hungarian-address spec (#10) turns Tests red | Re-run once and record it, as for #9; #10 stays a draft for separate review |

**Open questions, as asked, and their answers**

- *Should the storefront's first product-area batch run in parallel with part 2?* The owner answered on 2026-10-22: the storefront's shopper accounts baseline may run alongside this batch in a separate pull request.
- *Is it acceptable for this batch to amend LIQ-010 §12.1?* The owner asked for the exact amendment to be included for review. It is LIQ-010 0.4 in part 1's pull request (§7.2).

## 7. Added on 2026-10-22, at the owner's instruction

Each addition answers part of the owner's instruction of 2026-10-22. None changes sections 1 to 6.

### 7.1 Links from capabilities to evidence

The owner asked that the batch process link capabilities, screens, workflows, permissions, meaningful states and components to their inventory IDs and verification evidence.

- **Capability IDs.** LIQ-006 0.3 gives every feature row a stable ID, `CAP-<section>-<row>`, so a capability can be linked like a screen or a component.
- **The batch map.** LIQ-010 0.4 adds §10.1, which sets the columns every batch map has, and §12.1 makes the map the first step of every batch. This batch's map is below. Its evidence column is planned here and completed with results in each part's verification record.

| Capability | Screens and overlays | Flows | Emails | Permission | Meaningful states | Components | Evidence planned | Part |
|---|---|---|---|---|---|---|---|---|
| CAP-04-01 Staff sign-in and password reset | DA-AUTH-01, DA-AUTH-02, DA-AUTH-03 | FL-03 | EM-S-01 | Public | §2.1 rows for DA-AUTH-01 to 03 | `auth-shell`; reused `alert`, `button`, `card`, `input`, `label`, `skeleton` | Stories; captures of each state; `auth.spec.ts` titles per FL-03 step; EM-S-01 preview or NOT_RUN | 1 |
| CAP-04-02 Sign-in through an identity provider | DA-AUTH-01, its provider states only | None in LIQ-008 | None | Public | Providers loading; providers failed; provider error on return | `auth-shell`, the provider list in `login.tsx` | Stories with a mocked provider list; captures with the request intercepted, or a gap. Signing in through a real provider is out of scope: none is configured | 1 |
| CAP-04-03 Staff invitations | DA-SET-24, DA-AUTH-04, DA-SHELL-01 | FL-02 | EM-S-03, EM-S-04 | `staff`; DA-AUTH-04 public with the link; DA-SHELL-01 any signed-in staff | §2.1 rows for DA-SET-24, DA-AUTH-04 and DA-SHELL-01 | `dialog`, `sheet`, `data-table`, `toast`, `confirm-dialog`, `relative-time`, `row-actions`, `page-header`, `external-link`, `no-store-access`, `slot`; reused `avatar`, `badge`, `checkbox`, `empty`, `field`, `select` | Stories; captures of each state and variant; `invitation-acceptance.spec.ts` and `staff.spec.ts` titles per FL-02 step; email previews or NOT_RUN; the three permission claims (§7.3) | 1 |
| CAP-04-04 Roles and permissions, with role templates | DA-SET-25, DA-SHELL-02 | FL-24 | None | `staff`; DA-SHELL-02 any signed-in staff | §2.1 rows for DA-SET-25 and DA-SHELL-02 | `role-sheet`, `permission-picker`, `tooltip`, `route-error-boundary`, and part 1's shared components above; reused `textarea` | Stories; captures per state and per permission variant (§2.2); `roles.spec.ts` and `staff.spec.ts` titles per FL-24 step; the three permission claims (§7.3) | 1 |
| CAP-04-05 Staff profile, language and theme, command palette, notifications | DA-OVL-01 to DA-OVL-04 | None in LIQ-008 | None | Any signed-in staff; the navigation follows every scope the role reads | §2.1 rows for DA-OVL-01 to 04 | Part 2's 22 components (§3) | Stories; captures, including the three template sidebars; `profile.spec.ts` and `command-palette.spec.ts` titles; outside update requests blocked and recorded | 2 |

The flows, step by step, with the browser test titles that cover each step at `main` `a4a1708`. Part 1's record confirms them at its revision and records each uncovered step as a gap.

| Flow | Step | Covered by |
|---|---|---|
| FL-03 Staff password reset | DA-AUTH-01: reach password reset | `auth.spec.ts`: "reaches the forgot-password page from the login form" |
| | DA-AUTH-02: request a link | "confirms the reset request without revealing whether the email exists" |
| | EM-S-01: the email | No browser test; Spree's mailer spec only. A gap for the flow |
| | DA-AUTH-03: choose a new password | Only the missing-link state: "shows an invalid-link message when the reset token is missing". Saving a new password is a gap |
| | DA-AUTH-01: sign in again | "signs in via the login form and lands on the dashboard" (with an existing password) |
| FL-02 Invite a staff member | DA-SET-24 → EM-S-03 → DA-AUTH-04 → EM-S-04 → DA-SHELL-01 | `invitation-acceptance.spec.ts`: "admin invites a teammate and the invitee signs up via the link", which takes the link from the screen rather than the email; and "shows an error for an invalid token". `staff.spec.ts`: "an invitation needs a role", "resends a pending invitation", "revokes a pending invitation after confirming". Whether EM-S-03 and EM-S-04 are sent is not checked in the browser; a gap for the flow |
| FL-24 Set up a role and give it to a teammate | DA-SET-25: create or edit a role | `roles.spec.ts`: "creates a role from the permission grid and edits it", "starts from a template", "duplicates a role", "the admin role opens read-only", "blocks deleting a role while staff hold it, allows after unassign" |
| | DA-SET-24: give it to a teammate | `staff.spec.ts`: "renames a teammate and then removes them from the store"; whether a role change is covered is confirmed in part 1 |
| | The teammate's navigation shows only what the role allows | No browser test signs in as the teammate. Part 1's permission variant captures show it as interface evidence; it stays a gap for the flow's tests |

### 7.2 The LIQ-010 §12.1 amendment

The exact amendment is the change to LIQ-010, from 0.3 to 0.4, in part 1's pull request: §10.1 is added and §12.1 is replaced. The pull request's diff shows every changed line, and the 0.3 text stays the governing version on `main` until the owner merges the change. What it changes:

- a batch covers a product area, and starts with a work item and its map;
- running screens, flows and emails become steps of every batch, beside the stories;
- permissions are recorded as three separate claims (§7.3);
- gaps carry what is missing, the check made instead and what would close them, and stay open until a batch closes them.

What it keeps unchanged: the arrangement rule, looking at every image, the committed reference images reviewed in the pull request, the visual check's tolerance and advisory status, the diagnostic comparison and the owner's acceptance of fidelity from the evidence.

### 7.3 What the interface shows is not what the server enforces

The owner asked that interface permission coverage stay distinct from verified backend authorization and tenant isolation. Criterion 4 is about the interface only. Two criteria are added, numbered after the 11 so the original numbering stays:

| # | Criterion | Evidence |
|---|---|---|
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs that exercise the part's endpoints for each role or key, runs them at the part's revision, and lists what they exercise. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run, with the examples listed by endpoint and permission. For part 1: Spree's controller specs for staff, roles, invitations, invitation acceptances, permissions and password resets, and the ability spec |
| 13 | Tenant isolation is recorded as NOT_RUN for the batch, with links to the open isolation findings, unless FB-03's validation has run at the part's revision. The batch claims nothing about it. A new isolation defect found during the batch is reported to the owner privately and is not published in either public repository while it is open | The record's isolation section |

Neither changes Spree's code or adds a test to Spree's suites.

### 7.4 What the batch keeps from the earlier requirements

- **Screenshots:** every story has a committed reference image for each theme, made in the pinned image and looked at before committing; the visual check compares them under the measured tolerance, stays advisory, and never writes or accepts an image.
- **Fidelity:** each story is compared with its running screen, the comparison is diagnostic, and a defect is fixed in the story, never in Spree's component.
- **Review:** the owner reviews the images and the evidence in the pull request, and accepts them; until D5, acceptance is recorded as for the pilot.
- **Surfaces:** #9's comparison found that the sign-in pages sit on the page colour, not the card colour every story now sits on, so part 1's sign-in stories need the page colour ([fidelity record](../verification/2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity.md) E5).

### 7.5 Gaps known before the work starts

These are recorded now so none is lost. Each part's record says which it closes.

| Gap | What would close it |
|---|---|
| Signing in through a real identity provider (CAP-04-02) | A configured provider, which the baseline does not set up |
| Whether EM-S-01, EM-S-03 and EM-S-04 are sent during their flows | Spree's mailer specs show they render; no browser test sees them sent. Mailer previews show what they look like |
| Saving a new password on DA-AUTH-03 | A browser test with a valid reset token; Spree's suites are not changed by this batch |
| The teammate's own navigation after a role is given (FL-24, last step) | A browser test that signs in as the teammate |
| Tenant isolation (criterion 13) | FB-03's validation and the fixes for ISO-1 to ISO-7 |
| The pilot's 35 source-only stories, its pointer-opened cart drawer, OA-1, and #9's 83 source-only stories | Running screens that show those states; this batch can close some of #9's (§3) |

### 7.6 Corrections found in part 1

Part 1's running screens and tests showed where this proposal did not match Spree at `a4a1708`. The proposal's text above is unchanged; these corrections govern, and part 2 starts from them. Each is recorded in the [verification record](../verification/2026-10-22-fb-19-batch-staff-access-part-1.md) §5 and §6.

| Where | The proposal says | Spree does |
|---|---|---|
| §2.1, DA-SET-24 | An invite sheet | Invites through a dialog, and edits a teammate in a sheet |
| §2.1, DA-SET-24 | A resend confirmation | Resends at once and shows a toast; there is no confirmation |
| §2.2, `read_staff` only | Controls hidden | Hidden on the roles page only. The staff page keeps Invite teammate and every row's actions, and the server refuses each request |
| §2.2, a role without the `staff` scope | A direct visit shows DA-SHELL-02, "not authorized" | A direct visit shows the staff or roles page with an empty list, while the list requests are refused. "Not authorized" appears only for a plugin route that declares a permission subject |
| §7.1, FL-24 | Whether giving a role to a teammate is covered is confirmed in part 1 | Covered: `roles.spec.ts`, "blocks deleting a role while staff hold it, allows after unassign", assigns the role in the edit teammate sheet |

Part 1 also closed one of #9's source-only stories (§7.5): #9's destructive alert was compared with the sign-in page's providers alert.

### 7.7 Corrections found in part 2

Part 2's running screens showed where this proposal did not match Spree at `a4a1708` for the shell. As in §7.6, the proposal's text is unchanged and these corrections govern. Each is recorded in the [part 2 verification record](../verification/2026-10-22-fb-19-batch-staff-access-part-2.md) §5 and §6.

| Where | The proposal says | Spree does |
|---|---|---|
| §7.1, CAP-04-05's evidence | Outside update requests blocked and recorded | The update check is made by Spree's server, not the browser, and the test environment switches it off. The captures blocked and recorded every request that would have left the local servers instead; there were none |
| §2.1, DA-OVL-03 | A "populated" state | The only notification is a newer release. With the check switched off, the state is reached only by answering the check in the browser |
| §2.1, DA-OVL-04 | A "field errors" state | The server saved every value tried, a 300-letter name and an unknown language included, so the state is reached only by answering the save |
| §2.2, the three templates | The sidebar each one produces | Captured in part 1, and compared with its story in part 2 |

Part 2 also showed the teammate's own navigation after a role is given, which part 1 left as a gap (§7.5).

## 8. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Protected only where FB-19 already is: it adds stories, mocks, scripts, reference images and records, and no dependency, CI step or application code. Seeding roles and staff for the captures writes only to the browser-test database.
- **Release impact.** None. Nothing is deployed.
- **Verification.** Each part's verification record in `liquorify/verification/`, with the published evidence.
