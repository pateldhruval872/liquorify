import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'
import { SetupGuideLink } from '../../../../../dashboard/src/components/spree/integrations/setup-guide-link'
import { relayType } from '../../../fixtures/admin/integrations'

const meta = {
  title: 'Admin dashboard/Integrations/Setup guide link',
  component: SetupGuideLink,
  tags: ['CMP-DA-G-10'],
  // In an integration card's footer and its configure sheet's header
  // (DA-SET-10). A missing or non-web address draws nothing.
  args: { url: relayType.docs_url },
} satisfies Meta<typeof SetupGuideLink>

export default meta
type Story = StoryObj<typeof meta>

export const Link: Story = {}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
