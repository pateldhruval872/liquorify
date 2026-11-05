# Batch 8's order emails, rendered by Spree's own mailers in the emails gem's
# test app against a copy of the browser-test server's database, inside a
# transaction that is rolled back, as batch 9 rendered EM-C-01. Each email is
# built by the call Spree's mailer preview makes, given a named order:
#
#   EM-C-02  Spree::OrderMailer.cancel_email                 CANCELED
#   EM-C-03  Spree::OrderMailer.payment_link_email           DRAFT (nothing sends it)
#   EM-C-07  Spree::DigitalAssetMailer.files_ready_email     DIGITAL
#   EM-O-01  Spree::OrderMailer.store_owner_notification_email PLACED
#
# Copy the server's database to the emails test app as
# `db/spree_test_liquorify8.sqlite3`, then from `spree/emails/spec/dummy`:
#
#   SECRET_KEY_BASE=<the server's> RAILS_ENV=test TEST_ENV_NUMBER=_liquorify8 \
#     EMAILS_OUT=<folder> CANCELED=R1010 DRAFT=R1004 DIGITAL=R1015 PLACED=R1007 \
#     bin/rails runner <this file>
#
# The browser-test server's own test secret signs the pictures' addresses, so
# the server serves them when the emails are captured; read it there with
# `bin/rails runner 'print Rails.application.secret_key_base'` and keep it out
# of every file.
#
# Each email's HTML part is written to `<id>.html`, with every order token and
# download token, and the store's address in its links, replaced by a
# placeholder, and `emails.json` lists each subject, part and link. Recipients
# are not written out.

require 'fileutils'
require 'json'

out = ENV.fetch('EMAILS_OUT')
FileUtils.mkdir_p(out)
emails = []

ActiveRecord::Base.transaction do
  order = ->(name) { Spree::Order.find_by!(number: ENV.fetch(name)) }
  store = Spree::Store.default
  # The store owner's notification goes to the store's own address; the copy
  # has none, so one is given for this transaction only.
  if store.new_order_notifications_email.blank?
    store.update_columns(new_order_notifications_email: 'orders@example.com')
  end

  builds = {
    'EM-C-02' => -> { [order.call('CANCELED'), Spree::OrderMailer.cancel_email(order.call('CANCELED'))] },
    'EM-C-03' => -> { [order.call('DRAFT'), Spree::OrderMailer.payment_link_email(order.call('DRAFT').id)] },
    'EM-C-07' => -> { [order.call('DIGITAL'), Spree::DigitalAssetMailer.files_ready_email(order.call('DIGITAL'))] },
    'EM-O-01' => -> { [order.call('PLACED'), Spree::OrderMailer.store_owner_notification_email(order.call('PLACED'))] }
  }

  builds.each do |id, build|
    record, delivery = build.call
    mail = delivery.message
    secrets = [record.token, *record.digital_links.map(&:token)].compact
    html = (mail.html_part || mail).decoded
    site = html[%r{href="(https?://[^/"]+)}, 1]
    # The placeholders are escaped in the HTML, so a capture shows them as
    # written; pictures keep the site's address, which the capture fetches.
    hide = lambda do |text, open_bracket, close_bracket|
      masked = secrets.reduce(text) { |done, secret| done.gsub(secret, "#{open_bracket}token#{close_bracket}") }
      masked.gsub(/(href="|>)#{Regexp.escape(site)}/) { "#{Regexp.last_match(1)}#{open_bracket}site#{close_bracket}" }
    end
    File.write(File.join(out, "#{id}.html"), hide.call(html, '&lt;', '&gt;'))
    emails << {
      email: id,
      order: record.number,
      subject: mail.subject,
      parts: mail.parts.map { |part| part.content_type },
      links: html.scan(/href="([^"]+)"/).flatten.map { |link| hide.call("href=\"#{link}", '<', '>').delete_prefix('href="') }.uniq
    }
  end

  raise ActiveRecord::Rollback
end

File.write(File.join(out, 'emails.json'), JSON.pretty_generate(emails))
puts emails.map { |email| "#{email[:email]} #{email[:order]}: #{email[:subject]}" }
