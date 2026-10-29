# SD-11 evidence: two exports sharing one temporary file

Evidence for the [SD-11 record](../../2026-10-27-sd-11-export-file-name-collision.md). Everything here ran in Spree core's own test setup: its generated test app under `spree/core/spec/dummy`, its factories and its parallel workers' databases, made with Spree's own `parallel_setup` task. Spree's code is `main` at `69da903`. Nothing in Spree was changed.

| File | What it is |
|---|---|
| `ci-run-40386716037-core-3-failure.txt` | The failure as CI printed it on #26 at `1bf61ac`, copied line for line from job [121797464410](https://github.com/pateldhruval872/liquorify/actions/runs/40386716037/job/121797464410), with its timestamps; only colour codes were removed, and the step's settings were left out |
| `export_file_name_collision_spec.rb` | Three examples in one worker: two product exports for one store, created 0.8 seconds apart in the same second, get one file path; run one after the other, each gets its own rows; with their steps overlapped as two jobs can overlap them, the first gets the second's rows and the second fails |
| `concurrent_exports_spec.rb` | Two workers at once, each with its own database and both with the test app's one `tmp` folder, as Spree's parallel CI workers are. In each of 40 rounds both start a product export for a store with the same code in the same second and run Spree's own `generate`, nothing stubbed and no step reordered. The control gives each worker its own store code |
| `in-process-run.txt` | The first spec's output: 3 examples, 0 failures |
| `concurrent-run/` and `control-run/` | Each worker's results, round by round (`alpha.json`, `beta.json`), and its RSpec output (`alpha-rspec.txt`, `beta-rspec.txt`) |

## How to run them

From `spree/core`, after `bundle exec rake test_app` and `bundle exec rake "parallel_setup[2]"`:

```bash
bundle exec rspec ../../liquorify/verification/evidence/2026-10-27-export-file-name-collision/export_file_name_collision_spec.rb

# In two shells at once, with the same start second about 30 seconds ahead:
START=$(( $(date +%s) + 30 ))
SD11_OUT=<folder> SD11_START=$START SD11_WORKER=alpha TEST_ENV_NUMBER=  bundle exec rspec ../../liquorify/verification/evidence/2026-10-27-export-file-name-collision/concurrent_exports_spec.rb
SD11_OUT=<folder> SD11_START=$START SD11_WORKER=beta  TEST_ENV_NUMBER=2 bundle exec rspec ../../liquorify/verification/evidence/2026-10-27-export-file-name-collision/concurrent_exports_spec.rb

# The control: the same, with SD11_STORE_CODE=sd11-alpha and SD11_STORE_CODE=sd11-beta.
```

The first spec passes while the defect is there and fails once it is fixed. The concurrent spec does not judge; it records what each export got.
