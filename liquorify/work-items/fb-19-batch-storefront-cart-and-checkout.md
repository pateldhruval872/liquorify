---
title: FB-19 batch 9, storefront cart and checkout
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts, or delegates acceptance; an automated Claude session implements
created: 2026-11-04
updated: 2026-11-04
---

# FB-19 batch 9: storefront cart and checkout

The storefront's third FB-19 batch organised by product area. It reproduces what the storefront already has for buying: the cart drawer, the cart page, checkout with its address, delivery and payment steps, the page that finishes a payment after a provider's extra check, the order placed page, and the order confirmation emails. Nothing here changes the storefront's code or Spree's, or adds a Liquorify feature.

**Status.** PROPOSED on 2026-11-04, in its own records pull request, prepared while batch 7 runs, as the coordinating session asked. It depends on the storefront shop batch, which the owner accepted and merged; on batch 7, whose settings it checks at checkout (decision 6); and on OA-1, done on 2026-10-23, for the storefront's browser tests in CI ([LIQ-004](../LIQ-004-foundation-backlog.md#proposed-order-of-the-remaining-batches), batch 9). Its work starts after batch 7's merge, in the next free lane, in dependency order. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch) and has the same shape as the [storefront shop batch](fb-19-batch-storefront-shop.md). One question needs the owner (§7): where the real Stripe states and G-13 go. The other choices are planning within the approved scope, recorded in §8 as decided under the owner's delegation of 2026-11-04.

**Reading of the instruction.** LIQ-004's batch 9 row names CAP-06-01, CAP-06-02 and CAP-07-03, with the confirmation emails. Four earlier records hand work to it, and all four are read as part of it:
- **Decision 6** moved the checkout effects of batch 7's payment, delivery and tax settings here, and the setup batch left payment capture to batches 7 and 9. These are G-38's checkout part, which batch 7's pull request, [#41](https://github.com/pateldhruval872/liquorify/pull/41), also records as G-71.
- **G-02's last part**, from the pilot: the cart drawer opened with a pointer, its own states, its loading state, the toaster's error and the button's other five stories.
- **G-13**, the saved card states with a real card, and **G-44 with G-49**, the two storefront tests that fail on the cart drawer's two links with one name.
- **FL-16 and FL-17's checkout steps**, which part 3 of the catalog batch hands on ([§12.8](fb-19-batch-catalog-and-pricing.md#128-fl-16-and-fl-17-their-dashboard-steps)).

CAP-07-04 and CAP-07-05 are read as their checkout side only; their dashboard side is batch 7's.

## 1. Outcome and summary

Every cart and checkout screen has Storybook stories for the components it uses, captures of the running screen in each meaningful state at the storefront's two widths, a step-by-step map of FL-05 from the cart to the order placed, and the three permission claims recorded apart. The map links each capability to its evidence or to a named gap.

- **Bounded:** 4 screens and 2 overlays, 2 emails, the rest of FL-05, one step each of FL-16 and FL-17, and 13 new components, in one storefront pull request and one backend records pull request (§8).
- **Payment without keys on the running screens:** an order is placed with Spree's Check method, which needs no payment session, and with a gift card that covers the whole total. The Stripe, Adyen and PayPal forms are shown in stories with their providers' libraries replaced by stand-ins, and are labelled as such (§2.5). The real Stripe states are the owner's question (§7).
- **No secret is published:** payment settings, publishable keys and the webhook signing secret are kept out of every capture and record (criterion 15).
- **Spree and the storefront stay unchanged:** only Storybook files, mocks, scripts, evidence and records change.
- **Function is recorded apart from coverage:** a capture shows one state of a screen, not that checkout works.

## 2. Scope

### 2.1 Capabilities, screens, flows and tests

| Capability ([LIQ-006](../LIQ-006-product-capability-baseline.md)) | Screens ([LIQ-008](../LIQ-008-spree-screen-inventory.md)) | Flow | Browser tests |
|---|---|---|---|
| CAP-06-01 Cart and guest checkout, with stock held during checkout | SF-OVL-02, SF-SHOP-05, SF-CHK-01, SF-CHK-03, SF-OVL-05 | FL-05, from the cart drawer to the order placed | `e2e/cart.spec.ts` (2 tests); `e2e/checkout.spec.ts`, "guest can complete a checkout with a Stripe test card" |
| CAP-06-02 Express checkout buttons | SF-OVL-02, SF-SHOP-05, SF-CHK-01 | None | None |
| CAP-07-03 Storefront payment forms for Adyen and PayPal, with the Stripe form beside them | SF-CHK-01, SF-CHK-02 | FL-05, the payment step | `checkout.spec.ts`, for Stripe only |
| CAP-07-01 Payment sessions and saved cards, checkout's part | SF-CHK-01, SF-CHK-02 | FL-05, the payment step | As above |
| CAP-07-04 Delivery rates per shipment, at checkout | SF-CHK-01 | FL-05, the delivery step | `checkout.spec.ts` chooses a rate |
| CAP-07-05 Pickup at checkout | SF-CHK-01 | None | None. The storefront at `8865498` has no pickup choice (§2.7) |
| CAP-07-11 Tax included in prices or added to them, at checkout | SF-SHOP-05, SF-CHK-01 | None | None |
| CAP-05-12 Promotions: a coupon entered | SF-CHK-01 | FL-16, the coupon step | None |
| CAP-05-13 Gift cards and store credit: redeemed at checkout | SF-CHK-01, with the totals of SF-SHOP-05 | FL-17, the redeeming step | None |
| CAP-03-09 Store policies: consent at checkout | SF-CHK-01 | None | None |

The storefront's own unit tests for these screens run with the batch and are recorded: `CartContext.test.tsx`, the cart, checkout and payment tests in `lib/data/__tests__/`, `express-checkout.test.ts` and the confirm payment page's `page.test.tsx`.

The emails are EM-C-01, Spree's order confirmation, and EM-SF-01, the storefront's own, sent when it receives Spree's `order.placed` webhook (§2.6).

### 2.2 Meaningful states to capture

From LIQ-008 and from what the components render at storefront `8865498`, at the mobile (390 pixels) and desktop (1280 pixels) widths the storefront's stories use.

| Screen | States |
|---|---|
| SF-OVL-02 Cart drawer | Opened from the header with a pointer and with the keyboard; empty; with items; loading; a quantity changed; an item removed; failing to add, update or remove, with the toaster's error |
| SF-SHOP-05 Cart | Empty, pointing back to the catalog; with items; a quantity changed; an item removed; the update failing; a gift card and store credit in the totals, with the amount due; tax included and tax added; in a second market's currency |
| SF-CHK-01 Checkout | Loading; an empty cart; the checkout failing to load; a guest's contact and shipping address; a signed-in customer choosing a saved address; billing the same as shipping and different; no delivery methods before an address; one shipment and two, each with its rates and where it ships from; a rate refused; the payment methods offered; Check chosen; Spree's test gateway, which the storefront does not support; no payment methods; nothing to pay after a gift card; the policy consent required; a coupon applied, refused and removed; a gift card applied, refused and removed; placing the order; the order refused; a payment error returned in the address |
| SF-CHK-02 Confirm payment | Finalizing; failed |
| SF-CHK-03 Order placed | A signed-in customer, greeted by name; a guest; not found; failing to load |
| SF-OVL-05 Checkout address editor | Adding and editing an address in checkout; a save refused |

The Stripe, Adyen and PayPal forms, the express checkout buttons and checkout's saved card list are shown in stories only (§2.5). A state reached by holding, failing or answering a request in the browser or through the capture script's proxy says so in its note and claims nothing about the server, as G-27 and G-34 recorded. SF-CHK-02 is reached by opening its address with the values a provider would return; its captures say so and claim nothing about a provider. A state no running screen shows is a gap, with its story checked against its source.

### 2.3 Who sees what

The storefront has no roles. The variants are who is asking and how the store is set up:
- **A guest and a signed-in customer:** a guest gives an email and an address; a customer chooses from saved addresses and is greeted by name on the order placed page. Both are captured.
- **Two markets:** the United States in dollars, and a second market in another currency and language, for the cart and checkout totals.
- **The store's checkout settings** from batch 7's screens, in §2.4.

### 2.4 Settings saved in the dashboard, seen at checkout (G-38's checkout part)

Each setting is saved through batch 7's own dashboard screen in a browser, against this lane's server, as part 2 of the storefront shop batch did for G-38's storefront part. The cart or checkout is then captured where the setting should show. Every setting is put back afterwards.

| Setting | Saved on | Seen at checkout |
|---|---|---|
| A payment method made visible on the storefront, hidden, or inactive | DA-SET-12 | Offered in the payment step, or not. Spree's sample data hides both of its methods from the storefront, so the first capture shows no payment methods |
| A delivery method's flat rate, with amounts in a second currency and a condition | DA-SET-17 | The rates offered for each shipment, in the market's currency, and withheld where the condition is not met |
| A zone that leaves out a country | DA-SET-17 | No method offered for an address in that country |
| The freight rate provider with a markup | DA-SET-17 | The rate offered |
| Pickup offered from a profile | DA-SET-17 | Recorded as the storefront shows it (§2.7) |
| A digital profile and method | DA-SET-16, DA-SET-17 | A digital product's shipment |
| A tax rate, included in prices and then added to them | DA-SET-14 | The cart and checkout totals |
| The store's payment capture setting | DA-SET-02, the payments section | The payment's state on the order once placed, read through the Store API and on the shopper's order page (SF-ACC-06). Its effect on the order screens is batch 8's |

A difference from what the dashboard says is recorded as Spree's or the storefront's behaviour, and nothing is changed. G-38 closes only on the owner's acceptance; its order and inventory parts stay with batches 8 and 6, and real providers with P4.

### 2.5 Payment on the running screens

- **Spree's Check method** needs no payment session, so the storefront places the order directly. FL-05's last steps use it, once DA-SET-12 makes it visible on the storefront.
- **Spree's test gateway** asks for a payment session, which the storefront has no form for, so the payment step says the method is not supported. It is captured as the storefront shows it.
- **A gift card covering the whole total** needs no payment. It is FL-17's redeeming step.
- **Stripe, Adyen and PayPal:** the browser-test server loads none of their gems and the lane has no keys (decision 5), so their forms, the express checkout buttons, SF-CHK-02 after a real provider's check, and checkout's saved card list are shown in stories with stand-ins for the providers' libraries. Each story is checked against its source and labelled as mocked, and claims nothing about a provider. Checkout's saved card list reads the card's brand the same way SD-1 records, so its story shows a card with a brand.
- **The storefront's checkout test** pays with a Stripe test card in the storefront's CI, with OA-1's keys, against Spree's published image rather than this repository's backend (FB-06). Its result at the batch's revision is recorded as what it is.

### 2.6 Emails

- **EM-C-01, Spree's order confirmation:** rendered from Spree's mailer preview at 390 and 1280 pixels, as the accounts batch rendered EM-C-08, and Spree's order mailer specs are run. For the order placed on the running stack, whether Spree sent it is read from the server's own record of sent mail where its test setup keeps one; otherwise sending is a gap.
- **EM-SF-01, the storefront's order confirmation:** if the browser-test server can send a signed `order.placed` webhook to the running storefront, with a signing secret made for the run and never recorded, the storefront writes the email to a file because no Resend key is set, and that file is captured. Otherwise it is rendered with the same call the storefront's webhook handler makes, as the accounts batch rendered EM-SF-04. Sending through Resend is not run.

### 2.7 Left out, and where it goes

- **The real Stripe states, saved cards with a brand and G-13:** the owner's question (§7).
- **Adyen and PayPal on a running screen:** their backend gems are not in these repositories (LIQ-006 §12). Stories only.
- **Pickup at checkout:** the storefront at `8865498` offers no pickup choice, though Spree's delivery settings can offer it. The batch records this as found and captures what checkout shows; it adds nothing.
- **Store credit at checkout:** Spree's Store API lets a signed-in customer apply store credit, but the storefront has no control for it, and shows it only in the totals once applied. The totals state is reached by applying it through the Store API, and says so.
- **The coupon on the cart page:** LIQ-008 lists a coupon and gift card on SF-SHOP-05. At `8865498` codes are entered only in checkout's sidebar, and the cart page shows an applied gift card and store credit in its totals. The batch records it as a correction to LIQ-008.
- **Holding stock during checkout:** the storefront shows no hold. Spree's stock reservation specs are run and listed; an item that sells out during checkout is captured if the running stack can show it, and is otherwise a gap.
- **The order in the dashboard (DA-ORD-01, DA-ORD-04), its discounts, refunds and order numbers:** batch 8. The order placed is opened once in the dashboard's order list, to record that it arrived, without stories.
- **Paying for an order staff made (FL-08):** batch 8. **Wholesale checkout:** batch 12. **A seller's order (FL-13):** batch 13.
- **Age checks at guest checkout and where alcohol may ship** (LIQ-006's notes on CAP-06-01 and CAP-07-04): Liquorify's questions, deferred.

## 3. Components

New stories, 13 components ([LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) §5). The list comes from what the cart page, the three checkout pages and the cart drawer import at storefront `8865498`, followed through the components they import in turn; the batch's first step confirms it against the running screens.

| Layer | Components |
|---|---|
| Primitives (`src/components/ui/`) | `radio-group` (CMP-SF-P-18), used by the address selector and the delivery and payment choices |
| `checkout/` (CMP-SF-G-04) | AddressSection, AddressSelector, DeliveryMethodSection, PaymentSection, CouponCode, Summary, ExpressCheckoutButton, StripePaymentForm, AdyenPaymentForm, PayPalPaymentForm |
| Page level | CheckoutPageContent (CMP-SF-PG-01), CheckoutSidebar (CMP-SF-PG-02) |

Already covered and reused: CartDrawer and QuantityPickerField, AddressEditModal and AddressFormFields, AddressBlock, OrderTotals and PaymentInfo, PolicyConsent, and the primitives `alert`, `button`, `checkbox`, `dialog`, `input`, `native-select`, `product-image`, `quantity-picker` and `sheet`. The cart drawer's stories gain the states G-02 left (§2.2), and the button's other five stories are compared where checkout shows them. The cart page, the confirm payment page and the order placed page are written inside their page files, so they are captured as running screens.

## 4. Delivery

- **Storefront pull request:** stories, fixtures and mocks, the stand-ins for the payment providers' libraries, reference images, and additions to the scripts that capture and compare the running screens. It builds on storefront `main`.
- **Backend records pull request:** this work item, then the verification record, the published evidence, the image review list and LIQ-009's storefront column. It builds on `main` after batch 7's merge.
- **Running screens:** the storefront built for production at its `main`, against the backend's browser-test server at `main` after batch 7's merge, in this lane's own checkout, so its database is its own. Spree's sample catalog is loaded with Spree's own task, as the storefront shop batch did. The settings in §2.4, a promotion with a coupon code and a gift card are saved through the dashboard's own screens in a browser; part 3 of the catalog batch captures the promotion and gift card screens, so this batch takes no stories of them. A customer with saved addresses is registered by the capture run.
- **Browser tests:** the two cart tests and the product page's five tests run against this lane's data and against the storefront's own test data, so G-44 and G-49 are settled either way. The checkout test needs Stripe keys, so its CI result is recorded (§2.5).
- **Captures:** in the storefront's pinned Playwright image, at 390 and 1280 pixels, with the fonts served offline.

**Size, estimated from the storefront shop batch:** about 70 stories and 140 reference images, and about 80 running-screen captures.

## 5. Acceptance criteria

The storefront shop batch's criteria 1 to 13, applied to this batch, with criterion 11 changed for the owner's delegation and four added.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record |
| 2 | Every component the batch's screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | The image review list |
| 3 | Every screen and overlay is captured on the running storefront in each state in §2.2, at both widths | The evidence index |
| 4 | Each variant in §2.3 is captured, showing what the interface does for it | The captures |
| 5 | FL-05's steps from the cart to the order placed, and the checkout steps of FL-16 and FL-17, are mapped to the browser tests that cover them, and their result at the batch's revision is recorded, in CI where the end-to-end job runs them | The flow map |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | The comparison record |
| 7 | A state no running screen shows is a gap, with the check made instead; a state reached in the browser says so | The gaps section |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | The CI runs |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | The pull requests' file lists |
| 10 | The records are updated, with every link checked | The record and the link check |
| 11 | The reference images, the screen evidence and fidelity are accepted, by the owner or, under the owner's delegation of 2026-11-04, by the coordinating session, recorded as delegated acceptance and never as the owner's review | The acceptance record |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for carts, items, fulfillments, payments, payment sessions, discount codes, gift cards, store credits and orders, and its stock reservation specs, run at the batch's revision. What no spec exercises is NOT_RUN | The spec run |
| 13 | Tenant isolation is NOT_RUN. ISO-4, a shopper of one store signing in at another, would carry into a signed-in checkout; whether one store's cart or order can be reached through another store's storefront is FB-03's. A new isolation defect is reported to the owner privately | The isolation section |
| 14 | Each setting in §2.4 is saved through its dashboard screen and seen, or not, at checkout, with the result recorded per setting | Captures of both sides, and the record |
| 15 | No secret is published: payment settings, publishable keys and the webhook signing secret are masked in every capture and replaced in every record, and stories use invented values that do not look like a key | The captures, the stories and a search of the pull requests |
| 16 | Each payment path in §2.5 records what it shows and what it claims; every mocked story says so; the checkout test's result names the backend it ran against | The payment section of the record |
| 17 | Each email in §2.6 is rendered and captured at both widths, and whether it was sent is recorded, or kept as a gap | The emails section |

The behaviours no browser test covers are listed under criterion 7, as G-57 listed part 1's.

## 6. Flow steps

### FL-05, from the cart to the order placed

| Step | Browser tests |
|---|---|
| SF-SHOP-04 adds to the cart, and SF-OVL-02 opens | `product.spec.ts`: "adds the chosen quantity to the cart" (G-49) |
| SF-OVL-02 and SF-SHOP-05: change the quantity, remove an item, go to checkout | `cart.spec.ts`: "an empty cart points back to the catalog", "a customer changes the quantity and removes the item" (G-44) |
| SF-CHK-01: contact and shipping address | `checkout.spec.ts`: "guest can complete a checkout with a Stripe test card" |
| SF-CHK-01: the delivery rate for each shipment | The same test |
| SF-CHK-01: payment, and placing the order | The same test, with Stripe, in CI. With Check: none, captured |
| SF-CHK-02 when the provider asks for an extra check | None; the confirm payment page's unit test |
| SF-CHK-03: the order placed | `checkout.spec.ts` |
| EM-C-01 or EM-SF-01 | None (§2.6) |
| DA-ORD-01 and DA-ORD-04 | Batch 8 |

### FL-16 and FL-17, their checkout steps

| Step | Browser tests |
|---|---|
| FL-16, SF-CHK-01: the coupon entered, for a promotion saved in the dashboard | None, captured |
| FL-17, SF-CHK-01: the gift card redeemed, for a card issued in the dashboard | None, captured |
| FL-17, SF-ACC-09: the card's balance afterwards | None, captured; the accounts batch covered the page |

## 7. Question for the owner

**Where do the real Stripe states and G-13 go?** G-13 keeps the saved card states with a real card open, deferred to this batch "with OA-1's keys". OA-1's keys exist only in the storefront repository's CI settings. Capturing a real Stripe form, a card saved with its brand, or express checkout on this lane's stack would need Stripe test keys in the implementation environment and a backend that loads the Stripe gem with its secret key, which is OA-8's ground, or a new capture step in the storefront's CI, which criterion 9 rules out.
- **Recommended:** move G-13 and the real Stripe states to P4, which already waits for the backend sandbox keys (decision 31). Batch 9 then runs without keys, as §2.5 sets out, and records the storefront CI's Stripe checkout as function evidence against Spree's published image.
- **Alternative 1:** keep G-13 here and provide Stripe test keys to the implementation environment before batch 9 starts. The Stripe part waits until they exist.
- **Alternative 2:** defer G-13 until FB-06 points the storefront's CI at this repository's backend, so the Stripe states are checked against Liquorify's own server.

Batch 9 does not wait for the answer to start the rest of its work. G-13 stays open whichever is chosen.

## 8. Choices made under the owner's delegation

Planning within the approved scope, which the owner's delegation of 2026-11-04 lets the coordinating session decide. Each is recorded as decided under that delegation, never as the owner's answer, and the owner may change any of them.

1. **One storefront pull request and one records pull request.** The batch has 13 new components, about half of part 2 of the storefront shop batch. Splitting the cart from checkout would add a review without reducing risk, because checkout reuses the cart's states.
2. **The batch starts after batch 7's merge,** because §2.4 saves settings through batch 7's screens. Starting earlier would check settings whose screens are not yet accepted.
3. **Check pays for the running orders,** because it is the only method in Spree's sample data that the storefront can complete without a provider.
4. **The promotion and gift card are made through the dashboard,** so FL-16 and FL-17 are walked from the dashboard to checkout, while their dashboard stories stay with part 3.

## 9. Gaps known before the work starts

| Gap | What would close it |
|---|---|
| The real Stripe states, a saved card with its brand, and G-13 | The owner's answer to §7 |
| Adyen and PayPal on a running screen | Their gems and accounts, outside these repositories |
| No browser test applies a coupon or a gift card, chooses a saved address, or pays with a method other than Stripe | Browser tests the batch does not add; the captures and the storefront's unit tests are recorded instead |
| Pickup and store credit have no control in the storefront's checkout | Recorded as found; a change to the storefront is outside the baseline |
| Whether either confirmation email is sent | §2.6; a gap where the test setup keeps no record |
| Holding stock during checkout, seen from the storefront | Spree's specs, and a capture if the running stack shows a sell-out |
| The checkout test runs against Spree's published image, not this repository's backend | FB-06 |
| Tenant isolation (criterion 13) | FB-03's validation, the owner's acceptance of its result, and the fixes for ISO-1 to ISO-7 |

## 10. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts, or delegates acceptance; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. Orders, settings and data added for the captures go only to this lane's browser-test database, which is local and discarded after the run. Criterion 15 keeps secrets out of the repositories.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
