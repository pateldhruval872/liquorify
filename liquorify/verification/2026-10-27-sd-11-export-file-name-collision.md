---
title: SD-11, two exports sharing one temporary file, reproduced in Spree's test setup
record: verification
work_item: FB-19
date: 2026-10-27
verifier: Claude (automated session); not independent review
result: CONFIRMED in Spree core's own test setup, at `main` `69da903`, that two exports of one kind for one store, created within the same second, are written to one temporary file. With their steps overlapped, the first export got the second's rows and the second failed. Run by two test workers at once, as CI runs them, 39 of 40 rounds went wrong for one of the two exports, and none did when each worker's store had its own code. SUSPECTED, not shown, that the same happens on a running Liquorify server, and how often. Spree's code is unchanged
---

# SD-11, two exports sharing one temporary file, reproduced in Spree's test setup

**Claim.** Spree writes each export to a temporary file named after the export's kind, its store's code and the second it was created in, in the application's one `tmp` folder (`spree/core/app/models/spree/export.rb`, `export_file_name` and `export_tmp_file_path`). After writing it, the export attaches the file and deletes it (`handle_attachment`). Two exports of the same kind for the same store, created within the same second, therefore share one file. This record keeps the CI failure that showed it, reproduces it with Spree core's own test setup, and keeps two claims apart:

- **Confirmed:** the file name collision, and what it does to two exports whose runs overlap, in Spree's test setup (§2, §3).
- **Suspected, not shown:** that the same happens on a running Liquorify server, where it would need two such exports in the same second, run at overlapping times on one machine, and how often that is (§4).

The baseline changes no Spree code, so the export is kept as it is. A fix, if the owner wants one, goes in its own pull request, separate from the baseline's (§5).

**Revisions.**

| What | Revision |
|---|---|
| Spree's code | Backend `main` at `69da903`. `export.rb` last changed on 2026-10-13, in `684919c`, before every revision named here |
| The CI failure | [#26](https://github.com/pateldhruval872/liquorify/pull/26) at `1bf61ac`, a commit that changed records only, whose Spree code is `main`'s |
| The reproduction | Spree core's generated test app on SQLite, the local default, with a second worker's database made by Spree's own `parallel_setup` task, from a checkout whose Spree code is `main` `69da903`'s |

**Results.**

| # | Check | Result |
|---|---|---|
| 1 | The CI failure is kept as CI printed it | PASS: the failure lines, the worker, the seed and the summary are kept in the evidence (§1) |
| 2 | Two exports of one kind for one store, created within the same second, get one temporary file | CONFIRMED: created 0.8 seconds apart in the same second, both get `products-<store code>-20261027010000.csv` (§2) |
| 3 | What two exports with that one file get when their runs overlap, with the export's own steps run in that order | CONFIRMED: the first export's file holds the second export's rows and none of its own, and the second fails with `Errno::ENOENT` and has no file. Run one after the other, each gets its own rows (§2) |
| 4 | What they get when two test workers run them at the same time, nothing stubbed or reordered | CONFIRMED: of 80 exports in 40 rounds, 41 got their own rows, 9 got the other worker's rows, 24 failed with `ActiveStorage::IntegrityError` and 6 with `Errno::ENOENT`; only 1 round of 40 gave both exports their own rows. The control, a store code of its own for each worker, gave all 80 their own rows (§3) |
| 5 | The same on a running Liquorify server, and how often | NOT_RUN: suspected (§4) |

## 1. The CI failure

On 2026-10-26 at 19:33 UTC, Tests failed on #26 at `1bf61ac` in one job, [PostgreSQL - core (3/3)](https://github.com/pateldhruval872/liquorify/actions/runs/40386716037/job/121797464410) of run [40386716037](https://github.com/pateldhruval872/liquorify/actions/runs/40386716037). The commit changed records only. The job runs four RSpec workers side by side, each with its own database and all with the test app's one `tmp` folder. Worker 4 failed one example, `spec/models/spree/export_spec.rb:115`, "Spree::Export#generate custom field columns lines each value up under its own header", with seed 52217:

```
Errno::ENOENT:
  No such file or directory @ rb_sysopen - …/spree/core/spec/dummy/tmp/products-spree_1-20261026193253.csv
# ./app/models/spree/export.rb:175:in 'Spree::Export#handle_attachment'
```

That worker ran 909 examples with 1 failure, and the job 3,812 with 1 failure. The file's name carries the store code `spree_1`, which Spree's store factory gives the first store a worker creates, so each worker can have a store of that code. Most likely another worker exported such a store's products in the same second, and wrote and deleted the same file; the log does not show the other worker's example. The same job passed at `069c1d6` before it and at `443d211` after it, where the failure did not recur. The failure is kept line for line in the [evidence](evidence/2026-10-27-export-file-name-collision/ci-run-40386716037-core-3-failure.txt). The run was not run again, so its first attempt stays as it was.

## 2. One worker, with the steps overlapped

[`export_file_name_collision_spec.rb`](evidence/2026-10-27-export-file-name-collision/export_file_name_collision_spec.rb) creates two products, "Alpha Collision Tee" and "Beta Collision Tee", in the default store, and two product exports filtered to each, created at 01:00:00.1 and 01:00:00.9 on the same day. Its three examples passed ([output](evidence/2026-10-27-export-file-name-collision/in-process-run.txt)):

- **One path.** Both exports' temporary file is `tmp/products-<store code>-20261027010000.csv`, though they are two records.
- **Run one after the other,** with Spree's own `generate`, each export's file holds its own product and not the other. Sharing the name does no harm when the runs do not overlap.
- **Run overlapped,** with the export's own steps in the order two jobs can take them (the first writes its file, the second writes over it, the first attaches it and deletes it, then the second attaches), the first export's file holds "Beta Collision Tee" and not "Alpha Collision Tee", and the second fails with `Errno::ENOENT` and has no file.

This spec passes while the defect is there and fails once the two exports stop sharing a file, so it can serve a fix's pull request.

## 3. Two workers at once

[`concurrent_exports_spec.rb`](evidence/2026-10-27-export-file-name-collision/concurrent_exports_spec.rb) runs in two workers side by side, as CI's workers run: each has its own database and both have the test app's one `tmp` folder. Each worker creates a store with the code `sd11-collision` and one product of its own. In each of 40 rounds, two seconds apart, both workers create a product export at the same planned instant and run it with Spree's own `generate`, nothing stubbed and no step reordered, then record whether its file holds its own product, the other worker's, or the export failed and with which error.

| Run | Exports | Their own rows | The other worker's rows | Failed: `ActiveStorage::IntegrityError` | Failed: `Errno::ENOENT` | Rounds with both right |
|---|---|---|---|---|---|---|
| Same store code ([results](evidence/2026-10-27-export-file-name-collision/concurrent-run/)) | 80 | 41 | 9 | 24 | 6 | 1 of 40 |
| Control, a store code for each worker ([results](evidence/2026-10-27-export-file-name-collision/control-run/)) | 80 | 80 | 0 | 0 | 0 | 40 of 40 |

In every round of the first run both exports had the same file name, and in no round of the control. The third outcome, `ActiveStorage::IntegrityError`, did not show in CI: Active Storage checks the file it uploads against the checksum it took first, and the other worker had written over the file in between. A first attempt at this run stopped at that error, because the spec then recorded only `Errno::ENOENT`; it was changed to record any error, and the run above is the second attempt.

## 4. What is suspected on a running server, and not shown

Nothing here ran on a Liquorify server. Read from the code, and not run:

- **When it could happen.** Two exports of the same kind for the same store, created in the same second, whose jobs run at overlapping times on one machine, so they share its `tmp` folder. A store's code is unique, so two stores never share a name. Jobs on different machines each have their own folder. Spree runs exports in `Spree::Exports::GenerateJob`; where jobs run in threads of one process, as Solid Queue inside Puma does on a single server, two can overlap. How often two exports of one kind for one store start in the same second, from two staff members, a repeated click or an API client, was not measured.
- **What it would do.** The export job is not retried on these errors: `generate_job.rb` opts out of retries, because a second run would attach a second file. So an export that fails stays without a file. An export that gets another's rows holds rows filtered for someone else: an export contains only what its creator may read, and a seller's only that seller's orders (`Spree::Export#scope`). So one staff member or seller could receive another's file within the same store. This is the reason to treat it as more than a failed download, and it is suspected only: no test here exported for two users or two sellers.
- **Not checked:** what the dashboard shows for a failed export, whether it blocks a second click, and whether Spree's own file storage in production behaves as the test setup's disk storage did.

## 5. What would fix it, kept apart

Not done here: the baseline changes no Spree code, and a fix goes in its own pull request, separate from the baseline's, if the owner wants one. Giving each export a file of its own would remove the collision, for example a name that includes the export's own ID, or a temporary file made with Ruby's `Tempfile`, which picks an unused name. The spec in §2 would then fail on its first and third examples, and should change to expect each export to keep its own rows. Whether to report it to Spree is the owner's call.

## 6. Limitations

- The reproduction ran on SQLite in one container; CI's failure was on PostgreSQL. The collision is in the file name, which does not depend on the database.
- The concurrent run shows how often the collision goes wrong when two exports do overlap. It does not show how often they overlap in use.
- The control changes only the store code, so it shows that the shared name causes the failures; it does not test a fix.
- Tenant isolation is not part of this record and stays NOT_RUN.
