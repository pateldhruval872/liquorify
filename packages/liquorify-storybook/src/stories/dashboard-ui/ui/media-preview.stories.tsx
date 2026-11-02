import { MediaPreview } from '@spree/dashboard-ui/ui/media-preview'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'

/**
 * A file's preview in the media library's sheet (DA-PRD-04) and the product
 * page's media sheet (DA-PRD-02, DA-PRD-03), at those sheets' width and text.
 * The video files and the provider's
 * player are invented stand-ins served by Storybook, so no story reaches the
 * network.
 */
const meta = {
  title: 'Dashboard UI/Primitives/Media preview',
  component: MediaPreview,
  tags: ['CMP-DUI-P-28'],
  args: { alt: 'Clay mug, side view' },
  decorators: [
    (Story) => (
      <div className="w-[566px] text-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MediaPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Image: Story = {
  args: { mediaType: 'image', previewUrl: '/fixtures/product-clay.png' },
}

// On the product's media sheet a click sets the focal point, drawn as a ring.
export const FocalPoint: Story = {
  name: 'Focal point',
  args: {
    mediaType: 'image',
    previewUrl: '/fixtures/product-clay.png',
    focalPoint: { x: 0.35, y: 0.4 },
    onFocalPointClick: fn(),
  },
}

export const UploadedVideo: Story = {
  name: 'Uploaded video',
  args: {
    mediaType: 'video',
    previewUrl: '/fixtures/product-clay.png',
    videoUrl: '/fixtures/video-clay.webm',
  },
  // The player shows a spinner until it has loaded the file.
  play: async ({ canvasElement }) => {
    const video = canvasElement.querySelector('video') as HTMLVideoElement
    await waitFor(() => expect(video.readyState).toBe(4))
  },
}

export const ExternalVideo: Story = {
  name: 'External video',
  args: { mediaType: 'external_video', embedUrl: '/fixtures/video-embed.html' },
}

// A video with no poster has no still, so the frame says which kind of file it is.
export const VideoWithoutPoster: Story = {
  name: 'Video without poster',
  args: { mediaType: 'video' },
}

export const ImageNotYetLoaded: Story = {
  name: 'Image not yet loaded',
  args: { mediaType: 'image' },
}
