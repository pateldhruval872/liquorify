# FB-19 catalog and pricing batch, part 2: evidence

The captures, comparisons, FL-21's check, the rendered emails and the backend results behind the [verification record](../../2026-11-04-fb-19-batch-catalog-and-pricing-part-2.md). They come from the scripts in `packages/liquorify-storybook/fidelity/` (`screens.spec.ts`, `compare.spec.ts` and `fl-21.spec.ts`, with the data `merchandising.ts`, `catalog.ts` and `staff.ts` add) and from Spree's own specs and mailer previews. A successful run of the scripts only shows that each state could be reached and captured. Whether each story matches its screen is a judgement made from these files.

**Revisions.**

| What | Revision |
|---|---|
| Stories and scripts | Pull request [#42](https://github.com/pateldhruval872/liquorify/pull/42). The captures ran from `36173fb5`; the collection on a phone from `5c2e38fd`; the 32 direct visits again from `a5352d72`, which waits for the dashboard's retry (record §8). The comparison and FL-21 ran from `5c2e38fd`, and the bulk price editor dialog's case again from `5faa8f5d`, after the price list editor's stories were corrected (record §4.2). The emails were rendered at `a5352d72` |
| Running screens and Spree's specs | Spree's code as `main` has it at `5794da6`, whose last change to Spree's code is `587a4767`; the pull request does not change it. The built admin dashboard against the dashboard browser tests' own Rails server and fixtures, with Spree's sample catalog loaded into its database |
| Browser | The pinned Playwright 1.64.1 image. Captures at 1280 by 960 pixels, and 390 by 844 for the three phone states; comparisons at 1280 by 800, and 1280 by 2400 for the cases taller than the window; emails at 1280 pixels wide, full height. Captures follow the system's light or dark setting; none stores a choice of theme. The emails have no dark styles, so they are light only |

**Image format.** Every image here is lossless WebP, converted from the PNG each script wrote. Every converted image was checked pixel for pixel against its PNG, and none differs. The reference images the visual check compares against stay PNG, in `packages/liquorify-storybook/visual/__screenshots__/`.

**Data.** The screens show the browser tests' data and Spree's sample catalog, loaded with Spree's sample data task, plus the categories, collections, catalogs, price lists, imports, roles and teammates the scripts add through the Admin API (record §1). Teammates use `example.com` addresses. Each capture's store is written as `<store>` in its notes, and the dashboard's address as `<a local address>`. **No key, token or password is recorded,** and no capture shows a key. The comparison's key mask hides any code drawn in a card on both sides; no part 2 case draws one.

## Folders

| Folder | Holds |
|---|---|
| `screens/<screen ID>/<state>/` | `<variant>-light.webp` and `<variant>-dark.webp` for each variant, and `<variant>-<theme>.json`: the screen, the state, the variant's role and its permissions, the theme, the revision, the path, the window's size, how a request was answered or held to reach the state (`intercepted`), what was painted out (`masked`, nothing in all 398), whether the page settled, any message the browser's own confirm box showed (`dialogs`), and every request blocked because it would have left the local servers (`outside`, empty in all 398) |
| `comparison/<case>/` | `<theme>-side-by-side.webp`: the running screen on the left and the story on the right; `<theme>-styles.json`: the computed styles of every distinct element on both sides, the elements compared, those found on one side only, and every style that differs |
| `fl-21/` | Six captures of FL-21 in order, the file imported, the file exported, and what the check compared (record §2.3) |
| `emails/` | EM-S-05 and EM-S-06 rendered from Spree's mailer previews and as sent during FL-21, and `emails.json`: each preview's subject, template and parts |
| `backend/` | `api-specs.json` and `core-specs.json`: every example of Spree's specs for part 2's endpoints and models, with its file, line, description and result |

## Comparison with running screens, light and dark

"ID" is the LIQ-009 inventory ID. "Styles that differ" lists the computed properties that differ on an element found on both sides, the elements found on one side only, and a width that differs; the same properties differ in both themes in every case, and the verification record §4 explains each one. The stories show invented data, so text and counts differ on purpose.

| ID | Story | Running screen | Images | Styles | Styles that differ |
|---|---|---|---|---|---|
| CMP-DA-G-03 | Category tree: Collapsed | The categories page, its tree collapsed | [light](comparison/category-tree/light-side-by-side.webp) · [dark](comparison/category-tree/dark-side-by-side.webp) | [light](comparison/category-tree/light-styles.json) · [dark](comparison/category-tree/dark-styles.json) | height; 963 and 965 pixels wide |
| CMP-DA-G-03 | Category list: Matches | The categories page searched for "Air" | [light](comparison/category-list-matches/light-side-by-side.webp) · [dark](comparison/category-list-matches/dark-side-by-side.webp) | [light](comparison/category-list-matches/light-styles.json) · [dark](comparison/category-list-matches/dark-styles.json) | height; 963 and 965 pixels wide |
| CMP-DA-G-03 | Category form: Main | Fidelity coffee corner's general card | [light](comparison/category-form-main/light-side-by-side.webp) · [dark](comparison/category-form-main/dark-side-by-side.webp) | [light](comparison/category-form-main/light-styles.json) · [dark](comparison/category-form-main/dark-styles.json) | None |
| CMP-DA-G-03 | Category form: Sidebar, with a parent | Fidelity coffee corner's navigation card, whose parent is Kitchen | [light](comparison/category-form-navigation/light-side-by-side.webp) · [dark](comparison/category-form-navigation/dark-side-by-side.webp) | [light](comparison/category-form-navigation/light-styles.json) · [dark](comparison/category-form-navigation/dark-styles.json) | None |
| CMP-DA-G-03 | Category products card: Members | Fidelity coffee corner's products card | [light](comparison/category-products-card/light-side-by-side.webp) · [dark](comparison/category-products-card/dark-side-by-side.webp) | [light](comparison/category-products-card/light-styles.json) · [dark](comparison/category-products-card/dark-styles.json) | 2 in the story only |
| CMP-DUI-C-35 | Product membership list: Members | The table in Fidelity coffee corner's products card | [light](comparison/product-membership-list/light-side-by-side.webp) · [dark](comparison/product-membership-list/dark-side-by-side.webp) | [light](comparison/product-membership-list/light-styles.json) · [dark](comparison/product-membership-list/dark-styles.json) | height; 1 on the screen only; 1 in the story only |
| CMP-DUI-C-39 | Resource combobox: Selected | The parent category field in Fidelity coffee corner's navigation card | [light](comparison/resource-combobox-selected/light-side-by-side.webp) · [dark](comparison/resource-combobox-selected/dark-side-by-side.webp) | [light](comparison/resource-combobox-selected/light-styles.json) · [dark](comparison/resource-combobox-selected/dark-styles.json) | 250 and 580 pixels wide |
| CMP-CORE-25 | Resource picker sheet: Results | The add products sheet, opened from Fidelity coffee corner's products card | [light](comparison/resource-picker-sheet/light-side-by-side.webp) · [dark](comparison/resource-picker-sheet/dark-side-by-side.webp) | [light](comparison/resource-picker-sheet/light-styles.json) · [dark](comparison/resource-picker-sheet/dark-styles.json) | height, opacity; 2 on the screen only; 1 in the story only |
| CMP-DA-G-04 | Collection form: Curated | Best Sellers' general card | [light](comparison/collection-form-main/light-side-by-side.webp) · [dark](comparison/collection-form-main/dark-side-by-side.webp) | [light](comparison/collection-form-main/light-styles.json) · [dark](comparison/collection-form-main/dark-styles.json) | 2 on the screen only; 1 in the story only |
| CMP-DA-G-04 | Collection rules card: Rules | Fidelity gift ideas' membership card, with its rules | [light](comparison/collection-rules-card/light-side-by-side.webp) · [dark](comparison/collection-rules-card/dark-side-by-side.webp) | [light](comparison/collection-rules-card/light-styles.json) · [dark](comparison/collection-rules-card/dark-styles.json) | None |
| CMP-DA-G-04 | Collection products card: Curated | Best Sellers' products card | [light](comparison/collection-products-card/light-side-by-side.webp) · [dark](comparison/collection-products-card/dark-side-by-side.webp) | [light](comparison/collection-products-card/light-styles.json) · [dark](comparison/collection-products-card/dark-styles.json) | height; 2 on the screen only; 1 in the story only |
| CMP-DA-G-24 | Deferred product membership card: Chosen by rules | Fidelity gift ideas' products card, chosen by its rules | [light](comparison/deferred-product-membership-card-rules/light-side-by-side.webp) · [dark](comparison/deferred-product-membership-card-rules/dark-side-by-side.webp) | [light](comparison/deferred-product-membership-card-rules/light-styles.json) · [dark](comparison/deferred-product-membership-card-rules/dark-styles.json) | height |
| CMP-CORE-28 | Section heading: With description | The translations page's title and description | [light](comparison/section-heading/light-side-by-side.webp) · [dark](comparison/section-heading/dark-side-by-side.webp) | [light](comparison/section-heading/light-styles.json) · [dark](comparison/section-heading/dark-styles.json) | 358 and 965 pixels wide |
| CMP-DA-G-24 | Catalog audience card: Assigned | Fidelity café trade's audiences card | [light](comparison/catalog-audience-card/light-side-by-side.webp) · [dark](comparison/catalog-audience-card/dark-side-by-side.webp) | [light](comparison/catalog-audience-card/light-styles.json) · [dark](comparison/catalog-audience-card/dark-styles.json) | None |
| CMP-DA-G-24 | Catalog terms card: Terms | Fidelity café trade's terms card | [light](comparison/catalog-terms-card/light-side-by-side.webp) · [dark](comparison/catalog-terms-card/dark-side-by-side.webp) | [light](comparison/catalog-terms-card/light-styles.json) · [dark](comparison/catalog-terms-card/dark-styles.json) | None |
| CMP-DA-G-24 | Catalog pricing fields: A percentage off | Fidelity café trade's pricing card, a percentage off | [light](comparison/catalog-pricing-fields-percentage/light-side-by-side.webp) · [dark](comparison/catalog-pricing-fields-percentage/dark-side-by-side.webp) | [light](comparison/catalog-pricing-fields-percentage/light-styles.json) · [dark](comparison/catalog-pricing-fields-percentage/dark-styles.json) | None |
| CMP-DUI-C-37 | Quantity tier editor: Bands | The quantity tiers in Fidelity café trade's pricing card | [light](comparison/quantity-tier-editor/light-side-by-side.webp) · [dark](comparison/quantity-tier-editor/dark-side-by-side.webp) | [light](comparison/quantity-tier-editor/light-styles.json) · [dark](comparison/quantity-tier-editor/dark-styles.json) | height; 280 and 609 pixels wide |
| CMP-DA-G-24 | Catalog price columns: A percentage off | Fidelity café trade's products card, with its price columns | [light](comparison/catalog-price-columns-adjusted/light-side-by-side.webp) · [dark](comparison/catalog-price-columns-adjusted/dark-side-by-side.webp) | [light](comparison/catalog-price-columns-adjusted/light-styles.json) · [dark](comparison/catalog-price-columns-adjusted/dark-styles.json) | height; 1 on the screen only |
| CMP-DA-G-24 | Catalog wizard dialog: Details | The new catalog wizard's details step, opened from the catalog list | [light](comparison/catalog-wizard-dialog-details/light-side-by-side.webp) · [dark](comparison/catalog-wizard-dialog-details/dark-side-by-side.webp) | [light](comparison/catalog-wizard-dialog-details/light-styles.json) · [dark](comparison/catalog-wizard-dialog-details/dark-styles.json) | None |
| CMP-DA-G-13 | Price list form: A price list | The Wholesale price list's basics card | [light](comparison/price-list-form-basics/light-side-by-side.webp) · [dark](comparison/price-list-form-basics/dark-side-by-side.webp) | [light](comparison/price-list-form-basics/light-styles.json) · [dark](comparison/price-list-form-basics/dark-styles.json) | height |
| CMP-DA-G-13 | Price list form: A price list | The Wholesale price list's rules card | [light](comparison/price-list-form-rules/light-side-by-side.webp) · [dark](comparison/price-list-form-rules/dark-side-by-side.webp) | [light](comparison/price-list-form-rules/light-styles.json) · [dark](comparison/price-list-form-rules/dark-styles.json) | height |
| CMP-DA-G-13 | Status badge: Active | The Wholesale price list's status in the price list list | [light](comparison/status-badge-active/light-side-by-side.webp) · [dark](comparison/status-badge-active/dark-side-by-side.webp) | [light](comparison/status-badge-active/light-styles.json) · [dark](comparison/status-badge-active/dark-styles.json) | None |
| CMP-DA-G-13 | Volume rule editor: Saved | The Wholesale price list's volume rule sheet | [light](comparison/volume-rule-editor/light-side-by-side.webp) · [dark](comparison/volume-rule-editor/dark-side-by-side.webp) | [light](comparison/volume-rule-editor/light-styles.json) · [dark](comparison/volume-rule-editor/dark-styles.json) | None |
| CMP-DA-G-13 | Customer group rule editor: Saved | The Wholesale price list's customer group rule sheet | [light](comparison/customer-group-rule-editor/light-side-by-side.webp) · [dark](comparison/customer-group-rule-editor/dark-side-by-side.webp) | [light](comparison/customer-group-rule-editor/light-styles.json) · [dark](comparison/customer-group-rule-editor/dark-styles.json) | None |
| CMP-DA-G-13 | Market rule editor: Saved | Fidelity summer trade's market rule sheet | [light](comparison/market-rule-editor/light-side-by-side.webp) · [dark](comparison/market-rule-editor/dark-side-by-side.webp) | [light](comparison/market-rule-editor/light-styles.json) · [dark](comparison/market-rule-editor/dark-styles.json) | None |
| CMP-DA-G-13 | Type picker sheet: Kinds | The add rule sheet on Fidelity spring launch | [light](comparison/type-picker-sheet/light-side-by-side.webp) · [dark](comparison/type-picker-sheet/dark-side-by-side.webp) | [light](comparison/type-picker-sheet/light-styles.json) · [dark](comparison/type-picker-sheet/dark-styles.json) | border colours, box-shadow, height |
| CMP-DA-G-02 | Bulk price editor dialog: Open | The Wholesale price list's edit prices dialog | [light](comparison/bulk-price-editor-dialog/light-side-by-side.webp) · [dark](comparison/bulk-price-editor-dialog/dark-side-by-side.webp) | [light](comparison/bulk-price-editor-dialog/light-styles.json) · [dark](comparison/bulk-price-editor-dialog/dark-styles.json) | height; 2 on the screen only |
| CMP-CORE-12 | Import button: Sheet | The product list's import sheet | [light](comparison/import-button-sheet/light-side-by-side.webp) · [dark](comparison/import-button-sheet/dark-side-by-side.webp) | [light](comparison/import-button-sheet/light-styles.json) · [dark](comparison/import-button-sheet/dark-styles.json) | border colours, box-shadow |
| CMP-CORE-09 | Export button: Dialog, no filter | The product list's export dialog | [light](comparison/export-button-dialog/light-side-by-side.webp) · [dark](comparison/export-button-dialog/dark-side-by-side.webp) | [light](comparison/export-button-dialog/light-styles.json) · [dark](comparison/export-button-dialog/dark-styles.json) | None |
| CMP-DA-G-09 | Import wizard dialog: Mapping | Import IM1005's mapping, reopened from the imports page | [light](comparison/import-wizard-dialog-mapping/light-side-by-side.webp) · [dark](comparison/import-wizard-dialog-mapping/dark-side-by-side.webp) | [light](comparison/import-wizard-dialog-mapping/light-styles.json) · [dark](comparison/import-wizard-dialog-mapping/dark-styles.json) | height, opacity |

## Screens, by state and variant

Each state of the fourteen screens and overlays as it runs, light and dark. The variant names who is signed in:

- **admin** is the browser tests' admin, who holds every permission.
- **catalogViewer** is a teammate whose role, added by `fidelity/staff.ts`, reads `products`, `publishing`, `media`, `product_types`, `stock`, `categories` and `collections` and writes nothing.
- **merchandiser** is a teammate with Spree's merchandiser template's role, which writes products, categories, collections and stock.
- **orderManager** is a teammate with the order manager template's role, which holds none of part 2's permissions; each of its captures is a direct visit to the page's address.

"Reached by" says how a request was answered or held in the browser, from each capture's note, and names the three captures made on a phone. Every other state is the server's.

| Screen | State | Captures | Reached by |
|---|---|---|---|
| DA-OVL-05 | mapping-required-unmapped | [admin](screens/DA-OVL-05/mapping-required-unmapped/admin-light.webp) ([dark](screens/DA-OVL-05/mapping-required-unmapped/admin-dark.webp)) |  |
| DA-OVL-05 | progress | [admin](screens/DA-OVL-05/progress/admin-light.webp) ([dark](screens/DA-OVL-05/progress/admin-dark.webp)) | The import's status requests are held open once it starts, so the wizard stays on its progress step |
| DA-OVL-05 | results-with-failed-rows | [admin](screens/DA-OVL-05/results-with-failed-rows/admin-light.webp) ([dark](screens/DA-OVL-05/results-with-failed-rows/admin-dark.webp)) |  |
| DA-OVL-05 | semicolon-mapping | [admin](screens/DA-OVL-05/semicolon-mapping/admin-light.webp) ([dark](screens/DA-OVL-05/semicolon-mapping/admin-dark.webp)) |  |
| DA-OVL-05 | upload | [admin](screens/DA-OVL-05/upload/admin-light.webp) ([dark](screens/DA-OVL-05/upload/admin-dark.webp)), [merchandiser](screens/DA-OVL-05/upload/merchandiser-light.webp) ([dark](screens/DA-OVL-05/upload/merchandiser-dark.webp)) |  |
| DA-PRD-06 | categories | [admin](screens/DA-PRD-06/categories/admin-light.webp) ([dark](screens/DA-PRD-06/categories/admin-dark.webp)) |  |
| DA-PRD-06 | collections | [admin](screens/DA-PRD-06/collections/admin-light.webp) ([dark](screens/DA-PRD-06/collections/admin-dark.webp)) |  |
| DA-PRD-06 | coverage | [admin](screens/DA-PRD-06/coverage/admin-light.webp) ([dark](screens/DA-PRD-06/coverage/admin-dark.webp)), [catalogViewer](screens/DA-PRD-06/coverage/catalogViewer-light.webp) ([dark](screens/DA-PRD-06/coverage/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-06/coverage/merchandiser-light.webp) ([dark](screens/DA-PRD-06/coverage/merchandiser-dark.webp)) |  |
| DA-PRD-06 | direct-visit | [orderManager](screens/DA-PRD-06/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-06/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-06 | export | [admin](screens/DA-PRD-06/export/admin-light.webp) ([dark](screens/DA-PRD-06/export/admin-dark.webp)) |  |
| DA-PRD-06 | failed | [admin](screens/DA-PRD-06/failed/admin-light.webp) ([dark](screens/DA-PRD-06/failed/admin-dark.webp)) | The coverage request is answered with a server error |
| DA-PRD-06 | import-wizard | [admin](screens/DA-PRD-06/import-wizard/admin-light.webp) ([dark](screens/DA-PRD-06/import-wizard/admin-dark.webp)) |  |
| DA-PRD-06 | loading | [admin](screens/DA-PRD-06/loading/admin-light.webp) ([dark](screens/DA-PRD-06/loading/admin-dark.webp)) | The coverage request is held open |
| DA-PRD-06 | no-other-language | [admin](screens/DA-PRD-06/no-other-language/admin-light.webp) ([dark](screens/DA-PRD-06/no-other-language/admin-dark.webp)) | The translation coverage is answered with no language besides the default |
| DA-PRD-06 | option-types | [admin](screens/DA-PRD-06/option-types/admin-light.webp) ([dark](screens/DA-PRD-06/option-types/admin-dark.webp)) |  |
| DA-PRD-06 | search-found-nothing | [admin](screens/DA-PRD-06/search-found-nothing/admin-light.webp) ([dark](screens/DA-PRD-06/search-found-nothing/admin-dark.webp)) |  |
| DA-PRD-06 | searched | [admin](screens/DA-PRD-06/searched/admin-light.webp) ([dark](screens/DA-PRD-06/searched/admin-dark.webp)) |  |
| DA-PRD-06 | translate-dialog | [admin](screens/DA-PRD-06/translate-dialog/admin-light.webp) ([dark](screens/DA-PRD-06/translate-dialog/admin-dark.webp)), [catalogViewer](screens/DA-PRD-06/translate-dialog/catalogViewer-light.webp) ([dark](screens/DA-PRD-06/translate-dialog/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-06/translate-dialog/merchandiser-light.webp) ([dark](screens/DA-PRD-06/translate-dialog/merchandiser-dark.webp)) |  |
| DA-PRD-07 | delete-confirmation | [admin](screens/DA-PRD-07/delete-confirmation/admin-light.webp) ([dark](screens/DA-PRD-07/delete-confirmation/admin-dark.webp)) |  |
| DA-PRD-07 | direct-visit | [orderManager](screens/DA-PRD-07/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-07/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-07 | dragging | [admin](screens/DA-PRD-07/dragging/admin-light.webp) ([dark](screens/DA-PRD-07/dragging/admin-dark.webp)) |  |
| DA-PRD-07 | expanded | [admin](screens/DA-PRD-07/expanded/admin-light.webp) ([dark](screens/DA-PRD-07/expanded/admin-dark.webp)) |  |
| DA-PRD-07 | failed | [admin](screens/DA-PRD-07/failed/admin-light.webp) ([dark](screens/DA-PRD-07/failed/admin-dark.webp)) | The category list request is answered with a server error |
| DA-PRD-07 | no-categories | [admin](screens/DA-PRD-07/no-categories/admin-light.webp) ([dark](screens/DA-PRD-07/no-categories/admin-dark.webp)) | The category list is answered with no categories |
| DA-PRD-07 | search-found-nothing | [admin](screens/DA-PRD-07/search-found-nothing/admin-light.webp) ([dark](screens/DA-PRD-07/search-found-nothing/admin-dark.webp)) |  |
| DA-PRD-07 | searched-list | [admin](screens/DA-PRD-07/searched-list/admin-light.webp) ([dark](screens/DA-PRD-07/searched-list/admin-dark.webp)) |  |
| DA-PRD-07 | tree | [admin](screens/DA-PRD-07/tree/admin-light.webp) ([dark](screens/DA-PRD-07/tree/admin-dark.webp)), [catalogViewer](screens/DA-PRD-07/tree/catalogViewer-light.webp) ([dark](screens/DA-PRD-07/tree/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-07/tree/merchandiser-light.webp) ([dark](screens/DA-PRD-07/tree/merchandiser-dark.webp)) |  |
| DA-PRD-07 | tree-narrow | [admin](screens/DA-PRD-07/tree-narrow/admin-light.webp) ([dark](screens/DA-PRD-07/tree-narrow/admin-dark.webp)) | 390 by 844 pixels. |
| DA-PRD-08 | direct-visit | [catalogViewer](screens/DA-PRD-08/direct-visit/catalogViewer-light.webp) ([dark](screens/DA-PRD-08/direct-visit/catalogViewer-dark.webp)), [orderManager](screens/DA-PRD-08/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-08/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-08 | empty | [admin](screens/DA-PRD-08/empty/admin-light.webp) ([dark](screens/DA-PRD-08/empty/admin-dark.webp)), [merchandiser](screens/DA-PRD-08/empty/merchandiser-light.webp) ([dark](screens/DA-PRD-08/empty/merchandiser-dark.webp)) |  |
| DA-PRD-08 | image-added | [admin](screens/DA-PRD-08/image-added/admin-light.webp) ([dark](screens/DA-PRD-08/image-added/admin-dark.webp)) |  |
| DA-PRD-08 | no-name | [admin](screens/DA-PRD-08/no-name/admin-light.webp) ([dark](screens/DA-PRD-08/no-name/admin-dark.webp)) |  |
| DA-PRD-08 | parent-chosen | [admin](screens/DA-PRD-08/parent-chosen/admin-light.webp) ([dark](screens/DA-PRD-08/parent-chosen/admin-dark.webp)) |  |
| DA-PRD-09 | custom-fields | [admin](screens/DA-PRD-09/custom-fields/admin-light.webp) ([dark](screens/DA-PRD-09/custom-fields/admin-dark.webp)) |  |
| DA-PRD-09 | direct-visit | [orderManager](screens/DA-PRD-09/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-09/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-09 | edited | [admin](screens/DA-PRD-09/edited/admin-light.webp) ([dark](screens/DA-PRD-09/edited/admin-dark.webp)), [catalogViewer](screens/DA-PRD-09/edited/catalogViewer-light.webp) ([dark](screens/DA-PRD-09/edited/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-09/edited/merchandiser-light.webp) ([dark](screens/DA-PRD-09/edited/merchandiser-dark.webp)) |  |
| DA-PRD-09 | failed | [admin](screens/DA-PRD-09/failed/admin-light.webp) ([dark](screens/DA-PRD-09/failed/admin-dark.webp)) | The category request is answered with a server error |
| DA-PRD-09 | loading | [admin](screens/DA-PRD-09/loading/admin-light.webp) ([dark](screens/DA-PRD-09/loading/admin-dark.webp)) | The category request is held open |
| DA-PRD-09 | products-dragging | [admin](screens/DA-PRD-09/products-dragging/admin-light.webp) ([dark](screens/DA-PRD-09/products-dragging/admin-dark.webp)) |  |
| DA-PRD-09 | products-picker | [admin](screens/DA-PRD-09/products-picker/admin-light.webp) ([dark](screens/DA-PRD-09/products-picker/admin-dark.webp)) |  |
| DA-PRD-09 | products-staged | [admin](screens/DA-PRD-09/products-staged/admin-light.webp) ([dark](screens/DA-PRD-09/products-staged/admin-dark.webp)) |  |
| DA-PRD-09 | save-refused | [admin](screens/DA-PRD-09/save-refused/admin-light.webp) ([dark](screens/DA-PRD-09/save-refused/admin-dark.webp)) |  |
| DA-PRD-09 | saved | [admin](screens/DA-PRD-09/saved/admin-light.webp) ([dark](screens/DA-PRD-09/saved/admin-dark.webp)) |  |
| DA-PRD-09 | sidebar-slot | [admin](screens/DA-PRD-09/sidebar-slot/admin-light.webp) ([dark](screens/DA-PRD-09/sidebar-slot/admin-dark.webp)) |  |
| DA-PRD-09 | unsaved-changes | [admin](screens/DA-PRD-09/unsaved-changes/admin-light.webp) ([dark](screens/DA-PRD-09/unsaved-changes/admin-dark.webp)) |  |
| DA-PRD-10 | delete-confirmation | [admin](screens/DA-PRD-10/delete-confirmation/admin-light.webp) ([dark](screens/DA-PRD-10/delete-confirmation/admin-dark.webp)) |  |
| DA-PRD-10 | direct-visit | [orderManager](screens/DA-PRD-10/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-10/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-10 | filtered-automatic | [admin](screens/DA-PRD-10/filtered-automatic/admin-light.webp) ([dark](screens/DA-PRD-10/filtered-automatic/admin-dark.webp)) |  |
| DA-PRD-10 | listed | [admin](screens/DA-PRD-10/listed/admin-light.webp) ([dark](screens/DA-PRD-10/listed/admin-dark.webp)), [catalogViewer](screens/DA-PRD-10/listed/catalogViewer-light.webp) ([dark](screens/DA-PRD-10/listed/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-10/listed/merchandiser-light.webp) ([dark](screens/DA-PRD-10/listed/merchandiser-dark.webp)) |  |
| DA-PRD-10 | no-collections | [admin](screens/DA-PRD-10/no-collections/admin-light.webp) ([dark](screens/DA-PRD-10/no-collections/admin-dark.webp)) | The collection list is answered with no collections |
| DA-PRD-10 | search-found-nothing | [admin](screens/DA-PRD-10/search-found-nothing/admin-light.webp) ([dark](screens/DA-PRD-10/search-found-nothing/admin-dark.webp)) |  |
| DA-PRD-10 | searched | [admin](screens/DA-PRD-10/searched/admin-light.webp) ([dark](screens/DA-PRD-10/searched/admin-dark.webp)) |  |
| DA-PRD-11 | automatic-rules | [admin](screens/DA-PRD-11/automatic-rules/admin-light.webp) ([dark](screens/DA-PRD-11/automatic-rules/admin-dark.webp)) |  |
| DA-PRD-11 | direct-visit | [catalogViewer](screens/DA-PRD-11/direct-visit/catalogViewer-light.webp) ([dark](screens/DA-PRD-11/direct-visit/catalogViewer-dark.webp)), [orderManager](screens/DA-PRD-11/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-11/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-11 | empty | [admin](screens/DA-PRD-11/empty/admin-light.webp) ([dark](screens/DA-PRD-11/empty/admin-dark.webp)), [merchandiser](screens/DA-PRD-11/empty/merchandiser-light.webp) ([dark](screens/DA-PRD-11/empty/merchandiser-dark.webp)) |  |
| DA-PRD-11 | manual | [admin](screens/DA-PRD-11/manual/admin-light.webp) ([dark](screens/DA-PRD-11/manual/admin-dark.webp)) |  |
| DA-PRD-11 | no-name | [admin](screens/DA-PRD-11/no-name/admin-light.webp) ([dark](screens/DA-PRD-11/no-name/admin-dark.webp)) |  |
| DA-PRD-12 | automatic | [admin](screens/DA-PRD-12/automatic/admin-light.webp) ([dark](screens/DA-PRD-12/automatic/admin-dark.webp)), [catalogViewer](screens/DA-PRD-12/automatic/catalogViewer-light.webp) ([dark](screens/DA-PRD-12/automatic/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-12/automatic/merchandiser-light.webp) ([dark](screens/DA-PRD-12/automatic/merchandiser-dark.webp)) |  |
| DA-PRD-12 | automatic-rule-edited | [admin](screens/DA-PRD-12/automatic-rule-edited/admin-light.webp) ([dark](screens/DA-PRD-12/automatic-rule-edited/admin-dark.webp)) |  |
| DA-PRD-12 | direct-visit | [orderManager](screens/DA-PRD-12/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-12/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-12 | manual | [admin](screens/DA-PRD-12/manual/admin-light.webp) ([dark](screens/DA-PRD-12/manual/admin-dark.webp)), [catalogViewer](screens/DA-PRD-12/manual/catalogViewer-light.webp) ([dark](screens/DA-PRD-12/manual/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-12/manual/merchandiser-light.webp) ([dark](screens/DA-PRD-12/manual/merchandiser-dark.webp)) |  |
| DA-PRD-12 | manual-narrow | [admin](screens/DA-PRD-12/manual-narrow/admin-light.webp) ([dark](screens/DA-PRD-12/manual-narrow/admin-dark.webp)) | 390 by 844 pixels. |
| DA-PRD-12 | products-staged | [admin](screens/DA-PRD-12/products-staged/admin-light.webp) ([dark](screens/DA-PRD-12/products-staged/admin-dark.webp)) |  |
| DA-PRD-12 | saved | [admin](screens/DA-PRD-12/saved/admin-light.webp) ([dark](screens/DA-PRD-12/saved/admin-dark.webp)) |  |
| DA-PRD-12 | several-chosen-for-removal | [admin](screens/DA-PRD-12/several-chosen-for-removal/admin-light.webp) ([dark](screens/DA-PRD-12/several-chosen-for-removal/admin-dark.webp)) |  |
| DA-PRD-12 | several-removed-before-save | [admin](screens/DA-PRD-12/several-removed-before-save/admin-light.webp) ([dark](screens/DA-PRD-12/several-removed-before-save/admin-dark.webp)) |  |
| DA-PRD-12 | sidebar-slot | [admin](screens/DA-PRD-12/sidebar-slot/admin-light.webp) ([dark](screens/DA-PRD-12/sidebar-slot/admin-dark.webp)) |  |
| DA-PRD-12 | switched-to-rules | [admin](screens/DA-PRD-12/switched-to-rules/admin-light.webp) ([dark](screens/DA-PRD-12/switched-to-rules/admin-dark.webp)) |  |
| DA-PRD-12 | unsaved-changes | [admin](screens/DA-PRD-12/unsaved-changes/admin-light.webp) ([dark](screens/DA-PRD-12/unsaved-changes/admin-dark.webp)) |  |
| DA-PRD-13 | delete-confirmation | [admin](screens/DA-PRD-13/delete-confirmation/admin-light.webp) ([dark](screens/DA-PRD-13/delete-confirmation/admin-dark.webp)) |  |
| DA-PRD-13 | direct-visit | [orderManager](screens/DA-PRD-13/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-13/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-13 | filtered-inactive | [admin](screens/DA-PRD-13/filtered-inactive/admin-light.webp) ([dark](screens/DA-PRD-13/filtered-inactive/admin-dark.webp)) |  |
| DA-PRD-13 | listed | [admin](screens/DA-PRD-13/listed/admin-light.webp) ([dark](screens/DA-PRD-13/listed/admin-dark.webp)), [catalogViewer](screens/DA-PRD-13/listed/catalogViewer-light.webp) ([dark](screens/DA-PRD-13/listed/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-13/listed/merchandiser-light.webp) ([dark](screens/DA-PRD-13/listed/merchandiser-dark.webp)) |  |
| DA-PRD-13 | no-catalogs | [admin](screens/DA-PRD-13/no-catalogs/admin-light.webp) ([dark](screens/DA-PRD-13/no-catalogs/admin-dark.webp)) | The catalog list is answered with no catalogs |
| DA-PRD-13 | searched | [admin](screens/DA-PRD-13/searched/admin-light.webp) ([dark](screens/DA-PRD-13/searched/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-audience-assigned | [admin](screens/DA-PRD-13/wizard-audience-assigned/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-audience-assigned/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-audience-none | [admin](screens/DA-PRD-13/wizard-audience-none/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-audience-none/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-blank-name | [admin](screens/DA-PRD-13/wizard-blank-name/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-blank-name/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-closed-untouched | [admin](screens/DA-PRD-13/wizard-closed-untouched/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-closed-untouched/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-details | [admin](screens/DA-PRD-13/wizard-details/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-details/admin-dark.webp)), [merchandiser](screens/DA-PRD-13/wizard-details/merchandiser-light.webp) ([dark](screens/DA-PRD-13/wizard-details/merchandiser-dark.webp)) |  |
| DA-PRD-13 | wizard-discard-confirmation | [admin](screens/DA-PRD-13/wizard-discard-confirmation/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-discard-confirmation/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-pricing | [admin](screens/DA-PRD-13/wizard-pricing/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-pricing/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-pricing-needs-fixing | [admin](screens/DA-PRD-13/wizard-pricing-needs-fixing/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-pricing-needs-fixing/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-products-chosen | [admin](screens/DA-PRD-13/wizard-products-chosen/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-products-chosen/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-products-none | [admin](screens/DA-PRD-13/wizard-products-none/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-products-none/admin-dark.webp)) |  |
| DA-PRD-13 | wizard-review | [admin](screens/DA-PRD-13/wizard-review/admin-light.webp) ([dark](screens/DA-PRD-13/wizard-review/admin-dark.webp)) |  |
| DA-PRD-14 | activate-confirmation | [admin](screens/DA-PRD-14/activate-confirmation/admin-light.webp) ([dark](screens/DA-PRD-14/activate-confirmation/admin-dark.webp)) |  |
| DA-PRD-14 | audience | [admin](screens/DA-PRD-14/audience/admin-light.webp) ([dark](screens/DA-PRD-14/audience/admin-dark.webp)), [catalogViewer](screens/DA-PRD-14/audience/catalogViewer-light.webp) ([dark](screens/DA-PRD-14/audience/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-14/audience/merchandiser-light.webp) ([dark](screens/DA-PRD-14/audience/merchandiser-dark.webp)) |  |
| DA-PRD-14 | audience-adding | [admin](screens/DA-PRD-14/audience-adding/admin-light.webp) ([dark](screens/DA-PRD-14/audience-adding/admin-dark.webp)) |  |
| DA-PRD-14 | audience-withdrawn | [admin](screens/DA-PRD-14/audience-withdrawn/admin-light.webp) ([dark](screens/DA-PRD-14/audience-withdrawn/admin-dark.webp)) |  |
| DA-PRD-14 | deactivate-confirmation | [admin](screens/DA-PRD-14/deactivate-confirmation/admin-light.webp) ([dark](screens/DA-PRD-14/deactivate-confirmation/admin-dark.webp)) |  |
| DA-PRD-14 | direct-visit | [orderManager](screens/DA-PRD-14/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-14/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-14 | failed | [admin](screens/DA-PRD-14/failed/admin-light.webp) ([dark](screens/DA-PRD-14/failed/admin-dark.webp)) | The catalog request is answered with a server error |
| DA-PRD-14 | loading | [admin](screens/DA-PRD-14/loading/admin-light.webp) ([dark](screens/DA-PRD-14/loading/admin-dark.webp)) | The catalog request is held open |
| DA-PRD-14 | prices-export | [admin](screens/DA-PRD-14/prices-export/admin-light.webp) ([dark](screens/DA-PRD-14/prices-export/admin-dark.webp)) |  |
| DA-PRD-14 | prices-import | [admin](screens/DA-PRD-14/prices-import/admin-light.webp) ([dark](screens/DA-PRD-14/prices-import/admin-dark.webp)) |  |
| DA-PRD-14 | pricing-entered | [admin](screens/DA-PRD-14/pricing-entered/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-entered/admin-dark.webp)), [catalogViewer](screens/DA-PRD-14/pricing-entered/catalogViewer-light.webp) ([dark](screens/DA-PRD-14/pricing-entered/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-14/pricing-entered/merchandiser-light.webp) ([dark](screens/DA-PRD-14/pricing-entered/merchandiser-dark.webp)) |  |
| DA-PRD-14 | pricing-entered-editor | [admin](screens/DA-PRD-14/pricing-entered-editor/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-entered-editor/admin-dark.webp)) |  |
| DA-PRD-14 | pricing-normal | [admin](screens/DA-PRD-14/pricing-normal/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-normal/admin-dark.webp)) |  |
| DA-PRD-14 | pricing-percentage | [admin](screens/DA-PRD-14/pricing-percentage/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-percentage/admin-dark.webp)), [catalogViewer](screens/DA-PRD-14/pricing-percentage/catalogViewer-light.webp) ([dark](screens/DA-PRD-14/pricing-percentage/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-14/pricing-percentage/merchandiser-light.webp) ([dark](screens/DA-PRD-14/pricing-percentage/merchandiser-dark.webp)) |  |
| DA-PRD-14 | pricing-switched-to-percentage | [admin](screens/DA-PRD-14/pricing-switched-to-percentage/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-switched-to-percentage/admin-dark.webp)) |  |
| DA-PRD-14 | pricing-tier-preview | [admin](screens/DA-PRD-14/pricing-tier-preview/admin-light.webp) ([dark](screens/DA-PRD-14/pricing-tier-preview/admin-dark.webp)) |  |
| DA-PRD-14 | products-picker-all-matching | [admin](screens/DA-PRD-14/products-picker-all-matching/admin-light.webp) ([dark](screens/DA-PRD-14/products-picker-all-matching/admin-dark.webp)) |  |
| DA-PRD-14 | products-picker-paged | [admin](screens/DA-PRD-14/products-picker-paged/admin-light.webp) ([dark](screens/DA-PRD-14/products-picker-paged/admin-dark.webp)) |  |
| DA-PRD-14 | products-staged | [admin](screens/DA-PRD-14/products-staged/admin-light.webp) ([dark](screens/DA-PRD-14/products-staged/admin-dark.webp)) |  |
| DA-PRD-14 | saved | [admin](screens/DA-PRD-14/saved/admin-light.webp) ([dark](screens/DA-PRD-14/saved/admin-dark.webp)) |  |
| DA-PRD-14 | settings | [admin](screens/DA-PRD-14/settings/admin-light.webp) ([dark](screens/DA-PRD-14/settings/admin-dark.webp)), [catalogViewer](screens/DA-PRD-14/settings/catalogViewer-light.webp) ([dark](screens/DA-PRD-14/settings/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-14/settings/merchandiser-light.webp) ([dark](screens/DA-PRD-14/settings/merchandiser-dark.webp)) |  |
| DA-PRD-14 | sidebar-slot | [admin](screens/DA-PRD-14/sidebar-slot/admin-light.webp) ([dark](screens/DA-PRD-14/sidebar-slot/admin-dark.webp)) |  |
| DA-PRD-14 | staged-changes | [admin](screens/DA-PRD-14/staged-changes/admin-light.webp) ([dark](screens/DA-PRD-14/staged-changes/admin-dark.webp)) |  |
| DA-PRD-14 | terms | [admin](screens/DA-PRD-14/terms/admin-light.webp) ([dark](screens/DA-PRD-14/terms/admin-dark.webp)), [catalogViewer](screens/DA-PRD-14/terms/catalogViewer-light.webp) ([dark](screens/DA-PRD-14/terms/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-14/terms/merchandiser-light.webp) ([dark](screens/DA-PRD-14/terms/merchandiser-dark.webp)) |  |
| DA-PRD-14 | terms-errors | [admin](screens/DA-PRD-14/terms-errors/admin-light.webp) ([dark](screens/DA-PRD-14/terms-errors/admin-dark.webp)) |  |
| DA-PRD-15 | delete-confirmation | [admin](screens/DA-PRD-15/delete-confirmation/admin-light.webp) ([dark](screens/DA-PRD-15/delete-confirmation/admin-dark.webp)) |  |
| DA-PRD-15 | direct-visit | [orderManager](screens/DA-PRD-15/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-15/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-15 | filtered-active | [admin](screens/DA-PRD-15/filtered-active/admin-light.webp) ([dark](screens/DA-PRD-15/filtered-active/admin-dark.webp)) |  |
| DA-PRD-15 | filtered-draft | [admin](screens/DA-PRD-15/filtered-draft/admin-light.webp) ([dark](screens/DA-PRD-15/filtered-draft/admin-dark.webp)) |  |
| DA-PRD-15 | filtered-inactive | [admin](screens/DA-PRD-15/filtered-inactive/admin-light.webp) ([dark](screens/DA-PRD-15/filtered-inactive/admin-dark.webp)) |  |
| DA-PRD-15 | filtered-scheduled | [admin](screens/DA-PRD-15/filtered-scheduled/admin-light.webp) ([dark](screens/DA-PRD-15/filtered-scheduled/admin-dark.webp)) |  |
| DA-PRD-15 | listed | [admin](screens/DA-PRD-15/listed/admin-light.webp) ([dark](screens/DA-PRD-15/listed/admin-dark.webp)), [catalogViewer](screens/DA-PRD-15/listed/catalogViewer-light.webp) ([dark](screens/DA-PRD-15/listed/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-15/listed/merchandiser-light.webp) ([dark](screens/DA-PRD-15/listed/merchandiser-dark.webp)) |  |
| DA-PRD-15 | no-price-lists | [admin](screens/DA-PRD-15/no-price-lists/admin-light.webp) ([dark](screens/DA-PRD-15/no-price-lists/admin-dark.webp)) | The price list list is answered with no price lists |
| DA-PRD-15 | search-found-nothing | [admin](screens/DA-PRD-15/search-found-nothing/admin-light.webp) ([dark](screens/DA-PRD-15/search-found-nothing/admin-dark.webp)) |  |
| DA-PRD-15 | searched | [admin](screens/DA-PRD-15/searched/admin-light.webp) ([dark](screens/DA-PRD-15/searched/admin-dark.webp)) |  |
| DA-PRD-16 | direct-visit | [catalogViewer](screens/DA-PRD-16/direct-visit/catalogViewer-light.webp) ([dark](screens/DA-PRD-16/direct-visit/catalogViewer-dark.webp)), [orderManager](screens/DA-PRD-16/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-16/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-16 | empty | [admin](screens/DA-PRD-16/empty/admin-light.webp) ([dark](screens/DA-PRD-16/empty/admin-dark.webp)), [merchandiser](screens/DA-PRD-16/empty/merchandiser-light.webp) ([dark](screens/DA-PRD-16/empty/merchandiser-dark.webp)) |  |
| DA-PRD-16 | no-name | [admin](screens/DA-PRD-16/no-name/admin-light.webp) ([dark](screens/DA-PRD-16/no-name/admin-dark.webp)) |  |
| DA-PRD-16 | rule-channel | [admin](screens/DA-PRD-16/rule-channel/admin-light.webp) ([dark](screens/DA-PRD-16/rule-channel/admin-dark.webp)) |  |
| DA-PRD-16 | rule-market | [admin](screens/DA-PRD-16/rule-market/admin-light.webp) ([dark](screens/DA-PRD-16/rule-market/admin-dark.webp)) |  |
| DA-PRD-16 | rule-type-picker | [admin](screens/DA-PRD-16/rule-type-picker/admin-light.webp) ([dark](screens/DA-PRD-16/rule-type-picker/admin-dark.webp)) |  |
| DA-PRD-16 | rule-volume | [admin](screens/DA-PRD-16/rule-volume/admin-light.webp) ([dark](screens/DA-PRD-16/rule-volume/admin-dark.webp)) |  |
| DA-PRD-16 | schedule | [admin](screens/DA-PRD-16/schedule/admin-light.webp) ([dark](screens/DA-PRD-16/schedule/admin-dark.webp)) |  |
| DA-PRD-17 | activate-refused | [admin](screens/DA-PRD-17/activate-refused/admin-light.webp) ([dark](screens/DA-PRD-17/activate-refused/admin-dark.webp)) |  |
| DA-PRD-17 | direct-visit | [orderManager](screens/DA-PRD-17/direct-visit/orderManager-light.webp) ([dark](screens/DA-PRD-17/direct-visit/orderManager-dark.webp)) |  |
| DA-PRD-17 | loading | [admin](screens/DA-PRD-17/loading/admin-light.webp) ([dark](screens/DA-PRD-17/loading/admin-dark.webp)) | The price list request is held open |
| DA-PRD-17 | prices-break-added | [admin](screens/DA-PRD-17/prices-break-added/admin-light.webp) ([dark](screens/DA-PRD-17/prices-break-added/admin-dark.webp)) |  |
| DA-PRD-17 | prices-euros | [admin](screens/DA-PRD-17/prices-euros/admin-light.webp) ([dark](screens/DA-PRD-17/prices-euros/admin-dark.webp)) |  |
| DA-PRD-17 | prices-export | [admin](screens/DA-PRD-17/prices-export/admin-light.webp) ([dark](screens/DA-PRD-17/prices-export/admin-dark.webp)) |  |
| DA-PRD-17 | prices-import | [admin](screens/DA-PRD-17/prices-import/admin-light.webp) ([dark](screens/DA-PRD-17/prices-import/admin-dark.webp)) |  |
| DA-PRD-17 | prices-spreadsheet | [admin](screens/DA-PRD-17/prices-spreadsheet/admin-light.webp) ([dark](screens/DA-PRD-17/prices-spreadsheet/admin-dark.webp)), [catalogViewer](screens/DA-PRD-17/prices-spreadsheet/catalogViewer-light.webp) ([dark](screens/DA-PRD-17/prices-spreadsheet/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-17/prices-spreadsheet/merchandiser-light.webp) ([dark](screens/DA-PRD-17/prices-spreadsheet/merchandiser-dark.webp)) |  |
| DA-PRD-17 | products-narrow | [admin](screens/DA-PRD-17/products-narrow/admin-light.webp) ([dark](screens/DA-PRD-17/products-narrow/admin-dark.webp)) | 390 by 844 pixels. |
| DA-PRD-17 | products-page-2 | [admin](screens/DA-PRD-17/products-page-2/admin-light.webp) ([dark](screens/DA-PRD-17/products-page-2/admin-dark.webp)) |  |
| DA-PRD-17 | rule-edited | [admin](screens/DA-PRD-17/rule-edited/admin-light.webp) ([dark](screens/DA-PRD-17/rule-edited/admin-dark.webp)) |  |
| DA-PRD-17 | rule-remove-confirmation | [admin](screens/DA-PRD-17/rule-remove-confirmation/admin-light.webp) ([dark](screens/DA-PRD-17/rule-remove-confirmation/admin-dark.webp)) |  |
| DA-PRD-17 | rule-removed | [admin](screens/DA-PRD-17/rule-removed/admin-light.webp) ([dark](screens/DA-PRD-17/rule-removed/admin-dark.webp)) |  |
| DA-PRD-17 | rules-and-products | [admin](screens/DA-PRD-17/rules-and-products/admin-light.webp) ([dark](screens/DA-PRD-17/rules-and-products/admin-dark.webp)), [catalogViewer](screens/DA-PRD-17/rules-and-products/catalogViewer-light.webp) ([dark](screens/DA-PRD-17/rules-and-products/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-17/rules-and-products/merchandiser-light.webp) ([dark](screens/DA-PRD-17/rules-and-products/merchandiser-dark.webp)) |  |
| DA-PRD-17 | saved | [admin](screens/DA-PRD-17/saved/admin-light.webp) ([dark](screens/DA-PRD-17/saved/admin-dark.webp)) |  |
| DA-PRD-17 | sidebar-slot | [admin](screens/DA-PRD-17/sidebar-slot/admin-light.webp) ([dark](screens/DA-PRD-17/sidebar-slot/admin-dark.webp)) |  |
| DA-PRD-17 | superseded-audience-rules | [admin](screens/DA-PRD-17/superseded-audience-rules/admin-light.webp) ([dark](screens/DA-PRD-17/superseded-audience-rules/admin-dark.webp)), [catalogViewer](screens/DA-PRD-17/superseded-audience-rules/catalogViewer-light.webp) ([dark](screens/DA-PRD-17/superseded-audience-rules/catalogViewer-dark.webp)), [merchandiser](screens/DA-PRD-17/superseded-audience-rules/merchandiser-light.webp) ([dark](screens/DA-PRD-17/superseded-audience-rules/merchandiser-dark.webp)) |  |
| DA-PRD-17 | unsaved-changes | [admin](screens/DA-PRD-17/unsaved-changes/admin-light.webp) ([dark](screens/DA-PRD-17/unsaved-changes/admin-dark.webp)) |  |
| DA-SET-31 | delete-confirmation | [admin](screens/DA-SET-31/delete-confirmation/admin-light.webp) ([dark](screens/DA-SET-31/delete-confirmation/admin-dark.webp)) |  |
| DA-SET-31 | direct-visit | [orderManager](screens/DA-SET-31/direct-visit/orderManager-light.webp) ([dark](screens/DA-SET-31/direct-visit/orderManager-dark.webp)) |  |
| DA-SET-31 | each-status | [admin](screens/DA-SET-31/each-status/admin-light.webp) ([dark](screens/DA-SET-31/each-status/admin-dark.webp)) | The list is answered with four imports given the statuses no import on this server is left in: pending, queued (mapping completed), processing and failed |
| DA-SET-31 | listed | [admin](screens/DA-SET-31/listed/admin-light.webp) ([dark](screens/DA-SET-31/listed/admin-dark.webp)), [catalogViewer](screens/DA-SET-31/listed/catalogViewer-light.webp) ([dark](screens/DA-SET-31/listed/catalogViewer-dark.webp)), [merchandiser](screens/DA-SET-31/listed/merchandiser-light.webp) ([dark](screens/DA-SET-31/listed/merchandiser-dark.webp)) |  |
| DA-SET-31 | mapping-reopened | [admin](screens/DA-SET-31/mapping-reopened/admin-light.webp) ([dark](screens/DA-SET-31/mapping-reopened/admin-dark.webp)) |  |
| DA-SET-31 | no-imports | [admin](screens/DA-SET-31/no-imports/admin-light.webp) ([dark](screens/DA-SET-31/no-imports/admin-dark.webp)) | The import list is answered with no imports |
| DA-SET-31 | results | [admin](screens/DA-SET-31/results/admin-light.webp) ([dark](screens/DA-SET-31/results/admin-dark.webp)) |  |
| DA-SET-31 | row-actions | [admin](screens/DA-SET-31/row-actions/admin-light.webp) ([dark](screens/DA-SET-31/row-actions/admin-dark.webp)) |  |

## FL-21 on the running server

| File | What it shows |
|---|---|
| [1-import-mapping.webp](fl-21/1-import-mapping.webp) | The import wizard, opened from the product list, with the file's 21 columns mapped |
| [2-import-results.webp](fl-21/2-import-results.webp) | The import's results: three rows imported |
| [3-import-email-link.webp](fl-21/3-import-email-link.webp) | The imports page, opened from EM-S-06's link, with the import open |
| [4-export-dialog.webp](fl-21/4-export-dialog.webp) | The product list's export dialog |
| [5-export-downloaded.webp](fl-21/5-export-downloaded.webp) | The product list once the export finished and the dashboard downloaded the file |
| [6-export-email-link.webp](fl-21/6-export-email-link.webp) | Where EM-S-05's link leads: the product list, not the file (record B17) |
| [import.csv](fl-21/import.csv) | The file imported: three rows, two products, one of them with two variants |
| [import.json](fl-21/import.json) | The import's number and status, how long its results and its email took, EM-S-06's subject, and every field of each imported product and variant, the file's value beside the value the Admin API answered: 54 fields, all the same |
| [export.csv](fl-21/export.csv) | The file the dashboard downloaded: 201 rows for 61 products |
| [export.json](fl-21/export.json) | The export's number, how long its download and its email took, EM-S-05's subject and where its link leads, the header, which rows cover which variants, prices and stock against the Admin API, the columns not compared and why, and seven representative rows value by value beside the Admin API's values: 203 fields, 201 the same and 2 explained |

## Emails

| File | What it shows |
|---|---|
| [EM-S-05.webp](emails/EM-S-05.webp) | The export email, rendered from Spree's `ExportPreview#export_done` |
| [EM-S-06.webp](emails/EM-S-06.webp) | The import email, rendered from Spree's `ImportPreview#import_done` |
| [EM-S-05-as-sent.webp](emails/EM-S-05-as-sent.webp) | The export email as the server wrote it to its mail folder during FL-21 |
| [EM-S-06-as-sent.webp](emails/EM-S-06-as-sent.webp) | The import email as sent during FL-21 |
| [emails.json](emails/emails.json) | Each preview's subject, template and parts: plain text and HTML |

Each email asks for a web font from Google's font service; the request was blocked, so the images use the browser's fallback font. The previews read the store's latest export and import, the ones FL-21 made, so each preview's HTML is the same, byte for byte, as the message sent.

## Backend

| File | What it holds | Result |
|---|---|---|
| [api-specs.json](backend/api-specs.json) | Spree's API specs for part 2's endpoints at `5794da6`: 19 controller specs, `imports_controller_spec.rb` (44), `catalogs_controller_spec.rb` (36), `prices_controller_spec.rb` (34), `exports_controller_spec.rb` (32), `categories_controller_spec.rb` (29), `price_lists_controller_spec.rb` (29), `translations_coverage_controller_spec.rb` (23), `catalogs/products_controller_spec.rb` (18), `collections_controller_spec.rb` (16), `collections/products_controller_spec.rb` (15), `price_lists/products_controller_spec.rb` (15), `categories/products_controller_spec.rb` (13), `translations_controller_spec.rb` (8), `translations/batches_controller_spec.rb` (6), `catalogs/order_minimums_controller_spec.rb` (5), `catalogs/quantity_rules_controller_spec.rb` (5), `import_rows_controller_spec.rb` (5), `catalog_assignments_controller_spec.rb` (2) and `collection_rules_controller_spec.rb` (2), each count with the shared examples it runs; and 10 integration specs, `catalogs_spec.rb` (17), `price_lists_spec.rb` (16), `categories_spec.rb` (12), `collections_spec.rb` (12), `imports_spec.rb` (11), `prices_spec.rb` (9), `exports_spec.rb` (5), `translations/batch_spec.rb` (2), `translations_coverage_spec.rb` (2) and `products/translations_spec.rb` (1) | 424 examples, all passed (seed 32558) |
| [core-specs.json](backend/core-specs.json) | Spree's core model specs at `5794da6`: `category_spec.rb` (68), `price_list_spec.rb` (65), `catalog_spec.rb` (55), `export_spec.rb` (45), `import_spec.rb` (35), `collection_spec.rb` (34), `import_row_spec.rb` (14), `price_rules/customer_group_rule_spec.rb` (14), `import_mapping_spec.rb` (13), `price_rules/user_rule_spec.rb` (11), `translations/batch_spec.rb` (9), `catalog_quantity_rule_spec.rb` (8), `price_rules/channel_rule_spec.rb` (8), `price_rules/market_rule_spec.rb` (7), `collection_rule_spec.rb` (6), `price_rules/volume_rule_spec.rb` (6), `catalog_order_minimum_spec.rb` (5), `collection_rules/tag_spec.rb` (5), `exports/products_spec.rb` (5), `price_rule_spec.rb` (4), `exports/price_list_prices_spec.rb` (3), `imports/price_list_prices_spec.rb` (3), `collection_rules/available_on_spec.rb` (2) and `collection_rules/sale_spec.rb` (1), each count with the shared examples it runs | 426 examples: 424 passed, and 2 skipped by Spree on SQLite, in the category and catalog specs, the metadata query Spree runs on PostgreSQL only (seed 6666) |

These are observations at one revision each. Spree's specs are Spree's own unit checks; they ran on SQLite in this session, and CI runs Spree's suites on PostgreSQL and MySQL.
