module Spree
  module Products
    # The operator accepting a submitted product, putting it on sale.
    #
    # Separate from Activate, which is the operator publishing their own
    # catalog and answers to nobody: this one closes a review a seller opened,
    # so it refuses anything that is not awaiting one.
    class Approve < Spree::Workflow
      hooks :validate, :after_approve

      # @param product [Spree::Product]
      # @param reviewer [Spree.admin_user_class, nil] who decided
      # @param note [String, nil] shown to the seller
      # @param auto [Boolean] the store approves listings without review
      # @return [Spree::ServiceModule::Result] value is the product
      def perform(product:, reviewer: nil, note: nil, auto: false)
        super

        reject!(:not_awaiting_review, message: I18n.t('activerecord.errors.models.spree/product.attributes.base.not_awaiting_review')) unless product.proposed?

        run_hooks :validate

        ApplicationRecord.transaction do
          step :mark_active
          step :publish_on_default_channel
          step :close_submission
          run_hooks :after_approve
        end

        product.publish_event('product.approved')
        success(product)
      end

      private

      def mark_active
        failure(product) unless product.update(status: 'active')
      end

      # A seller cannot choose channels, so a product it submits arrives on
      # none, and "active" alone leaves it on sale nowhere. The store's default
      # channel is where approval puts it, as an import does. Channels the
      # operator already chose for it are left as they are.
      def publish_on_default_channel
        channel = product.store&.default_channel
        return if channel.nil? || product.product_publications.exists?

        channel.add_products(product.id)
      end

      # An auto-approval says so on the row: a blank reviewer must read as
      # "this store does not review listings", never as a lost name.
      def close_submission
        Spree::ProductSubmissions::Close.call(
          product: product,
          status: 'approved',
          reviewed_by: reviewer,
          review_note: note,
          metadata: auto ? { 'auto_approved' => true } : {}
        )
      end
    end
  end
end
