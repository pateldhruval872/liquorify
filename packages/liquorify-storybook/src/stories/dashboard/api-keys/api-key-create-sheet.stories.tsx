import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { CreateApiKeyDialog } from '../../../../../dashboard/src/components/spree/api-keys/api-key-create-sheet'
import { adminUser } from '../../../fixtures/admin/session'
import { channelList } from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { staffPermissions } from '../../../mocks/handlers/admin/staff'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/API keys/Create sheet',
  component: CreateApiKeyDialog,
  tags: ['CMP-DA-G-01'],
  args: { open: true, onOpenChange: nothing, onCreated: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: {
      handlers: { session: adminSession(), permissions: staffPermissions, channels: channelList },
    },
  },
} satisfies Meta<typeof CreateApiKeyDialog>

export default meta
type Story = StoryObj<typeof meta>

// The sheet takes clicks once it has opened, which is when it focuses Name.
const grid = async () => {
  await screen.findByRole('checkbox', { name: 'View Products' })
  await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus())
}

// A new key starts as a secret key, with nothing chosen.
export const SecretKey: Story = {
  name: 'Secret key',
  play: async () => {
    await grid()
  },
}

// Scopes from the top of the list, so the chosen ones are in view.
export const ChosenScopes: Story = {
  name: 'Chosen scopes',
  play: async () => {
    await userEvent.type(screen.getByLabelText('Name'), 'Fulfilment partner')
    await grid()
    await userEvent.click(screen.getByRole('checkbox', { name: 'View Orders' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Manage Orders' }))
  },
}

export const FullAccess: Story = {
  name: 'Full access',
  play: async () => {
    await grid()
    const fullAccess = screen.getByRole('checkbox', { name: /Full access/ })
    await userEvent.click(fullAccess)
    await waitFor(() => expect(fullAccess).toBeChecked())
  },
}

// A publishable key is bound to one channel or left to all of them, and has
// no scopes.
export const PublishableKey: Story = {
  name: 'Publishable key',
  play: async () => {
    await grid()
    await userEvent.click(screen.getByRole('radio', { name: /Publishable key/ }))
    await screen.findByText('All channels')
  },
}

export const NameAndScopeRequired: Story = {
  name: 'Name and scope required',
  play: async () => {
    await grid()
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }))
    await screen.findByText('Name is required')
    await screen.findByText('Pick at least one scope')
  },
}
