# FB-19 batch 13 part 2, the seller panel: evidence

The captures, comparisons, checks, emails and backend results behind the [verification record](../../2026-11-10-fb-19-batch-marketplace-part-2.md). They come from the scripts in `packages/liquorify-storybook/fidelity/`: `seller-panel.ts`, which adds the seller panel's orders and members on top of part 1's marketplace (`marketplace-seed.rb`, `marketplace.ts`); `screens-batch-13-part-2.spec.ts` and `screens-batch-13-part-2-storefront.spec.ts`; `compare-batch-13-part-2.spec.ts`; `seller-panel-checks.spec.ts`; and `seller-panel-mail.spec.ts`, with `order-emails.spec.ts` capturing the emails.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | #101, branch `claude/project-thread-tcfmf8`, from `main` at `1342549c`, the work item's part 2 commit. Every capture's note names that revision; the final commit is named in the merge record |
| Running screens and Spree's specs | Spree's code at `1342549c`, which the pull request does not change. The seller panel built for production and served by its preview server, against the dashboard browser tests' own Rails server and fixtures (the browser-test server), on a fresh database. The storefront at its `main`, built for production, against the same server |
| Browser | Playwright 1.64.1's Chromium. Seller panel captures at 1280 by 960 pixels, and 390 by 844 for the phone captures; storefront captures at 1280 and 390 pixels wide; a page captured whole grows the window to the page's height. The reference images were made in the pinned Playwright 1.64.1 image |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. All 244 were checked pixel for pixel against their PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The browser-test server shows the browser tests' data plus part 1's eight sellers, their products, ledger and orders, and what `seller-panel.ts` adds through the Store and Seller APIs: four Harbour Cask orders worked to new, partly shipped, canceled and returned, a member of two sellers and a member of the turned-down seller. The storefront captures place two more purchases as a guest. Every person, seller and address is invented and uses `example.com`. Local addresses are written as `<site>`; the storefront's order number in a path as `<order>`; the reset and invitation links' tokens as `…`. The checks' answers mask every field named like a token, secret, password or acceptance link. No key or token appears, and no store ID is shown by any capture or answer.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each seller panel variant, or `<variant>-1280.webp` and `<variant>-390.webp` for the storefront, and a `.json` note beside each: the screen, the state, who was signed in, the server, the theme or width, the path, the window's size, whether the page was captured whole, how a request was answered or held to reach the state (`intercepted`), and whether the page settled |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the two widths, how many were compared, those found on one side only, and every style that differs |
| `checks/<check>/` | What each check of `seller-panel-checks.spec.ts` captured, and `answers.json` with what the Admin, Seller and Store APIs answered at each step. `storefront-order-reaches-seller/answers.json` is Harbour Cask's share of the storefront's two purchases, read through the Seller API. `seed-state.json` names the records `seller-panel.ts` made and keeps the Seller API's answer to its exchange request |
| `emails/` | EM-S-02 and EM-S-03's HTML as the server wrote them, captured at 390 and 1280 pixels, and `emails.json` with each subject and link |
| `backend/` | Spree's spec results as RSpec JSON: `seller-api-specs.json` (585 examples, the Seller API's controller and integration specs) and `core-permission-specs.json` (74, the core permission specs). Gem paths are written as `<gems>/` |

The capture and comparison runs' console logs were not kept. Their counts are in the record §10: the 162 seller panel captures (81 states and variants, each in two themes) and the 2 storefront tests passed, and 64 comparisons passed, of which 14 were run again after the story corrections of the record §4.3.

## Comparison with running screens, light and dark

| Case | Inventory ID | Story | Elements compared | Differences | Images |
|---|---|---|---|---|---|
| b13p2-account-dialog | CMP-SP-G-03 | `seller-panel-panel-account-dialog--open` | 29 | explained in the record §4 | [light](comparison/b13p2-account-dialog/light-side-by-side.webp) · [dark](comparison/b13p2-account-dialog/dark-side-by-side.webp) |
| b13p2-balance-one-currency | CMP-SP-G-03 | `seller-panel-finance-balance-summary--one-currency` | 10 | none | [light](comparison/b13p2-balance-one-currency/light-side-by-side.webp) · [dark](comparison/b13p2-balance-one-currency/dark-side-by-side.webp) |
| b13p2-business-filled | CMP-SP-G-03 | `seller-panel-profile-seller-business-card--filled` | 11 | none | [light](comparison/b13p2-business-filled/light-side-by-side.webp) · [dark](comparison/b13p2-business-filled/dark-side-by-side.webp) |
| b13p2-cancel-dialog | CMP-SP-G-02 | `seller-panel-orders-order-cancel-dialog--open` | 29 | none | [light](comparison/b13p2-cancel-dialog/light-side-by-side.webp) · [dark](comparison/b13p2-cancel-dialog/dark-side-by-side.webp) |
| b13p2-claims-none | CMP-SP-G-02 | `seller-panel-orders-post-sale-cards--no-claims` | 10 | none | [light](comparison/b13p2-claims-none/light-side-by-side.webp) · [dark](comparison/b13p2-claims-none/dark-side-by-side.webp) |
| b13p2-claims-open | CMP-SP-G-02 | `seller-panel-orders-post-sale-cards--claim-open` | 23 | none | [light](comparison/b13p2-claims-open/light-side-by-side.webp) · [dark](comparison/b13p2-claims-open/dark-side-by-side.webp) |
| b13p2-customer-addresses | CMP-SP-G-02 | `seller-panel-orders-order-customer-card--addresses` | 11 | none | [light](comparison/b13p2-customer-addresses/light-side-by-side.webp) · [dark](comparison/b13p2-customer-addresses/dark-side-by-side.webp) |
| b13p2-customer-no-addresses | CMP-SP-G-02 | `seller-panel-orders-order-customer-card--no-addresses` | 11 | none | [light](comparison/b13p2-customer-no-addresses/light-side-by-side.webp) · [dark](comparison/b13p2-customer-no-addresses/dark-side-by-side.webp) |
| b13p2-earlier-fulfill-items-form-all-units | CMP-DUI-C-23 | `dashboard-ui-composed-fulfill-items-form--all-units` | 28 | explained in the record §4 | [light](comparison/b13p2-earlier-fulfill-items-form-all-units/light-side-by-side.webp) · [dark](comparison/b13p2-earlier-fulfill-items-form-all-units/dark-side-by-side.webp) |
| b13p2-earlier-package-types-add-sheet | CMP-CORE-PG-01 | `dashboard-core-pages-package-types--add-sheet` | 29 | none | [light](comparison/b13p2-earlier-package-types-add-sheet/light-side-by-side.webp) · [dark](comparison/b13p2-earlier-package-types-add-sheet/dark-side-by-side.webp) |
| b13p2-earlier-package-types-none | CMP-CORE-PG-01 | `dashboard-core-pages-package-types--none` | 23 | none | [light](comparison/b13p2-earlier-package-types-none/light-side-by-side.webp) · [dark](comparison/b13p2-earlier-package-types-none/dark-side-by-side.webp) |
| b13p2-earnings-earned | CMP-SP-G-02 | `seller-panel-orders-order-earnings-card--earned` | 21 | none | [light](comparison/b13p2-earnings-earned/light-side-by-side.webp) · [dark](comparison/b13p2-earnings-earned/dark-side-by-side.webp) |
| b13p2-fulfill-form-all-units | CMP-SP-G-02 | `seller-panel-orders-fulfillment-fulfill-form--all-units` | 30 | none | [light](comparison/b13p2-fulfill-form-all-units/light-side-by-side.webp) · [dark](comparison/b13p2-fulfill-form-all-units/dark-side-by-side.webp) |
| b13p2-fulfillments-partly-shipped | CMP-SP-G-02 | `seller-panel-orders-fulfillments-card--partly-shipped` | 39 | none | [light](comparison/b13p2-fulfillments-partly-shipped/light-side-by-side.webp) · [dark](comparison/b13p2-fulfillments-partly-shipped/dark-side-by-side.webp) |
| b13p2-fulfillments-shipped | CMP-SP-G-02 | `seller-panel-orders-fulfillments-card--shipped` | 34 | none | [light](comparison/b13p2-fulfillments-shipped/light-side-by-side.webp) · [dark](comparison/b13p2-fulfillments-shipped/dark-side-by-side.webp) |
| b13p2-fulfillments-unfulfilled | CMP-SP-G-02 | `seller-panel-orders-fulfillments-card--unfulfilled` | 33 | none | [light](comparison/b13p2-fulfillments-unfulfilled/light-side-by-side.webp) · [dark](comparison/b13p2-fulfillments-unfulfilled/dark-side-by-side.webp) |
| b13p2-nav-badge-in-progress | CMP-SP-G-03 | `seller-panel-panel-onboarding-nav-badge--in-progress` | 3 | none | [light](comparison/b13p2-nav-badge-in-progress/light-side-by-side.webp) · [dark](comparison/b13p2-nav-badge-in-progress/dark-side-by-side.webp) |
| b13p2-new-return | CMP-SP-G-02 | `seller-panel-orders-post-sale-create-dialogs--new-return` | 26 | explained in the record §4 | [light](comparison/b13p2-new-return/light-side-by-side.webp) · [dark](comparison/b13p2-new-return/dark-side-by-side.webp) |
| b13p2-notes-no-instructions | CMP-SP-G-02 | `seller-panel-orders-order-notes-cards--no-instructions` | 9 | none | [light](comparison/b13p2-notes-no-instructions/light-side-by-side.webp) · [dark](comparison/b13p2-notes-no-instructions/dark-side-by-side.webp) |
| b13p2-payment-one-seller | CMP-SP-G-02 | `seller-panel-orders-order-payment-card--one-seller` | 14 | none | [light](comparison/b13p2-payment-one-seller/light-side-by-side.webp) · [dark](comparison/b13p2-payment-one-seller/dark-side-by-side.webp) |
| b13p2-returns-approved | CMP-SP-G-02 | `seller-panel-orders-returns-card--approved` | 24 | none | [light](comparison/b13p2-returns-approved/light-side-by-side.webp) · [dark](comparison/b13p2-returns-approved/dark-side-by-side.webp) |
| b13p2-returns-empty | CMP-SP-G-02 | `seller-panel-orders-returns-card--empty` | 10 | none | [light](comparison/b13p2-returns-empty/light-side-by-side.webp) · [dark](comparison/b13p2-returns-empty/dark-side-by-side.webp) |
| b13p2-returns-location-missing | CMP-SP-G-03 | `seller-panel-profile-seller-returns-location-card--missing` | 10 | none | [light](comparison/b13p2-returns-location-missing/light-side-by-side.webp) · [dark](comparison/b13p2-returns-location-missing/dark-side-by-side.webp) |
| b13p2-status-active | CMP-SP-G-03 | `seller-panel-products-product-status-card--active` | 9 | none | [light](comparison/b13p2-status-active/light-side-by-side.webp) · [dark](comparison/b13p2-status-active/dark-side-by-side.webp) |
| b13p2-status-draft | CMP-SP-G-03 | `seller-panel-products-product-status-card--draft` | 10 | none | [light](comparison/b13p2-status-draft/light-side-by-side.webp) · [dark](comparison/b13p2-status-draft/dark-side-by-side.webp) |
| b13p2-status-rejected | CMP-SP-G-03 | `seller-panel-products-product-status-card--rejected` | 11 | none | [light](comparison/b13p2-status-rejected/light-side-by-side.webp) · [dark](comparison/b13p2-status-rejected/dark-side-by-side.webp) |
| b13p2-summary-canceled | CMP-SP-G-02 | `seller-panel-orders-order-summary-card--canceled` | 10 | none | [light](comparison/b13p2-summary-canceled/light-side-by-side.webp) · [dark](comparison/b13p2-summary-canceled/dark-side-by-side.webp) |
| b13p2-summary-no-items | CMP-SP-G-02 | `seller-panel-orders-order-summary-card--no-items` | 11 | none | [light](comparison/b13p2-summary-no-items/light-side-by-side.webp) · [dark](comparison/b13p2-summary-no-items/dark-side-by-side.webp) |
| b13p2-summary-partly-shipped | CMP-SP-G-02 | `seller-panel-orders-order-summary-card--partly-shipped` | 10 | none | [light](comparison/b13p2-summary-partly-shipped/light-side-by-side.webp) · [dark](comparison/b13p2-summary-partly-shipped/dark-side-by-side.webp) |
| b13p2-summary-placed | CMP-SP-G-02 | `seller-panel-orders-order-summary-card--placed` | 10 | none | [light](comparison/b13p2-summary-placed/light-side-by-side.webp) · [dark](comparison/b13p2-summary-placed/dark-side-by-side.webp) |
| b13p2-switcher-two-sellers | CMP-SP-G-03 | `seller-panel-panel-seller-switcher--two-sellers` | 7 | none | [light](comparison/b13p2-switcher-two-sellers/light-side-by-side.webp) · [dark](comparison/b13p2-switcher-two-sellers/dark-side-by-side.webp) |
| b13p2-tax-empty | CMP-SP-G-03 | `seller-panel-profile-seller-tax-identifiers-card--empty` | 9 | none | [light](comparison/b13p2-tax-empty/light-side-by-side.webp) · [dark](comparison/b13p2-tax-empty/dark-side-by-side.webp) |

## Running-screen captures

| Screen | State | App | Variants | Reached in the browser |
|---|---|---|---|---|
| SF-CHK-01 | two-sellers-delivery | storefront | guest [1280](screens/SF-CHK-01/two-sellers-delivery/guest-1280.webp) [390](screens/SF-CHK-01/two-sellers-delivery/guest-390.webp) |  |
| SF-CHK-03 | order-group-placed | storefront | guest [1280](screens/SF-CHK-03/order-group-placed/guest-1280.webp) [390](screens/SF-CHK-03/order-group-placed/guest-390.webp) |  |
| SF-SHOP-05 | two-sellers | storefront | guest [1280](screens/SF-SHOP-05/two-sellers/guest-1280.webp) [390](screens/SF-SHOP-05/two-sellers/guest-390.webp) |  |
| SP-AUTH-01 | empty | seller panel | signedOut [dark](screens/SP-AUTH-01/empty/signedOut-dark.webp) [light](screens/SP-AUTH-01/empty/signedOut-light.webp) · signedOut-phone [dark](screens/SP-AUTH-01/empty/signedOut-phone-dark.webp) [light](screens/SP-AUTH-01/empty/signedOut-phone-light.webp) |  |
| SP-AUTH-01 | redirected-from-panel-address | seller panel | signedOut [dark](screens/SP-AUTH-01/redirected-from-panel-address/signedOut-dark.webp) [light](screens/SP-AUTH-01/redirected-from-panel-address/signedOut-light.webp) |  |
| SP-AUTH-01 | store-staff-refused | seller panel | storeStaff [dark](screens/SP-AUTH-01/store-staff-refused/storeStaff-dark.webp) [light](screens/SP-AUTH-01/store-staff-refused/storeStaff-light.webp) |  |
| SP-AUTH-01 | wrong-password | seller panel | signedOut [dark](screens/SP-AUTH-01/wrong-password/signedOut-dark.webp) [light](screens/SP-AUTH-01/wrong-password/signedOut-light.webp) |  |
| SP-AUTH-02 | empty | seller panel | signedOut [dark](screens/SP-AUTH-02/empty/signedOut-dark.webp) [light](screens/SP-AUTH-02/empty/signedOut-light.webp) |  |
| SP-AUTH-02 | sent | seller panel | signedOut [dark](screens/SP-AUTH-02/sent/signedOut-dark.webp) [light](screens/SP-AUTH-02/sent/signedOut-light.webp) |  |
| SP-AUTH-03 | invalid-link | seller panel | signedOut [dark](screens/SP-AUTH-03/invalid-link/signedOut-dark.webp) [light](screens/SP-AUTH-03/invalid-link/signedOut-light.webp) |  |
| SP-AUTH-03 | link-opened | seller panel | signedOut [dark](screens/SP-AUTH-03/link-opened/signedOut-dark.webp) [light](screens/SP-AUTH-03/link-opened/signedOut-light.webp) |  |
| SP-AUTH-03 | no-token | seller panel | signedOut [dark](screens/SP-AUTH-03/no-token/signedOut-dark.webp) [light](screens/SP-AUTH-03/no-token/signedOut-light.webp) |  |
| SP-AUTH-04 | invalid-link | seller panel | signedOut [dark](screens/SP-AUTH-04/invalid-link/signedOut-dark.webp) [light](screens/SP-AUTH-04/invalid-link/signedOut-light.webp) |  |
| SP-AUTH-04 | opened-by-invitee | seller panel | signedOut [dark](screens/SP-AUTH-04/opened-by-invitee/signedOut-dark.webp) [light](screens/SP-AUTH-04/opened-by-invitee/signedOut-light.webp) |  |
| SP-FIN-01 | balance-and-earnings | seller panel | member [dark](screens/SP-FIN-01/balance-and-earnings/member-dark.webp) [light](screens/SP-FIN-01/balance-and-earnings/member-light.webp) |  |
| SP-FIN-01 | nothing-earned | seller panel | onboarding [dark](screens/SP-FIN-01/nothing-earned/onboarding-dark.webp) [light](screens/SP-FIN-01/nothing-earned/onboarding-light.webp) |  |
| SP-FIN-02 | empty | seller panel | onboarding [dark](screens/SP-FIN-02/empty/onboarding-dark.webp) [light](screens/SP-FIN-02/empty/onboarding-light.webp) |  |
| SP-FIN-02 | listed | seller panel | member [dark](screens/SP-FIN-02/listed/member-dark.webp) [light](screens/SP-FIN-02/listed/member-light.webp) |  |
| SP-FIN-03 | completed | seller panel | member [dark](screens/SP-FIN-03/completed/member-dark.webp) [light](screens/SP-FIN-03/completed/member-light.webp) |  |
| SP-FIN-03 | pending | seller panel | member [dark](screens/SP-FIN-03/pending/member-dark.webp) [light](screens/SP-FIN-03/pending/member-light.webp) |  |
| SP-HOME-01 | status-member | seller panel | member [dark](screens/SP-HOME-01/status-member/member-dark.webp) [light](screens/SP-HOME-01/status-member/member-light.webp) · member-phone [dark](screens/SP-HOME-01/status-member/member-phone-dark.webp) [light](screens/SP-HOME-01/status-member/member-phone-light.webp) |  |
| SP-HOME-01 | status-onboarding | seller panel | onboarding [dark](screens/SP-HOME-01/status-onboarding/onboarding-dark.webp) [light](screens/SP-HOME-01/status-onboarding/onboarding-light.webp) |  |
| SP-HOME-01 | status-ready | seller panel | ready [dark](screens/SP-HOME-01/status-ready/ready-dark.webp) [light](screens/SP-HOME-01/status-ready/ready-light.webp) |  |
| SP-HOME-01 | status-rejected | seller panel | rejected [dark](screens/SP-HOME-01/status-rejected/rejected-dark.webp) [light](screens/SP-HOME-01/status-rejected/rejected-light.webp) |  |
| SP-HOME-01 | status-suspended | seller panel | suspended [dark](screens/SP-HOME-01/status-suspended/suspended-dark.webp) [light](screens/SP-HOME-01/status-suspended/suspended-light.webp) |  |
| SP-ONB-01 | status-member | seller panel | member [dark](screens/SP-ONB-01/status-member/member-dark.webp) [light](screens/SP-ONB-01/status-member/member-light.webp) |  |
| SP-ONB-01 | status-onboarding | seller panel | onboarding [dark](screens/SP-ONB-01/status-onboarding/onboarding-dark.webp) [light](screens/SP-ONB-01/status-onboarding/onboarding-light.webp) |  |
| SP-ONB-01 | status-ready | seller panel | ready [dark](screens/SP-ONB-01/status-ready/ready-dark.webp) [light](screens/SP-ONB-01/status-ready/ready-light.webp) |  |
| SP-ONB-01 | status-rejected | seller panel | rejected [dark](screens/SP-ONB-01/status-rejected/rejected-dark.webp) [light](screens/SP-ONB-01/status-rejected/rejected-light.webp) |  |
| SP-ONB-01 | status-suspended | seller panel | suspended [dark](screens/SP-ONB-01/status-suspended/suspended-dark.webp) [light](screens/SP-ONB-01/status-suspended/suspended-light.webp) |  |
| SP-ONB-01 | submit-while-requirements-block | seller panel | onboarding [dark](screens/SP-ONB-01/submit-while-requirements-block/onboarding-dark.webp) [light](screens/SP-ONB-01/submit-while-requirements-block/onboarding-light.webp) |  |
| SP-ORD-01 | empty | seller panel | onboarding [dark](screens/SP-ORD-01/empty/onboarding-dark.webp) [light](screens/SP-ORD-01/empty/onboarding-light.webp) |  |
| SP-ORD-01 | listed | seller panel | member [dark](screens/SP-ORD-01/listed/member-dark.webp) [light](screens/SP-ORD-01/listed/member-light.webp) |  |
| SP-ORD-01 | loading | seller panel | member [dark](screens/SP-ORD-01/loading/member-dark.webp) [light](screens/SP-ORD-01/loading/member-light.webp) | The order list request was held unanswered in the browser. |
| SP-ORD-02 | cancel-dialog | seller panel | member [dark](screens/SP-ORD-02/cancel-dialog/member-dark.webp) [light](screens/SP-ORD-02/cancel-dialog/member-light.webp) |  |
| SP-ORD-02 | canceled | seller panel | member [dark](screens/SP-ORD-02/canceled/member-dark.webp) [light](screens/SP-ORD-02/canceled/member-light.webp) |  |
| SP-ORD-02 | failed | seller panel | member [dark](screens/SP-ORD-02/failed/member-dark.webp) [light](screens/SP-ORD-02/failed/member-light.webp) | The order request was answered with a server error in the browser. |
| SP-ORD-02 | fulfilling | seller panel | member [dark](screens/SP-ORD-02/fulfilling/member-dark.webp) [light](screens/SP-ORD-02/fulfilling/member-light.webp) |  |
| SP-ORD-02 | new-return-dialog | seller panel | member [dark](screens/SP-ORD-02/new-return-dialog/member-dark.webp) [light](screens/SP-ORD-02/new-return-dialog/member-light.webp) |  |
| SP-ORD-02 | new | seller panel | member [dark](screens/SP-ORD-02/new/member-dark.webp) [light](screens/SP-ORD-02/new/member-light.webp) |  |
| SP-ORD-02 | no-items-or-addresses | seller panel | member [dark](screens/SP-ORD-02/no-items-or-addresses/member-dark.webp) [light](screens/SP-ORD-02/no-items-or-addresses/member-light.webp) |  |
| SP-ORD-02 | not-found | seller panel | member [dark](screens/SP-ORD-02/not-found/member-dark.webp) [light](screens/SP-ORD-02/not-found/member-light.webp) |  |
| SP-ORD-02 | partial | seller panel | member [dark](screens/SP-ORD-02/partial/member-dark.webp) [light](screens/SP-ORD-02/partial/member-light.webp) |  |
| SP-ORD-02 | returned | seller panel | member [dark](screens/SP-ORD-02/returned/member-dark.webp) [light](screens/SP-ORD-02/returned/member-light.webp) |  |
| SP-OVL-01 | phone-menu-open | seller panel | member-phone [dark](screens/SP-OVL-01/phone-menu-open/member-phone-dark.webp) [light](screens/SP-OVL-01/phone-menu-open/member-phone-light.webp) |  |
| SP-OVL-01 | seller-switcher-open | seller panel | twoSellers [dark](screens/SP-OVL-01/seller-switcher-open/twoSellers-dark.webp) [light](screens/SP-OVL-01/seller-switcher-open/twoSellers-light.webp) |  |
| SP-OVL-01 | user-menu-open | seller panel | member [dark](screens/SP-OVL-01/user-menu-open/member-dark.webp) [light](screens/SP-OVL-01/user-menu-open/member-light.webp) |  |
| SP-OVL-02 | open | seller panel | member [dark](screens/SP-OVL-02/open/member-dark.webp) [light](screens/SP-OVL-02/open/member-light.webp) |  |
| SP-PRD-01 | empty | seller panel | onboarding [dark](screens/SP-PRD-01/empty/onboarding-dark.webp) [light](screens/SP-PRD-01/empty/onboarding-light.webp) |  |
| SP-PRD-01 | export-open | seller panel | member [dark](screens/SP-PRD-01/export-open/member-dark.webp) [light](screens/SP-PRD-01/export-open/member-light.webp) |  |
| SP-PRD-01 | failed | seller panel | member [dark](screens/SP-PRD-01/failed/member-dark.webp) [light](screens/SP-PRD-01/failed/member-light.webp) | The product list request was answered with a server error in the browser. |
| SP-PRD-01 | import-open | seller panel | member [dark](screens/SP-PRD-01/import-open/member-dark.webp) [light](screens/SP-PRD-01/import-open/member-light.webp) |  |
| SP-PRD-01 | listed | seller panel | member [dark](screens/SP-PRD-01/listed/member-dark.webp) [light](screens/SP-PRD-01/listed/member-light.webp) · suspended [dark](screens/SP-PRD-01/listed/suspended-dark.webp) [light](screens/SP-PRD-01/listed/suspended-light.webp) |  |
| SP-PRD-01 | loading | seller panel | member [dark](screens/SP-PRD-01/loading/member-dark.webp) [light](screens/SP-PRD-01/loading/member-light.webp) | The product list request was held unanswered in the browser. |
| SP-PRD-02 | empty | seller panel | member [dark](screens/SP-PRD-02/empty/member-dark.webp) [light](screens/SP-PRD-02/empty/member-light.webp) |  |
| SP-PRD-03 | active | seller panel | member [dark](screens/SP-PRD-03/active/member-dark.webp) [light](screens/SP-PRD-03/active/member-light.webp) |  |
| SP-PRD-03 | draft | seller panel | member [dark](screens/SP-PRD-03/draft/member-dark.webp) [light](screens/SP-PRD-03/draft/member-light.webp) |  |
| SP-PRD-03 | proposed | seller panel | member [dark](screens/SP-PRD-03/proposed/member-dark.webp) [light](screens/SP-PRD-03/proposed/member-light.webp) |  |
| SP-PRD-03 | rejected | seller panel | member [dark](screens/SP-PRD-03/rejected/member-dark.webp) [light](screens/SP-PRD-03/rejected/member-light.webp) |  |
| SP-PRD-03 | suspended-seller-product | seller panel | suspended [dark](screens/SP-PRD-03/suspended-seller-product/suspended-dark.webp) [light](screens/SP-PRD-03/suspended-seller-product/suspended-light.webp) |  |
| SP-PRD-03 | take-down-confirm | seller panel | member [dark](screens/SP-PRD-03/take-down-confirm/member-dark.webp) [light](screens/SP-PRD-03/take-down-confirm/member-light.webp) |  |
| SP-PRF-01 | billing-address-dialog | seller panel | member [dark](screens/SP-PRF-01/billing-address-dialog/member-dark.webp) [light](screens/SP-PRF-01/billing-address-dialog/member-light.webp) |  |
| SP-PRF-01 | edit-profile-name-cleared | seller panel | member [dark](screens/SP-PRF-01/edit-profile-name-cleared/member-dark.webp) [light](screens/SP-PRF-01/edit-profile-name-cleared/member-light.webp) | A save, had the sheet sent one, was refused in the browser so nothing changed. |
| SP-PRF-01 | edit-profile-sheet | seller panel | member [dark](screens/SP-PRF-01/edit-profile-sheet/member-dark.webp) [light](screens/SP-PRF-01/edit-profile-sheet/member-light.webp) |  |
| SP-PRF-01 | filled | seller panel | member [dark](screens/SP-PRF-01/filled/member-dark.webp) [light](screens/SP-PRF-01/filled/member-light.webp) · onboarding [dark](screens/SP-PRF-01/filled/onboarding-dark.webp) [light](screens/SP-PRF-01/filled/onboarding-light.webp) |  |
| SP-SET-01 | index | seller panel | member [dark](screens/SP-SET-01/index/member-dark.webp) [light](screens/SP-SET-01/index/member-light.webp) |  |
| SP-SET-02 | empty | seller panel | rejected [dark](screens/SP-SET-02/empty/rejected-dark.webp) [light](screens/SP-SET-02/empty/rejected-light.webp) |  |
| SP-SET-02 | listed | seller panel | member [dark](screens/SP-SET-02/listed/member-dark.webp) [light](screens/SP-SET-02/listed/member-light.webp) |  |
| SP-SET-02 | new-sheet | seller panel | member [dark](screens/SP-SET-02/new-sheet/member-dark.webp) [light](screens/SP-SET-02/new-sheet/member-light.webp) |  |
| SP-SET-03 | empty | seller panel | member [dark](screens/SP-SET-03/empty/member-dark.webp) [light](screens/SP-SET-03/empty/member-light.webp) |  |
| SP-SET-03 | new-sheet | seller panel | member [dark](screens/SP-SET-03/new-sheet/member-dark.webp) [light](screens/SP-SET-03/new-sheet/member-light.webp) |  |
| SP-SET-04 | empty | seller panel | member [dark](screens/SP-SET-04/empty/member-dark.webp) [light](screens/SP-SET-04/empty/member-light.webp) |  |
| SP-SET-04 | new-sheet | seller panel | member [dark](screens/SP-SET-04/new-sheet/member-dark.webp) [light](screens/SP-SET-04/new-sheet/member-light.webp) |  |
| SP-SET-05 | edit-sheet | seller panel | member [dark](screens/SP-SET-05/edit-sheet/member-dark.webp) [light](screens/SP-SET-05/edit-sheet/member-light.webp) |  |
| SP-SET-05 | listed | seller panel | member [dark](screens/SP-SET-05/listed/member-dark.webp) [light](screens/SP-SET-05/listed/member-light.webp) |  |
| SP-SET-06 | invite-dialog | seller panel | member [dark](screens/SP-SET-06/invite-dialog/member-dark.webp) [light](screens/SP-SET-06/invite-dialog/member-light.webp) |  |
| SP-SET-06 | last-member-menu | seller panel | suspended [dark](screens/SP-SET-06/last-member-menu/suspended-dark.webp) [light](screens/SP-SET-06/last-member-menu/suspended-light.webp) |  |
| SP-SET-06 | member-and-invitation | seller panel | member [dark](screens/SP-SET-06/member-and-invitation/member-dark.webp) [light](screens/SP-SET-06/member-and-invitation/member-light.webp) |  |
| SP-SET-06 | only-member | seller panel | suspended [dark](screens/SP-SET-06/only-member/suspended-dark.webp) [light](screens/SP-SET-06/only-member/suspended-light.webp) |  |
| SP-SHELL-01 | two-sellers | seller panel | twoSellers [dark](screens/SP-SHELL-01/two-sellers/twoSellers-dark.webp) [light](screens/SP-SHELL-01/two-sellers/twoSellers-light.webp) |  |
