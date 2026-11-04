import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import {
  DeliveryZoneCard,
  UnrestrictedMethodsCard,
} from '../../../../../dashboard/src/components/spree/shipping/delivery-zone-card'
import { withStore } from '../../../decorators/store'
import {
  carrierMethodFromSource,
  domesticZone,
  europeMethod,
  europeZone,
  expressMethod,
  freeOverMethod,
  freightMethod,
  standardMethod,
  westCoastZone,
} from '../../../fixtures/admin/delivery'
import { deliveryEditorRules, deliveryViewerRules } from '../../../fixtures/admin/settings'
import { profileParameters } from './profile-page'

const nothing = () => {}

// One zone of a delivery profile (DA-SET-17), with its methods, in the page's main column.
const meta = {
  title: 'Admin dashboard/Shipping/Delivery zone card',
  component: DeliveryZoneCard,
  tags: ['CMP-DA-G-20'],
  args: {
    zone: domesticZone,
    methods: [standardMethod, expressMethod, freeOverMethod],
    onEdit: nothing,
  },
  decorators: [withStore],
  parameters: profileParameters({ column: 'main' }),
} satisfies Meta<typeof DeliveryZoneCard>

export default meta
type Story = StoryObj<typeof meta>

const zoneMenu = async () => {
  const header = (await screen.findByText(domesticZone.name)).closest('[data-slot="card-header"]')
  await userEvent.click(within(header as HTMLElement).getByRole('button', { name: 'Open actions' }))
}

export const Domestic: Story = {
  play: async () => {
    await screen.findByText('United States')
  },
}

// Five countries: three named, the rest behind a tooltip.
export const ManyCountries: Story = {
  name: 'Many countries',
  args: { zone: europeZone, methods: [europeMethod] },
  play: async () => {
    await screen.findByText('2 more')
  },
}

export const MoreCountriesShown: Story = {
  name: 'Many countries, the rest shown',
  args: { zone: europeZone, methods: [europeMethod] },
  parameters: profileParameters({ column: 'main', viewport: true }),
  play: async () => {
    await userEvent.hover(await screen.findByRole('button', { name: '2 more' }))
    await screen.findByText(/United Kingdom/, {}, { timeout: 3000 })
  },
}

// Narrower than a country: two states and a postal code prefix, with the freight method.
export const StatesAndPostalCodes: Story = {
  name: 'States and postal codes',
  args: { zone: westCoastZone, methods: [freightMethod] },
  play: async () => {
    await screen.findByText(/941\*/)
  },
}

export const NoMethods: Story = {
  name: 'No methods',
  args: { methods: [] },
  play: async () => {
    await screen.findByText('No delivery methods here yet.')
  },
}

export const ZoneMenu: Story = {
  name: 'Zone menu',
  parameters: profileParameters({ column: 'main', viewport: true }),
  play: async () => {
    await zoneMenu()
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: profileParameters({ column: 'main', viewport: true }),
  play: async () => {
    await zoneMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Its delivery methods are deleted with it/)
  },
}

// Read on settings, delivery methods and package types: no add button, and the zone can only be opened.
export const Viewer: Story = {
  parameters: profileParameters({ column: 'main', rules: deliveryViewerRules }),
  play: async () => {
    await screen.findByText('United States')
  },
}

// Writing delivery methods but reading settings: methods can be added, the zone not deleted.
export const MethodEditor: Story = {
  name: 'Method editor',
  parameters: profileParameters({ column: 'main', rules: deliveryEditorRules }),
  play: async () => {
    await screen.findAllByRole('button', { name: 'Add method' })
  },
}

type UnrestrictedStory = StoryObj<Meta<typeof UnrestrictedMethodsCard>>

// The card for methods offered wherever the profile reaches, always shown.
export const NoZoneRestriction: UnrestrictedStory = {
  name: 'No zone restriction, empty',
  render: (args) => <UnrestrictedMethodsCard {...args} />,
  args: { methods: [] },
  play: async () => {
    await screen.findByText('No zone restriction')
  },
}

/**
 * A carrier method quoting wherever the profile reaches, as EasyPost's gem
 * would price it. The browser-test server does not load the gem, so its
 * rate provider is missing from the list, and the price still reads as the
 * carrier's rather than free.
 */
export const NoZoneRestrictionCarrier: UnrestrictedStory = {
  name: 'No zone restriction, carrier method from its source',
  render: (args) => <UnrestrictedMethodsCard {...args} />,
  args: { methods: [carrierMethodFromSource] },
  play: async () => {
    await screen.findByText('Carrier rates')
  },
}
