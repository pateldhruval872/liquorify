---
title: FB-19 batch, the platform capabilities without screens
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-22
updated: 2026-11-10
---

# FB-19 batch: the platform capabilities without screens

The batch that checks what Spree offers without a screen of its own: the Store, Admin and Seller APIs, the developer kits, webhooks and events, dashboard plugins, providers, the command line tool and project scaffolding, tracing, the agent server and the hosted dashboards. It adds no stories and no Figma frames. It links each capability to its evidence, and keeps what exists apart from what was shown to work.

**Status.** PROPOSED. On 2026-10-22 the owner added this batch, and the completion criterion that ties every capability to its evidence ([LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete), criteria 8 and 9). The owner asked for the coverage to be inventoried early and the checks to be scheduled around their dependencies. The inventory in §3 is done. Step P1 in §5 has run: the [mail check](../verification/2026-10-22-fb-19-platform-p1-mail.md) and the [API, kit, record, hosting and tracing checks](../verification/2026-10-22-fb-19-platform-p1-checks.md). The owner merged it with #13 and storefront #19 and accepted it on 2026-10-23. The same day the owner closed G-03, G-04, G-05 and G-15 on the mail check's evidence and kept G-16 pending ([merge record](../verification/2026-10-23-fb-19-platform-p1-merge.md)). On 2026-10-23 the owner also deferred G-22, from part 2 of the staff access batch, to a new step, P6 (§5). After part 2's merge the same day, P3 ([record](../verification/2026-10-23-fb-19-platform-p3.md)) and P6 ([record](../verification/2026-10-23-fb-19-platform-p6.md)) ran in #15. The owner accepted P6 and closed G-22 the same day. The owner asked for corrections to P3 before accepting it; they were made and P3 ran again, and the owner accepted the corrected record the same day, recording CAP-11-07 as PASS within its limits and closing G-09. P2 waited for batch 2's acceptance, and the owner assigned it the approval on the authorization page that no browser test drives. The owner accepted batch 2 and merged it on 2026-10-25 ([merge record](../verification/2026-10-25-fb-19-batch-developer-settings-merge.md)), and P2 started the same day, with its completion criteria in §5. P2 ran the same day in #17 and every check passed twice in a row ([record](../verification/2026-10-25-fb-19-platform-p2.md)). The owner asked for four checks to be made strict; they were, and passed twice more. The owner accepted P2 the same day within its documented limits, closing G-29, G-30 and G-31, keeping G-32, and keeping G-16 for the email configuration alone ([record §9](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)), and merged #17 ([merge record](../verification/2026-10-25-fb-19-platform-p2-merge.md)). P4 and P5 have not run. On 2026-10-26 the owner added step P7, the refusal checks within one store that G-11, G-23 and G-32 had deferred, with G-40 from batch 3, and brought G-11 forward to it; it runs beside batch 3 in its own pull request, with its completion criteria in §5. P7 ran the same day in #22, and again after #19's merge with G-40: every request it sent was answered as expected, twice in a row on freshly started servers each time ([record](../verification/2026-10-26-fb-19-platform-p7.md)). The owner merged #22 on 2026-10-27 and accepted P7 the same day within its documented scope, closing G-23, G-32 and G-40 for the requests P7 tested and keeping G-11 open for the catalog requests of G-45 and G-50, which P7 does not cover ([merge record](../verification/2026-10-27-fb-19-platform-p7-merge.md)). On 2026-11-02 the owner deferred G-57, the catalog behaviours no browser test drives, from part 1 of the catalog and pricing batch to a new step, P8, with its completion criteria in §5. P8 ran on 2026-11-04 in #50 ([record](../verification/2026-11-04-fb-19-platform-p8.md)): 13 browser tests, twice in a row on freshly started servers. Behaviours 1.1 to 1.3 pass; 1.4 and 1.5 pass but for two defects the tests found, SD-19 and SD-20; and 1.6 awaited the owner's answer to row E of the decision brief, because the dashboard by design warns and then deletes a file in use rather than showing Spree's refusal. The tests for 1.1 to 1.5 were accepted as delegated acceptance under the owner's delegation of 2026-11-04. The same day the owner corrected 1.6 to that design: the warning, cancelling keeping the file, and confirming removing it. A test for the cancel was added, and all 14 tests ran twice in a row on freshly started servers ([record](../verification/2026-11-04-fb-19-platform-p8-criterion-1-6.md)). The corrected 1.6 passes, and G-57 closed on that evidence as delegated acceptance. P8 does not pass entirely: 1.4, 1.5 and criterion 3 stay PARTIAL while SD-19 and SD-20 are open, and their tests still fail. Nothing here changes Spree's code, Spree's tests or a workflow. On 2026-11-05 P10's checks were recorded before any script was written, then ran in #74, twice in a row on freshly started servers with the storefront built afresh against each ([record](../verification/2026-11-05-fb-19-platform-p10.md)): all 137 refused answers to its 93 requests were answered exactly as written, nothing was exposed and no refused write changed anything, but five controls failed, two on SD-9 as recorded and three on Spree over-refusing a caller who may make the request, entered as SD-28, SD-29 and SD-30. G-45, G-56, G-60, G-83 and G-79 closed on that evidence as delegated acceptance, with G-84's behaviours 11, 12 and 22; G-50, G-70 and G-11 stay open. P10 is not complete while those five controls fail. On 2026-11-09 the owner added two steps (items 3 and 4 of the owner's answers, [record](../verification/2026-11-09-owner-decision-brief-answers-4.md)): P11, browser tests for the 48 inventory, order and after-sale actions that batch 6 and batch 8 captured but no test drives (G-87, G-90 and G-92), with buying a return label left to P4; and P12, a named follow-up to P10 for batch 8's order refusals (G-95, with G-91's outstanding requests), linked to G-11. Each has its actions or requests, dependencies, expected results and closing conditions in §5. P11 runs in three parts, one for each gap. Part 1, G-87's inventory actions, ran on 2026-11-10 ([record](../verification/2026-11-10-fb-19-platform-p11-part-1.md)): 10 of 12 tests pass, 1.11 fails only on SD-23, and 1.9 fails only on batch 6's B5, numbered SD-57 and held for the owner's answer, so G-87 stays open. Part 2, G-90's order actions, ran the same day ([record](../verification/2026-11-10-fb-19-platform-p11-part-2.md)): 13 of 20 tests pass, 2.8 fails only on SD-34, the other six fail on behaviours held for the owner (SD-32, B10, B13, B14, and SD-58 and SD-59, numbered and held), and 2.3 is NOT_RUN, so G-90 stays open. Part 3, G-92's fulfilment and after-sale actions, ran the same day ([record](../verification/2026-11-10-fb-19-platform-p11-part-3.md)): 9 of 14 tests pass, 3.2 and 3.7 fail only on SD-36, 3.13 only on SD-35 and SD-37, and 3.12 on SD-37 and on SD-71, numbered and held, so G-92 stays open; 3.11 stays with P4. On 2026-11-10 the owner accepted the held defects, numbered B10, B13 and B14 as SD-82 to SD-84, closed G-87, and kept G-90 and G-92 open for 2.3 and 3.11 alone, DEFERRED to P4 ([record](../verification/2026-11-10-fb-19-platform-p11-owner-decisions.md)). P12's checks were recorded before its script was written, and P12 ran the same day: all 48 of its requests were answered as written twice in a row on freshly started servers, with every control succeeding ([record](../verification/2026-11-09-fb-19-platform-p12.md)). G-91 and G-95 closed on that evidence as delegated acceptance; G-11 stays open for G-50, G-70, SD-28 and SD-30. Four observations of the order manager and the packer refused requests their screens offer became Medium defects SD-47 to SD-50 on 2026-11-10 by the owner's decision, fixes deferred and server permissions unchanged. The same day the owner assigned to P4 the 15 provider-specific stories of G-93 ([record §3](../verification/2026-11-09-owner-decision-brief-answers-4.md#3-g-93s-remaining-stories)).

## 1. Outcome

Every capability without a screen, and the platform part of every capability that has one, has a row that names its evidence or a gap. Each row records two results apart: what exists (its tests, references and examples), and what was shown to work end to end.

## 2. Scope

The capabilities with no screen in [LIQ-006](../LIQ-006-product-capability-baseline.md), and the parts of other capabilities that no screen shows. Where a capability also has screens, its own area batch keeps them.

| Capability | Platform part | Screens, kept by |
|---|---|---|
| CAP-11-06 Store, Admin and Seller APIs with TypeScript kits | The three APIs, their published reference in `docs/api-reference/`, `@spree/sdk`, `@spree/admin-sdk`, `@spree/seller-sdk` and `@spree/sdk-core` | None |
| CAP-04-06 API keys, OAuth applications, allowed origins | Signing in with a key or an OAuth application | DA-SET-26, DA-SET-27, DA-SET-30: batch 2 |
| CAP-04-07 AI agent connections and the agent server | `spree/mcp` | DA-SET-07, DA-SET-32: batch 2 |
| CAP-04-08 Webhooks and events | The event system, outbound deliveries, inbound provider webhooks, and the storefront's webhook receiver | DA-SET-28, DA-SET-29, EM-S-07: batch 2 |
| CAP-11-07 Dashboard plugins, slots and registries | `defineDashboardPlugin`, the registries, `packages/dashboard-plugin-example`, the two starters | Each screen's slots: its own batch |
| CAP-11-08 Hosted dashboards | `spree/dashboard` | None |
| CAP-11-09 Provider contracts | Pricing, inventory, search, delivery rate, fulfilment, tax, payout and digital asset providers | None |
| CAP-07-02 Stripe provider | `spree/providers/stripe` | DA-SET-10, SF-CHK-01: batches 7 and 9 |
| CAP-07-07 EasyPost provider | `spree/providers/easypost` | DA-SET-17, DA-ORD-04: batches 7 and 8 |
| CAP-05-14 Product search, the Meilisearch provider only | `spree/providers/meilisearch` | SF-SHOP-02, SF-OVL-03: batch 4 |
| CAP-11-10 Tracing with OpenTelemetry | `spree/opentelemetry` | None |
| CAP-11-11 Command line and project scaffolding | `packages/cli`, `packages/create-spree-app` | None |
| CAP-11-13 Platform update check and usage data | `Spree::UpdateCheck` | None |
| CAP-03-03 Store provisioning | Spree's seeds and `Spree::Stores::ProvisionDefaults` | None. First-run setup (DA-SETUP-01) is batch 3 |
| CAP-03-12 External references | `Spree::ExternalReference` | None |
| CAP-05-11 Price history | `Spree::PriceHistory` | None |
| CAP-05-16 Slugs | The slug attributes | None |

Left out: CAP-11-12, multi-store administration, which has screens (dashboard shell part 2 and batch 3) and its own [work item](fb-19-batch-multi-store-administration.md), proposed on 2026-11-03 and built on 2026-11-04 in #49 ([record](../verification/2026-11-04-fb-19-batch-multi-store-administration.md)), and the Enterprise and documentation-only features (LIQ-006 §12). Its browser tests are G-72, which the multi-store record proposes to defer to this batch's browser-test work, with G-57 and P8, pending the owner's answer.

Nine steps also hold checks that area batches deferred here, although their capabilities have screens: P6, the dashboard shell's untested behaviours (G-22); P7, what the server refuses within one store (G-11, G-23, G-32 and G-40); P8, the catalog's untested behaviours (G-57); P9, the untested actions in settings, the catalog, multi-store administration, Getting Started and the storefront's checkout (G-37 with G-68, G-61, G-69, G-72, G-75 and G-84); P10, the remaining refusals within one store (G-11, with G-45, G-50, G-56, G-60, G-70, G-79, G-83 and batch 6's requests); P11, the untested actions in inventory, orders and what happens after the sale (G-87, G-90 and G-92); P12, the order refusals of batch 8 (G-91 and G-95); P13, the customer behaviours and refusals of batch 10 (G-97 and G-99); and P14, the marketplace refusals of batch 13 (G-106).

## 3. Coverage inventory

**Revisions.** Spree's code at `main` `a4a1708`. CI at `0f3d2d3`, the head of [#12](https://github.com/pateldhruval872/liquorify/pull/12), whose Spree code is the same: `git diff a4a1708 0f3d2d3` over `spree/`, `.github/` and `packages/` outside `packages/liquorify-storybook` is empty. The runs are Tests [39727910760](https://github.com/pateldhruval872/liquorify/actions/runs/39727910760) and Packages [39727910544](https://github.com/pateldhruval872/liquorify/actions/runs/39727910544); every job in both passed.

**How the counts were made.**

- **The API engine and the core engine.** RSpec's dry run, in this session, at the same Spree code, grouped by spec file. The API engine's dry run lists 5,765 examples, the same as the CI job's total. The core engine lists 10,830. Topics were matched by spec path, for example every API spec with `webhook` in its path.
- **The other engines.** The totals printed in their CI job logs.
- **The packages.** The Packages workflow's "Typecheck, Test & Build" job replayed all 50 of its tasks from Turbo's cache. The tests passed in an earlier run with identical inputs; that job ran none of them itself. The SDK integration tests and the scaffolded app job did run.

| Surface | Spree's own tests | Where they run | Result at `0f3d2d3` | What they leave out |
|---|---|---|---|---|
| Store API | 726 controller examples in 49 files; 229 reference examples in 38 files | Tests: `api` | PASS: the `api` job ran 5,765 examples, 0 failures, 1 pending | Every spec builds its own records and calls the API inside the test process |
| Admin API | 2,203 controller examples in 153 files; 696 reference examples in 107 files | Tests: `api` | PASS | As above |
| Seller API | 404 controller examples in 34 files; 170 reference examples in 30 files | Tests: `api` | PASS | As above |
| The published API reference | Written from the reference examples by `rake rswag:specs:swaggerize`, which Spree keeps deterministic. CI checks that the kits' generated types, schemas, request types and code lists match it | Packages: four "up to date" steps | PASS for the four steps | CI does not regenerate the reference and compare it with the committed files: NOT_RUN |
| `@spree/sdk` | 207 unit tests in 24 files, with mocked responses; 22 integration tests in 5 files against a real Rails test app: customer, cart, catalog, markets and sign-in | Packages: "Typecheck, Test & Build"; "SDK Integration Tests" | PASS: unit tests from the cache; integration tests ran, 22 of 22 | Most endpoints are reached only with mocked responses |
| `@spree/admin-sdk` | 282 unit tests in 35 files, with mocked responses | Packages, from the cache | PASS | No test against a running server |
| `@spree/seller-sdk` | 18 unit tests in 6 files, with mocked responses | Packages, from the cache | PASS | No test against a running server |
| API keys, OAuth applications, allowed origins | API engine: 107 examples in 13 files. Core: 90 in 4 | Tests: `api`, `core` | PASS | Nothing signs in from outside with a key or an OAuth application |
| Webhooks | API engine: 127 examples in 13 files, for endpoints, deliveries, the event list, inbound payment and payout webhooks, the delivery job, the delivery service and the event subscriber. Core: 114 in 5, for the endpoint and delivery models, payload redaction and inbound payment webhook handling | Tests: `api`, `core` | PASS | The receiving server is stubbed, so no delivery reaches a real receiver. The storefront's receiver (`src/app/api/webhooks/spree/route.ts`, `src/lib/webhooks/handlers.ts`) has no unit test |
| Events | Core: 130 examples in 11 files, for the event catalog, the registry, dispatch, the event log and custom events | Tests: `core` | PASS | — |
| Agent server | 56 examples in 3 files | Tests: `mcp` | PASS | No agent connects to a running server |
| Dashboard plugins | `@spree/dashboard-core`: 254 unit tests in 30 files, among them its route, navigation, form field and locale registries for plugins. The scaffolded app job builds a project with `create-spree-app` and type-checks and lints its dashboard and seller panel. The plugin example has no tests | Packages | PASS: unit tests from the cache; the scaffolded app job ran | The plugin example is never loaded into a running dashboard, and no stock screen registers a slot entry |
| Hosted dashboards | 14 examples in 2 files | Tests: `dashboard` | PASS | No built dashboard is served from the Rails server |
| Provider contracts | Core: 236 examples in 19 files, for the pricing, inventory, search, delivery rate, fulfilment, tax and digital asset providers. API engine: 7 in 2, for the payout and tax provider lists | Tests: `core`, `api` | PASS | — |
| Stripe | 297 examples | Tests: `providers` | PASS | The specs block the network and stub Stripe's answers; nothing calls Stripe's sandbox |
| EasyPost | 93 examples | Tests: `providers` | PASS | The same; no rate or label comes from EasyPost |
| Meilisearch | 127 examples | Tests: `providers`, against a real Meilisearch service started by the workflow | PASS | — |
| Tracing | 26 examples in 4 files, with an in-memory exporter | Tests: `opentelemetry` | PASS | No trace is exported to a collector |
| Command line tool | 259 unit tests in 27 files | Packages, from the cache | PASS | The tool drives Docker; no project was started with it |
| Project scaffolding | `create-spree-app`: 108 unit tests in 7 files; the scaffolded app job above | Packages | PASS | The scaffolded project is type-checked and linted, not started |
| Update check | 15 examples in 1 file | Tests: `core` | PASS | It sends the store's details to Spree, so it was not run against Spree's server, on purpose (FB-09) |
| Store provisioning | Core: 87 examples in 15 files, for the seeds and `ProvisionDefaults`. The first-run setup browser test | Tests: `core`; Packages: Dashboard E2E shard 1 | PASS | — |
| External references | Core: 26 examples in 2 files. API engine: 15 in 1 | Tests: `core`, `api` | PASS | — |
| Price history | Core: 8 examples in 2 files. API engine: 6 in 1 | Tests: `core`, `api` | PASS | — |
| Slugs | Core: 24 examples in 1 file | Tests: `core` | PASS | — |

The same suites passed on MySQL in the same run, which stays advisory.

## 4. Coverage and functional verification, kept apart

**Coverage** says what exists for a capability: its tests, its reference and its examples, mapped to its ID. **Functional verification** says whether the capability's whole behaviour was shown to work from outside, at a recorded revision.

Spree's own tests passing is evidence at the level those tests work: models, controllers and requests inside one test process, with outside services stubbed. It is not end-to-end verification. So every capability below is PARTIAL at best until its step in §5 runs.

| Capability | Coverage | Functional verification | What would complete it | Step |
|---|---|---|---|---|
| CAP-11-06 APIs and kits | Mapped: each API's tests and reference; each kit's tests. P1 found 32 Admin reads whose route the reference does not document for reading | PARTIAL, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23: the reference regenerates with 0 failures, and is stale in two places (SD-4). 212 of the Admin and Seller kits' 326 reads were called against the running server, and no request answered with a server error; every checked answer fits the kit's schema except for the two address issues on the Seller kit's orders (SD-3). The Store kit's 22 integration tests reach a real server in CI | The 114 reads not called, almost all for lack of a record; the kits' writes | P1, then the area batches |
| CAP-04-06 Keys, OAuth, origins | Mapped | PASS since 2026-10-27, within batch 2's and P2's documented limits: P2's checks passed, and the owner accepted them on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)); G-32, which alone kept it PARTIAL, closed when the owner accepted P7 ([merge record](../verification/2026-10-27-fb-19-platform-p7-merge.md#3-the-owners-answer-2026-10-27)) | Create a key and an OAuth application on the settings screens, then use each from outside | P2 |
| CAP-04-07 Agent server | Mapped | PASS since 2026-10-27, within batch 2's and P2's documented limits: P2's check passed, on the agent server gem's own test app, and the owner accepted it on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)); G-32, which alone kept it PARTIAL, closed when the owner accepted P7 ([merge record](../verification/2026-10-27-fb-19-platform-p7-merge.md#3-the-owners-answer-2026-10-27)) | Connect an agent to the running server through an OAuth authorization | P2 |
| CAP-04-08 Webhooks and events | Mapped. The storefront's receiver: no test | PARTIAL for the providers' inbound webhooks alone since G-32 closed on 2026-10-27 ([merge record](../verification/2026-10-27-fb-19-platform-p7-merge.md#3-the-owners-answer-2026-10-27)): P2's checks, the storefront's receiver among them, passed, and the owner accepted them on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)). The payment and payout providers' inbound webhooks stay with P4 | Deliver an event to a local receiver and to the storefront's receiver, with a test delivery and automatic disabling | P2 |
| CAP-11-07 Plugins | Mapped. The plugin example: no test | PASS since 2026-10-23 for the demonstrated frontend plugin mechanism, when the owner accepted P3; before it, PARTIAL on unit tests and a type-checked scaffold. P3 loaded the plugin example into a running dashboard, through the dashboard's own switch rather than the starter, and captured each of its entries, and ran again with the checks the owner's review corrected ([record](../verification/2026-10-23-fb-19-platform-p3.md)). It supports the frontend plugin mechanism and generic slot rendering; the starter's integration, slot entries on staff screens and the example's brand backend, which does not exist, are not verified | Load the plugin example into the dashboard starter and capture its route and slot entries on running screens | P3 |
| CAP-11-08 Hosted dashboards | Mapped | PASS, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23: the dashboard and the seller panel are served at `/dashboard` and `/sellers` and signed in to, on the hosting gem's own test app | — | P1 |
| CAP-11-09 Provider contracts | Mapped | PARTIAL: Spree's specs only | Each provider through its area batch's running screens (batches 4, 7 and 8) | P4 |
| CAP-07-02 Stripe | Mapped | BLOCKED for sandbox calls: no test keys | A payment and a saved card through Stripe's sandbox | P4 |
| CAP-07-07 EasyPost | Mapped | BLOCKED for sandbox calls: no test key | A rate and a label from EasyPost's test mode | P4 |
| CAP-05-14 Meilisearch | Mapped | PARTIAL: Spree's specs against a real Meilisearch service | Search on the running storefront with Meilisearch, in batch 4 | P4 |
| CAP-11-10 Tracing | Mapped | PASS for a request's trace reaching a local collector, on the tracing gem's own test app, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23, and for webhook deliveries, with their job runs and outgoing requests, since the owner accepted [P2](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25) on 2026-10-25 | The layers not seen: mail, extension hooks and gateway calls | P1; webhooks in P2 |
| CAP-11-11 Command line and scaffolding | Mapped | PARTIAL: unit tests and a type-checked scaffold | Create a project and start it with the tool, where Docker is available | P5 |
| CAP-11-13 Update check | Mapped | NOT_RUN on purpose: it would send data to Spree | FB-09's decision; then a run against a stand-in server, never Spree's | — |
| CAP-03-03 Store provisioning | Mapped | PARTIAL: Spree's specs and the first-run setup browser test | Batch 3's first-run setup flow, without sample data; the sample data option, deferred to batch 4 by the owner on 2026-10-25 | Batches 3 and 4 |
| CAP-03-12 External references | Mapped | PASS through the Admin kit on the running server, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23 | — | P1 |
| CAP-05-11 Price history | Mapped | PASS for single price changes on the running server, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23. A bulk change leaves the prior price correct | Whether bulk changes are recorded | P1 |
| CAP-05-16 Slugs | Mapped | PARTIAL: Spree's specs only | Open a product, a category and a store by slug on the running storefront, in batch 4 | Batch 4 |

All 17 are mapped. After P1, which the owner accepted on 2026-10-23, four have a PASS: hosted dashboards, tracing, external references and price history, the last for single price changes. CAP-11-06 is PARTIAL.

## 5. When each check runs

The inventory came first, as the owner asked. Each check runs once what it needs exists, so most of the batch runs alongside the area batches rather than at the end.

| Step | Checks | Depends on |
|---|---|---|
| P1 | Regenerate the API reference and compare it with the committed files; call the Admin and Seller kits' read endpoints against the running browser-test server; serve the hosted dashboard; export traces to a local collector; external references and price history through the Admin API. Also find out whether the browser-test server can deliver mail where a script can read it, without changing Spree's code, which would close the email gaps in the staff and account batches | Nothing new. It can run now. Run on 2026-10-22: the [mail check](../verification/2026-10-22-fb-19-platform-p1-mail.md) and the [other checks](../verification/2026-10-22-fb-19-platform-p1-checks.md). Merged with #13 and storefront #19, and accepted, on 2026-10-23 ([merge record](../verification/2026-10-23-fb-19-platform-p1-merge.md)) |
| P2 | Webhook deliveries, API keys, OAuth applications and the agent server, set up on their settings screens and used from outside. It includes a browser test that approves an application's request on the authorization page (DA-SET-32), which the owner assigned to P2 on 2026-10-23, because Spree's browser tests make that approval through the API | The owner's acceptance of batch 2, developer and integration settings, as the owner answered on 2026-10-23; in its own pull request. The owner accepted batch 2 and merged #16 on 2026-10-25, and P2 started the same day. Its completion criteria are below. It ran the same day in #17, every check passing ([record](../verification/2026-10-25-fb-19-platform-p2.md)), and again after the owner's corrections. The owner accepted it the same day ([record §9](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)) and merged it ([merge record](../verification/2026-10-25-fb-19-platform-p2-merge.md)) |
| P3 | The plugin example loaded into a running dashboard, with its slot entries captured | Dashboard shell part 2. Run on 2026-10-23 in #15, after part 2's merge, and again with the corrections the owner asked for; accepted by the owner on 2026-10-23 ([record](../verification/2026-10-23-fb-19-platform-p3.md)) |
| P4 | Stripe and EasyPost sandbox calls; the providers through their area screens; Meilisearch on the storefront. Since 2026-11-04 also G-13, a saved card shown with a real Stripe test card on the storefront, and batch 9's real Stripe states, which the owner moved here that day ([record](../verification/2026-11-04-owner-decision-brief-answers-2.md)); batch 9 shows the provider forms only in stories labelled as mocked. Since 2026-11-09 also buying a return label, P11's action 3.11 (G-92), and since 2026-11-10 approving a risky order, P11's action 2.3 (G-90), which needs a payment whose checks mark it risky ([record](../verification/2026-11-10-fb-19-platform-p11-owner-decisions.md)), and the 15 provider-specific stories of G-93: bought labels, their refunds, shipping documents and every carrier status ([record §3](../verification/2026-11-09-owner-decision-brief-answers-4.md#3-g-93s-remaining-stories)) | Batches 4, 7, 8 and 9; test keys from the owner. OA-1 adds keys to the storefront's CI only; the backend's sandbox runs need keys the owner provides separately, and they are never printed or committed |
| P5 | A project created and started with the command line tool | FB-04, the development path, in an environment with Docker |
| P6 | Browser tests for the five dashboard shell behaviours that part 2 captured but no test drives (G-22): the theme, the store switcher, the notifications, the command palette's record search and the rail's settings search. Added on 2026-10-23, when the owner accepted G-22's deferral to it | Part 2's merge (#14). Its completion criteria are below. Run on 2026-10-23 in #15, after the merge ([record](../verification/2026-10-23-fb-19-platform-p6.md)). The owner accepted it and closed G-22 the same day |
| P7 | Requests that no Spree spec sends, each sent within one store as a caller who may not make it and checked for its exact refusal, with the same request from a caller who may make it as a control: G-11 (staff access and the shopper accounts, the storefront's own server code included), G-23 (the command palette's searches) and G-32 (batch 2's narrower roles). Added on 2026-10-26, when the owner brought G-11 forward to it. Its completion criteria are below | Staff access parts 1 and 2, the shopper accounts batch and batch 2, all accepted; in its own pull request, beside batch 3. G-40, batch 3's narrower roles, joins from 2026-10-26, when the owner accepted batch 3 and #19 merged. Run on 2026-10-26 in #22 for G-11, G-23 and G-32, and again after #19's merge with G-40, every request passing twice in a row each time ([record](../verification/2026-10-26-fb-19-platform-p7.md)). Merged and accepted on 2026-10-27 ([merge record](../verification/2026-10-27-fb-19-platform-p7-merge.md)) |
| P8 | Browser tests for the catalog behaviours that part 1 of the catalog and pricing batch captured but no test drives (G-57): the product list's channel, product type and tag filters, adding to collections in bulk, the search engine card, editing and deleting product types, reordering option values and deleting a library file in use. Added on 2026-11-02, when the owner deferred G-57 to the platform's browser-test work. Its completion criteria are below | Part 1's merge (#34); in its own pull request |
| P9 | Browser tests for the settings, catalog and multi-store actions that batch 7, part 2 of the catalog and pricing batch and batch 15 captured but no test drives (G-69, G-61 and G-72), Getting Started's store address dialog, storefront address, payment method task and task completion (G-37 with G-68), and the storefront checkout actions of batch 9 and the promotion, gift card and store credit behaviours of catalog part 3 (G-75 and G-84). Added on 2026-11-04, when the owner deferred those gaps to the platform's browser-test work: G-37 with G-68 the same day (row F), and G-75 and G-84 later that day (rows 31 and 35). Its completion criteria are below | The merges of #19, #41, #42, #49, #55 and #61, all done; in its own pull request, in parts if one batch merges later, with G-75's tests in the storefront's repository |
| P10 | The refusals within one store that G-11 still holds after P7: the requests of G-45, G-50, G-56, G-60, G-70 and G-79, part 3's (G-83, with three of G-84's behaviours) and batch 6's, checked as P7 checked its own. Added on 2026-11-04 as the consolidated check of decision 3, when the owner linked G-45 and G-70 to G-11. Its completion criteria are below, and its requests, expected answers and closing conditions were recorded before implementation on 2026-11-05 | Part 3 of the catalog and pricing batch, merged; in its own pull request, before Liquorify changes identity or access |
| P11 | Browser tests for the 48 inventory, order and after-sale actions that batch 6 and both parts of batch 8 captured but no test drives (G-87, G-90 and G-92), each listed with its expected result. Added on 2026-11-09, when the owner asked for a bounded follow-up for them, since P9 had finished. Buying a return label stays with P4. Its completion criteria are below | The merges of #64, #80 and #84, all done; in its own pull request, in parts if need be, with action 3.15 in the storefront's repository. Action 2.21 follows the owner's answer to row 39 of the owner decision brief |
| P12 | The refusals within one store that batch 8 recorded and P10 did not send: G-95, with G-91's outstanding requests. Added on 2026-11-09, when the owner linked G-95 to G-11 through a named follow-up to P10. Its checks are recorded before implementation, as P10's were | The merges of #80 and #84, both done; P10's scripts; in its own pull request, before Liquorify changes identity or access. Checks recorded and run on 2026-11-09, every request passing twice in a row ([record](../verification/2026-11-09-fb-19-platform-p12.md)) |
| P13 | Batch 10's customer behaviours no browser test drives (G-97), in part A, and the refusals its narrower roles could meet (G-99), in part B, kept apart. Added on 2026-11-10, when the owner asked for a bounded customer verification follow-up and linked G-99 to G-11 ([record](../verification/2026-11-10-owner-answers-batch-10.md)). Part B's expected refusals and controls are recorded before implementation, as P12's were | The merge of #94; P10's judge; in its own pull request, in two parts if need be, with part B before Liquorify changes identity or access. Run on 2026-11-10: part B passed twice in a row and closed G-99; part A left G-97 open for A.4's registry check alone, with failing tests kept on SD-44, SD-45, SD-46 and SD-94 ([record](../verification/2026-11-10-fb-19-platform-p13.md)) |
| P14 | The marketplace refusals of batch 13's part 1 (G-106): the requests the narrower seller, commission, payout, order and settings roles could make, which no Spree spec sends. Added on 2026-11-10, when the owner linked G-106 to G-11 through a named follow-up ([record §14](../verification/2026-11-10-fb-19-batch-marketplace-part-2.md#14-the-owners-answers-of-2026-11-10)). Its exact refusals and controls are recorded before implementation | The merges of #98 and #101; P10's judge; in its own pull request, before Liquorify changes identity or access |
| — | The update check against a stand-in server | FB-09 |

### P2: keys, OAuth clients, the agent server and webhooks, used from outside

Batch 2 captured the developer and integration settings screens and compared them with their stories. Whether what a merchant sets up there works from outside the dashboard was left to P2 (G-29, G-30, G-31), together with the webhook part of G-16. P2 adds those checks in Liquorify's own scripts, as P1 and P6 did, and changes no Spree code, test or workflow. Where Spree needs to be told about the test environment, it is told through its own settings when the server starts, as in P1: `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS`, so a webhook may reach a local receiver, and `SPREE_DASHBOARD_URL`, so the authorization endpoint sends the browser to the dashboard under test. P2 is complete when all of these hold:

1. **API keys (CAP-04-06, DA-SET-26).** As the admin, on the API keys screen: create a publishable key, and a secret key that carries only `read_products`. Then, from a script outside the browser:
    1. the publishable key reads the Store API's products, and the same request without a key is refused;
    2. the secret key reads the Admin API's products, and is refused when it writes a product or reads orders, which its scope does not carry;
    3. once each key is revoked on the screen, the request it made before is refused.
2. **An OAuth client and the authorize page (CAP-04-06, DA-SET-27, DA-SET-32, G-30).** As the admin, on the OAuth clients screen: register a client whose callback is a local receiver. A browser test then starts the authorization code flow with PKCE at Spree's authorization endpoint, as a client does, and follows it to the dashboard's consent page:
    1. **approve:** the browser reaches the callback with a code and the state it sent. The script exchanges the code, with its verifier, for a token. The token reads within the scope that was granted and is refused outside it, and once revoked at Spree's revocation endpoint it is refused;
    2. **deny:** the callback receives `access_denied` and no code;
    3. a code cannot be exchanged twice, or without the verifier.
3. **Allowed origins (CAP-04-06, DA-SET-30).** In Spree's engine, the store's allowed origins decide which redirect addresses a request may name, for example the link in a password reset. With an origin added on the allowed origins screen, a customer password reset that names a redirect address on it carries that address in the event Spree publishes. One that names an address on another origin carries none. Both are read from the webhook delivery in criterion 5. Cross-origin browser access (CORS) is configured by the host application, not by Spree's engine, so P2 does not check it.
4. **The agent server (CAP-04-07, DA-SET-07).** On the agent server gem's own test app, because Spree's browser-test server does not load that gem, as P1 did for tracing. With the dashboard served against that app: connect an agent on the AI agents screen, approve on the consent page and exchange the code as in criterion 2. Then, from a script outside the browser, using the token:
    1. a session starts, and the tool list offers only what the granted scope allows;
    2. a read tool returns the store's data;
    3. a tool outside the grant is refused, and the same request without a token is refused.
5. **Webhooks (CAP-04-08, DA-SET-28, DA-SET-29, G-29, G-31).** On Spree's browser-test server, with a local receiver that records each request:
    1. on the webhooks screens, create an endpoint for the receiver, subscribed to chosen events, and keep its signing secret, which is shown once;
    2. the endpoint page's test delivery reaches the receiver, its signature verifies with that secret, and the page lists the delivery as succeeded;
    3. real events reach the receiver: a product changed through the Admin API, and the password resets of criterion 3. Each carries a signature that verifies, its event name, and a payload in the Store API's shape with prefixed IDs. An event the endpoint is not subscribed to is not delivered;
    4. with the receiver answering every request with an error, a failed delivery is retried. After 15 failed deliveries in a row the endpoint is disabled automatically. Its page shows it disabled, and the endpoint disabled email (EM-S-07) is sent to the store's staff, read from the mail folder as in P1;
    5. **the storefront's receiver.** The storefront, started locally at a recorded revision with the endpoint's secret, accepts deliveries of the order events its receiver handles and writes each email it sends, as in P1. It refuses a delivery with a wrong signature. This is the webhook part of G-16.
6. **Tracing of webhook deliveries (CAP-11-10).** On the tracing gem's own test app, with a local collector, as in P1: a webhook delivery is recorded as a span, and the delivery request carries the trace context to the receiver. This is the layer P1 left to P2.
7. **Nothing leaks.** No key, secret, token, code or password is printed, saved in evidence or committed. Screenshots paint them out, as batch 2's did, and scripts keep them in memory.
8. **A recorded run.** Each check runs at a recorded revision, the browser tests in the pinned Playwright image, and passes twice in a row.
9. **A record.** A verification record gives the revision, each check's script, result and evidence. A failure is recorded as a defect in LIQ-004, not fixed in Spree's code.
10. **Nothing else claimed.** P2 claims no tenant isolation, which stays FB-03's validation, NOT_RUN. It claims no refusals for the narrower roles, which stay G-11 and G-32. The payment and payout providers' inbound webhooks, and the integrations' use with real accounts, stay with P4 (G-26). CAP-04-09 stays PARTIAL.
11. **The owner's answer.** G-29, G-30 and G-31 close only when the owner accepts P2's record. Until then, CAP-04-06 to CAP-04-08 stay PARTIAL, and that record says whether anything else keeps them PARTIAL. G-16 stays open for whatever P2 does not show.

### P6: the dashboard shell's untested behaviours

Part 2 of the staff access batch captured each of these on Spree's running dashboard, but no browser test drives them ([part 2's record §2.2](../verification/2026-10-22-fb-19-batch-staff-access-part-2.md#22-browser-tests-by-overlay)). P6 adds those tests in Liquorify's own scripts, as P1 did, and changes no Spree code, test or workflow. It is complete when all of these hold:

1. **One browser test for each of the five behaviours**, driven through the dashboard as a teammate whose role shows the control, and asserting what the screen shows:
    1. **Theme:** choosing light, then dark, then system in the account menu changes the dashboard's theme each time, and the last choice still applies after a reload.
    2. **Store switcher:** with a second store the teammate may open, choosing it in the switcher opens that store's dashboard, and the switcher then names it.
    3. **Notifications:** with the update check answered with a newer release, the bell shows an unread notice and opening it shows that release; without one, it reads "You're all caught up". The answer is simulated, as the owner accepted for G-20, so P6 does not verify Spree's real update service.
    4. **The command palette's record search:** searching for an existing product, order and customer by name or number lists each one, and choosing it opens that record's page.
    5. **The rail's settings search:** typing a settings page's name in the rail's settings menu leaves that page in the list, choosing it opens the page, and a query that matches nothing says so.
2. **A recorded run.** The tests run against Spree's browser-test server at a recorded revision, in the pinned Playwright image, and pass twice in a row.
3. **A record.** A verification record gives the revision, each test's result and its evidence. A failure is recorded as a defect in LIQ-004, not fixed in Spree's code.
4. **Nothing else claimed.** Refused requests stay in G-11, which holds G-23's palette searches, and tenant isolation stays FB-03's validation. P6 claims neither, and it does not verify the server's validation of the profile dialog (G-21).
5. **The owner's answer.** G-22 closes when the owner accepts P6's record. CAP-04-05 stays PARTIAL until then; that record says whether anything else keeps it PARTIAL.

### P7: refusals within one store

The owner added this step on 2026-10-26 and brought G-11 forward to it, from "before the first Liquorify change to identity or access" to now. The staff access batch, the shopper accounts batch and batch 2 recorded what Spree's own specs refuse. What no Spree spec sends stayed NOT_RUN (G-11, G-23, G-32, and batch 3's G-40), and the refusal check's results in parts 1 and 2 were kept as observations. P7 sends those requests in Liquorify's own scripts, as P1, P2 and P6 did, and checks each answer. It changes no Spree code, test or workflow. P7 is complete when all of these hold:

1. **The requests.** Every request the four gaps name, each sent within one store as a caller who may not make it:
    1. **G-11, staff access:** the staff, invitation and role requests that no Spree spec sends ([part 1's record §3.2](../verification/2026-10-22-fb-19-batch-staff-access-part-1.md#32-what-the-server-refuses)), as teammates whose roles do not allow them.
    2. **G-11, shopper accounts:** the Store API's account requests that no Spree spec sends ([the accounts record §3.2](../verification/2026-10-22-fb-19-batch-storefront-shopper-accounts.md#32-what-the-server-refuses)), as another customer of the same store and as a guest: reading or changing another customer's profile, addresses, orders, saved cards and gift cards. Then the same through the storefront's own server code, signed in as the wrong customer, with the storefront at a recorded revision.
    3. **G-23:** the command palette's searches, as the teammates of [part 2's record §3.2](../verification/2026-10-22-fb-19-batch-staff-access-part-2.md#32-what-the-server-refuses), each searching a resource its role may not read.
    4. **G-32:** the requests of batch 2's narrower roles ([record §3.1](../verification/2026-10-24-fb-19-batch-developer-settings.md#31-what-the-interface-shows-each-role)): the developer settings viewer creating a key, connecting an agent or switching a payment provider, and the order manager reading or creating on those screens.
    5. **G-40:** the requests of batch 3's narrower roles ([record §3.1](../verification/2026-10-26-fb-19-batch-setup-stores-and-settings.md#31-what-the-interface-shows-each-role)) that no Spree spec sends. They were to wait for the owner's acceptance of batch 3 and #19's merge, both given on 2026-10-26.
2. **Exact refusals.** Each refused request asserts the exact status and error code expected, written in the script before the run: for example 403 with `access_denied` and the missing permission, 404 with `record_not_found`, or 401. Any other answer fails, a server error and a success included.
3. **Allowed controls.** Each refused request is paired, in the same run, with the same request from a caller who may make it: a teammate whose role allows it, or the record's own customer. The control must succeed with its expected status. A refusal whose control did not succeed is a FAIL, so a server that refuses everything cannot pass.
4. **Nothing exposed.** A refused answer carries none of the protected record's data. The script looks in each refused answer for the record's known values, such as names, emails, address lines, order numbers, key prefixes and search results, and fails if any appears. Answers are not saved as evidence; only the status, the code and this check's result are.
5. **Nothing changed.** After each refused write, an allowed caller reads the record back and finds it as it was, or finds it was not created. A refused write that changed anything fails.
6. **The checks fail when they should.** Each kind of assertion is shown to fail against a stand-in server that answers with a success, the wrong code, a server error, leaked data, or a change after a refusal.
7. **A recorded run.** Against Spree's browser-test server at a recorded revision, freshly started with its own test data, twice in a row; for item 1.2, the storefront at a recorded revision as well.
8. **Results from the evidence.** Each request is PASS or FAIL. A gap is PASS only when every request it names passes, PARTIAL when some pass and the rest are named, and FAIL when any request is answered in a way it should not be. An answer that should have been a refusal is recorded as an existing defect in LIQ-004, with its severity, and not fixed.
9. **Nothing leaks.** No token, key, password or code is printed, saved in evidence or committed.
10. **A record.** A verification record gives the revisions and, for each request, its caller, the expected and actual answer, the control's result and the exposure and change checks, then each gap's result.
11. **Nothing else claimed.** Every request stays within one store. P7 claims nothing about tenant isolation, which stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. It claims nothing about requests or roles it did not send.
12. **The owner's answer.** Running P7 closes no gap. G-11, G-23, G-32 and G-40 each close only on passing evidence for every request they name and the owner's acceptance. Until then each capability they keep at PARTIAL stays so, and P7's record says what else keeps it PARTIAL.

### P8: the catalog's untested behaviours

Part 1 of the catalog and pricing batch captured each of these on Spree's running dashboard, and Spree's specs cover the server's side, but no browser test drives them ([part 1's record §7](../verification/2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#7-gaps)). The owner deferred them here on 2026-11-02 (G-57). P8 adds those tests in Liquorify's own scripts, as P6 did, and changes no Spree code, test or workflow. It is complete when all of these hold:

1. **One browser test for each behaviour**, driven through the dashboard as the admin, asserting what the screen shows and, after a reload, what was saved:
    1. **The product list's filters:** filtering by a channel, by a product type and by a tag each lists only the products that match, and clearing the filter lists them all again.
    2. **Adding to collections in bulk:** with products chosen on the product list, adding them to a collection from the bulk actions leaves each of them in that collection.
    3. **The search engine card:** changing a product's slug, meta title and meta description and saving shows the new values after a reload.
    4. **Product types:** renaming a product type saves the new name; deleting one that no product uses removes it; deleting one that a product uses is refused with Spree's message, and the type stays.
    5. **Option values:** reordering an option type's values, with the pointer and with the keyboard, saves the new order, which the sheet shows again after a reload.
    6. **A library file in use:** asking to delete a file that a product uses shows Spree's warning naming where it is used; cancelling keeps the file in the library and on the product; and confirming removes it from the library and from the product. Corrected on 2026-11-04 by the owner's answer to row E of the decision brief. As first written, it asked that the delete be refused with Spree's message and the file stay, which Spree's dashboard by design does not do: it warns, then deletes the file from where it is used.
2. **The tests fail when they should.** Each test is shown to fail when what it asserts does not happen, such as a save that is refused or an order that is not kept.
3. **A recorded run.** The tests run against Spree's browser-test server at a recorded revision, in the pinned Playwright image, and pass twice in a row.
4. **A record.** A verification record gives the revision, each test's result and its evidence. A failure is recorded as a defect in LIQ-004, not fixed in Spree's code.
5. **Nothing else claimed.** What the server refuses to narrower roles stays in G-11, which holds G-56, and tenant isolation stays FB-03's validation, NOT_RUN. P8 verifies no digital file source with settings (G-55).
6. **The owner's answer.** G-57 closes only when the owner accepts P8's record. On 2026-11-04 the owner decided, in row E, that G-57 closes only on passing evidence for the corrected 1.6, with SD-19, SD-20 and their failing results kept, and P8 never described as entirely passing. Until then the functional verification it names stays open, and CAP-05-01, CAP-05-03, CAP-05-06 and CAP-05-16 stay PARTIAL; that record says whether anything else keeps them PARTIAL.

### P9: untested actions in settings, the catalog and multi-store administration

Batch 7 (#41), part 2 of the catalog and pricing batch (#42) and batch 15 (#49) each captured these actions on Spree's running dashboard, and Spree's specs cover the server's side, but no browser test drives them. On 2026-11-04 the owner deferred them here (G-69, G-61 and G-72; rows 15, 21 and 23 of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md)), and asked that each deferred check have a named work item and a closure condition. P9 adds those tests in Liquorify's own scripts, as P6 and P8 did, and changes no Spree code, test or workflow. Later the same day the owner added G-37, from batch 3 (#19), with G-68, from batch 7, which is linked to it (row F of the brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md#5-later-the-same-day)), with the scope in item 1.4, and asked for the tests, their expected results and the closure conditions to be recorded before implementation. It may run in parts, one for each gap, once that gap's batch has merged. It is complete when all of these hold:

1. **One browser test for each action** its gap's row in [LIQ-004](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) names, driven through the dashboard as the admin, or as the teammate the action needs, asserting what the screen shows and, after a reload, what was saved:
    1. **G-69, batch 7:** deleting a zone and a delivery method, adding a zone's states and postal codes, creating a rate for a state, the external tax service's note, making a profile the default, narrowing a profile's origins, a payment method's name refused, and switching a method to admin only ([batch 7's record §7](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax.md#7-gaps)).
    2. **G-61, part 2 of the catalog and pricing batch:** the category, collection, catalog, translation, price list and import actions its row names, such as deleting a category, activating a catalog, and a price list's schedule and priority order (part 2's record, §7).
    3. **G-72, batch 15:** a teammate who works in two stores, switching between their stores, and joining a second store with an existing account ([batch 15's record §7](../verification/2026-11-04-fb-19-batch-multi-store-administration.md#7-gaps)).
    4. **G-37 with G-68, Getting Started (batches 3 and 7, FL-01):** on Getting Started (DA-HOME-02), as the admin of a store that has not done these tasks ([batch 3's record](../verification/2026-10-26-fb-19-batch-setup-stores-and-settings.md), [batch 7's record §2.2](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax.md#22-fl-01-the-two-tasks-step-by-step)):
        1. **The store address dialog.** The store address task opens its dialog. Expected: a required field left empty is refused with its message and nothing is saved; with the required fields filled, saving closes the dialog and the task shows done.
        2. **Saving the storefront address.** In the storefront sheet, an address is entered and saved. Expected: the sheet shows it again after a reload, and the storefront task shows done. A value that is not an address is not saved and its refusal message is visible; that test fails on SD-7, whose message is drawn beneath the sheet, until SD-7 is fixed, and the failing result is kept.
        3. **The payment method task's link.** Expected: it opens the payment methods page (DA-SET-12).
        4. **Task completion after a reload.** After the store address and the storefront address are saved and a payment method is added, Getting Started is reloaded. Expected: each of those three tasks shows done, the progress counts them, and a task not yet done still shows not done.
    5. **G-75, batch 9 (storefront cart and checkout):** applying a coupon and a gift card, placing an order with Check and with nothing to pay, choosing a saved address, completing a signed-in checkout, using checkout's address editor, and checkout showing tax and a second market's currency ([batch 9's record §11](../verification/2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#11-gaps)). Driven through the storefront as a guest or a signed-in customer, in the storefront's repository, against the backend its browser tests use, the pinned Liquorify backend since storefront #23, at a recorded revision; that is criterion 3's server for these tests. The signed-in tests fail on SD-21 until its fix merges, and those failing results are kept. Added by the owner on 2026-11-04 (row 31 of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-3.md)).
    6. **G-84, part 3 of the catalog and pricing batch:** the promotion, gift card and store credit behaviours of [part 3's record §2.3](../verification/2026-11-04-fb-19-batch-catalog-and-pricing-part-3.md#23-behaviours-no-browser-test-drives-criterion-15), apart from 11, 12 and 22, which need a narrower role and go to P10: a promotion's single code and its batch of codes, the codes sheet, a usage limit, a schedule, the rules, match policy and calculators beyond Spree's tests, a save refused, the promotions list's search, filters and sorting, a promotion page that cannot load, the gift card list's filters and search, an expired and a partly redeemed gift card, issuing a batch of gift cards, the store credit list's filters, a credit's history, an erased shopper's credit, and the issue and edit dialogs refusing an amount. Added by the owner on 2026-11-04 (row 35, [record](../verification/2026-11-04-owner-decision-brief-answers-3.md)).
2. **The tests fail when they should.** Each test is shown to fail when what it asserts does not happen, such as a save that is refused or a change that is not kept.
3. **A recorded run.** The tests run against Spree's browser-test server at a recorded revision, in the pinned Playwright image, twice in a row.
4. **A failure is a defect.** A test that fails because Spree does not do what it should is recorded as a defect in LIQ-004, with its failing result kept. It is not fixed in Spree's code, and the test is not weakened to pass. G-72's tests fail on SD-18 until SD-18 is fixed.
5. **A record.** A verification record gives the revision, each test's result and its evidence, and says which results fail and on which defect.
6. **Nothing else claimed.** What the server refuses to narrower roles stays in G-11 and P10, and tenant isolation stays FB-03's validation, NOT_RUN. P9 verifies no real provider, which stays P4's. Item 1.4 runs within one store and claims nothing about ISO-6, where one store's tax rate marks another store's tax task done; ISO-1 to ISO-7 stay open.
7. **Closing.** Each gap closes on P9's record when every action it names has a test that passes, or fails only on a defect recorded under criterion 4. That closing is delegated acceptance under the owner's delegation of 2026-11-04, not the owner's review. A test that fails for any other reason keeps its gap open, and until a gap closes the functional verification it names stays open.

### P10: the remaining refusals within one store

P7 sent the requests that G-11, G-23, G-32 and G-40 named in October. The requests linked to G-11 since then were kept for one check of the whole catalog after its part 3, before Liquorify changes identity or access (decision 3 of the owner decision brief, 2026-11-04). On 2026-11-04 the owner also linked G-45 and G-70 to G-11 (rows 9 and 16 of the brief, [record](../verification/2026-11-04-owner-decision-brief-answers-2.md)) and asked that each deferred check have a named work item. P10 is that check. It sends, within one store, as a caller who may not make it, each request no Spree spec sends for:

1. **G-45 and G-50:** the endpoints of the shop batch's parts 1 and 2, and the storefront's own server code for them ([part 1's record §3.2](../verification/2026-10-26-fb-19-batch-storefront-shop-part-1.md#32-what-the-server-refuses), [part 2's record §3.2](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md#32-what-the-server-refuses)).
2. **G-56, G-60 and part 3's (G-83, with behaviours 11, 12 and 22 of G-84):** the catalog's requests for the narrower roles of parts 1, 2 and 3 of the catalog and pricing batch ([part 1's record §3.1](../verification/2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#31-what-the-interface-shows-each-role), and parts 2 and 3's records).
3. **G-70:** batch 7's payment, tax, delivery and package type requests for its narrower roles ([batch 7's record §3.1](../verification/2026-11-04-fb-19-batch-payments-delivery-and-tax.md#31-what-the-interface-shows-each-role)).
4. **G-79:** batch 9's requests to the cart, checkout and order endpoints that no Spree spec sends, such as another guest's cart token or another customer's address on a cart ([batch 9's record §3.2](../verification/2026-11-04-fb-19-batch-storefront-cart-and-checkout.md#32-what-the-server-refuses)). Added by the owner on 2026-11-04 (row 31 of the owner decision brief, [record](../verification/2026-11-04-owner-decision-brief-answers-3.md)), with G-84's three behaviours that need a narrower role (row 35).
5. **Batch 6, inventory:** the requests no Spree spec sends for batch 6's narrower roles ([batch 6's record §3.2](../verification/2026-11-04-fb-19-batch-inventory.md#32-what-the-server-refuses)): the writes its roles were shown controls for and the reads they make. Batch 6's record joined them to G-11 for P10 under the owner's answer to row 31 for the applicable refusals, with no new gap number, and LIQ-004's G-11 row holds them, so G-11 cannot close without them. Added to this list on 2026-11-05, when P10's checks were recorded below.

P10 is complete when P7's criteria 2 to 10 hold for these requests: exact refusals written before the run, an allowed control for each, nothing exposed, nothing changed, the checks shown to fail against a stand-in server, two runs in a row on freshly started servers, results from the evidence, nothing leaked, and a record. Like P7, it claims nothing about tenant isolation, which stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open, and nothing about requests or roles it did not send.

**Closing.** G-11 and each gap linked to it close only on P10's passing evidence for every request they name, as delegated acceptance. A request answered when it should have been refused is recorded as a defect with its severity and brought to the owner as a security finding, and the gap it belongs to stays open.

#### P10's checks, recorded before implementation

Recorded on 2026-11-05, before any of P10's scripts was written, as the coordinator asked for the approved Spree-first work: the requests, who sends them, the answer each must get, the control beside it, and how each gap closes. The expected answers are written from Spree's code as on `main` at `e66b331c`, the storefront's code at its `main`, `ba6ddcd` (after SD-21's fix, storefront #26), and the source records named in items 1 to 5. Nothing here has been sent yet.

**How the checks run.** As P7's did: Liquorify's own scripts in `packages/liquorify-storybook/fidelity/`, with P7's judge (`one-store.ts`), against Spree's browser-test server started freshly with its own fixtures (`stack.spec.ts`), and, for items 1 and 4, the storefront at `ba6ddcd` built and started against the same server. Every request stays in the default store. Each run adds its own records, named with the run's stamp. Spree's code, tests and workflows, and the storefront, are not changed.

**The callers.** The teammates `staff.ts` already adds, each holding one role, with the permission keys `/me` reports recorded beside each answer:

| Caller | Role's keys, as created | Used in |
|---|---|---|
| Catalog viewer | `read_products`, `read_publishing`, `read_media`, `read_product_types`, `read_stock`, `read_categories`, `read_collections` | Item 2 (parts 1 and 2) |
| Order manager | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | Items 2 and 5 |
| Merchandiser | `write_products`, `write_categories`, `write_collections`, `write_stock` | Items 2 and 5 |
| Marketer | `write_promotions` | Item 2 (part 3) |
| Loyalty viewer | `read_promotions`, `read_gift_cards`, `read_store_credits`, `read_customers` | Item 2 (part 3) |
| Delivery settings viewer | `read_settings`, `read_delivery_methods`, `read_package_types` | Item 3 |
| Delivery methods editor | `read_settings`, `write_delivery_methods`, `write_package_types` | Item 3 |
| Stock viewer | `read_stock`, `read_purchasing`, `read_products` | Item 5 |
| Purchaser | `write_purchasing`, `read_stock`, `read_products` | Item 5 |
| Store settings, settings viewer, support, admin | As P7 recorded | Controls |

Shoppers, each added by the run: guest A, with a cart holding an item, an address and a chosen delivery rate; guest B, with a cart of their own; customer C, signed in, with a cart and no saved address; and customer D, signed in, with a saved address and a cart. Through the storefront, each visitor is a cookie jar, and the two customers sign in through the storefront's own sign-in action, as in P7.

**How each expected answer is written.** From Spree's code, by these rules. Where an endpoint departs from them, its row says why.

- **A1. A list, a collection action or a create, by a role without the key:** 403 `access_denied` naming the missing key. Spree's key gate (`ScopedAuthorization`) answers before the action runs. Example: the order manager creating a category is refused naming `write_categories`.
- **A2. Reading, changing or deleting one record the role may not, for that action:** 404 `record_not_found`. Spree looks the record up among those the caller may read (for a read) or change (for a change or a delete) before the key gate runs, as P7 found for a policy, a channel and a market. A nested record whose parent is looked up among those the caller may change answers the same, as part 3 recorded for a promotion's rules and actions.
- **A3. A nested write whose parent lookup ignores the role:** 403 naming the write key. A stock receipt finds its transfer or purchase order among the store's, and an origin group finds its delivery profile among those the caller may read, so the key gate answers.
- **A4. A change Spree gates on another key than the record's own:** a stock location is changed only with `write_settings` (`StockLocationsController#scoped_resource_name`), so a merchandiser, whose `write_stock` lets it find the location, is refused with 403 naming `write_settings`.
- **S1. A cart named by its id with another shopper's cart token, or as another customer:** 403 `access_denied`, from Spree's storefront access policy (`CartResolvable#find_cart` and `#find_cart!`), with no permission named.
- **S2. A line item or delivery choice of one cart, sent on another cart's path:** 404 `record_not_found`, because Spree looks it up within the cart named in the path.
- **S3. A placed order named by its id with another shopper's token, or as another customer:** 404 `order_not_found`, as P7 observed for the order endpoint.
- **S4. A saved address of another customer named on a cart:** not a refusal. Spree looks the id up among the cart's own customer's addresses and ignores it when it is not one (`Spree::Carts::Update#resolve_address_id`), so the answer is 200 and the cart carries none of that address's values.
- **F1. A storefront action that reads one record** answers `null` when the Store API refuses (`withFallback`); **F2. one that changes a record** answers `{ success: false }` with the Store API's message (`actionResult`); **F3. one that takes a cart id as an argument but acts on the caller's own cart** (`requireCartId` reads the cart from the caller's cookie) answers for the caller's own cart, and the named cart stays as it was; **F4. a product page for a product Spree will not serve** shows the storefront's not-found page (`notFound()` in the product page). Shop part 2 saw that page answered with HTTP 200 and a bare "404" on the running storefront ([its §3.1](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md#31-what-the-interface-shows-each-visitor)), so the expected answer is 200, showing "404" and none of the product's values.

A **control** is the same request from a caller who may make it, in the same run, and must succeed with the status written for it. For a read, its answer must carry the values the refused answers are searched for. For a write, the read-back must see the change. Where no shopper may make a request (a draft product, a field hidden from the storefront), the row names what stands as the control.

**Corrections before the first recorded run.** A development trial may show an answer these rules did not predict. An expectation may then be corrected only between two refusals (for example 403 to 404) and only where Spree's or the storefront's code gives the reason, before the first recorded run, and the verification record lists each correction with that reason, as P7's §1.1 did. An answer that lets a caller read or change what it may not is never corrected into an expectation: it is a defect under the closing rule above.

##### Item 1: G-45 and G-50, the shop batch's endpoints through the storefront's own server code

Spree's Store API specs send these endpoints directly, so P10 sends them through the storefront, as a guest and as customer C, beside the shopper or state that may.

| # | Request through the storefront | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 1.1 | Open a draft product's page, `/us/en/products/<slug>` | Guest, customer C: the not-found page, carrying none of the product's name or price (F4) | The same page, by the guest, after the admin makes the product active and publishes it on the storefront's channel: 200, carrying its name | G-45 |
| 1.2 | Search the catalog for the run's term with the product list action (`getProducts`) | Guest, customer C: 200, a list that carries the run's active product and not its draft product | The same answer must carry the active product, which every shopper may see | G-45, G-50 |
| 1.3 | Open a product page whose product has a custom field hidden from the storefront | Guest, customer C: 200, carrying none of the hidden field's value | The same page must carry the product's custom field shown on the storefront | G-50 |
| 1.4 | Open a product page with the store's channel set to hide prices from guests | Guest: 200, carrying no price for the product | Customer C on the same page: 200, carrying the price, as Spree's storefront access specs give an authenticated customer. **Expected to fail on SD-9**, which is open: the storefront sends no customer token with product requests. A failing control fails the request, so G-50 stays open on it | G-50 |
| 1.5 | Open a product page with the store's channel set to require sign-in | Guest: the not-found page part 2 captured for this setting, carrying none of the product's values (F4) | Customer C on the same page: 200, carrying its name. **Expected to fail on SD-9**, as 1.4 | G-50 |
| 1.6 | Read guest A's cart through the cart action, naming A's cart id (`getCart`) | Guest B, customer C: `null` (F1, S1) | Guest A: A's cart, carrying A's item | G-45 |
| 1.7 | Switch currency on guest A's cart through the region switch's action, naming A's cart id (`updateCartMarket`) | Guest B: success for B's own cart, and A's cart unchanged (F3) | Guest A: A's cart in the new currency | G-45 |

Each storefront setting 1.4 and 1.5 change is put back after its row, and each uses a product of its own that no earlier request in the run has read, so the storefront's cached catalog answers cannot stand in for the server's.

##### Item 2: G-56, G-60 and G-83, with behaviours 11, 12 and 22 of G-84, the catalog's requests for its narrower roles

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 2.1 | Save a product: `PATCH /api/v3/admin/products/<id>` | Catalog viewer: 404 `record_not_found` (A2) | Merchandiser: 200, changed | G-56 |
| 2.2 | Create a product: `POST /api/v3/admin/products` | Catalog viewer, order manager: 403 `access_denied` `write_products` (A1) | Merchandiser: 201, created | G-56 |
| 2.3 | Save an option type: `PATCH /api/v3/admin/option_types/<id>` | Catalog viewer: 404 (A2) | Merchandiser: 200, changed | G-56 |
| 2.4 | Save a product type: `PATCH /api/v3/admin/product_types/<id>` | Catalog viewer: 404 (A2) | Admin: 200, changed. No template role holds `write_product_types` | G-56 |
| 2.5 | Save a category: `PATCH /api/v3/admin/categories/<id>` | Catalog viewer: 404 (A2) | Merchandiser: 200, changed | G-60 |
| 2.6 | Save a collection: `PATCH /api/v3/admin/collections/<id>` | Catalog viewer: 404 (A2) | Merchandiser: 200, changed | G-60 |
| 2.7 | Save a price list: `PATCH /api/v3/admin/price_lists/<id>` | Catalog viewer: 404 (A2) | Merchandiser: 200, changed | G-60 |
| 2.8 | Create a category: `POST /api/v3/admin/categories` | Order manager: 403 `write_categories` (A1) | Merchandiser: 201, created | G-60 |
| 2.9 | Create a collection: `POST /api/v3/admin/collections` | Order manager: 403 `write_collections` (A1) | Merchandiser: 201, created | G-60 |
| 2.10 | Create a price list: `POST /api/v3/admin/price_lists` | Order manager: 403 `write_products`, the key Spree gates price lists on (A1) | Merchandiser: 201, created | G-60 |
| 2.11 | Save a gift card from its sheet: `PATCH /api/v3/admin/gift_cards/<id>` | Loyalty viewer: 404 (A2) | Order manager: 200, changed | G-83, behaviour 22 |
| 2.12 | Delete a gift card from its row menu: `DELETE /api/v3/admin/gift_cards/<id>` | Loyalty viewer: 404 (A2) | Order manager: 204, deleted | G-83, behaviour 22 |
| 2.13 | Delete a promotion from its row menu: `DELETE /api/v3/admin/promotions/<id>` | Loyalty viewer: 404 (A2) | Marketer: 204, deleted | G-83, behaviour 22 |
| 2.14 | Create a promotion from the new promotion page: `POST /api/v3/admin/promotions` | Loyalty viewer, order manager, merchandiser: 403 `write_promotions` (A1) | Marketer: 201, created | G-83 |
| 2.15 | Issue, edit and delete a store credit: `POST`, `PATCH` and `DELETE` on `/api/v3/admin/customers/<id>/store_credits` | Loyalty viewer: 404 for each, because Spree looks the customer up among those the caller may change (A2) | Admin: 201, 200 and 204, each seen by the read-back. The screens hide these controls from the loyalty viewer (behaviour 22) | G-83, behaviour 22 |
| 2.16 | The rule pickers' reads: products by name and by saved ids, categories by name, customers by search and by saved ids, customer groups, channels, markets, option types with their values | Marketer: 403 naming `read_products`, `read_categories`, `read_customers` or `read_settings`, the key each needs (A1) | The teammate who holds that key (merchandiser, support, settings viewer, catalog viewer): 200, carrying the run's record | G-83, behaviour 11 |
| 2.17 | The loyalty lists: `GET /api/v3/admin/gift_cards` and `GET /api/v3/admin/store_credits`, as the screens send them | Marketer, merchandiser: 403 `read_gift_cards` or `read_store_credits` (A1) | Loyalty viewer: 200, carrying the run's card or credit | G-83 |
| 2.18 | The promotions list, and the new promotion page's rule and action types: `GET /api/v3/admin/promotions`, `GET …/promotion_rules/types`, `GET …/promotion_actions/types` | Order manager, merchandiser: 403 `read_promotions` (A1) | Loyalty viewer for the list, marketer for the types: 200 | G-83 |
| 2.19 | A promotion's page: `GET /api/v3/admin/promotions/<id>` | Order manager, merchandiser: 404 (A2) | Loyalty viewer: 200, carrying its name | G-83 |
| 2.20 | A promotion's rules and actions: `GET …/promotions/<id>/promotion_rules` and `…/promotion_actions` | Order manager, merchandiser, and the loyalty viewer, who may read promotions but not change them: 404, because Spree finds the promotion among those the caller may change (A2; part 3's B1) | Marketer: 200, carrying the rule or action | G-83, behaviour 12 |
| 2.21 | The channels list, as the loyalty screens send it: `GET /api/v3/admin/channels?page=1&limit=100` | Order manager, loyalty viewer: 403 `read_settings` (A1) | Settings viewer: 200, carrying the run's channel | G-83 |
| 2.22 | The sales query the promotion pages send: `POST /api/v3/admin/reporting/query` | Marketer, merchandiser: 403 `read_reports` (A1) | Admin: 200 | G-83 |
| 2.23 | The navigation's counters: `GET /api/v3/admin/dashboard/counters` | Marketer, loyalty viewer, order manager, merchandiser: 403 `read_dashboard` (A1) | Support: 200 | G-83 |

##### Item 3: G-70, batch 7's payment, tax, delivery and package type requests

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 3.1 | Save a payment method from its sheet: `PATCH /api/v3/admin/payment_methods/<id>` | Delivery settings viewer: 404 (A2) | Store settings: 200, changed | G-70 |
| 3.2 | Save a tax category: `PATCH /api/v3/admin/tax_categories/<id>` | Delivery settings viewer: 404 (A2) | Store settings: 200, changed | G-70 |
| 3.3 | Save a tax rate: `PATCH /api/v3/admin/tax_rates/<id>` | Delivery settings viewer: 404 (A2) | Store settings: 200, changed | G-70 |
| 3.4 | Save a delivery zone from its sheet: `PATCH /api/v3/admin/delivery_zones/<id>` | Delivery settings viewer, delivery methods editor: 404 (A2) | Store settings: 200, changed | G-70 |
| 3.5 | Add a delivery zone: `POST /api/v3/admin/delivery_zones` | Delivery methods editor: 403 `write_settings` (A1) | Store settings: 201, created | G-70 |
| 3.6 | Add an origin group to a profile: `POST /api/v3/admin/delivery_profiles/<id>/origin_groups` | Delivery methods editor: 403 `write_settings` (A3) | Store settings: 201, created | G-70 |
| 3.7 | Save a delivery method: `PATCH /api/v3/admin/delivery_methods/<id>` | Delivery settings viewer: 404 (A2) | Delivery methods editor: 200, changed | G-70 |
| 3.8 | Add a delivery method: `POST /api/v3/admin/delivery_methods` | Delivery settings viewer: 403 `write_delivery_methods` (A1) | Delivery methods editor: 201, created | G-70 |
| 3.9 | Save a package type from its sheet: `PATCH /api/v3/admin/package_types/<id>` | Delivery settings viewer: 404 (A2) | Delivery methods editor: 200, changed | G-70 |
| 3.10 | Add a package type: `POST /api/v3/admin/package_types` | Delivery settings viewer: 403 `write_package_types` (A1) | Delivery methods editor: 201, created | G-70 |

The editor's allowed writes to methods and package types, which batch 7 named beside its refused ones, are the controls of 3.7 to 3.10.

##### Item 4: G-79, batch 9's cart, checkout and order requests

Through the Store API, with each shopper's own publishable key, cart token and sign-in, then through the storefront's checkout actions.

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 4.1 | Read guest A's cart: `GET /api/v3/store/carts/<A>` | Guest B with B's own cart token, customer C: 403 `access_denied` (S1) | Guest A: 200, carrying A's email and item | G-79 |
| 4.2 | Change A's cart's email: `PATCH /api/v3/store/carts/<A>` | Guest B, customer C: 403 (S1) | Guest A: 200, changed | G-79 |
| 4.3 | Add an item to A's cart: `POST /api/v3/store/carts/<A>/items` | Guest B, customer C: 403 (S1) | Guest A: 201, the item added | G-79 |
| 4.4 | Change the quantity of A's item on A's cart: `PATCH /api/v3/store/carts/<A>/items/<line>` | Guest B, customer C: 403 (S1) | Guest A: 200, changed | G-79 |
| 4.5 | Change and remove A's item on B's own cart: `PATCH` and `DELETE /api/v3/store/carts/<B>/items/<A's line>` | Guest B: 404 `record_not_found` for each (S2), and A's item unchanged | Guest A on A's own cart: 200, changed | G-79 |
| 4.6 | Choose a delivery rate on A's cart: `PATCH /api/v3/store/carts/<A>/fulfillments/<id>` | Guest B, customer C: 403 (S1) | Guest A: 200, the rate chosen | G-79 |
| 4.7 | Apply a discount code to A's cart: `POST /api/v3/store/carts/<A>/discount_codes` | Guest B, customer C: 403 (S1) | Guest A: 200, the code applied | G-79 |
| 4.8 | Add a payment to A's cart: `POST /api/v3/store/carts/<A>/payments` | Guest B, customer C: 403 (S1) | Guest A: 201, the payment added | G-79 |
| 4.9 | Place A's order: `POST /api/v3/store/carts/<A>/complete` | Guest B, customer C: 403 (S1), and A's cart still a cart | Guest A: 200, the order placed | G-79 |
| 4.10 | Read A's placed order: `GET /api/v3/store/orders/<A>` | Guest B with B's own token, customer C: 404 `order_not_found` (S3) | Guest A with A's token: 200, carrying its number | G-79 |
| 4.11 | Name customer D's saved address as the shipping and billing address of another cart: `PATCH /api/v3/store/carts/<C>` | Customer C: 200, the cart carrying none of D's address values and its addresses unchanged (S4) | Customer D, naming the same address on D's own cart: 200, carrying it | G-79 |
| 4.12 | Read A's checkout through the checkout action, naming A's cart id (`getCheckoutOrder`) | Guest B, customer C: `null` (F1) | Guest A: A's cart | G-79 |
| 4.13 | Open A's checkout page, `/us/en/checkout/<A>` | Guest B, customer C: 200, carrying none of A's email, address or item | Guest A: 200, carrying them | G-79 |
| 4.14 | Change the addresses and apply a code through the checkout actions, naming A's cart id (`updateOrderAddresses`, `applyCode`) | Guest B: success for B's own cart, and A's cart unchanged (F3) | Guest A: A's cart changed | G-79 |
| 4.15 | Choose A's delivery rate, change and remove A's item, through the actions (`selectDeliveryRate`, `updateCartItem`, `removeCartItem`) | Guest B: `{ success: false }` with the Store API's message (F2, S2), and A's cart unchanged | Guest A: success, A's cart changed | G-79 |
| 4.16 | Name customer D's address through the checkout action (`updateOrderAddresses`) | Customer C: success for C's own cart, carrying none of D's address values (F3, S4) | Customer D: D's cart carrying it | G-79 |
| 4.17 | Read A's placed order through the order placed page's action (`getCompletedOrder`) | Guest B, customer C: `null` (F1) | Guest A: the order, carrying its number | G-79 |

##### Item 5: batch 6's requests for its narrower roles, under G-11

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 5.1 | Save a stock location from its sheet: `PATCH /api/v3/admin/stock_locations/<id>` | Stock viewer, purchaser: 404 (A2). Merchandiser: 403 `write_settings` (A4) | Store settings: 200, changed | G-11, batch 6 |
| 5.2 | Save a location's stock levels: `POST /api/v3/admin/stock_levels/bulk_upsert` | Stock viewer, purchaser: 403 `write_stock` (A1) | Merchandiser: 200, changed | G-11, batch 6 |
| 5.3 | Save a supplier from its sheet: `PATCH /api/v3/admin/suppliers/<id>` | Stock viewer: 404 (A2) | Purchaser: 200, changed | G-11, batch 6 |
| 5.4 | Receive a delivery on a transfer in transit: `POST /api/v3/admin/stock_transfers/<id>/stock_receipts` | Stock viewer, purchaser: 403 `write_stock` (A3) | Merchandiser: 201, received | G-11, batch 6 |
| 5.5 | Receive a delivery on an ordered purchase order: `POST /api/v3/admin/purchase_orders/<id>/stock_receipts` | Stock viewer: 403 `write_purchasing` (A3) | Purchaser: 201, received | G-11, batch 6 |
| 5.6 | Create a transfer from the new transfer page: `POST /api/v3/admin/stock_transfers` | Stock viewer, purchaser: 403 `write_stock` (A1) | Merchandiser: 201, created | G-11, batch 6 |
| 5.7 | Create a purchase order from the new purchase order page: `POST /api/v3/admin/purchase_orders` | Stock viewer, merchandiser: 403 `write_purchasing` (A1) | Purchaser: 201, created | G-11, batch 6 |
| 5.8 | List purchase orders and suppliers: `GET /api/v3/admin/purchase_orders`, `GET /api/v3/admin/suppliers` | Merchandiser, order manager: 403 `read_purchasing` (A1) | Stock viewer: 200, carrying the run's records | G-11, batch 6 |
| 5.9 | Export purchase orders: `POST /api/v3/admin/exports` with type `purchase_orders` | Merchandiser, order manager: 403 `read_purchasing`, the scope Spree's export gate reads from the type (A1) | Stock viewer: 201, the export created | G-11, batch 6 |
| 5.10 | The inventory lists: stock levels, locations, movements, reservations and transfers | Order manager: 403 `read_stock` (A1) | Stock viewer: 200, carrying the run's records | G-11, batch 6 |
| 5.11 | A transfer's and a purchase order's page: `GET …/stock_transfers/<id>`, `GET …/purchase_orders/<id>` | Order manager: 404 (A2) | Stock viewer: 200, carrying their numbers | G-11, batch 6 |

##### The stand-in checks, the runs and the record

- **The judge fails when it should (P7's criterion 6).** P7's stand-in cases run again, with cases added for each kind of answer P10 adds: a list that carries the protected record beside the allowed one, a page that shows a not-found text with the wrong status, an action that acts on the named cart instead of the caller's own, a setting not put back, and a control that fails as a defect would make it fail.
- **The runs (criterion 7).** One development trial on a freshly started server, whose answers are not evidence. Then two recorded runs in a row, each on a freshly started server and, for items 1 and 4, a storefront built afresh against it, at a recorded revision of the scripts, Spree's code and the storefront. Evidence is saved as JSON results with statuses, codes and the checks' outcomes only, and any run log as a `.txt` file, because the root `.gitignore` drops `*.log`. Local runs and CI are reported apart: these scripts are not part of any workflow, so CI's checks on the pull request cover the repository's own suites and the scripts' type check and lint, not these requests.
- **The record (criterion 10).** A verification record in `liquorify/verification/` gives the revisions and, for each request, its callers, the expected and actual answers, the control's result and the exposure and change checks, then each gap's result. Corrections made after the development trial are listed there with their reasons.

**What P10 does not send.** Reads and writes the source records do not name: the order manager's reads of batch 7's pages (B13), the catalog viewer's deletes and reorders from the row menus and drag handles parts 1 and 2 kept, a catalog's controls, and the seller panel. Requests across stores, which are tenant isolation and stay FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. Secret API keys and their scopes, which Spree's specs and P2 cover. Real payment providers, which stay P4's.

**How each gap closes.** Under the owner's delegation of 2026-11-04, as delegated acceptance, not the owner's review:

| Gap | Closes when | Stays open when |
|---|---|---|
| G-45 | Rows 1.1, 1.2, 1.6 and 1.7 pass in both recorded runs | Any of them fails |
| G-50 | Rows 1.2 to 1.5 pass in both recorded runs | Any of them fails. Rows 1.4 and 1.5 are expected to fail on SD-9 until it is fixed, so G-50 is expected to stay open, linked to SD-9 |
| G-56 | Rows 2.1 to 2.4 pass | Any of them fails |
| G-60 | Rows 2.5 to 2.10 pass | Any of them fails |
| G-83 | Rows 2.11 to 2.23 pass. Behaviours 11, 12 and 22 of G-84 are met by rows 2.16, 2.20, and 2.11 to 2.13 with 2.15 | Any of them fails. G-84 itself stays with P9 for its other 19 behaviours |
| G-70 | Rows 3.1 to 3.10 pass | Any of them fails |
| G-79 | Rows 4.1 to 4.17 pass | Any of them fails |
| G-11 | Every row of items 1 to 5 passes, so every gap above closes and batch 6's requests pass. P7's staff, shopper account, search and settings requests were accepted on 2026-10-27 | Any row fails, or any gap above stays open. With SD-9 open, G-11 is expected to stay open through G-50 |

A refused caller answered with a success, or with an answer that carries the protected record's values, is recorded in LIQ-004 as a defect with its severity, brought to the owner as a security finding, and keeps its gap and G-11 open. A control that fails keeps its row failing, and the record names the defect or cause. No result is described as passing that did not pass in both recorded runs. Closing any of these gaps claims nothing about tenant isolation.

### P11: browser tests for inventory, orders and what happens after the sale

Batch 6 (#64) and both parts of batch 8 (#80, #84) captured these actions on Spree's running dashboard, and Spree's specs cover the server's side, but no browser test drives them. P9 had finished by the time they were recorded. On 2026-11-09 the owner added this bounded follow-up for them (G-87, G-90 and G-92; item 3 of the owner's answers, [record](../verification/2026-11-09-owner-decision-brief-answers-4.md)). The owner asked for every outstanding action to be listed with its dependencies, expected results and closure conditions, for known-defect failures to be kept, and for real-provider work to stay with P4. P11 adds those tests in Liquorify's own scripts, as P6, P8 and P9 did, and changes no Spree code, test or workflow. Its scope is the 48 actions below and nothing more: 47 run in P11, and one, buying a return label, stays with P4. It may run in parts, one for each gap.

**What every action depends on.**

- Batch 6 (#64) and batch 8's parts 1 and 2 (#80, #84), all merged.
- Spree's browser-test server at a recorded revision, with Spree's test payment gateway and its built-in rate providers, as batches 6 and 8 used. Each test adds the records it starts from, through the dashboard or the Admin API, named with the run's stamp, and puts back any shared setting it changes.
- No test key and no carrier account. What needs either stays with P4.
- Action 3.15 runs in the storefront's repository, against the pinned Liquorify backend its browser tests use (FB-06), at a revision that includes batch 8's part 2, as P9's item 1.5 did.
- An action with a dependency of its own names it in its row.

**How each test is written.** As P9's were: driven through the dashboard as the admin, asserting what the screen shows and, after a reload, what was saved. The expected results below say what should happen. How each test reaches its starting state is recorded in P11's verification record.

**1. G-87, batch 6, inventory** ([batch 6's record §2.3](../verification/2026-11-04-fb-19-batch-inventory.md#23-behaviours-no-browser-test-drives-criterion-15)):

| # | Action | Expected result | Its own dependency or known defect |
|---|---|---|---|
| 1.1 | Receiving a transfer, then opening the inventory list (FL-14's last step) | After a reload, the list shows the stock moved: the source location's count down and the destination's up by the quantity received | A transfer the test creates and sends |
| 1.2 | Receiving a purchase order's delivery, then opening the inventory list (FL-15's last step) | After a reload, the receiving location's count for each line is up by the quantity received | A purchase order the test creates and places |
| 1.3 | Correcting a row's on-hand count and its backorder setting in a location's stock levels panel, then saving | After a reload, the panel shows the saved count and setting, and the inventory list shows the new count | — |
| 1.4 | Searching the stock levels panel | Only matching rows are listed; a search with no match shows the panel's empty state; clearing the search lists every row again | — |
| 1.5 | Opening a location's stock history after a stock change there | The history lists that movement with its quantity | A stock change the test makes |
| 1.6 | Importing a purchase order file through the wizard opened from the list, to the end | The wizard finishes, and after a reload the file's purchase orders are listed with their lines | A file the test writes in the format the wizard asks for |
| 1.7 | Exporting purchase orders | The dashboard downloads the file when it is ready, "Export downloaded", and the file holds the exported purchase orders. The email link sent when an export takes a while is SD-17's and is not part of this action | — |
| 1.8 | Opening the row menu of a supplier with purchasing history | Edit is offered and Delete is not | A purchase order that names the supplier |
| 1.9 | Saving a supplier with a name already used in the store | Refused, with Spree's message shown where the merchant can read it, and no second supplier is saved | The message is a toast drawn beneath the open sheet today, so nothing shows (batch 6's B5): criterion 4's held behaviour |
| 1.10 | Receiving more than was sent on a transfer, and more than was ordered on a purchase order | After a reload, each shows its over-received status | — |
| 1.11 | The purchase order list's Overdue and Past cancel-by filters, and its columns menu | Overdue lists only the late purchase orders; Past cancel-by lists only those past their cancel-by date; the columns menu offers Cancel by, Overdue and Past cancel-by | **SD-23**: the test fails until it is fixed, and the failing result is kept |
| 1.12 | Taking a transfer back to draft, and a placed purchase order back to draft before anything arrives | After a reload, each shows Draft and can be edited again | — |

**2. G-90, batch 8's part 1, orders and their money** ([part 1's record §2.3](../verification/2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md#23-behaviours-no-browser-test-drives-criterion-15)):

| # | Action | Expected result | Its own dependency or known defect |
|---|---|---|---|
| 2.1 | Completing a draft from its page | After a reload, the order shows as placed, with its number, and is no longer in the draft list | — |
| 2.2 | Canceling a placed order with a reason, a note, a refund and the email choice | After a reload, the order shows canceled with the reason and the note, the refund is recorded against its payment, and the email choice is kept as made. Whether the email is delivered stays with G-16 and G-77 | A cancellation reason the test adds |
| 2.3 | Approving a risky order | After a reload, the risk warning is gone and the order shows approved | An order Spree itself marks risky. The record says how the test makes one; if no path does without changing Spree's code, the action is NOT_RUN with that reason, and G-90 stays open for it |
| 2.4 | Capturing an authorized payment, and voiding another | After a reload, the captured payment shows completed and the order's payment status follows it, and the voided payment shows void | Spree's test gateway |
| 2.5 | Adding a payment on the order page, and choosing a method that needs a saved card | After a reload, the new payment is listed with its amount. With no customer, or a customer with no saved card, the dialog says so and adds nothing | A card saved through a real provider stays with P4 |
| 2.6 | Adding a manual discount by amount and by percent, then deleting one | Each discount is listed and the order's total falls by it; deleting one removes it and restores the total; both after a reload | The Summary card's rows count discounts and added tax twice (**SD-34**): a test that reads those rows fails on it until it is fixed, and the failing result is kept |
| 2.7 | Adding a fee, then deleting it | As 2.6, with the total rising by the fee | As 2.6 |
| 2.8 | Applying a discount code, removing it, and entering a code that is refused | The promotion's discount is listed and the total falls; removing it restores the total; a refused code shows Spree's reason and changes nothing | A promotion with a code the test adds. SD-34 as 2.6 |
| 2.9 | Applying a gift card, removing it, and entering a card that is refused | The card lowers the amount due and its balance falls by what it covers; removing it restores both; a refused card is not applied, and the dialog says why | The dialog says nothing for a refused card today (part 1's B10): criterion 4's held behaviour |
| 2.10 | Applying store credit | After a reload, the credit lowers the amount due and the customer's balance falls by it | A customer with a credit balance, on an order with no gift card (part 1's B20) |
| 2.11 | Editing the special instructions and the internal note | After a reload, each shows the new text | — |
| 2.12 | Editing the billing address from the customer card | After a reload, the card shows the new billing address, and the shipping address is unchanged | — |
| 2.13 | Editing the purchase order number and document on a placed order | After a reload, both show the new values | — |
| 2.14 | Resetting and resending a digital order's download links | After a reset, the links' download counts start again; the resend is accepted and the screen says so. Whether the email is delivered stays with G-16 | A digital product with a file, as part 1's digital delivery check used |
| 2.15 | The header's Resend Confirmation and Preview Order | Resend is accepted and the screen says so; Preview opens the order as the customer sees it. Whether the email is delivered stays with G-16 and G-77 | — |
| 2.16 | Editing a placed order's items: changing a quantity, removing a line and adding a product, with the totals preview | Before saving, the preview shows the new totals; after saving and a reload, the order shows the changed lines and totals | — |
| 2.17 | Setting a quantity below what has shipped | The save is refused with a message that says why, and the line keeps its quantity | Only the browser's own field check stops it today (part 1's B13): criterion 4's held behaviour |
| 2.18 | The orders list's payment status, channel and tags filters, and its export | Each filter lists only matching orders, and clearing it lists them all; the dashboard downloads the export's file when it is ready | Orders the test tags and places on a second channel |
| 2.19 | The new order page with a customer who has default addresses, a company, a coupon code and the channel picker | The customer's addresses fill in, and after the draft is saved and reloaded it keeps the company, the coupon and the channel | A customer, company, promotion and channel the test adds |
| 2.20 | Leaving the edit page by a link inside the dashboard with unsaved item edits | The dashboard warns before leaving, and the edits are not saved | No warning is shown today (part 1's B14): criterion 4's held behaviour |
| 2.21 | Sending a payment link from a draft | The link is sent, and it opens checkout for the order | **SD-32**, accepted by the owner on 2026-11-10 as a High defect with its fix deferred (row 39 of the owner decision brief); this action is kept failing. If the owner makes it a defect, the test fails on it and the failing result is kept. If the owner records paying by link as not offered, this action leaves P11 with that record |

**3. G-92, batch 8's part 2, fulfilment and what happens after the sale** ([part 2's record §2.3](../verification/2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2.md#23-behaviours-no-browser-test-drives-criterion-15)):

| # | Action | Expected result | Its own dependency or known defect |
|---|---|---|---|
| 3.1 | Fulfilling a fulfilment, first every unit and then some units, with a tracking number, a carrier and the notify switch | After a reload, the fulfilment shows shipped with its tracking number and carrier, the units fulfilled match what was chosen, and the location's stock falls by them | — |
| 3.2 | Adding a fulfilment for units no fulfilment holds, after one is canceled | Add fulfillment is offered for those units, and after a reload the new fulfilment holds them | **SD-36**: Add fulfillment is never offered. The test fails until it is fixed, and the failing result is kept |
| 3.3 | Adding, editing and removing tracking, before and after the parcel ships | After a reload, each change shows | — |
| 3.4 | Marking a fulfilment delivered, and one of its consignments delivered | After a reload, the fulfilment, or that consignment, shows delivered; with another consignment still travelling, the fulfilment stays fulfilled | — |
| 3.5 | Editing a fulfilment's origin and delivery method, with Move and re-quote | After a reload, the fulfilment shows the new origin and method, and its delivery cost is quoted again by Spree's built-in rate providers | Rates from a real carrier stay with P4. A fulfilment moved to Store Pickup keeps its shipping menu and the order reads Overcharged today (part 2's B20): criterion 4's held behaviour |
| 3.6 | Splitting a fulfilment, and a split that would empty it | After a reload, a second fulfilment holds the units moved; a split that would empty the fulfilment is refused and changes nothing | A split to another location gives the new fulfilment its own delivery cost, and the order then reads Partially Paid (part 2's B13): criterion 4's held behaviour |
| 3.7 | Canceling a fulfilment | After a reload, it shows canceled, its stock is released, and its units are offered to a new fulfilment | **SD-36** for the units offered again, as 3.2 |
| 3.8 | Deleting an uploaded label | After a reload, the label is gone | A label the test uploads; uploading one has its test |
| 3.9 | Printing the packing slip | The slip lists the fulfilment's items with their pictures and quantities, and the ship-to address | Each picture is an empty frame today (part 2's B11): criterion 4's held behaviour |
| 3.10 | A return: choosing its location, receiving part of it, receiving it as not resellable, refunding to the original payment with its tax, completing a return owed nothing, and canceling one | After each step and a reload, the return shows its status; a partial receipt counts only what arrived; a not resellable receipt adds no stock; the refund to the original payment, with its share of tax, is recorded against that payment; a return owed nothing completes with no refund; a canceled return shows canceled | Spree's test gateway for the refund |
| 3.11 | Buying a return label | Stays with **P4**: buying needs a carrier account. P11 does not test it | P4 |
| 3.12 | An exchange opened, approved, received and its replacement shipped, with a balance due, and another exchange canceled | After each step and a reload, the exchange shows its status; the replacement ships in its own parcel; a dearer replacement's difference is put on the order to collect, and the confirmation says so before it ships; the cancel confirmation names an exchange, and the canceled exchange shows canceled | **SD-37**: the cancel confirmation asks "Cancel this return?", so that check fails until it is fixed, and the failing result is kept |
| 3.13 | A claim approved and resolved by refund, by store credit and by replacement, and another claim canceled | After a reload, each resolution is recorded: the refund against the payment, the credit on the customer's balance, and the replacement shipped; the claim's card shows what the resolution paid; the cancel confirmation names a claim | **SD-35**, the card showing the amount claimed, and **SD-37**, the confirmation naming a return: those checks fail until they are fixed, and the failing results are kept |
| 3.14 | The returns list's search and status filter, and the exchanges and claims lists' search | Each lists only matching records, and clearing lists them all | — |
| 3.15 | FL-06's shipment on the shopper's order page (SF-ACC-06), as the signed-in customer | After the fulfilment ships, the order page shows its status and tracking, and Track Items leads to the carrier with the tracking number | In the storefront's repository, against the pinned backend. Track Items does not carry the number today (part 2's B29): criterion 4's held behaviour |

P11 is complete when all of these hold:

1. **One browser test for each action** above, apart from 3.11, which stays with P4.
2. **The tests fail when they should.** Each test is shown to fail when what it asserts does not happen, such as a save that is refused or a change that is not kept.
3. **A recorded run.** The tests run against Spree's browser-test server at a recorded revision, in the pinned Playwright image, twice in a row; 3.15 against the storefront's pinned backend, as P9's part 5 did.
4. **A failure is kept, never hidden.** A test that fails because Spree does not do what it should is recorded in LIQ-004 as a defect, with a number from the defect register and its failing result kept. It is not fixed in Spree's code, and the test is not weakened to pass. The failures named above on SD-23, SD-34, SD-35, SD-36 and SD-37, and on SD-32 if the owner makes it a defect, are expected and kept. A failure on a behaviour a batch recorded that the owner has not made a defect (batch 6's B5, B10, B13 and B14 of batch 8's part 1, B11, B13, B20 and B29 of its part 2, or one the run finds) is held for the owner's answer, as SD-26 and SD-27 were, and its gap stays open for that action until the owner answers.
5. **A record.** A verification record gives the revisions, each test's result and its evidence, and says which results fail and on which defect or held behaviour. Evidence logs are saved with a `.txt` name, because the root `.gitignore` drops `*.log`.
6. **Nothing else claimed.** What the server refuses to narrower roles stays with G-11 and P12. Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. P11 verifies no real provider: a card saved or charged through a provider, a label bought or refunded, a carrier's rates and statuses, and shipping documents stay with P4. Whether an email is delivered stays with G-16 and G-77.
7. **Closing.** Under the owner's delegation, as delegated acceptance, not the owner's review:

| Gap | Closes when | Stays open when |
|---|---|---|
| G-87 | Every action 1.1 to 1.12 has a test that passes in both recorded runs, or fails only on SD-23 (1.11) or on another defect recorded under criterion 4 | A test fails for any other reason, or on a held behaviour the owner has not answered |
| G-90 | Every action 2.1 to 2.21 has a test that passes in both recorded runs, or fails only on SD-34 or on another defect recorded under criterion 4. Action 2.21 follows the owner's answer to row 39 | As G-87; also while row 39 is unanswered, and while 2.3 is NOT_RUN |
| G-92 | Actions 3.1 to 3.10 and 3.12 to 3.15 pass, or fail only on SD-35, SD-36, SD-37 or another defect recorded under criterion 4. Action 3.11 then joins P4's checks, and G-92 stays open for it alone, DEFERRED to P4 | As G-87 |

Until a gap closes, the functional verification it names stays open, and no capability it touches is described as passing for it.

**Part 1, 2026-11-10.** G-87's 12 actions ran twice in a row at `69bb4eef` ([record](../verification/2026-11-10-fb-19-platform-p11-part-1.md)). Ten pass. 1.11 fails only on SD-23; its Past cancel-by check passes, which corrects part of SD-23's description. 1.9 fails only on batch 6's B5, which the baseline audit numbered SD-57, held for the owner's answer with proposed severity Low. G-87 stays OPEN until the owner answers SD-57.

**Part 2, 2026-11-10.** G-90's actions ran twice in a row at `759e1832` ([record](../verification/2026-11-10-fb-19-platform-p11-part-2.md)). Thirteen pass. 2.8 fails only on SD-34. 2.21 fails on SD-32, held for row 39. 2.9, 2.17 and 2.20 fail on part 1's B10, B13 and B14, held under criterion 4. 2.15 fails because Preview Order opens nothing, and 2.19 because the new order's company is shown nowhere on the order page; the baseline audit numbered them SD-58 and SD-59, held for the owner's answer with proposed severity Low, and SD-59 may still be decided an observation. 2.3 is NOT_RUN: Spree marks an order risky only from a payment's failed or risky checks, and no such payment can be made without changing Spree's code. G-90 stays OPEN.

**Part 3, 2026-11-10.** G-92's actions ran twice in a row at `f467aeb6`, and 3.15 twice in the storefront at `6ca5e70`, against its pinned backend moved to `e7fd2953` so that it includes batch 8's part 2 ([record](../verification/2026-11-10-fb-19-platform-p11-part-3.md)). Ten pass, 3.15 among them (the record first said nine). 3.2 and 3.7 fail only on SD-36. 3.13 fails only on SD-35 and SD-37. 3.12 fails on SD-37 and because a replacement for part of a line, stocked at more than one location, is refused as out of stock; the baseline audit numbered it SD-71, held for the owner's answer with proposed severity Medium. Part 2's B11 and B29 did not reproduce, and B13 and B20 were not exercised. 3.11 stays with P4. G-92 stays OPEN.

**The owner's answers, 2026-11-10** ([record](../verification/2026-11-10-fb-19-platform-p11-owner-decisions.md)). SD-57, SD-58 and SD-59 were accepted as Low existing defects and SD-71 as Medium. SD-32 was accepted as a High defect, an incomplete payment-link capability, with FL-08's payment steps kept failing or unavailable. Part 1's B10 and B13 were recorded as SD-82 and SD-83, Low, and B14 as SD-84, Medium. Every failing test is kept and no failing capability becomes PASS. G-87 is CLOSED under its closing rule. G-90 stays open for 2.3 alone and G-92 for 3.11 alone, both DEFERRED to P4. The replacement held after a refund stays an observation until a bounded check separates a refund and a replacement for the same item from a refund on one claim and a replacement on another ([part 3's record §4.4](../verification/2026-11-10-fb-19-platform-p11-part-3.md#44-the-bounded-check-for-the-held-replacement)); it runs in its own pull request. It ran twice on 2026-11-10 ([§4.5](../verification/2026-11-10-fb-19-platform-p11-part-3.md#45-what-the-bounded-check-found)): every replacement after a refund on the same order is held, whether for the same item or another, while the control ships, so the hold does not tell the two cases apart. It stays an observation for the owner. P11's own runs are done; its two remaining actions are P4's.

### P12: the order refusals, a follow-up to P10

P10 ran on 2026-11-05 and did not send batch 8's requests: part 1 recorded its own as G-91 in #80 the same day, and part 2 its own as G-95 in #84 on 2026-11-08. On 2026-11-09 the owner linked G-95 to G-11 through this named follow-up to the completed P10 work, and asked that G-91's outstanding requests be included here, without implying that P10 tested them (item 4 of the owner's answers, [record](../verification/2026-11-09-owner-decision-brief-answers-4.md)). P10's record and its results are unchanged and claim nothing about these requests. P12 sends, within one store, as a caller who may not make it, each request no Spree spec sends for:

1. **G-91, batch 8's part 1, orders and their money** ([part 1's record §3.2](../verification/2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-1.md#32-what-the-server-refuses)): support's and the packer's edits of an order, its notes, addresses, discounts, fees, payments, codes, gift cards and items; their creating a draft and canceling an order; their reads of the order's payments; the order manager's read of the store's cancellation reasons; and the merchandiser's reads of the order lists and of an order. Part 1's B1, B3, B4 and B5 are where its screens offer these.
2. **G-95, batch 8's part 2, fulfilment and what happens after the sale** ([part 2's record §3.2](../verification/2026-11-05-fb-19-batch-orders-returns-and-fulfilment-part-2.md#32-what-the-server-refuses)): support's fulfilment, tracking, delivery and label writes; support's and the packer's opening of returns, exchanges and claims; the packer's approving and canceling a return; and the merchandiser's reads of an order and of the returns, exchanges and claims lists. Part 2's B1, B4 and B5 are where its screens offer these.

**What it depends on.** The merges of #80 and #84, both done. P10's judge (`one-store.ts`) and callers (`staff.ts`), with the support, packer, order manager and merchandiser roles batch 8 used. Its own pull request, before Liquorify changes identity or access.

**Recorded before implementation.** Before any of P12's scripts is written, its checks are recorded in this work item as P10's were: each request, its refused callers and the answer each must get, written from Spree's code by P10's rules A1 to A4, the allowed control beside it, and its gap. An expectation may be corrected only as P10 allowed, between two refusals, before the first recorded run, with the reason in the record.

P12 is complete when P7's criteria 2 to 10 hold for these requests, as P10 sets out. Like P10, it claims nothing about tenant isolation, which stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open, and nothing about requests or roles it did not send.

**Closing.** Under the owner's delegation, as delegated acceptance, not the owner's review. G-91 and G-95 each close only on P12's passing evidence for every request they name, in both recorded runs. A refused caller answered with a success, or with an answer that carries the protected record's values, is recorded as a defect with its severity, brought to the owner as a security finding, and keeps its gap and G-11 open. A control that fails, such as an over-refusal like SD-28 to SD-30, keeps its row failing and is recorded as a defect. G-11 closes only when G-91 and G-95 have closed and everything else it holds has closed too.

#### P12's checks, recorded before implementation

Recorded on 2026-11-09, before any of P12's scripts was written: the requests, who sends them, the answer each must get, the control beside it, and how each gap closes. The expected answers are written from Spree's code as on `main` at `05b7c95b` and from the source records named in items 1 and 2 (part 1's and part 2's §3.1 and §3.2). Nothing here has been sent yet, and none of it was sent by P10.

**How the checks run.** As P10's Admin API checks did: Liquorify's own scripts in `packages/liquorify-storybook/fidelity/`, with P7's judge (`one-store.ts`), against Spree's browser-test server started freshly with its own fixtures (`stack.spec.ts`). Every request stays in the default store. No storefront is needed: every request is the dashboard's, sent to the Admin API. Each run adds its own records through the Admin API, as the admin: a product with two variants held in stock at the default location, a customer with an address, a gift card, a discount code, a cancellation reason, the cheque payment methods batch 8 used, and the orders below, each marked with the run's stamp. The browser-test fixtures carry no sample catalog, so the run does not use batch 8's sample products. Spree's code, tests and workflows are not changed.

**The callers.** The teammates `staff.ts` already adds, each holding one role, with the permission keys `/me` reports recorded beside each answer:

| Caller | Role's keys, as created | Used in |
|---|---|---|
| Support | `read_orders`, `read_customers`, `read_dashboard` | Refused in items 1 and 2; control for the merchandiser's reads |
| Packer | `read_orders`, `write_fulfillments` | Refused in item 1 and in item 2's returns, exchanges and claims |
| Merchandiser | `write_products`, `write_categories`, `write_collections`, `write_stock` | Refused in both items' reads |
| Order manager | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | Refused the cancellation reasons; control for most writes |
| Settings viewer | `read_settings` | Control for the cancellation reasons |
| Admin | Every key | Control where no template role may make the request (rows 1.10 and 2.1) |

**How each expected answer is written.** By P10's rules A1 to A4, with two more that P10's development trial and Spree's order controllers give:

- **A5. An endpoint that registers its record lookup again** (`before_action :set_resource` declared in the controller itself) runs the key gate before the lookup, so a caller without the key is refused with 403 `access_denied` naming it, not 404. This is P10's correction to its row 5.11. It applies to an order (`OrdersController`), a payment, a fulfilment, a consignment (delivery), a label, a return, an exchange and a claim.
- **A6. A record nested in an order whose controller does not register its lookup again** (an item, a discount, a fee) is found within the order, which Spree finds among the store's orders whatever the caller's role (`Orders::BaseController#set_parent`). The change is then refused by the record's own authorization, 403 `access_denied`, naming `write_orders`, because the error handler names the key the caller lacks (`ErrorHandler#access_denied_details`).

Two gates are not the ones the screens suggest, and the rows follow the code. Consignments and labels hang off a fulfilment, but their controllers do not declare a key of their own, so they inherit the order's (`scoped_resource :orders`) and are refused naming `write_orders`, not `write_fulfillments`. A payment's method is found among the payment methods the caller may read, which are settings, and a new fulfilment's stock location among the stock locations the caller may read, which are stock; the order manager holds neither, so rows 1.10 and 2.1 use the admin as the control and keep the order manager's answer as an observation, not a case.

A **control** is the same request from a caller who may make it, in the same run, and must succeed with the status written for it. For a read, its answer must carry the values the refused answers are searched for. For a write, the read-back, by the admin, must see the change, and after every refused write it must find the record as it was.

**Corrections before the first recorded run.** As P10's rule: an expectation may be corrected only between two refusals, only where Spree's code gives the reason, and only before the first recorded run, and the verification record lists each correction. An answer that lets a caller read or change what it may not is never corrected into an expectation.

**The run's orders.** Placed orders are paid by the cheque method that charges at checkout unless a row says otherwise. Order A: placed, not shipped. Draft D: two items, a manual discount and a fee. Draft G: one item, for the gift card. Orders E1 and E2: placed with the cheque method that leaves the payment to capture, so each holds an authorized payment. Order B: placed, for the cancellation. Orders F1, F2, F5 and F6: placed, not shipped. Order F3: placed, with its only fulfilment canceled, so its units wait for a new one. Order F4: placed and shipped. Order R: placed and shipped, with three of the first variant and two of the second. Order R2: placed and shipped, with a requested return, a second requested return, an exchange and a claim opened by the admin.

##### Item 1: G-91, batch 8's part 1, orders and their money

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 1.1 | Save an order's contact email from the edit page: `PATCH /api/v3/admin/orders/<A>` | Support, packer: 403 `access_denied` `write_orders` (A5) | Order manager: 200, changed | G-91 |
| 1.2 | Save an order's notes from the notes' pencils: `PATCH /api/v3/admin/orders/<A>` with the customer and internal notes | Support, packer: 403 `write_orders` (A5) | Order manager: 200, changed | G-91 |
| 1.3 | Save an order's shipping and billing address from the customer card's menu: `PATCH /api/v3/admin/orders/<A>` | Support, packer: 403 `write_orders` (A5) | Order manager: 200, changed | G-91 |
| 1.4 | Add a discount: `POST /api/v3/admin/orders/<D>/discounts` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, added | G-91 |
| 1.5 | Change a discount: `PATCH …/orders/<D>/discounts/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 200, changed | G-91 |
| 1.6 | Remove a discount: `DELETE …/orders/<D>/discounts/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 204, removed | G-91 |
| 1.7 | Add a fee: `POST …/orders/<D>/fees` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, added | G-91 |
| 1.8 | Change a fee: `PATCH …/orders/<D>/fees/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 200, changed | G-91 |
| 1.9 | Remove a fee: `DELETE …/orders/<D>/fees/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 204, removed | G-91 |
| 1.10 | Add a payment from the payments card: `POST …/orders/<D>/payments` | Support, packer: 403 `write_payments` (A1) | Admin: 201, added. The order manager's answer is kept as an observation (see above) | G-91 |
| 1.11 | Capture an authorized payment: `PATCH …/orders/<E1>/payments/<id>/capture` | Support, packer: 403 `write_payments` (A5) | Order manager: 200, captured | G-91 |
| 1.12 | Void an authorized payment: `PATCH …/orders/<E2>/payments/<id>/void` | Support, packer: 403 `write_payments` (A5) | Order manager: 200, voided | G-91 |
| 1.13 | Apply a discount code from the sidebar: `POST …/orders/<D>/discount_codes` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, applied | G-91 |
| 1.14 | Remove a discount code: `DELETE …/orders/<D>/discount_codes/<code>` | Support, packer: 403 `write_orders` (A1: the code controller looks up no record) | Order manager: 200, removed | G-91 |
| 1.15 | Apply a gift card from the sidebar: `POST …/orders/<G>/gift_cards` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, applied | G-91 |
| 1.16 | Remove the gift card: `DELETE …/orders/<G>/gift_cards/<id>` | Support, packer: 403 `write_orders` (A1, as 1.14) | Order manager: 204, removed | G-91 |
| 1.17 | Add an item from the edit page: `POST …/orders/<D>/items` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, added | G-91 |
| 1.18 | Change an item's quantity: `PATCH …/orders/<D>/items/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 200, changed | G-91 |
| 1.19 | Remove an item: `DELETE …/orders/<D>/items/<id>` | Support, packer: 403 `write_orders` (A6) | Order manager: 204, removed | G-91 |
| 1.20 | Create a draft from the new order page: `POST /api/v3/admin/orders` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, created | G-91 |
| 1.21 | Cancel a placed order: `PATCH …/orders/<B>/cancel` | Support, packer: 403 `write_orders` (A5) | Order manager: 200, canceled | G-91 |
| 1.22 | Read an order's payments: `GET …/orders/<A>/payments` | Support, packer: 403 `read_payments` (A1) | Order manager: 200, carrying the payment's id | G-91 |
| 1.23 | Read one payment: `GET …/orders/<A>/payments/<id>` | Support, packer: 403 `read_payments` (A5) | Order manager: 200, carrying the payment's id | G-91 |
| 1.24 | Read the store's cancellation reasons for the cancel dialog: `GET /api/v3/admin/order_cancellation_reasons` | Order manager: 403 `read_settings` (A1) | Settings viewer: 200, carrying the run's reason | G-91 |
| 1.25 | Read the order list: `GET /api/v3/admin/orders` | Merchandiser: 403 `read_orders` (A1) | Support: 200, carrying order A's number | G-91 |
| 1.26 | Read the draft list: `GET /api/v3/admin/orders?incomplete=1` | Merchandiser: 403 `read_orders` (A1) | Support: 200, carrying draft D's number | G-91 |
| 1.27 | Read an order: `GET /api/v3/admin/orders/<A>` | Merchandiser: 403 `read_orders` (A5) | Support: 200, carrying order A's number and email | G-91 |

##### Item 2: G-95, batch 8's part 2, fulfilment and what happens after the sale

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| 2.1 | Create a fulfilment for waiting units: `POST …/orders/<F3>/fulfillments` | Support: 403 `write_fulfillments` (A1) | Admin: 201, created. The order manager's answer is kept as an observation (see above) | G-95 |
| 2.2 | Save a fulfilment's tracking from its Edit: `PATCH …/orders/<F1>/fulfillments/<id>` | Support: 403 `write_fulfillments` (A5) | Order manager: 200, changed | G-95 |
| 2.3 | Split a fulfilment: `PATCH …/fulfillments/<id>/split` | Support: 403 `write_fulfillments` (A5) | Order manager: 200, split | G-95 |
| 2.4 | Mark a fulfilment as fulfilled: `PATCH …/fulfillments/<id>/fulfill` | Support: 403 `write_fulfillments` (A5) | Order manager: 200, shipped | G-95 |
| 2.5 | Cancel a fulfilment: `PATCH …/orders/<F2>/fulfillments/<id>/cancel` | Support: 403 `write_fulfillments` (A5) | Order manager: 200, canceled | G-95 |
| 2.6 | Mark a shipped fulfilment as delivered: `PATCH …/orders/<F4>/fulfillments/<id>/mark_delivered` | Support: 403 `write_fulfillments` (A5) | Order manager: 200, delivered | G-95 |
| 2.7 | Add tracking (a consignment): `POST …/orders/<F5>/fulfillments/<id>/deliveries` | Support: 403 `write_orders` (A1, the order's key) | Order manager: 201, added | G-95 |
| 2.8 | Edit a consignment: `PATCH …/deliveries/<id>` | Support: 403 `write_orders` (A5) | Order manager: 200, changed | G-95 |
| 2.9 | Mark a consignment arrived: `PATCH …/deliveries/<id>/mark_delivered` | Support: 403 `write_orders` (A5) | Order manager: 200, arrived | G-95 |
| 2.10 | Delete a consignment: `DELETE …/deliveries/<id>` | Support: 403 `write_orders` (A5) | Order manager: 204, deleted | G-95 |
| 2.11 | Upload a label bought elsewhere: `POST …/orders/<F6>/fulfillments/<id>/labels` with a file the admin uploaded | Support: 403 `write_orders` (A1, the order's key) | Order manager: 201, recorded | G-95 |
| 2.12 | Delete an uploaded label: `DELETE …/labels/<id>` | Support: 403 `write_orders` (A5) | Order manager: 204, deleted | G-95 |
| 2.13 | Open a return: `POST …/orders/<R>/returns` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, opened | G-95 |
| 2.14 | Open an exchange: `POST …/orders/<R>/exchanges` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, opened | G-95 |
| 2.15 | Open a claim: `POST …/orders/<R>/claims` | Support, packer: 403 `write_orders` (A1) | Order manager: 201, opened | G-95 |
| 2.16 | Approve a requested return: `PATCH …/orders/<R2>/returns/<id>/approve` | Packer: 403 `write_orders` (A5) | Order manager: 200, approved | G-95 |
| 2.17 | Cancel a requested return: `PATCH …/orders/<R2>/returns/<id>/cancel` | Packer: 403 `write_orders` (A5) | Order manager: 200, canceled | G-95 |
| 2.18 | Read an order: `GET /api/v3/admin/orders/<R2>` | Merchandiser: 403 `read_orders` (A5) | Support: 200, carrying R2's number | G-95 |
| 2.19 | Read the returns list: `GET /api/v3/admin/returns` | Merchandiser: 403 `read_orders` (A1) | Support: 200, carrying R2's return | G-95 |
| 2.20 | Read the exchanges list: `GET /api/v3/admin/exchanges` | Merchandiser: 403 `read_orders` (A1) | Support: 200, carrying R2's exchange | G-95 |
| 2.21 | Read the claims list: `GET /api/v3/admin/claims` | Merchandiser: 403 `read_orders` (A1) | Support: 200, carrying R2's claim | G-95 |

Buying a return label and refunding a label call a provider, and stay with P4; P12 does not send them.

**Observations, not cases.** Beside the cases, the run sends a few requests whose answers it records without judging them, as P10 did, and brings any refusal of a role the screens map as allowed to the owner without classifying it: the order manager adding a payment (row 1.10) and creating a fulfilment (row 2.1), and the packer marking a fulfilment as fulfilled and adding tracking, which part 2's §3.1 shows as the packer's controls. Spree's code suggests the packer is refused both, because a fulfilment's writes need a change to the order and consignments the order's key.

##### The stand-in checks, the runs and the record

- **The judge fails when it should (P7's criterion 6).** P7's and P10's stand-in cases run again (`one-store-checks.spec.ts`). P12 adds no new kind of answer, so it adds no stand-in case.
- **The runs (criterion 7).** One development trial on a freshly started server, whose answers are not evidence. Then two recorded runs in a row, each on a freshly started server, at a recorded revision of the scripts and Spree's code. Evidence is saved as JSON results with statuses, codes and the checks' outcomes only, and any run log as a `.txt` file. These scripts are not part of any workflow, so CI's checks on the pull request cover the repository's own suites and the scripts' type check and lint, not these requests.
- **The record (criterion 10).** A verification record in `liquorify/verification/` gives the revisions and, for each request, its callers, the expected and actual answers, the control's result and the exposure and change checks, then each gap's result. Corrections made after the development trial are listed there with their reasons.

**What P12 does not send.** Requests across stores, which are tenant isolation and stay FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. Secret API keys and their scopes, which Spree's specs and P2 cover. Real payment and carrier providers, which stay P4's. The seller panel. Writes the source records do not name for these roles, such as refunds, store credit on an order, and receiving or refunding a return.

**How each gap closes.** Under the owner's delegation of 2026-11-04, as delegated acceptance, not the owner's review:

| Gap | Closes when | Stays open when |
|---|---|---|
| G-91 | Rows 1.1 to 1.27 pass in both recorded runs | Any of them fails |
| G-95 | Rows 2.1 to 2.21 pass in both recorded runs | Any of them fails |
| G-11 | G-91 and G-95 have closed, and everything else it holds has closed. P10 left G-50, G-70 and its own inventory controls open | Any of those stays open. G-11 is expected to stay open after P12 |

A refused caller answered with a success, or with an answer that carries the protected record's values, is recorded in LIQ-004 as a defect with its severity, brought to the owner as a security finding, and keeps its gap and G-11 open. A control that fails keeps its row failing, and the record names the defect or cause. No result is described as passing that did not pass in both recorded runs. Closing either gap claims nothing about tenant isolation.

### P13: customer verification, a follow-up to batch 10

Batch 10 (#94) captured the customer screens on Spree's running dashboard. It recorded 14 behaviours that no browser test drives (G-97), and the requests the narrower roles could make that no Spree spec sends (G-99). On 2026-11-10 the owner added this bounded follow-up for both ([record](../verification/2026-11-10-owner-answers-batch-10.md)). Its browser tests (part A) and its refusal checks (part B) are separate, with separate evidence. P11 and P12 keep the scopes they already have. P13 adds nothing to them, and they add nothing to it.

**What it depends on.**

- Batch 10 (#94), merged.
- Spree's browser-test server at a recorded revision, as batch 10 used. Each test and check adds the records it starts from, through the dashboard or the Admin API, named with the run's stamp. It puts back any shared setting it changes. Every request stays in the default store, and nothing opens another store's customers.
- No real provider and no mail service. Whether an email is delivered stays with G-16 and G-77.
- Its own pull request, in two parts if need be. Part B runs before Liquorify changes identity or access, as P10 and P12 do.

#### Part A: browser tests for G-97

**How each test is written.** As P9's and P11's were: driven through the dashboard as the admin, asserting what the screen shows and, after a reload, what was saved. The expected results below say what should happen. How each test reaches its starting state is recorded in P13's verification record. The behaviours are those in [batch 10's record §2.3](../verification/2026-11-09-fb-19-batch-customers.md#23-behaviours-no-browser-test-drives-criterion-15).

| # | Behaviour | Expected result | Its own dependency or known defect |
|---|---|---|---|
| A.1 | Exporting a customer's data from the privacy card | The dashboard downloads a file for the customer. The file holds the sections Spree's export gathers: the profile, addresses, orders, store credit, gift cards and consent records. The customer's data requests then list a completed access request | A customer with an order, an address and a store credit, added by the test. The file is checked in the test and never committed. The internal note in the file is batch 10's B7, which is recorded and not a failure |
| A.2 | Editing an address and deleting another | After a reload, the edited address shows its new street and city, and the deleted address is gone. An address used by a completed order is kept for that order, as Spree's specs require | — |
| A.3 | Setting a default billing address, then a default shipping address, from the row menu | After a reload, the chosen address carries the default it was given, and the other default stays where it was | **SD-45**: the other default is cleared today. The test fails until it is fixed, and the failing result is kept |
| A.4 | Adding, editing and deleting a tax registration, including a refused number and a kind typed in | Each change shows on the card after a reload. A number that fails its kind's format is refused, and the sheet says what is wrong with it. A kind typed in stays in its field and is saved as typed | **SD-44** (the typed kind empties its field) and **SD-46** (the refusal says only "is invalid"): the tests that read those fail until they are fixed, and the failing results are kept. Checking a number with a registry needs a registered validator, which the browser-test server does not have, so the check action is NOT_RUN with that reason, and G-97 stays open for it alone |
| A.5 | Editing the internal note, and clearing it | After a reload, the card shows the new text, and then its empty state | — |
| A.6 | Deleting an unused store credit from the customer's page, and trying to delete a used one | The unused credit is gone after a reload. The used credit is refused with Spree's message, shown where the merchant can read it, and stays listed | A used credit: one the test applies to an order |
| A.7 | Removing customers from a group, and removing a tag, in bulk from the list | After a reload, the selected customers are no longer in the group and no longer carry the tag. Customers not selected keep theirs | — |
| A.8 | Filtering the list by group, by company, by tags and by erased customers | Each filter lists only matching customers, and clearing it lists them all again. Erased customers appear only with their filter on | A company with a member customer, added by the test |
| A.9 | Importing a customer file through the wizard, to the end | The wizard finishes and reports its rows. After a reload, the file's customers are listed with their addresses. A row the wizard refuses is reported with its reason | A file the test writes in the format the wizard asks for |
| A.10 | Exporting the customer list | The dashboard downloads the file when it is ready, and the file holds the store's customers. The email link sent when an export takes a while is SD-17's and is not part of this test | — |
| A.11 | Saving a profile with an email another customer has, and creating a customer with that email | Each is refused, with "Email has already been taken" under the email field, and nothing is saved | — |
| A.12 | The orders card's View all link | It opens the order list filtered to the customer, listing only that customer's orders | A customer with more orders than the card shows |
| A.13 | The JSON drawer on a customer's page | It opens and shows the customer's record, with its prefixed id and email | — |
| A.14 | Filling a customer field on a customer's page | After a reload, the card shows the saved value | A customer field defined by the test |

#### Part B: refusal checks for G-99

P13 sends, within one store, as a caller who may not, the requests batch 10's narrower roles could make or were shown the controls for ([batch 10's record §3.1](../verification/2026-11-09-fb-19-batch-customers.md#31-what-the-interface-shows-each-role) and [§3.2](../verification/2026-11-09-fb-19-batch-customers.md#32-what-the-server-refuses), B1 to B4, B6, B9 and B10), each beside a control that may. Like P10 and P12, it uses P10's judge (`one-store.ts`) and the callers in `staff.ts`, and it claims nothing about tenant isolation.

**Recorded before implementation.** The checks below were recorded on 2026-11-10, before any of P13's scripts was written, from Spree's code at `05b7c95b`, which is the same at `44be970f`. An expectation may be corrected only as P10 allows: between two refusals, before the first recorded run, where Spree's code gives the reason, with the reason in the record. An answer that lets a caller read or change what it may not is never corrected into an expectation.

**The callers.** As batch 10 created them:

| Caller | Role's keys, as created |
|---|---|
| Order manager | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` |
| Support | `read_orders`, `read_customers`, `read_dashboard` |
| Customer manager | `write_customers` |
| Merchandiser | `write_products`, `write_categories`, `write_collections`, `write_stock` |
| Admin | Every key |

A write key also grants its read key (`Spree.permissions.expand_keys`), so the order manager holds `read_orders`, `read_payments`, `read_store_credits` and `read_gift_cards`, and the customer manager holds `read_customers`.

**How each expected answer is written.** By P10's rules A1 and A2, with two points from the customers' own controllers:

- **C1. A change to one customer, by a role without `write_customers`:** 403 `access_denied` naming `write_customers`. The customers controller declares its record lookup again, which puts it after the key gate (`CustomersController`, `before_action :set_resource`), so the key gate answers first. Batch 10 saw this answer for support's group save (B10).
- **C2. A write nested under a customer the role may only read:** 404 `record_not_found`. The nested controllers find the customer among those the caller may change before the key gate runs (`Customers::BaseController#set_parent`), as Spree's own specs expect for store credits.
- **C3. The customer's export:** a read of the customer, then a check of `read_orders`, `read_payments`, `read_store_credits` and `read_gift_cards`. A role missing one is refused with 403 `access_denied` naming the first missing key (`EXPORT_PERMISSIONS`).

A **control** is the same request from a caller who may make it, in the same run. It must succeed with the status written for it. For a read, its answer must carry the values the refused answers are searched for. For a write, the read-back must see the change.

| # | Request | Refused callers and expected answer | Control | Gap |
|---|---|---|---|---|
| B.1 | Save a customer's profile, groups or internal note: `PATCH /api/v3/admin/customers/<id>` | Order manager, support: 403 `access_denied` `write_customers` (C1) | Customer manager: 200, changed | G-99 |
| B.2 | Create a customer: `POST /api/v3/admin/customers` | Order manager, support: 403 `access_denied` `write_customers` (A1) | Customer manager: 201, created | G-99 |
| B.3 | Delete a customer with no orders: `DELETE /api/v3/admin/customers/<id>` | Order manager, support: 403 `access_denied` `write_customers` (C1) | Customer manager: 204, and the customer is gone | G-99 |
| B.4 | Erase a customer: `POST /api/v3/admin/customers/<id>/anonymize` | Order manager, support: 403 `access_denied` `write_customers` (C1) | Customer manager: 200, and the customer reads as erased | G-99 |
| B.5 | Export a customer's data: `GET /api/v3/admin/customers/<id>/export` | Support: 403 `access_denied` `read_payments`. Customer manager: 403 `access_denied` `read_orders` (C3) | Order manager, who holds every key the export asks for: 200, carrying the customer's email. Admin: 200, the same | G-99 |
| B.6 | Add, change and delete an address: `POST`, `PATCH` and `DELETE /api/v3/admin/customers/<id>/addresses[/<address_id>]` | Order manager, support: 404 `record_not_found` (C2) | Customer manager: 201, 200 and 204, each seen on read-back | G-99 |
| B.7 | Issue store credit: `POST /api/v3/admin/customers/<id>/store_credits` | Order manager, support: 404 `record_not_found` (C2) | Admin: 201, and the credit is listed | G-99 |
| B.8 | Add customers to a group, and remove them, in bulk: `POST /api/v3/admin/customers/bulk_add_to_groups` and `bulk_remove_from_groups` | Order manager, support: 403 `access_denied` `write_customers` (A1) | Customer manager: 200, and the membership changed | G-99 |
| B.9 | Add a tag and remove it, in bulk: `POST /api/v3/admin/customers/bulk_add_tags` and `bulk_remove_tags` | Order manager, support: 403 `access_denied` `write_customers` (A1) | Customer manager: 200, and the tags changed | G-99 |
| B.10 | Read a customer's store credit: `GET /api/v3/admin/customers/<id>/store_credits` | Customer manager: 403 `access_denied` `read_store_credits`. It may read the customer, so the lookup finds it, and the key gate answers for the store credit scope (`scoped_resource :store_credits`) | Order manager: 200, carrying the credit's amount | G-99 |
| B.11 | Read a customer's orders: `GET /api/v3/admin/orders` filtered to the customer, and `GET /api/v3/admin/customers/<id>?expand=orders` | Customer manager: the list is 403 `access_denied` `read_orders` (A1); the customer is 200 and carries none of the orders' numbers, because the expansion is dropped for a caller without `read_orders` | Order manager: 200 for both, carrying the orders' numbers | G-99 |
| B.12 | Read the customer list, a customer and the groups list: `GET /api/v3/admin/customers`, `/customers/<id>` and `/customer_groups` | Merchandiser: 403 `access_denied` `read_customers` for each (A1, C1) | Support: 200 for each, carrying the run's customer's email and group's name | G-99 |

**Closing.** Under the owner's delegation, as delegated acceptance, not the owner's review:

1. **One browser test for each behaviour** A.1 to A.14, apart from A.4's registry check while no validator is registered, each shown to fail when what it asserts does not happen.
2. **Every check B.1 to B.12** sent with its control, as P7's criteria 2 to 10 set out: the refusals written before the run, nothing exposed, nothing changed, the checks shown to fail against a stand-in server, and results read from the evidence.
3. **Two recorded runs** in a row, in the pinned Playwright image, on freshly started servers.
4. **A failure is kept, never hidden.** A test that fails because Spree does not do what it should is recorded in LIQ-004 as a defect, with a number from the defect register, and its failing result is kept. It is not fixed in Spree's code, and the test is not weakened to pass. The failures named above on SD-44, SD-45 and SD-46 are expected and kept. A refused caller answered with a success, or with an answer that carries the protected record's values, is recorded as a defect with its severity, brought to the owner as a security finding, and keeps G-99 and G-11 open. A control that fails keeps its row failing and is recorded as a defect.
5. **A record.** A verification record gives the revisions, each test's and check's result and evidence, and which results fail and on which defect. Evidence logs are saved with a `.txt` name.
6. **Nothing else claimed.** Tenant isolation stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. P13 claims nothing about requests or roles it did not send, nor about a real provider or email delivery.

| Gap | Closes when | Stays open when |
|---|---|---|
| G-97 | Every behaviour A.1 to A.14 has a test that passes in both recorded runs, or fails only on SD-44, SD-45, SD-46 or another defect recorded under criterion 4. A.4's registry check then stays open alone, until a validator is registered on the server the tests use | A test fails for any other reason, or on a held behaviour the owner has not answered |
| G-99 | Every check B.1 to B.12 passes in both recorded runs, with its control | Any refusal or control fails |

G-11 closes only when G-99 has closed with the other gaps linked to it. Until a gap closes, the functional verification it names stays open, and no capability it touches is described as passing for it.

### P14: the marketplace refusals, a follow-up to P10

P10 and P12 did not send the marketplace's requests. Batch 13's part 1 (#98) recorded them as G-106: what the server refuses to the narrower seller roles beyond Spree's own specs, such as the seller viewer's refusals beyond the balances, the order manager's refusals on the commission and transfer endpoints, and a store settings role on the seller endpoints ([part 1's record §3.2](../verification/2026-11-10-fb-19-batch-marketplace-part-1.md#32-what-the-server-refuses)). On 2026-11-10 the owner linked G-106 to G-11 through a named authorization follow-up, with the exact refusals and the successful controls recorded first ([record §14](../verification/2026-11-10-fb-19-batch-marketplace-part-2.md#14-the-owners-answers-of-2026-11-10)). P14 is that follow-up. P10's and P12's records are unchanged and claim nothing about these requests.

P14 sends, within one store, as a caller who may not make it, each request no Spree spec sends for the operator's narrower roles on the seller, onboarding, commission, ledger, order group and product review endpoints. It does not send the Seller API's requests. Part 2's Seller API specs send every endpoint as a member of the seller named in the request, and as a member of another seller (§3.2 of [part 2's record](../verification/2026-11-10-fb-19-batch-marketplace-part-2.md#32-what-the-server-refuses)). What a suspended seller's team may do stays with G-107, not here.

**What it depends on.** The merges of #98 and #101, both done. P10's judge (`one-store.ts`) and callers (`staff.ts`), with the roles part 1 used. Its own pull request, before Liquorify changes identity or access.

P14 is complete when P7's criteria 2 to 10 hold for these requests, as P10 sets out. Like P10, it claims nothing about tenant isolation, which stays FB-03's validation, NOT_RUN, with ISO-1 to ISO-7 open. It also claims nothing about requests or roles it did not send.

**Closing.** Under the owner's delegation, as delegated acceptance, not the owner's review:

- G-106 closes only on P14's passing evidence for every request below, in both recorded runs.
- A refused caller answered with a success, or with an answer that carries the protected record's values, is recorded as a defect with its severity. It is brought to the owner as a security finding, and it keeps G-106 and G-11 open.
- A control that fails keeps its row failing and is recorded as a defect, or is linked to the defect that is already open. Row 14.8's control is expected to fail on SD-70.
- G-11 closes only when G-106 has closed and everything else it holds has closed too.

#### P14's checks, recorded before implementation

Recorded on 2026-11-10, before any of P14's scripts was written: the requests, who sends them, the answer each must get, the control beside it, and how the gap closes. The expected answers are written from Spree's code as on `main` at `e1092bc7`, and from part 1's §3.1 and §3.2. Nothing here has been sent yet.

**How the checks run.** As P12's did:

- Liquorify's own scripts in `packages/liquorify-storybook/fidelity/`, with P7's judge (`one-store.ts`), against Spree's browser-test server, started freshly with its own fixtures (`stack.spec.ts`).
- Every request stays in the default store, and every request is the dashboard's, sent to the Admin API.
- Each run adds its own records through the Admin API, as the admin, each marked with the run's stamp:
  - one seller ready for review, one approved seller and one seller not yet admitted;
  - a requirement with a submission waiting for a decision;
  - a commission rate;
  - a product the approved seller has proposed;
  - for the approved seller, on the `manual` interval, a balance from an order that the run places and fulfils, which also gives a seller transfer, an order group and a commission line.
- A record that a control changes is made again before the next caller sends the request.
- Spree's code, tests and workflows are not changed.

**The callers.** Teammates `staff.ts` adds, each holding one role, with the permission keys `/me` reports recorded beside each answer. The custom roles are the ones part 1 made, with the keys it recorded. A `write_` key also grants the `read_` key of the same scope.

| Caller | Role's keys, as created | Used in |
|---|---|---|
| Seller manager (custom) | `write_sellers`, `read_products`, `read_orders` | Refused the commission and ledger requests; control for the seller writes |
| Seller viewer (custom) | `read_sellers`, `read_commissions`, `read_payouts` | Refused every write; control for the reads |
| Payouts clerk (custom) | `read_sellers`, `write_payouts` | Refused the seller and commission writes; control for the payout writes |
| Commission manager (custom) | `read_sellers`, `write_commissions` | Refused the seller and ledger writes; control for the commission writes |
| Merchandiser (template) | `write_products`, `write_categories`, `write_collections`, `write_stock` | Refused the seller reads; control for the product review |
| Order manager (template) | `write_orders`, `write_payments`, `write_fulfillments`, `write_refunds`, `write_gift_cards`, `write_store_credits`, `read_customers` | Refused the seller, commission and ledger reads; control for the order groups |
| Store settings (custom) | `write_settings` | Refused the seller and order group reads |
| Admin | Every key | Run setup only |

**How each expected answer is written.** By P10's rules A1 and A2 and P12's rule A5:

- **A1.** A list, a create or a collection action is refused before the action runs.
- **A2.** Reading or changing one record is refused as not found where Spree looks the record up before the key gate.
- **A5.** Where the controller registers its own lookup, or finds the record inside the action, the key gate runs first.

These marketplace controllers fall under the rules as follows:

- `SellersController` registers its lookup again for every member action, so A5 applies to them all.
- The seller's nested balances, payouts, team and invitations find the seller in a lookup that runs after the key gate.
- The acceptance link counts no action as a read, so it needs `write_sellers`.
- A payout's `complete` and a product's `approve` and `reject` find the record inside the action, after the key gate.
- Commission rates use the base lookup, so A2 applies to their changes.

Every 403 is `access_denied`, with the missing key named in `details.required_permission`.

A **control** is the same request from a caller who may make it, in the same run, and it must succeed with the status written for it. For a read, its answer must carry the run's record. For a write, the read-back must see the change.

**Corrections before the first recorded run.** As P10 allows:

- An expected answer may be corrected only between two refusals, and only where Spree's code gives the reason.
- Every correction is made before the first recorded run, and the record lists it with that reason.
- An answer that lets a caller read or change what it may not is never turned into an expected answer.

| # | Request | Refused callers and expected answer | Control |
|---|---|---|---|
| 14.1 | List sellers: `GET /api/v3/admin/sellers` | Store settings, order manager, merchandiser: 403 `read_sellers` (A1) | Seller viewer: 200, listing the run's sellers |
| 14.2 | Read a seller: `GET /api/v3/admin/sellers/<id>` | Store settings, order manager: 403 `read_sellers` (A5) | Seller viewer: 200, carrying the seller's name |
| 14.3 | Save a seller's contact email: `PATCH /api/v3/admin/sellers/<id>` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` (A5) | Seller manager: 200, changed |
| 14.4 | Approve the seller ready for review: `PATCH …/sellers/<id>/approve` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` (A5) | Seller manager: 200, the seller approved |
| 14.5 | Suspend the approved seller: `PATCH …/sellers/<id>/suspend` with a reason | As 14.4 | Seller manager: 200, the seller suspended |
| 14.6 | Reject the seller not yet admitted: `PATCH …/sellers/<id>/reject` with a reason | As 14.4 | Seller manager: 200, the seller rejected |
| 14.7 | Send the seller ready for review back: `PATCH …/sellers/<id>/reopen_onboarding` with a note | As 14.4 | Seller manager: 200, back in onboarding |
| 14.8 | Read a seller's onboarding: `GET …/sellers/<id>/onboarding` | Store settings, order manager: 403 `read_sellers` (A5) | Seller manager: 200, carrying the checklist. The seller viewer is a second control, expected by Spree's code to get 200, and **expected to fail on SD-70**, which part 1 saw refused with 403. A failing control fails the row |
| 14.9 | Invite a team member: `POST …/sellers/<id>/invite` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` (A5) | Seller manager: 201, an invitation pending |
| 14.10 | List a seller's team and invitations: `GET …/sellers/<id>/team`, `GET …/sellers/<id>/invitations` | Store settings, order manager: 403 `read_sellers` | Seller viewer: 200, listing the run's invitation |
| 14.11 | Read an invitation's acceptance link: `GET …/sellers/<id>/invitations/<id>/acceptance_link` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` | Seller manager: 200, carrying a link |
| 14.12 | Read a seller's balances: `GET …/sellers/<id>/balances` | Seller manager, commission manager: 403 `read_payouts` | Seller viewer: 200, carrying the run's balance |
| 14.13 | Settle the seller by hand: `POST …/sellers/<id>/payouts` | Seller viewer, seller manager, commission manager: 403 `write_payouts` | Payouts clerk: 201, a payout for the balance |
| 14.14 | List the requirements: `GET /api/v3/admin/seller_requirements` | Store settings, order manager: 403 `read_sellers` (A1) | Seller viewer: 200, listing the run's requirement |
| 14.15 | Add a requirement: `POST /api/v3/admin/seller_requirements` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` (A1) | Seller manager: 201, created |
| 14.16 | Accept a submission: `PATCH …/sellers/<id>/requirement_submissions/<id>/accept` | Seller viewer, payouts clerk, commission manager: 403 `write_sellers` (A5) | Seller manager: 200, accepted |
| 14.17 | List commission rates: `GET /api/v3/admin/commission_rates` | Seller manager, order manager, store settings: 403 `read_commissions` (A1) | Seller viewer: 200, listing the run's rate |
| 14.18 | Add a commission rate: `POST /api/v3/admin/commission_rates` | Seller viewer, payouts clerk, seller manager: 403 `write_commissions` (A1) | Commission manager: 201, created |
| 14.19 | Change a commission rate: `PATCH /api/v3/admin/commission_rates/<id>` | Seller viewer, payouts clerk: 404 `record_not_found` (A2). Seller manager: 404 (A2) | Commission manager: 200, changed |
| 14.20 | List commission lines: `GET /api/v3/admin/commission_lines` | Order manager, seller manager: 403 `read_commissions` (A1) | Seller viewer: 200, listing the run's line |
| 14.21 | List seller transfers: `GET /api/v3/admin/seller_transfers` | Order manager, seller manager, commission manager: 403 `read_payouts` (A1) | Seller viewer: 200, listing the run's transfer |
| 14.22 | List seller payouts: `GET /api/v3/admin/seller_payouts` | As 14.21 | Seller viewer: 200, listing 14.13's payout |
| 14.23 | Mark a payout paid: `PATCH /api/v3/admin/seller_payouts/<id>/complete` with a reference | Seller viewer, commission manager, seller manager: 403 `write_payouts` | Payouts clerk: 200, the payout completed |
| 14.24 | List order groups: `GET /api/v3/admin/order_groups` | Store settings, merchandiser: 403 `read_orders` (A1) | Order manager: 200, listing the run's order group |
| 14.25 | Approve the seller's proposed product: `PATCH /api/v3/admin/products/<id>/approve` | Seller manager, order manager, seller viewer: 403 `write_products` | Merchandiser: 200, the product approved |
| 14.26 | Send a proposed product back: `PATCH /api/v3/admin/products/<id>/reject` with a reason | As 14.25 | Merchandiser: 200, the product sent back with the reason |

Each refused answer is also searched for the protected record's values: the seller's name and email, the rate's value, the balance's amount, the invitation's link and the payout's reference. Every refused write is read back as the admin to show that nothing changed.

## 6. Acceptance criteria

1. Every capability in §2 has a row in the batch record with its coverage and its functional verification apart.
2. Each check that runs records its revision, its script or command and its result: PASS, FAIL, PARTIAL, BLOCKED or NOT_RUN.
3. Spree's own tests are cited by CI run, job and example count, and are never counted as end-to-end verification.
4. Nothing leaves the test environment: no update check to Spree, no live payment and no label purchase. Sandbox calls use only test keys the owner provides, which are never printed or committed.
5. Spree's code, Spree's tests and the workflows are unchanged.
6. Every gap names what would close it. A gap the batch defers has the owner's explicit acceptance in [LIQ-004's gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance).
7. Tenant isolation is NOT_RUN, linked to FB-03 and the open findings ISO-1 to ISO-7.
8. The owner accepts the batch record.

## 7. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session runs the checks.
- **Risk.** Standard: records and evidence scripts only. A new CI step or credential would be Protected and needs the owner first.
- **Release impact.** None. It changes no application code.
