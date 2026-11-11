module Spree
  module PriceRules
    # Superseded by catalog assignment, and grandfathered: existing rules
    # keep matching indefinitely, but new setups target an audience by
    # assigning it a catalog that owns the price list
    # (docs/plans/6.0-catalog-agreement-rework.md). Hidden from the rule
    # picker; nothing new builds on it.
    class CustomerGroupRule < Spree::PriceRule
      # Stored as raw IDs. Accepts prefixed IDs (`cg_…`) from API
      # callers and decodes them on write so eligibility checks compare
      # against raw `customer_group_id` rows directly. Scope confines
      # the existence check to the price-list's store.
      preference :customer_group_ids, :array, of: :id, model: 'Spree::CustomerGroup', default: [],
                 scope: ->(rule) { rule.store.customer_groups }

      def customer_groups
        return [] if preferred_customer_group_ids.blank?

        Spree::CustomerGroup.where(id: preferred_customer_group_ids)
      end

      def applicable?(context)
        return false unless context.user
        return true if preferred_customer_group_ids.empty?

        # Compare as strings to support both integer and UUID primary keys
        (preferred_customer_group_ids.map(&:to_s) & customer_group_ids_of(context.user)).any?
      end

      def self.description
        I18n.t('spree.price_rules.customer_group_rule.description')
      end

      def self.superseded?
        true
      end

      private

      # Remembered per rule object, which lives for one request's price
      # lists: pricing a cart asks this rule once per line, and the buyer's
      # groups do not change while it does.
      def customer_group_ids_of(user)
        @customer_group_ids_of ||= {}
        @customer_group_ids_of[user.id] ||= Spree::CustomerGroupUser.where(customer_id: user.id).pluck(:customer_group_id).map(&:to_s)
      end
    end
  end
end
