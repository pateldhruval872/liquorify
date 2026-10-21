---
document_id: LIQ-008
title: Spree Screen Inventory
version: 0.1-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Spree Screen Inventory

Every screen Spree already ships, at the pinned revisions, with a stable ID, its route, who may open it, the workflows it supports, its meaningful states and where its code is. It is part of the Spree product baseline ([LIQ-006](LIQ-006-product-capability-baseline.md)), which comes before any Liquorify product work ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)). The components and tokens these screens are built from are in [LIQ-009](LIQ-009-spree-component-and-token-inventory.md).

**It describes what exists.** A screen listed here is not a Liquorify requirement, and its later Liquorify disposition does not remove it from the inventory. The Figma reproduction (FB-21) and the Storybook baselines (FB-19) are measured against these IDs ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)).

## 1. Scope, method and counts

- **Revisions.** Backend `liquorify` at `1d1f2d4` and storefront `liquorify-storefront` at `ac53c5b`, the revisions LIQ-006 pins.
- **Method.** Reading only, on 2026-10-21: every route file, the navigation definitions, the permission catalog, the page components and the browser test titles. Nothing was run for this inventory. The dashboard's route folder also holds one test file, `_authenticated/index.test.tsx`, which is not counted. Workflows come from browser test titles and the actions on each page. A workflow with a browser test was verified once in CI for the dashboard (LIQ-003 evidence V2); the storefront's browser tests have not run (LIQ-003 QV-20).
- **What counts as a screen.** A route a person can land on that renders its own page. Layout files and redirects from old addresses are counted but get no screen ID. Sheets and dialogs opened from a screen belong to that screen; the app-wide ones are overlays with their own IDs.
- **IDs are permanent.** A screen keeps its ID if its route changes. A screen removed upstream keeps its row, marked as removed. A new screen takes the next number in its area.

| Surface | Route files | Layouts | Redirects | Screens | Overlays | Browser tests |
|---|---|---|---|---|---|---|
| Admin dashboard (`packages/dashboard`) | 106 | 6 | 5 | 95 | 5 | 412 titles in 78 spec files, including `first-run/setup.spec.ts` |
| Seller panel (`packages/seller-dashboard`) | 26 | 4 | 0 | 22 | 2 | 21 titles in 8 spec files kept with the dashboard's (`seller-catalog`, `seller-delivery-methods`, `seller-invitation-acceptance`, `seller-package-types` and the four `seller-panel-*`) |
| Storefront (`liquorify-storefront`) | 27 pages, 1 error page and 1 route handler | 6 | 0 | 25, plus 2 system pages and 2 development previews | 5 | 21 titles in 6 spec files |
| Emails | 23 Liquid templates, 4 storefront React emails | 1 Liquid layout | — | 27 emails | — | Spree's mailer specs (not browser tests) |

The dashboard's `e2e/` folder holds 433 browser test titles in 86 spec files, split above by the app they exercise; the operator's seller screens (`sellers`, `seller-ledger`, `seller-requirements`) count as dashboard. In CI, where some titles run more than once, the run counted 434 passed and 1 skipped (V2).

## 2. Who may open what

### Staff, in the admin dashboard

- **Roles are held per store.** Each store gets an `admin` role, which grants full access and cannot be edited (`Spree::Seeds::Roles`, `Ability#activate_full_access`). Any other role is created by the store's staff and holds permission keys.
- **Permission keys** are `read_<scope>` and `write_<scope>`; write includes read. The scopes are registered in `spree/core/lib/spree/core/permissions/default_catalog.rb`.
- **Role templates.** Creating a role offers three templates that only pre-fill the permission grid; nothing is seeded (`components/spree/role-sheet.tsx`). In the tables below:
  - **OM**, order manager: write on orders, payments, fulfillments, refunds, gift cards and store credits; read on customers.
  - **ME**, merchandiser: write on products, categories, collections and stock.
  - **SU**, support: read on orders, customers and the dashboard.
  - **—**: no template covers the scope, so only the admin role or a custom role opens the screen.
- **How the dashboard applies them.** The navigation hides an entry the staff member cannot read. Buttons that change data check write through `<Can>` and `permissions.can`. The API checks every request again, so a screen reached directly without permission shows the "Not authorized" state (DA-SHELL-02) or an error.
- **"Scope" in the tables** is the scope a staff member needs read on to open the screen; changing anything on it needs write on the same scope unless the row says otherwise.

| Group | Scopes |
|---|---|
| Analytics | `dashboard` (read only), `reports` |
| Orders | `orders`, `payments`, `fulfillments`, `refunds` |
| Catalog | `products`, `product_types`, `publishing`, `media`, `categories`, `collections`, `stock`, `purchasing` |
| Customers | `customers` (also companies, customer groups, addresses, tax certificates and privacy requests) |
| Sellers | `sellers`, `commissions`, `payouts` |
| Loyalty and marketing | `gift_cards`, `store_credits`, `promotions` |
| Settings | `settings`, `delivery_methods`, `package_types`, `webhooks`, `email_templates`, `integrations` |
| Access | `api_keys`, `oauth_applications`, `staff` |
| Seller panel only | `seller_profile`, `seller_earnings` (read only) |

### Sellers, in the seller panel

A seller's team members all hold the seller's own seeded role, which carries the whole seller vocabulary: the seller-only scopes plus `orders`, `fulfillments`, `products`, `product_types` (read only), `media`, `stock`, `delivery_methods`, `package_types` and `dashboard`. Narrower seller roles are not offered in the panel (`pages/team.tsx`). The API limits every request to the seller's own records.

### Shoppers, on the storefront

- **Guest**: browses, keeps a cart and checks out, unless the store turns guest checkout off (`Spree::Store` preference `guest_checkout`).
- **Signed-in customer**: also has the account pages.
- **Approved wholesale buyer**: a customer in the customer group named "Wholesale" (`src/lib/wholesale.ts`). The wholesale channel's access setting decides what others see: `login_required` shows a sign-in wall, `prices_hidden` shows the catalog without prices.

### Platform installer

Opens first-run setup (DA-SETUP-01) with the installation's setup link, only until the first admin exists.

## 3. Admin dashboard screens

**Code paths.** "R/" is `packages/dashboard/src/routes/`; "S/" is `packages/dashboard/src/routes/_authenticated/$storeId/`. Tests are in `packages/dashboard/e2e/`.

**States every list and detail page shares**, so the rows below name only the rest:

- **List pages** built on `ResourceTable`: loading, empty, no matches for a search or filter, paged, and selected rows with bulk actions where offered.
- **Detail pages**: loading skeleton, error with retry, not found or not authorized, and, where the page is a form, unsaved changes with Save and Discard and a warning before leaving.
- **Without write permission**, create, edit and delete controls are hidden.

A dash in the states column means the screen has no states beyond these.

### Sign-in, setup and shell

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-AUTH-01 | Sign in, `/login` | Public | Sign in with email and password or a configured sign-in provider; reach password reset (`auth.spec.ts`) | Providers loading or failed; wrong credentials; provider error on return; a fresh installation points to setup | R/`login.tsx`; slot `login.after` |
| DA-AUTH-02 | Forgot password, `/forgot-password` | Public | Request a reset link without learning whether the email exists (`auth.spec.ts`) | Sending; sent | R/`forgot-password.tsx` |
| DA-AUTH-03 | Reset password, `/reset-password` | Public, with the emailed link | Choose a new password (`auth.spec.ts`) | Missing or invalid link with a request-again link; saved | R/`reset-password.tsx` |
| DA-AUTH-04 | Accept invitation, `/accept-invitation/$invitationId` | Public, with the invitation link | Create an account or use an existing one to join a store with the invited role (`invitation-acceptance.spec.ts`) | Who invited and as which role; new or existing account; invalid link | R/`accept-invitation.$invitationId.tsx` |
| DA-SETUP-01 | First-run setup, `/setup` | Platform installer, with the setup token | Create the first admin and the store, then sign in (`first-run/setup.spec.ts`) | Wrong token refused; closed once an admin exists; field errors | R/`setup.tsx`; `components/spree/store-setup-fields.tsx` |
| DA-SHELL-01 | Store selection, `/` | Any signed-in staff member | Opens the first store the staff member holds a role in, or a plugin's store picker | No store access | R/`_authenticated/index.tsx`; slot `store_selection`; `components/spree/no-store-access.tsx` |
| DA-SHELL-02 | Not found inside a store, `/$storeId/*` | Any signed-in staff member | Return to the store | Not found; not authorized | S/`$.tsx` |

Layouts without a screen ID: R/`__root.tsx`, R/`_authenticated.tsx`, R/`_authenticated/$storeId.tsx` (the shell, DA-OVL-01), S/`settings.tsx`, S/`settings/taxes.tsx` (the taxes header and tabs), S/`settings/taxes/index.tsx` (opens the first tab the staff member may read).

### Home and getting started

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-HOME-01 | Home, `/$storeId` | `dashboard` (SU); each ranking tab also needs read on its own scope | Key figures with a comparison chart, by date range, currency and channel; operations and ranking widgets; "orders to fulfill" opens the filtered orders list (`home-dashboard.spec.ts`) | Loading; no data for the period; ranking tabs hidden without permission | S/`index.tsx` |
| DA-HOME-02 | Getting started, `/$storeId/getting-started` | `settings`, write (—) | Six setup tasks, each linked to where it is done: store address, payment method, products, support email, taxes, storefront (`getting-started.spec.ts`) | Progress; each task done or not; hidden from the navigation once all are done | S/`getting-started.tsx`; `config/initializers/spree_store_setup_tasks.rb`; `components/spree/setup-tasks/` |

### Orders

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-ORD-01 | Orders, `/$storeId/orders` | `orders` (OM, SU read) | Search by number or billing name; filter by payment and fulfillment status, total, SKU, channel, currency, seller and tags; sort; export (`orders-list.spec.ts`, `orders.spec.ts`) | Payment status: none, authorized, partially paid, paid, partially refunded, refunded, overcharged, voided. Fulfillment status: unfulfilled, partial, fulfilled, delivered, backorder, canceled | S/`orders/index.tsx`; `tables/orders.tsx` |
| DA-ORD-02 | Draft orders, `/$storeId/orders/drafts` | `orders` (OM, SU read) | List drafts; start a new order (`orders.spec.ts`) | Empty | S/`orders/drafts.tsx` |
| DA-ORD-03 | New order, `/$storeId/orders/new` | `orders`, write (OM) | Create a draft for a customer or company with items, channel, purchase order number and document, coupon and notes (`orders.spec.ts`) | Default addresses on or off; company help; field errors | S/`orders/new.tsx` |
| DA-ORD-04 | Order, `/$storeId/orders/$orderId` | `orders` (OM, SU read); payments, fulfillments and refunds need their own scopes | Fulfil, buy or upload labels, record deliveries; take payments and refunds; returns, exchanges and claims; tags, notes, special instructions; delete a draft; follow a card payment to the gateway (`orders.spec.ts`, `order-fulfillments.spec.ts`, `post-sale.spec.ts`) | Order: draft, placed, canceled. Cards appear only when relevant: post-sale cards after completion, digital links, purchase order, marketplace and commission cards. Draft: no tracking or label controls | S/`orders/$orderId/index.tsx`; `components/spree/orders/`; slot `order.form_sidebar` |
| DA-ORD-05 | Edit order items, `/$storeId/orders/$orderId/edit` | `orders`, write (OM) | Add and change items, set a negotiated price, preview totals before confirming (`orders.spec.ts`) | Fully fulfilled order; totals preview; unsaved changes | S/`orders/$orderId/edit.tsx` |
| DA-ORD-06 | Returns, `/$storeId/returns` | `orders` (OM, SU read) | List every return; open its order (`post-sale.spec.ts`) | Requested, approved, received, refunded, canceled | S/`returns.tsx`; `tables/post-sale.tsx` |
| DA-ORD-07 | Exchanges, `/$storeId/exchanges` | `orders` (OM, SU read) | List every exchange (`post-sale.spec.ts`) | Requested, approved, received, fulfilled, canceled | S/`exchanges.tsx` |
| DA-ORD-08 | Claims, `/$storeId/claims` | `orders` (OM, SU read) | List every claim (`post-sale.spec.ts`) | Open, approved, resolved, denied, canceled | S/`claims.tsx` |

### Products and catalog

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-PRD-01 | Products, `/$storeId/products` | `products` (ME) | Search by name or SKU; filter by status, price, category, channel, type, seller and tags; bulk set status, categories, collections, channels and tags; duplicate; delete; import and export (`products-list.spec.ts`, `products-bulk.spec.ts`, `channels.spec.ts`) | Draft, active, archived | S/`products/index.tsx`; `tables/products.tsx` |
| DA-PRD-02 | New product, `/$storeId/products/new` | `products`, write (ME) | Create a simple or multi-variant product with prices, inventory, media, channels, categories, custom fields and digital files in one save (`products-new.spec.ts`, `products-new-media.spec.ts`, `products-publishing.spec.ts`) | Media uploading before save; field errors | S/`products/new.tsx`; `dashboard-core/src/products/` |
| DA-PRD-03 | Product, `/$storeId/products/$productId` | `products` (ME); publishing, media and stock have their own scopes | Edit details, rich description, variants, prices in several currencies, stock per location, media and video, digital files, channels and publication windows, tax, SEO, translations, custom fields; review a seller's submission (`products-edit*.spec.ts`, `products-prices-inventory.spec.ts`, `products-variants.spec.ts` and others) | Status draft, active, archived; a seller's product proposed or rejected; the admin's own number format for prices | S/`products/$productId.tsx`; slot `product.form_sidebar` |
| DA-PRD-04 | Media library, `/$storeId/products/media` | `media` (—) | Upload, describe for screen readers, find where a file is used, delete (`media-library.spec.ts`) | Attached or unattached; deleting a file in use warns | S/`products/media.tsx` |
| DA-PRD-05 | Options, `/$storeId/products/options` | `products` (ME) | Create and edit option types with values, colours and images; reorder values by dragging; translate (`option-types.spec.ts`, `option-type-translations.spec.ts`) | Kind filter | S/`products/options.tsx` |
| DA-PRD-06 | Translations, `/$storeId/products/translations` | `products` (ME) | See translation coverage per language; translate in place; import and export (`products-translations.spec.ts`) | Coverage per record; no other language configured | S/`products/translations.tsx` |
| DA-PRD-07 | Categories, `/$storeId/products/categories` | `categories` (ME) | Browse the tree or a list; search; reposition a top-level category (`categories.spec.ts`) | Tree or list view | S/`products/categories/index.tsx` |
| DA-PRD-08 | New category, `/$storeId/products/categories/new` | `categories`, write (ME) | Create a category (`categories.spec.ts`) | Field errors | S/`products/categories/new.tsx` |
| DA-PRD-09 | Category, `/$storeId/products/categories/$categoryId` | `categories` (ME) | Edit; add and remove products, which takes effect immediately; image; custom fields (`categories.spec.ts`, `custom-field-definitions.spec.ts`) | Product changes apply at once while other fields wait for Save | S/`products/categories/$categoryId.tsx`; slot `category.form_sidebar` |
| DA-PRD-10 | Collections, `/$storeId/products/collections` | `collections` (ME) | List, filter manual or automatic, delete (`collections.spec.ts`) | Manual or automatic | S/`products/collections/index.tsx` |
| DA-PRD-11 | New collection, `/$storeId/products/collections/new` | `collections`, write (ME) | Create a manual or rule-based collection (`collections.spec.ts`) | Field errors | S/`products/collections/new.tsx` |
| DA-PRD-12 | Collection, `/$storeId/products/collections/$collectionId` | `collections` (ME) | Edit name and sort order; curate products or set rules (`collections.spec.ts`) | Automatic collections have read-only membership; switching to rules hides curation | S/`products/collections/$collectionId.tsx`; slot `collection.form_sidebar` |
| DA-PRD-13 | Catalogs, `/$storeId/products/catalogs` | `products` (ME) | List; create through a wizard; delete (`catalogs.spec.ts`) | Active or paused; a part-filled wizard asks before closing | S/`products/catalogs/index.tsx` |
| DA-PRD-14 | Catalog, `/$storeId/products/catalogs/$catalogId` | `products` (ME) | Audience, terms, order minimum, assortment and pricing, staged until Save (`catalogs.spec.ts`) | Active or paused; staged changes | S/`products/catalogs/$catalogId.tsx`; slot `catalog.form_sidebar` |
| DA-PRD-15 | Price lists, `/$storeId/products/price-lists` | `products` (ME) | List; delete (`price-lists.spec.ts`) | Draft, active, inactive, scheduled | S/`products/price-lists/index.tsx` |
| DA-PRD-16 | New price list, `/$storeId/products/price-lists/new` | `products`, write (ME) | Create with rules: volume, market, channel, customer, customer group (`price-lists.spec.ts`) | Field errors | S/`products/price-lists/new.tsx`; slot `price_list.form_sidebar` |
| DA-PRD-17 | Price list, `/$storeId/products/price-lists/$priceListId` | `products` (ME) | Edit rules and prices; bulk edit in several currencies; quantity breaks; import and export (`price-lists.spec.ts`) | Paging products does not save | S/`products/price-lists/$priceListId/index.tsx` |

### Inventory

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-INV-01 | Inventory, `/$storeId/inventory` | `stock` (ME) | Stock on hand and on its way per location; correct a count in place; filter by stock status and location; raise a purchase order from a row (`inventory.spec.ts`) | Stock status per row | S/`inventory/index.tsx` |
| DA-INV-02 | Stock transfers, `/$storeId/transfers` | `stock` (ME) | List; delete a draft (`stock-transfers.spec.ts`) | Draft, ready to ship, in transit, partially received, received, over received, canceled | S/`transfers/index.tsx` |
| DA-INV-03 | New transfer, `/$storeId/transfers/new` | `stock`, write (ME) | Raise a draft with lines (`stock-transfers.spec.ts`, `inventory-line-picker.spec.ts`) | Field errors | S/`transfers/new.tsx` |
| DA-INV-04 | Transfer, `/$storeId/transfers/$transferId` | `stock` (ME) | Mark ready, send, receive in one or more deliveries with damage, close short, cancel, say what happened to units already gone (`stock-transfers.spec.ts`) | The statuses above; each delivery its own receipt | S/`transfers/$transferId/index.tsx`; slot `stock_transfer.form_sidebar` |
| DA-INV-05 | Edit transfer, `/$storeId/transfers/$transferId/edit` | `stock`, write (ME) | Correct a draft (`stock-transfers.spec.ts`) | A shipped transfer cannot be edited | S/`transfers/$transferId/edit.tsx` |
| DA-INV-06 | Purchase orders, `/$storeId/purchase-orders` | `purchasing` (—) | List; filter by status, supplier and dates; import and export; delete a draft (`purchase-orders.spec.ts`) | Draft, ordered, partially received, received, over received, canceled; overdue; past cancel-by | S/`purchase-orders/index.tsx` |
| DA-INV-07 | New purchase order, `/$storeId/purchase-orders/new` | `purchasing`, write (—) | Raise a draft (`purchase-orders.spec.ts`) | Field errors | S/`purchase-orders/new.tsx` |
| DA-INV-08 | Purchase order, `/$storeId/purchase-orders/$purchaseOrderId` | `purchasing` (—) | Place with the supplier, receive deliveries, close short, cancel (`purchase-orders.spec.ts`) | The statuses above | S/`purchase-orders/$purchaseOrderId/index.tsx`; slot `purchase_order.form_sidebar` |
| DA-INV-09 | Edit purchase order, `/$storeId/purchase-orders/$purchaseOrderId/edit` | `purchasing`, write (—) | Correct a draft (`purchase-orders.spec.ts`) | Not editable once placed; a line needs a cost | S/`purchase-orders/$purchaseOrderId/edit.tsx` |
| DA-INV-10 | Suppliers, `/$storeId/suppliers` | `purchasing` (—) | Add, edit, delete one without purchasing history (`suppliers.spec.ts`) | Name required | S/`suppliers.tsx` |

### Customers

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-CUS-01 | Customers, `/$storeId/customers` | `customers` (OM read, SU read) | Search, filter, sort; create; bulk add to groups and tags; import and export (`customers-list.spec.ts`, `customers.spec.ts`) | Erased customers hidden until asked for | S/`customers/index.tsx` |
| DA-CUS-02 | Customer, `/$storeId/customers/$customerId` | `customers` (OM read, SU read) | Profile, addresses, groups, orders, lifetime figures, store credit, tax identifiers, internal note, privacy (export or erase), custom fields (`customers.spec.ts`) | No orders yet; erased | S/`customers/$customerId.tsx`; slot `customer.form_sidebar` |
| DA-CUS-03 | Customer groups, `/$storeId/customers/groups` | `customers` (OM read, SU read) | Create, edit, open the filtered customers, delete (`customer-groups.spec.ts`) | — | S/`customers/groups.tsx` |
| DA-CUS-04 | Companies, `/$storeId/companies` | `customers` (OM read, SU read) | Create; filter by kind; delete (`companies.spec.ts`) | Company or division | S/`companies/index.tsx` |
| DA-CUS-05 | Company, `/$storeId/companies/$companyId` | `customers` (OM read, SU read) | Divisions, members and invitations, address book, purchase order numbers, tax exemption certificates (`companies.spec.ts`) | Pending invitation; certificate pending, verified, expired, revoked; Enterprise upsell card | S/`companies/$companyId.tsx`; slots `company.form_main`, `company.form_sidebar`, `company_membership.*` |

### Sellers (marketplace operator)

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-SEL-01 | Sellers, `/$storeId/sellers` | `sellers` (—) | List, filter by status, create, delete (`sellers.spec.ts`, `list-filters.spec.ts`) | Pending, invited, onboarding, ready for review, approved, rejected, suspended, canceled | S/`sellers/index.tsx` |
| DA-SEL-02 | Seller, `/$storeId/sellers/$sellerId` | `sellers` (—) | Invite or re-invite, approve, reject, suspend; edit profile and payout settings; team, balance, onboarding progress (`sellers.spec.ts`) | The statuses above; placeholders for details not filled in; approving before requirements are met asks to confirm | S/`sellers/$sellerId.tsx`; slots `seller.form_main`, `seller.form_sidebar` |
| DA-SEL-03 | Commission rates, `/$storeId/sellers/commission-rates` | `commissions` (—) | Percentage or flat per currency, floor, cap, tax, seller and category conditions (`commission-rates.spec.ts`) | Enabled or not | S/`sellers/commission-rates.tsx` |
| DA-SEL-04 | Seller transfers, `/$storeId/sellers/transfers` | `payouts` (—) | What each seller earned per order (`seller-ledger.spec.ts`) | Pending, processing, completed, failed, unresolved | S/`sellers/transfers.tsx`; `tables/seller-ledger.tsx` |
| DA-SEL-05 | Payouts, `/$storeId/sellers/payouts` | `payouts` (—) | Mark a payout paid with its reference (`seller-ledger.spec.ts`) | The statuses above | S/`sellers/payouts/index.tsx` |
| DA-SEL-06 | Payout, `/$storeId/sellers/payouts/$payoutId` | `payouts` (—) | See the earnings a payout covers (`seller-ledger.spec.ts`) | The statuses above | S/`sellers/payouts/$payoutId.tsx`; slots `seller_payout.form_main`, `seller_payout.form_sidebar` |

### Loyalty, promotions and reports

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-LOY-01 | Gift cards, `/$storeId/loyalty/gift-cards` | `gift_cards` (OM) | Create with a generated or custom code, issue a batch, edit, delete (`gift-cards.spec.ts`) | Active, partially redeemed, redeemed, canceled; expiry | S/`loyalty/gift-cards.tsx` |
| DA-LOY-02 | Store credits, `/$storeId/loyalty/store-credits` | `store_credits` (OM) | Issue to a customer, edit, delete, follow to the customer (`store-credits.spec.ts`) | What the store still owes; ledger empty or failed to load | S/`loyalty/store-credits.tsx` |
| DA-PRM-01 | Promotions, `/$storeId/promotions` | `promotions` (—) | List, delete (`promotions.spec.ts`) | Starts and expires | S/`promotions/index.tsx` |
| DA-PRM-02 | New promotion, `/$storeId/promotions/new` | `promotions`, write (—) | Automatic or coupon promotions with rules (country, channel, market, product, category, customer, group, currency) and actions (adjustments, item adjustments, free line items, tiers) (`promotions.spec.ts`) | Validation, such as a tier above 100 percent | S/`promotions/new.tsx`; slot `promotion.form_sidebar` |
| DA-PRM-03 | Promotion, `/$storeId/promotions/$promotionId` | `promotions` (—) | Edit rules, actions and tiers; delete (`promotions.spec.ts`) | Unsaved changes | S/`promotions/$promotionId.tsx` |
| DA-RPT-01 | Reports, `/$storeId/reports` | `reports` (—) | Built-in and saved reports (`reports.spec.ts`) | Built-in or custom | S/`reports/index.tsx` |
| DA-RPT-02 | New report, `/$storeId/reports/new` | `reports`, write (—) | Build and save (`reports.spec.ts`) | — | S/`reports/new.tsx` |
| DA-RPT-03 | Report, `/$storeId/reports/$reportId` | `reports` (—) | Switch metric group, rename, save a copy, export CSV, delete (`reports.spec.ts`) | — | S/`reports/$reportId.tsx`; `components/spree/reporting/` |

Redirects without a screen ID: S/`promotions/gift-cards.tsx` opens DA-LOY-01.

### Settings

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| DA-SET-01 | Settings index, `/$storeId/settings` | Any; each card needs its own scope | Open each settings page; search settings on a narrow screen (`settings-index.spec.ts`) | Cards hidden without permission | S/`settings/index.tsx`; `dashboard-core/src/pages/settings-index.tsx`; `nav/settings.ts` |
| DA-SET-02 | Store, `/$storeId/settings/store` | `settings` (—) | Name, admin language, time zone, units, storefront access and address, order numbers, payments capture, standards (`store-settings.spec.ts`) | No storefront address until one is set | S/`settings/store.tsx`; slot `store.form_main` |
| DA-SET-03 | Emails, `/$storeId/settings/emails` | `settings` (—) | Turn customer emails on or off; sender, support and notification addresses; logo, colours and font with a preview (`store-settings.spec.ts`) | Addresses and branding hidden when customer emails are off; invalid sender address | S/`settings/emails/index.tsx` |
| DA-SET-04 | Email templates, `/$storeId/settings/emails/templates` | `email_templates` (—) | List the 11 customer emails, the layout and the 5 shared partials | Customized or default; "updated by Spree" notice | S/`settings/emails/templates/index.tsx` |
| DA-SET-05 | Email template, `/$storeId/settings/emails/templates/$templateId` | `email_templates` (—) | Edit subject and body per language with variables, preview, send a test, save a draft, publish, see history, compare with the default, revert | Unsaved; draft; conflict with another editor; template problems | S/`settings/emails/templates/$templateId.tsx`; `components/spree/email-templates/` |
| DA-SET-06 | Policies, `/$storeId/settings/policies` | `settings` (—) | Create, write, delete (`policies.spec.ts`) | — | S/`settings/policies.tsx` |
| DA-SET-07 | AI agents, `/$storeId/settings/ai-agents` | `oauth_applications` (—) | Connect an agent, see who is connected and what they approved, revoke one person (`ai-agents.spec.ts`) | Nothing connected yet | S/`settings/ai-agents.tsx` |
| DA-SET-08 | Channels, `/$storeId/settings/channels` | `settings` (—) | Create with a code derived from the name; per-channel overrides of store settings; default catalog; fulfilment locations; order routing rules; delete a non-default channel (`channels-settings.spec.ts`) | Active; default | S/`settings/channels.tsx` |
| DA-SET-09 | Custom fields, `/$storeId/settings/custom-field-definitions` | `settings` (—) | Define fields for products, categories, customers and others (`custom-field-definitions.spec.ts`) | Visible on the storefront or not | S/`settings/custom-field-definitions.tsx` |
| DA-SET-10 | Integrations, `/$storeId/settings/integrations` | `integrations` (—); payment providers need `settings` | Connect an integration; add, switch on or off a payment provider (`integrations.spec.ts`) | Connected, connected but inactive, not connected, test mode; a failed switch reverts | S/`settings/integrations.tsx`; `components/spree/integrations/` |
| DA-SET-11 | Markets, `/$storeId/settings/markets` | `settings` (—) | Countries, currency, languages, tax included, default market (`markets.spec.ts`) | Default | S/`settings/markets.tsx` |
| DA-SET-12 | Payment methods, `/$storeId/settings/payment-methods` | `settings` (—) | Create with provider settings that keep secrets on edit; edit; delete (`payment-methods.spec.ts`) | Active; shown on the storefront | S/`settings/payment-methods.tsx`; provider slots in `payment-method-form.tsx` |
| DA-SET-13 | Tax categories, `/$storeId/settings/taxes/categories` | `settings` (—) | Create, edit, delete (`tax-categories.spec.ts`, `taxes.spec.ts`) | Active | S/`settings/taxes/categories.tsx` |
| DA-SET-14 | Tax rates, `/$storeId/settings/taxes/rates` | `settings` (—) | Create per country or state, up to three decimals; delete (`tax-rates.spec.ts`) | A tax category is needed first; a fourth decimal is refused | S/`settings/taxes/rates.tsx` |
| DA-SET-15 | Tax exemption reasons, `/$storeId/settings/taxes/exemption-reasons` | `settings` (—) | Add a reason with its code (`taxes.spec.ts`) | — | S/`settings/taxes/exemption-reasons.tsx` |
| DA-SET-16 | Delivery profiles, `/$storeId/settings/delivery-profiles` | `settings` (—) | List including the store default; create (`delivery-settings.spec.ts`) | Default; physical or digital | S/`settings/delivery-profiles/index.tsx` |
| DA-SET-17 | Delivery profile, `/$storeId/settings/delivery-profiles/$profileId` | `settings`; methods need `delivery_methods` (—) | Zones, methods priced flat, per currency, by conditions or through a rate provider with a markup; pickup; digital methods; shipping origin groups (`delivery-settings.spec.ts`) | A profile with no zones; the method sheet opens from its own address | S/`settings/delivery-profiles/$profileId/index.tsx`; `components/spree/shipping/` |
| DA-SET-18 | Stock locations, `/$storeId/settings/stock-locations` | `stock` or `settings` (ME) | Create, edit, delete (`stock-locations.spec.ts`) | — | S/`settings/stock-locations.tsx`; `dashboard-core/src/pages/stock-locations.tsx` |
| DA-SET-19 | Package types, `/$storeId/settings/package-types` | `package_types` (—) | Add a carton with measurements, edit, delete (`package-types.spec.ts`) | — | S/`settings/package-types.tsx`; `dashboard-core/src/pages/package-types.tsx` |
| DA-SET-20 | Product types, `/$storeId/settings/product-types` | `product_types` (—) | Create with default categories and delivery profile (`product-types.spec.ts`, `products-type-categories.spec.ts`) | Name required; changes affect new products only | S/`settings/product-types.tsx` |
| DA-SET-21 | Reasons, `/$storeId/settings/reasons` | `settings` (—) | Refund, return, claim and cancellation reasons: add, retire, delete an unused one (`reasons.spec.ts`) | Retired | S/`settings/reasons.tsx` |
| DA-SET-22 | Marketplace, `/$storeId/settings/marketplace` | `settings` (—) | Admission, automatic approval of sellers and their products, payout provider, minimum payout, commission tax, seller emails (`marketplace-settings.spec.ts`) | Payout provider not connected | S/`settings/marketplace.tsx` |
| DA-SET-23 | Seller requirements, `/$storeId/settings/seller-requirements` | `sellers` (—) | The starting checklist; add, switch off, delete; settings per kind (`seller-requirements.spec.ts`) | On or off | S/`settings/seller-requirements.tsx` |
| DA-SET-24 | Staff, `/$storeId/settings/staff` | `staff` (—) | Invite with a role, resend, revoke; rename and remove a teammate (`staff.spec.ts`) | Pending invitation; a role is required | S/`settings/staff.tsx` |
| DA-SET-25 | Roles, `/$storeId/settings/roles` | `staff` (—) | Create from the permission grid or a template, edit, duplicate, delete one nobody holds (`roles.spec.ts`) | The admin role opens read-only; a role in use cannot be deleted | S/`settings/roles.tsx`; `components/spree/role-sheet.tsx`, `permission-picker.tsx` |
| DA-SET-26 | API keys, `/$storeId/settings/api-keys` | `api_keys` (—) | Publishable and secret keys; create a secret key and see its token once; rename (`api-keys.spec.ts`) | Token shown once | S/`settings/api-keys.tsx`; `components/spree/api-keys/` |
| DA-SET-27 | OAuth clients, `/$storeId/settings/oauth-clients` | `oauth_applications` (—) | Register with a name and callback, rename, remove (`oauth-clients.spec.ts`) | A callback that is not https is refused | S/`settings/oauth-clients.tsx` |
| DA-SET-28 | Webhooks, `/$storeId/settings/webhooks` | `webhooks` (—) | Create an endpoint and see its secret once; send a test; delete (`webhooks.spec.ts`) | Secret shown once; disabled endpoint | S/`settings/webhooks/index.tsx` |
| DA-SET-29 | Webhook endpoint, `/$storeId/settings/webhooks/$webhookEndpointId` | `webhooks` (—) | Rename, send a test and see the delivery, list deliveries (`webhooks.spec.ts`) | Test sent or failed | S/`settings/webhooks/$webhookEndpointId.tsx`; slot `webhook_endpoint.form_sidebar` |
| DA-SET-30 | Allowed origins, `/$storeId/settings/allowed-origins` | `settings` (—) | Create, edit, delete, search (`allowed-origins.spec.ts`) | Malformed origin refused | S/`settings/allowed-origins.tsx` |
| DA-SET-31 | Imports, `/$storeId/settings/imports` | `products`, write (ME) | History of CSV imports; download the original; delete (`imports.spec.ts`) | Pending, mapping, processing, completed, failed | S/`settings/imports/index.tsx` |
| DA-SET-32 | Authorize an application, `/$storeId/oauth/authorize` | Signed-in staff member granting their own access | Approve or refuse what an AI agent or OAuth client asks for (`ai-agents.spec.ts`) | The permissions requested; how to revoke later | S/`oauth/authorize.tsx` |

Redirects without a screen ID: S/`settings/commission-rates.tsx` (to DA-SEL-03), S/`settings/payouts.tsx` (to DA-SET-22), S/`settings/delivery-profiles/$profileId/methods/new.tsx` and `…/methods/$methodId.tsx` (to DA-SET-17 with the method sheet open).

### Overlays shared by every store screen

| ID | Overlay | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|
| DA-OVL-01 | App shell: sidebar navigation with counters, top bar, breadcrumbs, store switcher, user menu with language and theme | Move between areas and stores; switch the interface language (`profile.spec.ts`) | Settings navigation inside settings; mobile top bar; collapsed sidebar | `dashboard-core/src/components/app-shell.tsx`, `app-sidebar.tsx`, `store-switcher.tsx` |
| DA-OVL-02 | Command palette | Open with the keyboard; create actions; jump to pages (`command-palette.spec.ts`) | Nothing matches | `components/spree/command-palette/command-palette.tsx` |
| DA-OVL-03 | Notifications | Read notifications | Empty | `components/spree/notifications.tsx` |
| DA-OVL-04 | Profile dialog | Edit personal details and language (`profile.spec.ts`) | — | `components/spree/profile-dialog.tsx` |
| DA-OVL-05 | CSV import wizard, opened from products, customers, purchase orders, price lists, translations and catalogs | Upload, map columns, follow progress, see results (`imports.spec.ts`) | Required fields not mapped; semicolon-separated file | `dashboard-core/src/components/import-wizard-dialog.tsx` |

## 4. Seller panel screens

The seller panel uses the dashboard's design system and shared pages. **Code paths.** "SR/" is `packages/seller-dashboard/src/routes/`; "SP/" is `packages/seller-dashboard/src/pages/`. Each route file renders a page component. Its tests are the eight seller panel spec files in `packages/dashboard/e2e/`. The shared list and detail states in §3 apply here too, and a dash in the states column means none beyond them.

| ID | Screen and route | Scope | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| SP-AUTH-01 | Sign in, `/login` | Public | Sign in; sign out back to it (`seller-panel-home.spec.ts`) | Wrong password | SP/`login.tsx` |
| SP-AUTH-02 | Forgot password, `/forgot-password` | Public | Request a reset link (`seller-panel-home.spec.ts`) | Sent | SP/`forgot-password.tsx` |
| SP-AUTH-03 | Reset password, `/reset-password` | Public, with the link | Choose a new password | Invalid link | SP/`reset-password.tsx` |
| SP-AUTH-04 | Accept invitation, `/accept-invitation/$invitationId` | Public, with the link | Join a seller's team and land in its panel (`seller-invitation-acceptance.spec.ts`) | Invalid link | SP/`accept-invitation.tsx` |
| SP-SHELL-01 | Seller picker, `/` | A signed-in seller user | Choose a seller when the user belongs to several | One seller opens directly | SP/`seller-picker.tsx` |
| SP-HOME-01 | Home, `/$sellerId` | `seller_profile` | Where the seller stands, with each section a click away (`seller-panel-home.spec.ts`) | Seller status | SP/`home.tsx` |
| SP-ONB-01 | Onboarding, `/$sellerId/onboarding` | `seller_profile` | Complete the marketplace's requirements, such as accepting its terms or recording a package type (`seller-panel-home.spec.ts`, `seller-package-types.spec.ts`) | Requirement pending, accepted, rejected, waived; ready for review | SP/`onboarding.tsx`; `components/onboarding-nav-badge.tsx` |
| SP-PRD-01 | Products, `/$sellerId/products` | `products` | List, change status, delete after confirming (`seller-panel-products.spec.ts`) | Draft, active, archived, proposed, rejected | SP/`products.tsx` |
| SP-PRD-02 | New product, `/$sellerId/products/new` | `products`, write | List a product (`seller-catalog.spec.ts`) | Field errors | SP/`product.tsx` |
| SP-PRD-03 | Product, `/$sellerId/products/$productId` | `products` | Rename; submit a draft for review (`seller-panel-products.spec.ts`) | Submission pending, approved, rejected, withdrawn | SP/`product.tsx`; slot `seller.product.form_sidebar` |
| SP-ORD-01 | Orders, `/$sellerId/orders` | `orders` | List the seller's own orders (`seller-panel-earnings.spec.ts`) | Fulfillment statuses | SP/`orders.tsx` |
| SP-ORD-02 | Order, `/$sellerId/orders/$orderId` | `orders`, `fulfillments` | Fulfil, split, labels, deliveries, returns, cancel; see what it earned (`seller-panel-earnings.spec.ts`) | Fulfillment statuses | SP/`order.tsx`; `components/orders/`; slot `seller.order.form_sidebar` |
| SP-FIN-01 | Earnings, `/$sellerId/earnings` | `seller_earnings` | Balance and the sales behind it (`seller-panel-earnings.spec.ts`) | — | SP/`earnings.tsx`; `components/finance/balance-summary.tsx` |
| SP-FIN-02 | Payouts, `/$sellerId/payouts` | `seller_earnings` | List payouts (`seller-panel-earnings.spec.ts`) | Pending, processing, completed, failed, unresolved | SP/`payouts.tsx` |
| SP-FIN-03 | Payout, `/$sellerId/payouts/$payoutId` | `seller_earnings` | The earnings a payout covers (`seller-panel-earnings.spec.ts`) | The statuses above | SP/`payout.tsx`; slot `seller.payout.form_sidebar` |
| SP-PRF-01 | Profile, `/$sellerId/profile` | `seller_profile` | Description, contact, business details, addresses, returns location, tax identifiers (`seller-panel-settings.spec.ts`) | Status help | SP/`profile.tsx`; slots `seller.profile.form_main`, `seller.profile.form_sidebar` |
| SP-SET-01 | Settings index, `/$sellerId/settings` | Any; cards need their own scopes | Each card opens its page (`seller-panel-settings.spec.ts`) | Hidden from the navigation when no card is allowed | SR/`_authenticated/$sellerId/settings/index.tsx`; `nav/settings.ts` |
| SP-SET-02 | Delivery methods, `/$sellerId/settings/delivery-methods` | `delivery_methods` | Price the seller's own shipping (`seller-delivery-methods.spec.ts`) | — | SP/`delivery-methods.tsx` |
| SP-SET-03 | Package types, `/$sellerId/settings/package-types` | `package_types` | Record the boxes the seller ships in (`seller-package-types.spec.ts`) | — | SR/`…/settings/package-types.tsx`; `dashboard-core/src/pages/package-types.tsx` |
| SP-SET-04 | Policies, `/$sellerId/settings/policies` | `seller_profile` | Write, edit, delete a policy (`seller-panel-settings.spec.ts`) | — | SP/`policies.tsx` |
| SP-SET-05 | Stock locations, `/$sellerId/settings/stock-locations` | `stock` | Add the seller's own location (`seller-panel-settings.spec.ts`) | — | SR/`…/settings/stock-locations.tsx`; `dashboard-core/src/pages/stock-locations.tsx` |
| SP-SET-06 | Team, `/$sellerId/settings/team` | `seller_profile`, write | Invite and revoke a colleague; the last member stays (`seller-panel-settings.spec.ts`) | Pending invitation; last member | SP/`team.tsx`; slots `seller.team.actions`, `seller.team.after` |

Layouts without a screen ID: SR/`__root.tsx`, SR/`_authenticated.tsx`, SR/`_authenticated/$sellerId.tsx` (the panel chrome, SP-OVL-01), SR/`_authenticated/$sellerId/settings.tsx`.

| ID | Overlay | Meaningful states | Code |
|---|---|---|---|
| SP-OVL-01 | Panel chrome: sidebar, seller switcher, onboarding badge | Onboarding incomplete | `packages/seller-dashboard/src/panel-chrome.tsx`, `components/seller-switcher.tsx` |
| SP-OVL-02 | Account dialog | — | `components/account-dialog.tsx` |

## 5. Storefront screens

**Code paths.** "F/" is `src/app/[country]/[locale]/` in `liquorify-storefront`. Every customer route sits under a country and language prefix, which `src/proxy.ts` adds. Tests are in `e2e/` and have not run (LIQ-003 QV-20). Messages are in `messages/` in five languages.

### Shop

| ID | Screen and route | Who | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| SF-SHOP-01 | Home, `/` | Anyone | Hero, featured products, wholesale invitation (`catalog.spec.ts`) | Wholesale section only when wholesale is on | F/`(storefront)/page.tsx`; `components/home/` |
| SF-SHOP-02 | Products and search, `/products` | Anyone | Search, filter by price, availability and options, sort, load more (`catalog.spec.ts`) | Loading skeleton; no products found; no more products | F/`(storefront)/products/page.tsx`; `components/products/` |
| SF-SHOP-03 | Category, `/c/[...permalink]` | Anyone | Category banner, subcategories narrow the list, sort (`catalog.spec.ts`) | As SF-SHOP-02; category not found | F/`(storefront)/c/[...permalink]/page.tsx`, `CategoryBanner.tsx` |
| SF-SHOP-04 | Product, `/products/[slug]` | Anyone | Gallery and lightbox, pick colour and size, quantity, add to cart, custom fields (`product.spec.ts`) | Sale price; sold-out variant can be picked but not added; price hidden on a gated channel; product not found | F/`(storefront)/products/[slug]/page.tsx`, `ProductDetails.tsx` |
| SF-SHOP-05 | Cart, `/cart` | Anyone | Change quantity, remove, coupon and gift card, proceed to checkout (`cart.spec.ts`) | Empty cart points back to the catalog; update failed | F/`(storefront)/cart/page.tsx` |
| SF-SHOP-06 | Policy, `/policies/[slug]` | Anyone | Read a store policy | Not found; no content | F/`(storefront)/policies/[slug]/page.tsx` |

### Account

| ID | Screen and route | Who | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| SF-ACC-01 | Sign in and account overview, `/account` | Guest; customer | Sign in, then return to the page that sent the guest here; a signed-in customer sees the account overview (`auth.spec.ts`) | Wrong password; signed in | F/`(storefront)/account/page.tsx` |
| SF-ACC-02 | Register, `/account/register` | Guest | Create an account, accepting the store's policies (`auth.spec.ts`) | Passwords do not match; too short; policy consent required; registration failed | F/`(storefront)/account/register/page.tsx`; `components/policy/PolicyConsent.tsx` |
| SF-ACC-03 | Forgot password, `/account/forgot-password` | Guest | Request a reset link | Check your email | F/`(storefront)/account/forgot-password/page.tsx` |
| SF-ACC-04 | Reset password, `/account/reset-password` | Guest, with the link | Choose a new password | Invalid or expired link; success | F/`(storefront)/account/reset-password/page.tsx` |
| SF-ACC-05 | Orders, `/account/orders` | Customer | Order history (`account.spec.ts`) | No orders | F/`(storefront)/account/(authenticated)/orders/page.tsx` |
| SF-ACC-06 | Order, `/account/orders/[id]` | Customer | Items, addresses, delivery and tracking, payment, order again | Shipped, partially shipped, unfulfilled; shipment canceled; no tracking; not found | F/`…/(authenticated)/orders/[id]/page.tsx`; `components/order/` |
| SF-ACC-07 | Addresses, `/account/addresses` | Customer | Add, edit, delete, set default (`account.spec.ts`) | No addresses | F/`…/(authenticated)/addresses/page.tsx` |
| SF-ACC-08 | Payment methods, `/account/credit-cards` | Customer | Remove a saved card | No cards | F/`…/(authenticated)/credit-cards/page.tsx` |
| SF-ACC-09 | Gift cards, `/account/gift-cards` | Customer | See balances, copy a code | Active, partially used, fully redeemed, canceled, expired; none | F/`…/(authenticated)/gift-cards/page.tsx` |
| SF-ACC-10 | Profile, `/account/profile` | Customer | Update name and email (`account.spec.ts`) | Current password needed for some changes; updated | F/`…/(authenticated)/profile/page.tsx` |

Layout without a screen ID: F/`(storefront)/account/(authenticated)/layout.tsx` (the account navigation, which sends a guest to sign in).

### Checkout

| ID | Screen and route | Who | Workflows (browser tests) | Meaningful states | Code |
|---|---|---|---|---|---|
| SF-CHK-01 | Checkout, `/checkout/[id]` | Guest or customer | Contact, shipping address, delivery method per shipment, payment with Stripe, Adyen or PayPal, express checkout, coupon and gift card, place the order (`checkout.spec.ts`, with a Stripe test card) | Steps: shipping, delivery, payment; empty cart; loading methods; no payment methods; checkout error | F/`(checkout)/checkout/[id]/page.tsx`, `CheckoutPageContent.tsx`; `components/checkout/` |
| SF-CHK-02 | Confirm payment, `/confirm-payment/[id]` | Guest or customer | Return from a payment provider's extra check | Finalizing; failed | F/`(checkout)/confirm-payment/[id]/page.tsx` |
| SF-CHK-03 | Order placed, `/order-placed/[id]` | Guest or customer | Thank you, order number, where the confirmation was sent | Signed in or anonymous; not found; failed to load | F/`(checkout)/order-placed/[id]/page.tsx` |

### Wholesale portal

All wholesale routes return "not found" unless wholesale is switched on (F/`(wholesale)/wholesale/layout.tsx`). `WholesaleGate` decides what each visitor sees: a sign-in wall on a `login_required` channel, browsing without prices on a `prices_hidden` channel, an "application pending" page for a signed-in customer not yet in the Wholesale group, and the portal for an approved buyer.

| ID | Screen and route | Who | Workflows | Meaningful states | Code |
|---|---|---|---|---|---|
| SF-WHL-01 | Wholesale catalog, `/wholesale` | Approved buyer; others per the gate | Browse at trade prices | Sign-in wall; guest browsing with "sign in for pricing"; application pending; empty | F/`(wholesale)/wholesale/page.tsx`; `_components/` |
| SF-WHL-02 | Apply, `/wholesale/apply` | Guest | Register with company and phone to apply | Already a member; application received | F/`(wholesale)/wholesale/apply/page.tsx` |
| SF-WHL-03 | Wholesale sign in, `/wholesale/sign-in` | Guest | Sign in and return to the portal | Wrong password | F/`(wholesale)/wholesale/sign-in/page.tsx` |
| SF-WHL-04 | Wholesale product, `/wholesale/products/[slug]` | Approved buyer | Trade price, add to the wholesale cart | Price hidden | F/`(wholesale)/wholesale/products/[slug]/page.tsx` |
| SF-WHL-05 | Wholesale cart, `/wholesale/cart` | Approved buyer | Review trade prices, go to checkout | Empty; a nudge to unlock a better price | F/`(wholesale)/wholesale/cart/page.tsx`, `WholesaleCartView.tsx` |
| SF-WHL-06 | Quick order, `/wholesale/quick-order` | Approved buyer | Add many SKUs with quantities at once | SKU not found; not purchasable; add failed | F/`(wholesale)/wholesale/quick-order/page.tsx`, `QuickOrderView.tsx`, `SkuCombobox.tsx` |

### Overlays, system pages and development previews

| ID | Item | Meaningful states | Code |
|---|---|---|---|
| SF-OVL-01 | Header, footer and mobile menu | Categories menu; wholesale link | `components/layout/Header.tsx`, `Footer.tsx`, `MobileMenu.tsx` |
| SF-OVL-02 | Cart drawer | Empty; failed to add, update or remove | `components/cart/CartDrawer.tsx` |
| SF-OVL-03 | Search | Searching; no results | `components/layout/SearchToggle.tsx`, `components/search/SearchBar.tsx` |
| SF-OVL-04 | Region and language preferences | Updating; failed | `components/layout/RegionPreferences.tsx` |
| SF-OVL-05 | Checkout address editor | — | `components/checkout/AddressEditModal.tsx` |
| SF-SYS-01 | Application error page | — | `src/app/global-error.tsx` |
| SF-SYS-02 | Not found | Next.js's built-in page; the storefront has no `not-found.tsx` | — |
| SF-DEV-01 | Email previews list, `/dev/emails` | Development only | `src/app/dev/emails/page.tsx` |
| SF-DEV-02 | Email preview, `/dev/emails/[template]` | Development only | `src/app/dev/emails/[template]/page.tsx` |

Layouts without a screen ID: F/`layout.tsx`, F/`(storefront)/layout.tsx`, F/`(checkout)/layout.tsx`, `src/app/dev/layout.tsx`, and the account and wholesale layouts named above. The route handler `src/app/api/webhooks/spree/route.ts` has no screen; it sends the storefront emails below.

## 6. Emails

Liquid templates are written in MJML and share `layouts/spree/base_mailer.liquid`. Customer emails take their colours and font from the store's email branding (DA-SET-03); merchants may edit the 11 marked "editable" (DA-SET-05), along with the layout and the five shared partials. A store can turn Spree's customer emails off, for example when the storefront sends its own.

| ID | Email | To | Sent when | Editable | Code |
|---|---|---|---|---|---|
| EM-C-01 | Order confirmation | Customer | An order is placed | Yes | `spree/emails/app/views/spree/order_mailer/confirm_email.liquid` |
| EM-C-02 | Order canceled | Customer | An order is canceled | Yes | `…/order_mailer/cancel_email.liquid` |
| EM-C-03 | Payment link | Customer | Staff send a payment link for an order | Yes | `…/order_mailer/payment_link_email.liquid` |
| EM-C-04 | Order group confirmation | Customer | A marketplace order split across sellers is placed | Yes | `…/order_group_mailer/confirm_email.liquid` |
| EM-C-05 | Shipment sent | Customer | A fulfilment is shipped | Yes | `…/fulfillment_mailer/fulfilled_email.liquid` |
| EM-C-06 | Return refunded | Customer | A return is refunded | Yes | `…/return_mailer/refunded_email.liquid` |
| EM-C-07 | Digital files ready | Customer | Digital downloads are available | Yes | `…/digital_asset_mailer/files_ready_email.liquid` |
| EM-C-08 | Password reset | Customer | A customer asks to reset their password | Yes | `…/customer_mailer/password_reset_email.liquid` |
| EM-C-09 | Data export ready | Customer | A customer's data export is ready | Yes | `…/customer_mailer/data_export_email.liquid` |
| EM-C-10 | Newsletter confirmation | Subscriber | Someone subscribes to the newsletter | Yes | `…/newsletter_mailer/email_confirmation.liquid` |
| EM-C-11 | Company invitation | Invited buyer | Staff invite someone to a company | Yes | `…/company_mailer/invitation_email.liquid` |
| EM-O-01 | New order notification | Store | An order is placed | No | `…/order_mailer/store_owner_notification_email.liquid` |
| EM-O-02 | New order group notification | Store | A marketplace order group is placed | No | `…/order_group_mailer/store_owner_notification_email.liquid` |
| EM-O-03 | Seller approved | Seller | The operator approves a seller | No | `…/seller_mailer/approved_email.liquid` |
| EM-O-04 | Seller rejected | Seller | The operator rejects a seller | No | `…/seller_mailer/rejected_email.liquid` |
| EM-O-05 | Seller suspended | Seller | The operator suspends a seller | No | `…/seller_mailer/suspended_email.liquid` |
| EM-S-01 | Staff password reset | Staff member | A staff member asks to reset their password | No | `spree/core/app/views/spree/admin_user_mailer/password_reset_email.liquid` |
| EM-S-02 | Seller user password reset | Seller user | A seller user asks to reset their password | No | `…/seller_user_mailer/password_reset_email.liquid` |
| EM-S-03 | Invitation | Invitee | Staff or a seller invite someone | No | `…/invitation_mailer/invitation_email.liquid` |
| EM-S-04 | Invitation accepted | Inviter | The invitation is accepted | No | `…/invitation_mailer/invitation_accepted.liquid` |
| EM-S-05 | Export done | Staff member | A CSV or report export finishes | No | `…/export_mailer/export_done.liquid` |
| EM-S-06 | Import done | Staff member | A CSV import finishes | No | `…/import_mailer/import_done.liquid` |
| EM-S-07 | Webhook endpoint disabled | Store | An endpoint is disabled after failing deliveries | No | `…/webhook_mailer/endpoint_disabled.liquid` |
| EM-SF-01 | Order confirmation | Customer | The storefront receives `order.placed` | No (code) | `src/lib/emails/order-confirmation.tsx` |
| EM-SF-02 | Order canceled | Customer | The storefront receives `order.canceled` | No (code) | `src/lib/emails/order-canceled.tsx` |
| EM-SF-03 | Shipment shipped | Customer | The storefront receives `order.fulfilled` | No (code) | `src/lib/emails/shipment-shipped.tsx` |
| EM-SF-04 | Password reset | Customer | The storefront receives `customer.password_reset_requested` | No (code) | `src/lib/emails/password-reset.tsx` |

The storefront emails send through Resend when its key is set, and otherwise are written locally for development (`src/lib/emails/send.ts`). Shared Liquid partials: `_line_item`, `_order_summary`, `_purchase_totals`, `_fulfillment_group` (in `spree/emails`) and `_summary_row` (in core).

## 7. Cross-screen flows

Each flow is a path a person takes across screens. The Figma flow diagrams (FB-21) use these IDs.

| ID | Flow | Screens and emails, in order | Browser test |
|---|---|---|---|
| FL-01 | Install the platform and its first store | DA-AUTH-01 → DA-SETUP-01 → DA-HOME-01 → DA-HOME-02 and the six setup tasks | `first-run/setup.spec.ts`, `getting-started.spec.ts` |
| FL-02 | Invite a staff member | DA-SET-24 → EM-S-03 → DA-AUTH-04 → EM-S-04 → DA-SHELL-01 | `invitation-acceptance.spec.ts` |
| FL-03 | Staff password reset | DA-AUTH-01 → DA-AUTH-02 → EM-S-01 → DA-AUTH-03 → DA-AUTH-01 | `auth.spec.ts` (in part) |
| FL-04 | Create and publish a product | DA-PRD-02 → DA-PRD-03 (variants, prices, stock, media, channels) → SF-SHOP-04 | `products-new.spec.ts`, `products-publishing.spec.ts` |
| FL-05 | Buy as a shopper | SF-SHOP-01 → SF-SHOP-02 or SF-SHOP-03 → SF-SHOP-04 → SF-OVL-02 → SF-SHOP-05 → SF-CHK-01 → SF-CHK-02 when the provider asks → SF-CHK-03 → EM-C-01 or EM-SF-01 → DA-ORD-01 → DA-ORD-04 | `checkout.spec.ts` (storefront, not run) |
| FL-06 | Fulfil an order | DA-ORD-04 (fulfil, label, delivery) → EM-C-05 or EM-SF-03 → SF-ACC-06 | `order-fulfillments.spec.ts` |
| FL-07 | Return, exchange or claim | DA-ORD-04 → DA-ORD-06, DA-ORD-07 or DA-ORD-08 → refund → EM-C-06 | `post-sale.spec.ts` |
| FL-08 | Staff-created order paid by link | DA-ORD-03 → DA-ORD-02 → DA-ORD-04 → EM-C-03 → SF-CHK-01 → SF-CHK-03 | `orders.spec.ts` (draft only) |
| FL-09 | Shopper account | SF-ACC-02 → SF-ACC-01 → SF-ACC-05 to SF-ACC-10; password reset SF-ACC-03 → EM-C-08 or EM-SF-04 → SF-ACC-04 | `auth.spec.ts`, `account.spec.ts` (storefront) |
| FL-10 | Become a wholesale buyer and order | SF-WHL-02 → SF-WHL-01 (pending) → staff add the customer to the Wholesale group in DA-CUS-01 or DA-CUS-02 → SF-WHL-03 → SF-WHL-01 → SF-WHL-06 or SF-WHL-04 → SF-WHL-05 → SF-CHK-01 | None |
| FL-11 | Admit a seller | DA-SEL-01 → DA-SEL-02 invite → EM-S-03 → SP-AUTH-04 → SP-ONB-01 → DA-SEL-02 approve → EM-O-03 → SP-HOME-01 | `seller-invitation-acceptance.spec.ts`, `sellers.spec.ts` |
| FL-12 | A seller's product reviewed | SP-PRD-02 → SP-PRD-03 submit → DA-PRD-03 review → SP-PRD-01 | `seller-panel-products.spec.ts` |
| FL-13 | A seller's order, earnings and payout | SF-CHK-01 → EM-C-04 → SP-ORD-01 → SP-ORD-02 fulfil → SP-FIN-01 → DA-SEL-05 mark paid → SP-FIN-02 → SP-FIN-03 | `seller-panel-earnings.spec.ts`, `seller-ledger.spec.ts` |
| FL-14 | Move stock between locations | DA-INV-03 → DA-INV-04 (ready, in transit, received) → DA-INV-01 | `stock-transfers.spec.ts` |
| FL-15 | Buy stock from a supplier | DA-INV-10 → DA-INV-07 → DA-INV-08 (ordered, received) → DA-INV-01 | `purchase-orders.spec.ts` |
| FL-16 | Run a promotion | DA-PRM-02 → SF-SHOP-05 or SF-CHK-01 coupon → DA-ORD-04 discounts | `promotions.spec.ts` (dashboard only) |
| FL-17 | Issue and redeem a gift card | DA-LOY-01 → SF-CHK-01 gift card → SF-ACC-09 | `gift-cards.spec.ts` (dashboard only) |
| FL-18 | Brand and edit customer emails | DA-SET-03 → DA-SET-04 → DA-SET-05 (draft, test, publish, revert) → the EM-C emails | `store-settings.spec.ts` (branding only) |
| FL-19 | Connect a storefront or integration | DA-HOME-02 storefront task → DA-SET-26 → DA-SET-30 → DA-SET-28 and DA-SET-29 | `api-keys.spec.ts`, `allowed-origins.spec.ts`, `webhooks.spec.ts` |
| FL-20 | Connect an AI agent | DA-SET-07 → DA-SET-32 → DA-SET-07 revoke | `ai-agents.spec.ts` |
| FL-21 | Import from CSV | DA-PRD-01, DA-CUS-01 or another list → DA-OVL-05 → EM-S-06 → DA-SET-31 | `imports.spec.ts` |
| FL-22 | Build and export a report | DA-RPT-02 → DA-RPT-03 → export → EM-S-05 | `reports.spec.ts` (export not tested) |
| FL-23 | Customer privacy request | DA-CUS-02 privacy → EM-C-09, or erase | `customers.spec.ts` (erase only) |
| FL-24 | Set up a role and give it to a teammate | DA-SET-25 → DA-SET-24 → the teammate's navigation shows only what the role allows | `roles.spec.ts`, `staff.spec.ts` |

## 8. What this inventory does not show

- **Behaviour.** Nothing was run for it. A workflow named here exists in code; a browser test name shows only that Spree tests it.
- **Every dialog and sheet.** They are listed under the screen that opens them, through its workflows and code, not one by one.
- **The APIs, the AI agent server and the command-line tools** have no screens. They are features in [LIQ-006](LIQ-006-product-capability-baseline.md).
- **Enterprise screens** are not in these repositories. LIQ-006 lists them separately.
- **Liquorify dispositions** are in LIQ-006, not here.

## 9. How this links to the other records

- **SES-001.** Information Architecture (PD-07), Interaction Design (PD-08), Content Design (PD-10) and UX Design (PD-19) for what exists; Browser Testing (QV-07) for the test coverage named per screen ([LIQ-003](LIQ-003-engineering-baseline.md#3-capability-baseline)).
- **Work items.** FB-21 reproduces these screens, wireframes and flows in Figma; FB-19 documents their components in Storybook ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)).
- **When to revise it.** When Liquorify takes a new Spree or storefront revision (FB-12): new screens take new IDs, removed ones are marked, and the counts in §1 are updated.
