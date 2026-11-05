# Evidence: SD-8 fixed, sample data for a store that does not sell US dollars

The runs behind the [verification record](../../2026-11-04-sd-8-sample-data-currency-fix.md). Local checkout and scratch paths in the logs are replaced with `<checkout>`, `<storefront checkout>` and `<scratch>`. No key or token is saved here.

**Correction, 2026-11-05: the logs named below are not in the repository.** The repository ignores every file whose name ends in `.log` (the root `.gitignore`, `**/*.log`), so these logs were never committed with #44: the ten spec logs under `specs/`, and the runs' `setup-check.log` and `storefront/build-summary.log` files. They were made and read in the working copy of the thread that ran the checks, and its acceptance was given on them there. No copy was found in the repository's history or in the project's shared files, so they are not added back, and each is marked *not committed* below. What they showed is recorded only in the [verification record's](../../2026-11-04-sd-8-sample-data-currency-fix.md) text.

What the repository does hold for these checks:

- Every run's first-run results (`first-run-sample-data*.json`), welcome screen captures, and storefront results and screenshots, for checks 3 to 5.
- Spree's spec itself, `spree/core/spec/services/spree/sample_data/loader_spec.rb`, which runs in CI's core jobs. It passed on PostgreSQL and MySQL on #44's final commit ([merge record §3](../../2026-11-04-sd-8-sample-data-currency-fix-merge.md#3-required-checks-on-the-final-commit)), and it runs again on every later pull request. That covers checks 1, 2 and 2a after the fix. The results before the fix, and the SQLite runs, have no committed log.

Evidence logs are saved with a `.txt` name from now on, so that they are committed.

## `specs/`: Spree's spec

Not committed: none of these ten logs is in the repository (see the correction above). As described when they were made, each started with a line naming its database, revision and Ruby version, and ended with its exit code.

| File | What ran | Result |
|---|---|---|
| `1-main-spec-on-main-pg.log` (*not committed*) | `main`'s loader spec, on `main` `87a2ea8`, PostgreSQL | 21 of 21, 48.8 seconds |
| `2-new-checks-before-fix-pg.log`, `…-sqlite.log` (*not committed*) | The branch's loader spec at `67a35ef`, before the fix | 23 of 29 on each; the failures are listed at the end of each log |
| `3-main-spec-on-fix-sqlite.log` (*not committed*) | `main`'s loader spec, unchanged, on the fix at `273956a`, SQLite | 21 of 21 |
| `4-new-checks-with-fix-pg.log`, `…-sqlite.log` (*not committed*) | The branch's loader spec with the fix | 29 of 29 on each |
| `5-sample-data-specs-3b9ca71-pg.log`, `…-sqlite.log` (*not committed*) | Spree's sample data specs (the loader, its job and the sample files) after `main` was merged in | 44 of 44 on each |
| `6-sample-data-specs-bbf401c-pg.log`, `…-sqlite.log` (*not committed*) | The same, at the final code revision | 44 of 44 on each |

## `runs/`: first-run setup and the storefront

One folder per run. `before-us` and `before-pl` used the sample data files as they are on `main`. `final-us`, `final-pl` and `final-de` used the final code revision, `bbf401c`. The `revision` field inside each file names its run.

| File | What it is |
|---|---|
| `first-run-sample-data*.json` | What the first-run check found: the merchant's answers, the sample data's products, orders, imports with their failed rows, and price lists, and the 28 checks of the defaults setup gave the new store |
| `setup-check.log` (*not committed*, in any run) | The first-run check's output, with its revision, start and exit code |
| `welcome/` | The welcome screen (DA-SETUP-01), light and dark, captured as setup finished, with each capture's details |
| `storefront/storefront.json` | What a shopper saw on the home page, the product list and the espresso machine's page: status, headings, the product count, the prices shown and Add to Cart. `before-us` was checked before the product count was added to the check |
| `storefront/*.webp` | Those three pages at 1,280 by 960 pixels, saved losslessly |
| `storefront/build-summary.log` (*not committed*, in any run) | The storefront's build, at storefront `8865498`, against the run's store |

`storefront-check.mjs` is the script that opened the storefront. Only its import of Playwright differs from the copy that ran, which named the machine's own install.
