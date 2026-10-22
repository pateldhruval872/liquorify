import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { Notifications } from '../../../../../dashboard/src/components/spree/notifications'
import { releaseNotes, updateAvailable } from '../../../fixtures/admin/shell'
import { ShellPage, shellParameters, withStoreLayout } from './store-layout'

const meta = {
  title: 'Admin dashboard/Shell/Notifications',
  component: Notifications,
  tags: ['CMP-DA-G-24'],
  // The bell in the rail's foot and what it opens (DA-OVL-03). Spree's only
  // notification is a newer release, which the store's update check reports.
  render: () => <ShellPage />,
  decorators: [withStoreLayout],
  parameters: shellParameters(),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const notesKey = `spree-release-notes:v${updateAvailable.latest_version}`

// The release notes come from GitHub, which a story may not reach, so they are
// stored where the dashboard keeps notes it has already fetched. The dashboard
// also remembers which release was seen; both are forgotten afterwards.
function notesFetched() {
  window.localStorage.setItem(notesKey, releaseNotes)
  return () => {
    window.localStorage.removeItem(notesKey)
    window.localStorage.removeItem('spree-notifications-seen')
  }
}

export const NothingNew: Story = {
  name: 'Nothing new',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications' }))
    await screen.findByText("You're all caught up.")
  },
}

// Closed, the bell carries a dot until the release has been seen.
export const Unread: Story = {
  parameters: shellParameters({ update: updateAvailable }),
  play: async () => {
    await screen.findByRole('button', { name: 'Notifications, 1 unread' })
  },
}

export const NewRelease: Story = {
  name: 'New release',
  beforeEach: notesFetched,
  parameters: shellParameters({ update: updateAvailable }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }))
    await screen.findByRole('heading', { name: 'Highlights' })
  },
}
