# FB-19 storefront shopper accounts batch: evidence

The captures, comparisons, emails and results behind the [verification record](../../2026-10-22-fb-19-batch-storefront-shopper-accounts.md). They come from the storefront's scripts in `visual/fidelity/` (`screens.spec.ts` and `compare.spec.ts`), from Spree's mailer preview and the storefront's email component, from Spree's own specs and from the storefront's own browser tests. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Storefront draft pull request [#18](https://github.com/pateldhruval872/liquorify-storefront/pull/18) at `2e5f119` |
| Running screens and the browser tests | The storefront at `main` `8153a6b`, which #18 does not change, built for production, against the backend's browser-test Rails server and fixtures at `a4a1708` |
| Emails and Spree's specs | Spree's code at `a4a1708` |
| Browser | The storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels wide, with the fonts served offline |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in the storefront's `visual/__screenshots__/`.

**Data.** The screens show the browser tests' data, plus a test customer, a second customer, their addresses, orders and gift cards, added through Spree's Store and Admin APIs (record §2.1). Customers use `example.com` addresses. No password, token, key or gift card code is recorded, and a reset page's address is recorded without its token.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light-390.webp` and `<variant>-light-1280.webp`, and a JSON note for each: the screen, the state, the variant, the width, the storefront's revision, the path, how the state was reached (`observed`) and any note. A state that could not be reached has `<variant>-unavailable.json` instead, saying why |
| `comparison/<case>/` | `<width>-side-by-side.webp`: the running screen on the left and the story on the right; `<width>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs. `mobile` is 390 pixels and `desktop` 1280 |
| `emails/` | `<email ID>-390.webp` and `<email ID>-1280.webp`, and `emails.json`: for each, the sender, the template or component, the subject, the parts and how it was rendered |
| `backend/` | `api-specs.json`, `core-specs.json` and `emails-specs.json`: every example of Spree's account, registration and customer email specs with its file, line, description and result |
| `flows/` | `storefront-browser-tests.json`: each of the storefront's account browser tests with its result, run locally (record §2.2) |

## Comparison with running screens, at 390 and 1280 pixels

"ID" is the LIQ-009 inventory ID. Every element differs in its font list, which the record §4 explains (the pilot's D6); the last column lists the other computed properties that differ on an element found on both sides, and the record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ, besides the font list |
|---|---|---|---|---|---|
| CMP-SF-P-05 | `storefront-ui-card--default` | Sign-in card | [mobile](comparison/card-sign-in/mobile-side-by-side.webp), [desktop](comparison/card-sign-in/desktop-side-by-side.webp) | [mobile](comparison/card-sign-in/mobile-styles.json), [desktop](comparison/card-sign-in/desktop-styles.json) | height |
| CMP-SF-P-10 | `storefront-ui-field--default` | Sign in, the email field | [mobile](comparison/field-sign-in/mobile-side-by-side.webp), [desktop](comparison/field-sign-in/desktop-side-by-side.webp) | [mobile](comparison/field-sign-in/mobile-styles.json), [desktop](comparison/field-sign-in/desktop-styles.json) | None |
| CMP-SF-P-12 | `storefront-ui-input--default` | Sign in, the email input | [mobile](comparison/input-sign-in/mobile-side-by-side.webp), [desktop](comparison/input-sign-in/desktop-side-by-side.webp) | [mobile](comparison/input-sign-in/mobile-styles.json), [desktop](comparison/input-sign-in/desktop-styles.json) | None |
| CMP-SF-P-02 | `storefront-ui-alert--destructive` | Sign in, wrong password | [mobile](comparison/alert-wrong-password/mobile-side-by-side.webp), [desktop](comparison/alert-wrong-password/desktop-side-by-side.webp) | [mobile](comparison/alert-wrong-password/mobile-styles.json), [desktop](comparison/alert-wrong-password/desktop-styles.json) | None |
| CMP-SF-G-09 | `storefront-policy-policy-consent--unchecked` | Register, the consent | [mobile](comparison/policy-consent-register/mobile-side-by-side.webp), [desktop](comparison/policy-consent-register/desktop-side-by-side.webp) | [mobile](comparison/policy-consent-register/mobile-styles.json), [desktop](comparison/policy-consent-register/desktop-styles.json) | height |
| CMP-SF-G-01 | `storefront-account-account-shell--overview` | The account overview | [mobile](comparison/account-shell/mobile-side-by-side.webp), [desktop](comparison/account-shell/desktop-side-by-side.webp) | [mobile](comparison/account-shell/mobile-styles.json), [desktop](comparison/account-shell/desktop-styles.json) | height |
| CMP-SF-G-01 | `storefront-account-order-list--orders-listed` | Orders | [mobile](comparison/order-list/mobile-side-by-side.webp), [desktop](comparison/order-list/desktop-side-by-side.webp) | [mobile](comparison/order-list/mobile-styles.json), [desktop](comparison/order-list/desktop-styles.json) | height |
| CMP-SF-G-01 | `storefront-account-order-detail--shipped` | Order R1003, shipped | [mobile](comparison/order-detail-shipped/mobile-side-by-side.webp), [desktop](comparison/order-detail-shipped/desktop-side-by-side.webp) | [mobile](comparison/order-detail-shipped/mobile-styles.json), [desktop](comparison/order-detail-shipped/desktop-styles.json) | color, height |
| CMP-SF-G-01 | `storefront-account-gift-card-list--every-state` | Gift cards | [mobile](comparison/gift-card-list/mobile-side-by-side.webp), [desktop](comparison/gift-card-list/desktop-side-by-side.webp) | [mobile](comparison/gift-card-list/mobile-styles.json), [desktop](comparison/gift-card-list/desktop-styles.json) | height |
| CMP-SF-G-08 | `storefront-order-fulfillment-block--shipped` | Order R1003, its shipment | [mobile](comparison/fulfillment-block-shipped/mobile-side-by-side.webp), [desktop](comparison/fulfillment-block-shipped/desktop-side-by-side.webp) | [mobile](comparison/fulfillment-block-shipped/mobile-styles.json), [desktop](comparison/fulfillment-block-shipped/desktop-styles.json) | height |
| CMP-SF-G-08 | `storefront-order-address-block--full` | Order R1003, delivery address | [mobile](comparison/address-block/mobile-side-by-side.webp), [desktop](comparison/address-block/desktop-side-by-side.webp) | [mobile](comparison/address-block/mobile-styles.json), [desktop](comparison/address-block/desktop-styles.json) | height |
| CMP-SF-G-08 | `storefront-order-line-item-card--without-image` | Order R1003, its item | [mobile](comparison/line-item-card/mobile-side-by-side.webp), [desktop](comparison/line-item-card/desktop-side-by-side.webp) | [mobile](comparison/line-item-card/mobile-styles.json), [desktop](comparison/line-item-card/desktop-styles.json) | height |
| CMP-SF-P-16 | `storefront-ui-product-image--no-image` | Order R1003, its item's picture | [mobile](comparison/product-image-none/mobile-side-by-side.webp), [desktop](comparison/product-image-none/desktop-side-by-side.webp) | [mobile](comparison/product-image-none/mobile-styles.json), [desktop](comparison/product-image-none/desktop-styles.json) | None |
| CMP-SF-G-08 | `storefront-order-payment-info--other-method` | Order R1003, paid by check | [mobile](comparison/payment-info-other-method/mobile-side-by-side.webp), [desktop](comparison/payment-info-other-method/desktop-side-by-side.webp) | [mobile](comparison/payment-info-other-method/mobile-styles.json), [desktop](comparison/payment-info-other-method/desktop-styles.json) | None |
| CMP-SF-G-08 | `storefront-order-order-totals--default` | Order R1003, its totals | [mobile](comparison/order-totals/mobile-side-by-side.webp), [desktop](comparison/order-totals/desktop-side-by-side.webp) | [mobile](comparison/order-totals/mobile-styles.json), [desktop](comparison/order-totals/desktop-styles.json) | None |
| CMP-SF-G-02 | `storefront-addresses-address-management--addresses-listed` | Addresses | [mobile](comparison/address-management/mobile-side-by-side.webp), [desktop](comparison/address-management/desktop-side-by-side.webp) | [mobile](comparison/address-management/mobile-styles.json), [desktop](comparison/address-management/desktop-styles.json) | height |
| CMP-SF-G-04 | `storefront-checkout-address-edit-modal--editing` | The address editor, editing | [mobile](comparison/address-edit-modal-editing/mobile-side-by-side.webp), [desktop](comparison/address-edit-modal-editing/desktop-side-by-side.webp) | [mobile](comparison/address-edit-modal-editing/mobile-styles.json), [desktop](comparison/address-edit-modal-editing/desktop-styles.json) | None |
| CMP-SF-P-14 | `storefront-ui-native-select--focused` | The editor's country field, focused | [mobile](comparison/native-select-country/mobile-side-by-side.webp), [desktop](comparison/native-select-country/desktop-side-by-side.webp) | [mobile](comparison/native-select-country/mobile-styles.json), [desktop](comparison/native-select-country/desktop-styles.json) | font-size, line-height |
| CMP-SF-P-01 | `storefront-ui-alert-dialog--default` | Delete address confirmation | [mobile](comparison/alert-dialog-delete-address/mobile-side-by-side.webp), [desktop](comparison/alert-dialog-delete-address/desktop-side-by-side.webp) | [mobile](comparison/alert-dialog-delete-address/mobile-styles.json), [desktop](comparison/alert-dialog-delete-address/desktop-styles.json) | border-top-color, height |

## Screens, by state and variant

Variants are `guest`, `customer` (the test customer), `new-customer` (a customer registered by the capture run) and `another-customers-order` (the test customer opening another customer's order). The record §2.1 says how each state was reached and counts them: 39 states captured, two of them the page failing, and 3 not reached.

| Screen | State | Captures |
|---|---|---|
| SF-ACC-01 | overview | customer: [390](screens/SF-ACC-01/overview/customer-light-390.webp), [1280](screens/SF-ACC-01/overview/customer-light-1280.webp) |
| SF-ACC-01 | returned | guest: [390](screens/SF-ACC-01/returned/guest-light-390.webp), [1280](screens/SF-ACC-01/returned/guest-light-1280.webp) |
| SF-ACC-01 | sent-to-sign-in | guest: [390](screens/SF-ACC-01/sent-to-sign-in/guest-light-390.webp), [1280](screens/SF-ACC-01/sent-to-sign-in/guest-light-1280.webp) |
| SF-ACC-01 | sign-in-form | guest: [390](screens/SF-ACC-01/sign-in-form/guest-light-390.webp), [1280](screens/SF-ACC-01/sign-in-form/guest-light-1280.webp) |
| SF-ACC-01 | wrong-password | guest: [390](screens/SF-ACC-01/wrong-password/guest-light-390.webp), [1280](screens/SF-ACC-01/wrong-password/guest-light-1280.webp) |
| SF-ACC-02 | default | guest: [390](screens/SF-ACC-02/default/guest-light-390.webp), [1280](screens/SF-ACC-02/default/guest-light-1280.webp) |
| SF-ACC-02 | password-too-short | guest: [390](screens/SF-ACC-02/password-too-short/guest-light-390.webp), [1280](screens/SF-ACC-02/password-too-short/guest-light-1280.webp) |
| SF-ACC-02 | passwords-do-not-match | guest: [390](screens/SF-ACC-02/passwords-do-not-match/guest-light-390.webp), [1280](screens/SF-ACC-02/passwords-do-not-match/guest-light-1280.webp) |
| SF-ACC-02 | policy-consent-required | guest: [390](screens/SF-ACC-02/policy-consent-required/guest-light-390.webp), [1280](screens/SF-ACC-02/policy-consent-required/guest-light-1280.webp) |
| SF-ACC-02 | registration-failed | guest: [390](screens/SF-ACC-02/registration-failed/guest-light-390.webp), [1280](screens/SF-ACC-02/registration-failed/guest-light-1280.webp) |
| SF-ACC-03 | check-your-email | guest: [390](screens/SF-ACC-03/check-your-email/guest-light-390.webp), [1280](screens/SF-ACC-03/check-your-email/guest-light-1280.webp) |
| SF-ACC-03 | default | guest: [390](screens/SF-ACC-03/default/guest-light-390.webp), [1280](screens/SF-ACC-03/default/guest-light-1280.webp) |
| SF-ACC-04 | default | guest: [390](screens/SF-ACC-04/default/guest-light-390.webp), [1280](screens/SF-ACC-04/default/guest-light-1280.webp) |
| SF-ACC-04 | expired-link | guest: [390](screens/SF-ACC-04/expired-link/guest-light-390.webp), [1280](screens/SF-ACC-04/expired-link/guest-light-1280.webp) |
| SF-ACC-04 | invalid-link | guest: [390](screens/SF-ACC-04/invalid-link/guest-light-390.webp), [1280](screens/SF-ACC-04/invalid-link/guest-light-1280.webp) |
| SF-ACC-04 | success | guest: [390](screens/SF-ACC-04/success/guest-light-390.webp), [1280](screens/SF-ACC-04/success/guest-light-1280.webp) |
| SF-ACC-05 | no-orders | new-customer: [390](screens/SF-ACC-05/no-orders/new-customer-light-390.webp), [1280](screens/SF-ACC-05/no-orders/new-customer-light-1280.webp) |
| SF-ACC-05 | orders-listed | customer: [390](screens/SF-ACC-05/orders-listed/customer-light-390.webp), [1280](screens/SF-ACC-05/orders-listed/customer-light-1280.webp) |
| SF-ACC-06 | canceled | customer: [390](screens/SF-ACC-06/canceled/customer-light-390.webp), [1280](screens/SF-ACC-06/canceled/customer-light-1280.webp) |
| SF-ACC-06 | no-tracking | customer: [390](screens/SF-ACC-06/no-tracking/customer-light-390.webp), [1280](screens/SF-ACC-06/no-tracking/customer-light-1280.webp) |
| SF-ACC-06 | not-found | another-customers-order: [390](screens/SF-ACC-06/not-found/another-customers-order-light-390.webp), [1280](screens/SF-ACC-06/not-found/another-customers-order-light-1280.webp) |
| SF-ACC-06 | paid-by-saved-card, the page failing (B1) | customer: [390](screens/SF-ACC-06/paid-by-saved-card/customer-light-390.webp), [1280](screens/SF-ACC-06/paid-by-saved-card/customer-light-1280.webp) |
| SF-ACC-06 | partially-shipped | customer: [390](screens/SF-ACC-06/partially-shipped/customer-light-390.webp), [1280](screens/SF-ACC-06/partially-shipped/customer-light-1280.webp) |
| SF-ACC-06 | shipped | customer: [390](screens/SF-ACC-06/shipped/customer-light-390.webp), [1280](screens/SF-ACC-06/shipped/customer-light-1280.webp) |
| SF-ACC-06 | unfulfilled | customer: [390](screens/SF-ACC-06/unfulfilled/customer-light-390.webp), [1280](screens/SF-ACC-06/unfulfilled/customer-light-1280.webp) |
| SF-ACC-07 | adding | customer: [390](screens/SF-ACC-07/adding/customer-light-390.webp), [1280](screens/SF-ACC-07/adding/customer-light-1280.webp) |
| SF-ACC-07 | addresses-listed | customer: [390](screens/SF-ACC-07/addresses-listed/customer-light-390.webp), [1280](screens/SF-ACC-07/addresses-listed/customer-light-1280.webp) |
| SF-ACC-07 | delete-confirmation | customer: [390](screens/SF-ACC-07/delete-confirmation/customer-light-390.webp), [1280](screens/SF-ACC-07/delete-confirmation/customer-light-1280.webp) |
| SF-ACC-07 | editing | customer: [390](screens/SF-ACC-07/editing/customer-light-390.webp), [1280](screens/SF-ACC-07/editing/customer-light-1280.webp) |
| SF-ACC-07 | no-addresses | new-customer: [390](screens/SF-ACC-07/no-addresses/new-customer-light-390.webp), [1280](screens/SF-ACC-07/no-addresses/new-customer-light-1280.webp) |
| SF-ACC-07 | save-refused | customer: [390](screens/SF-ACC-07/save-refused/customer-light-390.webp), [1280](screens/SF-ACC-07/save-refused/customer-light-1280.webp) |
| SF-ACC-07 | set-as-default | Not reached: [why](screens/SF-ACC-07/set-as-default/customer-unavailable.json) |
| SF-ACC-08 | cards-listed, the page failing (B1) | customer: [390](screens/SF-ACC-08/cards-listed/customer-light-390.webp), [1280](screens/SF-ACC-08/cards-listed/customer-light-1280.webp) |
| SF-ACC-08 | no-cards | new-customer: [390](screens/SF-ACC-08/no-cards/new-customer-light-390.webp), [1280](screens/SF-ACC-08/no-cards/new-customer-light-1280.webp) |
| SF-ACC-08 | remove-confirmation | Not reached: [why](screens/SF-ACC-08/remove-confirmation/customer-unavailable.json) |
| SF-ACC-09 | canceled | Not reached: [why](screens/SF-ACC-09/canceled/customer-unavailable.json) |
| SF-ACC-09 | gift-cards-listed | customer: [390](screens/SF-ACC-09/gift-cards-listed/customer-light-390.webp), [1280](screens/SF-ACC-09/gift-cards-listed/customer-light-1280.webp) |
| SF-ACC-09 | none | new-customer: [390](screens/SF-ACC-09/none/new-customer-light-390.webp), [1280](screens/SF-ACC-09/none/new-customer-light-1280.webp) |
| SF-ACC-10 | current-password-needed | customer: [390](screens/SF-ACC-10/current-password-needed/customer-light-390.webp), [1280](screens/SF-ACC-10/current-password-needed/customer-light-1280.webp) |
| SF-ACC-10 | current-password-refused | customer: [390](screens/SF-ACC-10/current-password-refused/customer-light-390.webp), [1280](screens/SF-ACC-10/current-password-refused/customer-light-1280.webp) |
| SF-ACC-10 | default | customer: [390](screens/SF-ACC-10/default/customer-light-390.webp), [1280](screens/SF-ACC-10/default/customer-light-1280.webp) |
| SF-ACC-10 | updated | customer: [390](screens/SF-ACC-10/updated/customer-light-390.webp), [1280](screens/SF-ACC-10/updated/customer-light-1280.webp) |


## Emails

The templates have no dark styles, and the storefront shows none, so each email has one capture per width.

| Email | Captures |
|---|---|
| EM-C-08 Customer password reset, sent by Spree | [390](emails/EM-C-08-390.webp), [1280](emails/EM-C-08-1280.webp) |
| EM-SF-04 Password reset, sent by the storefront | [390](emails/EM-SF-04-390.webp), [1280](emails/EM-SF-04-1280.webp) |

Senders, subjects and how each was rendered: [emails.json](emails/emails.json).

## Backend and browser tests

| File | What it holds |
|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's Store API specs for signing in, registering, the profile, password reset, orders, addresses, saved cards, gift cards and policies: 214 examples in 15 files, no failures |
| [core-specs.json](backend/core-specs.json) | Spree's registration workflow spec, which records consent at registration: 20 examples, no failures |
| [emails-specs.json](backend/emails-specs.json) | Spree's customer mailer specs: 7 examples in 2 files, no failures |
| [storefront-browser-tests.json](flows/storefront-browser-tests.json) | The storefront's seven account browser tests, run locally: 7 passed, none retried |
