import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { DeliveryProfileOriginsCard } from '../../../../../dashboard/src/components/spree/shipping/delivery-profile-origins-card'
import { withStore } from '../../../decorators/store'
import { furnitureProfile, generalProfile } from '../../../fixtures/admin/delivery'
import { deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profileParameters, profileRoute } from './profile-page'

const furniturePage = profileRoute(furnitureProfile)

// Which locations a delivery profile ships from, in its page's sidebar (DA-SET-17).
const meta = {
  title: 'Admin dashboard/Shipping/Delivery profile origins card',
  component: DeliveryProfileOriginsCard,
  tags: ['CMP-DA-G-20'],
  args: { profile: generalProfile },
  decorators: [withStore],
  parameters: profileParameters({ column: 'settingsSidebar' }),
} satisfies Meta<typeof DeliveryProfileOriginsCard>

export default meta
type Story = StoryObj<typeof meta>

export const AllLocations: Story = { name: 'All locations' }

export const SomeLocations: Story = {
  name: 'Some locations',
  args: { profile: furnitureProfile },
  parameters: profileParameters({ column: 'settingsSidebar', route: furniturePage }),
  play: async () => {
    await screen.findByText('East coast depot')
  },
}

// Narrowed to chosen locations, ready to save.
export const Narrowed: Story = {
  play: async () => {
    await userEvent.click((await screen.findAllByLabelText('Selected locations'))[0])
    await userEvent.click((await screen.findAllByLabelText('Shop location'))[0])
  },
}

export const Viewer: Story = {
  args: { profile: furnitureProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: furniturePage,
    rules: deliveryViewerRules,
  }),
  play: async () => {
    await screen.findByText('East coast depot')
  },
}
