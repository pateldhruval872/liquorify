import type { Media, Product, Variant } from '@spree/admin-sdk'
import { MediaCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fireEvent, screen, userEvent } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, clayMugWithVideos, linenApron } from '../../../fixtures/admin/catalog'
import { productMediaList } from '../../../mocks/handlers/admin/catalog'
import { mediaList } from '../../../mocks/handlers/admin/settings'
import { ProductFormFor, productParameters } from './product-form'

/**
 * The product page's gallery. The page passes the product's saved variants,
 * which an image can be assigned to; the new product page passes neither.
 */
function Gallery({ product, media }: { product: Product | null; media?: Media[] }) {
  return (
    <ProductFormFor product={product} media={media}>
      {(form) => (
        <MediaCard
          productId={product?.id}
          variants={(product?.variants as Variant[] | undefined) ?? []}
          form={form}
        />
      )}
    </ProductFormFor>
  )
}

const gallery = (product: Product | null, viewport = false, media?: Media[]) =>
  productParameters({
    product,
    viewport,
    handlers: { library: mediaList(), ...(media && { media: productMediaList(media) }) },
  })

const meta = {
  title: 'Dashboard core/Product form/Media card',
  component: Gallery,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: gallery(clayMug),
} satisfies Meta<typeof Gallery>

export default meta
type Story = StoryObj<typeof meta>

const firstTile = () => screen.findByRole('button', { name: /Clay mug, side view/ })

export const Images: Story = {
  play: async () => {
    await firstTile()
  },
}

// A video with its poster, a YouTube link with its poster, and a video with no poster yet.
export const Videos: Story = {
  args: { media: clayMugWithVideos },
  parameters: gallery(clayMug, false, clayMugWithVideos),
  play: async () => {
    await firstTile()
  },
}

export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: gallery(null),
}

export const ContextMenu: Story = {
  name: 'Context menu',
  parameters: gallery(clayMug, true),
  play: async () => {
    fireEvent.contextMenu(await firstTile())
    await screen.findByRole('menuitem', { name: 'Download' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: gallery(clayMug, true),
  play: async () => {
    fireEvent.contextMenu(await firstTile())
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Delete this media? This cannot be undone.')
  },
}

// Clicking a tile opens its details; the edit sheet has stories of its own.
export const Editing: Story = {
  args: { product: linenApron },
  parameters: gallery(linenApron, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /Linen apron in olive/ }))
    await screen.findByText('Edit media')
  },
}

export const AddingVideoLink: Story = {
  name: 'Adding a video link',
  parameters: gallery(clayMug, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add video link' }))
    await screen.findByText('Add a video link')
  },
}

export const PickingFromLibrary: Story = {
  name: 'Picking from the library',
  parameters: gallery(clayMug, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add from library' }))
    await screen.findByRole('button', { name: /Slate cap/ })
  },
}
