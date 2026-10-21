# FB-19 pilot: comparison with running screens, evidence

The images and computed styles behind the [fidelity record](../../2026-10-21-fb-19-pilot-fidelity.md), from the diagnostic comparison scripts (`packages/liquorify-storybook/fidelity/compare.spec.ts` in the backend, `visual/fidelity/compare.spec.ts` in the storefront). A successful run of those scripts only shows that both sides could be captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| | Stories | Running screens | Browser |
|---|---|---|---|
| Backend | [#6](https://github.com/pateldhruval872/liquorify/pull/6) at `817e177` | Spree's code at `main` `e408a63`, which #6 does not change: the built admin dashboard and seller panel, against the dashboard browser tests' own server and fixtures | Pinned image, Playwright 1.64.1 |
| Storefront | [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15) at `0a901eb` | The built storefront at `main` `a139771`, which #15 does not change, against the same server | Pinned image, Playwright 1.60.0 |

Each case folder holds, for each theme or mode:
- `<theme>-side-by-side.png`: the running screen on the left and the story on the right;
- `<theme>-styles.json`: the computed styles of every distinct element on both sides (`styles.screen`, `styles.story`), the elements compared, those found on one side only, and every style that differs.

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides; the fidelity record §5 explains each one. The screens show the browser tests' data and the stories invented data, so text, counts and flags differ on purpose. API key values are masked in magenta on both sides. The storefront's toast case signs up an invented customer at an `example.com` address.

## Backend, light and dark

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-SP-G-01 | `seller-panel-finance-balance-summary--one-currency` | Seller panel, Earnings | [dark](backend/balance-summary-one-currency/dark-side-by-side.png), [light](backend/balance-summary-one-currency/light-side-by-side.png) | [dark](backend/balance-summary-one-currency/dark-styles.json), [light](backend/balance-summary-one-currency/light-styles.json) | None |
| CMP-DA-G-01 | `admin-dashboard-api-keys-api-key-table--publishable-keys` | Admin, Settings, API keys: publishable keys card | [dark](backend/api-key-table-publishable/dark-side-by-side.png), [light](backend/api-key-table-publishable/light-side-by-side.png) | [dark](backend/api-key-table-publishable/dark-styles.json), [light](backend/api-key-table-publishable/light-styles.json) | height |
| CMP-DA-G-01 | `admin-dashboard-api-keys-api-key-table--empty` | Admin, Settings, API keys: secret keys card, with no keys | [dark](backend/api-key-table-empty/dark-side-by-side.png), [light](backend/api-key-table-empty/light-side-by-side.png) | [dark](backend/api-key-table-empty/dark-styles.json), [light](backend/api-key-table-empty/light-styles.json) | None |
| CMP-DUI-P-29 | `dashboard-ui-primitives-pagination--one-page-with-page-size` | Seller panel, Earnings | [dark](backend/pagination-one-page/dark-side-by-side.png), [light](backend/pagination-one-page/light-side-by-side.png) | [dark](backend/pagination-one-page/dark-styles.json), [light](backend/pagination-one-page/light-styles.json) | None |
| CMP-DUI-P-35 | `dashboard-ui-primitives-select--default` | Admin, product page, Status card | [dark](backend/select-default/dark-side-by-side.png), [light](backend/select-default/light-side-by-side.png) | [dark](backend/select-default/dark-styles.json), [light](backend/select-default/light-styles.json) | None |
| CMP-DUI-P-35 | `dashboard-ui-primitives-select--open` | The same select, open | [dark](backend/select-open/dark-side-by-side.png), [light](backend/select-open/light-side-by-side.png) | [dark](backend/select-open/dark-styles.json), [light](backend/select-open/light-styles.json) | None |
| CMP-DUI-C-03 | `dashboard-ui-composed-back-button--default` | Admin, product page | [dark](backend/back-button/dark-side-by-side.png), [light](backend/back-button/light-side-by-side.png) | [dark](backend/back-button/dark-styles.json), [light](backend/back-button/light-styles.json) | None |
| CMP-DUI-C-03 | `dashboard-ui-composed-back-button--focus-visible` | The same button, focused from the keyboard | [dark](backend/back-button-focus-visible/dark-side-by-side.png), [light](backend/back-button-focus-visible/light-side-by-side.png) | [dark](backend/back-button-focus-visible/dark-styles.json), [light](backend/back-button-focus-visible/light-styles.json) | None |
| CMP-DUI-P-07 | `dashboard-ui-primitives-button--with-icon` | Admin, Settings, API keys: "New key" | [dark](backend/button-default-with-icon/dark-side-by-side.png), [light](backend/button-default-with-icon/light-side-by-side.png) | [dark](backend/button-default-with-icon/dark-styles.json), [light](backend/button-default-with-icon/light-styles.json) | None |
| CMP-DUI-P-07 | `dashboard-ui-primitives-button--focus-visible` | "New key", focused | [dark](backend/button-focus-visible/dark-side-by-side.png), [light](backend/button-focus-visible/light-side-by-side.png) | [dark](backend/button-focus-visible/dark-styles.json), [light](backend/button-focus-visible/light-styles.json) | None |
| CMP-DUI-P-07 | `dashboard-ui-primitives-button--outline` | Admin, Settings, Stock locations, location sheet: "Cancel" | [dark](backend/button-outline/dark-side-by-side.png), [light](backend/button-outline/light-side-by-side.png) | [dark](backend/button-outline/dark-styles.json), [light](backend/button-outline/light-styles.json) | None |
| CMP-CORE-06 | `dashboard-core-country-combobox--selected` | Stock location sheet | [dark](backend/country-combobox-selected/dark-side-by-side.png), [light](backend/country-combobox-selected/light-side-by-side.png) | [dark](backend/country-combobox-selected/dark-styles.json), [light](backend/country-combobox-selected/light-styles.json) | None |
| CMP-CORE-06 | `dashboard-core-country-combobox--open` | The same combobox, open | [dark](backend/country-combobox-open/dark-side-by-side.png), [light](backend/country-combobox-open/light-side-by-side.png) | [dark](backend/country-combobox-open/dark-styles.json), [light](backend/country-combobox-open/light-styles.json) | None |

Tokens: [dark.json](backend/tokens/dark.json), [light.json](backend/tokens/light.json).

## Storefront

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-SF-G-05 | `storefront-home-hero-section--default` | Home page | [desktop](storefront/hero-section/desktop-side-by-side.png), [mobile](storefront/hero-section/mobile-side-by-side.png) | [desktop](storefront/hero-section/desktop-styles.json), [mobile](storefront/hero-section/mobile-styles.json) | font-family |
| CMP-SF-P-04 | `storefront-ui-button--sizes` | Product page: "Add to Cart" | [desktop](storefront/button-large/desktop-side-by-side.png), [mobile](storefront/button-large/mobile-side-by-side.png) | [desktop](storefront/button-large/desktop-styles.json), [mobile](storefront/button-large/mobile-styles.json) | font-family |
| CMP-SF-G-03 | `storefront-cart-cart-drawer--empty` | Header's cart button, clicked | [desktop](storefront/cart-drawer-empty/desktop-side-by-side.png), [mobile](storefront/cart-drawer-empty/mobile-side-by-side.png) | [desktop](storefront/cart-drawer-empty/desktop-styles.json), [mobile](storefront/cart-drawer-empty/mobile-styles.json) | border-top-color, font-family |
| CMP-SF-G-03 | `storefront-cart-cart-drawer--empty` | Header's cart button, opened from the keyboard | [desktop](storefront/cart-drawer-empty-keyboard/desktop-side-by-side.png), [mobile](storefront/cart-drawer-empty-keyboard/mobile-side-by-side.png) | [desktop](storefront/cart-drawer-empty-keyboard/desktop-styles.json), [mobile](storefront/cart-drawer-empty-keyboard/mobile-styles.json) | font-family |
| CMP-SF-G-03 | `storefront-cart-cart-drawer--with-items` | After "Add to Cart", which opens it | [desktop](storefront/cart-drawer-with-items/desktop-side-by-side.png), [mobile](storefront/cart-drawer-with-items/mobile-side-by-side.png) | [desktop](storefront/cart-drawer-with-items/desktop-styles.json), [mobile](storefront/cart-drawer-with-items/mobile-styles.json) | border-bottom-width, border-top-color, font-family, height |
| CMP-SF-G-03 | `storefront-cart-cart-drawer--with-items` | Closed, then opened from the keyboard | [desktop](storefront/cart-drawer-with-items-keyboard/desktop-side-by-side.png), [mobile](storefront/cart-drawer-with-items-keyboard/mobile-side-by-side.png) | [desktop](storefront/cart-drawer-with-items-keyboard/desktop-styles.json), [mobile](storefront/cart-drawer-with-items-keyboard/mobile-styles.json) | border-bottom-width, border-top-color, font-family, height |
| CMP-SF-P-21 | `storefront-ui-toaster--success` | Account, Profile: "Save Changes" | [desktop](storefront/toaster-success/desktop-side-by-side.png), [desktop-system-dark](storefront/toaster-success/desktop-system-dark-side-by-side.png) | [desktop](storefront/toaster-success/desktop-styles.json), [desktop-system-dark](storefront/toaster-success/desktop-system-dark-styles.json) | None |

Tokens: [desktop.json](storefront/tokens/desktop.json).
