# Batch 10's customer emails, rendered by Spree's own mailers in the emails
# gem's test app against a copy of the browser-test server's database, inside a
# transaction that is rolled back, as `order-emails.rb` rendered batch 8's.
# Each email is built by the call Spree's mailer preview makes:
#
#   EM-C-09  Spree::CustomerMailer.data_export_email   the last completed access
#            request for CUSTOMER_EMAIL, which the privacy card's export made
#   EM-C-10  Spree::NewsletterMailer.email_confirmation  an unconfirmed sign-up
#            for SUBSCRIBER_EMAIL, made in the transaction as the Store API's
#            subscribe makes one, since no storefront page does
#
# Copy the server's database to the emails test app as
# `db/spree_test_liquorify10.sqlite3`, then from `spree/emails/spec/dummy`:
#
#   SECRET_KEY_BASE=<the server's> RAILS_ENV=test TEST_ENV_NUMBER=_liquorify10 \
#     EMAILS_OUT=<folder> CUSTOMER_EMAIL=<shopper> SUBSCRIBER_EMAIL=<shopper> \
#     bin/rails runner <this file>
#
# Each email's HTML part is written to `<id>.html`, with the download and
# confirmation tokens, and the store's address in its links, replaced by a
# placeholder, and `emails.json` lists each subject, part and link. Recipients
# are not written out.

require 'fileutils'
require 'json'

out = ENV.fetch('EMAILS_OUT')
FileUtils.mkdir_p(out)
emails = []

ActiveRecord::Base.transaction do
  store = Spree::Store.default

  builds = {
    'EM-C-09' => lambda {
      request = Spree::DataRequest.access.with_status(:completed)
                                  .where(store: store, email: ENV.fetch('CUSTOMER_EMAIL'))
                                  .order(:created_at).last!
      [request.download_token, Spree::CustomerMailer.data_export_email(request)]
    },
    'EM-C-10' => lambda {
      subscriber = Spree::NewsletterSubscriber.unverified.find_by(store: store, email: ENV.fetch('SUBSCRIBER_EMAIL')) ||
                   Spree::NewsletterSubscriber.create!(store: store, email: ENV.fetch('SUBSCRIBER_EMAIL'))
      [subscriber.verification_token, Spree::NewsletterMailer.email_confirmation(subscriber)]
    }
  }

  builds.each do |id, build|
    secret, delivery = build.call
    mail = delivery.message
    html = (mail.html_part || mail).decoded
    site = html[%r{href="(https?://[^/"]+)}, 1]
    hide = lambda do |text, open_bracket, close_bracket|
      masked = text.gsub(secret, "#{open_bracket}token#{close_bracket}")
      site ? masked.gsub(/(href="|>)#{Regexp.escape(site)}/) { "#{Regexp.last_match(1)}#{open_bracket}site#{close_bracket}" } : masked
    end
    File.write(File.join(out, "#{id}.html"), hide.call(html, '&lt;', '&gt;'))
    emails << {
      email: id,
      subject: mail.subject,
      parts: mail.parts.map(&:content_type),
      links: html.scan(/href="([^"]+)"/).flatten.map { |link| hide.call("href=\"#{link}", '<', '>').delete_prefix('href="') }.uniq,
      token_hidden: !html.include?(secret) || hide.call(html, '<', '>').exclude?(secret)
    }
  end

  raise ActiveRecord::Rollback
end

File.write(File.join(out, 'emails.json'), JSON.pretty_generate(emails))
puts emails.map { |email| "#{email[:email]}: #{email[:subject]}" }
