---
title: The media picker image, repainted before its capture (row 30's follow-up)
record: verification
work_item: FB-19; row 30 of the owner decision brief, batch 3's "Media picker sheet: Two picked"
date: 2026-11-05
verifier: Claude (automated session, thread "Investigate media picker image tolerance"); not independent review
result: "PASS locally: with the page painted once more before its capture, the story's light and dark images were identical, byte for byte, in 40 of 40 runs, and the committed visual check passed 20 of 20 times against the two new reference images, at the tolerance of 25. The new images differ from the old ones mostly at the tiles' rounded photo corners, and also, by a few pixels, at other curved edges: the light image at one tile's border corner, and the dark image at the search field's corners, a check badge's outline, one tile's border corner and one corner of a button (§2). PASS in CI: two full visual runs on GitHub passed every image at 25, the story's two included, and two more passed each time main was merged in again, after batch 8's first part and after its second part. Both images accepted as delegated acceptance (Claude) under the owner's decision of 2026-11-09."
---

# The media picker image, repainted before its capture (row 30's follow-up)

**What this records.** The [investigation of row 30](2026-11-05-fb-19-media-picker-image-investigation.md) found that batch 3's story "Media picker sheet: Two picked" draws each tile's rounded photo corners in one of two shadings from run to run, by up to 34 counted pixels, and that the image therefore keeps the tolerance of 25 with no allowance. It offered one fix: paint the page once more after the story's clicks, which drew both images identically in every local run. On 2026-11-05 the owner chose that fix on the decision card in this thread, on the condition the card stated: a small pull request with the story's two new reference images, kept only if two full visual runs pass on GitHub at the tolerance of 25. This record is that pull request's evidence. On 2026-11-09 the owner delegated the acceptance of both new images (§2.1). The threshold, the tolerance of 25 and every other image's tolerance are unchanged.

## 1. The change

| What | Detail |
|---|---|
| The visual check | `packages/liquorify-storybook/visual/stories.spec.ts` names the stories to repaint before their capture, in `repaintBeforeCapture`, which holds only `dashboard-core-media-picker-sheet--two-picked`. For that story, in both modes, the check sets the page's opacity to 0.999 for 200 milliseconds and back, waits 200 milliseconds more, and then captures as before. The check refuses to start if the list names a story that does not exist, as it does for the pixel allowances |
| Why in the check, not in the story | It is exactly what the investigation measured (§3 and §6 there). The story's steps stay as Storybook and anyone reading it see them, and nothing the component draws changes |
| The two reference images | `visual/__screenshots__/dashboard-core-media-picker-sheet--two-picked/light.png` and `dark.png`, captured again with the repaint (§2) |
| Not changed | The story, the component, the threshold of 0.005, the tolerance of 25, the two chip images' allowance of 60, and every other reference image |

## 2. The new reference images

Both were captured with the check's own update script in the pinned Playwright image, from the Storybook built at `01b2092d`: `sh visual/in-image.sh --update-snapshots=all --grep "Media picker sheet / Two picked"`. The script's usual `changed` mode would have rewritten only the light image, because the dark one differs from its old reference by exactly 25 counted pixels, which passes; both had to change for the variation to go.

Each new image is identical, byte for byte, to the investigation's runs with a repaint forced. Against the old references, every changed pixel, grouped by where it is ([`scores/old-vs-new-regions-light.json`](evidence/2026-11-05-fb-19-media-picker-image-repaint/scores/old-vs-new-regions-light.json) and [`-dark.json`](evidence/2026-11-05-fb-19-media-picker-image-repaint/scores/old-vs-new-regions-dark.json), which list each pixel):

| Image | Where | Changed | Counted at 0.005 | Largest change, of 255 |
|---|---|---|---|---|
| Light | The top corners of all four tiles' photos | 92 | 34 | 34 |
| Light | The bottom-right corner of the fourth tile's border | 7 | 0 | 2 |
| **Light, in all** | | **99** | **34** | **34** |
| Dark | The top corners of the photos of "Clay mug", "Slate cap" and "banner-lilac.png"; the first tile's did not change | 70 | 23 | 32 |
| Dark | The outline of "Clay mug"'s check badge | 20 | 0 | 7 |
| Dark | The right end of the search field, at its top and bottom corners | 15 | 2 | 3 |
| Dark | The bottom-right corner of the fourth tile's border | 1 | 0 | 1 |
| Dark | The top-left corner of the "Add selected" button | 1 | 0 | 27 |
| **Dark, in all** | | **107** | **25** | **32** |

So most of the change is at the photos' corners, where the investigation saw the variation, but not all of it. Outside the photo corners the light image changed 7 pixels and the dark image 37, of which the check counts 2, both at the search field's corners. Every one of these is on a curved edge drawn with smoothing, which the extra paint redraws; none moves or recolours anything. The repainted images then stayed the same, byte for byte, in every later run (§3), these edges included.

**Image review: delegated acceptance (Claude, under the owner's delegation of 2026-11-04).** Both pairs were looked at side by side at full size ([`review/light-old-new.png`, `dark-old-new.png`](evidence/2026-11-05-fb-19-media-picker-image-repaint/review/)), the tiles' top row twelve times enlarged with the difference amplified (`light-corners-zoom.png`, `dark-corners-zoom.png`), every changed region marked on the new image (`light-changed-regions.png`, `dark-changed-regions.png`), and each region outside the photo corners six times enlarged, old beside new, with the difference amplified eight times (`light-outside-photo-corners-zoom.png`, `dark-outside-photo-corners-zoom.png`). The sheet, its four tiles, the two picked tiles' borders, rings and check badges, the focus outline, the names, the search field and the footer are the same in both. Every change is a slightly different shade along one of the curved edges in the table, which the eye does not see at full size; the largest outside the photo corners, 27 of 255, is a single pixel at the button's corner.

### 2.1 The owner's decision of 2026-11-09

The owner first asked to review the two images in this pull request. On 2026-11-09 they delegated that instead, in the project chat: "#77: I explicitly delegate acceptance of both new reference images. Review the supplied comparisons, record delegated acceptance and merge once the agreed checks and visual evidence hold on the final revision. Keep the tolerance at 25 and the change scoped to this story. Correct the record to describe all measured differences—the dark image's table includes pixels beyond the photo corners."

The review above is that delegated acceptance, of both images, made again on 2026-11-09 against every measured difference rather than the corners alone; it is not the owner's own review. Earlier versions of this record said the images differed "only at the tiles' rounded photo corners", which the table shows was not true of the dark image, nor of seven pixels of the light one. The tolerance stays 25, and the repaint still applies to this one story only.

## 3. Local results

All in the pinned image `mcr.microsoft.com/playwright:v1.64.1-noble`, by its digest, on a Linux container with 4 cores of an Intel Xeon at 2.30 GHz, with the Storybook built at `01b2092d` ([`scores/runs.txt`](evidence/2026-11-05-fb-19-media-picker-image-repaint/scores/runs.txt)).

| Runs | Result |
|---|---|
| 40 captures of the story's two modes, two at a time as CI runs them, with the committed spec | Every light and every dark image identical, byte for byte, to its new reference |
| 20 runs of the committed visual check for the story, unchanged, at 25 | 20 of 20 passed |
| 3 runs of the committed visual check for the media picker sheet's seven stories, 14 images | 3 of 3 passed |

**Deliberate changes, at 25.** With nothing left to vary, the check now sees each change alone. The investigation's diagnostic copy of the spec added each change's rule and then the same repaint, against the new references:

| Change, light image | Counted | At 25 |
|---|---|---|
| c01 The picked tiles' border 15 % lighter | 61 | Failed |
| c14 As c01, 30 % lighter | 76 | Failed |
| c15 As c01, 5 % lighter | 34 | Failed |
| c16 As c01, on one picked tile only | 36 | Failed |
| c06 One picked tile's corners: radius 8 to 9 | 49 | Failed |
| c07 The check badges moved 1 pixel down | 22 | Passed |
| Unchanged, 3 runs | 0 | Passed |

The other ten changes of the investigation counted 211 or more against the same baseline. The badge moved by a pixel passed at 25 before this change too: that is a limit the tolerance of 25 already has ([tolerance record](2026-10-21-fb-19-screenshot-tolerance.md) §6), not one this change adds.

## 4. CI

The change is kept only if two full visual runs on GitHub pass with it at the tolerance of 25. It was run three times, each time on the pull request's own run and on one started by hand, both on the same commit ([`scores/ci-runs.txt`](evidence/2026-11-05-fb-19-media-picker-image-repaint/scores/ci-runs.txt)):

| Commit | Run | Started by | Result |
|---|---|---|---|
| `a82d746d`, with main merged in after #75 and #76 | [Storybook run 233](https://github.com/pateldhruval872/liquorify/actions/runs/41993000293) | By hand | All four parts passed, 752 of 752 images each; 08:15 to 08:30 UTC |
| `a82d746d` | [Storybook run 234](https://github.com/pateldhruval872/liquorify/actions/runs/41993001072) | The pull request | All four parts passed, 752 of 752 images each; 08:15 to 08:33 UTC |
| `67ad9650`, with main merged in after batch 8's part 1 (#80) | [Storybook run 247](https://github.com/pateldhruval872/liquorify/actions/runs/42021130775) | The pull request | All four parts passed, 825, 825, 824 and 824 images; 11:42 to 12:00 UTC |
| `67ad9650` | [Storybook run 248](https://github.com/pateldhruval872/liquorify/actions/runs/42021140187) | By hand | All four parts passed, 825, 825, 824 and 824 images; 11:42 to 12:01 UTC |
| `e7fbb4ab`, with main merged in after batch 8's part 2 (#84), on 2026-11-08 | [Storybook run 258](https://github.com/pateldhruval872/liquorify/actions/runs/42530476474) | The pull request | All four parts passed, 931, 931, 930 and 930 images; 22:29 to 22:47 UTC |
| `e7fbb4ab` | [Storybook run 259](https://github.com/pateldhruval872/liquorify/actions/runs/42530481590) | By hand | All four parts passed, 931, 931, 930 and 930 images; 22:29 to 22:53 UTC |

The second pair was run because batch 8's first part merged into main before this pull request, adding 145 stories, and its merge changed the shared search mock; the third because batch 8's second part merged on 2026-11-08 and left a conflict in the records index. In every pair the story's two images are in part 1: the check's own listing of that part, from a Storybook built at the same commit, puts them 195th and 196th, and in no other part. Part 1 passed every image in all six runs. The pull request's other checks passed on all three commits too, 39 of them each time, with the six release jobs skipped.

The pull request merges only once both full runs, the pull request's own and one started by hand, and its other checks have passed on its final commit, the one that merges; those last runs are on the pull request's checks, since recording them here would make a new commit.

The commit that first added these results, `1a5830e7`, changed only records, but it did start the visual check again, because the check looks at the whole pull request's files: that run, [Storybook run 236](https://github.com/pateldhruval872/liquorify/actions/runs/41996317791), passed as well, as did [run 249](https://github.com/pateldhruval872/liquorify/actions/runs/42024521596) on the next records commit, `58aaba81`.

## 5. Evidence

In [`evidence/2026-11-05-fb-19-media-picker-image-repaint/`](evidence/2026-11-05-fb-19-media-picker-image-repaint/), every log as `.txt`:

- `review/`: the old and new images side by side, light and dark; the tiles' top row enlarged with the difference amplified eight times; every changed region marked on the new image; and each region outside the photo corners enlarged;
- `scores/`: the new references against the old (`new-references-vs-old.json`) and against the 40 captures (`new-references-vs-40-runs.json`), `runs.txt`, one line per local run, and `ci-runs.txt`, the CI runs part by part, and `old-vs-new-regions-light.json` and `-dark.json`, every changed pixel by region, with whether the check counts it;
- `scripts/`: `check-committed.sh` (the committed check, run several times), `regions.cjs` and `review-regions.py` (the regions and their review images), with the capture and check scripts the investigation used.

## 6. Limitations

- **CI's processors.** Locally the repainted image never varied. CI's runners use other processors; §4's runs passed, but a few runs show the image within 25 there, not that it never varies. A later failure on this image is a reason to revisit the fix in a new record.
- **One story.** The repaint applies to this story only. The two dark chip images keep their allowance of 60, and no other image is repainted.
- **Cause inside the browser not traced.** As the investigation says, why the browser picks a shading was not found; the repaint makes it pick the same one.
- **Automated, not independent.** The same session made the change and checked it. The image review is delegated acceptance under the owner's decision of 2026-11-09, not the owner's own review.
