# Demo prices for a store whose default currency products.csv does not price
# in. The file prices the catalog in US dollars and euros only, and a product
# with no price in the shopper's currency is not listed, so a store in złoty,
# say, would open on an empty storefront. Each sample variant with no price in
# the store's default currency gets the same number as its dollar price in the
# file: a demo amount, not a conversion. A price the file already gives, or
# one the merchant has set, is left as it is, so a re-run adds nothing.
store = Spree::Current.store
currency = store.default_currency

dollar_rows = CSV.read(
  Spree::Core::Engine.root.join('db', 'sample_data', 'products.csv'),
  headers: true,
  encoding: 'utf-8'
).select { |row| row['currency'] == 'USD' && row['price'].present? && BigDecimal(row['price']).positive? }.index_by { |row| row['sku'] }

unpriced_variants = store.variants.where(sku: dollar_rows.keys).
                    where.not(id: Spree::Price.base_prices.where(currency: currency).select(:variant_id)).
                    to_a

unpriced_variants.each do |variant|
  row = dollar_rows[variant.sku]
  variant.set_price(currency, row['price'], row['compare_at_price'])
end

puts "  Gave #{unpriced_variants.size} #{'variant'.pluralize(unpriced_variants.size)} a demo price in #{currency}" if unpriced_variants.any?
