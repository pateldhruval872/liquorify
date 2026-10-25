# FB-19 developer and integration settings batch: evidence

The captures, comparisons, email and backend results behind the [verification record](../../2026-10-24-fb-19-batch-developer-settings.md). They come from the scripts in `packages/liquorify-storybook/fidelity/` (`screens.spec.ts`, `compare.spec.ts`, with the data `developers.ts` and `staff.ts` add), from Spree's own mailer preview and from Spree's own specs. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Draft pull request [#16](https://github.com/pateldhruval872/liquorify/pull/16); the scripts ran from `95bc66f`, with the corrections to the stories that `7d41083`, the batch's revision, added. On 2026-10-25 the choice card picker's two cases and B16's reproduction ran from `aaf5346` |
| Running screens, the email and Spree's specs | Spree's code at `3081c8b`, which the pull request does not change: the built admin dashboard against the dashboard browser tests' own Rails server and fixtures |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels; comparisons at 1280 by 800, or 1280 by 2400 for the scope picker and the endpoint form; the email at 1280 pixels wide; B16's drawer in a 1280 by 800 window |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The screens show the browser tests' data, plus the roles, teammates, keys, clients, agent connections, origins, endpoints and test gateway the scripts add through the Admin API. Teammates use `example.com` addresses, and endpoints point at hosts under `.test`, which never resolve. Each capture's store is written as `<store>` and the endpoint as `<endpoint>` in its notes. **No key, token, client secret, webhook secret or password is recorded:** every such value on a screen is painted out before the screenshot, and the notes and result files hold none. OAuth client IDs are public identifiers and are shown.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role and its permissions, the theme, the revision, the path, the window's size, how a request was held, dropped or emptied to reach the state (`intercepted`), what was painted out (`masked`), whether the page settled, and every request blocked because it would have left the local servers (`outside`, empty in all 150) |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs |
| `emails/` | `EM-S-07.webp`, the endpoint disabled email rendered from Spree's preview, and `emails.json`: where and how it was rendered, its preview, template, subject and parts |
| `backend/` | `api-specs.json`, `mcp-specs.json` and `origins-specs.json`: every example of Spree's specs for the batch's endpoints, with its file, line, description and result |
| `b16-json-drawer/` | `<step>-<theme>.webp`, the JSON drawer after each step of B16's reproduction, and `b16-<theme>.json`: for each step, the control used, what its label leads one to expect, what the drawer showed and what the depth list read |

## Comparison with running screens, light and dark

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides, and the elements found on one side only; the verification record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-DA-G-01 | `admin-dashboard-api-keys-create-sheet--secret-key` | The create key sheet, as it opens | [dark](comparison/api-key-create-sheet-secret-key/dark-side-by-side.webp), [light](comparison/api-key-create-sheet-secret-key/light-side-by-side.webp) | [dark](comparison/api-key-create-sheet-secret-key/dark-styles.json), [light](comparison/api-key-create-sheet-secret-key/light-styles.json) | None |
| CMP-DA-G-01 | `admin-dashboard-api-keys-scope-picker--nothing-chosen` | The create sheet's scope picker, nothing chosen | [dark](comparison/api-key-scope-picker-nothing-chosen/dark-side-by-side.webp), [light](comparison/api-key-scope-picker-nothing-chosen/light-side-by-side.webp) | [dark](comparison/api-key-scope-picker-nothing-chosen/dark-styles.json), [light](comparison/api-key-scope-picker-nothing-chosen/light-styles.json) | height; 1 element on the screen only |
| CMP-DA-G-01 | `admin-dashboard-api-keys-edit-sheet--renaming` | The edit key sheet, its name being changed | [dark](comparison/api-key-edit-sheet-renaming/dark-side-by-side.webp), [light](comparison/api-key-edit-sheet-renaming/light-side-by-side.webp) | [dark](comparison/api-key-edit-sheet-renaming/dark-styles.json), [light](comparison/api-key-edit-sheet-renaming/light-styles.json) | None |
| CMP-DA-G-01 | `admin-dashboard-api-keys-token-reveal-dialog--new-secret-key` | A new secret key's token, shown once; the token painted out on both sides | [dark](comparison/api-key-token-reveal-dialog/dark-side-by-side.webp), [light](comparison/api-key-token-reveal-dialog/light-side-by-side.webp) | [dark](comparison/api-key-token-reveal-dialog/dark-styles.json), [light](comparison/api-key-token-reveal-dialog/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-24 | `admin-dashboard-ai-agents-agent-connections-card--connected` | Claude's card on the AI agents page, two people connected | [dark](comparison/agent-connections-card-connected/dark-side-by-side.webp), [light](comparison/agent-connections-card-connected/light-side-by-side.webp) | [dark](comparison/agent-connections-card-connected/dark-styles.json), [light](comparison/agent-connections-card-connected/light-styles.json) | height |
| CMP-DUI-P-30 | `dashboard-ui-primitives-popover--scope-list` | The rest of a connection's scopes, opened from its count | [dark](comparison/popover-scope-list/dark-side-by-side.webp), [light](comparison/popover-scope-list/light-side-by-side.webp) | [dark](comparison/popover-scope-list/dark-styles.json), [light](comparison/popover-scope-list/light-styles.json) | height |
| CMP-DA-G-24 | `admin-dashboard-ai-agents-connect-sheet--choose-an-agent` | The connect sheet, choosing an agent | [dark](comparison/connect-sheet-choose-an-agent/dark-side-by-side.webp), [light](comparison/connect-sheet-choose-an-agent/light-side-by-side.webp) | [dark](comparison/connect-sheet-choose-an-agent/dark-styles.json), [light](comparison/connect-sheet-choose-an-agent/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-ai-agents-choice-card-picker--first-chosen` | The connect sheet's choice of agent, Claude chosen, focus moved off it; run again on 2026-10-25 from `aaf5346` | [dark](comparison/choice-card-picker-first-chosen/dark-side-by-side.webp), [light](comparison/choice-card-picker-first-chosen/light-side-by-side.webp) | [dark](comparison/choice-card-picker-first-chosen/dark-styles.json), [light](comparison/choice-card-picker-first-chosen/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-ai-agents-choice-card-picker--focus-visible` | The connect sheet's choice of agent as it opens, focus on Claude's radio; added on 2026-10-25, run from `aaf5346` | [dark](comparison/choice-card-picker-focused/dark-side-by-side.webp), [light](comparison/choice-card-picker-focused/light-side-by-side.webp) | [dark](comparison/choice-card-picker-focused/dark-styles.json), [light](comparison/choice-card-picker-focused/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-ai-agents-connect-sheet--claude-ready` | The connect sheet, Claude ready to connect | [dark](comparison/connect-sheet-claude-ready/dark-side-by-side.webp), [light](comparison/connect-sheet-claude-ready/light-side-by-side.webp) | [dark](comparison/connect-sheet-claude-ready/dark-styles.json), [light](comparison/connect-sheet-claude-ready/light-styles.json) | None |
| CMP-DUI-C-11 | `dashboard-ui-composed-copy-to-clipboard-button--icon` | The connect sheet's Copy address button | [dark](comparison/copy-to-clipboard-button-icon/dark-side-by-side.webp), [light](comparison/copy-to-clipboard-button-icon/light-side-by-side.webp) | [dark](comparison/copy-to-clipboard-button-icon/dark-styles.json), [light](comparison/copy-to-clipboard-button-icon/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-oauth-clients-client-sheet--register` | The register a client sheet | [dark](comparison/client-sheet-register/dark-side-by-side.webp), [light](comparison/client-sheet-register/light-side-by-side.webp) | [dark](comparison/client-sheet-register/dark-styles.json), [light](comparison/client-sheet-register/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-oauth-clients-client-sheet--callback-refused` | The register sheet, a callback that is not https refused by the server | [dark](comparison/client-sheet-callback-refused/dark-side-by-side.webp), [light](comparison/client-sheet-callback-refused/light-side-by-side.webp) | [dark](comparison/client-sheet-callback-refused/dark-styles.json), [light](comparison/client-sheet-callback-refused/light-styles.json) | None |
| CMP-CORE-26 | `dashboard-core-resource-table--listed` | The allowed origins table | [dark](comparison/resource-table-allowed-origins/dark-side-by-side.webp), [light](comparison/resource-table-allowed-origins/light-side-by-side.webp) | [dark](comparison/resource-table-allowed-origins/dark-styles.json), [light](comparison/resource-table-allowed-origins/light-styles.json) | None |
| CMP-CORE-37 | `dashboard-core-table-toolbar--default` | The allowed origins table's toolbar | [dark](comparison/table-toolbar-allowed-origins/dark-side-by-side.webp), [light](comparison/table-toolbar-allowed-origins/light-side-by-side.webp) | [dark](comparison/table-toolbar-allowed-origins/dark-styles.json), [light](comparison/table-toolbar-allowed-origins/light-styles.json) | None |
| CMP-CORE-26 | `dashboard-core-resource-table--webhook-endpoints` | The webhook endpoints table | [dark](comparison/resource-table-webhook-endpoints/dark-side-by-side.webp), [light](comparison/resource-table-webhook-endpoints/light-side-by-side.webp) | [dark](comparison/resource-table-webhook-endpoints/dark-styles.json), [light](comparison/resource-table-webhook-endpoints/light-styles.json) | height; light, 4 elements in the story only; dark, 1 element in the story only |
| CMP-DUI-C-42 | `dashboard-ui-composed-resource-name-cell--openable` | An endpoint's name in the webhooks table | [dark](comparison/resource-name-cell-openable/dark-side-by-side.webp), [light](comparison/resource-name-cell-openable/light-side-by-side.webp) | [dark](comparison/resource-name-cell-openable/dark-styles.json), [light](comparison/resource-name-cell-openable/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-webhooks-endpoint-form--all-events` | The new endpoint sheet, all events | [dark](comparison/endpoint-form-all-events/dark-side-by-side.webp), [light](comparison/endpoint-form-all-events/light-side-by-side.webp) | [dark](comparison/endpoint-form-all-events/dark-styles.json), [light](comparison/endpoint-form-all-events/light-styles.json) | border-bottom-color, border-top-color, box-shadow, height; 1 element on the screen only, 1 element in the story only |
| CMP-DUI-C-40 | `dashboard-ui-composed-resource-layout--two-columns` | A webhook endpoint's page | [dark](comparison/resource-layout-endpoint/dark-side-by-side.webp), [light](comparison/resource-layout-endpoint/light-side-by-side.webp) | [dark](comparison/resource-layout-endpoint/dark-styles.json), [light](comparison/resource-layout-endpoint/light-styles.json) | font-size, height, line-height; 72 elements on the screen only, 5 elements in the story only |
| CMP-DUI-C-27 | `dashboard-ui-composed-json-preview-drawer--loaded` | An endpoint's record, viewed as JSON | [dark](comparison/json-preview-drawer-loaded/dark-side-by-side.webp), [light](comparison/json-preview-drawer-loaded/light-side-by-side.webp) | [dark](comparison/json-preview-drawer-loaded/dark-styles.json), [light](comparison/json-preview-drawer-loaded/light-styles.json) | border-bottom-color, border-top-color, box-shadow, height |
| CMP-DUI-C-28 | `dashboard-ui-composed-json-value-view--payload` | A test delivery's payload, in its details sheet | [dark](comparison/json-value-view-payload/dark-side-by-side.webp), [light](comparison/json-value-view-payload/light-side-by-side.webp) | [dark](comparison/json-value-view-payload/dark-styles.json), [light](comparison/json-value-view-payload/light-styles.json) | height; 4 elements in the story only |
| CMP-DA-G-10 | `admin-dashboard-integrations-integration-card--active` | E2E Relay's card, connected and active | [dark](comparison/integration-card-active/dark-side-by-side.webp), [light](comparison/integration-card-active/light-side-by-side.webp) | [dark](comparison/integration-card-active/dark-styles.json), [light](comparison/integration-card-active/light-styles.json) | height; 4 elements in the story only |
| CMP-DA-G-10 | `admin-dashboard-integrations-integration-card--not-connected` | E2E Relay's card, not connected | [dark](comparison/integration-card-not-connected/dark-side-by-side.webp), [light](comparison/integration-card-not-connected/light-side-by-side.webp) | [dark](comparison/integration-card-not-connected/dark-styles.json), [light](comparison/integration-card-not-connected/light-styles.json) | height; 4 elements in the story only |
| CMP-DA-G-10 | `admin-dashboard-integrations-configure-sheet--connect` | E2E Relay's sheet, connecting | [dark](comparison/configure-sheet-connect/dark-side-by-side.webp), [light](comparison/configure-sheet-connect/light-side-by-side.webp) | [dark](comparison/configure-sheet-connect/dark-styles.json), [light](comparison/configure-sheet-connect/light-styles.json) | border-bottom-color, border-top-color, box-shadow, color, font-weight, height; 2 elements in the story only |
| CMP-CORE-22 | `dashboard-core-preferences-form--new-connection` | E2E Relay's settings, connecting | [dark](comparison/preferences-form-new-connection/dark-side-by-side.webp), [light](comparison/preferences-form-new-connection/light-side-by-side.webp) | [dark](comparison/preferences-form-new-connection/dark-styles.json), [light](comparison/preferences-form-new-connection/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-10 | `admin-dashboard-integrations-configure-sheet--configure` | E2E Relay's sheet, connected | [dark](comparison/configure-sheet-configure/dark-side-by-side.webp), [light](comparison/configure-sheet-configure/light-side-by-side.webp) | [dark](comparison/configure-sheet-configure/dark-styles.json), [light](comparison/configure-sheet-configure/light-styles.json) | background-color, border-bottom-color, border-top-color, box-shadow, color, font-weight, height; 2 elements in the story only |
| CMP-DUI-C-48 | `dashboard-ui-composed-secret-input--stored` | E2E Relay's stored secret, masked by the server | [dark](comparison/secret-input-stored/dark-side-by-side.webp), [light](comparison/secret-input-stored/light-side-by-side.webp) | [dark](comparison/secret-input-stored/dark-styles.json), [light](comparison/secret-input-stored/light-styles.json) | None |

## Screens, by state and variant

Each state of the eight screens as it runs, light and dark. The variant names who is signed in:

- **admin** is the browser tests' admin, who holds every permission.
- **developerViewer** is a teammate whose role, added by `fidelity/staff.ts`, reads the five scopes of these screens and writes none.
- **orderManager** is a teammate with the order manager template's role, which holds none of the five; each of its captures is a direct visit to the page's address.
- **agentConnector** is a teammate whose role may connect agents and read products, so the authorize page withholds what it asks for beyond that.

| Screen | State | Captures |
|---|---|---|
| DA-SET-07 | connect-claude-code | [admin](screens/DA-SET-07/connect-claude-code/admin-light.webp) ([dark](screens/DA-SET-07/connect-claude-code/admin-dark.webp)) |
| DA-SET-07 | connect-ready | [admin](screens/DA-SET-07/connect-ready/admin-light.webp) ([dark](screens/DA-SET-07/connect-ready/admin-dark.webp)) |
| DA-SET-07 | connect-sheet | [admin](screens/DA-SET-07/connect-sheet/admin-light.webp) ([dark](screens/DA-SET-07/connect-sheet/admin-dark.webp)) |
| DA-SET-07 | connect-something-else | [admin](screens/DA-SET-07/connect-something-else/admin-light.webp) ([dark](screens/DA-SET-07/connect-something-else/admin-dark.webp)) |
| DA-SET-07 | connected | [admin](screens/DA-SET-07/connected/admin-light.webp) ([dark](screens/DA-SET-07/connected/admin-dark.webp)), [developerViewer](screens/DA-SET-07/connected/developerViewer-light.webp) ([dark](screens/DA-SET-07/connected/developerViewer-dark.webp)) |
| DA-SET-07 | direct-visit | [orderManager](screens/DA-SET-07/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-07/direct-visit/orderManager-dark.webp)) |
| DA-SET-07 | nothing-connected | [admin](screens/DA-SET-07/nothing-connected/admin-light.webp) ([dark](screens/DA-SET-07/nothing-connected/admin-dark.webp)) |
| DA-SET-07 | revoke-confirmation | [admin](screens/DA-SET-07/revoke-confirmation/admin-light.webp) ([dark](screens/DA-SET-07/revoke-confirmation/admin-dark.webp)) |
| DA-SET-07 | unknown-person | [admin](screens/DA-SET-07/unknown-person/admin-light.webp) ([dark](screens/DA-SET-07/unknown-person/admin-dark.webp)) |
| DA-SET-10 | configure-sheet | [admin](screens/DA-SET-10/configure-sheet/admin-light.webp) ([dark](screens/DA-SET-10/configure-sheet/admin-dark.webp)) |
| DA-SET-10 | connect-sheet-secret-hidden | [admin](screens/DA-SET-10/connect-sheet-secret-hidden/admin-light.webp) ([dark](screens/DA-SET-10/connect-sheet-secret-hidden/admin-dark.webp)) |
| DA-SET-10 | connect-sheet-secret-shown | [admin](screens/DA-SET-10/connect-sheet-secret-shown/admin-light.webp) ([dark](screens/DA-SET-10/connect-sheet-secret-shown/admin-dark.webp)) |
| DA-SET-10 | connected | [admin](screens/DA-SET-10/connected/admin-light.webp) ([dark](screens/DA-SET-10/connected/admin-dark.webp)), [developerViewer](screens/DA-SET-10/connected/developerViewer-light.webp) ([dark](screens/DA-SET-10/connected/developerViewer-dark.webp)) |
| DA-SET-10 | connected-inactive | [admin](screens/DA-SET-10/connected-inactive/admin-light.webp) ([dark](screens/DA-SET-10/connected-inactive/admin-dark.webp)) |
| DA-SET-10 | direct-visit | [orderManager](screens/DA-SET-10/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-10/direct-visit/orderManager-dark.webp)) |
| DA-SET-10 | disconnect-confirmation | [admin](screens/DA-SET-10/disconnect-confirmation/admin-light.webp) ([dark](screens/DA-SET-10/disconnect-confirmation/admin-dark.webp)) |
| DA-SET-10 | not-connected | [admin](screens/DA-SET-10/not-connected/admin-light.webp) ([dark](screens/DA-SET-10/not-connected/admin-dark.webp)) |
| DA-SET-10 | payment-provider-off | [admin](screens/DA-SET-10/payment-provider-off/admin-light.webp) ([dark](screens/DA-SET-10/payment-provider-off/admin-dark.webp)) |
| DA-SET-10 | switch-moved-while-saving | [admin](screens/DA-SET-10/switch-moved-while-saving/admin-light.webp) ([dark](screens/DA-SET-10/switch-moved-while-saving/admin-dark.webp)) |
| DA-SET-10 | switch-reverted | [admin](screens/DA-SET-10/switch-reverted/admin-light.webp) ([dark](screens/DA-SET-10/switch-reverted/admin-dark.webp)) |
| DA-SET-26 | create-chosen-scopes | [admin](screens/DA-SET-26/create-chosen-scopes/admin-light.webp) ([dark](screens/DA-SET-26/create-chosen-scopes/admin-dark.webp)) |
| DA-SET-26 | create-full-access | [admin](screens/DA-SET-26/create-full-access/admin-light.webp) ([dark](screens/DA-SET-26/create-full-access/admin-dark.webp)) |
| DA-SET-26 | create-sheet | [admin](screens/DA-SET-26/create-sheet/admin-light.webp) ([dark](screens/DA-SET-26/create-sheet/admin-dark.webp)), [developerViewer](screens/DA-SET-26/create-sheet/developerViewer-light.webp) ([dark](screens/DA-SET-26/create-sheet/developerViewer-dark.webp)) |
| DA-SET-26 | delete-confirmation | [admin](screens/DA-SET-26/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-26/delete-confirmation/admin-dark.webp)) |
| DA-SET-26 | direct-visit | [orderManager](screens/DA-SET-26/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-26/direct-visit/orderManager-dark.webp)) |
| DA-SET-26 | edit-renaming | [admin](screens/DA-SET-26/edit-renaming/admin-light.webp) ([dark](screens/DA-SET-26/edit-renaming/admin-dark.webp)) |
| DA-SET-26 | listed | [admin](screens/DA-SET-26/listed/admin-light.webp) ([dark](screens/DA-SET-26/listed/admin-dark.webp)), [developerViewer](screens/DA-SET-26/listed/developerViewer-light.webp) ([dark](screens/DA-SET-26/listed/developerViewer-dark.webp)) |
| DA-SET-26 | revoke-confirmation | [admin](screens/DA-SET-26/revoke-confirmation/admin-light.webp) ([dark](screens/DA-SET-26/revoke-confirmation/admin-dark.webp)) |
| DA-SET-26 | token-shown-once | [admin](screens/DA-SET-26/token-shown-once/admin-light.webp) ([dark](screens/DA-SET-26/token-shown-once/admin-dark.webp)) |
| DA-SET-27 | callback-refused | [admin](screens/DA-SET-27/callback-refused/admin-light.webp) ([dark](screens/DA-SET-27/callback-refused/admin-dark.webp)) |
| DA-SET-27 | direct-visit | [orderManager](screens/DA-SET-27/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-27/direct-visit/orderManager-dark.webp)) |
| DA-SET-27 | listed | [admin](screens/DA-SET-27/listed/admin-light.webp) ([dark](screens/DA-SET-27/listed/admin-dark.webp)), [developerViewer](screens/DA-SET-27/listed/developerViewer-light.webp) ([dark](screens/DA-SET-27/listed/developerViewer-dark.webp)) |
| DA-SET-27 | none | [admin](screens/DA-SET-27/none/admin-light.webp) ([dark](screens/DA-SET-27/none/admin-dark.webp)) |
| DA-SET-27 | register-sheet | [admin](screens/DA-SET-27/register-sheet/admin-light.webp) ([dark](screens/DA-SET-27/register-sheet/admin-dark.webp)) |
| DA-SET-27 | remove-confirmation | [admin](screens/DA-SET-27/remove-confirmation/admin-light.webp) ([dark](screens/DA-SET-27/remove-confirmation/admin-dark.webp)) |
| DA-SET-27 | rename | [admin](screens/DA-SET-27/rename/admin-light.webp) ([dark](screens/DA-SET-27/rename/admin-dark.webp)) |
| DA-SET-28 | create-all-events | [admin](screens/DA-SET-28/create-all-events/admin-light.webp) ([dark](screens/DA-SET-28/create-all-events/admin-dark.webp)) |
| DA-SET-28 | create-chosen-events | [admin](screens/DA-SET-28/create-chosen-events/admin-light.webp) ([dark](screens/DA-SET-28/create-chosen-events/admin-dark.webp)) |
| DA-SET-28 | delete-confirmation | [admin](screens/DA-SET-28/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-28/delete-confirmation/admin-dark.webp)) |
| DA-SET-28 | direct-visit | [orderManager](screens/DA-SET-28/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-28/direct-visit/orderManager-dark.webp)) |
| DA-SET-28 | events-failed | [admin](screens/DA-SET-28/events-failed/admin-light.webp) ([dark](screens/DA-SET-28/events-failed/admin-dark.webp)) |
| DA-SET-28 | listed | [admin](screens/DA-SET-28/listed/admin-light.webp) ([dark](screens/DA-SET-28/listed/admin-dark.webp)), [developerViewer](screens/DA-SET-28/listed/developerViewer-light.webp) ([dark](screens/DA-SET-28/listed/developerViewer-dark.webp)) |
| DA-SET-28 | none | [admin](screens/DA-SET-28/none/admin-light.webp) ([dark](screens/DA-SET-28/none/admin-dark.webp)) |
| DA-SET-28 | secret-shown-once | [admin](screens/DA-SET-28/secret-shown-once/admin-light.webp) ([dark](screens/DA-SET-28/secret-shown-once/admin-dark.webp)) |
| DA-SET-29 | delivery-details | [admin](screens/DA-SET-29/delivery-details/admin-light.webp) ([dark](screens/DA-SET-29/delivery-details/admin-dark.webp)) |
| DA-SET-29 | details-and-deliveries | [admin](screens/DA-SET-29/details-and-deliveries/admin-light.webp) ([dark](screens/DA-SET-29/details-and-deliveries/admin-dark.webp)), [developerViewer](screens/DA-SET-29/details-and-deliveries/developerViewer-light.webp) ([dark](screens/DA-SET-29/details-and-deliveries/developerViewer-dark.webp)) |
| DA-SET-29 | disabled-with-reason | [admin](screens/DA-SET-29/disabled-with-reason/admin-light.webp) ([dark](screens/DA-SET-29/disabled-with-reason/admin-dark.webp)) |
| DA-SET-29 | no-deliveries | [admin](screens/DA-SET-29/no-deliveries/admin-light.webp) ([dark](screens/DA-SET-29/no-deliveries/admin-dark.webp)) |
| DA-SET-29 | not-found | [admin](screens/DA-SET-29/not-found/admin-light.webp) ([dark](screens/DA-SET-29/not-found/admin-dark.webp)) |
| DA-SET-29 | rename | [admin](screens/DA-SET-29/rename/admin-light.webp) ([dark](screens/DA-SET-29/rename/admin-dark.webp)) |
| DA-SET-29 | test-failed | [admin](screens/DA-SET-29/test-failed/admin-light.webp) ([dark](screens/DA-SET-29/test-failed/admin-dark.webp)) |
| DA-SET-29 | test-sent | [admin](screens/DA-SET-29/test-sent/admin-light.webp) ([dark](screens/DA-SET-29/test-sent/admin-dark.webp)) |
| DA-SET-30 | create-sheet | [admin](screens/DA-SET-30/create-sheet/admin-light.webp) ([dark](screens/DA-SET-30/create-sheet/admin-dark.webp)) |
| DA-SET-30 | delete-confirmation | [admin](screens/DA-SET-30/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-30/delete-confirmation/admin-dark.webp)) |
| DA-SET-30 | direct-visit | [orderManager](screens/DA-SET-30/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-30/direct-visit/orderManager-dark.webp)) |
| DA-SET-30 | edit | [admin](screens/DA-SET-30/edit/admin-light.webp) ([dark](screens/DA-SET-30/edit/admin-dark.webp)) |
| DA-SET-30 | listed | [admin](screens/DA-SET-30/listed/admin-light.webp) ([dark](screens/DA-SET-30/listed/admin-dark.webp)), [developerViewer](screens/DA-SET-30/listed/developerViewer-light.webp) ([dark](screens/DA-SET-30/listed/developerViewer-dark.webp)) |
| DA-SET-30 | malformed-refused | [admin](screens/DA-SET-30/malformed-refused/admin-light.webp) ([dark](screens/DA-SET-30/malformed-refused/admin-dark.webp)) |
| DA-SET-30 | none | [admin](screens/DA-SET-30/none/admin-light.webp) ([dark](screens/DA-SET-30/none/admin-dark.webp)) |
| DA-SET-30 | nothing-found | [admin](screens/DA-SET-30/nothing-found/admin-light.webp) ([dark](screens/DA-SET-30/nothing-found/admin-dark.webp)) |
| DA-SET-32 | approving | [admin](screens/DA-SET-32/approving/admin-light.webp) ([dark](screens/DA-SET-32/approving/admin-dark.webp)) |
| DA-SET-32 | decision-failed | [admin](screens/DA-SET-32/decision-failed/admin-light.webp) ([dark](screens/DA-SET-32/decision-failed/admin-dark.webp)) |
| DA-SET-32 | invalid-request | [admin](screens/DA-SET-32/invalid-request/admin-light.webp) ([dark](screens/DA-SET-32/invalid-request/admin-dark.webp)) |
| DA-SET-32 | not-permitted | [developerViewer](screens/DA-SET-32/not-permitted/developerViewer-light.webp) ([dark](screens/DA-SET-32/not-permitted/developerViewer-dark.webp)) |
| DA-SET-32 | permissions-requested | [admin](screens/DA-SET-32/permissions-requested/admin-light.webp) ([dark](screens/DA-SET-32/permissions-requested/admin-dark.webp)) |
| DA-SET-32 | permissions-withheld | [agentConnector](screens/DA-SET-32/permissions-withheld/agentConnector-light.webp) ([dark](screens/DA-SET-32/permissions-withheld/agentConnector-dark.webp)) |
| DA-SET-32 | refusing | [admin](screens/DA-SET-32/refusing/admin-light.webp) ([dark](screens/DA-SET-32/refusing/admin-dark.webp)) |

## B16 on the running dashboard

Added on 2026-10-25. `fidelity/json-drawer.spec.ts`, run from `aaf5346`, opened the order sync endpoint's record in the JSON drawer and used each control in turn ([record §5.1](../../2026-10-24-fb-19-batch-developer-settings.md#51-b16-on-the-running-dashboard)). The drawer keeps its dark surface in both themes. Notes: [light](b16-json-drawer/b16-light.json), [dark](b16-json-drawer/b16-dark.json).

| Step | Control used | Expected | Shown | Captures |
|---|---|---|---|---|
| 1 | None, as the drawer opens | Everything | Everything | [light](b16-json-drawer/opened-light.webp), [dark](b16-json-drawer/opened-dark.webp) |
| 2 | The Expand all button | Everything | The record folded to one line | [light](b16-json-drawer/expand-all-button-light.webp), [dark](b16-json-drawer/expand-all-button-dark.webp) |
| 3 | Depth 1, in the depth list | The fields, subscriptions folded | The same | [light](b16-json-drawer/depth-1-light.webp), [dark](b16-json-drawer/depth-1-dark.webp) |
| 4 | The Collapse all button | The record folded to one line | Everything | [light](b16-json-drawer/collapse-all-button-light.webp), [dark](b16-json-drawer/collapse-all-button-dark.webp) |
| 5 | Expand all, in the depth list | Everything | The record folded to one line | [light](b16-json-drawer/expand-all-option-light.webp), [dark](b16-json-drawer/expand-all-option-dark.webp) |
| 6 | Collapse all, in the depth list | The record folded to one line | Everything | [light](b16-json-drawer/collapse-all-option-light.webp), [dark](b16-json-drawer/collapse-all-option-dark.webp) |

## Email

| ID | Capture | Notes |
|---|---|---|
| EM-S-07 | [light](emails/EM-S-07.webp) | [emails.json](emails/emails.json): rendered from `Spree::WebhookPreview#endpoint_disabled` in the dashboard browser tests' Rails app, in its test environment, against a copy of its database inside a transaction rolled back afterwards. Subject "Webhook endpoint disabled: Example endpoint"; a plain text and an HTML part; sent to the store's own address. The template has no dark styles |

## Backend

| File | What it holds | Result |
|---|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's API specs for the batch's endpoints at `3081c8b`: `oauth_access_spec.rb` (19), `api_keys_controller_spec.rb` (16), `webhook_endpoints_controller_spec.rb` (15), `applications_spec.rb` (12), `integrations_controller_spec.rb` (11), `webhook_deliveries_controller_spec.rb` (9), `authorizations_spec.rb` (6), `webhook_events_controller_spec.rb` (4), `api_key_authentication_spec.rb` (3) | 95 examples, all passed |
| [mcp-specs.json](backend/mcp-specs.json) | Spree's spec for the agent server at `3081c8b`: `mcp_spec.rb` (26) | 26 examples, all passed |
| [origins-specs.json](backend/origins-specs.json) | Spree's integration spec for allowed origins at `3081c8b`, beyond the work item's list: `allowed_origins_spec.rb` (9) | 9 examples, all passed |

These are observations at one revision. Spree's specs are Spree's own unit checks; they ran on SQLite in this session, and CI runs Spree's suites on PostgreSQL and MySQL.
