require 'spec_helper'

RSpec.describe Spree::GiftCards::Remove do
  subject { described_class.call(order: order) }

  let(:order) { create(:order_with_totals, line_items_price: 30) }

  let(:gift_card) { create(:gift_card, amount: 50, store: Spree::Store.default) }

  let(:store_credit_payment) { order.payments.store_credits.last }
  let(:store_credit) { store_credit_payment.source }

  before do
    Spree::Config[:geocode_addresses] = false
    order.update_column(:total, 30)
  end

  after do
    Spree::Config[:geocode_addresses] = true
  end

  context 'for an order with the gift card applied' do
    before do
      Spree::GiftCards::Apply.call(gift_card: gift_card, order: order)
    end

    it 'removes the gift card from an order' do
      expect { subject }.to change(Spree::StoreCredit, :count).by(-1)
      expect(subject).to be_success

      expect(order.reload.gift_card).to be_nil

      expect(gift_card.reload).to be_active
      expect(gift_card.amount_remaining).to eq(50)

      expect(store_credit_payment).to be_present
      expect(store_credit_payment.status).to eq('invalid')
      expect(store_credit_payment.source).to be_deleted
    end

    it 'calls recalculate_totals!' do
      expect(order).to receive(:recalculate_totals!)
      subject
    end

    context 'for a completed order' do
      before { order.update_column(:completed_at, Time.current) }

      it 'responds with an error' do
        expect(subject).to be_failure
        expect(subject.error.value).to eq(:remove_gift_card_on_completed_order_error)
      end
    end
  end

  context 'for an order without a gift card' do
    it 'does nothing' do
      expect(subject).to be_success
    end
  end

  context 'when other requests change the order at the same time', if: %w[postgres mysql].include?(ENV['DB']) do
    include_context 'with committed records'

    let(:store) { Spree::Store.default }
    let(:gift_card) { create(:gift_card, amount: 100, store: store) }
    let(:order) { create(:order_with_totals, store: store, customer: create(:user), line_items_price: 80) }

    before do
      order.update_columns(total: 80, item_total: 80)
      expect(Spree::GiftCards::Apply.call(gift_card: gift_card, order: order)).to be_success
    end

    def remove_action(order_id)
      lambda do
        thread_order = Spree::Order.find(order_id)
        -> { described_class.call(order: thread_order) }
      end
    end

    def live_store_credits(card)
      Spree::StoreCredit.where(originator: card)
    end

    it 'hands the balance back once when two removals run at once' do
      results = run_together(Array.new(2) { remove_action(order.id) })

      expect(results).to all(be_success)
      expect(gift_card.reload.amount_used).to eq(0)
      expect(live_store_credits(gift_card)).to be_empty
      expect(order.reload.gift_card).to be_nil
      expect(order.payments.store_credits.map(&:status)).to eq(['invalid'])
    end

    it 'leaves the card on the order when the caller rolls back' do
      ActiveRecord::Base.transaction do
        expect(described_class.call(order: Spree::Order.find(order.id))).to be_success
        raise ActiveRecord::Rollback
      end

      expect(order.reload.gift_card).to eq(gift_card)
      expect(order.payments.checkout.store_credits.count).to eq(1)
      expect(gift_card.reload.amount_used).to eq(80)
      expect(live_store_credits(gift_card).sum(:amount)).to eq(80)

      expect(described_class.call(order: order)).to be_success
      expect(gift_card.reload.amount_used).to eq(0)
    end

    # On MySQL the removal's locking read of the order's payments also locks
    # the index range after them, up to the next order with payments. A
    # request that already holds the card and then writes a payment into that
    # range has to finish, not deadlock with a removal waiting for the card.
    context 'when another request holds the card and then writes a payment for a newer order' do
      let!(:newer_order) do
        create(:order_with_totals, store: store, customer: create(:user), line_items_price: 80).tap do |newer|
          newer.update_columns(total: 80, item_total: 80)
        end
      end
      let!(:payment_method) { create(:check_payment_method, store: store) }

      # The other request takes the card, waits until the removal is blocked
      # on a lock, then writes and commits.
      def remove_while_another_request_holds_the_card(&write)
        removal_session = nil
        card_taken = Concurrent::CountDownLatch.new(1)

        removal = lambda do
          removal_session = database_session_id
          thread_order = Spree::Order.find(order.id)
          lambda do
            raise 'The other request never took the card' unless card_taken.wait(5)

            described_class.call(order: thread_order)
          end
        end
        other_request = lambda do
          lambda do
            ActiveRecord::Base.transaction do
              Spree::GiftCard.lock.find(gift_card.id)
              card_taken.count_down
              wait_until_waiting_for_a_lock(removal_session)
              write.call
            end
            :committed
          end
        end

        run_together([removal, other_request])
      end

      def expect_card_removed_once(results)
        expect(results.first).to be_success
        expect(results.last).to eq(:committed)
        expect(gift_card.reload.amount_used).to eq(0)
        expect(live_store_credits(gift_card)).to be_empty
        expect(order.reload.gift_card).to be_nil
      end

      it 'finishes both when the other request adds the payment' do
        results = remove_while_another_request_holds_the_card do
          Spree::Payment.create!(order: Spree::Order.find(newer_order.id), payment_method: payment_method, amount: 10, status: 'checkout')
        end

        expect_card_removed_once(results)
        expect(newer_order.payments.count).to eq(1)
      end

      it 'finishes both when the other request moves a cart payment onto it, as checkout does' do
        cart = create(:cart_with_line_items, store: store, customer: create(:user), line_items_price: 10)
        Spree::Payment.create!(cart: cart, payment_method: payment_method, amount: 10, status: 'checkout')

        results = remove_while_another_request_holds_the_card do
          cart.payments.update_all(order_id: newer_order.id, cart_id: nil)
        end

        expect_card_removed_once(results)
        expect(newer_order.payments.count).to eq(1)
      end
    end

    # Apply removes a hold inside its own transaction, which read the hold
    # before waiting for its lock. On MySQL's repeatable read every plain read
    # in that transaction answers from the snapshot its first read took, so the
    # order still looks as it did before the request below changed it.
    context 'inside a transaction that read the order before the change' do
      def remove_in_older_snapshot(&change)
        ActiveRecord::Base.transaction do
          order_as_first_read = Spree::Order.find(order.id)
          Thread.new { ActiveRecord::Base.connection_pool.with_connection(&change) }.value
          described_class.call(order: order_as_first_read)
        end
      end

      it 'does not hand the balance back again after another removal' do
        result = remove_in_older_snapshot { described_class.call(order: Spree::Order.find(order.id)) }

        expect(result).to be_success
        expect(gift_card.reload.amount_used).to eq(0)
        expect(live_store_credits(gift_card)).to be_empty
        expect(order.reload.gift_card).to be_nil
      end

      it 'removes the card the order carries now when another card replaced it' do
        replacement = create(:gift_card, amount: 100, store: store)

        result = remove_in_older_snapshot do
          described_class.call(order: Spree::Order.find(order.id))
          Spree::GiftCards::Apply.call(gift_card: Spree::GiftCard.find(replacement.id), order: Spree::Order.find(order.id))
        end

        expect(result).to be_success
        expect(order.reload.gift_card).to be_nil
        expect(order.payments.checkout).to be_empty
        expect(replacement.reload.amount_used).to eq(0)
        expect(live_store_credits(replacement)).to be_empty
        expect(gift_card.reload.amount_used).to eq(0)
      end

      it 'voids the payment the order has now when the card was removed and applied again' do
        result = remove_in_older_snapshot do
          described_class.call(order: Spree::Order.find(order.id))
          Spree::GiftCards::Apply.call(gift_card: Spree::GiftCard.find(gift_card.id), order: Spree::Order.find(order.id))
        end

        expect(result).to be_success
        expect(order.reload.gift_card).to be_nil
        expect(order.payments.checkout).to be_empty
        expect(gift_card.reload.amount_used).to eq(0)
        expect(live_store_credits(gift_card)).to be_empty
      end
    end
  end
end
