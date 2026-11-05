---
title: FB-11's security audit repaired and its dependency updates merged
record: verification
work_item: FB-11
date: 2026-11-04
verifier: Claude (automated session, thread "Test storefront against Liquorify backend"); not independent review
result: The weekly security audit's repair (#57) skips a fix version the registry says was never published, keeps its advisory in the report, and still fails on any other registry or network error. Run by hand from its branch, the workflow opened its pull request (#58), so the repository setting OA-6 works. With the owner's explicit approval of 2026-11-04 (rows G and H of the owner decision brief), #57 merged as `303d3410` and #58's eight dependency updates as `953a281d`, each after every check passed on its final commit. The audit, run by hand on `main` afterwards, passed: it found nothing new to fix, opened no pull request, and still reports the `deepmerge` advisory as unresolved, with no ignore entry. FB-11 stays open for the next scheduled run and the storefront's Dependabot pull requests. This is not the owner's review
---

# FB-11's security audit repaired and its dependency updates merged

**Claim.** Step 1 of the [foundation lane](../work-items/foundation-lane-security-audit-and-storefront-backend.md#1-step-1-repair-the-weekly-security-audit-fb-11) repairs the weekly security audit as the owner decided on 2026-11-04 (decision 9): a fix version that is definitively unpublished is skipped and its advisory stays reported, no ignore entry is added, and a registry or network failure stays a failure. This record states what changed, what ran in CI, what ran locally, the review of the pull request the workflow opened, both merges and the audit's result afterwards. Results from CI and results from the cloud environment are kept apart.

## 1. The repair and its approval

| What | Detail |
|---|---|
| Pull request | [#57](https://github.com/pateldhruval872/liquorify/pull/57), final commit `8a972334` |
| Change | One file, `.github/workflows/security-audit.yml`. After the fix step, each release-age exclusion it newly adds is looked up on the registry. An answer of "not found" (`E404`) drops that exclusion and the override that targets it, and the pull request's text names the version. Any other answer fails the job |
| Not changed | The ignore list (the `braces` entry stays and nothing is added), the workflow's permissions, its schedule and the pull request it opens |
| Risk class | Protected (work item §3). #57's description carries the failure and recovery analysis and the affected-area review, with the limitation that no specialist security review is available (LIQ-001 §2) |
| Approval | The owner's explicit approval, 2026-11-04 (row G of the owner decision brief, [record](2026-11-04-owner-decision-brief-answers-3.md)): merge under the delegation, keep the unresolved `deepmerge` advisory visible, add no ignore entry, and record the audit's result after the merge |

## 2. CI results

| What | Commit | Result |
|---|---|---|
| #57's checks | `c78514dc` | 35 checks with no failure: 29 passed, and 6 release jobs were skipped as on every pull request |
| The workflow run by hand from #57's branch, [run 41892028264](https://github.com/pateldhruval872/liquorify/actions/runs/41892028264), 18:56 to 18:57 UTC | `c78514dc` | Passed. The fix step skipped `deepmerge@4.3.2` as unpublished and kept the other eight overrides. The lockfile refresh completed, the audit afterwards reported one low advisory (GHSA-gcqx-w48m-w2h4, `deepmerge`), and the workflow **opened [#58](https://github.com/pateldhruval872/liquorify/pull/58)** with its labels. **OA-6 is verified:** the repository lets the workflow open pull requests |
| #58's first checks: Tests 41892948927, Packages 41892954329 and Storybook 41892960170, started by hand on its branch because a pull request the workflow's token opens starts no checks | `ea143996` | 36 checks with no failure: every Ruby suite on MySQL and PostgreSQL, Brakeman, the packages' type check, tests and build, the SDK integration tests, the scaffolded app, the admin dashboard's browser tests in four shards, and Storybook's visual check passed; 6 release jobs were skipped |
| #57 after `main` at `fc5cb555` was merged in | `8a972334`, final | 35 checks with no failure: 29 passed and 6 release jobs skipped |
| #58 after `main` at `303d3410` (#57's merge) was merged in | `736685f1` | 36 checks with no failure: 30 passed and 6 release jobs skipped |
| #58 after `main` at `43a47b5e` was merged in, because a records pull request merged meanwhile | `ec7c49a2`, final | 36 checks with no failure: 30 passed and 6 release jobs skipped. Storybook's visual check finished at 01:07 UTC on 2026-11-05 |
| Packages on `main` after #58's merge, [run 41946350878](https://github.com/pateldhruval872/liquorify/actions/runs/41946350878) | `953a281d` | Passed (§5) |
| **The audit run by hand on `main` after both merges**, [run 41946373655](https://github.com/pateldhruval872/liquorify/actions/runs/41946373655), 01:07 to 01:08 UTC on 2026-11-05 | `953a281d` | **Passed.** The fix step changed no file, so the workflow opened no pull request: it reset `chore/security-audit` to `main` and reported that the branch no longer differs from it. The audit afterwards reported one low advisory, GHSA-gcqx-w48m-w2h4 in `deepmerge`, through the `shadcn` tool's four paths. No ignore entry exists for it |

Each update from `main` brought in only records and #57's workflow file; neither touches `pnpm-workspace.yaml` or `pnpm-lock.yaml`, and #58's change on `ec7c49a2` is identical, line for line, to the reviewed change on `ea143996`.

## 3. Local results, in the cloud environment

These are not CI results.

| Check | Result |
|---|---|
| The same fix step on `main` at `16380f5f` | Nine overrides proposed, `deepmerge` skipped, eight kept, one low advisory left: the same as the run in CI |
| A registry lookup that could not reach the registry | Failed the step, as intended. Not repeated in CI |
| Where `deepmerge` reaches the product (at `df2db5b4`) | Only through the `shadcn` command-line tool and `@shadcn/registry`. The built admin dashboard and seller panel contain no `deepmerge` code: its name and four of its own identifiers and messages were not found, while known code from Zod and React was |
| Where `seroval` reaches the product | TanStack Router uses it only for rendering on a server. The built admin dashboard and seller panel contain none of its code: its error text was not found in either |
| #58 installed from its lockfile, frozen | Installed. With minimatch 11.0.4, ts-morph matched all 100 of the design system's component files. The MCP server module, the dotenv loader and the schema checker loaded, and the schema checker resolved a relative schema reference, which is what fast-uri does |
| The `shadcn` tool's `add` command, previewed | Could not run: this environment cannot reach shadcn's component registry |

## 4. Review of #58, including the major-version compatibility review

Each line is an override `pnpm audit --fix` wrote for a published advisory. "Runs in" is where the package is used, from the lockfile.

| Package | Change | Reached through | Runs in | Evidence |
|---|---|---|---|---|
| seroval (two overrides, one per advisory) | 1.6.9 to 1.7.7 | TanStack Router | The router package the admin dashboard, seller panel, starters, plugin example and Storybook use; `seroval` is used only for server rendering | Dashboard browser tests passed in CI; not in the built bundles (local) |
| glob | 13.0.6 to 14.0.3, **a major version** | Storybook's React component documentation plugin | Storybook only | Storybook's visual check passed in CI, three times |
| minimatch | 10.2.6 to 11.0.4, **a major version**, adding `@isaacs/nonrecursive-glob-match` from the same maintainer | glob above, and ts-morph inside the `shadcn` tool | Storybook and the developer tool | CI as above; ts-morph matched files with it (local) |
| path-scurry | 2.0.2 to 3.0.0, **a major version**, with no override of its own | glob 14 | Storybook only | As glob |
| body-parser | 2.3.0 to 2.4.0 | express inside the `shadcn` tool's MCP server | The developer tool | Loads (local); not run in CI |
| fast-uri (two overrides, one per advisory) | 3.1.8 to 3.1.9 | ajv, inside the `shadcn` tool and the dotenv loader | The developer tool | Resolved a reference (local); not run in CI |
| systeminformation | 5.33.15 to 5.33.19 | the dotenv loader inside the `shadcn` tool | The developer tool | Loads (local); not run in CI |

**The major-version compatibility review.** glob 14, minimatch 11 and path-scurry 3 replace the major versions their users asked for. Today their only users are Storybook's documentation plugin and ts-morph inside the `shadcn` tool. Storybook's build and visual check passed in CI on three commits. ts-morph's file matching worked with minimatch 11 locally. The `shadcn` tool's `add` command, which uses ts-morph to edit component files, was not run in CI or locally, so a break there would show the first time a developer adds a component; the fix would be to drop the minimatch override, which the next weekly run would propose again.

**Other notes.**

- Every version installed was published at least two days before the review, so the repository's minimum release age is met without the seven exclusions the fix step added. The exclusions stay in `pnpm-workspace.yaml` until removed.
- Nothing #58 changes is in the code that ships to browsers, and the storefront is a separate repository with its own lockfile.

## 5. The merges, and `main` afterwards

| Merge | Commit on `main` | Parents | Tree |
|---|---|---|---|
| #57, 2026-11-04 23:42 UTC | `303d3410` | `fc5cb555` and #57's `8a972334` | The same as `8a972334`'s |
| #58, 2026-11-05 01:07 UTC | `953a281d` | `43a47b5e` and #58's `ec7c49a2` | The same as `ec7c49a2`'s |

Both merged through GitHub's protected merge, with no rule bypassed. No workflow runs on `main` for a change to `security-audit.yml` alone, so #57's merge started none; the audit's run by hand above ran it on `main`. #58's merge started Packages on `main`, [run 41946350878](https://github.com/pateldhruval872/liquorify/actions/runs/41946350878), 01:07 to 01:17 UTC: passed. The type check, tests and build, the SDK integration tests, the scaffolded app, and the admin dashboard's browser tests in four shards with the first-run setup tests all passed; the release jobs were skipped, as on every push. Tests and Storybook do not run on `main` for a lockfile change alone; both passed on `ec7c49a2`, whose files `main` now holds.

## 6. What stays open

- **The `deepmerge` advisory** stays reported and unresolved until a fixed version is published. It affects the `shadcn` developer tool only.
- **Step 1's done-when** also needs the next scheduled Monday run, 2026-11-09, to pass on `main` with the repaired workflow.
- **FB-11** stays open for the storefront's Dependabot pull requests, which now run against the Liquorify backend.
