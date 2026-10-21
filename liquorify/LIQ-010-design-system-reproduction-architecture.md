---
document_id: LIQ-010
title: Design System Reproduction Architecture
version: 0.1-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Design System Reproduction Architecture

The implementation plan for reproducing Spree's design systems in Storybook, Chromatic and Figma: FB-19 and FB-20 now, and the libraries FB-21 builds on later ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)). It is linked from the decision record [LIQ-007](LIQ-007-design-system-adoption-and-extension.md), which it does not change. The owner asked for it on 2026-10-21, before coverage grows past a pilot ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)).

It has two parts, kept apart on purpose:

- **Part A (§2 to §5) is what Spree already has**, read at backend `1d1f2d4` and storefront `ac53c5b`, the revisions LIQ-008 and LIQ-009 pin. It is fact, with the files named.
- **Part B (§6 to §14) is the proposed tooling around it.** Nothing in Part B is decided. Each arrangement is tried in the pilot (§13), and this plan is corrected before coverage grows.

## 1. Status of the decisions this plan relies on

| Kind | Items | Where |
|---|---|---|
| Decided by the owner on 2026-10-21 | Q4: one Figma Professional Full seat, Code Connect deferred, billing shown before any purchase. Q5: Chromatic's free plan, advisory only, one snapshot budget across both Storybooks, full coverage kept. Q7: every component in LIQ-009, with mocked data and providers, and every case that cannot be rendered recorded | [LIQ-007 §7](LIQ-007-design-system-adoption-and-extension.md#decided-on-2026-10-21) |
| Instructed by the owner on 2026-10-21 | Reproduce the Spree baseline first; implement FB-19 through manageable pull requests; prepare FB-20's tokens alongside; make this architecture explicit and validate it with a small batch from both systems first; keep Spree's look and behaviour; Liquorify branding and features stay deferred | [LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work) |
| Still open, and not assumed here | Q1 (adopt option A), Q2 (whose brand where), Q3 (accessibility target), Q6 (sign-in artwork), Q8 (order of the reproduction, which the instruction above follows), Q9 (record accessibility results as findings) | [LIQ-007 §7](LIQ-007-design-system-adoption-and-extension.md#still-open) |
| Proposed in this plan | Everything in Part B | This document |

Because Q9 is open, the pilot does not add Storybook's accessibility addon. It is added only if the owner answers Q9.

# Part A: the existing Spree architecture

## 2. The dashboard design system and its consumers

### 2.1 Layers and package boundaries

Four packages in the backend workspace, each depending only on the ones above it in this table.

| Layer | Package | What it holds | Inventory IDs |
|---|---|---|---|
| Design system | `@spree/dashboard-ui` 1.0.0-rc.4, `packages/dashboard-ui` | `src/ui/`: 46 primitives, 22 on Base UI. `src/spree/`: 54 composed components. `src/hooks/`, `src/lib/`, `src/styles.css`. It also exports `ThemeProvider`, `TooltipProvider` and `ConfirmProvider` | CMP-DUI-P, CMP-DUI-C, TK-DUI |
| Framework | `@spree/dashboard-core`, `packages/dashboard-core` | Providers (`auth-provider`, `permission-provider`, `store-provider`, `tenant-provider`, `sticky-header-provider`), registries (navigation, tables, slots, settings navigation), the API client registry (`setApiClient`), the shared `queryClient`, i18next set-up (`lib/i18n.ts`), 39 components, 3 shared pages, 9 product form modules, `defineDashboardPlugin`, and a Vite plugin | CMP-CORE |
| Admin dashboard | `@spree/dashboard`, `packages/dashboard` | Routes, 200 components in 24 groups (`src/components/spree/`), data hooks, form schemas, locales, the `Dashboard` shell | CMP-DA-G |
| Seller panel | `@spree/seller-dashboard`, `packages/seller-dashboard` | Routes, 28 components, its own Seller API client, the `SellerDashboard` shell | CMP-SP-G |

The two starters (`packages/dashboard-starter`, `packages/seller-dashboard-starter`) are host applications: each mounts its shell, adds plugins and imports the stylesheet.

**Exports.** `@spree/dashboard-ui` publishes its source with no build step: `./ui/*` maps to `src/ui/*.tsx` and `./spree/*` to `src/spree/*.tsx`, so a consumer compiles it with its own Vite and Tailwind. `@spree/dashboard-core` exports its source too, except the Vite plugin, which is built. `@spree/dashboard` exports its shell, its stylesheet, its Vite plugin and five individual files; its 200 components are not exported.

**Toolchain.** Vite 8, `@vitejs/plugin-react` 6, TypeScript 7 (the native compiler), Tailwind 4, Biome, Vitest 5, React 19.3, TanStack Router and Query, react-hook-form, i18next. The workspace requires a package version to be two days old before it installs (`minimumReleaseAge: 2880`), refuses unusual dependency sources and trust downgrades, and pins some packages, including Base UI 1.8.0, through overrides (`pnpm-workspace.yaml`). Turbo runs `lint`, `typecheck`, `test` and `build` for every package, and the Packages workflow runs all four on every pull request.

### 2.2 What "headless" means in practice

The backend `CLAUDE.md` says the design system's components take data through props and import no providers or hooks. That holds for data. It does not mean a component renders with no context at all:

- 32 of the design system's files call `useTranslation` from `react-i18next`, including 5 primitives (`badge`, `date-range-picker`, `media-preview`, `pagination`, `rich-text-editor`).
- 2 need TanStack Router's context (`back-button`, `json-value-view`).
- 8 use `react-hook-form`'s context.
- Overlays, tooltips and confirmations need `TooltipProvider` and `ConfirmProvider`, and Base UI renders popups into a portal.

### 2.3 Providers and start-up

**Admin dashboard** (`packages/dashboard/src/dashboard.tsx`): `QueryClientProvider` (the shared `queryClient`), then `ThemeProvider`, `AuthProvider`, `PermissionProvider`, `TooltipProvider`, `ConfirmProvider` and `RouterProvider`. Importing the package first runs its set-up modules, which register the Admin API client, the i18next bundles, the navigation entries and the search providers.

**Seller panel** (`packages/seller-dashboard/src/seller-dashboard.tsx`): the same providers in a different order (`QueryClientProvider`, `ThemeProvider`, `TooltipProvider`, `ConfirmProvider`, `AuthProvider`, `PermissionProvider`, `RouterProvider`), with the Seller API client registered through the same `setApiClient` registry. Only one client is registered at a time.

What each provider needs:

- **API client.** The Admin client is created with `baseUrl: import.meta.env.VITE_SPREE_API_URL || ''`, so in development and tests it sends same-origin requests to `/api/v3/admin/…`. The Seller client also uses relative addresses by default.
- **Signing in.** `AuthProvider` starts by refreshing the session through the API and holds the signed-in user. `PermissionProvider` loads the user's permissions with a query; components hide write controls without them.
- **Store.** `StoreProvider` loads the current store through the API (`adminClient.store.get()`); date pickers read the store's time zone from it.
- **Translations.** `lib/i18n.ts` starts i18next with the core English bundle; each application adds its own. The chosen language is kept in local storage (`spree-admin-locale`). There are 7 language files.
- **Theme.** `ThemeProvider` reads light, dark or system from local storage and the operating system's setting, and adds or removes the `dark` class on the root element.

### 2.4 Styling and tokens

- **One stylesheet.** `@spree/dashboard-ui/styles.css` imports Tailwind, `tw-animate-css`, shadcn's Tailwind layer, the Geist fonts and `flag-icons`, and tells Tailwind to scan its own `ui/` and `spree/` folders. The admin dashboard's and seller panel's stylesheets only import it. Their Vite plugins add Tailwind scan paths for `dashboard-core` and installed plugins when they build.
- **Dark mode** is a variant tied to the `.dark` class (`@custom-variant dark (&:is(.dark *))`).
- **Token blocks.** `:root` holds 60 light values and `.dark` 56 dark values, plus 2 more of each in a second pair of blocks inside `@layer base`. `@theme inline` holds 84 entries that turn tokens into Tailwind utilities. LIQ-009 §6 lists all 146 (TK-DUI, TK-DUI-T, TK-DUI-A).
- **Value forms**, which decide how each token maps to Figma (§9):

  | Form | `:root` | `.dark` | `@theme inline` | Example |
  |---|---|---|---|---|
  | oklch colour | 23 + 2 | 24 + 2 | — | `oklch(0.5967 0.2212 258)` |
  | Reference to another token | 20 | 16 | 58 | `var(--border)` |
  | Reference to Tailwind's palette | 12 | 12 | — | `var(--color-amber-100)` |
  | Colour mix | 4 | 4 | — | `color-mix(in srgb, var(--border-base) 70%, transparent)` |
  | Length | 1 | — | 16 | `0.8125rem` |
  | Font stack, shadow, easing curve | — | — | 10 | `cubic-bezier(0.23, 1, 0.32, 1)` |

- **Restyling** is done by overriding tokens below the stylesheet import, without forking components (`docs/developer/dashboard/customization/theming.mdx`).

## 3. The storefront

### 3.1 Layers

The storefront is one Next.js 16 application (React 19, next-intl 4, Tailwind 4 through PostCSS, `@spree/sdk` 2.0.0-rc.3, Vitest 4, pnpm 10), in its own repository. It is deliberately its own pnpm workspace root, so it never joins the backend's.

| Layer | Where | What it holds | Inventory IDs |
|---|---|---|---|
| Primitives | `src/components/ui/` | 22 shadcn components on Radix | CMP-SF-P |
| Feature components | `src/components/<group>/` | 66 components in 12 groups | CMP-SF-G |
| Page-level components | Beside their pages in `src/app/` | 13 | CMP-SF-PG |
| Contexts | `src/contexts/` | `StoreContext`, `AuthContext`, `CartContext`, `CheckoutContext`, `HiddenPricingContext` | — |
| Data | `src/lib/data/` | 17 server action modules (`"use server"`) that call the Store API through `@spree/sdk` | — |
| API client and session | `src/lib/spree/` | The SDK client, created from `SPREE_API_URL` and `SPREE_PUBLISHABLE_KEY`; cookies and token refresh | — |
| Languages and markets | `src/i18n/`, `messages/` | next-intl routing, 5 languages, market lookup | — |

Components import through the `@/` alias. 58 of the 88 component files are client components. The other 30 have no `"use client"` line, so they run on the server or wherever they are imported, and some of them are `async` (for example `HeroSection`, which calls `getTranslations` from `next-intl/server`).

### 3.2 Providers and data

The `[country]/[locale]` layout wraps every page in `DocumentShell` (the `html` element and the Geist font variable), then `NextIntlClientProvider`, `StoreProvider`, `AuthProvider` and `CartProvider`. It renders `CartDrawer` and the toast container beside the page.

**Components never call the Store API themselves.** From the SDK they import only types and money helpers. Contexts and components call the server actions in `src/lib/data/`, which run on the server with the API key from the environment. Only the payment fields talk to their providers from the browser. Components also use Next.js modules: `next-intl` (41 imports), `next/link` (16), `next/navigation` (9), `next-intl/server` (9), `next/image` (5), `next/dynamic` (5), `next/font` (1) and `next-themes` (1).

### 3.3 Styling, and a correction: the storefront never shows dark mode

`src/app/globals.css` declares 32 light and 31 dark values, a `.dark` variant and 58 theme entries (LIQ-009 §7). Its value forms are simpler than the dashboard's: 62 oklch colours, 1 length, 33 references, 11 hexadecimal palette values, 6 `calc()` radius values and 8 animation shorthands.

**Nothing in the storefront ever adds the `dark` class.** No theme provider is mounted, and no code sets the class. Its primitives carry `dark:` styles and its stylesheet declares dark values, but shoppers always see the light theme. Two things do follow the operating system's dark setting:

- the toast container, which passes `useTheme()` from `next-themes` to the toast library and, with no provider, falls back to "system";
- the focus outline, which turns white under `prefers-color-scheme: dark` while the page stays light.

LIQ-007 §2 said dark mode works "through `next-themes`", and LIQ-009 §1 said both systems switch themes with a `.dark` class. Both are corrected in the same change as this plan. What follows for the reproduction is in §8.

### 3.4 Colours used outside the tokens

Both systems also colour components with Tailwind's own palette classes, such as `text-gray-900` in the storefront's `HeroSection`:

- **Dashboard:** 48 distinct palette colours, counting those the tokens refer to (20) and those used in class names across 31 files.
- **Storefront:** 42 distinct palette colours in class names across 83 files, plus white and black, and one fixed colour (`rgba(114,114,114,0.9)`).

LIQ-009 lists only the custom properties the stylesheets declare, so these colours have no IDs yet. Figma needs them as variables, or FB-21's rule of "no raw colour values" cannot hold. The token preparation adds them to LIQ-009 with IDs (§9).

## 4. Emails

Emails are Liquid and MJML templates, coloured by each store's branding values (TK-EM-01 to TK-EM-06) and previewed by Spree's own mailer previews. They have no React components, so FB-19 leaves them out. FB-20 reproduces their branding values as Figma variables, and FB-21 reproduces each email.

## 5. What Part A means for the reproduction

1. **Spree's packages must stay untouched** (LIQ-007 §3), so stories, mocks and configuration live outside them.
2. **The admin dashboard's components are not exported,** so stories reach them by source path, not by package name.
3. **Every story needs translations,** even for some primitives; some also need a router, a form or the confirmation provider.
4. **Data-bound dashboard components call the API with same-origin URLs** through one registered client, so they can be served invented data by intercepting requests in the browser.
5. **Storefront components get their data from server actions,** which cannot run in Storybook, so those modules are replaced, not the network.
6. **Tokens come in six value forms,** and Figma variables hold only plain values and references, so each form needs a mapping rule.
7. **The storefront shows only its light theme,** with two small exceptions that follow the operating system.
8. **Some colours sit outside the tokens,** in Tailwind's palette.
9. **The backend workspace accepts only two-day-old versions.** Storybook 10.6.3 was published on 2026-10-20, so until 2026-10-22 the newest version it accepts is 10.6.2.

# Part B: proposed tooling arrangement

## 6. Where things live

| What | Proposed place | Why |
|---|---|---|
| The backend's Storybook | A new private workspace package, `packages/liquorify-storybook` (`@liquorify/storybook`), using Storybook's React and Vite framework, with Tailwind's Vite plugin | One Storybook for all four dashboard packages, as LIQ-007 §4 proposes, without editing Spree's packages. Upstream never touches the folder, so merging a new Spree release cannot conflict in it |
| The storefront's Storybook | `.storybook/` for configuration and `stories/` for everything else, in the storefront repository, using Storybook's Next.js and Vite framework | The storefront is a single package. Keeping stories out of `src/` keeps them out of the application's folders, and the Next.js build never imports them |
| Token files | Beside each Storybook: `packages/liquorify-storybook/tokens/` and the storefront's `stories/tokens/` | Generated from the stylesheet in the same repository, so each repository can check its own |
| Chromatic set-up | `chromatic.config.json` beside each Storybook, and a workflow `.github/workflows/storybook.yml` in each repository | Liquorify-owned files, separate from Spree's workflows |

**Options considered for the backend.** A `.storybook/` inside each Spree package was rejected: it edits Spree's packages and their dependency lists, and gives four Storybooks and four Chromatic projects. The starter application was rejected as a home: it is the template Spree publishes, and its build composes routes as a side effect.

**What the new package costs.** Its development dependencies change `pnpm-lock.yaml`, so each upstream Spree release that changes the lockfile needs it regenerated (FB-12). The Packages workflow lints, type-checks and tests the new package with the others, so a story that stops compiling after an upstream change fails a required check. That is the intended early signal. The package has no `build` script, so the Packages workflow never builds Storybook; Storybook builds only in the new advisory workflow, under the scripts `storybook` and `build-storybook`.

## 7. Stories, providers and mocks

### 7.1 Folder layout

```
packages/liquorify-storybook/          storefront repository
  .storybook/  main.ts, preview.tsx      .storybook/  main.ts, preview.tsx
  src/                                   stories/
    decorators/                            decorators/
    mocks/handlers/{admin,seller}/         mocks/        replaced server action modules
    fixtures/{admin,seller}/               fixtures/
    stories/                               ui/           CMP-SF-P
      dashboard-ui/ui/       CMP-DUI-P     <group>/      CMP-SF-G
      dashboard-ui/spree/    CMP-DUI-C     pages/        CMP-SF-PG
      dashboard-core/        CMP-CORE      tokens/       TK-SF
      dashboard/<group>/     CMP-DA-G
      seller-dashboard/<group>/ CMP-SP-G
      tokens/                TK-DUI
  tokens/       generated token files
  scripts/      token extraction, coverage report
```

Story titles follow the same path, so the Storybook sidebar reads like LIQ-009: "Dashboard UI / Primitives / Button", "Admin dashboard / API keys / API key table", "Storefront / Cart / Cart drawer".

### 7.2 Dashboard decorators

Stories use Spree's real providers wherever they can run, with the network mocked, rather than hand-written stand-ins. A stand-in is used only where a real provider cannot run, and each one is listed in the pilot's record.

| Level | Applied to | What it provides |
|---|---|---|
| Every story | All dashboard stories | i18next with the core and application English bundles, fixed to English; `ThemeProvider` driven by Storybook's theme setting; `TooltipProvider` and `ConfirmProvider` |
| On request | Stories that declare it | A memory router (TanStack Router with in-memory history) at a route the story names; a react-hook-form `FormProvider` with the story's values |
| Data | Framework, dashboard and seller panel stories | A new `QueryClient` per story, so no cached data leaks between stories; the Admin or Seller client registered for the story, since only one is registered at a time; `AuthProvider`, `PermissionProvider` and `StoreProvider` reading invented data through the mocked API |

### 7.3 Dashboard mocks and fixtures

- **Requests are intercepted in the browser** with Mock Service Worker, the library the SDK packages already test with, through its Storybook addon. Each story lists the handlers it needs.
- **Handlers are grouped by API resource** (`mocks/handlers/admin/api-keys.ts`), with responses in the API's own `{ data, meta }` shape and Stripe-style prefixed IDs.
- **Fixtures are invented**, in the style of Spree's sample catalog, and never contain real merchant or shopper data or anything that looks like a real credential.
- **Fixtures are checked against the SDKs' schemas.** A unit test parses each fixture with the matching schema from `@spree/admin-sdk/zod` or `@spree/seller-sdk/zod`, so a mock that drifts from the API fails the Packages workflow.
- **Permission sets.** Each data story can run with full permissions or read-only, which reproduces LIQ-008's "without write permission" state.

### 7.4 Storefront decorators and mocks

- **Every story** gets `NextIntlClientProvider` with the English messages, and Storybook's Next.js framework supplies its own stand-ins for `next/navigation`, `next/link`, `next/image` and request headers.
- **Server actions are replaced, module by module.** Storybook's module mocking (`sb.mock`) swaps each `src/lib/data/*.ts` module for one returning fixtures, so the real `StoreProvider`, `AuthProvider` and `CartProvider` can run on top. Fixtures are checked against `@spree/sdk/zod`.
- **Server components** are rendered with the framework's experimental support for them, with `next-intl/server` replaced the same way. A server component that cannot render is recorded (§7.5).
- **Third-party scripts** (Stripe and Adyen payment fields, Google Tag Manager, Vercel analytics) are never loaded. The components that embed them are recorded with what is shown in their place.

### 7.5 Cases that cannot be rendered

Each one is recorded against its component ID in LIQ-009, in the coverage column (§10), with one of these reasons:

| Code | Reason |
|---|---|
| U1 | Only ever rendered inside its parent; covered by the parent's story, which is named |
| U2 | Needs server behaviour that Storybook cannot run, even with mocks |
| U3 | Needs a browser setting Chromatic cannot emulate, such as the operating system's dark preference |
| U4 | Embeds a third-party script or frame that must not load in a story |
| U5 | Needs a full route or real navigation, and is covered by its screen in FB-21 instead |

## 8. Themes and widths captured

| Surface | Themes | Widths |
|---|---|---|
| Dashboard design system, framework, admin dashboard, seller panel | Light and dark | One desktop width, 1280 pixels |
| Storefront | Light only, because shoppers never see the dark theme (§3.3) | 390 and 1280 pixels |

The storefront's dark values are still reproduced in full: on the token pages and as a Figma mode named "Dark (declared, not shown)". The toast container's dark look is captured by setting the toast's own theme in its story. The white focus outline under the operating system's dark setting is recorded as U3, since Chromatic documents no way to emulate that setting.

## 9. Token preparation and the CSS-to-Figma mapping

### 9.1 Extraction and checking

- **One script extracts tokens from a stylesheet.** It uses only Node, removes CSS comments first, and records each token's name, block, light and dark values, value form, LIQ-009 ID and source line.
- **It writes one file per system:** the dashboard's tokens, the storefront's tokens and the email branding defaults, read from `spree/core/app/models/spree/emails/branding.rb`.
- **The format follows the Design Tokens Community Group format** (`$value`, `$type`, `$description`), with Liquorify's own fields (the ID, the source, the value form and how a derived value was computed) under `$extensions`. Light and dark are modes within the dashboard and storefront files; the email file has one.
- **The storefront keeps a copy of the script,** unchanged, because the two repositories share no code. Each batch's record compares the two copies.
- **IDs come from LIQ-009, not from the order of the file.** LIQ-009 lives only in the backend, so a small generated list of IDs and names sits beside each repository's stories and token files, and is updated in the same change as LIQ-009. The storefront's copy holds only its own IDs.
- **A check mode** regenerates the token file and fails if it differs, if the stylesheet has a token the ID list lacks, or if the list names a token the stylesheet no longer has. It runs in each repository's Storybook workflow.
- **Palette colours** (§3.4) are resolved from Tailwind's own theme file at the installed version, and listed with the colours the token files reference and the component class names use. LIQ-009 gives them IDs in the same change: TK-TW-D for the dashboard and TK-TW-S for the storefront.

### 9.2 Mapping rules

| CSS value form | Figma | Recorded as |
|---|---|---|
| oklch colour | A colour variable, converted to sRGB with the CSS Color 4 formulas; transparency kept | The original oklch value in the description. A value outside sRGB is clipped, and the size of the clip is recorded. The Chromatic comparison in FB-20 decides whether that is visible |
| Reference to another token, or to Tailwind's palette | An alias to that variable | — |
| Colour mix | A colour variable holding the computed value, per mode | "Derived", with the formula in the description. Figma has no colour mixing, so the generator recomputes it whenever an input changes |
| `calc()` of a length | A number variable holding the computed value | "Derived", with the formula |
| Length in rem | A number variable in pixels, at 16 pixels to the rem | The rem value in the description |
| Font stack | A text variable, and text styles for the type scale | — |
| Shadow | An effect style | — |
| Easing curve or animation shorthand | Not a Figma variable; listed on the token page and in the description of the components that animate | Recorded as "not representable" |
| Colour utility alias (TK-DUI-A, TK-SF-A) | An alias variable, hidden from publishing so designers see only the semantic ones | — |

### 9.3 Figma collections and names

- **Collections.** "Dashboard" (modes: Light, Dark), "Storefront" (Light; Dark, declared, not shown), "Email branding" (Default), and one "Tailwind palette" collection per system holding only the colours each uses.
- **Names.** A variable takes the CSS name without its leading dashes, in a group named after its LIQ-009 family: `Brand/brand-blue`. FB-20's completion criterion asks for the same names, and the group is only a folder.
- **Code syntax.** Each variable's web code syntax is `var(--brand-blue)`, so Figma's inspect panel shows the real token.
- **Description.** The token's ID and source, for example `TK-DUI-001 · packages/dashboard-ui/src/styles.css`.
- **Import.** Figma's own variable import was not confirmed to read this format. The proposed route is Figma's plugin interface, through the Figma connection this session has, reading the token files. It is confirmed once the seat exists (OA-5).

## 10. Traceability to the inventory IDs

- **Stories carry their IDs as tags**, for example `tags: ['CMP-DUI-P-07']`. Tags appear in the built Storybook's index, so a script can count them. A story for a component in a group (CMP-DA-G, CMP-SP-G, CMP-SF-G) carries the group's ID and names the file in its title.
- **Story names are the states**, such as "Default", "Disabled", "Loading", "Empty", "Error", "Read-only" and "Open". The list of stories for an ID is therefore the list of states FB-20 turns into Figma component properties.
- **A coverage report** reads the built index, compares it with the repository's ID list (§9.1) and the recorded reasons (§7.5), and lists every ID with a story, a reason, or neither. It runs in the Storybook workflow and its output goes into each batch's record.
- **LIQ-009 gains two columns:** "Storybook", with the story's title or a reason code, and "Figma", filled in by FB-20. LIQ-008 gains a "Figma" column for FB-21.
- **Chromatic** names each snapshot after its story, so a baseline traces to the same ID.
- **Figma components** take the code's name, list their states as variant properties, and carry the ID, the source path and the story's title in their description. Code Connect is deferred (Q4), so the link is by name and description only.
- **FB-21's frames** are named with their screen IDs, as LIQ-004 already requires.

## 11. Chromatic set-up and snapshot budget

- **Two projects,** one per Storybook, on the free plan (Q5). Their tokens go in each repository's secrets (OA-4). The project ID can be committed; the token never is.
- **The workflow** runs on pull requests that change stories, mocks, Storybook configuration, the components or stylesheets they cover, or the lockfile. It builds Storybook, runs the token check and the coverage report, and then runs Chromatic. Actions are pinned to full commit identifiers, as the security audit workflow already does.
- **Chromatic only reports.** It runs with TurboSnap (`onlyChanged`), and visual changes do not fail the run (`exitZeroOnChanges`). It is not a required check (Q5), and because it runs only for some paths it must not become one (LIQ-007 §4).
- **Without the token,** as before OA-4 and always on pull requests from forks, the Chromatic step is skipped and says so, and the build still runs.
- **Baselines reach `main` through Git history.** Both repositories merge pull requests with merge commits, so Chromatic should carry a pull request's accepted snapshots to `main` without a separate run. The pilot checks this. If it does not hold, a TurboSnap run on `main` is added and its cost recorded.
- **Budget**, one allowance of 5,000 snapshots a month for both projects (Q5). At about two stories per component, the first complete baselines cost about 1,520 for the backend (379 files, two themes) and about 400 for the storefront (101 files, two widths, light only): about 1,900, under half the month. Each batch records the snapshots it used, and a batch that would pass the month's allowance waits for the next month. Coverage is never cut to fit.

## 12. Update and verification workflow

### 12.1 Each batch

1. **Before the pull request:** stories render; lint, type check and fixture tests pass; the token check and coverage report run.
2. **In the pull request:** the Storybook workflow builds and reports coverage. Once OA-4 is done, Chromatic captures the batch and the owner accepts its baselines.
3. **Fidelity.** Each story is compared with the same component in its screen in the running dashboard or storefront, where a running instance at the pinned revisions is available (FB-04, or the dashboard's browser-test set-up); otherwise the comparison is NOT_RUN and recorded. A difference is a defect in the story, its providers or its mocks, never a reason to change the component.
4. **A verification record** in `liquorify/verification/` lists what was built, the revision, the coverage report, the snapshots used, the results (PASS, FAIL, BLOCKED, NOT_RUN) and the limits.

### 12.2 When Liquorify takes a new Spree or storefront release (FB-12)

1. Re-run the inventory checks (routes, component files, tokens) against the new revision, and record new and removed IDs in LIQ-008 and LIQ-009.
2. Regenerate the token files. Their difference is the list of token changes, and the Figma variables are updated from it in the same change.
3. Build Storybook. A story that no longer compiles shows an interface change; the story is fixed, never the component.
4. Run the fixture tests. A failure shows an API change; the fixtures are updated.
5. Run Chromatic. Each visual change is reviewed; a change that comes from Spree's code is accepted, because the code is the source.
6. Give every new component its stories and every new token its variable in the same change.
7. Write a verification record for the update.

## 13. Pilot

A small batch from each system, chosen to try every arrangement above once before coverage grows. The pilot passes when each case renders as it does in its screen, both Storybooks build in CI, and the token check and coverage report run. Whatever does not work is recorded and this plan is corrected before any further batch.

| System | Case | Component | ID | What it tries |
|---|---|---|---|---|
| Dashboard | Primitive, styled HTML | `button` | CMP-DUI-P-07 | The stylesheet, Tailwind's scan paths, light and dark |
| Dashboard | Primitive with a Base UI popup | `select` | CMP-DUI-P-35 | Portals, and capturing an open state |
| Dashboard | Primitive that needs translations | `pagination` | CMP-DUI-P-29 | The translation decorator |
| Dashboard | Composed component that needs a router | `back-button` | CMP-DUI-C-03 | The memory router |
| Dashboard | Framework component that loads data | `country-combobox` | CMP-CORE-06 | Client registration, a fresh query client, mocked requests, fixture checks |
| Dashboard | Admin dashboard component | `api-key-table` (`api-keys/`) | CMP-DA-G-01 | Importing by source path, the permission catalog through the mocked API, empty and populated states |
| Dashboard | Seller panel component | `balance-summary` (`finance/`) | CMP-SP-G-01 | The Seller client, money formatting |
| Dashboard | Token pages | All dashboard tokens | TK-DUI, TK-DUI-T, TK-DUI-A | The extracted file, the check and live values |
| Storefront | Primitive | `button` | CMP-SF-P-04 | The stylesheet and both widths |
| Storefront | Client component with context and server actions | `CartDrawer` (`cart/`) | CMP-SF-G-03 | Module mocking, the real cart context, translations |
| Storefront | Server component | `HeroSection` (`home/`) | CMP-SF-G-05 | Experimental server component support and `next-intl/server` |
| Storefront | Token pages | All storefront tokens | TK-SF, TK-SF-T, TK-SF-A | The copied script and the check |

**After the pilot,** coverage grows in batches by LIQ-009 section, each small enough to review and within the month's snapshot allowance:

1. Dashboard design system primitives (46).
2. Dashboard design system composed components (54).
3. Framework components, shared pages and product form modules (51).
4. Admin dashboard groups (200 files), in about four batches.
5. Seller panel (28).
6. Storefront primitives (22).
7. Storefront feature components (66), in two batches.
8. Storefront page-level components (13).

FB-20's Figma components follow each batch's recorded states, once the seat exists.

## 14. External-tool blockers

Recorded separately from the repository work, which continues without them.

| # | Blocker | Effect | Clears when |
|---|---|---|---|
| EB-1 | No Chromatic account, projects or tokens (OA-4) | The Chromatic step skips; no baselines; FB-19 criterion 5 stays BLOCKED | The owner finishes OA-4 |
| EB-2 | No suitable Figma seat. The existing Full seat is on a plan Figma restricts to non-commercial use (OA-5) | No variables, styles or components in Figma; the token files wait for import | The owner buys the seat after seeing the billing choice (Q4) |
| EB-3 | Storybook's support for server components is experimental | Some storefront server components may not render | The pilot shows which; the rest are recorded as U2 |
| EB-4 | Chromatic documents no way to emulate the operating system's dark setting | The storefront's focus outline under that setting cannot be captured | Recorded as U3 |
| EB-5 | Figma's own variable import is not confirmed to read the token format | The import uses Figma's plugin interface instead | Checked once the seat exists |
| EB-6 | Chromatic's pricing page does not say whether the free allowance is per account or per project | The budget assumes one shared allowance, the stricter reading | Chromatic's answer, or the first month's usage |
| EB-7 | The backend's two-day rule holds back the newest Storybook release, 10.6.3, until 2026-10-22 | The pilot uses the newest version the rule accepts, and records it | Not a blocker; recorded so an install refusal is not mistaken for a fault |

## 15. How the framework applies

SES-001, ENG-001 and ENG-002 apply to this work, as the owner adopted them on 2026-10-21 (decision D1).

- **Capabilities** ([SES-001 §3](framework/SES-001.md#3-capability-catalog)):
  - Design System Engineering (PD-13) and Visual Interface Design (PD-09) for the reproductions.
  - Visual Regression Verification (QV-08) for Chromatic.
  - Accessible and Inclusive Product Design (PD-11) and Accessibility Verification (QV-09) are not measured yet, because Q3 and Q9 are open.
- **Work items.** FB-19 and FB-20 carry ENG-001's fields in [LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items): outcome, scope, completion criteria tied to the IDs, dependencies and risk. Both are Protected where they add dependencies, CI steps, accounts or seats.
- **Stages** ([ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc)). This plan is "design and plan". The pilot and each batch are "implement and integrate", then "verify and review".
- **Evidence** ([ENG-002 §6](framework/ENG-002-documentation-system.md#verification-record)). Each batch ends with a verification record. Controls are described by their state ([SES-001 §4](framework/SES-001.md#4-assess-only-what-the-decision-needs)): the Chromatic step is "Configured" when its workflow exists and "Verified" only after a real run with baselines.
- **Not applied, and why:**
  - **Independent review.** The owner is the only reviewer, and automated review is labelled as such ([LIQ-001 §2](LIQ-001-project-profile.md)).
  - **The release and operation stages.** Nothing is deployed. A Storybook that Chromatic publishes is a development artifact, not a release.
  - **Spree's plan folder and plan commands.** Liquorify plans live in `liquorify/` (exceptions X1 and X4 in [LIQ-001 §6.3](LIQ-001-project-profile.md#63-conflicts-and-exceptions)).

## 16. Limitations

- **Reading only.** Part A was read from the files, and nothing in Part B has run yet. The pilot is the first test of it.
- **Counts** of palette colours were found by searching class names, which misses class names built at run time.
- **Vendor behaviour.** Chromatic's handling of merge commits, its snapshot allowance and Figma's import formats were read from public pages or not confirmed; each is checked in the pilot or once the account exists.
- **Automated, not independent.** The same session wrote Part A, proposes Part B and will run the pilot.
