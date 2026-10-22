# FB-19 staff access batch, part 1: evidence

The captures, comparisons, emails and backend results behind the [verification record](../../2026-10-22-fb-19-batch-staff-access-part-1.md). They come from the scripts in `packages/liquorify-storybook/fidelity/` (`screens.spec.ts`, `compare.spec.ts`, `refusals.spec.ts`), from Spree's own mailer previews and from Spree's own specs. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is the owner's judgement from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Draft pull request [#11](https://github.com/pateldhruval872/liquorify/pull/11) at `0b0820d` |
| Running screens, emails and Spree's specs | Spree's code at `main` `a4a1708`, which #11 does not change: the built admin dashboard against the dashboard browser tests' own Rails server and fixtures |
| Browser | The pinned Playwright 1.64.1 image. Screens at 1280 by 960 pixels; comparisons and emails at 1280 by 800 |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The screens show the browser tests' data, plus the roles and teammates `fidelity/staff.ts` adds through the Admin API. Teammates use `example.com` addresses. Each capture's store is written as `<store>` in its notes. No token, key or acceptance link is recorded.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each permission variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role and permission keys, the theme, the revision, the path, the request held or answered to reach the state (`intercepted`), and whether the page settled |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs |
| `emails/` | `<email ID>.webp` as the browser-test data has it, `<email ID>-named.webp` with the staff member given a name, and `emails.json`: for each, the preview, the template, the subject and the parts |
| `backend/` | `api-specs.json` and `core-specs.json`: every example of Spree's staff and role specs with its file, line, description and result; `refusals.json`: what the running server answered each refused request (§3.2 of the record) |

## Comparison with running screens, light and dark

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides; the verification record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-CORE-20 | `dashboard-core-page-header--default` | Staff page header | [dark](comparison/page-header-staff/dark-side-by-side.webp), [light](comparison/page-header-staff/light-side-by-side.webp) | [dark](comparison/page-header-staff/dark-styles.json), [light](comparison/page-header-staff/light-styles.json) | None |
| CMP-DUI-C-19 | `dashboard-ui-composed-external-link--in-a-description` | Staff page description | [dark](comparison/external-link-in-a-description/dark-side-by-side.webp), [light](comparison/external-link-in-a-description/light-side-by-side.webp) | [dark](comparison/external-link-in-a-description/dark-styles.json), [light](comparison/external-link-in-a-description/light-styles.json) | None |
| CMP-DUI-P-17 | `dashboard-ui-primitives-data-table--default` | Staff page, Members card | [dark](comparison/data-table-members/dark-side-by-side.webp), [light](comparison/data-table-members/light-side-by-side.webp) | [dark](comparison/data-table-members/dark-styles.json), [light](comparison/data-table-members/light-styles.json) | height |
| CMP-DUI-P-17 | `dashboard-ui-primitives-data-table--roles` | Roles page | [dark](comparison/data-table-roles/dark-side-by-side.webp), [light](comparison/data-table-roles/light-side-by-side.webp) | [dark](comparison/data-table-roles/dark-styles.json), [light](comparison/data-table-roles/light-styles.json) | height |
| CMP-DUI-C-38 | `dashboard-ui-composed-relative-time--future` | Staff page, an invitation's expiry | [dark](comparison/relative-time-future/dark-side-by-side.webp), [light](comparison/relative-time-future/light-side-by-side.webp) | [dark](comparison/relative-time-future/dark-styles.json), [light](comparison/relative-time-future/light-styles.json) | height |
| CMP-DUI-C-45 | `dashboard-ui-composed-row-actions--open` | Staff page, a teammate's menu | [dark](comparison/row-actions-open/dark-side-by-side.webp), [light](comparison/row-actions-open/light-side-by-side.webp) | [dark](comparison/row-actions-open/dark-styles.json), [light](comparison/row-actions-open/light-styles.json) | None |
| CMP-DUI-P-20 | `dashboard-ui-primitives-dialog--default` | Invite teammate dialog | [dark](comparison/dialog-invite/dark-side-by-side.webp), [light](comparison/dialog-invite/light-side-by-side.webp) | [dark](comparison/dialog-invite/dark-styles.json), [light](comparison/dialog-invite/light-styles.json) | None; on the screen only: `form` |
| CMP-DUI-P-20 | `dashboard-ui-primitives-dialog--field-errors` | The invite dialog, sent without a role | [dark](comparison/dialog-role-required/dark-side-by-side.webp), [light](comparison/dialog-role-required/light-side-by-side.webp) | [dark](comparison/dialog-role-required/dark-styles.json), [light](comparison/dialog-role-required/light-styles.json) | background-color, border-bottom-color, border-top-color, box-shadow; on the screen only: `form` |
| CMP-DUI-P-37 | `dashboard-ui-primitives-sheet--default` | Edit teammate sheet | [dark](comparison/sheet-edit-teammate/dark-side-by-side.webp), [light](comparison/sheet-edit-teammate/light-side-by-side.webp) | [dark](comparison/sheet-edit-teammate/dark-styles.json), [light](comparison/sheet-edit-teammate/light-styles.json) | height |
| CMP-DUI-C-10 | `dashboard-ui-composed-confirm-dialog--remove-teammate` | Remove teammate confirmation | [dark](comparison/confirm-remove-teammate/dark-side-by-side.webp), [light](comparison/confirm-remove-teammate/light-side-by-side.webp) | [dark](comparison/confirm-remove-teammate/dark-styles.json), [light](comparison/confirm-remove-teammate/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DUI-C-10 | `dashboard-ui-composed-confirm-dialog--delete-role` | Delete role confirmation | [dark](comparison/confirm-delete-role/dark-side-by-side.webp), [light](comparison/confirm-delete-role/light-side-by-side.webp) | [dark](comparison/confirm-delete-role/dark-styles.json), [light](comparison/confirm-delete-role/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DUI-P-45 | `dashboard-ui-primitives-toast--success` | "Invitation resent" | [dark](comparison/toast-invitation-resent/dark-side-by-side.webp), [light](comparison/toast-invitation-resent/light-side-by-side.webp) | [dark](comparison/toast-invitation-resent/dark-styles.json), [light](comparison/toast-invitation-resent/light-styles.json) | None |
| CMP-DUI-P-46 | `dashboard-ui-primitives-tooltip--list` | Roles page, "+4 more" | [dark](comparison/tooltip-more-permissions/dark-side-by-side.webp), [light](comparison/tooltip-more-permissions/light-side-by-side.webp) | [dark](comparison/tooltip-more-permissions/dark-styles.json), [light](comparison/tooltip-more-permissions/light-styles.json) | None |
| CMP-DUI-C-44 | `dashboard-ui-composed-route-error-boundary--not-found` | A page that does not exist | [dark](comparison/route-error-not-found/dark-side-by-side.webp), [light](comparison/route-error-not-found/light-side-by-side.webp) | [dark](comparison/route-error-not-found/dark-styles.json), [light](comparison/route-error-not-found/light-styles.json) | height |
| CMP-DUI-P-02 | `dashboard-ui-primitives-alert--destructive` | Sign in, providers request answered with a server error | [dark](comparison/alert-sign-in-providers-failed/dark-side-by-side.webp), [light](comparison/alert-sign-in-providers-failed/light-side-by-side.webp) | [dark](comparison/alert-sign-in-providers-failed/dark-styles.json), [light](comparison/alert-sign-in-providers-failed/light-styles.json) | height |
| CMP-DA-G-24 | `admin-dashboard-sign-in-auth-shell--with-a-form` | Forgot password | [dark](comparison/auth-shell-forgot-password/dark-side-by-side.webp), [light](comparison/auth-shell-forgot-password/light-side-by-side.webp) | [dark](comparison/auth-shell-forgot-password/dark-styles.json), [light](comparison/auth-shell-forgot-password/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-sign-in-auth-shell--with-a-message` | Accept invitation, invalid link | [dark](comparison/auth-shell-invitation-not-found/dark-side-by-side.webp), [light](comparison/auth-shell-invitation-not-found/light-side-by-side.webp) | [dark](comparison/auth-shell-invitation-not-found/dark-styles.json), [light](comparison/auth-shell-invitation-not-found/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-sign-in-no-store-access--default` | A teammate removed from the store | [dark](comparison/no-store-access/dark-side-by-side.webp), [light](comparison/no-store-access/light-side-by-side.webp) | [dark](comparison/no-store-access/dark-styles.json), [light](comparison/no-store-access/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-roles-permission-picker--nothing-granted` | New role sheet, the grid | [dark](comparison/permission-grid-new-role/dark-side-by-side.webp), [light](comparison/permission-grid-new-role/light-side-by-side.webp) | [dark](comparison/permission-grid-new-role/dark-styles.json), [light](comparison/permission-grid-new-role/light-styles.json) | None |
| CMP-DA-G-24 | `admin-dashboard-roles-role-sheet--new-role` | New role sheet | [dark](comparison/role-sheet-new-role/dark-side-by-side.webp), [light](comparison/role-sheet-new-role/light-side-by-side.webp) | [dark](comparison/role-sheet-new-role/dark-styles.json), [light](comparison/role-sheet-new-role/light-styles.json) | border-bottom-color, border-top-color, box-shadow |
| CMP-DA-G-24 | `admin-dashboard-roles-role-sheet--protected-role` | The admin role, read-only | [dark](comparison/role-sheet-admin-role/dark-side-by-side.webp), [light](comparison/role-sheet-admin-role/light-side-by-side.webp) | [dark](comparison/role-sheet-admin-role/dark-styles.json), [light](comparison/role-sheet-admin-role/light-styles.json) | None |

## Screens, by state and variant

Variants are named as in the record §3.1: `admin`, `staffManager` (`write_staff`), `staffViewer` (`read_staff`), `storeSettings` (`write_settings`), `support`, `orderManager` and `merchandiser` (the role sheet's three templates), and `public` for the signed-out screens. The record §2.1 says how each held or answered state was reached. DA-OVL-01 is captured here only for the navigation each variant sees; its overlay states are part 2's.

| Screen | State | Captures |
|---|---|---|
| DA-AUTH-01 | default | [public](screens/DA-AUTH-01/default/public-light.webp) ([dark](screens/DA-AUTH-01/default/public-dark.webp)) |
| DA-AUTH-01 | field-errors | [public](screens/DA-AUTH-01/field-errors/public-light.webp) ([dark](screens/DA-AUTH-01/field-errors/public-dark.webp)) |
| DA-AUTH-01 | fresh-installation | [public](screens/DA-AUTH-01/fresh-installation/public-light.webp) ([dark](screens/DA-AUTH-01/fresh-installation/public-dark.webp)) |
| DA-AUTH-01 | provider-error-on-return | [public](screens/DA-AUTH-01/provider-error-on-return/public-light.webp) ([dark](screens/DA-AUTH-01/provider-error-on-return/public-dark.webp)) |
| DA-AUTH-01 | providers-failed | [public](screens/DA-AUTH-01/providers-failed/public-light.webp) ([dark](screens/DA-AUTH-01/providers-failed/public-dark.webp)) |
| DA-AUTH-01 | providers-loading | [public](screens/DA-AUTH-01/providers-loading/public-light.webp) ([dark](screens/DA-AUTH-01/providers-loading/public-dark.webp)) |
| DA-AUTH-01 | with-identity-provider | [public](screens/DA-AUTH-01/with-identity-provider/public-light.webp) ([dark](screens/DA-AUTH-01/with-identity-provider/public-dark.webp)) |
| DA-AUTH-01 | wrong-credentials | [public](screens/DA-AUTH-01/wrong-credentials/public-light.webp) ([dark](screens/DA-AUTH-01/wrong-credentials/public-dark.webp)) |
| DA-AUTH-02 | default | [public](screens/DA-AUTH-02/default/public-light.webp) ([dark](screens/DA-AUTH-02/default/public-dark.webp)) |
| DA-AUTH-02 | field-errors | [public](screens/DA-AUTH-02/field-errors/public-light.webp) ([dark](screens/DA-AUTH-02/field-errors/public-dark.webp)) |
| DA-AUTH-02 | sending | [public](screens/DA-AUTH-02/sending/public-light.webp) ([dark](screens/DA-AUTH-02/sending/public-dark.webp)) |
| DA-AUTH-02 | sent | [public](screens/DA-AUTH-02/sent/public-light.webp) ([dark](screens/DA-AUTH-02/sent/public-dark.webp)) |
| DA-AUTH-03 | default | [public](screens/DA-AUTH-03/default/public-light.webp) ([dark](screens/DA-AUTH-03/default/public-dark.webp)) |
| DA-AUTH-03 | field-errors | [public](screens/DA-AUTH-03/field-errors/public-light.webp) ([dark](screens/DA-AUTH-03/field-errors/public-dark.webp)) |
| DA-AUTH-03 | invalid-link | [public](screens/DA-AUTH-03/invalid-link/public-light.webp) ([dark](screens/DA-AUTH-03/invalid-link/public-dark.webp)) |
| DA-AUTH-03 | missing-link | [public](screens/DA-AUTH-03/missing-link/public-light.webp) ([dark](screens/DA-AUTH-03/missing-link/public-dark.webp)) |
| DA-AUTH-04 | existing-account | [public](screens/DA-AUTH-04/existing-account/public-light.webp) ([dark](screens/DA-AUTH-04/existing-account/public-dark.webp)) |
| DA-AUTH-04 | field-errors | [public](screens/DA-AUTH-04/field-errors/public-light.webp) ([dark](screens/DA-AUTH-04/field-errors/public-dark.webp)) |
| DA-AUTH-04 | invalid-link | [public](screens/DA-AUTH-04/invalid-link/public-light.webp) ([dark](screens/DA-AUTH-04/invalid-link/public-dark.webp)) |
| DA-AUTH-04 | loading | [public](screens/DA-AUTH-04/loading/public-light.webp) ([dark](screens/DA-AUTH-04/loading/public-dark.webp)) |
| DA-AUTH-04 | missing-link | [public](screens/DA-AUTH-04/missing-link/public-light.webp) ([dark](screens/DA-AUTH-04/missing-link/public-dark.webp)) |
| DA-AUTH-04 | new-account | [public](screens/DA-AUTH-04/new-account/public-light.webp) ([dark](screens/DA-AUTH-04/new-account/public-dark.webp)) |
| DA-OVL-01 | main-navigation | [admin](screens/DA-OVL-01/main-navigation/admin-light.webp) ([dark](screens/DA-OVL-01/main-navigation/admin-dark.webp)), [merchandiser](screens/DA-OVL-01/main-navigation/merchandiser-light.webp) ([dark](screens/DA-OVL-01/main-navigation/merchandiser-dark.webp)), [orderManager](screens/DA-OVL-01/main-navigation/orderManager-light.webp) ([dark](screens/DA-OVL-01/main-navigation/orderManager-dark.webp)), [staffManager](screens/DA-OVL-01/main-navigation/staffManager-light.webp) ([dark](screens/DA-OVL-01/main-navigation/staffManager-dark.webp)), [staffViewer](screens/DA-OVL-01/main-navigation/staffViewer-light.webp) ([dark](screens/DA-OVL-01/main-navigation/staffViewer-dark.webp)), [storeSettings](screens/DA-OVL-01/main-navigation/storeSettings-light.webp) ([dark](screens/DA-OVL-01/main-navigation/storeSettings-dark.webp)), [support](screens/DA-OVL-01/main-navigation/support-light.webp) ([dark](screens/DA-OVL-01/main-navigation/support-dark.webp)) |
| DA-OVL-01 | settings-navigation | [admin](screens/DA-OVL-01/settings-navigation/admin-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/admin-dark.webp)), [merchandiser](screens/DA-OVL-01/settings-navigation/merchandiser-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/merchandiser-dark.webp)), [orderManager](screens/DA-OVL-01/settings-navigation/orderManager-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/orderManager-dark.webp)), [staffManager](screens/DA-OVL-01/settings-navigation/staffManager-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/staffManager-dark.webp)), [staffViewer](screens/DA-OVL-01/settings-navigation/staffViewer-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/staffViewer-dark.webp)), [storeSettings](screens/DA-OVL-01/settings-navigation/storeSettings-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/storeSettings-dark.webp)), [support](screens/DA-OVL-01/settings-navigation/support-light.webp) ([dark](screens/DA-OVL-01/settings-navigation/support-dark.webp)) |
| DA-SET-24 | direct-visit-without-permission | [storeSettings](screens/DA-SET-24/direct-visit-without-permission/storeSettings-light.webp) ([dark](screens/DA-SET-24/direct-visit-without-permission/storeSettings-dark.webp)), [support](screens/DA-SET-24/direct-visit-without-permission/support-light.webp) ([dark](screens/DA-SET-24/direct-visit-without-permission/support-dark.webp)) |
| DA-SET-24 | edit-teammate-sheet | [admin](screens/DA-SET-24/edit-teammate-sheet/admin-light.webp) ([dark](screens/DA-SET-24/edit-teammate-sheet/admin-dark.webp)) |
| DA-SET-24 | invitation-actions-open | [admin](screens/DA-SET-24/invitation-actions-open/admin-light.webp) ([dark](screens/DA-SET-24/invitation-actions-open/admin-dark.webp)) |
| DA-SET-24 | invitation-resent | [admin](screens/DA-SET-24/invitation-resent/admin-light.webp) ([dark](screens/DA-SET-24/invitation-resent/admin-dark.webp)) |
| DA-SET-24 | invite-dialog | [admin](screens/DA-SET-24/invite-dialog/admin-light.webp) ([dark](screens/DA-SET-24/invite-dialog/admin-dark.webp)) |
| DA-SET-24 | invite-role-list-open | [admin](screens/DA-SET-24/invite-role-list-open/admin-light.webp) ([dark](screens/DA-SET-24/invite-role-list-open/admin-dark.webp)) |
| DA-SET-24 | loading | [admin](screens/DA-SET-24/loading/admin-light.webp) ([dark](screens/DA-SET-24/loading/admin-dark.webp)) |
| DA-SET-24 | populated-with-pending-invitations | [admin](screens/DA-SET-24/populated-with-pending-invitations/admin-light.webp) ([dark](screens/DA-SET-24/populated-with-pending-invitations/admin-dark.webp)), [staffManager](screens/DA-SET-24/populated-with-pending-invitations/staffManager-light.webp) ([dark](screens/DA-SET-24/populated-with-pending-invitations/staffManager-dark.webp)), [staffViewer](screens/DA-SET-24/populated-with-pending-invitations/staffViewer-light.webp) ([dark](screens/DA-SET-24/populated-with-pending-invitations/staffViewer-dark.webp)) |
| DA-SET-24 | remove-confirmation | [admin](screens/DA-SET-24/remove-confirmation/admin-light.webp) ([dark](screens/DA-SET-24/remove-confirmation/admin-dark.webp)) |
| DA-SET-24 | revoke-confirmation | [admin](screens/DA-SET-24/revoke-confirmation/admin-light.webp) ([dark](screens/DA-SET-24/revoke-confirmation/admin-dark.webp)) |
| DA-SET-24 | role-required | [admin](screens/DA-SET-24/role-required/admin-light.webp) ([dark](screens/DA-SET-24/role-required/admin-dark.webp)) |
| DA-SET-24 | teammate-actions-open | [admin](screens/DA-SET-24/teammate-actions-open/admin-light.webp) ([dark](screens/DA-SET-24/teammate-actions-open/admin-dark.webp)) |
| DA-SET-25 | admin-role-read-only | [admin](screens/DA-SET-25/admin-role-read-only/admin-light.webp) ([dark](screens/DA-SET-25/admin-role-read-only/admin-dark.webp)) |
| DA-SET-25 | create-sheet | [admin](screens/DA-SET-25/create-sheet/admin-light.webp) ([dark](screens/DA-SET-25/create-sheet/admin-dark.webp)) |
| DA-SET-25 | delete-confirmation | [admin](screens/DA-SET-25/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-25/delete-confirmation/admin-dark.webp)) |
| DA-SET-25 | direct-visit-without-permission | [storeSettings](screens/DA-SET-25/direct-visit-without-permission/storeSettings-light.webp) ([dark](screens/DA-SET-25/direct-visit-without-permission/storeSettings-dark.webp)), [support](screens/DA-SET-25/direct-visit-without-permission/support-light.webp) ([dark](screens/DA-SET-25/direct-visit-without-permission/support-dark.webp)) |
| DA-SET-25 | edit-sheet | [admin](screens/DA-SET-25/edit-sheet/admin-light.webp) ([dark](screens/DA-SET-25/edit-sheet/admin-dark.webp)), [staffViewer](screens/DA-SET-25/edit-sheet/staffViewer-light.webp) ([dark](screens/DA-SET-25/edit-sheet/staffViewer-dark.webp)) |
| DA-SET-25 | from-template | [admin](screens/DA-SET-25/from-template/admin-light.webp) ([dark](screens/DA-SET-25/from-template/admin-dark.webp)) |
| DA-SET-25 | loading | [admin](screens/DA-SET-25/loading/admin-light.webp) ([dark](screens/DA-SET-25/loading/admin-dark.webp)) |
| DA-SET-25 | name-required | [admin](screens/DA-SET-25/name-required/admin-light.webp) ([dark](screens/DA-SET-25/name-required/admin-dark.webp)) |
| DA-SET-25 | permissions-overflow-tooltip | [admin](screens/DA-SET-25/permissions-overflow-tooltip/admin-light.webp) ([dark](screens/DA-SET-25/permissions-overflow-tooltip/admin-dark.webp)) |
| DA-SET-25 | populated | [admin](screens/DA-SET-25/populated/admin-light.webp) ([dark](screens/DA-SET-25/populated/admin-dark.webp)), [staffManager](screens/DA-SET-25/populated/staffManager-light.webp) ([dark](screens/DA-SET-25/populated/staffManager-dark.webp)), [staffViewer](screens/DA-SET-25/populated/staffViewer-light.webp) ([dark](screens/DA-SET-25/populated/staffViewer-dark.webp)) |
| DA-SET-25 | role-in-use-cannot-be-deleted | [admin](screens/DA-SET-25/role-in-use-cannot-be-deleted/admin-light.webp) ([dark](screens/DA-SET-25/role-in-use-cannot-be-deleted/admin-dark.webp)) |
| DA-SHELL-01 | no-store-access | [removed](screens/DA-SHELL-01/no-store-access/removed-light.webp) ([dark](screens/DA-SHELL-01/no-store-access/removed-dark.webp)) |
| DA-SHELL-01 | opens-first-store | [admin](screens/DA-SHELL-01/opens-first-store/admin-light.webp) ([dark](screens/DA-SHELL-01/opens-first-store/admin-dark.webp)) |
| DA-SHELL-02 | not-found | [admin](screens/DA-SHELL-02/not-found/admin-light.webp) ([dark](screens/DA-SHELL-02/not-found/admin-dark.webp)) |

## Emails

The templates have no dark styles, so each email has one capture per data condition.

| Email | As the browser-test data has it | With the staff member named |
|---|---|---|
| EM-S-01 Staff password reset | [EM-S-01.webp](emails/EM-S-01.webp) | [EM-S-01-named.webp](emails/EM-S-01-named.webp) |
| EM-S-03 Invitation | [EM-S-03.webp](emails/EM-S-03.webp) | [EM-S-03-named.webp](emails/EM-S-03-named.webp) |
| EM-S-04 Invitation accepted | [EM-S-04.webp](emails/EM-S-04.webp) | [EM-S-04-named.webp](emails/EM-S-04-named.webp) |

Subjects and templates: [emails.json](emails/emails.json).

## Backend

| File | What it holds |
|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's API engine specs for staff, invitations, roles, permissions, the signed-in staff member and password reset: 92 examples in 8 files, no failures |
| [core-specs.json](backend/core-specs.json) | Spree's core engine specs for abilities, roles, role assignments, invitations, staff accounts and account lockout: 91 examples in 7 files, no failures |
| [refusals.json](backend/refusals.json) | 33 requests sent to the running server as teammates whose roles do not allow them, and the status of each: 23 answered 403, 10 answered 404, none allowed. An observation, not a spec |
