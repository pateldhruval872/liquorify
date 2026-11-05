---
title: FB-19 batch 8, orders, returns and fulfilment, part 1, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-06-03's payment statuses, CAP-06-04 to CAP-06-06, CAP-06-08, CAP-07-01's order part, FL-08), G-88 to G-91 (gaps), SD-31 and SD-33 to SD-34 (defects), SD-32 (held)
date: 2026-11-05
verifier: Claude (automated session, thread "Build dashboard batch 8"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 8's part 1 in #80 at `93bfeba1`, whose stories, fixtures, mocks, reference images and scripts are those of `23501755` with the corrections of `25ba40d0` and `212b1828`. Criteria 1 to 10 and 12 to 17 stand as the verification record gives them, criterion 5 PARTIAL with its failing part. All 45 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them with 3,298 of 3,298 comparisons each, and the merge commit `c2128ac2` holds exactly that revision. Two visual runs on earlier commits failed, each on a story this part then corrected. The merge closes nothing. G-88 to G-91 stay OPEN, SD-32 stays with the owner, SD-31, SD-33 and SD-34 stay open, and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 8, orders, returns and fulfilment, part 1, merged with its delegated acceptance

**Claim.** [#80](https://github.com/pateldhruval872/liquorify/pull/80) holds two things: the proposal for FB-19's [batch 8](../work-items/fb-19-batch-orders-returns-and-fulfilment.md), and its part 1, the order and its money. It met the work item's acceptance criteria as its [verification record](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md) gives them. Every required CI check passed on its final commit, including both full runs of Storybook's visual check, and it merged into `main` exactly as last revised. This record covers:

- the delegated acceptance and the revision it applies to;
- the checks on GitHub, including the two runs that failed before the final commit;
- the merge;
- what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-05 |
| Accepted by | Claude, in the thread "Build dashboard batch 8" |
| Revision | #80's final commit, `93bfeba1`. Its stories, fixtures, mocks, reference images and scripts are those of `23501755`, with two corrections, both described in the verification record's §4.3 and §10:<br>• `25ba40d0` makes the order cancel dialog's Refused story leave no focus after the refusal. Its images did not change.<br>• `212b1828` makes the variant mock read the search the dashboard sends, adds a check to the add line item sheet's Search results story, and retakes that story's two images and the two of Nothing found.<br>The other commits after `23501755` change only Liquorify's records, or bring in `main`:<br>• `37341258`, `3f2a478a`, `4a045f4e`, `fddca29c` and `93bfeba1` add or correct the records.<br>• `49aa87f2` brings in P9's part 5 and its merge record (#81, #82), which changed only Liquorify's records. |
| Scope | As the verification record's [§13](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md#13-delegated-acceptance) gives it:<br>• the 290 reference images of the [image review list](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1-image-review.md), each looked at in light and dark, and the four corrected images again after their correction;<br>• the running-screen evidence;<br>• fidelity, judged from the comparison of 46 cases and 6 earlier stories, with every difference explained;<br>• technical acceptance of criteria 1 to 10 and 12 to 17, with criterion 5 PARTIAL because of its failing part. |
| Not accepted here | • Any answer to a gap, any exception or security risk, and any change of status.<br>• G-88 to G-91 stay OPEN for the owner's answers. Their handling is proposed, not decided.<br>• The narrower roles' requests join G-11 for P10, and G-11 stays open.<br>• SD-32 stays with the owner (row 39 of the owner decision brief).<br>• SD-31, SD-33 and SD-34 stay open with their proposed severities.<br>• B1 to B21 stay recorded as Spree's and the storefront's behaviour.<br>• FB-03's result stays with the owner. |

What the checks did not show stays as the verification record's §11 states it:

- Coverage is not functional verification.
- Nine states were reached by answering or holding a request in the browser.
- FL-08's payment steps cannot be shown while SD-32 stands.
- Whether Spree sends three of the order emails on the running stack is unknown.
- Tenant isolation is NOT_RUN, with ISO-1 to ISO-7 open.

**What the image review missed.** The verification record's §4.3 corrects one error that the review of the first images missed. The two pairs of images for the add line item sheet's search stories were looked at and accepted. They listed all five of the sample store's products for any search. A CI run exposed it (§3). Only the corrected images are accepted here.

## 2. The merge commit

`main` at `c2128ac2`, "Merge pull request #80: Added batch 8 part 1: orders and their money, with stories, captures, settings and order emails", merged at 11:39 UTC on 2026-11-05 through GitHub's protected merge, with no rule bypassed. Its parents are `main` at `ac295a0d`, after #82, and #80's final commit `93bfeba1`. Its tree is `fc68ec1d`, the same as `93bfeba1`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 1,331 files:

- **The Storybook package, 325 files.**
  - Under `packages/liquorify-storybook/src/`, 24 files: 20 story files and the page helper they share, the order fixtures, the order mocks, and the corrected variant mock that batch 6's stories also use.
  - The 290 reference images under `visual/__screenshots__/`.
  - 11 capture, comparison, settings, digital delivery, SD-31, payment link and email files under `fidelity/`. Nine are new. The browser-test roles file and the configuration that lists the new scripts gained lines.
- **Records, 1,006 files:**
  - under `liquorify/verification/`: the verification record, the image review list and 1,000 evidence files;
  - LIQ-004, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile.

**The shared mock.** The variant mock in `src/mocks/handlers/admin/inventory.ts` came from batch 6. It read a `search` field. The dashboard's pickers send the search as `q[search]`, so the mock never filtered and every search listed all of its products. It now reads `q[search]`, as the other pickers' mocks already did. Batch 6's stories open their pickers without typing a search, so none of their images changed. A local run of the visual check over the stock and order stories passed all 462 of their images after the change, and the 24 of the stock locations page, which uses the same mocks. Both full runs in CI passed every image (§3).

## 3. Required checks on the final commit

All 45 checks on `93bfeba1` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages each ran once on this commit. Storybook's visual check ran twice, once from the pull request and once started by hand, as criterion 8 asks. No job was run again.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 42017785851](https://github.com/pateldhruval872/liquorify/actions/runs/42017785851)) | Passed, 11:17 to 11:33 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 42017785860](https://github.com/pateldhruval872/liquorify/actions/runs/42017785860)) | Passed, 11:17 to 11:26 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42017785867](https://github.com/pateldhruval872/liquorify/actions/runs/42017785867)) | Passed, 11:17 to 11:32 UTC: 3,298 of 3,298 comparisons, 825, 825, 824 and 824 in its parts, in 13.5, 9.5, 13.2 and 10.8 minutes, none retried |
| Storybook & visual check, started by hand, in four parts, and its summary ([42017783612](https://github.com/pateldhruval872/liquorify/actions/runs/42017783612)) | Passed, 11:17 to 11:35 UTC: 3,298 of 3,298 comparisons, in 16.4, 9.8, 12.2 and 12.2 minutes, none retried |

The 3,298 comparisons are part 1's 290 and the 3,008 of the batches merged before it. Every image held the agreed tolerance. The longest part took 16.4 minutes, well inside the workflow's limit.

**The earlier heads.** Every run on #80 is listed. None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `f90ca891`, `23501755` | None | Pushed before #80 was opened at 09:23 UTC, so neither had runs of its own |
| `37341258` | [Tests 42002028421](https://github.com/pateldhruval872/liquorify/actions/runs/42002028421), [Packages 42002028429](https://github.com/pateldhruval872/liquorify/actions/runs/42002028429), [Storybook 42002028480](https://github.com/pateldhruval872/liquorify/actions/runs/42002028480) | All cancelled unfinished by the push of `3f2a478a` |
| `3f2a478a` | [Tests 42003112450](https://github.com/pateldhruval872/liquorify/actions/runs/42003112450), [Packages 42003112584](https://github.com/pateldhruval872/liquorify/actions/runs/42003112584), [Storybook 42003112474](https://github.com/pateldhruval872/liquorify/actions/runs/42003112474) from the pull request and [42003164601](https://github.com/pateldhruval872/liquorify/actions/runs/42003164601) started by hand | Tests and Packages passed. Both visual runs failed in part 3, on one image: the dark capture of the order cancel dialog's Refused story, which showed a focus ring the reference does not have. `25ba40d0` corrected the story |
| `25ba40d0`, `4a045f4e` | None | Pushed with `fddca29c`, which superseded them |
| `fddca29c` | [Storybook 42007796143](https://github.com/pateldhruval872/liquorify/actions/runs/42007796143), started by hand | Passed. Not merged, for two reasons: `main` had moved, after P9's part 5 (#81, #82), and #80 conflicted with it in LIQ-004 and the README index. For the same reason the pull request's own workflows did not start on this commit |
| `49aa87f2`, after #81 and #82 | [Tests 42010964086](https://github.com/pateldhruval872/liquorify/actions/runs/42010964086), [Packages 42010964076](https://github.com/pateldhruval872/liquorify/actions/runs/42010964076), [Storybook 42010964148](https://github.com/pateldhruval872/liquorify/actions/runs/42010964148) from the pull request and [42010961725](https://github.com/pateldhruval872/liquorify/actions/runs/42010961725) started by hand | Tests, Packages and the pull request's visual run passed. The run started by hand failed in part 3, in both themes of the add line item sheet's Nothing found story: its play function did not find "No variants found". The cause was the mock (§2). The text appeared only while each search waited for its answer, so the story passed only when its check ran first. Looking at the images then showed they were wrong. `212b1828` corrected the mock, the story and the four images |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | [42020769360](https://github.com/pateldhruval872/liquorify/actions/runs/42020769360) | Passed, 11:39 to 11:49 UTC, on its first attempt. The release jobs were skipped |
| Storybook's visual check, started by hand on `main` at `c2128ac2`, because part 1 adds stories and reference images | [42020943466](https://github.com/pateldhruval872/liquorify/actions/runs/42020943466) | Passed, 11:41 to 11:58 UTC: all four parts and the summary, each on its first attempt, in 16.5, 10.4, 13.4 and 14.3 minutes. `main`'s tree is #80's final tree, so these are the same 3,298 comparisons |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None | Did not start, as expected. On a push to `main` it runs only when `spree/` or its own workflow file changes, and #80 changes neither. It passed on #80's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 1 as merged, at `93bfeba1`, within its documented limits, by delegated acceptance. The image review list records every image as DELEGATED ACCEPTANCE. The acceptance changes no functional result.
- **Capabilities:** CAP-06-03's payment statuses, CAP-06-04, CAP-06-05, CAP-06-06 and CAP-06-08 are mapped, which makes 67 of 93. CAP-07-01's order part is mapped too; it was already counted. All are PARTIAL, for G-90. CAP-06-08 has no browser test at all. CAP-06-04 has a failing part, the payment link (SD-32).
- **Flows:** FL-08 is mapped step by step, and FL-16's last step, an order's discounts, completes FL-16's map, which makes 15 of 24. FL-08 is PARTIAL with a failing part: its draft steps pass Spree's browser tests in CI, and its payment steps cannot be shown. FL-16 stays PARTIAL.
- **Screens, emails and components:**
  - 72 of the dashboard's and seller panel's 117 screens are captured.
  - 15 of the 27 emails are rendered.
  - 271 of the dashboard side's 379 components have stories.
- **Still open:**
  - G-88 to G-91 wait for the owner's answers.
  - SD-32 waits for the owner's decision.
  - SD-31, SD-33 and SD-34 stay open with their proposed severities.
  - The narrower roles' requests join G-11 for P10, and G-11 stays open.
  - B1 to B21 stay recorded and not changed.
  - Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open.
  - FB-03's result stays with the owner.
- **Statuses are unchanged.** The work item stays PROPOSED until it is accepted under D5, and LIQ-004 stays DRAFT.
- **Next:** in lane C, part 2 of batch 8 follows. It covers fulfilments, returns and refunds, with FL-06 and FL-07, in its own pull request from `main`.
