require 'spec_helper'

RSpec.shared_context 'sample data loaded into a fresh database' do
  # Seeds an empty database the way an install does, around a store that is
  # not the default one, and returns that store with an admin of its own.
  def seed_store(**store_attributes)
    # The seed only mints an admin with explicit credentials (no dummy
    # defaults since 6.0), and the sample-data imports need one as owner.
    # ENV is process-global, so the originals are restored rather than
    # deleted — another suite may have set them.
    original_email = ENV['ADMIN_EMAIL']
    original_password = ENV['ADMIN_PASSWORD']
    ENV['ADMIN_EMAIL'] = 'sample-admin@example.com'
    ENV['ADMIN_PASSWORD'] = 'Secret123!'

    # Loaded into a store that is not the default one, so the default store
    # has to stay empty. It exists before the seeds so they provision it too.
    Spree::Seeds::Stores.call
    store = create(:store, default: false, **store_attributes)
    Spree::Seeds::All.call
    store.add_user(Spree.admin_user_class.first)
    store
  ensure
    original_email.nil? ? ENV.delete('ADMIN_EMAIL') : ENV['ADMIN_EMAIL'] = original_email
    original_password.nil? ? ENV.delete('ADMIN_PASSWORD') : ENV['ADMIN_PASSWORD'] = original_password
  end

  # A store set up as first-run setup sets one up for a shop in that country,
  # selling only the country's own currency.
  def seed_store_selling_only(country_code)
    country = Spree::Country.by_iso(country_code)
    store = seed_store(default_currency: country.default_currency, supported_currencies: country.default_currency)
    Spree::Stores::ProvisionDefaults.call(store: store, country: country)
    Spree::Store.find(store.id)
  end

  # Returns the error the load raised, so each example reports what it checks
  # rather than every example failing on the same error.
  def load_sample_data(store)
    described_class.call(store: store)
    nil
  rescue StandardError => error
    error
  end

  # The sample file's prices, by SKU and currency, as `[price, compare_at_price]`.
  def sample_file_prices
    path = Spree::Core::Engine.root.join('db', 'sample_data', 'products.csv')
    CSV.read(path, headers: true, encoding: 'utf-8').each_with_object({}) do |row, prices|
      next if row['price'].blank? || BigDecimal(row['price']).zero?

      prices[[row['sku'], row['currency']]] = [BigDecimal(row['price']), row['compare_at_price']]
    end
  end

  after(:all) do
    DatabaseCleaner.clean_with(:truncation)
  end
end

RSpec.describe Spree::SampleData::Loader, type: :service, without_global_store: true do
  include_context 'sample data loaded into a fresh database'

  before(:all) do
    DatabaseCleaner.clean_with(:truncation)
    @store = seed_store

    described_class.call(store: @store)
  end

  it 'creates products' do
    expect(Spree::Product.count).to be > 30
  end

  it 'loads everything into the given store and leaves the default store empty' do
    default_store = Spree::Store.default

    aggregate_failures do
      expect(default_store).not_to eq(@store)
      expect(Spree::Product.where.not(store: @store)).to be_empty
      expect(Spree::Order.where.not(store: @store)).to be_empty
      expect(Spree::OptionType.where.not(store: @store)).to be_empty
      expect(Spree::Promotion.where.not(store: @store)).to be_empty
      expect(Spree::Import.where.not(store: @store)).to be_empty

      expect(default_store.collections).to be_empty
      expect(default_store.price_lists).to be_empty
      expect(default_store.companies).to be_empty
      expect(default_store.catalogs).to be_empty
      expect(default_store.payment_methods.where(name: 'Credit Card')).to be_empty
      expect(default_store.channels.where(code: 'pos')).to be_empty

      expect(@store.collections).to be_present
      expect(@store.payment_methods.where(name: 'Credit Card')).to exist
      expect(@store.orders.complete.count).to be >= 2
    end
  end

  it 'assigns imported products a product type' do
    expect(Spree::Product.where(product_type_id: nil)).to be_empty
  end

  describe 'product types' do
    # The seeds add Default and Digital; the sample data adds one type per family.
    let(:sample_product_types) do
      Spree::ProductType.where.not(name: [
        I18n.t('spree.seed.product_types.default'), I18n.t('spree.seed.product_types.digital')
      ])
    end

    it 'creates one type per product family rather than a single catch-all' do
      expect(sample_product_types.pluck(:name)).to match_array(
        ['Kitchen Appliance', 'Air Treatment', 'Garment Care', 'Vacuum Cleaner', 'Hair Styling', 'Grooming']
      )
    end

    it 'gives every type a custom field schema' do
      sample_product_types.find_each do |product_type|
        expect(product_type.custom_field_definitions).to be_present
        expect(product_type.product_type_custom_field_definitions.required).to be_present
      end
    end

    it 'varies the schema between types' do
      kitchen = Spree::ProductType.find_by(name: 'Kitchen Appliance')
      grooming = Spree::ProductType.find_by(name: 'Grooming')

      expect(kitchen.custom_field_definitions.map(&:key)).to include('capacity')
      expect(grooming.product_type_custom_field_definitions.required.
        map { |join| join.custom_field_definition.key }).to include('runtime')
    end

    it 'seeds the color option type and a category onto every type' do
      sample_product_types.find_each do |product_type|
        expect(product_type.option_types.map(&:name)).to eq(['color'])
        expect(product_type.categories).to be_present
      end
    end

    # A required field with no value in the CSV would block the merchant from
    # re-activating that product in the dashboard.
    it 'backs every required field with a value on every product of the type' do
      incomplete = Spree::Product.includes(:product_type, custom_fields: :custom_field_definition).select do |product|
        next false if product.product_type.nil?

        required_ids = product.product_type.product_type_custom_field_definitions.required.
                       map(&:custom_field_definition_id)
        filled_ids = product.custom_fields.select { |custom_field| custom_field.value.present? }.
                     map(&:custom_field_definition_id)
        (required_ids - filled_ids).any?
      end

      expect(incomplete.map(&:name)).to be_empty
    end

    it 'fills the required fields on the imported products' do
      product = Spree::Product.joins(:product_type).find_by(spree_product_types: { name: 'Kitchen Appliance' })

      expect(product.custom_fields.map { |custom_field| custom_field.custom_field_definition.key }).
        to include('wattage', 'voltage', 'warranty')
    end
  end

  it 'creates variants' do
    expect(Spree::Variant.count).to be > 80
  end

  it 'creates a fully digital product with a downloadable file' do
    product = Spree::Product.find_by(slug: 'the-spree-commerce-handbook')

    expect(product).to be_present
    expect(product.delivery_profile).to be_digital
    expect(product.default_variant.digital_assets.first&.attachment).to be_attached
  end

  it 'creates customers' do
    expect(Spree.customer_class.where.not(email: 'spree@example.com').count).to be > 5
  end

  it 'creates completed orders' do
    expect(Spree::Order.complete.count).to be >= 2
  end

  it 'derives payment and fulfillment statuses for the sample orders' do
    statuses = Spree::Order.complete.pluck(:payment_status, :fulfillment_status).flatten
    expect(statuses).to all(be_present)
  end

  describe 'wholesale demo data' do
    let(:store) { @store }
    let(:wholesale) { store.channels.find_by(code: 'wholesale') }

    it 'gates the wholesale channel' do
      expect(wholesale.resolved_storefront_access).to eq('login_required')
      expect(wholesale.resolved_guest_checkout).to be false
    end

    it 'publishes the catalog to the wholesale channel' do
      expect(wholesale.products.count).to be > 30
    end

    it 'creates an approved wholesale buyer' do
      buyer = Spree.customer_class.find_by(email: 'wholesale@example.com')
      group = store.customer_groups.find_by(name: 'Wholesale')

      expect(buyer).to be_present
      expect(group.customers).to include(buyer)
    end

    it 'creates an active wholesale price list keyed to the group with a case-pack minimum' do
      price_list = store.price_lists.find_by(name: 'Wholesale')

      expect(price_list.status).to eq('active')
      expect(price_list.price_rules.map(&:class)).to include(
        Spree::PriceRules::CustomerGroupRule,
        Spree::PriceRules::VolumeRule
      )
      expect(price_list.match_policy).to eq('all')
      expect(price_list.prices.count).to be > 50

      volume_rule = price_list.price_rules.find { |rule| rule.is_a?(Spree::PriceRules::VolumeRule) }
      expect(volume_rule.preferred_min_quantity).to eq(10)
    end

    it 'seeds wholesale prices for every supported currency' do
      price_list = store.price_lists.find_by(name: 'Wholesale')
      supported = store.supported_currencies_list.map(&:iso_code)
      eligible_variant_ids = Spree::Variant.eligible.where(product_id: store.product_ids).pluck(:id)

      supported.each do |currency|
        expect(price_list.prices.where(currency: currency, min_quantity: 1).pluck(:variant_id)).to match_array(eligible_variant_ids)
      end

      wholesale_price = price_list.prices.where(min_quantity: 1).where.not(amount: nil).first
      expect(wholesale_price).to be_present

      base_price = Spree::Price.find_by(price_list_id: nil, variant_id: wholesale_price.variant_id,
                                        currency: wholesale_price.currency)
      expect(wholesale_price.amount).to eq((base_price.amount * 0.6).round(2))
    end

    it 'loads the example price-list CSV as quantity breaks on the wholesale list' do
      price_list = store.price_lists.find_by(name: 'Wholesale')
      toaster = Spree::Variant.find_by(sku: '2-SLICE-TOASTER-WHITE')

      ladder = price_list.prices.where(variant: toaster, currency: 'USD').order(:min_quantity).pluck(:min_quantity, :amount)
      expect(ladder).to eq([[1, 23.99], [24, 21.99], [96, 19.99]])
      expect(Spree::Imports::PriceListPrices.sample_csv_url).to end_with('/price_list_prices.csv')
    end

    it 'mints a wholesale-bound publishable key' do
      expect(store.api_keys.active.publishable.where(channel: wholesale)).to exist
    end
  end
end

# SD-8: the sample files price their products in dollars and euros only, and
# their quantity breaks in dollars only.
RSpec.describe Spree::SampleData::Loader, 'in a store that sells only Polish złoty', type: :service, without_global_store: true do
  include_context 'sample data loaded into a fresh database'

  before(:all) do
    DatabaseCleaner.clean_with(:truncation)
    @store = seed_store_selling_only('PL')
    @load_error = load_sample_data(@store)
  end

  let(:store) { @store }
  let(:price_list) { store.price_lists.find_by(name: 'Wholesale') }

  it 'loads without raising' do
    expect(@load_error).to be_nil
  end

  it 'gives every priced sample variant a demo price in złoty, the same number as its dollar price' do
    dollar_prices = sample_file_prices.select { |(_, currency), _| currency == 'USD' }
    variants = store.variants.where(sku: dollar_prices.keys.map(&:first)).index_by(&:sku)

    aggregate_failures do
      expect(variants.size).to eq(dollar_prices.size)
      dollar_prices.each do |(sku, _), (amount, _)|
        expect(variants[sku].amount_in('PLN')).to eq(amount), sku
      end
    end
  end

  it 'activates the wholesale price list with trade prices in złoty' do
    eligible_variant_ids = Spree::Variant.eligible.where(product_id: store.product_ids).pluck(:id)
    trade_prices = price_list.prices.where(currency: 'PLN', min_quantity: 1)
    espresso = store.variants.find_by(sku: 'AUTOMATIC-ESPRESSO-MACHINE-MATTE-BLACK')

    expect(price_list.status).to eq('active')
    expect(trade_prices.pluck(:variant_id)).to match_array(eligible_variant_ids)
    expect(trade_prices.find_by(variant: espresso).amount).to eq((espresso.amount_in('PLN') * 0.6).round(2))
  end

  it 'adds no quantity break in a currency the store does not sell' do
    expect(price_list.prices.where.not(currency: 'PLN')).to be_empty
  end

  it 'creates both sample orders in złoty with their items priced' do
    orders = store.orders.complete.where(number: %w[R1001 R1002]).includes(line_items: :variant)

    aggregate_failures do
      expect(orders.map(&:number)).to match_array(%w[R1001 R1002])
      orders.each do |order|
        expect(order.currency).to eq('PLN')
        expect(order.line_items).to be_present
        order.line_items.each do |line_item|
          expect(line_item.price).to be_positive
          expect(line_item.price).to eq(line_item.variant.amount_in('PLN'))
        end
      end
    end
  end
end

# A store in euros is priced by the sample file itself, and its demo prices
# must leave those euro prices exactly as the file gives them (SD-8).
RSpec.describe Spree::SampleData::Loader, 'in a store that sells only euros', type: :service, without_global_store: true do
  include_context 'sample data loaded into a fresh database'

  before(:all) do
    DatabaseCleaner.clean_with(:truncation)
    @store = seed_store_selling_only('DE')
    @load_error = load_sample_data(@store)
  end

  let(:store) { @store }

  it 'loads without raising' do
    expect(@load_error).to be_nil
  end

  it 'keeps every euro price the sample file gives, and adds no demo price beside it' do
    file_prices = sample_file_prices
    euro_prices = file_prices.select { |(_, currency), _| currency == 'EUR' }
    variants = store.variants.where(sku: euro_prices.keys.map(&:first)).includes(:prices).index_by(&:sku)

    aggregate_failures do
      expect(variants.size).to eq(euro_prices.size)
      euro_prices.each do |(sku, _), (amount, compare_at_price)|
        base_prices = variants[sku].prices.select { |price| price.price_list_id.nil? }
        euro_price = base_prices.find { |price| price.currency == 'EUR' }
        file_currencies = file_prices.keys.select { |key| key.first == sku }.map(&:last)

        expect(base_prices.map(&:currency)).to match_array(file_currencies), sku
        expect(euro_price.amount).to eq(amount), sku
        expect(euro_price.compare_at_amount).to eq(compare_at_price.presence && BigDecimal(compare_at_price)), sku
      end
    end
  end

  it 'gives a demo price only to the variant the file prices in dollars alone' do
    handbook = store.variants.find_by(sku: 'SPREE-HANDBOOK')

    expect(handbook.amount_in('EUR')).to eq(handbook.amount_in('USD'))
  end
end
