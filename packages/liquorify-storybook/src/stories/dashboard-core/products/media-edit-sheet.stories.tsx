import type { Media, Product, Variant } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { MediaEditSheet } from '../../../../../dashboard-core/src/products/media-edit-sheet'
import { withStore } from '../../../decorators/store'
import { clayMug, clayMugWithVideos, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** One item of the product's gallery open for editing, as clicking its tile opens it. */
function EditMedia({
  product,
  media,
  index,
}: {
  product: Product
  media?: Media[]
  index: number
}) {
  return (
    <ProductFormFor product={product} media={media}>
      {(form) => (
        <MediaEditSheet
          form={form}
          mediaIndex={index}
          variants={(product.variants as Variant[] | undefined) ?? []}
          open
          onOpenChange={fn()}
        />
      )}
    </ProductFormFor>
  )
}

const sheet = (product: Product) => productParameters({ product, viewport: true })

const player = /^https:\/\/(www\.youtube\.com\/embed|player\.vimeo\.com\/video)\//

// The sheet embeds YouTube's or Vimeo's own player for a video link, which
// stories may not reach, so the player is the local stand-in the media
// preview's stories use. React sets an iframe's address with setAttribute.
function localVideoPlayers() {
  const setAttribute = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    const standIn = this instanceof HTMLIFrameElement && name === 'src' && player.test(value)
    setAttribute.call(this, name, standIn ? '/fixtures/video-embed.html' : value)
  }
  return () => {
    Element.prototype.setAttribute = setAttribute
  }
}

const meta = {
  title: 'Dashboard core/Product form/Media edit sheet',
  component: EditMedia,
  tags: ['CMP-CORE-PF-04'],
  args: { product: linenApron, index: 0 },
  decorators: [withStore],
  beforeEach: localVideoPlayers,
  parameters: sheet(linenApron),
} satisfies Meta<typeof EditMedia>

export default meta
type Story = StoryObj<typeof meta>

// An image of a product with variants, which it can be assigned to.
export const Image: Story = {
  play: async () => {
    await screen.findByDisplayValue('Linen apron in olive')
  },
}

// The sheet moves focus into itself as it opens, which scrolls its body back to
// the top, so the variant is picked only after that.
export const AssignedToVariant: Story = {
  name: 'Assigned to a variant',
  play: async () => {
    const sheet = await screen.findByRole('dialog')
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
    await userEvent.click(await screen.findByRole('button', { name: /Olive, Size: M/ }))
  },
}

// One variant only, so there is nothing to assign it to.
export const SingleVariantProduct: Story = {
  name: 'Product without variants',
  args: { product: clayMug },
  parameters: sheet(clayMug),
  play: async () => {
    await screen.findByDisplayValue('Clay mug, side view')
  },
}

export const UploadedVideo: Story = {
  name: 'Uploaded video',
  args: { product: clayMug, media: clayMugWithVideos, index: 2 },
  parameters: sheet(clayMug),
  play: async () => {
    await screen.findByText('Poster image')
  },
}

export const VideoLink: Story = {
  name: 'Video link',
  args: { product: clayMug, media: clayMugWithVideos, index: 3 },
  parameters: sheet(clayMug),
  play: async () => {
    await screen.findByDisplayValue(/youtube.com/)
  },
}

export const VideoLinkUnsupported: Story = {
  name: 'Video link, unsupported',
  args: { product: clayMug, media: clayMugWithVideos, index: 3 },
  parameters: sheet(clayMug),
  play: async () => {
    const link = await screen.findByDisplayValue(/youtube.com/)
    await userEvent.clear(link)
    await userEvent.type(link, 'https://example.com/glazing.mp4')
    await userEvent.tab()
    await screen.findByText('Enter a YouTube or Vimeo link.')
  },
}
