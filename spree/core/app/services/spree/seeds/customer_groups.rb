module Spree
  module Seeds
    # The Wholesale group is the B2B approval primitive until 6.1 Company
    # accounts land: membership marks an approved wholesale buyer, whose
    # catalog shows them the Wholesale channel's range.
    class CustomerGroups
      prepend Spree::ServiceModule::Base
      include StoreScoped

      WHOLESALE_NAME = 'Wholesale'.freeze

      private

      # A fresh store's Wholesale channel shows its products to the group's
      # members only. An existing group is left as it is: making a live
      # channel members-only is the merchant's call, through
      # `spree:channels:restrict_wholesale_to_members`.
      def seed(store)
        group = store.customer_groups.find_or_create_by!(name: WHOLESALE_NAME)
        return unless group.previously_new_record?

        channel = store.channels.find_by(code: Spree::Seeds::Channels::WHOLESALE_CODE)
        Spree::Channels::RestrictToMembers.call(channel: channel, customer_group: group) if channel
      end
    end
  end
end
