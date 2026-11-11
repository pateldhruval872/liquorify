module Spree
  module Products
    # Resolves which products a buyer may see: the channel's publications,
    # narrowed by the catalogs that apply to them.
    #
    # Precedence, per docs/plans/6.0-b2b-companies-and-catalogs.md:
    # 1. A buyer resolving to a company node with effective catalogs sees the
    #    union of those catalogs' assortments.
    # 2. Otherwise, a customer whose groups carry catalogs sees their union.
    # 3. Otherwise, every channel listing — narrowed to the channel's default
    #    catalog when one is set.
    #
    # Gated storefront access (login_required) runs before this resolver — a
    # gated guest never reaches it.
    class ForContext
      prepend Spree::ServiceModule::Base

      # @param store [Spree::Store]
      # @param channel [Spree::Channel]
      # @param customer [Object, nil]
      # @param company [Spree::Company, nil] the purchase node; defaults to
      #   the customer's sole standing within the store
      # @param base [ActiveRecord::Relation, nil] the already-scoped listing
      #   to narrow; defaults to the channel's publications
      # @return [Spree::ServiceModule::Result] value is a Product relation
      def call(store:, channel:, customer: nil, company: nil, base: nil)
        base ||= store.products.for_channel(channel)

        # One resolution for every surface: visibility, pricing and quantity
        # terms have to answer from the same catalogs, and it reuses the
        # request-scoped set so a listing that prices its variants right after
        # does not resolve the same buyer twice.
        catalogs = Spree::Catalog.for_buyer(
          store: store, customer: customer, company: company, channel: channel
        )

        return success(base) if catalogs.empty?

        # An open catalog with an empty assortment means the whole channel
        # range: it is a pricing-only overlay (its price list applies, nothing
        # is hidden), so one in the effective set lifts the restriction
        # entirely — the union includes "all". A closed catalog lists exactly
        # what it shows, so an empty one adds nothing
        # (docs/plans/6.0-closed-catalog-assortment.md).
        catalog_ids = catalogs.map(&:id)
        curated_ids = Spree::CatalogProduct.where(catalog_id: catalog_ids).distinct.pluck(:catalog_id)
        return success(base) if catalogs.any? { |catalog| !catalog.closed_assortment? && curated_ids.exclude?(catalog.id) }

        success(base.where(
          id: Spree::CatalogProduct.where(catalog_id: catalog_ids).select(:product_id)
        ))
      end

    end
  end
end
