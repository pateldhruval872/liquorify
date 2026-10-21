---
document_id: LIQ-010
title: Design System Reproduction Architecture
version: 0.2-draft
status: DRAFT
owner: unassigned
approved_by: null
approved_at: null
updated: 2026-10-21
---

# Design System Reproduction Architecture

The implementation plan for reproducing Spree's design systems in Storybook and Figma, with Playwright screenshot comparisons as the visual check: FB-19 and FB-20 now, and the libraries FB-21 builds on later ([LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items)). It is linked from the decision record [LIQ-007](LIQ-007-design-system-adoption-and-extension.md), which it does not change. The owner asked for it on 2026-10-21, before coverage grows past a pilot ([LIQ-001 §1](LIQ-001-project-profile.md#recorded-instructions-that-shape-engineering-work)).

It has two parts, kept apart on purpose:

- **Part A (§2 to §5) is what Spree already has**, read at backend `1d1f2d4` and storefront `ac53c5b`, the revisions LIQ-008 and LIQ-009 pin. It is fact, with the files named.
- **Part B (§6 to §14) is the proposed tooling around it.** Nothing in Part B is decided. Each arrangement was tried in the pilot (§13) on 2026-10-21, and version 0.2 corrects this plan with what the pilot found ([record](verification/2026-10-21-fb-19-pilot.md)) before coverage grows.

## 1. Status of the decisions this plan relies on

| Kind | Items | Where |
|---|---|---|
| Decided by the owner on 2026-10-21 | Q4: one Figma Professional Full seat, Code Connect deferred, billing shown before any purchase. Q7: every component in LIQ-009, with mocked data and providers, and every case that cannot be rendered recorded. Q10: Playwright screenshot comparisons against the built Storybooks replace Chromatic, in a consistent browser environment with deterministic sample data, with reference images under version control, reports and failure images as CI artifacts, no automatic approval of changed screenshots, and advisory at first. Q10 superseded Q5 (Chromatic's free plan), which stays in LIQ-007 as history | [LIQ-007 §7](LIQ-007-design-system-adoption-and-extension.md#decided-on-2026-10-21) |
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
- the focus outline of elements that keep the stylesheet's base focus rule, which turns white under `prefers-color-scheme: dark` while the page stays light. The button primitive draws its own outline, so it stays black whatever the setting; the pilot showed this.

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
| Visual checks | A `visual/` folder beside each Storybook with the Playwright configuration, the test and the reference images, and a workflow `.github/workflows/storybook.yml` in each repository | Liquorify-owned files, separate from Spree's own browser tests and workflows |

**Options considered for the backend.** A `.storybook/` inside each Spree package was rejected: it edits Spree's packages and their dependency lists, and gives four Storybooks with four sets of visual checks. The starter application was rejected as a home: it is the template Spree publishes, and its build composes routes as a side effect.

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
  visual/       Playwright configuration, the test, reference images
  tokens/       generated token files
  scripts/      token extraction, coverage report, reference updates
```

The storefront has the same `visual/` folder at its root.

Story titles follow the same path, so the Storybook sidebar reads like LIQ-009: "Dashboard UI / Primitives / Button", "Admin dashboard / API keys / API key table", "Storefront / Cart / Cart drawer".

### 7.2 Dashboard decorators

Stories use Spree's real providers wherever they can run, with the network mocked, rather than hand-written stand-ins. A stand-in is used only where a real provider cannot run, and each one is listed in the pilot's record.

| Level | Applied to | What it provides |
|---|---|---|
| Every story | All dashboard stories | i18next fixed to English, with the framework's English strings and then the story's panel's laid over them, as each panel does at start-up (a few keys differ between the panels, and only one set is loaded at a time); `ThemeProvider` driven by Storybook's theme setting; `TooltipProvider` and `ConfirmProvider`; the panel's providers in that panel's order (§2.3); the card colour as the page surface, which both panels render their pages, sheets and dialogs on, rather than the page grey the design system gives the body |
| On request | Stories that declare it in `parameters.liquorify` | `route`: a memory router (TanStack Router with in-memory history) at the route the story names. `sellerId`: the framework's `TenantProvider`, as the seller panel's route layout sets it. `capture: 'viewport'`: the visual check captures the whole page (§11.3). `column: 'page'` or `'settings'`: a component that fills its container is shown, and captured, at the width of the page column it fills on its screen at the capture width (965 and 890 pixels at 1,280). Planned for the batches that need it: a react-hook-form `FormProvider` with the story's values |
| Data | Framework, dashboard and seller panel stories | The panels' shared `queryClient`, cleared when a new story starts, so no cached data leaks between stories (Spree's code imports the shared client, so a new one would not reach it); `panel: 'seller'` registers the Seller client instead of the Admin one, since only one is registered at a time; `signedIn: true` mounts `AuthProvider` and `PermissionProvider`, reading invented data through the mocked API. Planned for the batches that need it: `StoreProvider` |

### 7.3 Dashboard mocks and fixtures

- **Requests are intercepted in the browser** with Mock Service Worker, the library the SDK packages already test with, through its Storybook addon's loader for this story format (`msw-storybook-addon/csf3`). The worker file is served from the Storybook's own origin. Each story lists the handlers it needs, and a request under `/api/` that no handler answers is reported as an error.
- **Handlers are grouped by API resource** (`mocks/handlers/admin/api-keys.ts`), with responses in the API's own `{ data, meta }` shape and Stripe-style prefixed IDs.
- **Fixtures are invented**, in the style of Spree's sample catalog, and never contain real merchant or shopper data or anything that looks like a real credential.
- **Fixtures are checked against the SDKs' schemas.** A unit test parses each fixture with the matching schema from `@spree/admin-sdk/zod` or `@spree/seller-sdk/zod`, so a mock that drifts from the API fails the Packages workflow.
- **Permission sets.** Each data story can run with full permissions or read-only, which reproduces LIQ-008's "without write permission" state. The pilot's stories all ran with full permissions; the first component with a read-only state tries the other set.

### 7.4 Storefront decorators and mocks

- **Every story** gets `NextIntlClientProvider` with the English messages, the fixed clock and the UTC time zone, and Storybook's Next.js framework supplies its own stand-ins for `next/navigation`, `next/link`, `next/image` and request headers. A story that sets `parameters.liquorify.storefront` also gets the real `StoreProvider`, `AuthProvider` and `CartProvider`, in the layout's order.
- **Server actions are replaced, module by module.** Storybook's module mocking (`sb.mock`) replaces each `src/lib/data/*.ts` module a story needs with an automatic mock, and a step before each story gives the mocks their answers from fixtures (`parameters.liquorify.cart`, for example). The real providers then run on top. The pilot needed the cart and customer modules; each batch adds the ones its components import. Fixtures are checked against `@spree/sdk/zod`.
- **Server components** are rendered with the framework's experimental support for them, with `next-intl/server` replaced the same way: `getTranslations` answers from the English messages. `HeroSection`, an `async` server component, rendered this way in the pilot. A server component that cannot render is recorded (§7.5).
- **Third-party scripts** (Stripe and Adyen payment fields, Google Tag Manager, Vercel analytics) are never loaded. The components that embed them are recorded with what is shown in their place.
- **Modules loaded through `next/dynamic` are out of `sb.mock`'s reach,** because a dynamic import bypasses its replacement. The cart drawer loads `ExpressCheckoutButton` (CMP-SF-G-04) that way, and it injects Stripe's script. Storybook's build therefore points that one import at a stand-in that renders nothing, so the cart drawer's stories show no express checkout button, as they would with no payment provider configured. The button itself is recorded as U4.
- **Fonts.** In Storybook, `next/font/google` links to Google's font files at run time instead of serving its own copies as the Next.js build does. The visual check answers those requests with committed copies of the same Geist files (`visual/fonts/`, with their SIL Open Font Licence), so no request leaves the machine.
- **Toasts** must be raised after the toast container has mounted, so a toast story raises its toast in an effect, not in a play function.

### 7.5 Cases that cannot be rendered

Each one is recorded against its component ID in LIQ-009, in the coverage column (§10), with one of these reasons:

| Code | Reason |
|---|---|
| U1 | Only ever rendered inside its parent; covered by the parent's story, which is named |
| U2 | Needs server behaviour that Storybook cannot run, even with mocks |
| U3 | Needs a browser setting Playwright cannot emulate |
| U4 | Embeds a third-party script or frame that must not load in a story |
| U5 | Needs a full route or real navigation, and is covered by its screen in FB-21 instead |

## 8. Themes and widths captured

| Surface | Themes | Widths |
|---|---|---|
| Dashboard design system, framework, admin dashboard, seller panel | Light and dark | One desktop width, 1280 pixels |
| Storefront | Light, because shoppers never see the dark theme (§3.3). Stories tagged `system-dark` are also captured at the desktop width with the operating system's dark setting emulated | 390 and 1280 pixels. Stories tagged `desktop-only`, the token pages, at 1280 only, because they are reference tables rather than shopper layouts |

The viewport is 800 pixels high in the backend and 844 in the storefront, the height of the phone width it pairs with. A story captured by its root element is captured in full however tall it is; a viewport capture (§11.3) shows the viewport only.

The storefront's dark values are still reproduced in full: on the token pages and as a Figma mode named "Dark (declared, not shown)". Things that follow the operating system's dark setting are tagged `system-dark` and captured with that setting emulated, which Playwright supports (`colorScheme: 'dark'`), while the page itself stays light. In the pilot that is the toast container. The base focus outline (§3.3) is tagged too when the batch that covers links and form fields reaches it; the button's own outline does not follow the setting, so its focus story is captured in light only.

## 9. Token preparation and the CSS-to-Figma mapping

### 9.1 Extraction and checking

- **One script extracts tokens from a stylesheet.** It uses only Node, removes CSS comments first, and records each token's name, block, light and dark values, value form, LIQ-009 ID and source line.
- **It writes one file per system:** the dashboard's tokens, the storefront's tokens and the email branding defaults, read from `spree/core/app/models/spree/emails/branding.rb`.
- **The format follows the Design Tokens Community Group format** (`$value`, `$type`, `$description`), with Liquorify's own fields (the ID, the source, the value form and how a derived value was computed) under `$extensions`. Light and dark are modes within the dashboard and storefront files; the email file has one.
- **The storefront keeps unchanged copies of four scripts,** because the two repositories share no code: the token extraction, the coverage report, the reference copy script and the small static server the visual check uses. Each script says that the copy exists, so a change is made in the backend first. Each batch's record compares the copies byte for byte.
- **IDs come from LIQ-009, not from the order of the file.** LIQ-009 lives only in the backend, so a small generated list of IDs and names sits beside each repository's stories and token files. The backend's `inventory:ids` script writes it from LIQ-009, in the same change as LIQ-009. The storefront's copy holds only its own IDs.
- **A check mode** regenerates the token file and fails if it differs, if the stylesheet has a token the ID list lacks, or if the list names a token the stylesheet no longer has. In the backend it also fails if the ID list no longer matches LIQ-009. It runs in each repository's Storybook workflow.
- **Palette colours** (§3.4) are resolved from Tailwind's own theme file at the installed version, and listed with the colours the token files reference and the component class names use. LIQ-009 gives them IDs in the same change: TK-TW-D for the dashboard (48 colours) and TK-TW-S for the storefront (42 colours, plus white and black).

### 9.2 Mapping rules

| CSS value form | Figma | Recorded as |
|---|---|---|
| oklch colour | A colour variable, converted to sRGB with the CSS Color 4 formulas; transparency kept | The original oklch value in the description. A value outside sRGB is clipped, and the size of the clip is recorded. The comparison with the reference screenshots in FB-20 decides whether that is visible |
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

- **Stories carry their IDs as tags**, for example `tags: ['CMP-DUI-P-07']`. Tags appear in the built Storybook's index, so a script can count them. A story for a component in a group (CMP-DA-G, CMP-SP-G, CMP-SF-G) carries the group's ID and names the file in the last part of its title: "API key table" covers `api-key-table.tsx`, and "Cart drawer" covers `CartDrawer.tsx`, ignoring case, spaces and punctuation. A token page carries its family's ID (`TK-DUI`), which covers every token in that family.
- **Story names are the states**, such as "Default", "Disabled", "Loading", "Empty", "Error", "Read-only" and "Open". The list of stories for an ID is therefore the list of states FB-20 turns into Figma component properties.
- **A coverage report** reads the built index, compares it with the repository's ID list (§9.1), and lists each section's covered and total counts and every covered component with its story and states. It runs in the Storybook workflow, writes to the run's summary page, and its output goes into each batch's record. It fails only on a tag that names no inventory ID, which is a typo; components without stories are expected until every batch is done. The recorded reasons (§7.5) are added to it once the first batch records one.
- **LIQ-009 gains two columns:** "Storybook", with the story's title or a reason code, and "Figma", filled in by FB-20. LIQ-008 gains a "Figma" column for FB-21. Each batch fills its own rows; the pilot leaves the columns to the first batch, so LIQ-009 is not edited twice for the same components.
- **Reference images** are named by story and mode (`<story id>/<mode>.png`), so each traces to its inventory ID through the story's tags.
- **Figma components** take the code's name, list their states as variant properties, and carry the ID, the source path and the story's title in their description. Code Connect is deferred (Q4), so the link is by name and description only.
- **FB-21's frames** are named with their screen IDs, as LIQ-004 already requires.

## 11. Visual checks with Playwright

The owner decided the requirements on 2026-10-21 (Q10, in [LIQ-007 §4](LIQ-007-design-system-adoption-and-extension.md#4-how-each-tool-is-used)): screenshot comparisons against the built Storybooks, a consistent browser environment, deterministic sample data, reference images under version control, reports and failure images as CI artifacts with an appropriate retention, no automatic approval of changed screenshots, and advisory checks at first. Everything below is the proposed way to meet them.

### 11.1 Environment

- **One container image per repository.** CI runs the comparisons inside Playwright's own container image for the Playwright version that repository already uses for its browser tests: 1.64.1 in the backend and 1.60.0 in the storefront. The image is pinned by its digest, so its browser and fonts cannot change underneath the references.
- **Chromium only,** headless, at a device scale factor of 1.
- **Fixed browser settings:** the viewport of the mode (§8), the `en-US` locale, the UTC time zone, reduced motion, and the colour scheme the mode asks for.
- **Fonts** are the ones the stylesheets load. The dashboard's Geist comes from its font packages, so it is the same everywhere. The storefront's Geist comes through Next.js's font loader, which in Storybook links to Google's files; the test serves committed copies of them instead (§7.4).
- **Where images are made.** Locally, `pnpm visual` and `pnpm visual:update` run the same pinned image through Docker. In the pilot, the reference images were made that way, and every comparison passed in CI on GitHub's runners under the configured tolerance (step 5 below). Image hashes were not compared.

### 11.2 Deterministic sample data

- **Fixed fixtures.** Invented data with fixed IDs, names, amounts and dates, checked against the SDKs' schemas (§7.3, §7.4).
- **A frozen clock.** Each page starts with Playwright's clock set to one fixed instant, so relative dates such as "3 days ago" never change.
- **No outside network.** Requests that leave the local Storybook server are blocked and fail the test; mocked API requests never leave the browser. Images come from local fixture files.
- **No randomness.** Anything a story would randomize is seeded or fixed in the fixture.

### 11.3 What the test does

1. Reads the built Storybook's story index (`index.json`) and makes one test for each story and each mode it is captured in.
2. Opens the story on its own (`iframe.html?id=<story id>`), with the theme the mode sets.
3. Waits until Storybook's render phase reports the story finished, after its play function, and fails the test if the story errored. Then it waits for the fonts and for no request to be pending.
4. Takes a screenshot of the story's root element, with animations stopped and the text caret hidden. A story of an open popup or dialog sets `capture: 'viewport'` and takes the whole viewport instead, because Base UI and Radix render popups outside the root.
5. Compares it with the committed reference using Playwright's own comparison, with an explicit tolerance in both repositories: a pixel counts as different when its colour moves by more than a threshold of 0.005 on Playwright's scale from 0 to 1 (about 2 of 255 levels), and the test fails when more than 25 pixels count. Playwright's default threshold of 0.2 let a change of every story's background pass. The allowance covers a few dark-mode corners that differ between unchanged runs. Pixels that differ by less than the threshold still pass, so a pass is not a claim that two images are identical; that would need their hashes compared. The measurements are in the [tolerance record](verification/2026-10-21-fb-19-screenshot-tolerance.md), and a change to either number needs a new record of the same kind.

Reference images live in `visual/__screenshots__/<story id>/<mode>.png`, beside the test.

### 11.4 Making and changing reference images

CI never writes, accepts or commits a reference image. Its configuration makes a missing reference fail the test rather than create it. In that mode Playwright saves no image at all for a missing reference, so the test saves a proposed one itself: it waits for two identical screenshots in a row, attaches the image to the report, and leaves it in the failure artifact as `proposed/<story id>/<mode>.png`.

- **With Docker:** a person runs the update script, which runs the same pinned image with Playwright's update option and writes the new images into the working copy. The images are committed in a pull request.
- **Without Docker:** a failed CI run's artifact holds the actual images of changed stories and the proposed images of new ones. A person downloads them, looks at them, and copies them into place with `pnpm visual:copy <folder>`, which only copies files. They are committed in a pull request.
- **Either way,** the pull request lists the references it adds or changes and why. GitHub shows each changed image side by side, and the owner reviews them there before merging.
- **A change every story shares** (the surface, a decorator, a font) can pass the comparison without failing any image, because the comparison tolerates small colour differences in each pixel, so the update script would rewrite nothing. After such a change every reference is rewritten (`--update-snapshots=all`), as the pilot's fidelity check found.

### 11.5 CI workflow and artifacts

- **One workflow per repository,** `.github/workflows/storybook.yml`. It runs on pull requests that change stories, mocks, the visual check, Storybook configuration, the components or stylesheets they cover, or the lockfile, and on request.
- **Steps:** install (and, in the backend, build the two SDKs the stories import from their built files), build Storybook, run the token check and the coverage report, then run the Playwright comparisons in the pinned image. Both workflows use Node 22, the version the backend's workflows use; the storefront's own CI stays on Node 20.
- **Artifacts:**
  - the HTML comparison report, from every run, kept 14 days;
  - the failure images (reference, actual and difference), only when a comparison fails, kept 14 days.

  Fourteen days covers a pull request's review and keeps storage small. Both repositories are public, so these artifacts are public too, and they show only invented data.
- **Security.** The workflow reads the repository and nothing else: no secrets, and actions pinned to full commit identifiers, as the backend's security audit workflow already does.
- **Advisory.** The job fails visibly when a screenshot differs, but it is not a required check, so it does not block merging. It runs only for some paths, so it must stay advisory while it does (LIQ-007 §4). Making it required later is a Protected change to the rulesets.

### 11.6 Cost and size

- **No account and no allowance.** CI minutes are free while the repositories are public.
- **Repository size.** The pilot measured it: a component image averages about 8 KB in the backend and 7 KB in the storefront, and a token page about 270 KB. The pilot's 82 backend images take 3.3 MB and its 38 storefront images 1.3 MB, most of it token pages. At those sizes the first full set is roughly 20 MB across both repositories, not the 50 MB first estimated: about 1,520 backend images (379 files, two stories each, two themes) and about 400 storefront images (101 files, two stories each, two widths, light), plus a few with the dark system setting and the token pages.
- **Growth.** Each accepted change adds its new images to the history. If one repository's reference images pass 200 MB of history, moving them to Git Large File Storage is proposed as a separate decision.

## 12. Update and verification workflow

### 12.1 Each batch

1. **Before the pull request:** stories render; lint, type check and fixture tests pass; the token check and coverage report run.
2. **In the pull request:** the Storybook workflow builds, reports coverage and compares screenshots. The batch's new reference images are committed in the pull request, and the owner reviews them there (§11.4).
3. **Fidelity.** Each story is compared with the same component in its screen in the running dashboard or storefront, where a running instance at the pinned revisions is available (FB-04, or the dashboard's browser-test set-up); otherwise the comparison is NOT_RUN and recorded. The comparison committed beside each Storybook (`fidelity/` in the backend, `visual/fidelity/` in the storefront) puts the two side by side and saves the computed styles of both sides and the tokens, with every one that differs. The comparison is diagnostic: it collects evidence for review, and a successful run alone does not establish fidelity. The owner accepts fidelity by reviewing that evidence, which the verification record links with its inventory IDs and revisions. A difference is a defect in the story, its providers or its mocks, never a reason to change the component. A state no running screen shows with the available data is checked against its source, and recorded as such.
4. **A verification record** in `liquorify/verification/` lists what was built, the revision, the coverage report, the reference images added or changed, the comparison results, the results (PASS, FAIL, BLOCKED, NOT_RUN) and the limits.

### 12.2 When Liquorify takes a new Spree or storefront release (FB-12)

1. Re-run the inventory checks (routes, component files, tokens) against the new revision, and record new and removed IDs in LIQ-008 and LIQ-009.
2. Regenerate the token files. Their difference is the list of token changes, and the Figma variables are updated from it in the same change.
3. Build Storybook. A story that no longer compiles shows an interface change; the story is fixed, never the component.
4. Run the fixture tests. A failure shows an API change; the fixtures are updated.
5. Run the visual check. Each difference is reviewed; a difference that comes from Spree's code is accepted by committing the new reference image in the update's pull request, because the code is the source.
6. Give every new component its stories and every new token its variable in the same change.
7. Write a verification record for the update.

## 13. Pilot

A small batch from each system, chosen to try every arrangement above once before coverage grows. The pilot passes when each case renders as it does in its screen, both Storybooks build in CI, the token check and coverage report run, and the visual check gives the same result on two CI runs of the same revision and fails on a deliberately changed story. Whatever does not work is recorded and this plan is corrected before any further batch.

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
| Storefront | Primitive that follows the system dark setting | `sonner` (the toast container) | CMP-SF-P-21 | The emulated dark setting, and a popup outside the story's root. Added during the pilot, when the button's focus outline turned out not to follow the setting |
| Storefront | Client component with context and server actions | `CartDrawer` (`cart/`) | CMP-SF-G-03 | Module mocking, the real cart context, translations |
| Storefront | Server component | `HeroSection` (`home/`) | CMP-SF-G-05 | Experimental server component support and `next-intl/server` |
| Storefront | Token pages | All storefront tokens | TK-SF, TK-SF-T, TK-SF-A | The copied script and the check |

**Result.** The pilot ran on 2026-10-21 ([record](verification/2026-10-21-fb-19-pilot.md)). Both Storybooks built in CI, the token check and the coverage report ran, every comparison passed under the configured tolerance on two CI runs of the same revision, and a planted change failed in CI with the failure images published. The findings are corrected in this version. Each case was then compared with its running screen, using the dashboard's browser-test server and the built panels and storefront ([record](verification/2026-10-21-fb-19-pilot-fidelity.md)). That found two defects, both corrected in §7.2: stories sat on the page grey instead of the card colour, and three components were wider than the page column they fill.

**After the pilot,** coverage grows in batches by LIQ-009 section, each small enough to review:

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
| EB-1 | No Chromatic account, projects or tokens (OA-4) | **Superseded by Q10:** Chromatic is no longer used, so this blocks nothing | — |
| EB-2 | No suitable Figma seat. The existing Full seat is on a plan Figma restricts to non-commercial use (OA-5) | No variables, styles or components in Figma; the token files wait for import | The owner buys the seat after seeing the billing choice (Q4) |
| EB-3 | Storybook's support for server components is experimental | Some storefront server components may not render | Narrowed by the pilot: `HeroSection`, an `async` server component that reads translations, rendered. Server components that fetch data are tried in their batches; any that cannot render are recorded as U2 |
| EB-4 | Chromatic documents no way to emulate the operating system's dark setting | **Superseded by Q10:** Playwright emulates it (§8) | — |
| EB-5 | Figma's own variable import is not confirmed to read the token format | The import uses Figma's plugin interface instead | Checked once the seat exists |
| EB-6 | Chromatic's pricing page does not say whether the free allowance is per account or per project | **Superseded by Q10:** there is no snapshot allowance | — |
| EB-7 | The backend's two-day rule holds back the newest Storybook release, 10.6.3, until 2026-10-22 | The pilot uses the newest version the rule accepts, and records it | Not a blocker; recorded so an install refusal is not mistaken for a fault |
| EB-8 | This session's container had the Docker client but no running Docker service | Reference images could not be made here in the pinned image | **Cleared in the pilot:** the Docker service could be started inside the container, the references were made in the pinned images, and every comparison passed in CI |
| EB-9 | This session's network policy refuses GitHub's artifact storage host | CI artifacts cannot be downloaded into the session, so this session sees only the file paths a failed run's log names, not the images | Not a blocker: references are made with Docker here (EB-8). The owner can allow the host in the project's cloud environment settings |

## 15. How the framework applies

SES-001, ENG-001 and ENG-002 apply to this work, as the owner adopted them on 2026-10-21 (decision D1).

- **Capabilities** ([SES-001 §3](framework/SES-001.md#3-capability-catalog)):
  - Design System Engineering (PD-13) and Visual Interface Design (PD-09) for the reproductions.
  - Visual Regression Verification (QV-08) for the Playwright screenshot comparisons. Human design judgement stays separate: a reference image is accepted by a person, not by the check.
  - Accessible and Inclusive Product Design (PD-11) and Accessibility Verification (QV-09) are not measured yet, because Q3 and Q9 are open.
- **Work items.** FB-19 and FB-20 carry ENG-001's fields in [LIQ-004](LIQ-004-foundation-backlog.md#spree-baseline-reproduction-work-items): outcome, scope, completion criteria tied to the IDs, dependencies and risk. Both are Protected where they add dependencies, CI steps, accounts or seats.
- **Stages** ([ENG-001 §3](framework/ENG-001-engineering-charter.md#3-iterative-sdlc)). This plan is "design and plan". The pilot and each batch are "implement and integrate", then "verify and review".
- **Evidence** ([ENG-002 §6](framework/ENG-002-documentation-system.md#verification-record)). Each batch ends with a verification record. Controls are described by their state ([SES-001 §4](framework/SES-001.md#4-assess-only-what-the-decision-needs)): the visual check is "Configured" when its workflow exists, and "Verified" only after CI runs have compared real references and caught a planted difference. After the pilot it is Verified for the pilot's stories in both repositories; each batch's record repeats the comparison for its own stories.
- **Not applied, and why:**
  - **Independent review.** The owner is the only reviewer, and automated review is labelled as such ([LIQ-001 §2](LIQ-001-project-profile.md)).
  - **The release and operation stages.** Nothing is deployed. The built Storybooks and the comparison reports are CI artifacts, not releases.
  - **Spree's plan folder and plan commands.** Liquorify plans live in `liquorify/` (exceptions X1 and X4 in [LIQ-001 §6.3](LIQ-001-project-profile.md#63-conflicts-and-exceptions)).

## 16. Limitations

- **Reading only, then a small pilot.** Part A was read from the files. Part B ran only on the pilot's eleven components and token pages; what the pilot did not reach (forms, the store provider, read-only permissions, server components that fetch data) is tried by the first batch that needs it.
- **Counts** of palette colours were found by searching class names, which misses class names built at run time.
- **Vendor behaviour.** Figma's import formats were not confirmed, and are checked once the seat exists. Screenshots passed the comparison from run to run in the pinned images during the pilot, under the configured tolerance; moving to a new Playwright image needs the same check again (§11.1).
- **Automated, not independent.** The same session wrote Part A, proposes Part B and will run the pilot.
