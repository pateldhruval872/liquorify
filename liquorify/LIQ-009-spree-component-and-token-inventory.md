---
document_id: LIQ-009
title: Spree Component and Token Inventory
version: 0.4-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-22
---

# Spree Component and Token Inventory

Every component and design token in Spree's existing design systems, at the pinned revisions, with a stable ID and the SES capabilities each one supports. It is part of the Spree product baseline ([LIQ-006](LIQ-006-product-capability-baseline.md)) and is the list the Figma reproduction (FB-20) and the Storybook stories and Playwright reference screenshots (FB-19) must cover ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)). The screens built from these components are in [LIQ-008](LIQ-008-spree-screen-inventory.md).

**It describes what exists.** No Liquorify component or token exists yet, and none is proposed here. How Liquorify would later extend these systems is the subject of the proposed decision record [LIQ-007](LIQ-007-design-system-adoption-and-extension.md).

## 1. Scope, method and counts

- **Revisions.** Backend `liquorify` at `1d1f2d4` and storefront `liquorify-storefront` at `ac53c5b`.
- **Method.** Reading only, on 2026-10-21. Components are the `.tsx` files in the folders named below, without tests. Tokens are the CSS custom properties declared in the two stylesheets below, read with their light and dark values; the email values come from `Spree::Emails::Branding`. Nothing was rendered or measured.
- **IDs are permanent.** A component or token keeps its ID if it is renamed. One removed upstream keeps its row, marked as removed. A new one takes the next number in its table.
- **Some IDs name a group.** The application components (CMP-DA-G, CMP-SP-G), the storefront feature components (CMP-SF-G), the colour utility aliases (TK-DUI-A, TK-SF-A) and the Tailwind palette colours (TK-TW-D, TK-TW-S) have one ID per group, and each member is named in its row. The group ID with the member's name is that member's reference.
- **Storybook and Figma columns.** The component tables in §2 to §4 name the Storybook story that covers each component ([LIQ-010 §10](LIQ-010-design-system-reproduction-architecture.md#10-traceability-to-the-inventory-ids)), and a group row names each covered file with its story. A row stays empty until its batch is done, or takes a reason code when a component cannot be shown in Storybook (LIQ-010 §7.5). The Figma column is filled by FB-20. The storefront's tables in §5 gained the columns with the storefront shopper accounts batch, which also names the pilot's storefront stories. Tokens are shown a family at a time, so §6 and §8 name their Storybook page once rather than on every row.

| System | Used by | Components | Tokens |
|---|---|---|---|
| Dashboard design system, `@spree/dashboard-ui` 1.0.0-rc.4 | Admin dashboard and seller panel | 46 primitives, 54 composed components | 62 light and 58 dark values in `:root` and `.dark`; 84 theme entries; 48 Tailwind palette colours |
| Dashboard framework, `@spree/dashboard-core` | Admin dashboard and seller panel | 39 components, 3 shared pages, 9 product form modules | Uses the design system's |
| Admin dashboard application, `@spree/dashboard` | Admin dashboard | 200 components in 24 groups | Uses the design system's |
| Seller panel application, `@spree/seller-dashboard` | Seller panel | 28 components | Uses the design system's |
| Storefront | Shoppers | 22 primitives, 66 feature components, 13 page-level components | 32 light and 31 dark values; 58 theme entries; 44 Tailwind palette colours |
| Emails | Customers, staff and sellers | 1 layout and 5 shared partials (LIQ-008 §6) | 5 colours and a font per store |

### How the systems relate

- **The dashboard and the seller panel share one design system.** The seller panel's stylesheet imports `@spree/dashboard-ui/styles.css`, so both have the same components, tokens and look. Shared pages and data-bound pieces live in `@spree/dashboard-core`.
- **Design system components are headless.** They take data through props and import no providers or data hooks (backend `CLAUDE.md`). An application wraps one with its own data; for example, the dashboard and the seller panel each have a `fulfillments-card` built on the same design system parts.
- **The storefront has its own system.** shadcn components on Radix, in its own repository, with its own tokens. It shares no code with the dashboard.
- **What the two share.** Tailwind 4, shadcn's token names, neutral palettes in the oklch colour space, Lucide icons, the Geist font, and light and dark token values switched by a `.dark` class. The dashboard applies that class; the storefront declares dark values but never applies it (§7). Both are configured with shadcn's `radix-nova` style name (`packages/dashboard/components.json`, the storefront's `components.json`), but 22 of the dashboard's 46 primitives are built on Base UI, not Radix.
- **Emails are separate.** Their look comes from the Liquid layout and each store's branding values, not from either stylesheet.

### Kinds and the SES capabilities they support

Every component and token supports Design System Engineering (PD-13), and each is a target for visual regression baselines (QV-08). The kind adds the capabilities below ([SES-001 §3](framework/SES-001.md#3-capability-catalog)).

| Kind | What it covers | Also supports |
|---|---|---|
| Action | Buttons and controls that start something | PD-08 interaction, PD-10 content, PD-11 accessibility, AE-01 frontend |
| Input | Form fields and pickers | PD-08, PD-10, PD-11, AE-01, QV-09 accessibility verification |
| Overlay | Dialogs, sheets, menus, popovers, tooltips | PD-08, PD-11, AR-04 interface architecture, QV-09 |
| Navigation | Sidebars, tabs, breadcrumbs, pagination, wizards | PD-07 information architecture, PD-08, PD-11 |
| Data | Tables, grids, charts | PD-07, PD-08, PD-09 visual design, AE-01 |
| Display | Read-only presentation | PD-09, PD-10 |
| Layout | Structure and spacing | PD-09, AR-04 |
| Feedback | Alerts, empty and loading states, toasts, errors, announcements | PD-08, PD-10, PD-11 |
| Disclosure | Showing and hiding content | PD-07, PD-08, PD-11 |
| Extension | Plugin slots and permission gates | AR-04 |
| Theme | Light and dark switching | PD-09, PD-11 |
| Tokens | Colour, type, radius, shadow, spacing, motion | PD-09, PD-11 (contrast), AE-01 |

## 2. Dashboard design system components

### Primitives

`packages/dashboard-ui/src/ui/<component>.tsx`. Shadcn components adapted to Base UI where a behaviour library is needed. "—" means styled HTML with no behaviour library.

| ID | Component | Kind | Built on | Storybook | Figma |
|---|---|---|---|---|---|
| CMP-DUI-P-01 | `accordion` | Disclosure | Base UI | Dashboard UI/Primitives/Accordion | |
| CMP-DUI-P-02 | `alert` | Feedback | — | Dashboard UI/Primitives/Alert | |
| CMP-DUI-P-03 | `attachment` | Display | Base UI | | |
| CMP-DUI-P-04 | `avatar` | Display | Base UI | Dashboard UI/Primitives/Avatar | |
| CMP-DUI-P-05 | `badge` | Display | — | Dashboard UI/Primitives/Badge | |
| CMP-DUI-P-06 | `breadcrumb` | Navigation | — | Dashboard UI/Primitives/Breadcrumb | |
| CMP-DUI-P-07 | `button` | Action | — | Dashboard UI/Primitives/Button | |
| CMP-DUI-P-08 | `calendar` | Input | react-day-picker | | |
| CMP-DUI-P-09 | `card` | Layout | — | Dashboard UI/Primitives/Card | |
| CMP-DUI-P-10 | `chart` | Data | Recharts | | |
| CMP-DUI-P-11 | `checkbox` | Input | Base UI | Dashboard UI/Primitives/Checkbox | |
| CMP-DUI-P-12 | `code-editor` | Input | CodeMirror, with Liquid and HTML | | |
| CMP-DUI-P-13 | `collapsible` | Disclosure | Base UI | Dashboard UI/Primitives/Collapsible | |
| CMP-DUI-P-14 | `combobox` | Input | Base UI | | |
| CMP-DUI-P-15 | `command` | Overlay | cmdk | | |
| CMP-DUI-P-16 | `context-menu` | Overlay | Base UI | | |
| CMP-DUI-P-17 | `data-table` | Data | — | Dashboard UI/Primitives/Data table | |
| CMP-DUI-P-18 | `date-picker` | Input | date-fns, date-fns-tz | | |
| CMP-DUI-P-19 | `date-range-picker` | Input | react-day-picker, date-fns | | |
| CMP-DUI-P-20 | `dialog` | Overlay | Base UI | Dashboard UI/Primitives/Dialog | |
| CMP-DUI-P-21 | `dropdown-menu` | Overlay | Base UI | | |
| CMP-DUI-P-22 | `empty` | Feedback | — | Dashboard UI/Primitives/Empty | |
| CMP-DUI-P-23 | `field` | Input | — | Dashboard UI/Primitives/Field | |
| CMP-DUI-P-24 | `input-group` | Input | — | Dashboard UI/Primitives/Input group | |
| CMP-DUI-P-25 | `input` | Input | — | Dashboard UI/Primitives/Input | |
| CMP-DUI-P-26 | `item` | Layout | Base UI | Dashboard UI/Primitives/Item | |
| CMP-DUI-P-27 | `label` | Input | Base UI | Dashboard UI/Primitives/Label | |
| CMP-DUI-P-28 | `media-preview` | Display | — | | |
| CMP-DUI-P-29 | `pagination` | Navigation | — | Dashboard UI/Primitives/Pagination | |
| CMP-DUI-P-30 | `popover` | Overlay | Base UI | | |
| CMP-DUI-P-31 | `progress` | Feedback | Base UI | Dashboard UI/Primitives/Progress | |
| CMP-DUI-P-32 | `radio-group` | Input | Base UI | Dashboard UI/Primitives/Radio group | |
| CMP-DUI-P-33 | `rich-text-editor` | Input | Tiptap | | |
| CMP-DUI-P-34 | `scroll-area` | Layout | Base UI | Dashboard UI/Primitives/Scroll area | |
| CMP-DUI-P-35 | `select` | Input | Base UI | Dashboard UI/Primitives/Select | |
| CMP-DUI-P-36 | `separator` | Layout | Base UI | Dashboard UI/Primitives/Separator | |
| CMP-DUI-P-37 | `sheet` | Overlay | Base UI | Dashboard UI/Primitives/Sheet | |
| CMP-DUI-P-38 | `sidebar` | Navigation | — | | |
| CMP-DUI-P-39 | `skeleton` | Feedback | — | Dashboard UI/Primitives/Skeleton | |
| CMP-DUI-P-40 | `slot` | Extension | Plugin slot outlet | Dashboard UI/Primitives/Slot | |
| CMP-DUI-P-41 | `switch` | Input | Base UI | Dashboard UI/Primitives/Switch | |
| CMP-DUI-P-42 | `tabs` | Navigation | Base UI | Dashboard UI/Primitives/Tabs | |
| CMP-DUI-P-43 | `textarea` | Input | — | Dashboard UI/Primitives/Textarea | |
| CMP-DUI-P-44 | `thumbnail` | Display | — | Dashboard UI/Primitives/Thumbnail | |
| CMP-DUI-P-45 | `toast` | Feedback | Base UI | Dashboard UI/Primitives/Toast | |
| CMP-DUI-P-46 | `tooltip` | Overlay | Base UI | Dashboard UI/Primitives/Tooltip | |

### Composed components

`packages/dashboard-ui/src/spree/<component>.tsx`. Commerce-specific compositions of the primitives, still headless. The folder also holds `icons.ts` and the data grid's helper modules, which are not components.

| ID | Component | Kind | Storybook | Figma |
|---|---|---|---|---|
| CMP-DUI-C-01 | `address-block` | Display | | |
| CMP-DUI-C-02 | `address-book-row` | Display | | |
| CMP-DUI-C-03 | `back-button` | Navigation | Dashboard UI/Composed/Back button | |
| CMP-DUI-C-04 | `bulk-dialog` | Overlay | | |
| CMP-DUI-C-05 | `bulk-price-table` | Data | | |
| CMP-DUI-C-06 | `bulk-variants-table` | Data | | |
| CMP-DUI-C-07 | `calculator-summary` | Display | | |
| CMP-DUI-C-08 | `claim-resolve-dialog` | Overlay | | |
| CMP-DUI-C-09 | `color-picker` | Input | | |
| CMP-DUI-C-10 | `confirm-dialog` | Overlay | Dashboard UI/Composed/Confirm dialog | |
| CMP-DUI-C-11 | `copy-to-clipboard-button` | Action | | |
| CMP-DUI-C-12 | `country-flag` | Display | | |
| CMP-DUI-C-13 | `data-grid/cells` | Data | | |
| CMP-DUI-C-14 | `data-grid/data-grid` | Data | | |
| CMP-DUI-C-15 | `data-grid/fill-handle` | Data | | |
| CMP-DUI-C-16 | `delivery-form-dialog` | Overlay | | |
| CMP-DUI-C-17 | `drag-handle` | Action | | |
| CMP-DUI-C-18 | `editable-note-card` | Input | | |
| CMP-DUI-C-19 | `external-link` | Navigation | Dashboard UI/Composed/External link | |
| CMP-DUI-C-20 | `file-type-icon` | Display | | |
| CMP-DUI-C-21 | `form-actions` | Action | | |
| CMP-DUI-C-22 | `form-section` | Layout | | |
| CMP-DUI-C-23 | `fulfill-items-form` | Input | | |
| CMP-DUI-C-24 | `fulfillment-edit-dialog` | Overlay | | |
| CMP-DUI-C-25 | `fulfillment-item-list` | Display | | |
| CMP-DUI-C-26 | `fulfillment-panel` | Layout | | |
| CMP-DUI-C-27 | `json-preview-drawer` | Overlay | | |
| CMP-DUI-C-28 | `json-value-view` | Display | | |
| CMP-DUI-C-29 | `label-upload-dialog` | Overlay | | |
| CMP-DUI-C-30 | `language-menu-items` | Navigation | | |
| CMP-DUI-C-31 | `metadata/metadata-card` | Input | | |
| CMP-DUI-C-32 | `order-cancel-dialog` | Overlay | | |
| CMP-DUI-C-33 | `post-sale-create-dialogs` | Overlay | | |
| CMP-DUI-C-34 | `post-sale-fields` | Input | | |
| CMP-DUI-C-35 | `product-membership-list` | Data | | |
| CMP-DUI-C-36 | `products/status-card` | Input | | |
| CMP-DUI-C-37 | `quantity-tier-editor` | Input | | |
| CMP-DUI-C-38 | `relative-time` | Display | Dashboard UI/Composed/Relative time | |
| CMP-DUI-C-39 | `resource-combobox` | Input | | |
| CMP-DUI-C-40 | `resource-layout` | Layout | | |
| CMP-DUI-C-41 | `resource-multi-autocomplete` | Input | | |
| CMP-DUI-C-42 | `resource-name-cell` | Data | | |
| CMP-DUI-C-43 | `return-dialogs` | Overlay | | |
| CMP-DUI-C-44 | `route-error-boundary` | Feedback | Dashboard UI/Composed/Route error boundary | |
| CMP-DUI-C-45 | `row-actions` | Action | Dashboard UI/Composed/Row actions | |
| CMP-DUI-C-46 | `row-click-bridge` | Action | | |
| CMP-DUI-C-47 | `search-input` | Input | | |
| CMP-DUI-C-48 | `secret-input` | Input | | |
| CMP-DUI-C-49 | `storefront-visible-switch` | Input | | |
| CMP-DUI-C-50 | `tag-list` | Display | | |
| CMP-DUI-C-51 | `tax-identifiers-card` | Input | | |
| CMP-DUI-C-52 | `theme-provider` | Theme | | |
| CMP-DUI-C-53 | `theme-toggle` | Theme | | |
| CMP-DUI-C-54 | `wizard` | Navigation | | |

The package also has 5 hooks (`use-copy-to-clipboard`, `use-debounced-value`, `use-mobile`, `use-prefers-reduced-motion`, `use-scrolled`) and 5 helper modules in `src/hooks/` and `src/lib/`. It has no tests of its own; its components are exercised through the dashboard's tests.

## 3. Dashboard framework components

`packages/dashboard-core/src/components/<component>.tsx`. These connect design system parts to the dashboard's providers (sign-in, permissions, store, theme) and registries, so a story needs those providers or stand-ins for them.

| ID | Component | Kind | Storybook | Figma |
|---|---|---|---|---|
| CMP-CORE-01 | `address-form-dialog` | Overlay | | |
| CMP-CORE-02 | `app-shell` | Layout | | |
| CMP-CORE-03 | `app-sidebar` | Navigation | | |
| CMP-CORE-04 | `bulk-action-bar` | Action | | |
| CMP-CORE-05 | `can` | Extension | | |
| CMP-CORE-06 | `country-combobox` | Input | Dashboard core/Country combobox | |
| CMP-CORE-07 | `country-state-fields` | Input | | |
| CMP-CORE-08 | `currency-select` | Input | | |
| CMP-CORE-09 | `export-button` | Action | | |
| CMP-CORE-10 | `file-upload-field` | Input | | |
| CMP-CORE-11 | `image-upload-field` | Input | | |
| CMP-CORE-12 | `import-button` | Action | | |
| CMP-CORE-13 | `import-wizard-dialog` | Overlay | | |
| CMP-CORE-14 | `locale-select` | Input | | |
| CMP-CORE-15 | `market-combobox` | Input | | |
| CMP-CORE-16 | `media-picker-sheet` | Overlay | | |
| CMP-CORE-17 | `mobile-top-bar` | Navigation | | |
| CMP-CORE-18 | `money` | Display | | |
| CMP-CORE-19 | `nav-main` | Navigation | | |
| CMP-CORE-20 | `page-header` | Layout | Dashboard core/Page header | |
| CMP-CORE-21 | `page-tabs` | Navigation | | |
| CMP-CORE-22 | `preferences-form` | Input | | |
| CMP-CORE-23 | `resource-combobox` | Input | | |
| CMP-CORE-24 | `resource-multi-autocomplete` | Input | | |
| CMP-CORE-25 | `resource-picker-sheet` | Overlay | | |
| CMP-CORE-26 | `resource-table` | Data | | |
| CMP-CORE-27 | `route-announcer` | Feedback | | |
| CMP-CORE-28 | `section-heading` | Layout | | |
| CMP-CORE-29 | `settings-sidebar` | Navigation | | |
| CMP-CORE-30 | `sheet-top-bar` | Layout | | |
| CMP-CORE-31 | `sidebar-search` | Navigation | | |
| CMP-CORE-32 | `sidebar-user` | Navigation | | |
| CMP-CORE-33 | `skip-link` | Navigation | | |
| CMP-CORE-34 | `slot` | Extension | Dashboard core/Slot | |
| CMP-CORE-35 | `store-date-picker` | Input | | |
| CMP-CORE-36 | `store-switcher` | Navigation | | |
| CMP-CORE-37 | `table-toolbar` | Data | | |
| CMP-CORE-38 | `tag-combobox` | Input | | |
| CMP-CORE-39 | `top-bar-breadcrumbs` | Navigation | | |

Also in `@spree/dashboard-core`, the shared pages in `src/pages/`, used by both the dashboard and the seller panel:

| ID | Page | Kind | Used on | Storybook | Figma |
|---|---|---|---|---|---|
| CMP-CORE-PG-01 | `package-types` | Data | DA-SET-19, SP-SET-03 | | |
| CMP-CORE-PG-02 | `settings-index` | Navigation | DA-SET-01, SP-SET-01 | | |
| CMP-CORE-PG-03 | `stock-locations` | Data | DA-SET-18, SP-SET-05 | | |

And the product form modules in `src/products/`, used by DA-PRD-02 and DA-PRD-03:

| ID | Module | Kind | Storybook | Figma |
|---|---|---|---|---|
| CMP-CORE-PF-01 | `add-video-dialog` | Overlay | | |
| CMP-CORE-PF-02 | `bulk-variants-dialog` | Overlay | | |
| CMP-CORE-PF-03 | `inventory-section` | Input | | |
| CMP-CORE-PF-04 | `media-edit-sheet` | Overlay | | |
| CMP-CORE-PF-05 | `product-bulk-price-editor` | Data | | |
| CMP-CORE-PF-06 | `product-form-cards` | Input | | |
| CMP-CORE-PF-07 | `variant-edit-sheet` | Overlay | | |
| CMP-CORE-PF-08 | `variants-options-builder` | Input | | |
| CMP-CORE-PF-09 | `variants-section` | Data | | |

## 4. Application components

These are compositions bound to one application's data hooks and API. They are listed by group, with the screens that use them; a story for one needs mocked data.

### Admin dashboard

`packages/dashboard/src/components/spree/`.

| ID | Group | Files | Components | Used on | Storybook | Figma |
|---|---|---|---|---|---|---|
| CMP-DA-G-01 | `api-keys/` | 6 | `api-key-create-sheet`, `api-key-edit-sheet`, `api-key-form-fields`, `api-key-scope-picker`, `api-key-table`, `api-key-token-reveal-dialog` | DA-SET-26 | `api-key-table`: Admin dashboard/API keys/API key table | |
| CMP-DA-G-02 | `bulk-price-editor/` | 2 | `bulk-price-editor`, `bulk-price-editor-dialog` | DA-PRD-03, DA-PRD-17 | | |
| CMP-DA-G-03 | `categories/` | 4 | `category-form`, `category-list`, `category-products-card`, `category-tree` | DA-PRD-07 to DA-PRD-09 | | |
| CMP-DA-G-04 | `collections/` | 3 | `collection-form`, `collection-products-card`, `collection-rules-card` | DA-PRD-10 to DA-PRD-12 | | |
| CMP-DA-G-05 | `command-palette/` | 1 | `command-palette` | DA-OVL-02 | | |
| CMP-DA-G-06 | `custom-fields/` | 2 | `custom-fields-inline`, `definition-form` | DA-SET-09 and the detail pages with custom fields | | |
| CMP-DA-G-07 | `customers/` | 10 | `customer-addresses-card`, `customer-groups-card`, `customer-internal-note-card`, `customer-last-order-card`, `customer-lifetime-stats-card`, `customer-orders-card`, `customer-privacy-card`, `customer-profile-card`, `customer-store-credits-card`, `customer-tax-identifiers-card` | DA-CUS-02 | | |
| CMP-DA-G-08 | `email-templates/` | 8 | `conflict-dialog`, `default-diff-dialog`, `email-preview-frame`, `emails-tabs`, `history-sheet`, `preview-card`, `problems-alert`, `variables-card` | DA-SET-03 to DA-SET-05 | | |
| CMP-DA-G-09 | `imports/` | 1 | `import-wizard-dialog` | DA-OVL-05, DA-SET-31 | | |
| CMP-DA-G-10 | `integrations/` | 3 | `configure-integration-sheet`, `integration-card`, `setup-guide-link` | DA-SET-10 | | |
| CMP-DA-G-11 | `orders/` | 26 | `fulfillment-deliveries`, `fulfillment-delivery-dialog`, `fulfillment-edit-dialog`, `fulfillment-fulfill-form`, `fulfillment-label-upload-dialog`, `fulfillments-card`, `line-item-dialogs`, `line-item-price-source`, `order-adjustments-cards`, `order-cancel-dialog`, `order-commission-lines-card`, `order-customer-card`, `order-discounts-sidebar-card`, `order-edit-items-table`, `order-header`, `order-logistics-card`, `order-marketplace-card`, `order-notes-cards`, `order-payments-card`, `order-purchase-order-card`, `order-seller-transfers-card`, `order-skeleton`, `order-summary-card`, `payment-details-dialog`, `shipping-documents`, `shipping-label-row` | DA-ORD-01 to DA-ORD-05 | | |
| CMP-DA-G-12 | `payment-method-editors/` | 2 | `payment-method-form`, `payment-method-sheets` | DA-SET-10, DA-SET-12 | | |
| CMP-DA-G-13 | `price-list-editors/` | 7 | `price-list-form`, `rule-channel`, `rule-customer`, `rule-customer-group`, `rule-market`, `rule-volume`, `status-badge` | DA-PRD-15 to DA-PRD-17 | | |
| CMP-DA-G-14 | `products/` | 9 | `digital-asset-edit-sheet`, `digital-asset-provider-sheet`, `digital-assets-card`, `digital-files-form-card`, `product-custom-fields-provider`, `product-review-actions`, `product-seller-card`, `provider-settings-fields`, `publishing-card` | DA-PRD-03 | | |
| CMP-DA-G-15 | `promotion-editors/` | 13 | `action-adjustment`, `action-create-line-items`, `editor-shell`, `match-policy-picker`, `promotion-form`, `rule-category`, `rule-channel`, `rule-country`, `rule-customer-group`, `rule-market`, `rule-option-value`, `rule-product`, `rule-user` | DA-PRM-02, DA-PRM-03 | | |
| CMP-DA-G-16 | `reasons/` | 1 | `reason-section` | DA-SET-15, DA-SET-21 | | |
| CMP-DA-G-17 | `reporting/` | 5 | `growth-badge`, `report-builder`, `report-view`, `report-workspace`, `save-report-dialog` | DA-HOME-01, DA-RPT-01 to DA-RPT-03 | | |
| CMP-DA-G-18 | `sellers/` | 14 | `payout-complete-dialog`, `seller-address-card`, `seller-at-a-glance-card`, `seller-balance-card`, `seller-brand-card`, `seller-contact-card`, `seller-edit-profile-sheet`, `seller-edit-settlement-sheet`, `seller-invite-sheet`, `seller-onboarding-card`, `seller-read-row`, `seller-settlement-card`, `seller-status-card`, `seller-team-card` | DA-SEL-01 to DA-SEL-06 | | |
| CMP-DA-G-19 | `setup-tasks/` | 3 | `add-products-task`, `store-address-task`, `storefront-connect-task` | DA-HOME-02 | | |
| CMP-DA-G-20 | `shipping/` | 14 | `delivery-digital-methods-card`, `delivery-method-form`, `delivery-method-list`, `delivery-method-sheet`, `delivery-origin-group-dialog`, `delivery-origin-group-section`, `delivery-pickup-card`, `delivery-profile-general-card`, `delivery-profile-origins-card`, `delivery-zone-card`, `delivery-zone-region-picker`, `delivery-zone-sheet`, `delivery-zones-and-methods-section`, `stock-location-scope-field` | DA-SET-16, DA-SET-17 | | |
| CMP-DA-G-21 | `store-credits/` | 2 | `edit-store-credit-dialog`, `issue-store-credit-dialog` | DA-LOY-02, DA-CUS-02 | | |
| CMP-DA-G-22 | `taxes/` | 2 | `market-tax-providers`, `taxes-tabs` | DA-SET-13 to DA-SET-15 | | |
| CMP-DA-G-23 | `translations/` | 2 | `resource-translations-card`, `resource-translations-dialog` | DA-PRD-03, DA-PRD-05, DA-PRD-06 | | |
| CMP-DA-G-24 | Top level | 60 | `actor-label`, `agent-connections-card`, `auth-shell`, `catalog-audience`, `catalog-price-columns`, `catalog-pricing-fields`, `catalog-terms-card`, `catalog-wizard-dialog`, `channel-select`, `choice-card-picker`, `close-short-dialog`, `company-address-sheet`, `company-combobox-option`, `company-kind-badge`, `deferred-product-membership-card`, `enterprise-upsell`, `getting-started-nav-badge`, `inventory-cells`, `inventory-status-badge`, `jurisdiction-label`, `mcp-connect-sheet`, `media-rich-text-editor`, `nav-counter-badge`, `no-store-access`, `notifications`, `oauth-application-sheet`, `order-digital-links-card`, `order-post-sale-cards`, `order-returns-card`, `order-routing-rules-section`, `permission-picker`, `post-sale-create-dialogs`, `price-list-csv-buttons`, `product-membership-staging`, `profile-dialog`, `purchase-order-form`, `quantity-cell`, `reason-field`, `receive-delivery-card`, `release-notes`, `resource-image-field`, `role-sheet`, `route-pending`, `settings-list-card`, `stock-history-card`, `stock-levels-panel`, `stock-receipts-card`, `stock-transfer-form`, `store-setup-fields`, `storefront-connect-sheet`, `supplier-sheet`, `tax-category-label`, `tax-exemption-certificates-card`, `tax-identifiers-card`, `tax-provider-field`, `transfer-cancel-dialog`, `type-picker-sheet`, `variant-line-editor`, `variant-link`, `webhook-endpoint-form` | Across the dashboard; for example `auth-shell` on DA-AUTH-01 to DA-AUTH-04, the `catalog-*` parts on DA-PRD-13 and DA-PRD-14, `role-sheet` and `permission-picker` on DA-SET-25, `webhook-endpoint-form` on DA-SET-28 and DA-SET-29, `enterprise-upsell` on DA-CUS-05 | `auth-shell`: Admin dashboard/Sign-in/Auth shell; `no-store-access`: Admin dashboard/Sign-in/No store access; `permission-picker`: Admin dashboard/Roles/Permission picker; `role-sheet`: Admin dashboard/Roles/Role sheet | |

### Seller panel

`packages/seller-dashboard/src/components/`.

| ID | Group | Files | Components | Used on | Storybook | Figma |
|---|---|---|---|---|---|---|
| CMP-SP-G-01 | `finance/` | 1 | `balance-summary` | SP-FIN-01 | `balance-summary`: Seller panel/Finance/Balance summary | |
| CMP-SP-G-02 | `orders/` | 16 | `fulfillment-deliveries`, `fulfillment-delivery-dialog`, `fulfillment-edit-dialog`, `fulfillment-fulfill-form`, `fulfillment-label-upload-dialog`, `fulfillment-split-dialog`, `fulfillments-card`, `order-cancel-dialog`, `order-cards`, `order-earnings-card`, `order-notes-cards`, `order-payment-card`, `post-sale-cards`, `post-sale-create-dialogs`, `returns-card`, `shipping-label-row` | SP-ORD-02 | | |
| CMP-SP-G-03 | Top level | 11 | `account-dialog`, `centered-message`, `onboarding-nav-badge`, `product-status-card`, `read-row`, `retryable-error`, `seller-address-card`, `seller-business-card`, `seller-returns-location-card`, `seller-switcher`, `seller-tax-identifiers-card` | SP-OVL-01, SP-OVL-02, SP-PRF-01, SP-PRD-03 and the error and empty states across the panel | | |

## 5. Storefront components

### Primitives

`src/components/ui/<component>.tsx` in `liquorify-storefront`, shadcn's `radix-nova` style on Radix.

| ID | Component | Kind | Built on | Storybook | Figma |
|---|---|---|---|---|---|
| CMP-SF-P-01 | `alert-dialog` | Overlay | Radix | Storefront/UI/Alert dialog | |
| CMP-SF-P-02 | `alert` | Feedback | — | Storefront/UI/Alert | |
| CMP-SF-P-03 | `badge` | Display | Radix | | |
| CMP-SF-P-04 | `button` | Action | Radix | Storefront/UI/Button | |
| CMP-SF-P-05 | `card` | Layout | — | Storefront/UI/Card | |
| CMP-SF-P-06 | `category-image` | Display | Next.js image | | |
| CMP-SF-P-07 | `checkbox` | Input | Radix | Storefront/UI/Checkbox | |
| CMP-SF-P-08 | `dialog` | Overlay | Radix | Storefront/UI/Dialog | |
| CMP-SF-P-09 | `dropdown-menu` | Overlay | Radix | | |
| CMP-SF-P-10 | `field` | Input | — | Storefront/UI/Field | |
| CMP-SF-P-11 | `input-group` | Input | — | | |
| CMP-SF-P-12 | `input` | Input | — | Storefront/UI/Input | |
| CMP-SF-P-13 | `label` | Input | Radix | Storefront/UI/Label | |
| CMP-SF-P-14 | `native-select` | Input | — | Storefront/UI/Native select | |
| CMP-SF-P-15 | `popover` | Overlay | Radix | | |
| CMP-SF-P-16 | `product-image` | Display | Next.js image | Storefront/UI/Product image | |
| CMP-SF-P-17 | `quantity-picker` | Input | — | | |
| CMP-SF-P-18 | `radio-group` | Input | Radix | | |
| CMP-SF-P-19 | `separator` | Layout | Radix | | |
| CMP-SF-P-20 | `sheet` | Overlay | Radix | | |
| CMP-SF-P-21 | `sonner` | Feedback | Sonner, next-themes | Storefront/UI/Toaster | |
| CMP-SF-P-22 | `textarea` | Input | — | | |

### Feature components

`src/components/<group>/` in `liquorify-storefront`. 58 of the storefront's 88 component files are client components; the other 30 have no `"use client"` line and run on the server or on both sides, which matters for Storybook, whose Next.js support treats server components as experimental.

| ID | Group | Files | Components | Used on | Storybook | Figma |
|---|---|---|---|---|---|---|
| CMP-SF-G-01 | `account/` | 6 | AccountShell, AuthenticatedAccountShell, CreditCardList, GiftCardList, OrderDetail, OrderList | SF-ACC | `AccountShell`: Storefront/Account/Account shell; `AuthenticatedAccountShell`: Storefront/Account/Authenticated account shell; `CreditCardList`: Storefront/Account/Credit card list; `GiftCardList`: Storefront/Account/Gift card list; `OrderDetail`: Storefront/Account/Order detail; `OrderList`: Storefront/Account/Order list | |
| CMP-SF-G-02 | `addresses/` | 1 | AddressManagement | SF-ACC-07, SF-CHK-01 | `AddressManagement`: Storefront/Addresses/Address management | |
| CMP-SF-G-03 | `cart/` | 2 | CartDrawer, QuantityPickerField | SF-OVL-02, SF-SHOP-05 | `CartDrawer`: Storefront/Cart/Cart drawer | |
| CMP-SF-G-04 | `checkout/` | 12 | AddressEditModal, AddressFormFields, AddressSection, AddressSelector, AdyenPaymentForm, CouponCode, DeliveryMethodSection, ExpressCheckoutButton, PayPalPaymentForm, PaymentSection, StripePaymentForm, Summary | SF-CHK-01, SF-OVL-05 | `AddressEditModal`: Storefront/Checkout/Address edit modal; `AddressFormFields`: Storefront/Checkout/Address form fields | |
| CMP-SF-G-05 | `home/` | 3 | FeaturedProductsSection, HeroSection, WholesaleSection | SF-SHOP-01 | `HeroSection`: Storefront/Home/Hero section | |
| CMP-SF-G-06 | `layout/` | 8 | CartButton, CurrentYear, DocumentShell, Footer, Header, MobileMenu, RegionPreferences, SearchToggle | SF-OVL-01, SF-OVL-03, SF-OVL-04 | | |
| CMP-SF-G-07 | `navigation/` | 1 | Breadcrumbs | SF-SHOP-03, SF-SHOP-04 | | |
| CMP-SF-G-08 | `order/` | 5 | AddressBlock, FulfillmentBlock, LineItemCard, OrderTotals, PaymentInfo | SF-ACC-06, SF-CHK-03 | `AddressBlock`: Storefront/Order/Address block; `FulfillmentBlock`: Storefront/Order/Fulfillment block; `LineItemCard`: Storefront/Order/Line item card; `OrderTotals`: Storefront/Order/Order totals; `PaymentInfo`: Storefront/Order/Payment info | |
| CMP-SF-G-09 | `policy/` | 1 | PolicyConsent | SF-ACC-02 | `PolicyConsent`: Storefront/Policy/Policy consent | |
| CMP-SF-G-10 | `products/` | 25 | FeaturedProducts, HiddenPricePrompt, InfiniteProductList, ListingAnalytics, ListingFilterBar, MediaGallery, MediaLightbox, ProductCard, ProductCardSkeleton, ProductCarousel, ProductCustomFields, ProductGrid, ProductGridSkeleton, ProductListing, ProductListingSkeleton, VariantPicker; filters: AvailabilityDropdownContent, FilterBarSkeleton, FilterChips, FilterDropdown, MobileFilterDrawer, OptionDropdownContent, PriceDropdownContent, ProductFilters, SortDropdownContent | SF-SHOP-02 to SF-SHOP-04, SF-WHL | | |
| CMP-SF-G-11 | `search/` | 1 | SearchBar | SF-OVL-03 | | |
| CMP-SF-G-12 | `seo/` | 1 | JsonLd | Every shop page (structured data, not visible) | | |

**Page-level components** (13), kept beside their pages under `src/app/[country]/[locale]/`, except `global-error`, which is `src/app/global-error.tsx`:

| ID | Component | Where | Kind | Used on | Storybook | Figma |
|---|---|---|---|---|---|---|
| CMP-SF-PG-01 | CheckoutPageContent | `(checkout)/checkout/[id]/` | Layout | SF-CHK-01 | | |
| CMP-SF-PG-02 | CheckoutSidebar | `(checkout)/checkout/[id]/` | Display | SF-CHK-01 | | |
| CMP-SF-PG-03 | CategoryBanner | `(storefront)/c/[...permalink]/` | Display | SF-SHOP-03 | | |
| CMP-SF-PG-04 | ProductDetails | `(storefront)/products/[slug]/` | Display | SF-SHOP-04 | | |
| CMP-SF-PG-05 | WholesaleApplicationPending | `(wholesale)/wholesale/_components/` | Feedback | SF-WHL | | |
| CMP-SF-PG-06 | WholesaleGate | `(wholesale)/wholesale/_components/` | Extension | SF-WHL | | |
| CMP-SF-PG-07 | WholesaleGuestBrowse | `(wholesale)/wholesale/_components/` | Layout | SF-WHL | | |
| CMP-SF-PG-08 | WholesaleHeader | `(wholesale)/wholesale/_components/` | Navigation | SF-WHL | | |
| CMP-SF-PG-09 | WholesaleSignInWall | `(wholesale)/wholesale/_components/` | Feedback | SF-WHL | | |
| CMP-SF-PG-10 | WholesaleCartView | `(wholesale)/wholesale/cart/` | Data | SF-WHL-05 | | |
| CMP-SF-PG-11 | QuickOrderView | `(wholesale)/wholesale/quick-order/` | Input | SF-WHL-06 | | |
| CMP-SF-PG-12 | SkuCombobox | `(wholesale)/wholesale/quick-order/` | Input | SF-WHL-06 | | |
| CMP-SF-PG-13 | global-error | `src/app/` | Feedback | SF-SYS-01 | | |

## 6. Dashboard design tokens

Declared in `packages/dashboard-ui/src/styles.css`. Merchants and hosts restyle by overriding these below the stylesheet import, without changing components (`docs/developer/dashboard/customization/theming.mdx`).

Storybook: `Tokens/Dashboard` shows every token in this section, the colour utility aliases and the Tailwind palette colours included.

### Semantic tokens, light and dark

`:root` holds the light values and `.dark` the dark ones. "Same as light" means `.dark` does not redefine the token. Values that read `var(--…)` refer to another token, and `--color-…` names refer to Tailwind's palette.

| ID | Token | Family | Light | Dark |
|---|---|---|---|---|
| TK-DUI-001 | `--brand-blue` | Brand | `oklch(0.5967 0.2212 258)` | Same as light |
| TK-DUI-002 | `--brand-blue-strong` | Brand | `oklch(0.5106 0.1868 257.7)` | Same as light |
| TK-DUI-003 | `--link` | Link | `oklch(0.5106 0.1868 257.7)` | `oklch(0.7 0.16 258)` |
| TK-DUI-004 | `--link-hover` | Link | `oklch(0.44 0.16 257.7)` | `oklch(0.78 0.14 258)` |
| TK-DUI-005 | `--background` | Surface | `oklch(98.5% 0.001 106.423)` | `oklch(17% 0 0)` |
| TK-DUI-006 | `--foreground` | Surface | `oklch(14.7% 0.004 49.25)` | `oklch(95% 0 0)` |
| TK-DUI-007 | `--card` | Surface | `oklch(1 0 0)` | `oklch(21.6% 0 0)` |
| TK-DUI-008 | `--card-foreground` | Surface | `var(--foreground)` | `var(--foreground)` |
| TK-DUI-009 | `--popover` | Surface | `var(--card)` | `var(--card)` |
| TK-DUI-010 | `--popover-foreground` | Surface | `var(--foreground)` | `var(--foreground)` |
| TK-DUI-011 | `--primary` | Primary | `var(--foreground)` | `var(--foreground)` |
| TK-DUI-012 | `--primary-foreground` | Primary | `var(--card)` | `oklch(14.7% 0 0)` |
| TK-DUI-013 | `--secondary` | Secondary | `oklch(97% 0.001 106.424)` | `oklch(25% 0 0)` |
| TK-DUI-014 | `--secondary-foreground` | Secondary | `var(--foreground)` | `var(--foreground)` |
| TK-DUI-015 | `--muted` | Muted | `var(--background)` | `oklch(17% 0 0)` |
| TK-DUI-016 | `--muted-foreground` | Muted | `oklch(0.535 0.0127 58.071)` | `oklch(70.9% 0 0)` |
| TK-DUI-017 | `--accent` | Accent | `var(--secondary)` | `oklch(29.5% 0 0)` |
| TK-DUI-018 | `--accent-foreground` | Accent | `var(--foreground)` | `var(--foreground)` |
| TK-DUI-019 | `--accent-strong` | Accent | `oklch(94.7% 0.002 56)` | `oklch(38% 0 0)` |
| TK-DUI-020 | `--accent-hover` | Accent | `oklch(95.9% 0.002 56)` | `oklch(33% 0 0)` |
| TK-DUI-021 | `--accent-strong-hover` | Accent | `oklch(92.3% 0.003 48.717)` | `oklch(44.4% 0 0)` |
| TK-DUI-022 | `--destructive` | Destructive | `oklch(0.58 0.22 27)` | `oklch(0.704 0.191 22.216)` |
| TK-DUI-023 | `--destructive-foreground` | Destructive | `var(--card)` | Same as light |
| TK-DUI-024 | `--border-base` | Border | `oklch(92.3% 0.003 48.717)` | `oklch(1 0 0 / 16%)` |
| TK-DUI-025 | `--border` | Border | `var(--border-base)` | `var(--border-base)` |
| TK-DUI-026 | `--border-card` | Border | `color-mix(in srgb, var(--border-base) 70%, transparent)` | `color-mix(in srgb, var(--border-base) 70%, transparent)` |
| TK-DUI-027 | `--border-subtle` | Border | `color-mix(in srgb, var(--border-base) 50%, transparent)` | `color-mix(in srgb, var(--border-base) 50%, transparent)` |
| TK-DUI-028 | `--border-control` | Border | `oklch(86.9% 0.005 56.366)` | `oklch(52% 0 0)` |
| TK-DUI-029 | `--card-container` | Surface | `var(--background)` | `var(--background)` |
| TK-DUI-030 | `--nested-raised` | Surface | `var(--card)` | `oklch(25% 0 0)` |
| TK-DUI-031 | `--track-recessed` | Surface | `var(--accent)` | `var(--muted)` |
| TK-DUI-032 | `--input` | Control | `color-mix(in srgb, var(--border-base) 80%, transparent)` | `color-mix(in srgb, var(--border-base) 80%, transparent)` |
| TK-DUI-033 | `--ring` | Focus | `var(--brand-blue)` | `oklch(0.68 0.19 258)` |
| TK-DUI-034 | `--chart-1` | Chart | `oklch(0.7663 0.1067 254.4)` | `oklch(0.809 0.105 251.813)` |
| TK-DUI-035 | `--chart-2` | Chart | `oklch(0.5967 0.2212 258)` | `oklch(0.623 0.214 259.815)` |
| TK-DUI-036 | `--chart-3` | Chart | `oklch(0.5106 0.1868 257.7)` | `oklch(0.546 0.245 262.881)` |
| TK-DUI-037 | `--chart-4` | Chart | `oklch(0.4232 0.1524 257.4)` | `oklch(0.488 0.243 264.376)` |
| TK-DUI-038 | `--chart-5` | Chart | `oklch(0.3358 0.118 257.1)` | `oklch(0.424 0.199 265.638)` |
| TK-DUI-039 | `--radius` | Radius | `0.75rem` | Same as light |
| TK-DUI-040 | `--sidebar` | Sidebar | `oklch(97% 0.001 106.424)` | `oklch(14% 0 0)` |
| TK-DUI-041 | `--sidebar-foreground` | Sidebar | `oklch(26.8% 0.007 34.298)` | `var(--foreground)` |
| TK-DUI-042 | `--sidebar-primary` | Sidebar | `var(--primary)` | `var(--primary)` |
| TK-DUI-043 | `--sidebar-primary-foreground` | Sidebar | `var(--primary-foreground)` | `var(--primary-foreground)` |
| TK-DUI-044 | `--sidebar-accent` | Sidebar | `oklch(92.3% 0.003 48.717)` | `var(--accent)` |
| TK-DUI-045 | `--sidebar-accent-foreground` | Sidebar | `var(--accent-foreground)` | `var(--accent-foreground)` |
| TK-DUI-046 | `--sidebar-accent-hover` | Sidebar | `var(--accent-strong)` | `var(--accent-hover)` |
| TK-DUI-047 | `--sidebar-border` | Sidebar | `color-mix(in srgb, var(--border) 75%, transparent)` | `color-mix(in srgb, var(--border) 75%, transparent)` |
| TK-DUI-048 | `--sidebar-ring` | Sidebar | `var(--ring)` | `var(--ring)` |
| TK-DUI-049 | `--status-green-bg` | Status | `var(--color-green-100)` | `var(--color-green-900)` |
| TK-DUI-050 | `--status-green-border` | Status | `var(--color-green-200)` | `var(--color-green-900)` |
| TK-DUI-051 | `--status-green-fg` | Status | `var(--color-green-700)` | `var(--color-green-300)` |
| TK-DUI-052 | `--status-amber-bg` | Status | `var(--color-amber-100)` | `var(--color-amber-900)` |
| TK-DUI-053 | `--status-amber-border` | Status | `var(--color-amber-200)` | `var(--color-amber-900)` |
| TK-DUI-054 | `--status-amber-fg` | Status | `var(--color-amber-700)` | `var(--color-amber-300)` |
| TK-DUI-055 | `--status-red-bg` | Status | `var(--color-red-100)` | `var(--color-red-900)` |
| TK-DUI-056 | `--status-red-border` | Status | `var(--color-red-200)` | `var(--color-red-900)` |
| TK-DUI-057 | `--status-red-fg` | Status | `var(--color-red-700)` | `var(--color-red-300)` |
| TK-DUI-058 | `--status-blue-bg` | Status | `var(--color-sky-100)` | `var(--color-sky-900)` |
| TK-DUI-059 | `--status-blue-border` | Status | `var(--color-sky-200)` | `var(--color-sky-900)` |
| TK-DUI-060 | `--status-blue-fg` | Status | `var(--color-sky-700)` | `var(--color-sky-300)` |
| TK-DUI-061 | `--scrollbar-thumb` | Scrollbar | `oklch(86.9% 0.005 56.366)` | `oklch(37.4% 0.01 67.558)` |
| TK-DUI-062 | `--scrollbar-thumb-hover` | Scrollbar | `oklch(70.9% 0.01 56.259)` | `oklch(44.4% 0.011 73.639)` |

### Theme entries

The `@theme inline` block turns tokens into Tailwind utilities.

| ID | Token | Value |
|---|---|---|
| TK-DUI-T-01 | `--font-sans` | `"Geist Variable", ui-sans-serif, system-ui, sans-serif` |
| TK-DUI-T-02 | `--font-mono` | `"Geist Mono Variable", ui-monospace, monospace` |
| TK-DUI-T-03 | `--text-xs` | `0.75rem` |
| TK-DUI-T-04 | `--text-sm` | `0.8125rem` |
| TK-DUI-T-05 | `--text-base` | `0.875rem` |
| TK-DUI-T-06 | `--text-lg` | `1rem` |
| TK-DUI-T-07 | `--text-xl` | `1.25rem` |
| TK-DUI-T-08 | `--text-2xl` | `1.5rem` |
| TK-DUI-T-09 | `--text-3xl` | `1.75rem` |
| TK-DUI-T-10 | `--text-4xl` | `2rem` |
| TK-DUI-T-11 | `--shadow-xs` | `0 0px 1px 0 rgb(0 0 0 / 0.05)` |
| TK-DUI-T-12 | `--shadow-control` | `0 0.5px 1px 0 rgb(0 0 0 / 0.05)` |
| TK-DUI-T-13 | `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| TK-DUI-T-14 | `--shadow-nav` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 2px -1px, rgba(0, 0, 0, 0.02) 0px 2px 4px 0px` |
| TK-DUI-T-15 | `--shadow-md` | `0 4px 16px -4px rgb(0 0 0 / 0.08), 0 1px 4px -2px rgb(0 0 0 / 0.05)` |
| TK-DUI-T-16 | `--shadow-lg` | `0 8px 32px -8px rgb(0 0 0 / 0.10), 0 2px 8px -4px rgb(0 0 0 / 0.06)` |
| TK-DUI-T-17 | `--radius-sm` | `0.4rem` |
| TK-DUI-T-18 | `--radius-md` | `0.5rem` |
| TK-DUI-T-19 | `--radius-lg` | `0.625rem` |
| TK-DUI-T-20 | `--radius-xl` | `0.875rem` |
| TK-DUI-T-21 | `--radius-2xl` | `1.125rem` |
| TK-DUI-T-22 | `--spacing-sidebar-width` | `240px` |
| TK-DUI-T-23 | `--spacing-header-height` | `0px` |
| TK-DUI-T-24 | `--spacing-rail-header-height` | `42px` |
| TK-DUI-T-25 | `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| TK-DUI-T-26 | `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` |

**Colour utility aliases** (TK-DUI-A, 58 entries). Each maps a Tailwind colour name to the token of the same name, such as `--color-card: var(--card)`. Four groups add meaning rather than repeating a name: `--color-success`, `--color-warning`, `--color-danger` and `--color-info`, with their `-bg` and `-border` variants, point at the status tokens; `--color-blue-500` and `--color-blue-600` replace Tailwind's blues with the brand blues; and `--color-link` and `--color-link-hover` point at the link tokens. The full list: `--color-sidebar-ring`, `--color-sidebar-border`, `--color-sidebar-accent-foreground`, `--color-sidebar-accent-hover`, `--color-sidebar-accent`, `--color-sidebar-primary-foreground`, `--color-sidebar-primary`, `--color-sidebar-foreground`, `--color-sidebar`, `--color-chart-5`, `--color-chart-4`, `--color-chart-3`, `--color-chart-2`, `--color-chart-1`, `--color-ring`, `--color-input`, `--color-border`, `--color-border-card`, `--color-border-subtle`, `--color-border-control`, `--color-card-container`, `--color-nested-raised`, `--color-track-recessed`, `--color-destructive`, `--color-destructive-foreground`, `--color-accent-foreground`, `--color-accent-strong`, `--color-accent-hover`, `--color-accent-strong-hover`, `--color-accent`, `--color-muted-foreground`, `--color-muted`, `--color-secondary-foreground`, `--color-secondary`, `--color-primary-foreground`, `--color-primary`, `--color-popover-foreground`, `--color-popover`, `--color-card-foreground`, `--color-card`, `--color-foreground`, `--color-background`, `--color-success`, `--color-success-bg`, `--color-success-border`, `--color-warning`, `--color-warning-bg`, `--color-warning-border`, `--color-danger`, `--color-danger-bg`, `--color-danger-border`, `--color-info`, `--color-info-bg`, `--color-info-border`, `--color-blue-500`, `--color-blue-600`, `--color-link`, `--color-link-hover`.

**Tailwind palette colours** (TK-TW-D, 48 entries). Colours from Tailwind's own palette that the dashboard packages use without declaring them: 20 are referred to by the status tokens above, and the rest appear in class names such as `text-amber-700`. `--color-blue-500` and `--color-blue-600` are not among them, because the theme replaces them with the brand blues. The values come from Tailwind's theme file at the installed version, and the token script finds the list by searching the four dashboard packages' source, so a class name built at run time is missed. The full list: `--color-red-100`, `--color-red-200`, `--color-red-300`, `--color-red-400`, `--color-red-700`, `--color-red-900`, `--color-amber-100`, `--color-amber-200`, `--color-amber-300`, `--color-amber-400`, `--color-amber-500`, `--color-amber-600`, `--color-amber-700`, `--color-amber-800`, `--color-amber-900`, `--color-green-100`, `--color-green-200`, `--color-green-300`, `--color-green-600`, `--color-green-700`, `--color-green-900`, `--color-emerald-300`, `--color-emerald-400`, `--color-emerald-500`, `--color-emerald-600`, `--color-emerald-700`, `--color-sky-100`, `--color-sky-200`, `--color-sky-300`, `--color-sky-700`, `--color-sky-900`, `--color-blue-50`, `--color-blue-300`, `--color-blue-400`, `--color-blue-700`, `--color-blue-800`, `--color-purple-300`, `--color-zinc-100`, `--color-zinc-300`, `--color-zinc-400`, `--color-zinc-500`, `--color-zinc-600`, `--color-zinc-700`, `--color-zinc-800`, `--color-zinc-900`, `--color-zinc-950`, `--color-black`, `--color-white`.

## 7. Storefront design tokens

Declared in `src/app/globals.css` in `liquorify-storefront`. The font comes from Next.js's font loader as `--font-geist`.

**The dark values are declared but never shown.** Nothing in the storefront adds the `dark` class, so shoppers always see the light values. Only the toast container and the focus outline follow the operating system's dark setting ([LIQ-010 §3.3](LIQ-010-design-system-reproduction-architecture.md#33-styling-and-a-correction-the-storefront-never-shows-dark-mode)).

### Semantic tokens, light and dark

| ID | Token | Family | Light | Dark |
|---|---|---|---|---|
| TK-SF-001 | `--background` | Surface | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| TK-SF-002 | `--foreground` | Surface | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-003 | `--card` | Surface | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| TK-SF-004 | `--card-foreground` | Surface | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-005 | `--popover` | Surface | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| TK-SF-006 | `--popover-foreground` | Surface | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-007 | `--primary` | Primary | `oklch(0.205 0 0)` | `oklch(0.87 0 0)` |
| TK-SF-008 | `--primary-foreground` | Primary | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| TK-SF-009 | `--secondary` | Secondary | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| TK-SF-010 | `--secondary-foreground` | Secondary | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-011 | `--muted` | Muted | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| TK-SF-012 | `--muted-foreground` | Muted | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| TK-SF-013 | `--accent` | Accent | `oklch(0.97 0 0)` | `oklch(0.371 0 0)` |
| TK-SF-014 | `--accent-foreground` | Accent | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-015 | `--destructive` | Destructive | `oklch(0.58 0.22 27)` | `oklch(0.704 0.191 22.216)` |
| TK-SF-016 | `--border` | Border | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| TK-SF-017 | `--input` | Control | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| TK-SF-018 | `--ring` | Focus | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |
| TK-SF-019 | `--chart-1` | Chart | `oklch(0.809 0.105 251.813)` | `oklch(0.809 0.105 251.813)` |
| TK-SF-020 | `--chart-2` | Chart | `oklch(0.623 0.214 259.815)` | `oklch(0.623 0.214 259.815)` |
| TK-SF-021 | `--chart-3` | Chart | `oklch(0.546 0.245 262.881)` | `oklch(0.546 0.245 262.881)` |
| TK-SF-022 | `--chart-4` | Chart | `oklch(0.488 0.243 264.376)` | `oklch(0.488 0.243 264.376)` |
| TK-SF-023 | `--chart-5` | Chart | `oklch(0.424 0.199 265.638)` | `oklch(0.424 0.199 265.638)` |
| TK-SF-024 | `--radius` | Radius | `0.625rem` | Same as light |
| TK-SF-025 | `--sidebar` | Sidebar | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| TK-SF-026 | `--sidebar-foreground` | Sidebar | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-027 | `--sidebar-primary` | Sidebar | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| TK-SF-028 | `--sidebar-primary-foreground` | Sidebar | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-029 | `--sidebar-accent` | Sidebar | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| TK-SF-030 | `--sidebar-accent-foreground` | Sidebar | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| TK-SF-031 | `--sidebar-border` | Sidebar | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| TK-SF-032 | `--sidebar-ring` | Sidebar | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### Theme entries

| ID | Token | Value |
|---|---|---|
| TK-SF-T-01 | `--font-sans` | `var(--font-geist)` |
| TK-SF-T-02 | `--animate-slide-in-right` | `slide-in-right 0.3s ease-out` |
| TK-SF-T-03 | `--animate-slide-in-left` | `slide-in-left 0.3s ease-out` |
| TK-SF-T-04 | `--animate-hamburger-top-open` | `hamburger-top-open 0.35s ease-in-out forwards` |
| TK-SF-T-05 | `--animate-hamburger-top-close` | `hamburger-top-close 0.35s ease-in-out forwards` |
| TK-SF-T-06 | `--animate-hamburger-mid-open` | `hamburger-mid-open 0.15s ease-in-out forwards` |
| TK-SF-T-07 | `--animate-hamburger-mid-close` | `hamburger-mid-close 0.15s ease-in-out forwards` |
| TK-SF-T-08 | `--animate-hamburger-bottom-open` | `hamburger-bottom-open 0.35s ease-in-out forwards` |
| TK-SF-T-09 | `--animate-hamburger-bottom-close` | `hamburger-bottom-close 0.35s ease-in-out forwards` |
| TK-SF-T-10 | `--color-primary-50` | `#eff6ff` |
| TK-SF-T-11 | `--color-primary-100` | `#dbeafe` |
| TK-SF-T-12 | `--color-primary-200` | `#bfdbfe` |
| TK-SF-T-13 | `--color-primary-300` | `#93c5fd` |
| TK-SF-T-14 | `--color-primary-400` | `#60a5fa` |
| TK-SF-T-15 | `--color-primary-500` | `#0077ff` |
| TK-SF-T-16 | `--color-primary-600` | `#0066dd` |
| TK-SF-T-17 | `--color-primary-700` | `#0055bb` |
| TK-SF-T-18 | `--color-primary-800` | `#004499` |
| TK-SF-T-19 | `--color-primary-900` | `#003377` |
| TK-SF-T-20 | `--color-primary-950` | `#001d4d` |
| TK-SF-T-21 | `--radius-sm` | `calc(var(--radius) * 0.6)` |
| TK-SF-T-22 | `--radius-md` | `calc(var(--radius) * 0.8)` |
| TK-SF-T-23 | `--radius-lg` | `var(--radius)` |
| TK-SF-T-24 | `--radius-xl` | `calc(var(--radius) * 1.4)` |
| TK-SF-T-25 | `--radius-2xl` | `calc(var(--radius) * 1.8)` |
| TK-SF-T-26 | `--radius-3xl` | `calc(var(--radius) * 2.2)` |
| TK-SF-T-27 | `--radius-4xl` | `calc(var(--radius) * 2.6)` |

**Colour utility aliases** (TK-SF-A, 31 entries), each mapping a Tailwind colour name to the token of the same name: `--color-background`, `--color-foreground`, `--color-sidebar-ring`, `--color-sidebar-border`, `--color-sidebar-accent-foreground`, `--color-sidebar-accent`, `--color-sidebar-primary-foreground`, `--color-sidebar-primary`, `--color-sidebar-foreground`, `--color-sidebar`, `--color-chart-5`, `--color-chart-4`, `--color-chart-3`, `--color-chart-2`, `--color-chart-1`, `--color-ring`, `--color-input`, `--color-border`, `--color-destructive`, `--color-accent-foreground`, `--color-accent`, `--color-muted-foreground`, `--color-muted`, `--color-secondary-foreground`, `--color-secondary`, `--color-primary-foreground`, `--color-primary`, `--color-popover-foreground`, `--color-popover`, `--color-card-foreground`, `--color-card`.

**Tailwind palette colours** (TK-TW-S, 44 entries). Colours from Tailwind's own palette that the storefront uses in class names without declaring them, such as `text-gray-900`. None of its tokens refer to the palette. The values come from Tailwind's theme file at the installed version, and the token script finds the list by searching `src/`, so a class name built at run time is missed. One fixed colour in a class name, `rgba(114,114,114,0.9)`, is not in the palette and is not listed here. The full list: `--color-red-50`, `--color-red-100`, `--color-red-300`, `--color-red-500`, `--color-red-600`, `--color-red-700`, `--color-red-800`, `--color-amber-700`, `--color-yellow-100`, `--color-yellow-800`, `--color-green-100`, `--color-green-500`, `--color-green-600`, `--color-green-700`, `--color-green-800`, `--color-blue-50`, `--color-blue-100`, `--color-blue-800`, `--color-slate-50`, `--color-slate-100`, `--color-slate-200`, `--color-slate-300`, `--color-slate-400`, `--color-slate-500`, `--color-slate-600`, `--color-slate-700`, `--color-slate-800`, `--color-slate-900`, `--color-gray-50`, `--color-gray-100`, `--color-gray-200`, `--color-gray-300`, `--color-gray-400`, `--color-gray-500`, `--color-gray-600`, `--color-gray-700`, `--color-gray-800`, `--color-gray-900`, `--color-neutral-200`, `--color-neutral-300`, `--color-neutral-400`, `--color-neutral-800`, `--color-black`, `--color-white`.

## 8. Email branding values

Each store may set these in the dashboard (DA-SET-03); a blank value keeps the shipped default (`spree/core/app/models/spree/emails/branding.rb`).

Storybook: `Tokens/Email branding` shows the defaults.

| ID | Value | Default |
|---|---|---|
| TK-EM-01 | Accent colour | None |
| TK-EM-02 | Background colour | `#FFFFFF` |
| TK-EM-03 | Card colour | `#F6F6F6` |
| TK-EM-04 | Text colour | `#726A6A` |
| TK-EM-05 | Heading colour | `#332C2C` |
| TK-EM-06 | Font | Inter, with Geist for headings. The other choices are system, Helvetica, Georgia, Roboto, Lato and Merriweather |

## 9. Design guidance that is not a design system

Ten agent skills are tracked in the backend under `.agents/skills/` and linked from `.claude/skills/`, with their sources pinned in `skills-lock.json`. One is shadcn's component skill; nine cover interface and animation design, prototyping and choosing libraries. They guide coding agents. They hold no components or tokens, so they are not inventoried above.

## 10. What this inventory does not show

- **How anything looks or behaves.** Nothing was rendered. No colour contrast was measured, and no component was checked for accessibility (PD-11 and QV-09 stay not assessed in [LIQ-003](LIQ-003-engineering-baseline.md#3-capability-baseline)).
- **Variants and states of each component.** Those are the story names in each component's Storybook file (FB-19), listed for each batch in its verification record, and they become the Figma component properties (FB-20).
- **Component-level styles.** The dashboard stylesheet has rules beyond its tokens; they are part of the components they style.
- **Colours outside the token files.** The storefront's one fixed colour, `rgba(114,114,114,0.9)`, has no ID. The Tailwind palette colours now have the group IDs TK-TW-D and TK-TW-S (§6 and §7); they are found by searching class names, which misses class names built at run time.
- **Liquorify components and tokens.** None exist.

## 11. How this links to the other records

- **SES-001.** Design System Engineering (PD-13) and Visual Interface Design (PD-09) for what exists, with the kinds above for the rest ([LIQ-003](LIQ-003-engineering-baseline.md#3-capability-baseline)).
- **Work items.** FB-19 documents these components in Storybook with Playwright reference screenshots; FB-20 reproduces these components and tokens in Figma ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)). How the IDs here are carried into stories, reference screenshots and Figma is in [LIQ-010 §10](LIQ-010-design-system-reproduction-architecture.md#10-traceability-to-the-inventory-ids).
- **When to revise it.** When Liquorify takes a new Spree or storefront revision (FB-12), and when a Liquorify component or token is accepted.
