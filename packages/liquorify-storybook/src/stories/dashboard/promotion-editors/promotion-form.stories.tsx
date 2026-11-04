import { type PermissionRule, type Promotion, SpreeError } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, spyOn, userEvent, waitFor, within } from 'storybook/test'
import { PromotionForm } from '../../../../../dashboard/src/components/spree/promotion-editors/promotion-form'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import {
  autumnActions,
  autumnRules,
  autumnWelcome,
  loyalActions,
  loyalRules,
  loyalShoppers,
  loyaltyRoles,
  springActions,
  springPreview,
  springRules,
  winterActions,
  winterGifts,
  winterRules,
} from '../../../fixtures/admin/loyalty'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  couponCodesHeld,
  promotionPickers,
  promotionRequests,
} from '../../../mocks/handlers/admin/loyalty'

/**
 * The promotion page, signed in with the given permissions, at the
 * promotion's own address (or the new promotion page's), with the rule and
 * action kinds, the calculators, the pickers, the codes and their export
 * answered.
 */
function pageParameters(
  promotion?: Promotion,
  rules?: PermissionRule[],
  overrides: Record<string, unknown> = {},
) {
  // Storybook merges a story's handlers into its file's by key, so overrides
  // replace a default under its own key.
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column: 'page',
      capture: 'viewport',
      route: {
        pattern: promotion ? '/$storeId/promotions/$promotionId' : '/$storeId/promotions/new',
        path: `/${shellStore.id}/promotions/${promotion?.id ?? 'new'}`,
      },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        promotions: promotionRequests(),
        pickers: promotionPickers,
        ...overrides,
      },
    },
  }
}

function editing(
  promotion: Promotion,
  initialRules = autumnRules,
  initialActions = autumnActions,
  rules?: PermissionRule[],
) {
  return {
    args: { mode: 'edit' as const, promotion, initialRules, initialActions },
    parameters: pageParameters(promotion, rules),
  }
}

const creating = {
  args: {
    mode: 'create' as const,
    promotion: undefined,
    initialRules: undefined,
    initialActions: undefined,
  },
  parameters: pageParameters(),
}

/**
 * The answer Spree gives a promotion save it refuses, as the browser-test
 * server gave it on 2026-11-04: a tier over 100% is refused for the whole
 * promotion, and a name of spaces for the name.
 */
const tierRefused = new SpreeError(
  {
    error: {
      code: 'validation_error',
      message: 'Calculator preferred tiers should all have a value between 0% and 100%',
      details: {
        base: [
          {
            code: null,
            message: 'Calculator preferred tiers should all have a value between 0% and 100%',
          },
        ],
      },
    },
  } as never,
  422,
)

const nameRefused = new SpreeError(
  {
    error: {
      code: 'validation_error',
      message: "Name can't be blank",
      details: { name: [{ code: 'blank', message: "can't be blank" }] },
    },
  } as never,
  422,
)

/** A promotion whose end date was entered before its start date. */
const backwards: Promotion = { ...autumnWelcome, expires_at: '2026-09-01T00:00:00.000Z' }

/**
 * The new promotion page (DA-PRM-02) and a promotion's page (DA-PRM-03): the
 * rules, with the match policy once there are two, an Add rule picker
 * offering each kind not yet used, each rule's editor and a confirmed
 * removal; the actions, with their calculators summarised; the name and
 * description; how the promotion is applied, editable only when it is
 * created, with a single code typed or generated or a batch of codes, and on
 * the promotion's page the codes sheet and its export; and the schedule and
 * usage limit. The page passes Save and Delete to Spree and runs Delete's
 * own confirmation, so here they are recorded rather than sent.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Promotion form',
  component: PromotionForm,
  tags: ['CMP-DA-G-15'],
  args: {
    mode: 'edit',
    promotion: autumnWelcome,
    initialRules: autumnRules,
    initialActions: autumnActions,
    onSubmit: fn(async () => {}),
    onDelete: fn(),
  },
  decorators: [withStore, withToaster],
  parameters: pageParameters(autumnWelcome),
} satisfies Meta<typeof PromotionForm>

export default meta
type Story = StoryObj<typeof meta>

export const Editing: Story = {
  name: 'A promotion',
  play: async () => {
    await screen.findByRole('heading', { name: 'Autumn welcome' })
    await screen.findByText('United States, Canada')
    await screen.findByText('Amount min: 50, Operator min: gte, Operator max: <')
    await screen.findByText('Flat Percent · 10.0%')
    await screen.findByText('Automatic (no code)')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}

export const Loading: Story = {
  args: { promotion: undefined, initialRules: undefined, initialActions: undefined },
  play: async () => {
    await screen.findByText('Loading promotion…')
  },
}

export const NewPromotion: Story = {
  name: 'New promotion, a coupon code by default',
  ...creating,
  play: async () => {
    await screen.findByRole('heading', { name: 'New promotion' })
    await expect(
      screen.getByRole('combobox', { name: 'How is this promotion applied?' }),
    ).toHaveTextContent('Coupon code')
    await screen.findByRole('textbox', { name: 'Code' })
    await screen.findByText(
      'No rules. Without rules, the promotion always qualifies (subject to schedule and usage limit).',
    )
    await screen.findByText(
      "No actions yet. A promotion without actions doesn't do anything when applied.",
    )
    await expect(screen.getByRole('button', { name: 'Create promotion' })).toBeEnabled()
  },
}

export const Automatic: Story = {
  name: 'New promotion, applied automatically',
  ...creating,
  play: async () => {
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'How is this promotion applied?' }),
    )
    await userEvent.click(await screen.findByRole('option', { name: 'Automatic (no code)' }))
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Code' })).not.toBeInTheDocument(),
    )
  },
}

export const TypedCode: Story = {
  name: 'A typed code, created',
  ...creating,
  play: async ({ args }) => {
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'Welcome back')
    await userEvent.type(screen.getByRole('textbox', { name: 'Code' }), 'WELCOME10')
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Usage limit' }), '250')
    await userEvent.click(screen.getByRole('button', { name: 'Create promotion' }))
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Welcome back',
          kind: 'coupon_code',
          code: 'WELCOME10',
          multi_codes: false,
          usage_limit: 250,
        }),
      ),
    )
  },
}

export const GeneratedCode: Story = {
  name: 'A generated code',
  ...creating,
  play: async () => {
    // The page draws the code from the browser's random numbers; these are fixed.
    spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      ;(array as Uint32Array).set([7, 1, 20, 3, 25, 9, 14, 30])
      return array
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Generate' }))
    await expect(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('HBXD4KR9')
  },
}

export const CodeMissing: Story = {
  name: 'Code missing',
  ...creating,
  play: async ({ args }) => {
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'Welcome back')
    await userEvent.click(screen.getByRole('button', { name: 'Create promotion' }))
    await screen.findByText('Code is required (or click Generate)')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  ...creating,
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Create promotion' }))
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true'),
    )
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const ManyCodes: Story = {
  name: 'A batch of codes',
  ...creating,
  play: async ({ args }) => {
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'Gift guide')
    await userEvent.click(screen.getByRole('switch', { name: 'Generate a batch of unique codes' }))
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Number of codes' }), '200')
    await userEvent.type(screen.getByRole('textbox', { name: 'Code prefix (optional)' }), 'gift')
    await userEvent.click(screen.getByRole('button', { name: 'Create promotion' }))
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'coupon_code',
          code: null,
          multi_codes: true,
          number_of_codes: 200,
          code_prefix: 'gift',
        }),
      ),
    )
  },
}

/**
 * The prefix's label says it is optional, and the form refuses a batch
 * without one.
 */
export const ManyCodesWithoutPrefix: Story = {
  name: 'A batch of codes without a prefix',
  ...creating,
  play: async ({ args }) => {
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'Gift guide')
    await userEvent.click(screen.getByRole('switch', { name: 'Generate a batch of unique codes' }))
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Number of codes' }), '200')
    await userEvent.click(screen.getByRole('button', { name: 'Create promotion' }))
    await screen.findByText('Prefix is required for multi-code batches')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const EndsBeforeStarts: Story = {
  name: 'Ends before it starts',
  ...editing(backwards),
  play: async ({ args }) => {
    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), ' 2026')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Expiry must be after the start date')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const RulePicker: Story = {
  name: 'Adding a rule, every kind offered',
  ...creating,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add rule' })
    await within(sheet).findByRole('button', { name: /^Product\(s\)/ })
    const kinds = within(sheet)
      .getAllByRole('button')
      .filter((button) => button.querySelector('[data-slot="item-title"]'))
    await expect(kinds).toHaveLength(13)
  },
}

export const RulePickerSomeUsed: Story = {
  name: 'Adding a rule, kinds already used left out',
  ...editing(loyalShoppers, loyalRules, loyalActions),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add rule' })
    await within(sheet).findByRole('button', { name: /^Product\(s\)/ })
    await expect(
      within(sheet).queryByRole('button', { name: /^Customers/ }),
    ).not.toBeInTheDocument()
  },
}

async function addRule(kind: RegExp) {
  await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
  const picker = await screen.findByRole('dialog', { name: 'Add rule' })
  await userEvent.click(await within(picker).findByRole('button', { name: kind }))
}

export const CurrencyRule: Story = {
  name: 'The currency rule’s editor',
  ...creating,
  play: async () => {
    await addRule(/^Currency/)
    const sheet = await screen.findByRole('dialog', { name: 'Currency' })
    await within(sheet).findByText("Tune the rule's parameters.")
    await within(sheet).findByRole('button', { name: 'Save' })
  },
}

export const ItemTotalRule: Story = {
  name: 'The item total rule’s editor',
  ...creating,
  play: async () => {
    await addRule(/^Item total/)
    const sheet = await screen.findByRole('dialog', { name: 'Item total' })
    await within(sheet).findByRole('button', { name: 'Save' })
  },
}

export const RuleWithoutSettings: Story = {
  name: 'A rule with no settings, added',
  ...creating,
  play: async () => {
    await addRule(/^Only logged in customers/)
    const sheet = await screen.findByRole('dialog', { name: 'Only logged in customers' })
    await within(sheet).findByText(
      'This rule has no configurable options — its presence alone applies the constraint.',
    )
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add' }))
    await screen.findByRole('button', { name: /^Only logged in customers/ })
  },
}

export const EditorCancelled: Story = {
  name: 'A rule’s editor cancelled, nothing added',
  ...creating,
  play: async () => {
    await addRule(/^First order/)
    const sheet = await screen.findByRole('dialog', { name: 'First order' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await screen.findByText(
      'No rules. Without rules, the promotion always qualifies (subject to schedule and usage limit).',
    )
  },
}

export const ActionPicker: Story = {
  name: 'Adding an action',
  ...creating,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add action' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add action' })
    await within(sheet).findByRole('button', { name: /^Create whole-order adjustment/ })
    await within(sheet).findByRole('button', { name: /^Create per-line-item adjustment/ })
    await within(sheet).findByRole('button', { name: /^Create line items/ })
    await within(sheet).findByRole('button', { name: /^Free shipping/ })
  },
}

export const FreeShipping: Story = {
  name: 'Free shipping, added',
  ...creating,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add action' }))
    const picker = await screen.findByRole('dialog', { name: 'Add action' })
    await userEvent.click(await within(picker).findByRole('button', { name: /^Free shipping/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Free shipping' })
    await within(sheet).findByText('This action has no configurable options.')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add' }))
    await screen.findByRole('button', { name: /^Free shipping/ })
  },
}

export const NewOrderDiscount: Story = {
  name: 'A whole-order discount, added',
  ...creating,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add action' }))
    const picker = await screen.findByRole('dialog', { name: 'Add action' })
    await userEvent.click(
      await within(picker).findByRole('button', { name: /^Create whole-order adjustment/ }),
    )
    const sheet = await screen.findByRole('dialog', { name: 'Create whole-order adjustment' })
    await within(sheet).findByText('Calculator settings')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await screen.findByText('Flat Percent')
  },
}

export const SingleCode: Story = {
  name: 'A single code, locked',
  ...editing(loyalShoppers, loyalRules, loyalActions),
  play: async () => {
    await screen.findByText('LOYAL15')
    await screen.findByText(
      "Trigger settings can't be changed after creation. Make a new promotion to change them.",
    )
    await screen.findByText('Morgan Reyes, Priya Shah')
    await screen.findByText('Percent Per Line Item · 15.0%')
  },
}

export const ManyCodesSummary: Story = {
  name: 'A batch of codes, locked',
  ...editing(winterGifts, winterRules, winterActions),
  play: async () => {
    await screen.findByText('Multi-code coupon (60 codes with prefix "winter")')
    await screen.findByRole('button', { name: 'Show codes' })
    await screen.findByText('Free shipping')
    await screen.findByText('Flat Rate · $5.00')
  },
}

export const CodesSheet: Story = {
  name: 'The codes sheet',
  ...editing(winterGifts, winterRules, winterActions),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Show codes' }))
    const sheet = await screen.findByRole('dialog', { name: 'Coupon codes' })
    await within(sheet).findByText(/^60 auto-generated codes/)
    await within(sheet).findByText('Page 1 of 2')
    await expect(within(sheet).getAllByText('Used')).toHaveLength(2)
  },
}

export const CodesSheetNextPage: Story = {
  name: 'The codes sheet, second page',
  ...editing(winterGifts, winterRules, winterActions),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Show codes' }))
    const sheet = await screen.findByRole('dialog', { name: 'Coupon codes' })
    await within(sheet).findByText('Page 1 of 2')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Next' }))
    await within(sheet).findByText('Page 2 of 2')
  },
}

/** Until the codes arrive the sheet says there are none. */
export const CodesLoading: Story = {
  name: 'The codes sheet, loading',
  ...editing(winterGifts, winterRules, winterActions),
  parameters: pageParameters(winterGifts, undefined, {
    promotions: [...couponCodesHeld, ...promotionRequests()],
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Show codes' }))
    const sheet = await screen.findByRole('dialog', { name: 'Coupon codes' })
    await within(sheet).findByText('No codes generated yet.')
  },
}

export const ExportingCodes: Story = {
  name: 'Exporting the codes',
  ...editing(winterGifts, winterRules, winterActions),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Show codes' }))
    const sheet = await screen.findByRole('dialog', { name: 'Coupon codes' })
    await userEvent.click(await within(sheet).findByRole('button', { name: 'Export CSV' }))
    await expect(await within(sheet).findByRole('button', { name: 'Exporting…' })).toBeDisabled()
  },
}

export const ChoosingMatchPolicy: Story = {
  name: 'Choosing the match policy',
  play: async () => {
    await screen.findByText('United States, Canada')
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'Any rule may match' })
  },
}

export const OneRuleNoPolicy: Story = {
  name: 'One rule, no match policy',
  ...editing(springPreview, springRules.slice(0, 1), springActions),
  play: async () => {
    await screen.findByText('Online Store')
    await expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  },
}

export const EditingRule: Story = {
  name: 'Editing a rule',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /^Country/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Country' })
    await within(sheet).findByText('Canada')
  },
}

export const RemovingRule: Story = {
  name: 'Removing a rule',
  play: async () => {
    await screen.findByText('United States, Canada')
    const [first] = await screen.findAllByRole('button', { name: 'Remove rule' })
    await userEvent.click(first)
    const confirm = await screen.findByRole('dialog', { name: 'Remove rule?' })
    await within(confirm).findByText('Removed when you save the promotion.')
  },
}

export const RuleRemoved: Story = {
  name: 'Rule removed, waiting for Save',
  play: async () => {
    await screen.findByText('United States, Canada')
    const [first] = await screen.findAllByRole('button', { name: 'Remove rule' })
    await userEvent.click(first)
    const confirm = await screen.findByRole('dialog', { name: 'Remove rule?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryByText('United States, Canada')).not.toBeInTheDocument())
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

/**
 * An action's remove button is named Remove rule, as a rule's is, and opens
 * the action's own confirmation.
 */
export const RemovingAction: Story = {
  name: 'Removing an action',
  play: async () => {
    await screen.findByText('Flat Percent · 10.0%')
    const buttons = await screen.findAllByRole('button', { name: 'Remove rule' })
    await expect(buttons).toHaveLength(3)
    await userEvent.click(buttons[2])
    const confirm = await screen.findByRole('dialog', { name: 'Remove action?' })
    await within(confirm).findByText('Removed when you save the promotion.')
  },
}

export const EditingTiers: Story = {
  name: 'Editing tiers',
  ...editing(springPreview, springRules, springActions),
  play: async () => {
    await userEvent.click(
      await screen.findByRole('button', { name: /^Create whole-order adjustment/ }),
    )
    const sheet = await screen.findByRole('dialog', { name: 'Create whole-order adjustment' })
    await within(sheet).findByText('Tiers')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add tier' }))
    await waitFor(() => expect(within(sheet).getAllByLabelText('Order total ≥')).toHaveLength(3))
    await userEvent.type(within(sheet).getAllByLabelText('Order total ≥')[2], '500')
    await userEvent.type(within(sheet).getAllByLabelText('Discount')[2], '20')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await screen.findByText(/^Tiered Percent · Tiers: 3/)
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Saved: Story = {
  play: async ({ args }) => {
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Autumn welcome 2026')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Autumn welcome 2026',
          match_policy: 'all',
          rules: expect.arrayContaining([expect.objectContaining({ type: 'country' })]),
        }),
      ),
    )
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.not.objectContaining({ kind: 'automatic' }),
    )
  },
}

export const TierRefused: Story = {
  name: 'Save refused, a tier over 100%',
  ...editing(springPreview, springRules, springActions),
  args: { onSubmit: fn(async () => Promise.reject(tierRefused)) },
  play: async () => {
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await userEvent.type(name, ' 2027')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(
      'Calculator preferred tiers should all have a value between 0% and 100%',
    )
  },
}

export const NameRefused: Story = {
  name: 'Save refused, a name of spaces',
  args: { onSubmit: fn(async () => Promise.reject(nameRefused)) },
  play: async () => {
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText("can't be blank")
    await expect(name).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Deleting: Story = {
  play: async ({ args }) => {
    await screen.findByRole('heading', { name: 'Autumn welcome' })
    await userEvent.click(screen.getByRole('button', { name: /more/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await expect(args.onDelete).toHaveBeenCalled()
  },
}

/** The loyalty viewer reads promotions and may change none of their parts. */
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  ...editing(autumnWelcome, autumnRules, autumnActions, loyaltyRoles.loyaltyViewer.rules),
  play: async () => {
    await screen.findByText('United States, Canada')
    await expect(screen.queryByRole('button', { name: 'Add rule' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Add action' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Remove rule' })).not.toBeInTheDocument()
  },
}

/** The marketer may write promotions, so has every control the full admin has. */
export const MarketerRole: Story = {
  name: 'Marketer role',
  ...editing(autumnWelcome, autumnRules, autumnActions, loyaltyRoles.marketer.rules),
  play: async () => {
    await screen.findByText('United States, Canada')
    await screen.findByRole('button', { name: 'Add rule' })
    await screen.findByRole('button', { name: 'Add action' })
  },
}
