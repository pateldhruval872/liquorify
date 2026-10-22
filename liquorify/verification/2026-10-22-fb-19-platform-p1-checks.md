---
title: FB-19 platform batch, step P1, the API, kit, record, hosting and tracing checks
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for regenerating the API reference, which found two stale spots in the committed reference (SD-4). PARTIAL for the Admin and Seller kits against the running server, which found the Seller kit's order addresses described wrongly (SD-3). PASS for external references, price history, the hosted dashboard and seller panel, and tracing. The owner's acceptance is NOT_RUN
---

# FB-19 platform batch, step P1, the API, kit, record, hosting and tracing checks

**Claim.** Step P1 of the [platform batch](../work-items/fb-19-batch-platform.md) asked for five checks that need nothing new. This record holds them. The sixth part of P1, the mail check, has [its own record](2026-10-22-fb-19-platform-p1-mail.md).

- The API reference was regenerated from Spree's own examples and compared with the committed files.
- The Admin and Seller kits' read methods were called against the running browser-test server.
- External references and price history were written and read through the Admin kit.
- The built dashboard and seller panel were served by Spree's own server and signed in to.
- A request's trace was exported to a local collector.

**Scope.** CAP-11-06, CAP-11-08, CAP-11-10, CAP-03-12 and CAP-05-11, as the work item's §4 lists them. Nothing here changes Spree's code, its tests or a workflow. Nothing here accepts a gap or a capability. The owner does that when reviewing P1.

## 1. How each check ran

Run locally on 2026-10-22, at backend `a4a1708` for Spree's code. On this branch, `git diff a4a1708` over `spree/`, `docs/api-reference/` and the kit and dashboard packages is empty. The scripts are this record's revision. The browsers ran in the backend's pinned Playwright image. Each check ran twice and gave the same result both times.

| Check | Server | Script or command | Results |
|---|---|---|---|
| API reference | None. Spree's reference examples run inside one test process | `bundle exec rake rswag:specs:swaggerize` in `spree/api`, Spree's own task. The three regenerated files were compared with the committed ones, then the committed files were restored | §2.1 |
| Admin and Seller kits | The browser-test server and its fixtures, started as `stack.spec.ts` describes | `fidelity/kits.spec.ts` | §2.2, [kits.json](evidence/2026-10-22-fb-19-platform-p1-checks/kits.json) |
| External references and price history | The same server | `fidelity/records.spec.ts` | §2.3 and §2.4, [records.json](evidence/2026-10-22-fb-19-platform-p1-checks/records.json) |
| Hosted dashboard and seller panel | The hosting gem's own test app (`spree/dashboard`, `rake test_app`). Spree's seeds, plus a first admin through Spree's own `ADMIN_EMAIL` and `ADMIN_PASSWORD` seed settings, and a seller through Spree's `spree:sellers:sample_data` task | `fidelity/hosted.spec.ts` | §2.5 |
| Tracing | The tracing gem's own test app (`spree/opentelemetry`, `rake test_app`), with Spree's seeds and the standard OpenTelemetry settings | `fidelity/tracing.spec.ts`, with a collector it runs itself | §2.6, [tracing.json](evidence/2026-10-22-fb-19-platform-p1-checks/tracing.json) |

Two of the checks use a gem's own test app because Spree's browser-test server does not load that gem. Each script's header says how to start its server. The admin and seller passwords and the publishable keys were passed in at run time. They are not recorded anywhere.

## 2. Results

### 2.1 Regenerating the API reference

Spree's task ran 1,097 examples with 0 failures and rewrote the Store, Admin and Seller reference files. The raw comparison with the committed files shows 205 lines added and 206 removed across the three files. Spree keeps the regeneration deterministic, but only on the same machine. Most of the differences come from that.

| Difference | Files | Cause | Result |
|---|---|---|---|
| Example names, slugs and SKUs carry different numbers, for example "Product 3436979" for "Product 3406979" | Store, Seller | The test data's numbering depends on which tests ran before. Spree does not pin it | From this machine |
| Signed upload ids and storage links differ | All three | They are signed with the test app's own secret | From this machine |
| One error message is printed as `{:code=>...}` where the committed file has `{code: ...}` | Store | Ruby's own format. This machine has Ruby 3.3; Spree's CI uses Ruby 4.0 | From this machine |
| States that share a name (Viljandi, Navarra, Gbarpolu) are listed in another order | Seller | Equal names have no fixed order | From this machine |
| The tax rate create example's code samples send `included_in_price` | Admin | Spree removed that field from tax rates on 2026-10-19 (`b38df6e`). The examples were updated then, but the committed reference was not regenerated from them | **Real: the committed reference is stale (SD-4)** |
| The update check example shows `current_version: 6.0.0.rc3` | Admin | Spree's version became `6.0.0.rc4` the same day (`862ffb0`) | **Real: the committed reference is stale (SD-4)** |

Once the machine-made differences are set aside, the two stale spots in the Admin reference are the only differences.

**Result:** PASS for the regeneration. The comparison found SD-4.

### 2.2 The Admin and Seller kits against the running server

**How it works.** The script reads the built kits. It finds every read method, meaning every method that sends a `GET`.

- It signs in as the browser tests' admin and as their seller. Then it calls each read through the kit.
- When a read needs a record, the script takes ids from the kit's own list methods. It tries up to 25 candidates.
- The published reference names each answer's schema. The script checks every record in the answer against the kit's own schema of that name.
- When the reference documents no read for a route, the script uses the schema of that resource's list, if there is one.

| | Admin kit | Seller kit |
|---|---|---|
| Read methods found | 272 | 54 |
| Called | 181 | 36 |
| Answered with a server error | 0 | 0 |
| Refused for the input given (below) | 5: four 404s and one 422 | 0 |
| Answers checked against the kit's schema | 45 reads and 139 records, all accepted. For 7 of them, the reference documents no read, so their list's schema was used | 17 reads and 277 records. 14 reads accepted. **3 rejected: SD-3** |
| Answered, not checked | 131. For 68, the reference names no schema. 37 had no records in the answer. For 25, the reference documents no read for the route. For 1, the kit has no schema of the name the reference gives | 19. For 4, the reference names no schema. 12 had no records. For 3, the kit has no schema of that name |
| Not called | 91. 90 had no record to read. 1 needs an invitation token, which the script does not have | 18. 16 had no record to read. 1 needs an invitation token. For 1, no list method gives its records |

**Refusals.** Each refusal is what the API should answer for the input the script gave. None is a defect.

- `auth.setupCountries` (404). First-run setup is finished on this store. Its setup reads then answer 404, as designed.
- `invitations.acceptanceLink` (404). Only a pending invitation has a link. None of the invitations the script tried was pending.
- `oauth.authorization` (404). It needs an OAuth application's id, which the script does not supply. P2 covers OAuth.
- `apiKeys.current` (404). It describes the API key a request signed in with. The script signed in as a staff member. P2 covers keys.
- `tags.list` (422). It needs `taggable_type`, the kind of record whose tags to list. The script does not supply it.

**The Seller kit's orders (SD-3).** `orders.list`, `orders.get` and `orders.notes.get` answer with an order whose shipping and billing addresses are empty. The kit's `Order` type marks both as always present, and its schema rejects the answer.

- The Store API's order serializer marks both addresses as possibly empty. The Seller API's does not.
- The order comes from Spree's browser-test setup, which creates it without addresses.
- Not checked: whether a real checkout can give a seller an order without addresses.
- The seller panel's address block accepts a missing address. This was read in the code, not run.

The script expects these three rejections by name. A new rejection, or a server error, fails it.

**Routes the reference does not document for reading.** 32 Admin reads, 25 unchecked and 7 checked with their list's schema, call routes for which the reference documents no `GET`. Examples are `roles.get` and `deliveryMethods.get`, whose routes the reference documents only for changes and deletion, and `countries.list`. This is a gap in the reference's coverage, not a defect. The full list is in [kits.json](evidence/2026-10-22-fb-19-platform-p1-checks/kits.json).

**A read that writes.** `customers.export` records a completed data request for the customer it reads. Each run adds one to the test server's database, which is rebuilt every time the server starts.

**Result:** PARTIAL. Every read that was called answered without a server error. All the checked answers fit the kit's schemas except SD-3's. 109 of the 326 reads were not called, almost all for lack of a record. The kits' write methods were not called.

### 2.3 External references

Each run creates its own products and deletes them at the end.

| Step | Result |
|---|---|
| Create a product with a key, `erp` | PASS: the product carries the key |
| Read the product by its key, as `external:erp:<key>` | PASS: the same product |
| Create again with the same key and a new name | PASS: Spree updates the same product instead of making a second one. Exactly one product has the name |
| Add a second system's key, addressing the product by the first key | PASS: the product carries both keys |
| Give another product the first product's key | PASS: refused with 422, `conflicting_external_reference` |
| Delete the product by its key | PASS: reading it afterwards gives 404 |

### 2.4 Price history

The store already tracked price history before the run. The script would have switched it on and back off if it had not.

| Step | Result |
|---|---|
| Change a new product's price from 20.00 to 15.00, then to 25.00 | PASS: the prior price, the lowest recent price that Spree shows next to a price, is 15.00 |
| Change it to 10.00 through the bulk price update | PASS: the price is 10.00, and the prior price is still 15.00 |

The bulk step's prior price would be 15.00 whether or not Spree recorded that change. So this step does not show that bulk changes are recorded. It shows only that a bulk change leaves the prior price correct.

### 2.5 The hosted dashboard and seller panel

The dashboard was built for `/dashboard/` and the seller panel for `/sellers/`. Both were served by the hosting gem's test app. The script checked each app as follows:

| Step | Dashboard | Seller panel |
|---|---|---|
| The app's page is served at its address, with `Cache-Control: no-cache` | PASS | PASS |
| Its script is served with `immutable` caching | PASS | PASS |
| A deep link, such as `/dashboard/<record>/products`, serves the same page | PASS | PASS |
| A path that tries to climb out of the build folder (`..%2f..%2fconfig%2fdatabase.yml`) serves the same page, and no file | PASS | PASS |
| `/sellers` serves its own build, not the operator's dashboard | — | PASS |
| Sign in through the page, and land on the home page | PASS ([capture](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-home.png)) | PASS, as the sample seller's owner ([capture](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-seller-home.png)) |
| Open the products page directly, as on a reload | PASS ([capture](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-products-reloaded.png)) | PASS ([capture](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-seller-products-reloaded.png)) |
| Every request the browser made went to the server's own address | PASS | PASS |

**Result:** PASS for both apps.

### 2.6 Tracing

The tracing gem's test app was started with `OTEL_EXPORTER_OTLP_ENDPOINT` pointing at the script's collector, an `OTEL_SERVICE_NAME`, and `OTEL_BSP_SCHEDULE_DELAY=500`, which makes it send spans every half second. The script listed products and registered a shopper through the Store API. It then read the spans the server sent. It recorded span names, kinds and attribute names, never attribute values.

| Request | What reached the collector | Result |
|---|---|---|
| `GET /api/v3/store/products` | One trace of 9 spans under the request's server span. They come from the request, database and job layers | PASS |
| `POST /api/v3/store/customers` | One trace of 36 spans. 9 are Spree's own: the 7 steps of the `customers.create` workflow, the workflow's run as a whole, and the `user.created` event's dispatch. Spree's spans carry attributes such as `spree.workflow`, `spree.workflow.step`, `spree.workflow.outcome` and `spree.event.name` | PASS |

Both traces carried the configured service name, and all of each request's spans shared one trace.

The gem also traces several layers that were not seen here:

- a background job's run, with its trace carried over from the request that queued it;
- mail delivery and outgoing HTTP calls;
- extension hooks;
- payment gateway calls;
- webhook deliveries, which carry the trace to the system that receives them. P2's webhook check can see those.

**Result:** PASS for a request's trace reaching a collector.

## 3. What this means for the capabilities

Each result stays pending the owner's review of P1.

| Capability | Functional verification after P1 | What remains |
|---|---|---|
| CAP-11-06 APIs and kits | PARTIAL. The reference regenerates with 0 failures, and the comparison found SD-4. The Admin and Seller kits' reads work against the running server: 217 called with no server error, and every checked answer accepted except SD-3's. The Store kit's 22 integration tests still come from CI | 109 reads not called, almost all for lack of a record. The kits' writes. The 32 Admin reads the reference does not document |
| CAP-11-08 Hosted dashboards | PASS for the dashboard and the seller panel, on the hosting gem's own test app | — |
| CAP-11-10 Tracing | PASS for a request's trace, on the tracing gem's own test app | The layers in §2.6 that were not seen. Webhook propagation in P2 |
| CAP-03-12 External references | PASS through the Admin kit on the running server | — |
| CAP-05-11 Price history | PASS for single price changes. A bulk change leaves the prior price correct | Whether bulk changes are recorded |

## 4. Defects found

Both are added to [LIQ-004's defect table](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline). Neither is changed in Spree's code.

- **SD-3.** The Seller kit says an order always has both addresses, but the Seller API sends none for an order without them (§2.2).
- **SD-4.** The committed Admin reference is stale in two places (§2.1).

## 5. Limitations

- The checks run locally, like the other fidelity scripts, not in CI. They need the servers started as each script's header describes.
- The hosting and tracing checks use each gem's own test app, not a full Spree installation. Spree's seeds give those apps one store with no catalog, so the hosted apps' screens are mostly empty.
- The kit check calls reads only. What it can check depends on the browser tests' fixtures, which leave many resources without records.
- The reference comparison is by inspection of a normalised difference. It is not a byte-for-byte match, because the regeneration is deterministic only on the same machine.

## 6. Evidence

| File | What it shows |
|---|---|
| [kits.json](evidence/2026-10-22-fb-19-platform-p1-checks/kits.json) | Every Admin and Seller read: whether it was called, its route, status, schema, the records checked and any rejection |
| [records.json](evidence/2026-10-22-fb-19-platform-p1-checks/records.json) | Each external reference and price history step, with what Spree answered |
| [tracing.json](evidence/2026-10-22-fb-19-platform-p1-checks/tracing.json) | The two traces: span names, kinds, the instrumenting libraries and Spree's attribute names |
| [hosted-home.png](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-home.png) | The hosted dashboard's home after signing in at `/dashboard` |
| [hosted-products-reloaded.png](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-products-reloaded.png) | The dashboard's products page, opened directly |
| [hosted-seller-home.png](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-seller-home.png) | The hosted seller panel's home after signing in at `/sellers/login`, as the sample seller's owner |
| [hosted-seller-products-reloaded.png](evidence/2026-10-22-fb-19-platform-p1-checks/hosted-seller-products-reloaded.png) | The seller panel's products page, opened directly |
