import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  PublishableApiKeyTable,
  SecretApiKeyTable,
} from '../../../../../dashboard/src/components/spree/api-keys/api-key-table'
import { channels, publishableKeys, secretKeys } from '../../../fixtures/admin/api-keys'
import { permissions } from '../../../mocks/handlers/admin/permissions'
import { adminSession } from '../../../mocks/handlers/admin/session'

const channelName = (channelId: string | null) =>
  channels.find((channel) => channel.id === channelId)?.name

const meta = {
  title: 'Admin dashboard/API keys/API key table',
  component: SecretApiKeyTable,
  tags: ['CMP-DA-G-01'],
  args: { keys: secretKeys, loading: false, onEdit: () => {} },
  parameters: {
    liquorify: { signedIn: true, column: 'settings' },
    msw: { handlers: { session: adminSession(), permissions } },
  },
} satisfies Meta<typeof SecretApiKeyTable>

export default meta
type Story = StoryObj<typeof meta>

export const SecretKeys: Story = { name: 'Secret keys' }

export const PublishableKeys: Story = {
  name: 'Publishable keys',
  render: (args) => (
    <PublishableApiKeyTable {...args} keys={publishableKeys} channelName={channelName} />
  ),
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { keys: [] } }

export const ScopesOpen: Story = {
  name: 'Scopes open',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /2/ }))
    await screen.findAllByText('Write orders')
  },
}
