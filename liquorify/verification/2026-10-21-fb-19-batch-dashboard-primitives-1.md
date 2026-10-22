---
title: FB-19 batch of dashboard primitives, part 1
record: verification
work_item: FB-19
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS for the build, check, arrangement and visual criteria, including after the images were rewritten for the pilot's surface correction; NOT_RUN for the comparison with running screens and for the owner's review of the reference images. Revalidated on 2026-10-22: the comparison with running screens found three stories that did not follow a screen, so criterion 3 failed for them; they were corrected, and the comparison then found no unexplained difference. The owner's review stays NOT_RUN
---

# FB-19 batch of dashboard primitives, part 1

**Claim.** 24 more of the dashboard design system's 46 primitives have Storybook stories, one for each state, with light and dark reference images that the visual check compares. This is the first batch after the [pilot](2026-10-21-fb-19-pilot.md), in the order [LIQ-010 §13](../LIQ-010-design-system-reproduction-architecture.md#13-pilot) sets.

**Results.**

| # | Criterion ([LIQ-010 §12.1](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch)) | Result |
|---|---|---|
| 1 | Every story renders, and lint, the type check and the fixture tests pass | PASS |
| 2 | The token check and the coverage report run | PASS |
| 3 | Each story arranges the component's parts the way a Spree screen does, or says that no screen uses them | PASS |
| 4 | Every new image was looked at in both modes before it was committed | PASS |
| 5 | The reference images made in this session pass CI's comparison, and no existing image changed | PASS: all 310 comparisons passed on GitHub's runners under the tolerance then configured, Playwright's default threshold of 0.2, before and after the batch's images were rewritten for the pilot's surface correction (§3). Under the explicit tolerance that replaced it, two local runs in the pinned image passed all 310 ([tolerance record](2026-10-21-fb-19-screenshot-tolerance.md)). Image hashes were not compared |
| 6 | Each story matches the component in its running screen | NOT_RUN for this batch. The pilot's comparison with running screens found that every story sat on the wrong surface colour; that correction reaches this batch's stories too (§3). The pilot was accepted on 2026-10-21 ([acceptance record](2026-10-21-fb-19-pilot-merge-and-acceptance.md)); this batch's own comparison has not run yet, and the pull request stays a draft until it and the owner's review are complete |
| 7 | The owner reviews the reference images in the pull request | NOT_RUN: pull request [#9](https://github.com/pateldhruval872/liquorify/pull/9) is open |

### Revalidation on 2026-10-22

The results above are kept as they were recorded. The batch's comparison with running screens then ran, and changed what can be relied on:

| # | Criterion | Result on 2026-10-22 |
|---|---|---|
| 3 | Each story arranges the component's parts the way a Spree screen does | FAIL for three stories at `8d53a5c`: the invalid field stories, the progress caption and the loading row followed no screen. Corrected at `7b1f2b8` ([fidelity record](2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity.md) §5), so PASS there |
| 4 | Every new image was looked at in both modes | PASS at `7b1f2b8`: the six rewritten or added images were looked at in both modes |
| 5 | The reference images pass CI's comparison, and no other image changed | PASS at `c4d3d2c`, the revision that carries this note: all 310 comparisons passed on GitHub's runners in [39703070746](https://github.com/pateldhruval872/liquorify/actions/runs/39703070746) under the explicit tolerance, and the pull request's other checks passed (§2) |
| 6 | Each story matches the component in its running screen | PASS, as a diagnostic: 33 cases for 22 of the 24 primitives found no unexplained difference after the three corrections ([fidelity record](2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity.md)). 83 stories, including every story of the alert and the slot, were checked against their source only. The owner's acceptance of fidelity is NOT_RUN |
| 7 | The owner reviews the reference images | NOT_RUN: #9 stays a draft |

The progress story "With label" became "With value", so the states FB-20 uses for `progress` are Default, Empty, Complete, With value and Indeterminate. The pull request now targets `main`, because #8 merged on 2026-10-22.

### Coverage, not functional verification

Added on 2026-10-22, at the owner's instruction that the two be kept apart. Everything this batch records is coverage: the stories, their reference images and the comparison with running screens show what each component looks like in each state. The batch claims no capability, flow or behaviour, so it has no functional verification result. The 83 stories checked against their source only stay open as a coverage gap until the owner accepts their deferral or a later batch compares them.

## 1. What was built

| | |
|---|---|
| Pull request | [#9](https://github.com/pateldhruval872/liquorify/pull/9), into the branch of [#8](https://github.com/pateldhruval872/liquorify/pull/8) |
| Revision | `2281eb5` |
| Spree's code | Unchanged from `1d1f2d4`. The batch changes only `packages/liquorify-storybook/` and `liquorify/` |
| Stories | 114 new, 155 in all |
| Reference images | 228 new, light and dark at 1280 pixels, 1.0 MB, about 4.5 KB each. The pilot's 82 images are unchanged |
| Fixture images | `public/fixtures/product-sand.png` and `avatar.png`, invented drawings made for these stories |
| LIQ-009 | 0.4: the Storybook and Figma columns on the dashboard tables, filled for the pilot and this batch |

### Coverage, from the coverage report at `2281eb5`

| Section | Covered | Total |
|---|---|---|
| CMP-DUI-P | 27 | 46 |
| CMP-DUI-C | 1 | 54 |
| CMP-CORE | 1 | 39 |
| CMP-CORE-PG | 0 | 3 |
| CMP-CORE-PF | 0 | 9 |
| CMP-DA-G | 1 | 200 |
| CMP-SP-G | 1 | 28 |
| Tokens | All 200 | 200 |

### States recorded per component

These are the story names, which FB-20 uses as Figma component properties. Each is captured in light and dark at 1280 pixels.

| ID | Component | States | Arranged as |
|---|---|---|---|
| CMP-DUI-P-01 | `accordion` | Closed, One open, Several open, Focus visible | The getting started checklist |
| CMP-DUI-P-02 | `alert` | Default, With icon, Info, Warning, Destructive, Title only, With action | |
| CMP-DUI-P-04 | `avatar` | Image, Initials, Sizes, With badge, Group | The order's customer card. No screen uses the group |
| CMP-DUI-P-05 | `badge` | Default, Variants, With icon, Linked, Statuses, Dots, Active | The order cards' status badges |
| CMP-DUI-P-06 | `breadcrumb` | Default, Collapsed, Custom separator | |
| CMP-DUI-P-09 | `card` | Default, With action, Content only, Container with nested | The privacy, payments and fulfillments cards |
| CMP-DUI-P-11 | `checkbox` | Unchecked, Checked, Indeterminate, Disabled, Disabled checked, Invalid, Focus visible | The report builder |
| CMP-DUI-P-13 | `collapsible` | Closed, Open | The stock location's stock levels |
| CMP-DUI-P-22 | `empty` | Default, With action, Title only, Error | The API key table and the report view |
| CMP-DUI-P-23 | `field` | Vertical, Invalid, Several errors, Horizontal, Disabled, Choice cards, Field set, Legend, Separator | The choice card picker and the report builder. No screen uses the separator |
| CMP-DUI-P-24 | `input-group` | Currency prefix, Percent suffix, Icon and button, Block addons, Disabled, Invalid, Focus visible | |
| CMP-DUI-P-25 | `input` | Empty, Filled, Number, File, Disabled, Invalid, Focused | |
| CMP-DUI-P-26 | `item` | Default, Outline, Muted, Sizes, Icon media, Linked, Header and footer, Group | |
| CMP-DUI-P-27 | `label` | Default, With control, Disabled control | |
| CMP-DUI-P-31 | `progress` | Default, Empty, Complete, With label, Indeterminate | The getting started page |
| CMP-DUI-P-32 | `radio-group` | None selected, Selected, Disabled, Focus visible | |
| CMP-DUI-P-34 | `scroll-area` | Vertical, Hovered, Horizontal | |
| CMP-DUI-P-36 | `separator` | Horizontal, Vertical | |
| CMP-DUI-P-39 | `skeleton` | Line, Row | |
| CMP-DUI-P-40 | `slot` | Merges onto child | |
| CMP-DUI-P-41 | `switch` | Off, On, Disabled, Disabled on, Focus visible | |
| CMP-DUI-P-42 | `tabs` | Default, Second selected, Vertical, Focus visible, Focus on selected tab | No screen uses vertical tabs |
| CMP-DUI-P-43 | `textarea` | Empty, Filled, Disabled, Invalid, Focused | |
| CMP-DUI-P-44 | `thumbnail` | Image, Placeholder, Custom fallback, Sizes, Shapes | |

Where the last column is empty, the component appears across many screens in the same simple form, and the story shows it on its own.

### States not recorded

- **A disabled accordion item.** Spree's accordion has no style for it, and no Spree screen disables an item. The story would look the same as "Closed".
- **A slot with no child.** It renders nothing, so there is nothing to capture.

### Stand-ins and cases not rendered

None. These primitives need no provider beyond the pilot's decorators, and no request is made.

## 2. CI runs

| Run | Revision | Result |
|---|---|---|
| [39635086908](https://github.com/pateldhruval872/liquorify/actions/runs/39635086908) | `2281eb5` | Built, token check and coverage passed, 310 comparisons passed in 3.6 minutes; no failure images to publish |
| [39647604906](https://github.com/pateldhruval872/liquorify/actions/runs/39647604906) | `8d53a5c` | Built, token check and coverage passed, and all 310 comparisons passed in 3.7 minutes with the batch's rewritten images |
| [39703070746](https://github.com/pateldhruval872/liquorify/actions/runs/39703070746) | `c4d3d2c` | Built, token check and coverage passed, and all 310 comparisons passed in 2.9 minutes with the three corrected stories, under the explicit tolerance |

The pull request's other checks also passed at `2281eb5` and at `c4d3d2c`. The batch changes no file they test. At `e69b514`, `PostgreSQL - core (1/3)` failed one of Spree's address specs, which fails on any run where its randomly chosen country is Hungary; the cause is in Spree's code, and it is described on [#6](https://github.com/pateldhruval872/liquorify/pull/6#issuecomment-6322907935).

## 3. Procedure and evidence for each criterion

**1. Stories render, and checks pass.** In this session, at `2281eb5`: `pnpm build-storybook` built; `pnpm lint` (Biome) and `pnpm typecheck` passed; `pnpm test` passed its 5 fixture tests. Every story reached Storybook's finished render phase without an error in each comparison run.

**2. Token check and coverage.** `pnpm tokens:check` found the token files and the ID list current after LIQ-009 moved to 0.4; the version is the only change to either. `pnpm coverage` gave the table in §1 and found no unknown tag.

**3. Arranged as Spree arranges it.** For each component the dashboard and seller panel source was searched for the screens that use it, and the stories were written from those screens (the last column in §1). Reviewing the first images found three stories that did not follow a screen, and they were rewritten before committing:
- the card's first story put a description and an action in one header. No Spree screen does, and the header's grid placed the description beside the title and the button under it. It became two stories, one with a description and one with an action, as Spree's cards are;
- the field set story put a separator inside the set. Spree's report builder uses the set with a label legend and checkboxes and never uses the separator, so the separator now has its own story on the page background it was made for;
- the vertical tabs story let the list take the whole width. No screen uses vertical tabs; the story now puts the list in a fixed column.

**4. Images looked at.** All 228 images were looked at in both modes, side by side, and the focus states were enlarged. Two findings came from this (§4).

**5. Images pass.** `pnpm visual:update` made the images in the pinned Playwright image through Docker. A full comparison run afterwards, from a fresh build, passed all 310 tests (155 stories in two modes), so the pilot's 82 references still pass, and `git diff` shows none of their files changed. Run 39635086908 then compared the same 310 on GitHub's runners, and all passed.

A pass means Playwright found no pixel whose colour differs from the reference by more than its default threshold of 0.2, on its scale from 0 to 1 (`maxDiffPixels: 0`). Pixels that differ by less still pass. Image hashes were not compared, so these runs do not show that the screenshots were identical to the references.

**After the pilot's correction.** The pilot's [comparison with running screens](2026-10-21-fb-19-pilot-fidelity.md) found that stories sat on the page grey, while both panels render their pages, sheets and dialogs on the card colour, and corrected the shared stylesheet (its C1). That reaches every story, so this batch's 228 images were rewritten at `8d53a5c` with `--update-snapshots=all`, in the pinned image. Every rewritten image kept its size. Comparing each with the one it replaced, the changed pixels are the old surface colour turned into the new one, and pixels blended with the surface: the edges of text and shapes, and translucent fills such as the info and warning alerts, the muted item, the progress track and the badge tints. The images of those components, and a sample of the rest, were looked at after the rewrite. The pilot's 82 images were left as #6 commits them.

Rendering the pilot's stories again on this branch, in the same pinned image, gave files that differ from the committed ones for 8 of the 82, all in dark mode: 1 to 36 pixels each, by at most 14 of 255 on one colour channel. The comparison's tolerance absorbs differences of that size, which is one reason it cannot simply be set to zero ([fidelity record](2026-10-21-fb-19-pilot-fidelity.md) §6). The [tolerance record](2026-10-21-fb-19-screenshot-tolerance.md) measures these differences on this batch's 310 images and sets the explicit tolerance with them.

**6. Fidelity.** Not run for this batch's stories. The pilot's comparison found one defect that reaches them, corrected above.

**7. Review.** The owner reviews the images in pull request #9.

## 4. What the batch found

| # | Finding | Where it is recorded |
|---|---|---|
| 1 | The selected tab shows no keyboard focus ring. The tab's focus ring and its selected look are both box shadows, and the selected rule comes later in the compiled stylesheet, so it wins; the next tab shows the ring. "Focus on selected tab" records it and matches "Default" | LIQ-010 §2.4 |
| 2 | The avatar group overlaps each avatar with the next by more than the room around two-letter initials, so they are cut off. No Spree screen uses the group | LIQ-010 §2.4 |
| 3 | Some parts have no style for a state no screen uses, such as a disabled accordion item; no story is written for such a state | LIQ-010 §2.4, and §1 here |
| 4 | Stories must follow a Spree screen's arrangement, and every image must be looked at before committing | LIQ-010 §12.1 |
| 5 | A token page shows a whole family, so LIQ-009 names it once per section, not on every row; the storefront's tables gain the columns with its first batch | LIQ-010 §10, LIQ-009 §1 |

None of these changes Spree's code. Findings 1 and 2 are Spree's behaviour, reproduced as it is.

## 5. Limitations

- **Automated, not independent.** The same session wrote the stories, made the images and ran these checks.
- **Fidelity not checked against running screens** (criterion 6), except that the pilot's surface correction reaches these stories.
- **The rewritten images were not each looked at again.** The pixel comparison above shows what changed; the components with translucent fills and a sample of the rest were looked at.
- **One browser.** Chromium only, by design ([LIQ-010 §11.1](../LIQ-010-design-system-reproduction-architecture.md#111-environment)).
- **Passing, not identical.** A matching image here means one that passed under the tolerance configured at the time (§3, criterion 5). This wording was corrected before the record merged; it first said no pixel differed.
- **Hover states** are captured only where the component changes on hover in a way the screens rely on (the scroll area's bar). Other hover colours are in the source and not captured.
