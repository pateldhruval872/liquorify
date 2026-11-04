import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { DeliveryProfileGeneralCard } from '../../../../../dashboard/src/components/spree/shipping/delivery-profile-general-card'
import { withStore } from '../../../decorators/store'
import {
  digitalProfile,
  freshProfile,
  furnitureProfile,
  generalProfile,
} from '../../../fixtures/admin/delivery'
import { deliveryViewerRules } from '../../../fixtures/admin/settings'
import { takenNameRefused, writeHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters, profileRoute } from './profile-page'

const rename = async (name: string) => {
  const field = await screen.findByLabelText('Name')
  await userEvent.clear(field)
  if (name) await userEvent.type(field, name)
}

// A delivery profile's name, kind and default flag, in its page's sidebar (DA-SET-17).
const meta = {
  title: 'Admin dashboard/Shipping/Delivery profile general card',
  component: DeliveryProfileGeneralCard,
  tags: ['CMP-DA-G-20'],
  args: { profile: generalProfile },
  decorators: [withStore],
  parameters: profileParameters({ column: 'settingsSidebar' }),
} satisfies Meta<typeof DeliveryProfileGeneralCard>

export default meta
type Story = StoryObj<typeof meta>

// The store's default profile says so, with nothing to promote.
export const StoreDefault: Story = {
  name: 'Store default',
  play: async () => {
    await screen.findByText('Products without a profile of their own ship on this one.')
  },
}

export const NotDefault: Story = {
  name: 'Not default',
  args: { profile: furnitureProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: profileRoute(furnitureProfile),
  }),
  play: async () => {
    await screen.findByRole('button', { name: 'Make default' })
  },
}

export const MakeDefaultConfirmation: Story = {
  name: 'Make default, confirmation',
  args: { profile: furnitureProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: profileRoute(furnitureProfile),
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Make default' }))
    await screen.findByText('Make this the default profile')
  },
}

export const Digital: Story = {
  args: { profile: digitalProfile },
  parameters: profileParameters({ column: 'settingsSidebar', route: profileRoute(digitalProfile) }),
}

// A new name, ready to save.
export const Renamed: Story = {
  args: { profile: freshProfile },
  parameters: profileParameters({ column: 'settingsSidebar', route: profileRoute(freshProfile) }),
  play: async () => {
    await rename('Fragile and glass')
  },
}

// A blank name: the form refuses it before asking the server.
export const NameRequired: Story = {
  name: 'Name required',
  args: { profile: freshProfile },
  parameters: profileParameters({ column: 'settingsSidebar', route: profileRoute(freshProfile) }),
  play: async () => {
    await rename('')
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}

// Another profile's name, refused by the server in its words.
export const NameRefused: Story = {
  name: 'Name refused',
  args: { profile: freshProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: profileRoute(freshProfile),
    first: takenNameRefused('delivery_profiles/:id', 'patch'),
  }),
  play: async () => {
    await rename('General')
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await screen.findByText('has already been taken')
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Saving: Story = {
  args: { profile: freshProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: profileRoute(freshProfile),
    first: writeHeld('delivery_profiles/:id', 'patch'),
  }),
  play: async () => {
    await rename('Fragile and glass')
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

// Read on settings: no save and no promotion.
export const Viewer: Story = {
  args: { profile: furnitureProfile },
  parameters: profileParameters({
    column: 'settingsSidebar',
    route: profileRoute(furnitureProfile),
    rules: deliveryViewerRules,
  }),
  play: async () => {
    await screen.findByDisplayValue('Furniture')
  },
}
