---
title: FB-19 batch 8, orders, returns and fulfilment, part 2, merged with its delegated acceptance
record: verification
work_item: FB-19 (CAP-07-06, CAP-06-07, CAP-06-03's fulfilment statuses, FL-06, FL-07), G-92 to G-95 (gaps), SD-35 to SD-40 (defects)
date: 2026-11-08
verifier: Claude (automated session, thread "Build dashboard batch 8"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04, of batch 8's part 2 in #84 at `0c5223bf`, whose stories, fixtures, mocks, reference images and scripts are those of `8ccfbdaa` with the correction of `43fa5ad5`. Criteria 1 to 10 and 12 to 17 stand as the verification record gives them. All 45 checks on the final commit passed or were skipped as on every pull request, both full visual runs among them with 3,722 of 3,722 comparisons each, and the merge commit `63394738` holds exactly that revision. On an earlier commit the visual run started by hand failed on a story this part then corrected, and Tests failed on Spree's translation check after a tool release that #85 fixed on `main`. The merge closes nothing. G-92 to G-95 stay OPEN, SD-35 to SD-40 stay open, and tenant isolation stays NOT_RUN. This is not the owner's review
---

# FB-19 batch 8, orders, returns and fulfilment, part 2, merged with its delegated acceptance

**Claim.** [#84](https://github.com/pateldhruval872/liquorify/pull/84) holds part 2 of FB-19's [batch 8](../work-items/fb-19-batch-orders-returns-and-fulfilment.md): fulfilment and what happens after the sale. It met the work item's acceptance criteria as its [verification record](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2.md) gives them. Every required CI check passed on its final commit, including both full runs of Storybook's visual check, and it merged into `main` exactly as last revised. With it, batch 8 is complete. This record covers:

- the delegated acceptance and the revision it applies to;
- the checks on GitHub, including the runs that failed before the final commit;
- the merge;
- what stays open.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)). The owner did not review this work |
| Date | 2026-11-08 |
| Accepted by | Claude, in the thread "Build dashboard batch 8" |
| Revision | #84's final commit, `0c5223bf`. Its stories, fixtures, mocks, reference images and scripts are those of `8ccfbdaa`, with one correction, described in the verification record's §4.3 and §10:<br>• `43fa5ad5` makes two refusal stories, the Fulfillment fulfill form's Backordered, refused and the Fulfillment label upload dialog's Refused, leave no focus after the refusal, and removes two unused helpers from the after-sale mocks. No image changed.<br>The other commits after `8ccfbdaa` change only Liquorify's records, or bring in `main`:<br>• `ceaaad1d` and `295468af` correct the records. `43fa5ad5` also records its own correction.<br>• `0c5223bf` brings in #85, which changed only Spree's translation check settings (§3). |
| Scope | As the verification record's [§13](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2.md#13-delegated-acceptance) gives it:<br>• the 424 reference images of the [image review list](2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2-image-review.md), each looked at in light and dark, and the two corrected images again after their correction;<br>• the running-screen evidence;<br>• fidelity, judged from the comparison of 50 cases and 2 earlier stories, with every difference explained;<br>• technical acceptance of criteria 1 to 10 and 12 to 17. |
| Not accepted here | • Any answer to a gap, any exception or security risk, and any change of status.<br>• G-92 to G-95 stay OPEN for the owner's answers. Their handling is proposed, not decided.<br>• The narrower roles' requests join G-11 for P10, and G-11 stays open.<br>• G-88 stays open for its other 97 stories.<br>• SD-35 to SD-40 stay open with their proposed severities, and SD-32 stays with the owner.<br>• B1 to B29 stay recorded as Spree's and the storefront's behaviour.<br>• FB-03's result stays with the owner. |

What the checks did not show stays as the verification record's §11 states it:

- Coverage is not functional verification. The 15 behaviours no browser test drives are G-92.
- Four states were reached by answering a request in the browser (G-94).
- What the interface shows each role is not what the server allows. The narrower roles' requests were not sent (G-95).
- No carrier account is loaded, so a label is only ever uploaded.
- The emails were rendered, not sent.
- Tenant isolation is NOT_RUN, with ISO-1 to ISO-7 open.

**What the image review did not show.** Two of the accepted stories did not always draw their image: depending on how fast the refusal came back, focus stayed on the button just pressed and drew a ring that the reference does not have. The images were right; the stories' play functions were not. A CI run exposed one of them, and a longer local run the other (§3). Only the stories as corrected are accepted here.

## 2. The merge commit

`main` at `63394738`, "Merge pull request #84: Added batch 8 part 2, fulfilment, returns, exchanges and claims", merged at 22:27 UTC on 2026-11-08 through GitHub's pull request merge, with no rule bypassed. Its parents are `main` at `a44e3cba`, after #85, and #84's final commit `0c5223bf`. Its tree is `d044932e`, the same as `0c5223bf`'s, so the merge brought in exactly the accepted revision and nothing else.

It changed 1,157 files:

- **The Storybook package, 458 files.**
  - Under `packages/liquorify-storybook/src/`, 26 files: 22 story files, the after-sale fixtures and mocks, the order page helper they share with part 1, and the fixture tests.
  - The 424 reference images under `visual/__screenshots__/`. No earlier image changed.
  - 8 files under `fidelity/`. Six are new: the capture, comparison, settings, FL-06 and SD-36 scripts and the helper they share. The order email script and the configuration that lists the new scripts gained lines.
- **Records, 699 files:**
  - under `liquorify/verification/`: the verification record, the image review list and 693 evidence files;
  - LIQ-004, LIQ-009, the README index and the work item.
- **Nothing else.** No file under `spree/` changed, and no workflow, `package.json` or lockfile. The translation check settings that `0c5223bf` brought in were already on `main`.

## 3. Required checks on the final commit

All 45 checks on `0c5223bf` finished without a failure: 39 passed, and 6 release jobs were skipped, as on every pull request. Tests and Packages each ran once on this commit. Storybook's visual check ran twice, once from the pull request and once started by hand, as criterion 8 asks. No job was run again.

| Check | Result |
|---|---|
| Build (PostgreSQL) and its 9 test jobs: core in three parts, api, emails, dashboard, mcp, opentelemetry and providers ([Tests 42528732072](https://github.com/pateldhruval872/liquorify/actions/runs/42528732072)) | Passed, 22:08 to 22:24 UTC |
| Build (MySQL) and its 9 test jobs | Passed |
| Brakeman | Passed |
| Typecheck, Test & Build; Scaffolded app - Typecheck & Lint; SDK Integration Tests ([Packages 42528732076](https://github.com/pateldhruval872/liquorify/actions/runs/42528732076)) | Passed, 22:08 to 22:17 UTC |
| Dashboard - E2E, in four parts, and its summary | Passed |
| Storybook & visual check, from the pull request, in four parts, and its summary ([42528732119](https://github.com/pateldhruval872/liquorify/actions/runs/42528732119)) | Passed, 22:08 to 22:25 UTC: 3,722 of 3,722 comparisons, 931, 931, 930 and 930 in its parts, in 15.7, 12.1, 15.0 and 15.7 minutes, none retried |
| Storybook & visual check, started by hand, in four parts, and its summary ([42528736087](https://github.com/pateldhruval872/liquorify/actions/runs/42528736087)) | Passed, 22:08 to 22:26 UTC: 3,722 of 3,722 comparisons, in 15.8, 14.1, 14.2 and 15.9 minutes, none retried |

The 3,722 comparisons are part 2's 424 and the 3,298 of the batches merged before it. Every image held the agreed tolerance. The longest part took 15.9 minutes, well inside the workflow's limit.

**The earlier heads.** Every run on #84 is listed. None of them counts.

| Revision | Runs | Result |
|---|---|---|
| `8ccfbdaa` | [Tests 42524044258](https://github.com/pateldhruval872/liquorify/actions/runs/42524044258), [Packages 42524044187](https://github.com/pateldhruval872/liquorify/actions/runs/42524044187), [Storybook 42524044285](https://github.com/pateldhruval872/liquorify/actions/runs/42524044285) | All cancelled unfinished by the push of `ceaaad1d` |
| `ceaaad1d` | [Tests 42524102882](https://github.com/pateldhruval872/liquorify/actions/runs/42524102882), [Packages 42524102926](https://github.com/pateldhruval872/liquorify/actions/runs/42524102926), [Storybook 42524102957](https://github.com/pateldhruval872/liquorify/actions/runs/42524102957) from the pull request and [42524141666](https://github.com/pateldhruval872/liquorify/actions/runs/42524141666) started by hand | All cancelled unfinished by the push of `295468af` |
| `295468af` | [Tests 42524575551](https://github.com/pateldhruval872/liquorify/actions/runs/42524575551), [Packages 42524575529](https://github.com/pateldhruval872/liquorify/actions/runs/42524575529), [Storybook 42524575570](https://github.com/pateldhruval872/liquorify/actions/runs/42524575570) from the pull request and [42524592006](https://github.com/pateldhruval872/liquorify/actions/runs/42524592006) started by hand | Packages and the pull request's visual run passed. The run started by hand failed in part 3, on one image: the dark capture of the Fulfillment fulfill form's Backordered, refused story, which showed a focus ring on Fulfill items. `43fa5ad5` corrected that story and one more like it (§1). Tests failed in 2 of its 21 jobs, MySQL - core (1/3) and PostgreSQL - core (1/3). MySQL's log shows Spree's translation check, `spree/core/spec/i18n_spec.rb:23`, failing on five translations of one error message. i18n-tasks 1.2.0, released that day, began to flag them, and CI installs the newest version, since no lockfile is committed. PostgreSQL's log was not read as far as the failing example. Part 2 changes nothing under `spree/`. A separate pull request, #85, added that message to the check's ignore list, and merged at `a44e3cba`; `0c5223bf` brought it in, and both jobs passed there |
| `43fa5ad5` | None | Pushed with `0c5223bf`, which superseded it |

## 4. Workflows on `main`

| Workflow | Run | Result |
|---|---|---|
| Packages: typecheck, tests and builds of the TypeScript packages, the dashboard's browser tests and the scaffolded app | PENDING | Started by the merge |
| Storybook's visual check, started by hand on `main` at `63394738`, because part 2 adds stories and reference images | PENDING | Started by hand after the merge |
| Tests: the backend's builds and Spree's test suites on PostgreSQL and MySQL, and Brakeman | None expected | On a push to `main` it runs only when `spree/` or its own workflow file changes, and #84 changes neither. It passed on #84's final commit |

## 5. What the merge changes, and what stays open

- **Accepted and merged:** part 2 as merged, at `0c5223bf`, within its documented limits, by delegated acceptance. The image review list records every image as DELEGATED ACCEPTANCE. The acceptance changes no functional result.
- **Capabilities:** CAP-07-06 and CAP-06-07 are mapped, which makes 69 of 93. CAP-06-03 is now mapped for both its statuses; it was already counted. All are PARTIAL, for G-92.
- **Flows:** FL-06 and FL-07 are mapped step by step, which makes 17 of 24. Both are PARTIAL: their steps with browser tests pass Spree's tests in CI, and fulfilling with tracking, the deliveries, an exchange and FL-06's shipment on the shopper's order page have none (G-92). Once a fulfilment is canceled, the order page never offers to ship its units again (SD-36).
- **Screens, emails and components:**
  - 75 of the dashboard's and seller panel's 117 screens are captured.
  - 18 of the 27 emails are rendered.
  - 293 of the dashboard side's 379 components have stories.
- **Still open:**
  - G-92 to G-95 wait for the owner's answers.
  - SD-35 to SD-40 stay open with their proposed severities, and SD-32 waits for the owner's decision.
  - The narrower roles' requests join G-11 for P10, and G-11 stays open.
  - G-88 stays open for its other 97 stories.
  - B1 to B29 stay recorded and not changed.
  - Tenant isolation stays NOT_RUN, with ISO-1 to ISO-7 open.
  - FB-03's result stays with the owner.
- **Statuses are unchanged.** The work item stays PROPOSED until it is accepted under D5, and LIQ-004 stays DRAFT.
- **Next:** batch 8 is complete, and lane C's slot is free. The next items in dependency order are batches 10 and 11, which depend on orders, as LIQ-004's lane table sets out.
