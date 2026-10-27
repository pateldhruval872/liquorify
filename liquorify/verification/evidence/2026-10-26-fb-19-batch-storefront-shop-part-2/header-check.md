# Header check

The storefront's header is sticky: it stays at the top of the window as the page scrolls. When the comparison script captured a part of a page, the browser scrolled the part into view and the header was drawn over the part's top. The corrected script (storefront draft pull request #21 at `4ee76ba`) hides every sticky element outside the part while it captures, and records each one in the comparison's notes, under `hiddenWhileCaptured`, with `overPart`: whether it lay over the part when the capture was taken. Parts captured from the top of the page, and whole-window captures, are captured as before.

Every comparison below was run again with the corrected script, on the same servers, data and revisions as before. Each new running-screen and story image was compared, pixel for pixel, with the same image from the earlier run, whose side-by-side images are the committed comparisons and match them pixel for pixel. "identical" means not one pixel differs.

## Part 2: 61 comparisons

14 comparisons had the header over the part; their committed comparisons and notes are replaced. Their stories, and the computed styles on both sides, are unchanged: the same elements and properties differ as before, and only the skeleton's animated opacity values move between runs. The other 47 had nothing over the part; their running screens are identical to the earlier run's, except where the last column says why, and their committed comparisons are unchanged.

| Comparison | Width | Set-up | Capture | Header over the part | Running screen, against the earlier run | Story, against the earlier run | Why it differs | Committed comparison |
|---|---|---|---|---|---|---|---|---|
| `availability-dropdown` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `breadcrumbs-product-page` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `breadcrumbs-product-page` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `breadcrumbs-subcategory` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `breadcrumbs-subcategory` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `category-banner-with-picture` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `category-banner-with-picture` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `category-banner-without-picture` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `category-banner-without-picture` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `category-subcategory-links` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `category-subcategory-links` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-bar-filters-applied` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-bar-filters-applied` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-bar-skeleton` | 1280 | proxied | part, sticky elements hidden | no | 10608 pixels differ, rows 0–35 | 10592 pixels differ, rows 0–35 | The skeleton's pulse, caught at another moment, on both sides | unchanged |
| `filter-bar-skeleton` | 390 | proxied | part, sticky elements hidden | no | 10644 pixels differ, rows 0–35 | 132 pixels differ, rows 0–35 | The skeleton's pulse, caught at another moment, on both sides | unchanged |
| `filter-bar` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-bar` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-chips` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `filter-chips` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `infinite-product-list-end` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `infinite-product-list-end` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `infinite-product-list-loading-more-failed` | 1280 | proxied | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `infinite-product-list-loading-more-failed` | 390 | proxied | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `infinite-product-list-loading-more` | 1280 | proxied | part, sticky elements hidden | no | 164 pixels differ, rows 30–49 | 177 pixels differ, rows 30–49 | The loading spinner, caught at another moment | unchanged |
| `infinite-product-list-loading-more` | 390 | proxied | part, sticky elements hidden | no | identical | 177 pixels differ, rows 30–49 | The loading spinner, caught at another moment | unchanged |
| `media-gallery-several-pictures` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `media-gallery-several-pictures` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `media-lightbox-first-picture` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `media-lightbox-first-picture` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-filter-drawer-empty` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-filter-drawer-with-choices` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `option-dropdown-colours` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `price-dropdown-ranges` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-custom-fields` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-custom-fields` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-details-colour-and-size` | 1280 | standard | part, sticky elements hidden | yes | 16066 pixels differ, rows 0–50 | identical | The header removed | [replaced](comparison/product-details-colour-and-size/desktop-side-by-side.webp) |
| `product-details-colour-and-size` | 390 | standard | part, sticky elements hidden | yes | 14308 pixels differ, rows 353–416 | identical | The header removed | [replaced](comparison/product-details-colour-and-size/mobile-side-by-side.webp) |
| `product-details-quantity-chosen` | 1280 | standard | part, sticky elements hidden | yes | 16066 pixels differ, rows 0–50 | identical | The header removed | [replaced](comparison/product-details-quantity-chosen/desktop-side-by-side.webp) |
| `product-details-quantity-chosen` | 390 | standard | part, sticky elements hidden | yes | 14308 pixels differ, rows 353–416 | identical | The header removed | [replaced](comparison/product-details-quantity-chosen/mobile-side-by-side.webp) |
| `product-details-sale-price` | 1280 | standard | part, sticky elements hidden | yes | 16066 pixels differ, rows 0–50 | identical | The header removed | [replaced](comparison/product-details-sale-price/desktop-side-by-side.webp) |
| `product-details-sale-price` | 390 | standard | part, sticky elements hidden | yes | 14308 pixels differ, rows 353–416 | identical | The header removed | [replaced](comparison/product-details-sale-price/mobile-side-by-side.webp) |
| `product-details-sold-out-choice` | 1280 | standard | part, sticky elements hidden | yes | 16066 pixels differ, rows 0–50 | identical | The header removed | [replaced](comparison/product-details-sold-out-choice/desktop-side-by-side.webp) |
| `product-details-sold-out-choice` | 390 | standard | part, sticky elements hidden | yes | 14308 pixels differ, rows 353–416 | identical | The header removed | [replaced](comparison/product-details-sold-out-choice/mobile-side-by-side.webp) |
| `product-grid-skeleton` | 1280 | proxied | part, sticky elements hidden | yes | 946074 pixels differ, rows 0–938 | identical | The header removed; the skeleton's pulse also differs between runs | [replaced](comparison/product-grid-skeleton/desktop-side-by-side.webp) |
| `product-grid-skeleton` | 390 | proxied | part, sticky elements hidden | yes | 181255 pixels differ, rows 0–760 | 180648 pixels differ, rows 0–760 | The header removed; the skeleton's pulse also differs between runs | [replaced](comparison/product-grid-skeleton/mobile-side-by-side.webp) |
| `product-grid` | 1280 | standard | part, sticky elements hidden | yes | 74752 pixels differ, rows 0–63 | identical | The header removed | [replaced](comparison/product-grid/desktop-side-by-side.webp) |
| `product-grid` | 390 | standard | part, sticky elements hidden | yes | 21764 pixels differ, rows 0–63 | identical | The header removed | [replaced](comparison/product-grid/mobile-side-by-side.webp) |
| `product-listing-first-page` | 1280 | standard | part, sticky elements hidden | yes | 6406 pixels differ, rows 12–63 | identical | The header removed | [replaced](comparison/product-listing-first-page/desktop-side-by-side.webp) |
| `product-listing-first-page` | 390 | standard | part, sticky elements hidden | yes | 3574 pixels differ, rows 12–63 | identical | The header removed | [replaced](comparison/product-listing-first-page/mobile-side-by-side.webp) |
| `product-listing-no-match-for-a-word` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-listing-no-match-for-a-word` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-listing-no-products-for-the-filters` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-listing-no-products-for-the-filters` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `quantity-picker-field` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `quantity-picker-field` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `sort-dropdown` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `sort-dropdown` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `variant-picker-colour-and-size-chosen` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `variant-picker-colour-and-size-chosen` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `variant-picker-sold-out-choice` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `variant-picker-sold-out-choice` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |

## Part 1: 53 comparisons

Part 1's comparisons were run again the same way, on the standard, proxied and wholesale set-ups. Only the hero section at 390 pixels had the header over the part, across its top 64 pixels. Part 1 is merged and its acceptance is pending, so its committed comparison is left as recorded; the corrected capture is in this folder at [`header-check/hero-section-mobile-side-by-side.webp`](header-check/hero-section-mobile-side-by-side.webp), with its notes beside it. The pilot's hero-section comparison at 390 pixels, the same case, shows the same interference.

| Comparison | Width | Set-up | Capture | Header over the part | Running screen, against the earlier run | Story, against the earlier run | Why it differs | Committed comparison |
|---|---|---|---|---|---|---|---|---|
| `button-large` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `button-large` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `cart-drawer-empty-keyboard` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-empty-keyboard` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-empty` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-empty` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-with-items-keyboard` | 1280 | standard | whole window | no | 426 pixels differ, rows 286–335 | identical | A button behind the open drawer, caught at another moment of its colour change | unchanged |
| `cart-drawer-with-items-keyboard` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-with-items` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `cart-drawer-with-items` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `featured-products-section-loading` | 1280 | proxied | part, page scrolled to the top | no | 344296 pixels differ, rows 140–485 | 344288 pixels differ, rows 140–485 | The skeleton's pulse, caught at another moment, on both sides | unchanged |
| `featured-products-section-loading` | 390 | proxied | part, page scrolled to the top | no | 534692 pixels differ, rows 140–1931 | 534652 pixels differ, rows 140–1931 | The skeleton's pulse, caught at another moment, on both sides | unchanged |
| `featured-products-section-no-products` | 1280 | proxied | part, page scrolled to the top | no | size 1280×324 → 1280×578 | identical | Not a capture difference: lane A's shop data has changed since part 1 ran, and the British page now lists products, so the rerun did not reach this state. Its committed comparison stands | unchanged |
| `featured-products-section-no-products` | 390 | proxied | part, page scrolled to the top | no | size 390×324 → 390×650 | identical | Not a capture difference: lane A's shop data has changed since part 1 ran, and the British page now lists products, so the rerun did not reach this state. Its committed comparison stands | unchanged |
| `featured-products-section` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `featured-products-section` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `footer-wholesale-link` | 1280 | wholesale | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `footer-wholesale-link` | 390 | wholesale | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `footer` | 1280 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `footer` | 390 | standard | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `global-error` | 1280 | proxied | whole window | no | identical | identical |  | unchanged |
| `global-error` | 390 | proxied | whole window | no | identical | identical |  | unchanged |
| `header-cart-count` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `header-cart-count` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `header-empty-cart` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `header-empty-cart` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `header-wholesale-link` | 1280 | wholesale | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `hero-section` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `hero-section` | 390 | standard | part, sticky elements hidden | yes | 2478 pixels differ, rows 12–63 | identical | The header removed | unchanged; see below |
| `input-group-search` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `input-group-search` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `mobile-menu-category-panel` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-category-panel` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-main-panel` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-main-panel` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-subcategory-panel` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-subcategory-panel` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-wholesale-link` | 1280 | wholesale | whole window | no | identical | identical |  | unchanged |
| `mobile-menu-wholesale-link` | 390 | wholesale | whole window | no | identical | identical |  | unchanged |
| `product-card` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `product-card` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `region-dialog` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `region-dialog` | 390 | standard | whole window | no | identical | identical |  | unchanged |
| `region-header-control` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-keyboard-choice` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-keyboard-choice` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-open` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-open` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-suggestions` | 1280 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `search-suggestions` | 390 | standard | part, sticky elements hidden | no | identical | identical |  | unchanged |
| `sheet-left` | 1280 | standard | whole window | no | identical | identical |  | unchanged |
| `wholesale-section` | 1280 | wholesale | part, page scrolled to the top | no | identical | identical |  | unchanged |
| `wholesale-section` | 390 | wholesale | part, page scrolled to the top | no | identical | identical |  | unchanged |

## Shopper accounts batch

The shopper accounts batch's comparisons need a signed-in test customer with orders, which lane A does not have, so they could not be run again here. Four of its cases need no customer and were run again: `card-sign-in`, `field-sign-in`, `input-sign-in` and `policy-consent-register`, at both widths, had nothing over the part. The others were checked by looking at the committed images. The header covers the top of the part in five:

| Comparison | Width | What the header hides |
|---|---|---|
| `account-shell` | 390 | The customer's name at the top of the account menu |
| `gift-card-list` | 390 and 1280 | The part's top band, above the "Active Gift Cards" heading |
| `order-detail-shipped` | 390 and 1280 | The "Back to orders" link |

`address-edit-modal-editing` and `alert-dialog-delete-address` are whole-window captures, in which the page behind the dialog, header included, is meant to show. The rest show nothing over the part.
