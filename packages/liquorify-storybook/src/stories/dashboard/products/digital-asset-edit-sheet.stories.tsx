import type {
  DigitalAsset,
  DigitalAssetProviderSettingField,
  Product,
  Variant,
} from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, type HttpHandler, http } from 'msw'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { DigitalAssetEditSheet } from '../../../../../dashboard/src/components/spree/products/digital-asset-edit-sheet'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  apronFiles,
  digitalAssets,
  glazingGuide,
  linenApron,
  pooledAsset,
} from '../../../fixtures/admin/catalog'
import {
  digitalAssetRequests,
  notRegistered,
  pooledProvider,
} from '../../../mocks/handlers/admin/catalog'

interface Props {
  product: Product
  asset: DigitalAsset
  settingsSchema?: DigitalAssetProviderSettingField[]
}

/**
 * The sheet a file's Edit action opens on the Digital files card: the file's
 * own download and day limits, which show the store's when left blank, the
 * variant it comes with on a product that has several, and the settings of
 * a source other than an uploaded file.
 */
function EditSheet({ product, asset, settingsSchema }: Props) {
  const [open, setOpen] = useState(true)
  return (
    <DigitalAssetEditSheet
      productId={product.id}
      asset={asset}
      variants={(product.variants ?? []) as Variant[]}
      settingsSchema={settingsSchema}
      open={open}
      onOpenChange={setOpen}
    />
  )
}

/** The sheet over the page, with its save answered by `save` when given, ahead of the usual answer. */
const sheet = (save: HttpHandler[] = []) => {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: {
      handlers: { ...base.msw.handlers, digitalAssets: [...save, ...digitalAssetRequests()] },
    },
  }
}

const update = '/api/v3/admin/products/:productId/digital_assets/:id'

const meta = {
  title: 'Admin dashboard/Products/Digital asset edit sheet',
  component: EditSheet,
  tags: ['CMP-DA-G-14'],
  args: { product: glazingGuide, asset: digitalAssets[0] },
  decorators: [withStore],
  parameters: sheet(),
} satisfies Meta<typeof EditSheet>

export default meta
type Story = StoryObj<typeof meta>

export const StoreLimits: Story = {
  name: 'The store’s limits',
  play: async () => {
    await expect(await screen.findByLabelText('Downloads allowed')).toHaveAttribute(
      'placeholder',
      '5',
    )
  },
}

export const OwnLimits: Story = {
  name: 'Limits of its own',
  args: { asset: digitalAssets[1] },
  play: async () => {
    await expect(await screen.findByLabelText('Days available')).toHaveValue(14)
  },
}

export const InvalidLimit: Story = {
  name: 'A limit below one',
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Downloads allowed'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Limits must be whole numbers of 1 or more, or blank.')
  },
}

export const Saving: Story = {
  parameters: sheet([
    http.patch(update, async () => {
      await delay('infinite')
    }),
  ]),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Days available'), '30')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

// On a product with variants the file names the one it comes with. The care
// guide is on the product's master, which none of the choices is.
export const WithVariants: Story = {
  name: 'On a product with variants',
  args: { product: linenApron, asset: apronFiles[1] },
  play: async () => {
    await screen.findByText('Color: Olive, Size: M')
  },
}

export const OnMaster: Story = {
  name: 'On the master variant',
  args: { product: linenApron, asset: apronFiles[0] },
  play: async () => {
    await screen.findByText('All variants')
  },
}

export const ChoosingVariant: Story = {
  name: 'Choosing a variant',
  args: { product: linenApron, asset: apronFiles[1] },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Color: Slate, Size: L' })
  },
}

// A key from the pool source Spree's own specs register: the sheet is titled
// with the source, and shows its one setting above the limits.
export const FromAnotherSource: Story = {
  name: 'From another source',
  args: { asset: pooledAsset, settingsSchema: pooledProvider.settings_schema },
  play: async () => {
    await expect(await screen.findByLabelText('pool_name')).toHaveValue('glazing-course-keys')
  },
}

// Spree refuses the save when the source's extension has been removed since
// the key was added. The sheet stays open with what was entered.
export const Refused: Story = {
  name: 'Refused by Spree',
  args: { asset: pooledAsset, settingsSchema: pooledProvider.settings_schema },
  parameters: sheet([http.patch(update, notRegistered)]),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Downloads allowed'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Provider type is not a registered provider')
  },
}
