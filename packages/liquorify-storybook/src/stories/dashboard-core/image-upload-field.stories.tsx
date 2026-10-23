import { EMPTY_FILE_UPLOAD_VALUE, ImageUploadField } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http } from 'msw'
import { fn, screen, userEvent } from 'storybook/test'

const meta = {
  title: 'Dashboard core/Image upload field',
  component: ImageUploadField,
  tags: ['CMP-CORE-11'],
  // The photo field of the profile dialog (DA-OVL-04), and the image fields of
  // the record forms.
  args: {
    value: EMPTY_FILE_UPLOAD_VALUE,
    onChange: fn(),
    square: true,
    label: 'Photo',
    help: 'Shown next to your name across the admin. Square images look best.',
  },
  decorators: [
    (Story) => (
      <div className="w-[28rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImageUploadField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// The image already saved on the record.
export const Saved: Story = { args: { serverUrl: '/fixtures/avatar.png' } }

// A logo or banner keeps a wide preview.
export const Wide: Story = { args: { square: false, serverUrl: '/fixtures/product-sand.png' } }

// Picked and uploaded, waiting for the form to save.
export const JustUploaded: Story = {
  name: 'Just uploaded',
  args: {
    value: {
      signedId: 'story-signed-id',
      previewUrl: '/fixtures/avatar.png',
      cleared: false,
      filename: 'jordan-lee.png',
      byteSize: 48213,
    },
  },
}

// The upload never answers here, so the field stays busy.
export const Uploading: Story = {
  parameters: {
    msw: {
      handlers: {
        upload: [
          http.post('/api/v3/admin/files', async () => {
            await delay('infinite')
          }),
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('The field has no file input')
    await userEvent.upload(input, new File(['photo'], 'jordan-lee.png', { type: 'image/png' }))
    await screen.findByText('Uploading…')
  },
}

export const Disabled: Story = { args: { serverUrl: '/fixtures/avatar.png', disabled: true } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
