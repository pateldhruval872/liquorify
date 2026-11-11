require 'spec_helper'

describe Spree::Channels::RestrictToMembers do
  let(:store) { @default_store }
  let(:channel) { create(:channel, store: store, code: 'trade', name: 'Trade') }
  let(:members) { create(:customer_group, store: store) }
  let!(:product) { create(:product, store: store) }

  subject(:restrict) { described_class.call(channel: channel, customer_group: members) }

  def visible_to(customer)
    Spree::Products::ForContext.call(store: store, channel: channel, customer: customer).value
  end

  before { product.product_publications.find_or_create_by!(channel: channel) }

  it 'shows members the range and everyone else nothing' do
    member = create(:customer)
    members.customer_group_users.create!(customer: member)

    expect(restrict).to be_success
    expect(channel.reload.default_catalog).to be_closed_assortment.and be_active
    expect(visible_to(member)).to contain_exactly(product)
    expect(visible_to(create(:customer))).to be_empty
  end

  it 'is idempotent' do
    restrict

    expect { described_class.call(channel: channel.reload, customer_group: members) }.not_to change(Spree::Catalog, :count)
  end

  it 'keeps a default catalog the channel already has' do
    existing = create(:catalog, store: store)
    channel.update!(default_catalog: existing)

    restrict

    expect(channel.reload.default_catalog).to eq(existing)
  end

  it 'refuses a group from another store' do
    other_group = create(:customer_group, store: create(:store))

    expect(described_class.call(channel: channel, customer_group: other_group)).to be_failure
    expect(channel.reload.default_catalog).to be_nil
  end
end
