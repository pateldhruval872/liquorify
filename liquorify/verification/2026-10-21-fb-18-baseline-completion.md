---
title: FB-18 baseline completion check
record: verification
work_item: FB-18
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS for all seven criteria after four corrections, with screens that have no browser test listed as a limitation
---

# FB-18 baseline completion check

**Claim.** The Spree baseline meets its completion criteria ([LIQ-006 §14](../LIQ-006-product-capability-baseline.md#14-when-the-baseline-is-complete)), which are FB-18's ([LIQ-004](../LIQ-004-foundation-backlog.md#next-documentation-work-item)).

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Every route file is classified as a screen, layout or redirect, and the counts match | PASS after one correction: the storefront's two system pages were missing from the LIQ-008 counts |
| 2 | Every screen has an ID, route, scope, workflows, meaningful states and code; every email and flow has an ID | PASS after one correction: the email count was 26, and is 27. 20 screens have workflows but no browser test |
| 3 | Every component file and token has an ID in LIQ-009 | PASS after one correction: 25 component files were named but had no ID |
| 4 | Every area and surface lists its features with a disposition and the screens that show them | PASS after one correction: seven screens and the seller panel's screens were not named by any feature |
| 5 | Enterprise and documentation-only features are listed separately | PASS |
| 6 | FB-19, FB-20 and FB-21 exist with completion criteria tied to the IDs | PASS |
| 7 | The owner has reviewed LIQ-006, LIQ-008 and LIQ-009 | PASS: the owner merged [pull request #4](https://github.com/pateldhruval872/liquorify/pull/4) at 13:36 UTC and instructed the reproduction to proceed at 13:45 UTC |

The corrections are in the same change as this record. FB-18 is complete once that change merges.

## Revisions and method

- **Documents.** `liquorify` `main` at `f67b08a`, the merge of pull request #4.
- **Code.** Backend `1d1f2d4` and storefront `ac53c5b`, the revisions the baseline pins. `git diff 1d1f2d4 f67b08a` changes nothing outside `liquorify/`, so the backend code read is the same at both.
- **Procedure.** Short scripts, run in this session and not tracked, compared the documents with the files:
  - listed the route files in `packages/dashboard/src/routes/`, `packages/seller-dashboard/src/routes/` and the storefront's `src/app/`, and looked each one up in LIQ-008's code references and routes;
  - parsed every screen, email and flow row in LIQ-008 for empty cells, duplicate IDs and flow steps that name an undefined ID;
  - listed every `.tsx` file in the folders LIQ-009 names, without tests, looked up each file name, and checked that the row naming it carries an ID;
  - listed every CSS custom property declared in `packages/dashboard-ui/src/styles.css` and the storefront's `src/app/globals.css`, and looked up each one;
  - parsed every feature row in LIQ-006 §3 to §11 for a disposition and screens, and checked that every screen and email ID in LIQ-008 is named by at least one feature.
- **What was not checked.** Whether each listed workflow and state matches what the screen does when it runs. Nothing was run; that is what the reproductions FB-19 and FB-21 compare.

## Criterion 1: route files

| Surface | Route files found | In LIQ-008 | Result |
|---|---|---|---|
| Admin dashboard | 107 files; 106 routes and 1 test file (`_authenticated/index.test.tsx`) | All 106 named by their code reference: 95 screens, 6 layouts, 5 redirects | PASS. LIQ-008 now says that the test file is not counted |
| Seller panel | 26 | All 26: 22 screens, matched to their IDs by route, and 4 layouts | PASS |
| Storefront | 27 pages, 6 layouts, 1 error page and 1 route handler | All 35. The counts listed the 25 screens and 2 development previews but not the 2 system pages (SF-SYS-01, the error page, and SF-SYS-02, Next.js's built-in not-found page) | PASS after correcting the LIQ-008 §1 counts |

## Criterion 2: screen, email and flow details

- **IDs.** 158 screen and overlay rows (100 dashboard, 24 seller panel, 34 storefront), with no duplicate ID. 24 flows, and every screen or email a flow names is defined.
- **Cells.** Every screen row has a route, scope, workflows and code.
- **States.** 12 screens show a dash for meaningful states: DA-CUS-03, DA-RPT-02, DA-RPT-03, DA-SET-06, DA-SET-15, DA-SET-18, DA-SET-19, SP-FIN-01 and SP-SET-02 to SP-SET-05. They have only the shared list and detail states. LIQ-008 now says what the dash means, in §3 and §4.
- **Emails.** The repository has 23 Liquid email templates, not 22, besides the layout and 5 shared partials. With the 4 storefront emails that makes 27. LIQ-008 already listed all 27 rows (EM-C-01 to 11, EM-O-01 to 05, EM-S-01 to 07, EM-SF-01 to 04), but its count, LIQ-006 §2 and LIQ-007 said 26. All three are corrected.
- **Screens with workflows but no browser test.** 20: DA-SHELL-01, DA-SHELL-02, DA-SET-04, DA-SET-05, SP-AUTH-03, SP-SHELL-01, SF-SHOP-06, SF-ACC-03, SF-ACC-04, SF-ACC-06, SF-ACC-08, SF-ACC-09, SF-CHK-02, SF-CHK-03 and SF-WHL-01 to SF-WHL-06. Criterion 2 does not need a test. This is a fact about Spree's test coverage (LIQ-003 QV-07), not a gap in the inventory.

## Criterion 3: components and tokens

| Folder | Component files | Named in LIQ-009 |
|---|---|---|
| `dashboard-ui/src/ui/` | 46 | 46 |
| `dashboard-ui/src/spree/` | 54 | 54 (five by their subfolder path, such as `data-grid/cells`) |
| `dashboard-core/src/components/`, `pages/`, `products/` | 39, 3, 9 | 39, 3, 9. The 3 pages and 9 modules were named in a list with no IDs; they now have CMP-CORE-PG-01 to 03 and CMP-CORE-PF-01 to 09 |
| `dashboard/src/components/spree/` | 200 | 200 |
| `seller-dashboard/src/components/` | 28 | 28 |
| Storefront `src/components/ui/` and the other `src/components/` folders | 22 and 66 | 22 and 66 |
| Storefront components beside their pages | 12, plus `global-error` | 13, named in a paragraph with no IDs; they now have CMP-SF-PG-01 to 13. `src/app/dev/emails/fixtures.tsx` holds sample data for the development previews and is not a component |

| Stylesheet | Custom properties declared | Named in LIQ-009 |
|---|---|---|
| `dashboard-ui/src/styles.css` | 146 | 146 |
| Storefront `src/app/globals.css` | 90 | 90 |

- **Group IDs.** The application components, the storefront feature components and the colour utility aliases have one ID per group, with each member named in its row. This check counts a member as identified by its group's ID and name; LIQ-009 §1 now says so.
- **The correction.** The 25 files without an ID were found only after the first pass, which looked up names and not IDs. The record is corrected before merge, and the procedure above now includes the ID check.

## Criterion 4: features

- **Rows.** 92 feature rows in §3 to §11, each with a disposition: 34 Reuse, 5 Extend, 32 Not needed yet and 21 Unknown.
- **Features without a screen.** 11 rows show a dash, because the feature has no screen of its own: store provisioning, external references, price history, slugs, wishlists, the APIs and kits, hosted dashboards, provider contracts, tracing, the command line, and the update check.
- **Screens no feature named.** Before the correction, these were named by no feature row:
  - DA-SHELL-02 and DA-SET-01;
  - SF-SHOP-01, SF-OVL-01, SF-OVL-05, SF-SYS-01, SF-SYS-02 and the development previews;
  - the seller panel's screens, which the marketplace row named only as "SP-… (22 screens)".

  The fix adds one storefront row (home, header, footer, menus, and the error and not-found pages, proposed Reuse). It also adds the remaining IDs to the rows they belong to, and lists the seller panel's screens by ID. Afterwards every screen, overlay and email ID is named by at least one feature.

## Criteria 5 to 7

- **5.** LIQ-006 §12 lists the Enterprise-only features and the documentation-only integrations apart from the others, and FB-19 to FB-21 exclude them.
- **6.** LIQ-004 has FB-19, FB-20 and FB-21 with completion criteria tied to LIQ-008 and LIQ-009 IDs.
- **7.** The owner merged the pull request that added the three records and then instructed the reproduction to start. That is taken as the review this criterion asks for.

## Other corrections in the same change

Found while writing the reproduction plan ([LIQ-010](../LIQ-010-design-system-reproduction-architecture.md)), and outside the seven criteria:

- **The storefront never shows its dark theme.** LIQ-007 §2 said it switches through `next-themes`, and LIQ-009 §1 that both systems switch with a `.dark` class. Nothing in the storefront adds the class, and no theme provider is mounted. Both records are corrected.
- **Colours outside the tokens.** Both systems also use Tailwind's own palette colours in class names. They are not declared custom properties, so criterion 3 does not cover them, but Figma needs them. LIQ-009 §10 now lists the gap, and FB-20's token preparation adds them.
- **The seller panel's settings index** also uses the shared `settings-index` page, which LIQ-009 did not say.

## Limitations

- **Reading only.** The checks compare documents with files. They do not show that a listed state or workflow behaves as described.
- **Names, not meaning.** The component and token checks find each name in LIQ-009. They do not check its kind or capability links.
- **Automated, not independent.** The same session wrote the records and this check.

## Next

FB-19 and FB-20 start, as the owner instructed on 2026-10-21 ([LIQ-004](../LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)).
