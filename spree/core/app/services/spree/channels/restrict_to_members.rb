module Spree
  module Channels
    # Makes a channel members-only: a closed, empty default catalog shows
    # everyone the channel's audiences do not reach no products, and an open,
    # empty catalog assigned to the members keeps the whole channel range for
    # them (docs/plans/6.0-closed-catalog-assortment.md).
    #
    # Leaves alone what is already set up: a channel with a default catalog
    # keeps it, and a group that already has a catalog gets no second one.
    class RestrictToMembers
      prepend Spree::ServiceModule::Base

      # @param channel [Spree::Channel]
      # @param customer_group [Spree::CustomerGroup] the members, from the channel's store
      # @return [Spree::ServiceModule::Result] value is the channel
      def call(channel:, customer_group:)
        store = channel.store
        return failure(channel, :customer_group_from_another_store) unless customer_group.store_id == store.id

        ApplicationRecord.transaction do
          unless Spree::CatalogAssignment.where(assignable: customer_group, catalog_id: store.catalogs.select(:id)).exists?
            members_catalog = store.catalogs.create!(name: "#{channel.name} members")
            members_catalog.catalog_assignments.create!(assignable: customer_group)
            activate!(members_catalog)
          end

          if channel.default_catalog.nil?
            closed_catalog = store.catalogs.create!(name: "#{channel.name} channel", closed_assortment: true)
            channel.update!(default_catalog: closed_catalog)
            activate!(closed_catalog)
          end
        end

        success(channel)
      end

      private

      def activate!(catalog)
        result = Spree.catalog_activate_workflow.call(catalog: catalog)
        raise ActiveRecord::RecordInvalid, catalog if result.failure?
      end
    end
  end
end
