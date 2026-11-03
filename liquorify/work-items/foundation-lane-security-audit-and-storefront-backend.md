---
title: Foundation lane, the weekly security audit and the storefront's test backend
record: work item
work_item: FB-11, FB-06
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-11-03
updated: 2026-11-03
---

# Foundation lane: the weekly security audit, then the storefront's test backend

One implementation lane for two foundation items, in the order the owner asked on 2026-11-03: first repair the backend's weekly security audit, which has failed both times it ran (part of FB-11), then complete FB-06, so that the storefront's browser tests run against a backend built from a recorded `liquorify` revision and use the matching SDK. Both were found by the baseline audit of 2026-11-02 (its findings A-1 and A-6). Neither changes Spree's application code or the storefront's pages, or adds a Liquorify feature.

**Status.** PROPOSED. No step starts until the owner approves this lane and answers the questions in §5. At most three implementation lanes run at once; §4 shows where this one fits.

## 1. Step 1: repair the weekly security audit (FB-11)

`.github/workflows/security-audit.yml` runs every Monday. It asks pnpm to pin patched versions of vulnerable dependencies, refreshes the lockfile, and opens a pull request with the result for review. LIQ-004 still says it has not run. It has run twice and failed twice, for two different reasons, both read from the runs' logs on 2026-11-03.

| Run | Date | Where it stopped | Cause |
|---|---|---|---|
| [40318639423](https://github.com/pateldhruval872/liquorify/actions/runs/40318639423) | 2026-10-26 | "Open pull request", after pushing `chore/security-audit` at `7cf2cbe` | "GitHub Actions is not permitted to create or approve pull requests." The repository's Actions settings do not allow the workflow's token to open a pull request. The branch is still on the remote, with no pull request |
| [41460472151](https://github.com/pateldhruval872/liquorify/actions/runs/41460472151) | 2026-11-02 | "Pin available fixes via overrides" | pnpm pinned `deepmerge` to `^4.3.2` for advisory GHSA-gcqx-w48m-w2h4 (low severity, prototype poisoning), but 4.3.2 has never been published: the newest `deepmerge` is 4.3.1, from 2023-03-16. The lockfile refresh then found no matching version and failed. `deepmerge` is reached only through `shadcn` 4.22.0's registry code, which `@spree/dashboard` and `@spree/dashboard-ui` depend on |

The second cause has a precedent in the workspace's own settings: `braces` (GHSA-vfj7-8cjw-p6xm) is listed in `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` because its advisory also names a fix that is not published, with a dated review note. The workflow honours that list.

**The repair:**

1. **One small backend pull request** that adds GHSA-gcqx-w48m-w2h4 to `auditConfig.ignoreGhsas`, with a note in the same form as the `braces` entry: no published fix, reached only through `shadcn`'s registry code, review by a date the owner picks or as soon as 4.3.2 is published. It accepts a known low-severity advisory, so it is the owner's decision (§5, question 1). Nothing else in the workflow changes.
2. **The owner allows the workflow to open pull requests:** in the repository's Settings, Actions, General, Workflow permissions, tick "Allow GitHub Actions to create and approve pull requests". The alternative is to change the workflow to write its report to the run's summary and open nothing, which changes a workflow Spree maintains and loses the reviewable pull request (§5, question 2).
3. **The stale branch:** the next run updates `chore/security-audit` in place, so it needs no action. Deleting it first is the owner's choice.
4. **One run by hand** after the merge and the setting, then a review of what it proposes: each override is merged, closed or deferred with a reason under FB-11. A pull request opened by the workflow's own token does not start the repository's checks by itself; a person updating the branch from GitHub's page starts them. The workflow's comment already says this, and no extra token is proposed.

**Checked so far.** On a scratch copy of `main` at `5794da6a`, with pnpm 11.1.1 and the entry added, the fix step proposed 8 overrides and no `deepmerge` pin, and the lockfile refresh completed. Nothing was committed or pushed.

**Done when:** the run by hand and the next scheduled Monday run both pass; the pull request they open is reviewed under FB-11; and FB-11's text in LIQ-004 says what ran and what was decided.

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

## 3. Risk and release impact

- **Risk.** Step 1 changes one dependency policy entry and needs one repository setting: Protected, because it accepts an advisory and lets a workflow open pull requests. Step 2 changes the storefront's CI workflow and one dependency: Standard as LIQ-004 classes FB-06, and the workflow change is reviewed by the owner before it merges. Neither touches application code.
- **Release impact.** None. Nothing is deployed.

## 4. Where this lane fits: at most three implementation lanes

The owner asked on 2026-11-03 for at most three implementation lanes at once. Proposed:

| Lane | Now | Next, when it frees |
|---|---|---|
| A | Part 2 of the catalog batch, proposed in #36, once the owner answers its questions | Part 3 of the catalog batch |
| B, foundation | Step 1 here, then step 2 | The storefront's Dependabot pull requests (FB-11); then SD-8's fix, if the owner chooses to fix it now |
| C | Batch 7, once the owner answers its questions ([work item](fb-19-batch-payments-delivery-and-tax.md)) | Multi-store administration ([work item](fb-19-batch-multi-store-administration.md)), then batch 6 |

FB-03's validation of tenant isolation is not in a lane: it waits for the owner's answers to N1 to N6, and would take the first lane that frees once they are given. Records-only pull requests, such as merge records, do not count as lanes. Every lane follows the rules of 2026-10-26: its own session, branch and test data; merges in the order the owner accepts; and after each merge, the other open pull requests are updated and their checks rerun.

## 5. Questions for the owner

1. **Accept GHSA-gcqx-w48m-w2h4 as unfixable for now?** Recommended: yes, with a review date four weeks out, as the `braces` entry has. The alternative is to leave the audit failing until `deepmerge` publishes a fix, or to remove `shadcn` from the dependencies, which changes Spree's dashboard tooling.
2. **Let the workflow open pull requests?** Recommended: tick the setting. The alternative is a workflow that only reports.
3. **Which backend for the storefront's tests?** Recommended: option A, with the host application's home decided as part of it. Option B waits for hosting.
