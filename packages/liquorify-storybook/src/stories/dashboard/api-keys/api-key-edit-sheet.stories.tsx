import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { EditApiKeyDialog } from '../../../../../dashboard/src/components/spree/api-keys/api-key-edit-sheet'
import { publishableKeys, secretKeys } from '../../../fixtures/admin/api-keys'
import { adminUser } from '../../../fixtures/admin/session'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { staffPermissions } from '../../../mocks/handlers/admin/staff'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/API keys/Edit sheet',
  component: EditApiKeyDialog,
  tags: ['CMP-DA-G-01'],
  args: { apiKey: secretKeys[0], onOpenChange: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: { handlers: { session: adminSession(), permissions: staffPermissions } },
  },
} satisfies Meta<typeof EditApiKeyDialog>

export default meta
type Story = StoryObj<typeof meta>

// Only the name changes; a secret key's scopes are shown fixed.
export const SecretKey: Story = {
  name: 'Secret key',
  play: async () => {
    await screen.findByDisplayValue(secretKeys[0].name)
    await screen.findByRole('checkbox', { name: 'View Products' })
  },
}

export const Renaming: Story = {
  play: async () => {
    const name = await screen.findByDisplayValue(secretKeys[0].name)
    await userEvent.clear(name)
    await userEvent.type(name, 'Warehouse sync, Europe')
  },
}

export const PublishableKey: Story = {
  name: 'Publishable key',
  args: { apiKey: publishableKeys[0] },
  play: async () => {
    await screen.findByDisplayValue(publishableKeys[0].name)
  },
}

export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await userEvent.clear(await screen.findByDisplayValue(secretKeys[0].name))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Name is required')
  },
}
