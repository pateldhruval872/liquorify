import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { CatalogWizardDialog } from '../../../../../dashboard/src/components/spree/catalog-wizard-dialog'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { pickableProducts, springCatalog } from '../../../fixtures/admin/merchandising'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  audienceLists,
  catalogCreated,
  membershipRequests,
  searchList,
} from '../../../mocks/handlers/admin/merchandising'

/**
 * The wizard that starts a catalog from the catalogs list (DA-PRD-13): its
 * name and description, its audience, its products, its pricing and a review,
 * one step at a time. Nothing is created until the last step, the catalog
 * starts inactive, and closing with anything filled in asks first.
 */
const meta = {
  title: 'Admin dashboard/Catalogs/Catalog wizard dialog',
  component: CatalogWizardDialog,
  tags: ['CMP-DA-G-24'],
  args: { open: true, onOpenChange: fn(), onCreated: fn() },
  decorators: [withStore, withToaster],
  parameters: {
    ...storeParameters(),
    liquorify: {
      ...storeParameters().liquorify,
      capture: 'viewport',
      route: {
        pattern: '/$storeId/products/catalogs',
        path: `/${shellStore.id}/products/catalogs`,
      },
    },
    msw: {
      handlers: {
        ...storeParameters().msw.handlers,
        audience: audienceLists,
        products: [
          searchList('/api/v3/admin/products', pickableProducts, (product) => product.name ?? ''),
        ],
        created: catalogCreated,
        members: membershipRequests('catalogs', []),
      },
    },
  },
} satisfies Meta<typeof CatalogWizardDialog>

export default meta
type Story = StoryObj<typeof meta>

const wizard = () => screen.findByRole('dialog', { name: 'New catalog' })

/** Names the catalog and moves on through the given number of steps. */
async function stepsOn(count: number) {
  const dialog = await wizard()
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Café trade')
  for (let step = 0; step < count; step++) {
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
  }
  return dialog
}

export const Details: Story = {
  play: async () => {
    const dialog = await wizard()
    await within(dialog).findByText('Name this agreement so you recognise it later.')
    await expect(within(dialog).getByRole('button', { name: 'Back' })).toBeDisabled()
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  play: async () => {
    const dialog = await wizard()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
    await within(dialog).findByText('Fix the highlighted field before continuing.')
    await expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  },
}

export const NoAudience: Story = {
  name: 'Audience, none yet',
  play: async () => {
    const dialog = await stepsOn(1)
    await within(dialog).findByText(
      'No audience yet, so nobody sees this catalog. You can assign one now or later.',
    )
  },
}

export const AudienceAssigned: Story = {
  name: 'Audience, a company assigned',
  play: async () => {
    const dialog = await stepsOn(1)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Assign' }))
    await userEvent.type(within(dialog).getByPlaceholderText('Search companies…'), 'juniper')
    await userEvent.click(await screen.findByRole('option', { name: /Juniper Cafés/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await within(dialog).findByRole('link', { name: 'Juniper Cafés' })
  },
}

export const NoProducts: Story = {
  name: 'Products, none yet',
  play: async () => {
    const dialog = await stepsOn(2)
    await within(dialog).findByText(
      /^No products yet\. An empty catalog prices without hiding anything/,
    )
    await within(dialog).findByText('Clay mug')
  },
}

export const ProductsChosen: Story = {
  name: 'Products, two chosen',
  play: async () => {
    const dialog = await stepsOn(2)
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Add Clay mug' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Linen apron' }))
    await within(dialog).findByRole('button', { name: 'Remove Clay mug' })
    await expect(within(dialog).getByRole('button', { name: 'Add Clay mug' })).toBeDisabled()
  },
}

export const Pricing: Story = {
  play: async () => {
    const dialog = await stepsOn(3)
    await within(dialog).findByRole('combobox', { name: 'Pricing' })
  },
}

export const PricingPercentageMissing: Story = {
  name: 'Pricing, percentage missing',
  play: async () => {
    const dialog = await stepsOn(3)
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Pricing' }))
    await userEvent.click(
      await screen.findByRole('option', { name: 'A percentage off base prices' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
    await within(dialog).findByText('Enter a percentage.')
  },
}

export const Review: Story = {
  play: async () => {
    const dialog = await stepsOn(4)
    await within(dialog).findByText('Everyone')
    await within(dialog).findByText('Everything in the shop')
    await within(dialog).findByText(
      'The catalog is created inactive. Activate it from its page when the agreement is ready.',
    )
  },
}

export const Created: Story = {
  play: async ({ args }) => {
    const dialog = await stepsOn(4)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create catalog' }))
    await waitFor(() => expect(args.onCreated).toHaveBeenCalledWith(springCatalog.id))
    await expect(args.onOpenChange).toHaveBeenCalledWith(false)
  },
}

export const ClosingWithChanges: Story = {
  name: 'Closing with something filled in',
  play: async ({ args }) => {
    const dialog = await stepsOn(0)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    const confirm = await screen.findByRole('dialog', { name: 'Discard this draft?' })
    await within(confirm).findByText(
      'Everything you have filled in so far will be lost. This cannot be undone.',
    )
    await expect(args.onOpenChange).not.toHaveBeenCalled()
  },
}
