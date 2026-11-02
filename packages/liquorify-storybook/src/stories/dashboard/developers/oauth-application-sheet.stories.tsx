import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { OauthApplicationSheet } from '../../../../../dashboard/src/components/spree/oauth-application-sheet'
import { customApplication } from '../../../fixtures/admin/oauth'
import { adminUser } from '../../../fixtures/admin/session'
import {
  insecureCallbackRefused,
  oauthApplicationList,
} from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/OAuth clients/Client sheet',
  component: OauthApplicationSheet,
  tags: ['CMP-DA-G-24'],
  // Opened from the OAuth clients page (DA-SET-27) to register a client.
  args: { open: true, onOpenChange: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: { handlers: { session: adminSession(), applications: oauthApplicationList() } },
  },
} satisfies Meta<typeof OauthApplicationSheet>

export default meta
type Story = StoryObj<typeof meta>

const fill = async (name: string, callback: string) => {
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.type(screen.getByLabelText('Callback URL'), callback)
}

export const Register: Story = {}

// Both fields are needed; the form marks them without a message of its own.
export const Required: Story = {
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Callback URL')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}

// Spree refuses a callback that is not https, in its own words.
export const CallbackRefused: Story = {
  name: 'Callback refused',
  parameters: { msw: { handlers: { applications: insecureCallbackRefused } } },
  play: async () => {
    await fill('Inventory assistant', 'http://assistant.example.com/callback')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findAllByText(/must start with https/)
    // Save is disabled while the request runs, so whether it keeps a focus
    // ring afterwards depends on timing; nothing is left focused, as after a
    // mouse click.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Edit: Story = {
  args: { application: customApplication },
  play: async () => {
    await screen.findByDisplayValue(customApplication.name)
  },
}
