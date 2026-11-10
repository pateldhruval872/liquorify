# Batch 13's seller and order group emails, rendered by Spree's own mailers in
# the emails gem's test app against a copy of the browser-test server's
# database, as batch 8 rendered the order emails (`order-emails.rb`):
#
#   EM-O-03  Spree::SellerMailer.approved_email                  APPROVED
#   EM-O-04  Spree::SellerMailer.rejected_email                  REJECTED
#   EM-O-05  Spree::SellerMailer.suspended_email                 SUSPENDED
#   EM-C-04  Spree::OrderGroupMailer.confirm_email               GROUP
#   EM-O-02  Spree::OrderGroupMailer.store_owner_notification_email GROUP
#
# The order group emails are built as Spree's preview builds them. Spree ships
# no preview for the seller emails, so they are built by calling the mailer
# with a named seller, as a preview would.
#
# Then, on the same copy, it checks what is sent where it takes effect: the
# seller emails switch (DA-SET-22), by approving a suspended seller through
# Spree's approve workflow with the switch on and then off, and EM-S-03, by
# inviting someone to a seller through the invite workflow. Events and jobs run
# in this process and mail is kept by the test delivery method, so what each
# step sent is read as Spree's subscribers sent it. The copy is discarded
# afterwards; nothing here touches the browser-test server's own database.
#
# Copy the server's database to the emails test app as
# `db/spree_test_liquorify13.sqlite3`, then from `spree/emails/spec/dummy`:
#
#   SECRET_KEY_BASE=<the server's> RAILS_ENV=test TEST_ENV_NUMBER=_liquorify13 \
#     EMAILS_OUT=<folder> APPROVED=<seller> REJECTED=<seller> SUSPENDED=<seller> \
#     GROUP=<order group number> SWITCH=<suspended seller> INVITE=<seller> \
#     bin/rails runner <this file>
#
# Sellers are named by prefixed ID. Each email's HTML part is written to
# `<id>.html`, with the store's address in its links replaced by a
# placeholder and any token in a link masked, and `emails.json` lists each
# subject, part, link and, for the sent checks, what was delivered to whom.

require 'fileutils'
require 'json'

out = ENV.fetch('EMAILS_OUT')
FileUtils.mkdir_p(out)
emails = []

ActiveJob::Base.queue_adapter = :inline
ActionMailer::Base.delivery_method = :test
ActionMailer::Base.perform_deliveries = true

seller = ->(name) { Spree::Seller.find_by_prefix_id!(ENV.fetch(name)) }
store = Spree::Store.default
if store.new_order_notifications_email.blank?
  store.update_columns(new_order_notifications_email: 'orders@example.com')
end

mask_link = lambda do |link, site|
  masked = link.gsub(/(token|invitation_token|t)=([^&"]+)/) { "#{Regexp.last_match(1)}=<token>" }
  masked = masked.gsub(%r{/invitations/([^/]+)/([A-Za-z0-9_-]{16,})}) { "/invitations/#{Regexp.last_match(1)}/<token>" }
  site ? masked.sub(site, '<site>') : masked
end

write = lambda do |id, mail, about|
  html = (mail.html_part || mail).decoded
  site = html[%r{href="(https?://[^/"]+)}, 1]
  links = html.scan(/href="([^"]+)"/).flatten.uniq
  shown = links.reduce(html) do |text, link|
    text.gsub("href=\"#{link}\"", "href=\"#{mask_link.call(link, site).gsub('<', '&lt;').gsub('>', '&gt;')}\"")
  end
  shown = shown.gsub(/>#{Regexp.escape(site)}/, '>&lt;site&gt;') if site
  File.write(File.join(out, "#{id}.html"), shown)
  emails << {
    email: id,
    about: about,
    subject: mail.subject,
    parts: mail.parts.map(&:content_type),
    recipients: Array(mail.to).size,
    links: links.map { |link| mask_link.call(link, site) }
  }
end

group = Spree::OrderGroup.find_by!(number: ENV.fetch('GROUP'))
write.call('EM-O-03', Spree::SellerMailer.approved_email(seller.call('APPROVED')).message, seller.call('APPROVED').name)
write.call('EM-O-04', Spree::SellerMailer.rejected_email(seller.call('REJECTED')).message, seller.call('REJECTED').name)
write.call('EM-O-05', Spree::SellerMailer.suspended_email(seller.call('SUSPENDED')).message, seller.call('SUSPENDED').name)
write.call('EM-C-04', Spree::OrderGroupMailer.confirm_email(group).message, group.number)
write.call('EM-O-02', Spree::OrderGroupMailer.store_owner_notification_email(group).message, group.number)

sent = lambda do |step, &action|
  ActionMailer::Base.deliveries.clear
  result = action.call
  {
    step: step,
    succeeded: result.respond_to?(:success?) ? result.success? : nil,
    delivered: ActionMailer::Base.deliveries.map do |mail|
      { subject: mail.subject, recipients: Array(mail.to).size, template: mail.header['X-Spree-Template']&.value }
    end
  }
end

switch_seller = seller.call('SWITCH')
operator = store.users.first || Spree.admin_user_class.first
checks = []

store.update!(preferred_send_seller_transactional_emails: true)
checks << sent.call('approve a suspended seller, seller emails on') do
  Spree.seller_approve_workflow.call(seller: switch_seller.reload, approver: operator)
end
checks << sent.call('suspend it again, seller emails on') do
  Spree.seller_suspend_workflow.call(seller: switch_seller.reload, suspended_by: operator)
end
store.update!(preferred_send_seller_transactional_emails: false)
checks << sent.call('approve it, seller emails off') do
  Spree.seller_approve_workflow.call(seller: switch_seller.reload, approver: operator)
end
store.update!(preferred_send_seller_transactional_emails: true)

invited = seller.call('INVITE')
invitation = nil
checks << sent.call('invite someone to the seller (EM-S-03)') do
  result = Spree.seller_invite_workflow.call(seller: invited, email: 'new-member@example.com', inviter: operator)
  invitation = ActionMailer::Base.deliveries.last
  result
end
write.call('EM-S-03', invitation, invited.name) if invitation

File.write(File.join(out, 'emails.json'), JSON.pretty_generate(emails: emails, sent: checks))
puts emails.map { |email| "#{email[:email]} #{email[:about]}: #{email[:subject]}" }
puts checks.map { |check| "#{check[:step]}: #{check[:succeeded]} #{check[:delivered].map { |mail| mail[:subject] }}" }
