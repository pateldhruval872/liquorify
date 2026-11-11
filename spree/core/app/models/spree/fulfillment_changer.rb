module Spree
  class FulfillmentChanger
    include ActiveModel::Validations

    validates :quantity, numericality: { greater_than: 0 }
    validates :desired_stock_location, presence: true
    validate  :current_shipment_not_already_shipped
    validate  :desired_shipment_different_from_current
    validate  :enough_stock_at_desired_location, if: :handle_stock_counts?

    def initialize(params = {})
      @current_stock_location = params[:current_stock_location]
      @desired_stock_location = params[:desired_stock_location]
      @current_shipment       = params[:current_shipment]
      @desired_shipment       = params[:desired_shipment]
      @variant                = params[:variant]
      @quantity               = params[:quantity]
      @available_quantity     = [
        desired_stock_location&.stock_level(variant)&.available_count.to_i,
        current_quantity
      ].max
    end

    def run!
      return false if invalid?

      desired_shipment.save! if desired_shipment.new_record?

      handle_stock
      reload_shipment_inventory_units
      after_process_shipments

      true
    end

    private

    attr_reader :variant, :quantity, :current_stock_location, :desired_stock_location,
                :current_shipment, :desired_shipment, :available_quantity

    def handle_stock
      ActiveRecord::Base.transaction do
        carry_allocation
        move_inventory_units_between_shipments
      end
    end

    # Re-pointing a promise between fulfillments moves no goods, so this runs
    # whether or not the origin changes. Only a promise that exists can move:
    # a fulfillment on an order that was never placed, or one created before
    # typed movements, carries nothing.
    def carry_allocation
      carried = [current_shipment.allocated_quantities[variant.id].to_i, quantity].min
      return unless carried.positive?

      current_stock_location.release(variant, carried, current_shipment)
      desired_stock_location.allocate(variant, carried, desired_shipment)
    end

    def move_inventory_units_between_shipments
      update_desired_shipment_inventory_units
      update_current_shipment_inventory_units
    end

    def current_shipment_units
      @current_shipment_units ||= current_shipment.fulfillment_items.on_hand_or_backordered.where(variant_id: variant.id)
    end

    def update_desired_shipment_inventory_units
      on_hand_unit = get_desired_shipment_inventory_unit(:on_hand)
      on_hand_unit.update(quantity: on_hand_unit.quantity + new_on_hand_quantity)

      new_backorder_quantity = current_on_hand_quantity - new_on_hand_quantity
      if new_backorder_quantity > 0
        backordered_unit = get_desired_shipment_inventory_unit(:backordered)
        backordered_unit.update(quantity: backordered_unit.quantity + new_backorder_quantity)
      end
    end

    def update_current_shipment_inventory_units
      reduced_quantity = current_on_hand_quantity

      # Reduce quantities from all backordered units first in case there is more than one.
      backorder_units = current_shipment_units.backordered
      reduced_quantity = reduce_units_quantities(reduced_quantity, backorder_units) if backorder_units.any?

      # Reduce quantities from all on_hand units in case there is more than one.
      if reduced_quantity > 0
        on_hand_units = current_shipment_units.on_hand
        reduce_units_quantities(reduced_quantity, on_hand_units) if on_hand_units.any?
      end
    end

    def reduce_units_quantities(reduced_quantity, units)
      units.each do |unit|
        if unit.quantity > reduced_quantity
          unit.update(quantity: unit.quantity - reduced_quantity)
          reduced_quantity = 0
        else
          reduced_quantity -= unit.quantity
          unit.destroy!
        end
        break if reduced_quantity.zero?
      end
      reduced_quantity
    end

    def get_desired_shipment_inventory_unit(state)
      current_shipment_unit = current_shipment_units.first
      desired_shipment.fulfillment_items.find_or_create_by(status: state, variant: variant, replacement: current_shipment_unit&.replacement || false) do |unit|
        unit.variant_id = current_shipment_unit.variant_id
        unit.order_id = current_shipment_unit.order_id
        unit.line_item_id = current_shipment_unit.line_item_id
        unit.quantity = 0
      end
    end

    def after_process_shipments
      emptied = current_shipment.fulfillment_items.sum(:quantity).zero?
      carried_cost = emptied ? current_shipment.cost : 0
      carry_delivery_discounts_and_tax if emptied && desired_shipment.order.completed?

      if emptied
        current_shipment.destroy!
      else
        current_shipment.refresh_rates
      end

      desired_shipment.refresh_rates
      keep_delivery_charge(carried_cost)

      desired_shipment.order.reload
      desired_shipment.order.recalculate_totals!
    end

    # A placed order's delivery charge is what the shopper agreed to at
    # checkout, so splitting a parcel only moves it: the new parcel takes the
    # charge of a parcel it empties and otherwise adds nothing. Pricing it
    # afresh would leave a paid order owing more and refuse to ship it.
    def keep_delivery_charge(carried_cost)
      unless desired_shipment.order.completed?
        desired_shipment.update_amounts
        return
      end

      desired_shipment.update_columns(cost: desired_shipment.cost + carried_cost, updated_at: Time.current)
    end

    # The discount and tax a placed order's emptied parcel carried go with its
    # charge: a placed order is not repriced, so leaving them behind would
    # bill a free delivery the shopper was given, or drop the tax they paid.
    def carry_delivery_discounts_and_tax
      [current_shipment.discounts, current_shipment.tax_lines].each do |association|
        association.update_all(fulfillment_id: desired_shipment.id, updated_at: Time.current)
        association.reset
      end
    end

    def new_on_hand_quantity
      [available_quantity, current_on_hand_quantity].min
    end

    def current_on_hand_quantity
      [current_shipment.fulfillment_items.on_hand_or_backordered.sum(:quantity), quantity].min
    end

    def reload_shipment_inventory_units
      [current_shipment, desired_shipment].each { |shipment| shipment.fulfillment_items.reload }
    end

    def current_quantity
      desired_stock_location == current_stock_location ? quantity : 0
    end

    def handle_stock_counts?
      current_shipment.order.completed? && current_stock_location != desired_stock_location
    end

    def current_shipment_not_already_shipped
      return unless current_shipment.fulfilled?

      errors.add(:current_shipment, :has_already_been_shipped)
    end

    def enough_stock_at_desired_location
      return if Spree::Stock::Quantifier.new(variant, desired_stock_location).can_supply?(quantity)

      errors.add(:desired_shipment, :has_not_enough_stock_at_desired_location)
    end

    def desired_shipment_different_from_current
      return unless desired_shipment.id == current_shipment.id

      errors.add(:desired_shipment, :can_not_transfer_within_same_shipment)
    end
  end
end
