# FB-19 setup, stores and settings batch: evidence

The captures, comparisons, provisioning result and backend results behind the [verification record](../../2026-10-26-fb-19-batch-setup-stores-and-settings.md). They come from the scripts in `packages/liquorify-storybook/fidelity/` (`screens.spec.ts`, `setup.spec.ts` and `compare.spec.ts`, with the data `settings.ts` and `staff.ts` add) and from Spree's own specs. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Draft pull request [#19](https://github.com/pateldhruval872/liquorify/pull/19); the scripts ran from `881a619`, with the batch's stories as the commit that adds the records has them |
| Running screens, first-run setup and Spree's specs | Spree's code at `afd97cd`, which the pull request does not change: the built admin dashboard against the dashboard browser tests' own Rails server and fixtures, and first-run setup on the first-run browser test's own server, which starts with no admin |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels, and 390 by 844 for the settings page's phone states; comparisons at 1280 by 800, 1280 by 2400 for the settings cards and the return reasons card, and 390 by 844 for the phone case. Captures follow the system's light or dark setting; none stores a choice of theme |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The screens show the browser tests' data, plus the role, teammate, inactive channel, custom field definitions and retired reasons the scripts add through the Admin API. Teammates and the first-run merchant use `example.com` addresses. Each capture's store is written as `<store>` in its notes. **No setup token, key or password is recorded:** the storefront sheet's Store API address and publishable key are painted out before every screenshot that shows them; the setup link is opened, never written down, and the notes of setup's own page give its path as `/setup`, without the link's query; the passwords typed during setup are made up for the run and kept in memory. One of Spree's spec titles names a local address, and the backend results write it as `<a local address>`.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role and its permissions, the theme, the revision, the path, the window's size, how a request was answered or held to reach the state (`intercepted`), what was painted out (`masked`), whether the page settled, and every request blocked because it would have left the local servers (`outside`, empty in all 244) |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs |
| `provisioning/` | `first-run.json`: the country, currency and language setup was given, and each default Spree's two provisioning services give a store, with its source, whether it was present and what was found (§3.4 of the record) |
| `backend/` | `api-specs.json` and `core-specs.json`: every example of Spree's specs for the batch's endpoints and services, with its file, line, description and result |

## Comparison with running screens, light and dark

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides, and the elements found on one side only; the verification record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-CORE-PG-02 | `dashboard-core-pages-settings-index--every-card` | The settings page's cards, as an admin sees them | [dark](comparison/settings-index-store-cards/dark-side-by-side.webp), [light](comparison/settings-index-store-cards/light-side-by-side.webp) | [dark](comparison/settings-index-store-cards/dark-styles.json), [light](comparison/settings-index-store-cards/light-styles.json) | None |
| CMP-CORE-PG-02 | `dashboard-core-pages-settings-index--on-a-phone` | The settings page on a phone, with its own search | [dark](comparison/settings-index-on-a-phone/dark-side-by-side.webp), [light](comparison/settings-index-on-a-phone/light-side-by-side.webp) | [dark](comparison/settings-index-on-a-phone/dark-styles.json), [light](comparison/settings-index-on-a-phone/light-styles.json) | None |
| CMP-DA-G-16 | `admin-dashboard-reasons-reason-section--return-reasons` | The return reasons card | [dark](comparison/reason-section-return-reasons/dark-side-by-side.webp), [light](comparison/reason-section-return-reasons/light-side-by-side.webp) | [dark](comparison/reason-section-return-reasons/dark-styles.json), [light](comparison/reason-section-return-reasons/light-styles.json) | height; 1 element in the story only |
| CMP-DA-G-16 | `admin-dashboard-reasons-reason-section--exemption-reasons` | The tax exemption reasons card | [dark](comparison/reason-section-exemption-reasons/dark-side-by-side.webp), [light](comparison/reason-section-exemption-reasons/light-side-by-side.webp) | [dark](comparison/reason-section-exemption-reasons/dark-styles.json), [light](comparison/reason-section-exemption-reasons/light-styles.json) | height; 1 element in the story only |
| CMP-DA-G-16 | `admin-dashboard-reasons-reason-section--add` | The add reason sheet, from the return reasons card | [dark](comparison/reason-section-add/dark-side-by-side.webp), [light](comparison/reason-section-add/light-side-by-side.webp) | [dark](comparison/reason-section-add/dark-styles.json), [light](comparison/reason-section-add/light-styles.json) | None |
| CMP-DA-G-16 | `admin-dashboard-reasons-reason-section--delete-confirmation` | A return reason's delete confirmation | [dark](comparison/reason-section-delete-confirmation/dark-side-by-side.webp), [light](comparison/reason-section-delete-confirmation/light-side-by-side.webp) | [dark](comparison/reason-section-delete-confirmation/dark-styles.json), [light](comparison/reason-section-delete-confirmation/light-styles.json) | border-bottom-color, border-top-color, box-shadow, height |
| CMP-DA-G-06 | `admin-dashboard-custom-fields-definition-form--new` | The add custom field sheet's form | [dark](comparison/definition-form-new/dark-side-by-side.webp), [light](comparison/definition-form-new/light-side-by-side.webp) | [dark](comparison/definition-form-new/dark-styles.json), [light](comparison/definition-form-new/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-channels-order-routing-rules-section--rules` | The Wholesale channel's routing rules | [dark](comparison/order-routing-rules-section-rules/dark-side-by-side.webp), [light](comparison/order-routing-rules-section-rules/light-side-by-side.webp) | [dark](comparison/order-routing-rules-section-rules/dark-styles.json), [light](comparison/order-routing-rules-section-rules/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-channels-order-routing-rules-section--delete-confirmation` | A routing rule's delete confirmation | [dark](comparison/order-routing-rules-section-delete-confirmation/dark-side-by-side.webp), [light](comparison/order-routing-rules-section-delete-confirmation/light-side-by-side.webp) | [dark](comparison/order-routing-rules-section-delete-confirmation/dark-styles.json), [light](comparison/order-routing-rules-section-delete-confirmation/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-20 | `admin-dashboard-shipping-stock-location-scope-field--all-locations` | The Wholesale channel's fulfilment locations, all of them | [dark](comparison/stock-location-scope-field-all-locations/dark-side-by-side.webp), [light](comparison/stock-location-scope-field-all-locations/light-side-by-side.webp) | [dark](comparison/stock-location-scope-field-all-locations/dark-styles.json), [light](comparison/stock-location-scope-field-all-locations/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-markets-tax-provider-field--store-default` | The add market sheet's tax engine, the store's default | [dark](comparison/tax-provider-field-store-default/dark-side-by-side.webp), [light](comparison/tax-provider-field-store-default/light-side-by-side.webp) | [dark](comparison/tax-provider-field-store-default/dark-styles.json), [light](comparison/tax-provider-field-store-default/light-styles.json) | None |
| CMP-CORE-08 | `dashboard-core-currency-select--store-default` | The add market sheet's currency, the store's default | [dark](comparison/currency-select-store-default/dark-side-by-side.webp), [light](comparison/currency-select-store-default/light-side-by-side.webp) | [dark](comparison/currency-select-store-default/dark-styles.json), [light](comparison/currency-select-store-default/light-styles.json) | None |
| CMP-DUI-P-14 | `dashboard-ui-primitives-combobox--open` | The add market sheet's currency list, open | [dark](comparison/combobox-open/dark-side-by-side.webp), [light](comparison/combobox-open/light-side-by-side.webp) | [dark](comparison/combobox-open/dark-styles.json), [light](comparison/combobox-open/light-styles.json) | height |
| CMP-CORE-14 | `dashboard-core-locale-select--selected` | The add market sheet's default language | [dark](comparison/locale-select-selected/dark-side-by-side.webp), [light](comparison/locale-select-selected/light-side-by-side.webp) | [dark](comparison/locale-select-selected/dark-styles.json), [light](comparison/locale-select-selected/light-styles.json) | None |
| CMP-CORE-14 | `dashboard-core-locale-select--none-chosen` | The add market sheet's supported languages, none chosen | [dark](comparison/locale-select-none-chosen/dark-side-by-side.webp), [light](comparison/locale-select-none-chosen/light-side-by-side.webp) | [dark](comparison/locale-select-none-chosen/dark-styles.json), [light](comparison/locale-select-none-chosen/light-styles.json) | None |
| CMP-DUI-C-12 | `dashboard-ui-composed-country-flag--default` | The flag beside the setup form's country | [dark](comparison/country-flag-beside-a-name/dark-side-by-side.webp), [light](comparison/country-flag-beside-a-name/light-side-by-side.webp) | [dark](comparison/country-flag-beside-a-name/dark-styles.json), [light](comparison/country-flag-beside-a-name/light-styles.json) | None |
| CMP-DUI-C-17 | `dashboard-ui-composed-drag-handle--default` | A market's drag handle on the markets page | [dark](comparison/drag-handle-default/dark-side-by-side.webp), [light](comparison/drag-handle-default/light-side-by-side.webp) | [dark](comparison/drag-handle-default/dark-styles.json), [light](comparison/drag-handle-default/light-styles.json) | None |
| CMP-DUI-C-21 | `dashboard-ui-composed-form-actions--unchanged` | The store page's Save button, nothing changed | [dark](comparison/form-actions-unchanged/dark-side-by-side.webp), [light](comparison/form-actions-unchanged/light-side-by-side.webp) | [dark](comparison/form-actions-unchanged/dark-styles.json), [light](comparison/form-actions-unchanged/light-styles.json) | None |
| CMP-CORE-23 | `dashboard-core-resource-combobox--nothing-found` | The Wholesale channel's default catalog picker, with no catalog to find | [dark](comparison/resource-combobox-nothing-found/dark-side-by-side.webp), [light](comparison/resource-combobox-nothing-found/light-side-by-side.webp) | [dark](comparison/resource-combobox-nothing-found/dark-styles.json), [light](comparison/resource-combobox-nothing-found/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-policies-media-rich-text-editor--empty` | The add policy sheet's content editor, empty | [dark](comparison/media-rich-text-editor-empty/dark-side-by-side.webp), [light](comparison/media-rich-text-editor-empty/light-side-by-side.webp) | [dark](comparison/media-rich-text-editor-empty/dark-styles.json), [light](comparison/media-rich-text-editor-empty/light-styles.json) | None |
| CMP-CORE-16 | `dashboard-core-media-picker-sheet--one-file` | The media library opened from a policy's image button | [dark](comparison/media-picker-sheet-one-file-with-upload/dark-side-by-side.webp), [light](comparison/media-picker-sheet-one-file-with-upload/light-side-by-side.webp) | [dark](comparison/media-picker-sheet-one-file-with-upload/dark-styles.json), [light](comparison/media-picker-sheet-one-file-with-upload/light-styles.json) | None; 1 element on the screen only, 6 elements in the story only |
| CMP-CORE-01 | `dashboard-core-address-form-dialog--no-address-yet` | The shipping address sheet, opened from Getting Started | [dark](comparison/address-form-dialog-no-address-yet/dark-side-by-side.webp), [light](comparison/address-form-dialog-no-address-yet/light-side-by-side.webp) | [dark](comparison/address-form-dialog-no-address-yet/dark-styles.json), [light](comparison/address-form-dialog-no-address-yet/light-styles.json) | None |
| CMP-CORE-07 | `dashboard-core-country-state-fields--placeholder` | The shipping address sheet's state, nothing chosen | [dark](comparison/country-state-fields-placeholder/dark-side-by-side.webp), [light](comparison/country-state-fields-placeholder/light-side-by-side.webp) | [dark](comparison/country-state-fields-placeholder/dark-styles.json), [light](comparison/country-state-fields-placeholder/light-styles.json) | None |
| CMP-DA-G-19 | `admin-dashboard-getting-started-store-address-task--no-address-yet` | The shipping address task, no address yet | [dark](comparison/store-address-task-no-address-yet/dark-side-by-side.webp), [light](comparison/store-address-task-no-address-yet/light-side-by-side.webp) | [dark](comparison/store-address-task-no-address-yet/dark-styles.json), [light](comparison/store-address-task-no-address-yet/light-styles.json) | None |
| CMP-DA-G-19 | `admin-dashboard-getting-started-add-products-task--done` | The add products task, done | [dark](comparison/add-products-task-done/dark-side-by-side.webp), [light](comparison/add-products-task-done/light-side-by-side.webp) | [dark](comparison/add-products-task-done/dark-styles.json), [light](comparison/add-products-task-done/light-styles.json) | None |
| CMP-DA-G-19 | `admin-dashboard-getting-started-storefront-connect-task--not-done` | The storefront task, not done | [dark](comparison/storefront-connect-task-not-done/dark-side-by-side.webp), [light](comparison/storefront-connect-task-not-done/light-side-by-side.webp) | [dark](comparison/storefront-connect-task-not-done/dark-styles.json), [light](comparison/storefront-connect-task-not-done/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-getting-started-storefront-connect-sheet--key-hidden` | The connect storefront sheet, the key hidden; the address and key painted out on both sides | [dark](comparison/storefront-connect-sheet-key-hidden/dark-side-by-side.webp), [light](comparison/storefront-connect-sheet-key-hidden/light-side-by-side.webp) | [dark](comparison/storefront-connect-sheet-key-hidden/dark-styles.json), [light](comparison/storefront-connect-sheet-key-hidden/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-getting-started-getting-started-nav-badge--some-done` | Getting Started's badge in the navigation, seen from the orders page | [dark](comparison/getting-started-nav-badge-some-done/dark-side-by-side.webp), [light](comparison/getting-started-nav-badge-some-done/light-side-by-side.webp) | [dark](comparison/getting-started-nav-badge-some-done/dark-styles.json), [light](comparison/getting-started-nav-badge-some-done/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-setup-store-setup-fields--suggested` | The setup form's country, the United States suggested | [dark](comparison/store-setup-fields-suggested/dark-side-by-side.webp), [light](comparison/store-setup-fields-suggested/light-side-by-side.webp) | [dark](comparison/store-setup-fields-suggested/dark-styles.json), [light](comparison/store-setup-fields-suggested/light-styles.json) | None |

## Screens, by state and variant

Each state of the eleven screens as it runs, light and dark. The variant names who is signed in:

- **admin** is the browser tests' admin, who holds every permission.
- **settingsViewer** is a teammate whose role, added by `fidelity/staff.ts`, reads `settings` and writes nothing.
- **orderManager** is a teammate with the order manager template's role, which holds no settings permission; each of its captures is a direct visit to the page's address.
- **installer** is the person installing the platform, before any staff account exists, on the first-run server.

| Screen | State | Captures |
|---|---|---|
| DA-AUTH-01 | installation-not-set-up | [installer](screens/DA-AUTH-01/installation-not-set-up/installer-light.webp) ([dark](screens/DA-AUTH-01/installation-not-set-up/installer-dark.webp)) |
| DA-AUTH-01 | installation-set-up | [installer](screens/DA-AUTH-01/installation-set-up/installer-light.webp) ([dark](screens/DA-AUTH-01/installation-set-up/installer-dark.webp)) |
| DA-HOME-02 | address-dialog | [admin](screens/DA-HOME-02/address-dialog/admin-light.webp) ([dark](screens/DA-HOME-02/address-dialog/admin-dark.webp)) |
| DA-HOME-02 | all-done | [admin](screens/DA-HOME-02/all-done/admin-light.webp) ([dark](screens/DA-HOME-02/all-done/admin-dark.webp)) |
| DA-HOME-02 | direct-visit | [orderManager](screens/DA-HOME-02/direct-visit/orderManager-light.webp) ([dark](screens/DA-HOME-02/direct-visit/orderManager-dark.webp)), [settingsViewer](screens/DA-HOME-02/direct-visit/settingsViewer-light.webp) ([dark](screens/DA-HOME-02/direct-visit/settingsViewer-dark.webp)) |
| DA-HOME-02 | none-done | [admin](screens/DA-HOME-02/none-done/admin-light.webp) ([dark](screens/DA-HOME-02/none-done/admin-dark.webp)) |
| DA-HOME-02 | some-done | [admin](screens/DA-HOME-02/some-done/admin-light.webp) ([dark](screens/DA-HOME-02/some-done/admin-dark.webp)) |
| DA-HOME-02 | storefront-sheet-key-hidden | [admin](screens/DA-HOME-02/storefront-sheet-key-hidden/admin-light.webp) ([dark](screens/DA-HOME-02/storefront-sheet-key-hidden/admin-dark.webp)) |
| DA-HOME-02 | storefront-sheet-key-shown | [admin](screens/DA-HOME-02/storefront-sheet-key-shown/admin-light.webp) ([dark](screens/DA-HOME-02/storefront-sheet-key-shown/admin-dark.webp)) |
| DA-HOME-02 | storefront-sheet-not-an-address | [admin](screens/DA-HOME-02/storefront-sheet-not-an-address/admin-light.webp) ([dark](screens/DA-HOME-02/storefront-sheet-not-an-address/admin-dark.webp)) |
| DA-HOME-02 | task-address-done | [admin](screens/DA-HOME-02/task-address-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-address-done/admin-dark.webp)) |
| DA-HOME-02 | task-address-not-done | [admin](screens/DA-HOME-02/task-address-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-address-not-done/admin-dark.webp)) |
| DA-HOME-02 | task-payment-methods-done | [admin](screens/DA-HOME-02/task-payment-methods-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-payment-methods-done/admin-dark.webp)) |
| DA-HOME-02 | task-payment-methods-not-done | [admin](screens/DA-HOME-02/task-payment-methods-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-payment-methods-not-done/admin-dark.webp)) |
| DA-HOME-02 | task-products-done | [admin](screens/DA-HOME-02/task-products-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-products-done/admin-dark.webp)) |
| DA-HOME-02 | task-products-not-done | [admin](screens/DA-HOME-02/task-products-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-products-not-done/admin-dark.webp)) |
| DA-HOME-02 | task-storefront-done | [admin](screens/DA-HOME-02/task-storefront-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-storefront-done/admin-dark.webp)) |
| DA-HOME-02 | task-storefront-not-done | [admin](screens/DA-HOME-02/task-storefront-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-storefront-not-done/admin-dark.webp)) |
| DA-HOME-02 | task-support-email-done | [admin](screens/DA-HOME-02/task-support-email-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-support-email-done/admin-dark.webp)) |
| DA-HOME-02 | task-support-email-not-done | [admin](screens/DA-HOME-02/task-support-email-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-support-email-not-done/admin-dark.webp)) |
| DA-HOME-02 | task-taxes-done | [admin](screens/DA-HOME-02/task-taxes-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-taxes-done/admin-dark.webp)) |
| DA-HOME-02 | task-taxes-not-done | [admin](screens/DA-HOME-02/task-taxes-not-done/admin-light.webp) ([dark](screens/DA-HOME-02/task-taxes-not-done/admin-dark.webp)) |
| DA-SET-01 | cards | [admin](screens/DA-SET-01/cards/admin-light.webp) ([dark](screens/DA-SET-01/cards/admin-dark.webp)), [orderManager](screens/DA-SET-01/cards/orderManager-light.webp) ([dark](screens/DA-SET-01/cards/orderManager-dark.webp)), [settingsViewer](screens/DA-SET-01/cards/settingsViewer-light.webp) ([dark](screens/DA-SET-01/cards/settingsViewer-dark.webp)) |
| DA-SET-01 | phone | [admin](screens/DA-SET-01/phone/admin-light.webp) ([dark](screens/DA-SET-01/phone/admin-dark.webp)) |
| DA-SET-01 | phone-nothing-found | [admin](screens/DA-SET-01/phone-nothing-found/admin-light.webp) ([dark](screens/DA-SET-01/phone-nothing-found/admin-dark.webp)) |
| DA-SET-01 | phone-searched | [admin](screens/DA-SET-01/phone-searched/admin-light.webp) ([dark](screens/DA-SET-01/phone-searched/admin-dark.webp)) |
| DA-SET-02 | addresses-and-order-numbers | [admin](screens/DA-SET-02/addresses-and-order-numbers/admin-light.webp) ([dark](screens/DA-SET-02/addresses-and-order-numbers/admin-dark.webp)) |
| DA-SET-02 | catalog-and-downloads | [admin](screens/DA-SET-02/catalog-and-downloads/admin-light.webp) ([dark](screens/DA-SET-02/catalog-and-downloads/admin-dark.webp)) |
| DA-SET-02 | direct-visit | [orderManager](screens/DA-SET-02/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-02/direct-visit/orderManager-dark.webp)) |
| DA-SET-02 | general | [admin](screens/DA-SET-02/general/admin-light.webp) ([dark](screens/DA-SET-02/general/admin-dark.webp)), [settingsViewer](screens/DA-SET-02/general/settingsViewer-light.webp) ([dark](screens/DA-SET-02/general/settingsViewer-dark.webp)) |
| DA-SET-02 | inventory-and-data-sources | [admin](screens/DA-SET-02/inventory-and-data-sources/admin-light.webp) ([dark](screens/DA-SET-02/inventory-and-data-sources/admin-dark.webp)) |
| DA-SET-02 | payments | [admin](screens/DA-SET-02/payments/admin-light.webp) ([dark](screens/DA-SET-02/payments/admin-dark.webp)) |
| DA-SET-02 | request-failed | [admin](screens/DA-SET-02/request-failed/admin-light.webp) ([dark](screens/DA-SET-02/request-failed/admin-dark.webp)) |
| DA-SET-02 | save-refused | [admin](screens/DA-SET-02/save-refused/admin-light.webp) ([dark](screens/DA-SET-02/save-refused/admin-dark.webp)) |
| DA-SET-02 | saved | [admin](screens/DA-SET-02/saved/admin-light.webp) ([dark](screens/DA-SET-02/saved/admin-dark.webp)) |
| DA-SET-02 | storefront-access | [admin](screens/DA-SET-02/storefront-access/admin-light.webp) ([dark](screens/DA-SET-02/storefront-access/admin-dark.webp)) |
| DA-SET-02 | unsaved-changes | [admin](screens/DA-SET-02/unsaved-changes/admin-light.webp) ([dark](screens/DA-SET-02/unsaved-changes/admin-dark.webp)) |
| DA-SET-06 | create-name-typed | [admin](screens/DA-SET-06/create-name-typed/admin-light.webp) ([dark](screens/DA-SET-06/create-name-typed/admin-dark.webp)) |
| DA-SET-06 | create-sheet | [admin](screens/DA-SET-06/create-sheet/admin-light.webp) ([dark](screens/DA-SET-06/create-sheet/admin-dark.webp)) |
| DA-SET-06 | delete-confirmation | [admin](screens/DA-SET-06/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-06/delete-confirmation/admin-dark.webp)) |
| DA-SET-06 | direct-visit | [orderManager](screens/DA-SET-06/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-06/direct-visit/orderManager-dark.webp)) |
| DA-SET-06 | edit | [admin](screens/DA-SET-06/edit/admin-light.webp) ([dark](screens/DA-SET-06/edit/admin-dark.webp)), [settingsViewer](screens/DA-SET-06/edit/settingsViewer-light.webp) ([dark](screens/DA-SET-06/edit/settingsViewer-dark.webp)) |
| DA-SET-06 | listed | [admin](screens/DA-SET-06/listed/admin-light.webp) ([dark](screens/DA-SET-06/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-06/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-06/listed/settingsViewer-dark.webp)) |
| DA-SET-06 | media-picker | [admin](screens/DA-SET-06/media-picker/admin-light.webp) ([dark](screens/DA-SET-06/media-picker/admin-dark.webp)) |
| DA-SET-06 | none | [admin](screens/DA-SET-06/none/admin-light.webp) ([dark](screens/DA-SET-06/none/admin-dark.webp)) |
| DA-SET-08 | catalog-picker-empty | [admin](screens/DA-SET-08/catalog-picker-empty/admin-light.webp) ([dark](screens/DA-SET-08/catalog-picker-empty/admin-dark.webp)) |
| DA-SET-08 | create-code-derived | [admin](screens/DA-SET-08/create-code-derived/admin-light.webp) ([dark](screens/DA-SET-08/create-code-derived/admin-dark.webp)) |
| DA-SET-08 | create-code-typed | [admin](screens/DA-SET-08/create-code-typed/admin-light.webp) ([dark](screens/DA-SET-08/create-code-typed/admin-dark.webp)) |
| DA-SET-08 | create-sheet | [admin](screens/DA-SET-08/create-sheet/admin-light.webp) ([dark](screens/DA-SET-08/create-sheet/admin-dark.webp)) |
| DA-SET-08 | delete-confirmation | [admin](screens/DA-SET-08/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-08/delete-confirmation/admin-dark.webp)) |
| DA-SET-08 | direct-visit | [orderManager](screens/DA-SET-08/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-08/direct-visit/orderManager-dark.webp)) |
| DA-SET-08 | fulfilment-locations-chosen | [admin](screens/DA-SET-08/fulfilment-locations-chosen/admin-light.webp) ([dark](screens/DA-SET-08/fulfilment-locations-chosen/admin-dark.webp)) |
| DA-SET-08 | listed | [admin](screens/DA-SET-08/listed/admin-light.webp) ([dark](screens/DA-SET-08/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-08/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-08/listed/settingsViewer-dark.webp)) |
| DA-SET-08 | routing-rule-add-picker | [admin](screens/DA-SET-08/routing-rule-add-picker/admin-light.webp) ([dark](screens/DA-SET-08/routing-rule-add-picker/admin-dark.webp)) |
| DA-SET-08 | routing-rule-added | [admin](screens/DA-SET-08/routing-rule-added/admin-light.webp) ([dark](screens/DA-SET-08/routing-rule-added/admin-dark.webp)) |
| DA-SET-08 | routing-rule-delete-confirmation | [admin](screens/DA-SET-08/routing-rule-delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-08/routing-rule-delete-confirmation/admin-dark.webp)) |
| DA-SET-08 | routing-rules | [admin](screens/DA-SET-08/routing-rules/admin-light.webp) ([dark](screens/DA-SET-08/routing-rules/admin-dark.webp)), [settingsViewer](screens/DA-SET-08/routing-rules/settingsViewer-light.webp) ([dark](screens/DA-SET-08/routing-rules/settingsViewer-dark.webp)) |
| DA-SET-08 | store-settings-cleared | [admin](screens/DA-SET-08/store-settings-cleared/admin-light.webp) ([dark](screens/DA-SET-08/store-settings-cleared/admin-dark.webp)) |
| DA-SET-08 | store-settings-overridden | [admin](screens/DA-SET-08/store-settings-overridden/admin-light.webp) ([dark](screens/DA-SET-08/store-settings-overridden/admin-dark.webp)) |
| DA-SET-09 | create-boolean | [admin](screens/DA-SET-09/create-boolean/admin-light.webp) ([dark](screens/DA-SET-09/create-boolean/admin-dark.webp)) |
| DA-SET-09 | create-json | [admin](screens/DA-SET-09/create-json/admin-light.webp) ([dark](screens/DA-SET-09/create-json/admin-dark.webp)) |
| DA-SET-09 | create-long-text | [admin](screens/DA-SET-09/create-long-text/admin-light.webp) ([dark](screens/DA-SET-09/create-long-text/admin-dark.webp)) |
| DA-SET-09 | create-number | [admin](screens/DA-SET-09/create-number/admin-light.webp) ([dark](screens/DA-SET-09/create-number/admin-dark.webp)) |
| DA-SET-09 | create-rich-text | [admin](screens/DA-SET-09/create-rich-text/admin-light.webp) ([dark](screens/DA-SET-09/create-rich-text/admin-dark.webp)) |
| DA-SET-09 | create-sheet | [admin](screens/DA-SET-09/create-sheet/admin-light.webp) ([dark](screens/DA-SET-09/create-sheet/admin-dark.webp)) |
| DA-SET-09 | create-shown-on-storefront | [admin](screens/DA-SET-09/create-shown-on-storefront/admin-light.webp) ([dark](screens/DA-SET-09/create-shown-on-storefront/admin-dark.webp)) |
| DA-SET-09 | delete-confirmation | [admin](screens/DA-SET-09/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-09/delete-confirmation/admin-dark.webp)) |
| DA-SET-09 | direct-visit | [orderManager](screens/DA-SET-09/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-09/direct-visit/orderManager-dark.webp)) |
| DA-SET-09 | edit | [admin](screens/DA-SET-09/edit/admin-light.webp) ([dark](screens/DA-SET-09/edit/admin-dark.webp)) |
| DA-SET-09 | filtered-by-resource | [admin](screens/DA-SET-09/filtered-by-resource/admin-light.webp) ([dark](screens/DA-SET-09/filtered-by-resource/admin-dark.webp)) |
| DA-SET-09 | filtered-by-type | [admin](screens/DA-SET-09/filtered-by-type/admin-light.webp) ([dark](screens/DA-SET-09/filtered-by-type/admin-dark.webp)) |
| DA-SET-09 | listed | [admin](screens/DA-SET-09/listed/admin-light.webp) ([dark](screens/DA-SET-09/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-09/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-09/listed/settingsViewer-dark.webp)) |
| DA-SET-09 | none | [admin](screens/DA-SET-09/none/admin-light.webp) ([dark](screens/DA-SET-09/none/admin-dark.webp)) |
| DA-SET-11 | create-filled | [admin](screens/DA-SET-11/create-filled/admin-light.webp) ([dark](screens/DA-SET-11/create-filled/admin-dark.webp)) |
| DA-SET-11 | create-filled-tax | [admin](screens/DA-SET-11/create-filled-tax/admin-light.webp) ([dark](screens/DA-SET-11/create-filled-tax/admin-dark.webp)) |
| DA-SET-11 | create-sheet | [admin](screens/DA-SET-11/create-sheet/admin-light.webp) ([dark](screens/DA-SET-11/create-sheet/admin-dark.webp)) |
| DA-SET-11 | delete-confirmation | [admin](screens/DA-SET-11/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-11/delete-confirmation/admin-dark.webp)) |
| DA-SET-11 | direct-visit | [orderManager](screens/DA-SET-11/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-11/direct-visit/orderManager-dark.webp)) |
| DA-SET-11 | dragging | [admin](screens/DA-SET-11/dragging/admin-light.webp) ([dark](screens/DA-SET-11/dragging/admin-dark.webp)) |
| DA-SET-11 | edit | [admin](screens/DA-SET-11/edit/admin-light.webp) ([dark](screens/DA-SET-11/edit/admin-dark.webp)), [settingsViewer](screens/DA-SET-11/edit/settingsViewer-light.webp) ([dark](screens/DA-SET-11/edit/settingsViewer-dark.webp)) |
| DA-SET-11 | listed | [admin](screens/DA-SET-11/listed/admin-light.webp) ([dark](screens/DA-SET-11/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-11/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-11/listed/settingsViewer-dark.webp)) |
| DA-SET-11 | regional-languages | [admin](screens/DA-SET-11/regional-languages/admin-light.webp) ([dark](screens/DA-SET-11/regional-languages/admin-dark.webp)) |
| DA-SET-11 | tax-engine-open | [admin](screens/DA-SET-11/tax-engine-open/admin-light.webp) ([dark](screens/DA-SET-11/tax-engine-open/admin-dark.webp)) |
| DA-SET-15 | add-with-code | [admin](screens/DA-SET-15/add-with-code/admin-light.webp) ([dark](screens/DA-SET-15/add-with-code/admin-dark.webp)) |
| DA-SET-15 | delete-confirmation | [admin](screens/DA-SET-15/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-15/delete-confirmation/admin-dark.webp)) |
| DA-SET-15 | direct-visit | [orderManager](screens/DA-SET-15/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-15/direct-visit/orderManager-dark.webp)) |
| DA-SET-15 | listed | [admin](screens/DA-SET-15/listed/admin-light.webp) ([dark](screens/DA-SET-15/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-15/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-15/listed/settingsViewer-dark.webp)) |
| DA-SET-15 | none | [admin](screens/DA-SET-15/none/admin-light.webp) ([dark](screens/DA-SET-15/none/admin-dark.webp)) |
| DA-SET-21 | add | [admin](screens/DA-SET-21/add/admin-light.webp) ([dark](screens/DA-SET-21/add/admin-dark.webp)) |
| DA-SET-21 | cancellation-reasons | [admin](screens/DA-SET-21/cancellation-reasons/admin-light.webp) ([dark](screens/DA-SET-21/cancellation-reasons/admin-dark.webp)) |
| DA-SET-21 | claim-and-refund-reasons | [admin](screens/DA-SET-21/claim-and-refund-reasons/admin-light.webp) ([dark](screens/DA-SET-21/claim-and-refund-reasons/admin-dark.webp)) |
| DA-SET-21 | delete-confirmation | [admin](screens/DA-SET-21/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-21/delete-confirmation/admin-dark.webp)) |
| DA-SET-21 | direct-visit | [orderManager](screens/DA-SET-21/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-21/direct-visit/orderManager-dark.webp)) |
| DA-SET-21 | kind-with-none | [admin](screens/DA-SET-21/kind-with-none/admin-light.webp) ([dark](screens/DA-SET-21/kind-with-none/admin-dark.webp)) |
| DA-SET-21 | listed | [admin](screens/DA-SET-21/listed/admin-light.webp) ([dark](screens/DA-SET-21/listed/admin-dark.webp)), [settingsViewer](screens/DA-SET-21/listed/settingsViewer-light.webp) ([dark](screens/DA-SET-21/listed/settingsViewer-dark.webp)) |
| DA-SET-21 | reason-in-use | [admin](screens/DA-SET-21/reason-in-use/admin-light.webp) ([dark](screens/DA-SET-21/reason-in-use/admin-dark.webp)) |
| DA-SETUP-01 | closed | [installer](screens/DA-SETUP-01/closed/installer-light.webp) ([dark](screens/DA-SETUP-01/closed/installer-dark.webp)) |
| DA-SETUP-01 | completing | [installer](screens/DA-SETUP-01/completing/installer-light.webp) ([dark](screens/DA-SETUP-01/completing/installer-dark.webp)) |
| DA-SETUP-01 | countries-failed | [installer](screens/DA-SETUP-01/countries-failed/installer-light.webp) ([dark](screens/DA-SETUP-01/countries-failed/installer-dark.webp)) |
| DA-SETUP-01 | country-chosen | [installer](screens/DA-SETUP-01/country-chosen/installer-light.webp) ([dark](screens/DA-SETUP-01/country-chosen/installer-dark.webp)) |
| DA-SETUP-01 | country-list | [installer](screens/DA-SETUP-01/country-list/installer-light.webp) ([dark](screens/DA-SETUP-01/country-list/installer-dark.webp)) |
| DA-SETUP-01 | field-errors | [installer](screens/DA-SETUP-01/field-errors/installer-light.webp) ([dark](screens/DA-SETUP-01/field-errors/installer-dark.webp)) |
| DA-SETUP-01 | form | [installer](screens/DA-SETUP-01/form/installer-light.webp) ([dark](screens/DA-SETUP-01/form/installer-dark.webp)) |
| DA-SETUP-01 | no-token | [installer](screens/DA-SETUP-01/no-token/installer-light.webp) ([dark](screens/DA-SETUP-01/no-token/installer-dark.webp)) |
| DA-SETUP-01 | passwords-differ | [installer](screens/DA-SETUP-01/passwords-differ/installer-light.webp) ([dark](screens/DA-SETUP-01/passwords-differ/installer-dark.webp)) |
| DA-SETUP-01 | status-failed | [installer](screens/DA-SETUP-01/status-failed/installer-light.webp) ([dark](screens/DA-SETUP-01/status-failed/installer-dark.webp)) |
| DA-SETUP-01 | status-rate-limited | [installer](screens/DA-SETUP-01/status-rate-limited/installer-light.webp) ([dark](screens/DA-SETUP-01/status-rate-limited/installer-dark.webp)) |
| DA-SETUP-01 | welcome | [installer](screens/DA-SETUP-01/welcome/installer-light.webp) ([dark](screens/DA-SETUP-01/welcome/installer-dark.webp)) |
| DA-SETUP-01 | wrong-token | [installer](screens/DA-SETUP-01/wrong-token/installer-light.webp) ([dark](screens/DA-SETUP-01/wrong-token/installer-dark.webp)) |

## Provisioning

| File | What it holds | Result |
|---|---|---|
| [first-run.json](provisioning/first-run.json) | What first-run setup gave a store set up for Poland in English, without sample data, read through the Admin API: 10 defaults from `Spree::Stores::ProvisionDefaults` and 14 from `Spree::Seeds::StoreResources` | All 24 present |

## Backend

| File | What it holds | Result |
|---|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's API specs for the batch's endpoints at `afd97cd`: `store_controller_spec.rb` (51), `setup_controller_spec.rb` (28), `channels_controller_spec.rb` (28), `custom_field_definitions_controller_spec.rb` (26), `order_routing_rules_controller_spec.rb` (13), `policies_controller_spec.rb` (13), `tax_exemption_reasons_controller_spec.rb` (12), `return_reasons_controller_spec.rb` (11), `markets_controller_spec.rb` (8), `refund_reasons_controller_spec.rb` (7), `order_cancellation_reasons_controller_spec.rb` (7), `claim_reasons_controller_spec.rb` (4), and the integration specs `store_spec.rb` (4) and `setup_spec.rb` (4) | 216 examples, all passed |
| [core-specs.json](backend/core-specs.json) | Spree's core specs for the store and its provisioning at `afd97cd`: `store_spec.rb` (121), `provision_defaults_spec.rb` (30), `setup_tasks_spec.rb` (8), `store_resources_spec.rb` (4) | 163 examples, all passed |

These are observations at one revision. Spree's specs are Spree's own unit checks; they ran on SQLite in this session, and CI runs Spree's suites on PostgreSQL and MySQL.
