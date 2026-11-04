import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { DeliveryMethodList } from '../../../../../dashboard/src/components/spree/shipping/delivery-method-list'
import { withStore } from '../../../decorators/store'
import {
  europeMethod,
  expressMethod,
  freeOverMethod,
  freightMethod,
  standardMethod,
} from '../../../fixtures/admin/delivery'
import { deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profileParameters } from './profile-page'

const domesticMethods = [standardMethod, expressMethod, freeOverMethod]

// The methods inside a zone card on a delivery profile's page (DA-SET-17),
// at the width the card leaves them.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery method list',
  component: DeliveryMethodList,
  tags: ['CMP-DA-G-20'],
  args: { methods: domesticMethods },
  decorators: [withStore],
  parameters: profileParameters({ column: 'inMainCard' }),
} satisfies Meta<typeof DeliveryMethodList>

export default meta
type Story = StoryObj<typeof meta>

const rowMenu = async (name: string) => {
  const row = (await screen.findByText(name)).closest('.py-2') as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
}

// A flat rate in the store's currency, one priced in two currencies, and one
// free above an item total and under a weight.
export const Priced: Story = {
  play: async () => {
    await screen.findByText(/and up/)
  },
}

// A method kept off the storefront is marked hidden.
export const Hidden: Story = {
  args: { methods: [europeMethod] },
  play: async () => {
    await screen.findByText('Hidden')
  },
}

// Priced through the freight rate provider, which quotes each order: the
// price names where it comes from, explained on hover.
export const CarrierPriced: Story = {
  name: 'Carrier priced',
  args: { methods: [freightMethod] },
  play: async () => {
    await screen.findByText('Carrier rates')
  },
}

export const CarrierHint: Story = {
  name: 'Carrier rates explained',
  args: { methods: [freightMethod] },
  parameters: profileParameters({ column: 'inMainCard', viewport: true }),
  play: async () => {
    await userEvent.hover(await screen.findByText('Carrier rates'))
    await screen.findByText(/Prices come from Freight at checkout/)
  },
}

export const None: Story = {
  args: { methods: [] },
  play: async () => {
    await screen.findByText('No delivery methods here yet.')
  },
}

export const RowMenu: Story = {
  name: 'Row menu',
  parameters: profileParameters({ column: 'inMainCard', viewport: true }),
  play: async () => {
    await rowMenu('Express')
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: profileParameters({ column: 'inMainCard', viewport: true }),
  play: async () => {
    await rowMenu('Express')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Storefronts will stop offering it immediately/)
  },
}

// A role that may read delivery methods but not delete them: the menu keeps edit only.
export const ViewerMenu: Story = {
  name: 'Viewer, row menu',
  parameters: profileParameters({
    column: 'inMainCard',
    viewport: true,
    rules: deliveryViewerRules,
  }),
  play: async () => {
    await rowMenu('Express')
    await screen.findByRole('menuitem', { name: 'Edit' })
  },
}

/**
 * On a marketplace one list holds the operator's methods and each seller's,
 * so a seller's row names them and a shared one says so. Liquorify sells
 * alone, and the seller panel's methods are batch 13's; shown for the
 * component's two badges.
 */
export const Marketplace: Story = {
  args: {
    methods: [
      { ...standardMethod, available_to_sellers: true },
      { ...expressMethod, seller_id: 'seller_3Fk8Lq2W', seller_name: 'Harbour Ceramics' },
    ],
  },
  play: async () => {
    await screen.findByText('Shared with sellers')
  },
}
