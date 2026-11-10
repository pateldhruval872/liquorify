# Batch 13's marketplace records on the browser-test server (marketplace.ts).
#
# Every lifecycle move goes through the workflow Spree's own API controllers
# call for it (`Spree.seller_approve_workflow` and so on), so each seller,
# submission and product reaches its status the way the operator's or the
# seller's request would take it there. Run with the dummy app's runner on
# the browser-test server's database; idempotent by name, so a second run
# reuses what the first made. Prints the records' prefixed ids as JSON.

store = Spree::Store.default
operator = store.users.first || Spree.admin_user_class.first
password = ENV.fetch('MARKETPLACE_PASSWORD')
provider = Spree::PayoutProvider::System.provider_key
currency = store.default_currency

def ok!(result, what)
  raise "#{what}: #{result.value.respond_to?(:errors) ? result.value.errors.full_messages.to_sentence : result.value.inspect} #{result.error.inspect}" unless result.success?

  result.value
end

def seller_named(store, name, email)
  store.sellers.find_by(name: name) ||
    ok!(Spree.seller_create_workflow.call(store: store, attributes: { name: name, contact_email: email }), "create #{name}")
end

def member(seller, email, first, last, password)
  user = Spree.admin_user_class.find_by(email: email) ||
         Spree.admin_user_class.create!(email: email, password: password, password_confirmation: password,
                                        first_name: first, last_name: last)
  seller.add_user(user) unless seller.users.include?(user)
  user
end

# The generic kinds the starting checklist leaves out, written as an operator
# would on the seller requirements page.
attestation = store.seller_requirements.find_by(type: 'Spree::SellerRequirements::Attestation') ||
              Spree::SellerRequirements::Attestation.create!(store: store, active: true, required: true,
                                                             name: 'Confirm you can ship within two working days')
review = store.seller_requirements.find_by(type: 'Spree::SellerRequirements::OperatorReview') ||
         Spree::SellerRequirements::OperatorReview.create!(store: store, active: true, required: true,
                                                           name: 'Marketplace background check')
review.update!(required: true) unless review.required?

submit = lambda do |seller, requirement, user, note = nil|
  ok!(Spree.seller_requirement_submission_create_workflow.call(
        seller: seller, requirement: requirement, note: note, submitted_by: user
      ), "submit #{requirement.type} for #{seller.name}")
end

sellers = {}

# Pending: created, nobody invited.
sellers[:pending] = seller_named(store, 'Fennel & Oak Provisions', 'hello@fennel-oak.example.com')

# Invited: an invitation sent, not yet accepted.
invited = seller_named(store, 'Larkspur Ciderworks', 'team@larkspur.example.com')
if invited.pending?
  ok!(Spree.seller_invite_workflow.call(seller: invited, email: 'owner@larkspur.example.com', inviter: operator), 'invite')
end
sellers[:invited] = invited

# Onboarding: an invitation accepted (start onboarding is what accepting runs),
# one requirement submitted and awaiting review.
onboarding = seller_named(store, 'Stonecrop Cellars', 'office@stonecrop.example.com')
onboarding_user = member(onboarding, 'maya.okafor@stonecrop.example.com', 'Maya', 'Okafor', password)
ok!(Spree.seller_start_onboarding_workflow.call(seller: onboarding), 'start onboarding') if onboarding.pending?
submit.call(onboarding, attestation, onboarding_user, 'We dispatch every weekday from our own cellar.') if attestation.latest_submission(onboarding).nil?
submit.call(onboarding, review, onboarding_user, 'Licence PL-0419 attached to our profile.') if review.latest_submission(onboarding).nil?
sellers[:onboarding] = onboarding.reload

# Ready for review: every requirement met or waived, then submitted.
ready = seller_named(store, 'Juniper Row Distillers', 'founders@juniper-row.example.com')
ready_user = member(ready, 'theo.lindqvist@juniper-row.example.com', 'Theo', 'Lindqvist', password)
ok!(Spree.seller_start_onboarding_workflow.call(seller: ready), 'start onboarding') if ready.pending?
if ready.onboarding?
  submit.call(ready, attestation, ready_user, 'Two-day dispatch from Leith.') if attestation.latest_submission(ready).nil?
  if review.latest_submission(ready).nil?
    accepted = submit.call(ready, review, ready_user, 'Distillery licence DL-2231.')
    ok!(Spree.seller_requirement_submission_accept_workflow.call(submission: accepted, reviewed_by: operator,
                                                                 review_note: 'Confirmed by phone.'), 'accept')
  end
  store.seller_requirements.active.where(required: true).where.not(id: [attestation.id, review.id]).find_each do |requirement|
    next if requirement.satisfied?(ready)

    ok!(Spree.seller_requirement_submission_waive_workflow.call(
          seller: ready, requirement: requirement, reviewed_by: operator,
          review_note: 'Covered by the distillery licence we hold on file.'
        ), "waive #{requirement.type}")
  end
  ok!(Spree.seller_submit_for_review_workflow.call(seller: ready, submitted_by: ready_user), 'submit for review')
end
sellers[:ready] = ready.reload

# Approved: admitted over its unfinished checklist, with a team, products and a ledger.
approved = seller_named(store, 'Harbour Cask Co.', 'accounts@harbour-cask.example.com')
approved_user = member(approved, 'ines.carvalho@harbour-cask.example.com', 'Ines', 'Carvalho', password)
ok!(Spree.seller_start_onboarding_workflow.call(seller: approved), 'start onboarding') if approved.pending?
if approved.onboarding?
  submit.call(approved, attestation, approved_user, 'Next-day dispatch, Monday to Thursday.') if attestation.latest_submission(approved).nil?
  if review.latest_submission(approved).nil?
    sent_back = submit.call(approved, review, approved_user, 'Licence to follow.')
    ok!(Spree.seller_requirement_submission_reject_workflow.call(
          submission: sent_back, reviewed_by: operator,
          review_note: 'Please upload the premises licence, not the application.'
        ), 'reject submission')
  end
  ok!(Spree.seller_approve_workflow.call(seller: approved, approver: operator, override_requirements: true), 'approve')
end
approved.update!(about: 'Small-batch rum and whisky, aged in the harbour warehouses since 1998.',
                 legal_name: 'Harbour Cask Company Ltd', registration_number: 'SC612044',
                 billing_email: 'billing@harbour-cask.example.com', minimum_payout_amount: 50,
                 payouts_schedule_interval: 'weekly')
unless approved.invitations.pending.exists?(email: 'cellar@harbour-cask.example.com')
  approved.invitations.create!(email: 'cellar@harbour-cask.example.com', role: approved.default_user_role, inviter: approved_user)
end
sellers[:approved] = approved.reload

# Rejected and suspended, each from its own starting point.
rejected = seller_named(store, 'Northgate Vintners', 'sales@northgate.example.com')
ok!(Spree.seller_reject_workflow.call(seller: rejected, reason: 'Licence could not be verified.', rejected_by: operator), 'reject') if rejected.pending?
sellers[:rejected] = rejected.reload

suspended = seller_named(store, 'Copperline Brewing', 'brewers@copperline.example.com')
member(suspended, 'sam.reyes@copperline.example.com', 'Sam', 'Reyes', password)
ok!(Spree.seller_start_onboarding_workflow.call(seller: suspended), 'start onboarding') if suspended.pending?
ok!(Spree.seller_approve_workflow.call(seller: suspended, approver: operator, override_requirements: true), 'approve') if suspended.onboarding?
ok!(Spree.seller_suspend_workflow.call(seller: suspended, reason: 'Unpaid fees.', suspended_by: operator), 'suspend') if suspended.approved?
sellers[:suspended] = suspended.reload

# Sellers' products: one on sale, one awaiting review, one sent back, one draft,
# and one from the suspended seller.
product = lambda do |seller, name, price|
  store.products.find_by(name: name) ||
    begin
      ok!(Spree.product_create_workflow.call(store: store, attributes: {
            name: name, status: 'draft', seller_id: seller.id,
            variants: [{ sku: name.parameterize.upcase.first(20), prices: [{ amount: price, currency: store.default_currency }] }]
          }), "create #{name}")
    end
end
products = {}
products[:proposed] = product.call(approved, 'Harbour Cask 12 Year Single Malt', 64)
ok!(Spree.product_propose_workflow.call(product: products[:proposed], submitted_by: approved_user), 'propose') if products[:proposed].draft?
products[:rejected] = product.call(approved, 'Harbour Cask Spiced Rum Gift Set', 38)
if products[:rejected].draft?
  ok!(Spree.product_propose_workflow.call(product: products[:rejected], submitted_by: approved_user), 'propose')
  ok!(Spree.product_reject_workflow.call(product: products[:rejected], reason: 'Add the bottle size and the ABV to the description.', reviewer: operator), 'reject product')
end
products[:active] = product.call(approved, 'Harbour Cask Navy Strength Rum', 42)
if products[:active].draft?
  ok!(Spree.product_propose_workflow.call(product: products[:active], submitted_by: approved_user), 'propose')
  ok!(Spree.product_approve_workflow.call(product: products[:active], reviewer: operator), 'approve product')
end
# A second admitted seller, so a checkout can split one purchase between two sellers.
second = seller_named(store, 'Saltmarsh Gin Co.', 'orders@saltmarsh.example.com')
second_user = member(second, 'priya.nair@saltmarsh.example.com', 'Priya', 'Nair', password)
ok!(Spree.seller_start_onboarding_workflow.call(seller: second), 'start onboarding') if second.pending?
ok!(Spree.seller_approve_workflow.call(seller: second, approver: operator, override_requirements: true), 'approve') if second.onboarding?
sellers[:second] = second.reload
products[:second] = product.call(second, 'Saltmarsh Coastal Gin', 34)
if products[:second].draft?
  ok!(Spree.product_propose_workflow.call(product: products[:second], submitted_by: second_user), 'propose')
  ok!(Spree.product_approve_workflow.call(product: products[:second], reviewer: operator), 'approve product')
end
products[:draft] = product.call(approved, 'Harbour Cask Cask Strength Sampler', 29)
products[:suspended] = product.call(suspended, 'Copperline Harbour Porter', 6)
if products[:suspended].draft?
  ok!(Spree.product_propose_workflow.call(product: products[:suspended], submitted_by: nil), 'propose')
  ok!(Spree.product_approve_workflow.call(product: products[:suspended], reviewer: operator), 'approve product')
end

# The store's own product beside them, sold from its own stock.
products[:own] = store.products.find_by(name: 'Liquorify House Bitters') ||
                 ok!(Spree.product_create_workflow.call(store: store, attributes: {
                       name: 'Liquorify House Bitters', status: 'active',
                       variants: [{ sku: 'HOUSE-BITTERS', prices: [{ amount: 18, currency: store.default_currency }] }]
                     }), 'create the house product')

# On sale: published to the store's channels, with stock at the seller's own
# location, or the store's for its own product.
[products[:active], products[:second], products[:suspended], products[:own]].each do |record|
  store.channels.each { |channel| channel.add_products([record.id]) }
  record.variants.each do |variant|
    location = record.seller ? record.seller.stock_locations.first : Spree::StockLocation.where(seller_id: nil).order(:id).first
    item = location.stock_levels.find_or_create_by!(variant: variant)
    item.set_count_on_hand(24) if item.count_on_hand < 24
  end
end

# The approved seller's ledger: earnings settled by a completed payout, more
# owed on a pending one, one not yet in a payout, and a refund's reversal.
if approved.seller_transfers.none?
  orders = 4.times.map do |index|
    Spree::Order.create!(store: store, seller: approved, currency: currency,
                         email: "harbour-buyer-#{index + 1}@example.com", status: 'placed',
                         completed_at: (index + 1).weeks.ago, total: 80 + (index * 20), item_total: 80 + (index * 20))
  end
  settled = approved.seller_payouts.create!(store: store, amount: 0, currency: currency, provider: provider,
                                            status: 'pending', period_start: 6.weeks.ago, period_end: 4.weeks.ago)
  owed = approved.seller_payouts.create!(store: store, amount: 0, currency: currency, provider: provider,
                                         status: 'pending', period_start: 3.weeks.ago, period_end: 1.week.ago)
  [[settled, 0], [settled, 1], [owed, 2], [nil, 3]].each do |payout, index|
    order = orders[index]
    approved.seller_transfers.create!(store: store, order: order, payout: payout, kind: 'earning',
                                      amount: Spree::Money::Rounding.to_currency(order.total * BigDecimal('0.85'), currency),
                                      currency: currency, provider: provider, status: 'completed',
                                      created_at: order.completed_at)
  end
  original = approved.seller_transfers.earnings.order(:created_at).first
  approved.seller_transfers.create!(store: store, order: original.order, reversed_from: original, payout: owed,
                                    amount: -Spree::Money::Rounding.to_currency(original.amount / 2, currency),
                                    currency: currency, kind: 'refund_reversal', provider: provider, status: 'completed')
  [settled, owed].each { |payout| payout.update!(amount: payout.transfers.sum(:amount)) }
  ok!(Spree.seller_payout_complete_workflow.call(seller_payout: settled, reference: 'BACS-HARBOUR-0417'), 'complete payout')
end

payouts = approved.seller_payouts.order(:created_at).to_a
transfers = approved.seller_transfers.order(:created_at).to_a

puts({
  sellers: sellers.transform_values(&:prefixed_id),
  statuses: sellers.transform_values(&:status),
  products: products.transform_values(&:prefixed_id),
  product_statuses: products.transform_values(&:status),
  payouts: payouts.map { |payout| [payout.prefixed_id, payout.status] },
  transfers: transfers.map { |transfer| [transfer.prefixed_id, transfer.kind, transfer.order&.prefixed_id] },
  requirements: { attestation: attestation.prefixed_id, review: review.prefixed_id },
  users: { approved: approved_user.email, ready: ready_user.email, onboarding: onboarding_user.email }
}.to_json)
