import type { Product } from '@spree/admin-sdk'
import { SEOCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, slateCap } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters, validationError } from './product-form'

/** The search listing preview and its fields, at the foot of the product page's sidebar. */
function Seo({ product, slugTaken }: { product: Product | null; slugTaken?: boolean }) {
  return (
    <ProductFormFor
      product={product}
      serverError={
        slugTaken
          ? validationError({ slug: { code: 'taken', message: 'has already been taken' } })
          : undefined
      }
    >
      {(form) => <SEOCard form={form} product={product ?? undefined} />}
    </ProductFormFor>
  )
}

const sidebar = (product: Product | null = clayMug) =>
  productParameters({ product, column: 'sidebar' })

const meta = {
  title: 'Dashboard core/Product form/SEO card',
  component: Seo,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: sidebar(),
} satisfies Meta<typeof Seo>

export default meta
type Story = StoryObj<typeof meta>

// A search title and description of the product's own.
export const Filled: Story = {}

// No search title or description: the preview falls back to the product's name.
export const NameOnly: Story = {
  name: 'Name only',
  args: { product: slateCap },
  parameters: sidebar(slateCap),
}

export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: sidebar(null),
}

export const Typing: Story = {
  args: { product: slateCap },
  parameters: sidebar(slateCap),
  play: async () => {
    await userEvent.type(
      await screen.findByLabelText('Meta description'),
      'A cotton cap in slate grey, with an adjustable strap.',
    )
  },
}

// Another product already has this address, so Spree refuses the save.
export const SlugTaken: Story = {
  name: 'Slug taken',
  args: { slugTaken: true },
  play: async () => {
    await screen.findByText(/already been taken/)
  },
}
