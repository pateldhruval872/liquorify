import type { PermissionRule, PriceList } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { PriceListForm } from '../../../../../dashboard/src/components/spree/price-list-editors/price-list-form'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import {
  draftList,
  priceListPricesImport,
  scheduledList,
  tradeList,
  tradeProducts,
  tradeRules,
} from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'
import { shellStore } from '../../../fixtures/admin/shell'
import { uploadAccepted } from '../../../mocks/handlers/admin/files'
import {
  audienceLists,
  exportRequests,
  importRequests,
  membershipRequests,
  priceListRequests,
  priceRequests,
  productPickerList,
} from '../../../mocks/handlers/admin/merchandising'

/** A draft list given a start date after the store's clock, so activating it schedules it. */
const springList: PriceList = { ...draftList, starts_at: '2027-03-01T05:00:00.000Z' }

/** A draft list whose end date was entered before its start date. */
const backwardsList: PriceList = { ...springList, ends_at: '2027-02-01T05:00:00.000Z' }

/**
 * The price list page, signed in with the given permissions, at the list's
 * own address (or the new price list page's), with every request its parts
 * make answered.
 */
function pageParameters(priceList?: PriceList, rules?: PermissionRule[]) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      column: 'page',
      capture: 'viewport',
      route: {
        pattern: priceList
          ? '/$storeId/products/price-lists/$priceListId'
          : '/$storeId/products/price-lists/new',
        path: `/${shellStore.id}/products/price-lists/${priceList?.id ?? 'new'}`,
      },
    },
    msw: {
      handlers: {
        ...base.msw.handlers,
        priceLists: priceListRequests(),
        audience: audienceLists,
        members: membershipRequests(
          'price_lists',
          priceList?.id === tradeList.id ? tradeProducts : [],
        ),
        products: productPickerList(),
        prices: priceRequests(),
        upload: uploadAccepted,
        imports: importRequests(priceListPricesImport),
        exports: exportRequests(),
      },
    },
  }
}

function editing(priceList: PriceList, rules?: PermissionRule[]) {
  return {
    args: { mode: 'edit' as const, priceList, initialRules: priceList.price_rules ?? [] },
    parameters: pageParameters(priceList, rules),
  }
}

/**
 * The price list page (DA-PRD-17) for a new list and an existing one: its
 * rules, with the match policy, an add rule picker, each rule's editor sheet
 * and a confirmed removal; the products the list prices, each variant with
 * its price and quantity breaks; the name, description and schedule; and in
 * the header the list's status, Edit prices, the CSV buttons, Activate or
 * Schedule, Deactivate or Unschedule, each confirmed, Save and Delete. The
 * page passes Save and Delete to Spree and runs Delete's own confirmation,
 * so here they are recorded rather than sent.
 */
const meta = {
  title: 'Admin dashboard/Price lists/Price list form',
  component: PriceListForm,
  tags: ['CMP-DA-G-13'],
  args: {
    mode: 'edit',
    priceList: tradeList,
    initialRules: tradeRules,
    onSubmit: fn(async () => {}),
    onDelete: fn(),
    onImportCreated: fn(),
  },
  decorators: [withStore, withToaster],
  parameters: pageParameters(tradeList),
} satisfies Meta<typeof PriceListForm>

export default meta
type Story = StoryObj<typeof meta>

export const Editing: Story = {
  name: 'A price list',
  play: async () => {
    await screen.findByRole('heading', { name: 'Trade prices' })
    await screen.findByText('Min quantity: 6')
    await screen.findByText('MUG-CLAY')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await screen.findByRole('button', { name: 'Deactivate' })
    await screen.findByRole('button', { name: 'Edit prices' })
  },
}

export const Loading: Story = {
  args: { priceList: undefined, initialRules: undefined },
  play: async () => {
    await screen.findByRole('heading', { name: 'Loading…' })
  },
}

export const NewPriceList: Story = {
  name: 'New price list',
  args: { mode: 'create', priceList: undefined, initialRules: undefined },
  parameters: pageParameters(),
  play: async () => {
    await screen.findByRole('heading', { name: 'Create price list' })
    await screen.findByText('No rules — this list applies to every shopper.')
    await expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument()
    await expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled()
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  args: { mode: 'create', priceList: undefined, initialRules: undefined },
  parameters: pageParameters(),
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Create' }))
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true'),
    )
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const EndsBeforeStarts: Story = {
  name: 'Ends before it starts',
  ...editing(backwardsList),
  play: async ({ args }) => {
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await userEvent.type(name, ' 2027')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Must be after start date.')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const Saved: Story = {
  play: async ({ args }) => {
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Trade prices 2027')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Trade prices 2027' }),
      ),
    )
  },
}

export const NoRules: Story = {
  name: 'No rules',
  ...editing(draftList),
  play: async () => {
    await screen.findByText('No rules — this list applies to every shopper.')
    await screen.findByRole('button', { name: 'Activate' })
  },
}

export const ChoosingMatchPolicy: Story = {
  name: 'Choosing the match policy',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Any rule may match' })
  },
}

export const AddingRule: Story = {
  name: 'Adding a rule',
  ...editing(draftList),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add rule' })
    await within(sheet).findByText('Volume pricing')
    await within(sheet).findByText('Market')
    await within(sheet).findByText('Channel')
  },
}

export const AddingRuleWithSomeUsed: Story = {
  name: 'Adding a rule, most kinds used',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add rule' })
    await within(sheet).findByText('Market')
    await expect(within(sheet).queryByText('Channel')).not.toBeInTheDocument()
  },
}

export const EditingRule: Story = {
  name: 'Editing a rule',
  play: async () => {
    await userEvent.click(await screen.findByText('Min quantity: 6'))
    const sheet = await screen.findByRole('dialog', { name: 'Volume pricing' })
    await within(sheet).findByRole('button', { name: 'Save' })
  },
}

export const RemovingRule: Story = {
  name: 'Removing a rule',
  play: async () => {
    await screen.findByText('Min quantity: 6')
    const [first] = await screen.findAllByRole('button', { name: 'Remove rule' })
    await userEvent.click(first)
    const confirm = await screen.findByRole('dialog', { name: 'Remove rule?' })
    await within(confirm).findByText('The rule is removed when you save the price list.')
  },
}

export const RuleRemoved: Story = {
  name: 'Rule removed, waiting for Save',
  play: async () => {
    await screen.findByText('Min quantity: 6')
    const [first] = await screen.findAllByRole('button', { name: 'Remove rule' })
    await userEvent.click(first)
    const confirm = await screen.findByRole('dialog', { name: 'Remove rule?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryByText('Min quantity: 6')).not.toBeInTheDocument())
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const Activating: Story = {
  ...editing(draftList),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Activate' }))
    const confirm = await screen.findByRole('dialog', { name: 'Activate price list?' })
    await within(confirm).findByText(
      '"Spring launch" will apply to qualifying customers immediately and stay active until manually deactivated.',
    )
  },
}

export const Activated: Story = {
  ...editing(draftList),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Activate' }))
    const confirm = await screen.findByRole('dialog', { name: 'Activate price list?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Activate' }))
    await screen.findByText('Price list activated')
  },
}

export const Scheduling: Story = {
  ...editing(springList),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Schedule' }))
    const confirm = await screen.findByRole('dialog', { name: 'Schedule price list?' })
    await within(confirm).findByText(/"Spring launch" will go live on/)
  },
}

export const Deactivating: Story = {
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))
    const confirm = await screen.findByRole('dialog', { name: 'Deactivate price list?' })
    await within(confirm).findByText(
      '"Trade prices" will stop applying to customers immediately. Existing orders are unaffected.',
    )
  },
}

export const Unscheduling: Story = {
  ...editing(scheduledList),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Unschedule' }))
    const confirm = await screen.findByRole('dialog', { name: 'Unschedule price list?' })
    await within(confirm).findByText(/will no longer activate on its scheduled date/)
  },
}

export const EditingPrices: Story = {
  name: 'Editing prices',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit prices' }))
    await screen.findByRole('dialog', { name: 'Edit prices — Trade prices' })
    await screen.findByText('6 prices in USD')
  },
}

export const Deleting: Story = {
  play: async ({ args }) => {
    await screen.findByRole('heading', { name: 'Trade prices' })
    await userEvent.click(screen.getByRole('button', { name: /more/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await expect(args.onDelete).toHaveBeenCalled()
  },
}

export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  ...editing(tradeList, readOnly),
  play: async () => {
    await screen.findByText('Min quantity: 6')
    // Export needs only read access, so once it shows the role's permissions have loaded.
    await screen.findByRole('button', { name: 'Export' })
    await expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Edit prices' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Add rule' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Remove rule' })).not.toBeInTheDocument()
  },
}
