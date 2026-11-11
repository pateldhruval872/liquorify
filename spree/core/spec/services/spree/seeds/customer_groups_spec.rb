require 'spec_helper'

RSpec.describe Spree::Seeds::CustomerGroups do
  subject { described_class.call }

  before do
    Spree::Seeds::Stores.call
    Spree::Seeds::Channels.call
  end

  let(:store) { Spree::Store.default }
  let(:wholesale) { store.channels.find_by(code: 'wholesale') }
  let(:group) { store.customer_groups.find_by(name: 'Wholesale') }

  it "makes a fresh store's Wholesale channel members-only" do
    subject

    expect(wholesale.default_catalog).to be_closed_assortment.and be_active
    members_catalog = Spree::CatalogAssignment.find_by(assignable: group).catalog
    expect(members_catalog).not_to be_closed_assortment
    expect(members_catalog).to be_active
  end

  it 'is idempotent' do
    described_class.call

    expect { subject }.not_to change(Spree::Catalog, :count)
  end

  it 'leaves the channel of a store whose group already exists unchanged' do
    store.customer_groups.create!(name: 'Wholesale')

    subject

    expect(wholesale.reload.default_catalog).to be_nil
  end
end
