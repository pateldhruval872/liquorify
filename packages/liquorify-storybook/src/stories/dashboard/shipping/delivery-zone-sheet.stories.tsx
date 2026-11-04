import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { DeliveryZoneSheet } from '../../../../../dashboard/src/components/spree/shipping/delivery-zone-sheet'
import { withStore } from '../../../decorators/store'
import { domesticZone, europeZone, generalProfile } from '../../../fixtures/admin/delivery'
import { readHeld, takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters } from './profile-page'

const nothing = () => {}

// Adding or editing a zone on a delivery profile's page (DA-SET-17).
const meta = {
  title: 'Admin dashboard/Shipping/Delivery zone sheet',
  component: DeliveryZoneSheet,
  tags: ['CMP-DA-G-20'],
  args: {
    deliveryProfileId: generalProfile.id,
    siblingZones: [domesticZone, europeZone],
    open: true,
    onOpenChange: nothing,
  },
  decorators: [withStore],
  parameters: profileParameters({ viewport: true }),
} satisfies Meta<typeof DeliveryZoneSheet>

export default meta
type Story = StoryObj<typeof meta>

const name = () => screen.findByLabelText('Name')

export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'New delivery zone' })
  },
}

// A zone with its countries and one ticked from the markets.
export const CountriesAdded: Story = {
  name: 'Countries added',
  args: { siblingZones: [europeZone] },
  play: async () => {
    await userEvent.type(await name(), 'North America')
    await userEvent.click(await screen.findByLabelText('Canada'))
  },
}

export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Create delivery zone' }))
    await waitFor(async () => expect(await name()).toHaveAttribute('aria-invalid', 'true'))
  },
}

export const NameTaken: Story = {
  name: 'Name taken',
  parameters: profileParameters({ viewport: true, first: takenNameRefused('delivery_zones') }),
  play: async () => {
    await userEvent.type(await name(), 'Domestic')
    await userEvent.click(screen.getByRole('button', { name: 'Create delivery zone' }))
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Creating: Story = {
  parameters: profileParameters({ viewport: true, first: writeHeld('delivery_zones') }),
  play: async () => {
    await userEvent.type(await name(), 'North America')
    await userEvent.click(await screen.findByLabelText('Canada'))
    await userEvent.click(screen.getByRole('button', { name: 'Create delivery zone' }))
    await screen.findByRole('button', { name: 'Creating…' })
  },
}

export const Edit: Story = {
  args: { zoneId: europeZone.id },
  play: async () => {
    await screen.findByDisplayValue('Europe')
  },
}

export const EditLoading: Story = {
  name: 'Edit, loading',
  args: { zoneId: europeZone.id },
  parameters: profileParameters({ viewport: true, first: readHeld('delivery_zones/:id') }),
}
