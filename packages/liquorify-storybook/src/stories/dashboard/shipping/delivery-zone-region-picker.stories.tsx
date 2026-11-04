import type { DeliveryZone } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { DeliveryZoneRegionPicker } from '../../../../../dashboard/src/components/spree/shipping/delivery-zone-region-picker'
import type { DeliveryZoneMemberValues } from '../../../../../dashboard/src/schemas/delivery-zone'
import { withStore } from '../../../decorators/store'
import { domesticZone, europeZone, westCoastZone } from '../../../fixtures/admin/delivery'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { profileParameters } from './profile-page'

/** A zone's members as the zone sheet hands them to the picker. */
function membersOf(zone: DeliveryZone): DeliveryZoneMemberValues[] {
  return (zone.members ?? []).map((member) => ({
    member_type: member.member_type as DeliveryZoneMemberValues['member_type'],
    country_code: member.country_code ?? '',
    state_code: member.state_code ?? '',
    postal_code_prefix: member.postal_code_prefix ?? '',
    postal_code_from: member.postal_code_from ?? '',
    postal_code_to: member.postal_code_to ?? '',
  }))
}

interface PickerProps {
  zone?: DeliveryZone
  siblingZones?: DeliveryZone[]
}

/** The picker in the zone sheet (DA-SET-17), at the sheet's width and in its smaller text. */
function ZoneRegions({ zone, siblingZones = [] }: PickerProps) {
  const [members, setMembers] = useState(() => (zone ? membersOf(zone) : []))
  return (
    <div className="w-[566px] text-sm">
      <DeliveryZoneRegionPicker value={members} onChange={setMembers} siblingZones={siblingZones} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Shipping/Delivery zone region picker',
  component: ZoneRegions,
  tags: ['CMP-DA-G-20'],
  decorators: [withStore],
  parameters: profileParameters(),
} satisfies Meta<typeof ZoneRegions>

export default meta
type Story = StoryObj<typeof meta>

// The countries of the store's markets, none chosen yet.
export const NewZone: Story = {
  name: 'New zone',
  play: async () => {
    await screen.findByLabelText('United States')
  },
}

export const CountryChosen: Story = {
  name: 'Country chosen',
  play: async () => {
    await userEvent.click(await screen.findByLabelText('Germany'))
  },
}

// Two states and a postal code prefix, with the country's states open.
export const States: Story = {
  args: { zone: westCoastZone },
  play: async () => {
    await userEvent.click(await screen.findByLabelText('Show states of United States'))
    await screen.findByLabelText('Texas')
  },
}

// Another zone of the profile serves the United States already, so it is locked here.
export const InAnotherZone: Story = {
  name: 'In another zone',
  args: { siblingZones: [domesticZone] },
  play: async () => {
    await screen.findByText('In another zone')
  },
}

// Members the zone holds in countries no market sells into keep their rows.
export const OutsideTheMarkets: Story = {
  name: 'Outside the markets',
  args: { zone: europeZone },
  play: async () => {
    await screen.findAllByText('Not in any market')
  },
}

export const NoMatch: Story = {
  name: 'No match',
  play: async () => {
    await userEvent.type(
      await screen.findByLabelText('Search countries and regions to ship to'),
      'Atlantis',
    )
    await screen.findByText('No countries match your search.')
  },
}

export const PostalCodeRules: Story = {
  name: 'Postal code rules',
  args: { zone: westCoastZone },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /Postal code rules/ }))
    await screen.findByDisplayValue('941')
  },
}

export const Loading: Story = {
  parameters: profileParameters({ first: readHeld('markets') }),
}
