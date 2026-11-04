# FB-19 batch 15, multi-store administration: evidence

The captures, the step list, SD-18's server answers, the side-by-side pictures and the backend results behind the [verification record](../../2026-11-04-fb-19-batch-multi-store-administration.md). They come from `packages/liquorify-storybook/fidelity/multi-store.spec.ts`, with the helpers in `staff.ts`, and from Spree's own specs. A successful run of the script shows that each state could be reached and captured, and that what it asserts was on the screen. What it only records, it does not judge.

**Revisions.**

| What | Revision |
|---|---|
| Script | `1320592d`, on pull request [#49](https://github.com/pateldhruval872/liquorify/pull/49)'s branch. Every capture's note names it |
| Running screens and Spree's specs | Spree's code at `68236c5`, which the pull request does not change: the built admin dashboard against the dashboard browser tests' own Rails server, database and fixtures |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels, 768 by 960 for the narrow switcher, and 390 by 844 for the two phone states. Each state is captured in light and then dark, from the system's setting; none stores a choice of theme |

**Image format.** Every image here is lossless WebP, converted from the PNG the script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs.

**Data.** The screens show the browser tests' two stores and admin, plus the Support role and the teammate the script adds through the Admin API (record §1). The teammate uses an `example.com` address. In the notes, the first store is written as `<store>`, the second as `<second-store>`, and the invitation as `<invitation>`. **No invitation link, token or password is recorded.** The script reads each invitation link through the Admin API and keeps it in memory, and the password is imported from `staff.ts`, never written out.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp`, and `<variant>-<theme>.json`. The note gives the screen, the state, the variant and its role in each store, the theme, the revision, the path and the window's size. It also gives whether a request was answered in the browser (`intercepted`, null in all 42), whether the page settled, and what the script checked. Where a step records them, it gives the navigation's links (`navigation`) and the page's own Admin API requests with their answers (`answered`). Every request blocked because it would have left the local servers is listed (`outside`, empty in all 42) |
| `multi-store/` | `steps.json`: every step in order, with the teammate's roles and what each step checked. `sd-18-server-answers.json`: every Admin API request the page made while SD-18's navigation showed in the second store, with its status and error code, and what the store held afterwards (record §5.1). The four side-by-side pictures of the store switcher's stories and the running switcher (record §4) |
| `backend/` | `api-specs.json` and `core-specs.json`: every example of Spree's specs for the current admin, invitations, their acceptance, staff and role assignment, with its file, line, description and result (record §3.2) |

## Captures

Variants: "teammate" holds the admin role in the first store and the Support role in the second. "teammateAfterLeaving" holds the admin role in the first store only. "admin" is the browser tests' admin, in both stores. "public" is signed out.

| Screen | State | Variant | Light | Dark | Note |
|---|---|---|---|---|---|
| DA-AUTH-04 | existing-account-second-store | public | [light](screens/DA-AUTH-04/existing-account-second-store/public-light.webp) | [dark](screens/DA-AUTH-04/existing-account-second-store/public-dark.webp) | [json](screens/DA-AUTH-04/existing-account-second-store/public-light.json) |
| DA-AUTH-04 | accepted-second-store | teammate | [light](screens/DA-AUTH-04/accepted-second-store/teammate-light.webp) | [dark](screens/DA-AUTH-04/accepted-second-store/teammate-dark.webp) | [json](screens/DA-AUTH-04/accepted-second-store/teammate-light.json) |
| DA-SHELL-01 | opens-first-of-two-stores | teammate | [light](screens/DA-SHELL-01/opens-first-of-two-stores/teammate-light.webp) | [dark](screens/DA-SHELL-01/opens-first-of-two-stores/teammate-dark.webp) | [json](screens/DA-SHELL-01/opens-first-of-two-stores/teammate-light.json) |
| DA-OVL-01 | switcher-two-stores-open | teammate | [light](screens/DA-OVL-01/switcher-two-stores-open/teammate-light.webp) | [dark](screens/DA-OVL-01/switcher-two-stores-open/teammate-dark.webp) | [json](screens/DA-OVL-01/switcher-two-stores-open/teammate-light.json) |
| DA-OVL-01 | second-store-after-switching | teammate | [light](screens/DA-OVL-01/second-store-after-switching/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-after-switching/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-after-switching/teammate-light.json) |
| DA-OVL-01 | second-store-products-link-after-switching | teammate | [light](screens/DA-OVL-01/second-store-products-link-after-switching/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-products-link-after-switching/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-products-link-after-switching/teammate-light.json) |
| DA-OVL-01 | second-store-create-product-after-switching | teammate | [light](screens/DA-OVL-01/second-store-create-product-after-switching/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-create-product-after-switching/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-create-product-after-switching/teammate-light.json) |
| DA-OVL-01 | second-store-import-after-switching | teammate | [light](screens/DA-OVL-01/second-store-import-after-switching/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-import-after-switching/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-import-after-switching/teammate-light.json) |
| DA-OVL-01 | second-store-support-navigation | teammate | [light](screens/DA-OVL-01/second-store-support-navigation/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-support-navigation/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-support-navigation/teammate-light.json) |
| DA-OVL-01 | second-store-support-settings-navigation | teammate | [light](screens/DA-OVL-01/second-store-support-settings-navigation/teammate-light.webp) | [dark](screens/DA-OVL-01/second-store-support-settings-navigation/teammate-dark.webp) | [json](screens/DA-OVL-01/second-store-support-settings-navigation/teammate-light.json) |
| DA-OVL-01 | first-store-after-switching-back | teammate | [light](screens/DA-OVL-01/first-store-after-switching-back/teammate-light.webp) | [dark](screens/DA-OVL-01/first-store-after-switching-back/teammate-dark.webp) | [json](screens/DA-OVL-01/first-store-after-switching-back/teammate-light.json) |
| DA-OVL-01 | first-store-admin-navigation | teammate | [light](screens/DA-OVL-01/first-store-admin-navigation/teammate-light.webp) | [dark](screens/DA-OVL-01/first-store-admin-navigation/teammate-dark.webp) | [json](screens/DA-OVL-01/first-store-admin-navigation/teammate-light.json) |
| DA-OVL-01 | switcher-two-stores-open-narrow | teammate | [light](screens/DA-OVL-01/switcher-two-stores-open-narrow/teammate-light.webp) | [dark](screens/DA-OVL-01/switcher-two-stores-open-narrow/teammate-dark.webp) | [json](screens/DA-OVL-01/switcher-two-stores-open-narrow/teammate-light.json) |
| DA-OVL-01 | phone-two-stores | teammate | [light](screens/DA-OVL-01/phone-two-stores/teammate-light.webp) | [dark](screens/DA-OVL-01/phone-two-stores/teammate-dark.webp) | [json](screens/DA-OVL-01/phone-two-stores/teammate-light.json) |
| DA-OVL-01 | phone-two-stores-drawer-open | teammate | [light](screens/DA-OVL-01/phone-two-stores-drawer-open/teammate-light.webp) | [dark](screens/DA-OVL-01/phone-two-stores-drawer-open/teammate-dark.webp) | [json](screens/DA-OVL-01/phone-two-stores-drawer-open/teammate-light.json) |
| DA-OVL-01 | switcher-gone-one-store | teammateAfterLeaving | [light](screens/DA-OVL-01/switcher-gone-one-store/teammateAfterLeaving-light.webp) | [dark](screens/DA-OVL-01/switcher-gone-one-store/teammateAfterLeaving-dark.webp) | [json](screens/DA-OVL-01/switcher-gone-one-store/teammateAfterLeaving-light.json) |
| DA-SET-24 | teammate-in-two-stores-first-store | admin | [light](screens/DA-SET-24/teammate-in-two-stores-first-store/admin-light.webp) | [dark](screens/DA-SET-24/teammate-in-two-stores-first-store/admin-dark.webp) | [json](screens/DA-SET-24/teammate-in-two-stores-first-store/admin-light.json) |
| DA-SET-24 | teammate-in-two-stores-second-store | admin | [light](screens/DA-SET-24/teammate-in-two-stores-second-store/admin-light.webp) | [dark](screens/DA-SET-24/teammate-in-two-stores-second-store/admin-dark.webp) | [json](screens/DA-SET-24/teammate-in-two-stores-second-store/admin-light.json) |
| DA-SET-24 | remove-from-second-store-confirmation | admin | [light](screens/DA-SET-24/remove-from-second-store-confirmation/admin-light.webp) | [dark](screens/DA-SET-24/remove-from-second-store-confirmation/admin-dark.webp) | [json](screens/DA-SET-24/remove-from-second-store-confirmation/admin-light.json) |
| DA-SET-24 | removed-from-second-store | admin | [light](screens/DA-SET-24/removed-from-second-store/admin-light.webp) | [dark](screens/DA-SET-24/removed-from-second-store/admin-dark.webp) | [json](screens/DA-SET-24/removed-from-second-store/admin-light.json) |
| DA-SET-24 | still-in-first-store-after-removal | admin | [light](screens/DA-SET-24/still-in-first-store-after-removal/admin-light.webp) | [dark](screens/DA-SET-24/still-in-first-store-after-removal/admin-dark.webp) | [json](screens/DA-SET-24/still-in-first-store-after-removal/admin-light.json) |

Each state's dark note is beside its light one, with `-dark.json` in place of `-light.json`.

## Side by side with the stories

The running switcher is on the left, and the story's committed reference image on the right.

| Story | Running screen | Light | Dark |
|---|---|---|---|
| Store switcher: Open | DA-OVL-01 switcher-two-stores-open | [light](multi-store/switcher-open-light-side-by-side.webp) | [dark](multi-store/switcher-open-dark-side-by-side.webp) |
| Store switcher: One store | DA-OVL-01 switcher-gone-one-store | [light](multi-store/switcher-gone-light-side-by-side.webp) | [dark](multi-store/switcher-gone-dark-side-by-side.webp) |
