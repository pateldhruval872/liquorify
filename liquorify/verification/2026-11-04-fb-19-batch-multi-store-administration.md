---
title: FB-19 batch 15, multi-store administration
record: verification
work_item: FB-19
date: 2026-11-04
verifier: Claude (automated session, thread "Verify Spree multi-store administration"); not independent review
result: PASS for the map, the running-screen captures and Spree's own specs, with one defect found. CAP-11-12 is mapped to its four screens, FL-02's step with an existing account, the teammate's two roles and the browser tests, with what no test covers recorded as G-72. Every state the work item lists is captured, 21 states in 42 captures in light and dark, at 1280 pixels, with the switcher also at 768 pixels and the phone's top bar and drawer at 390. No component lacked a story, so none was added. Spree's own specs for the current admin, invitations, invitation acceptance, staff and role assignment ran at the batch's Spree code, 187 examples in 17 files, with no failures. The defect is SD-18. After a teammate switches store with the store switcher, the dashboard keeps the previous store's permissions until the page is reloaded. Its navigation and its pages offer what the previous store's role allows. The server answered each store by that store's roles. It refused all 32 store-scoped requests the wrong navigation led to, and nothing was created. So SD-18 is a dashboard display defect, not a tenant-isolation finding. Seven other behaviours are recorded and not changed. CAP-11-12 is PARTIAL with a failing part, SD-18. No invitation link, token or password is in any committed file. Tenant isolation is NOT_RUN. Acceptance is recorded with the merge, as delegated acceptance under the owner's delegation of 2026-11-04, never as the owner's review
---

# FB-19 batch 15, multi-store administration

**Claim.** The [multi-store administration batch](../work-items/fb-19-batch-multi-store-administration.md) reproduces what Spree already does for CAP-11-12: one staff account that holds a different role in each of two stores. It captures the four screens involved on Spree's running dashboard, follows FL-02's acceptance step with an account that already exists, and runs Spree's own specs for the server's side. It follows the owner's answers of 2026-11-04: lane C once a slot was free, and the second role made from Spree's support template (decisions 7 and 8). It changes no Spree code, no storefront code and no workflow, and adds no Liquorify feature. Whether one Liquorify login may be staff at two businesses stays the open product decision in LIQ-006 §11. This batch decides nothing about it.

**Revisions.**

| What | Revision |
|---|---|
| Script and records | Pull request [#49](https://github.com/pateldhruval872/liquorify/pull/49), branch `claude/project-thread-06e227`. It started from `main` at `68236c59`. `725d5cf9` added the capture script, `627ef7ec` made it record the server's answers while SD-18's navigation shows, and `1320592d` made it wait for the navigation to settle before reading it. `71d29b98` merged `main` at `91c75082`, which adds #47's records and changes no code. The commit after it adds this record and the evidence |
| Spree's code: the dashboard, its packages, the SDKs and the gems | `68236c5`, `main` at the branch's start. The branch changes none of it: `git diff` against `68236c59` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk`, `packages/seller-sdk`, `spree/` and `.github/` is empty, before and after the merge of `main` |
| Running screens | The admin dashboard built at that code and served with `vite preview`, against the dashboard browser tests' own Rails server, database and fixtures, started as their suite starts them (`fidelity/stack.spec.ts`), on ports of this session's own. The browser is the pinned Playwright 1.64.1 image. Captures are 1280 by 960 pixels, 768 by 960 for the narrow switcher, and 390 by 844 for the two phone states. The final captures ran from `1320592d` on a freshly started server, and all six of the script's tests passed |
| Spree's specs | At `68236c5`, on SQLite with Spree's API and core test apps, locally with Ruby 3.3.6. CI runs Ruby 4.0 |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-multi-store-administration.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | CAP-11-12 is mapped to its screens, FL-02's existing-account step, the teammate's roles, its states and the browser tests, with what no test covers recorded as a gap | PASS: the map in §2 has the four screens, FL-02's step with an existing account, the admin role in Shop and the support role in Winkel, the 21 states, and Spree's browser tests that come nearest. No browser test covers a teammate in two stores, switching between their stores, or joining a second store with an existing account (G-72) |
| 2 | Every state in §2.1 is captured on the running dashboard at the pinned revision | PASS: every listed state is captured, in 42 captures, each in light and dark (§2.1). Two listed states do not appear where the work item expected them. After a switch to Winkel, the navigation stays the admin's, and back in Shop it stays the support role's (SD-18). The support role's navigation in Winkel and the admin's in Shop are captured once the page is opened by its address or reloaded. The switcher shows from 768 pixels; a phone draws none (B2), so its top bar and drawer are captured without one |
| 3 | Any component found without a story gets one for each state, with a reference image, and the visual check passes twice in CI | PASS, with nothing to add: every component on these screens has its stories from the staff access batch (§4). The store switcher's Open and One store stories were set beside the running switcher in both themes. No story or reference image changed, so no visual check run is needed for this criterion |
| 4 | Spree's code, the storefront and every workflow outside Storybook are unchanged | PASS: the pull request changes three files in `packages/liquorify-storybook/fidelity/` and records in `liquorify/`. It changes no workflow, Storybook's included |
| 5 | The records are updated: the verification record, LIQ-004, the platform work item's "left out" line, LIQ-009 if a story was added, and the README index | PASS: this record, the evidence index, LIQ-004's batch 15 row, progress rows, SD-18, G-72 and lanes, the platform work item's "left out" line, the work item and the README index. LIQ-009 is unchanged, because no story was added |
| 6 | The server's side is recorded from Spree's own specs, run at the batch's revision. What no spec exercises is NOT_RUN | PASS for what Spree's specs exercise: 187 examples in 17 files, no failures and none pending (§3.2). They include the current admin's answers for a staff member with different roles in two stores and for one with no role, the invitation and its acceptance with an existing account, and role assignment. What no spec sends is NOT_RUN and joins G-11. That includes each request the support role makes in Winkel. The 32 refusals observed during SD-18 were not tests (§5.1) |
| 7 | Tenant isolation is NOT_RUN, with links to the open isolation findings; no check touches a store the teammate holds no role in | NOT_RUN (§3.3). ISO-1 to ISO-7 stay open. The teammate's checks open only Shop and Winkel while they hold a role in both, and only Shop once they have left Winkel. Nothing was probed across stores |
| 8 | No invitation link, token or password appears in any committed file | PASS: before each push, every line the pull request adds was searched for invitation addresses, tokens, keys and passwords, and compared with the local values the run used. Nothing matched (§8). The script reads each invitation link through the Admin API, keeps it in memory, and writes `<invitation>` in its notes. The password is the shared constant `staff.ts` already holds, imported and never written out |
| 9 | Acceptance of the screen evidence | Recorded with the merge, as delegated acceptance under the [owner's delegation of 2026-11-04](2026-11-04-delegated-acceptance-and-merging.md), in this batch's merge record, never as the owner's review (§6). G-72 is the owner's to answer (§7) |

## 1. What was built

**The capture script, `fidelity/multi-store.spec.ts`.** It runs six tests in order, with the dashboard browser tests' own server and fixtures. The set-up uses the Admin API, signed in as the fixtures' admin, who holds the admin role in both stores. The fixtures already give the server two stores, Shop and Winkel.

1. In Winkel, it makes a role called Support from Spree's support template: read orders, read customers and read the home page.
2. It invites the teammate, Mona Multi (`fidelity-two-stores@example.com`), to Shop with the admin role, and signs them up from the link, as the staff access batch's script does (`join` in `staff.ts`).
3. It invites the same address to Winkel with the Support role, and leaves that invitation pending.

The invitations go through the dashboard's own Admin API path. Nothing is written to the database directly. The tests then:

1. Accept the Winkel invitation on the screen with the existing account (DA-AUTH-04).
2. Sign in through the form (DA-SHELL-01).
3. Open the switcher, switch to Winkel and back, and open each store by its address (DA-OVL-01).
4. Show the switcher at 768 pixels, and the top bar and drawer on a phone.
5. As the admin, show the teammate in each store's staff list and remove them from Winkel (DA-SET-24).
6. Sign in as the teammate with a role in Shop only.

Every request bound outside the local servers is blocked and listed in each capture's note; none was.

**Two small changes to shared files.** `staff.ts` now exports three helpers it already had: `canSignIn`, `pendingInvitation` and `join`. `playwright.config.ts` lists the new script, and takes the dashboard's address from `FIDELITY_BASE_URL`, so the scripts can run beside another session's servers.

**No story.** Every component the four screens draw already has its stories (§4). LIQ-009 is unchanged.

## 2. The batch's map

| Capability | Screens | Flow | Roles | States | Browser tests | Functionally verified |
|---|---|---|---|---|---|---|
| CAP-11-12 Multi-store administration | DA-SHELL-01, DA-OVL-01, DA-AUTH-04, DA-SET-24 | FL-02, the acceptance step, with an existing account (§2.2) | The teammate: the admin role in Shop and the Support role in Winkel; then the admin role in Shop only. The fixtures' admin, in both stores, for the staff lists | 21, in §2.1 | None for a teammate in two stores (G-72). Nearest: Spree's `invitation-acceptance.spec.ts`, which accepts with a new account; `staff.spec.ts`, which removes a teammate from a store; and P6's switcher test, which switches for the admin, who holds the same role in both stores | PARTIAL with a failing part. Shown on one run, by the script's assertions: accepting a second store's invitation with an existing account; the first store opening on sign-in; the switcher listing both stores; each store's staff list with that store's role; and leaving one store while keeping the other. The navigation after a switch FAILS (SD-18). Spree's specs show the server's side (§3.2). Tenant isolation is NOT_RUN |

### 2.1 Screens and their states

Each state is captured in light and dark. "Asserted" means the script fails if the screen does not show it. "Recorded" means the script writes down what the screen shows and asserts nothing about it.

| Screen | State | Variant | What the capture shows | How |
|---|---|---|---|---|
| DA-AUTH-04 | existing-account-second-store | Signed out | "Join Winkel". The text names the Support role and the inviting admin. Because the account exists, the form asks only for its password, with "Sign in & accept" | Asserted |
| DA-AUTH-04 | accepted-second-store | Teammate | Accepting signs the teammate in and opens Shop, the first of their stores by name, not Winkel, the store just joined (B1) | Asserted |
| DA-SHELL-01 | opens-first-of-two-stores | Teammate | Signing in through the form opens Shop with the admin role's navigation | Asserted |
| DA-OVL-01 | switcher-two-stores-open | Teammate | The switcher lists Shop and Winkel in that order, with Shop ticked | Asserted |
| DA-OVL-01 | second-store-after-switching | Teammate | In Winkel after the switch: the switcher names Winkel, but the navigation is still the admin's, from Getting Started to Reports, straight after the switch and ten seconds later. The home page itself says reports are unavailable for the role (SD-18) | The store is asserted; the navigation is recorded |
| DA-OVL-01 | second-store-products-link-after-switching | Teammate | The Products link that the stale navigation offers, followed in Winkel. The product list reads "No results", with Import, Export and Add product (SD-18, B3) | Recorded, with the server's answers |
| DA-OVL-01 | second-store-create-product-after-switching | Teammate | A product typed and saved from New product. The page stays as it was, with no message (B4) | Recorded, with the server's answers |
| DA-OVL-01 | second-store-import-after-switching | Teammate | The import dialog after a file was chosen. The upload was refused with "Upload failed: Missing permission: write_products", and Continue stayed disabled (B5) | Recorded, with the server's answers |
| DA-OVL-01 | second-store-support-navigation | Teammate | Winkel opened by its address: the Support role's navigation, Home, Orders and Customers, with no Products | Asserted |
| DA-OVL-01 | second-store-support-settings-navigation | Teammate | Winkel's settings, opened by its address. The menu and the page read `No settings match ""`, though nothing was searched (B6) | Recorded |
| DA-OVL-01 | first-store-after-switching-back | Teammate | Back in Shop from the switcher: the navigation is still the Support role's, Home, Orders and Customers (SD-18) | The store is asserted; the navigation is recorded |
| DA-OVL-01 | first-store-admin-navigation | Teammate | Shop after a reload: the admin role's navigation again | Asserted |
| DA-OVL-01 | switcher-two-stores-open-narrow | Teammate | At 768 pixels, the narrowest width with the sidebar (the dashboard's phone layout starts below it, in its source), the switcher opens with both stores | Asserted |
| DA-OVL-01 | phone-two-stores | Teammate | At 390 pixels the top bar names Shop, and no switcher is drawn (B2) | Asserted |
| DA-OVL-01 | phone-two-stores-drawer-open | Teammate | The navigation drawer open on a phone, with no switcher either (B2) | Asserted |
| DA-OVL-01 | switcher-gone-one-store | Teammate, after leaving Winkel | Shop's name is a label with no switcher | Asserted |
| DA-SET-24 | teammate-in-two-stores-first-store | Admin | Shop's staff list shows the teammate with the admin role | Asserted |
| DA-SET-24 | teammate-in-two-stores-second-store | Admin | Winkel's staff list shows the same teammate with the Support role only | Asserted |
| DA-SET-24 | remove-from-second-store-confirmation | Admin | "Remove from store?" with "Mona Multi will lose access to this store." | Asserted |
| DA-SET-24 | removed-from-second-store | Admin | Winkel's list without the teammate, and "Removed from staff" | Asserted |
| DA-SET-24 | still-in-first-store-after-removal | Admin | Shop's list still shows the teammate with the admin role | Asserted |

No state was reached by answering or holding a request in the browser.

### 2.2 FL-02's acceptance step with an existing account

| Step | Screen | Shown by |
|---|---|---|
| An admin of Winkel invites an address that already has an account, with a role | The Admin API, the path the staff page's invite sheet takes | The script's set-up. Spree's invitation specs (§3.2) |
| The invitee opens the link and sees the store and the role, and only a password field | DA-AUTH-04 existing-account-second-store | The capture's assertions. Spree's acceptance spec reports `invitee_exists` for such an address |
| The invitee enters their password and accepts | DA-AUTH-04 accepted-second-store | The capture's assertions. Spree's acceptance spec "verifies the password, accepts, and issues a JWT", and refuses a wrong password without accepting |
| The new store's staff list shows the invitee with the invited role | DA-SET-24 teammate-in-two-stores-second-store | The capture's assertions |

No browser test drives this step with an existing account. Spree's `invitation-acceptance.spec.ts` drives it with a new one (G-72).

## 3. Permissions and isolation

### 3.1 What the interface shows each role

| Variant | What the interface shows |
|---|---|
| The teammate as admin in Shop | The full navigation, from Getting Started to Reports, and the switcher with both stores |
| The teammate with the Support role in Winkel, opened by its address | Home, Orders and Customers. Settings reads `No settings match ""`, as batch 3's B8 found for a role without settings (B6) |
| The teammate after a switch | The previous store's navigation, until a reload (SD-18) |
| The teammate with a role in Shop only | Shop's name as a label, with no switcher |
| The fixtures' admin, in both stores | Each store's staff list, with that store's role for the teammate |

### 3.2 What the server refuses

**Spree's own specs, at `68236c5`.** These ran in this session on SQLite with Spree's API and core test apps. The result was 187 examples in 17 files, with no failures and none pending. Every example is listed with its result in [api-specs.json](evidence/2026-11-04-fb-19-batch-multi-store-administration/backend/api-specs.json) (117 examples in 7 controller and 3 integration specs, seed 39662) and [core-specs.json](evidence/2026-11-04-fb-19-batch-multi-store-administration/backend/core-specs.json) (70 examples in 6 model and workflow specs and Spree's shared ability examples, seed 4787).

| What | Spec files (examples) | What the examples exercise |
|---|---|---|
| The current admin | `me_controller_spec.rb` (24), `me_spec.rb` (3) | A staffer with different roles in two stores gets only the current store's permission keys, and the other store's keys when the request names that store. An admin who holds no role in any store gets no stores, roles or permission keys, and is refused when the request names a store. Without credentials the answer is 401 |
| Which store a request may act in | `base_controller_spec.rb` (26) | A staff token whose user has no role in the current store is refused with 403, and so is a token whose only role is on something other than the store. Expired, tampered and wrong-audience tokens are refused with 401 |
| Invitations | `invitations_controller_spec.rb` (8), `invitations/acceptance_links_controller_spec.rb` (5), `invitations_spec.rb` (7) | The list never shows the acceptance token. A staffer may not invite into the admin role, or into a role they may not grant. The acceptance link of another store's invitation is not found |
| Accepting an invitation | `invitation_acceptances_controller_spec.rb` (9), `invitation_spec.rb` (16), `invitations/accept_spec.rb` (6) | An existing account is reported as existing. Its password is checked before the invitation is accepted, and a wrong one accepts nothing. A wrong token, or an expired or accepted invitation, is refused. Accepting gives the invitee the invited role and publishes `invitation.accepted` |
| Staff and role assignment | `admin_users_controller_spec.rb` (14), `admin_users_spec.rb` (4), `roles_controller_spec.rb` (17), `role_user_spec.rb` (3), `user_roles_spec.rb` (9), `user_management_spec.rb` (5), `ability_spec.rb` (27), Spree's shared ability examples (4) | A staffer may not grant, change or remove the admin role. The last admin cannot be removed. A user may hold a role of the same name in another store. A store refuses a role owned by another store. A teammate is removed from a store through that store's staff endpoint |

**What no spec sends** is NOT_RUN and joins G-11, as the owner decided for the earlier batches' narrower roles. That includes each request the Support role makes in Winkel. During SD-18 the server refused 32 store-scoped requests the stale navigation led to (§5.1). That was an observation, not a test.

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim. FB-03's private validation ran on 2026-11-04 and waits for the owner's acceptance. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open.

This batch shows what one account sees in the stores it holds a role in. No check visited, read or wrote a store the teammate held no role in, and nothing was probed across stores. Some of Spree's specs above touch store boundaries: another store's invitation link is not found, a role owned by another store is refused, and a staffer is refused in a store they hold no role in. They are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the batch claims nothing about isolation from them. SD-18 shows the wrong store's permissions on screen. The server answered by the right store's, so SD-18 is not an isolation finding (§5.1). No new isolation defect was found. None was looked for beyond these specs and this batch's screens.

## 4. Components and fidelity

No component on the four screens lacks a story. The store switcher (`store-switcher`, CMP-CORE-36) has Open, One store and Loading from the staff access batch. So do the sidebar, the phone's top bar, the sign-in and invitation screens, and the staff list's components. LIQ-009 is unchanged.

The switcher's Open and One store stories were set beside the running switcher, in light and dark. They draw the same parts: the store's initial and name with the up-and-down chevrons, or the name alone for one store, and the list of stores with the current one ticked. The differences are data: the stories' Sample Store and Outlet Store, and the page behind them. These are diagnostic pictures, not a computed style comparison, and are not acceptance. The other captures were each looked at in both themes. None showed a rendering fault apart from the behaviour recorded in §5.

| Story | Running screen | Images |
|---|---|---|
| Store switcher: Open | DA-OVL-01 switcher-two-stores-open | [light](evidence/2026-11-04-fb-19-batch-multi-store-administration/multi-store/switcher-open-light-side-by-side.webp) · [dark](evidence/2026-11-04-fb-19-batch-multi-store-administration/multi-store/switcher-open-dark-side-by-side.webp) |
| Store switcher: One store | DA-OVL-01 switcher-gone-one-store | [light](evidence/2026-11-04-fb-19-batch-multi-store-administration/multi-store/switcher-gone-light-side-by-side.webp) · [dark](evidence/2026-11-04-fb-19-batch-multi-store-administration/multi-store/switcher-gone-dark-side-by-side.webp) |

## 5. Behaviour found, recorded and not changed

### 5.1 SD-18: after a store switch, the previous store's permissions stay until a reload

Found on the first run and confirmed on the final run at `1320592d`. The teammate holds the admin role in Shop and the Support role in Winkel.

**What the screen shows.**

- After the teammate chooses Winkel in the switcher, the address and the switcher name Winkel. The navigation is still the admin's: Getting Started, Home, Orders, Products, Inventory, Customers, Sellers, Loyalty, Promotions and Reports. It is unchanged ten seconds later.
- The home page shows Winkel's own answer: reports are unavailable for the role.
- Following the stale navigation, Products opens the product list with Import, Export and Add product, and New product opens its form.
- Back in Shop from the switcher, the navigation is still the Support role's: Home, Orders and Customers, with no Products.
- Opening either store by its address, or reloading, shows that store's own navigation.

How long the stale navigation lasts without a reload was not checked beyond ten seconds.

**What the server answered.** The audit thread asked for this before classing SD-18, and it was checked on the running server. While the stale navigation showed in Winkel, the teammate followed it from the screen to three places: the product list, a new product saved as "Fidelity two-store attempt", and an import with a one-row file. The script recorded every Admin API request the page itself made, with its answer ([sd-18-server-answers.json](evidence/2026-11-04-fb-19-batch-multi-store-administration/multi-store/sd-18-server-answers.json)). It sent nothing of its own.

| Requests | Answer |
|---|---|
| The product list, four times | 403, `access_denied` |
| Saving the new product | 403, `access_denied` |
| Uploading the import's file | 403, `access_denied` |
| The product form's lookups: custom field definitions (6), and two each of option types, stock locations, package types, tax categories, channels, tags, categories, collections, product types and delivery profiles | 403, `access_denied` |
| Countries, which are shared reference data, not a store's | 200 |

**What the store held afterwards.** Read as the admin in Winkel, the store had no product with either attempted name and no import.

**Its class.** The server refused every store-scoped request by Winkel's own roles. So SD-18 is a dashboard display defect: the screen offers controls the role may not use, and hides controls the role may use. It is not a tenant-isolation or security finding. The baseline audit agreed this classification on 2026-11-04, on the condition this check met. SD-18 is entered in LIQ-004's [existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) as Medium. It is kept as it is, and is not reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).

### 5.2 Other behaviour

| # | Behaviour | Where |
|---|---|---|
| B1 | Accepting an invitation to a second store opens the first of the teammate's stores by name, Shop, not the store just joined. Signing in does the same | DA-AUTH-04 accepted-second-store, DA-SHELL-01 |
| B2 | On a phone, neither the top bar nor the navigation drawer draws the store switcher. A teammate in two stores has no control to change store there, other than the address. Staff access part 2 recorded the drawer without a switcher (its B8). The owner brief's row 24 asks whether to track this as a defect, and recommends recording it as Spree's behaviour, to revisit with Liquorify's product work | DA-OVL-01 phone-two-stores, phone-two-stores-drawer-open |
| B3 | A product list the server refused reads "No results", as if the store had no products, as catalog part 1's B17 found for a role that may not read products | DA-OVL-01 second-store-products-link-after-switching |
| B4 | A refused product save shows no message, and the form stays as it was | DA-OVL-01 second-store-create-product-after-switching |
| B5 | A refused import upload says "Upload failed: Missing permission: write_products", and Continue stays disabled | DA-OVL-01 second-store-import-after-switching |
| B6 | For a role without settings, the settings page and its menu read `No settings match ""`, though nothing was searched, as batch 3's B8 found | DA-OVL-01 second-store-support-settings-navigation |
| B7 | Removing a teammate from one store leaves their role in the other. Signed in again, they see that store with no switcher | DA-SET-24 still-in-first-store-after-removal, DA-OVL-01 switcher-gone-one-store |

B3 to B5 were reached only through SD-18's stale navigation. A role that does not read products sees no Products link once the page shows the right store.

## 6. Corrections to the work item

- **The support role's navigation after switching (§2.1).** The work item expected it after a switch. The switch keeps the previous store's navigation (SD-18), so it is captured with the page opened by its address, and the admin's in Shop after a reload. The two switches are captured as they show.
- **The switcher on a narrow screen (§2.1).** A phone draws no switcher (B2). It is captured at 768 pixels, where the sidebar still shows, and the phone's top bar and drawer are captured without it.
- **Size (§4 of the work item).** 21 states in 42 captures, against about 20 captures expected. The phone states, the settings menu and SD-18's three states were added.
- **Acceptance (criterion 9).** The work item says "the owner accepts". Since the owner's delegation of 2026-11-04, a coordinating session accepts the screen evidence, recorded as delegated acceptance and never as the owner's review. Gap answers stay with the owner.
- **LIQ-006's row.** CAP-11-12's row lists DA-SHELL-01 and DA-OVL-01. This batch also maps DA-AUTH-04 and DA-SET-24. The inventory is left unchanged, and its disposition stays "Unknown", which is the product decision.

## 7. Gaps

The work item's known gaps (§6) are answered as follows:

- The browser tests are G-72.
- The support role's refusals in Winkel join G-11, with no new number, as the baseline audit agreed.
- Tenant isolation stays FB-03's.
- The Liquorify product decision stays the owner's, after the baseline.

| Gap | Check made instead | What would close it | Proposal | Owner |
|---|---|---|---|---|
| G-72: No browser test covers a teammate in two stores, switching between their stores, or joining a second store with an existing account | This batch's captures and their assertions, on one run (§2.1), and Spree's specs for the server's side (§3.2) | A browser test for each, which would fail on SD-18 until it is fixed | Defer to the platform batch's browser-test work, with G-57 and P8 | PENDING, in the owner brief as row 23 |
| Refusals to the Support role in Winkel beyond Spree's specs | The 32 refusals observed during SD-18 (§5.1) | Negative access-control tests | Join G-11, with no new number | Recorded with G-11, which stays open |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap | Unchanged: NOT_RUN |

## 8. Local checks

- **The script's runs.** It ran from `725d5cf9` on a first server, and its first run found SD-18. It ran from `627ef7ec` to record the server's answers. The final run was from `1320592d` on a freshly started server, with all six tests passing. The evidence is from the final run only. Every capture's note names `1320592d`.
- **Spree's specs.** 117 API examples and 70 core examples, with no failures, at `68236c5` (§3.2).
- **The package's checks.** `tsc --noEmit` and Biome passed for `packages/liquorify-storybook` on the changed scripts.
- **Criterion 8's search.** Before each push, every line the pull request adds was searched for these shapes: invitation acceptance addresses, the prefixed invitation IDs the run used, publishable and secret key prefixes, JSON web tokens, bearer values, password fields, and long runs mixing letters and digits. The added lines were also compared with the local values the run used. The search printed where a pattern matched, never the value, and nothing matched. The images are not text and were not searched. No capture shows an invitation link, because the acceptance screen's address is not drawn on the page.
- **CI.** The pull request's required checks are recorded with the merge.

## 9. Limitations

- **One run, not a browser test.** The final captures and their assertions ran once on a fresh server. The earlier runs gave the same states. A browser test is G-72.
- **Recorded, not asserted.** The navigation after a switch, the settings menu and SD-18's three states are recorded as shown, not asserted. The script fails on none of them.
- **How long SD-18 lasts.** Observed for ten seconds after the switch. Whether the dashboard corrects itself later without a reload was not checked.
- **The browser tests' data.** The two stores and the admin are the fixtures' own. The Support role and the teammate were added through the Admin API, and exist only in that local database, which is discarded. Spree's tests and fixtures are unchanged.
- **Spree's specs ran on SQLite, locally, with Ruby 3.3.6.** CI runs Spree's suites on PostgreSQL and MySQL with Ruby 4.0.
- **The side-by-side pictures are diagnostic.** No computed style comparison was run for the switcher, whose stories the staff access batch already compared.
- **Not independent.** The session that wrote the script also reviewed its captures.

## 10. Evidence

The [evidence index](evidence/2026-11-04-fb-19-batch-multi-store-administration/README.md) lists every capture, the step list, SD-18's server answers, the side-by-side pictures and the backend results. The evidence is 93 files, 2.0 MB, with its index. Every image is lossless WebP.

The delegated acceptance, the merge commit and the required checks are recorded in this batch's merge record, after the merge.
