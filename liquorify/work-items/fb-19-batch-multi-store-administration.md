---
title: FB-19 batch, multi-store administration
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-11-03
updated: 2026-11-04
---

# FB-19 batch: multi-store administration

A small dashboard batch for one capability, CAP-11-12 in [LIQ-006 §11](../LIQ-006-product-capability-baseline.md#11-analytics-emails-platform-and-developer-surfaces): one staff account that holds a role in several stores. The baseline audit of 2026-11-02 found that no batch maps it (its finding A-2): the [platform batch](fb-19-batch-platform.md) leaves it out because it has screens, and the batches that captured those screens did not name it. This batch gives it a map, captures and Spree's own specs, so LIQ-006 §14's criterion 8 can hold for it. It reproduces what Spree already does. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-03, at the owner's request to assign CAP-11-12 to a bounded baseline work item. It depends only on the staff access batch, accepted and merged on 2026-10-23. The owner answered §7 on 2026-11-04: lane C after batch 7, when a slot is available, with FB-03 taking the next free slot ahead of it, and the support template's role. Whether one Liquorify login may be staff at two businesses is an open product decision (LIQ-006 §11); this batch records Spree's behaviour and decides nothing about it. **Built on 2026-11-04** in #49, after the SD-8 fix freed a slot ([record](../verification/2026-11-04-fb-19-batch-multi-store-administration.md)). Every listed state is captured; no component lacked a story. It found SD-18: after a store switch, the dashboard keeps the previous store's permissions until a reload, while the server answers each store by its own roles. The record's §6 corrects three points below: the support role's navigation shows only once the store is opened by its address or reloaded; a phone draws no switcher, so the switcher is captured at 768 pixels; and criterion 9's acceptance is delegated acceptance since the owner's delegation of 2026-11-04.

**Merged and accepted, 2026-11-04.** #49 merged at `ddc7d91f`, and its evidence was accepted as delegated acceptance, not the owner's review. It closes nothing: SD-18 stays open, G-72 waits for the owner's answer, and CAP-11-12 stays PARTIAL ([merge record](../verification/2026-11-04-fb-19-batch-multi-store-administration-merge.md)). This work item's status stays PROPOSED.

**Kept apart from tenant isolation.** This batch shows what one account sees in the stores it holds a role in. Whether one store's data can be reached from another is FB-03's validation, which stays NOT_RUN here. No check in this batch visits, reads or writes a store the account holds no role in, and nothing is probed across stores. A new isolation defect found on the way is reported to the owner privately and is not published while it is open.

## 1. Outcome and summary

- **Bounded:** 4 screens already captured by earlier batches, seen again with one teammate who holds different roles in two stores; one step of FL-02 with an existing account; no email; no new component expected.
- **What is new:** the store switcher and the navigation for a teammate whose role differs between stores; joining a second store with an account that already exists; and leaving one store while keeping the other.
- **Function, where it is checked:** inside the dashboard, by the captures and Spree's specs. The server's answers to a role in each store are recorded only from Spree's specs (criterion 6).

## 2. Scope

| Capability | Screens | Flow | Browser tests |
|---|---|---|---|
| CAP-11-12 Multi-store administration | DA-SHELL-01 store selection, DA-OVL-01's store switcher and navigation, DA-AUTH-04 accept invitation, DA-SET-24 staff | FL-02, with an existing account | None covers a teammate in two stores. `invitation-acceptance.spec.ts` covers a new account, `staff.spec.ts` removing a teammate, and the staff access batch's captures the switcher for an admin in both stores |

**The set-up, on Spree's browser-test server only.** The server already has two stores, the default store and "Winkel", and its admin holds the admin role in both. The batch adds one teammate through the Admin API: invited to the default store with the admin role and signed up, then invited to Winkel with a role made from the support template (read orders, customers and the home page) and accepted with the existing account. Both invitations are the dashboard's own path; no record is written to the database directly.

### 2.1 Meaningful states to capture

In light and dark at 1280 pixels, and the switcher also on a narrow screen.

| Screen | States |
|---|---|
| DA-SHELL-01 Store selection | The teammate signing in and opening the first store they hold a role in |
| DA-OVL-01 App shell | The switcher listing both stores for the teammate; after switching to Winkel, the navigation of the support role, and back in the default store, the admin's; the switcher gone once the teammate holds a role in only one store |
| DA-AUTH-04 Accept invitation | The invitation to Winkel opened by an account that already exists, with the store and the role it offers; accepted |
| DA-SET-24 Staff | The teammate listed in each store with that store's role; removed from Winkel, after confirming, while still listed in the default store |

### 2.2 Permission variants

The teammate's two roles are the variants: the admin role in the default store and the support role in Winkel. The admin in both stores is already captured by the staff access batch and is not captured again.

### 2.3 Left out, and where it goes

- **Cross-store access of any kind,** including a direct visit to a store the teammate holds no role in: FB-03.
- **Creating a store:** Spree's Admin API reads and updates a store but has no endpoint to create one, and the browser-test server's second store comes from its set-up. A store's creation from the dashboard is not part of Spree's baseline.
- **A plugin's store picker (the `store_selection` slot):** captured by the staff access batch as it renders.
- **Whether one login may be staff at two businesses:** the open Liquorify decision in LIQ-006 §11.

## 3. Components

No component is expected to need a new story: `store-switcher`, `app-sidebar`, `no-store-access`, `auth-shell` and the staff list's components have them from the staff access batch. The batch's first step confirms this against the running screens; a component found without a story is added and listed in the record.

## 4. Delivery

One backend pull request with the capture script, the verification record, the evidence index and the records' updates. The dashboard is built at the pull request's revision against Spree's browser-test server, and the teammate and its two invitations are made through the Admin API on that server's database only. The invitation links and the teammate's made-up password never appear in a capture or record.

**Size:** about 20 running-screen captures, and no stories unless the first step finds a component without one.

## 5. Acceptance criteria

| # | Criterion | Evidence |
|---|---|---|
| 1 | CAP-11-12 is mapped to its screens, FL-02's existing-account step, the teammate's roles, its states and the browser tests, with what no test covers recorded as a gap | The map in the verification record |
| 2 | Every state in §2.1 is captured on the running dashboard at the pinned revision | Captures indexed by screen ID and state |
| 3 | Any component found without a story gets one for each state, with a reference image, and the visual check passes twice in CI | Coverage report and CI runs, if any |
| 4 | Spree's code, the storefront and every workflow outside Storybook are unchanged | The pull request's file list |
| 5 | The records are updated: the verification record, LIQ-004, the platform work item's "left out" line, LIQ-009 if a story was added, and the README index | The pull request |
| 6 | The server's side is recorded from Spree's own specs, run at the batch's revision: the current admin's specs for a staff member with different roles in two stores and for one with no role, the invitation and invitation acceptance specs with an existing account, and the role assignment specs. What no spec exercises is NOT_RUN | The spec run |
| 7 | Tenant isolation is NOT_RUN, with links to the open isolation findings; no check touches a store the teammate holds no role in | The record's isolation section |
| 8 | No invitation link, token or password appears in any committed file | A search of the pull request's files before each push |
| 9 | The owner accepts the screen evidence. Since the owner's delegation of 2026-11-04, this is delegated acceptance, recorded with the merge and never as the owner's review; gap answers stay with the owner | The [merge record](../verification/2026-11-04-fb-19-batch-multi-store-administration-merge.md) |

## 6. Gaps known before the work starts

| Gap | What would close it |
|---|---|
| No browser test covers a teammate in two stores, or joining a second store with an existing account | This batch's captures show the states; the gap stays for the tests |
| What the server refuses to the support role in Winkel | Criterion 6 records what Spree's specs exercise; the rest joins G-11 |
| Whether one store's data can be reached from another | FB-03's validation |
| Whether one Liquorify login may be staff at two businesses | The owner's product decision, after the baseline |

## 7. Questions for the owner, and the owner's answers

1. **Where does this batch run?** Recommended: in lane C, straight after batch 7, as a small pull request. The alternative is the first lane that frees, whichever it is.
   *The owner's answer, 2026-11-04 (decision 7 of the owner decision brief):* as recommended, after batch 7, with one clarification: FB-03's validation takes the next free slot ahead of queued work, so this batch follows when a slot is available. At most three implementation lanes run at once.
2. **Is the support template's role the right second role?** Recommended: yes, because it differs clearly from the admin's and is one of Spree's own templates. The alternative is the order manager template.
   *The owner's answer, 2026-11-04 (decision 8):* yes, the support template.

## 8. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Captures, a script and records only, on a local test server discarded after the run.
- **Release impact.** None. Nothing is deployed.
