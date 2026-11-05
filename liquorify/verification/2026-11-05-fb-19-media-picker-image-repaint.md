---
title: The media picker image, repainted before its capture (row 30's follow-up)
record: verification
work_item: FB-19; row 30 of the owner decision brief, batch 3's "Media picker sheet: Two picked"
date: 2026-11-05
verifier: Claude (automated session, thread "Investigate media picker image tolerance"); not independent review
result: "PASS locally: with the page painted once more before its capture, the story's light and dark images were identical, byte for byte, in 40 of 40 runs, and the committed visual check passed 20 of 20 times against the two new reference images, at the tolerance of 25. The new images differ from the old ones only at the tiles' rounded photo corners. CI: two full visual runs on the change's commit are pending, and are recorded in §4 before the pull request merges."
---

# The media picker image, repainted before its capture (row 30's follow-up)

**What this records.** The [investigation of row 30](2026-11-05-fb-19-media-picker-image-investigation.md) found that batch 3's story "Media picker sheet: Two picked" draws each tile's rounded photo corners in one of two shadings from run to run, by up to 34 counted pixels, and that the image therefore keeps the tolerance of 25 with no allowance. It offered one fix: paint the page once more after the story's clicks, which drew both images identically in every local run. On 2026-11-05 the owner chose that fix on the decision card in this thread, on the condition the card stated: a small pull request with the story's two new reference images, kept only if two full visual runs pass on GitHub at the tolerance of 25. This record is that pull request's evidence. The threshold, the tolerance of 25 and every other image's tolerance are unchanged.

## 1. The change

| What | Detail |
|---|---|
| The visual check | `packages/liquorify-storybook/visual/stories.spec.ts` names the stories to repaint before their capture, in `repaintBeforeCapture`, which holds only `dashboard-core-media-picker-sheet--two-picked`. For that story, in both modes, the check sets the page's opacity to 0.999 for 200 milliseconds and back, waits 200 milliseconds more, and then captures as before. The check refuses to start if the list names a story that does not exist, as it does for the pixel allowances |
| Why in the check, not in the story | It is exactly what the investigation measured (§3 and §6 there). The story's steps stay as Storybook and anyone reading it see them, and nothing the component draws changes |
| The two reference images | `visual/__screenshots__/dashboard-core-media-picker-sheet--two-picked/light.png` and `dark.png`, captured again with the repaint (§2) |
| Not changed | The story, the component, the threshold of 0.005, the tolerance of 25, the two chip images' allowance of 60, and every other reference image |

## 2. The new reference images

Both were captured with the check's own update script in the pinned Playwright image, from the Storybook built at `01b2092d`: `sh visual/in-image.sh --update-snapshots=all --grep "Media picker sheet / Two picked"`. The script's usual `changed` mode would have rewritten only the light image, because the dark one differs from its old reference by exactly 25 counted pixels, which passes; both had to change for the variation to go.

Each new image is identical, byte for byte, to the investigation's runs with a repaint forced. Against the old references:

| Image | Changed | Largest change | Counted | Where |
|---|---|---|---|---|
| Light | 99 | 34 of 255 | 34 | The four tiles' rounded top photo corners, and one bottom corner, between x 690 to 1253 and y 171 to 327 |
| Dark | 107 | 32 of 255 | 25 | The same corners, the edge of "Clay mug"'s check badge, the right end of the search field, and one pixel at a corner of the "Add selected" button |

**Image review: delegated acceptance (Claude, under the owner's delegation of 2026-11-04).** Both pairs were looked at side by side at full size, and the tiles' top row twelve times enlarged with the difference amplified ([`review/`](evidence/2026-11-05-fb-19-media-picker-image-repaint/review/)). The sheet, its four tiles, the two picked tiles' borders, rings and check badges, the focus outline, the names, the search field and the footer are the same in both. The only change is the shading at the curve of each photo's rounded corner, which the eye does not see at full size. The owner asked to review these two images in this pull request; this delegated look does not replace that.

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

Pending. The change is kept only if two full visual runs on GitHub pass with it at the tolerance of 25: the pull request's own run and one started by hand, on the same commit. Their results are recorded here before the pull request merges, in a commit that changes only this record.

## 5. Evidence

In [`evidence/2026-11-05-fb-19-media-picker-image-repaint/`](evidence/2026-11-05-fb-19-media-picker-image-repaint/), every log as `.txt`:

- `review/`: the old and new images side by side, light and dark, and the tiles' top row enlarged with the difference amplified eight times;
- `scores/`: the new references against the old (`new-references-vs-old.json`) and against the 40 captures (`new-references-vs-40-runs.json`), and `runs.txt`, one line per local run;
- `scripts/`: `check-committed.sh` (the committed check, run several times), with the capture and check scripts the investigation used.

## 6. Limitations

- **CI's processors.** Locally the repainted image never varied. CI's runners use other processors; §4's two runs are the evidence that they draw it the same way, and a later failure on this image is a reason to revisit the fix in a new record.
- **One story.** The repaint applies to this story only. The two dark chip images keep their allowance of 60, and no other image is repainted.
- **Cause inside the browser not traced.** As the investigation says, why the browser picks a shading was not found; the repaint makes it pick the same one.
- **Automated, not independent.** The same session made the change and checked it. The image review is delegated acceptance, not the owner's review.
