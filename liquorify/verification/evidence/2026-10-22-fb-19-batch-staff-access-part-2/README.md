# FB-19 staff access batch, part 2: evidence

The captures, comparisons and backend results behind the [verification record](../../2026-10-22-fb-19-batch-staff-access-part-2.md). They come from the scripts in `packages/liquorify-storybook/fidelity/` (`screens.spec.ts`, `compare.spec.ts`, `refusals.spec.ts`) and from Spree's own specs. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Draft pull request [#14](https://github.com/pateldhruval872/liquorify/pull/14), at its first commit |
| Running screens and Spree's specs | Spree's code at `a4a1708`, which the pull request does not change: the built admin dashboard against the dashboard browser tests' own Rails server and fixtures |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels, or 390 by 844 on a phone; comparisons at 1280 by 800, or 390 by 844 for the phone's cases |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The screens show the browser tests' data, plus the roles and teammates `fidelity/staff.ts` adds through the Admin API. Teammates use `example.com` addresses. Each capture's store is written as `<store>` and the order as `<order>` in its notes. No token, key or password is recorded.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role, the theme, the revision, the path, the window's size, the request held or answered to reach the state (`intercepted`), whether the page settled, and every request blocked because it would have left the local servers (`outside`, empty in all 68) |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs |
| `backend/` | `api-specs.json`: every example of Spree's specs for the shell's endpoints; `search-specs.json`: every example of Spree's specs for the command palette's nine searches; each with its file, line, description and result. `refusals-search.json`: what the running server answered each palette search, as four teammates, and the answer each role should get (§3.2 of the record). `profile-saves.json`: what the server took on two profile saves (§5, B6) |

## Comparison with running screens, light and dark

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides; the verification record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-CORE-03 | `dashboard-core-shell-app-sidebar--admin` | The rail, as the admin | [dark](comparison/app-sidebar-admin/dark-side-by-side.webp), [light](comparison/app-sidebar-admin/light-side-by-side.webp) | [dark](comparison/app-sidebar-admin/dark-styles.json), [light](comparison/app-sidebar-admin/light-styles.json) | None |
| CMP-CORE-03 | `dashboard-core-shell-app-sidebar--order-manager` | The rail, as the order manager teammate | [dark](comparison/app-sidebar-order-manager/dark-side-by-side.webp), [light](comparison/app-sidebar-order-manager/light-side-by-side.webp) | [dark](comparison/app-sidebar-order-manager/dark-styles.json), [light](comparison/app-sidebar-order-manager/light-styles.json) | None |
| CMP-CORE-03 | `dashboard-core-shell-app-sidebar--merchandiser` | The rail, as the merchandiser teammate | [dark](comparison/app-sidebar-merchandiser/dark-side-by-side.webp), [light](comparison/app-sidebar-merchandiser/light-side-by-side.webp) | [dark](comparison/app-sidebar-merchandiser/dark-styles.json), [light](comparison/app-sidebar-merchandiser/light-styles.json) | None |
| CMP-CORE-03 | `dashboard-core-shell-app-sidebar--support` | The rail, as the support teammate | [dark](comparison/app-sidebar-support/dark-side-by-side.webp), [light](comparison/app-sidebar-support/light-side-by-side.webp) | [dark](comparison/app-sidebar-support/dark-styles.json), [light](comparison/app-sidebar-support/light-styles.json) | None |
| CMP-CORE-03 | `dashboard-core-shell-app-sidebar--loading` | The rail with the permissions request held open | [dark](comparison/app-sidebar-loading/dark-side-by-side.webp), [light](comparison/app-sidebar-loading/light-side-by-side.webp) | [dark](comparison/app-sidebar-loading/dark-styles.json), [light](comparison/app-sidebar-loading/light-styles.json) | None |
| CMP-CORE-02 | `dashboard-core-shell-app-shell--collapsed` | The rail folded to icons | [dark](comparison/app-shell-collapsed/dark-side-by-side.webp), [light](comparison/app-shell-collapsed/light-side-by-side.webp) | [dark](comparison/app-shell-collapsed/dark-styles.json), [light](comparison/app-shell-collapsed/light-styles.json) | None |
| CMP-CORE-29 | `dashboard-core-shell-app-shell--in-settings` | The settings navigation, on the staff page | [dark](comparison/settings-sidebar/dark-side-by-side.webp), [light](comparison/settings-sidebar/light-side-by-side.webp) | [dark](comparison/settings-sidebar/dark-styles.json), [light](comparison/settings-sidebar/light-styles.json) | None |
| CMP-CORE-36 | `dashboard-core-shell-store-switcher--open` | The store switcher, open | [dark](comparison/store-switcher-open/dark-side-by-side.webp), [light](comparison/store-switcher-open/light-side-by-side.webp) | [dark](comparison/store-switcher-open/dark-styles.json), [light](comparison/store-switcher-open/light-styles.json) | None |
| CMP-CORE-32 | `dashboard-core-shell-sidebar-user--unnamed` | The account menu, open; the browser tests' admin has no name | [dark](comparison/sidebar-user-open/dark-side-by-side.webp), [light](comparison/sidebar-user-open/light-side-by-side.webp) | [dark](comparison/sidebar-user-open/dark-styles.json), [light](comparison/sidebar-user-open/light-styles.json) | None |
| CMP-CORE-31 | `dashboard-core-shell-sidebar-search--focus-visible` | The rail's search button, focused | [dark](comparison/sidebar-search/dark-side-by-side.webp), [light](comparison/sidebar-search/light-side-by-side.webp) | [dark](comparison/sidebar-search/dark-styles.json), [light](comparison/sidebar-search/light-styles.json) | None |
| CMP-CORE-33 | `dashboard-core-shell-skip-link--focus-visible` | The skip link, reached with Tab | [dark](comparison/skip-link-focus-visible/dark-side-by-side.webp), [light](comparison/skip-link-focus-visible/light-side-by-side.webp) | [dark](comparison/skip-link-focus-visible/dark-styles.json), [light](comparison/skip-link-focus-visible/light-styles.json) | None |
| CMP-CORE-17 | `dashboard-core-shell-app-shell--on-a-phone` | The phone's top bar | [dark](comparison/mobile-top-bar/dark-side-by-side.webp), [light](comparison/mobile-top-bar/light-side-by-side.webp) | [dark](comparison/mobile-top-bar/dark-styles.json), [light](comparison/mobile-top-bar/light-styles.json) | None |
| CMP-CORE-02 | `dashboard-core-shell-app-shell--on-a-phone-navigation-open` | The phone's navigation drawer | [dark](comparison/app-shell-phone-navigation-open/dark-side-by-side.webp), [light](comparison/app-shell-phone-navigation-open/light-side-by-side.webp) | [dark](comparison/app-shell-phone-navigation-open/dark-styles.json), [light](comparison/app-shell-phone-navigation-open/light-styles.json) | None |
| CMP-CORE-17 | `dashboard-core-shell-mobile-top-bar--account-menu-open` | The account menu on a phone | [dark](comparison/mobile-account-menu/dark-side-by-side.webp), [light](comparison/mobile-account-menu/light-side-by-side.webp) | [dark](comparison/mobile-account-menu/dark-styles.json), [light](comparison/mobile-account-menu/light-styles.json) | None |
| CMP-CORE-39 | `dashboard-core-shell-top-bar-breadcrumbs--on-a-phone-in-settings` | The breadcrumb bar on a phone, in settings | [dark](comparison/breadcrumbs-phone-settings/dark-side-by-side.webp), [light](comparison/breadcrumbs-phone-settings/light-side-by-side.webp) | [dark](comparison/breadcrumbs-phone-settings/dark-styles.json), [light](comparison/breadcrumbs-phone-settings/light-styles.json) | None |
| CMP-CORE-39 | `dashboard-core-shell-top-bar-breadcrumbs--child-page` | The breadcrumbs on Returns, with the rail folded | [dark](comparison/breadcrumbs-child-page/dark-side-by-side.webp), [light](comparison/breadcrumbs-child-page/light-side-by-side.webp) | [dark](comparison/breadcrumbs-child-page/dark-styles.json), [light](comparison/breadcrumbs-child-page/light-styles.json) | None |
| CMP-CORE-30 | `dashboard-core-shell-sheet-top-bar--record-page` | The top bar on an order, with the rail folded | [dark](comparison/sheet-top-bar-record-page/dark-side-by-side.webp), [light](comparison/sheet-top-bar-record-page/light-side-by-side.webp) | [dark](comparison/sheet-top-bar-record-page/dark-styles.json), [light](comparison/sheet-top-bar-record-page/light-styles.json) | None |
| CMP-CORE-19 | `dashboard-core-shell-nav-main--child-page` | The rail on Returns | [dark](comparison/nav-main-child-page/dark-side-by-side.webp), [light](comparison/nav-main-child-page/light-side-by-side.webp) | [dark](comparison/nav-main-child-page/dark-styles.json), [light](comparison/nav-main-child-page/light-styles.json) | None |
| CMP-DA-G-05 | `admin-dashboard-shell-command-palette--open` | The command palette, open | [dark](comparison/command-palette-open/dark-side-by-side.webp), [light](comparison/command-palette-open/light-side-by-side.webp) | [dark](comparison/command-palette-open/dark-styles.json), [light](comparison/command-palette-open/light-styles.json) | None |
| CMP-DA-G-05 | `admin-dashboard-shell-command-palette--create-actions` | The palette, searching "new" | [dark](comparison/command-palette-create-actions/dark-side-by-side.webp), [light](comparison/command-palette-create-actions/light-side-by-side.webp) | [dark](comparison/command-palette-create-actions/dark-styles.json), [light](comparison/command-palette-create-actions/light-styles.json) | None |
| CMP-DA-G-05 | `admin-dashboard-shell-command-palette--nothing-matches` | The palette, searching "zzqx" | [dark](comparison/command-palette-nothing-matches/dark-side-by-side.webp), [light](comparison/command-palette-nothing-matches/light-side-by-side.webp) | [dark](comparison/command-palette-nothing-matches/dark-styles.json), [light](comparison/command-palette-nothing-matches/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-shell-notifications--nothing-new` | Notifications, nothing new | [dark](comparison/notifications-empty/dark-side-by-side.webp), [light](comparison/notifications-empty/light-side-by-side.webp) | [dark](comparison/notifications-empty/dark-styles.json), [light](comparison/notifications-empty/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-24 | `admin-dashboard-shell-notifications--new-release` | Notifications, with the update check answered with the story's release | [dark](comparison/notifications-new-release/dark-side-by-side.webp), [light](comparison/notifications-new-release/light-side-by-side.webp) | [dark](comparison/notifications-new-release/dark-styles.json), [light](comparison/notifications-new-release/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-shell-profile-dialog--default` | The profile dialog | [dark](comparison/profile-dialog/dark-side-by-side.webp), [light](comparison/profile-dialog/light-side-by-side.webp) | [dark](comparison/profile-dialog/dark-styles.json), [light](comparison/profile-dialog/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-24 | `admin-dashboard-shell-profile-dialog--field-errors` | The profile dialog, its save answered with a field error | [dark](comparison/profile-dialog-field-errors/dark-side-by-side.webp), [light](comparison/profile-dialog-field-errors/light-side-by-side.webp) | [dark](comparison/profile-dialog-field-errors/dark-styles.json), [light](comparison/profile-dialog-field-errors/light-styles.json) | None |
| CMP-DUI-P-38 | `dashboard-ui-primitives-sidebar--expanded` | The rail | [dark](comparison/sidebar-primitive-expanded/dark-side-by-side.webp), [light](comparison/sidebar-primitive-expanded/light-side-by-side.webp) | [dark](comparison/sidebar-primitive-expanded/dark-styles.json), [light](comparison/sidebar-primitive-expanded/light-styles.json) | box-shadow, color, font-family, font-size, font-weight, height, line-height; 44 elements on the screen only, 6 in the story only |
| CMP-DUI-P-21 | `dashboard-ui-primitives-dropdown-menu--open` | A teammate's menu on the staff page | [dark](comparison/dropdown-menu-open/dark-side-by-side.webp), [light](comparison/dropdown-menu-open/light-side-by-side.webp) | [dark](comparison/dropdown-menu-open/dark-styles.json), [light](comparison/dropdown-menu-open/light-styles.json) | color, height; 3 elements on the screen only, 9 in the story only |
| CMP-DUI-P-15 | `dashboard-ui-primitives-command--in-a-dialog` | The command palette, open | [dark](comparison/command-in-a-dialog/dark-side-by-side.webp), [light](comparison/command-in-a-dialog/light-side-by-side.webp) | [dark](comparison/command-in-a-dialog/dark-styles.json), [light](comparison/command-in-a-dialog/light-styles.json) | height, padding-bottom; 34 elements on the screen only, 2 in the story only |
| CMP-DUI-C-53 | `dashboard-ui-composed-theme-toggle--following-the-system` | The theme row of the account menu | [dark](comparison/theme-toggle-system/dark-side-by-side.webp), [light](comparison/theme-toggle-system/light-side-by-side.webp) | [dark](comparison/theme-toggle-system/dark-styles.json), [light](comparison/theme-toggle-system/light-styles.json) | None |
| CMP-DUI-C-30 | `dashboard-ui-composed-language-menu-items--default` | The language row of the account menu | [dark](comparison/language-menu-items/dark-side-by-side.webp), [light](comparison/language-menu-items/light-side-by-side.webp) | [dark](comparison/language-menu-items/dark-styles.json), [light](comparison/language-menu-items/light-styles.json) | None |
| CMP-DUI-C-47 | `dashboard-ui-composed-search-input--empty` | The settings menu's search box, on the staff page | [dark](comparison/search-input-empty/dark-side-by-side.webp), [light](comparison/search-input-empty/light-side-by-side.webp) | [dark](comparison/search-input-empty/dark-styles.json), [light](comparison/search-input-empty/light-styles.json) | None |
| CMP-CORE-11 | `dashboard-core-image-upload-field--empty` | The profile dialog's photo field | [dark](comparison/image-upload-field-empty/dark-side-by-side.webp), [light](comparison/image-upload-field-empty/light-side-by-side.webp) | [dark](comparison/image-upload-field-empty/dark-styles.json), [light](comparison/image-upload-field-empty/light-styles.json) | font-size, line-height |

## Screens, by state and variant

Each state of DA-OVL-01 to DA-OVL-04 as it runs, light and dark. The variant names who is signed in:

- **admin** is the browser tests' admin, who holds every permission.
- **support** is the support teammate `fidelity/staff.ts` adds; it shows what a narrower role sees in the account menu and the command palette.
- **roleChange** is a teammate signed in with the support role (`role-given-before`), then given the merchandiser role as well by the admin in the edit teammate sheet, and signed in again (`role-given-after`). The teammate's roles are put back afterwards.
- **public** is nobody: part 1's sign-in capture with wrong credentials, rerun after the fix to part 1's script that the verification record §1 describes.

The states whose names start with `mobile-`, and each `on-a-phone` state, are captured at 390 by 844 pixels; every other state at 1280 by 960. Each capture's notes are in the JSON file beside it.

| Screen | State | Captures |
|---|---|---|
| DA-AUTH-01 | wrong-credentials | [public](screens/DA-AUTH-01/wrong-credentials/public-light.webp) ([dark](screens/DA-AUTH-01/wrong-credentials/public-dark.webp)) |
| DA-OVL-01 | collapsed-search-tooltip | [admin](screens/DA-OVL-01/collapsed-search-tooltip/admin-light.webp) ([dark](screens/DA-OVL-01/collapsed-search-tooltip/admin-dark.webp)) |
| DA-OVL-01 | collapsed-section-menu | [admin](screens/DA-OVL-01/collapsed-section-menu/admin-light.webp) ([dark](screens/DA-OVL-01/collapsed-section-menu/admin-dark.webp)) |
| DA-OVL-01 | collapsed-sidebar | [admin](screens/DA-OVL-01/collapsed-sidebar/admin-light.webp) ([dark](screens/DA-OVL-01/collapsed-sidebar/admin-dark.webp)) |
| DA-OVL-01 | mobile-account-menu | [admin](screens/DA-OVL-01/mobile-account-menu/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-account-menu/admin-dark.webp)) |
| DA-OVL-01 | mobile-navigation-open | [admin](screens/DA-OVL-01/mobile-navigation-open/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-navigation-open/admin-dark.webp)) |
| DA-OVL-01 | mobile-record-breadcrumbs | [admin](screens/DA-OVL-01/mobile-record-breadcrumbs/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-record-breadcrumbs/admin-dark.webp)) |
| DA-OVL-01 | mobile-settings-breadcrumbs | [admin](screens/DA-OVL-01/mobile-settings-breadcrumbs/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-settings-breadcrumbs/admin-dark.webp)) |
| DA-OVL-01 | mobile-settings-menu-open | [admin](screens/DA-OVL-01/mobile-settings-menu-open/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-settings-menu-open/admin-dark.webp)) |
| DA-OVL-01 | mobile-store-loading | [admin](screens/DA-OVL-01/mobile-store-loading/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-store-loading/admin-dark.webp)) |
| DA-OVL-01 | mobile-top-bar | [admin](screens/DA-OVL-01/mobile-top-bar/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-top-bar/admin-dark.webp)) |
| DA-OVL-01 | mobile-unread-notification | [admin](screens/DA-OVL-01/mobile-unread-notification/admin-light.webp) ([dark](screens/DA-OVL-01/mobile-unread-notification/admin-dark.webp)) |
| DA-OVL-01 | navigation-loading | [admin](screens/DA-OVL-01/navigation-loading/admin-light.webp) ([dark](screens/DA-OVL-01/navigation-loading/admin-dark.webp)) |
| DA-OVL-01 | record-page | [admin](screens/DA-OVL-01/record-page/admin-light.webp) ([dark](screens/DA-OVL-01/record-page/admin-dark.webp)) |
| DA-OVL-01 | role-given-after | [roleChange](screens/DA-OVL-01/role-given-after/roleChange-light.webp) ([dark](screens/DA-OVL-01/role-given-after/roleChange-dark.webp)) |
| DA-OVL-01 | role-given-before | [roleChange](screens/DA-OVL-01/role-given-before/roleChange-light.webp) ([dark](screens/DA-OVL-01/role-given-before/roleChange-dark.webp)) |
| DA-OVL-01 | settings-search | [admin](screens/DA-OVL-01/settings-search/admin-light.webp) ([dark](screens/DA-OVL-01/settings-search/admin-dark.webp)) |
| DA-OVL-01 | settings-search-nothing-matches | [admin](screens/DA-OVL-01/settings-search-nothing-matches/admin-light.webp) ([dark](screens/DA-OVL-01/settings-search-nothing-matches/admin-dark.webp)) |
| DA-OVL-01 | store-loading | [admin](screens/DA-OVL-01/store-loading/admin-light.webp) ([dark](screens/DA-OVL-01/store-loading/admin-dark.webp)) |
| DA-OVL-01 | store-switcher-open | [admin](screens/DA-OVL-01/store-switcher-open/admin-light.webp) ([dark](screens/DA-OVL-01/store-switcher-open/admin-dark.webp)) |
| DA-OVL-01 | user-menu-open | [admin](screens/DA-OVL-01/user-menu-open/admin-light.webp) ([dark](screens/DA-OVL-01/user-menu-open/admin-dark.webp)), [support](screens/DA-OVL-01/user-menu-open/support-light.webp) ([dark](screens/DA-OVL-01/user-menu-open/support-dark.webp)) |
| DA-OVL-02 | create-actions | [admin](screens/DA-OVL-02/create-actions/admin-light.webp) ([dark](screens/DA-OVL-02/create-actions/admin-dark.webp)) |
| DA-OVL-02 | nothing-matches | [admin](screens/DA-OVL-02/nothing-matches/admin-light.webp) ([dark](screens/DA-OVL-02/nothing-matches/admin-dark.webp)) |
| DA-OVL-02 | on-a-phone | [admin](screens/DA-OVL-02/on-a-phone/admin-light.webp) ([dark](screens/DA-OVL-02/on-a-phone/admin-dark.webp)) |
| DA-OVL-02 | open | [admin](screens/DA-OVL-02/open/admin-light.webp) ([dark](screens/DA-OVL-02/open/admin-dark.webp)), [support](screens/DA-OVL-02/open/support-light.webp) ([dark](screens/DA-OVL-02/open/support-dark.webp)) |
| DA-OVL-02 | results | [admin](screens/DA-OVL-02/results/admin-light.webp) ([dark](screens/DA-OVL-02/results/admin-dark.webp)) |
| DA-OVL-03 | empty | [admin](screens/DA-OVL-03/empty/admin-light.webp) ([dark](screens/DA-OVL-03/empty/admin-dark.webp)) |
| DA-OVL-03 | populated | [admin](screens/DA-OVL-03/populated/admin-light.webp) ([dark](screens/DA-OVL-03/populated/admin-dark.webp)) |
| DA-OVL-03 | unread | [admin](screens/DA-OVL-03/unread/admin-light.webp) ([dark](screens/DA-OVL-03/unread/admin-dark.webp)) |
| DA-OVL-04 | default | [admin](screens/DA-OVL-04/default/admin-light.webp) ([dark](screens/DA-OVL-04/default/admin-dark.webp)) |
| DA-OVL-04 | field-errors | [admin](screens/DA-OVL-04/field-errors/admin-light.webp) ([dark](screens/DA-OVL-04/field-errors/admin-dark.webp)) |
| DA-OVL-04 | on-a-phone | [admin](screens/DA-OVL-04/on-a-phone/admin-light.webp) ([dark](screens/DA-OVL-04/on-a-phone/admin-dark.webp)) |

## Backend

| File | What it holds | Result |
|---|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's specs for the shell's endpoints at `a4a1708`: `store_controller_spec.rb` (51), `me_controller_spec.rb` (24), `files_controller_spec.rb` (10), `dashboard_controller_spec.rb` (8), `updates_controller_spec.rb` (3) | 96 examples, all passed |
| [search-specs.json](backend/search-specs.json) | Spree's specs for the nine endpoints the command palette searches, at `a4a1708`: products (158), orders (90), sellers (32), customers (31), promotions (30), categories (29), companies (23), customer groups (16), collections (16) | 425 examples, all passed |
| [refusals-search.json](backend/refusals-search.json) | What the running server answered each of the nine palette searches, sent as the staff viewer, support, the order manager and the merchandiser, beside the answer each role should get | 36 answers, all as expected: 11 answered 200, 25 answered 403 `access_denied` naming the missing permission |
| [profile-saves.json](backend/profile-saves.json) | What the server took on two profile saves by the role-change teammate: a 300-letter first name, and the language code `xx`, for which Spree has no translations (record §5, B6) | Both answered 200 and were saved; the teammate's profile was restored afterwards |

These are observations at one revision. Spree's specs are Spree's own unit checks; the refusal check and the profile saves are not Spree's specs and are not run in CI.
