import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { DeliveryPickupCard } from '../../../../../dashboard/src/components/spree/shipping/delivery-pickup-card'
import { withStore } from '../../../decorators/store'
import { pickupMethod } from '../../../fixtures/admin/delivery'
import { deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profilePageRequests } from '../../../mocks/handlers/admin/delivery'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { stockLocationList } from '../../../mocks/handlers/admin/settings'
import { profileParameters } from './profile-page'

// Collection in person on a delivery profile (DA-SET-17), with the counters
// customers can collect from, in the page's main column.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery pickup card',
  component: DeliveryPickupCard,
  tags: ['CMP-DA-G-20'],
  args: { methods: [pickupMethod] },
  decorators: [withStore],
  parameters: profileParameters({ column: 'main' }),
} satisfies Meta<typeof DeliveryPickupCard>

export default meta
type Story = StoryObj<typeof meta>

// One pickup method, and the store's counter ticked for collection.
export const Offered: Story = {
  play: async () => {
    await screen.findByText('Collect in store')
    await screen.findByText('Downtown counter')
  },
}

// A fresh profile offers no pickup yet, with the button that sets one up.
export const NotOffered: Story = {
  name: 'Not offered',
  args: { methods: [] },
  play: async () => {
    await screen.findByRole('button', { name: 'Offer pickup' })
  },
}

export const NoLocations: Story = {
  name: 'No locations',
  args: { methods: [] },
  parameters: profileParameters({
    column: 'main',
    requests: { ...profilePageRequests(), stockLocations: stockLocationList([]) },
  }),
  play: async () => {
    await screen.findByText(/No locations yet/)
  },
}

export const LocationsLoading: Story = {
  name: 'Locations loading',
  parameters: profileParameters({ column: 'main', first: readHeld('stock_locations') }),
}

// A role that may not create delivery methods gets no button; the counters
// stay ticked as they are, since they belong to the locations.
export const Viewer: Story = {
  args: { methods: [] },
  parameters: profileParameters({ column: 'main', rules: deliveryViewerRules }),
  play: async () => {
    await screen.findByText('Downtown counter')
  },
}
