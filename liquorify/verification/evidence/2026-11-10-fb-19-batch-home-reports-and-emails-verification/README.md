# FB-19 batch 11 verification: evidence

The results behind the [verification record](../../2026-11-10-fb-19-batch-home-reports-and-emails-verification.md). They come from the scripts in `packages/liquorify-storybook/fidelity/`: `b11-email-behaviours.spec.ts`, `b11-report-behaviours.spec.ts`, `b11-permissions.spec.ts` and `compare-batch-11-verification.spec.ts`, at `d78e0491`, in the pinned Playwright 1.64.1 image.

**Masking.** Each store identifier is written as `<store>`, the test servers' addresses as `<site>`, and machine paths are removed. No token, key or password appears. Customer addresses are made up, on `example.com`.

**Image format.** Every image is lossless WebP, converted from the PNG each script wrote and checked pixel for pixel against it.

| Folder | Holds |
|---|---|
| `behaviours/` | Run 2's results for behaviours 1 to 12: one JSON file per behaviour with what the screen showed, the sent emails and the Admin API's answers, and the images each test took |
| `permissions/` | `g-103-permissions.json`: each of the 28 requests, its role and permissions, the expected answer, the answer with its message, and whether they match; and whether the saved report the analyst was refused changing was left unchanged |
| `comparison/<case>/` | `<theme>-side-by-side.webp`, the running screen on the left and the story on the right, and `<theme>-styles.json`, the computed styles compared and every one that differs |
| `runs/` | `run1.txt` and `run2.txt`, the two recorded runs; `sabotage.txt` and `sabotage-failures.json`, the sabotaged run and where each test failed; `permissions-after-sabotage-change.txt`, the permission script once more after `d26c3e45`; `comparison.txt` and `comparison-extra.txt`, the comparison runs |
