---
title: Screenshot tolerance for the visual checks
record: verification
work_item: FB-19
date: 2026-10-21
verifier: Claude (automated session); not independent review
result: PASS for the proposed setting (threshold 0.005, 25 pixels) in both repositories, for every unchanged run and every deliberate change measured locally, and for two CI runs of each pilot's revision
---

# Screenshot tolerance for the visual checks

**Claim.** An explicit tolerance of `threshold: 0.005` with `maxDiffPixels: 25` lets unchanged runs pass in both repositories, and makes subtle changes to the background and to single colour tokens fail. That includes the background change C1 in the fidelity record (`2026-10-21-fb-19-pilot-fidelity.md`, which [#8](https://github.com/pateldhruval872/liquorify/pull/8) adds after this pull request), which the current setting lets pass. The owner asked for an explicit tolerance before final pilot acceptance, with this evidence recorded before the agreed policy changes. The setting is proposed in the same pull request, after this record, in both visual check configurations and [LIQ-010 §11.3](../LIQ-010-design-system-reproduction-architecture.md#113-what-the-test-does).

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | Unchanged runs pass under the proposed setting | PASS: 18 backend runs (the pilot's 82 images 3 times, the batch's 310 images twice, and the pilot's 41 dark images 13 more times, 9 of them with other Chromium settings) and 3 storefront runs of 38 images; no image failed |
| 2 | The background change in the fidelity record (C1) fails | PASS: all 82 backend images fail. The same change on the storefront's page colour fails all 38 storefront images |
| 3 | Subtle changes to single colour tokens fail | PASS: each of six backend and six storefront changes fails between 8 and 41 of the 82 backend images, and between 2 and 38 of the 38 storefront images |
| 4 | The current setting is shown to miss them | Shown: Playwright's default threshold of 0.2 fails no image for C1, and fails the token changes only on the token pages, which print each value as text |
| 5 | Two CI runs of the same revision pass under the proposed setting | PASS: the backend pilot's 82 images and the storefront pilot's 38 passed twice each on GitHub's runners (§7) |
| 6 | The visual check itself, not only the scoring, passes unchanged runs and fails the changes | PASS: locally, two unchanged runs passed in each repository; C1, the dark card change and the storefront's page colour change failed the images §4 predicts (§7) |

## 1. Why the setting changes

Playwright compares two images pixel by pixel. A pixel counts as different when its colour differs by more than the **threshold**, on a scale from 0 (any difference) to 1, measured in a colour space weighted for how the eye sees brightness. Pixels on the smoothed edges of text and shapes are left out. The test fails when more pixels count than **`maxDiffPixels`** allows.

The current setting is Playwright's default threshold of 0.2 with no pixel allowed. At 0.2 a grey pixel must change by about 52 of 255 levels to count. C1 changed the surface behind every backend story by 5 levels in light (from 250 to 255) and by 11 in dark (from 15 to 26), so 56 of the 82 images still passed, and `pnpm visual:update` did not rewrite them. To count those pixels, the threshold must be below about 0.019 for light and 0.034 for dark.

## 2. Method

1. **The same environment as CI.** Each repository's Storybook was built with its own build command, then captured in its pinned Playwright image: 1.64.1 for the backend and 1.60.0 for the storefront, by digest, with the visual check's own test and modes.
2. **Captures, not references.** A capture configuration extends the visual check's configuration, writes every image to a separate folder and never touches `visual/__screenshots__` ([`capture.config.ts`](evidence/2026-10-21-fb-19-screenshot-tolerance/capture.config.ts)).
3. **Unchanged runs.** The revision under review was captured several times without any change.
4. **Deliberate changes.** One change at a time was added to the stylesheet, the Storybook rebuilt and captured, and the stylesheet restored ([the changes](evidence/2026-10-21-fb-19-screenshot-tolerance/changes/)).
5. **Scoring.** Every capture was compared with its committed reference by Playwright's own image comparison, loaded from the same Playwright version, under each candidate setting ([`score.cjs`](evidence/2026-10-21-fb-19-screenshot-tolerance/score.cjs)). The per-image counts are in the evidence folder.

| | Backend pilot | Backend batch | Storefront pilot |
|---|---|---|---|
| Revision | [#6](https://github.com/pateldhruval872/liquorify/pull/6) at `d0898ad` | [#9](https://github.com/pateldhruval872/liquorify/pull/9) at `e78c1bf` | [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15) at `d84dc61` |
| Images per run | 82 | 310 | 38 |
| Unchanged runs | 3 of all 82 images, and 13 of the 41 dark images | 2 | 3 |
| Deliberate changes | 7 | none | 7 |

The machine was a Linux container with 4 processor cores and Docker, not one of GitHub's runners; §7 checks the setting there.

## 3. What differs between unchanged runs

Unchanged runs are not always identical to the references. In the backend, 5 to 8 of the pilot's 82 images and 24 to 28 of the batch's 310 differ in each run. Those that count at all are in dark mode, at the smoothed corners of rounded, bordered elements: mainly the pagination and the API key table. A pixel there differs by up to 7 of 255 levels.

| Run | Images | Identical | Largest counted pixels in one image, at threshold 0 | at 0.005 | at 0.01 | at 0.02 |
|---|---|---|---|---|---|---|
| Backend pilot, run 1 | 82 | 74 | 19 | 5 | 4 | 1 |
| Backend pilot, run 2 | 82 | 77 | 15 | 1 | 1 | 1 |
| Backend pilot, run 3 | 82 | 74 | 12 | 5 | 4 | 1 |
| Backend batch, run 1 | 310 | 286 | 9 | 4 | 2 | 0 |
| Backend batch, run 2 | 310 | 282 | 17 | 13 | 5 | 2 |
| Backend pilot, dark images only, 4 runs | 41 | 33 to 35 | 12 to 20 | 1 to 11 | 1 to 4 | 1 |
| The same, one raster thread, 3 runs | 41 | 32 to 34 | 17 to 22 | 3 to 15 | 2 to 6 | 0 to 1 |
| The same, no GPU, 3 runs | 41 | 34 to 35 | 5 to 20 | 0 to 3 | 0 to 2 | 0 to 1 |
| The same, no GPU raster and one raster thread, 3 runs | 41 | 32 to 37 | 8 to 18 | 1 to 3 | 1 to 2 | 1 |
| Storefront pilot, runs 1 to 3 | 38 | 38 | 0 | 0 | 0 | 0 |

Three Chromium settings were tried to remove the difference, each on three runs: a single raster thread, no GPU, and no GPU raster with a single raster thread. None removed it.

A threshold alone cannot separate this from a real change: the corner differences stop counting only at about 0.03, and C1's light change needs a threshold below 0.019 to count. An allowance of pixels can, because the corner differences are a handful of pixels and a token change touches thousands.

## 4. Deliberate changes and what each setting catches

Each cell is the number of images that fail. A run fails when one image does.

### Backend pilot, 82 images

| Change | What it alters | Default 0.2 | 0.01, 25 pixels | **0.005, 25 pixels** |
|---|---|---|---|---|
| m1 | Removes C1, so the surface returns to the page grey: 255 to 250 in light, 26 to 15 in dark | 0 | 82 | **82** |
| m2 | Light card colour, white to 99 % lightness: 255 to about 252 | 2 | 41 | **41** |
| m3 | Dark card colour, 21.6 % to 22.6 % lightness: about 26 to 28 | 2 | 2 | **41** |
| m4 | Light border, 92.3 % to 91.3 % lightness: about 229 to 226 | 2 | 20 | **28** |
| m5 | Light primary, 14.7 % to 16.7 % lightness: about 10 to 15 | 2 | 9 | **9** |
| m6 | Light muted text, 0.535 to 0.545 lightness: about 109 to 112 | 2 | 2 | **26** |
| m7 | Focus ring hue, 258 to 262 degrees, light and dark | 4 | 7 | **8** |

Under the default, every failure is on the two token pages, which print each value as text; no component image fails. A threshold of 0.01 misses the dark card and the muted text in almost every image, because each changes a colour by 2 or 3 levels.

### Storefront pilot, 38 images

| Change | What it alters | Default 0.2 | 0.01, 25 pixels | **0.005, 25 pixels** |
|---|---|---|---|---|
| s1 | Page colour, white to stone-50: the same change as C1, from 255 to 250 | 2 | 38 | **38** |
| s2 | Page colour, white to 99 % lightness: 255 to about 252 | 2 | 38 | **38** |
| s3 | Primary, 0.205 to 0.225 lightness: about 23 to 28 | 2 | 18 | **20** |
| s4 | Border, 0.922 to 0.912 lightness: about 229 to 226 | 2 | 20 | **20** |
| s5 | Muted text, 0.556 to 0.566 lightness: about 115 to 118 | 2 | 4 | **4** |
| s6 | Focus ring, 0.708 to 0.688 lightness: about 161 to 155 | 2 | 2 | **2** |
| s7 | Accent, 0.97 to 0.96 lightness: about 245 to 242 | 2 | 2 | **2** |

Under the default, every failure is again on the two token pages. No storefront pilot story outside the token pages shows the muted text, focus ring or accent colours, so s5, s6 and s7 fail only there, under every setting. Every storefront image in the unchanged runs was identical to its reference.

## 5. The proposed setting

`threshold: 0.005` and `maxDiffPixels: 25`, in both repositories:

- **0.005** counts a grey change of 2 levels or more. It is the lowest threshold tried at which the unchanged runs' differences stay a handful of pixels: at most 15 pixels in one image, on the pagination's dark images.
- **25 pixels** is above the largest count any unchanged run reached at 0.005, which was 15. Every deliberate change made at least one image count 52 pixels or more, and most made thousands.
- **The margin is not large.** A story with many more rounded, bordered elements in dark mode could pass 25 without any change; §9 says what happens then. An allowance of 50 would catch the same changes here, but s7's largest image counts only 52, so it would leave almost no room for a small change.

## 6. What the setting does not catch

- A change of 1 level, which counts at no threshold Playwright allows above 0.
- A change confined to 25 pixels or fewer, such as one corner of a small icon.
- A change only on the smoothed edges of text and shapes, which Playwright leaves out.
- A story the check does not capture, or a state no story shows.

## 7. The setting in the visual check

§2 to §4 score captures with Playwright's comparison outside the visual check. Once the setting was in both configurations, the visual check itself was run.

**Locally**, in the pinned images, with the same deliberate changes:

| Repository | Unchanged, first run | Unchanged, second run | Change | Result | §4 predicted |
|---|---|---|---|---|---|
| Backend pilot at `817e177` | 82 passed | 82 passed | m1, C1 removed | 82 failed | 82 |
| | | | m3, dark card | 41 failed, 41 passed | 41 |
| Storefront pilot at `0a901eb` | 38 passed | 38 passed | s1, page colour | 38 failed | 38 |

**In CI**, on GitHub's runners, each pilot's visual check ran when its revision was pushed and again as a re-run of the same workflow run:

| Repository | Revision | Workflow run | First attempt | Second attempt |
|---|---|---|---|---|
| Backend pilot | [#6](https://github.com/pateldhruval872/liquorify/pull/6) at `817e177` | [Storybook](https://github.com/pateldhruval872/liquorify/actions/runs/39670252392) | 82 passed | 82 passed |
| Storefront pilot | [storefront #15](https://github.com/pateldhruval872/liquorify-storefront/pull/15) at `0a901eb` | [Storybook](https://github.com/pateldhruval872/liquorify-storefront/actions/runs/39670260380) | 38 passed | 38 passed |

Neither configuration retries a failed comparison, so each pass is a first-time pass. Two runs on one kind of runner are a small sample; §9 says what a later failure without a change means.

## 8. Evidence

In [`evidence/2026-10-21-fb-19-screenshot-tolerance/`](evidence/2026-10-21-fb-19-screenshot-tolerance/):
- `capture.config.ts`: the capture configuration;
- `changes/`: each deliberate change;
- `score.cjs`: the scoring script;
- `backend-pilot.json`, `backend-pilot-dark.json`, `backend-batch.json` and `storefront-pilot.json`: for each run, the failing images under each setting, and the counts for every image not identical to its reference. In `backend-pilot-dark.json`, `base` runs use the pinned image's own settings, `f1` one raster thread, `f2` no GPU, and `f3` no GPU raster with one raster thread.

The captured images themselves are not committed: the failing ones differ from the references only by the change named.

## 9. Limitations

- **Automated, not independent.** The same session built the pilot, chose the changes and scored them.
- **One machine.** The unchanged runs were made on one container. GitHub's runners may differ more, which §7 checks; a later run that fails without a change is a reason to revisit the setting, recorded in a new record.
- **Chosen changes.** The changes are the smallest steps of the tokens most stories use. Other tokens, and changes to sizes or spacing, were not tried; those move pixels and fail at any setting.
- **The batch has no deliberate changes.** Its two unchanged runs show its 310 images pass; its stories use the same stylesheet as the pilot's.
