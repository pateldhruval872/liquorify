# Evidence: SD-8 fixed, sample data for a store that does not sell US dollars

The runs behind the [verification record](../../2026-11-04-sd-8-sample-data-currency-fix.md). Local checkout and scratch paths in the logs are replaced with `<checkout>`, `<storefront checkout>` and `<scratch>`. No key or token is saved here.

## `specs/`: Spree's spec

Each log starts with a line naming its database, revision and Ruby version, and ends with its exit code.

| File | What ran | Result |
|---|---|---|
| `1-main-spec-on-main-pg.log` | `main`'s loader spec, on `main` `87a2ea8`, PostgreSQL | 21 of 21, 48.8 seconds |
| `2-new-checks-before-fix-pg.log`, `…-sqlite.log` | The branch's loader spec at `67a35ef`, before the fix | 23 of 29 on each; the failures are listed at the end of each log |
| `3-main-spec-on-fix-sqlite.log` | `main`'s loader spec, unchanged, on the fix at `273956a`, SQLite | 21 of 21 |
| `4-new-checks-with-fix-pg.log`, `…-sqlite.log` | The branch's loader spec with the fix | 29 of 29 on each |
| `5-sample-data-specs-3b9ca71-pg.log`, `…-sqlite.log` | Spree's sample data specs (the loader, its job and the sample files) after `main` was merged in | 44 of 44 on each |
| `6-sample-data-specs-bbf401c-pg.log`, `…-sqlite.log` | The same, at the final code revision | 44 of 44 on each |

## `runs/`: first-run setup and the storefront

One folder per run. `before-us` and `before-pl` used the sample data files as they are on `main`. `final-us`, `final-pl` and `final-de` used the final code revision, `bbf401c`. The `revision` field inside each file names its run.

| File | What it is |
|---|---|
| `first-run-sample-data*.json` | What the first-run check found: the merchant's answers, the sample data's products, orders, imports with their failed rows, and price lists, and the 28 checks of the defaults setup gave the new store |
| `setup-check.log` | The first-run check's output, with its revision, start and exit code |
| `welcome/` | The welcome screen (DA-SETUP-01), light and dark, captured as setup finished, with each capture's details |
| `storefront/storefront.json` | What a shopper saw on the home page, the product list and the espresso machine's page: status, headings, the product count, the prices shown and Add to Cart. `before-us` was checked before the product count was added to the check |
| `storefront/*.webp` | Those three pages at 1,280 by 960 pixels, saved losslessly |
| `storefront/build-summary.log` | The storefront's build, at storefront `8865498`, against the run's store |

`storefront-check.mjs` is the script that opened the storefront. Only its import of Playwright differs from the copy that ran, which named the machine's own install.
