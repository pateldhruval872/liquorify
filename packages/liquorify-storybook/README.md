# Liquorify Storybook

Liquorify's Storybook of Spree's dashboard design system, framework, admin dashboard and seller panel components, with the token files and the Playwright visual check. It reproduces Spree's existing appearance and behaviour; it never changes a Spree component. Private and not published.

The architecture and the reasons behind it are in [LIQ-010](../../liquorify/LIQ-010-design-system-reproduction-architecture.md). The inventory it covers is [LIQ-009](../../liquorify/LIQ-009-spree-component-and-token-inventory.md).

## Run it

```bash
pnpm install
pnpm turbo build --filter=@spree/admin-sdk --filter=@spree/seller-sdk   # once, from the repository root
cd packages/liquorify-storybook
pnpm storybook          # http://localhost:6006
```

The toolbar's Theme menu switches between light and dark. Every request to the API is answered by mocks in the browser, so no server is needed.

## Write a story

- **Where:** `src/stories/<package>/<group>/<file>.stories.tsx`, mirroring the component's path. The title follows the same path, for example `Admin dashboard/API keys/API key table`.
- **Tag it with its inventory ID** from LIQ-009 (`tags: ['CMP-DA-G-01']`). For a component in a group, the last part of the title names its file.
- **Name each story after a state:** Default, Disabled, Loading, Empty, Open, Read-only. These become the Figma component's states.
- **Data** comes from fixtures in `src/fixtures/` and request handlers in `src/mocks/handlers/`. Fixtures are invented, never real data or anything that looks like a real credential, and `pnpm test` checks each one against the SDK's schema.
- **Story needs** go in `parameters.liquorify`:
  - `panel: 'seller'` registers the Seller client and translations instead of the Admin ones;
  - `signedIn: true` mounts the auth and permission providers;
  - `sellerId` sets the seller for seller panel queries;
  - `route: { pattern, path }` renders the story inside a memory router;
  - `column: 'page'` or `column: 'settings'` shows a component that fills its container at the width of the page column it fills on its screen;
  - `capture: 'viewport'` captures the whole page, for open popups that render outside the story.

## Commands

| Command | What it does |
|---|---|
| `pnpm build-storybook` | Builds the static Storybook into `storybook-static/` |
| `pnpm tokens` | Regenerates `tokens/*.tokens.json` from Spree's stylesheet and email defaults |
| `pnpm inventory:ids` | Regenerates `inventory/ids.json` from LIQ-009 |
| `pnpm tokens:check` | Fails if a token file or the ID list no longer matches its source |
| `pnpm coverage` | Lists which inventory IDs have stories, from the built Storybook |
| `pnpm visual` | Compares every story with its reference image, in the pinned Playwright image (needs Docker) |
| `pnpm visual:update` | Writes new and changed reference images, in the same image |
| `pnpm visual:copy <folder>` | Copies reviewed images from a downloaded CI artifact into the references |

## Reference images

Reference images live in `visual/__screenshots__/<story id>/<mode>.png`, one for each story in each theme. They are only ever changed in a pull request, where the owner reviews each image before merging. CI never writes or accepts one.

To add or change references:

1. Build the Storybook with `pnpm build-storybook`.
2. Either run `pnpm visual:update` with Docker, or download the `visual-failures` artifact from the pull request's Storybook run and run `pnpm visual:copy <folder>` after looking at the images. The artifact holds a proposed image for each story without a reference, and the actual image for each one that changed.
3. Commit the images, and list in the pull request which ones changed and why.

Comparisons run only in the pinned image, because another browser or font set renders differently. Images taken anywhere else are never references.

`pnpm visual:update` rewrites only the images that fail the comparison. The comparison counts a pixel whose colour moves by about 2 of 255 levels, and allows 25 such pixels in an image, because a few dark-mode corners differ between unchanged runs ([the measurements](../../liquorify/verification/2026-10-21-fb-19-screenshot-tolerance.md)). A change smaller than that passes without rewriting any image. After a change to something every story shares, such as the page surface, rewrite them all with `sh visual/in-image.sh --update-snapshots=all`.

## Compare with Spree's running screens

`fidelity/compare.spec.ts` opens chosen stories beside the same components on Spree's running admin dashboard and seller panel. It saves both images side by side, and the computed styles of both sides with the differences between them, to `fidelity/results/`. It is a diagnostic comparison: it passes whenever it can capture both sides, so a successful run does not by itself show that a story matches its screen. A person reviews the images and styles. It needs Spree's browser-test server, the two built panels and the built Storybook running; the steps are at the top of the file. Run it with:

```bash
node node_modules/@playwright/test/cli.js test --config fidelity/playwright.config.ts
```

Run it in the pinned image (as in `visual/in-image.sh`, with `--network host`) when its images are compared with the reference images. It only reads the screens, and its results are evidence for a review, not references.
