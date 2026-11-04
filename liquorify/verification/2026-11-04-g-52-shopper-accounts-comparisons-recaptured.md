---
title: G-52, the shopper accounts comparisons the header covered, captured again
record: verification
work_item: FB-19, G-52 (gap)
date: 2026-11-04
verifier: Claude (automated session, thread "Recapture shopper account screens (G-52)"); not independent review
result: PASS for G-52's closing condition. The 19 shopper account cases ran with the corrected comparison script, at both widths, signed in as a test customer with orders, against the storefront and the backend's browser-test server at `main`. The notes show the storefront's header over the part in exactly the five comparisons G-52 names, and in no other. In each of the five, the header was hidden while captured, the running screen's side now shows the whole part, the story's side is pixel for pixel the same as before, and the computed styles of both sides are the same as in the committed comparison, so the differences are the ones the shopper accounts record's §4.1 already explains. Their ten committed files are replaced. The other 33 comparisons, 16 cases at both widths and `account-shell` at 1280, still match their committed comparisons: 31 are pixel for pixel the same, and the order list's two differ only in their data. G-52 is CLOSED as delegated image acceptance under the owner's delegation of 2026-11-04. Not the owner's review. Tenant isolation is NOT_RUN
---

# G-52: the shopper accounts comparisons the header covered, captured again

**Claim.** Five of the shopper accounts batch's committed comparisons had the storefront's sticky header drawn over the part ([G-52](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance)). The storefront's comparison script has hidden the header while it captures since `4ee76ba` ([shop part 2's record §4.4](2026-10-26-fb-19-batch-storefront-shop-part-2.md#44-the-header-over-the-part-corrected-on-2026-10-27)). This record runs the shopper accounts batch's 19 cases again with that script, signed in as a test customer with orders, and replaces only the five comparisons G-52 names. It follows the [scope written for G-52](#8-the-scope-followed) and adds none.

**Revisions.**

| What | Revision |
|---|---|
| Storefront: the comparison script, the stories and the application | Storefront `main` `8865498`, the merge of storefront #21. It holds the corrected script, `4ee76ba`, and the 19 account cases in `visual/fidelity/compare.spec.ts`. Its application code is the same as at `8153a6b`, where the shopper accounts batch captured: `git diff 8153a6b 8865498` over `src/`, `messages/`, `package.json` and `pnpm-lock.yaml` is empty |
| Backend: the browser-test server and its fixtures | Backend `main` `68236c5`, after #46. The batch captured against `a4a1708` |
| Running screens | The storefront built for production at `8865498` with `pnpm build` and served with `next start`, as `compare.spec.ts` describes, against the browser-test server at `68236c5` on SQLite. Storybook built at `8865498`. The browser ran in the storefront's pinned Playwright 1.60.0 image, at 390 and 1280 pixels wide, with the fonts served offline |
| This record and the replaced files | This pull request. It changes only `liquorify/` |

## 1. How it ran

The run used its own checkout of each repository, its own database and its own ports, in a cloud session. The backend's browser-test server was started with its own setup, `packages/dashboard/e2e/global-setup.ts`, on port 3110, and the built storefront was served on port 3101. `compare.spec.ts` opens the storefront at `localhost:3001` and Storybook at `localhost:6008`. Inside the Playwright container, a small forwarder answered at `localhost:3001` and passed each connection to the storefront on 3101, and Storybook was served on 6008. Neither the script nor the storefront was changed, and the ports other work uses, 3001 among them, were left free on the machine.

The 19 cases were selected by name with `--grep`. All 38 captures passed, in 8.9 minutes. A first attempt captured nothing: its forwarder listened on an address family the container does not have, so its first four captures failed to open the storefront, and the run was stopped and started again with the forwarder corrected.

## 2. The data

Recreated through Spree's own Admin and Store APIs only, in the browser-test server's database, following the [shopper accounts record §2.1](2026-10-22-fb-19-batch-storefront-shopper-accounts.md#21-screens-and-their-states). No storefront or Spree code changed.

| Through | What |
|---|---|
| Admin API | The fixtures' E2E Promo Product, E2E Transfer Product and E2E Inventory Product listed on the store's "Online Store" channel. At `68236c5` the fixtures list no product on that channel, which the storefront's publishable key belongs to, so the Store API offered none until they were listed. The batch's record names no such step |
| Admin API | A flat-rate "Standard Shipping" delivery method at $5.00, and a check payment method, as the batch made |
| Store API | The test customer, Avery Quinn, `avery.quinn@example.com`, registered with the policy consent accepted, with a home address (148 Orchard Street, New York) and a studio address (Quinn Studio, 2200 Mission Street, Suite 4, San Francisco) |
| Admin API | Four gift cards for the customer, as the batch made them: $25 with no expiry; $50 expiring 2027-06-30; $10; and $20 expiring 2026-09-30, which is expired |
| Store API | Five checkouts as the customer, numbered R1003 to R1007 as in the batch: R1003, one item, paid by check; R1004, three items in two shipments, paid by check; R1005, paid with the $50 card; R1006, paid with the $10 card and a check; R1007, paid by check |
| Admin API | R1003 shipped with a tracking number; R1004's first shipment shipped; R1006 shipped without tracking; R1007 canceled |

**Why more than the shipped order.** The gift card list needs a partly used and a fully used card, and only paying with them at checkout uses them: R1005 leaves the $50 card with $25.01, and R1006 uses all of the $10 card. The order list case reads the customer's orders, so R1004 and R1007 bring back the partly shipped and canceled rows it showed. The scope allows other orders only where a case reads them.

**Not recreated.** The second customer, Rowan Hale, and their order; the order paid with a card saved by the test gateway (R1009); and the webhook endpoint for reset requests. None of the 19 cases reads them. So the order list shows five orders where the batch's showed six.

**What stayed outside both repositories.** The accounts file that `FIDELITY_ACCOUNTS` names, the customer's password and the gift card codes were kept in the session's scratch folder. The gift card list's running screen shows the four cards' codes, as the page draws them and as the committed comparison did. They were made by a test database that existed only for this run and was deleted after it, so they redeem nothing anywhere, and no code is recorded as text. Customers use `example.com` addresses.

## 3. The five comparisons

Each was compared with the committed comparison it replaces: the running screen's side and the story's side of the side-by-side image, pixel for pixel, and the computed styles of both sides.

| Comparison | Width | Header over the part, hidden while captured | Running screen's side, against the committed one | Story's side | Computed styles, against the committed run | Result |
|---|---|---|---|---|---|---|
| `account-shell` | 390 | Yes | Rows 12 to 63 differ: the header's band is gone, and the customer's name at the top of the account menu shows. Nothing else differs | Identical | Identical on both sides: the same three heights differ, which §4.1 explains | PASS |
| `gift-card-list` | 1280 | Yes | Rows 7 to 63 differ: the header's band is gone, and the page's "Gift Cards" heading and the band above "Active Gift Cards" show. Elsewhere only the data differs: the four cards' codes and the date the $10 card was used up | Identical | Identical on both sides: the same heights differ, and the same elements are on one side only | PASS |
| `gift-card-list` | 390 | Yes | As at 1280. The page still overflows sideways (B2) | Identical | Identical on both sides, the wrapping badge included | PASS |
| `order-detail-shipped` | 1280 | Yes | Rows 0 to 23 differ: the header's band is gone, and "Back to orders" shows. Elsewhere only the order's date differs | Identical | Identical on both sides: the same heights and the placeholder shape's colour (CMP-SF-G-01) | PASS |
| `order-detail-shipped` | 390 | Yes | Rows 5 to 63 differ in the same way. Elsewhere only the order's date differs | Identical | Identical on both sides | PASS |

Every image has the size of the one it replaces. Because the computed styles of both sides match the committed run's, every difference the comparison finds is one that [the shopper accounts record's §4.1](2026-10-22-fb-19-batch-storefront-shopper-accounts.md#41-results-after-the-corrections) already explains, and no new difference appeared. The five side-by-side images were looked at in full: the running screen's side shows the whole part in each.

## 4. The header notes, all 38 captures

The script records each sticky element it hid in the comparison's notes (`hiddenWhileCaptured`), with `overPart`, whether it lay over the part.

| Captures | How many | Header |
|---|---|---|
| The five above | 5 | Hidden, and over the part |
| The other parts of pages | 29 | Hidden, and not over the part |
| Whole-window captures: `address-edit-modal-editing` and `alert-dialog-delete-address`, at both widths | 4 | Not hidden: the page behind the dialog, header included, is meant to show |

No story side hid anything. So the header lay over the part in those five comparisons and in no other, as the [header check](evidence/2026-10-26-fb-19-batch-storefront-shop-part-2/header-check.md#shopper-accounts-batch) found by looking at the committed images.

## 5. The other comparisons, left as committed

| Cases | Against the committed comparison | Still match |
|---|---|---|
| `card-sign-in`, `field-sign-in`, `input-sign-in`, `alert-wrong-password`, `policy-consent-register`, `fulfillment-block-shipped`, `address-block`, `line-item-card`, `product-image-none`, `payment-info-other-method`, `order-totals`, `address-management`, `address-edit-modal-editing`, `native-select-country`, `alert-dialog-delete-address` at both widths, and `account-shell` at 1280 | The side-by-side image is pixel for pixel the same, and so are the computed styles on both sides | Yes |
| `order-list`, at both widths | The story's side and its styles are the same. The running screen lists five orders, not six, dated 2026-11-04, so the table is 387 pixels tall rather than 456. Its styles are otherwise the same | Yes, within its data: the screen still lists more orders than the story's four, so §4.1's explanation, "The screen lists more orders", stands |

The scope calls these "the other 14", taking the five comparisons from the 19 cases. Counted exactly, the five comparisons belong to three cases, so the rest are 16 cases at both widths and `account-shell` at 1280, whose comparison had nothing over the part: 33 of the 38 comparisons. None of their committed files changed.

## 6. The replaced files

In [the shopper accounts evidence](evidence/2026-10-22-fb-19-batch-storefront-shopper-accounts/README.md), `comparison/`:

| Case | Files replaced |
|---|---|
| `account-shell` | `mobile-side-by-side.webp`, `mobile-styles.json` |
| `gift-card-list` | `mobile-side-by-side.webp`, `mobile-styles.json`, `desktop-side-by-side.webp`, `desktop-styles.json` |
| `order-detail-shipped` | `mobile-side-by-side.webp`, `mobile-styles.json`, `desktop-side-by-side.webp`, `desktop-styles.json` |

Each image is lossless WebP, converted from the PNG the script wrote, and checked pixel for pixel against it. Each new styles file differs from the one it replaces only in the storefront revision it names and in the new `hiddenWhileCaptured` notes. `account-shell`'s two desktop files and every file of the other 16 cases are unchanged.

## 7. Delegated acceptance and G-52

| What | Detail |
|---|---|
| Kind | **Delegated image acceptance, under the owner's delegation of 2026-11-04** ([record](2026-11-04-delegated-acceptance-and-merging.md)): image and fidelity acceptance of the five replaced comparisons. The owner did not review this work |
| Date | 2026-11-04 |
| Accepted by | Claude, in the thread "Recapture shopper account screens (G-52)" |
| Revision | This pull request's final commit. It merges through GitHub's protected merge only once every required check passes on that commit |
| Accepted | The five replaced comparisons, against G-52's closing condition: "Capture the five again with the corrected comparison script and a signed-in test customer with orders, and replace their committed comparisons" |
| Not accepted here | Any other gap, any defect, the 33 other comparisons, which are unchanged, and any status. No reference image changed |

**G-52 is CLOSED** on 2026-11-04, on the passing evidence in §3 and §4, as delegated image acceptance under the owner's delegation of 2026-11-04. Not the owner's review. The proposal ended "after the owner's review". The delegation hands image and fidelity acceptance to Claude's sessions, so this delegated acceptance takes that place. It is not the owner's review, and the owner can still review the five images.

## 8. The scope followed

The scope for G-52 was written by the thread "Audit Spree baseline completion status" on 2026-11-04, from G-52's recorded condition. Each of its points, and what this record shows for it:

| Scope | Done |
|---|---|
| Storefront `main` and the backend's browser-test server at `main`, both recorded | Yes, `8865498` and `68236c5` (revisions above) |
| The data through Spree's Store and Admin APIs only, other order states only where a case reads them | Yes (§2) |
| The 19 cases at both widths, with the notes showing the header over the part in those five and in no other | Yes (§4) |
| Replace only the five comparisons, and say whether the other 14 still match | Yes: the other 33 comparisons, counted exactly, still match (§5, §6) |
| Each of the five: header hidden, the whole part shown, no difference §4 does not already explain | Yes (§3) |
| The accounts file, password and gift card codes outside both repositories; `example.com` addresses | Yes (§2) |
| No Stripe, settings, purchases or new credentials | None were used |
| Tenant isolation stays NOT_RUN | Yes (§9) |

## 9. Limitations

- **Diagnostic comparisons.** As in the shopper accounts batch, a comparison collects evidence; fidelity is judged from it, here under the delegation.
- **Today's data.** The running screens show this run's dates, the new cards' codes and five orders rather than six. The stories are unchanged.
- **A newer backend.** The batch captured against `a4a1708` and this run against `68236c5`. The storefront's application code is the same at both of its revisions, and every compared style matched, so the backend's newer code changed nothing these captures show.
- **What this does not claim.** Nothing beyond the five comparisons. The storefront's browser tests and Spree's specs were not run, since no code changed. Tenant isolation is NOT_RUN, and ISO-1 to ISO-7 stay open.
- **Not independent.** The session that ran the comparison also accepted it, under the delegation.
