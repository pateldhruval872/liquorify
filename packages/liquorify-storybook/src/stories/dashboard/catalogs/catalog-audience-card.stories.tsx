import type { Catalog } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { CatalogAudienceCard } from '../../../../../dashboard/src/components/spree/catalog-audience'
import { withStore } from '../../../decorators/store'
import { cafeCatalog, springCatalog } from '../../../fixtures/admin/merchandising'
import { CatalogFormFor, catalogParameters } from './catalog-form'

interface Args {
  catalog: Catalog
  canEdit: boolean
}

/**
 * Who a catalog is for, on the catalog page's sidebar (DA-PRD-14): companies,
 * each covering its divisions, and customer groups, with a note that a
 * company's catalog wins over a group's. An audience is assigned from a
 * dialog and removed or restored in place, all saved with the page.
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Catalog audience card',
  tags: ['CMP-DA-G-24'],
  args: { catalog: cafeCatalog, canEdit: true },
  decorators: [withStore],
  parameters: catalogParameters(),
  render: ({ catalog, canEdit }) => (
    <CatalogFormFor catalog={catalog}>
      {(form) => <CatalogAudienceCard form={form} canEdit={canEdit} />}
    </CatalogFormFor>
  ),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

async function openAssign() {
  await userEvent.click(await screen.findByRole('button', { name: 'Assign' }))
  return screen.findByRole('dialog', { name: 'Assign this catalog' })
}

export const Assigned: Story = {
  play: async () => {
    await expect(await screen.findByRole('link', { name: 'Juniper Cafés' })).toBeVisible()
    await screen.findByText('Wholesale')
    await screen.findByText(/Company assignments win\./)
  },
}

export const NoAudience: Story = {
  name: 'No audience',
  args: { catalog: springCatalog },
  play: async () => {
    await screen.findByText('Not assigned to any audience yet — nobody sees this catalog.')
    await screen.findByRole('button', { name: 'Assign' })
  },
}

export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  args: { canEdit: false },
  play: async () => {
    await screen.findByText('Wholesale')
    await expect(screen.queryByRole('button', { name: 'Assign' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  },
}

export const Assigning: Story = {
  parameters: catalogParameters({ viewport: true }),
  play: async () => {
    const dialog = await openAssign()
    await userEvent.type(within(dialog).getByPlaceholderText('Search companies…'), 'west')
    await screen.findByRole('option', { name: /West Coast/ })
  },
}

export const DivisionAssigned: Story = {
  name: 'A division assigned',
  play: async () => {
    const dialog = await openAssign()
    await userEvent.type(within(dialog).getByPlaceholderText('Search companies…'), 'west')
    await userEvent.click(await screen.findByRole('option', { name: /West Coast/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await screen.findByRole('link', { name: 'West Coast' })
  },
}

export const AlreadyAssigned: Story = {
  name: 'Already assigned',
  parameters: catalogParameters({ viewport: true }),
  play: async () => {
    const dialog = await openAssign()
    await userEvent.click(within(dialog).getAllByRole('combobox')[0])
    await userEvent.click(await screen.findByRole('option', { name: 'Customer group' }))
    await userEvent.type(within(dialog).getByPlaceholderText('Search…'), 'whole')
    await userEvent.click(await screen.findByRole('option', { name: 'Wholesale' }))
    await within(dialog).findByText('That audience is already on this catalog.')
    await expect(within(dialog).getByRole('button', { name: 'Add' })).toBeDisabled()
  },
}

export const Removed: Story = {
  name: 'Removed, waiting for Save',
  play: async () => {
    const removes = await screen.findAllByRole('button', { name: 'Remove' })
    await userEvent.click(removes[1])
    // Named by its translation key: `admin.actions.restore` is in neither of
    // the dashboard's English files, so a screen reader hears the key.
    await screen.findByRole('button', { name: 'admin.actions.restore' })
    await waitFor(() =>
      expect(screen.queryByText(/Company assignments win\./)).not.toBeInTheDocument(),
    )
  },
}
