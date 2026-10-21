---
document_id: LIQ-007
title: Design System Adoption and Extension
version: 0.3
status: PROPOSED
owner: Dhruval (decision owner, as proposed in LIQ-001 §2)
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Design System Adoption and Extension

A decision record ([ENG-002 §6](framework/ENG-002-documentation-system.md#decision-record)) for FB-18 ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)). **Status: PROPOSED,** and it stays PROPOSED while the owner reviews the revised scope. Nothing in it is decided until the owner accepts it, except the three scoped decisions in §7 (Q4, Q5 and Q7), which the owner made on 2026-10-21 so the reproduction could start.

Version 0.2 follows the owner's sequencing instruction of 2026-10-21 ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)): the existing Spree baseline is reproduced and documented first, and Liquorify's extensions come afterward. Setting up any tool, account, dependency, CI step or credential happens in the work items FB-19 to FB-21 ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)), which are Protected where they add dependencies, CI steps, accounts or credentials. How the tools are arranged around Spree's code, and how the reproduction is checked and kept up to date, is planned in [LIQ-010](LIQ-010-design-system-reproduction-architecture.md).

## 1. Question

How do Figma, Storybook and Chromatic, the three tools the owner selected on 2026-10-21, reproduce and document Spree's existing design systems first? And after that baseline, how would Liquorify extend those systems for its own screens and branding without forking them?

**Affected scope:**

- **First, the Spree baseline as it is:** the admin dashboard, the seller panel, the storefront with its wholesale portal, and the emails, as inventoried in [LIQ-008](LIQ-008-spree-screen-inventory.md) and [LIQ-009](LIQ-009-spree-component-and-token-inventory.md).
- **Afterward, Liquorify's extensions, all deferred by the owner:** Liquorify branding (FB-14), and the proposed Liquorify screens for sign-up, merchant onboarding, the merchant subscription, the storefront holding page and the platform Admin Console (merchant lifecycle specification, F1 to F5).

The seller panel is part of the baseline even though [LIQ-006 §10](LIQ-006-product-capability-baseline.md#10-marketplace) marks the marketplace "not needed yet": the baseline covers what exists, whatever its later disposition.

## 2. Context: what exists and what is proposed

Read on 2026-10-21 at backend `1d1f2d4` and storefront `ac53c5b`, by reading only. Both repositories are public. Evidence codes R, U, C1, C2 and V2 have the meanings in [LIQ-006 §1](LIQ-006-product-capability-baseline.md#1-scope-revisions-and-evidence); everything without a code was read in the files named (R).

| Area | Exists in Spree today | Baseline reproduction (first) | Liquorify extension (later, deferred) |
|---|---|---|---|
| Dashboard design system | `@spree/dashboard-ui` 1.0.0-rc.4: 46 primitives, of which 22 are built on Base UI, 16 are styled HTML and 8 use single-purpose libraries (dates, command menu, rich text, charts, code editor, plugin slots), and 54 composed components (LIQ-009 §2). They are headless: data arrives through props. The admin dashboard is the reference, and the seller panel uses the same package and stylesheet | Stories and Chromatic baselines (FB-19); Figma library (FB-20) | None to the package for Liquorify-only needs. Liquorify-specific compositions live in a Liquorify dashboard plugin package (specification P3) |
| Framework and application components | `@spree/dashboard-core`'s 39 components, the dashboard's 200 and the seller panel's 28, bound to data and providers (LIQ-009 §3, §4) | Stories with stand-in providers and mocked data (FB-19); in Figma where screens reuse them (FB-20, FB-21) | Liquorify compositions beside them, in the plugin package |
| Dashboard extension points | `defineDashboardPlugin`, slots on detail pages, navigation and table registries, host-form binding (`@spree/dashboard-core`; `docs/developer/dashboard/customization/`) | Not reproduced; they have no look of their own | Used as documented. A missing extension point is requested or added in an upstream-compatible way, not patched in place |
| Dashboard tokens and theming | 62 light and 58 dark values and 84 theme entries in `styles.css` (LIQ-009 §6). Families: surfaces, brand, status, borders, sidebar, charts; fonts and type scale in `@theme inline`. Merchants restyle by overriding tokens below the stylesheet import, with no component forks (`theming.mdx`) | Figma variables with light and dark modes (FB-20); token pages in Storybook (FB-19) | Liquorify brand values as token overrides in the Liquorify host application |
| Dashboard brand marks | The host application owns the page title and favicon (`dashboard-starter/index.html`). The sign-in artwork is bundled in `@spree/dashboard` with no documented override | Reproduced as they are (FB-21) | Liquorify's host application sets the title and favicon. Replacing the sign-in artwork needs an extension point (Q6) |
| Storefront components | shadcn's `radix-nova` style on Radix: 22 primitives, 66 feature components and 13 page-level components (LIQ-009 §5). 30 of its 88 component files are not client components | Stories and Chromatic baselines (FB-19); Figma library (FB-20) | Liquorify storefront changes (F4's holding page, Liquorify branding) in the storefront repository's own components |
| Storefront tokens | 32 light and 31 dark values and 58 theme entries in `globals.css`, with shadcn's token names and the Geist font (LIQ-009 §7). The dark values are declared but never applied: nothing adds the `dark` class, so shoppers always see the light theme ([LIQ-010 §3.3](LIQ-010-design-system-reproduction-architecture.md#33-styling-and-a-correction-the-storefront-never-shows-dark-mode)) | Figma variables (FB-20); token pages in Storybook (FB-19) | The same Liquorify brand values mapped onto these token names |
| Storefront store identity | Store name from the `NEXT_PUBLIC_STORE_NAME` build setting and the logo from a static file, so one deployment shows one store | Reproduced with Spree's sample store | Depends on the unresolved storefront hosting decision (one deployment per merchant, or one serving many) |
| Screens and flows | 95 dashboard screens, 22 seller panel screens, 25 storefront screens, 2 storefront system pages and 2 development previews, 12 overlays, 27 emails and 24 cross-screen flows (LIQ-008) | Wireframes, full reproductions of every meaningful state, and flow prototypes in Figma (FB-21) | Liquorify screens designed from those reproductions |
| Email branding | Liquid and MJML templates whose colours and font come from each store's `store.branding` preferences (`Spree::Stores::EmailBranding`), 5 colours and a font (LIQ-009 §8); merchants edit templates in the dashboard | Figma variables (FB-20); every email reproduced (FB-21) | Reuse. Liquorify's own emails (verification, billing) follow the same rules |
| Text and languages | i18next in the dashboard; next-intl messages in 5 languages in the storefront, checked for parity (C1) | Reproduced in English | Liquorify copy goes through the same mechanisms, in every language Liquorify supports (undecided) |
| Component documentation | None. Spree's admin plan lists Storybook as an open question ("light visual docs … likely Phase 3, not a blocker") | Storybook for every existing component (FB-19) | Liquorify-owned components added beside them |
| Visual review | None (LIQ-003 QV-08) | Chromatic baselines for every story (FB-19) | Liquorify changes reviewed against the same baselines |
| Design guidance for coding agents | Ten third-party agent skills tracked in `.agents/skills/`, linked from `.claude/skills/`, with their sources pinned in `skills-lock.json`. One is shadcn's own component skill. Nine cover interface and animation design, prototyping and choosing libraries. They guide agents and are not part of either design system | Not reproduced | Reuse when agents build Liquorify screens, within this record's rules. They are upstream files, so they change only with Spree releases unless Liquorify decides otherwise |
| Design source | None in either repository: no Figma copy of Spree's systems and no Liquorify brand (PD-09) | Figma, starting with the reproduction (FB-20, FB-21) | Liquorify designs start in Figma from the reproduced libraries |
| Accessibility | Base UI and Radix aim for accessible primitives (their own published claims, not verified here). No target and no automated checks in either repository (PD-11, QV-09) | Optionally, automated results recorded as findings only (Q9) | A target and checks, set by FB-15 (§3, decision 6) |
| Tests | Dashboard components are exercised through the dashboard's unit tests and 434 browser tests (V2); `dashboard-ui` has no tests of its own. The storefront has 14 component test files (C1) and 21 browser tests (LIQ-008 §1) | Story-based visual checks added alongside, not instead | The same, for Liquorify components |

**What the two systems share.** Tailwind 4, shadcn's token naming, neutral palettes in the oklch colour space, Lucide icons and the Geist font. Both are configured with shadcn's `radix-nova` style name, although the dashboard's behaviour library is mostly Base UI.

**Where they differ.** Base UI against Radix, separate packages, and no common token source. Sharing brand values across the two is therefore realistic. Sharing components is not.

## 3. Proposed decision

1. **Reproduce and document the Spree baseline first.**
   - Components and tokens go into Storybook with Chromatic baselines (FB-19) and into Figma libraries (FB-20). Every screen with its meaningful states, its wireframe, every flow and every email then goes into Figma, built from those libraries (FB-21).
   - The code at the pinned revisions is the source. Figma and Storybook copy it, with Spree's look, names and states; a difference is a defect in the copy.
   - Spree baselining starts these items. They do not wait for a Liquorify component, Liquorify branding or the acceptance of this whole record; each needs only the owner's instruction and the answers to the questions it depends on (§7).
2. **Afterward, adopt both component systems as they are, and extend each only through its documented extension points.**
   - The dashboard keeps `@spree/dashboard-ui` and its rules from the backend `CLAUDE.md`.
   - The storefront keeps its own components.
   - Liquorify does not edit Spree's packages for Liquorify-only needs. A generic fix is made the way upstream would accept it, so Spree releases stay easy to take in (FB-12).
3. **Keep Liquorify-owned components out of Spree's packages.**
   - Dashboard compositions go in the Liquorify dashboard plugin package that the specification proposes (P3).
   - The Admin Console reuses `@spree/dashboard-ui` primitives in its own small interface (P3, F5).
   - Storefront components stay in the storefront repository.
4. **Use one set of Liquorify brand values, mapped onto each surface's existing tokens,** when branding starts (FB-14, deferred).
   - The values are defined once and applied as overrides to the dashboard's tokens, the storefront's tokens and the Liquorify email defaults.
   - The tokens' names and structure stay Spree's, so the Figma variables reproduced in FB-20 gain a Liquorify mode rather than a new structure.
   - Whether merchants' own brands replace Liquorify's on the storefront and in shopper emails is open (Q2). This decision prepares FB-14 and does not make it.
5. **Use the selected tools for distinct jobs (§4).** Figma holds the reproduced systems and screens, and later the Liquorify designs. Storybook documents components in code. Chromatic holds visual baselines and reviews changes on pull requests.
6. **Propose WCAG 2.2 level AA as the accessibility target for Liquorify screens,** with automated checks in Storybook as a first, advisory signal. FB-15 sets the target. Automated checks find only part of what a manual review finds.

## 4. How each tool is used

Prices and plan limits were read on 2026-10-21 from the vendors' published pages and change often. Confirm them before buying.

| | Figma | Storybook | Chromatic |
|---|---|---|---|
| **Job** | First, a faithful copy of what exists: both design systems and the email branding as libraries with variables (FB-20), then every screen as a wireframe and a full reproduction, every flow as a prototype, and every email (FB-21). Afterward, designs for Liquorify screens and the brand values, built from those libraries | First, documentation of every existing component and token, with its variants and states (FB-19). Afterward, Liquorify-owned components beside the Spree ones | Accepted baselines for every story of the existing components (FB-19), then visual review of changes on pull requests, including the changes an upstream Spree update brings |
| **Where** | A Figma team owned by the owner: one library for the dashboard system, used by both the dashboard and the seller panel; one for the storefront; one for email branding; and screen files by surface | One Storybook per repository. The backend workspace's covers `@spree/dashboard-ui`, `@spree/dashboard-core` and the dashboard's and seller panel's components, with the React and Vite framework. The storefront's uses the Next.js and Vite framework, where server components are experimental and need mocked data | One Chromatic project per Storybook |
| **Cost** | The free Starter plan allows one team folder with 3 files and does not include libraries, variable modes, Dev Mode or Code Connect. The reproduction needs shared libraries and light and dark modes, so it needs Professional or above, which allows up to 10 modes per collection. Professional is charged per seat: a Full seat is €16 a month billed yearly or €20 monthly, a Dev seat €12 or €15 (Figma's published euro prices; check the dollar prices) | Free and open source. It costs development dependencies and CI minutes, which are free while the repositories are public | Free plan: 5,000 snapshots a month, with an unchanged snapshot under TurboSnap counting as a fifth; unlimited projects; Chrome only. Starter: $179 a month for 35,000, adding Safari, Firefox and Edge, with extra snapshots at $0.008. Chromatic offers free use to some open-source projects, by contacting it; the terms are not published |
| **Accounts** | Owner's Figma account and team (owner action OA-5) | None | A Chromatic account signed in with GitHub, and optionally Chromatic's GitHub app (owner action OA-4) |
| **CI secrets** | None at first. Automating Code Connect would need a Figma access token as a secret | None | One `CHROMATIC_PROJECT_TOKEN` repository secret per project. It is unavailable to pull requests from forks |
| **What it would expose** | Design files stay private to the team unless shared by link. The reproduction holds only Spree's public design and sample data; later files may hold unreleased brand and copy. Review Figma's content and AI settings before adding unreleased material | Stories are source code in public repositories, so they are public. Stories use invented sample data only, never real merchant or shopper data | The built Storybook and its snapshots are uploaded to Chromatic. A project linked to a public repository publishes a public Storybook; its tests, settings and project details stay private |
| **Effect on checks** | None | A Storybook build becomes a CI step | Advisory at first, not a required check. Making it required changes the rulesets, which is a Protected change |

**Snapshot budget.** A build costs about one snapshot per story, per browser, per viewport and per theme. Documenting every existing component at an average of two stories costs about 1,520 snapshots for the backend Storybook's 379 component files in light and dark, and about 400 for the storefront's 101 at mobile and desktop widths in light only, the only theme shoppers see: about 1,900 for one full build of both. That is under half the free plan's month, and Chromatic's pricing page does not say whether the allowance is shared between projects. With TurboSnap, a build in which little changed costs about a fifth, around 380, so after the first baselines the free plan covers roughly twelve such builds a month. A full rebuild, such as after an upstream Spree update, costs the full amount again.

Chromatic should therefore run only on pull requests that change components, stories or styles. Its check must then stay advisory: a required check from a workflow limited to some paths never reports on other pull requests, which then wait indefinitely (the conflict described under FB-02 in [LIQ-004](LIQ-004-foundation-backlog.md#recommended-next-work-item), item 3). **Budget, as decided (Q5).** Both projects are counted against one free allowance of 5,000 snapshots a month:

- Baselines are captured batch by batch, as each FB-19 pull request adds its stories, rather than all at once.
- TurboSnap is on, and Chromatic runs only when components, stories or styles change.
- The dashboard is captured at one desktop width in light and dark, and the storefront at a mobile and a desktop width in light only, because it never shows its dark values. These widths and themes are proposed in [LIQ-010 §8](LIQ-010-design-system-reproduction-architecture.md#8-themes-and-widths-captured), not part of the decision.
- Coverage is never reduced to fit. If a batch would exceed the month's allowance, it waits for the next month, and each pull request records the snapshots it used.
- A paid plan, or Chromatic's open-source offer, needs a separate owner decision.

**Sources:**

- [Figma's plans and features](https://help.figma.com/hc/en-us/articles/360040328273)
- [Figma's modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383)
- [Figma's seat prices](https://help.figma.com/hc/en-us/articles/27468498501527)
- [Figma Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect)
- [Chromatic's prices](https://www.chromatic.com/pricing)
- [Chromatic with GitHub Actions](https://www.chromatic.com/docs/github-actions)
- [Chromatic's Storybook visibility](https://www.chromatic.com/docs/collaborators)
- [Storybook for Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)

## 5. Options considered

**How Liquorify relates to Spree's systems:**

| Option | For | Against | Proposed |
|---|---|---|---|
| A. Adopt both systems as they are; extend through documented points; share brand values only | Reuses what exists (SES-001 §5.1, specification C4); keeps upstream updates simple; smallest change | Two component libraries stay, so a few primitives exist twice | **Yes** |
| B. Move the storefront onto `@spree/dashboard-ui` | One component library | Rewrites the upstream storefront and diverges from it; Base UI against Radix; the dashboard package is built for a client-rendered app, the storefront for server components | No |
| C. Build a new Liquorify design system for every surface | Full control | Duplicates two working systems and cuts Liquorify off from upstream improvements | No |
| D. Separate brand values per surface | No shared source to maintain | The brand drifts between the merchant's dashboard, the storefront and emails | No |

**When the tools copy Spree:**

| Option | For | Against | Proposed |
|---|---|---|---|
| E. Reproduce and document the whole Spree baseline before any Liquorify design | Liquorify design starts from complete, checked copies; gaps and upstream visual changes show up early; it is the owner's instruction | The largest piece of foundation work before any Liquorify screen; needs a paid Figma seat | **Yes** |
| F. Copy Spree parts only as Liquorify screens use them (version 0.1 of this record) | Less work up front | Liquorify designs would start from partial, unchecked copies, and parts never used by Liquorify would stay undocumented | No |

**Rationale.** Option A is what [SES-001 §5.1](framework/SES-001.md#51-product-and-design) and [ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc) ask for: reuse the existing design systems and document each extension. It keeps Spree releases easy to take in. Options B and C would replace working systems before any Liquorify screen exists to justify it. Option D saves little, because both systems already use the same token names. Option E makes "classify before building" ([ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc)) concrete for design: Liquorify can only say a screen extends Spree's when Spree's own screen is already on the canvas beside it.

## 6. Consequences

- **The Spree baseline comes first.** Liquorify product and design work waits until FB-18 is reviewed, FB-19 to FB-21 are done and the owner instructs it ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)).
- **The reproduction is large:** about 480 component files, 142 screens, 2 system pages and 12 overlays with their states, 27 emails and 24 flows. Its completion criteria are tied to the IDs in LIQ-008 and LIQ-009, so progress can be counted.
- **Upstream changes become visible.** When Liquorify takes a new Spree release (FB-12), Chromatic shows what changed visually, and the Figma libraries, screens and inventories are updated in the same change.
- **Spree's packages stay untouched** for Liquorify branding, so taking a new Spree release does not mean re-applying patches.
- **Brand consistency will come from shared values, not shared components.** Each brand change is applied in two token files and the email defaults (FB-14, deferred).
- **Accessibility and visual review start as signals, not gates.** They become required only by a separate Protected change to the rulesets.
- **Cost.** Storybook costs nothing, and the Chromatic free plan covers the first baselines with the limits in §4. The Figma reproduction needs one paid Professional Full seat (Q4, decided), bought only after the owner has seen the exact billing choice.
- **Public by default.** Stories, and Storybooks published from these repositories, are public. Design files are private.
- **Work items** ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)):
  - FB-19: every existing component in Storybook, with Chromatic baselines. Protected.
  - FB-20: both design systems and the email branding values as Figma libraries. Protected where it adds accounts or seats.
  - FB-21: every screen, state, wireframe, flow and email in Figma, built from FB-20's libraries.
  - FB-14 and FB-15 come after the baseline.

  Spree baselining starts FB-19 and FB-20: FB-18 reviewed, the owner's instruction, and the answers each needs from §7. FB-21 follows FB-20.

## 7. Open questions for the owner

### Decided on 2026-10-21

The owner decided these three so that FB-19 and FB-20 could start ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)). They are scoped to the baseline reproduction; the rest of this record stays PROPOSED.

| # | Question | Decision |
|---|---|---|
| Q4 | Figma plan, needed by FB-20 | One Figma Professional Full seat for authoring, reusing an existing suitable seat if one is available. Code Connect is deferred. The owner sees the exact billing choice before any purchase; preparation continues meanwhile. The owner's existing Full seat is on a plan Figma restricts to non-commercial use, so it is not treated as suitable for Liquorify's work ([LIQ-004](LIQ-004-foundation-backlog.md#owner-action-steps), OA-5) |
| Q5 | Chromatic plan and gating, needed by FB-19 | Chromatic's free plan, advisory only. Snapshots are budgeted across both Storybooks together, and the full coverage requirement stays. A paid plan needs a separate decision |
| Q7 | Storybook scope, needed by FB-19 | Every existing component in LIQ-009, including the dashboard's, the seller panel's and the storefront's, with mocked data and providers where needed. Every case Storybook cannot render is recorded explicitly |

### Still open

| # | Question | Proposed answer |
|---|---|---|
| Q1 | Accept option A, with the Spree baseline reproduced first (option E)? | Yes |
| Q2 | Whose brand appears where: Liquorify's in the merchant dashboard and the Admin Console, and the merchant's on the storefront and in shopper emails? | Decide with FB-14, after the baseline and the storefront hosting decision |
| Q3 | Accessibility target (FB-15) | WCAG 2.2 level AA for Liquorify screens |
| Q6 | The dashboard sign-in artwork cannot be replaced through a documented extension point. Request one upstream, or accept Spree's artwork for now? | Accept it for now, and record the request |
| Q8 | Order of the reproduction | FB-19 and FB-20's tokens together; each Figma component after its stories record its states; FB-21 once the libraries exist. The owner's instruction of 2026-10-21 follows this order |
| Q9 | Should FB-19 also record Storybook's automated accessibility results for the existing components, as findings only? | Yes, as a baseline measurement; the target and any gate stay with FB-15 |

## 8. Limitations

- **Reading only.** No tool was installed or tried, and no account, project or file was created.
- **Not checked.** Chromatic's open-source eligibility and whether its allowance is shared between projects; whether the storefront's Next.js 16 works with Storybook's framework in practice (Storybook 10.6.2 declares support for it); how much mocking the data-bound components need; Base UI's and Radix's accessibility claims.
- **Estimates.** The snapshot budget assumes two stories per component; the real count comes from FB-19.
- **Vendor terms** were read from the vendors' public pages on 2026-10-21 and were not confirmed with the vendors.
