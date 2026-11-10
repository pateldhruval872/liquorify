import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { MAIL_DIR, type Mail, mailTo } from './mail'
import { seedSellerPanel } from './seller-panel'

/**
 * Batch 13 part 2's seller emails as the browser-test server sent them
 * (work item §10.6): EM-S-02, the reset link asked for on SP-AUTH-02 by
 * `screens-batch-13-part-2.spec.ts`, and EM-S-03, the invitation sent from
 * SP-SET-06 by `seller-panel-checks.spec.ts`. Run after both, with the server
 * started with `LIQUORIFY_MAIL_DIR`. Each is written to
 * `results/emails-batch-13-part-2-html/<id>.html`, its token masked and local
 * addresses drawn as `<site>`, with `emails.json` beside them; then
 * `order-emails.spec.ts` captures them with `EMAILS_DIR` set to that folder
 * and `EMAILS_RESULTS=emails-batch-13-part-2`.
 */

const out = new URL('./results/emails-batch-13-part-2-html/', import.meta.url).pathname

const masked = (html: string) =>
  html
    .replace(/([?&]token=)[^"&\s<]+/g, '$1…')
    .replace(/(href="|>)(https?:\/\/)?localhost:\d+/g, '$1&lt;site&gt;')

const links = (mail: Mail) =>
  [...mail.html.matchAll(/href="([^"]+)"/g)].map((match) =>
    match[1]
      .replaceAll('&amp;', '&')
      .replace(/([?&]token=)[^&]+/, '$1…')
      .replace(/^https?:\/\/localhost:\d+/, '<site>'),
  )

test('the seller emails the server sent', async () => {
  const panel = await seedSellerPanel('http://localhost:3010')
  const reset = mailTo(panel.market.users.approved)
    .filter((mail) => /reset/i.test(mail.subject))
    .at(-1)
  const invitation = (() => {
    const invitee = readdirSync(MAIL_DIR)
      .filter((name) => /^cooper\.\d+@harbour-cask\.example\.com$/.test(name))
      .sort()
      .at(-1)
    return invitee ? { to: invitee, mail: mailTo(invitee).at(-1) } : null
  })()
  expect(reset, 'EM-S-02 sent to the member').toBeTruthy()
  expect(invitation?.mail, 'EM-S-03 sent to the invitee').toBeTruthy()

  mkdirSync(out, { recursive: true })
  const sent = [
    { id: 'EM-S-02', to: 'Harbour Cask member', mail: reset as Mail },
    { id: 'EM-S-03', to: 'the invitee', mail: invitation?.mail as Mail },
  ]
  for (const { id, mail } of sent) writeFileSync(`${out}${id}.html`, masked(mail.html))
  writeFileSync(
    `${out}emails.json`,
    JSON.stringify(
      sent.map(({ id, to, mail }) => ({ id, to, subject: mail.subject, links: links(mail) })),
      null,
      2,
    ),
  )
})
