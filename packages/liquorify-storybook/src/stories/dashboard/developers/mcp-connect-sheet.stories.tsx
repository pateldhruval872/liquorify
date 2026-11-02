import { queryClient } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { McpConnectSheet } from '../../../../../dashboard/src/components/spree/mcp-connect-sheet'
import { claudeApplication } from '../../../fixtures/admin/oauth'
import { adminUser } from '../../../fixtures/admin/session'
import {
  insecureCallbackRefused,
  oauthApplicationList,
} from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/AI agents/Connect sheet',
  component: McpConnectSheet,
  tags: ['CMP-DA-G-24'],
  // Opened from the AI agents page (DA-SET-07). The store has registered
  // Claude before, so choosing it again reuses that registration. The address
  // shown is the one this page is served from.
  args: { open: true, onOpenChange: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: {
      handlers: {
        session: adminSession(),
        applications: oauthApplicationList([claudeApplication]),
      },
    },
  },
} satisfies Meta<typeof McpConnectSheet>

export default meta
type Story = StoryObj<typeof meta>

const choose = async (name: string | RegExp) => {
  await userEvent.click(await screen.findByRole('radio', { name }))
}
// The sheet reuses a registration only once the store's registrations have
// arrived; Continue pressed before then registers the client again, so it waits
// for them, as a merchant's page has loaded before they choose.
const proceed = async () => {
  await waitFor(() =>
    expect(
      queryClient.getQueryCache().find({ queryKey: ['oauth-applications'], exact: false })?.state
        .data,
    ).toBeDefined(),
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Continue' }))
}
const nextFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

// Continue is disabled while the request runs, so whether the sheet or the
// button keeps a focus ring afterwards depends on timing; nothing is left
// focused, as after a mouse click. When Continue still has focus as the ready
// state replaces it, the sheet takes focus and takes it again a frame later,
// so focus is cleared after that frame and until it stays cleared.
const leaveFocus = () =>
  waitFor(async () => {
    await nextFrames()
    ;(document.activeElement as HTMLElement | null)?.blur()
    await nextFrames()
    expect(document.activeElement).toBe(document.body)
  })

export const ChooseAnAgent: Story = { name: 'Choose an agent' }

// A callback is asked for only once Something else is chosen.
export const SomethingElse: Story = {
  name: 'Something else',
  play: async () => {
    await choose(/Something else/)
    await screen.findByLabelText('Callback URL')
  },
}

export const ClaudeReady: Story = {
  name: 'Claude ready',
  play: async () => {
    await proceed()
    await screen.findByText('Claude is ready to connect')
    await leaveFocus()
  },
}

export const ClaudeCode: Story = {
  name: 'Claude Code',
  play: async () => {
    await proceed()
    await userEvent.click(await screen.findByRole('tab', { name: 'Claude Code' }))
    await screen.findByText('Run this')
  },
}

// ChatGPT has not been registered, so continuing registers it.
export const ChatGptReady: Story = {
  name: 'ChatGPT ready',
  play: async () => {
    await choose(/ChatGPT/)
    await proceed()
    await screen.findByText('ChatGPT is ready to connect')
    await leaveFocus()
  },
}

// Another client has no command to run, so there are no tabs.
export const SomethingElseReady: Story = {
  name: 'Something else ready',
  play: async () => {
    await choose(/Something else/)
    await userEvent.type(await screen.findByLabelText('Name'), 'Inventory assistant')
    await userEvent.type(
      screen.getByLabelText('Callback URL'),
      'https://assistant.example.com/oauth/callback',
    )
    await proceed()
    await screen.findByText('Inventory assistant is ready to connect')
    await leaveFocus()
  },
}

// Spree refuses a callback that is not https, and the sheet shows its reason.
export const CallbackRefused: Story = {
  name: 'Callback refused',
  parameters: {
    msw: {
      handlers: {
        applications: [oauthApplicationList([claudeApplication])[0], ...insecureCallbackRefused],
      },
    },
  },
  play: async () => {
    await choose(/Something else/)
    await userEvent.type(await screen.findByLabelText('Name'), 'Inventory assistant')
    await userEvent.type(
      screen.getByLabelText('Callback URL'),
      'http://assistant.example.com/callback',
    )
    await proceed()
    await screen.findByText(/must start with https/)
    await leaveFocus()
  },
}
