---
title: FB-19 batch 13 part 2, the seller panel, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-10-03, CAP-10-09 and the seller's side of CAP-10-02, CAP-10-04, CAP-10-05 and CAP-10-07; the seller's steps of FL-11 to FL-13), G-112 to G-116 (gaps), SD-72 to SD-81 and SD-85 (defects)
date: 2026-11-10
verifier: Claude (automated session, the thread for batch 13); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 13 part 2 in #101 at `bc813953`, after the corrections the owner asked for on 2026-11-10. Criteria 1 to 7 and 9 to 18 stand as the verification record gives them, and criterion 8 is met here. All 45 checks on the final commit passed or were skipped as on every pull request, with both full visual runs among them, and the merge commit `df50e3c0` holds exactly that revision. On `main`, Packages from the push and a Storybook visual run started by hand both passed on `df50e3c0`. The approved defects stay open with their fixes deferred; SD-85 is held for the owner. Tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 13 part 2, the seller panel, merged with its delegated acceptance

**Claim.** [#101](https://github.com/pateldhruval872/liquorify/pull/101) holds part 2 of FB-19's [batch 13](../work-items/fb-19-batch-marketplace.md): the seller panel, and the storefront's checkout of a cart that holds two sellers' products. It met the work item's acceptance criteria as its [verification record](2026-11-10-fb-19-batch-marketplace-part-2.md) gives them, with the corrections the owner asked for on 2026-11-10 made first. Every required check passed on its final commit, including both full runs of Storybook's visual check. It merged into `main` exactly as last revised.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-10 |
| Accepted by | Claude, in the thread for batch 13 |
| Conditions | The owner's message of 2026-11-10 allowed the merge only after three things: the G-115 correction, a corrected comparison headline and a corrected SD-21 statement. Then the final acceptance criteria, both visual runs, Tests and Packages had to pass. All of these were met (§2 and §4) |
| Revision | #101's final commit, `bc813953`. Its stories, fixtures, mocks and scripts are those of `34ba129d`, with the G-115 correction and its 26 rewritten reference images in `83eb52d3`. The other commits change only Liquorify's records (`8f79e738`, `83eb52d3`), or bring in `main` (`d7d0134b` after #102, `25f68fbd` after #103, `bc813953` after #94). The merges with #103 and #94 conflicted only in LIQ-004, and both sides' rows were kept, with the progress counts adding up both batches. After #94 came in, its 164 customer and address images were checked locally against the corrected translations, and all of them passed |
| Scope | As the verification record's §13 gives it: the 234 reference images of the [image review list](2026-11-10-fb-19-batch-marketplace-part-2-image-review.md), each looked at in light and dark, and the 26 written again for G-115 ([record §4.4](2026-11-10-fb-19-batch-marketplace-part-2.md#44-the-panels-own-translations-g-115)); the running-screen evidence; fidelity, judged from the repeated comparison of 28 cases and 4 earlier stories, with the three remaining differences explained by focus and by data; and technical acceptance of criteria 1 to 10 and 12 to 18 |
| Not accepted here | • The approved defects, SD-60 to SD-81 except SD-78, which stay open with their fixes deferred until after the baseline. The High items, SD-60, SD-72 and SD-73, are fixed before the workflows they affect are released.<br>• SD-78, an observation for product review.<br>• SD-85, held for the owner's answer.<br>• G-112 to G-116 as the owner answered them ([record §14](2026-11-10-fb-19-batch-marketplace-part-2.md#14-the-owners-answers-of-2026-11-10)). The behaviours of G-105 and G-114 stay unverified until their scheduled browser checks run. Nothing unverified becomes PASS.<br>• Tenant isolation, which stays NOT_RUN. ISO-1 to ISO-7 stay open and FB-03 stays paused. |

## 2. The owner's corrections, made before the merge

- **G-115:** the seller panel stories now load only the framework's and the panel's own English, as the running panel does. The full visual check then changed 26 images of 13 stories. Each was looked at and written again. The seller panel's return and label dialogs now show the raw keys the running panel shows. The admin export dialog and settings index now show the admin dashboard's own wording, where before they showed the seller panel's. The correction found SD-85, the label dialog's raw key, which was confirmed on the running panel ([record §4.4](2026-11-10-fb-19-batch-marketplace-part-2.md#44-the-panels-own-translations-g-115)).
- **The comparison:** all 64 comparisons were run again on a fresh browser-test database, and the evidence holds that run. The headline now says that three cases differ, one because of focus and two because of data. The new return case had first been put down to SD-74's key wrapping onto two lines. That was wrong: it differs because the running order has two items and the story's has one.
- **SD-74:** its key had been recorded wrongly. The real key is `admin.pages.orders.detail.returns.actions.create`, and the capture always showed it.
- **SD-21:** the record's limitation no longer says that a signed-in checkout is blocked. SD-21 was fixed in storefront #26 and closed on 2026-11-05.
- **The owner's answers** on SD-60 to SD-81 and G-105 to G-116 are recorded in LIQ-004 and in the [record's §14](2026-11-10-fb-19-batch-marketplace-part-2.md#14-the-owners-answers-of-2026-11-10).

## 3. The merge commit

`main` at `df50e3c0`, "Merge pull request #101: Added batch 13 part 2, the seller panel", merged on 2026-11-10 through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `a3a427fc`, after #94, and #101's final commit `bc813953`. Its tree is `c2705ae8`, the same as `bc813953`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 802 files:

- **The Storybook package, 300 files**, under `packages/liquorify-storybook/`: the story files, fixtures and mocks, the panels' translation setup, the reference images, the fidelity scripts and the fidelity configuration.
- **Records, 502 files:** under `liquorify/verification/`, the verification record, the image review list and the evidence; LIQ-004, LIQ-008, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

## 4. Required checks on the final commit

All 45 checks on `bc813953` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages each ran once on this commit. Storybook's visual check ran twice, once from the pull request and once started by hand, as criterion 8 asks. No job was run again.

| Check | Result |
|---|---|
| Tests: Build (PostgreSQL) and (MySQL), each with 9 test jobs, and Brakeman ([42847514148](https://github.com/pateldhruval872/liquorify/actions/runs/42847514148)) | Passed, 15:44 to 16:16 UTC |
| Packages: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42847514269](https://github.com/pateldhruval872/liquorify/actions/runs/42847514269)) | Passed, 15:44 to 15:54 UTC |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42847514119](https://github.com/pateldhruval872/liquorify/actions/runs/42847514119)) | Passed, 15:44 to 16:06 UTC, every part passed |
| Storybook & visual check, started by hand, in four parts, and its summary ([42847506932](https://github.com/pateldhruval872/liquorify/actions/runs/42847506932)) | Passed, 15:44 to 16:08 UTC, every part passed |

**The earlier heads.** None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `25f68fbd` | The pull request's runs, and a Storybook run started by hand | Superseded by `bc813953` when #94 merged into `main`. Its Storybook run from the pull request was cancelled by the new push. Packages failed one test, a German-language admin entering product prices, in its third Dashboard - E2E part ([42843510486](https://github.com/pateldhruval872/liquorify/actions/runs/42843510486)). This branch changes no dashboard code, and the same test passed on `8f79e738` before and on `bc813953` after, so it does not count against this pull request. It is not recorded as a defect, and it was not run again |
| `8f79e738` | [Tests 42805652298](https://github.com/pateldhruval872/liquorify/actions/runs/42805652298), [Packages 42805652265](https://github.com/pateldhruval872/liquorify/actions/runs/42805652265), [Storybook 42805652260](https://github.com/pateldhruval872/liquorify/actions/runs/42805652260) and [42808730490](https://github.com/pateldhruval872/liquorify/actions/runs/42808730490) started by hand | Passed. Superseded by the owner's corrections of 2026-11-10 |
| `1342549c`, `34ba129d` and the draft's earlier heads | The pull request's runs while it was a draft | Superseded |

## 5. `main` after the merge

Both runs on `main` at `df50e3c0` passed. Tests did not start on the push, because the merge changes no file its workflow watches; it passed on the same tree as `bc813953` (§4).

| Check | Result |
|---|---|
| Packages, from the push to `main`: Typecheck, Test & Build; Scaffolded app; SDK Integration Tests; Dashboard - E2E in four parts ([42853045742](https://github.com/pateldhruval872/liquorify/actions/runs/42853045742)) | Passed, 16:17 to 16:35 UTC. The 6 release jobs were skipped |
| Storybook & visual check, started by hand on `main`, in four parts, and its summary ([42853099999](https://github.com/pateldhruval872/liquorify/actions/runs/42853099999)) | Passed, 16:17 to 16:45 UTC, every part passed |

## 6. What stays open

- The approved marketplace defects, with their fixes deferred until after the baseline. SD-60, SD-72 and SD-73 are High, and are fixed before the workflows they affect are released.
- SD-85, held for the owner's answer, and SD-78, an observation for product review.
- G-105 and G-114's scheduled browser checks, G-106's authorization follow-up with G-11, G-107's proposal setting a policy action by action, G-109 with P4, G-110 with G-16 and G-77, G-111 and G-116 with the comparison follow-up, G-112 blocked by SD-73, and G-113's supported lifecycle states.
- Tenant isolation, NOT_RUN, with the multi-tenant release block kept. Server permissions are unchanged, and nothing here authorizes broader access or role-template changes. Figma editing access and the private P4 backend sandbox keys stay owner actions.
