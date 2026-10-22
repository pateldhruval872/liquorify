---
title: FB-19 batch, storefront shopper accounts
record: work item
work_item: FB-19
status: PROPOSED
owner: the owner reviews and accepts; an automated Claude session implements
created: 2026-10-22
updated: 2026-10-22
---

# FB-19 batch: storefront shopper accounts

The storefront's first FB-19 batch organised by product area. It reproduces what the storefront already has for shopper accounts: signing in, registering, resetting a password, and the signed-in account's orders, addresses, saved cards, gift cards and profile. Nothing here changes the storefront's code or Spree's, or adds a Liquorify feature.

**Status.** PROPOSED. On 2026-10-22 the owner allowed the storefront's shopper accounts baseline to run alongside the staff access batch in a separate pull request ([staff access work item](fb-19-batch-staff-access-and-shell.md) §6). It follows the batch rules of LIQ-010 0.4, which are under review in #11 with that batch; if the owner changes them, this batch follows the change.

**Reading of the instruction.** "The storefront account baseline" is read as the whole of CAP-08-01, the ten account screens, rather than only the four sign-in screens the staff access work item named as left out. The storefront has one pull request, as asked. Its records live here in the backend repository, as all Liquorify records do, in a draft pull request of their own, as the pilot's did.

## 1. Outcome

Every account screen of the storefront has Storybook stories for the components it uses, captures of the running screen in each meaningful state at the storefront's two widths, a step-by-step map of the shopper account flow, and the three permission claims recorded apart. The map links each capability to its evidence or to a named gap.

## 2. Scope

### 2.1 Capabilities, screens, flows and emails

| Capability ([LIQ-006](../LIQ-006-product-capability-baseline.md)) | Screens ([LIQ-008](../LIQ-008-spree-screen-inventory.md)) | Flow | Emails | Browser tests |
|---|---|---|---|---|
| CAP-08-01 Shopper accounts | SF-ACC-01 to SF-ACC-10 | FL-09 | EM-C-08, EM-SF-04 | `e2e/auth.spec.ts`, `e2e/account.spec.ts` |
| CAP-03-09 Store policies, with consent at registration (the consent only) | SF-ACC-02 | FL-09 | None | `auth.spec.ts` |
| CAP-06-09 Shopper order history and tracking | SF-ACC-05, SF-ACC-06 | FL-09 | None | `account.spec.ts` (navigation only) |
| CAP-05-13 Gift cards and store credit (the shopper's list only) | SF-ACC-09 | FL-09 | None | None |
| CAP-07-01 Saved cards (the shopper's list only) | SF-ACC-08 | FL-09 | None | None |

### 2.2 Meaningful states to capture

From LIQ-008, at the mobile (390 pixels) and desktop (1280 pixels) widths the storefront's stories use. The storefront shows no dark mode ([LIQ-010 §8](../LIQ-010-design-system-reproduction-architecture.md#8-themes-and-widths-captured)).

| Screen | States |
|---|---|
| SF-ACC-01 Sign in and account overview | Sign-in form; wrong password; signed in, the overview; returned to the page that sent the guest |
| SF-ACC-02 Register | Default; passwords do not match; password too short; policy consent required; registration failed |
| SF-ACC-03 Forgot password | Default; check your email |
| SF-ACC-04 Reset password | Default; invalid or expired link; success |
| SF-ACC-05 Orders | Orders listed; no orders |
| SF-ACC-06 Order | Shipped; partially shipped; unfulfilled; a shipment canceled; no tracking; not found |
| SF-ACC-07 Addresses | Addresses listed; the address editor, adding and editing; delete confirmation; set as default; no addresses |
| SF-ACC-08 Payment methods | Cards listed; remove confirmation; no cards |
| SF-ACC-09 Gift cards | Active; partially used; fully redeemed; canceled; expired; none |
| SF-ACC-10 Profile | Default; current password needed; updated |

### 2.3 Who sees what

The storefront has no roles, so the variants are who is asking:
- **Guest:** SF-ACC-01 to SF-ACC-04 only. An account page sends the guest to sign in and back.
- **Signed-in customer:** the overview and SF-ACC-05 to SF-ACC-10, for their own records only.
- **Another customer's record:** opening another customer's order by its address shows "not found".

### 2.4 Left out, and where it goes

- Checkout's address steps (SF-CHK-01, SF-OVL-05 in checkout): the checkout batch. The address editor's stories are made here, because the addresses page uses it, and checkout reuses them.
- The header, footer and menus (SF-OVL-01): the shop batch. Account pages are captured with them, as they render.
- Wholesale buyers (SF-WHL): the wholesale batch.
- Data exports and erasure (EM-C-09, CAP-08-06): the privacy batch.

## 3. Components

New stories, 25 components ([LIQ-009](../LIQ-009-spree-component-and-token-inventory.md) §5):

| Layer | Components |
|---|---|
| Primitives (`src/components/ui/`) | `alert-dialog` (CMP-SF-P-01), `alert` (P-02), `card` (P-05), `checkbox` (P-07), `dialog` (P-08), `field` (P-10), `input` (P-12), `label` (P-13), `native-select` (P-14), `product-image` (P-16) |
| `account/` (CMP-SF-G-01) | AccountShell, AuthenticatedAccountShell, CreditCardList, GiftCardList, OrderDetail, OrderList |
| `addresses/` (CMP-SF-G-02) | AddressManagement |
| `checkout/` (CMP-SF-G-04), the address editor only | AddressEditModal, AddressFormFields |
| `order/` (CMP-SF-G-08) | AddressBlock, FulfillmentBlock, LineItemCard, OrderTotals, PaymentInfo |
| `policy/` (CMP-SF-G-09) | PolicyConsent |

Already covered and reused: `button` (CMP-SF-P-04) and `sonner` (P-21), from the pilot. The account pages' own forms are written inside the page files, so they are captured as running screens; their states are shown by the components above and by the captures.

LIQ-009 §5 gains its Storybook column with this batch, as its own text says it will.

## 4. Delivery

- **Storefront pull request** (draft, `liquorify-storefront`): stories, fixtures and mocks, reference images, and the scripts that capture and compare the running screens.
- **Backend pull request** (draft, this repository): this work item, the verification record, the published evidence, the image review list and LIQ-009's storefront columns. It builds on #11 because it uses LIQ-010 0.4 and LIQ-006's capability IDs, and moves to `main` once #11 merges.
- **Running screens:** the built storefront at `main` against the backend's browser-test server at Spree code `a4a1708`, as the pilot did, with a test customer whose orders, addresses, cards and gift cards are added to that server's database. The storefront pins `@spree/sdk` rc.3 while the backend ships rc.4 (FB-06); the captures record the versions used.

## 5. Acceptance criteria

The staff access batch's criteria, applied to the storefront:

| # | Criterion | Evidence |
|---|---|---|
| 1 | Every in-scope capability is mapped to its screens, flow steps, who may see it, states, components, browser tests and emails, with no in-scope ID left unmapped | The map in the verification record |
| 2 | Every component the account screens use has a story for each meaningful state, at both widths, with a reference image; components already covered are listed | The image review list |
| 3 | Every screen is captured on the running storefront in each state in §2.2, at both widths | The evidence index |
| 4 | Each variant in §2.3 is captured, showing what the interface does for it | The captures |
| 5 | FL-09 is mapped step by step to the browser tests that cover it, and their result at the batch's revision is recorded, or why they could not run | The flow map |
| 6 | The comparison finds no unexplained difference between each new story and its running screen; a defect is fixed in the story | The comparison record |
| 7 | A state no running screen shows is a gap, with the check made instead | The gaps section |
| 8 | The visual check passes twice in CI on the same revision; the storefront's own checks pass; the check stays advisory | The CI runs |
| 9 | The storefront's code, Spree's code and every workflow outside Storybook are unchanged; nothing carries Liquorify branding or features | The pull requests' file lists |
| 10 | The records are updated, with every link checked | The record and the link check |
| 11 | The owner accepts the reference images, the screen evidence and fidelity | The owner's review |
| 12 | What the server refuses is recorded apart from criterion 4, from Spree's own Store API specs for the account endpoints, run at the batch's revision. What no spec exercises is NOT_RUN | The spec run |
| 13 | Tenant isolation is NOT_RUN, with the open findings linked: ISO-4 and ISO-5 are about shopper accounts themselves. A new isolation defect is reported to the owner privately | The isolation section |

## 6. FL-09, step by step

| Step | Browser tests |
|---|---|
| SF-ACC-02: register | `auth.spec.ts`: "a new customer signs up, signs out and signs back in", "sign up refuses passwords that do not match" |
| SF-ACC-01: sign in | "a new customer signs up, signs out and signs back in", "a wrong password is refused", "an account page sends a guest to sign in and back" |
| SF-ACC-05 to SF-ACC-10: the account | `account.spec.ts`: "the account navigation reaches every section", "a customer adds and deletes an address", "a customer updates their name" |
| SF-ACC-03: request a reset link | None |
| EM-C-08 or EM-SF-04: the email | None |
| SF-ACC-04: choose a new password | None |

## 7. Gaps known before the work starts

| Gap | What would close it |
|---|---|
| The storefront's browser tests do not run in CI: its end-to-end job stops before any test without Stripe sandbox keys (OA-1, FB-06) | OA-1. Until then the batch records whether they could be run locally, and if not, keeps them as a gap |
| No browser test covers the password reset steps of FL-09 | A browser test with a mailed reset link |
| Saved cards need a payment gateway to create; whether the browser-test server can add one is found during the batch | A card saved through checkout, or the state kept as a gap |
| EM-SF-04 is rendered by the storefront's code on a webhook, and EM-C-08 by Spree; which one a store sends depends on its setup | Both are rendered and captured where their code allows; sending is not checked |
| Tenant isolation (criterion 13), including ISO-4 and ISO-5 | FB-03's validation and the fixes for ISO-1 to ISO-7 |

## 8. Ownership, risk and release impact

- **Owner.** The owner reviews and accepts; an automated Claude session implements. Review is not independent ([LIQ-001 §2](../LIQ-001-project-profile.md#2-responsibilities)).
- **Risk.** Stories, fixtures, mocks, scripts, reference images and records only, with no dependency, CI step or application code. Data added for the captures goes only to the browser-test database.
- **Release impact.** None. Nothing is deployed.
- **Verification.** The batch's verification record in `liquorify/verification/`, with the published evidence.
