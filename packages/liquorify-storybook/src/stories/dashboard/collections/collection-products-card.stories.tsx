import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen } from 'storybook/test'
import { CollectionProductsCard } from '../../../../../dashboard/src/components/spree/collections/collection-products-card'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { newArrivalProducts, newArrivals, summerEdit } from '../../../fixtures/admin/merchandising'
import { readOnly } from '../../../fixtures/admin/session'
import { membershipHeld } from '../../../mocks/handlers/admin/merchandising'
import { CollectionFormFor, collectionParameters } from './collection-form'

/**
 * A collection's products (DA-PRD-12): curated by hand like a category's,
 * or, for a collection whose rules choose them, listed to read only.
 */
const meta = {
  title: 'Admin dashboard/Collections/Collection products card',
  component: CollectionProductsCard,
  tags: ['CMP-DA-G-04'],
  args: { collectionId: summerEdit.id, automatic: false },
  decorators: [withStore, withToaster],
  parameters: collectionParameters({ collection: summerEdit }),
  render: (args) => (
    <CollectionFormFor collection={summerEdit}>
      {() => <CollectionProductsCard {...args} />}
    </CollectionFormFor>
  ),
} satisfies Meta<typeof CollectionProductsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Curated: Story = {
  play: async () => {
    await screen.findByText('Linen apron')
    await screen.findByRole('button', { name: 'Add products' })
  },
}

export const ChosenByRules: Story = {
  name: 'Chosen by rules',
  args: { collectionId: newArrivals.id, automatic: true },
  parameters: collectionParameters({ collection: newArrivals, members: newArrivalProducts }),
  play: async () => {
    await screen.findByText('Glazing guide')
    await screen.findByText('Members are set by the rules above and refresh automatically.')
    await expect(screen.queryByRole('button', { name: 'Remove from collection' })).toBeNull()
  },
}

export const NoRuleMatches: Story = {
  name: 'No products match the rules',
  args: { collectionId: newArrivals.id, automatic: true },
  parameters: collectionParameters({ collection: newArrivals, members: [] }),
  play: async () => {
    await screen.findByText('No products match the rules yet.')
  },
}

export const Empty: Story = {
  parameters: collectionParameters({ collection: summerEdit, members: [] }),
  play: async () => {
    await screen.findByText('No products in this collection yet.')
  },
}

export const Loading: Story = {
  parameters: collectionParameters({
    collection: summerEdit,
    handlers: { members: membershipHeld('collections') },
  }),
  play: async () => {
    await screen.findByText('Loading…')
  },
}

// Like the category card, it does not check the role itself.
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  parameters: collectionParameters({ collection: summerEdit, rules: readOnly }),
  play: async () => {
    await screen.findByText('Linen apron')
    await screen.findByRole('button', { name: 'Add products' })
  },
}
