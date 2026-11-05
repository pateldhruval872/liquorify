---
title: FB-06's step 2.2 merged, with its delegated acceptance
record: verification
work_item: FB-06
date: 2026-11-04
verifier: Claude (automated session, thread "Test storefront against Liquorify backend"); not independent review
result: Delegated acceptance, under the owner's delegation of 2026-11-04 and the owner's authorization of the same day for this CI workflow change, of storefront #23 at `ecbc9ac`. All 21 browser tests passed twice in CI on that commit, with no retry, and every other check passed on it. The merge commit `ad77c3d` holds exactly that revision, and CI passed on the storefront's `main` at `ad77c3d`, all 21 browser tests included. FB-06 is DONE on passing evidence for its done-when. FB-05, where the host application lives for development and hosting, stays open. This is not the owner's review
---

# FB-06's step 2.2 merged, with its delegated acceptance

**Claim.** Storefront [#23](https://github.com/pateldhruval872/liquorify-storefront/pull/23) moved the storefront's browser tests, in CI and locally, to a backend built from a recorded `liquorify` revision, as the owner decided on 2026-11-04 (rows C and D of the owner decision brief). It met the acceptance criteria of the [foundation lane's step 2](../work-items/foundation-lane-security-audit-and-storefront-backend.md#2-step-2-the-storefronts-browser-tests-against-a-pinned-liquorify-backend-fb-06) and the conditions the owner set for its merge. This record states the delegated acceptance, the revision it applies to, and what it closes and leaves open. Results from CI and results from the cloud environment are kept apart.

## 1. The delegated acceptance

| What | Detail |
|---|---|
| Kind | **Delegated acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)), with the owner's authorization of the same day for this CI workflow change to merge with no further personal review ([record](2026-11-04-owner-decision-brief-answers-2.md#5-later-the-same-day)). The owner did not review this work |
| Date | 2026-11-04 |
| Accepted by | Claude, in the thread "Test storefront against Liquorify backend" |
| Revision | #23's final commit, `ecbc9ac` |
| Scope | Technical acceptance against the lane's six criteria (§2) and the owner's merge conditions: the technical review completed, the branch brought up to date with `main` with any conflicts resolved, two passing browser-test runs on the final revision, and `main` checked after the merge |
| Not accepted here | Where the host application lives for development and hosting (FB-05), the move to Spree's 6.0 releases (FB-12), and the storefront's open Dependabot pull requests (FB-11). Nothing about tenant isolation |

## 2. Against the acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | The browser tests start a backend built from the recorded `liquorify` revision, and no step pulls `ghcr.io/spree/spree` | PASS | The workflow checks out `liquorify` at `68236c59` and Spree's starter at `a853a63`, and starts the backend from them. `e2e-backend/docker-compose.yml` and `e2e-backend/.env` are removed, and no workflow, script, package script or README line names the published image |
| 2 | Changing the recorded revision is a one-line change, and the record says who changes it and when | PASS | `e2e-backend/liquorify-backend.env`. `4ce4270` moved the revision with a one-line change, and the file's comments say who changes it and when, and how to update the lockfile with it |
| 3 | `@spree/sdk` is 2.0.0-rc.4, and the lockfile shows no local path | PASS | `package.json` and `pnpm-lock.yaml` on `ecbc9ac` |
| 4 | All browser tests pass twice on the same revision, with any retry recorded | PASS in CI | §3 |
| 5 | No credential, key or machine path is committed; the Stripe keys stay in the existing secret and variable | PASS | The pull request's 13 files, searched. The backend's lockfile names `liquorify` by a relative path. The test-only settings in `liquorify-backend.env` are the ones the removed compose file already carried |
| 6 | No page or component changes, and nothing carries Liquorify branding | PASS | The file list: the workflow, scripts, the backend's settings and lockfile, `package.json`, the lockfile, the README, Playwright's configuration and comments in one test |

**The owner's added rule, unintended third-party drift fails the job.** `e2e-backend/Gemfile.lock` records every gem the backend runs with: the starter's 282 third-party versions unchanged, and the Spree gems from the `liquorify` checkout. The backend installs them frozen, so a gem change the lockfile does not record stops the start with the command that records it. The storefront's own JavaScript dependencies were already installed frozen. How this was checked is in §4, because it was checked locally.

**The technical review.** The diff was read against the criteria above and the owner's answers. Each commit on the branch works on its own. The README's testing section was rewritten for the new setup, including what a local run needs and that stopping the backend keeps its database. `main` at `e9f8c1f` (batch 9's stories) was merged into the branch at `d73a14f` with no conflict. Before the merge, GitHub showed #23 up to date with `main` and clean.

## 3. CI on the final revision, `ecbc9ac`

| Run | Browser tests | Job | Other checks |
|---|---|---|---|
| [Run 41886001843](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41886001843), attempt 1, [job 126770510558](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41886001843/job/126770510558) | **21 passed** in 2.1 minutes, none retried or flaky | 4 min 22 s, gems from the cache | Lint, type check and unit tests passed |
| The same run, attempt 2, [job 126774312133](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41886001843/job/126774312133) | **21 passed** in 2.7 minutes, none retried or flaky | 4 min 50 s, gems from the cache | Lint, type check and unit tests passed again |
| [Storybook & visual check](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41886001846/job/126770509909) | | | Passed |

The same tests had also passed on the branch's earlier head `4ffe04c`, twice, before `main` was merged in.

## 4. Local results, in the cloud environment

These are not CI results. They used Ruby 3.3.6, because the environment cannot download the starter's Ruby 4.0.5, with the lockfile's Ruby line changed for the run only. The environment cannot reach Stripe, so the Stripe checkout test did not run.

| Check | Result |
|---|---|
| The browser tests through `pnpm run e2e:up` | 20 of 20 that need no Stripe keys passed |
| Lint, type check and unit tests on the merged branch | Passed: Biome, TypeScript and 262 unit tests |
| A gem the backend adds that the lockfile does not record | The frozen install refused it, and the start stopped with the message naming `./scripts/e2e/liquorify-backend.sh lock` |
| `./scripts/e2e/liquorify-backend.sh lock` | Re-resolved the committed lockfile with no change other than the Ruby line |

## 5. The merge commit

The storefront's `main` at `ad77c3d`, "Merge pull request #23", has two parents: `main` at `e9f8c1f` and #23's final commit `ecbc9ac`. Its tree is `4a82cc7`, the same as `ecbc9ac`'s, so the merge brought in exactly the tested revision. It merged through GitHub's protected merge, with no rule bypassed.

## 6. CI on the storefront's `main`

| Workflow | Run | Result |
|---|---|---|
| CI: lint, type check, unit tests and the browser tests | [41888379119](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41888379119), 18:33 to 18:39 UTC | Passed. The browser tests: **21 passed** in 2.6 minutes, none retried ([job 126778862944](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41888379119/job/126778862944)). `main` had no cached gems yet, so the backend built them, and starting it took 73 s |

Storybook's visual check runs on pull requests and by hand, not on a push to `main`; it passed on `ecbc9ac`.

## 7. What the acceptance closes, and what stays open

- **FB-06 is DONE** on 2026-11-04. Its done-when, "storefront end-to-end tests run against a backend built from a recorded `liquorify` revision", holds in CI on `main` and locally, with the SDK matching the backend.
- **FB-05 stays open.** Spree's starter at a recorded commit is the test host only. Where the host application lives for development and hosting is still FB-05's question.
- **FB-12 is unchanged.** The backend stays on 6.0.0.rc4 and the SDK on 2.0.0-rc.4 (decision 32).
- **FB-11 continues** with the storefront's Dependabot pull requests, which now run against the Liquorify backend. Each needs updating from `main` before its checks mean anything.
- **What a revision move needs.** When the recorded `liquorify` revision changes and the backend needs a different gem, the change runs `./scripts/e2e/liquorify-backend.sh lock` and commits the lockfile with it, so the gem change shows in review.
