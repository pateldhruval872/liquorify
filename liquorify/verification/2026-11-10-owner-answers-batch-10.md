---
title: The owner's answers on batch 10's gaps and defects
record: owner decisions
work_item: FB-19 (batch 10, P13), G-11, G-96 to G-99, SD-44 to SD-46
date: 2026-11-10
recorded_by: Claude (automated session); not independent review
result: On 2026-11-10 the owner answered batch 10's gaps and defects. G-96 is deferred, with each of its 39 stories given a destination and keeping its comparison status. G-97 goes to P13, a new bounded customer verification follow-up with an expected result and a closing condition for each of its 14 behaviours. G-98 is accepted as simulated interface-state coverage only. G-99 is linked to G-11, and its refusal checks go to P13's part B, separate from its browser tests, with the expected refusals and the controls recorded before implementation. P11 and P12 are unchanged. SD-45 is accepted at Medium and SD-44 and SD-46 at Low, open, with their fixes deferred until after the baseline. These are the owner's decisions; the technical acceptance of #94 is recorded apart, in its merge record
---

# The owner's answers on batch 10's gaps and defects

**What this records.** Batch 10, customers in the dashboard, was built in #94 ([record](2026-11-09-fb-19-batch-customers.md)). It left four gaps, G-96 to G-99, and three existing defects, SD-44 to SD-46, for the owner. On 2026-11-10 the owner answered them in writing, in one message that also answered other work. Its items 2 and 3 are batch 10's, and its item 5 asks that #94 merge under the delegation of 2026-11-04 and that these decisions be recorded apart from the technical acceptance. The rest of the message is recorded where its own work is.

This record is about the owner's decisions only. Whether #94 met its acceptance criteria and checks is recorded in #94's merge record, written once it merges, as delegated acceptance, not the owner's review. Under D5, an answer recorded here is the owner's approval, its date and its scope.

## 1. Each answer and where it is recorded

| ID | Proposed in #94 | The owner's answer, 2026-11-10 | Recorded in |
|---|---|---|---|
| G-96 | Defer to the comparison follow-up, as G-58, G-81, G-85, G-88 and G-93 | Deferral of the remaining comparisons is accepted. Each story gets a named destination, in batch 12 or 13 or the comparison follow-up, and keeps its actual comparison status (§2) | G-96 in [LIQ-004's gap register](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance), and the [comparison follow-up](../LIQ-004-foundation-backlog.md#comparisons-deferred-to-later-batches) |
| G-97 | Defer to the platform batch's browser-test work, as a further bounded step or an addition to P11 | A bounded customer verification follow-up is added, covering all 14 behaviours, with explicit expected results and closing conditions | The platform work item's step [P13](../work-items/fb-19-batch-platform.md#p13-customer-verification-a-follow-up-to-batch-10), part A |
| G-98 | Accept as simulated interface-state coverage only | Accepted, as proposed | G-98 in LIQ-004 |
| G-99 | Join G-11, through P12 or a later named follow-up | Linked to G-11. The customer refusal checks go into the new follow-up, separately from its browser tests. The expected refusals and the successful controls are recorded before implementation. The scopes already set for P11 and P12 stay as they are | P13, part B, with its checks recorded before implementation; G-99 and G-11 in LIQ-004 |
| SD-45 | Medium (proposed) | Accepted at Medium. Open, with the fix deferred until after the baseline | [LIQ-004's existing defects](../LIQ-004-foundation-backlog.md#existing-defects-found-by-the-baseline) |
| SD-44 | Low (proposed) | Accepted at Low. Open, with the fix deferred until after the baseline | LIQ-004's existing defects |
| SD-46 | Low (proposed) | Accepted at Low. Open, with the fix deferred until after the baseline | LIQ-004's existing defects |

## 2. G-96: each story's destination

Each story keeps the status batch 10's [image review list](2026-11-09-fb-19-batch-customers-image-review.md) gives it. A story leaves G-96 when the batch named here compares it, as the comparison follow-up sets out. A story that batch cannot show stays with its status, and G-96 stays DEFERRED for it, named. Batch 12 is wholesale, whose company page uses the address book row and the shared tax registrations card. Batch 13 is the marketplace, whose seller panel's profile uses the same tax registrations card.

| Story | Inventory ID | Story name | Status | Destination |
|---|---|---|---|---|
| S2 | CMP-DUI-C-02 | Address book row: Default for shipping | Checked against its source | Batch 12: the company page's addresses, which use the same address book row |
| S3 | CMP-DUI-C-02 | Address book row: Default for both, no label | Seen in a capture | Batch 12: the company page's addresses, which use the same address book row |
| S4 | CMP-DUI-C-02 | Address book row: No label or default | Checked against its source | Batch 12: the company page's addresses, which use the same address book row |
| S5 | CMP-DUI-C-02 | Address book row: Read-only | Checked against its source | Batch 12: the company page's addresses, which use the same address book row |
| S7 | CMP-DUI-C-02 | Address book row: Menu on the default shipping address | Checked against its source | Batch 12: the company page's addresses, which use the same address book row |
| S8 | CMP-DUI-C-02 | Address book row: Menu without default actions | Checked against its source | Batch 12: the company page's addresses, which use the same address book row |
| S9 | CMP-DUI-C-51 | Tax identifiers card: Each verdict | Checked against its source | Batch 13: the seller panel's profile, whose tax registrations use the same card; compared there only if its server registers a validator, so a verdict shows |
| S11 | CMP-DUI-C-51 | Tax identifiers card: None on file | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S12 | CMP-DUI-C-51 | Tax identifiers card: Loading | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S13 | CMP-DUI-C-51 | Tax identifiers card: Read-only | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S14 | CMP-DUI-C-51 | Tax identifiers card: Check under way | Checked against its source | Batch 13: the seller panel's profile, whose tax registrations use the same card; compared there only if its server registers a validator, so a verdict shows |
| S15 | CMP-DUI-C-51 | Tax identifiers card: Menu, number a registry can check | Checked against its source | Batch 13: the seller panel's profile, whose tax registrations use the same card; compared there only if its server registers a validator, so a verdict shows |
| S16 | CMP-DUI-C-51 | Tax identifiers card: Add sheet | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S17 | CMP-DUI-C-51 | Tax identifiers card: Kinds listed | Checked against its source | Batch 12: the company page's tax registrations, which use the same card |
| S18 | CMP-DUI-C-51 | Tax identifiers card: A kind typed in | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S19 | CMP-DUI-C-51 | Tax identifiers card: A kind typed in, saved | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S20 | CMP-DUI-C-51 | Tax identifiers card: Nothing entered | Checked against its source | Batch 12: the company page's tax registrations, which use the same card |
| S21 | CMP-DUI-C-51 | Tax identifiers card: Edit sheet | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S22 | CMP-DUI-C-51 | Tax identifiers card: Delete confirmation | Seen in a capture | Batch 12: the company page's tax registrations, which use the same card |
| S24 | CMP-DA-G-07 | Customer addresses card: One address, default for both | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S30 | CMP-DA-G-07 | Customer groups card: In two groups | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S33 | CMP-DA-G-07 | Customer groups card: Group removed, not saved | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S34 | CMP-DA-G-07 | Customer groups card: Saving | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S35 | CMP-DA-G-07 | Customer groups card: Refused for a read-only role | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S40 | CMP-DA-G-07 | Customer internal note card: Editing, empty | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S41 | CMP-DA-G-07 | Customer internal note card: Saving | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S43 | CMP-DA-G-07 | Customer last order card: Partly refunded | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S46 | CMP-DA-G-07 | Customer orders card: Every order shown | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S49 | CMP-DA-G-07 | Customer orders card: Loading | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S51 | CMP-DA-G-07 | Customer privacy card: No consent recorded | Checked against its source | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S54 | CMP-DA-G-07 | Customer privacy card: Exporting | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S55 | CMP-DA-G-07 | Customer privacy card: Export refused | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S57 | CMP-DA-G-07 | Customer profile card: No phone, not subscribed | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S60 | CMP-DA-G-07 | Customer profile card: Saving | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S61 | CMP-DA-G-07 | Customer profile card: Email already taken | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S70 | CMP-DA-G-07 | Customer tax identifiers card: Loading | Checked against its source | The comparison follow-up, kept at its status when the follow-up closes: the state passes before a settled capture can show it |
| S71 | CMP-DA-G-07 | Customer tax identifiers card: Read-only role | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S74 | CMP-DA-G-07 | Customer tax identifiers card: Number refused | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |
| S78 | CMP-DA-G-24 | Tax identifiers card: Refused, on the field | Seen in a capture | The comparison follow-up: the first later batch whose running screen shows the state, expected to be batch 12, whose wholesale customers open the same customer page |

In all: 15 stories go to batch 12, 3 to batch 13, and 21 to the comparison follow-up, 7 of which are states that pass before a settled capture can show them, so they keep their status when the follow-up closes.

## 3. What these answers do not change

- **The technical acceptance.** #94's acceptance criteria, its checks and its reference images are accepted, or not, in its merge record, under the delegation, not here.
- **P11 and P12.** Their scopes are unchanged. P13 is a separate step, with its own pull request and its own record.
- **Functional status.** No answer here makes a behaviour verified. CAP-08-02, CAP-08-03, CAP-08-05 and CAP-08-06 stay PARTIAL until P13 closes G-97, and what the server refuses to the narrower roles stays NOT_RUN until P13 closes G-99.
- **The defects.** SD-44 to SD-46 stay open. Nothing in Spree's code is changed for them during the baseline.
- **Tenant isolation.** FB-03 stays paused, as the owner asked in the same message, with its evidence private, ISO-1 to ISO-7 open and the multi-tenant release block kept.
