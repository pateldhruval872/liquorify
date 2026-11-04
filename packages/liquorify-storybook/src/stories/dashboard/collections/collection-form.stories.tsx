import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import {
  CollectionMain,
  CollectionSidebar,
} from '../../../../../dashboard/src/components/spree/collections/collection-form'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { newArrivalProducts, newArrivals, summerEdit } from '../../../fixtures/admin/merchandising'
import { CollectionFormFor, collectionParameters } from './collection-form'

/**
 * The collection page (DA-PRD-11 and DA-PRD-12): its main column, with the
 * name and description, how its products are chosen and, once it exists, its
 * products, custom fields, translations and metadata; and its sidebar, with
 * the two images, the storefront's default sorting and the search listing.
 */
const meta = {
  title: 'Admin dashboard/Collections/Collection form',
  tags: ['CMP-DA-G-04'],
  decorators: [withStore, withToaster],
  parameters: collectionParameters({ collection: summerEdit }),
  render: () => (
    <CollectionFormFor collection={summerEdit}>
      {(form) => <CollectionMain form={form} collection={summerEdit} />}
    </CollectionFormFor>
  ),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Curated: Story = {
  play: async () => {
    await screen.findByText('Linen apron')
    await screen.findByText('Season')
  },
}

// Rules choose the products, so the list can only be read.
export const ChosenByRules: Story = {
  name: 'Chosen by rules',
  parameters: collectionParameters({ collection: newArrivals, members: newArrivalProducts }),
  render: () => (
    <CollectionFormFor collection={newArrivals}>
      {(form) => <CollectionMain form={form} collection={newArrivals} />}
    </CollectionFormFor>
  ),
  play: async () => {
    await screen.findByText('Sand tote')
    await screen.findByText('Members are set by the rules above and refresh automatically.')
    await expect(screen.queryByRole('button', { name: 'Add products' })).toBeNull()
  },
}

// Turning rules on takes the hand-curation controls away at once, before Save.
export const SwitchingToRules: Story = {
  name: 'Switching to rules',
  play: async () => {
    await screen.findByText('Linen apron')
    await userEvent.click(
      screen.getByRole('switch', { name: 'Set members automatically from rules' }),
    )
    await screen.findByText('Members are set by the rules above and refresh automatically.')
    await expect(screen.queryByRole('button', { name: 'Add products' })).toBeNull()
  },
}

export const NewCollection: Story = {
  name: 'New collection',
  parameters: collectionParameters(),
  render: () => <CollectionFormFor>{(form) => <CollectionMain form={form} />}</CollectionFormFor>,
  play: async () => {
    await screen.findByText('Membership')
    await expect(screen.queryByText('Products')).toBeNull()
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  parameters: collectionParameters(),
  render: () => (
    <CollectionFormFor validate>{(form) => <CollectionMain form={form} />}</CollectionFormFor>
  ),
  play: async () => {
    await expect(await screen.findByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Sidebar: Story = {
  parameters: collectionParameters({ collection: summerEdit, column: 'sidebar' }),
  render: () => (
    <CollectionFormFor collection={summerEdit}>
      {(form) => <CollectionSidebar form={form} collection={summerEdit} />}
    </CollectionFormFor>
  ),
  play: async () => {
    await screen.findByText('The summer edit')
    await screen.findByText('Manual')
  },
}

export const SidebarNew: Story = {
  name: 'Sidebar, new collection',
  parameters: collectionParameters({ column: 'sidebar' }),
  render: () => (
    <CollectionFormFor>{(form) => <CollectionSidebar form={form} />}</CollectionFormFor>
  ),
  play: async () => {
    await screen.findByText('example.com/c/collection-slug')
  },
}

export const ChoosingSorting: Story = {
  name: 'Choosing the default sorting',
  parameters: collectionParameters({ collection: newArrivals, column: 'sidebar', viewport: true }),
  render: () => (
    <CollectionFormFor collection={newArrivals}>
      {(form) => <CollectionSidebar form={form} collection={newArrivals} />}
    </CollectionFormFor>
  ),
  play: async () => {
    await userEvent.click(await screen.findByText('Date: newest first'))
    await screen.findByRole('option', { name: 'Best selling' })
  },
}
