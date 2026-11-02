---
title: FB-19 platform batch, step P1, the mail check
record: verification
work_item: FB-19
date: 2026-10-22
verifier: Claude (automated session); not independent review
result: PASS for the staff mail on the browser-test server, read from a folder the test app writes it to, with each link followed in the browser; PASS for the storefront's reset email, sent through Spree's webhook. PASS for Spree's own customer reset email on the emails gem's own test app, read from a folder that app writes it to, with its link's token resetting the password through the Store API. On the browser-test server that email stays BLOCKED, because that server does not load the gem that sends it. P1's other checks are in their own record, 2026-10-22-fb-19-platform-p1-checks.md. The owner accepted P1 on 2026-10-23, after the merge, and left its gaps pending
---

# FB-19 platform batch, step P1, the mail check

**Claim.** The [platform batch](../work-items/fb-19-batch-platform.md) asked in step P1 whether Spree's browser-test server can deliver mail where a script can read it without changing Spree's code, which would close the email gaps of the staff and account batches. It can, for the staff emails and for the storefront's own reset email. Scripts now read those emails and follow their links in the browser through the flows they belong to. Spree's own customer reset email cannot be read on that server. After the owner's review, it was read on the emails gem's own test app instead, where it is sent and its link resets the password. P1's other checks are in [their own record](2026-10-22-fb-19-platform-p1-checks.md).

**Scope.** The staff flows FL-02 and FL-03 from [part 1 of the staff batch](2026-10-22-fb-19-batch-staff-access-part-1.md), and the password reset steps of FL-09 from the [shopper accounts batch](2026-10-22-fb-19-batch-storefront-shopper-accounts.md). The other P1 checks (the API reference, the developer kits, the hosted dashboard, tracing, external references and price history) are in [their own record](2026-10-22-fb-19-platform-p1-checks.md).

**What the gap register said.** G-03, G-04 and G-05 for the staff emails and G-15 and G-16 for the storefront ([LIQ-004](../LIQ-004-foundation-backlog.md#deferred-gaps-and-the-owners-acceptance)) were deferred to this check. G-03 and G-04 say that Spree's API spec cannot close them, because a spec does not show the browser flow working. Nothing here accepts a gap; the owner answers each one as its pull request is reviewed.

## 1. How mail reaches a script, without changing Spree

| Email | Who sends it | How the check reads it | What changes, and where |
|---|---|---|---|
| EM-S-01, EM-S-03, EM-S-04 | Spree's staff mailers in the core gem | Rails' file delivery writes each message to a folder, one file per recipient | The fidelity harness writes a small settings file into the generated test app while its server runs, and removes it when the server stops, as the dashboard's own browser tests do for their job queue. It applies only when `LIQUORIFY_MAIL_DIR` is set. Spree's code and its test settings are unchanged |
| EM-SF-04 | The storefront, when Spree's `customer.password_reset_requested` webhook reaches it | The storefront writes the email to `.next/emails/` when it has no mail service key, as its code already does | Two of Spree's own settings when the server starts: `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS`, which lets Spree deliver a webhook to a local address, and a webhook endpoint created through the Admin API. Nothing in either code base changes |
| EM-C-08 | Spree's customer mailers, in the emails gem | On the emails gem's own test app, Rails' file delivery writes each message to a folder, one file per recipient | The browser-test server does not load the emails gem, so it never sends this email, and no setting changes that. The check instead starts the gem's own test app. Its test environment keeps mail in memory and only queues jobs, so the email's subscriber and mailer would not run. A settings file the script writes into that generated test app, and removes when it stops, writes the mail to the folder and runs jobs in the server. Spree's code and its test settings are unchanged |

The staff links point at the dashboard under test because the server starts with `SPREE_DASHBOARD_URL`, Spree's setting for where its dashboard is. Without it, Spree builds the links from its default address and ignores the address the dashboard sends, which is the behaviour a store without that setting has.

## 2. Results

Run locally on 2026-10-22, at backend `a4a1708` for Spree's code and storefront `8153a6b` for the storefront's application code; the scripts are this record's revision and storefront `ffefa7e`. The browsers ran in each repository's pinned Playwright image. Each script ran twice and passed both times. EM-C-08's check ran on 2026-10-23 (§2.3).

### 2.1 Staff mail, `fidelity/mail.spec.ts`

| Flow | Step | What the check did | Result |
|---|---|---|---|
| FL-02 Invite a staff member | DA-SET-24: invite | Invited a new address from the staff page | PASS |
| | EM-S-03: the invitation email | Read the invitee's email, "Invitation to join Shop", and took its link, which points at the dashboard's acceptance page with a token | PASS: the email is sent during the flow |
| | DA-AUTH-04: accept | Opened the mailed link in a new browser, filled the form and accepted; the page left for the dashboard, signed in | PASS |
| | EM-S-04: the acceptance email to the inviter | Read the inviter's new email, "Mail Check has accepted your invitation to join Shop" | PASS: the email is sent during the flow |
| FL-03 Staff password reset | DA-AUTH-01 → DA-AUTH-02 | From the sign-in page, followed "Forgot password", asked for a link, and saw "Check your email" | PASS |
| | EM-S-01: the email | Read the teammate's email, "Shop Password Reset Instructions", and took its link to the dashboard's reset page | PASS: the email is sent during the flow |
| | DA-AUTH-03: choose a new password | Opened the mailed link, entered and confirmed a new password, and saved. The page left for the dashboard, signed in as that teammate ([the saved state](evidence/2026-10-22-fb-19-platform-p1-mail/da-auth-03-saved.png)) | PASS: the "saved" state is captured |
| | DA-AUTH-01: sign in again | The old password was refused with "Invalid email or password"; the new one signed in | PASS |

Each run adds its own teammate, so the browser tests' admin keeps its password. The saved state is captured at 1280 by 800 while the dashboard's figures are still loading; the state is the landing, signed in as the teammate, which the capture shows.

### 2.2 The storefront's reset email, `visual/fidelity/mail.spec.ts`

| Step | What the check did | Result |
|---|---|---|
| SF-ACC-02: a new customer | Signed up a new customer through the storefront's form | PASS |
| SF-ACC-03: request a reset link | As a guest, asked for a link and saw "Check your email" | PASS |
| EM-SF-04: the email | Spree delivered its webhook to the storefront, which wrote one new email, "Spree Store Password Reset". Its link points at the storefront's reset page with a token | PASS: the email is sent during the flow |
| SF-ACC-04: choose a new password | Opened the mailed link, entered and confirmed a new password, and saw "Password reset successful" | PASS |
| Sign in again | The old password was refused with "Invalid email or password"; the new one opened the account overview | PASS |

### 2.3 Spree's own customer reset email, `fidelity/customer-mail.spec.ts`

**On the browser-test server:** BLOCKED. It sent no email to the new customers in §2.2, because it does not load the emails gem.

**On the emails gem's own test app**, as the owner asked after reviewing P1. That is `spree/emails` after `rake test_app`, in its test environment, with a database of its own given Spree's seeds. The script starts the app on its own port and stops it at the end. It ran twice at backend `a4a1708` for Spree's code, with the script at this record's revision. Both runs passed with the same results ([customer-mail.json](evidence/2026-10-22-fb-19-platform-p1-mail/customer-mail.json)).

| Step | What the check did | Result |
|---|---|---|
| A new customer | Signed up a customer through the Store API | PASS: 201 |
| Ask for a reset link | Asked through the Store API, naming the reset page the storefront's form names, on the store's allowed origin | PASS: 202 |
| EM-C-08: the email | Spree's subscriber and mailer wrote one email to the customer, "Shop Password Reset Instructions". Its link is the reset page asked for, with a token | PASS: the email is sent when a reset is asked for |
| Choose a new password | Sent the mailed link's token and a new password to the Store API, as the storefront's reset page does | PASS: 200 |
| The link works once | Sent the same token again | PASS: refused with 422 |
| Sign in again | The old password was refused with 401, and the new one signed in | PASS |

**What this setup does not show.**

- It is the gem's test app, not a full installation with a storefront. No storefront page was opened, and the link was not followed in a browser. The token was used as the storefront's reset page uses it.
- The app writes mail to files only for this check. A store sends mail through its own mail service.
- A reset asked for without an allowed redirect was not tried. Its link opens the storefront's home page rather than a reset page, as the [shopper accounts batch](2026-10-22-fb-19-batch-storefront-shopper-accounts.md#5-the-storefronts-behaviour-found-recorded-and-not-changed) found (B11).
- The email's looks were checked in the batch that rendered it.

## 3. What this means for the gaps

The owner accepted P1 on 2026-10-23, after #13 and storefront #19 merged, and chose to answer each of these gaps separately. Later that day the owner closed G-03, G-04, G-05 and G-15 against this evidence, and kept G-16 pending ([merge record §4](2026-10-23-fb-19-platform-p1-merge.md#4-the-owners-answer-on-four-of-p1s-gaps)).

| Gap | What the evidence shows | What remains |
|---|---|---|
| G-03 DA-AUTH-03 "saved" not captured | Captured after a real reset from a mailed link (§2.1) | Nothing: CLOSED on 2026-10-23 |
| G-04 Saving a new staff password in the browser (FL-03) | Saved from the mailed link, and the new password signs in (§2.1). FL-03 would then have a browser test for every step | Nothing: CLOSED on 2026-10-23 |
| G-05 EM-S-01, EM-S-03 and EM-S-04 not seen sent | Each read during its flow (§2.1) | Nothing: CLOSED on 2026-10-23 |
| G-15 FL-09's three password reset steps | Requested, mailed and saved in the browser (§2.2) | Nothing: CLOSED on 2026-10-23 |
| G-16 Whether EM-C-08 or EM-SF-04 is sent | EM-SF-04 is sent through Spree's webhook (§2.2). EM-C-08 is sent on the emails gem's own test app, and its link's token resets the password there; the browser-test server cannot send it (§2.3) | PENDING, at the owner's answer: the remaining email configuration, including whether the gem's test app is enough for EM-C-08, and P2's webhook deliveries |

## 4. Limitations

- The checks run locally, like the other fidelity scripts, not in CI. They need the server, the dashboard and the storefront started as each script's header describes.
- They show the emails are sent and their links work. The emails' looks were checked in the batches that rendered them.
- The file delivery and the local webhook address are test settings. A store sends mail through its own mail service, and delivers webhooks to a public address; neither is exercised here.
- Spree's own customer email is observed only on the emails gem's test app, through the Store API, without a storefront or a browser (§2.3).

## 5. Evidence

| File | What it shows |
|---|---|
| [da-auth-03-saved.png](evidence/2026-10-22-fb-19-platform-p1-mail/da-auth-03-saved.png) | DA-AUTH-03 "saved": the dashboard right after saving a new password from the mailed link, signed in as the teammate "Mail Check" |
| [customer-mail.json](evidence/2026-10-22-fb-19-platform-p1-mail/customer-mail.json) | EM-C-08 on the emails gem's test app: the status of each Store API step, the email's subject and the path its link goes to. No token, key, password or address |
