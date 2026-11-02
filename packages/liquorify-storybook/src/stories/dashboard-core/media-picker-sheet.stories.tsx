import type { Media } from '@spree/admin-sdk'
import { MediaPickerSheet } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { mediaLibrary } from '../../fixtures/admin/settings'

const nothing = () => {}

/** Searches the library by file name, as the dashboard's callers ask the API to. */
function searchLibrary(records: Media[]) {
  return async (query: string) => ({
    data: records.filter((record) => record.filename?.toLowerCase().includes(query.toLowerCase())),
  })
}

const meta = {
  title: 'Dashboard core/Media picker sheet',
  component: MediaPickerSheet<Media>,
  tags: ['CMP-CORE-16'],
  args: {
    open: true,
    onOpenChange: nothing,
    onConfirm: nothing,
    queryKey: 'story-media',
    search: searchLibrary(mediaLibrary),
  },
  // The sheet renders outside the story's root, against the window's edge.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof MediaPickerSheet<Media>>

export default meta
type Story = StoryObj<typeof meta>

const tiles = () => screen.findByRole('button', { name: /Clay mug/ })

export const Library: Story = {
  play: async () => {
    await tiles()
  },
}

export const TwoPicked: Story = {
  name: 'Two picked',
  play: async () => {
    await userEvent.click(await tiles())
    await userEvent.click(screen.getByRole('button', { name: /Slate cap/ }))
    await screen.findByText('2 selected')
  },
}

export const Searched: Story = {
  play: async () => {
    await tiles()
    await userEvent.type(screen.getByPlaceholderText('Search by name…'), 'banner')
    await waitFor(() => expect(screen.queryByRole('button', { name: /Clay mug/ })).toBeNull())
  },
}

export const NothingMatches: Story = {
  name: 'Nothing matches',
  play: async () => {
    await tiles()
    await userEvent.type(screen.getByPlaceholderText('Search by name…'), 'invoice')
    await screen.findByText('No files match your search.')
  },
}

export const EmptyLibrary: Story = {
  name: 'Empty library',
  args: { queryKey: 'story-media-empty', search: searchLibrary([]) },
  play: async () => {
    await screen.findByText('Your library is empty. Upload a file to get started.')
  },
}

export const Loading: Story = {
  args: { queryKey: 'story-media-loading', search: () => new Promise(() => {}) },
}

// One image for a policy's text: picking a tile confirms it, so there is no footer.
export const OneFile: Story = {
  name: 'One file, with upload',
  args: { multiple: false, onUpload: async () => mediaLibrary[0] },
  play: async () => {
    await tiles()
  },
}
