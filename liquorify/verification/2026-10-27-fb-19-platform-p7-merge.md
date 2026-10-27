---
title: FB-19 platform step P7, merged, accepted and checked on main
record: verification
work_item: FB-19
date: 2026-10-27
verifier: Claude (automated session); not independent review
result: PASS for the merge commit; PASS for Storybook started by hand on `main`, all 1,108 comparisons; PASS for Packages on `main`, with its six release jobs skipped as intended; Tests did not start, as expected. The owner accepted P7 within its documented scope after the merge, closing G-23, G-32 and G-40 for the requests P7 tested and keeping G-11 open for the catalog requests of G-45 and G-50, which P7 does not cover (§3)
---

# FB-19 platform step P7, merged, accepted and checked on main

**Claim.** [#22](https://github.com/pateldhruval872/liquorify/pull/22), step P7 of the [platform batch](../work-items/fb-19-batch-platform.md#p7-refusals-within-one-store), merged into `main` exactly as reviewed, and the Storybook still builds and passes its visual check on `main`. After the merge the owner accepted P7 within the scope [its record](2026-10-26-fb-19-platform-p7.md) documents. This record holds that decision (§3). It does not complete the platform batch or FB-19, and it claims nothing about tenant isolation.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The merge commit holds exactly the reviewed revision | PASS (§1) |
| 2 | Storybook, started by hand on `main`, builds the Storybook and passes every visual comparison | PASS: 1,108 of 1,108 (§2) |
| 3 | The other workflows that run on `main` for this change give the result expected from before the merge | PASS: Packages passed, with its six release jobs skipped as intended, and Tests did not start because no file it watches changed (§2) |
| 4 | The owner's answer is recorded | PASS: P7 accepted on 2026-10-27 within its documented scope (§3) |

## 1. The merge commit

The owner merged #22 at 01:35 UTC on 2026-10-27. The merge commit's tree is identical to the tree of the pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | |
|---|---|
| Pull request | [#22](https://github.com/pateldhruval872/liquorify/pull/22) |
| Merged at | 01:35 UTC |
| Merge commit | `69da903` |
| Its parents | `c8567a0` (`main` before, the merge of the shop batch's part 1 records, #21) and `d8a0680` (the pull request's final revision, with `main` at `c8567a0` merged in) |
| Tree | `065b394`, the same as `d8a0680` |
| Changed | 27 files: P7's record, its 16 evidence files, the platform work item, LIQ-004 and the README index under `liquorify/`, and 7 fidelity scripts under `packages/liquorify-storybook/fidelity/`. Nothing in Spree's code, Storybook's stories, the workflows or the lockfile changed |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on `main` after the merge, as it was for P2.

| Workflow | Why it ran | Run | Result |
|---|---|---|---|
| Storybook | Started by hand | [40433775081](https://github.com/pateldhruval872/liquorify/actions/runs/40433775081) | PASS: the Storybook built, the token and inventory checks and the coverage report ran, and all 1,108 comparisons, for 554 stories in two modes, passed in the pinned image in 19.9 minutes. P7 added no story, so the count is batch 3's |
| Packages | The merge changed files under `packages/` | [40433522854](https://github.com/pateldhruval872/liquorify/actions/runs/40433522854) | PASS in 14 minutes: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |

P7's scripts run locally against the browser-test server and the storefront, not in CI. Their recorded runs are in [P7's record](2026-10-26-fb-19-platform-p7.md#1-how-the-checks-ran). Since those runs, `main` has changed only records, one Storybook story's timing (#25) and the Packages workflow (#24), none of which P7's scripts or the servers they call use, so the runs stand.

## 3. The owner's answer, 2026-10-27

The owner accepted P7 within its documented scope and asked for the decision to be recorded here:

- **G-23, G-32 and G-40 close** for the requests P7 tested: the command palette's nine searches as part 2's teammates ([P7 §2.4](2026-10-26-fb-19-platform-p7.md#24-g-23-the-command-palettes-searches-criterion-13)), the requests of batch 2's narrower roles ([§2.5](2026-10-26-fb-19-platform-p7.md#25-g-32-batch-2s-narrower-roles-criterion-14)) and those of batch 3's ([§2.6](2026-10-26-fb-19-platform-p7.md#26-g-40-batch-3s-narrower-roles-criterion-15)). Requests P7 did not send stay unverified ([§6](2026-10-26-fb-19-platform-p7.md#6-what-this-does-not-show-criterion-11)).
- **G-11 stays open.** The owner accepted its tested staff checks ([§2.1](2026-10-26-fb-19-platform-p7.md#21-g-11-staff-invitations-and-roles-criterion-11)) and shopper account checks, through the Store API and the storefront ([§2.2](2026-10-26-fb-19-platform-p7.md#22-g-11-shopper-accounts-through-the-store-api-criterion-12) and [§2.3](2026-10-26-fb-19-platform-p7.md#23-g-11-shopper-accounts-through-the-storefronts-own-server-code-criterion-12)). G-11 stays PENDING for the additional catalog requests of G-45, from the shop batch's part 1 (#21), and G-50, which part 2's draft #26 proposes. P7's evidence does not cover those requests.
- **Each capability follows its own evidence.** Remaining gaps, defects and unverified plugin slot claims stay as they are:

| Capability | Before | Now | Why |
|---|---|---|---|
| CAP-04-03 Staff invitations, CAP-04-04 Roles and permissions | PARTIAL for G-11 | PARTIAL | G-11's staff refusals no longer hold them, but an entry in a staff screen's slot stays unverified ([P3's record §6](2026-10-23-fb-19-platform-p3.md#6-the-owners-review-2026-10-23)) |
| CAP-04-05 Staff profile, command palette, notifications | PARTIAL for G-11 and G-23 | PASS, within part 2's and P6's documented limits | G-11 held it only through G-23's palette searches ([P6's record](2026-10-23-fb-19-platform-p6.md)), which P7 checked and the owner closed. G-11 stays open only for catalog requests, which are not CAP-04-05's. The limits stay: G-20 and G-21 are simulated interface states, and Spree's real update service is not verified |
| CAP-04-06 Keys, OAuth, origins; CAP-04-07 Agent server | PARTIAL for G-32 alone | PASS, within batch 2's and P2's documented limits | G-32 was the only thing keeping them PARTIAL ([P2's record §9](2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)) |
| CAP-04-08 Webhooks and events | PARTIAL for G-32 and the providers' inbound webhooks | PARTIAL | The payment and payout providers' inbound webhooks are still P4's ([P2's record §9](2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)). P7's §7 had proposed it PASS with CAP-04-06 and CAP-04-07; that row is corrected in P7's record |
| CAP-04-09 Integrations | PARTIAL for G-26 | PARTIAL | Unchanged: P7 does not touch G-26 |
| CAP-08-01 Shopper accounts | PARTIAL | PARTIAL | G-11's account refusals no longer hold it; SD-1, SD-2, G-13 and G-16 do |
| CAP-03-05, CAP-03-06, CAP-03-07, CAP-03-09 | PARTIAL | PARTIAL | None was PARTIAL for G-40 alone: G-38, G-39 and SD-2 hold them, as batch 3 recorded |
| CAP-11-07 Dashboard plugins and slots | PASS, within P3's limits | Unchanged | Slot entries on staff screens stay unverified |

- **The storefront's server errors on an older build** ([P7 §5](2026-10-26-fb-19-platform-p7.md#5-sprees-and-the-storefronts-behaviour-seen-recorded-and-not-changed)) are tracked as an open investigation in LIQ-004's backlog, [FB-22](../LIQ-004-foundation-backlog.md#p1-soon-after). Their cause is unknown. That a fresh build answered every action does not resolve them. They are to be investigated on the standalone server the build is meant for, with the existing test setup. They are not entered as a defect.
- **Tenant isolation stays NOT_RUN**, with ISO-1 to ISO-7 open. Every existing defect stays open, and P7 found none.

## 4. What the merge and the acceptance change, and what they leave open

- **Closed:** G-23, G-32 and G-40.
- **Changed:** CAP-04-05, CAP-04-06 and CAP-04-07 are PASS within their records' limits. Of the 38 capabilities mapped to evidence, 10 are PASS and 22 PARTIAL.
- **Still open:** G-11, for G-45's and G-50's catalog requests; every other pending gap; SD-1 to SD-7; FB-22; tenant isolation, NOT_RUN.
- **Next:** P4 and P5 have not run. G-45 and G-50 need their own refusal checks before G-11 can close.

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Liquorify-specific extensions stay deferred.

**How it is recorded.** Decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), how acceptance is recorded in a document's status fields, is still open. So this record and LIQ-004 carry the acceptance, and no document's `status`, `approved_by` or `approved_at` changes.
