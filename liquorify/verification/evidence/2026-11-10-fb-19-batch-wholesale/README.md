# FB-19 batch 12 part 1, wholesale in the dashboard: evidence

The captures, comparisons, checks, emails and backend results behind the [verification record](../../2026-11-10-fb-19-batch-wholesale.md). They come from the scripts in `packages/liquorify-storybook/fidelity/`: `companies.ts`, which makes the wholesale data on the browser-test server; `screens-batch-12.spec.ts`, which captures the running screens; `compare-batch-12.spec.ts`, which compares the stories with them; `wholesale-checks.spec.ts`, which checks what the screens save where it takes effect; and `company-emails.rb` with `order-emails.spec.ts`, which render and capture the invitation email.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Branch `claude/project-thread-qike5i`, from `main` at `a3a427fc`. The final commit is named in the merge record |
| Running screens and Spree's specs | Spree's code at `a3a427fc`; the pull request does not change it. The built admin dashboard against the dashboard browser tests' own Rails server and fixtures (the browser-test server). The email was rendered and sent on the emails gem's test app against a copy of that server's database. The storefront at its `main`, `4a4324e`, unchanged, only to follow the email's link |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels, and 390 by 844 for the phone capture; a page captured whole grows the window to the page's height |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. All 196 were checked pixel for pixel against their PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The browser-test server shows the browser tests' data plus the companies, buyers, addresses, certificates, trade products, catalog and price list and the four roles the scripts add through the Admin and Store APIs. Every company, person and address the scripts add is invented and uses `example.com`. The store's address in each page's path is shown as `<store>`. The invitation's token is never written out, and in the email it reads `<token>`, with the storefront's address as `<site>`.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role and its permissions, the theme, the path, the window's size, whether the page was captured whole, how a request was answered or held in the browser (`intercepted`), the earlier batch a hand-off came from, and any request outside the server that was blocked |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, how many were compared, those found on one side only, and every style that differs |
| `checks/` | One answer file per row of the work item's §2.4: `purchase-order.json`, `members-and-invitations.json`, `certificates-and-tax.json`, `address-book.json` and `prices.json`, and `invitation-link.json` with `invitation-link/`, the storefront pages the email's link led to |
| `emails/` | EM-C-11's HTML part, captured at 390 and 1280 pixels, and `emails.json` with its subject, parts and links, and what the emails gem delivered when staff invited an email with no account, with recipients counted |
| `backend/` | Spree's spec results as RSpec JSON: `api-specs.json` (209 examples), `core-specs.json` (295) and `email-specs.json` (7). The path of the installed gems is shown as `<gems>` |
| `screens-run.txt`, `comparison-run.txt`, `checks-run.txt` | The logs of the capture, comparison, email and check runs, with what was run again |

## Comparison with running screens, light and dark

| Case | Inventory ID | Story | Elements compared | Differences | Images |
|---|---|---|---|---|---|
| b12-certificates-card | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--each-status` | 26 | 7 light, 7 dark; explained in the record §4 | [light](comparison/b12-certificates-card/light-side-by-side.webp) · [dark](comparison/b12-certificates-card/dark-side-by-side.webp) |
| b12-certificates-card-accepted-menu | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--accepted-menu` | 5 | none | [light](comparison/b12-certificates-card-accepted-menu/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-accepted-menu/dark-side-by-side.webp) |
| b12-certificates-card-add-sheet | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--add-sheet` | 40 | none | [light](comparison/b12-certificates-card-add-sheet/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-add-sheet/dark-side-by-side.webp) |
| b12-certificates-card-delete-confirm | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--delete-confirm` | 7 | 3 light, 3 dark; explained in the record §4 | [light](comparison/b12-certificates-card-delete-confirm/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-delete-confirm/dark-side-by-side.webp) |
| b12-certificates-card-none | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--none` | 9 | none | [light](comparison/b12-certificates-card-none/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-none/dark-side-by-side.webp) |
| b12-certificates-card-pending-menu | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--pending-menu` | 7 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-certificates-card-pending-menu/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-pending-menu/dark-side-by-side.webp) |
| b12-certificates-card-read-only | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--read-only` | 19 | 8 light, 8 dark; explained in the record §4 | [light](comparison/b12-certificates-card-read-only/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-read-only/dark-side-by-side.webp) |
| b12-certificates-card-reasons-listed | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--reasons-listed` | 74 | 39 light, 39 dark; explained in the record §4 | [light](comparison/b12-certificates-card-reasons-listed/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-reasons-listed/dark-side-by-side.webp) |
| b12-certificates-card-required | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--required` | 41 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-certificates-card-required/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-required/dark-side-by-side.webp) |
| b12-certificates-card-revoke-confirm | CMP-DA-G-24 | `admin-dashboard-companies-tax-exemption-certificates-card--revoke-confirm` | 7 | 3 light, 3 dark; explained in the record §4 | [light](comparison/b12-certificates-card-revoke-confirm/light-side-by-side.webp) · [dark](comparison/b12-certificates-card-revoke-confirm/dark-side-by-side.webp) |
| b12-company-address-sheet-add | CMP-DA-G-24 | `admin-dashboard-companies-company-address-sheet--add` | 31 | none | [light](comparison/b12-company-address-sheet-add/light-side-by-side.webp) · [dark](comparison/b12-company-address-sheet-add/dark-side-by-side.webp) |
| b12-company-address-sheet-edit | CMP-DA-G-24 | `admin-dashboard-companies-company-address-sheet--edit` | 30 | none | [light](comparison/b12-company-address-sheet-edit/light-side-by-side.webp) · [dark](comparison/b12-company-address-sheet-edit/dark-side-by-side.webp) |
| b12-company-address-sheet-state-missing | CMP-DA-G-24 | `admin-dashboard-companies-company-address-sheet--state-missing` | 32 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-company-address-sheet-state-missing/light-side-by-side.webp) · [dark](comparison/b12-company-address-sheet-state-missing/dark-side-by-side.webp) |
| b12-company-kind-badge-company | CMP-DA-G-24 | `admin-dashboard-companies-company-kind-badge--company` | 1 | none | [light](comparison/b12-company-kind-badge-company/light-side-by-side.webp) · [dark](comparison/b12-company-kind-badge-company/dark-side-by-side.webp) |
| b12-company-kind-badge-division | CMP-DA-G-24 | `admin-dashboard-companies-company-kind-badge--division` | 1 | none | [light](comparison/b12-company-kind-badge-division/light-side-by-side.webp) · [dark](comparison/b12-company-kind-badge-division/dark-side-by-side.webp) |
| b12-earlier-address-book-row-default-for-both | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--default-for-both` | 10 | 4 light, 4 dark; explained in the record §4 | [light](comparison/b12-earlier-address-book-row-default-for-both/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-default-for-both/dark-side-by-side.webp) |
| b12-earlier-address-book-row-default-shipping | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--default-shipping` | 10 | 5 light, 5 dark; explained in the record §4 | [light](comparison/b12-earlier-address-book-row-default-shipping/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-default-shipping/dark-side-by-side.webp) |
| b12-earlier-address-book-row-menu-on-default | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--menu-on-default` | 5 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-earlier-address-book-row-menu-on-default/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-menu-on-default/dark-side-by-side.webp) |
| b12-earlier-address-book-row-menu-without-defaults | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--menu-without-defaults` | 5 | none | [light](comparison/b12-earlier-address-book-row-menu-without-defaults/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-menu-without-defaults/dark-side-by-side.webp) |
| b12-earlier-address-book-row-plain | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--plain` | 8 | 4 light, 4 dark; explained in the record §4 | [light](comparison/b12-earlier-address-book-row-plain/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-plain/dark-side-by-side.webp) |
| b12-earlier-address-book-row-read-only | CMP-DUI-C-02 | `dashboard-ui-composed-address-book-row--read-only` | 5 | 4 light, 4 dark; explained in the record §4 | [light](comparison/b12-earlier-address-book-row-read-only/light-side-by-side.webp) · [dark](comparison/b12-earlier-address-book-row-read-only/dark-side-by-side.webp) |
| b12-earlier-customer-groups-card-changed | CMP-DA-G-07 | `admin-dashboard-customers-customer-groups-card--changed` | 18 | 4 light, 4 dark; explained in the record §4 | [light](comparison/b12-earlier-customer-groups-card-changed/light-side-by-side.webp) · [dark](comparison/b12-earlier-customer-groups-card-changed/dark-side-by-side.webp) |
| b12-earlier-customer-internal-note-card-editing-empty | CMP-DA-G-07 | `admin-dashboard-customers-customer-internal-note-card--editing-empty` | 28 | none | [light](comparison/b12-earlier-customer-internal-note-card-editing-empty/light-side-by-side.webp) · [dark](comparison/b12-earlier-customer-internal-note-card-editing-empty/dark-side-by-side.webp) |
| b12-earlier-customer-profile-card-email-taken | CMP-DA-G-07 | `admin-dashboard-customers-customer-profile-card--email-taken` | 28 | 13 light, 13 dark; explained in the record §4 | [light](comparison/b12-earlier-customer-profile-card-email-taken/light-side-by-side.webp) · [dark](comparison/b12-earlier-customer-profile-card-email-taken/dark-side-by-side.webp) |
| b12-earlier-customer-tax-identifiers-card-read-only | CMP-DA-G-07 | `admin-dashboard-customers-customer-tax-identifiers-card--read-only` | 4 | 2 light, 2 dark; explained in the record §4 | [light](comparison/b12-earlier-customer-tax-identifiers-card-read-only/light-side-by-side.webp) · [dark](comparison/b12-earlier-customer-tax-identifiers-card-read-only/dark-side-by-side.webp) |
| b12-earlier-customer-tax-identifiers-card-refused | CMP-DA-G-07 | `admin-dashboard-customers-customer-tax-identifiers-card--refused` | 26 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-earlier-customer-tax-identifiers-card-refused/light-side-by-side.webp) · [dark](comparison/b12-earlier-customer-tax-identifiers-card-refused/dark-side-by-side.webp) |
| b12-earlier-da-tax-identifiers-card-refused | CMP-DA-G-24 | `admin-dashboard-customers-tax-identifiers-card--refused` | 26 | 1 light, 1 dark; explained in the record §4 | [light](comparison/b12-earlier-da-tax-identifiers-card-refused/light-side-by-side.webp) · [dark](comparison/b12-earlier-da-tax-identifiers-card-refused/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-add-sheet | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--add-sheet` | 25 | none | [light](comparison/b12-earlier-tax-identifiers-card-add-sheet/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-add-sheet/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-custom-kind | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--custom-kind` | 25 | none | [light](comparison/b12-earlier-tax-identifiers-card-custom-kind/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-custom-kind/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-delete-confirm | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--delete-confirm` | 7 | 3 light, 3 dark; explained in the record §4 | [light](comparison/b12-earlier-tax-identifiers-card-delete-confirm/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-delete-confirm/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-edit-sheet | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--edit-sheet` | 25 | none | [light](comparison/b12-earlier-tax-identifiers-card-edit-sheet/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-edit-sheet/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-empty | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--empty` | 9 | none | [light](comparison/b12-earlier-tax-identifiers-card-empty/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-empty/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-kind-options | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--kind-options` | 44 | 29 light, 29 dark; explained in the record §4 | [light](comparison/b12-earlier-tax-identifiers-card-kind-options/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-kind-options/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-read-only | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--read-only` | 11 | 6 light, 6 dark; explained in the record §4 | [light](comparison/b12-earlier-tax-identifiers-card-read-only/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-read-only/dark-side-by-side.webp) |
| b12-earlier-tax-identifiers-card-required | CMP-DUI-C-51 | `dashboard-ui-composed-tax-identifiers-card--required` | 26 | 2 light, 2 dark; explained in the record §4 | [light](comparison/b12-earlier-tax-identifiers-card-required/light-side-by-side.webp) · [dark](comparison/b12-earlier-tax-identifiers-card-required/dark-side-by-side.webp) |
| b12-enterprise-upsell | CMP-DA-G-24 | `admin-dashboard-companies-enterprise-upsell--company-roles` | 8 | none | [light](comparison/b12-enterprise-upsell/light-side-by-side.webp) · [dark](comparison/b12-enterprise-upsell/dark-side-by-side.webp) |

## Running screens

| Screen | State | Variant | Light | Dark | Note |
|---|---|---|---|---|---|
| DA-CUS-02 | wholesale-buyer | admin | [light](screens/DA-CUS-02/wholesale-buyer/admin-light.webp) | [dark](screens/DA-CUS-02/wholesale-buyer/admin-dark.webp) | Hand-off: Batch 10, G-96: the company and wholesale states of the customer page |
| DA-CUS-04 | delete-confirm | admin | [light](screens/DA-CUS-04/delete-confirm/admin-light.webp) | [dark](screens/DA-CUS-04/delete-confirm/admin-dark.webp) |  |
| DA-CUS-04 | direct-visit | merchandiser | [light](screens/DA-CUS-04/direct-visit/merchandiser-light.webp) | [dark](screens/DA-CUS-04/direct-visit/merchandiser-dark.webp) |  |
| DA-CUS-04 | filtered-kind | admin | [light](screens/DA-CUS-04/filtered-kind/admin-light.webp) | [dark](screens/DA-CUS-04/filtered-kind/admin-dark.webp) |  |
| DA-CUS-04 | listed | admin | [light](screens/DA-CUS-04/listed/admin-light.webp) | [dark](screens/DA-CUS-04/listed/admin-dark.webp) |  |
| DA-CUS-04 | listed | customerManager | [light](screens/DA-CUS-04/listed/customerManager-light.webp) | [dark](screens/DA-CUS-04/listed/customerManager-dark.webp) |  |
| DA-CUS-04 | listed | orderManager | [light](screens/DA-CUS-04/listed/orderManager-light.webp) | [dark](screens/DA-CUS-04/listed/orderManager-dark.webp) |  |
| DA-CUS-04 | listed | support | [light](screens/DA-CUS-04/listed/support-light.webp) | [dark](screens/DA-CUS-04/listed/support-dark.webp) |  |
| DA-CUS-04 | loading | admin | [light](screens/DA-CUS-04/loading/admin-light.webp) | [dark](screens/DA-CUS-04/loading/admin-dark.webp) | In the browser: The companies request is held open |
| DA-CUS-04 | new-sheet-filled | admin | [light](screens/DA-CUS-04/new-sheet-filled/admin-light.webp) | [dark](screens/DA-CUS-04/new-sheet-filled/admin-dark.webp) |  |
| DA-CUS-04 | new-sheet-refused | admin | [light](screens/DA-CUS-04/new-sheet-refused/admin-light.webp) | [dark](screens/DA-CUS-04/new-sheet-refused/admin-dark.webp) |  |
| DA-CUS-04 | new-sheet | admin | [light](screens/DA-CUS-04/new-sheet/admin-light.webp) | [dark](screens/DA-CUS-04/new-sheet/admin-dark.webp) |  |
| DA-CUS-04 | none | admin | [light](screens/DA-CUS-04/none/admin-light.webp) | [dark](screens/DA-CUS-04/none/admin-dark.webp) | In the browser: The companies answer has its records taken out |
| DA-CUS-04 | searched | admin | [light](screens/DA-CUS-04/searched/admin-light.webp) | [dark](screens/DA-CUS-04/searched/admin-dark.webp) |  |
| DA-CUS-04 | sorted | admin | [light](screens/DA-CUS-04/sorted/admin-light.webp) | [dark](screens/DA-CUS-04/sorted/admin-dark.webp) |  |
| DA-CUS-05 | address-add | admin | [light](screens/DA-CUS-05/address-add/admin-light.webp) | [dark](screens/DA-CUS-05/address-add/admin-dark.webp) |  |
| DA-CUS-05 | address-delete-confirm | admin | [light](screens/DA-CUS-05/address-delete-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/address-delete-confirm/admin-dark.webp) |  |
| DA-CUS-05 | address-edit | admin | [light](screens/DA-CUS-05/address-edit/admin-light.webp) | [dark](screens/DA-CUS-05/address-edit/admin-dark.webp) |  |
| DA-CUS-05 | address-menu | admin | [light](screens/DA-CUS-05/address-menu/admin-light.webp) | [dark](screens/DA-CUS-05/address-menu/admin-dark.webp) |  |
| DA-CUS-05 | address-refused | admin | [light](screens/DA-CUS-05/address-refused/admin-light.webp) | [dark](screens/DA-CUS-05/address-refused/admin-dark.webp) |  |
| DA-CUS-05 | certificate-accepted | admin | [light](screens/DA-CUS-05/certificate-accepted/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-accepted/admin-dark.webp) |  |
| DA-CUS-05 | certificate-add-refused | admin | [light](screens/DA-CUS-05/certificate-add-refused/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-add-refused/admin-dark.webp) |  |
| DA-CUS-05 | certificate-add | admin | [light](screens/DA-CUS-05/certificate-add/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-add/admin-dark.webp) |  |
| DA-CUS-05 | certificate-delete-confirm | admin | [light](screens/DA-CUS-05/certificate-delete-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-delete-confirm/admin-dark.webp) |  |
| DA-CUS-05 | certificate-menu-accepted | admin | [light](screens/DA-CUS-05/certificate-menu-accepted/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-menu-accepted/admin-dark.webp) |  |
| DA-CUS-05 | certificate-menu-pending | admin | [light](screens/DA-CUS-05/certificate-menu-pending/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-menu-pending/admin-dark.webp) |  |
| DA-CUS-05 | certificate-revoke-confirm | admin | [light](screens/DA-CUS-05/certificate-revoke-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-revoke-confirm/admin-dark.webp) |  |
| DA-CUS-05 | certificate-revoked | admin | [light](screens/DA-CUS-05/certificate-revoked/admin-light.webp) | [dark](screens/DA-CUS-05/certificate-revoked/admin-dark.webp) |  |
| DA-CUS-05 | certificates | admin | [light](screens/DA-CUS-05/certificates/admin-light.webp) | [dark](screens/DA-CUS-05/certificates/admin-dark.webp) |  |
| DA-CUS-05 | company | admin | [light](screens/DA-CUS-05/company/admin-light.webp) | [dark](screens/DA-CUS-05/company/admin-dark.webp) |  |
| DA-CUS-05 | company | admin (phone) | [light](screens/DA-CUS-05/company/admin-phone-light.webp) | [dark](screens/DA-CUS-05/company/admin-phone-dark.webp) |  |
| DA-CUS-05 | company | customerManager | [light](screens/DA-CUS-05/company/customerManager-light.webp) | [dark](screens/DA-CUS-05/company/customerManager-dark.webp) |  |
| DA-CUS-05 | company | orderManager | [light](screens/DA-CUS-05/company/orderManager-light.webp) | [dark](screens/DA-CUS-05/company/orderManager-dark.webp) |  |
| DA-CUS-05 | company | support | [light](screens/DA-CUS-05/company/support-light.webp) | [dark](screens/DA-CUS-05/company/support-dark.webp) |  |
| DA-CUS-05 | delete-confirm | admin | [light](screens/DA-CUS-05/delete-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/delete-confirm/admin-dark.webp) |  |
| DA-CUS-05 | direct-visit | merchandiser | [light](screens/DA-CUS-05/direct-visit/merchandiser-light.webp) | [dark](screens/DA-CUS-05/direct-visit/merchandiser-dark.webp) |  |
| DA-CUS-05 | division | admin | [light](screens/DA-CUS-05/division/admin-light.webp) | [dark](screens/DA-CUS-05/division/admin-dark.webp) |  |
| DA-CUS-05 | empty-company | admin | [light](screens/DA-CUS-05/empty-company/admin-light.webp) | [dark](screens/DA-CUS-05/empty-company/admin-dark.webp) |  |
| DA-CUS-05 | invitation-made | admin | [light](screens/DA-CUS-05/invitation-made/admin-light.webp) | [dark](screens/DA-CUS-05/invitation-made/admin-dark.webp) |  |
| DA-CUS-05 | invitation-revoke-confirm | admin | [light](screens/DA-CUS-05/invitation-revoke-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/invitation-revoke-confirm/admin-dark.webp) |  |
| DA-CUS-05 | json-drawer | admin | [light](screens/DA-CUS-05/json-drawer/admin-light.webp) | [dark](screens/DA-CUS-05/json-drawer/admin-dark.webp) |  |
| DA-CUS-05 | load-failed | admin | [light](screens/DA-CUS-05/load-failed/admin-light.webp) | [dark](screens/DA-CUS-05/load-failed/admin-dark.webp) | In the browser: The company request is answered with a server error |
| DA-CUS-05 | loading | admin | [light](screens/DA-CUS-05/loading/admin-light.webp) | [dark](screens/DA-CUS-05/loading/admin-dark.webp) | In the browser: The company request is held open |
| DA-CUS-05 | member-add | admin | [light](screens/DA-CUS-05/member-add/admin-light.webp) | [dark](screens/DA-CUS-05/member-add/admin-dark.webp) |  |
| DA-CUS-05 | member-added | admin | [light](screens/DA-CUS-05/member-added/admin-light.webp) | [dark](screens/DA-CUS-05/member-added/admin-dark.webp) |  |
| DA-CUS-05 | member-remove-confirm | admin | [light](screens/DA-CUS-05/member-remove-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/member-remove-confirm/admin-dark.webp) |  |
| DA-CUS-05 | not-found | admin | [light](screens/DA-CUS-05/not-found/admin-light.webp) | [dark](screens/DA-CUS-05/not-found/admin-dark.webp) |  |
| DA-CUS-05 | profile-refused | admin | [light](screens/DA-CUS-05/profile-refused/admin-light.webp) | [dark](screens/DA-CUS-05/profile-refused/admin-dark.webp) |  |
| DA-CUS-05 | profile-saved | admin | [light](screens/DA-CUS-05/profile-saved/admin-light.webp) | [dark](screens/DA-CUS-05/profile-saved/admin-dark.webp) |  |
| DA-CUS-05 | purchase-order-required | admin | [light](screens/DA-CUS-05/purchase-order-required/admin-light.webp) | [dark](screens/DA-CUS-05/purchase-order-required/admin-dark.webp) |  |
| DA-CUS-05 | sub-unit-add-company | admin | [light](screens/DA-CUS-05/sub-unit-add-company/admin-light.webp) | [dark](screens/DA-CUS-05/sub-unit-add-company/admin-dark.webp) |  |
| DA-CUS-05 | sub-unit-add-division | admin | [light](screens/DA-CUS-05/sub-unit-add-division/admin-light.webp) | [dark](screens/DA-CUS-05/sub-unit-add-division/admin-dark.webp) |  |
| DA-CUS-05 | tax-add | admin | [light](screens/DA-CUS-05/tax-add/admin-light.webp) | [dark](screens/DA-CUS-05/tax-add/admin-dark.webp) |  |
| DA-CUS-05 | tax-delete-confirm | admin | [light](screens/DA-CUS-05/tax-delete-confirm/admin-light.webp) | [dark](screens/DA-CUS-05/tax-delete-confirm/admin-dark.webp) |  |
| DA-CUS-05 | tax-edit | admin | [light](screens/DA-CUS-05/tax-edit/admin-light.webp) | [dark](screens/DA-CUS-05/tax-edit/admin-dark.webp) |  |
| DA-CUS-05 | tax-menu | admin | [light](screens/DA-CUS-05/tax-menu/admin-light.webp) | [dark](screens/DA-CUS-05/tax-menu/admin-dark.webp) |  |
| DA-ORD-03 | company-chosen | admin | [light](screens/DA-ORD-03/company-chosen/admin-light.webp) | [dark](screens/DA-ORD-03/company-chosen/admin-dark.webp) |  |
| DA-ORD-03 | company-chosen | orderManager | [light](screens/DA-ORD-03/company-chosen/orderManager-light.webp) | [dark](screens/DA-ORD-03/company-chosen/orderManager-dark.webp) |  |
| DA-ORD-03 | purchase-order-company | admin | [light](screens/DA-ORD-03/purchase-order-company/admin-light.webp) | [dark](screens/DA-ORD-03/purchase-order-company/admin-dark.webp) |  |
| DA-PRD-13 | audience-company | admin | [light](screens/DA-PRD-13/audience-company/admin-light.webp) | [dark](screens/DA-PRD-13/audience-company/admin-dark.webp) | Hand-off: Catalog part 2: a company as a catalog’s audience |

## Checks

| Row | Answers | Captures |
|---|---|---|
| A company's purchase order requirement | [purchase-order.json](checks/purchase-order.json) | None |
| A member added, invitations accepted and revoked | [members-and-invitations.json](checks/members-and-invitations.json) | None |
| Certificates and the tax on a company's order | [certificates-and-tax.json](checks/certificates-and-tax.json) | None |
| A company's address book | [address-book.json](checks/address-book.json) | None |
| The catalog and the Wholesale price list | [prices.json](checks/prices.json) | None |
| The invitation email's link on the storefront | [invitation-link.json](checks/invitation-link.json) | [a guest](checks/invitation-link/1-guest.webp) · [signed in](checks/invitation-link/2-signed-in.webp) |

## Emails

| Email | HTML | 390 | 1280 |
|---|---|---|---|
| EM-C-11 Company invitation | [EM-C-11.html](emails/EM-C-11.html) | [390](emails/EM-C-11-390.webp) | [1280](emails/EM-C-11-1280.webp) |

[emails.json](emails/emails.json) lists the subject, parts and links, and what was delivered.
