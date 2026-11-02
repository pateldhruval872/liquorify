import {
  EMPTY_FILE_UPLOAD_VALUE,
  FileUploadField,
  type FileUploadValue,
} from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { withToaster } from '../../decorators/toaster'
import { storageRefused, uploadAccepted } from '../../mocks/handlers/admin/files'

/**
 * The poster field on a video in the media library (DA-PRD-04), built the
 * way the image field builds it: a wide preview, and PNG, JPEG or WebP only.
 * Picking or dropping a file uploads it at once. The field's busy, disabled
 * and keyboard-focus states are the image field's stories (CMP-CORE-11).
 */
function PosterField({ serverUrl }: { serverUrl?: string | null }) {
  const [value, setValue] = useState<FileUploadValue>(EMPTY_FILE_UPLOAD_VALUE)
  return (
    <FileUploadField
      variant="image"
      value={value}
      onChange={setValue}
      accept="image/png,image/jpeg,image/webp"
      serverUrl={serverUrl}
      label="Poster image"
      help="The still shown before the video plays. Leave blank to use the provider’s own image where there is one."
      dropLabel="Drop an image here, or click to browse"
      browseLabel="Upload image"
      mediaClassName="h-16 w-28"
    />
  )
}

const fileInput = (canvas: HTMLElement) =>
  canvas.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement

const meta = {
  title: 'Dashboard core/File upload field',
  component: PosterField,
  tags: ['CMP-CORE-10'],
  parameters: { liquorify: { column: 'sidebar' }, msw: { handlers: { upload: uploadAccepted } } },
} satisfies Meta<typeof PosterField>

export default meta
type Story = StoryObj<typeof meta>

export const NoPoster: Story = {
  name: 'No poster',
}

export const Saved: Story = {
  name: 'Poster saved',
  args: { serverUrl: '/fixtures/product-clay.png' },
}

export const Uploaded: Story = {
  name: 'Just uploaded',
  play: async ({ canvasElement }) => {
    const picture = await (await fetch('/fixtures/product-clay.png')).blob()
    await userEvent.upload(
      fileInput(canvasElement),
      new File([picture], 'clay-mug-poster.png', { type: 'image/png' }),
    )
    await screen.findByText('clay-mug-poster.png')
  },
}

export const Removed: Story = {
  name: 'Poster removed',
  args: { serverUrl: '/fixtures/product-clay.png' },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await expect(screen.queryByRole('img')).toBeNull()
  },
}

export const WrongFileType: Story = {
  name: 'Wrong file type',
  decorators: [withToaster],
  parameters: { liquorify: { column: 'sidebar', capture: 'viewport' } },
  play: async ({ canvasElement }) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File(['GIF89a'], 'clay-mug.gif', { type: 'image/gif' }))
    const zone = fileInput(canvasElement).closest('label') as HTMLElement
    zone.dispatchEvent(
      new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
    )
    await screen.findByText(/This file type is not accepted/)
  },
}

export const UploadFailed: Story = {
  name: 'Upload refused by storage',
  decorators: [withToaster],
  parameters: {
    liquorify: { column: 'sidebar', capture: 'viewport' },
    msw: { handlers: { upload: storageRefused } },
  },
  play: async ({ canvasElement }) => {
    await userEvent.upload(
      fileInput(canvasElement),
      new File([new Uint8Array(48213)], 'clay-mug-poster.png', { type: 'image/png' }),
    )
    await screen.findByText(/Upload failed/)
  },
}
