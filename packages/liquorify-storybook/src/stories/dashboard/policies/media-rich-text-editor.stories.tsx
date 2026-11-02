import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { MediaRichTextEditor } from '../../../../../dashboard/src/components/spree/media-rich-text-editor'
import { adminUser } from '../../../fixtures/admin/session'
import { returnsPolicy } from '../../../fixtures/admin/settings'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { mediaHeld, mediaList } from '../../../mocks/handlers/admin/settings'

/** A policy's content field (DA-SET-06), at the width and text size of the policy sheet's form. */
function PolicyContent({ value = '' }: { value?: string }) {
  const [html, setHtml] = useState(value)
  return (
    <div className="w-[826px] text-sm">
      <MediaRichTextEditor id="policy-body" ariaLabel="Content" value={html} onChange={setHtml} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Policies/Media rich text editor',
  component: PolicyContent,
  tags: ['CMP-DA-G-24'],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), media: mediaList() } },
  },
} satisfies Meta<typeof PolicyContent>

export default meta
type Story = StoryObj<typeof meta>

const pickImage = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Image' }))
  await screen.findByRole('heading', { name: 'Media library' })
}

// The four policies Spree seeds start with no content.
export const Empty: Story = {}

export const Written: Story = { args: { value: returnsPolicy.body ?? '' } }

// The image button opens the store's media library, one picture at a time.
export const PickingAnImage: Story = {
  name: 'Picking an image',
  args: { value: returnsPolicy.body ?? '' },
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await pickImage()
    await screen.findByRole('button', { name: /Clay mug/ })
  },
}

export const LibraryLoading: Story = {
  name: 'Library loading',
  parameters: { liquorify: { capture: 'viewport' }, msw: { handlers: { media: mediaHeld } } },
  play: pickImage,
}

// Picking a picture places it in the text and closes the library.
export const ImagePlaced: Story = {
  name: 'Image placed',
  args: { value: returnsPolicy.body ?? '' },
  play: async () => {
    await pickImage()
    await userEvent.click(await screen.findByRole('button', { name: /Clay mug/ }))
    await waitFor(() => expect(screen.getByRole('img', { name: 'Clay mug' })).toBeVisible())
  },
}
