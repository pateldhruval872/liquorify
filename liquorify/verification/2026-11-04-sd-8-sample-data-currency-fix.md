---
title: SD-8 fixed, sample data for a store that does not sell US dollars
record: verification
work_item: SD-8 (defect), G-36 (gap)
date: 2026-11-04
verifier: Claude (automated session, thread "Fix SD-8 demo prices"); not independent review
result: PASS for every required check of the work item's §5 at the final revision. Before the fix, Spree's own spec failed 6 of its 29 examples, and first-run setup in Polish złoty failed exactly as part 2 recorded. After it, the spec passes 29 of 29 on PostgreSQL and on SQLite, and first-run setup through the dashboard loads all 38 products, both sample orders and an active wholesale price list in US dollars, Polish złoty and euros. The storefront built against each new store lists all 38 products with prices in the store's currency. The required euro check passes, so every euro price the sample file gives is kept as it is. The welcome screen still says the store is ready when a background load fails for another reason (SD-14). A store whose language is German or French still gets no sample orders (SD-13). Neither is fixed here
---

# SD-8 fixed: sample data for a store that does not sell US dollars

**Claim.** The bounded fix the owner decided on 2026-11-04 ([decisions 19 to 21](2026-11-04-owner-decision-brief-answers.md); [work item](../work-items/sd-8-sample-data-currency-fix.md)) changes only Spree's sample data, its spec and the first-run check. With it, first-run setup with sample data loads everything for a store that does not sell US dollars, and the storefront lists the sample products with prices in the store's currency. This record keeps the runs before and after the fix, in US dollars, Polish złoty and euros, and states what they do not show.

**Revisions.**

| What | Revision |
|---|---|
| Spree's code before the fix | Backend `main` at `87a2ea8`, then `e61e24e` after #40. The sample data files are the same in both, and the same as in Spree's 6.0.2 release ([work item §1](../work-items/sd-8-sample-data-currency-fix.md#1-the-defect-as-recorded)) |
| The fix and its checks | Pull request [#44](https://github.com/pateldhruval872/liquorify/pull/44), on `claude/project-thread-4lnphy`. The spec's new checks are `67a35ef`, the fix is `273956a`, the first-run check's country choice is `e684636`, `main` after #40 was merged in at `3b9ca71`, and a tidy-up that changes no behaviour is `bbf401c`, the final code revision. Records only follow it |
| The storefront | `main` `8865498`, unchanged, built against each first-run store |

**What changed.**

1. **A demo price in the store's currency.** A new sample data step runs straight after the products load. Each sample variant with no price in the store's default currency gets the number its US dollar price has in the sample file. It is a demo amount, not a conversion, and the code says so. A price the file already gives, or one a merchant has set, is left alone, so a second run adds nothing. In a store in złoty, all 88 priced variants get one. In a store in euros, only the Spree handbook gets one, because the file prices it in dollars only.
2. **Quantity breaks only in currencies the store sells.** The wholesale step leaves out the example file's rows in a currency the store does not sell, and says so in its output. Any other refused row still stops the step, so the check that the example file matches the sample products is kept. All 24 rows are in US dollars, so a store in złoty or euros gets no quantity breaks. Its trade prices are still made from step 1's prices.
3. **Sample orders in the store's own currency,** instead of US dollars. Their United States addresses work in a store in Poland or Germany, so they are unchanged.
4. **The first-run check takes a country.** `packages/liquorify-storybook/fidelity/setup.spec.ts` now runs for Poland, the default, the United States or Germany, and saves each country's results under names that end in its code. With sample data it now also fails unless the wholesale price list is active.

Nothing outside the sample data, its spec and the first-run check changed.

## 1. Results

| # | Check (work item §5) | Required | Result |
|---|---|---|---|
| 1 | Spree's sample data spec passes unchanged for its store in US dollars | Yes | **PASS.** `main`'s own spec passed 21 of 21 on the fix, on SQLite. The branch's spec keeps those 21 examples unchanged, and they pass on both databases at `bbf401c` (§2) |
| 2 | A store that sells only Polish złoty: the load finishes; every priced sample variant has a złoty price; the wholesale price list is active with złoty trade prices; no quantity break is in a currency the store does not sell; both sample orders are in złoty with their items priced. Fails before, passes after | Yes | **PASS.** Before the fix, 4 of the 5 failed on both databases, with "This store does not sell in USD.". The fifth, no unsold quantity break, held only because every row was refused. After it, 5 of 5 pass (§2) |
| 2a | A store that sells only euros: every euro price the file gives is kept as the file gives it, with no demo price replacing it or added beside it | Yes, the owner's required regression check | **PASS** before and after. Euro prices load with the products, before the step that failed, so the check held before the fix too. It now guards against the fix changing them. Two more examples in the same group failed before the fix and pass after: the load finishes, and only the handbook gets a demo price (§2) |
| 3 | First-run setup with sample data through the dashboard, in **US dollars**, and the storefront built against the new store | Yes | **PASS** before and after. The first run ever recorded in dollars: 38 products, 2 orders, Wholesale active, 24 of 24 quantity breaks imported. The storefront lists 38 products with dollar prices, and the espresso machine's page shows $879.99 with Add to Cart (§3) |
| 4 | The same in **Polish złoty** | Yes | **PASS** after the fix. Before it, the check failed on "sample orders loaded": 0 orders, Wholesale a draft, 24 of 24 rows failed, and the storefront showed "No products found" and a not-found page for the espresso machine. After it: 38 products, 2 orders, Wholesale active, the quantity breaks left out, and 38 products on the storefront priced in złoty, the espresso machine at PLN 879.99, its dollar number (§3) |
| 5 | Optional: the same in **euros** (Germany), in the browser | No | **PASS** after the fix: 38 products, 2 orders, Wholesale active, and the file's own euro prices on the storefront, the espresso machine at €819.99. Not run before the fix; check 2a covers that case (§3) |
| 6 | The core test suite and the other required checks pass in CI, and the new checks' added run time is recorded | Yes | Recorded in the pull request's checks on its final commit, and in the merge record. Locally on PostgreSQL the loader spec took 48.8 seconds on `main` and 2 minutes 19 seconds with the new checks, about 90 seconds more, in one CI shard |
| 7 | No credential or machine path is committed, and the sample data's demo passwords stay as Spree wrote them | Yes | **PASS.** The pull request's files were searched for keys, tokens, passwords and local paths. The evidence's logs have their local paths replaced, and no key or token was written down. The setup link's token and the merchant's password are never saved, as before (§4) |

## 2. Spree's spec

The spec is `spree/core/spec/services/spree/sample_data/loader_spec.rb`. The two new stores are groups of their own, each loading the sample data once into a fresh database through the same shared setup as the original group. A group nested inside the original one cleared its data before its own examples ran, so they are kept apart.

| Run | Database | Revision | Result |
|---|---|---|---|
| `main`'s spec, on `main` | PostgreSQL | `87a2ea8` | 21 of 21, 48.8 seconds |
| The new checks, before the fix | PostgreSQL | `67a35ef` | 23 of 29, the 6 failures listed below, 2 minutes 6 seconds |
| The new checks, before the fix | SQLite | `67a35ef` | 23 of 29, the same 6 failures |
| `main`'s spec, on the fix | SQLite | `273956a` | 21 of 21 |
| The new checks, with the fix | PostgreSQL, SQLite | `273956a`; on PostgreSQL the same code uncommitted | 29 of 29 on each |
| Spree's sample data specs: the loader, its job and the sample files | PostgreSQL, SQLite | `3b9ca71`, then `bbf401c` | 44 of 44 on each, at each revision |

The 6 failures before the fix: in złoty, the load finishes, every variant has a złoty price, the wholesale list is active with złoty trade prices, and both orders are in złoty; in euros, the load finishes, and only the handbook gets a demo price. Each failed on the wholesale step's "This store does not sell in USD.", or on what that step stopped from loading.

## 3. First-run setup and the storefront, in the browser

Each run started a fresh first-run server: Spree's own, from `packages/dashboard/e2e/first-run/global-setup.ts`, on SQLite, with this thread's own database and ports. The dashboard ran from the same checkout. The first-run check then completed setup as a merchant in the chosen country, with sample data, keeping the dashboard and storefront in English. It waited for the sample data's background job to finish, and checked the 28 defaults setup gives a new store. The storefront at `8865498` was then built against the new store and opened in a browser on its home page, its product list and the espresso machine's page.

| Run | Sample data code | Setup check | Products, orders, Wholesale | Quantity break import | Storefront |
|---|---|---|---|---|---|
| United States, before | As on `main` | 2 of 2 passed; 28 of 28 defaults right | 38, 2, active | 24 rows, 0 failed | 38 products in dollars; espresso machine $879.99, Add to Cart |
| Poland, before | As on `main` | 1 of 2: "sample orders loaded" failed; 28 of 28 defaults right | 38, 0, draft | 24 rows, 24 failed | "No products found"; 0 products; the espresso machine's page not found |
| United States, after | `bbf401c` | 2 of 2 passed; 28 of 28 | 38, 2, active | 24 rows, 0 failed | 38 products in dollars; espresso machine $879.99, Add to Cart |
| Poland, after | `bbf401c` | 2 of 2 passed; 28 of 28 | 38, 2, active | Not run: all 24 rows left out | 38 products in złoty; espresso machine PLN 879.99, Add to Cart |
| Germany, after | `bbf401c` | 2 of 2 passed; 28 of 28 | 38, 2, active | Not run: all 24 rows left out | 38 products in euros, the file's own prices; espresso machine €819.99, Add to Cart |

The runs after the fix were made twice: at `3b9ca71`, and again at the final code revision `bbf401c`, with the same results. The evidence keeps the second. The runs before the fix used the branch's first-run check with the sample data files as they are on `main`. Each storefront page answered 200; before the fix, the espresso machine's page in złoty showed the storefront's not-found page instead of the product. No storefront request left the machine.

The welcome screen was captured in each run as setup finished, before the background load had ended. It says "Welcome, your store is now ready!" in every run, and nothing on it changes when the load then fails, as it did in Poland before the fix. That is SD-14, below.

## 4. Searches of the pull request

- Every line the pull request adds, across its 57 files, was searched for `sk_`, `pk_`, `token`, `password`, `secret`, `/home/`, `/tmp/`, `/root/` and `/Users/`, ignoring case. The only matches are in this record, where it describes the search. The sample data's demo passwords and the first-run check's handling of the setup token and the merchant's made-up password, which it never saves, are unchanged.
- The evidence's logs had their local checkout and scratch paths replaced with `<checkout>` and `<scratch>`. The storefront's publishable key was read from the first-run database and passed to its build only, never printed or saved.

## 5. Found on the way, not fixed

- **SD-13.** In Spree's spec, the store that sells only euros is set up for Germany, so its language is German. Its load finished, but it got no sample orders. The orders step finds its two products by their English names, and in a store whose language is German or French the products' names are stored in that language, from the sample translations. The step then says it is skipping the orders, and nothing fails. This is in Spree's `spree/core/db/sample_data/orders.rb`, and the fix does not cause it. Before the fix, the same store stopped earlier, on SD-8. The browser runs kept the store in English, so they do not show it. It is outside this fix's bounded scope, so it is recorded as SD-13 in [LIQ-004](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) and not reported to Spree.
- **SD-14.** The welcome screen's limitation the owner asked to keep explicit, split out of SD-8 so it stays open when SD-8 closes. The sample data loads in a background job after setup. When the job fails, the failure shows only in the job's output, and the welcome screen still says the store is ready. Part 2's runs in złoty showed it, and this fix does not change it.

## 6. Limitations

- **Demo prices are not conversions.** A store in złoty shows PLN 879.99 because the dollar price is $879.99. That is what the owner approved in decision 20.
- **A store in any other currency than złoty, dollars or euros** was not run. The fix does not depend on the currency: the spec runs it for złoty and euros, and the browser for all three.
- **German and French stores** lose their sample orders (SD-13). The browser runs used English only.
- **The welcome screen** still reports a failed background load as ready (SD-14).
- **The sample product images** were not checked. The storefront screenshots show placeholders in every run, before and after the fix.
- **Local versions.** Ruby 3.3.6 locally, against Ruby 4.0 in CI. The dashboard check ran in the machine's Chromium, revision 1243, through a local Playwright setting, because Playwright 1.64.1's own browser is not installed here. The storefront check used the machine's Playwright 1.63.
- **Databases.** The browser runs used Spree's first-run server, on SQLite only. PostgreSQL is covered by the spec.
- **Tenant isolation** is not part of this fix and stays NOT_RUN, as in every batch.

## 7. What this record does not decide

SD-8 and G-36 close only once their closing conditions have passing evidence and that is accepted. G-36's condition, set by the owner on 2026-10-27, is that SD-8 is resolved and setup with sample data is verified in US dollars and in another currency. Checks 3 and 4 are that evidence. The acceptance is recorded with the merge, as delegated acceptance under the owner's delegation of 2026-11-04 ([record](2026-11-04-delegated-acceptance-and-merging.md)), and never as the owner's review. SD-13 and SD-14 stay open. Whether to fix them is a separate decision.

## 8. Evidence

[`evidence/2026-11-04-sd-8-sample-data-currency-fix/`](evidence/2026-11-04-sd-8-sample-data-currency-fix/README.md) holds the spec logs, each run's first-run results and setup check output, the welcome screen captures, and the storefront results and screenshots.
