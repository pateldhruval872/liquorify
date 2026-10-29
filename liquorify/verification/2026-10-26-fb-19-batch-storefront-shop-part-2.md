---
title: FB-19 storefront shop batch, part 2
record: verification
work_item: FB-19
date: 2026-10-26
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens, Spree's own specs for the endpoints part 2's screens read, and Spree's address specs. All 32 states the work item lists were captured, and 36 more for the settings, first-run setup, the addresses and what was found on the way; five were reached by holding or failing a request, and their notes say so. 33 cases were compared with their stories, after two corrections to the stories, with no unexplained difference. Each setting saved in the dashboard was seen on the storefront, or not, and recorded (criterion 14). First-run setup with sample data FAILS for a store that does not sell in US dollars (SD-8): the sample data stopped at its wholesale step, and the new store's storefront shows no products. Storefront access FAILS for signed-in customers (SD-9): they see what a guest sees. A failed request on the product list says nothing (SD-10). Coverage and functional verification are recorded apart (§2): CAP-05-01, CAP-05-04 and CAP-05-14's results page are PARTIAL, their browsing and product steps passing the storefront's browser tests but one; searching and filtering have no browser test (G-46). Tenant isolation is NOT_RUN. On 2026-10-29 the owner accepted the reference images, the screen evidence and fidelity, the corrected header captures included, within the documented limits (§15). Part 2 is in its own pull requests, storefront #21 and backend #26, at the owner's choice. In CI on storefront #21 at `c198b60` the visual check passed twice, 490 of 490 each time, and lint, the type check, the unit tests and all 21 browser tests passed (§12). Locally, one product browser test failed on the cart drawer's duplicate link name with Spree's sample catalog (B12), as part 1's cart test did
---

# FB-19 storefront shop batch, part 2

**Claim.** Part 2 of the [storefront shop batch](../work-items/fb-19-batch-storefront-shop.md) reproduces what the storefront already has for the product lists and search results, the category page and the product page. It gives the 24 components those screens use 74 Storybook stories, with a reference image at each of the storefront's two widths. It captures those screens on the running storefront in each meaningful state, as a guest and a customer, with wholesale off and on, and in two markets. It runs the work item's three checks that waited for batch 3 ([§10.4 to §10.6](../work-items/fb-19-batch-storefront-shop.md#104-settings-saved-in-the-dashboard-seen-on-the-storefront-g-38s-storefront-part)): settings saved in the dashboard seen on the storefront (G-38's storefront part), first-run setup with sample data (G-36) and search-friendly addresses (CAP-05-16). It compares 33 cases with their stories, runs Spree's own specs for the endpoints these screens read and its address specs, and the storefront's own unit and browser tests, and records the three permission claims apart. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and part 1's record, as the work item's §10 says.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and reference images | Storefront pull request [#21](https://github.com/pateldhruval872/liquorify-storefront/pull/21) at `c198b60`, four commits on part 1's storefront branch at `da06743` ([#20](https://github.com/pateldhruval872/liquorify-storefront/pull/20)). On a branch of its own, at the owner's choice of 2026-10-26, so #20 stays as reviewed; it merges after #20. The comparison script's header correction of 2026-10-27 is `4ee76ba`, on the same branch, and changes the script only (§4.4) |
| This record and its evidence | Pull request [#26](https://github.com/pateldhruval872/liquorify/pull/26), on part 1's records branch ([#21](https://github.com/pateldhruval872/liquorify/pull/21)): built on it at `bb73188`, which included `main` `1cab30d`, and brought up to date with it at `8864f60`, which includes `main` `d5a5661` after #20, #23 and #25. Between the two, `main` changed records only: the setup story's timing fix was already on #21's branch. It merges after #21, and is brought up to date after each merge before it |
| The storefront's code | `main` `321fa1c`. Part 2 changes none of it: `git diff 321fa1c c198b60` over `src/`, `messages/`, `public/`, `e2e/`, `.github/`, `package.json` and `pnpm-lock.yaml` is empty |
| Spree's code: the API, the dashboard and the browser-test server | `main` `1cab30d`, after #19, #24 and part 1's records. The records branch changes none of it; its one commit outside `liquorify/` adds a sample data run to batch 3's first-run check (§7) |
| Running screens | The storefront at `321fa1c`, built for production, against lane A's own browser-test Rails server at `1cab30d`, with Spree's sample catalog in its own database. Captured in the storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels wide, with the fonts served offline. The dashboard's captures used the dashboard built from `1cab30d` against the same server |
| First-run setup | A second browser-test server with its own empty database and no admin, at `1cab30d`, whose Spree and dashboard code is `main` `5a83c35`'s, where batch 3 ran the same check without sample data. Run in the backend's pinned Playwright 1.64.1 image |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-storefront-shop.md#5-acceptance-criteria), applied to part 2 by [§10.9](../work-items/fb-19-batch-storefront-shop.md#109-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails | PASS: the map in §2 has every ID from the work item's §10.1, with its evidence or a named gap. None of part 2's screens sends an email |
| 2 | Every component part 2's screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | PASS: 24 new components, 74 stories, 148 reference images, each looked at before it was committed (§1, [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md)). The reused components are listed in §1. `ListingFilterBar` and `ListingAnalytics` are covered by the product listing's stories (U1); `JsonLd` draws nothing, and its output is recorded from the pages' source (§8) |
| 3 | Every screen is captured on the running storefront in each state in §10.2, at both widths | PASS: all 32 listed states are captured, in 31 captures, because the two-option product's pages show "no picture". 27 at both widths; the three filter dropdowns at 1280 pixels only and the filters drawer's two states at 390 only, because the storefront shows each only at that width. 36 more states for the settings, first-run setup, the addresses and what was found (§2.1). 148 images in all |
| 4 | Each variant in §10.3 is captured, showing what the interface does for it | PASS as evidence of what the interface shows: a guest and a customer, wholesale off and on, the United States beside the second market in euros and German and a third market made in the dashboard, and the store's three storefront access settings (§3.1). What it shows a customer under two of them is SD-9 |
| 5 | FL-05's browsing and product steps are mapped to the browser tests that cover them, and their result at the part's revision is recorded, in CI where the end-to-end job runs them | PASS for the mapping (§2.2). Locally, against lane A's server with Spree's sample catalog, 10 of the 11 tests passed; "adds the chosen quantity to the cart" failed on the cart drawer's duplicate link name (B12). In CI on storefront #21 at `c198b60`, the end-to-end job ran all 21 tests against Spree's published image, and all passed (§12). Searching and filtering have no browser test (G-46) |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | PASS, as a diagnostic: 33 cases, 61 comparisons on two set-ups, show no unexplained difference, after the 14 comparisons the storefront's header covered were captured again without it on 2026-10-27 (§4.4). Two stories were corrected, in the story: the quantity picker field's height, which the comparison found, and the filter bar's title, which the coverage report found (§4.2). The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is a gap, with the check made instead; a state reached in the browser says so | PASS: 33 of the 74 stories were not compared by the script; 17 show a state seen in a running-screen capture and 16 were checked against their source only (G-47). Five states were reached by holding or failing a request, four through the capture script's proxy and one in the browser, and their notes say so (G-48) |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | PASS: in CI on storefront #21 at `c198b60`, the visual check passed twice, 490 of 490 comparisons each time, the second run started by hand; lint, the type check, the unit tests (260) and the end-to-end job (21 tests) passed (§12). It stays advisory |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: part 2's storefront commits change only `stories/` and `visual/`. Its records change only `liquorify/` and the backend's Storybook package's first-run check, which adds a sample data run and changes no Spree code |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's storefront Storybook column, LIQ-004's progress, existing defects and gaps, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | ACCEPTED on 2026-10-29, at storefront `4ee76ba` and backend `ad9f7aa`: the reference images, the screen evidence and fidelity, the corrected header captures of §4.4 included, within the documented limits (§15) |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for products, filters, categories, custom fields and the store, run at the part's revision. What no spec exercises is NOT_RUN | PASS for what Spree's specs exercise: 172 examples in 10 files, no failures (§3.2). What no spec exercises is NOT_RUN (G-50) |
| 13 | Tenant isolation is NOT_RUN; a new isolation defect is reported to the owner privately | NOT_RUN (§3.3). None of the open findings ISO-1 to ISO-7 is about these screens. No new isolation defect was found; none was looked for beyond Spree's own specs |
| 14 | Each setting in §10.4 is saved through its dashboard screen and seen, or not, on the storefront, with the result per setting | PASS as a check, every setting saved and looked for (§6). The new market and the added language show only after the storefront is rebuilt (B3). Prices hidden and sign-in required FAIL for a signed-in customer (SD-9). The policy's content shows; the new policy opens, but the footer does not list it (B4). The custom fields show and hide as set |
| 15 | First-run setup with sample data runs on its own server; the provisioning check and the storefront captures show what the new store was given | PASS for the run and its evidence; FAIL for setup with sample data (§7, SD-8). The 28 provisioning checks are correct. The sample data stopped at its wholesale step for a store in Polish złoty: no orders, a draft price list, and a storefront with no products to show |
| 16 | Each address in §10.6 is checked on the running storefront, and Spree's slug specs pass | PASS: each address was opened and recorded, with Spree's behaviour for a renamed product (B2) (§8). Spree's store, category and product address specs: 213 examples, no failures, one pending |

## 1. What was built

**Stories, 74, for the 24 new components.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) names each one. Each has a reference image at 390 pixels (mobile) and 1280 pixels (desktop), in one theme, as in part 1.

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `dropdown-menu` (CMP-SF-P-09) | Closed, Checkbox items, Radio items |
| | `quantity-picker` (CMP-SF-P-17) | Small, Large, More than one, Disabled, Typed |
| `cart/` (CMP-SF-G-03) | QuantityPickerField | On the product page |
| `navigation/` (CMP-SF-G-07) | Breadcrumbs | Subcategory, Root category, Product page, Long names |
| `products/` (CMP-SF-G-10) | ProductListing | First page, Filters applied, Search results, No products for the filters, No match for a word, Without the filter bar, Loading |
| | ProductListingSkeleton | Default |
| | InfiniteProductList | End of the list, Loading more, More loaded, Loading more failed |
| | ProductGrid | With products, Empty |
| | ProductGridSkeleton | Default |
| | MediaGallery | Several pictures, A variant's picture, One picture, No picture |
| | MediaLightbox | First picture, Last picture, One picture |
| | VariantPicker | Colour and size chosen, Sold-out choice, Colour without a code, Nothing chosen |
| | ProductCustomFields | One of each kind |
| `products/filters/` (CMP-SF-G-10) | FilterBar, from `ProductFilters.tsx` | Default, Filters applied, Loading |
| | FilterBarSkeleton | Default |
| | FilterDropdown | Closed, Closed with a choice, Open |
| | OptionDropdownContent | Colours, Colours with choices, Sizes |
| | PriceDropdownContent | Ranges, A range chosen |
| | AvailabilityDropdownContent | Default, In stock chosen |
| | SortDropdownContent | Default order, Price low to high chosen |
| | FilterChips | One of each kind, One choice |
| | MobileFilterDrawer | Empty, With choices |
| Page level | CategoryBanner (CMP-SF-PG-03) | With picture and subcategories, Without picture, Subcategory, Root category |
| | ProductDetails (CMP-SF-PG-04) | Colour and size, Another colour chosen, Sale price, Sold-out choice, Quantity chosen, Adding to the cart, One picture with no options, No picture, Price withheld, Price withheld in wholesale |

**Already covered, reused by these screens:** part 1's product card, its skeleton and the hidden price prompt (CMP-SF-G-10), the pilot's button (CMP-SF-P-04), part 1's sheet (CMP-SF-P-20), which the filters drawer and the lightbox open in, and part 1's header, footer and menu around every page.

**Not given a story.** `ListingFilterBar` and `ListingAnalytics` (CMP-SF-G-10) are rendered only inside `ProductListing`, whose stories render both: the first holds the filter bar and the second sends analytics events and draws nothing. LIQ-009 records both as U1. `JsonLd` (CMP-SF-G-12) writes structured data for search engines and draws nothing; part 1 recorded the home page's, and part 2 records the category and product pages' from their source (§8). `ProductGrid` is used by no screen at `321fa1c`; its stories say so, and it is compared with the grid the infinite list draws with the same classes (§4.1).

**Fixtures and mocks.** An invented catalog for the shop: products with colour and size options, swatches with and without a colour code, a sale price, a sold-out size, custom fields of each kind, pictures for one colour, the filters' options and price ranges, categories with and without a picture, and three small product pictures, with a check that the fixtures match the SDK's types. The storefront's server actions mock now also answers adding to the cart, or leaves it unanswered, for the product page's stories. The application code is unchanged.

**Scripts beside the Storybook (`visual/fidelity/`).**
- `catalog-screens.spec.ts` captures each part 2 screen on the built storefront in each state, for each variant and set-up, and writes beside each image how the state was reached and what the browser observed that a picture cannot show. It registers a customer, so it writes to the backend's database: it is pointed only at a test server.
- `settings.spec.ts` saves the settings of §6 through the dashboard's own screens in a browser, captures each screen after saving, and puts each setting back. `settings-values.ts` holds the values it saves.
- `catalog.ts` holds the cases and the states' order; `shop-run.ts` holds what part 1's and part 2's capture runs share, which `shop-screens.spec.ts` now reads from there.
- `proxy.ts` can now also hold or fail the product list's next page and its filters.
- `compare.spec.ts` gains 33 cases.

## 2. The batch map, completed

The map from the [work item §10.1](../work-items/fb-19-batch-storefront-shop.md#101-capabilities-screens-flows-and-tests), with the evidence and result of each row. Capture paths are in the [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/README.md).

Coverage and functional verification are kept apart, as in part 1. **Coverage** is what exists: the mapped IDs, stories, captures and Spree's own specs. A capture shows one state of a screen, not that a flow works. **Functionally verified** is whether the capability's flow, or the behaviour named, was shown to work end to end at the part's revisions.

| Capability | Screens | Flow | Who may see it | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|
| CAP-05-14 Product search and filters: the results page, its filters and sorting | SF-SHOP-02 | FL-05, the browsing step | Anyone, unless the store requires sign-in | ProductListing and its skeleton, InfiniteProductList, ProductGrid and its skeleton, the filters, `dropdown-menu`; reused the product card and the sheet | 50 stories; 22 states captured; 22 cases compared; Spree's product and filter specs | PASS, with found behaviour B5 to B8 | PARTIAL: sorting by name passes the storefront's browser tests. No browser test searches or filters (G-46); the capture run searched, filtered, sorted and scrolled to the end on the running storefront, once each. A failed next page or filter request says nothing (SD-10) |
| CAP-05-04 Categories and collections: the shopper's category page | SF-SHOP-03 | FL-05, the browsing step | As above | CategoryBanner, Breadcrumbs, and the list's components | 8 stories; 8 states captured; 5 cases compared, and the list's; Spree's category specs | PASS, with found behaviour B1 and B9 | PARTIAL: listing a category's products with its count and breadcrumb, a subcategory narrowing the list, sorting and a product card opening its page pass the storefront's browser tests, locally. Not found answers 200 (B1) |
| CAP-05-01 Products, variants and options: the shopper's product page | SF-SHOP-04 | FL-05, choosing a product; FL-04's last step | As above | ProductDetails, MediaGallery, MediaLightbox, VariantPicker, ProductCustomFields, QuantityPickerField, `quantity-picker` | 32 stories; 19 states captured; 11 cases compared; Spree's product specs | PASS, with found behaviour B1, B10 and B12 | PARTIAL: the product's price, availability and details, picking a colour and a size, a sale price and a sold-out variant pass the storefront's browser tests, locally; adding the chosen quantity to the cart failed locally on the cart drawer's duplicate link name (B12) and passed in CI at `c198b60` |
| CAP-05-16 Search-friendly addresses for products, categories and stores | SF-SHOP-03, SF-SHOP-04 | None | Anyone | None of its own | 6 states captured; Spree's product address, category and store specs | PASS (§8) | PARTIAL: each address opened as recorded, once, with B2 for a renamed product. The store's own address name has no storefront screen and is checked by Spree's specs alone (G-51) |
| CAP-03-03 Store provisioning: setup with sample data (G-36) | DA-SETUP-01, then SF-SHOP-01 to SF-SHOP-04 and SF-OVL-01 | FL-01 | The installer | Batch 3's | 2 setup captures; 4 storefront states captured; batch 3's 28 provisioning checks | PASS for the evidence | FAIL: setup finishes, but the sample data stops at its wholesale step for a store in złoty (SD-8, §7). CAP-03-03 stays PARTIAL, now with a failing part |
| CAP-03-07, CAP-03-08, CAP-03-09, CAP-03-10, and CAP-09-04's store-wide storefront access, saved in the dashboard and seen on the storefront (G-38's storefront part) | DA-SET-02, DA-SET-06, DA-SET-09, DA-SET-11 and DA-PRD-03, then the storefront screens they change | None | Staff to save; anyone to see | Batch 3's and part 1's, and part 2's | 10 dashboard captures; 21 storefront states captured | PASS for the check (§6) | PARTIAL per setting: markets and languages show after a rebuild (B3); policy content shows, a new policy is not in the footer (B4); custom fields show as set; storefront access FAILS for signed-in customers (SD-9) |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-light-<width>.webp` in the evidence folder, with a JSON note that records the path, the variant, how the state was reached, and what the browser observed that a picture cannot show.

**Counts, from the capture notes.** 68 states captured, 148 images: 58 on the storefront, 9 in the dashboard and DA-SETUP-01's welcome. The storefront's 58 are the work item's 32 listed states, in 31 captures, and 27 more: SF-SHOP-01, SF-OVL-01, SF-OVL-04 and SF-SHOP-06 where a setting or first-run setup changed them, and on part 2's screens the storefront access settings, the markets made in the dashboard, first-run setup, the addresses of §8, wholesale on, a subcategory with no products, the next page failing and the cart drawer after adding. Ten states were captured for both a guest and a customer.

| Screen | States captured | How the state was reached, where it matters |
|---|---|---|
| SF-SHOP-02 Products and search | all products, the first page (guest and customer; and with wholesale on); loading; the colour, price and availability dropdowns open, at 1280; the sort dropdown open; filters applied, with their chips; the filters drawer empty and with two choices staged, at 390; no products for the filters; search results for "espresso" (guest and customer); no products matching "zebrawood"; loading more; loading more failed; the end of the list; the filter bar missing when its request fails; and, for §6 and §7, prices hidden and sign-in required (guest and customer), the new market (guest and customer), the added language and the first-run store | **Loading** and **loading more:** the proxy held the product list, or the next page after the first arrived, for 20 seconds; one visit shows each once, so the page was captured at 390 pixels and widened to 1280 without reloading. **Loading more failed** and **filters failed:** the proxy answered the next page, or the list's filters, with a server error. **Filters:** chosen as a shopper does, from the dropdowns from 768 pixels and from the drawer below; the dropdowns show only from 768 pixels and the drawer only below. **No products for the filters:** size S, which only the two-option product has in stock, with "Out of Stock"; once a filter is chosen the others offer only what the narrowed list holds, so a price range could not empty it (B6). The list says "39 products" and shows 12 at a time |
| SF-SHOP-03 Category | a category with its picture, description, subcategories and breadcrumb, Coffee Machines (guest and customer); a category without a picture, Kitchen; a subcategory, Kettles; a subcategory with no products; Kitchen filtered and sorted; not found; prices hidden and sign-in required (guest and customer) | **Picture and description:** the sample catalog's categories have neither, so Coffee Machines was given one of the sample catalog's own product pictures and a description through the Admin API. **Not found:** `/us/en/c/no-such-category`, answered with status 200 (B1) |
| SF-SHOP-04 Product | several pictures, the espresso machine's four (guest and customer; and with wholesale on); a picture enlarged, then the next; colour and size chosen, which also shows no picture; a sold-out choice; a sale price; a quantity of three; adding to the cart; the cart drawer after adding; custom fields saved (guest and customer); prices hidden and sign-in required (guest and customer); the second market, at `/de/de/products/kaffeevollautomat` (guest and customer), and the product's default-language address in that market; the new market; renamed, at its old and new address; not found; the first-run store | **The two-option product:** the storefront's browser tests' own product, made by `scripts/e2e/bootstrap-spree.sh`, with colours and sizes, a sale price on red in M and black in L sold out, and no pictures. **Adding to the cart:** the add request was left unanswered in the browser. **Added:** the cart drawer opened and listed the product; its own states are batch 9's. **Not found:** answered with status 200 (B1). Every product page's source held the Organization block only, because the captures' build had no site address (§8) |
| SF-SHOP-01, SF-OVL-01, SF-OVL-04, SF-SHOP-06 | the home page under prices hidden and sign-in required (guest and customer) and for the first-run store; the menu of the first-run store, at 390; the region dialog before and after the new market, and after the added language, at 1280; a policy's saved content; the new policy | §6 and §7 |
| DA-SET-02, DA-SET-06, DA-SET-09, DA-SET-11, DA-PRD-03 | each settings screen after saving, as the admin, at 1280 | Saved through the dashboard's own screens in a browser (§6) |
| DA-SETUP-01 | the welcome screen after setup with sample data, light and dark | Batch 3's first-run script, with sample data left chosen (§7) |

**The data behind the captures.** Lane A's own browser-test database, as part 1 left it: Spree's seeds, the browser tests' admin, Spree's sample catalog, a "Europe" market in euros with German, English and French, and two subcategories of Coffee Machines, one of them, Espresso Machines, with no products. Added for part 2: Coffee Machines' picture and description, through the Admin API, and the browser tests' two-option product, through the storefront's own bootstrap script. The settings of §6 were saved through the dashboard and each put back afterwards, except the Spain market, the two custom fields, the new policy and the renamed product, which stay in lane A's database only. The customer was registered by a capture run with an `example.com` address. Nothing about the data, the customer's password or the keys is committed.

**Set-ups.** `standard`, the storefront as built for production; `wholesale`, the same storefront built with `SPREE_WHOLESALE_CHANNEL=wholesale`; `proxied`, the standard storefront reaching the backend through `proxy.ts`; and a storefront built against the first-run store, with that store's publishable key. Each state names its set-up in its note.

### 2.2 FL-05's browsing and product steps

The browser tests are the storefront's own, in `e2e/`, unchanged.

**Locally.** The eleven tests of `catalog.spec.ts` and `product.spec.ts` ran against lane A's server at `1cab30d`, with Spree's sample catalog and the browser tests' two-option product, in the pinned Playwright 1.60.0 image ([storefront-browser-tests.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/flows/storefront-browser-tests.json)). Ten passed. "Adds the chosen quantity to the cart" failed in its last step: the cart drawer, reading "Cart (2 items)", holds two links named "Automatic Espresso Machine", the item's picture and its name, so the test's strict lookup found two (B12, part 1's B9).

**In CI.** On storefront #21 at `c198b60`, the end-to-end job ran all 21 browser tests against Spree's published image, and all passed in 2.5 minutes (§12). "Adds the chosen quantity to the cart" passed there unchanged, as part 1's cart test did in CI (B12).

| Step | Covered by | Result locally | Gap |
|---|---|---|---|
| SF-SHOP-02: sort the list | `catalog.spec.ts`: "sorts products by name" | Passed | |
| SF-SHOP-02: search, filter and scroll | None. Captured: every listed state; Spree's product and filter specs | | **G-46:** no browser test |
| SF-SHOP-03: open a category, narrow it, open a product | "lists the category's products with a count and breadcrumb", "a subcategory narrows the listing", "a product card opens its product page" | Passed | |
| SF-SHOP-04: read the product, pick its options, add it | `product.spec.ts`: "shows the product's price, availability and details", "picking a color and a size adds that combination to the cart", "a discounted variant shows its sale price, and the cart charges it", "a sold-out variant can be picked but not added to the cart", "adds the chosen quantity to the cart" | Four passed; the last failed (B12) | **G-49** |
| SF-SHOP-01 and SF-OVL-01, part 1's steps, run again | "shows featured products that open their product page", "the header menu opens a category" | Passed | |
| The cart and checkout, the rest of FL-05 | Batch 9 | | |

**The storefront's unit tests,** run locally at `c198b60`, whose `src/` is `321fa1c`'s: the whole suite, 260 tests in 35 files, passed, among them `ProductDetails.test.tsx` (2), `ProductCard.test.tsx` (9), `quantity-picker.test.tsx` (9) and the fixture check (12) ([storefront-unit-tests.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/flows/storefront-unit-tests.json)). `components/products/__tests__/` holds only the product card's tests: the list, the filters, the gallery and the variant picker have none.

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each visitor

From the running-screen captures. This shows only what the storefront displays; a page that hides something does not stop a request.

| Variant | What the storefront does | Evidence |
|---|---|---|
| Guest and signed-in customer, the store public | The same lists, category and product pages for both | SF-SHOP-02 "all products" and "search results", SF-SHOP-03 "category with picture", SF-SHOP-04 "several pictures", "custom fields saved" and "second market", for both |
| Wholesale off and on | The same lists and product page; wholesale adds only the links around them, as part 1 recorded | SF-SHOP-02 "all products", SF-SHOP-04 "several pictures", with wholesale on |
| The United States, in English and dollars | The default market | Every capture but those below |
| Germany, in German and euros | The product at its German address, "Kaffeevollautomat", at 819,99 €; its English address also opens | SF-SHOP-04 "second market" and "second market default address" |
| Spain, a market made in the dashboard, in euros, then with Spanish added | The list and product page in euros, then the list in Spanish, "37 productos" | SF-SHOP-02 "new market" and "language added", SF-SHOP-04 "new market" |
| Prices hidden | The home page, the lists and the category show no prices, nor any Add to Cart, for a guest **and for a customer**. The product page shows no price and still offers Add to Cart, to both. No prompt to sign in shows, and the Price filter is gone | SF-SHOP-01 to SF-SHOP-04 "prices hidden", for both (SD-9) |
| Sign-in required | The home page and the lists show "Something went wrong"; the category and product pages show a bare "404"; all answered with status 200, for a guest **and for a customer** | SF-SHOP-01 to SF-SHOP-04 "sign-in required", for both (SD-9) |

### 3.2 What the server refuses

**Spree's own specs, at `1cab30d`.** Run in this session on SQLite with Spree's test app: the API engine's Store API controller, serializer and integration specs for every endpoint part 2's screens read. 172 examples in 10 files, no failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/backend/api-specs.json). Part 1 ran the cart's specs, which the product page's Add to Cart calls; they are not run again.

| Endpoint or rule | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Products and their filters | `products_controller_spec.rb` (52), `products_spec.rb` (12), `products/filters_controller_spec.rb` (17), `product_serializer_spec.rb` (11) | As part 1 recorded: a missing or invalid key answers 401; another store's product, a draft and a slug in another language answer 404; a product outside the buyer's catalogs answers 404; a channel that hides prices from guests leaves the price range out for a guest. The serializer leaves out admin-only attributes and includes only public custom fields, and only when asked |
| Categories | `categories_controller_spec.rb` (32), `categories_spec.rb` (7) | As part 1 recorded |
| Storefront access | `storefront_gating_spec.rb` (13) | Where prices are hidden, a guest gets no price and **an authenticated customer gets one**; where sign-in is required, a guest gets 401 for products and orders and **an authenticated customer is let through**, while countries stay open. A guest cart is refused checkout where guest checkout is off or prices are hidden |
| Custom fields | `custom_field_serializer_spec.rb` (9) | The Store API's custom field carries its label, key, value and kind, never a Ruby class; the Admin API's says whether it shows on the storefront |
| Markets and policies | `markets_controller_spec.rb` (10), `policies_controller_spec.rb` (9) | As part 1 recorded: an unknown market or policy answers 404; other stores' policies and a seller's are not listed |

**What Spree's specs say against what the storefront shows.** The storefront access specs show Spree giving an authenticated customer prices, and letting one through where sign-in is required. The storefront shows a customer neither (§3.1). The storefront's product requests send the customer's token only on its wholesale pages (`src/lib/data/products.ts`), so Spree sees every shopper on the main storefront as a guest. That is SD-9, a storefront defect, not a server refusal.

**What no Spree spec exercises, NOT_RUN as a spec result.** None sends these requests through the storefront's own server code, and part 2 adds no refusal check (G-50).

**Observations of the running system, not specs.** No capture made a request as the wrong customer.

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. None of the open findings [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings) is about these screens. Spree's specs above that touch store boundaries (another store's products, categories and policies are not listed or not found) are Spree's own unit checks, not FB-03's validation, and the part claims nothing about isolation from them. The first-run store was made on its own server and database, not beside lane A's store. No new isolation defect was found; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, at 390 and 1280 pixels, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/README.md). The results below are the final run of each case, at `c198b60` against the storefront at `321fa1c`: 53 comparisons on the standard set-up and 8 through the proxy, all passed. On 2026-10-27, at the owner's request, every case ran again with the script corrected at `4ee76ba`, against the same storefront: 14 comparisons had the storefront's sticky header drawn over the part, and their images and notes are now from that run (§4.4).

Every case shows one difference on every element, the font list, which is the pilot's explained difference D6, as part 1 recorded. The tables list the other differences. Text, counts, colours and pictures differ on purpose, because the stories show invented data. Part 2 adds no token; the coverage report counts all 134 of the storefront's tokens shown, and part 1's token comparison stands.

### 4.1 Part 2's cases

| ID | Case | Story | Running screen | Other styles that differ | Explained |
|---|---|---|---|---|---|
| CMP-SF-G-07 | breadcrumbs-subcategory | Breadcrumbs: Subcategory | Kettles | None | |
| CMP-SF-G-07 | breadcrumbs-product-page | Breadcrumbs: Product page | The espresso machine's page | height at 390 | The screen's product name is longer and wraps onto three lines at 390 pixels |
| CMP-SF-PG-03 | category-banner-with-picture | Category banner: With picture and subcategories | Coffee Machines' banner | height at 390 | The screen's description is longer and wraps |
| CMP-SF-PG-03 | category-subcategory-links | The same story | Coffee Machines' subcategory links | None | |
| CMP-SF-PG-03 | category-banner-without-picture | Category banner: Without picture | Kitchen's banner | None | |
| CMP-SF-G-10 | filter-bar | Product filters: Default | The products page's filter bar | None | |
| CMP-SF-G-10 | filter-bar-filters-applied | Product filters: Filters applied | The filter bar with a colour, a price range and In Stock | None | The screen shows no Size button once a filter is chosen (B6) |
| CMP-SF-G-10 | filter-chips | Filter chips: One of each kind | The same page's chips | None | |
| CMP-SF-G-10 | option-dropdown-colours | Option dropdown content: Colours | The colour dropdown, open, at 1280 | height; background colour of the swatches | The sample catalog offers 23 colours, which scroll, against the story's six; its colours have no codes, so their swatches are grey (B10) |
| CMP-SF-G-10 | price-dropdown-ranges | Price dropdown content: Ranges | The price dropdown, open, at 1280 | height | The screen offers four ranges, the story three |
| CMP-SF-G-10 | availability-dropdown | Availability dropdown content: Default | The availability dropdown, open, at 1280 | None | |
| CMP-SF-G-10 | sort-dropdown | Sort dropdown content: Default order | The sort dropdown, open | None | |
| CMP-SF-G-10 | mobile-filter-drawer-empty | Mobile filter drawer: Empty | The filters drawer, at 390 | border colour of the close button; heights; background colour of the swatches | The story's drawer opens as from the keyboard, so its close button shows its focus ring (the pilot's D7); the screen's colour list is longer; swatches as above |
| CMP-SF-G-10 | mobile-filter-drawer-with-choices | Mobile filter drawer: With choices | The drawer with two choices staged, at 390 | As above; one element in the story only | As above; the story stages a size the screen's narrowed list no longer offers |
| CMP-SF-G-10 | product-listing-first-page | Product listing: First page | Kitchen's first page | heights; elements on one side only | The story's products include a sale, a missing picture and a sold-out product, whose badge, crossed-out price, placeholder and "out of stock" line appear in the story only; the screen's longer names wrap. The page's wrapper has different padding on each side, because the screen's page sits under the category banner. Captured again without the header over the filter bar (§4.4) |
| CMP-SF-G-10 | product-listing-no-match-for-a-word | Product listing: No match for a word | A search for "zebrawood" | height at 390 | The message names the word, which wraps at 390 |
| CMP-SF-G-10 | product-listing-no-products-for-the-filters | Product listing: No products for the filters | Size S with Out of Stock | None | |
| CMP-SF-G-10 | product-grid | Product grid: With products | The products page's grid, drawn by the infinite list | heights; elements in the story only | No screen uses ProductGrid; the infinite list draws its grid with the same classes. The story's products include the sale, missing picture and sold-out states; the screen's cards are 389 pixels wide at 1280 against the story's 400, because the page's container is narrower than the story's frame, and their pictures are square. Captured again without the header over the first row (§4.4) |
| CMP-SF-G-10 | infinite-product-list-end | Infinite product list: End of the list | All products, scrolled to the end | None | |
| CMP-SF-PG-04 | product-details-colour-and-size | Product details: Colour and size | The two-option product, red in S | heights; the colour, font size and line height of two icon parts; background colour of the swatches; elements on one side only | The two-option product has no pictures and no properties, so the screen shows the gallery's placeholder where the story shows pictures and thumbnails, and no custom fields. The script matched the placeholder's icon parts with the story's stock indicator icon. The screen's red has the code #cc0000 and its black none, so one swatch is red and the other grey; the story's are sand and sage. Captured again without the header over the page (§4.4) |
| CMP-SF-PG-04 | product-details-sale-price | Product details: Sale price | Red in M, on sale | As above | As above, captured again (§4.4) |
| CMP-SF-PG-04 | product-details-sold-out-choice | Product details: Sold-out choice | Black in L, sold out | As above | As above, captured again (§4.4) |
| CMP-SF-PG-04 | product-details-quantity-chosen | Product details: Quantity chosen | Black in S, quantity three | As above | As above, captured again (§4.4) |
| CMP-SF-G-10 | media-gallery-several-pictures | Media gallery: Several pictures | The espresso machine's four pictures | height at 1280 | The main picture is square and takes its column's width: 584 pixels on the screen, 576 in the story's frame |
| CMP-SF-G-10 | media-lightbox-first-picture | Media lightbox: First picture | The espresso machine's first picture, enlarged | None | |
| CMP-SF-G-10 | variant-picker-colour-and-size-chosen | Variant picker: Colour and size chosen | Red in S | background colour of the swatches | As for the product details |
| CMP-SF-G-10 | variant-picker-sold-out-choice | Variant picker: Sold-out choice | Black in L | As above; one element in the story only | As above; the story offers one more size |
| CMP-SF-G-10 | product-custom-fields | Product custom fields: One of each kind | The espresso machine's properties | heights; elements in the story only | The story shows one field of each kind, formatted text among them, whose bold and plain spans appear in the story only; the sample product has two plain fields |
| CMP-SF-G-03 | quantity-picker-field | Quantity picker field: On the product page | The two-option product's quantity field | None | After the story was corrected (§4.2) |
| CMP-SF-G-10 | product-grid-skeleton | Product grid skeleton: Default | All products, the list held (proxied) | opacity; height at 1280 | The placeholders pulse, and each side was caught at a different point; the heights follow the width, as for the product grid. Captured again without the header over the first row (§4.4) |
| CMP-SF-G-10 | filter-bar-skeleton | Filter bar skeleton: Default | Kitchen, the list held (proxied) | opacity | As above |
| CMP-SF-G-10 | infinite-product-list-loading-more | Infinite product list: Loading more | All products, the next page held (proxied) | None | |
| CMP-SF-G-10 | infinite-product-list-loading-more-failed | Infinite product list: Loading more failed | All products, the next page failed (proxied) | None | The story shows what the storefront shows: nothing (SD-10) |

### 4.2 Corrections to the stories

Two stories were corrected during the part, each in the story, never in the component:
- **Quantity picker field: On the product page.** The first comparison found the story's picker 46 pixels tall and the page's 52: on the page, the Add to Cart button beside it sets its height. The story now gives it that height, and its reference images were regenerated (storefront `9962169`). The case then showed no difference.
- **The filter bar's stories.** They were titled "Filter bar", but the component lives in `ProductFilters.tsx`, and LIQ-010 §10's rule names a story by its file, so the coverage report did not count the file. They are now "Product filters", and their reference image folders and the comparison's story IDs were renamed with them (storefront `53ac03d`). The two filter bar cases ran again with no difference, and their evidence is from that run.

The full visual check then ran twice in the pinned image, 490 of 490 each time.

### 4.3 Components compared within another

Nine stories are compared as part of a larger component that holds them: the dropdown menu's three stories within the filter bar, the colour dropdown and the sort dropdown; the quantity picker's large and more-than-one stories within the quantity field and the product page with a quantity chosen; the filter dropdown's three stories within the filter bar cases and the colour dropdown; and the product listing skeleton within the two loading cases, which show its two parts.

### 4.4 The header over the part, corrected on 2026-10-27

**What was wrong.** The storefront's header is sticky: it stays at the top of the window while the page scrolls. To capture a part of a page, the script scrolled the part into view and took its picture, so the header was drawn over the part wherever the window's top fell. In 14 of part 2's comparisons it covered a band 64 pixels tall on the running screen's side: on the four product pages, the top of the picture area and half the product's name at 1280 pixels and the bottom of the picture area at 390; on the product grid and its skeleton, the top of the first row; and on Kitchen's first page, the filter bar. The owner found it in the product pages and the grid skeleton, at both widths, and asked for the capture to be corrected and the evidence regenerated without changing the storefront.

**The correction.** The script now hides every sticky element outside the part while it takes the picture, through the browser's capture option, which leaves the page itself as it was, and records each element it hid in the comparison's notes (`hiddenWhileCaptured`), with whether it lay over the part. It is storefront `4ee76ba`, which changes the script only. Parts captured from the top of the page, the way part 1 captured the footer and the featured products, and whole-window captures, are taken as before.

**The result.** All 61 comparisons ran again on the same servers and data, 53 on the standard set-up and 8 through the proxy, and all passed. The notes show the header over the part in those 14 comparisons and in no other. For the 14, the running screen's side now shows the whole part. Their stories are unchanged, and so are the computed styles on both sides: the same elements and properties differ as before, and only the skeleton's animated opacity values move between runs, so the explanations in §4.1 stand. Their images and notes in the evidence are from this run. Of the other 47, 43 are pixel for pixel the same as before on both sides; in the other four, the two skeletons' pulse and the "loading more" spinner were caught at another moment, on the story's side too. Their committed images are unchanged.

**Earlier batches.** Part 1's 53 comparisons ran again the same way, on the standard, proxied and wholesale set-ups. Only the hero section at 390 pixels had the header over it, across its top 64 pixels; the pilot's comparison of the same case shows the same. Part 1 is merged and its acceptance is pending, so its committed comparison is left as it was recorded; the corrected one is in this part's evidence for the owner's review. The shopper accounts batch's comparisons need a signed-in test customer with orders, which this lane does not have; its committed images show the header over the part in five: the account menu at 390 pixels, and the gift card list and a shipped order's page at both widths. They are recorded here and not corrected (§13), and tracked for follow-up as G-52 (§15). The [header check](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/header-check.md) lists every comparison with its result.

## 5. The storefront's behaviour found, recorded and not changed

Each is how the storefront and Spree work at `321fa1c` and `1cab30d`. Part 2 reproduces it and changes nothing. The defects found are in §9.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | An unknown category or product shows the bare "404" page, answered with status 200, as part 1's B4 found for a policy | SF-SHOP-03 and SF-SHOP-04 "not found" |
| B2 | A product renamed in the dashboard keeps its address: Spree left the slug "pedestal-fan" when the name became "Standing Fan 40cm". Once the slug was changed by hand, the new address opened and the old one answered not found, with status 200 and no redirect. Spree's documentation says the Store API answers a retired slug with not found and leaves redirects to the storefront, which has none | DA-PRD-03 "renamed with new address", SF-SHOP-04 "renamed" at both addresses |
| B3 | A market or language added in the dashboard reaches the storefront only after it is rebuilt. The storefront keeps the market list in a data cache on disk for about 15 minutes, so a rebuild within that time still offers the old list; after a restart without a rebuild, the region dialog leaves the new market out while its own pages open | SF-OVL-04 "new market before rebuild", "new market offered" and "language added", with their notes |
| B4 | The footer's policy links are a fixed list, so a policy created in the dashboard opens at its address but is not listed | SF-SHOP-06 "new policy"; the storefront's `Footer.tsx` |
| B5 | The filter bar's loading state is never shown: the list passes `filtersLoading={false}`, so the bar waits with the list's skeleton and then appears whole | The storefront's `ListingFilterBar.tsx`; Product filters: Loading, checked against its source |
| B6 | Once a filter is chosen, the other filters offer only what the narrowed list holds: the Size button disappears when no product left has a size, and a price range cannot empty the list | SF-SHOP-02 "filters applied" and "no products for filters", with their notes |
| B7 | Phones show no product count: it sits in a bar shown from 768 pixels | SF-SHOP-02 at 390, against 1280 |
| B8 | On a phone, jumping to the foot of a long list does not load more: the next page loads when the list's end comes within 200 pixels of the screen, which a jump past the footer does not trigger. Scrolling does | SF-SHOP-02 "end of list", reached by scrolling; the storefront's `InfiniteProductList.tsx` |
| B9 | The category banner's dark text sits over its picture with no shade behind it, so how readable it is depends on the picture | SF-SHOP-03 "category with picture" |
| B10 | The sample catalog's colours have no colour codes, so every swatch is grey; the browser tests' product's red has one and shows red | SF-SHOP-02 "colour dropdown open", SF-SHOP-04 "several pictures" and "colour and size chosen" |
| B11 | The structured data for search engines needs the storefront's site address. Without one, as in lane A's builds, a production build writes only the Organization block; with one, product pages add Product and BreadcrumbList blocks and category pages a BreadcrumbList. The structured breadcrumb leaves out the top-level category, which the visible one shows | §8, [structured-data.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/flows/structured-data.json) |
| B12 | The product test "adds the chosen quantity to the cart" fails with Spree's sample catalog on the cart drawer's two links with the product's name, part 1's B9 | §2.2 |

B9 concerns accessibility, which FB-15 owns. B1, B2 and B11 concern how the storefront answers search engines. Whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own features.

## 6. Settings saved in the dashboard, seen on the storefront (G-38's storefront part)

Each setting was saved through the dashboard's own screen in a browser, the screen batch 3 captured, against lane A's server, and the screen captured after saving. The storefront was then restarted, or rebuilt where §5 says so, and captured where the setting should show. Every setting the storefront access depends on was put back to public afterwards.

| Setting | Saved on | Seen on the storefront | Result |
|---|---|---|---|
| A new market, Spain, in euros, with English | DA-SET-11 "saved new market" | Its pages open at `/es/en` in euros, listing 37 products, as soon as the storefront restarts. The region dialog offers it only after a rebuild made once the storefront's 15-minute cache had expired | Seen, after a rebuild (B3) |
| Spanish added to Spain's languages | DA-SET-11 "saved language added" | After a rebuild with the cache cleared, the dialog offers English and Spanish for Spain, and the list opens at `/es/es` in Spanish, "37 productos" | Seen, after a rebuild (B3) |
| Storefront access: prices hidden | DA-SET-02 "saved prices hidden" | No prices on the home page, the lists or the category, and no Add to Cart there; the product page shows no price but offers Add to Cart. The same for a guest and a signed-in customer | FAIL for the customer, who should see prices (SD-9) |
| Storefront access: sign-in required | DA-SET-02 "saved sign-in required" | "Something went wrong" on the home page and the lists, a bare "404" on the category and product pages, all at status 200. The same for a guest and a signed-in customer | FAIL for the customer, who should be let in (SD-9). A guest is kept out, but told nothing about signing in |
| Storefront access put back to public | DA-SET-02 "saved public" | Every later capture | Seen |
| The privacy policy's content | DA-SET-06 "saved content and new policy" | The policy page shows it | Seen |
| A new policy, "Gift Card Terms" | The same screen | It opens at `/us/en/policies/gift-card-terms`; the footer still lists only its four fixed policies | Seen at its address; not listed (B4) |
| Two product custom fields, "Origin" shown on the storefront and "Supplier code" not, given values on the two-option product | DA-SET-09, then DA-PRD-03 "custom field values saved" | The product page shows "Origin: Made in Portugal" under its properties, and neither "Supplier code" nor its value | Seen, as set |

The rest of G-38, payment capture, order numbers, reasons, channels' routing and inventory, stays with batches 6, 7 and 8 and P4. G-38 stays PENDING and closes only on the owner's acceptance.

## 7. First-run setup with sample data (G-36)

**The run.** Batch 3's first-run setup check (`packages/liquorify-storybook/fidelity/setup.spec.ts`) ran on a second browser-test server with its own empty database and no admin, with "Load sample data" left chosen, which batch 3 had unchecked. The check now waits for the sample data's job: until its orders, which load last, exist and the counts hold still, or until the counts stop changing for two minutes without them. It records what loaded and the imports' failed rows either way, lists apart the records the sample data adds beside what setup provisions, and fails if no orders loaded ([backend `389da412`](../../packages/liquorify-storybook/fidelity/setup.spec.ts)). Setup was answered as a merchant in Poland would: the store "Fidelity First Run", Poland, Polish złoty, English.

**What it gave the store** ([first-run-sample-data.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/provisioning/first-run-sample-data.json)).
- **Setup itself:** the welcome screen showed, and all 28 of batch 3's provisioning checks are correct for the store in złoty. Beside them the sample data added two delivery methods, two package types, a point of sale channel, two payment methods and six product types, which the check lists apart.
- **The sample data:** 38 products, their translations and 20 customers imported. Then the wholesale step's price list import failed every one of its 24 rows with "This store does not sell in USD.", and the step stopped the job (`spree/core/db/sample_data/wholesale.rb`, which raises on a failed row). Nothing after it loaded: no sample orders, and the wholesale price list stayed a draft. The check failed on "sample orders loaded", with 0. Seen in three runs.
- **The storefront**, built against the new store with its publishable key, at `/pl/en`: the home page with no featured products, the products page with "No products found", the menu with no categories, and the espresso machine's page a bare "404". The sample products are priced in US dollars and euros only, so none has a price in złoty and Spree lists none.

**Result.** FAIL for setup with sample data, for a store that does not sell in US dollars (SD-8). The welcome screen says the store is ready while its sample data stopped part-way, and nothing tells the merchant. Whether a store in US dollars loads it all was not run in part 2: batch 3 chose a non-default country on purpose, and part 2 kept it. CAP-03-03 stays PARTIAL, now with a failing part; G-36 stays as the owner deferred it, and this record proposes what would close it (§11).

## 8. Search-friendly addresses (CAP-05-16)

**On the running storefront** (SF-SHOP-03 and SF-SHOP-04 captures):
- **A product at its address:** `/us/en/products/automatic-espresso-machine` opens.
- **In the second language:** `/de/de/products/kaffeevollautomat`, its German address, opens in German and euros. Its English address in that market, `/de/de/products/automatic-espresso-machine`, opens the same page.
- **A subcategory's address holds its parent's:** `/us/en/c/kitchen/kettles`, and `/us/en/c/kitchen/coffee-machines/espresso-machines` two levels down.
- **A renamed product:** the slug does not change with the name. Once changed by hand, the new address opens and the old one answers not found, with no redirect (B2).
- **The store's own address name** (`code`) has no storefront screen. Spree's store specs show the first store named "default", a new store's code derived from its name and made unique, and a set code kept (G-51).

**Spree's specs, at `1cab30d`,** run in this session on SQLite with Spree's core test app: `store_spec.rb` (121), `category_spec.rb` (60, with the 8 shared metadata examples it includes) and `product/slugs_spec.rb` (24). 213 examples, no failures; one metadata example is pending on SQLite, as Spree marks it ([core-specs.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/backend/core-specs.json)). The slug specs cover slugs made from names and translations, unique per language, the history that lets an old slug be reused, and the renaming of a deleted product's slug.

**Structured data** ([structured-data.json](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/flows/structured-data.json)). The captures' storefront was built without a site address, so their product pages' source held only the Organization block. A second production build with its site address set wrote, on the product page, Organization, Product with its offer, and BreadcrumbList "Home, Coffee Machines, Automatic Espresso Machine"; on Coffee Machines, BreadcrumbList "Home, Coffee Machines", where the visible breadcrumb reads "Home, Kitchen, Coffee Machines"; and on the home page, Organization only (B11).

## 9. Defects found

Proposed for [LIQ-004's existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) as SD-8 to SD-10, after batch 3's SD-6 and SD-7. Each is kept as it is.

| # | Defect | Where | Severity | How often |
|---|---|---|---|---|
| SD-8 | First-run setup's sample data stops at its wholesale step for a store that does not sell in US dollars: the wholesale price list's 24 rows are all in dollars and all fail, and the step raises, so the sample orders and the rest never load and the price list stays a draft. The welcome screen still says the store is ready. The sample products have no price in the store's currency, so its storefront lists none | Spree `1cab30d`: `spree/core/db/sample_data/wholesale.rb` and `price_list_prices.csv`, loaded by `Spree::SampleData::LoadJob` after setup. Seen on DA-SETUP-01 and the first-run store's storefront | Medium: setup completes, but the store is told it is ready with its sample data missing, and its storefront shows no products | Every first-run setup with sample data for a store whose currency is not the US dollar; seen three times in złoty |
| SD-9 | The storefront's access settings treat every shopper as a guest: under "prices hidden" a signed-in customer sees no prices, and under "sign-in required" a signed-in customer gets "Something went wrong" or a bare 404. Spree gives an authenticated customer prices and lets one through, as its specs show. The storefront sends the customer's token with product requests only on its wholesale pages | Storefront `321fa1c`: `src/lib/data/products.ts`; seen on SF-SHOP-01 to SF-SHOP-04. Spree `1cab30d`: `storefront_gating_spec.rb` | High: a signed-in customer cannot see prices or shop when the store uses either setting | Every signed-in customer, whenever the store's storefront access is not public |
| SD-10 | A failed request on the product list says nothing: when the next page fails, the list stops with no message and nothing to retry; when the list's filters fail, the whole filter bar and its sorting disappear, so a filter already in the address cannot be seen or cleared | Storefront `321fa1c`: `InfiniteProductList.tsx` and `ListingFilterBar.tsx`; seen on SF-SHOP-02 "loading more failed" and "filters failed", through the proxy | Medium: the shopper is not told the list is incomplete. The same kind of defect as SD-6, on the storefront | Whenever either request fails |

Under prices hidden the product page also offers Add to Cart with no price, and no prompt to sign in shows anywhere: the storefront's prompt renders only inside the wholesale portal. That is recorded with SD-9.

## 10. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-storefront-shop.md) §12 without changing the proposal's text:
- **The filter bar's stories** are titled "Product filters", after `ProductFilters.tsx`, which holds `FilterBar`; the work item's §10.7 calls the component FilterBar.
- **`ListingFilterBar` and `ListingAnalytics`** are rendered only inside `ProductListing` and covered by its stories (U1), rather than named as drawing nothing; `ListingAnalytics` draws nothing.
- **`JsonLd`'s structured data** needs the site address at build time; lane A's builds have none, so it was recorded from a second build (§8).
- **`ProductGrid`** is compared with the grid the infinite list draws, since no screen uses it.
- **"No picture"** is shown by the two-option product, which has no pictures, so its captures serve both states.
- **Data.** Coffee Machines' picture and description were added through the Admin API, and the browser tests' two-option product through the storefront's own bootstrap script, for the sale, sold-out and colour-and-size states. The Spain market, two custom fields, a policy and a renamed product were saved through the dashboard, as §10.4 says.
- **Widths.** The filter dropdowns show only from 768 pixels and the filters drawer only below, so those states have one width each.
- **The second market's address.** The product opens at its German address and also at its English one in that market.
- **More states** than the work item lists: the next page failing, a subcategory with no products, the cart drawer after adding, and the storefront access settings on the home page.

## 11. Gaps

Each names what is missing, the check made instead and what would close it. They are proposed in [LIQ-004's register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance) as G-46 to G-51, after part 1's G-41 to G-45. The owner answered them on 2026-10-27, before part 2's merge and before its fidelity acceptance of 2026-10-29 (§15), and the register records each answer. G-52, for five of the shopper accounts batch's comparisons that the header covers (§4.4), was added on 2026-10-29 at the owner's instruction. SD-8 to SD-10, and SD-11, recorded in #27 and merged on 2026-10-29, stay open, tenant isolation stays NOT_RUN, and part 1's acceptance is separate and pending.

| Gap | Check made instead | What would close it | The owner's answer, 2026-10-27 unless dated |
|---|---|---|---|
| G-46: no browser test searches, filters, scrolls for more, opens a picture enlarged or checks a setting from the dashboard on the storefront | Captures of every listed state; the settings captured on both sides (§6); Spree's specs | A browser test for each, before Liquorify first changes these screens, as G-41 | Deferral accepted until before Liquorify changes these behaviours. Access regression tests are added with SD-9's fix |
| G-47: 33 of the 74 stories not compared by the script | 17 show a state seen in a running-screen capture; 16 checked against their source only. Each is named in the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) | As G-01: later batches compare each state when one of their running screens shows it; the wholesale batch (12) for a withheld price in the portal | Deferral accepted. Each story keeps the comparison status the [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) gives it, and its follow-up batch: the cart batch (9) for S4, S7, S8 and S70, the wholesale batch (12) for S74, and for the rest the later batch whose running screen first shows the state, as G-01 |
| G-48: 5 states reached by holding or failing a request: SF-SHOP-02 "loading", "loading more", "loading more failed" and "filters failed" through the proxy, and SF-SHOP-04 "adding to the cart" in the browser | Each note says how the state was reached and claims nothing about the server | Accept as simulated interface-state coverage, as G-20, G-21, G-27 and G-43 | Accepted as simulated interface-state coverage only |
| G-49: the product test "adds the chosen quantity to the cart" fails against Spree's sample catalog (B12) | The same test passed in CI at `da06743` and at `c198b60` against Spree's published image | Join G-44, for the cart batch (9) | Linked to G-44; open for batch 9 |
| G-50: requests no Spree spec sends for part 2's endpoints, and the storefront's own server code for them (§3.2) | Spree's specs; no capture made a request as the wrong customer | Join G-11 | Linked to G-11 as additional outstanding scope; open. P7 did not test these requests, so its PASS cannot close them |
| G-51: the store's own address name (`code`) has no storefront screen | Spree's store specs (§8) | Accept as checked by Spree's specs | Accepted: the scoped evidence of Spree's store specs, with no storefront screen for the store's address name recorded |
| G-52: five of the shopper accounts batch's committed comparisons have the storefront's header over the part: the account menu at 390 pixels, and the gift card list and a shipped order's page at both widths (§4.4) | Each was looked at in its committed images and listed in the [header check](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/header-check.md#shopper-accounts-batch); the four of its cases that need no customer were run again and had nothing over the part | Capture the five again with the corrected script and a signed-in test customer with orders, and replace their committed comparisons after the owner's review | 2026-10-29: tracked for follow-up; open |
| G-36: setup with sample data | §7: run, and FAILS for a store in złoty (SD-8) | The owner's answer on SD-8. G-36 stays as the owner deferred it | Kept open: SD-8 must be resolved, and setup with sample data verified in US dollars and in another currency, before it closes |
| G-38's storefront part | §6: each setting checked; SD-9, B3 and B4 found | The rest of G-38 stays with batches 6, 7 and 8 and P4 | The storefront evidence is accepted, its failing access result (SD-9) included; the gap stays open |
| G-02 | Part 2 takes none of it: its 35 pilot stories are not part 2's components | Part 1 and batch 9, as G-02's row says | Not asked; unchanged |
| Tenant isolation | None | FB-03's validation and the fixes for ISO-1 to ISO-7 | NOT_RUN, as the owner asked |

## 12. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Storybook 40383743285](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40383743285) | `c198b60`, every story, image and script of part 2 | Built, token check and coverage passed, and all 490 comparisons passed in 4.8 minutes under the explicit tolerance: part 2's 148 images, and the 342 of the pilot, the accounts batch and part 1 |
| [Storybook 40384713221](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40384713221) | `c198b60`, started by hand | All 490 comparisons passed again, in 4.3 minutes |
| [CI 40383743341](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40383743341) | `c198b60` | Lint, Type Check and Unit Tests (260) passed. "E2E (Playwright + Spree)" booted Spree's published image and ran all 21 browser tests: 21 passed in 2.5 minutes |
| [Storybook 40512964808](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40512964808) | `4ee76ba`, the header correction, which changes the comparison script only | Built, token check and coverage passed, and the visual check passed |
| [CI 40512964632](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/40512964632) | `4ee76ba` | Lint, Type Check, Unit Tests and "E2E (Playwright + Spree)" passed |

#26 changes records and one check script that runs only by hand; the backend's checks on it are shown on that pull request.

**Local checks, in this session.**
- At `c198b60`, in the pinned Playwright 1.60.0 image: the storefront's full visual check, the coverage report and the token check, twice, after the last story change: 490 of 490 comparisons passed each time, part 2's 148 images and the 342 of the pilot, the accounts batch and part 1. The reference images were written by the same check.
- Lint and format (Biome), the type check and the unit tests (260) passed.
- The capture runs reached every listed state: 148 images, with 61 comparisons, all passed.
- Spree's API specs passed, 172 examples, and its core specs, 213 with one pending.
- The eleven browser tests: 10 passed and 1 failed (§2.2).
- First-run setup with sample data: setup and its welcome passed; the check of what the store was given failed on "sample orders loaded", as SD-8 explains.
- On 2026-10-27, at `4ee76ba`: lint (Biome) and the type check passed on the corrected script, and the comparison ran again in the pinned image, part 2's 61 comparisons and part 1's 53, all passed (§4.4). Of the shopper accounts batch's 38 comparisons, the 8 that need no customer ran and passed; the other 30 need its test customer and were not run.

**The coverage report** at `c198b60` counts 16 of the storefront's 22 primitives, 52 of its 66 feature component files and 3 of its 13 page-level components with stories, and every token shown. At part 1's revision it counted 14, 32 and 1.

## 13. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the sample catalog on screens.** Names, counts, colours and pictures differ on purpose.
- **Data added by hand.** Coffee Machines' picture and description were added through Spree's Admin API, and the settings through the dashboard, during the session, not by a committed script, so this record lists them (§2.1, §6). They exist only in lane A's test database. Spree's tests, fixtures and code are unchanged.
- **Rebuilds and caches.** Market and language changes were seen only after rebuilding the storefront with its data cache cleared (B3); what a deployed storefront's cache does was not checked.
- **One currency for first-run setup.** The sample data was run for a store in złoty only.
- **Different SDK versions.** The storefront pins `@spree/sdk` 2.0.0-rc.3 while the backend ships rc.4 (FB-06). The captures show the pinned pair.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL; part 2 changes no Spree code.
- **The header in earlier batches' comparisons.** Part 1's hero section at 390 pixels and five of the shopper accounts batch's comparisons have the storefront's header over the part (§4.4). Part 1's corrected comparison is in this part's evidence and its committed one is unchanged; the accounts batch's were not run again, because they need a signed-in test customer with orders that this lane does not have. They are tracked for follow-up as G-52 (§15).
- **Size.** The reference images are 2.7 MB and the evidence 29 MB, in 427 files. The evidence images are lossless WebP, converted from the PNG captures with every pixel checked equal.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 14. Evidence

The [evidence index](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/README.md) lists every capture, comparison and result file, by inventory ID. The [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) lists every reference image for the owner's review.

## 15. The owner's review, 2026-10-29

On 2026-10-29 at 13:11 UTC the owner accepted part 2's reference images, its screen evidence and its fidelity, the header captures corrected in §4.4 included, within the documented limits (§13). The owner reviewed storefront #21 at `4ee76ba` and this record in #26 at `ad9f7aa`. The [image review list](2026-10-26-fb-19-batch-storefront-shop-part-2-image-review.md) records the acceptance for every image. The owner merges #26 and storefront #21, after #28, and their merge is recorded apart from this acceptance.

The acceptance closes no gap and changes no functional result in §2:

- The answers of 2026-10-27 stand as §11 records them: G-46 and G-47 deferred, G-48 and G-51 accepted, G-49 linked to G-44, G-50 linked to G-11, and G-36 and G-38 kept open.
- SD-8 to SD-11 stay open in [LIQ-004](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline).
- Tenant isolation stays NOT_RUN (§3.3).
- The five comparisons of the shopper accounts batch that the header covers (§4.4) stay as committed and are tracked for follow-up as G-52 in [LIQ-004's register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance).
- Part 1's acceptance is separate and pending.
