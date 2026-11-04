import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { DeliveryMethodSheet } from '../../../../../dashboard/src/components/spree/shipping/delivery-method-sheet'
import { useDeliveryRateProviders } from '../../../../../dashboard/src/hooks/use-delivery-methods'
import { withStore } from '../../../decorators/store'
import {
  domesticZone,
  freightMethod,
  freshProfile,
  furnitureProfile,
  furnitureZones,
  generalProfile,
  generalZones,
  standardMethod,
} from '../../../fixtures/admin/delivery'
import { readHeld, takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters, profileRoute } from './profile-page'

const nothing = () => {}

// The profile's page loads the rate providers for its method lists before the
// sheet opens over it. That order decides whether an existing method saved with
// no rate provider shows the default or a blank field, so the sheet waits for
// them here too.
function OverItsPage(props: ComponentProps<typeof DeliveryMethodSheet>) {
  const { data } = useDeliveryRateProviders()
  return data ? <DeliveryMethodSheet {...props} /> : null
}

// Adding or editing a delivery method over its profile's page (DA-SET-17).
const meta = {
  title: 'Admin dashboard/Shipping/Delivery method sheet',
  component: DeliveryMethodSheet,
  tags: ['CMP-DA-G-20'],
  args: { profile: generalProfile, zones: generalZones, open: true, onOpenChange: nothing },
  decorators: [withStore],
  parameters: profileParameters({ viewport: true }),
  render: (args) => <OverItsPage {...args} />,
} satisfies Meta<typeof DeliveryMethodSheet>

export default meta
type Story = StoryObj<typeof meta>

const name = () => screen.findByLabelText('Name')
const create = () => userEvent.click(screen.getByRole('button', { name: 'Create delivery method' }))

export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'New delivery method' })
  },
}

// Added from the Domestic zone's card.
export const AddInAZone: Story = {
  name: 'Add in a zone',
  args: { zoneId: domesticZone.id },
  play: async () => {
    await name()
  },
}

// "Offer pickup" on a fresh profile, with no zone at all: the sheet opens set for a counter.
export const OfferPickup: Story = {
  name: 'Offer pickup',
  args: { profile: freshProfile, zones: [], provider: 'pickup' },
  parameters: profileParameters({ viewport: true, route: profileRoute(freshProfile) }),
  play: async () => {
    await screen.findByText('Collection locations')
  },
}

export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await name()
    await create()
    await waitFor(async () => expect(await name()).toHaveAttribute('aria-invalid', 'true'))
  },
}

export const NameTaken: Story = {
  name: 'Name taken',
  parameters: profileParameters({ viewport: true, first: takenNameRefused('delivery_methods') }),
  play: async () => {
    await userEvent.type(await name(), 'Standard')
    await create()
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Creating: Story = {
  parameters: profileParameters({ viewport: true, first: writeHeld('delivery_methods') }),
  play: async () => {
    await userEvent.type(await name(), 'Overnight')
    await create()
    await screen.findByRole('button', { name: 'Creating…' })
  },
}

export const Edit: Story = {
  args: { methodId: standardMethod.id },
  play: async () => {
    await screen.findByDisplayValue('Standard')
  },
}

// Priced through the freight rate provider with a markup, as it reopens after saving.
export const EditFreight: Story = {
  name: 'Edit, freight',
  args: { profile: furnitureProfile, zones: furnitureZones, methodId: freightMethod.id },
  parameters: profileParameters({ viewport: true, route: profileRoute(furnitureProfile) }),
  play: async () => {
    await screen.findByDisplayValue('Pallet freight')
  },
}

// Holding the method's read holds the rate providers' too, whose address it
// matches, so this one opens without waiting for them.
export const EditLoading: Story = {
  name: 'Edit, loading',
  args: { methodId: standardMethod.id },
  parameters: profileParameters({ viewport: true, first: readHeld('delivery_methods/:id') }),
  render: (args) => <DeliveryMethodSheet {...args} />,
}

export const EditRefused: Story = {
  name: 'Edit refused',
  args: { methodId: standardMethod.id },
  parameters: profileParameters({
    viewport: true,
    first: takenNameRefused('delivery_methods/:id', 'patch'),
  }),
  play: async () => {
    const field = await screen.findByLabelText('Name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Express')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Saving: Story = {
  args: { methodId: standardMethod.id },
  parameters: profileParameters({
    viewport: true,
    first: writeHeld('delivery_methods/:id', 'patch'),
  }),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Code'), '-2')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
