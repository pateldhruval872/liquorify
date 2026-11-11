require 'spec_helper'

RSpec.describe Spree::Orders::Destroy do
  subject(:result) { described_class.call(order: order) }

  let(:store) { Spree::Store.default }
  let(:order) { create(:order_with_totals, store: store, line_items_price: 30) }
  let(:gift_card) { create(:gift_card, amount: 50, store: store) }

  before { order.update_column(:total, 30) }

  context 'for a draft without a gift card' do
    it 'deletes the draft' do
      expect(result).to be_success
      expect(Spree::Order.find_by(id: order.id)).to be_nil
    end
  end

  context 'when something rolls the deletion back without a reason' do
    before { allow(order).to receive(:destroy).and_return(false) }

    it 'refuses with a reason the caller can show' do
      expect(result).to be_failure
      expect(order.errors.full_messages).to include(I18n.t('spree.order_cannot_be_deleted'))
    end
  end

  context 'for a draft with a gift card applied' do
    before do
      expect(Spree::GiftCards::Apply.call(gift_card: gift_card, order: order)).to be_success
      expect(gift_card.reload.amount_remaining).to eq(20)
    end

    it 'gives the drawn-down amount back to the card and leaves no store credit behind' do
      expect { result }.to change { gift_card.store_credits.count }.from(1).to(0)

      expect(result).to be_success
      expect(Spree::Order.find_by(id: order.id)).to be_nil
      expect(gift_card.reload.amount_used).to eq(0)
      expect(gift_card.amount_remaining).to eq(50)
      expect(gift_card).to be_active
    end

    it 'lets the card pay for another draft afterwards' do
      result
      other_order = create(:order_with_totals, store: store, line_items_price: 40)
      other_order.update_column(:total, 40)

      expect(Spree::GiftCards::Apply.call(gift_card: gift_card.reload, order: other_order)).to be_success
      expect(gift_card.reload.amount_remaining).to eq(10)
    end

    context 'when the deletion is refused after the card was released' do
      before do
        allow(order).to receive(:destroy).and_return(false)
      end

      it 'keeps the card on the draft with its balance still drawn down' do
        expect(result).to be_failure
        expect(Spree::Order.find_by(id: order.id)).to be_present
        expect(order.reload.gift_card).to eq(gift_card)
        expect(gift_card.reload.amount_remaining).to eq(20)
        expect(gift_card.store_credits.count).to eq(1)
        expect(order.payments.checkout.store_credits.count).to eq(1)
      end
    end
  end

  context 'for an order that has been placed' do
    let(:order) { create(:completed_order_with_totals, store: store) }

    it 'refuses the deletion and keeps the order' do
      expect(result).to be_failure
      expect(result.error.value).to eq(:order_cannot_be_deleted)
      expect(Spree::Order.find_by(id: order.id)).to be_present
    end
  end
end
