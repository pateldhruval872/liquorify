---
title: FB-19 batch, developer and integration settings
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-23
updated: 2026-10-23
---

# FB-19 batch: developer and integration settings

The second backend batch organised by product area: the rest of [LIQ-006 §4](../LIQ-006-product-capability-baseline.md#4-authentication-staff-and-access), the settings a developer or an integration uses to reach a store. It reproduces what Spree already has for API keys, OAuth clients, allowed origins, AI agent connections, webhooks and integrations. Nothing here changes Spree's code or the storefront's, or adds a Liquorify feature.

**Status.** PROPOSED, for the owner's review before any of it is built. It is batch 2 in [LIQ-004's proposed order](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), which depends on part 2 of the [staff access batch](fb-19-batch-staff-access-and-shell.md). The owner accepted part 2 and merged it on 2026-10-23 ([merge record](../verification/2026-10-23-fb-19-batch-staff-access-part-2-merge.md)). It follows the batch rules of LIQ-010 0.4, as part 1 and part 2 did. §7 holds the questions the owner is asked to answer.

## 1. Outcome and summary

Every developer and integration settings screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state and permission variant, a step-by-step map of its two flows, and the staff email it sends rendered from Spree's preview. The map links each capability to its evidence or to a named gap.

- **Bounded:** 8 screens, 2 flows, 1 staff email, 6 browser test files and 19 new components, in one pull request (question 1 in §7).
- **Same shape as part 1 and part 2:** screens, flows, permissions, meaningful states and running-screen evidence progress alongside component coverage, with what the interface shows kept apart from what the server enforces.
- **No secret is published:** every key, token, client secret and webhook secret the running screens show is masked in the captures and replaced in the records (§5, criterion 14).
- **Spree stays unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function is a separate step:** whether a key, an OAuth client, the agent server and a webhook work from outside the dashboard is the platform batch's step [P2](fb-19-batch-platform.md), which depends on this batch (question 2 in §7).

## 2. Scope

The batch covers the four features of LIQ-006 §4 that part 1 left out ([staff access work item](fb-19-batch-staff-access-and-shell.md) §2.3), every screen they use in [LIQ-008](../LIQ-008-spree-screen-inventory.md), and the flows that cross them.

| Capability (LIQ-006 §4) | Screens | Flow | Emails | Browser tests |
|---|---|---|---|---|
| CAP-04-06 API keys, OAuth applications, allowed origins | DA-SET-26, DA-SET-27, DA-SET-30 | FL-19 | None | `api-keys.spec.ts`, `oauth-clients.spec.ts`, `allowed-origins.spec.ts` |
| CAP-04-07 AI agent connections and the agent server (the screens only) | DA-SET-07, DA-SET-32 | FL-20 | None | `ai-agents.spec.ts` |
| CAP-04-08 Webhooks and events | DA-SET-28, DA-SET-29 | FL-19 | EM-S-07 | `webhooks.spec.ts` |
| CAP-04-09 Integrations settings | DA-SET-10 | None | None | `integrations.spec.ts` |

### 2.1 Meaningful states to capture

From LIQ-008, the screens' own messages and the browser tests, plus the shared list states that apply. Each state is captured in light and dark at 1280 pixels.

| Screen | States |
|---|---|
| DA-SET-26 API keys | Publishable and secret keys listed; the create sheet with its scope picker, full access and chosen scopes; the token shown once; the edit sheet, renaming; revoke and delete confirmations; a key never used; a revoked key |
| DA-SET-27 OAuth clients | Clients listed; none registered; the register sheet; a callback that is not https refused; rename; remove confirmation |
| DA-SET-30 Allowed origins | Origins listed; none; the create sheet; a malformed origin refused; edit; delete confirmation; a search that finds nothing |
| DA-SET-07 AI agents | Nothing connected yet; the connect sheet and its steps, with what to paste into the agent; a callback asked for only when "Something else" is chosen; who is connected, what they approved and when; an unknown person; revoke one person's confirmation |
| DA-SET-32 Authorize an application | The permissions requested; those withheld because the teammate's own role does not include them; approve; refuse; the decision could not be recorded; an invalid request; how to revoke later |
| DA-SET-28 Webhooks | Endpoints listed; none; the create sheet with all events or chosen events, and its event list failing to load; the secret shown once; an endpoint disabled, with its reason; delete confirmation |
| DA-SET-29 Webhook endpoint | Its details and health; rename; a test sent; a test that failed; the deliveries listed; no deliveries yet; not found |
| DA-SET-10 Integrations | Integrations and payment providers listed; an integration not connected, connected and inactive, connected; the configure sheet with its settings, shown and hidden; sandbox mode; disconnect confirmation; a payment provider switched off and on; in test mode; a switch that reverts when its save fails |
| EM-S-07 Endpoint disabled | Rendered from Spree's mailer preview (`webhook_preview.rb`) |

### 2.2 Permission variants

The screens sit under five permission scopes in Spree's catalog: `api_keys` (DA-SET-26), `oauth_applications` (DA-SET-27, DA-SET-07), `settings` (DA-SET-30, and the payment providers on DA-SET-10), `webhooks` (DA-SET-28, DA-SET-29) and `integrations` (DA-SET-10). Three roles cover them:

- **Admin role:** every screen with every control.
- **A custom role with read on all five scopes and write on none:** the same screens with create, edit and delete controls hidden, where Spree hides them. Part 1 found that some screens keep their controls and the server refuses the request ([staff access work item](fb-19-batch-staff-access-and-shell.md) §7.6), so what each screen does is recorded as found.
- **A role without any of the five, made from the order manager template, which holds none of them:** the settings entries hidden, and a direct visit to each screen recorded as it shows.

DA-SET-32 is not gated by a scope: a signed-in teammate approves what an application asks for on their own behalf. It is captured as the admin, and as the read-only role above, whose role holds less than the application asks for, so the page says which permissions it does not offer.

### 2.3 Left out, and where it goes

- The storefront task on the getting started page (DA-HOME-02), FL-19's first step, and `storefront-connect-sheet`: the setup and stores batch (batch 3, LIQ-006 §3). FL-19 is mapped from DA-SET-26 here.
- The payment method sheets (`payment-method-editors/`, CMP-DA-G-12) that DA-SET-10 opens to add a provider: the payments, delivery and tax batch (batch 7). DA-SET-10's sheet is captured here as it renders; its stories are batch 7's.
- Imports (DA-SET-31, FL-21): the catalog batch that first uses them.
- `bulk-action-bar` (CMP-CORE-04): none of this batch's tables has bulk actions, so it goes to the first batch whose table does.
- Using a key, an OAuth client, the agent server or a webhook from outside the dashboard: platform step P2.

## 3. Components

The screens use 19 components from [LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) that have no stories yet. The list comes from what the screens import at `main` `3081c8b`; the batch's first step confirms it against the running screens.

| Layer | New in this batch |
|---|---|
| Primitives (CMP-DUI-P) | `popover` (30) |
| Composed (CMP-DUI-C) | `copy-to-clipboard-button` (11), `resource-layout` (40) |
| Framework (CMP-CORE) | `can` (05), `preferences-form` (22), `resource-table` (26), `table-toolbar` (37) |
| `api-keys/` (CMP-DA-G-01) | `api-key-create-sheet`, `api-key-edit-sheet`, `api-key-form-fields`, `api-key-scope-picker`, `api-key-token-reveal-dialog` |
| `integrations/` (CMP-DA-G-10) | `configure-integration-sheet`, `integration-card`, `setup-guide-link` |
| Admin dashboard (CMP-DA-G-24, top level) | `agent-connections-card`, `mcp-connect-sheet`, `oauth-application-sheet`, `webhook-endpoint-form` |

`resource-table` and `table-toolbar` are the listing framework most later settings and index screens use; this is the first batch whose screens use them (question 3 in §7). `can` draws nothing of its own, so its stories show what it renders with and without the permission, as `slot`'s did in part 1.

**Already covered, reused here:** `api-key-table`, `permission-picker`, `page-header`, `slot`, `relative-time`, `row-actions`, `route-error-boundary`, `confirm-dialog`, `search-input`, and the primitives from the pilot, #9 and the staff access batch, including `sheet`, `dialog`, `tabs`, `switch`, `radio-group`, `scroll-area`, `badge` and `empty`.

## 4. Delivery

- **One backend pull request:** stories, fixtures and mocks, reference images, the capture scripts, the verification record, the image review list, the evidence index, and LIQ-009's Storybook column. It builds on `main`.
- **Running screens:** the dashboard built at the pull request's revision against Spree's browser-test server, as P3 and P6 ran. The roles in §2.2, the keys, clients, origins, endpoints, deliveries and agent connections each state needs are added through the Admin API on that server's database only. The test app's own integration (`E2E Relay`) and test payment gateway are used; no real provider is connected. A disabled endpoint is made with the Admin API's disable action, which records a reason and sends no email; disabling after repeated failed deliveries is P2's.
- **Secrets:** every value a screen shows once, and every key in a list, is masked in the screenshot, and replaced by a placeholder in the JSON records. Stories use invented values that do not look like a key. The batch never prints a value it creates.
- **Emails:** EM-S-07 rendered from Spree's mailer preview in the browser-test app, as part 1 rendered the staff emails, or recorded as NOT_RUN if the preview cannot be reached there. Only automatic disabling sends it, so reading it as sent, from the folder P1 set up, is P2's.

**Size, estimated from part 1 and part 2:** about 70 stories and 140 reference images (about 0.7 MB), and about 90 running-screen captures with their computed styles (about 4 MB).

## 5. Acceptance criteria

The staff access batch's criteria, with its two added criteria, applied to this batch, and one more for secrets. Each result is recorded as PASS, FAIL, BLOCKED or NOT_RUN.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, permission scope, meaningful states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record, checked against LIQ-006, LIQ-008 and LIQ-009 |
| 2 | Every component the screens use has a story for each meaningful state, in light and dark, with a reference image; components already covered are listed, not redone | Coverage report and image review list |
| 3 | Every screen is captured on the running dashboard, at the pinned revision, in each state in §2.1 | Running-screen captures, indexed by screen ID and state |
| 4 | Each permission variant in §2.2 is captured, showing what the interface does for it | Captures per variant, with the role's permission keys |
| 5 | FL-19 and FL-20 are mapped step by step to their screens and emails, and the browser tests covering them pass on the batch's revision; a step no test covers is recorded as a gap | Flow map with test titles and the CI run |
| 6 | The diagnostic comparison finds no unexplained difference between each new story and its running screen. A defect is fixed in the story, its providers or its mocks, never in Spree's component | Side-by-side images and computed styles |
| 7 | A state no running screen shows is recorded as a coverage gap, with the check made instead. A state reached by answering a request in the browser says so, and claims nothing about the server | Gap list in the record |
| 8 | The visual check passes twice in CI on the same revision under the agreed tolerance; Tests and Packages pass; the check stays advisory | CI runs |
| 9 | Spree's code, the storefront and every workflow outside Storybook are unchanged, and nothing carries Liquorify branding or features | The pull request's file list |
| 10 | The records are updated: a verification record, LIQ-009's Storybook column, LIQ-004's FB-19 status and the README index, with every link checked | The pull request |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | Recorded as for part 2, until D5 decides how acceptance is recorded |
| 12 | Backend authorization is recorded separately from criterion 4: the record names Spree's own specs for the batch's endpoints, runs them at the batch's revision, and lists what they exercise for each role or key. What no spec exercises is NOT_RUN, never inferred from the interface | The spec run. For this batch: the Admin API controller specs for API keys, integrations, webhook endpoints, deliveries and events; the request specs for OAuth applications, authorizations and access; the API key authentication spec; the agent server's request spec |
| 13 | Tenant isolation is NOT_RUN for the batch, with links to the open isolation findings. A new isolation defect is reported to the owner privately and is not published while it is open | The record's isolation section |
| 14 | No key, token, client secret or webhook secret appears in any committed file: screenshots mask them and records replace them, checked by a search of the pull request's files before each push | The search's result in the record |

## 6. Flow steps

### FL-19, connect a storefront or integration

| Step | Browser tests |
|---|---|
| DA-HOME-02: the storefront task | Batch 3 (§2.3) |
| DA-SET-26: create a key | `api-keys.spec.ts`: "lists the publishable and secret sections", "creates a secret key and reveals its token once", "renames a key through the edit sheet" |
| DA-SET-30: allow the storefront's origin | `allowed-origins.spec.ts`: "lists allowed origins", "creates a new allowed origin", "shows inline validation for a malformed origin", "edits an allowed origin", "deletes an allowed origin" |
| DA-SET-28: create an endpoint | `webhooks.spec.ts`: "lists webhook endpoints", "creates an endpoint, reveals the secret, and navigates to its detail page", "deletes an endpoint via the row confirm dialog" |
| DA-SET-29: test the endpoint | `webhooks.spec.ts`: "clicking the name navigates to the detail page", "renames an endpoint on its detail page", "sends a test delivery and surfaces it in the embedded deliveries list" |
| Use the key, and receive a delivery, from outside | None: platform step P2 |
| EM-S-07: an endpoint disabled after failing deliveries | None: P2's automatic disabling |

DA-SET-27, OAuth clients, is not a step of FL-19 in LIQ-008, but CAP-04-06 includes it: `oauth-clients.spec.ts`, "registers a client from a name and a callback", "refuses a callback that is not https", "renames one, and removes it".

### FL-20, connect an AI agent

| Step | Browser tests |
|---|---|
| DA-SET-07: connect an agent | `ai-agents.spec.ts`: "both screens say so rather than showing an empty table", "connecting registers the first client", "registers the client and shows what to paste into it", "asks for a callback only once Something else is chosen" |
| DA-SET-32: approve what it asks for | None drives this page: the tests make the approval through the API (`oauth-helpers.ts`) |
| DA-SET-07: see the connection and revoke it | "says who is connected through a registration", "names the person, what they approved, and when", "revokes that one person and keeps the registration" |
| The agent uses the agent server | None: platform step P2 |

DA-SET-10, integrations, is in no flow: `integrations.spec.ts`, "lists third-party payment providers alongside integrations", "connects an integration and keeps its settings", "opens the add sheet for the chosen provider without a provider picker", "switches a payment method off and back on from its card", "moves the switch at once and reverts it when the save fails", "saves the last choice when the switch is clicked again during a save".

## 7. Questions for the owner, with a recommendation

1. **One pull request, or two parts?** The batch is about the size of one part of the staff access batch. Recommended: one pull request. The alternative is two: keys, origins, OAuth clients, AI agents and the authorize page first; webhooks and integrations second.
2. **Does P2 run in this pull request?** Recommended: no. P2 runs after the owner accepts this batch, in its own pull request, as P3 and P6 ran after part 2. P2 needs a local webhook receiver, the agent server and the storefront's receiver, and carries G-16's webhook part, so keeping it apart keeps this batch to screens.
3. **Do the listing framework's stories belong here?** Recommended: yes, `resource-table` and `table-toolbar`, because this is the first batch whose screens use them and later batches reuse them. `bulk-action-bar` waits for a table with bulk actions (§2.3). The alternative is a separate small batch for the listing framework before this one.

## 8. Gaps known before the work starts

Recorded now so none is lost. The batch's record says which it closes.

| Gap | What would close it |
|---|---|
| Using a key, an OAuth client and the agent server from outside the dashboard, and a webhook delivered to a receiver (CAP-04-06 to CAP-04-08's function) | Platform step P2 |
| An endpoint disabled automatically after repeated failed deliveries, and EM-S-07 sent when it is, with the other email configuration G-16 keeps pending | P2, with G-16 |
| DA-SET-32 has no browser test that drives it: the approval is made through the API | A browser test that approves on the page; the batch's captures show its states |
| Integrations and payment providers that need a real account: only the test app's integration and test gateway are connected | Test keys for the providers (P4, OA-1) |
| What the server refuses to a role that may not read or write these resources | Criterion 12 records what Spree's specs exercise; the rest joins G-11 |
| Tenant isolation (criterion 13), including keys and endpoints belonging to another store | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 9. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. The screens create keys and secrets on the browser-test server, which is local and discarded after the run; criterion 14 keeps every one of them out of the repository.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
