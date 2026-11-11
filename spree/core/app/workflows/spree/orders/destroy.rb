module Spree
  module Orders
    # Deletes an order that has not been placed (a draft). Applying a gift
    # card draws the card down while the order is open, and the order is what
    # remembers the draw — so deleting it without first taking the card back
    # off would leave the balance spent with nothing left to release it.
    # The release and the deletion commit together: a refused deletion keeps
    # the card on the order, and a refused release keeps the order.
    class Destroy < Spree::Workflow
      hooks :validate, :after_destroy

      # @param order [Spree::Order]
      # @return [Spree::ServiceModule::Result] value is the destroyed order
      def perform(order:)
        super

        step :ensure_can_be_deleted
        run_hooks :validate

        ApplicationRecord.transaction do
          step :release_gift_card
          step :destroy_order
          run_hooks :after_destroy
        end

        success(order)
      end

      private

      def ensure_can_be_deleted
        return if order.can_be_deleted?

        failure(order, :order_cannot_be_deleted)
      end

      def release_gift_card
        return if order.gift_card.nil?

        result = Spree.gift_card_remove_workflow.call(order: order)
        failure(order, result.error.value) if result.failure?

        order.reload
      end

      def destroy_order
        failure(order) unless order.destroy
      end
    end
  end
end
