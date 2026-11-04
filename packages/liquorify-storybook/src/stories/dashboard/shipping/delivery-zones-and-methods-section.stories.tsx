import type { DeliveryProfile, PermissionRule } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRouterState } from '@tanstack/react-router'
import { screen, userEvent } from 'storybook/test'
import {
  DeliveryZonesAndMethodsSection,
  type MethodSheetSearch,
} from '../../../../../dashboard/src/components/spree/shipping/delivery-zones-and-methods-section'
import { withStore } from '../../../decorators/store'
import {
  digitalProfile,
  domesticZone,
  freshProfile,
  furnitureProfile,
  generalProfile,
  standardMethod,
} from '../../../fixtures/admin/delivery'
import { deliveryEditorRules, deliveryViewerRules } from '../../../fixtures/admin/settings'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters, profileRoute } from './profile-page'

/**
 * The section reads the method sheet's state from the address, as the profile page passes it,
 * and its parts are spaced as the record page's main column (`ResourceLayout`) spaces them.
 */
function ZonesAndMethods({ profile }: { profile: DeliveryProfile }) {
  const search = useRouterState({ select: (state) => state.location.search }) as MethodSheetSearch
  return (
    <div className="flex flex-col gap-6">
      <DeliveryZonesAndMethodsSection profile={profile} search={search} />
    </div>
  )
}

function sectionParameters(
  profile: DeliveryProfile = generalProfile,
  {
    search = '',
    rules,
    viewport = false,
  }: { search?: string; rules?: PermissionRule[]; viewport?: boolean } = {},
) {
  return profileParameters({
    column: 'settingsMain',
    route: profileRoute(profile, search),
    rules,
    viewport,
  })
}

// The main column of a delivery profile's page (DA-SET-17): its zones and methods, pickup and digital delivery.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery zones and methods section',
  component: ZonesAndMethods,
  tags: ['CMP-DA-G-20'],
  args: { profile: generalProfile },
  decorators: [withStore],
  parameters: sectionParameters(),
} satisfies Meta<typeof ZonesAndMethods>

export default meta
type Story = StoryObj<typeof meta>

// Shipping from one origin: the zones as cards, methods offered everywhere, and pickup.
export const OneOrigin: Story = {
  name: 'One origin',
  play: async () => {
    await screen.findByText('Europe tracked')
  },
}

// Split into two origin groups, each with its own zone and method.
export const SplitOrigins: Story = {
  name: 'Split origins',
  args: { profile: furnitureProfile },
  parameters: sectionParameters(furnitureProfile),
  play: async () => {
    await screen.findByText('Two-person delivery')
  },
}

// A profile created a moment ago, with no zone and no method.
export const NoZones: Story = {
  name: 'No zones',
  args: { profile: freshProfile },
  parameters: sectionParameters(freshProfile),
  play: async () => {
    await screen.findByRole('button', { name: 'Offer pickup' })
  },
}

export const DigitalProfile: Story = {
  name: 'Digital profile',
  args: { profile: digitalProfile },
  parameters: sectionParameters(digitalProfile),
  play: async () => {
    await screen.findByText('Digital Delivery')
  },
}

export const Loading: Story = {
  parameters: profileParameters({ column: 'settingsMain', first: readHeld('delivery_zones') }),
}

// A method's own address opens its sheet over the page.
export const MethodFromItsAddress: Story = {
  name: 'Method sheet from its address',
  parameters: sectionParameters(generalProfile, {
    search: `?method=${standardMethod.id}`,
    viewport: true,
  }),
  play: async () => {
    await screen.findByDisplayValue('Standard')
  },
}

export const NewMethodInAZone: Story = {
  name: 'New method in a zone',
  parameters: sectionParameters(generalProfile, {
    search: `?method=new&zone=${domesticZone.id}`,
    viewport: true,
  }),
  play: async () => {
    await screen.findByRole('heading', { name: 'New delivery method' })
  },
}

export const AddZone: Story = {
  name: 'Add zone',
  parameters: sectionParameters(generalProfile, { viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add delivery zone' }))
    await screen.findByRole('heading', { name: 'New delivery zone' })
  },
}

export const SplitDialog: Story = {
  name: 'Split dialog',
  parameters: sectionParameters(generalProfile, { viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Split shipping origins' }))
    await screen.findByRole('heading', { name: 'Split shipping origins' })
  },
}

// Read on settings, delivery methods and package types: every add and split button gone.
export const Viewer: Story = {
  parameters: sectionParameters(generalProfile, { rules: deliveryViewerRules }),
  play: async () => {
    await screen.findByText('Europe tracked')
  },
}

// Writing delivery methods while reading settings: methods may be added, zones and origins not.
export const MethodEditor: Story = {
  name: 'Method editor',
  parameters: sectionParameters(generalProfile, { rules: deliveryEditorRules }),
  play: async () => {
    await screen.findAllByRole('button', { name: 'Add method' })
  },
}
