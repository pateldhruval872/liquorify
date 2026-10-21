---
document_id: LIQ-006
title: Spree Product Capability Baseline
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Spree Product Capability Baseline

This baseline records everything Spree already offers, at the pinned revisions of both repositories: every product area and surface, with a proposed Liquorify disposition for each feature. It is the product counterpart of [LIQ-003](LIQ-003-engineering-baseline.md), which measures engineering capabilities, and the main record of FB-18 ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)).

**The existing product comes first.** At the owner's instruction of 2026-10-21 ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)), the existing Spree product is baselined completely before any Liquorify-specific product work. The baseline has three parts, reproduced by three later work items:

| Part | Record | Reproduced by |
|---|---|---|
| Features, by area and surface, with dispositions | This document | — |
| Screens, routes, roles, permissions, workflows, states and flows | [LIQ-008](LIQ-008-spree-screen-inventory.md) | FB-21: the existing screens, wireframes and flows in Figma |
| Components and design tokens | [LIQ-009](LIQ-009-spree-component-and-token-inventory.md) | FB-20: both design systems in Figma. FB-19: the components in Storybook, with Chromatic visual baselines |

**It describes what exists, not what Liquorify will build.** Under the recorded instruction in [LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work), no Spree feature becomes a Liquorify requirement by being listed here. The dispositions are proposals for the owner, and none is a product decision. A feature whose disposition is "not needed yet" stays in the baseline and in the reproduction work. Liquorify's own needs come from the merchant lifecycle specification. That document is PROPOSED and lives outside the repositories ([README](README.md#records-kept-outside-the-repositories)). Liquorify's own product work waits until the baseline is complete (§13).

## 1. Scope, revisions and evidence

- **Backend.** `liquorify` at `1d1f2d4`. Its application code is the same as Spree 6.0.0.rc4 at `394b53f`, the revision LIQ-003 assessed.
- **Storefront.** `liquorify-storefront` at `ac53c5b`. Its application code is the same as the upstream Spree storefront at `c19c466`.
- **Method.** Reading only, on 2026-10-21: the backend's models, API controllers, permission catalog, dashboard and seller panel routes, and Spree's documentation in `docs/developer/`, `docs/integrations/` and `docs/user/`; the storefront's routes and components. Nothing was run for this baseline.

| Code | Meaning |
|---|---|
| R | Found in code at the revisions above: a model, an API controller, or a dashboard, seller panel or storefront page |
| U | Described in Spree's documentation only; its code is not in these repositories |
| C1, C2, C3, V2 | Earlier evidence recorded in [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence) |

"Exists" means the feature is present, not that it works for Liquorify. Only the items marked with C or V codes were exercised, and only in the context those records name. Every row in §3 to §11 is R unless it says otherwise.

**Dispositions.**

| Disposition | Meaning |
|---|---|
| Reuse | Liquorify would offer it as Spree ships it. This is the default for running a store under decision C4 in the specification (keep Spree's commerce foundation). It does not make the feature a requirement, a tested feature or a promise to merchants |
| Extend | It exists, and a proposed Liquorify feature needs more from it. The extension is named, and stays a proposal |
| Not needed yet | It exists, but no current Liquorify proposal uses it. It stays available, stays in the baseline and its reproduction, and nothing is built on it |
| Unknown | Whether Liquorify uses it, or how, depends on a decision that is still open. The decision is named |

**Who uses what.**

- **Shoppers** use the storefront and the Store API. **Business buyers** also use the storefront's wholesale portal.
- **Store staff** use the admin dashboard and the Admin API, with per-store roles ([LIQ-008 §2](LIQ-008-spree-screen-inventory.md#2-who-may-open-what)).
- **Sellers**, in Spree's marketplace mode, use the seller panel and the Seller API.
- **The platform installer** runs first-run setup once.
- **Integrations and AI agents** use API keys, OAuth applications, webhooks and the agent server.
- **Platform operators** have no tool of their own in Spree. The specification proposes a minimal Liquorify Admin Console (F5), which waits with the rest of Liquorify's product work (§13).

## 2. Surfaces

| Surface | Where | Users | Screens |
|---|---|---|---|
| Admin dashboard | `packages/dashboard`, `@spree/dashboard-core`, `@spree/dashboard-ui` | Store staff | 95 screens and 5 overlays (DA-…) |
| Seller panel | `packages/seller-dashboard` | Sellers | 22 screens and 2 overlays (SP-…) |
| Storefront: shop, account and checkout | `liquorify-storefront` | Shoppers | 19 screens (SF-SHOP, SF-ACC, SF-CHK) and 5 overlays |
| Storefront: wholesale portal | `liquorify-storefront`, `(wholesale)` routes | Business buyers | 6 screens (SF-WHL), on only when wholesale is switched on |
| Emails | `spree/emails`, `spree/core`, the storefront's `src/lib/emails/` | Customers, stores, sellers, staff | 26 emails (EM-…) |
| Store API, Admin API, Seller API | `spree/api`: 56, 159 and 43 controllers | Storefronts, integrations, the dashboards | None |
| OAuth and the AI agent server | `spree/api` OAuth controllers; `spree/mcp` | AI agents and OAuth clients | DA-SET-07, DA-SET-27, DA-SET-32 |
| Webhooks | Outbound endpoints (`Spree::WebhookEndpoint`); inbound provider webhooks for payments, fulfilments and payouts | Integrations | DA-SET-28, DA-SET-29 |
| Software development kits | `packages/sdk`, `admin-sdk`, `seller-sdk` | Developers | None |
| Dashboard plugins | `defineDashboardPlugin`, slots and registries in `@spree/dashboard-core`; `packages/dashboard-plugin-example` | Developers | Slots named per screen in LIQ-008 |
| Hosted dashboards | `spree/dashboard` (`spree_dashboard`), serving built dashboards from the Rails server | Installers | None |
| Command line and project scaffolding | `packages/cli`, `packages/create-spree-app` | Developers | None |
| Documentation | `docs/developer/`, `docs/integrations/`, 85 merchant guide pages in `docs/user/` | Developers, merchants | None |

## 3. Setup, stores and settings

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Stores: the boundary that holds a store's products, orders, settings and staff roles | `Spree::Store`; `docs/developer/core-concepts/stores.mdx` | DA-SHELL-01, DA-OVL-01 | Staff | Reuse | Option A uses one Spree store per merchant, as a direction for technical validation only (specification V1). Shopper accounts do not respect this boundary today (ISO-1 to ISO-5) |
| First-run setup, which installs the platform and creates its first store | `setup.tsx`; `Spree::Stores::ProvisionDefaults` | DA-SETUP-01 | Platform installer | Reuse | It stays the installation path, not merchant sign-up (F1) |
| Store provisioning: seeding a new store with its defaults | `Spree::Seeds::StoreResources`, `Spree::Stores::ProvisionDefaults` | — | — | Extend | Onboarding (F2) would be a third caller, which Spree's 6.0 plan rules out. That needs an explicit decision |
| Getting Started checklist with six setup tasks | `getting-started.tsx`; `Spree.store_setup_tasks` | DA-HOME-02 | Staff | Extend | F4 adds three tasks. The tax task counts every store's rates today (ISO-6) |
| Store settings: name, admin language, time zone, units, storefront access and address, order numbers, payment capture | `Spree::Store` preferences | DA-SET-02 | Staff | Reuse | — |
| Channels, with per-channel overrides, a default catalog, fulfilment locations and order routing rules | `Spree::Channel`, `Spree::OrderRoutingRule`; `channels.mdx` | DA-SET-08 | Staff | Not needed yet | — |
| Markets: geography, currency and language bundled into selling regions | `Spree::Market`; `markets.mdx` | DA-SET-11 | Staff, shoppers | Unknown | Depends on launch geography, which is unresolved |
| Languages and translated content | `Spree::Locale`, translation pages; storefront messages in 5 languages, checked for parity (C1) | DA-PRD-06, DA-OVL-01, SF-OVL-04 | Staff, shoppers | Unknown | Which languages Liquorify supports is not decided |
| Store policies: returns, privacy, terms, with consent at registration | `Spree::Policy` | DA-SET-06, SF-SHOP-06, SF-ACC-02 | Staff, shoppers | Reuse | Each merchant writes its own. Liquorify's merchant terms are a separate, missing document (F1) |
| Custom fields and metafields | `Spree::CustomFieldDefinition`, `Spree::Metafield` | DA-SET-09 | Staff | Unknown | Whether merchants need structured product details, such as strength or bottle size, is not decided |
| Reasons for refunds, returns, claims, cancellations and tax exemptions | `Spree::RefundReason` and the other reason models | DA-SET-15, DA-SET-21 | Staff | Reuse | — |
| External references, for keys from other systems | `Spree::ExternalReference` | — | Integrations | Not needed yet | — |

## 4. Authentication, staff and access

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Staff sign-in and password reset | `Spree::AdminUser` | DA-AUTH-01 to DA-AUTH-03, EM-S-01 | Staff | Reuse | F1 keeps them unchanged and adds a public sign-up page in the same look |
| Sign-in through an identity provider (OpenID Connect), for staff and customers | `Spree::Authentication::Strategies::OidcStrategy`; `docs/developer/providers/sso.mdx` | DA-AUTH-01 | Staff, shoppers | Not needed yet | — |
| Staff invitations | `Spree::Invitation` | DA-SET-24, DA-AUTH-04, EM-S-03, EM-S-04 | Staff | Reuse | Invited staff never see onboarding (F1) |
| Roles and permissions per store, with role templates | `Spree::Role`, `Spree::RoleUser`, the permission catalog; `staff-roles.mdx` (R, C3) | DA-SET-25 | Staff | Extend | Spree's admin role may invite staff; F1 limits that to the owner. Staff were refused for a store where they hold no role, on one endpoint (C3) |
| Staff profile, interface language and theme; command palette; notifications | `@spree/dashboard-core` shell | DA-OVL-01 to DA-OVL-04 | Staff | Reuse | — |
| API keys, OAuth applications, allowed origins | `Spree::ApiKey`, `Spree::OauthApplication`, `Spree::AllowedOrigin` | DA-SET-26, DA-SET-27, DA-SET-30 | Integrations | Not needed yet | Publishable keys are how a storefront identifies its store |
| AI agent connections and the agent server | `spree/mcp`; OAuth authorization | DA-SET-07, DA-SET-32 | Staff, agents | Not needed yet | — |
| Webhooks and events, with test deliveries and automatic disabling | `Spree::WebhookEndpoint`, `Spree::Event`; `events.mdx`, `webhooks.mdx` | DA-SET-28, DA-SET-29, EM-S-07 | Integrations | Not needed yet | The Liquorify layer may use events internally; that is a design choice, not a merchant feature |
| Integrations settings | `Spree::Integration` | DA-SET-10 | Staff | Unknown | Depends on the payment and delivery providers, which are unresolved |

## 5. Catalog and pricing

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Products, variants and options, with bulk actions | `Spree::Product`, `Spree::Variant`, `Spree::OptionType` | DA-PRD-01 to DA-PRD-03, DA-PRD-05, SF-SHOP-04 | Staff, shoppers | Reuse | — |
| Publishing per channel, with publication windows | `Spree::ProductPublication` | DA-PRD-03 | Staff | Reuse | — |
| Product types | `Spree::ProductType` | DA-SET-20 | Staff | Reuse | — |
| Categories and collections, including rule-based collections | `Spree::Category`, `Spree::Collection`, `Spree::CollectionRule` | DA-PRD-07 to DA-PRD-12, SF-SHOP-03 | Staff, shoppers | Reuse | — |
| Catalogs: different ranges and prices for different audiences | `Spree::Catalog`; `catalogs.mdx` | DA-PRD-13, DA-PRD-14 | Staff | Not needed yet | — |
| Media library: images and video, reused across products | `Spree::Media` | DA-PRD-04 | Staff | Reuse | — |
| Digital products and downloads | `Spree::DigitalAsset`, `Spree::DigitalLink` | DA-PRD-03, DA-ORD-04, EM-C-07 | Staff, shoppers | Not needed yet | — |
| Translations of catalog content | Translation pages and dialogs | DA-PRD-06 | Staff | Unknown | Follows the language decision |
| Prices in several currencies | `Spree::Price`, `Spree::Currency` | DA-PRD-03 | Staff, shoppers | Reuse | Which currencies follows launch geography |
| Price lists and price rules: regional, volume and wholesale pricing | `Spree::PriceList`, `Spree::PriceRule`; `pricing.mdx` | DA-PRD-15 to DA-PRD-17 | Staff | Not needed yet | — |
| Price history for the EU Omnibus rule | `Spree::PriceHistory`; `data-privacy.mdx` | — | Shoppers | Unknown | Applies only if Liquorify serves the EU |
| Promotions and coupon codes | `Spree::Promotion`, `Spree::CouponCode` | DA-PRM-01 to DA-PRM-03, SF-SHOP-05, SF-CHK-01 | Staff, shoppers | Reuse | Whether alcohol promotions are restricted where Liquorify trades is not known |
| Gift cards and store credit | `Spree::GiftCard`, `Spree::StoreCredit` | DA-LOY-01, DA-LOY-02, SF-ACC-09 | Staff, shoppers | Reuse | — |
| Product search and filters; optional Meilisearch provider | Store API list endpoints; `spree/providers/meilisearch`; storefront search and filters | SF-SHOP-02, SF-OVL-03 | Shoppers | Reuse | Meilisearch is optional and needs its own service |
| Imports and exports as CSV | `Spree::Import`, `Spree::Export` | DA-OVL-05, DA-SET-31, EM-S-05, EM-S-06 | Staff | Reuse | Export after a store closes depends on retention, which is unresolved |
| Search-friendly slugs for products, categories and stores | `slug` attributes; `slugs.mdx` | — | Shoppers | Reuse | — |

## 6. Cart, checkout and orders

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Cart and guest checkout, with stock held during checkout | `Spree::Cart`, `Spree::StockReservation` | SF-OVL-02, SF-SHOP-05, SF-CHK-01 to SF-CHK-03 | Shoppers | Extend | F4 refuses the catalog and checkout while a store is not trading. Whether guest checkout fits age checks is part of an unresolved decision |
| Express checkout buttons | `ExpressCheckoutButton` | SF-CHK-01 | Shoppers | Unknown | Follows the payment provider decision |
| Orders, with separate payment and fulfilment statuses | `Spree::Order`; `orders.mdx` | DA-ORD-01, DA-ORD-04 | Staff, shoppers | Reuse | — |
| Draft orders created by staff, and payment links | Draft order pages; `payment_link_email` | DA-ORD-02, DA-ORD-03, EM-C-03 | Staff | Reuse | — |
| Editing a placed order's items, with a totals preview | `orders/$orderId/edit.tsx` | DA-ORD-05 | Staff | Reuse | — |
| Order tags, internal notes and special instructions | Order detail cards | DA-ORD-04 | Staff | Reuse | — |
| Returns, exchanges and claims | `Spree::Return`, `Spree::Exchange`, `Spree::Claim` | DA-ORD-04, DA-ORD-06 to DA-ORD-08, EM-C-06 | Staff, shoppers | Reuse | — |
| Fees: handling, gift wrap, duties | `Spree::Fee`; `fees.mdx` | DA-ORD-04 | Staff | Not needed yet | — |
| Shopper order history and tracking | Storefront account pages | SF-ACC-05, SF-ACC-06 | Shoppers | Reuse | — |

## 7. Payments, delivery, inventory and tax

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Payment methods, payment sessions, saved cards, refunds | `Spree::PaymentMethod`, `Spree::PaymentSession`, `Spree::CreditCard`, `Spree::Refund`; `payments.mdx` | DA-SET-12, DA-SET-10, DA-ORD-04, SF-CHK-01, SF-ACC-08 | Staff, shoppers | Unknown | The payment provider merchants connect is unresolved, as are Stripe's rules for alcohol sellers |
| Stripe provider, including Stripe Connect for marketplace payouts | `spree/providers/stripe`: 297 examples passed (R, V2) | DA-SET-10, SF-CHK-01 | Staff, shoppers | Unknown | The same open decision |
| Storefront payment forms for Adyen and PayPal | `AdyenPaymentForm`, `PayPalPaymentForm` | SF-CHK-01 | Shoppers | Unknown | Their backend gems are not in these repositories (§12) |
| Delivery profiles, zones, methods and rates, including rate providers | `Spree::DeliveryProfile`, `Spree::DeliveryZone`, `Spree::DeliveryMethod` | DA-SET-16, DA-SET-17, SF-CHK-01 | Staff, shoppers | Unknown | Zones can limit where a product ships. Which places a merchant may ship alcohol to depends on launch geography and licensing, both unresolved |
| Pickup points and pickup delivery | `Spree::PickupPointOption`; `fulfillments.mdx` | DA-SET-17, SF-CHK-01 | Shoppers | Unknown | The same open decision |
| Fulfilment: labels, deliveries and tracking | `Spree::Fulfillment`, `Spree::ShippingLabel`, `Spree::Delivery` | DA-ORD-04, EM-C-05 | Staff, shoppers | Reuse | — |
| EasyPost provider: live rates and shipping labels | `spree/providers/easypost`: 93 examples passed (R, V2) | DA-SET-17, DA-ORD-04 | Staff | Unknown | Carriers have their own rules for alcohol, which were not checked |
| Package types, and wholesale freight: cartons, pallets, freight quotes | `Spree::PackageType`, `Spree::FreightSummary`; `freight.mdx` | DA-SET-19 | Staff | Not needed yet | — |
| Stock locations, stock levels, reservations | `Spree::StockLocation`, `Spree::StockItem`, `Spree::StockReservation` | DA-SET-18, DA-INV-01 | Staff, shoppers | Reuse | — |
| Stock transfers, purchase orders, suppliers | `Spree::StockTransfer`, `Spree::PurchaseOrder`, `Spree::Supplier` | DA-INV-02 to DA-INV-10 | Staff | Not needed yet | — |
| Tax categories and rates, included or added tax, an external tax service | `Spree::TaxRate`, `Spree::TaxCategory`; `taxes.mdx` | DA-SET-13, DA-SET-14 | Staff | Unknown | Liquorify's tax obligations need qualified review (specification C2), and alcohol duty is not modelled. The tax task bug is ISO-6 |
| Tax exemptions, certificates and tax identifiers | `Spree::TaxExemptionCertificate`, `Spree::TaxIdentifier` | DA-SET-15, DA-CUS-02, DA-CUS-05 | Staff | Not needed yet | — |

## 8. Customers and shopper accounts

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Shopper accounts: registration, sign-in, profile, addresses, order history, saved cards, gift cards | `Spree::Customer`; storefront account pages | SF-ACC-01 to SF-ACC-10, EM-C-08 | Shoppers | Extend | Specification C3: a shopper has a separate account with each merchant. Today one account works at every store (ISO-1 to ISO-5). Explicit ownership (P2) is the extension |
| Customer records for staff: profile, addresses, groups, tags, lifetime figures, store credit, internal notes | `Spree::Customer` | DA-CUS-01, DA-CUS-02 | Staff | Reuse | The customer list shows other stores' shoppers today (ISO-1 to ISO-3) |
| Customer groups | `Spree::CustomerGroup` | DA-CUS-03 | Staff | Not needed yet | — |
| Wishlists | `Spree::Wishlist` | — | Shoppers | Not needed yet | No storefront page for it at this revision |
| Newsletter sign-ups with email confirmation | `Spree::NewsletterSubscriber` | EM-C-10 | Shoppers | Not needed yet | Marketing consent rules for alcohol were not checked |
| Data privacy: data exports, erasure, consent records, the right of withdrawal | `Spree::DataRequest`, `Spree::ConsentRecord`; `data-privacy.mdx` | DA-CUS-02, EM-C-09 | Shoppers, staff | Unknown | Data retention and the export period after a store closes are unresolved |

## 9. Wholesale

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Companies and divisions, members, invitations and address books | `Spree::Company`, `Spree::CompanyMembership`, `Spree::CompanyInvitation`; `companies.mdx` | DA-CUS-04, DA-CUS-05, EM-C-11 | Staff, business buyers | Not needed yet | Company roles, approvals and spending limits are Enterprise only (§12) |
| Wholesale portal: trade-price catalog, product pages, wholesale cart and quick order by SKU | Storefront `(wholesale)` routes | SF-WHL-01, SF-WHL-04 to SF-WHL-06 | Business buyers | Not needed yet | Off unless wholesale is switched on |
| Wholesale application and approval, through the "Wholesale" customer group | `WholesaleGate`, `isWholesaleApproved` | SF-WHL-02, SF-WHL-03, DA-CUS-01, DA-CUS-02 (flow FL-10) | Business buyers, staff | Not needed yet | — |
| Gated channels: sign-in required or prices hidden | `Spree::Channel::Gating` | DA-SET-02, DA-SET-08, SF-WHL-01, SF-SHOP-04 | Staff, business buyers | Not needed yet | — |
| Purchase order numbers and documents on orders; negotiated prices on staff orders | Order and company settings | DA-ORD-03, DA-ORD-05, DA-CUS-05 | Staff | Not needed yet | — |
| B2B catalogs, price lists and freight | §5 and §7 | DA-PRD-13 to DA-PRD-17, DA-SET-19 | Staff | Not needed yet | — |

## 10. Marketplace

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Sellers: invitation, onboarding, approval, rejection, suspension | `Spree::Seller`; `sellers.mdx` | DA-SEL-01, DA-SEL-02, EM-O-03 to EM-O-05 | Staff, sellers | Not needed yet | The specification gives each merchant its own store and does not use a marketplace. Modelling merchants as sellers would be a different tenancy option, which was not evaluated |
| Seller requirements and onboarding | `Spree::SellerRequirement`, `Spree::SellerRequirementSubmission` | DA-SET-23, SP-ONB-01 | Staff, sellers | Not needed yet | The same |
| Seller panel: products, orders, earnings, payouts, profile, team and settings | `packages/seller-dashboard` | SP-… (22 screens) | Sellers | Not needed yet | The same |
| Product submissions and review | `Spree::ProductSubmission` | SP-PRD-03, DA-PRD-03 | Sellers, staff | Not needed yet | — |
| Orders split by seller into order groups | `Spree::OrderGroup` | EM-C-04, EM-O-02, SP-ORD-01 | Shoppers, sellers | Not needed yet | — |
| Commissions | `Spree::CommissionRate`; `commissions.mdx` | DA-SEL-03 | Staff | Not needed yet | — |
| Seller earnings, transfers and payouts, with a built-in provider and Stripe Connect | `Spree::SellerTransfer`, `Spree::SellerPayout`, `Spree.payout_providers`; `payouts.mdx` | DA-SEL-04 to DA-SEL-06, SP-FIN-01 to SP-FIN-03 | Staff, sellers | Not needed yet | — |
| Marketplace settings | Store preferences | DA-SET-22 | Staff | Not needed yet | — |
| Sellers' own delivery methods, package types, stock locations and policies | Seller-scoped records | SP-SET-02 to SP-SET-05 | Sellers | Not needed yet | — |

## 11. Analytics, emails, platform and developer surfaces

| Spree feature | Where | Screens | Who | Disposition | Note |
|---|---|---|---|---|---|
| Home dashboard: key figures, comparison chart, operations and rankings | Analytics endpoints | DA-HOME-01 | Staff | Reuse | — |
| Reports: built-in and saved, with CSV export | `Spree::SavedReport`; `reporting.mdx` | DA-RPT-01 to DA-RPT-03, EM-S-05 | Staff | Reuse | Customer order totals appear to be summed across stores (ISO-7, read in code, not tested) |
| Customer emails in Liquid and MJML, with a template editor and per-store colours and font | `spree/emails`; `Spree::Stores::EmailBranding` | DA-SET-03 to DA-SET-05, EM-C-01 to EM-C-11 | Staff, shoppers | Reuse | Liquorify's own emails (verification, billing) would be new templates, and wait with F1 and F3 |
| Store, seller and staff emails | `spree/emails`, `spree/core` mailers | EM-O-01 to EM-O-05, EM-S-01 to EM-S-07 | Stores, sellers, staff | Reuse | — |
| Storefront emails sent from webhooks | Storefront `api/webhooks/spree`, `src/lib/emails/` | EM-SF-01 to EM-SF-04 | Shoppers | Unknown | Whether the storefront or Spree sends customer emails is not decided; both exist |
| Store, Admin and Seller APIs with TypeScript kits | `spree/api`; `packages/sdk`, `admin-sdk`, `seller-sdk` | — | Storefronts, integrations | Reuse | — |
| Dashboard plugins, slots and registries | `@spree/dashboard-core`; `packages/dashboard-plugin-example` | Slots in LIQ-008 | Developers | Reuse | The specification proposes a Liquorify plugin package (P3), which waits with its features |
| Hosted dashboards on the Rails server | `spree/dashboard` | — | Installers | Unknown | Depends on hosting (FB-16) |
| Provider contracts: pricing and inventory sources, media addresses, fulfilment, delivery rates, tax, payouts | `docs/developer/providers/` | — | Integrations | Not needed yet | — |
| Tracing with OpenTelemetry | `spree/opentelemetry`; `observability.mdx` | — | Operators | Unknown | Depends on monitoring (FB-16) |
| Command line and project scaffolding | `packages/cli`, `packages/create-spree-app` | — | Developers | Unknown | Depends on the development path (FB-04) |
| Multi-store administration: one staff account with roles in several stores | `Spree::RoleUser` | DA-SHELL-01, DA-OVL-01 | Staff | Unknown | Whether one login may be staff at two businesses is unresolved |
| Platform update check and usage data sent to Spree | LIQ-003 SP-10 | — | Platform | Unknown | FB-09 decides |

## 12. Enterprise and documentation-only features

These are described in Spree's documentation, but their code is not in these repositories. They are listed so the baseline is complete, and they are not reproduced in Figma or Storybook.

**Spree Enterprise only.** They need a Spree Enterprise licence (U).

| Feature | Spree's documentation | Disposition | Note |
|---|---|---|---|
| Multi-tenant SaaS edition: tenant sign-up, subdomains, row-level isolation | `docs/developer/multi-tenant/` | Unknown | Whether to ask Spree about it is unresolved |
| Company governance: roles built from capabilities, order approvals, spending limits, audit history | `core-concepts/companies.mdx`, `how-to/build-a-b2b-store.mdx`, `docs/user/customers/companies.mdx` | Not needed yet | The dashboard shows an upgrade card on the company page (DA-CUS-05) |
| Marketplace refund clawbacks and netting, reconciliation, seller identity checks (KYC), seller tax reporting (DAC7) | `core-concepts/sellers.mdx`, `commissions.mdx`, `providers/payouts.mdx` | Not needed yet | — |
| Privacy request queue, deadline tracking and retention runs | `core-concepts/data-privacy.mdx` | Unknown | Follows the retention decision |
| On Spree's Enterprise roadmap: payment terms and net invoicing, quotes, a packaged buyer portal | `how-to/build-a-b2b-store.mdx` | Not needed yet | Not released |

**Documented integrations whose code is elsewhere.** Each is a separate gem or a configuration, not code in these repositories (U).

| Integration | Spree's documentation | What it needs | Disposition |
|---|---|---|---|
| Adyen payments | `docs/integrations/payments/adyen.mdx` | The `spree_adyen` gem. The storefront already has an Adyen payment form | Unknown, with the payment provider |
| PayPal payments | `…/payments/paypal.mdx` | The `spree_paypal_checkout` gem. The storefront already has a PayPal payment form | Unknown, with the payment provider |
| Razorpay payments | `…/payments/razorpay.mdx` | A community gem | Unknown, with the payment provider |
| Avalara tax | `…/tax/avalara.mdx` | The `spree_avatax_official` gem | Unknown, with the tax review |
| Klaviyo marketing | `…/marketing/klaviyo.mdx` | The `spree_klaviyo` gem | Not needed yet |
| Google Analytics and Google Tag Manager | `…/analytics/` | The `spree_google_analytics` gem | Not needed yet |
| Email delivery through Amazon SES, Mailgun, Postmark, Resend or SendGrid | `…/email/`, `docs/developer/providers/emails.mdx` | Mail server settings; no gem | Unknown, with hosting |

Stripe, Stripe Connect, EasyPost and Meilisearch are documented there too, but their code is in this repository (§5, §7, §10).

## 13. Liquorify work that comes after the baseline

These come from the specification's proposals and its unresolved list. None is approved. **All of it waits** until the baseline is complete, meaning these three records reviewed and the reproductions FB-19 to FB-21 done, and the owner instructs it ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work); [LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)). The owner named Liquorify branding (FB-14), merchant onboarding (F2), the merchant subscription (F3) and the platform Admin Console (F5) as deferred.

| Need | Spree today | Source |
|---|---|---|
| Merchant self sign-up with email verification and no account discovery | First-run setup and invitations only | F1 (proposal) |
| A business record above the store, with an owner, and merchant onboarding | None; stores have no owner record | P1, F2 (proposal) |
| Liquorify's own subscription for merchants, its standing, and the billing hold | None; Spree takes shoppers' payments, not platform fees | F3 (proposal); billing provider unresolved |
| Store lifecycle states and independent holds, including going live and pausing | None | P4, F4 (proposal) |
| A storefront holding page while a store is not trading | None | F4 (proposal) |
| An operator console with separate operator accounts, permissions and an audit log | None; Spree's staff roles are per store | P5, F5 (proposal) |
| Support access to a store's data by the owner's time-limited grant | None | F5 (proposal) |
| Liquorify branding across the dashboard, the storefront and emails | Spree's look, with token overrides available (LIQ-009) | FB-14; LIQ-007 (PROPOSED) |
| Licence records, and whether Liquorify verifies them | None | Unresolved |
| Shopper age verification | None; shopper accounts have no date of birth | Unresolved |
| Delivery limits specific to alcohol, beyond zones | Zones and delivery profiles only | Unresolved |
| One storefront serving many merchants | The storefront takes its store name from a build setting and its logo from a static file, so each deployment shows one store | Unresolved (storefront hosting) |

## 14. When the baseline is complete

The baseline is complete when all of these hold. They are the completion criteria of FB-18 ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)).

1. **Screens.** Every route file in the dashboard, the seller panel and the storefront is classified in LIQ-008 as a screen, a layout or a redirect, and the counts in its §1 match the files at the pinned revisions.
2. **Screen details.** Every screen has an ID, a route, who may open it with the permission scope, its workflows, its meaningful states and a code reference. Every email has an ID, and every cross-screen flow an FL ID.
3. **Components and tokens.** Every component file and every token in the folders and stylesheets LIQ-009 names has an ID there, with its kind and the SES capabilities it supports.
4. **Features.** Every area and surface in §2 to §11 lists its features with a disposition and the screens that show them. A feature marked "not needed yet" stays listed.
5. **Enterprise and documentation-only features** are listed separately (§12) and left out of the reproduction work.
6. **Reproduction work items** FB-19, FB-20 and FB-21 exist with completion criteria tied to the LIQ-008 and LIQ-009 IDs.
7. **The owner has reviewed** LIQ-006, LIQ-008 and LIQ-009.

## 15. What this baseline does not show

- **Behaviour.** Apart from the cited C and V evidence, nothing here was run. A listed feature may have defects, gaps for Liquorify's markets, or limits that only use reveals.
- **Fitness for alcohol commerce.** No feature was checked against alcohol rules for any place: age checks, licensing, delivery, promotions, marketing consent or duty.
- **Isolation.** Every row inherits the open findings ISO-1 to ISO-7 where shopper accounts or cross-store totals are involved.
- **Enterprise behaviour.** §12 repeats what Spree's documentation says; none of it was seen.
- **Liquorify changes.** None exist yet. Every extension above is a proposal.

## 16. How this links to the other records

- **SES-001.** It supports Product & Design capabilities PD-02, PD-06, PD-07, PD-08, PD-17 and PD-19 ([LIQ-003](LIQ-003-engineering-baseline.md#3-capability-baseline)) without changing their findings. The specification remains the requirements record (PD-06). The screen and component inventories add PD-09, PD-10 and PD-13.
- **ENG-001.** It is the classification that [ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc) asks for before a feature is built: reusable, needing extension, or missing.
- **Design system.** How Liquorify would later extend the existing systems is in [LIQ-007](LIQ-007-design-system-adoption-and-extension.md), which stays PROPOSED.
- **When to revise it.** When the owner accepts or revises the specification, when an unresolved decision above is made, or when Liquorify takes a new Spree release (FB-12). LIQ-008 and LIQ-009 are revised at the same time.
