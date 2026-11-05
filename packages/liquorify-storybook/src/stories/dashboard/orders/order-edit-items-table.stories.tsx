import { zodResolver } from '@hookform/resolvers/zod'
import type { Order } from '@spree/admin-sdk'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useFieldArray, useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'
import { OrderEditItemsTable } from '../../../../../dashboard/src/components/spree/orders/order-edit-items-table'
import {
  type OrderEditFormValues,
  orderEditFormSchema,
  orderToEditForm,
} from '../../../../../dashboard/src/schemas/order'
import { withStore } from '../../../decorators/store'
import { draftOrder, paidOrder, partlyFulfilledOrder } from '../../../fixtures/admin/orders'
import { orderParameters, orderRoutes } from './order-page'

/**
 * The items an order edit stages (DA-ORD-05): quantities changed, lines
 * struck out, and on a draft a negotiated price typed or reset. Nothing is
 * sent until Save, which here only checks the form as the page does. It checks
 * the form directly, as the page's keyboard shortcut does: the page's Save
 * button meets the browser's own check on the quantity field first.
 */
function EditItems({ order }: { order: Order }) {
  const form = useForm<OrderEditFormValues>({
    resolver: zodResolver(orderEditFormSchema),
    defaultValues: orderToEditForm(order.items ?? [], order.fulfillments ?? []),
  })
  const { fields } = useFieldArray({ control: form.control, name: 'items' })
  return (
    <form className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrderEditItemsTable
            form={form}
            fields={fields}
            pricesEditable={order.status === 'draft'}
            currency={order.currency}
          />
        </CardContent>
      </Card>
      <Button type="button" onClick={form.handleSubmit(() => undefined)} className="self-end">
        Save
      </Button>
    </form>
  )
}

const parameters = (order: Order) =>
  orderParameters({ order, route: orderRoutes.editOrder(order), column: 'page' })

const meta = {
  title: 'Admin dashboard/Orders/Order edit items table',
  component: EditItems,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: parameters(paidOrder),
} satisfies Meta<typeof EditItems>

export default meta
type Story = StoryObj<typeof meta>

const setQuantity = async (name: string, value: string) => {
  const input = await screen.findByLabelText(`Quantity of ${name}`)
  await userEvent.clear(input)
  await userEvent.type(input, value)
}

export const Placed: Story = {
  play: async () => {
    await screen.findByLabelText('Quantity of Clay mug')
  },
}

// One quantity raised and one line struck out, each total shown before and after.
export const Changed: Story = {
  name: 'Quantity changed and line removed',
  play: async () => {
    await setQuantity('Clay mug', '3')
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Linen apron' }))
    await screen.findByText('Removing')
  },
}

export const Empty: Story = {
  name: 'No items',
  args: { order: { ...paidOrder, items: [] } },
}

// On a draft the unit price is typed; the apron carries a negotiated one.
export const Draft: Story = {
  args: { order: draftOrder },
  parameters: parameters(draftOrder),
  play: async () => {
    await screen.findByText('Negotiated')
  },
}

export const PriceReset: Story = {
  name: 'Draft, negotiated price reset',
  args: { order: draftOrder },
  parameters: parameters(draftOrder),
  play: async () => {
    await userEvent.click(
      await screen.findByRole('button', { name: 'Reset Linen apron to catalog price' }),
    )
    await screen.findByText('Reverting to catalog price')
  },
}

export const PriceRefused: Story = {
  name: 'Draft, price not a number',
  args: { order: draftOrder },
  parameters: parameters(draftOrder),
  play: async () => {
    const price = await screen.findByLabelText('Unit price for Clay mug')
    await userEvent.clear(price)
    await userEvent.type(price, 'twenty')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Price must be a non-negative number')
  },
}

// Both mugs have shipped: their line cannot be struck out or dropped below two.
export const PartlyFulfilled: Story = {
  name: 'Partly fulfilled',
  args: { order: partlyFulfilledOrder },
  parameters: parameters(partlyFulfilledOrder),
  play: async () => {
    await screen.findByText('2 fulfilled')
  },
}

export const BelowFulfilled: Story = {
  name: 'Below what has shipped',
  args: { order: partlyFulfilledOrder },
  parameters: parameters(partlyFulfilledOrder),
  play: async () => {
    await setQuantity('Clay mug', '1')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText("Can't go below 2 fulfilled units")
  },
}
