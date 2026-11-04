import type {
  AdminUser,
  CouponCode,
  Customer,
  GiftCard,
  GiftCardBatch,
  OptionValue,
  PermissionRule,
  Promotion,
  PromotionAction,
  PromotionActionCalculator,
  PromotionRule,
  ResourceTypeDefinition,
  StoreCredit,
  StoreCreditEvent,
  Variant,
} from '@spree/admin-sdk'
import { categories, clayMug, colorOption, linenApron, sandTote } from './catalog'
import { countries } from './countries'
import { customerGroups } from './merchandising'
import { adminUser } from './session'
import { channels, markets } from './settings'

/**
 * Catalog part 3's records: promotions with their rules, actions and coupon
 * codes, gift cards and their batch, and store credits with their history.
 * Each is shaped as the browser-test server answered the same request on
 * 2026-11-04, and dated around the fixture clock (`../clock.ts`, 1 October
 * 2026), so a promotion can be not yet started, running or expired.
 */

const created = '2026-09-02T09:00:00.000Z'
const updated = '2026-09-28T16:30:00.000Z'

// ---------------------------------------------------------------------------
// Rule, action and calculator kinds
// ---------------------------------------------------------------------------

/** The rule kinds Spree registers, as `/promotion_rules/types` answered on the browser-test server on 2026-11-04. */
export const promotionRuleTypes = [
  {
    type: 'category',
    label: 'Categories',
    description: 'Order includes products in specified categories',
    schema: {
      type: 'object',
      properties: {
        match_policy: {
          type: 'string',
          enum: ['any', 'all'],
          default: 'any',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'channel',
    label: 'Channel(s)',
    description: 'Limit to orders placed through specified channel(s)',
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
    type: 'country',
    label: 'Country',
    description: 'Limit to orders with shipping address in a specific country',
    schema: {
      type: 'object',
      properties: {
        country_codes: {
          type: 'array',
          items: {
            type: 'string',
            format: 'iso-country',
            pattern: '^[A-Z]{2}$',
          },
          default: [],
        },
        country_id: {
          type: ['integer', 'null'],
        },
        country_code: {
          type: ['string', 'null'],
          format: 'iso-country',
          pattern: '^[A-Z]{2}$',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'currency',
    label: 'Currency',
    description: 'Limit to orders in a specific currency',
    schema: {
      type: 'object',
      properties: {
        currency: {
          type: ['string', 'null'],
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'customer_group',
    label: 'Customer Group(s)',
    description: 'Available only to customers in specified customer group(s)',
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
  },
  {
    type: 'customer',
    label: 'Customers',
    description: 'Available only to the specified customers',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'first_order',
    label: 'First order',
    description: "Must be the customer's first order",
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'item_total',
    label: 'Item total',
    description: 'Order total meets these criteria',
    schema: {
      type: 'object',
      properties: {
        amount_min: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '100',
        },
        operator_min: {
          type: 'string',
          default: '>',
        },
        amount_max: {
          type: ['string', 'null'],
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
        },
        operator_max: {
          type: 'string',
          default: '<',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'market',
    label: 'Market(s)',
    description: 'Limit to orders placed in specified market(s)',
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
    type: 'one_use_per_user',
    label: 'One Use Per User',
    description: 'Only One Use Per User',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'customer_logged_in',
    label: 'Only logged in customers',
    description: 'Available only to logged in customers',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'option_value',
    label: 'Option Value(s)',
    description: 'Order includes products with matching option value(s)',
    schema: {
      type: 'object',
      properties: {
        match_policy: {
          type: 'string',
          enum: ['any'],
          default: 'any',
        },
        eligible_values: {
          type: 'array',
          items: {
            type: 'string',
            format: 'prefixed-id',
            pattern: '^optval_[A-Za-z0-9]+$',
            'x-spree-prefix': 'optval',
          },
          default: [],
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'product',
    label: 'Product(s)',
    description: 'Order includes specified product(s)',
    schema: {
      type: 'object',
      properties: {
        match_policy: {
          type: 'string',
          enum: ['any', 'all', 'none'],
          default: 'any',
        },
      },
      additionalProperties: false,
    },
  },
] as ResourceTypeDefinition[]

/** The action kinds Spree registers, as `/promotion_actions/types` answered. */
export const promotionActionTypes = [
  {
    type: 'create_line_items',
    label: 'Create line items',
    description: 'Adds the specified quantity of a variant to the cart free of charge',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'create_item_adjustments',
    label: 'Create per-line-item adjustment',
    description: 'Creates a promotion credit adjustment on a line item',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'create_adjustment',
    label: 'Create whole-order adjustment',
    description: 'Creates a promotion credit adjustment on the order',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'free_shipping',
    label: 'Free shipping',
    description: 'Makes all shipments for the order free',
    schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
] as ResourceTypeDefinition[]

/** The calculators an order adjustment offers, as `/promotion_actions/calculators?type=create_adjustment` answered. */
export const orderAdjustmentCalculators: PromotionActionCalculator[] = [
  {
    type: 'flat_percent_item_total',
    label: 'Flat Percent',
    schema: {
      type: 'object',
      properties: {
        flat_percent: {
          type: 'string',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'flat_rate',
    label: 'Flat Rate',
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        currency: {
          type: 'string',
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
        apply_only_on_full_priced_items: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'flexi_rate',
    label: 'Flexible Rate',
    schema: {
      type: 'object',
      properties: {
        first_item: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        additional_item: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        max_items: {
          type: 'integer',
          default: 0,
        },
        currency: {
          type: 'string',
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
        apply_only_on_full_priced_items: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'tiered_flat_rate',
    label: 'Tiered Flat Rate',
    schema: {
      type: 'object',
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threshold: {
                type: 'string',
                format: 'money',
                pattern: '^-?\\d+(\\.\\d+)?$',
              },
              value: {
                type: 'string',
                pattern: '^-?\\d+(\\.\\d+)?$',
              },
            },
            required: ['threshold', 'value'],
            additionalProperties: false,
          },
          default: [],
        },
        base_amount: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        currency: {
          type: 'string',
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'tiered_percent',
    label: 'Tiered Percent',
    schema: {
      type: 'object',
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threshold: {
                type: 'string',
                format: 'money',
                pattern: '^-?\\d+(\\.\\d+)?$',
              },
              value: {
                type: 'string',
                pattern: '^-?\\d+(\\.\\d+)?$',
              },
            },
            required: ['threshold', 'value'],
            additionalProperties: false,
          },
          default: [],
        },
        base_percent: {
          type: 'string',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
      },
      additionalProperties: false,
    },
  },
]

/** The calculators an item adjustment offers, as `/promotion_actions/calculators?type=create_item_adjustments` answered. */
export const itemAdjustmentCalculators: PromotionActionCalculator[] = [
  {
    type: 'flat_rate',
    label: 'Flat Rate',
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        currency: {
          type: 'string',
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
        apply_only_on_full_priced_items: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'flexi_rate',
    label: 'Flexible Rate',
    schema: {
      type: 'object',
      properties: {
        first_item: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        additional_item: {
          type: 'string',
          format: 'money',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        max_items: {
          type: 'integer',
          default: 0,
        },
        currency: {
          type: 'string',
          format: 'currency',
          pattern: '^[A-Z]{3}$',
        },
        apply_only_on_full_priced_items: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'percent_on_line_item',
    label: 'Percent Per Item',
    schema: {
      type: 'object',
      properties: {
        percent: {
          type: 'string',
          pattern: '^-?\\d+(\\.\\d+)?$',
          default: '0',
        },
        apply_only_on_full_priced_items: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
]

// ---------------------------------------------------------------------------
// Shoppers
// ---------------------------------------------------------------------------

function shopper(
  id: string,
  first: string,
  last: string,
  fields: Partial<Customer> = {},
): Customer {
  return {
    id,
    email: `${first}.${last}@example.com`.toLowerCase(),
    first_name: first,
    last_name: last,
    phone: null,
    accepts_email_marketing: false,
    email_marketing_consent_updated_at: null,
    full_name: `${first} ${last}`,
    available_store_credit_total: '0.00',
    failed_attempts: 0,
    metadata: {},
    email_marketing_consent_source: 'unknown',
    created_at: '2026-03-10T14:00:00.000Z',
    updated_at: updated,
    anonymized_at: null,
    anonymized: false,
    tags: [],
    internal_note: null,
    internal_note_html: null,
    default_billing_address_id: null,
    default_shipping_address_id: null,
    orders_count: 2,
    total_spent: '84.00',
    last_order_completed_at: '2026-09-21T10:12:00.000Z',
    customer_group_ids: [],
    ...fields,
  }
}

export const morgan = shopper('cust_2Lm4Rn6P', 'Morgan', 'Reyes', {
  available_store_credit_total: '155.00',
})
export const priya = shopper('cust_5Ps7Hk9Q', 'Priya', 'Shah')
export const tom = shopper('cust_8Tb1Kc3R', 'Tom', 'Becker', { orders_count: 1 })
export const ines = shopper('cust_3Iq6Ln8W', 'Ines', 'Moreau', {
  available_store_credit_total: '0.00',
})

/**
 * A shopper whose data was erased: Spree keeps the record, names it Redacted
 * and gives it an address that cannot receive mail, as the browser-test
 * server did on 2026-11-04.
 */
export const erasedShopper = shopper('cust_6Xz8Wq2E', 'Redacted', 'Redacted', {
  email: 'anonymized-5b7e2c1a-4d3f-4e8a-9c21-7f60b1d2e3a4@invalid',
  anonymized: true,
  anonymized_at: '2026-09-25T11:00:00.000Z',
  orders_count: 1,
})

/** The shoppers the customer pickers search, the browser tests' order of names. */
export const loyaltyCustomers: Customer[] = [morgan, priya, tom, ines]

/** A shopper created after the issue dialog's picker last searched (DA-LOY-02). */
export const newShopper = shopper('cust_9Nw3Sh5V', 'Noor', 'Haddad', {
  orders_count: 0,
  total_spent: '0.00',
  last_order_completed_at: null,
})

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

function promotion(id: string, name: string, fields: Partial<Promotion> = {}): Promotion {
  return {
    id,
    name,
    description: null,
    code: null,
    starts_at: '2026-09-01T00:00:00.000Z',
    expires_at: null,
    usage_limit: null,
    match_policy: 'all',
    path: null,
    kind: 'automatic',
    multi_codes: false,
    number_of_codes: null,
    code_prefix: null,
    promotion_category_id: null,
    metadata: {},
    created_at: created,
    updated_at: updated,
    action_ids: [],
    rule_ids: [],
    ...fields,
  }
}

function rule(
  id: string,
  promotionId: string,
  type: string,
  fields: Partial<PromotionRule> = {},
): PromotionRule {
  return {
    id,
    created_at: created,
    updated_at: created,
    type,
    promotion_id: promotionId,
    preferences: {},
    product_ids: null,
    category_ids: null,
    customer_ids: null,
    option_value_ids: null,
    ...fields,
  }
}

function action(
  id: string,
  promotionId: string,
  type: string,
  fields: Partial<PromotionAction> = {},
): PromotionAction {
  return {
    id,
    created_at: created,
    updated_at: created,
    type,
    promotion_id: promotionId,
    preferences: {},
    calculator: null,
    line_items: null,
    ...fields,
  }
}

const autumnId = 'promo_1Au4Wl7C'
const loyalId = 'promo_2Ly5Sh8D'
const winterId = 'promo_3Wn6Gf9E'
const springId = 'promo_4Sp7Pv1F'
const summerId = 'promo_5Sm8Cl2G'
const bulkId = 'promo_6Bk9Th3H'
const shippingId = 'promo_7Fs1Hp4J'

const [, olive, slate] = colorOption.option_values as OptionValue[]
const [kitchen, mugs] = categories
const [northAmerica] = markets
const [online] = channels
const [wholesale] = customerGroups
const canada = countries.find((country) => country.iso === 'CA')
const unitedStates = countries.find((country) => country.iso === 'US')

/** Running, automatic, with two rules every order must meet and an order discount. */
export const autumnRules: PromotionRule[] = [
  rule('prorule_1Cn2Us3A', autumnId, 'country', {
    preferences: { country_codes: ['US', 'CA'], country_id: null, country_code: null },
    countries: [unitedStates, canada] as PromotionRule['countries'],
  }),
  rule('prorule_2It3Tl4B', autumnId, 'item_total', {
    preferences: { amount_min: '50', operator_min: 'gte', amount_max: null, operator_max: '<' },
  }),
]

export const autumnActions: PromotionAction[] = [
  action('pact_1Fp2Ct3A', autumnId, 'create_adjustment', {
    calculator: { type: 'flat_percent_item_total', preferences: { flat_percent: '10.0' } },
  }),
]

export const autumnWelcome = promotion(autumnId, 'Autumn welcome', {
  description: 'Ten percent off a first autumn order in North America.',
  starts_at: '2026-09-15T00:00:00.000Z',
  expires_at: '2026-12-31T23:59:00.000Z',
  rule_ids: autumnRules.map((each) => each.id),
  action_ids: autumnActions.map((each) => each.id),
})

/** One code, a usage limit, and four rules about who may use it. */
export const loyalRules: PromotionRule[] = [
  rule('prorule_3Cu4St5C', loyalId, 'customer', {
    customer_ids: [morgan.id, priya.id],
    customers: [morgan, priya],
  }),
  rule('prorule_4Cg5Rp6D', loyalId, 'customer_group', {
    preferences: { customer_group_ids: [wholesale.id] },
    customer_groups: [wholesale],
  }),
  rule('prorule_5Lg6In7E', loyalId, 'customer_logged_in'),
  rule('prorule_6Ou7Pu8F', loyalId, 'one_use_per_user'),
]

export const loyalActions: PromotionAction[] = [
  action('pact_2Pl3It4B', loyalId, 'create_item_adjustments', {
    calculator: {
      type: 'percent_on_line_item',
      preferences: { percent: '15.0', apply_only_on_full_priced_items: false },
    },
  }),
]

export const loyalShoppers = promotion(loyalId, 'Loyal shoppers', {
  description: 'Fifteen percent off each item for signed-in regulars.',
  kind: 'coupon_code',
  code: 'loyal15',
  usage_limit: 100,
  rule_ids: loyalRules.map((each) => each.id),
  action_ids: loyalActions.map((each) => each.id),
})

/** Sixty codes with a prefix; a product and a category rule, either of which may match. */
export const winterRules: PromotionRule[] = [
  rule('prorule_7Pr8Dt9G', winterId, 'product', {
    preferences: { match_policy: 'any' },
    product_ids: [clayMug.id, sandTote.id],
    products: [clayMug, sandTote],
  }),
  rule('prorule_8Ct9Gy1H', winterId, 'category', {
    preferences: { match_policy: 'any' },
    category_ids: [kitchen.id, mugs.id],
    categories: [kitchen, mugs],
  }),
]

export const winterActions: PromotionAction[] = [
  action('pact_3Fs4Hp5C', winterId, 'free_shipping'),
  action('pact_4Fr5Rt6D', winterId, 'create_adjustment', {
    calculator: {
      type: 'flat_rate',
      preferences: { amount: '5.00', currency: 'USD', apply_only_on_full_priced_items: false },
    },
  }),
]

export const winterGifts = promotion(winterId, 'Winter gifts', {
  description: 'Sixty single-use codes for the winter gift guide.',
  kind: 'coupon_code',
  multi_codes: true,
  number_of_codes: 60,
  code_prefix: 'winter',
  match_policy: 'any',
  starts_at: '2026-09-20T00:00:00.000Z',
  expires_at: '2027-01-31T23:59:00.000Z',
  rule_ids: winterRules.map((each) => each.id),
  action_ids: winterActions.map((each) => each.id),
})

/** Not yet started: a channel, a market and a currency rule, a tiered and an item discount. */
export const springRules: PromotionRule[] = [
  rule('prorule_9Ch1Ol2J', springId, 'channel', {
    preferences: { channel_ids: [online.id] },
    channels: [online],
  }),
  rule('prorule_1Mk2Na3K', springId, 'market', {
    preferences: { market_ids: [northAmerica.id] },
    markets: [northAmerica],
  }),
  rule('prorule_2Cy3Us4L', springId, 'currency', { preferences: { currency: 'USD' } }),
]

export const springActions: PromotionAction[] = [
  action('pact_5Tp6Pc7E', springId, 'create_adjustment', {
    calculator: {
      type: 'tiered_percent',
      preferences: {
        tiers: [
          { threshold: '100.0', value: '10.0' },
          { threshold: '250.0', value: '15.0' },
        ],
        base_percent: '5.0',
      },
    },
  }),
  action('pact_6Fi7Rt8F', springId, 'create_item_adjustments', {
    calculator: {
      type: 'flat_rate',
      preferences: { amount: '2.00', currency: 'USD', apply_only_on_full_priced_items: false },
    },
  }),
]

export const springPreview = promotion(springId, 'Spring preview', {
  description: 'Spring savings that grow with the order, online in North America.',
  starts_at: '2027-03-01T00:00:00.000Z',
  expires_at: '2027-04-30T23:59:00.000Z',
  rule_ids: springRules.map((each) => each.id),
  action_ids: springActions.map((each) => each.id),
})

/** Expired: an option value and a first order rule, a flexible discount and a free item. */
export const summerRules: PromotionRule[] = [
  rule('prorule_3Ov4Vl5M', summerId, 'option_value', {
    preferences: { match_policy: 'any', eligible_values: [olive.id, slate.id] },
    option_value_ids: [olive.id, slate.id],
    option_values: [olive, slate],
  }),
  rule('prorule_4Fo5Or6N', summerId, 'first_order'),
]

const apronVariants = linenApron.variants as Variant[]

export const summerActions: PromotionAction[] = [
  action('pact_7Fx8Rt9G', summerId, 'create_adjustment', {
    calculator: {
      type: 'flexi_rate',
      preferences: {
        first_item: '10.00',
        additional_item: '5.00',
        max_items: 3,
        currency: 'USD',
        apply_only_on_full_priced_items: false,
      },
    },
  }),
  action('pact_8Li9Nt1H', summerId, 'create_line_items', {
    line_items: [{ variant_id: clayMug.default_variant?.id as string, quantity: 1 }],
  }),
]

export const summerClearance = promotion(summerId, 'Summer clearance', {
  description: 'A free clay mug with a first order of olive or slate linen.',
  starts_at: '2026-06-01T00:00:00.000Z',
  expires_at: '2026-08-31T23:59:00.000Z',
  rule_ids: summerRules.map((each) => each.id),
  action_ids: summerActions.map((each) => each.id),
})

/** One code, no rules, a tiered flat discount and a flexible item discount. */
export const bulkActions: PromotionAction[] = [
  action('pact_9Tf1Rt2J', bulkId, 'create_adjustment', {
    calculator: {
      type: 'tiered_flat_rate',
      preferences: {
        tiers: [
          { threshold: '50.0', value: '5.0' },
          { threshold: '150.0', value: '20.0' },
        ],
        base_amount: '0.00',
        currency: 'USD',
      },
    },
  }),
  action('pact_1Fl2Xi3K', bulkId, 'create_item_adjustments', {
    calculator: {
      type: 'flexi_rate',
      preferences: {
        first_item: '3.00',
        additional_item: '1.00',
        max_items: 5,
        currency: 'USD',
        apply_only_on_full_priced_items: false,
      },
    },
  }),
]

export const bulkThanks = promotion(bulkId, 'Bulk thanks', {
  description: 'A larger discount the more a trade buyer spends.',
  kind: 'coupon_code',
  code: 'bulkthanks',
  starts_at: '2026-09-10T00:00:00.000Z',
  action_ids: bulkActions.map((each) => each.id),
})

/** Spree's sample promotion: the code FREESHIP and free shipping. */
export const freeShippingActions: PromotionAction[] = [
  action('pact_2Fs3Sp4L', shippingId, 'free_shipping'),
]

export const freeShipping = promotion(shippingId, 'Free Shipping', {
  kind: 'coupon_code',
  code: 'freeship',
  starts_at: '2026-08-01T00:00:00.000Z',
  action_ids: freeShippingActions.map((each) => each.id),
})

/** The promotions list, newest first, as its default sort shows them. */
export const promotions: Promotion[] = [
  bulkThanks,
  summerClearance,
  springPreview,
  winterGifts,
  loyalShoppers,
  autumnWelcome,
  freeShipping,
]

export const promotionRules: Record<string, PromotionRule[]> = {
  [autumnId]: autumnRules,
  [loyalId]: loyalRules,
  [winterId]: winterRules,
  [springId]: springRules,
  [summerId]: summerRules,
  [bulkId]: [],
  [shippingId]: [],
}

export const promotionActions: Record<string, PromotionAction[]> = {
  [autumnId]: autumnActions,
  [loyalId]: loyalActions,
  [winterId]: winterActions,
  [springId]: springActions,
  [summerId]: summerActions,
  [bulkId]: bulkActions,
  [shippingId]: freeShippingActions,
}

/**
 * The winter promotion's sixty codes, oldest first as Spree lists them, each
 * the prefix and sixteen hexadecimal characters. Spree has two states for a
 * code, unused and used; the second and fifth were used on orders.
 */
export const winterCodes: CouponCode[] = Array.from({ length: 60 }, (_, index) => {
  const digits = ((index + 1) * 2654435761).toString(16).padStart(16, '0').slice(-16)
  const used = index === 1 || index === 4
  return {
    id: `coupon_${(index + 1).toString(36).padStart(4, '0')}Wc${index}`,
    code: `winter${digits}`,
    state: used ? 'used' : 'unused',
    created_at: '2026-09-20T00:00:05.000Z',
    updated_at: used ? '2026-09-27T13:45:00.000Z' : '2026-09-20T00:00:05.000Z',
    promotion_id: winterId,
    order_id: used ? `or_${index}Wn7Rd2Q` : null,
  }
})

/** Variants the free line items action picks from, as the variant search answers. */
export const lineItemVariants: Variant[] = [
  clayMug.default_variant as Variant,
  ...apronVariants.slice(0, 2),
]

// ---------------------------------------------------------------------------
// Gift cards
// ---------------------------------------------------------------------------

export const xmasBatch: GiftCardBatch = {
  id: 'gcb_4Xm7Bt2N',
  codes_count: 5,
  currency: 'USD',
  prefix: 'XMAS',
  created_at: '2026-09-12T08:30:00.000Z',
  updated_at: '2026-09-12T08:30:00.000Z',
  amount: '25.00',
  expires_at: '2027-01-31',
  created_by_id: adminUser.id,
}

function giftCard(id: string, code: string, fields: Partial<GiftCard> = {}): GiftCard {
  return {
    id,
    code,
    status: 'active',
    currency: 'USD',
    amount: '50.00',
    amount_used: '0.00',
    amount_authorized: '0.00',
    amount_remaining: '50.00',
    expires_at: null,
    redeemed_at: null,
    expired: false,
    active: true,
    created_at: created,
    updated_at: updated,
    customer_id: null,
    created_by_id: adminUser.id,
    created_by: adminUser as AdminUser,
    ...noBatch,
    ...fields,
  }
}

const withCustomer = (customer: Customer) => ({ customer_id: customer.id, customer })

/**
 * A card outside any batch: the server answers `gift_card_batch: null` when
 * the list expands it, though the generated type has it only optional.
 */
const noBatch = { gift_card_batch: null } as unknown as Partial<GiftCard>

export const welcomeCard = giftCard('gc_1Wl2Cm3A', 'WELCOME-MORGAN', {
  expires_at: '2027-06-30',
  ...withCustomer(morgan),
})
export const deskCard = giftCard('gc_2Dk3Sk4B', 'FRONT-DESK', {
  amount: '75.00',
  amount_remaining: '75.00',
})
/** Partly redeemed: Spree no longer counts it as active, so its sheet is read-only. */
export const partlyRedeemedCard = giftCard('gc_3Pr4Rd5C', 'BIRTHDAY-PRIYA', {
  status: 'partially_redeemed',
  amount: '100.00',
  amount_used: '24.99',
  amount_remaining: '75.01',
  active: false,
  updated_at: '2026-09-27T13:40:00.000Z',
  ...withCustomer(priya),
})
export const redeemedCard = giftCard('gc_4Rd5Fl6D', 'THANKS-TOM', {
  status: 'redeemed',
  amount: '10.00',
  amount_used: '10.00',
  amount_remaining: '0.00',
  redeemed_at: '2026-09-27T13:42:00.000Z',
  active: false,
  ...withCustomer(tom),
})
export const expiredCard = giftCard('gc_5Ex6Pd7E', 'SUMMER-LAPSED', {
  status: 'expired',
  amount: '30.00',
  amount_remaining: '30.00',
  expires_at: '2026-09-15',
  expired: true,
  active: false,
})
export const euroCard = giftCard('gc_6Eu7Ro8F', 'BERLIN-INES', {
  currency: 'EUR',
  amount: '40.00',
  amount_remaining: '40.00',
  expires_at: '2027-12-31',
  ...withCustomer(ines),
})

export const xmasCards: GiftCard[] = ['3C15B4264D', '227479ED55', 'FA73BFD959'].map(
  (suffix, index) =>
    giftCard(`gc_${7 + index}Xm${index}Bt9G`, `XMAS${suffix}`, {
      amount: '25.00',
      amount_remaining: '25.00',
      expires_at: '2027-01-31',
      created_at: xmasBatch.created_at,
      gift_card_batch: xmasBatch,
    }),
)

/** The gift card list, newest first. */
export const giftCards: GiftCard[] = [
  ...xmasCards,
  euroCard,
  expiredCard,
  redeemedCard,
  partlyRedeemedCard,
  deskCard,
  welcomeCard,
]

// ---------------------------------------------------------------------------
// Store credits
// ---------------------------------------------------------------------------

function storeCredit(id: string, customer: Customer, fields: Partial<StoreCredit>): StoreCredit {
  return {
    id,
    amount: '25.00',
    amount_used: '0.00',
    amount_remaining: '25.00',
    currency: 'USD',
    memo: null,
    metadata: {},
    created_at: created,
    updated_at: updated,
    amount_authorized: '0.00',
    outstanding: true,
    customer_id: customer.id,
    created_by_id: adminUser.id,
    originator_type: null,
    originator_id: null,
    customer,
    created_by: adminUser as AdminUser,
    ...fields,
  }
}

/** Issued by staff and partly used on an order. */
export const goodwillCredit = storeCredit('credit_1Gw2Dl3A', morgan, {
  amount: '200.00',
  amount_used: '44.98',
  amount_remaining: '155.02',
  memo: 'Goodwill for a late delivery',
  updated_at: '2026-09-27T13:44:00.000Z',
})
/** Unused, in euros. */
export const returnCredit = storeCredit('credit_2Rt3Cr4B', ines, {
  amount: '60.00',
  amount_remaining: '60.00',
  currency: 'EUR',
  memo: 'Return credited to the account',
})
export const birthdayCredit = storeCredit('credit_3Bd4Cr5C', tom, { memo: 'Birthday credit' })
/** Made by Spree when a gift card paid for an order, and spent on it. */
export const giftCardCredit = storeCredit('credit_4Gc5Cr6D', priya, {
  amount: '24.99',
  amount_used: '24.99',
  amount_remaining: '0.00',
  outstanding: false,
  originator_type: 'gift_card',
  originator_id: partlyRedeemedCard.id,
  created_by_id: null,
  created_by: undefined,
  created_at: '2026-09-27T13:40:00.000Z',
})
/** Spent in full by staff on an order. */
export const spentCredit = storeCredit('credit_5Sp6Nt7E', tom, {
  amount: '54.97',
  amount_used: '54.97',
  amount_remaining: '0.00',
  outstanding: false,
  memo: 'Paid an order with a winter code',
  created_at: '2026-09-27T13:44:30.000Z',
})
/** The credit of a shopper whose data was erased: its memo is cleared with the shopper. */
export const erasedCredit = storeCredit('credit_6Er7Sd8F', erasedShopper, {
  amount: '15.00',
  amount_remaining: '15.00',
  created_at: '2026-09-05T10:00:00.000Z',
})

/** The store credits list, newest first. */
export const storeCredits: StoreCredit[] = [
  spentCredit,
  giftCardCredit,
  goodwillCredit,
  returnCredit,
  birthdayCredit,
  erasedCredit,
]

/** The goodwill credit's history, newest first, as Spree records a use on an order. */
export const goodwillEvents: StoreCreditEvent[] = [
  ['capture', 'Used', '2026-09-27T13:44:12.000Z'],
  ['authorize', 'Authorized', '2026-09-27T13:44:11.000Z'],
  ['eligible', 'Eligible', '2026-09-27T13:44:10.000Z'],
  ['allocation', 'Added', created],
].map(([action, display, at], index) => ({
  id: `scevt_${index + 1}Gw${index}Ev7A`,
  action,
  authorization_code: action === 'allocation' ? '1-SC-20260902090000' : '1-SC-20260927134410',
  display_action: display,
  amount: action === 'allocation' ? '200.00' : '44.98',
  created_at: at,
  updated_at: at,
  store_credit_id: goodwillCredit.id,
  originator_type: null,
  originator_id: null,
}))

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

function grant(actions: string[], subjects: string[]): PermissionRule[] {
  return subjects.map((subject) => ({
    allow: true,
    actions,
    subjects: [subject],
    has_conditions: false,
  }))
}

const shell = grant(['read'], ['country', 'state', 'store'])
const promotionSubjects = [
  'promotion',
  'promotion_rule',
  'promotion_action',
  'promotion_category',
  'coupon_code',
  'custom_field',
]

/**
 * `/me`'s rules for part 3's two custom roles, as the browser-test server
 * answered their teammates on 2026-11-04: the marketer, with write on
 * promotions only, and the loyalty viewer, with read on promotions, gift
 * cards, store credits and customers.
 */
export const loyaltyRoles: Record<
  'marketer' | 'loyaltyViewer',
  { rules: PermissionRule[]; keys: string[] }
> = {
  marketer: {
    rules: [
      ...shell,
      ...grant(['read', 'admin'], promotionSubjects),
      ...grant(['manage'], promotionSubjects),
    ],
    keys: ['read_promotions', 'write_promotions'],
  },
  loyaltyViewer: {
    rules: [
      ...shell,
      ...grant(
        ['read', 'admin'],
        [
          'customer',
          'address',
          'credit_card',
          'customer_group',
          'company',
          'company_membership',
          'company_invitation',
          'tax_identifier',
          'tax_exemption_certificate',
          'data_request',
          'consent_record',
          'custom_field',
          'gift_card',
          'gift_card_batch',
          'store_credit',
          'store_credit_event',
          ...promotionSubjects,
        ],
      ),
    ],
    keys: ['read_customers', 'read_gift_cards', 'read_store_credits', 'read_promotions'],
  },
}
