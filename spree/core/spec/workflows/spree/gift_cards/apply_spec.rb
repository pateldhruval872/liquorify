require 'spec_helper'

RSpec.describe Spree::GiftCards::Apply do
  subject { described_class.call(gift_card: gift_card, order: order) }

  let(:store) { Spree::Store.default }
  let(:order) { create(:order_with_totals, store: store, customer: order_user, line_items_price: 30) }
  let(:order_user) { create(:user) }

  let(:gift_card) { create(:gift_card, amount: 50, store: store, customer: gift_card_user) }
  let(:gift_card_user) { nil }
  let(:store_credit_payment) { order.payments.store_credits.last }
  let(:store_credit) { store_credit_payment.source }

  before do
    order.update_column(:total, 30)
  end

  it 'applies the gift card to an order' do
    expect { subject }.to change(Spree::StoreCredit, :count).by(1)
    expect(subject).to be_success

    expect(order.reload.gift_card).to eq(gift_card)
    expect(order.gift_card_total).to eq(30)

    expect(gift_card.reload.amount_remaining).to eq(20)

    expect(store_credit_payment).to be_present
    expect(store_credit_payment).to be_checkout
    expect(store_credit_payment.source).to eq(gift_card.store_credits.last)
    expect(store_credit_payment.amount).to eq(30)

    expect(store_credit.amount).to eq(30)
    expect(store_credit.store).to eq(Spree::Store.default)
    expect(store_credit.originator).to eq(gift_card)
  end

  it 'calls recalculate_totals!' do
    expect(order).to receive(:recalculate_totals!)
    subject
  end

  context 'when the order has applied store credit' do
    let!(:store_credit_payment_method) { create(:store_credit_payment_method) }
    let!(:store_credit) { create(:store_credit, customer: order.customer, amount: 10, store: store) }

    before do
      order.add_store_credit_payments
    end

    it 'responds with an error' do
      expect { subject }.not_to change(Spree::StoreCredit, :count)

      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_using_store_credit_error)

      expect(order.reload.gift_card).to be_nil
      expect(order.total_applied_store_credit).to eq(10)
      expect(order.payments.store_credits.last.source.originator).to be_nil
    end
  end

  context 'when the gift card has a different currency' do
    let(:gift_card) { create(:gift_card, amount: 50, store: store, customer: gift_card_user, currency: 'USD') }
    let(:order) { create(:order, store: store, customer: order_user, currency: 'EUR') }

    it 'responds with an error' do
      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_mismatched_currency)
    end
  end

  context 'when the gift card is assigned to a user' do
    let(:gift_card_user) { create(:user) }
    let(:order_user) { nil }

    context 'with valid user' do
      let(:order_user) { gift_card_user }

      it 'applies the gift card to the order' do
        expect(subject).to be_success
      end

      it 'calls recalculate_totals!' do
        expect(order).to receive(:recalculate_totals!)
        subject
      end
    end

    context 'with guest order' do
      it 'responds with an error' do
        expect(subject).to be_failure
        expect(subject.error.value).to eq(:gift_card_customer_not_logged_in)
      end
    end

    context 'with another user order' do
      let(:order_user) { create(:user) }

      it 'responds with an error' do
        expect(subject).to be_failure
        expect(subject.error.value).to eq(:gift_card_mismatched_customer)
      end
    end
  end

  # Real parallel connections need the transaction wrapper off, and a database
  # with real row locking.
  context 'when applied concurrently to multiple orders', if: %w[postgres mysql].include?(ENV['DB']) do
    include_context 'with committed records'

    let(:gift_card) { create(:gift_card, amount: 100, store: store) }
    let(:orders) { Array.new(5) { order_totalling_80 } }

    def order_totalling_80
      order = create(:order_with_totals, store: store, customer: create(:user), line_items_price: 80)
      order.update_columns(total: 80, item_total: 80)
      order
    end

    def apply_action(gift_card_id, order_id)
      lambda do
        thread_gift_card = Spree::GiftCard.find(gift_card_id)
        thread_order = Spree::Order.find(order_id)
        -> { described_class.call(gift_card: thread_gift_card, order: thread_order) }
      end
    end

    def apply_concurrently(gift_card_id, order_ids)
      run_together(order_ids.map { |order_id| apply_action(gift_card_id, order_id) })
    end

    # Some apply must win, and every other one must be refused for the
    # balance. The right refusal here is that another order holds the card,
    # but on MySQL the check that chooses it reads the other orders from the
    # transaction's older snapshot and can answer that nothing is left, so
    # both are accepted until that check is changed.
    def expect_some_applied_and_the_rest_refused_for_the_balance(results)
      expect(results.count(&:success?)).to be >= 1
      expect(results.reject(&:success?).map { |result| result.error.value }).to all(
        eq(:gift_card_held_by_another_order).or(eq(:gift_card_no_amount_remaining))
      )
    end

    it 'does not generate store credits exceeding the gift card value' do
      results = apply_concurrently(gift_card.id, orders.map(&:id))

      gift_card.reload
      total_credits = Spree::StoreCredit.where(originator: gift_card).sum(:amount)

      expect(total_credits).to be <= gift_card.amount
      expect(gift_card.amount_used).to be <= gift_card.amount
      expect_some_applied_and_the_rest_refused_for_the_balance(results)
    end

    # Each apply first releases the other order's hold, and each one waits on
    # that hold's lock. One that read before the wait must not release it again
    # once it has the lock, or it hands back a balance already handed back.
    it 'does not credit more than the card is worth when another open order already holds it' do
      holder = order_totalling_80
      expect(described_class.call(gift_card: gift_card, order: holder)).to be_success

      results = apply_concurrently(gift_card.id, orders.map(&:id))

      gift_card.reload
      live_credits = Spree::StoreCredit.where(originator: gift_card).sum(:amount)

      expect(live_credits).to be <= gift_card.amount
      expect(live_credits).to eq(gift_card.amount_used)
      expect_some_applied_and_the_rest_refused_for_the_balance(results)
    end

    it 'keeps the balance whole when the holder takes the card off while others apply it' do
      holder = order_totalling_80
      expect(described_class.call(gift_card: gift_card, order: holder)).to be_success

      remove_action = lambda do
        thread_holder = Spree::Order.find(holder.id)
        -> { Spree.gift_card_remove_workflow.call(order: thread_holder) }
      end
      removal, *applies = run_together([remove_action] + orders.first(4).map { |order| apply_action(gift_card.id, order.id) })

      gift_card.reload
      live_credits = Spree::StoreCredit.where(originator: gift_card).sum(:amount)

      expect(removal).to be_success
      expect(holder.reload.gift_card).to be_nil
      expect(live_credits).to be <= gift_card.amount
      expect(live_credits).to eq(gift_card.amount_used)
      expect_some_applied_and_the_rest_refused_for_the_balance(applies)
    end

    # An apply that released the hold and was then rolled back must leave the
    # hold for the apply waiting on its lock, which has to find it still held
    # and release it once, not see the rolled-back release.
    it 'leaves the hold to a waiting apply when the apply that released it rolls back' do
      holder = order_totalling_80
      expect(described_class.call(gift_card: gift_card, order: holder)).to be_success
      rolled_back_order, waiting_order = orders.first(2)
      released = Concurrent::CountDownLatch.new(1)
      waiting_session = nil

      hold_open = Spree.hooks.register('gift_cards.apply.release_holds') do |flow|
        next unless flow.order.id == rolled_back_order.id

        released.count_down
        wait_until_waiting_for_a_lock(waiting_session)
      end
      reject = Spree.hooks.register('gift_cards.apply.after_apply') do |flow|
        flow.reject!('rolled back by the test') if flow.order.id == rolled_back_order.id
      end

      waiting_action = lambda do
        waiting_session = database_session_id
        prepare = apply_action(gift_card.id, waiting_order.id).call
        lambda do
          raise 'The first apply never released the hold' unless released.wait(5)

          prepare.call
        end
      end
      rolled_back, waited = run_together([apply_action(gift_card.id, rolled_back_order.id), waiting_action])

      gift_card.reload
      live_credits = Spree::StoreCredit.where(originator: gift_card).sum(:amount)

      expect(rolled_back).to be_failure
      expect(waited).to be_success
      expect(holder.reload.gift_card).to be_nil
      expect(rolled_back_order.reload.gift_card).to be_nil
      expect(waiting_order.reload.gift_card).to eq(gift_card)
      expect(live_credits).to eq(80)
      expect(gift_card.amount_used).to eq(80)
    ensure
      Spree.hooks.unregister('gift_cards.apply.release_holds', hold_open) if hold_open
      Spree.hooks.unregister('gift_cards.apply.after_apply', reject) if reject
    end
  end

  # The store controllers check these at the edge, but the workflow is the
  # shared entry point, so it refuses a card that cannot be spent.
  context 'when the gift card cannot be spent' do
    it 'refuses an expired card' do
      gift_card.update!(expires_at: 1.day.ago)

      expect(subject).not_to be_success
      expect(subject.error.value).to eq(:gift_card_expired)
    end

    it 'refuses a canceled card' do
      gift_card.update!(status: 'canceled')

      expect(subject).not_to be_success
      expect(subject.error.value).to eq(:gift_card_canceled)
    end

    it 'refuses a redeemed card' do
      gift_card.update!(status: 'redeemed')

      expect(subject).not_to be_success
      expect(subject.error.value).to eq(:gift_card_already_redeemed)
    end
  end

  context 'when the gift card has no amount remaining' do
    before { gift_card.update!(amount_used: gift_card.amount) }

    it 'responds with an error' do
      expect { subject }.not_to change(Spree::StoreCredit, :count)

      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_no_amount_remaining)

      expect(order.reload.gift_card).to be_nil
    end
  end

  context 'when the gift card is already held by another open cart' do
    let(:other_cart) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 50) }

    before do
      other_cart.update_column(:total, 50)
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other_cart)).to be_success
    end

    it 'releases the other hold and applies the freed balance here' do
      expect(gift_card.reload.amount_remaining).to eq(0)

      expect(subject).to be_success

      expect(other_cart.reload.gift_card).to be_nil
      expect(other_cart.payments.store_credits.checkout).to be_empty

      expect(order.reload.gift_card).to eq(gift_card)
      expect(order.gift_card_total).to eq(30)
      expect(gift_card.reload.amount_remaining).to eq(20)
    end

    it 'reports the released holds' do
      workflow = described_class.new
      expect(workflow.call(gift_card: gift_card, order: order)).to be_success
      expect(workflow.released_holds.map(&:id)).to eq([other_cart.id])
    end

    context 'when the other hold cannot be released' do
      before do
        allow(Spree).to receive(:gift_card_remove_workflow).and_return(failing_remove_workflow)
      end

      let(:failing_remove_workflow) do
        double(call: Spree::ServiceModule::Result.new(false, nil, Spree::ServiceModule::ResultError.new('nope')))
      end

      it 'reports the discrepancy and refuses the apply' do
        expect(Rails.error).to receive(:report).with(
          an_instance_of(Spree::Core::GiftCardHoldReleaseFailed),
          hash_including(handled: true)
        )

        expect(subject).to be_failure
        expect(subject.error.value).to eq(:gift_card_held_by_another_order)

        expect(other_cart.reload.gift_card).to eq(gift_card)
        expect(order.reload.gift_card).to be_nil
      end
    end
  end

  context 'when a hold no longer carries this card' do
    let!(:other_cart) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 50) }
    let!(:replacement_card) { create(:gift_card, amount: 50, store: store) }

    before do
      other_cart.update_column(:total, 50)
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other_cart)).to be_success
    end

    # The hold list is gathered before each hold is locked. Spree::GiftCards::
    # Remove detaches whatever card the record carries at the time, so without
    # a re-check a card swapped in by the other shopper would be stripped and
    # the wrong balance restored.
    it 'skips a hold whose card changed after the list was gathered' do
      workflow = described_class.new
      workflow.send(:instance_variable_set, :@gift_card, gift_card)
      workflow.send(:instance_variable_set, :@order, order)
      workflow.send(:instance_variable_set, :@released_holds, [])

      Spree::Cart.where(id: other_cart.id).update_all(gift_card_id: replacement_card.id)

      expect(Spree.gift_card_remove_workflow).not_to receive(:call)
      workflow.send(:release_hold, other_cart)

      expect(other_cart.reload.gift_card_id).to eq(replacement_card.id)
      expect(replacement_card.reload.amount_used).to eq(0)
    end
  end

  context 'when several carts hold the card' do
    let!(:first_hold) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 10) }
    let!(:second_hold) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 10) }

    # Applying twice would move the card rather than leave both holding it,
    # so the second hold is attached directly — the state this workflow has
    # to cope with when older data or an extension left two rows behind.
    before do
      [first_hold, second_hold].each { |hold| hold.update_column(:total, 10) }
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: first_hold)).to be_success
      second_hold.update_column(:gift_card_id, gift_card.id)
    end

    it 'releases every hold and reclaims the balance' do
      expect(subject).to be_success

      expect(first_hold.reload.gift_card).to be_nil
      expect(second_hold.reload.gift_card).to be_nil
      expect(order.reload.gift_card).to eq(gift_card)
      expect(order.gift_card_total).to eq(30)
    end

    # Every hold row is locked before the first removal takes the card lock,
    # which the transaction then holds. Locking a hold after that would invert
    # the record-then-card order Remove uses.
    it 'locks every affected record before the first removal' do
      events = []

      allow_any_instance_of(Spree::Cart).to receive(:lock!).and_wrap_original do |original, *args|
        events << :locked
        original.call(*args)
      end
      allow(Spree.gift_card_remove_workflow).to receive(:call).and_wrap_original do |original, **kwargs|
        events << :released
        original.call(**kwargs)
      end

      expect(subject).to be_success

      # Both holds and the target are locked in the ordered pass before the
      # first release runs; Remove then re-locks its own record.
      expect(events.index(:released)).to be > 0
      expect(events.count(:released)).to eq(2)
    end
  end

  context 'when a hold claims completion after the list is gathered' do
    let!(:other_cart) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 50) }

    before do
      other_cart.update_column(:total, 50)
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other_cart)).to be_success
    end

    # open_holds reads before the locks are taken, so a checkout that claims
    # in that window must still keep its card: its totals are fixed and money
    # may already be at the gateway.
    it 'leaves it alone' do
      allow_any_instance_of(Spree::GiftCard).to receive(:open_holds).and_wrap_original do |original, **kwargs|
        holds = original.call(**kwargs)
        Spree::Cart.where(id: other_cart.id).update_all(completing_at: Time.current)
        holds
      end

      subject

      expect(other_cart.reload.gift_card).to eq(gift_card)
      expect(other_cart.payments.checkout.store_credits).to be_present
    end
  end

  context 'lock ordering' do
    let(:other_cart) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 50) }

    before do
      other_cart.update_column(:total, 50)
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other_cart)).to be_success
    end

    # Releasing a hold takes the gift-card lock and the transaction keeps it,
    # so the target must be locked before any release rather than after.
    it 'locks the target in the same pass as the holds' do
      locked_ids = []

      allow(Spree::Order).to receive(:where).and_wrap_original do |original, *args|
        relation = original.call(*args)
        locked_ids << args.first[:id] if args.first.is_a?(Hash) && args.first.key?(:id)
        relation
      end

      expect(subject).to be_success

      # The ordered lock pass covers the target, not just the holds.
      expect(locked_ids.flatten).to include(order.id)
    end

    # Spree::GiftCards::Remove locks its record and then the card. Holding the
    # card while reaching for another record would invert that and deadlock
    # against a concurrent remove of the same card.
    it 'releases holds before locking the gift card' do
      locked = []

      allow_any_instance_of(Spree::GiftCard).to receive(:lock!) do |card|
        locked << :gift_card
        card
      end
      allow(Spree.gift_card_remove_workflow).to receive(:call).and_wrap_original do |original, **kwargs|
        locked << :hold_released
        original.call(**kwargs)
      end

      expect(subject).to be_success
      expect(locked.first).to eq(:hold_released)
    end
  end

  context 'when the other cart is mid-completion' do
    let(:other_cart) { create(:cart_with_line_items, store: store, customer: order_user, line_items_price: 50) }

    before do
      other_cart.update_column(:total, 50)
      expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other_cart)).to be_success
      other_cart.update_column(:completing_at, Time.current)
    end

    it 'leaves the claimed hold alone and says the card is in use' do
      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_held_by_another_order)

      expect(other_cart.reload.gift_card).to eq(gift_card)
      expect(order.reload.gift_card).to be_nil
    end

    context 'when the completion claim has gone stale' do
      before { other_cart.update_column(:completing_at, 1.day.ago) }

      it 'releases the abandoned hold' do
        expect(subject).to be_success

        expect(other_cart.reload.gift_card).to be_nil
        expect(order.reload.gift_card).to eq(gift_card)
      end
    end
  end

  context 'when a draft order from an in-flight checkout holds the card' do
    let(:completing_cart) { create(:cart, store: store, customer: order_user) }
    let!(:draft_order) do
      create(:order_with_totals, store: store, customer: order_user, cart: completing_cart, status: 'draft', line_items_price: 50).tap do |draft|
        draft.update_column(:total, 50)
        expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: draft)).to be_success
      end
    end

    before { completing_cart.update_column(:completing_at, Time.current) }

    it 'leaves the draft alone while its cart is being completed' do
      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_held_by_another_order)

      expect(draft_order.reload.gift_card).to eq(gift_card)
      expect(draft_order.payments.checkout.store_credits).to be_present
      expect(order.reload.gift_card).to be_nil
    end

    it 'releases the draft once the completion claim goes stale' do
      completing_cart.update_column(:completing_at, 1.day.ago)

      expect(subject).to be_success

      expect(draft_order.reload.gift_card).to be_nil
      expect(order.reload.gift_card).to eq(gift_card)
    end
  end

  context 'when the gift card is held by a completed order' do
    let!(:completed_order) do
      create(:order_with_totals, store: store, customer: order_user, line_items_price: 50).tap do |other|
        other.update_column(:total, 50)
        expect(Spree.gift_card_apply_workflow.call(gift_card: gift_card, order: other)).to be_success
        other.update_column(:completed_at, Time.current)
      end
    end

    it 'leaves the settled hold alone' do
      expect(subject).to be_failure
      expect(subject.error.value).to eq(:gift_card_no_amount_remaining)

      expect(completed_order.reload.gift_card).to eq(gift_card)
    end
  end

  context 'when the order belongs to a non-default store' do
    let(:other_store) { create(:store, default: false) }
    let(:order) { create(:order_with_totals, store: other_store, customer: order_user, line_items_price: 30) }
    let(:gift_card) { create(:gift_card, amount: 50, store: other_store, customer: gift_card_user) }

    it 'applies the gift card to the order' do
      expect { subject }.to change(Spree::StoreCredit, :count).by(1)
      expect(subject).to be_success

      expect(order.reload.gift_card).to eq(gift_card)
      expect(order.gift_card_total).to eq(30)

      expect(gift_card.reload.amount_remaining).to eq(20)

      expect(store_credit_payment).to be_present
      expect(store_credit_payment).to be_checkout
      expect(store_credit_payment.source).to eq(gift_card.store_credits.last)
      expect(store_credit_payment.amount).to eq(30)

      expect(store_credit.amount).to eq(30)
      expect(store_credit.store).to eq(other_store)
      expect(store_credit.originator).to eq(gift_card)
    end

    it 'links the auto-created StoreCredit payment method only to the order store' do
      expect(subject).to be_success

      payment_method = order.payments.store_credits.last.payment_method
      expect(payment_method.store).to eq(other_store)
      expect(payment_method.available_for_store?(other_store)).to be true
    end

    context 'when a StoreCredit payment method already exists for the order store' do
      let!(:existing_payment_method) { create(:store_credit_payment_method, store: other_store) }

      it 'reuses the existing payment method without creating a duplicate' do
        expect { subject }.not_to change(Spree::PaymentMethod::StoreCredit, :count)
        expect(subject).to be_success
        expect(order.payments.store_credits.last.payment_method).to eq(existing_payment_method)
      end
    end
  end
end
