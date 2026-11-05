---
title: The media picker image that failed once in CI, investigated (row 30)
record: verification
work_item: FB-19; row 30 of the owner decision brief, batch 3's "Media picker sheet: Two picked", light
date: 2026-11-05
verifier: Claude (automated session, thread "Investigate media picker image tolerance"); not independent review
result: "Row 30's condition 3 is not met, so under row 30's own rule the image keeps the tolerance of 25 and no allowance is added. Conditions 1 and 2 are met: CI's difference was recovered from its log and reproduced pixel for pixel, the tiles' photo corners taking one of two shadings from run to run, and no unchanged local run counted over 34. But three deliberate changes to the picked tiles' borders, row 30's own example, passed the visual check with 60. Condition 4 was not run. No tolerance was changed. A forced repaint made both images draw identically in 40 local runs; it is offered to the owner as an optional fix that keeps 25."
---

# The media picker image that failed once in CI, investigated (row 30)

**What this records.** On 2026-11-04 the owner answered row 30 of the owner decision brief ([record §2](2026-11-04-owner-decision-brief-answers-3.md#2-work-items-and-closure-conditions)). Batch 3's story "Media picker sheet: Two picked" failed once in CI, in light, by 34 counted pixels against the tolerance of 25, and its failure image could not be downloaded then ([part 2's merge record §4](2026-11-04-fb-19-batch-catalog-and-pricing-part-2-merge.md)). The owner authorized an investigation, and with it an allowance of 60 counted pixels for that one light image, applied only when four conditions hold: the difference in the failing CI run is found and explained; unchanged runs stay within 60; deliberate changes to what the image shows, such as the picked tiles' borders, still fail under 60; and two full visual runs pass in CI with the allowance in place. If that evidence cannot be obtained, the image keeps the tolerance of 25 and no allowance is added. This record is the investigation. **No tolerance was changed**: `visual/playwright.config.ts` and the allowances in `visual/stories.spec.ts` are as `main` has them.

**Results.**

| # | Row 30's condition | Result |
|---|---|---|
| 1 | The difference in the failing CI run is found and explained | PASS: the failing attempt's own log carries the visual check's description of the difference, with both images cropped around it, which GitHub's API still serves. 80 pixels changed, by up to 34 of 255, of which 34 counted, all at the rounded top corners of the four tiles' photos. An unchanged run on this session's machine drew an image with the same counts, the same box and the same busiest squares, and its crop is identical to CI's, pixel for pixel. The cause is that each tile's photo has its top corners drawn in one of two shadings, which the browser picks from run to run (§2, §3) |
| 2 | Unchanged runs differ by no more than 60 counted pixels | PASS, locally: in 376 unchanged runs of the light image the largest count was 34, and none was over 60; 5 of the 250 runs without a forced repaint counted 32 or 34, above today's 25. 34 is also the ceiling: it is what all four tiles in the second shading count (§2). In CI the image failed once, by 34, in about 95 attempts that compared it |
| 3 | Deliberate changes to what the image shows still fail under 60 | FAIL: of 16 changes, the picked tiles' borders made 15 % lighter (55 counted), 5 % lighter (32 to 46), and one picked tile's border made 15 % lighter (32) all passed the visual check with the allowance of 60, twice each. The check badges moved 1 pixel down (22) passed even at 25, and one picked tile's corners rounded 1 pixel more counted 49 alone, though 61 to 66 in the check. The other 11 changes counted 72 or more (§4, §5) |
| 4 | Two full visual runs pass in CI with the allowance in place | NOT RUN: the allowance was not added, so no CI run has it. Condition 3 already decides the outcome, and this session was asked not to change a tolerance |

**What follows (§7).** Row 30's rule applies as written: the light image keeps the tolerance of 25 every other image has, no allowance is added, and the threshold and every other tolerance stay unchanged. The occasional failure remains. A forced repaint after the story's clicks made both of the story's images draw identically in all 40 local runs (§6); whether to adopt it, with new reference images, is left to the owner.

## 1. The image and the failing run

| What | Detail |
|---|---|
| Story | `dashboard-core-media-picker-sheet--two-picked`, light, from batch 3 ([image review list, S132](2026-10-26-fb-19-batch-setup-stores-and-settings-image-review.md)). Its reference image has not changed since batch 3 added it in `92832926` |
| What it shows | The media library sheet with four tiles, each a photo above its name; "Clay mug" and "Slate cap" are picked, so each has a dark border and ring and a check badge, and "Slate cap", clicked last, also has the browser's focus outline (`packages/dashboard-core/src/components/media-picker-sheet.tsx`, lines 240 to 283 at `fa490537`) |
| The failing run | [Storybook 41877259668](https://github.com/pateldhruval872/liquorify/actions/runs/41877259668), started by hand on `main` at `16380f5f` after #42's merge, attempt 1, job 126739956775, on an AMD EPYC 9V45. 2,543 of 2,544 comparisons passed; this image failed by 34 counted pixels. Attempt 2 passed all 2,544 |
| Every other CI attempt | From 2026-10-26, when batch 3 added the story, to 2026-11-05 04:00 UTC: 126 completed runs, 19 failed and 4 re-run. Every failed attempt's log was read: this image failed in that one attempt and passed in every other, about 95 attempts that compared it, and its dark image never failed ([`ci/failed-attempts-since-2026-10-26.txt`](evidence/2026-11-05-fb-19-media-picker-image-investigation/ci/failed-attempts-since-2026-10-26.txt)) |

**Recovering CI's difference.** The failure images are uploaded as an artifact that this session's network policy still cannot download, as before. But since `4c2a3f61` the visual check writes its own description of any failed comparison into the job log, with both images cropped to 320 by 200 pixels around the busiest part of the difference, and GitHub's API serves the first attempt's log beside the re-run's. Its lines read:

> The images differ, on AMD EPYC 9V45 96-Core Processor: 1280 by 800; 80 pixels changed, by up to 34 of 255, between x 689 to 1253 and y 171 to 327
> busiest squares, x 960, y 160: 22; x 1080, y 160: 12; x 1120, y 160: 11; x 1240, y 160: 11; x 800, y 160: 10; x 1240, y 320: 7
> crop from x 820, y 80

The crops were decoded from the log unchanged ([`ci/`](evidence/2026-11-05-fb-19-media-picker-image-investigation/ci/)). The expected crop is identical, pixel for pixel, to the same part of the committed reference, so the log's images are the comparison's own. In the actual crop, 59 pixels differ from the reference, all within 7 pixels of the top corners of three tiles: "Clay mug" by up to 34 of 255, "Slate cap" by up to 7, and "banner-lilac.png" by up to 3. The pixels are a little darker in CI's image at the curve of each corner, where the photo meets the rounded border, and no straight edge, colour, text or position differs. The other 21 changed pixels lie outside the crop, at the same tiles' top corners and at one bottom corner, by the box and the squares the log gives.

**The same image on this session's machine.** In the pinned Playwright image, with the visual check's own configuration, 40 unchanged runs of the story were captured (§2). Run 5 drew a light image that differs from the reference by exactly what the log says: 80 pixels changed, by up to 34, between x 689 to 1253 and y 171 to 327, 34 counted, with the same six busiest squares and the same counts in each. Its crop is identical to CI's actual crop, pixel for pixel. So CI's image is one that an unchanged run draws on a different machine, an Intel Xeon here against CI's AMD EPYC, and not a change to the story or the component. [`corners-zoomed.png`](evidence/2026-11-05-fb-19-media-picker-image-investigation/corners-zoomed.png) shows three of the corners twelve times enlarged: the reference, CI's image and run 5.

## 2. What varies between unchanged runs

Every capture below was scored against the committed reference with Playwright's own comparison at the check's threshold of 0.005. "Counted" is what the check compares with its allowance; "changed" is every pixel that differs at all.

| Unchanged runs, light | Runs | Counted 0 | Counted 1 to 25 | Counted 26 to 60 | Over 60 | Largest |
|---|---|---|---|---|---|---|
| The story's two modes together, two at a time as CI runs them | 40 | 35 | 3 (2, 20, 20) | 2 (32, 34) | 0 | 34 |
| Light only, one at a time | 60 | 56 | 4 (14, 20, 20, 20) | 0 | 0 | 20 |
| Light only, with the images' sizes logged before the capture | 90 | 87 | 3 (12, 12, 20) | 0 | 0 | 20 |
| Light only, after waiting for every photo to finish decoding | 30 | 27 | 2 (20, 20) | 1 (32) | 0 | 32 |
| Light only, after waiting one more second | 30 | 28 | 0 | 2 (32, 34) | 0 | 34 |
| **Without a forced repaint** | **250** | **233** | **12** | **5** | **0** | **34** |
| With a repaint forced after the story drew (§3): 60 light only, 40 with both modes | 100 | 0 | 0 | 100, all 34 | 0 | 34 |
| The visual check itself (§5): 20 unchanged runs, and 6 with a repaint forced | 26 | | 20 passed at 25 or 60 | 6, all 34 | 0 | 34 |
| **All unchanged runs** | **376** | | | | **0** | **34** |

Within each run, the difference is always made of the same pieces. Each of the four tiles has its two top corners drawn either as the reference has them or in a second, slightly darker shading, and each tile flips on its own; the bottom corners and everything else differ by at most 3 of 255, which never counts. What a flip counts depends on the tile, because the darker the border behind the corner, the more the shading shows:

| Tile whose top corners flip | Changed | Largest | Counted |
|---|---|---|---|
| "Clay mug", picked: dark border and ring | 24 | 34 | 20 |
| "Slate cap", picked: dark border, ring and the blue focus outline | 24 | 7 | 12 to 14 |
| "Olive canvas tote" or "banner-lilac.png", not picked: light border | 22 | 3 | 0 |
| All four at once, as a forced repaint draws them every time | 99 to 106 | 34 | 34 |

So the most an unchanged run can count by this variation is 34, and an image made by putting together the flipped corners of all four tiles from two different runs counts 34 too. Every count measured fits that sum: 20 for "Clay mug" alone, 12 to 14 for "Slate cap" alone, and 32 to 34 for both.

**The dark image.** It varies the same way. Without a forced repaint it counted up to 15 in the 41 captured runs; with one, 25 in every one of 40. Once, in an unchanged run of the visual check itself (§5), it counted 27 and failed against its tolerance of 25, at the same tiles' top corners. It never failed in CI. Every dark capture also differs from its reference by at least 44 pixels around "Clay mug"'s check badge and at the right ends of the search field and the last tile, which count 2: the dark reference holds a shading these runs never drew. No allowance was asked for the dark image, and none is proposed.

## 3. Why the corners vary

- **The tiles sit between pixels.** The browser places the tiles' top edge at y 170.5625, and two of the four tiles' left edges at a half pixel (834.5 and 1123.5), because the sheet's layout does not land on whole pixels. Each tile is a button with 8-pixel rounded corners that clip its photo, a PNG 160 pixels high drawn 130.5 pixels wide.
- **The photos are what varies.** With the photos hidden, 30 unchanged runs of the light image counted no pixel against one another; with them shown, the corners flip as above.
- **Not the photos loading late.** Waiting for every photo to finish decoding, or one more second, before the capture still left 3 of 30 and 2 of 30 runs flipped.
- **A forced repaint settles it.** Making the whole page repaint once after the story has drawn (its opacity set to 0.999 and back, 200 milliseconds each) drew all four tiles' corners in the second shading every time: 60 runs of the light image, and 40 runs of both modes, were each identical to one another, byte for byte. Against the references they count 34 in light and 25 in dark. So the second shading is how this browser draws the corners when it paints the tiles again; the references hold the first.
- **Whole pixels, not established.** Moving the tiles onto whole pixels, vertically or both ways, or a further quarter pixel off them, left 40 runs of each diagnostic counting no pixel against one another. But adding any rule to the page after the story has drawn turned out to force a repaint too: the quarter-pixel diagnostic counted exactly the 34 a forced repaint counts. So these runs cannot tell whether whole pixels alone would remove the variation, and nothing here relies on them.
- **What is not established.** Why Chromium draws a clipped photo's rounded corner one way in one run and the other way in the next was not traced inside the browser. The variation is per tile and comes and goes on one machine and between machines, like the option chips' borders the [allowance record of 2026-11-02](2026-11-02-fb-19-chip-screenshot-allowance.md) describes, where the cause was not established either. Nothing in the story or the component decides it: the story's steps, the tiles' state and the layout are the same in every run.

## 4. Deliberate changes

Each change is one CSS rule, scoped to the light theme, added to the page after the story's steps had finished and before the capture, with 400 milliseconds for the tiles' colour transition to end. The chip and tolerance records built their changes into the Storybook instead; adding the rule to the page draws the same final state without a rebuild for each change. Because adding a rule also forces part of the page to repaint, which flips some corners by itself (§3), each change was measured three ways: captured with the rule added, three times, against the reference; captured with the rule added and then a full repaint forced, twice, against the reference; and the same repainted captures against an unchanged run repainted the same way, which leaves only the change ("the change alone"). The dark image, which no change touches, stayed within its usual variation every time.

| Change, light image only | Rule added, against the reference | Repainted, against the reference | The change alone | Under 60 by any measure |
|---|---|---|---|---|
| c01 The picked tiles' border 15 % lighter | 55 | 70 | 61 | **Yes** |
| c14 As c01, 30 % lighter | 72 | 74 | 76 | No |
| c15 As c01, 5 % lighter | 32 | 56 | 34 | **Yes** |
| c16 As c01, on one picked tile only | 32 | 54 | 36 | **Yes** |
| c13 Only the picked tiles' ring 15 % lighter | 1,697 | 1,731 | 1,697 | No |
| c02 The picked tiles' ring narrowed from 2 pixels to 1 | 1,144 to 1,164 | 1,178 | 1,144 | No |
| c03 The picked tiles' ring removed | 1,704 to 1,724 | 1,738 | 1,704 | No |
| c04 The picked tiles' corners: radius 8 to 6 | 285 to 286 | 286 | 280 | No |
| c05 The picked tiles' corners: radius 8 to 9 | 237 to 253 | 237 | 235 | No |
| c06 One picked tile's corners: radius 8 to 9 | 66 | 63 | 49 | **Yes** |
| c07 The check badges moved 1 pixel down | 22 | 56 | 22 | **Yes** (and under 25) |
| c08 The check badges 15 % lighter | 506 | 540 | 506 | No |
| c09 The focus outline removed | 1,705 | 1,727 | 1,704 | No |
| c10 The unpicked tiles' border 15 % darker | 576 | 608 | 580 | No |
| c11 The picked tiles' labels 20 % lighter | 215 | 245 | 211 | No |
| c12 The gap between tiles: 12 pixels to 13 | 4,359 | 4,359 | 4,337 | No |

"15 % lighter" is the colour mixed 85 % with white, and so on; each rule is in [`changes/`](evidence/2026-11-05-fb-19-media-picker-image-investigation/changes/). Five changes counted under 60 by at least one measure, and three of them are to the picked tiles' borders, the example row 30 names. A border change of this size is the kind of change the allowance would have to keep catching, so condition 3 is not met.

## 5. The allowance in the visual check itself

The check was then run as CI runs it, both modes against the committed references, from a diagnostic copy of its spec that adds row 30's allowance for the light image only when an environment variable asks for it ([`scripts/diag-spec.diff`](evidence/2026-11-05-fb-19-media-picker-image-investigation/scripts/diag-spec.diff)). The committed spec was not changed.

| Runs of the visual check | With 60 for the light image | With 25, as today |
|---|---|---|
| Unchanged | 10 of 10 passed | 9 of 10 passed; 1 failed on the dark image, 27 counted, with its light image passing |
| Unchanged, with a repaint forced: all four tiles in the second shading | 3 of 3 passed | 3 of 3 failed, 34 counted |
| c01 The picked tiles' border 15 % lighter | **2 of 2 passed** | failed, 55 counted |
| c15 As c01, 5 % lighter | **2 of 2 passed** | failed, 46 counted |
| c16 As c01, on one picked tile only | **2 of 2 passed** | failed, 32 counted |
| c07 The check badges moved 1 pixel down | **2 of 2 passed** | **passed** |
| c06 One picked tile's corners: radius 8 to 9 | 2 of 2 failed, 66 counted | failed, 61 counted |
| c14 As c01, 30 % lighter | 2 of 2 failed, 72 and 74 counted | failed, 72 counted |

So with 60, the check lets through three border changes that it catches at 25. The badge moved by a pixel passes at either tolerance: that is a limit the tolerance of 25 already has, in the sense of the [tolerance record](2026-10-21-fb-19-screenshot-tolerance.md) §6, and not something row 30 asked about.

## 6. Making the image draw the same way every run

Two story-level fixes were tried, neither committed:

- **Waiting for the photos before the clicks.** A trial story that waits for every photo to load and decode before picking the two tiles ([`scripts/trial-story.diff`](evidence/2026-11-05-fb-19-media-picker-image-investigation/scripts/trial-story.diff)), built into a separate Storybook. In 40 runs of both modes the light image counted 0 in 12 and 2 to 34 in the other 28, 34 in 20 of them, and the dark image counted up to 25. It made the second shading more frequent, not less, and was dropped.
- **A forced repaint after the clicks.** The same repaint §3 describes, done after the story's steps, drew both images identically in every one of 40 runs. Against today's references they count 34 in light and 25 in dark, so adopting it would mean a change to the story's steps (or to the check, for this one story), two new reference images captured in the pinned image and reviewed like any other reference change, and two full CI visual runs to show that CI's processors draw it the same way, which this session could not show. It would keep the tolerance of 25 and remove the variation rather than allow it. It is a way of capturing the image, not a change to the component: users see either shading, and the difference is the edge of a photo's rounded corner.

## 7. The outcome, and the choice left for the owner

Row 30 settles the allowance: condition 3 cannot be met, so the light image keeps the tolerance of 25 every other image has, and no allowance is added. Nothing needs changing for that, and nothing was changed. The threshold of 0.005 and every other image's tolerance stay as they are.

What remains open is whether to do anything about the occasional failure. This session's recommendation, for the owner to decide:

- **Recommended: adopt the forced repaint (§6) in its own pull request**, with the story's two new reference images for review, kept only if both full CI visual runs pass on its final commit at the tolerance of 25. If CI draws it differently, the pull request closes and nothing changes.
- **Alternative: leave it.** The light image fails about once in a hundred CI runs, as it did once in about 95 since batch 3, and its dark image could too (once locally, never in CI). Each failure costs a re-run of 35 to 50 minutes, and the job log now shows the difference without the artifact.

## 8. Local and CI results, kept apart

- **Local, this session.** Every count in §2 to §6, on a Linux container with 4 cores of an Intel Xeon at 2.30 GHz, in the pinned image `mcr.microsoft.com/playwright:v1.64.1-noble` by its digest, with the Storybook built at `fa490537`, `main` after #70; nothing the check or the story reads changed on `main` since. No reference image was written: captures went to a separate folder. 665 runs in all: 621 captures and 44 runs of the visual check.
- **CI.** No CI run was started by this investigation. The CI facts are read from GitHub's records: run 41877259668's first attempt and its log (§1), and the failed attempts since 2026-10-26 ([`ci/failed-attempts-since-2026-10-26.txt`](evidence/2026-11-05-fb-19-media-picker-image-investigation/ci/failed-attempts-since-2026-10-26.txt)). A passing comparison logs no count, so the passing runs do not show how close they came.

## 9. Evidence

In [`evidence/2026-11-05-fb-19-media-picker-image-investigation/`](evidence/2026-11-05-fb-19-media-picker-image-investigation/), every log as `.txt`:

- `ci/`: the failing attempt's log excerpt with its two crops as the log gives them, the crops decoded (`actual-crop.png`, `expected-crop.png`), and the scan of every failed attempt since 2026-10-26;
- `corners-zoomed.png`: three corners, twelve times enlarged, from the reference, CI's image and the matching local run;
- `scripts/`: the capture, diagnostic, check and trial-story configurations, `diag-spec.diff` (the diagnostic hooks added to a copy of `visual/stories.spec.ts`; nothing else in it differs), `trial-story.diff`, `loop.sh`, `check.sh`, `score.cjs` and `corners.py`. They ran from `packages/liquorify-storybook/tolerance/`, which is not committed;
- `changes/`: each deliberate change; `diagnostics/`: the whole-pixel diagnostics, which are not changes under test;
- `scores/`: every capture's counts as JSON, and `runs.txt`, one line per local run, the visual check's runs included.

The captured images are not committed: each differs from the reference only by the change named, or by the corners §2 describes.

## 10. Limitations

- **Sampled machines.** One local machine and the CI attempts GitHub kept are a sample. The ceiling of 34 holds for the corners seen; a flip elsewhere in the image would raise it.
- **Cause inside the browser not traced** (§3). The variation is described, bounded and, with a forced repaint, removed locally; why the browser picks a shading was not found.
- **Changes added to the page, not built.** §4's rules were added after the story drew, not built into the Storybook. The repainted measures show the same outcome, but a change that alters how the page first lays out could draw differently when built.
- **Automated, not independent.** The same session chose the changes and scored them. Nothing here is the owner's review, and no gap, defect or criterion changes.
