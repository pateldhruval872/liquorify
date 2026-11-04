---
title: Foundation lane, the weekly security audit and the storefront's test backend
record: work item
work_item: FB-11, FB-06
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-11-03
updated: 2026-11-04
---

# Foundation lane: the weekly security audit, then the storefront's test backend

One implementation lane for two foundation items, in the order the owner asked on 2026-11-03: first repair the backend's weekly security audit, which has failed both times it ran (part of FB-11), then complete FB-06, so that the storefront's browser tests run against a backend built from a recorded `liquorify` revision and use the matching SDK. Both were found by the baseline audit of 2026-11-02 (its findings A-1 and A-6). Neither changes Spree's application code or the storefront's pages, or adds a Liquorify feature.

**Status.** PROPOSED. On 2026-11-04 the owner approved the lane (decision 1 of the owner decision brief) and answered §5: questions 2 and 3 as recommended, and question 1, the advisory, later the same day, choosing the second way in §1.1 ([record](../verification/2026-11-04-owner-decision-brief-answers-2.md)). Step 2's spike ran on 2026-11-04 and showed option A works (§2.1), and the owner answered the two questions it raised for step 2.2 the same day. Later still that day the owner reported OA-6 saved, so step 1 can run, and authorized step 2.2's workflow change in storefront #23 to merge under the delegation ([record](../verification/2026-11-04-owner-decision-brief-answers-2.md#5-later-the-same-day)). That night the owner approved step 1's repair, #57, and the dependency updates its run by hand opened, #58 (§5, question 4). At most three implementation lanes run at once; §4 shows where this one fits.

## 1. Step 1: repair the weekly security audit (FB-11)

`.github/workflows/security-audit.yml` runs every Monday. It asks pnpm to pin patched versions of vulnerable dependencies, refreshes the lockfile, and opens a pull request with the result for review. LIQ-004 still says it has not run. It has run twice and failed twice, for two different reasons, both read from the runs' logs on 2026-11-03.

| Run | Date | Where it stopped | Cause |
|---|---|---|---|
| [40318639423](https://github.com/pateldhruval872/liquorify/actions/runs/40318639423) | 2026-10-26 | "Open pull request", after pushing `chore/security-audit` at `7cf2cbe` | "GitHub Actions is not permitted to create or approve pull requests." The repository's Actions settings do not allow the workflow's token to open a pull request. The branch is still on the remote, with no pull request |
| [41460472151](https://github.com/pateldhruval872/liquorify/actions/runs/41460472151) | 2026-11-02 | "Pin available fixes via overrides" | pnpm pinned `deepmerge` to `^4.3.2` for advisory GHSA-gcqx-w48m-w2h4 (low severity, prototype poisoning), but 4.3.2 has never been published: the newest `deepmerge` is 4.3.1, from 2023-03-16. The lockfile refresh then found no matching version and failed. `deepmerge` is reached only through `shadcn` 4.22.0's registry code, which `@spree/dashboard` and `@spree/dashboard-ui` depend on |

The second cause has a precedent in the workspace's own settings: `braces` (GHSA-vfj7-8cjw-p6xm) is listed in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` because its advisory also names a fix that is not published, with a dated review note. The workflow honours that list.

**The repair:**

1. **One small backend pull request** that changes the workflow's fix step, as the owner decided on 2026-11-04 (§1.1): a fix version that is definitively unpublished is skipped, and its advisory is still reported, as unresolved. No ignore entry is added. A registry or network failure while checking stays a failure of the run. Nothing else in the workflow changes. (Proposed first was an ignore entry for GHSA-gcqx-w48m-w2h4 in `auditConfig.ignoreGhsas`, which the owner did not choose.)
2. **The owner allows the workflow to open pull requests:** in the repository's Settings, Actions, General, Workflow permissions, tick "Allow GitHub Actions to create and approve pull requests". The alternative is to change the workflow to write its report to the run's summary and open nothing, which changes a workflow Spree maintains and loses the reviewable pull request (§5, question 2).
3. **The stale branch:** the next run updates `chore/security-audit` in place, so it needs no action. Deleting it first is the owner's choice.
4. **One run by hand** after the merge and the setting, then a review of what it proposes: each override is merged, closed or deferred with a reason under FB-11. A pull request opened by the workflow's own token does not start the repository's checks by itself; a person updating the branch from GitHub's page starts them. The workflow's comment already says this, and no extra token is proposed.

**Checked so far.** On a scratch copy of `main` at `5794da6a`, with pnpm 11.1.1 and the entry added, the fix step proposed 8 overrides and no `deepmerge` pin, and the lockfile refresh completed. Nothing was committed or pushed.

**Done when:** the run by hand and the next scheduled Monday run both pass; the pull request they open is reviewed under FB-11; and FB-11's text in LIQ-004 says what ran and what was decided.

### 1.1 The `deepmerge` advisory: where it runs, and two ways to handle it

Prepared on 2026-11-04 because the owner kept decision 9 pending until this was documented. No ignore entry is added before the owner decides.

**Where `deepmerge` is used.** Version 4.3.1 is in the lockfile only through `shadcn` 4.22.0 and the `@shadcn/registry` 0.2.0 package it depends on. `shadcn` is a dependency of `@spree/dashboard-ui` and a development dependency of `@spree/dashboard`. Read in the published packages, `deepmerge` is called only by shadcn's command line tool, in four places:

- `init` and `add`, merging the project's `components.json` with a registry's base configuration;
- resolving registry items, merging each item's Tailwind settings, CSS variables, CSS, environment variables and dependency lists;
- merging a theme into a Tailwind 3 configuration file;
- writing an AI assistant's server configuration file, merged with the one already on disk.

**Whether untrusted input reaches it.** In one place, yes. Registry items are JSON fetched over the network from the registries a developer names, and `packages/dashboard/components.json` lists shadcn's default registry and one other, `@mapcn` (`mapcn.dev`). A crafted item could add properties to the prototype of the merged object. The advisory rates this low (CVSS 5.3); GitHub lists no patched version, and npm's copy marks 4.2.0 to 4.3.1 as vulnerable, which is why pnpm asked for 4.3.2, a version that has never been published. The effect would stay in the developer's own command line process and in the files the tool writes into the project, such as `components.json` and the stylesheet, which the resulting pull request shows for review.

**When it runs.**

| Where | Does `deepmerge` run? | How this was checked |
|---|---|---|
| Developer tooling | Only when someone runs the shadcn command line tool by hand, for example to add a component to `@spree/dashboard-ui`, as Spree's development rules say | No package script, workflow or setup script calls it: the repository searched on 2026-11-04 |
| Builds | No. `@spree/dashboard-ui` imports one file from the package, `shadcn/tailwind.css`, a stylesheet with no JavaScript, so no shadcn code runs while Vite and Tailwind build the dashboard | The source's imports read; a built bundle was not searched |
| Application requests | No. No source file imports shadcn's JavaScript, so neither the dashboard's bundle nor the Rails application reaches it | The same reading. The repair pull request searches a built dashboard bundle for `deepmerge` to confirm it |

**The two ways, compared.**

| | A dated temporary exception | Skip fixes that are not published, and keep reporting |
|---|---|---|
| What changes | One entry in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`, with a dated review note, as the `braces` entry has | The workflow's fix step: after `pnpm audit --fix=override`, each new override is checked against npm, and one whose version is not published is removed, with its release-age exclusion, before the lockfile refresh. The run lists it as unresolved, with no published fix |
| Is the advisory still reported? | No. `pnpm audit` and the weekly run stop showing it until the entry is removed; only the review date brings it back | Yes, in every weekly run's report, until a fix is published or `shadcn` stops using it |
| Does the weekly run pass? | Yes | Yes |
| What it touches | Configuration only; Spree's workflow stays as it is | Spree's workflow, which Liquorify then carries as a change of its own until Spree changes it |
| Size | One entry | A short shell step, about 20 lines |
| The next advisory that names an unpublished fix | Needs another entry and another decision | Handled the same way, with no new decision |

**Tried on 2026-11-04,** on a scratch copy of `main` at `5794da6a` with pnpm 11.1.1, nothing committed or pushed: with no ignore entry, the fix step proposed 9 overrides, `deepmerge` among them. A prototype of the second way removed only the `deepmerge` override and listed it as unresolved; the lockfile refresh completed with the other 8; and the audit afterwards reported exactly one advisory, this one.

**Recommendation: the second way.** The exposure is developer tooling run by hand against registries the developer chooses, so the risk is low either way; what differs is whether the advisory stays visible. Skipping unpublished fixes keeps it in front of the owner every week without a review date to remember, and handles the next advisory of the same shape without another exception. The `braces` entry stays as the owner decided it; moving it to the same handling would be a separate decision. The repair pull request then has three parts: the workflow step, the owner's setting from question 2, and the run by hand, with the built bundle searched.

**The owner's answer, 2026-11-04 (decision 9, row 1 of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md)):** the second way. The workflow skips a fix version that is definitively unpublished, that is, one the registry answered does not exist, and keeps reporting its advisory as unresolved in every run. No ignore entry is added. A registry or network failure while checking stays a failure of the run, so an advisory is never skipped because the registry could not be reached. The `braces` entry stays as it is.

## 2. Step 2: the storefront's browser tests against a pinned Liquorify backend (FB-06)

**Where it stands.** The storefront's end-to-end job starts its backend from `e2e-backend/docker-compose.yml`, whose image defaults to `ghcr.io/spree/spree:latest`. That image is built from Spree's own starter application, not from `liquorify`. Spree released 6.0.0 on 2026-10-27 and 6.0.2 on 2026-11-02 (RubyGems), so `latest` now most likely follows the stable 6.0 line rather than the 6.0.0.rc4 that `liquorify` is pinned to; the spike in step 2.1 records which version it actually runs. The storefront pins `@spree/sdk` 2.0.0-rc.3, while the backend's own SDK at its pinned revision is 2.0.0-rc.4, published on npm on 2026-10-19. The SDK's npm releases have since been renumbered to follow Spree (6.0.2 is `latest`).

**How the backend could be built:**

| Option | What it is | For | Against |
|---|---|---|---|
| A. Build it in the storefront's job (recommended) | The job checks out `liquorify` at a revision recorded in one file in the storefront (the repository is public, so no token is needed), starts a server from it with the Stripe provider loaded, and seeds it as `scripts/e2e/bootstrap-spree.sh` does today: sample data, a publishable key, and the Stripe sandbox gateway from OA-1's keys | No new account, registry or published image. It is the backend the batches already run locally, at a revision anyone can read | Each run builds Ruby gems, so the job takes longer; the spike measures how much. It needs a small host application definition, which is part of FB-05's open question of where the host application lives |
| B. Publish a Liquorify image | The backend builds and publishes a container image to GitHub's registry at each recorded revision, and the storefront pins its digest | Fast test runs, and the same image could later serve hosting | A Dockerfile and host application to maintain, and a publishing workflow with package permissions (Protected). It belongs with hosting (FB-16) |
| C. Pin the upstream image | `SPREE_IMAGE` set to a fixed upstream digest | One line | Still not a Liquorify backend, so it does not meet FB-06 |

**The work, for option A:**

1. **A spike on a storefront branch** that runs the existing 21 browser tests against a backend built from `liquorify` `main`, and records how long the job takes, which Spree version the current image runs, and anything the seeding script needs changed. If it cannot run them, the lane stops and reports before step 2.2.
2. **One storefront pull request:** the recorded revision, the job building the backend from it, the seeding adapted, and `@spree/sdk` moved to 2.0.0-rc.4 with the lockfile refreshed by pnpm. The storefront's lint, type check, unit tests and browser tests pass. If the host application definition belongs in the backend (FB-05), a small backend pull request comes first.
3. **A verification record** with the revision, the runs and their results. FB-06's text in LIQ-004 is updated, and its done-when is checked.

**Acceptance criteria:**

| # | Criterion | Evidence |
|---|---|---|
| 1 | The storefront's browser tests start a backend built from the recorded `liquorify` revision, and no step pulls `ghcr.io/spree/spree` | The workflow and the job's log |
| 2 | Changing the recorded revision is a one-line change, and the record says who changes it and when (with each backend merge the storefront depends on, or when the owner asks) | The pull request |
| 3 | `@spree/sdk` matches the pinned backend's SDK, 2.0.0-rc.4, and the lockfile shows no local path | `package.json` and `pnpm-lock.yaml` |
| 4 | All browser tests pass twice on the same revision, with any retry recorded | CI runs |
| 5 | No credential, key or machine path is committed; the Stripe keys stay in the storefront's existing secret and variable | A search of the pull request's files |
| 6 | Nothing in the storefront's pages or components changes, and nothing carries Liquorify branding | The file list |

**Not included:** the move from 6.0.0.rc4 to Spree's 6.0 releases, which is FB-12's decision; the storefront's ten open Dependabot pull requests, which follow this step in FB-11, because their checks only mean something once the tests run against Liquorify's backend; Meilisearch, which stays with P4.

### 2.1 The spike's result, 2026-11-04

**Result: option A works.** On draft storefront [#23](https://github.com/pateldhruval872/liquorify-storefront/pull/23), the storefront's CI ran all 21 browser tests against a backend built from `liquorify` `55e29504`, and again after the recorded revision moved to the latest `main`, `68236c59`. No step pulled `ghcr.io/spree/spree`. Three of the four jobs took about as long as they did with Spree's published image, and one about a minute longer. #23 stays a draft: it is the spike, not step 2.2's pull request, which follows in the lane's order (§4). This records a spike and accepts nothing.

**How the spike builds the backend.**

- `e2e-backend/liquorify-backend.env` in the storefront records two revisions: `liquorify`, at `55e29504` and then `68236c59`, and Spree's starter application, `spree/spree-starter`, at `a853a63`, the commit that moved it to 6.0.0.rc4. The starter is the host application, with its Gemfile pointed at the `liquorify` checkout, the way Spree's own development setup does it. Its Ruby, 4.0.5, comes from the starter's `.ruby-version`.
- `scripts/e2e/liquorify-backend.sh` checks out both revisions, installs the gems, prepares a database on a PostgreSQL 18 service, and starts Rails on port 4000 in production mode, with the same settings the compose file gave the published image.
- `scripts/e2e/bootstrap-spree.sh` seeds that backend with the same Ruby as before. Only how it reaches Rails changed: directly, instead of through the container.

**What was checked.**

| Check | Result | Evidence |
|---|---|---|
| CI, first run, no cached gems | PASS: 21 of 21, none retried. Job 3 min 48 s: checking out the backend 9 s, starting it 46 s, seeding 30 s, tests 1 min 45 s | [Job 126441917430](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41790315870/job/126441917430), at `0fce23c` |
| CI, second run of the same commit, gems cached | PASS: 21 of 21, none retried. Job 3 min 41 s: starting the backend 19 s, seeding 33 s, tests 1 min 56 s | [Job 126443782668](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41790315870/job/126443782668), attempt 2 |
| CI with `@spree/sdk` 2.0.0-rc.4 | PASS: 21 of 21, none retried. Job 3 min 33 s: checking out the backend 9 s, starting it 20 s, seeding 34 s, tests 1 min 52 s. Lint, type check and unit tests also passed | [Job 126445965179](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41791585944/job/126445965179), at `920534a` |
| CI after moving the revision to `68236c59`, the latest `main`, which includes the SD-8 sample data fix | PASS: 21 of 21, none retried, gems cached. Job 4 min 52 s: checking out the backend 9 s, starting it 25 s, seeding 50 s, tests 2 min 39 s. Lint, type check and unit tests also passed. The slowest of the four runs; one run cannot separate the runner's speed from the backend's change | [Job 126450469164](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/41792997434/job/126450469164), at `4ce4270`, a one-line change |
| For comparison, Spree's published image | 21 of 21. Job 3 min 44 s: starting it 36 s, seeding 40 s, tests 1 min 58 s | [Job 123670757847](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40937193933/job/123670757847), storefront `main` on 2026-10-29 |
| Locally, in the cloud environment | 20 of 21 passed in each of three runs, none retried, with rc.3 and with rc.4. The Stripe checkout test cannot run there, because the environment cannot reach Stripe. Ruby 3.3.6, because the environment cannot download 4.0.5 | Runs kept in the session only |
| Which Spree the published image runs | 6.0.2: on 2026-11-04 `latest` had the same digest as the `6.0.2` tag (`sha256:652a35bf…`). So the storefront's CI has been testing against Spree's 6.0 releases, while the backend is 6.0.0.rc4 plus the commits to Spree's code made since that release, nine at `55e29504` and twelve at `68236c59`, Liquorify's address, gift card and sample data fixes among them | The registry, read on 2026-11-04 |
| Migrations | The starter at `a853a63` already has every migration the backend's gems ship: copying them in added none | Local run |
| Third-party gems | Every third-party gem stayed at the version in the starter's lockfile. Only the ten Spree gems came from the checkout instead of RubyGems | The lockfile before and after, compared locally |
| The SDK | The backend's `packages/sdk` is 2.0.0-rc.4 and has not changed since the commit that released it (`862ffb00`), so the published rc.4 is the backend's SDK. npm marks rc.3 and rc.4 as deprecated in favour of the 6.x line, which follows FB-12's move | `liquorify` history; npm |

**What the spike changed on the way.**

- **A server left on port 4000.** Locally, an earlier backend still answered on the port, so the new one failed to start while the health check passed. The seeding then wrote to one database and the tests read another. The start script now refuses to start when the port already answers, and stops if its own server exits.
- **The cloud environment's storage variables.** That environment sets AWS variables, which make the starter store files in S3 in production. The local runs cleared them. CI has none.

**Decisions step 2.2's pull request needs from the owner.**

1. **Where the host application lives (FB-05).** Recommended: keep Spree's starter at a recorded commit, as the spike does. Liquorify then maintains no copy of it, and its lockfile already fixes every third-party gem. The alternative is a host application tracked in `liquorify`, so that one revision describes the whole backend. That is a copy of the starter to maintain, and it belongs with FB-05's hosting question. One limit of the recommendation: with the Spree gems taken from a checkout, Bundler cannot refuse to change the lockfile, so a gem the backend adds later would be resolved to whatever version is newest. Step 2.2 can add a check that fails the job if any third-party version changes.
2. **The local path.** `pnpm run e2e:up` still starts Spree's published image; the spike only added `pnpm run e2e:up:liquorify`. Recommended: point `e2e:up` at the Liquorify backend and remove the compose file in the same pull request, with the README's testing paragraph, so that local and CI runs test the same backend.

*The owner's answer, 2026-11-04 (rows C and D of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md)):* both as recommended. Spree's starter at a recorded commit is the test host, with Liquorify's backend pinned separately. The job fails on any unintended change to a third-party dependency. Local browser test runs and CI both move to that same backend, and the documentation is updated. This decides the test host only: where the host application lives for development and hosting stays FB-05's open question.

**The lane's order, decided under the owner's delegation of 2026-11-04.** Step 2.2 does not depend on step 1, which waits for decision 9 and OA-6, so step 2.2 may go ahead of step 1 once the owner has answered the two questions above. This is sequencing within the approved scope, which the delegation allows: it changes no scope, defect, gap or criterion, and step 1 still runs once decision 9 and OA-6 are done. The owner set the original order on 2026-11-03. Decided by the coordinating session and recorded by the thread "Pin storefront tests to backend (FB-06 spike)".

**Against the acceptance criteria, as evidence for step 2.2.** Criteria 1, 2, 5 and 6 hold on #23: no step pulls the published image, the revision is one line whose comment says who changes it and when, and the files carry no credential, key, machine path or page change. `4ce4270` showed criterion 2 in use: moving to a newer backend changed that one line and nothing else, and the tests passed. Criterion 3 holds on #23's `920534a`: `package.json` and the lockfile name 2.0.0-rc.4, with no local path. Criterion 4 held twice on `0fce23c`, and single runs on `920534a` and `4ce4270` also passed; step 2.2's pull request runs it again on its own final commit.

## 3. Risk and release impact

- **Risk.** Step 1 changes the workflow's fix step and needs one repository setting: Protected, because it changes how advisories are handled and lets a workflow open pull requests. Step 2 changes the storefront's CI workflow and one dependency: Standard as LIQ-004 classes FB-06, and the workflow change in storefront #23 may merge under the owner's delegation, as the owner authorized on 2026-11-04 with no further personal review: after the technical review, an update from main with any conflicts resolved, and two passing browser-test runs on its final revision, with main checked after the merge ([record](../verification/2026-11-04-owner-decision-brief-answers-2.md#5-later-the-same-day)). It does not depend on OA-6. Neither touches application code.
- **Release impact.** None. Nothing is deployed.

## 4. Where this lane fits: at most three implementation lanes

The owner asked on 2026-11-03 for at most three implementation lanes at once, and approved this plan on 2026-11-04 (decisions 1 and 18 of the owner decision brief), with the clarifications recorded below the table.

| Lane | Now | Next, when it frees |
|---|---|---|
| A | Part 2 of the catalog batch (#36), in one pull request (decision 2) | Part 3 of the catalog batch. After part 3, the catalog's refusal checks are consolidated under G-11 (decision 3), before Liquorify changes identity or access |
| B, foundation | Step 2's spike, run on 2026-11-04; step 2's pull request (step 2.2), which goes ahead of step 1 (decided under the owner's delegation of 2026-11-04, §2.1) now that the owner has answered §2.1's two questions; step 1, now that decision 9 is answered and the owner reported OA-6 saved, both on 2026-11-04 | The storefront's Dependabot pull requests (FB-11) |
| C | Batch 7 ([work item](fb-19-batch-payments-delivery-and-tax.md)), with Spree's built-in test providers (decision 5) | Multi-store administration ([work item](fb-19-batch-multi-store-administration.md)), when a slot is available; then batch 6 |

**Who takes a slot when one frees.** FB-03's validation of tenant isolation takes the next free slot, ahead of queued work (decision 18): a private validation in the cloud environment, on PostgreSQL and SQLite, covering both the store and the business ownership analysis. It authorizes validation only, not a final tenancy architecture or unreviewed fixes, and code reading is not runtime verification. SD-8's fix follows, in its own bounded pull request, after FB-03 takes that slot (decision 19). **On 2026-11-04** FB-03's validation took lane B's slot and finished the same day; its report is in the private project notes, and its result waits for the owner (N1). SD-8's fix then took lane B, ahead of step 2's spike. Multi-store administration and the lanes' other queued work follow when a slot is available. Records-only pull requests, such as merge records, do not count as lanes. Every lane follows the rules of 2026-10-26: its own session, branch and test data; merges in the order the owner accepts; and after each merge, the other open pull requests are updated and their checks rerun.

## 5. Questions for the owner, and the owner's answers

1. **Accept GHSA-gcqx-w48m-w2h4 as unfixable for now?** Recommended: yes, with a review date four weeks out, as the `braces` entry has. The alternative is to leave the audit failing until `deepmerge` publishes a fix, or to remove `shadcn` from the dependencies, which changes Spree's dashboard tooling.
   *The owner's answer, 2026-11-04 (decision 9):* pending. Before any ignore entry, the owner asked where `deepmerge` is used, whether untrusted input reaches it, and whether it runs during tooling, builds or application requests, and for a comparison of a dated exception with skipping unpublished fixes while still reporting the advisory. §1.1 answers and recommends the second way. FB-06's spike may proceed meanwhile.
   *Later the same day (row 1 of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md)):* the second way, as §1.1 records: skip fix versions that are definitively unpublished, keep reporting their advisories, add no ignore entry, and keep a registry or network failure a failure.
2. **Let the workflow open pull requests?** Recommended: tick the setting. The alternative is a workflow that only reports.
   *The owner's answer, 2026-11-04 (decision 10):* yes. The setting is the owner's to change, and is tracked as owner action OA-6 in LIQ-004 until it is done; the answer does not mean it is set.
   *Later the same day:* the owner reported it saved ([record](../verification/2026-11-04-owner-decision-brief-answers-2.md#5-later-the-same-day)). Step 1's run by hand checks that the workflow can open its pull request.
3. **Which backend for the storefront's tests?** Recommended: option A, with the host application's home decided as part of it. Option B waits for hosting.
   *The owner's answer, 2026-11-04 (decision 11):* option A, with the host application's home (FB-05) decided as part of it. The SDK stays on 2.0.0-rc.4, matching the backend, while the baseline stays on 6.0.0.rc4 (decision 32).
4. **Merge step 1's repair (#57) and the dependency updates its run by hand opened (#58)?** Recommended: both. #57's 35 checks passed, and a run by hand from its branch skipped the unpublished `deepmerge` version and opened #58. #58's 36 checks passed; only `seroval` sits under the admin dashboard's router, and the built dashboard and seller panel contain none of its code (checked locally); the rest affect Storybook and the shadcn developer tool, where `glob` and `minimatch` move up a major version.
   *The owner's answer, 2026-11-04 (rows G and H of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-3.md)):* both approved. #57 merges under the delegation; the `deepmerge` advisory stays visible, with no new ignore entry, and the audit's result after the merge is recorded. #58 merges after #57: it is brought up to date with `main`, any conflicts are resolved, and the affected checks run again on its final commit before it merges. The review of its major-version moves and the unresolved advisory are kept in the verification record.
