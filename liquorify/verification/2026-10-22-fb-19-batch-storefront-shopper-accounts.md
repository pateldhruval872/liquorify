---
title: FB-19 storefront shopper accounts batch
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the map, the stories and their images, the running-screen captures, the comparison with running screens after two corrections to the stories, the two password reset emails rendered, Spree's account specs, and the storefront's own account browser tests run locally. Three listed states could not be reached and a fourth shows the page failing; three flow steps are gaps. Coverage and functional verification are recorded apart (§2): no capability is functionally verified in full, FL-09 is PARTIAL, and recording the consent and opening the saved cards fail, the existing defects SD-2 and SD-1. The storefront shows eleven behaviours the work item did not expect, recorded as its behaviour. Tenant isolation and the owner's acceptance are NOT_RUN. CI at `49e1c37`: the visual check passed twice, 244 of 244 each time, and Lint, Type Check and Unit Tests passed. The storefront's end-to-end job stopped at its check for Stripe test keys before any test ran (OA-1). On 2026-10-22 the storefront's capture was corrected to leave room around each story, at `2e5f119`, and the 136 images captured by their root were regenerated, each identical inside to the one it replaced
---

# FB-19 storefront shopper accounts batch

**Claim.** The [storefront shopper accounts batch](../work-items/fb-19-batch-storefront-shopper-accounts.md) reproduces what the storefront already has for shopper accounts: signing in, registering, resetting a password, and the signed-in account's orders, addresses, saved cards, gift cards and profile. It gives the 25 components those screens use 103 Storybook stories, with a reference image at each of the storefront's two widths. It captures the ten account screens on the running storefront in each meaningful state and for each kind of visitor, compares 19 cases with their stories, renders the two password reset emails, runs Spree's own account specs and the storefront's own account browser tests, and records the three permission claims apart. It follows the batch rules of [LIQ-010 0.4](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch), as the staff access batch does.

**Revisions.**

| What | Revision |
|---|---|
| Stories, scripts and reference images | Storefront draft pull request [#18](https://github.com/pateldhruval872/liquorify-storefront/pull/18) at `49e1c37`, one commit on storefront `main` `8153a6b` |
| This record and its evidence | Draft pull request [#12](https://github.com/pateldhruval872/liquorify/pull/12), which builds on #11's branch |
| The storefront's code | `main` `8153a6b`. The branch changes none of it: `git diff 8153a6b 49e1c37` over `src/`, `messages/`, `e2e/`, `.github/`, `package.json` and `pnpm-lock.yaml` is empty |
| Spree's code: the API, the emails and the browser-test server | Backend `main` `a4a1708`. Neither pull request changes it |
| Running screens | The storefront at `8153a6b`, built for production with the `@spree/sdk` 2.0.0-rc.3 it pins, against the backend's browser-test Rails server and fixtures at `a4a1708`, which ships the SDK at rc.4 (FB-06). Captured in the storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels wide, with the fonts served offline |

**Results.**

| # | Criterion ([work item §5](../work-items/fb-19-batch-storefront-shopper-accounts.md#5-acceptance-criteria)) | Result |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails | PASS: the map in §2 has every ID from the work item's §2.1, with its evidence or a named gap |
| 2 | Every component the account screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | PASS: 25 new components, 103 stories, 206 reference images, each looked at before it was committed (§1, [image review list](2026-10-22-fb-19-batch-storefront-shopper-accounts-image-review.md)). The two reused components are listed in §1 |
| 3 | Every screen is captured on the running storefront in each state in §2.2, at both widths | PASS for 36 of the 40 states the work item lists. The captures show 38 states of the ten screens in all, at both widths. Three listed states could not be reached: SF-ACC-07 "set as default", SF-ACC-08 "remove confirmation" and SF-ACC-09 "canceled". A fourth, SF-ACC-08 "cards listed", was captured, but the page fails for the test customer's card (§2.1, B1, §7) |
| 4 | Each variant in §2.3 is captured, showing what the interface does for it | PASS as evidence of what the interface shows, for all four: a guest, the signed-in test customer, a newly registered customer, and the test customer opening another customer's order (§3.1) |
| 5 | FL-09 is mapped step by step to the browser tests that cover it, and their result at the batch's revision is recorded, or why they could not run | PASS for the mapping (§2.2). The seven account browser tests passed locally at `8153a6b` against the browser-test server. They cannot run in CI, whose end-to-end job stops before any test without Stripe test keys (OA-1). Three steps, the password reset, are covered by no test and are gaps |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | PASS, as a diagnostic: 19 cases at both widths show no unexplained difference after two corrections to the stories and four to the comparison script (§4). The owner's acceptance of fidelity is criterion 11 |
| 7 | A state no running screen shows is a gap, with the check made instead | PASS: 82 of the 103 stories were not compared by the script; 33 of them show a state seen in a running-screen capture, and 49 were checked against their source only (§7, image review list) |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | PASS for the visual check: at `49e1c37` it passed twice, 244 of 244 comparisons each time, once on the pull request and once started by hand. It stays advisory. Lint, Type Check and Unit Tests passed. The end-to-end job FAILED at its first step, the check for Stripe test keys, before any test ran: this is OA-1, which the work item named in §7, and not a result about this batch. Its account tests were run locally instead (criterion 5, §2.2). After the capture correction below, two local runs at `2e5f119` passed 244 of 244; CI's runs on that revision are reported in #18 |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | PASS: #18 changes only `stories/`, `visual/` and Storybook's preview, which now replaces three more server modules with mocks inside Storybook only. #12 changes only `liquorify/` |
| 10 | The records are updated, with every link checked | PASS: this record, the image review list, the evidence index, LIQ-009's storefront Storybook column, LIQ-004's progress and FB-19 entry, the work item and the README index, with the link check run |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | NOT_RUN: #18 and #12 are drafts |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for the account endpoints, run at the batch's revision. What no spec exercises is NOT_RUN | PASS for what Spree's specs exercise: 214 Store API examples in 15 files and 20 examples of the registration workflow, no failures (§3.2). What no spec exercises is NOT_RUN |
| 13 | Tenant isolation is NOT_RUN, with the open findings linked; a new isolation defect is reported to the owner privately | NOT_RUN (§3.3), with ISO-4 and ISO-5 linked. No new isolation defect was found; none was looked for beyond Spree's own specs |

### Capture correction on 2026-10-22

The owner's review of #9 found that the visual check cut off focus rings that paint past a story's root element. The storefront's visual check captured stories the same way, so #18 takes the same correction at `2e5f119`: a story with the padded layout is captured with 8 pixels of room on each side, taken from the layout's own padding, so the story does not move ([LIQ-010 §11.3](../LIQ-010-design-system-reproduction-architecture.md#113-what-the-test-does)). The storefront's code, the stories and the screenshot tolerance are unchanged.

**What was cut off.** Six stories painted 1 pixel past their root, at both widths: the focus rings of the pilot's button and of this batch's input and native select, and the left edge of the first column of text in the three order totals stories.

**Images.** The 136 images captured by their root were regenerated in the pinned image: this batch's 112, of 56 stories, and 24 of the pilot's. The other 108, of stories with the full-screen layout or captured as the whole viewport, are captured as before and are unchanged. Each new image is 16 pixels wider and taller than the one it replaced and, inside the room, identical to it pixel for pixel, in all 136. The room holds something painted in the 12 images of the six stories above, and only the page colour in the other 124. The six focus images were looked at before and after at twice their size: each ring is now whole, and nothing else moved.

## 1. What was built

**Stories, 103, for the 25 new components.** Every story is tagged with its LIQ-009 ID; the [image review list](2026-10-22-fb-19-batch-storefront-shopper-accounts-image-review.md) names each one. Each has a reference image at 390 pixels (mobile) and 1280 pixels (desktop). The storefront shows no dark mode, so there is one theme ([LIQ-010 §8](../LIQ-010-design-system-reproduction-architecture.md#8-themes-and-widths-captured)).

| Layer | Component (LIQ-009 ID) | Stories |
|---|---|---|
| Primitives | `alert-dialog` (CMP-SF-P-01) | Default (the delete address confirmation), Small, With media |
| | `alert` (CMP-SF-P-02) | Destructive, Default, Without icon, With action |
| | `card` (CMP-SF-P-05) | Default (the sign-in card), Tile (an overview tile) |
| | `checkbox` (CMP-SF-P-07) | Unchecked, Checked, Invalid, Disabled, Disabled checked, Focus visible |
| | `dialog` (CMP-SF-P-08) | Default, Without close button, Footer close button |
| | `field` (CMP-SF-P-10) | Default, With description, With error, Disabled, Horizontal, Group |
| | `input` (CMP-SF-P-12) | Default, Filled, Password, Invalid, Disabled, Focused |
| | `label` (CMP-SF-P-13) | Default, With checkbox, Disabled |
| | `native-select` (CMP-SF-P-14) | Placeholder, Selected, Small, Disabled, Invalid, With groups, Focused |
| | `product-image` (CMP-SF-P-16) | With image, No image, Broken |
| `account/` (CMP-SF-G-01) | AccountShell | Overview, In a section, Without name |
| | AuthenticatedAccountShell | Signed in, Checking session, Guest |
| | CreditCardList | Cards listed, Remove confirmation, Unrecognized brand |
| | GiftCardList | Every state, Active only, Partially used, Fully redeemed, Canceled, Expired |
| | OrderDetail | Shipped, Partially shipped, Unfulfilled, Canceled, Without shipments, Every total |
| | OrderList | Orders listed, One order |
| `addresses/` (CMP-SF-G-02) | AddressManagement | Addresses listed, No addresses, Adding, Editing, Save refused, Delete confirmation |
| `checkout/` (CMP-SF-G-04), the address editor | AddressEditModal | Adding, Editing, Country without states, While states load, Saving, Save refused |
| | AddressFormFields | Empty, Filled, Loading states, Country without states |
| `order/` (CMP-SF-G-08) | AddressBlock | Full, Minimal |
| | FulfillmentBlock | Shipped, Awaiting shipment, Canceled, Several items, Without address |
| | LineItemCard | With image, Without image, Several without options |
| | OrderTotals | Default, Paid by gift card, Every total |
| | PaymentInfo | Card, Other card brand, Gift card, Store credit, Other method |
| `policy/` (CMP-SF-G-09) | PolicyConsent | Unchecked, Checked, Required |

**Already covered, reused by these screens:** `button` (CMP-SF-P-04) and the toaster (CMP-SF-P-21), from the pilot. The account pages' own forms are written inside the page files rather than as components, so they are shown by the running-screen captures (§2.1).

**Fixtures and mocks.** Account fixtures (a customer, addresses, orders in each state, saved cards, gift cards in each state, countries and their states), with a check that they match the SDK's types. Storybook's preview now also replaces the storefront's address, country and saved card server modules, so stories give them fixtures as they already did for the cart and the customer. The application code is unchanged.

**A frame for the account pages.** A shared decorator lays out the account pages' content column as the account shell does, with the navigation's place left empty, so a page component is 928 pixels wide at the desktop width, as on the running storefront (§4.2).

**Scripts beside the Storybook (`visual/fidelity/`).**
- `screens.spec.ts` captures each account screen on the built storefront in each state and for each variant, and writes beside each image how the state was reached. It signs in as the test customer and registers a new one, so it writes to the backend's database: it is pointed only at a test server.
- `accounts.ts` reads the test customer and their orders from a file named by `FIDELITY_ACCOUNTS`, which holds a password and stays outside the repository.
- `compare.spec.ts` gains the 19 account cases.

## 2. The batch map, completed

The map from the [work item §2.1](../work-items/fb-19-batch-storefront-shopper-accounts.md#21-capabilities-screens-flows-and-emails), with the evidence and result of each row. Capture paths are in the [evidence index](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/README.md).

Coverage and functional verification are kept apart, at the owner's instruction of 2026-10-22 ([LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete), criterion 9). **Coverage** is what exists: the mapped IDs, stories, captures, rendered emails and Spree's own specs. A capture shows one state of a screen, not that a flow works. **Functionally verified** is whether the capability's flow, or the behaviour named, was shown to work end to end at the batch's revisions. No capability in this batch is functionally verified in full.

| Capability | Screens | Flow | Emails | Who may see it | Components | Evidence | Coverage | Functionally verified |
|---|---|---|---|---|---|---|---|---|
| CAP-08-01 Shopper accounts | SF-ACC-01 to SF-ACC-10 | FL-09 | EM-C-08, EM-SF-04 | A guest: SF-ACC-01 to SF-ACC-04. A signed-in customer: the overview and SF-ACC-05 to SF-ACC-10, for their own records | All 25 above; reused `button`, toaster | 103 stories; 38 states captured at both widths; 19 cases compared; 7 browser tests passed locally; both emails rendered; the three permission claims | PASS, with gaps: three listed states (§7), the password reset steps in FL-09, and the browser tests in CI (OA-1) | PARTIAL: registering, signing in and reaching every section passed in the storefront's browser tests, run locally (§2.2). The three password reset steps have no test, and the tests are BLOCKED in CI by OA-1 |
| CAP-03-09 Store policies, the consent at registration | SF-ACC-02 | FL-09 | None | A guest | PolicyConsent; reused within it: `checkbox`, `label` | 3 stories; "policy consent required" captured; 1 case compared; Spree's registration workflow spec | PASS for what the storefront shows. The storefront does not send the consent to Spree, so no consent is recorded (B9) | FAIL for recording the consent, the existing defect SD-2 in LIQ-004. Requiring it is exercised by the sign-up test |
| CAP-06-09 Shopper order history and tracking | SF-ACC-05, SF-ACC-06 | FL-09 | None | The signed-in customer, their own orders | OrderList, OrderDetail, FulfillmentBlock, LineItemCard, AddressBlock, PaymentInfo, OrderTotals, `product-image` | 31 stories; 9 states captured, including another customer's order; 9 cases compared; Spree's order specs | PASS, with found behaviour B1 and B4 to B7 | PARTIAL: the browser tests reach the orders page and check no order. An order paid with a saved card FAILs to open (SD-1) |
| CAP-05-13 Gift cards, the shopper's list | SF-ACC-09 | FL-09 | None | The signed-in customer, their own cards | GiftCardList | 6 stories; an active, a partly used, a fully redeemed and an expired card on one page, and none; 1 case compared; Spree's gift card specs | PASS, with one gap: a canceled card (§7), and found behaviour B2 and B3 | PARTIAL: the browser tests reach the page and check no card |
| CAP-07-01 Saved cards, the shopper's list | SF-ACC-08 | FL-09 | None | The signed-in customer, their own cards | CreditCardList, `alert-dialog` | 3 stories; "no cards" captured; Spree's saved card specs | PASS for the stories and "no cards". The page fails for the only card the test server can save (B1), so "cards listed" and "remove confirmation" are gaps until a gateway with test keys saves a card with a brand (OA-1) | FAIL for the test gateway's card (SD-1); BLOCKED for a real card by OA-1. No test removes a card |

### 2.1 Screens and their states

Each capture is `screens/<screen ID>/<state>/<variant>-light-<width>.webp` in the evidence folder, at 390 and 1280 pixels, with a JSON note that records the path, the variant and how the state was reached. A state that could not be reached has a `-unavailable.json` note saying why.

| Screen | States captured (variant) | Listed states not captured |
|---|---|---|
| SF-ACC-01 Sign in and account overview | sign-in form; wrong password; sent to sign in, from an account page (guest); returned to that page after signing in (guest); the overview (customer) | None |
| SF-ACC-02 Register | default; passwords do not match; password too short, where the browser refuses the form before the page's own message (B8); policy consent required; registration failed, "Email has already been taken" (guest) | None |
| SF-ACC-03 Forgot password | default; check your email (guest) | None |
| SF-ACC-04 Reset password | default, opened with an invented token; invalid link, opened without a token; expired link, an invented token submitted, "Password reset token is invalid or has expired."; success (guest) | None. "Success" used a reset token made with Spree's own method in the test server's console (§9) |
| SF-ACC-05 Orders | orders listed (customer); no orders (new customer) | None |
| SF-ACC-06 Order | shipped; partially shipped; unfulfilled, paid with a gift card; a shipment canceled; shipped with no tracking (customer); not found (another customer's order); paid with a saved card, where the page fails (B1) | None |
| SF-ACC-07 Addresses | addresses listed; the editor adding; the editor editing; save refused, "Zip Code is invalid"; delete confirmation (customer); no addresses (new customer) | **set as default:** the storefront has no way to set a default address (B10) |
| SF-ACC-08 Payment methods | cards listed, where the page fails (B1) (customer); no cards (new customer) | **remove confirmation:** the page fails before its remove button can be reached. "Cards listed" is captured only as a failure |
| SF-ACC-09 Gift cards | an active, a partly used, a fully redeemed and an expired card on one page (customer); none (new customer) | **canceled:** Spree can cancel a gift card, but no API offers it, so none could be made without changing Spree's code |
| SF-ACC-10 Profile | default; current password needed, shown when the email is changed; current password refused, "Current password is invalid or missing"; updated (customer) | None |

The header shows its menu button at 1280 pixels too; that is how the header renders, and the header is the shop batch's (work item §2.4).

**The data behind the captures,** added to the browser-test database through Spree's own APIs only, during the session:
- Through the Store API: the test customer, Avery Quinn, with a home and a studio address; a second customer, Rowan Hale, with one order; and the test customer's checkouts, paid by check, by gift card, or by both.
- Through the Admin API: a flat-rate "Standard Shipping" delivery method and a check payment method; four gift cards for the test customer (active, $25; partly used, $50, expiring 2027-06-30; fully used, $10; and expired, $20, expiring 2026-09-30); shipping and canceling the orders' fulfilments; an order placed for the customer by staff and paid with a card saved by the test payment gateway; and a webhook endpoint for reset requests.
- The newly registered customer was registered by the capture run itself, with an `example.com` address.

The orders, by state: R1003 shipped with tracking; R1004 one shipment shipped and one not; R1005 unfulfilled, paid by a gift card; R1006 shipped without tracking, paid by a gift card and a check; R1007 canceled; R1009 paid with the saved card. Nothing about the data, the customer's password or the gift card codes is committed.

### 2.2 FL-09, step by step

The browser tests are the storefront's own, in `e2e/`, unchanged. In CI the storefront's end-to-end job stops at its first step without Stripe test keys (OA-1), so they were run locally: the storefront built at `8153a6b`, the backend's browser-test server at `a4a1708`, in the pinned Playwright 1.60.0 image. All seven passed, with no retry ([storefront-browser-tests.json](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/flows/storefront-browser-tests.json)).

| Step | Covered by | Gap |
|---|---|---|
| SF-ACC-02: register | `auth.spec.ts`: "a new customer signs up, signs out and signs back in", "sign up refuses passwords that do not match" | |
| SF-ACC-01: sign in | "a new customer signs up, signs out and signs back in", "a wrong password is refused", "an account page sends a guest to sign in and back" | |
| SF-ACC-05 to SF-ACC-10: the account | `account.spec.ts`: "the account navigation reaches every section", "a customer adds and deletes an address", "a customer updates their name" | The tests reach every section but check no order, card or gift card; the captures show them |
| SF-ACC-03: request a reset link | None. Captured: default and "check your email". Spree's API specs cover the request | **Gap:** no browser test |
| EM-C-08 or EM-SF-04: the email | None. Both rendered (§2.3); Spree's spec "publishes customer.password_reset_requested event" | **Gap:** no test sees an email sent |
| SF-ACC-04: choose a new password | None. Captured, with a token made in the console (§9); Spree's API spec "resets the password and returns JWT" | **Gap:** no browser test |

### 2.3 Emails

Which of the two a store sends depends on its setup: Spree sends EM-C-08 when the emails gem is installed, and the storefront sends EM-SF-04 when Spree's password reset webhook reaches it. Neither was sent here; each was rendered and captured at 390 and 1280 pixels in the pinned image.

| Email | Sender | Subject | How it was rendered |
|---|---|---|---|
| EM-C-08 Customer password reset | Spree (`spree_emails`) | "Shop Password Reset Instructions" | From Spree's mailer preview, in the browser-test Rails app's test environment, against a copy of the browser-test database, inside a transaction that was rolled back. The preview greets the first customer in that data, "Hi Promo," |
| EM-SF-04 Password reset | The storefront, on Spree's `customer.password_reset_requested` webhook | "Spree Store Password Reset": the store's name, the storefront's default, then "Password Reset" | With the same rendering call the storefront's webhook handler makes, given an example address and an invented token |

Spree's own email specs for the customer mailer passed: 7 examples, no failures ([emails-specs.json](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/backend/emails-specs.json)). EM-C-08's link depends on the request: see B11.

## 3. Permissions, as three separate claims

### 3.1 What the interface shows each visitor

From the running-screen captures. This shows only what the storefront displays; a page that hides something does not stop a request.

| Variant | What the storefront does | Evidence |
|---|---|---|
| Guest | Shows sign in, register, forgot password and reset password. Opening an account page sends the guest to sign in, with the page kept in the address, and back to it afterwards | SF-ACC-01 "sent to sign in" and "returned"; SF-ACC-01 to SF-ACC-04 |
| Signed-in customer | Shows the overview and the account sections, with the customer's own orders, addresses, cards, gift cards and profile | SF-ACC-01 "overview"; SF-ACC-05 to SF-ACC-10 |
| Newly registered customer | Shows each section's empty state | SF-ACC-05 "no orders", SF-ACC-07 "no addresses", SF-ACC-08 "no cards", SF-ACC-09 "none" |
| Another customer's order | The test customer, signed in, opening another customer's order by its address sees "not found" | SF-ACC-06 "not found" |

### 3.2 What the server refuses

**Spree's own specs, at `a4a1708`.** Run in this session on SQLite with Spree's test apps: the API engine's Store API controller and integration specs for every endpoint the account screens call, and the core engine's registration workflow spec. 214 and 20 examples, no failures. Every example is listed with its result in [api-specs.json](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/backend/api-specs.json) and [core-specs.json](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/backend/core-specs.json).

| Endpoint or rule | Spec files (examples) | What the examples exercise, by caller |
|---|---|---|
| Sign in, refresh, sign out | `auth_controller_spec.rb` (28), `auth_spec.rb` (8) | A wrong or missing password, an unknown email and a missing key are refused with 401, and no refresh token is made. Refreshing needs a valid, unexpired refresh token. Signing out leaves a token made for another surface alone |
| Register; read and change the profile | `customers_controller_spec.rb` (46), `customers_spec.rb` (7) | Registration refuses a blank or missing password and a taken email. Without a token, or with an invalid or expired one, reading or changing the profile answers 401. Changing the email or password needs the current password; a wrong one counts towards the lockout, and a locked account is refused even with the right one. Restricted attributes are ignored. A token from before the account was erased stops working |
| Password reset | `password_resets_controller_spec.rb` (16), `password_resets_spec.rb` (7) | The request answers 202 whether or not the email exists. A redirect address is kept only if it matches the store's allowed origins. An invalid token or mismatched passwords are refused. A reset revokes every earlier session and works once |
| Orders | `orders_controller_spec.rb` (7), `customer_orders_spec.rb` (4) | Without a token, 401. The list holds only the customer's own orders. Another customer's order answers 404 |
| Addresses | `addresses_controller_spec.rb` (35), `addresses_spec.rb` (9) | Without a token, 401. Another customer's address answers 404 to reading, changing and deleting. An address an order uses is kept when deleted. Defaults can be set through the API |
| Saved cards | `credit_cards_controller_spec.rb` (13), `credit_cards_spec.rb` (6) | Without a token, 401. Another customer's card answers 404 to reading and deleting |
| Gift cards | `gift_cards_controller_spec.rb` (15), `gift_cards_spec.rb` (4) | Without a token, 401. Another customer's card answers 404. Expired and partly used cards report their state |
| Store policies | `policies_controller_spec.rb` (9) | Read by anyone with the store's key; an unknown policy answers 404 |
| Consent at registration | `create_spec.rb`, the registration workflow (20) | When `terms_of_service` is sent, Spree records the terms document's text, the time, the address and the device. When it is absent, no terms consent is recorded |

**What no Spree spec exercises, NOT_RUN as a spec result.** No spec asks for a single order without a token. None exercises the storefront's own server code, which keeps the customer's token in a cookie and calls these endpoints for the customer. The storefront's unit tests passed in CI, but this batch did not review them for authorization. No refusal check like part 1's was run against the storefront.

**An observation of the running system, not a spec.** Opening another customer's order on the running storefront showed "not found" (SF-ACC-06), and the storefront's captures and browser tests made no other request as the wrong customer.

**Protections seen.** Spree keeps the reset token out of the webhook delivery log it stores and serves through the Admin API. A reset request answers the same whether or not the email exists.

### 3.3 Whether each store's data stays in that store

NOT_RUN. Tenant isolation is FB-03's claim, and FB-03's validation has not run at this revision. The open findings are [ISO-1 to ISO-7](../LIQ-004-foundation-backlog.md#open-isolation-findings). Two are about shopper accounts themselves, and both stay open:
- **ISO-4:** a shopper of one store can sign in at another store.
- **ISO-5:** registering at one store fails if the email has an account at another store, which also reveals that the account exists. The "registration failed" capture shows the same message for an email already registered at the same store; it is not evidence about ISO-5 either way.

Some of Spree's specs above touch store boundaries: saved cards, gift cards, orders and policies of another store are not listed or not found, and the profile reads newsletter and group memberships from the request's store. They are listed so they are not lost. They are Spree's own unit checks, not FB-03's validation, and the batch claims nothing about isolation from them. No new isolation defect was found during the batch; none was looked for beyond these specs.

## 4. Comparison with running screens

Each case puts a story beside the same component on a running screen, at 390 and 1280 pixels, with the computed styles of both sides. The comparison is diagnostic: it collects evidence for the owner's review. Images and styles are in the [evidence index](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/README.md).

Every case shows one difference on every element, the font list: the built storefront names `Geist, "Geist Fallback", …` and Storybook names `Geist, …`. It is the pilot's explained difference D6: Next.js's font loader adds a fallback face that keeps text the same size while Geist loads, and Storybook's stand-in makes none. The two look different only if Geist fails to load ([pilot fidelity record §5](2026-10-21-fb-19-pilot-fidelity.md#5-differences-found)). The table lists the other differences.

### 4.1 Results, after the corrections

| ID | Case | Story | Running screen | Other styles that differ | Explained |
|---|---|---|---|---|---|
| CMP-SF-P-05 | card-sign-in | Card: Default | Sign-in card | height | 384 pixels wide on both sides at 1280. The screen's card holds the sign-in form, whose elements appear on the screen only; the story's content is shorter |
| CMP-SF-P-10 | field-sign-in | Field: Default, with Label: Default | Sign in, the email field | None | |
| CMP-SF-P-12 | input-sign-in | Input: Default | Sign in, the email input | None | |
| CMP-SF-P-02 | alert-wrong-password | Alert: Destructive | Sign in, wrong password | None | |
| CMP-SF-G-09 | policy-consent-register | Policy consent: Unchecked, with Checkbox: Unchecked | Register | height; a hidden `input` on the screen only | The form's 334 pixel column wraps the label onto two lines. Radix adds a hidden input beside a checkbox inside a form |
| CMP-SF-G-01 | account-shell | Account shell: Overview | The account overview | height, at 390 only | The overview's tiles are the page's content, on the screen only; at 390 they make the column taller |
| CMP-SF-G-01 | order-list | Order list: Orders listed | Orders | height | The screen lists more orders |
| CMP-SF-G-01 | order-detail-shipped | Order detail: Shipped | Order R1003 | height; one shape's colour | The story's item has options and a picture, which make it taller; the screen's item has no picture and shows the placeholder icon. The comparison matched the placeholder's shape with a shape in the story's picture, so the colour comes from the data |
| CMP-SF-G-01 | gift-card-list | Gift card list: Every state | Gift cards | height | The story holds a canceled card as well, so its faded list is longer. At 390 a badge wraps in the story but not on the screen, which overflows to 462 pixels (B2). One plain `div` is matched with different elements on each side |
| CMP-SF-G-08 | fulfillment-block-shipped | Fulfillment block: Shipped | Order R1003, its shipment | height | As for the order: options and a picture in the story, the placeholder icon on the screen |
| CMP-SF-G-08 | address-block | Address block: Full | Order R1003, delivery address | height | The story's address has a company and a second line |
| CMP-SF-G-08 | line-item-card | Line item card: Without image | Order R1003, its item | height | The story's item has an options line |
| CMP-SF-P-16 | product-image-none | Product image: No image | Order R1003, its item's picture | None | |
| CMP-SF-G-08 | payment-info-other-method | Payment info: Other method | Order R1003, paid by check | None | |
| CMP-SF-G-08 | order-totals | Order totals: Default | Order R1003, its totals | None | |
| CMP-SF-G-02 | address-management | Address management: Addresses listed | Addresses | height | The story's studio address has a company and a second line; the screen's page heading is on the screen only |
| CMP-SF-G-04 | address-edit-modal-editing | Address edit modal: Editing, with the dialog's content | The address editor, editing | None | |
| CMP-SF-P-14 | native-select-country | Native select: Focused | The editor's country field, focused when it opens | font-size and line-height of the arrow icon only | The icon inherits its text size from the field around it, which is the form's on the screen and the story's frame in Storybook. It draws at the same size on both sides |
| CMP-SF-P-01 | alert-dialog-delete-address | Alert dialog: Default | Delete address confirmation | border colour; height at 390 | The story opens with keyboard focus, so Cancel shows its focus ring; the screen was opened with a pointer. At 390 the story's description wraps onto one more line |

The parts captured inside a page, such as the field, the input, the alert, the consent and the order's blocks, take their container's width, so their stories are compared by style rather than by width.

### 4.2 Corrections made to the stories

Each was a defect in the story, fixed there; no storefront component changed. The comparison was run again after them, and all 19 cases passed.

| # | Story | Was | Now, as on the screen |
|---|---|---|---|
| 1 | The six account page components: CreditCardList, GiftCardList, OrderDetail, OrderList, AddressManagement and FulfillmentBlock | 768 or 896 pixels wide at the desktop width | 928 pixels, in the account pages' content column (§1) |
| 2 | Card: Default | 448 pixels wide | 384 pixels, as the sign-in card |

### 4.3 Corrections made to the comparison script

| # | Was | Now |
|---|---|---|
| 1 | The product image's selector also matched a picture in the header | It finds the item's picture only |
| 2 | A hover could be caught halfway through its transition on the screen | The pointer moves away before each capture |
| 3 | The checkbox case compared no element, and the dialog case put the dialog's default header beside the address editor, which has none | Both are compared within the components that use them: the checkbox and the label within the consent and the field, the dialog's content within the address editor |
| 4 | The native select was focused on the screen only | It is compared with the Focused story |

## 5. The storefront's behaviour found, recorded and not changed

Each is how the storefront and Spree work at `8153a6b` and `a4a1708`. The batch reproduces it and changes nothing.

| # | Behaviour | Where seen |
|---|---|---|
| B1 | A card saved by Spree's test payment gateway has no brand, and the saved cards page and an order paid with that card fail with the storefront's error page, which shows no header and a serif font | SF-ACC-08 "cards listed"; SF-ACC-06 "paid by saved card" |
| B2 | At 390 pixels the gift cards page is 462 pixels wide, so it scrolls sideways | SF-ACC-09 |
| B3 | A partly used gift card is listed under "Expired / Redeemed", because the API reports it as not active | SF-ACC-09 |
| B4 | The canceled order says "a refund has been issued", although no payment was taken, and its payment information is empty | SF-ACC-06 "a shipment canceled" |
| B5 | A check payment shows its amount twice | SF-ACC-06 |
| B6 | "Track Items" shows on unfulfilled, canceled and untracked shipments | SF-ACC-06 |
| B7 | At 390 pixels the orders table shows only Order, Date and Payment; the other columns scroll | SF-ACC-05 |
| B8 | On register, the browser refuses a short password before the page's own message can show | SF-ACC-02 "password too short" |
| B9 | Register requires the policy consent but does not send it to Spree, so Spree records no terms consent for a registered customer. Spree's workflow records one when it is sent (§3.2) | SF-ACC-02; the storefront's `register` action |
| B10 | The storefront has no way to set a default address: its messages hold the words, but no component uses them. Spree's API supports it | SF-ACC-07 |
| B11 | EM-C-08's link, when Spree keeps no redirect address, is the storefront's address with `?token=`, which opens the home page rather than a reset page. The storefront sends its reset page as the redirect, which Spree keeps only when the store lists the storefront among its allowed origins | EM-C-08 |

Two smaller points are recorded in the stories: the checkbox draws no focus ring, and the address editor never shows its "Loading..." state list, because its loading flag ends as soon as the request starts.

B1, B9 and B10 matter for Liquorify's later account work. Whether to change any of them is a Liquorify product decision, deferred with the rest of Liquorify's own features. B9 concerns consent records, so it is listed for the owner to weigh with the privacy batch.

## 6. Corrections to the work item

Recorded in the [work item](../work-items/fb-19-batch-storefront-shopper-accounts.md) §9, without changing the proposal's text:
- SF-ACC-01 has a fifth state, "sent to sign in", before "returned".
- SF-ACC-02 "password too short" shows the browser's message, not the page's (B8).
- SF-ACC-04 "invalid or expired link" is two states: no token, which the page catches, and a token Spree refuses.
- SF-ACC-07 "set as default" does not exist in the storefront (B10).
- SF-ACC-09 lists a partly used card with the used ones (B3).
- SF-ACC-10 has a fourth state, "current password refused".
- Saved cards: the test gateway's card has no brand, and the page fails for it (B1). A card with a brand needs a real gateway's test keys, which is OA-1.

## 7. Gaps

Each names what is missing, the check made instead and what would close it.

| Gap | Check made instead | What would close it |
|---|---|---|
| SF-ACC-07 "set as default" | None on a screen: the storefront has no such control (B10). Spree's API specs set defaults | A storefront change, which is a Liquorify decision |
| SF-ACC-08 "cards listed" and "remove confirmation" with a real card | The three CreditCardList stories, against their source; "no cards" captured; Spree's saved card specs | A card saved through a gateway with test keys (OA-1) |
| SF-ACC-09 "canceled" | The Canceled story, against its source | An API to cancel a gift card, which Spree does not offer, or a staff screen that does |
| The password reset steps of FL-09 in a browser test | Captures, with a token made in the console; Spree's API specs | A browser test with a mailed reset link |
| Whether EM-C-08 or EM-SF-04 is sent | Both rendered; Spree's spec for the reset event | A test that reads the sent mail or the webhook |
| The storefront's browser tests in CI | Run locally, seven of seven passed | OA-1: Stripe test keys for the end-to-end job |
| 82 of the 103 stories not compared by the script | 33 show a state seen in a running-screen capture; 49 checked against their source only. Each is named in the [image review list](2026-10-22-fb-19-batch-storefront-shopper-accounts-image-review.md) | Running screens that show those states |
| Requests no Spree spec sends, and the storefront's own server code (§3.2) | The capture of another customer's order | Specs or a refusal check against the storefront, which this batch does not add |
| Tenant isolation, including ISO-4 and ISO-5 | None | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 8. CI runs and local checks

| Run | Revision | Result |
|---|---|---|
| [Storybook 39726210897](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39726210897) | `49e1c37`, every story, image and script of the batch | Built, token check and coverage passed, and all 244 comparisons passed in 2.3 minutes under the explicit tolerance: the batch's 206 images and the pilot's 38 |
| [Storybook 39726984972](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39726984972) | `49e1c37`, started by hand | All 244 comparisons passed again, in 2.2 minutes |
| [CI 39726210900](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39726210900) | `49e1c37` | Lint, Type Check and Unit Tests passed. "E2E (Playwright + Spree)" failed at its first step, because the repository has no Stripe test keys (OA-1), so none of its tests ran |

#12 changes only records; the backend's checks on it are shown on that pull request.

**Local checks, in this session, before the commit.** Lint and format (Biome, 328 files), the type check and the unit tests (256, the fixture check among them) passed. Storybook built, and every visual comparison passed in the pinned image, 244 of 244, before the last correction; the card's four images were then rewritten and checked again. Each of the 19 comparison cases passed at both widths in its latest run, the corrected ones after their correction, and the capture run reached every state but the three unavailable ones.

## 9. Limitations

- **Diagnostic, not acceptance.** A passing comparison only shows that both sides could be captured; fidelity is the owner's judgement from the evidence.
- **Invented data in stories, the test data on screens.** Names, counts and pictures differ on purpose.
- **Data added by hand through the APIs.** The customer, orders, gift cards and the rest were added during the session through Spree's Store and Admin APIs, not by a committed script, so this record lists what was made (§2.1). They exist only in the test database. Spree's tests, fixtures and code are unchanged.
- **The reset success token.** The test server delivers no customer email, and Spree keeps the token out of its webhook delivery log, so the token for "success" was made in the test server's Rails console with Spree's own `generate_token_for(:password_reset)` and used at once. The capture shows how the page renders a successful reset; it does not show that the email carries a working link.
- **Different SDK versions.** The storefront pins `@spree/sdk` rc.3 while the backend ships rc.4 (FB-06). The captures show the pinned pair.
- **Spree's specs ran on SQLite, locally.** CI runs Spree's suites on PostgreSQL and MySQL; #12 changes no Spree code, so they are not run for it.
- **Size.** The reference images are 3.2 MB and the evidence 5.4 MB. The evidence images are lossless WebP, converted from the PNG captures with every pixel checked equal.
- **Not independent.** The session that built the stories also compared them; the owner's review is the independent check.

## 10. Evidence

The [evidence index](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/README.md) lists every capture, comparison, email and result file, by inventory ID. The [image review list](2026-10-22-fb-19-batch-storefront-shopper-accounts-image-review.md) lists every reference image for the owner's review.
