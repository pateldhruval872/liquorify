import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { AgentConnectionsCard } from '../../../../../dashboard/src/components/spree/agent-connections-card'
import { claudeApplication, claudeConnections } from '../../../fixtures/admin/oauth'
import { adminUser, readOnly } from '../../../fixtures/admin/session'
import { connectionList, connectionsHeld } from '../../../mocks/handlers/admin/developers'
import { permissions } from '../../../mocks/handlers/admin/permissions'
import { adminSession } from '../../../mocks/handlers/admin/session'

const meta = {
  title: 'Admin dashboard/AI agents/Agent connections card',
  component: AgentConnectionsCard,
  tags: ['CMP-DA-G-24'],
  // One registered agent on the AI agents page (DA-SET-07), and the people
  // connected through it.
  args: { application: claudeApplication },
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, column: 'settings' },
    msw: {
      handlers: {
        session: adminSession(),
        permissions,
        connections: connectionList(claudeConnections),
      },
    },
  },
} satisfies Meta<typeof AgentConnectionsCard>

export default meta
type Story = StoryObj<typeof meta>

const rows = () => screen.findByText(adminUser.full_name ?? adminUser.email)

// A teammate with a name, one known only by their email, and a connection
// whose person is no longer on the staff.
export const Connected: Story = { play: async () => void (await rows()) }

export const NobodyConnected: Story = {
  name: 'Nobody connected',
  parameters: { msw: { handlers: { connections: connectionList([]) } } },
  play: async () => {
    await screen.findByText('Nobody is connected through this agent.')
  },
}

export const Loading: Story = {
  parameters: { msw: { handlers: { connections: connectionsHeld } } },
}

// Revoking needs update on OAuth applications, so a read-only role sees no
// actions.
export const ReadOnly: Story = {
  name: 'Read only',
  parameters: { msw: { handlers: { session: adminSession(readOnly) } } },
  play: async () => void (await rows()),
}

export const RevokeConfirmation: Story = {
  name: 'Revoke confirmation',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await rows()
    await userEvent.click((await screen.findAllByRole('button', { name: 'Open actions' }))[0])
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke access' }))
    await screen.findByRole('dialog', { name: 'Revoke access?' })
  },
}
