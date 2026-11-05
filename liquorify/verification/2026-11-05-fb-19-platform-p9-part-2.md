---
title: FB-19 platform batch, step P9, part 2, browser tests for multi-store administration
record: verification
work_item: FB-19
date: 2026-11-05
verifier: Claude (automated session, thread "Add P9 browser tests"); not independent review
result: Four browser tests for G-72's multi-store actions from batch 15, each driven through the running dashboard as a teammate who holds the admin role in the default store and the Support role in Winkel, asserting what the screen shows and, after a reload, what was kept. Run twice in a row in the pinned Playwright image at `3709958d`, on freshly started servers, with Spree's code as on `main` at `303d3410`. Joining a second store with an existing account and working in two stores with a role in each passed both times. Switching from one store to the other, in each direction, failed both times, and only at SD-18's check: fifteen seconds after the switch the navigation was still the previous store's role, while the switch itself and what a reload shows passed. Each of the four was shown to fail when what it checks does not happen. Every action G-72 names has a test that passes or fails only on SD-18, so G-72 closes on this record as delegated acceptance, not the owner's review. SD-18 stays open, CAP-11-12 stays PARTIAL with a failing part, and tenant isolation stays NOT_RUN. P9 is not complete
---

# FB-19 platform batch, step P9, part 2, browser tests for multi-store administration

**Claim.** Step P9 of the [platform batch](../work-items/fb-19-batch-platform.md#p9-untested-actions-in-settings-the-catalog-and-multi-store-administration) asks for one browser test for each action its gaps name, and runs in parts. [Part 1](2026-11-05-fb-19-platform-p9-part-1.md) covered Getting Started's tasks and batch 7's settings actions. This record is part 2: item 1.3, batch 15's multi-store actions (G-72). The tests are in Liquorify's own scripts, `packages/liquorify-storybook/fidelity/multi-store-actions.spec.ts`, with part 1's `fidelity/p9.ts`, and `fidelity/stores.ts`, which holds the store switcher and navigation helpers batch 15's script already used, moved there unchanged so both scripts share them. They change nothing in Spree's code, tests or workflows.

**Results against P9's completion criteria, for part 2.**

| # | Criterion | Result |
|---|---|---|
| 1.3 | G-72: a teammate who works in two stores, switching between their stores, and joining a second store with an existing account | PARTIAL, as criterion 4 expects: joining with an existing account PASSES, twice (§2, test 1); working in two stores, each with its own role, PASSES, twice (§2, test 2); switching, in each direction, FAILS, twice, only at SD-18's check, with the switch and the reload passing (§2, tests 3 and 4) |
| 2 | The tests fail when they should | PASS: run with each test's change undone, all four failed, each at the assertion that checks that change (§1.2) |
| 3 | A recorded run at a recorded revision, in the pinned image, twice in a row | PASS for the runs: at `3709958d`, twice in a row on freshly started servers, with the same two passing and the same two failing at the same assertion both times (§1) |
| 4 | A failure is a defect in LIQ-004, kept, not fixed in Spree, the test not weakened | PASS: SD-18 was already in LIQ-004 and is open. Spree's code is unchanged, and tests 3 and 4 keep failing while it stands (§4) |
| 5 | A record | PASS: this record |
| 6 | Nothing else claimed | PASS (§5) |
| 7 | Closing | G-72 CLOSES on this record, as delegated acceptance under the owner's delegation of 2026-11-04, not the owner's review: every action it names has a test that passes, or fails only on SD-18 (§6) |

## 1. How the tests ran

| What | Detail |
|---|---|
| Scripts | `fidelity/multi-store-actions.spec.ts` and `fidelity/stores.ts` at `3709958d`, with part 1's `fidelity/p9.ts` and `fidelity/staff.ts`, and `fidelity/playwright.config.ts` listing the new script. `3709958d` sits on part 1's last commit, `871888a7`. Batch 15's `multi-store.spec.ts` now imports the helpers from `stores.ts`; its own steps are unchanged |
| Spree's code | As on `main` at `303d3410`, which this branch does not change |
| Server and data | Spree's browser-test server, its database and its fixtures, started exactly as the dashboard's own browser tests start them (`fidelity/stack.spec.ts`), with Ruby 3.3.6 on SQLite, and stopped and started again with a new database before each run. The fixtures hold two stores, the default store, Shop, and Winkel |
| Teammates | Before its tests, each Playwright worker adds two teammates of its own, named with the run's stamp: `p9-joins-…@example.com` and `p9-two-stores-…@example.com`. Each is invited to Shop with the admin role through the Admin API and accepts as the invitation page does, with a name and a password. Both are then invited to Winkel with the Support role, a role made from Spree's support template (read orders, read customers, read the dashboard), as batch 15 did. The second teammate accepts Winkel's invitation through the Admin API with their existing password, so they hold both roles; the first leaves it waiting for test 1. Nothing is written to the database directly |
| Dashboard | Built from `packages/dashboard` with Vite on 2026-11-04 at `fc5cb555`, whose dashboard packages and Spree code are the same as at `303d3410`, and served with `vite preview` on port 5174, proxied to the server, as the dashboard's browser tests do in CI |
| Browser | The pinned Playwright 1.64.1 image, by digest, on the host's network; Chromium at 1280 by 800 pixels |
| Signed in as | The teammates, through the sign-in form or the invitation page. The staff lists are read as the browser tests' admin, who holds the admin role in both stores |
| Requests outside | Every request that would leave the local servers was blocked and recorded. None was made |
| Runs | On 2026-11-05 UTC, each on a server started afresh just before it: the check run at 00:28, and the recorded runs at 00:30 and 00:32, each taking a little over a minute. In each recorded run tests 1 and 2 passed and tests 3 and 4 failed at the same assertion, and the JSON files of the two runs were the same apart from the run's stamp. The evidence is the second run's, whose records are stamped `mw2t9ex7` for tests 1 to 3 and `mw2tac4x` for test 4: when a test fails, Playwright starts a new worker for the tests after it, which adds its own two teammates. A first attempt at the three runs, at 00:27, started no test, because the container engine that runs the pinned image had stopped; it was started again with the dashboard's preview server, and all three runs were made again from the start |
| Secrets | The teammates' password is the fidelity scripts' fixed test password, typed into the page and never written to a record. No invitation link or token is recorded: test 1 opens its link, which it reads through the Admin API as batch 15 did, and records only the store the page then opened, with the store's id written as `<store>` |

### 1.1 What each test asserts on the screen and after a reload

Each test drives the dashboard as the teammate would: it signs in, opens an invitation, chooses a store or opens one by its address, and reads what the screen shows. It then reloads the page and asserts what was kept, and, where the action changes who belongs to a store, signs in as the store's admin in a separate browser and reads each store's staff list. It writes a JSON file of what each step showed, and screenshots of where it ended.

### 1.2 Showing that each test fails when it should

With `P9_SABOTAGE=1`, each test is marked as expected to fail, and first makes the browser undo the change the test then looks for. The run passes only if every test fails. Each failure was then read to check it came from the assertion that checks the change, not from an earlier step.

| # | Test | What is undone | Where it failed |
|---|---|---|---|
| 1 | Joining a second store with an existing account | The acceptance is sent with a wrong password, so the server refuses it | The page stays on the invitation instead of opening a store |
| 2 | A teammate in two stores | Every answer that tells the page who is signed in, at sign-in, on a refresh and for the current admin, leaves Winkel out of the teammate's stores | The store switcher is not shown |
| 3 | Switching from Shop to Winkel | A choice in the store switcher is stopped before the page acts on it | The address stays Shop's after choosing Winkel |
| 4 | Switching from Winkel to Shop | The same | The address stays Winkel's after choosing Shop |

The check run at `3709958d` failed all four, each where the table says, before reaching SD-18's check. Tests 3 and 4 also fail on SD-18 in every recorded run, so for them the check run is read by where it failed, not by its failing: it failed at the switch, which every recorded run passes.

### 1.3 Before the recorded runs

The tests were first tried on the same stack from the uncommitted files, once as written and twice with their sabotage. The first try with sabotage showed test 2's sabotage did nothing: it changed the answer for the current admin, but the dashboard learns the signed-in teammate's stores from the answers at sign-in and on each refresh. The sabotage was changed to cover all three, and the second try failed all four where §1.2 says. The screenshots were then changed to show the switcher open with both stores, and each store's staff list. No assertion changed after the first try, and none of these tries is a recorded run.

Every screenshot of the second recorded run was looked at, eleven in all.

## 2. Results

| # | Item | What the test does and asserts | Result | Evidence |
|---|---|---|---|---|
| 1 | 1.3 | Signed out, opens the first teammate's invitation to Winkel and asserts the heading "Join Winkel", the Support role named, the "Sign in & accept" button and no name fields: the form asks only for the existing account's password. Enters the password and accepts, and asserts a store of theirs opens; Shop opened, the first of their stores by name, as batch 15 found. Reloads, and asserts the store switcher lists Shop and Winkel. Then, as the store's admin, opens Winkel's staff list, reloads, and asserts the teammate listed with the Support role and not the admin role | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/joined-second-store.json), [the invitation](evidence/2026-11-05-fb-19-platform-p9-part-2/joined-second-store-invitation.png), [the switcher after the reload](evidence/2026-11-05-fb-19-platform-p9-part-2/joined-second-store.png); [staff list JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/joined-second-store-staff-list.json), [PNG](evidence/2026-11-05-fb-19-platform-p9-part-2/joined-second-store-staff-list.png) |
| 2 | 1.3 | The second teammate signs in through the form. Asserts Shop opens with the admin role's navigation, its ten links from Getting Started to Reports, and the store switcher listing Shop and Winkel. Opens Winkel by its address and asserts the switcher names Winkel and the navigation is the Support role's: Home, Orders and Customers. Reloads and asserts the same. Then, as the store's admin, asserts Shop's staff list shows the teammate with the admin role and Winkel's with the Support role and not the admin role | PASS, both runs | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles.json), [the switcher](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles-switcher.png), [Winkel after the reload](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles.png); [staff lists JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles-second-staff-list.json), [Shop's](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles-first-staff-list.png), [Winkel's](evidence/2026-11-05-fb-19-platform-p9-part-2/two-stores-own-roles-second-staff-list.png) |
| 3 | 1.3 | The second teammate signs in to Shop, with the admin role's navigation. Chooses Winkel in the switcher, and asserts the address is Winkel's and the switcher names Winkel. Then checks, for up to fifteen seconds, that the navigation becomes the Support role's. Reloads, and asserts the address still Winkel's, the switcher naming Winkel and the Support role's navigation | FAIL, both runs, at the navigation after the switch only: fifteen seconds later it was still the admin role's ten links, in Winkel (SD-18). The switch and everything after the reload passed | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-second-store.json), [after the switch](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-second-store-navigation.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-second-store.png) |
| 4 | 1.3 | The second teammate signs in and opens Winkel by its address, with the Support role's navigation. Chooses Shop in the switcher, and asserts the address is Shop's and the switcher names Shop. Then checks, for up to fifteen seconds, that the navigation becomes the admin role's. Reloads, and asserts the address still Shop's, the switcher naming Shop and the admin role's navigation | FAIL, both runs, at the navigation after the switch only: fifteen seconds later it was still the Support role's three links, in Shop, with no Products and no Settings (SD-18). The switch and everything after the reload passed | [JSON](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-first-store.json), [after the switch](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-first-store-navigation.png), [after the reload](evidence/2026-11-05-fb-19-platform-p9-part-2/switched-to-first-store.png) |

## 3. Choices made while writing the tests

- **Teammates of the run's own.** Batch 15's script uses one fixed teammate and takes them out of Winkel before each run. These tests add new teammates for each worker instead, so no test depends on what an earlier test or run left behind, and a test that fails cannot leave the next one half joined.
- **Which store opens after accepting.** G-72 names joining, not which store opens. Test 1 asserts that accepting opens one of the teammate's stores and records which; batch 15 recorded the same behaviour, the first store by name, in its captures.
- **SD-18 is checked for fifteen seconds.** Batch 15 saw SD-18 for ten seconds and left open whether the dashboard corrects itself later. Tests 3 and 4 give it fifteen, checking all the while, so a navigation that settles late is not counted as a failure. The check is soft, so each test still checks, and records, the switch itself and what a reload shows.
- **Both directions.** SD-18 shows differently in each: from Shop to Winkel the navigation offers more than the role may use, and from Winkel to Shop it hides what the role may use. A test for each keeps both visible.
- **The second teammate's acceptance goes through the Admin API.** Test 1 drives the invitation page; the second teammate's acceptance only sets up the two roles tests 2 to 4 need, as it does on the page.

## 4. Defects found

None new. Tests 3 and 4 fail on SD-18, already in LIQ-004 from batch 15 and open, and confirm it in both directions at fifteen seconds after a switch, longer than batch 15 watched. It is in Spree's dashboard, recorded and not fixed, and not reported to Spree, by the owner's standing instruction ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).

| # | Defect | Severity | Seen |
|---|---|---|---|
| SD-18 | After a teammate switches store with the store switcher, the dashboard keeps the previous store's permissions until the page is reloaded | Medium: a display defect, not a tenant-isolation or security finding; batch 15 recorded that the server refused every request the wrong navigation led to | Tests 3 and 4, in every run: still the previous store's navigation fifteen seconds after the switch, in each direction, and the right one after a reload |

The tests stay as they are: tests 3 and 4 pass once the navigation follows the switch without a reload.

## 5. What this does not show

- **Refusals to the Support role (G-11, P10).** The tests read what the screen offers each role. What the server refuses the Support role in Winkel, beyond Spree's specs and the 32 refusals batch 15 observed, stays with G-11, for P10. Nothing here sends a request the role may not make.
- **Tenant isolation.** Every check stays within the two stores the teammates hold a role in, and reads each store's own staff list as its admin. Nothing here shows that one store's records stay out of another's. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open.
- **What batch 15 captured but G-72 does not name.** Leaving one store while keeping the other, the switcher at narrow widths and the phone's drawer without a switcher, and a teammate in one store only, are batch 15's captures with their assertions on one run. They have no browser test here and none is claimed.
- **The invitation email.** Test 1 opens the invitation's link as the Admin API gives it, as batch 15 did. The email that carries it is neither sent nor read here.
- **A new account joining.** G-72 names joining with an existing account. Joining with a new account is not tested here.
- **Other browsers and window sizes.** Every run used Chromium at 1280 by 800 pixels.

**The capability.** CAP-11-12 stays PARTIAL with a failing part, SD-18. G-72 no longer holds it open: what holds it is SD-18, the refusals with G-11, and tenant isolation, NOT_RUN.

## 6. Delegated acceptance and what stays open

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): technical acceptance of these four tests and their results, as recorded here, and the closing of G-72 under criterion 7. The owner did not review this work |
| Accepted by | Claude, in the thread "Add P9 browser tests" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |
| Closed | G-72: joining a second store with an existing account and working in two stores have tests that pass, and switching between stores has a test in each direction that fails only on SD-18 |
| Not accepted here | SD-18, which is recorded, not answered, and any decision on fixing it |

What stays open:

- **P9 is not complete.** G-61, G-75 and G-84 have their own parts, each in its own pull request.
- **SD-18 is open** in LIQ-004, and tests 3 and 4 fail while it stands.
- **CAP-11-12 stays PARTIAL** with a failing part (§5).
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open.

## 7. Evidence

The [evidence folder](evidence/2026-11-05-fb-19-platform-p9-part-2/) holds each test's JSON files and screenshots from the second recorded run at `3709958d`, the screenshots taken mid-test (the invitation, the switcher open, Shop's staff list and each switch before its reload), and `checks.json`, which gives, for the check run at `3709958d`, each test's outcome, the first line of each assertion it failed at, and that assertion's lines in the test. Each JSON file names its test, the revision, the run's stamp and every request blocked because it would have left the local servers; none was. The teammates are the run's own, named with its stamp, with `example.com` addresses. Store ids are written as `<store>` and `<Winkel>`. No token, invitation link or password is recorded.
