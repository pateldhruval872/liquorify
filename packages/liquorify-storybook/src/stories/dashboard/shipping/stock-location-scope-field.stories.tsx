import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { StockLocationScopeField } from '../../../../../dashboard/src/components/spree/shipping/stock-location-scope-field'
import { stockLocations } from '../../../fixtures/admin/settings'

interface ScopeProps {
  scope?: 'all' | 'selected'
  selectedIds?: string[]
  locations?: { id: string; name: string }[]
}

/**
 * A channel's fulfilment locations (DA-SET-08), in the sheet's smaller text:
 * every location, or the ones ticked. Choosing "All locations" sends an empty list, so a location added
 * later is included.
 */
function FulfillmentLocations({
  scope: initialScope = 'all',
  selectedIds: initialIds = [],
  locations = stockLocations,
}: ScopeProps) {
  const [scope, setScope] = useState(initialScope)
  const [selectedIds, setSelectedIds] = useState(initialIds)

  return (
    <div className="flex w-96 flex-col gap-3 text-sm">
      <StockLocationScopeField
        idPrefix="channel-locations"
        scope={scope}
        onScopeChange={(next) => {
          setScope(next)
          if (next === 'all') setSelectedIds([])
        }}
        locations={locations}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        allLabel="All locations"
        selectedLabel="Selected locations"
        emptyLabel="No locations yet — add one under Settings → Locations."
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Shipping/Stock location scope field',
  component: FulfillmentLocations,
  tags: ['CMP-DA-G-20'],
} satisfies Meta<typeof FulfillmentLocations>

export default meta
type Story = StoryObj<typeof meta>

export const AllLocations: Story = { name: 'All locations' }

export const SomeChosen: Story = {
  name: 'Some chosen',
  args: { scope: 'selected', selectedIds: [stockLocations[0].id, stockLocations[2].id] },
}

export const NoneChosen: Story = { name: 'None chosen yet', args: { scope: 'selected' } }

export const NoLocations: Story = {
  name: 'No locations',
  args: { scope: 'selected', locations: [] },
}
