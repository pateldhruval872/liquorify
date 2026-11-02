import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { ConfigureIntegrationSheet } from '../../../../../dashboard/src/components/spree/integrations/configure-integration-sheet'
import { relayIntegration, relayType } from '../../../fixtures/admin/integrations'
import { adminUser, readOnly } from '../../../fixtures/admin/session'
import { integrationCheck } from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/Integrations/Configure sheet',
  component: ConfigureIntegrationSheet,
  tags: ['CMP-DA-G-10'],
  // Opened from an integration's card on the integrations page (DA-SET-10).
  args: { type: relayType, open: true, onOpenChange: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: { handlers: { session: adminSession(), check: integrationCheck(true) } },
  },
} satisfies Meta<typeof ConfigureIntegrationSheet>

export default meta
type Story = StoryObj<typeof meta>

const ready = () => screen.findByRole('button', { name: /^(Connect|Save)$/ })

// A new connection starts from the type's defaults, switched off.
export const Connect: Story = { play: async () => void (await ready()) }

// Turning a card's switch on before it is connected opens the sheet ready to
// switch it on when saved.
export const ConnectAndActivate: Story = {
  name: 'Connect and activate',
  args: { defaultActive: true },
  play: async () => void (await ready()),
}

// Connected, with its secret stored and shown masked.
export const Configure: Story = {
  args: { integration: relayIntegration },
  play: async () => void (await ready()),
}

// The button is disabled while the check runs, so whether it still shows a
// focus ring afterwards depends on timing. Each check below ends with nothing
// focused, as after a mouse click.
const leaveFocus = () => (document.activeElement as HTMLElement | null)?.blur()

export const ConnectionChecked: Story = {
  name: 'Connection checked',
  args: { integration: relayIntegration },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Test connection' }))
    await screen.findByText('Connection successful.')
    leaveFocus()
  },
}

export const ConnectionFailed: Story = {
  name: 'Connection failed',
  args: { integration: relayIntegration },
  parameters: { msw: { handlers: { check: integrationCheck(false) } } },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Test connection' }))
    await screen.findByRole('alert')
    leaveFocus()
  },
}

export const DisconnectConfirmation: Story = {
  name: 'Disconnect confirmation',
  args: { integration: relayIntegration },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Disconnect' }))
    await screen.findByRole('dialog', { name: 'Disconnect integration' })
  },
}

// A role that may read integrations but not change them: the settings show,
// and the save and disconnect buttons do not.
export const ReadOnly: Story = {
  name: 'Read only',
  args: { integration: relayIntegration },
  parameters: { msw: { handlers: { session: adminSession(readOnly) } } },
  play: async () => {
    await screen.findByRole('button', { name: 'Cancel' })
  },
}
