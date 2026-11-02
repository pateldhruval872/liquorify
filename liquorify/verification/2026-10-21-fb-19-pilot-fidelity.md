---
title: FB-19 pilot stories compared with Spree's running screens
record: verification
work_item: FB-19
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: Diagnostic comparison found no unexplained difference for 18 stories and 8 token pages after two corrections; ACCEPTED by the owner within the pilot's scope on 2026-10-21; coverage gaps kept open for 35 stories checked against their source only and for the cart drawer opened with a pointer
---

# FB-19 pilot stories compared with Spree's running screens

**Claim.** A diagnostic comparison of the pilot's stories with the same components on Spree's running admin dashboard, seller panel and storefront finds no difference that is not explained, after two corrections. This is the evidence for criterion 9 of the [pilot record](2026-10-21-fb-19-pilot.md) and step 3 of [LIQ-010 §12.1](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch). Where a story differed, the reproduction was corrected, never the component.

The comparison scripts only collect evidence: side-by-side images and computed styles. A successful run shows that both sides could be captured, not that they match. Fidelity is accepted by the owner reviewing the [published evidence](evidence/2026-10-21-fb-19-pilot-fidelity/README.md) (criterion 6), which links each case to its inventory ID and the revisions compared.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The diagnostic comparison finds no computed-style difference between each compared story and its running screen, apart from the differences recorded as expected (§5) | PASS after two corrections: 26 backend and 14 storefront comparisons, run again for the published evidence with the same differences |
| 2 | Every token the running screens define has the same value in Storybook | PASS, except one value a page measures at run time (D5) |
| 3 | Every difference is recorded, and each one that is a defect is corrected in the story, its providers or its mocks | PASS: two defects corrected (C1, C2), one story's description corrected (C3), six expected differences recorded |
| 4 | What the comparison cannot cover is recorded as a coverage gap, with the check made instead | PASS: 35 stories checked against their source only, and the cart drawer as opened with a pointer, which is currently uncovered (§4) |
| 5 | The owner accepts the reference images | ACCEPTED on 2026-10-21, with the [review list](2026-10-21-fb-19-pilot-image-review.md) ([acceptance record](2026-10-21-fb-19-pilot-merge-and-acceptance.md)) |
| 6 | The owner accepts fidelity from the published side-by-side images and computed styles | ACCEPTED on 2026-10-21 within the pilot's scope, with the [evidence](evidence/2026-10-21-fb-19-pilot-fidelity/README.md) (§9). The coverage gaps in criterion 4 stay open ([acceptance record](2026-10-21-fb-19-pilot-merge-and-acceptance.md)) |

## 1. What was compared, and at which revisions

| | Backend | Storefront |
|---|---|---|
| Stories | Pilot branch of [#6](https://github.com/pateldhruval872/liquorify/pull/6), corrected at `8e1974c`, compared again at `d0898ad`, and for the published evidence at `817e177` | Pilot branch of [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15), compared at `d84dc61`, and for the published evidence at `0a901eb` |
| Running screens | Spree's code at main `e408a63`, which the pilot branch does not change | The storefront at main `a139771`, which the pilot branch does not change |
| Backend for the screens | The admin dashboard's own browser-test server: Rails in its test environment, with the database and fixtures its browser tests create | The same server, reached with its seeded publishable key |
| Screens | The built admin dashboard and seller panel (`vite preview`), as their browser tests serve them | The built storefront (`next build`, then `next start`) |
| Browser | The visual check's pinned image, Playwright 1.64.1 | The visual check's pinned image, Playwright 1.60.0 |
| Window | 1280 by 800 pixels, light and dark | 390 and 1280 pixels wide, light, and the system dark setting for the toast |

The comparison is repeatable. It is committed beside each Storybook: `packages/liquorify-storybook/fidelity/` in the backend and `visual/fidelity/` in the storefront, each with the steps to start the screens at the top of `compare.spec.ts`. It only reads the screens, and it never writes a reference image. It is diagnostic: it passes whenever it can capture both sides, and a person judges the result. `817e177` and `0a901eb` change the scripts to save the computed styles of both sides and the revision, and to mask API key values, so the results could be published; between them and the earlier revisions the stories and reference images are unchanged.

Two set-up steps changed the browser-test database and nothing else. The storefront needs a product on its key's channel, so `E2E Promo Product` was listed on the default store's online channel. The toast case signs a new customer up through the storefront's own form.

## 2. Method

For each case, the comparison:

1. opens the running screen and finds the component, for example the publishable keys card on the API keys settings page;
2. opens the story in the built Storybook, in the same browser, theme and window;
3. saves both images side by side, and looks at them;
4. reads the computed styles of the component and every element inside it on both sides: colours, font, line height, letter spacing, borders, corner radius, padding, height, shadow, opacity and gap;
5. pairs elements by tag, slot and class names, and lists every style that differs, and every element found on one side only.

The token comparison reads every custom property on the root element of the admin dashboard, the seller panel, the storefront and each Storybook.

Two things about the storefront are compared as they look, not as they are written:
- **Colours.** The built storefront's stylesheet writes colours in another notation than Storybook's (`lab()` against `oklch()`). Each colour is compared as the pixel it paints.
- **The Geist font.** Storybook's stand-in for Next.js's font loader links to Google's files. The comparison serves the visual check's copies of the same files, as the visual check does. The first run did not, so its stories showed the wrong weights; that run was discarded.

## 3. Results per inventory ID

"Elements" counts the distinct elements compared on both sides. A difference listed against a D number is explained in §5.

### Backend, each in light and dark

| ID | Story | Running screen | Width, screen and story | Elements | Differences |
|---|---|---|---|---|---|
| CMP-SP-G-01 | Balance summary: One currency | Seller panel, Earnings | 965 and 965 px | 10 | None |
| CMP-DA-G-01 | API key table: Publishable keys | Admin, Settings, API keys: publishable keys card | 890 and 890 px | 30 | Heights of 9 elements, from the data (D3) |
| CMP-DA-G-01 | API key table: Empty | Admin, Settings, API keys: secret keys card, with no keys | 890 and 890 px | 13 | None |
| CMP-DUI-P-29 | Pagination: One page, with page size | Seller panel, Earnings | 965 and 965 px | 11 | None |
| CMP-DUI-P-35 | Select: Default | Admin, product page, Status card | 280 and 240 px (D4) | 4 | None |
| CMP-DUI-P-35 | Select: Open | The same select, open | 280 and 240 px (D4) | 7 | None |
| CMP-DUI-C-03 | Back button: Default | Admin, product page | 32 and 32 px | 3 | None |
| CMP-DUI-C-03 | Back button: Focus visible | The same button, focused from the keyboard | 32 and 32 px | 3 | None |
| CMP-DUI-P-07 | Button: With icon | Admin, Settings, API keys: "New key" | 102 and 126 px (D4) | 2 | None |
| CMP-DUI-P-07 | Button: Outline | Admin, Settings, Stock locations, location sheet: "Cancel" | 68 and 111 px (D4) | 1 | None |
| CMP-DUI-P-07 | Button: Focus visible | "New key", focused | 102 and 111 px (D4) | 1 | None |
| CMP-CORE-06 | Country combobox: Selected | Stock location sheet | 540 and 288 px (D4) | 5 | None; the flag differs with the data (D3) |
| CMP-CORE-06 | Country combobox: Open | The same combobox, open | 568 and 316 px (D4) | 20 | None; the screen lists every country, the story a few (D3) |

Every backend comparison was run before and after the corrections in §6. Before them, the balance summary, the API key table and the pagination were 1,248 pixels wide in Storybook (D2), and every story sat on a different surface colour from its screen (D1). After them, the widths and the surface match.

### Backend tokens, in light and dark

The admin dashboard defines 202 custom properties on its root element and the seller panel 198. Every one of them has the same value in Storybook, except `--spacing-header-height` on the admin dashboard (D5). Storybook's root also defines 75 and 79 properties that the panels' roots do not; none of them is one the panels define (D9).

### Storefront

| ID | Story | Running screen | Modes | Width, screen and story | Elements | Differences |
|---|---|---|---|---|---|---|
| CMP-SF-G-05 | Hero section: Default | Home page | Mobile, desktop | 390 and 390, 1280 and 1280 px | 8 | The font list's fallback name (D6) |
| CMP-SF-P-04 | Button: Sizes, the large button | Product page: "Add to Cart" | Mobile, desktop | 161 and 64 px (D4) | 1 | The font list's fallback name (D6) |
| CMP-SF-G-03 | Cart drawer: Empty | Header's cart button, clicked | Mobile, desktop | 390 and 390, 448 and 448 px | 13 | The close button's focus ring (D7); fallback name (D6) |
| CMP-SF-G-03 | Cart drawer: Empty | Header's cart button, opened from the keyboard | Mobile, desktop | as above | 13 | Fallback name only (D6) |
| CMP-SF-G-03 | Cart drawer: With items | After "Add to Cart", which opens it | Mobile, desktop | as above | 37 | Focus ring (D7); item count, options line and sale price (D3); fallback name (D6) |
| CMP-SF-G-03 | Cart drawer: With items | Closed, then opened from the keyboard | Mobile, desktop | as above | 37 | Data (D3); fallback name (D6) |
| CMP-SF-P-21 | Toaster: Success | Account, Profile: "Save Changes" | Desktop, system dark | 356 and 356 px | 5 | None |

The hero section also holds a large default button and a large outline button, so both were compared there too.

### Storefront tokens

Every custom property Storybook's root defines has the same value on the running storefront's home page. The storefront's root also defines 10 properties from the toast and carousel libraries' own stylesheets, which the story page does not load (D8).

## 4. Coverage gaps, and what was checked instead

Two kinds of case have no comparison on a running screen. Both stay open until a later run can cover them, for example with more browser-test data or FB-04's environment.

### 4.1 Stories whose state no running screen shows

The browser-test data has one seller with one currency, no secret API keys, no list longer than one page, and no form in an invalid state. Some states also exist only for a moment (loading) or only on input the data cannot produce (an error toast). These 35 stories were not compared on a running screen:

| ID | Stories |
|---|---|
| CMP-DUI-P-07 | Default, Ghost, Destructive, Destructive ghost, Link, Sizes, Disabled |
| CMP-DUI-P-29 | First page, Middle page, Last page, Without page size |
| CMP-DUI-P-35 | Small, Disabled, Invalid |
| CMP-DUI-C-03 | Seller panel |
| CMP-CORE-06 | Empty, Disabled, Invalid |
| CMP-DA-G-01 | Secret keys, Loading, Scopes open |
| CMP-SP-G-01 | Two currencies one converted, Empty |
| TK-EM | Email branding defaults (no email is rendered on a screen) |
| CMP-SF-P-04 | Default, Outline, Secondary, Ghost, Destructive, Link, With icon, Disabled, Focus visible |
| CMP-SF-P-21 | Error |
| CMP-SF-G-03 | Loading |

For each of them the check was made against the source, in three parts:
1. **The same code.** Each story renders Spree's own component from its source path, with the props the component declares, and no copy or wrapper that changes its styles. The pilot changes no file in Spree's packages or the storefront's `src/`.
2. **The same surroundings.** Each shares its providers, surface and fonts with a compared story of the same component, so the corrections in §6 reach it too.
3. **The image.** Each reference image was looked at and matches what the component's source and stylesheet describe for that state. For the email defaults, the token check regenerates the values from Spree's source and finds no difference.

What this does not show: that the state looks the same on a screen that has it, for example the pagination with several pages. A later run with more browser-test data, or FB-04's environment, can compare them.

### 4.2 The cart drawer opened with a pointer

The cart drawer story opens on mount, so it shows the drawer as a keyboard user opens it, with the focus ring on the close button (D7). The storefront opened with a mouse or touch shows no ring there. No story or capture shows that state yet, so it is currently uncovered. A story that renders the header's cart button, with a capture that clicks it as the comparison does on the running screen, could cover it; none has been written. The comparison shows both states on the screen side (`cart-drawer-empty` and `cart-drawer-with-items` against their keyboard versions).

## 5. Differences found

| # | Difference | Kind | What was done |
|---|---|---|---|
| D1 | Stories sat on the page grey (`bg-background`, which Storybook's body takes from the design system's base styles). Both panels render their pages, and their sheets and dialogs, on the card colour (`bg-card`): the sidebar inset in `dashboard-ui/src/ui/sidebar.tsx`, and the sheet and dialog panels | Defect in the reproduction | Corrected (C1) |
| D2 | The API key table, balance summary and pagination fill their container, and Storybook gave them 1,248 pixels. On their screens at a 1,280-pixel window they fill a settings column of 890 pixels or a page column of 965 | Defect in the reproduction | Corrected (C2) |
| D3 | The stories show invented fixtures and the screens show the browser-test data: a key with a creator line, a German flag against an American one, two cart items against one, a list of a few countries against all of them | Expected | Recorded |
| D4 | The select, the country combobox and the buttons take their width from their container or their label | Expected | Recorded |
| D5 | `--spacing-header-height` is 93 pixels on the admin dashboard and 0 in Storybook. A page's header measures itself and sets it at run time; 0 is the stylesheet's own default for a page without one. Only a table's sticky header row uses it, when the page scrolls | Expected | Recorded |
| D6 | The built storefront's font list names `"Geist Fallback"`, a face Next.js's font loader makes so text keeps its size while Geist loads. Storybook's stand-in for the loader makes none. The two differ only if Geist fails to load | Expected | Recorded |
| D7 | The cart drawer story opens on mount, so focus moves to the close button and its focus ring shows, as when a shopper opens the cart from the keyboard. Opened with a click, the ring is not drawn, and no story shows that state yet | Description defect | Story description corrected (C3); the clicked state is currently uncovered (§4.2) |
| D8 | The storefront's root defines variables from the toast and carousel libraries' stylesheets, which only load on pages that use them | Expected | Recorded |
| D9 | Storybook's root defines dashboard variables the panels' roots do not, with no conflicting value | Expected | Recorded |

## 6. Corrections made

| # | Correction | Where | Reference images |
|---|---|---|---|
| C1 | Stories sit on the card colour, with a comment naming where both panels take it from | Backend `src/styles.css` | All 82 backend images rewritten |
| C2 | A story need, `column: 'page'` or `'settings'`, shows a component at its page column's width, and the image is cropped to that column. The API key table takes the settings column, and the balance summary and pagination the page column | Backend `src/decorators/providers.tsx`, `src/styles.css`, three story files, README | In 26 of the 82, those three components are narrower |
| C3 | The cart drawer story says it shows the drawer as opened from the keyboard | Storefront `stories/cart/cart-drawer.stories.tsx` | None |

**A finding about the visual check.** C1 changed the background colour in every backend image: in the button's Default image, 41,053 of its 44,928 pixels changed, from (250, 250, 249) to white in light and from (15, 15, 15) to (26, 26, 26) in dark. Yet `pnpm visual:update` rewrote only the 26 images of the three components C2 narrowed, because each colour change is below the comparison's per-pixel threshold of 0.2, so the other 56 still passed. All 82 were rewritten with `--update-snapshots=all`, and each README now says to do that after a change every story shares. The owner then asked for an explicit tolerance. The [tolerance record](2026-10-21-fb-19-screenshot-tolerance.md) measures one, a threshold of 0.005 with 25 pixels allowed, under which this change fails all 82 backend images; #6 and storefront #15 now use it.

## 7. CI after the corrections

| Repository | Run | Revision | Result |
|---|---|---|---|
| Backend | [39643218184](https://github.com/pateldhruval872/liquorify/actions/runs/39643218184), attempt 1 | `8e1974c` | Passed: 82 comparisons with the rewritten images |
| Backend | [39643218184](https://github.com/pateldhruval872/liquorify/actions/runs/39643218184), attempt 2 | `8e1974c` | Cancelled by the workflow when `d0898ad` was pushed |
| Backend | [39645496605](https://github.com/pateldhruval872/liquorify/actions/runs/39645496605), attempt 1 | `d0898ad` | Passed: the same 82 images; `d0898ad` changes only the comparison with running screens |
| Backend | [39645496605](https://github.com/pateldhruval872/liquorify/actions/runs/39645496605), attempt 2 | `d0898ad` | Passed: the same revision run again, unchanged |
| Storefront | [39644938071](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39644938071) | `68900a3` | Passed |
| Storefront | [39645293426](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39645293426) | `d84dc61` | Passed |

Locally, the backend's lint, type check, unit tests, token check and coverage report passed at `8e1974c`, and the storefront's lint and type check at `d84dc61`.

## 8. Limitations

- **Diagnostic, not acceptance.** The comparison collects evidence. Its passing runs, and the results above, do not accept fidelity; the owner does, from the evidence (criterion 6).
- **Automated, not independent.** The same session built the pilot, wrote the comparison and made these checks.
- **Not every state.** 35 stories were checked against their source only (§4).
- **The storefront's backend.** The storefront ran against this repository's browser-test server, not the published Spree release its own end-to-end tests use, because those need Stripe test keys (OA-1). Its pages rendered with this backend's data.
- **Styles, not pixels.** Matching computed styles and the images side by side show the same rules applied. They do not compare images pixel by pixel, because the data differs on every screen.
- **One window size for the dashboards.** The column widths in C2 were measured at 1,280 pixels, the width the visual check captures. At another width the columns differ.
- **The panels' surroundings are not reproduced.** Stories show a component alone: no sidebar, page header, the card a page wraps it in, or the page behind a drawer.

## 9. Published evidence

The side-by-side images and the computed styles of every case, from the run at `817e177` and `0a901eb`, are in [`evidence/2026-10-21-fb-19-pilot-fidelity/`](evidence/2026-10-21-fb-19-pilot-fidelity/README.md), indexed by inventory ID with the revisions compared. That run found the same differences as §3: none in the backend apart from the API key table's heights (D3), and in the storefront the font list's fallback name (D6), the focus ring when the drawer is clicked open (D7) and the cart data (D3). Its token files match §3's counts. The folder holds 84 files, about 3.0 MB: the index, 52 backend case files and 2 token files, and 28 storefront case files and 1 token file.

API key values are masked on both sides, because the running screens show keys from the test database. The images show only the browser tests' fixtures and invented data.
