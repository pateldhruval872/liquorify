# Batch 12's company invitation email, rendered by Spree's own mailer in the
# emails gem's test app against a copy of the browser-test server's database,
# inside a transaction that is rolled back, as `customer-emails.rb` rendered
# batch 10's. The email is built by the call Spree's mailer preview makes
# (`Spree::CompanyPreview#invitation_email`), for the pending invitation
# `companies.ts` made for INVITED_EMAIL:
#
#   EM-C-11  Spree::CompanyMailer.invitation_email
#
# The browser-test server does not send it: that app does not load the emails
# gem, whose subscriber sends it when an invitation is made.
#
# Copy the server's database to the emails test app as
# `db/spree_test_liquorify12.sqlite3`, then from `spree/emails/spec/dummy`:
#
#   SECRET_KEY_BASE=<the server's> RAILS_ENV=test TEST_ENV_NUMBER=_liquorify12 \
#     EMAILS_OUT=<folder> INVITED_EMAIL=<invitee> INVITING_COMPANY=<name> \
#     SENT_CHECK_EMAIL=<another invitee> bin/rails runner <this file>
#
# The HTML part is written to `EM-C-11.html` with the invitation's token, and
# the storefront's address in its links, replaced by a placeholder, and
# `emails.json` lists the subject, parts and links, where the link points, and
# what the emails gem's subscriber delivers when staff invite a second email.
# Recipients are counted, not written out.

require 'fileutils'
require 'json'

out = ENV.fetch('EMAILS_OUT')
FileUtils.mkdir_p(out)
emails = []

ActiveRecord::Base.transaction do
  store = Spree::Store.default
  invitation = Spree::CompanyInvitation.pending.joins(:company)
                                       .where(spree_companies: { store_id: store.id })
                                       .where(email: ENV.fetch('INVITED_EMAIL'))
                                       .order(:created_at).last!
  secret = invitation.token
  mail = Spree::CompanyMailer.invitation_email(invitation.id).message
  html = (mail.html_part || mail).decoded
  site = html[%r{href="(https?://[^/"]+)}, 1]
  hide = lambda do |text, open_bracket, close_bracket|
    masked = text.gsub(secret, "#{open_bracket}token#{close_bracket}")
    site ? masked.gsub(/(href="|>)#{Regexp.escape(site)}/) { "#{Regexp.last_match(1)}#{open_bracket}site#{close_bracket}" } : masked
  end
  File.write(File.join(out, 'EM-C-11.html'), hide.call(html, '&lt;', '&gt;'))
  emails << {
    email: 'EM-C-11',
    subject: mail.subject,
    parts: mail.parts.map(&:content_type),
    links: html.scan(/href="([^"]+)"/).flatten.map { |link| hide.call("href=\"#{link}", '<', '>').delete_prefix('href="') }.uniq,
    site_is_storefront: site == store.storefront_url&.chomp('/'),
    token_hidden: hide.call(html, '<', '>').exclude?(secret)
  }

  raise ActiveRecord::Rollback
end

# Whether Spree sends it: staff add an email with no account, as the dashboard's
# add member dialog does, and what the subscriber delivers is read. This runs
# outside the transaction above, because the event is published once the
# invitation is committed; the database is a copy and is discarded.
ActiveJob::Base.queue_adapter = :inline
ActionMailer::Base.delivery_method = :test
ActionMailer::Base.perform_deliveries = true
ActionMailer::Base.deliveries.clear
company = Spree::Company.where(store: Spree::Store.default).find_by!(name: ENV.fetch('INVITING_COMPANY'))
result = Spree::Companies::AddMember.call(company: company, email: ENV.fetch('SENT_CHECK_EMAIL'))
sent = {
  step: 'staff add an email with no account to the company',
  succeeded: result.success?,
  made: result.value.class.name.demodulize,
  delivered: ActionMailer::Base.deliveries.map do |mail|
    { subject: mail.subject, recipients: Array(mail.to).size, parts: mail.parts.map(&:content_type) }
  end
}

File.write(File.join(out, 'emails.json'), JSON.pretty_generate(emails: emails, sent: [sent]))
puts emails.map { |email| "#{email[:email]}: #{email[:subject]}" }
puts "#{sent[:step]}: #{sent[:succeeded]} #{sent[:delivered].map { |mail| mail[:subject] }}"
