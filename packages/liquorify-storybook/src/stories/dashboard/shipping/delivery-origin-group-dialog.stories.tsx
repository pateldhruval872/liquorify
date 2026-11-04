import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { DeliveryOriginGroupDialog } from '../../../../../dashboard/src/components/spree/shipping/delivery-origin-group-dialog'
import { withStore } from '../../../decorators/store'
import { generalProfile, westGroup } from '../../../fixtures/admin/delivery'
import { writeHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters } from './profile-page'

const nothing = () => {}

// Splitting a profile's shipping origins, or editing one group (DA-SET-17).
const meta = {
  title: 'Admin dashboard/Shipping/Delivery origin group dialog',
  component: DeliveryOriginGroupDialog,
  tags: ['CMP-DA-G-20'],
  args: { deliveryProfileId: generalProfile.id, open: true, onOpenChange: nothing },
  decorators: [withStore],
  parameters: profileParameters({ viewport: true }),
} satisfies Meta<typeof DeliveryOriginGroupDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Split: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Split shipping origins' })
  },
}

// Narrowed to chosen locations with none ticked yet.
export const NoLocationChosen: Story = {
  name: 'No location chosen',
  play: async () => {
    await userEvent.click((await screen.findAllByLabelText('Selected locations'))[0])
    await screen.findByText('Select at least one location, or choose all locations.')
  },
}

export const LocationChosen: Story = {
  name: 'Location chosen',
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Name'), 'East coast')
    await userEvent.click((await screen.findAllByLabelText('Selected locations'))[0])
    await userEvent.click((await screen.findAllByLabelText('East coast depot'))[0])
  },
}

export const Edit: Story = {
  args: { group: westGroup },
  play: async () => {
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('West coast'))
  },
}

export const Creating: Story = {
  parameters: profileParameters({
    viewport: true,
    first: writeHeld('delivery_profiles/:profileId/origin_groups'),
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Split shipping origins' }))
    await screen.findByRole('button', { name: 'Creating…' })
  },
}
