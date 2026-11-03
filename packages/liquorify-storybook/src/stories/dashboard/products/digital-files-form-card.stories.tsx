import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { DigitalFilesFormCard } from '../../../../../dashboard/src/components/spree/products/digital-files-form-card'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { storageRefused, uploadAccepted, uploadHeld } from '../../../mocks/handlers/admin/files'
import { ProductFormFor, productParameters } from '../../dashboard-core/products/product-form'

/**
 * The Digital files card on the new product page (DA-PRD-02). The product does
 * not exist yet, so each file is uploaded to private storage and held in the
 * form, and the files are attached when the product is saved.
 */
function NewProductFiles() {
  return (
    <ProductFormFor product={null}>{(form) => <DigitalFilesFormCard form={form} />}</ProductFormFor>
  )
}

const newProduct = (upload: HttpHandler[] = uploadAccepted, viewport = false) =>
  productParameters({ product: null, viewport, handlers: { upload } })

const fileInput = (canvas: HTMLElement) =>
  canvas.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement

const guide = () =>
  new File([new Uint8Array(2_480_000)], 'glazing-guide.pdf', { type: 'application/pdf' })
const recipes = () =>
  new File([new Uint8Array(14_200_000)], 'glaze-recipes.zip', { type: 'application/zip' })

const meta = {
  title: 'Admin dashboard/Products/Digital files form card',
  component: NewProductFiles,
  tags: ['CMP-DA-G-14'],
  decorators: [withStore, withToaster],
  parameters: newProduct(),
} satisfies Meta<typeof NewProductFiles>

export default meta
type Story = StoryObj<typeof meta>

export const NoFiles: Story = {
  name: 'No files',
}

export const Uploading: Story = {
  parameters: newProduct(uploadHeld),
  play: async ({ canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), guide())
    await screen.findByText('Uploading…')
  },
}

export const Staged: Story = {
  name: 'Files held for saving',
  play: async ({ canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), [guide(), recipes()])
    await screen.findByText('glaze-recipes.zip')
    await waitFor(() => expect(screen.queryByText('Uploading…')).toBeNull(), { timeout: 15_000 })
  },
}

export const RemoveConfirmation: Story = {
  name: 'Remove confirmation',
  parameters: newProduct(uploadAccepted, true),
  play: async ({ canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), guide())
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText('Delete this file?')
  },
}

export const UploadRefused: Story = {
  name: 'Upload refused by storage',
  parameters: newProduct(storageRefused, true),
  play: async ({ canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), guide())
    await screen.findByText(/^Failed to upload glazing-guide\.pdf/)
  },
}
