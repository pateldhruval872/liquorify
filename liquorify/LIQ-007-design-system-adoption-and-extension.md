---
document_id: LIQ-007
title: Design System Adoption and Extension
version: 0.1
status: PROPOSED
owner: Dhruval (decision owner, as proposed in LIQ-001 §2)
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Design System Adoption and Extension

A decision record ([ENG-002 §6](framework/ENG-002-documentation-system.md#decision-record)) for FB-18 ([LIQ-004](LIQ-004-foundation-backlog.md#next-documentation-work-item)). **Status: PROPOSED.** Nothing in it is decided until the owner accepts it. Setting up any tool, account, dependency, CI step or credential is later work, in separate items that are Protected because they add dependencies, CI steps, accounts or credentials ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)).

## 1. Question

How does Liquorify adopt Spree's existing design systems, and extend them for its own screens and branding, without forking them? And how does it use the three tools the owner selected on 2026-10-21: Figma, Storybook and Chromatic?

**Affected scope:**

- the admin dashboard, which merchants and their staff use;
- the storefront, which shoppers use;
- the customer emails;
- the proposed Liquorify screens: sign-up, onboarding, subscription, the storefront holding page and the Admin Console (merchant lifecycle specification, F1 to F5).

The seller panel is out of scope while the marketplace is not needed ([LIQ-006 §8](LIQ-006-product-capability-baseline.md#8-marketplace-and-platform)).

## 2. Context: what exists and what is proposed

Read on 2026-10-21 at backend `1d1f2d4` and storefront `ac53c5b`, by reading only. Both repositories are public. Evidence codes R, U, C1, C2 and V2 have the meanings in [LIQ-006 §1](LIQ-006-product-capability-baseline.md#1-scope-revisions-and-evidence); everything without a code was read in the files named (R).

| Area | Exists in Spree today | Proposed Liquorify extension |
|---|---|---|
| Dashboard components | `@spree/dashboard-ui` 1.0.0-rc.4: 46 shadcn primitives on Base UI and 54 composed component files. They are headless: data arrives through props. The dashboard is the reference, and the seller panel reuses the package | None to the package for Liquorify-only needs. New Liquorify screens use its components; Liquorify-specific compositions live in a Liquorify dashboard plugin package (specification P3) |
| Dashboard extension points | `defineDashboardPlugin`, slots on detail pages, navigation and table registries, host-form binding (`@spree/dashboard-core`; `docs/developer/dashboard/customization/`) | Used as documented. A missing extension point is requested or added in an upstream-compatible way, not patched in place |
| Dashboard tokens and theming | CSS custom properties in `styles.css`, light and dark. Families: surfaces, brand, status, borders, sidebar, charts. Fonts and type scale are in `@theme inline`. Merchants restyle by overriding tokens below the stylesheet import, with no component forks (`theming.mdx`) | Liquorify brand values set as token overrides in the Liquorify host application |
| Dashboard brand marks | The host application owns the page title and favicon (`dashboard-starter/index.html`). The sign-in artwork is bundled in `@spree/dashboard` with no documented override | Liquorify's host application sets the title and favicon. Replacing the sign-in artwork needs an extension point (open question Q6) |
| Storefront components | shadcn "radix-nova" style on Radix: 21 primitives in `src/components/ui`, plus feature components | Liquorify storefront changes (F4's holding page, Liquorify branding) are made in the storefront repository's own components |
| Storefront tokens | CSS custom properties in `globals.css` with shadcn's token names, light and dark, Geist font; dark mode through `next-themes` | The same Liquorify brand values mapped onto these token names |
| Storefront store identity | Store name from the `NEXT_PUBLIC_STORE_NAME` build setting and the logo from a static file, so one deployment shows one store | Depends on the unresolved storefront hosting decision (one deployment per merchant, or one serving many) |
| Email branding | Liquid and MJML templates whose colours and font come from each store's `store.branding` preferences (`Spree::Stores::EmailBranding`); merchants edit templates in the dashboard | Reuse. Liquorify's own emails (verification, billing) follow the same rules |
| Text and languages | i18next in the dashboard; next-intl messages in 5 languages in the storefront, checked for parity (C1) | Liquorify copy goes through the same mechanisms, in every language Liquorify supports (undecided) |
| Component documentation | None. Spree's admin plan lists Storybook as an open question ("light visual docs … likely Phase 3, not a blocker") | Storybook (§4) |
| Visual review | None (LIQ-003 QV-08) | Chromatic (§4) |
| Design source | None in either repository; no Liquorify brand exists (PD-09) | Figma (§4) |
| Accessibility | Base UI and Radix aim for accessible primitives (their own published claims, not verified here). No target and no automated checks in either repository (PD-11, QV-09) | A target and checks, set by FB-15 (§3, decision 5) |
| Tests | Dashboard components are exercised through the dashboard's unit tests and 434 browser tests (V2); `dashboard-ui` has no tests of its own. The storefront has 14 component test files (C1) | Story-based checks added alongside, not instead (§4) |

**What the two systems share.** Tailwind 4, shadcn's token naming, neutral palettes in the oklch colour space, Lucide icons and the Geist font.

**Where they differ.** Base UI against Radix, separate packages, and no common token source. Sharing brand values across the two is therefore realistic. Sharing components is not.

## 3. Proposed decision

1. **Adopt both component systems as they are, and extend each only through its documented extension points.**
   - The dashboard keeps `@spree/dashboard-ui` and its rules from the backend `CLAUDE.md`.
   - The storefront keeps its own components.
   - Liquorify does not edit Spree's packages for Liquorify-only needs. A generic fix is made the way upstream would accept it, so Spree releases stay easy to take in (FB-12).
2. **Keep Liquorify-owned components out of Spree's packages.**
   - Dashboard compositions go in the Liquorify dashboard plugin package that the specification proposes (P3).
   - The Admin Console reuses `@spree/dashboard-ui` primitives in its own small interface (P3, F5).
   - Storefront components stay in the storefront repository.
3. **Use one set of Liquorify brand values, mapped onto each surface's existing tokens.**
   - The values are defined once and applied as overrides to the dashboard's tokens, the storefront's tokens and the Liquorify email defaults.
   - The tokens' names and structure stay Spree's.
   - Whether merchants' own brands replace Liquorify's on the storefront and in shopper emails is open (Q2). This decision prepares FB-14 and does not make it.
4. **Use the selected tools for distinct jobs, starting small.** Figma is where designs and brand values start. Storybook documents components in code. Chromatic reviews visual changes on pull requests (§4).
5. **Propose WCAG 2.2 level AA as the accessibility target for Liquorify screens,** with automated checks in Storybook as a first, advisory signal. FB-15 sets the target. Automated checks find only part of what a manual review finds.

## 4. How each tool is used

Prices were read on 2026-10-21 from the vendors' published pages and change often. Confirm them before buying.

| | Figma | Storybook | Chromatic |
|---|---|---|---|
| **Job** | Brand values (as Figma variables) and designs for new Liquorify screens, built from the existing components' names and states. Not a full copy of Spree's component libraries | Living documentation of the components Liquorify relies on: Liquorify-owned components first, then the Spree components a Liquorify screen uses, added as they are used | Visual review on pull requests: snapshots of each story, compared with an accepted baseline, with changes accepted or rejected in its interface |
| **Where** | A Figma team owned by the owner | One Storybook per repository. The backend workspace documents `@spree/dashboard-ui` as used and the Liquorify plugin, with the React and Vite framework. The storefront uses the Next.js and Vite framework, where server components are experimental and need mocked data | One Chromatic project per Storybook |
| **Cost** | Starter plan free, with limits. Professional is charged per seat: a Full seat is €16 a month billed yearly or €20 monthly, a Dev seat €12 or €15 (Figma's published euro prices; check the dollar prices). Code Connect, which links Figma components to code, needs Professional or above and a Full or Dev seat | Free and open source. It costs development dependencies and CI minutes, which are free while the repositories are public | Free plan: 5,000 snapshots a month, Chrome only. Starter: $179 a month for 35,000, adding Safari, Firefox and Edge. Chromatic offers free use to some open-source projects, by contacting it; the terms are not published |
| **Accounts** | Owner's Figma account and team | None | A Chromatic account signed in with GitHub, and optionally Chromatic's GitHub app |
| **CI secrets** | None at first. Automating Code Connect would need a Figma access token as a secret | None | One `CHROMATIC_PROJECT_TOKEN` repository secret per project. It is unavailable to pull requests from forks |
| **What it would expose** | Design files stay private to the team unless shared by link. They may hold unreleased brand and copy. Review Figma's content and AI settings before adding unreleased material | Stories are source code in public repositories, so they are public. Stories use invented sample data only, never real merchant or shopper data | The built Storybook and its snapshots are uploaded to Chromatic. A project linked to a public repository publishes a public Storybook; its tests, settings and project details stay private |
| **Effect on checks** | None | A Storybook build can become a CI step | Advisory at first, not a required check. Making it required changes the rulesets, which is a Protected change |

**Snapshot budget.** A build costs about one snapshot per story, per browser, per viewport and per theme. Dashboard components documented in light and dark at one viewport would cost about 400 snapshots a build if each of its roughly 100 components had two stories. The free plan would then cover about 12 full builds a month. Chromatic's TurboSnap bills unchanged stories at one fifth. Every backend pull request now runs CI, so Chromatic should run only on pull requests that change components or stories. Its check must then stay advisory: a required check from a workflow limited to some paths never reports on other pull requests, which then wait indefinitely (the conflict described under FB-02 in [LIQ-004](LIQ-004-foundation-backlog.md#recommended-next-work-item), item 3).

**Sources:**

- [Figma's seat prices](https://help.figma.com/hc/en-us/articles/27468498501527)
- [Figma Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect)
- [Chromatic's prices](https://www.chromatic.com/pricing)
- [Chromatic with GitHub Actions](https://www.chromatic.com/docs/github-actions)
- [Chromatic's Storybook visibility](https://www.chromatic.com/docs/collaborators)
- [Storybook for Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)

## 5. Options considered

| Option | For | Against | Proposed |
|---|---|---|---|
| A. Adopt both systems as they are; extend through documented points; share brand values only | Reuses what exists (SES-001 §5.1, specification C4); keeps upstream updates simple; smallest change | Two component libraries stay, so a few primitives exist twice | **Yes** |
| B. Move the storefront onto `@spree/dashboard-ui` | One component library | Rewrites the upstream storefront and diverges from it; Base UI against Radix; the dashboard package is built for a client-rendered app, the storefront for server components | No |
| C. Build a new Liquorify design system for every surface | Full control | Duplicates two working systems and cuts Liquorify off from upstream improvements | No |
| D. Separate brand values per surface | No shared source to maintain | The brand drifts between the merchant's dashboard, the storefront and emails | No |

**Rationale.** Option A is what [SES-001 §5.1](framework/SES-001.md#51-product-and-design) and [ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc) ask for: reuse the existing design systems and document each extension. It also keeps Spree releases easy to take in, and it costs nothing to start. Options B and C would replace working systems before any Liquorify screen exists to justify it. Option D saves little, because both systems already use the same token names.

## 6. Consequences

- **Spree's packages stay untouched** for Liquorify branding, so taking a new Spree release does not mean re-applying patches.
- **Brand consistency comes from shared values, not shared components.** Each brand change is applied in two token files and the email defaults.
- **Accessibility and visual review start as signals, not gates.** They become required only by a separate Protected change to the rulesets.
- **Cost starts at zero.** Figma Starter, Storybook and the Chromatic free plan cost nothing. Paid seats or snapshots are an owner decision when the free limits bind.
- **Public by default.** Stories, and Storybooks published from these repositories, are public. Design files are private.
- **Later work items, all Protected because they add dependencies, CI steps, accounts or credentials** ([LIQ-004](LIQ-004-foundation-backlog.md#p2-when-the-work-activates-them)):
  - FB-19: Storybook in the backend workspace and in the storefront, and a Chromatic project for each, with advisory CI steps and their secrets.
  - FB-20: the Figma team and the Liquorify brand values, kept as Figma variables and as a tracked token file.
  - FB-14: applying those values to the dashboard host application, the storefront and the email defaults.

  Each starts only once this record is accepted and the owner instructs it.

## 7. Open questions for the owner

| # | Question | Proposed answer |
|---|---|---|
| Q1 | Accept option A? | Yes |
| Q2 | Whose brand appears where: Liquorify's in the merchant dashboard and the Admin Console, and the merchant's on the storefront and in shopper emails? | Decide with FB-14, after the storefront hosting decision |
| Q3 | Accessibility target (FB-15) | WCAG 2.2 level AA for Liquorify screens |
| Q4 | Figma plan: start on Starter, or buy Professional seats now for Code Connect? | Start on Starter; revisit when components are mapped |
| Q5 | Chromatic plan and gating: start on the free plan, advisory only? | Yes |
| Q6 | The dashboard sign-in artwork cannot be replaced through a documented extension point. Request one upstream, or accept Spree's artwork for now? | Accept it for now, and record the request |
| Q7 | Storybook scope: Liquorify-owned components only, or also the Spree components Liquorify screens use? | Both, the Spree ones added as they are used |

## 8. Limitations

- **Reading only.** No tool was installed or tried, and no account, project or file was created.
- **Not checked.** The owner's Figma plan; Chromatic's open-source eligibility; whether the storefront's Next.js 16 works with Storybook's framework; Base UI's and Radix's accessibility claims.
- **Vendor terms** were read from the vendors' public pages on 2026-10-21 and were not confirmed with the vendors.
