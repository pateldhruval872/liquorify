import type {
  Catalog,
  CatalogPrice,
  CatalogProduct,
  Category,
  Collection,
  Company,
  CustomerGroup,
  CustomFieldDefinition,
  Export,
  Import,
  ImportRow,
  Price,
  PriceList,
  PriceListProduct,
  PriceRule,
  Product,
  ResourceTranslations,
  ResourceTypeDefinition,
  Variant,
} from '@spree/admin-sdk'
import { categories, category, collection, products } from './catalog'
import { channels, definition, markets } from './settings'
import { searchCustomers } from './shell'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

// ---------------------------------------------------------------------------
// The category tree (DA-PRD-07 to DA-PRD-09)
// ---------------------------------------------------------------------------

const [kitchen, mugs, apparel, aprons, guides] = categories
const hats = category('ctg_7Ht1Wr4H', 'Hats', 'apparel/hats', apparel, {
  children_count: 1,
  is_leaf: false,
  products_count: 1,
  position: 2,
})
const home = category('ctg_9Hm3Ce6K', 'Home', 'home', null, {
  children_count: 1,
  is_leaf: false,
  products_count: 1,
})

/**
 * The catalog's categories as the tree page lists them: the five the product
 * pages already use, with three more so each root has children and one branch
 * goes two levels deep. Nested-set bounds give each row its place.
 */
export const categoryTree: Category[] = [
  { ...kitchen, lft: 1, rgt: 6, children_count: 2, products_count: 3 },
  { ...mugs, lft: 2, rgt: 3, products_count: 2 },
  category('ctg_6Tw9Ar3G', 'Teaware', 'kitchen/teaware', kitchen, {
    lft: 4,
    rgt: 5,
    products_count: 1,
    position: 2,
  }),
  { ...apparel, lft: 7, rgt: 14, children_count: 2, products_count: 2 },
  { ...aprons, lft: 8, rgt: 9, products_count: 1 },
  { ...hats, lft: 10, rgt: 13 },
  category('ctg_8Wn2Tr5J', 'Winter', 'apparel/hats/winter', hats, { lft: 11, rgt: 12 }),
  { ...guides, lft: 15, rgt: 16, products_count: 1 },
  { ...home, lft: 17, rgt: 20 },
  category('ctg_1Cd4Ld7M', 'Candles', 'home/candles', home, {
    lft: 18,
    rgt: 19,
    products_count: 1,
  }),
]

/** Kitchen's products, in the manual order its products card shows. */
export const kitchenProducts: Product[] = [products[0], products[5], products[4]]

/** Products the membership picker offers, beyond a category's own. */
export const pickableProducts: Product[] = products

/** A category with its images filled in, for its page's sidebar. */
export const kitchenWithImages: Category = {
  ...categoryTree[0],
  description: 'Mugs, teaware and everything for the table, made by hand in small batches.',
  description_html:
    '<p>Mugs, teaware and everything for the table, made by hand in small batches.</p>',
  image_url: '/fixtures/product-clay.png',
  square_image_url: '/fixtures/product-sand.png',
  meta_title: 'Kitchen: handmade mugs and teaware',
  meta_description: 'Hand-thrown mugs, teaware and table linens from small studios.',
}

/** A category custom field, for the category page's custom fields card. */
export const categoryFieldDefinitions: CustomFieldDefinition[] = [
  definition('cfd_4Bn6Tx8V', 'Banner text', 'banner_text', 'category', 'short_text', {
    storefront_visible: true,
  }),
]

/**
 * A category's or collection's translation matrix, with the fields Spree
 * translates for it (`TRANSLATABLE_FIELDS`). The store's one other language
 * is German.
 */
export function groupingTranslations(
  record: Category | Collection,
  german: Record<string, string | null> = {},
): ResourceTranslations {
  const isCategory = 'pretty_name' in record
  const translated = Object.values(german).filter((value) => value != null && value !== '').length
  return {
    resource_type: isCategory ? 'category' : 'collection',
    resource_id: record.id,
    default_locale: 'en',
    supported_locales: ['en', 'de'],
    fields: [
      { key: 'name', type: 'string', source: record.name },
      ...(isCategory
        ? [
            {
              key: 'pretty_name',
              type: 'string' as const,
              source: (record as Category).pretty_name,
            },
          ]
        : []),
      { key: 'description', type: 'html', source: record.description_html },
      { key: 'permalink', type: 'string', source: record.permalink },
    ],
    translations: { de: { translated_field_count: translated, ...german } },
  }
}

export const kitchenTranslations = groupingTranslations(categoryTree[0], {
  name: 'Küche',
  pretty_name: 'Küche',
})

// ---------------------------------------------------------------------------
// Collections, curated by hand or chosen by rules (DA-PRD-10 to DA-PRD-12)
// ---------------------------------------------------------------------------

/** A collection curated by hand, in the order the merchant arranged. */
export const summerEdit: Collection = collection('coll_1Sm3Ed5R', 'Summer edit', {
  products_count: 3,
  description: 'Linen, light ceramics and candles for long evenings outside.',
  description_html: '<p>Linen, light ceramics and candles for long evenings outside.</p>',
  image_url: '/fixtures/product-olive.png',
  square_image_url: '/fixtures/product-clay.png',
  meta_title: 'The summer edit',
  meta_description: 'Linen, light ceramics and candles chosen for summer.',
  rules: [],
})

export const summerProducts = [products[1], products[0], products[5]]

/**
 * A collection whose rules choose its products: anything published in the
 * last 30 days that is not on sale, newest first.
 */
export const newArrivals: Collection = collection('coll_3Nw5Ar7Y', 'New arrivals', {
  automatic: true,
  sort_order: 'available_on desc',
  products_count: 2,
  rules_match_policy: 'all',
  rules: [
    { id: 'crule_4Nw6Ar8Y', type: 'available_on', value: '30', match_policy: 'is_equal_to' },
    { id: 'crule_5Sl7Ex9Z', type: 'sale', value: 'true', match_policy: 'is_not_equal_to' },
  ],
})

export const newArrivalProducts = [products[3], products[4]]

/**
 * The rule kinds Spree registers for collections, as its types endpoint lists
 * them, sorted by label. None takes preferences, so each schema is empty.
 */
export const collectionRuleTypes = [
  {
    type: 'sale',
    label: 'On sale',
    description: 'Products currently discounted below their compare-at price',
    schema: { type: 'object', properties: {} },
  },
  {
    type: 'available_on',
    label: 'Recently published',
    description: 'Products published within the last N days',
    schema: { type: 'object', properties: {} },
  },
  {
    type: 'tag',
    label: 'Tag',
    description: 'Products carrying a matching tag',
    schema: { type: 'object', properties: {} },
  },
]

/** A collection custom field, for the collection page's custom fields card. */
export const collectionFieldDefinitions: CustomFieldDefinition[] = [
  definition('cfd_5Ss7Nn9W', 'Season', 'season', 'collection', 'short_text', {
    storefront_visible: true,
  }),
]

export const summerTranslations = groupingTranslations(summerEdit, { name: 'Sommerauswahl' })

// ---------------------------------------------------------------------------
// Companies and customer groups, the catalogs' audiences (DA-PRD-13, DA-PRD-14)
// ---------------------------------------------------------------------------

function company(
  id: string,
  name: string,
  parent: Company | null,
  fields: Partial<Company> = {},
): Company {
  return {
    id,
    name,
    kind: parent ? 'division' : 'company',
    po_number_required: false,
    parent_id: parent?.id ?? null,
    ancestors: parent
      ? [...parent.ancestors, { id: parent.id, name: parent.name, kind: parent.kind }]
      : [],
    external_references: {},
    metadata: {},
    created_at: created,
    updated_at: updated,
    children_count: 0,
    members_count: 3,
    ...fields,
  }
}

const harbor = company('co_4Hb7Ho2S', 'Harbor Hospitality', null, {
  children_count: 2,
  members_count: 8,
})

export const companies: Company[] = [
  harbor,
  company('co_5Wc8Ts3D', 'West Coast', harbor),
  company('co_6Ec9Tt4F', 'East Coast', harbor),
  company('co_7Jn1Cf5G', 'Juniper Cafés', null, { members_count: 4, po_number_required: true }),
]

export const customerGroups: CustomerGroup[] = [
  {
    id: 'cg_3Wh5Le7S',
    name: 'Wholesale',
    description: 'Trade buyers approved for wholesale pricing.',
    customers_count: 24,
    created_at: created,
    updated_at: updated,
  },
  {
    id: 'cg_8Vp2Ip4R',
    name: 'VIP',
    description: null,
    customers_count: 6,
    created_at: created,
    updated_at: updated,
  },
]

// ---------------------------------------------------------------------------
// Exports and imports (FL-21, DA-OVL-05, DA-SET-31)
// ---------------------------------------------------------------------------

/** A product export Spree has finished writing, ready to download. */
export const productExport: Export = {
  id: 'exp_5Pr8Ex2T',
  number: 'EF482913057',
  format: 'csv',
  created_at: '2026-10-01T11:58:00.000Z',
  updated_at: '2026-10-01T11:58:04.000Z',
  type: 'products',
  user_id: 'admin_7Fk2Lp9Q',
  done: true,
  store_id: 'store_9Fh2Lq4c',
  seller_id: null,
  seller_name: null,
  filename: 'products-sample-20261001115800.csv',
  byte_size: 18_342,
  download_url: '/api/v3/admin/exports/exp_5Pr8Ex2T/download',
}

/** The file the export above writes, for the browser to save. */
export const productExportCsv = [
  'product_id,sku,name,slug,status,price,currency',
  `${products[0].id},MUG-CLAY,Clay mug,clay-mug,active,18.00,USD`,
  `${products[1].id},APRON-LINEN-S,Linen apron,linen-apron,active,32.00,USD`,
].join('\n')

/** The columns Spree's product import maps (`Spree::ImportSchemas::Products::FIELDS`). */
export const productSchemaFields: Import['schema_fields'] = [
  ['slug', 'Slug', true],
  ['sku', 'SKU', true],
  ['name', 'Name', true],
  ['price', 'Price', true],
  ['status', 'Status'],
  ['description', 'Description'],
  ['meta_title', 'Meta Title'],
  ['meta_description', 'Meta Description'],
  ['meta_keywords', 'Meta Keywords'],
  ['tags', 'Tags'],
  ['compare_at_price', 'Compare at Price'],
  ['currency', 'Currency'],
  ['width', 'Width'],
  ['height', 'Height'],
  ['depth', 'Depth'],
  ['dimensions_unit', 'Dimensions Unit'],
  ['weight', 'Weight'],
  ['weight_unit', 'Weight Unit'],
  ['available_on', 'Available On'],
  ['discontinue_on', 'Discontinue On'],
  ['track_inventory', 'Track Inventory'],
  ['inventory_count', 'Inventory Count'],
  ['inventory_backorderable', 'Inventory Backorderable'],
  ['stock_location', 'Stock Location'],
  ['tax_category', 'Tax Category'],
  ['product_type', 'Product Type'],
  ['hs_code', 'HS Code'],
  ['country_of_origin', 'Country of Origin'],
  ['customs_description', 'Customs Description'],
  ['carton', 'Carton'],
  ['units_per_carton', 'Units per Carton'],
  ['carton_weight', 'Carton Weight'],
  ['cartons_per_pallet', 'Cartons per Pallet'],
  ['image1_src', 'Image 1 URL'],
  ['image2_src', 'Image 2 URL'],
  ['image3_src', 'Image 3 URL'],
  ['option1_name', 'Option 1 Name'],
  ['option1_value', 'Option 1 Value'],
  ['option2_name', 'Option 2 Name'],
  ['option2_value', 'Option 2 Value'],
  ['option3_name', 'Option 3 Name'],
  ['option3_value', 'Option 3 Value'],
  ['category1', 'Category 1'],
  ['category2', 'Category 2'],
  ['category3', 'Category 3'],
].map(([name, label, required]) => ({
  name: name as string,
  label: label as string,
  required: Boolean(required),
}))

/** A merchant's file of new kitchen products: its header and first row. */
const csvHeaders = [
  'slug',
  'sku',
  'name',
  'price',
  'currency',
  'status',
  'description',
  'tags',
  'category1',
  'image1_src',
]
const sampleRow: Record<string, string | null> = {
  slug: 'stoneware-teapot',
  sku: 'TEAPOT-STONE',
  name: 'Stoneware teapot',
  price: '46.00',
  currency: 'USD',
  status: 'draft',
  description: 'A one-litre teapot in a speckled glaze.',
  tags: 'handmade, ceramic',
  category1: 'Kitchen -> Teaware',
  image1_src: 'https://example.com/images/stoneware-teapot.png',
}

/** Spree maps each column whose header names a field, as it does when the file is read. */
const autoMapped = productSchemaFields.map((field, index) => ({
  id: `imap_${String(index + 1).padStart(2, '0')}Mp`,
  schema_field: field.name,
  file_column: csvHeaders.includes(field.name) ? field.name : null,
  required: field.required,
}))

function productImport(id: string, number: string, fields: Partial<Import>): Import {
  return {
    id,
    number,
    rows_count: 12,
    created_at: '2026-10-01T11:40:00.000Z',
    updated_at: '2026-10-01T11:42:00.000Z',
    type: 'products',
    status: 'mapping',
    store_id: 'store_9Fh2Lq4c',
    seller_id: null,
    user_id: 'admin_7Fk2Lp9Q',
    processing_errors: null,
    delimiter: ',',
    price_list_id: null,
    seller_name: null,
    original_filename: 'kitchen-products.csv',
    original_byte_size: 4_812,
    original_file_url: `/api/v3/admin/imports/${id}/download`,
    completed_rows_count: 0,
    failed_rows_count: 0,
    schema_fields: productSchemaFields,
    csv_headers: csvHeaders,
    sample_row: sampleRow,
    mappings: autoMapped,
    ...fields,
  }
}

/** Uploaded and read; every column Spree recognised is matched. */
export const mappingImport = productImport('imp_2Mp5Ng8K', 'IM305918274', {})

/**
 * The same file with its price column headed differently, so Spree could not
 * match a required field and the wizard holds Start until it is mapped.
 */
export const unmappedImport = productImport('imp_3Um6Pd9L', 'IM305918275', {
  csv_headers: csvHeaders.map((header) => (header === 'price' ? 'unit_price' : header)),
  sample_row: { ...sampleRow, unit_price: '46.00', price: null },
  mappings: autoMapped.map((mapping) =>
    mapping.schema_field === 'price' ? { ...mapping, file_column: null } : mapping,
  ),
})

/** Started: Spree is still creating a row for each line of the file. */
export const queuedImport = productImport('imp_4Qd7Ue1M', 'IM305918276', {
  status: 'completed_mapping',
  rows_count: 0,
})

export const processingImport = productImport('imp_5Pr8Cs2N', 'IM305918277', {
  status: 'processing',
  completed_rows_count: 6,
  failed_rows_count: 1,
})

export const completedImport = productImport('imp_6Cm9Pl3P', 'IM305918278', {
  status: 'completed',
  completed_rows_count: 12,
  updated_at: '2026-10-01T11:44:00.000Z',
})

export const partlyFailedImport = productImport('imp_7Pf1Ld4Q', 'IM305918279', {
  status: 'completed',
  completed_rows_count: 10,
  failed_rows_count: 2,
  updated_at: '2026-10-01T11:44:00.000Z',
})

/** The file itself could not be read, so no rows were made. */
export const failedImport = productImport('imp_8Fl2Rd5R', 'IM305918280', {
  status: 'failed',
  rows_count: 0,
  csv_headers: [],
  sample_row: {},
  processing_errors: 'Unquoted fields do not allow new line <"\\n"> in line 4.',
})

/** One price list's prices, imported from its own page. */
export const priceListPricesImport: Import = {
  ...productImport('imp_9Pl3Pc6S', 'IM305918281', { status: 'completed' }),
  type: 'price_list_prices',
  price_list_id: 'pl_6Tr8Dw2S',
  original_filename: 'trade-prices.csv',
  rows_count: 8,
  completed_rows_count: 8,
}

function failedRow(id: string, rowNumber: number, error: string, data: Record<string, string>) {
  return {
    id,
    row_number: rowNumber,
    status: 'failed',
    validation_errors: error,
    created_at: '2026-10-01T11:42:00.000Z',
    updated_at: '2026-10-01T11:43:00.000Z',
    import_id: partlyFailedImport.id,
    item_type: null,
    item_id: null,
    data,
  } satisfies ImportRow
}

/** The two lines Spree could not import, with the messages its product import gives. */
export const failedImportRows: ImportRow[] = [
  failedRow('imrow_4Fr7Wq1A', 4, 'price must be a number like 16.50, got 18,00.', {
    slug: 'speckled-mug',
    sku: 'MUG-SPECKLED',
    name: 'Speckled mug',
    price: '18,00',
  }),
  failedRow('imrow_5Fr8Wq2B', 9, 'You have no stock location named Back room.', {
    slug: 'linen-tea-towel',
    sku: 'TOWEL-LINEN',
    name: 'Linen tea towel',
    price: '12.00',
    stock_location: 'Back room',
  }),
]

// ---------------------------------------------------------------------------
// Price lists and their rules (DA-PRD-15 to DA-PRD-17)
// ---------------------------------------------------------------------------

function priceList(id: string, name: string, fields: Partial<PriceList> = {}): PriceList {
  return {
    id,
    name,
    description: null,
    status: 'draft',
    position: 1,
    match_policy: 'all',
    adjust_compare_at: false,
    starts_at: null,
    ends_at: null,
    deleted_at: null,
    created_at: created,
    updated_at: updated,
    price_adjustment_percentage: null,
    automatic_pricing: false,
    currently_active: false,
    products_count: 0,
    prices_count: 0,
    price_adjustment_tiers: [],
    ...fields,
  }
}

function priceRule(
  id: string,
  type: string,
  preferences: Record<string, unknown>,
  embeds: Partial<PriceRule> = {},
): PriceRule {
  return {
    id,
    created_at: created,
    updated_at: updated,
    type,
    price_list_id: 'pl_6Tr8Dw2S',
    preferences,
    ...embeds,
  }
}

const [wholesaleGroup] = customerGroups

/**
 * The trade list's rules: six or more of an item, on the wholesale channel,
 * for the wholesale customer group. The group rule is a kind Spree no longer
 * offers for new rules, as on Spree's sample price list; it still applies.
 */
export const tradeRules: PriceRule[] = [
  priceRule('prule_2Vl4Mn6Q', 'volume_rule', { min_quantity: 6, max_quantity: null }),
  priceRule(
    'prule_3Ch5Nl7R',
    'channel_rule',
    { channel_ids: [channels[1].id] },
    { channels: [channels[1]] },
  ),
  priceRule(
    'prule_4Cg6Rp8S',
    'customer_group_rule',
    { customer_group_ids: [wholesaleGroup.id] },
    { customer_groups: [wholesaleGroup] },
  ),
]

export const tradeList = priceList('pl_6Tr8Dw2S', 'Trade prices', {
  description: 'Trade prices for cafés and restaurants on orders of six or more.',
  status: 'active',
  currently_active: true,
  products_count: 3,
  prices_count: 7,
  price_rules: tradeRules,
})

/** Starts on the first of December in the store's time zone and ends after New Year. */
export const scheduledList = priceList('pl_7Hl9Dy3T', 'Holiday prices', {
  status: 'scheduled',
  starts_at: '2026-12-01T05:00:00.000Z',
  ends_at: '2027-01-03T04:59:00.000Z',
  products_count: 2,
  prices_count: 2,
  price_rules: [],
})

/** Scheduled, and its start has passed, so it is live now. */
export const liveScheduledList = priceList('pl_7Hl9Dy3T', 'Holiday prices', {
  status: 'scheduled',
  starts_at: '2026-09-01T04:00:00.000Z',
  currently_active: true,
})

export const draftList = priceList('pl_8Sp1Rg4V', 'Spring launch', { price_rules: [] })

export const inactiveList = priceList('pl_9Cl2Rn5W', 'Clearance', {
  status: 'inactive',
  products_count: 4,
  prices_count: 4,
  price_rules: [],
})

export const priceLists = [tradeList, scheduledList, draftList, inactiveList]

/** A market rule and a customer rule, for their editors. */
export const marketRule = priceRule(
  'prule_5Mk7Tr9T',
  'market_rule',
  { market_ids: [markets[0].id] },
  { markets: [markets[0]] },
)

export const customerRule = priceRule(
  'prule_6Cu8St1U',
  'user_rule',
  { user_ids: [searchCustomers[0].id] },
  { customers: [searchCustomers[0]] },
)

/** The price rule kinds Spree registers, exactly as its types endpoint lists them. */
export const priceRuleTypes: ResourceTypeDefinition[] = [
  {
    type: 'channel_rule',
    label: 'Channel Rule',
    description: 'Apply pricing based on the sales channel',
    schema: {
      type: 'object',
      properties: {
        channel_ids: {
          type: 'array',
          items: {
            type: 'string',
            format: 'prefixed-id',
            pattern: '^ch_[A-Za-z0-9]+$',
            'x-spree-prefix': 'ch',
          },
          default: [],
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'customer_group_rule',
    label: 'Customer Group Rule',
    description: 'Apply pricing to specific customer groups',
    schema: {
      type: 'object',
      properties: {
        customer_group_ids: {
          type: 'array',
          items: {
            type: 'string',
            format: 'prefixed-id',
            pattern: '^cg_[A-Za-z0-9]+$',
            'x-spree-prefix': 'cg',
          },
          default: [],
        },
      },
      additionalProperties: false,
    },
    superseded: true,
  },
  {
    type: 'user_rule',
    label: 'Customer rule',
    description: 'Apply pricing to specific customers',
    schema: {
      type: 'object',
      properties: {
        user_ids: {
          type: 'array',
          items: {
            type: 'string',
            format: 'prefixed-id',
            pattern: '^cust_[A-Za-z0-9]+$',
            'x-spree-prefix': 'cust',
          },
          default: [],
        },
      },
      additionalProperties: false,
    },
    superseded: true,
  },
  {
    type: 'market_rule',
    label: 'Market Rule',
    description: 'Apply pricing based on the market',
    schema: {
      type: 'object',
      properties: {
        market_ids: {
          type: 'array',
          items: {
            type: 'string',
            format: 'prefixed-id',
            pattern: '^mkt_[A-Za-z0-9]+$',
            'x-spree-prefix': 'mkt',
          },
          default: [],
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'volume_rule',
    label: 'Volume Rule',
    description: 'Apply pricing based on quantity purchased',
    schema: {
      type: 'object',
      properties: {
        min_quantity: { type: 'integer', default: 1 },
        max_quantity: { type: ['integer', 'null'] },
      },
      additionalProperties: false,
    },
  },
] as ResourceTypeDefinition[]

const [mug, apron, , , , candle] = products

/**
 * The trade list's products as its products card reads them: each variant
 * with what the list charges and its quantity breaks. The mug has a ladder;
 * one apron colour has no list price, so it falls through to the shop price.
 */
export const tradeProducts: PriceListProduct[] = [
  {
    id: mug.id,
    name: mug.name,
    thumbnail_url: mug.thumbnail_url,
    price_list_variants: [
      {
        id: 'variant_3Mq7Lk2c',
        label: null,
        sku: 'MUG-CLAY',
        currency: 'USD',
        source: 'explicit',
        break_count: 2,
        amount: '15.00',
        tiers: [
          { min_quantity: 24, amount: '14.00' },
          { min_quantity: 48, amount: '13.00' },
        ],
      },
    ],
  },
  {
    id: apron.id,
    name: apron.name,
    thumbnail_url: apron.thumbnail_url,
    price_list_variants: [
      ['variant_7Rt2Wn5a', 'Color: Olive, Size: M', 'APRON-OLV-M', 'explicit', '34.00'],
      ['variant_7Rt2Wn5b', 'Color: Olive, Size: L', 'APRON-OLV-L', 'explicit', '34.00'],
      ['variant_7Rt2Wn5c', 'Color: Slate, Size: M', 'APRON-SLT-M', 'explicit', '34.00'],
      ['variant_7Rt2Wn5d', 'Color: Slate, Size: L', 'APRON-SLT-L', 'base', '44.00'],
    ].map(([id, label, sku, source, amount]) => ({
      id,
      label,
      sku,
      currency: 'USD',
      source: source as 'explicit' | 'base',
      break_count: 0,
      amount,
      tiers: [],
    })),
  },
  {
    id: candle.id,
    name: candle.name,
    thumbnail_url: candle.thumbnail_url,
    price_list_variants: [
      {
        id: 'variant_4Gb1Ns3m',
        label: null,
        sku: 'CANDLE-OLV',
        currency: 'USD',
        source: 'explicit',
        break_count: 0,
        amount: '11.00',
        tiers: [],
      },
    ],
  },
]

interface ListedVariant {
  id: string
  productId: string
  productName: string
  sku: string
  /** Spree sends an empty string for a variant without options, never null. */
  optionsText: string
}

/**
 * The variant a price row embeds when the editor asks for `expand=variant`:
 * Spree's whole admin variant, of which the editor reads the product's id and
 * name, the SKU and the options.
 */
function listedVariant(spec: ListedVariant, shopPrice: Price): Variant {
  return {
    id: spec.id,
    product_id: spec.productId,
    sku: spec.sku,
    options_text: spec.optionsText,
    track_inventory: true,
    media_count: 0,
    preorder_ships_at: null,
    thumbnail_url: null,
    purchasable: true,
    in_stock: true,
    backorderable: false,
    preorder: false,
    weight: null,
    height: null,
    width: null,
    depth: null,
    weight_unit: 'kg',
    dimensions_unit: 'cm',
    minimum_order_quantity: null,
    order_multiple: null,
    purchase_unit: null,
    units_per_carton: null,
    price: shopPrice,
    original_price: null,
    seller_id: null,
    option_values: [],
    external_references: {},
    metadata: {},
    position: 1,
    cost_currency: null,
    barcode: null,
    backorder_limit: null,
    hs_code: null,
    country_of_origin: null,
    customs_description: null,
    carton_weight: null,
    cartons_per_pallet: null,
    deleted_at: null,
    created_at: created,
    updated_at: updated,
    cost_price: null,
    preorderable: false,
    tax_category_id: null,
    carton_package_type_id: null,
    units_per_pallet: null,
    available_stock: 10,
    reserved_quantity: 0,
    total_on_hand: 10,
    product_name: spec.productName,
    delivery_profile_id: null,
  }
}

function priceRow(
  id: string,
  variant: ListedVariant,
  amount: string | null,
  fields: Partial<Price> = {},
): Price {
  const row: Price = {
    id,
    currency: 'USD',
    amount,
    compare_at_amount: null,
    price_list_id: tradeList.id,
    min_quantity: 1,
    variant_id: variant.id,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
  const shopPrice = { ...row, id: `${id}s`, price_list_id: null, amount: amount ?? '0.00' }
  return { ...row, variant: listedVariant(variant, shopPrice) }
}

function price(
  id: string,
  variant: { id: string; product: Product; sku: string; options_text: string },
  amount: string | null,
  fields: Partial<Price> = {},
): Price {
  return priceRow(
    id,
    {
      id: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      sku: variant.sku,
      optionsText: variant.options_text,
    },
    amount,
    fields,
  )
}

const mugVariant = { id: 'variant_3Mq7Lk2c', product: mug, sku: 'MUG-CLAY', options_text: '' }
const apronVariant = (suffix: string, options: string, sku: string) => ({
  id: `variant_7Rt2Wn5${suffix}`,
  product: apron,
  sku,
  options_text: options,
})

/**
 * The trade list's prices as the bulk price editor reads them, one row per
 * variant at a quantity of one, sorted by product name. The apron in slate,
 * size L, has no list price yet, and only the mug has a price in euros.
 */
export const tradePrices: Price[] = [
  price('price_6Mg2Cl3e', mugVariant, '15.00'),
  price('price_5Ap1Om2a', apronVariant('a', 'Color: Olive, Size: M', 'APRON-OLV-M'), '34.00', {
    compare_at_amount: '44.00',
  }),
  price('price_5Ap1Om2b', apronVariant('b', 'Color: Olive, Size: L', 'APRON-OLV-L'), '34.00', {
    compare_at_amount: '44.00',
  }),
  price('price_5Ap1Om2c', apronVariant('c', 'Color: Slate, Size: M', 'APRON-SLT-M'), '34.00'),
  price('price_5Ap1Om2d', apronVariant('d', 'Color: Slate, Size: L', 'APRON-SLT-L'), null),
  price(
    'price_7Cn3Dl4f',
    { id: 'variant_4Gb1Ns3m', product: candle, sku: 'CANDLE-OLV', options_text: '' },
    '11.00',
  ),
  price('price_6Mg2Eu5k', mugVariant, '14.00', { currency: 'EUR' }),
]

/** The mug's quantity breaks on the trade list: 14.00 from 24, 13.00 from 48. */
export const tradeBreaks: Price[] = [
  price('price_8Mg4Br5g', mugVariant, '14.00', { min_quantity: 24 }),
  price('price_8Mg4Br5h', mugVariant, '13.00', { min_quantity: 48 }),
]

const materials = ['Clay', 'Linen', 'Olive', 'Slate', 'Walnut']
const goods = ['basket', 'bowl', 'candle', 'cap', 'mug', 'plate', 'throw', 'towel', 'tray', 'vase']

/**
 * A list as long as Spree's sample wholesale list, fifty products and more,
 * one price each, so the editor pages through them fifty at a time.
 */
export const longPriceList: Price[] = materials
  .flatMap((material) => goods.map((good) => `${material} ${good}`))
  .concat(['Walnut board', 'Walnut spoon', 'Walnut stool', 'Walnut tray set', 'Walnut whisk'])
  .sort()
  .map((name, index) => {
    const number = String(index + 1).padStart(2, '0')
    return priceRow(
      `price_4Lg${number}Pr`,
      {
        id: `variant_4Lg${number}Vr`,
        productId: `prod_4Lg${number}Pd`,
        productName: name,
        sku: name.toUpperCase().replace(/ /g, '-'),
        optionsText: '',
      },
      `${10 + index}.00`,
    )
  })

// ---------------------------------------------------------------------------
// Catalogs (DA-PRD-13, DA-PRD-14)
// ---------------------------------------------------------------------------

const juniper = companies[3]

function catalog(id: string, name: string, fields: Partial<Catalog> = {}): Catalog {
  return {
    id,
    name,
    description: null,
    active: false,
    position: 1,
    metadata: {},
    minimum_order_quantity: null,
    order_multiple: null,
    created_at: created,
    updated_at: updated,
    products_count: 0,
    pricing_strategy: 'base',
    closed_assortment: false,
    order_minimums: [],
    assignments: [],
    ...fields,
  }
}

function assignment(
  catalogId: string,
  id: string,
  type: 'company' | 'customer_group',
  record: { id: string; name: string },
) {
  return {
    id,
    created_at: created,
    catalog_id: catalogId,
    assignable_type: type,
    assignable_id: record.id,
    assignable_name: record.name,
  }
}

/**
 * The café catalog: Juniper Cafés and the wholesale group see the shop's
 * prices less 15 percent from twelve units, 20 percent from 24 and 25 percent
 * from 48, in cases of six, with an order of at least 150 dollars.
 */
export const cafeCatalog = catalog('cat_3Cf6Tr9A', 'Café trade', {
  description: 'Agreed terms for café accounts.',
  active: true,
  minimum_order_quantity: 6,
  order_multiple: 6,
  products_count: 3,
  pricing_strategy: 'automatic',
  order_minimums: [
    {
      id: 'com_4Us7Mn1B',
      currency: 'USD',
      amount: '150.00',
      created_at: created,
      updated_at: updated,
    },
  ],
  assignments: [
    assignment('cat_3Cf6Tr9A', 'cas_5Jn8Cf2C', 'company', juniper),
    assignment('cat_3Cf6Tr9A', 'cas_6Wh9Gr3D', 'customer_group', customerGroups[0]),
  ],
  price_list: priceList('pl_4Cf7Pl1E', 'Café trade', {
    status: 'active',
    currently_active: true,
    price_adjustment_percentage: '-15.0',
    automatic_pricing: true,
    products_count: 3,
    price_adjustment_tiers: [
      { id: 'pat_1Tr4Qt7F', min_quantity: 24, percentage: '-20.0' },
      { id: 'pat_2Tr5Qt8G', min_quantity: 48, percentage: '-25.0' },
    ],
    price_rules: [
      priceRule(
        'prule_7Cf1Vl4H',
        'volume_rule',
        { min_quantity: 12, max_quantity: null },
        { price_list_id: 'pl_4Cf7Pl1E' },
      ),
    ],
  }),
})

/** Harbor Hospitality's contract: prices entered by hand, the mug with its own breaks. */
export const harborCatalog = catalog('cat_4Hb7Ct1J', 'Harbor contract', {
  active: true,
  products_count: 3,
  pricing_strategy: 'fixed',
  assignments: [assignment('cat_4Hb7Ct1J', 'cas_7Hb1Co4K', 'company', harbor)],
  price_list: priceList('pl_5Hb8Ct2L', 'Harbor contract', {
    status: 'active',
    currently_active: true,
    products_count: 3,
    prices_count: 6,
  }),
})

/** A catalog just begun: no audience, no products, the shop's own prices. */
export const springCatalog = catalog('cat_5Sp9Ln3M', 'Spring samplers')

function catalogPrice(
  id: string,
  sku: string,
  amount: string,
  source: CatalogPrice['source'],
  fields: Partial<CatalogPrice> = {},
): CatalogPrice {
  return {
    id,
    label: null,
    sku,
    currency: 'USD',
    source,
    break_count: 0,
    amount,
    tiers: [],
    ...fields,
  }
}

const apronVariants = (amounts: [string, CatalogPrice['source']][]) =>
  [
    'Color: Olive, Size: M',
    'Color: Olive, Size: L',
    'Color: Slate, Size: M',
    'Color: Slate, Size: L',
  ].map((label, index) =>
    catalogPrice(
      `variant_7Rt2Wn5${'abcd'[index]}`,
      `APRON-${label.includes('Olive') ? 'OLV' : 'SLT'}-${label.endsWith('M') ? 'M' : 'L'}`,
      amounts[index][0],
      amounts[index][1],
      { label },
    ),
  )

/** The café catalog's products: each variant at the shop price less 15 percent, the mug in cases of twelve. */
export const cafeProducts: CatalogProduct[] = [
  {
    id: mug.id,
    name: mug.name,
    thumbnail_url: mug.thumbnail_url,
    quantity_rule: {
      id: 'cpt_1Mg4Cs7N',
      product_id: mug.id,
      product_name: mug.name,
      minimum_order_quantity: 12,
      order_multiple: 12,
      mixed: false,
    },
    catalog_variants: [catalogPrice('variant_3Mq7Lk2c', 'MUG-CLAY', '15.30', 'automatic')],
  },
  {
    id: apron.id,
    name: apron.name,
    thumbnail_url: apron.thumbnail_url,
    quantity_rule: null,
    catalog_variants: apronVariants([
      ['35.70', 'automatic'],
      ['35.70', 'automatic'],
      ['35.70', 'automatic'],
      ['37.40', 'automatic'],
    ]),
  },
  {
    id: candle.id,
    name: candle.name,
    thumbnail_url: candle.thumbnail_url,
    quantity_rule: null,
    catalog_variants: [catalogPrice('variant_4Gb1Ns3m', 'CANDLE-OLV', '11.90', 'automatic')],
  },
]

/** Harbor's products: prices entered for the mug, with breaks, and most aprons; one apron at the shop price. */
export const harborProducts: CatalogProduct[] = [
  {
    ...cafeProducts[0],
    quantity_rule: null,
    catalog_variants: [
      catalogPrice('variant_3Mq7Lk2c', 'MUG-CLAY', '14.00', 'explicit', {
        break_count: 2,
        tiers: [
          { min_quantity: 24, amount: '13.00' },
          { min_quantity: 48, amount: '12.00' },
        ],
      }),
    ],
  },
  {
    ...cafeProducts[1],
    catalog_variants: apronVariants([
      ['32.00', 'explicit'],
      ['32.00', 'explicit'],
      ['32.00', 'explicit'],
      ['44.00', 'base'],
    ]),
  },
  {
    ...cafeProducts[2],
    catalog_variants: [catalogPrice('variant_4Gb1Ns3m', 'CANDLE-OLV', '10.00', 'explicit')],
  },
]
