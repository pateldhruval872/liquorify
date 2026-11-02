import type {
  Category,
  Collection,
  DeliveryProfile,
  DigitalAsset,
  Media,
  OptionType,
  OptionValue,
  PackageType,
  Price,
  Product,
  ProductPublication,
  ProductType,
  ResourceTranslations,
  StockLevel,
  StockMovement,
  TaxCategory,
  Variant,
} from '@spree/admin-sdk'
import { channels, customFieldDefinitions, media, stockLocations } from './settings'

const created = '2026-01-15T09:00:00.000Z'
const updated = '2026-09-20T09:00:00.000Z'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

function optionValue(
  id: string,
  type: { id: string; name: string; label: string },
  name: string,
  label: string,
  position: number,
  fields: Partial<OptionValue> = {},
): OptionValue {
  return {
    id,
    option_type_id: type.id,
    name,
    label,
    position,
    color_code: null,
    option_type_name: type.name,
    option_type_label: type.label,
    image_url: null,
    metadata: {},
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

function optionType(
  id: string,
  name: string,
  label: string,
  kind: OptionType['kind'],
  position: number,
  values: (type: { id: string; name: string; label: string }) => OptionValue[],
  fields: Partial<OptionType> = {},
): OptionType {
  return {
    id,
    name,
    label,
    position,
    kind,
    metadata: {},
    filterable: true,
    created_at: created,
    updated_at: updated,
    option_values: values({ id, name, label }),
    ...fields,
  }
}

export const colorOption = optionType('ot_4Lm8Nq2R', 'color', 'Color', 'color_swatch', 1, (t) => [
  optionValue('ov_1Cl4Ay7K', t, 'clay', 'Clay', 1, { color_code: '#B07056' }),
  optionValue('ov_2Ol5Vx8J', t, 'olive', 'Olive', 2, { color_code: '#708238' }),
  optionValue('ov_3Sl6Tw9H', t, 'slate', 'Slate', 3, { color_code: '#5D6D7E' }),
])

export const sizeOption = optionType('ot_6Pz3Ks5T', 'size', 'Size', 'buttons', 2, (t) => [
  optionValue('ov_4Sm7Qr1G', t, 's', 'S', 1),
  optionValue('ov_5Md8Pe2F', t, 'm', 'M', 2),
  optionValue('ov_6Lg9Od3D', t, 'l', 'L', 3),
])

export const materialOption = optionType(
  'ot_8Wd2Jh6Y',
  'material',
  'Material',
  'dropdown',
  3,
  (t) => [
    optionValue('ov_7Ln1Mc4S', t, 'linen', 'Linen', 1),
    optionValue('ov_8Ct2Lb5A', t, 'cotton', 'Cotton', 2),
  ],
  { filterable: false },
)

export const optionTypes: OptionType[] = [colorOption, sizeOption, materialOption]

const [, olive, slate] = colorOption.option_values as OptionValue[]
const [, medium, large] = sizeOption.option_values as OptionValue[]

// ---------------------------------------------------------------------------
// Organisation: categories, collections, product types, tax, delivery
// ---------------------------------------------------------------------------

function category(
  id: string,
  name: string,
  permalink: string,
  parent: Category | null,
  fields: Partial<Category> = {},
): Category {
  return {
    id,
    name,
    permalink,
    position: 1,
    depth: parent ? parent.depth + 1 : 0,
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    children_count: 0,
    parent_id: parent?.id ?? null,
    description: '',
    description_html: '',
    image_url: null,
    square_image_url: null,
    is_root: !parent,
    is_child: Boolean(parent),
    is_leaf: true,
    external_references: {},
    metadata: {},
    pretty_name: parent ? `${parent.pretty_name} -> ${name}` : name,
    lft: 1,
    rgt: 2,
    products_count: 0,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

const kitchen = category('ctg_1Kt4Hn7B', 'Kitchen', 'kitchen', null, {
  children_count: 1,
  is_leaf: false,
})
const apparel = category('ctg_3Ap6Rl9C', 'Apparel', 'apparel', null, {
  children_count: 1,
  is_leaf: false,
})

export const categories: Category[] = [
  kitchen,
  category('ctg_2Mg5Su8D', 'Mugs', 'kitchen/mugs', kitchen, { products_count: 1 }),
  apparel,
  category('ctg_4Ar7Pn1E', 'Aprons', 'apparel/aprons', apparel, { products_count: 1 }),
  category('ctg_5Gd8Ui2F', 'Guides', 'guides', null, { products_count: 1 }),
]

const [, mugs, , aprons, guides] = categories

function collection(id: string, name: string, fields: Partial<Collection> = {}): Collection {
  return {
    id,
    name,
    permalink: name.toLowerCase().replaceAll(' ', '-'),
    position: 1,
    sort_order: 'manual',
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    products_count: 2,
    description: '',
    description_html: '',
    image_url: null,
    square_image_url: null,
    automatic: false,
    rules_match_policy: 'all',
    metadata: {},
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

export const collections: Collection[] = [
  collection('coll_1Sm3Ed5R', 'Summer edit'),
  collection('coll_2Gf4Id6T', 'Gift ideas'),
  collection('coll_3Nw5Ar7Y', 'New arrivals', { automatic: true, sort_order: 'created_at_desc' }),
]

function taxCategory(id: string, name: string, fields: Partial<TaxCategory> = {}): TaxCategory {
  return {
    id,
    name,
    tax_code: null,
    description: null,
    is_default: false,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

export const taxCategories: TaxCategory[] = [
  taxCategory('taxcat_2Jd7Ns4k', 'Default', { is_default: true }),
  taxCategory('taxcat_5Cl8Ot1h', 'Clothing', { tax_code: 'PC040100' }),
  taxCategory('taxcat_7Dg3Bk9m', 'Digital goods', { tax_code: 'D0000000' }),
]

const [defaultTax, clothingTax, digitalTax] = taxCategories

function deliveryProfile(
  id: string,
  name: string,
  fields: Partial<DeliveryProfile> = {},
): DeliveryProfile {
  return {
    id,
    name,
    default: false,
    position: 1,
    created_at: created,
    updated_at: updated,
    kind: 'shipping',
    digital: false,
    offers_pickup: false,
    offers_shipping: true,
    stock_location_ids: [stockLocations[0].id],
    origin_groups: [],
    products_count: 4,
    delivery_methods_count: 2,
    delivery_zones_count: 1,
    ...fields,
  }
}

export const deliveryProfiles: DeliveryProfile[] = [
  deliveryProfile('fp_6Hq2Wm8c', 'General', { default: true }),
  deliveryProfile('fp_8Dg4Xn1v', 'Digital delivery', {
    kind: 'digital',
    digital: true,
    offers_shipping: false,
    stock_location_ids: [],
    products_count: 1,
    delivery_methods_count: 1,
    delivery_zones_count: 0,
  }),
]

const [generalProfile, digitalProfile] = deliveryProfiles

function productType(id: string, name: string, fields: Partial<ProductType> = {}): ProductType {
  return {
    id,
    name,
    products_count: 1,
    created_at: created,
    updated_at: updated,
    delivery_profile_id: null,
    option_type_ids: [],
    category_ids: [],
    custom_field_definitions: [],
    ...fields,
  }
}

const careInstructions = customFieldDefinitions[0]

export const productTypes: ProductType[] = [
  productType('ptype_3Mg6Ks9q', 'Mug', {
    category_ids: [mugs.id],
    custom_field_definitions: [
      {
        id: careInstructions.id,
        key: careInstructions.key,
        namespace: careInstructions.namespace,
        label: careInstructions.label,
        field_type: careInstructions.field_type,
        required: false,
        sort_order: 1,
      },
    ],
  }),
  productType('ptype_5Ap8Rn2w', 'Apron', {
    option_type_ids: [colorOption.id, sizeOption.id],
    category_ids: [aprons.id],
  }),
  productType('ptype_7Gd1Ek4z', 'Guide', {
    delivery_profile_id: digitalProfile.id,
    category_ids: [guides.id],
  }),
]

const [mugType, apronType, guideType] = productTypes

// ---------------------------------------------------------------------------
// Products and their variants
// ---------------------------------------------------------------------------

function price(
  id: string,
  variantId: string,
  currency: 'USD' | 'EUR',
  amount: string,
  fields: Partial<Price> = {},
): Price {
  return {
    id,
    currency,
    amount,
    compare_at_amount: null,
    price_list_id: null,
    min_quantity: 1,
    variant_id: variantId,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

function stockLevel(
  id: string,
  variant: { id: string; product_id: string; sku: string | null; options_text: string },
  productName: string,
  locationIndex: number,
  count: number,
  fields: Partial<StockLevel> = {},
): StockLevel {
  const location = stockLocations[locationIndex]
  return {
    id,
    count_on_hand: count,
    backorderable: false,
    stock_location_id: location.id,
    variant_id: variant.id,
    external_references: {},
    metadata: {},
    reserved_count: 0,
    incoming_count: 0,
    purchasable_count: count,
    variant_name: productName,
    variant_sku: variant.sku,
    created_at: created,
    updated_at: updated,
    stock_location_name: location.name,
    product_id: variant.product_id,
    options_text: variant.options_text || null,
    thumbnail_url: null,
    allocated_count: 0,
    available_count: count,
    // The product page expands each level's location, so its name shows.
    stock_location: location,
    ...fields,
  }
}

interface VariantSpec {
  id: string
  sku: string
  values?: OptionValue[]
  usd: string
  eur?: string
  compareAt?: string
  stock: number[]
  backorderable?: boolean
  position?: number
  fields?: Partial<Variant>
}

function variant(productId: string, productName: string, spec: VariantSpec): Variant {
  const values = spec.values ?? []
  const options_text = values
    .map((value) => `${value.option_type_label}: ${value.label}`)
    .join(', ')
  const suffix = spec.id.slice(8)
  const usd = price(`price_${suffix}u`, spec.id, 'USD', spec.usd, {
    compare_at_amount: spec.compareAt ?? null,
  })
  const prices = [usd]
  if (spec.eur) prices.push(price(`price_${suffix}e`, spec.id, 'EUR', spec.eur))
  const base = { id: spec.id, product_id: productId, sku: spec.sku, options_text }
  const stock_levels = spec.stock.map((count, index) =>
    stockLevel(`sl_${suffix}${index}`, base, productName, index, count, {
      backorderable: Boolean(spec.backorderable),
    }),
  )
  const total = spec.stock.reduce((sum, count) => sum + count, 0)
  return {
    id: spec.id,
    product_id: productId,
    sku: spec.sku,
    options_text,
    track_inventory: true,
    media_count: 0,
    preorder_ships_at: null,
    thumbnail_url: null,
    purchasable: total > 0 || Boolean(spec.backorderable),
    in_stock: total > 0,
    backorderable: Boolean(spec.backorderable),
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
    price: usd,
    original_price: null,
    seller_id: null,
    option_values: values,
    external_references: {},
    metadata: {},
    position: spec.position ?? 1,
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
    available_stock: total,
    reserved_quantity: 0,
    total_on_hand: total,
    product_name: productName,
    delivery_profile_id: null,
    prices,
    stock_levels,
    ...spec.fields,
  }
}

function publication(
  id: string,
  productId: string,
  channelIndex: number,
  fields: Partial<ProductPublication> = {},
): ProductPublication {
  return {
    id,
    published_at: null,
    unpublished_at: null,
    product_id: productId,
    channel_id: channels[channelIndex].id,
    created_at: created,
    updated_at: updated,
    ...fields,
  }
}

interface ProductSpec {
  id: string
  name: string
  slug: string
  status: Product['status']
  variants: VariantSpec[]
  options?: OptionType[]
  type?: ProductType
  categories?: Category[]
  tags?: string[]
  tax?: TaxCategory
  profile?: DeliveryProfile
  images?: [string, string, string | null][]
  collections?: Collection[]
  channelIndexes?: number[]
  fields?: Partial<Product>
}

function product(spec: ProductSpec): Product {
  const optioned = Boolean(spec.options?.length)
  const variants = spec.variants.map((each, index) =>
    variant(spec.id, spec.name, { position: index + 1, ...each }),
  )
  const media = (spec.images ?? []).map(([id, file, alt], index) =>
    productMedia(id, spec.id, file, alt, index + 1),
  )
  const first = variants[0]
  const inStock = variants.some((each) => each.in_stock)
  const backorderable = variants.some((each) => each.backorderable)
  const option_values = optioned ? variants.flatMap((each) => each.option_values) : []
  return {
    id: spec.id,
    name: spec.name,
    slug: spec.slug,
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    variant_count: optioned ? variants.length : 0,
    available_on: null,
    preorder_ships_at: null,
    purchasable: spec.status === 'active' && (inStock || backorderable),
    preorder: false,
    in_stock: inStock,
    backorderable,
    available: spec.status === 'active',
    description: null,
    description_html: null,
    default_variant_id: first.id,
    buy_box_variant_id: first.id,
    thumbnail_url: media[0]?.small_url ?? null,
    tags: spec.tags ?? [],
    price: first.price,
    original_price: null,
    seller_id: null,
    primary_media: media[0],
    media,
    variants: optioned ? variants : [],
    default_variant: first,
    option_types: spec.options ?? [],
    option_values: [...new Map(option_values.map((value) => [value.id, value])).values()],
    categories: spec.categories ?? [],
    custom_fields: [],
    external_references: {},
    translations: {},
    status: spec.status,
    metadata: {},
    deleted_at: null,
    created_at: created,
    updated_at: updated,
    delivery_profile_id: (spec.profile ?? generalProfile).id,
    seller_name: null,
    product_type_id: spec.type?.id ?? null,
    tax_category_id: (spec.tax ?? defaultTax).id,
    digital_assets: [],
    collections: spec.collections ?? [],
    product_publications: (spec.channelIndexes ?? [0]).map((channelIndex, index) =>
      publication(`ppub_${spec.id.slice(5)}${index}`, spec.id, channelIndex),
    ),
    channels: (spec.channelIndexes ?? [0]).map((channelIndex) => channels[channelIndex]),
    ...spec.fields,
  }
}

/** One of a product's own images, in the gallery order the product page shows. */
export function productMedia(
  id: string,
  productId: string,
  file: string,
  alt: string | null,
  position: number,
  fields: Partial<Media> = {},
): Media {
  return media(id, file, alt, {
    product_id: productId,
    position,
    viewable_id: productId,
    viewable_type: 'product',
    ...fields,
  })
}

export const clayMug = product({
  id: 'prod_3Mq7Lk2c',
  name: 'Clay mug',
  slug: 'clay-mug',
  status: 'active',
  type: mugType,
  categories: [mugs],
  tags: ['handmade', 'ceramic'],
  collections: [collections[0], collections[1]],
  images: [
    ['med_6Cm1Ug4A', 'product-clay.png', 'Clay mug, side view'],
    ['med_7Cm2Ug5B', 'product-sand.png', 'Clay mug, glaze detail'],
  ],
  channelIndexes: [0, 1],
  variants: [
    { id: 'variant_3Mq7Lk2c', sku: 'MUG-CLAY', usd: '18.00', eur: '16.50', stock: [24, 6, 0] },
  ],
  fields: {
    description:
      'A stoneware mug, thrown by hand and glazed in clay. Holds 350 ml and goes in the dishwasher.',
    description_html:
      '<p>A stoneware mug, thrown by hand and glazed in clay. Holds 350 ml and goes in the dishwasher.</p>',
    meta_title: 'Clay mug, hand thrown',
    meta_description: 'A hand-thrown stoneware mug in a clay glaze.',
  },
})

export const linenApron = product({
  id: 'prod_7Rt2Wn5p',
  name: 'Linen apron',
  slug: 'linen-apron',
  status: 'active',
  type: apronType,
  options: [colorOption, sizeOption],
  categories: [aprons],
  tags: ['linen', 'kitchen'],
  collections: [collections[0]],
  tax: clothingTax,
  images: [
    ['med_8La3Pr6C', 'product-olive.png', 'Linen apron in olive'],
    ['med_9La4Pr7D', 'product-slate.png', 'Linen apron in slate'],
  ],
  variants: [
    {
      id: 'variant_7Rt2Wn5a',
      sku: 'APRON-OLV-M',
      values: [olive, medium],
      usd: '42.00',
      eur: '39.00',
      stock: [8, 2, 0],
    },
    {
      id: 'variant_7Rt2Wn5b',
      sku: 'APRON-OLV-L',
      values: [olive, large],
      usd: '42.00',
      eur: '39.00',
      stock: [5, 0, 0],
    },
    {
      id: 'variant_7Rt2Wn5c',
      sku: 'APRON-SLT-M',
      values: [slate, medium],
      usd: '42.00',
      eur: '39.00',
      stock: [0, 0, 0],
      backorderable: true,
    },
    {
      id: 'variant_7Rt2Wn5d',
      sku: 'APRON-SLT-L',
      values: [slate, large],
      usd: '44.00',
      eur: '41.00',
      compareAt: '48.00',
      stock: [3, 1, 0],
    },
  ],
})

export const slateCap = product({
  id: 'prod_5Hd8Qz1v',
  name: 'Slate cap',
  slug: 'slate-cap',
  status: 'draft',
  tags: ['new'],
  tax: clothingTax,
  images: [['med_1Sc5Qa8E', 'product-slate.png', 'Slate cap']],
  channelIndexes: [],
  variants: [{ id: 'variant_5Hd8Qz1v', sku: 'CAP-SLATE', usd: '24.00', stock: [0, 0, 0] }],
})

export const sandTote = product({
  id: 'prod_9Kp4Xc6b',
  name: 'Sand tote',
  slug: 'sand-tote',
  status: 'archived',
  images: [['med_2St6Rb9F', 'product-sand.png', 'Sand tote']],
  variants: [{ id: 'variant_9Kp4Xc6b', sku: 'TOTE-SAND', usd: '30.00', stock: [2, 0, 0] }],
})

export const glazingGuide = product({
  id: 'prod_2Fw6Ty9n',
  name: 'Glazing guide',
  slug: 'glazing-guide',
  status: 'active',
  type: guideType,
  categories: [guides],
  tags: ['digital'],
  tax: digitalTax,
  profile: digitalProfile,
  variants: [
    {
      id: 'variant_2Fw6Ty9n',
      sku: 'GUIDE-GLAZE',
      usd: '9.00',
      eur: '8.50',
      stock: [],
      fields: { track_inventory: false, purchasable: true, in_stock: true },
    },
  ],
  fields: { in_stock: true, purchasable: true },
})

export const oliveCandle = product({
  id: 'prod_4Gb1Ns3m',
  name: 'Olive candle',
  slug: 'olive-candle',
  status: 'active',
  categories: [kitchen],
  images: [['med_3Oc7Sc1G', 'product-olive.png', 'Olive candle']],
  variants: [
    {
      id: 'variant_4Gb1Ns3m',
      sku: 'CANDLE-OLV',
      usd: '14.00',
      stock: [0, 0, 0],
      backorderable: true,
    },
  ],
})

/** The products list, in the order its default sort shows them. */
export const products: Product[] = [
  clayMug,
  linenApron,
  slateCap,
  sandTote,
  glazingGuide,
  oliveCandle,
]

/** The clay mug back in draft, scheduled to go on sale on its first channel in November. */
export const scheduledMug: Product = {
  ...clayMug,
  status: 'draft',
  product_publications: [
    {
      ...(clayMug.product_publications as ProductPublication[])[0],
      published_at: '2026-11-15T09:00:00.000Z',
      unpublished_at: '2026-12-31T23:00:00.000Z',
    },
  ],
}

// ---------------------------------------------------------------------------
// Files, stock history and tags
// ---------------------------------------------------------------------------

function digitalAsset(
  id: string,
  filename: string,
  contentType: string,
  byteSize: number,
  fields: Partial<DigitalAsset> = {},
): DigitalAsset {
  return {
    id,
    variant_id: glazingGuide.default_variant_id,
    filename,
    content_type: contentType,
    authorized_clicks: null,
    authorized_days: null,
    byte_size: byteSize,
    provider_settings: {},
    created_at: created,
    updated_at: updated,
    provider_type: null,
    provider_name: 'File',
    download_url: `/fixtures/${filename}`,
    effective_authorized_clicks: 5,
    effective_authorized_days: 30,
    ...fields,
  }
}

export const digitalAssets: DigitalAsset[] = [
  digitalAsset('dasset_1Gg4Pd7H', 'glazing-guide.pdf', 'application/pdf', 2_480_000),
  digitalAsset('dasset_2Wk5Zp8J', 'glaze-recipes.zip', 'application/zip', 14_200_000, {
    authorized_clicks: 3,
    authorized_days: 7,
    effective_authorized_clicks: 3,
    effective_authorized_days: 7,
  }),
]

function stockMovement(
  id: string,
  quantity: number,
  kind: StockMovement['kind'],
  at: string,
  fields: Partial<StockMovement> = {},
): StockMovement {
  const level = (clayMug.default_variant as Variant).stock_levels?.[0] as StockLevel
  return {
    id,
    quantity,
    kind,
    reason: null,
    created_at: at,
    updated_at: at,
    stock_level_id: level.id,
    stock_location_id: level.stock_location_id,
    stock_location_name: level.stock_location_name,
    variant_id: clayMug.default_variant_id,
    variant_name: clayMug.name,
    variant_sku: 'MUG-CLAY',
    order_id: null,
    fulfillment_id: null,
    return_id: null,
    exchange_id: null,
    stock_transfer_id: null,
    stock_receipt_id: null,
    purchase_order_id: null,
    order_number: null,
    return_number: null,
    exchange_number: null,
    stock_transfer_number: null,
    purchase_order_number: null,
    unit_cost: null,
    ...fields,
  }
}

/** The clay mug's stock history at the shop, newest first. Spree stores a shipment as a positive quantity. */
export const stockMovements: StockMovement[] = [
  stockMovement('smov_5Sh9Ip3K', 2, 'shipped', '2026-09-19T14:20:00.000Z', {
    order_id: 'or_7Fp2Kd9s',
    order_number: 'R1042',
  }),
  stockMovement('smov_4Ad8Uo2L', -1, 'adjusted', '2026-09-12T10:05:00.000Z', {
    reason: 'Chipped in storage',
  }),
  stockMovement('smov_3Rc7Yi1Z', 24, 'received', '2026-09-01T08:30:00.000Z', {
    unit_cost: '6.40',
    purchase_order_id: 'po_2Kl6Mn9P',
    purchase_order_number: 'PO-0007',
  }),
  stockMovement('smov_2Ad6Tu9X', 3, 'adjusted', '2026-08-20T16:45:00.000Z', {
    reason: 'Count correction',
  }),
]

/** The product tag vocabulary the tag pickers offer. */
export const productTags = [
  'ceramic',
  'digital',
  'gift idea',
  'handmade',
  'kitchen',
  'linen',
  'new',
]

/** The store's one carton, which a variant's case pack is packed in. */
export const cartonPackageType: PackageType = {
  id: 'pkg_4Ct8Rn2B',
  name: 'Shipping carton',
  kind: 'carton',
  length: '40.0',
  width: '30.0',
  height: '30.0',
  weight: '0.6',
  max_weight: '20.0',
  default: false,
  metadata: {},
  created_at: created,
  updated_at: updated,
  dimensions_unit: 'cm',
  weight_unit: 'kg',
  volume: '36000.0',
  seller_id: null,
  seller_name: null,
}

/**
 * A product's translation matrix, with Spree's translatable product fields in
 * its order. The store's one other language is German.
 */
export function productTranslations(
  product: Product,
  german: Record<string, string | null> = {},
): ResourceTranslations {
  const translated = Object.values(german).filter((value) => value != null && value !== '').length
  return {
    resource_type: 'product',
    resource_id: product.id,
    default_locale: 'en',
    supported_locales: ['en', 'de'],
    fields: [
      { key: 'name', type: 'string', source: product.name },
      { key: 'description', type: 'html', source: product.description_html },
      { key: 'slug', type: 'string', source: product.slug },
      { key: 'meta_description', type: 'string', source: product.meta_description },
      { key: 'meta_title', type: 'string', source: product.meta_title },
    ],
    translations: { de: { translated_field_count: translated, ...german } },
  }
}

/** The clay mug with its name and description in German. */
export const clayMugTranslations = productTranslations(clayMug, {
  name: 'Tonbecher',
  description:
    '<p>Ein handgedrehter Becher aus Steinzeug mit Tonglasur. Fasst 350 ml und ist spülmaschinenfest.</p>',
  slug: 'tonbecher',
})

/**
 * The clay mug's gallery with its three kinds of video, as Spree serves them:
 * an uploaded clip with a poster the merchant chose, a YouTube link with one,
 * and an uploaded clip with no poster yet, which has no still to show.
 */
export const clayMugWithVideos: Media[] = [
  ...(clayMug.media ?? []),
  productMedia('med_4Cv3Ug6C', clayMug.id, 'product-clay.png', 'Clay mug on the wheel', 3, {
    media_type: 'video',
    content_type: 'video/webm',
    filename: 'video-clay.webm',
    original_url: null,
    video_url: '/fixtures/video-clay.webm',
    poster_url: '/fixtures/product-clay.png',
  }),
  productMedia('med_5Cy4Ug7D', clayMug.id, 'product-sand.png', 'Glazing the clay mug', 4, {
    media_type: 'external_video',
    external_video_url: 'https://www.youtube.com/watch?v=CLAYMUG0001',
    video_provider: 'youtube',
    video_embed_url: '/fixtures/video-embed.html',
    embed_url: '/fixtures/video-embed.html',
    original_url: null,
    poster_url: '/fixtures/product-sand.png',
    filename: null,
    content_type: null,
  }),
  productMedia('med_6Cn5Ug8E', clayMug.id, 'video-clay.webm', null, 5, {
    media_type: 'video',
    content_type: 'video/webm',
    original_url: null,
    mini_url: null,
    small_url: null,
    medium_url: null,
    large_url: null,
    xlarge_url: null,
    og_image_url: null,
    video_url: '/fixtures/video-clay.webm',
    poster_url: null,
  }),
]
