import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { DeliveryDigitalMethodsCard } from '../../../../../dashboard/src/components/spree/shipping/delivery-digital-methods-card'
import { withStore } from '../../../decorators/store'
import { digitalMethod, digitalProfile } from '../../../fixtures/admin/delivery'
import { deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profileParameters, profileRoute } from './profile-page'

const digitalPage = profileRoute(digitalProfile)

// A digital profile's only card on its page (DA-SET-17), in the main column.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery digital methods card',
  component: DeliveryDigitalMethodsCard,
  tags: ['CMP-DA-G-20'],
  args: { methods: [digitalMethod] },
  decorators: [withStore],
  parameters: profileParameters({ column: 'settingsMain', route: digitalPage }),
} satisfies Meta<typeof DeliveryDigitalMethodsCard>

export default meta
type Story = StoryObj<typeof meta>

export const DigitalMethod: Story = {
  name: 'Digital method',
  play: async () => {
    await screen.findByText('Digital Delivery')
  },
}

export const None: Story = {
  args: { methods: [] },
  play: async () => {
    await screen.findByRole('button', { name: 'Add digital method' })
  },
}

export const Viewer: Story = {
  args: { methods: [] },
  parameters: profileParameters({
    column: 'settingsMain',
    route: digitalPage,
    rules: deliveryViewerRules,
  }),
  play: async () => {
    await screen.findByText('No digital delivery method yet.')
  },
}
