module Spree
  module GiftCards
    # Takes a gift card back off an order, returning the drawn-down balance to
    # the card. The reverse of Spree::GiftCards::Apply, and only possible
    # while the order is still open.
    class Remove < Spree::Workflow
      hooks :validate, :after_remove

      # @param order [Spree::Order]
      # @return [Spree::ServiceModule::Result] value is true
      def perform(order:)
        super

        step :ensure_removable
        halt!(true) if order.gift_card.nil?
        run_hooks :validate

        order.with_lock do
          # Re-checked inside the lock: the nil check above runs before it, so
          # a concurrent remove can detach the card in between and leave every
          # step below dereferencing nil. The lock has just re-read the order;
          # a plain reload inside a caller's transaction could return an older
          # snapshot of it on MySQL.
          @gift_card = order.gift_card
          next if @gift_card.nil?

          step :lock_gift_card
          step :void_payments
          step :restore_gift_card_balance
          step :discard_store_credits
          step :detach_gift_card
          step :recalculate_order
          run_hooks :after_remove
        end

        success(true)
      end

      private

      def ensure_removable
        failure(order, :remove_gift_card_on_completed_order_error) if order.completed?
      end

      def gift_card
        @gift_card ||= order.gift_card
      end

      # Locked before the payments, as cart recalculation does. On MySQL the
      # payments' locking read also locks the index range after them, and a
      # transaction already holding the card that then added a payment in that
      # range would deadlock with this one. With the card taken first, nobody
      # else can hold it while this transaction holds the range.
      def lock_gift_card
        gift_card.lock!
      end

      # Read with locks, because a locking read sees the latest committed rows.
      # A plain read inside a caller's transaction (Apply releasing another
      # order's hold) returns, on MySQL's repeatable read, the snapshot taken
      # before that transaction waited for this order's lock, in which payments
      # another release has already voided still look open, and their balance
      # would be restored twice. No subqueries: MySQL reads those from the
      # snapshot even inside a locking read. The payments are read once, by
      # this record, and matched to the card's store credits here: a second
      # locking read by source would also lock MySQL's source index gap, which
      # holds up every new payment until this transaction ends.
      def checkout_payments
        @checkout_payments ||= order.payments.checkout.store_credits.lock.to_a
      end

      def store_credits
        @store_credits ||= gift_card.store_credits.where(id: checkout_payments.map(&:source_id)).lock.to_a
      end

      # Each payment is handed the store credit read above, because loading its
      # source would be a plain read, which on MySQL cannot see a store credit
      # created after the transaction's snapshot.
      def payments
        @payments ||= checkout_payments.filter_map do |payment|
          store_credit = store_credits.find { |credit| credit.id == payment.source_id }
          next if store_credit.nil?

          payment.source = store_credit
          payment
        end
      end

      def void_payments
        @payment_total = payments.sum(&:amount)
        payments.each(&:invalidate!)
      end

      def restore_gift_card_balance
        gift_card.amount_used -= @payment_total
        gift_card.save!
      end

      # The store credits belong to the gift card rather than the order, so
      # nothing else would clean them up.
      # TODO: void these rather than destroying them.
      def discard_store_credits
        store_credits.each(&:destroy!)
      end

      def detach_gift_card
        order.update!(gift_card: nil)
      end

      def recalculate_order
        order.recalculate_totals!
      end
    end
  end
end
