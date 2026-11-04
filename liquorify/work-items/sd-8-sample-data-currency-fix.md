---
title: SD-8, sample data for a store that does not sell in US dollars, fix proposal
record: work item
work_item: SD-8 (defect), G-36 (gap)
status: PROPOSED
owner: the owner decides whether and when; an automated Claude session implements
created: 2026-11-03
updated: 2026-11-04
---

# SD-8 fix proposal: sample data for a store that does not sell in US dollars

A bounded fix for [SD-8](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline), prepared at the owner's request on 2026-11-03. **On 2026-11-04 the owner decided to fix SD-8 now** (decision 19 of the owner decision brief), in its own bounded pull request, after FB-03 takes the next free slot; with the demo price of §3 (decision 20); and with no report to Spree (decision 21). §6 records the answers. This proposal changes neither SD-8's status nor G-36's: closing either still needs the owner's acceptance of the resulting evidence. **The fix was built on 2026-11-04** in pull request #44, and every required check of §5 passed ([verification record](../verification/2026-11-04-sd-8-sample-data-currency-fix.md)); §8 gives the outcome.

**Why it matters to the baseline.** G-36, first-run setup with sample data, is OPEN: on 2026-10-27 the owner kept it open until SD-8 is resolved and setup with sample data is verified in US dollars and in another currency. Until then CAP-03-03 stays PARTIAL, with a failing part. SD-8's follow-up said a fix would be decided after the baseline; the owner's answer of 2026-11-04 brings it forward, still in Spree's sample data and in its own pull request.

## 1. The defect, as recorded

First-run setup's sample data stops at its wholesale step for a store that does not sell in US dollars. Seen three times for a store in Polish złoty in part 2 of the storefront shop batch ([record §7](../verification/2026-10-26-fb-19-batch-storefront-shop-part-2.md#7-first-run-setup-with-sample-data-g-36)): 38 products, their translations and 20 customers loaded; the wholesale price list's 24 rows all failed with "This store does not sell in USD."; the step raised, so no sample orders loaded and the price list stayed a draft; the welcome screen still said the store was ready; and the storefront listed no products, because none had a price in złoty. A store in US dollars was never run.

**Still in Spree.** On 2026-11-03 the sample data files involved (`wholesale.rb`, `orders.rb`, `price_list_prices.csv` and the loader) are identical in Liquorify's `main` at `5794da6a`, in Spree's 6.0.2 release and on Spree's `main`. Spree has not changed them since 6.0.0.rc4.

## 2. Causes, read in the code at `5794da6a`

1. **The quantity breaks are all in dollars.** `spree/core/db/sample_data/price_list_prices.csv` has 24 rows, every one in USD. The price list import refuses each row in a store that does not sell USD, and `wholesale.rb` raises when any row fails. That raise is deliberate: it catches the example file drifting apart from the sample products.
2. **The sample products are priced in dollars and euros only.** `products.csv` prices 88 variants: 87 in USD and in EUR, and the Spree handbook in USD only. *Corrected on 2026-11-04: this said all 87 priced variants had both, and the fix's spec found the handbook.* A store whose currency is neither gets no price, so its storefront lists nothing. This happens before the wholesale step and is not an error, so nothing reports it.
3. **The sample orders are fixed in dollars.** `orders.rb` creates its two orders with the currency `USD`. In a store that does not sell USD they would be in a currency the store does not sell. Not reached in the recorded runs, which stopped before it; read in the code only.

The welcome screen saying the store is ready is a separate cause: the sample data loads in a background job after setup, and nothing reports its failure to the screen. It is outside this fix (§4).

## 3. The proposed fix

One backend pull request, separate from every baseline pull request, changing only Spree's sample data and its spec:

1. **A demo price in the store's own currency.** After the product import, each sample variant that has no price in the store's default currency gets one, with the same number as its US dollar price in the sample file. It is a demo amount, not a conversion; no exchange rate is added. A store in dollars is unaffected. A store in euros keeps every euro price the file gives, and only the handbook, which the file prices in dollars only, gets a demo price. *Corrected on 2026-11-04: this said a store in euros was unaffected.*
2. **Quantity breaks only in currencies the store sells.** The wholesale step imports the example file's rows in currencies the store sells and skips the rest, saying so in its output. A row that fails for any other reason still stops the step, so the drift check stays. A store that sells none of the file's currencies gets no quantity breaks, while its trade prices still come from step 1's prices.
3. **Sample orders in the store's default currency,** instead of dollars.

**The first step reproduces SD-8 in Spree's own spec** for a store that sells only złoty, before any change, and reads what fails after the wholesale step. If the sample orders' United States addresses fail in a store whose delivery zones do not cover the United States, the fix gives the sample orders an address in the store's own country, still inside the sample data. Anything that would need a change outside the sample data stops the work and is reported to the owner.

## 4. Not included

- **The welcome screen reporting a failed background load.** A change to setup or to the job, not to the sample data. The owner asked on 2026-11-04 for this limitation to stay explicit: after the fix, a sample data load that fails for any other reason is still reported only in the job's output, and the welcome screen still says the store is ready. The verification record states it, and fixing it would be a separate decision.
- **Real exchange rates, or more currencies in the sample files.**
- **Hiding the sample data option from stores in other currencies.** A change to Spree's setup screen.
- **Reporting the defect to Spree.** The owner decided on 2026-11-04 not to report it (decision 21).

## 5. Verification, in US dollars and in another currency

| # | Check | Evidence |
|---|---|---|
| 1 | Spree's sample data spec passes unchanged for its store in US dollars | The spec run |
| 2 | A new context in the same spec loads the sample data into a store that sells only Polish złoty and checks that the load finishes without raising; every priced sample variant has a złoty price; the wholesale price list is active with złoty trade prices; no quantity break is in a currency the store does not sell; and both sample orders exist in złoty with their items priced. It fails before the fix and passes after | The spec run, before and after |
| 2a | **Required.** A context in the same spec loads the sample data into a store in euros and checks that every euro price the sample file gives is kept as the file gives it, and that no demo price replaces or is added beside it. The owner made this a required automated regression check on 2026-11-04 | The spec run |
| 3 | First-run setup with sample data, through the dashboard, on a fresh first-run server in **US dollars** (United States): the check the storefront shop batch ran (`packages/liquorify-storybook/fidelity/setup.spec.ts`) passes "sample orders loaded" and finds the price list active, and the storefront built against the new store lists the sample products with dollar prices and opens the espresso machine's page | The check's output and captures, before and after the fix. The run before is the first in dollars, so it shows whether a store in dollars loads everything today |
| 4 | The same in **Polish złoty** (Poland): the same results, with złoty prices on the storefront | The check's output and captures, before and after the fix |
| 5 | Optional, in euros (Germany), through the dashboard: the file's own euro prices show on the storefront. Check 2a is the required check for euro prices; this one only adds a browser view | The check's output |
| 6 | The core test suite and the other checks pass in CI; the new context's added run time is recorded | CI runs |
| 7 | No credential or machine path is committed; the sample data's demo passwords stay as Spree wrote them | A search of the pull request's files |

Checks 1, 2, 2a, 3 and 4 are required; checks 3 and 4 cover first-run setup and the storefront in US dollars and in Polish złoty, as the owner asked. The verification record states what it shows and what it does not, including the welcome screen's limitation of §4. Changing SD-8's status, or closing SD-8 or G-36, stays with the owner and needs the owner's acceptance of this evidence.

## 6. What the owner decided

1. **Fix now, or keep it deferred?** The options were to fix it now, in its own pull request, so G-36 could be closed on checks 3 and 4 if accepted; or to keep it deferred until after the baseline, leaving G-36 open in the register.
   *The owner's answer, 2026-11-04 (decision 19 of the owner decision brief):* fix SD-8 now, in its own bounded pull request, after FB-03 takes its next available slot. Verify setup and the storefront in US dollars and in Polish złoty; make the preservation of existing euro prices a required automated regression check (check 2a); keep the welcome screen's limitation explicit (§4). Closing SD-8 or G-36 still needs the owner's acceptance of the resulting evidence. The fix is a divergence from Spree's code, carried until Spree fixes it or Liquorify moves to a release that does.
2. **The demo price.** Recommended: the same number as the dollar price, labelled a demo amount in the code. The alternative was to load no products in a store whose currency the files do not cover.
   *The owner's answer, 2026-11-04 (decision 20):* approved as recommended.
3. **Reporting to Spree.**
   *The owner's answer, 2026-11-04 (decision 21):* no report to Spree. The same instruction stands for the other defects in the register.

## 7. Risk and release impact

- **Risk.** Standard: Spree's sample data and its spec only. Sample data runs only when a merchant asks for it at setup, or from the sample data command.
- **Release impact.** None. Nothing is deployed.

## 8. Outcome, 2026-11-04

The fix was built as §3 proposes, in pull request #44, and every required check of §5 passed at the final code revision ([verification record](../verification/2026-11-04-sd-8-sample-data-currency-fix.md)):

- Spree's spec failed 6 of 29 examples before the fix and passes 29 of 29 after it, on PostgreSQL and on SQLite. The required euro check (2a) passes.
- First-run setup with sample data, through the dashboard, loads all 38 products, both sample orders and an active wholesale price list in US dollars, Polish złoty and euros. The storefront built against each new store lists all 38 products, priced in the store's currency.
- The sample orders' United States addresses worked in stores in Poland and Germany, so no address changed.
- Two corrections to this work item, in §2 and §3: the Spree handbook is priced in dollars only, so a store in euros gets one demo price.
- Found on the way and not fixed: a store whose language is German or French gets no sample orders, because the orders step finds its products by their English names (SD-13). The welcome screen's limitation of §4 is now tracked on its own, as SD-14, so it stays open when SD-8 closes.

SD-8 and G-36 close only when the acceptance of this evidence is recorded with the merge, as delegated acceptance under the owner's delegation of 2026-11-04 ([record](../verification/2026-11-04-delegated-acceptance-and-merging.md)). This work item's status stays PROPOSED.
