import type { DigitalAsset, DigitalAssetProvider, Product, Variant } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { DigitalAssetsCard } from '../../../../../dashboard/src/components/spree/products/digital-assets-card'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import {
  apronFiles,
  digitalAssets,
  glazingGuide,
  linenApron,
  pooledAsset,
} from '../../../fixtures/admin/catalog'
import {
  digitalAssetRequests,
  digitalAssetsHeld,
  fileProvider,
  pooledProvider,
} from '../../../mocks/handlers/admin/catalog'
import { storageRefused, uploadAccepted, uploadHeld } from '../../../mocks/handlers/admin/files'
import { productParameters } from '../../dashboard-core/products/product-form'

/**
 * The Digital files card on a saved product's page (DA-PRD-03): what buyers
 * download after purchase, each with its download and day limits, blank limits
 * reading the store's own, 5 downloads and 7 days. Files are uploaded to
 * private storage and attached at once.
 */
function DigitalFiles({ product }: { product: Product }) {
  return (
    <DigitalAssetsCard productId={product.id} variants={(product.variants ?? []) as Variant[]} />
  )
}

const card = ({
  product = glazingGuide,
  files = digitalAssets,
  providers = [fileProvider],
  viewport = false,
  handlers = {},
}: {
  product?: Product
  files?: DigitalAsset[]
  providers?: DigitalAssetProvider[]
  viewport?: boolean
  handlers?: Record<string, unknown>
} = {}) =>
  productParameters({
    product,
    viewport,
    handlers: {
      digitalAssets: digitalAssetRequests(files, providers),
      upload: uploadAccepted,
      ...handlers,
    },
  })

const fileInput = (canvas: HTMLElement) =>
  canvas.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement

const firingSchedule = () =>
  new File([new Uint8Array(312_000)], 'firing-schedule.pdf', { type: 'application/pdf' })

const openActions = async (filename: string) => {
  const row = (await screen.findByText(filename)).closest('tr') as HTMLElement
  await userEvent.click(within(row).getByRole('button', { name: 'Open actions' }))
  return screen.findByRole('menu')
}

const meta = {
  title: 'Admin dashboard/Products/Digital assets card',
  component: DigitalFiles,
  tags: ['CMP-DA-G-14'],
  args: { product: glazingGuide },
  decorators: [withStore, withToaster],
  parameters: card(),
} satisfies Meta<typeof DigitalFiles>

export default meta
type Story = StoryObj<typeof meta>

export const Files: Story = {
  play: async () => {
    await screen.findByText('glaze-recipes.zip')
    await screen.findByText('5 (store default)')
  },
}

export const Loading: Story = {
  parameters: card({ handlers: { digitalAssets: digitalAssetsHeld } }),
}

export const NoFiles: Story = {
  name: 'No files',
  parameters: card({ files: [] }),
  play: async () => {
    await screen.findByText('Drag & drop files here, or click to browse')
  },
}

export const Uploading: Story = {
  parameters: card({ files: [], handlers: { upload: uploadHeld } }),
  play: async ({ canvasElement }) => {
    await screen.findByText('Drag & drop files here, or click to browse')
    await userEvent.upload(fileInput(canvasElement), firingSchedule())
    await screen.findByText('Uploading…')
  },
}

export const FileAdded: Story = {
  name: 'A file added',
  play: async ({ canvasElement }) => {
    await screen.findByText('glaze-recipes.zip')
    await userEvent.upload(fileInput(canvasElement), firingSchedule())
    await screen.findByText('firing-schedule.pdf')
  },
}

export const UploadRefused: Story = {
  name: 'Upload refused by storage',
  parameters: card({ viewport: true, handlers: { upload: storageRefused } }),
  play: async ({ canvasElement }) => {
    await screen.findByText('glaze-recipes.zip')
    await userEvent.upload(fileInput(canvasElement), firingSchedule())
    await screen.findByText(/^Failed to upload firing-schedule\.pdf/)
  },
}

// With a source that needs no file, such as the key pool Spree's own specs
// register, the header offers a menu instead of the upload button. A key from
// the pool has no file name, size or link.
export const AnotherSource: Story = {
  name: 'Another source to add from',
  parameters: card({
    files: [...digitalAssets, pooledAsset],
    providers: [fileProvider, pooledProvider],
    viewport: true,
  }),
  play: async () => {
    await screen.findByText('Untitled file')
    await userEvent.click(screen.getByRole('button', { name: /^Add/ }))
    await screen.findByRole('menuitem', { name: 'Stub' })
  },
}

export const RowActions: Story = {
  name: 'A file’s actions',
  parameters: card({ viewport: true }),
  play: async () => {
    const menu = await openActions('glazing-guide.pdf')
    await within(menu).findByRole('menuitem', { name: 'Download' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: card({ viewport: true }),
  play: async () => {
    const menu = await openActions('glazing-guide.pdf')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Delete this file?')
  },
}

export const Deleted: Story = {
  play: async () => {
    const menu = await openActions('glazing-guide.pdf')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.queryByText('glazing-guide.pdf')).toBeNull())
    await screen.findByText('glaze-recipes.zip')
  },
}

// On a product with variants each file names the variant it comes with; the
// care guide sits on the product's master, which is none of them.
export const WithVariants: Story = {
  name: 'On a product with variants',
  args: { product: linenApron },
  parameters: card({ product: linenApron, files: apronFiles }),
  play: async () => {
    await screen.findByText('Color: Olive, Size: M')
  },
}

export const EditSheet: Story = {
  name: 'Editing a file',
  parameters: card({ viewport: true }),
  play: async () => {
    const menu = await openActions('glaze-recipes.zip')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }))
    await screen.findByLabelText('Downloads allowed')
  },
}
