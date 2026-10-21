---
document_id: LIQ-006
title: Spree Product Capability Baseline
version: 0.1-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Spree Product Capability Baseline

This baseline records what Spree already offers shoppers, store staff and the people who run the platform. For each feature it gives a proposed Liquorify disposition. It is the product counterpart of [LIQ-003](LIQ-003-engineering-baseline.md), which measures engineering capabilities, and it is half of FB-18 ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)). The other half is the design system decision record, [LIQ-007](LIQ-007-design-system-adoption-and-extension.md).

**It describes what exists, not what Liquorify will build.** Under the recorded instruction in [LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work), no Spree feature becomes a Liquorify requirement by being listed here. The dispositions are proposals for the owner, and none is a product decision. Liquorify's own needs come from the merchant lifecycle specification. That document is PROPOSED and lives outside the repositories ([README](README.md#records-kept-outside-the-repositories)).

## 1. Scope, revisions and evidence

- **Backend.** `liquorify` at `1d1f2d4`. Its application code is the same as Spree 6.0.0.rc4 at `394b53f`, the revision LIQ-003 assessed.
- **Storefront.** `liquorify-storefront` at `ac53c5b`. Its application code is the same as the upstream Spree storefront at `c19c466`.
- **Method.** Reading only, on 2026-10-21: the backend's models, Admin and Store API controllers, dashboard routes, and Spree's developer documentation in `docs/developer/`; the storefront's routes and components. Nothing was run for this baseline.

| Code | Meaning |
|---|---|
| R | Found in code at the revisions above: a model, an API controller, or a dashboard or storefront page |
| U | Described in Spree's own documentation only; not checked in code or behaviour |
| C1, C2, C3, V2 | Earlier evidence recorded in [LIQ-003 §1](LIQ-003-engineering-baseline.md#1-scope-revisions-and-evidence) |

"Exists" means the feature is present, not that it works for Liquorify. Only the items marked with C or V codes were exercised, and only in the context those records name.

**Dispositions.**

| Disposition | Meaning |
|---|---|
| Reuse | Liquorify would offer it as Spree ships it. This is the default for running a store under decision C4 in the specification (keep Spree's commerce foundation). It does not make the feature a requirement, a tested feature or a promise to merchants |
| Extend | It exists, and a proposed Liquorify feature needs more from it. The extension is named, and stays a proposal |
| Not needed yet | It exists, but no current Liquorify proposal uses it. It stays available and nothing is built on it |
| Unknown | Whether Liquorify uses it, or how, depends on a decision that is still open. The decision is named |

**Who uses what.**

- **Shoppers** use the storefront and the Store API.
- **Store staff** use the admin dashboard and the Admin API.
- **Sellers**, in Spree's marketplace mode, use the seller panel.
- **Platform operators** have no tool of their own in Spree. The specification proposes a minimal Liquorify Admin Console (F5).

## 2. Stores and setup

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Stores: the boundary that holds a store's products, orders, settings and staff roles | `Spree::Store`; `docs/developer/core-concepts/stores.mdx` (R) | Staff | Reuse | Option A uses one Spree store per merchant, as a direction for technical validation only (specification V1). Shopper accounts do not respect this boundary today (ISO-1 to ISO-5) |
| First-run setup at `/setup`, which installs the platform and creates its first store | Dashboard `setup.tsx`; `Spree::Stores::ProvisionDefaults` (R) | Platform installer | Reuse | It stays the installation path, not merchant sign-up (F1) |
| Store provisioning: seeding a new store with its defaults | `Spree::Seeds::StoreResources`, `Spree::Stores::ProvisionDefaults` (R) | — | Extend | Onboarding (F2) would be a third caller, which Spree's 6.0 plan rules out. That needs an explicit decision |
| Getting Started checklist | Dashboard `getting-started.tsx`; `Spree.store_setup_tasks` (R) | Staff | Extend | F4 adds three tasks. The tax task counts every store's rates today (ISO-6) |
| Channels: online store, point of sale, wholesale and marketplace surfaces | `Spree::Channel`; `channels.mdx` (R) | Staff | Not needed yet | — |
| Markets: geography, currency and language bundled into selling regions | `Spree::Market`; `markets.mdx` (R) | Staff, shoppers | Unknown | Depends on launch geography, which is unresolved |
| Languages and translated content | `Spree::Locale`, translation pages; storefront messages in 5 languages, checked for parity (R, C1) | Staff, shoppers | Unknown | Which languages Liquorify supports is not decided |
| Store policies: returns, privacy, terms, shown on the storefront | `Spree::Policy`; dashboard `settings/policies.tsx`; storefront `policies/[slug]` (R) | Staff, shoppers | Reuse | Each merchant writes its own. Liquorify's merchant terms are a separate, missing document (F1) |
| Custom fields and metafields | `Spree::CustomFieldDefinition`, `Spree::Metafield` (R) | Staff | Unknown | Whether merchants need structured product details, such as strength or bottle size, is not decided |
| External references, for keys from other systems | `Spree::ExternalReference` (R) | Integrations | Not needed yet | — |

## 3. Staff, access and integrations

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Staff accounts, sign-in, password reset | `Spree::AdminUser`; dashboard `login.tsx`, `forgot-password.tsx`, `reset-password.tsx` (R) | Staff | Reuse | F1 keeps them unchanged and adds a public sign-up page in the same look |
| Roles and permissions per store | `Spree::Role`, `Spree::RoleUser`, `Spree::PermissionSets`; `staff-roles.mdx` (R, C3) | Staff | Extend | Spree's admin role may invite staff; F1 limits that to the owner. Staff were refused for a store where they hold no role, on one endpoint (C3) |
| Staff invitations | `Spree::Invitation`; dashboard `accept-invitation` (R) | Staff | Reuse | Invited staff never see onboarding (F1) |
| API keys, OAuth applications, allowed origins | `Spree::ApiKey`, `Spree::OauthApplication`, `Spree::AllowedOrigin` (R) | Integrations | Not needed yet | Publishable keys are how a storefront identifies its store |
| AI agent settings and the MCP server | Dashboard `settings/ai-agents.tsx`; `spree/mcp` (R) | Staff, agents | Not needed yet | — |
| Webhooks and events | `Spree::WebhookEndpoint`, `Spree::Event`; `events.mdx`, `webhooks.mdx` (R) | Integrations | Not needed yet | The Liquorify layer may use events internally; that is a design choice, not a merchant feature |
| Integrations settings | `Spree::Integration`; dashboard `settings/integrations.tsx` (R) | Staff | Unknown | Depends on the payment and delivery providers, which are unresolved |

## 4. Catalog and pricing

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Products, variants and options | `Spree::Product`, `Spree::Variant`, `Spree::OptionType`; dashboard `products/*` (R) | Staff, shoppers | Reuse | — |
| Product types | `Spree::ProductType` (R) | Staff | Reuse | — |
| Categories and collections, including rule-based collections | `Spree::Category`, `Spree::Collection`, `Spree::CollectionRule` (R) | Staff, shoppers | Reuse | — |
| Catalogs: different ranges and prices for different audiences | `Spree::Catalog`; `catalogs.mdx` (R) | Staff | Not needed yet | — |
| Media library: images and video, reused across products | `Spree::Media`; dashboard `products/media.tsx` (R) | Staff | Reuse | — |
| Digital products and downloads | `Spree::Digital`, `Spree::DigitalLink` (R) | Staff, shoppers | Not needed yet | — |
| Prices in several currencies | `Spree::Price`, `Spree::Currency` (R) | Staff, shoppers | Reuse | Which currencies follows launch geography |
| Price lists and price rules: regional, volume and wholesale pricing | `Spree::PriceList`, `Spree::PriceRule`; `pricing.mdx` (R) | Staff | Not needed yet | — |
| Price history for the EU Omnibus rule | `Spree::PriceHistory`; `data-privacy.mdx` (R) | Shoppers | Unknown | Applies only if Liquorify serves the EU |
| Promotions and coupon codes | `Spree::Promotion`, `Spree::CouponCode`; dashboard `promotions/*` (R) | Staff, shoppers | Reuse | Whether alcohol promotions are restricted where Liquorify trades is not known |
| Gift cards and store credit | `Spree::GiftCard`, `Spree::StoreCredit`; dashboard `loyalty/*`; storefront `account/gift-cards` (R) | Staff, shoppers | Reuse | — |
| Product search and filters; optional Meilisearch provider | Store API list endpoints; `spree/providers/meilisearch`; the storefront's `products` page and search components (R) | Shoppers | Reuse | Meilisearch is optional and needs its own service |
| Imports and exports as CSV | `Spree::Import`, `Spree::Export`; dashboard `settings/imports` (R) | Staff | Reuse | Export after a store closes depends on retention, which is unresolved |
| Search-friendly slugs for products, categories and stores | `slug` attributes; `slugs.mdx` (R) | Shoppers | Reuse | — |

## 5. Cart, checkout and orders

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Cart and guest checkout | `Spree::Cart`; storefront `cart`, `checkout/[id]` (R) | Shoppers | Extend | F4 refuses the catalog and checkout while a store is not trading. Whether guest checkout fits age checks is part of an unresolved decision |
| Orders, with separate payment and delivery statuses | `Spree::Order`; dashboard `orders/*`; `orders.mdx` (R) | Staff, shoppers | Reuse | — |
| Draft orders created by staff | Dashboard `orders/drafts.tsx`, `orders/new.tsx` (R) | Staff | Reuse | — |
| Returns, exchanges and claims | `Spree::Return`, `Spree::Exchange`, `Spree::Claim`; dashboard `returns.tsx`, `exchanges.tsx`, `claims.tsx` (R) | Staff, shoppers | Reuse | — |
| Fees: handling, gift wrap, duties | `Spree::Fee`; `fees.mdx` (R) | Staff | Not needed yet | — |
| Customer emails in Liquid and MJML, with a template editor and per-store colours and font | `spree/emails`; dashboard `settings/emails/*`; `Spree::Stores::EmailBranding` (R) | Staff, shoppers | Reuse | Liquorify's own emails (verification, billing) would be new templates. See LIQ-007 for branding |
| Reports and the dashboard's home metrics | `Spree::SavedReport`; dashboard `reports/*`, `index.tsx`; `reporting.mdx` (R) | Staff | Reuse | Customer order totals appear to be summed across stores (ISO-7, read in code, not tested) |

## 6. Payments, delivery, inventory and tax

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Payment methods, payment sessions, saved cards, refunds | `Spree::PaymentMethod`, `Spree::PaymentSession`, `Spree::CreditCard`, `Spree::Refund`; `payments.mdx` (R) | Staff, shoppers | Unknown | The payment provider merchants connect is unresolved, as are Stripe's rules for alcohol sellers |
| Stripe provider | `spree/providers/stripe`: 297 examples passed (R, V2) | Staff, shoppers | Unknown | The same open decision. The storefront also carries Stripe and PayPal client libraries |
| Delivery profiles, zones, methods and rates | `Spree::DeliveryProfile`, `Spree::DeliveryZone`, `Spree::DeliveryMethod`; dashboard `settings/delivery-profiles/*` (R) | Staff, shoppers | Unknown | Zones can limit where a product ships. Which places a merchant may ship alcohol to depends on launch geography and licensing, both unresolved |
| Pickup points and pickup delivery | `Spree::PickupPointOption`; `fulfillments.mdx` (R) | Shoppers | Unknown | The same open decision |
| EasyPost provider: live rates and shipping labels | `spree/providers/easypost`: 93 examples passed (R, V2) | Staff | Unknown | Carriers have their own rules for alcohol, which were not checked |
| Wholesale freight: cartons, pallets, freight quotes | `Spree::FreightSummary`; `freight.mdx` (R) | Staff | Not needed yet | — |
| Stock locations, stock levels, reservations | `Spree::StockLocation`, `Spree::StockItem`, `Spree::StockReservation`; dashboard `inventory` (R) | Staff, shoppers | Reuse | — |
| Stock transfers, purchase orders, suppliers | `Spree::StockTransfer`, `Spree::PurchaseOrder`, `Spree::Supplier`; dashboard `transfers/*`, `purchase-orders/*`, `suppliers.tsx` (R) | Staff | Not needed yet | — |
| Tax categories and rates, included or added tax, an external tax service | `Spree::TaxRate`, `Spree::TaxCategory`; dashboard `settings/taxes/*`; `taxes.mdx` (R) | Staff | Unknown | Liquorify's tax obligations need qualified review (specification C2), and alcohol duty is not modelled. The tax task bug is ISO-6 |
| Tax exemptions and tax identifiers | `Spree::TaxExemption`, `Spree::TaxIdentifier` (R) | Staff | Not needed yet | — |

## 7. Shoppers

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Shopper accounts: registration, sign-in, profile, addresses, order history, saved cards | `Spree::Customer`; storefront `account/*` (R) | Shoppers | Extend | Specification C3: a shopper has a separate account with each merchant. Today one account works at every store (ISO-1 to ISO-5). Explicit ownership (P2) is the extension |
| Customer groups | `Spree::CustomerGroup`; dashboard `customers/groups.tsx` (R) | Staff | Not needed yet | — |
| Companies, wholesale accounts and the wholesale storefront | `Spree::Company`; storefront `wholesale/*` (R) | Business buyers | Not needed yet | — |
| Wishlists | `Spree::Wishlist` (R) | Shoppers | Not needed yet | No storefront page for it at this revision |
| Newsletter sign-ups | `Spree::NewsletterSubscriber` (R) | Shoppers | Not needed yet | Marketing consent rules for alcohol were not checked |
| Data privacy: data requests, consent records, the right of withdrawal | `Spree::DataRequest`, `Spree::ConsentRecord`; `data-privacy.mdx` (R) | Shoppers, staff | Unknown | Data retention and the export period after a store closes are unresolved |

## 8. Marketplace and platform

| Spree feature | Where | Who | Disposition | Note |
|---|---|---|---|---|
| Marketplace: sellers, seller panel, product review, order splitting, commissions, payouts | `Spree::Seller`, `Spree::SellerPayout`, `Spree::CommissionRate`; `packages/seller-dashboard`; `sellers.mdx` (R) | Sellers, staff | Not needed yet | The specification gives each merchant its own store and does not use a marketplace. Modelling merchants as sellers would be a different tenancy option, which was not evaluated |
| Multi-tenant SaaS edition (tenant signup, subdomains, row-level isolation) | `docs/developer/multi-tenant/*` (U) | Platform | Unknown | It needs a Spree Enterprise licence and is not in this repository. Whether to ask Spree about it is unresolved |
| Multi-store administration: one staff account with roles in several stores | `Spree::RoleUser` (R) | Staff | Unknown | Whether one login may be staff at two businesses is unresolved |
| Platform update check and usage data sent to Spree | LIQ-003 SP-10 (R) | Platform | Unknown | FB-09 decides |

## 9. Liquorify needs that Spree does not cover

These come from the specification's proposals and its unresolved list. None is approved, and each stays a proposal or an open decision until the owner decides.

| Need | Spree today | Source |
|---|---|---|
| Merchant self sign-up with email verification and no account discovery | First-run setup and invitations only | F1 (proposal) |
| A business record above the store, with an owner | None; stores have no owner record | P1, F2 (proposal) |
| Liquorify's own subscription for merchants, its standing, and the billing hold | None; Spree takes shoppers' payments, not platform fees | F3 (proposal); billing provider unresolved |
| Store lifecycle states and independent holds, including going live and pausing | None | P4, F4 (proposal) |
| A storefront holding page while a store is not trading | None | F4 (proposal) |
| An operator console with separate operator accounts, permissions and an audit log | None; Spree's staff roles are per store | P5, F5 (proposal) |
| Support access to a store's data by the owner's time-limited grant | None | F5 (proposal) |
| Licence records, and whether Liquorify verifies them | None | Unresolved |
| Shopper age verification | None; shopper accounts have no date of birth | Unresolved |
| Delivery limits specific to alcohol, beyond zones | Zones and delivery profiles only | Unresolved |
| One storefront serving many merchants | The storefront takes its store name from a build setting and its logo from a static file, so each deployment shows one store | Unresolved (storefront hosting) |

## 10. What this baseline does not show

- **Behaviour.** Apart from the cited C and V evidence, nothing here was run. A listed feature may have defects, gaps for Liquorify's markets, or limits that only use reveals.
- **Fitness for alcohol commerce.** No feature was checked against alcohol rules for any place: age checks, licensing, delivery, promotions, marketing consent or duty.
- **Seller panel and wholesale screens** were not read beyond their routes.
- **Isolation.** Every row inherits the open findings ISO-1 to ISO-7 where shopper accounts or cross-store totals are involved.
- **Liquorify changes.** None exist yet. Every extension above is a proposal.

## 11. How this links to the other records

- **SES-001.** It supports Product & Design capabilities PD-02, PD-06, PD-07, PD-08, PD-17 and PD-19 ([LIQ-003](LIQ-003-engineering-baseline.md#3-capability-baseline)) without changing their findings. The specification remains the requirements record (PD-06).
- **ENG-001.** It is the classification that [ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc) asks for before a feature is built: reusable, needing extension, or missing.
- **Design system.** The design system rows are in [LIQ-007](LIQ-007-design-system-adoption-and-extension.md).
- **When to revise it.** When the owner accepts or revises the specification, when an unresolved decision above is made, or when Liquorify takes a new Spree release (FB-12).
