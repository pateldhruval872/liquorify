---
title: FB-02 merge push and branch protection
record: verification
work_item: FB-02
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS for the merge push and the saved settings; NOT_RUN for the direct-push refusal
---

# FB-02 merge push and branch protection

**Claims.** FB-02 acceptance criteria 3 and 4 ([LIQ-004](../LIQ-004-foundation-backlog.md#recommended-next-work-item)):

- **Criterion 3.** The six `packages.yml` release jobs show as skipped on the merge push.
- **Criterion 4.** `main` in both repositories refuses direct pushes and requires the agreed checks before merge.

This follows the [first workflow run](2026-10-21-fb-02-first-workflow-run.md), which stays as written.

**Results.**

| Claim | Result |
|---|---|
| Both workflows pass on the merge push to `main` | PASS |
| The six `packages.yml` release jobs are skipped on the merge push | PASS |
| The `release.yml` and `docs-package.yml` release jobs are skipped on their first trigger | NOT_RUN: no tag and no documentation change has reached `main` since the merge |
| The saved rulesets match the agreed settings | PASS in both repositories |
| GitHub enforces the rulesets on this account's plan | PASS while both repositories are public (see Enforcement) |
| `main` requires the agreed checks before merge | PASS by GitHub's reported merge state, without a merge attempt (see Merge gates) |
| `main` refuses a direct push | NOT_RUN by the owner's instruction. Unverified |

## Merge push

- **Revision.** Merge commit `1d1f2d4bfccc7cc43b8c8e22c7a6bc3eb3c0e9fa`, which merged [pull request #2](https://github.com/pateldhruval872/liquorify/pull/2) at 02:36:44 UTC. Its parents are `main` at `225aa3a` and the pull request head `1bc41ed`. Its tree, `ba9e0a2`, is the merge of those two commits, which is what the pull request's last run tested.
- **Trigger.** Event `push` to `main`, first attempt for both runs. Runners as in the [first workflow run](2026-10-21-fb-02-first-workflow-run.md#revision-and-environment).
- **Where it was read.** Run, job and check-run conclusions through the GitHub API, from 02:51 to 03:15 UTC. Job logs were not read for this run.

| Workflow | Run | Started (UTC) | Finished (UTC) | Jobs | Conclusion |
|---|---|---|---|---|---|
| Tests | [39533977863](https://github.com/pateldhruval872/liquorify/actions/runs/39533977863) | 02:36:43 | 02:48:39 | 21 passed | success |
| Packages | [39533977782](https://github.com/pateldhruval872/liquorify/actions/runs/39533977782) | 02:36:46 | 02:46:34 | 8 passed, 6 skipped | success |

The merge commit has 35 check runs, all from GitHub Actions: 29 successful and 6 skipped. Every required check name in the rulesets below is among the successful ones.

**Release jobs.** `SDK - Release`, `Admin SDK - Release`, `CLI - Release`, `Dashboard packages - Release`, `Seller packages - Release` and `create-spree-app - Release` all show as skipped. Before FB-02, their condition was only "a push to `main`", which this push met. Each now also requires `github.repository == 'spree/spree'`.

- `SDK - Release`, `Admin SDK - Release` and `Seller packages - Release` depend only on jobs that passed, so the guard is what skipped them.
- The other three also wait on earlier release jobs, so they would skip either way.

## Saved rulesets

Each repository has one ruleset named "Protect main". The owner created both at 02:45 and 02:46 UTC and last changed them at 03:04 and 03:03 UTC. They were read through the rulesets API at 03:10 UTC.

| Setting | Agreed ([LIQ-004](../LIQ-004-foundation-backlog.md#proposed-branch-protection-settings)) | `liquorify` (ruleset 25520324) | `liquorify-storefront` (ruleset 25520348) |
|---|---|---|---|
| Enforcement | — | Active | Active |
| Target | The default branch, `main` | Default branch | Default branch |
| Pull request before merging | On, 0 approvals | On, 0 approvals | On, 0 approvals |
| Conversation resolution | On | On | On |
| Required checks | The agreed list, from GitHub Actions | 15 checks, each tied to the GitHub Actions app (the same app every check run on `1d1f2d4` came from) | `Lint`, `Type Check`, `Unit Tests`, each tied to the GitHub Actions app |
| Branches up to date before merging | On | On | On |
| Block force pushes | On | On | On |
| Restrict deletions | On | On | On |
| Bypass list | Empty | Empty; the API reports that this session's user can "never" bypass | Empty; "never" |

**Required checks.** The backend's 15 are exactly the agreed names:

- **11 from `tests.yml`:** `Build (PostgreSQL)`, the nine PostgreSQL test jobs and `Brakeman`. The nine are `core (1/3)`, `core (2/3)`, `core (3/3)`, `api`, `emails`, `providers`, `dashboard`, `mcp` and `opentelemetry`, each named `PostgreSQL - … (n/n)`.
- **4 from `packages.yml`:** `Typecheck, Test & Build`, `Scaffolded app - Typecheck & Lint`, `SDK Integration Tests` and `Dashboard - E2E`.

The MySQL checks and the storefront's `E2E (Playwright + Spree)` are not required, as agreed.

**Not in the proposal, as saved:**

- All three merge methods are allowed.
- The checks are also required when a branch is created.
- GitHub's "additional approval for unattributed Copilot pull requests" option is on. GitHub documents that it has no effect while zero approvals are required.

**What applies to `main`.** GitHub's "rules for a branch" endpoint lists the four rules above for `main` in each repository. The branches API reports `main` as protected in both. Classic branch protection is off, so the rulesets are the only mechanism.

## Enforcement

GitHub offers rulesets on public repositories under GitHub Free. Private repositories need GitHub Pro, Team or Enterprise Cloud ([About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)).

- **`liquorify`** is public, so its ruleset is available on any plan.
- **`liquorify-storefront`** reads as public at 03:10 UTC. These documents and the storefront's `CLAUDE.md` had described it as private, and the API showed it private earlier on 2026-10-20 and 21 ([LIQ-003](../LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence), evidence G). Its event history records the change to public after the 01:25 UTC merge of its pull request #13. The repository's settings last changed at 02:49 UTC. On 2026-10-21 the owner decided to keep it public, so its ruleset is enforced on any plan.
- **The account's plan** cannot be read with this session's access. If the storefront were made private again on a plan without private rulesets, its protection would stop applying, and that would need a new record.

## Merge gates

Merge gates were read from GitHub's reported merge state. Nothing was merged or pushed to `main` to test them.

- **Storefront.** Nine of its ten open Dependabot pull requests report the merge state `behind`, and the tenth had not been computed. Pull request #12 has all three required checks passing, but `main` has moved since it was opened. With branches required to be up to date, GitHub holds it until it is updated.
- **Storefront, pull request #14** at `eea453e` reports `unstable`. Its three required checks pass, and the advisory `E2E (Playwright + Spree)` job fails at its Stripe configuration check ([job](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39538095871/job/119019323550)). GitHub reports `unstable` when only checks that are not required fail. So only the required checks hold a merge, as agreed.
- **Backend, pull request #3** (this record's own pull request) is the first documentation-only pull request since FB-02 merged. At `2f2567c`, both workflows started on it ([Tests](https://github.com/pateldhruval872/liquorify/actions/runs/39538003101), [Packages](https://github.com/pateldhruval872/liquorify/actions/runs/39538002844)). That shows the pull request path filters are gone.
  - At 03:20 UTC, while the checks ran, GitHub reported `blocked`.
  - At 03:37 UTC GitHub reported `clean`. By then all 29 test and package jobs had passed, and the six release jobs were skipped, as release jobs always are on a pull request.
  - The commit that added this paragraph starts the checks again, so the state reads `blocked` until they finish.

## Direct-push refusal

**Not run.** The owner instructed at 03:08 UTC that protection must not be tested with a direct push to `main`, because the push would land if enforcement were unavailable. The refusal half of criterion 4 therefore stays unverified.

The configuration evidence is:

- an active pull request rule on `main` in both repositories;
- no bypass actors;
- the API reporting that this session's user can never bypass.

Settings are not behaviour, so this does not stand in for a refused push.

## Limitations

- **Read, not exercised.** Every result here comes from GitHub's API. The rulesets were read, not tried, except the merge gates GitHub reports on open pull requests.
- **Rule history not readable.** GitHub's rule insights (the log of pushes evaluated against each ruleset) returned "Resource not accessible by integration" to this session, so no recorded evaluation could be checked. The owner can see it under Settings, then Rules, then Insights.
- **Settings at one time.** This records the settings as read at 03:10 UTC on 2026-10-21. Anyone with admin access can change them later.
- **Push run logs not read.** Test counts and the Codecov step were not checked for the merge push. Its tree matches what [V2](2026-10-21-fb-02-first-workflow-run.md) counted, where Codecov refused the uploads because no token is set. That stays open (SA-44).
- **Storefront end-to-end** stays as recorded: the job fails at its Stripe configuration check and the browser tests are NOT_RUN until the owner adds the test keys (OA-1).
- **Release guard by reading only.** The `release.yml` and `docs-package.yml` guards have not yet had a trigger to skip.
- **Spree's suites only.** Passing checks say nothing about tenant isolation. ISO-1 to ISO-7 stay open.
- **Consequences now in effect:**
  - The weekly dependency audit opens its pull requests with the default token, which starts no CI, so their required checks never report and they cannot merge until CI is started another way (SA-28).
  - Each storefront Dependabot pull request must be brought up to date before it can merge (FB-11).

## Next

1. The owner reviews and merges this record's pull request.
2. The `release.yml` and `docs-package.yml` skips are recorded when their first trigger reaches `main`.
3. The direct-push refusal stays unverified unless the owner chooses a safe way to show it.
