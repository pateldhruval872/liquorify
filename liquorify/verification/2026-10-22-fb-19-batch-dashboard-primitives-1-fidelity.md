---
title: FB-19 dashboard primitives, part 1, compared with Spree's running screens
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: Diagnostic comparison of 33 cases for 22 of the batch's 24 primitives found no unexplained difference after three corrections to the stories; coverage gaps kept open for 83 of the batch's 114 stories, including every story of the alert and the slot; owner acceptance NOT_RUN
---

# FB-19 dashboard primitives, part 1, compared with Spree's running screens

**Claim.** A diagnostic comparison of the first dashboard primitives batch ([#9](https://github.com/pateldhruval872/liquorify/pull/9)) with the same components on Spree's running admin dashboard finds no difference that is not explained, after three corrections to the stories. This is the evidence for criterion 6 of the [batch record](2026-10-21-fb-19-batch-dashboard-primitives-1.md) and step 3 of [LIQ-010 §12.1](../LIQ-010-design-system-reproduction-architecture.md#121-each-batch). Where a story differed, the story was corrected, never the component.

The comparison script only collects evidence: side-by-side images and computed styles. A successful run shows that both sides could be captured, not that they match. Fidelity is accepted by the owner reviewing the [published evidence](evidence/2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity/README.md), which links each case to its inventory ID and the revisions compared.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The diagnostic comparison finds no computed-style difference between each compared story and its running screen, apart from the differences recorded as expected (§4) | PASS after three corrections: 33 cases, each in light and dark, at `7b1f2b8` |
| 2 | Every difference is recorded, and each one that is a defect is corrected in the story, its providers or its mocks | PASS: three story defects corrected (§5), five kinds of expected difference recorded (§4) |
| 3 | What the comparison cannot cover is recorded as a coverage gap, with the check made instead | PASS: 83 stories, including every story of two components, listed in §3 |
| 4 | The owner accepts fidelity from the published side-by-side images and computed styles | NOT_RUN: pull request #9 is a draft, awaiting the owner's review |

## 1. What was compared, and at which revisions

| | |
|---|---|
| Stories | The branch of [#9](https://github.com/pateldhruval872/liquorify/pull/9) at `7b1f2b8`, which corrects three stories (§5) |
| Running screens | Spree's code as at `main` `a4a1708`, unchanged since `1d1f2d4`; #9 does not change it |
| Backend for the screens | The admin dashboard's own browser-test server: Rails in its test environment, with the database and fixtures its browser tests create |
| Screens | The built admin dashboard (`vite preview`), as its browser tests serve it |
| Browser | The visual check's pinned image, Playwright 1.64.1 |
| Window | 1280 by 800 pixels, light and dark. The report builder's metrics set was captured in a 1280 by 1600 window, so the page header does not cover it |

The comparison is the pilot's ([pilot fidelity record](2026-10-21-fb-19-pilot-fidelity.md) §2), with this batch's cases added to `packages/liquorify-storybook/fidelity/compare.spec.ts`. It only reads the screens and never writes a reference image. Two cases needed a step the pilot's did not:

- **The loading row** holds every products request open, so the list stays in its loading state while it is captured.
- **Focus states** move focus with the keyboard before focusing the element, so the screen draws the focus ring a keyboard user sees.

The invalid field states empty the store name on the store settings page and press Save. The page shows the error without saving, so the browser-test data does not change.

## 2. Results per inventory ID

"Width" is the component's width on the screen and in the story; a component that fills its container takes the container's width (E2). A difference listed against an E number is explained in §4.

| ID | Story | Running screen | Width | Differences |
|---|---|---|---|---|
| CMP-DUI-P-01 | Accordion: One open | Getting started: the checklist | 963 and 446 px (E2) | Heights and the first step's icon, from the data (E1) |
| CMP-DUI-P-04 | Avatar: Initials | Order R1001: the customer card | 32 and 32 px | The root's inherited text colour, which nothing in it paints (E3) |
| CMP-DUI-P-05 | Badge: Variants, default | Settings, Roles: "Full access" | 81 and 58 px | None |
| CMP-DUI-P-05 | Badge: Variants, secondary | Settings, Roles: a count | 23 and 78 px | None |
| CMP-DUI-P-05 | Badge: Variants, info | Settings, Staff: a role | 54 and 39 px | None; the screen adds its own class names, so the elements pair by image only (E4) |
| CMP-DUI-P-06 | Breadcrumb: Default | Settings, Store: the top bar | 107 and 1248 px (E2) | None; two items against three (E1) |
| CMP-DUI-P-09 | Card: Default | Settings, Store: the General card | 890 and 448 px (E2) | Heights; the screen's card holds a field, the story's a description and a footer (E1) |
| CMP-DUI-P-11 | Checkbox: Unchecked | Products: a row | 16 and 16 px | None |
| CMP-DUI-P-11 | Checkbox: Checked | The same row, clicked | 16 and 16 px | None |
| CMP-DUI-P-11 | Checkbox: Indeterminate | Products: the header, with one row selected | 16 and 16 px | Inherited font size, from the table header (E3) |
| CMP-DUI-P-11 | Checkbox: Focus visible | A row, focused from the keyboard | 16 and 16 px | None |
| CMP-DUI-P-13 | Collapsible: Open | Stock locations: a product's stock levels, opened | 564 and 446 px (E2) | Inherited font size (E3); heights, a table against a list (E1) |
| CMP-DUI-P-22 | Empty: Default | A page that does not exist | 965 and 512 px (E2) | Height and icon (E1) |
| CMP-DUI-P-23 | Field: Vertical | Settings, Store: Store name | 864 and 448 px (E2) | Height; the story's field has a description (E1) |
| CMP-DUI-P-23 | Field: Invalid | The same field, emptied and saved | 864 and 448 px (E2) | None |
| CMP-DUI-P-23 | Field: Field set | Reports, New report: the metrics set | 294 and 448 px (E2) | The screen's boxes are unchecked and the story's checked, and the screen's set is longer (E1) |
| CMP-DUI-P-24 | Input group: Percent suffix | Settings, Store: a field with a "units" suffix | 864 and 320 px (E2) | The addon's height: text against an icon (E1) |
| CMP-DUI-P-25 | Input: Filled | Settings, Store: Store name | 864 and 320 px (E2) | None |
| CMP-DUI-P-25 | Input: Focused | The same input, focused | 864 and 320 px (E2) | None |
| CMP-DUI-P-25 | Input: Invalid | The same input, emptied and saved | 864 and 320 px (E2) | None |
| CMP-DUI-P-26 | Item: Outline | Customer page: the lifetime stats | 183 and 448 px (E2) | The screen's item adds its own classes and holds a statistic; the story's follows the order's line item dialog, with a picture and an action (E1, E4) |
| CMP-DUI-P-27 | Label: Default | Forgot password: Email | 384 and 1248 px (E2) | None |
| CMP-DUI-P-31 | Progress: With value | Getting started: the progress bar | 965 and 320 px (E2) | None |
| CMP-DUI-P-32 | Field: Choice cards | Settings, Store: when payment is taken | 864 and 448 px (E2) | The group's height: three choices against two (E1) |
| CMP-DUI-P-34 | Scroll area: Vertical | Home: a ranking list | 567 and 224 px (E2) | The story follows the seller panel's onboarding list, with a border and rounded corners; the home page's list has neither (E4). Heights (E1) |
| CMP-DUI-P-36 | Separator: Horizontal | Order R1001 | 633 and 256 px (E2) | None |
| CMP-DUI-P-39 | Skeleton: Row | Products, while the list loads | 963 and 448 px (E2) | None |
| CMP-DUI-P-41 | Switch: On | Settings, Store: a switch that is on | 36 and 36 px | None |
| CMP-DUI-P-41 | Switch: Off | Settings, Store: a switch that is off | 36 and 36 px | None |
| CMP-DUI-P-41 | Switch: Focus visible | That switch, focused from the keyboard | 36 and 36 px | None |
| CMP-DUI-P-42 | Tabs: Default | Settings, Taxes: the tabs | 292 and 273 px | None |
| CMP-DUI-P-43 | Textarea: Empty | Product page: SEO description | 280 and 320 px (E2) | None |
| CMP-DUI-P-44 | Thumbnail: Custom fallback | Products: a product without an image | 40 and 40 px | None |

The avatar and the label were not in the first run. Searching the screens for where they appear found the order's customer card and the forgot password page. Both cases were added to the script after `7b1f2b8` and run against the stories at that revision; the script change is committed with this record. Neither story needed a correction.

## 3. Coverage gaps, and what was checked instead

These stay open until a later run can cover them, for example Part A of the staff access batch, more browser-test data, or FB-04's environment.

### 3.1 Components with no comparison

| ID | Why | Checked instead |
|---|---|---|
| CMP-DUI-P-02 `alert` | The screens that show an alert need data the browser tests do not create: an outside tax provider, an email template problem, a webhook failure | The source, as in §3.2 |
| CMP-DUI-P-40 `slot` | It renders no element of its own; it passes its class names and props to its child | The story checks that the child receives them |

### 3.2 States no running screen shows with the available data

The 33 cases compare 31 of the batch's 114 stories; the badge's Variants story is compared three times, once for each variant a screen shows. Each story is one state, so the other 83 stories are 83 states that are disabled, invalid, hovered or arranged differently, or that appear only on screens with data the browser tests do not create:

| ID | States not compared |
|---|---|
| CMP-DUI-P-01 | Closed, Several open, Focus visible |
| CMP-DUI-P-02 | All 7 |
| CMP-DUI-P-04 | Image, Sizes, With badge, Group |
| CMP-DUI-P-05 | Default, With icon, Linked, Statuses, Dots, Active |
| CMP-DUI-P-06 | Collapsed, Custom separator |
| CMP-DUI-P-09 | With action, Content only, Container with nested |
| CMP-DUI-P-11 | Disabled, Disabled checked, Invalid |
| CMP-DUI-P-13 | Closed |
| CMP-DUI-P-22 | With action, Title only, Error |
| CMP-DUI-P-23 | Several errors, Horizontal, Disabled, Legend, Separator |
| CMP-DUI-P-24 | Currency prefix, Icon and button, Block addons, Disabled, Invalid, Focus visible |
| CMP-DUI-P-25 | Empty, Number, File, Disabled |
| CMP-DUI-P-26 | Default, Muted, Sizes, Icon media, Linked, Header and footer, Group |
| CMP-DUI-P-27 | With control, Disabled control |
| CMP-DUI-P-31 | Default, Empty, Complete, Indeterminate |
| CMP-DUI-P-32 | None selected, Selected, Disabled, Focus visible (the plain radio group; its choice card arrangement is compared) |
| CMP-DUI-P-34 | Hovered, Horizontal |
| CMP-DUI-P-36 | Vertical |
| CMP-DUI-P-39 | Line |
| CMP-DUI-P-40 | Merges onto child |
| CMP-DUI-P-41 | Disabled, Disabled on |
| CMP-DUI-P-42 | Second selected, Vertical, Focus visible, Focus on selected tab |
| CMP-DUI-P-43 | Filled, Disabled, Invalid, Focused |
| CMP-DUI-P-44 | Image, Placeholder, Sizes, Shapes |

For each, the check was made against the source in the pilot's three parts ([pilot fidelity record](2026-10-21-fb-19-pilot-fidelity.md) §4.1): the story renders Spree's own component with the props it declares; it shares its surroundings with a compared story of the same component; and its image was looked at and matches what the source describes. What this does not show is that the state looks the same on a screen that has it.

Part A of the staff access batch is expected to close some of these: its sign-in and staff screens show disabled and invalid inputs, the avatar's image state, and the label beside a control.

## 4. Differences found

| # | Difference | Kind | What was done |
|---|---|---|---|
| E1 | The screens show the browser tests' data and the stories invented data, so text, icons, counts, rows and the heights that follow them differ | Expected | Recorded |
| E2 | Components that fill their container take its width: a settings column of 864 or 890 pixels, a page column of 963 or 965, or the sign-in form's 384. Stories show them at the width their story sets | Expected | Recorded |
| E3 | Elements inherit a font size or text colour that nothing in them paints with: the dashboard's table headers and some panels set 13 pixels where Storybook's page sets 14, and the avatar's root inherits its card's text colour. The visible text in each case sets its own size and colour, which match | Expected | Recorded |
| E4 | A screen adds its own class names to a component, such as the staff page's role badge, the customer page's stat item and the home page's ranking list, so the script cannot pair those elements; the images show them | Expected | Recorded. The scroll area story follows the seller panel's onboarding list (`h-72 rounded-md border`), not the home page's |
| E5 | The sign-in pages sit on the page colour (`bg-background`, in `auth-shell.tsx`), not the card colour the pilot's correction gives every story. The label was compared there; it paints no background, so it is unaffected | Expected for this batch | Recorded for Part A, whose sign-in stories need the page colour |

## 5. Corrections made

The first run, at `cbbd8e4`, found three stories that did not follow any Spree screen. Each was corrected in `7b1f2b8`, with its reference images rewritten in the pinned image and looked at in both modes.

| # | Correction | Story | Reference images |
|---|---|---|---|
| C1 | The invalid field stories turned the label red, by marking the whole field invalid. Spree's forms mark only the control and show the message, and the label keeps its colour. The stories now do the same | `field.stories.tsx`: Invalid, Several errors | 4 rewritten |
| C2 | The progress story put its caption in the label part, above the bar. The getting started page, the only screen with a caption, puts the value after the bar on one row. "With label" became "With value", arranged as that page | `progress.stories.tsx` | 2 removed, 2 added |
| C3 | The loading row story invented a layout of several bars. The products list, while it loads, shows one full-width bar per row inside the table body. The story now does the same | `skeleton.stories.tsx`: Row | 2 rewritten |

The same run also changed how six cases find their component, so each compares the state its story shows: the checked checkbox is blurred so it shows no focus ring, the indeterminate checkbox is the table header's, the radio group is compared with the choice card story, the item with the outline story, the empty state with the default story, and the thumbnail with the custom fallback story. These change only the comparison script.

## 6. Limitations

- **Diagnostic, not acceptance.** The comparison collects evidence. Its passing run, and the results above, do not accept fidelity; the owner does, from the evidence (criterion 4).
- **Automated, not independent.** The same session wrote the stories, the comparison and these checks.
- **Not every state.** 83 stories, including every story of the alert and the slot, were checked against their source only (§3).
- **Styles, not pixels.** Matching computed styles and the images side by side show the same rules applied. They do not compare pixels, because the data differs on every screen.
- **One window size.** 1280 pixels wide, the width the visual check captures.
- **The panels' surroundings are not reproduced.** Stories show a component alone, so inherited sizes and colours can differ where nothing visible uses them (E3).

## 7. Published evidence

The side-by-side images and the computed styles of every case, from the run at `7b1f2b8`, are in [`evidence/2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity/`](evidence/2026-10-22-fb-19-batch-dashboard-primitives-1-fidelity/README.md), indexed by inventory ID. The folder holds 133 files, about 2.1 MB: the index and 132 case files. The screens show only the browser tests' fixtures; no API key or other credential appears on them, so nothing is masked.
