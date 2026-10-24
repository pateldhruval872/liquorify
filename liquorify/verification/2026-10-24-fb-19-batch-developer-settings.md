---
title: FB-19 batch, developer and integration settings
record: verification
work_item: FB-19
date: 2026-10-24
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens after nine corrections to the stories, and Spree's own specs for the batch's endpoints, 130 examples with no failures. Every state the work item lists is captured on the running dashboard but one, a payment provider in test mode, which the test gateway refuses (G-26). Twelve states were reached by holding, dropping or emptying a request in the browser, and say so. Coverage and functional verification are recorded apart (§2): CAP-04-06 to CAP-04-09 are PARTIAL, because using a key, an OAuth client, the agent server or a webhook from outside the dashboard, approving on the authorize page, and an endpoint disabled automatically are platform step P2's. The interface shows 23 behaviours the work item did not expect, recorded as Spree's behaviour and not changed. No key, token, client secret or webhook secret is in any committed file. Tenant isolation is NOT_RUN. The CI results at this commit are added in a later commit that changes only records (§8). The owner's acceptance is pending (§11).
---

# FB-19 batch, developer and integration settings

**Claim.** The [developer and integration settings batch](../work-items/fb-19-batch-developer-and-integration-settings.md) reproduces what Spree already has for API keys, OAuth clients, allowed origins, AI agent connections, webhooks and integrations. It gives the 24 components those screens use 107 Storybook stories, with light and dark reference images. It captures the eight screens on Spree's running dashboard in each listed state and for each of the three roles, compares 26 cases with their stories, renders the one staff email from Spree's preview, and runs Spree's own specs for the endpoints the screens call. It follows the owner's answers of 2026-10-23: one bounded pull request, P2 run separately after this batch is accepted, and the resource table and table toolbar stories included here, with the bulk action bar deferred.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and records | Draft pull request [#16](https://github.com/pateldhruval872/liquorify/pull/16), which builds on #15's branch, `claude/fb-19-platform-p3-p6`, at `80954eb`. Its first commit, `95bc66f`, added the stories and reference images; this commit adds the corrections the comparison found, the capture scripts and the records. The CI results in §8 are added in a later commit that changes only records |
| Spree's code: the dashboard, its packages, the SDKs and the gems | Identical to `main` at `3081c8b`. The branch changes none of it: `git diff 3081c8b HEAD` over `packages/dashboard`, `packages/dashboard-core`, `packages/dashboard-ui`, `packages/sdk`, `packages/admin-sdk` and `spree/` is empty |
| Running screens | The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, at that code, in the pinned Playwright 1.64.1 image: 1280 by 960 pixels for the captures, 1280 by 800 for the comparison, and 1280 by 2400 for the two comparison cases whose sheet is taller than the window. The capture and comparison notes name `95bc66f`, the commit the scripts ran from; the comparison's stories are this commit's corrected ones |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-developer-and-integration-settings.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails | PASS: the map in §2 has CAP-04-06 to CAP-04-09, their eight screens, FL-19 and FL-20 step by step, the five permission scopes, the 24 components, Spree's 30 browser test titles and EM-S-07, each with its evidence or a named gap |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed | PASS: 24 new components, 107 stories, 214 reference images, each looked at in both modes (§1, [image review list](2026-10-24-fb-19-batch-developer-settings-image-review.md)). The work item named 19; the screens use five more, now covered (§6). The reused components are listed in §1 |
| 3 | Every screen is captured on the running dashboard in each state §2.1 lists | PASS for every listed state but one. 67 states of the eight screens are captured, in 75 captures with the role variants, light and dark. A payment provider in test mode cannot be shown: the test gateway refuses the setting (G-26). Twelve states were reached by holding, dropping or emptying a request in the browser (§2.1, G-27) |
| 4 | Each permission variant is captured, showing what the interface does for it | PASS as evidence of what the interface shows (§3.1): the admin on every screen; a role with read on the five scopes and write on none on every screen; a role from the order manager template, holding none of the five, on a direct visit to each. One planned capture changed: the read-only role cannot open the authorize page at all, so the withheld permissions were captured as a fourth role that may connect agents (§6) |
| 5 | FL-19 and FL-20 are mapped step by step, and the browser tests covering them pass on the batch's revision; a step no test covers is a gap | PASS for the mapping (§2.2): all 30 of Spree's browser test titles the work item names exist, in six files. They are among the dashboard's browser tests, which passed in all four shards in CI at `95bc66f` (§8). The steps no test covers are gaps: the storefront task, batch 3's; approving on the authorize page (G-30), the key, client, agent server and webhook used from outside (G-29), and the endpoint disabled automatically with EM-S-07 sent (G-31), each P2's |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story, its providers or its mocks | PASS, as a diagnostic: 26 cases after nine corrections to the stories and fixtures (§4). 11 show no style difference in either theme, and the other 15 are explained. The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is a coverage gap, with the check made instead; a state reached by answering a request says so | PASS: 81 of the 107 stories were not compared by the script; 32 of them show a state seen in a running-screen capture, and 49 were checked against their source only (G-24, image review list). Every capture whose state was reached in the browser says how in its note, and claims nothing about the server (§2.1) |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | Recorded in §8 after the push. At `95bc66f`, before the corrections, the visual check, Tests and Packages passed once each |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: the pull request changes only `packages/liquorify-storybook/` and `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's Storybook column, LIQ-004's FB-19 entry, its progress tables and gap register, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | PENDING (§11). Recorded as for part 2 while D5 is open |
| 12 | Backend authorization is recorded apart from criterion 4, from Spree's own specs at the batch's revision | PASS for what Spree's specs exercise: 130 examples in 11 files, no failures (§3.2). What no spec exercises, such as each role's requests in §3.1, is NOT_RUN and joins G-11 (G-32) |
| 13 | Tenant isolation is NOT_RUN, with links to the open isolation findings | NOT_RUN (§3.3). No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | No key, token, client secret or webhook secret appears in any committed file | PASS: the search of every text file the pull request adds or changes found none, and every value a screen shows is painted out in the captures (§10) |

## 1. What was built

**Stories, 107, for the 24 new components of the batch.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-24-fb-19-batch-developer-settings-image-review.md) names each one. Stories use invented values, and a value the screen would show as a key or a secret is drawn as a plain sample that does not look like one.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `popover` (CMP-DUI-P-30) | Scope list, Centred, Above, From a button |
| Composed | `copy-to-clipboard-button` (CMP-DUI-C-11) | Icon, Copied |
| | `json-preview-drawer` (CMP-DUI-C-27) | Loaded, Loading, Failed |
| | `json-value-view` (CMP-DUI-C-28) | Payload, Asked to expand all, Asked to collapse all, Empty payload |
| | `resource-layout` (CMP-DUI-C-40) | Two columns, Main only |
| | `resource-name-cell` (CMP-DUI-C-42) | Openable, Address as name, Not openable, Focus visible |
| | `secret-input` (CMP-DUI-C-48) | Empty, Typed, Shown, Stored, Replacing |
| Framework | `can` (CMP-CORE-05) | Allowed, Refused |
| | `preferences-form` (CMP-CORE-22) | New connection, Saved |
| | `resource-table` (CMP-CORE-26) | Listed, Loading, Empty, Nothing found, Second page, Row actions open, Webhook endpoints |
| | `table-toolbar` (CMP-CORE-37) | Default, With a search, Filter panel open, Date range applied, Sort open, Columns open, Deliveries, failed only |
| `api-keys/` (CMP-DA-G-01) | `api-key-create-sheet` | Secret key, Chosen scopes, Full access, Publishable key, Name and scope required |
| | `api-key-edit-sheet` | Secret key, Renaming, Publishable key, Name required |
| | `api-key-form-fields` | Name, Name required, Key type choices, Channel binding, Channel binding, open, Form refusal |
| | `api-key-scope-picker` | Nothing chosen, Chosen scopes, Full access, Read all, Limited by the reader, Fixed, Loading |
| | `api-key-token-reveal-dialog` | New secret key |
| `integrations/` (CMP-DA-G-10) | `configure-integration-sheet` | Connect, Connect and activate, Configure, Connection checked, Connection failed, Disconnect confirmation, Read only |
| | `integration-card` | Not connected, Connected, inactive, Active, Read only, Saving, Payment method in test mode |
| | `setup-guide-link` | Link, Focus visible |
| Admin dashboard, top level (CMP-DA-G-24) | `agent-connections-card` | Connected, Nobody connected, Loading, Read only, Revoke confirmation |
| | `choice-card-picker` | First chosen, Last chosen, Focus visible |
| | `mcp-connect-sheet` | Choose an agent, Something else, Claude ready, Claude Code, ChatGPT ready, Something else ready, Callback refused |
| | `oauth-application-sheet` | Register, Required, Callback refused, Edit |
| | `webhook-endpoint-form` | All events, Chosen events, Deprecated and custom events, Adding a custom event, URL required, URL invalid, Events loading, Events failed |

**Already covered, reused by these screens:** `api-key-table`, `permission-picker`, `page-header`, `slot`, `relative-time`, `row-actions`, `route-error-boundary`, `confirm-dialog`, `search-input`, and the primitives from the pilot, #9 and the staff access batch, among them `sheet`, `dialog`, `tabs`, `switch`, `radio-group`, `scroll-area`, `badge` and `empty`.

**`can` draws nothing of its own.** Its two stories show what it renders with and without the permission: the endpoint page's Send test and edit buttons, which the running screen draws for the admin and leaves out for the developer settings viewer (§3.1).

**Providers and mocks.** Fixtures for keys, scopes, channels, OAuth applications and their connections, allowed origins, webhook endpoints, events and deliveries, and integrations and their types, each checked against the Admin API's own schemas in `fixtures.test.ts`; handlers for each list and sheet, with variants that hold a request open, refuse it with a message Spree sends, or answer with nothing.

**Scripts beside the Storybook (`packages/liquorify-storybook/fidelity/`).**
- `developers.ts` (new) adds what the captures need to the browser-test database through the Admin API only: three secret keys, one revoked; two allowed origins; an OAuth client; an agent registration made as the connect sheet makes Claude's, with two people connected through Spree's own consent and token exchange; four webhook endpoints, one disabled by hand with a reason and one with a test delivery; and a payment method from the test gateway. Every key, token and secret the API answers with is discarded unread. The endpoints point at hosts under `.test`, which never resolve, so a delivery fails without reaching anything.
- `staff.ts` adds two roles and a teammate for each: the developer settings viewer, with read on the five scopes and write on none, and the agent connector, who may connect agents and read products.
- `screens.spec.ts` gains the batch's 75 captures. Each paints out every key, token and secret value on the screen before the screenshot, and blocks and records any request that would leave the local servers.
- `compare.spec.ts` gains the batch's 26 cases, with the corrections in §4.3.

## 2. The batch map, completed

The map from the [work item §2](../work-items/fb-19-batch-developer-and-integration-settings.md#2-scope), with its evidence and result. Capture paths are in the [evidence index](evidence/2026-10-24-fb-19-batch-developer-settings/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen; it does not show that the screen works. **Functionally verified** is whether each behaviour was shown to work at the batch's revision, by a browser test or a spec (§2.2).

| Capability | Screens | Flows | Emails | Permission | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|---|
| CAP-04-06 API keys, OAuth applications, allowed origins | DA-SET-26, DA-SET-27, DA-SET-30 | FL-19 | None | `api_keys`, `oauth_applications`, `settings` | The `api-keys/` group, `oauth-application-sheet`, `popover`, `copy-to-clipboard-button`, `resource-table`, `table-toolbar`, `resource-name-cell` | 28 captures; 8 cases compared; 11 browser test titles; Spree's specs for keys, applications and origins | PASS: every listed state captured | PARTIAL: creating, renaming, revoking and deleting keys, registering, renaming and removing clients, and every origin action pass in Spree's browser tests. A key and an OAuth client used from outside the dashboard are P2's (G-29) |
| CAP-04-07 AI agent connections and the agent server (the screens only) | DA-SET-07, DA-SET-32 | FL-20 | None | `oauth_applications`; approving needs write on it (§6) | `agent-connections-card`, `mcp-connect-sheet`, `choice-card-picker`, `popover`, `copy-to-clipboard-button` | 17 captures; 6 cases compared; 7 browser test titles; Spree's specs for consent, applications and the agent server | PASS: every listed state captured, five of them reached in the browser | PARTIAL: connecting, the connection list and revoking one person pass in Spree's browser tests. Approving on the authorize page is made through the API in those tests (G-30), and the agent server is used only by Spree's spec (G-29); both are P2's |
| CAP-04-08 Webhooks and events | DA-SET-28, DA-SET-29 | FL-19 | EM-S-07 | `webhooks` | `webhook-endpoint-form`, `resource-table`, `table-toolbar`, `resource-name-cell`, `resource-layout`, `json-preview-drawer`, `json-value-view`, `can` | 18 captures; 6 cases compared; 6 browser test titles; Spree's specs for endpoints, deliveries and events; EM-S-07 rendered from its preview | PASS: every listed state captured, three of them reached in the browser | PARTIAL: creating, opening, renaming, testing and deleting an endpoint pass in Spree's browser tests. A test delivery is created, but no delivery reaches a receiver (G-29), and an endpoint disabled automatically, with EM-S-07 sent, is P2's (G-31) |
| CAP-04-09 Integrations settings | DA-SET-10 | None | None | `integrations`, and `settings` for the payment providers | The `integrations/` group, `preferences-form`, `secret-input` | 12 captures; 6 cases compared; 6 browser test titles; Spree's specs for integrations | PASS for every listed state but a payment provider in test mode (G-26) | PARTIAL: connecting and keeping settings, adding a provider, and switching a provider off, on and back after a failed save pass in Spree's browser tests. Only the test app's own integration and the test gateway are connected; real providers need test keys (G-26) |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-<theme>.webp` in the evidence folder, in light and dark, with a JSON note that records the path, the variant's role, how the state was reached, what was painted out and any request blocked because it would have left the local servers. "Held" means the browser held a request open; "dropped" means the browser cut it off, as a lost connection would; "emptied" means the list's answer reached the screen with its records taken out.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| DA-SET-26 API keys | Listed: publishable and secret keys, a key never used and a revoked key (admin, viewer); the create sheet (admin, viewer); full access; chosen scopes; the token shown once; the edit sheet, renaming; revoke and delete confirmations; a direct visit (order manager) | None |
| DA-SET-27 OAuth clients | Listed (admin, viewer); none (emptied); the register sheet; a callback that is not https, refused by the server; rename; remove confirmation; a direct visit (order manager) | None |
| DA-SET-30 Allowed origins | Listed (admin, viewer); none (emptied); the create sheet; a malformed origin refused, by the dashboard's own check (§6); edit; delete confirmation; a search that finds nothing; a direct visit (order manager) | None |
| DA-SET-07 AI agents | Who is connected, what they approved and when (admin, viewer); nothing connected yet (emptied); the connect sheet; Claude ready, with what to paste; Claude Code; a callback asked for once "Something else" is chosen; an unknown person (the second person taken out of the answer, as when their account no longer exists); revoke one person's confirmation; a direct visit (order manager) | None |
| DA-SET-32 Authorize an application | The permissions requested, with how to revoke later; those withheld because the teammate's role does not include them (agent connector); approving (held); refusing (held); the decision could not be recorded (dropped); an invalid request; a teammate who may not connect agents (viewer) | None |
| DA-SET-28 Webhooks | Listed, with an endpoint disabled (admin, viewer); none (emptied); the create sheet with all events and with chosen events; its event list failing to load (dropped); the secret shown once; delete confirmation; a direct visit (order manager) | None |
| DA-SET-29 Webhook endpoint | Its details, health and deliveries (admin, viewer); a delivery's details; disabled, with its reason; no deliveries yet; rename; a test sent; a test that failed (dropped); not found | None |
| DA-SET-10 Integrations | Integrations and payment providers listed (admin, viewer); an integration not connected; connected and inactive; the configure sheet, connected; the connect sheet with its secret hidden and shown; disconnect confirmation; a payment provider switched off; the switch moved while its save is held; the switch reverted after its save is dropped; a direct visit (order manager) | A payment provider in test mode: the test gateway refuses the setting (G-26). Sandbox mode is shown on in the configure sheet |
| EM-S-07 Endpoint disabled | Rendered from Spree's preview, `Spree::WebhookPreview#endpoint_disabled`, in the browser-test app, in light (the template has no dark styles) | None |

**Twelve states reached in the browser** (G-27): DA-SET-07 nothing connected and unknown person; DA-SET-10 the switch moved while saving and reverted; DA-SET-27, DA-SET-28 and DA-SET-30 none; DA-SET-28 its event list failing; DA-SET-29 a test that failed; DA-SET-32 approving, refusing and the decision that could not be recorded. Each shows how the screen renders that answer, not that the server would send it. No server message was invented: a request was held, dropped or emptied, and the messages on screen are Spree's own or the browser's.

**Nothing secret is shown.** Every key, token and secret value on DA-SET-26, the webhook secret on DA-SET-28 and the integration's secret on DA-SET-10 are painted out in the page before the screenshot, so a sheet or dialog above them still covers them; the integration's stored secret comes back from the server already masked. Every capture whose page shows such a value says so in its note. The OAuth client IDs on DA-SET-27 are public identifiers, not secrets, and are not masked.

**No request left the local servers.** Every capture blocked and recorded any request to a host other than the local servers. None was: each of the 150 notes records an empty list.

### 2.2 Flows step by step

The browser tests are Spree's own, in `packages/dashboard/e2e/`, unchanged. All 30 titles the work item names exist, in the six files below, and run in the Packages workflow in four shards at the batch's revision (§8).

**FL-19, connect a storefront or integration.**

| Step | Screen | Browser tests | Functionally verified |
|---|---|---|---|
| The storefront task | DA-HOME-02 | Batch 3's ([work item §2.3](../work-items/fb-19-batch-developer-and-integration-settings.md#23-left-out-and-where-it-goes)) | Not this batch |
| Create a key | DA-SET-26 | `api-keys.spec.ts`: "lists the publishable and secret sections", "creates a secret key and reveals its token once", "renames a key through the edit sheet" | PASS |
| Allow the storefront's origin | DA-SET-30 | `allowed-origins.spec.ts`: "lists allowed origins", "creates a new allowed origin", "shows inline validation for a malformed origin", "edits an allowed origin", "deletes an allowed origin" | PASS |
| Create an endpoint | DA-SET-28 | `webhooks.spec.ts`: "lists webhook endpoints", "creates an endpoint, reveals the secret, and navigates to its detail page", "deletes an endpoint via the row confirm dialog" | PASS |
| Test the endpoint | DA-SET-29 | "clicking the name navigates to the detail page", "renames an endpoint on its detail page", "sends a test delivery and surfaces it in the embedded deliveries list" | PASS for the delivery being made and listed; none reaches a receiver (G-29) |
| Use the key, and receive a delivery, from outside | None | None | **Gap** G-29: platform step P2 |
| An endpoint disabled after failing deliveries | EM-S-07 | None | **Gap** G-31: P2's automatic disabling, with G-16. The email renders from its preview |

DA-SET-27 is not a step of FL-19 in LIQ-008, but CAP-04-06 includes it: `oauth-clients.spec.ts`, "registers a client from a name and a callback", "refuses a callback that is not https", "renames one, and removes it". PASS.

**FL-20, connect an AI agent.**

| Step | Screen | Browser tests | Functionally verified |
|---|---|---|---|
| Connect an agent | DA-SET-07 | `ai-agents.spec.ts`: "both screens say so rather than showing an empty table", "connecting registers the first client", "registers the client and shows what to paste into it", "asks for a callback only once Something else is chosen" | PASS |
| Approve what it asks for | DA-SET-32 | None drives this page: the tests approve through the API | **Gap** G-30: a browser test that approves on the page, assigned by the owner to P2. The batch's captures show the page's states |
| See the connection and revoke it | DA-SET-07 | "says who is connected through a registration", "names the person, what they approved, and when", "revokes that one person and keeps the registration" | PASS |
| The agent uses the agent server | None | None in the browser; Spree's `mcp_spec.rb` exercises the server with tokens issued through consent (§3.2) | **Gap** G-29: P2 |

DA-SET-10 is in no flow: `integrations.spec.ts`, "lists third-party payment providers alongside integrations", "connects an integration and keeps its settings", "opens the add sheet for the chosen provider without a provider picker", "switches a payment method off and back on from its card", "moves the switch at once and reverts it when the save fails", "saves the last choice when the switch is clicked again during a save". PASS.

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each role

From the running-screen captures. This shows only what the interface displays; hiding a control does not stop a request, and keeping one does not mean the server allows it.

| Variant | Role's permission keys, read from `/me` | What the screens show |
|---|---|---|
| Admin | Every key | Every screen with every control |
| Developer settings viewer: read on the five scopes, write on none | `read_api_keys`, `read_oauth_applications`, `read_settings`, `read_webhooks`, `read_integrations` | The settings menu lists the developer pages. API keys keeps New key, which opens the create sheet, and each row's menu (B1, B2). OAuth clients has no Register button and no row menus. Webhooks has no New endpoint button. Allowed origins has no Add button and keeps each row's menu. AI agents keeps Connect an agent and hides revoke. An endpoint's page hides Send test and edit and keeps its menu (B3). Integrations shows the payment providers only, with their switch and Configure enabled (B4, B5). The authorize page refuses it (B10) |
| Order manager template | `read_orders`, `write_orders`, `read_payments`, `write_payments`, `read_fulfillments`, `write_fulfillments`, `read_refunds`, `write_refunds`, `read_customers`, `read_gift_cards`, `write_gift_cards`, `read_store_credits`, `write_store_credits` | No settings entry for these screens; the settings menu reads `No settings match ""`. A direct visit to each page shows its empty state, as if the store had none, with no word that the role may not read them; API keys keeps New key and AI agents keeps Connect an agent; Integrations shows only its heading (B6) |
| Agent connector: may connect agents and read products | `read_products`, `read_oauth_applications`, `write_oauth_applications` | The authorize page offers View Products and lists View Orders and Manage Orders as "Not offered, because your own role does not include" them |

### 3.2 What the server refuses

**Spree's own specs, at this branch, whose Spree code is `3081c8b`.** Run in this session on SQLite with Spree's API test app and the agent server's own test app. 130 examples in 11 files, 0 failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-24-fb-19-batch-developer-settings/backend/api-specs.json) (95 examples), [mcp-specs.json](evidence/2026-10-24-fb-19-batch-developer-settings/backend/mcp-specs.json) (26) and [origins-specs.json](evidence/2026-10-24-fb-19-batch-developer-settings/backend/origins-specs.json) (9).

| Endpoint | Spec file (examples) | What the examples exercise, by caller |
|---|---|---|
| API keys | `api_keys_controller_spec.rb` (16) | A secret key cannot mint a key with scopes beyond its own, and a key holding only `write_settings` is denied; a JWT admin may grant any valid scope; renaming ignores the key type, channel and scopes, which are fixed; a channel belongs to the same store |
| How a key is recognised | `api_key_authentication_spec.rb` (3) | When a publishable key's last use is recorded |
| Integrations | `integrations_controller_spec.rb` (11) | Another store's integration answers 404; a masked secret sent back keeps the stored one; activation needs a working connection; unknown types are refused |
| Webhook endpoints | `webhook_endpoints_controller_spec.rb` (15) | The secret is returned once, on create, and never on reads; subscribing to customer password resets, or repointing an endpoint that receives them, needs permission to manage customers |
| Webhook deliveries | `webhook_deliveries_controller_spec.rb` (9) | Another endpoint's deliveries are not listed; with only the webhooks permission, an order event's payload is withheld; payment credentials, cart tokens and gift card codes are never returned |
| Webhook events | `webhook_events_controller_spec.rb` (4) | A staff JWT without the webhooks permission is refused; credential events name the permission they need |
| OAuth applications | `applications_spec.rb` (12) | Who approved and when; what the live tokens grant; registering and deleting a client; revoking one person keeps their colleagues |
| OAuth consent | `authorizations_spec.rb` (6) | A staffer who may not connect agents is refused; a scope the approver does not hold is neither offered nor granted; a scope the server does not offer is dropped |
| What an agent's token reaches | `oauth_access_spec.rb` (19) | A token reaches only what was granted, cannot write where it may read, cannot approve itself a wider grant, and acts on its application's store |
| The agent server | `mcp_spec.rb` (26) | Tokens issued through consent are accepted and narrowed to what was approved; a secret key, a JWT, an expired, revoked or wrongly addressed token is refused; another store's records are not found |
| Allowed origins | `allowed_origins_spec.rb` (9), an integration spec beyond the work item's list | Create, read, update and delete, a malformed origin refused with 422, and 401 without credentials |

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec sends the requests §3.1's roles could make as a staff JWT: the developer settings viewer creating a key, connecting an agent, or switching a payment provider; the order manager reading or creating on these screens. They join G-11 (G-32).

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings), and all seven stay open.

Some of Spree's specs above touch store boundaries: another store's integration answers 404, a key's channel must belong to its store, another endpoint's deliveries are not listed, and the agent server serves its application's store and does not find another store's records. They are listed so they are not lost. They are Spree's own checks, not FB-03's validation, and the batch claims nothing about isolation from them, including for keys and endpoints of another store. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-24-fb-19-batch-developer-settings/README.md). The token in the reveal dialog is painted out on both sides.

### 4.1 Results, after the corrections

| ID | Case | Story | Running screen | Styles that differ, light and dark | Explained |
|---|---|---|---|---|---|
| CMP-DA-G-01 | api-key-create-sheet-secret-key | Create sheet: Secret key | The create key sheet, as it opens | None | |
| CMP-DA-G-01 | api-key-scope-picker-nothing-chosen | Scope picker: Nothing chosen | The create sheet's scope picker | height; 1 element on the screen only | The story's catalog is shorter than Spree's, so each state fits on one screen; the screen's list is taller and has one more resource without a write permission, marked with a dash |
| CMP-DA-G-01 | api-key-edit-sheet-renaming | Edit sheet: Renaming | The edit key sheet, its name being changed | None | The story's key also reads products, so one more box is ticked: data, not style |
| CMP-DA-G-01 | api-key-token-reveal-dialog | Token reveal dialog: New secret key | A new key's token, shown once, painted out on both sides | border colours and box-shadow of Copy | Focus modality, as in part 1 and part 2: the story's dialog opens with keyboard focus on Copy, which shows its ring; the screen's was opened by a click |
| CMP-DA-G-24 | agent-connections-card-connected | Agent connections card: Connected | Claude's card, two people connected | height | The story lists three people, the browser-test store two |
| CMP-DUI-P-30 | popover-scope-list | Popover: Scope list | The rest of a connection's scopes, opened from its count | height; 124 and 130 pixels wide | The story lists five scopes, the screen's connection three; each popover is as wide as its longest scope |
| CMP-DA-G-24 | connect-sheet-choose-an-agent | Connect sheet: Choose an agent | The connect sheet | None | |
| CMP-DA-G-24 | choice-card-picker-first-chosen | Choice card picker: First chosen | The connect sheet's choice of agent | box-shadow of the chosen radio | Neither draws a shadow: the screen's radio carries a transparent one, the story's none |
| CMP-DA-G-24 | connect-sheet-claude-ready | Connect sheet: Claude ready | The connect sheet, Claude ready | None | |
| CMP-DUI-C-11 | copy-to-clipboard-button-icon | Copy to clipboard button: Icon | The connect sheet's Copy address button | None | |
| CMP-DA-G-24 | client-sheet-register | Client sheet: Register | The register a client sheet | None | |
| CMP-DA-G-24 | client-sheet-callback-refused | Client sheet: Callback refused | The register sheet, a callback that is not https refused by the server | None | |
| CMP-CORE-26 | resource-table-allowed-origins | Resource table: Listed | The allowed origins table | None | |
| CMP-CORE-37 | table-toolbar-allowed-origins | Table toolbar: Default | The allowed origins table's toolbar | None | |
| CMP-CORE-26 | resource-table-webhook-endpoints | Resource table: Webhook endpoints | The webhook endpoints table | height; light, 4 elements in the story only; dark, 1 | Data: the story's endpoints have other health states, so a badge and a second line in the Health cell show in its rows only, and the rows are taller. In light, the story's capture also has the fade and scrollbar Spree adds once it measures a table wider than its card |
| CMP-DUI-C-42 | resource-name-cell-openable | Resource name cell: Openable | An endpoint's name in the webhooks table | None; 80 and 320 pixels wide | The screen's column is as wide as its names; the story's frame is 320 pixels |
| CMP-DA-G-24 | endpoint-form-all-events | Endpoint form: All events | The new endpoint sheet, all events | border colours, box-shadow and height; 1 element on each side only | The screen's sheet focuses Name as it opens. The story's shorter catalog starts with two rows of customer events, the screen's with one staff event, and one of the story's labels is 4 pixels taller for its Credential badge (B15). The screen's root is the sheet's padded body, 598 pixels with 566 inside; the story's is the 566-pixel form |
| CMP-DUI-C-40 | resource-layout-endpoint | Resource layout: Two columns | A webhook endpoint's page | font-size, height and line-height; 72 elements on the screen only, 5 in the story only | The layout's story fills its two columns with placeholder panels; the screen holds the endpoint's own cards. The columns match |
| CMP-DUI-C-27 | json-preview-drawer-loaded | JSON preview drawer: Loaded | An endpoint's record, viewed as JSON | border colours, box-shadow and height | Focus modality, as above, on the drawer's first button; and the record's values differ in length, so lines wrap differently |
| CMP-DUI-C-28 | json-value-view-payload | JSON value view: Payload | A test delivery's payload, in its details sheet | height; 4 elements in the story only | Data: the story shows an order's payload with nested line items, the screen a test delivery's shorter one |
| CMP-DA-G-10 | integration-card-active | Integration card: Active | E2E Relay's card, connected and active | height; 4 elements in the story only | The story's integration has a description and a setup guide; the test app's E2E Relay has neither (G-25) |
| CMP-DA-G-10 | integration-card-not-connected | Integration card: Not connected | E2E Relay's card, not connected | height; 4 elements in the story only | As above |
| CMP-DA-G-10 | configure-sheet-connect | Configure sheet: Connect | E2E Relay's sheet, connecting | border colours, box-shadow, colour, font weight and height; 2 elements in the story only | The story's header carries the setup guide link, so it is taller; the screen's sheet focuses its first field as it opens |
| CMP-CORE-22 | preferences-form-new-connection | Preferences form: New connection | E2E Relay's settings, connecting | border colours and box-shadow of the first field | The screen's first field has focus, as the sheet opens |
| CMP-DA-G-10 | configure-sheet-configure | Configure sheet: Configure | E2E Relay's sheet, connected | As for Connect, and the background of the Sandbox Mode switch | As for Connect; and the browser-test relay has sandbox mode on, the story's off |
| CMP-DUI-C-48 | secret-input-stored | Secret input: Stored | E2E Relay's stored secret, masked by the server | None | |

### 4.2 Corrections made to the stories

Each was a defect in a story or its fixtures, fixed there; no Spree component changed. The comparison was run again after them, and all 26 cases passed with the differences above. 24 stories' reference images changed, 48 images in all.

| # | Story | Was | Now, as on the screen |
|---|---|---|---|
| 1 | Popover (three stories) | Scopes worded "Read Products", "Write Stock" | "View Products", "Manage Stock", as the dashboard words them |
| 2 | Secret input (five stories) | 384 pixels wide at the page's text size; a stored secret shown as four dots and its last four characters | 566 pixels and the sheet's 14-pixel text; sixteen dots and the last four, as the server masks it |
| 3 | Configure sheet (five stories) | The integration's stored secret masked with four dots | Sixteen dots and the last four, as correction 2 |
| 4 | Preferences form (two stories) | 416 pixels wide at the page's text size | 566 pixels and 14-pixel text, as the sheet gives it |
| 5 | Choice card picker (three stories) | 542 pixels wide at the page's text size | 566 pixels and 14-pixel text |
| 6 | JSON value view (four stories) | 576 pixels wide | 540 pixels, as the delivery's details sheet gives it |
| 7 | JSON preview drawer and JSON value view | An endpoint's fields in another order, and an event's ID and time shaped differently | The fields in the order the Admin API answers with; the event as Spree sends it, with a UUID, a time in whole seconds and Spree's version in its metadata |
| 8 | Resource table: Webhook endpoints | No button above the table | The page's own New endpoint button |
| 9 | Form fields, Scope picker, Endpoint form | The page's text size | The sheet's 14-pixel text. Their images did not change |

### 4.3 Corrections to the comparison script

- **Styles are read before the screenshot.** Painting out a value changes its styles, so reading them afterwards compared the paint.
- **Painting out switches transitions off.** Spree eases colour changes on `code` over 0.1 seconds, so a screenshot taken while the text faded could still show it.
- **A taller window for two cases.** The scope picker and the endpoint form are taller than the window, so their cases use 1280 by 2400 pixels.
- **Focus and pointer are moved away before each capture,** so a control a step clicked keeps no hover colour or focus ring the story does not have.
- **Each case removes what it created.** The token reveal dialog's key and similar records are deleted after the case, so the next run starts from the same data.

## 5. Spree's behaviour found, recorded and not changed

Each is how Spree works at `3081c8b`. The batch reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | The API key scope picker disables the scopes the reader may not grant, but draws them exactly like the ones they may: the same background and border, at full opacity. In the story Limited by the reader, 14 of the 20 boxes are disabled and look like the other 6; on the running screen, the viewer's create sheet is identical, pixel for pixel, to the admin's | DA-SET-26 create-sheet, viewer; Scope picker: Limited by the reader |
| B2 | API keys and AI agents keep their create button for roles that may not create: New key and Connect an agent show for the developer settings viewer, and for the order manager on a direct visit. New key opens the create sheet. The other pages hide theirs | DA-SET-26, DA-SET-07 |
| B3 | On an endpoint's page, a reader who may not change it loses Send test and the edit button but keeps the ⋮ menu | DA-SET-29 details-and-deliveries, viewer |
| B4 | A role that may read integrations but not create them sees no integration at all, only the payment providers: the list of integration types, which the page needs to draw any integration, is authorized as creating one | DA-SET-10 connected, viewer; read in `integrations_controller.rb` |
| B5 | For the same role, a payment provider's switch and Configure stay enabled | DA-SET-10 connected, viewer |
| B6 | A role holding none of the five scopes sees each page's empty state on a direct visit, as if the store had no keys, clients, endpoints or origins, with no word that it may not read them. The settings menu reads `No settings match ""` though nothing was searched | DA-SET-* direct-visit, order manager |
| B7 | An endpoint disabled by hand, with a reason, is listed as "Auto-Disabled" | DA-SET-28 listed |
| B8 | The authorize page says the access can be revoked "under Settings → Connected apps"; the page is called AI Agents | DA-SET-32 permissions-requested |
| B9 | EM-S-07 asks for the endpoint to be re-enabled "in Settings → Developers → Webhooks"; the settings group is called Developer | EM-S-07 |
| B10 | Approving an agent needs write on OAuth applications. A teammate without it is told the request is not valid, with the reason "You do not have permission to connect an agent to this store": a permission refusal framed as an invalid request | DA-SET-32 not-permitted, viewer |
| B11 | The authorize page leaves out `read_webhooks`, which the batch's agent asked for: Spree offers agents no scope over OAuth applications, API keys, integrations, webhooks or staff, and drops it from the request. Spree's spec expects this ("a scope this server does not offer is dropped rather than failing the request") | DA-SET-32 permissions-requested; `oauth.rb` |
| B12 | While an approval or a refusal is being sent, Allow access dims in both, so the two states look the same | DA-SET-32 approving, refusing |
| B13 | At 1280 pixels the OAuth clients and webhooks tables are wider than their card: the last columns run past the card's edge, and the last row is cut short at its lower edge | DA-SET-27 listed, DA-SET-28 listed |
| B14 | A request that never reaches the server is reported in the browser's own words, "Failed to fetch" | DA-SET-29 test-failed, DA-SET-32 decision-failed |
| B15 | A credential event's Credential badge runs past the edge of the events list when the event's name is long | Endpoint form stories; DA-SET-28's create sheet |
| B16 | In the JSON view and the JSON drawer, "Expand all" and "Collapse all" do the opposite of what they say: the view folds everything when told to expand and opens everything when told to collapse, opposite to its own documentation | JSON value view and JSON preview drawer stories; read in `json-value-view.tsx` and `json-preview-drawer.tsx` |
| B17 | An endpoint's name in the webhooks table shows no focus when reached with Tab | Resource name cell: Focus visible |
| B18 | A read-only configure sheet leaves its fields, switches, Replace and Test connection usable; only Save is missing. No role reaches it on a running screen (B4) | Configure sheet: Read only |
| B19 | The OAuth client sheet's required fields, left empty, are marked invalid but show no message, and the sheet does not submit | Client sheet: Required; read in `oauth-application-sheet.tsx` |
| B20 | The connect sheet shows the server's refusal of a callback only in a banner; the OAuth clients sheet shows the same refusal in a banner and under the field | Connect sheet: Callback refused; DA-SET-27 callback-refused |
| B21 | While the connections load, the agent card's count reads 0 and its table is empty, with no sign of loading | Agent connections card: Loading |
| B22 | Disabled checkboxes, such as a key's fixed scopes in the edit sheet, are faint enough to be hard to see in both themes | Scope picker: Fixed; DA-SET-26 edit-renaming |
| B23 | A malformed origin is refused by the dashboard's own check, before any request; the server's refusal is seen only in Spree's integration spec | DA-SET-30 malformed-refused; read in `allowed-origins.tsx` |

B1, B2, B4, B5 and B6 matter for Liquorify's later staff and developer access work; whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own staff access changes (F1). The test deliveries fail because the batch's endpoints point at hosts that never resolve, as planned; that is the batch's data, not Spree's behaviour.

## 6. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-developer-and-integration-settings.md#10-corrections-found-during-the-batch) §10, without changing the proposal's text:
- §2.2's "DA-SET-32 is not gated by a scope": approving needs write on OAuth applications (B10). The read-only role is refused the page, which is captured as its own state; the withheld permissions were captured as a fourth role, the agent connector, who may connect agents and read products.
- §3's 19 components: the screens use 24. The five more are `json-preview-drawer`, `json-value-view`, `resource-name-cell`, `secret-input` and `choice-card-picker`, all now covered.
- §2.1's DA-SET-30 "a malformed origin refused": refused by the dashboard's own check, before any request (B23).
- §2.1's DA-SET-10 "in test mode": the test gateway refuses the test mode setting with 422, so no running screen shows it (G-26).
- §2.1's DA-SET-10 "a switch that reverts when its save fails": reached by dropping the save in the browser (G-27).
- §2.1's DA-SET-28 "an endpoint disabled, with its reason": shown on the list as "Auto-Disabled" (B7), and its reason on the endpoint's page.
- §4's size estimate: 107 stories and 214 reference images, 5.2 MB; 150 captures, and evidence of 9.4 MB in all.

## 7. Gaps

Each names what is missing, the check made instead and what would close it. The batch's gaps are G-24 to G-32 in LIQ-004's [gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), each PENDING until the owner answers. The work item's six known gaps are among them. Tenant isolation is an outstanding item, not a gap.

| Gap | Check made instead | What would close it | Proposal |
|---|---|---|---|
| G-24: 81 of the 107 stories not compared by the script | 32 show a state seen in a running-screen capture; 49 checked against their source only. Each is named in the [image review list](2026-10-24-fb-19-batch-developer-settings-image-review.md) | Running screens that show those states | As G-01 |
| G-25: The setup guide link on a running screen | Its stories, checked against their source | An integration in the browser-test app with a setup guide | As G-01: compare it when a later batch's integration has one |
| G-26: A payment provider in test mode, and integrations and providers that need a real account | The story Payment method in test mode, checked against its source; the test gateway refuses the setting with 422 | Test keys for a provider that has a test mode (P4, OA-1) | Defer to P4 |
| G-27: Twelve states reached by holding, dropping or emptying a request in the browser (§2.1) | Each capture says how its state was reached | A server that answers so, or a real lost connection | Accept as simulated interface-state coverage, as G-20 and G-21 were |
| G-28: The read-only integration card and configure sheet on a running screen | Their stories, checked against their source | None while Spree hides every integration from a role that may not create one (B4) | Accept as checked against source |
| G-29: A key, an OAuth client and the agent server used from outside the dashboard, and a webhook delivered to a receiver | Spree's specs for keys, tokens and the agent server (§3.2); test deliveries made and listed, failing to reach a host | Platform step P2 | Defer to P2 |
| G-30: Approving on the authorize page in a browser test | The captures of the page's states; Spree's tests approve through the API | P2, to which the owner assigned this browser test on 2026-10-23 | Defer to P2 |
| G-31: An endpoint disabled automatically after failed deliveries, and EM-S-07 sent | EM-S-07 rendered from its preview; an endpoint disabled by hand | P2, with G-16 | Defer to P2, with G-16 |
| G-32: What the server refuses to the roles in §3.1 beyond Spree's specs | None; the interface's behaviour is recorded (§3.1) | Negative access-control tests | Join G-11 |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | Outstanding item, not a gap |

## 8. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Storybook 40036895876](https://github.com/pateldhruval872/liquorify/actions/runs/40036895876) | `95bc66f`, the stories and reference images before the corrections | Built, token check and coverage passed, and every comparison passed, in 15.4 minutes |
| [Tests 40036895946](https://github.com/pateldhruval872/liquorify/actions/runs/40036895946) | `95bc66f` | Every job passed, on the first attempt |
| [Packages 40036896012](https://github.com/pateldhruval872/liquorify/actions/runs/40036896012) | `95bc66f` | Every job passed, the dashboard's browser tests in all four shards among them; its six release jobs were skipped, as on every pull request |

The runs at this commit, with the visual check run twice, are added in a later commit that changes only this record and the evidence index.

**Local checks, in this session, before the commit.** Lint (Biome), the package's type check and the fixture tests passed. The fidelity scripts, which the package's type check leaves out, type-checked apart from the one known error in Spree's own browser test helpers, which they import (`packages/dashboard/e2e/helpers.ts` line 226). The Storybook built, with 404 stories in all. The captures, the comparison and the email rendering passed against the browser-test server. Spree's specs passed as in §3.2. Every evidence image was converted to lossless WebP and checked equal to its capture, pixel for pixel.

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the browser tests' data on screens.** Names, counts, scopes and payloads differ on purpose.
- **Seeded data.** The roles, teammates, keys, clients, connections, origins, endpoints and gateway were added to the browser-test database through the Admin API. They exist only in that database, which is local and discarded, and Spree's tests and fixtures are unchanged.
- **States reached by holding, dropping or emptying a request** show how the screen renders that answer, not that the server would send it.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL.
- **Size.** The batch's 214 reference images are 5.2 MB, more than the work item estimated, because many sheets are tall; its evidence is 9.4 MB. The evidence images are lossless WebP.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-24-fb-19-batch-developer-settings/README.md) lists every capture, comparison and result file, by inventory ID. The [image review list](2026-10-24-fb-19-batch-developer-settings-image-review.md) lists every reference image for the owner's review.

**Criterion 14's search.** Before each push, every text file the pull request adds or changes is searched for publishable and secret key prefixes, webhook secrets, JSON web tokens, bearer values, password fields and long runs mixing letters and digits, as generated values do. The search prints where a pattern matched, never the value. Before this commit it searched 222 files and found nothing. The images cannot be searched as text: the captures paint out every value before the screenshot (§2.1), and a check of each image's painted areas found no unpainted gap inside them. The only secret-shaped value in the scripts is the invented sample the capture script stores as E2E Relay's secret on the local test server, which the server masks.

## 11. The owner's review

Not yet given. The owner decides whether to accept the reference images, the screen evidence and fidelity, and answers G-24 to G-32. The merge is the owner's to make.

What stays as it was: CAP-04-05 is PARTIAL for G-11 and G-23; G-16 stays pending; SD-1 to SD-4 stay open; tenant isolation is NOT_RUN.
