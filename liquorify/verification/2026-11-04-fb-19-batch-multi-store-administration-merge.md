---
title: FB-19 batch 15, multi-store administration, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-11-12), SD-18 (defect), G-72 (gap)
date: 2026-11-04
verifier: Claude (automated session, thread "Verify Spree multi-store administration"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 15 in #49 at `c3cde9e2`, whose captures were made from `1320592d`. Criteria 1 to 8 of the work item are met as its verification record states, and every required CI check passed on the final commit. The merge commit `ddc7d91f` holds exactly that revision. Packages passed on `main` at `ddc7d91f`. Tests did not start there, as expected, because #49 changes nothing it watches on `main`. It closes nothing. SD-18 stays open, G-72 stays pending, CAP-11-12 stays PARTIAL with a failing part, and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 15, multi-store administration, merged with its delegated acceptance

**Claim.** Batch 15 in [#49](https://github.com/pateldhruval872/liquorify/pull/49) met the acceptance criteria of its [work item](../work-items/fb-19-batch-multi-store-administration.md) (§5) as its [verification record](2026-11-04-fb-19-batch-multi-store-administration.md) states. Every required CI check passed on its final commit, and it merged into `main` exactly as it was last revised. This record states the delegated acceptance, the revision it applies to, and what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-04 |
| Accepted by | Claude, in the thread "Verify Spree multi-store administration" |
| Revision | #49's final commit, `c3cde9e2`. The capture script and every capture are from `1320592d`. The commits after it add records and evidence only, and bring in `main` after #47 and #48 |
| Technical acceptance | Criteria 1, 2 and 4 to 8 of the work item's §5, against the verification record: the map; every listed state captured, 21 states in 42 captures; no change to Spree, the storefront or any workflow; the records updated; Spree's own specs for the server's side, 187 examples with no failures; tenant isolation NOT_RUN; and the search for invitation links, tokens and passwords, which found none. Criterion 3 needed nothing, because no component lacked a story |
| Image acceptance | The 42 captures and the four side-by-side pictures, each looked at in light and dark (record §4). None shows a rendering fault apart from the behaviour the record states in §5. No story or reference image changed, and Storybook's visual check passed on the final commit |
| Fidelity acceptance | The running store switcher draws the same parts as its Open and One store stories, in both themes, within the limits of the record's §4: the pictures are diagnostic, and no computed style comparison was run for the switcher, whose stories the staff access batch already compared |
| Not accepted here | Any answer to a gap, G-72 included, any decision on fixing SD-18 or on B2, any exception or security risk, FB-03's result, and any change of status |

What the checks did not show stays as the verification record's §9 states it:

- The captures and their assertions ran once, and are not a browser test (G-72).
- The navigation after a switch, the settings menu and SD-18's three states are recorded as shown, not asserted.
- SD-18 was observed for ten seconds after a switch. Whether the dashboard corrects itself later without a reload was not checked.
- Spree's specs ran locally on SQLite with Ruby 3.3.6. CI ran Spree's suites on PostgreSQL and MySQL (§3).
- Tenant isolation is NOT_RUN.

## 2. The merge commit

`main` at `ddc7d91f`, "Merge pull request #49", has two parents: `main` at `40126a78`, after #48, and #49's final commit `c3cde9e2`. Its tree is `cfa4c179`, the same as `c3cde9e2`'s, so the merge brought in exactly the reviewed revision and nothing else. `c3cde9e2` had already brought in `main` after #48, keeping both new rows of the README index, so GitHub showed the pull request as up to date and clean before the merge. It merged through GitHub's protected merge, with no rule bypassed.

## 3. Required checks on the final commit

All 36 checks on `c3cde9e2` finished without a failure. 30 passed, and 6 release jobs were skipped, as on every pull request. Each workflow ran once on this commit. The required ones:

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers | Passed |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests | Passed |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check | Passed on its first attempt: 1,616 of 1,616 comparisons |

On the previous head, `ef7cf6e8`, the visual check's first attempt failed 1 of 1,616 comparisons, on a story this pull request does not touch: catalog part 1's media edit sheet, "Assigned to a variant", in light. One re-run passed all 1,616 (verification record §8). The same story passed on `c3cde9e2`'s only attempt. It is noted here. It is not tracked as a defect, and whether it recurs is not known.

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [41810566441](https://github.com/pateldhruval872/liquorify/actions/runs/41810566441) | Passed, 09:53 to 10:02 UTC, on its first attempt. The release jobs were skipped |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #49 changes neither. It passed on #49's final commit |

Storybook's visual check runs on pull requests only, and passed on #49's final commit.

## 5. What stays open

- **SD-18 stays open**, at Medium: after a store switch, the dashboard keeps the previous store's permissions until a reload, while the server answers each store by that store's roles. Fixing it is a decision for after the baseline, in its own pull request. It is not reported to Spree ([decisions 21 and 37](2026-11-04-owner-decision-brief-answers.md)).
- **G-72 stays PENDING**, in the owner brief as row 23. No browser test covers a teammate in two stores, switching between their stores, or joining a second store with an existing account. Delegated acceptance does not answer it.
- **B1 to B7 are recorded and unchanged.** Whether to track B2, the phone drawing no store switcher, as a defect is the owner brief's row 24.
- **G-11 stays open.** The support role's refusals in the second store beyond Spree's specs join it, with no new number.
- **CAP-11-12 stays PARTIAL** with a failing part, SD-18, and for G-72 and tenant isolation.
- **Tenant isolation stays NOT_RUN**, and ISO-1 to ISO-7 stay open. It remains FB-03's, whose result stays with the owner.
- **The product decision stays the owner's.** Whether one Liquorify login may be staff at two businesses stays open in LIQ-006 §11.
- **Statuses are unchanged.** The work item stays PROPOSED, and LIQ-004 stays DRAFT.
