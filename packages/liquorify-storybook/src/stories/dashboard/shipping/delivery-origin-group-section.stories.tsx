import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { DeliveryOriginGroupSection } from '../../../../../dashboard/src/components/spree/shipping/delivery-origin-group-section'
import { withStore } from '../../../decorators/store'
import {
  eastCoastZone,
  eastFreightMethod,
  eastGroup,
  freightMethod,
  furnitureProfile,
  westCoastZone,
  westGroup,
} from '../../../fixtures/admin/delivery'
import { deliveryEditorRules, deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profileParameters, profileRoute } from './profile-page'

const nothing = () => {}
const furniturePage = profileRoute(furnitureProfile)

// One origin group of a profile split in two (DA-SET-17), in the page's main column.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery origin group section',
  component: DeliveryOriginGroupSection,
  tags: ['CMP-DA-G-20'],
  args: {
    profile: furnitureProfile,
    group: westGroup,
    zones: [westCoastZone],
    methods: [freightMethod],
    onAddZone: nothing,
    onEditZone: nothing,
  },
  decorators: [withStore],
  parameters: profileParameters({ column: 'settingsMain', route: furniturePage }),
} satisfies Meta<typeof DeliveryOriginGroupSection>

export default meta
type Story = StoryObj<typeof meta>

// The group's own menu sits beside its add zone button, and shows once its permissions load.
const groupMenu = async () => {
  const header = (await screen.findByRole('button', { name: 'Add delivery zone' }))
    .parentElement as HTMLElement
  await userEvent.click(await within(header).findByRole('button', { name: 'Open actions' }))
}

export const WestCoast: Story = {
  name: 'West coast',
  play: async () => {
    await screen.findByText('Ships from: Shop location')
  },
}

export const EastCoast: Story = {
  name: 'East coast',
  args: { group: eastGroup, zones: [eastCoastZone], methods: [eastFreightMethod] },
  play: async () => {
    await screen.findByText('Ships from: East coast depot')
  },
}

// A group with no zone yet keeps the card for methods offered everywhere.
export const NoZones: Story = {
  name: 'No zones',
  args: { zones: [], methods: [] },
}

export const GroupMenu: Story = {
  name: 'Group menu',
  parameters: profileParameters({ column: 'settingsMain', route: furniturePage, viewport: true }),
  play: async () => {
    await groupMenu()
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const EditDialog: Story = {
  name: 'Edit dialog',
  parameters: profileParameters({ column: 'settingsMain', route: furniturePage, viewport: true }),
  play: async () => {
    await groupMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    await screen.findByRole('heading', { name: 'Edit origin group' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: profileParameters({ column: 'settingsMain', route: furniturePage, viewport: true }),
  play: async () => {
    await groupMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Its zones and delivery methods go with it/)
  },
}

// Read on settings and the delivery scopes: no add button and no group actions.
export const Viewer: Story = {
  parameters: profileParameters({
    column: 'settingsMain',
    route: furniturePage,
    rules: deliveryViewerRules,
  }),
  play: async () => {
    await screen.findByText('Ships from: Shop location')
  },
}

// Writing delivery methods only: methods can be added, the group and its zones not changed.
export const MethodEditor: Story = {
  name: 'Method editor',
  parameters: profileParameters({
    column: 'settingsMain',
    route: furniturePage,
    rules: deliveryEditorRules,
  }),
  play: async () => {
    await screen.findAllByRole('button', { name: 'Add method' })
  },
}
