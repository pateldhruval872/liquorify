import { TaxIdentifiersCard } from '@spree/dashboard-ui/spree/tax-identifiers-card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import {
  checkableIdentifier,
  customerIdentifiers,
  euIdentifier,
  identifierVerdicts,
} from '../../../fixtures/admin/customers'

const saved = () => Promise.resolve()

/**
 * A buyer's VAT and business numbers (CMP-DUI-C-51), with the verdict of each
 * registry check. Headless: the owner, a customer on DA-CUS-02 or a company
 * and a seller in batches 12 and 13, supplies the numbers and the writes.
 * A verdict needs a validator gem that checks a registry, which Spree's core
 * does not ship, so the verdict stories show the card as such a gem would.
 */
const meta = {
  title: 'Dashboard UI/Composed/Tax identifiers card',
  component: TaxIdentifiersCard,
  tags: ['CMP-DUI-C-51'],
  args: {
    identifiers: identifierVerdicts,
    canEdit: true,
    mutations: {
      create: fn(saved),
      update: fn(saved),
      remove: fn(saved),
      validate: fn(saved),
      mapErrors: () => false,
    },
  },
  parameters: { liquorify: { column: 'sidebar' } },
} satisfies Meta<typeof TaxIdentifiersCard>

export default meta
type Story = StoryObj<typeof meta>

const viewport = { liquorify: { column: 'sidebar', capture: 'viewport' } }

async function openAddSheet() {
  await userEvent.click(await screen.findByRole('button', { name: 'Add registration' }))
  return screen.findByRole('dialog', { name: 'Add tax registration' })
}

async function openMenu(value: string) {
  const row = (await screen.findByText(value)).closest('[role="listitem"]') as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

export const Verdicts: Story = { name: 'Each verdict' }

export const NothingChecks: Story = {
  name: 'Nothing to check them',
  args: { identifiers: customerIdentifiers },
}

export const Empty: Story = { name: 'None on file', args: { identifiers: [] } }

export const Loading: Story = { args: { identifiers: [], isLoading: true } }

export const ReadOnly: Story = {
  name: 'Read-only',
  args: { canEdit: false },
  play: async () => {
    await expect(screen.queryByRole('button', { name: 'Add registration' })).not.toBeInTheDocument()
  },
}

export const Checking: Story = {
  name: 'Check under way',
  args: {
    mutations: {
      create: fn(saved),
      update: fn(saved),
      remove: fn(saved),
      validate: fn(saved),
      isValidating: true,
      mapErrors: () => false,
    },
  },
  parameters: viewport,
  play: async () => {
    const menu = await openMenu(checkableIdentifier.value)
    await expect(
      within(menu).getByRole('menuitem', { name: 'Check with registry' }),
    ).toHaveAttribute('aria-disabled', 'true')
  },
}

export const MenuCheckable: Story = {
  name: 'Menu, number a registry can check',
  args: { identifiers: [checkableIdentifier] },
  parameters: viewport,
  play: async () => {
    const menu = await openMenu(checkableIdentifier.value)
    await expect(
      within(menu).getByRole('menuitem', { name: 'Check with registry' }),
    ).not.toHaveAttribute('aria-disabled', 'true')
  },
}

export const AddSheet: Story = {
  name: 'Add sheet',
  parameters: viewport,
  play: async () => {
    await openAddSheet()
  },
}

export const KindOptions: Story = {
  name: 'Kinds listed',
  parameters: viewport,
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Kind' }))
    await screen.findByRole('option', { name: 'Australian Business Number' })
  },
}

// Any kind can be typed: what it means is up to the validator registered for
// it. Once the pointer moves on to the number, the field shows its placeholder
// again, though the typed kind is what a save sends (the next story).
export const CustomKind: Story = {
  name: 'A kind typed in',
  parameters: viewport,
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.type(within(sheet).getByRole('combobox', { name: 'Kind' }), 'nz_gst')
    // The list of kinds is open over the sheet, so the field is found by its label.
    await userEvent.type(within(sheet).getByLabelText('Number'), '123-456-789')
  },
}

export const CustomKindSaved: Story = {
  name: 'A kind typed in, saved',
  parameters: viewport,
  play: async ({ args }) => {
    const sheet = await openAddSheet()
    await userEvent.type(within(sheet).getByRole('combobox', { name: 'Kind' }), 'nz_gst')
    await userEvent.type(within(sheet).getByLabelText('Number'), '123-456-789')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(args.mutations.create).toHaveBeenCalledWith({ kind: 'nz_gst', value: '123-456-789' }),
    )
  },
}

export const Required: Story = {
  name: 'Nothing entered',
  parameters: viewport,
  play: async () => {
    const sheet = await openAddSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await within(sheet).findByText('Choose or type a registration type')
    await within(sheet).findByText('Enter the registration number')
  },
}

export const EditSheet: Story = {
  name: 'Edit sheet',
  args: { identifiers: customerIdentifiers },
  parameters: viewport,
  play: async () => {
    const menu = await openMenu(euIdentifier.value)
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit tax registration' })
    await within(sheet).findByDisplayValue(euIdentifier.value)
  },
}

export const DeleteConfirm: Story = {
  name: 'Delete confirmation',
  args: { identifiers: customerIdentifiers },
  parameters: viewport,
  play: async () => {
    const menu = await openMenu(euIdentifier.value)
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByRole('dialog', { name: 'Delete this registration?' })
  },
}
