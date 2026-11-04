import type { Variant } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, HttpResponse, http } from 'msw'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { CreateLineItemsActionEditor } from '../../../../../dashboard/src/components/spree/promotion-editors/action-create-line-items'
import { withStore } from '../../../decorators/store'
import { clayMug } from '../../../fixtures/admin/catalog'
import { lineItemVariants, summerActions } from '../../../fixtures/admin/loyalty'
import { promotionPickers } from '../../../mocks/handlers/admin/loyalty'
import { ActionSheet, editorSheetParameters } from './editor-sheet'

const [, freeItems] = summerActions
const [, apron] = lineItemVariants as [Variant, Variant, Variant]

/**
 * The free line items action's editor (DA-PRM-02, DA-PRM-03): the variants
 * added to a qualifying cart free of charge, each with its quantity, and a
 * search to add more. Adding a variant already listed adds one to it.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Free line items action editor',
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onClose: fn() },
  decorators: [withStore],
  parameters: editorSheetParameters(),
  render: (args) => (
    <ActionSheet
      editor={CreateLineItemsActionEditor}
      action={freeItems}
      type="create_line_items"
      {...args}
    />
  ),
} satisfies Meta<{ onSave: () => void; onClose: () => void }>

export default meta
type Story = StoryObj<typeof meta>

export const WithItems: Story = {
  name: 'An item listed',
  play: async () => {
    await screen.findByRole('cell', { name: clayMug.name })
    await expect(screen.getByRole('spinbutton')).toHaveValue(1)
    await expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const NewAction: Story = {
  name: 'New action, nothing listed',
  render: (args) => (
    <ActionSheet editor={CreateLineItemsActionEditor} type="create_line_items" {...args} />
  ),
  play: async () => {
    await screen.findByText('No variants yet. Search below to add one.')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}

export const LoadingItems: Story = {
  name: 'Loading the listed items',
  parameters: editorSheetParameters({
    pickers: [
      http.get('/api/v3/admin/variants/:id', async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
      ...promotionPickers,
    ],
  }),
  play: async () => {
    await expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
  },
}

export const Searching: Story = {
  play: async () => {
    await screen.findByRole('cell', { name: clayMug.name })
    await userEvent.type(screen.getByRole('combobox'), 'apron')
    await screen.findAllByRole('option', { name: new RegExp(apron.product_name as string) })
  },
}

export const Adding: Story = {
  name: 'Adding a variant',
  play: async () => {
    await screen.findByRole('cell', { name: clayMug.name })
    await userEvent.type(screen.getByRole('combobox'), 'apron')
    const [first] = await screen.findAllByRole('option', {
      name: new RegExp(apron.product_name as string),
    })
    await userEvent.click(first)
    await waitFor(() => expect(screen.getAllByRole('spinbutton')).toHaveLength(2))
  },
}

/**
 * Emptying a quantity puts 1 back at once, so a new quantity is typed after
 * the 1 rather than in its place.
 */
export const ChangingQuantity: Story = {
  name: 'Changing a quantity and saving',
  play: async ({ args }) => {
    await screen.findByRole('cell', { name: clayMug.name })
    const quantity = screen.getByRole('spinbutton')
    await userEvent.clear(quantity)
    await expect(quantity).toHaveValue(1)
    await userEvent.type(quantity, '2')
    await expect(quantity).toHaveValue(12)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ variant_id: clayMug.default_variant?.id, quantity: 12 }],
      }),
    )
  },
}

export const Removing: Story = {
  name: 'Removing the last item',
  play: async () => {
    const row = (await screen.findByRole('cell', { name: clayMug.name })).closest('tr')
    await userEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Remove' }))
    await screen.findByText('No variants yet. Search below to add one.')
    await expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}
