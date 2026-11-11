require 'spec_helper'

describe Spree::Products::ForContext do
  let(:store) { @default_store }
  let(:channel) { store.default_channel }
  let!(:listed) { create(:product, store: store) }
  let!(:also_listed) { create(:product, store: store) }
  let(:customer) { create(:customer) }

  def resolve(**arguments)
    described_class.call(store: store, channel: channel, **arguments).value
  end

  it 'returns every channel listing for an anonymous buyer' do
    expect(resolve).to contain_exactly(listed, also_listed)
  end

  context 'with a company catalog' do
    let(:company) { create(:company, store: store) }
    let(:catalog) { create(:catalog, store: store) }

    before do
      create(:catalog_assignment, catalog: catalog, assignable: company)
      catalog.add_products([listed.id])
    end

    it 'narrows an explicit node to its effective catalogs' do
      expect(resolve(company: company)).to contain_exactly(listed)
    end

    it 'resolves the node from a sole membership' do
      create(:company_membership, company: company, customer: customer)

      expect(resolve(customer: customer)).to contain_exactly(listed)
    end

    it 'covers the subtree of the assignment node' do
      division = create(:company, store: store, kind: 'division', parent: company)

      expect(resolve(company: division)).to contain_exactly(listed)
    end

    it 'takes the union across effective catalogs' do
      extra = create(:catalog, store: store)
      create(:catalog_assignment, catalog: extra, assignable: company)
      extra.add_products([also_listed.id])

      expect(resolve(company: company)).to contain_exactly(listed, also_listed)
    end

    it 'refuses to narrow for a buyer with several memberships and no explicit node' do
      create(:company_membership, company: company, customer: customer)
      create(:company_membership, company: create(:company, store: store), customer: customer)

      expect(resolve(customer: customer)).to contain_exactly(listed, also_listed)
    end

    # An empty assortment means the whole channel range — a pricing-only
    # overlay. Without this, "everyone sees the public store, this company
    # just gets special prices" would be impossible to express, since giving
    # the company any catalog would hide everything uncataloged.
    it 'lifts the restriction when any effective catalog is uncurated' do
      overlay = create(:catalog, store: store)
      create(:catalog_assignment, catalog: overlay, assignable: company)

      expect(resolve(company: company)).to contain_exactly(listed, also_listed)
    end

    it 'lets a division own overlay open up a parent-restricted range' do
      division = create(:company, store: store, kind: 'division', parent: company)
      overlay = create(:catalog, store: store)
      create(:catalog_assignment, catalog: overlay, assignable: division)

      expect(resolve(company: division)).to contain_exactly(listed, also_listed)
      # The parent itself stays restricted to its curated catalog.
      expect(resolve(company: company)).to contain_exactly(listed)
    end
  end

  context 'with a customer group catalog' do
    it 'narrows to the group catalog when no company applies' do
      group = create(:customer_group, store: store)
      group.customer_group_users.create!(customer: customer)
      catalog = create(:catalog, store: store)
      create(:catalog_assignment, catalog: catalog, assignable: group)
      catalog.add_products([also_listed.id])

      expect(resolve(customer: customer)).to contain_exactly(also_listed)
    end
  end

  context 'with a channel default catalog' do
    it 'narrows anonymous browsing to it' do
      catalog = create(:catalog, store: store)
      catalog.add_products([listed.id])
      channel.update!(default_catalog: catalog)

      expect(resolve).to contain_exactly(listed)
    end

    it 'keeps an open, empty default catalog as a pricing-only overlay' do
      channel.update!(default_catalog: create(:catalog, store: store))

      expect(resolve(customer: customer)).to contain_exactly(listed, also_listed)
    end
  end

  # A members-only channel: a closed, empty default catalog for everyone the
  # channel's audiences do not reach, and a catalog for the members.
  context 'with a closed catalog' do
    let(:members) { create(:customer_group, store: store) }

    before do
      channel.update!(default_catalog: create(:catalog, store: store, closed_assortment: true))
    end

    it 'shows a signed-in customer outside every audience nothing' do
      expect(resolve(customer: customer)).to be_empty
    end

    it 'narrows to the products a closed catalog lists' do
      channel.default_catalog.add_products([listed.id])

      expect(resolve(customer: customer)).to contain_exactly(listed)
    end

    it 'gives a member the whole range through an open, empty group catalog' do
      members.customer_group_users.create!(customer: customer)
      create(:catalog_assignment, catalog: create(:catalog, store: store), assignable: members)

      expect(resolve(customer: customer)).to contain_exactly(listed, also_listed)
    end

    it 'lets an open, empty catalog beside a closed one lift the restriction' do
      members.customer_group_users.create!(customer: customer)
      create(:catalog_assignment, catalog: create(:catalog, store: store, closed_assortment: true), assignable: members)
      create(:catalog_assignment, catalog: create(:catalog, store: store), assignable: members)

      expect(resolve(customer: customer)).to contain_exactly(listed, also_listed)
    end

    # The audiences do not combine: a company's curated catalog answers on its
    # own, so the group's open catalog cannot widen the member's assortment.
    it "keeps a company member who is also in the group to the company's catalog" do
      members.customer_group_users.create!(customer: customer)
      create(:catalog_assignment, catalog: create(:catalog, store: store), assignable: members)

      company = create(:company, store: store)
      create(:company_membership, company: company, customer: customer)
      company_catalog = create(:catalog, store: store)
      create(:catalog_assignment, catalog: company_catalog, assignable: company)
      company_catalog.add_products([listed.id])

      expect(resolve(customer: customer)).to contain_exactly(listed)
    end
  end
end
