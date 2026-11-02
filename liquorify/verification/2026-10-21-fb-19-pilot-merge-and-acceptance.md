---
title: FB-19 pilot merges checked on main, and the owner's scoped acceptance
record: verification
work_item: FB-19
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS for both merge commits and for Storybook started by hand on each repository's main; PASS for Packages on the backend's `main`, with its six release jobs skipped as intended; the storefront end-to-end job fails before any test, as before the merge, because the Stripe test keys are missing; the owner accepted the pilot within its scope, with three gaps kept open
---

# FB-19 pilot merges checked on main, and the owner's scoped acceptance

**Claim.** The pilot's two pull requests, [#6](https://github.com/pateldhruval872/liquorify/pull/6) and [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15), merged into `main` exactly as reviewed, and each Storybook builds and passes its visual check on `main`. The owner then accepted the pilot within the scope its records describe. That acceptance does not complete FB-19 or the existing Spree baseline.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Each merge commit holds exactly the reviewed revision | PASS in both repositories (§1) |
| 2 | Storybook, started by hand on each repository's `main`, builds both Storybooks and passes every visual comparison | PASS in both repositories (§2) |
| 3 | The other workflows that run on `main` for these changes give the result expected from before the merge | PASS: the backend's Packages workflow passed, its six release jobs skipped as intended, and Tests did not start because no file it watches changed. The storefront's Lint, Type Check and Unit Tests pass, and its end-to-end job stops at the Stripe key check, as it did on `main` before the merge (§2) |
| 4 | The owner accepts the pilot | ACCEPTED within its scope, on 2026-10-21 at 23:08 UTC, with three gaps kept open (§3) |

## 1. The merge commits

The owner merged both pull requests on 2026-10-21. Each merge commit's tree is identical to the tree of its pull request's final revision, so `main` holds exactly what was reviewed and nothing else.

| | Backend | Storefront |
|---|---|---|
| Pull request | [#6](https://github.com/pateldhruval872/liquorify/pull/6) | [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15) |
| Merged at | 23:06:53 UTC | 23:07:08 UTC |
| Merge commit | `9cc46d3` | `8153a6b` |
| Its parents | `e408a63` (`main` before) and `c170f88` (the pull request) | `a139771` (`main` before) and `0a901eb` (the pull request) |
| Tree | `e033e52`, the same as `c170f88` | `d7c309f`, the same as `0a901eb` |
| Changed outside the stories | `.github/workflows/storybook.yml`, `.gitignore` and `pnpm-lock.yaml`, besides `packages/liquorify-storybook/` and `liquorify/` | `.github/workflows/storybook.yml`, `.gitignore`, `biome.json`, `package.json`, `pnpm-lock.yaml` and `vitest.config.ts`, besides `.storybook/`, `stories/` and `visual/`; nothing in `src/` or `messages/`, and the lockfile holds no local path |

## 2. Workflows on `main`

Storybook runs only on pull requests and when started by hand, so it was started by hand on each `main` after the merges.

| Repository | Workflow | Why it ran | Run | Result |
|---|---|---|---|---|
| Backend | Storybook | Started by hand | [39691347919](https://github.com/pateldhruval872/liquorify/actions/runs/39691347919) | PASS: the Storybook built, the token and inventory checks and the coverage report ran (41 stories), and all 82 comparisons passed |
| Backend | Packages | The merge changed `pnpm-lock.yaml` | [39691254823](https://github.com/pateldhruval872/liquorify/actions/runs/39691254823) | PASS: Typecheck, Test and Build; the SDK integration tests; the scaffolded app's typecheck and lint; and the dashboard's browser tests in all four shards. The six release jobs were skipped, as FB-02 intends for this repository |
| Backend | Tests | Did not start: it runs on `main` only when a file under `spree/` or its own workflow changes, and the merge changed neither | None | NOT_RUN, as expected |
| Storefront | Storybook | Started by hand | [39691351753](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39691351753) | PASS: the Storybook built, the token check and the coverage report ran (20 stories), and all 38 comparisons passed |
| Storefront | CI | Every push to `main` | [39691284098](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39691284098) | Lint, Type Check and Unit Tests PASS. The end-to-end job FAILS at "Fail if Stripe keys are not configured", before any test runs, the same as `main` before the merge ([39637847662](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39637847662)). Owner action OA-1 in [LIQ-004](../LIQ-004-foundation-backlog.md) removes that blocker |

Dependabot's own update jobs also ran on the storefront's `main` after the merge and succeeded. They are not part of this check.

## 3. The owner's acceptance

On 2026-10-21 at 23:08 UTC the owner wrote that both pull requests were merged and asked for the pilot's acceptance to be recorded within its scope. The acceptance covers what the pilot's records describe:

- the arrangement in [LIQ-010](../LIQ-010-design-system-reproduction-architecture.md) Part B, as corrected in LIQ-010 0.2 ([pilot record](2026-10-21-fb-19-pilot.md));
- the 82 backend and 38 storefront reference images ([review list](2026-10-21-fb-19-pilot-image-review.md));
- fidelity for the 18 stories and 8 token pages compared with running screens ([fidelity record](2026-10-21-fb-19-pilot-fidelity.md));
- the screenshot tolerance of `threshold: 0.005` with `maxDiffPixels: 25` ([tolerance record](2026-10-21-fb-19-screenshot-tolerance.md)).

Three gaps stay open, and nothing in this acceptance closes them:

| Gap | What is open | Where it is recorded |
|---|---|---|
| 35 stories checked against their source only | Their images are accepted, but no running screen showed their state with the browser-test data, so their fidelity to a running screen is still unchecked. Each closes when a later batch's running-screen evidence shows that state | [Fidelity record §4.1](2026-10-21-fb-19-pilot-fidelity.md#41-stories-whose-state-no-running-screen-shows) |
| The cart drawer opened with a pointer | No story or capture shows that state | [Fidelity record §4.2](2026-10-21-fb-19-pilot-fidelity.md#42-the-cart-drawer-opened-with-a-pointer) |
| The storefront's end-to-end job | It stops before any test because the Stripe test keys are missing | OA-1 and FB-06 in [LIQ-004](../LIQ-004-foundation-backlog.md) |

**What this does not complete.** FB-19 is complete only when every existing component in [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) has its stories and reference images. The pilot covers 7 of the 379 backend components and 4 of the 101 storefront components. The existing Spree baseline also needs FB-20 and FB-21 in Figma, which wait for OA-5. Coverage now grows in batches by product area, each bringing its screens, workflows, permissions and meaningful states with the components they use, and the evidence that checks them. Liquorify-specific extensions stay deferred.

**How it is recorded.** How acceptance is recorded in a document's status fields is decision D5 in [LIQ-001 §7](../LIQ-001-project-profile.md#7-decisions-needed-to-adopt-the-foundation), which is still open. So this record and the result fields of the pilot's records carry the acceptance, and no document's `status`, `approved_by` or `approved_at` changes.
