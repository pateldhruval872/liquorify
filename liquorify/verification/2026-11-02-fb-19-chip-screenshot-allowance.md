---
title: Screenshot allowance for two option chip images
record: verification
work_item: FB-19
date: 2026-11-02
verifier: Claude (automated session); not independent review
result: PASS for an allowance of 60 counted pixels on exactly two dark images, the two stories that show the variants options builder's chips. Unchanged runs counted at most 43 pixels on either image, 38 in CI, and every one of nine deliberate changes to the chips' colours, borders and layout counted 78 pixels or more on both images, so each still fails. Four of the changes were also run through the visual check itself, with the allowance in place, and failed both images. Every other image keeps the threshold of 0.005 and the 25-pixel allowance. Both CI runs of the whole visual check at `dfb5ae23` passed all 1,616 comparisons, with Tests and Packages (§6)
---

# Screenshot allowance for two option chip images

**Claim.** Two dark reference images from [part 1 of the catalog and pricing batch](2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md) now and then differ from unchanged runs by more than the 25 pixels the visual check allows ([tolerance record](2026-10-21-fb-19-screenshot-tolerance.md)). The difference is faint shading at the ends of the option chips' rounded borders, and nothing visible changes. It is variation observed across sampled runners in CI, and on this session's machine. The owner chose, on 2026-11-02, to allow up to 60 counted pixels for exactly those two story IDs in dark mode, using the existing reference images, and to keep the threshold of 0.005 and the 25-pixel allowance everywhere else. This record gives the measured differences, and shows that representative deliberate changes to the chips' colours, borders and layout still fail under the allowance. Its cause is not established.

**Results.**

| # | Criterion | Result |
|---|---|---|
| 1 | The allowance applies only to the two named images | PASS: `visual/stories.spec.ts` names the two story IDs with the dark mode. The check stops before any comparison if either name no longer matches a story and mode it captures, so a renamed story cannot silently keep or lose the allowance. The threshold and the 25 pixels in `visual/playwright.config.ts` are unchanged |
| 2 | Unchanged runs stay within 60 | PASS: the largest count measured was 43 pixels, on this session's machine; in CI it was 38 (§2) |
| 3 | Deliberate changes to the chips fail under 60 | PASS: all nine changes fail both dark images. The smallest, the add-value chip's dashed border drawn solid, counted 78 pixels (§3) |
| 4 | The visual check itself fails the changes with the allowance in place, and passes unchanged runs | PASS: four changes failed both dark images, and the unchanged run passed all four images (§4) |
| 5 | The whole visual check passes twice in CI on one revision | PASS: both runs at `dfb5ae23` passed all 1,616 comparisons, and Tests and Packages passed (§6) |

## 1. The two images

| Story | Story ID | Mode | Allowance |
|---|---|---|---|
| Variants section: Options from the product type | `dashboard-core-product-form-variants-section--seeded-from-type` | dark | 60 |
| Variants options builder: Awaiting values | `dashboard-core-product-form-variants-options-builder--awaiting-values` | dark | 60 |

Both stories show the product page's option chips (`packages/dashboard-core/src/products/variants-options-builder.tsx`): small fully rounded buttons with a one-pixel border, white at 16 % opacity on the dark card. The chip that adds a value has a dashed border. The difference between runs sits at the lower ends of those rounded borders. Their light images never differed.

## 2. Measured differences

"Counted" is the number of pixels Playwright counts at the threshold of 0.005, which is what the check compares with its allowance. "Changed" is every pixel that differs at all, and "largest" the largest change in one colour channel, out of 255.

### In CI

Each row is a whole visual check on GitHub's runners. The processor is the one the check's log names; the log names it only for a failed comparison, from `4c2a3f61` on.

| Run | Revision | Processor | Image that failed | Changed | Largest | Counted |
|---|---|---|---|---|---|---|
| [41386307065](https://github.com/pateldhruval872/liquorify/actions/runs/41386307065) | `db550f1d` | not logged | Awaiting values | not logged | not logged | 37 |
| [41407136796](https://github.com/pateldhruval872/liquorify/actions/runs/41407136796) | `0be0dc68` | not logged | Options from the product type | not logged | not logged | 37 |
| [41407138018](https://github.com/pateldhruval872/liquorify/actions/runs/41407138018) | `0be0dc68` | not logged | Options from the product type | not logged | not logged | 37 |
| [41410767799](https://github.com/pateldhruval872/liquorify/actions/runs/41410767799) | `4c2a3f61` | AMD EPYC 9V74 | Options from the product type | 116 | 12 | 37 |
| [41410770788](https://github.com/pateldhruval872/liquorify/actions/runs/41410770788) | `4c2a3f61` | AMD EPYC 7763 | Options from the product type | 116 | 12 | 37 |
| [41414987837](https://github.com/pateldhruval872/liquorify/actions/runs/41414987837) | `b4130c28` | AMD EPYC 7763 | Options from the product type | 116 | 12 | 37 |
| [41415160663](https://github.com/pateldhruval872/liquorify/actions/runs/41415160663) | `b4130c28` | AMD EPYC 7763 | Options from the product type | 116 | 12 | 37 |
| [41420486582](https://github.com/pateldhruval872/liquorify/actions/runs/41420486582) | `f718e75e` | not logged | neither | | | 25 or fewer |
| [41424639383](https://github.com/pateldhruval872/liquorify/actions/runs/41424639383) | `f718e75e` | Intel Xeon Platinum 8573C | Options from the product type | 119 | 14 | 38 |
| [41428473224](https://github.com/pateldhruval872/liquorify/actions/runs/41428473224) | `d82c4c29` | AMD EPYC 9V74 | Options from the product type | 116 | 12 | 37 |

None of these revisions changed the chips or their reference images. In ten runs, one image or the other failed in nine, and never both in the same run. Processors of different makes gave the same counts, and the same machine both passes and fails below, so the sample does not tie the difference to a kind of machine.

### On this session's machine

The reference images were made on this session's machine, in the same pinned Playwright image CI uses. In part 1's earlier local runs it never reproduced the difference: every whole local check passed both images, and "Awaiting values" passed 20 more runs in each theme. In the runs for this record, at the allowance's revision, it did:

| Runs | Options from the product type | Awaiting values |
|---|---|---|
| Two captures, scored as §3 scores the changes | 37 and 37 counted (116 changed, largest 12) | 1 and 0 counted |
| The visual check with the allowance | passed | passed |
| The visual check with the allowance set back to 25 | passed | failed: 43 counted (178 changed, largest 14) |
| Ten repeats with the allowance set to 1 pixel, so every count shows | 37 counted in 4 runs, 2 in one, 0 or 1 in 5 | 43 and 40 counted in 2 runs, 0 or 1 in 8 |

So the difference comes and goes on one machine, run to run, as well as between machines.

## 3. Deliberate changes

Each change was added to the Storybook's stylesheet for dark mode only, the Storybook rebuilt, and both stories captured in both modes in the pinned image, without touching the references. Each capture was scored with Playwright's own comparison at the threshold of 0.005, as in the [tolerance record](2026-10-21-fb-19-screenshot-tolerance.md) §2. The light images were identical to their references in every capture.

| Change | What it alters | Options from the product type, counted | Awaiting values, counted | Fails at 60 |
|---|---|---|---|---|
| k1 | The chips' background: the dark background token 1 % lighter | 5,198 | 4,050 | Both |
| k2 | The chips' border colour: white at 16 % opacity raised to 20 % | 392 | 301 | Both |
| k3 | The chips' text: the dark foreground token 3 % darker | 608 | 353 | Both |
| k4 | The chips' border removed, which also makes each image 2 pixels shorter | 10,385 | 5,740 | Both |
| k5 | The chips' corners: fully rounded changed to a 6-pixel radius | 561 | 562 | Both |
| k6 | The add-value chip's dashed border drawn solid | 113 | 80 | Both |
| k7 | The chips' side padding: 12 pixels to 13 | 1,681 | 1,338 | Both |
| k8 | The gap between chips: 8 pixels to 9 | 1,152 | 909 | Both |
| k9 | The chips moved 1 pixel down | 1,556 | 1,029 | Both |
| none | Unchanged, two captures | 37 and 37 | 1 and 0 | Neither |

Some captures of "Options from the product type" also carry the variation of §2, which adds to the change's own count: k6's 113 is the 78 the change counts alone (§4) plus the variation. Every change but k6 changes hundreds or thousands of pixels in both images.

## 4. The allowance in the visual check

With the allowance in place, the visual check itself was run for the two stories, both modes, on an unchanged Storybook and on four of the changes:

| Run | Options from the product type, dark | Awaiting values, dark | Light images |
|---|---|---|---|
| Unchanged | passed | passed | passed |
| k2, border colour | failed: 404 counted | failed: 301 counted | passed |
| k5, corners | failed: 562 counted | failed: 562 counted | passed |
| k6, dashed border drawn solid | failed: 78 counted | failed: 78 counted | passed |
| k8, gap between chips | failed: 1,142 counted | failed: 909 counted | passed |

The stylesheet was restored after each change, and the Storybook rebuilt unchanged.

## 5. Why 60, and what it does not catch

- **60** is above the largest count measured on an unchanged run, 43, and below the smallest count of a deliberate change, 78. The owner set it when the largest known count was 38; the later local count of 43 still fits under it. The margin is 17 pixels below and 18 above, which is not large on either side.
- **What the two images no longer catch:** a change to them that counts between 26 and 60 pixels, such as a change confined to one chip's corner. Their light images keep 25, and so do the nine other stories of the same two components in both modes, such as Two options and With options.
- **Everything the tolerance record's §6 lists** still applies: a change of one level, a change confined to the smoothed edges Playwright leaves out, and a state no story shows.

## 6. CI

`2e61ae11` commits the allowance, just before this record, and `dfb5ae23` adds this record. The whole visual check then ran twice on GitHub's runners at `dfb5ae23`:

| Run | Result |
|---|---|
| [Storybook 41461820876](https://github.com/pateldhruval872/liquorify/actions/runs/41461820876), from the pull request | All 1,616 passed, in 29.3 minutes |
| [Storybook 41461817488](https://github.com/pateldhruval872/liquorify/actions/runs/41461817488), started by hand | All 1,616 passed, in 25 minutes |
| [Tests 41461820702](https://github.com/pateldhruval872/liquorify/actions/runs/41461820702) and [Packages 41461820891](https://github.com/pateldhruval872/liquorify/actions/runs/41461820891) | Every job passed |

A passing comparison logs no count, so these runs do not show whether the variation occurred in them. The allowance changes no reference image, and the check stays advisory.

## 7. Evidence

In [`evidence/2026-11-02-fb-19-chip-screenshot-allowance/`](evidence/2026-11-02-fb-19-chip-screenshot-allowance/):
- `capture.config.ts`: the capture configuration, which extends the visual check's and writes images to a separate folder;
- `changes/`: each deliberate change;
- `score.cjs`: the scoring script, with Playwright's own comparison;
- `captures.json`: §3's counts for every capture, both modes;
- `visual-check-runs.json`: §2's and §4's runs of the visual check itself.

The captured images are not committed: they differ from the references only by the change named, or by the variation §2 describes.

## 8. Limitations

- **Sampled runners only.** Ten CI runs and this session's machine are a small sample. A later run that counts more than 60 on either image without a change is a reason to revisit the allowance, recorded in a new record, as is any other image that fails without a change: batch 1's sidebar user without a name counted 29 pixels once, at `0be0dc68`, and has passed in every other run.
- **Cause not established.** The difference comes and goes on one machine as well as between machines, so it is not a fixed property of one kind of machine. It was not traced further than these measurements.
- **Automated, not independent.** The same session chose the changes and scored them. This record did not decide the owner's review of part 1's images and fidelity; the owner accepted them on 2026-11-02 ([part 1 record §11](2026-11-02-fb-19-batch-catalog-and-pricing-part-1.md#11-the-owners-review-2026-11-02)).
