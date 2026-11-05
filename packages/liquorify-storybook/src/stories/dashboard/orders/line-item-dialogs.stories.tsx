import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'
import { AddLineItemDialog } from '../../../../../dashboard/src/components/spree/orders/line-item-dialogs'
import { withStore } from '../../../decorators/store'
import { orderParameters, orderRoutes } from './order-page'

/**
 * The catalog picker the order edit screen opens (DA-ORD-05). It writes
 * nothing: the chosen variant and quantity become a row marked "Not saved"
 * until the order is saved.
 */
const meta = {
  title: 'Admin dashboard/Orders/Add line item sheet',
  component: AddLineItemDialog,
  tags: ['CMP-DA-G-11'],
  args: { open: true, onOpenChange: fn(), onSelect: fn() },
  decorators: [withStore],
  parameters: orderParameters({ route: orderRoutes.editOrder(), viewport: true }),
} satisfies Meta<typeof AddLineItemDialog>

export default meta
type Story = StoryObj<typeof meta>

const search = async (text: string) => {
  const sheet = await screen.findByRole('dialog')
  await userEvent.type(within(sheet).getByPlaceholderText(/Type product name or SKU/), text)
  return sheet
}

export const Open: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Add Line Item' })
  },
}

export const Results: Story = {
  name: 'Search results',
  play: async () => {
    const sheet = await search('apron')
    await within(sheet).findAllByText(/Linen apron/)
  },
}

export const NoResults: Story = {
  name: 'Nothing found',
  play: async () => {
    const sheet = await search('teapot')
    await within(sheet).findByText('No variants found')
  },
}

export const Chosen: Story = {
  name: 'Variant chosen',
  play: async () => {
    const sheet = await search('clay')
    await userEvent.click((await within(sheet).findAllByText('Clay mug'))[0])
    const quantity = within(sheet).getByLabelText('Quantity')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '3')
    await within(sheet).findByRole('button', { name: 'Clear selection' })
  },
}
