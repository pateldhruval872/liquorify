import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { ResourceImageField } from '../../../../../dashboard/src/components/spree/resource-image-field'
import { withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { kitchenWithImages } from '../../../fixtures/admin/merchandising'
import { uploadAccepted, uploadHeld } from '../../../mocks/handlers/admin/files'
import { type CategoryForm, CategoryFormFor, categoryParameters } from '../categories/category-form'

/**
 * One image of a record that carries images, such as a category's banner and
 * square image (DA-PRD-08): uploaded from the computer or chosen from the
 * media library, and replaced or removed, all held until the page's Save.
 */
function ImageField({
  saved = false,
  square = false,
  children,
}: {
  saved?: boolean
  square?: boolean
  children?: (form: CategoryForm) => React.ReactNode
}) {
  const category = saved ? kitchenWithImages : undefined
  return (
    <CategoryFormFor category={category}>
      {(form) => (
        <>
          <ResourceImageField
            form={form}
            kind={square ? 'square_image' : 'image'}
            serverUrl={(square ? category?.square_image_url : category?.image_url) ?? null}
            square={square}
            translationNamespace="admin.categories"
          />
          {children?.(form)}
        </>
      )}
    </CategoryFormFor>
  )
}

/** What the page's Save would send for the image, shown under the field. */
function Pending({ form }: { form: CategoryForm }) {
  const signedId = form.watch('image_signed_id')
  const cleared = form.watch('image_cleared')
  return (
    <p className="text-muted-foreground text-xs">
      {signedId ? 'Replaced on save' : cleared ? 'Removed on save' : 'Unchanged'}
    </p>
  )
}

const meta = {
  title: 'Admin dashboard/Images/Resource image field',
  tags: ['CMP-DA-G-24'],
  decorators: [withStore, withToaster],
  parameters: categoryParameters({
    category: kitchenWithImages,
    column: 'inSidebarCard',
    handlers: { upload: uploadAccepted },
  }),
  render: () => <ImageField>{(form) => <Pending form={form} />}</ImageField>,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async () => {
    await screen.findByText('Upload image')
    await screen.findByRole('button', { name: 'Choose from library' })
  },
}

export const Saved: Story = {
  render: () => <ImageField saved>{(form) => <Pending form={form} />}</ImageField>,
}

export const SquareSaved: Story = {
  name: 'Square, saved',
  render: () => <ImageField saved square />,
}

export const Removed: Story = {
  render: () => <ImageField saved>{(form) => <Pending form={form} />}</ImageField>,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText('Removed on save')
  },
}

export const Uploading: Story = {
  parameters: categoryParameters({
    category: kitchenWithImages,
    column: 'inSidebarCard',
    handlers: { upload: uploadHeld },
  }),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('The field has no file input')
    await userEvent.upload(input, new File(['banner'], 'kitchen-banner.png', { type: 'image/png' }))
    await screen.findByText('Uploading…')
  },
}

export const Uploaded: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('The field has no file input')
    await userEvent.upload(input, new File(['banner'], 'kitchen-banner.png', { type: 'image/png' }))
    await screen.findByText('Replaced on save')
  },
}

export const ChoosingFromLibrary: Story = {
  name: 'Choosing from the library',
  parameters: categoryParameters({
    category: kitchenWithImages,
    column: 'inSidebarCard',
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Choose from library' }))
    await screen.findByRole('button', { name: /Clay mug/ })
  },
}

// Choosing a library image uses that file, without uploading a copy.
export const ChosenFromLibrary: Story = {
  name: 'Chosen from the library',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Choose from library' }))
    await userEvent.click(await screen.findByRole('button', { name: /Clay mug/ }))
    await screen.findByText('Replaced on save')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  },
}
