---
title: FB-19 batch, the platform capabilities without screens
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-22
updated: 2026-10-25
---

# FB-19 batch: the platform capabilities without screens

The batch that checks what Spree offers without a screen of its own: the Store, Admin and Seller APIs, the developer kits, webhooks and events, dashboard plugins, providers, the command line tool and project scaffolding, tracing, the agent server and the hosted dashboards. It adds no stories and no Figma frames. It links each capability to its evidence, and keeps what exists apart from what was shown to work.

**Status.** PROPOSED. On 2026-10-22 the owner added this batch, and the completion criterion that ties every capability to its evidence ([LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete), criteria 8 and 9). The owner asked for the coverage to be inventoried early and the checks to be scheduled around their dependencies. The inventory in §3 is done. Step P1 in §5 has run: the [mail check](../verification/2026-10-22-fb-19-platform-p1-mail.md) and the [API, kit, record, hosting and tracing checks](../verification/2026-10-22-fb-19-platform-p1-checks.md). The owner merged it with #13 and storefront #19 and accepted it on 2026-10-23. The same day the owner closed G-03, G-04, G-05 and G-15 on the mail check's evidence and kept G-16 pending ([merge record](../verification/2026-10-23-fb-19-platform-p1-merge.md)). On 2026-10-23 the owner also deferred G-22, from part 2 of the staff access batch, to a new step, P6 (§5). After part 2's merge the same day, P3 ([record](../verification/2026-10-23-fb-19-platform-p3.md)) and P6 ([record](../verification/2026-10-23-fb-19-platform-p6.md)) ran in #15. The owner accepted P6 and closed G-22 the same day. The owner asked for corrections to P3 before accepting it; they were made and P3 ran again, and the owner accepted the corrected record the same day, recording CAP-11-07 as PASS within its limits and closing G-09. P2 waited for batch 2's acceptance, and the owner assigned it the approval on the authorization page that no browser test drives. The owner accepted batch 2 and merged it on 2026-10-25 ([merge record](../verification/2026-10-25-fb-19-batch-developer-settings-merge.md)), and P2 started the same day, with its completion criteria in §5. P2 ran the same day in #17 and every check passed twice in a row ([record](../verification/2026-10-25-fb-19-platform-p2.md)). The owner asked for four checks to be made strict; they were, and passed twice more. The owner accepted P2 the same day within its documented limits, closing G-29, G-30 and G-31, keeping G-32, and keeping G-16 for the email configuration alone ([record §9](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)). P4 and P5 have not run. Nothing here changes Spree's code, Spree's tests or a workflow.

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

Left out: CAP-11-12, multi-store administration, which has screens (dashboard shell part 2 and batch 3), and the Enterprise and documentation-only features (LIQ-006 §12).

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
| CAP-04-06 Keys, OAuth, origins | Mapped | PARTIAL for G-32 alone: P2's checks passed, and the owner accepted them on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)) | Create a key and an OAuth application on the settings screens, then use each from outside | P2 |
| CAP-04-07 Agent server | Mapped | PARTIAL for G-32 alone: P2's check passed, on the agent server gem's own test app, and the owner accepted it on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)) | Connect an agent to the running server through an OAuth authorization | P2 |
| CAP-04-08 Webhooks and events | Mapped. The storefront's receiver: no test | PARTIAL for G-32 and the providers' inbound webhooks: P2's checks, the storefront's receiver among them, passed, and the owner accepted them on 2026-10-25 ([record](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)). The payment and payout providers' inbound webhooks stay with P4 | Deliver an event to a local receiver and to the storefront's receiver, with a test delivery and automatic disabling | P2 |
| CAP-11-07 Plugins | Mapped. The plugin example: no test | PASS since 2026-10-23 for the demonstrated frontend plugin mechanism, when the owner accepted P3; before it, PARTIAL on unit tests and a type-checked scaffold. P3 loaded the plugin example into a running dashboard, through the dashboard's own switch rather than the starter, and captured each of its entries, and ran again with the checks the owner's review corrected ([record](../verification/2026-10-23-fb-19-platform-p3.md)). It supports the frontend plugin mechanism and generic slot rendering; the starter's integration, slot entries on staff screens and the example's brand backend, which does not exist, are not verified | Load the plugin example into the dashboard starter and capture its route and slot entries on running screens | P3 |
| CAP-11-08 Hosted dashboards | Mapped | PASS, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23: the dashboard and the seller panel are served at `/dashboard` and `/sellers` and signed in to, on the hosting gem's own test app | — | P1 |
| CAP-11-09 Provider contracts | Mapped | PARTIAL: Spree's specs only | Each provider through its area batch's running screens (batches 4, 7 and 8) | P4 |
| CAP-07-02 Stripe | Mapped | BLOCKED for sandbox calls: no test keys | A payment and a saved card through Stripe's sandbox | P4 |
| CAP-07-07 EasyPost | Mapped | BLOCKED for sandbox calls: no test key | A rate and a label from EasyPost's test mode | P4 |
| CAP-05-14 Meilisearch | Mapped | PARTIAL: Spree's specs against a real Meilisearch service | Search on the running storefront with Meilisearch, in batch 4 | P4 |
| CAP-11-10 Tracing | Mapped | PASS for a request's trace reaching a local collector, on the tracing gem's own test app, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23, and for webhook deliveries, with their job runs and outgoing requests, since the owner accepted [P2](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25) on 2026-10-25 | The layers not seen: mail, extension hooks and gateway calls | P1; webhooks in P2 |
| CAP-11-11 Command line and scaffolding | Mapped | PARTIAL: unit tests and a type-checked scaffold | Create a project and start it with the tool, where Docker is available | P5 |
| CAP-11-13 Update check | Mapped | NOT_RUN on purpose: it would send data to Spree | FB-09's decision; then a run against a stand-in server, never Spree's | — |
| CAP-03-03 Store provisioning | Mapped | PARTIAL: Spree's specs and the first-run setup browser test | Batch 3's first-run setup flow | Batch 3 |
| CAP-03-12 External references | Mapped | PASS through the Admin kit on the running server, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23 | — | P1 |
| CAP-05-11 Price history | Mapped | PASS for single price changes on the running server, accepted with [P1](../verification/2026-10-22-fb-19-platform-p1-checks.md) on 2026-10-23. A bulk change leaves the prior price correct | Whether bulk changes are recorded | P1 |
| CAP-05-16 Slugs | Mapped | PARTIAL: Spree's specs only | Open a product, a category and a store by slug on the running storefront, in batch 4 | Batch 4 |

All 17 are mapped. After P1, which the owner accepted on 2026-10-23, four have a PASS: hosted dashboards, tracing, external references and price history, the last for single price changes. CAP-11-06 is PARTIAL.

## 5. When each check runs

The inventory came first, as the owner asked. Each check runs once what it needs exists, so most of the batch runs alongside the area batches rather than at the end.

| Step | Checks | Depends on |
|---|---|---|
| P1 | Regenerate the API reference and compare it with the committed files; call the Admin and Seller kits' read endpoints against the running browser-test server; serve the hosted dashboard; export traces to a local collector; external references and price history through the Admin API. Also find out whether the browser-test server can deliver mail where a script can read it, without changing Spree's code, which would close the email gaps in the staff and account batches | Nothing new. It can run now. Run on 2026-10-22: the [mail check](../verification/2026-10-22-fb-19-platform-p1-mail.md) and the [other checks](../verification/2026-10-22-fb-19-platform-p1-checks.md). Merged with #13 and storefront #19, and accepted, on 2026-10-23 ([merge record](../verification/2026-10-23-fb-19-platform-p1-merge.md)) |
| P2 | Webhook deliveries, API keys, OAuth applications and the agent server, set up on their settings screens and used from outside. It includes a browser test that approves an application's request on the authorization page (DA-SET-32), which the owner assigned to P2 on 2026-10-23, because Spree's browser tests make that approval through the API | The owner's acceptance of batch 2, developer and integration settings, as the owner answered on 2026-10-23; in its own pull request. The owner accepted batch 2 and merged #16 on 2026-10-25, and P2 started the same day. Its completion criteria are below. It ran the same day in #17, every check passing ([record](../verification/2026-10-25-fb-19-platform-p2.md)), and again after the owner's corrections. The owner accepted it the same day ([record §9](../verification/2026-10-25-fb-19-platform-p2.md#9-the-owners-answer-2026-10-25)) |
| P3 | The plugin example loaded into a running dashboard, with its slot entries captured | Dashboard shell part 2. Run on 2026-10-23 in #15, after part 2's merge, and again with the corrections the owner asked for; accepted by the owner on 2026-10-23 ([record](../verification/2026-10-23-fb-19-platform-p3.md)) |
| P4 | Stripe and EasyPost sandbox calls; the providers through their area screens; Meilisearch on the storefront | Batches 4, 7 and 8; test keys from the owner. OA-1 adds keys to the storefront's CI only; the backend's sandbox runs need keys the owner provides separately, and they are never printed or committed |
| P5 | A project created and started with the command line tool | FB-04, the development path, in an environment with Docker |
| P6 | Browser tests for the five dashboard shell behaviours that part 2 captured but no test drives (G-22): the theme, the store switcher, the notifications, the command palette's record search and the rail's settings search. Added on 2026-10-23, when the owner accepted G-22's deferral to it | Part 2's merge (#14). Its completion criteria are below. Run on 2026-10-23 in #15, after the merge ([record](../verification/2026-10-23-fb-19-platform-p6.md)). The owner accepted it and closed G-22 the same day |
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
