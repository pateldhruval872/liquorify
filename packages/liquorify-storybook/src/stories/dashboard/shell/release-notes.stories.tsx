import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReleaseNotes } from '../../../../../dashboard/src/components/spree/release-notes'
import { releaseNotes } from '../../../fixtures/admin/shell'

const meta = {
  title: 'Admin dashboard/Shell/Release notes',
  component: ReleaseNotes,
  tags: ['CMP-DA-G-24'],
  // A release's notes as GitHub returns them, in Markdown, set in the
  // notifications dialog's column (DA-OVL-03).
  args: { markdown: releaseNotes },
  decorators: [
    (Story) => (
      <div className="w-[38rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReleaseNotes>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
