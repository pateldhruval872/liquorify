# FB-19 batch 12 part 2, evidence

Evidence for the [verification record](../../2026-11-11-fb-19-batch-wholesale-part-2.md). Every name, company, email, phone number and order in it is invented or made by the scripts on the storefront's browser-test backend. Keys, tokens and invitation links are not recorded; local paths and the host's address in the run logs are replaced by `<storefront>`, `<local>` and `<host>`.

| Folder | What it holds |
|---|---|
| `screens/<setting>/<screen>/<state>/` | The running-screen captures at 390 and 1280 pixels under `login_required`, `prices_hidden`, `public` and `off` (wholesale not configured), each with a `.json` note of the visitor, the revision and what the page read. A `-unavailable.json` names a state not reached and why |
| `screens/*-run.txt` | Each setting's capture run, the guest rerun under sign-in required (§6 of the record), and the two production builds |
| `comparison/<case>/` | Each comparison case at both widths: the running screen, the story, both side by side, and the computed styles with their differences. `run-*.txt` are the runs |
| `backend/` | Spree's specs for the batch at `e7fd2953`: `api-specs.json` (331 examples) and `core-specs.json` (273), with their run logs |
| `fixes/sd-86/`, `fixes/sd-9/` | The browser tests at storefront `main` before each fix, and twice after it |
| `fixes/sd-104/` | Quick order's tests before and after #33 and #34, and the buyer's two fresh-server runs |
| `fixes/sd-105/` | The purchase order browser tests before and after #35, and the member's two fresh-server runs |
| `checks/` | The cart with the price list's minimum changed to five (SD-106) |
