import {
  NO_STORE_ACCESS_SLOT,
  type NoStoreAccessSlotContext,
  registerSlot,
  removeSlot,
} from '@spree/dashboard-core'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AuthShell } from '../../../../../dashboard/src/components/spree/auth-shell'
import { NoStoreAccess } from '../../../../../dashboard/src/components/spree/no-store-access'
import { adminUser } from '../../../fixtures/admin/session'

function RequestAccess({ user }: NoStoreAccessSlotContext) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Waiting for your invitation</h1>
        <p className="text-sm text-muted-foreground">
          {user.email} is not on any store's team yet. Your store owner can invite you from Staff.
        </p>
      </div>
      <Button className="w-full">Ask for access</Button>
    </>
  )
}

const meta = {
  title: 'Admin dashboard/Sign-in/No store access',
  component: NoStoreAccess,
  tags: ['CMP-DA-G-24'],
  // A teammate removed from every store (DA-SHELL-01).
  args: { user: { ...adminUser, roles: [], stores: [] }, signOut: async () => {} },
  // Shown inside the sign-in pages' shell, which fills the window.
  parameters: { layout: 'fullscreen', liquorify: { capture: 'viewport' } },
  decorators: [
    (Story) => (
      <AuthShell>
        <Story />
      </AuthShell>
    ),
  ],
} satisfies Meta<typeof NoStoreAccess>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// A plugin registered on the `no_store_access` slot replaces the message.
export const ReplacedByAPlugin: Story = {
  name: 'Replaced by a plugin',
  beforeEach: () => {
    registerSlot(NO_STORE_ACCESS_SLOT, { id: 'request-access', component: RequestAccess })
    return () => removeSlot(NO_STORE_ACCESS_SLOT, 'request-access')
  },
}
